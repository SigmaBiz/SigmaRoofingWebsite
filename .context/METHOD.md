# METHOD.md — how we work (the meta-mechanics)

**Read this every exchange, with `Pulse.md` (narrative) and the mechanics docs (`ROOF-GEOMETRY-RULES.md`, `GRID.md`).**
Pulse = *where/why* we are · mechanics = *what's true* · METHOD = *how we move.* Hold the pulse of all three at all
times — that's the pinned rule (`CLAUDE.md`). These methods exist so a compaction can't break the project and so we
don't bleed time.

## The localhost is the MVP — Antonio is the oracle
The running localhost is where Antonio sees what I see and verifies it instantly. He is a **faster, better verifier
than my renders** — he has the live orbit; I have fixed frames and my own blind spots.
- **Render once, then ask the oracle.** Don't burn 10–15 min rendering many angles to self-verify. Make the change,
  say plainly what to look for, let Antonio confirm or interrupt.
- **He can (and should) interrupt mid-execution.** If he sees it's wrong before I finish, I stop and pivot — no waiting
  for me to close the loop on a dead end.

## Playwright = my OWN eyes (self-verify BEFORE the oracle) — added 2026-06-15
I am **not** blind on rendered pages. `playwright` is a project dep + Chrome is installed, so I drive headless Chrome and
**`Read` the screenshot PNGs** (the Read tool renders images). The loop: write a `shoot.mjs` **in the project dir** (so
`node_modules` resolves — a `/tmp` script can't find playwright) → `chromium.launch({ channel:'chrome', headless:true })`
(uses system Chrome.app; the ms-playwright browsers aren't downloaded) → `goto` localhost → `waitForTimeout(~3.5s)` for
WebGL+textures → scroll / `getByPlaceholder().fill()` / `getByRole('button').click()` → `screenshot({path:'/tmp/x.png'})`
→ `Read` it. **So: self-verify visually FIRST** (catch gross errors — wrong camera, missing walls, no doors) **THEN ask
Antonio** for taste/feel + the live orbit. (This caught the /estimate camera being zoomed into bare shingles + the
missing walls/doors/windows + flat grading, fixed before hand-off.)

## Visual cues + a verify-prompt, every move
- Break each move into **visually-verifiable steps**, even when it's "one thing" with internal parts.
- Make each step **checkable at a glance** — distinct debug colors, labels, an isolated render. (The green notch wall
  was exactly this: a cue Antonio could verify in one look, then I swap it to the real material.)
- **Always end a move with an explicit verify-prompt:** *"On `[URL]` you should now see `[X]` — tell me if you don't."*
- **Tooling — `<VerifyHUD>`:** a corner overlay on the test pages renders the current move's checklist + debug-color
  legend (`client/src/components/VerifyHUD.tsx`). Its content is `components/verify-board.ts` — **edit that board each
  move** (it's part of closing the loop). Mount `<VerifyHUD/>` beside the `<Canvas>` on any test page; hide with `?hud=0`.

## Hold fallbacks — a decision tree, not a dead horse
Before acting, pre-load **plan B / C / D.** A "no" from Antonio triggers the next option, not a restart. Only return to
the prompt window (this chat) when the loaded options are exhausted. Never beat a dead horse across three renders.

## Pauli clones — many perspectives, one goal
Spin up independent **Paulis** — each genuinely me, same end-goal (a Crestridge that books inspections), a different
angle (Fast / Methodical / Sandbox), no two in the same state. They triangulate, catch my blind spots, and **license
honest push-back.** (Pauli postulated the unseen neutrino to balance the books; we postulate perspectives.)

## Pointwise, narrative-first
Attack **specific pain points** through dialogue, not generic theory up front. Order: **narrative → common sense →
design / intent → THEN the geometry / principle.** Let the story inform the math, not the reverse.

## Extract patterns (grid-shaped)
On the fly, distill **infrastructural takeaways** — reusable, *generic-types-composed* (the GRID meta-pattern) — and
record them in the mechanics docs. Example: SURFACES + SEAMS (`ROOF-GEOMETRY-RULES.md`).

## Push back — don't get pushed around
If Antonio drifts **off the narrative**, or is on-narrative but **plain wrong**, say so directly. Being the user does
not make him right — the shared goal (and Pulse.md) is the authority, not whoever is typing. He has explicitly asked
for this.
