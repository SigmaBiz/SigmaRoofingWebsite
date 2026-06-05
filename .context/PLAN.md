# Sigma Roofing Website Update - Master Plan

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
`ROOF-WORKING-MEMORY.md` (pre-flight). Read all three before any roof work.**

### Done + Antonio-approved (2026-06-05)
- [x] Prim model = **max-of-tents** (host undisturbed; ext deleted where host taller)
- [x] Hip + gable prims, ewidth, caps, inward **melt** (valley falls out of the max)
- [x] **Coplanar / facet-K shared** (parallel spawn, hip host, no valley on that side)
- [x] **Diminished slope** by rafter-fraction (8% example) — modest, melt stays generous
- [x] **Walls eat roofs** — separate-region meshing + vertical **step-walls** (no bridge)
- [x] **Crisp facets** — split triangles at exact plane-equality crease + analytic per-facet normals
- [x] Reference build `buildDimHipGableExt` renders clean (hips/valleys/ridges sharp, gable wall, wall-eat)

### Next (handed to Sonnet — one Z₁ case at a time, verify by screenshot)
- [ ] #14 **Parallel-spawn / overhang** — ewidth endpoint past the host eave; overhang is a full prim
- [ ] #15 **Dormer** — ext on a sub-prim, interface base above the host eave
- [ ] #16 **Wing = ext-on-ext** — host is a sub-prim (recursion)
- [ ] Faithful **Crestridge** recreation (EagleView 68324055: 4354 sqft, 12 facets, 8/12)
- [ ] Data pipeline: pull real geometry via EagleView DXF/XML or Hover JSON (the `.ESX` is encrypted)

### 🔖 Checkpoint (Opus → Sonnet handoff, 2026-06-05)
Session to revert to: `db0c07a5-4417-4b49-b4ee-c25ebc7eb5d5`. Code checkpoint = the git commit on
`design-reskin` tagged "CHECKPOINT (Opus→Sonnet)". See STATE.md → 🔖 CHECKPOINT for restore steps.

## Priority Order
Phase 2 items are independent — can do in any order. Facebook embed is ~30 min. Reviews/follows section is ~1 hr. Nav link is ~15 min.
