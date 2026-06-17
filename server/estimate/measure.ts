/**
 * measure.ts — the roof-measurement core (shared by the /api/estimate route).
 *
 * address -> geocode -> Google Solar API buildingInsights -> a clean Measurement
 * (total squares, predominant pitch, facet count, per-facet stats) + a confidence score.
 *
 * This is the production sibling of server/scripts/solar-blitz.ts. The blitz is kept as an
 * INDEPENDENT oracle (a second implementation) so its numbers cross-check this one — on
 * 19428 Crestridge Dr both must read ~44.6 squares / 8-12 / 12 facets.
 *
 * v1 scope: NO geometry engine (no linear-foot takeoff) — squares + pitch + facets only.
 * Requires GOOGLE_API_KEY with Solar API + Geocoding API enabled (GCP project 31141248090).
 */

export type LatLng = { lat: number; lng: number };

export type Facet = {
  id: number;
  pitch: string; // "8/12"
  pitch_degrees: number;
  azimuth_degrees: number;
  area_sqft: number;
  squares: number;
};

export type Measurement = {
  address: string; // Google's formatted address
  coordinates: LatLng;
  imagery: { date: string; quality: string; age_years: number };
  totals: {
    area_sqft: number;
    squares: number;
    predominant_pitch: string; // "8/12"
    pitch_degrees: number; // area-weighted mean
    facet_count: number;
  };
  facets: Facet[];
  confidence: { score: number; tier: 'HIGH' | 'MEDIUM' | 'LOW'; reasons: string[] };
};

/** Typed failure with a code the route maps to a user-facing branch. */
export class EstimateError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'EstimateError';
    this.code = code;
  }
}

// ----- unit conversions -----
const M2_PER_SQUARE = 9.290304; // 1 roofing square = 100 sqft
const SQFT_PER_M2 = 10.7639;
export const m2ToSquares = (m2: number) => m2 / M2_PER_SQUARE;
export const m2ToSqft = (m2: number) => m2 * SQFT_PER_M2;
export const degToRad = (d: number) => (d * Math.PI) / 180;
/** pitchDegrees -> nearest "rise/12" integer */
export const pitchToRise = (deg: number) => Math.round(12 * Math.tan(degToRad(deg)));

// ----- external calls (cost-guarded by a 24h in-memory memo) -----
// A building's geocode + roof don't change between reroofs, so we cache BOTH the geocode and the (more
// expensive) Solar buildingInsights. This is what keeps an estimate at ~1 buildingInsights call even though the
// satellite-outline image endpoint also needs it: same address/building -> cache hit, not a second paid call.
const CALL_TTL_MS = 1000 * 60 * 60 * 24;
const geoCache = new Map<string, { v: { location: LatLng; formattedAddress: string }; ts: number }>();
const biCache = new Map<string, { v: any; ts: number }>();

export async function geocode(
  address: string,
  key: string,
): Promise<{ location: LatLng; formattedAddress: string }> {
  const ck = address.toLowerCase().replace(/\s+/g, ' ').trim();
  const cached = geoCache.get(ck);
  if (cached && Date.now() - cached.ts < CALL_TTL_MS) return cached.v;

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', key);
  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (data.status === 'ZERO_RESULTS') {
    throw new EstimateError('GEOCODE_ZERO', 'We could not find that address.');
  }
  if (res.status === 429 || data.status === 'OVER_QUERY_LIMIT') {
    throw new EstimateError('RATE_LIMITED', 'Geocoding per-minute quota reached — try again shortly.');
  }
  if (data.status !== 'OK') {
    throw new EstimateError(
      'GEOCODE_DENIED',
      `Geocoding failed: ${data.status}${data.error_message ? ` — ${data.error_message}` : ''}`,
    );
  }
  const r = data.results[0];
  const v = {
    location: { lat: r.geometry.location.lat, lng: r.geometry.location.lng },
    formattedAddress: r.formatted_address,
  };
  geoCache.set(ck, { v, ts: Date.now() });
  return v;
}

export async function buildingInsights(loc: LatLng, key: string): Promise<any> {
  const ck = `${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;
  const cached = biCache.get(ck);
  if (cached && Date.now() - cached.ts < CALL_TTL_MS) return cached.v;

  const url = new URL('https://solar.googleapis.com/v1/buildingInsights:findClosest');
  url.searchParams.set('location.latitude', String(loc.lat));
  url.searchParams.set('location.longitude', String(loc.lng));
  url.searchParams.set('key', key);
  const res = await fetch(url.toString());
  const data: any = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || res.statusText;
    if (res.status === 404) {
      throw new EstimateError('NO_BUILDING', 'No building was found at that location.');
    }
    if (res.status === 403 && /has not been used|disabled|not been used|activated/i.test(msg)) {
      throw new EstimateError('SOLAR_NOT_ENABLED', msg);
    }
    if (res.status === 429) {
      throw new EstimateError('RATE_LIMITED', 'Solar per-minute quota reached — try again shortly.');
    }
    throw new EstimateError('SOLAR_ERROR', `buildingInsights failed: ${msg}`);
  }
  biCache.set(ck, { v: data, ts: Date.now() });
  return data;
}

/** Rough metric size of a lat/lng bounding box, in meters. */
function bboxMeters(bb: any): { w: number; h: number } {
  if (!bb?.sw || !bb?.ne) return { w: 0, h: 0 };
  const midLat = (bb.sw.latitude + bb.ne.latitude) / 2;
  const mPerDegLat = 111_132;
  const mPerDegLng = 111_320 * Math.cos(degToRad(midLat));
  const h = Math.abs(bb.ne.latitude - bb.sw.latitude) * mPerDegLat;
  const w = Math.abs(bb.ne.longitude - bb.sw.longitude) * mPerDegLng;
  return { w, h };
}

function scoreConfidence(args: {
  quality: string;
  ageYears: number;
  facetCount: number;
  cosFailFraction: number;
  modalShare: number;
  bboxPlausible: boolean;
}): Measurement['confidence'] {
  const { quality, ageYears, facetCount, cosFailFraction, modalShare, bboxPlausible } = args;
  const reasons: string[] = [];
  let score = quality === 'HIGH' ? 1.0 : quality === 'MEDIUM' ? 0.7 : 0.4;
  reasons.push(`Imagery quality ${quality}`);

  if (ageYears > 3) {
    const pen = Math.min(0.3, (ageYears - 3) * 0.06);
    score -= pen;
    reasons.push(`Imagery ~${ageYears.toFixed(1)} yr old — confirm no recent re-roof`);
  }
  if (cosFailFraction > 0.15) {
    score -= 0.2;
    reasons.push('Some facets fail the area/pitch consistency check');
  }
  if (modalShare < 0.6) {
    score -= 0.2;
    reasons.push('Mixed pitches detected — multi-level or added-on roof');
  }
  if (!bboxPlausible) {
    score -= 0.3;
    reasons.push('Building match uncertain (the wrong structure may have been measured)');
  }
  if (facetCount > 16) {
    score -= 0.1;
    reasons.push('Highly complex roof');
  }
  score = Math.max(0, Math.min(1, score));
  const tier: Measurement['confidence']['tier'] =
    score >= 0.75 ? 'HIGH' : score >= 0.5 ? 'MEDIUM' : 'LOW';
  return { score: Math.round(score * 100) / 100, tier, reasons };
}

/** address -> full Measurement. Throws EstimateError on any unrecoverable step. */
export async function computeMeasurement(address: string, key: string): Promise<Measurement> {
  const { location, formattedAddress } = await geocode(address, key);
  const data = await buildingInsights(location, key);

  const sp = data.solarPotential || {};
  const segments: any[] = sp.roofSegmentStats || [];
  if (!segments.length) {
    throw new EstimateError('NO_BUILDING', 'No roof segments were returned for this building.');
  }

  const quality: string = data.imageryQuality || 'UNKNOWN';
  const d = data.imageryDate;
  const date = d ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` : 'UNKNOWN';
  const ageYears = d
    ? (Date.now() - new Date(d.year, (d.month || 1) - 1, d.day || 1).getTime()) / (365.25 * 864e5)
    : 0;

  // per-facet + area-weighted pitch + modal pitch bucket + cos-consistency
  const facets: Facet[] = [];
  const buckets = new Map<number, number>();
  let areaWeightedDeg = 0;
  let areaSum = 0;
  let cosFails = 0;
  segments.forEach((f, i) => {
    const a = f.stats?.areaMeters2 || 0;
    const ga = f.stats?.groundAreaMeters2 || 0;
    const rise = pitchToRise(f.pitchDegrees);
    buckets.set(rise, (buckets.get(rise) || 0) + a);
    areaWeightedDeg += f.pitchDegrees * a;
    areaSum += a;
    const expected = ga / Math.cos(degToRad(f.pitchDegrees));
    if (a && Math.abs(a - expected) / a >= 0.05) cosFails++;
    facets.push({
      id: i + 1,
      pitch: `${rise}/12`,
      pitch_degrees: Math.round(f.pitchDegrees * 10) / 10,
      azimuth_degrees: Math.round(f.azimuthDegrees),
      area_sqft: Math.round(m2ToSqft(a)),
      squares: Math.round(m2ToSquares(a) * 10) / 10,
    });
  });
  areaWeightedDeg = areaSum ? areaWeightedDeg / areaSum : 0;

  let modalRise = 0;
  let modalArea = -1;
  buckets.forEach((a, rise) => {
    if (a > modalArea) {
      modalArea = a;
      modalRise = rise;
    }
  });
  const modalShare = areaSum ? modalArea / areaSum : 0;

  const totalAreaM2: number =
    sp.wholeRoofStats?.areaMeters2 ?? segments.reduce((s, f) => s + (f.stats?.areaMeters2 || 0), 0);

  const { w, h } = bboxMeters(data.boundingBox);
  const bboxPlausible = w >= 6 && w <= 80 && h >= 6 && h <= 80;

  const confidence = scoreConfidence({
    quality,
    ageYears,
    facetCount: segments.length,
    cosFailFraction: segments.length ? cosFails / segments.length : 0,
    modalShare,
    bboxPlausible,
  });

  return {
    address: formattedAddress,
    coordinates: location,
    imagery: { date, quality, age_years: Math.round(ageYears * 10) / 10 },
    totals: {
      area_sqft: Math.round(m2ToSqft(totalAreaM2)),
      squares: Math.round(m2ToSquares(totalAreaM2) * 10) / 10,
      predominant_pitch: `${modalRise}/12`,
      pitch_degrees: Math.round(areaWeightedDeg * 10) / 10,
      facet_count: segments.length,
    },
    facets,
    confidence,
  };
}
