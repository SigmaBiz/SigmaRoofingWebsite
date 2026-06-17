# PRIM-PALETTE.md — the roof-type prim alphabet (vision → geometry)

Source: Owens Corning "8 common roof types" + Antonio's gable/hip prims. Each prim is defined so the
**vision pass** can recognize it from the aspect-color blueprint, and the **geometry engine**
(`server/estimate/geometry.ts`) can deduce its linear quantities from dims + pitch. `s = rise/run`
(tan pitch). Multipliers: ridge/eave ×1, rake ×√(1+s²), hip/valley ×√(1+s²/2).

Schema per prim: **Form · Vision signature · Decompose · Pitch · Vision-supplied params.**

---

## TIER 1 — the Pareto core (~95% of OKC tract housing): GABLE · HIP · COMBINATION

### GABLE  *(Antonio's, restated)*
- **Form:** tent over L×W, ridge along L, vertical triangular ends.
- **Vision:** 2 facets, **opposite aspects**, meeting at a horizontal ridge that **runs to the end edges** (those ends are rakes).
- **Decompose:** ridge = L · rakes = 4·(W/2)·√(1+s²) · eaves = 2L · hips = valleys = 0 · footprint = L·W.
- **Pitch:** single. **Params:** none beyond L, W, pitch.

### HIP  *(Antonio's, restated)*
- **Form:** tent over L×W, 4 slopes.
- **Vision:** **4 facets, 4 distinct aspects**; the ridge does **not** reach the edges (hips wrap to the corners); the **whole perimeter is eave**.
- **Decompose:** ridge = L−W · hips = 4·(W/2)·√2·√(1+s²/2) · eaves = 2(L+W) · rakes = valleys = 0. (L=W → pyramid, ridge 0.)
- **Pitch:** single. **Params:** none.

### COMBINATION  *(cross-gable / cross-hip / L / T — where real roofs live)*
- **Form:** union of gable/hip prims.
- **Vision:** multiple ridge lines (often orthogonal) + **reentrant corners**.
- **Decompose:** per-prim formulas + **valleys at every junction** — the **wider wing's ridge runs full, the narrower truncates where it meets the wider wing's slope**; 2 valleys per junction, each (W_narrow/2)·√2·√(1+s²/2). *(This is the validated `crossGable()` — Lee deduced to ~1%.)*
- **Pitch:** single (per the whole roof). **Params:** the prim rectangles + junctions (vision).

---

## TIER 2 — Tier-1 prim + a local modifier: CLIPPED GABLE · DUTCH GABLE

### CLIPPED GABLE  *(jerkinhead / bullnose)*
- **Form:** a gable whose ridge ends are "clipped" by a small hip.
- **Vision:** reads **gable** (2 big opposite facets) but the ridge **stops short** of the end edges, with a **small hip triangle** at each end.
- **Decompose:** gable with ridge = L−2c · 4 short hips, each plan ≈ c·√2·√(1+s²/2) · reduced rakes below the clip. (c = clip depth.)
- **Pitch:** single. **Params:** **clip depth c** (architectural → vision reads it off the small hip facet).

### DUTCH GABLE  *(gablet on a hip)*
- **Form:** a **hip** roof with a small gable ("gablet") perched at the ridge end(s).
- **Vision:** reads **hip** (4 facets, hips to corners) but a **small vertical gable triangle** sits above the hip at the ridge end.
- **Decompose:** hip prim + gablet (adds small ridge g + 2 small rakes; the end hip shortens).
- **Pitch:** single. **Params:** **gablet width g** (vision).

---

## TIER 3 — multi-pitch / single-slope (rarer in OKC; default = DETECT-and-route to inspection)

### GAMBREL  *(barn — MULTI-PITCH)*
- **Form:** gable, but each side has **two slopes** (steep lower + gentle upper).
- **Vision:** **same-azimuth facet PAIRS** — steep & gentle share a hue in the aspect map, separated by **slope** in the hillshade — with a **horizontal slope-break line** parallel to the ridge.
- **Decompose:** ridge = L · 2 break-lines (length L each, convex, mid-slope) · rakes = 2-segment gambrel profile per end. Uses two pitches (s_steep, s_gentle) from Solar's per-facet data.
- **Pitch:** **MULTI.** **Params:** the two pitches + break elevation (Solar/vision).

### MANSARD  *(MULTI-PITCH + near-flat top)*
- **Form:** the **hip** version of gambrel — 4 sides, each steep-lower + gentle/near-flat upper; near-flat top.
- **Vision:** 4 **steep** lower facets (4 aspects) + 4 gentle upper + a near-flat **gray** top.
- **Decompose:** hip-like steep hips + 4 break-lines + upper gentle hips + small top ridge/flat. **Low-slope top = membrane, not shingle.**
- **Pitch:** **MULTI** + low-slope. **Params:** two pitches + top extent.

### SHED  *(skillion / lean-to)*
- **Form:** a **single** slope.
- **Vision:** **ONE facet, one aspect color, no interior seam.**
- **Decompose:** low edge = eave (L) · high edge = ridge/wall-top (L) · 2 rakes = side edges = D·√(1+s²) (D = depth) · hips = valleys = 0.
- **Pitch:** single. **Params:** which edge is high (free ridge vs against a wall).

### FLAT  *(low-slope)*
- **Form:** near-horizontal (slight drainage slope).
- **Vision:** large **gray** region (no strong aspect), no seams.
- **Decompose:** area ≈ footprint · perimeter = eaves **or parapets** · no ridge/hip/valley/rake. **Membrane material (TPO/EPDM), priced per sqft — not shingle squares.**
- **Pitch:** ~0. **Params:** parapet vs eave edges.

---

## Antonio's rulings (2026-06-13) — ALL BUILT in `geometry.ts` (verified by `geometry-check.ts`)
- **(1) Build them ALL out** (not just route) — combination roofs dominate + shed roofs carry Tier-3 geometry.
- **(2) Slope-break line is NOT capped** → reported as `breakLines`, excluded from ridge/cap LF.
- **(3) Membrane priced separately** → flat + mansard-top emit `membrane` sqft (TPO/EPDM $/sqft, not shingle squares).
- **(4) clip depth c / gablet width g** → vision supplies them (with math rules where possible).
- **(5) Free edges assumed** (shed high edge / flat parapet = free, not wall flashing — for now).
- **Status:** all 9 prims implemented (`gablePrim·hipPrim·crossGable·shedPrim·flatPrim·clippedGable·dutchGable·gambrel·mansard`).
  Tier 1 (gable/hip/combination) **FIELD-VALIDATED** (Lee ~1%); Tier 2/3 **formula-complete + sanity-checked**, awaiting
  ground-truth EagleViews of those roof types to field-validate (same way Lee/Hinkle validated the core).
