/**
 * roof-recon.ts — R1/R2: reconstruct the takeoff from the FACET CONSTELLATION (no mask, no vision).
 *
 * Insight: a facet's plan-area vs its bounding box encodes its SHAPE, and the shape gives its edges.
 * Orient each facet by azimuth → depth d (eave→ridge) and eaveWidth e. For a trapezoid/triangle the
 * sides slant inward by  inset = e − area/d  (per side):
 *   inset > 0  → the 2 side edges are HIP/VALLEY, plan-len √(inset²+d²); top edge (ridge) = e − 2·inset.
 *   inset ≈ 0  → rectangle → the 2 sides are RAKES (gable), len d; top edge (ridge) = e.
 * Each hip/valley/ridge edge is SHARED by 2 facets → total = ½·Σ(per-facet edges).
 *
 * THIS STEP validates the edge model: ½·Σ slanted-sides  vs  EV (hips+valleys); ½·Σ tops vs EV ridges.
 * (hip-vs-valley split by convex/concave comes next, once the magnitude is right.)
 *
 * Run:  npx tsx server/scripts/roof-recon.ts
 */
import 'dotenv/config';
import { geocode, buildingInsights, degToRad, m2ToSqft } from '../estimate/measure';

const ROOFS = [
  { slug: '3605 ', address: '3605 SE 57th Cir, Oklahoma City, OK 73135', pitch: 6, evHV: 31, evRidge: 59.68 },
  { slug: 'Lee  ', address: '6320 N Warren Avenue, Warr Acres, OK', pitch: 6, evHV: 39, evRidge: 90.35 },
  { slug: 'Hinkle', address: '4024 N Nicklas Avenue, Oklahoma City, OK', pitch: 6, evHV: 196, evRidge: 65.18 },
  { slug: 'Crest', address: '19428 Crestridge Dr, Edmond, OK 73012', pitch: 8, evHV: 278, evRidge: 58 },
];
const hvMult = (p12: number) => { const s = p12 / 12; return Math.sqrt(1 + (s * s) / 2); };
const M_PER_DEG_LAT = 111_132;
const pct = (got: number, exp: number) => exp > 0 ? `${got - exp >= 0 ? '+' : ''}${(((got - exp) / exp) * 100).toFixed(0)}%` : (got < 5 ? '✓~0' : `+${got.toFixed(0)}`);

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  console.log('\n  R1/R2 — takeoff from the facet constellation (½·Σ slanted = hips+valleys; ½·Σ tops = ridges):\n');
  for (const r of ROOFS) {
    try {
      const { location } = await geocode(r.address, key);
      const data = await buildingInsights(location, key);
      const segs: any[] = data.solarPotential?.roofSegmentStats || [];
      const cLat = data.center?.latitude ?? location.lat;
      const mLng = 111_320 * Math.cos(degToRad(cLat)); const FT = 3.28084;
      let slantSym = 0, slant1 = 0, topSum = 0;
      for (const f of segs) {
        const az = ((f.azimuthDegrees ?? 0) % 360 + 360) % 360;
        const card = Math.round(az / 90) % 4; // 0=N 1=E 2=S 3=W
        const bb = f.boundingBox || {};
        const bw = bb.sw && bb.ne ? Math.abs(bb.ne.longitude - bb.sw.longitude) * mLng * FT : 0; // E-W extent
        const bh = bb.sw && bb.ne ? Math.abs(bb.ne.latitude - bb.sw.latitude) * M_PER_DEG_LAT * FT : 0; // N-S extent
        const plan = m2ToSqft(f.stats?.groundAreaMeters2 || 0);
        const nsFacing = card === 0 || card === 2;
        const d = nsFacing ? bh : bw;   // depth eave→ridge
        const e = nsFacing ? bw : bh;   // eave width (perpendicular)
        if (d < 1 || e < 1) continue;
        const fill = plan / (d * e);    // 1=rect (rakes), ~0.5=triangle (hips), between=trapezoid
        if (fill < 0.82) {              // slanted sides → hip/valley
          const insetSym = e - plan / d;        // narrowing split over BOTH sides
          const inset1 = 2 * (e - plan / d);     // all narrowing on ONE side
          slantSym += 2 * Math.hypot(Math.max(insetSym, 0), d);
          slant1 += Math.hypot(Math.max(inset1, 0), d) + d; // one slant + one rake(=d, not a hip)
          topSum += Math.max(0, e - 2 * insetSym);
        } else {                        // rectangle → full-width ridge (shared)
          topSum += e;
        }
      }
      const m = hvMult(r.pitch);
      const hvSym = 0.5 * slantSym * m;
      const hv1 = 0.5 * slant1 * m; // one-sided counts 1 slant + 1 rake; only the slant is hip/valley — approx
      const ridge = 0.5 * topSum;
      console.log(`  ${r.slug.padEnd(7)} hips+valleys: sym ${hvSym.toFixed(0)} (${pct(hvSym, r.evHV)}) | 1-side ${hv1.toFixed(0)} (${pct(hv1, r.evHV)})  EV ${r.evHV}   |   ridges ${ridge.toFixed(0)} (${pct(ridge, r.evRidge)}) EV ${r.evRidge}`);
    } catch (e: any) { console.log(`  ${r.slug}: ✗ ${e?.message || e}`); }
  }
  console.log('');
}
main();
