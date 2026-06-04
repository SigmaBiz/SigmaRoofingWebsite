import { useEffect, useRef } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// GRID primitives: PARALLAX-DIFFERENTIAL (segment 1), SOLO-SCRUB (bg-only tails), and the
// TRANSITION class — first subtype: an IRIS / portal-wipe that opens from the orange portal into
// segment 2 (a bright "surface" chapter). Art theme: PORTAL.

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const ORANGE = "#FF8C42";
const BLUE = "#4AA8FF";
const SAGE = "#7D9E82";

const SEG1 = [
  "The subject begins its descent into the enrichment center.",
  "Each chamber looks the same. The exit never does.",
  "Velocity is conserved. So is everything you bring with you.",
  "The cake, as you may have heard, is a statistical artifact.",
  "What falls through the orange returns through the blue.",
];
const SEG2 = ["The facility ends. The sky does not.", "Atmosphere restored. The test is over. Step outside."];

function Portal({ top, color, w, h, label }: { top: string; color: string; w: number; h: number; label?: string }) {
  return (
    <div style={{ position: "absolute", top, left: "50%", transform: "translateX(-50%)" }}>
      <div style={{ width: w, height: h, borderRadius: "50%", border: `2px solid ${color}`, boxShadow: `0 0 90px ${color}66, inset 0 0 70px ${color}33` }} />
      {label && (
        <p style={MONO} className="mt-4 text-center text-[10px] uppercase tracking-[0.35em]">
          <span style={{ color }}>{label}</span>
        </p>
      )}
    </div>
  );
}

function Label({ top, left, dark, children }: { top: string; left: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <p style={{ ...MONO, position: "absolute", top, left }} className={`text-[10px] uppercase tracking-[0.3em] ${dark ? "text-[#1A1C20]/40" : "text-[#E8EAED]/35"}`}>
      {children}
    </p>
  );
}

export default function Grid() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      // segment 1: deep parallax differential
      gsap.to(".bg-inner", { yPercent: -32, ease: "none", scrollTrigger: { trigger: ".para-section", start: "top top", end: "bottom bottom", scrub: true } });
      // transition: iris-wipe opens segment 2
      gsap.set(".iris", { "--iris": "0%" } as gsap.TweenVars);
      gsap.to(".iris", { "--iris": "152%", ease: "none", scrollTrigger: { trigger: ".seg2", start: "top top", end: "30% top", scrub: true } } as gsap.TweenVars);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#0E1116] text-[#E8EAED]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#E8EAED]/55 transition-colors hover:text-[#E8EAED]">
        ← Back
      </Link>

      {/* intro */}
      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#FF8C42]">Grid Primitives — Parallax · Transition</p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">Deep parallax.</h1>
        <p style={MONO} className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#E8EAED]/45">background slow · foreground fast · scroll ↓</p>
      </section>

      {/* SEGMENT 1 — deep parallax differential */}
      <section className="para-section relative h-[480vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="bg-inner absolute inset-x-0 top-0 h-[175vh]" style={{ backgroundImage: "radial-gradient(circle, rgba(232,234,237,0.07) 1px, transparent 1px)", backgroundSize: "26px 26px" }}>
            <Label top="6vh" left="8%">APERTURE SCIENCE</Label>
            <Label top="6vh" left="62%">ENRICHMENT CENTER</Label>
            <Portal top="20vh" color={BLUE} w={280} h={400} label="Portal · Blue" />
            <Label top="56vh" left="10%">TEST CHAMBER 02</Label>
            <Label top="60vh" left="78%">v.4.21.0</Label>
            <div style={{ position: "absolute", top: "70vh", left: "12%", right: "12%", height: 1, background: "rgba(232,234,237,0.12)" }} />
            <Portal top="84vh" color={ORANGE} w={280} h={400} label="Portal · Orange" />
            <Label top="120vh" left="14%">MOMENTUM: CONSERVED</Label>
            <Label top="124vh" left="70%">SPEED 0.000 m/s</Label>
            <div style={{ position: "absolute", top: "138vh", left: "12%", right: "12%", height: 1, background: "rgba(232,234,237,0.12)" }} />
            <Label top="160vh" left="42%">— END OF SECTOR —</Label>
          </div>
          <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 200px rgba(14,17,22,0.9)" }} />
        </div>
        <div className="relative z-10 -mt-[100vh]">
          {SEG1.map((s, i) => (
            <div key={i} className="grid-step flex min-h-screen items-center justify-center px-6">
              <div className="max-w-md border border-[#E8EAED]/15 bg-[#0E1116]/75 p-7 backdrop-blur-sm">
                <p style={MONO} className="text-[10px] uppercase tracking-[0.3em] text-[#FF8C42]">// observation {String(i + 1).padStart(2, "0")}</p>
                <p style={DISPLAY} className="mt-3 text-3xl font-light leading-snug md:text-4xl">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEGMENT 2 — TRANSITION (iris opens from the orange portal) into a bright chapter */}
      <section className="seg2 relative h-[320vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* dark backdrop carried from segment 1 (the orange portal) */}
          <div className="absolute inset-0 flex items-center justify-center bg-[#0E1116]">
            <div style={{ width: 300, height: 430, borderRadius: "50%", border: `2px solid ${ORANGE}`, boxShadow: `0 0 110px ${ORANGE}66, inset 0 0 80px ${ORANGE}44` }} />
          </div>
          {/* bright "surface" scene revealed by the iris */}
          <div className="iris absolute inset-0" style={{ clipPath: "circle(var(--iris) at 50% 52%)", "--iris": "0%" } as React.CSSProperties}>
            <div className="absolute inset-0 bg-[#EDEAE3]" style={{ backgroundImage: "radial-gradient(circle at 50% 38%, rgba(125,158,130,0.18), transparent 55%)" }}>
              <div style={{ position: "absolute", top: "52%", left: 0, right: 0, height: 1, background: "rgba(26,28,32,0.18)" }} />
              <div style={{ position: "absolute", top: "calc(52% - 130px)", left: "50%", transform: "translateX(-50%)", width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${SAGE}, ${SAGE}00 70%)` }} />
              <Label top="10vh" left="9%" dark>SURFACE</Label>
              <Label top="10vh" left="74%" dark>ATMOSPHERE RESTORED</Label>
              <Label top="62vh" left="42%" dark>— SECTOR CLEARED —</Label>
            </div>
          </div>
        </div>
        <div className="relative z-10 -mt-[100vh]">
          <div className="h-[120vh]" />
          {SEG2.map((s, i) => (
            <div key={i} className="flex min-h-screen items-center justify-center px-6">
              <div className="max-w-md border border-[#1A1C20]/15 bg-[#EDEAE3]/80 p-7 text-[#1A1C20] backdrop-blur-sm">
                <p style={MONO} className="text-[10px] uppercase tracking-[0.3em] text-[#5E7D63]">// observation {String(i + 6).padStart(2, "0")}</p>
                <p style={DISPLAY} className="mt-3 text-3xl font-light leading-snug md:text-4xl">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* outro */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#EDEAE3] px-6 py-24 text-center text-[#1A1C20]">
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">Two segments, one transition.</h2>
        <p style={MONO} className="max-w-md text-[11px] uppercase leading-relaxed tracking-[0.25em] text-[#1A1C20]/45">parallax · solo-scrub · iris-wipe — chained. the grid grows.</p>
      </section>
    </div>
  );
}
