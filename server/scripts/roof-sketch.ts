/**
 * roof-sketch.ts — can we render a roof diagram (like EagleView/Hover)? Proof on real addresses.
 *
 * The cheap buildingInsights gives facet STATS but no outlines, so a sketch needs the raw DSM/mask.
 * From the mask we trace THIS building's outline; from the DSM we get per-pixel slope + aspect, so:
 *   - hillshade (relief from the height grid) makes the 3D form pop — ridges/hips/valleys as light/shadow
 *   - aspect-hue colors each facet by the direction it faces, so facets read as distinct regions
 *   - the region boundaries ARE the ridge/hip/valley lines (the same lines whose lengths = the linear takeoff)
 * Writes a PNG per roof into client/public/ so it's viewable on localhost.
 *
 * This is the raster foundation; a clean labeled VECTOR line-drawing is the next layer on top.
 *
 * Run:  npx tsx server/scripts/roof-sketch.ts
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fromArrayBuffer } from 'geotiff';
import { PNG } from 'pngjs';
import { geocode, degToRad } from '../estimate/measure';

const ROOFS: { address: string; slug: string }[] = [
  { address: '19428 Crestridge Dr, Edmond, OK 73012', slug: 'crestridge' },
  { address: '3813 NW 62nd Street, Oklahoma City, OK 73112', slug: '3813-nw62' },
  { address: '8416 John Robert Drive, Oklahoma City, OK 73135', slug: '8416-johnrobert' },
  { address: '1305 NE 24th Street, Oklahoma City, OK 73111', slug: '1305-ne24' },
];

async function dataLayers(lat: number, lng: number, key: string) {
  const u = new URL('https://solar.googleapis.com/v1/dataLayers:get');
  u.searchParams.set('location.latitude', String(lat));
  u.searchParams.set('location.longitude', String(lng));
  u.searchParams.set('radiusMeters', '30');
  u.searchParams.set('view', 'IMAGERY_LAYERS');
  u.searchParams.set('requiredQuality', 'HIGH');
  u.searchParams.set('pixelSizeMeters', '0.1');
  u.searchParams.set('key', key);
  const res = await fetch(u.toString());
  const data: any = await res.json();
  if (!res.ok) throw new Error(`dataLayers ${res.status}: ${data?.error?.message || ''}`);
  return data as { dsmUrl: string; maskUrl: string };
}

async function fetchRaster(url: string, key: string) {
  const res = await fetch(`${url}&key=${key}`);
  if (!res.ok) throw new Error(`geoTiff ${res.status}`);
  const tiff = await fromArrayBuffer(await res.arrayBuffer());
  const image = await tiff.getImage();
  const [rx, ry] = image.getResolution();
  const rasters = await image.readRasters({ interleave: false });
  return {
    band: rasters[0] as unknown as Float32Array,
    width: image.getWidth(),
    height: image.getHeight(),
    resX: Math.abs(rx),
    resY: Math.abs(ry),
    nodata: image.getGDALNoData(),
  };
}

function isolateRoof(mask: { band: any; width: number; height: number }): Uint8Array {
  const { band, width: w, height: h } = mask;
  const isB = (i: number) => band[i] > 0;
  let seed = Math.floor(h / 2) * w + Math.floor(w / 2);
  if (!isB(seed)) {
    const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
    let best = -1, bestD = Infinity;
    for (let y = Math.max(0, cy - 50); y < Math.min(h, cy + 50); y++)
      for (let x = Math.max(0, cx - 50); x < Math.min(w, cx + 50); x++) {
        const i = y * w + x;
        if (isB(i)) { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bestD) { bestD = d; best = i; } }
      }
    seed = best;
  }
  const roof = new Uint8Array(w * h);
  if (seed < 0) return roof;
  const stack = [seed];
  roof[seed] = 1;
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % w, y = (i / w) | 0;
    for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1])
      if (n >= 0 && !roof[n] && isB(n)) { roof[n] = 1; stack.push(n); }
  }
  return roof;
}

function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** Render the DSM facet-map PNG for an address → PNG buffer. Used by the `/api/roof-image` endpoint AND the CLI below. */
export async function renderRoofSketch(address: string, key: string) {
  const t0 = Date.now();
  const { location } = await geocode(address, key);
  const dl = await dataLayers(location.lat, location.lng, key);
  const [dsm, mask] = await Promise.all([fetchRaster(dl.dsmUrl, key), fetchRaster(dl.maskUrl, key)]);
  if (dsm.width !== mask.width || dsm.height !== mask.height) throw new Error('DSM/mask size mismatch');

  const { band: z, width: w, height: h, resX, resY, nodata } = dsm;
  const roof = isolateRoof(mask);
  const valid = (i: number) => roof[i] === 1 && isFinite(z[i]) && z[i] > -1000 && z[i] < 10000 && (nodata == null || z[i] !== nodata);

  // crop to roof bbox + margin
  let minX = w, minY = h, maxX = 0, maxY = 0, count = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (roof[y * w + x]) { count++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  if (!count) throw new Error('empty roof');
  const pad = 14;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  const W = maxX - minX + 1, H = maxY - minY + 1;

  const png = new PNG({ width: W, height: H });
  const L = (() => { const v = [-1, -1, 1.3]; const n = Math.hypot(...v); return [v[0] / n, v[1] / n, v[2] / n]; })();

  const grad = (i: number, x: number, y: number) => {
    const Ln = x > 0 && valid(i - 1), Rn = x < w - 1 && valid(i + 1), Un = y > 0 && valid(i - w), Dn = y < h - 1 && valid(i + w);
    let dzdx = 0, dzdy = 0;
    if (Ln && Rn) dzdx = (z[i + 1] - z[i - 1]) / (2 * resX); else if (Rn) dzdx = (z[i + 1] - z[i]) / resX; else if (Ln) dzdx = (z[i] - z[i - 1]) / resX;
    if (Un && Dn) dzdy = (z[i + w] - z[i - w]) / (2 * resY); else if (Dn) dzdy = (z[i + w] - z[i]) / resY; else if (Un) dzdy = (z[i] - z[i - w]) / resY;
    return [dzdx, dzdy];
  };

  for (let oy = 0; oy < H; oy++) {
    for (let ox = 0; ox < W; ox++) {
      const gx = minX + ox, gy = minY + oy, i = gy * w + gx, o = (oy * W + ox) * 4;
      png.data[o + 3] = 255;
      if (!valid(i)) { png.data[o] = 246; png.data[o + 1] = 247; png.data[o + 2] = 249; continue; } // paper bg
      // outline: roof pixel touching non-roof = boundary
      const edge = (gx > 0 && !roof[i - 1]) || (gx < w - 1 && !roof[i + 1]) || (gy > 0 && !roof[i - w]) || (gy < h - 1 && !roof[i + w]);
      if (edge) { png.data[o] = 30; png.data[o + 1] = 34; png.data[o + 2] = 40; continue; }
      const [dzdx, dzdy] = grad(i, gx, gy);
      const g = Math.hypot(dzdx, dzdy);
      const slope = Math.atan(g);
      // hillshade
      const nlen = Math.hypot(dzdx, dzdy, 1);
      const shade = Math.max(0, (-dzdx * L[0] - dzdy * L[1] + 1 * L[2]) / nlen);
      const v = 0.32 + 0.66 * shade;
      const aspect = (Math.atan2(dzdy, dzdx) * 180) / Math.PI;
      const hue = (aspect + 360) % 360;
      const sat = slope < degToRad(4) ? 0.06 : 0.5; // near-flat -> gray
      const [r, gg, b] = hsv2rgb(hue, sat, v);
      png.data[o] = r; png.data[o + 1] = gg; png.data[o + 2] = b;
    }
  }

  return { buffer: PNG.sync.write(png), W, H, count, secs: ((Date.now() - t0) / 1000).toFixed(1) };
}

async function main() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) { console.error('GOOGLE_API_KEY missing'); process.exit(1); }
  const arg = process.argv[2];   // run on ONE address if given, else the hardcoded ROOFS
  const list = arg ? [{ slug: arg.split(',')[0].toLowerCase().replace(/[^a-z0-9]+/g, '_'), address: arg }] : ROOFS;
  for (const r of list) {
    try {
      const res = await renderRoofSketch(r.address, key);
      fs.writeFileSync(path.join(process.cwd(), 'client/public', `sketch-${r.slug}.png`), res.buffer);
      console.log(`✓ ${r.slug.padEnd(16)} ${res.W}x${res.H}px · ${res.count} roof px · ${res.secs}s  ->  /sketch-${r.slug}.png`);
    } catch (e: any) {
      console.log(`✗ ${r.slug.padEnd(16)} ${e?.message || e}`);
    }
  }
}

// CLI only when run directly (`tsx server/scripts/roof-sketch.ts`).
// IMPORTANT: routes.ts imports this module (for /api/roof-image), so esbuild bundles it into dist/index.js.
// Inside that bundle import.meta.url === dist/index.js === process.argv[1], so the old identity check passed
// and main() fired on EVERY production boot — rendering R&D demo addresses via the paid Solar Data-Layers SKU,
// and crash-looping the whole server (process.exit) when GOOGLE_API_KEY was absent. Gate on the entry basename:
// it equals "roof-sketch" only when THIS file is the real CLI entry, never when bundled as dist/index.js.
const __entry = process.argv[1] ? path.basename(process.argv[1]).replace(/\.[cm]?[jt]s$/, "") : "";
if (__entry === "roof-sketch") {
  main().catch((e) => { console.error(e?.message || e); process.exit(1); });
}
