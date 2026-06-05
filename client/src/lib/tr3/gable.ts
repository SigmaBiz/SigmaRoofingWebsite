import * as THREE from "three";

// A GABLE prim — built strictly to definition.
//
//   • 2 EAVES   — the two long bottom edges of the slopes; both LEVEL, at wallH.
//   • 1 RIDGE   — the top edge where the slopes meet; LEVEL, at apex.
//   • 4 RAKES   — the sloped edges of the two gable ends (2 per end); each rake connects a ridge
//                 end down to an eave corner. The rakes are the only sloped edges.
//   • 2 SLOPES  — the roof surfaces; equal pitch.
//   • 2 GABLE ENDS — the vertical triangular walls beneath the rakes.
//
// Perimeter walk (eave→rake→ridge→rake→eave→rake→ridge→rake):
//   e_mp →(eave)→ e_pp →(rake↑)→ r_p →(rake↓)→ e_pm →(eave)→ e_mm →(rake↑)→ r_m →(rake↓)→ e_mp
// Ridge runs along X; slopes face ±Z; gable ends are the ±X walls.

export interface GableParams {
  L: number; // ridge length (X)
  W: number; // span eave-to-eave (Z)
  wallH: number; // eave height (ground → eave)
  pitch: number; // rise / run
  tile?: number; // world units per shingle tile
}
export interface GablePrim {
  roof: THREE.BufferGeometry;
  walls: THREE.BufferGeometry;
  apex: number;
}

type V3 = [number, number, number];

function quad(pos: number[], uv: number[], a: V3, b: V3, c: V3, d: V3, uvs: [number, number][]) {
  pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  uv.push(...uvs[0], ...uvs[1], ...uvs[2], ...uvs[0], ...uvs[2], ...uvs[3]);
}
function tri(pos: number[], uv: number[], a: V3, b: V3, c: V3) {
  pos.push(...a, ...b, ...c);
  uv.push(0, 0, 1, 0, 0.5, 1);
}
function geom(pos: number[], uv: number[]) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

export function buildGable({ L, W, wallH, pitch, tile = 2.2 }: GableParams): GablePrim {
  const hL = L / 2,
    hW = W / 2;
  const apex = wallH + hW * pitch;
  const slopeLen = Math.hypot(hW, hW * pitch); // eave → ridge surface distance

  // ground corners (y=0)
  const g_pp: V3 = [hL, 0, hW],
    g_pm: V3 = [hL, 0, -hW],
    g_mm: V3 = [-hL, 0, -hW],
    g_mp: V3 = [-hL, 0, hW];
  // eave corners (y=wallH) — all level
  const e_pp: V3 = [hL, wallH, hW],
    e_pm: V3 = [hL, wallH, -hW],
    e_mm: V3 = [-hL, wallH, -hW],
    e_mp: V3 = [-hL, wallH, hW];
  // ridge ends (y=apex, z=0) — level
  const r_p: V3 = [hL, apex, 0],
    r_m: V3 = [-hL, apex, 0];

  // ---- roof: two slopes (u along ridge, v up the slope) -----------------------------------------
  const rp: number[] = [],
    ru: number[] = [];
  const uvSlope: [number, number][] = [
    [0, 0],
    [L / tile, 0],
    [L / tile, slopeLen / tile],
    [0, slopeLen / tile],
  ];
  quad(rp, ru, e_mp, e_pp, r_p, r_m, uvSlope); // +Z slope: +Z eave → ridge
  quad(rp, ru, e_pm, e_mm, r_m, r_p, uvSlope); // −Z slope: −Z eave → ridge

  // ---- walls: 2 long eave-walls + 2 gable-end triangular walls ----------------------------------
  const wp: number[] = [],
    wu: number[] = [];
  const uvRect: [number, number][] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  quad(wp, wu, g_mp, g_pp, e_pp, e_mp, uvRect); // +Z long wall (ground → eave)
  quad(wp, wu, g_pm, g_mm, e_mm, e_pm, uvRect); // −Z long wall
  // +X gable end — rectangle (ground→eave) + triangle (eave→ridge), fanned
  quad(wp, wu, g_pp, g_pm, e_pm, e_pp, uvRect);
  tri(wp, wu, e_pp, e_pm, r_p);
  // −X gable end
  quad(wp, wu, g_mm, g_mp, e_mp, e_mm, uvRect);
  tri(wp, wu, e_mm, e_mp, r_m);

  return { roof: geom(rp, ru), walls: geom(wp, wu), apex };
}

// ------------------------------------------------------------------------------------------------
// Compound: a main gable + a GABLE EXT on its +Z slope + a HIP EXT on its −Z slope (centered).
// Both melt the same way at the inner end (canceled-eave / valley triangle, apex = where the ext
// ridge dies into the main slope). They differ only at the OUTER end: the gable ext caps with a
// vertical gable wall; the hip ext caps with a third roof slope (ridge inset by the half-width).
// Eaves level everywhere; ext widths < mainW.
export interface CrossParams {
  mainL: number;
  mainW: number;
  wallH: number;
  pitch: number;
  gableW: number; // gable ext (+Z) span
  gableLen: number;
  hipW: number; // hip ext (−Z) span
  hipLen: number;
  tile?: number;
}

export function buildCrossGable(p: CrossParams): GablePrim {
  const { mainL, mainW, wallH, pitch, gableW, gableLen, hipW, hipLen, tile = 2.2 } = p;
  const hLm = mainL / 2,
    hWm = mainW / 2;
  const apexM = wallH + hWm * pitch;
  const k = Math.sqrt(1 + pitch * pitch);

  type UV = [number, number];
  const rp: number[] = [],
    ru: number[] = [],
    wp: number[] = [],
    wu: number[] = [];
  const T = (arr: number[], uvA: number[], a: V3, b: V3, c: V3, ua: UV, ub: UV, uc: UV) => {
    arr.push(...a, ...b, ...c);
    uvA.push(...ua, ...ub, ...uc);
  };
  const Q = (arr: number[], uvA: number[], a: V3, b: V3, c: V3, d: V3, ua: UV, ub: UV, uc: UV, ud: UV) => {
    T(arr, uvA, a, b, c, ua, ub, uc);
    T(arr, uvA, a, c, d, ua, uc, ud);
  };
  const uvR: UV[] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  const G = (x: number, z: number): V3 => [x, 0, z];
  const RM_l: V3 = [-hLm, apexM, 0],
    RM_r: V3 = [hLm, apexM, 0];
  const EZ_l: V3 = [-hLm, wallH, hWm],
    EZ_r: V3 = [hLm, wallH, hWm];
  const EN_l: V3 = [-hLm, wallH, -hWm],
    EN_r: V3 = [hLm, wallH, -hWm];

  // ============ +Z GABLE EXT ============
  const hWe = gableW / 2,
    za = hWm - hWe,
    apexE = wallH + hWe * pitch,
    Zo = hWm + gableLen;
  const liftZ = (x: number, z: number): V3 => [x, wallH + (hWm - z) * pitch, z];
  const uvZ = (x: number, z: number): UV => [(x + hLm) / tile, ((hWm - z) * k) / tile];
  const tz = (a: [number, number], b: [number, number], c: [number, number]) => T(rp, ru, liftZ(a[0], a[1]), liftZ(b[0], b[1]), liftZ(c[0], c[1]), uvZ(a[0], a[1]), uvZ(b[0], b[1]), uvZ(c[0], c[1]));
  // notched +Z slope (topTri + right + left, notch removed for the ext)
  tz([-hLm, 0], [hLm, 0], [0, za]);
  tz([hLm, 0], [hLm, hWm], [hWe, hWm]);
  tz([hLm, 0], [hWe, hWm], [0, za]);
  tz([-hLm, 0], [0, za], [-hWe, hWm]);
  tz([-hLm, 0], [-hWe, hWm], [-hLm, hWm]);
  // gable ext slopes
  const CE_r: V3 = [hWe, wallH, hWm],
    CE_l: V3 = [-hWe, wallH, hWm];
  const OE_r: V3 = [hWe, wallH, Zo],
    OE_l: V3 = [-hWe, wallH, Zo];
  const V_e: V3 = [0, apexE, za],
    OR_e: V3 = [0, apexE, Zo];
  const veG = (hWe * k) / tile;
  Q(rp, ru, CE_r, OE_r, OR_e, V_e, [hWm / tile, 0], [Zo / tile, 0], [Zo / tile, veG], [za / tile, veG]);
  Q(rp, ru, CE_l, V_e, OR_e, OE_l, [hWm / tile, 0], [za / tile, veG], [Zo / tile, veG], [Zo / tile, 0]);

  // ============ −Z HIP EXT ============
  const hWh = hipW / 2,
    zah = hWm - hWh,
    apexH = wallH + hWh * pitch,
    Zoh = hWm + hipLen;
  const roZ = -(Zoh - hWh); // ridge outer point z (ridge inset by half-width ⇒ hip)
  const liftN = (x: number, z: number): V3 => [x, wallH + (z + hWm) * pitch, z];
  const uvN = (x: number, z: number): UV => [(x + hLm) / tile, ((z + hWm) * k) / tile];
  const tn = (a: [number, number], b: [number, number], c: [number, number]) => T(rp, ru, liftN(a[0], a[1]), liftN(b[0], b[1]), liftN(c[0], c[1]), uvN(a[0], a[1]), uvN(b[0], b[1]), uvN(c[0], c[1]));
  // notched −Z slope
  tn([-hLm, 0], [hLm, 0], [0, -zah]);
  tn([hLm, 0], [hLm, -hWm], [hWh, -hWm]);
  tn([hLm, 0], [hWh, -hWm], [0, -zah]);
  tn([-hLm, 0], [0, -zah], [-hWh, -hWm]);
  tn([-hLm, 0], [-hWh, -hWm], [-hLm, -hWm]);
  // hip ext: 2 side slopes + hip-end slope
  const CH_r: V3 = [hWh, wallH, -hWm],
    CH_l: V3 = [-hWh, wallH, -hWm];
  const OH_r: V3 = [hWh, wallH, -Zoh],
    OH_l: V3 = [-hWh, wallH, -Zoh];
  const V_h: V3 = [0, apexH, -zah],
    RO_h: V3 = [0, apexH, roZ];
  const veH = (hWh * k) / tile;
  Q(rp, ru, CH_r, OH_r, RO_h, V_h, [hWm / tile, 0], [Zoh / tile, 0], [(Zoh - hWh) / tile, veH], [zah / tile, veH]); // east
  Q(rp, ru, CH_l, V_h, RO_h, OH_l, [hWm / tile, 0], [zah / tile, veH], [(Zoh - hWh) / tile, veH], [Zoh / tile, 0]); // west
  T(rp, ru, RO_h, OH_l, OH_r, [0.5, veH], [0, 0], [1, 0]); // hip end slope

  // ============ main gable ends (±X), rect + triangle ============
  Q(wp, wu, G(hLm, hWm), G(hLm, -hWm), EN_r, EZ_r, uvR[0], uvR[1], uvR[2], uvR[3]);
  T(wp, wu, EZ_r, EN_r, RM_r, [0, 0], [1, 0], [0.5, 1]);
  Q(wp, wu, G(-hLm, -hWm), G(-hLm, hWm), EZ_l, EN_l, uvR[0], uvR[1], uvR[2], uvR[3]);
  T(wp, wu, EN_l, EZ_l, RM_l, [0, 0], [1, 0], [0.5, 1]);

  // ============ long walls, split by each ext's canceled center ============
  // +Z (gable ext)
  Q(wp, wu, G(-hLm, hWm), G(-hWe, hWm), CE_l, EZ_l, uvR[0], uvR[1], uvR[2], uvR[3]);
  Q(wp, wu, G(hWe, hWm), G(hLm, hWm), EZ_r, CE_r, uvR[0], uvR[1], uvR[2], uvR[3]);
  // −Z (hip ext)
  Q(wp, wu, G(-hLm, -hWm), G(-hWh, -hWm), CH_l, EN_l, uvR[0], uvR[1], uvR[2], uvR[3]);
  Q(wp, wu, G(hWh, -hWm), G(hLm, -hWm), EN_r, CH_r, uvR[0], uvR[1], uvR[2], uvR[3]);

  // ============ gable-ext walls (sides + outer gable end) ============
  Q(wp, wu, G(hWe, hWm), G(hWe, Zo), OE_r, CE_r, uvR[0], uvR[1], uvR[2], uvR[3]);
  Q(wp, wu, G(-hWe, hWm), G(-hWe, Zo), OE_l, CE_l, uvR[0], uvR[1], uvR[2], uvR[3]);
  Q(wp, wu, G(-hWe, Zo), G(hWe, Zo), OE_r, OE_l, uvR[0], uvR[1], uvR[2], uvR[3]);
  T(wp, wu, OE_l, OE_r, OR_e, [0, 0], [1, 0], [0.5, 1]);

  // ============ hip-ext walls (sides + outer eave wall = plain rect, no gable) ============
  Q(wp, wu, G(hWh, -hWm), G(hWh, -Zoh), OH_r, CH_r, uvR[0], uvR[1], uvR[2], uvR[3]);
  Q(wp, wu, G(-hWh, -hWm), G(-hWh, -Zoh), OH_l, CH_l, uvR[0], uvR[1], uvR[2], uvR[3]);
  Q(wp, wu, G(-hWh, -Zoh), G(hWh, -Zoh), OH_r, OH_l, uvR[0], uvR[1], uvR[2], uvR[3]);

  return { roof: geom(rp, ru), walls: geom(wp, wu), apex: apexM };
}

// ================================================================================================
// GENERAL COMPOUND ENGINE — a main HIP prim + a list of exts on its long (±Z) eaves.
// Each ext melts the same way (canceled eave + valley triangle, apex where its ridge meets the main
// slope); they differ only at the outer end (gable wall vs hipped slope). Main ridge along X, hipped
// at both ±X ends. Notched main slopes are triangulated with ShapeUtils so any number of exts work.
export interface Ext {
  side: "+z" | "-z";
  a: number; // interface base start (x along the host eave)  — the ewidth runs [a, b]
  b: number; // interface base end (b > a)
  length: number; // how far it projects past the main eave
  cap: "gable" | "hip";
}
export interface CompoundParams {
  mainL: number;
  mainW: number;
  wallH: number;
  pitch: number;
  exts: Ext[];
  tile?: number;
}

export function buildCompound(p: CompoundParams): GablePrim {
  const { mainL, mainW, wallH, pitch, exts, tile = 2.2 } = p;
  const hLm = mainL / 2,
    hWm = mainW / 2;
  const apexM = wallH + hWm * pitch;
  const k = Math.sqrt(1 + pitch * pitch);
  type UV = [number, number];
  const rp: number[] = [],
    ru: number[] = [],
    wp: number[] = [],
    wu: number[] = [];
  const T = (arr: number[], uvA: number[], a: V3, b: V3, c: V3, ua: UV, ub: UV, uc: UV) => {
    arr.push(...a, ...b, ...c);
    uvA.push(...ua, ...ub, ...uc);
  };
  const Q = (arr: number[], uvA: number[], a: V3, b: V3, c: V3, d: V3, ua: UV, ub: UV, uc: UV, ud: UV) => {
    T(arr, uvA, a, b, c, ua, ub, uc);
    T(arr, uvA, a, c, d, ua, uc, ud);
  };
  const uvR: UV[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const G = (x: number, z: number): V3 => [x, 0, z];

  // ---- main hip: ridge along X, inset by hWm at each end ----------------------------------------
  const rxL = -hLm + hWm,
    rxR = hLm - hWm; // ridge ends (x)
  // long-slope lift: +Z uses z∈[0,hWm], −Z uses z∈[−hWm,0]; both height = wallH + (hWm−|z|)·pitch
  const liftY = (z: number) => wallH + (hWm - Math.abs(z)) * pitch;
  const slopeLift = (x: number, z: number): V3 => [x, liftY(z), z];
  const uvS = (x: number, z: number): UV => [(x + hLm) / tile, ((hWm - Math.abs(z)) * k) / tile];

  // notched long slope for one side (+Z: sgn=+1, −Z: sgn=−1); eave dips into a V-notch per ext
  const longSlope = (sgn: 1 | -1) => {
    const ez = sgn * hWm;
    const sideExts = exts.filter((e) => (e.side === "+z" ? 1 : -1) === sgn).sort((p, q) => q.a + q.b - (p.a + p.b)); // by centre, descending (eave traversed +hLm→−hLm)
    const contour: [number, number][] = [[rxL, 0], [rxR, 0], [hLm, ez]];
    for (const e of sideExts) {
      const hWe = (e.b - e.a) / 2,
        cx = (e.a + e.b) / 2,
        za = sgn * (hWm - hWe);
      contour.push([e.b, ez], [cx, za], [e.a, ez]);
    }
    contour.push([-hLm, ez]);
    const tris = THREE.ShapeUtils.triangulateShape(contour.map((q) => new THREE.Vector2(q[0], q[1])), []);
    for (const [i, j, m] of tris) {
      const A = contour[i],
        B = contour[j],
        C = contour[m];
      T(rp, ru, slopeLift(A[0], A[1]), slopeLift(B[0], B[1]), slopeLift(C[0], C[1]), uvS(A[0], A[1]), uvS(B[0], B[1]), uvS(C[0], C[1]));
    }
  };
  longSlope(1);
  longSlope(-1);

  // ---- main hip ends (±X triangles) -------------------------------------------------------------
  T(rp, ru, [rxR, apexM, 0], [hLm, wallH, hWm], [hLm, wallH, -hWm], [0.5, (hWm * k) / tile], [0, 0], [1, 0]);
  T(rp, ru, [rxL, apexM, 0], [-hLm, wallH, -hWm], [-hLm, wallH, hWm], [0.5, (hWm * k) / tile], [0, 0], [1, 0]);

  // ---- each ext: slopes + cap + walls -----------------------------------------------------------
  for (const e of exts) {
    const sgn = e.side === "+z" ? 1 : -1;
    const hWe = (e.b - e.a) / 2,
      x0 = (e.a + e.b) / 2,
      apexE = wallH + hWe * pitch,
      Zo = hWm + e.length;
    const ze = sgn * hWm,
      zap = sgn * (hWm - hWe),
      zo = sgn * Zo;
    const CEr: V3 = [e.b, wallH, ze],
      CEl: V3 = [e.a, wallH, ze];
    const OEr: V3 = [e.b, wallH, zo],
      OEl: V3 = [e.a, wallH, zo];
    const Vap: V3 = [x0, apexE, zap];
    const ve = (hWe * k) / tile;
    if (e.cap === "gable") {
      const OR: V3 = [x0, apexE, zo];
      Q(rp, ru, CEr, OEr, OR, Vap, [hWm / tile, 0], [Zo / tile, 0], [Zo / tile, ve], [(hWm - hWe) / tile, ve]);
      Q(rp, ru, CEl, Vap, OR, OEl, [hWm / tile, 0], [(hWm - hWe) / tile, ve], [Zo / tile, ve], [Zo / tile, 0]);
      Q(wp, wu, G(e.a, zo), G(e.b, zo), OEr, OEl, uvR[0], uvR[1], uvR[2], uvR[3]);
      T(wp, wu, OEl, OEr, OR, [0, 0], [1, 0], [0.5, 1]);
    } else {
      const zro = sgn * (Zo - hWe);
      const RO: V3 = [x0, apexE, zro];
      Q(rp, ru, CEr, OEr, RO, Vap, [hWm / tile, 0], [Zo / tile, 0], [(Zo - hWe) / tile, ve], [(hWm - hWe) / tile, ve]);
      Q(rp, ru, CEl, Vap, RO, OEl, [hWm / tile, 0], [(hWm - hWe) / tile, ve], [(Zo - hWe) / tile, ve], [Zo / tile, 0]);
      T(rp, ru, RO, OEl, OEr, [0.5, ve], [0, 0], [1, 0]);
      Q(wp, wu, G(e.a, zo), G(e.b, zo), OEr, OEl, uvR[0], uvR[1], uvR[2], uvR[3]);
    }
    // ext side walls
    Q(wp, wu, G(e.b, ze), G(e.b, zo), OEr, CEr, uvR[0], uvR[1], uvR[2], uvR[3]);
    Q(wp, wu, G(e.a, ze), CEl, OEl, G(e.a, zo), uvR[0], uvR[1], uvR[2], uvR[3]);
  }

  // ---- main eave walls (±X full; ±Z split by ext canceled segments) -----------------------------
  Q(wp, wu, G(hLm, -hWm), G(hLm, hWm), [hLm, wallH, hWm], [hLm, wallH, -hWm], uvR[0], uvR[1], uvR[2], uvR[3]);
  Q(wp, wu, G(-hLm, hWm), G(-hLm, -hWm), [-hLm, wallH, -hWm], [-hLm, wallH, hWm], uvR[0], uvR[1], uvR[2], uvR[3]);
  for (const sgn of [1, -1] as const) {
    const ez = sgn * hWm;
    const cuts = exts.filter((e) => (e.side === "+z" ? 1 : -1) === sgn).map((e) => [e.a, e.b] as [number, number]).sort((a, b) => a[0] - b[0]);
    let x = -hLm;
    for (const [a, b] of cuts) {
      if (a > x) Q(wp, wu, G(x, ez), G(a, ez), [a, wallH, ez], [x, wallH, ez], uvR[0], uvR[1], uvR[2], uvR[3]);
      x = Math.max(x, b);
    }
    if (x < hLm) Q(wp, wu, G(x, ez), G(hLm, ez), [hLm, wallH, ez], [x, wallH, ez], uvR[0], uvR[1], uvR[2], uvR[3]);
  }

  return { roof: geom(rp, ru), walls: geom(wp, wu), apex: apexM };
}
