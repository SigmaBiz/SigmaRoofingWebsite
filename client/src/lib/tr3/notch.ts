// "DUMB" notch closure. The open notch is simply the vertical FACE between facet I's raised eave and the wing roof
// sitting below it: max-of-tents hands us the two roof SURFACES but never the vertical face where they butt at different
// heights. So fill it — drop a wall straight from facet I's eave to the first surface below = the wing roof. One right
// triangle per corner, in the eave plane (z=−23). No recess, no fascia, no roof extension. (Rule: walls drop to the
// first surface below — see ROOF-GEOMETRY-RULES.md.)
//
// Crestridge: facet I (p1 south slope) eave z=−23, raised dimI=2 ⇒ 11 ft. G = SE wing, eave x=1 (climbs +x). B = SW
// wing, eave x=−8 (climbs −x). The wing climbs to facet I's eave height (cliff → 0) at xC, so the face is a triangle.
import * as THREE from "three";

type V3 = [number, number, number];

function notchTri(xE: number, dir: number, wallH: number): V3[] {
  const pitch = 2 / 3, dim = 2, zE = -23;
  const eaveHI = wallH + dim;                // facet I eave height (11)
  const xC = xE + dir * (dim / pitch);       // x where the wing reaches facet I's eave height → the cliff closes
  // triangle in the eave plane: wing-eave corner (low) → facet-I-eave corner (the 2-ft drop) → cliff-close corner
  return [[xE, wallH, zE], [xE, eaveHI, zE], [xC, eaveHI, zE]];
}

export function buildNotchWalls(wallH = 9): THREE.BufferGeometry {
  const verts: V3[] = [...notchTri(1, 1, wallH), ...notchTri(-8, -1, wallH)];
  const pos: number[] = [];
  for (const v of verts) pos.push(v[0], v[1], v[2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
