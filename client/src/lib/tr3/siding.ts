import * as THREE from "three";

// Clean painted LAP siding (smooth HardiePlank/clapboard — no wood grain): a flat color with a faint lit top, a soft
// shadow into each board's reveal, and a crisp bottom edge line. SIDING_BOARDS_PER_TILE boards per texture tile.
// Pair with a UV whose V is WORLD HEIGHT (so boards stay level) + repeat of 1/(boards × reveal_ft) — see callers.
export const SIDING_BOARDS_PER_TILE = 12;
export function makeLapSiding(gray: string, shadow: number): THREE.CanvasTexture {
  const W = 16, bh = 64, n = SIDING_BOARDS_PER_TILE, H = bh * n; // narrow (siding is uniform across) × stacked boards
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  x.fillStyle = gray;
  x.fillRect(0, 0, W, H);
  for (let i = 0; i < n; i++) {
    const y = i * bh;
    const g = x.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, "rgba(255,255,255,0.05)"); // board face catches a little light where it stands proud
    g.addColorStop(0.14, "rgba(0,0,0,0)");
    g.addColorStop(0.8, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(18,22,20,${shadow})`); // soft shadow into the reveal (board below)
    x.fillStyle = g;
    x.fillRect(0, y, W, bh);
    x.fillStyle = `rgba(12,15,13,${Math.min(0.6, shadow * 1.7)})`; // crisp shadow line at the board's bottom edge
    x.fillRect(0, y + bh - 2, W, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// SHAKE / shingle siding — "Double 7 Staggered Perfection" cedar-shake look: rectangular shakes (~7" exposure) in STAGGERED
// courses (vertical seams offset course-to-course so joints never align), each with vertical wood grain + slight tonal
// variation, a dark keyway gap on each shake, and a butt-shadow line under every course. One tile = SHAKE_TILE_FT of wall.
// Pair with the SAME wall UV as the lap siding (U = x+z, V = WORLD height) so courses stay LEVEL; repeat = 1/SHAKE_TILE_FT.
// Tiles seamlessly: per-shake RNG is keyed by COLUMN (mod NB) and the stagger offset is constant within a course.
export const SHAKE_TILE_FT: [number, number] = [5 * 0.72, 6 * 0.62]; // [3.6 ft wide, 3.72 ft tall] = 5 shakes × 6 courses
export function makeShakeSiding(base: string, shadow: number): THREE.CanvasTexture {
  const NB = 5, NC = 6, PPI = 100;
  const swp = Math.round(0.72 * PPI), ch = Math.round(0.62 * PPI); // shake width px · course (exposure) px
  const W = NB * swp, H = NC * ch;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const baseC = new THREE.Color(base);
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  const offs = [0, 0.5, 0.18, 0.66, 0.34, 0.82]; // staggered seam offset per course (fraction of a shake width), repeats over NC
  const mk = (seed: number) => { let v = (seed ^ 0x5a3c7) & 0x7fffffff; return () => ((v = (v * 1103515245 + 12345) & 0x7fffffff), v / 0x7fffffff); };
  for (let r = 0; r < NC; r++) {
    const y = r * ch, off = Math.round(offs[r % offs.length] * swp);
    for (let k = -1; k <= NB; k++) {
      const col = ((k % NB) + NB) % NB, rnd = mk(r * 977 + col * 53 + 7); // RNG keyed by column ⇒ seams + tones tile horizontally
      const x = k * swp + off;
      const tone = baseC.clone().offsetHSL((rnd() - 0.5) * 0.014, (rnd() - 0.5) * 0.045, (rnd() - 0.5) * 0.12); // per-shake tone
      g.fillStyle = `#${tone.getHexString()}`;
      g.fillRect(x, y, swp, ch);
      const gn = 6 + ((rnd() * 5) | 0); // vertical wood-grain streaks
      for (let i = 0; i < gn; i++) {
        g.fillStyle = `rgba(${rnd() > 0.5 ? "255,255,255" : "0,0,0"},${0.025 + rnd() * 0.05})`;
        g.fillRect(x + 1 + rnd() * (swp - 2), y, 1, ch);
      }
      const grd = g.createLinearGradient(0, y, 0, y + ch); // relief reads BOTTOM-UP: TOP tucked (recessed) under the course above, proud BUTT lit at the bottom (with the keyway/butt shadow below)
      grd.addColorStop(0, `rgba(8,10,10,${shadow * 0.9})`); // top recessed under the upper course
      grd.addColorStop(0.32, "rgba(0,0,0,0)");
      grd.addColorStop(0.93, "rgba(255,255,255,0.06)"); // proud butt face catches light
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(x, y, swp, ch);
      g.fillStyle = `rgba(8,10,10,${Math.min(0.65, shadow * 1.6)})`; // keyway: dark vertical gap at the shake's right edge
      g.fillRect(x + swp - 1, y, 2, ch);
    }
    g.fillStyle = `rgba(6,8,8,${Math.min(0.8, shadow * 2.1)})`; // butt-shadow line under the whole course
    g.fillRect(0, y + ch - 2, W, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Brick veneer — RUNNING BOND, modular brick (8.5" pitch × 3" course incl. mortar), light mortar bed, per-brick tonal
// variation + a faint top-light/bottom-shade for relief. One texture tile = BRICK_TILE_FT of wall (4 bricks × 8 courses).
// Pair with the SAME wall UV as the siding (U = x+z, V = WORLD height) so courses stay LEVEL; repeat = 1/BRICK_TILE_FT.
export const BRICK_TILE_FT: [number, number] = [4 * (8.5 / 12), 8 * (3 / 12)]; // [≈2.83 ft wide, 2 ft tall]
export function makeBrick(base: string, mortar: string): THREE.CanvasTexture {
  const NB = 4, NC = 8, PPI = 64;
  const W = Math.round(NB * (8.5 / 12) * PPI), H = Math.round(NC * (3 / 12) * PPI);
  const bw = W / NB, ch = H / NC, mort = (0.45 / 12) * PPI; // exact tile fit + a ~0.45" mortar joint
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = mortar;
  g.fillRect(0, 0, W, H); // mortar bed shows in the joints
  let s = 20261;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff), s / 0x7fffffff);
  const baseC = new THREE.Color(base);
  for (let r = 0; r < NC; r++) {
    const y = r * ch, off = (r % 2) * (bw / 2); // every other course offset half a brick (running bond)
    for (let k = -1; k <= NB; k++) {
      const x = k * bw + off; // k=-1..NB so the half-offset bricks wrap the seam
      const col = baseC.clone().offsetHSL((rnd() - 0.5) * 0.02, (rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.16); // per-brick tone
      g.fillStyle = `#${col.getHexString()}`;
      g.fillRect(x + mort / 2, y + mort / 2, bw - mort, ch - mort);
      const grd = g.createLinearGradient(0, y, 0, y + ch); // relief: lit top edge, shaded bottom
      grd.addColorStop(0, "rgba(255,255,255,0.07)");
      grd.addColorStop(0.5, "rgba(0,0,0,0)");
      grd.addColorStop(1, "rgba(0,0,0,0.11)");
      g.fillStyle = grd;
      g.fillRect(x + mort / 2, y + mort / 2, bw - mort, ch - mort);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
