# tr3 Roof — STRAYS (quarantined: rules we defined, I misread, we corrected)

**This is the dirty batch, on purpose kept SEPARATE from `ROOF-GEOMETRY-RULES.md`.** Each entry is a
place where Antonio defined something, I interpreted it into output, and we **disagreed on the result**
— plus the correction that became canon. It is a calibration instrument: a new session (esp. a new
model) reads this to avoid re-walking the same walls. **Nothing here is a current rule.** The current
rules live only in `ROOF-GEOMETRY-RULES.md`.

Error types: **model** (the code/math behaved differently than expected) · **intent** (built what was
said, not what was meant) · **belief** (rested on a false assumption about the input).

---

## S1 — Global lower-envelope of all eaves  *(model error)* — THE big one
- **What I did:** unioned the prim footprints into one polygon and took the **min of every eave plane
  together** over it.
- **Why it's wrong / the disagreement:** it HIPS everything and **cuts the host** — it truncated the
  central's facet I at the ext, notched the footprint, and made the ext look "stuck cutting into" the
  central. Antonio: "you stuck a whole ext prim to cut into our central prim… the host must not be
  tampered."
- **Correction (now canon):** **MAX-OF-TENTS.** min within ONE prim's own eaves; MAX across prims. The
  host stays a complete tent; the ext is deleted where the host is taller. → RULES #1, #2.

## S2 — Over-diminishing the diminished facet  *(intent error; my under-spec follow-through)*
- **What I did:** modelled "diminished" as a raw eave-raise of `1.4` (huge).
- **Why it's wrong / the disagreement:** the eave rose so high that facet I sat **above the whole ext**,
  so there was almost no valley — the melt interface degenerated into a wall. Antonio: "the diminishing
  made the interfacing surface too small."
- **Correction (now canon):** diminish by **rafter FRACTION**, kept **modest** (example 8%). → RULE #13.

## S3 — Bridging the roof↔wall discontinuity  *(model error)*
- **What I did:** rendered ONE continuous single-valued heightfield over the whole union.
- **Why it's wrong / the disagreement:** at facet I's raised eave (a wall), the surface dropped to the
  lower wing roof across that line; a continuous heightfield can't go vertical, so it **ramped/"weaved"**
  the gap. Antonio: "you tried to weave/bridge the disconnect… walls remain walls."
- **Correction (now canon):** **walls eat roofs** — mesh prims as **separate regions** + drop a
  **vertical step-wall** at the eave; the roof behind it is deleted. → RULE #7 + Rendering Contract.

## S4 — Soft / zigzag creases  *(model error)*
- **What I did:** subdivided heightfield + `computeVertexNormals` (averaged).
- **Why it's wrong / the disagreement:** the grid never lands on the hip/valley/ridge lines, so creases
  rounded into a zigzag staircase and averaged normals blurred them. Antonio flagged the soft creases.
- **Correction (now canon):** **explicit flat facets** — each point is one active plane; split triangles
  at the **exact plane-equality crossing** (the crease); **analytic per-facet normals**. → Rendering Contract.

## S5 — "45° eaves" / hex bays  *(belief error)*
- **What I did:** read diagonal lines in the 2-D EagleView plan as 45° flat eaves; built a `buildHexBay`.
- **Why it's wrong / the disagreement:** Antonio (with a front photo): "there are no 45° eaves — you're
  misreading the hip line." Diagonals in plan are **sloped hips (convex) / valleys (concave)**.
- **Correction (now canon):** RULE #3. Deleted `buildHexBay`.

## S6 — Ext wider than its host  *(model/intent error)* — early
- **What I did:** used an ext whose width (9) exceeded the main width (6), so its ridge sat above the main.
- **Why it's wrong / the disagreement:** violates "main has the highest ridge; ext ≤ main." Antonio:
  "the main prim has the largest geometry; the ext should be the same height or lower."
- **Correction (now canon):** RULES #4, #5 (ext narrower than host; ridge/eave monotonicity).

## S7 — Facet-letter ambiguity (resolved, not an error)  *(intent / communication)*
- **The snag:** the spec said both "facet A melds into facet **K**" and "facet A melds into facet
  **f_a**," and "shares facet K." I wasn't sure which side did what.
- **Resolution (now canon):** the ext's **+X slope is coplanar with the hip end = facet K shared** (no
  valley); the ext's **−X slope = facet A melts into facet I (= f_a)** as the short valley. → RULES #12, #9, #13.
  *(Lesson: when facet letters conflict, restate the geometry — which slope is coplanar, which forms the
  valley — and confirm before building.)*

## S8 — Sonnet's detached overhang ext  *(model error)* — reverted
- **What happened:** on the Opus→Sonnet handoff, Sonnet attempted `buildOverhangExt` (hip host + ext
  whose ewidth straddles the +X corner). The ext rendered as a **disconnected floating object**, not
  melding into the host's perpendicular hip-end. Even after extending the support inward to the apex
  depth it stayed detached (top-down showed a separate island).
- **Why it's wrong:** the ext tent's support/region setup didn't let the max blend it into the host —
  the overhang strip was meshed/sampled as its own thing instead of the host winning where it's taller.
- **Resolution:** reverted to checkpoint `b53b117`, back on Opus. Overhang to be re-derived carefully
  in isolation (half-hip primitive first, then the coplanar/overhang interface), verifying each step.

## S9 — Ridge orientation from facet AREA  *(belief error)* — caught by grounding proportions
- **What I did:** inferred p1's ridge runs N-S because its biggest facets (K=742, L=1036) "must be the
  long sides." Built p1 long-N-S; Antonio said "looks good" (loosely) and I almost built all wings on it.
- **Why it's wrong / the disagreement:** when I grounded the footprint in EagleView feet, p1's core is
  ~52 E-W × ~46 N-S ⇒ **long axis is E-W ⇒ ridge E-W**, length 52−46 = **6 = the "+6" ridge** in the
  diagram. K/L are big NOT because p1 is long N-S, but because they're the **coplanar faces EXTENDED by
  the wings (degeneration)** — L is the whole east face (p1+p2+p4), K the whole west face (p1+p5/p6).
- **Correction (now canon):** **infer ridge orientation from the FOOTPRINT rectangle (long axis) and the
  ridge segments in the length diagram — NOT from facet areas**, which degeneration inflates. And: ground
  proportions in real measurements *before* composing dependent prims (STRAYS meta-lesson + WORKING-MEMORY).

## S10 — Truncated half-hip (facets D & E missing a chunk)  *(model/intent error)* — the L-footprint
- **What I did:** meshed the SE wing's footprint as a simple rectangle (the south band, z ≤ −23) plus the
  p1 region (x ≤ 26). The wing **overhangs p1 east AND spawns from sub p4**, so its *visible footprint is
  L-shaped* — the south band **+ an overhang corner** poking east past p1 (x 26–35, z −23 to −12).
- **Why it's wrong:** that overhang corner was in **no mesh region** → an unmeshed hole → facet **D**'s
  eave and the top of **E** were **truncated** (clipped at the region edge, hip-line cut short). Antonio:
  "facet D doesn't extend down to its eave… truncation is not a defined degeneration."
- **Correction (now canon):** a prim's **visible footprint can be non-rectangular** (spawn + overhang ⇒
  L-shape). **Mesh the FULL footprint of every prim** (all regions of the union), never assume a rect.
  Truncation/clipping of a facet = an **unmeshed sub-region**, not a defined degeneration. (Defined
  degenerations: melt/spawn, diminish, half-hip. Truncation is NOT one.)

---

### Meta-lesson (why these happened)
Most strays were me **bending a Z₂ invariant to force a Z₁ case** (S1 especially) or **letting the
renderer's convenience model dictate the geometry** (S3, S4). The pre-flight in `Pulse.md`
exists to catch exactly this: classify Z₂ vs Z₁, never hack a Z₁ case into the core, and verify by
screenshot before declaring victory.
