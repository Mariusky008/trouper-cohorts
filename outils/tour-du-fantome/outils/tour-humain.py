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
from figurine import energie, preparer, pistes  # noqa: E402
from decor import cage_mini, toque  # noqa: E402

S = sys.argv[1]
RACINE = os.path.abspath(f"{S}/../..")
FF = f"{S}/ffmpeg" if os.path.exists(f"{S}/ffmpeg") else shutil.which("ffmpeg")
D = f"{S}/tour-humain"
R = f"{S}/recu/humain"
NB = " "
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
    "l13": ("13-p", f"1 mois gratuit, | un mois pour faire mes preuves, | alors, | on commence{NB}?", {"liees": ("gratuit,",)}),
}

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
    "l13": [("rire", "fin", 0, None, 0)],
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
_POSTS = [("m1.jpg", "1 128", "Le magret du jour 🔥"), ("m2.jpg", "846", "Ce soir, terrasse ouverte ☀️"), ("m4.jpg", "2 019", "Notre chef aux fourneaux 👨‍🍳"),
          ("m1.jpg", "603", "Merci pour vos messages ❤️"), ("m3.jpg", "2 304", "Garbure landaise, ce midi 🥘"), ("m2.jpg", "411", "À demain !")]
_PORTE = ('<div class="ig-porte"><span style="left:60px"><img src="g/cosy-debout.webp" alt=""></span><span style="left:170px"><img src="g/soleil-debout.webp" alt=""></span>'
          '<i class="pg"></i><i class="pd"></i></div>')
FIL_SOCIAL = ('<div class="ig-ecran"><div class="ig-haut"><b>chezbergine ⌄</b>' + _I["coeur"] + _I["avion"] + '</div><div class="ig-flux">'
              '<div class="ig-stories">' + "".join(f'<span class="ig-st"><i style="background-image:url({f})"></i></span>' for f in ("m1.jpg", "m4.jpg", "g/soleil-salue.webp", "m2.jpg"))
              + "</div>" + "".join(
                  f'<div class="ig-post"><div class="ig-ent"><i></i><b>chezbergine</b>· Dax<em>···</em></div><div class="ig-img"><img src="{f}" alt="">'
                  + (_PORTE if k == 4 else "") + '</div><div class="ig-act">' + _I["coeur"] + _I["bulle"] + _I["avion"] + _I["signet"] + "</div>"
                  f'<p class="ig-txt"><b>{j} J’aime</b><br><b>chezbergine</b> {txt}</p></div>' for k, (f, j, txt) in enumerate(_POSTS))
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
DOREE = [(70, "soleil", "or", "🍮 Un dessert", -70), (270, "artiste", "or", "☕ Un café", -70), (470, "curieux", "argent", "🥐 Une douceur", -70),
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
    TEMPS[c] = {"d": a["d"], "m": a["m"], "parle": round(segments(FF, src, a["d"], "-38dB")[-1][1], 2)}
    if aide.get("coupe"):
        os.remove(src)
    print(c, a["d"], "s ·", len(a["m"]), "mots")

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

# ─── SA FIGURINE : les images, puis ses pistes (une par réplique du propriétaire) ───────────────────────
# sa carte de CV : sa vraie photo, cadrée sur son visage (et la même sans sa tête : la page y pose la sienne, qui en sort)
CARTE = (150, 0, 702, 634)
FIGURE = preparer(f"{R}/photos", f"{RACINE}/public/direct/ensemble/denim-debout.webp", f"{D}/f", carte=(CARTE, (976, 1120)))
FIGURE["carte"] = CARTE
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

# ─── LES IMAGES (celles du tour du restaurant), GSAP ──────────────────────────────────────────
for f in ("m1.jpg", "m2.jpg", "m3.jpg", "m4.jpg", "si-interieur.webp"):
    shutil.copyfile(f"{S}/tour/{f}", f"{D}/{f}")
shutil.copyfile(f"{S}/accueil2/page/g-restaurant-salue.webp", f"{D}/hote.webp")
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


if not os.path.exists(f"{D}/interview.mp4") or os.path.getmtime(f"{D}/interview.mp4") < os.path.getmtime(f"{S}/tour/interview.mp4") \
        or not cles_rapprochees(f"{D}/interview.mp4"):
    subprocess.run([FF, "-v", "error", "-y", "-i", f"{S}/tour/interview.mp4", "-an", "-c:v", "libx264", "-profile:v", "high", "-level", "3.1", "-pix_fmt", "yuv420p",
                    "-crf", "27", "-preset", "slow", "-g", "15", "-keyint_min", "15", "-sc_threshold", "0", "-movflags", "+faststart", f"{D}/interview.mp4"], check=True)
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
page = page.replace("@FEUILLES@", FEUILLES).replace("@COMM@", COMM).replace("@DOREE_G@", DOREE_G).replace("@VU_G@", VU_G)
page = page.replace("@FIL_SOCIAL@", FIL_SOCIAL).replace("@TADAM@", TADAM)
# son contact, à la fin : son numéro (on le touche pour l'appeler) et un QR code qui l'appelle
TEL_LIEN = "+33" + TELEPHONE.replace(" ", "")[1:]
QR = subprocess.run(["node", "-e", "require(process.argv[1]).toString(process.argv[2],{type:'svg',margin:1,errorCorrectionLevel:'M'},(e,s)=>{if(e)throw e;process.stdout.write(s)})",
                     f"{RACINE}/node_modules/qrcode", f"tel:{TEL_LIEN}"], capture_output=True, text=True, check=True).stdout
page = page.replace("@QR@", QR.replace("<svg ", '<svg aria-label="QR code : appeler ' + PRENOM + '" ', 1))
page = page.replace("@PRENOM@", PRENOM).replace("@TELEPHONE@", TELEPHONE.replace(" ", NB)).replace("@TEL_LIEN@", TEL_LIEN)
page = page.replace("/*@TEMPS@*/null", json.dumps(TEMPS, ensure_ascii=False))
page = page.replace("/*@SOUS@*/null", json.dumps({c: t for c, (_, t, _a) in SOUS.items()}, ensure_ascii=False))
page = page.replace("/*@FIGURE@*/null", json.dumps(FIGURE, ensure_ascii=False))
page = page.replace("/*@PISTES@*/null", json.dumps(PISTES, ensure_ascii=False, separators=(",", ":")))
page = page.replace("/*@MIKE@*/null", json.dumps(MIKE, separators=(",", ":")))
page = page.replace("/*@MAMAN@*/null", json.dumps(MAMAN, ensure_ascii=False, separators=(",", ":")))
assert not re.search(r"@[A-Z0-9_]+@|/\*@", page), "un repère @…@ n'a pas été remplacé"
open(f"{D}/index.html", "w", encoding="utf-8").write(page)
print("tour-humain/index.html :", len(page) // 1024, "Ko")

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
    serveur = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=D))
    serveur.RequestHandlerClass.log_message = lambda *a: None
    threading.Thread(target=serveur.serve_forever, daemon=True).start()
    try:
        subprocess.run(["node", f"{S}/outils/rendre-video.mjs", f"http://127.0.0.1:{serveur.server_address[1]}/index.html?sansdepart",
                        f"{D}/demo.mp4", "30", "0", "web"], check=True)
        print("demo.mp4 :", os.path.getsize(f"{D}/demo.mp4") // 1024, "Ko")
    finally:
        serveur.shutdown()
