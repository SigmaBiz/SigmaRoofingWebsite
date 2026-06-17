/**
 * geometry.ts — the EXACT geometric core of the vision+geometry takeoff (deduce, don't measure).
 *
 * Vision supplies the discrete STRUCTURE (prims + which ends are hip/gable + how they connect);
 * these functions supply every LENGTH exactly from the footprint dims + pitch. Validated against
 * EagleView (see geometry-check.ts) — Lee deduces to ~1%, where pixel methods missed +100–480%.
 *
 * Conventions: a prim is a tent over an L×W rectangle (L≥W), ridge along the length. pitch as rise/12.
 */

export const slopeOf = (pitch: string): number => (parseInt(pitch, 10) || 6) / 12; // tan(pitch)

/** exact plan→true length multiplier by line type (s = rise/run) */
export function mult(type: 'ridge' | 'eave' | 'rake' | 'hip' | 'valley', s: number): number {
  if (type === 'rake') return Math.sqrt(1 + s * s);          // climbs the gable at the facet slope
  if (type === 'hip' || type === 'valley') return Math.sqrt(1 + s * s / 2); // 45° in plan
  return 1;                                                   // ridge & eave are horizontal
}

export interface Takeoff {
  ridge: number; hips: number; valleys: number; rakes: number; eaves: number; footprint: number;
  breakLines?: number; // gambrel/mansard steep↔gentle transition — NOT capped (per Antonio), reported only
  membrane?: number;   // flat / mansard-top low-slope area (sqft) — priced separately from shingle squares
}
const ZERO: Takeoff = { ridge: 0, hips: 0, valleys: 0, rakes: 0, eaves: 0, footprint: 0, breakLines: 0, membrane: 0 };

/** A single fully-hipped rectangle (all four sides eaves; pyramid hip ends). */
export function hipPrim(L: number, W: number, s: number): Takeoff {
  return {
    ridge: L - W,                                  // ridge shortened W/2 by each hip end
    hips: 4 * (W / 2) * Math.SQRT2 * mult('hip', s), // 4 hips, each plan (W/2)√2
    valleys: 0,
    rakes: 0,
    eaves: 2 * (L + W),                            // full perimeter
    footprint: L * W,
  };
}

/** A single gabled rectangle (long sides eaves; gable ends with rakes). */
export function gablePrim(L: number, W: number, s: number): Takeoff {
  return {
    ridge: L,                                      // ridge runs the full length
    hips: 0,
    valleys: 0,
    rakes: 4 * (W / 2) * mult('rake', s),          // 2 rakes per gable end × 2 ends
    eaves: 2 * L,                                  // the two long sides
    footprint: L * W,
  };
}

/** Two equal-pitch perpendicular GABLE wings forming an L/T (a cross-gable).
 *  The WIDER wing's ridge runs full; the NARROWER truncates where it meets the wider wing's slope.
 *  Two valleys form at the reentrant corner (45° in plan). `narrowFreeRun` = the narrower wing's
 *  ridge run from its free gable end to the wider wing's near eave (i.e. how far the narrow wing
 *  reaches before it hits the wide wing). */
export function crossGable(
  wide: { length: number; width: number },
  narrow: { length: number; width: number; freeRun: number },
  s: number,
): Takeoff {
  const wideRidge = wide.length;
  // narrow ridge: from its free end, across its free run, then penetrates the wide wing by Wn/2
  // (where the wide wing's slope reaches the narrow wing's ridge height = (Wn/2)·s).
  const narrowRidge = narrow.freeRun + narrow.width / 2;
  const valleys = 2 * (narrow.width / 2) * Math.SQRT2 * mult('valley', s);
  return {
    ridge: wideRidge + narrowRidge,
    hips: 0,
    valleys,
    rakes: 0, // (rake/eave split folded into perimeter elsewhere; cap/valley are what cost needs)
    eaves: 0,
    footprint: wide.length * wide.width + narrow.freeRun * narrow.width,
  };
}

// ---------------- TIER 3 + modifiers (full palette — see .context/PRIM-PALETTE.md) ----------------

/** SHED / skillion — a single slope. B = eave width, D = slope run (depth). Free edges assumed. */
export function shedPrim(B: number, D: number, s: number): Takeoff {
  return { ...ZERO, rakes: 2 * D * mult('rake', s), eaves: 2 * B, footprint: B * D };
}

/** FLAT / low-slope — membrane (priced per sqft), edge metal on the perimeter, no shingle lines. */
export function flatPrim(footprintSqft: number, perimeterFt: number): Takeoff {
  return { ...ZERO, eaves: perimeterFt, footprint: footprintSqft, membrane: footprintSqft };
}

/** CLIPPED GABLE (jerkinhead) — gable with each ridge end nipped by a small 45° hip of setback c.
 *  Approx: 4 short clip-hips; ridge −2c; rakes ≈ full gable (the clip only nips the top). c from vision. */
export function clippedGable(L: number, W: number, c: number, s: number): Takeoff {
  return { ...ZERO, ridge: L - 2 * c, hips: 4 * c * Math.SQRT2 * mult('hip', s),
    rakes: 4 * (W / 2) * mult('rake', s), eaves: 2 * L, footprint: L * W };
}

/** DUTCH GABLE — a hip with a small gablet (width g) at nGablets ridge end(s). g from vision. */
export function dutchGable(L: number, W: number, g: number, s: number, nGablets = 1): Takeoff {
  const base = hipPrim(L, W, s);
  return { ...base, ridge: base.ridge + nGablets * g, rakes: nGablets * 2 * (g / 2) * mult('rake', s) };
}

/** GAMBREL (barn) — gable, two pitches per side: steep lower (run b, slope sL) + gentle upper (sU).
 *  Break line reported but NOT capped. Gable ends. (Areas come from Solar's per-facet stats.) */
export function gambrel(L: number, W: number, b: number, sL: number, sU: number): Takeoff {
  const rakeProfile = b * Math.sqrt(1 + sL * sL) + (W / 2 - b) * Math.sqrt(1 + sU * sU);
  return { ...ZERO, ridge: L, rakes: 4 * rakeProfile, eaves: 2 * L, breakLines: 2 * L, footprint: L * W };
}

/** MANSARD — 4-sided gambrel: steep lower band (width b, slope sL) wrapping the perimeter +
 *  a near-flat MEMBRANE top. Break line not capped; top priced as membrane. */
export function mansard(L: number, W: number, b: number, sL: number): Takeoff {
  const topL = Math.max(0, L - 2 * b), topW = Math.max(0, W - 2 * b);
  return { ...ZERO, hips: 4 * b * Math.SQRT2 * mult('hip', sL), eaves: 2 * (L + W),
    breakLines: 2 * (topL + topW), footprint: L * W, membrane: topL * topW };
}

/** HIP WING — a hip rectangle abutting a larger prim on one short end (the COMBINATION case).
 *  Free (outer) short end = 2 hips; the abutting end dies into the main roof as 2 VALLEYS.
 *  Ridge shortened W/2 by the single free hip. Use one hipWing per wing on a main `hip`. */
export function hipWing(L: number, W: number, s: number): Takeoff {
  return { ...ZERO,
    ridge: L - W / 2,
    hips: 2 * (W / 2) * Math.SQRT2 * mult('hip', s),
    valleys: 2 * (W / 2) * Math.SQRT2 * mult('valley', s),
    eaves: 2 * L + W, footprint: L * W };
}

export function add(...ts: Takeoff[]): Takeoff {
  return ts.reduce((a, t) => ({
    ridge: a.ridge + t.ridge, hips: a.hips + t.hips, valleys: a.valleys + t.valleys,
    rakes: a.rakes + t.rakes, eaves: a.eaves + t.eaves, footprint: a.footprint + t.footprint,
    breakLines: (a.breakLines ?? 0) + (t.breakLines ?? 0), membrane: (a.membrane ?? 0) + (t.membrane ?? 0),
  }), ZERO);
}

/** sloped roof area from footprint + pitch (the hard cross-check: Σ true area = footprint/cos θ). */
export const slopedAreaFromFootprint = (footprintSqft: number, s: number) => footprintSqft * Math.sqrt(1 + s * s);
