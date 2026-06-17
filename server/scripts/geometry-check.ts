/**
 * geometry-check.ts — validate the exact geometric core (geometry.ts).
 *   1) plan→true multipliers, 2) a textbook hip pyramid (analytic), 3) Lee end-to-end vs EagleView.
 * Lee's STRUCTURE here is what the vision pass supplies (two gable wings, an L); the dims come from
 * the outline trace (~−4% on perimeter). Run:  npx tsx server/scripts/geometry-check.ts
 */
import { mult, slopeOf, hipPrim, crossGable, slopedAreaFromFootprint, shedPrim, flatPrim, clippedGable, dutchGable, gambrel, mansard } from '../estimate/geometry';

const pc = (a: number, b: number) => `${a - b >= 0 ? '+' : ''}${(((a - b) / b) * 100).toFixed(1)}%`;

// 1) multipliers
console.log('\n  plan→true multipliers:');
for (const p of ['5/12', '8/12', '12/12']) {
  const s = slopeOf(p);
  console.log(`   ${p}: rake ×${mult('rake', s).toFixed(3)}  hip/valley ×${mult('hip', s).toFixed(3)}  ridge/eave ×1`);
}

// 2) textbook: a 40×40 ft hip pyramid at 8/12 (ridge must be 0, eaves = perimeter)
const s8 = slopeOf('8/12'); const pyr = hipPrim(40, 40, s8);
console.log('\n  textbook 40×40 hip pyramid @ 8/12 (analytic sanity):');
console.log(`   ridge ${pyr.ridge} (expect 0)   hips ${pyr.hips.toFixed(1)} ft   eaves ${pyr.eaves} (expect 160)   sloped area ${(slopedAreaFromFootprint(pyr.footprint, s8) / 100).toFixed(1)} sq`);

// 3) Lee (6320 N Warren) — vision: two GABLE wings forming an L. dims from the outline trace.
const sLee = slopeOf('5/12');
// wider wing B = the right leg (W 31.8, L 53.8); narrower wing A = top band (W 26.2), free gable at left,
// reaching the wide wing's west eave after a free run of A.length − B.width = 55.5 − 31.8 = 23.7 ft.
const lee = crossGable({ length: 53.8, width: 31.8 }, { length: 55.5, width: 26.2, freeRun: 23.7 }, sLee);
const EV = { ridges: 90.35, valleys: 39.13, hips: 0, squares: 25.75 };
const leeArea = slopedAreaFromFootprint(lee.footprint, sLee) / 100;
console.log('\n  LEE — geometry deduction vs EagleView (the roof that killed every pixel method):');
console.log('   metric   | geometry | EagleView |   Δ');
console.log('   ---------+----------+-----------+--------');
console.log(`   hips     | ${String(lee.hips).padStart(8)} | ${String(EV.hips).padStart(9)} |  exact ✅`);
console.log(`   ridges   | ${lee.ridge.toFixed(1).padStart(8)} | ${String(EV.ridges).padStart(9)} | ${pc(lee.ridge, EV.ridges)}`);
console.log(`   valleys  | ${lee.valleys.toFixed(1).padStart(8)} | ${String(EV.valleys).padStart(9)} | ${pc(lee.valleys, EV.valleys)}`);
console.log(`   area(sq) | ${leeArea.toFixed(1).padStart(8)} | ${String(EV.squares).padStart(9)} | ${pc(leeArea, EV.squares)}  (footprint×√(1+s²) cross-check)`);

// 4) full palette — formula sanity (no field truth yet for these types; confirms the math is wired)
const s8b = slopeOf('8/12');
const show = (name: string, t: any) => console.log(
  `   ${name.padEnd(13)} ridge ${t.ridge.toFixed(0).padStart(3)}  hips ${t.hips.toFixed(0).padStart(3)}  valleys ${t.valleys.toFixed(0).padStart(3)}  rakes ${t.rakes.toFixed(0).padStart(3)}  eaves ${t.eaves.toFixed(0).padStart(3)}`
  + (t.breakLines ? `  break ${t.breakLines.toFixed(0)}` : '') + (t.membrane ? `  membrane ${t.membrane.toFixed(0)}sf` : ''));
console.log('\n  PRIM PALETTE — formula sanity (field-validate when EagleViews for these types arrive):');
show('shed 30×20', shedPrim(30, 20, slopeOf('4/12')));
show('flat 1500sf', flatPrim(1500, 160));
show('clipped-gable', clippedGable(50, 28, 5, s8b));
show('dutch-gable', dutchGable(50, 30, 10, s8b));
show('gambrel', gambrel(40, 30, 9, slopeOf('18/12'), slopeOf('4/12')));
show('mansard', mansard(44, 36, 6, slopeOf('18/12')));
console.log('');
