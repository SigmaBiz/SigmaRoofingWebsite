# ESTIMATE-COST-CAP.md — cost model, abuse caps, CAPTCHA, and the greenlit build

> **Scope:** how `/estimate` stays free/cheap and bot-proof at launch. The single source for the
> Google cost math, the layered defense (CAPTCHA + daily cap + GCP quotas + budget alert), the GCP
> console state Antonio has set, and the **build spec greenlit 2026-06-16** (satellite image swap +
> 150/day cap + post-quota capture + invisible Turnstile CAPTCHA). Read with `ESTIMATE-PAGE.md` (the
> page build) and STATE.md §"ROOF-IMAGE cost analysis". **This is the compaction-proof record of the
> cost-hardening work (task #13).**

---

## 1. The cost model (per unique estimate)

Google Maps Platform free tier = **per-SKU, per-month**. Our APIs are all **Essentials = 10,000 free/mo** each
(except the OLD Solar Data-Layers image, which was Enterprise = 1,000 free/mo — the binding cap we're removing).

**OLD path (Solar DSM image) ≈ $0.10/estimate, ~1,000 free/mo:**
| Call | Price | Tier / free | Notes |
|---|---|---|---|
| Geocoding (v3) | $0.005 | Essentials 10k | address → lat/lng |
| Solar buildingInsights | $0.010 | Essentials 10k | the measurement (squares/pitch/facets) |
| **Solar Data Layers** | **$0.075** | **Enterprise 1k** | the rainbow DSM roof image — **75% of cost + the binding cap** |
| Places Autocomplete | ~$0.003 ×few | Essentials 10k | as-you-type; NOT session-tokenized (a few calls/estimate) |

**NEW path (satellite + outline image) ≈ $0.02/estimate, ~10,000 free/mo:**
| Call | Price | Tier / free | Notes |
|---|---|---|---|
| Geocoding (v3) | $0.005 | Essentials 10k | unchanged |
| Solar buildingInsights | $0.010 | Essentials 10k | the measurement **+ the outline bbox** (reuse the same call — don't double-fetch) |
| **Maps Static (satellite)** | **~$0.002** | **Essentials 10k** | real aerial photo, zoom 21, gold measured outline — replaces Data Layers |
| Places Autocomplete | ~$0.003 ×few | Essentials 10k | (fixable: session-token → near-free) |

**Net:** dropping the Enterprise Data-Layers SKU lifts the binding free tier **~1,000 → ~10,000 estimates/month**
and cuts cost **~$0.10 → ~$0.02**. Verdict locked 2026-06-16: **satellite+outline is the card image** (Antonio: "yes").

---

## 2. The "50% daily" cap math

- Each Essentials API = **10,000 free/month** ≈ **333/day**.
- **50% of daily free ≈ 167/day → we use a round 150/day** as the app cap.
- 150/day × 30 = 4,500/mo = ~45% of the 10k free tier → always free, with a deliberate buffer.
- Beyond 150/day, the page flips to the **email/phone capture** (no Google call, lead still captured).

**KEY FACT — there is no single GCP "per-day" knob for Solar.** Solar API quotas are **per-minute only**
(confirmed from Antonio's console: `FindClosestBuildingInsightsUsage per minute`, etc. — no per-day row). The
classic Maps APIs (Geocoding, Maps Static) **do** expose adjustable per-day quotas. So the real, unified per-day
cap **must live in our app** (a server counter), with GCP per-day used only as a hard backstop where it exists.

---

## 3. The layered defense (defense in depth)

| Layer | Bounds | Where | Who sets it | Status |
|---|---|---|---|---|
| **1. CAPTCHA (invisible Turnstile)** | **bots** | client widget + **server token verify before any Google call** | me (code) + Antonio (free keys) | **greenlit 2026-06-16 — to build** |
| **2. App daily cap (150/day)** | the daily **total** + fires the graceful capture | `/api/estimate` pre-check (before Google) | me (code; one-line config) | to build |
| **3. GCP per-minute (15/min)** | the **speed** (burst/abuse brake) | GCP Quotas, all 4 APIs | Antonio (console) | **in progress (see §5)** |
| **4. GCP per-day (where available)** | hard backstop | Geocoding v3/day=150; Maps Static unsigned/day→~200; Solar = N/A | Antonio (console) | Geocoding done; Static optional |
| **5. $50 budget alert** | email smoke detector | Billing → Budgets | Antonio (console) | pending |

**Why both CAPTCHA and the cap (they don't replace each other):**
- **CAPTCHA stops bots** (automated abuse) — the better tool for that than the per-minute quota.
- **The 150/day cap stops *any* surge** — including a spike of **real humans** (e.g., a video pops off). Real
  people pass the CAPTCHA, so only the cap protects you there; and the cap is what turns the overflow into a
  *lead* (the email/phone capture), not just a block.
- With CAPTCHA in front, the 15/min GCP quota is almost redundant for bots → keep it anyway as free insurance.

**Ordering guarantees graceful-first:** the app cap is a **pre-check** — on request #151 it returns the capture
*without* calling Google, so Google never sees call #151 and the GCP per-day backstops (also ~150) never actually
fire. The graceful email-capture always wins; GCP hard-caps only ever catch a bug or direct-API abuse.

---

## 4. The CAPTCHA design (invisible Cloudflare Turnstile)

- **Why Turnstile:** free, **unlimited**, runs **invisibly** (zero friction — critical on the money page),
  privacy-friendly, no extra Google entanglement. (Alt: Google reCAPTCHA v3.)
- **Placement:** gate the **submit** ("Get Estimate") — the moment the expensive buildingInsights + satellite
  calls fire. The as-you-type autocomplete runs before the gate (cheap; session-token it to near-free).
- **The real lock is server-side, not the widget:** `/api/estimate` must **verify a fresh Turnstile token**
  (POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with the secret) **before** any Google
  call. A bot hitting the API directly carries no valid token → rejected → $0 spent. The widget alone is not the
  protection; the server verify is.
- **Keys (Antonio's one step, ~2 min):** create a free Turnstile site → put `VITE_TURNSTILE_SITE_KEY` (public, used
  in the client widget) + `TURNSTILE_SECRET_KEY` (server, used in siteverify) into `.env` (NOT in chat). Dev: the
  Cloudflare-provided **test keys** (always-pass / always-block) let us build before Antonio's real keys land.
- **Graceful when unconfigured:** if `TURNSTILE_SECRET_KEY` is unset (e.g., a fresh clone), the verify should
  **skip** (don't hard-block local dev) — log a warning. Real protection engages once the key is set.

---

## 5. GCP console state (what Antonio set, 2026-06-16)

Project **`31141248090`** (personal `t.m.escal@gmail.com`). Maps Platform → **Quotas** → pick the API in the dropdown.
**Decreasing a quota needs no approval** (only *increases* above default do — confirmed on the Solar dialog).

**How to pick the right row:** look at the **Current usage** column — the row with real traffic is the one our
code uses. (This caught the v3-vs-v4 and signed-vs-unsigned forks below.)

| API | Quota row to cap | From → To | Status | How we knew |
|---|---|---|---|---|
| **Solar API** | `FindClosestBuildingInsightsUsage per minute` | 300 → **15** | ✅ done | the only Solar call we use (measurement + outline) |
| **Geocoding API** | `v3 requests per minute` | 3,000 → **15** | ✅ done | usage column: **v3 = 22**, all v4 = 0 → our code is classic **v3** |
| Geocoding API | `v3 requests per day` | already **150** | ✅ leave | a real per-day hard backstop (Solar can't do this) |
| **Maps Static API** | `Unsigned requests (…) per minute` | 30,000 → **15** | ✅ done | usage column: **unsigned/day = 8**, signature rows = 0 → our calls are **unsigned** |
| Maps Static API | `Unsigned requests (…) per day` | 25,000 → ~200 (optional) | ⏳ optional | symmetry w/ Geocoding's 150/day backstop |
| **Places API** | per-minute (Autocomplete) | → **15** | ⏳ **pending (last one)** | the autocomplete endpoint |
| Billing | $50 budget + email alert | — | ⏳ pending | smoke detector (warns, doesn't stop) |

**Ignore** every "…per minute **per user**" row (Unlimited; different mechanism) and the signed/v4 rows we never call.

---

## 6. THE BUILD — greenlit 2026-06-16 (satellite image + 150/day cap + capture + Turnstile)

Antonio: *"yes the satellite +outline will be our solution"* + *"go ahead and build the captcha into the build."*
All on branch `design-reskin`, localhost. Server is plain `tsx` (no watch) → **restart after server edits**.

**(A) Image swap — satellite+outline becomes the card image.**
- Repoint the estimate card from the Solar `dataLayers` image (`/api/roof-image` via `renderRoofSketch`) to the
  **satellite+outline** (`/api/roof-satellite?...&outline=1`, already built in `routes.ts`).
- **Reuse the measurement's `buildingInsights`** for the outline bbox — don't make a second buildingInsights call
  per estimate (keep it at 1/estimate).
- **Fallback:** if no satellite photo (or Static API error), fall back to the **facet sketch**
  (`/api/roof-facet-sketch`) as the no-photo schematic. (Both POC endpoints already exist.)
- Update `estimate.tsx` result card `<img>` source + the `MetricImage`/card wiring accordingly.

**(B) App-level daily cap (150/day) + post-quota capture.**
- In `/api/estimate`: an in-memory daily counter (date-keyed, resets at local midnight; MemStorage-style — no DB).
  `const DAILY_CAP = 150;` (one-line config).
- **Pre-check before any Google call.** If today's count ≥ cap → return `{ over_capacity: true }` (HTTP 200, no
  Google spend); else increment and proceed.
- `estimate.tsx`: on `over_capacity`, the result card flips to the **email/phone capture** — reuse the existing
  `QuoteModal` → `POST /api/quote-lead` (`logQuoteLead` writes `data/quote-leads.jsonl` first, then
  `sendQuoteLead` emails Antonio) tagged **`source: 'over-capacity'`** so these leads are distinguishable. Copy:
  "We're at capacity for instant estimates today — leave your email + phone and we'll send yours personally."

**(C) Invisible Turnstile CAPTCHA on the submit (see §4).**
- Client: Turnstile widget on `/estimate`, render invisibly, get a token on submit, send it with the
  `/api/estimate` request.
- Server: verify the token (siteverify) **before** the cap check + Google calls; missing/invalid → 4xx, no spend.
  Skip gracefully if `TURNSTILE_SECRET_KEY` unset (dev).
- Env: `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (Antonio creates the free site; dev uses Cloudflare test keys).

**(D) Optional but recommended: session-token the Places Autocomplete** so it isn't a second binding constraint
(keeps the free tier truly ~10k estimates). Cost-hardening item also tracked as task #13.

**Verification (the gate):** restart the `:3000` dev server (server edits) → Playwright-screenshot `/estimate`:
(1) satellite+outline renders in the card; (2) sketch fallback when forced; (3) with the cap temporarily set low,
the capture UI appears and a lead lands in `data/quote-leads.jsonl` tagged over-capacity; (4) Turnstile token is
sent + verified (test keys). **tsc clean on touched files.** Then update STATE/PLAN/Pulse + this doc.

---

## 7. Open threads / parked
- **Autocomplete session tokens** — not yet done; it's the one API hit a few times/estimate (the soft binding tier
  before the 10k others). Fold into the build (D) or a fast follow.
- **Outline accuracy** — `?outline=1` traces `buildingInsights.boundingBox` (a *box*, not the roof polygon) → it
  frames the roof rather than hugging an angled one. Acceptable for v1; refine later (per-facet bbox union).
- **GCP project under a personal Gmail** — `t.m.escal@gmail.com`; transfer into the oksigma org later (deferred).
- **Still Antonio's, post-build:** $50 budget alert + create the Turnstile site/keys; then the LAUNCH checklist
  (deploy, Search Console, GBP) in PLAN.md. (Places/min=15 + all GCP per-minute caps = DONE 2026-06-16.)

---

## 8. BUILD STATUS — BUILT + VERIFIED on localhost (2026-06-16)

All three pieces built on `design-reskin` and verified end-to-end (dev :3000, Playwright + curl). **tsc clean on
touched files** (only the 2 long-pre-existing `routes.ts` errors at 604/1278 remain, untouched, above my inserts).
Dev used Cloudflare's always-pass TEST keys; **remaining = Antonio's real Turnstile keys + deploy** (code is ready).

**Touched files:**
- `server/estimate/measure.ts` — 24h memo on `geocode` + `buildingInsights` so the satellite-outline image reuses
  the measurement's Solar call (1 buildingInsights/estimate, not 2). Verified: 2nd estimate = `source: cache`.
- `server/estimate/turnstile.ts` (NEW) — `verifyTurnstile(token, ip)`: skip if secret unset, reject missing/invalid,
  fail OPEN on a verify network error (money-page policy).
- `server/routes.ts` `/api/estimate` — Turnstile verify (before ANY Google call) + the 150/day cap (gates cache-
  MISSES only → cached roofs always served, never counted) → `over_capacity` response. `ESTIMATE_DAILY_CAP` env-tunable.
- `client/src/pages/estimate.tsx` — invisible Turnstile widget (mints a token on submit via `execute()`) +
  `over_capacity` → the capture card (reuses `QuoteModal`, ctaType `over-capacity`) + card image →
  `/api/roof-satellite?…&outline=1` with an onError chain (satellite → facet-sketch → static png).

**Verification (all ✅):**
- happy path (no secret) → measured 27.8 sq; **satellite+outline renders in the card** (1120² PNG, not the fallback).
- CAPTCHA (test secret set): **no token → 403**; with token → measured. The client widget minted a valid token (the
  result card appeared *with the secret set*, so the full client→server verify works).
- daily cap (`ESTIMATE_DAILY_CAP=2`): 2 live estimates measured (27.8, 44.6 sq), 3rd fresh addr → **over_capacity**
  capture card ("We're at capacity… we'll measure {address} and send it personally").
- over-capacity capture → `data/quote-leads.jsonl` line tagged `ctaType:"over-capacity"` (lead never lost).
- Playwright shots: `/tmp/cap-A-cached-result.png` (satellite card) · `/tmp/cap-B-fresh-overcapacity.png` (capture).

**ENV VARS (Antonio → `.env`, NOT chat):**
- `VITE_TURNSTILE_SITE_KEY` = Turnstile **site** key (public; `VITE_` prefix REQUIRED so the client sees it).
- `TURNSTILE_SECRET_KEY` = Turnstile **secret** key (server-only).
- `ESTIMATE_DAILY_CAP` = optional, default **150**.
- Dev test keys (always-pass; omit in prod): site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.
- **Until `TURNSTILE_SECRET_KEY` is set, verification SKIPS** — the page works; the 150/day cap + GCP quotas still apply.
- **✅ LIVE (2026-06-16):** Antonio created the Turnstile widget (Invisible mode; hostnames incl. `localhost` + `oksigma.com`) and put the real keys in `.env`. **Verified END-TO-END in a real browser:** estimate returns (real token minted + server-verified — **0 rejections** in the server log), no-token → 403, headless/automation → blocked; **both lead forms + their emails confirmed working** by Antonio. Same two keys → Railway env vars at deploy.

**Rate-limit ("busy") UX — added 2026-06-16 (Antonio's catch):** the page now distinguishes THREE no-result cases:
- **daily cap (150/day)** → `over_capacity` → the email/phone capture card (a lead).
- **per-minute (15/min) tripped** → Google `429` → `measure.ts` throws `RATE_LIMITED` → `/api/estimate` returns HTTP
  **429 `{rate_limited:true}` + `Retry-After: 60`** → the page shows a **"in high demand, try again in ~60s"** card
  (Try again / book inspection) — transient, no capture. **A 429 also DECREMENTS the daily-cap slot** (Google rejected
  it → not billed → shouldn't count). `measure.ts` maps geocode `OVER_QUERY_LIMIT`/429 + Solar 429 → `RATE_LIMITED`.
- **bad address / real error** → the existing snag/inspection card.
Dev hook: `ESTIMATE_FORCE_RATE_LIMIT=1` simulates the 429. Verified: 429 + `Retry-After`; 4 forced hits at cap=2 all
stayed `rate_limited` (cap never drained → decrement works); Playwright busy card `/tmp/cap-C-busy.png`; tsc clean.

---

## 9. PER-USER LIMIT + AUTOCOMPLETE COST — BUILT + VERIFIED (2026-06-16)

**Per-user soft limit (2 new estimates / browser / day → the "Got a question?" capture):**
- A random **clientId** stored in the visitor's browser (`localStorage` `sr_cid`) is sent with each `/api/estimate`.
  The server keeps a per-day `Map<clientId, count>` (resets at Central midnight, like the global cap). On the **3rd** new
  address → `{ user_limit: true }` → the page shows the limit card (Antonio's copy) with the **"Got a question?"** button,
  which reuses the existing `QuoteModal` question→`/api/quote-lead` capture. `ESTIMATE_USER_LIMIT` env-tunable (default 2).
- **Counts LIVE estimates only** (cache hits + the user_limit case don't count); a 429 decrements it (like the global cap).
- **Honest scope (Z₁ by design):** the clientId is spoofable — incognito / cleared storage / a fresh random id resets it.
  It deters *casual* over-use; the **hard** bounds remain the global **150/day** + **Turnstile** (blocks scripts) + the GCP
  quotas. Past the limit a determined user is funneled into the capture (their contact = the strong id you can't get
  anonymously). **No IP limiting — deliberate:** mobile carriers (CGNAT) share one IP across many real customers, so an IP
  cap would block legit traffic.
- **Verified (curl):** userA → 2 measured then `USER_LIMIT` on the 3rd (no Google call); userB independent (isolation); no
  clientId → limit skipped. Playwright card `/tmp/cap-D-userlimit.png`. tsc clean.

**Autocomplete cost — handled via DEBOUNCE, not full session tokens (honest call):**
- Tightened `searchAddresses`: call Google only after **≥4 chars** + a **350 ms** debounce (was firing 60 ms after any
  input). Cuts billed autocomplete requests ~3–4× → ~1–2 per address. Under the 150/day cap (~4,500/mo) that's ~7–9k
  requests/mo — **inside the 10k free tier, so autocomplete never costs money at our scale.**
- **Why not full session tokens:** the Places *session* discount only applies if the session is **closed by a Place Details
  call**. Our flow geocodes the typed string (no Place Details), so a session token *alone* gives **zero** benefit —
  realizing it needs a refactor (client passes `place_id` → server calls Place Details for the location, replacing geocode),
  the marginal $ is ~a wash (Place Details ≈ geocode), and the real win (free-tier capacity) the debounce already secures.
  **Verdict: deferred — not worth refactoring a shared endpoint at current scale.** Revisit if the daily cap is raised a lot.
  (`/api/address-suggestions` is shared with the home contact form — keep changes backward-safe.)

**Still open:** deploy + Search Console + GBP (PLAN.md LAUNCH) · the $50 budget alert · the outline traces a bbox not the
roof polygon (refine later) · 3 dev test leads in `data/quote-leads.jsonl` (harmless; clear at will) · full Places
session-tokens (deferred, see above).
