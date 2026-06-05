import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows, Outlines, Grid, Html } from "@react-three/drei";
import { EffectComposer, Pixelation, Bloom, BrightnessContrast, Vignette, Noise } from "@react-three/postprocessing";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { buildCrestridge } from "@/lib/tr3/solver2";

gsap.registerPlugin(ScrollTrigger);

// CRESTRIDGE reconstruction — STAGE 1: p1 only (central hip, I diminished). +X=east, +Z=north.
const CROSS = buildCrestridge();

// SKIN SWITCHER — one scene (geometry × camera arc), N skins. Proves the render is a separable
// layer: a declarative descriptor { material, palette, post-FX, lighting, props } peels off the
// geometry. "Describe → skin" made concrete. Same roof, six voices.

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---- shared textures (built once) -------------------------------------------------------------
function makeShingle() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  g.fillStyle = "#cfcfcf";
  g.fillRect(0, 0, 32, 32);
  g.fillStyle = "#9c9c9c";
  for (let y = 0; y < 32; y += 8) for (let x = ((y / 8) % 2) * 8; x < 32; x += 16) g.fillRect(x, y, 12, 6);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 1); // solver bakes tile density into UVs (world units / tile)
  return t;
}
function makeToonGrad() {
  const steps = new Uint8Array([90, 90, 98, 255, 150, 150, 160, 255, 226, 226, 232, 255]);
  const t = new THREE.DataTexture(steps, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}
function makeClayMatcap() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#3c2318";
  g.fillRect(0, 0, 256, 256);
  const rad = g.createRadialGradient(92, 80, 18, 128, 128, 152);
  rad.addColorStop(0, "#f3d2ab");
  rad.addColorStop(0.42, "#c47a4e");
  rad.addColorStop(0.82, "#7c4a2f");
  rad.addColorStop(1, "#3c2318");
  g.fillStyle = rad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
const SHINGLE = makeShingle();
const TOON_GRAD = makeToonGrad();
const CLAY = makeClayMatcap();

// ---- skin descriptors -------------------------------------------------------------------------
type Skin = {
  id: string;
  label: string;
  blurb: string;
  bg: string;
  pal: Record<string, string>;
  material: "standard" | "lambert" | "toon" | "matcap" | "wire";
  env: "lf" | "none";
  lights: "studio" | "hemi" | "cel" | "clay" | "noir" | "none";
  ground: "plane" | "overworld" | "grid";
  contact: { o: number; c: string } | null;
  props: boolean;
  outline: string | null;
  tone: "aces" | "none";
  fog?: { c: string; n: number; f: number };
};

const SKINS: Skin[] = [
  { id: "editorial", label: "Editorial", blurb: "warm PBR · soft shadows · refined (Portal-Sigma)", bg: "#EAE2D2", pal: { ground: "#C7BBA1", wall: "#EFE7D8", roof: "#9aa39c", chimney: "#B0705A", vest: "#C08A5A", hat: "#D8B24A" }, material: "standard", env: "lf", lights: "studio", ground: "plane", contact: { o: 0.4, c: "#2C2A28" }, props: false, outline: null, tone: "aces" },
  { id: "nes", label: "NES · Zelda", blurb: "pixelation + flat-shade overworld", bg: "#97CDEC", pal: { ground: "#5FAE3A", wall: "#D8C084", roof: "#9A6630", chimney: "#A8492F", vest: "#E2701C", hat: "#ECC230", leaf: "#3E8F2C", trunk: "#6B4622", path: "#CDA86A" }, material: "lambert", env: "none", lights: "hemi", ground: "overworld", contact: null, props: true, outline: null, tone: "none" },
  { id: "cel", label: "Cel-shade", blurb: "toon bands + ink outline (Wind-Waker)", bg: "#BFE8F2", pal: { ground: "#7FC242", wall: "#F2E4C2", roof: "#C77B3E", chimney: "#B5503C", vest: "#E26D3A", hat: "#F0C53C" }, material: "toon", env: "none", lights: "cel", ground: "plane", contact: { o: 0.26, c: "#2a2320" }, props: false, outline: "#241d18", tone: "none" },
  { id: "clay", label: "Clay", blurb: "matcap terracotta · sculpted, tactile", bg: "#EFE7DA", pal: { ground: "#cdb89a", wall: "#e8d9c8", roof: "#c98a5a", chimney: "#b5664a", vest: "#d98a5a", hat: "#eccf9a" }, material: "matcap", env: "none", lights: "clay", ground: "plane", contact: { o: 0.5, c: "#6b4a2f" }, props: false, outline: null, tone: "none" },
  { id: "blueprint", label: "Blueprint", blurb: "wireframe + glow grid · technical CAD", bg: "#08172B", pal: { ground: "#08172B", wall: "#6FE3FF", roof: "#6FE3FF", chimney: "#6FE3FF", vest: "#6FE3FF", hat: "#6FE3FF", line: "#6FE3FF" }, material: "wire", env: "none", lights: "none", ground: "grid", contact: null, props: false, outline: null, tone: "none" },
  { id: "noir", label: "Noir", blurb: "hard key · deep shadow · grain + vignette", bg: "#0F0F12", pal: { ground: "#26262a", wall: "#cfcfd4", roof: "#74747a", chimney: "#48484e", vest: "#9a9aa0", hat: "#d6d6da" }, material: "standard", env: "none", lights: "noir", ground: "plane", contact: { o: 0.7, c: "#000000" }, props: false, outline: null, tone: "none", fog: { c: "#0F0F12", n: 14, f: 34 } },
];

// ---- material layer (the skin, applied to any mesh) -------------------------------------------
function Surface({ skin, color, map, double, flat }: { skin: Skin; color: string; map?: THREE.Texture; double?: boolean; flat?: boolean }) {
  const side = double ? THREE.DoubleSide : THREE.FrontSide;
  switch (skin.material) {
    case "toon":
      return <meshToonMaterial color={color} map={map} gradientMap={TOON_GRAD} side={side} />;
    case "matcap":
      return <meshMatcapMaterial color={color} map={map} matcap={CLAY} side={side} flatShading={flat ?? false} />;
    case "wire":
      return <meshBasicMaterial color={skin.pal.line} wireframe side={side} />;
    case "lambert":
      return <meshLambertMaterial color={color} map={map} flatShading side={side} />;
    default:
      return <meshStandardMaterial color={color} map={map} roughness={0.82} metalness={0.02} side={side} flatShading={flat ?? false} />;
  }
}

function Brick({ args, position, rotation, color, map, skin }: { args: [number, number, number]; position: [number, number, number]; rotation?: [number, number, number]; color: string; map?: THREE.Texture; skin: Skin }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <Surface skin={skin} color={color} map={map} />
      {skin.outline && <Outlines thickness={0.035} color={skin.outline} />}
    </mesh>
  );
}

function GablePrim({ skin, plan }: { skin: Skin; plan: boolean }) {
  const p = skin.pal;
  if (plan)
    // mirror X so the north-up top-down reads east-right / west-left like the EagleView plan
    return (
      <group scale={[-1, 1, 1]}>
        <mesh geometry={CROSS.walls}>
          <meshStandardMaterial color="#d6cfbf" roughness={0.98} metalness={0} side={THREE.DoubleSide} flatShading />
        </mesh>
        <mesh geometry={CROSS.roof}>
          <meshStandardMaterial color="#efeadf" roughness={0.92} metalness={0} side={THREE.DoubleSide} flatShading />
        </mesh>
        {CROSS.labels.map((l, i) => (
          <Html key={i} position={l.pos} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div style={{ color: "#1d1d1d", font: "700 15px 'JetBrains Mono', monospace", textShadow: "0 0 4px #fff, 0 0 4px #fff, 0 0 4px #fff" }}>{l.id}</div>
          </Html>
        ))}
      </group>
    );
  return (
    <group>
      <mesh geometry={CROSS.walls} castShadow receiveShadow>
        <Surface skin={skin} color={p.wall} double />
        {skin.outline && <Outlines thickness={0.035} color={skin.outline} />}
      </mesh>
      <mesh geometry={CROSS.roof} castShadow receiveShadow>
        <Surface skin={skin} color={p.roof} map={SHINGLE} double flat />
        {skin.outline && <Outlines thickness={0.035} color={skin.outline} />}
      </mesh>
    </group>
  );
}

function Ground({ skin }: { skin: Skin }) {
  if (skin.ground === "grid")
    return <Grid args={[60, 60]} cellSize={1} cellThickness={0.6} cellColor="#1d5e7a" sectionSize={5} sectionThickness={1} sectionColor={skin.pal.line} fadeDistance={55} fadeStrength={1.4} infiniteGrid position={[0, 0, 0]} />;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <Surface skin={skin} color={skin.pal.ground} />
      </mesh>
      {skin.ground === "overworld" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 9]}>
          <planeGeometry args={[3, 16]} />
          <meshLambertMaterial color={skin.pal.path} />
        </mesh>
      )}
    </group>
  );
}

function Props({ skin }: { skin: Skin }) {
  const p = skin.pal;
  return (
    <group>
      {([[7, 0.4, 5], [-8, 0.4, 4], [6, 0.4, -6], [-6, 0.4, -7], [9, 0.4, -2]] as const).map((b, i) => (
        <Brick key={i} args={[1.1, 0.9, 1.1]} position={[b[0], b[1], b[2]]} color={p.leaf} skin={skin} />
      ))}
      <group position={[-9, 0, -4]}>
        <Brick args={[0.7, 2.2, 0.7]} position={[0, 1.1, 0]} color={p.trunk} skin={skin} />
        <Brick args={[3, 2.4, 3]} position={[0, 3, 0]} color={p.leaf} skin={skin} />
      </group>
      <Brick args={[1.4, 1.0, 1.2]} position={[8, 0.5, 7]} color={skin.pal.wall} skin={skin} />
    </group>
  );
}

function Lights({ skin }: { skin: Skin }) {
  switch (skin.lights) {
    case "studio":
      return (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight position={[8, 14, 6]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        </>
      );
    case "hemi":
      return (
        <>
          <hemisphereLight args={["#cfeaff", "#4f7a35", 0.75]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[8, 16, 5]} intensity={1.0} />
        </>
      );
    case "cel":
      return (
        <>
          <ambientLight intensity={0.85} />
          <directionalLight position={[6, 12, 7]} intensity={0.65} />
        </>
      );
    case "clay":
      return <ambientLight intensity={0.6} />;
    case "noir":
      return (
        <>
          <ambientLight intensity={0.08} />
          <directionalLight position={[7, 9, 3]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />
        </>
      );
    default:
      return null;
  }
}

function EnvRig({ skin }: { skin: Skin }) {
  if (skin.env !== "lf") return null;
  return (
    <Environment resolution={256}>
      <Lightformer intensity={2.2} position={[0, 8, 4]} scale={[12, 12, 1]} color="#ffffff" />
      <Lightformer intensity={1.2} position={[6, 2, 6]} scale={[8, 8, 1]} color="#F1E7D6" />
    </Environment>
  );
}

function Post({ skin }: { skin: Skin }) {
  if (skin.id === "nes")
    return (
      <EffectComposer key="nes">
        <Pixelation granularity={6} />
      </EffectComposer>
    );
  if (skin.id === "blueprint")
    return (
      <EffectComposer key="bp">
        <Bloom intensity={0.7} luminanceThreshold={0.15} mipmapBlur />
      </EffectComposer>
    );
  if (skin.id === "noir")
    return (
      <EffectComposer key="noir">
        <BrightnessContrast brightness={-0.04} contrast={0.26} />
        <Vignette darkness={0.92} offset={0.28} />
        <Noise opacity={0.22} premultiply />
      </EffectComposer>
    );
  return null;
}

function ToneMap({ mode }: { mode: "aces" | "none" }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    gl.toneMapping = mode === "aces" ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => (x.needsUpdate = true));
    });
  }, [mode, gl, scene]);
  return null;
}

const KF = [
  { p: 0.0, pos: [0.001, 78, 6.02] }, // straight top-down (compare to the plan diagram)
  { p: 0.34, pos: [34, 28, 46] }, // iso from NE (p2 north wing + p1)
  { p: 0.64, pos: [0, 18, -46] }, // from the south (−Z): the diminished I end
  { p: 1.0, pos: [30, 22, 40] }, // 3/4 close on the p1↔p2 meld (north)
] as const;

function CameraRig({ progress, plan }: { progress: React.MutableRefObject<number>; plan: boolean }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 5, 6), []);
  const planTarget = useMemo(() => new THREE.Vector3(4, 0, -2), []);
  useFrame(() => {
    if (plan) {
      // fixed NORTH-UP top-down: +Z (building north) → screen up, +X (east) → screen right
      camera.up.set(0, 0, 1);
      camera.position.set(4, 124, -2);
      camera.lookAt(planTarget);
      return;
    }
    camera.up.set(0, 1, 0);
    const p = clamp01(progress.current);
    let a = KF[0] as { p: number; pos: readonly number[] };
    let b = KF[KF.length - 1] as { p: number; pos: readonly number[] };
    for (let i = 0; i < KF.length - 1; i++) if (p >= KF[i].p && p <= KF[i + 1].p) ((a = KF[i]), (b = KF[i + 1]));
    const t = easeInOut((p - a.p) / (b.p - a.p || 1));
    camera.position.set(lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t));
    camera.lookAt(target);
  });
  return null;
}

export default function Skins() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [skinId, setSkinId] = useState("editorial");
  const [plan, setPlan] = useState(true); // PLAN = flat labeled facets + compass, north-up top-down (verification)
  const skin = SKINS.find((s) => s.id === skinId)!;

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: ".sk", start: "top top", end: "bottom bottom", pin: ".sk-stage", scrub: true, onUpdate: (self) => (progress.current = self.progress) });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#15171c] text-[#EDE9DF]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#EDE9DF]/55 transition-colors hover:text-[#EDE9DF]">← Back</Link>

      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#C4897A]">Skin Switcher — One Scene, Any Voice</p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">Same roof. Six skins.</h1>
        <p style={MONO} className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#EDE9DF]/45">scroll = camera · click = skin ↓</p>
      </section>

      <section className="sk relative h-[520vh]">
        <div className="sk-stage sticky top-0 h-screen overflow-hidden" style={{ background: skin.bg, transition: "background 240ms ease" }}>
          <Canvas shadows camera={{ position: [0, 16, 0.01], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
            <color attach="background" args={[plan ? "#f5f2ec" : skin.bg]} />
            {!plan && skin.fog && <fog attach="fog" args={[skin.fog.c, skin.fog.n, skin.fog.f]} />}
            <ToneMap mode={plan ? "none" : skin.tone} />
            {plan && <ambientLight intensity={0.65} />}
            {plan && <directionalLight position={[8, 20, 10]} intensity={1.15} />}
            <Suspense fallback={null}>
              <group key={skin.id + String(plan)}>
                {!plan && <Lights skin={skin} />}
                {!plan && <EnvRig skin={skin} />}
                {!plan && <Ground skin={skin} />}
                <GablePrim skin={skin} plan={plan} />
                {!plan && skin.props && <Props skin={skin} />}
              </group>
            </Suspense>
            {!plan && skin.contact && <ContactShadows position={[0, 0.01, 0]} opacity={skin.contact.o} blur={2.4} scale={42} color={skin.contact.c} />}
            <CameraRig progress={progress} plan={plan} />
            {!plan && <Post skin={skin} />}
          </Canvas>

          {/* compass (PLAN mode) — oriented like the EagleView diagram: N up-and-right (~30° CW) */}
          {plan && (
            <div className="pointer-events-none absolute bottom-10 right-12 z-40">
              <svg width="104" height="104" viewBox="-52 -52 104 104">
                <circle cx="0" cy="0" r="46" fill="none" stroke="#1d1d1d" strokeOpacity="0.25" />
                <g transform="rotate(30)">
                  <line x1="0" y1="42" x2="0" y2="-42" stroke="#1d1d1d" strokeWidth="1.4" />
                  <line x1="-42" y1="0" x2="42" y2="0" stroke="#1d1d1d" strokeWidth="1" strokeOpacity="0.45" />
                  <polygon points="0,-46 -5.5,-33 5.5,-33" fill="#1d1d1d" />
                </g>
                <text x="22" y="-34" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1d1d1d">N</text>
                <text x="37" y="25" textAnchor="middle" fontSize="11" fill="#1d1d1d">E</text>
                <text x="-20" y="40" textAnchor="middle" fontSize="11" fill="#1d1d1d">S</text>
                <text x="-37" y="-18" textAnchor="middle" fontSize="11" fill="#1d1d1d">W</text>
              </svg>
            </div>
          )}

          {/* switcher */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center gap-3 px-4 pt-6">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-white/15 bg-black/35 p-1.5 backdrop-blur-md">
              {SKINS.map((s) => {
                const active = s.id === skinId;
                return (
                  <button
                    key={s.id}
                    data-skin={s.id}
                    onClick={() => setSkinId(s.id)}
                    style={MONO}
                    className={`rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] transition-colors ${active ? "bg-[#EDE9DF] text-[#15171c]" : "text-[#EDE9DF]/65 hover:text-[#EDE9DF]"}`}
                  >
                    {s.label}
                  </button>
                );
              })}
              <button
                onClick={() => setPlan((v) => !v)}
                style={MONO}
                className={`rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.18em] transition-colors ${plan ? "bg-[#C4897A] text-[#15171c]" : "text-[#EDE9DF]/65 hover:text-[#EDE9DF]"}`}
              >
                Plan
              </button>
            </div>
            <p style={MONO} className="rounded-sm bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#EDE9DF]/70 backdrop-blur-sm">
              {skin.material} · {skin.id === "nes" || skin.id === "blueprint" || skin.id === "noir" ? "+post" : "no post"} · {skin.blurb}
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">The render is a layer.</h2>
        <p style={MONO} className="max-w-xl text-[11px] uppercase leading-relaxed tracking-[0.22em] text-[#EDE9DF]/45">geometry × camera = the scene · material × palette × post × light = the skin · describe the skin, swap it live</p>
      </section>
    </div>
  );
}
