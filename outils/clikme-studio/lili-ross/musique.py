# musique.py sortie.wav : la bande-son du film « Le look du jour » (21 s, 120 BPM), composée ici, note par note.
# Accroche douce (0–2 s), retour en arrière (2–2,5 s), le groove des cinq pièces (2,5–12,5 s), « Et voilà » (12,5–14,5),
# le déclic photo et les annotations, une par temps (14,5–18,5), la fin (18,5–21). Aucune voix.
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
DUREE = 21.0
N = int(SR * DUREE)
BPM = 120
TEMPS = 60 / BPM  # 0,5 s
rng = np.random.default_rng(7)

def vide():
    return np.zeros(N)

def poser(piste, son, t, gain=1.0):
    i = int(t * SR)
    if i >= N:
        return
    j = min(N, i + len(son))
    piste[i:j] += son[: j - i] * gain

def filtre(x, kind, f, ordre=2):
    sos = butter(ordre, f, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)

def env(n, a=0.005, d=0.3, courbe=4.0):
    t = np.arange(n) / SR
    e = np.exp(-t / max(1e-4, d) * (courbe / 4))
    att = np.clip(t / max(1e-4, a), 0, 1)
    return e * att

def mid(n):
    return 440.0 * 2 ** ((n - 69) / 12)

# ── les instruments ────────────────────────────────────────────────────────────────────────────
def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 46 + 110 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    corps = np.sin(ph) * np.exp(-t / 0.22)
    clic = filtre(rng.standard_normal(n) * np.exp(-t / 0.004), "highpass", 2500) * 0.25
    return np.tanh((corps + clic) * 1.6) * 0.9

def clap():
    n = int(0.35 * SR); t = np.arange(n) / SR
    bruit = rng.standard_normal(n)
    e = np.zeros(n)
    for k, dt in enumerate((0, 0.011, 0.022)):
        i = int(dt * SR); e[i:] += np.exp(-(t[: n - i]) / (0.006 if k < 2 else 0.12)) * (0.8 if k < 2 else 1.0)
    return filtre(bruit * e, "bandpass", [900, 3200]) * 0.55

def hat(ouvert=False):
    n = int((0.28 if ouvert else 0.06) * SR); t = np.arange(n) / SR
    x = filtre(rng.standard_normal(n), "highpass", 7500) * np.exp(-t / (0.09 if ouvert else 0.018))
    return x * (0.22 if ouvert else 0.16)

def basse(note, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    f = mid(note)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) + 0.18 * np.sign(np.sin(2 * np.pi * f * t))
    x = filtre(x, "lowpass", 520)
    return np.tanh(x * 1.4) * env(n, 0.004, dur * 0.9, 3) * 0.42

def piano(note, dur, vel=1.0):
    # un piano électrique : modulation de fréquence qui s'éteint vite (l'attaque claire), puis le corps
    n = int(dur * SR); t = np.arange(n) / SR
    f = mid(note)
    mod = np.sin(2 * np.pi * f * t) * (2.2 * np.exp(-t / 0.06) + 0.25)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / (dur * 0.55))
    x += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.15)
    return x * np.clip(t / 0.003, 0, 1) * 0.16 * vel

def nappe(notes, dur, coupure=1400):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for nt in notes:
        for det in (-0.12, 0.0, 0.11):
            f = mid(nt + det)
            x += 2 * ((f * t + rng.random()) % 1.0) - 1  # dents de scie, un peu désaccordées
    x = filtre(x, "lowpass", coupure)
    a = np.clip(t / 0.25, 0, 1) * np.clip((dur - t) / 0.35, 0, 1)
    return x * a * 0.035

def pincee(note, dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    f = mid(note)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.03)
    return x * env(n, 0.002, 0.16, 4) * 0.13

def souffle(dur, f0, f1, gain=0.3):
    # un « whoosh » : du bruit dont la bande monte (ou descend), fenêtre douce
    n = int(dur * SR); out = np.zeros(n)
    bruit = rng.standard_normal(n)
    pas = int(0.02 * SR)
    for i in range(0, n, pas):
        u = i / n; fc = f0 * (f1 / f0) ** u
        seg = bruit[max(0, i - pas): i + pas]
        y = filtre(seg, "bandpass", [max(60, fc * 0.6), min(18000, fc * 1.6)])
        out[i: i + pas] += y[-pas:][: len(out[i: i + pas])] if len(y) >= pas else 0
    w = np.sin(np.pi * np.arange(n) / n) ** 1.5
    return out * w * gain

def montee(dur, gain=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    x = souffle(dur, 400, 9000, 1.0) * (t / dur) ** 2
    ton = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / dur) ** 2) / SR) * 0.15 * (t / dur) ** 3
    return (x + ton) * gain

def rembobine(dur):
    # la cassette qu'on rembobine : un ton qui glisse vers le grave en ondulant, et un souffle à l'envers
    n = int(dur * SR); t = np.arange(n) / SR
    f = 900 * (1 - t / dur) ** 1.6 + 120 + 60 * np.sin(2 * np.pi * 18 * t)
    ton = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.18
    r = filtre(rng.standard_normal(n), "bandpass", [1500, 9000]) * (t / dur) ** 2 * 0.25
    return (ton + r) * np.clip((dur - t) / 0.05, 0, 1)

def declic():
    # l'appareil photo : deux claquements secs et un petit ressort
    n = int(0.25 * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for dt, g in ((0, 1.0), (0.055, 0.7)):
        i = int(dt * SR); m = n - i
        x[i:] += filtre(rng.standard_normal(m) * np.exp(-t[:m] / 0.006), "bandpass", [1800, 7000]) * g
        x[i:] += np.sin(2 * np.pi * 180 * t[:m]) * np.exp(-t[:m] / 0.02) * 0.4 * g
    return x * 0.6

def pop(note):
    n = int(0.18 * SR); t = np.arange(n) / SR
    f = mid(note) * (1 + 0.6 * np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.06, 4) * 0.22

def scintille(dur):
    n = int(dur * SR); x = np.zeros(n)
    for k in range(18):
        t0 = rng.random() * dur * 0.9
        poser_local = int(t0 * SR)
        s = pincee(int(rng.choice([88, 91, 93, 95, 96, 100])), 0.4) * 0.5
        j = min(n, poser_local + len(s)); x[poser_local:j] += s[: j - poser_local]
    return x

# ── l'harmonie : fa maj7 – sol 6 – mi m7 – la m7, une mesure (2 s) chacun ──────────────────────
ACCORDS = [(53, 57, 60, 64), (55, 59, 62, 64), (52, 55, 59, 62), (57, 60, 64, 67)]
BASSES = [41, 43, 40, 45]

def mesure(T):
    return int(T // (4 * TEMPS)) % 4

batterie, basses, harmo, melo, effets, nappes = vide(), vide(), vide(), vide(), vide(), vide()
K, C, HF, HO = kick(), clap(), hat(), hat(True)

def groove(debut, fin, plein=True):
    t = debut
    while t < fin - 1e-6:
        b = round(t / TEMPS)
        poser(batterie, K, t, 1.0)
        if b % 2 == 1 and plein:
            poser(batterie, C, t, 0.9)
        poser(batterie, HO if plein else HF, t + TEMPS / 2, 0.8)
        for k in (1, 3):
            poser(batterie, HF, t + k * TEMPS / 4, 0.55 + 0.15 * (k == 3))
        t += TEMPS

def ligne_de_basse(debut, fin):
    t = debut
    while t < fin - 1e-6:
        m = mesure(t); r = BASSES[m]
        for (dt, d, oct) in ((0.0, 0.42, 0), (0.75, 0.2, 12), (1.0, 0.42, 0), (1.5, 0.22, 0), (1.75, 0.2, 7)):
            if t + dt < fin:
                poser(basses, basse(r + oct, d), t + dt)
        t += 4 * TEMPS

def accords(debut, fin, stabs=True):
    t = debut
    while t < fin - 1e-6:
        m = mesure(t)
        poser(nappes, nappe(ACCORDS[m], 4 * TEMPS + 0.3), t)
        if stabs:
            for k in range(4):
                for nt in ACCORDS[m]:
                    poser(harmo, piano(nt + 12, 0.28, 0.9), t + k * TEMPS + TEMPS / 2)
        t += 4 * TEMPS

MOTIF = [0, 2, 3, 1, 2, 3, 2, 1]
def arpege(debut, fin, haut=24):
    t = debut; i = 0
    while t < fin - 1e-6:
        m = mesure(t)
        nt = ACCORDS[m][MOTIF[i % 8]] + haut
        poser(melo, pincee(nt), t)
        t += TEMPS / 2; i += 1

# 0–2 s : l'accroche, douce (le look complet au ralenti)
accords(0.0, 2.0, stabs=False)
for k, nt in enumerate((76, 79, 81, 84)):
    poser(melo, piano(nt, 0.9, 0.9), 0.1 + k * TEMPS)
poser(effets, montee(1.5, 0.3), 0.5)
# 2–2,5 s : le retour en arrière
poser(effets, rembobine(0.5), 2.0, 1.0)
# 2,5–12,5 s : les cinq pièces
groove(2.5, 12.5); ligne_de_basse(2.5, 12.5); accords(2.5, 12.5); arpege(2.5, 12.5)
for t in (4.5, 6.5, 8.5, 10.5):
    poser(effets, souffle(0.36, 300, 4000, 0.35), t - 0.2)
poser(effets, souffle(0.5, 4000, 500, 0.3), 6.7)  # le manteau qui tourne
# 12,5–14,5 : « Et voilà » — la montée vers le déclic
groove(12.5, 14.0); ligne_de_basse(12.5, 14.5); accords(12.5, 14.5); arpege(12.5, 14.5, 36)
for k in range(8):
    poser(batterie, C, 14.0 + k * TEMPS / 8, 0.25 + 0.08 * k)
poser(effets, montee(1.0, 0.35), 13.5)
# 14,5 : le déclic, puis les annotations, une par temps
poser(effets, declic(), 14.5, 1.2)
accords(14.5, 18.5, stabs=False)
t = 15.0
while t < 18.5 - 1e-6:
    poser(batterie, K, t, 0.55); poser(batterie, HF, t + TEMPS / 2, 0.5); t += TEMPS
for k, nt in enumerate((84, 86, 88, 91, 93)):
    poser(effets, pop(nt), 15.5 + k * TEMPS, 1.0)
poser(effets, scintille(3.5), 14.8, 0.8)
# 18,5–21 : la fin
poser(effets, souffle(0.5, 600, 6000, 0.3), 18.3)
for nt in (53, 57, 60, 64, 67, 72, 76):
    poser(harmo, piano(nt, 2.4, 1.1), 18.5)
poser(batterie, K, 18.5, 1.0)
poser(nappes, nappe((53, 60, 64, 67), 2.5, 1800), 18.5)

# ── le mélange : la nappe et la basse s'effacent sous la grosse caisse, un peu de réverbération ────
pompe = np.ones(N)
for t in np.arange(2.5, 14.0, TEMPS):
    i = int(t * SR); n = int(0.32 * SR); j = min(N, i + n)
    pompe[i:j] = np.minimum(pompe[i:j], 0.35 + 0.65 * (np.arange(j - i) / n) ** 0.7)
ir_n = int(1.6 * SR); tir = np.arange(ir_n) / SR
ir = rng.standard_normal(ir_n) * np.exp(-tir / 0.45); ir = filtre(ir, "lowpass", 6000); ir /= np.sqrt(np.sum(ir ** 2))
def reverb(x, mouille):
    return x + fftconvolve(x, ir)[:N] * mouille

gauche = batterie * 0.95 + basses * pompe + reverb(harmo, 0.35) * 0.95 + reverb(nappes * pompe, 0.5) + reverb(effets, 0.25)
droite = gauche.copy()
# la mélodie en écho (croche pointée), un peu à gauche puis à droite
d = int(0.375 * SR)
echo_g = reverb(melo, 0.3).copy(); echo_d = np.zeros(N)
echo_d[d:] += echo_g[:-d] * 0.45; echo_g[2 * d:] += reverb(melo, 0.3)[: -2 * d] * 0.22
gauche += echo_g * 0.9; droite += (reverb(melo, 0.3) * 0.7 + echo_d)
# fondu final
f = np.ones(N); i = int(19.8 * SR); f[i:] = np.linspace(1, 0, N - i) ** 1.5
stereo = np.stack([gauche * f, droite * f], axis=1)
stereo = filtre(stereo.T, "highpass", 28).T
stereo = np.tanh(stereo / np.max(np.abs(stereo)) * 1.3) / np.tanh(1.3) * 0.89
import wave
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype("<i2").tobytes())
print("ok", stereo.shape, float(np.max(np.abs(stereo))))
