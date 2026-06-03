---
name: sigma-design
description: >-
  Front-end design discipline for the Sigma Roofing website (oksigma.com). Use for ANY visual,
  UI, CSS, styling, branding, layout, component, design-token, color, typography, hero, or
  conversion-page work on this site — especially reskins and anything touching the home page or
  the booking funnel. Encodes the persuasion basis (THREAT/STATUS/CONTRADICTION/IRONY), the
  token-first rule, the brand direction (storm-authority), and the conversion guardrails. Read
  this before writing front-end code here.
---

# Sigma Design — the law of the land

The site is a machine with one job: turn post-hail OKC homeowners into booked inspections.
Every design decision is a **persuasion** decision, not a taste decision. Full reasoning lives
in `.context/BASIS-persuasion.md`; this skill is the operational rule set.

## The non-negotiables (read first)

1. **Token-first. Never hand-edit components to reskin.** ~70–80% of the visual identity is
   CSS vars in `client/src/index.css` (`:root`), the Tailwind theme (`tailwind.config.ts`), and
   font loading (`client/index.html`). Change those → everything reskins at once, one
   reversible commit. Per-component `className` rewriting is the Z₁ path that mauls the funnel —
   don't. (Known debt: some CTAs hardcode emerald and bypass `bg-primary`; migrate them TO
   tokens, don't add more hardcoded colors.)
2. **Conversion integrity beats fidelity.** At every change, verify the money-protecting orders:
   phone CTA still one tap · form still above the fold on mobile · booking still the loudest
   element on the page · LCP did not regress · fonts actually load. A prettier site that books
   fewer jobs is a failure.
3. **Honesty floor (a theorem).** Quality is SHOWN, never declared — no "award-winning",
   superlatives, or badge theater. Differentiation must be backed by real substance (real
   project photos, real reviews, real speed). Spectacle-without-substance resolves to "scam"
   and is forbidden (this is State B — reject it).
4. **Localhost only. Section-by-section approval. Push only on explicit OK. Never auto-merge
   to main.** Work on a non-deploying branch (the live branch auto-deploys to oksigma.com).

## The persuasion basis (the 2×2 you design around)

|                | LEVEL (static)                  | RATE (moving — pulls harder)         |
|----------------|---------------------------------|--------------------------------------|
| ENERGY (stake) | STATUS — seen/judged            | THREAT — boundary breached, a clock  |
| INFO (gap)     | CONTRADICTION — "snapshot false"| IRONY — "your movie is false"        |

Laws: **static < dynamic** (rate out-pulls level) · **landing = inner product onto a REAL
installed detector** (you reveal real leverage, never fabricate) · **attention = energy spent
resolving a prediction-error aimed at THEIR own situation.**

Homeowner instantiation:
- **CONTRADICTION** = the visual hook: "looks fine ≠ is fine" (hail damage invisible from the
  ground). Lands in imagery / the reveal.
- **IRONY** = the headline grab (RATE, sharpest): being careful (waiting for visible damage) is
  the exact thing that costs them the roof.
- **THREAT** = the energy: the roof is the boundary over family + biggest asset; aim it at THEIR
  address (the address-autocomplete is the aiming instrument). ⚠ Claim-window mechanics are
  OK-regulated/unverified — lead with CONTRADICTION + IRONY (true, safe); don't state claim law
  as fact until legally grounded.
- **STATUS** = the sustain: the gaze of neighbor/buyer/insurer; social proof.
- The **re-sign** ("your roof is an asset") is the SALE — **withheld** on the website. The ask
  is the small reversible one: free inspection.

## Brand direction

**Storm-authority** = deep navy/slate base (carries THREAT/STATUS gravity) + warm gold accent
(clears the scam-detector, does the cradle). The skin must do BOTH — de-threat AND carry
gravity. Pure warm under-carries gravity; evolved-green IS the competitor template (zero
prediction-error → invisible) — avoid. Type: a sturdy display (e.g. Archivo/Sora/a slab) for
headlines + a warm, highly-legible body sans (Inter/Source Sans 3) for older eyes on phones.
**Decide final palette + type from real renders/screenshots, not adjectives.**

## Process (the order, every time)

brand direction → **tokens** (the 60%: index.css vars + Tailwind theme + font loading) →
**screenshot loop** (fidelity + funnel/mobile guard; turn it OFF for animated/moving elements,
or it loops "fixing" non-bugs) → **shared primitives** (Button/Card/Input: radius/shadow/scale)
→ **hand-touched sections** with restrained motion (`framer-motion` is installed), gating on
mobile/LCP/funnel each time.

The screenshot loop controls *fidelity* ("did I build what I intended"), not *direction* ("is
what I intended any good"). Give it the money-protecting orders above as its checklist.

## Scope

This skill governs the **skin** (the open grab + supplying direction + the guardrails). The
richer copy work (the IRONY/CONTRADICTION teaching, the lien, hail-calibration imagery) is a
separate, legally-gated content plan — see `.context/BASIS-persuasion.md` "Scope".
