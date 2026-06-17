/**
 * facet-probe.ts — NEUTRINO TEST: does Solar's per-facet data (azimuth + plan-area + position)
 * already encode the wing structure the FOOTPRINT hides (esp. Lee's flush cross-wing)?
 *
 * For each roof, dump every roofSegmentStat: compass(azimuth), pitch, plan-area (groundArea), the
 * bbox extent, and the facet center as a relative offset (ft E / ft N from the building center).
 * If Lee shows a N+S azimuth PAIR (a cross-wing) that its 1-reflex-corner footprint can't show,
 * the neutrino is real: valleys are derivable from the facet constellation, vision-free.
 *
 * Run:  npx tsx server/scripts/facet-probe.ts
 */
import 'dotenv/config';
import { geocode, buildingInsights, degToRad, m2ToSqft, pitchToRise } from '../estimate/measure';

const ROOFS = [
  { slug: '3605  (val 0)', address: '3605 SE 57th Cir, Oklahoma City, OK 73135' },
  { slug: 'Lee   (val 39, FLUSH wing)', address: '6320 N Warren Avenue, Warr Acres, OK' },
  { slug: 'Hinkle(val 48)', address: '4024 N Nicklas Avenue, Oklahoma City, OK' },
  { slug: 'Crest (val 87)', address: '19428 Crestridge Dr, Edmond, OK 73012' },
];
const compass = (az: number) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((az % 360) + 360) % 360 / 45) % 8];
};
const M_PER_DEG_LAT = 111_132;

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  for (const r of ROOFS) {
    try {
      const { location } = await geocode(r.address, key);
      const data = await buildingInsights(location, key);
      const sp = data.solarPotential || {};
      const segs: any[] = sp.roofSegmentStats || [];
      const cLat = data.center?.latitude ?? location.lat, cLng = data.center?.longitude ?? location.lng;
      const mPerDegLng = 111_320 * Math.cos(degToRad(cLat));
      console.log(`\n  ${r.slug}  —  ${segs.length} facets`);
      // sort by compass then plan-area desc
      const rows = segs.map((f) => {
        const az = f.azimuthDegrees ?? 0;
        const planFt = m2ToSqft(f.stats?.groundAreaMeters2 || 0);
        const slopeFt = m2ToSqft(f.stats?.areaMeters2 || 0);
        const bb = f.boundingBox || {};
        const bw = bb.sw && bb.ne ? Math.abs(bb.ne.longitude - bb.sw.longitude) * mPerDegLng * 3.28084 : 0;
        const bh = bb.sw && bb.ne ? Math.abs(bb.ne.latitude - bb.sw.latitude) * M_PER_DEG_LAT * 3.28084 : 0;
        const offE = ((f.center?.longitude ?? cLng) - cLng) * mPerDegLng * 3.28084;
        const offN = ((f.center?.latitude ?? cLat) - cLat) * M_PER_DEG_LAT * 3.28084;
        return { az, comp: compass(az), pitch: pitchToRise(f.pitchDegrees), planFt, slopeFt, bw, bh, offE, offN };
      }).sort((a, b) => a.az - b.az);
      for (const x of rows) {
        console.log(`    ${x.comp.padEnd(2)} az${String(Math.round(x.az)).padStart(3)}  ${x.pitch}/12  plan ${String(Math.round(x.planFt)).padStart(4)} sqft  bbox ${Math.round(x.bw)}×${Math.round(x.bh)} ft  @(E${x.offE >= 0 ? '+' : ''}${x.offE.toFixed(0)}, N${x.offN >= 0 ? '+' : ''}${x.offN.toFixed(0)})`);
      }
      // azimuth histogram (which directions exist = wing orientations)
      const byDir = new Map<string, number>();
      for (const x of rows) byDir.set(x.comp, (byDir.get(x.comp) || 0) + x.planFt);
      const dirStr = [...byDir.entries()].sort((a, b) => b[1] - a[1]).map(([d, a]) => `${d}:${Math.round(a)}`).join('  ');
      console.log(`    → azimuth-clusters (plan sqft): ${dirStr}`);
    } catch (e: any) { console.log(`  ${r.slug}: ✗ ${e?.message || e}`); }
  }
  console.log('');
}
main();
