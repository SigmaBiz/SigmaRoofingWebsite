#!/usr/bin/env python3
"""sketch.py <address> — the RELIABLE roof diagram for Simple Squares:
  • Overture building-footprint OUTLINE (accurate, bold black)
  • Google Solar FACETS — each plane as a translucent box colored by the compass direction it faces,
    with a downslope arrow + its area/pitch label
  • the headline numbers (squares / pitch / facets / perimeter) in the title
NO interior ridge/hip/valley lines — those aren't reliable from Solar. Saves a PNG into client/public/.
"""
import sys, os, json, subprocess, math
import numpy as np, requests
from shapely.geometry import shape, Point
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

HERE = os.path.dirname(os.path.abspath(__file__))
addr = sys.argv[1] if len(sys.argv) > 1 else "605 NW 115th St, Oklahoma City, OK 73114"
slug = "".join(c if c.isalnum() else "_" for c in addr.split(",")[0]).lower()
key = next(l.split("=", 1)[1].strip() for l in open(os.path.join(HERE, "..", ".env")) if l.startswith("GOOGLE_API_KEY"))
FT, M2SQ, M2SF = 3.28084, 9.290304, 10.7639

g = requests.get("https://maps.googleapis.com/maps/api/geocode/json", params={"address": addr, "key": key}).json()["results"][0]
lng, lat = g["geometry"]["location"]["lng"], g["geometry"]["location"]["lat"]
bi = requests.get("https://solar.googleapis.com/v1/buildingInsights:findClosest",
                  params={"location.latitude": lat, "location.longitude": lng, "key": key}).json()
sp = bi.get("solarPotential", {}); segs = sp.get("roofSegmentStats", [])
cLat = bi.get("center", {}).get("latitude", lat); cLng = bi.get("center", {}).get("longitude", lng)
mLat, mLng = 111_132.0, 111_320.0 * math.cos(math.radians(cLat))
def loc(lo, la): return ((lo - cLng) * mLng * FT, (la - cLat) * mLat * FT)   # → local feet, common origin

areaM2 = sp.get("wholeRoofStats", {}).get("areaMeters2", sum(f.get("stats", {}).get("areaMeters2", 0) for f in segs))
squares = areaM2 / M2SQ
buckets = {}
for f in segs:
    a = f.get("stats", {}).get("areaMeters2", 0); r = round(12 * math.tan(math.radians(f.get("pitchDegrees", 0))))
    buckets[r] = buckets.get(r, 0) + a
modal = max(buckets, key=buckets.get) if buckets else 0

# Overture footprint (accurate outline) + perimeter
om = os.path.expanduser("~/Library/Python/3.9/bin/overturemaps")
bb = f"{lng-0.0009},{lat-0.0008},{lng+0.0009},{lat+0.0008}"
subprocess.run([om, "download", "--bbox", bb, "-f", "geojson", "-o", "/tmp/_sk.geojson", "--type", "building"],
               capture_output=True, text=True, timeout=120)
pt = Point(lng, lat); foot = None
for f in json.load(open("/tmp/_sk.geojson")).get("features", []):
    geo = shape(f["geometry"])
    if geo.contains(pt): foot = geo if foot is None else (foot if foot.area > geo.area else geo)
fc = np.array([loc(x, y) for x, y in foot.exterior.coords]) if foot is not None else None
per = sum(np.hypot(*(fc[i+1] - fc[i])) for i in range(len(fc) - 1)) if fc is not None else 0

# ---- draw ----
fig, ax = plt.subplots(figsize=(9, 9))
for f in segs:
    bbf = f.get("boundingBox", {})
    if not bbf.get("sw"): continue
    x0, y0 = loc(bbf["sw"]["longitude"], bbf["sw"]["latitude"]); x1, y1 = loc(bbf["ne"]["longitude"], bbf["ne"]["latitude"])
    az = f.get("azimuthDegrees", 0); col = plt.cm.hsv((az % 360) / 360.0)
    ax.add_patch(Rectangle((min(x0, x1), min(y0, y1)), abs(x1 - x0), abs(y1 - y0),
                           facecolor=(*col[:3], 0.13), edgecolor=col, lw=2.4, zorder=3))   # the bounding box itself
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    ax.arrow(cx, cy, math.sin(math.radians(az)) * 6, math.cos(math.radians(az)) * 6, head_width=1.8, color=col, zorder=4)
    aft = round(f.get("stats", {}).get("areaMeters2", 0) * M2SF); pr = round(12 * math.tan(math.radians(f.get("pitchDegrees", 0))))
    ax.text(cx, cy, f"{aft} sf\n{pr}/12", ha="center", va="center", fontsize=8, fontweight="bold")
ax.scatter(0, 0, c="k", s=10, zorder=6)                                       # building center (origin)
ax.set_aspect("equal"); ax.grid(alpha=0.15)
ax.set_title(f"{addr.split(',')[0]}\n{squares:.1f} squares  ·  {modal}/12 pitch  ·  {len(segs)} facets  ·  perimeter {per:.0f} ft",
             fontsize=12, fontweight="bold")
ax.set_xlabel("feet   (←W   E→)"); ax.set_ylabel("feet   (S↓   N↑)")
png = os.path.join(HERE, "..", "client", "public", f"sketch_{slug}.png")
fig.tight_layout(); fig.savefig(png, dpi=130)
print(f"squares {squares:.1f}  pitch {modal}/12  facets {len(segs)}  perimeter {per:.0f} ft")
print(f"saved client/public/sketch_{slug}.png")
