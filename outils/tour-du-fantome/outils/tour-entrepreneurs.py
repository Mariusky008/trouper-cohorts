# 👻 « LIBÈRE TON FANTÔME » — la démo des entrepreneurs qui ne sont pas commerçants (pas de vitrine, pas de Direct).
#
# Tout se passe sur leurs réseaux et sur leur page ClikMe. Deux variantes, au choix avant de toucher la cage
# (ou `?v=local` dans l'adresse) : Nina, céramiste, qui envoie ses créations dans toute la France ; Claire,
# sophrologue, qui reçoit à Annecy — ClikMe s'adresse à tout le monde en France, et chacun à sa mesure.
# Qui (ton fantôme, qui porte ton métier), pour qui (toute la France, ou ta ville), comment : une photo, une vidéo
# chaque jour, publiée sur tous tes réseaux ; au lieu d'un like, ils libèrent leur fantôme ; puis un message rien
# qu'à chacun, un peu mieux à chaque réponse, jusqu'au jour où elle devient ta cliente ; et elle revient.
#
# Les voix (enregistrements « Mike » du propriétaire, `recu/court/demo2-*.mp3`, lues mot pour mot), égalisées et
# calées mot à mot (`voix_courtes.py`). Les photos (`recu/entrepreneurs/`) sont au propriétaire, la personne de
# l'atelier a donné son accord ; le coffret est recadré (ses filigranes « leboncoin » en haut). La devanture
# « Julie Z céramique » n'est pas utilisée : le nom d'un vrai commerce, sous celui de Nina.
#
#   /usr/bin/python3 -I outils/tour-du-fantome/outils/tour-entrepreneurs.py outils/tour-du-fantome
#
# La page s'écrit dans `tour-entrepreneurs/index.html` d'après `outils/tour-entrepreneurs.html` ; publiée par
# `scripts/poser-tours.mjs` à clikme.fr/tours/entrepreneurs.
import json, os, re, shutil, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voix_courtes import caler, egaliser  # noqa: E402

S = sys.argv[1]
FF = f"{S}/ffmpeg" if os.path.exists(f"{S}/ffmpeg") else shutil.which("ffmpeg")
D = f"{S}/tour-entrepreneurs"
R = f"{S}/recu/court"
P = f"{S}/recu/entrepreneurs"
RACINE = os.path.abspath(f"{S}/../..")
NB = " "


def nb(s):
    """L'espace fine insécable devant ? ! : ; (comme dans les tours)."""
    return re.sub(r" ([?!:;])", NB + r"\1", s)


# Les répliques, mot pour mot, coupées en morceaux de sous-titres (« | »), et ce qui aide à les caler.
SOUS = {
    "a": ("demo2-a", "Libère ton fantôme.", {}),
    "b": ("demo2-b", "Il porte ton métier, | et il travaille pour toi.", {}),
    "p-createur": ("demo2-promesse-createur", nb("Tu envoies tes créations ? | Je te fais connaître | dans toute la France."), {"coupures": ("dans",)}),
    "p-local": ("demo2-promesse-local", nb("Tu reçois près de chez toi ? | Je te fais connaître | dans ta ville."), {}),
    "c": ("demo2-c", "Une photo… | et chaque jour, une nouvelle vidéo, | publiée sur tous tes réseaux.", {"coupures": ("tous",)}),
    "d": ("demo2-d", "Une vidéo, tu sais la faire. | Moi, je te ramène | ceux qui l’ont regardée.", {"liees": ("Moi,",)}),
    "e": ("demo2-e", "Au lieu d’un like, | ils libèrent leur fantôme.", {}),
    "f": ("demo2-f", "Puis j’écris à chaque personne | un message rien qu’à elle. | Je la connais un peu mieux | à chaque réponse… | jusqu’au jour où | elle devient ta cliente.", {}),
    "g": ("demo2-g", "Et elle revient.", {}),
    "h": ("demo2-h", "Ton fantôme t’attend.", {}),
}
LOOKS = ["cosy", "fleuri", "curieux", "artiste", "denim", "rebelle", "soleil", "voyageur"]

# ─── LES CARTES (`cartes.py`, communes aux deux démos des entrepreneurs) ────────────────────────────────
from cartes import ANNECY, COMMUNES, FRANCE, LAC, NINA, RAYON, VILLES, chemin, fr, lo  # noqa: E402

# ─── LES DEUX VARIANTES ───────────────────────────────────────────────────────────────────────
JOURS_LOCAL = ["cabinet.jpg", "geste.jpg", "detail.jpg", "entree.jpg", "cabinet.jpg", "geste.jpg", "detail.jpg"]
VARIANTES = {
    "createur": {
        "nom": "Nina", "metier": "céramiste", "choix": "Envoie dans toute la France", "fantome": "metier-createur.webp", "badge": "🏺 Céramiste",
        "photo": "bol-bleu.jpg", "banniere": "table.jpg", "likes": 214, "prenoms": 52, "sousNom": "céramiste · envoie dans toute la France",
        "carteTitre": "Toute la France <em>te découvre.</em>", "dOu": "📍 de 23 villes de France",
        "semaine": ["bol-bleu.jpg", "pieces.jpg", "mains.jpg", "table.jpg", "tour.jpg", "coffret.jpg", "atelier.jpg"],
        "cages": ["J’adore<br>la vidéo", "Un jour,<br>je craque", "Je le<br>veux"], "cageCamille": 0, "voixPromesse": "p-createur",
        "tags": [{"texte": "💗 A adoré la vidéo"}, {"texte": "🎁 Pour offrir"}, {"texte": "🔔 À prévenir"}, {"texte": "✓ Cliente", "vert": True}, {"texte": "🔁 Revient", "vert": True}],
        "fil": [
            {"quand": "f0", "de": "jour", "texte": "Le lendemain"},
            {"quand": "f0", "plus": .05, "de": "mike", "texte": "Merci Camille ! {nom} a vu passer ton fantôme : ça fait plaisir. Toi, plutôt un plaisir pour soi ou un cadeau à offrir ?"},
            {"quand": "f1", "de": "oui"},
            {"quand": "f2", "de": "elle", "texte": "Pour offrir 🎁", "tag": 1},
            {"quand": "je", "de": "jour", "texte": "5 jours plus tard"},
            {"quand": "je", "plus": .05, "de": "mike", "texte": "Noté : pour offrir ! Je le dis à {nom}. Je te fais signe quand il y a du nouveau de ce côté-là ?"},
            {"quand": "je", "plus": .9, "de": "oui"},
            {"quand": "rep", "de": "elle", "texte": "Oui !", "tag": 2},
            {"quand": "jus", "de": "jour", "texte": "Vendredi · sortie du four", "calme": True},
            {"quand": "jus", "plus": .05, "de": "wa", "texte": "3 bols bleus sortent du four, dont un en coffret cadeau. Je t’en garde un ?"},
            {"quand": "elle", "de": "elle", "texte": "Oui, je le prends ! 😍"},
            {"quand": "cliente", "de": "carton", "icone": "📦", "texte": "Commandé", "sous": "envoi à Lyon", "tag": 3, "son": "ting"},
            {"quand": "g", "de": "jour", "texte": "Un mois plus tard"},
            {"quand": "g", "plus": .05, "de": "mike", "texte": "Alors Camille, ce bol bleu, il a plu ?"},
            {"quand": "g2", "de": "elle", "texte": "Adoré ! J’en reprends un pour moi 😍", "tag": 4},
        ],
        "ticket": [{"texte": "🎬 <span><b>7 vidéos</b>, publiées partout</span>"}, {"texte": "👻 <span><b>52 prénoms</b>, de 23 villes</span>"},
                   {"texte": "🎁 <span><b>9</b> veulent une de tes pièces</span>"}, {"texte": "📦 <span><b>+3 commandes</b> cette semaine</span>", "vert": True},
                   {"texte": "⏱ <span><b>1 minute</b> par jour pour toi</span>"}],
        "foule": ["Lyon", "Lille", "Nantes", "Bordeaux", "Paris", "Marseille", "Rennes", "Toulouse", "Strasbourg", "Nice"],
        "carte": {"moi": list(fr(*NINA)), "villes": [[n, *fr(lon, lat)] for n, lon, lat in VILLES]},
    },
    "local": {
        "nom": "Claire", "metier": "sophrologue", "choix": "Reçoit à Annecy", "fantome": "metier-local.webp", "badge": "🌿 Sophrologue",
        "photo": "cabinet.jpg", "banniere": "detail.jpg", "likes": 168, "prenoms": 41, "sousNom": "sophrologue · Annecy et autour",
        "carteTitre": "Annecy et autour <em>te découvrent.</em>", "dOu": "📍 d’Annecy et 9 communes autour",
        "semaine": JOURS_LOCAL,
        "cages": ["J’adore<br>la vidéo", "Un jour, je<br>prends RDV", "Je prends<br>rendez-vous"], "cageCamille": 1, "voixPromesse": "p-local",
        "tags": [{"texte": "🔓 Viendra un jour"}, {"texte": "📅 Plutôt en semaine"}, {"texte": "🔔 À prévenir"}, {"texte": "✓ Cliente", "vert": True}, {"texte": "🔁 Revient", "vert": True}],
        "fil": [
            {"quand": "f0", "de": "jour", "texte": "Le lendemain"},
            {"quand": "f0", "plus": .05, "de": "mike", "texte": "Merci Camille ! Tu as promis de venir un jour 😊 Je te fais signe dès qu’un créneau se libère. Plutôt en semaine ou le week-end ?"},
            {"quand": "f1", "de": "oui"},
            {"quand": "f2", "de": "elle", "texte": "En semaine", "tag": 1},
            {"quand": "je", "de": "jour", "texte": "5 jours plus tard"},
            {"quand": "je", "plus": .05, "de": "mike", "texte": "Noté : en semaine ! Je te fais signe dès qu’un créneau se libère."},
            {"quand": "je", "plus": .9, "de": "oui"},
            {"quand": "rep", "de": "elle", "texte": "Oui !", "tag": 2},
            {"quand": "jus", "de": "jour", "texte": "Mardi · un créneau s’est libéré", "calme": True},
            {"quand": "jus", "plus": .05, "de": "wa", "texte": "Jeudi 10 h vient de se libérer. Je te le garde ?"},
            {"quand": "elle", "de": "elle", "texte": "Oui ! 😍"},
            {"quand": "cliente", "de": "carton", "icone": "📅", "texte": "Jeudi 10 h", "sous": "rendez-vous de Camille", "tag": 3, "son": "ting"},
            {"quand": "g", "de": "jour", "texte": "Après sa séance"},
            {"quand": "g", "plus": .05, "de": "mike", "texte": "Merci pour ta séance, Camille ! Alors, verdict ?"},
            {"quand": "g2", "de": "elle", "texte": "J’ai adoré. On en refait une ?", "tag": 4},
        ],
        "ticket": [{"texte": "🎬 <span><b>7 vidéos</b>, publiées partout</span>"}, {"texte": "👻 <span><b>41 prénoms</b>, à Annecy et autour</span>"},
                   {"texte": "🔓 <span><b>8</b> promettent de venir</span>"}, {"texte": "📅 <span><b>+3 rendez-vous</b> cette semaine</span>", "vert": True},
                   {"texte": "⏱ <span><b>1 minute</b> par jour pour toi</span>"}],
        "foule": ["Annecy", "Seynod", "Rumilly", "Thônes", "Sévrier", "Faverges", "Cran-Gevrier", "Talloires", "Épagny", "Cruseilles"],
        "carte": {"moi": list(fr(*ANNECY)),
                  "communes": [[n, *lo(lon, lat), "e" if lo(lon, lat)[0] > 640 else ""] for n, lon, lat in COMMUNES]},
    },
}
for v in VARIANTES.values():
    for m in v["fil"]:
        if "texte" in m:
            m["texte"] = nb(m["texte"])

# ─── LES VOIX : égalisées, puis chaque mot à son instant ───────────────────────────────────────
os.makedirs(f"{D}/voix", exist_ok=True)
os.makedirs(f"{D}/g", exist_ok=True)
TEMPS = {}
for c, (fichier, texte, aide) in SOUS.items():
    src = f"{R}/{fichier}.mp3"
    egaliser(FF, src, f"{D}/voix/{c}.mp3")
    a = caler(FF, src, texte.replace(" | ", " "), "-38dB", aide.get("coupures", ()), aide.get("liees", ()))
    TEMPS[c] = {"d": a["d"], "m": a["m"]}
    print(c, a["d"], "s ·", " ".join(f"{w}@{t}" for w, t in zip(texte.replace(" | ", " ").split(" "), a["m"])))

# ─── LES IMAGES : ses photos (allégées), son fantôme de métier, les fantômes des habitants ───────
for dossier, v in (("createur", VARIANTES["createur"]), ("local", VARIANTES["local"])):
    for f in sorted({v["photo"], v["banniere"], *v["semaine"]}):
        subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", f"{P}/{dossier}/{f}", "-vf", "scale='min(1080,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease",
                        "-q:v", "4", f"{D}/{f}"], check=True)
shutil.copyfile(f"{S}/tour/fantome.webp", f"{D}/fantome.webp")
shutil.copyfile(f"{RACINE}/public/direct/double/pied/createur/salut-1.webp", f"{D}/metier-createur.webp")
shutil.copyfile(f"{RACINE}/public/direct/double/pied/bien-etre/salut-1.webp", f"{D}/metier-local.webp")
for l in LOOKS:
    for pose in ("debout", "salue"):
        shutil.copyfile(f"{S}/tour/tf/{l}-{pose}.webp", f"{D}/g/{l}-{pose}.webp")

# ─── LA PAGE ─────────────────────────────────────────────────────────────────────────────────
page = open(f"{S}/outils/tour-entrepreneurs.html", encoding="utf-8").read()
page = page.replace("@FRANCE@", FRANCE).replace("@LAC@", chemin(LAC, lo)).replace("@RAYON@", str(RAYON))
page = page.replace("/*@TEMPS@*/null", json.dumps(TEMPS, ensure_ascii=False))
page = page.replace("/*@SOUS@*/null", json.dumps({c: t for c, (_, t, _a) in SOUS.items()}, ensure_ascii=False))
page = page.replace("/*@VARIANTES@*/null", json.dumps(VARIANTES, ensure_ascii=False))
assert not re.search(r"@[A-Z0-9]+@|/\*@", page), "un repère @…@ n'a pas été remplacé"
open(f"{D}/index.html", "w", encoding="utf-8").write(page)
print("tour-entrepreneurs/index.html :", len(page) // 1024, "Ko")
