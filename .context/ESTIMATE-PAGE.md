# ESTIMATE-PAGE.md — how `/estimate` is built (reconstruct any part at a snap)

The instant-roof-estimate **money page**: a cinematic 3D roof + WORKFLOW_3 persuasion copy + the live estimator, funneling
to a booked inspection. This doc is the **full parts list + framework map** so any agent can rebuild or recreate any piece
without detective work. Pairs with `Pulse.md`/`STATE.md` (status), `METHOD.md` (verify loop), `ROOF-GEOMETRY-RULES.md`
(the prim engine), and `server/estimate/SIMPLE-SQUARES.md` (the estimator/pricing).

## 0. The page in one breath
Route `/estimate` (lazy, `client/src/App.tsx`). **Partition 1 (BUILT)** = a GSAP-pinned 3D stage: the dressed Crestridge
roof (`RoofHouse`) on the **lit HDR bed** (midday sun + shadows + grass), a pinned demand-question headline, WORKFLOW_3 scroll **text clouds**, and a
**framed estimator** (address → live result swaps in-frame). **Below the fold:** live Google reviews + cost FAQ (single-open **accordion**, `openFaq` state, default collapsed) + the
booking form. **Partition 2 (PLANNED)** = a color visualizer (pick an OC-Duration color → roof tints + spins). SEO/schema
are injected server-side (independent of this heavier React page). Persuasion basis = `~/Downloads/WORKFLOW_3.md`.

## 1. FRAMEWORKS (the reusable machines we compose)
| Framework | What it is | Where |
|---|---|---|
| **tr3 PRIM engine** | analytic roof/house geometry from "prims" (union-of-tents); one call returns roof+walls+creases+labels | `@/lib/tr3/{solver2,caps,siding,walls}` · memory `tr3-prim-rules` · `ROOF-GEOMETRY-RULES.md` |
| **Camera-rig / scrub** | a `progress` ref (0..1) driven by scroll, read each frame in `useFrame` to drive camera (or roof) keyframes | `estimate.tsx` `ScrubRotate`/`CameraRig`; pattern from `inspect.tsx` `CameraRig` (KF[] lerp) |
| **GSAP pin-scrub** | a tall section + a `sticky` stage + `ScrollTrigger {pin, scrub}` → writes the progress ref + a quantized React state (for DOM clouds) | `estimate.tsx` `useEffect`; `gsap` + `gsap/ScrollTrigger` |
| **R3F scene** | React Three Fiber (declarative three.js) + drei helpers | `@react-three/fiber`, `@react-three/drei`, `three` |
| **scene ⟂ skin / lighting BEDS** | the house GEOMETRY is one thing; the LIGHTING is a separate, swappable "bed" — **FLAT albedo** (matching) ↔ **lit HDR** (housetest, **current**) ↔ **storm SkyDome** (inspect). Matched under flat, then **re-lit** (caps held via the `level` prop). | `RoofScene` in `estimate.tsx` (LIT now) |
| **cap brightness-match** | hip/ridge caps brightened toward field tone by a color multiplier. The default `CAP_LEVEL=1.78` (=1.34×1.33, +33% for FLAT readability) **blows out under sun** → `RoofCaps` takes a **`level` prop**; `RoofHouse` passes **1.34** (true field-match, no +33%) for the lit bed | `caps.tsx` `RoofCaps level=` |
| **text-cloud (scrollytelling)** | frosted-GLASS DOM capsules (`bg-[#f4efe6]/40 backdrop-blur-md`) shown by scroll-progress range, rise+fade; words highlight ONE-BY-ONE left→right synced to the cloud's rise (karaoke "reading cursor") | `estimate.tsx` `CLOUDS` + `SweepText` |
| **SEO injection** | server rewrites the SERVED HTML per route (title/desc/canonical/OG + JSON-LD + `<noscript>`) — beats the CSR "neutrino" | `server/seo.ts` `injectSeo` hooked in `server/vite.ts` |
| **estimator data** | address → Google Solar (squares/pitch/facets + $), DSM roof image, Google Places reviews, address autocomplete | `/api/estimate`, `/api/roof-image`, `/api/reviews`, `/api/address-suggestions` |
| **persuasion (WORKFLOW_3)** | headline = the demand question; the CLOUDS now carry **Antonio's own informational copy** (instant/free · living-area≠roof · satellite-measured · exact-on-request · floor-estimate) — superseded the WORKFLOW_3 CONTRADICTION→THREAT→TAKEAWAY spine | copy in `CLOUDS` · `~/Downloads/WORKFLOW_3.md` (original spine) |

## 2. TECH / LIBS
- **App:** React + TypeScript + Vite (Vite root = `client/`), **wouter** (routing), **TanStack Query**, **Tailwind** +
  **shadcn/ui** (`@/components/ui/*` Button/Input/Card/Select…), **lucide-react** icons.
- **3D:** `three`, `@react-three/fiber` (`Canvas`,`useFrame`,`useThree`), `@react-three/drei` (`useTexture`,`Environment`,
  `ContactShadows`,`OrbitControls`,`Html`), **`gsap` + `gsap/ScrollTrigger`**.
- **Fonts** (loaded in `client/index.html`): **Cormorant Garamond** (`DISPLAY`), **JetBrains Mono** (`MONO`), Bricolage
  Grotesque, Inter.
- **Dev/verify:** **Playwright** (+ system Chrome via `channel:'chrome'`) — headless screenshots I `Read` to self-verify 3D
  (see `METHOD.md` → "Playwright = my OWN eyes").

## 3. FILE MAP
**Page + scene**
- `client/src/pages/estimate.tsx` — the page: `RoofScene` (the lighting bed), `ScrubRotate`/`CameraRig`, `CLOUDS`+`SweepText`,
  the estimator frame (form → `ResultCard`), `ReviewsStrip`, the FAQ section, `MVP3ContactForm`. Route added in `client/src/App.tsx`.
- `client/src/components/RoofHouse.tsx` — the **DRESSED house**, extracted byte-exact from `housetest.tsx`. Exports
  `HOUSE` (geometry) + `<RoofHouse tileFt? flat? colorTint?>` (shingle roof + stone-veneer-south / siding-gable walls +
  garage + wrought-iron double-door (`IronDoor`) + ridge/hip caps). `colorTint` tints the shingle for the visualizer; `flat` drops normal/rough maps.
  **Openings (Antonio's layout):** SOUTH = garage + a wrought-iron DOUBLE entry door (`IronDoor` — two arched leaves via `THREE.Shape`+hole, baluster/scroll grille over LIGHT glass, center handles, iron surround + light-stone arched casing; replaced the old wood `Door`, which left `Glass`+`DOOR_WOOD_NSCALE` orphaned) + a **half-moon gable vent** + ONE
  **double-hung on the smaller SW stone-veneer facet** (`[-17,4.6,-33]`, faces −z). All other windows live on the **E/W/N
  eaves** — `DoubleHung` takes a `rotY` (E `-π/2`, W `+π/2`, N `π`) and sits at the footprint edge **minus 1.5** (the eave
  recede): EAST x=24.5 (z −2/14/28), WEST x=−24.5 (z −18/−2/14), NORTH z=36.5 (x 4/18). **`DoubleHung`** = a realistic
  double-hung in Antonio's reference style: satin-**BLACK** frame + sashes (`FRAME_BLACK`) · **1-over-1** (top & bottom pane
  only, no grille) · **reflective glass** (low-roughness, envMap 3.4 → mirrors the sky HDR; base lifted off pure-black so it
  reads as glass) · set in a flat **WHITE** casing (`CASE_WHITE`) with a projecting head-cap cornice · the black window
  recessed via a black jamb-liner reveal + upper-sash-proud meeting rail. **Procedural-over-GLB by design** —
  a window is box+plane geometry either way, so procedural wins: matches our trim/glass tokens, parametrizes to any wall,
  drops into the rotY/recede system, deterministic (GLB stays the right call for ORGANIC assets — grass, etc.).
  `GableVent({position,r})` = semicircle louvers, at `[18,15,-41] r=2.2` (apex≈20.3). Passes `level={1.34}` to `RoofCaps`.
**Prim engine (tr3)** — see `ROOF-GEOMETRY-RULES.md` + memory `tr3-prim-rules`
- `@/lib/tr3/solver2` — `buildCrestridge(wallH)` → `{ roof, boundary, planes, creases, labels, eaveY, heightAt, … }`.
- `@/lib/tr3/caps` (`caps.tsx`) — `RoofCaps`, `buildCapGeoms`, **`CAP_LEVEL = 1.34×1.33 ≈ 1.78`**. Cap-tab photos `/cap-tab1..4.jpg`.
- `@/lib/tr3/siding` — `makeLapSiding` (walls), `makeShakeSiding`+`SHAKE_TILE_FT` (south GABLE shingle accent), `makeBrick`, `SIDING_BOARDS_PER_TILE`, `BRICK_TILE_FT` (procedural canvas textures).
- `@/lib/tr3/walls` — `recedeWalls` (+ `{lo,hi}` yClip to split a stone base / siding gable), `buildFascia`/`buildSoffit`, notch-tongue builders.
**Estimator backend**
- `server/estimate/measure.ts` — `computeMeasurement(address, key)` (Google Solar `buildingInsights`).
- `server/estimate/pricing.ts` — `priceEstimate` / `roofCost` (CloudBid-faithful $). Spec: `server/estimate/SIMPLE-SQUARES.md`.
- `server/routes.ts` — `/api/estimate`, `/api/roof-image`, `/api/reviews`, `/api/address-suggestions`.
- `server/reviews.ts` — 6h-cached Google Places rating/reviews. `server/scripts/roof-sketch.ts` — `renderRoofSketch` (DSM PNG).
**SEO**
- `shared/estimate-seo.ts` — SINGLE SOURCE: `BIZ` facts, `ESTIMATE_FAQ`, `ESTIMATE_SEO`, `roofingContractorLd`/`faqPageLd`/`estimateJsonLd`.
- `server/seo.ts` (`injectSeo`) hooked into `server/vite.ts` (dev `transformIndexHtml` + prod static).
**Reference "lab" pages (copy treatments FROM these — they are the source of truth for looks)**
- `housetest.tsx` — **THE dressed house** (stone veneer + siding gable + garage/windows/door + HDR-midday lighting). `RoofHouse` came from here.
- `shingletest.tsx` — field shingle + the **cap brightness LOCK** (`CAP_BASE 1.34 × CAP_LOCK 1.33`; note: "?lit=1 = still-unbalanced").
- `captest.tsx` — cap geometry/look lab · `veneertest.tsx` — stone-veneer lab · `sidingtest.tsx` — siding · `overhangtest.tsx` — eaves.
- `inspect.tsx` — the pin-scrub + `CameraRig` + storm `SkyDome` reference (older procedural-brick house).

## 4. ASSETS (`client/public/`)
- **Roof field:** `shingle-wewo-tile.jpg` (Weathered Wood tile). **Caps:** `cap-tab1.jpg`…`cap-tab4.jpg`.
- **Stone veneer (south walls):** `veneer-color.jpg` / `veneer-normal.jpg` / `veneer-rough.jpg` (CC0 ambientCG **Bricks078**, tan fieldstone; `veneer95-*` = alt scale).
- **Front door:** `door-wood-color.jpg` / `-normal` / `-rough` (CC0). **HDR sky:** `sky-midday.hdr` (the lit env — **ACTIVE**, the shipping bed).
- **Grass ground:** `grass-color.jpg` / `grass-normal.jpg` / `grass-rough.jpg` (CC0 ambientCG **Grass001**, repeat 72×72 on a 600×600 plane).
- **Siding / brick:** procedural (no file) — base color **Savannah Wicker** `SIDING_HEX = #c2bca6`, used by **lap** (E/W/N walls) AND **shake/shingle** (south gable triangles, `makeShakeSiding`). **Fascia + soffit + window casing + gable vent = ONE charcoal** `FASCIA_COLOR #3b3e42` (`SOFFIT_COLOR = FASCIA_COLOR`; `DoubleHung` casing/cap/sill + `GableVent` use it; `TRIM` token removed). Window frame `FRAME_BLACK #191b1e`. Shake reads **bottom-up** + `offset.y = -(WALLH/SHAKE_TILE_FT[1])` aligns a full course to the gable bottom. **DSM result image + fallback:** `/api/roof-image` live; `sketch-*.png` static.

## 5. KEY CONSTANTS / "MAGIC NUMBERS"
- **Cap brightness — two levels.** `CAP_LEVEL = 1.34 × 1.33 ≈ 1.78` (`caps.tsx`) = the FLAT default: `1.34` levels the
  cap-tab albedo to the field (~102 → ~137 tone), `× CAP_LOCK 1.33` = Antonio's **+33%** over-bright (only readable/needed
  under flat ambient). Under the SUN that +33% **blows out** the cap highlights → `RoofCaps` now takes a **`level` prop` and
  `RoofHouse` passes **`1.34`** (the true field-match, no +33%) so caps track the field under directional light. `/inspect`
  (flat) keeps the `1.78` default. **Rule: pick the cap level for the bed it ships under.**
- **Lighting beds:** **FLAT / uniform ambient — CURRENT (shipping)** = `gl NoToneMapping` + `ambientLight Math.PI` ONLY (no
  directional, no IBL) + `<Environment files="/sky-midday.hdr" background environmentIntensity={0}/>` (the sky HDR is a
  BACKDROP only — `environmentIntensity 0` kills its image-based lighting) + a **grass** ground plane. **Why flat:** the
  **folded** hip/ridge cap tabs catch ANY directional/IBL highlight the flat field misses and **clip to white** under
  NoToneMapping; only fully-uniform light makes caps == field (Antonio: "remove any lighting effects"). There is NO
  color-grade/postprocessing — it was always the lighting. **Trades:** no shadows; the reflective window glass goes flat (no
  sky to mirror). **Surgical alt (if depth wanted back):** restore the directional + IBL but set the ROOF field + cap
  materials `envMapIntensity={0}` (+ no directional on them) so only the roof stays flat-matched while walls/glass keep IBL.
  **LIT (parked)** = `ambientLight 2.0` + soft white directional `[30,60,-28]` + full HDR IBL — deeper/prettier, reintroduces
  the blowout. **STORM (inspect)** = ACES 1.25 + `SkyDome` + fog + hemi/2-dir + GROUND_TEX.
- **House center / orbit pivot = `(4, -22)`**, lookAt `(4, 7, -22)` (housetest's center). **`WALLH = 9`** (stone below the eave / siding gable above).
- **Camera action** (`CameraRig` in `estimate.tsx`, scroll-driven, **house static**) — **ONE continuous spiral, NO per-phase
  halts** (this was the fix for the visible "breaks"): `θ = FRONT + flatEase(p)·TURNS·360°`, where **`flatEase`** = a
  trapezoidal-velocity ease (smooth ramp-IN over the first ~14% + settle-OUT over the last ~12% + **constant velocity in the
  middle**) → the motion only eases at p=0 / p=1, **never mid-journey**. `R`/`H`/`lookY` morph independently via `smooth`
  (smoothstep) `track()`s, so radius/height changes don't stall the rotation. **`FRONT=-62°`** = the top-front anchor (garage +
  main entrance, slightly angled). Reads as: **high top-front helicopter** (`R_HELI=76,H_HELI=92`, ~48°, roof fills >⅓ both
  planes, "across-the-street" feel) → descend → **360° CLOSE** (`R1=50,H1=24`, roof/cap detail) → spiral out → **360°
  ELEVATION** (`R2=78,H2=14`, whole side / full front elevation) → **settle back on the front**. `TURNS=2`; P1 = `h-[500vh]`.
  All consts tunable at the top of the file. **Add-ons (in `CameraRig`'s `useFrame`):** #1 ease-to-settle (free via `flatEase`)
  · #2 **idle hover-sway** (`sin` yaw+bob × `idle=1-smooth(p/0.04)` → fades on scroll, no jump) · #3 **FOV-punch on descent**
  (`fov 40→47→40` over p∈[0,0.2]). TODO #4 = camera lock-on when the address result lands. **Continuity rule:** to add phases,
  keep ONE monotonic `flatEase` sweep + morph R/H/look with `track()` — never ease each phase to zero (that's what caused the halts).

## 6. RECIPES (recreate parts at a snap)
- **Re-extract the dressed house from a lab page** (byte-exact, zero transcription drift): Python-slice the lab page's
  geometry block + `House` component → `RoofHouse.tsx`; transform `function House(` → `export function RoofHouse(`, export
  `HOUSE`, inject `color={colorTint}` on the field `meshStandardMaterial`s. (This session used `python3 - <<'PY'` with line-range asserts.)
- **Swap the lighting bed:** edit `RoofScene` — LIT (current, housetest) ↔ FLAT (albedo, for matching) ↔ STORM. **Always re-check the caps after any lit change** (and pass the right `level` to `RoofCaps` for that bed).
- **Add/edit a cloud beat:** push to `CLOUDS` = `{ r:[start,end], tag, body }` (PLAIN text now — no `**`; `SweepText` highlights words one-by-one left→right as the cloud's `t` 0→1, mapped to the visible window via `(t-0.1)/0.8`).
- **Tune the cap match:** `CAP_LEVEL` in `caps.tsx` — but only under the SAME bed it will ship under.
- **Self-verify visually:** write `shoot.mjs` IN the project dir → `chromium.launch({channel:'chrome',headless:true})` → `goto` localhost
  → `waitForTimeout(~4s)` (WebGL+textures) → scroll / fill / click → `screenshot('/tmp/x.png')` → `Read` it. (`METHOD.md`)

## 7. REFERENCES
- **`~/Downloads/WORKFLOW_3.md`** — the persuasion/attention spec (THREAT/STATUS/CONTRADICTION/IRONY; the honesty floor).
- `.context/`: `Pulse.md` (narrative), `STATE.md`/`PLAN.md` (status + dead-ends), `METHOD.md` (verify loop + Playwright eyes),
  `ROOF-GEOMETRY-RULES.md` (+ `ROOF-STRAYS.md`) — the prim engine rules.
- `server/estimate/SIMPLE-SQUARES.md` — the free-tier estimator + pricing spec.
- Memories: `tr3-prim-rules`, `tr3-render-engine`, `roof-3d-data-pipeline`, `roof-estimator`, `roof-report-pricing`.
- CC0 **ambientCG** (Bricks078 veneer, door wood, sky-midday HDR); **Pudding.cool** (scrollytelling text-cloud pattern).

## CONVERSION FUNNEL (v1, BUILT 2026-06-15)
On the result card (`estimate.tsx`): a deterministic no-PII **quote code** `quoteCode(address)` → `SR-XXXXX` (the 5%-off
token + the lead-lookup key — same address ⇒ same code) + a **"Save 5% when you book online"** disclaimer + **2 CTAs** →
`QuoteModal`. **Lock in your 5%** → choice: *agent call me today* (minimal phone/email capture) **or** *schedule* → scrolls
to `MVP3ContactForm` **prefilled (address) + service LOCKED** to `lock-in-discount` (new Select option + `prefill`/`lockService`
props — home page passes none, unchanged). **Got a question?** → capture + question. Both POST **`/api/quote-lead`** →
`emailService.sendQuoteLead` (SendGrid → Antonio's inbox). **NO DB** — `server/storage.ts` is `MemStorage` (in-memory); the
email IS the fetch. Site **chrome** = `SiteHeader` (logo/Home/phone) + `SiteFooter` (NAP/license from `BIZ`). Decisions:
minimal inline · email-to-inbox · manual text-back · lock-in v1 = the 5% only. **v2:** wire the *already-written* Postgres
schema (`shared/schema.ts`) to a real DB → fetch via the existing `/admin` page + conversion analytics; optional Twilio SMS.

## FUTURE — dual estimate (Solar + on-site LiDAR redundancy)  [investigated 2026-06-15, NOT built]
**Idea:** a second, *measured* estimate beside Solar — Solar instant+national; **LiDAR** (OK-only, measured) streams in async.
**Kill-test (3 OKC roofs vs EagleView, via cached `lidar/dump_*.pkl`):**
- **Squares from LiDAR are accurate** — un-buffer the footprint (`foot_wkt.buffer(-0.8)`, undo the +0.8 m overhang): Crest **43.2 vs EV 43.5 (−0.7%)**. Pitch = median facet pitch (Crest 7.8/12).
- **The facet-count interior approximation does NOT transfer to LiDAR** (+20 / −11 / +40% — LiDAR over-segments facets vs Google, and 3 heterogeneous roofs can't fit a stable facet→interior law). **Don't approximate for LiDAR.**
- **The DIRECT takeoff is the path** — `skel_fp.py` measures ridge/hip/valley: Crest **+1%/0%/+8%** (nailed); 2 known tails (Hinkle hip −25%, Lee gable). So Solar = approximate the interior; LiDAR = measure it → they **bracket truth**.
**Latency (timed):** WARM (dump cached) = **0.6 s**; COLD (new address) = **~30–60 s** (the point-cloud fetch dominates; the **65 KB** dump caches forever — roofs don't change).
**On-site logistics (the plan):** `POST /api/estimate` (Solar) returns instant → Estimate A. NEW `POST /api/lidar-estimate` runs in parallel, UI shows "measuring…", streams in Estimate B. Node **spawns Python** (`skel_fp.py <slug>` if dump cached = 0.6 s, else `engine.py <address>` cold = 30–60 s, then **cache the dump**). Cache by address.
**Caveats before building:** PDAL is a heavy C++ server dep → **containerize a small Python service** for prod · OK-only (the EPT tile) · 2 engine tails → label **"beta," gate on confidence** · throttle concurrency.
**To build (LiDAR "Stage 5"):** fold `skel_fp.py` into `engine.py` as one `address → {squares,pitch,ridge,hip,valley}` call + a `--json` flag; add `POST /api/lidar-estimate` (spawn + 24h cache); client fires it beside Solar + streams Estimate B. Test on the 3 cached roofs (0.6 s) + one cold OK address. See `lidar/HANDOFF.md` + `lidar/PLAN.md`.
