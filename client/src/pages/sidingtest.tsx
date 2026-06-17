// THROWAWAY: play with exterior lap SIDING (Antonio's reference = smooth painted light-gray clapboard, HardiePlank
// style). Clean procedural lap = uniform color + a soft shadow under each board's reveal + a crisp bottom edge line.
// Tunable live via query: ?gray=bfc3c0 &board=7 (inch reveal) &shadow=0.22 &trim=ece9e2 &tex=wood (CC0 compare).
// Delete page + route to revert.
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { makeLapSiding } from "@/lib/tr3/siding";

const qp = (k: string) => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get(k) : null);

const WALL_H = 12; // ft (panel height)
const WALL_W = 14;

function Siding() {
  const gray = "#" + (qp("gray") || "bfc3c0");
  const boardIn = parseFloat(qp("board") || "7"); // lap reveal in inches
  const shadow = parseFloat(qp("shadow") || "0.22");
  const useWood = qp("tex") === "wood";

  const woodMaps = useTexture(useWood ? ["/siding.jpg", "/siding-normal.jpg"] : ["/siding.jpg"]);
  const mat = useMemo(() => {
    if (useWood) {
      const [m, nrm] = woodMaps as THREE.Texture[];
      for (const t of [m, nrm].filter(Boolean)) {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(WALL_W / 4, WALL_H / 4);
        t.anisotropy = 8;
      }
      m.colorSpace = THREE.SRGBColorSpace;
      return { map: m, normalMap: nrm };
    }
    const t = makeLapSiding(gray, shadow);
    const boardsPerTile = 12;
    const tileFt = (boardIn / 12) * boardsPerTile; // ft covered by one texture tile
    t.repeat.set(WALL_W / tileFt, WALL_H / tileFt); // boards stay level + at the chosen reveal
    return { map: t };
  }, [gray, boardIn, shadow, useWood, woodMaps]);

  // a corner of two sided panels (like the reference), + white corner board + frieze trim
  const trim = "#" + (qp("trim") || "ece9e2");
  return (
    <group>
      <mesh position={[-WALL_W / 2, WALL_H / 2, 0]}>
        <planeGeometry args={[WALL_W, WALL_H]} />
        <meshStandardMaterial {...mat} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, WALL_H / 2, -WALL_W / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[WALL_W, WALL_H]} />
        <meshStandardMaterial {...mat} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* white corner board */}
      <mesh position={[0.06, WALL_H / 2, 0.06]}>
        <boxGeometry args={[0.5, WALL_H, 0.5]} />
        <meshStandardMaterial color={trim} roughness={0.7} />
      </mesh>
      {/* white frieze trim under the eave, both faces */}
      <mesh position={[-WALL_W / 2, WALL_H - 0.35, 0.04]}>
        <boxGeometry args={[WALL_W, 0.7, 0.18]} />
        <meshStandardMaterial color={trim} roughness={0.7} />
      </mesh>
      <mesh position={[0.04, WALL_H - 0.35, -WALL_W / 2]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[WALL_W, 0.7, 0.18]} />
        <meshStandardMaterial color={trim} roughness={0.7} />
      </mesh>
    </group>
  );
}

export default function SidingTest() {
  return (
    <div style={{ height: "100vh", background: "#cfe1ef" }}>
      <Canvas
        camera={{ position: [13, 7.5, 13], fov: 34, near: 0.1, far: 200 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <color attach="background" args={["#cfe1ef"]} />
        <hemisphereLight args={["#dbe9ff", "#9c9a86", 0.75]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[-34, 44, 26]} intensity={1.35} color="#fff6e8" />
        <Suspense fallback={null}>
          <Siding />
        </Suspense>
        <OrbitControls target={[0, 5.5, 0]} />
      </Canvas>
    </div>
  );
}
