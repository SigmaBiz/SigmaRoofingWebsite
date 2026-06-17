import { Suspense, useState, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Ruler, Compass, Layers, Loader2, ShieldCheck, ArrowRight, Star, RotateCcw, Lock, HelpCircle, Phone, X, CalendarClock } from "lucide-react";
import MVP3ContactForm from "@/components/mvp3-contact-form";
import { RoofHouse, HOUSE } from "@/components/RoofHouse";
import { ESTIMATE_FAQ, ESTIMATE_SEO, BIZ } from "@shared/estimate-seo";

/**
 * /estimate v2 — the "storyboard" money page (modeled on /inspect + WORKFLOW_3 persuasion).
 * P1 = THE ESTIMATOR: the Crestridge 3D roof rotates on scrub in the background while Pudding-style text clouds carry the
 * persuasion arc (CONTRADICTION "2,200 sq ft is your floor, not your roof" → THREAT "a guessed number = someone else picks
 * it" → TAKEAWAY "we measure your real roof"), and a framed estimator (address → results swap in-frame) is the foreground
 * focal point. Below: live reviews + cost FAQ (FAQPage schema) + the booking form. SEO/schema injected server-side
 * (server/seo.ts), independent of this heavier React page. Architectural shingle only. (P2 color visualizer = next.)
 */

gsap.registerPlugin(ScrollTrigger);

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// /housetest's orbit center [4,-22] = the visual center of the dressed house — spin the roof around it + frame the camera here.
const CX = 4, CZ = -22;

// Invisible Cloudflare Turnstile (the bot wall). Dev falls back to CF's always-pass TEST sitekey until Antonio's real
// key lands in .env as VITE_TURNSTILE_SITE_KEY (the server verifies it with TURNSTILE_SECRET_KEY before any Google call).
const TURNSTILE_SITE_KEY = (import.meta as any).env?.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

// Per-browser ID for the soft 2/day per-user limit (localStorage). Not bulletproof — incognito / clearing storage
// resets it — so it only deters casual over-use; the global 150/day cap + Turnstile are the hard cost bounds.
function getClientId(): string {
  try {
    let id = localStorage.getItem("sr_cid");
    if (!id) { id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); localStorage.setItem("sr_cid", id); }
    return id;
  } catch { return ""; }
}

// ---- persuasion text clouds (Antonio's copy), scrub-driven like /inspect; words highlight one-by-one (SweepText) as each rises ----
const CLOUDS = [
  { r: [0.0, 0.2], tag: "Instant & free", body: "We crunch the numbers for you. Enter your address and get an estimate at once. Fast, free, and no obligation!" },
  { r: [0.2, 0.42], tag: "Living area ≠ roof", body: "The square footage of the living area has no bearing on the roof, since the roof measurements are taken from the sloped surfaces on top of your house." },
  { r: [0.42, 0.62], tag: "Measured from orbit", body: "The estimate uses satellite solar imagery to provide you with a good range of the roof cost for your home." },
  { r: [0.62, 0.82], tag: "Want it exact?", body: "Exact estimates are available upon request, as they require third-party technology from independent vendors and/or physical on-site verification." },
  { r: [0.82, 1.0], tag: "A floor, not a ceiling", body: "The estimate range is closer to a lower-bound (floor) estimate, due to the many variables which affect the cost of roof repairs such as existing roof layers, redecking needs, steepness, etc. These full-detail estimates are available upon request." },
] as const;

// SweepText — a "reading cursor": highlights ONE word at a time, left→right, synced to the cloud's rise (t: 0→1) so the
// gold highlight sweeps through the sentence as the cloud scrubs upward. The sweep is mapped to the fully-visible window.
function SweepText({ text, t }: { text: string; t: number }) {
  const toks = text.split(/(\s+)/); // keep whitespace tokens so spacing survives
  const wordTok = toks.map((w, i) => (/\S/.test(w) ? i : -1)).filter((i) => i >= 0);
  const s = clamp01((t - 0.1) / 0.8); // run the sweep across the cloud's fully-visible portion
  const active = wordTok[Math.min(wordTok.length - 1, Math.floor(s * wordTok.length))];
  return (
    <>
      {toks.map((w, i) =>
        i === active ? (
          <mark key={i} style={{ background: "#dca94e", color: "#241a0e", padding: "0 4px", borderRadius: 3 }}>{w}</mark>
        ) : (
          <span key={i}>{w}</span>
        ),
      )}
    </>
  );
}

const hasWebGL = () => {
  if (typeof window === "undefined") return false;
  try { return !!document.createElement("canvas").getContext("webgl"); } catch { return false; }
};

// ---- 3D: the roof spinning on scroll (P1). rotation.y = eased scroll progress × 360°, pivoted at the footprint center ----
type V3 = [number, number, number];
// ---- CAMERA ACTION — ONE continuous spiral (NO per-phase halts), house STATIC ----
// high top-front helicopter → descends → 360° CLOSE orbit → spirals out → 360° ELEVATION orbit → settles on the front.
const FRONT = (-62 * Math.PI) / 180;     // anchor heading: top-front of the garage + main entrance (south, slightly angled)
const TURNS = 2;                          // two full cycles (close, then elevation)
const R_HELI = 76, H_HELI = 92;          // helicopter: high + set back (~48° top-front) → see the garage/entrance face + roof, fills >⅓, reads "high up"
const R1 = 50, H1 = 24;                  // CLOSE orbit (intimate roof + cap detail)
const R2 = 78, H2 = 14;                  // ELEVATION orbit (a whole SIDE fits the frame)
const camAt = (R: number, H: number, th: number): V3 => [CX + R * Math.cos(th), H, CZ + R * Math.sin(th)];
const HELI_POS = camAt(R_HELI, H_HELI, FRONT);
const smooth = (t: number) => { t = clamp01(t); return t * t * (3 - 2 * t); };
// constant-velocity middle with a smooth ramp-in + settle-out → motion NEVER halts mid-journey (only eases at the very start/end)
function flatEase(p: number, A = 0.14, B = 0.12) {
  const area = 1 - (A + B) / 2;
  if (p < A) return (p * p) / (2 * A) / area;
  if (p < 1 - B) return (A / 2 + (p - A)) / area;
  return (A / 2 + (1 - B - A) + B / 2 - ((1 - p) * (1 - p)) / (2 * B)) / area;
}
const track = (p: number, stops: [number, number][]): number => {
  for (let i = 0; i < stops.length - 1; i++)
    if (p <= stops[i + 1][0]) return lerp(stops[i][1], stops[i + 1][1], smooth((p - stops[i][0]) / (stops[i + 1][0] - stops[i][0])));
  return stops[stops.length - 1][1];
};
function CameraRig({ progress }: { progress: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  useFrame((state) => {
    const p = clamp01(progress.current);
    const e = state.clock.elapsedTime;
    // (#2) IDLE DRIFT — a gentle hover-sway while parked at the top; fades out the instant you scroll (sinusoidal ⇒ returns to center, no jump)
    const idle = 1 - smooth(p / 0.04);
    const swayTh = Math.sin(e * 0.32) * 0.05 * idle;          // ±2.9° hover yaw
    const swayH = Math.sin(e * 0.46 + 1.3) * 1.8 * idle;      // gentle vertical bob
    const th = FRONT + flatEase(p) * TURNS * Math.PI * 2 + swayTh;                    // ONE continuous sweep (+ idle sway)
    const R = track(p, [[0, R_HELI], [0.2, R1], [0.46, R1], [0.6, R2], [1, R2]]);     // heli → close → (spiral out) → elevation
    const H = track(p, [[0, H_HELI], [0.2, H1], [0.46, H1], [0.6, H2], [1, H2]]) + swayH;
    const ly = track(p, [[0, 8], [0.2, 7], [0.6, 9], [1, 9]]);                        // look target height: roof → mid-side
    const pos = camAt(R, H, th);
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(CX, ly, CZ);
    // (#3) FOV PUNCH on the descent — the lens widens then settles, a "whoosh" of speed as it drops in
    const fov = 40 + 7 * Math.sin(Math.PI * clamp01(p / 0.2));
    const pc = camera as THREE.PerspectiveCamera;
    if (Math.abs(pc.fov - fov) > 0.02) { pc.fov = fov; pc.updateProjectionMatrix(); }
  });
  return null;
}
// real CC0 ambientCG grass lawn (same source as the veneer) — PBR color+normal+rough, tiled, receives the sun's shadows.
function Ground() {
  const [col, nrm, rgh] = useTexture(["/grass-color.jpg", "/grass-normal.jpg", "/grass-rough.jpg"]);
  useMemo(() => {
    for (const t of [col, nrm, rgh]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(72, 72); t.anisotropy = 8; t.needsUpdate = true; }
    col.colorSpace = THREE.SRGBColorSpace;
  }, [col, nrm, rgh]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CX, -0.02, CZ]} receiveShadow>
      <planeGeometry args={[600, 600]} />
      <meshStandardMaterial map={col} normalMap={nrm} roughnessMap={rgh} roughness={1} metalness={0} />
    </mesh>
  );
}
// LIT BED — the dressed-house look back on: HDR midday sky + a warm sun (real shadows) over the grass. Re-checking the caps here.
function RoofScene({ progress }: { progress: React.MutableRefObject<number> }) {
  return (
    <Canvas camera={{ position: HELI_POS, fov: 40, near: 0.5, far: 3000 }} dpr={[1, 1.75]} gl={{ toneMapping: THREE.NoToneMapping }}>
      {/* FLAT, uniform lighting ONLY — no directional + no image-based light, so the FOLDED hip/ridge caps can't catch a
          highlight the flat field misses ⇒ caps match the field exactly. environmentIntensity={0} keeps the sky HDR as a
          backdrop only (no IBL). NoToneMapping = no color grading (there never was any). */}
      <ambientLight intensity={Math.PI} />
      <Suspense fallback={null}>
        <Environment files="/sky-midday.hdr" background environmentIntensity={0} />
        <RoofHouse />
        <Ground />
      </Suspense>
      <CameraRig progress={progress} />
    </Canvas>
  );
}

// ---------------- estimator data ----------------
type CardData = { address: string; squares: number; pitch: string; facets: number; perimeter: number; low: number; high: number; confidenceTier: string; image: string };
const usd = (n: number) => "$" + Math.round(n).toLocaleString();
type Status = "idle" | "loading" | "done" | "inspection" | "error" | "capacity" | "busy" | "user_limit";

// deterministic, no-PII quote code from the address — doubles as the 5%-off token + the lead-lookup key (same address ⇒ same code)
function quoteCode(address: string): string {
  let h = 5381 >>> 0;
  for (let i = 0; i < address.length; i++) h = (((h << 5) + h) + address.charCodeAt(i)) >>> 0;
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) { s += A[h % 32]; h = (Math.floor(h / 32) + (i + 1) * 40503) >>> 0; }
  return "SR-" + s;
}

export default function Estimate() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [prog, setProg] = useState(0);
  const [webgl] = useState(hasWebGL);
  const [openFaq, setOpenFaq] = useState<number | null>(null); // FAQ accordion: which question is expanded (single-open)

  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<{ formatted_address: string; place_id: string }[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [card, setCard] = useState<CardData | null>(null);
  const [inspectionMsg, setInspectionMsg] = useState("");
  const [ctaModal, setCtaModal] = useState<null | "lock-in" | "question" | "capacity">(null);
  const [schedulePrefill, setSchedulePrefill] = useState<{ address?: string; serviceType?: string } | undefined>(undefined);
  const sugTimer = useRef<NodeJS.Timeout>();
  const turnstileRef = useRef<HTMLDivElement>(null);
  const tsWidgetId = useRef<string | null>(null);
  const tsToken = useRef("");
  const qaHover = useRef(false); // true while the cursor is over the Q&A — suppresses thumbnail pops so reading isn't disrupted
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches); // mobile P2 = ShuffleStack; desktop = floating gallery
  const [kbdPx, setKbdPx] = useState(0); // mobile P1: the on-screen keyboard's height (px, via visualViewport) — used to lift the bottom-anchored estimator form above it

  useEffect(() => {
    const prev = document.title;
    document.title = ESTIMATE_SEO.title;
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setIsMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // mobile P1: the estimator form is anchored to the viewport bottom (GSAP-pinned sticky stage), so the on-screen keyboard
  // covers it and the browser can't scroll a pinned element into view. Track the keyboard's REAL height via visualViewport
  // and lift the form by exactly that — keyboard-aware (works for a direct tap OR the wheel's cursor, any device). 0 = closed.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => { const kb = Math.max(0, window.innerHeight - vv.height); setKbdPx(kb > 150 ? Math.round(kb) : 0); };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);

  // P1 pin-scrub (same pattern as /inspect): drive a progress ref (roof rotation) + a quantized state (the DOM clouds).
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ".p1", start: "top top", end: "bottom bottom", pin: ".p1-stage", scrub: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          const q = Math.round(self.progress * 200) / 200;
          setProg((v) => (v === q ? v : q));
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // Invisible Cloudflare Turnstile — renders hidden; we execute() it on submit to mint a fresh token. The widget is
  // just the trigger; the SERVER verify (in /api/estimate) is the actual bot wall.
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined;
    const render = () => {
      const ts = (window as any).turnstile;
      if (!ts || !turnstileRef.current || tsWidgetId.current !== null) return;
      try {
        tsWidgetId.current = ts.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          size: "invisible",
          callback: (t: string) => { tsToken.current = t; },
          "error-callback": () => { tsToken.current = ""; },
          "expired-callback": () => { tsToken.current = ""; },
        });
        if (iv) clearInterval(iv);
      } catch { /* already rendered */ }
    };
    if (!document.getElementById("cf-turnstile-js")) {
      const s = document.createElement("script");
      s.id = "cf-turnstile-js";
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true; s.defer = true; s.onload = render;
      document.head.appendChild(s);
    }
    iv = setInterval(render, 300);
    return () => { if (iv) clearInterval(iv); };
  }, []);

  // Mint a fresh Turnstile token for a submit (invisible -> execute on demand). "" if the script is blocked: the
  // server skips when unconfigured (dev) or rejects when configured (prod) — the deliberate bot-protection tradeoff.
  async function getTurnstileToken(): Promise<string> {
    const ts = (window as any).turnstile;
    if (!ts || tsWidgetId.current === null) return "";
    if (tsToken.current) return tsToken.current;
    try { ts.execute(tsWidgetId.current); } catch { /* noop */ }
    for (let i = 0; i < 25 && !tsToken.current; i++) await new Promise((r) => setTimeout(r, 120));
    return tsToken.current;
  }

  function searchAddresses(value: string) {
    if (!value || value.length < 1) { setShowSug(false); setSuggestions([]); return; }
    const fallback = ["Oklahoma City, OK, USA", "Edmond, OK, USA", "Norman, OK, USA", "Moore, OK, USA", "Yukon, OK, USA", "Mustang, OK, USA"]
      .map((a, i) => ({ formatted_address: a, place_id: "fb_" + i }));
    const immediate = value.length < 3 ? fallback : fallback.filter((c) => c.formatted_address.toLowerCase().includes(value.toLowerCase()));
    setSuggestions(immediate); setShowSug(immediate.length > 0);
    if (sugTimer.current) clearTimeout(sugTimer.current);
    if (value.length < 4) return; // cost guard: don't spend a Google autocomplete call on 1–3 chars (local fallbacks cover those)
    sugTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/address-suggestions?q=${encodeURIComponent(value)}`);
        const d = await r.json();
        if (d.success && d.suggestions?.length > 0) { setSuggestions(d.suggestions); setShowSug(true); }
      } catch { /* keep fallbacks */ }
    }, 350); // debounce: one call per typing-pause, not one per keystroke (≈3–4× fewer billed autocomplete requests)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (address.trim().length < 5) return;
    setShowSug(false);
    setStatus("loading");
    try {
      const turnstileToken = await getTurnstileToken();
      const r = await fetch("/api/estimate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address, turnstileToken, clientId: getClientId() }) });
      const d = await r.json();
      try { (window as any).turnstile?.reset(tsWidgetId.current); tsToken.current = ""; } catch { /* noop */ }
      if (r.status === 429 || d.rate_limited) { setStatus("busy"); return; } // per-minute quota tripped (transient) — distinct from the daily cap
      if (!d.success) { setStatus("error"); return; }
      if (d.user_limit) {
        setCard({ address: d.address || address, squares: 0, pitch: "", facets: 0, perimeter: 0, low: 0, high: 0, confidenceTier: "", image: "" });
        setStatus("user_limit"); return;
      }
      if (d.over_capacity) {
        setCard({ address: d.address || address, squares: 0, pitch: "", facets: 0, perimeter: 0, low: 0, high: 0, confidenceTier: "", image: "" });
        setStatus("capacity"); return;
      }
      if (!d.measured) { setInspectionMsg(d.message || "We couldn't auto-measure this roof — let's get eyes on it."); setStatus("inspection"); return; }
      setCard({
        address: d.address || address,
        squares: d.totals.squares,
        pitch: d.totals.predominant_pitch,
        facets: d.totals.facet_count,
        perimeter: d.pricing?.assumptions?.perimeter_ft ?? 0,
        low: d.pricing?.low ?? 0,
        high: d.pricing?.high ?? 0,
        confidenceTier: d.confidence?.tier || "—",
        image: `/api/roof-satellite?address=${encodeURIComponent(address)}&outline=1`,
      });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const reset = () => { setStatus("idle"); setCard(null); };
  const goToForm = () => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  const showResult = status === "done" || status === "inspection" || status === "error" || status === "capacity" || status === "busy" || status === "user_limit";
  const code = card ? quoteCode(card.address) : "";
  // "schedule" path of Lock-in → prefill the home form's address + LOCK its service to the discount, then scroll to it.
  const goSchedule = () => {
    setSchedulePrefill({ address: card?.address || "", serviceType: "lock-in-discount" });
    setCtaModal(null);
    setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  return (
    <div ref={root} className="bg-[#0d1626] text-white">
      {/* ===================== PARTITION 1 — THE ESTIMATOR ===================== */}
      <section className="p1 relative h-[500vh]">
        <div className="p1-stage sticky top-0 h-screen overflow-hidden bg-[#0d1626]">
          <SiteHeader />
          {/* invisible Turnstile bot-check — renders nothing visible; executed on submit */}
          <div ref={turnstileRef} className="fixed left-[-9999px] top-[-9999px]" aria-hidden />
          {/* roof hook (background) */}
          {webgl ? (
            <div className="absolute inset-0"><RoofScene progress={progress} /></div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-[#16243a] to-[#0d1626]" />
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[44%] bg-gradient-to-b from-[#0d1626]/90 via-[#0d1626]/35 to-transparent" />

          {/* pinned headline (anchor) */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 px-6 pt-20 text-center">
            <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#dca94e]">SIGMA ROOFING LLC · OKC metro</p>
            <h1 style={DISPLAY} className="mx-auto mt-4 max-w-4xl text-balance text-4xl font-light leading-[1.05] tracking-tight md:text-6xl">
              How much does it cost to replace a roof on a 2,200 sq ft house?
            </h1>
          </div>

          {/* scrub text clouds — rise + fade through the upper-mid stage (don't block the frame) */}
          <div className="pointer-events-none absolute inset-x-0 top-[34%] flex justify-center">
            {CLOUDS.map((c, i) => {
              if (prog < c.r[0] - 0.002 || prog > c.r[1] + 0.002) return null;
              const t = clamp01((prog - c.r[0]) / (c.r[1] - c.r[0]));
              const ty = lerp(10, -10, t);
              const op = clamp01(Math.min(t / 0.14, (1 - t) / 0.14, 1));
              return (
                <div key={i} className="absolute w-[min(37rem,90vw)] rounded-xl border border-white/25 bg-white/8 px-7 py-5 text-white shadow-[0_10px_36px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/15 backdrop-blur-lg"
                  style={{ opacity: op, transform: `translateY(${ty}vh)`, textShadow: "0 1px 10px rgba(0,0,0,0.6)" }}>
                  <p style={MONO} className="text-[10px] uppercase tracking-[0.28em] text-[#e6b766]">{c.tag}</p>
                  <p style={DISPLAY} className="mt-1.5 text-[19px] font-light leading-snug"><SweepText text={c.body} t={t} /></p>
                </div>
              );
            })}
          </div>

          {/* the estimator frame (foreground focal point) — entry → results swap in-place. On mobile it's pinned to the
              viewport bottom (P1 is a sticky stage), so when the address field is focused we lift it above the keyboard. */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-8 transition-transform duration-300 ease-out"
            style={{ transform: (isMobile && kbdPx) ? `translateY(-${kbdPx + 12}px)` : undefined }}>
            <div className="w-[min(40rem,94vw)] rounded-2xl border border-white/20 bg-[#0d1626]/60 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/12 backdrop-blur-xl">
              {!showResult ? (
                <form onSubmit={onSubmit} className="p-5 md:p-6">
                  <div className="text-sm font-semibold text-white/90">Enter address — Estimate generates immediately in coverage areas in Metro OKC</div>
                  <div className="mt-3 flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <Input value={address} onChange={(e) => { setAddress(e.target.value); searchAddresses(e.target.value); }}
                        onPointerDown={(e) => { if (isMobile) { e.preventDefault(); (e.currentTarget as HTMLInputElement).focus({ preventScroll: true }); } }}
                        onFocus={() => { if (address) searchAddresses(address); }} placeholder="123 Main St, Oklahoma City, OK"
                        className="h-12 border-white/25 bg-white/10 pl-10 text-base text-white backdrop-blur-sm placeholder:text-white/50" autoComplete="off" />
                      {showSug && suggestions.length > 0 && (
                        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-white/20 bg-[#0d1626]/95 shadow-xl backdrop-blur-md">
                          {suggestions.map((s, i) => (
                            <button key={i} type="button" onClick={() => { setAddress(s.formatted_address); setShowSug(false); }}
                              className="w-full border-b border-white/10 px-4 py-3 text-left text-sm text-white/90 last:border-b-0 hover:bg-white/10">{s.formatted_address}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="submit" disabled={status === "loading"} className="h-12 bg-primary px-6 text-base font-bold hover:bg-primary/90">
                      {status === "loading" ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Measuring…</> : <>Get my estimate <ArrowRight className="ml-2 h-5 w-5" /></>}
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/65">
                    <span>★ Google-reviewed</span><span>·</span><span>Licensed &amp; insured · {BIZ.license}</span><span>·</span>
                    <span>Owens Corning System Reroof Estimate · No obligation</span>
                  </div>
                </form>
              ) : (
                <ResultCard status={status} card={card} inspectionMsg={inspectionMsg} code={code} onBook={goToForm} onReset={reset}
                  onLockIn={() => setCtaModal("lock-in")} onQuestion={() => setCtaModal("question")} onCapture={() => setCtaModal("capacity")} />
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ===================== P2 — ambient job-photo gallery behind the reviews + FAQ ===================== */}
      <div id="images" className="relative isolate scroll-mt-0 overflow-hidden bg-gradient-to-b from-[#0d1626] via-[#11203a] to-[#0d1626]">
        {!isMobile && <FloatingGallery noPop={qaHover} />}
        {/* light scrim + top/bottom blend (photos are already dimmed per-image; a POPPED photo rises above this at z-50) */}
        <div className="pointer-events-none absolute inset-0 z-[2] bg-[#0a1220]/25" />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-[#0d1626] via-transparent to-[#0d1626]" />
        <div className="relative z-10">
          {isMobile && <ShuffleStack />}
          <ReviewsStrip />

          <section id="qa" className="scroll-mt-6 text-white">
            <div className="container mx-auto max-w-3xl px-6 py-16" data-p2content onMouseEnter={() => { qaHover.current = true; }} onMouseLeave={() => { qaHover.current = false; }}>
              <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-white">Q&amp;A — You may be wondering…</h2>
              <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#0b1424]/55 px-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-7">
                {ESTIMATE_FAQ.map((f, i) => {
                  const open = openFaq === i;
                  return (
                    <div key={i}>
                      <button type="button" onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open}
                        className="flex w-full items-center justify-between gap-4 rounded-lg py-4 text-left text-white outline-none transition-colors hover:text-[hsl(43,85%,62%)] focus:bg-[hsl(43,85%,62%)]/[0.08] focus:ring-1 focus:ring-inset focus:ring-[hsl(43,85%,62%)]/55 focus-visible:bg-[hsl(43,85%,62%)]/[0.08]">
                        <span className="text-lg font-semibold">{f.q}</span>
                        <span className={`shrink-0 select-none text-2xl font-light leading-none text-white/45 transition-transform duration-200 ${open ? "rotate-45 text-[hsl(43,85%,62%)]" : ""}`}>+</span>
                      </button>
                      {open && <p className="-mt-1 pb-5 pr-8 leading-relaxed text-white/70">{f.a}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      <MVP3ContactForm prefill={schedulePrefill} lockService={!!schedulePrefill} bgClassName="bg-gradient-to-br from-[#f5f0e6] to-[#ece5d3]" />

      <SiteFooter />
      {/* click-to-call — fixed at the very top-center (web + mobile), frosted glass like the clouds/wheel, gold like the P1 tag.
          Root-level so `fixed` is viewport-relative (escapes the pinned P1 stage). */}
      <a href={`tel:${BIZ.telephone}`} aria-label={`Call Sigma Roofing at ${BIZ.telephoneDisplay}`} style={MONO}
        className="fixed left-1/2 top-2.5 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/25 bg-white/8 px-4 py-2 text-sm font-bold tracking-wide text-[#dca94e] shadow-[0_10px_36px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/15 backdrop-blur-lg transition-colors hover:bg-white/[0.14] sm:px-5 sm:text-base">
        <Phone className="h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]" /><span>{BIZ.telephoneDisplay}</span>
      </a>
      <ClickWheel suppressPop={qaHover} mobile={isMobile} />

      {ctaModal && card && <QuoteModal cta={ctaModal} code={code} card={card} onClose={() => setCtaModal(null)} onSchedule={goSchedule} />}
    </div>
  );
}

// ---------------- site chrome (logo + home link + contact — consistent with the home page) ----------------
function SiteHeader() {
  return (
    <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-2 px-5 py-3 md:px-8">
      <a href="/" className="flex shrink-0 items-center gap-2.5">
        <img src="/sigma-logo-white.png" alt="Sigma Roofing" className="h-16 w-16 object-contain" />
        <span style={DISPLAY} className="hidden text-xl font-semibold tracking-tight text-white sm:inline">Sigma Roofing</span>
      </a>
      {/* all nav now lives in the click wheel (desktop: right-edge dial · mobile: corner wheel) — Home is the logo */}
    </div>
  );
}
function SiteFooter() {
  return (
    <footer className="bg-[#0d1626] px-6 py-12 text-white/70">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <a href="/" className="flex items-center gap-3">
            <img src="/sigma-logo-white.png" alt="Sigma Roofing LLC" className="h-12 w-12 object-contain" />
            <div>
              <div style={DISPLAY} className="text-lg font-semibold text-white">{BIZ.name}</div>
              <div className="text-xs text-white/45">Roofing &amp; storm restoration · OKC metro</div>
            </div>
          </a>
          <div className="text-sm leading-relaxed">
            <div>{BIZ.street} · {BIZ.city}, {BIZ.region} {BIZ.postal}</div>
            <div><a href={`tel:${BIZ.telephone}`} className="font-semibold text-white hover:underline">{BIZ.telephoneDisplay}</a> · {BIZ.license}</div>
          </div>
          <a href="/" className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10">← Back to home</a>
        </div>
        <div className="mt-8 border-t border-white/10 pt-5 text-center text-xs text-white/35">
          <div>© {new Date().getFullYear()} {BIZ.name}. Licensed &amp; insured · {BIZ.license}</div>
          {/* Owens Corning trademark / non-affiliation disclosure — OC's own required language for contractors who use their name */}
          <div className="mx-auto mt-2 max-w-3xl text-[11px] leading-relaxed text-white/30">{BIZ.name} is an independent contractor and is not an affiliate of Owens Corning Roofing and Asphalt, LLC. Owens Corning®, Duration®, and related marks are trademarks of Owens Corning.</div>
        </div>
      </div>
    </footer>
  );
}

// ---------------- persistent section nav — an iPod 1st-gen CLICK WHEEL pinned to the right edge (desktop). The wheel's
// left hemisphere peeks at the screen edge; hover (or keyboard focus) slides the full wheel in. Controls, iPod-faithful:
//   • menu (top arc)  → opens the little LCD sub-menu → teleport to any section (or Home)
//   • ◀◀ (left arc)   → previous on-page section          • ▶▶ (right arc) → next on-page section
//   • ▶❙❙ (bottom arc) → toggles an auto-tour (scrolls through the sections, ~3.6s each)
//   • center hub      → "scroll": advance one notch; the hook arrow (↺) spins one CCW turn each press
// A scroll-spy tracks where you are (shown on the screen + highlighted in the sub-menu). Glossy white/silver plastic,
// bevel lighting, clicky press states. Replaces the old frosted-glass SectionDial. ----------------
const WHEEL_SECTIONS: { id: string; sel: string; label: string }[] = [
  { id: "top", sel: ".p1", label: "Estimator" }, // .p1 / page top
  { id: "images", sel: "#images", label: "Images" }, // P2 ambient gallery
  { id: "reviews", sel: "#reviews", label: "Reviews" },
  { id: "qa", sel: "#qa", label: "Q&A" },
  { id: "contact", sel: "#contact", label: "Contact" }, // the booking form
];
// the menu button's pop-out list — Antonio's order; `idx` maps into WHEEL_SECTIONS, `href` navigates away (Home).
const WHEEL_MENU: { label: string; idx?: number; href?: string }[] = [
  { label: "Estimator", idx: 0 },
  { label: "Reviews", idx: 2 },
  { label: "Q&A", idx: 3 },
  { label: "Images", idx: 1 },
  { label: "Contact", idx: 4 },
  { label: "Home", href: "/" },
];
function ClickWheel({ suppressPop, mobile }: { suppressPop?: { current: boolean }; mobile?: boolean }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false); // sub-menu (menu button)
  const [playing, setPlaying] = useState(false); // auto-tour
  const activeRef = useRef(0);
  useEffect(() => { activeRef.current = active; }, [active]);
  const holdRef = useRef<{ timer: number; held: boolean }>({ timer: 0, held: false }); // mobile forward-button long-press

  const nav = (idx: number) => {
    const s = WHEEL_SECTIONS[idx];
    if (s.id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
    else document.querySelector(s.sel)?.scrollIntoView({ behavior: "smooth" });
  };
  const goRel = (d: number) => { const n = WHEEL_SECTIONS.length; const idx = (((activeRef.current + d) % n) + n) % n; setActive(idx); nav(idx); };
  const goTo = (idx: number) => { setActive(idx); nav(idx); };
  const togglePlay = () => setPlaying((p) => !p);

  // scroll-spy: a section is "current" once its top crosses 40% of the viewport
  useEffect(() => {
    const spy = () => {
      const refY = window.innerHeight * 0.4;
      let act = 0;
      WHEEL_SECTIONS.forEach((s, idx) => {
        const el = document.querySelector(s.sel) as HTMLElement | null;
        if (el && el.getBoundingClientRect().top <= refY) act = idx;
      });
      setActive(act);
    };
    spy();
    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("resize", spy);
    return () => { window.removeEventListener("scroll", spy); window.removeEventListener("resize", spy); };
  }, []);

  // play/pause: DESKTOP = an auto-tour (jump section→section, never navigates away); MOBILE = a smooth continuous
  // auto-scroll (Antonio's mobile spec — tap to roll the page, tap again to stop; it also stops itself at the bottom).
  useEffect(() => {
    if (!playing) return;
    if (mobile) {
      let raf = 0;
      const atBottom = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const step = () => { window.scrollBy(0, 1.3); if (atBottom()) { setPlaying(false); return; } raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }
    const t = window.setInterval(() => goRel(1), 3600);
    return () => window.clearInterval(t);
  }, [playing, mobile]);

  // center hub = an IN-SECTION cursor — it NEVER changes section (only the arcs/menu do that). It steps through the
  // focusable controls of whatever section you're parked in, wrapping. Q&A is special: it drives the single-open FAQ
  // accordion (each press expands + highlights the next question and collapses the previous). Reviews/Images have no
  // fields → no-op.
  const SECTION_SEL = [".p1", "#images", "#reviews", "#qa", "#contact"]; // index-aligned with WHEEL_SECTIONS
  const center = () => {
    const sec = activeRef.current;
    const inView = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return r.top >= 70 && r.bottom <= window.innerHeight - 30; };
    const reveal = (el: HTMLElement) => { el.focus({ preventScroll: true }); if (!inView(el)) el.scrollIntoView({ block: "center", behavior: "smooth" }); };
    if (!mobile && sec === 3) { // Q&A accordion stepping is DESKTOP-only; on mobile the center hub is the text-field cursor only (no Q&A)
      const btns = Array.from(document.querySelectorAll<HTMLButtonElement>("#qa [aria-expanded]"));
      if (!btns.length) return;
      const openIdx = btns.findIndex((b) => b.getAttribute("aria-expanded") === "true");
      const target = (openIdx + 1) % btns.length; // none open (-1) → first
      btns[target].click(); // single-open accordion expands target + collapses the previous
      reveal(btns[target]);
      return;
    }
    const container = document.querySelector(SECTION_SEL[sec]);
    if (!container) return;
    // only the FILL-IN fields (text inputs + textareas) — deliberately skip dropdowns/menus, checkboxes/toggles,
    // and buttons (incl. Submit) so the cursor doesn't stop on "dead" controls. e.g. Contact = First→Last→Email→
    // Phone→Address then wraps (no stop on Service-Type, the lock-in toggle, or Submit); Estimator = the address field.
    const fields = Array.from(container.querySelectorAll<HTMLElement>("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), textarea"))
      .filter((el) => el.getClientRects().length > 0 && !(el as HTMLInputElement).disabled);
    if (!fields.length) return; // Reviews / Images carry no fields → no-op (only the arcs/menu move you)
    const cur = fields.indexOf(document.activeElement as HTMLElement);
    reveal(fields[(cur + 1) % fields.length]);
  };
  const ARC = "absolute inset-0 rounded-full transition-colors duration-100 hover:bg-black/[0.045] active:bg-black/[0.10]";

  // ---- MOBILE: a SEE-THROUGH glass click wheel tucked into the TOP-RIGHT CORNER (no white fill — frosted on every page).
  // Pared to TWO controls: the FORWARD button (short tap = next section · HOLD ≥500ms = jump back to P1/top) + a blank
  // center hub = the text-field cursor (the web `center`, which skips Q&A on mobile → only acts where text fields exist).
  // Rewind/play and the menu are gone; the SiteHeader's mobile links are gone too — the wheel IS the mobile nav. ----
  if (mobile) {
    const Dm = 132, hub = 54, m = 28; // diameter / hub diameter / how far the wheel center pokes in from the corner (px)
    const fwdDown = () => { holdRef.current.held = false; holdRef.current.timer = window.setTimeout(() => { holdRef.current.held = true; window.scrollTo({ top: 0, behavior: "smooth" }); }, 500); }; // hold → back to P1
    const fwdUp = () => { window.clearTimeout(holdRef.current.timer); if (!holdRef.current.held) goRel(1); }; // short tap → next section
    const fwdCancel = () => { window.clearTimeout(holdRef.current.timer); holdRef.current.held = false; };
    return (
      <nav aria-label="Jump to section" style={MONO} className="md:hidden">
        <style dangerouslySetInnerHTML={{ __html: "@keyframes cwPing{0%{transform:translate(-50%,-50%) scale(.92);opacity:.5}70%,100%{transform:translate(-50%,-50%) scale(1.5);opacity:0}}@media(prefers-reduced-motion:reduce){.cw-ping{animation:none!important;opacity:0}}" }} />
        <div className="fixed z-[55] rounded-full" style={{ top: -(Dm / 2 - m), right: -(Dm / 2 - m) }}>
          {/* see-through glass disc — EXACT same frosted-glass treatment as the P1 text-cloud divs (bg-white/8 + ring + blur-lg) */}
          <div className="relative rounded-full border border-white/25 bg-white/8 shadow-[0_10px_36px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/15 backdrop-blur-lg"
            style={{ height: Dm, width: Dm }}>
            {/* groove ring around the hub */}
            <div className="pointer-events-none absolute rounded-full border border-white/15" style={{ inset: 33 }} />
            {/* click-wheel creases at the reference's CANONICAL proportion — 90° apart (NOT redistributed to the one
                button). They flank the forward button's arc: forward sits centered at 135°, between the 90° & 180° creases,
                exactly like a real iPod button sits in the middle of its arc bounded by two diagonal seams. */}
            {[90, 180].map((a) => (
              <div key={a} className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-px origin-top"
                style={{ height: Dm / 2, transform: `rotate(${a - 90}deg)`, background: "linear-gradient(to bottom, transparent 0 33px, rgba(255,255,255,0.32) 33px 34px, rgba(0,0,0,0.13) 34px 62px, transparent 62px)" }} />
            ))}
            {/* FORWARD — short tap = next section · HOLD = back to P1 (top). Positioned on the corner DIAGONAL (≈45°); the ▶▶ glyph stays upright. Pointer events so the long-press works on touch. */}
            <button type="button" aria-label="Next section (hold for home)"
              onPointerDown={fwdDown} onPointerUp={fwdUp} onPointerLeave={fwdCancel} onPointerCancel={fwdCancel} onContextMenu={(e) => e.preventDefault()}
              className="absolute z-10 flex h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-colors active:bg-white/10"
              style={{ left: Dm / 2 + 48 * Math.cos((135 * Math.PI) / 180), top: Dm / 2 + 48 * Math.sin((135 * Math.PI) / 180), touchAction: "none" }}>
              <span className="text-[15px] font-semibold" style={{ color: "#ffffff", mixBlendMode: "difference" }}>▶▶</span>
            </button>
            {/* subtle pulsing ring — gently draws the eye to the center cursor button (the thing to tap) */}
            <div className="cw-ping pointer-events-none absolute left-1/2 top-1/2 z-20 rounded-full border border-white/45" style={{ height: hub, width: hub, animation: "cwPing 2.6s ease-out infinite" }} />
            {/* center hub — blank glass; the text-field cursor (web `center`, skips Q&A). preventDefault keeps focus on the field. */}
            <button type="button" aria-label="Select field" onClick={center} onMouseDown={(e) => e.preventDefault()}
              className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 backdrop-blur-[2px] transition-transform duration-100 active:scale-[0.97]"
              style={{ height: hub, width: hub, background: "rgba(255,255,255,0.14)", boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), 0 1px 3px rgba(0,0,0,0.25)" }} />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Jump to section" style={MONO}
      className="group fixed right-0 top-1/2 z-[55] hidden -translate-y-1/2 translate-x-[42%] flex-col items-end gap-2.5 pr-1 transition-transform duration-300 ease-out focus-within:translate-x-0 hover:translate-x-0 md:flex"
      onMouseEnter={() => { if (suppressPop) suppressPop.current = true; }}
      onMouseLeave={() => { setOpen(false); if (suppressPop) suppressPop.current = false; }}>

      {/* the little iPod LCD screen — shows the current section; the menu button expands it into the list (desktop wheel) */}
      <div className="w-[152px] overflow-hidden rounded-[11px] border border-black/20 shadow-[0_12px_26px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.85)]"
        style={{ background: "linear-gradient(180deg,#eef1ea,#dfe3d8)" }}>
        <div className="flex items-center justify-between bg-gradient-to-b from-[#cdd2c6] to-[#b6bcab] px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-[0.18em] text-[#5b6053]">
          <span>Sigma</span><span className="text-[#7c8273]">▸▸</span>
        </div>
        {open ? (
          <ul className="py-0.5 text-[11px] leading-none">
            {WHEEL_MENU.map((row, i) => {
              const cur = row.idx != null && row.idx === active;
              return (
                <li key={i}>
                  <button type="button"
                    onClick={() => { if (row.href) window.location.href = row.href; else { goTo(row.idx!); setOpen(false); } }}
                    className={`flex w-full items-center justify-between px-2.5 py-[5px] text-left transition-colors ${cur ? "bg-gradient-to-b from-[#3f6fc6] to-[#2f55a0] font-semibold text-white" : "text-[#3e433a] hover:bg-black/[0.06]"}`}>
                    <span>{row.label}</span><span className={cur ? "text-white/85" : "text-[#9aa08d]"}>‹</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center justify-between px-2.5 py-[7px] text-[11px] font-semibold text-[#3e433a]">
            <span className="truncate">{WHEEL_SECTIONS[active].label}</span>
            {playing && <span className="ml-2 shrink-0 animate-pulse text-[9px] text-[#3f6fc6]">● tour</span>}
          </div>
        )}
      </div>

      {/* the wheel — seated in a thin silver bezel. In Q&A it goes translucent "glass" (so it stops covering the
          questions you're reading) — outlines/labels stay faintly visible; smooth opacity fade in/out of the section. */}
      <div className="rounded-full p-[6px] transition-opacity duration-500 ease-out" style={{ background: "linear-gradient(155deg,#e6e7e9,#c6c8cc 58%,#abadb2)", boxShadow: "0 22px 50px rgba(0,0,0,0.5)", opacity: active === 3 ? 0.34 : 1 }}>
        <div className="relative h-[216px] w-[216px] rounded-full"
          style={{ background: "radial-gradient(125% 125% at 32% 24%, #ffffff 0%, #f5f6f7 32%, #e8e9eb 62%, #d6d8dc 100%)", boxShadow: "inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -10px 18px rgba(0,0,0,0.10), 0 6px 14px rgba(0,0,0,0.28)" }}>

          {/* 4 wedge buttons (the arcs) — transparent hotspots that darken on hover/press: menu(top), prev(left),
              next(right), play-tour(bottom). (The mobile wheel is a separate corner layout — see the early return above.) */}
          <button type="button" aria-label="Menu" onClick={() => setOpen((o) => !o)} className={`${ARC} z-10`} style={{ clipPath: "polygon(50% 50%, 0 0, 100% 0)" }} />
          <button type="button" aria-label="Previous section" onClick={() => goRel(-1)} className={`${ARC} z-10`} style={{ clipPath: "polygon(50% 50%, 0 100%, 0 0)" }} />
          <button type="button" aria-label="Next section" onClick={() => goRel(1)} className={`${ARC} z-10`} style={{ clipPath: "polygon(50% 50%, 100% 0, 100% 100%)" }} />
          <button type="button" aria-label={playing ? "Pause auto-tour" : "Play auto-tour"} onClick={togglePlay} className={`${ARC} z-10`} style={{ clipPath: "polygon(50% 50%, 100% 100%, 0 100%)" }} />

          {/* groove ring around the center hub */}
          <div className="pointer-events-none absolute z-20 rounded-full" style={{ inset: "58px", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.22), 0 1px 1px rgba(255,255,255,0.7)" }} />

          {/* radial seams between the 4 arc buttons (the faint diagonal divider lines, like the real wheel) */}
          {[45, 135, 225, 315].map((a) => (
            <div key={a} className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[108px] w-px origin-top"
              style={{ transform: `rotate(${a}deg)`, background: "linear-gradient(to bottom, transparent 0 46px, rgba(0,0,0,0.17) 46px 80px, rgba(0,0,0,0.13) 80px 104px, transparent 104px)" }} />
          ))}

          {/* labels at the cardinals (non-interactive — the wedge under each takes the click) */}
          <span className="pointer-events-none absolute left-1/2 top-[13px] z-20 -translate-x-1/2 text-[13px] font-medium tracking-wide text-[#8b8e93]">menu</span>
          <span className="pointer-events-none absolute left-[15px] top-1/2 z-20 -translate-y-1/2 text-[15px] text-[#8b8e93]">◀◀</span>
          <span className="pointer-events-none absolute right-[15px] top-1/2 z-20 -translate-y-1/2 text-[15px] text-[#8b8e93]">▶▶</span>
          <span className={`pointer-events-none absolute bottom-[13px] left-1/2 z-20 -translate-x-1/2 text-[14px] ${playing ? "text-[#3f6fc6]" : "text-[#8b8e93]"}`}>▶❙❙</span>

          {/* center hub — blank "select / cursor" button. onMouseDown-preventDefault keeps the click from stealing focus
              off the form field, so the cursor advances from the field you're on. (Mobile center = the corner wheel above.) */}
          <button type="button" aria-label="Select within this section" onClick={center} onMouseDown={(e) => e.preventDefault()}
            className="absolute left-1/2 top-1/2 z-30 h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-100 active:scale-[0.97]"
            style={{ background: "radial-gradient(115% 115% at 36% 30%, #ffffff 0%, #f1f2f4 42%, #d9dce0 80%, #cccfd4 100%)", boxShadow: "inset 0 2px 4px rgba(255,255,255,0.95), inset 0 -4px 8px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.05)" }} />
        </div>
      </div>
    </nav>
  );
}

// ---------------- quote-funnel modal (Lock in 5% / Got a question? → minimal capture → /api/quote-lead email) ----------------
function QuoteModal({ cta, code, card, onClose, onSchedule }: { cta: "lock-in" | "question" | "capacity"; code: string; card: CardData; onClose: () => void; onSchedule: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [step, setStep] = useState<"choose" | "capture">(cta === "lock-in" ? "choose" : "capture");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState("");
  const estimate = cta === "capacity" ? "(pending — over capacity)" : `${usd(card.low)}–${usd(card.high)}`;
  const ctaType = cta === "capacity" ? "over-capacity" : cta;
  async function submit() {
    if (!firstName.trim() || (!phone && !email)) return;   // name required + at least a phone OR email
    setSending(true);
    try {
      const r = await fetch("/api/quote-lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ctaType, code, address: card.address, estimate, firstName, phone, email, question, preference: cta === "lock-in" ? "call me today" : undefined }),
      });
      const d = await r.json();
      setDone(d.message || "Got it — we'll reach out shortly.");
    } catch { setDone("Sent — we'll reach out shortly."); }
    setSending(false);
  }
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-[min(30rem,94vw)] rounded-2xl bg-white p-6 text-[#1a2230] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="float-right text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
        {done ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">✓</div>
            <p className="mt-3 font-medium text-gray-800">{done}</p>
            <p className="mt-2 text-xs text-gray-400">Quote code <b className="tracking-wider text-primary">{code}</b> — good for 5% off.</p>
            <Button onClick={onClose} className="mt-5 h-11 px-6">Done</Button>
          </div>
        ) : cta === "lock-in" && step === "choose" ? (
          <div>
            <h3 className="text-xl font-bold">Lock in your 5% online discount</h3>
            <p className="mt-1 text-sm text-gray-500">Code <b className="tracking-wider text-primary">{code}</b> · {estimate} on {card.address}</p>
            <div className="mt-5 space-y-3">
              <button onClick={() => setStep("capture")} className="flex w-full items-center gap-3 rounded-xl border-2 border-primary/20 p-4 text-left transition-colors hover:border-primary hover:bg-primary/5">
                <Phone className="h-5 w-5 shrink-0 text-primary" /><div><div className="font-semibold">Have an agent call me today</div><div className="text-xs text-gray-500">Quickest — we lock it in by phone</div></div>
              </button>
              <button onClick={onSchedule} className="flex w-full items-center gap-3 rounded-xl border-2 border-gray-200 p-4 text-left transition-colors hover:border-gray-400 hover:bg-gray-50">
                <CalendarClock className="h-5 w-5 shrink-0 text-gray-600" /><div><div className="font-semibold">I'd rather schedule a time</div><div className="text-xs text-gray-500">Pick a day that works for you</div></div>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-bold">{cta === "lock-in" ? "We'll call you today to lock it in" : cta === "capacity" ? "We'll send your full estimate personally" : "Got a question about your quote?"}</h3>
            <p className="mt-1 text-sm text-gray-500">Code <b className="tracking-wider text-primary">{code}</b> · {card.address}</p>
            {cta === "question" && (
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What would you like to know?" rows={3}
                className="mt-3 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary focus:outline-none" />
            )}
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name — what do you go by?" className="mt-3 h-11" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-11" />
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="h-11" />
            </div>
            <p className="mt-2 text-xs text-gray-400">Your name + a phone or email — an agent will reach out shortly.</p>
            <Button onClick={submit} disabled={sending || !firstName.trim() || (!phone && !email)} className="mt-4 h-12 w-full bg-[hsl(43,74%,52%)] font-bold text-[#1a1304] hover:bg-[hsl(43,74%,46%)]">
              {sending ? "Sending…" : cta === "lock-in" ? "Lock in my 5%" : cta === "capacity" ? "Send me my estimate" : "Send my question"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- result card (lands inside the estimator frame) ----------------
function ResultCard({ status, card, inspectionMsg, code, onBook, onReset, onLockIn, onQuestion, onCapture }: { status: Status; card: CardData | null; inspectionMsg: string; code: string; onBook: () => void; onReset: () => void; onLockIn: () => void; onQuestion: () => void; onCapture: () => void }) {
  if (status === "capacity") {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(43,74%,52%)]/20 text-[hsl(43,85%,62%)]"><CalendarClock className="h-5 w-5" /></div>
        <h3 className="text-lg font-bold text-white">We're at capacity for instant estimates today</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/75">Leave your email or phone and we'll measure {card?.address ? <b className="text-white/90">{card.address}</b> : "your roof"} and send your estimate personally — usually the same day.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Button onClick={onCapture} className="h-12 bg-[hsl(43,74%,52%)] px-6 font-bold text-[#1a1304] hover:bg-[hsl(43,74%,46%)]">Send me my estimate →</Button>
          <Button onClick={onReset} variant="outline" className="h-12 border-white/40 bg-white/5 px-4 text-white hover:bg-white/15 hover:text-white"><RotateCcw className="mr-2 h-4 w-4" />Try later</Button>
        </div>
      </div>
    );
  }
  if (status === "busy") {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-bold text-white">Our estimator's in high demand right now</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/75">Give it about a minute, then try again — these instant measurements are popular today.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Button onClick={onReset} className="h-12 bg-[hsl(43,74%,52%)] px-6 font-bold text-[#1a1304] hover:bg-[hsl(43,74%,46%)]"><RotateCcw className="mr-2 h-4 w-4" />Try again</Button>
          <Button onClick={onBook} variant="outline" className="h-12 border-white/40 bg-white/5 px-4 text-white hover:bg-white/15 hover:text-white">Or book an inspection</Button>
        </div>
      </div>
    );
  }
  if (status === "user_limit") {
    return (
      <div className="p-6 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(43,74%,52%)]/20 text-[hsl(43,85%,62%)]"><ShieldCheck className="h-5 w-5" /></div>
        <h3 className="text-lg font-bold text-white">That's your 2 free estimates for today</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/75">We allow 2 estimates per user to keep this tool fast and accessible to everyone. Want more? Tap <b className="text-white/90">Got a question?</b> below and we'll take care of you.</p>
        <div className="mt-5 flex justify-center gap-3">
          <Button onClick={onQuestion} className="h-12 bg-[hsl(43,74%,52%)] px-6 font-bold text-[#1a1304] hover:bg-[hsl(43,74%,46%)]"><HelpCircle className="mr-2 h-4 w-4" />Got a question?</Button>
          <Button onClick={onBook} variant="outline" className="h-12 border-white/40 bg-white/5 px-4 text-white hover:bg-white/15 hover:text-white">Book an inspection</Button>
        </div>
      </div>
    );
  }
  if (status === "inspection" || status === "error" || !card) {
    return (
      <div className="p-6 text-center">
        <p className="mb-5 text-white/85">{status === "inspection" ? inspectionMsg : "We hit a snag measuring that one. Try again, or just book a free inspection and we'll measure it in person."}</p>
        <div className="flex justify-center gap-3">
          <Button onClick={onBook} className="h-12 bg-[hsl(43,74%,52%)] px-6 font-bold text-[#1a1304] hover:bg-[hsl(43,74%,46%)]">Book a free inspection →</Button>
          <Button onClick={onReset} variant="outline" className="h-12 border-white/40 bg-white/5 px-4 text-white hover:bg-white/15 hover:text-white"><RotateCcw className="mr-2 h-4 w-4" />Try another</Button>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-between rounded-t-2xl bg-primary px-5 py-3 text-white">
        <div className="min-w-0 truncate text-sm font-bold">{card.address}</div>
        <button onClick={onReset} className="ml-2 flex shrink-0 items-center gap-1 text-xs text-white/70 hover:text-white"><RotateCcw className="h-3.5 w-3.5" />new</button>
      </div>
      <div className="grid grid-cols-2">
        <div className="bg-[#0f1a2b] p-3 text-center">
          <img src={card.image} alt="aerial view of the roof with the measured footprint outlined" className="mx-auto inline-block w-full max-w-[220px] rounded-lg"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              const step = img.dataset.fb || "0";
              if (step === "0") { img.dataset.fb = "1"; img.src = `/api/roof-facet-sketch?address=${encodeURIComponent(card.address)}`; } // no satellite photo -> our schematic
              else if (step === "1") { img.dataset.fb = "2"; img.src = "/sketch-605_nw_115th_st.png"; } // last resort -> static default
            }} />
        </div>
        <div className="grid grid-cols-2 content-center gap-px bg-white/5">
          <Metric icon={<Ruler className="h-4 w-4" />} value={String(card.squares)} label="squares" />
          <Metric icon={<Compass className="h-4 w-4" />} value={card.pitch} label="pitch" />
          <Metric icon={<Layers className="h-4 w-4" />} value={String(card.facets)} label="facets" />
          <Metric icon={<MapPin className="h-4 w-4" />} value={`~${card.perimeter}′`} label="perimeter" />
        </div>
      </div>
      <div className="p-5 text-center">
        <div className="text-sm font-medium text-white/80">Estimate — Owens Corning Duration Architectural System</div>
        <div className="mt-1 text-3xl font-extrabold text-white">{usd(card.low)} – <span className="text-[hsl(43,85%,62%)]">{usd(card.high)}</span></div>
        {card.confidenceTier && card.confidenceTier !== "example" && <div className="mt-0.5 text-xs uppercase tracking-wide text-white/55">confidence: {card.confidenceTier}</div>}
        <div className="mt-3 rounded-lg bg-[hsl(43,74%,52%)]/20 px-3 py-2 text-[13px] text-amber-100">🔒 <b className="text-amber-50">Save 5%</b> when you book online — code <b className="tracking-wider text-amber-50">{code}</b></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={onLockIn} className="h-12 bg-[hsl(43,74%,52%)] font-bold text-[#1a1304] hover:bg-[hsl(43,74%,46%)]"><Lock className="mr-1.5 h-4 w-4" />Lock in your 5%</Button>
          <Button onClick={onQuestion} variant="outline" className="h-12 border-white/40 bg-white/5 font-semibold text-white hover:bg-white/15 hover:text-white"><HelpCircle className="mr-1.5 h-4 w-4" />Got a question?</Button>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-white/[0.07] py-3 text-center">
      <div className="mb-1 flex items-center justify-center text-white/50">{icon}</div>
      <div className="text-xl font-extrabold leading-none text-white">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-white/70">{label}</div>
    </div>
  );
}

// ---------------- P2 ambient gallery — real job photos bounce around the background like balls in a box ----------------
// One rAF loop integrates each UPRIGHT (no-rotation) framed photo, WRAPS it through the edges (each edge is a portal: exit
// one side -> slide back in from the opposite, momentum kept — flows rather than bounces, so it reads less crowded) and
// ping-pongs it off the OTHER photos (AABB elastic). It also tracks the cursor: the photo under the pointer "pops" — scales
// up + brightens + rises above everything (z-50) and freezes — holding until the cursor leaves its area by a margin U.
const GALLERY = [1, 2, 3, 4, 5, 6];
function FloatingGallery({ noPop }: { noPop?: { current: boolean } }) {
  // Mobile: fewer + smaller photos (less crowded + lighter). Desktop: all 6.
  const items = useMemo(() => (typeof window !== "undefined" && window.matchMedia?.("(max-width: 639px)")?.matches) ? GALLERY.slice(0, 4) : GALLERY, []);
  const wrapRef = useRef<HTMLDivElement>(null);
  const outers = useRef<(HTMLDivElement | null)[]>(Array(items.length).fill(null));
  const [focused, setFocused] = useState(-1);
  const focusedRef = useRef(-1);
  const mouse = useRef({ x: -1e6, y: -1e6 });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const isTouch = !!window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
    let IW = 200, IH = 150; // photo box (measured from the rendered card; all are the same size)
    const measure = () => { const el = outers.current[0]?.firstElementChild as HTMLElement | null; if (el) { IW = el.offsetWidth; IH = el.offsetHeight; } };
    const W = () => wrapRef.current?.clientWidth || window.innerWidth;
    const H = () => wrapRef.current?.clientHeight || window.innerHeight;
    measure();
    const st = items.map((_, i) => ({
      x: Math.random() * Math.max(1, W() - IW),
      y: (i / items.length) * Math.max(1, H() - IH) + Math.random() * 60,
      vx: (Math.random() < 0.5 ? -1 : 1) * (16 + Math.random() * 18), // px/s
      vy: (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 15),
    }));
    const U = 90; // hysteresis: a popped photo stays popped until the cursor is U px beyond it
    let tapTimer: ReturnType<typeof setTimeout> | undefined;
    const onMove = (e: MouseEvent) => { const r = wrapRef.current?.getBoundingClientRect(); if (r) { mouse.current.x = e.clientX - r.left; mouse.current.y = e.clientY - r.top; } };
    const onLeave = () => { mouse.current.x = -1e6; mouse.current.y = -1e6; };
    const onTap = (e: PointerEvent) => { // TOUCH equivalent of the hover-pop
      if (e.pointerType !== "touch") return;
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      if (hit && hit.closest("[data-p2content]")) return; // tapped the reviews/Q&A -> let the content handle it
      const r = wrapRef.current?.getBoundingClientRect(); if (!r) return;
      const tx = e.clientX - r.left, ty = e.clientY - r.top;
      for (let i = st.length - 1; i >= 0; i--) { const p = st[i]; if (tx > p.x && tx < p.x + IW && ty > p.y && ty < p.y + IH) {
        focusedRef.current = i; setFocused(i);
        clearTimeout(tapTimer); tapTimer = setTimeout(() => { focusedRef.current = -1; setFocused(-1); }, 2600); // auto-release
        return;
      } }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("pointerup", onTap);
    window.addEventListener("resize", measure);
    let raf = 0, last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const w = W(), h = H();
      // integrate + wrap through the portal edges
      for (let i = 0; i < st.length; i++) {
        if (i === focusedRef.current || reduce) continue;
        const p = st[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x > w) p.x = -IW; else if (p.x < -IW) p.x = w; // portal edges: fully exit one side -> reappear from the opposite (momentum kept)
        if (p.y > h) p.y = -IH; else if (p.y < -IH) p.y = h;
      }
      // ping-pong off each other (AABB elastic, equal mass; skip the popped one)
      for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) {
        if (i === focusedRef.current || j === focusedRef.current) continue;
        const a = st[i], b = st[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const ox = IW - Math.abs(dx), oy = IH - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          if (ox <= oy) { const s = (dx < 0 ? -1 : 1) * ox / 2; a.x -= s; b.x += s; if ((b.vx - a.vx) * dx < 0) { const tv = a.vx; a.vx = b.vx; b.vx = tv; } }
          else { const s = (dy < 0 ? -1 : 1) * oy / 2; a.y -= s; b.y += s; if ((b.vy - a.vy) * dy < 0) { const tv = a.vy; a.vy = b.vy; b.vy = tv; } }
        }
      }
      for (let i = 0; i < st.length; i++) { const el = outers.current[i]; if (el) el.style.transform = `translate3d(${st[i].x}px,${st[i].y}px,0)`; }
      if (!isTouch) { // desktop = hover-driven; touch uses tap (onTap) instead, so don't fight it here
        const mx = mouse.current.x, my = mouse.current.y;
        let nf = focusedRef.current;
        if (nf >= 0) { const p = st[nf]; if (!(mx > p.x - U && mx < p.x + IW + U && my > p.y - U && my < p.y + IH + U)) nf = -1; }
        if (nf < 0) for (let i = st.length - 1; i >= 0; i--) { const p = st[i]; if (mx > p.x && mx < p.x + IW && my > p.y && my < p.y + IH) { nf = i; break; } }
        if (noPop?.current) nf = -1; // cursor over the Q&A -> suppress pops (don't disrupt reading)
        if (nf !== focusedRef.current) { focusedRef.current = nf; setFocused(nf); }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(tapTimer); window.removeEventListener("mousemove", onMove); document.removeEventListener("mouseleave", onLeave); window.removeEventListener("pointerup", onTap); window.removeEventListener("resize", measure); };
  }, []);
  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0" aria-hidden>
      {items.map((n, i) => (
        <div key={n} ref={(el) => { outers.current[i] = el; }} className="absolute left-0 top-0" style={{ zIndex: focused === i ? 50 : 1, willChange: "transform" }}>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-[#0d1626] shadow-[0_22px_60px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/10 transition-[transform,filter] duration-300 ease-out"
            style={{ width: "clamp(130px,32vw,460px)", aspectRatio: "4 / 3", transformOrigin: "center", transform: focused === i ? "scale(1.28)" : "scale(1)", filter: focused === i ? "brightness(1.12)" : "brightness(0.9)" }}>
            <img src={`/carousel-${n}.jpg`} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- P2 MOBILE gallery — a fixed 2×3 grid of static slots; the job photos JIGGLE + SHUFFLE between the slots
// (slots stay put, images swap positions), translucent + slightly shrunk; tap one to HALT + pop it full-size. Desktop uses
// the floating <FloatingGallery/> instead. ----------------
function ShuffleStack() {
  const [order, setOrder] = useState<number[]>(() => GALLERY.map((_, i) => i)); // order[0] = front of the stack
  const orderRef = useRef(order); orderRef.current = order;
  const [dealing, setDealing] = useState(-1); // image idx currently being dealt to the back
  const [open, setOpen] = useState(false);   // lightbox open
  const [view, setView] = useState(0);       // image idx shown in the lightbox
  const startX = useRef(0);
  // auto-shuffle: every ~3.2s the front card "deals" to the back, cycling each full-size photo to the front. Halts
  // while the lightbox is open (or reduced-motion).
  useEffect(() => {
    if (open || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)) return;
    let to: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setDealing(orderRef.current[0]);
      to = setTimeout(() => { setOrder((o) => [...o.slice(1), o[0]]); setDealing(-1); }, 520);
    }, 1200); // shove the next card off almost as soon as the last one settles back in (tiny buffer — emphasize the shuffle)
    return () => { clearInterval(id); clearTimeout(to); };
  }, [open]);
  useEffect(() => { if (open) setDealing(-1); }, [open]); // never leave a card mid-deal when the lightbox opens
  const swipe = (dir: number) => setView((v) => (v + dir + GALLERY.length) % GALLERY.length);
  return (
    <div className="px-5 pb-10 pt-12">
      <p style={MONO} className="mb-4 text-center text-[11px] uppercase tracking-[0.3em] text-[#dca94e]">Recent Sigma Roofing work</p>
      {/* the stack — full-size cards layered with depth; the front one fills the box, the rest peek + vibrate */}
      <div className="relative mx-auto w-[88vw] max-w-md" style={{ aspectRatio: "4 / 3" }}>
        {GALLERY.map((n, img) => {
          const depth = order.indexOf(img), d = Math.min(depth, 3), isDealing = dealing === img;
          const transform = isDealing
            ? "translate(118%, -4%) rotate(10deg) scale(0.95)"
            : `translate(${d * 5}px, ${d * 7}px) scale(${1 - d * 0.04}) rotate(${(d % 2 ? -1 : 1) * d * 1.1}deg)`;
          return (
            <button key={n} type="button" onClick={() => { setView(img); setOpen(true); }} aria-label="View job photo"
              className="absolute inset-0 overflow-hidden rounded-2xl border border-white/15 bg-[#0d1626] shadow-[0_18px_44px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/10"
              style={{ zIndex: isDealing ? 99 : 60 - depth, transform, transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)" }}>
              <img src={`/carousel-${n}.jpg`} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover opacity-[0.92]" />
            </button>
          );
        })}
      </div>

      {/* tap → foreground lightbox: background blurs, swipe (or arrows) to move through every photo */}
      {open && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/55 p-4 backdrop-blur-xl" onClick={() => setOpen(false)}>
          <div className="relative w-[94vw] max-w-lg overflow-hidden rounded-2xl border border-white/25 shadow-2xl ring-1 ring-inset ring-white/10" style={{ aspectRatio: "4 / 3" }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - startX.current; if (dx < -40) swipe(1); else if (dx > 40) swipe(-1); }}>
            <img key={view} src={`/carousel-${GALLERY[view]}.jpg`} alt="Sigma Roofing job" className="ss-fade h-full w-full object-cover" />
            <button type="button" onClick={(e) => { e.stopPropagation(); swipe(-1); }} aria-label="Previous" className="absolute left-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl leading-none text-white/90 backdrop-blur-sm">‹</button>
            <button type="button" onClick={(e) => { e.stopPropagation(); swipe(1); }} aria-label="Next" className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl leading-none text-white/90 backdrop-blur-sm">›</button>
          </div>
          <div className="mt-4 flex gap-1.5">
            {GALLERY.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === view ? "w-5 bg-[#dca94e]" : "w-1.5 bg-white/40"}`} />)}
          </div>
          <p className="mt-3 text-xs text-white/55">Swipe or use the arrows · tap outside to close</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: "@keyframes ss-fade{from{opacity:0.25}to{opacity:1}}.ss-fade{animation:ss-fade 0.22s ease-out}" }} />
    </div>
  );
}

// ---------------- live Google reviews strip (backs the aggregateRating schema) ----------------
function ReviewsStrip() {
  const [data, setData] = useState<{ rating: number; total: number; reviews: { name: string; review: string; rating: number; initials: string }[] } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/reviews").then((r) => r.json()).then((d) => { if (alive && d.success && d.reviews?.length) setData({ rating: d.businessRating, total: d.totalReviews, reviews: d.reviews }); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  if (!data) return null;
  return (
    <section id="reviews" className="scroll-mt-6 text-white">
      <div className="container mx-auto max-w-5xl px-6 py-14" data-p2content>
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <div className="flex text-[hsl(43,85%,62%)]">{[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}</div>
            <span className="text-lg font-extrabold text-white">{data.rating.toFixed(1)}</span>
          </div>
          <div className="mt-1 text-sm text-white/60">{data.total}+ verified Google reviews · Sigma Roofing LLC</div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {data.reviews.slice(0, 3).map((rv, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-[#0b1424]/55 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-md">
              <div className="mb-2 flex text-[hsl(43,85%,62%)]">{[...Array(rv.rating || 5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}</div>
              <p className="text-sm italic leading-relaxed text-white/75">"{rv.review.length > 200 ? rv.review.slice(0, 200).trimEnd() + "…" : rv.review}"</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(43,74%,52%)]/20 text-xs font-bold text-[hsl(43,85%,62%)]">{rv.initials}</div>
                <span className="text-sm font-semibold text-white/90">{rv.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
