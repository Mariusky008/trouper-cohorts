# LA TERRASSE AU SOIR — fabriquée depuis public/direct/terrasse-au-soleil.jpg :
# lumière du crépuscule, guirlande guinguette, bougies et lumières lointaines.
# Une retouche de la même photo, en attendant une vraie photo du lieu en soirée.
# Usage : python3 scripts/fabriquer-terrasse-du-soir.py public/direct/terrasse-du-soir.jpg
import numpy as np, math, random, sys
from PIL import Image, ImageFilter, ImageDraw
random.seed(7)
src = Image.open("/home/user/trouper-cohorts/public/direct/terrasse-au-soleil.jpg").convert("RGB")
W, H = src.size
a = np.asarray(src).astype(np.float32) / 255
lum = (0.299*a[...,0] + 0.587*a[...,1] + 0.114*a[...,2])[...,None]
# 1) LE SOIR : les lumières du jour (ciel, mer) deviennent un ciel de crépuscule ; le reste s'assombrit et se réchauffe.
y = np.linspace(0, 1, H)[:, None, None]
yc = np.clip(y / 0.42, 0, 1)
ciel = np.concatenate([0.12 + 0.62*yc**1.6, 0.08 + 0.26*yc**1.8, 0.24 - 0.06*yc], axis=2)  # bleu-violet en haut → braise à l'horizon
ciel = ciel * np.ones((1, W, 1))
haut = np.clip((lum - 0.72) / 0.22, 0, 1) * np.clip((0.46 - y) / 0.08, 0, 1)   # le ciel et la mer, en haut seulement
nuit = a * np.array([0.42, 0.30, 0.30]) * 0.9         # sombre, chaud
nuit = nuit + (lum**1.6) * np.array([0.20, 0.09, 0.02])
# LES TACHES DE SOLEIL DU BAS deviennent des flaques de lumière chaude, pas du ciel.
bas = np.clip((lum - 0.7) / 0.25, 0, 1) * (1 - np.clip((0.46 - y) / 0.08, 0, 1))
nuit = nuit * (1 - bas*0.6) + bas*0.6 * np.array([0.42, 0.22, 0.08])
b = nuit * (1 - haut) + ciel * haut
# 2) LES LUMIÈRES : guirlande en chaînettes, ampoules et halos.
glow = np.zeros((H, W, 3), np.float32)
def halo(cx, cy, r, col, f):
    ys, xs = np.ogrid[:H, :W]
    d2 = ((xs - cx)**2 + (ys - cy)**2) / (r*r)
    glow[...] += np.exp(-d2)[..., None] * np.array(col) * f
fil = Image.new("L", (W, H), 0); dr = ImageDraw.Draw(fil)
ampoules = []
for (x0, y0, x1, y1, sag, n) in [(-20, 40, 330, 70, 70, 9), (300, 60, 560, 30, 55, 7), (-20, 175, 560, 150, 60, 14)]:
    pts = []
    for i in range(61):
        t = i / 60
        x = x0 + (x1 - x0)*t; yy = y0 + (y1 - y0)*t + sag*4*t*(1-t)
        pts.append((x, yy))
    dr.line(pts, fill=150, width=2)
    for k in range(n):
        t = (k + 0.5) / n
        x = x0 + (x1 - x0)*t; yy = y0 + (y1 - y0)*t + sag*4*t*(1-t) + 7
        ampoules.append((x, yy))
filn = np.asarray(fil).astype(np.float32)[..., None] / 255
b = b * (1 - filn*0.85) + filn * np.array([0.05, 0.03, 0.02])
for (x, yy) in ampoules:
    col = random.choice([(1.0, 0.72, 0.35), (1.0, 0.62, 0.28), (1.0, 0.80, 0.50)])
    halo(x, yy, 38, col, 0.22)
    halo(x, yy, 9, col, 0.9)
    halo(x, yy, 3.5, (1, 0.95, 0.85), 1.6)
# 3) LES BOUGIES sur la table et la lumière qu'elles posent.
for (x, yy) in [(205, 322), (90, 345), (300, 360)]:
    halo(x, yy, 70, (1.0, 0.55, 0.22), 0.30)
    halo(x, yy, 10, (1.0, 0.75, 0.40), 0.9)
    halo(x, yy, 3, (1, 0.95, 0.8), 1.4)
# 4) Un peu de bokeh lointain (la ville, les autres tables).
for _ in range(26):
    x = random.uniform(260, W); yy = random.uniform(190, 300)
    halo(x, yy, random.uniform(5, 11), random.choice([(1, 0.7, 0.35), (1, 0.55, 0.3), (0.9, 0.8, 0.6)]), random.uniform(0.25, 0.55))
out = 1 - (1 - b) * (1 - np.clip(glow, 0, 1))         # écran : la lumière s'ajoute sans brûler
# Vignette douce.
yy, xx = np.ogrid[:H, :W]
v = 1 - 0.35 * (((xx - W/2) / (W/1.2))**2 + ((yy - H/2.2) / (H/1.3))**2)
out = np.clip(out * v[..., None], 0, 1)
im = Image.fromarray((out*255).astype(np.uint8))
im.save(sys.argv[1], quality=88)
