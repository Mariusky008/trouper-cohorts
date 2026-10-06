import sys
import numpy as np
from PIL import Image, ImageFilter
d, dst = sys.argv[1], sys.argv[2]
def L(n): return Image.open(f'{d}/{n}.png')
fond = L('d98a6d72-b645-445a-8fa3-48fbc4bfe580').convert('RGB')
fond.save(f'{dst}/scene-canape-vert.webp', quality=86, method=6)
# Le calque de devant : tout ce qui est sous le bord arrière du plateau.
w, h = fond.size
y, x = np.mgrid[0:h, 0:w]
cx, cy, rx, ry = 475, 925, 472, 86
t = np.clip((x - cx) / rx, -1, 1)
bord = cy - ry * np.sqrt(1 - t * t)
m = Image.fromarray(((y >= bord) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))
dev = fond.convert('RGBA'); dev.putalpha(m)
bb = m.point(lambda v: 255 if v > 4 else 0).getbbox()
print('devant bbox', bb)
dev.crop((0, 700, w, h)).save(f'{dst}/scene-canape-vert-devant.webp', quality=86, method=6)
def rogne(n, out, haut=None):
    im = L(n).convert('RGBA')
    a = im.split()[3].point(lambda v: 255 if v > 10 else 0)
    bb = a.getbbox(); im = im.crop(bb)
    if haut and im.height > haut:
        im = im.resize((round(im.width * haut / im.height), haut), Image.LANCZOS)
    im.save(f'{dst}/{out}.webp', quality=90, method=6)
    print(out, im.size, round(im.width / im.height, 3))
rogne('f4a0cb34-9637-4164-9ca3-537538a9b35b', 'flaneur-assis', 900)
rogne('0fc1ba76-8888-48a9-9951-d95bf72866ef', 'flaneur-debout', 900)
rogne('0c8c7db9-3622-422b-9d8a-f77de8448c45', 'flaneur-tabouret', 1100)
L('23d0f1ba-6136-4df8-9b0b-1785e5ca1404').convert('RGB').save(f'{dst}/accueil-salle.webp', quality=86, method=6)
# Le tabouret dans l'image du fantôme rognée : où sont ses pieds, son centre ?
im = Image.open(f'{dst}/flaneur-tabouret.webp'); A = np.array(im.split()[3]) > 40
H2 = A.shape[0]
for frac in (.72, .8, .9, .98):
    r = A[int(H2 * frac)]; xs = np.where(r)[0]
    print('tabouret ligne', frac, xs.min() / A.shape[1], xs.max() / A.shape[1])
