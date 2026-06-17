/**
 * pricing.ts — FREE-TIER roof-replacement $ estimate, faithful to the CloudBid V14 estimator logic.
 *
 * TOTAL ASSEMBLY (CloudBid "Estimate" sheet rows 56–76), exactly:
 *   Material Net = COG_raw × (1 + materialMarkup + salesTax)      // tax + markup are ADDITIVE on raw material
 *   Labor Net    = COS_raw × (1 + laborMarkup    + workersComp)
 *   Total (O&P)  = (Material Net + Labor Net) × (1 + overhead)
 * Each line qty = CEILING(qty_raw × (1 + wasteFactor), whole units)  // waste THEN round up to whole bundles/rolls.
 *
 * FREE-TIER inputs we have: squares, facet count, pitch, perimeter (Solar/Overture). The only thing without a
 * linear takeoff — hip/ridge (cap) + valley (ice) — is predicted from FACET COUNT:
 *   interior_LF (hip+ridge+valley, counted once) ≈ 23.16·facets + 1.185·√footprint ; ~25% is valley.
 * Ridge vent is sized from footprint via IRC R806.2 1/300 (balanced). Validated within ±2.5% of full-EagleView cost.
 *
 * BASE-ROOF assumptions (OKLAHOMA, where Sigma operates): single story · pitch 3/12–7/12 (no steep charge) ·
 * single-layer OC Duration architectural + single-layer felt · high-profile cap · full tear-off (no re-deck) ·
 * balanced ridge+soffit ventilation · 3 pipe jacks + 1 gas-vent flashing · no chimney/skylight/wall flashing · no
 * gutter R&R. ⚠ Roof + ventilation parameters are based on Oklahoma building code (IRC R806.2). Ballpark, not a quote.
 *
 * Unit prices = CloudBid OC-standard catalog; Antonio tunes CONFIG (dollars, not logic).
 */
import type { Measurement } from './measure';

export const CONFIG = {
  // material unit costs ($) + coverage + waste factor (wf)
  shingle:    { price: 44.58, bundlesPerSq: 3,   wf: 0.08 },     // BN
  underlayment:{ price: 65.0,  sqPerRoll: 10,     wf: 0.20 },     // RL
  starter:    { price: 57.5,  lfPerBundle: 120,  wf: 0.20 },     // BN
  capHigh:    { price: 82.25, lfPerBundle: 20,   wf: 0.20 },     // BN (high profile; STANDARD = 33.3)
  drip:       { price: 7.8,   lfPerStick: 10,    wf: 0.20 },     // EA (10 ft sticks)
  ice:        { price: 114.24, sfPerRoll: 200, valleyWidthFt: 3, sfPerPenetration: 4, wf: 0.20 }, // RL
  ridgeVent:  { matPerLf: 12.97, labPerLf: 2 },                  // LF
  pipeJack: 8.29, pipeJackCount: 3, gasVentFlash: 23.81,
  miscPerSq: 10,                                                 // nails + sealant + spray (≈$/sq)
  laborPerSq: 75,                                                // shingle install; starter/cap labor = (bundles/3) sq-equiv, wf 0.10
  laborWfStarterCap: 0.10,
  // ventilation (IRC R806.2 balanced ridge+soffit): ridge-vent LF = footprint·144·exhaust / ratio / nfaPerLf ≈ footprint/75
  nfaRatio: 300, ridgeVentNfaPerLf: 18, exhaustShare: 0.5,
  // facet → interior linear regression (fit on Crest/Lee/Hinkle vs EagleView)
  interiorPerFacet: 23.16, interiorPerSqrtFoot: 1.185, valleyFraction: 0.25, perimeterPerSqrtFoot: 5.0,
  // ---- markups / tax / overhead (Antonio + Oklahoma) ----
  materialMarkup: 0.30, laborMarkup: 0.30, workersComp: 0.0, salesTax: 0.08625, overhead: 0.10,
  // display
  rangeBandPct: 0.10, roundTo: 250,
};

export const BASE_ASSUMPTIONS =
  'Single story · 3/12–7/12 pitch · OC Duration architectural shingle · full tear-off (no re-deck) · single-layer felt · ' +
  'high-profile ridge cap · balanced ridge+soffit ventilation · 3 pipe jacks + 1 gas-vent flashing · no chimney/skylight/' +
  'wall flashing · no gutter work. Roof + ventilation parameters per Oklahoma building code (IRC R806.2); 8.625% OK sales tax.';

const ceil = (n: number) => Math.ceil(n - 1e-9);
/** one material line: CEILING(qty_raw × (1+wf)) × unit price */
const lineCost = (qtyRaw: number, wf: number, price: number) => (qtyRaw <= 0 ? 0 : ceil(qtyRaw * (1 + wf)) * price);

export type RoofGeom = { squares: number; perimeterFt: number; hipRidgeLf: number; valleyLf: number; penetrations: number };

/** Faithful CloudBid cost for an EXPLICIT roof geometry (used by the free-tier wrapper + for validation). */
export function roofCost(g: RoofGeom) {
  const C = CONFIG, S = g.squares, P = g.perimeterFt, HR = g.hipRidgeLf, V = g.valleyLf;
  const footprintSf = S * 100;                          // ~roof area; NFA uses footprint, but on a 1-story they're close
  const ridgeVentLf = ((footprintSf / C.nfaRatio) * 144 * C.exhaustShare) / C.ridgeVentNfaPerLf;

  // ---- COG raw (materials) ----
  const material =
    lineCost(S * C.shingle.bundlesPerSq, C.shingle.wf, C.shingle.price) +
    lineCost(S / C.underlayment.sqPerRoll, C.underlayment.wf, C.underlayment.price) +
    lineCost(P / C.starter.lfPerBundle, C.starter.wf, C.starter.price) +
    lineCost(HR / C.capHigh.lfPerBundle, C.capHigh.wf, C.capHigh.price) +
    lineCost(P / C.drip.lfPerStick, C.drip.wf, C.drip.price) +
    lineCost((V * C.ice.valleyWidthFt + g.penetrations * C.ice.sfPerPenetration) / C.ice.sfPerRoll, C.ice.wf, C.ice.price) +
    ridgeVentLf * C.ridgeVent.matPerLf + C.pipeJackCount * C.pipeJack + C.gasVentFlash + S * C.miscPerSq;

  // ---- COS raw (labor): shingle install + starter/cap as square-equivalents (bundles ÷ 3) ----
  const labor =
    ceil(S * (1 + C.shingle.wf)) * C.laborPerSq +
    lineCost((P / C.starter.lfPerBundle) / 3, C.laborWfStarterCap, C.laborPerSq) +
    lineCost((HR / C.capHigh.lfPerBundle) / 3, C.laborWfStarterCap, C.laborPerSq) +
    ridgeVentLf * C.ridgeVent.labPerLf;

  const materialNet = material * (1 + C.materialMarkup + C.salesTax);
  const laborNet = labor * (1 + C.laborMarkup + C.workersComp);
  const total = (materialNet + laborNet) * (1 + C.overhead);
  return { material, labor, materialNet, laborNet, total, ridgeVentLf };
}

export type PriceEstimate = {
  low: number; high: number; point: number; currency: 'USD';
  assumptions: { base: string; material: string; facets: number; est_hip_ridge_lf: number; est_valley_lf: number;
    est_ridge_vent_lf: number; perimeter_ft: number; markups: { material_pct: number; labor_pct: number; sales_tax_pct: number; overhead_pct: number }; note: string };
  breakdown: { material_net: number; labor_net: number };
};

/** FREE TIER: address Measurement → ballpark. Pass measured perimeter if available; else estimated from footprint. */
export function priceEstimate(m: Measurement, perimeterFt?: number): PriceEstimate {
  const C = CONFIG, S = m.totals.squares, facets = Math.max(1, m.totals.facet_count);
  const pitchDeg = m.totals.pitch_degrees || 22;
  const footprint = S * 100 * Math.cos((pitchDeg * Math.PI) / 180);
  const P = perimeterFt ?? C.perimeterPerSqrtFoot * Math.sqrt(footprint);
  const interior = C.interiorPerFacet * facets + C.interiorPerSqrtFoot * Math.sqrt(footprint);
  const V = interior * C.valleyFraction, HR = interior * (1 - C.valleyFraction);

  const c = roofCost({ squares: S, perimeterFt: P, hipRidgeLf: HR, valleyLf: V, penetrations: C.pipeJackCount + 1 });
  const round = (n: number) => Math.round(n / C.roundTo) * C.roundTo;
  return {
    low: round(c.total * (1 - C.rangeBandPct)), high: round(c.total * (1 + C.rangeBandPct)), point: round(c.total), currency: 'USD',
    assumptions: { base: BASE_ASSUMPTIONS, material: 'OC Duration architectural — full tear-off', facets,
      est_hip_ridge_lf: Math.round(HR), est_valley_lf: Math.round(V), est_ridge_vent_lf: Math.round(c.ridgeVentLf), perimeter_ft: Math.round(P),
      markups: { material_pct: C.materialMarkup * 100, labor_pct: C.laborMarkup * 100, sales_tax_pct: C.salesTax * 100, overhead_pct: C.overhead * 100 },
      note: 'Ballpark only (Oklahoma base-roof assumptions) — not a quote. Book a free inspection for an exact number.' },
    breakdown: { material_net: Math.round(c.materialNet), labor_net: Math.round(c.laborNet) },
  };
}
