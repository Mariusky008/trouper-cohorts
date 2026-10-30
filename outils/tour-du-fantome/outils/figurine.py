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

EXPRESSIONS = ("neutre", "parle", "o", "clin", "rire", "louche")
CODE = {"neutre": "n", "parle": "p", "o": "o", "clin": "c", "rire": "r", "louche": "l"}
MACHOIRE = [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454]
POINTS = [33, 133, 362, 263, 168, 6, 1]  # les coins des yeux, le haut du nez : ce qui doit rester en place
TETE_H = 600  # la hauteur des têtes exportées (la page les réduit)


def similitude(src, dst):
    """La similitude (moindres carrés) qui envoie `src` sur `dst` : a, b, tx, ty (x' = a x - b y + tx, y' = b x + a y + ty)."""
    ms, md = src.mean(0), dst.mean(0)
    s0, d0 = src - ms, dst - md
    den = (s0 ** 2).sum()
    a = (s0[:, 0] * d0[:, 0] + s0[:, 1] * d0[:, 1]).sum() / den
    b = (s0[:, 0] * d0[:, 1] - s0[:, 1] * d0[:, 0]).sum() / den
    return a, b, md[0] - (a * ms[0] - b * ms[1]), md[1] - (b * ms[0] + a * ms[1])


def _tete(photos, nom, ref_pts, taille):
    """Sa tête dans cette photo (jusqu'au menton), dans le repère de la photo neutre (RGBA, taille de la photo neutre)."""
    ph = Image.open(f"{photos}/{nom}.jpg").convert("RGB")
    p2 = json.load(open(f"{photos}/{nom}.json"))["pts"]
    m2 = Image.open(f"{photos}/{nom}-masque.png").convert("L")
    ligne = [(p2[i][0], p2[i][1] + 7) for i in MACHOIRE]
    haut = Image.new("L", ph.size, 0)
    ImageDraw.Draw(haut).polygon([(0, 0), (ph.width, 0), (ph.width, ligne[-1][1]), *ligne[::-1], (0, ligne[0][1])], fill=255)
    alpha = Image.fromarray(np.minimum(np.asarray(m2), np.asarray(haut.filter(ImageFilter.GaussianBlur(2))))).filter(ImageFilter.GaussianBlur(0.8))
    rgba = ph.convert("RGBA")
    rgba.putalpha(alpha)
    if nom == "neutre":
        return rgba
    a, b, tx, ty = similitude(np.array([p2[i] for i in POINTS], np.float32), ref_pts[POINTS])
    det = a * a + b * b  # PIL veut la transformation inverse (de la sortie vers la source)
    ia, ib = a / det, -b / det
    return rgba.transform(taille, Image.AFFINE, (ia, -ib, -(ia * tx - ib * ty), ib, ia, -(ib * tx + ia * ty)), resample=Image.BICUBIC)


def preparer(photos, corps_webp, sortie):
    """Écrit dans `sortie` les têtes (`tete-<expression>.webp`), le corps sans bras et les deux bras ; rend leurs mesures."""
    os.makedirs(sortie, exist_ok=True)
    ref = Image.open(f"{photos}/neutre.jpg")
    ref_pts = np.array(json.load(open(f"{photos}/neutre.json"))["pts"], np.float32)
    tetes = {e: _tete(photos, e, ref_pts, ref.size) for e in EXPRESSIONS}
    # un même cadre pour toutes (le rire ouvre la mâchoire plus bas)
    boites = [t.getbbox() for t in tetes.values()]
    bb = (min(b[0] for b in boites), min(b[1] for b in boites), max(b[2] for b in boites), max(b[3] for b in boites))
    k = TETE_H / (bb[3] - bb[1])
    w = round((bb[2] - bb[0]) * k)
    for e, t in tetes.items():
        t.crop(bb).resize((w, TETE_H), Image.LANCZOS).save(f"{sortie}/tete-{e}.webp", quality=86, method=6)
    menton = ((ref_pts[152][0] - bb[0]) * k, (ref_pts[152][1] + 7 - bb[1]) * k)

    # LE CORPS : sans sa tête ni sa casquette (coupé aux épaules, un cou arrondi), puis sans ses bras
    corps = Image.open(corps_webp).convert("RGBA")
    cw, ch = corps.size
    m = Image.new("L", corps.size, 0)
    d = ImageDraw.Draw(m)
    d.rectangle([0, ch * 0.43, cw, ch], fill=255)
    d.ellipse([cw * 0.24, ch * 0.37, cw * 0.76, ch * 0.51], fill=255)
    corps.putalpha(Image.fromarray(np.minimum(np.asarray(corps.getchannel("A")), np.asarray(m.filter(ImageFilter.GaussianBlur(3))))))
    bras = {"g": ((0, 330, 178, 525), (165, 435), (0, 330, 150, 525)), "d": ((538, 330, cw, 525), (550, 430), (566, 330, cw, 525))}
    efface = Image.new("L", corps.size, 255)
    for cote, (boite, _pivot, trou) in bras.items():
        corps.crop(boite).save(f"{sortie}/bras-{cote}.webp", quality=90, method=6)
        ImageDraw.Draw(efface).rectangle(trou, fill=0)
    sans = corps.copy()
    sans.putalpha(Image.fromarray(np.minimum(np.asarray(corps.getchannel("A")), np.asarray(efface.filter(ImageFilter.GaussianBlur(1))))))
    sans.save(f"{sortie}/corps.webp", quality=90, method=6)
    blanc = [int(v) for v in np.asarray(corps.convert("RGB").crop((340, 620, 380, 660))).reshape(-1, 3).mean(axis=0)]
    return {"tete": {"w": w, "h": TETE_H, "menton": [round(float(menton[0]), 1), round(float(menton[1]), 1)]}, "corps": {"w": cw, "h": ch, "cou": 0.43},
            "bras": {c: {"boite": list(b[0][:2]), "pivot": list(b[1])} for c, b in bras.items()}, "blanc": blanc}


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
