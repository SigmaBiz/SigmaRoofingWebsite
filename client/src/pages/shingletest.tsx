// THROWAWAY proof: GAF Grand Manor recreated from Antonio's real macro photo (public/shingle-ref.jpg)
// applied to the Crestridge roof geometry. Isolated — inspect.tsx is untouched. Delete page+route+public imgs to revert.
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture, OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { buildCrestridge } from "@/lib/tr3/solver2";
import { recedeWalls, buildFascia, buildSoffit, buildDiminishedEaveWall, buildDiminishedEaveFascia, buildDiminishedEaveSoffit, buildNotchTongueRoof, buildNotchTongueEave } from "@/lib/tr3/walls";
import { VerifyHUD } from "@/components/VerifyHUD";

const HOUSE = buildCrestridge(9); // s0: bare structure — walls drop straight off the eaves, no offset/fascia, notches open
// firstBelow: what facet I's south eave drops onto at each x — ground in the open gap, the wing roof in the notch stretches.
const firstBelow = (x: number): number => (x <= -8 ? 9 - (2 / 3) * (x + 8) : x >= 1 ? 9 + (2 / 3) * (x - 1) : 0);
// the DIMWALL bottom: the "free wall" drops to the FLOOR, extended past each notch by the underhang (18") so it slides
// under the tongue fascia and lands beside the wing's receded eave wall (notch G at x=1→2.5, notch B at x=-8→-9.5).
const U_UNDER = 1.5; // 18" underhang
const OVERLAP = 0.2; // the free wall overlaps each wing wall slightly so the perpendicular corner closes with no sliver [residual (ii) fix]
const xG = 1 + U_UNDER + OVERLAP, xB = -8 - U_UNDER - OVERLAP; // free-wall floor region inner edges, just past each wing eave wall (x=2.5 / -9.5)
const wallBottom = (x: number): number => (x > xB && x < xG ? 0 : firstBelow(x));
const RECEDED = recedeWalls(HOUSE.boundary, HOUSE.heightAt, { eave: 1.5, rake: 1.0 }, (a, b) => Math.abs(a[1] + 23) < 0.5 && Math.abs(b[1] + 23) < 0.5); // skip facet I's gap eave
const DIMWALL = buildDiminishedEaveWall(-23, -11, 4, 1.5, HOUSE.heightAt, wallBottom); // compound wall: notch-G drop + free wall (to floor, extended ±18") + notch-B drop
const FASCIA = buildFascia(HOUSE.boundary, HOUSE.heightAt, 7.25 / 12, (a, b) => Math.abs(a[1] + 23) < 0.5 && Math.abs(b[1] + 23) < 0.5); // skip facet I's gap eave
const DIMFASCIA = buildDiminishedEaveFascia(-23, -11, 4, HOUSE.heightAt, firstBelow, 7.25 / 12); // step 2: continuous fascia along facet I's whole eave
const DIMSOFFIT = buildDiminishedEaveSoffit(-23, -11, 4, 1.5, HOUSE.heightAt, firstBelow, 7.25 / 12); // step 3: continuous soffit closing facet I's eave underside
// STEP 1a: extend each wing roof NORTH into the notch (z=-23 → DIMWALL at z=-21.5), sliding under facet I's raised eave
// tongue UVs use the wing plane's up-slope dir + tile=2.2 (the solver's default) so the shingle matches the main roof
const TONGUE_G = buildNotchTongueRoof(-23, -21.5, 1, 4, firstBelow, [1, 0], 2.2);    // SE wing G rises +x (plane 6 up=[1,0])
const TONGUE_B = buildNotchTongueRoof(-23, -21.5, -11, -8, firstBelow, [-1, 0], 2.2); // SW wing B rises -x (plane 10 up=[-1,0])
// STEP 1b: finish each tongue's exposed eave (fascia + soffit), extended 1.5 ft into the notch like the rest of the wing eave
const TONGUE_G_EAVE = buildNotchTongueEave(1, 1, -23, -21.5, firstBelow(1), 1.5, 7.25 / 12);   // wing G eave faces -x → recede +x
const TONGUE_B_EAVE = buildNotchTongueEave(-8, -1, -23, -21.5, firstBelow(-8), 1.5, 7.25 / 12); // wing B eave faces +x → recede -x
const SOFFIT = buildSoffit(HOUSE.boundary, HOUSE.heightAt, { eave: 1.5, rake: 1.0 }, 7.25 / 12, (a, b) => Math.abs(a[1] + 23) < 0.5 && Math.abs(b[1] + 23) < 0.5); // skip facet I's gap eave

// STAMP method: the procedural SKELETON lays the correct install (6 courses, 8" exposure, stagger, butt-shadow), and
// each shingle's face is STAMPED with a real patch cut from the Weathered Wood photo (granules + the multi-tone
// blend). The photo can't misbehave — it's clipped into shapes the skeleton placed. Normal (non-mirrored) tiling.
function makeStampedTile(img: HTMLImageElement) {
  const W = 1024,
    H = 1024,
    C = 6,
    ch = H / C,
    bev = 15,
    ss = 150; // size of the photo patch sampled per shingle
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#28241e";
  g.fillRect(0, 0, W, H);
  let s = 99173;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff), s / 0x7fffffff);
  const tabPath = (x: number, y: number, w: number, h: number) => {
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + w, y);
    g.lineTo(x + w, y + h - bev);
    g.lineTo(x + w - bev, y + h);
    g.lineTo(x + bev, y + h);
    g.lineTo(x, y + h - bev);
    g.closePath();
  };
  type Tab = { x: number; y: number; w: number; sx: number; sy: number };
  const courses: Tab[][] = [];
  for (let r = 0; r < C; r++) {
    const widths: number[] = [];
    let sum = 0;
    while (sum < W) {
      const w = 72 + rnd() * 118;
      widths.push(w);
      sum += w;
    }
    const kk = W / sum;
    let cx = rnd() * W; // per-course offset = the stagger
    const tabs: Tab[] = [];
    for (const wr of widths) {
      const w = wr * kk;
      // precompute the photo sample offset ONCE per shingle so all ±W wrap copies match
      tabs.push({ x: cx, y: r * ch, w, sx: rnd() * (img.width - ss), sy: rnd() * (img.height - ss) });
      cx += w;
    }
    courses.push(tabs);
  }
  // PASS 1 — stamp a real photo patch into each shingle's clipped shape (wrapped ±W → seamless tiling)
  for (const tabs of courses)
    for (const t of tabs)
      for (const dx of [-W, 0, W]) {
        const x = t.x + dx;
        if (x > W || x + t.w < 0) continue;
        g.save();
        tabPath(x + 4, t.y, t.w - 4, ch);
        g.clip();
        g.drawImage(img, t.sx, t.sy, ss, ss, x + 4, t.y, t.w - 4, ch);
        const grd = g.createLinearGradient(0, t.y, 0, t.y + ch); // subtle lit-top / shaded butt
        grd.addColorStop(0, "rgba(255,255,255,0.08)");
        grd.addColorStop(0.55, "rgba(0,0,0,0)");
        grd.addColorStop(1, "rgba(0,0,0,0.12)");
        g.fillStyle = grd;
        g.fillRect(x, t.y, t.w, ch);
        g.restore();
      }
  // PASS 2 — keyway shadows + the butt shadow ALWAYS at each course's down-slope (bottom) edge
  for (let r = 0; r < C; r++) {
    const yBot = r * ch + ch,
      last = r === C - 1;
    for (const t of courses[r])
      for (const dx of [-W, 0, W]) {
        const x = t.x + dx;
        if (x > W || x + t.w < 0) continue;
        const kg = g.createLinearGradient(x, 0, x + 13, 0);
        kg.addColorStop(0, "rgba(14,12,9,0.7)");
        kg.addColorStop(1, "rgba(14,12,9,0)");
        g.fillStyle = kg;
        g.fillRect(x, r * ch, 13, ch);
      }
    g.fillStyle = "rgba(16,13,10,0.88)"; // exposed lower-layer edge (the double-layer)
    g.fillRect(0, yBot - 6, W, 6);
    if (!last) {
      const sg = g.createLinearGradient(0, yBot, 0, yBot + 16);
      sg.addColorStop(0, "rgba(10,8,6,0.55)");
      sg.addColorStop(1, "rgba(10,8,6,0)");
      g.fillStyle = sg;
      g.fillRect(0, yBot, W, 16);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; // NOT mirrored → never upside-down
  tex.repeat.set(0.55, 0.66); // x→36" shingles, y→8" courses on the 8/12 slope (6-course tile)
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ATOM CONSTRUCTION: the real single shingle (its exposed tab band) is the atom; butt copies into courses, stack at
// 8" exposure with the manual's 4-1/2" stagger (8 courses → stagger wraps a full 36" = seamless vertical tile), with
// random horizontal flips (periodic per tile width) so the one atom doesn't visibly repeat. Real texture + true layout.
function makeAtomTile(band: HTMLImageElement) {
  const PPI = 16;
  const shW = 36 * PPI, // shingle width 36"
    exp = 8 * PPI, // the band IS exactly the 8" exposure now → courses stack ADJACENT (no overlap)
    stagger = 4.5 * PPI, // single-column offset 4-1/2"
    C = 8, // 8 courses → 8 × 4.5" = 36" = one shingle width → stagger wraps (seamless vertical tile)
    acrossN = 4;
  const W = shW * acrossN,
    H = exp * C;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#15110e";
  g.fillRect(0, 0, W, H);
  let s = 4451;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff), s / 0x7fffffff);
  for (let r = C - 1; r >= 0; r--) {
    const y = r * exp;
    const courseOff = (r * stagger) % shW;
    const flips: boolean[] = [];
    for (let k = 0; k < acrossN; k++) flips.push(rnd() < 0.5);
    // butt each real shingle into the course — exactly shW wide × exp tall, edge-to-edge
    for (let slot = -1; slot <= acrossN; slot++) {
      const x = slot * shW + courseOff;
      g.save();
      g.translate(x, y);
      if (flips[((slot % acrossN) + acrossN) % acrossN]) {
        g.translate(shW, 0);
        g.scale(-1, 1);
      }
      g.drawImage(band, 0, 0, band.width, band.height, 0, 0, shW, exp);
      g.restore();
    }
    // keyway shadow at every shingle butt-joint → the seam reads as a normal keyway (staggered course-to-course)
    for (let slot = -1; slot <= acrossN; slot++) {
      const xj = slot * shW + courseOff;
      const kg = g.createLinearGradient(xj - 7, 0, xj + 7, 0);
      kg.addColorStop(0, "rgba(10,8,6,0)");
      kg.addColorStop(0.5, "rgba(7,5,4,0.66)");
      kg.addColorStop(1, "rgba(10,8,6,0)");
      g.fillStyle = kg;
      g.fillRect(xj - 7, y, 14, exp);
    }
    // butt shadow line at the course's down-slope (bottom) edge; wrapped for seamless vertical tiling
    for (const yb of [y + exp, y + exp - H]) {
      g.fillStyle = "rgba(12,9,7,0.55)";
      g.fillRect(0, yb - 4, W, 4);
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.183, 0.495); // 8" courses on the 8/12 slope (≈41 courses up the main slope)
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Roof() {
  const method = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("m") : null;
  const [photo, band, tile] = useTexture(["/shingle-wewo.jpg", "/shingle-atomband.jpg", "/shingle-wewo-tile.jpg"]);
  const tex = useMemo(() => {
    if (method === "stamp") return makeStampedTile(photo.image as HTMLImageElement); // ?m=stamp
    if (method === "atom") return makeAtomTile(band.image as HTMLImageElement); // ?m=atom
    // DEFAULT: TILE — the sample board MINUS the bottom clipped row, normal (non-mirrored) RepeatWrapping.
    const t = tile.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.53, 1.0); // board-minus-bottom-row → ~8" exposure on the 8/12 slope
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [photo, band, tile, method]);
  return (
    <group>
      <mesh geometry={HOUSE.roof} castShadow receiveShadow>
        <meshStandardMaterial map={tex} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* receded walls: eaves 18" / rakes 12" */}
      <mesh geometry={RECEDED} castShadow receiveShadow>
        <meshStandardMaterial color="#aa9e85" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* fascia: 1×8 board (7.25" drop) hung off the whole roof edge */}
      <mesh geometry={FASCIA} castShadow receiveShadow>
        <meshStandardMaterial color="#ece9e2" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* soffit: closes the underside back to the receded wall (eaves flat, rakes follow the slope) */}
      <mesh geometry={SOFFIT} receiveShadow>
        <meshStandardMaterial color="#e6e3db" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* the UNIFIED facet-I-eave wall (verified) — one wall, receded, drops to first surface */}
      <mesh geometry={DIMWALL} castShadow receiveShadow>
        <meshStandardMaterial color="#aa9e85" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {/* STEP 2: continuous fascia along facet I's whole eave (no break at the notch) */}
      <mesh geometry={DIMFASCIA} castShadow receiveShadow>
        <meshStandardMaterial color="#ece9e2" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* STEP 3: continuous soffit closing facet I's eave underside */}
      <mesh geometry={DIMSOFFIT} receiveShadow>
        <meshStandardMaterial color="#e6e3db" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      {/* STEP 1a: wing-roof tongues extended into the notch — shingled like the rest of the wing roof */}
      <mesh geometry={TONGUE_G} castShadow receiveShadow>
        <meshStandardMaterial map={tex} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={TONGUE_B} castShadow receiveShadow>
        <meshStandardMaterial map={tex} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* STEP 1b: each tongue's eave fascia + soffit (cream, like the rest of the fascia/soffit) */}
      <mesh geometry={TONGUE_G_EAVE} castShadow receiveShadow>
        <meshStandardMaterial color="#ece9e2" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={TONGUE_B_EAVE} castShadow receiveShadow>
        <meshStandardMaterial color="#ece9e2" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

type V3 = [number, number, number];

// FOLDED-SADDLE cap line-model — ported from /captest. Each cap tab is folded over the crease into a saddle, dragged
// down over the one below (the headlap hides the lower cap's top-edge shadow), color-mixed across 4 cap-tab images → 4
// geometries. Vector base→top runs LOW→HIGH so the clipped base + shadow sit at the eave end of every hip.
const NT = 4;
const SHADOW_FRAC = 0.06; // ~29px substrate shadow as a fraction of tab height (reserved for closure/corner caps)
const capNf = (p: V3): V3 => {
  const l = Math.hypot(p[0], p[1], p[2]) || 1;
  return [p[0] / l, p[1] / l, p[2] / l];
};
const capCross = (p: V3, q: V3): V3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
const capAdd = (p: V3, t: V3, a: number): V3 => [p[0] + t[0] * a, p[1] + t[1] * a, p[2] + t[2] * a];
const capDown = (t: V3): V3 => (t[1] > 0 ? [-t[0], -t[1], -t[2]] : t); // force a tangent to point DOWN-slope

type CreaseCaps = { mid: V3; len: number; geoms: THREE.BufferGeometry[] };
// build caps PER hip/ridge line, so each line can be tinted + labeled independently for the brightness eyeball test.
function buildCapGeomsByCrease(): CreaseCaps[] {
  const expo = 0.67,
    ov = 0.0625,
    drape = 0.42,
    lift = 0.09,
    drop = 0.05,
    upTilt = 0.0; // each cap half shades like the slope it sits on (color match)
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff), seed / 0x7fffffff);
  const lerpN = (a: V3, b: V3, t: number): V3 => capNf([a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t]);
  const out: CreaseCaps[] = [];
  for (const seg of HOUSE.creases) {
    const s = seg.a[1] <= seg.b[1] ? seg : { a: seg.b, b: seg.a, n1: seg.n1, n2: seg.n2 }; // base = LOW end (eave)
    const dv: V3 = [s.b[0] - s.a[0], s.b[1] - s.a[1], s.b[2] - s.a[2]];
    const len = Math.hypot(dv[0], dv[1], dv[2]);
    if (len < 0.3) continue;
    const d = capNf(dv);
    const nb = capNf([s.n1[0] + s.n2[0], s.n1[1] + s.n2[1], s.n1[2] + s.n2[2]]);
    const t1 = capDown(capNf(capCross(s.n1, d))), t2 = capDown(capNf(capCross(s.n2, d)));
    const nH1 = lerpN(s.n1, nb, upTilt), nH2 = lerpN(s.n2, nb, upTilt);
    const stepE = expo - ov, n = Math.max(1, Math.round(len / stepE));
    const fp = (ss: number, lz: number): V3 => [s.a[0] + d[0] * ss + nb[0] * lz, s.a[1] + d[1] * ss + nb[1] * lz, s.a[2] + d[2] * ss + nb[2] * lz];
    const P: number[][] = Array.from({ length: NT }, () => []);
    const U: number[][] = Array.from({ length: NT }, () => []);
    const Nrm: number[][] = Array.from({ length: NT }, () => []);
    const tri = (k: number, p: V3, u: number, w: number, nr: V3) => { P[k].push(p[0], p[1], p[2]); U[k].push(u, w); Nrm[k].push(nr[0], nr[1], nr[2]); };
    const piece = (k: number, f0: V3, f1: V3, vB: number, vT: number) => {
      const o1a = capAdd(f0, t1, drape), o1b = capAdd(f1, t1, drape), o2a = capAdd(f0, t2, drape), o2b = capAdd(f1, t2, drape);
      tri(k, o1a, 0, vB, nH1); tri(k, o1b, 0, vT, nH1); tri(k, f1, 0.5, vT, nH1);
      tri(k, o1a, 0, vB, nH1); tri(k, f1, 0.5, vT, nH1); tri(k, f0, 0.5, vB, nH1);
      tri(k, f0, 0.5, vB, nH2); tri(k, f1, 0.5, vT, nH2); tri(k, o2b, 1, vT, nH2);
      tri(k, f0, 0.5, vB, nH2); tri(k, o2b, 1, vT, nH2); tri(k, o2a, 1, vB, nH2);
    };
    // Z-ORDER: lift each piece by an altitude weighted toward the crease's FAR end, so at a hip↔ridge meet the cap
    // whose line runs toward higher elevation sits ON TOP (uphill caps over downhill). yA = low end a, yB = high end b.
    const yA = s.a[1], yB = s.b[1], ZK = 0.005, eaveY = HOUSE.eaveY;
    for (let i = 0; i < n; i++) {
      const ss0 = i * stepE, ss1 = Math.min(i * stepE + expo, len);
      const eL0 = ZK * ((yA * ss0 + yB * (len - ss0)) / len - eaveY), eL1 = ZK * ((yA * ss1 + yB * (len - ss1)) / len - eaveY);
      const f0 = fp(ss0, lift + drop + eL0), f1 = fp(ss1, lift + eL1);
      piece((rnd() * NT) | 0, f0, f1, 1, 0);
    }
    const geoms = P.map((p, k) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(U[k], 2));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(Nrm[k], 3));
      return g;
    });
    out.push({ mid: [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2 + 0.4, (s.a[2] + s.b[2]) / 2], len, geoms });
  }
  return out;
}
const CREASE_CAPS = buildCapGeomsByCrease();
// brightness LOCKED: cap-tab avg (~102) leveled to the field tile (~137) = ×1.34 base, then Antonio picked +33% on top.
const CAP_BASE = 1.34;
const CAP_LOCK = 1.33; // Antonio's pick — caps read even with the field under flat at this level
const CAP_LEVEL = CAP_BASE * CAP_LOCK; // ≈ 1.78, the single over-bright multiplier on the cap albedo
const capIndex = (i: number) => (i < 26 ? String.fromCharCode(97 + i) : String.fromCharCode(97 + (i % 26)) + Math.floor(i / 26));
function Caps() {
  const label = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("label") === "1"; // ?label=1: index each hip/ridge line a–z so gaps can be called out
  const tabs = useTexture(["/cap-tab1.jpg", "/cap-tab2.jpg", "/cap-tab3.jpg", "/cap-tab4.jpg"]);
  useMemo(
    () =>
      tabs.forEach((t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        t.flipY = false; // image-bottom (clipped base + shadow) → v1 → eave end
        t.needsUpdate = true;
      }),
    [tabs],
  );
  const capColor = useMemo(() => new THREE.Color(CAP_LEVEL, CAP_LEVEL, CAP_LEVEL), []);
  return (
    <group>
      {CREASE_CAPS.map((cc, ci) => (
        <group key={ci}>
          {cc.geoms.map((g, k) =>
            g.attributes.position.count > 0 ? (
              <mesh key={k} geometry={g} castShadow receiveShadow>
                <meshStandardMaterial map={tabs[k]} color={capColor} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
              </mesh>
            ) : null,
          )}
          {label && (
            <Html position={cc.mid} center zIndexRange={[100, 0]}>
              <div style={{ background: "rgba(15,15,18,0.9)", color: "#7fd4ff", font: "800 13px system-ui", padding: "1px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>{capIndex(ci)}</div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

export default function ShingleTest() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const cam = params.get("cam");
  // WORKING MODEL = FLAT (default): lighting/tonemapping/env stripped so caps + field render as pure albedo — the
  // matched model (caps over-bright to CAP_LEVEL = field tone). ?lit=1 previews the still-unbalanced lit roof.
  const flat = params.get("lit") !== "1";
  // ?tx,ty,tz: aim the camera at a world point (for inspecting a specific junction)
  const tx = parseFloat(params.get("tx") ?? ""), ty = parseFloat(params.get("ty") ?? ""), tz = parseFloat(params.get("tz") ?? "");
  const focus = !Number.isNaN(tx);
  const target: [number, number, number] = focus ? [tx, ty, tz] : [4, 13, -2];
  // ?cx,cy,cz: place the camera explicitly (full control, e.g. to look UP into a junction from below)
  const cx = parseFloat(params.get("cx") ?? ""), cy = parseFloat(params.get("cy") ?? ""), cz = parseFloat(params.get("cz") ?? "");
  const pos: [number, number, number] = !Number.isNaN(cx)
    ? [cx, cy, cz]
    : focus
    ? [tx + 5, ty + 22, tz + 6]
    : cam === "close" ? [30, 22, 26] : cam === "top" ? [5, 96, -2] : [62, 48, 72];
  return (
    <div style={{ height: "100vh", background: flat ? "#808080" : "#c9c3b6" }}>
      <Canvas
        shadows={!flat}
        camera={{ position: pos, fov: 42, near: 0.5, far: 2000 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, toneMapping: flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping, toneMappingExposure: flat ? 1 : 1.25 }}
      >
        <color attach="background" args={[flat ? "#808080" : "#cbc5b8"]} />
        {flat ? (
          <ambientLight intensity={Math.PI} />
        ) : (
          <>
            <ambientLight intensity={0.12} />
            <directionalLight
              position={[48, 66, 60]}
              intensity={2.4}
              color="#ffe7bd"
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.0004}
              shadow-normalBias={0.05}
              shadow-camera-left={-90}
              shadow-camera-right={90}
              shadow-camera-top={90}
              shadow-camera-bottom={-90}
              shadow-camera-near={1}
              shadow-camera-far={260}
            />
          </>
        )}
        <Suspense fallback={null}>
          {!flat && <Environment files="/sky-midday.hdr" background />}
          <Roof />
          <Caps />
        </Suspense>
        {!flat && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0, -2]} receiveShadow>
            <planeGeometry args={[600, 600]} />
            <meshStandardMaterial color="#8f9678" roughness={1} />
          </mesh>
        )}
        <OrbitControls target={target} />
      </Canvas>
      <VerifyHUD />
    </div>
  );
}
