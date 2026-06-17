#!/usr/bin/env python3
"""
skel_fp.py <slug> — STAGE-1 kill-test, FOOTPRINT STRAIGHT-SKELETON route. Takes the clean Overture
footprint (cached in the dump), runs polyskel (Felkel straight skeleton), lifts to 3D at the roof
pitch, classifies each skeleton arc (hip→convex corner, valley→reflex corner, ridge→interior spine),
sums the linear takeoff, compares to EagleView. Sidesteps facet segmentation entirely.

  /Applications/Xcode.app/Contents/Developer/usr/bin/python3 lidar/skel_fp.py 19428_crest_ridge_dr
"""
import os, sys, pickle, math
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import polyskel
from shapely import wkt as shp_wkt
from shapely.geometry import Polygon

HERE = os.path.dirname(os.path.abspath(__file__))
slug = sys.argv[1] if len(sys.argv) > 1 else "19428_crest_ridge_dr"
D = pickle.load(open(os.path.join(HERE, f"dump_{slug}.pkl"), "rb"))
M = D["M"]; kt = D["kt"]; planes = D["planes"]; Pall = D["Pall"]
pitch_deg = float(np.median(D["pitch"]))          # uniform-pitch assumption (Crest 8/12 ≈ 33.7°)
tanp = math.tan(math.radians(pitch_deg)); sinp = math.sin(math.radians(pitch_deg)); cosp = math.cos(math.radians(pitch_deg))

# footprint → simplify (kill ML near-collinear vertices that break polyskel) → CW ring
foot = shp_wkt.loads(D["foot_wkt"])
if foot.geom_type == "MultiPolygon": foot = max(foot.geoms, key=lambda g: g.area)
foot = foot.buffer(-0.8)                          # undo L1's +0.8m overhang buffer → true roof outline (matches EV)
if foot.geom_type == "MultiPolygon": foot = max(foot.geoms, key=lambda g: g.area)
foot = foot.simplify(float(os.environ.get("SIMP", "1.0"))).buffer(0)   # then shed ML-tracing jitter; tuning param
ring = list(foot.exterior.coords)[:-1]            # drop closing dup
if Polygon(ring).exterior.is_ccw: ring = ring[::-1]   # polyskel wants CLOCKWISE
print(f"{slug}: footprint {len(ring)} verts (simplified), pitch {pitch_deg:.1f}° (tan {tanp:.3f})")

sk = polyskel.skeletonize(ring, [])
print(f"  polyskel → {len(sk)} interior nodes")

# node height = inset distance × tan(pitch); polygon vertices are at height 0 (eave)
src = [(np.array([a.source.x, a.source.y]), a.height) for a in sk]
def height_of(pt):                                # 3D z of a 2D skeleton point
    for p, h in src:
        if np.hypot(p[0] - pt[0], p[1] - pt[1]) < 0.05: return h * tanp
    return 0.0                                    # not an interior node → a polygon vertex (eave)

# convex vs reflex polygon vertices (CW ring): cross<0 convex, cross>0 reflex
rv = np.array(ring); npv = len(rv)
reflex = set()
for i in range(npv):
    a, b, c = rv[(i - 1) % npv], rv[i], rv[(i + 1) % npv]
    cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
    if cr > 0: reflex.add(i)
def vtype(pt):                                    # is pt a polygon vertex? convex/reflex, else None (interior node)
    for i, v in enumerate(rv):
        if np.hypot(v[0] - pt[0], v[1] - pt[1]) < 0.05: return "reflex" if i in reflex else "convex"
    return None
# footprint edges (CW): endpoints, unit dir, OUTWARD normal (right of CW dir), polygon index
E = []
for i in range(npv):
    a, b = rv[i], rv[(i + 1) % npv]; dvec = b - a; L = np.hypot(*dvec)
    if L < 1e-9: continue
    dvec = dvec / L; E.append((a, b, dvec, np.array([-dvec[1], dvec[0]]), i))   # OUTWARD normal (CW ring)
def seg_dist(p, a, b):
    ab = b - a; t = np.clip(np.dot(p - a, ab) / max(np.dot(ab, ab), 1e-9), 0, 1)
    return np.linalg.norm(p - (a + t * ab))
def hipvalley(m2):
    """hip vs valley for a SLOPED arc, from its 2 nearest footprint edges (convex corner→hip, reflex→valley)."""
    e1, e2 = sorted(E, key=lambda e: seg_dist(m2, e[0], e[1]))[:2]
    lo, hi = (e1, e2) if e1[4] < e2[4] else (e2, e1)           # CW-ordered edge turn
    cr = lo[2][0] * hi[2][1] - lo[2][1] * hi[2][0]
    return "valley" if cr > 0 else "hip"

# ---- classify arcs (ridge = horizontal interior spine; else hip/valley by nearest edges) ----
arcs = []; seen = set()
for a in sk:
    s2 = np.array([a.source.x, a.source.y]); zs = a.height * tanp
    for sk_pt in a.sinks:
        t2 = np.array([sk_pt.x, sk_pt.y])
        key = tuple(sorted([(round(s2[0], 2), round(s2[1], 2)), (round(t2[0], 2), round(t2[1], 2))]))
        if key in seen: continue
        seen.add(key)
        zt = height_of(t2)
        typ = "ridge" if (vtype(t2) is None and abs(zs - zt) < 0.5) else hipvalley((s2 + t2) / 2)
        if typ == "valley" and min(zs, zt) * M > 4.0:     # a valley DRAINS to an eave; both-ends-aloft = a hip throat, not a valley
            typ = "hip"
        arcs.append([s2, zs, t2, zt, typ])
ridge_arcs = [(ar[0], ar[2]) for ar in arcs if ar[4] == "ridge"]

# ---- GABLE DETECTION: an edge is a GABLE iff (no facet slopes toward it) AND (a ridge runs perpendicular INTO it) ----
fdir = []                                          # (facet face-direction unit vec, facet plan points)
for p in planes:
    nh = np.array(p["n"][:2], float); L = np.linalg.norm(nh)
    pts = Pall[p["fidx"]][:, :2] if len(p["fidx"]) else np.empty((0, 2))
    fdir.append((nh / L if L > 1e-6 else nh, pts))
def faces(p, nout):                                # does any roof facet slope toward outward-normal nout, near point p?
    for nh, pts in fdir:
        if len(pts) and np.dot(nh, nout) > math.cos(math.radians(50)) \
           and np.min(np.hypot(pts[:, 0] - p[0], pts[:, 1] - p[1])) < 4.5: return True
    return False
# a GABLE WALL = a stretch of boundary (possibly only PART of an edge) with no facet sloping toward it.
# (A single flush edge can be half-eave / half-gable where two wings of different height share a line.)
gable_segs = []
for a2, b2, dvec, nout, idx in E:
    L = np.hypot(*(b2 - a2)); ns = max(2, int(round(L)))
    flag = [not faces(a2 + (s + 0.5) / ns * (b2 - a2), nout) for s in range(ns)]    # True = gable sample
    s = 0
    while s < ns:
        if flag[s]:
            e = s
            while e + 1 < ns and flag[e + 1]: e += 1
            p0 = a2 + (s / ns) * (b2 - a2); p1 = a2 + ((e + 1) / ns) * (b2 - a2)
            if np.hypot(*(p1 - p0)) * M >= 6: gable_segs.append((p0, p1))           # ≥6 ft of gable wall
            s = e + 1
        else: s += 1
def near_gable_end(pt):
    return any(np.hypot(*(p0 - pt)) < 1.5 or np.hypot(*(p1 - pt)) < 1.5 for p0, p1 in gable_segs)
print(f"  gable walls: {len(gable_segs)} → {[round(np.hypot(*(p1-p0))*M) for p0,p1 in gable_segs]} ft")

# ---- GABLE CORRECTION: drop phantom hips at gable-wall ends; extend ridge to the wall + add 2 rakes ----
tot = {"ridge": 0.0, "hip": 0.0, "valley": 0.0, "rake": 0.0}
segs = {"ridge": [], "hip": [], "valley": [], "rake": []}
for p0, p1 in gable_segs:
    Mw = (p0 + p1) / 2                              # gable apex = wall midpoint (at ridge height)
    feed = [(ar[0], ar[1]) for ar in arcs if np.hypot(*(ar[2] - p0)) < 1.5 or np.hypot(*(ar[2] - p1)) < 1.5]
    if not feed: continue
    hN = max(z for _, z in feed); N = min((p for p, _ in feed), key=lambda p: np.hypot(*(p - Mw)))
    tot["ridge"] += np.hypot(*(N - Mw)) * M; segs["ridge"].append((N, Mw))          # ridge runs out to the wall
    for c in (p0, p1):                                                              # rakes: apex → wall ends (3D)
        tot["rake"] += math.hypot(np.hypot(*(Mw - c)), hN) * M; segs["rake"].append((Mw, c))
for s2, zs, t2, zt, typ in arcs:                   # tally everything else; gable-wall hips are now rakes
    if typ == "hip" and near_gable_end(t2): continue
    L3 = math.hypot(np.linalg.norm(s2 - t2), zs - zt) * M
    tot[typ] += L3; segs[typ].append((s2, t2))
    if os.environ.get("DBG") and typ == "valley":
        print(f"    valley arc ({s2[0]:.0f},{s2[1]:.0f})z{zs*M:.0f}→({t2[0]:.0f},{t2[1]:.0f})z{zt*M:.0f}: plan {np.linalg.norm(s2-t2)*M:.1f}ft dz {abs(zs-zt)*M:.1f}ft → 3D {L3:.1f}ft")

print(f"  {'type':8}{'LiDAR':>8}{'EV':>8}{'Δ':>8}")
for ii, k_ in enumerate(("ridge", "hip", "valley")):
    ev = kt[ii] if kt else float("nan")
    dd = (f"{(tot[k_]-ev)/ev*100:+.0f}%" if (kt and ev > 0) else "n/a")
    print(f"  {k_:8}{tot[k_]:8.0f}{ev:8.1f}{dd:>8}")
print(f"  {'rake':8}{tot['rake']:8.0f}{'—':>8}{'(no EV)':>8}")
print(f"  {'TOTAL':8}{tot['ridge']+tot['hip']+tot['valley']:8.0f}{sum(kt):8.1f}{(tot['ridge']+tot['hip']+tot['valley']-sum(kt))/sum(kt)*100:+.0f}%")

try:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(10, 10))
    rr = np.array(ring + [ring[0]]); ax.plot(rr[:, 0], rr[:, 1], "k-", lw=1)
    for i in reflex: ax.scatter(rv[i, 0], rv[i, 1], s=80, color="blue", zorder=4)
    cc = {"ridge": "red", "hip": "darkorange", "valley": "blue", "rake": "green"}
    for typ in segs:
        for a, b in segs[typ]: ax.plot([a[0], b[0]], [a[1], b[1]], color=cc[typ], lw=2.6)
    for p, h in src: ax.scatter(p[0], p[1], s=45, color="black", zorder=5)
    ax.set_aspect("equal"); ax.set_title(f"{slug} skeleton+gable: red=ridge orange=hip blue=valley green=rake • black=nodes")
    png = os.path.join(HERE, f"skelfp_{slug}.png"); fig.savefig(png, dpi=130); print(f"  rendered: {png}")
except Exception as e:
    print(f"  (render skipped: {e})")
