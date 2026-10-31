"""🪀 SA FIGURINE SUR RESSORT (démo humaine) : ses images (`recu/humain/ressort/` : neutre, parle, clin, rire, louche,
salue — faites en modifiant une même image, donc superposées au pixel près), détourées du fond rose (l'ombre au sol
comprise), et coupées en morceaux : sa TÊTE (une par expression : la page la change sans toucher au reste), son CORPS
jusqu'à la coupelle en bois (un par geste : mains jointes, bras ouverts, bras croisés, salut), le RESSORT (la page
l'étire, le comprime et le courbe), le SOCLE. `preparer_ressort` rend leurs cadres et leurs points d'attache."""
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

from figurine import _sans_liseré

NOMS = ("neutre", "parle", "clin", "rire", "louche", "salue")
# (dans le repère des images, 852 × 1024) : le bas de la coupelle du buste, le haut du socle là où le ressort y entre,
# la colonne du ressort
COUPELLE_Y, SOCLE_Y, RESSORT_X = 737, 893, (392, 462)


def _fond_lisse(a, H, W):
    """Le fond (rendu : l'image du fond seul), en couleur, comme une surface lisse (un polynôme de degré 3 en x et y, par canal), ajustée sur les bords
    de l'image au-dessus du sol (deux passes : la seconde sans ce qui s'en écarte — le bout des doigts qui dépasse)."""
    yy, xx = np.mgrid[0:H, 0:W]
    X, Y = xx / W, yy / H
    F = np.stack([np.ones_like(X), X, Y, X * X, X * Y, Y * Y, X ** 3, Y ** 3, X * X * Y, X * Y * Y], -1)
    sur = np.zeros((H, W), bool); sur[:840, :40] = True; sur[:840, -40:] = True; sur[:40, :] = True
    for _ in range(2):
        mod = np.stack([F @ np.linalg.lstsq(F[sur], a[..., c][sur], rcond=None)[0] for c in range(3)], -1)
        sur &= np.sqrt(((a - mod) ** 2).sum(-1)) < 20
    return mod


def _sans_miettes(m, mini=3000):
    """Les gros morceaux d'un seul tenant (la figurine, le socle — le ressort, ajouré, ne les relie pas toujours —),
    sans les miettes de fond restées à côté."""
    H, W = m.shape
    lab = np.zeros((H, W), np.int32); tailles = [0]
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]:
            continue
        n = len(tailles); lab[y0, x0] = n; q = deque([(y0, x0)]); k = 0
        while q:
            y, x = q.popleft(); k += 1
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; q.append((yy, xx))
        tailles.append(k)
    return np.isin(lab, [i for i, k in enumerate(tailles) if i and k >= mini])


def _detourer(im):
    """Le fond = ce qui a sa couleur ET touche les bords. Sa couleur : le fond lisse (`_fond_lisse`) ; la teinte seule
    ne suffit pas (la peau dans l'ombre, au bord du visage, a presque la teinte du rose). Au sol, l'ombre (plus sombre,
    plus brune) se reconnaît à sa teinte."""
    a = np.asarray(im).astype(np.float32)
    H, W = a.shape[:2]
    s = a.sum(axis=2, keepdims=True) + 1
    teinte = a / s   # la couleur sans sa lumière
    coins = np.concatenate([teinte[:30, :30].reshape(-1, 3), teinte[:30, -30:].reshape(-1, 3), teinte[-30:, :30].reshape(-1, 3), teinte[-30:, -30:].reshape(-1, 3)])
    ecart = np.sqrt(((teinte - np.median(coins, axis=0)) ** 2).sum(axis=2))
    lum = a.mean(axis=2)
    # (loin de sa couleur exacte, le fond reste plus bleu que vert ; la peau à l'ombre — ses doigts — non)
    d = np.sqrt(((a - _fond_lisse(a, H, W)) ** 2).sum(-1))
    proche = (d < 10) | ((d < 24) & (a[..., 2] > 1.06 * a[..., 1]))
    sol = np.zeros_like(proche); sol[845:, :] = True
    proche |= sol & (((ecart < .045) & (lum > 60)) | ((ecart < .07) & (lum > 55) & (lum < 118)))
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
    # (les petits trous de fond enfermés, entre les spires du ressort : ce qui est très proche du fond, là seulement —
    # plus haut, la peau rosée du cou et des mains a presque la teinte du fond)
    trou = (ecart < .03) & (lum > 80) & ~vu
    trou[:COUPELLE_Y, :] = False
    masque = _sans_miettes(~(vu | trou))
    alpha = Image.fromarray((masque * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(.9))
    return alpha


TETES = ("neutre", "parle", "clin", "rire", "louche")   # ses expressions (la tête de l'image)
CORPS = ("neutre", "rire", "louche", "salue")            # ses gestes (le corps : mains jointes, bras ouverts, croisés, salut)
MENTON = (426, 448)


def _zone_tete(H, W):
    """La pièce de la tête : le crâne et le visage (un rectangle, loin des bras), la mâchoire et le cou (une ellipse),
    adoucie au bord ; et la même, nette et un peu rentrée (là où le corps est effacé : sous le fondu, il reste)."""
    yy, xx = np.mgrid[0:H, 0:W]
    m = np.zeros((H, W), np.float32)
    m[30:400, 280:574] = 1
    m[((xx - 426) / 108) ** 2 + ((yy - 400) / 80) ** 2 <= 1] = 1
    doux = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
    return doux, doux > .995


def preparer_ressort(src, sortie):
    """Exporte (préfixe `jouet-`) : une tête par expression, un corps par geste, le ressort, le socle — chacun recadré
    sur ce qui sert — et rend leurs cadres et leurs points d'attache, dans le repère des images d'origine."""
    alphas, images = {}, {}
    for n in NOMS:
        images[n] = Image.open(f"{src}/{n}.jpg").convert("RGB")
        alphas[n] = _detourer(images[n])
    W, H = images["neutre"].size
    x0, x1 = RESSORT_X
    # LE BUSTE : tout ce qui est au-dessus du haut du socle, sauf la colonne du ressort sous la coupelle
    garde = np.ones((H, W), np.float32)
    garde[SOCLE_Y - 40:, :] = 0
    garde[COUPELLE_Y + 2:, x0:x1] = 0
    doux, net = _zone_tete(H, W)

    def exporter(morceaux, nom):
        # (un même cadre pour tous les morceaux d'une sorte : ce qui est visible dans au moins un)
        union = np.zeros((H, W), bool)
        for im in morceaux.values():
            union |= np.asarray(im)[:, :, 3] > 8
        ys, xs = np.where(union)
        b = (int(xs.min()) - 2, int(ys.min()) - 2, int(xs.max()) + 3, int(ys.max()) + 3)
        for n, im in morceaux.items():
            im.crop(b).save(f"{sortie}/jouet-{nom}-{n}.webp", quality=90)
        return {"x": b[0], "y": b[1], "w": b[2] - b[0], "h": b[3] - b[1]}

    al = {n: np.asarray(alphas[n]).astype(np.float32) * garde for n in NOMS}
    tetes = exporter({n: _sans_liseré(images[n], Image.fromarray((al[n] * doux).astype(np.uint8))) for n in TETES}, "tete")
    corps = exporter({n: _sans_liseré(images[n], Image.fromarray((al[n] * ~net).astype(np.uint8))) for n in CORPS}, "corps")
    # LE RESSORT (de l'image neutre) : la colonne entre la coupelle et le socle
    a = np.asarray(alphas["neutre"]).astype(np.float32)
    rs = np.zeros((H, W), np.float32); rs[COUPELLE_Y - 4:SOCLE_Y + 4, x0:x1] = a[COUPELLE_Y - 4:SOCLE_Y + 4, x0:x1]
    _sans_liseré(images["neutre"], Image.fromarray(rs.astype(np.uint8))).crop((x0, COUPELLE_Y - 4, x1, SOCLE_Y + 4)).save(f"{sortie}/jouet-ressort.webp", quality=90)
    # LE SOCLE : ce qui est sous le haut du socle ; là où le ressort passait devant, le bois est refait (une ligne prise
    # juste à côté, de chaque côté), le ressort étiré le recouvrira
    so = a.copy(); so[:SOCLE_Y - 40, :] = 0
    rgb = np.asarray(images["neutre"]).astype(np.float32).copy()
    for y in range(SOCLE_Y - 40, SOCLE_Y + 2):
        g, d = rgb[y, x0 - 4], rgb[y, x1 + 4]
        for x in range(x0, x1):
            u = (x - x0) / (x1 - x0); rgb[y, x] = g * (1 - u) + d * u
        so[y, x0:x1] = np.maximum(so[y, x0 - 4], so[y, x1 + 4])
    ys, xs = np.where(so > 8)
    sx0, sy0, sx1, sy1 = int(xs.min()) - 2, int(ys.min()) - 2, int(xs.max()) + 3, int(ys.max()) + 3
    _sans_liseré(Image.fromarray(rgb.astype(np.uint8)), Image.fromarray(so.astype(np.uint8))).crop((sx0, sy0, sx1, sy1)).save(f"{sortie}/jouet-socle.webp", quality=90)
    return {"tete": tetes, "corps": corps, "tetes": TETES, "gestes": CORPS,
            "ressort": {"x": x0, "y": COUPELLE_Y - 4, "w": x1 - x0, "h": SOCLE_Y + 8 - COUPELLE_Y},
            "socle": {"x": sx0, "y": sy0, "w": sx1 - sx0, "h": sy1 - sy0}, "coupelle": [(x0 + x1) / 2, COUPELLE_Y],
            "haut_socle": SOCLE_Y, "pied": [(x0 + x1) / 2, int(ys.max())], "menton": list(MENTON), "taille": [W, H]}


def preparer_carte(src, sortie, recadre, taille):
    """Sa carte de CV : la photo du jouet (l'image neutre, recadrée sur son buste), et la même vide — son fond lisse,
    avec un grain léger comme la photo : la page y dessine le jouet au pixel près (il y parle), qui en sort."""
    im = Image.open(f"{src}/neutre.jpg").convert("RGB")
    a = np.asarray(im).astype(np.float32)
    vide = _fond_lisse(a, *a.shape[:2]) + np.random.default_rng(7).normal(0, 1.4, a.shape)
    im.crop(recadre).resize(taille, Image.LANCZOS).save(f"{sortie}/carte.jpg", quality=88)
    Image.fromarray(np.clip(vide, 0, 255).astype(np.uint8)).crop(recadre).resize(taille, Image.LANCZOS).save(f"{sortie}/carte-sans-tete.jpg", quality=88)


if __name__ == "__main__":
    import json, sys
    print(json.dumps(preparer_ressort(sys.argv[1], sys.argv[2])))
