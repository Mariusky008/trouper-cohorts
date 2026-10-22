# LE SIXIÈME TOUR : « Les Lunettes de Margaux », un lunetier. Le commerce est fictif, comme ceux des autres
# démos ; le jour J, le présentateur tape le nom du vrai magasin dans « Pour qui est cette démo ? ».
# Tiré du tour de la bijouterie, le plus proche (une pièce à voir, mise de côté sur WhatsApp, un atelier) :
# ses mots, ses images et ses voix de métier sont remplacés.
#  · les photos : recu/lunettes/photos (fournies par le propriétaire), recadrées au format des tours ;
#  · le fantôme opticien : celui de l'application (public/direct/double/pied/lunettes) ;
#  · les voix du fantôme : recu/lunettes/voix (enregistrements ElevenLabs « Mike »), mesurées mot à mot ;
#  · Margaux n'a pas de voix enregistrée : ses mots s'écrivent au rythme estimé (voix.mp3 muet) ;
#  · les films (message, spécialiste, épisode) sont montés à part par le moteur de l'application et rangés
#    dans tour-lunettes/ (voir LISEZ-MOI) : ce script lit leur durée.
# À lancer avant la chaîne des sept scripts :  python3 -I tour-lunettes.py <dossier>
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
PAROLES = ["Aujourd’hui, c’est la monture ronde, en cristal.", "Si légère qu’on l’oublie sur le nez.", "Elle adoucit les visages carrés.",
           "Je l’ajuste devant vous, en cinq minutes.", "Elle va à presque tout le monde.", "Et elle s’essaie sur ClikMe, avant de passer.",
           "Passez l’essayer, je vous la garde !"]
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
for f in ("lou-clients-2.mp3", "lou-clients-3.mp3"):           # « je la diffuse », « je la relaie » : les mêmes pour tous
    shutil.copy2(f"{B}/{f}", f"{D}/{f}")
for f in ("o-mode.jpg", "v-mode.webp"):                          # Maison Lou remplace l'opticien voisin
    shutil.copy2(f"{S}/tour-coiffure/{f}", f"{D}/{f}")

# ═══ 3. SES VOIX DE MÉTIER, MESURÉES MOT À MOT (comme celles de la bijouterie) ═══
# nom : (titre, sous-titre, mots dits avant ceux qui s'affichent, écrit comme l'entend la mesure)
COCHE = "Coche ce qui est vrai : il ne dira rien d’autre."
VOIX = {
    "lunettes-clients-1": ("Aujourd’hui, on braque les projecteurs sur ta" + INS + "monture !", None, "", None),
    "lunettes-clients-4": ("…devant plus de 1" + INS + "000 personnes qui cherchent de nouvelles lunettes.", None, "", "…devant plus de mille personnes qui cherchent de nouvelles lunettes."),
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
RENOMMEES = {"lou-clients-1": "lunettes-clients-1", "bijouterie-clients-4": "lunettes-clients-4", "lou-clients-5": "lunettes-clients-5",
             "lou-clients-photos": "lunettes-clients-photos", "lou-clients-comment": "lunettes-clients-comment", "bijouterie-clients-qui": "lunettes-clients-qui",
             "bijouterie-clients-specialiste": "lunettes-clients-specialiste", "bijouterie-episode-cadre": "lunettes-episode-cadre",
             "bijouterie-episode-session": "lunettes-episode-session"}

# ═══ 4. SES MOTS À ELLE, AU RYTHME ESTIMÉ (pas de voix enregistrée), ET SON VOCAL MUET ═══
def syllabes(mot):
    n = 0
    for m in mot.split(INS):
        if not re.search(r"[a-zA-Zà-ÿœæ]", m):
            ch = re.sub(r"\D", "", m)
            n += (len(ch) if ch else (2 if "€" in m else 0))
            continue
        m = re.sub(r"[^a-zàâäéèêëîïôöùûüÿœæ]", "", m.lower().replace("’", "").replace("qu", "k"))
        k = len(re.findall(r"[aeiouyàâäéèêëîïôöùûüÿœæ]+", m))
        k += len(re.findall(r"(ouer|ier|ié|éa|éo)", m))
        if k > 1 and re.search(r"(e|es|ent)$", m) and not m.endswith(("ée", "ées")):
            k -= 1
        n += max(1, k) if m else 0
    return max(1, n)


def rythme(texte):
    t = 0.08
    for w in texte.split(" "):
        t += 0.19 * syllabes(w)
        t += 0.42 if w.endswith(("…", ".", "!", "?")) else 0.28 if w.endswith((":", ";")) else 0.22 if w.endswith(",") else 0.03
    return round(t + 0.12, 3)


paroles, debut = [], 0.0
for p in PAROLES:
    paroles.append((round(debut, 2), p))
    debut += rythme(p) + 0.25
D_VOCAL = debut
ff("-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", f"{D_VOCAL:.2f}", "-c:a", "libmp3lame", "-b:a", "32k", f"{D}/voix.mp3")
print(f"son vocal (muet) : {D_VOCAL:.2f} s · l'extrait du livre : {paroles[1][0]} → {paroles[2][0]}")

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
RX(r"/\* L'ÉCRIN SUR LE COMPTOIR.*?\.rideau\.leve \.dedans img\{opacity:1;transform:none\}\n", """/* L'ÉTUI SUR LE COMPTOIR : à la place de la cloche. Il frémit tant qu'on attend ; touché, son
   couvercle se lève et la monture apparaît — et derrière, son film. */
.rideau{position:absolute;left:16%;right:16%;top:35%;height:30%;z-index:3;overflow:visible}
.rideau .dedans{position:absolute;left:0;right:0;top:26%;bottom:0;overflow:hidden;border-radius:.8em .8em 1.6em 1.6em;border:.35em solid #1B2A5E;background:#0C1230;box-shadow:0 .9em 1.6em rgba(0,0,0,.6)}
.rideau .dedans img{width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.08);transition:opacity .6s .35s,transform 1.2s cubic-bezier(.3,0,.2,1)}
.rideau .pan.g{position:absolute;left:-.25em;right:-.25em;top:26%;bottom:-.1em;z-index:2;border-radius:1em 1em 1.8em 1.8em;transform-origin:50% 0;
  background:linear-gradient(180deg,#4561C2,#253C8A 55%,#152452);box-shadow:inset 0 .25em .3em rgba(255,255,255,.25),inset 0 -.4em .6em rgba(0,0,0,.4),0 .7em 1.3em rgba(0,0,0,.5);
  transition:transform 1s cubic-bezier(.6,0,.25,1)}
.rideau .pan.g::after{content:"";position:absolute;left:50%;top:6%;width:1.6em;height:.5em;margin-left:-.8em;border-radius:.25em;background:linear-gradient(#F4F6FB,#9AA6C4)}
.rideau .pan.d,.rideau .tringle{display:none}
.rideau.doigt{animation:none}
.rideau.doigt .pan.g{animation:fremit 2.6s ease-in-out infinite}
@keyframes fremit{0%,70%,100%{transform:none}78%{transform:translateY(-.3em) rotate(-1.5deg)}86%{transform:none}}
.rideau.leve .pan.g{animation:none;transform:translateY(-46%) scaleY(.42)}
.rideau.leve .dedans img{opacity:1;transform:none}
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
Rp('aria-label="Ouvrir l’écrin"><span class="dedans"><img src="m2.jpg" alt="">', 'aria-label="Ouvrir l’étui"><span class="dedans"><img src="m4.jpg" alt="">')
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
    T2[RENOMMEES.get(k, k)] = TEMPS_NEUFS.get(RENOMMEES.get(k, k), v)
t = t.replace(m.group(0), "const TEMPS = " + json.dumps(T2, ensure_ascii=False, separators=(",", ":")) + ";\n")
for vieux, neuf in RENOMMEES.items():
    Rp(f'"{vieux}"', f'"{neuf}"', None)
Rp('"Aujourd’hui, on braque les projecteurs sur *ta" + INS + "pièce" + NB + "!"', '"Aujourd’hui, on braque les projecteurs sur *ta" + INS + "monture" + NB + "!"')
Rp("qui cherchent une idée de cadeau.", "qui cherchent de nouvelles lunettes.")
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
Rp("Trois questions sur ta pièce,", "Trois questions sur ta monture,")
Rp("notre spécialiste bijoux raconte ta pièce à ta place.", "notre spécialiste lunettes raconte ta monture à ta place.")
Rp('"Le nom de la pièce", "Une façon de la raconter', '"Le nom de la monture", "Une façon de la raconter')
Rp('questions: ["Ta création du jour : alors, c’est quoi ?", "Ton geste : comment tu l’as faite ?", "Ta pièce en 3 mots : pas un de plus."]',
   'questions: ["Ta monture du jour : alors, c’est laquelle ?", "Ton geste : comment tu l’ajustes ?", "Ta monture en 3 mots : pas un de plus."]')
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
RX(r"On écoute \d+ secondes ici : ses réponses en durent \d+\.", f"On écoute {min(14, int(D_VOCAL) - 3)} secondes ici : ses réponses en durent {round(D_VOCAL)}.")
Rp('$("#minuteur").textContent = "0:20 ✓";', f'$("#minuteur").textContent = "{mmss(D_VOCAL)} ✓";')

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
