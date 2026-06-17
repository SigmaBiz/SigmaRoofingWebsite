# STATE.md — Sigma Roofing Website

Last updated: 2026-06-17

> **Read [Pulse.md](Pulse.md) FIRST.** It carries the *narrative* — what we're doing and **why** (the pulse). This
> file is the granular status that hangs off that narrative; it is not a substitute for it.

---

## ⚙️ STANDING OPERATIONAL RULE — live reload (Antonio, 2026-06-06)
**Keep the dev server running so every code edit is shown LIVE on localhost immediately.** The dev server is
`npm run dev` (`tsx server/index.ts`, Vite HMR, **http://localhost:3000**). Vite hot-reloads on every save, so any
edit appears on the page without a manual build. **Each session / before editing:** verify it's up
(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`); if it's down (`000`), restart it in the
background (`npm run dev &`) and poll until `200`. Antonio should never have to run anything to see a change.

---

## 🧮 ROOF ESTIMATOR — instant measurement + ballpark price (NEW · ACTIVE, 2026-06-13)

**What:** address → instant roof report (squares · predominant pitch · facet count · $ ballpark) on the site, funneling to a booked inspection. Cheap EagleView/Xactimate via **Google Solar API `buildingInsights`**. Spec: `~/Downloads/roof-estimator-spec.md`. Plan + methodology (kill-tests / pivot triggers / banned moves): the approved plan file. See also memory `roof-estimator.md` + `roof-3d-data-pipeline.md`.

**KILL-TEST PASSED → GO (2026-06-13).** Two independent impls — `server/scripts/solar-blitz.ts` (oracle) and the production `server/estimate/measure.ts` — agree vs the EagleView truth for 19428 Crestridge Dr: area **44.6 vs 43.5 sq (+2.4%)** ✅ · pitch **8/12 exact** ✅ · facets **12 exact** ✅ · imagery **HIGH 2023-01-27** · confidence **0.98 HIGH**. H₀ (Solar good enough without buying EagleView) corroborated; n=1, the hard 12-facet hip-valley case. **Core engineering risk retired.**

**Built + verified this session:**
- `server/scripts/solar-blitz.ts` — the kill-test / independent oracle (diff table vs ground truth).
- `server/estimate/measure.ts` — geocode + buildingInsights + `computeMeasurement` + confidence scoring.
- `server/estimate/pricing.ts` — **faithful CloudBid V14 model** (REBUILT 2026-06-15): `roofCost(geom)` = exact per-item
  `CEILING(qty_raw×(1+waste))` + the Estimate-sheet assembly `(mat×1.38625 + lab×1.30)×1.10` [30% markups + 8.625% OK tax +
  10% O&P, **HIGH-profile cap** locked w/ Antonio]; `priceEstimate(measurement)` = free tier (facet→linear, calls `roofCost`).
  **Reconciled: Lee actual-geom $12,394 vs CloudBid $12,095.99 (≤2.5%).** `CONFIG` = Antonio-tunable $ (not logic). Spec: `SIMPLE-SQUARES.md §4`.
- `server/scripts/estimate-check.ts` — runs the core like the route does (Crestridge ≈ **$19.5k–$23.75k**; Lee ~$12.75k · Hinkle ~$15k · 2,200 sf ~$11.25–11.75k).
- `POST /api/estimate` in `server/routes.ts` — cache(24h, normalized addr) → measurement + pricing; soft-fail (NO_BUILDING/GEOCODE_ZERO) → `measured:false` inspection branch; hard errors → 5xx.
- **`GET /api/roof-image?address=` (BUILT 2026-06-15)** — DSM facet-map PNG via `renderRoofSketch` (refactored out of `server/scripts/roof-sketch.ts`; `main()` guarded so importing it server-side doesn't fire the CLI batch — **⚠ MODEL-ERROR (found+fixed 2026-06-17): the original `import.meta.url===argv[1]` guard was BROKEN in the prod esbuild bundle** [`routes.ts` imports `renderRoofSketch`, so esbuild bundles roof-sketch into `dist/index.js`, where `import.meta.url` resolves to `dist/index.js` = `argv[1]` → guard PASSED → the 4-address R&D `main()` batch ran on EVERY prod boot: 4 paid Solar Data-Layers calls (~$0.30) + `process.exit(1)` crash-loop on a missing key = the `GOOGLE_API_KEY missing` deploy crash Antonio hit]. **FIXED `1d37c1c`** (SHIPPED: PR #2 → `main` `cc265fc`, Railway auto-deploying 2026-06-17): gate on the entry **basename** (`=== "roof-sketch"`) → fires only as a real CLI, never bundled; verified entry=index→suppressed, entry=roof-sketch→fires, build green). 24h in-memory cache; 404 on failure (card falls back to a default sketch).
- **`/estimate` page (BUILT 2026-06-15)** — `client/src/pages/estimate.tsx` + lazy route in `App.tsx`. Hero answers the "2,200 sq ft" query → address autocomplete (`/api/address-suggestions` + OK-city fallbacks) + material chips (architectural exact; metal/premium = flagged rough ×) → `POST /api/estimate` → **sticky result card** (squares/pitch/facets/perimeter + $ range + DSM image) with **2,200-sf default state** (605 NW 115th sketch), soft-fail→inspection + error branches, embedded `MVP3ContactForm` (#contact) booking CTA. CSS-`sticky` pin (ζ: Z₂ vs GSAP Z₁); production navy/shadcn (harmonizes w/ the embedded form), theme-token-driven so a global reskin carries it. **Verified on localhost:** page 200, `estimate.tsx` Vite-transforms clean, Crestridge → 44.6 sq / $19.5–23.75k / image 253×308 cached 0 ms.
- **`/estimate` Phase-2 SEO (BUILT 2026-06-15)** — `server/seo.ts` `injectSeo()` hooked into `server/vite.ts` (dev `transformIndexHtml` + prod static) rewrites the served `/estimate` HTML: per-route title/desc/canonical/OG + **`FAQPage` (6 cost Q&As) + `RoofingContractor`/`LocalBusiness` JSON-LD** (NAP, LIC#80006734, 12 cities, @sigmaroofing405) + `<noscript>` answer mirror — so schema+copy ship in the HTML Google fetches (CSR-SPA "neutrino" killed). Single source `shared/estimate-seo.ts` drives schema AND the page's visible FAQ + trust line (E-E-A-T facts pulled from the live home page footer/about). Home `/` passes through untouched. **Verified:** 2 valid JSON-LD blocks parse in served HTML. **↳ Q&A REWRITTEN + SHIPPED 2026-06-17 (PR #3 → `main` `1b101f3`):** all 6 Q&As → Antonio's consultative copy (timeline / when-to-replace / what's-included / hail-wind / is-it-a-quote); spelling/punct/spacing cleaned, usage+grammar left as written; ⚠ dropped the 2 cost-keyword Q&As (H1+intro still carry it). Result-card footnote removed (the `© OpenStreetMap (ODbL)` credit was FALSE — the gold outline is Google `buildingInsights.boundingBox`, `routes.ts:1569`, not OSM). Pricing left as-is: card range = flat ±10% band (`rangeBandPct:0.10`, $250-round) around the CloudBid point (`roofCost().total`; 6320 N Warren = $12,650); facet→interior-LF = lossy proxy, only **9.5% cost leverage** (±50% LF → −4/+6%) — rigorous path = footprint straight-skeleton (parked).
- **`/estimate` live review rating (BUILT 2026-06-15)** — NEW `server/reviews.ts` (Google Places fetch + 6h cache: `getCachedReviews` sync for the SEO injector, `getReviews` async for the endpoint, warmed on boot in `server/index.ts`); `/api/reviews` refactored to use it (was 2 Places calls EVERY hit — cost leak fixed). `shared/estimate-seo.ts` `roofingContractorLd(rating?)` adds `aggregateRating` + ≤3 `Review` when a rating is passed; `server/seo.ts` builds the LD per-request with `getCachedReviews()`. Visible **reviews strip** on `/estimate` (`ReviewsStrip` in `estimate.tsx`) backs it (parity). **Verified live: real Google 4.8★/26 in the served schema + 3 Review objects; 2nd `/api/reviews` hit cached (0.8ms).** ⏳ later: optional full SSR. ⚠ home `testimonials.tsx` still hardcodes "5.0★" (real = 4.8).
- **`/estimate` v2 "STORYBOARD" redesign — Phase A BUILT (2026-06-15)** — modeled on `/inspect` + the WORKFLOW_3 persuasion spine (`~/Downloads/WORKFLOW_3.md`). NEW `client/src/components/RoofHouse.tsx` = the Crestridge roof scene extracted byte-exact from `/inspect` (exports `HOUSE` + `<RoofHouse colorTint?>`; 3 shingle materials wired to `colorTint` for the future visualizer). `estimate.tsx` rebuilt into **Partition 1 — THE ESTIMATOR**: pinned demand-question headline + the roof **rotating on GSAP scrub** (one 360°/partition, pivoted at footprint centroid) + **WORKFLOW_3 text clouds** (CONTRADICTION "2,200 sq ft = floor not roof" → THREAT "a guess = someone else picks your number" → TAKEAWAY "we measure your real roof", Pudding-rise + `HiText` highlights) + a **framed estimator** (address → results swap in-frame). **Architectural shingle only** (metal/premium dropped). WebGL fallback = CSS-gradient bed (form still works). Live reviews + cost FAQ + `MVP3ContactForm` preserved below; **server SEO untouched** (verified: title + 2 JSON-LD + aggregateRating still in served HTML). **tsc clean; both modules Vite-compile 200.** **VISUALLY VERIFIED via Playwright (I have eyes now — see METHOD.md):** first pass was zoomed into bare shingles w/ flat navy grading + no walls/doors → FIXED, then **RE-MATCHED to the canonical `/housetest`** (Antonio's LATEST dressed house — NOT the older brick `/inspect`): `RoofHouse` **re-extracted byte-exact from `housetest.tsx`** — **tan CC0-078 stone VENEER on the south walls below the eave + lap-siding gable triangle above + 2-car garage + gable windows + a detailed wood front door** (assets: `/veneer-*.jpg`, `/door-wood-*.jpg`, `/shingle-wewo-tile.jpg`, `/sky-midday.hdr`; `colorTint` still wired for the visualizer). `RoofScene` is now STRIPPED to a **FLAT albedo bed** (NoToneMapping + `ambientLight Math.PI` only, bg `#808080`; **no directional / HDR / shadows**; `RoofHouse flat` drops the veneer/door normal+rough maps) so the **roof + hip/ridge CAPS MATCH first** — `CAP_LEVEL = 1.34×1.33 ≈ 1.78` (`caps.tsx`; the **"33%" = `CAP_LOCK`**, an over-bright color multiplier on the cap-tab albedo lifting ~102→~137 field tone) was LOCKED under flat; the lit HDR drifts it (shingletest note: "?lit=1 = still-unbalanced"). **Playwright-verified: caps blend into the field under flat.** The housetest lit bed was PARKED to re-add AFTER the match was confirmed — Antonio's call: **match first, effects later.** ✅ **NOW RE-ADDED (see the visuals/re-light bullet below).**
- **`/estimate` CAMERA ACTION (BUILT 2026-06-15, 2 cycles, CONTINUOUS)** — scroll-driven `CameraRig` (house static) as **ONE continuous spiral — no per-phase halts** (fixed the visible "breaks": the old per-phase `ease()` zeroed velocity at every boundary). `θ=FRONT+flatEase(p)·2·360°` where `flatEase` = constant-velocity middle + smooth ramp-in/settle-out (eases only at p=0/p=1); `R`/`H`/`lookY` morph via smoothstep `track()`s. **`FRONT=-62°`** = top-front anchor (garage+entrance, slightly angled). High **top-front helicopter** `R_HELI=76/H_HELI=92` (~48°, roof fills >⅓, "across-the-street") → descend → 360° **CLOSE** `R1=50/H1=24` (roof/cap detail) → spiral out → 360° **ELEVATION** `R2=78/H2=14` (whole front side) → settle on the front. P1=`h-[500vh]`. Playwright-verified (helicopter lands; descent flows; both cycles). Tunable consts at top of `estimate.tsx`. **Add-ons IN (2026-06-15):** #1 ease-to-settle (free via `flatEase` settle-out) · #2 **idle hover-sway** (`sin`-based yaw+bob × `idle=1-smooth(p/0.04)` → fades the instant you scroll, no jump; verified animating) · #3 **FOV-punch on the descent** (`40→47→40` over p∈[0,0.2], a "whoosh"). ⏳ remaining: #4 camera lock-on when the address result lands. Scene now **RE-LIT** (see the visuals/re-light bullet below).
- **`/estimate` CONVERSION FUNNEL v1 (BUILT 2026-06-15)** — result card now shows a deterministic **quote code** (`quoteCode(address)` → `SR-XXXXX`, no-PII; the 5%-off token + lead key) + **"Save 5% when you book online"** disclaimer + **2 CTAs**: **Lock in your 5%** + **Got a question?** → a `QuoteModal`. Lock-in → choice: *agent call me today* (minimal phone/email capture) **or** *schedule* → scrolls to the home `MVP3ContactForm` **prefilled (address) + service LOCKED to "lock-in-discount"** (new Select option + `prefill`/`lockService` props; **home usage unchanged**). Got-a-question → capture + question. All → **NEW `POST /api/quote-lead`** → `emailService.sendQuoteLead` (SendGrid → Antonio's inbox; **NO DB** — `MemStorage` is in-memory, so email IS the fetch) **+ a branded `sendCustomerConfirmation`** to the CUSTOMER (only if they gave an email): "Hi, nice to meet you!" (no name) · code · "architectural shingle **re-roof**" · 5% · NAP (16612 N Western Ave). Capture requires **First Name** ("what do you go by?") **+ phone OR email**. (Customer's *scheduled-appointment* email still comes from **Calendly**, configured in the Calendly account — not our code.) + site **chrome** (`SiteHeader` logo/Home/phone · `SiteFooter` NAP/license from `BIZ`). **Playwright-verified end-to-end** (estimate → code+CTAs → lock-in modal → call/schedule paths; schedule prefilled+locked); home 200 + /estimate SEO (2 JSON-LD + aggregateRating) intact; tsc clean. **Decisions (Antonio):** minimal inline · email-to-inbox · manual text-back · lock-in v1 = the 5% only (focus = rank the page). **(2026-06-15 fixes)** added a **First Name** capture field ("what do you go by?"). ✅ **SENDGRID FIXED (2026-06-15):** was `401` (dead key) → Antonio rotated to a fresh key; then `403` (sender mismatch) → the account has **`admin@oksigma.com`** verified (NOT aescalante@), so `email-service.ts` now sends FROM **`FROM_EMAIL`** (`= process.env.SENDGRID_FROM_EMAIL || "admin@oksigma.com"`). **Live test ✅ `Quote-lead email sent`** — and the same `from` fix repaired the **main `/api/contact` lead form too** (it had been silently 403-dropping). Leads land at `NOTIFICATION_EMAIL` = aescalante@oksigma.com. (`oksigma.com` domain-auth is `valid=false` — single-sender is enough; full domain auth = later DNS task.) **Mitigation (BUILT): `server/leads.ts` `logQuoteLead` writes every lead to `data/quote-leads.jsonl` BEFORE the email attempt** → leads are NEVER lost even with email down (`cat data/quote-leads.jsonl` = the v1 fetch; `data/` gitignored = PII). ⏳ **v2:** persist (wire the ready Postgres schema → `/admin`) + conversion analytics + (optional) Twilio SMS. **Recommended add-ons (Antonio's go):** ease-to-settle on the curb beauty frame · idle drift at p=0 · FOV punch on drop-in · camera lock-on when the address result lands · (post-relight) sun-rake + "measurement scan" overlay.
- **`.context/ESTIMATE-PAGE.md` (NEW 2026-06-15)** — the full build/reconstruct reference for `/estimate`: frameworks (tr3 prim · camera-rig/scrub · GSAP pin-scrub · R3F · scene⟂skin lighting beds · cap-match · text-cloud · SEO injection), tech/libs, file map, assets, magic numbers, recreate-recipes, references. **Read it before touching the page.** Roof spins around housetest's center **`(4,-22)`**; camera `[44,22,-52]`→lookAt`(4,7,-22)` = its curb 3/4 view; top scrim added for headline contrast over the bright sky. **Playwright-verified:** gable siding+window+tan stone+garage all render in midday light; scrub does one full 360° (mid-scroll = back side); end-to-end 19428 Crestridge → result swaps in-frame (DSM + 44.6 sq/8·12/12 + $19.5–23.75k). ⚠ `RoofHouse` no longer exports `SkyDome`/`GROUND_TEX` (estimate switched to `Environment`). ⏳ **Phase B:** P2 color visualizer (per-color shingle tint + one 360° spin per pick) + migrate `/inspect` onto `RoofHouse`. Optional polish: result-card is tall.
- **`/estimate` RE-LIGHT + VISUALS PASS (BUILT 2026-06-15)** — the match was confirmed under flat, so the scene **moved onto the lit `/housetest` bed**: `RoofScene` = `gl NoToneMapping` + `ambientLight 2.0` + 1 warm directional `[30,60,-28]` (castShadow, 2048 map) + `<Environment files="/sky-midday.hdr" background/>` + a NEW `Ground` **grass** plane (ambientCG **Grass001** → `grass-{color,normal,rough}.jpg`, repeat 72×72, 600×600 at the house center). `RoofHouse` rendered NOT-`flat` (veneer/door normal+rough maps back). **CAP over-bright FIXED the right way:** Antonio flagged the hip/ridge caps as "too highlighted/too bright in parts" under the sun — that's the **+33% `CAP_LOCK`** amplifying the directional highlight. `RoofCaps` now takes a **`level` prop** (default `CAP_LEVEL=1.78`, kept for `/inspect`'s flat bed); `RoofHouse` passes **`level={1.34}`** = the TRUE field-match (drops the +33%) → caps track the field under directional light (Playwright-verified from overhead + on grazed slopes — no blowout). **OPENINGS REWORKED to Antonio's spec:** removed ALL south windows (the 2 I'd added flanking the door + the old SW gable window); footprint mapped via `buildCrestridge(9).boundary` → windows now on the **E/W/N eaves ONLY** — `Window` got a **`rotY`** prop (EAST x=24.5 `rotY=-π/2`, z −2/14/28; WEST x=−24.5 `rotY=+π/2`, z −18/−2/14; NORTH z=36.5 `rotY=π`, x 4/18), each recessed footprint−1.5 (all three long walls verified EAVES, Δheight 0.2) so it sits on the wall plane. **`GableVent` is now a HALF-MOON** (semicircle louvers clipped to the chord + curved trim ring + flat sill) raised to `[18,15,-41] r=2.2`, near the garage gable apex (≈20.3, centered on x=18). **Then UPGRADED every window to a realistic DOUBLE-HUNG** (`DoubleHung` replaces the old single-pane `Window`): two depth-offset sashes (upper outer/proud, lower inner/set-back) whose join reads as a real **meeting rail**, a **2-over-2 colonial grille**, recessed reflective glass over a dark interior backer, brickmould casing + sloped sill (horns) + drip cap — all built proud of the wall, `rotY` to face out. **Chose procedural over a CC0 GLB deliberately** (a window is box+plane geometry either way; procedural matches our trim/glass tokens + the rotY/recede system + stays deterministic — the Z₂ call; GLB stays right for organic assets like grass). Also added **one double-hung on the south SW stone-veneer facet** (`[-17,4.6,-33]`, the proven old-SW-window z; faces −z) per Antonio. South side now = garage + entrance (casing+crown) + half-moon vent + the SW double-hung. **tsc clean on touched files; Playwright-verified the double-hung anatomy (g-anat) + all elevations incl. the SW stone unit (g-right) + caps.** **Then RESTYLED `DoubleHung` to Antonio's reference photo (2026-06-15):** satin-**BLACK** frame + sashes (`FRAME_BLACK = #191b1e`), **1-over-1** (top & bottom pane only — grille removed), **reflective glass** (`#28333d` metalness 0.5 / roughness 0.022 / envMapIntensity 3.4 → mirrors the sky HDR; base lifted off pure-black so it reads as glass not a hole), recessed behind a flat **WHITE** casing (`CASE_WHITE = #f4f2ec`) with a projecting head-cap cornice + a black jamb-liner reveal. The old greige-brickmould / white-sash / 2-over-2-grille look is gone; applies to all 9 windows. (Going full mirror — reflecting the actual scene, not just the sky HDR — would need a CubeCamera reflection probe; parked as an option.) Playwright-verified (g-anat = black frame/white casing/1-over-1; reflective sheen angle-dependent). **EXTERIOR PALETTE set (2026-06-15):** siding = CertainTeed **Savannah Wicker** (`makeLapSiding("#c2bca6")` — khaki-greige; albedo cooled vs the raw swatch to offset the warm sun) on all siding (E/W/N walls + south gable triangles); **fascia + soffit = CHARCOAL** (`FASCIA_COLOR="#3b3e42"`, `SOFFIT_COLOR="#34373b"` — soffit a hair darker). South stone veneer + grey shingle + black windows + white casing unchanged → cohesive tan/charcoal/black palette (Playwright-verified s2-clip/s2-south). **Then (2026-06-15) two more:** (1) **window casings → CHARCOAL** — `DoubleHung` casing/cap/sill now use `FASCIA_COLOR` (not white; `CASE_WHITE` token removed) so the window trim matches the fascia (black frame + charcoal casing). (2) **South GABLE triangles → SHAKE/shingle siding** — new `makeShakeSiding` + `SHAKE_TILE_FT` in `siding.ts` (staggered cedar-shake courses, vertical grain, keyway gaps, butt-shadow lines; tiles seamlessly via column-keyed RNG; world-ft UV), applied to `GABLE_SIDING` only — **SAME** Savannah Wicker color (`SIDING_HEX = "#c2bca6"`, now shared by lap + shake). E/W/N walls keep lap siding; south lower walls keep stone. Playwright-verified (k-gable = shake reads; k-win = charcoal casing). **Then refined (2026-06-15, shake only — lap untouched):** (a) shake relief **INVERTED to read BOTTOM-UP** (proud lit butt at each course's bottom + recessed top; it was lit-top/dark-bottom → read as top-down install); (b) shake `t.offset.y = -(WALLH / SHAKE_TILE_FT[1])` aligns a **course boundary to the gable bottom (y=9)** so the bottom course is FULL (was a ~⅓ sliver because the gable starts mid-tile); (c) **gable vent + soffit recolored to `FASCIA_COLOR`** (vent was white `TRIM`; soffit was a hair darker `#34373b` → now `SOFFIT_COLOR = FASCIA_COLOR`). `TRIM` token removed (was only the vent). **Fascia + soffit + window casing + gable vent are now ALL the one charcoal `#3b3e42`.** Playwright-verified (n2-gable = uniform bottom-up courses + charcoal vent; m-eave = charcoal soffit). **Then (2026-06-15) CAP-BLOWOUT fix:** the hip/ridge caps were clipping to white under the lit bed — and there is **NO color-grade/correction to remove** (verified: `gl NoToneMapping`, no `EffectComposer`/Bloom/postprocessing, no LUT; materials carry only albedo). Cause: the **folded** cap tabs catch the strong **directional** on their sun-facing folds and clip under `NoToneMapping`, while the flatter field + the matte caps' (roughly uniform) HDR diffuse don't → only the hard sun differentiated them. Fix = tame the directional only: **intensity `1.35 → 0.5`, color `#fff3df → #ffffff`** (warm tint removed). Caps better but Antonio said SOME segments still blew → **RESOLVED by going fully FLAT (2026-06-15):** removed the directional ENTIRELY + killed the HDR IBL (`<Environment background environmentIntensity={0}/>` keeps the sky as a backdrop only) + uniform `ambientLight Math.PI`. Roof field + caps share one albedo under uniform light ⇒ caps **== field exactly**, no blown segments (Playwright flat-cap/flat-heli/flat-south). **Trades:** no shadows + the reflective window glass goes flat (IBL off = no sky to mirror). The **LIT bed is parked** (`STATE`/`ESTIMATE-PAGE`); swap back if depth+glass-reflections are wanted over a perfect cap-match, or do the **surgical mix** (roof field+cap materials `envMapIntensity={0}` + no directional on the roof → roof stays flat-matched while walls/glass keep IBL). **Then (2026-06-15) ENTRY DOOR REPLACED:** wood `Door` → **`IronDoor`** = a wrought-iron DOUBLE entry door per Antonio's reference photo: two black arched leaves (each a `THREE.Shape` rect+arched-top with the glass opening as a HOLE, extruded), a grille of twisted **balusters** (cylinder + knuckle spheres) + **scroll curls** (partial torus) over **LIGHT** glass (`#b7c2cb` so it reads bright under flat light), center pull handles, a black-iron surround (jambs/sill + arched-crescent header) + a light-stone arched **casing** (`#d6d0c2`). At `[-3.5,0,-21.5]`, ~5.4 ft wide. **Playwright-verified (door-zoom):** reads like the reference (arched double leaves + glass + grille + handles + stone casing); scrollwork is a procedural approximation, not pixel-exact. The old `Glass` component + `DOOR_WOOD_NSCALE` are now orphaned dead-code (`noUnusedLocals` off, so no tsc error). NOTE: the recessed entry is hard to frame from the wide page camera (best visible ~scroll 3300). **Then (2026-06-15) TEXT CLOUDS replaced:** the 5 WORKFLOW_3 clouds → **Antonio's 5 informational clouds** (instant/free · living-area≠roof · satellite-measured · exact-on-request · floor-estimate; obvious typos fixed — "a a", "requrest", "Exact Estimate are"). `HiText` (static `**phrase**`) → **`SweepText`** = a karaoke "reading cursor": highlights ONE word at a time left→right synced to each cloud's rise (`s = clamp01((t-0.1)/0.8)`, active word = `floor(s × N)`). Cloud font → 19px + box → 37rem for the longer copy. `HiText` now orphaned. Playwright-verified (sw1→sw3 = highlight sweeps "the"→"an"→"obligation!" as cloud #1 rises+fades; sw5 = the long floor-estimate cloud fits 4 lines). **Then (2026-06-15) COPY/UX pass:** (a) headline subtext → "Our Free Estimator gives you the figures in seconds!"; (b) **text-cloud divs now GLASS** (`bg-[#f4efe6]/40 backdrop-blur-md` + `ring-inset ring-white/15` + `border-white/30` — frosted, the roof shows through, dark text still reads); (c) result-card label "Estimated reroof (…full tear-off)" → "**Estimate — Owens Corning Duration Architectural System**"; (d) FAQ heading → "**Q&A — You may be wondering…**" and the FAQ is now a **single-open ACCORDION** (`openFaq` state; each question is a `<button>` toggling its answer; `+`→`×` on open; default ALL COLLAPSED = compact/clean). FAQPage JSON-LD unaffected (server-side, still all Q&As). Playwright-verified (u-cloud = frosted glass; u-faq1 collapsed / u-faq2 one expanded). **Then (2026-06-15) P1 GLASS pass (exploration, awaiting Antonio's pick):** NO white div on P1 anymore — (a) text-cloud divs → **fully transparent** (`bg-white/8 backdrop-blur-lg`, WHITE text + `textShadow` for legibility, gold tag); (b) estimator **address-box card** + the **result card** → **frosted glass** (`bg-[#f4efe6]/45 backdrop-blur-xl` + ring; dark text kept — reads on the light frost); the address `Input` → `bg-white/45` glass, the autocomplete dropdown → `bg-[#f4efe6]/90` frosted, the result-card metric cells (`Metric`) → `bg-white/15` + grid `bg-white/10`. So clouds = fully see-through (white text) vs form/result = frosted (dark text) — DELIBERATELY two looks for Antonio to compare. Playwright-verified (g-cloud transparent, g-form glass address box, g-result glass result card). **RESOLVED (2026-06-15) — Antonio: "use the right contrast, make the text legible":** the mid-tone frosted-CREAM cards (cream over green grass = muddy olive) couldn't give light-grey secondary text enough contrast, so the address-box + result card flipped to **DARK NAVY GLASS** (`bg-[#0d1626]/60 backdrop-blur-xl`) + **LIGHT text** — high contrast, STILL translucent (roof shows through), and now unified with the white-text clouds + the page's navy theme. Every secondary label/caption/value/trust-line/disclaimer → `text-white/55–90`; values/$ → white + bright gold (`hsl(43,85%,62%)`); Save-5% box → `text-amber-100`; metric cells `bg-white/[0.07]`; the input + autocomplete dropdown → dark glass + white text; the `Got a question?` / `Try another` outline buttons → light outline (`border-white/40 bg-white/5 text-white`). **NO white/light div anywhere on P1.** Playwright-verified (c-result + c-form2 — all legible). **Then (2026-06-15) LAUNCH PREP** (Antonio's "what's needed to get Google to show this + is the SEO in the plan?"): the **BLOCKER = it's all on `design-reskin`/localhost; oksigma.com is still the OLD site** (Google shows only live pages → SHIP IT first). Built the discovery pieces: real **`/robots.txt` + `/sitemap.xml`** (`server/routes.ts`, registered before the SPA catch-all — verified serving on a throwaway `PORT=3001` instance; the existing `sitemap.tsx` is a HUMAN page, not crawlable XML, left as-is) + a gold **"Instant Estimate" nav link → `/estimate`** (`header.tsx` desktop+mobile — was an orphan route; Playwright-verified). On-page SEO was already done (Phase 2). **Remaining = Antonio's moves:** deploy the branch, Google Search Console (verify + submit sitemap + request-index `/estimate`), **GCP cost cap** (per-API daily quota Solar+Geocoding ~300–500/day + $50 budget alert BEFORE go-live — cap = abuse tripwire, not a normal-usage worry; capped traffic still funnels to the inspection-booking path so no lost leads; ⚠ autocomplete is NOT Places-session-tokenized), GBP/local SEO, mobile-CWV pass. Full checklist in `PLAN.md` → "🚀 LAUNCH / GET-INDEXED". **NB:** the dev server is plain `tsx` (no `watch`) → SERVER-file changes need a manual restart to take effect locally (client uses HMR). **Then (2026-06-16) COST ANALYSIS + sketch POC** (Antonio: "what does each estimate cost + free usage?"): GMaps Platform free tier = **per-SKU/month** (Essentials 10k, Enterprise 1k). Per **unique** estimate ≈ **$0.10** = Geocode $0.005 + Solar BuildingInsights $0.010 (Essentials 10k free) + **Solar Data Layers (the roof-map image) $0.075 (ENTERPRISE, only 1,000 free/mo)** + autocomplete ~$0.011 (debounced, NOT session-tokenized). **The image's Data-Layers SKU is the binding cap → ~1,000 free estimates/month** (the other SKUs allow 10k+). Lever: render the image from `buildingInsights` (already paid) → free tier ~10k/mo, cost ~$0.02. **POC BUILT (throwaway):** `/sketchtest` (`client/src/pages/sketchtest.tsx`) + `server/scripts/roof-facet-sketch.ts` (SVG: each facet's lat/lng bbox → azimuth-hued tile, labeled "N facets · squares · pitch") + routes `GET /api/roof-facet-sketch` (SVG) & `GET /api/roof-satellite` (Static-Maps proxy) in `routes.ts`. Verified on **11508 N Florida Ave** (throwaway :3001 — sketch 374ms, Solar img 1.6s): sketch = a clean **labeled schematic** (8 facets/27.8 sq/5÷12), comparable to the Solar rainbow DSM + more useful (labeled), but bbox-approximate vs the DSM's organic shape. **SATELLITE NOW VERIFIED (2026-06-16) — Antonio enabled Maps Static API.** `/api/roof-satellite` upgraded: zoom 21 (tight on the roof) + `?zoom=`/`?pin=1`/`?outline=1` toggles; `?outline=1` traces the measured `buildingInsights.boundingBox` as a GOLD path → target roof highlighted on the real photo. Both variants verified 200/PNG (plain 410KB, outline 350KB) + Playwright 4-up (sketch-poc2.png). **VERDICT: the "satellite + outline" is the winner** — a real aerial of the actual roof + the measured footprint highlighted, ~$0.002/call, **10k free/mo (10× the Solar DSM's 1k)**, ~50× cheaper than the $0.075 dataLayers. (Outline is a bbox = frames, doesn't perfectly hug an angled roof — refinable.) **✅ DECISION LOCKED + BUILD GREENLIT (2026-06-16): satellite+outline IS the card image** (sketch = no-photo fallback) replacing the Solar `dataLayers` `/api/roof-image` (Antonio: "yes the satellite +outline will be our solution"). **Cost-hardening designed + greenlit too** — a layered defense: invisible Cloudflare **Turnstile CAPTCHA** on submit (server-verifies the token before any Google call — the bot wall) + an app-level **150/day cap** (≈50% of the ~10k/mo free; pre-checks before Google → graceful **email/phone capture** via the existing `QuoteModal`→`/api/quote-lead`, tagged `over-capacity`) + GCP **15/min** per-API quotas (burst brake) + per-day backstops where GCP allows + a $50 budget alert. **CAPTCHA + cap stack** (CAPTCHA stops bots; the cap stops ANY surge incl. real humans + earns the lead). Antonio confirmed "build the captcha into the build." **Antonio is setting the GCP per-minute quotas in the console NOW** (Solar `FindClosestBuildingInsightsUsage/min`→15 ✅, Geocoding `v3 requests/min`→15 ✅ [v3 = our endpoint, proven by the usage column; v3/day already 150 = a free hard backstop], Maps Static `Unsigned …/min`→15 ✅ [our calls are unsigned, proven by usage], **Places/min→15 pending**). **Full cost math + the GCP console state + the CAPTCHA design + the complete build spec now live in [`.context/ESTIMATE-COST-CAP.md`](ESTIMATE-COST-CAP.md) — READ IT for this work.** Build (greenlit, on `design-reskin`) = (A) image swap to satellite+outline + sketch fallback, reusing the measurement's buildingInsights bbox; (B) 150/day app cap + post-quota capture; (C) Turnstile widget + server verify; (D) session-token autocomplete. **✅ A/B/C BUILT + VERIFIED on localhost (2026-06-16):** the satellite+outline card renders (1120² PNG, not fallback); the Turnstile bot-wall 403s without a token + passes with one; the 150/day cap (gates cache-MISSES only) flips to the email/phone capture; over-capacity leads log to `data/quote-leads.jsonl` tagged `over-capacity`; tsc clean on touched files. Files: `server/estimate/{measure(geocode+BI 24h memo),turnstile.ts NEW}`, `server/routes.ts /api/estimate`, `client/.../estimate.tsx`. **Plus (2026-06-16, Antonio's catch) a 3rd distinct no-result state:** a per-minute **15/min 429** → HTTP 429 `{rate_limited}` + `Retry-After:60` → a **"in high demand, try again in ~60s"** card (NOT the capture), and the 429 **decrements** the daily-cap slot (rejected ≠ billed). `measure.ts` maps geocode `OVER_QUERY_LIMIT`/429 + Solar 429 → `RATE_LIMITED`; dev hook `ESTIMATE_FORCE_RATE_LIMIT=1`. Verified (429+header; cap-no-drain at cap=2; Playwright busy card). **✅ TURNSTILE LIVE (2026-06-16):** Antonio created the widget (Invisible; hostnames incl. localhost+oksigma.com) + put the real keys in `.env`; **verified end-to-end in a real browser** — estimate returns (real token verified, 0 log rejections), both lead forms email correctly, no-token/automation blocked. Remaining = the $50 budget alert + **deploy** (merge design-reskin→main; same keys → Railway env vars).

**✅ PER-USER LIMIT + AUTOCOMPLETE COST (2026-06-16, BUILT + VERIFIED — see `ESTIMATE-COST-CAP.md §9`):** a **2 new-estimates/browser/day** soft limit (browser `localStorage` clientId → server per-day `Map`; 3rd new address → `user_limit` → the limit card w/ Antonio's copy + the **"Got a question?"** capture; `ESTIMATE_USER_LIMIT`=2; counts live only, isolated per user, skipped if no id, decrements on 429). Honest: clientId is spoofable (Z₁ deterrent) — the hard bounds stay global-150/day + Turnstile + GCP quotas; **no IP limiting** (mobile CGNAT shares IPs). Autocomplete cost cut via **debounce** (≥4 chars + 350ms → ~1–2 calls/address, free under the cap) — **full Places session-tokens DEFERRED** (need a Place Details refactor for marginal benefit). Verified: userA 2→USER_LIMIT, userB isolated, no-id skipped, Playwright card; tsc clean.

**✅ BUILT + VERIFIED (2026-06-16): /estimate P2 floating job-photo gallery + non-white background.** The P2 region (after the P1 scrub) now has a background **carousel** — 6 real job photos (`public/carousel-1..6.jpg`, resized 1100×825 from `~/Downloads/IMG_6550,6074,6455,5892,5478,4951.JPG`) **wrapping through PORTAL edges** (exit one side → slide in from the opposite, momentum kept — flows, reads less crowded) **+ ping-pong off each other** (AABB elastic, rAF, ambient — NOT scroll-driven), **upright (no rotation)**, ~2× size, brightness 0.90, uniform 4:3 frames; **hover/proximity POPS a photo to the foreground** (scales up + brightens + rises above everything at z-50 + freezes, releasing once the cursor is a margin U≈90px beyond it). **Pops are SUPPRESSED while the cursor is over the Q&A panel** (a `qaHover` ref set by the panel's mouseenter/leave → the gallery forces focus=-1) so a passing thumbnail can't jump in front of what you're reading; pops still fire everywhere else. **MOBILE (≤767px) = a DIFFERENT gallery, `ShuffleStack`** (rebuilt twice 2026-06-16 per Antonio — now a STACK, not a grid; desktop-only floating via `{!isMobile && <FloatingGallery/>}`, `isMobile`=`matchMedia(max-width:767px)` state+listener): a **literal stack of FULL-SIZE cards** (front card = `w-[88vw]`, 4:3, undistorted `object-cover`; the others peek behind via a depth offset/scale/rotate capped at depth 3, `z=60-depth`) with **NO in-place card motion** (the drift + vibrate experiments were both removed per Antonio — neither landed); the only motion is the **shuffle sequence** (land → shuffle → land) — every ~1.2s the front card "deals" off to the back (tight cadence — the next shove starts almost as soon as the last card settles in; emphasizes the shuffle, per Antonio) (`order[]` rotate `[...slice(1), o[0]]`; the dealt card slides off-right at z=99 then transitions back into the pile) so each photo cycles to the front. **Tap a card → a blurred-background LIGHTBOX** (`open`/`view` state, fixed z-70, `backdrop-blur-xl` + `bg-black/55`) showing that photo at `w-[94vw]` full-size; **swipe L/R (or the ‹ › arrows) cycles all 6** (touchstart/end Δx>40 → `view±1`), gold dots show position, tap outside closes; the shuffle halts while open. (The "which shingle is installed" on-tap detail = PARKED for later, per Antonio.) Reduced-motion → static stack (no shuffle). Verified @390px (front card 88%, tap→lightbox+blur+6 dots, Next→carousel-2) + desktop unchanged (floating, 6). P1 hero+form responsive @390px (no horizontal overflow, 3D renders). **SECTION NAV (2026-06-16, FINAL = frosted-glass stack):** DESKTOP = a **persistent `SectionDial`** = a simple vertical stack of frosted-glass pills in the upper-right (`fixed right-4 top-[78px]`, `hidden md:flex`, z-55) — **Estimate · Q&A · Home · Contact** (Reviews dropped). Each pill matches the estimate form's translucent-black frosted glass (`rounded-xl border-white/20 bg-[#0d1626]/60 ring-1 ring-inset ring-white/12 backdrop-blur-xl`). A **scroll-spy** (`.p1`→0 / `#qa`→1 / `#contact`→3 top vs 40%-vh; Home=idx2 is a link, never active) golds the active section; hover brightens; click → `scrollIntoView` / `scrollTo(0)` (Estimate) / `/` (Home). *(Iterated through an FPS-HUD vertical dial → a half-knob → this clean frosted stack, per Antonio — "keep it simple and aesthetic.")* MOBILE = the `SiteHeader` links (Q&A · Contact only; the header's redundant **Home + phone were removed** — the logo is Home). Anchors: `#qa`+`#reviews` (`scroll-mt-6`), `#contact` pre-existing. Verified (4 items, frosted, spy updates, portals land, no knob, hidden on mobile). **✅ SUPERSEDED 2026-06-16 → the nav is NOW an iPod 1st-gen CLICK WHEEL** (`ClickWheel` replaced `SectionDial` in `estimate.tsx`; the frosted-stack description above is historical). The wheel: glossy white/silver, pinned to the right edge, **left hemisphere peeks → hover/focus slides it fully in** (so the off-screen-right `▶▶` is reachable). `menu` (top arc) → little **LCD sub-menu** (Estimator · Reviews · Q&A · Images · Contact · Home; current section highlighted iPod-blue + ‹ chevron; Home → `/`). `◀◀`/`▶▶` (left/right arcs) = prev/next on-page section. `▶❙❙` (bottom arc) = **auto-tour** toggle (steps the on-page sections every ~3.6s; never navigates away). **Center hub = an IN-SECTION CURSOR** (CHANGED 2026-06-16 per Antonio — it NEVER changes section; only the arcs/menu cross sections): each press steps the focusable controls of the *parked* section, wrapping — **Estimator** → address input → "Get my estimate" submit; **Q&A** → expand+highlight the next FAQ question + collapse the prior (single-open accordion, driven by `.click()`-ing the `#qa [aria-expanded]` buttons, re-read each press); **Contact** → first form field → next field → …; **Reviews/Images** = no fields → **no-op**. The cursored Q&A question gets a **gold focus ring/tint**. **The `↺` hook arrow was REMOVED — the hub is blank (no icon). Radial seams added** between the 4 arcs (diagonal dividers at 45/135/225/315°). Playwright-verified all three cursors (Estimator input→submit; Q&A `[T,F…]→[F,T…]→[F,F,T…]`; Contact First→Last→Email). **2nd-pass refinements (2026-06-16):** **(1) Q&A GLASS** — in Q&A (`active===3`) the wheel goes **translucent** (`opacity 0.34`, `transition-opacity 500ms`, NO backdrop-blur — that'd blur the text behind it) so it stops covering the questions; outlines/labels stay faintly visible; smooth fade in/out; the LCD stays opaque. **(2) FIELD-CURSOR FOCUS-STEAL FIXED** — the hub now has `onMouseDown → preventDefault` so a real click doesn't move focus off the form field; without it the Contact/Estimator cursor reset to field 0 every press (a real-click bug a *programmatic* `.click()` test had hidden — only `page.mouse.click` reproduced it). Re-verified with REAL clicks: Estimator address→submit→wrap; Contact First→Last→Email→Phone→Address→wrap. **3rd-pass refinements (2026-06-16):** **(1) cursor cycles FILL-IN fields ONLY** — selector narrowed to text `input`s + `textarea` (`:not([type=checkbox/radio/submit/button])`, no `select`) so it **skips the Service-Type menu, the lock-in toggle, and the Submit button** (the "dead" stops Antonio flagged — after Address it now wraps straight to First, no wasted clicks). **(2) FLOATING-GALLERY POPS SUPPRESSED ON THE WHEEL** — the desktop `FloatingGallery` pops a photo on pointer-proximity; a photo drifting under the cursor *while you're on the wheel* would pop inadvertently, so the wheel's `<nav>` now sets the **same `qaHover`/`noPop` ref** the Q&A panel uses (`onMouseEnter→true`/`onMouseLeave→false` → gallery forces `nf=-1`); `<ClickWheel suppressPop={qaHover} />`. Re-verified Contact (real clicks): First→Last→Email→Phone→Address→First (wrap). **COPY + CONTACT-BG tweaks (2026-06-16):** P1 subhead "Skip the guess — we measure your actual roof from the air" → **"Enter address — Estimate generates immediately in coverage areas in Metro OKC"**; trust line "Architectural shingle · full tear-off · no phone call" → **"Owens Corning System Reroof Estimate · No obligation"**; the **"scroll ↓" hint REMOVED** from the bottom of P1. **Contact section bg → subtle CREAM** (`bg-gradient-to-br from-[#f5f0e6] to-[#ece5d3]` — warm off-white near the cloud-cream `#f4efe6` / siding lap) but **only on /estimate**: `MVP3ContactForm` is shared with `home.tsx`, so I added a `bgClassName` prop (defaults to the old `from-slate-50 to-gray-50`) and pass the cream from estimate only — **home's contact section is unchanged**. Playwright-verified (p1-copy, contact-cream). **✅ CLICK WHEEL NOW ON MOBILE (2026-06-16, 4th pass — remapped per Antonio):** the wheel was desktop-only; per Antonio's "try it on mobile first, then adapt," the first-look @390px confirmed the web features don't translate to touch (no hover → the right `▶▶` is unreachable; the LCD + sub-menu clip off the right edge; the center cursor would pop the mobile keyboard). So mobile gets a **remapped wheel** with every control on the visible LEFT hemisphere (no hover-reveal — `md:hover/focus:translate-x-0` only → mobile stays peeked): **TOP = forward** (next section, ▶▶), **BOTTOM = rewind** (prev, ◀◀), **LEFT = play/pause = a smooth continuous AUTO-SCROLL** (rAF `window.scrollBy(0,1.3)`, tap to roll / tap to stop, auto-stops at the page bottom — distinct from desktop's section auto-tour), **CENTER = back to P1** (`scrollTo top`, labeled ↑ — NOT the cursor/menu). The **LCD screen + sub-menu are hidden on mobile** (`{!mobile && …}`); the RIGHT arc is off-screen/unused (`tabIndex −1`). Q&A glass still applies on mobile. Driven by a new `mobile` prop (=`isMobile` from the parent); **every handler is `mobile ? mobileFn : desktopFn`, so DESKTOP is unchanged** (re-verified: LCD/sub-menu + menu/prev/next/play-tour/cursor/seams/blank-hub all intact). Playwright-verified @390px: forward `y 0→4170`, rewind `→47`, play auto-scroll `47→236` then **stable after pause** (no drift), center `→0`. Enabled by flipping the nav from `hidden md:flex` → `flex`. **NOTE: the dev server (npm run dev) died mid-session (a stale background task exited 1) → I restarted it; back up on :3000.** **✅ MOBILE WHEEL REDESIGNED → TOP-RIGHT CORNER (2026-06-16, 5th pass — SUPERSEDES the 4th-pass right-edge remap, per Antonio):** the mobile wheel now sits in the **top-right corner**, ring **arcing from the top edge around to the right edge** (center ~at the corner: `fixed top:-41 right:-41`, Dm=138 ≈ **36% smaller** than desktop's 216). Built as a **dedicated mobile block** (`if (mobile) return …` early-return; the desktop wheel was **reverted to pure desktop** — no more interleaved `mobile?` ternaries). Three buttons on the visible arc (orbit r=48): **forward ▶▶ @180°** (upper, near top edge), **play/pause ▶❙❙ @135°** (mid = the continuous auto-scroll), **rewind ◀◀ @90°** (lower, near right edge); 2 seams + groove ring; **blank center hub (56px) = the text-field cursor** = the web `center()`, which now **skips Q&A on mobile** (`if (!mobile && sec===3)`) so it only acts where text fields exist (Estimator address; Contact fields cycle First→Last→…; no-op in Q&A/Reviews/Images). **No menu, no hover.** To clear the corner, **`SiteHeader`'s mobile Q&A/Contact links moved next to the logo (left).** Q&A glass still applies. Playwright-verified @390px: center→address (Estimator) + First→Last (Contact); forward `0→4101`; rewind `→122`; play auto-scroll `→295`; desktop regression check = the mobile hub is absent on desktop and the desktop submenu still opens. **NB: the dev server crashed TWICE from *transient* mid-edit Vite HMR JSX errors (not genuine failures — the half-applied LCD-wrapper edit briefly produced invalid JSX); restarted each time, final code tsc-clean, on :3000.** **✅ MOBILE WHEEL → SEE-THROUGH + 2 CONTROLS (2026-06-16, 6th pass, per Antonio):** the corner wheel is now a **see-through frosted-glass** disc — **no white plastic fill on any page** (the Q&A-only opacity toggle was removed): `rgba(255,255,255,0.07)` + `backdrop-blur-[3px]` + `border-white/25` + a faint dark hairline; groove ring; blank **frosted hub**. Pared to **TWO controls** (rewind + play DELETED): **FORWARD ▶▶** (kept at its 180°/upper spot — not repartitioned) where a **short tap = next section** and a **HOLD ≥500ms = back to P1/top** (pointer-event long-press via a new `holdRef`; `fwdDown` arms a 500ms timer→scrollTo top, `fwdUp` fires `goRel(1)` only if not held), and the **center hub = the text-field cursor** (web `center`, skips Q&A). The ▶▶ icon uses `mixBlendMode:"difference"` to stay legible on any background (light on the dark hero/Q&A, darker on cream). Dm=132 (~smaller still). The **`SiteHeader`'s mobile Q&A/Contact links were REMOVED** (+ the now-unused `jump` helper) — the wheel is the ONLY mobile nav; the logo = Home. (Trade-off Antonio accepted: forward-only + wrap + hold-to-top, no rewind on mobile; and see-through is **subtle on the light cream Contact section** by nature.) Playwright-verified @390px: forward **tap `0→4093`**, **hold `→0`**, center→address field (Estimator); screenshots on hero/Q&A (clean) + cream (subtle). tsc clean; desktop wheel untouched this pass. **Cosmetic tweak (2026-06-16):** the forward ▶▶ was moved onto the corner DIAGONAL (≈45° / 135° from center at r=48 — the ▶▶ glyph stays UPRIGHT, only its position is on the diagonal) and **two subtle embossed radial creases** (white highlight + faint groove, at 108°/162°) were added framing the forward button so the see-through wheel still reads as a segmented click wheel (Antonio: "keep some of the creases/edges — the click-wheel characteristics"). Forward re-verified firing from the new spot (`0→4093`). **COSMETIC PASS #2 (2026-06-16, 4 touches, per Antonio):** **(1) transparency = the P1 text-cloud divs EXACTLY** — the disc is now `bg-white/8 border-white/25 ring-1 ring-inset ring-white/15 backdrop-blur-lg shadow-[0_10px_36px_rgba(0,0,0,0.4)]` (heavier frost / more see-through; the inline rgba/blur-3px is gone). **(2) Creases at the reference's CANONICAL 90°-apart proportion** — moved from the bunched 108/162 to **90° & 180°** (flanking the forward button, which sits centered at 135° between them, exactly like a real iPod button in its arc bounded by two seams; white-highlight + faint-groove gradient spanning the ring 33→62px). **(3) Subtle PULSING RING** on the center hub — a `.cw-ping` ring (`@keyframes cwPing`: scale .92→1.5 + fade, 2.6s ease-out infinite; respects `prefers-reduced-motion`) emanating from the hub to draw the eye to the cursor button. **(4) P1 KEYBOARD-LIFT** — the P1 estimator form is `absolute bottom-0` inside the **sticky** P1 stage, so it's pinned to the viewport bottom and the mobile keyboard (~bottom 40%) covers it; now the address `Input`'s `onFocus` sets **`kbdLift`** (new state) when `isMobile` → the bottom-anchored wrapper gets **`transform: translateY(-40vh)`** (transition 0.3s) lifting it clear of the keyboard; `onBlur` resets it after 180ms (so autocomplete-suggestion taps land before the form drops). **P1-EXCLUSIVE** (only the P1 address input; Contact untouched for now). Verified @390px: frost + creases + ping ring render; **the form visibly rises into the upper area on focus** (Playwright `addrTop` measure accidentally hit a hidden input → 0, but the screenshot `/tmp/cos-lift.png` confirms the lift). tsc clean; desktop unaffected (`kbdLift` only set when `isMobile`). **Open/tunable:** the -40vh amount; the hub is still ~41% of Dm vs the reference's ~30% (could shrink); blur-vs-click race on suggestions handled by the 180ms delay (watch on real device). **✅ LOGO UPDATED to the new OFFICIAL mark (2026-06-16):** Antonio supplied `~/Downloads/SigmaLogo_Official.pdf` (the angular sigma mark + "SIGMA" wordmark, black on white, 864pt square). Extracted background-free → **two transparent 1024² PNGs in `client/public/`: `sigma-logo.png` (BLACK, replaces the old chevron+"SIGMA ROOFING LLC" mark) for LIGHT bgs, and `sigma-logo-white.png` (WHITE) for DARK bgs.** Wired: estimate **header** (dark hero) + estimate **`SiteFooter`** (navy) + the shared **`footer.tsx`** (charcoal, home) → **white**; the **contact-form card** (light) → **black** (the replaced `sigma-logo.png`). Playwright-verified all three crisp (white on dark header/footer, black on the cream contact card). **Extraction recipe (to regenerate):** `pdftoppm -png -r 600 -singlefile <pdf> raw` → `magick raw.png \( +clone -colorspace Gray -negate \) -alpha off -compose CopyOpacity -composite trans.png` (luminance→alpha; black opaque, white transparent, smooth edges) → `magick trans.png -trim +repage -resize 940x940 -background none -gravity center -extent 1024x1024 sigma-logo.png`; white = `-alpha extract` then CopyOpacity onto `xc:white`. **Still on the OLD→new black logo (not switched to white — flag if their bg is dark): `cube.tsx` (3D texture) + `hail-landingpage.tsx`.** (Other newer logo source files also in `~/Downloads`: `SigmaLogoOnly.svg`, `sigmalogo.svg`, `SigmaLogoOnly.png` — SVGs available if a vector/recolorable version is wanted later.) **✅ TOP-BAR + LOGO-SIZE + COPY (2026-06-16):** (a) **removed** the P1 headline subtext "Our Free Estimator gives you the figures in seconds!"; (b) **header logo enlarged** `h-8 w-8 → h-14 w-14` (~56px, header-standard) + the "Sigma Roofing" brand text `text-lg → text-xl` for balance; (c) **NEW click-to-call button** — a root-level `fixed left-1/2 top-2.5 z-[60]` pill (viewport-relative, escapes the pinned P1 stage), **frosted glass matching the clouds/wheel** (`bg-white/8 border-white/25 ring-1 ring-inset ring-white/15 backdrop-blur-lg`), **gold `text-[#dca94e]`** (same as the "Instant roof estimate" tag), `<Phone/>` icon + `BIZ.telephoneDisplay`, `href="tel:${BIZ.telephone}"` (works web + mobile). Verified: tel link = `tel:+14059025266`; desktop clean; mobile fits (logo left · call center · wheel corner — slightly tight by the wheel but discernible). tsc clean. (NB: the call button is **fixed**, so it persists at top over ALL sections; on the cream contact section the gold-on-frost is a bit subtle — fine for a persistent CTA.) **⚠️ TURNSTILE DEV-BYPASS ENABLED (2026-06-16, TEMP — user-authorized for phone testing):** Antonio reported the estimator "hit a snag" for `6320 N Warren` — diagnosed from the server log as the **Turnstile bot wall**, NOT the address: the submit 403'd with `invalid-input-response` because he's testing on the **phone via the QR (LAN IP `192.168.1.178`)**, which isn't a registered Turnstile hostname (only `localhost`/`oksigma.com` are) → the widget can't mint a valid token. (The `.env` keys are real + paired `0x4AAAAAAD…`; the autocomplete had geocoded the address fine.) Fix = a new **opt-in `TURNSTILE_DEV_BYPASS` flag** in `server/estimate/turnstile.ts` (returns `{ok:true}` when `=1`; off by default; first autonomous enable was correctly DENIED by the safety classifier → Antonio then explicitly authorized it). **Now `TURNSTILE_DEV_BYPASS=1` is in `.env` and the server was restarted** → phone testing works. Verified: a no-token `POST /api/estimate` for **6320 N Warren Ave** returns a real estimate (**2616 sqft / 26.2 sq / 5/12 / 4 facets**, HIGH 2023 imagery; cached 24h). **MUST be turned OFF after Antonio finishes testing + NEVER deployed** (it's `.env`/local-only + gitignored; Railway prod keeps the wall) — plan: remove the flag, then prep deploy. **✅ COPY: tag rename + Owens Corning DISCLOSURE (2026-06-16):** P1 gold tag "Instant roof estimate · OKC metro" → **"SIGMA ROOFING LLC · OKC metro"** (same MONO/gold styling, text only). Added a **trademark non-affiliation disclosure** to the `/estimate` footer (under the © line, muted `text-[11px]`): *"Sigma Roofing LLC is an independent contractor and is not an affiliate of Owens Corning Roofing and Asphalt, LLC. Owens Corning®, Duration®, and related marks are trademarks of Owens Corning."* — this is **OC's own required language** for contractors using their name (verified via OC's Business Builder Guide + brand guidelines; not legal advice — if Sigma is a certified OC contractor, their brand agreement governs). Site references OC at estimate.tsx:404 (trust line) + :871 (result-card "Owens Corning Duration Architectural System"). tsc clean. **✅ MOBILE P1 KEYBOARD FIX — keyboard-aware lift (2026-06-16):** Antonio reported that **directly tapping** the P1 address field blew the estimator card out of sight (the keyboard covered it). Root cause: the P1 stage is **GSAP `ScrollTrigger`-pinned** (`pin:".p1-stage"`), so the bottom-anchored form can't be scrolled into view (the Contact form works because it's in normal flow → native scroll-into-view). The earlier fix (`kbdLift` boolean → fixed `translateY(-40vh)` on `onFocus`) wasn't keyboard-aware (real keyboards/iOS suggestion bar > 40vh; a direct tap's native scroll fought it). **Replaced with a `visualViewport`-driven precise lift:** new `kbdPx` state + a `visualViewport` `resize`/`scroll` listener computes the **real keyboard height** (`window.innerHeight − vv.height`, threshold > 150px) and the form lifts `translateY(-(kbdPx+12)px)` (gated `isMobile && kbdPx`) → sits exactly above the keyboard, **independent of how focus happened** (direct tap OR the wheel's center cursor) and **device-agnostic**. Removed the `onFocus`/`onBlur` `setKbdLift`. Verified via a simulated keyboard (override `vv.height −320` + dispatch resize): at rest `transform:none`; keyboard-open `matrix(…,-332)` = `−(320+12)` ✓ + screenshot shows the card lifted clear. **Contact form confirmed fine** (normal flow → browser handles it; the visualViewport lift also fires there but the off-screen P1 form's transform is harmless). Real-keyboard behavior to confirm on Antonio's phone. tsc clean; prod build still green. **↳ REFINED (2026-06-16, real-phone test):** Antonio tested — a **direct tap** still over-shot (card's bottom edge ~to the top of the screen), while the **wheel center button was perfect**. Diagnosis: the lift AMOUNT was right (the center button uses the same `kbdPx` lift), but a direct tap ALSO fires the browser's **native scroll-into-view**, which STACKED on top of the lift → double displacement. The center button avoids it via `focus({preventScroll:true})`. Fix = make a direct tap do the same: **`onPointerDown` on the address `Input` → `e.preventDefault()` + `e.currentTarget.focus({preventScroll:true})`** (mobile only) — suppresses the native scroll so only the controlled `kbdPx` lift applies, now identical to the center button. Verified @390px: tap → `scrollY 0→0` (no native scroll) + field focused + keyboard-sim lift still `-332`. (Small risk to watch on the real phone: the preventDefault-then-focus pattern must still pop the keyboard on iOS — it should, as it's a focus inside a user gesture.) **✅ HOME PAGE — new logo + larger + overlap fix + CREAM bg (2026-06-16):** (1) **Logo unified to the new official mark on every page** — the home header was still using the OLD `@assets/Untitled design.png` (a mark on a WHITE BOX); swapped to `/sigma-logo.png` (transparent black) + removed the dead import → now all pages use the new logo. (2) **Larger ("family crest"):** home header `w-16→w-20` (80px); estimate header `h-14→h-16`; home footer `w-12→w-16`; estimate footer `h-10→h-12`. (3) **Header overlap FIXED** (the "Home" link was jammed against the branding): parent `flex` got `gap-x-4`, logo group `shrink-0`, nav `space-x-8→md:space-x-4 lg:space-x-5`, contact group `space-x-6→space-x-4`. (4) **Background white→CREAM** (`#f4efe6`, matching /estimate): home wrapper `min-h-screen bg-[#f4efe6]`; header `bg-gray-50→bg-[#f4efe6]`; the light sections **process / testimonials / faq** (`bg-gray-50`) + **services** (was a blue/gray/emerald gradient) → `bg-[#f4efe6]`; home Contact form → cream via `bgClassName="bg-gradient-to-br from-[#f5f0e6] to-[#ece5d3]"` (same as /estimate). Dark sections (about=emerald, projects/sochub=charcoal, hero=image) left intentional. Verified: bg = `rgb(244,239,230)` on wrapper/services/faq; header screenshot = new logo + no overlap + cream. tsc + prod build green. **Possible follow-ups (flagged, not done):** the inner CARDS in process/services/projects are still `bg-gray-50` (cool grey on warm cream — could warm them); the emerald `about` section is a strong green block on cream. **✅ "WATCH"/SocHub LINK DISABLED everywhere (2026-06-16):** the SocHub (`/social`) page has no videos yet, so Antonio doesn't want it surfaced. Done: (1) both **header nav "Watch" links** (desktop ~line 60, mobile ~line 139) **commented out** (with a re-enable note) — they were the only always-visible entry points; (2) the **`SocHubTeaser`** home section already self-hides when empty (`if (videos.length === 0) return null`), no change needed; (3) **`/social` removed from the sitemap** (`server/routes.ts` `SITEMAP_PAGES`) so Google won't index the empty page — verified `/sitemap.xml` now lists `/ · /estimate · /hail-damage · /tornado-damage · /privacy · /terms` (no `/social`). The `/social` route + `sochub.tsx` page still exist (orphaned, unlinked). **To RE-ENABLE when videos land:** uncomment the 2 nav links + re-add `/social` to `SITEMAP_PAGES`. Verified: home nav = Home·Services·About·Projects·Instant Estimate·FAQ·Contact (no Watch). (Server restarted for the routes.ts change.) **✅ COMMITTED + DRAFT PR (2026-06-16 — session end):** everything uncommitted on `design-reskin` (this session + the prior tr3/test-page work) → **commit `a2ab5f8`** ("feat: /estimate money page + cohesive home polish"), 181 files / +12,822 −236. `.env` + `data/quote-leads.jsonl` confirmed gitignored (NOT committed). Pushed to `calendly-origin` (`SigmaBiz/sigma-roofing-calendly`); **draft PR #1 → main** open: https://github.com/SigmaBiz/sigma-roofing-calendly/pull/1 (base main @ 4535b35). All prior "UNCOMMITTED on design-reskin" notes in this file are now SUPERSEDED. **NB:** the commit bundles the experimental roof-takeoff pipeline (`server/scripts/vision-*`, tr3 engine) + deletable dev test pages (`/housetest`, `/captest`, …) — large diff; Antonio can prune before merge if wanted (the draft PR is the review gate). **⚠️ CORRECTION + DEPLOY-REPO RECONCILED (2026-06-16):** the calendly PR was on the WRONG repo. Railway (project "captivating-courage" / prod) deploys **`origin` = `SigmaBiz/SigmaRoofingWebsite`** (NOT the calendly repo), and its "Branch connected to production" was **`staging-mobile-fix`** (auto-deploy) → Antonio is switching it to **`main`**. Fixed: closed the calendly PR #1 + deleted its `design-reskin` branch (the commit was an exact dup — nothing lost). **BRANCH STRATEGY (the vault + the clean ship):** (1) **`origin/design-reskin` = the full ARCHIVE** — pushed `a2ab5f8` (everything: the tr3 roof engine, the 22 dev/3D pages, the vision+geometry takeoff R&D, + all `.context/` docs) for reference/resume; (2) **`launch` branch = CLEAN production** — branched from design-reskin, then **pruned the 22 parked dev pages** (removed their routes/imports from `App.tsx` + `git rm` the page files: cascade, cube, scrub, showcase, scroller, grid, transitions, citygrid, roof, pullback, scene3d, zelda, skins, inspect, housetest, shingletest, captest, sidingtest, overhangtest, veneertest, sketchtest, google-photos-test). **Build VERIFIED on launch:** green, all dev-page chunks GONE, `/estimate` lazy-chunk intact, home bundle now 3D-free (505KB→149KB gz). KEPT (real site): home, /estimate, hail-damage, hail-landingpage, tornado-damage, privacy, terms, sitemap, admin, /social (SocHub), 404 + everything they import (RoofHouse→tr3 solver2/caps/siding/walls; the estimate API's roof-sketch + roof-facet-sketch scripts). The leftover server research scripts (vision-*, verify-roofs, takeoff) + orphaned tr3 libs stay in source but DON'T ship (not bundled). **`launch` → PR → `main` → Railway.** design-reskin keeps the full dev state. Scroll-spy order: Estimator(`.p1`) → Images(**NEW `#images`** anchor on the P2 gallery wrapper) → Reviews(`#reviews`) → Q&A(`#qa`) → Contact(`#contact`); current shown on the LCD + highlighted in the menu. Craft: glossy radial-gradient plastic + thin silver bezel + recessed silver hub + 4 transparent **clip-path wedge** buttons that darken on hover/`active` + grey iPod labels — faithful to `26.jpeg`. Desktop-only (`md:`); mobile keeps the `SiteHeader` Q&A/Contact links. **Playwright-verified** (peek / hover-reveal / menu-open states + a functional teleport assert: clicking the menu's Q&A row scrolled `scrollY 0→4506`, landing `#qa` at the viewport top); **tsc clean**. **Open-question calls I made (Antonio can redirect): play/pause = auto-tour; ~42% peek; Images → P2 top; center-cursor in Reviews/Images = no-op (no fields — could later cycle cards / pop photos). FULL BUILD RECORD → `.context/IPOD-NAV.md`.** (Rebuilt 2026-06-16 from the first drift-and-wrap version per Antonio; portal edges + Q&A-suppression + brightness tuned same day.) Impl: NEW `FloatingGallery` component (in `estimate.tsx`) behind a **navy-gradient P2 wrapper + dark scrim** (legibility); the **reviews strip + FAQ were restyled from `bg-white`/`bg-gray-50` to dark-glass** (`bg-[#0b1424]/55 backdrop-blur`, light text) so they're cohesive on the navy + the gallery shows through. Playwright-verified (`/tmp/p2-reviews.png`, 6/6 photos load), tsc clean. **NOTE:** the `MVP3ContactForm` below kept its own light styling (shared with home — left as-is; extend later if wanted). **All this session's work is verified but UNCOMMITTED on `design-reskin`.** **Full build record + verification + env vars → `ESTIMATE-COST-CAP.md §8`.** Pricing sources: developers.google.com/maps/billing-and-pricing/pricing + /documentation/solar/usage-and-billing.

**GCP (done):** Solar + Geocoding enabled on project **`31141248090`** — ⚠️ owned by the **personal `t.m.escal@gmail.com`** (backs the live `.env` key + Business-Profile reviews). Found via the Solar "API has not been used in project NNN" error (the key name matched none of the projects' "Maps Platform API Key" — there are other keys). **Deferred cleanup:** transfer the project into the `oksigma.com` org so business infra isn't under a personal Gmail.

**Decisions (locked w/ Antonio):** v1 = squares+pitch+$ (no geometry engine); scope-2 = LF takeoff (straight skeleton, Python/polyskel); gating = **fully open**, booking CTA captures; pricing = placeholder until Antonio tunes.

**Next:** `/estimate` page (`client/src/pages/estimate.tsx` + route in `App.tsx`) reusing `/api/address-suggestions` + `/api/contact`→Calendly, styled via `sigma-design`. Cost guards (spec §10): cache ✓, debounce (on page — todo), server-side key ✓, **GCP daily cap (todo — recommend Antonio set ~200/day)**. Antonio to provide real $/square.

---

## 🧮 ROOF ESTIMATOR — VISION+GEOMETRY (PAID) TIER (CURRENT, 2026-06-13 pre-compaction)

> The estimator section above is the FREE tier (squares+pitch+$, `/api/estimate`, kill-test passed). Since then we built
> the **PAID "detailed report" tier** — an EagleView-style **linear takeoff** (ridge/hip/valley/rake/eave). **`DOCTRINE.md`
> (LIVE MICRO-STATE) + `PRIM-PALETTE.md` hold the full blow-by-blow — read those for the saga.** This is the granular state.

**ARC (condensed):** free tier proven (Solar `buildingInsights` → squares ±~5% mean 4.7% n=7, pitch exact on single-pitch;
cohort + ground truth in `server/estimate/ground-truth.json`). Tried + KILLED (don't resurrect w/o better data): DSM own-area
(`dsm-measure.ts`), outline-skeleton-all-eaves (`roof-skeleton.ts`, phantom hips), DSM crease segmentation (`roof-creases.ts`,
+100–480%). Binding limit: Google's 0.1m DSM can't reliably segment creases/eave-rake. REFUTED that pivot with **VISION**.

**THE SURVIVOR (built + LIVE-validated):** blueprint → Claude vision → prim decomposition → geometry deduces the takeoff.
- `server/estimate/geometry.ts` — exact plan→true mults (ridge/eave ×1, rake ×√(1+s²), hip/valley ×√(1+s²/2)); prims
  `gablePrim·hipPrim·hipWing·crossGable·shedPrim·flatPrim·clippedGable·dutchGable·gambrel·mansard` (verified `geometry-check.ts`).
- `roof-schema.ts` (RoofStructure/PrimSpec contract) · `assemble.ts` (structure→takeoff + area cross-check).
- `vision.ts` — Claude vision (`@anthropic-ai/sdk`, base64 PNG, adaptive thinking, `claude-opus-4-8`, `ANTHROPIC_MODEL` override);
  prompt = prim palette + Solar facet HINTS + multi-wing + no-double-count rules.
- `server/scripts/roof-blueprint.ts` → `client/public/blueprint-<slug>.png` (flat aspect color + seams + 10ft grid, **6.10 px/ft**;
  have: crestridge, lee, hinkle, 3813-nw62, 8416-johnrobert, 1305-ne24). Scripts: `vision-demo` (offline contract), `vision-live`
  (LIVE pipeline), `ping-anthropic` (key check), `roof-corners` (M2). 

**LIVE VALIDATION (real `ANTHROPIC_API_KEY` in `.env`):** address→blueprint→vision→geometry→takeoff, autonomous.
**Lee (simple gable-L): ridges +1%, hips exact, valleys +2%** — thesis proven end-to-end. Crestridge (12-facet hip): hips −8%,
ridges +10%, **valleys −50%** (vision modeled 1 wing of 2). Hinkle: +14%/−17%/+23%. **Hips/ridges ~±10–17%; valleys wobbly on
complex roofs.** Vision SELF-FLAGS confidence (Lee=medium, Crest/Hinkle=low) = the ROUTING signal (high→show, low→"approximate/
book inspection" = the conversion). 

**⏸ INTERRUPTED HERE (resume): valleys from the FOOTPRINT, not vision's guess.** Diagnosis: valley miss is DECOMPOSITION (vision
guesses wing count), not math (per-valley trig exact, Lee −1%). **Z₁→Z₂: valley ⟺ REFLEX (notch) corner of the footprint**
(straight-skeleton rule: convex→hip, reflex→valley, spine→ridge). Modules: M1 footprint (`roof-outline.ts`, ±10%, have it) · M2
corner-typing · M3 plant valley per reflex corner→45° to ridge→×pitch · M4 trig (have it).
- **M2 (`roof-corners.ts`, deterministic) — reflex corners EXIST + roughly track valleys, but the COUNT is NOISY:**
  filter-free → 3605(0 val)=2, Lee(39)=1, Hinkle(48)=4, Crest(87)=5 (rises, but control 2 > Lee 1 = anomaly). A min-edge-length
  filter to kill 3605's spurious reflex **REGRESSED** (Hinkle 4→1: real short notch edges dropped) → reverted. **FINDING (belief
  error):** raw Solar mask at 0.1m is too coarse to count notches cleanly → pure footprint-reflex valley-derivation is Z₁
  (mask-noise-dependent), NOT the clean Z₂ I assumed. The reflex⟺valley RULE is exact; our FOOTPRINT SOURCE isn't clean enough.
- **PIVOT (the real Z₂): can't GUARANTEE a complex decomposition → GUARANTEE detecting uncertainty + routing to inspection.**
  Vision already self-flags Crest/Hinkle "low" → they already route to the booking CTA (the conversion). Harden with a
  **facet-count-consistency guard** (vision-implied facets vs reliable Solar facet count diverge → force confidence "low"), so
  complex-roof valley error becomes the CORRECT product behavior (inspection), not a wrong number shown.
- **M3 BUILT + ITERATED TO CONVERGENCE (`roof-valleys.ts`) — the right move was to ITERATE on M2's failure, not bail.**
  MEASURE valley feet (don't COUNT corners): per reflex corner, gradient-ascend the interior distance-transform (uniform-pitch
  "tent") to the first node; path-run × √(1+s²/2) = true valley feet. Failure-fed-failure trajectory:
  · iter-1 (ascend to local max): Lee −42 / Hinkle +109 / Crest +54% — ascent OVERSHOOTS to the global ridge.
  · iter-2 (stop at the BEND, >50°): Hinkle +20 / Crest +27%.
  · iter-3 (tighten bend ~38°): **Crest −2% ✓ / Hinkle +15%** — from the +100–480% that killed every pixel method, to −2% on the
    12-facet/87ft roof, deterministically from the footprint. (bend θ tuned on n=3 → calibration, watch overfit.)
- **Lee stuck −58%, DIAGNOSED (not noise):** Lee is an L with a FLUSH wing (wing's north wall colinear with the main's top eave);
  its upper valley starts at a mid-edge T-junction with NO footprint corner → per-corner ascent structurally can't see it.
  **Method boundary: protruding-wing valleys ✓ (real reflex corner); flush-wing valleys ✗ (need full medial axis / node on a straight edge).**
- 🛰️ **THE NEUTRINO (Pauli-decoherence of "where valley info lives") — the eigenstate I never measured: `|Solar per-facet azimuth +
  plan-area + position⟩`.** The cheap `buildingInsights` call already carries each facet's azimuth/plan-area/center/bbox — a flush
  cross-wing CANNOT hide there (always a N+S or E+W facet pair, even with no footprint corner). `facet-probe.ts`: Lee = E/W main pair +
  **N/S cross pair = the flush wing**; 3605 = 2 facets = one gable, 0 cross-wings.
- 🏆 **HARNESSED — VISION-FREE deterministic valley engine (`roof-wings.ts` + `roof-valleys.ts`), via a COMPLEXITY ROUTER:**
  facet-constellation valleys (Wc = 2×cross-facet center-span): **3605 = 0 ✓exact · Lee = −3% ✓ (was −58%!) · Hinkle +393% · Crest +126%**
  — NAILS simple/flush (DT-ascent's blind spot), BREAKS on hips. DT-ascent nails hips (Crest −2%, Hinkle +15%). Blind spots mutually
  exclusive → route: simple/few-facets → constellation; complex/hip → DT-ascent. **NO vision, NO API cost** — "harvest Google's data,
  run our own math." Vision DEMOTED to corroborator. (Router threshold tuned n=4 → validate.)
- **iter-6 HIP TEST (iteration-1, FEEDBACK not verdict):** DT-ascent from CONVEX corners → Crest −79% (per-hip 2–6ft, bend fires instantly),
  Hinkle −26%, 3605 −36%, Lee false +55 (gable corners→phantom hips). Feedback: (a) hips need their OWN bend-θ (looser than valleys' 0.78);
  (b) gate gable corners via constellation azimuth (hip corner = perpendicular-azimuth facets; gable corner ends at a rake).
- ❌ **COP-OUT DELETED (Antonio): "complex roof → LOW → book inspection" is NOT an answer.** Confidence routing only for genuine DATA failure
  (no coverage/occlusion), never a substitute for unmodeled geometry. **GOAL (no escape hatch): full deterministic takeoff — squares · pitch ·
  valleys · HIPS · ridges · rakes · eaves — ≤5% on ≥90% of ALL roofs, complex included.**
- 🧗 **HIP CAMPAIGN iterated (NOT copped out): all MASK/DT methods hit the 0.1m resolution wall.** hip iter-2 (no-bend): Crest +114%/3605
  +533% (no single bend-θ fits → bend heuristic dead). iter-3 PRINCIPLED skeleton (`roof-skel.ts`, Zhang-Suen + junctions): **Crest −6%**
  (hardest nearly nailed) but 3605 +61% / Hinkle −39% / Lee −19% — errors point OPPOSITE ways = mask-resolution wall, not tunable.
- 🎯 **DECISION: ε-path = CONSTELLATION → PRIM-RECONSTRUCTION → EXACT ENGINE** (not more mask cleanup). Solar azimuth+area = the high-quality
  data that gives squares ±5% (NOT mask-limited); already nailed simple valleys; geometry engine emits ALL features ±1% given correct prim dims.
- **CONSTELLATION RECON iter-1/2 (`roof-recon.ts`): per-facet shape (fill-ratio of plan-area vs bbox) → edge lengths, ½·Σ shared.**
  hips+valleys: **Hinkle −2% ✓ · Crest +20% · Lee +56%.** Complex roofs WORK (errors average over many facets); simple over-count (1-vs-2-sided
  narrowing underdetermined by area+bbox — Solar gives no polygon). Ridges −35..−98% = a BUG (misclassified rects eat their ridge), not data wall.
- **ADJACENCY GRAPH (`roof-recon2.ts`): edge = RIDGE (opposite az, slope away) / HIP (perp, away) / VALLEY (perp, toward).** WIN: ridges
  Lee −2% (was −41%); Hinkle hips +10%, Crest valleys +7%. But slope-agreement rule swung Hinkle hips +10%→−41% — params now TRADE roofs.
- 🏔️ **EARNED VERDICT (6 methods + levers TRIED, NOT premature): valleys SOLVED to ε (the hard one), ridges-on-simple to ε.** De-rotation lever
  (mechanism #2) TRIED → closed Crest hips +52%→+13% (real), but over-shortened Crest valleys. Residual on complex hips/ridges = **mechanism #1,
  NO FACET POLYGON** — edge lengths underdetermined by area+bbox+center, PROVED by fixes trading roofs (Hinkle hips +10↔−43; Crest hips↔valleys).
  Not in Google's free data. Path past it = DXF polygons (memory `roof-3d-data-pipeline`) → same exact `geometry.ts`. Every roof still gets a number.
- **FORK (Antonio): (a) SHIP the ε-core now** (squares·pitch·valleys·simple-ridges; full takeoff as ±-banded ballpark) · **(b) keep grinding the
  capped free-Google hips/ridges** (now roof-trading) · **(c) DXF** (~$18–38/roof, [[roof-report-pricing]]) for paid/back-office only · **(d) 🟢 BUILD
  OUR OWN from FREE Oklahoma LiDAR** (USGS 3DEP, 4.22 pts/m², $0/roof) — true-3D points → plane-fit → analytic creases; BREAKS the no-polygon wall
  Google's 0.1m smoothing caused, no vendor. Effort: prototype days / robust weeks. See memory [[roof-3d-data-pipeline]]. Then wire `POST /api/measure`.

**Endpoint (NOT wired):** `POST /api/measure` (geocode→measure→blueprint→vision→assemble; HIGH=show takeoff, LOW=inspection);
refactor `roof-blueprint.ts` render → reusable fn first. **Keys:** `ANTHROPIC_API_KEY` in `.env` (ROTATED+verified, old deleted);
`GOOGLE_API_KEY` on GCP project `31141248090`. ⚠️ GCP daily cap TODO. Tier-2/3 (gambrel/mansard/shed) formula-complete, unvalidated.

---

## Current Status Summary

| Feature | Status |
|---|---|
| Calendly booking | COMPLETE |
| Google Places autocomplete | COMPLETE |
| SendGrid email | DEFERRED (Nodemailer swap is the plan) |
| Google Reviews backend | COMPLETE (business name fixed) |
| Google Reviews live verification | NOT YET VERIFIED on production |
| SocHub Phase 1 | COMPLETE — deployed 2026-05-19 |
| SocHub Phase 2 | COMPLETE — shipped in commit 532b0a1 (Facebook embeds, reviews/follows section, nav link) |
| Design reskin (persuasion-grounded) | PARKED — branch `design-reskin`; /housetest dressing awaiting import to /inspect |
| **Roof Estimator (instant measure + price)** | **ACTIVE — free tier built (`/api/estimate`); PAID vision+geometry takeoff LIVE-validated (Lee ±2%). NOW: M3 valleys-from-footprint (M2 kill-test passed). See estimator sections above + DOCTRINE.md/PRIM-PALETTE.md.** |
| tr3 roof engine (3D prim modeler) | ACTIVE (latest) — see below + `.context/ROOF-GEOMETRY-RULES.md`; on branch `design-reskin`, demo `/skins` |

---

## Credentials & Config

### GOOGLE_API_KEY
- Active key: `AIzaSyComhGDVX5No7X35T9P-5PoWEogEoq-Mqw`
- Set in Railway Variables (production). Also in local `.env`.
- Covers: Places autocomplete, Google Reviews, business photos (all legacy Places API endpoints)
- Billing is active on the Google Cloud project

### SendGrid (DEFERRED)
- Trial expired July 25, 2025 — key in Railway Variables as SENDGRID_API_KEY is non-functional
- Preferred fix when ready: swap to Nodemailer + Gmail SMTP (nodemailer already in package.json, ~30 min)
- Calendly handles appointment confirmation emails in the meantime

### Calendly
- URL: `https://calendly.com/aescalante-oksigma/new-meeting`
- No API key needed — public embed
- Previously broken due to disconnected account — Antonio reconnected, now working

---

## Codebase Quick Reference

### Contact form
- Active form: `mvp3-contact-form.tsx` — 3 fields (phone, address, serviceType), Calendly popup on submit
- Two other form variants exist but are not the primary: `contact-with-calendly.tsx`, `contact.tsx`

### Google API routes (server/routes.ts)
- `/api/address-suggestions` (line ~53) — Places autocomplete
- `/api/business-photos` (line ~438) — business photo lookup
- `/api/reviews` (line ~499) — Google Reviews, now searches "SIGMA ROOFING LLC Edmond OK"
- `/api/tiktok-thumbnail` — TikTok oEmbed proxy (no key needed, public API)

### Deployment
- Branch: `staging-mobile-fix` → auto-deploys to Railway → oksigma.com
- `.env` is gitignored — all production secrets set in Railway Variables tab
- MemStorage is in-memory — data resets on every redeploy (same for projects and social videos)

### Local working copy (2026-06-03)
- **Canonical local path: `~/dev/SigmaRoofingWebsite`** — moved off `~/Desktop` (iCloud-synced) because the iCloud FileProvider raced npm's atomic renames and corrupted installs with `ENOTEMPTY`. `~/dev` is outside the CloudDocs container, so installs/builds are no longer coupled to sync.
- Moved via `rsync -a` (NOT `mv` — `mv` out of iCloud hangs on FileProvider). `.env` was carried by rsync (it's gitignored, so it does NOT travel via git — re-copy manually if ever re-cloning).
- Verified in new location: `npm install` clean (646 pkgs, no ENOTEMPTY), `npm run build` OK, source byte-identical to old copy, git tree clean.
- **`npm run check` (tsc) has PRE-EXISTING type errors that do NOT block deploy** — production ships via esbuild `npm run build`, which does not type-check. These errors predate the move (proved by byte-identical source + clean git tree).
- Old `~/Desktop/SigmaRoofingWebsite` copy **deleted 2026-06-03** after the new copy was verified (clean install, build OK, dev server booted + served HTTP 200). `~/dev/SigmaRoofingWebsite` is now the only working copy. Do all local work here — never recreate the project under `~/Desktop` (iCloud).

---

## SocHub — Phase 1 COMPLETE (2026-05-19)

### Architecture
- Platform detection from URL: `tiktok.com` → tiktok, `youtube.com/youtu.be` → youtube, `instagram.com` → instagram, `facebook.com` → facebook (detection not yet added), everything else → direct
- Admin: `/admin` → SocHub Videos tab → paste URL + title → auto-detect platform → save
- Storage: MemStorage (resets on redeploy — known limitation)

### How it works today
| Platform | Display | Click behavior |
|---|---|---|
| YouTube | Real thumbnail (img.youtube.com CDN) | Plays inline (iframe autoplay) |
| TikTok | Real thumbnail (backend oEmbed proxy) | Opens TikTok in new tab |
| Instagram | Colored placeholder | Opens Instagram in new tab |
| Direct (.mp4 / Cloudinary) | Colored placeholder | Plays inline (HTML5 video) |
| Facebook | Falls through to "direct" — broken | N/A — not yet supported |

### Social handles
- TikTok: @sigmaroofing405
- Instagram: @sigmaroofing405
- Facebook: Sigma Roofing LLC (page)
- YouTube: not created yet

### Homepage integration
- `SocHubTeaser` component sits between Projects and Testimonials on home.tsx
- Renders nothing (returns null) when no videos have been added — won't show an empty section
- Shows up to 4 most recent videos, links to /social

---

## SocHub Phase 2 — COMPLETE (shipped in commit 532b0a1)

All three features shipped: Facebook inline embeds, reviews/follows section on /social, and the
SocHub nav link in the header. (The state docs previously lagged behind the commits — reconciled
2026-06-03.) One item that may still be outstanding: the Google Business **review URL** for the
reviews/follows CTA — verify it's wired to Antonio's real review link.

---

## ACTIVE WORK (2026-06-05, LATEST): tr3 — 3D roof-generation engine (prim modeler)

Building a React-Three-Fiber roof generator from PRIMITIVES ("prims") to recreate a real EagleView
roof. Training is iterative; the **authoritative spec is `.context/ROOF-GEOMETRY-RULES.md`** and the
pre-flight checklist is `.context/Pulse.md` — **read both before any roof prompt.**

- **Engine:** `client/src/lib/tr3/solver2.ts`. Model = **MAX-OF-TENTS** (each prim a full, undisturbed
  tent; roof = upper envelope; ext deleted where the host is taller). Demo: `/skins` (localhost:3000),
  scroll drives a 4-stop camera; click switches the 6 skins.
- **Current build:** `buildDimHipGableExt` — a **diminished central hip** + a **gable ext** at the +X
  corner: facet K coplanar-shared with the hip end, facet A melting into the diminished facet I.
  Geometry approved by Antonio ("got it right pretty much").
- **Done + approved (2026-06-05):** (1) **walls-eat-roofs** — prims meshed as separate regions +
  vertical **step-walls** so a raised/diminished eave stays a clean wall and the ext roof behind it is
  deleted (fixed the "weave/bridge" at the facet-A interface). (2) **Diminish by rafter-fraction**:
  `f_a` rafter ≈ **8% shorter** than `f_b` (was an over-aggressive raw eave-raise). Everything else held
  constant (L14 W8 wallH2.6 pitch8/12 extA2 extLen5). Antonio: "got it right pretty much."
- **Done + approved (2026-06-05):** **crisp creases** — replaced the averaged-normal heightfield with
  **explicit flat facets** (each point = one active eave/slope plane; triangles split at the exact
  plane-equality crossing = the crease; analytic per-facet normals). Hips, valleys, ridges are now
  clean straight lines. Antonio approved.
- **Sonnet handoff REVERTED (2026-06-05):** tried Sonnet for the overhang; it produced a broken
  detached-ext render. Reverted code to checkpoint `b53b117` (docs kept — they had the hash pins).
  Back on **Opus 4.8**. Sonnet's `buildOverhangExt` discarded (it set the ext support/regions so the
  overhang floated detached instead of melding into the host hip-end). Logged as a dead-end.

- **DONE + approved (2026-06-05): the SE "wing" — HALF-HIP + OVERHANG off a gable** (`buildHalfHipOverhang`).
  Antonio: "excellent job." Verified in render: G coplanar (one continuous slope), E overhangs (wall
  step), hip-end D, hha ridge > sub ridge, and the **ridge↔hip continuity holds** (sub ridge flows into
  the D–G hip — confirmed analytically at (0,−S) and visually). Small triple-point notch at the junction
  (cosmetic, can clean). Built in isolation WITHOUT the central (sub's +Z end is a gable-wall stub).
  Structure of the SE wing it models:
  - **Central main hip** = facets **I / L / F / K**.
  - **Sub prim** (a connector GABLE) = facets **G / L**; **L shared/coplanar with central** (the
    sub↔central meld is the SAME as the done `buildDimHipGableExt` pattern — already solved).
  - **Ext' of the sub = a HALF-HIP ("hha")** = facets **G / E / D**; **G shared/coplanar with the sub**.
    NEW work = meld hha to the sub.
  - **HALF-HIP def:** a whole hip cut perpendicular to its ridge → either side is a half-hip. It has a
    **direction vector** (tail at the cut, head pointing toward the hip-end). "hha points at the sub" ⇒
    its hip-end (D) faces the sub.
  - **OVERHANG (general, off a gable host):** the ext's two ewidth "sloped lines" (valley lines) — **one
    starts INSIDE the host gable's SPAN** (= gable-end base) **and one OUTSIDE**; they connect into a
    prim. The outside part overhangs. **This special case:** one sloped line (facet **G**) is **coplanar**
    with the sub (no valley there); the other (facet **E**) overhangs past the sub's span. hha's ridge is
    HIGHER than the sub's (hha is wider). **Level eaves** with everything hha touches (simplifies it).
  - **Conjecture to verify:** when a gable + hip share a coplanar facet, the gable RIDGE and the hip's
    hip-line (off the coplanar slope, i.e. the D–G hip) **connect continuously** (one unbroken pencil
    line) — a ridge↔hip transition. Check it holds in the render.
  - **Parked simplification:** the lower-left ext (A) actually melds onto an intermediate sub (B/C/K),
    not directly into facet I — ignore for now; same principles.
- **NOW (in progress): RECONSTRUCT the Crestridge roof from the prim decomposition Antonio gave.**
  **Measurements are on disk** — `~/Downloads/68324055.PDF` (EagleView). Per-facet areas (A→L,
  smallest→largest): A45 B59 C101 D123 E301 F326 G349 H365 I429 J478 K742 L1036 sqft. **All pitch 8/12.**
  Skeleton (length diagram p.4): Ridges 58 Hips 191 Valleys 87 Rakes 58 Eaves 252 ft, all segments
  dimensioned. Render diagrams: `pdftoppm -f 5 -l 8 -r 160 -png <pdf> /tmp/ev` (file pp.5-8 = report
  Length/Pitch/Area/Notes; +1 page offset).

  **DEGENERATION (Antonio's new lexicon):** a facet is *degenerated* when an ext has **spawned** from it
  OR it's been **diminished** — i.e. its NATURAL prim shape is altered. Natural hip = 2 isosceles
  trapezoids at a ridge + 2 opposing end-triangles (symmetric); natural gable = 2 rectangles at a ridge.
  Hierarchy: **mains override subs override exts** (a sub outranks an ext; a sub is named ext-of-the-sub,
  not host-of-the-deeper-ext).

  **THE DECOMPOSITION (p1–p6, all 12 facets):**
  - **p1** = central **HIP**, facets **I/L/F/K**. I is **diminished**. **CONFIRMED (Antonio) orientation:
    ridge N-S** (p1 is the dominant 2533-sqft mass; K=W side, L=E side are the long trapezoids; F=N end,
    I=S end the triangles, **I diminished/south**). **L is the big coplanar EAST face** (1036 sqft) shared
    & extended down the whole east side by p2 (N) and p4 (SE). Built: `buildCrestridge()` STAGE 1, looks good.
  - **p2** = **half-hip** `H/J/L` (J=hip-end). Shares L coplanar with p1. North. Spawns from p1.
  - **p4** = **gable SUB** `G/L` (L shared w/ p1). Spawns from p1.
  - **p3** = **half-hip** `G/E/D` (G shared w/ p4). Spawns from **p4** (the SE wing = our
    `buildHalfHipOverhang` pattern). 
  - **p5** = **sub** `C/B/K` (K coplanar w/ p1, extends from I). Spawns from p1.
  - **p6** = gable `A/K` (K coplanar w/ p1). Extends from sub **p5**; host p1.
  - **Recursion present:** p3←p4←p1 and p6←p5←p1 (ext-on-ext / sub-as-host).

  **PLAN / STAGES** (`buildCrestridge()`, one shared plane table + max-of-tents, verify each by screenshot):
  - **VERIFICATION TOOL (done):** `/skins` **PLAN mode** (default on; toggle "PLAN" button) — flat
    labeled facets (A–L at centroids via `buildCrestridge().labels`) + a compass matching EagleView
    (N up-right ~30°) + a NORTH-UP top-down (camera up=+Z; plan group scaled x=−1 to un-mirror so
    east=right/west=left). Screenshots now overlay-compare directly to the EagleView notes diagram.
  - [x] **STAGE 1: p1** central hip, I diminished. **RIDGE CORRECTED N-S → E-W** during STAGE 5: the
    grounded footprint is ~52 E-W × ~46 N-S (long axis E-W) ⇒ ridge E-W, length 52−46 = **6 = the "+6"**.
    My earlier "area logic" (K/L biggest ⇒ N-S sides) was wrong — L/K are big because they're the
    coplanar faces EXTENDED by the wings (degeneration), not because p1 is long N-S. Proportions caught it.
  - [x] **STAGE 5 (p1+p2 portion): proportions grounded in feet.** Wx=26 Wz=23 (52×46, ridge=+6),
    p2 west eave −14 (the 12-ft step from K@−26), J north eave +37 (40 wide). PLAN view now overlays the
    EagleView central+north correctly (J/H/F/K/L/I placed right). Proportions no longer a verification scapegoat.
  - [ ] **STAGE 2: +p2** north half-hip (J hip-end, ridge N-S ⟂… actually ‖ p1's, shares L coplanar east).
  - [x] **STAGE 3: +p4/p3** SE wing DONE. p4 (gable sub, min(G,L) — L coplanar p1, G coplanar p3) built
    in hierarchy order BEFORE p3 (half-hip G/E/D); the recursion p3←p4←p1 renders clean. **Lessons:**
    (a) build main→sub→ext, never skip a level — an ext is defined relative to its host; junction artifacts
    = an undefined connection, not an engine bug. (b) a prim's visible footprint can be **non-rectangular**
    (spawn+overhang ⇒ L-shape) — **mesh the FULL footprint**; truncation = an unmeshed sub-region (STRAYS
    S10). The 3 defined degenerations: **melt/spawn, diminish, half-hip** (truncation is NOT one). SE facet
    `D/E/G` render full. Build order in code: `maxTents([p1, p2, p4, p3])`; regions include the SE overhang.
  - [x] **STAGE 4: +p5/p6** SW DONE + **Antonio "spot on"**. p5 (sub, min(K,B,C)) built before p6 (gable,
    min(K,A)); both coplanar w/ p1 at K (west), meld into diminished I. **ALL 12 FACETS A–L now render**
    in the right places — first complete reconstruction (6 prims, hierarchy order maxTents([p1,p2,p4,p5,p3,p6])).
  - [x] **STAGE 5: PROPORTIONS tuned to eps=1ft.** Measured dims now Δ0: p1 52×46 (ridge +6), "12" step,
    "40" J eave, p2 wing 15, SE gable 34, SE east eave 25, "+9" overhang 9. Left (per eps rule, don't tune
    if it risks structure): SW exact feet (approved "spot on"), SE west-eave asymmetry (23 vs 25, Δ2).
  - [x] **STAGE 6: ARTIFACTS chased** — major ones GONE (center "+6" convergence clean). Fixes (mesh-quality,
    not model): **triple-point tiling** (exact 3-plane point → 3 wedges) + **single-region mesh**
    (`regions=[boundary]`, killed T-junction seam cracks) + **R=40**.
  - **RESIDUAL DIAGNOSIS (important):** 2 sub-mm slivers at the SE/SW wing **reflex footprint corners**
    (where an overhang juts out concavely and a thin host-facet sliver pinches into the corner). **Verified
    via a facet-map debug print: the active-id SURFACE is mathematically CLEAN (perfect L/D/E bands, no
    degenerate islands) — the slivers are PURELY a grid-mesh limitation** (per-triangle crease-split drops
    sub-grid slivers at reflex corners). Tried & REVERTED: adaptive hidden-facet refinement (R=20+recursion)
    — made it WORSE (more reflex-corner slivers + T-junctions). **The per-triangle grid mesher has hit its
    ceiling.**
  - 🔖 **GIT CHECKPOINT (2026-06-05, before the analytic rewrite):** the clean grid-mesh Crestridge
    reconstruction is committed on `design-reskin` (commit msg "CHECKPOINT: Crestridge full reconstruction
    …"). If the analytic facet-map bugs out, revert to it. See `git log`.
  - [x] **STAGE 7 DONE — ANALYTIC FACET-MAP is PRISTINE.** `meshFromTentsExact(tents, planes, boundary,
    wallH)`: each facet = `tent.rect ∩ ⋂{P≤Q}` minus where other tents win (convex half-plane clipping +
    subtraction), fan-triangulated. **ALL wing-junction slivers + the central-convergence notch are GONE**
    (verified by tight crops); facets meet at exact points; razor-sharp at high zoom (resolution-
    INDEPENDENT — exact polygons, not grid-sampled). `buildCrestridge` now calls it (grid `meshFromTents`
    kept for `buildDimHipGableExt`/`buildHalfHipOverhang`). Walls reuse the boundary+sampleH path.
    **The Crestridge roof is now production-pristine** — ready for the build-phase layering (laps/components).
  - [x] **STAGE 8 DONE — cinematic SHOT SEQUENCE on the PLAN view** (Antonio). Scroll-driven 6-keyframe path
    `PLAN_KF` in `skins.tsx`, interpolated in `CameraRig`'s plan branch (lerp pos + normalized up-vector +
    lookAt target, easeInOut): (1) **DRONE** bird's-eye high/small `pos[4,250,-1.99] up[0,0,1]` → (2) **DROP**
    `[4,110,…]` roof grows → (3) **TILT** `up[0,0.55,0.83]` → (4) **HERO ¾** `pos[64,78,80] up[0,1,0]` (whole
    roof in 3-D glory) → (5) **ORBIT** `pos[-48,82,60]` → (6) settle **BACK TO OVERHEAD** `pos[4,124,-2]
    up[0,0,1]` (working north-up view). **Labels A–L + compass are gated to the settled overhead only**
    (`overhead = progress > 0.95`, a boolean state set in the ScrollTrigger `onUpdate`; passed to `GablePrim`,
    also gates the compass) so the whole drone→hero→orbit "glory" run reads clean. Verified by 6 rendered
    frames (`/tmp/seq-{drone,drop,tilt,hero,orbit,overhead}.png`): drone/hero clean, overhead shows the aids.
    tsc clean. **NEXT: resume skin design at the overhead view** (the labeled working view).
  - **(STAGE 7 plan, for reference):** replace the grid mesher with an ANALYTIC FACET-MAP. Plan: each tent =
    {planeIds, supportRect}; for each (facet P, tent T) → base = footprint ∩ supportRect ∩ ⋂_{Q∈T}{P≤Q}
    (convex, via half-plane clip); then SUBTRACT each other tent U's winning region {∀q: P<U_q} (convex
    bite) → P's exact polygon pieces; triangulate (fan). Coplanar-shared P (e.g. L in p1/p2/p4) = union of
    its per-tent pieces (they tile, share edges exactly). Gap-free/seam-free/resolution-independent because
    facet P (clipped by {P≤Q}) and facet Q (clipped by {Q≤P}) share the EXACT crease line; triple points =
    exact half-plane intersections. Keep the WALLS from the existing `meshFromTents` path; replace only the
    roof half. **Revert to the checkpoint if it misbehaves.**
  - **(historical STAGE 5 note): TUNE PROPORTIONS to within eps = 1 ft.** **SCALE: model units ARE feet**
    (Wx=26⇒52ft, "12" step=12u, "+9"=9u) ⇒ eps = 1 unit. **eps RULE (Antonio):** structure is correct &
    proportions aren't causing structural problems, so tune each dim to within 1 ft of the EagleView length
    diagram — BUT only if it doesn't cause/risk structural issues. (If a feature causes structural issues →
    attack it; if tuning a safe feature stays safe → do it to within eps.) Length-diagram feet: top 40, W 48,
    E 55, NW step 12 (+ "15"), hips 31/31/36/22/13/21, valleys 31/18/18/15/7, ridges 15/+6/+9/7/11, SE
    23/25/17+17/+9, SW 12/12, center 10. Then verify PLAN overlay + no new artifacts.
  - [ ] **STAGE 5 (DO NEXT, reordered per Antonio): GROUND THE PROPORTIONS in EagleView feet** for the
    p1+p2 scaffold *before* adding wings. **Why:** proportions are NOT a trivial final scaling — if they're
    off, a wing mismatch can't be attributed (concept failure vs. scaling artifact). Get them "close
    enough" that proportions can't be blamed for a verification failure, so each stage is signal not noise.
    Extract the footprint polygon + node coords from the length diagram (`/tmp/ev-05.png`; lengths: top
    eave 40, W eave 48, E eave 55, the 15+12 NW step, hips 31/31/36, ridges 15/+6/+9, SW rakes 12/12, SE
    rakes 17/17, eaves 23/10/25). Verify p1+p2 in PLAN mode overlays the plan's central+north to scale.
  - **THEN** STAGE 3 (SE wing p4/p3, the recursion) → STAGE 4 (SW p5/p6). No TRUE model gap spotted yet.
  Main risks: dense central convergence (+6 node) + the recursion. Read RULES + STRAYS + WORKING-MEMORY.

### 🔖 CHECKPOINT (model handoff Opus → Sonnet, 2026-06-05)
- **Conversation/session to revert to:** `db0c07a5-4417-4b49-b4ee-c25ebc7eb5d5`
  (`~/.claude/projects/-Users-antoniomartinez-dev-SigmaRoofingWebsite/<id>.jsonl`).
- **Code checkpoint commit:** `b53b117` (full `b53b1179164b75a5d086c0d974bee7c24864671b`) on branch
  `design-reskin`, tagged "CHECKPOINT (Opus→Sonnet)". Captures solver2.ts + skins.tsx + all roof docs
  at this exact good state. To restore the roof state:
  `git checkout b53b117 -- client/src/lib/tr3 client/src/pages/skins.tsx .context`.
- Everything that produced KEPT results is in `ROOF-GEOMETRY-RULES.md`; the strays are quarantined in
  `ROOF-STRAYS.md`. If Sonnet's output regresses, revert to the commit + resume the session above.

- **Dead-ends** now live in `ROOF-STRAYS.md` (the quarantined "strayed" batch), separate from the clean rules.
- **Data pipeline:** EagleView report 68324055 (4354 sqft, 12 facets, 8/12, Crestridge Dr). Xactimate
  `.ESX` is **encrypted** — use EagleView DXF/XML or Hover JSON, NOT the ESX. Keep claim PII local.

### tr3 PRODUCT VISION (Antonio, 2026-06-05) — why pristine matters
The roof is the centerpiece of a **scroll-driven experience seen by millions**; as you scroll, the roof
**graduates in phase with the real ROOF-CLAIM PROCESS** (the current skin-switcher becomes phase-switcher):
1. **INSPECT** — roof shown with **test squares** (chalk marks marking hail damage / damaged components).
2. **ADJUSTMENT** — "the approved insurance SCOPE includes the roof diagram" (≈ this faithful PLAN/3-D view).
3. **BUILD** → **tear-off** → **underlayment** → **finished roof** (each phase = its own roof-layout visual +
   action + camera move). Underlayment phase shows **synthetic underlayment laps**, branded: **GAF WeatherWatch
   ice barrier on the eaves (signature blue look)** + **GAF synthetic underlayment on the field**, plus generic
   components — **pipes w/ pipe jacks, gas vents, a generic chimney**.
→ **Implication: the geometry must be SPECKLESS & PRISTINE, resolution-independent** (laps/components will be
   layered on it; "small enough" is not enough). Tackle artifacts to **ZERO**, not "sub-mm."

### tr3 NARRATIVE alignment + INSPECTION-phase plan (Antonio, 2026-06-05) — DESIGN DONE, awaiting OK to build
**Source grounding:** ζ-read of `~/Downloads/THE-DOOR.md` (door-to-door instantiation) + `.context/shot-library.csv`
+ `.context/BASIS-persuasion.md`. **Plain-language glossary written → `.context/GLOSSARY.md`** (Antonio asked for
term definitions; engine "prim/primitive" ≠ persuasion "primitive" — same word, two worlds; noted there).

**The reframe that governs (THE-DOOR §A / §B.4):** re-index **STATE → EVENT**. The homeowner indexes on a *state*
(visible damage); we re-index on an *event* (a named peril struck this address). Visible hail damage is the **WEAK,
static** argument ("physics is a weak argument" — field-confirmed); the moving threat is the **event + clock** (the
"Silent Lien", which installs DOWNSTREAM in ADJUSTMENT, not here). So **inspection = "let the roof testify"** (§E
Step 4): the HAAG test-square ritual is **evidence the event happened here**, doing two honest jobs — **verify the
peril** (honesty-floor gate, §D.2) + **clear the scam-detector via care-density** (§F.3).

**Shot-list refinement (vs. v1):** (1) subordinate the damage-macro — *punctuation, not the paragraph* (static<moving);
(2) the MIDDLE (B2–B4) is **documentary** (static locked-offs, slow dollies = credibility), heroic shots
(crane/orbit/low-angle) ONLY at the **bookends**; (3) each chalked hit means **EVENT** ("the peril, confirmed here"),
NOT "your roof is broken"; (4) **one continuous take, no cuts** (= honesty grammar); (5) the final **bird's-eye = the
INSPECT→ADJUSTMENT seam** (evidence-grid overhead == the scope diagram).

**Inspection phase = 6-beat continuous scroll take:**
- **B0 Establish** (0–.15): glory open (crane-down + low-angle), pristine roof. "Looks fine. That's not the question." STATUS. **= the STAGE-8 cinematic.**
- **B1 Re-index** (.15–.30): dolly-in + tilt-down to one main-prim slope. "You're watching the shingles; the gauge is whether a storm hit THIS address." INVERSION.
- **B2 Instrument** (.30–.50): near-overhead STATIC; **chalk bracket draws on** (HAAG 10×10). "HAAG test square — your insurer's standard." STATUS + care-density.
- **B3 Evidence** (.50–.65): brief rack-focus→ECU/macro on one hit (don't linger); **hits chalk in** one-by-one. "Each mark = the named peril, confirmed here." CONTRADICTION (subordinated).
- **B4 Tally** (.65–.82): **pull-back-reveal** hit→full square + count stamp ("9 — to standard"). "Documented. Dated. To standard." [Z₂] · *"qualifies / insurance pays / standing"* [⚠ GATED].
- **B5 Grid/bookend** (.82–1.0): crane-up + orbit → settle **bird's-eye**; finished squares **fade onto every slope**. "One storm. Your whole roof, on the record." [Z₂] · *clock/rates* [⚠ seed].

**Transitions:** IN = the STAGE-8 drone→hero cinematic IS B0 (no cut into B1's dolly). OUT = B5 bird's-eye chalk grid
**cross-fades into the labeled PLAN/scope diagram** (A–L labels + compass) = ADJUSTMENT entry. Whole phase = ONE take.

**Honesty/legal gate (Z₂ vs ⚠):** BUILD FREELY (Z₂) — the re-index logic; the test-square/hits/count/grid visuals;
care-density precision; "a named peril struck here on [date]" (real map/date). **GATE on OK law (⚠ — render as
*structure/question*, never fact):** held-harmless cascade; claim-window/clock; "rates rise regardless"; market-turn;
**fourth-party fault** — NB "fourth party" is NOT in THE-DOOR (it has a 3-party cascade {mfr/installer/insurer} +
homeowner inheriting liability); **Antonio to define before that text-cloud is written.**

**Engine build-list (additive; new `/inspect` route OR a `phase` state on `/skins`):** `INSPECT_KF` (6 keyframes,
reuse the `CameraRig` interp); `TestSquare({facetPlane,center,size,progress})` (4 corner L-brackets seated on the
facet plane via solver `h(x,z)`+normal, draw-on by progress); `HailHits({plane,positions,progress})` (chalk rings,
reveal `floor(progress·N)`); count stamp + **text-cloud `<Html>` overlays** scroll-gated per beat (same mechanism as
the labels' `overhead` flag); expose hero-facet **plane + centroid + in-plane basis** from `buildCrestridge`.

**Decisions/defaults (decide-and-log):** hero facet = largest camera-facing main-prim slope (read off solver at
prototype; likely K/L) · bookend = YES · "Silent Lien" naming stays OUT of inspection copy (inspection only
*testifies*) · fourth-party = pending Antonio's definition.

**STATUS: FIRST PASS BUILT (2026-06-05) → `/inspect`.** New page `client/src/pages/inspect.tsx` (route in App.tsx).
`buildCrestridge(wallH = 9)` now stands the roof on a real ~9 ft house (the walls already dropped to ground — they
were just 2.6 ft short); solver2 now exposes `planes` / `boundary` / `eaveY` + `labels[].plane`. All 6 beats built as
ONE scroll-driven take (`KF` keyframes + `CameraRig`): B0 orbit → B1 hook → B2 square draws on → B3 three `( • )`
chalk-parenthesis hits (camera close, **NOT macro** — Antonio's simplification: parentheses around each hit, go
one→next→next) → B4 count stamp "3 / 8 · QUALIFIES" → B5 squares **populate on the other main slopes** (evidence
grid) + "now that you know". Editorial house: off-white walls + auto-placed windows/door from the boundary, slate
hip roof, warm key light + ContactShadows. Text capsules = 6 DOM clouds, one per beat, **EXTERNAL / scrub-driven**
(the chosen default); the B4 lien capsule carries a "draft · legal review" tag (the ⚠ honesty gate, visible).
Verified by render (`/tmp/ins-*.png`). Fixed during the pass: shadow-acne moiré (dropped `castShadow`, kept
ContactShadows), too-dark roof (lightened slate), reversed parens, tight framing (pulled cameras back).
**NEXT — iterate (Antonio's open list):** aesthetic concept; #clouds + internal cloud-cycles vs external scrub;
cloud cycle RATES; camera polish (B5 more top-down to read the grid); tighten parens; door/shingle texture.
`.context/NARRATIVE-SHOTMAP.md` to be written once the storyboard stabilizes (currently lives in `inspect.tsx` +
this STATE entry).

**ITERATION 3 — AESTHETIC / ENVIRONMENT (2026-06-05, Claude-led at Antonio's request "no direction from me").**
Concept DERIVED from the narrative, not taste: storm-authority (basis) × the narrative moment (just after the
named-peril event; we dropped in to inspect). Build (all in `inspect.tsx`): **gradient storm sky dome** (navy top →
slate-blue → cool horizon w/ a thin warm break; raw ShaderMaterial, fog-exempt) · **procedural slate-shingle texture**
on the roof (canvas: courses + offset tabs + value variation) · **cool storm-lawn ground** (radial-vignette canvas
tex, dark) · cool horizon fog · navy ContactShadows. **Lighting = the key lesson:** FIRST tried golden-hour (low warm
key) → from ABOVE it went **sepia** (looking down at a roof you only ever see the low/warm sky, so warm floods
everything). **PIVOTED to COOL OVERCAST-STORM daylight:** cool key `#e1e8f3` + a warm RIM `#ffc88f` (accent) + cool
navy hemisphere; toneMappingExposure 1.25. **Warmth is now an ACCENT only** — warm rim, the gold horizon sliver, and
the gold UI highlights — against a cool, moody, serious world (= the THREAT/gravity). House = clean subject; slate
shingle reads; chalk reads white on slate. No cast shadows (avoids earlier moiré); no heavy post (honesty floor: no
State-B spectacle). Verified `/tmp/ins-*.png` (heli / orbit / square). **Antonio reviews → sets aesthetic direction.**
Possible next: cooler/warmer balance, hero cast-shadows, faint vignette, ridge-cap + drip-edge detail, real shingle
photo-texture.

**ITERATION 3b — GAF GRAND MANOR shingle (2026-06-05, Antonio: "needs to be an actual shingle… beautiful, not
cartoonish").** Refs: Grand Manor "Gatehouse Slate" (installed shot + macro). Replaced the flat procedural roof with
`makeGrandManor()` → a detailed 1024² **color map + bump map**: clipped-corner tabs, random tab widths (normalized
per course so it TILES; random per-course offset so keyways don't align across tiles), deep **keyway + butt
drop-shadows** (the laminated depth), a 10-tone **Gatehouse-Slate blend** (grey/green/tan/taupe/slate), lit top-edge,
granular speckle. Roof material: `map` + `bumpMap` (bumpScale 0.5) for real catch-light; flatShading removed.
`repeat 0.26` (≈8" courses on the ~46 ft roof). Verified `/tmp/ins-orbit/hits.png`: reads as real architectural
laminated shingle at distance AND the multi-tone blend + shadow depth read in the inspection close-up; chalk still
reads. Tunable: tab scale (bigger = more Grand-Manor character close-up vs. smaller = more realistic at distance),
overall lightness. **Next strong add: hip/ridge CAP shingles** (the reference shows cap rows along every hip) — needs
the hip/ridge edges pulled from geometry.

**AESTHETIC PIPELINE DECISION (2026-06-05) — hand-rolled R3F hit its ceiling (Antonio's call).** After the Grand
Manor pass Antonio: procedural-canvas-texture + basic-light R3F "does not cut it" for the hero aesthetic → go
photoreal or a better graphics generator (he named Blender / "blender mcp"). **Diagnosis (mine):** the gap is
hand-authored ASSETS + art-direction-by-feel, NOT the engine — R3F looks great with real PBR assets/HDRI/shadows;
my weak spot is eyeballing a look, my strength is driving a real renderer with code. **Options:** (1) **Blender via
blender-mcp** (ahujasid/blender-mcp: socket addon + bpy Python + PolyHaven/Sketchfab asset pull + Cycles) as the
ASSET/RENDER FOUNDRY → bake photoreal materials/lighting/components back into the LIVE R3F scene (keeps scroll-
interactivity; needs Blender install + MCP config in Claude Code). (2) **Cheap de-risk first:** real PBR shingle +
HDRI `<Environment>` + soft shadows + light post, IN R3F (no new tooling, ~1 hr, may close most of the gap). (3)
**Blender FULL pre-render** → scrub a rendered image-sequence (max photoreal, loses true interactivity, heavier
page). (4) **Drone-capture the real roof → photogrammetry / 3D Gaussian splat** (the actual roof, photoreal,
navigable; heaviest; chalk-annotation awkward). **Fork = is live scroll-interactivity a hard requirement** (→ 1/2)
**or is a scrubbed pre-render OK** (→ 3). ζ: rendering-pipeline structural choice — keep the web runtime fast +
interactive, move asset authoring to a real renderer.

**RESOLVED (2026-06-05) via ζ — priority is ITERATION SPEED / edit-on-the-fly, NOT final polish (Antonio).** Two
candidates: LIVE R3F vs BLENDER. Real-world variance that decides it = *we change beats constantly while building the
story.* Blender (any render) → every change costs a Cycles re-render (sec–min/frame; a beat = many frames) → the
edit→see loop breaks = **Z₁** for this phase. Live R3F → edit code → Vite HMR <1s + Playwright self-check in sec →
loop guaranteed fast by a platform contract = **Z₂**. **VERDICT: STAY IN LIVE R3F for the whole storyboard phase;
keep the look "acceptable" (already there) — do NOT gold-plate now.** Separate concerns: STORY changes constantly now
(needs the fast Z₂ loop) vs LOOK = one-time polish LATER (can afford the slow tool once the story is frozen). **DEFER
Blender to a single post-storyboard-lock LOOK pass** (foundry → bake nicer materials / lighting / hip caps into the
SAME live scene, keeping personalization). Don't pay the render tax while the story's still moving.

**AESTHETIC TOKENIZATION PLAN — scene⟂skin "mask" layer (Antonio, 2026-06-05; visuals ≥ story: "a billion views needs
a million clicks" → presentation crosses the attention barrier).** SAME token-first principle already mandated
project-wide (CLAUDE.md, BASIS, sigma-design; proven on `/skins`). SEPARATE: **STRUCTURE** = the storyboard (beats,
camera keyframes, roof/chalk choreography, copy + timing) — FIXED — from the **SKIN** = a single `Skin` "mask" object
holding EVERY visual token: sky, fog, ground, light-rig + exposure, roof material, walls/trim/glass/door, chalk style,
cloud + typography styling, post. **Structure READS tokens; never hardcodes a visual.** Swap one `Skin` → the whole
look changes; a switcher A/B-tests masks live (win the click). ζ: hardcoded visuals = **Z₁** (reskin = hunt-and-break,
no A/B); skin-token = **Z₂** (one contract, story guaranteed untouched). **Blender (later) plugs in PER SKIN** (skin's
roof = a baked PBR set; sky = an HDRI) → the polish pass is a drop-in, not a rewrite. **Sequencing:** put the token
SEAM in EARLY (cheap — lift the current hardcoded PAL / lights / sky / materials in `inspect.tsx` into one `Skin`
object so every new beat reads tokens AND editing the look = editing one object = faster iteration now); author the
VARIETY of masks AFTER the storyboard locks.

**SHINGLE PROOF TEST (2026-06-05) — isolated + DELETABLE.** Antonio: skip the bake-off; just recreate the shingle
FROM HIS PHOTO fast, judge by speed × (crap-or-gold). Real GAF Grand Manor macro photo copied Desktop →
`client/public/shingle-ref.jpg` (+ the installed-house ref `shingle-house.jpg`). Built **`client/src/pages/
shingletest.tsx` + route `/shingletest`** — applies the real photo as albedo + bump (MirroredRepeat, derived relief)
on the Crestridge roof geometry under real lights + shadows. **`inspect.tsx` is NOT touched — the inspection
storyboard is fully preserved.** **TO REVERT:** delete `shingletest.tsx`, its lazy import + `<Route path="/shingletest">`
in `App.tsx`, and `client/public/shingle-ref.jpg` + `shingle-house.jpg` → back to the inspection scene exactly.
- **Midday HDRI pass (2026-06-05):** Antonio picked "bright clean midday." Downloaded a free **CC0 Poly Haven sky
  HDRI → `client/public/sky-midday.hdr`**; wired drei `<Environment files=… background />` into `/shingletest` for
  real image-based daylight + a near-overhead sun (directionalLight) for crisp shadows; ACES tone-map (dropped the
  manual hemi/ambient + NoToneMapping). Add `sky-midday.hdr` to the revert delete-list. Proves the "glow" step:
  real photo material + real sky light. The HDRI = a **skin token** (swap the file → swap the time-of-day/mood).
  **Outcome:** close-up = a believable real slate roof under real sky (clear jump from the polygon look, built from
  Antonio's photo); whole-roof reads real but **darker/cooler** than the warm Gatehouse-Slate reference (the blue
  midday HDRI cools it + the asphalt albedo is genuinely dark). Took ~6 quick passes (crop UI off the photo, kill the
  heavy bump, tone-map, brighten albedo +45% via ImageMagick, add HDRI, exposure) → confirms the lesson cleanly:
  **MATERIAL is fast (real photo); the LIGHTING GRADE is the iterative "by-feel" tax.** Net: real-photo + HDRI in R3F
  = believable + interactive + tokenizable. Warmer/brighter = swap a warmer HDRI + lighten the roof (both skin
  tokens). Still fully revertable (delete page+route+`shingle-ref.jpg`/`shingle-house.jpg`/`sky-midday.hdr`).
- **SCALE — SOLVED + correct (2026-06-05).** Authoritative GAF specs (SAM Ch.19 + Carriage House QS): field Grand
  Manor = **18″×36″, 8″ exposure, 4-1/2″ offset** single-column; hip/ridge cap (**Shangle Ridge®**) = **12″×18″, 8″
  exposure**. Our roof (real ft, 8/12 pitch): main slopes ≈27.6 ft eave→ridge → **~41 courses @ 8″**, ≈52 ft wide →
  ~17 shingles/course. Roof UV = horizontal-ft/2.2 → set `repeat.set(0.5, 0.79)` (x→36″ width; y→8″ course, incl.
  the 8/12 pitch projection). Verified by course count. Switched to lighter **Weathered Wood** (`shingle-wewo.jpg`,
  brightened +42%).
- **GRADE WALL (honest calibration).** ~9 lighting passes and the roof STAYS **navy/dark** — the blue "midday" HDRI
  dominates the up-facing roof's ambient + the realistic small-scale texture averages dark. This is the predicted
  **art-direction-by-feel limit**: material + scale = fast/correct; final beauty-grade by feel = plateau. The fix is
  a TOKEN/tool move, NOT more knob-twiddling: a **warmer sky HDRI** (the blue midday is the antagonist for a warm
  shingle) OR accept "acceptable" and **defer the grade to the polish pass** (Blender/artist). Cap spec in hand;
  awaiting Antonio's cap reference image.
- **INSTALL PATTERN — FIXED (2026-06-06, ζ Z₂).** Antonio caught the real bug: tiling a PHOTO with
  `MirroredRepeatWrapping` flipped half the tiles **upside-down** (shadow at top) + **doubled** course heights at the
  mirror seams (= Z₁ fragile). Replaced with a **procedural tile** (`makeGrandManorTile` in `shingletest.tsx`) that
  lays courses by construction: 6 courses/tile, random clipped tabs, per-course random offset (the stagger), the
  double-layer **butt shadow ALWAYS on each course's down-slope edge**, **normal RepeatWrapping** (never flips or
  doubles). `repeat(0.55, 0.66)` → true 8″ exposure on the 8/12 slope (~41 courses/main slope). Verified by render:
  consistent course height + shadow-at-butt + stagger = correct install. Color grade still cool/dark (deferred to
  polish). NEXT: hip/ridge caps (**Shangle Ridge® 12×18, 8″ exposure**) — awaiting Antonio's cap reference image.
- **STAMP METHOD — both halves combined (2026-06-06).** Antonio: don't lose the realism. Solution = procedural
  SKELETON (correct install) + each shingle face STAMPED with a real patch from the Weathered Wood photo (`drawImage`
  into the clipped tab path; sample offset precomputed per shingle so ±W wrap copies match → seamless). `makeStampedTile(img)`
  in `shingletest.tsx`; loaded via drei `useTexture` + `useMemo` (Suspense-safe; the earlier `useState`/`onload` path
  generated the tex but didn't apply — R3F swap quirk). Verified by render: correct pattern + real granule + multi-tone
  blend = **both halves at once.** Grade still cool/dark (deferred). Antonio also wanted to A/B the alt "fix-the-photo's-
  tiling" method next.
- **A/B: PHOTO-TILING FIX vs STAMP (2026-06-06).** Added `?m=tile` toggle in `shingletest.tsx`. **The fix was trivial:
  the entire original bug was `MirroredRepeatWrapping` (flips + doubles). Switching to NORMAL `RepeatWrapping` (full
  swatch, repeat 0.5/0.79) keeps 100% real-photo realism AND fixes the pattern** (consistent courses, shadow at butt,
  no flips/doubling). Verified by render — **tile method looks MORE realistic than stamp** (it's the actual photo, not
  reconstructed faces) and is simpler. Trade-off: tile may carry faint repeat seams + the swatch's partial top/bottom
  courses aren't course-aligned (a possible discontinuity at vertical tile seams) → fixable by cropping the swatch to
  exact courses. STAMP = guaranteed-perfect pattern but reconstructed/more-uniform faces. **Leaning TILE** (Antonio's
  instinct was right). Grade still cool/dark (deferred). Both selectable via `?m=tile` / default(stamp).
- **ATOM CONSTRUCTION — now the default (2026-06-06).** Antonio supplied a single whole-shingle photo (the "atom",
  `Desktop → public/shingle-atom.jpg`, 36×18, with the 1½″ annotation). Cropped its exposed tab band →
  `shingle-atomband.jpg`. `makeAtomTile(band)` BUTTS the real shingle into courses, stacks at **8″ exposure** with the
  manual's **4½″ single-column stagger** (8 courses → stagger wraps a full 36″ = seamless vertical tile), random
  horizontal flips (periodic per tile width → seamless horizontal), procedural butt-shadow per course. Real shingle
  texture + the TRUE install layout. `/shingletest` default = atom; `?m=tile` = full-swatch normal-wrap; `?m=stamp` =
  procedural+photo-stamp. Trade-off: one atom → some visible repetition (mitigate w/ per-shingle tone jitter). Grade
  still dark (deferred). Verified by render — correct staggered courses + real tabs.
- **ATOM COURSES — fixed two layout bugs (2026-06-06).** Antonio flagged (A) visible gaps between atoms within a
  course + (B) a seam at course transitions. Causes: (A) the band carried dark side-margins → butting doubled them;
  (B) the band was taller than the exposure (149px band vs 128px exp) → wrong overlap. Fix: **re-cropped the band to
  EXACTLY the 8″ exposure** (`2220×494`, butt at the bottom, no headlap/nails), stack courses **ADJACENT** (band
  height = exp, zero overlap), and draw a **keyway shadow at every butt-joint** so seams read as real keyways
  (staggered per course). Verified by render: tight butted courses, consistent 8″ exposure, no transition seam,
  shadow at each butt. Layout is now correct. Grade still cool/dark (deferred).
- **TILE method back as DEFAULT + cropped to exact courses (2026-06-06).** Antonio: revert to the swatch
  (`shingle-wewo.jpg` / image #20) method; the old "flipped courses" was the original `MirroredRepeatWrapping` (now
  normal `RepeatWrapping` → no flips). Then cropped to whole courses: measured butt-shadow lines via per-row
  brightness (`magick -resize 1x! txt:`) → y≈305/642/971/1300 = exactly **3 full courses**. Final per Antonio: just **remove the bottom clipped row** (its bottom tab details are cut off) — keep the board
  through the last full butt-line. `shingle-wewo.jpg[2048×1300+0+0]` → `shingle-wewo-tile.jpg`; tile method uses it,
  `repeat(0.53, 1.0)`. Verified: consistent courses, **no partial-course seam, no flips**. `/shingletest` default =
  this tile; `?m=atom` / `?m=stamp` still available. Grade still cool/dark (deferred). Possible remaining: faint
  horizontal (left/right) swatch seam — heal only if it shows.
- **HIP/RIDGE CAPS — step 1 DONE (2026-06-06).** Refs (3 TIFs → `/tmp/cap-*.jpg`): Shangle Ridge caps run a row of
  overlapping clipped-corner pieces up every HIP + along every RIDGE, draped over the apex, ~8″ exposure, same slate.
  Built `hipRidgeSegments()` in `shingletest.tsx`: extracts roof-mesh edges shared by 2 facets w/ different normals
  (creases), keeps only CONVEX ones (edge sits higher than both facet interiors → peak) → **23 segments tracing all
  hips+ridges, valleys correctly excluded.** Verified overhead (`?cam=top`). **NEXT (step 2): lay cap ribbons** — a
  folded slate strip draped over each hip/ridge polyline, 8″ exposure, overlapping toward the peak, using the field
  texture. (May need to chain segments into polylines + fill tiny gaps.) Color/texture = same deferred grade.
- **CAPS — step 2 DONE: geometry laid (2026-06-06).** `buildCapGeometry()` walks each convex-crease segment and emits a
  **folded tent ribbon** over it: drape `capW=0.5ft` (~6″) down each slope (perp to the crease, forced down-slope via
  `cross(n,d)` sign by `t.y<0`), apex raised `capH=0.2`, whole cap lifted `0.09` proud of the field; 4 tris/segment;
  `computeVertexNormals`. `<Caps>` mesh, placeholder color `#352f2a`. Verified by render: caps run along ridge + down
  every hip, draped over the apex, proud of the field — matches the refs. **NEXT:** cap TEXTURE (slate + the
  segmented overlapping-piece look at 8″ exposure) + fill any small gaps where a crease segment was missed. Antonio:
  "worry about the texture" after. Still all in throwaway `/shingletest`.
- **CAPS — textured (2026-06-06).** UV'd `buildCapGeometry` (x=across drape, y=along line in feet) + `<Caps>` now maps
  the field photo (`shingle-wewo-tile.jpg`, `repeat(1.6,0.5)`) → the courses cross the cap = the individual overlapping
  cap-piece divisions along each hip/ridge (matches refs). Caps render BRIGHTER than the field (their apex faces catch
  more light) → that's the deferred grade/lighting, not the texture. Verified overhead + close. **STILL TODO:** the
  GAPS (Antonio's top-down screenshot — some hip/ridge segments missed by the extractor) + overall color grade.
- **CAP MODELING TEST — `/captest` (2026-06-06).** New throwaway page (route in App.tsx). Blank **simple hip prim**
  (`solveEnvelope` 40×28, flat grey, no skin) as the test bed; analytic creases (1 ridge + 4 hips with their two slope
  normals). Antonio's model: each TAB image is the pre-exposed cap face → just **FOLD it at its vertical center
  (u=0.5 = the ridge) into a saddle**, each half flush/coplanar on its slope (via `cross(slopeNormal, creaseDir)`,
  forced down-slope), laid **in series** along each crease (`expo=0.67ft`, `drape=0.42`, slight `lift`), **color-mixed
  across 4 tabs** (`cap-tab1..4.jpg` from Antonio, 1 mesh per tab, random assignment). Verified by render
  (`/tmp/cap-*.png`): **the saddle fold is correct** — caps sit over ridge + hips, drape both slopes, segmented pieces
  in series, eaves not capped. First try landed. **REFINED (Antonio's cap rules):** (1) **cap direction vector** —
  tail at the BEAK (center of the clipped BASE) → straight TOP edge, parallel to sides; on hips it points
  **eave→ridge**, on the ridge all caps point the same way (tip→tail). Was backwards (clipped base seated at ridge);
  fixed via texture `flipY=false` (image-bottom/base → v1 → eave end f0). (2) **shadow substrate normalized** — tabs
  are double-layered (weathered-wood top over a near-black shadow poking ~1-2" past the base); the 4 source tabs'
  shadow bands ranged 29–57px, all clipped to the smallest (29px) so the shadow reads uniform across the run.
  (3) **shadow LOOK via overlap (2026-06-06)** — the shadow edge still read too heavy because each cap's TOP edge also
  carries a shadow, so a butted seam stacked the lower cap's top-shadow next to the upper cap's base-shadow = doubled.
  Fix per Antonio: don't clip more — **drag each cap DOWN ~3/4" over the one below** (`ov=0.0625ft`, scaled from 0.75in),
  reducing exposure by the same amount (`stepE = expo - ov`); the upper cap's BASE rides proud (`drop=0.035ft`) so it
  laps IN FRONT and HIDES the lower cap's top-edge shadow. **NEXT/tune:** the hip↔ridge JUNCTIONS (slight overlap where
  they meet — Antonio predicted this), drape depth, and graduate the approach back to the real roof's caps.
- **CAP CORNERS — convex ridge-ends (2026-06-06, Antonio's paper model).** Three changes to `/captest`: (1) **ridge
  vectors flipped INWARD** — the one (highest) ridge split into two runs, each based at a hip-ridge intersection (ridge
  END) pointing toward CENTER; bases/shadows face outward, caps lap toward center. (2) **closure cap** at the center
  seam where the two runs meet — one saddle piece with the substrate shadow cropped off (`vB=1-SHADOW_FRAC`), riding on
  top (nothing laps it). (3) **corner tab fold** at each ridge end — a 3" tab (`tab=0.25ft`) creased down off the ridge
  onto the END-FACET (the triangular hip-end, "where the ridge would continue straight"); the right-triangle NOTCH is
  removed so it lies flat → two sub-tabs, the upper (+Z half) riding proud OVER the lower (-Z half). Reaches the two
  hips at 3" down. **Interpretation:** tab folds onto the end-facet fall-line (not onto a single hip edge); notch
  approximated as two overlapping tris (not a literal crease). `?cam=corner` view added. **Antonio (2026-06-06): good
  enough for now — the corner-junction knit is a NITPICK to refine later (logged in PLAN).** Moving on to: integrate
  this cap line-model onto the real Crestridge roof (`/shingletest`) to see if it maps to the extracted creases.
- **CAP LINE-MODEL → REAL ROOF (`/shingletest`, 2026-06-06).** Ported the `/captest` folded-saddle builder onto the real
  Crestridge creases: `buildCapGeometry` (old simple tent) → `buildCapGeoms` (4 geoms, color-mixed cap-tabs, flipY=false,
  overlap/drag-down, base-shadow), fed by **`mergedCreases()`** — chains the extractor's per-triangle-edge segments into
  continuous collinear runs so each hip/ridge gets ONE clean cap run (base = LOW end = eave). `<Caps/>` re-enabled.
  **RESULT: maps well** — caps follow every hip + ridge as continuous runs, no fragmentation, no valleys/eaves capped.
  **REMAINING:** (a) caps read LIGHTER than the field (cap-tab photos = a different/lighter shingle + apex catches more
  light) → match cap color to field / grade; (b) corner junctions = the logged nitpick. Dev server (`npm run dev`,
  tsx server/index.ts, port 3000) had died — restarted; both pages 200, tsc clean.
- **CAP COLOR-MATCH INVESTIGATION (`/shingletest`, 2026-06-06) — root cause = the FIELD is too dark, not the caps too
  bright.** Measured in-render: field renders `~50` (dark slate-blue) but its TEXTURE (`shingle-wewo-tile.jpg`) is bright
  `141,135,134`; caps render `~100` from a `~100` cap-tab texture. **Black-albedo diagnostic:** caps still read `~55` =
  an environment/specular FLOOR from the midday HDRI (≈ the field's whole `50`). So the field is being crushed ~2.7× by
  the lighting/grade (the known "near-black under midday HDRI" deferred issue) while the caps render near their true
  tone. A `color` tint on the caps barely moved them (diffuse is a small fraction; the env/specular floor dominates) →
  tinting is the wrong lever. **What was tried + kept:** per-cap-half normal = the adjacent SLOPE normal (`upTilt` 0.2→0,
  in `buildCapGeoms`) so caps shade like the field slope they straddle — correct, removes the apex over-bright; KEPT.
  Tried + reverted: `color="#dadada"`/`#000000` tint experiments on the cap material (reverted to no tint). Note the raw
  images also differ in brightness (cap-tab `~100` vs field tile `137`) — same SAMPLE, different photo exposure → albedos
  need leveling too. **DECISION (Antonio):** strip ALL lighting effects + tonemapping + color grade/correction → render
  the scene FLAT (albedo only) → match caps ↔ field there (same sample) → THEN re-apply the effects EVENLY to both so
  they stay matched. (Isolate the variable instead of chasing it through the grade.) **NEXT:** add a neutral/flat render
  mode to `/shingletest` (NoToneMapping, no Environment, flat ambient), level the cap-tab vs field-tile albedo there,
  then restore lighting equally.
- **FLAT BED ADDED + MATCH CONFIRMED (`/shingletest?flat=1`, 2026-06-06).** New `flat` mode in `ShingleTest`:
  `THREE.NoToneMapping`, no `<Environment>`, no directional/shadows, just `<ambientLight intensity={Math.PI}>` (flat,
  normal-independent → every surface renders ≈ its albedo); neutral `#808080` bg; ground plane hidden. **RESULT: under
  flat albedo the caps BLEND into the field** — measured caps `~157` (exposed shingle face) vs field `~140` (tile incl.
  keyways), a realistic ~12% (caps show more face), vs the 2× (`100` vs `50`) chasm under lighting. So Antonio's read is
  proven: same sample → neutral lighting → they match; the mismatch was the lighting crushing the field (dim midday-HDRI
  IBL + field's dark-in-linear albedo). **NEXT (apply effects EVENLY):** re-introduce lighting rebalanced so it lifts the
  field instead of crushing it (brighter even fill + gentle directional for form) and the match holds under light — this
  is also the deferred whole-roof color-grade pass. The lit path is unchanged (default, no `?flat`); flat is opt-in.
- **BRIGHTNESS LEVELED under flat (2026-06-06).** Antonio (on the flat view): caps read ~30% darker than the field —
  "field has midday, caps have evening lighting." Since flat has NO directional/env, it can't be a lighting bias → it's
  the TEXTURES: cap-tab images avg `~102` vs field tile `~137` (same shingle sample, but the cap-tab photos were exposed
  ~30% darker). Fix: over-bright the cap material albedo — `capLevel = 1.34` → `color={new THREE.Color(1.34³)}` in
  `Caps` (a >1 multiplier on the map; holds under any lighting). RESULT under flat: cap strip `145,141,140` ≈ field
  `145,140,139` — even. `capLevel` is the tunable knob. **REFINING (2026-06-06):** Antonio still reads caps ~12–16%
  dark by eye. Built a **labeled brightness picker** in `shingletest`: caps now built PER crease (`buildCapGeomsByCrease`
  → `CREASE_CAPS`, each = `{mid, len, geoms[4 tabs]}`); `Caps()` under **`?label=1`** tints each hip/ridge line a
  different `+%` over `CAP_BASE=1.34` and pins a drei `<Html>` `+X%` label at the line midpoint. Antonio views
  `?flat=1&label=1` and picks the % whose caps vanish into the field; then lock it as the single level. Default
  (no `?label`) renders all caps at `CAP_BASE`. **Range revised 2026-06-06:** Antonio's eye → 12–16% too low, **+20% is
  close** → +30% still low → **Antonio LOCKED +33%.** So the cap albedo multiplier is now `CAP_LEVEL = CAP_BASE×1.33 =
  1.34×1.33 ≈ 1.78` (consts `CAP_BASE`, `CAP_LOCK`, `CAP_LEVEL` in shingletest; all caps render at this, label or not).
  Caps now read even with the field. **DONE — brightness match.**
- **CAP GAPS — next correction (`/shingletest`, 2026-06-06).** Antonio: some hip/ridge LINES have **breaks / missing
  caps** (stretches with no cap). Repurposed `?label=1`: the `<Html>` labels now show an **a–z index per crease**
  (`capIndex(ci)`, stable order from `mergedCreases()`) instead of the brightness %. Antonio will name the indexed lines
  that have gaps. **ROOT-CAUSED + FIXED (2026-06-06):** Antonio nailed it — caps were read off the TRIANGULATED MESH
  (`hipRidgeSegments` + `mergedCreases`) and stitched by shared endpoints, so any T-junction / non-coincident vertex →
  a ridge came back as two pieces (j+k), partial (b), or undetected (the o/n ridge). **Fix = derive hips/ridges from the
  ANALYTIC PLANE MODEL, not the mesh.** New `hipRidgeCreases(tents, planes)` in `solver2.ts` (mirrors the exact facet-
  polygon clipping the mesher already does): a hip/ridge is the edge where two planes of the SAME tent are equal AND on
  the surface; each plane-pair's edges are interval-merged (bridging ≤0.5ft) into ONE full line. Exposed as
  `LabeledRoof.creases: CreaseLine[]` (+ `CreaseLine` interface). `shingletest` `buildCapGeomsByCrease` now iterates
  `HOUSE.creases` (was `mergedCreases()`). **RESULT: 16 full crease lines, no fragments/gaps/missing, valleys+eaves
  excluded** (verified by render + a console dump of all 16 spans). Re-indexed a–p (old j/k/b/o/n letters no longer map).
  Antonio to re-verify `?label=1`. Dead `hipRidgeSegments`/`mergedCreases` deleted from shingletest (caps come only from
  `HOUSE.creases` now). tsc clean.
- **CAP OVER-EXTENSION FIXED + FLAT MADE DEFAULT (2026-06-06).** (1) Antonio: the new analytic creases now OVER-extend —
  a line traces a constituent PRIM's hip past a junction into a region another prim owns ("k keeps going down a hip that
  shouldn't exist past the k–i turn"). Root: a `{P==Q}` facet edge can have a THIRD prim's plane as its real neighbor.
  Fix in `hipRidgeCreases`: added `activePlane(x,z)` (the plane owning the FINAL surface) + a **structural guard** — for
  each crease edge, offset ±0.3ft ⟂ and require the final surface to actually be P on one side and Q on the other (an
  off-roof −1 side is not penalized, so eave ends survive). Edges failing → dropped → the line trims to the true
  structural extent. Verified by span dump: **k 19.5→7 (now stops at the k–i junction [14,17,-29])**; c 38.3→7, a 33.6→
  24.2, i/m/p/d trimmed where wings cover; ridges (e,g,n) + eave-reaching hips intact. (2) **`/shingletest` default is
  now the FLAT working model** (matched, caps at `CAP_LEVEL`); `?lit=1` previews the still-unbalanced lit roof. Antonio
  to point out any remaining segmenting mistakes on the flat model.
- **CAP RESIDUAL OVER-EXTENSION — diagnosed, fix deferred (2026-06-06).** Antonio: after the structural guard, a few
  lines still over-extend a LITTLE past a hip↔ridge turn — and only the EXTERIOR-angle half of the saddle shows
  (interior half overlapped by the meeting cap). Spots: **d, g, p**. **Diagnosis (d):** d = p1 hip `{L==I}`; SE wing p4
  adds ridge `i={L==G}`; they share L and cross at the triple point `L=I=G ≈[13.5,17.3,-13.5]`. PAST it d runs ~1.5ft
  alongside-and-below i — still a genuine lower-envelope crease (L,I really are the 2 surface facets), so the
  perpendicular guard keeps it. It's exactly "tracing the constituent prim's hip past the structural turn." **Why no
  quick fix:** the naive "drop a run that's alongside+below a higher crease" ALSO eats legit hip-DIES-INTO-ridge
  terminations (f/h into ridge g) → over-trims. **Correct fix = a JUNCTION-GRAPH pass:** nodes = crease endpoints +
  triple points; at each node keep only structurally-valid arms (residual = an arm that CONTINUES past a node another
  crease already turns at, vs one that TERMINATES at it). Same machinery also resolves the corner-knit nitpick. Added a
  focusable inspect cam to shingletest (`?tx&ty&tz`). Build the graph pass deliberately next (Antonio to greenlight
  scope) — NOT a heuristic.
- **BUILT junction-graph trim — residuals fixed (2026-06-06, Antonio greenlit).** `trimResidualEnds(creases, eaveY)` in
  solver2, applied in buildCrestridge after `hipRidgeCreases`. Rule: a crease END that is (a) NOT near an eave
  (`y < eaveY+3`) AND (b) NOT a node (no other crease endpoint/interior within `SNAP=0.9ft`) is a **free mid-slope
  residual** → walk inward, trim that end back to the nearest node, if within `MAXTRIM=5.5ft`. Eave ends + shared-node
  ends (hip-dies-into-ridge f/h→g) LEFT ALONE = the discriminator that protects good terminations. **RESULT (dump +
  focus renders `?tx&ty&tz`): all three flagged residuals trimmed** — d `→[17,15,-17]`⇒`→[14,17,-14]` (i's node), g
  `→[6,22,0]`⇒`→[6,22,3]` (c's node), p `→[-21,12,-23]`⇒`→[-21,12,-26]`; all 16 creases retained, eave/ridge
  terminations + b/f/h/i untouched, no new gaps (verified top + close). Caps now turn cleanly at junctions. **This same
  pass is the basis for the corner-knit** (next, if wanted). tsc clean. Antonio to eyeball `?label=1`.
- **CAP Z-ORDER RULE (2026-06-06, Antonio).** (1) Hip cap VECTORS point toward higher elevation — already satisfied
  (caps oriented base=low/eave → top=high/ridge, clipped base+shadow at the eave end, via `s.a[1]<=s.b[1]` swap +
  `flipY=false`). (2) **At a hip↔ridge intersection the cap whose line runs toward HIGHER elevation is ON TOP** (the
  piece nearest the meet). Implemented in `buildCapGeomsByCrease` (shingletest) as an **altitude-weighted extra lift**:
  per piece `eL = ZK*(weightedAlt − eaveY)`, `weightedAlt = yA·t + yB·(1−t)` (t=0 at low end a, 1 at high end b) — the
  end NEAR a higher far-end is lifted more, so the uphill cap z-orders above the downhill one at every node. Verifies:
  d(hip, far=apex 25) over i(ridge 17); g(ridge 22) over f(hip, far=eave 9). `ZK≈0.005`, uses `HOUSE.eaveY`.
- **ROOF "DONE" (Antonio, 2026-06-06) → importing into `/inspect`.** The `/shingletest` roof is complete enough to use:
  buildCrestridge geom + field shingle (TILE, `shingle-wewo-tile.jpg`) + analytic-crease caps (folded saddle, dragged
  overlap, normalized shadow, `flipY=false`, brightness-matched `CAP_LEVEL≈1.78`, junction-trimmed, altitude z-order).
  **DEFERRED (in PLAN): corner-knit** — at hip↔ridge junctions the cap needs to be properly FOLDED + NOTCHED (the saddle
  mitered around the corner); needs a model that predicts the correct ensemble there. **DONE (2026-06-06): ported
  roof+caps into `/inspect`** via a shared module `client/src/lib/tr3/caps.tsx` (`RoofCaps` component + `buildCapGeoms`,
  keyed on `roof.creases` + `eaveY`). `/inspect` field switched to the Weathered Wood TILE so it matches the caps;
  legacy `makeGrandManor` (slate) kept defined but unused. Verified across scroll beats (roof + caps + test-square
  narrative); caps read slightly lighter than field under `/inspect`'s stylized lighting = the deferred grade.
  **NEXT PHASE (STARTING): ENVIRONMENT** — exterior house walls in full detail + decide the ASSET-IMPORT method to
  "configure the CONTAINER" (the navigable scrub space). Proposed hybrid: procedural shell (EagleView-driven) + glTF/GLB
  detail assets via drei `useGLTF` + image textures/HDRIs.
- **`/inspect` FLATTENED to the working bed (2026-06-06, Antonio).** Per Antonio: strip the lighting/grade from `/inspect`
  the same way as the `/shingletest` flat model (where +33% was locked) so the roof+caps read identically, then re-add
  lighting as its OWN later step. Added a `flat` flag in `Inspect()` (**default flat**, `?lit=1` previews the
  storm-authority lighting): `THREE.NoToneMapping` + neutral `#808080` bg + flat `ambientLight(Math.PI)`; sky/fog/
  hemisphere/2 directionals/ContactShadows all gated behind `!flat`. Verified: roof field at true albedo, caps blend in
  (the match). The stylized lighting is preserved behind `?lit=1` for the eventual even-relighting/grade pass. The
  environment build (walls, assets) now happens on this flat bed.
- **ENVIRONMENT = ASSET-BASED, not procedural (Antonio's framing, 2026-06-06).** Antonio wants to "drag & drop" ready-
  made assets for the CONTEXT (siding on walls, grass with contours, a "container" = horizon/sky/clouds so it feels like
  home) — NOT model-by-trial-and-error like we did for the roof. **The rule: MODEL what must be EXACT (the roof = the
  product being sold, the real EagleView house); GRAB ASSETS for the GENERIC context (siding/grass/sky/trees/car).**
  Three asset TYPES (all live-R3F, all free CC0): (1) **textures/materials** (color+normal+roughness image sets) →
  surfaces like SIDING, brick, grass-on-ground — via `useTexture`; source Poly Haven / ambientCG. (2) **glTF/GLB models**
  → distinct OBJECTS: trees, shrubs, car, mailbox, window/door units → via drei `useGLTF`; source Poly Haven / Quaternius
  / Sketchfab-CC0. (3) **HDRI** (a 360° sky photo) → the "container" = sky + clouds + horizon + matching light, via drei
  `Environment`; source Poly Haven. Ground CONTOURS/FORM = a heightfield/terrain mesh (procedural or sculpted) wearing a
  grass texture, optionally scattered with grass/plant glTF.
- **ENVELOPE — first cut BUILT (`/inspect`, 2026-06-06).** Antonio: "drop in our whole envelope… feeling of being
  somewhere… leave it to you, iterate." Built into `/inspect` (now the **default** view; `?flat=1` = pure-albedo bed):
  (1) **sky/container** = `<Environment files="/sky-midday.hdr" background>` (the existing Poly Haven clear midday HDRI)
  → real sky + horizon + image-based light. (2) **grassy contoured ground** = `makeTerrain()` (1600ft plane, 120²,
  FLAT within ~70ft of the house so it sits true, gently rolling out to the horizon via low-freq sines × distance²) +
  `makeGrass()` (procedural green canvas tex, repeat 90 — drop-in swap for a real CC0 grass later). (3) **daylight** =
  bright hemisphere + ambient fill + a warm sun directional + ACES tonemap (exposure 1.0); ContactShadows under the
  house. Old storm-authority `SkyDome`/fog/2-dir lighting replaced (SkyDome fn kept, unused). **READS WELL: house placed
  in a yard.** Caveats/iterate: the inspection camera is roof-focused (top-down) so the SKY shows mostly as a horizon
  band — could add a wide "establish the property" opening to feature sky/horizon; the Weathered-Wood roof reads darker
  under daylight than on the flat bed (the deferred even-relight/grade); procedural grass + clear (cloudless) sky are
  placeholders for real CC0 assets. **PENDING:** confirm asset sourcing for the glTF objects (trees/car/window-door).
- **ENVELOPE REVERTED + DWELLING/SIDING started (2026-06-06).** Antonio didn't like the envelope cut → REVERTED all of
  it (grass terrain, HDRI default, daylight) back to the flat bed; the roof IMPORT (caps + TILE field) STAYS. `/inspect`
  default = flat again (`?lit=1` = stylized preview). **New framing: separate EFFECTS on the ENVELOPE from the DWELLING**
  (= the house = all prims incl. walls). **Now working the dwelling, starting with SIDING.** Confirmed external CC0
  download WORKS (ambientCG 200; Poly Haven dl 521/blocked). Pulled **ambientCG WoodSiding011** (gray weathered clapboard
  — clearest lap, neutral/tintable) via `https://ambientcg.com/get?file=WoodSiding011_1K-JPG.zip` → installed
  `public/siding.jpg` (color) + `public/siding-normal.jpg`. Applying to the walls (re-UV `V = worldY` so lap boards stay
  LEVEL all the way around even where wall height varies; wrap all 4 sides); **`<Openings/>` (windows/doors) hidden for
  now** per Antonio (just want to see siding). This proves the asset workflow: download a real CC0 texture → drop in
  `/public` → wear it. (siding swap later = replace the file / pick another WoodSidingNNN.)
- **SIDING TEST PAGE + reference matched (`/sidingtest`, 2026-06-06).** Antonio's reference = SMOOTH PAINTED light-gray
  lap siding (HardiePlank/fiber-cement clapboard — crisp boards, soft reveal shadow, NO wood grain, uniform color, white
  trim). Verdict: very achievable, and for THIS clean/uniform look a **procedural clean lap beats a CC0 photo** (CC0
  leans weathered). Built throwaway `/sidingtest` (route added): `makeLapSiding(gray, shadow)` = flat color + faint lit
  top + soft shadow into the reveal + crisp bottom edge line, on a **corner of two panels** (V keyed to height ⇒ level
  boards wrapping the corner) + white corner board + frieze trim + soft daylight (hemisphere + sun, ACES). **Matches the
  reference well.** Live dials: `?gray=bfc3c0 &board=7`(inch reveal)` &shadow=0.22 &trim=ece9e2 &tex=wood`(CC0 compare).
  Next: Antonio dials gray/board/shadow → then apply to the house walls (replace WoodSiding011) + bring windows/doors back.
- **PROCEDURAL SIDING ON THE HOUSE (2026-06-06).** Antonio picked `?gray=e8e6e0&board=8&shadow=0.20` → applied to
  `/inspect` house walls (replaced WoodSiding011). Extracted `makeLapSiding` to shared `client/src/lib/tr3/siding.ts`
  (+ `SIDING_BOARDS_PER_TILE`); `/sidingtest` + `/inspect` both import it. `/inspect` House: `siding = makeLapSiding
  ("#e8e6e0", 0.2)`, `repeat = 1/(12×8/12) = 1/8` on the world-UV walls ⇒ level 8" boards wrapping corners. Reads clean/
  white (e8e6e0 ≈ near-white) under the flat bed; the lap shadow lines are baked so they show even flat. Openings still
  OFF. Tune later (Antonio may want a more medium gray like the reference) + windows/doors back + the asset/wood option
  (`siding.jpg`/`-normal.jpg` still in /public, unused).
- **ROOF OVERHANG — fascia + soffit + recessed walls (2026-06-06).** Antonio: add fascia round the whole perimeter
  (eaves + rakes), drop 6–8" off the roof edge; recess the walls inward; eave underhang/soffit + recess = **18"**.
  Greenlit defaults: **1×8 fascia (7.25" drop)**, **solid white** (`#ece9e2` fascia / `#e6e3db` soffit, matches trim —
  chose paint over ambientCG `PaintedWood0xx` because fascia is smooth, grain fights the clean look). **MODEL:** roof
  geometry unchanged; the overhang is created by recessing the WALLS. New `client/src/lib/tr3/overhang.ts` →
  `buildOverhang(boundary, heightAt, inset=1.5, drop=7.25/12)`: (1) `insetPolygon` offsets the footprint 1.5 ft inward
  (edge-normal offset + re-intersect; handles concave corners); (2) WALLS rebuilt on the inset footprint, ground→roof,
  carrying the siding world-UV; (3) FASCIA = vertical ribbon along the ORIGINAL perimeter, `ya → ya-drop`; (4) SOFFIT =
  flat ribbon at `ya-drop` back to the inset wall. **Engine hook:** added `heightAt(x,z)` to `LabeledRoof` +
  `buildCrestridge` (reconstructs sampleH = max-tent/min-plane) so the eaves come out level + the gable rakes follow the
  slope — exact, not eyeballed. Wired into `/inspect` House() (walls=`OVERHANG.walls` siding, +fascia +soffit meshes;
  dropped the old wall re-UV IIFE since the inset walls are pre-UV'd). **VERIFIED** via throwaway `/inspect`-style page
  `/overhangtest` (free orbit cam `?cx&cy&cz&tx&ty&tz`, raking light so the form reads; `?dbg=1` colors fascia RED /
  soffit BLUE): debug render confirmed fascia 7.25" vertical at the roof edge, soffit ~18" deep horizontal underside,
  walls recessed 18" behind — geometry correct. tsc clean, no page errors. **CAVEAT:** on `/inspect`'s current FLAT bed
  (no lighting) the near-white fascia/soffit/siding blend into one band — the eave only reads as 3-D form once lighting
  is re-added (the deferred "relight evenly" step; the down-facing soffit then shades). NEXT: windows/doors back; relight.
- **DIMINISHED-FACET NOTCH — closed by RULE on `/shingletest` (2026-06-07).** Antonio defined the wall/overhang rule set
  (codified in `ROOF-GEOMETRY-RULES.md` → "Wall / overhang rules"): (1) walls drop to the FIRST surface below — roof or
  ground; (2) per-edge offset is at once the overhang, the wall recess (toward **−W**), and the underhang width: **U_e=18"
  / U_r=12"**; (3) underhang horizontal at eaves, **follows the slope at rakes**; (4) **dropped fascia kept** (≈7.25");
  (5) **prim-interface rule** — where prims meet with different eave levels the LOWER prim's roof runs *under* the higher
  eave by that eave's U_e (gives the recessed wall a roof to land on = the notch-killer). Reverted the earlier 36"
  hand-patch; the rule extension is **U_e=18"**. Built `lib/tr3/notch.ts` `buildCrestridgeNotches(wallH, U=1.5)` for
  facet I (p1 south eave z=−23, raised dimI=2) + wings G (eave x=1, +x) / B (x=−8, −x). **Key geometry insight:** facet I
  CLIMBS going inward, so the notch WIDENS with depth ⇒ the roof **tongue is a trapezoid** (xC0 = wing meets facet-I eave
  height; xC1 = wing meets facet I at the recess line) and the recessed **step-wall a triangle** (tapers to 0 where wing
  = facet I); plus an extended eave-wall at x_E closing the gap-wall↔recess-wall step. Wired into `/shingletest`
  (tongue=field shingle, walls=`#aa9e85`). **Verified both corners** closed/textured, flat + lit — no see-through. MINOR:
  tongue shingle courses are planar-projected (approximately phased to the wing) — fine at this scale, refinable. NEXT:
  generalize into `overhang.ts` (interface detection + dropped-fascia underhang) → port to `/inspect`.

- **NOTCH CORNER — RE-CLOSED in `walls.ts` (supersedes the `notch.ts` patch above; 2026-06-07).** Reverted to **s0** and
  rebuilt **pointwise** in `client/src/lib/tr3/walls.ts` (the wall/overhang finish engine), all keyed to **U = 18"
  underhang**: `recedeWalls`+`buildFascia`+`buildSoffit` (perimeter, *skip* facet I's gap eave) · `buildDiminishedEaveWall`
  + `buildDiminishedEaveFascia` + `buildDiminishedEaveSoffit` (facet I's whole eave, drop-to-`firstBelow`) ·
  **`buildNotchTongueRoof`** (wing roof slid under facet I's raised eave to the receded line z=−21.5) ·
  **`buildNotchTongueEave`** (tongue's eave fascia+soffit) · **free-wall slide** — the DIMWALL bottom is `wallBottom`
  (floor-drop region widened ±1.5 past each notch) so the free wall lands beside the wing's eave wall and the two **MEET**.
  Also root-caused the **white-strip artifact**: a `heightAt` spike at the overlapping-facet corner made `isRake`
  mis-flag the wing eave as a rake (soffit shot up) + twisted the fascia → fixed by `isRake` **interior** sampling +
  fascia/soffit spike clamps (gotcha in rules doc). **Abstraction** (rules doc → SURFACES+SEAMS): a raised eave opens an
  interior strip of width U; every normal-eave thing (roof edge, fascia, soffit, meeting wall) just extends U into it —
  *"prim-interface + U."* Both corners verified solid with real materials. **2 RESIDUALS, both FIXED (2026-06-07):**
  (i) the PIERCE through the tongue was the **wing eave wall** (`recedeWalls`), not the free wall; its top spikes to facet I (~12) vs the wing roof (~10)
  — FIX: clamp **eave** wall-tops to the edge's min `heightAt` in `recedeWalls` (rakes follow the slope). [Dead-end: first clipped the FREE-wall top instead → only notched the back wall, missed the culprit; reverted (model error, wrong wall).] (ii) the thin **sliver** where
  the two walls meet at the corner — the floor→wing-roof ramp in `buildDiminishedEaveWall` doesn't land on the wing-wall
  plane; FIXED by overlapping the free wall ~0.2 ft past each wing wall (`OVERLAP` in `wallBottom`). DONE: tongue ROOF skinned — reuses the solver's slope-aligned facet UV `(across/2.2, up-slope/2.2)` with the wing-plane
  `up`, so the shingle is continuous with the main roof (`buildNotchTongueRoof` now takes `up` + `tile`). DONE: PORTED the
  whole finish to `/inspect` (retired the uniform `overhang.ts` there) — `recedeWalls`+`DIMWALL` carry the **lap-siding**
  (their `U=x+z, V=worldY` UV already matches the siding), tongues use the shingle `field`, fascia/soffit cream; typecheck
  clean. NEXT: wall openings (windows/doors); fold the tongue+slide family into a reusable builder → `/inspect`.

- **DWELLING DRESSING — stone veneer + openings + garage on `/housetest` (2026-06-08; awaiting OK to import to `/inspect`).**
  Asset workflow (flat surfaces → ambientCG CC0 textures): chose **stone veneer** over the procedural `makeBrick` (Antonio's
  cut-ledgestone reference). Installed `public/veneer-*.jpg` = **ambientCG Bricks078** (tan fieldstone) on the SOUTH walls;
  `public/veneer95-*.jpg` = Bricks095 (cut stone, runner-up) for `/veneertest`; `public/door-wood-*.jpg` = **Wood067**
  (mahogany) for the door. Two throwaway pages + routes: **`/veneertest`** (compare stones: `?asset=078|095`, `?tile=N`,
  `?flat=1`) and **`/housetest`** (the full dressed house, free orbit). `walls.ts`: `recedeWalls` gained an **eave-top clamp**
  (kills the `heightAt` spike that pierced the tongue) + a vertical **`yClip {lo,hi}`** (splits a wall → stone base vs siding
  gable). `/housetest` materials: south walls = 078 veneer to the eave (`yClip hi=WALLH=9`), **siding gables** above
  (`yClip lo=9`), non-south = lap siding, **fascia/soffit = light grey** (`FASCIA_COLOR`/`SOFFIT_COLOR`), tongues = shingle.
  **Procedural openings** (composed primitives, proud of the south walls): `Window` (frame + divided glass), `Door`
  (mahogany stile-and-rail: wood slab + glass lite + raised panel + bronze lever/deadbolt/kickplate + sidelights + transom +
  **greige `CASING`**), `GarageDoor` (charcoal flush-panel steel + vertical-window row). Placed: **2-car garage** (16×7) on
  the largest SE gable (x=18); **double window** in the gable above it (x=18, y=11.5); **single window** on the SW gable
  (x=−17); **front door** under facet I's eave (x=−3.5). Lit with **NoToneMapping** (ACES + the cool sky HDRI were graying
  the warm tan → it read dark grey; the flat-color fix). **NEXT: import the whole package to `/inspect`** — its south-wall
  classifier + `RECEDED_BRICK` geometry already exist, so: swap `makeBrick` → the veneer, add the gable `yClip` + the
  openings + the NoToneMapping color (and verify it doesn't blow out the scroll scene's own lighting). REVERT test pages:
  delete `veneertest.tsx`/`housetest.tsx` + their routes + `public/veneer*-*.jpg` + `public/door-wood-*.jpg`.

**ITERATION 2 (2026-06-05):**
- (a) **B0 REBUILT → helicopter → drop-in → true 360 → land on facet L.** `KF`: heli `[34,230,-66]` (high, looking
  down) → drop `[86,92,-6]` (swoop, roof grows) → 6-point orbit E→S→W→N→E at radius 95 / height 58 around `C` →
  land on L `[H+50,H+30,H+20]`. B1–B5 unchanged (Marks/CLOUDS thresholds untouched). Verified `/tmp/b0-*.png` — the
  front door reads on the orbit's west pass.
- (b) **Text clouds that MOVE/CYCLE on scrub — DONE (Pudding-style).** Studied
  **https://pudding.cool/2024/07/scifi/** via Playwright (21 frames `/tmp/pud-*.png`). Pattern = a PINNED, morphing
  visual + text panels that SCROLL UP through the frame as you scrub, with KEY PHRASES highlighted in the accent
  color. Applied to `/inspect`: each beat's capsule now TRANSLATES vertically with within-beat progress (`translateY`
  +34vh→−34vh, fade only at the ends) so it rises through the frame; key phrases use `**phrase**` → `<HiText>` gold
  highlight (#dca94e). Pinned morphing visual = our 3D roof (already scroll-driven). Verified `/tmp/cl-*.png` (the
  rise across b2-low/mid/high; "or else you would" + "test square"/"HAAG standard" highlights; the lien capsule keeps
  its "draft · legal review" gate tag). This is the **external / scrub-driven cycle** Antonio flagged — chosen + built.
  Possible next: multiple sub-panels per beat ("internal cycles"), or true scroll-flow text-in-DOM for 1:1 Pudding.

---

## ACTIVE WORK (2026-06-03): PIVOT → Plan v2 (Venus Blush, luxury-editorial) — scoped to rrMVP/new pages

Design direction pivoted to **Plan v2** — verbatim at `.context/PLAN-website-v2.md` (source:
`~/Downloads/SIGMA_WEBSITE_PLAN_v2-2.md`). **Persuasion basis (THREAT/STATUS) UNCHANGED.**

- **New brand system (v2 §2):** Venus Blush — warm-black `#2C2A28` + warm-white `#F5F0EA`,
  dusty-rose `#C4897A` (CTA), sage `#7D9E82` (secondary). Type: Cormorant Garamond (display 300/700)
  + Bricolage Grotesque (body) + JetBrains Mono (data). Register: luxury/editorial/refined
  (Aman / Cereal / Monocle), restraint, one bold gesture per view. NEVER navy-on-white.
- **SCOPE (for now):** v2 is a sandbox on **rrMVP / new pages** to evaluate the plugin workflow —
  NOT a full-site reskin. The **existing site stays storm-authority** (committed). A premature
  *global* Venus Blush token swap was **reverted** (`git checkout` of index.css / tailwind.config.ts /
  index.html) so the live site isn't broken.
- **Tooling:** installing **Superpowers** (`/superpowers:brainstorm`) + **frontend-design** plugins —
  needs a **session restart** (Superpowers' session-start hook). GSAP installed; Framer Motion +
  React Three Fiber already present. Community skills (impeccable / taste / ui-ux-pro-max) still active.
- **rrMVP so far:** `/cascade` — 3D held-harmless triangle (THE-DOOR B.1), currently navy/gold +
  spinning bloom; to be re-done in Venus Blush + dialed-down motion via the workflow.
- **NEXT (after plugin install + restart):** run `/superpowers:brainstorm` on an rrMVP page; feed it
  v2 + a topology wireframe + the §1 direction; let its Visual Companion run; then
  `/frontend-design:frontend-design` builds it; multi-variant branch loop (v2 §4). Play with results.
- **RESUME NOTE:** if the session restarts for the plugin install, this file +
  `.context/PLAN-website-v2.md` + `BASIS-persuasion.md` hold everything. Just say
  "resume the v2 rrMVP work."

---

## ACTIVE WORK (2026-06-03, earlier): Persuasion-grounded design reskin

On branch `design-reskin` (NOT the auto-deploying `staging-mobile-fix`). Localhost-only,
push only on explicit OK.

- **Directional basis is locked** — see `.context/BASIS-persuasion.md` (the WORKFLOW_3
  persuasion engine instantiated on the homeowner) and the operational skill
  `.claude/skills/sigma-design/SKILL.md`.
- **Plan:** `.context/PLAN-design-reskin.md` + the approved plan at
  `~/.claude/plans/resilient-exploring-raccoon.md`.
- **Brand CHOSEN (live-approved 2026-06-03):** storm-authority Variant A — navy `--primary: 214 65% 27%`,
  warm gold `--gold: 38 82% 50%`, warm off-white `--background: 40 25% 97%`, navy ink
  `--foreground: 215 45% 15%`, `--radius: 0.5rem`. Fonts: Inter (display) + Open Sans (body) — to
  revisit toward a sturdier display later if desired.
- **DONE — Phases 0–3** (committed locally, NOT pushed; commits `c39d4a4` docs/skill, `a24b239` code):
  - Phase 0: token-layer repair — fonts now load; `sigma-*` made token-backed colors in the Tailwind
    config so every brand class follows the swap; CTAs migrated to `bg-primary`; `--gold`/`--chart-*`/
    `--sidebar-*` defined; `<title>`/meta added. (Also fixed previously-broken styles: hero's emerald
    word, footer hovers, header license text.)
  - Phase 1–2: storm-authority palette at the token layer; hero accent word → gold.
  - Phase 3: primitives tuned — bolder buttons + lift, radius 0.75→0.5rem, tighter heading tracking.
  - Dark mode confirmed **unreachable** (no theme toggle wired) — only the light `:root` matters.
- **DEFERRED — Phase 4 (hero rebuild around the basis):** skipped 2026-06-03 by Antonio. Needs
  (a) headline copy approval [legally-safe physical-damage framing; the claim-window/institutional-THREAT
  version is gated on OK legal grounding], (b) real ground-view + close-up hail-damage photos,
  (c) hero CTA→gold contrast fix + the address-aim decision.
- **Community skills installed (subordinate to sigma-design), 2026-06-03:** `impeccable`,
  `design-taste-frontend` (taste), `ui-ux-pro-max`. Reinstall:
  `npx skills add pbakaus/impeccable` · `npx skills add Leonxlnx/taste-skill --skill design-taste-frontend` ·
  `npx skills add nextlevelbuilder/ui-ux-pro-max-skill` (the last bundles 6 extra `ckm-*` skills — PRUNE them).
  They live in `.agents/skills/` (gitignored, NOT committed). sigma-design + the basis remain the law
  (most-specific-wins). Aligned craft rules already folded into sigma-design. Use these to widen options on
  NEW pages; on funnel pages, sigma-design rules.
