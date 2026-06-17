/**
 * roof-blueprint.ts — REDRAW the roof clean + to scale so distances are readable (vision-in-the-loop).
 *
 * The classical-CV crease takeoff collapsed, but a vision model can read facets/seams/eave-rake from the
 * picture (the gestalt the algorithm couldn't hold). So render a CLEAN, MEASURABLE blueprint:
 *   - each facet a FLAT color by quantized aspect (so planes read as distinct regions)
 *   - crisp black seams between facets + a bold outline
 *   - a 10 ft grid (1 cell = 10 ft, bold every 50 ft) so a reader can measure line lengths to scale
 * Then a vision pass (me / a Claude vision call in production) traces + classifies + measures off the grid.
 *
 * Run:  npx tsx server/scripts/roof-blueprint.ts ["address"] [slug]
 */
import 'dotenv/config';
import { fromArrayBuffer } from 'geotiff';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { geocode } from '../estimate/measure';

const ADDRESS = process.argv[2] || '19428 Crestridge Dr, Edmond, OK 73012';
const SLUG = process.argv[3] || 'crestridge';
const SCALE = 2;                 // output upscale
const FT_PER_M = 3.28084;

async function dataLayers(lat: number, lng: number, key: string) {
  const u = new URL('https://solar.googleapis.com/v1/dataLayers:get');
  u.searchParams.set('location.latitude', String(lat)); u.searchParams.set('location.longitude', String(lng));
  u.searchParams.set('radiusMeters', '30'); u.searchParams.set('view', 'IMAGERY_LAYERS');
  u.searchParams.set('requiredQuality', 'HIGH'); u.searchParams.set('pixelSizeMeters', '0.1'); u.searchParams.set('key', key);
  const r = await fetch(u.toString()); const d: any = await r.json();
  if (!r.ok) throw new Error(`dataLayers ${r.status}: ${d?.error?.message || ''}`);
  return d as { dsmUrl: string; maskUrl: string };
}
async function fetchRaster(url: string, key: string) {
  const r = await fetch(`${url}&key=${key}`); if (!r.ok) throw new Error(`geoTiff ${r.status}`);
  const img = await (await fromArrayBuffer(await r.arrayBuffer())).getImage();
  const [rx] = img.getResolution(); const rasters = await img.readRasters({ interleave: false });
  return { band: rasters[0] as unknown as Float32Array, width: img.getWidth(), height: img.getHeight(), resX: Math.abs(rx), nodata: img.getGDALNoData() };
}
function isolateRoof(band: any, w: number, h: number): Uint8Array {
  const isB = (i: number) => band[i] > 0; let seed = ((h / 2) | 0) * w + ((w / 2) | 0);
  if (!isB(seed)) { const cx = (w / 2) | 0, cy = (h / 2) | 0; let best = -1, bd = Infinity; for (let y = Math.max(0, cy - 60); y < Math.min(h, cy + 60); y++) for (let x = Math.max(0, cx - 60); x < Math.min(w, cx + 60); x++) { const i = y * w + x; if (isB(i)) { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bd) { bd = d; best = i; } } } seed = best; }
  const roof = new Uint8Array(w * h); if (seed < 0) return roof; const st = [seed]; roof[seed] = 1;
  while (st.length) { const i = st.pop()!; const x = i % w, y = (i / w) | 0; for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (n >= 0 && !roof[n] && isB(n)) { roof[n] = 1; st.push(n); } }
  return roof;
}
function hsv(h: number, s: number, v: number): [number, number, number] {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; let r = 0, g = 0, b = 0;
  if (h < 60)[r, g, b] = [c, x, 0]; else if (h < 120)[r, g, b] = [x, c, 0]; else if (h < 180)[r, g, b] = [0, c, x];
  else if (h < 240)[r, g, b] = [0, x, c]; else if (h < 300)[r, g, b] = [x, 0, c]; else[r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  const { location } = await geocode(ADDRESS, key);
  const dl = await dataLayers(location.lat, location.lng, key);
  const [dsm, mask] = await Promise.all([fetchRaster(dl.dsmUrl, key), fetchRaster(dl.maskUrl, key)]);
  const { band: z0, width: w, height: h, resX, nodata } = dsm;
  const roof = isolateRoof(mask.band, w, h);
  const ok = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) ok[i] = roof[i] && isFinite(z0[i]) && z0[i] > -1000 && z0[i] < 1e4 && (nodata == null || z0[i] !== nodata) ? 1 : 0;
  // smooth
  let z = Float32Array.from(z0);
  for (let p = 0; p < 4; p++) { const nz = Float32Array.from(z); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (!ok[i]) continue; let s = 0, c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const j = i + dy * w + dx; if (ok[j]) { s += z[j]; c++; } } if (c) nz[i] = s / c; } z = nz; }
  // quantized aspect (12 bins) per pixel; -1 = flat
  const QASP = new Int8Array(w * h).fill(-2);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (!ok[i]) continue;
    const gx = (x > 0 && x < w - 1 && ok[i - 1] && ok[i + 1]) ? (z[i + 1] - z[i - 1]) / (2 * resX) : 0;
    const gy = (y > 0 && y < h - 1 && ok[i - w] && ok[i + w]) ? (z[i + w] - z[i - w]) / (2 * resX) : 0;
    const slope = Math.atan(Math.hypot(gx, gy)) * 180 / Math.PI;
    if (slope < 6) { QASP[i] = -1; continue; }
    const asp = (Math.atan2(gy, gx) * 180 / Math.PI + 360) % 360;
    QASP[i] = Math.round(asp / 30) % 12;
  }
  // crop bbox
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (roof[y * w + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const pad = 16; minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  const CW = maxX - minX + 1, CH = maxY - minY + 1, OW = CW * SCALE, OH = CH * SCALE;
  const png = new PNG({ width: OW, height: OH });
  const set = (ox: number, oy: number, r: number, g: number, b: number) => { const o = (oy * OW + ox) * 4; png.data[o] = r; png.data[o + 1] = g; png.data[o + 2] = b; png.data[o + 3] = 255; };

  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
    const gx = minX + cx, gy = minY + cy, i = gy * w + gx;
    let r = 248, g = 249, b = 251; // bg
    if (ok[i]) {
      const q = QASP[i];
      if (q === -1) { r = g = b = 210; } else { [r, g, b] = hsv(q * 30, 0.45, 0.96); }
      // facet boundary (neighbor diff quant aspect) OR roof outline
      const nb = [gx > 0 ? i - 1 : -1, gx < w - 1 ? i + 1 : -1, gy > 0 ? i - w : -1, gy < h - 1 ? i + w : -1];
      let edge = false;
      for (const n of nb) { if (n < 0 || !roof[n]) { edge = true; break; } if (ok[n] && QASP[n] !== q && QASP[n] !== -1 && q !== -1) edge = true; }
      if (edge) { r = 25; g = 28; b = 34; }
    }
    for (let sy = 0; sy < SCALE; sy++) for (let sx = 0; sx < SCALE; sx++) set(cx * SCALE + sx, cy * SCALE + sy, r, g, b);
  }
  // grid overlay: 10 ft cells (bold every 50 ft). 1 ft = SCALE/(resX*FT_PER_M) output px.
  const pxPerFt = SCALE / (resX * FT_PER_M);
  const step10 = 10 * pxPerFt;
  const blend = (ox: number, oy: number, gr: number, a: number) => { const o = (oy * OW + ox) * 4; png.data[o] = png.data[o] * (1 - a) + gr * a; png.data[o + 1] = png.data[o + 1] * (1 - a) + gr * a; png.data[o + 2] = png.data[o + 2] * (1 - a) + gr * a; };
  for (let k = 0; k * step10 < OW; k++) { const ox = Math.round(k * step10); const bold = k % 5 === 0; for (let oy = 0; oy < OH; oy++) blend(ox, oy, bold ? 90 : 150, bold ? 0.5 : 0.28); }
  for (let k = 0; k * step10 < OH; k++) { const oy = Math.round(k * step10); const bold = k % 5 === 0; for (let ox = 0; ox < OW; ox++) blend(ox, oy, bold ? 90 : 150, bold ? 0.5 : 0.28); }

  const outPath = path.join(process.cwd(), 'client/public', `blueprint-${SLUG}.png`);
  fs.writeFileSync(outPath, PNG.sync.write(png));
  console.log(`✓ blueprint-${SLUG}.png  ${OW}x${OH}px · 1 grid cell = 10 ft (bold = 50 ft) · scale ${pxPerFt.toFixed(2)} px/ft  ->  /blueprint-${SLUG}.png`);
}
main().catch((e) => { console.error(e?.message || e); process.exit(1); });
