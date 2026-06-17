// VerifyHUD — a fixed corner overlay that shows the CURRENT move's verify checklist + debug-color legend, so Antonio
// can confirm a move at a glance on localhost instead of cross-referencing the chat (METHOD.md → localhost-as-oracle).
// Content lives in verify-board.ts (edited each move). pointerEvents:none so it never blocks orbit. Hide with ?hud=0.
import { VERIFY } from "./verify-board";

export function VerifyHUD() {
  const hidden = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("hud") === "0";
  if (hidden) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        maxWidth: 320,
        padding: "10px 12px",
        background: "rgba(16,18,22,0.85)",
        color: "#e9e9ec",
        font: "12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.14)",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div style={{ color: "#8fd0ff", fontWeight: 700, letterSpacing: 0.4, marginBottom: 5 }}>▣ VERIFY · {VERIFY.url}</div>
      <div style={{ fontWeight: 600, marginBottom: 7 }}>{VERIFY.move}</div>
      <div>
        {VERIFY.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5, alignItems: "flex-start" }}>
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 3,
                flex: "0 0 auto",
                marginTop: 2,
                background: s.color ?? "transparent",
                border: s.color ? "1px solid rgba(0,0,0,0.35)" : "1px solid #7a7a7a",
              }}
            />
            <span>
              {s.label}
              {s.note ? <span style={{ opacity: 0.6 }}> — {s.note}</span> : null}
            </span>
          </div>
        ))}
      </div>
      {VERIFY.ask ? (
        <div style={{ marginTop: 7, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.1)", opacity: 0.85, fontStyle: "italic" }}>
          {VERIFY.ask}
        </div>
      ) : null}
    </div>
  );
}
