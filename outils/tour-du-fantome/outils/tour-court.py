# 🎬 « LE FANTÔME EN 45 SECONDES » — la démo courte des commerçants (Chez Bergine, restaurant).
#
# La bande-annonce du tour : une promesse (« Une photo le matin. Des clients le jour même. »), puis trois
# preuves de plus en plus fortes — le film publié partout, la même vidéo seule ou avec son fantôme
# (« ♥ 214, aucun prénom » contre « 38 prénoms »), et Camille, à qui le fantôme écrit un message rien qu'à
# elle, un peu mieux à chaque réponse, jusqu'au jour où elle pousse la porte. Un seul geste : toucher la cage.
#
# Les voix (enregistrements « Mike » du propriétaire, `recu/court/demo1-a…g.mp3`, lues mot pour mot) : leur
# volume est égalisé, chaque mot calé sur l'enregistrement (`alignement.py`, sans reconnaissance vocale),
# pour les sous-titres mot à mot et pour caler les gestes de la page sur ce qui est dit. La musique et les
# bruits sont joués par le navigateur (aucun droit). Les images sont celles du tour du restaurant.
#
#   python3 -I outils/tour-du-fantome/outils/tour-court.py outils/tour-du-fantome
#
# La page s'écrit dans `tour-court/index.html` d'après `outils/tour-court.html` : on retouche ici ou dans
# le modèle, jamais dans la page. Publiée par `scripts/poser-tours.mjs` à clikme.fr/tours/court.
import json, os, re, shutil, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voix_courtes import caler, egaliser  # noqa: E402

S = sys.argv[1]
FF = f"{S}/ffmpeg" if os.path.exists(f"{S}/ffmpeg") else shutil.which("ffmpeg")
D = f"{S}/tour-court"
R = f"{S}/recu/court"
NB = " "

# Les sept répliques, mot pour mot, coupées en morceaux de sous-titres (« | »).
SOUS = {
    "c1": ("demo1-a", "Libérez votre fantôme."),
    "c2": ("demo1-b", "Une photo le matin. | Des clients le jour même."),
    "c3": ("demo1-c", "Je fais votre film… | et je le publie partout."),
    "c4": ("demo1-d", "Une vidéo, vous savez la faire. | Moi, je vous ramène | ceux qui l’ont regardée."),
    "c5": ("demo1-e", "Au lieu d’un like, | ils libèrent un fantôme."),
    "c6": ("demo1-f", "Puis j’écris à chaque personne | un message rien qu’à elle. | Je la connais un peu mieux | à chaque réponse… | jusqu’au jour où | elle pousse votre porte."),
    "c7": ("demo1-g", "Votre fantôme vous attend."),
}
# Les looks des habitants (les fantômes de la foule), copiés du tour du restaurant.
LOOKS = ["cosy", "fleuri", "curieux", "artiste", "denim", "rebelle", "soleil", "voyageur"]


# la toque du chef (le dessin de l'intro des tours, `I_TOQUE` de tour-intro3.py), un identifiant par copie
TOQUE = ('<svg class="toque" viewBox="0 0 100 80" aria-hidden="true"><defs><radialGradient id="@1" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/>'
         '<stop offset=".6" stop-color="#F4F1EC"/><stop offset="1" stop-color="#D9D2C8"/></radialGradient><linearGradient id="@2" x1="0" x2="1"><stop offset="0" stop-color="#DCD5CB"/>'
         '<stop offset=".3" stop-color="#fff"/><stop offset=".7" stop-color="#F7F4EF"/><stop offset="1" stop-color="#CFC7BB"/></linearGradient></defs>'
         '<g fill="url(#@1)"><circle cx="24" cy="36" r="18"/><circle cx="76" cy="36" r="18"/><circle cx="38" cy="22" r="20"/><circle cx="62" cy="22" r="20"/><circle cx="50" cy="30" r="22"/></g>'
         '<path d="M50 6c-4 8-4 22 0 34M33 12c-2 9 0 20 4 28M67 12c2 9 0 20-4 28" stroke="#D8D0C4" stroke-width="1" fill="none" opacity=".7"/>'
         '<path d="M11 44Q50 38 89 44L92 79Q50 70 8 79Z" fill="url(#@2)"/><path d="M11 44Q50 38 89 44" stroke="#E2DBD0" stroke-width="1.2" fill="none"/>'
         '<path d="M24 43V74M37 41.5V71M50 41V70M63 41.5V71M76 43V74" stroke="#E4DED4" stroke-width=".9"/></svg>')
_toques = [0]


def toque():
    _toques[0] += 1
    k = _toques[0]
    return TOQUE.replace("@1", f"tq{k}a").replace("@2", f"tq{k}b")


def facade(ident, dedans="", devant=""):
    """La façade du commerce (celle de l'intro des tours) : son enseigne, son store, sa vitrine, sa porte, son fantôme."""
    return (f'<div class="fac" id="{ident}"><i class="fac-f"></i><div class="fac-ens"><b class="nom-commerce">Chez Bergine</b><small>BISTROT · DAX</small></div>'
            f'<i class="fac-store"></i><div class="fac-vit"><img src="si-interieur.webp" alt="">{dedans}</div><div class="fac-porte"><i></i></div><i class="fac-trot"></i>'
            f'<span class="hote"><img src="hote.webp" alt="">{toque()}</span>{devant}</div>')


# ② les clients du jour, qui arrivent à sa porte
CLIENTS = '<div class="clients">' + "".join(
    f'<span class="fg" style="left:-14%;top:93%;--k:{k};--h:15cqw" data-x="{x}%"><img src="g/{l}-debout.webp" alt=""></span>'
    for k, (x, l) in enumerate([(46, "denim"), (56, "soleil"), (64, "artiste")])) + "</div>"
# ⑥ Camille et sa sœur poussent la porte ; il l'appelle par son prénom
CAMILLE = ('<div class="arrivent"><span class="fg" style="left:33%;top:93%;--k:0;--h:21cqw"><img src="g/fleuri-debout.webp" alt=""><b>Camille</b></span>'
           '<span class="fg" style="left:53%;top:93%;--k:1;--h:20cqw"><img src="g/cosy-debout.webp" alt=""></span></div>'
           f'<p class="bulle-hote">Camille{NB}! On t’attendait 😊</p>')

# ─── LES VOIX : égalisées, puis chaque mot à son instant ───────────────────────────────────────
os.makedirs(f"{D}/voix", exist_ok=True)
os.makedirs(f"{D}/g", exist_ok=True)
TEMPS = {}
for c, (fichier, texte) in SOUS.items():
    src = f"{R}/{fichier}.mp3"
    egaliser(FF, src, f"{D}/voix/{c}.mp3")
    # les respirations de ces voix sont à -38 dB (mesuré) : à -45, deux phrases se collent
    a = caler(FF, src, texte.replace(" | ", " "), "-38dB")
    TEMPS[c] = {"d": a["d"], "m": a["m"]}
    print(c, a["d"], "s ·", len(a["m"]), "mots")

# ─── LES IMAGES (celles du tour du restaurant) ──────────────────────────────────────────────────
for f in ("m4.jpg", "m2.jpg", "m1.jpg", "si-interieur.webp"):
    shutil.copyfile(f"{S}/tour/{f}", f"{D}/{f}")
shutil.copyfile(f"{S}/accueil2/page/g-restaurant-salue.webp", f"{D}/hote.webp")
for l in LOOKS:
    for pose in ("debout", "salue", "assis"):
        shutil.copyfile(f"{S}/tour/tf/{l}-{pose}.webp", f"{D}/g/{l}-{pose}.webp")

# ─── LA PAGE ─────────────────────────────────────────────────────────────────────────────────
page = open(f"{S}/outils/tour-court.html", encoding="utf-8").read()
page = page.replace("@FACADE1@", facade("fac1", devant=CLIENTS))
page = page.replace("@FACADE2@", facade("fac2", dedans='<div class="foule dedans"></div>', devant='<div class="foule dehors"></div>'))
page = page.replace("@FACADE3@", facade("fac3", devant=CAMILLE))
page = re.sub("@TOQUE@", lambda m: toque(), page)
page = page.replace("/*@TEMPS@*/null", json.dumps(TEMPS, ensure_ascii=False))
page = page.replace("/*@SOUS@*/null", json.dumps({c: t for c, (_, t) in SOUS.items()}, ensure_ascii=False))
assert not re.search(r"@[A-Z0-9]+@|/\*@", page), "un repère @…@ n'a pas été remplacé"
open(f"{D}/index.html", "w", encoding="utf-8").write(page)
print("tour-court/index.html :", len(page) // 1024, "Ko")
