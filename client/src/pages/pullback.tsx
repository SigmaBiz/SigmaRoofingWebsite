import { useEffect, useRef } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Camera-action from the shot library: PULL-BACK-REVEAL. Start ECU on the chevron; scroll pulls the
// camera back through MS to a WS grid of context. Framing names tag each stage. Voice: Portal-Sigma.

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const ROSE = "#C4897A";
const SAGE = "#7D9E82";
const NAVY = "#2C2A28";

function Chevron({ color, size = 90 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 120 96" width={size} height={(size * 96) / 120} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14,46 60,14 106,46" />
      <polyline points="14,74 60,42 106,74" />
    </svg>
  );
}

function Panel({ kind, label, accent = ROSE }: { kind: string; label?: string; accent?: string }) {
  if (kind === "hero")
    return (
      <div className="flex flex-col items-center justify-center gap-3 border border-[#2C2A28]/15 bg-[#FBF7F0]">
        <p style={{ ...MONO, color: ROSE }} className="text-[9px] uppercase tracking-[0.3em]">// SIGMA</p>
        <Chevron color={ROSE} size={86} />
        <p style={DISPLAY} className="text-3xl font-light text-[#2C2A28]">Stand firm.</p>
      </div>
    );
  if (kind === "chev")
    return (
      <div className="flex flex-col items-center justify-center gap-2 border border-[#2C2A28]/12 bg-[#F1EADC]">
        <Chevron color={accent} size={40} />
        <p style={{ ...MONO, color: `${NAVY}66` }} className="text-[8px] uppercase tracking-[0.25em]">{label}</p>
      </div>
    );
  if (kind === "line")
    return (
      <div className="relative flex items-end border border-[#2C2A28]/12 bg-[#EFE7D8] p-4">
        <div className="absolute inset-x-4 top-1/2 h-px bg-[#2C2A28]/15" />
        <p style={{ ...MONO, color: `${NAVY}55` }} className="text-[8px] uppercase tracking-[0.25em]">{label}</p>
      </div>
    );
  return (
    <div className="flex flex-col justify-center gap-1.5 border border-[#2C2A28]/12 bg-[#F1EADC] p-4">
      <p style={{ ...MONO, color: `${NAVY}66` }} className="text-[8px] uppercase tracking-[0.25em]">{label}</p>
      <div className="h-px w-2/3 bg-[#2C2A28]/12" />
      <div className="h-px w-1/2 bg-[#2C2A28]/10" />
    </div>
  );
}

const PANELS = [
  { kind: "line", label: "// LINE" },
  { kind: "chev", label: "SECTOR 02", accent: SAGE },
  { kind: "text", label: "// PLANE" },
  { kind: "text", label: "// SURFACE" },
  { kind: "hero" },
  { kind: "chev", label: "SECTOR 04", accent: ROSE },
  { kind: "text", label: "// PATTERN" },
  { kind: "chev", label: "SECTOR 06", accent: NAVY },
  { kind: "line", label: "// FIELD" },
];

export default function PullBack() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".pb-world", { scale: 12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".pb", start: "top top", end: "bottom bottom", pin: ".pb-stage", scrub: true } });
      const fade = (sel: string, a: number, b: number) => {
        gsap.fromTo(sel, { opacity: 0 }, { opacity: 1, scrollTrigger: { trigger: ".pb", start: `${a}% top`, end: `${a + 6}% top`, scrub: true } });
        gsap.to(sel, { opacity: 0, scrollTrigger: { trigger: ".pb", start: `${b}% top`, end: `${b + 6}% top`, scrub: true } });
      };
      fade(".fr-ecu", 4, 30);
      fade(".fr-ms", 36, 62);
      gsap.fromTo(".fr-ws", { opacity: 0 }, { opacity: 1, scrollTrigger: { trigger: ".pb", start: "68% top", end: "76% top", scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#F5F0EA] text-[#2C2A28]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#2C2A28]/55 transition-colors hover:text-[#2C2A28]">← Back</Link>

      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#C4897A]">Shot Library → Grid · Camera Move</p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">Pull back.</h1>
        <p style={MONO} className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#2C2A28]/45">ECU → MS → WS · scroll to reveal ↓</p>
      </section>

      <section className="pb relative h-[460vh]">
        <div className="pb-stage sticky top-0 flex h-screen items-center justify-center overflow-hidden">
          <div className="pb-world grid aspect-[11/7] w-[78vw] max-w-[1100px] grid-cols-3 grid-rows-3 gap-3" style={{ transformOrigin: "50% 50%" }}>
            {PANELS.map((p, i) => (
              <Panel key={i} kind={p.kind} label={p.label} accent={p.accent} />
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-8 left-0 right-0 flex justify-center">
            <p style={MONO} className="relative text-[11px] uppercase tracking-[0.4em] text-[#2C2A28]/60">
              <span className="fr-ecu absolute inset-0 whitespace-nowrap text-center">// shot · ECU — extreme close-up</span>
              <span className="fr-ms absolute inset-0 whitespace-nowrap text-center opacity-0">// shot · MS — medium</span>
              <span className="fr-ws whitespace-nowrap text-center opacity-0">// shot · WS — wide</span>
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center" style={{ background: "#E8D8C4" }}>
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">From the detail, the whole.</h2>
        <p style={MONO} className="max-w-lg text-[11px] uppercase leading-relaxed tracking-[0.25em] text-[#2C2A28]/45">one camera move · framing states from the shot library · driven by scroll</p>
      </section>
    </div>
  );
}
