# grille1.py image x0 y0 x1 y1 sortie largeur : grille tous les 1 % (étiquette tous les 2 %)
import sys, cv2
im = cv2.imread(sys.argv[1]); h, w = im.shape[:2]
x0, y0, x1, y1 = [float(a) for a in sys.argv[2:6]]
X0, Y0 = int(x0/100*w), int(y0/100*h)
c = im[Y0:int(y1/100*h), X0:int(x1/100*w)]
L = int(sys.argv[7]); f = L / c.shape[1]
c = cv2.resize(c, (L, int(c.shape[0]*f)), interpolation=cv2.INTER_CUBIC)
X = lambda p: int((p/100*w - X0) * f); Y = lambda p: int((p/100*h - Y0) * f)
for p in range(int(x0), int(x1)+1):
    cv2.line(c, (X(p),0), (X(p),c.shape[0]), (0,255,255) if p%2==0 else (0,140,140), 1)
    if p % 2 == 0: cv2.putText(c, str(p), (X(p)+2, 12), cv2.FONT_HERSHEY_SIMPLEX, .38, (0,255,255), 1)
for p in range(int(y0), int(y1)+1):
    cv2.line(c, (0,Y(p)), (c.shape[1],Y(p)), (255,0,255) if p%2==0 else (140,0,140), 1)
    if p % 2 == 0: cv2.putText(c, str(p), (2, Y(p)-2), cv2.FONT_HERSHEY_SIMPLEX, .38, (255,0,255), 1)
cv2.imwrite(sys.argv[6], c)
