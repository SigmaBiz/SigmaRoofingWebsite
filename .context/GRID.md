# THE GRID — Sigma site infrastructure

> The "city grid": once electricity + sewer + roads are defined, building houses is low-skill high-level
> work. The GRID is our reusable infrastructure; once it's up, "putting a page up" is trivial composition.
> Two layers: **ACTION** (motion mechanics) and **AESTHETIC** (the art system). Created 2026-06-04.

---

## Layer 1 — ACTION (motion primitive *classes*)

Reusable scroll-driven mechanics. Any page = a composition of these. Eventually each becomes a
reusable React component (`<PinScrub>`, `<ParallaxLayer>`, `<ScrollyStep>`, `<Transition>` …).

- **PIN-SCRUB** — a section pins in place; scroll scrubs a timeline. *The eigenvector* — it nests all
  the others (you can put parallax, reveals, cycles inside a pin). Built ✓ (`/scrub`, `/showcase`).
- **PARALLAX-DIFFERENTIAL** — foreground and background move at *different rates*. "Deep parallax" =
  the background pans slowly/continuously while the foreground text **cycles N times** over it. This is
  what creates depth AND the reading "flow" (gamifies keeping up). Building now (`/grid`).
- **REVEAL** — elements enter (fade / slide / clip-wipe) on viewport entry. The baseline. Built ✓.
- **BACKGROUND-CYCLE** — the background graphic + its own text/data elements swap or morph *per
  foreground cycle* (step-driven state). Built ✓ (`/scroller`).
- **SOLO-SCRUB** — the scrub acts on the **background alone**, after the foreground has concluded. Pure
  effect / aesthetic beat. Built ✓ (`/grid` — the orange-portal hold before the transition).
- **TRANSITION** (a *class*, not one thing) — how one **segment / chapter** hands off to the next.
  First-pass exhaust DONE ✓ on `/transitions` (light Sigma-Portal theme): **iris · dissolve · wipe ·
  push · morph**, chained across 6 "sectors". (cut · scrub-through still available if wanted.)

## Theme: PORTAL → rebranded to Sigma (light)
The chosen art theme is the Portal *concept* (clean test-chamber geometry + mono signage) rebranded to
Sigma: **light** (warm-white / shell, never all-black), Venus Blush accents (dusty-rose / sage / navy),
the **chevron/roof motif** as the recurring focal "portal" element, Cormorant + JetBrains Mono.
(Half-Life = the grungier alt, still parked.)

**Vocabulary:** *segment = chapter* = one background "scene" with its own foreground cycles. A page is
a sequence of segments joined by transitions.

## Layer 2 — AESTHETIC (the art system)

Not superficial: visual = first impression, and in sales **perception is reality**, so the aesthetic is
a first-class grid pillar.

- **Brand chrome (constant — the uniform):** nav, type, the path to the funnel. Venus Blush, Cormorant
  + Bricolage + JetBrains Mono. Same on every page so it always reads as one company.
- **Art theme (swappable per experience):** the graphic-design ART of the backgrounds/environments.
  **First theme chosen: PORTAL** (Aperture-Science clinical minimalism — light panels, geometric
  test-chamber lines, mono signage, the iconic orange/blue portal accents). Reason: clinical + geometric
  + lots of negative space → it fits our editorial/Swiss restraint, unlike Half-Life's grungier,
  asset-heavy industrial look (parked as the alternative).

## Layer 1b — OBJECTS & object-ACTIONS (the generic type system)

The unifying pattern: **GENERIC TYPES, COMPOSED.** A scene = OBJECTS, each running ACTIONS, joined by
TRANSITIONS, driven by the scroll mechanics (Layer 1) in an art theme (Layer 2).

### OBJECT (noun) — axis: specific ←→ general · role: focal vs. supporting
- **Specific** — a definite thing (cube, nailer, card deck, roof, the Sigma chevron).
- **Filler / fluff (general, supporting)** — geometric primitives that decorate/support ANY scene:
  points · lines · planes · surfaces · volumes (3D) · textures · patterns · fields/grids. Ambient.
- **Text objects ("text clouds")** — text + a capsule (see ENCAPSULATE).

### ACTION (verb) — generic vocabulary; each a class with sub-types/params
- **CYCLE** — traverse the frame. A class of PATHS (not just vertical): vertical · horizontal ·
  diagonal · circular/orbit · arc · serpentine.
- **ENCAPSULATE / CAPSULE** — be bounded (the "cloud"); for text usually a `div`. Sub-types: cloud ·
  pill · frame · mask · field. **RULE: capsule type is COUPLED TO THE AESTHETIC CONCEPT** (boxy panel ↔
  clinical/Swiss; soft blob ↔ organic) — a controlled, local choice from a discrete set.
- **TRANSFORM verbs** — rotate · scale · color · shape-morph · opacity · sheen · quantity · volume ·
  resolution · style · concept.
- **NESTED / COMPOUND** — an object runs actions on itself AND its parts at once. e.g. a text cloud =
  OUTER cycle (the capsule travels) + INNER action (characters morph size/font/color as it goes).

### CAMERA actions & framing — the shot library (`.context/shot-library.csv`)
Distinct from object-actions: here the VIEWPOINT moves. Two registers:
- **FRAMING (shots)** = the composition a keyframe sits in — EWS · WS · Full · MLS · Cowboy · MS ·
  MCU · CU · ECU · Macro; angles: eye-level · low · high · bird's-eye · worm's-eye · dutch · OTS · POV ·
  ground-level. (The start/end *states* of a scroll move.)
- **MOVEMENT (camera moves)** = the scroll-driven transition between framings — pan · tilt · zoom ·
  pedestal · dolly · truck · orbit · crane · dolly-zoom(vertigo) · crash-zoom · FPV-drone · bullet-time ·
  handheld · roll · rack-focus · pull-back-reveal · fly-through.

**Dual-use** (one vocabulary, both ends of the pipeline):
1. **In-engine** — scroll drives them as CSS/3D transforms. Native now: pan/tilt/zoom/pedestal/dolly/
   truck/crane/dolly-zoom/crash-zoom/handheld/roll/rack-focus/pull-back-reveal. Need R3F: orbit ·
   FPV-drone · bullet-time · fly-through.
2. **Prompt keywords** — the CSV's keyword/prompt columns feed the external AI art-gen (the "art slot")
   to PRODUCE the shots. So the shot library is our scroll-camera vocabulary AND the generation vocabulary.

### Composition (the whole grid in one line)
`page = scroll-mechanic × scenes( objects[type,role] × actions[type,params] ) × transitions × theme`
Grammar = scroll-mechanics · Vocabulary = objects+actions · Punctuation = transitions · Voice = theme.

### Honest edges
Concrete axes (cycle, encapsulate, rotate, scale, color, opacity, quantity) are bread-and-butter;
style/concept/resolution as *animatable* axes are fuzzy/expensive (semantic morph ≈ AI-slop) — aspirational.
The type system is a PALETTE, not a prescription: sigma-design/impeccable still govern — one bold gesture
per view, ≤ 2 simultaneous actions, or genericity becomes noise. **Generic ≠ maximal.**

## How a page gets built once the grid is up

Compose: **pick segments → for each, choose a background art scene + action primitives (pin-scrub /
parallax / cycle / solo-scrub) + a transition to the next → drop in content.** The house on the grid.

## Status

Built: pin-scrub, reveal, background-cycle (across `/scrub`, `/showcase`, `/scroller`).
Now: parallax-differential (`/grid`, Portal theme). Next: transition class, then solo-scrub.
Tooling: Playwright stood up — I can screenshot our own pages now (the fidelity loop is live).
