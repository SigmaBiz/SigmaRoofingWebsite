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

## Priority 3: SocHub — COMPLETE (2026-05-19)

### Backend
- [x] Add `social_videos` table to shared/schema.ts
- [x] Add storage methods to server/storage.ts (get, create, delete)
- [x] Add API routes to server/routes.ts (GET/POST /api/social-videos, DELETE /api/social-videos/:id)

### Admin Panel
- [x] Add "SocHub" tab to client/src/pages/admin.tsx
- [x] Build SocialVideoManager component — paste URL + title, platform auto-detected, delete

### Frontend
- [x] Create /social page (client/src/pages/sochub.tsx) — full video grid, social profile links, CTA to form
- [x] Add route in App.tsx
- [x] Create SocHubTeaser component for homepage — up to 4 featured videos, link to /social
- [x] Place SocHubTeaser in home.tsx between Projects and Testimonials
- [x] Update footer social links with real handles

### Remaining / Future
- [ ] TikTok embed script may need to be added to index.html (test when Antonio has TikTok videos)
- [ ] Video persistence — MemStorage resets on redeploy. If this is a pain point, add Postgres or localStorage sync
- [ ] Antonio to create YouTube channel
- [ ] Cloudinary direct video upload (drag-and-drop for self-hosted videos) — deferred, not needed until Antonio wants to self-host

## Priority Order
Fix funnel first. Reviews second. SocHub third. All three now done or in-progress.
