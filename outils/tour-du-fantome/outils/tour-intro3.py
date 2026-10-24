# L'INTRO DES TOURS, VERSION 3 : la scène au centre et en grand, le fantôme en bas qui raconte.
# « Les animations devraient être au centre au lieu d'être tout en haut. » « Ces icônes et ces effets ne
# font pas moderne : tu peux faire cent fois mieux. » « Les animations sont toutes petites. »
#   python3 -I tour-intro3.py <dossier>
# Repart de index.avant-intro.html (le tour sans aucune intro) : on peut le relancer autant de fois qu'on veut.
import json, os, re, shutil, sys

S = sys.argv[1]
# Ce que chaque voisin apporte à l'échange (la scène des voisins commerçants).
OFFRES = {"Fleuriste": "Un bouquet", "Coiffeur": "Une coupe", "Hôtel": "Une nuit", "Opticien": "Des lunettes",
          "Restaurant": "Un dîner", "Boutique": "Une tenue"}
# Par tour : ses trois moments (image, légende), son fantôme (repos, bouche ouverte, salut), son prénom,
# son commerce et ce qu'il apporte à l'échange, et quatre voisins pris dans les images du tour.
CONF = {
    "tour": dict(
        moments=[("m2.jpg", "Un geste"), ("m1.jpg", "Un chef"), ("m3.jpg", "Une création")],
        fant=["resto.webp", "resto-parle.webp", "resto-salue.webp"], qui="Jean-Marie", lieu="Chez Bergine", offre="Un dîner",
        voisins=[("o-fleurs.jpg", "Fleuriste"), ("o-coiffure.jpg", "Coiffeur"), ("o-hotel.jpg", "Hôtel"), ("o-lunettes.jpg", "Opticien")]),
    "tour-vetements": dict(
        moments=[("m1.jpg", "Une allure"), ("m2.jpg", "Un détail"), ("m4.jpg", "Une pièce")],
        fant=["fant.webp", "fant-parle.webp", "fant-viens.webp"], qui="Lou", lieu="Maison Lou", offre="Une tenue",
        voisins=[("o-diner.jpg", "Restaurant"), ("o-fleurs.jpg", "Fleuriste"), ("o-coiffure.jpg", "Coiffeur"), ("o-hotel.jpg", "Hôtel")]),
    "tour-coiffure": dict(
        moments=[("m2.jpg", "Un lieu"), ("m1.jpg", "Avant"), ("m3.jpg", "Après")],
        fant=["fant.webp", "fant-parle.webp", "fant-viens.webp"], qui="Clara", lieu="Salon Clara", offre="Une coupe",
        voisins=[("o-diner.jpg", "Restaurant"), ("o-fleurs.jpg", "Fleuriste"), ("o-mode.jpg", "Boutique"), ("o-hotel.jpg", "Hôtel")]),
    "tour-librairie": dict(
        moments=[("m1.jpg", "Un livre"), ("m3.jpg", "Un coup de cœur"), ("m4.jpg", "Un lieu")],
        fant=["fant.webp", "fant-parle.webp", "fant-viens.webp"], qui="Alice", lieu="La Page d’Alice", offre="Un livre",
        voisins=[("o-diner.jpg", "Restaurant"), ("o-fleurs.jpg", "Fleuriste"), ("o-coiffure.jpg", "Coiffeur"), ("o-hotel.jpg", "Hôtel")]),
    "tour-bijouterie": dict(
        moments=[("m1.jpg", "Un geste"), ("m2.jpg", "Une création"), ("m4.jpg", "Une pièce unique")],
        fant=["fant.webp", "fant-parle.webp", "fant-viens.webp"], qui="Inès", lieu="Atelier Inès", offre="Un bijou",
        voisins=[("o-diner.jpg", "Restaurant"), ("o-fleurs.jpg", "Fleuriste"), ("o-coiffure.jpg", "Coiffeur"), ("o-hotel.jpg", "Hôtel")]),
    "tour-lunettes": dict(
        moments=[("geste.jpg", "Un geste"), ("m3.jpg", "Un détail"), ("m1.jpg", "Un regard")],
        fant=["fant.webp", "fant-parle.webp", "fant-viens.webp"], qui="Margaux", lieu="Les Lunettes de Margaux", offre="Des lunettes",
        voisins=[("o-diner.jpg", "Restaurant"), ("o-fleurs.jpg", "Fleuriste"), ("o-coiffure.jpg", "Coiffeur"), ("o-hotel.jpg", "Hôtel")]),
}
# « Une photo » : la photo du produit telle qu'on la publierait, avec sa légende. « Une vidéo ClikMe » : le film
# que le tour montre à la fin, monté en interview avec ses trois questions (son film, son affiche). Il s'ouvre sur
# la même photo.
AVANT = {"tour": ("m3.jpg", "Plat du jour : magret grillé, pommes sarladaises.", "interview"),
         "tour-vetements": ("m1.jpg", "Nouveau en boutique : manteau long camel.", "interview"),
         "tour-coiffure": ("m4.jpg", "Coupe du jour : carré court, brun profond.", "message"),
         "tour-librairie": ("m2.jpg", "Coup de cœur : Le Comte de Monte-Cristo.", "message"),
         "tour-bijouterie": ("m2.jpg", "Nouveau : collier saphir, chaîne dorée.", "message"),
         "tour-lunettes": ("m1.jpg", "Nouveau : monture ronde, cristal.", "message")}
# ④d la question de son fantôme à celle qui a choisi « Je viendrai », et sa réponse : ce qu'un commerçant n'a pas
# le temps de demander à chacun (propres au commerce)
QR = {
    "tour": ("Camille, plutôt midi ou soir ? Je te garde une part de magret.", "Samedi midi, avec ma sœur !"),
    "tour-vetements": ("Camille, quelle taille ? Lou te met le manteau de côté.", "Du 38 ! Je passe samedi."),
    "tour-coiffure": ("Camille, mardi 18 h, ça te va ? Clara a un créneau.", "Parfait, je le prends !"),
    "tour-librairie": ("Camille, c’est pour toi ou pour offrir ? Alice te l’emballe.", "Pour mon père 🎁 Je passe samedi."),
    "tour-bijouterie": ("Camille, c’est pour offrir ? Inès peut graver un prénom.", "Oui ! « Léa », pour ses 30 ans."),
    "tour-lunettes": ("Camille, tu veux l’essayer ? Margaux te la garde jusqu’à samedi.", "Samedi matin, j’arrive !"),
}
# Le restaurant n'avait pas de fantôme qui salue : c'est celui de la page d'accueil, le même dessin.
SALUE_RESTO = f"{S}/accueil2/page/g-restaurant-salue.webp"
VOIX = f"{S}/voix-intro/court"
# Les fantômes des habitants dans les trois cages de « je fais réagir » (outils/trois-fantomes/a/g).
FANTOMES_CAGES = ["cosy-debout", "fleuri-debout", "curieux-debout"]

CSS = r"""
/* ═══ L'INTRO : SON FANTÔME LUI RACONTE ═══
   « Les animations devraient être au centre au lieu d'être tout en haut : l'animation centrale, et le
   fantôme en bas qui raconte. » « Ces icônes et ces effets ne font pas moderne. » L'intro prend tout
   l'écran, sur ordinateur aussi ; chaque phrase a sa scène, au milieu et en grand ; le fantôme parle en
   bas (sa bouche suit sa voix), sa bulle au-dessus de lui. Les objets sont dessinés — verre dépoli,
   dégradé rose-ambre, icônes vectorielles, un vrai téléphone — et ils arrivent avec un ressort, sur les
   mots qui les disent. */
.devise{margin:0;font-weight:800;font-size:16px;letter-spacing:-.01em;color:rgba(255,244,230,.92);text-shadow:0 2px 14px rgba(0,0,0,.85)}
.devise em{font-style:normal;color:var(--rose)}
.accueil.joue .devise{opacity:0;visibility:hidden;transform:translateY(14px);transition:opacity .7s ease,transform .8s var(--ease),visibility 0s .8s}
.accueil.joue.bouton-la .devise{opacity:1;visibility:visible;transform:none;transition:opacity .7s ease,transform .8s var(--ease),visibility 0s}
.accueil.en-intro :is(h1,.devise,.decouvrir){opacity:0!important;visibility:hidden!important;transition:opacity .4s ease,visibility 0s .4s!important}
.accueil.en-intro .ouverture{opacity:0;transform:translate(-50%,-50%) scale(.55);transition:opacity .6s ease,transform .7s var(--ease)}

.intro{--ressort:cubic-bezier(.34,1.56,.64,1);--fant:clamp(124px,min(38vw,21vh),190px);--bulle:108px;
  position:fixed;inset:0;z-index:30;overflow:hidden;isolation:isolate;text-align:center;color:#fff;-webkit-tap-highlight-color:transparent;
  background:radial-gradient(120% 90% at 50% 38%,#200b15 0%,#0b0306 58%,#050102 100%);animation:si-ouvre .7s ease both}
@media (min-width:700px){.intro{--bulle:94px}}
.intro[hidden]{display:none}
/* « .fin », « .go » : noms déjà pris par la page (le pied des écrans, ses boutons) */
.intro.si-sort{opacity:0;transition:opacity .42s ease}
@keyframes si-ouvre{from{opacity:0}}
.si-defs{position:absolute;width:0;height:0;overflow:hidden}
/* le fond : trois lueurs qui dérivent lentement, et une trame de points qui s'efface sur les bords */
.si-aurore{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
.si-aurore i{position:absolute;width:70vmax;height:70vmax;border-radius:50%;background:radial-gradient(closest-side,var(--c),transparent)}
.si-aurore i:nth-child(1){--c:rgba(255,46,154,.3);left:-30vmax;top:-22vmax;animation:si-derive 16s ease-in-out infinite alternate}
.si-aurore i:nth-child(2){--c:rgba(245,162,58,.2);right:-36vmax;top:8vmax;animation:si-derive 19s ease-in-out -7s infinite alternate-reverse}
.si-aurore i:nth-child(3){--c:rgba(124,77,255,.16);left:-8vmax;bottom:-46vmax;animation:si-derive 22s ease-in-out -3s infinite alternate}
@keyframes si-derive{to{transform:translate(14vmax,-10vmax) scale(1.15)}}
.si-aurore::after{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.06) 1px,transparent 1.4px);background-size:24px 24px;
  -webkit-mask:radial-gradient(75% 60% at 50% 42%,#000,transparent);mask:radial-gradient(75% 60% at 50% 42%,#000,transparent)}
.intro .verre{background:linear-gradient(180deg,rgba(255,255,255,.13),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.16);
  -webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.14),0 24px 50px -22px rgba(0,0,0,.95)}
.intro .s-ico{display:block;flex:none;fill:none;stroke:url(#si-g);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}

/* en haut : le logo, l'avancée de l'intro (une barre par phrase, comme des stories), « Passer » */
.si-haut{position:absolute;z-index:6;left:0;right:0;top:0;max-width:1000px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 0;display:flex;align-items:center;gap:14px}
.si-haut img{height:22px;width:auto;flex:none}
.si-progres{flex:1;display:flex;gap:5px}
.si-progres i{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,.16);overflow:hidden}
.si-progres i::after{content:"";display:block;height:100%;width:var(--p,0%);border-radius:inherit;background:linear-gradient(90deg,#FF5DB8,#FFB347);transition:width var(--t,0s) linear}
.intro .intro-passer{flex:none;padding:8px 14px;border-radius:999px;font-weight:800;font-size:13px;color:#fff;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}

/* la scène au milieu ; le fantôme et sa bulle en bas */
.si-scene{--x:50%;position:absolute;inset:0;max-width:1000px;margin:0 auto}
.si-decor{position:absolute;z-index:1;left:16px;right:16px;top:calc(env(safe-area-inset-top,0px) + 76px);bottom:calc(env(safe-area-inset-bottom,0px) + var(--fant) + var(--bulle) + 12px);container-type:size}
.si-decor>*{position:absolute;inset:0}
.si-bulle{position:absolute;z-index:4;left:14px;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + var(--fant) + 2px);display:flex;justify-content:center;pointer-events:none}
.si-bulle p{position:relative;margin:0;max-width:620px;min-height:2.6em;padding:.6em 1.05em;border-radius:1.2em;font-weight:700;font-size:clamp(17px,4.5vw,21px);line-height:1.3;
  letter-spacing:-.012em;text-wrap:balance;color:#fff;background:linear-gradient(180deg,rgba(64,32,46,.82),rgba(36,16,25,.82));border:1px solid rgba(255,255,255,.16);
  -webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 18px 40px -16px rgba(0,0,0,.9)}
.si-bulle p:empty{visibility:hidden}
/* une longue réplique : un peu plus petite, pour ne pas monter sur la scène */
.si-bulle p.long{font-size:clamp(15px,4vw,19px)}
.si-bulle p::after{content:"";position:absolute;bottom:-7px;left:clamp(1.4em,var(--x),calc(100% - 1.4em));width:13px;height:13px;margin-left:-6.5px;background:#26111a;
  border-right:1px solid rgba(255,255,255,.16);border-bottom:1px solid rgba(255,255,255,.16);transform:rotate(45deg);border-radius:0 0 3px 0;transition:left .9s var(--ressort)}
.si-bulle .fx-cle{background:linear-gradient(90deg,#FF5DB8,#FFB347);-webkit-background-clip:text;background-clip:text;color:transparent;transition:none}
.si-fant{position:absolute;z-index:3;left:var(--x);bottom:calc(env(safe-area-inset-bottom,0px) + 4px);width:var(--fant);aspect-ratio:1;transform:translateX(-50%);
  transition:left .9s var(--ressort),transform .9s ease-in,opacity .9s ease-in;animation:si-entre 1s var(--ressort) .1s backwards}
@keyframes si-entre{from{opacity:0;transform:translateX(-50%) translateY(60%) scale(.3) rotate(-20deg)}}
.si-fant::before{content:"";position:absolute;inset:-18%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,46,154,.32),transparent);animation:si-halo 2.4s ease-in-out infinite}
@keyframes si-halo{50%{transform:scale(1.12);opacity:.7}}
.si-sol{position:absolute;left:12%;right:12%;bottom:-2%;height:12%;border-radius:50%;background:radial-gradient(closest-side,rgba(255,93,184,.55),rgba(255,93,184,.12) 65%,transparent);
  animation:si-ombre 2.4s ease-in-out infinite}
@keyframes si-ombre{50%{transform:scale(.8);opacity:.6}}
.si-flotte{position:absolute;inset:0;animation:si-flotte 2.4s ease-in-out infinite}
@keyframes si-flotte{50%{transform:translateY(-6%)}}
.si-corps{position:absolute;inset:0;transform-origin:50% 100%;transition:transform .07s ease}
.si-fant.parle .si-corps{animation:si-cause .55s ease-in-out infinite alternate}
@keyframes si-cause{from{rotate:-3.5deg}to{rotate:3.5deg}}
.si-fant.ouvre .si-corps{transform:scale(1.04,.96)}
.si-corps img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0}
.si-fant:not(.ouvre):not(.salue) .si-repos,.si-fant.ouvre:not(.salue) .si-parle,.si-fant.salue .si-salue{opacity:1}
.si-fant.inquiet .si-flotte{animation:si-tremble .1s linear 8}
@keyframes si-tremble{25%{transform:translateX(-5%) rotate(-4deg)}75%{transform:translateX(5%) rotate(4deg)}}
.si-fant.saute .si-flotte{animation:si-saute .75s var(--ressort)}
@keyframes si-saute{40%{transform:translateY(-30%) scale(1.1)}}
.si-fant.zoom{transform:translateX(-50%) translateY(-35%) scale(1.7);opacity:0}
/* les étincelles (dessinées, en dégradé) qui éclatent autour d'un objet */
.s-etin{position:absolute;z-index:5;left:calc(50% + var(--ex));top:calc(50% + var(--ey));width:var(--s);height:var(--s);margin:calc(var(--s) / -2) 0 0 calc(var(--s) / -2);opacity:0;pointer-events:none}
.s1.vu .s-etin,.s3.fete .s-etin{animation:s-etin 1.3s cubic-bezier(.2,.8,.3,1) var(--d) both}
@keyframes s-etin{0%{opacity:0;transform:scale(0) rotate(-40deg)}35%{opacity:1;transform:scale(1.15) rotate(20deg)}100%{opacity:0;transform:scale(.4) rotate(120deg)}}
@keyframes s-flotte{50%{translate:0 -8px}}
@keyframes s-tourne{to{rotate:360deg}}
@keyframes s-pouf{40%{transform:scale(1.45)}}
.s-direct{width:8px;height:8px;border-radius:50%;flex:none;background:#FF3B6B;animation:s-direct 1.6s ease-out infinite}
@keyframes s-direct{from{box-shadow:0 0 0 0 rgba(255,59,107,.7)}to{box-shadow:0 0 0 9px rgba(255,59,107,0)}}

/* ① « il se passe quelque chose qui mérite d'être vu » : trois grandes cartes-photos qui s'ouvrent en éventail */
.s1{--w:min(66cqw,54cqh);--dx:calc(var(--w) * .33)}
@container (min-aspect-ratio:1/1){.s1{--dx:calc(var(--w) * .68)}}
.s1-chip{position:absolute;left:50%;top:max(0px,calc(50% + 18px - var(--w) * 2 / 3 - 56px));display:flex;align-items:center;gap:8px;padding:8px 15px;border-radius:999px;white-space:nowrap;
  font-weight:700;font-size:clamp(12px,3.8cqw,14px);opacity:0;transform:translate(-50%,-12px);transition:opacity .5s,transform .7s var(--ressort)}
.s1-chip.on{opacity:1;transform:translate(-50%,0)}
.s1-carte{position:absolute;left:50%;top:calc(50% + 18px);width:var(--w);aspect-ratio:3/4;margin:calc(var(--w) * -2 / 3) 0 0 calc(var(--w) * -.5);border-radius:24px;padding:3px;
  background:linear-gradient(150deg,rgba(255,255,255,.6),rgba(255,93,184,.8) 35%,rgba(255,179,71,.75));box-shadow:0 34px 60px -24px rgba(0,0,0,.95),0 0 44px -14px rgba(255,46,154,.55);
  opacity:0;transition:transform 1s var(--ressort),opacity .35s ease}
.s1-carte[data-k="0"]{transform:translate(-70cqw,40cqh) rotate(-35deg) scale(.7)}
.s1-carte[data-k="1"]{transform:translate(70cqw,40cqh) rotate(35deg) scale(.7)}
.s1-carte[data-k="2"]{z-index:2;transform:translate(0,55cqh) scale(.6)}
.s1-carte.on{opacity:1}
.s1-carte[data-k="0"].on{transform:translate(calc(var(--dx) * -1),5%) rotate(-9deg) scale(.84)}
.s1-carte[data-k="1"].on{transform:translate(var(--dx),5%) rotate(9deg) scale(.84)}
.s1-carte[data-k="2"].on{transform:none}
.s1.vu .s1-carte{animation:s-flotte 3.2s ease-in-out infinite}
.s1.vu .s1-carte[data-k="1"]{animation-delay:-1.1s}.s1.vu .s1-carte[data-k="2"]{animation-delay:-2.2s}
.s1-ph{position:relative;height:100%;border-radius:21px;overflow:hidden;background:#1a0d10;clip-path:inset(0 round 21px)}
.s1-ph img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.2);transition:transform 6s cubic-bezier(.2,.7,.3,1)}
.s1-carte.on .s1-ph img{transform:scale(1)}
.s1-ph::before{content:"";position:absolute;inset:45% 0 0;z-index:1;background:linear-gradient(transparent,rgba(10,4,6,.78))}
.s1-ph::after{content:"";position:absolute;inset:0;z-index:2;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,.42) 50%,transparent 62%);transform:translateX(-130%)}
.s1-carte.on .s1-ph::after{animation:s-brille 1.1s ease .35s}
.s1.vu .s1-carte[data-k="2"] .s1-ph::after{animation:s-brille-2 1s ease}
@keyframes s-brille{to{transform:translateX(130%)}}
@keyframes s-brille-2{from{transform:translateX(-130%)}to{transform:translateX(130%)}}
.s1-carte figcaption{position:absolute;z-index:3;left:14px;bottom:14px;padding:6px 13px;border-radius:999px;font-weight:800;font-size:clamp(12px,4cqw,15px);color:#fff;
  background:rgba(20,8,12,.45);border:1px solid rgba(255,255,255,.24);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.s1-badge{position:absolute;z-index:4;right:calc(50% - var(--w) / 2 - 14px);top:calc(50% + 2px - var(--w) * 2 / 3);display:flex;align-items:center;gap:8px;padding:6px 15px 6px 6px;
  border-radius:999px;font-weight:900;font-size:clamp(13px,4cqw,16px);color:#fff;background:linear-gradient(135deg,#FF2E9A,#FF8A3D);box-shadow:0 14px 30px -8px rgba(255,46,154,.85);
  transform-origin:100% 100%;transform:scale(0) rotate(-30deg);transition:transform .7s var(--ressort)}
.s1.vu .s1-badge{transform:rotate(-6deg)}
.s-pastille{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#fff}
.s-pastille .s-ico{width:19px;height:19px;stroke-width:2.2}

/* ② « Qui a le temps de filmer, de monter, de publier ? » — « pas dans le style de ClikMe, trop banal, pas assez
   moderne ». Les trois mots en très grand, qui claquent sur la voix, chacun avec son icône dans une pastille en
   dégradé, au milieu d'un anneau de temps qui se vide pendant la question ; à la fin, ils sont barrés : « Pas le
   temps. » */
.s2{--r:min(94cqw,94cqh)}
.s2-anneau{position:absolute;left:50%;top:50%;width:var(--r);height:var(--r);transform:translate(-50%,-50%) rotate(-90deg);overflow:visible;opacity:0;transition:opacity .5s}
.s2.file .s2-anneau{opacity:1}
.s2-anneau .piste{fill:none;stroke:rgba(255,255,255,.08);stroke-width:2.6}
.s2-anneau .tic{stroke:rgba(255,255,255,.16);stroke-width:.5;stroke-linecap:round}
.s2-anneau .tic.fort{stroke:rgba(255,255,255,.38);stroke-width:.8}
.s2-anneau .temps{fill:none;stroke:url(#si-g5);stroke-width:2.6;stroke-linecap:round;stroke-dasharray:1 1;stroke-dashoffset:0;filter:drop-shadow(0 0 2.5px rgba(255,46,154,.8));
  transition:stroke-dashoffset var(--duree,3s) linear}
.s2.file .s2-anneau .temps{stroke-dashoffset:-1}
.s2.vide .s2-anneau .piste{animation:s2-alarme .45s ease 3}
@keyframes s2-alarme{50%{stroke:rgba(255,46,154,.6)}}
.s2-mots{position:absolute;left:50%;top:50%;transform:translate(-50%,-52%);display:flex;flex-direction:column;align-items:flex-start;gap:.2em;font-size:clamp(27px,9.4cqmin,52px)}
.s2-mot b small{display:block;margin-top:.12em;font-size:.4em;font-weight:800;letter-spacing:.01em;white-space:nowrap;opacity:.85}
.s2-mot{position:relative;display:flex;align-items:center;gap:.32em;opacity:0;transform:translateX(.9em) skewX(-12deg);filter:blur(6px);
  transition:opacity .22s,transform .55s var(--ressort),filter .3s}
.s2-mot.on{opacity:1;transform:none;filter:none}
.s2-tuile{display:grid;place-items:center;flex:none;width:1.12em;height:1.12em;border-radius:.3em;background:linear-gradient(135deg,#FF2E9A,#FF8A3D);
  box-shadow:inset 0 .06em 0 rgba(255,255,255,.35),0 .25em .6em -.2em rgba(255,46,154,.85)}
.s2-tuile svg{width:.62em;height:.62em;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.s2-mot b{font-weight:900;letter-spacing:-.04em;line-height:1;color:#fff;text-align:left}
.s2-mot::after{content:"";position:absolute;left:1.3em;right:-.12em;top:54%;height:.12em;border-radius:.06em;background:linear-gradient(90deg,#FF2E9A,#FFB347);
  box-shadow:0 0 .3em rgba(255,46,154,.7);transform:scaleX(0);transform-origin:0 50%;transition:transform .32s ease var(--d)}
.s2.barre .s2-mot::after{transform:none}
.s2.barre .s2-mot b{opacity:.45;transition:opacity .4s ease .3s}
.s2.barre .s2-tuile{filter:grayscale(1) brightness(.75);transition:filter .4s ease .3s}
.s2-verdict{position:absolute;left:50%;top:calc(50% + var(--r) * .44);padding:.28em .85em;border-radius:999px;white-space:nowrap;font-weight:900;font-size:clamp(18px,6cqmin,30px);color:#fff;
  background:linear-gradient(135deg,#FF2E9A,#FF8A3D);box-shadow:0 0 0 4px rgba(11,3,6,.9),0 14px 34px -10px rgba(255,46,154,.9);transform:translate(-50%,-50%) rotate(-4deg) scale(0);
  transition:transform .6s var(--ressort) .45s}
.s2.barre .s2-verdict{transform:translate(-50%,-50%) rotate(-4deg)}
/* ②b « Pourtant, c'est essentiel : des vidéos partagées avec le cœur créent de la sympathie, et la sympathie
   crée la fidélité. Vos clients s'attachent à vous, naturellement. » Les mots barrés s'effacent, l'anneau du
   temps se remplit à nouveau, et la chaîne se forme, maillon par maillon, sur la voix ; à la fin, ses clients. */
.s2.efface .s2-mots,.s2.efface .s2-verdict{opacity:0;filter:blur(5px);transition:opacity .45s,filter .45s}
.s2.efface .s2-anneau .temps{stroke-dashoffset:0;transition:stroke-dashoffset 2.6s cubic-bezier(.3,0,.2,1)}
.s2b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(4px,1.4cqmin,10px);pointer-events:none}
.s2b-pas{display:flex;align-items:center;gap:.38em;font-size:clamp(17px,5.4cqmin,38px);opacity:0;transform:translateY(.5em) scale(.9);filter:blur(6px);
  transition:opacity .25s,transform .55s var(--ressort),filter .3s}
.s2b-pas.on{opacity:1;transform:none;filter:none}
.s2b-pas b{font-weight:900;letter-spacing:-.035em;line-height:1.02;color:#fff;text-align:left}
.s2b-pas b small{display:block;font-size:.55em;font-weight:800;letter-spacing:0;color:#FFB347}
.s2b-fleche{display:block;width:3px;height:clamp(10px,3.4cqmin,22px);border-radius:2px;background:linear-gradient(#FF2E9A,#FFB347);opacity:0;transform:scaleY(0);
  transform-origin:50% 0;transition:opacity .2s,transform .35s ease}
.s2b-fleche.on{opacity:1;transform:none}
.s2b-fin{display:flex;align-items:center;gap:.55em;margin-top:clamp(6px,2.2cqmin,16px);padding:.32em .95em .32em .45em;border-radius:999px;white-space:nowrap;
  background:linear-gradient(135deg,#FF2E9A,#FF8A3D);color:#fff;font-weight:900;font-size:clamp(14px,4.4cqmin,26px);
  box-shadow:0 0 0 4px rgba(11,3,6,.9),0 14px 34px -10px rgba(255,46,154,.9);opacity:0;transform:scale(.5) rotate(-3deg);transition:opacity .3s,transform .6s var(--ressort)}
.s2b-fin.on{opacity:1;transform:rotate(-3deg)}
.s2b-av{display:flex;padding-right:.4em}
.s2b-av b{display:grid;place-items:center;width:1.55em;height:1.55em;margin-right:-.42em;border-radius:50%;border:2px solid #fff;background:var(--c);font-size:.72em}
.s2b-coeur{position:absolute;left:50%;top:66%;width:var(--s);height:var(--s);opacity:0}
.s2b.fete .s2b-coeur{animation:s2b-monte 1.7s ease-out var(--d) both}
@keyframes s2b-monte{0%{opacity:0;transform:translate(-50%,0) scale(.4)}18%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),-36cqh) rotate(var(--r)) scale(1.15)}}

/* ③ « je raconte à votre place » : un vrai téléphone, seul au milieu ; son fantôme s'y allume, puis passe
   l'interview que ClikMe a montée avec le commerçant (ses trois questions, celle de la fin du tour).
   ④ « une histoire, ça se partage » : SEULE LA VIDÉO DU FANTÔME. Le face-à-face (sa photo « vite fait »
   contre la vidéo ClikMe) a été retiré : « on ne devrait mettre que ce que le fantôme fabrique comme vidéo et
   oublier ce que le restaurateur aurait mis ». Le téléphone reste seul, en grand ; au-dessus, qui l'a monté
   (ClikMe, sans effort pour vous) ; ses amis l'aiment et le partagent ; dessous, une ligne de chiffres
   (sans le mot « exemple » : jamais à l'écran). */
/* 100 px : qui l'a monté, au-dessus (42) ; les chiffres, à cheval sur le bas du téléphone. « La vidéo est mal ajustée au téléphone » : son écran a maintenant la forme du film
   (9:16, cadre compris : 1,7375 × la largeur), le film le remplit en entier, sans bandes noires. */
.s3,.s4{--pw:min(68cqw,calc((100cqh - 100px) / 1.7375));--py:calc(50% - 6px);--ph:calc(var(--pw) * 1.7375)}
.s3{--w:calc(var(--pw) * 1.05)}
.s3-halo{position:absolute;left:50%;top:var(--py);width:calc(var(--pw) * 2.2);aspect-ratio:1;margin:calc(var(--pw) * -1.1) 0 0 calc(var(--pw) * -1.1);border-radius:50%;
  background:conic-gradient(from 0deg,rgba(255,46,154,.9),rgba(255,179,71,.8),rgba(124,77,255,.8),rgba(255,46,154,.9));-webkit-mask:radial-gradient(closest-side,#000 30%,transparent);
  mask:radial-gradient(closest-side,#000 30%,transparent);opacity:0;transition:opacity .9s;animation:s-tourne 9s linear infinite}
.s3.fete .s3-halo{opacity:.45}
.s-tel{position:absolute;left:50%;top:var(--py);width:var(--pw);height:var(--ph);margin:calc(var(--ph) / -2) 0 0 calc(var(--pw) / -2);font-size:calc(var(--ph) / 40);border-radius:4.6em;padding:.6em;
  background:linear-gradient(150deg,#5a5a64,#18181c 30%,#0c0c0f 70%,#3a3a42);box-shadow:0 0 0 1px rgba(255,255,255,.14),0 40px 80px -30px #000}
.s-tel-b{z-index:1;box-shadow:0 0 0 1px rgba(255,255,255,.14),0 40px 80px -30px #000,0 0 70px -20px rgba(255,46,154,.55);
  opacity:0;transform:translateY(40%) rotate(8deg) scale(.8);transition:opacity .4s,transform .9s var(--ressort)}
.s3.on .s-tel-b{opacity:1;transform:none}
.s3.fete .s-tel-b{animation:s-flotte 4s ease-in-out .9s infinite}
/* clip-path et pas seulement overflow : sinon ce qui s'anime à l'écran déborde des coins arrondis */
.s-ecran{position:relative;height:100%;border-radius:4em;overflow:hidden;background:#060304;isolation:isolate;clip-path:inset(0 round 4em)}
.s-ecran::after{content:"";position:absolute;inset:0;z-index:9;pointer-events:none;background:linear-gradient(125deg,rgba(255,255,255,.12),transparent 32%)}
.s-ile{position:absolute;z-index:8;top:.9em;left:50%;width:6em;height:1.7em;margin-left:-3em;border-radius:2em;background:#000}
/* le film est en 9:16, l'écran plus haut : il est montré en entier, sur son affiche floutée */
.s-ecran-film::before{content:"";position:absolute;inset:-10%;background:#060304 var(--affiche) center/cover no-repeat;filter:blur(14px) brightness(.45);opacity:0;transition:opacity .6s}
.s3.joue .s-ecran-film::before{opacity:1}
.s-film{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s}
.s3.joue .s-film{opacity:1}
.s-av{position:absolute;z-index:7;left:50%;top:40%;width:12em;aspect-ratio:1;border-radius:50%;opacity:0;transform:translate(-50%,-50%) scale(.2);transition:transform .8s var(--ressort),opacity .4s}
.s-av::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(#FF2E9A,#FFB347,#FF5DB8,#FF2E9A);animation:s-tourne 2.6s linear infinite}
.s-av img{position:absolute;inset:5%;width:90%;height:90%;border-radius:50%;object-fit:contain;background:radial-gradient(circle at 50% 30%,#5a2740,#1c0b13 75%);border:.22em solid #060304}
.s3.fete .s-av{opacity:1;transform:translate(-50%,-50%) scale(1)}
.s3.joue .s-av{opacity:0;transform:translate(-50%,-50%) scale(1.4)}
.s-titre{position:absolute;z-index:7;left:0;right:0;top:calc(40% + 7.4em);display:flex;flex-direction:column;gap:.25em;opacity:0;transform:translateY(1em);transition:opacity .4s,transform .7s var(--ressort)}
.s-titre b{font-size:1.75em;font-weight:900;letter-spacing:-.02em}
.s-titre span{font-size:1.1em;font-weight:600;color:rgba(255,255,255,.7)}
.s3.fete .s-titre{opacity:1;transform:none;transition-delay:.25s}
.s3.joue .s-titre{opacity:0;transform:translateY(-1em);transition-delay:0s}
.s-rail{position:absolute;z-index:6;right:.7em;bottom:11em;display:flex;flex-direction:column;align-items:center;gap:.8em;opacity:0;transform:translateX(1.5em);transition:opacity .5s .45s,transform .6s var(--ressort) .45s}
.s3.joue .s-rail{opacity:1;transform:none}
.s-rail span{display:block;width:1.55em;height:1.55em}
.s-rail svg{display:block;width:100%;height:100%;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 .1em .3em rgba(0,0,0,.65))}
.s3.aime .s-r-coeur{animation:s-pouf .5s var(--ressort)}
.s3.aime .s-r-coeur svg{fill:url(#si-g);stroke:url(#si-g)}
.s3.envoie .s-r-part{animation:s-pouf .55s var(--ressort)}
/* QUI L'A MONTÉ, au-dessus : son fantôme, « Monté par ClikMe · sans effort pour vous » */
.s-qui{position:absolute;z-index:2;left:50%;top:calc(var(--py) - var(--ph) / 2 - 42px);display:flex;align-items:center;gap:7px;padding:4px 12px 4px 4px;border-radius:999px;white-space:nowrap;
  text-align:left;color:#fff;background:linear-gradient(135deg,rgba(255,46,154,.96),rgba(255,138,61,.96));box-shadow:0 12px 28px -8px rgba(255,46,154,.85);
  opacity:0;transform:translateX(-50%) translateY(8px);transition:opacity .4s .2s,transform .6s var(--ressort) .2s}
.s3.chiffres .s-qui{opacity:1;transform:translateX(-50%)}
.s-qui img{flex:none;width:28px;height:28px;border-radius:50%;object-fit:contain;background:radial-gradient(circle at 50% 30%,#5a2740,#1c0b13 75%);border:2px solid rgba(255,255,255,.85)}
.s-qui span{display:flex;align-items:baseline;gap:6px;line-height:1.1}
.s-qui b{font-size:clamp(13px,3.8cqw,16px);font-weight:900;letter-spacing:-.01em}
.s-qui small{font-size:clamp(11px,3.1cqw,13px);font-weight:700;color:rgba(255,255,255,.92)}
.s3.brille .s-qui{animation:s-qui-pouf .7s var(--ressort) 2}
@keyframes s-qui-pouf{40%{transform:translateX(-50%) scale(1.1);box-shadow:0 0 0 6px rgba(255,93,184,.35),0 16px 36px -8px rgba(255,46,154,.95)}}
/* CE QU'IL RÉCOLTE : une carte pleine (rose-orangé), à cheval sur le bas du téléphone, qui jaillit quand les
   chiffres d'exemple se mettent à défiler (j'aime, vues, partages) ; chaque chiffre saute à son tour ; une onde
   part quand l'histoire est partagée. « L'animation en dessous du téléphone passait inaperçue. » */
.s-stats{position:absolute;z-index:3;left:50%;top:calc(var(--py) + var(--ph) / 2 - 22px);display:flex;gap:clamp(16px,5.5cqw,30px);padding:9px 20px 8px;border-radius:18px;
  white-space:nowrap;color:#fff;background:linear-gradient(135deg,#FF2E9A,#FF8A3D);box-shadow:0 0 0 3px rgba(11,3,6,.92),0 16px 40px -8px rgba(255,46,154,.9);
  opacity:0;transform:translateX(-50%) translateY(18px) scale(.55);transition:opacity .3s .3s,transform .75s var(--ressort) .3s}
.s3.chiffres .s-stats{opacity:1;transform:translateX(-50%)}
.s-stats span{display:flex;flex-direction:column;align-items:center;gap:3px;line-height:1}
.s3.chiffres .s-stats span{animation:s-stat-saute .55s var(--ressort) both}
.s3.chiffres .s-stats span:nth-child(1){animation-delay:.5s}
.s3.chiffres .s-stats span:nth-child(2){animation-delay:.65s}
.s3.chiffres .s-stats span:nth-child(3){animation-delay:.8s}
@keyframes s-stat-saute{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.25);opacity:1}100%{transform:none;opacity:1}}
.s-stats b{min-width:2ch;font-size:clamp(21px,6.6cqw,30px);font-weight:900;letter-spacing:-.02em;font-variant-numeric:tabular-nums;text-align:center}
.s-stats small{display:flex;align-items:center;gap:3px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.92)}
.s-stats svg{width:11px;height:11px;flex:none;fill:#fff}
.s3.gagne .s-stats{animation:s-stats-pouf .6s var(--ressort),s-stats-onde 1.1s ease-out 2}
@keyframes s-stats-pouf{40%{transform:translateX(-50%) scale(1.12)}}
@keyframes s-stats-onde{from{box-shadow:0 0 0 3px rgba(11,3,6,.92),0 0 0 3px rgba(255,93,184,.75),0 16px 40px -8px rgba(255,46,154,.9)}
  to{box-shadow:0 0 0 3px rgba(11,3,6,.92),0 0 0 22px rgba(255,93,184,0),0 16px 40px -8px rgba(255,46,154,.9)}}
.s-exemple{position:absolute;z-index:2;left:50%;top:calc(var(--py) + var(--ph) / 2 + 38px);transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:600;
  color:rgba(255,255,255,.42);opacity:0;transition:opacity .4s .8s}
.s3.chiffres .s-exemple{opacity:1}
.s4{z-index:4;pointer-events:none}
.s4-notif{position:absolute;left:50%;top:calc(var(--py) - var(--ph) / 2 + 8px);width:min(calc(var(--pw) * 1.12),92cqw);translate:-50% 0;display:flex;align-items:center;gap:8px;
  padding:8px 10px 8px 8px;border-radius:16px;text-align:left;opacity:0;transform:translateY(18px) scale(.88);transition:opacity .35s var(--d),transform .7s var(--ressort) var(--d)}
.s4-notif.verre{background:linear-gradient(180deg,rgba(62,36,49,.95),rgba(36,19,27,.95))}
.s4.vole .s4-notif{opacity:1;transform:none}
.s4-av{display:grid;place-items:center;flex:none;width:28px;height:28px;border-radius:50%;font-weight:900;font-size:12px;color:#fff;background:var(--c);box-shadow:0 0 0 2px rgba(255,255,255,.25)}
.s4-notif span{display:grid;grid-template-columns:1fr auto;gap:1px 8px;min-width:0;flex:1}
.s4-notif strong{font-size:12px;font-weight:800}
.s4-notif small{display:none;font-size:11.5px;font-weight:600;color:rgba(255,255,255,.55)}
.s4-notif em{grid-column:1/-1;font-style:normal;font-size:12px;font-weight:600;line-height:1.3;color:rgba(255,255,255,.9)}
/* Sur un téléphone, la place manque : les messages arrivent un par un en haut de l'écran de la vidéo, comme des
   notifications, sans la recouvrir ; le dernier reste. À côté sur un écran large. */
@container not ((min-aspect-ratio:3/2) and (min-width:700px)){
  .s4.vole .s4-notif{animation:s4-toast 1.05s var(--ressort) calc(var(--k) * .95s) both}
  .s4.vole .s4-notif[data-k="2"]{animation-name:s4-toast-fin}
}
@container (min-aspect-ratio:3/2) and (min-width:700px){
  .s4-notif{translate:none;left:calc(50% + max(var(--pw) / 2, 104px) + 20px);width:min(270px,calc(50cqw - max(var(--pw) / 2, 104px) - 24px));top:calc(14% + var(--k) * 25%);gap:10px;padding:10px 12px 10px 10px}
  .s4-av{width:36px;height:36px;font-size:15px}
  .s4-notif small{display:block}
  .s4-notif strong,.s4-notif em{font-size:13.5px}
}
/* petit iPhone (décor bas) : chiffres et messages plus serrés, après les règles de base pour l'emporter */
@container (max-height:430px){
  .s-stats{gap:14px;padding:7px 15px 6px;top:calc(var(--py) + var(--ph) / 2 - 18px)}
  .s-stats b{font-size:21px}
  .s-stats small{font-size:9px;letter-spacing:.02em}
  .s-exemple{top:calc(var(--py) + var(--ph) / 2 + 34px);font-size:9.5px}
  .s4-notif{width:min(calc(var(--pw) * 1.3),92cqw);gap:5px;padding:5px 8px 5px 5px;border-radius:12px}
  .s4-av{width:20px;height:20px;font-size:10px}
  .s4-notif strong,.s4-notif em{font-size:10.5px;line-height:1.2}
}
@keyframes s4-toast{0%{opacity:0;transform:translateY(-14px) scale(.9)}14%,82%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-8px) scale(.96)}}
@keyframes s4-toast-fin{0%{opacity:0;transform:translateY(-14px) scale(.9)}14%,100%{opacity:1;transform:none}}
.s4-coeur{position:absolute;z-index:2;left:calc(50% + var(--pw) / 2 - var(--ph) * .052);top:calc(var(--py) + var(--ph) * .072);
  width:var(--s);height:var(--s);margin:calc(var(--s) / -2) 0 0 calc(var(--s) / -2);opacity:0}
.s4.vole .s4-coeur{animation:s4-coeur 1.8s cubic-bezier(.2,.7,.3,1) var(--d) both}
.s4.vole2 .s4-coeur{animation:s4-coeur-2 1.8s cubic-bezier(.2,.7,.3,1) var(--d) both}
@keyframes s4-coeur-2{0%{opacity:0;transform:scale(.3)}15%{opacity:1;transform:translate(calc(var(--dx) * -.2),-20px) scale(1)}100%{opacity:0;transform:translate(calc(var(--dx) * -1),calc(var(--ph) * -.45)) scale(.8) rotate(var(--r))}}
@keyframes s4-coeur{0%{opacity:0;transform:scale(.3)}15%{opacity:1;transform:translate(calc(var(--dx) * .2),-20px) scale(1)}100%{opacity:0;transform:translate(var(--dx),calc(var(--ph) * -.45)) scale(.8) rotate(var(--r))}}

/* LES DEUX CHAPITRES. « Il faut vraiment faire le distinguo entre "avoir plus de clients, être connu et
   reconnu" et "dépenser moins grâce à vos commerçants voisins" : on passe vite de l'un à l'autre. » Comme
   sur la page d'accueil : rose pour le premier, or pour le second. Chacun s'ouvre sur sa carte (son
   numéro, son titre, ce qu'il apporte), et son nom reste affiché en haut tant qu'on y est. */
.intro{--acc:#ff2e9a;--acc2:#ff8a3d}
.intro.si-c2{--acc:#f6b54b;--acc2:#ffd27a}
.si-aurore-or{opacity:0;transition:opacity 1.2s ease}
.si-aurore-or i:nth-child(1){--c:rgba(246,181,75,.3)}
.si-aurore-or i:nth-child(2){--c:rgba(255,210,122,.18)}
.si-aurore-or i:nth-child(3){--c:rgba(255,138,61,.16)}
.intro.si-c2 .si-aurore-or{opacity:1}
.intro.si-c2 .si-aurore:not(.si-aurore-or){opacity:.35;transition:opacity 1.2s ease}
.si-chap{position:absolute;z-index:6;left:50%;top:calc(env(safe-area-inset-top,0px) + 44px);display:flex;align-items:center;gap:7px;padding:3px 12px 3px 4px;border-radius:999px;white-space:nowrap;
  font-size:12.5px;font-weight:800;color:#fff;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);opacity:0;transform:translateX(-50%) translateY(-6px);transition:opacity .4s,transform .5s var(--ressort)}
.si-chap b{padding:2px 8px;border-radius:999px;font-size:11px;font-weight:900;color:#140a06;background:linear-gradient(135deg,var(--acc),var(--acc2))}
.intro.si-chap-la .si-chap{opacity:1;transform:translateX(-50%)}
.si-progres i:nth-child(10){margin-left:9px}
@media (max-height:780px){.intro{--fant:clamp(96px,min(34vw,17vh),190px)}}
.si-progres i:nth-child(n+10)::after{background:linear-gradient(90deg,#f6b54b,#ffd27a)}
.si-progres i:nth-child(11){margin-left:9px}
.intro.si-c2 .si-bulle .fx-cle{background-image:linear-gradient(90deg,#f6b54b,#ffd27a)}
.intro.si-c2 .si-fant::before{background:radial-gradient(closest-side,rgba(246,181,75,.34),transparent)}
.intro.si-c2 .si-sol{background:radial-gradient(closest-side,rgba(246,181,75,.55),rgba(246,181,75,.12) 65%,transparent)}
.s0{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(4px,1.4cqh,10px);text-align:center}
.s0::before{content:"";position:absolute;left:50%;top:46%;width:min(90cqw,90cqh);aspect-ratio:1;translate:-50% -50%;border-radius:50%;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--acc) 34%,transparent),transparent);animation:s0-lueur 2.4s ease-out both}
@keyframes s0-lueur{from{opacity:0;scale:.4}}
.s0>*{position:relative}
.s0-num{font-size:clamp(90px,34cqmin,190px);font-weight:900;line-height:.85;letter-spacing:-.05em;color:transparent;-webkit-text-stroke:2px var(--acc);
  background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 40%,transparent),transparent 75%);-webkit-background-clip:text;background-clip:text;animation:s0-num .9s var(--ressort) both}
@keyframes s0-num{from{opacity:0;transform:scale(.55);filter:blur(10px)}}
.s0 small{font-size:clamp(12px,3.6cqw,14px);font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:var(--acc);animation:s0-monte .6s ease .25s both}
.s0 h2{margin:0;font-size:clamp(34px,11cqmin,62px);font-weight:900;letter-spacing:-.035em;line-height:1.02;animation:s0-monte .7s var(--ressort) .35s both}
.s0 h2 em{font-style:normal;background:linear-gradient(90deg,var(--acc),var(--acc2));-webkit-background-clip:text;background-clip:text;color:transparent}
.s0 p{margin:0;font-size:clamp(15px,4.6cqmin,21px);font-weight:600;color:rgba(255,255,255,.78);animation:s0-monte .7s ease .6s both}
@keyframes s0-monte{from{opacity:0;transform:translateY(16px)}}
/* le chapitre 2 garde l'or jusque sur la carte des voisins */
.intro.si-c2 .s5-goutte{background:linear-gradient(135deg,#e79a2a,#ffd27a);box-shadow:0 12px 26px -8px rgba(246,181,75,.9),0 0 0 4px rgba(255,255,255,.14)}
.intro.si-c2 .s5-offre{color:#1c1306;background:linear-gradient(135deg,#f6b54b,#ffd27a);box-shadow:0 8px 20px -6px rgba(246,181,75,.85)}
.intro.si-c2 .s5-radar{border-color:rgba(246,181,75,.6)}
.intro.si-c2 .s5-pas{background:rgba(246,181,75,.18);border-color:rgba(246,181,75,.6)}
.intro.si-c2 .s5-plan .rayon{fill:rgba(246,181,75,.05);stroke:rgba(246,181,75,.65)}
.intro.si-c2 .s5-carte{background:radial-gradient(circle at 50% 47%,#2a1d0c 0%,#171006 62%,#0f0a04 100%)}
.s6-chaps{position:absolute;left:50%;top:calc(50% + clamp(48px,15cqmin,75px) + 24px);transform:translateX(-50%);display:flex;gap:8px;transition:opacity .5s}
.s6-chaps span{display:flex;align-items:center;gap:6px;padding:4px 12px 4px 4px;border-radius:999px;white-space:nowrap;font-size:13px;font-weight:800;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16)}
.s6-chaps b{padding:2px 7px;border-radius:999px;font-size:11px;font-weight:900;color:#140a06}
.s6-chaps span:first-child b{background:linear-gradient(135deg,#ff2e9a,#ff8a3d)}
.s6-chaps span:last-child b{background:linear-gradient(135deg,#f6b54b,#ffd27a)}
.s6.plonge .s6-chaps{opacity:0}

/* ⑤ ses voisins commerçants : une carte du quartier ; chacun dans son coin, puis ils s'échangent */
.s5{display:grid;place-items:center}
.s5-carte{position:relative;width:min(96cqw,96cqh);aspect-ratio:1;border-radius:28px;overflow:hidden;background:radial-gradient(circle at 50% 47%,#2d1522 0%,#170a11 62%,#10070b 100%);
  border:1px solid rgba(255,255,255,.13);box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 40px 80px -36px #000;opacity:0;transform:scale(.88) translateY(20px);transition:opacity .5s,transform .9s var(--ressort)}
.s5-carte.on{opacity:1;transform:none}
.s5-plan{position:absolute;inset:0;width:100%;height:100%}
.s5-plan .rue{fill:none;stroke:rgba(255,255,255,.075);stroke-width:4;stroke-linecap:round}
.s5-plan .ruelle{fill:none;stroke:rgba(255,255,255,.045);stroke-width:1.5;stroke-linecap:round}
.s5-plan .eau{fill:none;stroke:rgba(90,150,255,.14);stroke-width:5;stroke-linecap:round}
.s5-plan .parc{fill:rgba(61,226,166,.07)}
.s5-plan .rayon{fill:rgba(255,93,184,.05);stroke:rgba(255,93,184,.6);stroke-width:.45;stroke-dasharray:1.4 1.4;transform-box:fill-box;transform-origin:50% 50%;transform:scale(0);transition:transform .9s var(--ressort)}
.s5.pas .s5-plan .rayon{transform:none}
.s5-plan .arc{fill:none;stroke:url(#si-g3);stroke-width:1;stroke-linecap:round;stroke-dasharray:1 1;stroke-dashoffset:1;transition:stroke-dashoffset 1s ease var(--d)}
.s5.echange .s5-plan .arc{stroke-dashoffset:0}
.s5-plan .jeton{opacity:0;transition:opacity .3s .7s}
.s5.echange .s5-plan .jeton{opacity:1}
.s5-radar{position:absolute;left:50%;top:47%;width:22cqmin;aspect-ratio:1;margin:-11cqmin 0 0 -11cqmin;border-radius:50%;border:2px solid rgba(255,93,184,.55);opacity:0;animation:s-radar 2.4s ease-out infinite}
.s5-radar+.s5-radar{animation-delay:1.2s}
@keyframes s-radar{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(2.6)}}
.s5-pas{position:absolute;left:50%;top:9%;padding:4px 12px;border-radius:999px;white-space:nowrap;font-size:clamp(11px,3.4cqw,13px);font-weight:800;color:#fff;
  background:rgba(255,46,154,.22);border:1px solid rgba(255,93,184,.55);transform:translate(-50%,-50%) scale(0);transition:transform .6s var(--ressort) .3s}
.s5.pas .s5-pas{transform:translate(-50%,-50%) scale(1)}
.s5-moi{position:absolute;z-index:2;left:50%;top:47%;width:0;margin-top:-7cqmin;display:flex;flex-direction:column;align-items:center;gap:6px}
.s5-goutte{display:grid;place-items:center;flex:none;width:14cqmin;height:14cqmin;border-radius:50% 50% 50% 8%;rotate:-45deg;background:linear-gradient(135deg,#FF2E9A,#FFB347);
  box-shadow:0 12px 26px -8px rgba(255,46,154,.9),0 0 0 4px rgba(255,255,255,.14);animation:s5-tombe .8s var(--ressort) .25s both}
@keyframes s5-tombe{from{opacity:0;transform:translate(30%,-80%) scale(.5)}}
.s5-goutte svg{rotate:45deg;width:52%;height:52%;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.s5-moi b,.s5-pin small{padding:3px 10px;border-radius:999px;white-space:nowrap;font-size:clamp(10.5px,3.3cqw,13px);font-weight:800;color:#fff;background:rgba(20,8,12,.62);
  border:1px solid rgba(255,255,255,.18);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.s5-pin{position:absolute;left:var(--l);top:var(--t);width:0;margin-top:-9cqmin;display:flex;flex-direction:column;align-items:center;gap:5px}
.s5-pin .ph{flex:none;width:18cqmin;height:18cqmin;border-radius:50%;padding:3px;background:#fff;box-shadow:0 10px 24px -6px rgba(0,0,0,.85);
  opacity:0;transform:translateY(-60%) scale(0);transition:transform .7s var(--ressort) var(--d),opacity .3s var(--d)}
.s5-pin img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;filter:grayscale(1) brightness(.68);transition:filter .7s ease calc(var(--d) + .3s)}
.s5.la .s5-pin .ph{opacity:1;transform:none}
.s5.dort .s5-pin .ph{animation:s5-dort .5s ease var(--d)}
@keyframes s5-dort{30%{rotate:-8deg}70%{rotate:6deg}}
.s5.echange .s5-pin img{filter:none}
.s5-pin small{opacity:0;transition:opacity .4s calc(var(--d) + .25s)}
.s5.la .s5-pin small{opacity:1}
.s5-offre{padding:4px 11px;border-radius:999px;white-space:nowrap;font-style:normal;font-size:clamp(10.5px,3.3cqw,13px);font-weight:900;color:#fff;
  background:linear-gradient(135deg,#FF2E9A,#FF8A3D);box-shadow:0 8px 20px -6px rgba(255,46,154,.85);transform:scale(0);transition:transform .6s var(--ressort) calc(var(--d,0s) + .55s)}
.s5.echange .s5-offre{transform:none}
.s5.fete .s5-goutte{animation:s-pouf .6s var(--ressort)}

/* ⑥ « Regardons tout ça de plus près. » : le bouton de lecture, et on plonge dans le tour */
.s6{display:grid;place-items:center}
.s6-entre{animation:s6-entre .7s var(--ressort) both}
@keyframes s6-entre{from{opacity:0;transform:scale(.3)}}
.s6-jouer{position:relative;display:grid;place-items:center;width:clamp(96px,30cqmin,150px);aspect-ratio:1;border-radius:50%;background:linear-gradient(135deg,#FF2E9A,#FF8A3D);
  box-shadow:0 20px 60px -10px rgba(255,46,154,.9);transition:transform .6s cubic-bezier(.6,0,.8,.4),opacity .5s ease-in .1s}
.s6-jouer svg{width:38%;height:38%;margin-left:8%;fill:#fff}
.s6-jouer::before,.s6-jouer::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(255,93,184,.75);animation:s6-onde 1.8s ease-out infinite}
.s6-jouer::after{animation-delay:.9s}
@keyframes s6-onde{from{transform:scale(1);opacity:1}to{transform:scale(2.2);opacity:0}}
.s6-titre{position:absolute;left:50%;top:calc(50% + clamp(48px,15cqmin,75px) + 26px);transform:translateX(-50%);padding:8px 16px;border-radius:999px;white-space:nowrap;font-weight:800;font-size:14px;
  transition:opacity .5s}
.s6.plonge .s6-jouer{transform:scale(1.8);opacity:0}
.s6.plonge .s6-titre{opacity:0}
@media (prefers-reduced-motion:reduce){
  .si-aurore i,.si-flotte,.si-fant::before,.si-sol,.s-direct,.s3-halo,.s-av::before,.s5-radar,.s6-jouer::before,.s6-jouer::after,.s1.vu .s1-carte,.s3.fete .s-tel{animation:none!important}
}
/* ④c–④f « JE FAIS RÉAGIR » : ce qui fait la différence avec une vidéo ordinaire. Les trois cages sur la fin
   de sa vidéo (le dessin de l'étape des trois fantômes) ; chacun libère son fantôme, qui répond à ses
   questions ; Instagram et ses j'aime auxquels personne n'a le temps de répondre ; ses messages, chacun par
   son prénom, et la porte qu'on pousse comme un habitué. */
.s7{--pw:min(68cqw,calc((100cqh - 100px) / 1.7375));--py:calc(50% - 6px);--ph:calc(var(--pw) * 1.7375);z-index:5;pointer-events:none}
/* la fin de sa vidéo : l'écran s'assombrit sous la carte « Et vous ? » */
.s7-voile{position:absolute;left:50%;top:var(--py);width:calc(var(--pw) - var(--ph) * .03);height:calc(var(--ph) * .97);transform:translate(-50%,-50%);border-radius:calc(var(--ph) * .1);
  background:linear-gradient(180deg,rgba(12,5,9,.42),rgba(12,5,9,.8));opacity:0;transition:opacity .5s}
.s7.on .s7-voile{opacity:1}
.s7-carte{position:absolute;left:50%;top:calc(var(--py) + var(--ph) * .03);width:calc(var(--pw) * .92);padding:.6em .45em .75em;border-radius:1.2em;text-align:center;
  font-size:calc(var(--pw) * .052);color:#FFF4E6;background:linear-gradient(180deg,rgba(30,16,23,.62),rgba(16,8,12,.94));border:1px solid rgba(255,255,255,.13);
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);box-shadow:0 18px 40px -16px rgba(0,0,0,.85);opacity:0;transform:translate(-50%,14px) scale(.94);
  transition:opacity .35s,transform .7s var(--ressort)}
.s7.on .s7-carte{opacity:1;transform:translate(-50%,0)}
.s7-titre{display:block;margin-bottom:.35em;font-size:1.3em;font-weight:900}
.s7-rang{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.25em}
.s7-f3{position:relative;display:flex;flex-direction:column;align-items:center}
.s7-f3.adore{--c:#FF2E9A}.s7-f3.promis{--c:#F5A23A}.s7-f3.auj{--c:#3DE2A6}
.s7-f3>b{margin-top:.35em;font-size:.86em;font-weight:800;white-space:nowrap}
.s7-cg{position:relative;display:flex;flex-direction:column;align-items:center;width:78%;transform-origin:50% 0;animation:s7-balance 3.6s ease-in-out infinite}
.s7-f3.promis .s7-cg{animation-delay:-1.2s}.s7-f3.auj .s7-cg{animation-delay:-2.4s}
@keyframes s7-balance{0%,100%{transform:rotate(-2.2deg)}50%{transform:rotate(2.2deg)}}
.s7-anneau{position:relative;z-index:2;width:1.1em;height:1.1em;margin-bottom:-.22em;border-radius:50%;border:.18em solid #E8C77A}
.s7-noeud{position:absolute;top:.95em;left:50%;z-index:5;width:1.9em;height:.88em;margin-left:-.95em;
  background:radial-gradient(ellipse 45% 48% at 22% 50%,var(--c) 96%,transparent),radial-gradient(ellipse 45% 48% at 78% 50%,var(--c) 96%,transparent),radial-gradient(circle at 50% 50%,var(--c) 30%,transparent 33%)}
.s7-dome{position:relative;width:100%;aspect-ratio:.86;overflow:hidden;border:.18em solid #E8C77A;border-bottom:0;border-radius:50% 50% 10% 10% / 44% 44% 6% 6%;
  background:radial-gradient(ellipse 70% 55% at 50% 42%,rgba(255,226,180,.2),transparent 72%),rgba(255,244,230,.035)}
.s7-dome::before{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 calc(16.66% - 1.4px),rgba(232,199,122,.85) calc(16.66% - 1.4px) 16.66%)}
.s7-dome::after{content:"";position:absolute;left:0;right:0;top:36%;height:2px;z-index:3;background:rgba(232,199,122,.9)}
.s7-dome img{position:absolute;left:50%;bottom:4%;z-index:2;height:70%;width:auto;transform:translateX(-50%);filter:drop-shadow(0 4px 4px rgba(0,0,0,.45));transition:opacity .2s}
.s7-porte{position:absolute;left:29%;width:42%;bottom:0;height:54%;z-index:4;border:.18em solid #E8C77A;border-bottom:0;border-radius:45% 45% 0 0 / 35% 35% 0 0;transform-origin:0 50%;
  background:repeating-linear-gradient(90deg,transparent 0 calc(33.3% - 1.4px),rgba(232,199,122,.95) calc(33.3% - 1.4px) 33.3%),rgba(20,12,9,.12);transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
.s7-socle{width:110%;height:.9em;margin-top:-1px;border-radius:.4em;background:linear-gradient(#F3DFA0,#B38A3A);box-shadow:0 .45em .8em -.3em rgba(0,0,0,.65),inset 0 -.3em 0 var(--c)}
/* ④d une seule cage : elle choisit « Je viendrai », son fantôme s'envole avec son prénom ; sa question à lui, sa
   réponse à elle, et elle en parle */
.s7-f3.choisie .s7-cg{animation:s7-luit .7s var(--ressort)}
.s7-f3.choisie .s7-dome{box-shadow:0 0 0 .18em var(--c),0 0 1.4em var(--c)}
@keyframes s7-luit{40%{transform:scale(1.14) rotate(-3deg)}}
.s7-doigt{position:absolute;z-index:7;left:50%;top:2.4em;width:2.2em;height:2.2em;margin-left:-1.1em;border-radius:50%;border:.16em solid #fff;background:rgba(255,255,255,.25);
  opacity:0;pointer-events:none}
.s7-f3.choisie .s7-doigt{animation:s7-doigt .9s ease-out both}
@keyframes s7-doigt{0%{opacity:0;transform:scale(1.6)}35%{opacity:1;transform:scale(.8)}100%{opacity:0;transform:scale(1.9)}}
.s7-f3{transition:opacity .5s}
.s7.libere .s7-f3:not(.choisie){opacity:.38}
.s7.libere .s7-f3.choisie .s7-porte{transform:perspective(160px) rotateY(-118deg)}
.s7.libere .s7-f3.choisie .s7-dome img{opacity:0;transition-delay:.15s}
.s7-envol{position:absolute;z-index:6;left:50%;top:1.5em;width:calc(var(--pw) * .2);opacity:0;transform:translate(-50%,0) scale(.5);
  transition:opacity .25s .15s,transform 1.1s var(--ressort) .15s}
.s7-envol img{display:block;width:100%;height:auto;filter:drop-shadow(0 6px 10px rgba(0,0,0,.55))}
.s7-envol b{position:absolute;left:50%;top:96%;transform:translateX(-50%);padding:.1em .55em;border-radius:.6em;white-space:nowrap;font-size:.8em;font-weight:800;color:#fff;background:var(--c)}
.s7.libere .s7-envol{opacity:1;transform:translate(calc(-50% - var(--pw) * .27),calc(var(--ph) * -.34)) scale(1.15)}
.s7.libere .s7-envol img{animation:s7-bob 2.4s ease-in-out 1.3s infinite}
@keyframes s7-bob{50%{transform:translateY(-8%)}}
.s7-q,.s7-r,.s7-partage{position:absolute;z-index:7;margin:0;font-weight:800;line-height:1.25;transform:scale(0);transition:transform .55s var(--ressort)}
.s7-q{left:50%;top:calc(var(--py) - var(--ph) * .455);width:calc(var(--pw) * .86);margin-left:calc(var(--pw) * -.43);display:flex;align-items:center;gap:.5em;padding:.5em .7em;
  border-radius:1em 1em 1em .25em;font-size:calc(var(--pw) * .05);color:#fff;background:linear-gradient(135deg,#FF4FAE,#E0167A);box-shadow:0 10px 22px -10px rgba(255,46,154,.9);transform-origin:0 100%}
.s7-q img{width:2em;height:2em;flex:none;object-fit:contain;border-radius:50%;background:#FFF4E6}
.s7-r{left:calc(50% - var(--pw) * .1);top:calc(var(--py) - var(--ph) * .28);max-width:calc(var(--pw) * .56);padding:.45em .7em;border-radius:1em 1em .25em 1em;
  font-size:calc(var(--pw) * .05);color:#2A1A10;background:#FFF4E6;box-shadow:0 10px 22px -10px rgba(0,0,0,.8);transform-origin:0 100%}
.s7-partage{left:calc(50% - var(--pw) * .1);top:calc(var(--py) - var(--ph) * .15);padding:.3em .7em;border-radius:999px;white-space:nowrap;font-size:calc(var(--pw) * .042);color:#fff;
  background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);transform-origin:0 50%}
.s7.demande .s7-q,.s7.repond .s7-r,.s7.partage .s7-partage{transform:none}

/* ④e Instagram : 214 j'aime, des noms qui défilent ; il faudrait écrire à chacun… 0 message écrit */
.s8{z-index:4}
.s8-carte{position:absolute;left:50%;top:50%;width:min(88cqw,340px);padding:12px 10px 10px;border-radius:22px;color:#fff;
  background:linear-gradient(180deg,rgba(54,32,44,.97),rgba(26,14,20,.97));border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 60px -20px rgba(0,0,0,.85);
  opacity:0;transform:translate(-50%,-50%) translateY(16px) scale(.96);transition:opacity .4s,transform .7s var(--ressort),filter .5s}
.s8.on .s8-carte{opacity:1;transform:translate(-50%,-50%)}
.s8-tete{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 6px 2px}
.s8-tete b{font-size:15px;font-weight:800}
.s8-tete span{font-size:12px;font-weight:700;color:rgba(255,255,255,.5)}
.s8-total{display:flex;align-items:baseline;gap:7px;margin:0 6px 6px}
.s8-total i{font-style:normal;font-size:24px;color:#FF5D8F}
.s8-total b{font-size:32px;font-weight:900;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.s8-total small{font-size:14px;font-weight:700;color:rgba(255,255,255,.75)}
.s8-liste{position:relative;height:172px;overflow:hidden;-webkit-mask-image:linear-gradient(transparent,#000 12%,#000 82%,transparent);mask-image:linear-gradient(transparent,#000 12%,#000 82%,transparent)}
.s8-defile{display:grid;gap:2px}
.s8.aime .s8-defile{animation:s8-defile 10s linear infinite}
@keyframes s8-defile{to{transform:translateY(-50%)}}
.s8-ligne{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:9px;padding:5px 6px;font-size:12.5px}
.s8-ligne .s4-av{width:28px;height:28px}
.s8-ligne span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(255,255,255,.8)}
.s8-ligne strong{font-weight:800;color:#fff}
.s8-ligne i{font-style:normal;color:#FF5D8F}
.s8-ligne em{font-style:normal;font-size:11px;font-weight:800;white-space:nowrap;padding:3px 8px;border-radius:999px;color:#fff;border:1px dashed rgba(255,255,255,.5);background:rgba(255,255,255,.08);
  opacity:0;transform:scale(.6);transition:opacity .25s calc(var(--k) * .06s),transform .45s var(--ressort) calc(var(--k) * .06s)}
.s8.ecrit .s8-ligne em{opacity:1;transform:none}
.s8-compte{margin:8px 6px 0;padding:7px 10px;border-radius:12px;text-align:center;font-size:13px;font-weight:800;color:#fff;background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.14);opacity:0;transform:translateY(6px);transition:opacity .3s .35s,transform .5s var(--ressort) .35s}
.s8-compte b{color:#FF5D8F}
.s8.ecrit .s8-compte{opacity:1;transform:none}
.s8.rien .s8-carte{filter:grayscale(.85) brightness(.5)}
.s8-verdict{position:absolute;left:50%;top:50%;display:grid;justify-items:center;gap:8px;transform:translate(-50%,-50%) rotate(-4deg) scale(0);transition:transform .6s var(--ressort) .15s;pointer-events:none}
.s8-verdict b{padding:.28em .85em;border-radius:999px;white-space:nowrap;font-weight:900;font-size:clamp(20px,6.4cqmin,32px);color:#fff;background:linear-gradient(135deg,#FF2E9A,#FF8A3D);
  box-shadow:0 0 0 4px rgba(11,3,6,.9),0 14px 34px -10px rgba(255,46,154,.9)}
.s8-verdict small{padding:.35em .9em;border-radius:999px;white-space:nowrap;font-size:13px;font-weight:800;color:#2A1406;background:#FFF4E6;box-shadow:0 8px 20px -8px rgba(0,0,0,.8)}
.s8.rien .s8-verdict{transform:translate(-50%,-50%) rotate(-4deg)}

/* ④f lui le fait : les 214 qui ont libéré leur fantôme, un message chacun, par son prénom ; puis la porte */
.s9{z-index:4}
.s9-carte{position:absolute;left:50%;top:50%;width:min(88cqw,340px);padding:12px 10px 10px;border-radius:22px;color:#fff;
  background:linear-gradient(180deg,rgba(62,36,49,.97),rgba(30,16,23,.97));border:1px solid rgba(255,214,140,.25);box-shadow:0 24px 60px -20px rgba(0,0,0,.85);
  opacity:0;transform:translate(-50%,-50%) translateY(16px) scale(.96);transition:opacity .4s,transform .7s var(--ressort)}
.s9.on .s9-carte{opacity:1;transform:translate(-50%,-50%)}
.s9.porte .s9-carte{opacity:0;transform:translate(-50%,-60%) scale(.92)}
.s9-tete{display:flex;align-items:center;gap:9px;margin:0 4px 6px}
.s9-tete img{width:34px;height:34px;flex:none;object-fit:contain;border-radius:50%;background:#FFF4E6;padding:2px}
.s9-tete span{display:grid;gap:1px}
.s9-tete b{font-size:15px;font-weight:800}
.s9-tete small{font-size:12px;font-weight:700;color:rgba(255,255,255,.6)}
.s9-ligne{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:8px;padding:5px 4px;font-size:12.5px;line-height:1.3;
  opacity:0;transform:translateX(-12px);transition:opacity .3s calc(var(--k) * .22s),transform .5s var(--ressort) calc(var(--k) * .22s)}
.s9.ecrit .s9-ligne{opacity:1;transform:none}
.s9-ligne .s4-av{width:28px;height:28px}
.s9-ligne span{min-width:0;color:#fff;font-weight:700}
.s9-ligne span i{font-style:normal;font-weight:900;background:linear-gradient(90deg,#FF5DB8,#FFB347);-webkit-background-clip:text;background-clip:text;color:transparent}
.s9-ligne em{font-style:normal;font-size:11px;font-weight:800;color:#3DE2A6;white-space:nowrap;opacity:0;transition:opacity .3s calc(.3s + var(--k) * .22s)}
.s9.ecrit .s9-ligne em{opacity:1}
.s9-compte{margin:8px 4px 0;padding:7px 10px;border-radius:12px;text-align:center;font-size:13px;font-weight:800;color:#04150E;background:linear-gradient(135deg,#9FF5C9,#3DE2A6);
  opacity:0;transform:translateY(6px);transition:opacity .3s .5s,transform .5s var(--ressort) .5s}
.s9-compte b{font-variant-numeric:tabular-nums}
.s9.ecrit .s9-compte{opacity:1;transform:none}
.s9-porte{position:absolute;left:50%;top:50%;display:flex;flex-direction:column;align-items:center;width:min(60cqmin,240px);opacity:0;transform:translate(-50%,-50%) scale(.9);
  transition:opacity .45s .15s,transform .8s var(--ressort) .15s}
.s9.porte .s9-porte{opacity:1;transform:translate(-50%,-50%)}
.s9-enseigne{max-width:100%;margin-bottom:10px;padding:6px 14px;border-radius:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:900;font-size:14px;color:#FFD9A0;
  background:linear-gradient(180deg,#3B1E2B,#22111A);border:1px solid rgba(255,214,140,.5);box-shadow:0 0 22px rgba(255,180,90,.25)}
.s9-cadre{position:relative;width:58%;aspect-ratio:.62;border-radius:14px 14px 4px 4px;background:linear-gradient(#2A1E1A,#1A100C);box-shadow:inset 0 0 0 4px #C9A45C,0 20px 40px -14px rgba(0,0,0,.8)}
.s9-vitre{position:absolute;left:14%;right:14%;top:8%;height:46%;border-radius:8px;background:radial-gradient(ellipse at 50% 85%,#FFC27A,#B9652B 58%,#4A1E10);
  box-shadow:inset 0 0 14px rgba(0,0,0,.55);transition:filter .6s}
.s9.habitue .s9-vitre{filter:brightness(1.4) saturate(1.2)}
.s9-poignee{position:absolute;right:12%;top:60%;width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFE6A6,#B98A2E)}
.s9-av{position:relative;z-index:2;display:flex;gap:6px;margin-top:-20px}
.s9-av b{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;font-weight:900;font-size:13px;color:#fff;background:var(--c);box-shadow:0 0 0 3px rgba(20,10,14,.9);
  opacity:0;transform:translateY(40px) scale(.6);transition:opacity .3s calc(.4s + var(--k) * .15s),transform .7s var(--ressort) calc(.4s + var(--k) * .15s)}
.s9.porte .s9-av b{opacity:1;transform:none}
.s9-badge{margin-top:12px;padding:7px 15px;border-radius:999px;white-space:nowrap;font-weight:900;font-size:15px;color:#2A1406;background:linear-gradient(135deg,#FFE08A,#E7A52E);
  box-shadow:0 10px 26px -8px rgba(231,165,46,.8);transform:rotate(-4deg) scale(0);transition:transform .6s var(--ressort)}
.s9.habitue .s9-badge{transform:rotate(-4deg)}
@media (prefers-reduced-motion:reduce){.s7-cg,.s7.libere .s7-envol img,.s8.aime .s8-defile{animation:none}}
"""

HTML_DEVISE = '  <p class="devise">Vous faites. <em>Votre fantôme raconte.</em></p>\n'
HTML_INTRO = """  <div class="intro" id="intro" hidden>
    <svg class="si-defs" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="si-g" gradientUnits="userSpaceOnUse" x1="2" y1="2" x2="22" y2="22"><stop offset="0" stop-color="#FF5DB8"/><stop offset="1" stop-color="#FFB347"/></linearGradient>
      <symbol id="si-etoile" viewBox="0 0 24 24"><path fill="url(#si-g)" d="M12 1.5C12.8 8 16 11.2 22.5 12 16 12.8 12.8 16 12 22.5 11.2 16 8 12.8 1.5 12 8 11.2 11.2 8 12 1.5Z"/></symbol>
      <symbol id="si-coeur" viewBox="0 0 24 24"><path fill="url(#si-g)" d="M12 21s-7.5-4.6-9.5-9.3C1.1 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.9 3.5 4.5 7.2C19.5 16.4 12 21 12 21Z"/></symbol>
    </defs></svg>
    <div class="si-aurore" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="si-aurore si-aurore-or" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="si-haut">
      <img src="logo.png" alt="ClikMe">
      <div class="si-progres" id="si-progres" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <button type="button" class="intro-passer" id="intro-passer">Passer ›</button>
    </div>
    <div class="si-chap" id="si-chap" aria-live="polite"></div>
    <div class="si-scene" id="si-scene">
      <div class="si-decor" id="si-decor"></div>
      <div class="si-bulle"><p id="intro-dit" aria-live="polite"></p></div>
      <div class="si-fant" id="si-fant" aria-hidden="true">
        <span class="si-sol"></span>
        <div class="si-flotte"><div class="si-corps"><img class="si-repos" src="__F0__" alt=""><img class="si-parle" src="__F1__" alt=""><img class="si-salue" src="__F2__" alt=""></div></div>
      </div>
    </div>
  </div>
"""

JS_DONNEES = r"""
  /* ═══ L'INTRO (voir jouerIntro) ═══
     Six répliques, chacune avec sa scène, au milieu de l'écran. « debut » : ce qui se passe quand la
     scène arrive ; « mots » : ce qui se passe quand un mot s'écrit dans la bulle — c'est-à-dire au moment
     où sa voix le dit ; « apres » : le temps laissé à la scène avant la phrase suivante ; « garde » : la
     scène s'ajoute à la précédente au lieu de la remplacer. Les répliques enregistrées ont leurs instants
     mesurés ; une réplique pas encore enregistrée s'écrit sur un rythme estimé, sans son. */
  const INTRO_MOMENTS = __MOMENTS__, INTRO_QUI = __QUI__, INTRO_LIEU = __LIEU__, INTRO_OFFRE = __OFFRE__, INTRO_VOISINS = __VOISINS__, INTRO_FANT = __FANT__, INTRO_AVANT = __AVANT__, INTRO_QR = __QR__;
  /* Le film monté en interview (celui de la fin du tour) : un seul lecteur, créé dès le début de l'intro pour qu'il
     soit chargé quand le fantôme dit « je raconte », puis posé dans l'écran du téléphone. Sans son : c'est
     le fantôme qui parle. */
  let iFilm = null;
  const filmIntro = () => {
    if (!iFilm) {
      iFilm = document.createElement("video");
      iFilm.className = "s-film"; iFilm.muted = true; iFilm.defaultMuted = true; iFilm.playsInline = true;
      iFilm.setAttribute("muted", ""); iFilm.setAttribute("playsinline", "");
      iFilm.preload = "auto"; iFilm.poster = INTRO_AVANT[2] + ".jpg"; iFilm.src = INTRO_AVANT[2] + ".mp4";
    }
    return iFilm;
  };
  const iFilmPose = () => { const e = decorIntro(".s-ecran-film"); if (e) e.prepend(filmIntro()); };
  const iFilmJoue = () => {
    const v = filmIntro();
    try { v.currentTime = 0; } catch (e) { /* pas encore chargé */ }
    const p = v.play(); if (p) p.catch(() => {});
  };
  const decorIntro = (sel) => { const d = $("#si-decor"); return sel ? d.querySelector(sel) : d; };
  const iAllume = (sel, cls = "on") => () => { const e = decorIntro(sel); if (e) e.classList.add(cls); };
  const iEteins = (sel, ...cls) => () => { const e = decorIntro(sel); if (e) e.classList.remove(...cls); };
  const iGeste = (cls, ms) => () => { const f = $("#si-fant"); f.classList.add(cls); if (ms) setTimeout(() => f.classList.remove(cls), ms); };
  const iSon = (n) => () => son(n);
  const iTout = (...fs) => () => fs.forEach((f) => f());
  const iPuis = (ms, f) => () => setTimeout(f, ms);
  // les jetons qui circulent entre les commerces (aller et retour), lancés quand ils s'échangent
  const iJetons = () => $$("#si-decor animateMotion").forEach((a, k) => { try { a.beginElementAt((k % 2) * 0.9 + Math.floor(k / 2) * 0.17); } catch (e) { /* SMIL absent : les arcs suffisent */ } });
  const I_ICO = {
    camera: '<rect x="2.5" y="6" width="13" height="12" rx="3.2"/><path d="M15.5 10.3 21 7.2v9.6l-5.5-3.1"/>',
    ciseaux: '<circle cx="6" cy="6.5" r="2.7"/><circle cx="6" cy="17.5" r="2.7"/><path d="M8.3 8.2 20 18.5M8.3 15.8 20 5.5"/>',
    envoi: '<path d="M21.5 2.5 10.4 13.6"/><path d="M21.5 2.5 14.6 21.4l-4.2-7.8-7.8-4.2Z"/>',
    oeil: '<path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3.2"/>',
    horloge: '<circle cx="12" cy="12" r="9.2"/><path d="M12 7v5.2l3.4 2.1"/>',
    coeur: '<path d="M12 21s-7.5-4.6-9.5-9.3C1.1 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.9 3.5 4.5 7.2C19.5 16.4 12 21 12 21Z"/>',
    lien: '<path d="M10 13.5a4.2 4.2 0 0 0 6 0l3-3a4.2 4.2 0 0 0-6-6l-1.2 1.2"/><path d="M14 10.5a4.2 4.2 0 0 0-6 0l-3 3a4.2 4.2 0 0 0 6 6l1.2-1.2"/>',
    bulle: '<path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.4L3.5 20.5l1.6-4.4A8.4 8.4 0 1 1 20.5 11.6Z"/>',
    fleche: '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>',
    boutique: '<path d="M3.5 9.5 5 4.5h14l1.5 5"/><path d="M3.5 9.5a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.8 0 2.8 2.8 0 0 0 5.6 0"/><path d="M5.2 12.4V20h13.6v-7.6M10 20v-4.5h4V20"/>',
  };
  const iIco = (n, cls = "s-ico") => '<svg' + (cls ? ' class="' + cls + '"' : "") + ' viewBox="0 0 24 24" aria-hidden="true">' + I_ICO[n] + "</svg>";
  const I_ETOILES = [[-.62, -.72, 26, 0], [.6, -.66, 20, .08], [.74, .05, 30, .16], [-.76, .2, 18, .1], [-.28, -.92, 16, .22], [.3, .88, 22, .05], [-.58, .8, 24, .18], [.48, -.98, 14, .28], [.05, -1.04, 18, .12]];
  const iEtoiles = () => I_ETOILES.map(([x, y, s, d]) => '<svg class="s-etin" viewBox="0 0 24 24" aria-hidden="true" style="--ex:calc(var(--w) * ' + x + ");--ey:calc(var(--w) * " + y + ");--s:" + s + "px;--d:" + d + 's"><use href="#si-etoile"/></svg>').join("");
  // les chiffres d'exemple de la vidéo ClikMe (j'aime, vues, partages)
  const I_STATS = [122, 489, 37];
  const I_ICO_PLEIN = {
    coeur: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.3C1.1 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 5.9 3.5 4.5 7.2C19.5 16.4 12 21 12 21Z"/></svg>',
    vue: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.6v14.8L19.5 12z"/></svg>',
    part: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 11.2 21.5 3l-8.2 19-2.6-8.2z"/></svg>',
  };
  // un compteur qui monte de 0 à sa valeur, vite puis plus doucement
  const iCompte = (sel, ms) => () => { const e = decorIntro(sel); if (e) e.querySelectorAll("b[data-n]").forEach((b) => {
    const n = +b.dataset.n, t0 = performance.now();
    const pas = (t) => { const k = Math.min(1, (t - t0) / ms); b.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(pas); };
    requestAnimationFrame(pas);
  }); };
  const I_AMIS = [["C", "linear-gradient(135deg,#FF2E9A,#FF8A3D)", "Camille", "Regarde ce que fait " + INTRO_QUI + NB + "!"],
    ["M", "linear-gradient(135deg,#7C4DFF,#FF5DB8)", "Mehdi", "Trop beau 😍"], ["S", "linear-gradient(135deg,#2FBF8F,#3DA8E2)", "Sophie", "On y va samedi" + NB + "?"]];
  // ④d la cage qu'elle choisit (« Je viendrai ») ; ④e qui a aimé, sur Instagram ; ④f ses messages, chacun par son
  // prénom. Des prénoms et des comptes inventés ; sa question et sa réponse sont propres au commerce (INTRO_QR).
  const I_CAGES = [["adore", "J’adore"], ["promis", "Je viendrai"], ["auj", "Aujourd’hui"]];
  const I_LIKES = [["camille.dx", "Camille"], ["mehdi_b", "Mehdi"], ["sophie.lmr", "Sophie"], ["thomas_40", "Thomas"], ["ines.dax", "Inès"],
    ["lucas.rd", "Lucas"], ["jade.b", "Jade"], ["hugo_dx", "Hugo"], ["lea.mrt", "Léa"], ["nadia.k", "Nadia"]];
  const I_TEINTES = ["#FF2E9A,#FF8A3D", "#7C4DFF,#FF5DB8", "#2FBF8F,#3DA8E2", "#F5A23A,#FF5D5D", "#3DA8E2,#7C4DFF"];
  const I_MOTS = ["c’est le moment" + NB + ": il en reste trois" + NB + "!", "tu passes samedi" + NB + "?", "ton amie Léa vient aussi 😊",
    "ça t’a plu" + NB + "? Dis-le-moi" + NB + "!", "on se voit cette semaine" + NB + "?"];
  const I_TOTAL = 214;
  const DECORS_INTRO = {
    moments: () => '<div class="s1"><div class="s1-chip verre"><i class="s-direct"></i>Aujourd’hui · ' + INTRO_LIEU + "</div>" +
      INTRO_MOMENTS.map(([s, l], k) => '<figure class="s1-carte" data-k="' + k + '"><div class="s1-ph"><img src="' + s + '" alt=""></div><figcaption>' + l + "</figcaption></figure>").join("") +
      '<span class="s1-badge"><span class="s-pastille">' + iIco("oeil") + "</span>À voir</span>" + iEtoiles() + "</div>",
    temps: () => '<div class="s2" style="--duree:' + ((TEMPS["intro-2"] ? TEMPS["intro-2"].d : 3) + 0.4).toFixed(2) + 's">' +
      '<svg class="s2-anneau" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="si-g5" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">' +
      '<stop offset="0" stop-color="#FF2E9A"/><stop offset="1" stop-color="#FFB347"/></linearGradient></defs><circle class="piste" cx="50" cy="50" r="47"/>' +
      Array.from({ length: 60 }, (_, k) => {
        const a = k * Math.PI / 30, fort = k % 5 === 0, r1 = fort ? 41.4 : 43;
        return '<line class="tic' + (fort ? " fort" : "") + '" x1="' + (50 + r1 * Math.cos(a)).toFixed(2) + '" y1="' + (50 + r1 * Math.sin(a)).toFixed(2) +
          '" x2="' + (50 + 44.6 * Math.cos(a)).toFixed(2) + '" y2="' + (50 + 44.6 * Math.sin(a)).toFixed(2) + '"/>';
      }).join("") + '<circle class="temps" cx="50" cy="50" r="47" pathLength="1"/></svg><div class="s2-mots">' +
      // « filmer, monter, publier : et rajouter animer les réseaux sociaux »
      [["camera", "Filmer"], ["ciseaux", "Monter"], ["envoi", "Publier"], ["bulle", "Animer", "les réseaux sociaux"]].map(([i, t, s], k) => '<div class="s2-mot" data-k="' + k + '" style="--d:' + k * 0.12 + 's"><span class="s2-tuile">' +
        iIco(i, "") + "</span><b>" + t + (s ? "<small>" + s + "</small>" : "") + "</b></div>").join("") + '</div><span class="s2-verdict">Pas le temps.</span></div>',
    // ②b la chaîne : vidéos partagées avec le cœur → sympathie → fidélité, puis ses clients qui s'attachent
    attache: () => '<div class="s2b">' +
      [["camera", "Des vidéos partagées", "avec le cœur"], ["coeur", "La sympathie", ""], ["lien", "La fidélité", ""]].map(([i, m, p], k) =>
        (k ? '<i class="s2b-fleche" data-f="' + k + '"></i>' : "") + '<div class="s2b-pas" data-p="' + k + '"><span class="s2-tuile">' + iIco(i, "") + "</span><b>" + m +
        (p ? "<small>" + p + "</small>" : "") + "</b></div>").join("") +
      '<div class="s2b-fin"><span class="s2b-av">' + I_AMIS.map(([l, c]) => '<b style="--c:' + c + '">' + l + "</b>").join("") + "</span>Vos clients s’attachent à vous</div>" +
      Array.from({ length: 9 }, (_, k) => '<svg class="s2b-coeur" viewBox="0 0 24 24" aria-hidden="true" style="--dx:' + Math.round(Math.sin(k * 2.1) * 90) + "px;--s:" + (14 + (k * 7) % 14) +
        "px;--r:" + ((k * 41) % 60 - 30) + "deg;--d:" + (k * 0.12).toFixed(2) + 's"><use href="#si-coeur"/></svg>').join("") + "</div>",
    raconte: () => '<div class="s3"><div class="s3-halo"></div>' +
      // seul au milieu : son fantôme s'allume, puis la vidéo ClikMe
      // son affiche en fond d'écran : si le film tarde ou ne se lit pas, on voit au moins sa première image
      '<div class="s-tel s-tel-b"><div class="s-ecran s-ecran-film" style="--affiche:url(' + INTRO_AVANT[2] + '.jpg)"><span class="s-ile"></span>' +
      '<div class="s-av"><img src="' + INTRO_FANT + '" alt=""></div>' +
      '<div class="s-titre"><b>Votre fantôme</b><span>raconte votre journée</span></div>' +
      '<div class="s-rail"><span class="s-r-coeur">' + iIco("coeur", "") + "</span><span>" + iIco("bulle", "") + '</span><span class="s-r-part">' + iIco("envoi", "") + "</span></div>" +
      "</div></div>" + iEtoiles() +
      '<div class="s-qui"><img src="' + INTRO_FANT + '" alt=""><span><b>Monté par ClikMe</b><small>sans effort pour vous</small></span></div>' +
      '<div class="s-stats">' + [["coeur", "J’aime"], ["vue", "vues"], ["part", "partages"]].map(([i, l], k) =>
        '<span><b data-n="' + I_STATS[k] + '">0</b><small>' + I_ICO_PLEIN[i] + l + "</small></span>").join("") + "</div>" +
      "</div>",
    partage: () => '<div class="s4">' +
      I_AMIS.map(([l, c, nom, t], k) => '<div class="s4-notif verre" data-k="' + k + '" style="--k:' + k + ";--d:" + k * 0.22 + 's"><b class="s4-av" style="--c:' + c + '">' + l +
        "</b><span><strong>" + nom + "</strong><small>maintenant</small><em>" + t + "</em></span></div>").join("") +
      Array.from({ length: 10 }, (_, k) => '<svg class="s4-coeur" viewBox="0 0 24 24" aria-hidden="true" style="--dx:' + Math.round(Math.sin(k * 2.3) * 70) + "px;--s:" + (16 + (k * 7) % 16) +
        "px;--r:" + ((k * 37) % 60 - 30) + "deg;--d:" + (0.1 + k * 0.11).toFixed(2) + 's"><use href="#si-coeur"/></svg>').join("") + "</div>",
    // ④c ④d les trois cages, sur la fin de sa vidéo ; elle en choisit une, son fantôme s'envole ; sa question, sa réponse
    cages: () => '<div class="s7"><span class="s7-voile"></span><div class="s7-carte"><b class="s7-titre">Et vous' + NB + '?</b><div class="s7-rang">' +
      I_CAGES.map(([c, l], k) => '<div class="s7-f3 ' + c + '" style="--k:' + k + '"><span class="s7-cg"><i class="s7-anneau"></i><i class="s7-noeud"></i><span class="s7-dome"><img src="si-g' + (k + 1) +
        '.webp" alt=""><i class="s7-porte"></i></span><i class="s7-socle"></i></span><b>' + l + "</b>" +
        (k === 1 ? '<span class="s7-doigt"></span><span class="s7-envol"><img src="si-g2.webp" alt=""><b>Camille</b></span>' : "") + "</div>").join("") + "</div></div>" +
      '<p class="s7-q"><img src="' + INTRO_FANT + '" alt=""><span>' + INTRO_QR[0] + '</span></p><p class="s7-r">' + INTRO_QR[1] + '</p><p class="s7-partage">💬 Camille en parle à sa sœur</p></div>',
    // ④e Instagram : 214 j'aime, des noms qui défilent ; il faudrait écrire à chacun
    instagram: () => {
      const ligne = ([compte, p], k) => '<div class="s8-ligne" style="--k:' + (k % 10) + '"><b class="s4-av" style="--c:linear-gradient(135deg,' + I_TEINTES[k % 5] + ')">' + p[0] +
        "</b><span><strong>" + compte + "</strong> <i>♥</i> a aimé</span><em>✉ à écrire</em></div>";
      return '<div class="s8"><div class="s8-carte"><div class="s8-tete"><b>Instagram</b><span>Votre vidéo</span></div>' +
        '<div class="s8-total"><i>♥</i><b data-n="' + I_TOTAL + '">0</b><small>j’aime</small></div>' +
        '<div class="s8-liste"><div class="s8-defile">' + I_LIKES.concat(I_LIKES).map(ligne).join("") + "</div></div>" +
        '<div class="s8-compte"><b>0</b> message écrit sur ' + I_TOTAL + "</div></div>" +
        '<div class="s8-verdict"><b>Pas le temps.</b><small>' + I_TOTAL + " messages à écrire, chaque jour</small></div></div>";
    },
    // ④f lui le fait : un message à chacun, par son prénom ; puis la porte qu'ils poussent, comme des habitués
    prenoms: () => '<div class="s9"><div class="s9-carte"><div class="s9-tete"><img src="' + INTRO_FANT + '" alt=""><span><b>Vos fantômes</b><small>' + I_TOTAL +
      " ont libéré leur fantôme sur votre vidéo</small></span></div>" +
      I_MOTS.map((m, k) => '<div class="s9-ligne" style="--k:' + k + '"><b class="s4-av" style="--c:linear-gradient(135deg,' + I_TEINTES[k] + ')">' + I_LIKES[k][1][0] + "</b><span><i>" +
        I_LIKES[k][1] + "</i>, " + m + "</span><em>✓ envoyé</em></div>").join("") +
      '<div class="s9-compte"><b data-n="' + I_TOTAL + '">0</b> messages envoyés, chacun par son prénom</div></div>' +
      '<div class="s9-porte"><span class="s9-enseigne">' + INTRO_LIEU + '</span><span class="s9-cadre"><i class="s9-vitre"></i><i class="s9-poignee"></i></span>' +
      '<span class="s9-av">' + I_AMIS.map(([l, c], k) => '<b style="--c:' + c + ";--k:" + k + '">' + l + "</b>").join("") + '</span><span class="s9-badge">⭐ Déjà des habitués</span></div></div>',
    voisins: () => {
      const ou = [[20, 24], [80, 24], [20, 70], [80, 70]], cx = 50, cy = 47;
      const arc = ([x, y]) => { const dx = x - cx, dy = y - cy; return "M" + cx + " " + cy + " Q" + ((cx + x) / 2 - dy * 0.25).toFixed(1) + " " + ((cy + y) / 2 + dx * 0.25).toFixed(1) + " " + x + " " + y; };
      return '<div class="s5"><div class="s5-carte"><svg class="s5-plan" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="si-g3" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">' +
        '<stop offset="0" stop-color="#E79A2A"/><stop offset="1" stop-color="#FFD27A"/></linearGradient></defs>' +
        '<path class="eau" d="M-4 16C18 22 34 8 56 14S88 22 104 12"/><ellipse class="parc" cx="88" cy="90" rx="16" ry="11"/><ellipse class="parc" cx="8" cy="48" rx="9" ry="7"/>' +
        '<path class="rue" d="M-4 36H104M-4 60H104M34-4V104M66-4V104M-4 104 46 54"/><path class="ruelle" d="M-4 86H104M12-4V104M88-4V104M50 -4V22M66 74 104 46"/>' +
        '<circle class="rayon" cx="' + cx + '" cy="' + cy + '" r="38"/>' +
        ou.map((p, k) => '<path class="arc" pathLength="1" style="--d:' + k * 0.12 + 's" d="' + arc(p) + '"/>').join("") +
        ou.map((p) => [0, 1].map((r) => '<g class="jeton"><circle r="2.6" fill="#F6B54B" opacity=".4"/><circle r="1.25" fill="#fff"/><animateMotion dur="1.8s" begin="indefinite" repeatCount="indefinite"' +
          (r ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : "") + ' path="' + arc(p) + '"/></g>').join("")).join("") + "</svg>" +
        '<span class="s5-radar"></span><span class="s5-radar"></span><span class="s5-pas">À deux pas</span>' +
        '<div class="s5-moi"><span class="s5-goutte">' + iIco("boutique", "") + "</span><b>" + INTRO_LIEU + '</b><em class="s5-offre">' + INTRO_OFFRE + "</em></div>" +
        INTRO_VOISINS.map(([s, t, o], k) => '<div class="s5-pin" style="--l:' + ou[k][0] + "%;--t:" + ou[k][1] + "%;--d:" + k * 0.12 + 's"><span class="ph"><img src="' + s + '" alt=""></span><small>' + t +
          '</small><em class="s5-offre">' + o + "</em></div>").join("") + "</div></div>";
    },
    regardez: () => '<div class="s6"><div class="s6-entre"><span class="s6-jouer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg></span></div>' +
      '<div class="s6-chaps"><span><b>01</b>Plus de clients</span><span><b>02</b>Moins de dépenses</span></div></div>',
    // la carte qui ouvre un chapitre
    chapitre: (l) => '<div class="s0"><span class="s0-num">0' + l.chapitre + "</span><small>Chapitre " + l.chapitre + "</small><h2>" + l.titre + "</h2><p>" + l.sous + "</p></div>",
  };
  const INTRO = [
    { chapitre: 1, nomChap: "Plus de clients", titre: "Plus de <em>clients</em>", sous: "Être connu et reconnu." },
    { nom: "intro-1", x: 42, decor: "moments", apres: 450, debut: iAllume(".s1-chip"), dit: "Chaque jour, chez vous, il se passe quelque chose qui mérite d’être *vu.",
      mots: { jour: iTout(iAllume('[data-k="0"]'), iSon("pop")), vous: iTout(iAllume('[data-k="1"]'), iSon("pop")), passe: iTout(iAllume('[data-k="2"]'), iSon("glissement")),
        vu: iTout(iAllume(".s1", "vu"), iSon("magie")) } },
    { nom: "intro-2", x: 58, decor: "temps", apres: 1500, debut: iAllume(".s2", "file"), dit: "Qui a le *temps de filmer, monter, publier et animer les réseaux sociaux" + NB + "?",
      mots: { filmer: iTout(iAllume('[data-k="0"]'), iSon("declic")), monter: iTout(iAllume('[data-k="1"]'), iSon("declic")),
        publier: iTout(iAllume('[data-k="2"]'), iSon("declic")), animer: iTout(iAllume('[data-k="3"]'), iSon("declic")),
        sociaux: iPuis(420, iTout(iAllume(".s2", "barre"), iAllume(".s2", "vide"), iGeste("inquiet", 900), iSon("choc"))) } },
    // « il faudrait rajouter ici que c'est pourtant essentiel » : la chaîne de la sympathie, sur le même anneau
    { nom: "intro-2b", x: 50, decor: "attache", garde: true, apres: 1500,
      dit: "Pourtant, c’est *essentiel" + NB + ": des vidéos partagées avec le *cœur créent de la *sympathie, et la sympathie crée la *fidélité. Vos clients *s’attachent à vous, naturellement.",
      mots: { essentiel: iTout(iAllume(".s2", "efface"), iGeste("saute", 800), iSon("magie")), "cœur": iTout(iAllume('.s2b-pas[data-p="0"]'), iSon("pop")),
        sympathie: iTout(iAllume('.s2b-fleche[data-f="1"]'), iAllume('.s2b-pas[data-p="1"]'), iSon("note")),
        "fidélité": iTout(iAllume('.s2b-fleche[data-f="2"]'), iAllume('.s2b-pas[data-p="2"]'), iSon("accord")),
        sattachent: iTout(iAllume(".s2b-fin"), iAllume(".s2b", "fete"), iGeste("salue", 1500), iSon("ding")) } },
    { nom: "intro-3", x: 50, decor: "raconte", apres: 300, debut: iTout(iAllume(".s3"), iFilmPose, iSon("glissement")), dit: "Moi, je suis votre *fantôme. Je raconte à votre place.",
      mots: { moi: iTout(iAllume(".s3", "fete"), iGeste("saute", 800), iGeste("salue", 1500), iSon("magie")), raconte: iTout(iAllume(".s3", "joue"), iFilmJoue, iSon("elan")) } },
    { nom: "intro-4", x: 50, decor: "partage", garde: true, apres: 750, debut: iTout(iAllume(".s3", "chiffres"), iSon("pop"), iPuis(700, iCompte(".s-stats", 3200))), dit: "Et une histoire, ça se *partage.",
      mots: { histoire: iTout(iAllume(".s3", "aime"), iSon("pop")),
        partage: iTout(iAllume(".s4", "vole"), iAllume(".s3", "envoie"), iSon("carte"), iPuis(450, iTout(iAllume(".s3", "gagne"), iSon("ding")))) } },
    // « On ne sait pas pourquoi ni comment il donne envie de les partager » : ce qui fait la différence avec une
    // vidéo ordinaire. Il fait réagir (les trois cages, sur la fin de la vidéo) ; chacun libère son fantôme et
    // répond à ses questions ; sur Instagram, on voit qui a aimé, mais personne n'a le temps d'écrire à chacun ;
    // lui le fait, par leur prénom, et ils poussent la porte comme des habitués.
    { nom: "intro-4c", x: 50, decor: "cages", garde: true, apres: 300, debut: iEteins(".s4", "vole", "vole2"),
      dit: "Une belle vidéo, tout le monde sait en faire. Moi, je fais *réagir.",
      mots: { moi: iGeste("saute", 800), "réagir": iTout(iAllume(".s7"), iSon("pop")) } },
    { nom: "intro-4d", x: 50, garde: true, apres: 2200,
      dit: "À la fin de votre vidéo, chacun *libère son fantôme de sa cage. Et c’est là que mon vrai travail commence" + NB + ": je leur pose des *questions, je les fais *parler de vous.",
      mots: { chacun: iTout(iAllume(".s7-f3.promis", "choisie"), iSon("declic")), "libère": iTout(iAllume(".s7", "libere"), iSon("magie")),
        commence: iTout(iAllume(".s7", "demande"), iSon("pop")), questions: iTout(iAllume(".s7", "repond"), iSon("note")),
        parler: iTout(iAllume(".s7", "partage"), iSon("carte")) } },
    { nom: "intro-4e", x: 50, decor: "instagram", apres: 1200, debut: iTout(iAllume(".s8"), iPuis(250, iCompte(".s8-total", 1800))),
      dit: "Sur Instagram, vous voyez qui a *aimé. Mais écrire à *chacun pour créer du lien, qui a le *temps" + NB + "?",
      mots: { "aimé": iTout(iAllume(".s8", "aime"), iSon("pop")), chacun: iTout(iAllume(".s8", "ecrit"), iSon("declic")),
        temps: iTout(iAllume(".s8", "rien"), iGeste("inquiet", 900), iSon("choc")) } },
    { nom: "intro-4f", x: 50, decor: "prenoms", apres: 1600, debut: iAllume(".s9"),
      dit: "Moi, je le fais. Chacun par son *prénom, au bon moment. Si bien que le jour où ils poussent votre *porte, ils se sentent déjà comme des *habitués.",
      mots: { moi: iTout(iGeste("saute", 800), iSon("magie")), "prénom": iTout(iAllume(".s9", "ecrit"), iPuis(500, iCompte(".s9-compte", 1800)), iSon("pop")),
        porte: iTout(iAllume(".s9", "porte"), iSon("glissement")), "habitués": iTout(iAllume(".s9", "habitue"), iGeste("salue", 1500), iSon("ding")) } },
    { chapitre: 2, nomChap: "Moins de dépenses", titre: "Moins de <em>dépenses</em>", sous: "Grâce à vos commerçants voisins." },
    { nom: "intro-5", x: 60, decor: "voisins", apres: 800, debut: iAllume(".s5-carte"),
      dit: "Vos *voisins commerçants sont à deux pas, et vous n’en profitez pas. Avec moi, vous vous *échangez vos produits et vos services.",
      mots: { voisins: iTout(iAllume(".s5", "la"), iSon("pop")), pas: iTout(iAllume(".s5", "pas"), iSon("souffle")), profitez: iTout(iAllume(".s5", "dort"), iGeste("inquiet", 600)),
        moi: iGeste("saute", 800), échangez: iTout(iAllume(".s5", "echange"), iJetons, iSon("piece")), services: iTout(iAllume(".s5", "fete"), iGeste("salue", 1500), iSon("accord")) } },
    // « Regardez » → « Regardons tout ça de plus près » : le bouton de lecture s'anime sur « regardons »,
    // on plonge dans le tour sur « près »
    { nom: "intro-6", x: 50, decor: "regardez", apres: 700, dit: "Regardons tout ça de plus *près.",
      mots: { regardons: iTout(iGeste("salue"), iSon("elan")), "près": iPuis(150, iTout(iAllume(".s6", "plonge"), iGeste("zoom"))) } },
  ];
  Object.assign(TEMPS, __TEMPS__);
  INTRO.forEach((l) => {
    if (!l.nom) return;
    if (__ENREGISTREES__.includes(l.nom)) { if (!ENREGISTREES.includes(l.nom)) ENREGISTREES.push(l.nom); return; }
    // Pas encore enregistrée : un rythme de parole estimé, mot à mot, une pause à chaque ponctuation.
    const m = [], ouvert = [];
    let t = 0.12;
    for (const mot of l.dit.split(" ")) {
      m.push(+t.toFixed(2));
      const d = 0.07 + mot.replace(/[^\p{L}\d]/gu, "").length * 0.05;
      ouvert.push([t, t + d]);
      t += d + (/[.?!:]$/.test(mot) ? 0.32 : /[,;]$/.test(mot) ? 0.16 : 0.03);
    }
    const d = +(t + 0.1).toFixed(2);
    TEMPS[l.nom] = { d, m, b: Array.from({ length: Math.ceil(d / 0.04) }, (_, k) => (k % 4 !== 3 && ouvert.some(([a, z]) => k * 0.04 >= a && k * 0.04 < z) ? "1" : "0")).join("") };
  });
"""

JS_JOUER = r"""
  /* ═══ L'INTRO : SON FANTÔME LUI RACONTE ═══
     « Il me manque une intro : on rentre trop vite dans le sujet. » Puis : « trop long », « il manque
     les voisins commerçants », « le fantôme reste immobile », et enfin : « les animations devraient être
     au centre, et le fantôme en bas raconte ». L'intro prend tout l'écran ; chaque phrase installe sa
     scène au milieu, et ses gestes tombent sur les mots qui les disent. Son fantôme parle en bas, sa
     bouche suit sa voix (prononcer → bouche). Une barre par phrase, en haut, dit où on en est. Un appui
     termine la phrase en cours ; « Passer » va au tour. */
  async function jouerIntro() {
    const it = $("#intro"), dit = $("#intro-dit"), scene = $("#si-scene"), fant = $("#si-fant"), decor = $("#si-decor"), barres = $$("#si-progres i");
    let fini = false, actions = {};
    accueilEl.classList.add("en-intro");
    ouvV.pause();
    it.hidden = false;
    son("apparition");
    // un appui : finit la phrase en cours, ou passe la carte du chapitre
    let passeCarte = null;
    $("#intro-passer").onclick = (e) => { e.stopPropagation(); fini = true; taireVoix(); if (passeCarte) passeCarte(); };
    it.onclick = () => { if (enParole) viteVoix = true; else if (passeCarte) passeCarte(); };
    const lettres = (s) => s.toLowerCase().replace(/[^\p{L}]/gu, "");
    const ecoute = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      const k = lettres(n.textContent), f = actions[k];
      if (f) { delete actions[k]; f(); }
    })));
    ecoute.observe(dit, { childList: true });
    filmIntro().load();
    await attendreMs(reduit ? 0 : 600);
    let n = 0;
    for (const l of INTRO) {
      if (fini) break;
      dit.textContent = "";
      dit.classList.toggle("long", !!l.dit && l.dit.length > 100);
      fant.classList.remove("salue", "saute", "inquiet");
      if (l.chapitre) {
        // LA CARTE DU CHAPITRE : son numéro, son titre, ce qu'il apporte ; son nom reste en haut ensuite
        it.classList.remove("si-c1", "si-c2", "si-chap-la");
        it.classList.add("si-c" + l.chapitre);
        $("#si-chap").innerHTML = "<b>0" + l.chapitre + "</b>" + l.nomChap;
        scene.style.setProperty("--x", "50%");
        decor.innerHTML = DECORS_INTRO.chapitre(l);
        if (iFilm && !iFilm.isConnected) iFilm.pause();
        fant.classList.add("salue");
        son("accord");
        await new Promise((ok) => { passeCarte = ok; setTimeout(ok, reduit ? 900 : 2300); });
        passeCarte = null;
        it.classList.add("si-chap-la");
        continue;
      }
      if (l.decor === "regardez") it.classList.remove("si-chap-la");
      scene.style.setProperty("--x", l.x + "%");
      if (l.garde) { if (l.decor) decor.insertAdjacentHTML("beforeend", DECORS_INTRO[l.decor]()); }
      else decor.innerHTML = l.decor ? DECORS_INTRO[l.decor]() : "";
      if (iFilm && !iFilm.isConnected) iFilm.pause();
      // deux images plus tard : la scène est posée, ses transitions partent de l'état de départ
      if (l.debut) requestAnimationFrame(() => requestAnimationFrame(l.debut));
      actions = { ...l.mots };
      const b = barres[n++];
      if (b) { b.style.setProperty("--t", TEMPS[l.nom].d + "s"); b.style.setProperty("--p", "100%"); }
      if (!(await prononcer(fant, dit, l.dit, l.nom)) || fini) break;
      if (b) b.style.setProperty("--t", ".25s");
      await attendreMs(fini ? 0 : reduit ? 250 : l.apres);
    }
    ecoute.disconnect();
    fant.classList.remove("parle", "ouvre");
    if (iFilm) iFilm.pause();
    it.classList.add("si-sort");
    await attendreMs(reduit ? 0 : 420);
    it.hidden = true;
  }

"""

ANCIEN_PASSAGE = """    const acc = $("#accueil");
    acc.classList.add("part");
    setTimeout(() => {
      acc.hidden = true; page.hidden = false; page.classList.add("arrive");
      window.scrollTo(0, 0);
      aller(0);
    }, reduit ? 0 : 520);
"""
NOUVEAU_PASSAGE = """    const acc = $("#accueil");
    /* D'abord l'intro, sur l'écran d'ouverture ; le tour ensuite. */
    if (acc.classList.contains("en-intro")) return;
    jouerIntro().then(() => {
      acc.classList.add("part");
      setTimeout(() => {
        acc.hidden = true; page.hidden = false; page.classList.add("arrive");
        window.scrollTo(0, 0);
        aller(0);
      }, reduit ? 0 : 520);
    });
"""
OUVERTURE_HIDDEN = (
    ".ouverture video,.ouverture img{display:block;width:100%;height:100%;object-fit:cover}\n",
    ".ouverture video,.ouverture img{display:block;width:100%;height:100%;object-fit:cover}\n"
    "/* « hidden » l'emporte sur le display:block du dessus : sinon la dernière image s'empile sous la vidéo, et deux fantômes. */\n"
    ".ouverture [hidden]{display:none}\n",
)


def une_fois(t, vieux, neuf, quoi):
    if t.count(vieux) != 1:
        raise SystemExit(f"{quoi} : {t.count(vieux)} occurrences")
    return t.replace(vieux, neuf)


def js(v):
    return json.dumps(v, ensure_ascii=False)


mesures = json.load(open(f"{VOIX}/temps.json", encoding="utf-8"))["temps"]
for d, c in CONF.items():
    t = open(f"{S}/{d}/index.avant-intro.html", encoding="utf-8").read()
    t = une_fois(t, "</style>\n", CSS.lstrip("\n") + "</style>\n", "style")
    t = une_fois(t, *OUVERTURE_HIDDEN, "ouverture")
    bouton = '  <button type="button" class="decouvrir" id="decouvrir">Découvrez votre fantôme →</button>\n'
    t = une_fois(t, bouton, HTML_DEVISE + bouton, "bouton")
    reveil = re.search(r'  <button type="button" class="reveil" id="reveil" hidden>.*?</button>\n', t).group(0)
    html = HTML_INTRO
    for k, f in enumerate(c["fant"]):
        html = html.replace(f"__F{k}__", f)
    t = une_fois(t, reveil, reveil + html, "reveil")
    m = re.search(r"\n  const ENREGISTREES = [^\n]*\n", t)
    voisins = [(s, l, OFFRES[l]) for s, l in c["voisins"]]
    code = (JS_DONNEES.replace("__MOMENTS__", js(c["moments"])).replace("__QUI__", js(c["qui"])).replace("__LIEU__", js(c["lieu"]))
            .replace("__OFFRE__", js(c["offre"])).replace("__VOISINS__", js(voisins)).replace("__FANT__", js(c["fant"][0])).replace("__AVANT__", js(AVANT[d])).replace("__QR__", js(QR[d]))
            .replace("__TEMPS__", js(mesures)).replace("__ENREGISTREES__", json.dumps(sorted(mesures))))
    t = t[: m.end()] + code.lstrip("\n") + t[m.end():]
    t = une_fois(t, "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", JS_JOUER.lstrip("\n") + "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", "page 1 → 2")
    t = une_fois(t, ANCIEN_PASSAGE, NOUVEAU_PASSAGE, "passage")
    open(f"{S}/{d}/index.html", "w", encoding="utf-8").write(t)
    # Ses voix : les répliques enregistrées, et plus rien de la version longue.
    for k in ["1", "2", "2b", "3", "4", "4b", "4c", "4d", "4e", "4f", "5", "6"]:
        cible = f"{S}/{d}/intro-{k}.mp3"
        if os.path.exists(cible):
            os.remove(cible)
        if f"intro-{k}" in mesures:
            shutil.copy2(f"{VOIX}/intro-{k}.mp3", cible)
    if d == "tour":
        shutil.copy2(SALUE_RESTO, f"{S}/{d}/resto-salue.webp")
    # les fantômes des trois cages (④c) : ceux des habitants, comme à l'étape des trois fantômes
    for k, look in enumerate(FANTOMES_CAGES):
        shutil.copy2(f"{S}/../trois-fantomes/a/g/{look}.webp", f"{S}/{d}/si-g{k + 1}.webp")
    for f in c["fant"] + [x for x, _ in c["moments"]] + [x for x, _ in c["voisins"]] + ["logo.png", AVANT[d][0], AVANT[d][2] + ".mp4", AVANT[d][2] + ".jpg"]:
        if not os.path.exists(f"{S}/{d}/{f}"):
            raise SystemExit(f"{d} : image manquante {f}")
    print(d, ": intro v3 posée, voix", sorted(k for k in mesures))
