/**
 * roof-facet-sketch.ts — POC: render a roof "sketch" from ONLY Solar `buildingInsights` (Essentials, $0.01, 10k free/mo)
 * — NO `dataLayers` (Enterprise, $0.075, 1k free/mo). Each roof facet's bounding box (lat/lng) + azimuth + area is drawn as a
 * colored top-down tile → a clean facet schematic, server-side, as an SVG string (zero image deps). Used by /api/roof-facet-sketch.
 *
 * Honest limit: buildingInsights gives bounding BOXES, not exact polygons — so this is a clean SCHEMATIC, not a pixel aerial.
 */
import { geocode, buildingInsights, degToRad, m2ToSquares, pitchToRise, EstimateError } from "../estimate/measure";

export async function renderFacetSketchSvg(
  address: string,
  key: string,
): Promise<{ svg: string; facetCount: number; squares: number; pitch: string; formattedAddress: string }> {
  const { location, formattedAddress } = await geocode(address, key);
  const data = await buildingInsights(location, key);
  const segs: any[] = data.solarPotential?.roofSegmentStats || [];
  if (!segs.length) throw new EstimateError("NO_BUILDING", "No roof segments for this address.");

  // lat/lng → local meters (so the roof keeps its true aspect ratio)
  const mPerLat = 111_132, mPerLng = 111_320 * Math.cos(degToRad(location.lat));
  const rects = segs
    .filter((f) => f.boundingBox?.sw && f.boundingBox?.ne)
    .map((f) => {
      const bb = f.boundingBox;
      const xW = bb.sw.longitude * mPerLng, xE = bb.ne.longitude * mPerLng;
      const yS = bb.sw.latitude * mPerLat, yN = bb.ne.latitude * mPerLat;
      return {
        xMin: Math.min(xW, xE), xMax: Math.max(xW, xE), yMin: Math.min(yS, yN), yMax: Math.max(yS, yN),
        az: (((f.azimuthDegrees ?? 180) % 360) + 360) % 360, area: f.stats?.areaMeters2 || 0, rise: pitchToRise(f.pitchDegrees || 0),
      };
    });
  if (!rects.length) throw new EstimateError("NO_BUILDING", "No facet boxes.");

  const exMinX = Math.min(...rects.map((r) => r.xMin)), exMaxX = Math.max(...rects.map((r) => r.xMax));
  const exMinY = Math.min(...rects.map((r) => r.yMin)), exMaxY = Math.max(...rects.map((r) => r.yMax));
  const wM = Math.max(0.1, exMaxX - exMinX), hM = Math.max(0.1, exMaxY - exMinY);

  const SIZE = 560, PAD = 30, CAP = 46; // square draw area · padding · caption bar
  const scale = Math.min((SIZE - 2 * PAD) / wM, (SIZE - 2 * PAD) / hM);
  const drawW = wM * scale, drawH = hM * scale;
  const offX = (SIZE - drawW) / 2, offY = PAD + ((SIZE - 2 * PAD) - drawH) / 2;
  const px = (xM: number) => offX + (xM - exMinX) * scale;
  const py = (yM: number) => offY + (exMaxY - yM) * scale; // north (max latitude) → top

  // totals for the caption
  const totalM2 = data.solarPotential?.wholeRoofStats?.areaMeters2 ?? segs.reduce((s, f) => s + (f.stats?.areaMeters2 || 0), 0);
  const squares = Math.round(m2ToSquares(totalM2) * 10) / 10;
  const buckets = new Map<number, number>();
  rects.forEach((r) => buckets.set(r.rise, (buckets.get(r.rise) || 0) + r.area));
  let modalRise = 0, modalA = -1;
  buckets.forEach((a, rise) => { if (a > modalA) { modalA = a; modalRise = rise; } });
  const pitch = `${modalRise}/12`;

  // facets big → small so the small ones aren't buried; each inset a hair so adjacent tiles read as distinct seams
  const ordered = [...rects].sort((a, b) => b.area - a.area);
  let body = "", n = 0;
  for (const r of ordered) {
    n++;
    const x0 = px(r.xMin), y0 = py(r.yMax), w0 = (r.xMax - r.xMin) * scale, h0 = (r.yMax - r.yMin) * scale;
    const ins = Math.min(3.5, 0.09 * Math.min(w0, h0));
    const x = x0 + ins, y = y0 + ins, w = Math.max(2, w0 - 2 * ins), h = Math.max(2, h0 - 2 * ins);
    body += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2.5" fill="hsl(${Math.round(r.az)},50%,58%)" fill-opacity="0.82" stroke="#141821" stroke-width="1.3" filter="url(#sh)"/>`;
    if (w > 26 && h > 18) body += `<text x="${(x + w / 2).toFixed(1)}" y="${(y + h / 2 + 4).toFixed(1)}" text-anchor="middle" font-family="ui-sans-serif,system-ui" font-size="12" font-weight="700" fill="#11161f" fill-opacity="0.65">${n}</text>`;
  }

  const H = SIZE + CAP;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${H}" viewBox="0 0 ${SIZE} ${H}">
  <defs><filter id="sh" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="1.4" stdDeviation="1.4" flood-color="#000" flood-opacity="0.3"/></filter></defs>
  <rect width="${SIZE}" height="${H}" fill="#e9ecf0"/>
  <rect x="7" y="7" width="${SIZE - 14}" height="${SIZE - 14}" rx="12" fill="#f6f7f9" stroke="#d6dae1"/>
  ${body}
  <text x="${SIZE - 18}" y="30" text-anchor="end" font-family="ui-sans-serif,system-ui" font-size="13" font-weight="800" fill="#aab2bd">N ↑</text>
  <rect x="0" y="${SIZE}" width="${SIZE}" height="${CAP}" fill="#0f1620"/>
  <text x="20" y="${SIZE + 29}" font-family="ui-sans-serif,system-ui" font-size="16" font-weight="800" fill="#ffffff">${segs.length} facets · ${squares} squares · ${pitch} pitch</text>
  <text x="${SIZE - 18}" y="${SIZE + 29}" text-anchor="end" font-family="ui-sans-serif,system-ui" font-size="11" fill="#7e8794">measured from satellite — Sigma Roofing</text>
</svg>`;

  return { svg, facetCount: segs.length, squares, pitch, formattedAddress };
}
