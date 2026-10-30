# 🎬 LA DÉMO HUMAINE, « Un mois avec ClikMe » (`docs/demo-humaine-repliques.md`) : le propriétaire — sa figurine à
# grosse tête (`figurine.py`), d'après ses photos — et Mike racontent, en treize répliques, un mois chez un commerce
# inventé (Chez Bergine) : sa carte de CV qui devient sa figurine, la cage de Mike qui explose, les 30 jours, le
# jour 1 (photos, questions), la vidéo publiée partout, les trois cages, Mike qui répond à chacun et fait venir
# Camille, la cage dorée et ses surprises, la famille devant la porte, le bilan du mois, « pas de blabla », « des
# clients, pas des vues », et « 1 mois gratuit ».
#
# Le moteur est celui de la démo de 45 secondes (`tour-court2.html`) : une caméra qui voyage, des particules, des
# mots animés, une musique jouée par le navigateur, une seule ligne de temps (GSAP).
#
# Les voix : les enregistrements reçus le 30 octobre (`recu/humain/01-p.mp3` … `13-p.mp3` ; « p » le propriétaire,
# « m » Mike, les deux sur ElevenLabs, choisies par le propriétaire), égalisées et calées mot à mot sur leurs pauses
# (`voix_courtes.py`).
#
#   /usr/bin/python3 -I outils/tour-du-fantome/outils/tour-humain.py outils/tour-du-fantome
#   node outils/tour-du-fantome/outils/rendre-video.mjs http://…/tour-humain/index.html sortie.mp4 30 1   (la vidéo, avec le son)
#
# La page s'écrit dans `tour-humain/index.html` d'après `outils/tour-humain.html` : on retouche ici ou dans le modèle.
import json, os, re, shutil, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voix_courtes import caler, egaliser  # noqa: E402
from figurine import preparer, pistes  # noqa: E402
from decor import cage_mini, toque  # noqa: E402
from PIL import Image  # noqa: E402

S = sys.argv[1]
RACINE = os.path.abspath(f"{S}/../..")
FF = f"{S}/ffmpeg" if os.path.exists(f"{S}/ffmpeg") else shutil.which("ffmpeg")
D = f"{S}/tour-humain"
R = f"{S}/recu/humain"
NB = " "
# Son prénom, tel qu'il le dit dans la réplique 1 (« Moi, c'est … ») : À CONFIRMER par le propriétaire (pris du nom de
# son compte, pas de l'écoute — aucune transcription automatique ici).
PRENOM = "Jean-Philippe"

# Les treize répliques, mot pour mot, coupées en morceaux de sous-titres (« | »). L'aide au calage : « coupures », les
# mots devant lesquels l'enregistrement se tait sans ponctuation ; « liees », les mots après lesquels la ponctuation ne
# s'entend pas ; « coupe », la fin à garder (un bruit après la phrase).
SOUS = {
    "l01": ("01-p", f"Bonjour{NB}! | Moi, c’est {PRENOM}. | Mon métier{NB}? | Faire en sorte que les gens | ne se contentent plus | de regarder votre commerce | "
            "sur leur téléphone… | mais qu’ils poussent votre porte.", {"liees": ("Moi,",), "coupures": ("poussent",)}),
    "l02": ("02-m", f"Et moi{NB}! | Je suis Mike, | votre futur fantôme préféré.", {}),
    "l03": ("03-p", f"On a 30 jours | pour transformer votre communauté | en clients. | Je vous montre{NB}?", {}),
    "l04": ("04-p", f"Jour 1{NB}: | je viens chez vous. | Quelques photos, | deux ou trois questions… | et Mike s’occupe du reste.", {"liees": ("photos,",)}),
    "l05": ("05-m", "Avec quelques photos, | je fais une très belle vidéo | où je mets à l’honneur | votre menu du jour, | puis je la publie partout | "
            "pour que tout le monde la voie.", {"coupures": ("quelques", "où", "pour", "monde")}),
    "l06": ("06-p", "Mais ce n’est pas là | qu’il est le plus fort. | C’est juste après.", {}),
    "l07": ("07-m", f"À la fin de la vidéo, | chaque personne peut libérer son fantôme | pour dire ce qu’elle en pense{NB}: | “J’adore la vidéo”, | "
            "“Je passerai un jour, c’est sûr”, | ou “Je passe aujourd’hui”.", {"coupures": ("sûr”,",)}),
    "l08": ("08-m", f"Et moi, | je leur réponds{NB}! | Petit à petit, | je découvre leurs envies, | leurs habitudes… | et je leur donne une bonne raison | "
            "de pousser votre porte. | Et pour les plus fidèles, | ceux qui ouvrent en premier | ma cage dorée, | je les bichonne | avec des petites surprises.",
            {"liees": ("petit,",)}),
    "l09": ("09-m", "Chaque jour, | une nouvelle vidéo invite | à rejoindre votre famille de fantômes. | Elle grandit devant votre porte.", {"coupe": 6.08}),
    "l10": ("10-p", f"À la fin du mois, | on fait le bilan ensemble{NB}: | chaque bon validé | à votre comptoir, | c’est un client | que je vous ai amené.",
            {"liees": ("mois,", "comptoir,")}),
    "l11": ("11-m", f"Et voilà{NB}: | pas de blabla, | pas de fausses promesses.", {}),
    "l12": ("12-m", "On n’est pas là | pour vous apporter des vues. | On est là | pour vous apporter des clients.", {}),
    "l13": ("13-p", f"1 mois gratuit, | un mois pour faire mes preuves, | alors, | on commence{NB}?", {}),
}

# Les moments de sa figurine (répliques du propriétaire) : (expression, mot de départ ou « fin », décalage, mot de fin
# ou « fin » ou None, décalage). Le clin d'œil après « Mon métier ? », les yeux qui louchent sur son téléphone, son
# grand rire ; un clin d'œil pour « Je vous montre ? », etc.
MOMENTS = {
    "l01": [("clin", "Faire", -.39, "Faire", -.01), ("louche", "sur", 0, "mais", -.25), ("rire", "fin", -.23, None, 0)],
    "l03": [("clin", "fin", -.15, "fin", .3)],
    "l04": [("louche", "trois", 0, "et", -.3), ("clin", "fin", -.25, "fin", .2)],
    "l06": [("clin", "fin", -.3, "fin", .15)],
    "l10": [("rire", "fin", -.25, "fin", .7)],
    "l13": [("rire", "fin", -.25, None, 0)],
}

# ─── LES DÉCORS (ceux de la démo de 45 s) ─────────────────────────────────────────────────────
FACADE = ('<div class="fac abs"><i class="fac-f"></i><div class="fac-ens"><b class="nom-commerce">Chez Bergine</b><small>BISTROT · DAX</small></div>'
          '<i class="fac-store"></i><div class="fac-vit"><img src="si-interieur.webp" alt=""></div><i class="fac-lumiere"></i>'
          '<div class="fac-porte"><div class="fac-battant"><i></i></div></div><i class="fac-trot"></i>'
          '<div class="arrivent"><span class="fg" style="left:62%;top:93%;--h:21cqw"><img src="g/fleuri-debout.webp" alt=""><b>Camille</b></span>'
          '<span class="fg" style="left:74%;top:93%;--h:20cqw"><img src="g/cosy-debout.webp" alt=""></span></div>'
          f'<p id="bulle-chef">Camille{NB}! On t’attendait 😊</p>@FAMILLE@</div>')
FAMILLE = [  # (gauche %, pied %, hauteur cqw, look, pièce cousue)
    (18, 84, 14, "voyageur", "bronze"), (34, 83, 14, "rebelle", "bronze"), (50, 84, 14, "curieux", "argent"), (66, 83, 14, "soleil", "bronze"), (82, 84, 14, "artiste", "bronze"),
    (9, 97, 18, "curieux", "argent"), (25, 98, 21, "soleil", "or"), (41, 97, 18, "denim", "bronze"), (58, 98, 18, "cosy", "argent"), (75, 97, 18, "artiste", "or"), (91, 98, 17, "fleuri", "bronze"),
]
FAMILLE_HTML = '<div class="famille">' + "".join(
    f'<span class="fg fam" style="left:{x}%;top:{y}%;--h:{h}cqw"><span class="corps"><img src="g/{g}-debout.webp" alt=""><i class="patch {e}"></i></span></span>'
    for x, y, h, g, e in FAMILLE) + "</div>"
# les 30 jours (le 1er et le 30e seront entourés)
JOURS = "".join(f'<span>{k}<i>{k}</i><b class="rond"></b></span>' for k in range(1, 31))
# la communauté (des « j'aime »)… qui devient des clients
COMM = "".join(f'<span><em>{e}</em><img src="g/{g}-salue.webp" alt=""></span>' for e, g in (("❤️", "cosy"), ("👍", "soleil"), ("💬", "artiste"), ("❤️", "curieux"), ("👍", "rebelle")))
# les fidèles devant la cage dorée : les trois premiers gagnent chacun leur surprise
DOREE = [(70, "soleil", "or", "🍮 Un dessert", -74), (270, "artiste", "or", "☕ Un café", -134), (470, "curieux", "argent", "🥐 Une douceur", -74),
         (670, "cosy", "argent", None, 0), (870, "denim", "bronze", None, 0)]
DOREE_G = "".join(f'<span class="dor-g" style="left:{x}px"><span class="corps"><img src="g/{g}-debout.webp" alt=""><i class="patch {e}"></i></span>'
                  + (f'<em class="dor-s" style="top:{h}px">{s}</em>' if s else "") + "</span>" for x, g, e, s, h in DOREE)
VU_G = "".join(f'<span class="pt-g" style="left:{x}px"><img src="g/{g}-debout.webp" alt=""></span>' for g, x in (("fleuri", 10), ("rebelle", 90), ("voyageur", 170)))
LOOKS = ["cosy", "fleuri", "curieux", "artiste", "denim", "rebelle", "soleil", "voyageur"]

# ─── LES VOIX ───────────────────────────────────────────────────────────────────────────────
for sous in ("voix", "g", "js", "f"):
    os.makedirs(f"{D}/{sous}", exist_ok=True)
TEMPS = {}
for c, (fichier, texte, aide) in SOUS.items():
    src = f"{R}/{fichier}.mp3"
    if aide.get("coupe"):
        coupe = f"{D}/voix/{c}-coupe.wav"
        subprocess.run([FF, "-v", "error", "-y", "-i", src, "-t", str(aide["coupe"]), coupe], check=True)
        src = coupe
    egaliser(FF, src, f"{D}/voix/{c}.mp3")
    a = caler(FF, src, texte.replace(" | ", " "), "-38dB", aide.get("coupures", ()), aide.get("liees", ()))
    TEMPS[c] = {"d": a["d"], "m": a["m"]}
    if aide.get("coupe"):
        os.remove(src)
    print(c, a["d"], "s ·", len(a["m"]), "mots")

# ─── SA FIGURINE : les images, puis ses pistes (une par réplique du propriétaire) ───────────────────────
FIGURE = preparer(f"{R}/photos", f"{RACINE}/public/direct/ensemble/denim-debout.webp", f"{D}/f")
# sa carte de CV : sa vraie photo, cadrée sur son visage
Image.open(f"{R}/photos/neutre.jpg").convert("RGB").crop((150, 0, 702, 634)).resize((976, 1120), Image.LANCZOS).save(f"{D}/f/carte.jpg", quality=88)
PISTES = {}
for c, moments in MOMENTS.items():
    texte = SOUS[c][1].replace(" | ", " ").split(" ")
    net = lambda w: re.sub(r"[^\wà-ÿœæ’']", "", w.lower())

    def quand(w, dec, c=c, texte=texte):
        if w is None:
            return None
        if w == "fin":
            return TEMPS[c]["d"] + dec
        return TEMPS[c]["m"][[net(x) for x in texte].index(net(w))] + dec

    PISTES[c] = pistes(FF, f"{R}/{SOUS[c][0]}.mp3", [(e, quand(a, da), quand(b, db)) for e, a, da, b, db in moments])
    print(c, "figurine :", len(PISTES[c]["e"]), "images")

# ─── LES IMAGES (celles du tour du restaurant), GSAP ──────────────────────────────────────────
for f in ("m1.jpg", "m2.jpg", "m3.jpg", "m4.jpg", "si-interieur.webp"):
    shutil.copyfile(f"{S}/tour/{f}", f"{D}/{f}")
shutil.copyfile(f"{S}/accueil2/page/g-restaurant-salue.webp", f"{D}/hote.webp")
# LE FILM DU TÉLÉPHONE : la vidéo de l'interview du tour du restaurant ; et en WebM (VP8) pour les navigateurs sans
# H.264 — dont le Chromium de l'export —, une image clé toutes les demi-secondes
shutil.copyfile(f"{S}/tour/interview.mp4", f"{D}/interview.mp4")
if not os.path.exists(f"{D}/interview.webm") or os.path.getmtime(f"{D}/interview.webm") < os.path.getmtime(f"{S}/tour/interview.mp4"):
    subprocess.run([FF, "-v", "error", "-y", "-i", f"{S}/tour/interview.mp4", "-an", "-c:v", "libvpx", "-b:v", "1M", "-g", "15",
                    "-deadline", "good", "-cpu-used", "2", f"{D}/interview.webm"], check=True)
for l in LOOKS:
    for pose in ("debout", "salue"):
        shutil.copyfile(f"{S}/tour/tf/{l}-{pose}.webp", f"{D}/g/{l}-{pose}.webp")
for f in ("gsap.min.js", "MotionPathPlugin.min.js"):
    shutil.copyfile(f"{S}/recu/gsap/{f}", f"{D}/js/{f}")

# ─── LA PAGE ─────────────────────────────────────────────────────────────────────────────────
page = open(f"{S}/outils/tour-humain.html", encoding="utf-8").read()
page = page.replace("@FACADE@", FACADE.replace("@FAMILLE@", FAMILLE_HTML))
page = re.sub("@TOQUE@", lambda m: toque(), page)
page = page.replace("@CAGE_ROSE@", cage_mini("#FF2E9A", True)).replace("@CAGE_ORANGE@", cage_mini("#F5A23A", False)).replace("@CAGE_VERTE@", cage_mini("#3DE2A6", False))
page = page.replace("@CAGE_DOREE@", cage_mini("#FF2E9A", False))
page = page.replace("@JOURS@", JOURS).replace("@COMM@", COMM).replace("@DOREE_G@", DOREE_G).replace("@VU_G@", VU_G)
page = page.replace("/*@TEMPS@*/null", json.dumps(TEMPS, ensure_ascii=False))
page = page.replace("/*@SOUS@*/null", json.dumps({c: t for c, (_, t, _a) in SOUS.items()}, ensure_ascii=False))
page = page.replace("/*@FIGURE@*/null", json.dumps(FIGURE, ensure_ascii=False))
page = page.replace("/*@PISTES@*/null", json.dumps(PISTES, ensure_ascii=False, separators=(",", ":")))
assert not re.search(r"@[A-Z0-9_]+@|/\*@", page), "un repère @…@ n'a pas été remplacé"
open(f"{D}/index.html", "w", encoding="utf-8").write(page)
print("tour-humain/index.html :", len(page) // 1024, "Ko")
