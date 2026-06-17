#!/usr/bin/env python3
"""perimeter.py <address> — the BEST perimeter tool: the real building-outline polygon (Overture),
reprojected to feet. This is the roof's plan-view perimeter (eaves + rakes outline). Squares/pitch
still come from Solar; this is just the outline. Run with the Xcode python (has shapely/pyproj/requests).
"""
import sys, os, json, subprocess
import requests
from shapely.geometry import shape, Point
from shapely.ops import transform as shp_transform
from pyproj import Transformer

HERE = os.path.dirname(os.path.abspath(__file__))
addr = sys.argv[1] if len(sys.argv) > 1 else "605 NW 115th St, Oklahoma City, OK 73114"
key = next(l.split("=", 1)[1].strip() for l in open(os.path.join(HERE, "..", ".env")) if l.startswith("GOOGLE_API_KEY"))
g = requests.get("https://maps.googleapis.com/maps/api/geocode/json", params={"address": addr, "key": key}).json()["results"][0]
lng, lat = g["geometry"]["location"]["lng"], g["geometry"]["location"]["lat"]

om = os.path.expanduser("~/Library/Python/3.9/bin/overturemaps")
bb = f"{lng-0.0009},{lat-0.0008},{lng+0.0009},{lat+0.0008}"
subprocess.run([om, "download", "--bbox", bb, "-f", "geojson", "-o", "/tmp/_perim.geojson", "--type", "building"],
               capture_output=True, text=True, timeout=120)
pt = Point(lng, lat)
foot = None
for f in json.load(open("/tmp/_perim.geojson")).get("features", []):
    geo = shape(f["geometry"])
    if geo.contains(pt):
        foot = geo if foot is None else (foot if foot.area > geo.area else geo)
if foot is None:
    print("no Overture footprint contains the geocoded point"); sys.exit(1)

T = Transformer.from_crs(4326, 6344, always_xy=True)   # UTM 14N, meters
foot_m = shp_transform(lambda x, y: T.transform(x, y), foot)
M = 3.280839895
per_ft = foot_m.length * M
area_sqft = foot_m.area * 10.7639
nverts = len(foot.exterior.coords) - 1
print(f"\n  {addr}")
print(f"  Overture footprint → PERIMETER {per_ft:.0f} ft  |  footprint area {area_sqft:.0f} sqft  |  {nverts} outline vertices")
# edge lengths, longest first (so it's checkable against a tape)
import numpy as np
r = np.array(foot_m.exterior.coords)
edges = sorted([np.hypot(*(r[i+1]-r[i]))*M for i in range(len(r)-1)], reverse=True)
print(f"  longest edges (ft): {[round(e) for e in edges[:8]]}\n")
