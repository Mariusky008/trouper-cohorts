# LE SEPTIÈME TOUR : « Le Cocon d’Élise », un salon de massage (détente musculaire, ayurvédique, kobido). Le
# commerce est fictif, comme ceux des autres démos ; le jour J, le présentateur tape le nom du vrai salon dans
# « Pour qui est cette démo ? ».
# Tiré du tour de la coiffure, le plus proche (des rendez-vous, des créneaux, Mike au comptoir) : ses mots, ses
# images et ses voix de métier sont remplacés, comme le lunetier l'a été depuis la bijouterie (tour-lunettes.py).
#  · les photos : recu/massage/photos (m1, m2, m3, m4, geste, boutique : .jpg, .jpeg, .png ou .webp), recadrées au
#    format des tours ; tant qu'il en manque, celles de la coiffure tiennent la place (et le script le dit) ;
#  · le fantôme : celui du bien-être de l'application (public/direct/double/pied/bien-etre) ;
#  · les voix du fantôme : recu/massage/voix/<nom>.mp3 (ElevenLabs « Mike »), mesurées mot à mot ; une réplique
#    pas encore enregistrée s'écrit au rythme estimé, sans le son ;
#  · la voix d'Élise (sa réponse à la question 1) : recu/massage/voix/elise.mp3 ; sans elle, voix.mp3 muet (le
#    livre écrit ses mots à la plume, sans son, comme pour Clara) ;
#  · ses films (message, specialiste, episode .mp4, leurs affiches .jpg et dernières images -fin.jpg) : montés
#    par films-massage.py, rangés dans tour-massage/ ; ce script lit leur durée.
# À lancer avant la chaîne des dix scripts :  python3 -I tour-massage.py <dossier>
import json, os, re, shutil, subprocess, sys

S = sys.argv[1]
FF = f"{S}/ffmpeg"
B = f"{S}/tour-coiffure"
BIJ = f"{S}/tour-bijouterie"
D = f"{S}/tour-massage"
R = f"{S}/recu/massage"
FANT = next(p for p in (os.path.join(S, "..", "..", "public", "direct", "double", "pied", "bien-etre"),
                        "/home/user/trouper-cohorts/public/direct/double/pied/bien-etre") if os.path.isdir(p))
NB, INS = " ", " "
os.makedirs(D, exist_ok=True)
MANQUE = []


def ff(*a):
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", *a], check=True)


def duree(f):
    out = subprocess.run([FF, "-hide_banner", "-i", f], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def aligner(f, texte, avant=0):
    r = subprocess.run(["python3", "-I", f"{S}/outils/aligner-voix.py", FF, f, texte, str(avant)], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"{f} : {r.stderr[-400:]}")
    return json.loads(r.stdout)


mmss = lambda s: f"{int(s) // 60}:{int(round(s)) % 60:02d}"
fine = lambda t: re.sub(r" ([!?:;])", NB + r"\1", t)

# ═══ CE QUI FAIT LE SALON DE MASSAGE ═══
NOM, PRENOM, PSEUDO = "Le Cocon d’Élise", "Élise", "lecocondelise"
PLAT, PRIX = "Massage détente musculaire", "60 €"
# ce que dit Élise : ses phrases (leurs instants sont mesurés sur sa voix, s'il y en a une)
PHRASES = ["Aujourd’hui, c’est le massage détente musculaire.", "Une heure pour dénouer le dos et les épaules, à l’huile chaude.",
           "On ressort léger, comme après une vraie nuit de sommeil.", "Et pour aller plus loin : l’ayurvédique, et le kobido pour le visage."]
PRISES = [("m1.jpg", "le massage : le dos, les épaules"), ("m2.jpg", "la cabine, prête"), ("m3.jpg", "les mains, l’huile chaude"), ("m4.jpg", "le kobido, le visage")]
CASES = ["Une heure", "Huile chaude", "Dos et épaules", "À réserver sur ClikMe", "Nouveau", "Thé offert"]
RECIT = (f"Je pousse la porte du Cocon d’Élise. Le massage du jour : {PLAT}. Une heure pour dénouer le dos et les épaules, à l’huile chaude. "
         f"On ressort léger. Combien ? {PRIX}. Prenez rendez-vous au Cocon d’Élise !")
SOINS = ["Détente musculaire", "Ayurvédique", "Kobido"]

# ═══ 1. LES IMAGES ═══
# les 4 photos (560 × 619, comme les autres tours), le geste (le livre, l'épisode), la boutique (son avatar,
# « Et aussi… », le bon de « Moins de dépenses », le fond de la découverte)
P = f"{R}/photos"


def photo(nom):
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"):
        if os.path.exists(f"{P}/{nom}{ext}"):
            return f"{P}/{nom}{ext}"
    return None


# un recadrage au centre, au rapport voulu, quelle que soit la photo reçue
centre = lambda r: f"crop='min(iw,ih*{r})':'min(ih,iw/{r})'"
CADRES = {  # sortie : (photo reçue, rapport largeur/hauteur, taille)
    "m1.jpg": ("m1", 0.905, "560:619"), "m2.jpg": ("m2", 0.905, "560:619"), "m3.jpg": ("m3", 0.905, "560:619"), "m4.jpg": ("m4", 0.905, "560:619"),
    "geste.jpg": ("geste", 0.905, "560:619"), "av.jpg": ("boutique", 1, "140:140"), "autre.jpg": ("boutique", 0.727, "160:220"), "bon.jpg": ("boutique", 1, "300:300"),
}
REMPLACE = {"m1": "m1.jpg", "m2": "m2.jpg", "m3": "m3.jpg", "m4": "m4.jpg", "geste": "m3.jpg", "boutique": "autre.jpg"}
for sortie, (src, r, taille) in CADRES.items():
    f = photo(src)
    if not f:
        if f"photo {src}" not in MANQUE:
            MANQUE.append(f"photo {src}")
        f = f"{B}/{REMPLACE[src]}"
    ff("-i", f, "-vf", f"{centre(r)},scale={taille}:flags=lanczos", "-q:v", "3", f"{D}/{sortie}")
# le fantôme du bien-être (360 × 360, son visage 120 × 120)
for sortie, src, t in (("fant.webp", "repos", 360), ("fant-parle.webp", "parle-1", 360), ("fant-viens.webp", "viens", 360), ("v-moi.webp", "visage", 120)):
    ff("-i", f"{FANT}/{src}.webp", "-vf", f"scale={t}:{t}:flags=lanczos", "-c:v", "libwebp", "-quality", "86", f"{D}/{sortie}")
# LA DÉCOUVERTE (640 × 1385) : le salon en haut, le comptoir des tours métier en bas (celui de la bijouterie, comme
# le lunetier) ; puis le fantôme qui salue, debout sur le comptoir (e3)
COMPTOIR = 495
haut_img = photo("boutique") or photo("m2") or f"{B}/m2.jpg"
ff("-i", haut_img, "-i", f"{BIJ}/e1.webp", "-filter_complex",
   f"[0]crop='min(iw,ih*{640 / COMPTOIR:.4f})':'min(ih,iw/{640 / COMPTOIR:.4f})',scale=640:{COMPTOIR}:flags=lanczos[h];"
   f"[1]crop=640:{1385 - COMPTOIR}:0:{COMPTOIR}[b];[h][b]vstack", "-c:v", "libwebp", "-quality", "82", f"{D}/e1.webp")
raw = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-i", f"{FANT}/salut-1.webp", "-f", "rawvideo", "-pix_fmt", "rgba", "-"], capture_output=True).stdout
lignes = [y for y in range(640) if any(raw[(y * 640 + x) * 4 + 3] > 40 for x in range(0, 640, 4))]
haut, bas = lignes[0], lignes[-1]
taille = round(263 / (bas - haut) * 640)
x0, y0 = round(167 - taille / 2), round(COMPTOIR + 64 - bas * taille / 640)
ff("-i", f"{D}/e1.webp", "-i", f"{FANT}/salut-1.webp", "-filter_complex", f"[1]scale={taille}:{taille}[f];[0][f]overlay={x0}:{y0}",
   "-c:v", "libwebp", "-quality", "82", f"{D}/e3.webp")

# SA VITRINE (la façade de l'intro, celle des trois fantômes) : « on voit pas bien l'intérieur, c'est pas beau » ;
# la salle de sa photo boutique, deux tables et l'éventail sur la pierre, en paysage, réchauffée
ff("-i", photo("boutique") or f"{B}/m2.jpg", "-vf", "crop=iw:iw/1.43:0:ih*0.30,scale=540:-2:flags=lanczos,eq=saturation=1.15:brightness=-0.03:gamma_r=1.04",
   "-c:v", "libwebp", "-quality", "82", f"{D}/si-interieur.webp")

# ═══ 2. CE QUI EST COMMUN AUX TOURS MÉTIER (depuis la coiffure) ═══
PROPRES = {"index.html", "index.avant-episode2.html", "index.avant-intro.html", "voix.mp3", "b-1.jpg", "b-2.jpg", "b-3.jpg",
           "message.mp4", "message.jpg", "message-fin.jpg", "specialiste.mp4", "specialiste.jpg", "specialiste-fin.jpg",
           "episode.mp4", "episode.jpg", "episode-fin.jpg", "demain-voix.mp3", "e1.webp", "e3.webp", "fant.webp", "fant-parle.webp",
           "fant-viens.webp", "v-moi.webp"}
for f in sorted(os.listdir(B)):
    if f in PROPRES or f in CADRES or os.path.isdir(f"{B}/{f}") or (f.startswith("coiffure-") and f != "coiffure-depenses-4.mp3"):
        continue
    shutil.copy2(f"{B}/{f}", f"{D}/{f}")
for f in ("o-coiffure.jpg", "v-coiffure.webp"):                    # le coiffeur devient un voisin
    if os.path.exists(f"{S}/tour/{f}"):
        shutil.copy2(f"{S}/tour/{f}", f"{D}/{f}")

# ═══ 3. SES VOIX DE MÉTIER, MESURÉES MOT À MOT ═══
# nom : (titre, sous-titre, mots dits avant ceux qui s'affichent, écrit comme l'entend la mesure)
COCHE = "Coche ce qui est vrai : il ne dira rien d’autre."
VOIX = {
    "massage-clients-1": ("Aujourd’hui, on braque les projecteurs sur ton" + INS + "massage !", None, "", None),
    "massage-clients-5": ("quel est le nom de ton massage du jour ?", None, "À toi de jouer : ", None),
    "massage-clients-photos": ("Montre-moi ton massage en 4 photos !", None, "", "Montre-moi ton massage en quatre photos !"),
    "massage-clients-comment": ("Comment on raconte ton massage ?", "Trois façons : choisis la tienne.", "", None),
    "massage-clients-specialiste": ("Notre spécialiste bien-être raconte ton massage", COCHE, "", None),
    "massage-episode-cadre": ("Pose ton téléphone dans la cabine", "En plan serré sur tes mains, avec l’accord de ta cliente.", "", None),
    "massage-episode-session": ("Masse comme d’habitude", "Je filme, et je garde les meilleurs moments.", "", None),
}
TEMPS_NEUFS = {}
for nom, (q, c, avant, mesure) in VOIX.items():
    src = f"{R}/voix/{nom}.mp3"
    if os.path.exists(f"{D}/{nom}.mp3"):
        os.remove(f"{D}/{nom}.mp3")
    if not os.path.exists(src):
        MANQUE.append(f"voix {nom}")
        continue
    ff("-i", src, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,afade=t=in:d=0.02",
       "-c:a", "libmp3lame", "-q:a", "3", f"{D}/{nom}.mp3")
    q, avant = fine(q), fine(avant)
    qa = q if re.search(r"[.!?:…]$", q) else q + "."
    txt = fine(mesure) if mesure else avant + qa + (" " + fine(c) if c else "")
    a = len(avant.split()) if avant else 0
    TEMPS_NEUFS[nom] = aligner(f"{D}/{nom}.mp3", txt, a)
    mots = (avant + q + (" " + fine(c) if c else "")).split(" ")
    if len(mots) != len(TEMPS_NEUFS[nom]["m"]):
        raise SystemExit(f"{nom} : {len(TEMPS_NEUFS[nom]['m'])} instants pour {len(mots)} mots")
    print(f"{nom:30} {TEMPS_NEUFS[nom]['d']:.2f} s")
RENOMMEES = {f"coiffure-{k}": f"massage-{k}" for k in ("clients-1", "clients-4", "clients-5", "clients-photos", "clients-qui", "clients-specialiste",
                                                          "clients-comment", "episode-cadre", "episode-session")}

# ═══ 4. SA VOIX À ELLE : SA RÉPONSE (la question 1) ═══
if os.path.exists(f"{R}/voix/elise.mp3"):
    ff("-i", f"{R}/voix/elise.mp3", "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,afade=t=in:d=0.02",
       "-c:a", "libmp3lame", "-q:a", "3", f"{D}/voix.mp3")
    mt = aligner(f"{D}/voix.mp3", " ".join(PHRASES))["m"]
    debuts, k = [], 0
    for p in PHRASES:
        debuts.append(round(mt[k], 2))
        k += len(p.split(" "))
    paroles = list(zip(debuts, PHRASES))
    mots_vocal = list(zip([round(x, 2) for x in mt], " ".join(PHRASES).split(" ")))
else:
    MANQUE.append("voix elise (sa réponse)")
    ff("-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "15", "-c:a", "libmp3lame", "-q:a", "6", f"{D}/voix.mp3")
    paroles = list(zip([0.0, 3.2, 7.6, 11.6], PHRASES))
    mots_vocal = []
D_VOCAL = duree(f"{D}/voix.mp3")
# ses phrases et ses mots, avec leurs instants : pour le livre (tour-promesses.py) et son film (films-massage.mjs)
json.dump({"paroles": paroles, "mots": mots_vocal, "duree": duree(f"{D}/voix.mp3")}, open(f"{D}/paroles.json", "w", encoding="utf-8"), ensure_ascii=False)
print(f"sa réponse : {D_VOCAL:.2f} s · " + " · ".join(f"{a}" for a, _ in paroles))

# ═══ 5. LA PAGE, TIRÉE DE CELLE DE LA COIFFURE ═══
t = open(f"{B}/index.avant-episode2.html", encoding="utf-8").read()


def Rp(old, new, n=1):
    """Remplace, en vérifiant le nombre d'occurrences (None : au moins une)."""
    global t
    k = t.count(old)
    if (n is None and k == 0) or (n is not None and k != n):
        raise SystemExit(f"{k} fois au lieu de {n} : {old[:100]!r}")
    t = t.replace(old, new)


def RX(motif, new):
    global t
    t2, k = re.subn(motif, lambda m: new, t, count=1, flags=re.S)
    if k != 1:
        raise SystemExit(f"motif introuvable : {motif[:90]!r}")
    t = t2


# les films : leur durée réelle (montés par films-massage.py ; sinon ceux de la coiffure tiennent la place)
import filecmp
for f in ("message", "specialiste", "episode"):
    for ext in (".mp4", ".jpg", "-fin.jpg"):
        if not os.path.exists(f"{D}/{f}{ext}"):
            shutil.copy2(f"{B}/{f}{ext}", f"{D}/{f}{ext}")
        if filecmp.cmp(f"{D}/{f}{ext}", f"{B}/{f}{ext}", shallow=False):
            MANQUE.append(f"film {f}{ext}")
d_msg, d_spe, d_ep = duree(f"{D}/message.mp4"), duree(f"{D}/specialiste.mp4"), duree(f"{D}/episode.mp4")

# — la tête —
Rp("<title>Le tour du fantôme coiffure</title>", "<title>Le tour du fantôme massage</title>")
Rp("s'efface et la coupe apparaît", "s'efface et le massage apparaît")

# — les annonces —
RX(r'<span class="ap-txt"><b>salonclara</b> <span data-spe=".*?</span></span>',
   f'<span class="ap-txt"><b>{PSEUDO}</b> <span data-spe="🎬 Notre spécialiste bien-être est passé au salon : massage détente musculaire, une heure à l’huile chaude · {PRIX} 📍 Dax #{PSEUDO}" '
   f'data-episode="🎬 Saison 2026 · Épisode 3 : Une heure pour dénouer le dos : le massage détente 🌿 · {PRIX} 📍 Dax #{PSEUDO}">Aujourd’hui, c’est le massage détente musculaire 🌿 '
   f'« On ressort léger, comme après une vraie nuit de sommeil. » Une heure · {PRIX} 📍 Dax #{PSEUDO}</span></span>')
RX(r'<span class="ap-txt" data-spe="La coupe du jour de Clara ✂️.*?Prenez rendez-vous par WhatsApp !</span>',
   f'<span class="ap-txt" data-spe="Le massage du jour d’Élise 🌿 {PLAT} · {PRIX}. Une heure à l’huile chaude : notre spécialiste bien-être vous le raconte sur ClikMe. Prenez rendez-vous par WhatsApp !" '
   f'data-episode="Le massage du jour d’Élise 🌿 {PLAT} · {PRIX}. Une heure pour dénouer le dos : son épisode est sur ClikMe. Prenez rendez-vous par WhatsApp !">'
   f'Le massage du jour d’Élise 🌿 {PLAT} · {PRIX}. « On ressort léger, comme après une vraie nuit de sommeil. » Prenez rendez-vous par WhatsApp !</span>')
Rp("★ 4,8 · Salon de coiffure · Dax", "★ 4,8 · Salon de massage · Dax")
RX(r'<span class="ap-txt" data-spe="La coupe du jour de Clara\. Coupe et couleur.*?</span>',
   '<span class="ap-txt" data-spe="Le massage du jour d’Élise. Une heure à l’huile chaude, à réserver sur ClikMe." data-episode="Le massage du jour d’Élise. Une heure pour dénouer le dos, en vidéo.">'
   'Le massage du jour d’Élise. Une heure pour dénouer le dos et les épaules, à l’huile chaude.</span>')
Rp("<em>LA COUPE DU JOUR</em>", "<em>LE MASSAGE DU JOUR</em>", None)
Rp("Découvrir la coupe", "Découvrir le massage", None)
Rp("pendant qu’elle coiffe", "pendant qu’elle masse", None)
Rp('alt="Le carré court, brun profond, du Salon Clara"', f'alt="Le massage détente musculaire du {NOM[3:]}"')
Rp("<p>Coupe + couleur, signée Clara</p>", "<p>Une heure à l’huile chaude, par Élise</p>")
for x in ("✂️", "✂"):
    if x in t:
        Rp(x, "🌿", None)

# — la découverte : le miroir embué (un salon de massage en a aussi) —
Rp("Voir la coupe ↑", "Voir le massage ↑")
Rp("Cette coupe, elle vous tente ?", "Ce massage, il vous tente ?", 2)
Rp("Votre avis sur cette coupe", "Votre avis sur ce massage")
Rp("Les autres coupes du moment", "Les autres soins du moment")
Rp("Au <b>Salon Clara</b>, par WhatsApp. Clara vous confirme le créneau.", f"Au <b>{NOM[3:]}</b>, par WhatsApp. Élise vous confirme le créneau.")
Rp('<p class="dt-l">Vos cheveux ?</p>', '<p class="dt-l">Votre massage ?</p>')

# — sous le projecteur, la question, les photos —
Rp('"Aujourd’hui, on braque les projecteurs sur *ta" + INS + "coupe" + NB + "!"', '"Aujourd’hui, on braque les projecteurs sur *ton" + INS + "massage" + NB + "!"')
Rp("000 personnes qui cherchent une idée de coupe.", "000 personnes qui cherchent un moment de bien-être.")
Rp('question: "quel est le nom de ta coupe du jour" + NB + "?"', 'question: "quel est le nom de ton massage du jour" + NB + "?"')
Rp(f'const PLAT = "Carré court, brun profond", PRIX = "85 €";', f'const PLAT = "{PLAT}", PRIX = "{PRIX}";')
RX(r"  const PAROLES = \[\n.*?\n  \];\n", "  const PAROLES = [\n" + "".join(f"    [{a}, {json.dumps(p, ensure_ascii=False)}],\n" for a, p in paroles) + "  ];\n")
RX(r"  const PRISES = \[\n.*?\n  \];\n", "  const PRISES = [\n" + "".join(f'    ["{f}", "{c}"],\n' for f, c in PRISES) + "  ];\n")

# — le rendez-vous : le massage qu'elle veut, et quand elle vient —
Rp("/* Le rendez-vous : la longueur de ses cheveux, et quand elle vient. */", "/* Le rendez-vous : le massage qu'elle veut, et quand elle vient. */")
Rp('const CHEVEUX = ["Courts", "Mi-longs", "Longs"];', "const SOINS = " + json.dumps(SOINS, ensure_ascii=False) + ";")
Rp("const choix = { cheveux: 2, quand: 0, heure: 2 };", "const choix = { soin: 0, quand: 0, heure: 2 };")
Rp('boutons($("#dt-taille"), CHEVEUX, choix.cheveux, (k) => (choix.cheveux = k));', 'boutons($("#dt-taille"), SOINS, choix.soin, (k) => (choix.soin = k));')
Rp("/* Le message : on demande, on ne déclare pas — avec ses cheveux et le moment qu'elle a choisis ici. */",
   "/* Le message : on demande, on ne déclare pas — avec le massage et le moment qu'elle a choisis ici. */")
Rp('". J’ai les cheveux " + CHEVEUX[choix.cheveux].toLowerCase() + "."', '". Pour un massage " + SOINS[choix.soin].toLowerCase() + "."')
Rp('", pour le carré. "', '", pour le massage. "')

# — les trois façons, l'interview, l'épisode, notre spécialiste —
Rp('question: "Comment on raconte ta coupe ?"', 'question: "Comment on raconte ton massage ?"')
Rp("Deux : comment raconter la coupe ? Elle se filme pendant qu’elle masse", "Deux : comment raconter le massage ? Elle se filme pendant qu’elle masse")
Rp("Je te filme pendant que tu coiffes", "Je te filme pendant que tu masses")
Rp("Trois questions sur ta coupe,", "Trois questions sur ton massage,")
Rp("notre spécialiste coiffure raconte ta coupe à ta place.", "notre spécialiste bien-être raconte ton massage à ta place.")
Rp('"Le nom de la coupe", "Une façon de la raconter : filmée pendant que vous coiffez',
   '"Le nom du massage", "Une façon de le raconter : filmé pendant que vous massez')
RX(r'questions: \["Ta coupe du jour.*?\],',
   'questions: ["Ton massage du jour : alors, c’est quoi, le massage du jour ?", "Ton geste : comment tu le fais ?", "Ton massage en 3 mots : pas un de plus."],')
RX(r"On écoute \d+ secondes ici : ses réponses en durent \d+\.", f"Sa réponse dure {round(D_VOCAL)} secondes.")
Rp('cadreQ: "Pose ton téléphone dans le salon",', 'cadreQ: "Pose ton téléphone dans la cabine",')
Rp('cadreS: "En plan large, avec l’accord de ta cliente : tout le fauteuil dans le cadre.",', 'cadreS: "En plan serré sur tes mains, avec l’accord de ta cliente.",')
Rp("Trois : elle pose son téléphone dans le salon, en plan large, avec l’accord de sa cliente,",
   "Trois : elle pose son téléphone dans la cabine, en plan serré sur ses mains, avec l’accord de sa cliente,")
Rp('sessionQ: "Coiffe comme d’habitude",', 'sessionQ: "Masse comme d’habitude",')
Rp("Quatre : elle coupe, colore, coiffe. Le téléphone filme et garde les meilleurs moments : ici, 51 minutes en accéléré.",
   "Quatre : elle masse, comme d’habitude. Le téléphone filme et garde les meilleurs moments : ici, 55 minutes en accéléré.")
Rp('sessionFin: "La coupe est finie : touchez « J’ai terminé ».",\n    secondes: 3060,', 'sessionFin: "Le massage est fini : touchez « J’ai terminé ».",\n    secondes: 3300,')
Rp("l’accéléré, la coupe qui se révèle. Elle, elle a juste coiffé.", "l’accéléré, le massage qui se dévoile. Elle, elle a juste massé.")
Rp('duree: "0:55",', f'duree: "{mmss(d_ep)}",')
Rp("Et la voilà : votre coupe, en plein écran", "Et le voilà : votre massage, en plein écran", 3)
Rp('cases: ["Coupe + couleur", "Tous types de cheveux", "Produits naturels", "À essayer sur ClikMe", "Nouveau", "Soin offert"],', "cases: " + json.dumps(CASES, ensure_ascii=False) + ",")
RX(r'recit: "Je passe une tête au Salon Clara\.[^"]*",', "recit: " + json.dumps(RECIT, ensure_ascii=False) + ",")
Rp('duree: "0:28",', f'duree: "{mmss(d_spe)}",')
Rp('$("#minuteur").textContent = "0:21 ✓";', f'$("#minuteur").textContent = "{mmss(D_VOCAL)} ✓";')
# on l'écoute jusqu'au bout
Rp("plus(arretEnregistrement, 14300);", f"plus(arretEnregistrement, {round(D_VOCAL * 1000) + 700});")

# — le Direct : les offres du jour de la ville (pas de concurrents à côté de son massage) —
RX(r"  const AUTRES = \[\n.*?\n  \];\n", """  const AUTRES = [
    { nom: "Au Jardin de Rose", note: "★ 4,7 (96 avis)", ou: "📍 200 m · Dax", plat: "Bouquet de saison", sous: "Fleurs du marché, composé devant vous", prix: "35 €", photo: "o-fleurs.jpg", aime: 87 },
    { nom: "L’Atelier de Yann", note: "★ 4,6 (212 avis)", ou: "📍 350 m · Dax", plat: "Coupe et brushing", sous: "Sans rendez-vous le matin", prix: "45 €", photo: "o-coiffure.jpg", aime: 102 },
    { nom: "Chez Bergine", note: "★ 4,5 (41 avis)", ou: "📍 400 m · Dax", plat: "Magret grillé, pommes sarladaises", sous: "Le plat du jour", prix: "19 €", photo: "o-diner.jpg", aime: 64 },
  ];
""")

# — les moments du comptoir et de la cliente —
Rp("Un : le nom de la coupe.", "Un : le nom du massage.")
Rp("Trois : quatre photos, pour montrer la coupe.", "Trois : quatre photos, pour montrer le massage.")
Rp('guide("Montre-moi ta coupe en 4 photos !"', 'guide("Montre-moi ton massage en 4 photos !"')
Rp("raconte la coupe à sa place.", "raconte le massage à sa place.")
Rp('guide("Notre spécialiste coiffure raconte ta coupe"', 'guide("Notre spécialiste bien-être raconte ton massage"')
Rp("on fait défiler les coupes du jour de la ville", "on fait défiler les soins du jour de la ville")
Rp("Il raconte votre coupe ;", "Il raconte votre massage ;")
Rp("Elle dit la longueur de ses cheveux et quand elle vient.", "Elle dit le massage qu’elle veut et quand elle vient.")
Rp("<li>Le nom de la coupe</li>", "<li>Le nom du massage</li>")

# — ses voix de métier : leurs instants, leurs noms —
m = re.search(r"const TEMPS = (\{.*?\});\n", t)
T = json.loads(m.group(1))


def estimer(texte, avant=0):
    """Une réplique pas encore enregistrée : ses mots au rythme estimé (celui de la page), sa bouche ; sans son."""
    m, ouvert, x = [], [], 0.12
    for w in texte.split(" "):
        m.append(round(x, 2))
        d = 0.07 + len(re.sub(r"[^\w]", "", w)) * 0.05
        ouvert.append((x, x + d))
        x += d + (0.32 if re.search(r"[.?!:…]$", w) else 0.16 if re.search(r"[,;]$", w) else 0.03)
    d = round(x + 0.1, 2)
    b = "".join("1" if k % 4 != 3 and any(a <= k * 0.04 < z for a, z in ouvert) else "0" for k in range(int(d / 0.04) + 1))
    return {"d": d, "m": m, "b": b, **({"a": avant} if avant else {})}


T2 = {}
for k, v in T.items():
    n = RENOMMEES.get(k, k)
    if n in VOIX and n not in TEMPS_NEUFS:   # pas encore enregistrée : rythme estimé, sans le son (hors ENREGISTREES)
        q, c, avant, _ = VOIX[n]
        T2[n] = estimer(fine(avant) + fine(q) + (" " + fine(c) if c else ""), len(avant.split()) if avant else 0)
        continue
    T2[n] = TEMPS_NEUFS.get(n, v)
t = t.replace(m.group(0), "const TEMPS = " + json.dumps(T2, ensure_ascii=False, separators=(",", ":")) + ";\n")
for vieux, neuf in RENOMMEES.items():
    Rp(f'"{vieux}"', f'"{neuf}"', None)
m = re.search(r"  const ENREGISTREES = (\[[^\]]*\]);\n", t)
enr = [n for n in json.loads(m.group(1)) if n not in VOIX or n in TEMPS_NEUFS]
t = t.replace(m.group(0), "  const ENREGISTREES = " + json.dumps(enr, ensure_ascii=False) + ";\n")

# — enfin, son nom et son commerce partout ailleurs —
Rp("spécialiste coiffure", "spécialiste bien-être", None)
for avant, apres in (("au Salon Clara", "au Cocon d’Élise"), ("du Salon Clara", "du Cocon d’Élise"), ("le Salon Clara", "le Cocon d’Élise"),
                     ("Le Salon Clara", "Le Cocon d’Élise"), ("Salon Clara", NOM), ("de Clara", "d’Élise"), ("que Clara", "qu’Élise"),
                     ("Clara", PRENOM), ("salonclara", PSEUDO), ("Carré court, brun profond", PLAT), ("85 €", PRIX)):
    if avant in t:
        Rp(avant, apres, None)

# ce qui ne doit plus rester de la coiffure (la variable --brun, « je coupe les hésitations », couper le son, le format
# carré d'Instagram, le coiffeur voisin et la voix commune « coiffure-depenses-4 » restent)
permis = re.compile(r"--brun|var\(--brun|je coupe les hésitations|pour couper|[Cc]ouper?(Voix| le son|\()|Instagram : le carré|se coupent|une coupe, une nuit|"
                    r"coiffure-depenses-4|o-coiffure|v-coiffure|Coupe et brushing|coupes = |coupe = |\.ep-coupe|ep-coupe")
reste = sorted({x for x in re.findall(r"[^\n]{0,40}(?:Clara|[Cc]oupe|coiff|Coiff|cheveux|CHEVEUX|carré court|brun profond|fauteuil)[^\n]{0,40}", t) if not permis.search(x)})
if reste:
    raise SystemExit("reste de la coiffure :\n" + "\n".join(reste[:40]))
open(f"{D}/index.avant-episode2.html", "w", encoding="utf-8").write(t)
print("tour-massage · page de base écrite,", len(t), "caractères · films", mmss(d_msg), mmss(d_spe), mmss(d_ep))
if MANQUE:
    print("EN ATTENTE (provisoire en place) :", ", ".join(MANQUE))
