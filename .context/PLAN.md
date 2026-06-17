# Sigma Roofing Website Update - Master Plan

> **ACTIVE WORK (2026-06-05): tr3 3D roof — Inspection-phase scroll storyboard (`/inspect`).** Detailed tracking in
> `.context/STATE.md` (this master plan = the funnel/SocHub track). Status: B0–B5 beats built (heli→360→land, test
> square + 3 chalk-paren hail hits, count, populate) + Pudding-style rising text clouds. Aesthetic decision: STAY
> LIVE R3F (ζ: fast/editable while the story moves), tokenize visuals into a swappable skin layer, defer Blender to
> a post-storyboard-lock polish pass. Running an isolated shingle-from-photo proof at `/shingletest` (deletable).

## 🧮 ROOF ESTIMATOR — DOMINANT ACTIVE WORK (2026-06-13) — full detail in STATE.md + DOCTRINE.md + PRIM-PALETTE.md
Instant roof report from an address. FREE tier (squares+pitch+$) + PAID tier (EagleView-style linear takeoff via
blueprint→Claude vision→prim decomposition→geometry). Engine in `server/estimate/` (geometry·assemble·roof-schema·vision·measure·pricing).
- [x] FREE tier: Solar `buildingInsights` → squares ±5% + pitch + $ ballpark; `POST /api/estimate` built; kill-test passed (n=7 cohort).
- [x] FREE-tier **pricing rebuilt faithful to CloudBid V14** (per-item waste+CEILING, `(mat×1.38625 + lab×1.30)×1.10`, HIGH cap) — Lee reconciled ≤2.5% (2026-06-15).
- [x] FREE-tier **`/estimate` page BUILT** (`client/src/pages/estimate.tsx` + `GET /api/roof-image`) — hero/2,200-sf query, autocomplete + material chips → result card (squares/pitch/facets/perimeter + $ + DSM image) + 2,200 default + soft-fail→inspection + embedded `MVP3ContactForm`. Verified localhost (2026-06-15).
- [x] FREE-tier **Phase 2 — SEO BUILT** (`server/seo.ts` + `shared/estimate-seo.ts`, hooked in `server/vite.ts`): served `/estimate` HTML carries per-route title/desc/canonical/OG + `FAQPage`(6 Q&As)+`RoofingContractor` JSON-LD + `<noscript>` mirror; facts (LIC#80006734, NAP, 12 cities, socials) pulled from the live home page. Verified 2 valid JSON-LD blocks.
- [x] FREE-tier **live review rating BUILT** (`server/reviews.ts` 6h-cached Google Places + warm-on-boot; `/api/reviews` refactored to cache — cost leak fixed): served `/estimate` schema now carries real **4.8★/26 `aggregateRating` + 3 `Review`**, backed by a visible reviews strip (`ReviewsStrip`). ⏳ later: optional full SSR. ⚠ home `testimonials.tsx` hardcodes 5.0 (real 4.8).
- [x] **/estimate v2 "storyboard" redesign — Phase A** (cinematic P1): `RoofHouse.tsx` extracted from `/inspect`; scrub-rotating roof + WORKFLOW_3 text clouds + framed estimator (address→results in-frame); architectural-only; reviews/FAQ/contact + SEO intact; tsc+Vite clean. **Needs Antonio's visual pass (3D blind).**
- [ ] **/estimate v2 — Phase B:** P2 color visualizer (per-color shingle tint + 360° spin per OC-Duration pick) + migrate `/inspect` onto `RoofHouse` (re-verify /inspect).
- [x] **/estimate P2 — floating job-photo gallery + non-white background (BUILT + VERIFIED 2026-06-16):** `FloatingGallery` (rAF; 6 upright ~2× 4:3 framed photos **wrap through portal edges + ping-pong off each other** [AABB elastic]; **hover/proximity pops one to the foreground** — scale+brighten+z-50+freeze, U-margin release) behind a navy-gradient P2 + light scrim; reviews + FAQ restyled to dark-glass (were `bg-white`/`bg-gray-50`). Playwright `/tmp/p2-reviews.png`, 6/6 photos load, tsc clean. (Contact form below kept its own light styling — shared component.) Details below ↓
- [x] **/estimate mobile pass (DONE 2026-06-16):** mobile (≤767px) gets a dedicated **`ShuffleStack`** — a **literal stack of FULL-SIZE cards** (front = 88vw, 4:3, undistorted; rest peek behind) with **no in-place card motion** — just the **shuffle sequence** (land → shuffle → land; tight ~1.2s cadence — the front card deals to the back, cycling each photo to the front); **tap → blurred-background lightbox** showing that photo full-size, **swipe / ‹ › arrows cycle all 6**, dots + tap-outside-to-close. (Shingle-type-on-tap detail parked for later.) Desktop keeps the floating/portal gallery (`{!isMobile && …}`). Verified @390px (front card 88%, tap→lightbox+blur+dots, Next→next photo) + desktop unchanged (floating, 6); P1 hero+form responsive (no horizontal overflow, 3D renders). Heavier 3D-scene CWV/LCP stays the separate LAUNCH item. ✅ **Housekeeping done:** the 3 dev test leads cleared from `data/quote-leads.jsonl` (now empty; fresh leads append normally).
- [x] **✅ iPod 1st-gen CLICK-WHEEL nav (BUILT + VERIFIED 2026-06-16):** `ClickWheel` replaced the frosted-glass `SectionDial` in `estimate.tsx`. Glossy white/silver wheel pinned to the right edge — **left hemisphere peeks; hover/focus slides it fully in** (reaches the off-screen `▶▶`). **menu** (top) → LCD **sub-menu** (Estimator · Reviews · Q&A · Images · Contact · Home; current highlighted iPod-blue + ‹ chevron; Home → `/`); **◀◀**/**▶▶** = prev/next; **▶❙❙** (bottom) = **auto-tour** (steps the on-page sections ~3.6s each, never leaves the page); **center hub = an IN-SECTION CURSOR** (CHANGED 2026-06-16 — never changes section; only arcs/menu do): steps the parked section's focusable controls, wrapping — Estimator→address input→submit; Q&A→expand+highlight the next FAQ question (collapse prior); Contact→step the form fields; Reviews/Images→no-op. **Hook arrow REMOVED (blank hub); radial arc seams added.** **2nd-pass (2026-06-16): wheel goes translucent GLASS in Q&A** (`opacity 0.34`, 500ms fade) so it stops covering the questions; **field-cursor focus-steal FIXED** (`onMouseDown preventDefault`) → Contact/Estimator walk every field + wrap. **3rd pass (2026-06-16): cursor = FILL-IN fields only** (text inputs+textarea; skips Service-Type menu, lock-in toggle, Submit → no dead stops; Contact = First→Last→Email→Phone→Address→wrap), **and floating-gallery pops are suppressed while the cursor is on the wheel** (nav sets the `qaHover`/`noPop` ref). Added the **NEW `#images` anchor** to the P2 gallery wrapper. Scroll-spy order Estimator→Images→Reviews→Q&A→Contact. Craft: radial-gradient plastic + silver bezel + recessed hub + clip-path wedge press-states + grey labels (ref `26.jpeg`). Desktop-only; mobile keeps the header links. **Playwright-verified** (peek/reveal/menu + teleport assert: menu→Q&A scrolled `0→4506`); **tsc clean**. **Decisions I resolved (Antonio can redirect): play/pause=auto-tour, ~42% peek, Images→P2 top, Reviews/Images center-cursor=no-op. BUILD RECORD → `.context/IPOD-NAV.md`.** (Nav iteration: FPS-dial → half-knob → frosted stack → click wheel.)
- [x] **✅ /estimate copy + contact-bg tweaks (2026-06-16):** P1 subhead → **"Enter address — Estimate generates immediately in coverage areas in Metro OKC"**; trust line → **"Owens Corning System Reroof Estimate · No obligation"**; **"scroll ↓" hint removed** (bottom of P1); **contact section bg → subtle CREAM** (`from-[#f5f0e6] to-[#ece5d3]`) on /estimate ONLY — added a `bgClassName` prop to the shared `MVP3ContactForm` (home's contact section unchanged). tsc clean; Playwright-verified.
- [x] **✅ Click wheel ON MOBILE — remapped (2026-06-16):** was desktop-only; first-look showed the web features don't fit touch (no hover → right `▶▶` unreachable; LCD/sub-menu clipped; center cursor pops keyboard). Mobile remap (all controls on the visible LEFT hemisphere, no hover-reveal): **TOP=forward · BOTTOM=rewind · LEFT=play/pause=continuous AUTO-SCROLL** (rAF `scrollBy`, tap to roll/stop, auto-stops at bottom) **· CENTER=back-to-P1 (↑)**; LCD/sub-menu hidden on mobile; RIGHT arc off-screen/unused. Q&A glass still applies. `mobile` prop (=`isMobile`) branches every handler → **desktop unchanged**. Verified @390px (forward `0→4170`, rewind `→47`, auto-scroll `47→236` then stable on pause, center `→0`) + desktop sanity (LCD/menu/cursor intact). tsc clean. (Dev server died mid-session → restarted on :3000.)
- [x] **✅ Mobile wheel → TOP-RIGHT CORNER redesign (2026-06-16, supersedes the right-edge remap):** dedicated mobile block (`if (mobile) return…`; desktop reverted to pure desktop). Wheel tucked into the corner, ring arcing top-edge→right-edge, **~36% smaller** (Dm 138). Arc buttons: **forward ▶▶ (upper) · play/pause ▶❙❙ (mid = auto-scroll) · rewind ◀◀ (lower)**; **blank center hub = the text-field cursor** (web `center`, now skips Q&A → acts only where text fields exist: Estimator address, Contact fields). No menu/hover. Header Q&A/Contact links moved next to the logo to clear the corner. Verified @390px (center→address & Contact First→Last; forward `0→4101`; rewind `→122`; auto-scroll `→295`) + desktop unaffected (mobile hub absent, submenu intact). tsc clean.
- [x] **✅ Mobile wheel → SEE-THROUGH + 2 controls (2026-06-16):** corner wheel is now frosted **see-through glass** (no white fill, all pages) with only **FORWARD** (tap = next · **HOLD = back to P1**, pointer long-press) + the **blank center cursor** (rewind/play removed); ▶▶ icon adapts via `mix-blend-difference`; **mobile SiteHeader Q&A/Contact links REMOVED** (wheel is the only mobile nav, logo = Home). Verified @390px (forward tap `0→4093`, hold `→0`, center→address field); clean on dark hero/Q&A, subtle on cream (inherent to see-through). tsc clean. **Cosmetic (2026-06-16):** forward ▶▶ on the corner DIAGONAL (≈45°, glyph upright) + 2 embossed click-wheel creases framing it (segmented-wheel character). **Cosmetic #2 (2026-06-16, 4 touches):** wheel transparency = exact P1 text-cloud glass (`bg-white/8`+ring+`blur-lg`); creases at canonical **90°-apart** proportion (90°/180° flanking forward@135°, not bunched); **subtle pulsing ring** on the center hub (draws the eye); **P1 keyboard-lift** — focusing the address field on mobile lifts the bottom-pinned form `translateY(-40vh)` above the keyboard (P1-exclusive, resets on blur). Verified @390px; tsc clean.
- [x] **✅ Logo updated to the new OFFICIAL mark (2026-06-16):** extracted background-free from `~/Downloads/SigmaLogo_Official.pdf` (mark + "SIGMA" wordmark) → `public/sigma-logo.png` (BLACK, light bgs) + new `public/sigma-logo-white.png` (WHITE, dark bgs). Estimate header (dark hero) + estimate `SiteFooter` (navy) + shared `footer.tsx` (charcoal/home) → white; contact-form card (light) → black. Playwright-verified crisp on all three. Recipe (pdftoppm 600dpi → ImageMagick luminance-alpha → trim+pad 1024²) + the 2 still-black dark-bg usages to flag (`cube.tsx`, `hail-landingpage.tsx`) logged in STATE.
- [x] **✅ Top-bar + logo-size + copy (2026-06-16):** removed the P1 "Our Free Estimator…" subtext; enlarged the header logo `h-8→h-14` (+brand text `text-lg→text-xl`); added a **click-to-call button** — root-level `fixed top-center` pill, frosted glass like the clouds/wheel, **gold `#dca94e`** (the "Instant roof estimate" tag color), `<Phone/>` + `tel:+14059025266` (web+mobile). Verified (tel link, desktop/mobile shots); tsc clean.
- [x] **✅ Tag rename + Owens Corning disclosure (2026-06-16):** P1 gold tag "Instant roof estimate" → **"SIGMA ROOFING LLC"** (same font, text only); added OC **non-affiliation disclaimer** to the estimate footer (OC's required language: "…is an independent contractor and is not an affiliate of Owens Corning Roofing and Asphalt, LLC. Owens Corning®, Duration®… are trademarks of Owens Corning."). Not legal advice — if Sigma is a certified OC contractor, the brand agreement governs. tsc clean.
- [x] **✅ Mobile P1 keyboard fix (2026-06-16):** the P1 address form is anchored to the bottom of the GSAP-pinned stage, so the mobile keyboard covered it on a direct tap. Replaced the fixed `-40vh` lift with a **`visualViewport`-driven keyboard-aware lift** (`kbdPx` = real keyboard height → `translateY(-(kbdPx+12)px)`, mobile only) so the address field stays visible while typing, however it's focused. Contact form confirmed fine (normal flow). Verified via simulated keyboard (rest→none, kb→`-332`); tsc + prod build green. **↳ Refined after real-phone test:** a direct tap still over-shot (the browser's native scroll-into-view stacked on the lift); fixed with `onPointerDown` → `preventDefault` + `focus({preventScroll:true})` so it matches the wheel center button. Verified (tap → no scroll; lift still −332). Real-keyboard re-confirm on Antonio's phone.
- [x] **✅ Home page — logo + cream bg (2026-06-16):** unified the logo to the new official mark on every page (home header was still the old white-box `@assets` logo); enlarged it (home `w-20` family-crest, + bumped estimate header/footers); **fixed the header nav overlap** (gap + `shrink-0` logo + tighter nav spacing); **background white→CREAM `#f4efe6`** (matching /estimate) on the wrapper + header + light sections (process/testimonials/faq/services) + the contact form. Verified (bg = `rgb(244,239,230)`, header screenshot clean); tsc + prod build green. Follow-ups flagged: inner cards still `bg-gray-50` (cool on cream); `about` is a green block.
- [x] **✅ "Watch"/SocHub link disabled (2026-06-16):** `/social` has no videos yet → commented out both header nav "Watch" links + removed `/social` from the sitemap (no empty-page indexing); `SocHubTeaser` already self-hides when empty. Verified (nav has no Watch; sitemap excludes /social). **Re-enable when videos land:** uncomment the 2 nav links + re-add `/social` to `SITEMAP_PAGES`.
- [x] **/estimate section nav (DONE 2026-06-16):** **DESKTOP = a persistent frosted-glass stack `SectionDial`** in the upper-right (`fixed right-4 top-[78px]`, `hidden md:flex`) — **Estimate · Q&A · Home · Contact** as translucent-black frosted-glass pills (same glass as the estimate form). A **scroll-spy** golds the current section; hover brightens; clicking any item **portals** there. (Iterated FPS-dial → half-knob → this clean stack per Antonio's "keep it simple and aesthetic.") **MOBILE = the `SiteHeader` links** (Q&A · Contact only; the header's redundant **Home + phone were removed** — the logo is Home). Anchors: `#qa`/`#reviews` (+`scroll-mt-6`), `#contact` (pre-existing), top. Verified: active updates on scroll, portals land on-section, no label clipping, dial hidden on mobile. All on `design-reskin`, uncommitted. the P2 region (everything after the P1 scrub section — reviews/FAQ/contact) gets a background **"carousel"**: 6 of Antonio's real job photos (→ `public/carousel-1..6.jpg`, resized 1100×825 from `~/Downloads/IMG_6550,6074,6455,5892,5478,4951.JPG`) that **float/drift independently** (NOT scroll-driven — ambient, like P1's idle sway but more visible), **edge-wrap** (exit one edge → re-enter another), smoothly, and may overlap. **Uniform framing** (consistent aspect + rounded corners + subtle border/shadow), cohesive. Sit **behind** the content with a **scrim** so text stays legible. Also **replace the white P2 background** with a tasteful backdrop (navy/gradient). Clean approach = a **DOM/CSS floating layer** (absolutely-positioned framed `<img>`s, one rAF loop driving x/y drift + wrap), NOT WebGL. On `/estimate`, branch `design-reskin`.

### 🚀 LAUNCH / GET-INDEXED — what's needed before Google can show `/estimate` to people (added 2026-06-15)
**THE blocker: everything is on `design-reskin` / localhost — `oksigma.com` is still the OLD site. Google shows only what's publicly live.**
- [x] **✅ Turnstile dev-bypass REMOVED (2026-06-16)** — after Antonio's phone testing, the `TURNSTILE_DEV_BYPASS=1` line was deleted from `.env` + the server restarted; **bot wall verified restored** (no-token `POST /api/estimate` → 403). The opt-in flag still lives in `server/estimate/turnstile.ts` (off unless the env var is set) — **never set it on Railway.**
- [ ] **SHIP IT** — merge `design-reskin` → `main` + deploy through the oksigma.com pipeline (Node server, NOT a static export — the SEO injection + `/sitemap.xml`/`/robots.txt` run server-side). *(Antonio's deploy.)*
- [x] **Internal link to `/estimate`** (2026-06-15) — gold "Instant Estimate" link added to the home nav (`header.tsx`, desktop + mobile) so Google (and users) discover it; was an orphan route.
- [x] **Real `/robots.txt`** (2026-06-15) — `server/routes.ts`, allows crawl + points at the sitemap.
- [x] **Real `/sitemap.xml`** (2026-06-15) — `server/routes.ts`, lists /, /estimate, /hail-damage, /tornado-damage, /social, legal. (The old `sitemap.tsx` is a HUMAN page, not crawlable XML — left as-is.)
- [ ] **Google Search Console** — verify the domain, submit `https://oksigma.com/sitemap.xml`, "Request indexing" on `/estimate`. *(Antonio.)*
- **COST CAP + BOT-PROOFING** (project 31141248090; full design + build spec in [`.context/ESTIMATE-COST-CAP.md`](ESTIMATE-COST-CAP.md)) — layered defense, greenlit 2026-06-16:
  - [x] **Image swap** — satellite+outline IS the card image (sketch fallback) → free tier ~1k→~10k/mo, cost ~$0.10→~$0.02. **BUILT + verified 2026-06-16.**
  - [x] **GCP per-minute quotas → 15/min** (burst/abuse brake) *(Antonio, console, 2026-06-16):* Solar · Geocoding `v3/min` · Maps Static `Unsigned/min` · Places/min — **all four set ✅**.
  - [x] **GCP per-day backstop** where GCP allows — Geocoding `v3 requests/day` = 150 (already set; Solar has NO per-day, only per-minute → the real per-day cap is app-level).
  - [ ] **$50 billing budget alert** (Billing → Budgets; email-only smoke detector). *(Antonio.)*
  - [x] **App-level 150/day cap** (≈50% of ~10k free ÷ 30) in `/api/estimate`, pre-check before Google → `over_capacity` → graceful email/phone capture (reuse `QuoteModal`→`/api/quote-lead`, tagged `over-capacity`). **BUILT + verified 2026-06-16** (gates cache-misses only; over_capacity card + lead logged).
  - [x] **Invisible Cloudflare Turnstile CAPTCHA** on the submit + **server-side token verify** before any Google call (the bot wall; stacks with the cap). **✅ LIVE + verified end-to-end with real keys in a real browser 2026-06-16** (estimate + both lead forms + emails confirmed; no-token/automation → blocked). Same keys → Railway at deploy. See `ESTIMATE-COST-CAP.md §8`.
  - [x] **Per-user soft limit + autocomplete cost** (2026-06-16) — **2 new estimates/browser/day** (localStorage clientId → server per-day Map) → the "Got a question?" capture (`ESTIMATE_USER_LIMIT`=2; hard bounds stay global-150/day + Turnstile + GCP quotas; **no IP limiting** — mobile CGNAT); autocomplete cost cut via **debounce** (≥4 chars + 350ms → free under the cap). **BUILT + verified.** Full Places session-tokens deferred (Place Details refactor, marginal benefit — `ESTIMATE-COST-CAP.md §9`).
- [ ] **Local SEO / Google Business Profile** — the biggest lever for "roof estimate near me" (separate from the site; the on-site reviews/NAP reinforce it).
- [ ] **Mobile / Core-Web-Vitals pass** — the heavy 3D scene is an LCP risk on phones (a ranking + UX factor).
- *Note: indexed ≠ ranked #1 — organic for "roof cost" is competitive + slow; the faster on-ramps to traffic = GBP + paid (Google Ads / Local Services Ads) + the SocHub, all pointing at `/estimate`.*
- [x] PAID engine: blueprint render → Claude vision → prims → geometry takeoff. **LIVE-validated: Lee ridges +1%/hips exact/valleys +2%**; complex hips/ridges ±10–17%.
- [x] Prim palette (9 prims) + Solar facet-hints + confidence self-flag routing (high→number, low→inspection).
- [x] `ANTHROPIC_API_KEY` in `.env` (rotated + verified).
- [x] **M3 valley-from-footprint BUILT + ITERATED to convergence (`roof-valleys.ts`):** MEASURE (don't count) — gradient-ascend the
  distance-transform from each reflex corner, stop at the node. iter1→3: Crest +54%→+27%→**−2%**, Hinkle +109%→+20%→**+15%** (from the
  +100–480% that killed every pixel method). Lee stuck −58%, DIAGNOSED = flush-wing valley starts mid-edge (no footprint corner).
- [x] **NEUTRINO (Pauli decoherence): valleys derive from Solar's per-facet CONSTELLATION (azimuth+plan-area+position), vision-free.**
  A flush cross-wing can't hide — it's a N/S (or E/W) facet pair even with no footprint corner. `facet-probe.ts` + `roof-wings.ts`:
  **3605 = 0 ✓exact, Lee = −3% ✓ (was −58%!)**; breaks on hips (Hinkle/Crest) where DT-ascent already wins (−2%/+15%).
- [x] **Architecture: VISION-FREE deterministic valley engine via a COMPLEXITY ROUTER** — simple/flush → facet-constellation
  (`roof-wings.ts`); complex/hip → DT-ascent (`roof-valleys.ts`). Mutually-exclusive blind spots → full coverage, NO vision, ~$0.
- [x] **iter-6 hip test (iteration-1 FEEDBACK, not verdict):** DT-ascent from convex corners → Crest −79%, Hinkle −26%, Lee false +55.
  Feedback: hips need their own (looser) bend-θ; gate gable corners via constellation azimuth.
- ❌ **COP-OUT DELETED:** "complex roof → LOW → book inspection" removed as an answer. Confidence routing only for genuine DATA failure.
  **GOAL (no escape hatch): full deterministic takeoff — squares·pitch·valleys·HIPS·ridges·rakes·eaves — ≤5% on ≥90% of ALL roofs.**
- [x] **HIP campaign iterated (no cop-out):** mask/DT methods all hit the 0.1m resolution wall — bend heuristic dead (no single θ fits);
  skeleton (`roof-skel.ts`) Crest −6% but 3605 +61% / Hinkle −39% (opposite-sign errors = resolution wall, not tunable).
- [ ] **NEXT — build the CONSTELLATION → PRIM RECONSTRUCTION → EXACT ENGINE** (the ε-path; uses Solar's good azimuth+area, not the mask):
  R1 cluster facets (azimuth opposite-pairs=ridges, perpendicular adjacencies=hips/valleys) · R2 size each prim (bbox/area/center) ·
  R3 emit `RoofStructure` · R4 `assemble`→takeoff; validate hips/valleys/ridges vs EV on all 4 roofs to ε.
- [ ] **Wire the full deterministic takeoff into `POST /api/measure` + `/estimate`** (squares+pitch+$ + linear takeoff). Ship.
- [ ] GCP daily cap (~200/day); Antonio's real $/square; more EagleViews to widen validation beyond n=4.

---

## Priority 1: Fix the Funnel (form must work)
- [x] Calendly calendar integration — FIXED, was a reconnection issue
- [x] Google Places address autocomplete — FIXED, new API key deployed, confirmed working
- [x] Google Reviews backend — FIXED, updated to search "SIGMA ROOFING LLC", deployed
- [ ] Email notifications — DEFERRED. SendGrid trial expired. Switch to Nodemailer + Gmail (~30 min) when ready. Calendly covers core use case for now.

## Priority 2: Google Reviews Integration
- [x] Backend `/api/reviews` endpoint — already built, business name fixed
- [ ] Verify live reviews loading correctly on homepage after deploy
- [ ] Update fallback reviews in testimonials.tsx (still reference "BBAV Roofing")

## Priority 3: SocHub — Phase 1 COMPLETE (2026-05-19)

### Phase 1 — Done
- [x] Backend: social_videos table, storage methods, API routes
- [x] Admin: SocHub Videos tab — paste URL, auto-detect platform, delete
- [x] /social page: thumbnail grid (YouTube inline, TikTok → new tab), social profile links, booking CTA
- [x] Homepage teaser: SocHubTeaser between Projects and Testimonials (hidden until first video added)
- [x] Footer: real social links (TikTok, Instagram, Facebook)
- [x] TikTok thumbnail proxy: backend /api/tiktok-thumbnail fetches oEmbed thumbnail server-side

---

## Priority 4: SocHub Phase 2 — COMPLETE (shipped in commit 532b0a1)

### Feature 1: Facebook inline embed support
- [x] Detect `facebook.com` URLs in platform auto-detection
- [x] Embed Facebook videos inline via Facebook video plugin iframe
- [x] Facebook-branded placeholder card when thumbnail not available

### Feature 2: SocHub reviews + follows section
- [x] "Help Us Grow" section on /social page below video grid
- [x] Google review CTA button — VERIFY it points to Antonio's real Google review URL
- [x] Social follow buttons (TikTok, Instagram, Facebook) with follower-focused copy

### Feature 3: SocHub nav link in header
- [x] "Watch" link added to the main site navigation (header.tsx)

### Still outstanding (carried)
- [ ] Confirm Antonio's Google Business review URL is wired to the review CTA
- [ ] Antonio to create YouTube channel (YouTube content not available yet)

---

## Priority 5: Design — PIVOTED to Plan v2 (Venus Blush, luxury-editorial)

**Canonical design plan:** `.context/PLAN-website-v2.md` (Venus Blush + Cormorant/Bricolage,
luxury/editorial). Persuasion basis (THREAT/STATUS) unchanged — `.context/BASIS-persuasion.md`.

- **Now:** v2 is a sandbox on **rrMVP / new pages** (trialing the Superpowers + frontend-design
  plugin workflow). The **existing site stays storm-authority** (earlier reskin, committed on
  branch `design-reskin`; its plan `.context/PLAN-design-reskin.md` is now historical/scoped to
  the existing site).
- **Build workflow (v2 §3-4):** topology wireframe → `/superpowers:brainstorm` (visual companion)
  → `/frontend-design` → multi-variant branch loop. Needs the two plugins installed + a session
  restart.
- **Done so far:** persuasion basis + `sigma-design` skill; token-layer repair; storm-authority
  skin (existing site, committed); community skills installed (impeccable/taste/ui-ux-pro-max);
  GSAP installed; `/cascade` 3D rrMVP (navy/gold — to be redone in Venus Blush).
- **Next:** install plugins → restart → brainstorm + build an rrMVP page in Venus Blush.
- **Deferred:** Phase 4 hero rebuild (needs copy + photos + OK legal grounding); full-site v2 redo
  (later). Photography is the ceiling (v2 §6) — real drone + detail job photos = highest leverage.

**Resume session after restart:** `db0c07a5-4417-4b49-b4ee-c25ebc7eb5d5`

---

## Priority 6: tr3 — 3D roof-generation engine (prim modeler) — ACTIVE

Recreate a real EagleView roof from PRIMITIVES. Engine: `client/src/lib/tr3/solver2.ts`. Demo `/skins`.
**Spec = `.context/ROOF-GEOMETRY-RULES.md` (canonical kept rules) + `ROOF-STRAYS.md` (what NOT to do) +
`Pulse.md` (pre-flight). Read all three before any roof work.**

### Done + Antonio-approved (2026-06-05)
- [x] Prim model = **max-of-tents** (host undisturbed; ext deleted where host taller)
- [x] Hip + gable prims, ewidth, caps, inward **melt** (valley falls out of the max)
- [x] **Coplanar / facet-K shared** (parallel spawn, hip host, no valley on that side)
- [x] **Diminished slope** by rafter-fraction (8% example) — modest, melt stays generous
- [x] **Walls eat roofs** — separate-region meshing + vertical **step-walls** (no bridge)
- [x] **Crisp facets** — split triangles at exact plane-equality crease + analytic per-facet normals
- [x] Reference build `buildDimHipGableExt` renders clean (hips/valleys/ridges sharp, gable wall, wall-eat)

### Hip/ridge CAP line-model (`/captest` → `/shingletest`) — refinements to revisit (Antonio, deferred nitpicks)
Cap model works + maps onto the real roof: folded saddle tabs, dragged-down overlap, normalized shadow substrate,
**analytic-crease extraction from the plane model** (`hipRidgeCreases` in solver2 — full lines, no mesh fragments) +
**junction-graph trim** (`trimResidualEnds` — free mid-slope residuals trimmed to their node) + **altitude z-order**
(uphill cap laps over downhill at hip↔ridge meets). Antonio (2026-06-06): **"the roof is done"** — imported into
`/inspect`. Detail in STATE.md.
- [x] **Cap brightness/color match** — DONE: caps brightness-matched to the field under the flat working model
  (`CAP_LEVEL≈1.78`), verified by levels + z-order. (Whole-roof even-relighting under stylized light = a separate
  deferred grade pass, not a cap issue.)
- [ ] **CORNER-KNIT (hip↔ridge junction caps) — the one remaining roof TODO.** Where hips meet a ridge, the junction
  cap must be properly **FOLDED + NOTCHED** — the saddle mitered/wrapped around the corner per Antonio's paper-tab
  model — not just trimmed-to-node + z-ordered (clean, but not a real corner piece). **Needs a model that predicts the
  correct ensemble** for each junction type (ridge-end Y, hip-into-ridge T, pyramid peak): which tab folds/notches, in
  what order. Build deliberately when revisited; the junction-graph nodes are the basis.

### Dwelling / envelope (`/inspect`) — wrapping the finished roof into a real house body
- [x] **Clean lap SIDING** on all walls — procedural painted clapboard (`makeLapSiding`, shared `lib/tr3/siding.ts`);
  Antonio's pick `gray=e8e6e0 / board=8" / shadow=0.20`. World-UV (U=x+z, V=worldY) ⇒ boards stay level + wrap corners.
- [x] **Roof OVERHANG** — fascia (1×8, **7.25" drop**) hung off the **whole roof edge (eaves + rakes)** + flat **soffit**
  + **walls recessed 18" inward**. New `lib/tr3/overhang.ts` (polygon inset + fascia/soffit ribbons), driven by new
  `HOUSE.heightAt(x,z)` so eaves come level + gable rakes follow the slope. Geometry verified (fascia 7.25", soffit 18")
  via debug-colored render at throwaway `/overhangtest` (`?dbg=1` colors fascia red / soffit blue; free orbit cam). Detail in STATE.md.
- [x] **Diminished-facet NOTCH closure — rule-derived.** Codified the wall/overhang rule set in `ROOF-GEOMETRY-RULES.md`
  (wall-drop-to-first-surface; U_e=18"/U_r=12"; recess −W; underhang; **prim-interface rule**: lower prim runs under the
  higher eave by U_e). Built `lib/tr3/notch.ts` for facet I + wings G/B — because facet I climbs inward the tongue is a
  **trapezoid** + the step-wall a **triangle**. Verified both corners on `/shingletest` (no see-through). TODO: generalize
  into `overhang.ts` (detect interfaces, dropped-fascia underhang) → port to `/inspect`.
- [ ] **Wall openings (windows + doors)** — bring `<Openings/>` back (omitted while siding + overhang landed).
- [ ] **Even relighting/grade** — re-add lighting to `/inspect` (flat now). The down-facing soffit will then shade, which
  is what makes the eave read as 3-D form (in flat albedo the near-white fascia/soffit/siding blend by design).

### Next (handed to Sonnet — one Z₁ case at a time, verify by screenshot)
- [ ] #14 **Parallel-spawn / overhang** — ewidth endpoint past the host eave; overhang is a full prim
- [ ] #15 **Dormer** — ext on a sub-prim, interface base above the host eave
- [ ] #16 **Wing = ext-on-ext** — host is a sub-prim (recursion)
- [ ] Faithful **Crestridge** recreation (EagleView 68324055: 4354 sqft, 12 facets, 8/12)
- [ ] Data pipeline: pull real geometry via EagleView DXF/XML or Hover JSON (the `.ESX` is encrypted)

### 🔖 Checkpoint (Opus → Sonnet handoff, 2026-06-05)
Session to revert to: `db0c07a5-4417-4b49-b4ee-c25ebc7eb5d5`. Code checkpoint = commit `b53b117` on
`design-reskin` ("CHECKPOINT (Opus→Sonnet)"). See STATE.md → 🔖 CHECKPOINT for restore steps.

## Priority Order
Phase 2 items are independent — can do in any order. Facebook embed is ~30 min. Reviews/follows section is ~1 hr. Nav link is ~15 min.
