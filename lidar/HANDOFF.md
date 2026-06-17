# LiDAR Roof Linear-Takeoff Engine — HANDOFF (2026-06-14)

> Read this top-to-bottom to pick up the roof **linear-takeoff** engine without re-deriving anything.
> Companion files: `lidar/PLAN.md` (chronological build log + dead-ends), `lidar/skel_fp.py` (current engine),
> `lidar/engine.py` (data pipeline + dump), memory `roof-3d-data-pipeline.md`.

## 1. The goal (and what is / isn't the product)
Address → **free Oklahoma LiDAR** → the roof's **linear takeoff** (ridge / hip / valley / eave / rake, in feet) →
"our own EagleView" at **$0/roof**, covering the OKC metro. Antonio set the bar: **≤5% error, 90% of the time, on ALL
roofs incl. complex** — deterministic, no "it's complex so book an inspection" cop-out.
- **The linear takeoff IS the deliverable.** A roof quote is built from LF of ridge cap, hip/ridge, valley flashing,
  drip edge (eave), rake. **Squares (area) was a *prior-session* win and a SEPARATE, easier problem** — see §8 for the
  squares path used by the public widget. Do not confuse the two; chasing squares here is the cop-out Antonio banned.

## 2. STATUS — ~60–70% there. The hardest roof is nailed; two known tails remain.
Validated against EagleView truth on 3 reference roofs:

| roof | EV ridge/hip/valley | engine now | verdict |
|---|---|---|---|
| **Crest** 19428 Crest Ridge Dr (12-facet hip+valley, the hardest) | 58 / 191 / 87 | **+1% / +0% / +8%** | ✅ essentially nailed |
| **Hinkle** 4024 N Nicklas Ave | 65 / 148 / 48 | −3% / **−25%** / +2% | ridge+valley good; hip under |
| **Lee** 6320 N Warren Ave (gabled L) | 90 / 0 / 39 | **−27% / 35ft phantom** / −1% | valley exact; ridge+hip stuck |

≈6 of 9 line-items within ~8%; the failures are isolated (Lee's one corner, Hinkle's hip). Engine is **deterministic**.

## 3. ARCHITECTURE — two stages, file by file
**`engine.py` = the DATA pipeline** (network; produces a cached `dump_<slug>.pkl`):
geocode (Google) → **Overture** building footprint (MS ML+Google+OSM; the ONE building) → find the covering
`OK_Panhandle_B1B_2018` EPT workunit → PDAL crop ±60m, reproject EPSG:6344 (UTM14N m) → **lexsort points** (determinism)
→ **L1** footprint-clip + curvature/Z-spread roof isolation → **L2** region-growing plane segmentation (+coplanar merge) →
**L3** full-label topology (label EVERY footprint pt to nearest facet PLANE → complete crease network) → `DUMP=1` pickles
{planes(n,d,fidx), Pall, lab, pairs, pitch, foot_wkt(+0.8m buffered), x0,y0, M, kt}. (engine.py ALSO still has the OLD
pairwise L4/L5 crease code — superseded by skel_fp; keep for the dump only.)

**`skel_fp.py` = the ENGINE** (iterates on the dump, NO network — this is where all the accuracy lives):
1. footprint: `buffer(-0.8)` to **undo the overhang buffer** (Overture already = roof edge) → `simplify(1.0)` → **CW ring**.
2. **polyskel** (vendored `lidar/polyskel.py`, Felkel straight skeleton) → interior nodes + arcs.
3. lift to 3D: node z = `inset_distance × tan(pitch)` (uniform-pitch assumption; pitch = median facet pitch).
4. **classify each arc:** ridge = horizontal interior arc; hip/valley = 2-nearest-footprint-edges convex/reflex;
   **valley must DRAIN to an eave** (`min(zs,zt) > 4ft → it's a hip throat, not a valley` — THE fix that solved the +20–30% valley over-count).
5. **gable correction (per-segment):** a gable wall = a stretch of edge (possibly only PART of one) with no facet sloping
   to it → drop phantom corner-hips, extend ridge to the wall, add 2 rakes.

## 4. What WORKS (banked, don't re-litigate)
- **Straight-skeleton-of-footprint is the right architecture** (clean topology) vs plane-arrangement / pairwise (tangles).
- **Determinism:** `np.lexsort((z,y,x))` at load (EPT reader order was non-deterministic).
- **Footprint un-buffer** (`buffer(-0.8)`): snaps edge lengths onto EV (57.4'→54.9' eave). Made Crest ridge **+0% exact**.
- **Valley drain-to-eave rule:** real valleys were already EXACT; the over-count was spurious interior "throat" arcs.
- **Per-segment gable detection:** handles a flush edge that is half-eave / half-gable (wings of different height share a line).
- **Tool chosen by MEASUREMENT:** polyskel vendored = the only straight-skeleton lib that runs in this env (§6).

## 5. What's STUCK — the two tails (for the next agent)
- **Lee north gable (ridge −27% + 35ft phantom hip).** ROOT (debugged): L2 segmentation grew a **267-pt north-facing facet
  across the main roof's NORTH gable end**, so the facet test reads "a roof slopes here → eave" and won't call it a gable →
  skeleton hips the corner + ridge stops short. It's a **DATA/segmentation** problem, not gable logic. Fixes to try:
  (a) better L2 segmentation (don't let a facet span a gable end); (b) a **structural override** — "a ridge running
  perpendicular toward a footprint edge ⇒ that end is a gable" — but beware the chicken-and-egg (ridge is short *because*
  the gable is missed). Antonio's EV diagram (in `~/Downloads/SOL.png`) confirms Lee = 2 gabled wings (main 54'6" N-S +
  lower extension E-W), 3 gable ends, 2 valleys ≈19'7" each, no hips.
- **Hinkle hip −25% (under).** Likely the `buffer(-0.8)` shrank the footprint a touch too far for this roof (the real
  overhang is < 0.8m, maybe ~0.3–0.5m). Try a smaller un-buffer or per-roof overhang; watch that Crest ridge stays exact.

## 6. TOOLCHAIN + how to run
- **Python:** `/Applications/Xcode.app/Contents/Developer/usr/bin/python3` (has laspy/pyproj/scipy/shapely/matplotlib;
  the Homebrew `python3` is hijacked by PDAL's py3.14 — do NOT use it).
- **polyskel:** vendored `lidar/polyskel.py` (from github Botffy/polyskel) + `pip install --user euclid3`. Needs CW winding.
  scikit-geometry/bpypolyskel are NOT pip-installable in this env (measured) — polyskel-vendored is the Z₂ choice.
- **EPT:** keyless `usgs-lidar-public/OK_Panhandle_B1B_2018/ept.json` (EPSG:3857) — covers central OK despite the name.
- **Run:**  make/refresh a dump:  `DUMP=1 .../python3 lidar/engine.py "<address>"`  (network, ~30–60s)
           iterate the engine:  `.../python3 lidar/skel_fp.py <slug>`  (instant, on cached dump; `DBG=1` for per-arc detail)
           tuning knobs: `SIMP=<m>` (footprint simplify, default 1.0).
- **Visual review:** `client/public/roof-review.html` → `http://localhost:3000/roof-review.html` (renders + EV-vs-ours).
  (Satellite side-by-side needs the **Maps Static API** enabled on the GCP project — currently OFF.)

## 7. DEAD-ENDS (logged so you don't repeat them)
- **scipy plane-arrangement node graph** — +122% ridge, fights L2 over-segmentation. (`skel_blitz.py`, kept for reference.)
- **Pairwise facet-triple node-bounding** (clamp creases to triple-intersection nodes + min-edge filter) — net regression
  (destroyed simple-roof creases). The graph must be built FROM nodes, not pairwise-then-clamped.
- **Morphological footprint smoothing** (buffer open/close) — made edge lengths WORSE than the un-buffer.
- **"belief" moves** — e.g., calling scikit-geometry "notorious" instead of measuring. In a sandbox, test, don't recall.

## 8. The METHOD that worked here (keep using it)
- **localhost / render IS the oracle** — every wrong number was diagnosed by LOOKING at the matplotlib render, not theory.
- **Antonio is the domain oracle** — the biggest leaps (footprint un-buffer, flush-top per-segment gable, valley
  drain-to-eave) came from putting renders + my stated assumptions on localhost and letting him correct what I can't see.
- **Blitz / kill-test on the hardest case** (Crest), iterate each module until it stops improving, then freeze + move on.
- **Pareto/Parkinson + ζ (Z₁ fragile vs Z₂ stable)** for tool/architecture choices.

## 9. NEXT STEPS (priority order)
1. Hinkle hip (tune the un-buffer / overhang).  2. Lee north gable (segmentation or structural override).
3. **Eave/rake EV truth** — get EagleView eave/rake LF for the 3 roofs to validate those (rake is computed, unvalidated).
4. Breadth — run 5–10 more OKC roofs vs EV to find new failure modes.  5. **Stage 5** — fold `skel_fp.py` back into
   `engine.py` as one address→takeoff call (replace the old pairwise L4/L5).  6. Squares fall out for free
   (Σ facet plan-area / cos pitch) but the **public widget should use the Solar API** for squares — see the squares note.
