# 👻 « LIBÈRE TON FANTÔME », deuxième version : la démo des entrepreneurs (pas de vitrine) sur le moteur de la démo
# courte des commerçants (`tour-court2.py` : une caméra qui voyage, des particules, des mots animés, une musique pop
# jouée par le navigateur, une seule ligne de temps GSAP), en « tu ».
#
# Le même scénario que les commerçants, à sa mesure : Mike se présente en jaillissant de la cage ; avec quelques
# photos, il fait une très belle vidéo de ton activité et la publie partout ; la carte (Nina, céramiste, qui envoie
# dans toute la France ; ou Claire, sophrologue, qui reçoit à Annecy) ; « mais ce n'est pas là que je suis le plus
# fort » : à la fin de la vidéo, chacun libère son fantôme (les trois cages de son métier) ; « mon vrai travail
# commence » : un message à chacun, la conversation avec Camille, jusqu'au jour où elle devient ta cliente (le colis
# part vers Lyon, ou le rendez-vous se prend). Deux variantes, au choix avant de toucher la cage (ou `?v=local`).
#
# Les voix : les enregistrements « Mike » du propriétaire, lus mot pour mot — `recu/court/e2-*.mp3` (les six de cette
# démo), les promesses `demo2-promesse-*.mp3` et « Ton fantôme t'attend » (`demo2-h.mp3`) de la première version,
# « C'est juste après » et « mon vrai travail commence » (`v2-3`, `v2-5`) de la démo des commerçants.
#
#   /usr/bin/python3 -I outils/tour-du-fantome/outils/tour-entrepreneurs2.py outils/tour-du-fantome
#   node outils/tour-du-fantome/outils/rendre-video.mjs "http://…/tour-entrepreneurs2/index.html?v=local" sortie.mp4 30 1.5
#
# La page s'écrit dans `tour-entrepreneurs2/index.html` d'après `outils/tour-entrepreneurs2.html`.
import json, os, re, shutil, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cartes import COMMUNES, FRANCE, LAC, NINA, RAYON, VILLES, chemin, fr, lo  # noqa: E402
from decor import cage_mini  # noqa: E402
from voix_courtes import caler, egaliser  # noqa: E402

S = sys.argv[1]
FF = f"{S}/ffmpeg" if os.path.exists(f"{S}/ffmpeg") else shutil.which("ffmpeg")
D = f"{S}/tour-entrepreneurs2"
R = f"{S}/recu/court"
P = f"{S}/recu/entrepreneurs"
RACINE = os.path.abspath(f"{S}/../..")
NB = " "


def nb(s):
    """L'espace fine insécable devant ? ! : ; (comme dans les tours)."""
    return re.sub(r" ([?!:;])", NB + r"\1", s)


# Les répliques, mot pour mot, coupées en morceaux de sous-titres (« | »). L'aide au calage : « coupures », les mots
# devant lesquels l'enregistrement se tait sans ponctuation (une pause, ou le silence d'un « p » ou d'un « t ») ;
# « liees », les mots après lesquels la ponctuation ne s'entend pas. Les répliques « -createur » / « -local » sont
# celles de sa variante : la page les prend sous le nom court (« p », « v4c »).
SOUS = {
    "v1": ("e2-1-merci", nb("Merci ! | Je suis Mike, | ton futur fantôme préféré."), {}),
    "v2": ("e2-2-video", "Avec quelques photos, | je fais une très belle vidéo | de ton activité, | puis je la publie partout | pour que tout le monde la voie.",
           {"liees": ("photos,",), "coupures": ("partout", "tout")}),
    "p-createur": ("demo2-promesse-createur", nb("Tu envoies tes créations ? | Je te fais connaître | dans toute la France."), {"coupures": ("dans",)}),
    "p-local": ("demo2-promesse-local", nb("Tu reçois près de chez toi ? | Je te fais connaître | dans ta ville."), {}),
    "v3": ("v2-3-juste-apres", "Mais ce n’est pas là | que je suis le plus fort. | C’est juste après.", {}),
    "v4": ("e2-4-a-la-fin", nb("À la fin de la vidéo, | chaque personne peut libérer son fantôme | pour te dire ce qu’elle en pense :"), {}),
    "v4c-createur": ("e2-4-choix-createur", "“J’adore la vidéo”, | “Un jour, je craque”, | ou “Je le veux”.", {"liees": ("jour,",), "coupures": ("“Je",)}),
    "v4c-local": ("e2-4-choix-local", "“J’adore la vidéo”, | “Un jour, je prends rendez-vous”, | ou “Je prends rendez-vous”.", {"liees": ("jour,",), "coupures": ("“Je",)}),
    "v5": ("v2-5-travail", "Et à partir de là, | mon vrai travail commence.", {"coupures": ("commence.",)}),
    "v6": ("e2-6-cliente", "J’écris à chaque personne | qui a libéré son fantôme, | pour faire connaissance. | Je la connais un peu mieux | à chaque réponse… | "
           "jusqu’au jour où | elle devient ta cliente.", {"coupures": ("elle",)}),
    "v7": ("demo2-h", "Ton fantôme t’attend.", {}),
}
LOOKS = ["cosy", "fleuri", "curieux", "artiste", "denim", "rebelle", "soleil", "voyageur"]

# ─── LES DEUX VARIANTES ───────────────────────────────────────────────────────────────────────
LYON = next(fr(lon, lat) for n, lon, lat in VILLES if n == "Lyon")
RUMILLY = next(lo(lon, lat) for n, lon, lat in COMMUNES if n == "Rumilly")
# la conversation avec Camille : [qui, texte, étiquette apprise] ; « {nom} » devient le sien (« Pour qui est cette démo ? »)
VARIANTES = {
    "createur": {
        "nom": "Nina", "metier": "céramiste", "choix": "Envoie dans toute la France", "fantome": "metier-createur.webp",
        "polar": ["bol-bleu.jpg", "mains.jpg", "atelier.jpg", "pieces.jpg"], "film": ["bol-bleu.jpg", "tour.jpg", "pieces.jpg", "table.jpg"],
        "filmPetit": "SORTIE DU FOUR", "filmTitre": "L’atelier de Nina",
        "cages": ["J’adore<br>la vidéo", "Un jour,<br>je craque", "Je le<br>veux"], "insignes": ["💗", "🎁", "🛍️"],
        "groupes": ["💗 21 adorent la vidéo", "🎁 12 craqueront un jour", "🛍️ 5 le veulent"], "cageCamille": 0,
        "tags": ["💗 A adoré la vidéo", "🎁 Pour offrir", "💙 Aime le bleu", "🔔 À prévenir"],
        "fil": [["jour", "Le lendemain"], ["mike", "Merci Camille ! {nom} a vu passer ton fantôme, ça lui fait plaisir 😊 C’est pour toi ou pour offrir ?"],
                ["elle", "Pour offrir 🎁", 1], ["mike", "Noté ! Plutôt les bleus profonds ou les tons sable ?"], ["elle", "Les bleus 💙", 2],
                ["mike", "Je te préviens à la prochaine sortie du four ?"], ["elle", "Oui !", 3], ["calme", "Vendredi · sortie du four"],
                ["wa", "3 bols bleus sortent du four, dont un en coffret cadeau. Je t’en garde un ?"], ["elle", "Oui, je le prends ! 😍"]],
        "puces": ["🎬 Une belle vidéo", "👻 38 fantômes libérés", "💬 Un message à chacun", "📦 Des commandes, pas des likes"],
        "carte": {"sens": "colis", "moi": list(fr(*NINA)), "cible": list(LYON), "chip": "📍 Vue dans 23 villes de France", "fin": "📦 Commandé · envoi à Lyon"},
    },
    "local": {
        "nom": "Claire", "metier": "sophrologue", "choix": "Reçoit à Annecy", "fantome": "metier-local.webp",
        "polar": ["cabinet.jpg", "geste.jpg", "detail.jpg", "entree.jpg"], "film": ["cabinet.jpg", "geste.jpg", "detail.jpg", "entree.jpg"],
        "filmPetit": "UN MOMENT POUR SOI", "filmTitre": "Claire, sophrologue",
        "cages": ["J’adore<br>la vidéo", "Un jour, je<br>prends RDV", "Je prends<br>rendez-vous"], "insignes": ["💗", "📌", "📅"],
        "groupes": ["💗 21 adorent la vidéo", "📌 12 prendront RDV un jour", "📅 5 prennent rendez-vous"], "cageCamille": 1,
        "tags": ["📌 Prendra RDV un jour", "📅 En semaine", "☀️ Le matin", "🔔 À prévenir"],
        "fil": [["jour", "Le lendemain"], ["mike", "Merci Camille ! Tu prendras rendez-vous un jour, c’est promis 😊 Plutôt en semaine ou le week-end ?"],
                ["elle", "En semaine", 1], ["mike", "Noté ! Plutôt le matin ou en fin de journée ?"], ["elle", "Le matin ☀️", 2],
                ["mike", "Je te préviens quand un créneau se libère ?"], ["elle", "Oui !", 3], ["calme", "Mardi · un créneau s’est libéré"],
                ["wa", "Jeudi 10 h vient de se libérer. Je te le garde ?"], ["elle", "Oui ! 😍"]],
        "puces": ["🎬 Une belle vidéo", "👻 38 fantômes libérés", "💬 Un message à chacun", "📅 Des rendez-vous, pas des likes"],
        "carte": {"sens": "visite", "moi": [500, 500], "cible": list(RUMILLY), "rayon": RAYON, "chip": "📍 Vue à Annecy et dans 9 communes autour",
                  "fin": "📅 Jeudi 10 h · rendez-vous de Camille"},
    },
}
for v in VARIANTES.values():
    v["fil"] = [[m[0], nb(m[1]), *m[2:]] for m in v["fil"]]


# ─── LES CARTES (le dessin ; la page en garde une, celle de sa variante) ──────────────────────────
# le côté de l'étiquette, quand la droite est prise (« g » : à gauche ; « b » : dessous) ; sinon à droite
COTE = {"Strasbourg": "g", "Toulouse": "g", "Montpellier": "b", "Marseille": "b"}


def point(nom, x, y, cote=""):
    return f'<span class="pt{" " + cote if cote else ""}" style="left:{x}px;top:{y}px"><i></i><b>{nom}</b></span>'


def arc(a, b):
    """De son atelier à une ville : une courbe qui monte un peu (vers le haut de la carte)."""
    (x0, y0), (x1, y1) = a, b
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 - 0.28 * ((x1 - x0) ** 2 + (y1 - y0) ** 2) ** .5
    return f'<path class="arc" pathLength="1" d="M{x0} {y0}Q{cx:.0f} {cy:.0f} {x1} {y1}"/>'


def carte(v, dessin, points):
    va = VARIANTES[v]
    mx, my = va["carte"]["moi"]
    return (f'<div class="carte abs" id="carte-{v}"><svg viewBox="0 0 1000 1000" aria-hidden="true">{dessin}</svg>{points}'
            f'<span class="pt moi" style="left:{mx}px;top:{my}px"><i></i><b class="nom-pro">{va["nom"]}</b></span>'
            f'<span class="carte-chip abs">{va["carte"]["chip"]}</span><span id="colis" class="abs">📦</span>'
            '<div id="camille-carte" class="abs"><img src="g/fleuri-debout.webp" alt=""><b>Camille</b></div>'
            f'<span id="fin-chip" class="abs">{va["carte"]["fin"]}</span></div>')


villes = [fr(lon, lat) for _, lon, lat in VILLES]
CARTES = (carte("createur", f'<path class="pays" d="{FRANCE}"/>' + "".join(arc(fr(*NINA), p) for p in villes),
                "".join(point(n, *fr(lon, lat), COTE.get(n, "")) for n, lon, lat in VILLES))
          + carte("local", f'<path class="lac" d="{chemin(LAC, lo)}"/><circle class="rayon" cx="500" cy="500" r="{RAYON}"/>',
                  "".join(point(n, *lo(lon, lat), "g" if lo(lon, lat)[0] > 640 else "") for n, lon, lat in COMMUNES if n != "Annecy")))

# ─── LES VOIX : égalisées, puis chaque mot à son instant ───────────────────────────────────────
os.makedirs(f"{D}/voix", exist_ok=True)
os.makedirs(f"{D}/g", exist_ok=True)
os.makedirs(f"{D}/js", exist_ok=True)
TEMPS = {}
for c, (fichier, texte, aide) in SOUS.items():
    src = f"{R}/{fichier}.mp3"
    egaliser(FF, src, f"{D}/voix/{c}.mp3")
    a = caler(FF, src, texte.replace(" | ", " "), "-38dB", aide.get("coupures", ()), aide.get("liees", ()))
    TEMPS[c] = {"d": a["d"], "m": a["m"]}
    print(c, a["d"], "s ·", " ".join(f"{w}@{t}" for w, t in zip(texte.replace(" | ", " ").split(" "), a["m"])))

# ─── LES IMAGES : ses photos (allégées), son fantôme de métier, les fantômes des habitants, GSAP ──
for dossier, v in (("createur", VARIANTES["createur"]), ("local", VARIANTES["local"])):
    for f in sorted({*v["polar"], *v["film"]}):
        subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", f"{P}/{dossier}/{f}", "-vf", "scale='min(1080,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
                        "-q:v", "4", f"{D}/{f}"], check=True)
shutil.copyfile(f"{RACINE}/public/direct/double/pied/createur/salut-1.webp", f"{D}/metier-createur.webp")
shutil.copyfile(f"{RACINE}/public/direct/double/pied/bien-etre/salut-1.webp", f"{D}/metier-local.webp")
for l in LOOKS:
    for pose in ("debout", "salue"):
        shutil.copyfile(f"{S}/tour/tf/{l}-{pose}.webp", f"{D}/g/{l}-{pose}.webp")
for f in ("gsap.min.js", "MotionPathPlugin.min.js"):
    shutil.copyfile(f"{S}/recu/gsap/{f}", f"{D}/js/{f}")

# ─── LA PAGE ─────────────────────────────────────────────────────────────────────────────────
page = open(f"{S}/outils/tour-entrepreneurs2.html", encoding="utf-8").read()
page = page.replace("@CARTES@", CARTES)
page = page.replace("@CAGE_ROSE@", cage_mini("#FF2E9A", True)).replace("@CAGE_ORANGE@", cage_mini("#F5A23A", False)).replace("@CAGE_VERTE@", cage_mini("#3DE2A6", False))
page = page.replace("/*@TEMPS@*/null", json.dumps(TEMPS, ensure_ascii=False))
page = page.replace("/*@SOUS@*/null", json.dumps({c: t for c, (_, t, _a) in SOUS.items()}, ensure_ascii=False))
page = page.replace("/*@VARIANTES@*/null", json.dumps(VARIANTES, ensure_ascii=False))
assert not re.search(r"@[A-Z0-9_]+@|/\*@", page), "un repère @…@ n'a pas été remplacé"
open(f"{D}/index.html", "w", encoding="utf-8").write(page)
print("tour-entrepreneurs2/index.html :", len(page) // 1024, "Ko")
