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

## Priority 3: SocHub — IN PROGRESS
### Architecture decided: TikTok embeds + YouTube embeds + direct Cloudinary video upload

### Backend
- [ ] Add `social_videos` table to shared/schema.ts (id, title, url, platform, order, isActive, createdAt)
- [ ] Add storage methods to server/storage.ts (get, create, update, delete)
- [ ] Add API routes to server/routes.ts (GET/POST /api/social-videos, DELETE /api/social-videos/:id)

### Admin Panel
- [ ] Add "SocHub" tab to client/src/pages/admin.tsx
- [ ] Build SocialVideoManager component — paste URL + title + platform, save, reorder, delete
- [ ] Extend Cloudinary uploader to support direct video uploads (resource_type: video)

### Frontend
- [ ] Create /sochub page (client/src/pages/sochub.tsx) — full video grid, social profile links, CTA to form
- [ ] Add route in App.tsx
- [ ] Create SocHubTeaser component for homepage — 3-4 featured videos, link to full SocHub page
- [ ] Place SocHubTeaser in home.tsx between Projects and Testimonials
- [ ] Update footer social links with real handles (currently placeholder buttons, no URLs)

### Blocked on
- [ ] Antonio's social handles (TikTok, Instagram, Facebook, Snapchat)
- [ ] Antonio to create YouTube channel

## Priority Order
Fix funnel first. Reviews second. SocHub third. But plan all three now so architecture decisions account for everything.
