# STATE.md — Sigma Roofing Website

Last updated: 2026-06-03

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

## ACTIVE WORK (2026-06-03): Persuasion-grounded design reskin

On branch `design-reskin` (NOT the auto-deploying `staging-mobile-fix`). Localhost-only,
push only on explicit OK.

- **Directional basis is locked** — see `.context/BASIS-persuasion.md` (the WORKFLOW_3
  persuasion engine instantiated on the homeowner) and the operational skill
  `.claude/skills/sigma-design/SKILL.md`.
- **Plan:** `.context/PLAN-design-reskin.md` + the approved plan at
  `~/.claude/plans/resilient-exploring-raccoon.md`.
- **Brand nomination:** storm-authority (navy/slate + warm gold) — verify by render.
- **Key discovery:** the token layer is half-broken — fonts never load (Inter/Open Sans named
  but never imported), conversion CTAs hardcode emerald (bypass `bg-primary`), ghost classes
  `sigma-gold`/`sigma-dark` undefined, ~718 hardcoded palette utilities. Phase 0 repairs this
  before any reskin.
- **Next step:** finish Phase 0 (token-layer repair), then render brand variants for a pick.
