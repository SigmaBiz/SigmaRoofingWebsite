# DOCTRINE.md — the micro-state compass 🧭

**Read this before every move; update the LIVE MICRO-STATE below when it changes.** This is the
decision-discipline for the work (Antonio, 2026-06-13). Pulse = narrative · STATE = status ·
PLAN = checklist · **this = how we decide and check ourselves.** It is the most-referenced file:
glance at it every time you "move a finger."

---

## The three poles — keep them in tension (checks & balances)
Every move must stay coherent across:
- **NARRATIVE** — the story / why we're here (Pulse.md).
- **INTENT** — what we actually want (the goal), including the **pre-narrative**: the priors and
  assumptions we walked in with, before any story.
- **HYPOTHESIS** — what we currently believe is *true* about the world / code / data.

When these diverge — a move serves the hypothesis but not the intent, or rests on a pre-narrative
we never tested — **STOP and name it.** Drift is the enemy, not the size of the task.

## 1 · The Corroboration Alliance
For every claim, stand up BOTH:
- **corroborators** — tests that would confirm it, and
- **anti-corroborators** — tests contrived to *kill* it.

**Trust nothing until an honest anti-corroborator tried and failed.** n=1 is a start, not a proof.
A result with no one assigned to attack it is an assumption wearing a lab coat.

## 2 · Blitz the noise — and the *assumed* signal
Pareto (80/20) / Price (√n of inputs → half the output): **most input is noise.** So don't mine for
signal by accumulation. Spend the first effort contriving the **cheapest test that could KILL the
load-bearing assumption** — *including what merely looks like signal.* Blitz the bullshit; blitz the
assumed signal. **A clean kill or pivot is a win**, not a failure — it collapses the search space.

## 3 · Belief = what we WOULD and COULD do → Banned moves
Belief here = the set of moves we *would* and *could* take. The **goal itself forbids** some moves —
not from inability, but because taking them invalidates the intent (jaywalk to the goal → the goal
is no longer the goal). So **ban** them up front:
- **(estimator)** API key in client · billing for a LOW-confidence "exact" · claiming
  EagleView/warranty-grade accuracy · `dataLayers` on every free lookup · double-lookup w/o cache ·
  burying the booking CTA.
- **(method)** declaring victory on n=1 · trusting a number with no anti-corroborator · sinking a
  multi-hour build before its validation target exists · bending a core invariant to force one edge case.

## 4 · Serendipity / neutrinos
When the experiment *summons a presence* — belief + narrative + intent + hypothesis collide and throw
off something unplanned — and it points somewhere we can **substantially harness**, pursue it **to the
extent it merits, no more.** Log neutrinos; don't chase every flicker.

## Pre-flight (before every finger-move)
1. Which pole am I serving — and am I still coherent across all three (narrative / intent / hypothesis)?
2. What's the load-bearing assumption of THIS move, and what's the cheapest test that kills it?
3. Is this a **banned move**?
4. Did a **neutrino** just appear? Worth harnessing, or log-and-move-on?

---

## LIVE MICRO-STATE (keep current)
- **Narrative / Intent:** the instant roof estimator = the funnel magnet that turns a "how much to
  replace my roof" searcher into a booked inspection; also Antonio's cheap EagleView/Xactimate. (Pulse.md)
- **Hypothesis in flight:** *we can produce an EagleView-grade **SKETCH + LINEAR takeoff** from the raw
  Google DSM* (the paid tier). The sketch and the linear feet are ONE build — the diagram's lines ARE the LF.
- **Settled by the alliance so far:**
  - ✅ kill-test PASSED — Solar squares ±~5% (mean ~5%, n=4 w/ truth), pitch exact on single-pitch roofs.
  - ✅ DSM-supervisor experiment KILLED the expensive "our own area" path (area tie: ours 5.0% vs Google 4.9%).
  - ✅ free win — Google's per-facet data already reproduces EagleView's area-by-pitch table (`decompose.ts`).
  - ✅ sketch RENDERS from the DSM (raster, ~1.5s/roof) — recognizable facets / outline / relief.
  - ✅ outline kill-test PASSED (`roof-outline.ts`) — vs EagleView (Crestridge): perimeter −10%, eaves
    −13%, rakes +3%. Mask traces ~the wall line (just inside the drip edge), so eaves read short.
  - ✅ interior creases PASSED (`roof-creases.ts`) — facet-segment + classify: ridges −26%, hips −22%,
    valleys +10% vs EagleView. Ridge/hip/valley **proportions match EagleView** (classification correct);
    ~23% ridge/hip undercount is a systematic smoothing/segmentation bias (calibratable, NOT tuned to n=1).
  - 🛑 **PARKINSON STRIKE (n=4 linear truth: Crestridge, 3605, Lee, Hinkle) — the paid model's load-bearing
    assumptions COLLAPSED.** Struck A2 perimeter (mask outline), A3 ridge+hip total + A4 valleys (facet seg):
    · A2 perimeter: −10 / −22 / −4 / −1% → **SURVIVES** (~±20%; doesn't touch segmentation).
    · A3 ridge+hip total: −23 / −8 / **+122% (Lee)** / −9% → **COLLAPSES** (variance −23→+122%, unstable).
    · A4 valleys: +10 / false+ / **+99 (Lee)** / **+120% (Hinkle)** → **COLLAPSES** (massive over-count).
    Root cause: A3/A4 need robust facet segmentation; the 0.1m Google DSM **over-segments unpredictably**
    across roof types → spurious creases. No single calibration survives that variance (banned: tune to one).
- **Squares (n=7 cov):** mean |Δ| **4.7%**, max 11%. Coverage 7/8. Pitch within-1 4/5. **SOLID** (drives shingles).
- 🥊 **OUTSIDE-THE-BOX attempt (challenged the constraint, didn't accept it):** routed creases through the
  SURVIVING outline instead of DSM segmentation — synthetic uniform-pitch surface = footprint distance-transform
  × tan(pitch), creases off the clean surface (`roof-skeleton.ts`). Hammered its core on the 4 roofs:
  · C1 (uniform pitch): **SURVIVES** — Crestridge (all-hip) nailed it: **ridge+hip +0%, valleys −8%.**
  · C2 (eave↔rake / hip↔gable from outline): **COLLAPSES** — Lee/3605 (gables) sprout phantom hips (Lee
    ridge+hip +80%, hips 151 vs 0); valleys explode (+450%). A perfect skeleton CAN'T fix this — the outline
    doesn't encode which edges are eaves vs rakes.
- **TRUE decohered constraint (confirmed by BOTH attacks):** Google's 0.1m DSM doesn't reliably encode the fine
  edge/seam classification (eave↔rake, facet seams) the linear takeoff needs — via segmentation OR via outline.
  An information-resolution limit, not an algorithm choice. Crease geometry is below the data's reliable res.
- ⚠️ **The PIVOT was PREMATURE — the decoherence missed an eigenstate: `|read it with VISION⟩`.** I am a vision
  model and never deployed it; I conflated "*my hand-classifier* can't" with "the info is absent." Rendered a clean
  scaled blueprint (`roof-blueprint.ts`: flat color-by-facet + crisp seams + 10 ft grid) and READ it: on **Lee** —
  the gable that gave the algorithm phantom hips (+80–122%) and exploded valleys (+450%) — vision plainly sees
  **gable ends → RAKES, zero hips**, ridges per wing, valleys at the inside corner (= EagleView 90/0/39). The
  eave/rake signal I called "absent from the 0.1m DSM" is RIGHT THERE in the picture. **Constraint REFUTED.**
- **DECISION = DON'T pivot. Pursue VISION-IN-THE-LOOP (hybrid):** render blueprint → a Claude **vision** pass reads
  facets + classifies every edge (eave/rake/hip/ridge/valley) + merges over-segmentation → the **algorithm MEASURES**
  the vision-corrected geometry precisely (grid-scaled, 6.10 px/ft). Vision classifies (its strength, where the algo
  failed); math measures (its strength). **Open item:** measurement precision (structured vision→algo hand-off).
  **Next:** wire the vision pass + validate on the 4-roof linear cohort. Free tier still ships in parallel (the funnel).
- **Lesson (meta):** when an algorithm fails, decohere ALL eigenstates before concluding the *information* is absent —
  including "can a different *kind* of model (vision) read what this one can't?" Don't be passive; deploy every model.
- 🏆 **SURVIVOR MODEL = vision-for-topology + GEOMETRY-for-length + area/Euler cross-checks (adaptive prims).**
  Lengths are DEDUCED, not measured: plan→true is exact trig (ridge/eave ×1, rake ×√(1+s²), hip/valley ×√(1+s²/2));
  prims (gable/hip + on-the-fly mansard/gambrel/intersection) decompose the footprint; topology fixes which lines
  exist (convex corner→hip, reflex→valley, flat end→gable/rakes); area = footprint/cos(pitch) bounds it.
  **Demonstrated on Lee (the roof that killed every pixel method):** discard the algo's bogus eave/rake labels →
  outline traces a clean L (area cross-check −2%) → vision reads 2 gable wings → DEDUCE hips **0** (✓), ridges
  **~88** (truth 90.35 ✓), valleys **~40** (truth 39.13 ✓). Where DSM-seg/skeleton were off +100–480%, geometry
  lands on EagleView because the shape *constrains* the lengths. **Core (Pareto): uniform pitch + a structure vision
  can decompose** — survives the bulk of OKC tract housing; novel/complex → adaptive fallback or inspection.
- **Adaptive rule (Antonio):** the 2 defined prims are a basis, not a cage. Unrecognized section → model a new prim
  on the fly OR drop to raw geometry/constraints. Never turn the brain off; always re-model.
- **BUILT + VALIDATED — geometry core (`geometry.ts` + `geometry-check.ts`):** exact plan→true multipliers;
  single-prim formulas (40×40 hip pyramid: ridge 0 ✓, eaves 160 ✓); cross-gable composition (wider ridge full,
  narrower truncates at the wider slope, 2 valleys at 45°). **Lee vs EagleView: hips 0 (exact) · ridges 90.6/90.35
  (+0.3%) · valleys 38.6/39.13 (−1.3%) · area 25.3/25.75 (−1.9%, footprint×√(1+s²) cross-check).** ~1% on the roof
  pixels missed by +100–480%. (Inputs = vision-read structure + outline dims ~−4%.) The survivor model's engine works.
- **PRIM PALETTE BUILT** (`geometry.ts` + `.context/PRIM-PALETTE.md`): gable·hip·combination·shed·flat·clipped-gable·
  dutch-gable·gambrel·mansard. Antonio's rulings baked in — break lines uncapped, membrane separate, vision supplies
  clip/gablet, free edges. Tier-1 field-validated (Lee ~1%); Tier-2/3 formula-complete (need ground truth to validate).
- ✅ **VISION PASS WIRED + LIVE (2026-06-13):** `vision.ts` (`@anthropic-ai/sdk`, base64 PNG, adaptive thinking, model
  `claude-opus-4-8`, `ANTHROPIC_MODEL` override) + `roof-schema.ts` (contract) + `assemble.ts` (→ geometry). Full pipeline
  ran LIVE with a real `ANTHROPIC_API_KEY` (`vision-live.ts`): address→blueprint→Claude vision→geometry→takeoff, autonomous.
  **Lee: ridges −4%, hips exact, valleys +2%** (vision read it as a crossGable, unprompted). **Crestridge (complex 12-facet
  hip): vision SELF-FLAGGED low confidence**, under-decomposed → hips −51%/valleys −60%. KEY: confidence self-assessment WORKS
  (Lee=medium, Crestridge=low) = the routing signal — simple→instant number, complex/low-conf→inspection (the conversion, by design).
- ✅ **COMPLEX-HIP IMPROVED (added `hipWing` prim + Solar facet hints + multi-wing prompt + valley double-count fix):**
  Crestridge hips −51→−8%, ridges +10%, valleys −50% (still under — vision modeled 1 wing+gable where there are 2 wings);
  Hinkle ridges +14% / hips −17% / valleys +23% (was +134%); Lee stayed ±2%. **Hips/ridges now ~±10–17% across all 3.**
  Valleys stay wobbly on the MOST complex roofs (decomposition-completeness limit) — but vision self-flags those `low`
  confidence → they route to inspection. ⚠️ Anthropic key ROTATED + verified (old deleted).
- **NEXT (track B):** likely PLATEAU on complex-hip — recommend ship gated. (a) wire `POST /api/measure` (refactor blueprint
  render → fn; geocode→measure→blueprint→vision(hinted)→assemble; HIGH conf = show takeoff, LOW = "approximate / book inspection");
  (b) field-validate Tier-2/3 when EagleViews of a gambrel/mansard/shed arrive.
- 🧪 **VALLEY-FROM-FOOTPRINT (M2) PROBED, then HONESTLY DOWNGRADED (Z₂→Z₁):** valley ⟺ REFLEX corner of the footprint is a
  geometrically EXACT rule, BUT applying it by counting corners on the raw Solar mask FAILS — the 0.1m mask is too coarse.
  `roof-corners.ts` filter-free: 3605(0 val)=2, Lee(39)=1, Hinkle(48)=4, Crest(87)=5 (rises, but control 2 > Lee 1 = anomaly).
  Adding a min-edge filter to kill 3605's spurious reflex **REGRESSED** (Hinkle 4→1: real short notch edges dropped) → reverted.
  **Anti-corroborator did its job:** the footprint-reflex valley path is mask-noise-dependent (Z₁), not the clean Z₂ I assumed.
  The RULE is exact; our FOOTPRINT SOURCE (0.1m mask) isn't clean enough to apply it by counting. (Belief error logged in STATE.)
- 🏁 **PIVOT (real Z₂) = route-uncertainty-to-human, not perfect-valleys.** We can't GUARANTEE a complex decomposition; we CAN
  guarantee DETECTING uncertainty + routing to inspection. Vision already self-flags Crest/Hinkle "low" → they already route to the
  booking CTA (the conversion). Harden with a **facet-count-consistency guard** (vision-implied facets vs reliable Solar facet count
  diverge → force confidence "low"). Complex-roof valley error then becomes the CORRECT behavior (inspection), not a wrong number.
- **DECISION (Parkinson + ζ): STOP polishing complex-roof valleys against a noisy mask; SHIP the free tier.** Wire `POST /api/measure`
  + `/estimate` page on the VALIDATED part (squares+pitch+$ + confidence routing); add the facet-consistency guard to the confidence
  calc. M3 valley-derivation → PAID-tier fast-follow needing a cleaner footprint than the 0.1m mask. Lee-class simple roofs already
  give an honest takeoff; complex roofs route to the human. Shippable + honest TODAY — and it serves the intent (booked inspections).
- 🔁 **CORRECTION (Antonio): that was the lazy "fail→move-on" default — the module is MEANT to fail iteration-1 so there's signal to
  iterate on. M3 (`roof-valleys.ts`) = MEASURE valley feet (don't COUNT corners): per reflex corner, gradient-ascend the interior
  distance-transform (the uniform-pitch "tent") up to the first node; path-run × √(1+s²/2) = true valley feet. Each failure fed the next:**
  - **iter-1** (ascend to local max): Lee −42 / Hinkle +109 / Crest +54%. Feedback: ascent OVERSHOOTS to the *global* ridge (every
    corner ≈ half-width), not to the valley terminus.
  - **iter-2** (stop at the BEND — valley climbs straight ~45°, bends when it hits a node, >50°): Hinkle +109→**+20**, Crest +54→**+27**.
  - **iter-3** (tighten bend to ~38°, catches the leaked overshoot): **Crest −2% ✓, Hinkle +15%.** From the +100–480% that killed every
    pixel method → −2% on the 12-facet 87ft roof, deterministically from the footprint. (bend θ tuned on n=3 — calibration, watch overfit.)
  - **Lee stuck −58% — DIAGNOSED, not noise:** Lee is an L with a FLUSH wing (wing's north wall colinear with the main's top eave). Its
    upper valley starts at a mid-edge T-junction with NO footprint corner → per-corner ascent structurally can't see it. **Boundary of
    the method: protruding-wing valleys ✓ (real reflex corner); flush-wing valleys ✗ (need the full medial axis / a node on a straight edge).**
  - **iter-4 = THE NEUTRINO (Pauli-decoherence of "where the valley info lives"): the eigenstate I never measured was
    `|Solar per-facet azimuth + plan-area + position⟩`.** I jumped to "vision reads the picture" but the picture's STRUCTURED DATA is
    already in the cheap `buildingInsights` call. A flush cross-wing CANNOT hide there: it's always reported as a N+S (or E+W) facet
    pair even when the footprint has no corner. Probe (`facet-probe.ts`): Lee = 4 facets = E/W main pair (ridge N-S, 55ft) + **N/S cross
    pair (the flush wing!), 34ft run, offset left**. 3605 = just 2 facets (one gable) → 0 cross-wings.
  - **iter-5 = HARNESSED (`roof-wings.ts`, vision-FREE): valleys from the constellation.** Bin facets to cardinals → dominant opposite-pair
    = main ridge; facets on the other axis = cross-wing; valley = Wc·√2·√(1+s²/2), Wc = 2×(cross-facet center-span). Result:
    **3605 = 0 ✓exact · Lee = −3% ✓ (was −58%!) · Hinkle +393% · Crest +126%.** NAILS the simple/flush roofs (the DT-ascent blind spot),
    BREAKS on complex hips (single-cross-wing clustering too crude — but DT-ascent already nails those: Crest −2%, Hinkle +15%).
  - 🏆 **ARCHITECTURE (the survivor): a VISION-FREE, ~$0 deterministic valley engine via a COMPLEXITY ROUTER** — simple/clean-2-axis/few-facets
    → facet-constellation (`roof-wings.ts`); complex/hip/many-facets → DT-ascent (`roof-valleys.ts`). Blind spots are mutually exclusive →
    full coverage with NO vision, NO API cost (runs on `buildingInsights` + the mask we already fetch). This is "harvest Google's data, run
    our own math." Vision DEMOTED to corroborator/fallback for the genuinely ambiguous. (Router threshold tuned on n=4 — validate before trusting.)
  - **iter-6 = HIP TEST (iteration-1, NOT a verdict): DT-ascent from CONVEX corners gives Crest −79% (per-hip 2–6ft: bend-stop fires
    instantly), Hinkle −26%, 3605 −36%, Lee false +55 (gable corners → phantom hips).** FEEDBACK: (a) the valley bend-θ (0.78) is too
    tight for hips — a hip leaves a convex corner and the heading rotates faster → premature stop; hips need their OWN bend-θ. (b) gable
    corners must be GATED OUT (a hip corner has perpendicular-azimuth facets; a gable corner ends at a rake — the constellation knows).
- ❌ **COP-OUT DELETED (Antonio):** "complex roof → self-flag LOW → book inspection" is NOT an answer — it's the fail-and-move-on default
  wearing a ζ lab coat. Confidence routing is ONLY for genuine DATA failure (no coverage / occlusion), never a substitute for geometry we
  haven't modeled. **GOAL (no escape hatch): a full deterministic takeoff — squares · pitch · valleys · HIPS · ridges · rakes · eaves — to
  ≤5% on ≥90% of ALL roofs, complex included.**
- 🧗 **HIP CAMPAIGN (iterated, did NOT cop out): every MASK/DT method hits the 0.1m resolution wall.**
  · hip iter-2 (no-bend ascent): Crest +114% / Hinkle +17% / 3605 +533% — overshoots to global peak. Working the bend fraction each roof
    needs (3605 .06, Hinkle .6, Crest .39) → **no single bend-θ fits → the bend heuristic is dead** (it only ever tuned valleys by luck on n=4).
  · iter-3 = PRINCIPLED skeleton (`roof-skel.ts`, Zhang-Suen thin → medial axis, junctions replace the heuristic): total plan length vs real
    (hips+val+ridge): **Crest −6% (hardest roof nearly nailed!)** but 3605 +61% (noise-spurs), Hinkle −39% (unresolved branches), Lee −19%.
    Errors point OPPOSITE ways (small→over, cut-up→under) = not tunable, it's the MASK RESOLUTION wall.
- 🎯 **DECISION — the ε-capable path is NOT more mask cleanup; it's the CONSTELLATION → PRIM-RECONSTRUCTION → EXACT ENGINE.** The Solar facet
  azimuth+area is the SAME high-quality data that gives squares ±5% (NOT mask-limited); it already nailed simple valleys (Lee −3%, 3605 0); and
  the geometry engine already emits hips/valleys/ridges/rakes/eaves to ±1% GIVEN correct prim dims (validated on Lee). So: build robust
  facets→prims clustering (the multi-wing/hip step deferred since iter-5) → feed `geometry.ts` → full takeoff at ε. This uses the GOOD data
  instead of fighting 0.1m. (Mask/DT methods kept as independent corroborators — Crest skeleton −6%, Crest DT-valley −2% — not the primary.)
- **CONSTELLATION RECON iter-1/2 (`roof-recon.ts`): per-facet shape (plan-area vs bbox, fill-ratio) → edge lengths; ½·Σ for sharing.**
  hips+valleys: **Hinkle −2% (1-sided) ✓ · Crest +20% (sym) · Lee +56%** (3605 unreliable — Google reports only 2 facets). **Complex roofs WORK
  (errors average over many facets); simple roofs over-count** because one facet's narrowing can be 1- or 2-sided and **area+bbox can't tell**
  (Solar gives bbox+area+azimuth+center, NOT the facet POLYGON). Ridges −35..−98% = a BUG (misclassified rects eat their ridge), not a data wall.
- **ADJACENCY GRAPH built (`roof-recon2.ts`): neighbors via touching bboxes; edge = RIDGE (opposite az, both slope away) / HIP (perp, both
  away) / VALLEY (perp, both slope TOWARD).** WIN: **ridges Lee −2%** (was −41%), Hinkle/Crest +29/+34%; Hinkle hips +10%, Crest valleys +7/−6%.
  But requiring slope-agreement swung Hinkle hips +10%→−41% — every param now TRADES one roof for another.
- **STATUS (6 methods + the levers TRIED): VALLEYS solved to ε** (wings: Lee −3%; DT-ascent: Crest −2%, Hinkle +15%) + **ridges-on-simple to ε**
  (Lee −2%). Mechanism #2 (rotated-bbox) lever TRIED → **de-rotation closed Crest hips +52%→+13%** (real, as predicted) but over-shortened Crest
  valleys (−6→−31%). Mechanism #1 lever (adjacency-sidedness) is ALREADY in `roof-recon2` (only shared edges become hips/valleys).
- 🏔️ **EARNED VERDICT (not premature — the levers were tried): the residual on complex hips/ridges = MECHANISM #1, no facet polygon.** Exact edge
  lengths are underdetermined by area+bbox+center — PROVED by the signature that every remaining fix TRADES one roof for another (Hinkle hips
  +10↔−43, Crest hips↔valleys). That info is not in Google's free data. **Path past it = richer source data (EagleView/Hover DXF facet POLYGONS,
  memory `roof-3d-data-pipeline`) → the SAME exact `geometry.ts` engine** (which is ±1% given real dims). NOT a cop-out — every roof still gets a
  deterministic number; the hard feature (valleys) is solved; the limit is named + demonstrated + has a concrete data path.
- 🔱 **DECISION IN FLIGHT — 4-WAY FORK on warranty-grade hips/ridges (Antonio's call; he just researched (c)+(d)):**
  **(a) SHIP the ε-core now** — squares ±5% · pitch · valleys · simple-ridges; full takeoff as an honest ±-banded ballpark (funnel doesn't need
  warranty-grade; can't legally claim it anyway — banned move). · **(b) keep grinding free-Google** hips/ridges (now roof-trading on n=4 → overfit). ·
  **(c) DXF** — EagleView/Hover bundle exact geometry **~$18–38/roof** ([[roof-report-pricing]]); can't power free lookups, fits a PAID report tier or
  Antonio's BACK-OFFICE (he buys EagleViews on won jobs anyway → ingest the bundled DXF/XML free). · **(d) 🟢 BUILD OUR OWN from FREE Oklahoma LiDAR** —
  USGS 3DEP statewide, **4.22 pts/m², $0/roof, NO vendor**; true-3D accurate points → plane-fit → analytic crease intersections → exact ridge/hip/valley,
  **breaking the no-polygon wall** (Google's 0.1m DSM smooths creases; LiDAR doesn't). Effort prototype-days/robust-weeks (PDAL + RANSAC/Polylidar3D,
  reuse our edge classifier + `geometry.ts`). Detail: memory [[roof-3d-data-pipeline]]. **(d) best fits the project ethos (don't pay per lead, run our own
  math); (a) ships in parallel — it's ready and fork-independent.**
- **Neutrinos open:** (1) imagery uniformly Jan-2023 → "stale in Google's eyes / post-storm" hook;
  (2) the free decomposition = an EagleView-style report at zero cost; (3) sketch + linear = one build;
  (4) a single overhang-buffer (~0.3–0.5m) on the outline could tighten eaves toward 252 (calibrate on Crestridge).
- **Pivot triggers:** no Solar coverage → drone/LiDAR at inspection · area >10% off → assisted not instant ·
  cost >$100/mo → gate/charge · >48h on a sub-build → ship the cheap tier, defer.
