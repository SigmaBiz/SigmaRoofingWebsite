import { Suspense, useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Pixelation } from "@react-three/postprocessing";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Aesthetic test: the SAME 3D roof scene + camera arc, re-skinned NES / Legend of Zelda —
// pixelation post-process + flat shading + bright limited palette + overworld props. Creative
// direction unlocked: real 3D can wear any voice.

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const PAL = {
  grass: "#5FAE3A",
  roof: "#9A6630",
  wall: "#D8C084",
  chimney: "#A8492F",
  vest: "#E2701C",
  hat: "#ECC230",
  leaf: "#3E8F2C",
  trunk: "#6B4622",
  rock: "#8B9088",
  path: "#CDA86A",
};

function Box({ args, position, rotation, color }: { args: [number, number, number]; position: [number, number, number]; rotation?: [number, number, number]; color: string }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  );
}

function World() {
  const shingle = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 32;
    c.height = 32;
    const g = c.getContext("2d")!;
    g.fillStyle = PAL.roof;
    g.fillRect(0, 0, 32, 32);
    g.fillStyle = "#7d5126";
    for (let y = 0; y < 32; y += 8) for (let x = ((y / 8) % 2) * 8; x < 32; x += 16) g.fillRect(x, y, 12, 6);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 3);
    return t;
  }, []);

  return (
    <group>
      {/* grass + a path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshLambertMaterial color={PAL.grass} flatShading />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 9]}>
        <planeGeometry args={[3, 16]} />
        <meshLambertMaterial color={PAL.path} />
      </mesh>

      {/* house */}
      <Box args={[6, 2.6, 7]} position={[0, 1.3, 0]} color={PAL.wall} />
      <group position={[0, 2.6, 0]}>
        <mesh position={[-1.55, 0.78, 0]} rotation={[0, 0, Math.PI * 0.3]} castShadow>
          <boxGeometry args={[3.7, 0.18, 7.4]} />
          <meshLambertMaterial map={shingle} color="#ffffff" flatShading />
        </mesh>
        <mesh position={[1.55, 0.78, 0]} rotation={[0, 0, -Math.PI * 0.3]} castShadow>
          <boxGeometry args={[3.7, 0.18, 7.4]} />
          <meshLambertMaterial map={shingle} color="#ffffff" flatShading />
        </mesh>
      </group>
      <Box args={[0.7, 1.5, 0.7]} position={[1.7, 4.0, -1.9]} color={PAL.chimney} />

      {/* PPE workers */}
      {([[-0.7, 3.55, 1.6], [0.9, 3.35, -0.6], [-1.4, 3.95, -1.7]] as const).map((p, i) => (
        <group key={i} position={[p[0], p[1], p[2]]}>
          <Box args={[0.42, 0.7, 0.32]} position={[0, 0, 0]} color={PAL.vest} />
          <Box args={[0.4, 0.26, 0.4]} position={[0, 0.5, 0]} color={PAL.hat} />
        </group>
      ))}

      {/* overworld props: bushes, a tree, rocks */}
      {([[7, 0.4, 5], [-8, 0.4, 4], [6, 0.4, -6], [-6, 0.4, -7], [9, 0.4, -2]] as const).map((p, i) => (
        <Box key={i} args={[1.1, 0.9, 1.1]} position={[p[0], p[1], p[2]]} color={PAL.leaf} />
      ))}
      <group position={[-9, 0, -4]}>
        <Box args={[0.7, 2.2, 0.7]} position={[0, 1.1, 0]} color={PAL.trunk} />
        <Box args={[3, 2.4, 3]} position={[0, 3, 0]} color={PAL.leaf} />
      </group>
      <Box args={[1.4, 1.0, 1.2]} position={[8, 0.5, 7]} color={PAL.rock} />
      <Box args={[1.0, 0.8, 1.0]} position={[-7, 0.4, 8]} color={PAL.rock} />
    </group>
  );
}

const KF = [
  { p: 0.0, pos: [0, 16, 0.01] },
  { p: 0.34, pos: [12, 8.5, 11] },
  { p: 0.64, pos: [0, 4.6, 13] },
  { p: 1.0, pos: [0.5, 3.4, 6.6] },
] as const;

function CameraRig({ progress }: { progress: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 2.5, 0), []);
  useFrame(() => {
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

export default function Zelda() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: ".z", start: "top top", end: "bottom bottom", pin: ".z-stage", scrub: true, onUpdate: (self) => (progress.current = self.progress) });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#1d1f24] text-[#EDE9DF]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#EDE9DF]/60 transition-colors hover:text-[#EDE9DF]">← Back</Link>

      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#E2701C]">Aesthetic Test — Same 3D, New Voice</p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">8-bit roof.</h1>
        <p style={MONO} className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#EDE9DF]/45">NES · Zelda flavor · scroll ↓</p>
      </section>

      <section className="z relative h-[480vh]">
        <div className="z-stage sticky top-0 h-screen overflow-hidden">
          <Canvas camera={{ position: [0, 16, 0.01], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}>
            <color attach="background" args={["#97CDEC"]} />
            <hemisphereLight args={["#cfeaff", "#4f7a35", 0.75]} />
            <ambientLight intensity={0.55} />
            <directionalLight position={[8, 16, 5]} intensity={1.0} />
            <Suspense fallback={null}>
              <World />
              <CameraRig progress={progress} />
            </Suspense>
            <EffectComposer>
              <Pixelation granularity={6} />
            </EffectComposer>
          </Canvas>
          <div className="pointer-events-none absolute bottom-8 left-0 right-0 flex justify-center">
            <p style={MONO} className="rounded-sm border border-[#EDE9DF]/20 bg-black/30 px-4 py-1.5 text-[10px] uppercase tracking-[0.35em] text-[#EDE9DF]/70 backdrop-blur-sm">
              // render · pixelation + flat-shade + zelda palette
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center" style={{ background: "#5FAE3A", color: "#1d1f24" }}>
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">One scene. Any voice.</h2>
        <p style={MONO} className="max-w-lg text-[11px] uppercase leading-relaxed tracking-[0.25em] text-[#1d1f24]/55">same geometry + camera · the render wears the aesthetic · creative direction unlocked</p>
      </section>
    </div>
  );
}
