# PLAN — Front-End Design Reskin (brand + tokens)

> **SUPERSEDED for new pages (2026-06-03) by Plan v2** — `.context/PLAN-website-v2.md`
> (Venus Blush / luxury-editorial). This storm-authority direction now applies ONLY to the
> EXISTING site skin (committed on branch `design-reskin`). The persuasion basis is unchanged.

Created: 2026-06-03 · Recovered from session `db0c07a5` (the logout cost it from the chat,
not from disk). Full verbatim discussion: `.context/recovered-frontend-thread-2026-06-03.md`.

> This is a **second active plan** alongside `PLAN.md` (SocHub). Keeping it separate so the
> two threads don't clobber each other. The design work is the one that got lost — anchor here.

---

## The core realization (don't re-derive this)

- **There is no brand in the code yet.** The live site is emerald green
  (`--primary: 158 64% 52%`) on blue-gray, in **Inter + Open Sans**. Zero Cormorant, zero
  Venus-Blush anywhere. So this is **create the brand**, not "preserve brand while swapping
  aesthetics." The brand is the thing that doesn't exist yet.
- **There's a token layer, not a style layer.** Because it's shadcn/Tailwind, ~70–80% of the
  visual identity lives in a tiny surface: CSS vars in `client/src/index.css` (`:root`), the
  Tailwind theme, and the font links. Change those → every Button/Card/Input/Section reskins
  at once, in one reversible commit.
- **ζ verdict:** token-layer swap = **Z₂** (propagation guaranteed by framework, contained
  blast radius, `git checkout` to revert). Per-component `className` rewriting = **Z₁** (high
  blast radius, breaks layout, mauls the funnel). → **Tokens first. Never hand-edit components
  to reskin.**
- **Design for the right human.** OKC-metro homeowner, often older, often post-hailstorm, on a
  phone, asking: is this real, can I trust them, how fast can I book. Reference class =
  high-trust home-services / local-contractor sites — NOT Awwwards/Dribbble premium-SaaS.
  Where "looks impressive" and "books more inspections" diverge, **conversion wins.**
- **Conversion + performance are the fragile things to protect.** Real verification targets:
  phone still one tap, form still above the fold on mobile, booking still the loudest element,
  LCP did not regress. (Not "matches the reference screenshot.")

## Agreed approach (the convergence, confirmed by Antonio 06:33)

1. **Make the brand decision real first** — the fork that gates everything. Rose/Venus-Blush
   warmth, OR evolve the existing green into something intentional. Cormorant (display) + clean
   readable sans (body)? Decide it as a **trust-and-conversion** decision.
2. **Implement at the token layer** (`index.css` vars + Tailwind theme + font loading). One
   reversible commit, screenshot before/after. ~60% of "feels designed" right here.
3. **Tune shared primitives** (`components/ui` Button/Card/Section: spacing, radius, shadow,
   type scale) — still centralized, still low-risk.
4. **Then** hand-touch hero + 3–4 key sections with *restrained* motion — checking mobile, LCP,
   and funnel integrity at each gate.
5. **Guardrails:** localhost only · section-by-section approval · push only on Antonio's
   explicit OK.

**The stack, in order:** brand (direction) → tokens (the 60%) → screenshot loop (fidelity +
funnel/mobile guard) → skills/references (widen options) → hand-touched sections.

- **Screenshot loop = the engine, not the steering wheel.** It controls *fidelity* ("did I
  build what I intended"), not *direction* ("is what I intended any good"). Give it the
  money-protecting orders: funnel survived? form above fold on mobile? booking loudest? slower?
  Turn it OFF for animated/moving elements (else it loops "fixing" non-bugs).
- **Design skills:** none installed today. Plan = write a custom `.claude/skills/sigma-design/`
  (Z₂: stack + brand + audience + guardrails, lives in repo) as the law of the land; optionally
  ONE community skill underneath as a taste baseline, most-specific-wins. Skills = discipline;
  references = inspiration. Keep community skills subordinate so they don't drag toward generic
  premium-SaaS.

## New pages (Antonio asked about this directly)

- **Layout & personality → full freedom** on new pages (blank canvas, nothing to preserve).
  This is the one place the `reference → clone → inject brand` pipeline IS the right tool.
- **Brand DNA → stay consistent:** same colors, fonts, button style, nav, footer — so clicking
  between pages still reads as "one company." Closer to the sale = match everything; more of a
  standalone "experience" (Watch/SocHub) = more latitude.
- **Mechanics:** pages live in `client/src/pages/` (~13 exist), routing in `App.tsx` via
  `wouter`. Add a page = (1) create `pages/x.tsx`, (2) one `<Route>` line in `App.tsx`,
  (3) a nav link. New pages **auto-inherit the tokens**, so they start on-brand by default.
- **Every page must keep:** nav+footer · a path to the funnel (no dead ends) · fast on mobile.

---

## Next actions (checkboxes)

- [ ] **DECISION (Antonio):** brand direction — Venus-Blush/rose warmth vs. intentional evolved
      green; display + body type pairing. This gates everything below.
- [ ] Render 2–3 brand directions at the **token layer** on the real home page (reversible,
      localhost only) and screenshot each — pick from renders, not adjectives. Doubles as
      standing up the screenshot loop for real.
- [ ] Lock the chosen tokens in `index.css` + Tailwind theme + font loading; one commit,
      before/after screenshots.
- [ ] Tune shared primitives (Button/Card/Section).
- [ ] Draft `.claude/skills/sigma-design/` custom design skill.
- [ ] (Optional) evaluate community skills (impeccable / "UI/UX PRO MAX") — READ before trust;
      only one, subordinate.
- [ ] Hand-touch hero + key sections, gating on mobile/LCP/funnel each time.

## Open question carried from the thread

- "What new pages do you actually need?" (service pages for SEO? location pages Edmond/OKC/
  Norman? financing? a hail-report page using the storm data already wired in?) — map which
  ones feed the funnel before scaffolding.
