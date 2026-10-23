# LES TROIS FANTÔMES, DANS LE TOUR (restaurant, vêtements, coiffure). Deux étapes de plus dans « Plus de
# clients », reprises du prototype outils/trois-fantomes :
#   1. « Les trois fantômes » (côté client, à la fin de sa vidéo, à la place des trois petits fantômes
#      d'avis) : trois cages ; il en touche une, son fantôme s'envole se placer dans la vitrine du
#      commerce (devant, à la porte, ou dedans) ; s'il promet, son prénom s'écrit au carnet, avec un bon.
#      La troisième cage mène à la suite : la demande de table (de mise de côté, de rendez-vous).
#   2. « Votre vitrine » (côté commerçant, après WhatsApp) : la vitrine qui se remplit, les trois
#      compteurs, le carnet, « Appeler mes promesses », le bon scanné, le petit mot, le partage.
# Puis le ticket de « Plus de clients », avec une ligne de plus : sa vitrine.
# Les voix (enregistrements ElevenLabs « Mike ») : recu/trois/. Communes : trois-1, trois-4, vitrine-1 à 6 ;
# par métier : trois-2-<métier> (« J'adore, je viendrai… ») suivi de « Touchez une cage. » (la fin de
# trois-2-restaurant) ; trois-3 n'est dit en entier (« …devant, à la porte, ou à table. ») qu'au restaurant :
# ailleurs il s'arrête à « …dans votre vitrine. », tant que recu/trois/trois-3-<métier>.mp3 n'existe pas.
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
NB = " "
LOOKS = ["denim", "fleuri", "rebelle", "soleil", "curieux", "voyageur", "artiste", "cosy"]  # le dernier : Camille
POSES = ["debout", "salue", "assis"]
# « Touchez une cage. », pris à la fin de trois-2-restaurant (après son silence, à 3,16 s)
TOUCHEZ_DE = 3.45
# « Son fantôme vient se placer dans votre vitrine, » : la voix s'arrête à 2,34 s
VITRINE_A = 2.42

COMMUNES = {
    "trois-1": "À la fin de votre vidéo, votre client ne met pas juste un «" + NB + "j’aime" + NB + "»" + NB + ": il choisit un des *trois *fantômes.",
    "trois-4": "Et s’il promet de venir, son prénom s’écrit dans votre carnet, avec un petit *cadeau pour tenir parole.",
    "vitrine-1": "Et vous, chaque matin, vous voyez votre vitrine se *remplir.",
    "vitrine-2": "Ceux qui ont adoré, ceux qui ont promis, ceux qui viennent. Même un jour calme, vous voyez qui pense à vous.",
    "vitrine-3": "Ceux qui ont promis, vous les *rappelez d’un geste. Un message à eux seuls, jamais à toute la ville. Touchez «" + NB + "Appeler mes promesses" + NB + "».",
    "vitrine-4": "Quand leur bon est scanné au comptoir, vous savez qu’ils sont venus *grâce à votre vidéo.",
    "vitrine-5": "Vos clients vous écrivent aussi un petit mot. Vous choisissez ceux qui s’affichent, et parfois, vous offrez un *café.",
    "vitrine-6": "Et chacun partage la vidéo, avec sa vitrine à lui" + NB + ": ses amis le rejoignent, sans appli. Votre *bouche-à-oreille, en direct.",
}
TROIS_3 = "Son fantôme vient se placer dans votre vitrine" + NB + ": devant, à la porte, ou {fin}."
TROIS_3_COURT = "Son fantôme vient se placer dans votre vitrine."

# Ce qui change d'un métier à l'autre. Les commerces sont ceux des démos (fictifs) ; chiffres et cadeaux : exemples.
METIERS = {
    "tour": dict(
        metier="restaurant", lieu="Chez Bergine", sous="BISTROT · DAX", chez="chez Bergine", carte="Magret · Garbure · Axoa", qui="Jean-Marie",
        trois2="J’adore, je viendrai, ou j’y vais aujourd’hui. Touchez une cage.", fin3="à table",
        cages=[["adore", "💗 J’adore", "« J’ai aimé ta vidéo »"], ["promis", "📌 Je viendrai", "« Promis, je passe un jour »"], ["table", "🍽️ J’y vais", "« Garde-moi une place »"]],
        ici=["💗 devant", "📌 à la porte", "🍽️ à table"], pose3="assis", heures=["12 h 30", "13 h", "12 h 15"],
        compteurs=["ont adoré", "ont promis", "viennent ce midi"], compte=[36, 11, 2],
        bon="Le café offert", mot=["Lina", "Votre magret m’a rappelé celui de ma grand-mère"],
        appel="Plus que 6 magrets ce midi ! Votre café vous attend.", tente="Ça me tente →",
        couleurs=dict(f1="#62182B", f2="#45101F", s1="#F3E5D0", s2="#8E1C33", ens="#2C0912", vit="#2A0810"),
        interieur=("copie", f"{P}/interieur.webp"), hote=f"{P}/bergine-salue.webp",
    ),
    "tour-vetements": dict(
        metier="vetements", lieu="Maison Lou", sous="BOUTIQUE · DAX", chez="chez Maison Lou", carte="Manteaux · Mailles · Jeans", qui="Lou",
        trois2="J’adore, je viendrai l’essayer, ou mettez-la-moi de côté. Touchez une cage.", fin3="en cabine",
        cages=[["adore", "💗 J’adore", "« J’ai aimé ta vidéo »"], ["promis", "📌 Je viendrai", "« Promis, je viens l’essayer »"], ["table", "🛍️ De côté", "« Mettez-la-moi de côté »"]],
        ici=["💗 devant", "📌 à la porte", "🛍️ mise de côté"], pose3="debout", heures=["de côté", "de côté", "de côté"],
        compteurs=["ont adoré", "ont promis", "mis de côté"], compte=[31, 9, 3],
        bon="Les retouches offertes", mot=["Inès", "Le manteau camel, je l’ai essayé : coup de foudre"],
        appel="Le manteau camel est revenu en 38 ! Vos retouches vous attendent.", tente="Ça me tente →",
        couleurs=dict(f1="#4A3A2E", f2="#2F241C", s1="#F1E6D6", s2="#2A211B", ens="#1E1712", vit="#1E1712"),
        interieur=("e1", "e1.webp"), hote="fant-viens.webp",
    ),
    "tour-coiffure": dict(
        metier="coiffure", lieu="Salon Clara", sous="COIFFURE · DAX", chez="au Salon Clara", carte="Coupe · Couleur · Soin", qui="Clara",
        trois2="J’adore, je prendrai rendez-vous, ou un créneau aujourd’hui. Touchez une cage.", fin3="dans le fauteuil",
        cages=[["adore", "💗 J’adore", "« J’ai aimé ta vidéo »"], ["promis", "📅 Je prendrai RDV", "« Promis, je prends rendez-vous »"], ["table", "✂️ Aujourd’hui", "« Un créneau aujourd’hui »"]],
        ici=["💗 devant", "📌 à la porte", "✂️ au fauteuil"], pose3="assis", heures=["15 h 30", "17 h", "11 h"],
        compteurs=["ont adoré", "ont promis", "viennent aujourd’hui"], compte=[28, 10, 3],
        bon="Le soin offert", mot=["Sarah", "Ma coupe tient encore trois semaines après, merci Clara"],
        appel="Deux créneaux libres cet après-midi ! Votre soin vous attend.", tente="Ça me tente →",
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
    t = aligner(FF, dst, texte)
    if len(t["m"]) != len(texte.split(" ")):
        raise SystemExit(f"{dst} : {len(t['m'])} instants pour {len(texte.split(' '))} mots")
    return t


def preparer(src, dst, texte, couper=None):
    """La voix, sans ses silences de bord ; « couper » : elle s'arrête là (en secondes), en fondu."""
    af = (f"atrim=end={couper},afade=t=out:st={couper - 0.1}:d=0.1," if couper else "") + NETTOYER
    ffmpeg("-i", src, "-af", af, "-c:a", "libmp3lame", "-q:a", "3", dst)
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
.t3-fg{position:absolute;height:calc(var(--s) * 15.5cqw);aspect-ratio:.91;transform:translate(-50%,-100%);transition:left .6s,top .6s,opacity .4s}
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
.t3-tag{position:absolute;left:50%;top:-4%;transform:translate(-50%,-100%);padding:.3cqw 1.2cqw;border-radius:.8cqw;background:#FFF8EA;color:var(--encre);font:700 2.3cqw/1.2 var(--titre);white-space:nowrap}
.t3-fg.moi .t3-tag,.t3-fg.vedette .t3-tag{top:-34%}
.t3-fg.scanne::after{content:"✓";position:absolute;right:-6%;top:6%;width:5cqw;height:5cqw;border-radius:50%;background:var(--menthe);color:#06281C;display:grid;place-items:center;font:900 3cqw/1 var(--titre);box-shadow:0 .3cqw .7cqw rgba(0,0,0,.45)}
.t3-fg.saute img{animation:t3-saute .6s cubic-bezier(.3,1.6,.5,1)}
@keyframes t3-saute{40%{transform:translateY(-22%) scale(1.06)}}
/* les trois places, quand il les dit */
.t3-ici{position:absolute;z-index:460;padding:.7cqw 2.2cqw;border-radius:9cqw;background:#fff;color:#1E1E22;font:800 3.1cqw/1.2 var(--titre);white-space:nowrap;box-shadow:0 1cqw 2cqw rgba(0,0,0,.45);transform:translate(-50%,-50%) scale(.4);opacity:0;transition:opacity .25s,transform .45s var(--ease);pointer-events:none}
.t3-ici.on{opacity:1;transform:translate(-50%,-50%)}
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
.tf.vitrine .t3-dit{top:33.2em}
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
.tf-bon{position:absolute;left:.9em;right:.9em;top:38.4em;display:flex;align-items:center;gap:.7em;padding:.6em .8em;border-radius:1em;background:#FFF8EA;color:var(--encre);box-shadow:0 .8em 1.6em -.6em rgba(0,0,0,.8);
  opacity:0;transform:translateY(1em) scale(.96);transition:opacity .35s,transform .5s var(--ease)}
.tf-bon.on{opacity:1;transform:none}
.tf-bon > i{flex:none;display:grid;place-items:center;width:2.4em;height:2.4em;border-radius:.7em;background:linear-gradient(135deg,#FF4FA8,#E0167A);font-style:normal;font-size:1.1em}
.tf-bon span{min-width:0}
.tf-bon small{display:block;font-size:.62em;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#E0167A}
.tf-bon b{display:block;font-size:.96em;line-height:1.2}
.tf-bon em{display:block;font-style:normal;font-size:.66em;color:#6A5444}
.tf .go{position:absolute;left:.9em;right:.9em;width:auto;bottom:2em}

/* ── 2. SON COMPTOIR : VOTRE VITRINE ── */
.tv .t3-dit{top:5.2em;z-index:30}
.tv .t3-sc{left:.9em;right:.9em;top:10.6em}
.tv-zone{position:absolute;left:.9em;right:.9em;top:38.9em;bottom:6.5em}
.tv.appele .tv-zone{bottom:1.8em}
.tv-compte{position:absolute;inset:0 0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:.4em;transition:opacity .3s,transform .4s}
.tv-compte span{display:flex;flex-direction:column;align-items:center;padding:.4em .2em .35em;border-radius:.9em;background:rgba(255,255,255,.06);border:1px solid var(--trait);transition:background .3s,border-color .3s,transform .4s var(--ease)}
.tv-compte b{font-size:1.45em;font-weight:900;line-height:1;font-variant-numeric:tabular-nums}
.tv-compte small{font-size:.62em;color:var(--gris);text-align:center;line-height:1.15}
.tv-compte .adore b{color:#FF5DB8}.tv-compte .promis b{color:var(--ambre)}.tv-compte .table b{color:var(--menthe)}
.tv-compte span.voit{transform:scale(1.08);background:rgba(255,46,154,.18);border-color:rgba(255,46,154,.6)}
.tv-carte{position:absolute;inset:0 0 auto;display:flex;align-items:center;gap:.65em;padding:.6em .75em;border-radius:1em;background:#FFF8EA;color:var(--encre);box-shadow:0 .8em 1.6em -.6em rgba(0,0,0,.8);
  opacity:0;transform:translateY(.8em) scale(.97);transition:opacity .35s,transform .5s var(--ease);pointer-events:none}
.tv-carte.on{opacity:1;transform:none}
.tv-zone.carte .tv-compte{opacity:0;transform:translateY(-.6em)}
.tv-carte > i{flex:none;display:grid;place-items:center;width:2.3em;height:2.3em;border-radius:.7em;font-style:normal;font-size:1.05em;background:#FFE2EF}
.tv-carte > img{flex:none;width:2.6em;height:2.6em;object-fit:contain}
.tv-carte span{flex:1;min-width:0}
.tv-carte small{display:block;font-size:.6em;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#E0167A}
.tv-carte b{display:block;font-size:.84em;line-height:1.22}
.tv-carte em{display:block;font-style:normal;font-size:.64em;color:#6A5444;line-height:1.25}
.tv-carte strong{flex:none;display:flex;flex-direction:column;align-items:center;font-size:1.5em;font-weight:900;line-height:1;color:#E0167A}
.tv-carte strong small{font-size:.38em;letter-spacing:.04em;color:#6A5444;text-transform:none;font-weight:700}
.tv-mot q{display:block;margin:.1em 0 .35em;font:italic 700 .86em/1.25 Georgia,serif;quotes:"« " " »"}
.tv-mot .tv-boutons{display:flex;gap:.35em}
.tv-mot .tv-boutons i{font-style:normal;padding:.3em .6em;border-radius:1em;font-size:.66em;font-weight:800;background:#FFE08A;color:#5A3A00;transition:transform .3s var(--ease),box-shadow .3s}
.tv-mot .tv-boutons i + i{background:#2A1A10;color:#fff}
.tv-mot .tv-boutons i.on{transform:scale(1.1);box-shadow:0 0 0 .18em #FF2E9A}
.tv .go{position:absolute;left:.9em;right:.9em;width:auto;bottom:2em}
.tv-envoi{position:absolute;left:0;right:0;bottom:0;z-index:40;padding:1em .95em 1.6em;border-radius:1.4em 1.4em 0 0;background:#1C120E;border-top:1px solid var(--trait);box-shadow:0 -1em 2em rgba(0,0,0,.5);
  transform:translateY(105%);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.tv-envoi.on{transform:none}
.tv-envoi h4{margin:0;font-size:1em;font-weight:800}
.tv-envoi > p{margin:.2em 0 .6em;font-size:.7em;color:var(--gris)}
.tv-a{display:flex;flex-wrap:wrap;gap:.3em;margin-bottom:.7em}
.tv-a span{padding:.25em .6em;border-radius:1em;background:rgba(245,162,58,.16);border:1px solid rgba(245,162,58,.45);font-size:.66em;font-weight:800}
.tv-msg{margin:0 0 .7em auto;max-width:86%;padding:.6em .8em;border-radius:1em 1em .3em 1em;background:linear-gradient(135deg,#FF4FA8,#E0167A);color:#fff;font-size:.82em;font-weight:700;line-height:1.3}
.tv-envoye{display:flex;align-items:center;gap:.45em;font-size:.74em;font-weight:800;color:var(--menthe);opacity:0;transition:opacity .3s}
.tv-envoi.envoye .tv-envoye{opacity:1}
@media (prefers-reduced-motion: reduce){
  .t3-fg img,.t3-fg.neuf,.t3-cg,.t3-dome img,.t3-fant{animation:none!important}
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
            <div class="tf-bon" id="tf-bon"><i aria-hidden="true">🎁</i><span><small id="tf-bon-t"></small><b>__BON__</b><em id="tf-bon-s"></em></span></div>
            <button type="button" class="go" id="tf-go" hidden>__TENTE__</button>
          </div>

          <!-- ══ 5b. SON COMPTOIR : VOTRE VITRINE (voir tour-trois.py) ══ -->
          <div class="v ex tv" id="v-tv" style="__COULEURS__">
            __TETE__
            <div class="t3-dit"><span class="t3-fant" aria-hidden="true"><img class="fermee" src="__FANT__" alt=""><img class="ouverte" src="__FANT_PARLE__" alt=""></span><p aria-live="polite"></p></div>
            <div class="t3-sc" id="tv-sc" aria-hidden="true"></div>
            <div class="tv-zone" id="tv-zone">
              <div class="tv-compte" id="tv-compte">__COMPTEURS__</div>
              <div class="tv-carte" id="tv-carnet"><i aria-hidden="true">📌</i><span><small>Le carnet · <b id="tv-n-promis" style="display:inline;font-size:inherit"></b> promesses</small><b id="tv-noms"></b><em>Leur bon : __BON_MIN__ · exemple</em></span></div>
              <div class="tv-carte" id="tv-scan"><i aria-hidden="true" style="background:#D7F8EA">✓</i><span><small style="color:#0B7A55">Bon scanné au comptoir</small><b>Léa est venue grâce à votre vidéo</b><em>Elle avait promis mardi · exemple</em></span><strong><b id="tv-venus">3</b><small>grâce à la vidéo</small></strong></div>
              <div class="tv-carte tv-mot" id="tv-mot"><img src="tf/soleil-debout.webp" alt=""><span><small>__MOT_NOM__ · il y a 3 min</small><q>__MOT__</q><span class="tv-boutons"><i id="tv-coeur">💛 Coup de cœur</i><i id="tv-offre">🎁 Offrir…</i></span></span></div>
              <div class="tv-carte" id="tv-partage"><i aria-hidden="true">💌</i><span><small>Venus grâce à un partage</small><b>Les amis de Léa, Hugo et Inès</b><em>Un lien, sans appli ni compte · exemple</em></span><strong><b id="tv-amis">+0</b><small>ce matin</small></strong></div>
            </div>
            <button type="button" class="go" id="tv-appeler" hidden>📣 Appeler mes promesses</button>
            <div class="tv-envoi" id="tv-envoi">
              <h4>📣 Un message à vos promesses</h4>
              <p>À elles seules : jamais à toute la ville.</p>
              <div class="tv-a" id="tv-a"></div>
              <p class="tv-msg">__APPEL__</p>
              <p class="tv-envoye">✓ Envoyé · <span id="tv-envoye-n"></span></p>
            </div>
          </div>
"""

BILAN = '<div class="wb-l"><i>👻</i><span><small>Votre vitrine, ce matin</small><b id="wb-vitrine"></b></span><em>exemple</em></div>'

JS = r"""
  /* ═══ LES TROIS FANTÔMES (voir tour-trois.py) ═══
     À la fin de sa vidéo, le client ne met pas un « j'aime » : il choisit un des trois fantômes, qui
     s'envole se placer dans la vitrine du commerce. Puis le comptoir : sa vitrine qui se remplit, le
     carnet des promesses, l'appel, le bon scanné, le petit mot, le partage. Chiffres : exemples. */
  const T3 = __T3__;
  Object.assign(TEMPS, __TEMPS_T3__);
  __ENR_T3__.forEach((n) => { if (!ENREGISTREES.includes(n)) ENREGISTREES.push(n); });
  HEURES.tf = "12:05"; HEURES.tv = "12:08";
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
  const T3_SIEGES = [{ x: 45, y: 82, s: .74 }, { x: 22, y: 85, s: .82 }, { x: 65, y: 86, s: .82 }, { x: 84, y: 81, s: .72 }, { x: 33, y: 100, s: .92 }, { x: 74, y: 100, s: .92 }];
  // où s'affichent les trois places quand il les dit (en % de la scène)
  const T3_ICI = { adore: [26, 70], promis: [84, 25], table: [29, 24] };
  const camille = (t) => ({ id: "camille", nom: "Camille", look: "cosy", type: t, heure: T3.heures[0] });

  function t3Scene(el) {
    el.innerHTML = '<div class="t3-fac"></div><div class="t3-ens"><b></b><small></small></div><div class="t3-store"></div>' +
      '<div class="t3-vit"><img src="tf-interieur.webp" alt=""><div class="t3-salle"></div><em></em></div>' +
      '<div class="t3-carnet"><b>Le carnet</b><div class="t3-noms"></div></div><div class="t3-pied"></div>' +
      '<div class="t3-porte"><i></i></div><span class="t3-ouvert">OUVERT</span><img class="t3-hote" src="tf-hote.webp" alt="">' +
      '<div class="t3-trot"></div><div class="t3-calque"></div><span class="t3-plus" hidden></span>' +
      T3.ici.map((t, k) => '<span class="t3-ici" data-ici="' + ["adore", "promis", "table"][k] + '"></span>').join("");
    $(".t3-ens b", el).textContent = T3.lieu; $(".t3-ens small", el).textContent = T3.sous; $(".t3-vit em", el).textContent = T3.carte;
    $$(".t3-ici", el).forEach((s, k) => { s.textContent = T3.ici[k]; const [x, y] = T3_ICI[s.dataset.ici]; s.style.left = x + "%"; s.style.top = y + "%"; });
    el._fg = new Map();
  }
  t3Scene($("#tf-sc")); t3Scene($("#tv-sc"));
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
  const t3Compte = (foule, t) => foule.filter((f) => f.type === t).length;
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
      d.style.left = p.x + "%"; d.style.top = p.y + "%"; d.style.setProperty("--s", p.s); d.style.setProperty("--d", (f.d || 0) + "s");
      d.style.zIndex = couche === "t3-calque" ? String(100 + Math.round(p.y)) : String(10 + Math.round(p.y / 10));
      const im = $("img", d), src = t3img(f.look, T3_POSE[f.type]);
      if (im.getAttribute("src") !== src) im.setAttribute("src", src);
      $(".t3-nom", d).textContent = (f.invite ? "💌 " : "") + f.nom;
      const tag = $(".t3-tag", d);
      if (f.type === "table" && f.heure && (f.moi || f.vedette)) { if (!tag) d.insertAdjacentHTML("beforeend", '<span class="t3-tag"></span>'); $(".t3-tag", d).textContent = f.heure; } else if (tag) tag.remove();
    }
    for (const [cle, d] of el._fg) if (!vus.has(cle)) { d.classList.add("part"); el._fg.delete(cle); setTimeout(() => d.remove(), 450); }
    const plus_ = $(".t3-plus", el);
    plus_.hidden = !reste; plus_.textContent = "+" + reste + " devant la vitrine";
    // le carnet : les trois derniers prénoms
    const noms = $(".t3-noms", el), derniers = foule.filter((f) => f.type === "promis").slice(-3).reverse();
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
  // une place, quand il la dit : son étiquette, et ce qui s'y trouve s'anime
  function t3Place(el, t) {
    const ici = $('.t3-ici[data-ici="' + t + '"]', el);
    if (ici) { ici.classList.add("on"); plus(() => ici.classList.remove("on"), 2200); }
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
        son("magie"); if (t === "adore") t3Coeurs(scTf, 4);
        tfSuite(j);
      }), 420);
    }, 380);
  }
  async function tfSuite(j) {
    const p = $(".t3-dit p", vTf), ix = T3.mots["trois-3"];
    if (ix.length === 3) ["adore", "promis", "table"].forEach((t, k) => quandMot(p, ix[k], () => t3Place(scTf, t)));
    else quandMot(p, ix[0], () => ["adore", "promis", "table"].forEach((t, k) => plus(() => t3Place(scTf, t), k * 650)));
    if (!(await pause(500, j)) || !(await t3Dire(vTf, "trois-3")) || !(await pause(ix.length === 3 ? 400 : 1500, j))) return;
    const i4 = T3.mots["trois-4"];
    quandMot(p, i4[0], tfCarnet); quandMot(p, i4[1], tfBon);
    if (!(await t3Dire(vTf, "trois-4")) || !(await pause(450, j))) return;
    tfPret();
  }
  // un prénom s'écrit au carnet : le sien s'il a promis, sinon celui de Jeanne, qui arrive
  function tfCarnet() {
    if (TF.choix !== "promis" && !TF.foule.some((f) => f.id === "jeanne")) {
      TF.foule.push({ id: "jeanne", nom: "Jeanne", look: "soleil", type: "promis", recent: true, neuf: true, ecrit: true, d: "0" });
      t3Rendre(scTf, TF.foule); son("pop");
    }
    const c = $(".t3-carnet", scTf); c.classList.add("zoom"); son("billet");
    plus(() => c.classList.remove("zoom"), 2600);
  }
  function tfBon() {
    const lui = TF.choix === "promis";
    $("#tf-bon-t").textContent = lui ? "Votre bon de promesse · " + T3.lieu : "Le bon de promesse · " + T3.lieu;
    $("#tf-bon-s").textContent = (lui ? "À montrer en arrivant · valable 7 jours" : "Pour ceux qui promettent de venir · 7 jours") + " · exemple";
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

  /* ── 2. SON COMPTOIR : SA VITRINE ── */
  const vTv = $("#v-tv"), scTv = $("#tv-sc"), zone = $("#tv-zone");
  const TV = { appele: false, fini: false, tout: [], n: 0 };
  function tvCompter() {
    const vus = TV.tout.slice(0, TV.n);
    ["adore", "promis", "table"].forEach((t) => { $("#tv-compte ." + t + " b").textContent = t3Compte(vus, t); });
  }
  function tvMontrer(n) {
    TV.n = Math.min(TV.tout.length, n);
    TV.tout.forEach((f, k) => { f.neuf = k >= TV.n - 1 && k < TV.n; });
    t3Rendre(scTv, TV.tout.slice(0, TV.n)); tvCompter();
  }
  function tvCarte(id) {
    $$(".tv-carte", zone).forEach((c) => c.classList.toggle("on", c.id === id));
    zone.classList.toggle("carte", !!id);
  }
  function tvEntrer() {
    const j = jetonVoix;
    TV.appele = false; TV.fini = false;
    vTv.classList.remove("appele");
    $(".t3-dit", vTv).classList.remove("on"); $(".t3-dit p", vTv).textContent = "";
    $("#tv-appeler").hidden = true; $("#tv-envoi").classList.remove("on", "envoye");
    $$("#tv-compte span").forEach((s) => s.classList.remove("voit"));
    $$(".tv-boutons i", vTv).forEach((i) => i.classList.remove("on")); $("#tv-offre").textContent = "🎁 Offrir…";
    tvCarte(null);
    // la foule du matin, dans l'ordre d'arrivée ; Camille, son fantôme de tout à l'heure, en vedette
    TV.tout = t3Foule(T3.compte[0], T3.compte[1], T3.compte[2], false);
    TV.tout.splice(5, 0, Object.assign(camille(TF.choix || "table"), { vedette: true }));
    $(".t3-noms", scTv).dataset.noms = "";
    tvMontrer(0);
    (async () => {
      if (!(await pause(500, j))) return;
      // elle se remplit pendant qu'il le dit
      son("eveil");
      let k = 0;
      const t = chaque(() => { if (TV.n >= TV.tout.length) { clearInterval(t); return; } tvMontrer(TV.n + 1); if (++k % 5 === 0 && k < 40) son("carte", k / 5); }, 85);
      if (!(await t3Dire(vTv, "vitrine-1")) || !(await pause(300, j))) return;
      tvMontrer(TV.tout.length);
      const p = $(".t3-dit p", vTv), ix = T3.mots["vitrine-2"];
      ["adore", "promis", "table"].forEach((t, k) => quandMot(p, ix[k], () => { const s = $("#tv-compte ." + t); s.classList.add("voit"); plus(() => s.classList.remove("voit"), 1400); t3Place(scTv, t); }));
      quandMot(p, ix[3], () => t3Coeurs(scTv, 5));
      if (!(await t3Dire(vTv, "vitrine-2")) || !(await pause(350, j))) return;
      const i3 = T3.mots["vitrine-3"];
      quandMot(p, 0, () => { tvCarnet(); });
      quandMot(p, i3[0], () => { $("#tv-appeler").hidden = false; viser("#tv-appeler"); });
      if (!(await t3Dire(vTv, "vitrine-3"))) return;
      $("#tv-appeler").hidden = false; viser("#tv-appeler");
    })();
  }
  function tvCarnet() {
    const promis = TV.tout.filter((f) => f.type === "promis");
    $("#tv-n-promis").textContent = promis.length;
    $("#tv-noms").textContent = promis.slice(0, 4).map((f) => f.nom).join(" · ") + (promis.length > 4 ? " +" + (promis.length - 4) : "");
    tvCarte("tv-carnet");
    rejouer($(".t3-carnet", scTv), "zoom"); plus(() => $(".t3-carnet", scTv).classList.remove("zoom"), 2000);
    t3Place(scTv, "promis");
  }
  function tvAppeler() {
    if (TV.appele || DEMOS[vue].moments[idx].id !== "vitrine") return;
    taireVoix(); viser(null);
    const j = jetonVoix;
    TV.appele = true;
    tvMontrer(TV.tout.length);
    const promis = TV.tout.filter((f) => f.type === "promis");
    $("#tv-a").innerHTML = "";
    promis.slice(0, 5).forEach((f) => { const s = document.createElement("span"); s.textContent = f.nom; $("#tv-a").appendChild(s); });
    if (promis.length > 5) { const s = document.createElement("span"); s.textContent = "+" + (promis.length - 5); $("#tv-a").appendChild(s); }
    $("#tv-envoye-n").textContent = promis.length + " personnes, rien qu’elles";
    $("#tv-appeler").hidden = true; vTv.classList.add("appele");
    const e = $("#tv-envoi"); e.classList.remove("envoye"); e.classList.add("on"); son("pop");
    plus(() => { e.classList.add("envoye"); son("billet"); [...scTv._fg.values()].filter((d) => d.classList.contains("promis")).forEach((d, k) => plus(() => { d.classList.remove("saute"); void d.offsetWidth; d.classList.add("saute"); }, k * 90)); }, 1300);
    plus(() => { e.classList.remove("on"); tvApres(j); }, 3300);
  }
  async function tvApres(j) {
    const p = $(".t3-dit p", vTv), i4 = T3.mots["vitrine-4"], i5 = T3.mots["vitrine-5"], i6 = T3.mots["vitrine-6"];
    // le bon de Léa est scanné : elle est venue grâce à la vidéo
    quandMot(p, 0, () => {
      tvCarte("tv-scan"); son("ding");
      const lea = [...scTv._fg.values()].find((d) => $(".t3-nom", d).textContent === "Léa");
      if (lea) lea.classList.add("scanne");
    });
    quandMot(p, i4[0], () => { const b = $("#tv-venus"); b.textContent = "4"; rejouer(b.parentNode, "voit"); son("piece"); });
    if (!(await t3Dire(vTv, "vitrine-4")) || !(await pause(400, j))) return;
    // un petit mot : il le met en vitrine, et parfois, il offre un café
    quandMot(p, 0, () => { tvCarte("tv-mot"); son("pop"); });
    quandMot(p, i5[0], () => { $("#tv-coeur").classList.add("on"); son("note", 5); });
    quandMot(p, i5[1], () => { const o = $("#tv-offre"); o.classList.add("on"); o.textContent = "🎁 " + T3.cadeau + " offert"; son("magie"); });
    if (!(await t3Dire(vTv, "vitrine-5")) || !(await pause(400, j))) return;
    // le partage : les amis arrivent, avec leur 💌
    quandMot(p, i6[0], () => { $("#tv-amis").textContent = "+6"; tvCarte("tv-partage"); son("pop"); });
    quandMot(p, i6[1], () => {
      [["Noah", "denim"], ["Maman", "artiste"], ["Jeanne", "curieux"]].forEach(([nom, look], k) => plus(() => {
        TV.tout.splice(k, 0, { id: "ami" + k, nom, look, type: "adore", invite: true, neuf: true, d: "0" }); TV.n++;
        t3Rendre(scTv, TV.tout.slice(0, TV.n)); tvCompter(); son("note", 4 + k);
        $("#tv-amis").textContent = "+" + (7 + k);
      }, k * 380));
    });
    quandMot(p, i6[2], () => t3Coeurs(scTv, 6));
    if (!(await t3Dire(vTv, "vitrine-6")) || !(await pause(1300, j))) return;
    TV.fini = true; aller(idx + 1);
  }
  $("#tv-appeler").addEventListener("click", (e) => {
    if (fini || DEMOS[vue].moments[idx].id !== "vitrine") return;
    e.stopPropagation(); contexte(); tvAppeler();
  });

  /* ── LES MOMENTS, À LEUR PLACE DANS « PLUS DE CLIENTS » ── */
  // WhatsApp : sa réponse affichée, un appui passe tout de suite à sa vitrine
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
    id: "vitrine", chap: 5, ecran: "tv", cible: null,
    dit: T3.textes["vitrine-1"].replace(/\*/g, ""),
    entrer() { tvEntrer(); },
    agir() {
      if (!TV.appele) { tvAppeler(); return; }
      taireVoix(); effacer(); TV.fini = true; aller(idx + 1);
    },
  }, {
    // le ticket de « Plus de clients », sur son WhatsApp, avec sa vitrine
    id: "ticket", chap: 5, ecran: "wa", cible: null,
    dit: "Plus de clients.",
    entrer() {
      $("#wa-texte").textContent = message(); $("#wa-reponse").textContent = reponse();
      ["#wa-notif", "#wa-ecrit", "#wa-bilan", "#tampon-c"].forEach((s) => $(s).classList.remove("on"));
      ["#wa-recu", "#wa-moi"].forEach((s) => $(s).classList.add("on"));
      const vus = TV.tout.length ? TV.tout : t3Foule(T3.compte[0], T3.compte[1], T3.compte[2], false);
      $("#wb-vitrine").textContent = vus.length + " fantômes · " + t3Compte(vus, "promis") + " promesses";
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
    propre3 = f"{R}/trois-3-{M['metier']}.mp3"
    if M["metier"] == "restaurant" or os.path.exists(propre3):
        textes["trois-3"] = TROIS_3.format(fin=M["fin3"])
    else:
        textes["trois-3"] = TROIS_3_COURT
    temps = {}
    for nom, txt in textes.items():
        dst = f"{S}/{d}/{nom}.mp3"
        if nom == "trois-2":
            temps[nom] = preparer(f"{R}/trois-2-restaurant.mp3", dst, txt) if M["metier"] == "restaurant" else coller(f"{R}/trois-2-{M['metier']}.mp3", dst, txt)
        elif nom == "trois-3":
            if M["metier"] == "restaurant":
                temps[nom] = preparer(f"{R}/trois-3.mp3", dst, txt)
            elif os.path.exists(propre3):
                temps[nom] = preparer(propre3, dst, txt)
            else:
                temps[nom] = preparer(f"{R}/trois-3.mp3", dst, txt, couper=VITRINE_A)
        else:
            temps[nom] = preparer(f"{R}/{nom}.mp3", dst, txt)
    # les mots où quelque chose se passe à l'écran
    t2 = textes["trois-2"]
    mots = {
        "trois-2": [0, mot(t2, "je"), mot(t2, "ou", 1), mot(t2, "Touchez")],
        "trois-3": [mot(textes["trois-3"], "devant"), mot(textes["trois-3"], "porte", -2), mot(textes["trois-3"], M["fin3"].split(" ")[-1], -len(M["fin3"].split(" ")))]
        if textes["trois-3"] != TROIS_3_COURT else [mot(TROIS_3_COURT, "vitrine")],
        "trois-4": [mot(textes["trois-4"], "prénom"), mot(textes["trois-4"], "cadeau")],
        "vitrine-2": [mot(textes["vitrine-2"], "adoré"), mot(textes["vitrine-2"], "promis"), mot(textes["vitrine-2"], "viennent"), mot(textes["vitrine-2"], "pense")],
        "vitrine-3": [mot(textes["vitrine-3"], "Touchez")],
        "vitrine-4": [mot(textes["vitrine-4"], "grâce")],
        "vitrine-5": [mot(textes["vitrine-5"], "choisissez"), mot(textes["vitrine-5"], "offrez")],
        "vitrine-6": [mot(textes["vitrine-6"], "partage"), mot(textes["vitrine-6"], "rejoignent"), mot(textes["vitrine-6"], "direct")],
    }
    T3 = {k: M[k] for k in ("lieu", "sous", "carte", "qui", "cages", "ici", "pose3", "heures", "compte")}
    T3.update(textes=textes, mots=mots, cadeau="Le café")

    # l'écran : ses couleurs, son fantôme (bouche fermée, ouverte), ses en-têtes
    fant = re.search(r'const src = ouverte \? "([^"]+)" : "([^"]+)";', t)
    if not fant:
        raise SystemExit(f"{d} : la bouche du fantôme introuvable")
    tete, haut = html_tete(t)
    film_fin = re.search(r'voix: \{ src: "[^"]+", affiche: "[^"]+", fin: "([^"]+)"', t).group(1)
    couleurs = ";".join(f"--{k}:{v}" for k, v in M["couleurs"].items())
    cages = "".join(f'<button type="button" class="t3-f3 {c}" data-t3="{c}"><span class="t3-cg"><i class="t3-anneau"></i><i class="t3-noeud"></i>'
                    f'<span class="t3-dome"><img src="tf/cosy-debout.webp" alt=""><i class="t3-porte-c"></i></span><i class="t3-socle"></i></span><b>{b}</b><small>{s}</small></button>'
                    for c, b, s in M["cages"])
    compteurs = "".join(f'<span class="{c}"><b>0</b><small>{lbl}</small></span>' for c, lbl in zip(("adore", "promis", "table"), M["compteurs"]))
    html = (HTML.replace("__COULEURS__", couleurs).replace("__FIN__", film_fin).replace("__HAUT__", haut).replace("__TETE__", tete)
            .replace("__FANT__", fant.group(2)).replace("__FANT_PARLE__", fant.group(1)).replace("__CHEZ__", M["chez"]).replace("__CAGES__", cages)
            .replace("__BON__", M["bon"]).replace("__BON_MIN__", M["bon"][0].lower() + M["bon"][1:]).replace("__TENTE__", M["tente"]).replace("__COMPTEURS__", compteurs)
            .replace("__MOT_NOM__", M["mot"][0]).replace("__MOT__", M["mot"][1]).replace("__APPEL__", M["appel"]))
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
    print(d, "· trois fantômes :", " ".join(f"{k} {v['d']:.2f} s" for k, v in temps.items()))
