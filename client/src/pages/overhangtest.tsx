// THROWAWAY: inspect the roof OVERHANG (fascia + soffit + recessed walls) with a free orbit camera + raking light so
// the 3D form of the eave actually reads (a flat albedo would hide the fascia/soffit planes). Drag to orbit, or drive
// the camera by query: ?cx=38&cy=4&cz=14&tx=6&ty=8&tz=0 (camera xyz + look-at xyz). Delete page + route to revert.
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { buildCrestridge } from "@/lib/tr3/solver2";
import { buildOverhang } from "@/lib/tr3/overhang";
import { RoofCaps } from "@/lib/tr3/caps";
import { makeLapSiding, SIDING_BOARDS_PER_TILE } from "@/lib/tr3/siding";

const qn = (k: string, d: number) => {
  const v = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get(k) : null;
  return v === null ? d : parseFloat(v);
};

const HOUSE = buildCrestridge(9);
const OVERHANG = buildOverhang(HOUSE.boundary, HOUSE.heightAt, 1.5, 7.25 / 12); // 18" inset, 1×8 (7.25") fascia drop

function House() {
  const tile = useTexture("/shingle-wewo-tile.jpg");
  const field = useMemo(() => {
    const t = tile.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.53, 1.0);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [tile]);
  const siding = useMemo(() => {
    const t = makeLapSiding("#e8e6e0", 0.2);
    const tileFt = SIDING_BOARDS_PER_TILE * (8 / 12);
    t.repeat.set(1 / tileFt, 1 / tileFt);
    return t;
  }, []);
  return (
    <group>
      <mesh geometry={HOUSE.roof} castShadow receiveShadow>
        <meshStandardMaterial map={field} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={OVERHANG.walls} castShadow receiveShadow>
        <meshStandardMaterial map={siding} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={OVERHANG.fascia} castShadow receiveShadow>
        <meshStandardMaterial color={qn("dbg", 0) ? "#dd2222" : "#ece9e2"} roughness={0.7} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={OVERHANG.soffit} receiveShadow>
        <meshStandardMaterial color={qn("dbg", 0) ? "#2299dd" : "#e6e3db"} roughness={0.85} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <RoofCaps creases={HOUSE.creases} eaveY={HOUSE.eaveY} />
    </group>
  );
}

export default function OverhangTest() {
  const cam: [number, number, number] = [qn("cx", 36), qn("cy", 4.5), qn("cz", 16)];
  const tgt: [number, number, number] = [qn("tx", 4), qn("ty", 8), qn("tz", -2)];
  return (
    <div style={{ height: "100vh", background: "#c9d2d8" }}>
      <Canvas
        shadows
        camera={{ position: cam, fov: 32, near: 0.1, far: 400 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      >
        <color attach="background" args={["#c9d2d8"]} />
        <hemisphereLight args={["#dbe9ff", "#8f9488", 0.7]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[-30, 26, 34]} intensity={1.5} color="#fff6e8" castShadow />
        <Suspense fallback={null}>
          <House />
        </Suspense>
        <OrbitControls target={tgt} />
      </Canvas>
    </div>
  );
}
