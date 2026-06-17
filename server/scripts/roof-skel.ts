/**
 * roof-skel.ts — the PRINCIPLED takeoff: medial-axis SKELETON + junction topology (replaces the
 * fragile per-corner bend-heuristic that plateaued on hips). Zhang-Suen thin the footprint mask →
 * 1px skeleton = the roof's ridge/hip/valley crease network. Branch classification (next step):
 *   corner→junction branch  = HIP (convex corner) or VALLEY (reflex corner);  junction→junction = RIDGE.
 *
 * THIS STEP (decisive tool-validation): measure the skeleton's TOTAL plan length and compare to the
 * real (hips+valleys+ridges) plan total. If it matches, the skeleton is sound → build classification.
 *   expected plan = ridge×1 + (hips+valleys)/√(1+s²/2):
 *     3605 ≈ 89   Lee ≈ 127   Hinkle ≈ 250   Crest ≈ 310
 *
 * Run:  npx tsx server/scripts/roof-skel.ts
 */
import 'dotenv/config';
import { fromArrayBuffer } from 'geotiff';
import { geocode } from '../estimate/measure';

const M2F = 3.280839895;
const ROOFS = [
  { slug: '3605  (hip)', address: '3605 SE 57th Cir, Oklahoma City, OK 73135', expPlan: 89, pitch: 6 },
  { slug: 'Lee   (gable+flush)', address: '6320 N Warren Avenue, Warr Acres, OK', expPlan: 127, pitch: 6 },
  { slug: 'Hinkle(hip)', address: '4024 N Nicklas Avenue, Oklahoma City, OK', expPlan: 250, pitch: 6 },
  { slug: 'Crest (hip)', address: '19428 Crestridge Dr, Edmond, OK 73012', expPlan: 310, pitch: 8 },
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
/** Fill interior holes so the skeleton doesn't ring around speckle (flood non-roof from border = outside; rest = fill). */
function fillHoles(roof: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h); const st: number[] = [];
  for (let x = 0; x < w; x++) { for (const y of [0, h - 1]) { const i = y * w + x; if (!roof[i] && !out[i]) { out[i] = 1; st.push(i); } } }
  for (let y = 0; y < h; y++) { for (const x of [0, w - 1]) { const i = y * w + x; if (!roof[i] && !out[i]) { out[i] = 1; st.push(i); } } }
  while (st.length) { const i = st.pop()!; const x = i % w, y = (i / w) | 0; for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (n >= 0 && !roof[n] && !out[n]) { out[n] = 1; st.push(n); } }
  const filled = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) filled[i] = roof[i] || !out[i] ? 1 : 0;
  return filled;
}
/** Zhang-Suen thinning → 1px medial-axis skeleton. */
function thin(src: Uint8Array, w: number, h: number): Uint8Array {
  const s = src.slice(); const g = (x: number, y: number) => (x >= 0 && y >= 0 && x < w && y < h ? s[y * w + x] : 0);
  let changed = true;
  while (changed) {
    changed = false;
    for (const step of [0, 1]) {
      const del: number[] = [];
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        if (!s[y * w + x]) continue;
        const p2 = g(x, y - 1), p3 = g(x + 1, y - 1), p4 = g(x + 1, y), p5 = g(x + 1, y + 1), p6 = g(x, y + 1), p7 = g(x - 1, y + 1), p8 = g(x - 1, y), p9 = g(x - 1, y - 1);
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9; if (B < 2 || B > 6) continue;
        const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2]; let A = 0; for (let k = 0; k < 8; k++) if (seq[k] === 0 && seq[k + 1] === 1) A++;
        if (A !== 1) continue;
        if (step === 0) { if (p2 * p4 * p6 !== 0) continue; if (p4 * p6 * p8 !== 0) continue; }
        else { if (p2 * p4 * p8 !== 0) continue; if (p2 * p6 * p8 !== 0) continue; }
        del.push(y * w + x);
      }
      if (del.length) { changed = true; for (const i of del) s[i] = 0; }
    }
  }
  return s;
}
/** True polyline length of a 1px skeleton: sum half-edge lengths (1 orthogonal, √2 diagonal) over neighbors. */
function skelLenPx(s: Uint8Array, w: number, h: number): number {
  let L = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!s[y * w + x]) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || !s[ny * w + nx]) continue;
      L += (dx && dy ? Math.SQRT2 : 1) / 2;
    }
  }
  return L;
}

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  console.log('\n  ROOF SKELETON — total medial-axis length vs real (hips+valleys+ridges) plan total:\n');
  for (const r of ROOFS) {
    try {
      const { location } = await geocode(r.address, key);
      const dl = await dataLayers(location.lat, location.lng, key);
      const mask = await fetchRaster(dl.maskUrl, key);
      const { width: w, height: h, resX } = mask;
      const roof = fillHoles(isolateRoof(mask.band, w, h), w, h);
      const skel = thin(roof, w, h);
      const planFt = skelLenPx(skel, w, h) * resX * M2F;
      const pct = `${planFt - r.expPlan >= 0 ? '+' : ''}${(((planFt - r.expPlan) / r.expPlan) * 100).toFixed(0)}%`;
      console.log(`  ${r.slug.padEnd(20)} skeleton ${planFt.toFixed(0)} ft  vs expected plan ${r.expPlan} ft  (${pct})`);
    } catch (e: any) { console.log(`  ${r.slug}: ✗ ${e?.message || e}`); }
  }
  console.log('\n  match → skeleton is sound → build branch classification (corner→junction=hip/valley, junction→junction=ridge).\n');
}
main();
