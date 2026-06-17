/**
 * roof-card.ts <address> — run the measurement ENGINE on one address (no website, no server).
 * Squares + predominant pitch + facet count come straight from Google Solar buildingInsights
 * (same data the /api/estimate engine uses). Perimeter is computed here from the per-facet
 * bounding boxes (rasterized union of the facet rectangles → outline length) — Solar gives
 * axis-aligned facet boxes so the perimeter is APPROXIMATE; the exact one comes from the Overture
 * footprint if needed.
 *
 * Run:  npx tsx server/scripts/roof-card.ts "605 NW 115th St, Oklahoma City, OK 73114"
 */
import 'dotenv/config';
import { geocode, buildingInsights, m2ToSquares, m2ToSqft, degToRad, pitchToRise } from '../estimate/measure';

const FT = 3.28084;
const address = process.argv[2] || '605 NW 115th St, Oklahoma City, OK 73114';

async function main() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not set in .env');

  const { location, formattedAddress } = await geocode(address, key);
  const data = await buildingInsights(location, key);
  const sp = data.solarPotential || {};
  const segs: any[] = sp.roofSegmentStats || [];
  if (!segs.length) throw new Error('Solar returned no roof segments for this building.');

  // ---- squares + pitch (area-weighted + modal bucket) ----
  const areaM2 = sp.wholeRoofStats?.areaMeters2 ?? segs.reduce((s, f) => s + (f.stats?.areaMeters2 || 0), 0);
  const squares = m2ToSquares(areaM2);
  const buckets = new Map<number, number>();
  let awDeg = 0, aSum = 0;
  for (const f of segs) {
    const a = f.stats?.areaMeters2 || 0;
    awDeg += f.pitchDegrees * a; aSum += a;
    const r = pitchToRise(f.pitchDegrees);
    buckets.set(r, (buckets.get(r) || 0) + a);
  }
  awDeg = aSum ? awDeg / aSum : 0;
  let modalR = 0, modalA = -1;
  buckets.forEach((a, r) => { if (a > modalA) { modalA = a; modalR = r; } });

  // ---- perimeter: rasterize the UNION of per-facet bounding boxes (local feet) → outline length ----
  const cLat = data.center?.latitude ?? location.lat;
  const cLng = data.center?.longitude ?? location.lng;
  const mLat = 111_132, mLng = 111_320 * Math.cos(degToRad(cLat));
  const rects = segs.map((f) => {
    const bb = f.boundingBox || {};
    const xa = bb.sw ? (bb.sw.longitude - cLng) * mLng * FT : 0;
    const xb = bb.ne ? (bb.ne.longitude - cLng) * mLng * FT : 0;
    const ya = bb.sw ? (bb.sw.latitude - cLat) * mLat * FT : 0;
    const yb = bb.ne ? (bb.ne.latitude - cLat) * mLat * FT : 0;
    return { x0: Math.min(xa, xb), x1: Math.max(xa, xb), y0: Math.min(ya, yb), y1: Math.max(ya, yb) };
  });
  const G = 0.5; // ft per grid cell
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const r of rects) { minX = Math.min(minX, r.x0); maxX = Math.max(maxX, r.x1); minY = Math.min(minY, r.y0); maxY = Math.max(maxY, r.y1); }
  const W = Math.ceil((maxX - minX) / G) + 2, H = Math.ceil((maxY - minY) / G) + 2;
  const grid = new Uint8Array(W * H);
  const ix = (x: number) => Math.floor((x - minX) / G) + 1, iy = (y: number) => Math.floor((y - minY) / G) + 1;
  for (const r of rects)
    for (let gx = ix(r.x0); gx < ix(r.x1); gx++)
      for (let gy = iy(r.y0); gy < iy(r.y1); gy++)
        if (gx >= 0 && gx < W && gy >= 0 && gy < H) grid[gy * W + gx] = 1;
  let faces = 0;
  for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++) {
    if (!grid[gy * W + gx]) continue;
    if (gx === 0 || !grid[gy * W + gx - 1]) faces++;
    if (gx === W - 1 || !grid[gy * W + gx + 1]) faces++;
    if (gy === 0 || !grid[(gy - 1) * W + gx]) faces++;
    if (gy === H - 1 || !grid[(gy + 1) * W + gx]) faces++;
  }
  const perimeter = faces * G;
  const bbW = (maxX - minX), bbH = (maxY - minY);

  // ---- output ----
  const dt = data.imageryDate ? `${data.imageryDate.year}-${String(data.imageryDate.month).padStart(2,'0')}-${String(data.imageryDate.day).padStart(2,'0')}` : '?';
  console.log(`\n  ${formattedAddress}`);
  console.log(`  ─────────────────────────────────────────────`);
  console.log(`  SQUARES:    ${squares.toFixed(1)} sq   (${Math.round(m2ToSqft(areaM2)).toLocaleString()} sqft roof area)`);
  console.log(`  PITCH:      ${modalR}/12 predominant   (${awDeg.toFixed(1)}° area-weighted)`);
  console.log(`  FACETS:     ${segs.length}`);
  console.log(`  PERIMETER:  ${Math.round(perimeter)} ft   (outline of Solar facet boxes — APPROX; bbox ${Math.round(bbW)}×${Math.round(bbH)} ft)`);
  console.log(`  imagery:    ${data.imageryQuality} ${dt}`);
  console.log(`\n  facets (azimuth° / area / pitch):`);
  for (const f of segs)
    console.log(`    ${String(Math.round(f.azimuthDegrees)).padStart(3)}°  ${String(Math.round(m2ToSqft(f.stats?.areaMeters2 || 0))).padStart(5)} sqft  ${pitchToRise(f.pitchDegrees)}/12`);
  console.log('');
}
main().catch((e) => { console.error('ERROR:', e?.message || e); process.exit(1); });
