#!/usr/bin/env python3
"""
skel_blitz.py <slug> — STAGE-1 kill-test: build a GLOBAL roof NODE-GRAPH from the segmented plane
arrangement (cached by engine.py DUMP=1) and measure ridge/hip/valley vs EagleView. Iterates on
cached geometry — NO network — so the node-graph algorithm can be tuned fast.

  DUMP=1 /Applications/Xcode.app/Contents/Developer/usr/bin/python3 lidar/engine.py "<addr>"   # make the dump once
  /Applications/Xcode.app/Contents/Developer/usr/bin/python3 lidar/skel_blitz.py 19428_crest_ridge_dr
"""
import os, sys, pickle, math
import numpy as np
from itertools import combinations
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
slug = sys.argv[1] if len(sys.argv) > 1 else "19428_crest_ridge_dr"
D = pickle.load(open(os.path.join(HERE, f"dump_{slug}.pkl"), "rb"))
planes, Pall, lab, pairs, M, kt = D["planes"], D["Pall"], D["lab"], D["pairs"], D["M"], D["kt"]
Npl = len(planes)
n = [p["n"] for p in planes]; d = [p["d"] for p in planes]; fidx = [p["fidx"] for p in planes]
ftree = [cKDTree(Pall[f][:, :2]) if len(f) else None for f in fidx]
pct = np.percentile

# ---------- adjacency: real folds only ----------
adj = {}
for (i, j), pts in pairs.items():
    if len(pts) < 6: continue
    dv = np.cross(n[i], n[j]); nv = np.linalg.norm(dv)
    if nv < 0.35: continue                      # require ~20°+ dihedral (a real crease, not a coplanar seam)
    adj[(i, j)] = (dv / nv, np.asarray(pts))
adjset = set(adj)

# ---------- NODES: validated 3-facet junctions, clustered when coincident ----------
raw_nodes = []
for i, j, k in combinations(range(Npl), 3):
    tri = {(i, j), (min(j, k), max(j, k)), (min(i, k), max(i, k))}
    if not (tri <= adjset): continue
    Mx = np.array([n[i], n[j], n[k]])
    if abs(np.linalg.det(Mx)) < 0.05: continue
    p = np.linalg.solve(Mx, [d[i], d[j], d[k]])
    if all(ftree[f] is not None and ftree[f].query(p[:2])[0] < 3.0 for f in (i, j, k)):
        raw_nodes.append((p, {i, j, k}))
# cluster nodes within 1.5m (a 4+-facet peak yields several near-coincident triple-nodes → one node)
nodes = []
for p, fs in raw_nodes:
    for nd in nodes:
        if np.linalg.norm(p[:2] - nd["p"][:2]) < 1.5:
            nd["ps"].append(p); nd["facets"] |= fs
            nd["p"] = np.mean(nd["ps"], axis=0); break
    else:
        nodes.append(dict(p=p, ps=[p], facets=set(fs)))
print(f"{slug}: {Npl} facets, {len(adj)} folds, {len(raw_nodes)} raw → {len(nodes)} junction nodes")

# ---------- EDGES: each crease line, extent from support, endpoints SNAPPED to nodes on the line ----------
SNAP = 2.0                                       # snap a crease end to a node within 2m along the line
raw = []
for (i, j), (dv, pts) in adj.items():
    p0 = np.linalg.solve(np.array([n[i], n[j], dv]), [d[i], d[j], 0.0])
    bp = Pall[pts]; rel = bp - p0
    perp = np.linalg.norm(rel - np.outer(rel @ dv, dv), axis=1)
    on = rel[perp < 0.8]
    if len(on) < 5: continue
    son = on @ dv
    sA = (Pall[fidx[i]] - p0) @ dv; sB = (Pall[fidx[j]] - p0) @ dv
    lo = max(sA.min(), sB.min(), son.min() - 0.5); hi = min(sA.max(), sB.max(), son.max() + 0.5)
    if hi - lo < 0.8: continue
    # nodes lying on THIS crease line (share both facets, near the line)
    tnodes = []
    for nd in nodes:
        if {i, j} <= nd["facets"]:
            t = (nd["p"] - p0) @ dv
            if np.linalg.norm((nd["p"] - p0) - t * dv) < 2.0:
                tnodes.append(t)
    if os.environ.get("SNAP"):
        for t in tnodes:                         # snap whichever end is near a node onto it
            if abs(t - lo) < SNAP: lo = t
            if abs(t - hi) < SNAP: hi = t
        if hi - lo < 0.8: continue
    a3, b3 = p0 + lo * dv, p0 + hi * dv; cc = (a3 + b3) / 2
    za, zb = Pall[fidx[i], 2], Pall[fidx[j], 2]
    hiC = cc[2] >= pct(za, 52) and cc[2] >= pct(zb, 52)
    loC = cc[2] <= pct(za, 48) and cc[2] <= pct(zb, 48)
    if hiC:   typ = "ridge" if abs(dv[2]) < 0.20 else "hip"
    elif loC: typ = "valley"
    else:     continue
    raw.append(dict(typ=typ, a=a3, b=b3, dv=dv, ij=(i, j), dv2=abs(dv[2]), L=(hi - lo) * M, ntn=len(tnodes)))
if os.environ.get("DBG"):
    print("  raw edges (type, facets, dv2=|dv.z|, L ft, #nodes-on-line):")
    for r in sorted(raw, key=lambda r: -r["L"]):
        print(f"    {r['typ']:7} {str(r['ij']):8} dv2={r['dv2']:.2f}  L={r['L']:5.1f}  n={r['ntn']}")

# ---------- collapse collinear duplicates by INTERVAL UNION (not sum-with-gaps) ----------
def union_len(segs):
    """segs: list of (a3,b3) collinear; return unioned 3D length in ft."""
    if not segs: return 0.0, []
    dv = segs[0][1] - segs[0][0]; dv = dv / np.linalg.norm(dv); a0 = segs[0][0]
    iv = sorted(((min((a - a0) @ dv, (b - a0) @ dv), max((a - a0) @ dv, (b - a0) @ dv)) for a, b in segs))
    out = [list(iv[0])]
    for s, e in iv[1:]:
        if s <= out[-1][1] + 0.3: out[-1][1] = max(out[-1][1], e)
        else: out.append([s, e])
    L = sum(e - s for s, e in out)
    return L * M, [(a0 + s * dv, a0 + e * dv) for s, e in out]

# group raw edges by type + collinear line, then union
tot = {"ridge": 0.0, "hip": 0.0, "valley": 0.0}; drawn = {"ridge": [], "hip": [], "valley": []}
for typ in tot:
    segs = [(r["a"], r["b"], r["dv"]) for r in raw if r["typ"] == typ]
    used = [False] * len(segs)
    for a in range(len(segs)):
        if used[a]: continue
        grp = [(segs[a][0], segs[a][1])]; used[a] = True
        da, pa = segs[a][2], segs[a][0]
        for b in range(a + 1, len(segs)):
            if used[b]: continue
            if abs(da @ segs[b][2]) < 0.97: continue          # parallel
            pp = min(np.linalg.norm((p - pa) - ((p - pa) @ da) * da) for p in (segs[b][0], segs[b][1]))
            if pp < 1.2:                                      # same physical line
                grp.append((segs[b][0], segs[b][1])); used[b] = True
        L, ivs = union_len(grp)
        tot[typ] += L; drawn[typ] += ivs

print(f"  {'type':8}{'LiDAR':>8}{'EV':>8}{'Δ':>8}")
for ii, k_ in enumerate(("ridge", "hip", "valley")):
    ev = kt[ii] if kt else float("nan")
    dd = (f"{(tot[k_]-ev)/ev*100:+.0f}%" if (kt and ev > 0) else ("✓~0" if tot[k_] < 8 else "n/a"))
    print(f"  {k_:8}{tot[k_]:8.0f}{ev:8.1f}{dd:>8}")

# ---------- render: facet pts (gray) + nodes (black) + edges (colored) ----------
try:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(11, 11))
    cols = plt.cm.tab20(np.linspace(0, 1, max(Npl, 1)))
    for fi in range(Npl):                                    # color pts by facet + annotate facet ID at centroid
        f = fidx[fi]
        if not len(f): continue
        ax.scatter(Pall[f, 0], Pall[f, 1], s=7, color=cols[fi % 20])
        c = Pall[f].mean(0)
        ax.text(c[0], c[1], str(fi), fontsize=13, fontweight="bold", ha="center", va="center",
                bbox=dict(boxstyle="circle", fc="white", ec="black", alpha=0.8))
    cc = {"ridge": "red", "hip": "darkorange", "valley": "blue"}
    for r in raw:                                            # draw each RAW edge with its facet-pair label
        a, b = r["a"], r["b"]; ax.plot([a[0], b[0]], [a[1], b[1]], color=cc[r["typ"]], lw=2.5, alpha=0.7)
        m = (a + b) / 2; ax.text(m[0], m[1], f"{r['ij'][0]}-{r['ij'][1]}", fontsize=7, color=cc[r["typ"]])
    for nd in nodes:
        ax.scatter(nd["p"][0], nd["p"][1], s=80, color="black", zorder=5)
    ax.set_aspect("equal"); ax.set_title(f"{slug}  RAW edges (facet-pair labeled): red=ridge orange=hip blue=valley • black=nodes")
    png = os.path.join(HERE, f"skel_{slug}.png"); fig.savefig(png, dpi=130); print(f"  rendered: {png}")
except Exception as e:
    print(f"  (render skipped: {e})")
