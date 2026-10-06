"""Prépare les poses des looks : tasse, main levée et yeux fermés au même cadrage, bras ouverts à part.
Usage : preparer-looks.py <dossier des .png reçus> <public/direct/ensemble>"""
import sys, json
import numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
L = {
 "cosy": ("Cosy", "Cosy 3", None, "Cosy 2"),
 "curieux": ("Curieux", "Curieux 2", None, "Curieux 3"),
 "denim": ("Denim", "Denim 2", None, "Denim 3"),
 "fleuri": ("Fleuri", "Fleuri 2", None, "Fleuri 3"),
 "jardinier": ("Jardinier 2", "Jardinier 3", None, "Jardinier"),
 "lecteur": ("Lecteur", "Lecteur 4", "Lecteur 2", "Lecteur 3"),
 "melomane": ("Mélomane", "Mélomane 2", None, "Mélomane 3"),
 "rebelle": ("Rebelle", "Rebelle 3", None, "Rebelle 2"),
 "soleil": ("Soleil", "Soleil 2", None, "Soleil 3"),
 "voyageur": ("Voyageur", "Voyageur 3", None, "Voyageur 2"),
 "artiste": ("artiste", "artiste 3", "artiste 4", "artiste 2"),
}
HMAX = 780
def ouvrir(n): return Image.open(f"{src}/{n}.png").convert("RGBA")
def boite(im): return im.split()[3].point(lambda v: 255 if v > 12 else 0).getbbox()
info = {}
for id_, (tasse, salut, cligne, bras) in L.items():
    groupe = [ouvrir(n) for n in (tasse, salut, cligne) if n]
    bbs = [boite(i) for i in groupe]
    bb = (min(b[0] for b in bbs), min(b[1] for b in bbs), max(b[2] for b in bbs), max(b[3] for b in bbs))
    k = min(1, HMAX / (bb[3] - bb[1]))
    taille = (round((bb[2] - bb[0]) * k), round((bb[3] - bb[1]) * k))
    for im, nom in zip(groupe, ["assis", "salue", "cligne"]):
        im.crop(bb).resize(taille, Image.LANCZOS).save(f"{dst}/{id_}-{nom}.webp", quality=88, method=6)
    d = ouvrir(bras); b = boite(d); kd = min(1, HMAX / (b[3] - b[1]))
    d.crop(b).resize((round((b[2] - b[0]) * kd), round((b[3] - b[1]) * kd)), Image.LANCZOS).save(f"{dst}/{id_}-debout.webp", quality=88, method=6)
    info[id_] = {"r": round(taille[0] / taille[1], 3), "cligne": bool(cligne)}
print(json.dumps(info))
