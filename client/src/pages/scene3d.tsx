import { Suspense, useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Proof: real 3D unlocks the full shot library. A procedural house/roof + PPE workers, with a
// scroll-driven camera doing EWS(bird's-eye) → orbit → MS(frontal) → MCU(close) — angle changes
// impossible with a flat image. Voice: Portal-Sigma light.

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function makeShingle() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8A938C";
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#717a74";
  for (let y = 0; y < 64; y += 8) for (let x = ((y / 8) % 2) * 8; x < 64; x += 16) g.fillRect(x, y, 14, 7);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 4);
  t.anisotropy = 8;
  return t;
}

function House() {
  const shingle = useMemo(() => makeShingle(), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#C7BBA1" />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 2.6, 7]} />
        <meshStandardMaterial color="#EFE7D8" />
      </mesh>
      {/* gable roof — two slopes meeting at the ridge */}
      <group position={[0, 2.6, 0]}>
        <mesh position={[-1.55, 0.78, 0]} rotation={[0, 0, Math.PI * 0.3]} castShadow>
          <boxGeometry args={[3.7, 0.14, 7.4]} />
          <meshStandardMaterial map={shingle} color="#9aa39c" roughness={0.85} />
        </mesh>
        <mesh position={[1.55, 0.78, 0]} rotation={[0, 0, -Math.PI * 0.3]} castShadow>
          <boxGeometry args={[3.7, 0.14, 7.4]} />
          <meshStandardMaterial map={shingle} color="#9aa39c" roughness={0.85} />
        </mesh>
      </group>
      <mesh position={[1.7, 4.0, -1.9]} castShadow>
        <boxGeometry args={[0.7, 1.5, 0.7]} />
        <meshStandardMaterial color="#B0705A" />
      </mesh>
      {/* PPE workers (hard hat + vest) on the slope */}
      {([[-0.7, 3.55, 1.6], [0.9, 3.35, -0.6], [-1.4, 3.95, -1.7]] as const).map((p, i) => (
        <group key={i} position={[p[0], p[1], p[2]]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.7, 0.32]} />
            <meshStandardMaterial color="#E0743B" />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[0.36, 0.24, 0.36]} />
            <meshStandardMaterial color="#E3A52B" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const KF = [
  { p: 0.0, pos: [0, 16, 0.01] }, // EWS bird's-eye
  { p: 0.34, pos: [12, 8.5, 11] }, // orbit / descending 3/4
  { p: 0.64, pos: [0, 4.6, 13] }, // MS frontal
  { p: 1.0, pos: [0.5, 3.4, 6.6] }, // MCU close
] as const;

function CameraRig({ progress }: { progress: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 2.5, 0), []);
  useFrame(() => {
    const p = clamp01(progress.current);
    let a = KF[0] as { p: number; pos: readonly number[] };
    let b = KF[KF.length - 1] as { p: number; pos: readonly number[] };
    for (let i = 0; i < KF.length - 1; i++) {
      if (p >= KF[i].p && p <= KF[i + 1].p) {
        a = KF[i];
        b = KF[i + 1];
        break;
      }
    }
    const t = easeInOut((p - a.p) / (b.p - a.p || 1));
    camera.position.set(lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t));
    camera.lookAt(target);
  });
  return null;
}

export default function Scene3D() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: ".s3d", start: "top top", end: "bottom bottom", pin: ".s3d-stage", scrub: true, onUpdate: (self) => (progress.current = self.progress) });
      const fade = (sel: string, a: number, b: number) => {
        gsap.fromTo(sel, { opacity: 0 }, { opacity: 1, scrollTrigger: { trigger: ".s3d", start: `${a}% top`, end: `${a + 5}% top`, scrub: true } });
        gsap.to(sel, { opacity: 0, scrollTrigger: { trigger: ".s3d", start: `${b}% top`, end: `${b + 5}% top`, scrub: true } });
      };
      fade(".f-ews", 3, 28);
      fade(".f-orbit", 32, 55);
      fade(".f-ms", 58, 80);
      gsap.fromTo(".f-mcu", { opacity: 0 }, { opacity: 1, scrollTrigger: { trigger: ".s3d", start: "84% top", end: "90% top", scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#F5F0EA] text-[#2C2A28]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#2C2A28]/55 transition-colors hover:text-[#2C2A28]">← Back</Link>

      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#C4897A]">The Big Gun — Real 3D · Any Angle</p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">Around the roof.</h1>
        <p style={MONO} className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#2C2A28]/45">bird's-eye → orbit → frontal → close · scroll ↓</p>
      </section>

      <section className="s3d relative h-[500vh]">
        <div className="s3d-stage sticky top-0 h-screen overflow-hidden">
          <Canvas shadows camera={{ position: [0, 16, 0.01], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
            <color attach="background" args={["#EAE2D2"]} />
            <ambientLight intensity={0.55} />
            <directionalLight position={[8, 14, 6]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
            <Suspense fallback={null}>
              <Environment resolution={256}>
                <Lightformer intensity={2.4} position={[0, 8, 4]} scale={[12, 12, 1]} color="#ffffff" />
                <Lightformer intensity={1.3} position={[6, 2, 6]} scale={[8, 8, 1]} color="#F1E7D6" />
              </Environment>
              <House />
              <CameraRig progress={progress} />
            </Suspense>
            <ContactShadows position={[0, 0.01, 0]} opacity={0.4} blur={2.2} scale={40} color="#2C2A28" />
          </Canvas>

          <div className="pointer-events-none absolute bottom-8 left-0 right-0 flex justify-center">
            <p style={MONO} className="relative text-[11px] uppercase tracking-[0.4em] text-[#2C2A28]/70">
              <span className="f-ews absolute inset-0 whitespace-nowrap text-center">// EWS · bird's-eye</span>
              <span className="f-orbit absolute inset-0 whitespace-nowrap text-center opacity-0">// orbit · 3/4</span>
              <span className="f-ms absolute inset-0 whitespace-nowrap text-center opacity-0">// MS · frontal</span>
              <span className="f-mcu whitespace-nowrap text-center opacity-0">// MCU · close</span>
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center" style={{ background: "#E8D8C4" }}>
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">Geometry, not a picture.</h2>
        <p style={MONO} className="max-w-lg text-[11px] uppercase leading-relaxed tracking-[0.25em] text-[#2C2A28]/45">real 3D · the whole shot library unlocks · roofs are geometric, so procedural works</p>
      </section>
    </div>
  );
}
