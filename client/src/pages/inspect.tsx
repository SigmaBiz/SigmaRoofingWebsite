import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, ContactShadows, Line, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "wouter";
import { buildCrestridge, type Pt } from "@/lib/tr3/solver2";
import { RoofCaps } from "@/lib/tr3/caps";
import { makeLapSiding, SIDING_BOARDS_PER_TILE, makeBrick, BRICK_TILE_FT } from "@/lib/tr3/siding";
import { recedeWalls, buildFascia, buildSoffit, buildDiminishedEaveWall, buildDiminishedEaveFascia, buildDiminishedEaveSoffit, buildNotchTongueRoof, buildNotchTongueEave } from "@/lib/tr3/walls";

gsap.registerPlugin(ScrollTrigger);

// taller walls (≈9 ft) so the roof stands on a real house body, not a 2.6 ft parapet.
const HOUSE = buildCrestridge(9);
// ROOF FINISH (ported from /shingletest — the `walls.ts` system, retiring the uniform `overhang.ts`): recessed walls
// (eaves 18" / rakes 12") + dropped 1×8 fascia + soffit; facet I's diminished (raised) south eave is one unified
// drop-to-first-surface wall; and the NOTCH is closed by extending each wing roof into it as a TONGUE (roof + eave
// finish) and sliding the free wall to meet the wing wall. Walls keep the lap-siding UV (U = x+z, V = worldY); tongues
// reuse the solver's slope-aligned UV so the shingle stays continuous. Notch geom is Crestridge-specific (facet I south
// eave z=-23 raised dimI=2; wings G@x=1, B@x=-8). See ROOF-GEOMETRY-RULES.md (SURFACES+SEAMS, "prim-interface + U").
const firstBelow = (x: number): number => (x <= -8 ? 9 - (2 / 3) * (x + 8) : x >= 1 ? 9 + (2 / 3) * (x - 1) : 0);
const U_UNDER = 1.5, OVERLAP = 0.2; // 18" underhang + a small free-wall overlap so the inside corner closes with no sliver
const xG = 1 + U_UNDER + OVERLAP, xB = -8 - U_UNDER - OVERLAP;
const wallBottom = (x: number): number => (x > xB && x < xG ? 0 : firstBelow(x)); // free wall to floor, ±18" past each notch
const skipGapEave = (a: Pt, b: Pt) => Math.abs(a[1] + 23) < 0.5 && Math.abs(b[1] + 23) < 0.5; // facet I's exposed eave — built by the DIM* fns
// SOUTH-facing walls get light-brown BRICK veneer instead of siding (+ the facet-I eave wall). Classify each boundary
// edge by its OUTWARD normal — winding-independent: take an edge normal, flip it to whichever side points OUT of the footprint.
const inFootprint = (px: number, pz: number): boolean => {
  const poly = HOUSE.boundary;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if ((zi > pz) !== (zj > pz) && px < ((xj - xi) * (pz - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
};
const isSouthFacing = (a: Pt, b: Pt): boolean => {
  const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
  let nx = dz / l, nz = -dx / l;
  if (inFootprint(mx + 0.5 * nx, mz + 0.5 * nz)) { nx = -nx; nz = -nz; } // flip to the OUTWARD normal
  return nz < -0.5; // outward normal points SOUTH (−z)
};
const RECEDED_SIDING = recedeWalls(HOUSE.boundary, HOUSE.heightAt, { eave: 1.5, rake: 1.0 }, (a, b) => skipGapEave(a, b) || isSouthFacing(a, b));
const RECEDED_BRICK = recedeWalls(HOUSE.boundary, HOUSE.heightAt, { eave: 1.5, rake: 1.0 }, (a, b) => skipGapEave(a, b) || !isSouthFacing(a, b));
const DIMWALL = buildDiminishedEaveWall(-23, -11, 4, 1.5, HOUSE.heightAt, wallBottom);
const FASCIA = buildFascia(HOUSE.boundary, HOUSE.heightAt, 7.25 / 12, skipGapEave);
const DIMFASCIA = buildDiminishedEaveFascia(-23, -11, 4, HOUSE.heightAt, firstBelow, 7.25 / 12);
const SOFFIT = buildSoffit(HOUSE.boundary, HOUSE.heightAt, { eave: 1.5, rake: 1.0 }, 7.25 / 12, skipGapEave);
const DIMSOFFIT = buildDiminishedEaveSoffit(-23, -11, 4, 1.5, HOUSE.heightAt, firstBelow, 7.25 / 12);
const TONGUE_G = buildNotchTongueRoof(-23, -21.5, 1, 4, firstBelow, [1, 0], 2.2);
const TONGUE_B = buildNotchTongueRoof(-23, -21.5, -11, -8, firstBelow, [-1, 0], 2.2);
const TONGUE_G_EAVE = buildNotchTongueEave(1, 1, -23, -21.5, firstBelow(1), 1.5, 7.25 / 12);
const TONGUE_B_EAVE = buildNotchTongueEave(-8, -1, -23, -21.5, firstBelow(-8), 1.5, 7.25 / 12);

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const DISPLAY = { fontFamily: "'Cormorant Garamond', serif" } as const;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// editorial palette
const PAL = { roof: "#565c66", wall: "#d8d1c1", trim: "#2c2d33", glass: "#2f3a45", door: "#6b5036", chalk: "#f3f5f2" };

// ---- procedural textures (storm-authority environment) ----
// GAF Grand Manor "Gatehouse Slate": clipped-corner tabs, random widths, deep shadow lines (laminated
// depth), multi-tone slate blend, granular tooth. Returns a color map + a bump map (for real catch-light).
function makeGrandManor() {
  const W = 1024,
    H = 1024;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  };
  const cMap = mk(),
    cBump = mk();
  const g = cMap.getContext("2d")!,
    b = cBump.getContext("2d")!;
  g.fillStyle = "#26261f"; // deep base shows through keyways + clipped corners
  g.fillRect(0, 0, W, H);
  b.fillStyle = "#171717";
  b.fillRect(0, 0, W, H);
  let s = 20260605;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff), s / 0x7fffffff);
  const pal = ["#a7a499", "#97958a", "#888f7c", "#9a8f7e", "#8a7c6b", "#7e8690", "#8e8c82", "#7f836d", "#948a7c", "#727169"];
  const ch = 82,
    bev = 12,
    gap = 3;
  const nC = Math.ceil(H / ch) + 1;
  const tabPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - bev);
    ctx.lineTo(x + w - bev, y + h);
    ctx.lineTo(x + bev, y + h);
    ctx.lineTo(x, y + h - bev);
    ctx.closePath();
  };
  const lerpHex = (hex: string, to: string, t: number) => "#" + new THREE.Color(hex).lerp(new THREE.Color(to), t).getHexString();

  // lay out tabs: per course, random widths normalized to W (tiles), random offset (keyways don't align)
  const tabs: { x: number; y: number; w: number; base: string }[] = [];
  for (let r = 0; r <= nC; r++) {
    const widths: number[] = [];
    let sum = 0;
    while (sum < W) {
      const w = 80 + rnd() * 120;
      widths.push(w);
      sum += w;
    }
    const kk = W / sum;
    let cx = rnd() * W;
    for (const wr of widths) {
      const w = wr * kk;
      tabs.push({ x: cx, y: r * ch + (rnd() - 0.5) * 5, w, base: pal[(rnd() * pal.length) | 0] });
      cx += w;
    }
  }
  // PASS 1 — tabs (color + bump), drawn wrapped at ±W for seamless tiling
  for (const t of tabs)
    for (const dx of [-W, 0, W]) {
      const x = t.x + dx;
      if (x > W || x + t.w < 0) continue;
      const grd = g.createLinearGradient(0, t.y, 0, t.y + ch);
      grd.addColorStop(0, lerpHex(t.base, "#ffffff", 0.12));
      grd.addColorStop(1, lerpHex(t.base, "#000000", 0.13));
      g.fillStyle = grd;
      tabPath(g, x + gap, t.y, t.w - gap, ch);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.09)"; // lit top edge
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x + gap + 2, t.y + 1.2);
      g.lineTo(x + t.w - 2, t.y + 1.2);
      g.stroke();
      const bg = b.createLinearGradient(0, t.y, 0, t.y + ch);
      bg.addColorStop(0, "#cccccc");
      bg.addColorStop(1, "#8c8c8c");
      b.fillStyle = bg;
      tabPath(b, x + gap, t.y, t.w - gap, ch);
      b.fill();
    }
  // PASS 2 — shadows (keyway + butt drop-shadow) on top = the laminated depth
  for (const t of tabs)
    for (const dx of [-W, 0, W]) {
      const x = t.x + dx;
      if (x > W || x + t.w < 0) continue;
      const kg = g.createLinearGradient(x, 0, x + 11, 0);
      kg.addColorStop(0, "rgba(9,9,8,0.62)");
      kg.addColorStop(1, "rgba(9,9,8,0)");
      g.fillStyle = kg;
      g.fillRect(x, t.y, 11, ch);
      const sg = g.createLinearGradient(0, t.y + ch - 5, 0, t.y + ch + 13);
      sg.addColorStop(0, "rgba(7,7,6,0.62)");
      sg.addColorStop(1, "rgba(7,7,6,0)");
      g.fillStyle = sg;
      g.fillRect(x - 2, t.y + ch - 5, t.w + 4, 18);
      b.fillStyle = "#000000";
      b.fillRect(x, t.y + ch - 2, t.w, 5);
      b.fillStyle = "rgba(0,0,0,0.85)";
      b.fillRect(x, t.y, 3, ch);
    }
  // granular speckle (the asphalt tooth)
  const img = g.getImageData(0, 0, W, H),
    d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 24;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  const tex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.repeat.set(0.26, 0.26);
    return t;
  };
  const map = tex(cMap);
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, bump: tex(cBump) };
}
function makeGround() {
  const s = 512,
    c = document.createElement("canvas");
  c.width = c.height = s;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(s / 2, s / 2, 30, s / 2, s / 2, s * 0.62);
  g.addColorStop(0, "#525a4e");
  g.addColorStop(0.55, "#3c423a");
  g.addColorStop(1, "#2a2e29");
  x.fillStyle = g;
  x.fillRect(0, 0, s, s);
  for (let i = 0; i < 14000; i++) {
    x.fillStyle = `rgba(${Math.random() < 0.5 ? "255,255,255" : "0,0,0"},0.03)`;
    x.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const GROUND_TEX = makeGround();

// ---- hero facet = L (east, plane 1): the slope we lay the first test square on ----
const heroLabel = HOUSE.labels.find((l) => l.plane === 1)!;
const heroPlane = HOUSE.planes[1];
const HC: Pt = [heroLabel.pos[0], heroLabel.pos[2]]; // facet centroid (x,z)
const HUP: Pt = heroPlane.up; // up-slope direction in plan (unit)
const HX: Pt = [-HUP[1], HUP[0]]; // cross-slope (rot90)
const HN = heroPlane.nrm; // outward normal (3D)
// a point on the slope at (cross du, up-slope dv), lifted off the shingle by `off` along the normal
const onHero = (du: number, dv: number, off = 0.12): [number, number, number] => {
  const x = HC[0] + HX[0] * du + HUP[0] * dv;
  const z = HC[1] + HX[1] * du + HUP[1] * dv;
  const y = heroPlane.h(x, z);
  return [x + HN[0] * off, y + HN[1] * off, z + HN[2] * off];
};
const HITS: Pt[] = [[-2.6, 1.6], [0.9, -1.3], [2.7, 2.3]]; // 3 hail hits in (cross, up) coords

const H = heroLabel.pos;
const C: [number, number, number] = [4, 14, -2]; // house center-ish (orbit target)
// scroll keyframes: B0 orbit → B1 hook → B2 square → B3 close → B4 pullback → B5 overview
const KF = [
  { p: 0.0, pos: [34, 230, -66], up: [0, 1, 0], tgt: C }, // HELICOPTER — high, looking down
  { p: 0.045, pos: [86, 92, -6], up: [0, 1, 0], tgt: C }, // DROP IN — swoop down, roof grows
  { p: 0.07, pos: [99, 58, -2], up: [0, 1, 0], tgt: C }, // 360 start (E)
  { p: 0.095, pos: [51.5, 58, -84], up: [0, 1, 0], tgt: C }, // SE
  { p: 0.12, pos: [-43.5, 58, -84], up: [0, 1, 0], tgt: C }, // SW
  { p: 0.145, pos: [-91, 58, -2], up: [0, 1, 0], tgt: C }, // W
  { p: 0.17, pos: [-43.5, 58, 80], up: [0, 1, 0], tgt: C }, // NW
  { p: 0.195, pos: [51.5, 58, 80], up: [0, 1, 0], tgt: C }, // NE — 360 nearly closed
  { p: 0.22, pos: [H[0] + 50, H[1] + 30, H[2] + 20], up: [0, 1, 0], tgt: H }, // LAND on facet L
  { p: 0.34, pos: [H[0] + 36, H[1] + 22, H[2] + 13], up: [0, 1, 0], tgt: H }, // B1 hook (medium)
  { p: 0.48, pos: [H[0] + 27, H[1] + 17, H[2] + 10], up: [0, 1, 0], tgt: H }, // B2 over the square
  { p: 0.64, pos: [H[0] + 20, H[1] + 13, H[2] + 7], up: [0, 1, 0], tgt: H }, // B3 close (read parens)
  { p: 0.8, pos: [H[0] + 34, H[1] + 23, H[2] + 12], up: [0, 1, 0], tgt: H }, // B4 pull back
  { p: 1.0, pos: [8, 92, -2], up: [0, 0, 1], tgt: [4, 8, -2] }, // B5 rise to overview
] as const;

function CameraRig({ progress }: { progress: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  useFrame(() => {
    const p = clamp01(progress.current);
    let a = KF[0] as (typeof KF)[number];
    let b = KF[KF.length - 1] as (typeof KF)[number];
    for (let i = 0; i < KF.length - 1; i++) if (p >= KF[i].p && p <= KF[i + 1].p) ((a = KF[i]), (b = KF[i + 1]));
    const t = ease((p - a.p) / (b.p - a.p || 1));
    camera.position.set(lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t));
    camera.up.set(lerp(a.up[0], b.up[0], t), lerp(a.up[1], b.up[1], t), lerp(a.up[2], b.up[2], t)).normalize();
    camera.lookAt(lerp(a.tgt[0], b.tgt[0], t), lerp(a.tgt[1], b.tgt[1], t), lerp(a.tgt[2], b.tgt[2], t));
  });
  return null;
}

// ---- the house: roof + walls + openings, editorial style ----
function Openings() {
  const items = useMemo(() => {
    const b = HOUSE.boundary;
    const cx = b.reduce((s, p) => s + p[0], 0) / b.length;
    const cz = b.reduce((s, p) => s + p[1], 0) / b.length;
    const eY = HOUSE.eaveY;
    type O = { pos: [number, number, number]; rotY: number; w: number; h: number; door: boolean };
    const out: O[] = [];
    let maxLen = 0,
      maxIdx = 0;
    const edges = b.map((a, i) => {
      const c = b[(i + 1) % b.length];
      const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (L > maxLen) ((maxLen = L), (maxIdx = i));
      return { a, c, L };
    });
    edges.forEach((e, i) => {
      const { a, c, L } = e;
      if (L < 11 && i !== maxIdx) return;
      const dir: Pt = [(c[0] - a[0]) / L, (c[1] - a[1]) / L];
      let n: Pt = [-dir[1], dir[0]];
      const mx = (a[0] + c[0]) / 2,
        mz = (a[1] + c[1]) / 2;
      if ((mx + n[0] - cx) ** 2 + (mz + n[1] - cz) ** 2 < (mx - cx) ** 2 + (mz - cz) ** 2) n = [-n[0], -n[1]];
      const rotY = Math.atan2(n[0], n[1]);
      if (i === maxIdx) out.push({ pos: [mx + n[0] * 0.1, eY * 0.42, mz + n[1] * 0.1], rotY, w: 3.6, h: eY * 0.82, door: true });
      const count = Math.max(1, Math.floor(L / 9));
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count;
        if (i === maxIdx && Math.abs(t - 0.5) < 0.2) continue; // leave room for the door
        const wx = a[0] + (c[0] - a[0]) * t,
          wz = a[1] + (c[1] - a[1]) * t;
        out.push({ pos: [wx + n[0] * 0.1, eY * 0.56, wz + n[1] * 0.1], rotY, w: 2.6, h: 3.0, door: false });
      }
    });
    return out;
  }, []);
  return (
    <>
      {items.map((o, i) => (
        <group key={i} position={o.pos} rotation={[0, o.rotY, 0]}>
          <mesh>
            <boxGeometry args={[o.w, o.h, 0.2]} />
            <meshStandardMaterial color={PAL.trim} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[o.w * 0.78, o.h * 0.82, 0.18]} />
            <meshStandardMaterial color={o.door ? PAL.door : PAL.glass} roughness={o.door ? 0.7 : 0.2} metalness={o.door ? 0 : 0.15} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// gradient storm sky: deep navy top → slate → warm gold horizon (calm after the named-peril event)
function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color("#141a28") },
          mid: { value: new THREE.Color("#44566f") },
          horizon: { value: new THREE.Color("#aeaa98") },
          below: { value: new THREE.Color("#33372f") },
        },
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader:
          "varying vec3 vP; uniform vec3 top,mid,horizon,below; void main(){ float t = vP.y; vec3 c; if(t>0.0){ float u=clamp(t/0.6,0.0,1.0); c=mix(horizon,mid,smoothstep(0.0,0.12,u)); c=mix(c,top,smoothstep(0.22,1.0,u)); } else { c=mix(horizon,below,smoothstep(0.0,0.4,-t)); } gl_FragColor=vec4(c,1.0); }",
      }),
    [],
  );
  return (
    <mesh>
      <sphereGeometry args={[640, 32, 16]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function House() {
  // field shingle = the matched Weathered Wood tile (the /shingletest roof Antonio finished). The legacy Gatehouse
  // Slate generator `makeGrandManor` is still defined above if we switch the palette back.
  const tile = useTexture("/shingle-wewo-tile.jpg");
  const field = useMemo(() => {
    const t = tile.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.53, 1.0); // 36" shingles × 8" courses on the 8/12 slope
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [tile]);
  // clean painted lap siding — Antonio's pick from /sidingtest: light gray, 8" reveal, soft shadow
  const siding = useMemo(() => {
    const t = makeLapSiding("#e8e6e0", 0.2);
    const tileFt = SIDING_BOARDS_PER_TILE * (8 / 12); // 12 boards × 8" = 8 ft per texture tile
    t.repeat.set(1 / tileFt, 1 / tileFt); // walls UV'd in world ft (U = x+z, V = worldY) ⇒ level 8" boards, wrap corners
    return t;
  }, []);
  // light-brown brick veneer for the south-facing walls + the facet-I eave wall (same wall UV ⇒ level courses)
  const brick = useMemo(() => {
    const t = makeBrick("#bb9a6a", "#cfc7b6");
    t.repeat.set(1 / BRICK_TILE_FT[0], 1 / BRICK_TILE_FT[1]);
    return t;
  }, []);
  return (
    <group>
      <mesh geometry={HOUSE.roof} castShadow receiveShadow>
        <meshStandardMaterial map={field} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* clean lap siding on the non-south recessed walls (set back under the overhang) */}
      <mesh geometry={RECEDED_SIDING} castShadow receiveShadow>
        <meshStandardMaterial map={siding} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* light-brown brick veneer on the SOUTH-facing walls + the facet-I eave wall (Antonio's pick) */}
      <mesh geometry={RECEDED_BRICK} castShadow receiveShadow>
        <meshStandardMaterial map={brick} roughness={0.96} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={DIMWALL} castShadow receiveShadow>
        <meshStandardMaterial map={brick} roughness={0.96} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* wing-roof tongues extended into the notch — shingled, continuous with the main roof (solver-matched UV) */}
      <mesh geometry={TONGUE_G} castShadow receiveShadow>
        <meshStandardMaterial map={field} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={TONGUE_B} castShadow receiveShadow>
        <meshStandardMaterial map={field} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* fascia: 1×8 off the whole roof edge + facet I's continuous eave fascia + each tongue's eave fascia/soffit */}
      <mesh geometry={FASCIA} castShadow receiveShadow>
        <meshStandardMaterial color="#ece9e2" roughness={0.7} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={DIMFASCIA} castShadow receiveShadow>
        <meshStandardMaterial color="#ece9e2" roughness={0.7} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={TONGUE_G_EAVE} castShadow receiveShadow>
        <meshStandardMaterial color="#ece9e2" roughness={0.8} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={TONGUE_B_EAVE} castShadow receiveShadow>
        <meshStandardMaterial color="#ece9e2" roughness={0.8} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* soffit: the eave/rake underhang underside + facet I's continuous eave soffit (a hair darker, faces down) */}
      <mesh geometry={SOFFIT} receiveShadow>
        <meshStandardMaterial color="#e6e3db" roughness={0.85} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={DIMSOFFIT} receiveShadow>
        <meshStandardMaterial color="#e6e3db" roughness={0.85} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <RoofCaps creases={HOUSE.creases} eaveY={HOUSE.eaveY} />
    </group>
  );
}

// ---- chalk test square (4 corner brackets) on the hero facet ----
function TestSquare({ op, ctr = [0, 0] as Pt }: { op: number; ctr?: Pt }) {
  if (op <= 0.001) return null;
  const S = 5,
    arm = 1.8;
  const corners: Pt[] = [[-S, -S], [S, -S], [S, S], [-S, S]];
  return (
    <group>
      {corners.map(([du, dv], i) => {
        const sx = Math.sign(du),
          sz = Math.sign(dv);
        const a = onHero(ctr[0] + du, ctr[1] + dv);
        const b1 = onHero(ctr[0] + du - sx * arm, ctr[1] + dv);
        const b2 = onHero(ctr[0] + du, ctr[1] + dv - sz * arm);
        return (
          <group key={i}>
            <Line points={[b1, a]} color={PAL.chalk} lineWidth={2.6} transparent opacity={op} />
            <Line points={[a, b2]} color={PAL.chalk} lineWidth={2.6} transparent opacity={op} />
          </group>
        );
      })}
    </group>
  );
}

// ---- a single hail hit: "( · )" chalk parentheses around a dark mark ----
function paren(du: number, dv: number, side: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let k = 0; k <= 8; k++) {
    const a = -0.7 + (1.4 * k) / 8;
    pts.push(onHero(du + side * 0.95 + side * 0.45 * Math.cos(a), dv + 1.05 * Math.sin(a)));
  }
  return pts;
}
function HailMark({ at, op }: { at: Pt; op: number }) {
  if (op <= 0.001) return null;
  return (
    <group>
      <Line points={paren(at[0], at[1], -1)} color={PAL.chalk} lineWidth={2.4} transparent opacity={op} />
      <Line points={paren(at[0], at[1], 1)} color={PAL.chalk} lineWidth={2.4} transparent opacity={op} />
      <mesh position={onHero(at[0], at[1], 0.18)}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} transparent opacity={op} />
      </mesh>
    </group>
  );
}

// the marks layer, driven by the (quantized) scroll value
function Marks({ p }: { p: number }) {
  const sq = clamp01((p - 0.34) / 0.12); // B2 draw-on
  const h1 = clamp01((p - 0.5) / 0.05),
    h2 = clamp01((p - 0.57) / 0.05),
    h3 = clamp01((p - 0.64) / 0.05); // B3 stagger
  const visible = p > 0.32; // square + hits persist through B4/B5
  if (!visible) return null;
  return (
    <group>
      <TestSquare op={sq} />
      <HailMark at={HITS[0]} op={h1} />
      <HailMark at={HITS[1]} op={h2} />
      <HailMark at={HITS[2]} op={h3} />
      {p > 0.7 && (
        <Html position={onHero(0, -S2, 0.3)} center zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div style={{ ...MONO, whiteSpace: "nowrap", color: "#1c1c1c", fontSize: 13, fontWeight: 700, background: "rgba(238,240,238,0.92)", padding: "4px 10px", borderRadius: 3, border: "1px solid #2a2a2a" }}>3 / 8 HITS · QUALIFIES ✓</div>
        </Html>
      )}
    </group>
  );
}
const S2 = 7; // count-stamp drop below square

// B5: the same square populated (faintly) on the other main slopes
function PopulatedSquares({ op }: { op: number }) {
  const facets = useMemo(() => HOUSE.labels.filter((l) => [0, 2, 3].includes(l.plane)), []); // K, F, I
  if (op <= 0.001) return null;
  return (
    <>
      {facets.map((f, i) => {
        const pl = HOUSE.planes[f.plane];
        const up = pl.up,
          cx2 = [-up[1], up[0]] as Pt,
          nrm = pl.nrm;
        const at = (du: number, dv: number): [number, number, number] => {
          const x = f.pos[0] + cx2[0] * du + up[0] * dv,
            z = f.pos[2] + cx2[1] * du + up[1] * dv;
          return [x + nrm[0] * 0.12, pl.h(x, z) + nrm[1] * 0.12, z + nrm[2] * 0.12];
        };
        const S = 4,
          arm = 1.5;
        const corners: Pt[] = [[-S, -S], [S, -S], [S, S], [-S, S]];
        return (
          <group key={i}>
            {corners.map(([du, dv], j) => {
              const sx = Math.sign(du),
                sz = Math.sign(dv);
              return (
                <group key={j}>
                  <Line points={[at(du - sx * arm, dv), at(du, dv)]} color={PAL.chalk} lineWidth={2.2} transparent opacity={op} />
                  <Line points={[at(du, dv - sz * arm), at(du, dv)]} color={PAL.chalk} lineWidth={2.2} transparent opacity={op} />
                </group>
              );
            })}
          </group>
        );
      })}
    </>
  );
}

// ---- DOM text capsules, one per beat (external/scrub-driven) ----
const CLOUDS = [
  { r: [0.0, 0.2], tag: "19428 Crestridge Dr · Edmond OK", body: "This is your roof. From the street it looks **completely fine**.", gate: false },
  { r: [0.2, 0.32], tag: "The hook", body: "So the only time you'd act is when it actually fails — **or else you would**.", gate: false },
  { r: [0.32, 0.48], tag: "The instrument", body: "We start with the **test square** — the same 10×10 **HAAG standard** your insurer uses.", gate: false },
  { r: [0.48, 0.7], tag: "Authority — HAAG", body: "**Three confirmed strikes**, each marked to standard. Not a few dents — the one tool that **turns the table** in your favor.", gate: false },
  { r: [0.7, 0.85], tag: "The real MVP", body: "The leverage isn't the damage — it's the **documented event**: a **named peril** hit your roof, dated and on the record.", gate: true },
  { r: [0.85, 1.0], tag: "Now that you know", body: "**The clock started** the day it hailed. So — what will you do about it?", gate: false },
] as const;
// render body text with **phrase** highlighted (Pudding-style key-phrase marks)
function HiText({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((s, i) =>
        i % 2 === 1 ? (
          <mark key={i} style={{ background: "#dca94e", color: "#241a0e", padding: "0 5px", borderRadius: 3 }}>
            {s}
          </mark>
        ) : (
          <span key={i}>{s}</span>
        ),
      )}
    </>
  );
}

export default function Inspect() {
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [prog, setProg] = useState(0);
  // FLAT working bed: tonemapping + sky/fog + stylized lights stripped → pure albedo (envelope effects are kept SEPARATE
  // from the DWELLING; we add them back as their own pass). ?lit=1 previews the stylized lighting.
  const flat = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("lit") !== "1" : true;

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ".ins",
        start: "top top",
        end: "bottom bottom",
        pin: ".ins-stage",
        scrub: true,
        onUpdate: (self) => {
          progress.current = self.progress;
          const q = Math.round(self.progress * 240) / 240;
          setProg((v) => (v === q ? v : q));
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="bg-[#d9d3c7] text-[#1f1f22]">
      <Link href="/" className="fixed left-5 top-5 z-50 text-sm font-semibold text-[#1f1f22]/55 transition-colors hover:text-[#1f1f22]">← Back</Link>

      <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p style={MONO} className="text-[11px] uppercase tracking-[0.35em] text-[#8a6a52]">The Inspection — Phase 1 of 3</p>
        <h1 style={DISPLAY} className="mt-6 text-balance text-6xl font-light tracking-tight md:text-8xl">It looks fine.<br />That's not the question.</h1>
        <p style={MONO} className="mt-8 text-[11px] uppercase tracking-[0.3em] text-[#1f1f22]/45">scroll to inspect ↓</p>
      </section>

      <section className="ins relative h-[640vh]">
        <div className="ins-stage sticky top-0 h-screen overflow-hidden">
          <Canvas camera={{ position: [34, 60, -82], fov: 40, near: 0.5, far: 2200 }} dpr={[1, 1.75]} gl={{ antialias: true, toneMapping: flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping, toneMappingExposure: flat ? 1 : 1.25 }}>
            <color attach="background" args={[flat ? "#808080" : "#1b2230"]} />
            {flat && <ambientLight intensity={Math.PI} />}
            {!flat && <fog attach="fog" args={["#9ea6a4", 150, 500]} />}
            {!flat && <SkyDome />}
            {!flat && <hemisphereLight args={["#4a5c7e", "#71756b", 0.95]} />}
            {!flat && <ambientLight intensity={0.26} color="#e9eefc" />}
            {!flat && <directionalLight position={[-58, 60, 56]} intensity={1.45} color="#e1e8f3" />}
            {!flat && <directionalLight position={[64, 26, -48]} intensity={0.62} color="#ffc88f" />}
            <Suspense fallback={null}>
              <group>
                <House />
                <Marks p={prog} />
                <PopulatedSquares op={clamp01((prog - 0.86) / 0.08)} />
              </group>
            </Suspense>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0, -2]}>
              <planeGeometry args={[520, 520]} />
              <meshStandardMaterial map={GROUND_TEX} roughness={1} metalness={0} />
            </mesh>
            {!flat && <ContactShadows position={[0, 0.02, 0]} opacity={0.42} blur={2.8} scale={185} far={48} color="#161c28" />}
            <CameraRig progress={progress} />
          </Canvas>

          {/* text clouds — rise up through the scene as you scrub (Pudding-style); key phrases highlighted */}
          <div className="pointer-events-none absolute inset-0">
            {CLOUDS.map((c, i) => {
              if (prog < c.r[0] - 0.002 || prog > c.r[1] + 0.002) return null;
              const t = clamp01((prog - c.r[0]) / (c.r[1] - c.r[0]));
              const ty = lerp(34, -34, t); // rise: enter low → travel through center → exit high
              const op = clamp01(Math.min(t / 0.14, (1 - t) / 0.14, 1)); // fade only at the very ends
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-[min(36rem,86vw)] rounded-md border border-[#1f1f22]/12 bg-[#f4efe6]/92 px-7 py-6 shadow-[0_10px_36px_rgba(0,0,0,0.16)] backdrop-blur-sm"
                  style={{ opacity: op, transform: `translate(-50%,-50%) translateY(${ty}vh)` }}
                >
                  <div className="flex items-center gap-2">
                    <p style={MONO} className="text-[10px] uppercase tracking-[0.28em] text-[#8a6a52]">{c.tag}</p>
                    {c.gate && <span style={MONO} className="rounded-sm bg-[#b8702a]/15 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.15em] text-[#9a5a1e]">draft · legal review</span>}
                  </div>
                  <p style={DISPLAY} className="mt-2 text-[26px] font-light leading-snug text-[#1f1f22]">
                    <HiText text={c.body} />
                  </p>
                </div>
              );
            })}
          </div>

          {/* beat ticker */}
          <div className="pointer-events-none absolute right-6 top-1/2 flex -translate-y-1/2 flex-col gap-2">
            {["Establish", "Hook", "Square", "Hits", "Lien", "Now"].map((b, i) => {
              const center = [0.1, 0.26, 0.4, 0.59, 0.77, 0.92][i];
              const on = Math.abs(prog - center) < 0.09;
              return (
                <div key={b} className="flex items-center justify-end gap-2">
                  <span style={MONO} className={`text-[9px] uppercase tracking-[0.2em] transition-opacity ${on ? "text-[#1f1f22] opacity-100" : "text-[#1f1f22]/40 opacity-60"}`}>{b}</span>
                  <span className={`h-1.5 w-1.5 rounded-full transition-colors ${on ? "bg-[#8a6a52]" : "bg-[#1f1f22]/25"}`} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center">
        <h2 style={DISPLAY} className="text-balance text-5xl font-light md:text-6xl">Inspected. Documented. On the record.</h2>
        <p style={MONO} className="max-w-xl text-[11px] uppercase leading-relaxed tracking-[0.22em] text-[#1f1f22]/45">next: the adjustment — your approved scope, on this same roof</p>
      </section>
    </div>
  );
}
