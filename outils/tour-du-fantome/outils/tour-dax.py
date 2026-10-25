# COMBIEN DE CLIENTS, À DAX, CHAQUE JOUR ? Sous le projecteur (« Plus de clients »), le fantôme promettait
# « …devant plus de 1 000 personnes qui cherchent une idée de cadeau » : c'est faux pour une bijouterie. Le
# restaurant garde ses phrases (justes) ; les quatre autres tours métier disent, comme le lunetier
# (tour-lunettes.py), quatre phrases, chacune avec sa voix et son icône :
#   1. combien de Dacquois cherchent ce qu'il vend, chaque jour (le chiffre du métier) ;
#   2. « Pour capter ces … personnes, il faut être présent là où ils passent leur temps. » ;
#   3. « C'est la raison pour laquelle je diffuse votre annonce sur tous vos réseaux sociaux en même temps… » ;
#   4. « …et que je la relaie sur ClikMe, où plus de 1 000 Dacquois consultent les nouveautés des commerces
#      locaux chaque jour. »
# Les voix (enregistrements ElevenLabs « Mike ») : recu/dax/<métier>-1.mp3 et -2.mp3 ; les phrases 3 et 4,
# communes, sont celles du lunetier (recu/lunettes/voix/lunettes-dax-3.mp3, -4.mp3). Les nombres s'écrivent
# en chiffres mais se mesurent en toutes lettres (liés par des espaces insécables : un mot, un instant).
# À lancer après tour-sien.py (même index.html) :  python3 -I tour-dax.py <dossier>
import json, os, re, sys
import subprocess

S = sys.argv[1]
sys.path.insert(0, f"{S}/outils")
from alignement import aligner  # noqa: E402

FF = f"{S}/ffmpeg"
R = f"{S}/recu/dax"
NB, INS = " ", " "
POUR_CAPTER = "Pour capter ces {} personnes, il faut être présent là où ils passent leur temps."
COMMUNES = [("C’est la raison pour laquelle je diffuse votre annonce sur tous vos réseaux sociaux en même temps…", f"{S}/recu/lunettes/voix/lunettes-dax-3.mp3"),
            ("…et que je la relaie sur ClikMe, où plus de 1" + INS + "000 Dacquois consultent les nouveautés des commerces locaux chaque jour.", f"{S}/recu/lunettes/voix/lunettes-dax-4.mp3")]
METIERS = {
    "tour-vetements": ("vetements", "Chaque jour à Dax, environ 900 personnes cherchent à s’habiller.", "900"),
    "tour-coiffure": ("coiffure", "Chaque jour à Dax, environ 380 personnes cherchent un coiffeur.", "380"),
    "tour-librairie": ("librairie", "Chaque jour à Dax, en moyenne 250 personnes cherchent un nouveau livre à acquérir.", "250"),  # titre sur 3 lignes : voir SERRE
    "tour-bijouterie": ("bijouterie", "Chaque jour à Dax, en moyenne 60 personnes cherchent un bijou à acheter.", "60"),
    "tour-massage": ("massage", "Chaque jour à Dax, environ 150 personnes cherchent un massage ou un moment de bien-être.", "150",
                     "Pour capter ces 150 personnes, il faut être présent là où elles passent leur temps."),
}
EN_LETTRES = {"900": "neuf" + INS + "cents", "380": "trois" + INS + "cent" + INS + "quatre-vingts", "250": "deux" + INS + "cent" + INS + "cinquante",
              "60": "soixante", "150": "cent" + INS + "cinquante", "1" + INS + "000": "mille"}
ICONES = ["' + ICONES.monde + '", '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2"/></svg>',
          "' + ICONES.reseaux + '", '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>']
TEINTES = ["rose", "ambre", "rose", "ambre"]
# « ton coup de cœur » (insécable) met le titre de la libraire sur trois lignes : sa bulle se resserre encore
SERRE = {"tour-librairie": ".fx-dit{font-size:.98em}\n.fx-ligne{font-size:.71em}\n"}


def mesure(texte):
    return " ".join(EN_LETTRES.get(w.rstrip(",."), w.rstrip(",.")) + w[len(w.rstrip(",.")):] for w in texte.split(" "))


def preparer(src, dst, texte):
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", src, "-af",
                    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,afade=t=in:d=0.02",
                    "-c:a", "libmp3lame", "-q:a", "3", dst], check=True)
    t = aligner(FF, dst, mesure(texte))
    if len(t["m"]) != len(texte.split(" ")):
        raise SystemExit(f"{dst} : {len(t['m'])} instants pour {len(texte.split(' '))} mots")
    return t


CSS = """
/* QUATRE PHRASES SOUS LE PROJECTEUR (voir tour-dax.py) : la bulle s'élargit et son texte se resserre, pour
   tenir entière entre le haut de l'écran et le fantôme */
.fx-bulle{left:.5em;right:.5em}
.fx-dit{font-size:1.05em}
.fx-plan li{grid-template-columns:1.8em minmax(0,1fr);gap:.5em}
.fx-ico{width:1.8em;height:1.8em}
.fx-ligne{font-size:.75em;line-height:1.24}
"""

JS = """
  /* Combien de clients, à Dax, chaque jour (voir tour-dax.py) */
  Object.assign(TEMPS, __TEMPS_DAX__);
  __ENR_DAX__.forEach((n) => { if (!ENREGISTREES.includes(n)) ENREGISTREES.push(n); });
"""


def une_fois(t, avant, apres, quoi):
    if t.count(avant) != 1:
        raise SystemExit(f"{quoi} : {t.count(avant)} fois")
    return t.replace(avant, apres)


for d, (metier, phrase1, nombre, *phrase2) in METIERS.items():
    page = f"{S}/{d}/index.html"
    t = open(page, encoding="utf-8").read()
    phrases = [(phrase1, f"{R}/{metier}-1.mp3"), (phrase2[0] if phrase2 else POUR_CAPTER.format(nombre), f"{R}/{metier}-2.mp3")] + COMMUNES
    # une phrase pas encore enregistrée (un nouveau métier) : elle s'écrit au rythme estimé, sans le son
    temps = {f"dax-{k + 1}": preparer(src, f"{S}/{d}/dax-{k + 1}.mp3", txt) for k, (txt, src) in enumerate(phrases) if os.path.exists(src)}
    # les trois lignes d'avant (« Je la diffuse… », « Je la relaie à 11 h… », « …devant plus de 1 000 personnes… »)
    motif = re.compile(r"        \{ ico: '<span class=\"fx-ico rose\">' \+ ICONES\.reseaux \+ \"</span>\", txt: \"Je l[ae] diffuse sur tous tes réseaux en même temps\.\".*?"
                       r"000 personnes qui cherchent [^\"]*\", voix: \"[a-z0-9-]+\" \},\n", re.S)
    if len(motif.findall(t)) != 1:
        raise SystemExit(f"{d} : les lignes du projecteur, {len(motif.findall(t))} fois")
    lignes = "".join(f"        {{ ico: '<span class=\"fx-ico {TEINTES[k]}\">{ICONES[k]}</span>', txt: "
                     + json.dumps(txt, ensure_ascii=False).replace(INS, '" + INS + "') + f", voix: \"dax-{k + 1}\" }},\n"
                     for k, (txt, _) in enumerate(phrases))
    t = motif.sub(lambda m: lignes, t)
    t = une_fois(t, "</style>\n", CSS.lstrip("\n") + SERRE.get(d, "") + "</style>\n", f"{d} style")
    js = JS.replace("__TEMPS_DAX__", json.dumps(temps)).replace("__ENR_DAX__", json.dumps(sorted(temps)))
    t = une_fois(t, "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", js.lstrip("\n") + "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", f"{d} js")
    open(page, "w", encoding="utf-8").write(t)
    print(d, "· Dax :", nombre, "personnes par jour ·", " ".join(f"{k} {v['d']:.2f} s" for k, v in temps.items()))
