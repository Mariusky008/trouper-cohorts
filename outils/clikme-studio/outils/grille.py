# grille-claire.py image sortie : grille fine tous les 5 %, traits fins blancs, l'image non assombrie
import sys, cv2
im = cv2.imread(sys.argv[1]); h, w = im.shape[:2]
f = float(sys.argv[3]) / w if len(sys.argv) > 3 else 760 / w; im = cv2.resize(im, (760, int(h * f)), interpolation=cv2.INTER_CUBIC); h, w = im.shape[:2]
for p in range(0, 101, 5):
    x, y = int(p / 100 * w), int(p / 100 * h)
    c = (0, 255, 255) if p % 10 == 0 else (200, 200, 200)
    cv2.line(im, (x, 0), (x, h), c, 1); cv2.line(im, (0, y), (w, y), c, 1)
    if p % 10 == 0:
        cv2.putText(im, str(p), (x + 2, 12), cv2.FONT_HERSHEY_SIMPLEX, .4, (0, 255, 255), 1)
        cv2.putText(im, str(p), (2, y - 2), cv2.FONT_HERSHEY_SIMPLEX, .4, (255, 0, 255), 1)
cv2.imwrite(sys.argv[2], im)
