import sys, cv2
im = cv2.imread(sys.argv[1]); x0,y0,x1,y1 = map(int, sys.argv[3:7]); im = im[y0:y1, x0:x1]; k = 2
im = cv2.resize(im, None, fx=k, fy=k, interpolation=cv2.INTER_CUBIC)
for x in range((x0//20+1)*20, x1, 20):
    X=(x-x0)*k; cv2.line(im,(X,0),(X,im.shape[0]),(0,255,255) if x%100==0 else (200,200,200),1)
    if x%100==0: cv2.putText(im,str(x),(X+2,14),cv2.FONT_HERSHEY_SIMPLEX,.45,(0,255,255),1)
for y in range((y0//20+1)*20, y1, 20):
    Y=(y-y0)*k; cv2.line(im,(0,Y),(im.shape[1],Y),(0,255,255) if y%100==0 else (200,200,200),1)
    cv2.putText(im,str(y),(2,Y-2),cv2.FONT_HERSHEY_SIMPLEX,.4,(255,255,0),1)
cv2.imwrite(sys.argv[2], im)
