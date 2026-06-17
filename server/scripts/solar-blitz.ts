/**
 * solar-blitz.ts — THE KILL-TEST (Parkinson-principle blitz)
 * --------------------------------------------------------------
 * The whole roof-estimator bet rests on ONE load-bearing assumption (H0):
 *   "Google Solar API buildingInsights returns pitch + per-facet area accurate
 *    enough to produce an instant number WITHOUT buying EagleView."
 *
 * We hold the anti-corroborator already: an EagleView report for
 *   19428 Crestridge Dr, Edmond OK  ->  8/12 pitch, 12 facets, 4354 sqft (43.5 squares).
 *
 * This script fires ONE geocode + ONE buildingInsights call at that exact roof and
 * prints a diff table. K0 (coverage) + K1 (area within ~5%) PASS => build the slice.
 * Otherwise => pivot (see .context plan). It is NOT wired to any UI.
 *
 * Run:  npx tsx server/scripts/solar-blitz.ts
 *   or  npx tsx server/scripts/solar-blitz.ts "1600 Some Other Address, City OK"
 *
 * Requires: GOOGLE_API_KEY in .env, with the Solar API + Geocoding API ENABLED on the
 * project (Phase 0). If Solar isn't enabled yet, the script tells you exactly that.
 */
import 'dotenv/config';

// ----- Ground truth (EagleView PDF 68324055.PDF) -----
const GROUND_TRUTH = {
  address: '19428 Crestridge Dr, Edmond, OK',
  squares: 43.54, // 4354 sqft / 100
  areaSqft: 4354,
  pitchRise: 8, // 8/12
  facets: 12,
  footprintSqft: 3620,
};

// ----- Unit conversions -----
const M2_PER_SQUARE = 9.290304; // 1 roofing square = 100 sqft = 9.290304 m^2
const SQFT_PER_M2 = 10.7639;
const m2ToSquares = (m2: number) => m2 / M2_PER_SQUARE;
const m2ToSqft = (m2: number) => m2 * SQFT_PER_M2;
const degToRad = (d: number) => (d * Math.PI) / 180;
/** pitchDegrees -> nearest "rise/12" integer increment */
const pitchToRise = (deg: number) => Math.round(12 * Math.tan(degToRad(deg)));

type LatLng = { latitude: number; longitude: number };
type RoofSegment = {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats: { areaMeters2: number; groundAreaMeters2: number };
  center: LatLng;
  boundingBox: { sw: LatLng; ne: LatLng };
  planeHeightAtCenterMeters?: number;
};

function pct(actual: number, truth: number): number {
  return ((actual - truth) / truth) * 100;
}
function fmtPct(p: number): string {
  const s = p >= 0 ? '+' : '';
  return `${s}${p.toFixed(1)}%`;
}
function verdict(pass: boolean): string {
  return pass ? 'PASS ✅' : 'FAIL ❌';
}

async function geocode(address: string, key: string): Promise<LatLng> {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', key);
  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (data.status !== 'OK') {
    throw new Error(
      `Geocoding failed: status=${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`,
    );
  }
  const loc = data.results[0].geometry.location;
  return { latitude: loc.lat, longitude: loc.lng };
}

async function buildingInsights(loc: LatLng, key: string): Promise<any> {
  const url = new URL('https://solar.googleapis.com/v1/buildingInsights:findClosest');
  url.searchParams.set('location.latitude', String(loc.latitude));
  url.searchParams.set('location.longitude', String(loc.longitude));
  url.searchParams.set('key', key);
  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    const status = data?.error?.status || res.status;
    if (res.status === 403 && /Solar API has not been used|disabled/i.test(msg)) {
      throw new Error(
        `Solar API not enabled yet (403). Phase 0: enable "Solar API" on the GCP project for this key.\n   ${msg}`,
      );
    }
    if (res.status === 404) {
      throw new Error(`No building found near this point (404). K0 coverage FAIL.\n   ${msg}`);
    }
    throw new Error(`buildingInsights failed: ${status} — ${msg}`);
  }
  return data;
}

/** Rough metric size of a lat/lng bounding box, in meters. */
function bboxMeters(bb: { sw: LatLng; ne: LatLng }): { w: number; h: number } {
  const midLat = (bb.sw.latitude + bb.ne.latitude) / 2;
  const mPerDegLat = 111_132;
  const mPerDegLng = 111_320 * Math.cos(degToRad(midLat));
  const h = Math.abs(bb.ne.latitude - bb.sw.latitude) * mPerDegLat;
  const w = Math.abs(bb.ne.longitude - bb.sw.longitude) * mPerDegLng;
  return { w, h };
}

async function main() {
  const address = process.argv[2] || GROUND_TRUTH.address;
  const useTruth = address === GROUND_TRUTH.address;
  const key = process.env.GOOGLE_API_KEY;

  console.log('\n========================================================');
  console.log('  SOLAR-BLITZ — roof-estimator kill-test');
  console.log('========================================================');
  console.log(`  Address : ${address}`);
  if (!key) {
    console.error('\n  ✖ GOOGLE_API_KEY missing from .env — cannot run.\n');
    process.exit(1);
  }

  // 1) Geocode
  let loc: LatLng;
  try {
    loc = await geocode(address, key);
    console.log(`  Geocode : ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`);
  } catch (e: any) {
    console.error(`\n  ✖ ${e.message}\n`);
    process.exit(1);
  }

  // 2) buildingInsights
  let data: any;
  try {
    data = await buildingInsights(loc, key);
  } catch (e: any) {
    console.error(`\n  ✖ ${e.message}\n`);
    console.error('  K0 (coverage) verdict: FAIL/BLOCKED — see message above.\n');
    process.exit(1);
  }

  const sp = data.solarPotential || {};
  const segments: RoofSegment[] = sp.roofSegmentStats || [];
  const whole = sp.wholeRoofStats || {};
  const imageryQuality: string = data.imageryQuality || 'UNKNOWN';
  const imageryDate = data.imageryDate
    ? `${data.imageryDate.year}-${String(data.imageryDate.month).padStart(2, '0')}-${String(data.imageryDate.day).padStart(2, '0')}`
    : 'UNKNOWN';

  // ----- Derived metrics -----
  const totalAreaM2: number =
    whole.areaMeters2 ?? segments.reduce((s, f) => s + (f.stats?.areaMeters2 || 0), 0);
  const squares = m2ToSquares(totalAreaM2);
  const areaSqft = m2ToSqft(totalAreaM2);
  const facetCount = segments.length;

  // Area-weighted modal pitch (the predominant rise/12 bucket with the most area)
  const buckets = new Map<number, number>();
  let areaWeightedDeg = 0;
  let areaSum = 0;
  for (const f of segments) {
    const a = f.stats?.areaMeters2 || 0;
    const rise = pitchToRise(f.pitchDegrees);
    buckets.set(rise, (buckets.get(rise) || 0) + a);
    areaWeightedDeg += f.pitchDegrees * a;
    areaSum += a;
  }
  areaWeightedDeg = areaSum ? areaWeightedDeg / areaSum : 0;
  let modalRise = 0;
  let modalArea = -1;
  buckets.forEach((a, rise) => {
    if (a > modalArea) {
      modalArea = a;
      modalRise = rise;
    }
  });

  // ----- Per-facet table -----
  console.log('\n  Imagery : quality=%s  date=%s', imageryQuality, imageryDate);
  console.log(`  Facets returned: ${facetCount}`);
  console.log('\n  Per-facet (pitch° / rise / azimuth° / area sqft / cos-check):');
  console.log('  ┌─────┬────────┬──────┬──────────┬──────────┬───────────┐');
  console.log('  │  #  │ pitch° │ /12  │ azimuth° │ area sqft│ cos-check │');
  console.log('  ├─────┼────────┼──────┼──────────┼──────────┼───────────┤');
  segments.forEach((f, i) => {
    const a = f.stats?.areaMeters2 || 0;
    const ga = f.stats?.groundAreaMeters2 || 0;
    const expected = ga / Math.cos(degToRad(f.pitchDegrees)); // should ≈ a
    const dev = a ? Math.abs(a - expected) / a : 0;
    const cos = dev < 0.05 ? 'ok' : `off ${(dev * 100).toFixed(0)}%`;
    console.log(
      `  │ ${String(i + 1).padStart(3)} │ ${f.pitchDegrees.toFixed(1).padStart(6)} │ ${String(
        pitchToRise(f.pitchDegrees),
      ).padStart(4)} │ ${f.azimuthDegrees.toFixed(0).padStart(8)} │ ${m2ToSqft(a)
        .toFixed(0)
        .padStart(8)} │ ${cos.padStart(9)} │`,
    );
  });
  console.log('  └─────┴────────┴──────┴──────────┴──────────┴───────────┘');

  // ----- Building-match (bbox size) -----
  let bboxNote = 'n/a';
  let bboxPlausible = true;
  if (data.boundingBox) {
    const { w, h } = bboxMeters(data.boundingBox);
    bboxNote = `${w.toFixed(0)}m × ${h.toFixed(0)}m`;
    // a single-family house footprint is ~8–40 m per side; flag absurd matches
    bboxPlausible = w >= 6 && w <= 80 && h >= 6 && h <= 80;
  }

  // ----- Verdicts -----
  const K0 = facetCount > 0 && (imageryQuality === 'HIGH' || imageryQuality === 'MEDIUM');
  const K1 = useTruth ? Math.abs(pct(squares, GROUND_TRUTH.squares)) <= 5 : true;
  const K2 = useTruth ? Math.abs(modalRise - GROUND_TRUTH.pitchRise) <= 1 : true;
  const K4 = bboxPlausible;

  console.log('\n  ====================  DIFF TABLE  ====================');
  if (useTruth) {
    console.log('  metric            | Solar        | EagleView    |   Δ%      | verdict');
    console.log('  ------------------+--------------+--------------+----------+--------');
    console.log(
      `  total squares     | ${squares.toFixed(1).padEnd(12)} | ${GROUND_TRUTH.squares
        .toFixed(1)
        .padEnd(12)} | ${fmtPct(pct(squares, GROUND_TRUTH.squares)).padStart(8)} | ${verdict(K1)}`,
    );
    console.log(
      `  total area sqft   | ${areaSqft.toFixed(0).padEnd(12)} | ${String(
        GROUND_TRUTH.areaSqft,
      ).padEnd(12)} | ${fmtPct(pct(areaSqft, GROUND_TRUTH.areaSqft)).padStart(8)} | ${verdict(K1)}`,
    );
    console.log(
      `  predominant pitch | ${`${modalRise}/12`.padEnd(12)} | ${`${GROUND_TRUTH.pitchRise}/12`.padEnd(
        12,
      )} | ${`±${Math.abs(modalRise - GROUND_TRUTH.pitchRise)}`.padStart(8)} | ${verdict(K2)}`,
    );
    console.log(
      `  facet count       | ${String(facetCount).padEnd(12)} | ${String(GROUND_TRUTH.facets).padEnd(
        12,
      )} | ${`${facetCount - GROUND_TRUTH.facets >= 0 ? '+' : ''}${facetCount - GROUND_TRUTH.facets}`.padStart(
        8,
      )} | (Google merges small facets — informs confidence)`,
    );
  } else {
    console.log(`  total squares     : ${squares.toFixed(1)}`);
    console.log(`  total area sqft   : ${areaSqft.toFixed(0)}`);
    console.log(`  predominant pitch : ${modalRise}/12  (area-weighted mean ${areaWeightedDeg.toFixed(1)}°)`);
    console.log(`  facet count       : ${facetCount}`);
  }
  console.log(`  bbox size         : ${bboxNote}  ${verdict(K4)}`);

  console.log('\n  ====================  K-VERDICTS  ====================');
  console.log(`  K0 coverage (building + quality HIGH/MED)  : ${verdict(K0)}  [${imageryQuality}]`);
  if (useTruth) {
    console.log(`  K1 area within ~5%                          : ${verdict(K1)}`);
    console.log(`  K2 pitch within 1 increment                 : ${verdict(K2)}`);
    console.log(`  K3 facets (vs 12, merging expected)         : ${facetCount} returned`);
  }
  console.log(`  K4 building-match (bbox plausible)          : ${verdict(K4)}`);

  const go = K0 && K1;
  console.log('\n  ======================================================');
  console.log(
    `  GATE: K0 + K1 => ${go ? 'GO ✅  — build the thin slice (Phase 2)' : 'PIVOT ❌ — see plan pivot triggers'}`,
  );
  console.log('  ======================================================\n');
}

main().catch((e) => {
  console.error('\n  ✖ Unexpected error:', e?.message || e, '\n');
  process.exit(1);
});
