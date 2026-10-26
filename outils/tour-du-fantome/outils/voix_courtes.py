# 🎙️ LES VOIX DES DÉMOS COURTES (`tour-court.py`, `tour-entrepreneurs.py`) : le même volume pour toutes, et
# chaque mot à son instant — pour les sous-titres mot à mot et pour caler les gestes de la page sur ce qui est dit.
import json, re, subprocess

from alignement import aligner, duree, segments, syllabes


def egaliser(ff, src, dst, cible=-18):
    """Le même volume pour toutes les voix (deux passes de loudnorm, en linéaire : la voix n'est pas tassée)."""
    out = subprocess.run([ff, "-hide_banner", "-i", src, "-af", f"loudnorm=I={cible}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = json.loads(out[out.rindex("{"):out.rindex("}") + 1])
    af = (f"loudnorm=I={cible}:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-af", af, "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "128k", dst],
                   check=True)


def caler(ff, f, texte, seuil, coupures=(), liees=()):
    """Chaque mot à son instant. Quand la réplique a autant de phrases que de morceaux de voix (entre ses
    respirations), ils vont un pour un, et les mots se partagent leur morceau selon leurs syllabes ; sinon,
    l'alignement des tours (`alignement.py`), qui regroupe au débit le plus régulier — et qui, sur « …la faire.
    Moi, je vous ramène… », collait « Moi » à la phrase d'avant.
    coupures : les mots devant lesquels on entend une pause sans ponctuation ; liees : les mots après lesquels
    la ponctuation ne s'entend pas (« Moi, je te ramène » dit d'un trait)."""
    mots = texte.split(" ")
    phrases, cur = [], []
    for i, w in enumerate(mots):
        if cur and w in coupures:
            phrases.append(cur); cur = []
        cur.append(i)
        if re.search(r"[,;:.?!…]$", w) and w not in liees:
            phrases.append(cur); cur = []
    if cur:
        phrases.append(cur)
    d = duree(ff, f)
    segs = segments(ff, f, d, seuil)
    if len(segs) != len(phrases):
        return aligner(ff, f, texte, coupures, seuil)
    m = [0.0] * len(mots)
    for p, (a0, b0) in zip(phrases, segs):
        sy = [max(1, syllabes(mots[i].replace("*", ""))) for i in p]
        avant = 0
        for i, s in zip(p, sy):
            m[i] = round(a0 + (b0 - a0) * avant / sum(sy), 2)
            avant += s
    return {"d": round(d, 3), "m": m}
