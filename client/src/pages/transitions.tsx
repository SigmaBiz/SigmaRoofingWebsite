import { useEffect, useRef } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// GRID — first-pass exhaust of the TRANSITION class. Five subtypes chained across six Sigma "sectors":
// iris · dissolve · wipe · push · morph. Theme: Portal concept rebranded to Sigma — light, Venus Blush,
// the chevron/roof motif as the focal "portal".

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const ROSE = "#C4897A";
const SAGE = "#7D9E82";
const NAVY = "#2C2A28";
const CREAM = "#F5F0EA";
const SHELL = "#E8D8C4";

const CH = [
  { bg: CREAM, accent: ROSE, label: "SECTOR 01", title: "Stand firm." },
  { bg: SHELL, accent: SAGE, label: "SECTOR 02", title: "The boundary holds." },
  { bg: CREAM, accent: NAVY, label: "SECTOR 03", title: "Precision, applied." },
  { bg: SHELL, accent: ROSE, label: "SECTOR 04", title: "Nothing gets through." },
  { bg: CREAM, accent: SAGE, label: "SECTOR 05", title: "Brave the storm." },
  { bg: SHELL, accent: NAVY, label: "SECTOR 06", title: "Serve with heart." },
];

const DEMOS = [
  { type: "iris", from: 0, to: 1, init: { clipPath: "circle(0% at 50% 50%)" } },
  { type: "dissolve", from: 1, to: 2, init: { opacity: 0 } },
  { type: "wipe", from: 2, to: 3, init: { clipPath: "inset(0% 100% 0% 0%)" } },
  { type: "push", from: 3, to: 4, init: { transform: "translateY(100%)" } },
  { type: "morph", from: 4, to: 5, init: { transform: "scale(0.7)", opacity: 0 } },
] as const;

function Chevron({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 120 96" width="148" height="118" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14,46 60,14 106,46" />
      <polyline points="14,74 60,42 106,74" />
    </svg>
  );
}

function Chapter({ c }: { c: (typeof CH)[number] }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-7" style={{ background: c.bg, color: NAVY }}>
      <p style={{ ...MONO, color: c.accent }} className="text-[11px] uppercase tracking-[0.4em]">
        SIGMA · {c.label}
      </p>
      <Chevron color={c.accent} />
      <h2 style={DISPLAY} className="text-balance px-6 text-center text-6xl font-light tracking-tight md:text-7xl">
        {c.title}
      </h2>
    </div>
  );
}

export default function Transitions() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      const st = (type: string) => ({ trigger: `.demo-${type}`, start: "top top", end: "62% top", pin: `.stage-${type}`, scrub: true as const });
      gsap.fromTo(".rev-iris", { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(150% at 50% 50%)", ease: "none", scrollTrigger: st("iris") });
      gsap.fromTo(".rev-dissolve", { opacity: 0 }, { opacity: 1, ease: "none", scrollTrigger: st("dissolve") });
      gsap.fromTo(".rev-wipe", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: st("wipe") });
      const p = gsap.timeline({ scrollTrigger: st("push") });
      p.fromTo(".rev-push", { yPercent: 100 }, { yPercent: 0, ease: "none" }, 0).fromTo(".from-push", { yPercent: 0 }, { yPercent: -28, ease: "none" }, 0);
      const m = gsap.timeline({ scrollTrigger: st("morph") });
      m.fromTo(".from-morph", { scale: 1, opacity: 1 }, { scale: 1.6, opacity: 0, ease: "power1.in" }, 0).fromTo(".rev-morph", { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, ease: "power1.out" }, 0);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#F5F0EA] text-[#2C2A28]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#2C2A28]/55 transition-colors hover:text-[#2C2A28]">
        ← Back
      </Link>

      {/* intro */}
      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#C4897A]">Grid · Transition Class — First-Pass Exhaust</p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">Transitions.</h1>
        <p style={MONO} className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#2C2A28]/45">five subtypes · scroll to test ↓</p>
      </section>

      {DEMOS.map((d) => (
        <section key={d.type} className={`demo-${d.type} relative h-[180vh]`}>
          <div className={`stage-${d.type} sticky top-0 h-screen overflow-hidden`}>
            <div className={`from-${d.type} absolute inset-0`}>
              <Chapter c={CH[d.from]} />
            </div>
            <div className={`rev-${d.type} absolute inset-0`} style={d.init as React.CSSProperties}>
              <Chapter c={CH[d.to]} />
            </div>
            <div className="absolute bottom-7 left-0 right-0 z-20 flex justify-center">
              <p style={MONO} className="rounded-full border border-[#2C2A28]/20 bg-[#F5F0EA]/70 px-4 py-1.5 text-[10px] uppercase tracking-[0.35em] text-[#2C2A28]/60 backdrop-blur-sm">
                transition · {d.type}
              </p>
            </div>
          </div>
        </section>
      ))}

      {/* outro */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center" style={{ background: SHELL }}>
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">Pick the ones we keep.</h2>
        <p style={MONO} className="max-w-md text-[11px] uppercase leading-relaxed tracking-[0.25em] text-[#2C2A28]/45">
          iris · dissolve · wipe · push · morph — the transition class, first pass
        </p>
      </section>
    </div>
  );
}
