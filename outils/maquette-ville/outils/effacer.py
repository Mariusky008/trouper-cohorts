# effacer.py entree sortie zones.json : efface les lettres claires dans chaque zone (polygone en %), par inpainting
import sys, json, cv2, numpy as np
im = cv2.imread(sys.argv[1]); h, w = im.shape[:2]
zones = json.load(open(sys.argv[3]))
masque = np.zeros((h, w), np.uint8)
for z in zones:
    poly = np.array([[x / 100 * w, y / 100 * h] for x, y in z["poly"]], np.int32)
    zone = np.zeros((h, w), np.uint8); cv2.fillPoly(zone, [poly], 255)
    b, g, r = cv2.split(im.astype(np.int16))
    clair = ((g > z.get("g", 120)) & (r > z.get("r", 150))).astype(np.uint8) * 255
    m = cv2.bitwise_and(clair, zone)
    m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=z.get("dil", 2))
    masque = cv2.bitwise_or(masque, m)
out = cv2.inpaint(im, masque, 7, cv2.INPAINT_TELEA)
cv2.imwrite(sys.argv[2], out, [cv2.IMWRITE_JPEG_QUALITY, 88])
cv2.imwrite(sys.argv[2].replace(".jpg", "-masque.png"), masque)
