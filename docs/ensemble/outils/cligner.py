"""Fabrique la version « yeux fermés » d'un fantôme, superposable au pixel.
Usage : cligner.py <image.webp> <sortie.webp> [apercu.png] [x0,y0,x1,y1;x0,y0,x1,y1]
(le dernier argument donne la place des deux yeux quand la détection échoue)"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA'); A = np.array(im).astype(np.int32)
H, W = A.shape[:2]
mx = A[..., :3].max(2); mn = A[..., :3].min(2)
noir = (mx < 60) & (A[..., 3] > 200) & (mx - mn < 30)
bb = Image.fromarray((A[..., 3] > 30).astype(np.uint8) * 255).getbbox()
noir[int(bb[1] + (bb[3] - bb[1]) * 0.62):, :] = False  # les yeux sont dans le haut du corps
vu = np.zeros_like(noir); comps = []
for y0, x0 in zip(*np.nonzero(noir)):
    if vu[y0, x0]: continue
    q = deque([(y0, x0)]); vu[y0, x0] = True; pts = []
    while q:
        y, x = q.popleft(); pts.append((y, x))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and noir[ny, nx] and not vu[ny, nx]:
                vu[ny, nx] = True; q.append((ny, nx))
    if len(pts) > 40:
        ys, xs = zip(*pts)
        comps.append(dict(n=len(pts), x0=min(xs), x1=max(xs), y0=min(ys), y1=max(ys)))
# Deux yeux : les deux composantes les plus grandes, de taille voisine, à peu près à la même hauteur.
comps = [c for c in comps if 0.35 < (c['x1'] - c['x0'] + 1) / (c['y1'] - c['y0'] + 1) < 1.8 and c['n'] / ((c['x1'] - c['x0'] + 1) * (c['y1'] - c['y0'] + 1)) > 0.5]
comps.sort(key=lambda c: -c['n'])
yeux = None
for i in range(len(comps)):
    for j in range(i + 1, min(len(comps), i + 6)):
        a, b = comps[i], comps[j]
        if 0.38 < a['n'] / b['n'] < 2.7 and abs((a['y0'] + a['y1']) / 2 - (b['y0'] + b['y1']) / 2) < (a['y1'] - a['y0']) * 0.8 and abs(a['x0'] - b['x0']) > (a['x1'] - a['x0']):
            yeux = (a, b); break
    if yeux: break
if len(sys.argv) > 4:
    yeux = tuple(dict(zip(('x0', 'y0', 'x1', 'y1'), map(int, b.split(',')))) for b in sys.argv[4].split(';'))
if not yeux:
    print('PAS D\'YEUX TROUVÉS', src); sys.exit(1)
rgb = A[..., :3].astype(np.float64)
luma = rgb @ np.array([0.299, 0.587, 0.114])
masque = np.zeros((H, W), bool)
for e in yeux:
    w = e['x1'] - e['x0'] + 1; h = e['y1'] - e['y0'] + 1
    # la peau autour : un anneau juste hors de l'œil
    X0, X1 = max(0, e['x0'] - int(w * .9)), min(W, e['x1'] + int(w * .9))
    Y0, Y1 = max(0, e['y0'] - int(h * .6)), min(H, e['y1'] + int(h * .6))
    zone = luma[Y0:Y1, X0:X1]
    peau = np.percentile(zone, 85)
    # l'œil entier (pupille, iris, contour) : croissance depuis la pupille vers ce qui est nettement plus sombre que la peau
    sombre = (luma < peau * 0.8) & (A[..., 3] > 200)
    q = deque([((e['y0'] + e['y1']) // 2, (e['x0'] + e['x1']) // 2)])
    vu2 = np.zeros((H, W), bool)
    while q:
        y, x = q.popleft()
        if not (Y0 <= y < Y1 and X0 <= x < X1) or vu2[y, x] or not sombre[y, x]: continue
        vu2[y, x] = True
        q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    masque |= vu2
    # et l'ovale de l'œil lui-même, un peu élargi : rien de sombre ne reste au bord
    ov = Image.new('L', (W, H), 0)
    ImageDraw.Draw(ov).ellipse([e['x0'] - w * .2, e['y0'] - h * .16, e['x1'] + w * .2, e['y1'] + h * .16], fill=255)
    masque |= np.array(ov) > 0
# les reflets blancs dans l'œil : on ferme les trous
mi = Image.fromarray(masque.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
masque = np.array(mi) > 0
# REMPLIR PAR DIFFUSION : le trou prend le dégradé de la peau qui l'entoure.
X = rgb.copy()
bord = (np.array(Image.fromarray(masque.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(9))) > 0) & ~masque
X[masque] = np.median(rgb[bord], 0)
for _ in range(900):
    Y = (np.roll(X, 1, 0) + np.roll(X, -1, 0) + np.roll(X, 1, 1) + np.roll(X, -1, 1)) / 4
    X[masque] = Y[masque]
r = A.copy(); r[..., :3] = np.clip(X, 0, 255)
res = Image.fromarray(r.astype(np.uint8))
# LA PAUPIÈRE : un trait fin et courbe, tracé à 4× puis réduit (lissé).
k = 4
calque = Image.new('RGBA', (W * k, H * k), (0, 0, 0, 0)); dr = ImageDraw.Draw(calque)
for e in yeux:
    w = e['x1'] - e['x0'] + 1; h = e['y1'] - e['y0'] + 1
    cy = e['y0'] + h * 0.52
    ep = max(2, int(min(w, h * 0.8) * 0.13))
    dr.arc([(e['x0'] - w * 0.04) * k, (cy - h * 0.3) * k, (e['x1'] + w * 0.04) * k, (cy + h * 0.3) * k], start=12, end=168, fill=(56, 32, 24, 255), width=ep * k)
calque = calque.resize((W, H), Image.LANCZOS)
res.alpha_composite(calque)
r = np.array(res).astype(np.int32)
# l'alpha d'origine, exactement
r[..., 3] = A[..., 3]
Image.fromarray(r.astype(np.uint8)).save(out, quality=90, method=6)
if len(sys.argv) > 3:
    a, b = yeux
    x0 = min(a['x0'], b['x0']) - 60; x1 = max(a['x1'], b['x1']) + 60; y0 = min(a['y0'], b['y0']) - 60; y1 = max(a['y1'], b['y1']) + 60
    bg = Image.new('RGBA', (2 * (x1 - x0) + 10, y1 - y0), (60, 40, 30, 255))
    bg.alpha_composite(im.crop((x0, y0, x1, y1)), (0, 0)); bg.alpha_composite(Image.fromarray(r.astype(np.uint8)).crop((x0, y0, x1, y1)), (x1 - x0 + 10, 0))
    bg.save(sys.argv[3])
print('ok', src, [(e['x0'], e['y0'], e['x1'], e['y1']) for e in yeux])
