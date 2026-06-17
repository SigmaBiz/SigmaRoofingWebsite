/**
 * roof-corners.ts — M2 KILL-TEST: do the footprint's REFLEX corners predict valleys?
 * Deterministic (no Anthropic). Walk the traced+simplified outline, classify each corner convex
 * (→hip) vs reflex (→valley) by turn direction. Validate: no-valley roof (3605) → ~0 reflex;
 * valley roofs (Lee/Hinkle/Crestridge) → reflex count rising with valley footage.
 * Run:  npx tsx server/scripts/roof-corners.ts
 */
import 'dotenv/config';
import { fromArrayBuffer } from 'geotiff';
import { geocode } from '../estimate/measure';

const ROOFS = [
  { slug: '3605  (EV valleys 0  — CONTROL)', address: '3605 SE 57th Cir, Oklahoma City, OK 73135', ev: 0 },
  { slug: 'Lee   (EV valleys 39)', address: '6320 N Warren Avenue, Warr Acres, OK', ev: 39.13 },
  { slug: 'Hinkle(EV valleys 48)', address: '4024 N Nicklas Avenue, Oklahoma City, OK', ev: 47.9 },
  { slug: 'Crest (EV valleys 87)', address: '19428 Crestridge Dr, Edmond, OK 73012', ev: 87 },
];

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

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  console.log('\n  M2 — reflex (valley-spawning) vs convex (hip-spawning) corners from the footprint:\n');
  for (const r of ROOFS) {
    try {
      const { location } = await geocode(r.address, key);
      const dl = await dataLayers(location.lat, location.lng, key);
      const mask = await fetchRaster(dl.maskUrl, key);
      const roof = isolateRoof(mask.band, mask.width, mask.height);
      const simp = simplifyClosed(trace(roof, mask.width, mask.height), 0.4 / mask.resX);
      const n = simp.length;
      let area2 = 0; for (let i = 0; i < n; i++) { const a = simp[i], b = simp[(i + 1) % n]; area2 += a[0] * b[1] - b[0] * a[1]; }
      const ccw = area2 > 0;
      let convex = 0, reflex = 0;
      for (let i = 0; i < n; i++) {
        const p = simp[(i - 1 + n) % n], c = simp[i], q = simp[(i + 1) % n];
        const ix = c[0] - p[0], iy = c[1] - p[1], ox = q[0] - c[0], oy = q[1] - c[1];
        const il = Math.hypot(ix, iy) || 1, ol = Math.hypot(ox, oy) || 1;
        // NOTE: a min-edge-length filter (il/ol > 15px) was tried to kill 3605's spurious reflex corners — it
        // REGRESSED (Hinkle 4→1 reflex: real short notch edges on complex roofs got dropped). Raw-mask reflex
        // COUNT at 0.1m is too coarse to be a clean quantitative valley predictor. Kept filter-free; see DOCTRINE.
        const cross = (ix * oy - iy * ox) / (il * ol);                  // sin(turn angle)
        if (Math.abs((Math.asin(Math.max(-1, Math.min(1, cross))) * 180) / Math.PI) < 20) continue; // near-straight = noise
        if (ccw ? cross < 0 : cross > 0) reflex++; else convex++;
      }
      console.log(`  ${r.slug.padEnd(34)} ${n} verts → ${String(convex).padStart(2)} convex, ${String(reflex).padStart(2)} REFLEX`);
    } catch (e: any) { console.log(`  ${r.slug}: ✗ ${e?.message || e}`); }
  }
  console.log('\n  PASS if: control 3605 ≈ 0 reflex, and reflex count rises with valley footage.\n');
}
main();
