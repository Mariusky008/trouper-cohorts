# Détoure un personnage posé sur un fond uni (beige/gris) : GrabCut initialisé par un rectangle, puis bord adouci.
# Usage : python -I detourer.py <entrée> <sortie.png> x0 y0 x1 y1   (le rectangle autour du personnage, en px)
import sys
import cv2
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
x0, y0, x1, y1 = map(int, sys.argv[3:7])
img = cv2.imread(src)
h, w = img.shape[:2]
masque = np.zeros((h, w), np.uint8)
bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
# des zones « sûrement le personnage » en plus (x0 y0 x1 y1 …) : des cheveux gris sur fond gris, par exemple
surs = list(map(int, sys.argv[7:]))
if surs:
    masque[:] = cv2.GC_BGD
    masque[y0:y1, x0:x1] = cv2.GC_PR_FGD
    for k in range(0, len(surs), 4):
        a, b, c, d = surs[k:k + 4]
        masque[b:d, a:c] = cv2.GC_FGD
    cv2.grabCut(img, masque, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
else:
    cv2.grabCut(img, masque, (x0, y0, x1 - x0, y1 - y0), bgd, fgd, 6, cv2.GC_INIT_WITH_RECT)
m = np.where((masque == cv2.GC_FGD) | (masque == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
# garder la plus grande pièce (et ce qui la touche), boucher les trous
n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
if n > 1:
    grandes = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 0.02 * stats[1:, cv2.CC_STAT_AREA].max()]
    m = np.isin(lab, grandes).astype(np.uint8) * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
m = cv2.GaussianBlur(m, (5, 5), 0)
rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
rgba[:, :, 3] = m
ys, xs = np.where(m > 10)
rgba = rgba[max(0, ys.min() - 4): ys.max() + 4, max(0, xs.min() - 4): xs.max() + 4]
cv2.imwrite(dst, rgba)
print(dst, rgba.shape[1], "x", rgba.shape[0])
