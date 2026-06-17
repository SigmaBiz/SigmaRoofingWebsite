/**
 * dsm-measure.ts — THE SUPERVISOR EXPERIMENT.
 *
 * Instead of trusting Google's pre-computed buildingInsights summary, harvest the RAW DSM
 * (Solar dataLayers height grid) and run our own math:
 *   - true surface area = Σ over roof pixels of pixel_ground_area · √(1 + (dz/dx)² + (dz/dy)²)
 *   - pitch via a slope histogram (reveals MIXED pitch as separate peaks)
 * Then compare OUR number vs Google's summary vs the EagleView truth, for every covered roof
 * in ground-truth.json. If ours beats Google against EagleView (esp. on the mixed-pitch roof),
 * the 'supervisor' tier is worth building. If not, the error is in the source data, not the
 * summarizer — and we keep the cheap path.
 *
 * Run:  npx tsx server/scripts/dsm-measure.ts
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fromArrayBuffer } from 'geotiff';
import { geocode, computeMeasurement, m2ToSquares, degToRad } from '../estimate/measure';

type Entry = { address: string; eagleview?: { squares: number; pitch: string } | null };

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
  const buf = await res.arrayBuffer();
  const tiff = await fromArrayBuffer(buf);
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

/** flood-fill the mask from the center to isolate THIS building's roof pixels */
function isolateRoof(mask: { band: any; width: number; height: number }): Uint8Array {
  const { band, width: w, height: h } = mask;
  const isB = (i: number) => band[i] > 0;
  // seed = center pixel, or nearest building pixel within a small spiral
  let seed = Math.floor(h / 2) * w + Math.floor(w / 2);
  if (!isB(seed)) {
    const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
    let best = -1, bestD = Infinity;
    for (let y = Math.max(0, cy - 40); y < Math.min(h, cy + 40); y++)
      for (let x = Math.max(0, cx - 40); x < Math.min(w, cx + 40); x++) {
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
    const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
    for (const n of nb) if (n >= 0 && !roof[n] && isB(n)) { roof[n] = 1; stack.push(n); }
  }
  return roof;
}

function integrate(
  dsm: { band: Float32Array; width: number; height: number; resX: number; resY: number; nodata: any },
  roof: Uint8Array,
) {
  const { band: z, width: w, height: h, resX, resY, nodata } = dsm;
  const valid = (i: number) => roof[i] === 1 && isFinite(z[i]) && z[i] > -1000 && z[i] < 10000 && (nodata == null || z[i] !== nodata);
  const pxArea = resX * resY;
  let surfaceArea = 0, planArea = 0, roofPx = 0;
  const histo = new Float64Array(40); // index = round(rise)
  let histoTotal = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!valid(i)) continue;
      roofPx++; planArea += pxArea;

      // gradient from in-roof valid neighbors (central if both, else one-sided, else 0)
      const L = x > 0 && valid(i - 1), R = x < w - 1 && valid(i + 1);
      const U = y > 0 && valid(i - w), D = y < h - 1 && valid(i + w);
      let dzdx = 0, dzdy = 0;
      if (L && R) dzdx = (z[i + 1] - z[i - 1]) / (2 * resX);
      else if (R) dzdx = (z[i + 1] - z[i]) / resX;
      else if (L) dzdx = (z[i] - z[i - 1]) / resX;
      if (U && D) dzdy = (z[i + w] - z[i - w]) / (2 * resY);
      else if (D) dzdy = (z[i + w] - z[i]) / resY;
      else if (U) dzdy = (z[i] - z[i - w]) / resY;

      const g = Math.sqrt(dzdx * dzdx + dzdy * dzdy);
      const angle = Math.atan(g); // radians
      if (angle > degToRad(55)) continue; // wall-cliff / mask-edge noise, not a roof surface

      const factor = Math.sqrt(1 + g * g);
      const contrib = pxArea * factor;
      surfaceArea += contrib;

      const rise = Math.min(39, Math.max(0, Math.round(12 * Math.tan(angle))));
      histo[rise] += contrib;
      histoTotal += contrib;
    }
  }

  // top pitch peaks (integer rise bins holding >=10% of area)
  const peaks = Array.from(histo)
    .map((a, rise) => ({ rise, share: histoTotal ? a / histoTotal : 0 }))
    .filter((p) => p.share >= 0.1)
    .sort((a, b) => b.share - a.share);

  return { surfaceArea, planArea, roofPx, peaks };
}

async function main() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) { console.error('GOOGLE_API_KEY missing'); process.exit(1); }
  const entries: Entry[] = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'server/estimate/ground-truth.json'), 'utf8'),
  );

  console.log('\n========  SUPERVISOR EXPERIMENT — our DSM math vs Google summary vs EagleView  ========\n');
  const ourErrs: number[] = [], googleErrs: number[] = [];

  for (const e of entries) {
    try {
      const { location } = await geocode(e.address, key);
      const dl = await dataLayers(location.lat, location.lng, key);
      const [dsm, mask] = await Promise.all([fetchRaster(dl.dsmUrl, key), fetchRaster(dl.maskUrl, key)]);
      if (dsm.width !== mask.width || dsm.height !== mask.height) {
        console.log(`  ${e.address}\n    ⚠ DSM ${dsm.width}x${dsm.height} != mask ${mask.width}x${mask.height} — skipping\n`);
        continue;
      }
      const roof = isolateRoof(mask);
      const { surfaceArea, planArea, roofPx, peaks } = integrate(dsm, roof);
      const ourSq = m2ToSquares(surfaceArea);
      const planSq = m2ToSquares(planArea);

      const g = await computeMeasurement(e.address, key);
      const ev = e.eagleview;

      console.log(`  ${e.address}`);
      console.log(`    roof pixels: ${roofPx}  (px ${dsm.resX.toFixed(2)}m)`);
      console.log(`    OUR surface : ${ourSq.toFixed(1)} sq   (flat plan ${planSq.toFixed(1)} sq)`);
      console.log(`    Google sum  : ${g.totals.squares} sq`);
      if (ev) {
        console.log(`    EagleView   : ${ev.squares} sq`);
        const oe = ((ourSq - ev.squares) / ev.squares) * 100;
        const ge = ((g.totals.squares - ev.squares) / ev.squares) * 100;
        ourErrs.push(Math.abs(oe)); googleErrs.push(Math.abs(ge));
        console.log(`    Δ vs EV     : OURS ${oe >= 0 ? '+' : ''}${oe.toFixed(1)}%   |   Google ${ge >= 0 ? '+' : ''}${ge.toFixed(1)}%`);
      }
      console.log(`    OUR pitch   : ${peaks.map((p) => `${p.rise}/12 (${(p.share * 100).toFixed(0)}%)`).join(', ') || '—'}`);
      console.log(`    Google pitch: ${g.totals.predominant_pitch}${ev ? `   EagleView: ${ev.pitch}` : ''}\n`);
    } catch (err: any) {
      console.log(`  ${e.address}\n    ✗ ${err?.message || err}\n`);
    }
  }

  const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
  console.log('  ------------------------------------------------------------------');
  console.log(`  squares mean |Δ| vs EagleView:   OURS ${mean(ourErrs).toFixed(1)}%   |   Google ${mean(googleErrs).toFixed(1)}%`);
  console.log('');
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
