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
- **NEXT (handed to Sonnet):** #13 parallel-spawn / overhang → #14 dormer → #15 wing → faithful
  Crestridge recreation. Read `ROOF-GEOMETRY-RULES.md` (canonical kept rules) + `ROOF-STRAYS.md`
  (what NOT to do) + `ROOF-WORKING-MEMORY.md` (pre-flight) before touching `client/src/lib/tr3/`.

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
