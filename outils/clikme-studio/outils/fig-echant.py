# fig-echant.py image.jpg : médiane et 5e/95e centiles (teinte, saturation, valeur OpenCV + BGR) de quelques zones.
# Les zones (x0, y0, x1, y1) ci-dessous sont celles de la figurine de Lili Ross : les changer pour une autre image
# (des zones de fond sûr, et des zones de la figurine proches du fond en couleur). Sert à régler la ligne « fond = ».
import sys, cv2, numpy as np
im = cv2.imread(sys.argv[1]); hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
for nom,(x0,y0,x1,y1) in {"haut-g":(10,10,200,200),"bas-d":(800,850,960,1010),"milieu-g":(50,500,250,700),"sol":(100,950,300,1020),"chapeau":(400,40,560,120),"robe":(470,600,600,700),"peau":(440,220,560,330),"cheveux":(370,180,410,280)}.items():
    p = hsv[y0:y1,x0:x1].reshape(-1,3); b = im[y0:y1,x0:x1].reshape(-1,3)
    print(nom, "HSV med", np.median(p,0).astype(int), "p5", np.percentile(p,5,0).astype(int), "p95", np.percentile(p,95,0).astype(int), "BGR", np.median(b,0).astype(int))
