#!/usr/bin/env python3
"""
blitz_takeoff.py <address> — PARKINSON BLITZ: does RANSAC-on-free-2019-LiDAR reproduce the EagleView
ridge/hip/valley lengths? If yes → the "build our own" engine is worth it. If no → kill it cheaply.

Pipeline: geocode → crop OK_Panhandle_B1B EPT → UTM14N(m) → isolate the one house (curvature + connected
component) → sequential RANSAC plane segmentation (facets) → adjacent-plane intersections = crease segments
→ classify (ridge=high+horizontal, hip=high+sloped, valley=low+sloped) → sum, compare to truth.

Run:  /Applications/Xcode.app/Contents/Developer/usr/bin/python3 lidar/blitz_takeoff.py "6320 N Warren Ave, Warr Acres, OK"
"""
import json, subprocess, os, sys, urllib.request
import numpy as np, laspy
from pyproj import Transformer
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
ADDR = sys.argv[1] if len(sys.argv) > 1 else "6320 N Warren Ave, Warr Acres, OK"
M = 3.280839895
TRUTH = {"6320 n warren": dict(ridge=90.35, hip=0.0, valley=39.13),
         "4024 n nicklas": dict(ridge=65.18, hip=148.47, valley=47.90)}
key_t = next((v for k, v in TRUTH.items() if k in ADDR.lower()), None)

def geocode(addr):
    key = next(l.split("=", 1)[1].strip() for l in open(os.path.join(HERE, "..", ".env")) if l.startswith("GOOGLE_API_KEY"))
    import requests
    g = requests.get("https://maps.googleapis.com/maps/api/geocode/json", params={"address": addr, "key": key}).json()["results"][0]
    return g["geometry"]["location"]["lng"], g["geometry"]["location"]["lat"]

LNG, LAT = geocode(ADDR)
cx, cy = Transformer.from_crs(4326, 3857, always_xy=True).transform(LNG, LAT)
for wu in ["OK_Panhandle_B1B_2018", "OK_Panhandle_B2_2018", "OK_Panhandle_B1A_2018", "OK_Panhandle_B1C_2018"]:
    u = f"https://s3-us-west-2.amazonaws.com/usgs-lidar-public/{wu}/ept.json"
    b = json.load(urllib.request.urlopen(u)).get("boundsConforming")
    if b[0] <= cx <= b[3] and b[1] <= cy <= b[4]:
        ept = u; break
OUT = os.path.join(HERE, "bt.laz")
json.dump({"pipeline": [
    {"type": "readers.ept", "filename": ept, "bounds": f"([{cx-75},{cx+75}],[{cy-75},{cy+75}])"},
    {"type": "filters.reprojection", "in_srs": "EPSG:3857", "out_srs": "EPSG:6344"},
    {"type": "writers.las", "filename": OUT, "compression": "laszip"}]}, open(os.path.join(HERE, "bt.json"), "w"))
subprocess.run(["pdal", "pipeline", os.path.join(HERE, "bt.json")], capture_output=True, text=True)

gx6, gy6 = Transformer.from_crs(4326, 6344, always_xy=True).transform(LNG, LAT)
las = laspy.read(OUT)
x, y, z = np.asarray(las.x, float), np.asarray(las.y, float), np.asarray(las.z, float)
x0, y0 = x.min(), y.min(); x -= x0; y -= y0
gx, gy = gx6 - x0, gy6 - y0
cl = np.asarray(las.classification)
gz = np.median(z[cl == 2]) if (cl == 2).any() else np.percentile(z, 10)

# isolate: above-eave + planar (curvature) + connected component containing the house
win = (np.abs(x - gx) < 20) & (np.abs(y - gy) < 20) & (z > gz + 1.8) & (z < gz + 9)  # single roof, drop 2-story/trees
P = np.c_[x[win], y[win], z[win]]
tr = cKDTree(P); curv = np.empty(len(P))
for i in range(len(P)):
    nb = P[tr.query(P[i], k=min(14, len(P)))[1]]
    ev = np.linalg.eigvalsh(np.cov((nb - nb.mean(0)).T)); curv[i] = ev[0] / ev.sum()
Pr = P[curv < 0.03]
# connected component (XY link < 1.4 m) seeded at the point nearest the geocode
t2 = cKDTree(Pr[:, :2]); seed = np.argmin((Pr[:, 0] - gx) ** 2 + (Pr[:, 1] - gy) ** 2)
seen = {seed}; stack = [seed]
while stack:
    p = stack.pop()
    for nb in t2.query_ball_point(Pr[p, :2], 1.1):
        if nb not in seen: seen.add(nb); stack.append(nb)
house = Pr[sorted(seen)]
print(f"{ADDR.split(',')[0]}: {len(house):,} roof pts, footprint {np.ptp(house[:,0]):.0f}×{np.ptp(house[:,1]):.0f} m, relief {np.ptp(house[:,2]):.1f} m")

# sequential RANSAC plane segmentation
def fit(pts): c = pts.mean(0); n = np.linalg.svd(pts - c)[2][2]; return n, n @ c
rng = np.random.default_rng(0); rem = house.copy(); facets = []
while len(rem) >= 30 and len(facets) < 16:
    bc, bin_ = 0, None
    for _ in range(400):
        s = rem[rng.choice(len(rem), 3, replace=False)]; n, d = fit(s)
        if abs(n[2]) < 0.25: continue
        inl = np.abs(rem @ n - d) < 0.15
        if inl.sum() > bc: bc, bin_, bn, bd = inl.sum(), inl, n, d
    if bc < 30: break
    n, d = fit(rem[bin_]); inl = np.abs(rem @ n - d) < 0.15
    facets.append(dict(n=n, d=d, pts=rem[inl])); rem = rem[~inl]
# merge coplanar RANSAC splits (same plane fragmented): same normal + close plane
merged = []
for f in facets:
    for m in merged:
        if abs(f["n"] @ m["n"]) > 0.985 and abs(f["n"] @ m["pts"].mean(0) - m["d"]) < 0.3:
            m["pts"] = np.vstack([m["pts"], f["pts"]]); m["n"], m["d"] = fit(m["pts"]); break
    else:
        merged.append(dict(f))
facets = merged
print(f"  RANSAC facets: {len(facets)} (after coplanar merge)")

# crease = adjacent-plane intersection, kept only if boundary pts lie ON the intersection line
out = []
for i in range(len(facets)):
    for j in range(i + 1, len(facets)):
        A, B = facets[i], facets[j]
        dv = np.cross(A["n"], B["n"]); nv = np.linalg.norm(dv)
        if nv < 0.12: continue                          # near-parallel → no clean crease (kills phantom ridges)
        dv /= nv
        p0 = np.linalg.solve(np.array([A["n"], B["n"], dv]), [A["d"], B["d"], 0.0])  # a point on the line
        tA = cKDTree(A["pts"][:, :2]); tB = cKDTree(B["pts"][:, :2])
        bp = np.vstack([A["pts"][tB.query(A["pts"][:, :2])[0] < 1.6],
                        B["pts"][tA.query(B["pts"][:, :2])[0] < 1.6]])
        if len(bp) < 8: continue
        rel = bp - p0; along = rel @ dv
        perp = np.linalg.norm(rel - np.outer(along, dv), axis=1)
        on = bp[perp < 0.6]                              # points actually on the shared edge
        if len(on) < 8: continue
        L = np.ptp(on @ dv) * M
        if L < 3: continue
        midz = on[:, 2].mean(); cz = (A["pts"][:, 2].mean() + B["pts"][:, 2].mean()) / 2
        typ = "ridge" if abs(dv[2]) < 0.18 else ("hip" if midz > cz else "valley")
        out.append((typ, L))

tot = {"ridge": 0.0, "hip": 0.0, "valley": 0.0}
for t, L in out: tot[t] += L
print(f"  creases found: {len(out)}")
print(f"  {'type':7} {'LiDAR ft':>9} {'EV ft':>8} {'Δ':>8}")
for k in ("ridge", "hip", "valley"):
    ev = key_t[k] if key_t else float("nan")
    d = f"{(tot[k]-ev)/ev*100:+.0f}%" if (key_t and ev > 0) else ("✓~0" if tot[k] < 8 else "n/a")
    print(f"  {k:7} {tot[k]:9.0f} {ev:8.1f} {d:>8}")
T = tot["ridge"] + tot["hip"] + tot["valley"]; EVT = sum(key_t.values()) if key_t else float("nan")
print(f"  {'TOTAL':7} {T:9.0f} {EVT:8.1f} {((T-EVT)/EVT*100):+.0f}%" if key_t else "")
