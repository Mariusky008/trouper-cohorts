import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
d, dst, apercu = sys.argv[1], sys.argv[2], sys.argv[3]
tab = Image.open(d + '/176bfcb8-f4fb-4728-a36e-27988d4bd14e.png').convert('RGBA')
A = np.array(tab).astype(np.float32) / 255
r, g, b, a = A[..., 0], A[..., 1], A[..., 2], A[..., 3]
mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
H, W = r.shape
def enveloppe(pts):
    pts = sorted(set(map(tuple, pts)))
    if len(pts) < 3: return pts
    def cross(o, a_, b_): return (a_[0]-o[0])*(b_[1]-o[1]) - (a_[1]-o[1])*(b_[0]-o[0])
    lo, up = [], []
    for p_ in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p_) <= 0: lo.pop()
        lo.append(p_)
    for p_ in reversed(pts):
        while len(up) >= 2 and cross(up[-2], up[-1], p_) <= 0: up.pop()
        up.append(p_)
    return lo[:-1] + up[:-1]
def masque_ceramique(x0, y0, x1, y1, seuil_sat=0.36, seuil_val=0.42):
    sub = (sat[y0:y1, x0:x1] < seuil_sat) & (mx[y0:y1, x0:x1] > seuil_val) & (a[y0:y1, x0:x1] > 0.5)
    ys, xs = np.nonzero(sub)
    hull = enveloppe(np.stack([xs, ys], 1))
    m = Image.new('L', (x1 - x0, y1 - y0), 0); ImageDraw.Draw(m).polygon(hull, fill=255)
    return m
def masque_lampe(x0, y0, x1, y1):
    sub = (a[y0:y1, x0:x1] > 0.5) & ((np.mgrid[y0:y1, x0:x1][0]) < 1096)
    m = Image.fromarray((sub * 255).astype(np.uint8))
    ImageDraw.Draw(m).ellipse([120 - x0, 1122 - y0, 218 - x0, 1170 - y0], fill=255)  # le pied
    ImageDraw.Draw(m).rectangle([143 - x0, 1090 - y0, 195 - x0, 1150 - y0], fill=255)  # la tige
    return m
morceaux = {
    'lampe': ((60, 895, 280, 1172), masque_lampe),
    'tasse': ((40, 1150, 180, 1300), lambda *bx: masque_ceramique(*bx)),
    'bol': ((628, 1098, 724, 1185), lambda *bx: masque_ceramique(*bx, 0.42, 0.38)),
}
dev = Image.open(dst + '/scene-canape-vert-devant.webp').convert('RGBA')
DY = 700
k = 0.6
poses = {'lampe': (298, 905), 'tasse': (392, 968), 'bol': (712, 948)}
ombre = Image.new('L', dev.size, 0); od = ImageDraw.Draw(ombre)
pieces = []
for nom, ((x0, y0, x1, y1), fm) in morceaux.items():
    msk = fm(x0, y0, x1, y1).filter(ImageFilter.GaussianBlur(0.9))
    obj = tab.crop((x0, y0, x1, y1)); obj.putalpha(msk)
    obj = obj.crop(msk.point(lambda v: 255 if v > 30 else 0).getbbox())
    obj = obj.resize((max(1, round(obj.width * k)), max(1, round(obj.height * k))), Image.LANCZOS)
    cx, bas = poses[nom]
    rx = obj.width * 0.55; ry = max(6, obj.width * 0.12)
    od.ellipse([cx - rx, bas - DY - ry, cx + rx, bas - DY + ry * 0.6], fill=170)
    pieces.append((obj, round(cx - obj.width / 2), round(bas - obj.height - DY)))
ombre = ombre.filter(ImageFilter.GaussianBlur(6))
noir = Image.new('RGBA', dev.size, (18, 8, 2, 255))
noir.putalpha(Image.fromarray((np.array(ombre) * (np.array(dev.split()[3]) / 255) * 0.7).astype(np.uint8)))
dev.alpha_composite(noir)
for obj, X, Y in pieces: dev.alpha_composite(obj, (X, Y))
dev.save(dst + '/scene-canape-vert-devant.webp', quality=86, method=6)
fond = Image.open(dst + '/scene-canape-vert.webp').convert('RGBA'); fond.alpha_composite(dev, (0, DY))
fond.crop((150, 600, 800, 1150)).save(apercu)
