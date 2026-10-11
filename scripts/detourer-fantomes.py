"""Détoure les fantômes du dressing (fond blanc → transparent) et les ramène à 852 × 784.

  python3 scripts/detourer-fantomes.py entree1.jpg sortie1.png [entree2.jpg sortie2.png …]

puis, pour l'application, en webp :
  python3 -c "from PIL import Image; Image.open('sortie1.png').save('public/direct/dressing/x.webp', 'WEBP', quality=88, method=6, alpha_quality=95)"

Le fond est ce qu'on atteint depuis les bords en ne traversant que du presque-blanc :
le liseré coloré de chaque fantôme l'arrête, et le corps (presque blanc lui aussi) reste
opaque. Les trous blancs FERMÉS (l'intérieur du cintre, les jours entre les vêtements)
sont retirés aussi, s'ils sont épais et bordés de couleur franche — pas les reflets du
corps, qui se fondent doucement dans le rose. Une bande de quelques pixels au bord garde
le halo, rendu semi-transparent (couleur « dé-blanchie »)."""
import sys
import numpy as np
from PIL import Image

T = 12        # presque blanc (bruit JPEG compris)
BANDE = 8     # px (pleine taille) : la lisière où le halo devient transparent
D0 = 110.0    # au-delà, opaque
CIBLE = (852, 784)

def decale(m, dy, dx):
    r = np.zeros_like(m)
    h, w = m.shape
    r[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = m[max(-dy, 0):h + min(-dy, 0), max(-dx, 0):w + min(-dx, 0)]
    return r

def dilate(m, n=1):
    for _ in range(n):
        m = m | decale(m, 1, 0) | decale(m, -1, 0) | decale(m, 0, 1) | decale(m, 0, -1)
    return m

def erode(m, n=1):
    return ~dilate(~m, n)

def composantes(m):
    """Étiquettes 4-connexes (union-find simple par balayage, numpy pour l'essentiel)."""
    h, w = m.shape
    lab = np.zeros((h, w), dtype=np.int32)
    parent = [0]
    def trouve(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    nxt = 1
    for y in range(h):
        row = m[y]
        xs = np.flatnonzero(row)
        if not xs.size:
            continue
        # segments consécutifs
        coupures = np.flatnonzero(np.diff(xs) > 1)
        debuts = np.r_[xs[0], xs[coupures + 1]]
        fins = np.r_[xs[coupures], xs[-1]]
        for a, b in zip(debuts, fins):
            dessus = lab[y - 1, a:b + 1] if y else np.array([], dtype=np.int32)
            ids = np.unique(dessus[dessus > 0])
            if ids.size:
                r = trouve(int(ids[0]))
                for i in ids[1:]:
                    ri = trouve(int(i))
                    if ri != r:
                        parent[max(ri, r)] = min(ri, r)
                        r = min(ri, r)
                lab[y, a:b + 1] = r
            else:
                parent.append(nxt)
                lab[y, a:b + 1] = nxt
                nxt += 1
    table = np.array([trouve(i) for i in range(nxt)], dtype=np.int32)
    return table[lab]

def detourer(src, dst):
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    d = (255.0 - rgb).max(axis=2)
    blanc = d < T
    lab = composantes(blanc)
    h, w = blanc.shape
    bord = np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])
    bord = bord[bord > 0]
    fond = np.isin(lab, bord)
    # LES TROUS FERMÉS : épais (survivent à une érosion de 4 px), bordés de couleur franche.
    epais = erode(blanc & ~fond, 4)
    retires = 0
    for i in np.unique(lab[epais]):
        if i == 0:
            continue
        c = lab == i
        if c.sum() < 600:
            continue
        anneau = dilate(c, 4) & ~c
        if np.median(d[anneau]) > 55:
            fond |= c
            retires += 1
    # LA LISIÈRE : ce qui n'est pas du fond mais le touche à moins de BANDE px.
    pres = dilate(fond, BANDE) & ~fond
    alpha = np.ones((h, w), dtype=np.float32)
    alpha[fond] = 0.0
    a_bande = np.clip(d / D0, 0.0, 1.0)
    alpha[pres] = a_bande[pres]
    # couleur « dé-blanchie » là où c'est semi-transparent
    a = np.clip(alpha, 1e-3, 1.0)[..., None]
    couleur = 255.0 - (255.0 - rgb) / a
    couleur = np.where(alpha[..., None] >= 0.999, rgb, couleur)
    couleur = np.clip(couleur, 0, 255)
    rgba = np.dstack([couleur, alpha * 255.0]).round().astype(np.uint8)
    im = Image.fromarray(rgba, "RGBA")
    # Redimensionner en prémultiplié : pas de liseré blanc ni noir au bord.
    im = im.convert("RGBa").resize(CIBLE, Image.LANCZOS).convert("RGBA")
    im.save(dst)
    print(f"{dst}: trous retirés {retires}, fond {fond.mean():.1%}")

if __name__ == "__main__":
    for s, dd in zip(sys.argv[1::2], sys.argv[2::2]):
        detourer(s, dd)
