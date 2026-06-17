// Roof OVERHANG for a tr3 dwelling: recess the walls `inset` ft inward from the roof perimeter, hang a fascia board
// `drop` ft straight down off the whole roof edge (eaves + rakes), and close the underside with a soffit. Driven by the
// roof's `heightAt(x,z)` so the eaves come out level and the gable rakes follow the slope — exact, not eyeballed.
import * as THREE from "three";

type Pt = [number, number];
type HeightFn = (x: number, z: number) => number;

// inset a (possibly concave) polygon inward by d: offset each edge along its inward normal, re-intersect neighbours.
function insetPolygon(poly: Pt[], d: number): Pt[] {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const ccw = area > 0;
  const lp: Pt[] = [], ld: Pt[] = []; // a point on + direction of each inward-offset edge line
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    let dx = b[0] - a[0], dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    const nx = ccw ? -dz : dz, nz = ccw ? dx : -dx; // inward normal
    lp.push([a[0] + nx * d, a[1] + nz * d]);
    ld.push([dx, dz]);
  }
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i - 1 + n) % n;
    const p1 = lp[j], d1 = ld[j], p2 = lp[i], d2 = ld[i];
    const den = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(den) < 1e-9) { out.push(p2); continue; } // collinear → just use the offset point
    const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den;
    out.push([p1[0] + d1[0] * t, p1[1] + d1[1] * t]);
  }
  return out;
}

const geomOf = (pos: number[], uv: number[]) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
};
// quad A→B→C→D (two tris); uvs = [uAx,uAy, uBx,uBy, uCx,uCy, uDx,uDy]
const pushQuad = (P: number[], U: number[], A: number[], B: number[], C: number[], D: number[], uv: number[]) => {
  P.push(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2], A[0], A[1], A[2], C[0], C[1], C[2], D[0], D[1], D[2]);
  U.push(uv[0], uv[1], uv[2], uv[3], uv[4], uv[5], uv[0], uv[1], uv[4], uv[5], uv[6], uv[7]);
};

export function buildOverhang(boundary: Pt[], heightAt: HeightFn, inset: number, drop: number) {
  const inB = insetPolygon(boundary, inset);
  const n = boundary.length, Sg = 24;
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // WALLS on the inset boundary: ground → roof underside at the inset line. Lap-siding UV: U = x+z, V = world height.
  const wpos: number[] = [], wuv: number[] = [];
  for (let i = 0; i < inB.length; i++) {
    const a = inB[i], b = inB[(i + 1) % inB.length];
    for (let s = 0; s < Sg; s++) {
      const pa = lerp(a, b, s / Sg), pb = lerp(a, b, (s + 1) / Sg);
      const ya = heightAt(pa[0], pa[1]), yb = heightAt(pb[0], pb[1]);
      pushQuad(wpos, wuv, [pa[0], 0, pa[1]], [pb[0], 0, pb[1]], [pb[0], yb, pb[1]], [pa[0], ya, pa[1]],
        [pa[0] + pa[1], 0, pb[0] + pb[1], 0, pb[0] + pb[1], yb, pa[0] + pa[1], ya]);
    }
  }

  // FASCIA along the original perimeter (roof edge ya → ya-drop) + flat SOFFIT (the underhang, at ya-drop) back to wall.
  const fpos: number[] = [], fuv: number[] = [], spos: number[] = [], suv: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = boundary[i], b = boundary[(i + 1) % n];
    const ai = inB[i], bi = inB[(i + 1) % inB.length];
    for (let s = 0; s < Sg; s++) {
      const pa = lerp(a, b, s / Sg), pb = lerp(a, b, (s + 1) / Sg);
      const pai = lerp(ai, bi, s / Sg), pbi = lerp(ai, bi, (s + 1) / Sg);
      const ya = heightAt(pa[0], pa[1]), yb = heightAt(pb[0], pb[1]);
      pushQuad(fpos, fuv, [pa[0], ya, pa[1]], [pb[0], yb, pb[1]], [pb[0], yb - drop, pb[1]], [pa[0], ya - drop, pa[1]],
        [0, 0, 1, 0, 1, 1, 0, 1]);
      pushQuad(spos, suv, [pa[0], ya - drop, pa[1]], [pb[0], yb - drop, pb[1]], [pbi[0], yb - drop, pbi[1]], [pai[0], ya - drop, pai[1]],
        [0, 0, 1, 0, 1, 1, 0, 1]);
    }
  }
  return { walls: geomOf(wpos, wuv), fascia: geomOf(fpos, fuv), soffit: geomOf(spos, suv) };
}
