# IPOD-NAV.md — the nav build: an iPod 1st-gen CLICK WHEEL section nav

> **Status: ✅ BUILT + VERIFIED 2026-06-16.** Replaced the frosted-glass `SectionDial` with `ClickWheel` in
> `client/src/pages/estimate.tsx`. On `design-reskin`, localhost, client-only (Vite HMR). Playwright-verified (3 states +
> a functional teleport assert: clicking the menu's "Q&A" row scrolled `scrollY 0→4506`, landing `#qa` at viewport top);
> tsc clean. Nav iteration history: FPS-HUD vertical dial → half-knob → frosted-glass stack → **iPod click wheel (this).**
>
> **— BUILD RECORD (what shipped + the decisions I resolved from the open questions below) —**
> - **Layout:** a vertically-centered module on the **right edge** (`fixed right-0 top-1/2`, `hidden md:flex`) = a little
>   **iPod LCD screen** stacked above the **wheel** (216px, seated in a thin silver bezel). Default `translate-x-[42%]` so
>   the **left hemisphere peeks**; **hover / focus-within → `translate-x-0`** slides the whole wheel in (this is how the
>   off-screen-right `▶▶ forward` button becomes reachable → **resolves open-Q #1**).
> - **Controls:** `menu` (top arc) toggles the LCD **sub-menu** (Estimator · Reviews · Q&A · Images · Contact · Home — the
>   current section highlighted iPod-blue with a ‹ chevron; pick → teleport, Home → `/`). `◀◀` (left) = prev section,
>   `▶▶` (right) = next section. `▶❙❙` (bottom) = **auto-tour toggle** (steps through the on-page sections ~3.6s each;
>   never navigates away — Home is sub-menu-only) → **resolves open-Q #3**. **Center hub = an IN-SECTION CURSOR**
>   (CHANGED 2026-06-16 per Antonio — it NO LONGER changes section; only the arcs/menu cross sections). Each press steps the
>   focusable controls of the section you're *parked* in, wrapping: **Estimator** → address input → "Get my estimate" submit;
>   **Q&A** → expands+highlights the next FAQ question and collapses the prior (single-open accordion); **Contact** → first
>   form field → next field → …; **Reviews/Images** carry no fields → **no-op**. Impl: branches on the scroll-spy `active`;
>   Q&A drives the accordion by `.click()`-ing the `#qa [aria-expanded]` button after the current-open one (re-reads the DOM
>   each press → stays in sync); other sections focus `input/select/textarea/button[type=submit]` in the section container
>   and `reveal()` (focus + scrollIntoView only if off-screen). The cursored Q&A question gets a **gold focus ring/tint**.
>   **The hook `↺` arrow was REMOVED — the hub is now blank (no icon).** Playwright-verified all three cursors with **real
>   mouse clicks**. **Real-click fix (2026-06-16, 2nd pass):** the hub has `onMouseDown → preventDefault` so clicking it never
>   steals focus off the form field — without it the Contact/Estimator cursor reset to field 0 every press (a bug a
>   *programmatic* `.click()` test hid; only a real `mouse.click` reproduced it).
>   **3rd pass (2026-06-16): cursor cycles FILL-IN fields only** — the selector is now text `input`s + `textarea` only
>   (`:not([type=checkbox/radio/submit/button])`, no `select`), so it **skips the Service-Type menu, the lock-in toggle, and
>   the Submit button** (those were "dead" stops Antonio flagged). Contact now walks **First→Last→Email→Phone→Address →
>   wraps** straight back to First; Estimator = the address field.
> - **Floating-gallery pop suppression (3rd pass, 2026-06-16):** the desktop `FloatingGallery` pops a photo to the
>   foreground on pointer-proximity — but a photo drifting under the cursor while you're *on the wheel* would pop
>   inadvertently. The wheel's `<nav>` now sets the **same `qaHover`/`noPop` ref** (`onMouseEnter → true`,
>   `onMouseLeave → false`) the Q&A panel uses, so pops are suppressed while the cursor is on the wheel (gallery forces
>   `nf = -1`). Reuses the proven Q&A-suppression path; `<ClickWheel suppressPop={qaHover} />`.
> - **Sections (scroll-spy order):** Estimator(`.p1`/top) → Images(`#images`) → Reviews(`#reviews`) → Q&A(`#qa`) →
>   Contact(`#contact`). The **`#images` anchor is NEW** — added to the P2 gallery wrapper div. A scroll-spy (top vs 40%vh)
>   tracks the current section → shown on the LCD + highlighted in the sub-menu.
> - **Mobile (4th pass, 2026-06-16 — NOW ON MOBILE, remapped per Antonio):** the wheel was desktop-only; first-look on a
>   390px phone showed the web features don't translate (no hover → the right `▶▶` is unreachable; LCD/sub-menu clipped off
>   the right edge; center cursor pops the keyboard). So mobile gets a **remapped wheel** where every control sits on the
>   visible LEFT hemisphere (no hover-reveal — `md:hover/focus:translate-x-0` only; mobile stays peeked): **TOP = forward**
>   (next section, ▶▶) · **BOTTOM = rewind** (prev, ◀◀) · **LEFT = play/pause = a smooth continuous AUTO-SCROLL** (rAF
>   `scrollBy`, tap to roll / tap to stop, auto-stops at the bottom — distinct from desktop's section auto-tour) · **CENTER
>   = back to P1** (scroll to top, labeled ↑) — NOT the cursor/menu. The **LCD screen + sub-menu are hidden on mobile**
>   (`{!mobile && …}`); the RIGHT arc is off-screen/unused (`tabIndex -1`). Q&A glass still applies. Driven by a `mobile`
>   prop (=`isMobile` from the parent). **Desktop is unchanged** (every behavior is `mobile ? mobileFn : desktopFn`).
>   Playwright-verified @390px: forward `y 0→4170`, rewind `→47`, play auto-scroll `47→236` (pause = stable), center `→0`;
>   desktop sanity = LCD/sub-menu + menu/prev/next/play-tour/cursor all intact.
> - **Mobile (5th pass, 2026-06-16 — CORNER REDESIGN, SUPERSEDES the 4th-pass right-edge remap):** Antonio moved the
>   mobile wheel to the **TOP-RIGHT CORNER**, its ring **arcing from the top edge around to the right edge** (the wheel
>   center sits ~at the corner; `top:-41 right:-41`, Dm=138 ≈ **36% smaller** than desktop's 216). It's a **dedicated
>   mobile block** (`if (mobile) return …`) — the desktop wheel was reverted to pure desktop (no more interleaved `mobile?`
>   ternaries). Three buttons ride the visible arc (orbit radius 48 from center): **forward ▶▶** @180° (upper, near top
>   edge) · **play/pause ▶❙❙** @135° (mid = the continuous auto-scroll) · **rewind ◀◀** @90° (lower, near right edge); 2
>   seams between them; groove ring; **blank center hub (56px) = the text-field cursor** — it calls the web `center`, which
>   now **skips Q&A on mobile** (`if (!mobile && sec===3)`) so it only acts where text fields exist (Estimator address;
>   Contact fields cycle; no-op in Q&A/Reviews/Images). **No menu / no hover.** To clear the corner, the **`SiteHeader`
>   Q&A/Contact links moved next to the logo (left).** Q&A glass still applies (corner wheel fades in Q&A). Playwright-
>   verified @390px: center→address field (Estimator) & First→Last (Contact); forward `0→4101`; rewind `→122`; play
>   auto-scroll `→295`; desktop sanity = mobile hub absent on desktop, desktop submenu intact. (NB: the dev server crashed
>   twice from *transient* mid-edit Vite HMR JSX errors — not real failures; restarted, tsc clean.)
> - **Mobile (6th pass, 2026-06-16 — SEE-THROUGH + pared to TWO controls, per Antonio):** the corner wheel is now a
>   **see-through frosted-glass** disc (NO white plastic fill, on **every** page — the Q&A-only opacity toggle is gone): a
>   `rgba(255,255,255,0.07)` disc + `backdrop-blur-[3px]` + `border-white/25` + a faint dark hairline edge; groove ring;
>   blank **frosted hub**. Only **two controls** remain (rewind + play removed): **FORWARD ▶▶** (kept at its 180°/upper
>   spot — NOT repartitioned) where a **short tap = next section** and a **HOLD ≥500ms = jump back to P1/top** (pointer-event
>   long-press via `holdRef`); and the **center hub = the text-field cursor** (web `center`, skips Q&A). The ▶▶ icon uses
>   `mixBlendMode:"difference"` so it adapts (light on dark hero/Q&A, darker on cream). Dm=132. The **`SiteHeader`'s mobile
>   Q&A/Contact links were REMOVED** (the wheel is the only mobile nav now; the logo = Home). Note: forward-only (+ wrap)
>   + hold-to-top is the whole mobile nav — no rewind. Playwright-verified @390px: forward tap `0→4093`, **hold `→0`**,
>   center→address field; legible on hero/Q&A (dark), **subtle on the cream Contact bg** (inherent to see-through). tsc clean.
> - **Cosmetic pass (2026-06-16, "we should be good"):** the forward **▶▶ was moved onto the corner DIAGONAL** — its
>   position is at 135° from center (r=48), i.e. along the corner's 45° diagonal pointing into the screen, while the **▶▶
>   glyph stays UPRIGHT** (not rotated). And **two subtle embossed radial creases** (a white-highlight + faint-groove
>   `linear-gradient`, at 108°/162°) were added **framing the forward button** so the see-through wheel keeps the
>   segmented click-wheel character Antonio asked to preserve. Forward re-verified firing from the new spot (`0→4093`).
> - **Cosmetic pass #2 (2026-06-16) — 4 touches:** (1) **transparency now EXACTLY matches the P1 text-cloud divs** —
>   `bg-white/8 border-white/25 ring-1 ring-inset ring-white/15 backdrop-blur-lg shadow-[0_10px_36px_rgba(0,0,0,0.4)]`
>   (heavier frost, more see-through). (2) **Creases moved to the reference's canonical 90°-apart proportion** — at **90° &
>   180°**, flanking the forward button (forward centered at 135° between them, like a real iPod button in its arc); NO
>   longer bunched at 108/162. (3) **Subtle PULSING RING** on the center hub (`@keyframes cwPing` scale .92→1.5 / fade,
>   2.6s; `.cw-ping`, respects `prefers-reduced-motion`) to draw the eye to the cursor button. (4) **P1 keyboard-lift** —
>   the P1 estimator form is pinned to the viewport bottom (sticky stage) so the mobile keyboard covers it; now focusing the
>   address field on mobile sets `kbdLift` → the bottom-anchored form wrapper gets `translateY(-40vh)` (transition 0.3s),
>   lifting it clear of the keyboard; resets on blur (180ms delay so suggestion taps land). **P1-EXCLUSIVE** for now (only
>   the P1 address input). Verified: disc frost + creases + ping ring render @390px; the form visibly rises on focus (the
>   `addrTop` measure hit a hidden input, but the screenshot confirms the lift). tsc clean. (-40vh is tunable; the hub is
>   still ~41% of Dm vs the reference's ~30% — could shrink later.)
> - **Craft:** glossy white radial-gradient plastic + silver bezel; 4 transparent **wedge buttons** (`clip-path` triangles)
>   that darken on hover/`active`; grey iPod labels; **radial seams** between the 4 arcs (diagonal divider lines at
>   45/135/225/315°, faint on the annulus — added 2026-06-16); a groove ring around the recessed silver **blank** center
>   hub; `active:scale` press on the hub. Faithful to `26.jpeg`. **Q&A glass (2026-06-16, 2nd pass):** in Q&A
>   (`active === 3`) the wheel goes **translucent** (`opacity 0.34`, `transition-opacity 500ms`) so it stops covering the
>   questions — outlines/labels stay faintly visible; **no backdrop-blur** (that would blur the text *behind* it); smooth
>   fade in/out as you enter/leave Q&A. The LCD screen stays opaque.
> - **Open for Antonio to redirect (decided-and-logged, not gospel):** play/pause = auto-tour; the ~42% peek amount;
>   **center cursor in Reviews/Images = currently no-op** (no fields there — could later cycle review cards / pop gallery
>   photos); whether Images should map somewhere other than the P2 top.

> **(Original spec preserved below for reference.)**

## The ask (Antonio's words, faithfully)
Emulate the **iPod 1st-gen mechanical click wheel** — convey the *imagery + nostalgia* of the clickwheel. Recreate the
**clicky button feel**, the **texture + finish** of the buttons (glossy white/silver plastic), the **lighting** (bevels,
soft highlights/shadows, the ring seam), and the **labels**.

## Reference images (Antonio uploaded — VIEW THESE before building)
- `~/.claude/image-cache/db0c07a5-4417-4b49-b4ee-c25ebc7eb5d5/25.jpeg` — iPod 1st gen (full device + screen menu "Playlists/Artists/Songs/Contacts/Settings").
- `~/.claude/image-cache/db0c07a5-4417-4b49-b4ee-c25ebc7eb5d5/26.jpeg` — **close-up of the click wheel** (the key reference): outer ring with **"menu"** at top, **◀◀ rewind** at left, **▶▶ forward** at right, **▶❙❙ play/pause** at bottom; a recessed **silver center hub**; the thin ring seam; grey labels on glossy white.

## Layout
- **The LEFT HALF (left hemisphere) of the click wheel, embedded on/near the RIGHT EDGE of the screen, PERSISTENT (always visible).**
  The wheel's center sits at the right edge; the left semicircle bulges left into the screen (same mount as the half-knob we
  just did, but now skinned as an iPod click wheel).
- Desktop scope (like the current nav). Mobile: keep the `SiteHeader` Q&A/Contact links, or adapt later (TBD).

## Controls (the click-wheel layout — keep the iPod format)
- **TOP arc = `menu`** (label it lowercase "menu" like the iPod) → click opens a **SUB-MENU** that teleports to:
  **Estimator · Reviews · Q&A · Images · Contact · Home** (6 targets).
- **LEFT button = REWIND `◀◀`** → previous section.
- **RIGHT button = FORWARD `▶▶`** → next section.
- **BOTTOM arc = PLAY/PAUSE `▶❙❙`**.
- **CENTER hub = "scroll"** → click **turns the dial ONE turn COUNTERCLOCKWISE** (rotate the wheel one notch CCW).
  Label the center with a **"turn" arrow — a hook-like curved rotation arrow (↺).**

## Behavior
- **Forward / Rewind / center-turn** cycle through the ordered section list (wrap around). Suggested order = page order:
  **Estimator (top/.p1) → Reviews (#reviews) → Q&A (#qa) → Images (gallery) → Contact (#contact) → Home (`/`)**.
  - Forward `▶▶` = next, Rewind `◀◀` = prev, center turn = advance one CCW notch (decide CCW = forward or back; CCW on an
    iPod scrolls *up*, so center-turn could = rewind/up — confirm with Antonio or just make it advance one and see).
- **menu** → opens the sub-menu (an iPod-screen-style list, per `25.jpeg`?) → pick a target → `scrollIntoView` / `scrollTo(0)`
  (Estimator) / `window.location.href="/"` (Home).
- Reuse the existing scroll-spy idea so the wheel/screen reflects where you are.

## Anchors needed
`.p1` (Estimator/top ✓) · `#reviews` (✓) · `#qa` (✓) · **`Images` — NEW: no distinct section yet** (the gallery is the P2
*background* on desktop / the `ShuffleStack` on mobile) → add an id/anchor for it, OR map "Images" to the reviews/gallery
region · `#contact` (✓) · Home → `/`.

## Open design questions (resolve in build / ask Antonio)
1. **The hidden RIGHT half:** only the left hemisphere shows, but `▶▶ forward` lives on the right (off-screen). Options:
   show just enough of the right edge for forward, OR let the half-wheel's visible buttons (menu/rewind/play-pause/center)
   carry it and forward is the center-turn's inverse, OR slide the wheel out on hover. Antonio's "genius idea" was the
   half-on-the-edge — make the visible left arc carry menu(top)/rewind(left)/play-pause(bottom)/center, and figure forward.
2. **CCW center-turn semantics** — does "one turn CCW" = next or previous? (iPod CCW = scroll up = previous.)
3. **What does play/pause DO** on a nav? (Maybe: jump to top/Estimator, or no-op/decorative, or toggle the gallery shuffle.)
4. **Mobile** treatment.

## Recreate (the craft — this is the point)
Glossy **white/silver plastic** click wheel; the outer **ring** split into the 4 button arcs (menu/rewind/forward/play-pause)
with the thin **seam** between ring and center; the **recessed silver center hub** (the "scroll" turn button) with the hook
turn-arrow; **bevel lighting** (top-lit highlight, soft lower shadow, a subtle radial sheen); grey iPod **labels**
(`menu`, `◀◀`, `▶▶`, `▶❙❙`, ↺); **clicky press states** (the arc depresses + darkens on click). SVG or CSS gradients/box-shadows
(an SVG is likely cleanest for the ring segments + the bevels). Match `26.jpeg`.

## What it replaces
The current `SectionDial` in `client/src/pages/estimate.tsx` (a frosted-glass stack: Estimate · Q&A · Home · Contact, upper-
right, `fixed right-4 top-[78px]`, scroll-spy). Swap that component's body for the click wheel; keep the scroll-spy + `go()`
portal logic; add the `Images` anchor + the Reviews target back.
