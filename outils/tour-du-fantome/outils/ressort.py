"""🪀 SA FIGURINE SUR RESSORT (démo humaine) : ses images (`recu/humain/ressort/` : neutre, parle, clin, rire, louche,
salue — faites en modifiant une même image, donc superposées au pixel près), détourées du fond rose (l'ombre au sol
comprise), et coupées en trois : le BUSTE (tête et torse, jusqu'à la coupelle en bois ; une image par expression ou
geste), le RESSORT (la page l'étire et le comprime), le SOCLE. Tout est exporté dans un même repère, recadré sur ce
qui sert ; `preparer_ressort` rend la géométrie (les points d'attache) pour la page."""
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

from figurine import _sans_liseré

NOMS = ("neutre", "parle", "clin", "rire", "louche", "salue")
# (dans le repère des images, 852 × 1024) : le bas de la coupelle du buste, le haut du socle là où le ressort y entre,
# la colonne du ressort
COUPELLE_Y, SOCLE_Y, RESSORT_X = 737, 893, (392, 462)


def _detourer(im):
    """Le fond = ce qui a la couleur des coins (sa teinte surtout : l'ombre au sol en fait partie) ET touche les bords."""
    a = np.asarray(im).astype(np.float32)
    s = a.sum(axis=2, keepdims=True) + 1
    teinte = a / s   # la couleur sans sa lumière
    coins = np.concatenate([teinte[:30, :30].reshape(-1, 3), teinte[:30, -30:].reshape(-1, 3), teinte[-30:, :30].reshape(-1, 3), teinte[-30:, -30:].reshape(-1, 3)])
    fond = np.median(coins, axis=0)
    ecart = np.sqrt(((teinte - fond) ** 2).sum(axis=2))
    lum = a.mean(axis=2)
    proche = (ecart < .045) & (lum > 60)
    # (l'ombre au sol, autour du socle : plus sombre et un peu plus brune que le fond ; seulement en bas de l'image)
    sol = np.zeros_like(proche); sol[845:, :] = True
    proche |= sol & (ecart < .07) & (lum > 55) & (lum < 118)
    H, W = proche.shape
    vu = np.zeros_like(proche); q = deque()
    for y in range(H):
        for x in (0, W - 1):
            if proche[y, x]: vu[y, x] = True; q.append((y, x))
    for x in range(W):
        for y in (0, H - 1):
            if proche[y, x] and not vu[y, x]: vu[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < H and 0 <= xx < W and not vu[yy, xx] and proche[yy, xx]:
                vu[yy, xx] = True; q.append((yy, xx))
    # (les petits trous de fond enfermés — entre les bras, sous le ressort — : ce qui est très proche du fond, à part)
    trou = (ecart < .03) & (lum > 80) & ~vu
    masque = ~(vu | trou)
    alpha = Image.fromarray((masque * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(.9))
    return alpha


def preparer_ressort(src, sortie):
    alphas, images = {}, {}
    for n in NOMS:
        images[n] = Image.open(f"{src}/{n}.jpg").convert("RGB")
        alphas[n] = _detourer(images[n])
    W, H = images["neutre"].size
    x0, x1 = RESSORT_X
    # LE BUSTE de chaque image : tout ce qui est au-dessus du haut du socle, sauf la colonne du ressort sous la coupelle
    garde = np.ones((H, W), np.float32)
    garde[SOCLE_Y - 40:, :] = 0
    garde[COUPELLE_Y + 2:, x0:x1] = 0
    bustes = {}
    for n in NOMS:
        al = np.asarray(alphas[n]).astype(np.float32) * garde
        bustes[n] = _sans_liseré(images[n], Image.fromarray(al.astype(np.uint8)))
    # le cadre commun des bustes (ce qui est visible dans au moins un)
    union = np.zeros((H, W), bool)
    for n in NOMS:
        union |= np.asarray(bustes[n])[:, :, 3] > 8
    ys, xs = np.where(union)
    bx0, by0, bx1, by1 = int(xs.min()) - 2, int(ys.min()) - 2, int(xs.max()) + 3, int(ys.max()) + 3
    for n in NOMS:
        bustes[n].crop((bx0, by0, bx1, by1)).save(f"{sortie}/buste-{n}.webp", quality=90)
    # LE RESSORT (de l'image neutre) : la colonne entre la coupelle et le socle
    al = np.asarray(alphas["neutre"]).astype(np.float32)
    rs = np.zeros((H, W), np.float32); rs[COUPELLE_Y - 4:SOCLE_Y + 4, x0:x1] = al[COUPELLE_Y - 4:SOCLE_Y + 4, x0:x1]
    _sans_liseré(images["neutre"], Image.fromarray(rs.astype(np.uint8))).crop((x0, COUPELLE_Y - 4, x1, SOCLE_Y + 4)).save(f"{sortie}/ressort.webp", quality=90)
    # LE SOCLE : ce qui est sous le haut du socle ; là où le ressort passait devant, le bois est refait (une ligne prise
    # juste à côté, de chaque côté), le ressort étiré le recouvrira
    so = np.asarray(alphas["neutre"]).astype(np.float32).copy(); so[:SOCLE_Y - 40, :] = 0
    rgb = np.asarray(images["neutre"]).astype(np.float32).copy()
    for y in range(SOCLE_Y - 40, SOCLE_Y + 2):
        g, d = rgb[y, x0 - 4], rgb[y, x1 + 4]
        for x in range(x0, x1):
            u = (x - x0) / (x1 - x0); rgb[y, x] = g * (1 - u) + d * u
        so[y, x0:x1] = np.maximum(so[y, x0 - 4], so[y, x1 + 4])
    ys, xs = np.where(so > 8)
    sx0, sy0, sx1, sy1 = int(xs.min()) - 2, int(ys.min()) - 2, int(xs.max()) + 3, int(ys.max()) + 3
    _sans_liseré(Image.fromarray(rgb.astype(np.uint8)), Image.fromarray(so.astype(np.uint8))).crop((sx0, sy0, sx1, sy1)).save(f"{sortie}/socle.webp", quality=90)
    # la géométrie, dans le repère des images d'origine : où se posent le buste, le ressort, le socle ; où est le menton
    return {"buste": {"x": bx0, "y": by0, "w": bx1 - bx0, "h": by1 - by0}, "coupelle": [(x0 + x1) / 2, COUPELLE_Y],
            "ressort": {"x": x0, "y": COUPELLE_Y - 4, "w": x1 - x0, "h": SOCLE_Y + 8 - COUPELLE_Y},
            "socle": {"x": sx0, "y": sy0, "w": sx1 - sx0, "h": sy1 - sy0, "haut": SOCLE_Y}, "pied": [(x0 + x1) / 2, int(ys.max())],
            "taille": [W, H]}


if __name__ == "__main__":
    import json, sys
    print(json.dumps(preparer_ressort(sys.argv[1], sys.argv[2])))
