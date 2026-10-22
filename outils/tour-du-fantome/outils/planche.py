# Planche contact : planche.py <sortie.jpg> <largeur vignette> <colonnes> <images...>
import sys, cv2, numpy as np
out, w, cols, ims = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:]
vs = []
for f in ims:
    im = cv2.imread(f); h = int(im.shape[0] * w / im.shape[1]); vs.append(cv2.resize(im, (w, h), interpolation=cv2.INTER_AREA))
H = max(v.shape[0] for v in vs); rows = (len(vs) + cols - 1) // cols
pl = np.full((rows * (H + 8), cols * (w + 8), 3), 40, np.uint8)
for k, v in enumerate(vs):
    r, c = divmod(k, cols); pl[r*(H+8):r*(H+8)+v.shape[0], c*(w+8):c*(w+8)+w] = v
cv2.imwrite(out, pl, [cv2.IMWRITE_JPEG_QUALITY, 88])
