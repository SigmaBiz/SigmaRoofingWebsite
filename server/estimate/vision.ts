/**
 * vision.ts — the VISION PASS: a Claude vision call reads the roof blueprint and emits a
 * RoofStructure (the prim decomposition) for the geometry engine to deduce the linear takeoff.
 *
 * This is the production automation of what I (Claude) did by hand for Lee. Needs ANTHROPIC_API_KEY.
 * Model defaults to claude-opus-4-8; set ANTHROPIC_MODEL=claude-haiku-4-5 (or sonnet) to cut cost.
 *
 * Pipeline:  roof-blueprint.ts (render) -> vision.ts (this: structure) -> assemble.ts -> takeoff
 */
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import type { RoofStructure } from './roof-schema';

const PROMPT = (pitch: string, pxPerFt: number, facetHint: string) => `You are reading an overhead roof "blueprint" to decompose it into geometric prims for a roofing takeoff.

THE IMAGE: each roof facet is a flat color (hue = the compass direction it faces); black lines are the
seams between facets and the roof outline; a faint grid overlays it where **1 cell = 10 ft** (bold lines
every 50 ft). Scale: ${pxPerFt.toFixed(2)} pixels per foot. The predominant pitch is **${pitch}** (rise/12).
${facetHint ? `\nGROUND-TRUTH FACETS (from Google, reliable — use this to gauge complexity & how many prims/wings to use): ${facetHint}\n` : ''}

DECOMPOSE the roof into prims from this palette (read each prim's dimensions in FEET against the grid):
- gable {L,W}: 2 opposite-facing facets meeting at a ridge that RUNS TO the end edges (rakes at the ends).
- hip {L,W}: 4 facets/4 directions; ridge does NOT reach the edges (hips wrap to corners); whole perimeter is eave.
- hipWing {L,W}: a hip WING abutting a larger hip on its inner short end — keeps its 2 OUTER hips; its inner end
    dies into the main roof as 2 VALLEYS (it already includes them). L = wing length, W = wing width.
- crossGable {wide:{length,width}, narrow:{length,width,freeRun}}: two perpendicular GABLE wings forming an L/T.
    The WIDER wing's ridge runs full; the narrower's ridge truncates where it meets the wider wing's slope.
    freeRun = the narrow wing's run from its free gable end to the wide wing's near eave.
- shed {B,D}: ONE facet, one color, no interior seam. B = eave width, D = slope depth.
- flat {footprint,perimeter}: a gray (near-flat, no strong hue) region; near-horizontal. footprint in sqft.
- clippedGable {L,W,c}: reads gable but the ridge ends are nipped by a small hip (c = clip setback, ft).
- dutchGable {L,W,g}: reads hip but a small gable "gablet" (width g) sits at the ridge end.
- gambrel {L,W,b,pitchLower,pitchUpper}: same-color facet PAIRS (a steep lower + gentle upper per side), with a
    horizontal slope-break line. b = the steep lower run (ft). pitches like "18/12","4/12".
- mansard {L,W,b,pitchLower}: 4-sided steep lower band (width b) + a near-flat (gray) membrane top.

COMBINATION (most complex HIP roofs): a main \`hip\` rectangle + one or more \`hipWing\`s meeting its sides.
Decompose into the main hip + ONE hipWing per wing (each hipWing already carries its 2 valleys). Do NOT collapse a
complex multi-wing hip into a single hip+gable — if Google reports many facets (e.g. 10+), use several prims/wings.
IMPORTANT — do NOT double-count valleys: each \`hipWing\` and \`crossGable\` ALREADY includes its own valleys, so do NOT
also add a \`junctions\` entry for that same wing. Use \`junctions: [{ narrowWidth }]\` ONLY for a valley no prim already
models (rare — e.g. a gable dormer cutting into a main slope; narrowWidth = that dormer/wing width).

OUTPUT — respond with ONLY a JSON object (no prose, no markdown fences), shape:
{ "pitch": "${pitch}", "prims": [ ...PrimSpec objects with a "type" field... ], "junctions": [...]?,
  "confidence": "high"|"medium"|"low", "notes": "short read of how you decomposed it" }
Most OKC houses are one gable/hip or a crossGable. Use the simplest decomposition that fits. If the roof
is too complex/ambiguous to decompose cleanly, set confidence "low" and your best single-prim approximation.`;

export async function readRoofStructure(blueprintPath: string, pitch: string, pxPerFt: number, facetHint = ''): Promise<RoofStructure> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set (vision pass needs it)');
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  const data = fs.readFileSync(blueprintPath).toString('base64');

  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-8',
    max_tokens: 8000,
    thinking: { type: 'adaptive' }, // roof decomposition is reasoning-heavy
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data } },
        { type: 'text', text: PROMPT(pitch, pxPerFt) },
      ],
    }],
  });

  const text = res.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '';
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  if (!json) throw new Error(`vision returned no JSON: ${text.slice(0, 200)}`);
  return JSON.parse(json) as RoofStructure;
}
