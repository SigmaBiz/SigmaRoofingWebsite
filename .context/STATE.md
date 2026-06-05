# STATE.md — Sigma Roofing Website

Last updated: 2026-06-05

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
| Design reskin (persuasion-grounded) | ACTIVE — see PLAN-design-reskin.md + BASIS-persuasion.md; on branch `design-reskin` |
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
pre-flight checklist is `.context/ROOF-WORKING-MEMORY.md` — **read both before any roof prompt.**

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
  - [ ] **STAGE 7 (IN PROGRESS): replace the grid mesher with an ANALYTIC FACET-MAP.** Plan: each tent =
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
