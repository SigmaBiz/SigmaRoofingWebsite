// THROWAWAY: /housetest — preview the DRESSED house with the CC0 078 stone VENEER on the SOUTH-facing walls (+ the
// facet-I eave wall), siding elsewhere, shingle roof — before importing the change to /inspect. Same geometry + finish as
// /inspect's House, but standalone with a free orbit camera (no scroll). ?tile=<ft> = veneer stone scale. Free cam via
// ?cx,cy,cz & ?tx,ty,tz. TO REVERT: delete this file + its route + (later) the /public/veneer-*.jpg.
import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useTexture, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { buildCrestridge, type Pt } from "@/lib/tr3/solver2";
import { RoofCaps } from "@/lib/tr3/caps";
import { makeLapSiding, SIDING_BOARDS_PER_TILE } from "@/lib/tr3/siding";
import { recedeWalls, buildFascia, buildSoffit, buildDiminishedEaveWall, buildDiminishedEaveFascia, buildDiminishedEaveSoffit, buildNotchTongueRoof, buildNotchTongueEave } from "@/lib/tr3/walls";

const HOUSE = buildCrestridge(9);
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
const TRIM = "#ece9e2", GLASS = "#2a3640";
const FASCIA_COLOR = "#cdd0d2", SOFFIT_COLOR = "#bfc2c5", CASING = "#b7a98f"; // light-grey eave trim; warm-greige door casing (matches the wood, less stark than white)
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
function Window({ position, w, h, cols }: { position: [number, number, number]; w: number; h: number; cols: number }) {
  const t = 0.25, fz = -0.13, depth = 0.16; // trim width, proud toward −z, frame depth
  const fr: Bar[] = [
    { x: 0, y: h / 2 + t / 2, w: w + 2 * t, h: t }, // head
    { x: 0, y: -h / 2 - t / 2, w: w + 2 * t, h: t }, // bottom rail
    { x: -(w / 2 + t / 2), y: 0, w: t, h: h + 2 * t }, // left jamb
    { x: w / 2 + t / 2, y: 0, w: t, h: h + 2 * t }, // right jamb
    { x: 0, y: 0, w, h: t * 0.6 }, // horizontal muntin
  ];
  for (let c = 1; c < cols; c++) fr.push({ x: -w / 2 + (c * w) / cols, y: 0, w: t * 0.6, h }); // vertical mullion(s)
  return (
    <group position={position}>
      <Glass z={fz + 0.05} w={w} h={h} />
      {bars(fr, fz, depth, TRIM)}
      <mesh position={[0, -h / 2 - t, fz - 0.07]} castShadow>{/* projecting sill */}
        <boxGeometry args={[w + 2.4 * t, t * 0.9, 0.5]} />
        <meshStandardMaterial color={TRIM} roughness={0.6} />
      </mesh>
    </group>
  );
}
function Door({ position, flat }: { position: [number, number, number]; flat: boolean }) {
  const [wCol, wNrm, wRgh] = useTexture(["/door-wood-color.jpg", "/door-wood-normal.jpg", "/door-wood-rough.jpg"]);
  const woodMat = useMemo(() => {
    for (const tx of [wCol, wNrm, wRgh]) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(0.55, 1.1); tx.anisotropy = 8; tx.needsUpdate = true; }
    wCol.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: wCol, normalMap: flat ? null : wNrm, normalScale: DOOR_WOOD_NSCALE, roughnessMap: flat ? null : wRgh, roughness: 0.5, metalness: 0 });
  }, [wCol, wNrm, wRgh, flat]);
  const bronzeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#40362b", metalness: 0.85, roughness: 0.32 }), []);
  const W = 3.4, H = 7, sl = 0.7, tr = 1.0, t = 0.2, sw = 0.45; // door / sidelight / transom / casing / stile widths
  const tot = W + 2 * (sl + t);
  const rTop = { y: H - 0.3, h: 0.6 }, rLock = { y: H * 0.4, h: 0.62 }, rBot = { y: 0.55, h: 1.1 }; // top / lock / bottom rails
  const innerW = W - 2 * sw;
  const upCy = (rLock.y + rLock.h / 2 + rTop.y - rTop.h / 2) / 2, upH = (rTop.y - rTop.h / 2) - (rLock.y + rLock.h / 2); // upper glass lite
  const loCy = (rBot.y + rBot.h / 2 + rLock.y - rLock.h / 2) / 2, loH = (rLock.y - rLock.h / 2) - (rBot.y + rBot.h / 2); // lower raised panel
  const frame: Bar[] = [
    { x: -(W / 2 - sw / 2), y: H / 2, w: sw, h: H }, // left stile
    { x: W / 2 - sw / 2, y: H / 2, w: sw, h: H }, // right stile
    { x: 0, y: rTop.y, w: innerW, h: rTop.h }, // top rail
    { x: 0, y: rLock.y, w: innerW, h: rLock.h }, // lock rail
    { x: 0, y: rBot.y, w: innerW, h: rBot.h }, // bottom rail
  ];
  return (
    <group position={position}>
      {/* white casing: head over transom + jambs + transom rail + door|sidelight mullions */}
      {bars([
        { x: 0, y: H + tr + t / 2, w: tot + 2 * t, h: t },
        { x: -(tot / 2 + t / 2), y: (H + tr) / 2, w: t, h: H + tr + t },
        { x: tot / 2 + t / 2, y: (H + tr) / 2, w: t, h: H + tr + t },
        { x: 0, y: H + t / 2, w: tot, h: t },
        { x: -(W / 2 + t / 2), y: H / 2, w: t, h: H },
        { x: W / 2 + t / 2, y: H / 2, w: t, h: H },
      ], -0.09, 0.11, CASING)}
      <Glass y={H + tr / 2} z={-0.08} w={tot} h={tr} />
      <Glass x={-(W / 2 + t + sl / 2)} y={H / 2} z={-0.08} w={sl} h={H} />
      <Glass x={W / 2 + t + sl / 2} y={H / 2} z={-0.08} w={sl} h={H} />
      {/* WOOD door: slab + proud stile-and-rail frame */}
      <mesh material={woodMat} position={[0, H / 2, -0.06]} castShadow><boxGeometry args={[W, H, 0.16]} /></mesh>
      {frame.map((b, i) => (
        <mesh key={i} material={woodMat} position={[b.x, b.y, -0.16]} castShadow><boxGeometry args={[b.w, b.h, 0.12]} /></mesh>
      ))}
      {/* upper glass lite + muntin cross */}
      <Glass y={upCy} z={-0.07} w={innerW - 0.08} h={upH - 0.08} />
      {bars([{ x: 0, y: upCy, w: innerW - 0.08, h: 0.09 }, { x: 0, y: upCy, w: 0.09, h: upH - 0.08 }], -0.12, 0.07, "#2c241c")}
      {/* lower raised panel */}
      <mesh material={woodMat} position={[0, loCy, -0.13]} castShadow><boxGeometry args={[innerW - 0.45, loH - 0.35, 0.06]} /></mesh>
      {/* hardware: rose + lever + deadbolt + kickplate (oil-rubbed bronze) */}
      <mesh material={bronzeMat} position={[W / 2 - 0.45, rLock.y, -0.24]} castShadow><boxGeometry args={[0.4, 0.42, 0.05]} /></mesh>
      <mesh material={bronzeMat} position={[W / 2 - 0.58, rLock.y, -0.3]} castShadow><boxGeometry args={[0.38, 0.09, 0.1]} /></mesh>
      <mesh material={bronzeMat} rotation={[Math.PI / 2, 0, 0]} position={[W / 2 - 0.45, rLock.y + 0.55, -0.24]} castShadow><cylinderGeometry args={[0.085, 0.085, 0.05, 16]} /></mesh>
      <mesh position={[0, 0.42, -0.24]} castShadow><boxGeometry args={[W - 0.2, 0.62, 0.03]} /><meshStandardMaterial color="#6e5f47" metalness={0.8} roughness={0.4} /></mesh>
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

function House({ tileFt, flat }: { tileFt: number; flat: boolean }) {
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
    const t = makeLapSiding("#e8e6e0", 0.2);
    const tFt = SIDING_BOARDS_PER_TILE * (8 / 12);
    t.repeat.set(1 / tFt, 1 / tFt);
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
        <meshStandardMaterial map={field} roughness={0.92} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={RECEDED_SIDING} castShadow receiveShadow>
        <meshStandardMaterial map={siding} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* the south GABLE triangles (above the eave line) → siding, not stone */}
      <mesh geometry={GABLE_SIDING} castShadow receiveShadow>
        <meshStandardMaterial map={siding} roughness={0.95} metalness={0} side={THREE.DoubleSide} />
      </mesh>
      {/* 078 stone VENEER on the south-facing walls (up to the eave) + the facet-I eave wall. normalScale.y=-1 fixes the
          inverted (crater) look; lower envMapIntensity keeps it matte, not glossy; flat mode drops the maps → pure albedo */}
      <mesh geometry={RECEDED_VENEER} castShadow receiveShadow>
        <meshStandardMaterial map={vCol} normalMap={flat ? undefined : vNrm} normalScale={VENEER_NORMAL_SCALE} roughnessMap={flat ? undefined : vRgh} roughness={1} metalness={0} envMapIntensity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={DIMWALL} castShadow receiveShadow>
        <meshStandardMaterial map={vCol} normalMap={flat ? undefined : vNrm} normalScale={VENEER_NORMAL_SCALE} roughnessMap={flat ? undefined : vRgh} roughness={1} metalness={0} envMapIntensity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={TONGUE_G} castShadow receiveShadow><meshStandardMaterial map={field} roughness={0.92} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={TONGUE_B} castShadow receiveShadow><meshStandardMaterial map={field} roughness={0.92} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={FASCIA} castShadow receiveShadow><meshStandardMaterial color={FASCIA_COLOR} roughness={0.7} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={DIMFASCIA} castShadow receiveShadow><meshStandardMaterial color={FASCIA_COLOR} roughness={0.7} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={TONGUE_G_EAVE} castShadow receiveShadow><meshStandardMaterial color={FASCIA_COLOR} roughness={0.8} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={TONGUE_B_EAVE} castShadow receiveShadow><meshStandardMaterial color={FASCIA_COLOR} roughness={0.8} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={SOFFIT} receiveShadow><meshStandardMaterial color={SOFFIT_COLOR} roughness={0.85} metalness={0} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={DIMSOFFIT} receiveShadow><meshStandardMaterial color={SOFFIT_COLOR} roughness={0.85} metalness={0} side={THREE.DoubleSide} /></mesh>
      {/* OPENINGS — 2-car garage on the largest (SE) wall + the double window moved up into its gable; single window on
          the small (SW) gable; front door under facet I's eave */}
      <GarageDoor position={[18, 0, -41]} w={16} h={7} />
      <Window position={[18, 11.5, -41]} w={4} h={2.4} cols={2} />
      <Window position={[-17, 5, -33]} w={3.2} h={4} cols={1} />
      <Door position={[-3.5, 0, -21.5]} flat={flat} />
      <RoofCaps creases={HOUSE.creases} eaveY={HOUSE.eaveY} />
    </group>
  );
}

export default function HouseTest() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const tileFt = parseFloat(params.get("tile") ?? "8") || 8;
  const flat = params.get("flat") === "1"; // raw albedo: no lighting, no tonemapping (to inspect the texture itself)
  const cx = parseFloat(params.get("cx") ?? ""), cy = parseFloat(params.get("cy") ?? ""), cz = parseFloat(params.get("cz") ?? "");
  const pos: [number, number, number] = !Number.isNaN(cx) ? [cx, cy, cz] : [44, 22, -52];
  const tx = parseFloat(params.get("tx") ?? ""), ty = parseFloat(params.get("ty") ?? ""), tz = parseFloat(params.get("tz") ?? "");
  const target: [number, number, number] = !Number.isNaN(tx) ? [tx, ty, tz] : [4, 7, -22];
  return (
    <div style={{ height: "100vh", background: "#cbc5b8" }}>
      <Canvas shadows={!flat} camera={{ position: pos, fov: 40, near: 0.5, far: 3000 }} dpr={[1, 1.75]} gl={{ toneMapping: THREE.NoToneMapping }}>
        <ambientLight intensity={flat ? Math.PI : 2.2} />
        {!flat && <directionalLight position={[30, 55, -35]} intensity={1.2} color="#fff3df" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-90} shadow-camera-right={90} shadow-camera-top={90} shadow-camera-bottom={-90} shadow-camera-far={320} />}
        <Suspense fallback={null}>
          {!flat && <Environment files="/sky-midday.hdr" background />}
          <House tileFt={tileFt} flat={flat} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.02, -2]} receiveShadow>
            <planeGeometry args={[600, 600]} />
            <meshStandardMaterial color="#8f9678" roughness={1} />
          </mesh>
        </Suspense>
        <OrbitControls target={target} />
      </Canvas>
      <div style={{ position: "fixed", top: 10, left: 10, font: "12px monospace", background: "rgba(20,20,24,0.82)", color: "#fff", padding: "7px 10px", borderRadius: 6, lineHeight: 1.5 }}>
        <b>HOUSETEST</b> · 078 stone on SOUTH walls (gable→siding) + facet-I wall · siding elsewhere · tile=<b>{tileFt}ft</b><br />
        <span style={{ opacity: 0.8 }}>?tile=N rescale · ?flat=1 raw albedo (no lighting) · drag to orbit · approve → /inspect</span>
      </div>
    </div>
  );
}
