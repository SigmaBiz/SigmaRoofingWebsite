/**
 * roof-schema.ts — the contract between the VISION pass and the GEOMETRY engine.
 *
 * The vision pass (a Claude vision call reading the blueprint) emits a RoofStructure: the prim
 * decomposition with dimensions read against the blueprint's grid. The assembler (assemble.ts)
 * runs each spec through geometry.ts to deduce the linear takeoff. One stable interface; either
 * side can change independently. See .context/PRIM-PALETTE.md for the prim definitions.
 */

export type PrimSpec =
  | { type: 'gable'; L: number; W: number }
  | { type: 'hip'; L: number; W: number }
  | { type: 'hipWing'; L: number; W: number }  // a hip wing abutting a main hip (gives 2 hips + 2 valleys)
  | { type: 'crossGable'; wide: { length: number; width: number }; narrow: { length: number; width: number; freeRun: number } }
  | { type: 'shed'; B: number; D: number }
  | { type: 'flat'; footprint: number; perimeter: number }
  | { type: 'clippedGable'; L: number; W: number; c: number }
  | { type: 'dutchGable'; L: number; W: number; g: number; nGablets?: number }
  | { type: 'gambrel'; L: number; W: number; b: number; pitchLower: string; pitchUpper: string }
  | { type: 'mansard'; L: number; W: number; b: number; pitchLower: string };

export interface RoofStructure {
  address?: string;
  pitch: string;                          // predominant pitch, e.g. "8/12"
  prims: PrimSpec[];
  junctions?: { narrowWidth: number }[];  // extra valley junctions (multi-wing hips beyond a single crossGable)
  confidence?: 'high' | 'medium' | 'low'; // vision's own read of how cleanly it decomposed
  notes?: string;
}
