import { useState } from "react";

// Throwaway POC (deletable): compare a cheap buildingInsights-only "sketch" vs the $0.075 Solar Data-Layers image
// vs a satellite static-map (plain + with our measured roof outline), for one address. Decides the estimate-card image.
const DEFAULT_ADDR = "11508 N Florida Avenue, Oklahoma City, OK";

export default function SketchTest() {
  const initial = (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("address")) || DEFAULT_ADDR;
  const [addr, setAddr] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const q = encodeURIComponent(submitted);

  const tiles = [
    { key: "sketch", src: `/api/roof-facet-sketch?address=${q}`, title: "Our sketch — buildingInsights only", note: "$0.01/call · 10,000 free/mo · the cheap path" },
    { key: "solar", src: `/api/roof-image?address=${q}`, title: "Solar Data Layers (current)", note: "$0.075/call · 1,000 free/mo · today's image" },
    { key: "satellite", src: `/api/roof-satellite?address=${q}`, title: "Satellite (zoom 21)", note: "~$0.002/call · the real roof photo" },
    { key: "satellite-outline", src: `/api/roof-satellite?address=${q}&outline=1`, title: "Satellite + measured outline", note: "real photo + our roof footprint in gold" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0d1626", color: "#fff", fontFamily: "ui-sans-serif,system-ui", padding: "32px 28px" }}>
      <h1 style={{ fontSize: 25, fontWeight: 800, margin: 0 }}>Roof-image POC — sketch vs Solar vs satellite</h1>
      <form onSubmit={(e) => { e.preventDefault(); setFailed({}); setSubmitted(addr); }} style={{ margin: "16px 0 26px", display: "flex", gap: 10, maxWidth: 720 }}>
        <input value={addr} onChange={(e) => setAddr(e.target.value)} style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #2a3950", background: "#0b1322", color: "#fff", fontSize: 15 }} />
        <button type="submit" style={{ padding: "10px 18px", borderRadius: 8, border: 0, background: "#1d4e89", color: "#fff", fontWeight: 700 }}>Render</button>
      </form>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        {tiles.map((t) =>
          failed[t.key] ? null : (
            <figure key={t.key} style={{ margin: 0, width: 340 }}>
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #243248", background: "#0b1322" }}>
                <img src={t.src} alt={t.title} style={{ width: "100%", display: "block" }} onError={() => setFailed((f) => ({ ...f, [t.key]: true }))} />
              </div>
              <figcaption style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t.title}</div>
                <div style={{ color: "#8a97a8", fontSize: 13 }}>{t.note}</div>
              </figcaption>
            </figure>
          ),
        )}
      </div>
      <p style={{ color: "#8a97a8", fontSize: 13, marginTop: 26, maxWidth: 780, lineHeight: 1.6 }}>
        The sketch + satellite both use only data we already pay for (or ~$0.002) — so the binding free tier jumps from
        ~1,000 → ~10,000 estimates/month and cost drops ~$0.10 → ~$0.02. Satellite tuning: append <b>?zoom=20</b> / <b>?pin=1</b> to
        the satellite URLs to experiment.
      </p>
    </div>
  );
}
