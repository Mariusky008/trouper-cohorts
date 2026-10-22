# L'ALIGNEMENT D'UNE RÉPLIQUE ENREGISTRÉE SUR SON TEXTE, sans reconnaissance vocale : les phrases sont
# posées sur les silences (alignement phrases ↔ segments de parole, au débit le plus régulier), puis les
# mots répartis dans leur segment selon leurs syllabes. Sort ce que la page attend (TEMPS) :
#   d : la durée ; m : l'instant de chaque mot (le texte coupé sur ses espaces, comme prononcer()) ;
#   b : la bouche, une case par 40 ms (1 = ouverte).
# Utilisé par tour-promesses.py (même méthode que l'épisode de la boulangerie, montage2.py).
import math, re, subprocess
import numpy as np


def duree(ff, f):
    out = subprocess.run([ff, "-hide_banner", "-i", f], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def syllabes(mot):
    m = re.sub(r"[^a-zàâäéèêëîïôöùûüÿœæ]", "", mot.lower().replace("’", "").replace("qu", "k"))
    if not m:
        return 0
    k = len(re.findall(r"[aeiouyàâäéèêëîïôöùûüÿœæ]+", m))
    k += len(re.findall(r"(ouer|ier|ié|éa|éo)", m))
    if k > 1 and re.search(r"(e|es|ent)$", m) and not m.endswith(("ée", "ées")):
        k -= 1
    return max(1, k)


def segments(ff, f, d, seuil="-45dB"):
    out = subprocess.run([ff, "-hide_banner", "-i", f, "-af", f"silencedetect=n={seuil}:d=0.12", "-f", "null", "-"], capture_output=True, text=True).stderr
    debuts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    fins = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    segs, t = [], 0.0
    for a, b in zip(debuts, fins + [d] * (len(debuts) - len(fins))):
        if a - t > 0.08:
            segs.append((t, a))
        t = b
    if d - t > 0.08:
        segs.append((t, d))
    return segs


def bouche(ff, f, d):
    raw = subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    n = 640  # 40 ms
    e = np.array([np.sqrt((x[i:i + n] ** 2).mean()) for i in range(0, len(x) - n + 1, n)])
    e = 20 * np.log10(e + 1e-6)
    s = e.max() - 26
    return "".join("1" if v > s else "0" for v in e)


def aligner(ff, f, texte, coupures=(), seuil="-45dB"):
    """texte : tel que la page le dira (mots séparés par des espaces ordinaires ; « * » et les espaces
    insécables restent collés aux mots). coupures : les mots devant lesquels on entend une pause sans
    ponctuation. seuil : le niveau sous lequel c'est un silence (plus haut, il trouve les petites
    respirations d'une voix rapide)."""
    d = duree(ff, f)
    mots = texte.split(" ")
    propre = [w.replace("*", "") for w in mots]
    phrases, cur = [], []
    for i, w in enumerate(propre):
        if cur and w in coupures:
            phrases.append(cur); cur = []
        cur.append(i)
        if re.search(r"[,;:.?!…]$", w):
            phrases.append(cur); cur = []
    if cur:
        phrases.append(cur)
    syl = [sum(max(1, syllabes(propre[i])) for i in p) for p in phrases]
    segs = segments(ff, f, d, seuil)
    dur = [b - a for a, b in segs]
    debit = sum(syl) / sum(dur)
    N, Mn = len(phrases), len(segs)
    INF = 1e9
    cout = [[INF] * (Mn + 1) for _ in range(N + 1)]
    prec = [[None] * (Mn + 1) for _ in range(N + 1)]
    cout[0][0] = 0
    for i in range(N + 1):
        for j in range(Mn + 1):
            if cout[i][j] >= INF:
                continue
            for a in (1, 2, 3):
                for b in (1, 2, 3):
                    if (a > 1 and b > 1) or i + a > N or j + b > Mn:
                        continue
                    c = cout[i][j] + math.log(sum(dur[j:j + b]) / (sum(syl[i:i + a]) / debit)) ** 2 + 0.15 * (a + b - 2)
                    if c < cout[i + a][j + b]:
                        cout[i + a][j + b] = c; prec[i + a][j + b] = (i, j)
    groupes, i, j = [], N, Mn
    while (i, j) != (0, 0):
        pi, pj = prec[i][j]
        groupes.append((list(range(pi, i)), list(range(pj, j)))); i, j = pi, pj
    groupes.reverse()
    m = [0.0] * len(mots)
    for ps, ss in groupes:
        morceaux = [segs[k] for k in ss]
        total = sum(b - a for a, b in morceaux)
        idx = [w for p in ps for w in phrases[p]]
        sy = [max(1, syllabes(propre[w])) for w in idx]
        tot, avant = sum(sy), 0
        for w, s in zip(idx, sy):
            tau = total * avant / tot
            t = morceaux[-1][1]
            for a, b in morceaux:
                if tau <= (b - a) + 1e-6:
                    t = a + tau; break
                tau -= b - a
            m[w] = round(t, 2)
            avant += s
    return {"d": round(d, 3), "m": m, "b": bouche(ff, f, d)}
