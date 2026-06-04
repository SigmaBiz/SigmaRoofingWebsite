import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Lightformer, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { RotateCcw } from "lucide-react";

// rrMVP capability spike (PS5 pass): glossy beveled Rubik's cube with real stickers,
// image-based reflections, eased layer turns + whole-cube rotation, scramble -> solve into
// the Sigma logo (sliced across the front 9 stickers), then a dramatic tumbling CAD explosion.

const SP = 1.0;
const TURN = 0.34; // seconds per layer turn
const SCRAMBLE_N = 12;

const COLORS = {
  right: "#C4897A", // dusty-rose
  left: "#7D9E82", // sage
  top: "#E8D8C4", // shell
  bottom: "#A06B5E", // clay
  back: "#5E7D63", // sage-dark
};

type Move = { axis: "x" | "y" | "z"; layer: number; dir: number };

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// shared geometry
const BODY_GEO = new RoundedBoxGeometry(0.97, 0.97, 0.97, 4, 0.1);
const STICKER_GEO = new RoundedBoxGeometry(0.74, 0.74, 0.06, 3, 0.07);
const LOGO_GEO = new THREE.PlaneGeometry(0.74, 0.74);

function glossy(color: string) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.26,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.1,
  });
}
const BODY_MAT = new THREE.MeshPhysicalMaterial({
  color: "#1b1a18",
  roughness: 0.5,
  metalness: 0,
  clearcoat: 0.7,
  clearcoatRoughness: 0.35,
  envMapIntensity: 0.7,
});

function logoTileMat(col: number, row: number, base: THREE.Texture) {
  const t = base.clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.repeat.set(1 / 3, 1 / 3);
  t.offset.set(col / 3, row / 3);
  t.anisotropy = 8;
  return new THREE.MeshPhysicalMaterial({
    map: t,
    color: "#ffffff",
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.1,
  });
}

function colorSticker(n: THREE.Vector3, color: string) {
  const m = new THREE.Mesh(STICKER_GEO, glossy(color));
  m.position.copy(n.clone().multiplyScalar(0.5));
  m.lookAt(n.clone().multiplyScalar(5));
  return m;
}

function buildCube(logo: THREE.Texture) {
  const group = new THREE.Group();
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        const cubie = new THREE.Group();
        cubie.add(new THREE.Mesh(BODY_GEO, BODY_MAT));
        if (x === 1) cubie.add(colorSticker(new THREE.Vector3(1, 0, 0), COLORS.right));
        if (x === -1) cubie.add(colorSticker(new THREE.Vector3(-1, 0, 0), COLORS.left));
        if (y === 1) cubie.add(colorSticker(new THREE.Vector3(0, 1, 0), COLORS.top));
        if (y === -1) cubie.add(colorSticker(new THREE.Vector3(0, -1, 0), COLORS.bottom));
        if (z === -1) cubie.add(colorSticker(new THREE.Vector3(0, 0, -1), COLORS.back));
        if (z === 1) {
          const logoMesh = new THREE.Mesh(LOGO_GEO, logoTileMat(x + 1, y + 1, logo));
          logoMesh.position.set(0, 0, 0.5);
          cubie.add(logoMesh);
        }
        cubie.position.set(x * SP, y * SP, z * SP);
        cubie.userData.isCubie = true;
        group.add(cubie);
      }
  return group;
}

function randomScramble(n: number): Move[] {
  const axes: ("x" | "y" | "z")[] = ["x", "y", "z"];
  return Array.from({ length: n }, () => ({
    axis: axes[Math.floor(Math.random() * 3)],
    layer: Math.random() < 0.5 ? -1 : 1,
    dir: Math.random() < 0.5 ? 1 : -1,
  }));
}

type Phase = "scramble" | "pause" | "solve" | "explode" | "hold" | "implode" | "done";
interface TL {
  phase: Phase;
  scramble: Move[];
  queue: Move[];
  cur: null | { axis: "x" | "y" | "z"; target: number; t: number };
  timer: number;
  explode: number;
  homed: boolean;
}

function CubeScene({ runId }: { runId: number }) {
  const logo = useTexture("/sigma-logo.png");
  const pivot = useMemo(() => new THREE.Group(), []);
  const cube = useMemo(() => {
    const g = buildCube(logo);
    g.add(pivot);
    return g;
  }, [logo, runId, pivot]);
  const root = useRef<THREE.Group>(null);
  const st = useRef<TL | null>(null);

  useEffect(() => {
    const scr = randomScramble(SCRAMBLE_N);
    st.current = { phase: "scramble", scramble: scr, queue: [...scr], cur: null, timer: 0, explode: 0, homed: false };
  }, [runId]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = st.current;
    if (!s) return;
    if (root.current) {
      root.current.rotation.y += dt * 0.28;
      root.current.rotation.x = 0.42;
    }

    const startMove = (mv: Move) => {
      pivot.rotation.set(0, 0, 0);
      pivot.quaternion.identity();
      cube.children
        .filter(
          (c) =>
            c.userData?.isCubie &&
            Math.round((c.position as unknown as Record<string, number>)[mv.axis] / SP) === mv.layer,
        )
        .forEach((c) => pivot.attach(c));
      s.cur = { axis: mv.axis, target: (mv.dir * Math.PI) / 2, t: 0 };
    };
    const finishMove = () => {
      [...pivot.children].forEach((c) => {
        cube.attach(c);
        c.position.set(Math.round(c.position.x / SP) * SP, Math.round(c.position.y / SP) * SP, Math.round(c.position.z / SP) * SP);
      });
      pivot.rotation.set(0, 0, 0);
      pivot.quaternion.identity();
      s.cur = null;
    };
    const setExplode = (fRaw: number) => {
      if (!s.homed) {
        cube.children.forEach((c) => {
          if (!c.userData?.isCubie) return;
          c.userData.home = c.position.clone();
          c.userData.homeQuat = c.quaternion.clone();
          c.userData.delay = Math.random() * 0.32;
          c.userData.tax = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
          c.userData.tamt = (0.6 + Math.random()) * Math.PI;
        });
        s.homed = true;
      }
      const q = new THREE.Quaternion();
      cube.children.forEach((c) => {
        const h = c.userData?.home as THREE.Vector3 | undefined;
        if (!h) return;
        const ef = easeOut(clamp01((fRaw - c.userData.delay) / (1 - c.userData.delay)));
        const k = 1 + ef * 1.75;
        c.position.set(h.x * k, h.y * k, h.z * k);
        q.setFromAxisAngle(c.userData.tax, c.userData.tamt * ef);
        c.quaternion.copy(c.userData.homeQuat).multiply(q);
      });
    };

    if (s.cur) {
      s.cur.t += dt / TURN;
      const tc = clamp01(s.cur.t);
      (pivot.rotation as unknown as Record<string, number>)[s.cur.axis] = s.cur.target * easeInOut(tc);
      if (s.cur.t >= 1) finishMove();
      return;
    }
    switch (s.phase) {
      case "scramble":
        if (s.queue.length) startMove(s.queue.shift()!);
        else ((s.phase = "pause"), (s.timer = 0.5));
        break;
      case "pause":
        s.timer -= dt;
        if (s.timer <= 0) ((s.phase = "solve"), (s.queue = [...s.scramble].reverse().map((m) => ({ ...m, dir: -m.dir }))));
        break;
      case "solve":
        if (s.queue.length) startMove(s.queue.shift()!);
        else s.phase = "explode";
        break;
      case "explode":
        s.explode = Math.min(1, s.explode + dt / 1.3);
        setExplode(s.explode);
        if (s.explode >= 1) ((s.phase = "hold"), (s.timer = 2));
        break;
      case "hold":
        s.timer -= dt;
        if (s.timer <= 0) s.phase = "implode";
        break;
      case "implode":
        s.explode = Math.max(0, s.explode - dt / 1.1);
        setExplode(s.explode);
        if (s.explode <= 0) s.phase = "done";
        break;
    }
  });

  return (
    <group ref={root}>
      <primitive object={cube} />
    </group>
  );
}

export default function Cube() {
  const [runId, setRunId] = useState(0);
  return (
    <div className="min-h-screen bg-[#F5F0EA] text-[#2C2A28]">
      <header className="border-b border-[#2C2A28]/10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-bold">
            Sigma Roofing
          </span>
          <Link href="/" className="text-sm font-semibold text-[#2C2A28]/55 transition-colors hover:text-[#2C2A28]">
            ← Back
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-12 pt-10 md:pt-14">
        <div className="mx-auto max-w-2xl text-center">
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-balance text-5xl font-light tracking-tight md:text-6xl">
            From scramble to Sigma.
          </h1>
          <p className="mt-4 text-[#2C2A28]/60">A capability spike — Venus Blush, WebGL, no narrative yet.</p>
        </div>

        <div className="mx-auto mt-4 h-[66vh] min-h-[480px] w-full max-w-4xl">
          <Canvas
            camera={{ position: [4.5, 3.5, 6.5], fov: 38 }}
            dpr={[1, 2]}
            gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
          >
            <color attach="background" args={["#F5F0EA"]} />
            <ambientLight intensity={0.35} />
            <directionalLight position={[6, 9, 7]} intensity={1.1} />
            <Suspense fallback={null}>
              <Environment resolution={256}>
                <Lightformer intensity={3} position={[0, 6, 0]} scale={[8, 8, 1]} color="#ffffff" />
                <Lightformer intensity={1.6} position={[6, 2, 5]} scale={[6, 6, 1]} color="#ffffff" />
                <Lightformer intensity={1.4} position={[-6, 1, -4]} scale={[6, 6, 1]} color="#E8D8C4" />
                <Lightformer intensity={1.2} position={[0, -4, 4]} scale={[6, 6, 1]} color="#C4897A" />
              </Environment>
              <CubeScene runId={runId} />
            </Suspense>
            <ContactShadows position={[0, -2.6, 0]} opacity={0.4} blur={2.4} scale={13} color="#2C2A28" />
            <OrbitControls enablePan={false} minDistance={5} maxDistance={15} enableDamping />
          </Canvas>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setRunId((v) => v + 1)}
            className="inline-flex items-center gap-2 rounded-sm border border-[#2C2A28]/25 px-5 py-2 text-sm font-semibold text-[#2C2A28]/70 transition-colors hover:border-[#2C2A28]/50 hover:text-[#2C2A28]"
          >
            <RotateCcw className="h-4 w-4" /> Replay
          </button>
        </div>
      </main>
    </div>
  );
}
