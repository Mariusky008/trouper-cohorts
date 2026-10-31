# 🧸 LA FIGURINE À GROSSE TÊTE DU PROPRIÉTAIRE (la démo humaine, `tour-humain.py`) : sa tête détourée jusqu'au
# menton, posée sur le corps d'un fantôme ClikMe (« denim », sans sa tête ni sa casquette, les bras à part). La page
# la dessine elle-même sur une toile (`tour-humain.html`), image par image, d'après :
#   - ses six photos (`recu/humain/photos/` : neutre, parle, o, clin, rire, louche), RÉALIGNÉES sur la photo
#     neutre (une similitude qui pose ses yeux et son nez au même endroit) : les têtes se remplacent sans sauter ;
#   - des PISTES par réplique (30 images par seconde) : la tête qui dodeline sur un ressort relancé à chaque
#     syllabe, le cou qui saute un peu, les bras qui montent sur les syllabes fortes, et l'expression (la bouche qui
#     s'ouvre sur les syllabes, ses moments choisis : un clin d'œil, les yeux qui louchent, son grand rire).
# Les photos : la personne elle-même, qui a donné son accord pour qu'on anime son visage (30 octobre). Leurs repères
# (MediaPipe, `reperes-visage.mjs`) et leur détourage (`detourer.py`) sont à côté d'elles.
import json, math, os, subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

EXPRESSIONS = ("neutre", "parle", "o", "clin", "clino", "rire", "louche")
CODE = {"neutre": "n", "parle": "p", "o": "o", "clin": "c", "clino": "w", "rire": "r", "louche": "l"}
MACHOIRE = [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454]
POINTS = [33, 133, 362, 263, 168, 6, 1]  # les coins des yeux, le haut du nez : ce qui doit rester en place
TETE_H = 600  # la hauteur des têtes exportées (la page les réduit)
COU = 0.455  # où se pose son cou, dans la hauteur du fantôme « denim » (sous ses joues roses)


def similitude(src, dst):
    """La similitude (moindres carrés) qui envoie `src` sur `dst` : a, b, tx, ty (x' = a x - b y + tx, y' = b x + a y + ty)."""
    ms, md = src.mean(0), dst.mean(0)
    s0, d0 = src - ms, dst - md
    den = (s0 ** 2).sum()
    a = (s0[:, 0] * d0[:, 0] + s0[:, 1] * d0[:, 1]).sum() / den
    b = (s0[:, 0] * d0[:, 1] - s0[:, 1] * d0[:, 0]).sum() / den
    return a, b, md[0] - (a * ms[0] - b * ms[1]), md[1] - (b * ms[0] + a * ms[1])


def _sans_liseré(photo, alpha):
    """La photo détourée, sans le liseré rose du fond autour des cheveux : le bord un peu resserré, et ses pixels à
    demi transparents repeints de la couleur de l'intérieur tout proche (les cheveux, la peau), plus celle du fond."""
    a = np.asarray(photo).astype(np.float32)
    al = np.asarray(alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
    coeur = (al > 0.97).astype(np.float32)
    flou = lambda x: np.asarray(Image.fromarray(np.clip(x, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)
    poids = flou(coeur * 255)[..., None] / 255
    dedans = np.dstack([flou(a[..., c] * coeur) for c in range(3)]) / np.maximum(poids, 1e-3)
    m = np.where(poids[..., 0] > 0.02, np.clip((1 - al) * 1.6, 0, 1), 0)[..., None]
    rgb = a * (1 - m) + dedans * m
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), al * 255]).astype(np.uint8), "RGBA")


def _tete(photos, nom, ref_pts, taille):
    """Sa tête dans cette photo (jusqu'au menton), dans le repère de la photo neutre (RGBA, taille de la photo neutre)."""
    ph = Image.open(f"{photos}/{nom}.jpg").convert("RGB")
    p2 = json.load(open(f"{photos}/{nom}.json"))["pts"]
    m2 = Image.open(f"{photos}/{nom}-masque.png").convert("L")
    ligne = [(p2[i][0], p2[i][1] + 7) for i in MACHOIRE]
    haut = Image.new("L", ph.size, 0)
    ImageDraw.Draw(haut).polygon([(0, 0), (ph.width, 0), (ph.width, ligne[-1][1]), *ligne[::-1], (0, ligne[0][1])], fill=255)
    alpha = Image.fromarray(np.minimum(np.asarray(m2), np.asarray(haut.filter(ImageFilter.GaussianBlur(2))))).filter(ImageFilter.GaussianBlur(0.8))
    rgba = _sans_liseré(ph, alpha)
    if nom == "neutre":
        return rgba
    a, b, tx, ty = similitude(np.array([p2[i] for i in POINTS], np.float32), ref_pts[POINTS])
    det = a * a + b * b  # PIL veut la transformation inverse (de la sortie vers la source)
    ia, ib = a / det, -b / det
    return rgba.transform(taille, Image.AFFINE, (ia, -ib, -(ia * tx - ib * ty), ib, ia, -(ib * tx + ia * ty)), resample=Image.BICUBIC)


def preparer(photos, corps_webp, sortie, carte=None):
    """Écrit dans `sortie` les têtes (`tete-<expression>.webp`), le corps sans bras et les deux bras ; rend leurs mesures.
    `carte` (recadrage dans la photo neutre, taille) : sa carte de CV, `carte.jpg`, et la même sans sa tête
    (`carte-sans-tete.jpg`, le fond refait à sa place) — la page y dessine sa tête, qui en sort."""
    os.makedirs(sortie, exist_ok=True)
    ref = Image.open(f"{photos}/neutre.jpg")
    ref_pts = np.array(json.load(open(f"{photos}/neutre.json"))["pts"], np.float32)
    tetes = {e: _tete(photos, e, ref_pts, ref.size) for e in EXPRESSIONS}
    # un même cadre pour toutes (le rire ouvre la mâchoire plus bas)
    boites = [t.getbbox() for t in tetes.values()]
    bb = (min(b[0] for b in boites), min(b[1] for b in boites), max(b[2] for b in boites), max(b[3] for b in boites))
    # SON COU (de la photo neutre) : sous la mâchoire, un peu moins large qu'elle, qui s'efface vers le bas — il rentre
    # dans le corps du fantôme (la page redessine le bord du corps par-dessus), et sa tête y tient
    menton_y, cx = float(ref_pts[152][1]) + 7, float(ref_pts[152][0])
    visage = menton_y - float(ref_pts[10][1])
    demi = 0.36 * float(ref_pts[397][0] - ref_pts[172][0])
    haut_cou, bas_cou = menton_y - 0.25 * visage, menton_y + 0.42 * visage
    zone = Image.new("L", ref.size, 0)
    ImageDraw.Draw(zone).rounded_rectangle([cx - demi, haut_cou, cx + demi, bas_cou], radius=demi * 0.5, fill=255)
    fondu = np.clip((bas_cou - np.arange(ref.height, dtype=np.float32)) / (0.18 * visage), 0, 1)[:, None]
    zone = np.asarray(zone.filter(ImageFilter.GaussianBlur(5))).astype(np.float32) * fondu
    masque = np.asarray(Image.open(f"{photos}/neutre-masque.png").convert("L")).astype(np.float32)
    cou = _sans_liseré(ref.convert("RGB"), Image.fromarray(np.minimum(masque, zone).astype(np.uint8)))
    cadre = (bb[0], bb[1], bb[2], max(bb[3], int(bas_cou) + 2))
    k = TETE_H / (bb[3] - bb[1])
    w, h = round((cadre[2] - cadre[0]) * k), round((cadre[3] - cadre[1]) * k)
    for e, t in tetes.items():
        t.crop(cadre).resize((w, h), Image.LANCZOS).save(f"{sortie}/tete-{e}.webp", quality=86, method=6)
    cou.crop(cadre).resize((w, h), Image.LANCZOS).save(f"{sortie}/cou.webp", quality=86, method=6)
    menton = ((ref_pts[152][0] - cadre[0]) * k, (menton_y - cadre[1]) * k)
    if carte:
        _carte(ref.convert("RGB"), tetes["neutre"].getchannel("A"), *carte, sortie)

    # LE CORPS : sans sa tête ni sa casquette — coupé sous ses joues roses, en épaules arrondies (plus haut au milieu,
    # où se pose son cou) —, puis sans ses bras
    corps = Image.open(corps_webp).convert("RGBA")
    cw, ch = corps.size
    origine = corps.copy()
    xs, ys = np.arange(cw, dtype=np.float32), np.arange(ch, dtype=np.float32)[:, None]
    epaules = COU * ch + 0.05 * ch * np.clip(((xs - cw / 2) / (0.33 * cw)) ** 2, 0, 4)
    m = Image.fromarray(((ys >= epaules[None, :]) * 255).astype(np.uint8))
    a = np.asarray(corps).astype(np.float32)
    # du relief : juste sous la coupe, le haut du corps s'assombrit un peu (il s'arrondit vers l'arrière)
    relief = 1 - 0.16 * np.exp(-np.clip(ys - epaules[None, :], 0, None) / 16)
    a[..., :3] *= relief[..., None]
    a[..., 3] = np.minimum(a[..., 3], np.asarray(m.filter(ImageFilter.GaussianBlur(1.5))))
    corps = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
    # les bras, eux, viennent du corps entier (la coupe en épaules les tranchait), coupés droit sous sa tête
    # (au-dessus des épaules, rien : le bord de sa tête d'origine y laissait un éclat blanc)
    bord = np.where(np.abs(xs - cw / 2) < 0.33 * cw, np.maximum(0.45 * ch, epaules), 0.45 * ch)
    droit = Image.fromarray(((ys >= bord[None, :]) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))
    origine.putalpha(Image.fromarray(np.minimum(np.asarray(origine.getchannel("A")), np.asarray(droit))))
    bras = {"g": ((0, 330, 178, 525), (165, 435), (0, 330, 150, 525)), "d": ((538, 330, cw, 525), (550, 430), (566, 330, cw, 525))}
    efface = Image.new("L", corps.size, 255)
    for cote, (boite, _pivot, trou) in bras.items():
        origine.crop(boite).save(f"{sortie}/bras-{cote}.webp", quality=90, method=6)
        ImageDraw.Draw(efface).rectangle(trou, fill=0)
    sans = corps.copy()
    sans.putalpha(Image.fromarray(np.minimum(np.asarray(corps.getchannel("A")), np.asarray(efface.filter(ImageFilter.GaussianBlur(1))))))
    sans.save(f"{sortie}/corps.webp", quality=90, method=6)
    blanc = [int(v) for v in np.asarray(corps.convert("RGB").crop((340, 620, 380, 660))).reshape(-1, 3).mean(axis=0)]
    # tete : la taille des images (w, h : tête et cou), la hauteur de la tête seule (visage), le menton
    return {"tete": {"w": w, "h": h, "visage": TETE_H, "menton": [round(float(menton[0]), 1), round(float(menton[1]), 1)]}, "corps": {"w": cw, "h": ch, "cou": COU},
            "bras": {c: {"boite": list(b[0][:2]), "pivot": list(b[1])} for c, b in bras.items()}, "blanc": blanc,
            # sa tête dans la photo neutre : son cadre et son menton (pour la poser exactement sur sa carte)
            "photo": {"cadre": [int(v) for v in cadre], "menton": [round(float(ref_pts[152][0]), 1), round(menton_y, 1)]}}


def _carte(photo, alpha, recadre, taille, sortie):
    """Sa carte de CV : la photo recadrée, et la même sans sa tête — le fond rose refait ligne par ligne (la couleur des
    deux bords, d'un côté à l'autre), un peu plus large que sa tête, les bords adoucis."""
    a = np.asarray(photo).astype(np.float32)
    gauche, droite = a[:, :30].mean(axis=1), a[:, -30:].mean(axis=1)
    u = np.linspace(0, 1, a.shape[1])[None, :, None]
    fond = gauche[:, None, :] * (1 - u) + droite[:, None, :] * u
    m = np.asarray(alpha.point(lambda v: 255 if v > 8 else 0).filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(4))).astype(np.float32)[..., None] / 255
    sans = Image.fromarray(np.clip(a * (1 - m) + fond * m, 0, 255).astype(np.uint8))
    photo.crop(recadre).resize(taille, Image.LANCZOS).save(f"{sortie}/carte.jpg", quality=88)
    sans.crop(recadre).resize(taille, Image.LANCZOS).save(f"{sortie}/carte-sans-tete.jpg", quality=88)


def energie(ff, voix, ips=30):
    """L'énergie de la voix, une valeur (0 à 1) par image."""
    raw = subprocess.run([ff, "-v", "error", "-i", voix, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    pas = 16000 // ips
    n = len(x) // pas
    e = np.array([np.sqrt((x[i * pas:(i + 1) * pas] ** 2).mean()) for i in range(n)])
    db = 20 * np.log10(e + 1e-6)
    return np.clip((db - (np.percentile(db, 95) - 24)) / 20, 0, 1)


def pistes(ff, voix, moments=(), ips=30, apres=1.2):
    """Les pistes d'une réplique : par image, l'angle de la tête (degrés), le saut du cou (px), les deux bras
    (degrés) et l'expression (une lettre, `CODE`). `moments` : (expression, de, à) en secondes, qui l'emportent sur
    la bouche qui parle ; « à » = None : jusqu'au bout (et après la réplique)."""
    en = energie(ff, voix, ips)
    n = len(en) + int(ips * apres)
    ang = v = sy = vy = bg = vbg = bd = vbd = prec = 0.0
    signe, syllabe, etat, tenu = 1, 0, "neutre", 0
    dt = 1 / ips
    A, S, G, D, E = [], [], [], [], []
    for i in range(n):
        t = i / ips
        a = float(en[i]) if i < len(en) else 0.0
        # une syllabe qui démarre : un coup au ressort de la tête, à gauche puis à droite ; les bras sur les fortes
        if a - prec > 0.12:
            v += signe * (40 + 60 * a)
            vy += 200 * (a - prec)
            signe = -signe
            syllabe += 1
            if a > 0.7:
                vbg += -90
                vbd += 90
        prec = a
        v += (-170 * ang - 8 * v) * dt
        ang = max(-6.0, min(6.0, ang + v * dt))
        vy += (-220 * sy - 13 * vy) * dt
        sy += vy * dt
        vbg += (-120 * bg - 9 * vbg) * dt
        bg += vbg * dt
        vbd += (-120 * bd - 9 * vbd) * dt
        bd += vbd * dt
        # L'EXPRESSION : ses moments choisis, sinon la bouche ouverte sur les syllabes (gardée 2 images au moins) ;
        # une syllabe sur trois en « o », pour que la bouche ne fasse pas toujours la même forme
        voulu = next((e for e, de, a_ in moments if de <= t and (a_ is None or t < a_)), None)
        fort = voulu is not None
        if not fort:
            voulu = ("o" if syllabe % 3 == 2 else "parle") if a > (0.28 if etat in ("parle", "o") else 0.38) else "neutre"
        if voulu != etat and (tenu >= 2 or fort or etat in ("clin", "rire", "louche")):
            etat, tenu = voulu, 0
        tenu += 1
        A.append(round(ang, 1))
        S.append(round(max(-4.0, min(8.0, sy)) + 6 * a, 1))
        G.append(round(bg, 1))
        D.append(round(-bd, 1))
        E.append(CODE[etat])
    return {"a": A, "s": S, "g": G, "d": D, "e": "".join(E)}
