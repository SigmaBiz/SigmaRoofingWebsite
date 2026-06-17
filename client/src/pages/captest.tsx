// THROWAWAY: hip/ridge CAP modeling test on a blank hip prim. Delete page + route + public cap-tab*.jpg to revert.
// Each tab image is the pre-exposed cap face; we FOLD it at its vertical center (u=0.5 = the ridge) into a saddle —
// each half lies flush/coplanar on its slope — and lay tabs in series along each crease, color-mixed across 4 tabs.
//
// CAP RULES (Antonio, 2026-06-06):
// - Every cap has a DIRECTION VECTOR: tail at the BEAK (center of the BASE — the end with the clipped corners),
//   pointing to the straight TOP edge, parallel to the side edges. The fold runs along this vector; the cap is
//   symmetrical on both sides of the fold (each half drapes one slope).
// - HIPS: the cap vector points along the hip from the EAVE toward the RIDGE (base at eave, top toward ridge).
// - RIDGE: direction arbitrary, but every cap in the series points the SAME way so they connect tip→tail.
//   (Texture flipY=false puts image-bottom=base=v1 at the eave end f0, so the vector reads base→top = eave→ridge.)
// - SUBSTRATE: tabs are double-layered — a weathered-wood top layer over a near-black "shadow" bottom layer that
//   pokes ~1-2" past the top layer's base. The 4 source tabs had uneven shadow bands; all clipped to the smallest
//   (29px) so the shadow reads uniform across the run.
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { solveEnvelope, type Pt } from "@/lib/tr3/solver2";

const L = 40,
  W = 28,
  WALL = 9,
  PITCH = 8 / 12;
const hL = L / 2,
  hW = W / 2,
  ridgeY = WALL + PITCH * hW,
  rL = hL - hW;
const FP: Pt[] = [
  [-hL, -hW],
  [hL, -hW],
  [hL, hW],
  [-hL, hW],
];
const ROOF = solveEnvelope(FP, () => false, WALL, PITCH); // simple all-hip roof

type V3 = [number, number, number];
const nf = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (p: V3, q: V3): V3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const N_FRONT = nf([0, 1, PITCH]), // +Z slope
  N_BACK = nf([0, 1, -PITCH]), // -Z
  N_RIGHT = nf([PITCH, 1, 0]), // +X
  N_LEFT = nf([-PITCH, 1, 0]); // -X
type Crease = { a: V3; b: V3; n1: V3; n2: V3 };
const CREASES: Crease[] = [
  // highest ridge — SPLIT into two runs pointing INWARD from each end toward center; caps meet down the middle
  { a: [rL, ridgeY, 0], b: [0, ridgeY, 0], n1: N_FRONT, n2: N_BACK }, // right half: base at +X end → top at center
  { a: [-rL, ridgeY, 0], b: [0, ridgeY, 0], n1: N_FRONT, n2: N_BACK }, // left half:  base at -X end → top at center
  // hips: base at eave corner → top at ridge end (eave→ridge), unchanged
  { a: [hL, WALL, hW], b: [rL, ridgeY, 0], n1: N_FRONT, n2: N_RIGHT },
  { a: [hL, WALL, -hW], b: [rL, ridgeY, 0], n1: N_BACK, n2: N_RIGHT },
  { a: [-hL, WALL, hW], b: [-rL, ridgeY, 0], n1: N_FRONT, n2: N_LEFT },
  { a: [-hL, WALL, -hW], b: [-rL, ridgeY, 0], n1: N_BACK, n2: N_LEFT },
];
// convex corners (ridge higher than the hips): the ridge end R + the end-facet a 3" tab folds down onto
type Corner = { R: V3; dEnd: V3; nEnd: V3 };
const CORNERS: Corner[] = [
  { R: [rL, ridgeY, 0], dEnd: nf([1, -PITCH, 0]), nEnd: N_RIGHT }, // +X end → fold onto RIGHT end-facet
  { R: [-rL, ridgeY, 0], dEnd: nf([-1, -PITCH, 0]), nEnd: N_LEFT }, // -X end → fold onto LEFT end-facet
];

const NT = 4;
const SHADOW_FRAC = 0.06; // ~29px substrate shadow as a fraction of tab height — crop it off the closure/corner caps
const addv = (p: V3, t: V3, a: number): V3 => [p[0] + t[0] * a, p[1] + t[1] * a, p[2] + t[2] * a];
const negDown = (t: V3): V3 => (t[1] > 0 ? [-t[0], -t[1], -t[2]] : t); // force a tangent to point DOWN-slope

function buildCapGeoms(): THREE.BufferGeometry[] {
  const expo = 0.67, // 8" tab/cap length along the line
    ov = 0.0625, // 3/4" headlap: drag each cap down over the one below so its base hides the lower cap's top-edge shadow
    drape = 0.42, // ~5" down each slope
    lift = 0.05, // sit just proud of the field
    drop = 0.035, // base end rides ~0.4" proud so the dragged-down cap laps IN FRONT of the one below (no z-fight)
    tab = 0.25; // 3" corner tab that creases down off the ridge end onto the end-facet
  const P: number[][] = Array.from({ length: NT }, () => []);
  const U: number[][] = Array.from({ length: NT }, () => []);
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed / 0x7fffffff);
  const tri = (k: number, p: V3, u: number, w: number) => { P[k].push(p[0], p[1], p[2]); U[k].push(u, w); };
  // one saddle piece folded over a crease: base edge f0 (v=vB) → top edge f1 (v=vT), draping t1/t2 down both slopes
  const piece = (k: number, f0: V3, f1: V3, t1: V3, t2: V3, vB: number, vT: number) => {
    const o1a = addv(f0, t1, drape), o1b = addv(f1, t1, drape), o2a = addv(f0, t2, drape), o2b = addv(f1, t2, drape);
    tri(k, o1a, 0, vB); tri(k, o1b, 0, vT); tri(k, f1, 0.5, vT);
    tri(k, o1a, 0, vB); tri(k, f1, 0.5, vT); tri(k, f0, 0.5, vB);
    tri(k, f0, 0.5, vB); tri(k, f1, 0.5, vT); tri(k, o2b, 1, vT);
    tri(k, f0, 0.5, vB); tri(k, o2b, 1, vT); tri(k, o2a, 1, vB);
  };
  // running caps along each crease (hips + the two inward ridge halves)
  for (const c of CREASES) {
    const dv: V3 = [c.b[0] - c.a[0], c.b[1] - c.a[1], c.b[2] - c.a[2]];
    const len = Math.hypot(dv[0], dv[1], dv[2]);
    const d = nf(dv);
    const nb = nf([c.n1[0] + c.n2[0], c.n1[1] + c.n2[1], c.n1[2] + c.n2[2]]);
    const t1 = negDown(nf(cross(c.n1, d))), t2 = negDown(nf(cross(c.n2, d)));
    const stepE = expo - ov, // exposure = tab length minus the headlap
      n = Math.max(1, Math.round(len / stepE));
    const fp = (s: number, lz: number): V3 => [c.a[0] + d[0] * s + nb[0] * lz, c.a[1] + d[1] * s + nb[1] * lz, c.a[2] + d[2] * s + nb[2] * lz];
    for (let i = 0; i < n; i++) {
      const f0 = fp(i * stepE, lift + drop), // base rides proud → laps over the cap below it
        f1 = fp(Math.min(i * stepE + expo, len), lift); // top flush → tucked under the cap above
      piece((rnd() * NT) | 0, f0, f1, t1, t2, 1, 0);
    }
  }
  // CLOSURE cap over the seam where the two ridge runs meet at center — shadow fully cropped, rides on top
  {
    const hw = expo * 0.33,
      ly = ridgeY + lift + drop + 0.02;
    const tF = negDown(nf(cross(N_FRONT, [1, 0, 0]))), tB = negDown(nf(cross(N_BACK, [1, 0, 0])));
    piece((rnd() * NT) | 0, [-hw, ly, 0], [hw, ly, 0], tF, tB, 1 - SHADOW_FRAC, 0);
  }
  // CORNER tab folds: at each convex ridge end, a 3" tab creased down off the ridge onto the end-facet. The right-triangle
  // notch is removed so the wrap lies flat → two sub-tabs, the upper (+Z half) riding proud OVER the lower (-Z half).
  for (const cr of CORNERS) {
    const k = (rnd() * NT) | 0,
      wHalf = tab * 0.83; // end-facet half-width reached at 3" down-slope (≈ the pitch run)
    const apex = addv(cr.R, cr.nEnd, lift + drop + 0.025), // fold point at the ridge end, proud
      mid = addv(addv(cr.R, cr.dEnd, tab), cr.nEnd, lift + 0.005); // 3" down the fall line
    const baseL: V3 = [mid[0], mid[1], mid[2] + wHalf], // reaches the +Z hip
      baseR: V3 = [mid[0], mid[1], mid[2] - wHalf]; // reaches the -Z hip
    const apexUp = addv(apex, cr.nEnd, 0.012), // upper sub-tab proud → overlaps the lower at the fall line
      vB = 1 - SHADOW_FRAC;
    tri(k, apex, 0.5, 0); tri(k, baseR, 1, vB); tri(k, mid, 0.5, vB); // lower sub-tab (-Z, u 0.5→1)
    tri(k, apexUp, 0.5, 0); tri(k, mid, 0.5, vB); tri(k, baseL, 0, vB); // upper sub-tab (+Z, u 0.5→0), on top
  }
  return P.map((p, k) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(U[k], 2));
    g.computeVertexNormals();
    return g;
  });
}
const CAP_GEOMS = buildCapGeoms();

function Scene() {
  const tabs = useTexture(["/cap-tab1.jpg", "/cap-tab2.jpg", "/cap-tab3.jpg", "/cap-tab4.jpg"]);
  useMemo(
    () =>
      tabs.forEach((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        t.flipY = false; // align cap vector: image-bottom (clipped base) → v1 → eave end; top edge → ridge
        t.needsUpdate = true;
      }),
    [tabs],
  );
  return (
    <group>
      <mesh geometry={ROOF.roof} castShadow receiveShadow>
        <meshStandardMaterial color="#cdc8bb" roughness={0.96} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh geometry={ROOF.walls} castShadow receiveShadow>
        <meshStandardMaterial color="#bcb5a5" roughness={0.97} side={THREE.DoubleSide} />
      </mesh>
      {CAP_GEOMS.map((g, k) => (
        <mesh key={k} geometry={g} castShadow>
          <meshStandardMaterial map={tabs[k]} roughness={0.9} metalness={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

export default function CapTest() {
  const cam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("cam") : null;
  const pos: [number, number, number] =
    cam === "corner" ? [17, 21, 11] : cam === "macro" ? [18.5, 16.5, 12.5] : cam === "close" ? [16, 24, 20] : [34, 30, 44];
  const target: [number, number, number] =
    cam === "corner" ? [rL, ridgeY - 1, 0] : cam === "macro" ? [12, 13.4, 7] : [0, ridgeY * 0.5, 0];
  return (
    <div style={{ height: "100vh", background: "#d7d2c6" }}>
      <Canvas shadows camera={{ position: pos, fov: cam === "macro" ? 34 : 42, near: 0.5, far: 600 }} dpr={[1, 1.75]} gl={{ antialias: true, toneMappingExposure: 1.1 }}>
        <color attach="background" args={["#d9d4c8"]} />
        <hemisphereLight args={["#cfe0ff", "#9a8a6a", 0.7]} />
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[30, 50, 22]}
          intensity={1.7}
          color="#fff2dd"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.04}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-camera-near={1}
          shadow-camera-far={140}
        />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#b7b1a1" roughness={1} />
        </mesh>
        <OrbitControls target={target} />
      </Canvas>
    </div>
  );
}
