import { useEffect, useRef } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// rrMVP: the "vital action" (pin-and-scrub) in the "vital style" (editorial/Swiss restraint).
// A pinned stage; scroll scrubs a timeline of abstract shapes "actuating". Venus Blush.

const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;

const BARS = [
  { x: 250, h: 96 },
  { x: 317, h: 150 },
  { x: 384, h: 72 },
  { x: 451, h: 128 },
  { x: 518, h: 104 },
];

export default function Scrub() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(".ring", { strokeDashoffset: 0 });
        gsap.set(".accent", { transformOrigin: "50% 50%" });
        gsap.set(".progress", { scaleX: 1, transformOrigin: "left center" });
        return;
      }
      gsap.set(".sq", { transformOrigin: "50% 50%" });
      gsap.set(".accent", { transformOrigin: "50% 50%" });
      gsap.set(".bar", { transformOrigin: "50% 100%" });
      gsap.set(".progress", { scaleX: 0, transformOrigin: "left center" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".scrub-trigger",
          start: "top top",
          end: "+=3200",
          pin: ".scrub-stage",
          scrub: 1,
          onUpdate: (self) => gsap.set(".progress", { scaleX: self.progress }),
        },
      });

      tl.from(".bar", { scaleY: 0, stagger: 0.12, duration: 1.0, ease: "power3.out" }, 0)
        .from(".sq", { scale: 0, rotate: -90, duration: 1.0, ease: "power3.out" }, 0.6)
        .fromTo(".ring", { strokeDashoffset: 754 }, { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut" }, 1.2)
        .to(".sq", { rotate: 45, duration: 1.0, ease: "power2.inOut" }, 1.7)
        .from(".accent", { scale: 0, duration: 0.5, ease: "power3.out" }, 2.6)
        .from(".headline", { yPercent: 45, opacity: 0, duration: 1.0, ease: "power3.out" }, 3.0);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#F5F0EA] text-[#2C2A28]">
      <Link
        href="/"
        className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#2C2A28]/55 transition-colors hover:text-[#2C2A28]"
      >
        ← Back
      </Link>

      {/* intro */}
      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#2C2A28]/45">
          Pin · Scrub — Editorial Restraint
        </p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">
          Pin-and-scrub.
        </h1>
        <p className="mt-8 text-sm text-[#2C2A28]/50">scroll to actuate ↓</p>
      </section>

      {/* pinned scrub stage */}
      <section className="scrub-trigger">
        <div className="scrub-stage relative flex h-screen w-full items-center justify-center overflow-hidden">
          <svg viewBox="0 0 800 560" className="h-auto w-full max-w-3xl px-6">
            <line x1="220" y1="440" x2="580" y2="440" stroke="#2C2A28" strokeWidth="1.5" />
            {BARS.map((b) => (
              <rect key={b.x} className="bar" x={b.x} y={440 - b.h} width="26" height={b.h} fill="#2C2A28" />
            ))}
            <circle
              className="ring"
              cx="400"
              cy="210"
              r="120"
              fill="none"
              stroke="#7D9E82"
              strokeWidth="1.5"
              strokeDasharray="754"
            />
            <rect className="sq" x="340" y="150" width="120" height="120" fill="none" stroke="#2C2A28" strokeWidth="1.5" />
            <circle className="accent" cx="400" cy="210" r="9" fill="#C4897A" />
          </svg>

          <div className="pointer-events-none absolute inset-x-0 bottom-[14%] flex justify-center px-6">
            <h2 style={DISPLAY} className="headline text-balance text-center text-4xl font-light md:text-5xl">
              Precision, in motion.
            </h2>
          </div>

          <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#2C2A28]/10">
            <div className="progress h-full w-full bg-[#C4897A]" />
          </div>
        </div>
      </section>

      {/* outro */}
      <section className="flex h-screen flex-col items-center justify-center gap-6 text-center">
        <h2 style={DISPLAY} className="text-5xl font-light md:text-6xl">
          Released.
        </h2>
        <p style={MONO} className="text-[11px] uppercase tracking-[0.3em] text-[#2C2A28]/45">
          the pin lets go
        </p>
      </section>
    </div>
  );
}
