/**
 * assemble.ts — run a RoofStructure (from the vision pass) through the geometry engine → full takeoff.
 * Pure, deterministic, testable without any API. The "+ area cross-check" is the self-consistency guard.
 */
import type { RoofStructure, PrimSpec } from './roof-schema';
import * as G from './geometry';

function primTakeoff(p: PrimSpec, s: number): G.Takeoff {
  switch (p.type) {
    case 'gable': return G.gablePrim(p.L, p.W, s);
    case 'hip': return G.hipPrim(p.L, p.W, s);
    case 'hipWing': return G.hipWing(p.L, p.W, s);
    case 'crossGable': return G.crossGable(p.wide, p.narrow, s);
    case 'shed': return G.shedPrim(p.B, p.D, s);
    case 'flat': return G.flatPrim(p.footprint, p.perimeter);
    case 'clippedGable': return G.clippedGable(p.L, p.W, p.c, s);
    case 'dutchGable': return G.dutchGable(p.L, p.W, p.g, s, p.nGablets ?? 1);
    case 'gambrel': return G.gambrel(p.L, p.W, p.b, G.slopeOf(p.pitchLower), G.slopeOf(p.pitchUpper));
    case 'mansard': return G.mansard(p.L, p.W, p.b, G.slopeOf(p.pitchLower));
  }
}

export interface AssembledTakeoff extends G.Takeoff {
  pitch: string;
  squares_from_geometry: number; // footprint × √(1+s²) ÷ 100 — the area cross-check vs Solar's squares
}

export function assemble(rs: RoofStructure): AssembledTakeoff {
  const s = G.slopeOf(rs.pitch);
  const parts = rs.prims.map((p) => primTakeoff(p, s));
  const junctions = (rs.junctions ?? []).map((j): G.Takeoff => ({
    ridge: 0, hips: 0, rakes: 0, eaves: 0, footprint: 0,
    valleys: 2 * (j.narrowWidth / 2) * Math.SQRT2 * G.mult('valley', s),
  }));
  const t = G.add(...parts, ...junctions);
  return { ...t, pitch: rs.pitch, squares_from_geometry: Math.round(G.slopedAreaFromFootprint(t.footprint, s) / 100 * 10) / 10 };
}
