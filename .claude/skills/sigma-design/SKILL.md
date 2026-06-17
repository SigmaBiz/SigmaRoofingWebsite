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

## Craft execution rules (mined from community skills, 2026-06-03)

Vetted against our value gradient and folded in from `impeccable` (pbakaus) and `taste`
(Leonxlnx). These govern *execution quality* under the basis above. (`ui-ux-pro-max` is a
separate CSV/CLI reference database — query it for options when you want a parts catalog; it has
nothing to inline.)

**Calibration dials — set for Sigma (trust/clarity, not experimental):** Variance LOW–MED ·
Motion LOW · Density MED (breathing room for older eyes on phones).

**Color & contrast (load-bearing for trust):**
- Body text ≥ 4.5:1 contrast; large/bold ≥ 3:1; placeholders too. The #1 failure is muted-gray
  text on a tinted near-white — if close, push the body color toward ink. VERIFY on our
  navy-slate-on-warm-white.
- ⚠ The warm cream/sand/beige body bg (OKLCH L .84–.97, C<.06, hue 40–100) is *the* saturated AI
  default of 2026. Carry warmth via the GOLD accent + type + real photos, NOT the body bg. Prefer
  a near-true off-white (chroma ~0) or a navy-tinted neutral over generic cream.
- Tint neutrals slightly toward the brand hue (navy), never "toward warm because it feels warm."

**Typography:** ≤3 families (we run 2); pair on a contrast axis; hierarchy via scale (≥1.25 step)
+ weight, not more fonts. Body line length 65–75ch. No all-caps body (uppercase only for ≤4-word
labels). Display letter-spacing floor ≥ -0.04em. `text-wrap: balance` on h1–h3, `pretty` on prose.

**Layout:** vary spacing for rhythm; cards are the lazy answer (never nested); flex for 1D, grid
for 2D; `repeat(auto-fit, minmax(280px,1fr))` for breakpoint-free grids; semantic z-index scale
(never 999/9999).

**Motion (and the screenshot-loop trap):** intentional only; ease-out exponential (no
bounce/elastic); `prefers-reduced-motion` alternative required. Reveal animations must ENHANCE an
already-visible default — never gate content visibility on a class-triggered transition (it never
fires on headless renderers / hidden tabs → section ships blank; this is also why we screenshot
with motion OFF). Avoid the uniform section-fade reflex.

**Copy (the hero grab + all marketing text):** every word earns its place; open with the reader's
wrong belief, the strongest claim, or the example — no throat-clearing; take a position; name
names, use numbers. Button labels = verb + object ("Book my free inspection", not "Submit").
Links carry standalone meaning. BANNED: em dashes (pick real punctuation); buzzwords
(seamless/empower/elevate/robust/world-class/transform…); "delve"; the "not just X, it's Y"
negation-pivot as a default; triadic-everything; uniform sentence length.

**Absolute bans (refuse-and-rewrite):** side-stripe borders (border-left/right >1px as a colored
accent — *currently present in services/projects; remove*); gradient text; default glassmorphism;
the hero-metric template; identical icon+heading+text card grids; tiny uppercase tracked eyebrow
above every section; numbered 01/02/03 section markers as scaffolding; headlines that overflow at
any breakpoint.

**AI-slop test:** if someone could name the palette/aesthetic from the category alone, rework it.
Second-order: navy-and-gold is a recognizable combo — make ours specifically Sigma (real photos,
a specific navy/gold, real copy), not a generic template.
