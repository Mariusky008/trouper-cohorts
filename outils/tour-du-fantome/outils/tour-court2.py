# 🎬 « LE FANTÔME EN 45 SECONDES », deuxième version : un nouveau moteur (une caméra qui voyage, des particules et de
# la lumière, des mots animés, une musique pop jouée par le navigateur), piloté par une seule ligne de temps (GSAP).
#
# Le scénario : on touche la cage (« Libérez-moi ! »), Mike en jaillit et se présente ; avec quelques photos, il fait
# une très belle vidéo du commerce et la publie partout ; « mais ce n'est pas là que je suis le plus fort, c'est juste
# après » : à la fin de la vidéo, chacun libère son fantôme pour dire ce qu'il en pense (« J'adore la vidéo », « Je
# passerai un jour, c'est sûr », « Je passe aujourd'hui ») ; « et à partir de là, mon vrai travail commence » : il écrit
# à chacun, apprend à connaître Camille réponse après réponse, jusqu'au jour où elle pousse la porte. Puis la famille
# (d'après la démo du parcours) : chaque jour, la vidéo invite à rejoindre la famille de fantômes, qui grandit devant
# la porte ; les plus fidèles gagnent l'écusson d'or, et Mike les prévient en premier des bons plans.
#
# Les voix : les enregistrements « Mike » du propriétaire (`recu/court/v2-1…8.mp3`, `demo1-g.mp3`), lus mot pour mot,
# égalisés et calés mot à mot sur leurs pauses (`voix_courtes.py`). Une réplique pas encore enregistrée prend une
# durée estimée (`estimer`) : la page la montre en sous-titres, sur la musique seule.
#
#   /usr/bin/python3 -I outils/tour-du-fantome/outils/tour-court2.py outils/tour-du-fantome
#   node outils/tour-du-fantome/outils/rendre-video.mjs http://…/tour-court2/index.html sortie.mp4 30 1.5   (la vidéo, avec le son)
#
# La page s'écrit dans `tour-court2/index.html` d'après `outils/tour-court2.html` : on retouche ici ou dans le modèle.
# GSAP 3.13 (`recu/gsap/`) : gratuit, y compris pour un usage commercial (licence « no charge » de GreenSock).
import json, os, re, shutil, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voix_courtes import caler, egaliser  # noqa: E402

S = sys.argv[1]
FF = f"{S}/ffmpeg" if os.path.exists(f"{S}/ffmpeg") else shutil.which("ffmpeg")
D = f"{S}/tour-court2"
R = f"{S}/recu/court"
NB = " "

# Les sept répliques, mot pour mot, coupées en morceaux de sous-titres (« | »). L'aide au calage : « coupures », les
# mots devant lesquels l'enregistrement se tait sans ponctuation (une pause, ou le silence d'un « p » ou d'un « t ») ;
# « liees », les mots après lesquels la ponctuation ne s'entend pas.
SOUS = {
    "v1": ("v2-1-merci", f"Merci{NB}! | Je suis Mike, | votre futur fantôme préféré.", {}),
    "v2": ("v2-2-video", "Avec quelques photos, | je fais une très belle vidéo | de votre commerce, | puis je la publie partout | pour que tout le monde la voie.",
           {"liees": ("photos,",), "coupures": ("très", "partout", "tout")}),
    "v3": ("v2-3-juste-apres", "Mais ce n’est pas là | que je suis le plus fort. | C’est juste après.", {}),
    "v4": ("v2-4-choix", f"À la fin de la vidéo, | chaque personne peut libérer son fantôme | pour dire ce qu’elle en pense{NB}: | “J’adore la vidéo”, | "
           "“Je passerai un jour, c’est sûr”, | ou “Je passe aujourd’hui”.", {"liees": ("jour,",), "coupures": ("“Je",)}),
    "v5": ("v2-5-travail", "Et à partir de là, | mon vrai travail commence.", {"coupures": ("commence.",)}),
    "v6": ("v2-6-camille", "J’écris à chaque personne | qui a libéré son fantôme, | pour faire connaissance. | Je la connais un peu mieux | à chaque réponse… | "
           "jusqu’au jour où | elle pousse votre porte.", {"coupures": ("elle", "pousse")}),
    # la famille (d'après la démo du parcours) : la vidéo du jour, la foule devant la porte, l'écusson d'or
    "f1": ("v2-7-famille", "Et chaque jour, | une nouvelle vidéo invite | à rejoindre votre famille de fantômes. | Elle grandit devant votre porte.", {}),
    "f2": ("v2-8-ecusson", f"Les plus fidèles | gagnent l’écusson d’or{NB}: | ce sont eux que je préviens en premier | de vos bons plans.", {"coupures": ("eux",)}),
    "v7": ("demo1-g", "Votre fantôme vous attend.", {}),
}
LOOKS = ["cosy", "fleuri", "curieux", "artiste", "denim", "rebelle", "soleil", "voyageur"]

from decor import cage_mini, toque  # noqa: E402

# la façade du commerce (celle des tours) : sa porte s'ouvre, Camille et sa sœur entrent, Mike l'appelle par son prénom
FACADE = ('<div class="fac abs"><i class="fac-f"></i><div class="fac-ens"><b class="nom-commerce">Chez Bergine</b><small>BISTROT · DAX</small></div>'
          '<i class="fac-store"></i><div class="fac-vit"><img src="si-interieur.webp" alt=""></div><i class="fac-lumiere"></i>'
          '<div class="fac-porte"><div class="fac-battant"><i></i></div></div><i class="fac-trot"></i>'
          '<div class="arrivent"><span class="fg" style="left:62%;top:93%;--h:21cqw"><img src="g/fleuri-debout.webp" alt=""><b>Camille</b></span>'
          '<span class="fg" style="left:74%;top:93%;--h:20cqw"><img src="g/cosy-debout.webp" alt=""></span></div>'
          f'<p id="bulle-chef">Camille{NB}! On t’attendait 😊</p>@FAMILLE@</div>')

# la famille devant la porte : chaque fantôme porte son écusson cousu (bronze, argent, or) ; deux s'avancent avec leur mot
FAMILLE = [  # (gauche %, pied %, hauteur cqw, look, écusson)
    (18, 84, 14, "voyageur", "bronze"), (34, 83, 14, "rebelle", "bronze"), (50, 84, 14, "curieux", "argent"), (66, 83, 14, "soleil", "bronze"), (82, 84, 14, "artiste", "bronze"),
    (9, 97, 18, "curieux", "argent"), (25, 98, 21, "soleil", "or"), (41, 97, 18, "denim", "bronze"), (58, 98, 18, "cosy", "argent"), (75, 97, 18, "artiste", "or"), (91, 98, 17, "fleuri", "bronze"),
]
FAMILLE_HTML = ('<div class="famille">' + "".join(
    f'<span class="fg fam" style="left:{x}%;top:{y}%;--h:{h}cqw"><span class="corps"><img src="g/{g}-debout.webp" alt=""><i class="patch {e}"></i></span></span>'
    for x, y, h, g, e in FAMILLE) + "</div>"
    f'<p class="bulle-fam" id="bf1">« Merci pour l’accueil de samedi{NB}! »<small>Hugo · fantôme n°31 🥈</small></p>'
    f'<p class="bulle-fam" id="bf2">« Le magret, sans hésiter 🔥 »<small>Léa · fantôme n°12 🥇</small></p>')

# ─── LES VOIX ───────────────────────────────────────────────────────────────────────────────
os.makedirs(f"{D}/voix", exist_ok=True)
os.makedirs(f"{D}/g", exist_ok=True)
os.makedirs(f"{D}/js", exist_ok=True)
TEMPS = {}


def estimer(texte):
    """Une réplique pas encore enregistrée : ses mots au rythme des autres (un peu plus de 3 mots par seconde, un
    temps aux virgules et aux points). La page la montre en sous-titres, sur la musique seule."""
    t, m = 0.0, []
    for w in texte.split(" "):
        m.append(round(t, 3))
        t += 0.12 + 0.035 * len(re.sub(r"\W", "", w))
        if w[-1:] in ",:":
            t += 0.2
        elif w[-1:] in ".!?…":
            t += 0.35
    return {"d": round(t, 2), "m": m, "estime": True}


for c, (fichier, texte, aide) in SOUS.items():
    src = f"{R}/{fichier}.mp3"
    if not os.path.exists(src):
        TEMPS[c] = estimer(texte.replace(" | ", " "))
        if os.path.exists(f"{D}/voix/{c}.mp3"):
            os.remove(f"{D}/voix/{c}.mp3")
        print(c, TEMPS[c]["d"], "s · durée estimée : pas encore enregistrée", f"(recu/court/{fichier}.mp3)")
        continue
    egaliser(FF, src, f"{D}/voix/{c}.mp3")
    a = caler(FF, src, texte.replace(" | ", " "), "-38dB", aide.get("coupures", ()), aide.get("liees", ()))
    TEMPS[c] = {"d": a["d"], "m": a["m"]}
    print(c, a["d"], "s ·", len(a["m"]), "mots")

# ─── LES IMAGES (celles du tour du restaurant), GSAP ──────────────────────────────────────────
for f in ("m1.jpg", "m2.jpg", "m3.jpg", "m4.jpg", "si-interieur.webp"):
    shutil.copyfile(f"{S}/tour/{f}", f"{D}/{f}")
shutil.copyfile(f"{S}/accueil2/page/g-restaurant-salue.webp", f"{D}/hote.webp")
# LE FILM DU TÉLÉPHONE : la vidéo de l'interview du tour du restaurant (plus les quatre photos)
shutil.copyfile(f"{S}/tour/interview.mp4", f"{D}/interview.mp4")
# …et en WebM (VP8) pour les navigateurs sans H.264 — dont le Chromium de l'export (`rendre-video.mjs`) ; une image
# clé toutes les demi-secondes, pour que l'export tombe juste à chaque image
if not os.path.exists(f"{D}/interview.webm") or os.path.getmtime(f"{D}/interview.webm") < os.path.getmtime(f"{S}/tour/interview.mp4"):
    subprocess.run([FF, "-v", "error", "-y", "-i", f"{S}/tour/interview.mp4", "-an", "-c:v", "libvpx", "-b:v", "1M", "-g", "15",
                    "-deadline", "good", "-cpu-used", "2", f"{D}/interview.webm"], check=True)
for l in LOOKS:
    for pose in ("debout", "salue"):
        shutil.copyfile(f"{S}/tour/tf/{l}-{pose}.webp", f"{D}/g/{l}-{pose}.webp")
for f in ("gsap.min.js", "MotionPathPlugin.min.js"):
    shutil.copyfile(f"{S}/recu/gsap/{f}", f"{D}/js/{f}")

# ─── LA PAGE ─────────────────────────────────────────────────────────────────────────────────
page = open(f"{S}/outils/tour-court2.html", encoding="utf-8").read()
page = page.replace("@FACADE@", FACADE.replace("@FAMILLE@", FAMILLE_HTML))
page = re.sub("@TOQUE@", lambda m: toque(), page)
page = page.replace("@CAGE_ROSE@", cage_mini("#FF2E9A", True)).replace("@CAGE_ORANGE@", cage_mini("#F5A23A", False)).replace("@CAGE_VERTE@", cage_mini("#3DE2A6", False))
page = page.replace("/*@TEMPS@*/null", json.dumps(TEMPS, ensure_ascii=False))
page = page.replace("/*@SOUS@*/null", json.dumps({c: t for c, (_, t, _a) in SOUS.items()}, ensure_ascii=False))
assert not re.search(r"@[A-Z0-9_]+@|/\*@", page), "un repère @…@ n'a pas été remplacé"
open(f"{D}/index.html", "w", encoding="utf-8").write(page)
print("tour-court2/index.html :", len(page) // 1024, "Ko")
