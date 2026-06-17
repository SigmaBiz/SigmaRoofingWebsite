// Hip/ridge CAP rendering for tr3 roofs (shared by /shingletest + /inspect). Folded saddle tabs cut from real cap-piece
// photos, dragged-down overlap (headlap hides the lower cap's top-edge shadow), normalized shadow substrate, analytic-
// crease vectors (base/eave → top/ridge), brightness-matched to the field, altitude z-order (uphill caps over downhill
// at hip↔ridge meets). Geometry is derived from a roof's `creases` (the analytic hip/ridge lines from solver2).
import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { CreaseLine } from "./solver2";

type V3 = [number, number, number];
const NT = 4;
const capNf = (p: V3): V3 => {
  const l = Math.hypot(p[0], p[1], p[2]) || 1;
  return [p[0] / l, p[1] / l, p[2] / l];
};
const capCross = (p: V3, q: V3): V3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const capAdd = (p: V3, t: V3, a: number): V3 => [p[0] + t[0] * a, p[1] + t[1] * a, p[2] + t[2] * a];
const capDown = (t: V3): V3 => (t[1] > 0 ? [-t[0], -t[1], -t[2]] : t); // force a tangent DOWN-slope
const lerpN = (a: V3, b: V3, t: number): V3 => capNf([a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t]);

// CAP_BASE leveled the cap-tab photo avg (~102) to the field tile (~137); ×1.33 = Antonio's +33% pick. Over-bright (>1)
// multiplier on the map, so the field↔cap brightness match holds under any lighting.
export const CAP_LEVEL = 1.34 * 1.33; // ≈ 1.78

type CreaseCaps = { geoms: THREE.BufferGeometry[] };
export function buildCapGeoms(creases: CreaseLine[], eaveY: number): CreaseCaps[] {
  const expo = 0.67, // 8" tab/cap length along the line
    ov = 0.0625, // 3/4" headlap
    drape = 0.42, // ~5" down each slope
    lift = 0.09, // proud of the field
    drop = 0.05, // base rides proud → laps in front of the cap below
    upTilt = 0.0, // each cap half shades like the slope it sits on (color match)
    ZK = 0.005; // altitude-weighted z-order: lift more nearer a higher far-end ⇒ uphill cap on top
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed / 0x7fffffff);
  const out: CreaseCaps[] = [];
  for (const seg of creases) {
    const s = seg.a[1] <= seg.b[1] ? seg : { a: seg.b, b: seg.a, n1: seg.n1, n2: seg.n2 }; // base = LOW end (eave)
    const dv: V3 = [s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]];
    const len = Math.hypot(dv[0], dv[1], dv[2]);
    if (len < 0.3) continue;
    const d = capNf(dv);
    const nb = capNf([s.n1[0] + s.n2[0], s.n1[1] + s.n2[1], s.n1[2] + s.n2[2]]);
    const t1 = capDown(capNf(capCross(s.n1, d))), t2 = capDown(capNf(capCross(s.n2, d)));
    const nH1 = lerpN(s.n1, nb, upTilt), nH2 = lerpN(s.n2, nb, upTilt);
    const stepE = expo - ov, n = Math.max(1, Math.round(len / stepE));
    const fp = (ss: number, lz: number): V3 => [s.a[0] + d[0] * ss + nb[0] * lz, s.a[1] + d[1] * ss + nb[1] * lz, s.a[2] + d[2] * ss + nb[2] * lz];
    const P: number[][] = Array.from({ length: NT }, () => []);
    const U: number[][] = Array.from({ length: NT }, () => []);
    const Nrm: number[][] = Array.from({ length: NT }, () => []);
    const tri = (k: number, p: V3, u: number, w: number, nr: V3) => { P[k].push(p[0], p[1], p[2]); U[k].push(u, w); Nrm[k].push(nr[0], nr[1], nr[2]); };
    const piece = (k: number, f0: V3, f1: V3, vB: number, vT: number) => {
      const o1a = capAdd(f0, t1, drape), o1b = capAdd(f1, t1, drape), o2a = capAdd(f0, t2, drape), o2b = capAdd(f1, t2, drape);
      tri(k, o1a, 0, vB, nH1); tri(k, o1b, 0, vT, nH1); tri(k, f1, 0.5, vT, nH1);
      tri(k, o1a, 0, vB, nH1); tri(k, f1, 0.5, vT, nH1); tri(k, f0, 0.5, vB, nH1);
      tri(k, f0, 0.5, vB, nH2); tri(k, f1, 0.5, vT, nH2); tri(k, o2b, 1, vT, nH2);
      tri(k, f0, 0.5, vB, nH2); tri(k, o2b, 1, vT, nH2); tri(k, o2a, 1, vB, nH2);
    };
    const yA = s.a[1], yB = s.b[1];
    for (let i = 0; i < n; i++) {
      const ss0 = i * stepE, ss1 = Math.min(i * stepE + expo, len);
      const eL0 = ZK * ((yA * ss0 + yB * (len - ss0)) / len - eaveY), eL1 = ZK * ((yA * ss1 + yB * (len - ss1)) / len - eaveY);
      const f0 = fp(ss0, lift + drop + eL0), f1 = fp(ss1, lift + eL1);
      piece((rnd() * NT) | 0, f0, f1, 1, 0);
    }
    out.push({
      geoms: P.map((p, k) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
        g.setAttribute("uv", new THREE.Float32BufferAttribute(U[k], 2));
        g.setAttribute("normal", new THREE.Float32BufferAttribute(Nrm[k], 3));
        return g;
      }),
    });
  }
  return out;
}

// <RoofCaps creases={roof.creases} eaveY={roof.eaveY} /> — render inside a <Suspense> (loads the cap-tab images).
export function RoofCaps({ creases, eaveY, level = CAP_LEVEL }: { creases: CreaseLine[]; eaveY: number; level?: number }) {
  const caps = useMemo(() => buildCapGeoms(creases, eaveY), [creases, eaveY]);
  const tabs = useTexture(["/cap-tab1.jpg", "/cap-tab2.jpg", "/cap-tab3.jpg", "/cap-tab4.jpg"]);
  useMemo(
    () =>
      tabs.forEach((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        t.flipY = false; // image-bottom (clipped base + shadow) → v1 → eave end
        t.needsUpdate = true;
      }),
    [tabs],
  );
  const capColor = useMemo(() => new THREE.Color(level, level, level), [level]);
  return (
    <group>
      {caps.map((cc, ci) =>
        cc.geoms.map((g, k) =>
          g.attributes.position.count > 0 ? (
            <mesh key={`${ci}-${k}`} geometry={g} castShadow receiveShadow>
              <meshStandardMaterial map={tabs[k]} color={capColor} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
            </mesh>
          ) : null,
        ),
      )}
    </group>
  );
}
