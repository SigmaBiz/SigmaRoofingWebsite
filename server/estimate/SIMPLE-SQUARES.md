# Simple Squares — the reliable instant roof estimate

**What it is:** address → **squares + pitch + facet count + perimeter + a roof image**, instantly, for ~any US
address. The *reliable* deliverable — no fragile reconstruction. Powers the **traffic widget** (instant estimate → booking CTA).

**What it is NOT:** the interior **linear takeoff** (ridge / hip / valley LF). That's the hard "EagleView-grade report"
tier — the LiDAR / straight-skeleton engine (`lidar/HANDOFF.md`), OKC-metro only and still imperfect. Simple Squares
ships only what's reliable everywhere.

## Configured defaults (locked with Antonio)
| field | default | backup / alternates |
|---|---|---|
| squares · pitch · facets | Google Solar `buildingInsights` | — (the one rock-solid source) |
| **perimeter** | **Solar bounding-box** | **Overture footprint** (cross-check) |
| **image** | **DSM facet map** | facet-box card · raw RGB aerial |

---
## 1 · Squares + pitch + facets — Google Solar `buildingInsights`
- **Technical:** `solarPotential.wholeRoofStats.areaMeters2` ÷ 9.290304 → **squares**; per-facet `pitchDegrees`
  (area-weighted + modal bucket) → **rise/12 pitch**; `roofSegmentStats.length` → **facet count**; each facet also
  carries azimuth + area. Code: `server/estimate/measure.ts` (`computeMeasurement`), live `POST /api/estimate`,
  CLI `server/scripts/roof-card.ts`.
- **Narrative:** the rock-solid core — Google's own photogrammetry. This is the number the widget leads with.
- **Validated:** Crestridge **44.6 sq** vs EagleView 43.5 (**+2.4%**), **8/12** exact, **12 facets** exact ·
  605 NW 115th **22.4 sq / 5/12 / 4 facets**.

## 2 · Perimeter — two methods (default + backup), and the durability rule
**(a) Solar bounding-box — DEFAULT** · `server/scripts/roof-card.ts`
- *Technical:* take each facet's Solar **bounding box**, rasterize the UNION on a 0.5 ft grid, trace the boundary → outline LF.
- *Accuracy:* **nails COMPACT roofs** (a hip that fills its bounding box) but **OVERSHOOTS L/T shapes** (the box swallows
  the inner notch). 605 NW 115th (compact): **199′ vs EV 199.9 (−0.5%)**. Crestridge (complex): **333′ vs EV 310 (+7%)**.
- *Why default:* free — it's the *same* `buildingInsights` data, no extra call; instant; exact on the common compact roof.

**(b) Overture footprint — BACKUP / cross-check** · `lidar/perimeter.py`
- *Technical:* the real Overture **building-outline polygon** containing the point → reproject EPSG:6344 (m) → length ×3.28.
- *Accuracy:* a TRUE polygon → **holds on ANY shape**, but reads **~overhang short** (Overture traces the *building*
  outline; EagleView measures the *roof edge* ~6–12″ beyond → add ~0.4 ft buffer). 605: **196′ (−2%)**. Crestridge: **288′ (−7%)**.
- *Why backup:* a heavier call (Overture download) but the shape-robust truth.

**THE RULE (the durability move):** run BOTH. **Agree (≤~10%) → trust the default.** **Disagree (>~10%) → COMPLEX-roof
flag** → the two **bracket** EagleView (Solar-box high, Overture low) → report the **midpoint** (≈ EV) at lower confidence.
- 605 (compact): 199 vs 196 → agree → **~198′, high confidence.**
- Crestridge (complex L/T): 333 vs 288 → 16% apart → flag → midpoint **310.5 ≈ EV 310.** ✅

## 3 · Image — three options
**(a) DSM facet map — DEFAULT** · `server/scripts/roof-sketch.ts`
- Google Solar **DSM** (elevation) + **mask** → per-pixel **aspect** (`atan2` of the height gradient = which way it faces)
  → **hue** × a **hillshade** (relief), clipped to the roof mask. The colored regions ARE the facets; the seams ARE the
  ridges/hips/valleys. Looks like a real roof read; reliable wherever Solar covers. Uses `dataLayers` (heavier). → `client/public/sketch-<slug>.png`.
**(b) Facet-box card** · `lidar/sketch.py`
- Overture outline + the Solar facet bounding boxes colored by direction + downslope arrows + area/pitch labels + the
  headline numbers. Schematic/clean; cheaper (no `dataLayers`). → `sketch_<slug>.png`.
**(c) Raw RGB aerial** · `server/scripts/roof-image.ts`
- The unmodified Google Solar RGB photo (`dataLayers` `rgbUrl` GeoTIFF → PNG). The literal overhead image. → `solar_rgb_<slug>.png`.

## 4 · $ ballpark (FREE TIER) · `server/estimate/pricing.ts` — faithful to CloudBid V14, no linear takeoff
Real CloudBid **OC-standard unit costs** run through the estimator's EXACT assembly. Two functions:
**`roofCost(geom)`** = faithful cost for an explicit geometry (the future paid/takeoff tier calls this same fn);
**`priceEstimate(measurement)`** = the free tier (predicts the missing linear from facets, then calls `roofCost`).
- **Per line:** qty = `CEILING(qty_raw × (1+waste))` → × unit price. Waste = **shingle 8%**, underlayment/starter/cap/drip/ice **20%** (buy whole bundles/rolls).
- **Total assembly (CloudBid "Estimate" sheet, rows 56–76, EXACTLY):**
  `Material Net = COG_raw × (1 + 30% markup + 8.625% OK tax) = ×1.38625` ·
  `Labor Net = COS_raw × (1 + 30% markup + 0% WC) = ×1.30` ·
  `Total = (Material Net + Labor Net) × (1 + 10% overhead) = ×1.10`.
  ⚠ Tax + markup are **ADDITIVE on raw material** — the earlier `×1.3` silently dropped the 8.625% tax.
- **~77% squares-based** (shingle/underlayment/install) + **~4% perimeter** (starter/drip) — both MEASURED.
- **Ridge vent** sized from **IRC R806.2 1/300 on footprint** (balanced ridge+soffit) — recoverable from squares, not ridge length.
- The ONLY estimated slice — **hip/ridge cap + ice-on-valleys (~4–13%)** — predicted from Solar's **FACET COUNT**:
  `interior_LF (counted once) ≈ 23.2·facets + 1.19·√footprint`, ~25% valley. (Fit on Crest/Lee/Hinkle vs EagleView.)
- **Reconciled to the live estimator:** Lee on its actual EagleView geometry → **`roofCost` $12,394 vs CloudBid $12,095.99 (within 2.5%)**;
  residual = exact squares/perimeter inputs. Logic also checked against the sheet's own embedded 18.53-sq example.
- **Base-roof assumptions baked in (OKLAHOMA):** single-story · 3/12–7/12 · OC Duration · full tear-off (no re-deck) ·
  **HIGH-profile cap (20 LF/bn — locked with Antonio)** · balanced vent · 3 pipe jacks + 1 gas-vent · no chimney/skylight/wall
  flashing/gutter R&R. ⚠ **Oklahoma-code disclaimer emitted in the output** (`assumptions.base`).
- Examples (free tier): Crest **$21.5k** · Lee **$12.75k** · Hinkle **$15k** · 2,200 sf **$11.25–11.75k** (1-story).
  `CONFIG` is Antonio-tunable (dollars + markups, not logic). **Ballpark, never a quote.**

## Validation (vs real EagleView reports)
| roof | squares | pitch | facets | perimeter (Solar-box / Overture / **EV**) |
|---|---|---|---|---|
| **Crestridge** (complex 12-facet) | 44.6 (EV 43.5, +2.4%) | 8/12 ✓ | 12 ✓ | 333 / 288 / **310** — bracket → ~310 |
| **605 NW 115th** (compact hip) | 22.4 | 5/12 | 4 | 199 / 196 / **199.9** — agree → ~198 |

## How to run
```
npx tsx server/scripts/roof-card.ts "<address>"      # squares + pitch + facets + Solar-box perimeter
…/Xcode…/python3 lidar/perimeter.py "<address>"      # Overture backup perimeter
…/Xcode…/python3 server-less? no — npx tsx ...        # (TS engine; perimeter.py is python)
npx tsx server/scripts/roof-sketch.ts "<address>"    # DSM facet map  → client/public/sketch-<slug>.png
npx tsx server/scripts/roof-image.ts  "<address>"    # raw RGB aerial → client/public/solar_rgb_<slug>.png
…/Xcode…/python3 lidar/sketch.py      "<address>"    # facet-box card → client/public/sketch_<slug>.png
```
Live engine: `POST /api/estimate {"address":"..."}` → squares/pitch/facets/$ (perimeter + image not in the JSON yet).
Put-together demo card: `client/public/estimate-card.html` → `http://localhost:3000/estimate-card.html`.

## Cost & coverage
- `buildingInsights` (squares/pitch/facets) = **cheap** — fire per lookup, cache 24 h. `dataLayers` (DSM map + RGB) =
  **heavier/pricier** — use for the detail view / report, **NOT** every widget hit.
- Solar coverage = most US metros (gate on `imageryQuality`); Overture footprints ≈ universal. Rural gaps → "confirm at inspection".

## What it powers / what's left
The instant-estimate **widget**: address → squares + $ range + image + booking CTA.
- ✅ **Backend** — `POST /api/estimate` (measurement + pricing, 24h cache) + `GET /api/roof-image?address=` (DSM facet
  map PNG via `renderRoofSketch`, 24h cache; **BUILT 2026-06-15**).
- ✅ **Front-end `/estimate` page (BUILT 2026-06-15)** — `client/src/pages/estimate.tsx`, lazy route in `App.tsx`. Hero
  answers the "2,200 sq ft" query → address autocomplete + material chips → `POST /api/estimate` → **sticky result card**
  (squares/pitch/facets/perimeter + $ range + DSM roof image) with the **2,200-sf default state**, soft-fail → inspection
  branch, embedded `MVP3ContactForm` booking CTA. CSS-`sticky` pin (not GSAP); production navy/shadcn skin. Verified on
  localhost: Crestridge 44.6 sq → $19.5–23.75k, image 253×308 cached 0 ms.
- ✅ **Phase 2 — SEO (BUILT 2026-06-15):** `server/seo.ts` `injectSeo(url, html)` rewrites the served `/estimate` HTML
  (hooked into `server/vite.ts`, dev + prod) with per-route `<title>`/description/canonical/OG + **`FAQPage` (6 cost
  Q&As) + `RoofingContractor`/`LocalBusiness` JSON-LD** (NAP, LIC#80006734, 12 service cities, socials) + a `<noscript>`
  mirror of the answer copy — so the schema + copy are in the HTML Google fetches without running JS (kills the
  "neutrino"). Single source `shared/estimate-seo.ts` feeds BOTH the schema and the page's visible FAQ (parity = not
  cloaking). Home `/` passes through untouched. Verified: 2 valid JSON-LD blocks in served HTML; facts lifted from the
  live home page. ✅ **`aggregateRating` LIVE (2026-06-15):** real Google **4.8★ / 26 reviews** + 3 `Review` objects from
  `/api/reviews` (now cached 6h in `server/reviews.ts` — was 2 Places calls/hit), injected per-request via
  `getCachedReviews()`, and backed by a **visible reviews strip** on the page (policy parity). Omitted gracefully on a
  cold/failed cache. ⏳ Later: optional full React SSR. (Note: the home page's `testimonials.tsx` still hardcodes "5.0" — real is 4.8.)
