/**
 * vision-live.ts — full pipeline live, WITH Solar facet hints: address -> measure (pitch + facets) ->
 * blueprint (pre-rendered) -> Claude vision (hinted) -> assemble -> geometry -> takeoff, vs EagleView.
 * Needs ANTHROPIC_API_KEY + GOOGLE_API_KEY. Run: npx tsx server/scripts/vision-live.ts
 */
import 'dotenv/config';
import { readRoofStructure } from '../estimate/vision';
import { assemble } from '../estimate/assemble';
import { computeMeasurement } from '../estimate/measure';

const PX_PER_FT = 6.1; // from roof-blueprint.ts (0.1m px, 2x scale)
const ROOFS = [
  { slug: 'lee', address: '6320 N Warren Avenue, Warr Acres, OK', ev: { ridges: 90.35, hips: 0, valleys: 39.13 } },
  { slug: 'crestridge', address: '19428 Crestridge Dr, Edmond, OK 73012', ev: { ridges: 58, hips: 191, valleys: 87 } },
  { slug: 'hinkle', address: '4024 N Nicklas Avenue, Oklahoma City, OK', ev: { ridges: 65.18, hips: 148.47, valleys: 47.9 } },
];

const pc = (a: number, b: number) => (b ? `${a - b >= 0 ? '+' : ''}${(((a - b) / b) * 100).toFixed(0)}%` : (a === 0 ? 'exact' : 'n/a'));

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  for (const r of ROOFS) {
    console.log(`\n================  ${r.slug.toUpperCase()}  ================`);
    try {
      const m = await computeMeasurement(r.address, key);
      const hint = `${m.totals.facet_count} facets; per-facet (azimuth°→area sqft): ` +
        m.facets.map((f) => `${f.azimuth_degrees}→${f.area_sqft}`).join(', ');
      const rs = await readRoofStructure(`client/public/blueprint-${r.slug}.png`, m.totals.predominant_pitch, PX_PER_FT, hint);
      console.log(`  pitch ${m.totals.predominant_pitch} · ${m.totals.facet_count} facets · vision confidence ${rs.confidence || '?'}`);
      console.log(`  notes: ${rs.notes || ''}`);
      console.log(`  prims: ${JSON.stringify(rs.prims)}${rs.junctions ? ' junctions: ' + JSON.stringify(rs.junctions) : ''}`);
      const t = assemble(rs);
      console.log(`  ridges  ${t.ridge.toFixed(0).padStart(4)} | EV ${String(r.ev.ridges).padStart(6)} | ${pc(t.ridge, r.ev.ridges)}`);
      console.log(`  hips    ${t.hips.toFixed(0).padStart(4)} | EV ${String(r.ev.hips).padStart(6)} | ${pc(t.hips, r.ev.hips)}`);
      console.log(`  valleys ${t.valleys.toFixed(0).padStart(4)} | EV ${String(r.ev.valleys).padStart(6)} | ${pc(t.valleys, r.ev.valleys)}`);
    } catch (e: any) {
      console.log(`  ✗ ${e?.message || e}`);
    }
  }
  console.log('');
}
main();
