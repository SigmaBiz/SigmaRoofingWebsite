import { useEffect, useRef } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// CITY-GRID test run: grammar held constant (parallax-differential · pin-scrub), generics as
// placeholders (filler geometry · text-cloud capsules w/ vertical+horizontal cycle + a nested inner
// action · a surface-object doing rotate/scale), iris punctuation. Voice: Portal rebranded to Sigma (light).

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const ROSE = "#C4897A";
const SAGE = "#7D9E82";
const NAVY = "#2C2A28";

function Chevron({ color, size = 132 }: { color: string; size?: number }) {
  return (
    <svg viewBox="0 0 120 96" width={size} height={(size * 96) / 120} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14,46 60,14 106,46" />
      <polyline points="14,74 60,42 106,74" />
    </svg>
  );
}

// Text cloud — capsule = boxy clinical panel (capsule type coupled to the Portal/Swiss voice).
function TextCloud({ eyebrow, eyebrowColor = ROSE, children, big, className = "" }: { eyebrow: string; eyebrowColor?: string; children: React.ReactNode; big?: boolean; className?: string }) {
  return (
    <div className={`border border-[#2C2A28]/15 bg-[#F5F0EA]/85 p-7 shadow-sm backdrop-blur-sm ${big ? "max-w-2xl" : "max-w-md"} ${className}`}>
      <p className="tc-eyebrow text-[10px] uppercase tracking-[0.3em]" style={{ ...MONO, color: eyebrowColor }}>{eyebrow}</p>
      <p style={DISPLAY} className={`mt-3 font-light leading-snug text-[#2C2A28] ${big ? "text-4xl md:text-6xl" : "text-3xl md:text-4xl"}`}>{children}</p>
    </div>
  );
}

function Step({ align, children }: { align: "start" | "center" | "end"; children: React.ReactNode }) {
  const a = align === "start" ? "justify-start" : align === "end" ? "justify-end" : "justify-center";
  return <div className={`flex min-h-screen items-center ${a} px-6 md:px-20`}>{children}</div>;
}

export default function CityGrid() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      // SCENE A — parallax differential (filler bg pans slow, text clouds cycle fast)
      gsap.to(".sa-bg", { yPercent: -26, ease: "none", scrollTrigger: { trigger: ".scene-a", start: "top top", end: "bottom bottom", scrub: true } });
      // nested inner action — one cloud's eyebrow shifts hue as it cycles
      gsap.fromTo(".tc-morph .tc-eyebrow", { color: ROSE }, { color: SAGE, ease: "none", scrollTrigger: { trigger: ".tc-morph", start: "top 85%", end: "top 30%", scrub: true } });

      // TRANSITION — iris opens into scene B
      gsap.fromTo(".tab-iris", { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(150% at 50% 50%)", ease: "none", scrollTrigger: { trigger: ".trans-ab", start: "top top", end: "72% top", pin: ".tab-stage", scrub: true } });

      // SCENE B — pin-scrub; a surface-object rotates + scales (transform verbs)
      gsap.set(".sb-grid", { rotationX: 62, scale: 0.9 });
      const sb = gsap.timeline({ scrollTrigger: { trigger: ".scene-b", start: "top top", end: "bottom bottom", pin: ".sb-stage", scrub: true } });
      sb.to(".sb-grid", { rotationX: 24, scale: 1.15, ease: "none" }, 0).fromTo(".sb-floats", { y: 50, opacity: 0 }, { y: 0, opacity: 1, ease: "none" }, 0);

      // SCENE C — horizontal cycle (a cloud travels across, not down)
      gsap.fromTo(".sc-cloud", { xPercent: -130 }, { xPercent: 130, ease: "none", scrollTrigger: { trigger: ".scene-c", start: "top top", end: "bottom bottom", scrub: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#F5F0EA] text-[#2C2A28]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#2C2A28]/55 transition-colors hover:text-[#2C2A28]">← Back</Link>

      {/* intro */}
      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#C4897A]">City Grid — Test Run · Voice: Portal</p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">Houses on the grid.</h1>
        <p style={MONO} className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#2C2A28]/45">generics as placeholders · scroll ↓</p>
      </section>

      {/* SCENE A — parallax + filler + text clouds */}
      <section className="scene-a relative h-[440vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="sa-bg absolute inset-x-0 top-0 h-[175vh]" style={{ backgroundImage: "radial-gradient(circle, rgba(44,42,40,0.06) 1px, transparent 1px)", backgroundSize: "30px 30px" }}>
            <p style={{ ...MONO, position: "absolute", top: "8vh", left: "9%" }} className="text-[10px] uppercase tracking-[0.3em] text-[#2C2A28]/30">SIGMA · APERTURE</p>
            <p style={{ ...MONO, position: "absolute", top: "8vh", left: "70%" }} className="text-[10px] uppercase tracking-[0.3em] text-[#2C2A28]/30">FILLER · GEOMETRY</p>
            <div style={{ position: "absolute", top: "44vh", left: "50%", transform: "translateX(-50%)", opacity: 0.07 }}><Chevron color={NAVY} size={420} /></div>
            <div style={{ position: "absolute", top: "92vh", left: "10%", right: "10%", height: 1, background: "rgba(44,42,40,0.1)" }} />
            <p style={{ ...MONO, position: "absolute", top: "120vh", left: "16%" }} className="text-[10px] uppercase tracking-[0.3em] text-[#2C2A28]/30">LINE · PLANE · SURFACE</p>
          </div>
        </div>
        <div className="relative z-10 -mt-[100vh]">
          <Step align="center"><TextCloud eyebrow="// SIGMA · 01">Filler geometry drifts behind. Text clouds move ahead.</TextCloud></Step>
          <Step align="start"><TextCloud className="tc-morph" eyebrow="// NESTED ACTION">As this capsule cycles, its label shifts hue — an action inside an action.</TextCloud></Step>
          <Step align="end"><TextCloud eyebrow="// SIGMA · 03" eyebrowColor={SAGE}>The capsule is a boxy panel — coupled to the clinical voice.</TextCloud></Step>
        </div>
      </section>

      {/* TRANSITION — iris into scene B */}
      <section className="trans-ab relative h-[150vh]">
        <div className="tab-stage sticky top-0 h-screen overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center bg-[#F5F0EA]"><Chevron color={ROSE} size={150} /></div>
          <div className="tab-iris absolute inset-0" style={{ clipPath: "circle(0% at 50% 50%)" }}>
            <div className="absolute inset-0 flex items-center justify-center bg-[#EDEAE3]">
              <p style={DISPLAY} className="text-5xl font-light text-[#2C2A28] md:text-7xl">The chamber.</p>
            </div>
          </div>
          <div className="absolute bottom-7 left-0 right-0 z-20 flex justify-center">
            <p style={MONO} className="rounded-full border border-[#2C2A28]/20 bg-[#F5F0EA]/70 px-4 py-1.5 text-[10px] uppercase tracking-[0.35em] text-[#2C2A28]/60 backdrop-blur-sm">transition · iris</p>
          </div>
        </div>
      </section>

      {/* SCENE B — pin-scrub surface-object (rotate + scale) */}
      <section className="scene-b relative h-[300vh]">
        <div className="sb-stage sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-[#EDEAE3]" style={{ perspective: "1100px" }}>
          <div className="sb-grid absolute" style={{ width: "180vw", height: "150vh", left: "-40vw", top: "5vh", transformOrigin: "50% 50%", backgroundImage: "linear-gradient(rgba(44,42,40,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(44,42,40,0.16) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="sb-floats relative z-10 flex flex-col items-center gap-7">
            <Chevron color={SAGE} size={150} />
            <TextCloud eyebrow="// OBJECT ACTION · ROTATE + SCALE">A general object — a surface — actuates as you scrub.</TextCloud>
          </div>
        </div>
      </section>

      {/* SCENE C — horizontal cycle */}
      <section className="scene-c relative h-[220vh] overflow-hidden bg-[#F5F0EA]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden">
          <div className="sc-cloud flex-shrink-0 pl-[10vw]">
            <TextCloud big eyebrow="// CYCLE · HORIZONTAL">Across, not down — the same primitive, a different path.</TextCloud>
          </div>
        </div>
      </section>

      {/* outro */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center" style={{ background: "#E8D8C4" }}>
        <Chevron color={NAVY} size={120} />
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">One grid. Composed.</h2>
        <p style={MONO} className="max-w-lg text-[11px] uppercase leading-relaxed tracking-[0.25em] text-[#2C2A28]/45">grammar constant · vocabulary + punctuation generic · voice swappable</p>
      </section>
    </div>
  );
}
