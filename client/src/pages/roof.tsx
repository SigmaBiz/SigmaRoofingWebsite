import { useEffect, useRef } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// GRID engine demo: drone→ground PARALLAX DESCENT over a layered scene (generic engine), with a
// PROCEDURAL pixel-art placeholder (roof under construction, PPE workers) standing in for real
// AI-generated NES art (the external "art slot"). Voice: Portal-Sigma light.

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;

const W = 256;
const H = 192;

// limited "NES" palette, brand-tinted
const C = {
  sky1: "#F1E9DA",
  sky2: "#E8D8C4",
  cloud: "#FBF6EE",
  yard: "#9DAE8C",
  yardDk: "#879877",
  wood: "#C9A877",
  woodDk: "#A9844F",
  shingle: "#6B7370",
  shingleDk: "#535A57",
  body: "#E3DAC9",
  bodyDk: "#C8BCA4",
  hat: "#E3A52B",
  vest: "#E0743B",
  skin: "#D9A57E",
  brick: "#B0705A",
  truck: "#2C2A28",
  trunk: "#8A6A45",
  leaf: "#7D9E82",
} as const;

function draw(ctx: CanvasRenderingContext2D) {
  const P = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  // sky
  for (let y = 0; y < 110; y++) P(0, y, W, 1, y < 55 ? C.sky1 : C.sky2);
  // clouds
  const cloud = (x: number, y: number) => {
    P(x, y, 22, 5, C.cloud);
    P(x + 4, y - 3, 14, 4, C.cloud);
    P(x - 3, y + 4, 28, 4, C.cloud);
  };
  cloud(30, 26);
  cloud(150, 16);
  cloud(200, 40);
  // ground / yard
  P(0, 108, W, H - 108, C.yard);
  for (let i = 0; i < 40; i++) P((i * 37) % W, 112 + ((i * 53) % (H - 116)), 2, 2, C.yardDk);
  // tree (right)
  P(228, 96, 4, 22, C.trunk);
  P(218, 78, 24, 22, C.leaf);
  P(222, 72, 16, 10, C.leaf);
  // truck (bottom-left)
  P(14, 150, 46, 18, C.truck);
  P(50, 142, 18, 14, C.truck);
  P(54, 145, 9, 7, C.sky2);
  P(20, 168, 9, 6, C.shingleDk);
  P(46, 168, 9, 6, C.shingleDk);
  // ---- the roof (oblique trapezoid), being shingled ----
  const top = 58,
    bot = 138,
    cx = 132;
  for (let y = top; y < bot; y++) {
    const t = (y - top) / (bot - top);
    const hw = Math.round(34 + t * 40);
    const installed = y > top + (bot - top) * 0.45; // lower portion done
    const base = installed ? C.shingle : C.wood;
    P(cx - hw, y, hw * 2, 1, base);
    if (installed && (y - top) % 5 === 0) P(cx - hw, y, hw * 2, 1, C.shingleDk); // shingle butt lines
    if (!installed && (y - top) % 7 === 0) P(cx - hw, y, hw * 2, 1, C.woodDk); // deck planks
  }
  // roof edge highlight
  for (let y = top; y < bot; y++) {
    const t = (y - top) / (bot - top);
    const hw = Math.round(34 + t * 40);
    P(cx - hw, y, 2, 1, C.woodDk);
    P(cx + hw - 2, y, 2, 1, C.woodDk);
  }
  // chimney
  P(cx + 30, 70, 12, 16, C.brick);
  P(cx + 30, 70, 12, 3, C.shingleDk);
  // ladder on left edge
  for (let y = 96; y < 150; y += 4) P(96, y, 14, 2, C.woodDk);
  P(96, 96, 2, 54, C.wood);
  P(108, 96, 2, 54, C.wood);
  // shingle bundles (materials)
  P(150, 120, 14, 6, C.shingleDk);
  P(152, 116, 14, 6, C.shingle);
  // ---- PPE workers ----
  const worker = (x: number, y: number) => {
    P(x, y + 4, 8, 6, C.vest); // vest/torso
    P(x + 2, y + 2, 4, 3, C.skin); // head/neck
    P(x, y - 1, 8, 4, C.hat); // hard hat
    P(x, y, 8, 1, C.bodyDk); // hat brim
    P(x + 1, y + 10, 2, 3, C.bodyDk); // legs
    P(x + 5, y + 10, 2, 3, C.bodyDk);
    P(x - 2, y + 5, 2, 2, C.skin); // arm reaching
  };
  worker(112, 112);
  worker(138, 104);
  worker(122, 126);
}

export default function Roof() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (cv) {
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        draw(ctx);
      }
    }
    const ctx2 = gsap.context(() => {
      // drone (wide, high) → descent (close on the roof + workers)
      gsap.fromTo(
        ".scene-cam",
        { scale: 0.62, yPercent: -6 },
        { scale: 1.65, yPercent: 10, ease: "none", scrollTrigger: { trigger: ".descent", start: "top top", end: "bottom bottom", pin: ".descent-stage", scrub: true } },
      );
      gsap.fromTo(".cap-1", { opacity: 0, y: 20 }, { opacity: 1, y: 0, scrollTrigger: { trigger: ".descent", start: "5% top", end: "18% top", scrub: true } });
      gsap.fromTo(".cap-1", { opacity: 1 }, { opacity: 0, scrollTrigger: { trigger: ".descent", start: "28% top", end: "38% top", scrub: true } });
      gsap.fromTo(".cap-2", { opacity: 0, y: 20 }, { opacity: 1, y: 0, scrollTrigger: { trigger: ".descent", start: "55% top", end: "68% top", scrub: true } });
    }, root);
    return () => ctx2.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#F5F0EA] text-[#2C2A28]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#2C2A28]/55 transition-colors hover:text-[#2C2A28]">← Back</Link>

      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#C4897A]">Engine Demo — Drone Descent · placeholder pixel-art</p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">From above.</h1>
        <p style={MONO} className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#2C2A28]/45">scroll to descend ↓</p>
      </section>

      <section className="descent relative h-[420vh]">
        <div className="descent-stage sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-[#E8D8C4]">
          <canvas
            ref={canvas}
            className="scene-cam"
            style={{ width: "min(150vw, 1700px)", height: "auto", imageRendering: "pixelated", transformOrigin: "52% 64%" }}
          />
          <div className="cap-1 pointer-events-none absolute left-[8%] top-[18%]">
            <div className="border border-[#2C2A28]/15 bg-[#F5F0EA]/85 p-6 shadow-sm backdrop-blur-sm">
              <p style={MONO} className="text-[10px] uppercase tracking-[0.3em] text-[#C4897A]">// SIGMA · SITE 01</p>
              <p style={DISPLAY} className="mt-2 text-3xl font-light md:text-4xl">A bird's-eye on the work.</p>
            </div>
          </div>
          <div className="cap-2 pointer-events-none absolute bottom-[14%] right-[8%]">
            <div className="border border-[#2C2A28]/15 bg-[#F5F0EA]/85 p-6 shadow-sm backdrop-blur-sm">
              <p style={MONO} className="text-[10px] uppercase tracking-[0.3em] text-[#7D9E82]">// CREW · PPE ON</p>
              <p style={DISPLAY} className="mt-2 text-3xl font-light md:text-4xl">Hard hats. Vests. Shingles going down.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center" style={{ background: "#F5F0EA" }}>
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">Engine ours. Art, plug-in.</h2>
        <p style={MONO} className="max-w-lg text-[11px] uppercase leading-relaxed tracking-[0.25em] text-[#2C2A28]/45">parallax descent is generic · swap this placeholder for real generated NES pixel-art</p>
      </section>
    </div>
  );
}
