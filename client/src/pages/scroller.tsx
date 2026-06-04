import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// rrMVP: scrollytelling infrastructure (recreated from the pudding.cool/scifi mechanic).
// A sticky graphic that TRANSFORMS in place through states, while foreground text blocks
// scroll over it (the parallax "lag"). Each text step drives the next graphic state.
// Dark Venus Blush; placeholder content to refine/rebrand later.

const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;

const ROSE = "#C4897A";
const SAGE = "#7D9E82";

interface State {
  label: string;
  number: string;
  bars: number[];
  accent: number; // which bar is sage
}
const STATES: State[] = [
  { label: "ERA · 01", number: "12%", bars: [12, 18, 9, 22, 14, 28, 19, 24], accent: 5 },
  { label: "ERA · 02", number: "31%", bars: [20, 28, 18, 34, 30, 40, 33, 38], accent: 5 },
  { label: "THRESHOLD", number: "57%", bars: [40, 48, 38, 55, 52, 60, 58, 63], accent: 6 },
  { label: "INFLECTION", number: "78%", bars: [60, 68, 58, 75, 72, 84, 80, 86], accent: 5 },
  { label: "SATURATION", number: "94%", bars: [82, 88, 80, 92, 90, 96, 93, 95], accent: 6 },
  { label: "RESOLVE", number: "—", bars: [50, 50, 50, 50, 50, 50, 50, 50], accent: 3 },
];

const STEPS: { pre: string; hi: string; post: string }[] = [
  { pre: "Every system begins as a single, ", hi: "quiet signal", post: "." },
  { pre: "Left alone, it learns to ", hi: "repeat itself", post: " across every era." },
  { pre: "Then it crosses a ", hi: "threshold", post: " you feel before you can name it." },
  { pre: "The ", hi: "inflection", post: " is sudden, even when the cause was slow." },
  { pre: "Until it ", hi: "saturates", post: " everything it touches." },
  { pre: "And what is left is ", hi: "the shape it chose to become", post: "." },
];

function Graphic({ active }: { active: number }) {
  const bars = useRef<(HTMLDivElement | null)[]>([]);
  const s = STATES[active];
  useEffect(() => {
    s.bars.forEach((v, i) => {
      const el = bars.current[i];
      if (el) gsap.to(el, { height: `${v}%`, backgroundColor: i === s.accent ? SAGE : ROSE, duration: 0.85, ease: "power3.inOut" });
    });
  }, [active, s.accent, s.bars]);

  return (
    <div className="flex w-full max-w-3xl flex-col items-center px-6">
      <p style={MONO} className="mb-6 text-xs uppercase tracking-[0.4em] text-[#F5F0EA]/55">
        {s.label}
      </p>
      <div className="flex h-[46vh] w-full items-end justify-center gap-3">
        {s.bars.map((_, i) => (
          <div
            key={i}
            ref={(el) => (bars.current[i] = el)}
            className="w-8 rounded-t-sm md:w-12"
            style={{ height: "8%", background: ROSE }}
          />
        ))}
      </div>
      <p style={MONO} className="mt-6 text-5xl font-medium tabular-nums text-[#C4897A] md:text-7xl">
        {s.number}
      </p>
    </div>
  );
}

export default function Scroller() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".step").forEach((el, i) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 55%",
          onEnter: () => setActive(i),
          onEnterBack: () => setActive(i),
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#211F1D] text-[#F5F0EA]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#F5F0EA]/55 transition-colors hover:text-[#F5F0EA]">
        ← Back
      </Link>

      {/* light intro */}
      <section className="flex h-screen flex-col items-center justify-center bg-[#F5F0EA] px-6 text-center text-[#2C2A28]">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#2C2A28]/45">
          Scrollytelling — Sticky Transform + Parallax Text
        </p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">
          The scroller.
        </h1>
        <p className="mt-8 text-sm text-[#2C2A28]/50">scroll ↓</p>
      </section>

      {/* scrollytelling: sticky graphic + scrolling text steps */}
      <section className="relative">
        <div className="sticky top-0 flex h-screen items-center justify-center">
          <Graphic active={active} />
        </div>
        <div className="relative z-10 -mt-[100vh]">
          {STEPS.map((s, i) => (
            <div key={i} className="step flex min-h-screen items-center justify-center px-6">
              <div className="max-w-md rounded-sm border border-[#F5F0EA]/10 bg-[#15120F]/80 p-8 shadow-2xl backdrop-blur-sm md:max-w-lg">
                <p style={DISPLAY} className="text-3xl font-light leading-snug md:text-4xl">
                  {s.pre}
                  <span className="rounded-[2px] bg-[#C4897A] px-1.5 text-[#2C2A28]">{s.hi}</span>
                  {s.post}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* narrative outro */}
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">
          That's the mechanism.
        </h2>
        <p style={MONO} className="max-w-md text-[11px] uppercase leading-relaxed tracking-[0.25em] text-[#F5F0EA]/45">
          sticky graphic transforms · text scrolls over it · each step drives the next state
        </p>
      </section>
    </div>
  );
}
