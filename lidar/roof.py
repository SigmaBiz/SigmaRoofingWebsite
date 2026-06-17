#!/usr/bin/env python3
"""
roof.py <address> — can FREE ~2019 OK LiDAR resolve a roof into planar facets / ridges / hips / valleys?

Geocodes the address, finds the covering OK_Panhandle_2018_D18 workunit (it actually covers central OK),
crops the house from the keyless Entwine EPT, reprojects to UTM 14N meters, isolates the planar roof
(tree-rejecting), and renders. Use OLDER homes (existed in 2019):
  Lee   6320 N Warren Ave, Warr Acres OK   (EV: ridges 90.35 / hips 0 / valleys 39.13)
  Hinkle 4024 N Nicklas Ave, Oklahoma City (EV: ridges 65.18 / hips 148.47 / valleys 47.90)

Run:  /Applications/Xcode.app/Contents/Developer/usr/bin/python3 lidar/roof.py "6320 N Warren Ave, Warr Acres, OK"
"""
import json, subprocess, os, sys, urllib.request
import numpy as np, laspy
from pyproj import Transformer
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ADDR = sys.argv[1] if len(sys.argv) > 1 else "6320 N Warren Ave, Warr Acres, OK"
SLUG = "".join(c if c.isalnum() else "_" for c in ADDR.split(",")[0]).lower()

def geocode(addr):
    key = next(l.split("=", 1)[1].strip() for l in open(os.path.join(HERE, "..", ".env")) if l.startswith("GOOGLE_API_KEY"))
    import requests
    j = requests.get("https://maps.googleapis.com/maps/api/geocode/json", params={"address": addr, "key": key}).json()
    g = j["results"][0]
    return g["geometry"]["location"]["lng"], g["geometry"]["location"]["lat"], g["formatted_address"]

LNG, LAT, fmt = geocode(ADDR)
cx, cy = Transformer.from_crs(4326, 3857, always_xy=True).transform(LNG, LAT)
print(f"{fmt}\n  3857=({cx:.0f},{cy:.0f})")

# find the covering workunit (OK_Panhandle_2018_D18 spans central OK despite the name)
WUS = ["OK_Panhandle_B1B_2018", "OK_Panhandle_B2_2018", "OK_Panhandle_B1A_2018", "OK_Panhandle_B1C_2018"]
ept = None
for wu in WUS:
    u = f"https://s3-us-west-2.amazonaws.com/usgs-lidar-public/{wu}/ept.json"
    try:
        b = json.load(urllib.request.urlopen(u)).get("boundsConforming")
        if b[0] <= cx <= b[3] and b[1] <= cy <= b[4]:
            ept = u; print(f"  covered by {wu}"); break
    except Exception:
        pass
if not ept:
    print("  NOT covered by any OK_Panhandle workunit"); sys.exit(1)

HW = 75
OUT = os.path.join(HERE, f"roof_{SLUG}.laz")
pipe = {"pipeline": [
    {"type": "readers.ept", "filename": ept, "bounds": f"([{cx-HW},{cx+HW}],[{cy-HW},{cy+HW}])"},
    {"type": "filters.reprojection", "in_srs": "EPSG:3857", "out_srs": "EPSG:6344"},
    {"type": "writers.las", "filename": OUT, "compression": "laszip"},
]}
json.dump(pipe, open(os.path.join(HERE, "rc.json"), "w"))
r = subprocess.run(["pdal", "pipeline", os.path.join(HERE, "rc.json")], capture_output=True, text=True)
if r.returncode != 0: print("PDAL FAIL:\n", r.stderr[-1500:]); sys.exit(1)

gx6, gy6 = Transformer.from_crs(4326, 6344, always_xy=True).transform(LNG, LAT)
las = laspy.read(OUT)
x, y, z = np.asarray(las.x, float), np.asarray(las.y, float), np.asarray(las.z, float)
x0, y0 = x.min(), y.min(); x -= x0; y -= y0
gx, gy = gx6 - x0, gy6 - y0
cl = np.asarray(las.classification)
gz = np.median(z[cl == 2]) if (cl == 2).any() else np.percentile(z, 10)
print(f"  {len(x):,} pts, {len(x)/(np.ptp(x)*np.ptp(y)):.2f} pts/m², ground ~{gz:.1f} m, geocode local=({gx:.0f},{gy:.0f})")

# window on the house; reject TREES by local PCA curvature (keeps tilted-but-planar roof facets)
win = (np.abs(x - gx) < 22) & (np.abs(y - gy) < 22) & (z > gz + 1.5) & (z < gz + 16)
xs, ys, zs = x[win], y[win], z[win]
P = np.c_[xs, ys, zs]
from scipy.spatial import cKDTree
tree = cKDTree(P); K = min(14, len(P))
curv = np.empty(len(P))
for i in range(len(P)):
    nb = P[tree.query(P[i], k=K)[1]]
    ev = np.linalg.eigvalsh(np.cov((nb - nb.mean(0)).T))
    curv[i] = ev[0] / ev.sum()                 # planar surface → small; tree scatter → large
keep = curv < 0.03                              # planar (roof), any slope; drops trees
rx, ry, rz = xs[keep], ys[keep], zs[keep]
print(f"  ROOF (planar, above-eave): {keep.sum():,} pts  footprint {np.ptp(rx):.0f}×{np.ptp(ry):.0f} m  relief {np.ptp(rz):.1f} m")

try:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, 2, figsize=(16, 7.5))
    w2 = (np.abs(x - gx) < 28) & (np.abs(y - gy) < 28)
    ax[0].scatter(x[w2], y[w2], c=z[w2], s=5, cmap="terrain"); ax[0].set_aspect("equal"); ax[0].set_title(f"{ADDR.split(',')[0]} — 56m (color=elev)")
    if keep.sum():
        sc = ax[1].scatter(rx, ry, c=rz, s=16, cmap="viridis"); ax[1].set_aspect("equal")
        ax[1].set_title(f"ROOF {keep.sum():,} pts — flat color bands=facets, seams=ridge/hip/valley")
        plt.colorbar(sc, ax=ax[1], label="elev m")
    fig.tight_layout(); png = os.path.join(HERE, f"roof_{SLUG}.png"); fig.savefig(png, dpi=130)
    print(f"  rendered: {png}")
except Exception as e:
    print(f"  (render skipped: {e})")
