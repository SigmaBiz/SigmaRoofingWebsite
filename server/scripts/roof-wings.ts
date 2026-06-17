/**
 * roof-wings.ts — NEUTRINO HARNESS: derive valley feet from Solar's per-facet CONSTELLATION
 * (azimuth + plan-area + position), vision-free. The flush cross-wing the footprint hides shows up
 * here as a facet pair on a SECONDARY ridge axis. Valleys come from the cross-wings' width.
 *
 * METHOD: bin facets to cardinal (N/E/S/W) by azimuth. The dominant opposite-pair = the MAIN ridge.
 * Facets on the OTHER axis = cross-wing(s) → each spawns 2 valleys of (Wc/2)·√2 (×√(1+s²/2) to true).
 * Wc = the cross-wing's extent perpendicular to the main ridge. We print 3 Wc estimators (bbox span,
 * 2×center-offset, plan-area/run) to see which tracks EagleView, then lock it.
 *
 * Run:  npx tsx server/scripts/roof-wings.ts
 */
import 'dotenv/config';
import { geocode, buildingInsights, degToRad, m2ToSqft, pitchToRise } from '../estimate/measure';

const ROOFS = [
  { slug: '3605  (val 0)', address: '3605 SE 57th Cir, Oklahoma City, OK 73135', ev: 0, pitch: 6 },
  { slug: 'Lee   (val 39)', address: '6320 N Warren Avenue, Warr Acres, OK', ev: 39.13, pitch: 6 },
  { slug: 'Hinkle(val 48)', address: '4024 N Nicklas Avenue, Oklahoma City, OK', ev: 47.9, pitch: 6 },
  { slug: 'Crest (val 87)', address: '19428 Crestridge Dr, Edmond, OK 73012', ev: 87, pitch: 8 },
];
const valMult = (p12: number) => { const s = p12 / 12; return Math.sqrt(1 + (s * s) / 2); };
const M_PER_DEG_LAT = 111_132;

type F = { az: number; card: 'N' | 'E' | 'S' | 'W'; plan: number; bw: number; bh: number; offE: number; offN: number; sMin: number; sMax: number; eMin: number; eMax: number };

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  console.log('\n  NEUTRINO HARNESS — valleys from the facet constellation (vision-free):\n');
  for (const r of ROOFS) {
    try {
      const { location } = await geocode(r.address, key);
      const data = await buildingInsights(location, key);
      const segs: any[] = data.solarPotential?.roofSegmentStats || [];
      const cLat = data.center?.latitude ?? location.lat, cLng = data.center?.longitude ?? location.lng;
      const mLng = 111_320 * Math.cos(degToRad(cLat));
      const FT = 3.28084;
      const facets: F[] = segs.map((f) => {
        const az = ((f.azimuthDegrees ?? 0) % 360 + 360) % 360;
        const card = (['N', 'E', 'S', 'W'] as const)[Math.round(az / 90) % 4];
        const bb = f.boundingBox || {};
        const bw = bb.sw && bb.ne ? Math.abs(bb.ne.longitude - bb.sw.longitude) * mLng * FT : 0;
        const bh = bb.sw && bb.ne ? Math.abs(bb.ne.latitude - bb.sw.latitude) * M_PER_DEG_LAT * FT : 0;
        const offE = ((f.center?.longitude ?? cLng) - cLng) * mLng * FT;
        const offN = ((f.center?.latitude ?? cLat) - cLat) * M_PER_DEG_LAT * FT;
        const eMin = bb.sw ? (bb.sw.longitude - cLng) * mLng * FT : offE, eMax = bb.ne ? (bb.ne.longitude - cLng) * mLng * FT : offE;
        const sMin = bb.sw ? (bb.sw.latitude - cLat) * M_PER_DEG_LAT * FT : offN, sMax = bb.ne ? (bb.ne.latitude - cLat) * M_PER_DEG_LAT * FT : offN;
        return { az, card, plan: m2ToSqft(f.stats?.groundAreaMeters2 || 0), bw, bh, offE, offN, sMin, sMax, eMin, eMax };
      });
      const areaBy = (c: string) => facets.filter((f) => f.card === c).reduce((s, f) => s + f.plan, 0);
      const NS = areaBy('N') + areaBy('S'), EW = areaBy('E') + areaBy('W');
      // main ridge axis = the opposite-pair with the larger plan area; cross-wing facets are on the OTHER axis
      const mainIsNSridge = EW >= NS; // EW facets (face E/W) => ridge runs N-S
      // cross wings = facets that face ALONG the main ridge (their ridge is perpendicular to main)
      const crossCards: readonly string[] = mainIsNSridge ? ['N', 'S'] : ['E', 'W'];
      const cross = facets.filter((f) => crossCards.includes(f.card));
      const mult = valMult(r.pitch);
      // Wc estimators across the cross-wing facets (perp to main ridge):
      // perp axis = N-S if main ridge is N-S? No: cross wing runs ALONG main ridge; its WIDTH is perp to ITS OWN ridge,
      // i.e. along the main-ridge direction. main ridge N-S => cross width measured along N-S.
      const perpN = mainIsNSridge; // measure cross width along N (true) or E (false)
      const span = (arr: F[], pn: boolean) => {
        if (!arr.length) return 0;
        const lo = Math.min(...arr.map((f) => (pn ? f.sMin : f.eMin)));
        const hi = Math.max(...arr.map((f) => (pn ? f.sMax : f.eMax)));
        return hi - lo;
      };
      const Wc_bbox = span(cross, perpN);
      const centers = cross.map((f) => (perpN ? f.offN : f.offE));
      const Wc_centers = centers.length >= 2 ? 2 * (Math.max(...centers) - Math.min(...centers)) : 0;
      const run = span(cross, !perpN) || 1; // cross-wing extent along its own ridge
      const Wc_area = cross.reduce((s, f) => s + f.plan, 0) / run;
      const v = (wc: number) => +(wc * Math.SQRT2 * mult).toFixed(0); // 2×(Wc/2)√2 = Wc√2
      const pct = (t: number) => r.ev > 0 ? `${t - r.ev >= 0 ? '+' : ''}${(((t - r.ev) / r.ev) * 100).toFixed(0)}%` : (t < 5 ? '✓~0' : `+${t.toFixed(0)}`);
      console.log(`  ${r.slug.padEnd(15)} axes NS:${Math.round(NS)} EW:${Math.round(EW)}  main=${mainIsNSridge ? 'N-S' : 'E-W'} ridge  cross=${cross.length}f`);
      console.log(`      Wc bbox=${Wc_bbox.toFixed(0)} centers=${Wc_centers.toFixed(0)} area/run=${Wc_area.toFixed(0)}  →  valleys bbox ${v(Wc_bbox)} (${pct(v(Wc_bbox))}) | centers ${v(Wc_centers)} (${pct(v(Wc_centers))}) | area ${v(Wc_area)} (${pct(v(Wc_area))})   EV ${r.ev}`);
    } catch (e: any) { console.log(`  ${r.slug}: ✗ ${e?.message || e}`); }
  }
  console.log('');
}
main();
