# LE SIXIÈME TOUR : « Les Lunettes de Margaux », un lunetier. Le commerce est fictif, comme ceux des autres
# démos ; le jour J, le présentateur tape le nom du vrai magasin dans « Pour qui est cette démo ? ».
# Tiré du tour de la bijouterie, le plus proche (une pièce à voir, mise de côté sur WhatsApp, un atelier) :
# ses mots, ses images et ses voix de métier sont remplacés.
#  · les photos : recu/lunettes/photos (fournies par le propriétaire), recadrées au format des tours ;
#  · le fantôme opticien : celui de l'application (public/direct/double/pied/lunettes) ;
#  · les voix du fantôme : recu/lunettes/voix (enregistrements ElevenLabs « Mike »), mesurées mot à mot ;
#    sous le projecteur, quatre phrases sur Dax (lunettes-dax-1 à 4 : « Chaque jour à Dax, environ 40 à 50
#    personnes décident de changer de lunettes… ») ;
#  · la voix de Margaux : celle d'Aurore (recu/lunettes/voix/margaux.mp3, ElevenLabs), qui répond à la
#    question 1 ; ses phrases et leurs instants ont été relevés à l'écoute (Whisper « base ») ;
#  · son interview (message.mp4) est l'épisode 14 de « Face au fantôme » (outils/face-au-fantome/margaux) ;
#    le spécialiste et l'épisode sont montés à part par le moteur de l'application. Tous sont rangés dans
#    tour-lunettes/ (voir LISEZ-MOI : les films du lunetier) : ce script lit leur durée.
# À lancer avant la chaîne des huit scripts :  python3 -I tour-lunettes.py <dossier>
import json, os, re, shutil, subprocess, sys

S = sys.argv[1]
FF = f"{S}/ffmpeg"
B = f"{S}/tour-bijouterie"
D = f"{S}/tour-lunettes"
R = f"{S}/recu/lunettes"
FANT = next(p for p in (os.path.join(S, "..", "..", "public", "direct", "double", "pied", "lunettes"),
                        "/home/user/trouper-cohorts/public/direct/double/pied/lunettes") if os.path.isdir(p))
NB, INS = "\u202f", "\u00a0"
os.makedirs(D, exist_ok=True)


def ff(*a):
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", *a], check=True)


def duree(f):
    out = subprocess.run([FF, "-hide_banner", "-i", f], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


mmss = lambda s: f"{int(s) // 60}:{int(round(s)) % 60:02d}"
fine = lambda t: re.sub(r" ([!?:;])", NB + r"\1", t)

# ═══ CE QUI FAIT LE LUNETIER ═══
NOM, PRENOM, PSEUDO = "Les Lunettes de Margaux", "Margaux", "lunettesdemargaux"
PLAT, PRIX = "Monture ronde, cristal", "129 €"
# ce que dit Aurore (la voix de Margaux), et quand chaque phrase commence
PAROLES = [(0.0, "Aujourd’hui, c’est la monture ronde, en cristal."), (3.16, "Si légère qu’on l’oublie sur le nez."),
           (5.52, "Elle adoucit les visages carrés."), (7.3, "Je l’ajuste devant vous, en cinq minutes."), (9.64, "Elle va à presque tout le monde.")]
PRISES = [("m1.jpg", "portée, sur un visage"), ("m2.jpg", "la monture, de côté"), ("m3.jpg", "le cristal, de tout près"), ("m4.jpg", "pliée, sur le comptoir")]
CASES = ["Ajustée sur place", "Légère", "Essai sur ClikMe", "Pour visage carré", "Étui offert", "Nouveau"]
RECIT = ("Je pousse la porte des Lunettes de Margaux. La monture du jour : Monture ronde, cristal. Si légère qu’on l’oublie sur le nez. "
         "Et Margaux l’ajuste sur place, devant vous. Combien ? 129 €. Allez l’essayer aux Lunettes de Margaux !")
# l'icône du métier (le bouton du Direct, la table du lieu) : une paire de lunettes
LUNETTES = "M2.5 12.5a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0-7.2 0M14.3 12.5a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0-7.2 0M9.7 12q2.3-1.6 4.6 0"
BIJOU = "M7 4h10l3.5 5L12 20 3.5 9zM3.5 9h17M9.5 4 12 9l2.5-5"

# ═══ 1. LES IMAGES ═══
# les 4 photos (560 × 619, comme les autres tours), le geste (le livre, l'épisode), la boutique (son avatar,
# « Et aussi… », le bon de « Moins de dépenses », le fond de la découverte)
P = f"{R}/photos"
CADRES = {  # sortie : (photo, recadrage, taille)
    "m1.jpg": ("visage.jpg", "crop=ih*0.905:ih:iw-ih*0.905:0", "560:619"),
    "m2.jpg": ("profil.jpg", "crop=iw:iw/0.905:0:ih*0.2", "560:619"),
    "m3.jpg": ("gros-plan.jpg", "crop=ih*0.905:ih:(iw-ih*0.905)/2:0", "560:619"),
    "m4.jpg": ("pliee.jpg", "crop=iw:iw/0.905:0:(ih-iw/0.905)/2", "560:619"),
    "geste.jpg": ("geste.jpg", "crop=ih*0.905:ih:iw*0.62-ih*0.4525:0", "560:619"),
    "av.jpg": ("boutique.jpg", "crop=ih:ih:(iw-ih)/2:0", "140:140"),
    "autre.jpg": ("boutique.jpg", "crop=ih*0.727:ih:0:0", "160:220"),
    "bon.jpg": ("boutique.jpg", "crop=ih*0.8:ih*0.8:iw-ih*0.8:ih*0.2", "300:300"),
}
for sortie, (src, crop, taille) in CADRES.items():
    ff("-i", f"{P}/{src}", "-vf", f"{crop},scale={taille}:flags=lanczos", "-q:v", "3", f"{D}/{sortie}")
# le fantôme opticien (360 × 360, son visage 120 × 120)
for sortie, src, t in (("fant.webp", "repos", 360), ("fant-parle.webp", "parle-1", 360), ("fant-viens.webp", "viens", 360), ("v-moi.webp", "visage", 120)):
    ff("-i", f"{FANT}/{src}.webp", "-vf", f"scale={t}:{t}:flags=lanczos", "-c:v", "libwebp", "-quality", "86", f"{D}/{sortie}")
# LA DÉCOUVERTE (640 × 1385) : la boutique en haut, le comptoir de la bijouterie en bas (le même décor pour
# tous les tours métier) ; puis le fantôme qui salue, debout sur le comptoir (e3)
COMPTOIR = 495
ff("-i", f"{P}/boutique.jpg", "-i", f"{B}/e1.webp", "-filter_complex",
   f"[0]crop=ih*{640 / COMPTOIR:.4f}:ih:(iw-ih*{640 / COMPTOIR:.4f})/2:0,scale=640:{COMPTOIR}:flags=lanczos[h];"
   f"[1]crop=640:{1385 - COMPTOIR}:0:{COMPTOIR}[b];[h][b]vstack", "-c:v", "libwebp", "-quality", "82", f"{D}/e1.webp")
# le fantôme : sa silhouette (canal alpha) pour le poser pieds sur le comptoir, comme celui de la bijouterie
raw = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-i", f"{FANT}/salut-1.webp", "-f", "rawvideo", "-pix_fmt", "rgba", "-"], capture_output=True).stdout
lignes = [y for y in range(640) if any(raw[(y * 640 + x) * 4 + 3] > 40 for x in range(0, 640, 4))]
haut, bas = lignes[0], lignes[-1]
taille = round(263 / (bas - haut) * 640)            # 263 px de fantôme, comme celui de la bijouterie
x0, y0 = round(167 - taille / 2), round(COMPTOIR + 64 - bas * taille / 640)
ff("-i", f"{D}/e1.webp", "-i", f"{FANT}/salut-1.webp", "-filter_complex", f"[1]scale={taille}:{taille}[f];[0][f]overlay={x0}:{y0}",
   "-c:v", "libwebp", "-quality", "82", f"{D}/e3.webp")

# ═══ 2. CE QUI EST COMMUN AUX TOURS MÉTIER (depuis la bijouterie) ═══
PROPRES = {"index.html", "index.avant-episode2.html", "index.avant-intro.html", "voix.mp3", "b-1.jpg", "b-2.jpg", "b-3.jpg",
           "message.mp4", "message.jpg", "message-fin.jpg", "specialiste.mp4", "specialiste.jpg", "specialiste-fin.jpg",
           "episode.mp4", "episode.jpg", "episode-fin.jpg", "demain-voix.mp3"}
for f in sorted(os.listdir(B)):
    if f in PROPRES or f in CADRES or f.startswith(("bijouterie-", "lou-clients-")) or f in ("fant.webp", "fant-parle.webp", "fant-viens.webp", "v-moi.webp", "e1.webp", "e3.webp"):
        continue
    shutil.copy2(f"{B}/{f}", f"{D}/{f}")
for f in ("o-mode.jpg", "v-mode.webp"):                          # Maison Lou remplace l'opticien voisin
    shutil.copy2(f"{S}/tour-coiffure/{f}", f"{D}/{f}")

# ═══ 3. SES VOIX DE MÉTIER, MESURÉES MOT À MOT (comme celles de la bijouterie) ═══
# nom : (titre, sous-titre, mots dits avant ceux qui s'affichent, écrit comme l'entend la mesure)
COCHE = "Coche ce qui est vrai : il ne dira rien d’autre."
# sous le projecteur, à la place de « je la diffuse… je la relaie à 11 h… devant plus de 1 000 personnes » :
# combien de Dacquois changent de lunettes chaque jour, et où les trouver (le texte du propriétaire, tel que dit)
DAX = ["Chaque jour à Dax, environ 40 à 50 personnes décident de changer de lunettes.",
       "Pour capter ces 40 à 50 acheteurs du jour, il faut être présent là où ils passent leur temps.",
       "C’est la raison pour laquelle je diffuse votre annonce sur tous vos réseaux sociaux en même temps…",
       "…et que je la relaie sur ClikMe, où plus de 1" + INS + "000 Dacquois consultent les nouveautés des commerces locaux chaque jour."]
VOIX = {
    "lunettes-clients-1": ("Aujourd’hui, on braque les projecteurs sur ta" + INS + "monture !", None, "", None),
    "lunettes-dax-1": (DAX[0], None, "", DAX[0].replace("40 à 50", "quarante à cinquante")),
    "lunettes-dax-2": (DAX[1], None, "", DAX[1].replace("40 à 50", "quarante à cinquante")),
    "lunettes-dax-3": (DAX[2], None, "", None),
    "lunettes-dax-4": (DAX[3], None, "", DAX[3].replace("1" + INS + "000", "mille")),
    "lunettes-clients-5": ("quel est le nom de ta monture du jour ?", None, "À toi de jouer : ", None),
    "lunettes-clients-photos": ("Montre-moi ta monture en 4 photos !", None, "", "Montre-moi ta monture en quatre photos !"),
    "lunettes-clients-comment": ("Comment on raconte ta monture ?", "Trois façons : choisis la tienne.", "", None),
    "lunettes-clients-qui": ("Qui raconte ta monture ?", "Toi, avec ta voix, ou notre spécialiste lunettes, à ta place.", "", None),
    "lunettes-clients-specialiste": ("Notre spécialiste lunettes raconte ta monture", COCHE, "", None),
    "lunettes-episode-cadre": ("Pose ton téléphone à l’atelier", "En plan large : tes mains et la monture, en entier dans le cadre.", "", None),
}
TEMPS_NEUFS = {}
for nom, (q, c, avant, mesure) in VOIX.items():
    shutil.copy2(f"{R}/voix/{nom}.mp3", f"{D}/{nom}.mp3")
    q, avant = fine(q), fine(avant)
    qa = q if re.search(r"[.!?:…]$", q) else q + "."
    txt = fine(mesure) if mesure else avant + qa + (" " + fine(c) if c else "")
    a = len(avant.split()) if avant else 0
    r = subprocess.run(["python3", "-I", f"{S}/outils/aligner-voix.py", FF, f"{D}/{nom}.mp3", txt, str(a)], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"{nom} : {r.stderr[-400:]}")
    TEMPS_NEUFS[nom] = json.loads(r.stdout)
    mots = (avant + q + (" " + fine(c) if c else "")).split(" ")
    if len(mots) != len(TEMPS_NEUFS[nom]["m"]):
        raise SystemExit(f"{nom} : {len(TEMPS_NEUFS[nom]['m'])} instants pour {len(mots)} mots")
    print(f"{nom:30} {TEMPS_NEUFS[nom]['d']:.2f} s")
# « Travaille comme d'habitude » : la réplique de la bijouterie, la même
shutil.copy2(f"{B}/bijouterie-episode-session.mp3", f"{D}/lunettes-episode-session.mp3")
RENOMMEES = {"lou-clients-1": "lunettes-clients-1", "lou-clients-5": "lunettes-clients-5",
             "lou-clients-photos": "lunettes-clients-photos", "lou-clients-comment": "lunettes-clients-comment", "bijouterie-clients-qui": "lunettes-clients-qui",
             "bijouterie-clients-specialiste": "lunettes-clients-specialiste", "bijouterie-episode-cadre": "lunettes-episode-cadre",
             "bijouterie-episode-session": "lunettes-episode-session"}

# ═══ 4. SA VOIX À ELLE : SON VOCAL (la réponse d'Aurore à la question 1) ═══
shutil.copy2(f"{R}/voix/margaux.mp3", f"{D}/voix.mp3")
paroles = PAROLES
D_VOCAL = duree(f"{D}/voix.mp3")
print(f"son vocal : {D_VOCAL:.2f} s · {len(paroles)} phrases")

# ═══ 5. LA PAGE, TIRÉE DE CELLE DE LA BIJOUTERIE ═══
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


# les films : leur durée réelle
for f in ("message.mp4", "specialiste.mp4", "episode.mp4"):
    if not os.path.exists(f"{D}/{f}"):
        raise SystemExit(f"film manquant : tour-lunettes/{f} (voir LISEZ-MOI : les films du lunetier)")
d_msg, d_spe, d_ep = duree(f"{D}/message.mp4"), duree(f"{D}/specialiste.mp4"), duree(f"{D}/episode.mp4")

# — la tête, l'écrin devenu étui —
Rp("<title>Le tour du fantôme bijouterie</title>", "<title>Le tour du fantôme lunettes</title>")
Rp("le comptoir de l'atelier (Atelier Inès)", "le comptoir de la boutique (Les Lunettes de Margaux)")
Rp("(l'écrin, son message)", "(l'étui, son message)")
RX(r"/\* L'ÉCRIN SUR LE COMPTOIR.*?\.rideau\.leve \.dedans img\{opacity:1;transform:none\}\n", """/* L'ÉTUI À LUNETTES SUR LE COMPTOIR (à la place de la cloche) : un étui rigide en capsule, cuir bleu nuit,
   surpiqûres, fermoir argenté. Il frémit tant qu'on attend (le couvercle s'entrouvre) ; touché, le couvercle
   bascule vers l'arrière sur sa charnière : la monture ronde repose sur la doublure rose — et derrière, son film. */
.rideau{position:absolute;left:14%;right:14%;top:33%;height:auto;aspect-ratio:2.7;z-index:3;overflow:visible;padding:0;border:0;background:none;perspective:40em}
.rideau::before{content:"";position:absolute;left:5%;right:5%;bottom:-11%;height:26%;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.62),rgba(0,0,0,0))}
.rideau .dedans{position:absolute;inset:0;border-radius:999px;overflow:hidden;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23g)' opacity='.13'/%3E%3C/svg%3E"),
    linear-gradient(180deg,#2E448F 0%,#1B2C66 50%,#0E1840 100%);
  box-shadow:inset 0 -.55em .9em rgba(0,0,0,.5),inset 0 .12em .2em rgba(255,255,255,.14),0 .35em .7em rgba(0,0,0,.5)}
.rideau .dedans::after{content:"";position:absolute;inset:8% 3.4%;border-radius:999px;border:1.5px dashed rgba(246,232,214,.6);clip-path:inset(56% 0 0 0)}
.rideau .doublure{position:absolute;left:4.5%;right:4.5%;top:9%;bottom:15%;border-radius:999px;clip-path:inset(0 0 47% 0);transition:clip-path .45s .2s;
  background:radial-gradient(85% 130% at 50% 20%,#FF8AC6,#E0167A 58%,#7E0B43);box-shadow:inset 0 .5em .8em rgba(0,0,0,.5),inset 0 -.2em .4em rgba(255,255,255,.2)}
.rideau .etui-lun{position:absolute;left:13%;top:11%;width:74%;height:auto;opacity:0;transform:translateY(30%) scale(.86);
  transition:opacity .35s .35s,transform .75s .35s cubic-bezier(.2,1.5,.4,1);filter:drop-shadow(0 .18em .12em rgba(80,0,35,.6))}
.rideau .pan.g{position:absolute;left:-1.6%;right:-1.6%;top:-5%;height:61%;z-index:2;transform-origin:50% 0;
  border-radius:18% 18% 2.5% 2.5% / 82% 82% 12% 12%;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23g)' opacity='.13'/%3E%3C/svg%3E"),
    linear-gradient(180deg,#6A84DC 0%,#3A56B0 26%,#25397E 70%,#1B2C66 100%);
  box-shadow:inset 0 .32em .35em rgba(255,255,255,.3),inset 0 -.22em .25em rgba(0,0,0,.4),0 .22em .3em rgba(0,0,0,.5);
  transition:transform .85s cubic-bezier(.5,0,.2,1),box-shadow .12s .38s}
.rideau .pan.g::before{content:"";position:absolute;left:3%;right:3%;top:13%;height:125%;border-radius:999px;border:1.5px dashed rgba(246,232,214,.62);clip-path:inset(0 0 36% 0);transition:opacity .1s .38s}
.rideau .pan.g::after{content:"";position:absolute;left:50%;bottom:-.42em;width:2.3em;height:.95em;margin-left:-1.15em;border-radius:.38em;transition:opacity .1s .38s;
  background:linear-gradient(180deg,#FBFCFF,#C4CCE0 50%,#808AA8);box-shadow:inset 0 .1em 0 rgba(255,255,255,.9),0 .12em .22em rgba(0,0,0,.55)}
.rideau .pan.d,.rideau .tringle{display:none}
.rideau.doigt{animation:none}
.rideau.doigt .pan.g{animation:fremit 2.6s ease-in-out infinite}
@keyframes fremit{0%,68%,100%{transform:none}76%{transform:rotateX(-38deg)}84%{transform:rotateX(-9deg)}90%{transform:none}}
/* ouvert : le couvercle bascule (on voit sa doublure), la monture se pose */
.rideau.leve .pan.g{animation:none;transform:rotateX(-118deg);box-shadow:inset 0 0 0 999px #C8126B,0 0 0 rgba(0,0,0,0)}
.rideau.leve .pan.g::before,.rideau.leve .pan.g::after{opacity:0}
.rideau.leve .doublure{clip-path:inset(0)}
.rideau.leve .etui-lun{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.rideau .pan.g{transition:none}}
""")

# — le comptoir, les annonces —
Rp('alt="Dans l’appareil photo : à l’atelier, entre tes mains"', f'alt="Dans l’appareil photo : {PRISES[0][1]}"')
Rp('<span class="ap-txt"><b>atelierines</b> <span data-spe="🎬 Notre spécialiste bijoux est passé à l’atelier : collier saphir, chaîne dorée, fait main, pièce unique · 149 € 📍 Dax #atelierines" '
   'data-episode="🎬 Saison 2026 · Épisode 3 : De l’établi au cou : le collier saphir 💎 · 149 € 📍 Dax #atelierines">Aujourd’hui, c’est le collier saphir 💎 « Je l’ai fait à la main, ici, à l’atelier. » Pièce unique · 149 € 📍 Dax #atelierines</span>',
   f'<span class="ap-txt"><b>{PSEUDO}</b> <span data-spe="🎬 Notre spécialiste lunettes est passé à la boutique : monture ronde, cristal, légère, ajustée sur place · {PRIX} 📍 Dax #{PSEUDO}" '
   f'data-episode="🎬 Saison 2026 · Épisode 3 : De l’atelier au visage : la monture ronde 👓 · {PRIX} 📍 Dax #{PSEUDO}">Aujourd’hui, c’est la monture ronde, cristal 👓 « Si légère qu’on l’oublie sur le nez. » Ajustée sur place · {PRIX} 📍 Dax #{PSEUDO}</span>')
Rp('data-spe="La création du jour d’Inès 💎 Collier saphir, chaîne dorée · 149 €. Fait main, pièce unique : notre spécialiste bijoux vous le raconte sur ClikMe. Je vous le mets de côté par WhatsApp !" '
   'data-episode="La création du jour d’Inès 💎 Collier saphir, chaîne dorée · 149 €. De l’établi au cou : son épisode est sur ClikMe. Je vous le mets de côté par WhatsApp !">'
   'La création du jour d’Inès 💎 Collier saphir, chaîne dorée · 149 €. « Il se porte seul, tout près du cou… » Je vous le mets de côté par WhatsApp !</span>',
   f'data-spe="La monture du jour de Margaux 👓 {PLAT} · {PRIX}. Légère, ajustée sur place : notre spécialiste lunettes vous la raconte sur ClikMe. Je vous la mets de côté par WhatsApp !" '
   f'data-episode="La monture du jour de Margaux 👓 {PLAT} · {PRIX}. De l’atelier au visage : son épisode est sur ClikMe. Je vous la mets de côté par WhatsApp !">'
   f'La monture du jour de Margaux 👓 {PLAT} · {PRIX}. « Elle adoucit les visages carrés. » Je vous la mets de côté par WhatsApp !</span>')
Rp("★ 4,8 · Bijouterie, créatrice · Dax", "★ 4,8 · Opticien · Dax")
Rp('data-spe="La création du jour d’Inès. Fait main, pièce unique." data-episode="La création du jour d’Inès. De l’établi au cou, en vidéo.">La création du jour d’Inès. Une pierre bleu nuit, sur une chaîne dorée.</span>',
   'data-spe="La monture du jour de Margaux. Légère, ajustée sur place." data-episode="La monture du jour de Margaux. De l’atelier au visage, en vidéo.">La monture du jour de Margaux. Ronde, en cristal, si légère qu’on l’oublie.</span>')
Rp("<em>LA CRÉATION DU JOUR</em>", "<em>LA MONTURE DU JOUR</em>", None)
Rp("Découvrir la pièce", "Découvrir la monture", None)
Rp("pendant qu’elle crée", "pendant qu’elle travaille", None)
Rp("pendant que vous créez", "pendant que vous travaillez", None)
Rp("Je te filme pendant que tu crées", "Je te filme pendant que tu travailles")
Rp("à l’établi", "à l’atelier", None)
Rp("tes mains et ton établi", "tes mains et la monture")

# — le Direct —
Rp('<img class="di-photo" src="m2.jpg" alt="Le collier saphir de l’Atelier Inès">', '<img class="di-photo" src="m1.jpg" alt="La monture ronde cristal des Lunettes de Margaux">')
RX(r'data-spe="LE FILM DU SPÉCIALISTE · \d:\d\d" data-episode="SON ÉPISODE · \d:\d\d">SON INTERVIEW · \d:\d\d',
   f'data-spe="LE FILM DU SPÉCIALISTE · {mmss(d_spe)}" data-episode="SON ÉPISODE · {mmss(d_ep)}">SON INTERVIEW · {mmss(d_msg)}')
Rp("<p>Fait main, par Inès</p>", "<p>Ajustée sur place, par Margaux</p>")
Rp(BIJOU, LUNETTES, 3)
Rp('<img class="on" src="m2.jpg" alt=""><img src="m1.jpg" alt=""><img src="m3.jpg" alt=""><img src="m4.jpg" alt="">',
   '<img class="on" src="m1.jpg" alt=""><img src="m2.jpg" alt=""><img src="m3.jpg" alt=""><img src="m4.jpg" alt="">', None)
Rp("L’ATELIER<svg", "LA BOUTIQUE<svg", None)

# — la découverte : l'étui —
Rp('alt="L’Atelier Inès, un écrin fermé sur le comptoir"', 'alt="Les Lunettes de Margaux, un étui fermé sur le comptoir"')
# dans l'étui : la doublure, et la monture ronde en cristal, pliée (dessinée)
ETUI_LUN = ('<svg class="etui-lun" viewBox="0 0 120 46" aria-hidden="true" fill="none" stroke-linecap="round">'
            '<path d="M19 19 Q42 30 74 37M101 19 Q78 30 46 38" stroke="rgba(200,220,245,.75)" stroke-width="2.6"/>'
            '<g stroke="rgba(150,175,210,.85)" stroke-width="5.2"><circle cx="34" cy="21" r="15"/><circle cx="86" cy="21" r="15"/><path d="M49 19q11-7 22 0"/></g>'
            '<g stroke="#F6FAFF" stroke-width="2.4"><circle cx="34" cy="21" r="15" fill="rgba(255,255,255,.16)"/><circle cx="86" cy="21" r="15" fill="rgba(255,255,255,.16)"/><path d="M49 19q11-7 22 0"/></g>'
            '<path d="M25 13a12 12 0 0 1 9-4M77 13a12 12 0 0 1 9-4" stroke="#fff" stroke-width="2.2" opacity=".9"/></svg>')
Rp('aria-label="Ouvrir l’écrin"><span class="dedans"><img src="m2.jpg" alt="">', 'aria-label="Ouvrir l’étui"><span class="dedans"><span class="doublure"></span>' + ETUI_LUN)
Rp("Qu’est-ce qu’Inès t’a créé aujourd’hui", "Qu’est-ce que Margaux t’a choisi aujourd’hui")
Rp("Touche l’écrin", "Touche l’étui")
Rp("Ouvrir l’écrin ↑", "Ouvrir l’étui ↑")
Rp("Ce collier, il vous tente ?", "Cette monture, elle vous tente ?", 2)
Rp("Votre avis sur cette pièce", "Votre avis sur cette monture")
Rp("Les autres pièces de l’atelier", "Les autres montures de la boutique")
Rp("<h4>Me le mettre de côté</h4>", "<h4>Me la mettre de côté</h4>")
if "Me le mettre de côté" in t:
    Rp("Me le mettre de côté", "Me la mettre de côté", None)
Rp("À l’<b>Atelier Inès</b>, par WhatsApp. Inès vous le garde et vous répond.", "Aux <b>Lunettes de Margaux</b>, par WhatsApp. Margaux vous la garde et vous répond.")
Rp('<p class="dt-l">C’est pour ?</p>', '<p class="dt-l">Votre ordonnance ?</p>')
Rp("Quand passez-vous le voir ?", "Quand passez-vous l’essayer ?")
Rp("<li>Le nom de la pièce</li>", "<li>Le nom de la monture</li>")
Rp("Votre mise en scène : l’écrin, votre atelier, votre fantôme à votre nom", "Votre mise en scène : l’étui, votre boutique, votre fantôme à votre nom")
Rp('alt="Le fantôme de l’atelier"', 'alt="Le fantôme de la boutique"', None)

# — ses voix de métier : leurs instants, leurs textes —
m = re.search(r"const TEMPS = (\{.*?\});\n", t)
T = json.loads(m.group(1))
T2 = {}
for k, v in T.items():
    if k in ("lou-clients-2", "lou-clients-3", "bijouterie-clients-4"):   # remplacées par les phrases sur Dax
        continue
    T2[RENOMMEES.get(k, k)] = TEMPS_NEUFS.get(RENOMMEES.get(k, k), v)
for k, v in TEMPS_NEUFS.items():
    T2.setdefault(k, v)
t = t.replace(m.group(0), "const TEMPS = " + json.dumps(T2, ensure_ascii=False, separators=(",", ":")) + ";\n")
for vieux, neuf in RENOMMEES.items():
    Rp(f'"{vieux}"', f'"{neuf}"', None)
Rp('"Aujourd’hui, on braque les projecteurs sur *ta" + INS + "pièce" + NB + "!"', '"Aujourd’hui, on braque les projecteurs sur *ta" + INS + "monture" + NB + "!"')
# sous le projecteur : les quatre phrases sur Dax, chacune son icône (le monde, une cible, les réseaux, l'œil du Direct)
# quatre longues phrases sous un titre de deux lignes : la bulle s'élargit et son texte se resserre, pour tenir
# entière entre le haut de l'écran et le fantôme
Rp(".fx-bulle{position:absolute;left:1.05em;right:1.05em;bottom:calc(100% - 20.2em);", ".fx-bulle{position:absolute;left:.5em;right:.5em;bottom:calc(100% - 20.2em);")
Rp(".fx-dit{margin:0;font-size:1.15em;", ".fx-dit{margin:0;font-size:1.05em;")
Rp(".fx-plan li{display:grid;grid-template-columns:2.1em minmax(0,1fr);gap:.6em;", ".fx-plan li{display:grid;grid-template-columns:1.8em minmax(0,1fr);gap:.5em;")
Rp(".fx-ligne{font-size:.82em;font-weight:600;line-height:1.3;color:#4A3426}", ".fx-ligne{font-size:.75em;font-weight:600;line-height:1.24;color:#4A3426}")
Rp(".fx-ico{width:2.1em;height:2.1em;", ".fx-ico{width:1.8em;height:1.8em;")
CIBLE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2"/></svg>'
OEIL = '<svg viewBox="0 0 24 24"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></svg>'
js_txt = lambda s: json.dumps(s, ensure_ascii=False).replace(INS, '" + INS + "')
Rp('''        { ico: '<span class="fx-ico rose">' + ICONES.reseaux + "</span>", txt: "Je la diffuse sur tous tes réseaux en même temps.", voix: "lou-clients-2" },
        { ico: '<span class="fx-ico ambre">' + ICONES.heure + "</span>", txt: "Je la relaie à 11" + INS + "h sur ClikMe…", voix: "lou-clients-3" },
        { ico: '<span class="fx-ico rose">' + ICONES.monde + "</span>", txt: "…devant plus de 1" + INS + "000 personnes qui cherchent une idée de cadeau.", voix: "bijouterie-clients-4" },
''', f'''        {{ ico: '<span class="fx-ico rose">' + ICONES.monde + "</span>", txt: {js_txt(DAX[0])}, voix: "lunettes-dax-1" }},
        {{ ico: '<span class="fx-ico ambre">{CIBLE}</span>', txt: {js_txt(DAX[1])}, voix: "lunettes-dax-2" }},
        {{ ico: '<span class="fx-ico rose">' + ICONES.reseaux + "</span>", txt: {js_txt(DAX[2])}, voix: "lunettes-dax-3" }},
        {{ ico: '<span class="fx-ico ambre">{OEIL}</span>', txt: {js_txt(DAX[3])}, voix: "lunettes-dax-4" }},
''')
Rp('"lou-clients-2", "lou-clients-3", "bijouterie-clients-4", ', '"lunettes-dax-1", "lunettes-dax-2", "lunettes-dax-3", "lunettes-dax-4", ')
Rp('question: "quel est le nom de ta pièce du jour" + NB + "?"', 'question: "quel est le nom de ta monture du jour" + NB + "?"')
Rp("« ta pièce ! »", "« ta monture ! »")

# — le comptoir : son produit, ses mots, ses photos, la mise de côté —
Rp('const PLAT = "Collier saphir, chaîne dorée", PRIX = "149 €";', f'const PLAT = "{PLAT}", PRIX = "{PRIX}";')
RX(r"  const PAROLES = \[\n.*?\n  \];\n", "  const PAROLES = [\n" + "".join(f"    [{a}, {json.dumps(p, ensure_ascii=False)}],\n" for a, p in paroles) + "  ];\n")
RX(r"  const PRISES = \[\n.*?\n  \];\n", "  const PRISES = [\n" + "".join(f'    ["{f}", "{c}"],\n' for f, c in PRISES) + "  ];\n")
Rp("/* La mise de côté : pour elle ou à offrir, et quand elle passe. */", "/* La mise de côté : juste l'essayer ou avec son ordonnance, et quand elle passe. */")
Rp('const POUR = ["Pour moi", "À offrir"];', 'const POUR = ["Juste l’essayer", "Avec mon ordonnance"];')
Rp('"Bonjour Inès,", "Pourriez-vous me mettre de côté « " + PLAT + " » (" + PRIX + ")" + (choix.pour ? ", à offrir ?" : " ?"), "Je passe le voir "',
   '"Bonjour Margaux,", "Pourriez-vous me mettre de côté « " + PLAT + " » (" + PRIX + ") ?" + (choix.pour ? " J’apporte mon ordonnance." : ""), "Je passe l’essayer "')
Rp('"Avec plaisir Camille ! Je vous le garde, dans son écrin" + (choix.pour ? ", emballé pour offrir" : "")',
   '"Avec plaisir Camille ! Je vous la garde" + (choix.pour ? ", et on regardera vos verres ensemble" : "")')

# — les trois façons, l'interview, l'épisode, notre spécialiste —
Rp('question: "Comment on raconte ta pièce ?"', 'question: "Comment on raconte ta monture ?"')
Rp("Deux : comment raconter la pièce ?", "Deux : comment raconter la monture ?")
# son interview a deux questions, comme son film (« Face au fantôme », épisode 14)
Rp("Trois questions sur ta pièce,", "Deux questions sur ta monture,")
Rp('"<b>Question 1 sur 3</b> · "', '"<b>Question 1 sur 2</b> · "')
Rp("notre spécialiste bijoux raconte ta pièce à ta place.", "notre spécialiste lunettes raconte ta monture à ta place.")
Rp('"Le nom de la pièce", "Une façon de la raconter', '"Le nom de la monture", "Une façon de la raconter')
Rp('questions: ["Ta création du jour : alors, c’est quoi ?", "Ton geste : comment tu l’as faite ?", "Ta pièce en 3 mots : pas un de plus."]',
   'questions: ["Ta monture du moment : alors, c’est quoi ?", "À quel visage : elle va le mieux ?"]')
Rp("Quatre : elle façonne, sertit, polit. Le téléphone filme et garde les meilleurs moments : ici, 58 minutes en accéléré.",
   "Quatre : elle conseille, ajuste, nettoie les verres. Le téléphone filme et garde les meilleurs moments : ici, 46 minutes en accéléré.")
Rp('sessionFin: "La pièce est finie : touchez « J’ai terminé ».",\n    secondes: 3480,', 'sessionFin: "La monture est prête : touchez « J’ai terminé ».",\n    secondes: 2760,')
Rp('images: ["m1.jpg", "m4.jpg"],', 'images: ["geste.jpg", "m1.jpg"],')
Rp("l’accéléré, le collier qui se révèle.", "l’accéléré, la monture qui se révèle.")
Rp(f'duree: "0:56",', f'duree: "{mmss(d_ep)}",')
Rp("Et le voilà : votre collier, en plein écran", "Et la voilà : votre monture, en plein écran", 3)
Rp("Dans l’écrin : son épisode. Les meilleurs moments de l’atelier, montés tout seuls.", "Dans l’étui : son épisode. Les meilleurs moments de la boutique, montés tout seuls.")
Rp("et une cliente qui passe le voir", "et une cliente qui passe l’essayer", None)
Rp('cases: ["Fait main", "Pièce unique", "Or 18 carats", "Paquet cadeau", "Gravure possible", "Nouveau"],', "cases: " + json.dumps(CASES, ensure_ascii=False) + ",")
RX(r'recit: "Je pousse la porte de l’Atelier Inès\.[^"]*",', "recit: " + json.dumps(RECIT, ensure_ascii=False) + ",")
Rp('duree: "0:28",', f'duree: "{mmss(d_spe)}",')
RX(r"On écoute \d+ secondes ici : ses réponses en durent \d+\.", f"Sa réponse dure {round(D_VOCAL)} secondes.")
Rp('$("#minuteur").textContent = "0:20 ✓";', f'$("#minuteur").textContent = "{mmss(D_VOCAL)} ✓";')
# on l'écoute jusqu'au bout (sa réponse est plus courte que les 14 s des autres tours)
Rp("plus(arretEnregistrement, 14300);", f"plus(arretEnregistrement, {round(D_VOCAL * 1000) + 700});")

# — le Direct : les offres du jour de la ville (pas de concurrents à côté de sa monture) —
RX(r"  const AUTRES = \[\n.*?\n  \];\n", """  const AUTRES = [
    { nom: "Au Jardin d’Élise", note: "★ 4,7 (96 avis)", ou: "📍 200 m · Dax", plat: "Bouquet de saison", sous: "Fleurs du marché, composé devant vous", prix: "35 €", photo: "o-fleurs.jpg", aime: 87 },
    { nom: "L’Atelier de Yann", note: "★ 4,6 (212 avis)", ou: "📍 350 m · Dax", plat: "Coupe et brushing", sous: "Sans rendez-vous le matin", prix: "45 €", photo: "o-coiffure.jpg", aime: 102 },
    { nom: "Chez Bergine", note: "★ 4,5 (41 avis)", ou: "📍 400 m · Dax", plat: "Magret grillé, pommes sarladaises", sous: "Le plat du jour", prix: "19 €", photo: "o-diner.jpg", aime: 64 },
  ];
""")

# — les moments du comptoir et de la cliente —
Rp("Côté atelier, son fantôme lui dit d’abord ce qu’il va faire pour elle. Puis 4 gestes. Un : le nom de la pièce.",
   "Côté boutique, son fantôme lui dit d’abord ce qu’il va faire pour elle. Puis 4 gestes. Un : le nom de la monture.")
Rp("Trois : quatre photos, pour montrer la pièce.", "Trois : quatre photos, pour montrer la monture.")
Rp('guide("Montre-moi ta pièce en 4 photos !"', 'guide("Montre-moi ta monture en 4 photos !"')
Rp("Quatre : notre spécialiste bijoux raconte la pièce à sa place.", "Quatre : notre spécialiste lunettes raconte la monture à sa place.")
Rp('guide("Notre spécialiste bijoux raconte ta pièce"', 'guide("Notre spécialiste lunettes raconte ta monture"')
Rp("on fait défiler les créations du jour de la ville", "on fait défiler les offres du jour de la ville")
Rp("À elle de jouer : touchez l’écrin !", "À elle de jouer : touchez l’étui !")
Rp("Dans l’écrin : le film de notre spécialiste bijoux. Il raconte votre pièce ;", "Dans l’étui : le film de notre spécialiste lunettes. Il raconte votre monture ;")
Rp("Dans l’écrin : votre interview.", "Dans l’étui : votre interview.")
Rp("elle demande à Inès de le lui mettre de côté.", "elle demande à Margaux de la lui mettre de côté.")
Rp("Elle dit si c’est pour offrir, et quand elle passe.", "Elle dit si elle a son ordonnance, et quand elle passe.")
Rp("Vous le lui gardez d’un message, et Camille passe le voir.", "Vous la lui gardez d’un message, et Camille passe l’essayer.")
Rp("d’à côté, passe à l’atelier.", "d’à côté, passe à la boutique.")
Rp('$("#e2-avis-q").textContent = sens > 0 ? "J’adore ! Inès le saura."', '$("#e2-avis-q").textContent = sens > 0 ? "J’adore ! Margaux le saura."')

# — « Moins de dépenses » : un opticien ne s'offre pas des lunettes chez son voisin ; Maison Lou le remplace —
Rp('{ commerce: "Optique du Centre", prenom: "Paul", metier: "Opticien", ou: "600 m", titre: "Un bon sur une monture", prix: 50, photo: "o-lunettes.jpg", visage: "v-lunettes.webp", par: 4, entier: true, paiement: "credits" },',
   '{ commerce: "Maison Lou", prenom: "Lou", metier: "Boutique de vêtements", ou: "600 m", titre: "Un bon sur une tenue", prix: 50, photo: "o-mode.jpg", visage: "v-mode.webp", par: 4, entier: true, paiement: "credits" },')

# — enfin, son nom et son commerce partout ailleurs —
if "La création du jour d’Inès" in t:
    Rp("La création du jour d’Inès", "La monture du jour de Margaux", None)
Rp("spécialiste bijoux", "spécialiste lunettes", None)
Rp("de l’Atelier Inès", "des Lunettes de Margaux", None)
Rp("à l’Atelier Inès", "aux Lunettes de Margaux", None)
Rp("L’Atelier Inès", "Les Lunettes de Margaux", None)
if "avec l’Atelier Inès" in t:
    Rp("avec l’Atelier Inès", "avec Les Lunettes de Margaux")
Rp("Atelier Inès", NOM, None)
Rp("d’Inès", "de Margaux", None)
if "qu’Inès" in t:
    Rp("qu’Inès", "que Margaux", None)
Rp("Inès", PRENOM, None)
Rp("atelierines", PSEUDO, None)
if "Collier saphir, chaîne dorée" in t:
    Rp("Collier saphir, chaîne dorée", PLAT, None)
if "149 €" in t:
    Rp("149 €", PRIX, None)

# ce qui ne doit plus rester de la bijouterie
reste = sorted(set(re.findall(r"[^\n]{0,40}(?:Inès|[Cc]ollier|saphir|[Bb]ijou|écrin|Écrin|établi|sertit|Opale|Sacha|créatrice|Bracelet)[^\n]{0,40}", t)))
reste += [x for x in ("l’Les", "d’Les", "à Les", "de Les") if x in t]
if reste:
    raise SystemExit("reste de la bijouterie :\n" + "\n".join(reste[:30]))
open(f"{D}/index.avant-episode2.html", "w", encoding="utf-8").write(t)
print("tour-lunettes · page de base écrite,", len(t), "caractères · films", mmss(d_msg), mmss(d_spe), mmss(d_ep))
