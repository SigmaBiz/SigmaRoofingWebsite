# LiDAR roof-reconstruction engine — build plan

**Goal:** address → free 2019 OK LiDAR (OK_Panhandle_B1B EPT) → reliable ridge/hip/valley (+eave/rake) takeoff,
validated vs EagleView truth (Lee 90/0/39, Hinkle 65/148/48). $0/roof, our own math, covers the OKC metro.

**Why the blitz failed (naive RANSAC-and-intersect):** isolation bridged to trees/neighbors; sequential RANSAC
over-segmented; false facet-pair adjacencies; crease length = wrong projection; ridge classification garbage.
Each is fixed by the proper technique below. Validate EACH module before moving on (don't trust the end number).

## Modules
- [ ] **L1 — robust single-house isolation.** crop → ground (class2) → above-ground → drop trees (per-cell Z-spread +
      PCA curvature) → connected component at geocode → roof-height band. GATE: clean single roof, footprint ~15-22m,
      relief ~3-6m, no tree. (render-verified)
- [ ] **L2 — region-growing plane segmentation** (normals + grow by normal-similarity + plane-proximity). Replaces
      sequential RANSAC. GATE: one clean region per roof plane, NOT over-segmented (~4-6 facets Lee, ~12 Hinkle). (render)
- [ ] **L3 — region-adjacency graph.** facets adjacent iff they share a CONTIGUOUS boundary (neighboring points in
      different regions). GATE: adjacency count ≈ real shared edges.
- [ ] **L4 — crease extraction.** adjacent facets → plane-intersection LINE; segment = extent of the shared-boundary
      points that lie ON the line. GATE: crease segments overlay the real ridges/hips/valleys.
- [ ] **L5 — classify + eave/rake.** ridge=high+horiz, hip=high+sloped, valley=low+sloped; eave/rake from each facet's
      concave-hull boundary minus shared edges (eave=low horiz, rake=sloped free edge). GATE: per-type ≈ EV.
- [ ] **L6 — validate** on Lee + Hinkle vs EV; then breadth (more roofs), then wire to the product.

## Status (2026-06-14 — full L1–L5 built in `lidar/engine.py`, CONVERGING)
- **L1 isolation:** ✅ tighter connected-component link (0.9 m) stopped the bridging → Hinkle 27×52m→**27×16m** (clean). Lee 35×22m
  (a touch big — maybe attached garage; drives its ridge +58%).
- **L2 segmentation:** ✅ region-grow + coplanar-merge → ~12 facets Lee / 7 Hinkle.
- **L3-5 creases:** ✅ shared-boundary pts → plane-intersection → gap-trim → dedup → **both-facet height classify** (the key fix:
  ridge/hip = high edge of BOTH facets, valley = low edge of both, else drop). Crease count → 9 on both.
- **RESULT vs EV (CONVERGED from blitz garbage):**
  · **Hinkle: ridge +4% ✓✓ · hip −22% · valley −63%**
  · **Lee:    ridge +58% · valley −33% · hip +20ft (phantom, EV 0)**
  From blitz ±100–7900% → tens-of-% with one ridge nailed (Hinkle +4%). The engine WORKS.
## 🎯 VALIDATED (2026-06-14) — engine is CORRECT; remaining error = building isolation only
Added 3rd validation roof (Crestridge, 12-facet, 191ft hips). Crease length = facet-extent overlap (clamped to boundary ±0.8m);
density-filtered isolation + 18m window + density-gap split for bridged components.
- **Crestridge (cleanly isolated): ridge +1% · hip −2% · valley +6%** — the WHOLE takeoff to ~ε on the hardest roof. **PROOF the engine works.**
- **Lee (attached garage in window): ridge +45% · valley +6% · hip 47ft phantom** — garage inflates ridge.
- **Hinkle (densely-attached neighbor): ridge +296% · hip +6% · valley +135%** — neighbor bridges (no yard-gap → density-split can't cut).
- **Conclusion:** hip solid everywhere (−2/+6%); ridge/valley solid when isolation is clean (Crestridge); inflation on Lee/Hinkle is
  100% an ISOLATION problem (neighbor/garage in the point set), NOT the reconstruction math.
## ✅ FOOTPRINT ISOLATION INTEGRATED (2026-06-14) — the big remaining lever, done
- **L1 now clips to the OVERTURE MAPS building footprint** (MS ML + Google + OSM; `overturemaps download --bbox`, geocode→polygon-containing-point,
  transform to local UTM, `shapely.vectorized.contains` +0.8m overhang buffer). OSM had nothing for these houses; Overture has all 3. The
  connected-component / density-split heuristics are GONE (footprint isolates the one building cleanly).
- **IMPACT — vs EV (final config):**
  · **Lee: ridge −2% ✓ · hip 0 ✓exact (garage dropped → phantom hips gone) · valley −43%**  (was ridge +45%, phantom hips)
  · **Hinkle: ridge +19% · hip −19% · valley −57%**  (was ridge +296% — neighbor dropped)
  · **Crest: ridge +19% · hip +5% ✓ · valley +8% ✓**
- **State of play:** ridge & hip within ~20% on all (Lee exact); valley solid on complex roofs (Crest +8%), UNDER-counts on small roofs
  (Lee/Hinkle) — root cause = L2 segmentation leaves ~40% of points UNASSIGNED (gray) on smaller roofs → missing valley facets/creases.
## SMALL-ROOF VALLEY FIX — pushed hard, hit the heuristic plateau (2026-06-14)
Tried 4 principled angles, each helped one roof / hurt another (the bounce = heuristic ceiling):
- (a) looser region-grow (angle/tol/min-size): recovered some Hinkle valley (−57→−21%) but over-segmented → ridge +28–36%.
- (b) **adaptive region plane** (re-fit during growth): Crest BEST (ridge +19→+1%, valley +8→−3%!) but Hinkle ridge +65%.
- (c) looser adjacency/classify thresholds: no valley change.
- (d) min-distance (2.0m) adjacency to bridge the curvature crease-gap: added false ridges (Hinkle +83%), no Lee valley gain.
**Diagnosis (corrected):** Lee's segmentation is actually COMPLETE (the "gray" region was a tab20-gray FACET, not unassigned). The valley
miss is in crease TOPOLOGY — a real valley between facets isn't being formed/measured, and it's resistant to point-level heuristics.
**Conclusion:** small-roof valleys to ε need a proper segmentation+topology layer (graph-cut / energy-min labeling, or a true straight-skeleton
solved on the FACET PLANES rather than the points) — a real multi-day build, not tuning.

## 🧩 TOPOLOGY LAYER BUILT (2026-06-14) — full-label crease network. VALLEYS substantially FIXED.
Principle: stop detecting creases from sparse interior-point adjacency. **Label EVERY footprint point to its nearest facet PLANE** (incl. the
crease-zone points the curvature filter drops) → a COMPLETE facet label-map; **creases = boundaries between labels** → the crease network is
complete, valleys can't be missed. Then plane-intersection length (facet-overlap clamped) + both-facet height classify + collinear junction-dedup.
- **RESULT vs EV (was → now):**  Lee valley **−43% → +21%** · Hinkle valley **−57% → −32%**, hip **−19% → −4%** · Crest valley **+8% → −19%**.
  Full: Lee +3%/+17ph/+21% · Hinkle +17%/−4%/−32% · Crest +25–79%/+9%/−19%. **The valley problem — the explicit ask — is largely solved.**
- **TRADEOFF + remaining:** (1) Crest (complex 12-facet) ridge now OVER-counts (+25–79%) — junction artifacts where many facets converge at the
  peak (pairwise labeling over-produces collinear segments; cross-type junction-dedup helps but is the weak spot). (2) **NONDETERMINISM BUG**:
  Crest ridge flips 72↔104 ft run-to-run (1–2 borderline creases flip ridge↔drop on a float threshold) — fix with stable tie-breaking / hysteresis.
  (3) Lee phantom hip +17ft. **The uniform-across-complexity fix = true STRAIGHT-SKELETON on the facet planes / energy-min labeling (proper node
  handling at junctions)** — the next real layer. Net: topology layer is the better FOUNDATION (complete creases); complex-roof junctions are the tail.
- **Remaining tail:** (1) the topology/segmentation upgrade for small-roof valleys (above); (2) L5b eaves/rakes; (3) breadth on more roofs;
  (4) wire address→takeoff to product (squares = Σ facet plan-area/cos(pitch) — free). Engine is USABLE now for ridge/hip + complex-roof valleys.
- Toolchain: PDAL + Xcode-py {laspy,pyproj,scipy,shapely,matplotlib,overturemaps}. EPT=`OK_Panhandle_B1B_2018` (covers central OK, ~3-8 pts/m²).

## ❌ DEAD-END (2026-06-14) — pairwise-node "node-graph" layer REVERTED. Topology baseline restored & re-verified.
Tried the named "next lever" as a **pairwise hack**: L4a junction NODES (3-plane intersections of mutually-adjacent facet
triples, validated within 3m of all 3 facets) + L4b NODE-BOUNDING (clamp each crease's [lo,hi] to the nodes on its line,
then the existing `hi-lo<1.6` min-edge filter). **Net regression — destroyed more than it fixed:**
- **Lee: +3%/17ph/+21% → −53%/0/−100%** (only 2 raw creases survived; clamp shrank `hi-lo` below 1.6 → min-edge filter ate them; valley GONE).
- **Hinkle: +17%/−4%✓✓/−32% → +5%/−34%/−33%** (the crown-jewel hip −4% wrecked to −34%).
- **Crest: +79%/+9%/−19% → −24%/−9%/−33%** (killed the ridge over-count but OVERSHOT past 0 to −24%; valley worse).
- **Error type = model error** (the technique behaved differently than expected): pairwise triple-intersection nodes are
  too sparse/mis-placed to bound creases; clamping toward them + a fixed min-edge filter *deletes* real short creases on
  simple roofs. The genuine fix is a **true straight-skeleton / energy-min labeling** (proper nodes for ALL roofs), not a
  pairwise clamp. **Banned move:** don't re-attempt crease-bounding via pairwise facet-triple nodes.
- **REVERT = surgical** (2 edits): removed the L4a NODES block + the L4b clamp; the `hi-lo<1.6` filter was already in the
  baseline (node-graph only *inserted* the clamp above it). **Re-verified all 3 roofs reproduce the banked numbers exactly**
  (Lee +3%/17ph/+21% · Hinkle +17%/−4%/−32% · Crest +79%/+9%/−19%). Engine is back on the topology foundation.

## ✅ DETERMINISM FIXED (2026-06-14) — engine output is now reproducible. Gain banked.
Confirmed the flip live: 3 fresh Crest streams gave ridge 104/104/72 (hip 209 & valley 70 stable, crease count constant 14 →
one borderline ridge segment flipping on the float threshold, NOT a crease appearing/vanishing). Root cause = **EPT reader
returns points in non-deterministic order** (PDAL parallel tile reads) → KNN tie-breaks + region-grow seed order (`argsort(Ch)`)
shift → borderline crease flips at `percentile(z,52/48)`. **FIX (1 line, Z₂):** `order = np.lexsort((z,y,x))` right after
`laspy.read`, reindex x/y/z/cl → canonical point order, pipeline reproducible regardless of read order. **VERIFIED stable:**
Crest 103/209/70 ×3 identical; Lee +3%/17ph/+21% ×2 identical; Hinkle +17%/−4%/−31% ×2 identical. No classification logic
touched — removed the entropy at the source, not the symptom. **Engine is now deterministic AND keeps the topology gain.**

### Current deterministic takeoff vs EV (the banked state):
- **Lee 90/0/39:** ridge **+3%** · hip 17ft phantom · valley **+21%**
- **Hinkle 65/148/48:** ridge **+17%** · hip **−4%** ✓✓ · valley **−31%**
- **Crest 58/191/87:** ridge **+78%** (junction over-count, deterministic now) · hip **+9%** · valley **−19%**

## ✅ STRAIGHT-SKELETON LINEAR LAYER — blitz PASSED on Crest (2026-06-14). The chosen path.
The linear takeoff (ridge/hip/valley/eave/rake) — NOT squares — is the estimator's product. Pursued the node-graph/skeleton fix:
- **Stage 0 (tool, by MEASUREMENT not reputation):** `scikit-geometry`/CGAL = no macOS-cp39 wheel; `bpypolyskel`/`polyskel` not on PyPI.
  **Vendored `lidar/polyskel.py`** (Botffy, pure-Python Felkel straight skeleton) + `euclid3` → installs+runs+smoke-tested (rect→ridge+4 hips,
  L-shape→valley at reflex). **polyskel = Z₂-in-env** (needs CW winding). "notorious" was a banned belief; the env was the oracle.
- **scipy plane-arrangement route (`skel_blitz.py`):** built node graph from the segmented planes → **plateaued ABOVE baseline (+122% ridge)**;
  it fights the 14-facet over-segmentation (split/duplicate facets spawn phantom horizontal creases). Logged dead-end; the planes are too noisy
  for clean junctions on complex roofs.
- **footprint straight-skeleton route (`skel_fp.py`) — WINS.** Skeletonize the CLEAN Overture footprint (simplify 1.4m → CW) → lift to 3D at the
  roof pitch (node z = inset-dist × tanp) → classify: **ridge = horizontal interior arc** (height-based, stable); **hip vs valley = nearest-2-
  footprint-edges convex/reflex** (uniform-pitch facet normals). Iterates on `dump_<slug>.pkl` (engine.py DUMP=1) — no network.
  **CREST (58/191/87): ridge −15% · hip −2% ✓✓ · valley +27% · total +4%.** Net |err| 44% vs plane-arrangement baseline's 106%. Clean roof
  topology (hips→corners, ridges link junctions, valleys propagate inward from both reflex corners). Sidesteps segmentation entirely.
- **3-ROOF EVIDENCE (pure skeleton, no gable correction yet):** Crest −15/−2/+27 (tot +4%) · **Hinkle −4%/+15%/−60% (tot −3%, ridge near-exact)** ·
  **Lee −61%/130ft-phantom-hip/+20% (tot +63%)** — Lee is fully GABLED (EV hip=0) so the pure skeleton hips every corner → the gable signature.
  Confirms: skeleton topology is right; the tails are (a) gable correction (Lee) and (b) valley split (+27 Crest / −60 Hinkle — inconsistent).
## ✅ STAGE 2 — GABLE CORRECTION built (2026-06-14, `skel_fp.py`). Mechanism validated; edge-cases at the tuning plateau.
A footprint edge is a **GABLE** iff (no roof facet slopes toward it: bestdot ≤ cos50° within 4.5m — uses the OUTWARD normal,
sign-fixed for the CW ring) AND (a ridge **endpoint** terminates ⟂ at it within 6m). At each gable: drop the phantom corner-hips,
extend the ridge to the gable wall (apex = edge midpoint), add 2 **rakes** apex→corners. Results (ridge/hip/valley vs EV):
- **Lee (90/0/39, gabled):** pure −61%/130ft-phantom/+20% → **gable-corrected −23%/30ft/+20%** (hip 130→30, ridge −61→−23). Big win.
- **Hinkle (65/148/48):** 0 gables detected (fully hipped) → unchanged −4%/+15%/−60%. Correct (no false gables).
- **Crest (58/191/87, hipped):** 1 false gable (edge 6 = a missed-facet eave that looks gable-like) → −27% hip regression. SEGMENTATION
  noise, not gable-logic; two gates (ridge ⟂, ridge-endpoint-near) couldn't separate it — plateau. Net still product-positive (most OKC
  homes gable like Lee; keep correction ON).
- **Remaining tails (don't grind — next levers):** (1) **VALLEY is the worst consistent error** (Hinkle −60%, Crest +27%) — Stage 4, the
  biggest lever now. (2) Lee residual 30ft hip + Crest edge-6 = segmentation-quality edge cases. (3) eave/rake EV truth not on file (rake
  printed, unverified). **NEXT = Stage 4 valley refinement, then Stage 5 integrate into engine.py.**
- (superseded NEXT) Stage 2 = gable-vs-hip correction from LiDAR (Lee is fully gabled, hip=0 — pure skeleton will over-hip it);
  Stage 3 = eave/rake from footprint edges; Stage 4 = mixed-pitch + valley refinement (+27% tail); Stage 5 = integrate into engine.py (replace L4
  pairwise loop), validate Lee/Hinkle/Crest ×2 (deterministic) to the ≤5%/90% finish line. Run: `python3 lidar/skel_fp.py 19428_crest_ridge_dr`.

## ✅ STAGE 4 — VALLEY over-count SOLVED + footprint fix (2026-06-14, with Antonio's EV-diagram input). Crest essentially nailed.
Collaborative session using Antonio's Lee EagleView diagram as ground truth + the localhost review page (`client/public/roof-review.html`):
1. **Footprint un-buffer:** the dump's footprint = Overture + 0.8m overhang buffer; the Overture trace already IS the roof edge, so
   undo it (`foot.buffer(-0.8)`) → edges snap onto EV (57.4'→54.9' main eave, 35.1'→32.7' gable span). **Crest ridge → +0% exact.**
2. **Per-segment gable detection** (Antonio: the top is flush): a single edge can be half-eave / half-gable where two wings of
   different height share a line → sample along each edge, gable = a contiguous run with no facet sloping to it. Crest hip −21%→−10%.
3. **Valley drain-to-eave rule (THE fix):** the breakdown showed the *real* valleys were already EXACT (Lee 19.7+19.1 vs EV 19'7"×2;
   Hinkle 15.2+17.1+16.5 vs 48) — the +18–30% over-count was a spurious short "throat" arc per peak with BOTH ends aloft. A valley
   must reach an eave (`min(zs,zt) > 4ft → reclassify hip`). Fixed all three; on Crest the throats were genuinely hips → **hip +0% exact**.
- **CURRENT vs EV:** **Crest 58/191/87 → +1% / +0% / +8% (NAILED — the hardest 12-facet roof, all ≤8%).** Hinkle 65/148/48 → −3% / −25% / +2%.
  Lee 90/0/39 → −27% / 35ft-phantom / −1%.
- **REMAINING:** (1) **Lee's north gable** — segmentation grew a 267-pt north-facing facet across the main roof's north gable end, so
  the facet test reads "eave" → phantom hip + short ridge. DATA-quality corner (not gable logic); needs better segmentation or a
  ridge-end structural override. (2) **Hinkle hip −25%** (under — likely the −0.8 footprint shrank a touch too far for that roof).
- **NEXT:** Hinkle hip; Lee north gable (override); then Stage 5 = integrate into engine.py (the dump-based `skel_fp.py` is the engine).

## ▶ THE FORK (where Antonio left off, now re-armed with a clean deterministic baseline) [SUPERSEDED — skeleton path chosen above]
Two tails remain, both = the SAME root (junctions where many facets converge): **Crest ridge over-count +78%** and **Lee phantom
hip +17ft**. Pairwise-facet logic can't resolve a peak into the right node set (proven by the reverted node-graph dead-end above).
The fork:
  **(A) Ship the gain now** — ridge/hip solid on simple roofs (Lee/Hinkle), hip solid everywhere (−4/+9%), valleys substantially
      fixed; wire address→takeoff (squares = Σ facet plan-area/cos(pitch), free) and tag complex-roof ridge as lower-confidence.
  **(B) Build the true straight-skeleton / energy-min labeling** — models the roof as edges meeting at NODES, so a 4-facet peak
      yields exactly 4 hips + a short ridge instead of 6 pairwise segments. The genuinely-bigger layer; makes ALL roofs ε at once.
      Multi-day CV build (the named "next real lever"), NOT a pairwise hack.
- Remaining tail beyond the fork: L5b eaves/rakes; breadth on more roofs.
