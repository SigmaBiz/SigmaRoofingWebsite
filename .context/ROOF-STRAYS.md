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

---

### Meta-lesson (why these happened)
Most strays were me **bending a Z₂ invariant to force a Z₁ case** (S1 especially) or **letting the
renderer's convenience model dictate the geometry** (S3, S4). The pre-flight in `ROOF-WORKING-MEMORY.md`
exists to catch exactly this: classify Z₂ vs Z₁, never hack a Z₁ case into the core, and verify by
screenshot before declaring victory.
