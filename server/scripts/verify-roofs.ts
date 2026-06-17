/**
 * verify-roofs.ts — the corroborator cohort (spec §9).
 *
 * Runs the production measurement core against every address in
 * server/estimate/ground-truth.json and diffs Solar vs the EagleView truth Antonio supplies.
 * Tracks the two things that decide the product: COVERAGE (does Solar even have the roof?)
 * and ERROR (how far off are squares/pitch when it does). Add roofs to the JSON, re-run.
 *
 * Run:  npx tsx server/scripts/verify-roofs.ts
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { computeMeasurement, EstimateError } from '../estimate/measure';

type Entry = { address: string; eagleview?: { squares: number; pitch: string } | null };

const riseOf = (p: string) => parseInt(String(p).split('/')[0], 10);
const shortAddr = (a: string) => a.split(',').slice(0, 1).join('').slice(0, 26).padEnd(26);

async function main() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) { console.error('GOOGLE_API_KEY missing'); process.exit(1); }

  const file = path.join(process.cwd(), 'server/estimate/ground-truth.json');
  const entries: Entry[] = JSON.parse(fs.readFileSync(file, 'utf8'));

  console.log('\n================  CORROBORATOR COHORT — Solar vs EagleView  ================\n');
  console.log('  address                    | cover | Solar sq | EV sq | Δ sq%  | Solar | EV   | pitch');
  console.log('  ---------------------------+-------+----------+-------+--------+-------+------+------');

  let covered = 0;
  const sqErrs: number[] = [];
  let pitchExact = 0, pitchWithin1 = 0, pitchTruthN = 0;

  for (const e of entries) {
    let line = `  ${shortAddr(e.address)} | `;
    try {
      const m = await computeMeasurement(e.address, key);
      covered++;
      const solarSq = m.totals.squares;
      const solarRise = riseOf(m.totals.predominant_pitch);
      const ev = e.eagleview;
      if (ev) {
        const dSq = ((solarSq - ev.squares) / ev.squares) * 100;
        sqErrs.push(Math.abs(dSq));
        let dRise = NaN, pstr = '—';
        if (ev.pitch) { pitchTruthN++; dRise = solarRise - riseOf(ev.pitch); if (dRise === 0) pitchExact++; if (Math.abs(dRise) <= 1) pitchWithin1++; pstr = ev.pitch; }
        const ok = Math.abs(dSq) <= 5 && (isNaN(dRise) || Math.abs(dRise) <= 1) ? '✅' : '⚠️';
        line += `  ✓   | ${String(solarSq).padStart(8)} | ${String(ev.squares).padStart(5)} | ${(dSq >= 0 ? '+' : '') + dSq.toFixed(1)}%`;
        line += ` | ${(solarRise + '/12').padStart(5)} | ${pstr.padEnd(4)} | ${ok}`;
      } else {
        line += `  ✓   | ${String(solarSq).padStart(8)} | ${'—'.padStart(5)} | ${'(no EV truth yet)'.padStart(6)} | ${(solarRise + '/12').padStart(5)} | ${'—'.padEnd(4)} |`;
      }
    } catch (err: any) {
      const code = err instanceof EstimateError ? err.code : 'ERROR';
      line += ` ✗ ${code}`;
    }
    console.log(line);
  }

  const n = entries.length;
  const meanErr = sqErrs.length ? sqErrs.reduce((a, b) => a + b, 0) / sqErrs.length : NaN;
  const maxErr = sqErrs.length ? Math.max(...sqErrs) : NaN;

  console.log('\n  ----------------------------------------  AGGREGATE  ----------------------------------------');
  console.log(`  roofs tested        : ${n}`);
  console.log(`  Solar coverage      : ${covered}/${n}  (${((covered / n) * 100).toFixed(0)}%)   ← rest route to a free inspection`);
  if (sqErrs.length) {
    console.log(`  squares mean |Δ|    : ${meanErr.toFixed(1)}%   (max ${maxErr.toFixed(1)}%)   [target ≤5%]`);
    console.log(`  pitch exact         : ${pitchExact}/${pitchTruthN}    within 1 increment: ${pitchWithin1}/${pitchTruthN}`);
  } else {
    console.log('  (no EagleView truth entered yet — add "eagleview": { "squares": N, "pitch": "X/12" } to entries)');
  }
  console.log('');
}

main().catch((e) => { console.error(e?.message || e); process.exit(1); });
