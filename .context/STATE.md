# STATE.md — Sigma Roofing Website

Last updated: 2026-05-19

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
| SocHub Phase 2 | IN PLANNING — see PLAN.md |

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

## SocHub Phase 2 — Next Session

Three features planned (see PLAN.md for full detail):

1. **Facebook inline embed** — detect facebook.com URLs, embed via Facebook video plugin iframe (no API key needed). ~30 min.

2. **Reviews + follows section on /social** — "Help Us Grow" section below video grid: Google review CTA button + social follow buttons with follower-focused copy. **Blocked on**: Antonio's Google Business review URL (the direct link customers use to leave a review — find it in Google Business Profile dashboard).

3. **SocHub nav link in header** — add a "Watch" or "SocHub" link to the main site header so visitors can find the page without scrolling. ~15 min.
