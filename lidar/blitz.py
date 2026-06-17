#!/usr/bin/env python3
"""
blitz.py — LiDAR KILL-TEST (path d): is Crestridge's roof recoverable from FREE Oklahoma 3DEP LiDAR?

Data: USGS OK_Statewide_D22 (2022-23), staged LAZ tiles on rockyweb (keyless), CRS = NAD83(2011)
Oklahoma North ftUS (EPSG:6553) — natively in FEET, exactly EagleView's units. Tiles are 5000ft,
named by SW corner. We find Crestridge's tile, download it (cached), crop the house box, and report
whether the roof is there at usable density + planar structure. EagleView truth: ridges 58 / hips 191 / valleys 87.

Run:  /Applications/Xcode.app/Contents/Developer/usr/bin/python3 lidar/blitz.py
"""
import math, json, subprocess, sys, os, urllib.request
import numpy as np
import laspy
from pyproj import Transformer

HERE = os.path.dirname(os.path.abspath(__file__))
LAT, LNG = 35.6691077, -97.5250552
FT = 0.3048                                  # ftUS→m (international ft; 2ppm off ftUS, negligible)
TILE = 5000                                  # ft tiling
HW = 160                                     # crop half-width in ft (~49 m; house + yard)
BASE = "https://rockyweb.usgs.gov/vdelivery/Datasets/Staged/Elevation/LPC/Projects/OK_Statewide_D22/OK_Statewide_{sub}_D22/LAZ/USGS_LPC_OK_Statewide_D22_{tx}_{ty}.laz"

# 1) Crestridge → EPSG:6553 (OK North ftUS), then the 5000ft tile it falls in
X0, Y0 = Transformer.from_crs(4326, 6553, always_xy=True).transform(LNG, LAT)
tx, ty = int(math.floor(X0 / TILE) * TILE), int(math.floor(Y0 / TILE) * TILE)
print(f"Crestridge EPSG:6553 = ({X0:.1f}, {Y0:.1f}) ft  → tile {tx}_{ty}")

# 2) download the tile (try sub-block _2 then _1), cache locally
tile_path = os.path.join(HERE, f"tile_{tx}_{ty}.laz")
if not os.path.exists(tile_path):
    for sub in ("2", "1"):
        url = BASE.format(sub=sub, tx=tx, ty=ty)
        try:
            print(f"  downloading {url.split('/')[-1]} (sub _{sub})...", flush=True)
            urllib.request.urlretrieve(url, tile_path)
            print(f"  got {os.path.getsize(tile_path)/1e6:.0f} MB"); break
        except Exception as e:
            print(f"  sub _{sub} failed: {e}")
    else:
        print("could not download tile"); sys.exit(1)

# 3) crop the house box (in native ftUS — no reprojection; feet = EagleView units)
OUT = os.path.join(HERE, "crestridge.laz")
pipe = {"pipeline": [
    tile_path,
    {"type": "filters.crop", "bounds": f"([{X0-HW},{X0+HW}],[{Y0-HW},{Y0+HW}])"},
    {"type": "writers.las", "filename": OUT, "compression": "laszip"},
]}
json.dump(pipe, open(os.path.join(HERE, "crop.json"), "w"))
r = subprocess.run(["pdal", "pipeline", os.path.join(HERE, "crop.json")], capture_output=True, text=True)
if r.returncode != 0:
    print("PDAL crop FAILED:\n", r.stderr[-2000:]); sys.exit(1)

# 4) analyze (feet)
las = laspy.read(OUT)
x, y, z = np.asarray(las.x), np.asarray(las.y), np.asarray(las.z)
cls = np.asarray(las.classification)
n = len(x)
area_ft2 = (x.max() - x.min()) * (y.max() - y.min())
dens_m2 = n / (area_ft2 * FT * FT)
print(f"\n  CROP: {n:,} pts over {area_ft2*FT*FT:,.0f} m²  →  density {dens_m2:.2f} pts/m²")
print(f"  Z(elev ft): {z.min():.1f} .. {z.max():.1f}  (relief {z.max()-z.min():.1f} ft)")
uc, cc = np.unique(cls, return_counts=True)
names = {1:"unclassified",2:"ground",6:"building",9:"water",7:"noise",5:"high-veg",4:"med-veg",3:"low-veg"}
print("  classification:", ", ".join(f"{names.get(int(c),c)}={k:,}" for c, k in zip(uc, cc)))

# isolate roof: above local ground, near lot center, not vegetation
gmask = cls == 2
gz = np.median(z[gmask]) if gmask.sum() else np.percentile(z, 15)
near = (np.abs(x - X0) < 110) & (np.abs(y - Y0) < 110)
roof = near & (z > gz + 8) & ~np.isin(cls, [3, 4, 5, 7, 9])
rn = int(roof.sum())
print(f"\n  ground elev ~{gz:.1f} ft")
if rn:
    rdens = rn / ((x[roof].max()-x[roof].min())*(y[roof].max()-y[roof].min())*FT*FT)
    print(f"  ROOF candidate: {rn:,} pts  ~{rdens:.1f} pts/m²  footprint {(x[roof].max()-x[roof].min()):.0f}×{(y[roof].max()-y[roof].min()):.0f} ft")
    print(f"  eave ~{z[roof].min()-gz:.1f} ft above grade · ridge ~{z[roof].max()-gz:.1f} ft · roof relief {z[roof].max()-z[roof].min():.1f} ft")
    if "building" in [names.get(int(c)) for c in uc]:
        print(f"  (USGS pre-classified building pts: {int((cls==6).sum()):,})")

# 5) render: top-down height + a slope-shaded view to eyeball facets/ridges
try:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, 2, figsize=(16, 7.5))
    ax[0].scatter(x, y, c=z, s=3, cmap="terrain"); ax[0].set_aspect("equal")
    ax[0].set_title(f"top-down, color=elev ({n:,} pts, {dens_m2:.1f} pts/m²)")
    if rn:
        rx, ry, rz = x[roof], y[roof], z[roof]
        sc = ax[1].scatter(rx, ry, c=rz, s=6, cmap="viridis"); ax[1].set_aspect("equal")
        ax[1].set_title("ROOF pts, color=elev — flat bands=facets, color seams=ridges/hips/valleys")
        plt.colorbar(sc, ax=ax[1], label="elev ft")
    fig.tight_layout(); png = os.path.join(HERE, "crestridge_blitz.png"); fig.savefig(png, dpi=120)
    print(f"\n  rendered: {png}")
except Exception as e:
    print(f"\n  (render skipped: {e})")
