/**
 * roof-image.ts <address> — pull the RAW Google Solar aerial (the RGB dataLayers GeoTIFF) and write it
 * as a PNG into client/public for localhost. (dataLayers is a heavier call than buildingInsights —
 * fine for a one-off view, NOT for every widget lookup.)
 *
 * Run:  npx tsx server/scripts/roof-image.ts "605 NW 115th St, Oklahoma City, OK 73114"
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fromArrayBuffer } from 'geotiff';
import { PNG } from 'pngjs';
import { geocode } from '../estimate/measure';

const ADDRESS = process.argv[2] || '605 NW 115th St, Oklahoma City, OK 73114';
const slug = ADDRESS.split(',')[0].toLowerCase().replace(/[^a-z0-9]+/g, '_');

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
  return d as { rgbUrl?: string; dsmUrl?: string; maskUrl?: string; imageryDate?: any; imageryQuality?: string };
}

async function main() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not set');
  const { location } = await geocode(ADDRESS, key);
  const dl = await dataLayers(location.lat, location.lng, key);
  if (!dl.rgbUrl) throw new Error('dataLayers returned no rgbUrl');

  const r = await fetch(`${dl.rgbUrl}&key=${key}`);
  if (!r.ok) throw new Error(`rgb geoTiff ${r.status}`);
  const img = await (await fromArrayBuffer(await r.arrayBuffer())).getImage();
  const w = img.getWidth(), h = img.getHeight();
  const bands = await img.readRasters({ interleave: false });
  const R = bands[0] as any, G = bands[1] as any, B = bands[2] as any;
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h; i++) {
    png.data[i * 4] = R[i]; png.data[i * 4 + 1] = G[i]; png.data[i * 4 + 2] = B[i]; png.data[i * 4 + 3] = 255;
  }
  const out = path.join(process.cwd(), 'client/public', `solar_rgb_${slug}.png`);
  await new Promise<void>((res, rej) => png.pack().pipe(fs.createWriteStream(out)).on('finish', () => res()).on('error', rej));
  const d = dl.imageryDate;
  console.log(`RGB ${w}×${h}px @0.1 m/px  ·  quality ${dl.imageryQuality || '?'}  ·  ${d ? `${d.year}-${d.month}-${d.day}` : '?'}`);
  console.log(`saved client/public/solar_rgb_${slug}.png`);
}
main().catch((e) => { console.error('ERROR:', e?.message || e); process.exit(1); });
