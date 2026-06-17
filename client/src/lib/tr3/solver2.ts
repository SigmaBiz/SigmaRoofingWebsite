import * as THREE from "three";

// tr3 engine v2 — FOOTPRINT LOWER-ENVELOPE. Prims (main + exts) define axis-aligned rectangles; we
// UNION them into one footprint and compute the roof as the lower envelope of the EAVE planes (each
// eave throws a plane up at the pitch; roof = min over the eaves a point is inward of). Solving all
// slopes together is what makes the overhang melt into the perpendicular hip-end correctly. GABLE
// caps = an ext's outer edge retagged as a RAKE (no plane there → a vertical gable wall). For all-hip
// this IS the prim model: a hip roof from hip prims = the hip roof of their union footprint.

export type Pt = [number, number];
export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}
export interface PrimRoof {
  roof: THREE.BufferGeometry;
  walls: THREE.BufferGeometry;
  apex: number;
}

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1];
const norm = (a: Pt): Pt => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
const rot90 = (d: Pt): Pt => [-d[1], d[0]];

function pointInPoly(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

export function unionRects(rects: Rect[]): Pt[] {
  const xs = Array.from(new Set(rects.flatMap((r) => [r.x0, r.x1]))).sort((a, b) => a - b);
  const zs = Array.from(new Set(rects.flatMap((r) => [r.z0, r.z1]))).sort((a, b) => a - b);
  const nx = xs.length - 1,
    nz = zs.length - 1;
  const inside = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= nx || j >= nz) return false;
    const cx = (xs[i] + xs[i + 1]) / 2,
      cz = (zs[j] + zs[j + 1]) / 2;
    return rects.some((r) => cx > r.x0 && cx < r.x1 && cz > r.z0 && cz < r.z1);
  };
  const segs: [Pt, Pt][] = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      if (!inside(i, j)) continue;
      if (!inside(i + 1, j)) segs.push([[xs[i + 1], zs[j]], [xs[i + 1], zs[j + 1]]]);
      if (!inside(i - 1, j)) segs.push([[xs[i], zs[j + 1]], [xs[i], zs[j]]]);
      if (!inside(i, j + 1)) segs.push([[xs[i + 1], zs[j + 1]], [xs[i], zs[j + 1]]]);
      if (!inside(i, j - 1)) segs.push([[xs[i], zs[j]], [xs[i + 1], zs[j]]]);
    }
  const key = (p: Pt) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`;
  const from = new Map<string, [Pt, Pt]>();
  for (const s of segs) from.set(key(s[0]), s);
  const loop: Pt[] = [];
  let cur = segs[0][0];
  for (let g = 0; g < segs.length + 2; g++) {
    loop.push(cur);
    const s = from.get(key(cur));
    if (!s) break;
    cur = s[1];
    if (key(cur) === key(loop[0])) break;
  }
  const out: Pt[] = [];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[(i - 1 + loop.length) % loop.length],
      b = loop[i],
      c = loop[(i + 1) % loop.length];
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    if (Math.abs(cross) > 1e-6) out.push(b);
  }
  return out;
}

function geomOf(pos: number[], uv: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// Lower-envelope roof of a footprint. `isRake(i)` → edge i (fp[i]→fp[i+1]) is a gable end (no plane).
export function solveEnvelope(fp: Pt[], isRake: (i: number) => boolean, wallH: number, pitch: number, eaveH?: number[], tile = 2.2): PrimRoof {
  const m = pitch,
    N = fp.length,
    k = Math.sqrt(1 + m * m);
  // each eave throws a plane that STARTS at its own eave height (h0) — raising one eave gives a
  // diminished slope (its plane crosses the others sooner ⇒ shorter rafter, ridge shifted toward it)
  const eaves: { p0: Pt; n: Pt; h0: number }[] = [];
  for (let i = 0; i < N; i++) {
    if (isRake(i)) continue; // rakes throw no plane
    const p0 = fp[i],
      p1 = fp[(i + 1) % N];
    const d = norm(sub(p1, p0));
    let n = rot90(d);
    const mid: Pt = [(p0[0] + p1[0]) / 2 + n[0] * 1e-3, (p0[1] + p1[1]) / 2 + n[1] * 1e-3];
    if (!pointInPoly(mid, fp)) n = [-n[0], -n[1]];
    eaves.push({ p0, n, h0: eaveH?.[i] ?? wallH });
  }
  const inward = (e: { p0: Pt; n: Pt }, x: number, z: number) => dot(e.n, sub([x, z], e.p0));
  const planeH = (e: { p0: Pt; n: Pt; h0: number }, x: number, z: number) => e.h0 + m * inward(e, x, z);
  const heightAt = (x: number, z: number) => {
    let mn = Infinity;
    for (const e of eaves) if (inward(e, x, z) >= -1e-6) mn = Math.min(mn, planeH(e, x, z));
    return isFinite(mn) ? mn : wallH;
  };
  const govN = (x: number, z: number): Pt => {
    let best: Pt = [0, 0],
      bh = Infinity;
    for (const e of eaves)
      if (inward(e, x, z) >= -1e-6) {
        const h = planeH(e, x, z);
        if (h < bh) {
          bh = h;
          best = e.n;
        }
      }
    return best;
  };

  const rpos: number[] = [],
    ruv: number[] = [];
  let apex = wallH;
  const pushV = (p: Pt) => {
    const y = heightAt(p[0], p[1]);
    apex = Math.max(apex, y);
    const n = govN(p[0], p[1]); // UV aligned to the governing slope so shingles run up-slope
    const u = rot90(n);
    rpos.push(p[0], y, p[1]);
    ruv.push(dot(p, u) / tile, (dot(p, n) * k) / tile);
  };
  const base = THREE.ShapeUtils.triangulateShape(fp.map((p) => new THREE.Vector2(p[0], p[1])), []);
  const R = 28;
  for (const [ti, tj, tl] of base) {
    const a = fp[ti],
      b = fp[tj],
      c = fp[tl];
    const P = (i: number, j: number): Pt => [a[0] + ((b[0] - a[0]) * i) / R + ((c[0] - a[0]) * j) / R, a[1] + ((b[1] - a[1]) * i) / R + ((c[1] - a[1]) * j) / R];
    for (let i = 0; i < R; i++)
      for (let j = 0; j < R - i; j++) {
        pushV(P(i, j));
        pushV(P(i + 1, j));
        pushV(P(i, j + 1));
        if (i + j < R - 1) {
          pushV(P(i + 1, j));
          pushV(P(i + 1, j + 1));
          pushV(P(i, j + 1));
        }
      }
  }

  // walls — sample each edge; height = roof height (eaves level, rakes rise into a gable wall)
  const wpos: number[] = [],
    wuv: number[] = [];
  const S = 18;
  for (let i = 0; i < N; i++) {
    const a = fp[i],
      b = fp[(i + 1) % N];
    for (let s = 0; s < S; s++) {
      const pa: Pt = [a[0] + ((b[0] - a[0]) * s) / S, a[1] + ((b[1] - a[1]) * s) / S];
      const pb: Pt = [a[0] + ((b[0] - a[0]) * (s + 1)) / S, a[1] + ((b[1] - a[1]) * (s + 1)) / S];
      const ya = heightAt(pa[0], pa[1]),
        yb = heightAt(pb[0], pb[1]);
      wpos.push(pa[0], 0, pa[1], pb[0], 0, pb[1], pb[0], yb, pb[1], pa[0], 0, pa[1], pb[0], yb, pb[1], pa[0], ya, pa[1]);
      wuv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
    }
  }
  return { roof: geomOf(rpos, ruv), walls: geomOf(wpos, wuv), apex };
}

// A central HIP whose back facet f_a (+Z) is DIMINISHED: its eave is raised by dimRise, so f_a's
// rafter is shorter and the ridge shifts toward it. f_b (−Z) and the two hip ends stay at wallH.
export function buildDiminishedHip(L: number, W: number, wallH: number, pitch: number, dimRise: number): PrimRoof {
  const hLm = L / 2,
    hWm = W / 2;
  const fp: Pt[] = [
    [-hLm, -hWm], // f_b eave (z=−hWm)
    [hLm, -hWm],
    [hLm, hWm], // → f_a eave (z=+hWm), raised
    [-hLm, hWm],
  ];
  const eaveH = [wallH, wallH, wallH + dimRise, wallH]; // edge 2 = f_a, diminished
  return solveEnvelope(fp, () => false, wallH, pitch, eaveH);
}

// ---- MAX-OF-TENTS with CRISP FACETS -----------------------------------------------------------
// Each prim is a COMPLETE tent (host never tampered; ext deleted where the host is taller). At every
// point the roof surface is exactly ONE eave/slope PLANE — the active plane of the winning tent's
// lower envelope. We render explicit FLAT FACETS: the mesher splits triangles at the exact
// plane-equality crossing (the crease) and gives each facet its analytic plane normal ⇒ crisp
// hips/valleys/ridges. (A global lower-envelope of ALL eaves is still wrong — it cuts the host.)

// a roof plane: height field + analytic surface normal + 2-D up-slope (for shingle UV)
export interface Plane {
  h: (x: number, z: number) => number;
  nrm: [number, number, number];
  up: Pt;
}
// build a plane from up-slope direction `u`, a point `base` on its eave, and the eave height h0
function mkPlane(u: Pt, base: Pt, h0: number, pitch: number): Plane {
  const un = norm(u);
  const l = Math.hypot(pitch * un[0], 1, pitch * un[1]) || 1;
  return {
    h: (x, z) => h0 + pitch * ((x - base[0]) * un[0] + (z - base[1]) * un[1]),
    nrm: [(-pitch * un[0]) / l, 1 / l, (-pitch * un[1]) / l],
    up: un,
  };
}

// a tent = the lower envelope (min) of a set of planes within a support; returns the active plane id
// (argmin) so the mesher knows which facet a point belongs to.
type Tent = (x: number, z: number) => { h: number; id: number } | null;
function minTent(ids: number[], planes: Plane[], inSupport: (x: number, z: number) => boolean): Tent {
  return (x, z) => {
    if (!inSupport(x, z)) return null;
    let bh = Infinity,
      bid = -1;
    for (const id of ids) {
      const h = planes[id].h(x, z);
      if (h < bh) ((bh = h), (bid = id));
    }
    return bid < 0 ? null : { h: bh, id: bid };
  };
}
function maxTents(tents: Tent[]): Tent {
  return (x, z) => {
    let best: { h: number; id: number } | null = null;
    for (const t of tents) {
      const s = t(x, z);
      if (s && (!best || s.h > best.h)) best = s;
    }
    return best;
  };
}

// An internal STEP-WALL: a segment a→b with normal `n` pointing to the LOW side. The wall is vertical
// at the segment line, filling from the low surface up to the high surface — this is how a tent's eave
// stays a clean wall (walls eat roofs) instead of the heightfield bridging the gap with a ramp.
interface StepWall {
  a: Pt;
  b: Pt;
  n: Pt;
}

// render the roof as CRISP FLAT FACETS. REGIONS are meshed separately (the surface never bridges a
// prim's hard eave boundary), each sampled from the global max-of-tents `sample`; every fine triangle
// is split at the exact plane-equality crease so each facet is one flat plane with its analytic
// normal. `boundary` (union outline) → walls to ground; `steps` → vertical step-walls (walls eat roofs).
function meshFromTents(regions: Pt[][], boundary: Pt[], steps: StepWall[], sample: Tent, planes: Plane[], wallH: number, tile = 2.2): PrimRoof {
  const heightAt = (x: number, z: number) => {
    const s = sample(x, z);
    return s ? s.h : wallH;
  };
  const idAt = (x: number, z: number) => {
    const s = sample(x, z);
    return s ? s.id : -1;
  };
  const rpos: number[] = [],
    rnrm: number[] = [],
    ruv: number[] = [];
  let apex = wallH;
  // emit one flat triangle of facet `id` — vertex heights/UV come from THAT plane, so it is exactly planar
  const face = (id: number, a: Pt, b: Pt, c: Pt) => {
    const P = planes[id],
      u = rot90(P.up);
    for (const p of [a, b, c]) {
      const y = P.h(p[0], p[1]);
      apex = Math.max(apex, y);
      rpos.push(p[0], y, p[1]);
      rnrm.push(P.nrm[0], P.nrm[1], P.nrm[2]);
      ruv.push(dot(p, u) / tile, dot(p, P.up) / tile);
    }
  };
  // a transitional triangle for the rare triple-point: each vertex sits on ITS OWN plane (no gap)
  const faceVtx = (vs: { p: Pt; id: number }[]) => {
    for (const v of vs) {
      const P = planes[v.id],
        u = rot90(P.up),
        y = P.h(v.p[0], v.p[1]);
      apex = Math.max(apex, y);
      rpos.push(v.p[0], y, v.p[1]);
      rnrm.push(P.nrm[0], P.nrm[1], P.nrm[2]);
      ruv.push(dot(v.p, u) / tile, dot(v.p, P.up) / tile);
    }
  };
  // exact crease point on edge p→q where plane a == plane b (both linear ⇒ one crossing)
  const cross = (a: number, b: number, p: Pt, q: Pt): Pt => {
    const ga = planes[a].h(p[0], p[1]) - planes[b].h(p[0], p[1]);
    const gb = planes[a].h(q[0], q[1]) - planes[b].h(q[0], q[1]);
    let t = ga / (ga - gb);
    if (!isFinite(t)) t = 0.5;
    t = Math.max(0, Math.min(1, t));
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  };
  // exact TRIPLE POINT — (x,z) where planes a == b == c meet (3 linear planes, 2×2 solve). null if degenerate.
  const triple = (a: number, b: number, c: number): Pt | null => {
    const co = (id: number) => {
      const h0 = planes[id].h(0, 0);
      return [planes[id].h(1, 0) - h0, planes[id].h(0, 1) - h0]; // [∂h/∂x, ∂h/∂z]; const term = h0
    };
    const A = co(a),
      B = co(b),
      C = co(c);
    const a0 = planes[a].h(0, 0),
      b0 = planes[b].h(0, 0),
      c0 = planes[c].h(0, 0);
    const m11 = A[0] - B[0],
      m12 = A[1] - B[1],
      r1 = b0 - a0;
    const m21 = B[0] - C[0],
      m22 = B[1] - C[1],
      r2 = c0 - b0;
    const det = m11 * m22 - m12 * m21;
    if (Math.abs(det) < 1e-9) return null;
    return [(r1 * m22 - r2 * m12) / det, (m11 * r2 - m21 * r1) / det];
  };
  const inTri = (p: Pt, a: Pt, b: Pt, c: Pt): boolean => {
    const s = (u: Pt, v: Pt, w: Pt) => (u[0] - w[0]) * (v[1] - w[1]) - (v[0] - w[0]) * (u[1] - w[1]);
    const d1 = s(p, a, b),
      d2 = s(p, b, c),
      d3 = s(p, c, a);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  // split a fine triangle by its vertices' active plane id → crisp facets
  const tri = (p0: Pt, p1: Pt, p2: Pt) => {
    const i0 = idAt(p0[0], p0[1]),
      i1 = idAt(p1[0], p1[1]),
      i2 = idAt(p2[0], p2[1]);
    if (i0 < 0 || i1 < 0 || i2 < 0) return;
    const V = [
      { p: p0, id: i0 },
      { p: p1, id: i1 },
      { p: p2, id: i2 },
    ];
    const ids = [i0, i1, i2];
    if (ids[0] === ids[1] && ids[1] === ids[2]) {
      face(ids[0], p0, p1, p2);
      return;
    }
    if (new Set(ids).size === 2) {
      const oddIdx = ids.findIndex((id) => ids.indexOf(id) === ids.lastIndexOf(id)); // the unique vertex
      const odd = V[oddIdx],
        rest = V.filter((_, k) => k !== oddIdx);
      const A = odd.id,
        B = rest[0].id;
      const c1 = cross(A, B, odd.p, rest[0].p),
        c2 = cross(A, B, odd.p, rest[1].p);
      face(A, odd.p, c1, c2); // the odd plane's corner
      face(B, c1, rest[0].p, rest[1].p); // the shared plane's quad (two tris)
      face(B, c1, rest[1].p, c2);
    } else {
      // 3 distinct facets meet — tile the cell into 3 flat wedges meeting at the exact triple point T,
      // so the facets close with NO gap (the old single-tri fallback left slivers at hip-apex convergences)
      const T = triple(ids[0], ids[1], ids[2]);
      if (T && inTri(T, p0, p1, p2)) {
        const c01 = cross(ids[0], ids[1], p0, p1),
          c12 = cross(ids[1], ids[2], p1, p2),
          c20 = cross(ids[2], ids[0], p2, p0);
        face(ids[0], p0, c01, T);
        face(ids[0], p0, T, c20);
        face(ids[1], p1, c12, T);
        face(ids[1], p1, T, c01);
        face(ids[2], p2, c20, T);
        face(ids[2], p2, T, c12);
      } else {
        faceVtx(V);
      }
    }
  };
  const R = 40; // subdivision (uniform); crease-split + triple-point tiling keep facets crisp
  for (const poly of regions) {
    const tris = THREE.ShapeUtils.triangulateShape(poly.map((p) => new THREE.Vector2(p[0], p[1])), []);
    for (const [ti, tj, tl] of tris) {
      const a = poly[ti],
        b = poly[tj],
        c = poly[tl];
      const P = (i: number, j: number): Pt => [a[0] + ((b[0] - a[0]) * i) / R + ((c[0] - a[0]) * j) / R, a[1] + ((b[1] - a[1]) * i) / R + ((c[1] - a[1]) * j) / R];
      for (let i = 0; i < R; i++)
        for (let j = 0; j < R - i; j++) {
          tri(P(i, j), P(i + 1, j), P(i, j + 1));
          if (i + j < R - 1) tri(P(i + 1, j), P(i + 1, j + 1), P(i, j + 1));
        }
    }
  }

  const wpos: number[] = [],
    wuv: number[] = [];
  const quad = (xa: number, za: number, xb: number, zb: number, yloA: number, yhiA: number, yloB: number, yhiB: number) => {
    wpos.push(xa, yloA, za, xb, yloB, zb, xb, yhiB, zb, xa, yloA, za, xb, yhiB, zb, xa, yhiA, za);
    wuv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  };
  const Sg = 22; // ground walls along the union outline (eave / gable height → 0)
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i],
      b = boundary[(i + 1) % boundary.length];
    for (let s = 0; s < Sg; s++) {
      const pa: Pt = [a[0] + ((b[0] - a[0]) * s) / Sg, a[1] + ((b[1] - a[1]) * s) / Sg];
      const pb: Pt = [a[0] + ((b[0] - a[0]) * (s + 1)) / Sg, a[1] + ((b[1] - a[1]) * (s + 1)) / Sg];
      quad(pa[0], pa[1], pb[0], pb[1], 0, heightAt(pa[0], pa[1]), 0, heightAt(pb[0], pb[1]));
    }
  }
  const Ss = 26, // step-walls: vertical face from the low surface up to the high surface
    eps = 0.04;
  for (const w of steps) {
    for (let s = 0; s < Ss; s++) {
      const pa: Pt = [w.a[0] + ((w.b[0] - w.a[0]) * s) / Ss, w.a[1] + ((w.b[1] - w.a[1]) * s) / Ss];
      const pb: Pt = [w.a[0] + ((w.b[0] - w.a[0]) * (s + 1)) / Ss, w.a[1] + ((w.b[1] - w.a[1]) * (s + 1)) / Ss];
      const hiA = heightAt(pa[0] - eps * w.n[0], pa[1] - eps * w.n[1]),
        loA = heightAt(pa[0] + eps * w.n[0], pa[1] + eps * w.n[1]);
      const hiB = heightAt(pb[0] - eps * w.n[0], pb[1] - eps * w.n[1]),
        loB = heightAt(pb[0] + eps * w.n[0], pb[1] + eps * w.n[1]);
      if (hiA - loA < 1e-3 && hiB - loB < 1e-3) continue; // flat here → no wall
      quad(pa[0], pa[1], pb[0], pb[1], Math.min(loA, hiA), Math.max(loA, hiA), Math.min(loB, hiB), Math.max(loB, hiB));
    }
  }
  const roof = new THREE.BufferGeometry();
  roof.setAttribute("position", new THREE.Float32BufferAttribute(rpos, 3));
  roof.setAttribute("normal", new THREE.Float32BufferAttribute(rnrm, 3));
  roof.setAttribute("uv", new THREE.Float32BufferAttribute(ruv, 2));
  return { roof, walls: geomOf(wpos, wuv), apex };
}

// Central diminished hip + a GABLE EXT off the f_a side at the +X corner — MAX-OF-TENTS with
// WALLS-EAT-ROOFS and crisp facets. Plane table: 0 f_b(−Z), 1 facet I(+Z, raised/diminished),
// 2 +X (the hip end AND the ext's +X slope — coplanar, facet K shared), 3 −X hip end, 4 facet A
// (the ext's −X slope). Central tent = min(f_b,+X,facet I,−X); ext gable = min(facet A,+X). The max
// deletes the ext where the host is taller, leaving the wing; facet A melts into facet I as a short
// valley; the raised facet-I eave eats the wing via a step-wall. `dimFrac` = how much shorter the f_a
// rafter is than f_b's; extA = the −X ewidth endpoint; extLen = how far the wing pokes past the eave.
export function buildDimHipGableExt(L: number, W: number, wallH: number, pitch: number, dimFrac: number, extA: number, extLen: number): PrimRoof {
  const hLm = L / 2,
    hWm = W / 2;
  // diminish by RAFTER FRACTION: f_a rafter = (1−dimFrac)·f_b rafter, f_a+f_b = W ⇒ derive the eave-raise
  const fbRun = W / (2 - dimFrac),
    faRun = (1 - dimFrac) * fbRun;
  const zRidge = hWm - faRun; // ridge shifts +z toward the diminished f_a
  const dimRise = 2 * pitch * zRidge;
  const planes: Plane[] = [
    mkPlane([0, 1], [0, -hWm], wallH, pitch), // 0 f_b (−Z long facet)
    mkPlane([0, -1], [0, hWm], wallH + dimRise, pitch), // 1 facet I (+Z, diminished — raised eave)
    mkPlane([-1, 0], [hLm, 0], wallH, pitch), // 2 +X (hip end + ext +X slope, coplanar)
    mkPlane([1, 0], [-hLm, 0], wallH, pitch), // 3 −X hip end
    mkPlane([1, 0], [extA, 0], wallH, pitch), // 4 facet A (ext −X slope)
  ];
  const inRect = (x: number, z: number) => x >= -hLm - 1e-6 && x <= hLm + 1e-6 && z >= -hWm - 1e-6 && z <= hWm + 1e-6;
  const inWing = (x: number, z: number) => x >= extA - 1e-6 && x <= hLm + 1e-6 && z >= zRidge - 1e-6 && z <= hWm + extLen + 1e-6;
  const central = minTent([0, 2, 1, 3], planes, inRect);
  const ext = minTent([4, 2], planes, inWing); // gable: facet A + the coplanar +X slope
  const sample = maxTents([central, ext]);
  const regions: Pt[][] = [
    [[-hLm, -hWm], [hLm, -hWm], [hLm, hWm], [-hLm, hWm]], // central hip (its own region)
    [[extA, hWm], [hLm, hWm], [hLm, hWm + extLen], [extA, hWm + extLen]], // the wing (separate region)
  ];
  const boundary = unionRects([
    { x0: -hLm, x1: hLm, z0: -hWm, z1: hWm },
    { x0: extA, x1: hLm, z0: hWm, z1: hWm + extLen },
  ]);
  // the central/wing seam at z=hWm, x∈[extA,hLm]: low side is the wing (+z), so the raised f_a eave eats it
  const steps: StepWall[] = [{ a: [extA, hWm], b: [hLm, hWm], n: [0, 1] }];
  return meshFromTents(regions, boundary, steps, sample, planes, wallH);
}

// HALF-HIP OVERHANG off a gable. A sub GABLE (ridge along Z at x=0, span 2S, slopes G[−X] and L[+X])
// + a HALF-HIP ext "hha" off the sub's gable end (z=0), extending into z<0. hha shares slope G
// COPLANAR with the sub (same −X plane, no valley — facet shared) and OVERHANGS on the +X side by
// `ov` (its E slope eave sits at x=S+ov, past the sub's span) so hha is wider ⇒ its ridge is HIGHER
// than the sub's. hha's hip-end D faces +Z (toward the sub). Level eaves throughout. Built by
// MAX-OF-TENTS: the sub tent extends inward under hha; its ridge runs until it meets hha's D facet at
// (0,−S) — which lies on the D–G hip line — so the sub RIDGE flows continuously into the D–G HIP
// (the conjecture). The overhang and continuity both fall out of the max; no special-casing.
export function buildHalfHipOverhang(wallH: number, pitch: number, S: number, ov: number, subLen: number, hhaLen: number): PrimRoof {
  const Hsub = wallH + pitch * S; // sub ridge height
  // plane table: 0 G (sub −X slope, SHARED w/ hha), 1 L (sub +X slope), 2 E (hha +X slope, overhang),
  // 3 D (hha hip-end facing +Z)
  const planes: Plane[] = [
    mkPlane([1, 0], [-S, 0], wallH, pitch), // 0 G: eave x=−S, up-slope +X (shared coplanar)
    mkPlane([-1, 0], [S, 0], wallH, pitch), // 1 L: eave x=+S, up-slope −X
    mkPlane([-1, 0], [S + ov, 0], wallH, pitch), // 2 E: eave x=S+ov, up-slope −X (overhang side)
    mkPlane([0, -1], [0, 0], wallH, pitch), // 3 D: hip-end, eave z=0, up-slope −Z (toward hha body)
  ];
  // sub tent = min(G,L); support extends inward (z<0, under hha) so the ridge reaches the D–G hip
  const inSub = (x: number, z: number) => x >= -S - 1e-6 && x <= S + 1e-6 && z >= -S - 1 - 1e-6 && z <= subLen + 1e-6;
  // hha tent = min(G,E,D); spans the gable end (z=0) down to the cut (z=−hhaLen)
  const inHha = (x: number, z: number) => x >= -S - 1e-6 && x <= S + ov + 1e-6 && z >= -hhaLen - 1e-6 && z <= 1e-6;
  const sub = minTent([0, 1], planes, inSub);
  const hha = minTent([0, 2, 3], planes, inHha);
  const sample = maxTents([sub, hha]);
  const regions: Pt[][] = [
    [[-S, 0], [S, 0], [S, subLen], [-S, subLen]], // sub gable (visible footprint z>0)
    [[-S, -hhaLen], [S + ov, -hhaLen], [S + ov, 0], [-S, 0]], // hha half-hip (z<0)
  ];
  const boundary = unionRects([
    { x0: -S, x1: S, z0: 0, z1: subLen },
    { x0: -S, x1: S + ov, z0: -hhaLen, z1: 0 },
  ]);
  return meshFromTents(regions, boundary, [], sample, planes, wallH);
}

// facet labels for verification: centroid (in plan) of each active-plane region, lifted to the roof,
// tagged with the EagleView letter — so a top-down render reads like the EagleView notes diagram.
export interface CreaseLine {
  a: [number, number, number]; // 3D endpoint
  b: [number, number, number];
  n1: [number, number, number]; // the two adjacent facet normals (for cap draping)
  n2: [number, number, number];
}
export interface LabeledRoof extends PrimRoof {
  labels: { id: string; plane: number; pos: [number, number, number] }[];
  planes: Plane[];
  boundary: Pt[];
  eaveY: number;
  creases: CreaseLine[]; // analytic hips + ridges (full lines, no mesh fragments)
  heightAt: (x: number, z: number) => number; // roof-surface height at a plan point (for overhang/fascia/soffit)
}
function facetLabels(sample: Tent, idName: Record<number, string>, x0: number, x1: number, z0: number, z1: number): { id: string; plane: number; pos: [number, number, number] }[] {
  const acc: Record<number, { sx: number; sz: number; n: number }> = {};
  const N = 96;
  for (let i = 0; i <= N; i++)
    for (let j = 0; j <= N; j++) {
      const x = x0 + ((x1 - x0) * i) / N,
        z = z0 + ((z1 - z0) * j) / N;
      const s = sample(x, z);
      if (!s) continue;
      const a = acc[s.id] ?? (acc[s.id] = { sx: 0, sz: 0, n: 0 });
      a.sx += x;
      a.sz += z;
      a.n++;
    }
  const out: { id: string; plane: number; pos: [number, number, number] }[] = [];
  for (const k in acc) {
    const id = +k,
      a = acc[id];
    const cx = a.sx / a.n,
      cz = a.sz / a.n;
    const s = sample(cx, cz);
    out.push({ id: idName[id] ?? String(id), plane: id, pos: [cx, (s ? s.h : 0) + 0.5, cz] });
  }
  return out;
}

// ---- ANALYTIC FACET-MAP (pristine, resolution-independent) ------------------------------------
// Each tent = {planeIds, support RECT}. A facet (plane P in tent T) is the EXACT polygon:
//   base = T.rect ∩ ⋂_{Q∈T}{P ≤ Q}   (P's lower-envelope cell — convex, via half-plane clipping)
//   minus, for every OTHER tent U, the region where U strictly wins: U.rect ∩ ⋂_{q∈U}{P < U_q}.
// Facet P (clipped by {P≤Q}) and facet Q (by {Q≤P}) share the EXACT crease line; valleys are shared at
// ties; triple points are exact half-plane intersections ⇒ NO gaps/slivers/seams at ANY zoom.
interface TentSpec {
  ids: number[];
  rect: Rect;
}
function meshFromTentsExact(tents: TentSpec[], planes: Plane[], boundary: Pt[], wallH: number, tile = 2.2): PrimRoof {
  const EPS = 1e-7;
  // clip convex polygon to { val(p) ≤ 0 } (val linear). Returns the clipped (still convex) polygon.
  const clipHalf = (poly: Pt[], val: (p: Pt) => number): Pt[] => {
    const out: Pt[] = [],
      n = poly.length;
    for (let i = 0; i < n; i++) {
      const A = poly[i],
        B = poly[(i + 1) % n],
        va = val(A),
        vb = val(B);
      if (va <= EPS) out.push(A);
      if ((va < -EPS && vb > EPS) || (va > EPS && vb < -EPS)) {
        const t = va / (va - vb);
        out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
      }
    }
    return out;
  };
  const rectPoly = (r: Rect): Pt[] => [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]];
  const hP = (id: number, p: Pt) => planes[id].h(p[0], p[1]);

  const rpos: number[] = [],
    rnrm: number[] = [],
    ruv: number[] = [];
  let apex = wallH;
  const emitFacet = (id: number, poly: Pt[]) => {
    if (poly.length < 3) return;
    const P = planes[id],
      u = rot90(P.up);
    for (let i = 1; i + 1 < poly.length; i++) {
      for (const p of [poly[0], poly[i], poly[i + 1]]) {
        const y = P.h(p[0], p[1]);
        apex = Math.max(apex, y);
        rpos.push(p[0], y, p[1]);
        rnrm.push(P.nrm[0], P.nrm[1], P.nrm[2]);
        ruv.push(dot(p, u) / tile, dot(p, P.up) / tile);
      }
    }
  };

  for (const T of tents) {
    for (const P of T.ids) {
      let base = rectPoly(T.rect);
      for (const Q of T.ids) if (Q !== P) base = clipHalf(base, (p) => hP(P, p) - hP(Q, p));
      if (base.length < 3) continue;
      let pieces: Pt[][] = [base];
      for (const U of tents) {
        if (U === T) continue;
        // B = the convex region where U strictly wins over P: U.rect ∩ ⋂_q {P < U_q}
        const cons: ((p: Pt) => number)[] = [
          (p) => U.rect.x0 - p[0],
          (p) => p[0] - U.rect.x1,
          (p) => U.rect.z0 - p[1],
          (p) => p[1] - U.rect.z1,
          ...U.ids.map((q) => (p: Pt) => hP(P, p) - hP(q, p)),
        ];
        const next: Pt[][] = [];
        for (const piece of pieces) {
          // piece \ B = ⋃_k ( piece ∩ {cons_k ≥ 0} ∩ ⋂_{j<k} {cons_j < 0} )
          let remaining = piece;
          for (const ck of cons) {
            const outside = clipHalf(remaining, (p) => -ck(p)); // where cons_k ≥ 0 ⇒ outside B
            if (outside.length >= 3) next.push(outside);
            remaining = clipHalf(remaining, ck); // keep the part still inside cons_k
            if (remaining.length < 3) break;
          }
          // `remaining` (inside ALL cons ⇒ inside B, i.e. U wins) is discarded
        }
        pieces = next;
        if (!pieces.length) break;
      }
      for (const piece of pieces) emitFacet(P, piece);
    }
  }

  // heightfield sampler (for the walls) = the same max-of-(min-over-tent) the facets came from
  const sampleH = (x: number, z: number) => {
    let best = -Infinity;
    for (const T of tents) {
      if (x < T.rect.x0 - 1e-6 || x > T.rect.x1 + 1e-6 || z < T.rect.z0 - 1e-6 || z > T.rect.z1 + 1e-6) continue;
      let mn = Infinity;
      for (const id of T.ids) mn = Math.min(mn, planes[id].h(x, z));
      best = Math.max(best, mn);
    }
    return isFinite(best) ? best : wallH;
  };
  const wpos: number[] = [],
    wuv: number[] = [];
  const Sg = 24;
  for (let i = 0; i < boundary.length; i++) {
    const a = boundary[i],
      b = boundary[(i + 1) % boundary.length];
    for (let s = 0; s < Sg; s++) {
      const pa: Pt = [a[0] + ((b[0] - a[0]) * s) / Sg, a[1] + ((b[1] - a[1]) * s) / Sg];
      const pb: Pt = [a[0] + ((b[0] - a[0]) * (s + 1)) / Sg, a[1] + ((b[1] - a[1]) * (s + 1)) / Sg];
      const ya = sampleH(pa[0], pa[1]),
        yb = sampleH(pb[0], pb[1]);
      wpos.push(pa[0], 0, pa[1], pb[0], 0, pb[1], pb[0], yb, pb[1], pa[0], 0, pa[1], pb[0], yb, pb[1], pa[0], ya, pa[1]);
      wuv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
    }
  }
  const roof = new THREE.BufferGeometry();
  roof.setAttribute("position", new THREE.Float32BufferAttribute(rpos, 3));
  roof.setAttribute("normal", new THREE.Float32BufferAttribute(rnrm, 3));
  roof.setAttribute("uv", new THREE.Float32BufferAttribute(ruv, 2));
  return { roof, walls: geomOf(wpos, wuv), apex };
}

// CRESTRIDGE reconstruction (19428 Crestridge Dr, EagleView 68324055). Built prim-by-prim from
// Antonio's decomposition (p1 central hip + p2 north half-hip + p4/p3 SE + p5/p6 SW). One shared plane
// table, composed by MAX-OF-TENTS. Proportional dims first (validate topology), then refine to feet.
// +X = east (right in the plan), +Z = north (up in the plan), all pitch 8/12.
// ---- ANALYTIC HIP/RIDGE LINES ----------------------------------------------------------------
// Hips & ridges are EXACTLY the edges where two planes of the SAME tent are equal AND on the surface (the
// lower-envelope creases). Computed from the same exact facet polygons the mesher emits, then each plane-pair's
// edges are interval-merged along the crease direction ⇒ ONE full line per hip/ridge (no mesh fragments, no
// T-junction gaps, nothing missed). Valleys (inter-tent ties) and eaves/rakes don't satisfy {P==Q, Q∈tent}.
function hipRidgeCreases(tents: TentSpec[], planes: Plane[]): CreaseLine[] {
  const EPS = 1e-7;
  const clipHalf = (poly: Pt[], val: (p: Pt) => number): Pt[] => {
    const out: Pt[] = [], n = poly.length;
    for (let i = 0; i < n; i++) {
      const A = poly[i], B = poly[(i + 1) % n], va = val(A), vb = val(B);
      if (va <= EPS) out.push(A);
      if ((va < -EPS && vb > EPS) || (va > EPS && vb < -EPS)) {
        const t = va / (va - vb);
        out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
      }
    }
    return out;
  };
  const rectPoly = (r: Rect): Pt[] => [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]];
  const hP = (id: number, p: Pt) => planes[id].h(p[0], p[1]);
  const surfaceH = (x: number, z: number) => {
    let best = -Infinity;
    for (const T of tents) {
      if (x < T.rect.x0 - 1e-6 || x > T.rect.x1 + 1e-6 || z < T.rect.z0 - 1e-6 || z > T.rect.z1 + 1e-6) continue;
      let mn = Infinity;
      for (const id of T.ids) mn = Math.min(mn, planes[id].h(x, z));
      best = Math.max(best, mn);
    }
    return best;
  };
  // the plane id that IS the final surface at (x,z) = argmax-over-tents of (argmin-over-ids)
  const activePlane = (x: number, z: number): number => {
    let best = -Infinity, bid = -1;
    for (const T of tents) {
      if (x < T.rect.x0 - 1e-6 || x > T.rect.x1 + 1e-6 || z < T.rect.z0 - 1e-6 || z > T.rect.z1 + 1e-6) continue;
      let mn = Infinity, mid = -1;
      for (const id of T.ids) { const h = planes[id].h(x, z); if (h < mn) { mn = h; mid = id; } }
      if (mn > best) { best = mn; bid = mid; }
    }
    return bid;
  };
  // collect crease edges per (tent, P<Q) plane-pair, exactly as the facets are clipped
  const groups = new Map<string, { P: number; Q: number; pts: Pt[] }>();
  tents.forEach((T, ti) => {
    for (const P of T.ids) {
      let base = rectPoly(T.rect);
      for (const Q of T.ids) if (Q !== P) base = clipHalf(base, (p) => hP(P, p) - hP(Q, p));
      if (base.length < 3) continue;
      let pieces: Pt[][] = [base];
      for (const U of tents) {
        if (U === T) continue;
        const cons: ((p: Pt) => number)[] = [
          (p) => U.rect.x0 - p[0],
          (p) => p[0] - U.rect.x1,
          (p) => U.rect.z0 - p[1],
          (p) => p[1] - U.rect.z1,
          ...U.ids.map((q) => (p: Pt) => hP(P, p) - hP(q, p)),
        ];
        const next: Pt[][] = [];
        for (const piece of pieces) {
          let remaining = piece;
          for (const ck of cons) {
            const outside = clipHalf(remaining, (p) => -ck(p));
            if (outside.length >= 3) next.push(outside);
            remaining = clipHalf(remaining, ck);
            if (remaining.length < 3) break;
          }
        }
        pieces = next;
        if (!pieces.length) break;
      }
      for (const piece of pieces) {
        const n = piece.length;
        for (let i = 0; i < n; i++) {
          const A = piece[i], B = piece[(i + 1) % n];
          const mid: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
          const hm = hP(P, mid);
          if (Math.abs(surfaceH(mid[0], mid[1]) - hm) > 2e-3) continue; // hidden under a wing ⇒ no cap
          for (const Q of T.ids) {
            if (P >= Q) continue; // record each pair once, from the lower-id facet
            if (Math.abs(hm - hP(Q, mid)) > 1e-4) continue; // edge not on {P==Q} ⇒ eave/rake/valley, skip
            // STRUCTURAL guard: both sides of the edge must really be facets P and Q on the FINAL surface. Else the
            // line is over-extending into a region a THIRD prim owns (tracing a constituent prim's hip, not the whole
            // structure's hip) ⇒ drop it. An off-roof side (−1, the perimeter) is not penalized.
            const ex = B[0] - A[0], ez = B[1] - A[1], el = Math.hypot(ex, ez) || 1;
            const sx = -ez / el, sz = ex / el, dd = 0.3; // unit perpendicular to the edge, in plan
            const a1: Pt = [mid[0] + sx * dd, mid[1] + sz * dd], a2: Pt = [mid[0] - sx * dd, mid[1] - sz * dd];
            const pLo = hP(P, a1) <= hP(Q, a1); // facet P sits on the lower-plane side of the crease
            const apP = activePlane(...(pLo ? a1 : a2)), apQ = activePlane(...(pLo ? a2 : a1));
            if ((apP !== -1 && apP !== P) || (apQ !== -1 && apQ !== Q)) continue;
            const key = ti + "|" + P + "|" + Q;
            let g = groups.get(key);
            if (!g) groups.set(key, (g = { P, Q, pts: [] }));
            g.pts.push(A, B);
            break;
          }
        }
      }
    }
  });
  // span each pair's collinear edges (interval-merge, bridging ≤0.5 ft T-junction gaps) into full lines
  const out: CreaseLine[] = [];
  type E = { lo: number; hi: number; plo: Pt; phi: Pt };
  for (const g of Array.from(groups.values())) {
    const uP = planes[g.P].up, uQ = planes[g.Q].up;
    const gx = uP[0] - uQ[0], gz = uP[1] - uQ[1]; // ∝ ∇(hP−hQ); crease runs perpendicular to it
    const dl = Math.hypot(gx, gz) || 1;
    const dn: Pt = [-gz / dl, gx / dl];
    const pr = (p: Pt) => p[0] * dn[0] + p[1] * dn[1];
    const edges: E[] = [];
    for (let i = 0; i + 1 < g.pts.length; i += 2) {
      const A = g.pts[i], B = g.pts[i + 1], tA = pr(A), tB = pr(B);
      edges.push(tA <= tB ? { lo: tA, hi: tB, plo: A, phi: B } : { lo: tB, hi: tA, plo: B, phi: A });
    }
    edges.sort((a, b) => a.lo - b.lo);
    const flush = (e: E) => {
      if (e.hi - e.lo < 0.2) return;
      out.push({
        a: [e.plo[0], planes[g.P].h(e.plo[0], e.plo[1]), e.plo[1]],
        b: [e.phi[0], planes[g.P].h(e.phi[0], e.phi[1]), e.phi[1]],
        n1: planes[g.P].nrm,
        n2: planes[g.Q].nrm,
      });
    };
    let cur: E | null = null;
    for (const e of edges) {
      if (!cur) cur = { ...e };
      else if (e.lo <= cur.hi + 0.5) { if (e.hi > cur.hi) { cur.hi = e.hi; cur.phi = e.phi; } }
      else { flush(cur); cur = { ...e }; }
    }
    if (cur) flush(cur);
  }
  return out;
}

// JUNCTION-GRAPH trim. A hip/ridge that ENDS free in mid-slope — not at an eave, and not at a NODE shared with another
// crease — is a residual: the constituent prim's line running a little past the structural turn. Trim that end back to
// the nearest node (where another crease meets this one). Ends at an eave (low y) or a shared node (e.g. a hip dying
// INTO a ridge) are left alone — that distinction is what protects the legitimate terminations.
function trimResidualEnds(cr: CreaseLine[], eaveY: number): CreaseLine[] {
  type P3 = [number, number, number];
  const SNAP = 0.9, MAXTRIM = 5.5, N = 20;
  const d3 = (a: P3, b: P3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const distToSeg = (p: P3, a: P3, b: P3) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L2 = dx * dx + dy * dy + dz * dz || 1;
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy + (p[2] - a[2]) * dz) / L2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t), p[2] - (a[2] + dz * t));
  };
  const meetsOther = (p: P3, self: number) => {
    for (let j = 0; j < cr.length; j++) {
      if (j === self) continue;
      if (d3(p, cr[j].a) < SNAP || d3(p, cr[j].b) < SNAP) return true; // another crease's endpoint = a node
      if (distToSeg(p, cr[j].a, cr[j].b) < SNAP) return true; // another crease's interior crosses here = a node
    }
    return false;
  };
  const out: CreaseLine[] = [];
  for (let i = 0; i < cr.length; i++) {
    let a: P3 = [cr[i].a[0], cr[i].a[1], cr[i].a[2]], b: P3 = [cr[i].b[0], cr[i].b[1], cr[i].b[2]];
    for (let side = 0; side < 2; side++) {
      const E: P3 = side === 0 ? a : b, F: P3 = side === 0 ? b : a;
      if (E[1] < eaveY + 3) continue; // at an eave → keep
      if (meetsOther(E, i)) continue; // at a node → keep
      for (let k = 1; k <= N; k++) { // free end: walk inward to the nearest node, trim there
        const t = k / N;
        const Pp: P3 = [E[0] + (F[0] - E[0]) * t, E[1] + (F[1] - E[1]) * t, E[2] + (F[2] - E[2]) * t];
        if (meetsOther(Pp, i)) {
          if (d3(E, Pp) < MAXTRIM) { if (side === 0) a = Pp; else b = Pp; }
          break;
        }
      }
    }
    if (d3(a, b) > 0.5) out.push({ a, b, n1: cr[i].n1, n2: cr[i].n2 });
  }
  return out;
}

// STAGE 2: p1 (central HIP, ridge N-S, I diminished) + p2 (NORTH half-hip H/J/L). p2 spawns north off
// p1's north end (F), its EAST slope coplanar with L (shared), west slope H, north hip-end J. It melds
// into F (the host wins where taller) — degenerating F into the long NW facet.
export function buildCrestridge(wallH = 2.6): LabeledRoof {
  const pitch = 8 / 12;
  // GROUNDED IN EAGLEVIEW FEET (68324055 length diagram): p1 core ≈ 52 ft E-W × 46 ft N-S ⇒ long axis
  // E-W ⇒ ridge runs E-W with length 52−46 = 6 ft (the "+6" ridge). K=W side, L=E side (the big coplanar
  // faces extended by the wings), F=N side, I=S side (diminished). +X=east, +Z=north.
  const Wx = 26, // p1 E-W half-width (52 ft: west eave −26 .. east eave +26)
    Wz = 23; // p1 N-S half-width (46 ft); ridge E-W, length 2(Wx−Wz)=6 ✓ the "+6"
  const dimI = 2.0; // facet I (south side) DIMINISHED — eave raised (modest)
  const p2W = -14, // p2 west eave x (H): 12 ft east of K@−26 ⇒ the measured "12" step
    p2N = 38; // p2 north eave z (J hip-end): 40 ft wide (−14..+26), 15 ft north of p1 (the "15" west eave)
  const planes: Plane[] = [
    mkPlane([1, 0], [-Wx, 0], wallH, pitch), // 0 K — west side (faces −X)
    mkPlane([-1, 0], [Wx, 0], wallH, pitch), // 1 L — east side (faces +X) — SHARED coplanar with p2
    mkPlane([0, -1], [0, Wz], wallH, pitch), // 2 F — north end (faces +Z)
    mkPlane([0, 1], [0, -Wz], wallH + dimI, pitch), // 3 I — south end (faces −Z), diminished
    mkPlane([1, 0], [p2W, 0], wallH, pitch), // 4 H — p2 west slope (faces −X)
    mkPlane([0, -1], [0, p2N], wallH, pitch), // 5 J — p2 north hip-end (faces +Z)
    // SE wing (p3 half-hip G/E/D). Ridge N-S ("11"); overhangs p1's east (L@+26) by +9 (E@+35);
    // south end = gable (17+17=34 wide); north hip-end D melds into p1's south slope I.
    mkPlane([1, 0], [1, 0], wallH, pitch), // 6 G — SE west slope (faces −X), shared with p4. eave x=1 (gable 34 w/ E@35)
    mkPlane([-1, 0], [35, 0], wallH, pitch), // 7 E — SE east slope (faces +X), overhang +9 past L@26
    mkPlane([0, -1], [0, -17], wallH, pitch), // 8 D — SE north hip-end (faces +Z); eave z=−17 (the +9 overhang north)
    // SW wing (p5 sub C/B/K + p6 gable A/K). Both coplanar with p1 at K (west, id 0). Small; melds into
    // p1's diminished I (south). p6 spawns from p5. Ridges N-S; south ends are gables (rakes 12/12).
    mkPlane([-1, 0], [-16, 0], wallH, pitch), // 9  A — p6 gable east slope (faces +X), melds into I
    mkPlane([-1, 0], [-8, 0], wallH, pitch), // 10 B — p5 sub east slope (faces +X)
    mkPlane([0, 1], [0, -32], wallH, pitch), // 11 C — p5 sub south hip-end (faces −Z)
  ];
  const inP1 = (x: number, z: number) => x >= -Wx - 1e-6 && x <= Wx + 1e-6 && z >= -Wz - 1e-6 && z <= Wz + 1e-6;
  // p2 extends inward (south) under p1, melding into F; hidden where p1 (F) is taller. Bounded at z=0
  // (p1's E-W ridge line) so it can't cross to the south slope.
  const inP2 = (x: number, z: number) => x >= p2W - 1e-6 && x <= Wx + 1e-6 && z >= 0 - 1e-6 && z <= p2N + 1e-6;
  // SE wing p3 (half-hip): G(west)+E(east overhang)+D(north hip-end). Extends south to the gable (zSeS),
  // hip-end D melds into p1's south. East overhangs to x=35 (past L@26). South end zSeS is a gable (rake).
  const seW = 1,
    seE = 35,
    zSeS = -42; // SE: west eave x=1, east eave x=35 (gable 34 wide), south gable z=−42 ⇒ E eave 25 (the "25")
  const zDEave = -17; // facet D (SE hip-end) eave — the +9 overhang's north perimeter (z=−17)
  const inP3 = (x: number, z: number) => x >= seW - 1e-6 && x <= seE + 1e-6 && z >= zSeS - 1e-6 && z <= zDEave + 1e-6;
  // p4 (gable SUB, G/L): east slope = L (coplanar p1), west slope = G (coplanar p3). It melds into p1
  // AND hosts p3 — the required intermediate so p3 has a defined host to spawn from (build order main→sub→ext).
  const inP4 = (x: number, z: number) => x >= seW - 1e-6 && x <= Wx + 1e-6 && z >= zSeS - 1e-6 && z <= -8 + 1e-6;
  // SW wing: p5 (sub C/B/K) + p6 (gable A/K). Both share K (west, id 0) coplanar w/ p1; meld into I.
  const swW = -26, // = −Wx (K, coplanar with p1's west) ; SW shares the west face, no west overhang
    swE = -8, // p5 east extent
    zSwS = -34; // SW south gable z
  const inP5 = (x: number, z: number) => x >= swW - 1e-6 && x <= swE + 1e-6 && z >= zSwS - 1e-6 && z <= -16 + 1e-6;
  const inP6 = (x: number, z: number) => x >= swW - 1e-6 && x <= -16 + 1e-6 && z >= zSwS - 1e-6 && z <= -16 + 1e-6;
  const p1 = minTent([0, 1, 2, 3], planes, inP1);
  const p2 = minTent([1, 4, 5], planes, inP2); // L(east, shared) + H(west) + J(north hip-end)
  const p4 = minTent([1, 6], planes, inP4); // SE SUB gable: L(east, coplanar p1) + G(west, coplanar p3)
  const p3 = minTent([6, 7, 8], planes, inP3); // SE EXT half-hip: G(west, coplanar p4) + E(east overhang) + D(hip-end)
  const p5 = minTent([0, 10, 11], planes, inP5); // SW SUB: K(west, coplanar p1) + B(east) + C(south hip-end)
  const p6 = minTent([0, 9], planes, inP6); // SW EXT gable: K(west, coplanar p1) + A(east, melds into I)
  const sample = maxTents([p1, p2, p4, p5, p3, p6]); // hierarchy order: main → subs → exts (for the labels)
  const boundary = unionRects([
    { x0: -Wx, x1: Wx, z0: -Wz, z1: Wz }, // p1
    { x0: p2W, x1: Wx, z0: Wz, z1: p2N }, // p2 (north)
    { x0: seW, x1: seE, z0: zSeS, z1: -Wz }, // SE south band
    { x0: Wx, x1: seE, z0: -Wz, z1: zDEave }, // SE overhang
    { x0: swW, x1: swE, z0: zSwS, z1: -Wz }, // SW south band
  ]);
  // ANALYTIC FACET-MAP: each tent = {planeIds, support RECT}. Rects MUST match the in* support bounds.
  const tents: TentSpec[] = [
    { ids: [0, 1, 2, 3], rect: { x0: -Wx, x1: Wx, z0: -Wz, z1: Wz } }, // p1
    { ids: [1, 4, 5], rect: { x0: p2W, x1: Wx, z0: 0, z1: p2N } }, // p2
    { ids: [1, 6], rect: { x0: seW, x1: Wx, z0: zSeS, z1: -8 } }, // p4 (SE sub)
    { ids: [6, 7, 8], rect: { x0: seW, x1: seE, z0: zSeS, z1: zDEave } }, // p3 (SE half-hip)
    { ids: [0, 10, 11], rect: { x0: swW, x1: swE, z0: zSwS, z1: -16 } }, // p5 (SW sub)
    { ids: [0, 9], rect: { x0: swW, x1: -16, z0: zSwS, z1: -16 } }, // p6 (SW gable)
  ];
  const idName: Record<number, string> = { 0: "K", 1: "L", 2: "F", 3: "I", 4: "H", 5: "J", 6: "G", 7: "E", 8: "D", 9: "A", 10: "B", 11: "C" };
  const labels = facetLabels(sample, idName, -Wx, seE, zSeS, p2N);
  const heightAt = (x: number, z: number): number => {
    let best = -Infinity;
    for (const T of tents) {
      if (x < T.rect.x0 - 1e-6 || x > T.rect.x1 + 1e-6 || z < T.rect.z0 - 1e-6 || z > T.rect.z1 + 1e-6) continue;
      let mn = Infinity;
      for (const id of T.ids) mn = Math.min(mn, planes[id].h(x, z));
      best = Math.max(best, mn);
    }
    return isFinite(best) ? best : wallH;
  };
  return { ...meshFromTentsExact(tents, planes, boundary, wallH), labels, planes, boundary, eaveY: wallH, creases: trimResidualEnds(hipRidgeCreases(tents, planes), wallH), heightAt };
}

// ---- prim driver -------------------------------------------------------------------------------
export interface PrimExt {
  side: "+z" | "-z";
  a: number;
  b: number;
  length: number;
  cap: "hip" | "gable";
}
export function buildPrimRoof(mainL: number, mainW: number, wallH: number, pitch: number, exts: PrimExt[]): PrimRoof {
  const hLm = mainL / 2,
    hWm = mainW / 2;
  const rects: Rect[] = [{ x0: -hLm, x1: hLm, z0: -hWm, z1: hWm }];
  const rakeSegs: { z: number; x0: number; x1: number }[] = [];
  for (const e of exts) {
    if (e.side === "+z") {
      rects.push({ x0: e.a, x1: e.b, z0: hWm, z1: hWm + e.length });
      if (e.cap === "gable") rakeSegs.push({ z: hWm + e.length, x0: e.a, x1: e.b });
    } else {
      rects.push({ x0: e.a, x1: e.b, z0: -(hWm + e.length), z1: -hWm });
      if (e.cap === "gable") rakeSegs.push({ z: -(hWm + e.length), x0: e.a, x1: e.b });
    }
  }
  const fp = unionRects(rects);
  const isRake = (i: number) => {
    const a = fp[i],
      b = fp[(i + 1) % fp.length];
    if (Math.abs(a[1] - b[1]) > 1e-6) return false; // rake outer ends are horizontal (const z)
    const mx = (a[0] + b[0]) / 2,
      z = a[1];
    return rakeSegs.some((r) => Math.abs(r.z - z) < 1e-6 && mx > r.x0 - 1e-6 && mx < r.x1 + 1e-6);
  };
  return solveEnvelope(fp, isRake, wallH, pitch);
}
