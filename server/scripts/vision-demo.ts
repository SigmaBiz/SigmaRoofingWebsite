/**
 * vision-demo.ts — end-to-end pipeline test WITHOUT the API key: a hand-authored RoofStructure
 * (exactly what the vision pass would emit for Lee) → assemble → linear takeoff → vs EagleView.
 * Validates the schema + assembler + geometry contract. Run: npx tsx server/scripts/vision-demo.ts
 */
import { assemble } from '../estimate/assemble';
import type { RoofStructure } from '../estimate/roof-schema';

// what the Claude vision pass should return for Lee's blueprint (an L-shaped cross-gable):
const lee: RoofStructure = {
  address: '6320 N Warren Avenue, Warr Acres, OK',
  pitch: '5/12',
  prims: [{ type: 'crossGable', wide: { length: 53.8, width: 31.8 }, narrow: { length: 55.5, width: 26.2, freeRun: 23.7 } }],
  confidence: 'high',
};
const EV = { ridges: 90.35, hips: 0, valleys: 39.13, squares: 25.75 };

const t = assemble(lee);
const pc = (a: number, b: number) => (b ? `${a - b >= 0 ? '+' : ''}${(((a - b) / b) * 100).toFixed(1)}%` : 'exact');

console.log('\n  VISION→GEOMETRY pipeline (Lee, structure as the vision pass would emit it):\n');
console.log('   metric   | pipeline | EagleView |   Δ');
console.log('   ---------+----------+-----------+--------');
console.log(`   hips     | ${t.hips.toFixed(1).padStart(8)} | ${String(EV.hips).padStart(9)} |  ${EV.hips === 0 && t.hips === 0 ? 'exact ✅' : pc(t.hips, EV.hips)}`);
console.log(`   ridges   | ${t.ridge.toFixed(1).padStart(8)} | ${String(EV.ridges).padStart(9)} | ${pc(t.ridge, EV.ridges)}`);
console.log(`   valleys  | ${t.valleys.toFixed(1).padStart(8)} | ${String(EV.valleys).padStart(9)} | ${pc(t.valleys, EV.valleys)}`);
console.log(`   area(sq) | ${t.squares_from_geometry.toFixed(1).padStart(8)} | ${String(EV.squares).padStart(9)} | ${pc(t.squares_from_geometry, EV.squares)}  (geometry cross-check)`);
console.log(`\n   full takeoff: ${JSON.stringify({ ridge: +t.ridge.toFixed(1), hips: +t.hips.toFixed(1), valleys: +t.valleys.toFixed(1), rakes: +t.rakes.toFixed(1), eaves: +t.eaves.toFixed(1), membrane: t.membrane || 0 })}\n`);
