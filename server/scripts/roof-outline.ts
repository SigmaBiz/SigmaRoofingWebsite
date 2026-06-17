/**
 * roof-outline.ts — KILL-TEST for the linear tier (the cheapest piece first).
 *
 * Trace the roof outline from the mask, simplify it to a clean polygon (Douglas-Peucker, kills the
 * pixel staircase), measure the perimeter, and split each edge into EAVE vs RAKE using the DSM
 * (eave = facet sheds water across the edge; rake = the edge climbs along the slope). Compare to
 * EagleView: eaves 252 + rakes 58 = 310 ft outline. If the outline can't be recovered to ~10%, the
 * linear tier is in trouble — learned cheaply, before building facet segmentation + crease classify.
 *
 * Run:  npx tsx server/scripts/roof-outline.ts
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fromArrayBuffer } from 'geotiff';
import { geocode } from '../estimate/measure';

const FT = 3.28084;
const ADDRESS = process.argv[2] || '19428 Crestridge Dr, Edmond, OK 73012';
const GT = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'server/estimate/ground-truth.json'), 'utf8'));
const LIN = (GT.find((e: any) => e.address === ADDRESS)?.eagleview?.linear) || {};
const EV_PERIM = LIN.perimeter ?? (LIN.eaves != null && LIN.rakes != null ? LIN.eaves + LIN.rakes : null);

async function dataLayers(lat: number, lng: number, key: string) {
  const u = new URL('https://solar.googleapis.com/v1/dataLayers:get');
  u.searchParams.set('location.latitude', String(lat));
  u.searchParams.set('location.longitude', String(lng));
  u.searchParams.set('radiusMeters', '30');
  u.searchParams.set('view', 'IMAGERY_LAYERS');
  u.searchParams.set('requiredQuality', 'HIGH');
  u.searchParams.set('pixelSizeMeters', '0.1');
  u.searchParams.set('key', key);
  const r = await fetch(u.toString());
  const d: any = await r.json();
  if (!r.ok) throw new Error(`dataLayers ${r.status}: ${d?.error?.message || ''}`);
  return d as { dsmUrl: string; maskUrl: string };
}
async function fetchRaster(url: string, key: string) {
  const r = await fetch(`${url}&key=${key}`);
  if (!r.ok) throw new Error(`geoTiff ${r.status}`);
  const img = await (await fromArrayBuffer(await r.arrayBuffer())).getImage();
  const [rx, ry] = img.getResolution();
  const rasters = await img.readRasters({ interleave: false });
  return { band: rasters[0] as unknown as Float32Array, width: img.getWidth(), height: img.getHeight(), resX: Math.abs(rx), resY: Math.abs(ry), nodata: img.getGDALNoData() };
}
function isolateRoof(band: any, w: number, h: number): Uint8Array {
  const isB = (i: number) => band[i] > 0;
  let seed = ((h / 2) | 0) * w + ((w / 2) | 0);
  if (!isB(seed)) {
    const cx = (w / 2) | 0, cy = (h / 2) | 0; let best = -1, bestD = Infinity;
    for (let y = Math.max(0, cy - 60); y < Math.min(h, cy + 60); y++) for (let x = Math.max(0, cx - 60); x < Math.min(w, cx + 60); x++) { const i = y * w + x; if (isB(i)) { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bestD) { bestD = d; best = i; } } }
    seed = best;
  }
  const roof = new Uint8Array(w * h); if (seed < 0) return roof;
  const st = [seed]; roof[seed] = 1;
  while (st.length) { const i = st.pop()!; const x = i % w, y = (i / w) | 0; for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (n >= 0 && !roof[n] && isB(n)) { roof[n] = 1; st.push(n); } }
  return roof;
}

/** Moore-neighbor boundary tracing (8-connected, clockwise). Returns ordered [x,y] pixel ring. */
function trace(roof: Uint8Array, w: number, h: number): number[][] {
  const get = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? roof[y * w + x] : 0);
  let sx = -1, sy = -1;
  for (let y = 0; y < h && sx < 0; y++) for (let x = 0; x < w; x++) if (roof[y * w + x]) { sx = x; sy = y; break; }
  if (sx < 0) return [];
  const N = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]; // CW from N
  const out: number[][] = [[sx, sy]];
  let cx = sx, cy = sy, bx = sx - 1, by = sy, guard = 0;
  do {
    let di = N.findIndex((d) => d[0] === bx - cx && d[1] === by - cy); if (di < 0) di = 6;
    let found = -1, px = bx, py = by;
    for (let k = 1; k <= 8; k++) { const idx = (di + k) % 8; const nx = cx + N[idx][0], ny = cy + N[idx][1]; if (get(nx, ny)) { found = idx; bx = px; by = py; cx = nx; cy = ny; break; } px = nx; py = ny; }
    if (found < 0) break;
    out.push([cx, cy]);
  } while (!(cx === sx && cy === sy) && ++guard < w * h * 8);
  return out;
}

/** Douglas-Peucker on an open polyline of [x,y]. */
function dp(pts: number[][], eps: number): number[][] {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0; const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / len; if (d > dmax) { dmax = d; idx = i; } }
  if (dmax > eps) { const l = dp(pts.slice(0, idx + 1), eps), r = dp(pts.slice(idx), eps); return l.slice(0, -1).concat(r); }
  return [pts[0], pts[pts.length - 1]];
}

/** Closed-polygon simplification: drop the duplicate endpoint, anchor at the farthest point,
 *  DP each half. Returns OPEN polygon vertices (wrap last->first for the closing edge). */
function simplifyClosed(ring: number[][], eps: number): number[][] {
  let pts = ring;
  if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts = pts.slice(0, -1);
  if (pts.length < 4) return pts;
  let fi = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; fi = i; } }
  const a = pts.slice(0, fi + 1), b = pts.slice(fi).concat([pts[0]]);
  return dp(a, eps).slice(0, -1).concat(dp(b, eps).slice(0, -1));
}

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  const { location } = await geocode(ADDRESS, key);
  const dl = await dataLayers(location.lat, location.lng, key);
  const [dsm, mask] = await Promise.all([fetchRaster(dl.dsmUrl, key), fetchRaster(dl.maskUrl, key)]);
  const { band: z, width: w, height: h, resX, nodata } = dsm;
  const roof = isolateRoof(mask.band, w, h);
  const valid = (i: number) => isFinite(z[i]) && z[i] > -1000 && z[i] < 1e4 && (nodata == null || z[i] !== nodata);

  const ring = trace(roof, w, h);
  if (ring.length < 4) { console.log(`  ✗ trace failed (ring=${ring.length})`); return; }
  const simp = simplifyClosed(ring, 0.4 / resX); // open polygon vertices
  const n = simp.length;
  const verts = n;

  // gradient at a pixel (central diff, meters)
  const grad = (x: number, y: number): [number, number] => {
    const i = y * w + x; if (!valid(i)) return [0, 0];
    const gx = (x > 0 && x < w - 1 && valid(i - 1) && valid(i + 1)) ? (z[i + 1] - z[i - 1]) / (2 * resX) : 0;
    const gy = (y > 0 && y < h - 1 && valid(i - w) && valid(i + w)) ? (z[i + w] - z[i - w]) / (2 * resX) : 0;
    return [gx, gy];
  };

  let eaveFt = 0, rakeFt = 0, perimFt = 0;
  const edges: { len: number; ang: number; type: string }[] = [];
  for (let i = 0; i < n; i++) {
    const [x1, y1] = simp[i], [x2, y2] = simp[(i + 1) % n];
    const segM = Math.hypot(x2 - x1, y2 - y1) * resX, segFt = segM * FT;
    perimFt += segFt;
    // edge unit dir + inward normal (toward roof interior)
    let ex = x2 - x1, ey = y2 - y1; const el = Math.hypot(ex, ey) || 1; ex /= el; ey /= el;
    const ang = ((Math.atan2(ey, ex) * 180) / Math.PI + 360) % 180; // 0-180 orientation
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    let nx = -ey, ny = ex; // candidate normal
    const test = (Math.round(my + ny * 6) * w + Math.round(mx + nx * 6));
    if (!(test >= 0 && test < w * h && roof[test])) { nx = -nx; ny = -ny; }
    // sample facet gradient ~0.8m inside the edge
    const sx = Math.round(mx + nx * 8), sy = Math.round(my + ny * 8);
    const [gx, gy] = grad(sx, sy);
    const gl = Math.hypot(gx, gy);
    let type = 'eave';
    if (gl >= 1e-3) { const downAlongEdge = Math.abs((-gx / gl) * ex + (-gy / gl) * ey); type = downAlongEdge < 0.5 ? 'eave' : 'rake'; }
    if (type === 'eave') eaveFt += segFt; else rakeFt += segFt;
    edges.push({ len: segFt, ang, type });
  }
  if (process.env.EDGES) { console.log('  outline edges (len ft @ orient° : type):'); edges.forEach((e, i) => console.log(`   ${String(i).padStart(2)}: ${e.len.toFixed(1).padStart(6)} ft  @ ${e.ang.toFixed(0).padStart(3)}°  ${e.type}`)); }

  const pct = (a: number, b: number) => `${a - b >= 0 ? '+' : ''}${(((a - b) / b) * 100).toFixed(0)}%`;
  console.log(`\n  ROOF OUTLINE — DSM vs truth (${ADDRESS})\n`);
  console.log(`  simplified polygon: ${verts} vertices`);
  console.log(`  perimeter   : ${perimFt.toFixed(0)} ft` + (EV_PERIM != null ? `   | truth ${EV_PERIM} ft   (${pct(perimFt, EV_PERIM)})` : ''));
  console.log(`  eaves (ours): ${eaveFt.toFixed(0)} ft` + (LIN.eaves != null ? `   | truth ${LIN.eaves} ft   (${pct(eaveFt, LIN.eaves)})` : ''));
  console.log(`  rakes (ours): ${rakeFt.toFixed(0)} ft` + (LIN.rakes != null ? `   | truth ${LIN.rakes} ft   (${pct(rakeFt, LIN.rakes)})` : ''));
  console.log('');
}
main().catch((e) => { console.error(e?.message || e); process.exit(1); });
