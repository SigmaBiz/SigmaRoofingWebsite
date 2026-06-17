/**
 * dsm-probe.ts — does the raw DSM tap (Solar dataLayers, the pricier SKU) work on our key,
 * and what does it return? Run this BEFORE building any integrator. Prints the layer URLs +
 * metadata (pixel size, dates) so we code the parser against the real shape, not an assumption.
 *
 * Run:  npx tsx server/scripts/dsm-probe.ts ["address"]
 */
import 'dotenv/config';
import { geocode } from '../estimate/measure';

async function main() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) { console.error('GOOGLE_API_KEY missing'); process.exit(1); }
  const addr = process.argv[2] || '19428 Crestridge Dr, Edmond, OK 73012';
  const { location } = await geocode(addr, key);

  const u = new URL('https://solar.googleapis.com/v1/dataLayers:get');
  u.searchParams.set('location.latitude', String(location.lat));
  u.searchParams.set('location.longitude', String(location.lng));
  u.searchParams.set('radiusMeters', '30');
  u.searchParams.set('view', 'IMAGERY_LAYERS'); // DSM + RGB + mask, no expensive flux
  u.searchParams.set('requiredQuality', 'HIGH');
  u.searchParams.set('pixelSizeMeters', '0.1');
  u.searchParams.set('key', key);

  const res = await fetch(u.toString());
  const data: any = await res.json();
  console.log('HTTP', res.status);
  if (!res.ok) {
    console.log('error:', JSON.stringify(data.error || data, null, 2));
    process.exit(1);
  }
  // Redact the key from any returned URLs before printing.
  const redact = (s: any) => (typeof s === 'string' ? s.replace(/[?&]key=[^&]+/g, '?key=<KEY>') : s);
  const shaped = {
    imageryDate: data.imageryDate,
    imageryProcessedDate: data.imageryProcessedDate,
    imageryQuality: data.imageryQuality,
    dsmUrl: redact(data.dsmUrl),
    maskUrl: redact(data.maskUrl),
    rgbUrl: redact(data.rgbUrl),
    keys: Object.keys(data),
  };
  console.log(JSON.stringify(shaped, null, 2));
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
