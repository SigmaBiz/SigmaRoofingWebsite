/**
 * estimate-check.ts — exercises the production core (measure.ts + pricing.ts) the same way
 * the /api/estimate route does, without needing the server up. Cross-checks against solar-blitz
 * (the independent oracle): on Crestridge both must read ~44.6 sq / 8-12 / 12 facets.
 *
 * Run:  npx tsx server/scripts/estimate-check.ts ["address"]
 */
import 'dotenv/config';
import { computeMeasurement } from '../estimate/measure';
import { priceEstimate } from '../estimate/pricing';

async function main() {
  const address = process.argv[2] || '19428 Crestridge Dr, Edmond, OK';
  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    console.error('GOOGLE_API_KEY missing');
    process.exit(1);
  }
  const measurement = await computeMeasurement(address, key);
  const pricing = priceEstimate(measurement);
  console.log(JSON.stringify({ ...measurement, pricing }, null, 2));
}

main().catch((e) => {
  console.error(`[${e?.code || 'ERROR'}] ${e?.message || e}`);
  process.exit(1);
});
