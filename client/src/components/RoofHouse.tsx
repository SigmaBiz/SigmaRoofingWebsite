/**
 * RoofHouse.tsx — the DRESSED Crestridge house, extracted byte-exact from /housetest (the latest version: CC0 078 tan
 * stone VENEER on the SOUTH walls below the eave + lap-siding gable triangle above, 2-car garage + gable windows + a
 * detailed front door, shingle roof). Exports HOUSE (geometry) + <RoofHouse tileFt? flat? colorTint?> (colorTint tints the
 * shingle for the visualizer). The PAGE supplies the lighting — match /housetest exactly: NoToneMapping + ambient 2.2 +
 * one warm directional (shadows) + <Environment files="/sky-midday.hdr" background/> + a flat #8f9678 ground.
 * Assets: /veneer-*.jpg, /door-wood-*.jpg, /shingle-wewo-tile.jpg, /sky-midday.hdr (all in client/public).
 */
import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { buildCrestridge, type Pt } from "@/lib/tr3/solver2";
import { RoofCaps } from "@/lib/tr3/caps";
import { makeLapSiding, makeShakeSiding, SHAKE_TILE_FT, SIDING_BOARDS_PER_TILE } from "@/lib/tr3/siding";
import { recedeWalls, buildFascia, buildSoffit, buildDiminishedEaveWall, buildDiminishedEaveFascia, buildDiminishedEaveSoffit, buildNotchTongueRoof, buildNotchTongueEave } from "@/lib/tr3/walls";

export const HOUSE = buildCrestridge(9);
const firstBelow = (x: number): number => (x <= -8 ? 9 - (2 / 3) * (x + 8) : x >= 1 ? 9 + (2 / 3) * (x - 1) : 0);
const U_UNDER = 1.5, OVERLAP = 0.2;
const xG = 1 + U_UNDER + OVERLAP, xB = -8 - U_UNDER - OVERLAP;
const wallBottom = (x: number): number => (x > xB && x < xG ? 0 : firstBelow(x));
const skipGapEave = (a: Pt, b: Pt) => Math.abs(a[1] + 23) < 0.5 && Math.abs(b[1] + 23) < 0.5;
// SOUTH-facing edges get the stone veneer; classify by each edge's OUTWARD normal (flip toward whichever side is outside the footprint).
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
  if (inFootprint(mx + 0.5 * nx, mz + 0.5 * nz)) { nx = -nx; nz = -nz; }
  return nz < -0.5;
};
const WALLH = 9; // eave height — south walls wear STONE below it, a SIDING gable above (Antonio's call)
const skipForSiding = (a: Pt, b: Pt) => skipGapEave(a, b) || isSouthFacing(a, b); // build the NON-south walls
const skipForSouth = (a: Pt, b: Pt) => skipGapEave(a, b) || !isSouthFacing(a, b); // build the SOUTH walls
const RECEDED_SIDING = recedeWalls(HOUSE.boundary, HOUSE.heightAt, { eave: 1.5, rake: 1.0 }, skipForSiding);
const RECEDED_VENEER = recedeWalls(HOUSE.boundary, HOUSE.heightAt, { eave: 1.5, rake: 1.0 }, skipForSouth, { hi: WALLH }); // stone base, up to the eave
const GABLE_SIDING = recedeWalls(HOUSE.boundary, HOUSE.heightAt, { eave: 1.5, rake: 1.0 }, skipForSouth, { lo: WALLH }); // gable triangle above the eave → siding
const VENEER_NORMAL_SCALE = new THREE.Vector2(1, -1); // flip the normal map's green channel (ambientCG GL map reads inverted in three → craters; this makes the stones protrude)
const DIMWALL = buildDiminishedEaveWall(-23, -11, 4, 1.5, HOUSE.heightAt, wallBottom);
const FASCIA = buildFascia(HOUSE.boundary, HOUSE.heightAt, 7.25 / 12, skipGapEave);
const DIMFASCIA = buildDiminishedEaveFascia(-23, -11, 4, HOUSE.heightAt, firstBelow, 7.25 / 12);
const SOFFIT = buildSoffit(HOUSE.boundary, HOUSE.heightAt, { eave: 1.5, rake: 1.0 }, 7.25 / 12, skipGapEave);
const DIMSOFFIT = buildDiminishedEaveSoffit(-23, -11, 4, 1.5, HOUSE.heightAt, firstBelow, 7.25 / 12);
const TONGUE_G = buildNotchTongueRoof(-23, -21.5, 1, 4, firstBelow, [1, 0], 2.2);
const TONGUE_B = buildNotchTongueRoof(-23, -21.5, -11, -8, firstBelow, [-1, 0], 2.2);
const TONGUE_G_EAVE = buildNotchTongueEave(1, 1, -23, -21.5, firstBelow(1), 1.5, 7.25 / 12);
const TONGUE_B_EAVE = buildNotchTongueEave(-8, -1, -23, -21.5, firstBelow(-8), 1.5, 7.25 / 12);

// --- procedural openings: windows + a front door (composed primitives, placed PROUD of the south walls, facing −z) ---
const GLASS = "#2a3640", FRAME_BLACK = "#191b1e", SIDING_HEX = "#c2bca6"; // door/garage glass · satin-BLACK window frame · Savannah Wicker siding base (lap + shake)
const FASCIA_COLOR = "#3b3e42", SOFFIT_COLOR = FASCIA_COLOR, CASING = "#b7a98f"; // CHARCOAL eave trim (fascia + soffit + window casing + gable vent, all the same); warm-greige door casing
const DOOR_WOOD_NSCALE = new THREE.Vector2(1, -1); // ambientCG GL normal reads inverted in three → flip green channel
type Bar = { x: number; y: number; w: number; h: number };
function bars(els: Bar[], z: number, depth: number, color: string) {
  return els.map((b, i) => (
    <mesh key={i} position={[b.x, b.y, z]} castShadow>
      <boxGeometry args={[b.w, b.h, depth]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0} />
    </mesh>
  ));
}
function Glass({ x = 0, y = 0, z, w, h }: { x?: number; y?: number; z: number; w: number; h: number }) {
  return (
    <mesh position={[x, y, z]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial color={GLASS} metalness={0.4} roughness={0.06} envMapIntensity={1.5} side={THREE.DoubleSide} />
    </mesh>
  );
}
// DOUBLE-HUNG, Antonio's reference look: a satin-BLACK frame + sashes, 1-over-1 (just a top & bottom pane — no grille),
// REFLECTIVE glass, set in a flat WHITE casing with a projecting head cap. The black window reads recessed: the white
// casing sits proud of the wall, a black jamb liner forms the reveal, the black sashes sit at the back (upper proud of the
// lower so their join steps = the meeting rail). Built facing −z, proud of the wall; `rotY` turns it to the E/W/N elevations.
function DoubleHung({ position, w, h, rotY = 0 }: { position: [number, number, number]; w: number; h: number; rotY?: number }) {
  const sf = 0.13, cw = 0.3; // black sash stile/rail · white casing board width
  const zCaseF = -0.14; // white casing FRONT (proud of the wall)
  const zUp = -0.06, zLo = -0.035, dSash = 0.05; // black sashes: upper (outer/proud) + lower (inner/set-back)
  const zUpG = -0.045, zLoG = -0.02; // reflective glass behind each sash
  const halfH = h / 2;
  // one black sash = 4 stiles/rails (1-over-1: NO grille muntins), within x∈[−w/2,w/2] × y∈[y0,y1]
  const sash = (y0: number, y1: number): Bar[] => {
    const H = y1 - y0, cy = (y0 + y1) / 2;
    return [
      { x: -(w / 2 - sf / 2), y: cy, w: sf, h: H }, // left stile
      { x: w / 2 - sf / 2, y: cy, w: sf, h: H }, // right stile
      { x: 0, y: y1 - sf / 2, w, h: sf }, // top rail
      { x: 0, y: y0 + sf / 2, w, h: sf }, // bottom rail (the join = the meeting rail)
    ];
  };
  // flat white casing: 4 equal boards on the wall surface
  const casing: Bar[] = [
    { x: 0, y: halfH + cw / 2, w: w + 2 * cw, h: cw }, // head
    { x: 0, y: -halfH - cw / 2, w: w + 2 * cw, h: cw }, // bottom
    { x: -(w / 2 + cw / 2), y: 0, w: cw, h }, // left jamb
    { x: w / 2 + cw / 2, y: 0, w: cw, h }, // right jamb
  ];
  // black jamb liner = the recess reveal (one thin box per edge, spanning casing-front → sashes)
  const liner = (k: string, px: number, py: number, bw: number, bh: number) => (
    <mesh key={k} position={[px, py, (zCaseF + zUp) / 2]}><boxGeometry args={[bw, bh, zUp - zCaseF]} /><meshStandardMaterial color={FRAME_BLACK} roughness={0.5} metalness={0.2} /></mesh>
  );
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* dark interior backer */}
      <mesh position={[0, 0, -0.005]}><planeGeometry args={[w, h]} /><meshStandardMaterial color="#0b0d0f" roughness={1} side={THREE.DoubleSide} /></mesh>
      {/* REFLECTIVE glass behind each sash — low roughness + high envMapIntensity ⇒ it mirrors the sky HDR */}
      <mesh position={[0, halfH / 2, zUpG]}><planeGeometry args={[w - 2 * sf, halfH - 2 * sf]} /><meshStandardMaterial color="#28333d" metalness={0.5} roughness={0.022} envMapIntensity={3.4} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -halfH / 2, zLoG]}><planeGeometry args={[w - 2 * sf, halfH - 2 * sf]} /><meshStandardMaterial color="#28333d" metalness={0.5} roughness={0.022} envMapIntensity={3.4} side={THREE.DoubleSide} /></mesh>
      {/* black jamb liner (reveal) */}
      {liner("t", 0, halfH - 0.02, w, 0.04)}
      {liner("b", 0, -halfH + 0.02, w, 0.04)}
      {liner("l", -w / 2 + 0.02, 0, 0.04, h)}
      {liner("r", w / 2 - 0.02, 0, 0.04, h)}
      {/* black sashes: lower (inner) then upper (outer/proud) — their join = the meeting rail */}
      <group>{bars(sash(-halfH, 0), zLo, dSash, FRAME_BLACK)}</group>
      <group>{bars(sash(0, halfH), zUp, dSash, FRAME_BLACK)}</group>
      {/* flat WHITE casing on the wall */}
      <group>{bars(casing, zCaseF + 0.065, 0.13, FASCIA_COLOR)}</group>
      {/* projecting white head cap (cornice) + a slim sloped crown + a small sill */}
      <mesh position={[0, halfH + cw + 0.04, zCaseF - 0.05]} castShadow><boxGeometry args={[w + 2 * cw + 0.3, 0.17, 0.34]} /><meshStandardMaterial color={FASCIA_COLOR} roughness={0.5} /></mesh>
      <mesh position={[0, halfH + cw + 0.15, zCaseF - 0.03]} rotation={[0.24, 0, 0]} castShadow><boxGeometry args={[w + 2 * cw + 0.38, 0.06, 0.4]} /><meshStandardMaterial color={FASCIA_COLOR} roughness={0.5} /></mesh>
      <mesh position={[0, -halfH - cw + 0.01, zCaseF - 0.02]} castShadow><boxGeometry args={[w + 2 * cw + 0.1, 0.1, 0.22]} /><meshStandardMaterial color={FASCIA_COLOR} roughness={0.6} /></mesh>
    </group>
  );
}
// Wrought-IRON DOUBLE DOOR (Antonio's reference): two black-iron leaves with segmental-arched tops, an ornamental grille
// (twisted balusters + scroll curls) over LIGHT glass, raised bottom panels + center pull handles — in a black iron surround
// (jambs/sill + arched header) framed by a light-stone casing. Built facing −z, proud of the wall (flat scene ⇒ DoubleSide).
function IronDoor({ position }: { position: [number, number, number] }) {
  const LW = 2.7, LH = 6.5, arch = 0.5, fw = 0.22, botH = 1.5; // leaf width/height · arch rise · iron frame width · bottom-panel top
  const fz = -0.16; // door slab proud toward −z
  const ironMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#15171a", metalness: 0.5, roughness: 0.45, side: THREE.DoubleSide }), []);
  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b7c2cb", metalness: 0.2, roughness: 0.12, side: THREE.DoubleSide }), []);
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d6d0c2", roughness: 0.85, side: THREE.DoubleSide }), []);
  // one leaf's iron frame: rect + arched top with the GLASS opening as a hole (right leaf; center at x=0, outer at x=LW)
  const leafGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(LW, 0); s.lineTo(LW, LH);
    s.quadraticCurveTo(LW * 0.5, LH + arch + 0.1, 0, LH + arch); s.lineTo(0, 0);
    const hole = new THREE.Path();
    hole.moveTo(fw, botH); hole.lineTo(LW - fw, botH); hole.lineTo(LW - fw, LH - fw);
    hole.quadraticCurveTo(LW * 0.5, LH + arch - fw, fw, LH + arch - fw); hole.lineTo(fw, botH);
    s.holes.push(hole);
    return new THREE.ExtrudeGeometry(s, { depth: 0.13, bevelEnabled: false });
  }, []);
  const glassGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(fw - 0.04, botH - 0.04); s.lineTo(LW - fw + 0.04, botH - 0.04); s.lineTo(LW - fw + 0.04, LH - fw + 0.05);
    s.quadraticCurveTo(LW * 0.5, LH + arch - fw + 0.12, fw - 0.04, LH + arch - fw + 0.05); s.lineTo(fw - 0.04, botH - 0.04);
    return new THREE.ShapeGeometry(s);
  }, []);
  const panelGeo = useMemo(() => {
    const s = new THREE.Shape(); const m = 0.34;
    s.moveTo(m, 0.32); s.lineTo(LW - m, 0.32); s.lineTo(LW - m, botH - 0.4);
    s.quadraticCurveTo(LW * 0.5, botH - 0.08, m, botH - 0.4); s.lineTo(m, 0.32);
    return new THREE.ShapeGeometry(s);
  }, []);
  const headerGeo = useMemo(() => { // iron arched header crescent above the leaves
    const s = new THREE.Shape();
    s.moveTo(-LW, LH); s.quadraticCurveTo(0, LH + 2 * arch, LW, LH); // inner = the door arch (peaks at LH+arch)
    s.lineTo(LW + 0.24, LH); s.quadraticCurveTo(0, LH + 2 * arch + 1.0, -LW - 0.24, LH); s.lineTo(-LW, LH); // outer, higher arch
    return new THREE.ShapeGeometry(s);
  }, []);

  const gz = fz + 0.03; // grille plane (in the opening, over the glass)
  const curl = (key: string, x: number, y: number, r: number, rot: number, len = Math.PI * 1.45) => (
    <mesh key={key} material={ironMat} position={[x, y, gz]} rotation={[0, 0, rot]}><torusGeometry args={[r, 0.02, 6, 16, len]} /></mesh>
  );
  const baluster = (key: string, x: number, y0: number, y1: number) => {
    const h = y1 - y0, cy = (y0 + y1) / 2, n = Math.max(2, Math.round(h / 0.85));
    return (
      <group key={key}>
        <mesh material={ironMat} position={[x, cy, gz]}><cylinderGeometry args={[0.02, 0.02, h, 8]} /></mesh>
        {Array.from({ length: n }, (_, i) => y0 + ((i + 0.5) * h) / n).map((ky, i) => (
          <mesh key={i} material={ironMat} position={[x, ky, gz]} scale={[1, 0.55, 1]}><sphereGeometry args={[0.058, 8, 6]} /></mesh>
        ))}
      </group>
    );
  };
  const grille = (k: string) => {
    const x0 = fw + 0.3, x1 = LW - fw - 0.3, nb = 4, by0 = botH + 0.75, by1 = LH - 1.0;
    return (
      <group key={k}>
        {Array.from({ length: nb }, (_, i) => x0 + ((x1 - x0) * i) / (nb - 1)).map((bx, i) => baluster(`bal${i}`, bx, by0, by1))}
        {curl("t1", LW * 0.33, LH - 0.72, 0.3, 0.5)}
        {curl("t2", LW * 0.6, LH - 0.62, 0.26, -0.7)}
        {curl("t3", LW * 0.46, LH - 0.32, 0.17, Math.PI, Math.PI)}
        {curl("c1", LW * 0.33, botH + 0.5, 0.26, -2.4)}
        {curl("c2", LW * 0.62, botH + 0.44, 0.24, 2.3)}
      </group>
    );
  };
  const leaf = (side: number) => (
    <group key={side} scale={[side, 1, 1]} position={[side * 0.03, 0, 0]}>
      <mesh geometry={glassGeo} material={glassMat} position={[0, 0, fz + 0.11]} />
      <mesh geometry={leafGeo} material={ironMat} position={[0, 0, fz]} />
      <mesh geometry={panelGeo} material={ironMat} position={[0, 0, fz - 0.02]} />
      {grille("g")}
      <mesh material={ironMat} position={[0.12, LH * 0.42, fz - 0.12]}><boxGeometry args={[0.05, 1.5, 0.13]} /></mesh>
    </group>
  );

  return (
    <group position={position}>
      {/* light-stone casing (optional decoration): blocky jambs + sill + lintel framing the dark door */}
      <group>{bars([
        { x: -(LW + 0.42), y: 4.1, w: 0.5, h: 8.2 },
        { x: LW + 0.42, y: 4.1, w: 0.5, h: 8.2 },
        { x: 0, y: -0.2, w: 2 * LW + 1.7, h: 0.4 },
        { x: 0, y: 8.0, w: 2 * LW + 1.7, h: 0.4 },
      ], fz + 0.05, 0.2, "#d6d0c2")}</group>
      {/* black iron leaves */}
      {leaf(1)}
      {leaf(-1)}
      {/* black iron surround: jambs + sill + arched header */}
      <group>{bars([
        { x: -(LW + 0.12), y: (LH + arch) / 2, w: 0.24, h: LH + arch },
        { x: LW + 0.12, y: (LH + arch) / 2, w: 0.24, h: LH + arch },
        { x: 0, y: -0.09, w: 2 * LW + 0.48, h: 0.22 },
      ], fz - 0.02, 0.16, "#15171a")}</group>
      <mesh geometry={headerGeo} material={ironMat} position={[0, 0, fz - 0.02]} />
    </group>
  );
}

// two-car FLUSH-PANEL steel garage door, charcoal, with a row of vertical windows in the top section
function GarageDoor({ position, w, h }: { position: [number, number, number]; w: number; h: number }) {
  const charcoal = "#3a3d41", fz = -0.1, secs = 4, secH = h / secs;
  const winCy = h - secH / 2, winH = secH * 0.5, winW = w - 1.4; // the window band in the top section
  const N = Math.max(6, Math.round(w / 1.6)); // vertical lites
  const dividers: number[] = [];
  for (let i = 1; i < N; i++) dividers.push(-winW / 2 + (i * winW) / N);
  return (
    <group position={position}>
      {/* light-grey casing around the opening */}
      {bars([
        { x: 0, y: h + 0.12, w: w + 0.48, h: 0.24 },
        { x: -(w / 2 + 0.12), y: h / 2, w: 0.24, h: h + 0.24 },
        { x: w / 2 + 0.12, y: h / 2, w: 0.24, h: h + 0.24 },
      ], -0.1, 0.14, FASCIA_COLOR)}
      {/* flush steel slab */}
      <mesh position={[0, h / 2, fz]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.1]} />
        <meshStandardMaterial color={charcoal} metalness={0.45} roughness={0.42} envMapIntensity={0.6} />
      </mesh>
      {/* horizontal section shadow-lines (flush panel) */}
      {[1, 2, 3].map((i) => (
        <mesh key={i} position={[0, i * secH, -0.16]}>
          <boxGeometry args={[w - 0.06, 0.05, 0.04]} />
          <meshStandardMaterial color="#23262a" roughness={0.6} />
        </mesh>
      ))}
      {/* vertical windows: glass band + mullions + frame */}
      <mesh position={[0, winCy, -0.16]}>
        <planeGeometry args={[winW, winH]} />
        <meshStandardMaterial color={GLASS} metalness={0.4} roughness={0.06} envMapIntensity={1.4} side={THREE.DoubleSide} />
      </mesh>
      {dividers.map((dx, i) => (
        <mesh key={i} position={[dx, winCy, -0.18]}>
          <boxGeometry args={[0.06, winH, 0.06]} />
          <meshStandardMaterial color={charcoal} metalness={0.4} roughness={0.45} />
        </mesh>
      ))}
      {bars([{ x: 0, y: winCy + winH / 2, w: winW + 0.12, h: 0.12 }, { x: 0, y: winCy - winH / 2, w: winW + 0.12, h: 0.12 }], -0.18, 0.07, charcoal)}
    </group>
  );
}

// half-moon GABLE VENT (over the garage, near the peak): a semicircular louvered vent — horizontal slats clipped to the
// half-disc chord, a curved trim ring + a flat sill, over a dark recess
function GableVent({ position, r }: { position: [number, number, number]; r: number }) {
  const fz = -0.13, t = 0.22;
  const n = Math.max(4, Math.round(r / 0.32)); // louver slats, bottom → top
  const louvers = Array.from({ length: n }, (_, i) => {
    const y = (i + 0.5) * (r / n); // height above the flat bottom
    return { y, w: 2 * Math.sqrt(Math.max(0, r * r - y * y)) }; // chord of the semicircle at this height
  });
  return (
    <group position={position}>
      {/* dark half-disc recess (flat side down, round top) */}
      <mesh position={[0, 0, fz - 0.07]}><circleGeometry args={[r, 40, 0, Math.PI]} /><meshStandardMaterial color="#16181a" roughness={0.95} side={THREE.DoubleSide} /></mesh>
      {/* horizontal louver slats, each as wide as the semicircle's chord at its height */}
      {louvers.map((l, i) => (
        <mesh key={i} position={[0, l.y, fz - 0.01]} rotation={[-0.5, 0, 0]} castShadow>
          <boxGeometry args={[Math.max(0.1, l.w - 0.08), (r / n) * 0.9, 0.05]} />
          <meshStandardMaterial color={FASCIA_COLOR} roughness={0.62} metalness={0} />
        </mesh>
      ))}
      {/* curved trim ring + flat bottom sill */}
      <mesh position={[0, 0, fz]}><ringGeometry args={[r, r + t, 40, 1, 0, Math.PI]} /><meshStandardMaterial color={FASCIA_COLOR} roughness={0.6} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -t / 2, fz]} castShadow><boxGeometry args={[2 * r + 2 * t, t, 0.2]} /><meshStandardMaterial color={FASCIA_COLOR} roughness={0.6} metalness={0} /></mesh>
    </group>
  );
}

export function RoofHouse({ tileFt = 8, flat = false, colorTint }: { tileFt?: number; flat?: boolean; colorTint?: string }) {
  const tile = useTexture("/shingle-wewo-tile.jpg");
  const field = useMemo(() => {
    const t = tile.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.53, 1.0);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [tile]);
  const siding = useMemo(() => {
    const t = makeLapSiding(SIDING_HEX, 0.2); // CertainTeed "Savannah Wicker" — khaki/wicker greige (albedo cooled to offset the warm sun)
    const tFt = SIDING_BOARDS_PER_TILE * (8 / 12);
    t.repeat.set(1 / tFt, 1 / tFt);
    return t;
  }, []);
  const shake = useMemo(() => {
    const t = makeShakeSiding(SIDING_HEX, 0.28); // SHAKE/shingle siding (SAME Savannah Wicker color) for the south gable triangles
    t.repeat.set(1 / SHAKE_TILE_FT[0], 1 / SHAKE_TILE_FT[1]);
    t.offset.y = -(WALLH / SHAKE_TILE_FT[1]); // align a course boundary to the gable BOTTOM (y=WALLH) so the bottom course is FULL, not a sliver
    return t;
  }, []);
  const [vCol, vNrm, vRgh] = useTexture(["/veneer-color.jpg", "/veneer-normal.jpg", "/veneer-rough.jpg"]);
  useMemo(() => {
    for (const t of [vCol, vNrm, vRgh]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(1 / tileFt, 1 / tileFt); // walls UV'd in world ft (U = x+z, V = worldY) ⇒ tile = tileFt of wall
      t.anisotropy = 8;
      t.needsUpdate = true;
    }
    vCol.colorSpace = THREE.SRGBColorSpace;
  }, [vCol, vNrm, vRgh, tileFt]);
  return (
    <group>
      <mesh geometry={HOUSE.roof} castShadow receiveShadow>
        <meshStandardMaterial map={field} color={colorTint} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={RECEDED_SIDING} castShadow receiveShadow>
        <meshStandardMaterial map={siding} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* the south GABLE triangles (above the eave line) → SHAKE/shingle siding (craftsman gable accent), same color */}
      <mesh geometry={GABLE_SIDING} castShadow receiveShadow>
        <meshStandardMaterial map={shake} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* 078 stone VENEER on the south-facing walls (up to the eave) + the facet-I eave wall. normalScale.y=-1 fixes the
          inverted (crater) look; lower envMapIntensity keeps it matte, not glossy; flat mode drops the maps → pure albedo */}
      <mesh geometry={RECEDED_VENEER} castShadow receiveShadow>
        <meshStandardMaterial map={vCol} normalMap={flat ? undefined : vNrm} normalScale={VENEER_NORMAL_SCALE} roughnessMap={flat ? undefined : vRgh} roughness={1} metalness={0} envMapIntensity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={DIMWALL} castShadow receiveShadow>
        <meshStandardMaterial map={vCol} normalMap={flat ? undefined : vNrm} normalScale={VENEER_NORMAL_SCALE} roughnessMap={flat ? undefined : vRgh} roughness={1} metalness={0} envMapIntensity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={TONGUE_G} castShadow receiveShadow><meshStandardMaterial map={field} color={colorTint} roughness={0.92} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={TONGUE_B} castShadow receiveShadow><meshStandardMaterial map={field} color={colorTint} roughness={0.92} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={FASCIA} castShadow receiveShadow><meshStandardMaterial color={FASCIA_COLOR} roughness={0.7} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={DIMFASCIA} castShadow receiveShadow><meshStandardMaterial color={FASCIA_COLOR} roughness={0.7} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={TONGUE_G_EAVE} castShadow receiveShadow><meshStandardMaterial color={FASCIA_COLOR} roughness={0.8} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={TONGUE_B_EAVE} castShadow receiveShadow><meshStandardMaterial color={FASCIA_COLOR} roughness={0.8} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={SOFFIT} receiveShadow><meshStandardMaterial color={SOFFIT_COLOR} roughness={0.85} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={DIMSOFFIT} receiveShadow><meshStandardMaterial color={SOFFIT_COLOR} roughness={0.85} metalness={0} side={THREE.DoubleSide} /></mesh>
      {/* OPENINGS — SOUTH = garage + entrance + the half-moon vent, plus ONE double-hung on the smaller SW stone facet
          (Antonio). All other windows live on the EAST (x=26) / WEST (x=−26) / NORTH (z=38) eaves — recessed 1.5 to the
          wall plane + turned (rotY) to face out. Every window is a DoubleHung. */}
      <GarageDoor position={[18, 0, -41]} w={16} h={7} />
      <GableVent position={[18, 15, -41]} r={2.2} />
      <IronDoor position={[-3.5, 0, -21.5]} />
      {/* SOUTH — one double-hung on the smaller SW stone-veneer facet (faces −z) */}
      <DoubleHung position={[-17, 4.6, -33]} w={3.2} h={4.4} />
      {/* EAST elevation — faces +x (z runs −17 → 38) */}
      <DoubleHung position={[24.5, 4.6, -2]} w={3.4} h={4.6} rotY={-Math.PI / 2} />
      <DoubleHung position={[24.5, 4.6, 14]} w={3.4} h={4.6} rotY={-Math.PI / 2} />
      <DoubleHung position={[24.5, 4.6, 28]} w={3.4} h={4.6} rotY={-Math.PI / 2} />
      {/* WEST elevation — faces −x (z runs −34 → 23) */}
      <DoubleHung position={[-24.5, 4.6, -18]} w={3.4} h={4.6} rotY={Math.PI / 2} />
      <DoubleHung position={[-24.5, 4.6, -2]} w={3.4} h={4.6} rotY={Math.PI / 2} />
      <DoubleHung position={[-24.5, 4.6, 14]} w={3.4} h={4.6} rotY={Math.PI / 2} />
      {/* NORTH elevation — faces +z (x runs −14 → 26) */}
      <DoubleHung position={[4, 4.6, 36.5]} w={3.4} h={4.6} rotY={Math.PI} />
      <DoubleHung position={[18, 4.6, 36.5]} w={3.4} h={4.6} rotY={Math.PI} />
      {/* caps at the true field-match level (no +33% over-bright) so the sun doesn't blow out the hip/ridge highlights */}
      <RoofCaps creases={HOUSE.creases} eaveY={HOUSE.eaveY} level={1.34} />
    </group>
  );
}
