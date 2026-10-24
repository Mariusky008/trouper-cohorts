# LES TROIS FANTÔMES, DANS LE TOUR (restaurant, vêtements, coiffure). Deux étapes de plus dans « Plus de
# clients », reprises du prototype outils/trois-fantomes :
#   1. « Les trois fantômes » (côté client, à la fin de sa vidéo, à la place des trois petits fantômes
#      d'avis) : trois cages ; il en touche une, son fantôme s'envole dans la vitrine du commerce ; s'il
#      promet, son prénom s'écrit au carnet : le commerçant pourra le relancer un jour calme (pas de cadeau
#      promis : c'est le commerçant qui choisit d'en offrir un). « Ça me tente » mène à la demande.
#   2. « Mike, votre assistant » (côté commerçant, après WhatsApp) : une conversation. Mike ne dit que ce
#      que ClikMe sait (« 11 personnes ont promis de venir… aucune n'est encore passée ») et propose : « Si
#      c'est calme aujourd'hui, je peux les prévenir pour vous. On le fait ? ». Le commerçant répond d'un
#      appui (« Oui, préviens-les »), Mike lui montre le message avant qu'il parte (« Envoyer aux 11
#      personnes »), les réponses arrivent, un bon est scanné : « Un j'aime s'oublie. Une promesse, vous
#      l'encaissez le jour où vous en avez besoin. » Et sa suggestion suivante : la prochaine vidéo, à
#      planifier. Seul Mike parle ; le commerçant répond par des bulles et des appuis.
# Puis le ticket de « Plus de clients », avec une ligne de plus : le jour calme rempli.
# Les voix (enregistrements ElevenLabs « Mike ») : recu/trois/. Communes : trois-1, trois-4, mike-question,
# mike-message, mike-scan, mike-promesse, mike-video ; par métier : mike-bonjour-<métier> (« Bonjour
# Jean-Marie… ») et trois-2-<métier> (« J'adore, je viendrai… ») suivi de « Touchez une cage. » (la fin de
# trois-2-restaurant). Plus servies : trois-3, vitrine-1 à 6, creux-1-<métier>, creux-2, creux-3,
# mike-appeler (les versions précédentes).
# Les images : les fantômes des habitants (outils/trois-fantomes/a/g → <tour>/tf/), l'intérieur du commerce
# (tf-interieur.webp) et son fantôme qui salue (tf-hote.webp).
# À lancer après tour-dax.py (même index.html) :  python3 -I tour-trois.py <dossier>
import json, os, re, shutil, subprocess, sys

S = sys.argv[1]
sys.path.insert(0, f"{S}/outils")
from alignement import aligner  # noqa: E402

FF = f"{S}/ffmpeg"
R = f"{S}/recu/trois"
P = os.path.normpath(f"{S}/../trois-fantomes/a")
NB, INS = " ", " "
LOOKS = ["denim", "fleuri", "rebelle", "soleil", "curieux", "voyageur", "artiste", "cosy"]  # le dernier : Camille
POSES = ["debout", "salue", "assis"]
# « Touchez une cage. », pris à la fin de trois-2-restaurant (après son silence, à 3,16 s)
TOUCHEZ_DE = 3.45

COMMUNES = {
    "trois-1": "À la fin de votre vidéo, votre client ne met pas juste un «" + NB + "j’aime" + NB + "»" + NB + ": il choisit un des *trois *fantômes.",
    # « on ne peut pas obliger le commerçant à faire un cadeau » : ce qu'il y gagne, lui, c'est de pouvoir les relancer
    "trois-4": "Et s’il promet de venir, son prénom s’écrit dans votre *carnet. Le jour où c’est calme, vous pourrez le *relancer d’un geste.",
    # Mike pose la question (le commerçant répond d'un appui), puis montre le message avant qu'il parte
    "mike-question": "Si c’est calme aujourd’hui, je peux les *prévenir pour vous. On le fait" + NB + "?",
    "mike-message": "Voici le *message. Il ne part qu’à eux, jamais à toute la ville. Touchez «" + NB + "Envoyer" + NB + "».",
    "mike-scan": "Quand leur bon est scanné au comptoir, vous savez qu’ils sont venus *grâce à votre vidéo.",
    "mike-promesse": "Un «" + NB + "j’aime" + NB + "» s’oublie. Une *promesse, vous *l’encaissez le jour où vous en avez besoin.",
    "mike-video": "Et votre prochaine vidéo n’est pas encore *prévue. On la cale *jeudi" + NB + "?",
}
# « 11 personnes » s'écrit en chiffres, mais se mesure comme il se dit
EN_LETTRES = {"9": "neuf", "10": "dix", "11": "onze"}


def bonjour(M):
    """Sa première réplique : ce que ClikMe sait (ceux qui ont promis, le carnet de son tour)."""
    return f"Bonjour {M['qui']}. {M['compte'][1]}{INS}personnes ont *promis de venir après votre vidéo. *Aucune n’est encore passée."

# Ce qui change d'un métier à l'autre. Les commerces sont ceux des démos (fictifs) ; chiffres et cadeaux inventés,
# sans le mot « exemple » à l'écran (jamais, nulle part).
METIERS = {
    "tour": dict(
        metier="restaurant", lieu="Chez Bergine", sous="BISTROT · DAX", chez="chez Bergine", carte="Magret · Garbure · Axoa", qui="Jean-Marie",
        trois2="J’adore, je viendrai, ou j’y vais aujourd’hui. Touchez une cage.",
        cages=[["adore", "💗 J’adore", "« J’ai aimé ta vidéo »"], ["promis", "📌 Je viendrai", "« Promis, je passe un jour »"], ["table", "🍽️ J’y vais", "« Garde-moi une place »"]],
        pose3="assis", heures=["12 h 30", "13 h", "12 h 15"], compte=[36, 11, 2],
        bon="Le café offert", tente="Ça me tente →",
        appel="Il me reste des tables ce midi ! Votre café vous attend.",
        creux=dict(calme="Oui, c’est calme ce midi" + NB + ": préviens\u2011les" + NB + "!", quand="Ce midi",
                   reponses=[["Léa", "On arrive à deux, 12 h 30 !"], ["Malik", "Une table pour quatre, 12 h 15"], ["Chloé", "Je passe à 13 h"], ["Martin", "À deux, vers 12 h 45"]],
                   bilan=["+4 tables ce midi", "9 couverts"], ticket="+4 tables un midi calme"),
        couleurs=dict(f1="#62182B", f2="#45101F", s1="#F3E5D0", s2="#8E1C33", ens="#2C0912", vit="#2A0810"),
        interieur=("copie", f"{P}/interieur.webp"), hote=f"{P}/bergine-salue.webp",
    ),
    "tour-vetements": dict(
        metier="vetements", lieu="Maison Lou", sous="BOUTIQUE · DAX", chez="chez Maison Lou", carte="Manteaux · Mailles · Jeans", qui="Lou",
        trois2="J’adore, je viendrai l’essayer, ou mettez-la-moi de côté. Touchez une cage.",
        cages=[["adore", "💗 J’adore", "« J’ai aimé ta vidéo »"], ["promis", "📌 Je viendrai", "« Promis, je viens l’essayer »"], ["table", "🛍️ De côté", "« Mettez-la-moi de côté »"]],
        pose3="debout", heures=["de côté", "de côté", "de côté"], compte=[31, 9, 3],
        bon="Les retouches offertes", tente="Ça me tente →",
        appel="Le manteau camel vous attend aujourd’hui ! Vos retouches sont offertes.",
        creux=dict(calme="Oui, c’est calme aujourd’hui" + NB + ": préviens\u2011les" + NB + "!", quand="Aujourd’hui",
                   reponses=[["Inès", "Je passe l’essayer à 14 h"], ["Chloé", "Gardez-moi le 38, j’arrive !"], ["Sarah", "À 17 h, avec ma sœur"], ["Emma", "16 h pour moi"]],
                   bilan=["+4 clientes aujourd’hui", "dont 2 pour le manteau camel"], ticket="+4 clientes un jour calme"),
        couleurs=dict(f1="#4A3A2E", f2="#2F241C", s1="#F1E6D6", s2="#2A211B", ens="#1E1712", vit="#1E1712"),
        interieur=("e1", "e1.webp"), hote="fant-viens.webp",
    ),
    "tour-coiffure": dict(
        metier="coiffure", lieu="Salon Clara", sous="COIFFURE · DAX", chez="au Salon Clara", carte="Coupe · Couleur · Soin", qui="Clara",
        trois2="J’adore, je prendrai rendez-vous, ou un créneau aujourd’hui. Touchez une cage.",
        cages=[["adore", "💗 J’adore", "« J’ai aimé ta vidéo »"], ["promis", "📅 Je prendrai RDV", "« Promis, je prends rendez-vous »"], ["table", "✂️ Aujourd’hui", "« Un créneau aujourd’hui »"]],
        pose3="assis", heures=["15 h 30", "17 h", "11 h"], compte=[28, 10, 3],
        bon="Le soin offert", tente="Ça me tente →",
        appel="Il me reste des créneaux aujourd’hui ! Votre soin vous attend.",
        creux=dict(calme="Oui, c’est calme aujourd’hui" + NB + ": préviens\u2011les" + NB + "!", quand="Aujourd’hui",
                   reponses=[["Sarah", "Je prends 14 h !"], ["Léa", "16 h 30, pour une coupe"], ["Zoé", "15 h, une couleur"], ["Emma", "17 h, si c’est bon"]],
                   bilan=["+4 rendez-vous aujourd’hui", "14" + INS + "h · 15" + INS + "h · 16" + INS + "h" + INS + "30 · 17" + INS + "h"], ticket="+4 rendez-vous un jour calme"),
        couleurs=dict(f1="#3B1631", f2="#250D1F", s1="#F7E3EC", s2="#B01E6A", ens="#1C0A17", vit="#1C0A17"),
        interieur=("e1", "e1.webp"), hote="fant-viens.webp",
    ),
}

def une_fois(t, avant, apres, quoi):
    if t.count(avant) != 1:
        raise SystemExit(f"{quoi} : {t.count(avant)} fois")
    return t.replace(avant, apres)


def ffmpeg(*args):
    subprocess.run([FF, "-y", "-loglevel", "error", *args], check=True)


NETTOYER = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,afade=t=in:d=0.02"


def mesurer(dst, texte):
    t = aligner(FF, dst, " ".join(re.sub(r"^\d+", lambda n: EN_LETTRES.get(n.group(0), n.group(0)), w) for w in texte.split(" ")))
    if len(t["m"]) != len(texte.split(" ")):
        raise SystemExit(f"{dst} : {len(t['m'])} instants pour {len(texte.split(' '))} mots")
    return t


def preparer(src, dst, texte):
    """La voix, sans ses silences de bord."""
    ffmpeg("-i", src, "-af", NETTOYER, "-c:a", "libmp3lame", "-q:a", "3", dst)
    return mesurer(dst, texte)


def coller(src, dst, texte):
    """« J'adore, … » du métier, puis « Touchez une cage. » (la fin de la version du restaurant)."""
    fmt = "aformat=sample_rates=44100:channel_layouts=mono"
    ffmpeg("-i", src, "-i", f"{R}/trois-2-restaurant.mp3", "-filter_complex",
           f"[0:a]{fmt},{NETTOYER},apad=pad_dur=0.3[a];[1:a]{fmt},atrim=start={TOUCHEZ_DE},asetpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=0:a=1,{NETTOYER}[o]",
           "-map", "[o]", "-c:a", "libmp3lame", "-q:a", "3", dst)
    return mesurer(dst, texte)


def mot(texte, debut, apres=0):
    """L'indice du premier mot qui commence par « debut » (sans « * ») ; « apres » : celui d'après."""
    mots = [w.replace("*", "") for w in texte.split(" ")]
    for k, w in enumerate(mots):
        if w.startswith(debut):
            return k + apres
    raise SystemExit(f"« {debut} » absent de : {texte}")


CSS = r"""
/* ═══ LES TROIS FANTÔMES (voir tour-trois.py) ═══ */
.tf [hidden],.tv [hidden]{display:none!important}
/* les trois petits fantômes d'avis laissent la place aux trois cages */
.e2-avis{display:none!important}
/* son petit fantôme qui parle, en haut de l'écran */
.t3-dit{position:absolute;left:.6em;right:.8em;top:5.1em;z-index:20;display:flex;align-items:flex-start;gap:.35em;opacity:0;transform:translateY(-.4em);transition:opacity .35s,transform .45s var(--ease),top .5s var(--ease)}
.t3-dit.on{opacity:1;transform:none}
.t3-fant{position:relative;flex:none;width:3.9em;height:3.9em;filter:drop-shadow(0 .4em .6em rgba(0,0,0,.5));animation:flotte 3.2s ease-in-out infinite}
.t3-fant img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.t3-fant .ouverte,.t3-fant.ouvre .fermee{opacity:0}
.t3-fant.ouvre .ouverte{opacity:1}
.t3-dit p{position:relative;flex:1;min-width:0;margin:.35em 0 0;padding:.6em .8em;border-radius:1em;background:var(--creme);color:var(--encre);font-size:.86em;font-weight:700;line-height:1.3;box-shadow:0 .6em 1.4em rgba(0,0,0,.4);min-height:2.6em}
.t3-dit p::before{content:"";position:absolute;left:-.38em;top:1.05em;width:.8em;height:.8em;background:var(--creme);transform:rotate(45deg);border-radius:.12em}
.t3-dit .fx-cle{background:linear-gradient(transparent 60%,rgba(255,46,154,.35) 60%) no-repeat 0 0/0% 100%}
.t3-dit .fx-cle.vu{background-size:100% 100%}

/* ── LA SCÈNE DU COMMERCE (le prototype, en plus petit) ── */
.t3-sc{position:absolute;z-index:0;isolation:isolate;aspect-ratio:360/430;container-type:inline-size;overflow:hidden;border-radius:1.2em;background:linear-gradient(#0B0608,#170C10 40%);box-shadow:0 1em 2em -1em rgba(0,0,0,.9)}
.t3-sc::before{content:"";position:absolute;left:-20%;top:-30%;width:70%;height:60%;background:radial-gradient(closest-side,rgba(255,196,120,.22),transparent);z-index:1}
.t3-fac{position:absolute;left:0;right:0;top:2%;height:64%;z-index:2;
  background:linear-gradient(90deg,rgba(0,0,0,.3),transparent 18%,transparent 82%,rgba(0,0,0,.35)),repeating-linear-gradient(90deg,transparent 0 11.6cqw,rgba(0,0,0,.12) 11.6cqw 11.9cqw),linear-gradient(var(--f1),var(--f2))}
.t3-ens{position:absolute;left:7%;right:7%;top:3.2%;height:12%;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6cqw;border-radius:1cqw;background:var(--ens);
  box-shadow:inset 0 0 0 .55cqw var(--ens),inset 0 0 0 .85cqw rgba(201,164,92,.75),0 1.2cqw 2.4cqw rgba(0,0,0,.45)}
.t3-ens b{font:italic 700 7.4cqw/1 Georgia,"Times New Roman",serif;color:#E8C77A;text-shadow:0 0 3cqw rgba(232,199,122,.4)}
.t3-ens small{font:700 1.9cqw/1 var(--titre);letter-spacing:.4em;color:rgba(232,199,122,.8)}
.t3-store{position:absolute;left:3%;right:3%;top:16.8%;height:8.2%;z-index:4;
  background:linear-gradient(rgba(0,0,0,.28),transparent 45%),repeating-linear-gradient(90deg,var(--s1) 0 5.4cqw,var(--s2) 5.4cqw 10.8cqw);
  -webkit-mask:linear-gradient(#000 0 0) top/100% calc(100% - 2.7cqw) no-repeat,radial-gradient(circle at 50% 0,#000 2.65cqw,transparent 2.75cqw) bottom/5.4cqw 2.7cqw repeat-x;
  mask:linear-gradient(#000 0 0) top/100% calc(100% - 2.7cqw) no-repeat,radial-gradient(circle at 50% 0,#000 2.65cqw,transparent 2.75cqw) bottom/5.4cqw 2.7cqw repeat-x;
  filter:drop-shadow(0 1cqw 1cqw rgba(0,0,0,.5))}
.t3-vit{position:absolute;left:4%;width:50%;top:28%;height:35.5%;z-index:3;border-radius:1cqw;overflow:hidden;background:#1A0D08;
  box-shadow:inset 0 0 0 1.2cqw var(--vit),0 0 0 .55cqw #C9A45C,0 0 9cqw rgba(255,170,90,.38);transition:box-shadow .3s}
.t3-vit > img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 88%;filter:saturate(1.08) brightness(1.06)}
.t3-vit::after{content:"";position:absolute;inset:0;z-index:30;pointer-events:none;
  background:linear-gradient(90deg,transparent calc(50% - .5cqw),var(--vit) calc(50% - .5cqw) calc(50% + .5cqw),transparent 0),linear-gradient(112deg,rgba(255,255,255,.16),transparent 26%,transparent 62%,rgba(255,255,255,.07) 70%,transparent 78%);
  box-shadow:inset 0 0 0 1.2cqw var(--vit)}
.t3-vit em{position:absolute;left:0;right:0;top:7%;z-index:31;text-align:center;font:italic 600 2.5cqw/1 Georgia,serif;color:rgba(232,199,122,.9);letter-spacing:.06em}
.t3-salle{position:absolute;inset:0;z-index:10}
.t3-carnet{position:absolute;left:56.5%;width:14.5%;top:41%;height:14.5%;z-index:4;padding:1.1cqw 1.1cqw .6cqw;border-radius:.6cqw;background:#FFF8EA;color:var(--encre);
  background-image:linear-gradient(90deg,transparent calc(50% - .15cqw),rgba(0,0,0,.18) calc(50% - .15cqw) calc(50% + .15cqw),transparent 0),repeating-linear-gradient(transparent 0 2.6cqw,rgba(70,90,160,.18) 2.6cqw 2.75cqw);
  box-shadow:0 1cqw 1.6cqw rgba(0,0,0,.55);transform:rotate(-3deg);transform-origin:50% 80%;overflow:hidden;transition:transform .5s var(--ease),box-shadow .4s}
.t3-carnet b{display:block;font:italic 700 2.3cqw/1 Georgia,serif;color:#E0167A}
.t3-carnet span{display:block;font:700 2.3cqw/1.15 "Segoe Print","Bradley Hand","Comic Sans MS",cursive;white-space:nowrap}
.t3-carnet span.neuf{animation:t3-ecrire .9s steps(12) both}
@keyframes t3-ecrire{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
.t3-carnet.zoom{z-index:450;transform:rotate(-2deg) scale(1.8);box-shadow:0 0 0 .5cqw #FF2E9A,0 2cqw 4cqw rgba(0,0,0,.6)}
.t3-pied{position:absolute;left:63.2%;width:1.6%;top:55%;height:11%;z-index:3;background:linear-gradient(90deg,#2A140A,#4A2814);border-radius:.4cqw}
.t3-porte{position:absolute;left:73%;width:22%;top:29%;height:37%;z-index:3;border-radius:1.2cqw 1.2cqw 0 0;background:linear-gradient(#2A1E1A,#1A100C);box-shadow:inset 0 0 0 .6cqw #C9A45C;transition:box-shadow .3s}
.t3-porte i{position:absolute;left:14%;right:14%;top:8%;height:47%;border-radius:.8cqw;background:radial-gradient(ellipse at 50% 85%,#FFC27A,#B9652B 58%,#4A1E10);box-shadow:inset 0 0 2cqw rgba(0,0,0,.55)}
.t3-porte::after{content:"";position:absolute;right:12%;top:60%;width:2.2cqw;height:2.2cqw;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFE6A6,#B98A2E)}
.t3-ouvert{position:absolute;left:78.5%;top:36%;z-index:5;padding:.5cqw 1.4cqw;border-radius:.6cqw;background:#FFF8EA;color:#5E1628;font:800 2cqw/1 var(--titre);letter-spacing:.12em;transform:rotate(-4deg);box-shadow:0 .6cqw 1cqw rgba(0,0,0,.4)}
.t3-trot{position:absolute;left:0;right:0;top:66%;bottom:0;z-index:2;
  background:radial-gradient(ellipse 60% 70% at 29% 0,rgba(255,180,100,.26),transparent 70%),radial-gradient(ellipse 30% 50% at 84% 0,rgba(255,180,100,.18),transparent 70%),
    repeating-linear-gradient(90deg,transparent 0 9cqw,rgba(0,0,0,.2) 9cqw 9.35cqw),linear-gradient(#3E322D,#262020)}
.t3-trot::before{content:"";position:absolute;left:0;right:0;top:0;height:1.4cqw;background:linear-gradient(rgba(0,0,0,.55),transparent)}
.t3-calque{position:absolute;inset:0;z-index:5}
.t3-plus{position:absolute;left:3%;top:68.5%;z-index:400;padding:.6cqw 2cqw;border-radius:9cqw;background:rgba(20,12,9,.8);font:800 2.7cqw/1.2 var(--titre);color:var(--creme)}
.t3-hote{position:absolute;left:84%;top:66%;height:24cqw;z-index:6;transform:translate(-50%,-100%);transform-origin:50% 100%;filter:drop-shadow(0 1cqw 1cqw rgba(0,0,0,.5))}
/* les fantômes : posés par leurs pieds (x, y), leur taille suit leur rang */
.t3-fg{position:absolute;height:calc(var(--s) * 15.5cqw);aspect-ratio:.91;transform:translate(-50%,-100%);transition:left .6s,top .6s,opacity .4s,filter .5s}
.t3-fg img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 .7cqw .6cqw rgba(0,0,0,.5));transform-origin:50% 100%}
.t3-fg.adore img{animation:t3-hop 2.6s ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes t3-hop{0%,66%,100%{transform:none}74%{transform:translateY(-13%) rotate(-4deg)}82%{transform:none}90%{transform:translateY(-6%) rotate(3deg)}}
.t3-fg.promis img{animation:t3-penche 3.4s ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes t3-penche{0%,100%{transform:rotate(0)}50%{transform:rotate(-6deg)}}
.t3-fg.table img{animation:t3-souffle 4s ease-in-out infinite;animation-delay:var(--d,0s)}
@keyframes t3-souffle{50%{transform:translateY(-3%)}}
.t3-fg.neuf{animation:t3-arrive .65s cubic-bezier(.2,1.5,.4,1) both}
@keyframes t3-arrive{from{opacity:0;transform:translate(-50%,-160%) scale(.5)}to{opacity:1;transform:translate(-50%,-100%)}}
.t3-fg.part{opacity:0}
.t3-fg.cache{visibility:hidden}
.t3-nom{position:absolute;left:50%;top:0;transform:translate(-50%,-105%);padding:.35cqw 1.4cqw;border-radius:9cqw;background:rgba(20,12,9,.82);color:var(--creme);font:700 2.5cqw/1.25 var(--titre);white-space:nowrap;display:none}
.t3-fg.ami .t3-nom,.t3-fg.recent .t3-nom,.t3-fg.moi .t3-nom,.t3-fg.vedette .t3-nom,.t3-fg.invite .t3-nom{display:block}
.t3-fg.ami .t3-nom{background:rgba(61,226,166,.92);color:#06281C}
.t3-fg.moi .t3-nom,.t3-fg.vedette .t3-nom{background:var(--rose);color:#fff}
.t3-fg.invite .t3-nom{background:#FFF8EA;color:#E0167A}
.t3-fg.moi::before{content:"";position:absolute;left:8%;right:8%;bottom:-6%;height:16%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,46,154,.8),transparent);z-index:-1}
/* Camille, dans la foule : un repère qu'on ne rate pas (premier rang, un peu plus grande, son halo, « Vous ») */
.t3-fg.moi .t3-nom{padding:.6cqw 2.3cqw;font-size:3.2cqw;font-weight:800;box-shadow:0 0 0 .45cqw #fff,0 1cqw 2cqw rgba(0,0,0,.55);transform:translate(-50%,-140%);animation:t3-repere 1.7s ease-in-out infinite}
.t3-fg.moi .t3-nom::after{content:"";position:absolute;left:50%;bottom:-1.25cqw;width:2.3cqw;height:2.3cqw;margin-left:-1.15cqw;background:var(--rose);transform:rotate(45deg);box-shadow:.45cqw .45cqw 0 0 #fff;border-radius:.3cqw}
@keyframes t3-repere{50%{transform:translate(-50%,-158%)}}
.t3-fg.moi::before{left:-22%;right:-22%;bottom:-10%;height:26%;background:radial-gradient(closest-side,rgba(255,46,154,.95),rgba(255,46,154,.4) 55%,transparent);animation:t3-halo 1.7s ease-in-out infinite}
@keyframes t3-halo{50%{opacity:.55;transform:scale(.82)}}
.t3-sc.repere .t3-fg:not(.moi),.t3-sc.repere .t3-hote{filter:brightness(.4) saturate(.5)}
.t3-tag{position:absolute;left:50%;top:-4%;transform:translate(-50%,-100%);padding:.3cqw 1.2cqw;border-radius:.8cqw;background:#FFF8EA;color:var(--encre);font:700 2.3cqw/1.2 var(--titre);white-space:nowrap}
.t3-fg.moi .t3-tag,.t3-fg.vedette .t3-tag{top:-34%}
.t3-fg.scanne::after{content:"✓";position:absolute;right:-6%;top:6%;width:5cqw;height:5cqw;border-radius:50%;background:var(--menthe);color:#06281C;display:grid;place-items:center;font:900 3cqw/1 var(--titre);box-shadow:0 .3cqw .7cqw rgba(0,0,0,.45)}
.t3-fg.saute img{animation:t3-saute .6s cubic-bezier(.3,1.6,.5,1)}
@keyframes t3-saute{40%{transform:translateY(-22%) scale(1.06)}}
.t3-sc.luit-promis .t3-porte{box-shadow:inset 0 0 0 .6cqw #C9A45C,0 0 0 .8cqw rgba(255,46,154,.9),0 0 6cqw rgba(255,46,154,.7)}
.t3-sc.luit-table .t3-vit{box-shadow:inset 0 0 0 1.2cqw var(--vit),0 0 0 .8cqw rgba(61,226,166,.95),0 0 8cqw rgba(61,226,166,.6)}
.t3-coeur{position:absolute;z-index:450;width:3.6cqw;height:3.6cqw;pointer-events:none;animation:t3-monte 1.6s ease-out forwards}
.t3-coeur svg{width:100%;height:100%;fill:var(--rose)}
@keyframes t3-monte{from{opacity:0;transform:translateY(0) scale(.6)}20%{opacity:1}to{opacity:0;transform:translateY(-14cqw) scale(1.2)}}
.t3-vol{position:fixed;z-index:999;pointer-events:none;object-fit:contain;filter:drop-shadow(0 10px 12px rgba(0,0,0,.5))}

/* ── 1. LA FIN DE SA VIDÉO : LES TROIS CAGES ── */
.tf{background:#0E0907}
.tf-film{position:absolute;left:0;right:0;top:0;width:100%;height:23.4em;object-fit:cover;object-position:50% 0;transition:opacity .5s;
  -webkit-mask:linear-gradient(#000 70%,transparent);mask:linear-gradient(#000 70%,transparent)}
.tf .xr-haut{z-index:6}
.tf .t3-sc{left:.7em;right:.7em;top:4.6em;opacity:0;transition:opacity .45s}
.tf.vitrine .t3-sc{opacity:1}
.tf.vitrine .tf-film{opacity:0}
.tf.vitrine .t3-dit{top:32.7em}
.tf-choix{position:absolute;left:.6em;right:.6em;top:25.4em;display:flex;flex-direction:column;align-items:center;transition:opacity .35s,transform .45s}
.tf.vitrine .tf-choix{opacity:0;transform:translateY(2em);pointer-events:none}
.tf-choix h3{margin:0;font:italic 700 1.7em/1.1 Georgia,"Times New Roman",serif}
.tf-choix > p{margin:.15em 0 .5em;text-align:center;font-size:.74em;color:var(--gris)}
.tf-trois{display:grid;grid-template-columns:repeat(3,1fr);gap:.3em;width:100%;align-items:start;border-radius:1.2em}
.tf-ligne{display:flex;align-items:center;justify-content:center;gap:.5em;margin:.7em 0 0;font-size:.72em;color:var(--gris)}
.tf-tetes{display:flex}
.tf-tetes img{width:1.9em;height:1.9em;object-fit:contain;border-radius:50%;background:#2B1C16;border:1.5px solid #0E0907;margin-left:-.5em}
.tf-tetes img:first-child{margin-left:0}
.t3-f3{display:flex;flex-direction:column;align-items:center;gap:.15em;padding:.15em 0 0;text-align:center;border-radius:1.2em;color:var(--creme)}
.t3-cg{position:relative;display:flex;flex-direction:column;align-items:center;width:90%;transform-origin:50% 0;animation:t3-balance 3.6s ease-in-out infinite}
.t3-f3.promis .t3-cg{animation-delay:-1.2s}.t3-f3.table .t3-cg{animation-delay:-2.4s}
@keyframes t3-balance{0%,100%{transform:rotate(-2.2deg)}50%{transform:rotate(2.2deg)}}
.t3-anneau{position:relative;z-index:2;width:1.15em;height:1.15em;margin-bottom:-.23em;border-radius:50%;border:.19em solid #E8C77A}
.t3-noeud{position:absolute;top:1em;left:50%;z-index:5;width:2em;height:.92em;margin-left:-1em;
  background:radial-gradient(ellipse 45% 48% at 22% 50%,var(--c) 96%,transparent),radial-gradient(ellipse 45% 48% at 78% 50%,var(--c) 96%,transparent),radial-gradient(circle at 50% 50%,var(--c) 30%,transparent 33%)}
.t3-dome{position:relative;width:100%;aspect-ratio:.86;overflow:hidden;border:.19em solid #E8C77A;border-bottom:0;border-radius:50% 50% 10% 10% / 44% 44% 6% 6%;
  background:radial-gradient(ellipse 70% 55% at 50% 42%,rgba(255,226,180,.2),transparent 72%),rgba(255,244,230,.035)}
.t3-dome::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 calc(16.66% - 1.4px),rgba(232,199,122,.85) calc(16.66% - 1.4px) 16.66%)}
.t3-dome::after{content:"";position:absolute;left:0;right:0;top:36%;height:2px;z-index:3;background:rgba(232,199,122,.9)}
.t3-dome img{position:absolute;left:50%;bottom:4%;z-index:2;height:70%;width:auto;transform:translateX(-50%);filter:drop-shadow(0 4px 4px rgba(0,0,0,.45));animation:t3-bob 2.4s ease-in-out infinite;transition:opacity .2s}
@keyframes t3-bob{50%{transform:translate(-50%,-7%)}}
.t3-porte-c{position:absolute;left:29%;width:42%;bottom:0;height:54%;z-index:4;border:.19em solid #E8C77A;border-bottom:0;border-radius:45% 45% 0 0 / 35% 35% 0 0;transform-origin:0 50%;
  background:repeating-linear-gradient(90deg,transparent 0 calc(33.3% - 1.4px),rgba(232,199,122,.95) calc(33.3% - 1.4px) 33.3%),rgba(20,12,9,.12);transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
.t3-socle{width:110%;height:1em;margin-top:-1px;border-radius:.4em;background:linear-gradient(#F3DFA0,#B38A3A);box-shadow:0 .45em .8em -.3em rgba(0,0,0,.65),inset 0 -.3em 0 var(--c)}
.t3-f3.adore{--c:#FF2E9A}.t3-f3.promis{--c:#F5A23A}.t3-f3.table{--c:#3DE2A6}
.t3-f3.ouverte .t3-porte-c,.t3-f3.on .t3-porte-c{transform:perspective(160px) rotateY(-118deg)}
.t3-f3.on .t3-dome img{opacity:0}
.t3-f3 b{margin-top:.4em;font-size:.86em;font-weight:800;line-height:1.1}
.t3-f3 small{font-size:.66em;color:var(--gris);line-height:1.2;max-width:98%}
.t3-f3.on b::after{content:" ✓";color:var(--c)}
.t3-f3.luit .t3-cg{animation:t3-luit .7s var(--ease)}
.t3-f3.luit .t3-dome{box-shadow:0 0 0 .2em var(--c),0 0 1.6em var(--c)}
@keyframes t3-luit{40%{transform:scale(1.12) rotate(-3deg)}}
.tf-bon{position:absolute;left:.9em;right:.9em;top:39.3em;display:flex;align-items:center;gap:.7em;padding:.6em .8em;border-radius:1em;background:#FFF8EA;color:var(--encre);box-shadow:0 .8em 1.6em -.6em rgba(0,0,0,.8);
  opacity:0;transform:translateY(1em) scale(.96);transition:opacity .35s,transform .5s var(--ease)}
.tf-bon.on{opacity:1;transform:none}
.tf-bon > i{flex:none;display:grid;place-items:center;width:2.4em;height:2.4em;border-radius:.7em;background:linear-gradient(135deg,#FF4FA8,#E0167A);font-style:normal;font-size:1.1em}
.tf-bon span{min-width:0}
.tf-bon small{display:block;font-size:.62em;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#E0167A}
.tf-bon b{display:block;font-size:.96em;line-height:1.2}
.tf-bon em{display:block;font-style:normal;font-size:.66em;color:#6A5444}
.tf .go{position:absolute;left:.9em;right:.9em;width:auto;bottom:2em}

/* ── 2. SON COMPTOIR : MIKE, SON ASSISTANT ── */
/* sa barre : Mike, en ligne */
.mk-tete{position:absolute;left:.9em;right:.9em;top:5.5em;display:flex;align-items:center;gap:.55em;padding:.4em .75em .4em .5em;border-radius:1.1em;background:rgba(255,255,255,.05);border:1px solid var(--trait)}
.mk-tete img{flex:none;width:2.4em;height:2.4em;object-fit:contain;filter:drop-shadow(0 .2em .3em rgba(0,0,0,.5))}
.mk-tete span{flex:1;min-width:0;display:flex;flex-direction:column}
.mk-tete b{font-size:.95em;font-weight:900;line-height:1.1}
.mk-tete small{font-size:.66em;color:var(--gris)}
.mk-tete em{display:flex;align-items:center;gap:.4em;font-style:normal;font-size:.64em;font-weight:800;color:var(--menthe)}
.mk-tete em::before{content:"";width:.6em;height:.6em;border-radius:50%;background:var(--menthe);box-shadow:0 0 .5em var(--menthe)}
/* le fil : les messages arrivent en bas, les plus anciens montent et s'effacent */
.mk-fil{position:absolute;left:.9em;right:.9em;top:9.1em;bottom:7.5em;display:flex;flex-direction:column;justify-content:flex-end;gap:.5em;overflow:hidden;
  -webkit-mask:linear-gradient(transparent,#000 2.4em);mask:linear-gradient(transparent,#000 2.4em)}
@keyframes mk-vient{from{opacity:0;transform:translateY(.8em) scale(.97)}}
.mk-date{flex:none;align-self:center;padding:.25em .8em;border-radius:1em;background:rgba(255,255,255,.07);color:var(--gris);font-size:.62em;font-weight:800;letter-spacing:.04em}
/* Mike : son petit fantôme, sa bulle */
.mk-l{flex:none;display:flex;align-items:flex-end;gap:.45em;animation:mk-vient .4s var(--ease) both}
.mk-l .t3-fant{width:2.5em;height:2.5em;animation:none}
.mk-l.parle .t3-fant{animation:flotte 3.2s ease-in-out infinite}
.mk-l p{margin:0;max-width:86%;padding:.55em .8em;border-radius:1.1em 1.1em 1.1em .3em;background:var(--creme);color:var(--encre);font-size:.86em;font-weight:700;line-height:1.3;box-shadow:0 .5em 1.2em -.4em rgba(0,0,0,.6)}
.mk-l .fx-cle{background:linear-gradient(transparent 60%,rgba(255,46,154,.35) 60%) no-repeat 0 0/0% 100%}
.mk-l .fx-cle.vu{background-size:100% 100%}
.mk-tape{display:flex;align-items:center;gap:.3em;min-height:1.1em}
.mk-tape i{width:.45em;height:.45em;border-radius:50%;background:#A08A7A;animation:mk-point 1s infinite}
.mk-tape i:nth-child(2){animation-delay:.15s}.mk-tape i:nth-child(3){animation-delay:.3s}
@keyframes mk-point{0%,60%,100%{opacity:.35;transform:none}30%{opacity:1;transform:translateY(-.2em)}}
/* lui : ses bulles, à droite */
.mk-moi{flex:none;align-self:flex-end;max-width:80%;padding:.55em .85em;border-radius:1.1em 1.1em .3em 1.1em;background:linear-gradient(135deg,#FF4FA8,#E0167A);color:#fff;font-size:.86em;font-weight:800;line-height:1.3;
  box-shadow:0 .5em 1.2em -.4em rgba(255,46,154,.6);animation:mk-vient .35s var(--ease) both}
.mk-moi small{display:block;margin-bottom:.15em;font-size:.74em;font-weight:700;opacity:.85}
/* ce que Mike montre : des cartes, sous sa bulle */
.mk-c{flex:none;margin-left:2.95em;border-radius:1em;background:#FFF8EA;color:var(--encre);box-shadow:0 .8em 1.6em -.6em rgba(0,0,0,.8);animation:mk-vient .45s var(--ease) both}
.tv-carte{display:flex;align-items:center;gap:.65em;padding:.55em .75em}
.tv-carte > i{flex:none;display:grid;place-items:center;width:2.2em;height:2.2em;border-radius:.7em;font-style:normal;font-size:1.05em;background:#FFE2EF}
.tv-carte > span{flex:1;min-width:0}
.tv-carte > span small{display:block;font-size:.6em;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#E0167A}
.tv-carte > span b{display:block;font-size:.84em;line-height:1.22}
.tv-carte > span em{display:block;font-style:normal;font-size:.64em;color:#6A5444;line-height:1.25}
.tv-carte > strong{flex:none;display:flex;flex-direction:column;align-items:center;font-size:1.5em;font-weight:900;line-height:1;color:#E0167A}
.tv-carte > strong small{font-size:.38em;letter-spacing:.04em;color:#6A5444;font-weight:700}
.tv-carte.vert > i{background:#D7F8EA}
.tv-carte.vert > span small{color:#0B7A55}
.tv-bilan{background:linear-gradient(135deg,#FFF8EA,#FFE2EF);box-shadow:0 0 0 .2em rgba(255,46,154,.55),0 .8em 1.6em -.6em rgba(0,0,0,.8)}
.tv-bilan > span b{font-size:1.08em;font-weight:900}
/* leurs réponses, une à une */
.tv-reps{display:flex;flex-direction:column;gap:.3em;padding:.5em .55em .55em}
.tv-reps-t{display:flex;align-items:baseline;justify-content:space-between;padding:0 .2em}
.tv-reps-t small{font-size:.6em;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#E0167A}
.tv-reps-t b{font-size:.8em;font-weight:900;color:#E0167A;font-variant-numeric:tabular-nums}
.tv-rep{display:flex;align-items:center;gap:.5em;padding:.22em .5em .22em .3em;border-radius:.8em;background:#fff;box-shadow:0 .3em .8em -.4em rgba(0,0,0,.35);opacity:0;transform:translateY(.5em) scale(.97);transition:opacity .3s,transform .45s var(--ease)}
.tv-rep.on{opacity:1;transform:none}
.tv-rep img{flex:none;width:2em;height:2em;object-fit:contain;border-radius:50%;background:#FBE9F1}
.tv-rep span{flex:1;min-width:0;font-size:.72em;line-height:1.25}
.tv-rep span b{display:block;font-weight:900}
.tv-rep em{flex:none;font-style:normal;font-size:.68em;font-weight:900;color:#0B7A55;transition:background .3s}
.tv-rep.scanne em{padding:.2em .55em;border-radius:1em;background:#D7F8EA}
/* ses réponses à toucher, et la saisie (pour le décor) */
.mk-choix{position:absolute;left:.9em;right:.9em;bottom:4.6em;display:flex;justify-content:flex-end;gap:.45em;animation:mk-vient .35s var(--ease) both}
.mk-ch{display:inline-flex;align-items:center;justify-content:center;gap:.4em;height:2.7em;padding:0 1.1em;border-radius:2em;border:1.5px solid rgba(255,46,154,.6);background:rgba(255,46,154,.08);color:#fff;font:inherit;font-size:.86em;font-weight:800;white-space:nowrap;cursor:pointer}
.mk-ch.fort{border-color:transparent;background:linear-gradient(135deg,#FF4FA8,#E0167A);box-shadow:0 .5em 1.4em -.4em rgba(255,46,154,.8)}
.mk-ch.large{position:absolute;left:.9em;right:.9em;bottom:4.6em;height:3em;font-size:.98em;animation:mk-vient .35s var(--ease) both}
.mk-ch.secoue{animation:mk-secoue .45s}
@keyframes mk-secoue{20%,60%{transform:translateX(-.3em)}40%,80%{transform:translateX(.3em)}}
.mk-saisie{position:absolute;left:.9em;right:.9em;bottom:1.3em;height:2.7em;display:flex;align-items:center;justify-content:space-between;padding:0 .35em 0 1em;border-radius:2em;background:rgba(255,255,255,.06);border:1px solid var(--trait);color:var(--gris)}
.mk-saisie span{font-size:.8em}
.mk-saisie i{display:grid;place-items:center;width:2.1em;height:2.1em;border-radius:50%;background:rgba(255,255,255,.08);font-style:normal;font-size:.9em}
/* le message prêt à partir : une carte du fil, à eux seuls, avec son bouton */
.tv-brouillon{display:flex;flex-direction:column;gap:.45em;padding:.6em .7em .7em}
.tv-b-t{display:flex}
.tv-b-t small{font-size:.6em;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#E0167A}
.tv-b-t b{font-size:.78em;font-weight:900;color:#E0167A}
.tv-a{display:flex;flex-wrap:wrap;gap:.25em}
.tv-a span{padding:.2em .55em;border-radius:1em;background:rgba(245,162,58,.18);border:1px solid rgba(245,162,58,.5);color:#7A4A12;font-size:.62em;font-weight:800}
.tv-msg{margin:0 0 0 auto;max-width:90%;padding:.55em .8em;border-radius:1em 1em .3em 1em;background:linear-gradient(135deg,#FF4FA8,#E0167A);color:#fff;font-size:.8em;font-weight:700;line-height:1.3}
.tv-envoyer.mk-ch{width:100%;height:2.7em;font-size:.86em}
.tv-envoye{display:none;align-items:center;justify-content:center;gap:.4em;margin:0;font-size:.74em;font-weight:900;color:#0B7A55}
.tv-brouillon.envoye .tv-envoyer{display:none}
.tv-brouillon.envoye .tv-envoye{display:flex}
@media (prefers-reduced-motion: reduce){
  .t3-fg img,.t3-fg.neuf,.t3-cg,.t3-dome img,.t3-fant,.mk-l,.mk-moi,.mk-c,.mk-choix,.mk-ch,.mk-tape i,.t3-fg.moi .t3-nom,.t3-fg.moi::before{animation:none!important}
}
"""

HTML = r"""
          <!-- ══ 4b'. LES TROIS FANTÔMES : LA FIN DE SA VIDÉO (voir tour-trois.py) ══ -->
          <div class="v xr tf" id="v-tf" style="__COULEURS__">
            <img class="tf-film" id="tf-film" src="__FIN__" alt="">
            __HAUT__
            <div class="t3-sc" id="tf-sc" aria-hidden="true"></div>
            <div class="t3-dit"><span class="t3-fant" aria-hidden="true"><img class="fermee" src="__FANT__" alt=""><img class="ouverte" src="__FANT_PARLE__" alt=""></span><p aria-live="polite"></p></div>
            <div class="tf-choix">
              <h3>Et vous ?</h3>
              <p>Un geste, sans engagement : votre fantôme va se placer __CHEZ__.</p>
              <div class="tf-trois" id="tf-trois">__CAGES__</div>
              <p class="tf-ligne"><span class="tf-tetes"><img src="tf/rebelle-debout.webp" alt=""><img src="tf/fleuri-debout.webp" alt=""><img src="tf/voyageur-debout.webp" alt=""></span><span id="tf-ligne"></span></p>
            </div>
            <div class="tf-bon" id="tf-bon"><i aria-hidden="true">📌</i><span><small id="tf-bon-t"></small><b id="tf-bon-b"></b><em id="tf-bon-s"></em></span></div>
            <button type="button" class="go" id="tf-go" hidden>__TENTE__</button>
          </div>

          <!-- ══ 5b. SON COMPTOIR : MIKE, SON ASSISTANT (voir tour-trois.py) ══ -->
          <div class="v ex tv" id="v-tv">
            __TETE__
            <div class="mk-tete"><img src="__FANT__" alt=""><span><b>Mike</b><small>Votre assistant ClikMe</small></span><em>en ligne</em></div>
            <div class="mk-fil" id="mk-fil" aria-live="polite"></div>
            <div class="mk-choix" id="mk-choix" hidden><button type="button" class="mk-ch" id="mk-non">Plus tard</button><button type="button" class="mk-ch fort" id="mk-oui"></button></div>
            <div class="mk-saisie" aria-hidden="true"><span>Écrire à Mike…</span><i>🎙️</i></div>
          </div>
"""

BILAN = '<div class="wb-l"><i>👻</i><span><small>Grâce à vos promesses</small><b id="wb-vitrine"></b></span></div>'

JS = r"""
  /* ═══ LES TROIS FANTÔMES (voir tour-trois.py) ═══
     À la fin de sa vidéo, le client ne met pas un « j'aime » : il choisit un des trois fantômes, qui
     s'envole se placer dans la vitrine du commerce. Puis le comptoir : Mike, son assistant, et ceux qui
     ont promis de venir, qu'un geste rappelle le jour où c'est calme. Chiffres : exemples. */
  const T3 = __T3__;
  Object.assign(TEMPS, __TEMPS_T3__);
  __ENR_T3__.forEach((n) => { if (!ENREGISTREES.includes(n)) ENREGISTREES.push(n); });
  HEURES.tf = "12:05"; HEURES.tv = "11:00";
  const T3_LOOKS = ["denim", "fleuri", "rebelle", "soleil", "curieux", "voyageur", "artiste"];
  const T3_NOMS = ["Léa", "Malik", "Martin", "Chloé", "Lucas", "Sarah", "Nathan", "Emma", "Paul", "Zoé", "Yanis", "Rose", "Jules", "Lina", "Elsa", "Noé", "Iris", "Axel", "Margot", "Simon", "Jade", "Victor", "Ambre", "Robin", "Agathe", "Louna", "Enzo", "Mila", "Gabin", "Théo", "Nina", "Adam", "Salomé", "Bastien", "Manon", "Louis", "Céline", "Hamza", "Anaïs", "Maël"];
  const t3img = (look, pose) => "tf/" + look + "-" + pose + ".webp";
  const T3_POSE = { adore: "debout", promis: "salue", table: T3.pose3 };
  // où se placent les fantômes (x, y en % de la scène, pieds au sol ; s : la taille, selon le rang). La
  // première place de chaque groupe est gardée pour Camille (le client du tour).
  const T3_RANGS = [
    ...[30, 18, 42, 6, 54].map((x) => ({ x, y: 97, s: 1 })),
    ...[12, 24, 36, 48, 2, 58].map((x) => ({ x, y: 86.5, s: .84 })),
    ...[7, 16, 25, 34, 43, 52].map((x) => ({ x, y: 77, s: .7 })),
  ];
  const T3_PROMIS = [{ x: 69, y: 87, s: .9 }, { x: 64, y: 73, s: .76 }, { x: 75, y: 75.5, s: .78 }, { x: 87, y: 73.5, s: .76 }, { x: 81, y: 89, s: .92 }, { x: 93, y: 86, s: .86 }];
  // dedans, derrière la vitre (x, y en % de la vitrine)
  // la première place (celle de Camille) : au premier plan, contre la vitre
  const T3_SIEGES = [{ x: 52, y: 100, s: .92 }, { x: 45, y: 82, s: .74 }, { x: 22, y: 85, s: .82 }, { x: 65, y: 86, s: .82 }, { x: 84, y: 81, s: .72 }, { x: 74, y: 100, s: .92 }];
  const camille = (t) => ({ id: "camille", nom: "Camille", look: "cosy", type: t, heure: T3.heures[0] });

  function t3Scene(el) {
    el.innerHTML = '<div class="t3-fac"></div><div class="t3-ens"><b></b><small></small></div><div class="t3-store"></div>' +
      '<div class="t3-vit"><img src="tf-interieur.webp" alt=""><div class="t3-salle"></div><em></em></div>' +
      '<div class="t3-carnet"><b>Le carnet</b><div class="t3-noms"></div></div><div class="t3-pied"></div>' +
      '<div class="t3-porte"><i></i></div><span class="t3-ouvert">OUVERT</span><img class="t3-hote" src="tf-hote.webp" alt="">' +
      '<div class="t3-trot"></div><div class="t3-calque"></div><span class="t3-plus" hidden></span>';
    $(".t3-ens b", el).textContent = T3.lieu; $(".t3-ens small", el).textContent = T3.sous; $(".t3-vit em", el).textContent = T3.carte;
    el._fg = new Map();
  }
  t3Scene($("#tf-sc"));
  /* La foule : nA ont adoré, nP ont promis, nT viennent ; dans l'ordre d'arrivée. */
  function t3Foule(nA, nP, nT, amis) {
    const L = [];
    let k = 0, a = 0, p = 0, t = 0;
    const un = (type) => {
      L.push({ id: "f" + k, nom: T3_NOMS[k % T3_NOMS.length], look: T3_LOOKS[(k * 3 + 1) % T3_LOOKS.length], type, d: ((k * 0.37) % 2.4).toFixed(2), heure: type === "table" && t < 2 ? T3.heures[(t + 1) % T3.heures.length] : "" });
      k++;
    };
    while (a < nA || p < nP || t < nT) {
      if (p < nP && (k % 3 === 0 || a >= nA)) { un("promis"); p++; } else if (t < nT && (k % 9 === 4 || (a >= nA && p >= nP))) { un("table"); t++; } else if (a < nA) { un("adore"); a++; } else if (p < nP) { un("promis"); p++; } else { un("table"); t++; }
    }
    if (amis) [["Tom", "rebelle"], ["Inès", "fleuri"], ["Hugo", "voyageur"]].forEach(([nom, look], i) => { const f = L.filter((x) => x.type === "adore")[i * 2 + 1]; if (f) Object.assign(f, { nom, look, ami: true }); });
    return L;
  }
  function t3Rendre(el, foule) {
    const L = [];
    const groupe = (t, places, couche) => {
      const lui = foule.find((f) => f.id === "camille" && f.type === t);
      const autres = foule.filter((f) => f.type === t && f.id !== "camille").sort((x, y) => (y.ami ? 1 : 0) - (x.ami ? 1 : 0));
      if (lui) L.push({ f: lui, p: places[0], couche });
      autres.slice(0, places.length - 1).forEach((f, k) => L.push({ f, p: places[k + 1], couche }));
      return Math.max(0, autres.length - (places.length - 1));
    };
    const reste = groupe("adore", T3_RANGS, "t3-calque");
    groupe("promis", T3_PROMIS, "t3-calque");
    groupe("table", T3_SIEGES, "t3-salle");
    const vus = new Set();
    for (const { f, p, couche } of L) {
      vus.add(f.id);
      let d = el._fg.get(f.id);
      const c = $("." + couche, el);
      if (!d || d.parentNode !== c) {
        if (d) d.remove();
        d = document.createElement("div"); d.innerHTML = '<img alt=""><span class="t3-nom"></span>';
        c.appendChild(d); el._fg.set(f.id, d);
        if (f.neuf) { d.classList.add("neuf"); setTimeout(() => d.classList.remove("neuf"), 700); }
      }
      const garde = ["neuf", "cache", "saute", "scanne"].filter((x) => d.classList.contains(x));
      d.className = "t3-fg " + f.type + (f.ami ? " ami" : "") + (f.invite ? " invite" : "") + (f.moi ? " moi" : "") + (f.vedette ? " vedette" : "") + (f.recent ? " recent" : "") + (garde.length ? " " + garde.join(" ") : "");
      // Camille : un peu plus grande, devant tout le monde
      d.style.left = p.x + "%"; d.style.top = p.y + "%"; d.style.setProperty("--s", f.moi ? p.s * 1.15 : p.s); d.style.setProperty("--d", (f.d || 0) + "s");
      d.style.zIndex = f.moi ? (couche === "t3-calque" ? "400" : "60") : couche === "t3-calque" ? String(100 + Math.round(p.y)) : String(10 + Math.round(p.y / 10));
      const im = $("img", d), src = t3img(f.look, T3_POSE[f.type]);
      if (im.getAttribute("src") !== src) im.setAttribute("src", src);
      // en salle, la place est étroite : « Vous » et son heure
      $(".t3-nom", d).textContent = f.moi ? "Vous · " + (f.type === "table" && f.heure ? f.heure : f.nom) : (f.invite ? "💌 " : "") + f.nom;
      const tag = $(".t3-tag", d);
      if (f.type === "table" && f.heure && f.vedette) { if (!tag) d.insertAdjacentHTML("beforeend", '<span class="t3-tag"></span>'); $(".t3-tag", d).textContent = f.heure; } else if (tag) tag.remove();
    }
    for (const [cle, d] of el._fg) if (!vus.has(cle)) { d.classList.add("part"); el._fg.delete(cle); setTimeout(() => d.remove(), 450); }
    const plus_ = $(".t3-plus", el);
    plus_.hidden = !reste; plus_.textContent = "+" + reste + " devant la vitrine";
    // le carnet : les trois derniers prénoms (ou ceux qu'on lui donne)
    const noms = $(".t3-noms", el), derniers = el._carnet ? el._carnet.map((nom) => ({ nom })) : foule.filter((f) => f.type === "promis").slice(-3).reverse();
    const avant = noms.dataset.noms || "";
    noms.innerHTML = ""; derniers.forEach((f) => { const s = document.createElement("span"); s.textContent = f.nom; if (f.ecrit && !avant.split("|").includes(f.nom)) s.className = "neuf"; noms.appendChild(s); });
    noms.dataset.noms = derniers.map((f) => f.nom).join("|");
  }
  function t3Coeurs(el, n) {
    if (reduit) return;
    const adore = [...el._fg.values()].filter((d) => d.classList.contains("adore"));
    for (let k = 0; k < n && adore.length; k++) {
      const d = adore[(k * 5 + 2) % adore.length];
      const c = document.createElement("span"); c.className = "t3-coeur";
      c.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.7 1.3 4.6 2.7.9-1.4 2.4-2.7 4.6-2.7 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
      c.style.left = "calc(" + d.style.left + " - 1.8cqw)"; c.style.top = "calc(" + d.style.top + " - 16cqw)"; c.style.animationDelay = k * 0.18 + "s";
      $(".t3-calque", el).appendChild(c); setTimeout(() => c.remove(), 2200);
    }
  }
  // une place s'anime : la porte (ceux qui ont promis), la vitrine (ceux qui viennent), la foule
  function t3Place(el, t) {
    rejouer(el, "luit-" + t); plus(() => el.classList.remove("luit-" + t), 1300);
    [...el._fg.values()].filter((d) => d.classList.contains(t)).forEach((d, k) => plus(() => { d.classList.remove("saute"); void d.offsetWidth; d.classList.add("saute"); }, k * 40));
    son("note", { adore: 2, promis: 4, table: 6 }[t]);
  }
  /* SA BULLE : le petit fantôme du commerce dit la réplique, mot à mot, avec sa voix. */
  async function t3Dire(v, nom) {
    const d = $(".t3-dit", v), p = $("p", d), f = $(".t3-fant", d), texte = T3.textes[nom];
    d.classList.add("on"); p.textContent = "";
    if (!TEMPS[nom]) { p.textContent = texte.replace(/\*/g, ""); return pause(texte.split(" ").length * 330, jetonVoix); }
    return prononcer(f, p, texte, nom);
  }
  // quand le mot n (à partir de 0) s'écrit dans la bulle
  function quandMot(el, n, fn) {
    const j = jetonVoix;
    const o = new MutationObserver(() => {
      if (j !== jetonVoix) { o.disconnect(); return; }
      if ($$(".fx-mot", el).length > n) { o.disconnect(); fn(); }
    });
    o.observe(el, { childList: true });
  }
  // son fantôme s'envole de la cage à sa place
  function t3Voler(a, src, cible, fin) {
    const b = cible && cible.getBoundingClientRect();
    if (reduit || !b || !a.width || !b.width || !document.body.animate) { fin(); return; }
    const v = document.createElement("img");
    v.className = "t3-vol"; v.src = src; v.alt = "";
    Object.assign(v.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
    document.body.appendChild(v);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2), s = b.height / a.height;
    const anim = v.animate([
      { transform: "translate(0,0) scale(1) rotate(0)" },
      { transform: "translate(" + dx * 0.45 + "px," + (dy * 0.45 - 90) + "px) scale(" + ((1 + s) / 2) * 1.15 + ") rotate(-10deg)", offset: 0.5 },
      { transform: "translate(" + dx + "px," + dy + "px) scale(" + s + ") rotate(0)" },
    ], { duration: 1000, easing: "cubic-bezier(.35,.05,.25,1)" });
    anim.onfinish = () => { v.remove(); fin(); };
  }

  /* ── 1. LES TROIS CAGES ── */
  const vTf = $("#v-tf"), scTf = $("#tf-sc");
  const TF = { choix: null, pret: false, foule: [] };
  function tfEntrer() {
    const j = jetonVoix;
    TF.choix = null; TF.pret = false;
    vTf.classList.remove("vitrine");
    $("#tf-film").src = FILMS[parcours].fin;
    $$(".t3-f3", vTf).forEach((b) => b.classList.remove("on", "luit", "ouverte"));
    $("#tf-bon").classList.remove("on"); $("#tf-go").hidden = true;
    $(".t3-dit", vTf).classList.remove("on"); $(".t3-dit p", vTf).textContent = "";
    $(".t3-carnet", scTf).classList.remove("zoom");
    TF.foule = t3Foule(T3.compte[0], T3.compte[1], T3.compte[2], true);
    $(".t3-noms", scTf).dataset.noms = "";
    t3Rendre(scTf, TF.foule);
    $("#tf-ligne").textContent = T3.compte[0] + " fantômes devant la vitrine, dont Tom, Inès, Hugo";
    (async () => {
      if (!(await pause(650, j)) || !(await t3Dire(vTf, "trois-1")) || !(await pause(250, j)) || TF.choix) return;
      // chaque cage s'allume quand il la dit
      const p = $(".t3-dit p", vTf), ix = T3.mots["trois-2"];
      [0, 1, 2].forEach((k) => quandMot(p, ix[k], () => { const b = $$(".t3-f3", vTf)[k]; b.classList.remove("luit"); void b.offsetWidth; b.classList.add("luit"); son("note", k * 2 + 2); }));
      quandMot(p, ix[3], () => viser("#tf-trois"));
      if ((await t3Dire(vTf, "trois-2")) && !TF.choix) viser("#tf-trois");
    })();
  }
  function tfChoisir(t) {
    if (TF.choix || DEMOS[vue].moments[idx].id !== "trois") return;
    taireVoix(); viser(null);
    const j = jetonVoix;
    TF.choix = t;
    const b = $('.t3-f3[data-t3="' + t + '"]', vTf), src = $(".t3-dome img", b);
    $$(".t3-f3", vTf).forEach((x) => x.classList.remove("luit"));
    b.classList.add("ouverte"); son("pop");
    plus(() => {
      const a = src.getBoundingClientRect();
      b.classList.add("on");
      TF.foule.push(Object.assign(camille(t), { moi: true, ecrit: true }));
      t3Rendre(scTf, TF.foule);
      const cible = scTf._fg.get("camille"); cible.classList.add("cache");
      vTf.classList.add("vitrine"); son("souffle"); geste("hop", 520);
      plus(() => t3Voler(a, src.src, $("img", cible), () => {
        cible.classList.remove("cache", "neuf"); void cible.offsetWidth; cible.classList.add("neuf");
        setTimeout(() => cible.classList.remove("neuf"), 700);
        // à son arrivée, la foule s'efface un instant : « vous êtes là »
        if (!reduit) { rejouer(scTf, "repere"); setTimeout(() => scTf.classList.remove("repere"), 1900); }
        son("magie"); if (t === "adore") t3Coeurs(scTf, 4);
        tfSuite(j);
      }), 420);
    }, 380);
  }
  // « plus court » : il ne détaille plus les trois places ; il va droit à la promesse
  async function tfSuite(j) {
    const p = $(".t3-dit p", vTf), i4 = T3.mots["trois-4"];
    quandMot(p, i4[0], tfCarnet); quandMot(p, i4[1], tfBon);
    if (!(await pause(450, j)) || !(await t3Dire(vTf, "trois-4")) || !(await pause(450, j))) return;
    tfPret();
  }
  // un prénom s'écrit au carnet : le sien s'il a promis, sinon celui de Jeanne, qui arrive
  function tfCarnet() {
    if (TF.choix !== "promis" && !TF.foule.some((f) => f.id === "jeanne")) {
      TF.foule.push({ id: "jeanne", nom: "Jeanne", look: "soleil", type: "promis", recent: true, neuf: true, ecrit: true, d: "0" });
      t3Rendre(scTf, TF.foule); son("pop");
    }
    const c = $(".t3-carnet", scTf); c.classList.add("zoom"); son("billet"); t3Place(scTf, "promis");
    plus(() => c.classList.remove("zoom"), 2600);
  }
  function tfBon() {
    const lui = TF.choix === "promis", plus_ = "Son petit plus : " + T3.bon.charAt(0).toLowerCase() + T3.bon.slice(1);
    $("#tf-bon-t").textContent = (lui ? "Votre promesse · " : "Ceux qui promettent · ") + T3.lieu;
    $("#tf-bon-b").textContent = lui ? T3.qui + " vous préviendra" : T3.qui + " les prévient";
    $("#tf-bon-s").textContent = "D’un jour calme · " + plus_.charAt(0).toLowerCase() + plus_.slice(1);
    $("#tf-bon").classList.add("on"); son("piece");
  }
  // tout de suite (le fantôme touché pendant qu'il explique) : sa place, le carnet, le bon
  function tfToutDeSuite() {
    taireVoix(); effacer();
    $('.t3-f3[data-t3="' + TF.choix + '"]', vTf).classList.add("ouverte", "on");
    if (!TF.foule.some((f) => f.id === "camille")) TF.foule.push(Object.assign(camille(TF.choix), { moi: true, ecrit: true }));
    TF.foule.forEach((f) => { f.neuf = false; });
    t3Rendre(scTf, TF.foule);
    const c = scTf._fg.get("camille"); if (c) c.classList.remove("cache");
    vTf.classList.add("vitrine");
    tfCarnet(); tfPret();
  }
  function tfPret() {
    if (!TF.choix) return;
    TF.pret = true;
    if (!$("#tf-bon").classList.contains("on")) tfBon();
    $("#tf-go").hidden = false; viser("#tf-go"); son("pret");
  }
  $$(".t3-f3", vTf).forEach((b) => b.addEventListener("click", (e) => {
    if (fini || DEMOS[vue].moments[idx].id !== "trois" || TF.choix) return;
    e.stopPropagation(); contexte(); tfChoisir(b.dataset.t3);
  }));
  $("#tf-go").addEventListener("click", (e) => {
    if (fini || DEMOS[vue].moments[idx].id !== "trois" || !TF.pret) return;
    e.stopPropagation(); contexte(); son("pop"); aller(idx + 1, true);
  });

  /* ── 2. SON COMPTOIR : MIKE, SON ASSISTANT ──
     Une conversation. Mike ne dit que ce que ClikMe sait (ceux qui ont promis, les réponses, les bons
     scannés, la prochaine vidéo) ; ce qu'il ne peut pas savoir (c'est calme), le commerçant le lui dit
     d'un appui. Seul Mike parle. */
  const vTv = $("#v-tv"), fil = $("#mk-fil"), C = T3.creux;
  const TV = { calme: false, appele: false, plan: false, planifie: false, fini: false, bulle: null };
  // ceux qui ont promis : ceux qui vont répondre d'abord, puis les autres
  const tvPromis = () => C.reponses.map(([nom]) => nom).concat(T3_NOMS.filter((n) => !C.reponses.some(([r]) => r === n))).slice(0, T3.compte[1]);
  const mkEl = (balise, cl, texte) => { const e = document.createElement(balise); if (cl) e.className = cl; if (texte != null) e.textContent = texte; return e; };
  // une ligne du fil : elle arrive en bas ; les plus anciennes montent et sortent
  function mkAjouter(e) {
    fil.appendChild(e);
    while (fil.children.length > 12) fil.firstElementChild.remove();
    return e;
  }
  /* Mike écrit (trois points), puis dit sa réplique, mot à mot, avec sa voix. quand : [[n° du mot, fn], …] */
  async function mkDire(nom, quand) {
    const j = jetonVoix, texte = T3.textes[nom];
    const l = mkEl("div", "mk-l parle"), f = mkEl("span", "t3-fant"), p = mkEl("p", "mk-tape");
    f.setAttribute("aria-hidden", "true");
    [["fermee", T3.fant[0]], ["ouverte", T3.fant[1]]].forEach(([c, src]) => { const i = mkEl("img", c); i.src = src; i.alt = ""; f.appendChild(i); });
    p.innerHTML = "<i></i><i></i><i></i>";
    l.append(f, p);
    $$(".mk-l.parle", fil).forEach((x) => x.classList.remove("parle"));
    mkAjouter(l); TV.bulle = [l, p, texte];
    if (!(await pause(520, j))) return false;
    p.className = ""; p.textContent = "";
    if (!TEMPS[nom]) { p.textContent = texte.replace(/\*/g, ""); (quand || []).forEach(([, fn]) => fn()); return pause(texte.split(" ").length * 330, j); }
    (quand || []).forEach(([n, fn]) => quandMot(p, n, fn));
    return prononcer(f, p, texte, nom);
  }
  // on lui coupe la parole (il a touché avant la fin) : sa bulle s'écrit d'un coup
  function mkTaire() {
    taireVoix(); viser(null);
    if (!TV.bulle) return;
    const [l, p, texte] = TV.bulle;
    TV.bulle = null; l.classList.remove("parle"); p.className = "";
    if ($$(".fx-mot", p).length < texte.split(" ").length) p.textContent = texte.replace(/\*/g, "");
  }
  // lui : sa bulle, à droite
  function mkMoi(texte, petit) {
    const b = mkEl("div", "mk-moi");
    if (petit) b.appendChild(mkEl("small", "", petit));
    b.append(texte); son("pop");
    return mkAjouter(b);
  }
  // ce que Mike montre : une carte sous sa bulle (icône, titre, ligne, détail, chiffre)
  function mkCarte(icone, petit, gros, sous, cl, chiffre) {
    const c = mkEl("div", "mk-c tv-carte" + (cl ? " " + cl : "")), s = mkEl("span");
    c.appendChild(mkEl("i", "", icone)).setAttribute("aria-hidden", "true");
    s.append(mkEl("small", "", petit), mkEl("b", "", gros), mkEl("em", "", sous));
    c.appendChild(s);
    if (chiffre) { const n = mkEl("strong"); n.append(mkEl("b", "", chiffre[0]), mkEl("small", "", chiffre[1])); c.appendChild(n); }
    return mkAjouter(c);
  }
  function mkChoix(oui, quoi, non) {
    const z = $("#mk-choix");
    $("#mk-oui").textContent = oui; $("#mk-non").textContent = non || "Plus tard"; z.dataset.quoi = quoi;
    z.hidden = false; viser("#mk-oui"); son("pret");
  }
  function tvEntrer() {
    const j = jetonVoix;
    Object.assign(TV, { calme: false, appele: false, plan: false, planifie: false, fini: false, bulle: null });
    fil.innerHTML = ""; mkAjouter(mkEl("div", "mk-date", "Aujourd’hui · " + HEURES.tv.replace(":", " h ")));
    $("#mk-choix").hidden = true;
    (async () => {
      if (!(await pause(450, j))) return;
      // « 11 personnes ont promis… » : le carnet ; « aucune n'est encore passée »
      if (!(await mkDire("mike-bonjour", [[T3.mots["mike-bonjour"][0], tvCarnet]])) || !(await pause(250, j))) return;
      // « Si c'est calme aujourd'hui, je peux les prévenir pour vous. On le fait ? » : il répond d'un appui
      if (!(await mkDire("mike-question")) || !(await pause(200, j))) return;
      mkChoix("Oui, préviens\u2011les", "calme", "Pas aujourd’hui");
    })();
  }
  function tvCarnet() {
    if ($(".tv-carnet", fil)) return;
    const noms = tvPromis();
    mkCarte("📌", "Ceux qui ont promis de venir", noms.slice(0, 4).join(" · ") + (noms.length > 4 ? " +" + (noms.length - 4) : ""),
      "Leur bon : " + T3.bon.charAt(0).toLowerCase() + T3.bon.slice(1), "tv-carnet", [String(noms.length), "promesses"]);
    son("billet");
  }
  // « Oui, c'est calme : préviens-les ! » : c'est lui qui le dit ; Mike lui montre le message avant qu'il parte
  function mkCalme() {
    if (TV.calme || DEMOS[vue].moments[idx].id !== "creux") return;
    mkTaire();
    const j = jetonVoix;
    TV.calme = true; $("#mk-choix").hidden = true;
    tvCarnet(); mkMoi(C.calme);
    (async () => {
      if (!(await pause(500, j))) return;
      const vise = () => { if (!TV.appele) viser("#tv-envoyer"); };
      if (!(await mkDire("mike-message", [[0, tvBrouillon], [T3.mots["mike-message"][1], vise]]))) return;
      vise();
    })();
  }
  // le message prêt à partir : à qui, le texte, et « Envoyer aux 11 personnes »
  function tvBrouillon() {
    if ($(".tv-brouillon", fil)) return;
    const noms = tvPromis(), c = mkEl("div", "mk-c tv-brouillon"), t = mkEl("div", "tv-b-t"), a = mkEl("div", "tv-a"), b = mkEl("button", "mk-ch fort tv-envoyer", "Envoyer aux " + noms.length + " personnes");
    t.append(mkEl("small", "", "À ceux qui ont promis · " + noms.length + " personnes"));
    noms.slice(0, 5).forEach((n) => a.appendChild(mkEl("span", "", n)));
    if (noms.length > 5) a.appendChild(mkEl("span", "", "+" + (noms.length - 5)));
    b.type = "button"; b.id = "tv-envoyer";
    c.append(t, a, mkEl("p", "tv-msg", T3.appel), b, mkEl("p", "tv-envoye", "✓ Envoyé · rien qu’à eux"));
    mkAjouter(c); son("pop");
  }
  function tvEnvoyer() {
    if (TV.appele || DEMOS[vue].moments[idx].id !== "creux") return;
    mkTaire();
    const j = jetonVoix;
    if (!TV.calme) { TV.calme = true; $("#mk-choix").hidden = true; tvCarnet(); mkMoi(C.calme); }
    TV.appele = true;
    tvBrouillon();
    $(".tv-brouillon", fil).classList.add("envoye"); son("billet");
    tvReponses(j);
  }
  // leurs réponses arrivent, une à une ; un bon est scanné ; le bilan ; la suggestion suivante
  async function tvReponses(j) {
    if (!(await pause(650, j))) return;
    const noms = tvPromis(), pas = 750;
    const c = mkAjouter(mkEl("div", "mk-c tv-reps")), t = mkEl("div", "tv-reps-t"), n = mkEl("b", "", "0 / " + noms.length);
    t.append(mkEl("small", "", "Leurs réponses"), n); c.appendChild(t);
    son("note", 1);
    C.reponses.forEach(([nom, mot], k) => plus(() => {
      const r = mkEl("div", "tv-rep"), im = mkEl("img"), s = mkEl("span");
      im.src = t3img(T3_LOOKS[(k * 2 + 1) % T3_LOOKS.length], "debout"); im.alt = "";
      s.append(mkEl("b", "", nom), mot);
      r.append(im, s, mkEl("em", "", "✓"));
      c.appendChild(r); requestAnimationFrame(() => r.classList.add("on"));
      n.textContent = (k + 1) + " / " + noms.length; son("note", 3 + k * 2);
    }, 350 + k * pas));
    if (!(await pause(350 + C.reponses.length * pas + 800, j))) return;
    // le bon de la première est scanné : elle est venue grâce à la vidéo
    if (!(await mkDire("mike-scan", [[0, () => {
      const r = $(".tv-rep", c); if (r) { r.classList.add("scanne"); $("em", r).textContent = "✓ venue"; }
      mkCarte("✓", "Bon scanné au comptoir", C.reponses[0][0] + " est venue grâce à votre vidéo", "Elle avait promis de venir", "vert");
      son("piece");
    }]])) || !(await pause(300, j))) return;
    if (!(await mkDire("mike-promesse", [[T3.mots["mike-promesse"][0], () => {
      mkCarte("🎉", C.quand + ", grâce à vos promesses", C.bilan[0], C.bilan[1], "tv-bilan");
      son("magie"); etincelles(8);
    }]])) || !(await pause(500, j))) return;
    // et la suite : sa prochaine vidéo
    TV.plan = true;
    if (!(await mkDire("mike-video")) || !(await pause(250, j))) return;
    mkChoix("📅 Oui, jeudi 10 h", "plan");
  }
  function mkPlanifier() {
    if (TV.planifie || !TV.plan || DEMOS[vue].moments[idx].id !== "creux") return;
    mkTaire();
    const j = jetonVoix;
    TV.planifie = true; $("#mk-choix").hidden = true;
    mkMoi("Oui, jeudi 10 h");
    plus(() => { mkCarte("📅", "C’est prévu", "Jeudi, 10 h : votre prochaine vidéo", "Mike vous envoie les questions la veille"); son("pret"); }, 650);
    plus(() => { if (j === jetonVoix && DEMOS[vue].moments[idx].id === "creux") { TV.fini = true; aller(idx + 1); } }, 3000);
  }
  // « Plus tard » : dans la démo, on l'invite à essayer l'autre
  $("#mk-non").addEventListener("click", (e) => {
    if (fini || DEMOS[vue].moments[idx].id !== "creux") return;
    e.stopPropagation(); contexte(); rejouer($("#mk-oui"), "secoue"); viser("#mk-oui");
    plus(() => $("#mk-oui").classList.remove("secoue"), 500);
  });
  $("#mk-oui").addEventListener("click", (e) => {
    if (fini || DEMOS[vue].moments[idx].id !== "creux") return;
    e.stopPropagation(); contexte();
    if ($("#mk-choix").dataset.quoi === "plan") mkPlanifier(); else mkCalme();
  });
  fil.addEventListener("click", (e) => {
    if (fini || DEMOS[vue].moments[idx].id !== "creux" || !e.target.closest(".tv-envoyer")) return;
    e.stopPropagation(); contexte(); tvEnvoyer();
  });

  /* ── LES MOMENTS, À LEUR PLACE DANS « PLUS DE CLIENTS » ── */
  // WhatsApp : sa réponse affichée, un appui passe tout de suite au jour creux
  const mWa = CLIENTS.moments.find((m) => m.id === "whatsapp"), entrerWa = mWa.entrer;
  mWa.entrer = function () { WA.fini = false; entrerWa.call(this); };
  mWa.agir = function () { effacer(); if (WA.fini) aller(idx + 1); else finWhatsapp(); };
  CLIENTS.moments.splice(CLIENTS.moments.findIndex((m) => m.id === "plat") + 1, 0, {
    id: "trois", chap: 4, ecran: "tf", cible: null,
    dit: T3.textes["trois-1"].replace(/\*/g, ""),
    entrer() { tfEntrer(); },
    agir() {
      if (!TF.choix) { tfChoisir(T3.cages[2][0]); return; }
      if (!TF.pret) { tfToutDeSuite(); return; }
      son("pop"); aller(idx + 1, true);
    },
  });
  CLIENTS.moments.splice(CLIENTS.moments.findIndex((m) => m.id === "whatsapp") + 1, 0, {
    id: "creux", chap: 5, ecran: "tv", cible: null,
    dit: T3.textes["mike-bonjour"].replace(/\*/g, ""),
    entrer() { tvEntrer(); },
    agir() {
      if (!TV.calme) { mkCalme(); return; }
      if (!TV.appele) { tvEnvoyer(); return; }
      if (TV.plan && !TV.planifie && !$("#mk-choix").hidden) { mkPlanifier(); return; }
      if (TV.planifie) return;
      taireVoix(); effacer(); TV.fini = true; aller(idx + 1);
    },
  }, {
    // le ticket de « Plus de clients », sur son WhatsApp, avec son jour calme rempli
    id: "ticket", chap: 5, ecran: "wa", cible: null,
    dit: "Plus de clients.",
    entrer() {
      $("#wa-texte").textContent = message(); $("#wa-reponse").textContent = reponse();
      ["#wa-notif", "#wa-ecrit", "#wa-bilan", "#tampon-c"].forEach((s) => $(s).classList.remove("on"));
      ["#wa-recu", "#wa-moi"].forEach((s) => $(s).classList.add("on"));
      $("#wb-vitrine").textContent = C.ticket;
      plus(finClients, 450);
    },
    agir() { effacer(); finClients(); },
  });
"""


def html_tete(t):
    """L'en-tête du comptoir de ce tour (celui de « Moins de dépenses »), et celui des écrans du client."""
    m = re.search(r'<div class="cz-tete"><img class="cz-av".*?<div class="cz-pastilles"[^>]*>.*?</div></div>', t)
    h = re.search(r'<header class="xr-haut" aria-hidden="true">.*?</header>', t)
    if not m or not h:
        raise SystemExit("en-têtes introuvables")
    return m.group(0), h.group(0)


for d, M in METIERS.items():
    page = f"{S}/{d}/index.html"
    t = open(page, encoding="utf-8").read()

    # les images : les fantômes des habitants, l'intérieur du commerce, son fantôme qui salue
    os.makedirs(f"{S}/{d}/tf", exist_ok=True)
    for look in LOOKS:
        for pose in POSES:
            shutil.copyfile(f"{P}/g/{look}-{pose}.webp", f"{S}/{d}/tf/{look}-{pose}.webp")
    if M["interieur"][0] == "copie":
        shutil.copyfile(M["interieur"][1], f"{S}/{d}/tf-interieur.webp")
    else:  # le haut de sa photo de salle (sans le comptoir), en paysage, comme une vitrine
        ffmpeg("-i", f"{S}/{d}/{M['interieur'][1]}", "-vf", "crop=640:560:0:0,scale=400:350", "-c:v", "libwebp", "-quality", "78", f"{S}/{d}/tf-interieur.webp")
    hote = M["hote"] if os.path.isabs(M["hote"]) else f"{S}/{d}/{M['hote']}"
    shutil.copyfile(hote, f"{S}/{d}/tf-hote.webp")

    # les voix
    textes = dict(COMMUNES)
    textes["trois-2"] = M["trois2"]
    textes["mike-bonjour"] = bonjour(M)
    temps = {}
    for nom, txt in textes.items():
        dst = f"{S}/{d}/{nom}.mp3"
        if nom == "trois-2":
            temps[nom] = preparer(f"{R}/trois-2-restaurant.mp3", dst, txt) if M["metier"] == "restaurant" else coller(f"{R}/trois-2-{M['metier']}.mp3", dst, txt)
        elif nom == "mike-bonjour":
            temps[nom] = preparer(f"{R}/mike-bonjour-{M['metier']}.mp3", dst, txt)
        else:
            temps[nom] = preparer(f"{R}/{nom}.mp3", dst, txt)
    # celles des versions précédentes (les trois places, la vitrine, le petit mot, le partage, « Mardi, 11 h »)
    for vieille in ("trois-3", "vitrine-1", "vitrine-2", "vitrine-3", "vitrine-4", "vitrine-5", "vitrine-6", "creux-1", "creux-2", "creux-3", "mike-appeler"):
        if os.path.exists(f"{S}/{d}/{vieille}.mp3"):
            os.remove(f"{S}/{d}/{vieille}.mp3")
    # les mots où quelque chose se passe à l'écran
    t2 = textes["trois-2"]
    mots = {
        "trois-2": [0, mot(t2, "je"), mot(t2, "ou", 1), mot(t2, "Touchez")],
        "trois-4": [mot(textes["trois-4"], "carnet"), mot(textes["trois-4"], "relancer")],
        "mike-bonjour": [mot(textes["mike-bonjour"], "promis")],
        "mike-message": [0, mot(textes["mike-message"], "Touchez")],
        "mike-promesse": [mot(textes["mike-promesse"], "promesse")],
    }
    T3 = {k: M[k] for k in ("lieu", "sous", "carte", "qui", "cages", "pose3", "heures", "compte", "creux")}
    T3.update(textes=textes, mots=mots, bon=M["bon"], appel=M["appel"])

    # l'écran : ses couleurs, son fantôme (bouche fermée, ouverte), ses en-têtes
    fant = re.search(r'const src = ouverte \? "([^"]+)" : "([^"]+)";', t)
    if not fant:
        raise SystemExit(f"{d} : la bouche du fantôme introuvable")
    T3["fant"] = [fant.group(2), fant.group(1)]
    tete, haut = html_tete(t)
    film_fin = re.search(r'voix: \{ src: "[^"]+", affiche: "[^"]+", fin: "([^"]+)"', t).group(1)
    couleurs = ";".join(f"--{k}:{v}" for k, v in M["couleurs"].items())
    cages = "".join(f'<button type="button" class="t3-f3 {c}" data-t3="{c}"><span class="t3-cg"><i class="t3-anneau"></i><i class="t3-noeud"></i>'
                    f'<span class="t3-dome"><img src="tf/cosy-debout.webp" alt=""><i class="t3-porte-c"></i></span><i class="t3-socle"></i></span><b>{b}</b><small>{s}</small></button>'
                    for c, b, s in M["cages"])
    html = (HTML.replace("__COULEURS__", couleurs).replace("__FIN__", film_fin).replace("__HAUT__", haut).replace("__TETE__", tete)
            .replace("__FANT__", fant.group(2)).replace("__FANT_PARLE__", fant.group(1)).replace("__CHEZ__", M["chez"]).replace("__CAGES__", cages)
            .replace("__BON__", M["bon"]).replace("__BON_MIN__", M["bon"][0].lower() + M["bon"][1:]).replace("__TENTE__", M["tente"]).replace("__APPEL__", M["appel"]))
    t = une_fois(t, "          <!-- ══ MOINS DE DÉPENSES : 0. COMMENT ÇA MARCHE ══", html.lstrip("\n") + "\n          <!-- ══ MOINS DE DÉPENSES : 0. COMMENT ÇA MARCHE ══", f"{d} écrans")
    t = une_fois(t, '<div class="wb-l wb-zero">', BILAN + '<div class="wb-l wb-zero">', f"{d} ticket")
    t = une_fois(t, "</style>\n", CSS.lstrip("\n") + "</style>\n", f"{d} style")

    # le film fini : plus d'avis à trois petits fantômes, on passe aux trois cages
    t = une_fois(t, "    dire(\"Et à la fin, votre client dit ce qu’il en pense, d’un geste : trois petits fantômes. Vous le voyez dans votre comptoir.\");\n    viser(\"#e2-avis-rang\");\n",
                 "    plus(() => { if (DEMOS[vue].moments[idx].id === \"plat\") aller(idx + 1, true); }, 1300);\n", f"{d} fin du film")
    # revenir au film (‹) le relance
    t = une_fois(t, "if (film.paused && !e2.classList.contains(\"fin\")) lancerFilm();", "if (film.paused) lancerFilm();", f"{d} retour au film")
    # WhatsApp ne finit plus la démo : sa vitrine suit, puis le ticket (l'ancienne fin devient finClients)
    t = une_fois(t, "  function finWhatsapp() {\n",
                 "  /* LA DEMANDE EST LÀ : sa vitrine suit (voir tour-trois.py), puis le ticket (finClients) */\n"
                 "  const WA = { fini: false };\n"
                 "  function finWhatsapp() {\n"
                 "    $(\"#wa-notif\").classList.remove(\"on\"); $(\"#wa-ecrit\").classList.remove(\"on\");\n"
                 "    [\"#wa-recu\", \"#wa-moi\"].forEach((s) => $(s).classList.add(\"on\"));\n"
                 "    WA.fini = true;\n"
                 "    if (DEMOS[vue].moments[idx].id === \"whatsapp\") plus(() => aller(idx + 1), 1900);\n"
                 "  }\n"
                 "  function finClients() {\n", f"{d} fin de WhatsApp")

    js = (JS.replace("__T3__", json.dumps(T3, ensure_ascii=False)).replace("__TEMPS_T3__", json.dumps(temps))
          .replace("__ENR_T3__", json.dumps(sorted(temps))))
    t = une_fois(t, "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", js.lstrip("\n") + "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", f"{d} js")
    open(page, "w", encoding="utf-8").write(t)
    print(d, "· trois fantômes, Mike :", " ".join(f"{k} {v['d']:.2f} s" for k, v in temps.items()))
