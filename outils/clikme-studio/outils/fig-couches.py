# fig-couches.py source.jpg dossier [nom] : coupe une figurine sur ressort en deux calques PNG pour figurine.js
#   <nom>-corps.png : tout ce qui est au-dessus du ressort (il rebondit et se penche)
#   <nom>-socle.png : le socle (+ ce qui est posé dessus, ici les bottes), immobile
#   apercu-couches.jpg : les deux calques sur fond vert, écartés de 60 px, pour vérifier
# Le ressort d'origine disparaît au détourage (le métal reflète le fond) : figurine.js le redessine.
#
# ── LES RÉGLAGES PROPRES À CHAQUE FIGURINE (en px de l'image source ; les mesurer avec fig-grille.py) ──────────
# Valeurs de la figurine d'Halloween de Lili Ross (source 970 × 1024, fond magenta).
BOITE = (310, 5, 690, 1024)      # x0, y0, x1, y1 : la boîte gardée (doit être la même pour les deux calques)
X_FIGURINE = (285, 715)          # hors de ces colonnes, c'est sûrement du fond
COUPE_CORPS = 812                # le corps s'arrête là (juste sous l'ourlet de la robe)
SOCLE_HAUT = (499, 962, 189, 58) # ellipse du dessus du socle : centre x, centre y, demi-largeur, demi-hauteur
SOCLE_BAS = (499, 990, 189, 45)  # ellipse du dessous (le socle est un cylindre : flanc droit entre les deux)
POSES_SUR_SOCLE = (525, 840)     # x ≥ 525 et y ≥ 840 : les bottes, posées sur le socle, restent avec lui
# Le fond : teinte OpenCV 158–180 ou 0–2, saturation > 135, valeur > 55 (fond magenta). Mesurer avec fig-echant.py.
# ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
import sys, cv2, numpy as np
im = cv2.imread(sys.argv[1]); h, w = im.shape[:2]; out = sys.argv[2]; nom = sys.argv[3] if len(sys.argv) > 3 else "lili"
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV); H, Sa, V = (hsv[..., k].astype(int) for k in range(3))
fond = (((H >= 158) | (H <= 2)) & (Sa > 135) & (V > 55)).astype(np.uint8)

# 1) la figurine entière : le fond par la couleur, affiné par GrabCut
m = np.full((h, w), cv2.GC_PR_FGD, np.uint8); m[fond == 1] = cv2.GC_PR_BGD
m[cv2.erode(fond, np.ones((9, 9), np.uint8)) == 1] = cv2.GC_BGD
m[:, :X_FIGURINE[0]] = cv2.GC_BGD; m[:, X_FIGURINE[1]:] = cv2.GC_BGD
bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
cv2.grabCut(im, m, None, bgd, fgd, 5, cv2.GC_INIT_WITH_MASK)
a = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(a, 8)
a = np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 3000]).astype(np.uint8) * 255

# 2) le socle : dessiné comme un cylindre (bord net), au quadruple puis réduit pour l'anticrénelage
k = 4; g = np.zeros((h * k, w * k), np.uint8)
cx, cy, rx, ry = SOCLE_HAUT; cv2.ellipse(g, (cx * k, cy * k), (rx * k, ry * k), 0, 0, 360, 255, -1)
bx, by, brx, bry = SOCLE_BAS; cv2.ellipse(g, (bx * k, by * k), (brx * k, bry * k), 0, 0, 360, 255, -1)
cv2.rectangle(g, ((cx - rx) * k, cy * k), ((cx + rx) * k, by * k), 255, -1)
geo = cv2.resize(g, (w, h), interpolation=cv2.INTER_AREA)
yy, xx = np.mgrid[0:h, 0:w]
poses = a * ((yy >= POSES_SUR_SOCLE[1]) & (xx >= POSES_SUR_SOCLE[0])).astype(np.uint8)
socle = np.maximum(geo, poses)
corps = a * (yy < COUPE_CORPS).astype(np.uint8)

def finir(alpha, suffixe):
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur(alpha, (0, 0), 1.0)
    # les reflets du fond sur le bord : on retire l'excès de magenta (rouge et bleu au-dessus du vert)
    bord = (cv2.erode((alpha > 128).astype(np.uint8), np.ones((9, 9), np.uint8)) == 0) & (alpha > 5)
    f = im.astype(np.float32); exc = np.clip(np.minimum(f[..., 2], f[..., 0]) - f[..., 1], 0, None) * bord
    f[..., 0] -= exc * 0.8; f[..., 2] -= exc * 0.8
    x0, y0, x1, y1 = BOITE
    o = np.dstack([np.clip(f, 0, 255).astype(np.uint8), alpha])[y0:y1, x0:x1]
    cv2.imwrite(f"{out}/{nom}-{suffixe}.png", o)
    return o

c = finir(corps, "corps"); s = finir(socle, "socle")
al = lambda o: o[..., 3:4].astype(np.float32) / 255
hh, ww = c.shape[:2]
ap = np.zeros((hh + 60, ww, 3), np.float32); ap[:] = (90, 200, 60)
ap[:hh] = ap[:hh] * (1 - al(c)) + c[..., :3] * al(c)
ap[60:] = ap[60:] * (1 - al(s)) + s[..., :3] * al(s)
cv2.imwrite(f"{out}/apercu-couches.jpg", ap.astype(np.uint8))
print("ok", nom, "boîte", ww, "×", hh)
