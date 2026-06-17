/**
 * roof-valleys.ts — M3 (iterate on M2's feedback): MEASURE valley footage, don't COUNT corners.
 *
 * M2 iteration-1 taught us: the reflex-corner COUNT off the 0.1m mask is noisy (spurious corners on a
 * clean rectangle; a min-edge filter then killed REAL short notch edges). The feedback: stop counting,
 * start MEASURING the valley each corner actually spawns — a spurious mask-noise corner has ~zero valley
 * behind it, so the measurement IS the filter (self-cleaning).
 *
 * METHOD: for a uniform-pitch roof, surface height(p) = DT(p)*tan(pitch), where DT = distance to the
 * nearest eave (the "tent"). The valley is the crease climbing INWARD from a reflex (notch) corner up to
 * the ridge — i.e. the steepest-ascent ridge-line of DT emanating from that corner. So: gradient-ascend
 * the DT from each reflex corner to its local max; the path's plan-run × √(1+s²/2) = the valley's true feet.
 *
 * Run:  npx tsx server/scripts/roof-valleys.ts
 */
import 'dotenv/config';
import { fromArrayBuffer } from 'geotiff';
import { geocode } from '../estimate/measure';

const M2F = 3.280839895; // meters → feet
const ROOFS = [
  { slug: '3605  (gable)', address: '3605 SE 57th Cir, Oklahoma City, OK 73135', ev: 0, evHip: 31.29, pitch: 6 },
  { slug: 'Lee   (flush)', address: '6320 N Warren Avenue, Warr Acres, OK', ev: 39.13, evHip: 0, pitch: 6 },
  { slug: 'Hinkle(hip)', address: '4024 N Nicklas Avenue, Oklahoma City, OK', ev: 47.9, evHip: 148.47, pitch: 6 },
  { slug: 'Crest (hip)', address: '19428 Crestridge Dr, Edmond, OK 73012', ev: 87, evHip: 191, pitch: 8 },
];
const valMult = (pitch12: number) => { const s = pitch12 / 12; return Math.sqrt(1 + (s * s) / 2); };

async function dataLayers(lat: number, lng: number, key: string) {
  const u = new URL('https://solar.googleapis.com/v1/dataLayers:get');
  u.searchParams.set('location.latitude', String(lat)); u.searchParams.set('location.longitude', String(lng));
  u.searchParams.set('radiusMeters', '30'); u.searchParams.set('view', 'IMAGERY_LAYERS');
  u.searchParams.set('requiredQuality', 'HIGH'); u.searchParams.set('pixelSizeMeters', '0.1'); u.searchParams.set('key', key);
  const r = await fetch(u.toString()); const d: any = await r.json();
  if (!r.ok) throw new Error(`dataLayers ${r.status}`);
  return d as { maskUrl: string };
}
async function fetchRaster(url: string, key: string) {
  const r = await fetch(`${url}&key=${key}`); if (!r.ok) throw new Error(`geoTiff ${r.status}`);
  const img = await (await fromArrayBuffer(await r.arrayBuffer())).getImage();
  const [rx] = img.getResolution(); const rasters = await img.readRasters({ interleave: false });
  return { band: rasters[0] as unknown as Float32Array, width: img.getWidth(), height: img.getHeight(), resX: Math.abs(rx) };
}
function isolateRoof(band: any, w: number, h: number): Uint8Array {
  const isB = (i: number) => band[i] > 0; let seed = ((h / 2) | 0) * w + ((w / 2) | 0);
  if (!isB(seed)) { const cx = (w / 2) | 0, cy = (h / 2) | 0; let best = -1, bd = Infinity; for (let y = Math.max(0, cy - 60); y < Math.min(h, cy + 60); y++) for (let x = Math.max(0, cx - 60); x < Math.min(w, cx + 60); x++) { const i = y * w + x; if (isB(i)) { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bd) { bd = d; best = i; } } } seed = best; }
  const roof = new Uint8Array(w * h); if (seed < 0) return roof; const st = [seed]; roof[seed] = 1;
  while (st.length) { const i = st.pop()!; const x = i % w, y = (i / w) | 0; for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (n >= 0 && !roof[n] && isB(n)) { roof[n] = 1; st.push(n); } }
  return roof;
}
function trace(roof: Uint8Array, w: number, h: number): number[][] {
  const get = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? roof[y * w + x] : 0);
  let sx = -1, sy = -1; for (let y = 0; y < h && sx < 0; y++) for (let x = 0; x < w; x++) if (roof[y * w + x]) { sx = x; sy = y; break; }
  if (sx < 0) return [];
  const N = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const out: number[][] = [[sx, sy]]; let cx = sx, cy = sy, bx = sx - 1, by = sy, guard = 0;
  do {
    let di = N.findIndex((d) => d[0] === bx - cx && d[1] === by - cy); if (di < 0) di = 6;
    let found = -1, px = bx, py = by;
    for (let k = 1; k <= 8; k++) { const idx = (di + k) % 8; const nx = cx + N[idx][0], ny = cy + N[idx][1]; if (get(nx, ny)) { found = idx; bx = px; by = py; cx = nx; cy = ny; break; } px = nx; py = ny; }
    if (found < 0) break; out.push([cx, cy]);
  } while (!(cx === sx && cy === sy) && ++guard < w * h * 8);
  return out;
}
function dp(pts: number[][], eps: number): number[][] {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0; const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) { const dd = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len; if (dd > dmax) { dmax = dd; idx = i; } }
  if (dmax > eps) return dp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(dp(pts.slice(idx), eps));
  return [pts[0], pts[pts.length - 1]];
}
function simplifyClosed(ring: number[][], eps: number): number[][] {
  let pts = ring; if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts = pts.slice(0, -1);
  if (pts.length < 4) return pts; let fi = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; fi = i; } }
  return dp(pts.slice(0, fi + 1), eps).slice(0, -1).concat(dp(pts.slice(fi).concat([pts[0]]), eps).slice(0, -1));
}

/** Chamfer distance transform (1, √2). Returns DT in FEET (0 outside roof). */
function distanceTransform(roof: Uint8Array, w: number, h: number, resX: number): Float32Array {
  const INF = 1e9; const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = roof[i] ? INF : 0;
  const upd = (i: number, j: number, c: number) => { if (d[j] + c < d[i]) d[i] = d[j] + c; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (d[i] === 0) continue;
    if (x > 0) upd(i, i - 1, 1); if (y > 0) upd(i, i - w, 1);
    if (x > 0 && y > 0) upd(i, i - w - 1, Math.SQRT2); if (x < w - 1 && y > 0) upd(i, i - w + 1, Math.SQRT2); }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (d[i] === 0) continue;
    if (x < w - 1) upd(i, i + 1, 1); if (y < h - 1) upd(i, i + w, 1);
    if (x < w - 1 && y < h - 1) upd(i, i + w + 1, Math.SQRT2); if (x > 0 && y < h - 1) upd(i, i + w - 1, Math.SQRT2); }
  const ft = resX * M2F; for (let i = 0; i < w * h; i++) d[i] *= ft;
  return d;
}

/**
 * Gradient-ascend the DT from (sx,sy). The valley climbs roughly STRAIGHT (~45° in plan) from the
 * reflex corner up to the first interior NODE, where it meets a ridge/hip and BENDS to follow it to the
 * summit. So we stop at the bend: once a heading is established, terminate when the step deviates > 50°.
 * Returns the path's PLAN length (px) up to the node — the valley run, NOT the run to the global peak.
 */
function ascend(d: Float32Array, w: number, h: number, sx: number, sy: number, stopAtBend = true): number {
  let x = sx, y = sy, lenPx = 0, guard = 0; const seen = new Set<number>();
  let hx = 0, hy = 0, settled = 0; // established heading
  while (guard++ < 6000) {
    seen.add(y * w + x);
    let bx = x, by = y, bv = d[y * w + x];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; if (seen.has(ny * w + nx)) continue;
      const v = d[ny * w + nx]; if (v > bv) { bv = v; bx = nx; by = ny; }
    }
    if (bx === x && by === y) break; // local max = ridge summit (a HIP ends here → no bend-stop needed)
    const sx2 = bx - x, sy2 = by - y, sl = Math.hypot(sx2, sy2) || 1;
    if (stopAtBend && settled >= 2) { // VALLEY: its node is NOT a peak → stop at the bend (>~38°) where it meets a ridge
      const dot = (sx2 / sl) * hx + (sy2 / sl) * hy;
      if (dot < 0.78) break;
    }
    hx = (hx * settled + sx2 / sl) / (settled + 1); hy = (hy * settled + sy2 / sl) / (settled + 1);
    const hl = Math.hypot(hx, hy) || 1; hx /= hl; hy /= hl; settled++;
    lenPx += sl; x = bx; y = by;
  }
  return lenPx;
}

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  console.log('\n  M3 — MEASURE valley feet (gradient-ascend DT from each reflex corner to the ridge):\n');
  for (const r of ROOFS) {
    try {
      const { location } = await geocode(r.address, key);
      const dl = await dataLayers(location.lat, location.lng, key);
      const mask = await fetchRaster(dl.maskUrl, key);
      const roof = isolateRoof(mask.band, mask.width, mask.height);
      const { width: w, height: h, resX } = mask;
      const dt = distanceTransform(roof, w, h, resX);
      const simp = simplifyClosed(trace(roof, w, h), 0.4 / resX);
      const n = simp.length;
      let area2 = 0; for (let i = 0; i < n; i++) { const a = simp[i], b = simp[(i + 1) % n]; area2 += a[0] * b[1] - b[0] * a[1]; }
      const ccw = area2 > 0;
      const pxToFt = resX * M2F, mult = valMult(r.pitch);
      const lens: number[] = []; let total = 0;       // valleys (reflex corners)
      const hLens: number[] = []; let hipTotal = 0;    // hips (convex corners) — same machine, convex seed
      for (let i = 0; i < n; i++) {
        const p = simp[(i - 1 + n) % n], c = simp[i], q = simp[(i + 1) % n];
        const ix = c[0] - p[0], iy = c[1] - p[1], ox = q[0] - c[0], oy = q[1] - c[1];
        const il = Math.hypot(ix, iy) || 1, ol = Math.hypot(ox, oy) || 1;
        const cross = (ix * oy - iy * ox) / (il * ol);
        if (Math.abs((Math.asin(Math.max(-1, Math.min(1, cross))) * 180) / Math.PI) < 20) continue;
        const reflex = ccw ? cross < 0 : cross > 0;
        // VALLEY: stop at the bend (node). HIP: climb to the ridge peak (local max), no bend-stop.
        const trueFt = ascend(dt, w, h, c[0], c[1], reflex) * pxToFt * mult; // hip & valley share √(1+s²/2)
        if (reflex) { lens.push(Math.round(trueFt)); total += trueFt; }
        else { hLens.push(Math.round(trueFt)); hipTotal += trueFt; }
      }
      const dpct = r.ev > 0 ? `${(((total - r.ev) / r.ev) * 100 >= 0 ? '+' : '')}${(((total - r.ev) / r.ev) * 100).toFixed(0)}%` : (total < 5 ? '✓ ~0' : `false +${total.toFixed(0)}`);
      const hpct = r.evHip != null ? (r.evHip > 0 ? `${(((hipTotal - r.evHip) / r.evHip) * 100 >= 0 ? '+' : '')}${(((hipTotal - r.evHip) / r.evHip) * 100).toFixed(0)}%` : (hipTotal < 5 ? '✓ ~0' : `false +${hipTotal.toFixed(0)}`)) : 'n/a';
      console.log(`  ${r.slug.padEnd(20)} valleys [${lens.join(', ') || '—'}] → ${total.toFixed(0)} (EV ${r.ev}, ${dpct})   |   hips [${hLens.join(', ') || '—'}] → ${hipTotal.toFixed(0)} (EV ${r.evHip ?? '?'}, ${hpct})`);
    } catch (e: any) { console.log(`  ${r.slug}: ✗ ${e?.message || e}`); }
  }
  console.log('\n  read the per-corner [lengths]: spurious corners should self-clean (~0 ft); real valleys carry the footage.\n');
}
main();
