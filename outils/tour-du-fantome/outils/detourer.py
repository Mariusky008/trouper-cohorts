# ✂️ LE DÉTOURAGE d'une photo de la figurine (`figurine.py`) : le fond rose uni, seulement là où il touche les
# bords de la photo (un remplissage depuis les coins), le visage et le cou protégés par les repères de MediaPipe.
# Sort un masque (PNG, niveaux de gris).
#   /usr/bin/python3 -I outils/tour-du-fantome/outils/detourer.py <photo.jpg> <reperes.json> <sortie-masque.png>
import sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PHOTO, REPERES, SORTIE = sys.argv[1:4]
photo = Image.open(PHOTO).convert("RGB")
arr = np.asarray(photo).astype(np.float32)
H, W = arr.shape[:2]
pts = json.load(open(REPERES))["pts"]

coins = np.concatenate([arr[:40, :40].reshape(-1, 3), arr[:40, -40:].reshape(-1, 3), arr[-200:, :25].reshape(-1, 3), arr[-200:, -25:].reshape(-1, 3)])
bg = np.median(coins, axis=0)
# l'écart à la couleur du fond, en tenant compte de sa lumière qui varie un peu (on compare la teinte surtout)
# la TEINTE (couleur sans sa lumière) : l'ombre du fond, plus sombre dans les coins du bas, reste du fond
somme = arr.sum(axis=2, keepdims=True) + 1e-3
teinte = arr / somme
dt = np.sqrt(((teinte - bg / bg.sum()) ** 2).sum(axis=2)) * 1000
lum = somme[..., 0] / bg.sum()
proche = Image.fromarray(np.where((dt < 22) & (lum > 0.45) & (lum < 1.35), 255, 0).astype(np.uint8)).copy()
# le fond = ce qui est proche ET relié aux bords
for x, y in [(2, 2), (W - 3, 2), (2, H - 3), (W - 3, H - 3), (W // 2, 2), (2, H // 2), (W - 3, H // 2)]:
    if proche.getpixel((x, y)) == 255:
        ImageDraw.floodfill(proche, (x, y), 128)
fond = np.array(proche) == 128
masque = Image.fromarray(np.where(fond, 0, 255).astype(np.uint8))

# LE VISAGE ET LE COU, PROTÉGÉS
OVALE = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
dm = ImageDraw.Draw(masque)
ov = [tuple(pts[i]) for i in OVALE]
cx = sum(p[0] for p in ov) / len(ov)
cy = sum(p[1] for p in ov) / len(ov)
ov = [(cx + (x - cx) * 0.97, cy + (y - cy) * 0.97) for x, y in ov]
dm.polygon(ov, fill=255)
mach = [pts[i] for i in (172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397)]
cou = [tuple(mach[0]), *map(tuple, mach), (mach[-1][0], mach[-1][1] + 70), (mach[0][0], mach[0][1] + 70)]
dm.polygon(cou, fill=255)

# des petits trous dans la personne (rien de relié au bord n'est enlevé ailleurs) ; un bord doux
masque = masque.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.3))
masque.save(SORTIE)
print("fond", bg.round(), "part du fond", round(float(fond.mean()), 3))
