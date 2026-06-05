# tr3 Roof Geometry Rules — CANONICAL (the kept rules)

**This is the CLEAN batch.** Every rule here produced geometry Antonio reviewed and **kept**. The
rules/interpretations that *strayed* (he defined → I misread → we corrected) are quarantined in
**`ROOF-STRAYS.md`** — read that too, as the "what NOT to do" list, but it is deliberately separate so
this file stays the trustworthy spec. Pre-flight checklist: **`ROOF-WORKING-MEMORY.md`**.

Organized with the **ζ-framework**: **Z₂** = invariants (always hold; a violation is a bug);
**Z₁** = fragile edge-cases (build deliberately, one at a time, verify each).

**The whole model in one line:** a roof is a **UNION OF FULL PRIM TENTS**, and its surface is the
**MAX (upper envelope)** of those tents. Each prim stays a **complete, undisturbed tent**; where the
host is taller it wins and the ext's overlapping part is *deleted by the host*; only the protruding
remnant remains. Melt, valleys, and hips all fall out of the max.

> **The single most important distinction (it cost us a full detour):** take the **MIN within ONE
> prim's own eave planes** (that is a prim's tent), then the **MAX ACROSS prims**. A *global*
> lower-envelope of *all* eaves together is the wrong model — it cuts the host. **min within a prim;
> MAX across prims.** (See `ROOF-STRAYS.md` #1.)

---

## Z₂ — INVARIANTS (always true)

1. **Max-of-tents.** Roof height(p) = max over prims of that prim's tent height (−∞ where the prim
   doesn't reach). Every prim is complete and closed. **The host is never tampered with**; the ext is
   deleted where the host is taller.
2. **A prim's tent = the MIN of its own eave planes** (each eave throws a plane up at the pitch),
   within that prim's footprint. Combine prims only with the MAX (#1).
3. **Eaves are level and 90°.** **No 45° eaves.** Diagonals in a bird's-eye plan are **hips** (convex)
   and **valleys** (concave) — sloped 3-D lines, not flat edges.
4. **Main prim** = the one with the **highest ridge** (greatest eave→ridge RISE) **and** the **most
   exts**; always a **FULL** prim, never a half.
5. **Height monotonicity.** Every ext's ridge ≤ the main's ridge; eaves level (except a diminished
   facet, #13). Since ridge height = `wallH + (half-width)·pitch`, **every ext is narrower than its host**.
6. **No open ends / no open interfaces.** The surface is continuous; every prim is closed.
7. **WALLS EAT ROOFS.** A **wall** is the vertical face dropping from an eave to the ground (no
   overhangs yet). A wall is **undisturbed** by any roof meeting it: where a roof interfaces a wall,
   **that part of the roof is deleted** and the clean vertical wall remains. A tent's eave is a hard
   boundary — where it stands **higher** than the neighbouring max, a **vertical step-wall** drops from
   the eave to the lower surface. **Never bridge/weave** a height gap with a sloped roof triangle.

## Z₂ — DERIVED GEOMETRY (forced by the invariants)

8. **Ext ridge ⊥ the host slope it spawns from** (parallel to the **ifet** eave). **ifet** = the ext's
   slopes that meet the host at the interface; **ofet** = the ext's outer/hip-end facet. A gable ext
   has only ifets; a hip ext adds one ofet.
9. **Melt.** The ext tent extends **inward, under the host**; the max deletes it there. The visible
   melt is the **valley** where the ext tent crosses the host tent — it falls out of the max with the
   host untouched. A gable ext's ridge runs **all the way** to that crossing (stopping at the host eave
   leaves an open end).
10. **Caps.** `hip` → the outer end hips down to an eave. `gable` → the outer end is a vertical gable
    wall (the footprint wall there rises to the ridge profile for free). Both melt the same at the inner end.

## Z₂ — PARAMETERS (controlled knobs)

11. **ewidth = `[a, b]`** along the host eave (interface-triangle base). Interior `[a,b]` → two valleys.
12. **Coplanar end (facet K shared).** An ewidth endpoint AT the host-eave end → that side's ext slope
    is **coplanar** with the host's hip/rake (no valley; the host facet's plane is shared, undisturbed).

---

## Z₁ — EDGE CASES (build deliberately, verify each)

13. **Diminished slope.** A host long-facet (`f_a`) with a **shortened rafter**: its eave sits higher,
    the ridge shifts toward it. **Parameterise by the rafter-shorten FRACTION** (`f_a` rafter =
    `(1 − dimFrac)·f_b` rafter; derive the eave-raise: `dimRise = 2·pitch·zRidge`,
    `zRidge = hWm − f_a_run`). **Keep `dimFrac` modest** (our example: 8%). The raised eave is itself a
    wall (#7) — the step/drop where a lower ext eave rejoins it. *(Over-raising kills the melt — STRAYS #2.)*
14. **Parallel spawning** (needs no rake). One interface-triangle hypotenuse is forced **coplanar** with
    a host slope at one END of the host (same pitch).
    - **Hip host:** an ewidth endpoint coincides with the host-eave end (the corner) → the ext side ifet
      is coplanar with the host's hip-end slope (facet K). The ewidth may extend past the eave (overhang)
      if the other endpoint is inside.
    - **Gable host:** spawns off the gable END; ewidth within the gable-end base. (Entangled with #16.)
15. **Dormer** — an ext on a sub-prim whose interface base sits above the host eave (`eave < base < ridge`).
16. **Wing = ext-on-ext** — the host is a sub-prim, not the main (recursion). Bound: `bound_host ⊇ bound_ext`.

---

## RENDERING CONTRACT (kept — this is what makes it look right)

- **Plane table + active plane.** Enumerate the distinct eave/slope **planes**; each carries its height
  fn, analytic surface normal, and 2-D up-slope. A tent = `minTent(planeIds, support)` returning the
  **active plane id** (argmin). `maxTents([...])` returns the winning tent's `{h, id}`.
- **Separate-region meshing + step-walls (walls eat roofs).** Mesh each prim's footprint **separately**
  (so the surface never bridges a hard eave boundary); add ground-walls along the union outline and
  **vertical step-walls** at internal seams where one eave stands above its neighbour.
- **CRISP FACETS.** Subdivide each region; for every fine triangle read its 3 vertices' active plane;
  where they differ, **split at the exact plane-equality crossing** (`plane_a == plane_b` solved on the
  edge — that *is* the crease line) and give each facet its **analytic plane normal** (flat, no
  averaging). Rare triple-points get one tiny transitional triangle (each vertex on its own plane).
- **Verify** every change with a Playwright screenshot of `/skins` (localhost:3000). Don't declare
  victory — show Antonio and confirm.

## Engine map

- `client/src/lib/tr3/solver2.ts` — the engine. Key exports/parts: `mkPlane`, `minTent`, `maxTents`,
  `meshFromTents` (crisp facets + ground/step walls), and `buildDimHipGableExt(L,W,wallH,pitch,dimFrac,
  extA,extLen)` — **the reference build**: diminished central hip + coplanar gable ext melting into
  `f_a`. `solveEnvelope`/`buildDiminishedHip` are single-prim helpers (a lone prim's own min-of-eaves =
  its tent; safe for ONE prim). `buildPrimRoof` is a legacy all-hip path — prefer the tent builders.
- Demo: `/skins` (localhost:3000), branch `design-reskin`. 6 skins, scroll-driven 4-stop camera.

## Status — all DONE + Antonio-approved through 2026-06-05

Z₂ invariants · derived geometry · ewidth · caps · melt · **max-of-tents** · **walls-eat-roofs
(step-walls)** · **diminished slope by rafter-fraction (8%)** · **coplanar (facet K)** · **crisp facets**.
**Next:** #14 parallel-spawn/overhang → #15 dormer → #16 wing → faithful Crestridge recreation.

→ The strayed interpretations we corrected along the way are in **`ROOF-STRAYS.md`** (kept separate).
