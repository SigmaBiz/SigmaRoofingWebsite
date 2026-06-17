#!/usr/bin/env python3
"""
engine.py <address> — LiDAR roof-reconstruction engine. L1 isolation + L2 region-growing segmentation
(this stage). Renders the segmented facets so we can VERIFY before building creases (L3-L5).

Run:  /Applications/Xcode.app/Contents/Developer/usr/bin/python3 lidar/engine.py "6320 N Warren Ave, Warr Acres, OK"
"""
import json, subprocess, os, sys, urllib.request, math
import numpy as np, laspy
from pyproj import Transformer
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
ADDR = sys.argv[1] if len(sys.argv) > 1 else "6320 N Warren Ave, Warr Acres, OK"
SLUG = "".join(c if c.isalnum() else "_" for c in ADDR.split(",")[0]).lower()

def geocode(addr):
    key = next(l.split("=", 1)[1].strip() for l in open(os.path.join(HERE, "..", ".env")) if l.startswith("GOOGLE_API_KEY"))
    import requests
    g = requests.get("https://maps.googleapis.com/maps/api/geocode/json", params={"address": addr, "key": key}).json()["results"][0]
    return g["geometry"]["location"]["lng"], g["geometry"]["location"]["lat"]

def footprint(lng, lat):
    """Overture Maps building polygon (MS ML + Google + OSM) containing the point, in lat/lng, or None."""
    om = os.path.expanduser("~/Library/Python/3.9/bin/overturemaps")
    bb = f"{lng-0.0009},{lat-0.0008},{lng+0.0009},{lat+0.0008}"
    r = subprocess.run([om, "download", "--bbox", bb, "-f", "geojson", "-o", "/tmp/_foot.geojson", "--type", "building"],
                       capture_output=True, text=True, timeout=120)
    if r.returncode != 0: return None
    from shapely.geometry import shape, Point
    pt = Point(lng, lat)
    for f in json.load(open("/tmp/_foot.geojson")).get("features", []):
        g = shape(f["geometry"])
        if g.contains(pt): return g
    return None

LNG, LAT = geocode(ADDR)
cx, cy = Transformer.from_crs(4326, 3857, always_xy=True).transform(LNG, LAT)
for wu in ["OK_Panhandle_B1B_2018", "OK_Panhandle_B2_2018", "OK_Panhandle_B1A_2018", "OK_Panhandle_B1C_2018"]:
    u = f"https://s3-us-west-2.amazonaws.com/usgs-lidar-public/{wu}/ept.json"
    b = json.load(urllib.request.urlopen(u)).get("boundsConforming")
    if b[0] <= cx <= b[3] and b[1] <= cy <= b[4]: ept = u; break
OUT = os.path.join(HERE, f"e_{SLUG}.laz")
json.dump({"pipeline": [
    {"type": "readers.ept", "filename": ept, "bounds": f"([{cx-60},{cx+60}],[{cy-60},{cy+60}])"},
    {"type": "filters.reprojection", "in_srs": "EPSG:3857", "out_srs": "EPSG:6344"},
    {"type": "writers.las", "filename": OUT, "compression": "laszip"}]}, open(os.path.join(HERE, "e.json"), "w"))
subprocess.run(["pdal", "pipeline", os.path.join(HERE, "e.json")], capture_output=True, text=True)

gx6, gy6 = Transformer.from_crs(4326, 6344, always_xy=True).transform(LNG, LAT)
las = laspy.read(OUT)
x, y, z = np.asarray(las.x, float), np.asarray(las.y, float), np.asarray(las.z, float)
cl = np.asarray(las.classification)
order = np.lexsort((z, y, x))         # canonical point order → reproducible regardless of EPT parallel-read order
x, y, z, cl = x[order], y[order], z[order], cl[order]   # (kills the run-to-run Crest ridge 72↔104 flip at the source)
x0, y0 = x.min(), y.min(); x -= x0; y -= y0
gx, gy = gx6 - x0, gy6 - y0
gz = np.median(z[cl == 2]) if (cl == 2).any() else np.percentile(z, 10)

# ---------- L1: footprint-clipped single-building isolation ----------
foot = footprint(LNG, LAT)
if foot is not None:
    import shapely.vectorized
    from shapely.ops import transform as shp_transform
    T64 = Transformer.from_crs(4326, 6344, always_xy=True)
    def _loc(lo, la):
        xx, yy = T64.transform(lo, la); return (np.asarray(xx) - x0, np.asarray(yy) - y0)
    foot_l = shp_transform(_loc, foot).buffer(0.8)          # local UTM, +0.8m for roof overhang
    inside = shapely.vectorized.contains(foot_l, x, y); iso = "footprint"
else:
    inside = (np.abs(x - gx) < 18) & (np.abs(y - gy) < 18); iso = "window-fallback"
m = inside & (z > gz + 2.0) & (z < gz + 11)
X = np.c_[x[m], y[m], z[m]]
# per-1m-cell Z-spread → drop tree/edge cells (canopy spans many Z; a roof plane does not)
cellz = {}
ci = np.floor(X[:, 0]).astype(int); cj = np.floor(X[:, 1]).astype(int)
from collections import defaultdict
cz = defaultdict(list)
for k in range(len(X)): cz[(ci[k], cj[k])].append(X[k, 2])
spread = np.array([max(cz[(ci[k], cj[k])]) - min(cz[(ci[k], cj[k])]) for k in range(len(X))])
# normals + curvature (PCA on KNN)
tree = cKDTree(X); K = 16
nrm = np.zeros((len(X), 3)); curv = np.zeros(len(X))
nbrs = tree.query(X, k=min(K, len(X)))[1]
for k in range(len(X)):
    P = X[nbrs[k]]; w, v = np.linalg.eigh(np.cov((P - P.mean(0)).T))
    nrm[k] = v[:, 0] * (1 if v[2, 0] >= 0 else -1); curv[k] = w[0] / w.sum()
roofish = (curv < 0.05) & (spread < 2.2)
house = np.where(roofish)[0]      # footprint already isolates the ONE building → no connected-component / split needed
Xh, Nh, Ch = X[house], nrm[house], curv[house]
print(f"{ADDR.split(',')[0]}: L1[{iso}] → {len(Xh):,} roof pts, footprint {np.ptp(Xh[:,0]):.0f}×{np.ptp(Xh[:,1]):.0f} m, relief {np.ptp(Xh[:,2]):.1f} m")

# ---------- L2: region-growing plane segmentation ----------
th = cKDTree(Xh); nb_h = th.query_ball_tree(th, 1.2)
label = -np.ones(len(Xh), int)
COST = math.cos(math.radians(13)); planes = []
for s in np.argsort(Ch):                         # flattest seeds first
    if label[s] >= 0: continue
    rl = len(planes); rn = Nh[s].copy(); rp = Xh[s].copy()
    label[s] = rl; q = [s]; mem = [s]
    while q:
        p = q.pop()
        for nb in nb_h[p]:
            if label[nb] < 0 and abs(Nh[nb] @ rn) > COST and abs((Xh[nb] - rp) @ rn) < 0.22:
                label[nb] = rl; q.append(nb); mem.append(nb)
    if len(mem) >= 20:
        pts = Xh[mem]; c = pts.mean(0); v = np.linalg.eigh(np.cov((pts - c).T))[1][:, 0]
        planes.append(dict(n=v * (1 if v[2] >= 0 else -1), d=(v * (1 if v[2] >= 0 else -1)) @ c, idx=np.array(mem)))
    else:
        label[mem] = -2
# assign leftovers to nearest plane (within 0.45m of the plane and 3m of an inlier)
for k in np.where(label < 0)[0]:
    best, bd = -1, 0.3
    for fi, f in enumerate(planes):
        dd = abs(Xh[k] @ f["n"] - f["d"])
        if dd < bd and th.query(Xh[k])[0] < 2: bd, best = dd, fi
    if best >= 0: label[k] = best
for fi, f in enumerate(planes): f["idx"] = np.where(label == fi)[0]
# L2b: merge coplanar + spatially-adjacent fragments of the same physical plane
def refit(idx):
    pts = Xh[idx]; c = pts.mean(0); v = np.linalg.eigh(np.cov((pts - c).T))[1][:, 0]
    n = v * (1 if v[2] >= 0 else -1); return n, n @ c
changed = True
while changed:
    changed = False
    for i in range(len(planes)):
        if planes[i] is None: continue
        for j in range(i + 1, len(planes)):
            if planes[j] is None: continue
            A, B = planes[i], planes[j]
            if abs(A["n"] @ B["n"]) < 0.985: continue                      # same orientation
            bc, ac = Xh[B["idx"]].mean(0), Xh[A["idx"]].mean(0)
            if abs(bc @ A["n"] - A["d"]) > 0.35 or abs(ac @ B["n"] - B["d"]) > 0.35: continue  # coplanar
            if cKDTree(Xh[A["idx"], :2]).query(Xh[B["idx"], :2])[0].min() > 2.2: continue       # adjacent
            A["idx"] = np.concatenate([A["idx"], B["idx"]]); A["n"], A["d"] = refit(A["idx"])
            planes[j] = None; changed = True
    planes = [p for p in planes if p is not None]
planes = [f for f in planes if len(f["idx"]) >= 20]
pitch = lambda f: math.degrees(math.acos(min(1, abs(f["n"][2]))))
print(f"  L2 → {len(planes)} facets:")
for fi, f in enumerate(planes):
    az = (math.degrees(math.atan2(f["n"][0], f["n"][1])) + 180) % 360
    print(f"    facet {fi}: {len(f['idx'])} pts, pitch {pitch(f):.0f}°, aspect {az:.0f}°")

# ---------- L3 adjacency + L4 crease + L5 classify ----------
M = 3.280839895
TRUTH = {"6320 n warren": (90.35, 0.0, 39.13), "4024 n nicklas": (65.18, 148.47, 47.90), "crest ridge": (58.0, 191.0, 87.0)}
kt = next((v for k, v in TRUTH.items() if k in ADDR.lower()), None)
# L3 TOPOLOGY: label EVERY footprint point to its nearest facet PLANE (incl. the crease-zone points the
# curvature filter drops) → a complete facet LABEL MAP. Creases = boundaries between labels, so the crease
# network is COMPLETE (valleys can't be missed by sparse interior-point adjacency).
Pall = X                                                  # all footprint + above-eave points (pre-curvature-filter)
Npl = len(planes)
Dpl = np.vstack([np.abs(Pall @ planes[i]["n"] - planes[i]["d"]) for i in range(Npl)])  # (Npl, len) point→plane dist
lab = np.argmin(Dpl, axis=0)
lab[(Dpl[lab, np.arange(len(Pall))] > 0.4) | (spread > 3.0)] = -1   # far from every plane or tree-cell → unlabeled
for i in range(Npl): planes[i]["fidx"] = np.where(lab == i)[0]
Tall = cKDTree(Pall[:, :2]); nbr = Tall.query_ball_tree(Tall, 0.9)
pair_pts = defaultdict(set)
for k in range(len(Pall)):
    a = lab[k]
    if a < 0: continue
    for q in nbr[k]:
        b = lab[q]
        if b > a: pair_pts[(a, b)].add(k); pair_pts[(a, b)].add(q)
if os.environ.get("DUMP"):   # cache segmented geometry so the node-graph blitz iterates without re-streaming LiDAR
    import pickle
    pickle.dump(dict(
        planes=[dict(n=p["n"], d=p["d"], fidx=p["fidx"]) for p in planes],
        Pall=Pall, lab=lab, pairs={k: np.array(sorted(v)) for k, v in pair_pts.items()},
        pitch=[pitch(p) for p in planes], foot_wkt=(foot_l.wkt if foot is not None else ""),
        x0=x0, y0=y0, gx=gx, gy=gy, M=M, kt=kt, slug=SLUG,
    ), open(os.path.join(HERE, f"dump_{SLUG}.pkl"), "wb"))
    print(f"  [DUMP] wrote dump_{SLUG}.pkl ({Npl} facets, {len(Pall)} pts)")
hx = cKDTree(Pall[:, :2]); raw = []
for (i, j), idxset in pair_pts.items():
    if len(idxset) < 6 or len(planes[i]["fidx"]) < 12 or len(planes[j]["fidx"]) < 12: continue
    A, B = planes[i], planes[j]
    dv = np.cross(A["n"], B["n"]); nv = np.linalg.norm(dv)
    if nv < 0.35: continue                                   # require a REAL fold (~20°+ dihedral)
    dv = dv / nv
    bp = Pall[list(idxset)]
    p0 = np.linalg.solve(np.array([A["n"], B["n"], dv]), [A["d"], B["d"], 0.0])
    rel = bp - p0
    on = bp[np.linalg.norm(rel - np.outer(rel @ dv, dv), axis=1) < 0.8]   # boundary pts ON the shared edge
    if len(on) < 5: continue
    son = (on - p0) @ dv
    sA = (Pall[A["fidx"]] - p0) @ dv; sB = (Pall[B["fidx"]] - p0) @ dv     # crease extent = facets' overlap along the line
    lo = max(sA.min(), sB.min(), son.min() - 0.8); hi = min(sA.max(), sB.max(), son.max() + 0.8)
    if hi - lo < 1.6: continue                               # min ~5ft crease → kills point-contact slivers at peaks
    L = (hi - lo) * M
    a3, b3 = p0 + lo * dv, p0 + hi * dv; cc = (a3 + b3) / 2
    za, zb = Pall[A["fidx"], 2], Pall[B["fidx"], 2]          # crease height vs EACH facet's own spread
    hiC = cc[2] >= np.percentile(za, 52) and cc[2] >= np.percentile(zb, 52)
    loC = cc[2] <= np.percentile(za, 48) and cc[2] <= np.percentile(zb, 48)
    if hiC:   typ = "ridge" if abs(dv[2]) < 0.20 else "hip"
    elif loC: typ = "valley"
    else:     continue
    raw.append([typ, L, a3, b3, dv])

# dedup: merge collinear + close creases (the same physical line from over-segmented facet pairs)
creases = []; used = [False] * len(raw)
for i in range(len(raw)):
    if used[i]: continue
    di = raw[i][4]; ai = raw[i][2]; grp = [i]
    for j in range(i + 1, len(raw)):
        if used[j]: continue
        if abs(di @ raw[j][4]) < 0.92: continue              # collinear → same physical line (junction simplification)
        pj = [np.linalg.norm((p - ai) - ((p - ai) @ di) * di) for p in (raw[j][2], raw[j][3], (raw[j][2] + raw[j][3]) / 2)]
        if min(pj) < 2.5: grp.append(j)
    pts = []
    for g in grp: pts += [raw[g][2], raw[g][3]]; used[g] = True
    proj = [(p - ai) @ di for p in pts]; a = ai + min(proj) * di; b = ai + max(proj) * di
    typ = raw[max(grp, key=lambda g: raw[g][1])][0]
    creases.append((typ, np.linalg.norm(b - a) * M, a, b))

tot = {"ridge": 0.0, "hip": 0.0, "valley": 0.0}
for t_, L, _, _ in creases: tot[t_] += L
print(f"  L3-5 → {len(creases)} creases (from {len(raw)} raw)")
print(f"  {'type':8}{'LiDAR':>8}{'EV':>8}{'Δ':>8}")
for ii, k_ in enumerate(("ridge", "hip", "valley")):
    ev = kt[ii] if kt else float("nan")
    d = (f"{(tot[k_]-ev)/ev*100:+.0f}%" if (kt and ev > 0) else ("✓~0" if tot[k_] < 8 else "n/a"))
    print(f"  {k_:8}{tot[k_]:8.0f}{ev:8.1f}{d:>8}")

try:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, 2, figsize=(16, 7.5))
    cols = plt.cm.tab20(np.linspace(0, 1, max(len(planes), 1)))
    for fi, f in enumerate(planes): ax[0].scatter(Pall[f["fidx"], 0], Pall[f["fidx"], 1], s=8, color=cols[fi % 20])
    ax[0].set_aspect("equal"); ax[0].set_title(f"facet label-map ({len(planes)} facets)")
    ax[1].scatter(Pall[lab >= 0, 0], Pall[lab >= 0, 1], s=4, color="0.8")
    cc = {"ridge": "red", "hip": "darkorange", "valley": "blue"}
    for t_, L, a, b in creases:
        ax[1].plot([a[0], b[0]], [a[1], b[1]], color=cc[t_], lw=2.5)
    ax[1].set_aspect("equal"); ax[1].set_title(f"L4-5 creases — red=ridge orange=hip blue=valley")
    fig.tight_layout(); png = os.path.join(HERE, f"engine_{SLUG}.png"); fig.savefig(png, dpi=130)
    print(f"  rendered: {png}")
except Exception as e:
    print(f"  (render skipped: {e})")
