# tr3 Roof — Working Memory (PRE-FLIGHT)

**Read this before acting on ANY roof-generation prompt.** It points at the rules and forces a
ζ-alignment check so I stop spiraling.

## Current state (2026-06-05)
- Engine: `client/src/lib/tr3/solver2.ts` — **MAX-OF-TENTS** (union of FULL prim tents; roof = MAX /
  upper envelope; the host is never tampered; the ext is deleted where the host is taller).
- Live on `/skins` (localhost:3000, `design-reskin`). Current build: `buildDimHipGableExt` — a
  **diminished central hip + coplanar gable ext** (facet K shared, facet A melts into facet I).
  Geometry approved by Antonio; now cleaning micro-details.
- Rules: `.context/ROOF-GEOMETRY-RULES.md` (ζ-organized — Z₂ invariants vs Z₁ edge cases). READ IT.
- Done: Z₂ core + ewidth + caps + melt + **walls-eat-roofs (step-walls)** + **diminish-by-fraction** + coplanar.
- Next, IN ORDER: sharpen the **soft creases** → #13 parallel-spawn/overhang → #14 dormer → #15 wing.

## Pre-flight — run every time before touching roof geometry
1. **Re-read the Z₂ invariants.** Must not violate any: max-of-tents; level/90° eaves; main = highest
   ridge + most exts (full); ext ≤ main; no open ends; **walls eat roofs** (never bridge a height gap —
   drop a vertical step-wall; the wall stays a wall).
2. **ζ-classify the task.** Z₂ (core/invariant) or Z₁ (fragile edge case)?
   - Z₁ cases are built **deliberately, in isolation, verified** — never hacked into the Z₂ core.
   - **If I'm tempted to bend a Z₂ invariant to make a Z₁ case work → STOP. That is the spiral.**
3. **Conflict / update check.** If the request conflicts with or must change a principle → **state it
   and let Antonio decide.** Never bend a rule silently. (This is how the lexicon grows.)
4. **Verify** with a Playwright screenshot of `/skins` before claiming anything works. Don't declare
   victory — ask Antonio to confirm.

## Standing reminders / dead-ends (don't repeat)
- **Do NOT resurrect the global lower-envelope-of-eaves** — it CUTS the host (model error, rejected).
  A single prim's own min-of-4-eaves IS its tent (fine); MAX across prims (never min across prims).
- **Don't over-diminish** `f_a` — a big eave-raise kills the melt interface (turns it into a wall).
  Diminish by rafter fraction; keep it modest (~8% in the current example).
- **Don't bridge/weave** across a height discontinuity — that's a wall; render it vertical (step-wall).
- No 45° eaves; diagonals in plan are sloped hips/valleys.
- One Z₁ case at a time.
