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

## Priority 4: SocHub Phase 2 — IN PLANNING

### Feature 1: Facebook inline embed support
- [ ] Detect `facebook.com` URLs in platform auto-detection (currently falls through to "direct")
- [ ] Embed Facebook videos inline via `<iframe src="https://www.facebook.com/plugins/video.php?href=URL">` (no API key needed)
- [ ] Add Facebook-branded placeholder card when thumbnail not available
- [ ] Add Facebook to `/api/tiktok-thumbnail` proxy OR create separate proxy — FB oEmbed needs app credentials, so placeholder is fine for now

### Feature 2: SocHub reviews + follows section
- [ ] Add "Help Us Grow" section on /social page below video grid
- [ ] Google review CTA button — links to Sigma Roofing Google review page (need Antonio's Google Business Place ID or review URL)
- [ ] Social follow buttons (TikTok, Instagram, Facebook) with follower-focused copy ("Follow for more job walkthroughs")
- [ ] Consider adding this section to the homepage teaser as well

### Feature 3: SocHub nav link in header
- [ ] Add "Watch" or "SocHub" link to the main site navigation (header.tsx)
- [ ] Should be visible on homepage so visitors can find the video page without scrolling
- [ ] Decide placement: nav bar item, or a banner/badge on the hero section

### Blocked on
- [ ] Antonio's Google Business review URL (for the review CTA button)
- [ ] Antonio to create YouTube channel (YouTube content not available yet)

## Priority Order
Phase 2 items are independent — can do in any order. Facebook embed is ~30 min. Reviews/follows section is ~1 hr. Nav link is ~15 min.
