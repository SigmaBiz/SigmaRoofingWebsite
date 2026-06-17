/**
 * decompose.ts — the EagleView-style "area by pitch" breakdown, from Google's FREE per-facet data.
 *
 * Google's buildingInsights already segments the roof and hands us, per facet, a slope + a true
 * (sloped) area. So the decomposition Antonio describes is just: group facets by slope, sum the
 * scalar areas per slope. Total = Σ areas (L1, not a vector resultant). This is what EagleView
 * reports — and we get it without the expensive DSM. The slope→facet assignment is reliable
 * (validated pitch); the absolute areas carry the ~±6% boundary noise.
 *
 * Run:  npx tsx server/scripts/decompose.ts
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { computeMeasurement } from '../estimate/measure';

type Entry = { address: string; eagleview?: { squares: number; pitch: string; pitch_note?: string } | null };
const riseOf = (p: string) => parseInt(String(p).split('/')[0], 10);

/** merge facets into pitch "families": adjacent rises within `gap` collapse into one (area-weighted). */
function families(byRise: Map<number, number>, gap = 2) {
  const rises = [...byRise.keys()].sort((a, b) => a - b);
  const groups: { rise: number; area: number }[] = [];
  let cur: number[] = [];
  const flush = () => {
    if (!cur.length) return;
    const area = cur.reduce((s, r) => s + (byRise.get(r) || 0), 0);
    const wRise = cur.reduce((s, r) => s + r * (byRise.get(r) || 0), 0) / area;
    groups.push({ rise: Math.round(wRise), area });
    cur = [];
  };
  for (const r of rises) {
    if (cur.length && r - cur[cur.length - 1] > gap) flush();
    cur.push(r);
  }
  flush();
  return groups.sort((a, b) => b.area - a.area);
}

async function main() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) { console.error('GOOGLE_API_KEY missing'); process.exit(1); }
  const entries: Entry[] = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'server/estimate/ground-truth.json'), 'utf8'),
  );

  for (const e of entries) {
    try {
      const m = await computeMeasurement(e.address, key);
      const total = m.totals.area_sqft;
      const byRise = new Map<number, number>();
      for (const f of m.facets) byRise.set(riseOf(f.pitch), (byRise.get(riseOf(f.pitch)) || 0) + f.area_sqft);

      console.log(`\n  ${e.address}`);
      console.log(`  total: ${m.totals.squares} sq (${total} sqft) · ${m.facets.length} facets`);
      console.log('   pitch | area sqft | squares | share');
      console.log('   ------+-----------+---------+------');
      [...byRise.entries()].sort((a, b) => b[1] - a[1]).forEach(([rise, area]) => {
        console.log(`   ${(rise + '/12').padEnd(5)} | ${String(area).padStart(9)} | ${(area / 100).toFixed(1).padStart(7)} | ${((area / total) * 100).toFixed(0).padStart(3)}%`);
      });
      const fam = families(byRise).map((g) => `${g.rise}/12 @ ${((g.area / total) * 100).toFixed(0)}%`).join('  +  ');
      console.log(`   → pitch families: ${fam}`);
      if (e.eagleview) console.log(`   → EagleView truth: ${e.eagleview.squares} sq · ${e.eagleview.pitch_note || e.eagleview.pitch}`);
    } catch (err: any) {
      console.log(`\n  ${e.address}\n   ✗ ${err?.message || err}`);
    }
  }
  console.log('');
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
