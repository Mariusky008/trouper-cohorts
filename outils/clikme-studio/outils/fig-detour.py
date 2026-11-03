# fig-detour.py source.jpg sortie.png apercu.jpg [x_min x_max] : détoure une figurine posée sur un fond magenta uni.
# x_min/x_max : la figurine est entre ces colonnes (tout le reste est du fond). Le fond = teinte 158–2 (OpenCV), saturation > 135.
# Pour un autre fond, changer la ligne « fond = » (mesurer d'abord avec fig-echant.py).
import sys, cv2, numpy as np
im = cv2.imread(sys.argv[1]); h, w = im.shape[:2]
X_MIN, X_MAX = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else (285, 715)
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV); H, Sat, V = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
fond = (((H >= 158) | (H <= 2)) & (Sat > 135) & (V > 55)).astype(np.uint8)
m = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
m[fond == 1] = cv2.GC_PR_BGD
m[cv2.erode(fond, np.ones((9, 9), np.uint8)) == 1] = cv2.GC_BGD
m[:, :X_MIN] = cv2.GC_BGD; m[:, X_MAX:] = cv2.GC_BGD
bgd, fgd = np.zeros((1, 65)), np.zeros((1, 65))
cv2.grabCut(im, m, None, bgd, fgd, 5, cv2.GC_INIT_WITH_MASK)
a = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(a, 8)
grand = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
a = ((lab == grand) | np.isin(lab, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 3000])).astype(np.uint8) * 255
a = cv2.morphologyEx(a, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
a = cv2.GaussianBlur(a, (0, 0), 1.1)
# reflets magenta sur le bord : on les ramène vers le vert
bord = cv2.dilate((a < 250).astype(np.uint8) & (a > 5).astype(np.uint8), np.ones((7, 7), np.uint8)) | (cv2.erode((a > 128).astype(np.uint8), np.ones((9, 9), np.uint8)) == 0) & (a > 5)
f = im.astype(np.float32); B, G, R = f[..., 0], f[..., 1], f[..., 2]
exc = np.clip(np.minimum(R, B) - G, 0, None) * bord
f[..., 0] -= exc * 0.8; f[..., 2] -= exc * 0.8
out = np.dstack([np.clip(f, 0, 255).astype(np.uint8), a])
ys, xs = np.where(a > 8); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
out = out[y0:y1, x0:x1]; cv2.imwrite(sys.argv[2], out); print("boîte", x0, y0, x1, y1, "taille", x1 - x0, y1 - y0)
al = out[..., 3:4].astype(np.float32) / 255
vert = np.zeros_like(out[..., :3]); vert[:] = (90, 200, 60); blanc = np.full_like(out[..., :3], 245)
ap = np.hstack([(out[..., :3] * al + vert * (1 - al)).astype(np.uint8), (out[..., :3] * al + blanc * (1 - al)).astype(np.uint8)])
cv2.imwrite(sys.argv[3], ap)
