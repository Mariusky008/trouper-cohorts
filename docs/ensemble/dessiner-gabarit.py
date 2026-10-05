# Dessine le gabarit à partir de gabarit-390x844.json (la seule source des cotes).
#   python3 dessiner-gabarit.py <capture 780×1688 de la scène> <sortie sur la scène> <sortie calque 3×>
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
G = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gabarit-390x844.json')))
def police(t):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        try: return ImageFont.truetype(f, t)
        except Exception: pass
    return ImageFont.load_default()
def dessiner(k, fond=None):
    W, H = 390 * k, 844 * k
    if fond is None:
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    else:
        im = ImageEnhance.Brightness(Image.open(fond).convert('RGB').resize((W, H))).enhance(0.45).convert('RGBA')
    calque = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(calque)
    f = police(9 * k); fg = police(11 * k)
    textes = []
    T = lambda xy, t, c, fo=None: textes.append((xy, t, c, fo or f))
    P = lambda pts: [(x * k, y * k) for x, y in pts]
    def boite(z, coul, txt, plein=40, dash=False):
        x, y, l, h = z['x'], z['y'], z['l'], z['h']
        d.rectangle([x * k, y * k, (x + l) * k, (y + h) * k], fill=coul[:3] + (plein,), outline=coul[:3] + (255,), width=max(1, k))
        if txt: T(((x + 3) * k, (y + 2) * k), txt, coul[:3] + (255,))
    Z = G['zones_reservees']
    GRIS, ORANGE, ROUGE, BLEU, VERT, ROSE, JAUNE, CYAN = (170,170,170), (255,150,40), (255,70,70), (90,160,255), (90,220,120), (255,90,190), (255,220,60), (60,220,230)
    boite(Z['entete'], GRIS, '', 70); T((150 * k, 4 * k), 'EN-TÊTE (titre, mention, filtres)', GRIS + (255,))
    boite(Z['bande_libre_bouton'], ROUGE, 'bande libre : ni visage ni contenu', 35)
    boite(Z['bouton'], ORANGE, 'BOUTON « Ouvrir la discussion »', 110)
    boite(Z['mot_du_fantome'], GRIS, '« Discuter »', 70)
    boite(Z['barre'], GRIS, 'BARRE DE L’APP', 110)
    D = G['decor']
    d.line([(0, D['ligne_d_horizon_y'] * k), (W, D['ligne_d_horizon_y'] * k)], fill=CYAN + (255,), width=max(1, k))
    T((4 * k, (D['ligne_d_horizon_y'] + 3) * k), 'horizon du décor (y 250)', CYAN + (255,))
    boite(D['bibliotheque'], (160,110,60), '', 50); T((4 * k, 146 * k), 'bibliothèque\n(calque devant\nle fond)', (200,150,90,255))
    boite(G['fond']['groupe'], BLEU, 'FOND (pied y 262)', 45)
    boite(G['fond']['etiquette'], BLEU, 'étiquette du fond', 20)
    boite(G['milieu']['groupe'], VERT, 'MILIEU (pied y 404)', 45)
    boite(G['milieu']['etiquette'], VERT, 'étiquette du milieu', 20)
    A = G['premier_plan']
    boite(A['etiquette'], ROSE, 'BLOC DU PREMIER PLAN\ntitre · statut · dernier message', 60)
    b = A['banquette']
    bx = b['boite']; d.rectangle([bx['x'] * k, bx['y'] * k, (bx['x'] + bx['l']) * k, (bx['y'] + bx['h']) * k], outline=JAUNE + (160,), width=max(1, k))
    for i, g in enumerate(A['fantomes']):
        x0, x1 = (g['centre_x'] - g['largeur'] / 2) * k, (g['centre_x'] + g['largeur'] / 2) * k
        d.rounded_rectangle([x0, g['haut'] * k, x1, g['assise'] * k], radius=40 * k, outline=(255,255,255,255), width=2 * k, fill=(255,255,255,45))
        T(((g['centre_x'] - 8) * k, (g['haut'] + 30) * k), str(i + 1), (255,255,255,255), fg)
    d.line(P(b['haut_du_dossier']), fill=JAUNE + (255,), width=3 * k)
    T((8 * k, 500 * k), 'haut du dossier', JAUNE + (255,))
    d.line(P(b['ligne_d_assise']), fill=ORANGE + (255,), width=3 * k)
    T((312 * k, 572 * k), 'ligne d’assise', ORANGE + (255,))
    t = A['table']['plateau']; cx, cy = t['centre']; rx, ry = t['rayon_x'], t['rayon_y']
    d.ellipse([(cx - rx) * k, (cy - ry) * k, (cx + rx) * k, (cy + ry) * k], outline=CYAN + (255,), width=3 * k, fill=CYAN + (40,))
    d.arc([(cx - rx) * k, (cy - ry + A['table']['chant']) * k, (cx + rx) * k, (cy + ry + A['table']['chant']) * k], 0, 180, fill=CYAN + (200,), width=max(1, k))
    # La ligne d'assise passe derrière le plateau : on la redessine en pointillés par-dessus.
    pts = P(b['ligne_d_assise'])
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5 // (10 * k)))
        for j in range(0, n, 2):
            a0, a1 = j / n, min(1, (j + 1) / n)
            d.line([(x0 + (x1 - x0) * a0, y0 + (y1 - y0) * a0), (x0 + (x1 - x0) * a1, y0 + (y1 - y0) * a1)], fill=ORANGE + (255,), width=2 * k)
    d.polygon(P(A['contenu_partage']['quad']), outline=ROSE + (255,), fill=ROSE + (60,))
    T((150 * k, 610 * k), 'contenu partagé', (255,255,255,255))
    T((20 * k, 656 * k), 'plateau (ellipse 320 × 110)', CYAN + (255,))
    for xx in range(0, W, 12 * k):
        d.line([(xx, D['ligne_d_horizon_y'] * k), (xx + 7 * k, D['ligne_d_horizon_y'] * k)], fill=CYAN + (255,), width=2 * k)
    for (x, y), t, c, fo in textes:
        bb = d.multiline_textbbox((x, y), t, font=fo)
        d.rectangle([bb[0] - 2 * k, bb[1] - 1 * k, bb[2] + 2 * k, bb[3] + 1 * k], fill=(15, 10, 8, 215))
        d.multiline_text((x, y), t, font=fo, fill=c)
    im.alpha_composite(calque)
    return im
dessiner(2, sys.argv[1]).convert('RGB').save(sys.argv[2])
dessiner(3).save(sys.argv[3])
