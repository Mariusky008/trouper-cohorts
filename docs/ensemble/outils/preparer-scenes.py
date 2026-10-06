"""Prépare les scènes d'Ensemble : la pièce (fond) et la table découpée (devant).
Usage : preparer-scenes.py <dossier des photos .jpg> <scenes.json> <public/direct/ensemble>"""
import sys, json
import numpy as np
from PIL import Image, ImageFilter
d, conf, dst = sys.argv[1], sys.argv[2], sys.argv[3]
for nom, c in json.load(open(conf)).items():
    fond = Image.open(f'{d}/{nom}.jpg').convert('RGB')
    fond.save(f'{dst}/scene-{nom}.webp', quality=84, method=6)
    w, h = fond.size
    cx, cy, rx, ry = c['table']
    y, x = np.mgrid[0:h, 0:w]
    t = np.clip((x - cx) / rx, -1, 1)
    bord = cy - ry * np.sqrt(1 - t * t)
    m = Image.fromarray(((y >= bord) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))
    haut = int(max(0, (cy - ry) - 12))
    dv = fond.convert('RGBA'); dv.putalpha(m)
    dv.crop((0, haut, w, h)).save(f'{dst}/scene-{nom}-devant.webp', quality=84, method=6)
    print(nom, (w, h), 'devant depuis', haut)
