/**
 * roof-recon2.ts — R1 done properly: ADJACENCY GRAPH from the facet constellation (no mask, no vision).
 *
 * Build neighbors from touching bounding boxes, then classify each shared edge by the slope geometry:
 *   • both facets slope AWAY from the edge  → HIGH line → RIDGE (azimuths ~180° apart) / HIP (~90° apart)
 *   • both facets slope TOWARD the edge      → LOW line  → VALLEY (~90° apart)
 * "toward/away" = sign of (downslope · vector-to-neighbor). This is the clean discriminator the
 * area+bbox edge-model couldn't get (it conflated hip & valley and over-counted simple roofs).
 *
 * Lengths:  ridge = facets' overlap along the ridge axis;  hip/valley = min(depth)·√2 (45° in plan).
 * Each adjacency is one unique edge → no ½ de-dup.
 *
 * Run:  npx tsx server/scripts/roof-recon2.ts
 */
import 'dotenv/config';
import { geocode, buildingInsights, degToRad, m2ToSqft } from '../estimate/measure';

const ROOFS = [
  { slug: '3605 ', address: '3605 SE 57th Cir, Oklahoma City, OK 73135', pitch: 6, hip: 31, val: 0, ridge: 59.68 },
  { slug: 'Lee  ', address: '6320 N Warren Avenue, Warr Acres, OK', pitch: 6, hip: 0, val: 39.13, ridge: 90.35 },
  { slug: 'Hinkle', address: '4024 N Nicklas Avenue, Oklahoma City, OK', pitch: 6, hip: 148.47, val: 47.9, ridge: 65.18 },
  { slug: 'Crest', address: '19428 Crestridge Dr, Edmond, OK 73012', pitch: 8, hip: 191, val: 87, ridge: 58 },
];
const hvMult = (p12: number) => { const s = p12 / 12; return Math.sqrt(1 + (s * s) / 2); };
const M_PER_DEG_LAT = 111_132;
const pct = (g: number, e: number) => e > 0 ? `${g - e >= 0 ? '+' : ''}${(((g - e) / e) * 100).toFixed(0)}%` : (g < 5 ? '✓~0' : `+${g.toFixed(0)}`);

type F = { az: number; card: number; uE: number; uN: number; cE: number; cN: number; x0: number; x1: number; y0: number; y1: number; d: number };

async function main() {
  const key = process.env.GOOGLE_API_KEY!;
  console.log('\n  R1 ADJACENCY GRAPH — ridge/hip/valley from facet neighbors + slope geometry:\n');
  for (const r of ROOFS) {
    try {
      const { location } = await geocode(r.address, key);
      const data = await buildingInsights(location, key);
      const segs: any[] = data.solarPotential?.roofSegmentStats || [];
      const cLat = data.center?.latitude ?? location.lat;
      const mLng = 111_320 * Math.cos(degToRad(cLat)); const FT = 3.28084;
      const F: F[] = segs.map((f) => {
        const az = ((f.azimuthDegrees ?? 0) % 360 + 360) % 360;
        const bb = f.boundingBox || {};
        const x0 = bb.sw ? (bb.sw.longitude - (data.center?.longitude ?? location.lng)) * mLng * FT : 0;
        const x1 = bb.ne ? (bb.ne.longitude - (data.center?.longitude ?? location.lng)) * mLng * FT : 0;
        const y0 = bb.sw ? (bb.sw.latitude - cLat) * M_PER_DEG_LAT * FT : 0;
        const y1 = bb.ne ? (bb.ne.latitude - cLat) * M_PER_DEG_LAT * FT : 0;
        const card = Math.round(az / 90) % 4;
        const nsFacing = card === 0 || card === 2;
        const d = nsFacing ? Math.abs(y1 - y0) : Math.abs(x1 - x0); // depth eave→ridge
        return { az, card, uE: Math.sin(degToRad(az)), uN: Math.cos(degToRad(az)), cE: (x0 + x1) / 2, cN: (y0 + y1) / 2, x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1), d };
      });
      // estimate roof rotation θ from azimuth clusters (offset of azimuths from cardinals, folded to ±45)
      const offs = F.map((f) => { let o = ((f.az % 90) + 90) % 90; if (o > 45) o -= 90; return o; });
      const theta = offs.reduce((s, o) => s + o, 0) / (offs.length || 1);
      const tr = degToRad(Math.abs(theta));
      const derot = 1 / (Math.cos(tr) + Math.sin(tr)); // un-inflate axis-aligned bbox of a roof rotated θ (≈1 when θ≈0)
      const TOL = 6; // ft gap to count as adjacent
      let ridge = 0, hip = 0, valley = 0; const m = hvMult(r.pitch);
      for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) {
        const a = F[i], b = F[j];
        const gapx = Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1);
        const gapy = Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1);
        if (gapx > TOL || gapy > TOL) continue; // not adjacent
        let azd = Math.abs(a.az - b.az); if (azd > 180) azd = 360 - azd;
        // toward/away: does each facet slope toward the other (downslope · vector-to-neighbor)?
        const tE = b.cE - a.cE, tN = b.cN - a.cN, tl = Math.hypot(tE, tN) || 1;
        const dotA = (a.uE * tE + a.uN * tN) / tl;        // >0 A slopes toward B
        const dotB = (b.uE * -tE + b.uN * -tN) / tl;       // >0 B slopes toward A
        if (azd >= 135) {                                   // opposite → RIDGE (high line)
          const ov = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0); // E-W overlap (ridge axis for N/S facets)
          const ovY = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
          ridge += Math.max(ov, ovY, 0);
        } else if (azd >= 45) {                             // perpendicular → HIP / VALLEY (need agreement)
          const plan = Math.min(a.d, b.d) * derot * Math.SQRT2; // de-rotate depth before the 45° hip rule
          if (dotA > 0.2 && dotB > 0.2) valley += plan * m;       // both slope TOWARD → low line
          else if (dotA < -0.2 && dotB < -0.2) hip += plan * m;   // both slope AWAY → high line
          // mixed/ambiguous → false adjacency (bboxes merely overlap, no shared hip/valley) → skip
        }
      }
      console.log(`  ${r.slug.padEnd(7)} hips ${hip.toFixed(0)} (${pct(hip, r.hip)}) EV${r.hip}  |  valleys ${valley.toFixed(0)} (${pct(valley, r.val)}) EV${r.val}  |  ridges ${ridge.toFixed(0)} (${pct(ridge, r.ridge)}) EV${r.ridge}`);
    } catch (e: any) { console.log(`  ${r.slug}: ✗ ${e?.message || e}`); }
  }
  console.log('');
}
main();
