// THROWAWAY: /veneertest — dial in the masonry VENEER (CC0 ambientCG Bricks078, a tan fieldstone) before importing to
// /inspect. The test walls use the SAME UV as the /inspect house walls (U = x+z, V = WORLD height) so whatever looks
// right here transfers 1:1. ?tile=<ft> sets the texture tile size in FEET (stone scale). ?flat=1 = flat albedo (no
// relief). Free camera via ?cx,cy,cz & ?tx,ty,tz. TO REVERT: delete this file + its route + the /public/veneer-*.jpg.
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

type V3 = [number, number, number];
// a quad (a,b,c,d CCW) → 2 tris; UV = (x+z, worldY) — the exact house-wall convention from /inspect
function pushQuad(pos: number[], uv: number[], a: V3, b: V3, c: V3, d: V3) {
  const w = (p: V3): [number, number] => [p[0] + p[2], p[1]];
  const A = w(a), B = w(b), C = w(c), D = w(d);
  pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  uv.push(...A, ...B, ...C, ...A, ...C, ...D);
}
const WALLS = (() => {
  const pos: number[] = [], uv: number[] = [];
  pushQuad(pos, uv, [-12, 0, 0], [12, 0, 0], [12, 12, 0], [-12, 12, 0]); // front wall (faces +z), 24 ft × 12 ft
  pushQuad(pos, uv, [12, 0, 0], [12, 0, -16], [12, 12, -16], [12, 12, 0]); // return wall (faces +x), wraps the corner
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
})();

function Veneer({ pfx, tileFt, flat }: { pfx: string; tileFt: number; flat: boolean }) {
  const [color, normal, rough] = useTexture([`/${pfx}-color.jpg`, `/${pfx}-normal.jpg`, `/${pfx}-rough.jpg`]);
  useMemo(() => {
    for (const t of [color, normal, rough]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1 / tileFt, 1 / tileFt); // walls UV'd in world ft ⇒ one tile = tileFt of wall
      t.anisotropy = 8;
      t.needsUpdate = true;
    }
    color.colorSpace = THREE.SRGBColorSpace;
  }, [color, normal, rough, tileFt]);
  return (
    <mesh geometry={WALLS} castShadow receiveShadow>
      <meshStandardMaterial
        map={color}
        normalMap={flat ? undefined : normal}
        roughnessMap={flat ? undefined : rough}
        roughness={1}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function VeneerTest() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const tileFt = parseFloat(params.get("tile") ?? "10") || 10;
  const flat = params.get("flat") === "1";
  const asset = params.get("asset") === "095" ? "095" : "078";
  const pfx = asset === "095" ? "veneer95" : "veneer";
  const assetLabel = asset === "095" ? "Bricks095 — cut stone" : "Bricks078 — rounded fieldstone";
  const cx = parseFloat(params.get("cx") ?? ""), cy = parseFloat(params.get("cy") ?? ""), cz = parseFloat(params.get("cz") ?? "");
  const pos: V3 = !Number.isNaN(cx) ? [cx, cy, cz] : [30, 9, 24];
  const tx = parseFloat(params.get("tx") ?? ""), ty = parseFloat(params.get("ty") ?? ""), tz = parseFloat(params.get("tz") ?? "");
  const target: V3 = !Number.isNaN(tx) ? [tx, ty, tz] : [8, 6, -4];
  return (
    <div style={{ height: "100vh", background: "#cbc5b8" }}>
      <Canvas shadows camera={{ position: pos, fov: 42, near: 0.5, far: 2000 }} dpr={[1, 1.75]} gl={{ toneMapping: flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}>
        <color attach="background" args={["#cbc5b8"]} />
        <ambientLight intensity={flat ? Math.PI : 0.18} />
        {!flat && <directionalLight position={[16, 18, 22]} intensity={1.9} color="#fff3df" castShadow shadow-mapSize={[2048, 2048]} />}
        <Suspense fallback={null}>
          {!flat && <Environment files="/sky-midday.hdr" />}
          <Veneer pfx={pfx} tileFt={tileFt} flat={flat} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, 0, -6]} receiveShadow>
            <planeGeometry args={[120, 120]} />
            <meshStandardMaterial color="#9aa07f" roughness={1} />
          </mesh>
        </Suspense>
        <OrbitControls target={target} />
      </Canvas>
      <div style={{ position: "fixed", top: 10, left: 10, font: "12px monospace", background: "rgba(20,20,24,0.82)", color: "#fff", padding: "7px 10px", borderRadius: 6, lineHeight: 1.5 }}>
        <b>VENEER</b> · ambientCG <b>{assetLabel}</b> · tile=<b>{tileFt}ft</b><br />
        <span style={{ opacity: 0.8 }}>?asset=078|095 · ?tile=N rescale · ?flat=1 albedo · drag to orbit</span>
      </div>
    </div>
  );
}
