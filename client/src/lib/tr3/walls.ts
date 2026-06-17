// Wall recession (the overhang's first half — decoupled from fascia/soffit per METHOD pointwise). Recede the perimeter
// walls inward by a per-EDGE offset: eaves by U.eave, rakes by U.rake. An edge is an EAVE if the roof runs ~level along
// it, a RAKE (gable edge) if the roof slopes along it — classified by heightAt variance. Returns just the walls
// (ground → roof underside at the receded line); no fascia/soffit yet. (ROOF-GEOMETRY-RULES.md: U_e=18", U_r=12".)
import * as THREE from "three";

type Pt = [number, number];
type HeightFn = (x: number, z: number) => number;

// EAVE (level) vs RAKE (sloped, e.g. a gable end) — by how much the roof height varies along the edge.
function isRake(a: Pt, b: Pt, heightAt: HeightFn): boolean {
  // Sample the edge's INTERIOR only. The endpoints are corners where an adjacent TALLER facet (e.g. diminished facet I)
  // can spike heightAt, which would mis-flag a level eave as a rake. (Same root cause as the fascia/soffit spike guard.)
  let lo = Infinity, hi = -Infinity;
  for (let s = 1; s < 8; s++) {
    const t = s / 8, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
    const h = heightAt(x, z);
    lo = Math.min(lo, h); hi = Math.max(hi, h);
  }
  return hi - lo > 0.75; // ~level → eave; clearly sloped → rake
}

// Per-edge inward inset: offset edge i along its inward normal by d[i], re-intersect neighbours (mixed offsets are fine,
// e.g. eaves in / rakes at 0 → a clean diagonal at the corner between them).
function insetPerEdge(poly: Pt[], d: number[]): Pt[] {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const ccw = area > 0;
  const lp: Pt[] = [], ld: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    let dx = b[0] - a[0], dz = b[1] - a[1];
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const nx = ccw ? -dz : dz, nz = ccw ? dx : -dx; // inward normal
    lp.push([a[0] + nx * d[i], a[1] + nz * d[i]]); ld.push([dx, dz]);
  }
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i - 1 + n) % n;
    const p1 = lp[j], d1 = ld[j], p2 = lp[i], d2 = ld[i];
    const den = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(den) < 1e-9) { out.push(p2); continue; }
    const t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den;
    out.push([p1[0] + d1[0] * t, p1[1] + d1[1] * t]);
  }
  return out;
}

export function recedeWalls(boundary: Pt[], heightAt: HeightFn, U: { eave: number; rake: number }, skip?: (a: Pt, b: Pt) => boolean, yClip?: { lo?: number; hi?: number }): THREE.BufferGeometry {
  const n = boundary.length;
  const d = boundary.map((a, i) => (isRake(a, boundary[(i + 1) % n], heightAt) ? U.rake : U.eave));
  const inB = insetPerEdge(boundary, d);
  const Sg = 24, pos: number[] = [], uv: number[] = [];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  for (let i = 0; i < inB.length; i++) {
    if (skip && skip(boundary[i], boundary[(i + 1) % n])) continue; // edge built elsewhere (e.g. the unified diminished-eave wall)
    const a = inB[i], b = inB[(i + 1) % inB.length];
    // EAVE walls: an eave's roof is LEVEL, so clamp the wall top to the edge's MIN heightAt. This kills the `heightAt`
    // SPIKE where a taller facet (a diminished facet at a notch corner) overlaps the receded line — without it the wall
    // shoots up to that facet and PIERCES the overhang/tongue. RAKE walls follow the slope per sample.
    const isEaveEdge = d[i] === U.eave;
    let eaveY = Infinity;
    if (isEaveEdge) for (let s = 0; s <= Sg; s++) { const p = lerp(a, b, s / Sg); eaveY = Math.min(eaveY, heightAt(p[0], p[1])); }
    const lo = yClip?.lo ?? 0, hi = yClip?.hi ?? Infinity; // vertical clip → split a wall into e.g. a stone base (hi=eave) + a siding gable (lo=eave)
    for (let s = 0; s < Sg; s++) {
      const pa = lerp(a, b, s / Sg), pb = lerp(a, b, (s + 1) / Sg);
      const ya0 = isEaveEdge ? eaveY : heightAt(pa[0], pa[1]), yb0 = isEaveEdge ? eaveY : heightAt(pb[0], pb[1]);
      const ya = Math.max(lo, Math.min(ya0, hi)), yb = Math.max(lo, Math.min(yb0, hi)); // clip the [0,roof] band to [lo,hi]
      if (ya <= lo + 1e-4 && yb <= lo + 1e-4) continue; // nothing in [lo,hi] on this segment (e.g. below the gable triangle)
      pos.push(pa[0], lo, pa[1], pb[0], lo, pb[1], pb[0], yb, pb[1], pa[0], lo, pa[1], pb[0], yb, pb[1], pa[0], ya, pa[1]);
      uv.push(pa[0] + pa[1], lo, pb[0] + pb[1], lo, pb[0] + pb[1], yb, pa[0] + pa[1], lo, pb[0] + pb[1], yb, pa[0] + pa[1], ya);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// FASCIA — a board hung off the WHOLE roof edge (the original boundary, where the roof still ends), dropping `drop` ft
// straight down. Follows heightAt, so it's level on eaves and follows the slope on rake (gable) edges. The soffit (later)
// closes from this board's bottom back to the receded wall.
export function buildFascia(boundary: Pt[], heightAt: HeightFn, drop: number, skip?: (a: Pt, b: Pt) => boolean): THREE.BufferGeometry {
  const n = boundary.length, Sg = 24, pos: number[] = [], uv: number[] = [];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  for (let i = 0; i < n; i++) {
    if (skip && skip(boundary[i], boundary[(i + 1) % n])) continue; // facet I's eave fascia is built by the dedicated continuous one
    const a = boundary[i], b = boundary[(i + 1) % n];
    for (let s = 0; s < Sg; s++) {
      const pa = lerp(a, b, s / Sg), pb = lerp(a, b, (s + 1) / Sg);
      let ya = heightAt(pa[0], pa[1]), yb = heightAt(pb[0], pb[1]);
      // SPIKE GUARD: near a corner where a taller facet (e.g. diminished facet I) overlaps this edge, heightAt returns
      // that facet, not the edge's own eave — so the fascia twists up to it. A sudden jump (≫ any eave/rake slope) is
      // that spike; clamp to the lower (true-eave) value so the fascia stays level. (See ROOF-GEOMETRY-RULES.md.)
      if (Math.abs(ya - yb) > 1.2) ya = yb = Math.min(ya, yb);
      pos.push(pa[0], ya, pa[1], pb[0], yb, pb[1], pb[0], yb - drop, pb[1], pa[0], ya, pa[1], pb[0], yb - drop, pb[1], pa[0], ya - drop, pa[1]);
      uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// SOFFIT — close the overhang underside from the fascia bottom (at the roof edge) back to the receded wall. Eave soffits
// are horizontal (held at the fascia-bottom level); rake (gable) soffits follow the rake's slope. Same per-edge classify
// + inset as the walls, so it lands on them exactly.
export function buildSoffit(boundary: Pt[], heightAt: HeightFn, U: { eave: number; rake: number }, drop: number, skip?: (a: Pt, b: Pt) => boolean): THREE.BufferGeometry {
  const n = boundary.length;
  const rake = boundary.map((a, i) => isRake(a, boundary[(i + 1) % n], heightAt));
  const inB = insetPerEdge(boundary, rake.map((r) => (r ? U.rake : U.eave)));
  const Sg = 24, pos: number[] = [], uv: number[] = [];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  for (let i = 0; i < n; i++) {
    if (skip && skip(boundary[i], boundary[(i + 1) % n])) continue; // facet I's eave soffit is built by the dedicated continuous one
    const a = boundary[i], b = boundary[(i + 1) % n], ai = inB[i], bi = inB[(i + 1) % n], isR = rake[i];
    for (let s = 0; s < Sg; s++) {
      const pa = lerp(a, b, s / Sg), pb = lerp(a, b, (s + 1) / Sg);
      const pai = lerp(ai, bi, s / Sg), pbi = lerp(ai, bi, (s + 1) / Sg);
      let ha = heightAt(pa[0], pa[1]), hb = heightAt(pb[0], pb[1]);
      if (Math.abs(ha - hb) > 1.2) ha = hb = Math.min(ha, hb); // SPIKE GUARD (same as the fascia): no twist where a taller facet overlaps the eave at a corner
      const ya = ha - drop, yb = hb - drop; // outer edge = fascia bottom
      const yia = isR ? heightAt(pai[0], pai[1]) - drop : ya; // inner: rake follows the slope; eave held flat
      const yib = isR ? heightAt(pbi[0], pbi[1]) - drop : yb;
      pos.push(pa[0], ya, pa[1], pb[0], yb, pb[1], pbi[0], yib, pbi[1], pa[0], ya, pa[1], pbi[0], yib, pbi[1], pai[0], yia, pai[1]);
      uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// The UNIFIED wall under a diminished facet's eave (Antonio's single-wall fix). ONE wall along the whole exposed eave
// (z=eaveZ, x∈[xL,xR]), receded `recede` toward −W (+z here), dropping from the roof underside at the receded line down
// to the FIRST surface below facet I's eave — `firstBelow(x)` returns it: ground (0) in the open gap, the lower roof's
// height in the notch stretches. Replaces the boundary gap-eave wall + the static notch seam-fill with one object.
export function buildDiminishedEaveWall(
  eaveZ: number, xL: number, xR: number, recede: number, heightAt: HeightFn, firstBelow: (x: number) => number
): THREE.BufferGeometry {
  const zR = eaveZ + recede, N = 140, pos: number[] = [], uv: number[] = [];
  for (let i = 0; i < N; i++) {
    const xa = xL + (xR - xL) * (i / N), xb = xL + (xR - xL) * ((i + 1) / N);
    const ba = firstBelow(xa), bb = firstBelow(xb);     // wall bottom = first surface below the eave (ground / lower roof)
    const ta = heightAt(xa, zR), tb = heightAt(xb, zR); // wall top = roof underside at the receded line
    pos.push(xa, ba, zR, xb, bb, zR, xb, tb, zR, xa, ba, zR, xb, tb, zR, xa, ta, zR);
    uv.push(xa + zR, ba, xb + zR, bb, xb + zR, tb, xa + zR, ba, xb + zR, tb, xa + zR, ta);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// FASCIA along a diminished facet's WHOLE eave (the continuous version — runs the entire exposed eave, gap + notch, so it
// no longer breaks). A board at z=eaveZ dropping `drop` from the eave, CLIPPED so it never dips below the first surface
// beneath it (firstBelow) — in the notch it tapers to nothing as the wing roof rises to meet the eave.
export function buildDiminishedEaveFascia(
  eaveZ: number, xL: number, xR: number, heightAt: HeightFn, firstBelow: (x: number) => number, drop: number
): THREE.BufferGeometry {
  const N = 140, pos: number[] = [], uv: number[] = [];
  for (let i = 0; i < N; i++) {
    const xa = xL + (xR - xL) * (i / N), xb = xL + (xR - xL) * ((i + 1) / N);
    const ea = heightAt(xa, eaveZ), eb = heightAt(xb, eaveZ);                                   // facet I eave = fascia top
    const ba = Math.max(ea - drop, firstBelow(xa)), bb = Math.max(eb - drop, firstBelow(xb));   // clip at the surface below
    pos.push(xa, ea, eaveZ, xb, eb, eaveZ, xb, bb, eaveZ, xa, ea, eaveZ, xb, bb, eaveZ, xa, ba, eaveZ);
    uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// NOTCH TONGUE (roof slope) — extends a wing's roof NORTH into the notch, sliding under the diminished facet's raised
// eave, from the eave line (zSouth) to the receded wall behind it (zNorth = eaveZ+recede). The wings are z-independent
// planes, so the tongue height is firstBelow(x) at every z. x∈[xL,xR] is the stretch where the wing sits below the
// diminished eave (firstBelow rises to meet the eave at xR). (Prim-interface rule: lower prim runs under the higher eave.)
export function buildNotchTongueRoof(
  zSouth: number, zNorth: number, xL: number, xR: number, firstBelow: (x: number) => number, up: [number, number], tile: number
): THREE.BufferGeometry {
  const N = 80, pos: number[] = [], uv: number[] = [];
  // UV MUST match the main roof's facet mapping so the shingle reads CONTINUOUS: the solver uses
  // (dot(p, rot90(up))/tile, dot(p, up)/tile) per facet (solver2 `emitFacet`). rot90(d)=[-d[1],d[0]]. Same up + tile here.
  const ax = -up[1], az = up[0]; // rot90(up): the across-slope axis
  const UV = (x: number, z: number): [number, number] => [(x * ax + z * az) / tile, (x * up[0] + z * up[1]) / tile];
  for (let i = 0; i < N; i++) {
    const xa = xL + (xR - xL) * (i / N), xb = xL + (xR - xL) * ((i + 1) / N);
    const ya = firstBelow(xa), yb = firstBelow(xb);
    const A = UV(xa, zSouth), B = UV(xb, zSouth), C = UV(xb, zNorth), D = UV(xa, zNorth);
    pos.push(xa, ya, zSouth, xb, yb, zSouth, xb, yb, zNorth, xa, ya, zSouth, xb, yb, zNorth, xa, ya, zNorth);
    uv.push(A[0], A[1], B[0], B[1], C[0], C[1], A[0], A[1], C[0], C[1], D[0], D[1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// NOTCH TONGUE (eave fascia + soffit) — finishes the tongue's exposed eave edge the same way the rest of the wing eave is
// finished, extended the `recede` distance into the notch (z∈[zSouth,zNorth]). The wing's notch-facing edge (x=eaveX) is a
// level eave (the wing plane is z-independent → constant height), so: a fascia board dropping `drop` from the eave, then a
// horizontal soffit back to the receded wall at x = eaveX + inwardSign·recede. (inwardSign = +1 for a −x-facing eave, −1 for +x.)
export function buildNotchTongueEave(eaveX: number, inwardSign: number, zSouth: number, zNorth: number, eaveY: number, recede: number, drop: number): THREE.BufferGeometry {
  const yb = eaveY - drop, xIn = eaveX + inwardSign * recede, pos: number[] = [], uv: number[] = [];
  // fascia — vertical board at the eave, dropping `drop`
  pos.push(eaveX, eaveY, zSouth, eaveX, eaveY, zNorth, eaveX, yb, zNorth, eaveX, eaveY, zSouth, eaveX, yb, zNorth, eaveX, yb, zSouth);
  uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  // soffit — horizontal at the fascia bottom, back to the receded wall
  pos.push(eaveX, yb, zSouth, eaveX, yb, zNorth, xIn, yb, zNorth, eaveX, yb, zSouth, xIn, yb, zNorth, xIn, yb, zSouth);
  uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// END CAP — closes the open END of a diminished facet's eave overhang where it abuts a wing at the inside corner. The
// eave overhang is a box (fascia front @ z=eaveZ, receded wall back @ z=eaveZ+recede, soffit on top); at each notch
// corner its x-facing end is open (the see-through seam). A single vertical quad in the x=xc plane closes it, from the
// ground (yBottom) up to the roof underside at the receded line (yTop = heightAt(xc, eaveZ+recede)).
export function buildDiminishedEaveEndCap(eaveZ: number, recede: number, xc: number, yBottom: number, yTop: number): THREE.BufferGeometry {
  const zR = eaveZ + recede;
  const pos = [xc, yBottom, eaveZ, xc, yTop, eaveZ, xc, yTop, zR, xc, yBottom, eaveZ, xc, yTop, zR, xc, yBottom, zR];
  const uv = [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

// SOFFIT along a diminished facet's WHOLE eave — closes the overhang underside from the eave fascia (z=eaveZ) back to the
// receded wall (z=eaveZ+recede), held flat at the fascia-bottom level (ea-drop). Clipped where the surface below has
// already risen to that level (the notch stretch, where the wing roof meets the eave → no underside left), matching the
// continuous fascia's taper. Its inner edge lands on the diminished-eave wall (drop-to-first-surface), closing the gap.
export function buildDiminishedEaveSoffit(
  eaveZ: number, xL: number, xR: number, recede: number, heightAt: HeightFn, firstBelow: (x: number) => number, drop: number
): THREE.BufferGeometry {
  const zR = eaveZ + recede, N = 140, pos: number[] = [], uv: number[] = [];
  for (let i = 0; i < N; i++) {
    const xa = xL + (xR - xL) * (i / N), xb = xL + (xR - xL) * ((i + 1) / N);
    const ya = heightAt(xa, eaveZ) - drop, yb = heightAt(xb, eaveZ) - drop; // flat at the fascia-bottom level
    if (ya <= firstBelow(xa) && yb <= firstBelow(xb)) continue;             // the surface below has risen above the soffit → no underside here
    pos.push(xa, ya, eaveZ, xb, yb, eaveZ, xb, yb, zR, xa, ya, eaveZ, xb, yb, zR, xa, ya, zR); // outer @ fascia, inner @ wall
    uv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
