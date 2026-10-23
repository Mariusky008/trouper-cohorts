# « MOINS DE DÉPENSES » : LA PHRASE QUI FAIT TILT. Le système est riche (crédits, avance, réseau, bons,
# équipe) ; il lui faut une image, et le rapport coût / valeur, qui est le vrai wow économique :
#  · en ouverture (sous le projecteur, à la place de « Et si tes dîners payaient tes courses ? ») : « Et si
#    tes tables vides du mardi midi payaient ton coiffeur ? », dans les mots de chaque métier ;
#  · dès qu'il fixe son offre (« 1 dîner = 50 € à dépenser ») : ce qu'elle lui coûte vraiment, et ce qu'elle
#    vaut chez ses voisins (« Par exemple… »). « Je l'aurais mis dans un endroit plus approprié pour comprendre
#    dès le départ » : le fantôme de son comptoir le dit dans une bulle posée sur la photo de son offre.
#  · au bilan, plus de bulle : les règles du réseau, et un écran resserré pour que les boutons de la fin ne
#    les recouvrent plus.
# Les voix (enregistrements ElevenLabs « Mike ») : recu/depenses/brut/<métier>.mp3 (la question) et
# <métier>2.mp3 (le coût réel, dit à l'offre). « 50 € » s'écrit en chiffres mais se mesure « cinquante euros » (un seul mot,
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
    "tour-lunettes": ("lunettes",
             "Et si les *montures qui dorment en vitrine payaient ton restaurant" + NB + "?",
             "Par exemple, un bon de " + E50 + " dépensé chez toi ne te coûte que le *prix d’achat de la monture. Chez tes voisins, il vaut bien *" + E50 + "."),
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
/* « MOINS DE DÉPENSES » : dès qu'il fixe son offre, le fantôme de son comptoir dit ce qu'elle lui coûte vraiment
   et ce qu'elle vaut chez ses voisins, dans une bulle posée sur la photo de l'offre */
.ex-mot{position:absolute;z-index:4;left:.9em;right:.9em;top:.5em;display:flex;align-items:center;gap:.65em;padding:.75em .9em;border-radius:1.2em 1.2em .4em .4em;
  background:#FFF1DF;color:#2A1A10;box-shadow:0 .8em 1.6em -.8em rgba(0,0,0,.75);opacity:0;transform:translateY(.6em) scale(.96);transition:opacity .35s,transform .5s var(--ease);pointer-events:none}
.ex-mot.on{opacity:1;transform:none}
.ex-mot img{flex:none;width:2.6em;height:2.6em;object-fit:contain;transform-origin:50% 85%}
.ex-mot.parle img{animation:fx-hoche .62s ease-in-out infinite}
.ex-mot p{margin:0;font-size:.86em;font-weight:700;line-height:1.36}
@media (prefers-reduced-motion:reduce){.ex-mot.parle img{animation:none}}
/* le bilan, resserré : ses lignes moins hautes, et les règles empilées juste dessous (quelle que soit la
   hauteur des lignes), la place pour les boutons de la fin */
.xb-l{min-height:3.5em;padding:.45em .75em}
.xb-pile{position:absolute;left:.9em;right:.9em;top:12.4em;display:flex;flex-direction:column;gap:.75em}
.xb-pile>.xb-lignes,.xb-pile>.xb-regles{position:static}
"""

JS = """
  /* « Moins de dépenses » : la phrase qui fait tilt (voir tour-depenses.py) */
  Object.assign(TEMPS, __TEMPS_DEP__);
  __ENR_DEP__.forEach((n) => { if (!ENREGISTREES.includes(n)) ENREGISTREES.push(n); });
  const VRAI_MOT = __VRAI_MOT__;
  /* ce que son offre lui coûte vraiment : sa bulle se pose sur la photo de l'offre, et il le dit */
  async function direVrai(j) {
    const mot = $("#x1-mot");
    if (!mot || j !== jetonVoix) return;
    $("p", mot).textContent = ""; $("img", mot).src = $("#v-x1 .ex-fant").getAttribute("src");
    mot.classList.add("on");
    if (!(await pause(400, j))) return;
    if (await prononcer(mot, $("p", mot), VRAI_MOT, "depenses-vrai")) mot.dataset.fini = "1";
  }
  /* « Suivant » touché avant qu'il l'ait dit : il se tait, sa phrase s'écrit en entier ; on continue au
     toucher suivant (c'est le wow économique, on ne le saute pas sans l'avoir vu) */
  function vraiDit() {
    const mot = $("#x1-mot");
    if (mot.dataset.fini === "1") return true;
    taireVoix(); effacer();
    $("img", mot).src = $("#v-x1 .ex-fant").getAttribute("src");
    $("p", mot).textContent = VRAI_MOT.replace(/\\*/g, "");
    mot.classList.remove("parle", "ouvre"); mot.classList.add("on"); mot.dataset.fini = "1";
    return false;
  }
"""
def une_fois(t, avant, apres, quoi):
    if t.count(avant) != 1:
        raise SystemExit(f"{quoi} : {t.count(avant)} fois")
    return t.replace(avant, apres)


for d, (metier, titre, bilan) in METIERS.items():
    page = f"{S}/{d}/index.html"
    t = open(page, encoding="utf-8").read()
    temps = {"depenses-titre": preparer(f"{R}/brut/{metier}.mp3", f"{S}/{d}/depenses-titre.mp3", titre),
             "depenses-vrai": preparer(f"{R}/brut/{metier}2.mp3", f"{S}/{d}/depenses-vrai.mp3", bilan)}
    ancien = next(a for a in ANCIENS if a in t)
    t = une_fois(t, ancien, "titre: " + json.dumps(titre, ensure_ascii=False) + ', voix: "depenses-titre"', f"{d} titre")
    t = une_fois(t, "</style>\n", CSS.lstrip("\n") + "</style>\n", f"{d} style")
    t = une_fois(t, '<div class="ex-egal" id="x1-egal">',
                 '<div class="ex-mot" id="x1-mot" aria-live="polite"><img alt=""><p></p></div><div class="ex-egal" id="x1-egal">', f"{d} bulle")
    t = une_fois(t, '<div class="xb-lignes" id="xb-lignes"></div>\n            <ul class="xb-regles" id="xb-regles"></ul>',
                 '<div class="xb-pile"><div class="xb-lignes" id="xb-lignes"></div><ul class="xb-regles" id="xb-regles"></ul></div>', f"{d} bilan")
    js = (JS.replace("__TEMPS_DEP__", json.dumps(temps)).replace("__ENR_DEP__", json.dumps(sorted(temps)))
          .replace("__VRAI_MOT__", json.dumps(bilan, ensure_ascii=False)))
    t = une_fois(t, "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", js.lstrip("\n") + "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", f"{d} js")
    # l'offre : la bulle se range quand on revient ; elle vient après la pièce « 1 … = 50 € »
    t = une_fois(t, '$("#x1-egal").classList.remove("on");', '$("#x1-egal").classList.remove("on"); $("#x1-mot").classList.remove("on"); $("#x1-mot").dataset.fini = "";', f"{d} offre remise")
    t = une_fois(t, '() => plus(monnaie, 300)));', '() => { plus(monnaie, 300); plus(() => direVrai(j), 2000); }));', f"{d} offre")
    t = une_fois(t, 'monnaie(); return; }\n          son("pop"); aller(idx + 1);',
                 'monnaie(); plus(() => direVrai(jetonVoix), 1600); return; }\n          if (!vraiDit()) return;\n          son("pop"); aller(idx + 1);', f"{d} offre passée")
    open(page, "w", encoding="utf-8").write(t)
    print(d, "· question", temps["depenses-titre"]["d"], "s · coût réel", temps["depenses-vrai"]["d"], "s")
