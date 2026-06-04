import { Suspense, useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// rrMVP: Apple-style pin-and-scrub, the "product" is a real 52-card deck performing ONE flourish:
// THE FAN. Each card is a rigid body pivoting about a shared bottom-center point; the spread angle
// is distributed evenly across the deck, with a subtle edge cup (the flex). Editorial / Venus Blush.

const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const SUITS = [
  { s: "♠", red: false }, // spade
  { s: "♥", red: true }, // heart
  { s: "♣", red: false }, // club
  { s: "♦", red: true }, // diamond
];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function roundRectPath(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function makeFace(rank: string, suit: string, red: boolean) {
  const w = 256;
  const h = 358;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#FBF8F2";
  roundRectPath(g, 0, 0, w, h, 24);
  g.fill();
  const col = red ? "#B5483B" : "#2C2A28";
  g.fillStyle = col;
  g.textAlign = "center";
  g.textBaseline = "middle";
  // top-left index
  g.font = "bold 44px Georgia";
  g.fillText(rank, 32, 42);
  g.font = "32px Georgia";
  g.fillText(suit, 32, 80);
  // bottom-right index (rotated)
  g.save();
  g.translate(w - 32, h - 42);
  g.rotate(Math.PI);
  g.font = "bold 44px Georgia";
  g.fillText(rank, 0, 0);
  g.font = "32px Georgia";
  g.fillText(suit, 0, 38);
  g.restore();
  // center suit
  g.font = "150px Georgia";
  g.fillText(suit, w / 2, h / 2 + 6);
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  return tex;
}

function makeBack() {
  const w = 256;
  const h = 358;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#FBF8F2";
  roundRectPath(g, 0, 0, w, h, 24);
  g.fill();
  g.fillStyle = "#C4897A";
  roundRectPath(g, 16, 16, w - 32, h - 32, 16);
  g.fill();
  g.fillStyle = "#FBF8F2";
  roundRectPath(g, 26, 26, w - 52, h - 52, 12);
  g.fill();
  // diagonal lattice
  g.save();
  roundRectPath(g, 26, 26, w - 52, h - 52, 12);
  g.clip();
  g.strokeStyle = "rgba(196,137,122,0.55)";
  g.lineWidth = 2;
  for (let i = -h; i < w; i += 17) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + h, h);
    g.stroke();
    g.beginPath();
    g.moveTo(i, h);
    g.lineTo(i + h, 0);
    g.stroke();
  }
  g.restore();
  // center Sigma chevrons
  const cx = w / 2;
  const cy = h / 2;
  g.fillStyle = "#FBF8F2";
  g.beginPath();
  g.arc(cx, cy, 46, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#2C2A28";
  g.lineWidth = 9;
  g.lineJoin = "round";
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(cx - 30, cy - 2);
  g.lineTo(cx, cy - 26);
  g.lineTo(cx + 30, cy - 2);
  g.stroke();
  g.beginPath();
  g.moveTo(cx - 30, cy + 24);
  g.lineTo(cx, cy);
  g.lineTo(cx + 30, cy + 24);
  g.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  return tex;
}

const CARD_W = 1.3;
const CARD_H = 1.9;
const HALF = CARD_H / 2;
const PIVOT_Y = -2.3;
const SPREAD = 3.5; // radians, full fan
const N = 52;

function Deck({ progress }: { progress: React.MutableRefObject<number> }) {
  const root = useRef<THREE.Group>(null);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const { faces, back } = useMemo(() => {
    const f: THREE.Texture[] = [];
    for (const suit of SUITS) for (const rank of RANKS) f.push(makeFace(rank, suit.s, suit.red));
    return { faces: f, back: makeBack() };
  }, []);

  useFrame(() => {
    const p = progress.current ?? 0;
    const openF = easeInOut(clamp01(p / 0.6));
    for (let i = 0; i < N; i++) {
      const grp = groups.current[i];
      if (!grp) continue;
      const u = i / (N - 1);
      const theta = (u - 0.5) * SPREAD * openF;
      const cup = (1 - Math.cos(theta)) * 0.7; // edges curl back
      grp.position.set(-HALF * Math.sin(theta), PIVOT_Y + HALF * Math.cos(theta), i * 0.012 - cup);
      grp.rotation.set(-Math.abs(theta) * 0.1, 0, theta);
    }
    if (root.current) {
      root.current.rotation.y = Math.sin(p * Math.PI) * 0.4 * openF;
      root.current.rotation.x = -0.06;
    }
  });

  return (
    <group ref={root} position={[0, 0.5, 0]}>
      {faces.map((face, i) => (
        <group key={i} ref={(el) => (groups.current[i] = el)}>
          <RoundedBox args={[CARD_W, CARD_H, 0.014]} radius={0.06} smoothness={3}>
            <meshStandardMaterial color="#FBF8F2" roughness={0.42} metalness={0} envMapIntensity={0.7} />
          </RoundedBox>
          <mesh position={[0, 0, 0.009]}>
            <planeGeometry args={[CARD_W - 0.12, CARD_H - 0.12]} />
            <meshStandardMaterial map={face} roughness={0.5} envMapIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0, -0.009]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[CARD_W - 0.12, CARD_H - 0.12]} />
            <meshStandardMaterial map={back} roughness={0.5} envMapIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function Showcase() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      progress.current = 0.6;
      gsap.set(".st-progress", { scaleX: 0.6, transformOrigin: "left center" });
      gsap.set([".beat-1", ".beat-2"], { opacity: 0 });
      gsap.set(".beat-3", { opacity: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.set(".st-progress", { scaleX: 0, transformOrigin: "left center" });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".st-trigger",
          start: "top top",
          end: "+=5400",
          pin: ".st-stage",
          scrub: 1,
          onUpdate: (self) => {
            progress.current = self.progress;
            gsap.set(".st-progress", { scaleX: self.progress });
          },
        },
      });
      tl.fromTo(".beat-1", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1 }, 0.2)
        .to(".beat-1", { opacity: 0, y: -24, duration: 1 }, 1.7)
        .fromTo(".beat-2", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1 }, 2.3)
        .to(".beat-2", { opacity: 0, y: -24, duration: 1 }, 4.0)
        .fromTo(".beat-3", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1 }, 4.6)
        .to({}, { duration: 1 }, 6);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#F5F0EA] text-[#2C2A28]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#2C2A28]/55 transition-colors hover:text-[#2C2A28]">
        ← Back
      </Link>

      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#2C2A28]/45">
          Pin · Scrub — One Flourish
        </p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">
          The fan.
        </h1>
        <p className="mt-8 text-sm text-[#2C2A28]/50">scroll ↓</p>
      </section>

      <section className="st-trigger">
        <div className="st-stage relative h-screen w-full overflow-hidden">
          <Canvas camera={{ position: [0, 0, 8.6], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
            <color attach="background" args={["#F5F0EA"]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 7, 6]} intensity={0.9} />
            <Suspense fallback={null}>
              <Environment resolution={256}>
                <Lightformer intensity={2.6} position={[0, 6, 3]} scale={[10, 10, 1]} color="#ffffff" />
                <Lightformer intensity={1.4} position={[6, 0, 6]} scale={[8, 8, 1]} color="#ffffff" />
                <Lightformer intensity={1.2} position={[-6, 1, -3]} scale={[8, 8, 1]} color="#E8D8C4" />
              </Environment>
              <Deck progress={progress} />
            </Suspense>
          </Canvas>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <h2 style={DISPLAY} className="beat-1 absolute text-center text-5xl font-light md:text-7xl">
              Fifty-two.
            </h2>
            <h2 style={DISPLAY} className="beat-2 absolute text-center text-5xl font-light md:text-7xl">
              One pivot.
            </h2>
            <h2 style={DISPLAY} className="beat-3 absolute text-center text-5xl font-light md:text-7xl">
              The flourish.
            </h2>
          </div>

          <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#2C2A28]/10">
            <div className="st-progress h-full w-full bg-[#C4897A]" />
          </div>
        </div>
      </section>

      <section className="flex h-screen flex-col items-center justify-center gap-6 text-center">
        <h2 style={DISPLAY} className="text-5xl font-light md:text-6xl">
          Released.
        </h2>
        <p style={MONO} className="text-[11px] uppercase tracking-[0.3em] text-[#2C2A28]/45">
          one deck · one mechanism
        </p>
      </section>
    </div>
  );
}
