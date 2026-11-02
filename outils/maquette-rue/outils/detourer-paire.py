# Détoure une figurine sur fond uni, et applique LE MÊME masque à son image « bouche ouverte » (alignée) :
# python -I detourer-paire.py <neutre> <sortie-neutre.png> [<parle> <sortie-parle.png>]
import sys
import cv2
import numpy as np

n_src, n_dst = sys.argv[1], sys.argv[2]
img = cv2.imread(n_src)
h, w = img.shape[:2]
masque = np.zeros((h, w), np.uint8)
bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
r = (int(w * 0.06), int(h * 0.015), int(w * 0.88), int(h * 0.975))
cv2.grabCut(img, masque, r, bgd, fgd, 7, cv2.GC_INIT_WITH_RECT)
m = np.where((masque == cv2.GC_FGD) | (masque == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
if n > 1:
    garde = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 0.03 * stats[1:, cv2.CC_STAT_AREA].max()]
    m = np.isin(lab, garde).astype(np.uint8) * 255
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
# boucher les trous intérieurs (le fond rose vu entre les bras ne compte pas : seulement les trous fermés)
contours, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
plein = np.zeros_like(m)
cv2.drawContours(plein, contours, -1, 255, cv2.FILLED)
trous = cv2.subtract(plein, m)
nt, labt, statt, _ = cv2.connectedComponentsWithStats(trous, 8)
for i in range(1, nt):
    if statt[i, cv2.CC_STAT_AREA] < 0.004 * h * w:
        m[labt == i] = 255
# le fond vu à travers (entre les spires du ressort) : les pixels de la couleur du fond, mesurée sur les bords
lab_img = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.int16)
bord = np.concatenate([lab_img[:8].reshape(-1, 3), lab_img[-8:].reshape(-1, 3), lab_img[:, :8].reshape(-1, 3), lab_img[:, -8:].reshape(-1, 3)])
fond = np.median(bord, axis=0)
proche = (np.linalg.norm(lab_img - fond, axis=2) < float(sys.argv[5]) if len(sys.argv) > 5 else np.linalg.norm(lab_img - fond, axis=2) < 16)
m[proche] = 0
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
m = cv2.GaussianBlur(m, (5, 5), 0)
ys, xs = np.where(m > 10)
y0, y1, x0, x1 = max(0, ys.min() - 4), ys.max() + 4, max(0, xs.min() - 4), xs.max() + 4
for src, dst in [(n_src, n_dst)] + ([(sys.argv[3], sys.argv[4])] if len(sys.argv) > 4 else []):
    im = cv2.imread(src)
    rgba = cv2.cvtColor(im, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = m
    cv2.imwrite(dst, rgba[y0:y1, x0:x1])
    print(dst, x1 - x0, "x", y1 - y0)
