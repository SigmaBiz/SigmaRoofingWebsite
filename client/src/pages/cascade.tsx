import { Suspense } from "react";
import { Link } from "wouter";
import { Canvas } from "@react-three/fiber";
import { Line, Html, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

// Held-harmless cascade (THE-DOOR B.1) — 3D rrMVP.
// Three guarantors of the roof, bonded in space. Next steps: the named-peril
// event snaps the contractor + manufacturer bonds; an insurance shell keeps the owner protected.

const GOLD = "#e8a31e";
const GOLD_BRIGHT = "#ffd27a";

type NodeDef = {
  id: string;
  label: string;
  sub: string;
  pos: [number, number, number];
  r: number;
  color: string;
};

const NODES: NodeDef[] = [
  { id: "owner", label: "OWNER", sub: "carries the risk", pos: [0, 1.95, 0], r: 0.44, color: GOLD_BRIGHT },
  { id: "contractor", label: "CONTRACTOR", sub: "installs it", pos: [-2, -1.25, 0.2], r: 0.34, color: GOLD },
  { id: "manufacturer", label: "MANUFACTURER", sub: "makes it", pos: [2, -1.25, -0.2], r: 0.34, color: GOLD },
];

const BONDS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
];

function Structure() {
  return (
    <group rotation={[0.35, 0, 0]}>
      {BONDS.map(([a, b], i) => (
        <Line
          key={i}
          points={[NODES[a].pos, NODES[b].pos]}
          color={GOLD}
          lineWidth={2.4}
          transparent
          opacity={0.85}
          toneMapped={false}
        />
      ))}

      {NODES.map((n) => (
        <group key={n.id} position={n.pos}>
          <mesh>
            <sphereGeometry args={[n.r, 48, 48]} />
            <meshStandardMaterial
              color={n.color}
              emissive={n.color}
              emissiveIntensity={2.4}
              roughness={0.35}
              metalness={0.1}
              toneMapped={false}
            />
          </mesh>
          <Html center position={[0, n.r + 0.42, 0]} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
            <div className="select-none whitespace-nowrap text-center">
              <div className="font-display text-[13px] font-bold tracking-wide text-white">{n.label}</div>
              <div className="text-[10px] text-white/55">{n.sub}</div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

export default function Cascade() {
  return (
    <div className="min-h-screen bg-[#0b1b30] text-white">
      <header className="border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <span className="font-display text-lg font-bold tracking-tight text-white">Sigma Roofing</span>
          <Link href="/" className="text-sm font-semibold text-white/60 transition-colors hover:text-white">
            ← Back
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16 pt-12 md:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance font-display text-4xl font-bold tracking-tight md:text-5xl">
            Three parties stand behind your roof.
          </h1>
          <p className="mt-5 text-lg text-white/65">
            The manufacturer who made it, the contractor who installed it, and you. For now, they're
            bonded. Drag to look closer.
          </p>
        </div>

        <div className="mx-auto mt-6 h-[62vh] min-h-[440px] w-full max-w-4xl">
          <Canvas camera={{ position: [0, 0, 7.5], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true }}>
            <color attach="background" args={["#0b1b30"]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[6, 6, 8]} intensity={1.1} />
            <pointLight position={[-6, -4, 4]} intensity={0.5} color={GOLD} />
            <Suspense fallback={null}>
              <Structure />
            </Suspense>
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.8}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.7}
            />
            <EffectComposer>
              <Bloom luminanceThreshold={0.25} intensity={1.3} mipmapBlur radius={0.7} />
            </EffectComposer>
          </Canvas>
        </div>

        <p className="mx-auto mt-4 max-w-md text-center text-sm text-white/45">
          rrMVP, 3D pass. Next: a qualifying-hail event snaps the bonds, and an insurance shell
          encircles the owner.
        </p>
      </main>
    </div>
  );
}
