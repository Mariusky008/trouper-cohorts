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
from alignement import segments  # noqa: E402
from figurine import energie, pistes  # noqa: E402
from ressort import preparer_carte, preparer_ressort  # noqa: E402
from decor import cage_mini, toque  # noqa: E402
from decor_humain import ardoise, cage_or, facade_decor, sceau  # noqa: E402

S = sys.argv[1]
RACINE = os.path.abspath(f"{S}/../..")
FF = f"{S}/ffmpeg" if os.path.exists(f"{S}/ffmpeg") else shutil.which("ffmpeg")
R = f"{S}/recu/humain"
NB = " "
# (le début de la réplique 7, commun à tous les métiers ; la fin — les trois cages — est propre à chacun)
L07 = f"À la fin de la vidéo, | chaque personne peut libérer son fantôme | pour dire ce qu’elle en pense{NB}:"
# ─── LA VARIANTE : la même histoire, habillée pour un métier. « restaurant » (Chez Bergine, la démo d'origine, publiée
# à /tours/humain) ; « atelier » (L'Atelier de Nina, cours de poterie — fictif ; ses photos sont celles de Nina, la
# céramiste de la démo des entrepreneurs ; publiée à /tours/atelier) : `--variante=atelier` → tour-humain-atelier/ ;
# « bien-etre » (Le Cocon d'Élise, massages, sophrologie, hypnose — fictif ; publiée à /tours/bien-etre).
VARIANTE = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--variante=")), "restaurant")
_N = f"{S}/recu/entrepreneurs/createur"
_L, _M = f"{S}/recu/entrepreneurs/local", f"{S}/recu/massage/photos"   # (bien-être : la sophrologue de la démo des entrepreneurs, le Cocon d’Élise)
VARIANTES = {
    "restaurant": {
        "nom": "Chez Bergine", "enseigne": "BISTROT · DAX", "compte": "chezbergine", "fac_style": "",
        "dore": "Fait maison · depuis 1998", "ardoise": ("Aujourd’hui", "Garbure<br>landaise", "& magret", "19 €"),
        "images": {"m1.jpg": f"{S}/tour/m1.jpg", "m2.jpg": f"{S}/tour/m2.jpg", "m3.jpg": f"{S}/tour/m3.jpg", "m4.jpg": f"{S}/tour/m4.jpg",
                   "si-interieur.webp": f"{S}/tour/si-interieur.webp"},
        "pro": (f"{S}/tour/m4.jpg", "chef-neutre", "chef-parle"),
        "hote": f"{S}/accueil2/page/g-restaurant-salue.webp", "toque": True, "film": f"{S}/tour/interview.mp4",
        "posts": [("m1.jpg", "1 128", "Le magret du jour 🔥"), ("m2.jpg", "846", "Ce soir, terrasse ouverte ☀️"), ("m4.jpg", "2 019", "Notre chef aux fourneaux 👨‍🍳"),
                  ("m1.jpg", "603", "Merci pour vos messages ❤️"), ("m3.jpg", "2 304", "Garbure landaise, ce midi 🥘"), ("m2.jpg", "411", "À demain !")],
        "surprises": ("🍮 Un dessert", "☕ Un café", "🥐 Une douceur"),
        "page": {"HONNEUR": "⭐ Votre menu du jour, à l’honneur", "TAG1": "📅 En semaine", "TAG2": "🐟 Plutôt poisson", "SURPRISE": "LA SURPRISE DU CHEF",
                 "BON": "🍮 Le dessert du chef", "SERVIE": "Servie ✓",
                 "CAGE1": "Ça donne<br>envie", "CAGE2": "Je réserverai<br>un jour", "CAGE3": "Je réserve<br>aujourd’hui", "PLACES": "5 commerces",
                 "G1": "💗 21 ont envie", "G2": "📌 12 réserveront un jour", "G3": "🍽️ 5 réservent aujourd’hui", "TAGJ": "📌 Réservera un jour",
                 "PRO_NOM": "Jean-Marie", "PRO_ROLE": "le chef de Chez Bergine", "PRO_BADGE": "🪑 Table libre · 12 h 30", "RARE": "MARDI MIDI", "DEFI": "3 tables"},
        "js": {"libre": "vide", "forts12b": ["figurine", "moi.", "vide\u202f?", "prénom\u202f:"], "fortsChef": ["Camille\u202f!", "table", "minutes\u202f!"],
               "fortsCli": ["meilleur", "magret"], "honneur": "menu", "forts5": ["vidéo,", "beau", "film", "menu", "jour,", "partout"],
               "forts7": ["“Ça", "envie”,", "“Je", "réserverai", "jour”,", "réserve", "aujourd’hui”."],
               "fil": ["Merci Camille ! On te garde une table un de ces jours 😊 Plutôt en semaine ou le week-end ?", "En semaine",
                       "Noté ! Et plutôt viande ou poisson ?", "Poisson 🐟", "Mardi · 11 h · c’est calme",
                       "Il reste une table ce midi, Camille. Je te la garde ?", "J’arrive ! 😍"]},
    },
    "atelier": {
        "nom": "L’Atelier de Nina", "enseigne": "POTERIE · DAX", "compte": "atelierdenina",
        # (un mur vert sauge, un store terracotta, une enseigne brun foncé)
        "fac_style": "--f1:#5F7D67;--f2:#3D5646;--s1:#F6EBDA;--s2:#C4623A;--ens:#2A2320;",
        "dore": "Cours & ateliers · tous niveaux", "ardoise": ("Cette semaine", "Atelier<br>tour", "samedi 10 h", "2 places"),
        "images": {"m1.jpg": f"{_N}/mains.jpg", "m2.jpg": f"{_N}/table.jpg", "m3.jpg": f"{_N}/bol-bleu.jpg", "m4.jpg": f"{_N}/tour.jpg",
                   "si-interieur.webp": f"{_N}/atelier.jpg"},
        "pro": (f"{_N}/tour.jpg", "nina-neutre", "nina-parle"),   # (ses mains sur le tour, puis sa figurine)
        "hote": f"{RACINE}/public/direct/double/pied/createur/salut-1.webp", "toque": False, "film": f"{R}/atelier/film.mp4",
        "posts": [("m1.jpg", "1 128", "Les mains dans la terre 🤲"), ("m2.jpg", "846", "L’atelier vous attend ☀️"), ("m4.jpg", "2 019", "Atelier tour, ce samedi 🏺"),
                  ("m1.jpg", "603", "Merci pour vos messages ❤️"), ("m3.jpg", "2 304", "Sortie du four ce matin 🔥"), ("m2.jpg", "411", "À samedi !")],
        "surprises": ("🔥 Une cuisson", "🎨 Un tablier", "🎟️ Une place offerte"),
        "page": {"HONNEUR": "⭐ Vos ateliers, à l’honneur", "TAG1": "📅 Le week-end", "TAG2": "🏺 Plutôt le tour", "SURPRISE": "LA SURPRISE DE L’ATELIER",
                 "BON": "🔥 Une cuisson offerte", "SERVIE": "Validé ✓",
                 "CAGE1": "Ça me<br>tente", "CAGE2": "Je m’inscrirai<br>un jour", "CAGE3": "Je réserve<br>ma place", "PLACES": "5 ateliers",
                 "G1": "💗 21 ont envie d’essayer", "G2": "📌 12 s’inscriront un jour", "G3": "🏺 5 réservent leur place", "TAGJ": "📌 S’inscrira un jour",
                 "PRO_NOM": "Nina", "PRO_ROLE": "la potière de l’atelier", "PRO_BADGE": "🏺 Place libre · samedi 10 h", "RARE": "JEUDI SOIR", "DEFI": "3 places"},
        "js": {"libre": "libre", "forts12b": ["figurine", "moi.", "libre", "prénom\u202f:"], "fortsChef": ["Camille\u202f!", "place", "minutes\u202f!"],
               "fortsCli": ["meilleur", "poterie"], "honneur": "ateliers,", "forts5": ["vidéo,", "beau", "film", "ateliers,", "partout"],
               "forts7": ["“Ça", "tente”,", "“Je", "m’inscrirai", "jour”,", "réserve", "place”."],
               "fil": ["Merci Camille ! Tu viendras un jour, c’est promis 😊 Plutôt en semaine ou le week-end ?", "Le week-end",
                       "Noté ! Et plutôt le tour ou le modelage ?", "Le tour 🏺", "Vendredi · 18 h · il reste 2 places",
                       "Il reste 2 places à l’atelier tour demain matin, Camille. Je t’en garde une ?", "Oui, je viens ! 😍"]},
        # ses répliques (Mike) : la 5, « vos ateliers » au lieu de « votre menu du jour » (31 octobre ; « ou une vidéo », le 4
        # novembre) ; la 7, les cages de l'atelier (1er novembre)
        "lignes": {
            "l05": ("atelier/05-m", "Avec quelques photos ou une vidéo, | je fais un très beau film | où je mets à l’honneur | vos ateliers, | puis je le publie partout | "
                    "pour que tout le monde le voie.", {}),
            "l07": ("atelier/07-m", f"{L07} | “Ça me tente”, | “Je m’inscrirai un jour”, | ou “Je réserve ma place”.", {"coupures": (":", "“Je")}),
            # la scène des figurines, dans les mots de l'atelier (1er novembre) : une place libre ; Nina (voix « Mélodie ») ;
            # la cliente (Emma)
            "l12b": ("figurines/jp-revelation-a-atelier", f"Cette figurine | qui vous parle depuis le début{NB}? | C’est moi. | Et vous aurez la vôtre. | Une place libre à l’atelier{NB}? | "
                     f"Un vocal de 10 secondes… | et c’est votre figurine | qui prévient ceux qui attendaient ce moment, | à leur prénom{NB}:", {"liees": ("secondes…",)}),
            "lchef": ("figurines/melodie-2", f"Camille{NB}! | Il me reste une place | à l’atelier tour, samedi à 10 h{NB}: | elle est à toi pendant 5 minutes{NB}!", {"liees": ("tour,",)}),
            "lcli": ("figurines/cliente-atelier", f"Le meilleur cours | de poterie de Dax{NB}!", {}),
        },
    },
    "bien-etre": {
        "nom": "Le Cocon d’Élise", "enseigne": "BIEN-ÊTRE · DAX", "compte": "lecocondelise",
        # (un mur vieux rose, un store crème et eucalyptus, une enseigne brun foncé)
        "fac_style": "--f1:#B8867A;--f2:#8A5C52;--s1:#F7EFE6;--s2:#6F8F80;--ens:#2E2422;",
        "dore": "Massages · sophrologie · hypnose", "ardoise": ("Cette semaine", "Séance<br>découverte", "mardi 18 h", "2 créneaux"),
        "images": {"m1.jpg": f"{_M}/m1.jpg", "m2.jpg": f"{_L}/cabinet.jpg", "m3.jpg": f"{_M}/m3.jpg", "m4.jpg": f"{_M}/m4.jpg",
                   "si-interieur.webp": f"{_M}/boutique.jpg"},
        "pro": (f"{_M}/m1.jpg", "elise-neutre", "elise-parle"),   # (ses mains pendant un massage, puis sa figurine)
        "hote": f"{RACINE}/public/direct/double/pied/bien-etre/salut-1.webp", "toque": False, "film": f"{R}/bien-etre/film.mp4",
        "posts": [("m1.jpg", "1 128", "Une heure rien que pour vous 🌿"), ("m2.jpg", "846", "Le cocon vous attend ☀️"), ("m4.jpg", "2 019", "Kobido, ce mardi ✨"),
                  ("m1.jpg", "603", "Merci pour vos messages ❤️"), ("m3.jpg", "2 304", "Massage à l’huile chaude 💆"), ("m2.jpg", "411", "À mardi !")],
        "surprises": ("🕯️ Une bougie", "🍵 Une infusion", "🎟️ Une séance offerte"),
        "page": {"HONNEUR": "⭐ Vos séances, à l’honneur", "TAG1": "📅 En semaine", "TAG2": "💆 Plutôt massage", "SURPRISE": "LA SURPRISE DU COCON",
                 "BON": "🕯️ Une bougie offerte", "SERVIE": "Validé ✓",
                 "CAGE1": "Ça me ferait<br>du bien", "CAGE2": "Je prendrai<br>rendez-vous", "CAGE3": "Je prends<br>rendez-vous", "PLACES": "5 cabinets",
                 "G1": "💗 21 : ça leur ferait du bien", "G2": "📌 12 prendront rendez-vous", "G3": "📅 5 prennent rendez-vous", "TAGJ": "📌 Prendra rendez-vous",
                 "PRO_NOM": "Élise", "PRO_ROLE": "praticienne au Cocon", "PRO_BADGE": "🌿 Créneau libre · mardi 18 h", "RARE": "LUNDI MATIN", "DEFI": "3 créneaux"},
        "js": {"libre": "libre", "forts12b": ["figurine", "moi.", "libre\u202f?", "prénom\u202f:"], "fortsChef": ["Camille\u202f!", "créneau", "minutes\u202f!"],
               "fortsCli": ["meilleur", "massage"], "honneur": "séances,", "forts5": ["vidéo,", "beau", "film", "séances,", "partout"],
               "forts7": ["“Ça", "bien”,", "“Je", "prendrai", "rendez-vous”,", "prends", "rendez-vous”."],
               "fil": ["Merci Camille ! Tu viendras un jour, c’est promis 😊 Plutôt en semaine ou le week-end ?", "En semaine",
                       "Noté ! Et plutôt massage ou sophrologie ?", "Massage 💆", "Mardi · 17 h · un créneau se libère",
                       "Un créneau vient de se libérer demain à 17 h, Camille. Je te le garde ?", "Oui, je le prends ! 😍"]},
        # ses répliques (Mike, 1er novembre) : la 5, « vos séances » (« ou une vidéo », le 4 novembre) ; la 7, les cages du bien-être
        "lignes": {
            "l05": ("bien-etre/05-m", "Avec quelques photos ou une vidéo, | je fais un très beau film | où je mets à l’honneur | vos séances, | puis je le publie partout | "
                    "pour que tout le monde le voie.", {}),
            "l07": ("bien-etre/07-m", f"{L07} | “Ça me ferait du bien”, | “Je prendrai rendez-vous”, | ou “Je prends rendez-vous”.", {"coupures": ("“Je",)}),
            # la scène des figurines, dans les mots du cabinet (1er novembre) : un créneau libre ; Élise (voix « Mélodie ») ;
            # la cliente (Emma)
            "l12b": ("figurines/jp-revelation-a-bien-etre", f"Cette figurine | qui vous parle depuis le début{NB}? | C’est moi. | Et vous aurez la vôtre. | Un créneau libre{NB}? | "
                     f"Un vocal de 10 secondes… | et c’est votre figurine | qui prévient ceux qui attendaient ce moment, | à leur prénom{NB}:", {"liees": ("moment,",)}),
            "lchef": ("figurines/melodie-1", f"Camille{NB}! | Il me reste un créneau | mardi à 18 h{NB}: | il est à toi pendant 5 minutes{NB}!", {}),
            "lcli": ("figurines/cliente-bien-etre", f"Le meilleur massage | de Dax{NB}!", {}),
        },
    },
}
V = VARIANTES[VARIANTE]
D = f"{S}/tour-humain" + ("" if VARIANTE == "restaurant" else f"-{VARIANTE}")
# LES DEUX PARTENAIRES DE LA 5b : des commerces des autres tours (fictifs, comme lui), de Dax, jamais du même métier ;
# (nom, métier, compte, abonnés, emblème, couleur, à combien d'ici) — et ce que dit la découverte, dans ses mots à lui
_LOU = ("Maison Lou", "vêtements", "maisonlou", "2 310", "🧥", "#C9A27E", "À 2 min à pied d’ici")
_ALICE = ("La Page d’Alice", "librairie", "lapagedalice", "1 870", "📚", "#7FA7C9", "À 4 min à pied d’ici")
_BERGINE = ("Chez Bergine", "bistrot", "chezbergine", "2 640", "🍽️", "#C96F5A", "À 3 min à pied d’ici")
PARTENAIRES = {"restaurant": (_LOU, _ALICE), "atelier": (_ALICE, _BERGINE), "bien-etre": (_LOU, _ALICE)}[VARIANTE]
DECOUVERTE = {"restaurant": "le menu du jour", "atelier": "l’atelier tour du samedi", "bien-etre": "une séance découverte"}[VARIANTE]
# Son prénom (réplique 1, « Moi, c'est … ») et son numéro, à la fin (confirmés par le propriétaire, 31 octobre)
PRENOM = "Jean-Philippe"
TELEPHONE = "06 22 12 96 75"

# Les treize répliques, mot pour mot, coupées en morceaux de sous-titres (« | »). L'aide au calage : « coupures », les
# mots devant lesquels l'enregistrement se tait sans ponctuation ; « liees », les mots après lesquels la ponctuation ne
# s'entend pas ; « coupe », la fin à garder (un bruit après la phrase).
SOUS = {
    "l01": ("01-p", f"Bonjour{NB}! | Moi, c’est {PRENOM}. | Mon métier{NB}? | Faire en sorte que les gens | ne se contentent plus | de regarder votre commerce | "
            "sur leur téléphone… | mais qu’ils poussent votre porte.", {"liees": ("Moi,",), "coupures": ("poussent",)}),
    "l02": ("02-m", f"Et moi{NB}! | Je suis Mike, | votre futur fantôme préféré.", {}),
    "l03": ("03-p", f"On a 30 jours | pour transformer votre communauté | en clients. | Je vous montre{NB}?", {}),
    "l04": ("04-p", f"Jour 1{NB}: | je viens chez vous. | Quelques photos, | deux ou trois questions… | et Mike s’occupe du reste.", {"liees": ("photos,",)}),
    # (la 5, réenregistrée le 4 novembre : « ou une vidéo », et « un très beau film »)
    "l05": ("05-m", "Avec quelques photos ou une vidéo, | je fais un très beau film | où je mets à l’honneur | votre menu du jour, | puis je le publie partout | "
            "pour que tout le monde le voie.", {}),
    "l06": ("06-p", "Mais ce n’est pas là | qu’il est le plus fort. | C’est juste après.", {}),
    # (la 7 : les trois cages dans les mots du métier — réenregistrée par métier le 1er novembre ; l'ancienne finissait par
    # « les trois cages apparaissent », l'indication de scène lue par erreur)
    "l07": ("07-m", f"{L07} | “Ça donne envie”, | “Je réserverai un jour”, | ou “Je réserve aujourd’hui”.", {"coupures": ("un", "“Je")}),
    # (la 8, réenregistrée le 1er novembre : « je profite de leurs réponses… créer du lien » au lieu de « je leur réponds » ;
    # « les plus rapides » au lieu de « les plus fidèles » — dans l'application, la cage dorée va au premier qui l'ouvre)
    "l08": ("08-m", "Et moi, | je profite de leurs réponses | pour discuter avec eux | et créer du lien. | Petit à petit, | je découvre leurs envies, | "
            "leurs habitudes… | et je leur donne une bonne raison | de pousser votre porte. | Et pour les plus rapides, | ceux qui ouvrent en premier | "
            "ma cage dorée, | je les bichonne | avec des petites surprises.", {"coupures": ("de", "bichonne", "avec", "surprises."), "liees": ("petit,", "envies,")}),
    "l09": ("09-m", "Chaque jour, | une nouvelle vidéo invite | à rejoindre votre famille de fantômes. | Elle grandit devant votre porte.", {"coupe": 6.08}),
    "l10": ("10-p", f"À la fin du mois, | on fait le bilan ensemble{NB}: | chaque bon validé | à votre comptoir, | c’est un client | que je vous ai amené.",
            {"liees": ("mois,", "comptoir,")}),
    "l11": ("11-m", f"Et voilà{NB}: | pas de blabla, | pas de fausses promesses.", {}),
    "l12": ("12-m", "On n’est pas là | pour vous apporter des vues. | On est là | pour vous apporter des clients.", {}),
    # (la 13, réenregistrée le 1er novembre : ce que fait ClikMe, en trois temps, avant l'offre)
    "l13": ("13-p", f"Des vidéos qui font jouer vos clients, | pour mieux les connaître. | Des surprises et des figurines, | pour les remercier. | "
            f"Et un seul but{NB}: | remplir vos places vides, | au bon moment. | 1 mois gratuit | pour faire mes preuves… | on commence{NB}?",
            {"liees": ("figurines,",)}),
}
for c, ligne in V.get("lignes", {}).items():   # (les répliques propres au métier ; celles de la scène des figurines, plus bas)
    if c in SOUS:
        SOUS[c] = ligne
# 📣 LA 5b : SA VIDÉO PASSE AUSSI CHEZ DEUX COMMERÇANTS PARTENAIRES (4 novembre : « il manque le fait que c'est envoyé
# aussi sur les réseaux sociaux de deux autres partenaires, non concurrents, de la même ville… et bien insister dessus » ;
# `docs/diffusion-croisee.md`). Dite par Mike juste après la 5, la même dans les trois démos. Elle n'entre dans la démo
# qu'avec SON ENREGISTREMENT (`recu/humain/05b-m.mp3`) : sans lui, rien ne change. `--essai-05b` : sans
# l'enregistrement, au rythme estimé et SANS SON — seulement pour régler la scène, jamais publié.
L05B = ("05b-m", f"Et ce n’est pas tout{NB}: | je l’envoie aussi | chez deux commerçants partenaires | de votre ville, | jamais des concurrents. | "
        f"Ils la publient sur leurs réseaux, | et vous publiez les leurs. | Votre vidéo est vue | bien au-delà de votre communauté{NB}!", {})
ESSAI_05B = "--essai-05b" in sys.argv and not os.path.exists(f"{R}/05b-m.mp3")
if os.path.exists(f"{R}/05b-m.mp3") or ESSAI_05B:
    SOUS = {k2: v2 for k, v in SOUS.items() for k2, v2 in ([(k, v), ("l05b", L05B)] if k == "l05" else [(k, v)])}
# LA SCÈNE DES FIGURINES (1er novembre, `docs/figurines.md`), entre la 12 et la 13, la même dans les trois démos : sa
# révélation en deux répliques ; entre les deux, la figurine du chef de Chez Bergine qui invite Camille à prendre une
# table vide (sa voix : un fichier ElevenLabs fourni, « Nicolas ») ; à la fin, une cliente (« Emma »). Les places
# vides, remplies au bon moment par la figurine, et la collection pour remercier ceux qui viennent.
FIGS_LIGNES = {
    "l12b": ("figurines/jp-revelation-a", f"Cette figurine | qui vous parle depuis le début{NB}? | C’est moi. | Et vous aurez la vôtre. | Une table vide{NB}? | "
             f"Un vocal de 10 secondes… | et c’est votre figurine | qui prévient ceux qui attendaient ce moment, | à leur prénom{NB}:", {}),
    "lchef": ("figurines/chef-camille", f"Camille{NB}! | Il me reste une table à 12 h 30{NB}: | elle est à toi pendant 5 minutes{NB}!", {}),
    # (la 12c, réécrite et réenregistrée par lui le 1er novembre : la figurine du pro se gagne en remplissant ses creux, et
    # se collectionne d'édition en édition ; les plus fidèles reçoivent LEUR figurine, qui parle avec leur voix. « Les plus
    # fidèles » : le « Les », absent de son texte, s'entend dans l'enregistrement.)
    "l12c": ("figurines/jp-revelation-b2", f"Et pour ceux qui remplissent vos creux, | ils gagnent votre figurine, | dans son édition du moment{NB}: | "
             f"Halloween, Noël, l’été, la rentrée… | et des éditions rares. | À collectionner absolument{NB}! | Les plus fidèles, ils reçoivent | "
             f"leur propre figurine… | qui parle avec leur voix{NB}:", {"liees": ("Halloween,", "Noël,", "l’été,", "rentrée…", "fidèles,")}),
    "lcli": ("figurines/cliente", f"Le meilleur magret | de Dax{NB}!", {}),
}
FIGS_LIGNES.update({c: ligne for c, ligne in V.get("lignes", {}).items() if c in FIGS_LIGNES})   # (dans les mots du métier)
SOUS = {**{c: v for c, v in SOUS.items() if c != "l13"}, **FIGS_LIGNES, "l13": SOUS["l13"]}

# Les moments de sa figurine (répliques du propriétaire) : (expression, mot de départ ou « fin », décalage, mot de fin
# ou « fin » ou None, décalage) ; « fin » : la fin de sa voix (pas celle du fichier). Le clin d'œil, bouche en « o »,
# après « Mon métier ? », les yeux qui louchent sur son téléphone, son grand rire ; un clin d'œil pour « Je vous
# montre ? », etc.
MOMENTS = {
    "l01": [("clino", "Faire", -.36, "Faire", -.01), ("louche", "sur", 0, "mais", -.25), ("rire", "fin", .05, None, 0)],
    "l03": [("clino", "fin", .05, "fin", .55)],
    "l04": [("louche", "trois", 0, "et", -.3), ("clin", "fin", .05, "fin", .5)],
    "l06": [("clin", "fin", .05, "fin", .5)],
    "l10": [("rire", "fin", .05, "fin", .95)],
    "l12b": [("clin", "C’est", -.05, "Et", -.15)],
    "l12c": [("rire", "fin", .05, "fin", .9)],
    "l13": [("rire", "fin", 0, None, 0)],
}

# ─── LES DÉCORS (ceux de la démo de 45 s) ─────────────────────────────────────────────────────
FACADE = ('<div class="fac abs" style="' + V["fac_style"] + '"><i class="fac-ciel"></i><i class="fac-f"></i><i class="fac-pil g"></i><i class="fac-pil d"></i><i class="fac-corniche"></i><div class="fac-ens"><b class="nom-commerce">' + V["nom"] + '</b><small>' + V["enseigne"] + '</small></div>'
          '<i class="fac-store"></i><div class="fac-vit"><img src="si-interieur.webp" alt=""><i class="fac-reflet"></i><span class="fac-neon">Ouvert</span><span class="fac-dore">' + V["dore"] + '</span></div><i class="fac-lumiere"></i>'
          '<div class="fac-porte"><div class="fac-battant"><i></i></div></div><i class="fac-trot"></i>' + facade_decor() + ardoise(*V["ardoise"]) +
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
# l'éphéméride des 30 jours : ses pages, une par jour (on les arrache)
FEUILLES = "".join(f'<div class="feuille"><small>JOUR</small><b>{k}</b><span>sur 30</span></div>' for k in range(1, 31))
# LE FIL D'UN RÉSEAU SOCIAL, en parodie (pas de logo : l'en-tête est le compte du commerce) ; ses icônes, dessinées
# ici ; la 5e publication est celle dont la photo devient une porte
_I = {
    "coeur": '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><path d="M12 20.5s-7.4-4.4-9.4-8.9C1.1 8.3 3.2 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.6 0 5.7 3.8 4.2 7.1-2 4.5-9.4 8.9-9.4 8.9z"/></svg>',
    "bulle": '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><path d="M20.6 11.4a8.6 8.6 0 0 1-12.7 7.5L3.4 20.6l1.6-4.3a8.6 8.6 0 1 1 15.6-4.9z"/></svg>',
    "avion": '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round"><path d="M21.6 2.6 2.4 9.9l7.6 3.3 3.3 7.6z"/><path d="M10 13.2 21.6 2.6"/></svg>',
    "signet": '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12v18l-6-5-6 5z"/></svg>',
    "maison": '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.2" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg>',
    "loupe": '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.2"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg>',
    "plus": '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/></svg>',
    "film": '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="m10 8.5 5.5 3.5-5.5 3.5z" fill="#111"/></svg>',
    "profil": '<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
}
_GROS = '<svg viewBox="0 0 24 24"><path fill="#fff" d="M12 21.2s-8-4.8-10.1-9.6C.3 8 2.6 3.8 6.6 3.8c2.3 0 3.9 1.3 5.4 3.2 1.5-1.9 3.1-3.2 5.4-3.2 4 0 6.3 4.2 4.7 7.8-2.1 4.8-10.1 9.6-10.1 9.6z"/></svg>'
_POSTS = V["posts"]
_PORTE = ('<div class="ig-porte"><span style="left:60px"><img src="g/cosy-debout.webp" alt=""></span><span style="left:170px"><img src="g/soleil-debout.webp" alt=""></span>'
          '<i class="pg"></i><i class="pd"></i></div>')
FIL_SOCIAL = ('<div class="ig-ecran"><div class="ig-haut"><b>' + V["compte"] + ' ⌄</b>' + _I["coeur"] + _I["avion"] + '</div><div class="ig-flux">'
              '<div class="ig-stories">' + "".join(f'<span class="ig-st"><i style="background-image:url({f})"></i></span>' for f in ("m1.jpg", "m4.jpg", "g/soleil-salue.webp", "m2.jpg"))
              + "</div>" + "".join(
                  f'<div class="ig-post"><div class="ig-ent"><i></i><b>{V["compte"]}</b>· Dax<em>···</em></div><div class="ig-img"><img src="{f}" alt="">'
                  + (_PORTE if k == 4 else "") + '</div><div class="ig-act">' + _I["coeur"] + _I["bulle"] + _I["avion"] + _I["signet"] + "</div>"
                  f'<p class="ig-txt"><b>{j} J’aime</b><br><b>{V["compte"]}</b> {txt}</p></div>' for k, (f, j, txt) in enumerate(_POSTS))
              + '</div><span class="ig-gros">' + _GROS + '</span><div class="ig-bas">' + "".join(_I[n] for n in ("maison", "loupe", "plus", "film", "profil")) + "</div></div>")
# « TADAM ! » : une étoile de bande dessinée, des points de trame, le mot
def _tadam():
    import math
    pts = " ".join(f"{310 + (300 if k % 2 == 0 else 205) * math.cos(k * math.pi / 11):.0f},{310 + (300 if k % 2 == 0 else 205) * math.sin(k * math.pi / 11):.0f}" for k in range(22))
    return ('<svg viewBox="0 0 620 620" aria-hidden="true"><defs><pattern id="trame" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="4" fill="#FF9F1C" opacity=".55"/></pattern></defs>'
            f'<polygon points="{pts}" fill="#FFE14D" stroke="#FF2E9A" stroke-width="14" stroke-linejoin="round"/><polygon points="{pts}" fill="url(#trame)"/>'
            '<text x="310" y="350" text-anchor="middle" transform="rotate(-7 310 310)" font-family="Poppins,sans-serif" font-weight="900" font-style="italic" font-size="112" '
            'fill="#fff" stroke="#E0167A" stroke-width="14" paint-order="stroke" stroke-linejoin="round">TADAM !</text></svg>')
TADAM = _tadam()
# la communauté (des « j'aime »)… qui devient des clients
COMM = "".join(f'<span><em>{e}</em><img src="g/{g}-salue.webp" alt=""></span>' for e, g in (("❤️", "cosy"), ("👍", "soleil"), ("💬", "artiste"), ("❤️", "curieux"), ("👍", "rebelle")))
# les fidèles devant la cage dorée : les trois premiers gagnent chacun leur surprise
DOREE = [(70, "soleil", "or", V["surprises"][0], -70), (270, "artiste", "or", V["surprises"][1], -70), (470, "curieux", "argent", V["surprises"][2], -70),
         (670, "cosy", "argent", None, 0), (870, "denim", "bronze", None, 0)]
DOREE_G = "".join(f'<span class="dor-g" style="left:{x}px"><span class="corps"><img src="g/{g}-debout.webp" alt=""><i class="patch {e}"></i></span>'
                  + (f'<em class="dor-s" style="top:{h}px">{s}</em>' if s else "") + "</span>" for x, g, e, s, h in DOREE)
# 📣 LA 5b : ses deux partenaires, chacun son téléphone qui publie sa vidéo en « Découverte du quartier » (le texte que
# l'application écrit, `texteDeDecouverte` de `src/lib/direct/diffusion.ts`), son nom, ses abonnés, ses vues en plus
PARTENAIRES_HTML = "".join(
    f'<div class="pa abs" id="pa{k + 1}"><div class="pa-tel"><div class="pa-haut"><i style="background:{coul}">{emb}</i><b>{compte}</b><small>· Dax</small></div>'
    f'<div class="pa-img"><img src="m1.jpg" alt=""><span class="pa-pill">📣 Découverte du quartier</span><span class="pa-play">▶</span></div>'
    f'<p class="pa-txt"><b>{compte}</b> Découverte du quartier 📣 {ou}, {"" if V["nom"].lower().startswith("chez ") else "chez "}{V["nom"]}{NB}: {DECOUVERTE}. Allez voir{NB}!</p></div>'
    f'<div class="pa-nom">{nom}<small>{metier} · 👥 {abo} abonnés</small></div><span class="pa-vues">👁 +{abo}</span></div>'
    for k, (nom, metier, compte, abo, emb, coul, ou) in enumerate(PARTENAIRES))
# (sa vidéo qui s'envole chez eux ; et les leurs — leur emblème — qui reviennent chez lui)
PARTENAIRES_HTML += '<img class="pa-vol abs" src="m1.jpg" alt=""><img class="pa-vol abs" src="m1.jpg" alt="">' + "".join(
    f'<span class="pa-ret abs" style="background:{p[5]}">{p[4]}</span>' for p in PARTENAIRES)
VU_G = "".join(f'<span class="pt-g" style="left:{x}px"><img src="g/{g}-debout.webp" alt=""></span>' for g, x in (("fleuri", 10), ("rebelle", 90), ("voyageur", 170)))
LOOKS = ["cosy", "fleuri", "curieux", "artiste", "denim", "rebelle", "soleil", "voyageur"]

# ─── LES VOIX ───────────────────────────────────────────────────────────────────────────────
for sous in ("voix", "g", "js", "f"):
    os.makedirs(f"{D}/{sous}", exist_ok=True)
TEMPS = {}
for c, (fichier, texte, aide) in SOUS.items():
    src = f"{R}/{fichier}.mp3"
    if c == "l05b" and ESSAI_05B:   # (l'essai sans l'enregistrement : les mots au rythme estimé, un silence pour voix)
        ws = texte.replace(" | ", " ").split(" ")
        m = [.2]
        for w in ws[:-1]:
            m.append(round(m[-1] + .062 * (len(w) + 1) + (.28 if w[-1] in ",.:!?" else 0), 3))
        dd = round(m[-1] + .062 * len(ws[-1]) + .35, 2)
        subprocess.run([FF, "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", str(dd), "-q:a", "9", f"{D}/voix/{c}.mp3"], check=True)
        TEMPS[c] = {"d": dd, "m": m, "parle": round(dd - .3, 2)}
        print(c, dd, "s (ESSAI, sans son ni enregistrement)")
        continue
    if aide.get("coupe") or aide.get("debut"):   # (un morceau de l'enregistrement : de « debut » à « coupe »)
        coupe, a0 = f"{D}/voix/{c}-coupe.wav", aide.get("debut", 0)
        subprocess.run([FF, "-v", "error", "-y", *(["-ss", str(a0)] if a0 else []), "-i", src,
                        *(["-t", str(aide["coupe"] - a0)] if aide.get("coupe") else []), coupe], check=True)
        src = coupe
    egaliser(FF, src, f"{D}/voix/{c}.mp3")
    a = caler(FF, src, texte.replace(" | ", " "), "-38dB", aide.get("coupures", ()), aide.get("liees", ()))
    TEMPS[c] = {"d": a["d"], "m": a["m"], "parle": round(segments(FF, src, a["d"], "-38dB")[-1][1], 2)}
    if aide.get("coupe") or aide.get("debut"):
        os.remove(src)
    print(c, a["d"], "s ·", len(a["m"]), "mots")
if "l05b" not in SOUS and os.path.exists(f"{D}/voix/l05b.mp3"):
    os.remove(f"{D}/voix/l05b.mp3")   # (le silence d'un essai : jamais publié)

# ─── SA MÈRE, AU DÉBUT : « T'es le meilleur, mon fils ! » (sa voix : un fichier ElevenLabs qu'il a fourni ; ses trois
# photos de profil : neutre, sourire, rire). Elle sort sa carte « Élu meilleur community manager 2026 *par sa mère ».
M_DIR = f"{R}/maman"
MAMAN = None
if os.path.exists(f"{M_DIR}/voix.mp3"):
    from PIL import Image
    MAMAN_TEXTE = f"T’es le meilleur, mon fils{NB}!"
    egaliser(FF, f"{M_DIR}/voix.mp3", f"{D}/voix/maman.mp3")
    a = caler(FF, f"{M_DIR}/voix.mp3", MAMAN_TEXTE, "-38dB", (), ())
    e = [min(9, round(v * 9)) for v in energie(FF, f"{M_DIR}/voix.mp3")]
    # son visage, image par image : le sourire dès qu'elle parle, le rire (bouche ouverte) sur les syllabes fortes —
    # avec un peu d'inertie (pas de clignotement d'une image à l'autre) ; après sa phrase, elle rit
    x, cur, tenu = [], "n", 0
    for v in e:
        voulu = cur
        if cur == "n" and v >= 1:
            voulu = "s"
        elif cur == "s" and v >= 6:
            voulu = "r"
        elif cur == "r" and v <= 2:
            voulu = "s"
        if voulu != cur and tenu >= 3:
            cur, tenu = voulu, 0
        else:
            tenu += 1
        x.append(cur)
    MAMAN = {"d": a["d"], "m": a["m"], "mots": MAMAN_TEXTE.split(" "), "x": "".join(x)}
    # ses photos : la tête et le col, cadrés pareil (la photo « rire » est recalée de 5 px : sa tête bouge un peu)
    for nom, dx in (("neutre", 0), ("sourire", 0), ("rire", 5)):
        im = Image.open(f"{M_DIR}/{nom}.jpg").convert("RGB")
        im.crop((140 + dx, 0, 660 + dx, 624)).resize((400, 480), Image.LANCZOS).save(f"{D}/f/maman-{nom}.webp", quality=86)
    print("sa mère :", MAMAN["d"], "s ·", MAMAN["x"])

# ─── SA MÈRE, À LA FIN (si son enregistrement est là : `recu/humain/maman/fin.mp3`) : de face, elle applaudit, et
# envoie les gens vers son numéro. Ses trois photos de face : parle (bouche ouverte), sourire, rire.
# ⚠ MAMAN_FIN_TEXTE doit être, au mot près, ce qu'elle dit dans l'enregistrement (il s'affiche dans sa bulle).
MAMAN_FIN_TEXTE = f"Appelez-le{NB}! | Et dites-lui d’appeler | sa mère{NB}!"
MAMAN_FIN = None
if os.path.exists(f"{M_DIR}/fin.mp3"):
    from PIL import Image
    egaliser(FF, f"{M_DIR}/fin.mp3", f"{D}/voix/maman-fin.mp3")
    a = caler(FF, f"{M_DIR}/fin.mp3", MAMAN_FIN_TEXTE.replace(" | ", " "), "-38dB", (), ())
    e = [min(9, round(v * 9)) for v in energie(FF, f"{M_DIR}/fin.mp3")]
    # son visage : le sourire, la bouche ouverte sur les syllabes fortes (avec un peu d'inertie)
    x, cur, tenu = [], "s", 0
    for v in e:
        voulu = "p" if cur == "s" and v >= 5 else "s" if cur == "p" and v <= 2 else cur
        if voulu != cur and tenu >= 3:
            cur, tenu = voulu, 0
        else:
            tenu += 1
        x.append(cur)
    # la fin de sa phrase (le morceau de voix où tombe son dernier mot) : après, elle rit (la photo « rire »)
    mots = MAMAN_FIN_TEXTE.replace(" | ", " ").split(" ")
    dernier = a["m"][max(i for i, w in enumerate(mots) if any(c.isalpha() for c in w))]   # (le dernier vrai mot, pas « ! »)
    fin_parole = next((b for a0, b in segments(FF, f"{M_DIR}/fin.mp3", a["d"], "-38dB") if a0 - .05 <= dernier <= b), a["d"])
    x = x[:int(fin_parole * 30)] + ["r"] * max(0, len(x) - int(fin_parole * 30))
    MAMAN_FIN = {"d": a["d"], "m": a["m"], "texte": MAMAN_FIN_TEXTE, "x": "".join(x), "rire": round(fin_parole, 2)}
    for nom in ("parle", "sourire", "rire"):
        im = Image.open(f"{M_DIR}/face-{nom}.jpg").convert("RGB")
        im.crop((110, 0, 742, 760)).resize((360, 432), Image.LANCZOS).save(f"{D}/f/maman-face-{nom}.webp", quality=86)
    print("sa mère, à la fin :", MAMAN_FIN["d"], "s ·", MAMAN_FIN["x"])

# ─── SA FIGURINE SUR RESSORT : les images (`ressort.py`), puis ses pistes (une par réplique du propriétaire) ──────────
# sa tête (une par expression), son corps (un par geste), le ressort, le socle ; et sa carte de CV : la photo du jouet,
# recadrée sur son buste (au format de la photo de la carte, 492 × 560), et la même vide (la page y pose le jouet)
for f in os.listdir(f"{D}/f"):   # (les morceaux de l'ancienne figurine, sa tête sur un corps de fantôme)
    if re.match(r"(tete-.*|cou|corps|bras-[gd])\.webp$", f):
        os.remove(f"{D}/f/{f}")
CARTE = (145, 8, 707, 648)
FIGURE = {"jouet": preparer_ressort(f"{R}/ressort", f"{D}/f"), "carte": CARTE}
preparer_carte(f"{R}/ressort", f"{D}/f", CARTE, (984, 1120))
PISTES = {}
for c, moments in MOMENTS.items():
    texte = SOUS[c][1].replace(" | ", " ").split(" ")
    net = lambda w: re.sub(r"[^\wà-ÿœæ’']", "", w.lower())

    def quand(w, dec, c=c, texte=texte):
        if w is None:
            return None
        if w == "fin":
            return TEMPS[c]["parle"] + dec
        return TEMPS[c]["m"][[net(x) for x in texte].index(net(w))] + dec

    PISTES[c] = pistes(FF, f"{R}/{SOUS[c][0]}.mp3", [(e, quand(a, da), quand(b, db)) for e, a, da, b, db in moments])
    print(c, "figurine :", len(PISTES[c]["e"]), "images")

# MIKE BOUGE SUR SA VOIX : l'énergie de chacune de ses répliques, une valeur par image (0 à 9)
MIKE = {c: "".join(str(min(9, round(v * 9))) for v in energie(FF, f"{D}/voix/{c}.mp3")) for c, (f, _t, _a) in SOUS.items() if f.endswith("-m")}
# LE CHEF ET LA CLIENTE PARLENT (scène des figurines) : leur énergie, pour ouvrir leur bouche sur leur carte
PAROLES = {c: "".join(str(min(9, round(v * 9))) for v in energie(FF, f"{D}/voix/{c}.mp3")) for c in ("lchef", "lcli")}
# leurs images : la photo du chef (celle du restaurant) ; les figurines, recadrées en carte (le portrait, 0,72)
# LES ÉDITIONS : celles de la figurine du commerçant de la variante (le chef, Nina, Élise — reçues le 2 novembre,
# `chef-halloween.jpg` … `elise-rare.jpg`) : c'est sa figurine qu'on gagne, pas celle du propriétaire
FG = f"{R}/figurines"
QUI = V["pro"][1].rsplit("-", 1)[0]   # (« chef-neutre » → « chef »)
subprocess.run([FF, "-v", "error", "-y", "-i", V["pro"][0], "-vf", "scale='min(900,iw)':-2", "-q:v", "3", f"{D}/f/chef-photo.jpg"], check=True)
for src, dst in ((V["pro"][1], "fig-chef-n"), (V["pro"][2], "fig-chef-p"), ("cliente-neutre", "fig-cli-n"), ("cliente-parle", "fig-cli-p"),
                 *((f"{QUI}-{e}", f"ed-{e}") for e in ("halloween", "noel", "ete", "rentree", "rare"))):
    subprocess.run([FF, "-v", "error", "-y", "-i", f"{FG}/{src}.jpg", "-vf", "crop='min(iw,ih*0.72)':ih,scale=-2:760", "-quality", "86", f"{D}/f/{dst}.webp"], check=True)

# ─── LES IMAGES (celles du tour du restaurant), GSAP ──────────────────────────────────────────
for f, src in V["images"].items():
    if VARIANTE == "restaurant":
        shutil.copyfile(src, f"{D}/{f}")
    else:   # (ses photos, ramenées à 1 200 px au plus, au format attendu par la page)
        subprocess.run([FF, "-v", "error", "-y", "-i", src, "-vf", "scale='min(1200,iw)':-2", *(["-q:v", "3"] if f.endswith(".jpg") else ["-quality", "85"]), f"{D}/{f}"], check=True)
shutil.copyfile(V["hote"], f"{D}/hote.webp")
# LE FILM DU TÉLÉPHONE : la vidéo de l'interview du tour du restaurant ; et en WebM (VP8) pour les navigateurs sans
# H.264 — dont le Chromium de l'export —, une image clé toutes les demi-secondes
# (en H.264, une image clé toutes les demi-secondes : l'iPhone y saute vite — dans l'original, il y en a une toutes les
# 2 à 6 s, et chaque bond de l'avance rapide lui faisait décoder jusqu'à 6 s d'images)
def cles_rapprochees(f):
    # les images clés des 5 premières secondes : jamais plus d'une demi-seconde entre deux
    fp = shutil.which("ffprobe") or FF.replace("ffmpeg", "ffprobe")
    r = subprocess.run([fp, "-v", "error", "-select_streams", "v:0", "-skip_frame", "nokey", "-read_intervals", "%+5", "-show_entries", "frame=pts_time",
                        "-of", "csv=p=0", f], capture_output=True, text=True)
    t = [float(x.strip(",")) for x in r.stdout.split() if x.strip(",")]
    return len(t) > 2 and max(b - a for a, b in zip(t, t[1:])) <= .55


FILM_SRC = V["film"]
if not os.path.exists(f"{D}/interview.mp4") or os.path.getmtime(f"{D}/interview.mp4") < os.path.getmtime(FILM_SRC) \
        or not cles_rapprochees(f"{D}/interview.mp4"):
    subprocess.run([FF, "-v", "error", "-y", "-i", FILM_SRC, "-an", "-c:v", "libx264", "-profile:v", "high", "-level", "3.1", "-pix_fmt", "yuv420p",
                    "-crf", "27", "-preset", "slow", "-g", "15", "-keyint_min", "15", "-sc_threshold", "0", "-movflags", "+faststart", f"{D}/interview.mp4"], check=True)
if not os.path.exists(f"{D}/interview.webm") or os.path.getmtime(f"{D}/interview.webm") < os.path.getmtime(FILM_SRC):
    subprocess.run([FF, "-v", "error", "-y", "-i", FILM_SRC, "-an", "-c:v", "libvpx", "-b:v", "1M", "-g", "15",
                    "-deadline", "good", "-cpu-used", "2", f"{D}/interview.webm"], check=True)
for l in LOOKS:
    for pose in ("debout", "salue"):
        shutil.copyfile(f"{S}/tour/tf/{l}-{pose}.webp", f"{D}/g/{l}-{pose}.webp")
for f in ("gsap.min.js", "MotionPathPlugin.min.js"):
    shutil.copyfile(f"{S}/recu/gsap/{f}", f"{D}/js/{f}")

# ─── LA PAGE ─────────────────────────────────────────────────────────────────────────────────
page = open(f"{S}/outils/tour-humain.html", encoding="utf-8").read()
page = page.replace("@FACADE@", FACADE.replace("@FAMILLE@", FAMILLE_HTML))
page = re.sub("@TOQUE@", lambda m: toque() if V["toque"] else "", page)
for k, v in V["page"].items():
    page = page.replace(f"@V_{k}@", v)
# (la conversation : une espace fine insécable devant « ! », « ? », « : » — jamais seuls en début de ligne)
_js = dict(V["js"], fil=[re.sub(r" ([!?:;])", "\u202f\\1", x) for x in V["js"]["fil"]])
page = page.replace("@V_NOM@", V["nom"]).replace("/*@VAR@*/null", json.dumps(_js, ensure_ascii=False))
page = page.replace("@CAGE_ROSE@", cage_mini("#FF2E9A", True)).replace("@CAGE_ORANGE@", cage_mini("#F5A23A", False)).replace("@CAGE_VERTE@", cage_mini("#3DE2A6", False))
page = page.replace("@CAGE_OR@", cage_or()).replace("@SCEAU@", sceau())
page = page.replace("@FEUILLES@", FEUILLES).replace("@COMM@", COMM).replace("@DOREE_G@", DOREE_G).replace("@VU_G@", VU_G)
page = page.replace("@FIL_SOCIAL@", FIL_SOCIAL).replace("@TADAM@", TADAM).replace("@PARTENAIRES@", PARTENAIRES_HTML)
# (les vues en plus chez ses deux partenaires : le compteur de sa vidéo y monte, à la fin de la 5b)
page = page.replace("/*@PA_VUES@*/0", str(sum(int(p[3].replace(" ", "")) for p in PARTENAIRES)))
# son contact, à la fin : son nom et son numéro (on le touche pour l'appeler)
TEL_LIEN = "+33" + TELEPHONE.replace(" ", "")[1:]
page = page.replace("@PRENOM@", PRENOM).replace("@TELEPHONE@", TELEPHONE.replace(" ", NB)).replace("@TEL_LIEN@", TEL_LIEN)
page = page.replace("/*@TEMPS@*/null", json.dumps(TEMPS, ensure_ascii=False))
page = page.replace("/*@SOUS@*/null", json.dumps({c: t for c, (_, t, _a) in SOUS.items()}, ensure_ascii=False))
page = page.replace("/*@FIGURE@*/null", json.dumps(FIGURE, ensure_ascii=False))
page = page.replace("/*@PISTES@*/null", json.dumps(PISTES, ensure_ascii=False, separators=(",", ":")))
page = page.replace("/*@MIKE@*/null", json.dumps(MIKE, separators=(",", ":")))
page = page.replace("/*@PAROLES@*/null", json.dumps(PAROLES, separators=(",", ":")))
page = page.replace("/*@MAMAN@*/null", json.dumps(MAMAN, ensure_ascii=False, separators=(",", ":")))
page = page.replace("/*@MAMAN_FIN@*/null", json.dumps(MAMAN_FIN, ensure_ascii=False, separators=(",", ":")))
assert not re.search(r"@[A-Z0-9_]+@|/\*@", page), "un repère @…@ n'a pas été remplacé"
open(f"{D}/index.html", "w", encoding="utf-8").write(page)
print(os.path.basename(D) + "/index.html :", len(page) // 1024, "Ko")

# ─── LA BANDE-SON, D'UN BLOC (`son.mp3`) : la page la joue en direct (voir `bande-son.mjs`) ───────────────────
try:
    subprocess.run(["node", f"{S}/outils/bande-son.mjs", D, f"{D}/son.mp3"], check=True)
except (OSError, subprocess.CalledProcessError) as e:
    print("bande-son : pas faite (", e, ") — la page composera son son elle-même")

# ─── LA DÉMO EN VIDÉO (`demo.mp4`) : ce que la page joue (voir « LA DÉMO EN VIDÉO » dans `tour-humain.html`) ───────────
# rendue image par image depuis la page elle-même, servie le temps du rendu (ses voix se chargent par fetch, que file://
# refuse) ; sans l'écran « Touchez pour commencer » (on l'a touché quand elle démarre). `--sans-video` : pas de rendu
# (la page reprendra alors l'ancienne `demo.mp4`, si elle existe — décalée si la démo a changé).
if "--sans-video" not in sys.argv:
    import functools, http.server, threading

    class ParMorceaux(http.server.SimpleHTTPRequestHandler):
        # un fichier servi par morceaux (« Range ») : sans ça, le navigateur ne peut pas avancer dans le film de
        # l'interview, qui restait figé sur sa première image dans la vidéo
        def log_message(self, *a):
            pass

        def send_head(self):
            m = re.match(r"bytes=(\d+)-(\d*)$", self.headers.get("Range", ""))
            chemin = self.translate_path(self.path)
            if not m or not os.path.isfile(chemin):
                return super().send_head()
            taille = os.path.getsize(chemin)
            a, b = int(m.group(1)), min(int(m.group(2)) if m.group(2) else taille - 1, taille - 1)
            f = open(chemin, "rb")
            f.seek(a)
            self.send_response(206)
            self.send_header("Content-Type", self.guess_type(chemin))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Range", f"bytes {a}-{b}/{taille}")
            self.send_header("Content-Length", str(b - a + 1))
            self.end_headers()
            self._reste = b - a + 1
            return f

        def copyfile(self, source, sortie):
            reste = getattr(self, "_reste", None)
            if reste is None:
                return super().copyfile(source, sortie)
            while reste > 0:
                bloc = source.read(min(65536, reste))
                if not bloc:
                    break
                sortie.write(bloc)
                reste -= len(bloc)

    serveur = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(ParMorceaux, directory=D))
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    try:
        subprocess.run(["node", f"{S}/outils/rendre-video.mjs", f"http://127.0.0.1:{serveur.server_address[1]}/index.html?sansdepart",
                        f"{D}/demo.mp4", "30", "0", "web"], check=True)
        print("demo.mp4 :", os.path.getsize(f"{D}/demo.mp4") // 1024, "Ko")
    finally:
        serveur.shutdown()
