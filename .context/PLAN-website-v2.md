# SIGMA ROOFING — Website Build Plan v2 (for Claude Code)

> Supersedes v1. The change that matters: the wireframe/brainstorm workflow was wrong in v1 (it copied an error in the source thread). Corrected below. Also adds the multi-design branching loop, the photography/copy carrier constraint, and the phase-lock ("coordination") system.

---

## 0. Strategic frame (read first — this is the "why")

Every roofing contractor site in the OKC metro lives in one equivalence class: navy/white, system sans-serif, three-card service grid, badge bar, stock-house hero, popup quote form. The variation between them is near zero. They are interchangeable, which is why they compete only on price and proximity.

"An order of magnitude above" does not mean a nicer version of that template. It means leaving the class entirely. The brand already names the exit: **delicacy within a rough trade** — a roofing company that reads like a luxury hospitality brand. Two consequences for everyone building this:

1. **Beauty and conversion are not a tradeoff here.** The roofing-marketing orthodoxy ("design should convert, not impress; flashy animation hurts") is true *only* when you bolt ornament onto a lead-gen template — extra weight, extra noise, slower load. It is false when the aesthetic IS the conversion mechanism: motion that directs the eye to the CTA, typography that signals the company is sophisticated enough to handle an insurance claim, photography that is itself the proof of work. Build it the second way. Nothing decorative; every aesthetic element must be load-bearing for trust or for the eye's path to the phone number.

2. **The ceiling is set by photography and copy, not code.** A state-of-the-art animation system over generic stock photos of a man pointing at a roof will still read as "template contractor." See §6 — this is the one risk that can silently cap the whole project, and it is the one thing code cannot fix.

---

## 1. Aesthetic direction (the committed "extreme")

When the frontend-design skill asks you to commit to a direction, commit to this and do NOT drift toward its maximalist default:

> **Luxury / editorial / refined.** Restraint, precision, generous negative space, one bold gesture per view. Think Aman, Cereal magazine, Monocle — not a loud landing page. Elegance comes from execution, not density.

The frontend-design SKILL explicitly says minimalist/refined work needs "restraint, precision, and careful attention to spacing, typography, and subtle details." That line governs this project. If a generation comes back loud or busy, it has missed the brief.

---

## 2. Brand system (locked — do not invent alternatives)

### Color — Venus Blush
```css
:root {
  --warm-black: #2C2A28;
  --dusty-rose: #C4897A;
  --sage-green: #7D9E82;
  --shell:      #E8D8C4;
  --warm-white: #F5F0EA;

  /* derived */
  --dusty-rose-dark: #A06B5E;   /* CTA hover */
  --sage-green-dark: #5E7D63;
  --warm-black-60: rgba(44,42,40,0.6);
  --shell-40:      rgba(232,216,196,0.4);

  /* semantic */
  --bg:          var(--warm-white);
  --bg-elevated: var(--shell);
  --bg-inverse:  var(--warm-black);
  --text:        var(--warm-black);
  --text-muted:  var(--warm-black-60);
  --text-inverse:var(--warm-white);
  --accent:      var(--dusty-rose);
  --accent-2:    var(--sage-green);
  --cta-bg:      var(--dusty-rose);
  --cta-text:    var(--warm-white);
  --cta-hover:   var(--dusty-rose-dark);
}
```
Dominant: warm-black + warm-white. Sharp accents: dusty-rose (primary/CTA), sage-green (secondary). NEVER navy-on-white, purple/indigo gradients, or pastel rainbows.

### Typography
- **Display:** Cormorant Garamond — weights 300 and 700 only (use the extremes).
- **Body:** Bricolage Grotesque (400 / 600). Never Inter, Roboto, Open Sans, Lato, Arial, system fonts, or Space Grotesk.
- **Data/labels/license #:** JetBrains Mono.
- Size jumps of 3x+, not 1.5x. Weight extremes (300 vs 700), not middle weights.

### Voice
Refined, confident, unhurried. A craftsman who reads philosophy. Not "We're OKC's #1 roofer!" — closer to "Your roof is the boundary between your family and the sky."

---

## 3. The build workflow (CORRECTED)

The source thread prescribed: generate wireframes externally → feed them to `/superpowers:brainstorm`. That conflates two different jobs wireframes do. Split them:

- **External wireframe (bareminimum.design or hand-sketch) = TOPOLOGY only.** Which sections exist, in what order, what's emphasized. The skeleton. Bring this IN as a constraint. Do NOT specify pixels, fonts, colors, or spacing in it — over-specifying starves the model's creative budget and produces worse, deader output.
- **`brainstorm`'s native Visual Companion = EXPRESSION.** Superpowers' brainstorming skill ships a browser-based visual companion (`frame-template.html` + local server) that generates layout/wireframe comparisons to elicit YOUR preferences via A/B choices during the clarifying-question phase. Let it run. It discovers the expression on top of the topology you brought.

Brick Principle: the external wireframe is the bricks (load-bearing structure); expression is the facade (varies freely on correct structure).

### Step sequence
1. **Install both plugins, then set up the project.**
   - Superpowers (provides `brainstorm` → plan → execute): in a Claude Code session run `/plugin marketplace add obra/superpowers-marketplace` then `/plugin install superpowers@superpowers-marketplace`, then **restart the session** (the session-start hook is what bootstraps it).
   - frontend-design (the anti-slop aesthetic skill used in step 4): `/plugin install frontend-design@claude-plugins-official`.
   - Confirm both show up under `/plugin`. THEN scaffold: `npm` project (Next.js App Router or Astro + islands). Install Tailwind, Framer Motion, GSAP, `@fontsource` for the three fonts. Drop the CSS variables (§2) into global CSS. Drop the CLAUDE.md block (§7) into project root.
2. **Topology.** Produce ONE ASCII wireframe per page section from §5 — structure only. (Use bareminimum.design or just write the box layout.)
3. **Brainstorm.** Invoke `/superpowers:brainstorm`. Feed it: this plan + the topology wireframes + the §1 aesthetic direction. Answer its clarifying questions; let its Visual Companion run in the browser. Do NOT invoke frontend-design during brainstorm — the skill forbids it and brainstorm's job is the spec, not the build. Output: an approved design spec.
4. **Build, section by section, via frontend-design.** Invoke `/frontend-design:frontend-design` with the approved spec + the wireframes. Build the hero FIRST (it sets the whole tone), then work down §5.
5. **Multi-design branch on the hero (critical — see §4).**
6. **Polish:** scroll reveals, hover states, load sequence, mobile, performance, accessibility.
7. **Inner pages** reusing components with varied layouts. The `/insurance` page is the second-most-important page (it converts the DTP model — explain "you don't pay until your insurance does").

---

## 4. The multi-design branching loop (do this on the hero, and on any section you're unsure about)

frontend-design defaults toward bold/maximalist; Sigma is the opposite pole (refined). One-shot generation will overshoot. Correct it by measurement:

1. Generate **3–5 hero variants** in one pass.
2. Select the one closest to "refined, editorial, one bold gesture."
3. Branch: "Generate 3 more like #2 but [dial back density / quieten the motion / more negative space]."
4. Repeat until it locks. Each selection re-biases the next batch toward Sigma's register. This is how you walk the plugin's default boldness down to delicacy — you cannot get there in one prompt.

---

## 5. Page + section architecture

**Pages:** `/` · `/services` (+ storm-damage, roof-replacement, roof-repair, gutters) · `/about` · `/portfolio` · `/insurance` · `/contact` · `/blog`

**Home section flow** (mirrors the storytelling arc Anchor → Rupture → Invest → Crystallize → Ground):

1. **Hero (Anchor).** Full viewport. Cinematic real-project photo, slow Ken Burns. Headline in Cormorant 300, `clamp(3rem, 8vw, 7rem)`. The headline should carry the brand dipole — delicacy against rough trade — e.g. "Precision above. Peace of mind below." Staggered reveal on load (headline → subtext → CTA, ~400ms apart). Primary CTA "Schedule Free Inspection" (dusty-rose). Phone visible, secondary.
2. **Proof bar.** warm-black strip. Stats in JetBrains Mono ("500+ roofs", "Licensed & Insured", license OK80006734). Manufacturer marks (OC, GAF, CertainTeed) muted. Count-up on scroll-enter.
3. **Services (Rupture).** NOT a three-card grid. Asymmetric bento; storm-damage card emphasized (larger / distinct treatment). Real photography per card. Hover: lift + dusty-rose accent line. Stagger-reveal on scroll.
4. **The Sigma difference (Invest).** Diagonal/overlapping split. Large roof-detail photo + 3–4 short statements ("We don't do sales. We do inspections." / "Your insurance pays. We handle the process."). Sequential reveal.
5. **Portfolio preview (Crystallize).** Before/after pairs with materials + neighborhood. Photography is the hero; design recedes. Click → project story.
6. **Process (Ground).** 4–5 step timeline with a line that draws on scroll. Emphasize "You don't pay until your insurance does."
7. **Testimonial.** Not a carousel. One featured quote, large Cormorant italic, on shell. Name + neighborhood. Google rating nearby, not dominant.
8. **CTA.** warm-black, full width. Cormorant headline. Inline form (Name, Phone, Address, "Storm damage?" toggle) — NOT a popup. Atmospheric texture on bg.
9. **Footer.** Elegant, not utilitarian. Logo, nav, license #, phone, address, service-area list.

---

## 6. The binding constraint: photography + copy (flag to the user, do not silently proceed on stock)

The aesthetic ceiling is set by the imagery and words, not the code. This is the carrier signal; the animation is the high-frequency layer riding on it. If the carrier is generic, no amount of polish reads as premium.

- **Best:** professional photography of real Sigma jobs — drone aerials + tight detail shots (flashing, ridge lines, valley work), golden-hour exteriors.
- **Interim (until real assets exist):** curated warm-tone stock that matches Venus Blush — Oklahoma light, textured shingle macros, warm-lit exteriors. NEVER clip-art, NEVER "person pointing at roof," NEVER blue-tinted corporate stock.
- **Copy:** headlines must earn Cormorant — short, weighted, concrete. CTAs specific ("Schedule Free Inspection," not "Learn More").

If real photography isn't available yet, build with tasteful placeholders AND tell Antonio explicitly that commissioning drone + detail photography of completed jobs is the highest-leverage thing he can do for the site — higher than any code change.

---

## 7. CLAUDE.md block (paste into project root)

```markdown
# Frontend Aesthetics — Sigma Roofing

You converge toward generic, "on distribution" outputs — the "AI slop" aesthetic. Unacceptable here. Sigma's identity is "delicacy within a rough trade": a roofing company that looks like a luxury brand. Direction is REFINED/EDITORIAL, not maximalist. Restraint, precision, one bold gesture per view.

## Typography
- Display: Cormorant Garamond (300, 700). NEVER Inter, Roboto, Open Sans, Lato, Arial, system fonts, or Space Grotesk.
- Body: Bricolage Grotesque (400, 600). Mono: JetBrains Mono for stats/license #.
- Size jumps 3x+. Weight extremes 300 vs 700.

## Color
- Venus Blush CSS variables. Dominant: warm-black + warm-white. Accents: dusty-rose (CTA), sage-green.
- NEVER navy-on-white, purple/indigo gradients, pastel rainbows.

## Motion (one timing system — everything phase-locks)
- Base duration 500ms; easing cubic-bezier(0.22,1,0.36,1); stagger unit 100ms. Use these everywhere.
- Load: staggered reveals (translateY 20-30px + fade), nav→headline→subtext→CTA.
- Scroll: IntersectionObserver (threshold 0.15), reveal once, stagger siblings by the unit.
- Hover: 200-250ms, subtle lift on cards, color transition on links.
- Hero: parallax via transform (GPU). Respect prefers-reduced-motion. Motion = body language: deliberate, unhurried. NEVER bouncy/spinny.

## Spatial (one scale shared by type AND spacing)
- Single modular scale (e.g. 1.5 ratio) drives both font sizes and spacing units, so rhythm phase-locks.
- Break the grid intentionally: asymmetry, overlap, diagonal flow. NEVER a three-card icon+heading+paragraph grid.

## Backgrounds
- Layer subtle noise/grain over color sections; shell→warm-white gradient meshes for depth. NEVER flat white with no atmosphere.

## Conversion (the aesthetic IS the trust signal)
- Phone 405-902-5266 on every page: nav + hero + footer. Click-to-call on mobile.
- "Schedule Free Inspection" primary CTA, dusty-rose, ≥2x per page. Forms inline, never popups.
- Trust signals (license OK80006734, insured, manufacturer certs) woven into design, not a badge bar.
```

---

## 8. Verbatim reference prompts (from Anthropic's cookbook — append when generating)

**Full distilled aesthetics prompt** (paste verbatim into the system prompt / CLAUDE.md when you want the general anti-slop guard):
```
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:
Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.
Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.
Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.
Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.
Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character
Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
```

The cookbook's typography isolate confirms Sigma's register is correct: its "Editorial" shortlist is Playfair Display / Crimson Pro / Fraunces and its "Distinctive" shortlist is Bricolage Grotesque / Obviously / Newsreader — i.e. Cormorant-class display + Bricolage body is exactly the editorial direction the source endorses. Pairing principle from the cookbook: high contrast = interesting (serif display + geometric/grotesque body).

---

## 9. Done when
1. A designer browsing Awwwards would not guess this is a roofing company.
2. A homeowner whose neighborhood was just hit calls within a minute of landing.
3. Removing any one element (palette, type, motion, photography) visibly breaks the whole — total coherence.
4. < 3s load on 4G mobile; prefers-reduced-motion respected.
5. Every page has phone + inline form without feeling salesy.
6. Zero elements traceable to the roofing-template distribution.
