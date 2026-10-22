# Les instants d'une réplique enregistrée, comme temps.json : d (durée), m (début de chaque mot
# affiché), b (bouche, une case par 40 ms), a (mots dits avant ceux qui s'affichent).
# Sans reconnaissance vocale : pauses (silences) sur la ponctuation, puis attaque des syllabes
# (pics d'énergie), le texte étant connu. Étalonné sur les dix répliques mesurées de Chez Bergine.
#   python3 -I aligner-voix.py <ffmpeg> --essai <dossier mp3 Bergine> <temps.json>
#   python3 -I aligner-voix.py <ffmpeg> <fichier.mp3> "<texte>" [a]
import sys, re, json, subprocess
import numpy as np

NB, INS = " ", " "
FF = sys.argv[1]
PAS = 0.01  # une trame d'énergie : 10 ms


def energie(f):
    raw = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768
    n = int(16000 * PAS)
    e = np.array([np.sqrt((x[i:i + n] ** 2).mean()) for i in range(0, len(x) - n, n)])
    # la voix seule (300-3000 Hz) pour les syllabes
    raw2 = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-i", f, "-af", "highpass=f=300,lowpass=f=3000", "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
    y = np.frombuffer(raw2, dtype=np.int16).astype(np.float32) / 32768
    v = np.array([np.sqrt((y[i:i + n] ** 2).mean()) for i in range(0, len(y) - n, n)])
    k = np.hanning(5); k /= k.sum()
    return len(x) / 16000, 20 * np.log10(np.convolve(e, k, "same") + 1e-6), 20 * np.log10(np.convolve(v, k, "same") + 1e-6)


DITS = {"11" + INS + "h": 2, "1" + INS + "000": 1, "ClikMe…": 2}
NOMBRES = {"4": 1, "11": 1, "19": 2, "50": 1, "189": 5, "1000": 1}


def syllabes(mot):
    if mot in DITS:
        return DITS[mot]
    n = 0
    for m in mot.split(INS):
        brut = m
        if not re.search(r"[a-zA-Zà-ÿœæ]", brut):
            # un nombre (« 19 » : dix-neuf) ou « € » (euros), dits en toutes lettres
            chiffres = re.sub(r"\D", "", brut)
            n += NOMBRES.get(chiffres, len(chiffres)) if chiffres else (2 if "€" in brut else 0)
            continue
        m = re.sub(r"[^a-zàâäéèêëîïôöùûüÿœæ]", "", m.lower().replace("’", "").replace("qu", "k"))
        k = len(re.findall(r"[aeiouyàâäéèêëîïôöùûüÿœæ]+", m))
        k += len(re.findall(r"(ouer|ier|ié|yaie|aya|oyé|éa|éo)", m))  # deux voyelles qui s'entendent
        if k > 1 and re.search(r"(e|es|ent)$", m) and not m.endswith(("ée", "ées")):
            k -= 1
        n += max(1, k) if m else 0
    return max(1, n)


def coupe(mot):
    """Une pause après ce mot ? (ponctuation)"""
    return mot.endswith((",", ":", "…", ".", "?", "!", ";"))


def aligner(f, texte, a=0, seuil_pause=0.11):
    d, db, dv = energie(f)
    haut = np.percentile(db, 98)
    parle = db > haut - 30
    i0 = int(np.argmax(parle)); i1 = len(parle) - int(np.argmax(parle[::-1]))
    # les pauses : au moins seuil_pause sous le seuil, entre i0 et i1
    pauses, k = [], i0
    while k < i1:
        if not parle[k]:
            j = k
            while j < i1 and not parle[j]:
                j += 1
            if (j - k) * PAS >= seuil_pause:
                pauses.append((k * PAS, j * PAS))
            k = j
        else:
            k += 1
    # les attaques de syllabes : montée d'énergie vocale juste avant chaque pic
    hv = dv.max(); pics = []
    for i in range(2, len(dv) - 2):
        if dv[i] == dv[max(0, i - 6):i + 7].max() and dv[i] > hv - 24:
            g = dv[max(0, i - 15):i].min(); dd = dv[i + 1:i + 16].min() if i + 1 < len(dv) else dv[i]
            if dv[i] - g > 2.5 and dv[i] - dd > 2.5:
                j = i
                while j > 0 and dv[j - 1] < dv[j] and dv[i] - dv[j - 1] < 9:
                    j -= 1
                pics.append(j * PAS)
    mots = texte.replace("*", "").split(" ")
    # les morceaux de phrase, entre deux ponctuations
    morceaux, cur = [], []
    for w in mots:
        cur.append(w)
        if coupe(w):
            morceaux.append(cur); cur = []
    if cur:
        morceaux.append(cur)
    # les creux de la voix entre le début et la fin, du plus marqué au moins marqué : autant que de
    # ponctuations à l'intérieur de la phrase
    seuil = hv - 22
    creux, k = [], i0 + 5
    while k < i1 - 5:
        if dv[k] < seuil:
            j = k
            while j < i1 and dv[j] < seuil:
                j += 1
            if (j - k) * PAS >= 0.06:
                creux.append(((j - k) * PAS * (1 + (seuil - dv[k:j].mean()) / 10), k * PAS, j * PAS))
            k = j
        else:
            k += 1
    # CHAQUE PONCTUATION PREND LE CREUX LE PLUS MARQUÉ PRÈS DE L'ENDROIT OÙ ELLE DEVRAIT TOMBER (au
    # prorata des syllabes) ; une ponctuation sans creux net ne s'entend pas : ses morceaux se recollent.
    creux.sort(key=lambda c: c[1])
    cum = [0]
    for mm in morceaux:
        cum.append(cum[-1] + sum(map(syllabes, mm)))
    span = (i1 - i0) * PAS
    attendus = [i0 * PAS + span * cum[k] / cum[-1] for k in range(1, len(morceaux))]
    gain = lambda c, e: c[0] - 0.35 * abs((c[1] + c[2]) / 2 - e)
    nb, nc = len(attendus), len(creux)
    # G[k][j] : meilleur total avec les k premières ponctuations et les j premiers creux
    G = [[0.0] * (nc + 1) for _ in range(nb + 1)]
    C = [[None] * (nc + 1) for _ in range(nb + 1)]
    for k in range(1, nb + 1):
        for j in range(nc + 1):
            meilleur, choix = G[k - 1][j], ("rien", j)
            if j and G[k][j - 1] > meilleur:
                meilleur, choix = G[k][j - 1], ("saute", j - 1)
            if j:
                g = gain(creux[j - 1], attendus[k - 1])
                if g > 0.02 and G[k - 1][j - 1] + g > meilleur:
                    meilleur, choix = G[k - 1][j - 1] + g, ("prend", j - 1)
            G[k][j], C[k][j] = meilleur, choix
    pris, k, j = {}, nb, nc
    while k > 0:
        quoi, j2 = C[k][j]
        if quoi == "prend":
            pris[k - 1] = creux[j2]; k, j = k - 1, j2
        elif quoi == "rien":
            k -= 1
        else:
            j = j2
    garde, recolles = [], []
    for k in range(nb):
        if k in pris:
            garde.append(pris[k])
        else:
            recolles.append(k)
    for k in reversed(recolles):  # la ponctuation k ne s'entend pas : morceaux k et k+1 ensemble
        morceaux[k] += morceaux[k + 1]; del morceaux[k + 1]
    voix, t0 = [], i0 * PAS
    for _, c0, c1 in garde:
        voix.append((t0, c0)); t0 = c1
    voix.append((t0, i1 * PAS))
    # un vrai silence au milieu d'un morceau (sans ponctuation) tombe entre deux mots : le plus proche
    morc2, voix2 = [], []
    for (v0, v1), mm in zip(voix, morceaux):
        syl = [syllabes(w) for w in mm]
        tot = sum(syl)
        sil, k = [], int(v0 / PAS) + 4
        while k < int(v1 / PAS) - 4:
            if dv[k] < hv - 33:
                j = k
                while j < int(v1 / PAS) and dv[j] < hv - 33:
                    j += 1
                if (j - k) * PAS >= 0.09:
                    sil.append((k * PAS, j * PAS))
                k = j
            else:
                k += 1
        coupes = {}
        for c0, c1 in sil:
            bornes = [q for q in range(1, len(mm)) if q not in coupes]
            if not bornes:
                break
            q = min(bornes, key=lambda q: abs(v0 + (v1 - v0) * sum(syl[:q]) / tot - (c0 + c1) / 2))
            coupes[q] = (c0, c1)
        debut, t0 = 0, v0
        for q in sorted(coupes):
            morc2.append(mm[debut:q]); voix2.append((t0, coupes[q][0])); debut, t0 = q, coupes[q][1]
        morc2.append(mm[debut:]); voix2.append((t0, v1))
    m = []
    for (v0, v1), mm in zip(voix2, morc2):
        syl = [syllabes(w) for w in mm]
        tot = sum(syl)
        att = [p for p in pics if v0 + 0.06 <= p < v1 - 0.04]
        # les débuts de syllabe attendus, à vitesse régulière ; pour chacun, les attaques mesurées
        # proches, ou l'instant attendu lui-même (pénalisé) quand aucune ne convient. On garde,
        # dans l'ordre, la suite la plus proche (programmation dynamique).
        attendu = [v0 + (v1 - v0) * q / tot for q in range(tot)]
        cands = [[(v0, 0.0)]] + [[(p, (p - attendu[q]) ** 2) for p in att if abs(p - attendu[q]) < 0.3] + [(attendu[q], 0.09 ** 2)] for q in range(1, tot)]
        D = [[c for _, c in cands[0]]]; P = [[-1]]
        for q in range(1, tot):
            dq, pq = [], []
            for t, c in cands[q]:
                best, arg = 1e9, -1
                for i2, (t2, _) in enumerate(cands[q - 1]):
                    if t >= t2 + 0.08 and D[q - 1][i2] < best:
                        best, arg = D[q - 1][i2], i2
                dq.append(best + c); pq.append(arg)
            D.append(dq); P.append(pq)
        i = min(range(len(cands[-1])), key=lambda i: D[-1][i])
        choix = [0.0] * tot
        for q in range(tot - 1, -1, -1):
            choix[q] = cands[q][i][0]; i = P[q][i] if q else 0
        for k in range(len(mm)):
            t = choix[sum(syl[:k])]
            m.append(round(max(t, m[-1] + 0.06) if m else t, 2))
    # jamais un mot après la fin de la voix : la fin se resserre
    fin_voix = i1 * PAS - 0.12
    if m and m[-1] > fin_voix:
        a0 = m[0]
        m = [round(a0 + (x - a0) * (fin_voix - a0) / (m[-1] - a0), 2) for x in m]
    # la bouche : ouverte quand la voix porte, fermée dans les creux
    cases = []
    for c in range(int(d / 0.04) + 1):
        s = dv[int(c * 4):int(c * 4) + 4]
        cases.append("1" if len(s) and s.max() > hv - 17 else "0")
    out = {"d": round(d, 3), "m": m, "b": "".join(cases)}
    if a:
        out["a"] = a
    return out


if sys.argv[2] == "--essai":
    D, T = sys.argv[3], json.load(open(sys.argv[4], encoding="utf-8"))
    TXT = {
        "clients-1": "Aujourd’hui, on braque les projecteurs sur ton" + INS + "menu" + NB + "!",
        "clients-2": "Je le diffuse sur tous tes réseaux en même temps.",
        "clients-3": "Je le relaie à 11" + INS + "h sur ClikMe…",
        "clients-4": "…devant plus de 1" + INS + "000 personnes qui cherchent où manger ce midi.",
        "clients-5": "À toi de jouer" + NB + ": quel est l’intitulé de ton menu du jour" + NB + "?",
        "depenses-1": "Et si tes" + INS + "dîners payaient tes courses" + NB + "?",
        "depenses-2": "Tu offres un dîner aux commerçants du réseau.",
        "depenses-3": "Chaque dîner servi te rapporte des crédits.",
        "depenses-4": "Fleurs, coiffure, hôtel" + NB + ": gratuits avec tes crédits, ou à moitié prix.",
        "depenses-5": "Qu’est-ce que tu offres aux commerçants" + NB + "?",
    }
    ecarts, bouche = [], []
    for nom, txt in TXT.items():
        r = aligner(f"{D}/{nom}.mp3", txt, T[nom].get("a", 0))
        ref = T[nom]["m"]
        if len(r["m"]) != len(ref):
            print(nom, "nombre de mots", len(r["m"]), len(ref)); continue
        e = [round(x - y, 2) for x, y in zip(r["m"], ref)]
        ecarts += [abs(x) for x in e]
        n = min(len(r["b"]), len(T[nom]["b"]))
        bouche.append(sum(r["b"][i] == T[nom]["b"][i] for i in range(n)) / n)
        print(f"{nom:11} d {r['d']:.3f}/{T[nom]['d']:.3f}  écarts {e}")
    print(f"écart moyen {np.mean(ecarts):.3f} s · médian {np.median(ecarts):.3f} · max {max(ecarts):.2f} · > 0,1 s : {sum(x > 0.1 for x in ecarts)}/{len(ecarts)} · bouche identique {np.mean(bouche):.0%}")
else:
    print(json.dumps(aligner(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 0), ensure_ascii=False))
