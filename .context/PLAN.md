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

## Priority 5: Persuasion-grounded design reskin — ACTIVE
See `.context/PLAN-design-reskin.md`, `.context/BASIS-persuasion.md`, and the approved plan at
`~/.claude/plans/resilient-exploring-raccoon.md`. On branch `design-reskin`.

## Priority Order
Phase 2 items are independent — can do in any order. Facebook embed is ~30 min. Reviews/follows section is ~1 hr. Nav link is ~15 min.
