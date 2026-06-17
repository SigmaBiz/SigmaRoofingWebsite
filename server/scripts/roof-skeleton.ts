/**
 * roof-skeleton.ts — THE OUTSIDE-THE-BOX MODEL (challenge the constraint, don't accept it).
 *
 * The DSM-segmentation crease takeoff collapsed (Z₁: noise-bound, Lee +122%). This routes creases
 * through the SURVIVOR instead: the reliable roof OUTLINE. For a uniform-pitch roof, the surface is
 * EXACTLY the footprint's distance field × tan(pitch) (a geometric contract = Z₂). So: take the mask
 * footprint, distance-transform it -> a CLEAN synthetic roof surface (no sensor noise), and read the
 * creases off that. The seams of a noise-free surface can't over-segment.
 *
 * Pareto core under test (C1): "roof is uniform-pitch" -> skeleton = truth. Hammer with the 4 roofs.
 *
 * Run:  npx tsx server/scripts/roof-skeleton.ts ["address"]
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fromArrayBuffer } from 'geotiff';
import { geocode, computeMeasurement } from '../estimate/measure';

const FT = 3.28084;
const ADDRESS = process.argv[2] || '19428 Crestridge Dr, Edmond, OK 73012';
const GT = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'server/estimate/ground-truth.json'), 'utf8'));
const LIN = (GT.find((e: any) => e.address === ADDRESS)?.eagleview?.linear) || {};

async function dataLayers(lat: number, lng: number, key: string) {
  const u = new URL('https://solar.googleapis.com/v1/dataLayers:get');
  u.searchParams.set('location.latitude', String(lat)); u.searchParams.set('location.longitude', String(lng));
  u.searchParams.set('radiusMeters', '30'); u.searchParams.set('view', 'IMAGERY_LAYERS');
  u.searchParams.set('requiredQuality', 'HIGH'); u.searchParams.set('pixelSizeMeters', '0.1'); u.searchParams.set('key', key);
  const r = await fetch(u.toString()); const d: any = await r.json();
  if (!r.ok) throw new Error(`dataLayers ${r.status}: ${d?.error?.message || ''}`);
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

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  const { location } = await geocode(ADDRESS, key);
  const m = await computeMeasurement(ADDRESS, key);
  const rise = parseInt(m.totals.predominant_pitch, 10) || 6;
  const slope = rise / 12; // tan(pitch)
  const dl = await dataLayers(location.lat, location.lng, key);
  const mask = await fetchRaster(dl.maskUrl, key);
  const { width: w, height: h, resX } = mask;
  const roof = isolateRoof(mask.band, w, h);

  // ---- distance transform (two-pass chamfer), in pixels ----
  const dt = new Float32Array(w * h); const INF = 1e9; const S = Math.SQRT2;
  for (let i = 0; i < w * h; i++) dt[i] = roof[i] ? INF : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!roof[i]) continue; let v = dt[i]; if (x > 0) v = Math.min(v, dt[i - 1] + 1); if (y > 0) v = Math.min(v, dt[i - w] + 1); if (x > 0 && y > 0) v = Math.min(v, dt[i - w - 1] + S); if (x < w - 1 && y > 0) v = Math.min(v, dt[i - w + 1] + S); dt[i] = v; }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!roof[i]) continue; let v = dt[i]; if (x < w - 1) v = Math.min(v, dt[i + 1] + 1); if (y < h - 1) v = Math.min(v, dt[i + w] + 1); if (x < w - 1 && y < h - 1) v = Math.min(v, dt[i + w + 1] + S); if (x > 0 && y < h - 1) v = Math.min(v, dt[i + w - 1] + S); dt[i] = v; }

  // ---- synthetic uniform-pitch surface (meters) = DT * tan(pitch) ----
  const z = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) z[i] = roof[i] ? dt[i] * resX * slope : 0;
  // light smooth to tame the chamfer's facets
  for (let p = 0; p < 1; p++) { const nz = Float32Array.from(z); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (!roof[i]) continue; let s = 0, c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = i + dy * w + dx; if (roof[j]) { s += z[j]; c++; } } if (c) nz[i] = s / c; } z.set(nz); }

  // ---- crease detection on the CLEAN synthetic surface (same pipeline as roof-creases) ----
  const ok = roof;
  const normal = (x: number, y: number): [number, number, number] => { const i = y * w + x; const gx = (x > 0 && x < w - 1 && ok[i - 1] && ok[i + 1]) ? (z[i + 1] - z[i - 1]) / (2 * resX) : 0; const gy = (y > 0 && y < h - 1 && ok[i - w] && ok[i + w]) ? (z[i + w] - z[i - w]) / (2 * resX) : 0; const l = Math.hypot(gx, gy, 1); return [-gx / l, -gy / l, 1 / l]; };
  const TH = Math.cos((16 * Math.PI) / 180);
  const label = new Int32Array(w * h).fill(-1); const meanN0: [number, number, number][] = [];
  for (let i = 0; i < w * h; i++) { if (!ok[i] || label[i] >= 0) continue; const id = meanN0.length; const sn = normal(i % w, (i / w) | 0); const q = [i]; label[i] = id; const acc: [number, number, number] = [0, 0, 0]; while (q.length) { const j = q.pop()!; const x = j % w, y = (j / w) | 0; const nj = normal(x, y); acc[0] += nj[0]; acc[1] += nj[1]; acc[2] += nj[2]; for (const k of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1]) { if (k < 0 || !ok[k] || label[k] >= 0) continue; const nk = normal(k % w, (k / w) | 0); if (nk[0] * sn[0] + nk[1] * sn[1] + nk[2] * sn[2] > TH) { label[k] = id; q.push(k); } } } const ln = Math.hypot(acc[0], acc[1], acc[2]) || 1; meanN0.push([acc[0] / ln, acc[1] / ln, acc[2] / ln]); }
  const parent = Array.from({ length: meanN0.length }, (_, i) => i); const find = (a: number): number => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; }; const MERGE = Math.cos((9 * Math.PI) / 180);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!ok[i]) continue; const A = label[i]; if (A < 0) continue; for (const k of [x < w - 1 ? i + 1 : -1, y < h - 1 ? i + w : -1]) { if (k < 0 || !ok[k]) continue; const B = label[k]; if (B < 0 || B === A) continue; const a = find(A), b = find(B); if (a === b) continue; const dd = meanN0[A][0] * meanN0[B][0] + meanN0[A][1] * meanN0[B][1] + meanN0[A][2] * meanN0[B][2]; if (dd > MERGE) parent[Math.max(a, b)] = Math.min(a, b); } }
  const idOf = new Map<number, number>(); const accN: [number, number, number][] = []; const size: number[] = [];
  for (let i = 0; i < w * h; i++) { if (label[i] < 0) continue; const r = find(label[i]); let id = idOf.get(r); if (id === undefined) { id = accN.length; idOf.set(r, id); accN.push([0, 0, 0]); size.push(0); } label[i] = id; const nn = normal(i % w, (i / w) | 0); accN[id][0] += nn[0]; accN[id][1] += nn[1]; accN[id][2] += nn[2]; size[id]++; }
  const meanN = accN.map((a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] as [number, number, number]; });
  const MIN = 120;
  const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  let ridge = 0, hip = 0, valley = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!ok[i]) continue; const A = label[i]; if (A < 0 || size[A] < MIN) continue;
    for (const [k, dx, dy] of [[i + 1, 1, 0], [i + w, 0, 1]] as [number, number, number][]) {
      const nx = x + dx, ny = y + dy; if (nx >= w || ny >= h || !ok[k]) continue; const B = label[k]; if (B < 0 || B === A || size[B] < MIN) continue;
      const d = cross(meanN[A], meanN[B]); const hxy = Math.hypot(d[0], d[1]) || 1e-6;
      const theta = Math.atan2(d[1], d[0]); const stair = Math.abs(Math.cos(theta)) + Math.abs(Math.sin(theta));
      const segFt = (resX / stair) * FT; const incline = (Math.atan2(Math.abs(d[2]), hxy) * 180) / Math.PI;
      const px = -d[1] / hxy, py = d[0] / hxy; const mx = x + dx * 0.5, my = y + dy * 0.5; const step = 4;
      const inb = (xx: number, yy: number) => xx >= 0 && yy >= 0 && xx < w && yy < h && ok[yy * w + xx];
      const xa = Math.round(mx + px * step), ya = Math.round(my + py * step), xb = Math.round(mx - px * step), yb = Math.round(my - py * step);
      const sA = inb(xa, ya), sB = inb(xb, yb); if (!sA && !sB) continue;
      const zC = (z[i] + z[k]) / 2; const sideV = sA && sB ? (z[ya * w + xa] + z[yb * w + xb]) / 2 : sA ? z[ya * w + xa] : z[yb * w + xb];
      if (zC < sideV - 0.04) valley += segFt; else if (zC > sideV + 0.04) { if (incline < 8) ridge += segFt; else hip += segFt; }
    }
  }
  const nF = size.filter((s) => s >= MIN).length;
  const pct = (a: number, b: number) => (b ? `${a - b >= 0 ? '+' : ''}${(((a - b) / b) * 100).toFixed(0)}%` : 'n/a');
  const cmp = (lab: string, ours: number, t: any) => `  ${lab}: ${ours.toFixed(0).padStart(3)} ft` + (t != null ? ` | truth ${t} ft  (${pct(ours, t)})` : '');
  console.log(`\n  ROOF SKELETON (synthetic DT surface, pitch ${rise}/12) — ${ADDRESS}\n`);
  console.log(`  facets: ${nF}`);
  console.log(cmp('ridges     ', ridge, LIN.ridges));
  console.log(cmp('hips       ', hip, LIN.hips));
  console.log(cmp('valleys    ', valley, LIN.valleys));
  if (LIN.ridges != null && LIN.hips != null) console.log(cmp('ridges+hips', ridge + hip, LIN.ridges + LIN.hips));
  console.log('');
}
main().catch((e) => { console.error(e?.message || e); process.exit(1); });
