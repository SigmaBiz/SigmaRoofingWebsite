# STATE.md — Sigma Roofing Website

Last updated: 2026-05-18

---

## Form Investigation

**Key finding: All three issues are external service configuration problems, not code bugs. No code changes needed until external services are verified.**

### Priority Order
1. **Calendly event type** — blocking form entirely, fix first
2. **Google Places API key** — address autocomplete broken, fix second
3. **SendGrid verification** — email notifications may be silently failing, verify third

---

### 1. Calendly (PRIORITY 1 — blocking)
- **Service**: Calendly (not Google Calendar)
- **Package**: `react-calendly` v4.4.0
- **Calendly URL in code**: `https://calendly.com/aescalante-oksigma/new-meeting`
- **Integration**: Two components embed the widget:
  - `client/src/components/mvp3-contact-form.tsx` — uses `window.Calendly.initPopupWidget()` (lines 232-244)
  - `client/src/components/contact-with-calendly.tsx` — uses `PopupModal` from react-calendly (lines 458-477)
- Both listen for `calendly.event_scheduled` message event to confirm booking
- **No Calendly API key needed** — widget is a public embed, no auth required
- **Error "This calendar is currently unavailable"** comes from Calendly's widget itself, NOT from this codebase
- Likely cause: event type `new-meeting` was deleted, deactivated, or the slug changed in Calendly account
- **Status**: Paused — Antonio verifying Calendly account manually

### 2. Google Places API (PRIORITY 1, STEP 2 — address autocomplete broken)
- `GOOGLE_API_KEY` is present in `.env`
- **Root cause confirmed from server.log**: Google is returning `REQUEST_DENIED` with message `"The provided API key is expired."` 
- The code is NOT broken — architecture is correct (key is server-proxied, never exposed to frontend)
- Graceful fallback silently hides the failure — user sees 8 hardcoded OK cities instead of real predictions
- **Code path**: user types → `searchAddresses()` in `mvp3-contact-form.tsx:195` → GET `/api/address-suggestions` → `server/routes.ts:49-160` → Google Places API → fails → fallback 8 cities
- Not a code bug — credentials issue only

**APIs to enable on new key (one key covers everything):**
- **Places API** (legacy) — required for all of the following:
  - Address autocomplete (`place/autocomplete/json`)
  - Google Reviews fetch (`place/findplacefromtext/json` + `place/details/json`)
  - Business photo lookup (`place/photo`)
- NOTE: `.env.example` says "Places API (New)" but the actual code calls legacy Places API endpoints. Enable the **legacy Places API**, not "Places API (New)".
- Billing must be active on the project — Places API requires a valid payment method even for free-tier usage

**Every place GOOGLE_API_KEY is used in the codebase:**
- `server/routes.ts:53` — address autocomplete endpoint
- `server/routes.ts:438` — business photo lookup endpoint
- `server/routes.ts:501` — Google reviews endpoint (already built, see note below)
- `server/routes/address-suggestions.ts:18` — duplicate route file, appears inactive
- `minimal-server.cjs:12` — minimal fallback server, not used in production

**Where to update in Railway:**
- Go to the production service (the one with oksigma.com domain) → **Variables** tab → update `GOOGLE_API_KEY` value → Railway will auto-redeploy
- ⚠️ `.env` is gitignored — a code push CANNOT update the production key. Railway Variables is the only path to production.

**Swapping key from a different Google account:**
- Safe, straight replacement — `GOOGLE_API_KEY` is just a credential string, not tied to account-specific data
- No code changes needed, no other config to update
- The new key just needs the Places API enabled and billing active

**Key swap plan (confirmed 2026-05-18):**
- Old key (expired): `AIzaSyAGXxvULS4Gl3vGiHIS-tC95AL-IDbnJJM`
- New key (active, billing reactivated, Places API enabled): `AIzaSyComhGDVX5No7X35T9P-5PoWEogEoq-Mqw`
- Step 1 (Antonio — Railway dashboard): Production service → Variables tab → set `GOOGLE_API_KEY` to new key → Railway restarts automatically, no redeploy needed
- Step 2 (Claude — local): Update `.env` with new key for local dev
- No git commit needed or possible (`.env` is gitignored)

**⚠️ Bug flagged for Priority 2 (do not fix now):**
- The `/api/reviews` endpoint at `server/routes.ts:499` already exists and is built
- BUT it searches for **"BBAV ROOFING LLC Edmond Oklahoma"** — wrong business name
- When we reach Priority 2, this needs to be updated to search for Sigma Roofing's correct Google Business name

### 3. SendGrid (PRIORITY 1, STEP 3 — DEFERRED)
- **Root cause confirmed**: SendGrid free trial expired July 25, 2025 — account is on "End of Trial / 0 emails per month" plan
- Existing API key "Lead Gen" (stored in Railway Variables as SENDGRID_API_KEY) is still in the account but non-functional until plan is upgraded
- DNS records for domain authentication added to Squarespace (4 records: 3 CNAME + 1 TXT) — pending propagation
- Sender `aescalante@oksigma.com` created in SendGrid sender verification but not yet confirmed
- **Decision: DEFERRED** — Calendly already covers core appointment notifications. SendGrid only adds value for leads who fill the form but don't complete Calendly booking.
- **Two paths when ready to revisit:**
  - Option A: Upgrade SendGrid to Essentials ($19.95/month), add `SENDGRID_API_KEY` + `NOTIFICATION_EMAIL` to Railway Variables
  - Option B (preferred): Swap to Nodemailer + Gmail SMTP (free, `nodemailer` already installed in package.json) — ~30 min code change + redeploy
- `SENDGRID_API_KEY` and `NOTIFICATION_EMAIL` still need to be added to Railway Variables regardless of which option is chosen

---

### Other Findings
- **Twilio**: Completely absent — no package, no credentials, no references. Likely used in a prior version.
- **Contact form variants (3 exist)**:
  1. `mvp3-contact-form.tsx` — 3 fields (phone, address, serviceType), opens Calendly popup on submit
  2. `contact-with-calendly.tsx` — 3 fields, uses React PopupModal
  3. `contact.tsx` — 10 fields, no Calendly, uses preferred date/time fields instead
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — empty, not configured (not needed)

---

## Status
- Priority 1, Step 1 (Calendly): COMPLETE — was a reconnection issue, now fixed
- Priority 1, Step 2 (Google Places autocomplete): COMPLETE — new API key deployed, confirmed working 2026-05-18
- Priority 1, Step 3 (SendGrid): DEFERRED — trial expired, Nodemailer swap (~30 min) is the preferred fix when ready. Calendly covers core use case in the meantime.
- Priority 2 (Google Reviews): Backend fixed (business name updated to "SIGMA ROOFING LLC"). Frontend already wired in testimonials.tsx. Live review display not yet verified on production.
- Priority 3 (SocHub): COMPLETE — deployed 2026-05-19. See SocHub section below.

---

## SocHub — COMPLETE (deployed 2026-05-19)

### What was built
- **Backend**: `social_videos` table in schema.ts, MemStorage methods, 3 API routes (GET/POST /api/social-videos, DELETE /api/social-videos/:id)
- **Admin**: "SocHub Videos" tab in /admin — paste a URL + title, platform auto-detected, delete button per video
- **Frontend**: /social page — full video grid with YouTube iFrame embeds, TikTok blockquote embeds, direct HTML5 video, Instagram link cards. Social profile buttons at top. CTA to booking form.
- **Homepage**: SocHubTeaser section between Projects and Testimonials — shows up to 4 videos, links to /social. Hidden automatically when no videos have been added yet.
- **Footer**: Real social links — TikTok (@sigmaroofing405), Instagram (@sigmaroofing405), Facebook (Sigma Roofing LLC search)

### How Antonio adds videos
1. Go to oksigma.com/admin → SocHub Videos tab
2. Paste a TikTok, YouTube, Instagram, or direct video URL + a title → click Add
3. Video appears on /social immediately and in the homepage teaser (up to 4 most recent)

### Platform detection logic
- URL contains `tiktok.com` → TikTok embed (blockquote)
- URL contains `youtube.com` or `youtu.be` → YouTube iFrame
- URL contains `instagram.com` → Instagram link card
- Everything else (Cloudinary, .mp4, etc.) → HTML5 video

### What's NOT done yet
- YouTube channel doesn't exist yet — Antonio needs to create it
- TikTok embed requires TikTok's embed script to be loaded — this may need a script tag added to index.html if TikTok videos don't render. Simple fix when Antonio has TikTok videos to test.
- MemStorage resets on server restart — videos added via admin will disappear on Railway redeploy. This is the same limitation as project gallery. If persistence is needed, a Postgres connection or localStorage sync is the fix (separate task).

### Social handles confirmed
- TikTok: @sigmaroofing405
- Instagram: @sigmaroofing405
- Facebook: Sigma Roofing LLC (page)
- YouTube: not created yet
