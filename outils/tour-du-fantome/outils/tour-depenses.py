# « MOINS DE DÉPENSES » : LA PHRASE QUI FAIT TILT. Le système est riche (crédits, avance, réseau, bons,
# équipe) ; il lui faut une image, et le rapport coût / valeur, qui est le vrai wow économique :
#  · en ouverture (sous le projecteur, à la place de « Et si tes dîners payaient tes courses ? ») : « Et si
#    tes tables vides du mardi midi payaient ton coiffeur ? », dans les mots de chaque métier ;
#  · au bilan : ce que son offre lui coûte vraiment, et ce qu'elle vaut chez ses voisins (« Par exemple… »).
#    Le fantôme de son comptoir le dit dans une bulle, à la place des règles du réseau, qui reviennent après.
# Les voix (enregistrements ElevenLabs « Mike ») : recu/depenses/brut/<métier>.mp3 (la question) et
# <métier>2.mp3 (le bilan). « 50 € » s'écrit en chiffres mais se mesure « cinquante euros » (un seul mot,
# lié par une espace insécable : chaque mot garde son instant).
# À lancer après tour-gestes.py (même index.html) :  python3 -I tour-depenses.py <dossier>
import json, os, subprocess, sys

S = sys.argv[1]
sys.path.insert(0, f"{S}/outils")
from alignement import aligner  # noqa: E402

FF = f"{S}/ffmpeg"
R = f"{S}/recu/depenses"
NB, INS = " ", " "
E50, E15 = "50" + INS + "€", "15" + INS + "€"

METIERS = {
    "tour": ("restaurant",
             "Et si tes *tables" + INS + "vides du mardi midi payaient ton coiffeur" + NB + "?",
             "Par exemple, un dîner pour deux, c’est " + E50 + " sur ta carte… mais à peine *" + E15 + " de marchandise pour toi. Chez tes voisins, il vaut bien *" + E50 + "."),
    "tour-coiffure": ("coiffure",
             "Et si tes *créneaux" + INS + "vides du mardi matin payaient ton restaurant" + NB + "?",
             "Par exemple, une coupe à " + E50 + ", sur un créneau qui serait resté vide, ne te coûte presque que ton *temps. Chez tes voisins, elle vaut bien *" + E50 + "."),
    "tour-vetements": ("vetements",
             "Et si les *pièces qui dorment en réserve payaient ton restaurant" + NB + "?",
             "Par exemple, un bon de " + E50 + " dépensé chez toi ne te coûte que le *prix d’achat de la pièce. Chez tes voisins, il vaut bien *" + E50 + "."),
    "tour-librairie": ("librairie",
             "Et si les *livres qui dorment sur tes étagères payaient ton coiffeur" + NB + "?",
             "Par exemple, un bon de " + E50 + " dépensé chez toi ne te coûte que le *prix d’achat des livres. Chez tes voisins, il vaut bien *" + E50 + "."),
    "tour-bijouterie": ("bijouterie",
             "Et si les *bijoux qui dorment en vitrine payaient ton restaurant" + NB + "?",
             "Par exemple, un bon de " + E50 + " dépensé chez toi ne te coûte que le *prix de revient du bijou. Chez tes voisins, il vaut bien *" + E50 + "."),
}
# l'ancien titre de la scène, à remplacer (le restaurant a ses dîners, les autres leurs bons d'achat)
ANCIENS = ['titre: "Et si *tes" + INS + "dîners payaient tes courses" + NB + "?", voix: "depenses-1"',
           'titre: "Et si *tes" + INS + "bons" + INS + "d’achat payaient tes courses" + NB + "?", voix: "lou-depenses-1"']


def mesure(texte):
    return (texte.replace("*", "").replace("50" + INS + "€", "cinquante" + INS + "euros").replace("15" + INS + "€", "quinze" + INS + "euros"))


def preparer(src, dst, texte):
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", src, "-af",
                    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,afade=t=in:d=0.02",
                    "-c:a", "libmp3lame", "-q:a", "3", dst], check=True)
    t = aligner(FF, dst, mesure(texte))
    if len(t["m"]) != len(texte.split(" ")):
        raise SystemExit(f"{dst} : {len(t['m'])} instants pour {len(texte.split(' '))} mots")
    return t


CSS = """
/* « MOINS DE DÉPENSES » : au bilan, le fantôme de son comptoir dit ce que son offre lui coûte vraiment, et ce
   qu'elle vaut chez ses voisins ; sa bulle prend la place des règles du réseau, qui reviennent ensuite */
.xb-mot{position:absolute;left:.9em;right:.9em;top:30.9em;display:flex;align-items:flex-start;gap:.65em;padding:.8em .9em;border-radius:1.1em;background:#FFF1DF;color:#2A1A10;
  box-shadow:0 .8em 1.6em -.8em rgba(0,0,0,.75);opacity:0;transform:translateY(.6em) scale(.96);transition:opacity .35s,transform .5s var(--ease);pointer-events:none}
.xb-mot.on{opacity:1;transform:none}
.xb-mot.fini{opacity:0;transform:translateY(-.4em) scale(.97)}
.xb-mot img{flex:none;width:2.5em;height:2.5em;object-fit:contain;transform-origin:50% 85%}
.xb-mot.parle img{animation:fx-hoche .62s ease-in-out infinite}
.xb-mot p{margin:0;font-size:.88em;font-weight:700;line-height:1.36}
@media (prefers-reduced-motion:reduce){.xb-mot.parle img{animation:none}}
"""

JS = """
  /* « Moins de dépenses » : la phrase qui fait tilt (voir tour-depenses.py) */
  Object.assign(TEMPS, __TEMPS_DEP__);
  __ENR_DEP__.forEach((n) => { if (!ENREGISTREES.includes(n)) ENREGISTREES.push(n); });
  const BILAN_MOT = __BILAN_MOT__;
  const motBilanFin = () => { $("#xb-mot").classList.add("fini"); $("#xb-regles").classList.add("on"); };
"""
AVANT_BILAN = """          plus(() => r.classList.add("on"), 2600);
          $("#tampon-d").classList.remove("on");
          plus(finBilan, 3600);
        },
        agir() { effacer(); finBilan(); },"""
APRES_BILAN = """          $("#tampon-d").classList.remove("on");
          // ce que son offre lui coûte vraiment, et ce qu'elle vaut chez ses voisins ; puis les règles du réseau
          const mot = $("#xb-mot"), j = jetonVoix;
          mot.classList.remove("on", "fini"); $("p", mot).textContent = ""; $("img", mot).src = $("#v-xb .cz-av").getAttribute("src");
          plus(async () => {
            mot.classList.add("on");
            if (!(await pause(450, j)) || !(await prononcer(mot, $("p", mot), BILAN_MOT, "depenses-bilan"))) return;
            plus(motBilanFin, 1600);
            plus(finBilan, 2600);
          }, 2400);
        },
        agir() { effacer(); taireVoix(); motBilanFin(); finBilan(); },"""


def une_fois(t, avant, apres, quoi):
    if t.count(avant) != 1:
        raise SystemExit(f"{quoi} : {t.count(avant)} fois")
    return t.replace(avant, apres)


for d, (metier, titre, bilan) in METIERS.items():
    page = f"{S}/{d}/index.html"
    t = open(page, encoding="utf-8").read()
    temps = {"depenses-titre": preparer(f"{R}/brut/{metier}.mp3", f"{S}/{d}/depenses-titre.mp3", titre),
             "depenses-bilan": preparer(f"{R}/brut/{metier}2.mp3", f"{S}/{d}/depenses-bilan.mp3", bilan)}
    ancien = next(a for a in ANCIENS if a in t)
    t = une_fois(t, ancien, "titre: " + json.dumps(titre, ensure_ascii=False) + ', voix: "depenses-titre"', f"{d} titre")
    t = une_fois(t, "</style>\n", CSS.lstrip("\n") + "</style>\n", f"{d} style")
    t = une_fois(t, '<ul class="xb-regles" id="xb-regles"></ul>',
                 '<ul class="xb-regles" id="xb-regles"></ul><div class="xb-mot" id="xb-mot" aria-live="polite"><img alt=""><p></p></div>', f"{d} bulle")
    js = (JS.replace("__TEMPS_DEP__", json.dumps(temps)).replace("__ENR_DEP__", json.dumps(sorted(temps)))
          .replace("__BILAN_MOT__", json.dumps(bilan, ensure_ascii=False)))
    t = une_fois(t, "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", js.lstrip("\n") + "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", f"{d} js")
    t = une_fois(t, AVANT_BILAN, APRES_BILAN, f"{d} bilan")
    open(page, "w", encoding="utf-8").write(t)
    print(d, "· question", temps["depenses-titre"]["d"], "s · bilan", temps["depenses-bilan"]["d"], "s")
