# LES DEUX PROMESSES DU TOUR, racontées par le fantôme comme l'intro (même moteur, même écran), en
# simple — « hyper compliqué à comprendre, ça dure très longtemps et on se perd » : une idée par écran.
#  · « Pendant la nuit… » (03) : votre boutique ferme, votre fantôme va chez Léa (sa Maison de
#    l'application), elle adore le magret, il y dépose une surprise ; au réveil elle réserve, et vous le
#    recevez. (« Et rassurez-vous : un fantôme ne trahit jamais son habitant » a été retiré à la demande.)
#  · « Quand vous passerez la main… » (04) : le livre de votre savoir-faire passe à la relève ; ce qui a
#    marché, ce qui n'a pas marché ; SA vraie voix, gardée ; « Votre savoir-faire ne mourra jamais. »
#  Les deux s'ouvrent depuis la fin des deux conversations, par deux boutons identiques.
# À lancer après tour-intro3.py (il réécrit index.html) :  python3 -I tour-promesses.py <dossier>
# Les voix : recu/demain/demain.mp3 (reçue, coupée en deux avant « Votre savoir-faire… ») ;
# recu/nuit/nuit-a.mp3, recu/demain/demain-chiffres.mp3 (sinon : rythme estimé, sans son).
import json, os, re, shutil, subprocess, sys

S = sys.argv[1]
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from alignement import aligner, duree  # noqa: E402

FF = f"{S}/ffmpeg"
NB = " "
R = f"{S}/recu"

TEXTES = {
    "demain-a": f"Et un jour, vous passerez la main. Ce jour-là, rien ne sera *perdu. Vos *gestes, vos *secrets, vos *histoires… et toute la *ville qui vous suit{NB}: je garde tout, et je le *transmets.",
    "demain-b": "Votre savoir-faire ne mourra *jamais.",
    "nuit-a": f"Ce soir, vous fermez. Moi, je *sors. Je frappe chez les fantômes de vos *habitants{NB}: eux savent ce qui leur ferait *plaisir. On s’arrange entre fantômes… et demain *matin, vos clients sont déjà *là.",
    # à enregistrer (voix du fantôme) — tant qu'elle manque, elle s'écrit au rythme estimé, sans son
    "demain-chiffres": "Et je retiens ce qui a *marché… et ce qui n’a *pas marché.",
    # l'écran du oui, à la toute fin (à enregistrer)
    "oui-a": "Alors, on récapitule. Plus de *clients, sans y passer de temps. Moins de *dépenses, grâce à vos commerçants voisins.",
    "oui-nuit": "Et même la *nuit, je travaille pour vous.",
    "oui-main": "Et votre savoir-faire ne mourra *jamais.",
    "oui-b": f"On crée votre *page maintenant{NB}? Ça prend deux minutes.",
}
# où chaque réplique arrive (recu/<dossier>/<nom>.mp3)
DOSSIER_VOIX = {"nuit-a": "nuit", "demain-chiffres": "demain", "oui-a": "oui", "oui-nuit": "oui", "oui-main": "oui", "oui-b": "oui"}
# L'OFFRE, dite sur l'écran du oui (prix, essai, engagement) : vide tant qu'elle n'est pas décidée, et alors
# rien ne s'affiche — on n'invente pas un prix
OFFRE = ""
# le bouton du oui : la création de sa page, sur la page des commerçants (#creer ouvre le formulaire)
CREER = "https://clikme.fr/commercants#creer"
# chaque tour : son commerce, sa mémoire (ses films), sa vraie voix (un passage de son interview,
# voix.mp3, avec son texte), et la nuit de sa ville (trois habitants : leur envie, leur rendez-vous)
# chaque tour : son commerce, sa mémoire (ses films), sa vraie voix (un passage de son interview,
# voix.mp3, avec son texte) ; la nuit de sa ville (trois habitants : leur envie, ce que les fantômes
# arrangent) ; la Maison de Léa (la pièce où tombe la surprise d'abord, puis trois autres, avec ce
# que son fantôme y sait) et la surprise ; les chiffres du livre (produit, vues du film, réservations,
# verdict). Tout est fictif, comme les commerces : « exemple » est écrit à l'écran.
TOURS = {
    "tour": dict(geste="m2.jpg", lieu="Chez Bergine", qui="Jean-Marie", fant="resto.webp", pages=["interview.jpg", "specialiste.jpg", "episode-bergine.jpg"],
                 extrait=(3.6, 6.6, "Bon, mon magret, je commence par quadriller la peau."),
                 maisons=[("Léa", "adore le magret", "Un magret gardé · midi"), ("Hugo", "cherche une table samedi", "Samedi 20 h · table pour 2"),
                          ("Nora", "fête ses 30 ans", "Vendredi · table pour 6")],
                 pieces=[("cuisine", "Adore le magret"), ("dressing", "Plutôt camel et noir"), ("miroir", "Ongles nude"), ("sorties", "Un verre, tranquille")],
                 surprise=dict(photo="m3.jpg", titre="Le magret du midi", raison="Vous adorez le magret.", bouton="Je réserve pour midi", fait="✓ Réservé · midi",
                               notif="Nouvelle réservation · Léa · midi"),
                 stats=[("🦆", "Magret grillé", 1240, 38, "ok"), ("🥗", "Salade de chèvre chaud", 860, 4, "moyen"), ("🍮", "Crème brûlée", 190, 2, "non")]),
    "tour-vetements": dict(geste="m1.jpg", lieu="Maison Lou", qui="Lou", fant="fant.webp", pages=["interview.jpg", "specialiste.jpg", "episode.jpg"],
                           extrait=(8.75, 11.89, "Moi, je le porte sur du noir, avec des boots."),
                           maisons=[("Léa", "cherche un manteau chaud", "Manteau camel mis de côté"), ("Hugo", "cherche un cadeau", "Paquet cadeau prêt · samedi"),
                                    ("Nora", "veut changer de style", "Samedi 11 h · essayage")],
                           pieces=[("dressing", "Aime le camel, les manteaux longs"), ("cuisine", "Pas de porc"), ("miroir", "Ongles nude"), ("sorties", "Un verre, tranquille")],
                           surprise=dict(photo="m1.jpg", titre="Le manteau long camel", raison="Ça irait avec ce que vous aimez : le camel.", bouton="Je le fais mettre de côté",
                                         fait="✓ Mis de côté pour vous", notif="Mis de côté · manteau camel · Léa"),
                           stats=[("🧥", "Manteau long camel", 1100, 27, "ok"), ("👖", "Jean droit brut", 780, 3, "moyen"), ("🧣", "Écharpe en laine", 150, 1, "non")]),
    "tour-coiffure": dict(geste="m3.jpg", lieu="Salon Clara", qui="Clara", fant="fant.webp", pages=["message.jpg", "specialiste.jpg", "episode.jpg"],
                          extrait=(5.87, 9.01, "On a coupé juste au-dessus des épaules."),
                          maisons=[("Léa", "veut couper court", "Jeudi 18 h · coupe"), ("Hugo", "a un mariage samedi", "Samedi 9 h · coiffure"),
                                   ("Nora", "veut changer de couleur", "Mardi · conseil couleur")],
                          pieces=[("miroir", "Envie de couper court"), ("dressing", "Plutôt camel et noir"), ("cuisine", "Pas de porc"), ("sorties", "Un verre, tranquille")],
                          surprise=dict(photo="m4.jpg", titre="Le carré court, brun profond", raison="Vous aviez envie de couper court.", bouton="Je prends rendez-vous",
                                        fait="✓ Jeudi 18 h", notif="Nouveau rendez-vous · Léa · jeudi 18 h"),
                          stats=[("✂️", "Carré court, brun profond", 980, 31, "ok"), ("🎨", "Balayage miel", 720, 5, "moyen"), ("💈", "Dégradé homme", 160, 2, "non")]),
    "tour-librairie": dict(geste="m1.jpg", lieu="La Page d’Alice", qui="Alice", fant="fant.webp", pages=["message.jpg", "specialiste.jpg", "episode.jpg"],
                           extrait=(9.27, 12.06, "Je l’ai lu d’une traite, à douze ans."),
                           maisons=[("Léa", "adore les romans d’aventure", "Monte-Cristo mis de côté"), ("Hugo", "cherche un cadeau pour ses 12 ans", "Paquet cadeau prêt"),
                                    ("Nora", "veut un club de lecture", "Mercredi 17 h · club lecture")],
                           pieces=[("librairie", "Adore les romans d’aventure"), ("cuisine", "Pas de porc"), ("dressing", "Plutôt camel et noir"), ("sorties", "Un verre, tranquille")],
                           surprise=dict(photo="m2.jpg", titre="Le Comte de Monte-Cristo", raison="Vous adorez les romans d’aventure.", bouton="Je le fais mettre de côté",
                                         fait="✓ Mis de côté pour vous", notif="Mis de côté · Monte-Cristo · Léa"),
                           stats=[("📖", "Le Comte de Monte-Cristo", 640, 22, "ok"), ("🎁", "Coffret jeunesse", 510, 3, "moyen"), ("🔎", "Polar du mois", 120, 1, "non")]),
    "tour-bijouterie": dict(geste="m1.jpg", lieu="Atelier Inès", qui="Inès", fant="fant.webp", pages=["message.jpg", "specialiste.jpg", "episode.jpg"],
                            extrait=(3.08, 7.04, "Je l’ai fait à la main, ici, à l’atelier."),
                            maisons=[("Léa", "aime le bleu nuit", "Collier saphir mis de côté"), ("Hugo", "fête un anniversaire", "Samedi · essayage bague"),
                                     ("Nora", "veut une gravure", "Gravure prête jeudi")],
                            pieces=[("dressing", "Aime le bleu nuit et l’or"), ("miroir", "Ongles nude"), ("cuisine", "Pas de porc"), ("sorties", "Un verre, tranquille")],
                            surprise=dict(photo="m2.jpg", titre="Le collier saphir", raison="Vous aimez le bleu nuit et l’or.", bouton="Je le fais mettre de côté",
                                          fait="✓ Mis de côté pour vous", notif="Mis de côté · collier saphir · Léa"),
                            stats=[("💎", "Collier saphir", 890, 18, "ok"), ("📿", "Bracelet jonc", 600, 2, "moyen"), ("✨", "Boucles d’oreilles perle", 140, 1, "non")]),
}
# les pièces de Ma Maison, telles que l'application les montre (src/lib/direct/maison.ts : nom, photo, teinte)
PIECES = {"cuisine": ("Ma Cuisine", "piece-cuisine.webp", "#FC9023"), "dressing": ("Mon Dressing", "piece-dressing.webp", "#E2B884"),
          "miroir": ("Mon Miroir", "piece-miroir.webp", "#FC86A8"), "sorties": ("Mes Sorties", "piece-sorties.webp", "#C685FC"),
          "librairie": ("Ma Librairie", "piece-librairie.webp", "#FDBD57")}
# les images de Ma Maison, telles que l'application les montre (public/direct/maison du dépôt ; le dossier du
# tour est dans outils/tour-du-fantome/)
MAISON_APP = next(p for p in (os.path.join(S, "..", "..", "public", "direct", "maison"), "/home/user/trouper-cohorts/public/direct/maison") if os.path.isdir(p))


def ff(*a):
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", *a], check=True)


CSS = r"""
/* ═══ LES DEUX PROMESSES : « Et cette nuit… », « Et demain… » ═══
   « Hyper compliqué à comprendre, ça dure très longtemps et on se perd » : une idée par écran, peu de
   choses à l'écran, en grand. Le même écran que l'intro : décor au milieu, fantôme en bas qui raconte. */
.intro.pr-scene{z-index:80}
.intro.si-c3{--acc:#c08bff;--acc2:#ffb3e6}
.intro.si-c4{--acc:#7fb2ff;--acc2:#c9b6ff}
.intro.si-c3 .si-bulle .fx-cle{background-image:linear-gradient(90deg,#c08bff,#ffb3e6)}
.intro.si-c4 .si-bulle .fx-cle{background-image:linear-gradient(90deg,#7fb2ff,#c9b6ff)}
.intro.si-c3 .si-fant::before{background:radial-gradient(closest-side,rgba(192,139,255,.34),transparent)}
.intro.si-c4 .si-fant::before{background:radial-gradient(closest-side,rgba(127,178,255,.34),transparent)}
/* votre boutique */
.pr-boutique{position:absolute;width:var(--bw);aspect-ratio:100/105}
.pr-boutique svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.pr-boutique .mur{fill:#2d1b33}
.pr-boutique .vitre{fill:#ffcf7a;filter:drop-shadow(0 0 7px rgba(255,190,90,.95));transition:fill .7s,filter .7s}
.pr-boutique.eteinte .vitre{fill:#1d1533;filter:none}
.pr-boutique .porte{fill:#150c18}
.pr-enseigne{position:absolute;left:50%;top:-2%;transform:translate(-50%,-60%);white-space:nowrap;padding:3px 10px;border-radius:9px;background:#1a0f1c;border:1.5px solid var(--acc);
  font-weight:900;font-size:clamp(10px,3.3cqmin,15px);color:#fff;box-shadow:0 0 16px -2px var(--acc);transition:box-shadow .7s,border-color .7s,color .7s}
.pr-boutique.eteinte .pr-enseigne{box-shadow:none;border-color:rgba(255,255,255,.2);color:rgba(255,255,255,.45)}
/* le bouton du chapitre 4, au bout des deux conversations */
/* les deux chapitres de la fin, côte à côte en valeur : même bouton, un peu moins haut que d'habitude */
.fin .fin-chap{height:3.3em;font-size:1em}
.pr-etin{position:absolute;left:50%;top:50%;width:0;height:0;pointer-events:none}
.pr-etin i{position:absolute;left:-7px;top:-7px;width:14px;height:14px;opacity:0;background:linear-gradient(135deg,var(--acc),var(--acc2));
  clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)}
.jaillit .pr-etin i,.reserve .pr-etin i{animation:pr-eclat 1.1s ease-out var(--d) both}
@keyframes pr-eclat{0%{opacity:1;transform:rotate(var(--a)) translateY(0) scale(.4)}100%{opacity:0;transform:rotate(var(--a)) translateY(-34cqmin) scale(1.3)}}
@keyframes pr-flotte{to{transform:translateY(-6%) rotate(4deg)}}
@keyframes pr-scintille{to{transform:scale(.4);opacity:.35}}

/* ── « ET CETTE NUIT… » : une histoire, deux personnages. Votre boutique ferme ; votre fantôme va chez
   Léa (sa Maison de l'application, la pièce qui compte à la fenêtre) ; elle adore le magret ; il y
   dépose une surprise ; au réveil, elle la reçoit, elle réserve, et vous le recevez. ── */
.nx{border-radius:24px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.nx>*{position:absolute}
.nx-ciel,.nx-nuit,.nx-aube{inset:0}
.nx-ciel{background:linear-gradient(180deg,#3b1c4f 0%,#9c3f6a 55%,#ff9a62 100%)}
.nx-nuit{background:linear-gradient(180deg,#040716 0%,#0c1233 60%,#1d1747 100%);opacity:0;transition:opacity 1.2s ease}
.nx-aube{background:linear-gradient(180deg,#6c8fe0 0%,#f5b7a6 60%,#ffdca3 100%);opacity:0;transition:opacity 1.6s ease}
.nx.nuit .nx-nuit,.nx.aube .nx-aube{opacity:1}
.nx-etoiles{inset:0 0 45% 0;opacity:0;transition:opacity 1s}
.nx-etoiles i{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);border-radius:50%;background:#fff;animation:pr-scintille 2.2s ease-in-out var(--d) infinite alternate}
.nx.nuit .nx-etoiles{opacity:.9}
.nx.aube .nx-etoiles{opacity:0}
.nx-titre{left:5%;right:5%;top:4%;z-index:6;text-align:center;font-weight:900;font-size:clamp(17px,5.4cqmin,30px);line-height:1.15;letter-spacing:-.02em;color:#fff;
  text-shadow:0 4px 18px rgba(0,0,0,.55);transition:opacity .22s}
.nx-titre.change{opacity:0}
.nx-sol{left:0;right:0;bottom:0;height:9%;background:#120a1c}
.nx .pr-boutique{--bw:min(36cqw,34cqh);left:5%;bottom:9%}
.nx-maison{--mw:min(38cqw,34cqh);right:5%;bottom:9%;width:var(--mw);aspect-ratio:100/105}
.nx-maison>*{position:absolute}
.nx-toit{left:-7%;right:-7%;top:0;height:34%;background:#3a2552;clip-path:polygon(50% 0,100% 100%,0 100%)}
.nx-corps{left:0;right:0;top:32%;bottom:0;background:#24183a;border-radius:3px}
.nx-fen{left:12%;right:12%;top:42%;height:42%;border-radius:8px;overflow:hidden;background:#1b1430;box-shadow:0 0 0 3px #3a2552;transition:box-shadow .6s}
.nx-fen img{width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s}
.nx.chez .nx-fen img{opacity:1}
.nx.chez .nx-fen{box-shadow:0 0 0 3px #ffd486,0 0 22px rgba(255,200,110,.85)}
.nx-lea{right:-4%;bottom:-2%;width:36%;transform:scale(0);transform-origin:50% 100%;transition:transform .55s var(--ressort) .25s}
.nx.chez .nx-lea{transform:none}
.nx-nom{left:50%;top:-3%;transform:translate(-50%,-100%);white-space:nowrap;padding:3px 10px;border-radius:999px;background:#1a0f1c;border:1.5px solid #c9b6ff;color:#fff;
  font-weight:900;font-size:clamp(10px,3.2cqmin,14px);opacity:.6;transition:opacity .5s,box-shadow .5s}
.nx.chez .nx-nom{opacity:1;box-shadow:0 0 16px -2px #c9b6ff}
.nx.aube .nx-nom{opacity:0}
.nx-maison.toc{animation:nx-toc .45s ease 2}
@keyframes nx-toc{25%{transform:translateX(-2px)}50%{transform:translateX(2px)}75%{transform:translateX(-1px)}}
/* ce que Léa aime, dit par son fantôme */
.nx-bulle{right:4%;bottom:calc(9% + var(--mw-b) * 1.05 + 40px);--mw-b:min(38cqw,34cqh);max-width:64%;padding:8px 12px;border-radius:14px 14px 4px 14px;background:#fff;color:#2a1a10;
  text-align:left;font-weight:900;font-size:clamp(13px,4.2cqmin,19px);line-height:1.2;box-shadow:0 10px 26px -10px rgba(0,0,0,.7);z-index:4;
  opacity:0;transform:translateY(10px) scale(.85);transform-origin:90% 100%;transition:opacity .35s,transform .5s var(--ressort)}
.nx.envie .nx-bulle{opacity:1;transform:none}
.nx.aube .nx-bulle{opacity:0;transform:scale(.9)}
/* votre fantôme : il sort de la boutique, va chez Léa ; la surprise qu'il dépose */
.nx-vol{left:24%;top:72%;width:15cqmin;aspect-ratio:1;transform:translate(-50%,-50%);z-index:3;opacity:0;
  transition:left 1s cubic-bezier(.45,0,.2,1),top 1s cubic-bezier(.45,0,.2,1),opacity .4s;filter:drop-shadow(0 0 12px rgba(160,190,255,.85))}
.nx-vol img{width:100%;height:100%;object-fit:contain;animation:pr-flotte 1.6s ease-in-out infinite alternate}
.nx-vol::after{content:"Votre fantôme";position:absolute;left:50%;top:96%;transform:translateX(-50%);white-space:nowrap;padding:1px 7px;border-radius:999px;
  background:rgba(10,14,40,.8);color:#fff;font-weight:800;font-size:clamp(8px,2.6cqmin,11px)}
.nx.sort .nx-vol{opacity:1;top:56%}
.nx.va .nx-vol{left:calc(95% - min(38cqw,34cqh) - 5cqmin);top:calc(91% - min(38cqw,34cqh) * 1.05 - 2cqmin)}
.nx.aube .nx-vol{opacity:0}
.nx-cadeau{left:calc(95% - min(38cqw,34cqh) - 5cqmin);top:calc(91% - min(38cqw,34cqh) * 1.05 - 2cqmin);z-index:4;font-size:clamp(22px,7cqmin,40px);line-height:1;
  opacity:0;transform:translate(-50%,-50%) scale(.6);transition:left .9s cubic-bezier(.45,0,.2,1),top .9s cubic-bezier(.45,0,.2,1),opacity .3s,transform .9s var(--ressort)}
.nx.cadeau .nx-cadeau{opacity:1;left:calc(95% - min(38cqw,34cqh) / 2);top:calc(91% - min(38cqw,34cqh) * .4);transform:translate(-50%,-50%) scale(1)}
.nx.aube .nx-cadeau{opacity:0}
/* au réveil : chez Léa, puis chez vous */
.nx-notifs{left:50%;top:15%;width:min(92%,520px);transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;z-index:5}
.nx-n{padding:7px 11px;border-radius:16px;text-align:left;opacity:0;transform:translateY(-14px) scale(.94);transition:opacity .45s,transform .6s var(--ressort);box-shadow:0 18px 40px -14px rgba(0,0,0,.7)}
.nx-n header{display:flex;align-items:center;gap:6px;font-weight:800;font-size:clamp(9px,2.9cqmin,13px)}
.nx-n header img{width:18px;height:18px;object-fit:contain}
.nx-n header em{margin-left:auto;font-style:normal;padding:1px 7px;border-radius:999px;font-size:10px}
.nx-n b{display:block;margin-top:3px;font-weight:900;font-size:clamp(12px,3.9cqmin,19px);line-height:1.18}
.nx-n1{background:rgba(255,255,255,.97);color:#24160f}
.nx-n1 header{color:#8a7a70}
.nx-n1 header em{background:#f1ece8;color:#7a6a60}
.nx-n1 u{position:relative;display:block;margin-top:6px;padding:6px;border-radius:10px;text-align:center;text-decoration:none;background:linear-gradient(90deg,#ff5db8,#ffb347);color:#fff;
  font-weight:900;font-size:clamp(11px,3.4cqmin,15px)}
.nx-n1 u::after{content:attr(data-fait);position:absolute;inset:0;display:grid;place-items:center;border-radius:11px;background:#3de2a6;color:#06281c;opacity:0;transition:opacity .3s .2s}
.nx.reserve .nx-n1 u::after{opacity:1}
.nx-n2{background:rgba(20,12,24,.95);border:1.5px solid #3de2a6;color:#fff;transition-delay:.35s}
.nx-n2 header{color:#9fe9cc}
.nx-n2 header em{background:rgba(255,255,255,.12);color:rgba(255,255,255,.7)}
.nx.aube .nx-n1,.nx.reserve .nx-n2{opacity:1;transform:none}
.nx .pr-boutique,.nx-maison{transform-origin:50% 100%;transition:transform .8s var(--ressort)}
.nx.aube .pr-boutique,.nx.aube .nx-maison{transform:scale(.8)}
.nx.aube .pr-enseigne{opacity:0}

/* ── « ET DEMAIN… » : LE LIVRE DE VOTRE COMMERCE. « Pas très motivante ni immersive pour le commerçant » :
   un vrai carnet, à son nom, qui se remplit de ce qui fait SON commerce — ses gestes (sa photo), ses
   secrets (un mémo vocal), ses histoires (son film), sa ville. Un tampon : transmis à la relève. Page
   suivante : ses chiffres. Puis on rouvre le mémo : c'est SA voix, gardée dans le livre (« on ne sait pas
   d'où arrive ce vocal »). Enfin, la promesse. ── */
.dx>*{position:absolute}
.dx-haut{left:0;right:0;top:1%;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 12px;opacity:0;transition:opacity .5s}
.dx.temps .dx-haut{opacity:1}
.dx-annee{font-size:clamp(26px,8.5cqmin,64px);font-weight:900;letter-spacing:-.045em;line-height:.95;font-variant-numeric:tabular-nums;
  background:linear-gradient(90deg,var(--acc),var(--acc2));-webkit-background-clip:text;background-clip:text;color:transparent}
.dx-relai{display:flex;align-items:center;gap:8px;opacity:0;transition:opacity .4s}
.dx.relai .dx-relai{opacity:1}
.dx-relai span{padding:4px 12px;border-radius:999px;font-weight:900;font-size:clamp(11px,3.4cqmin,15px);white-space:nowrap}
.dx-relai .vous{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);color:#fff}
.dx-relai .dx-fl{padding:0;color:#ffb3e6;font-size:clamp(16px,5cqmin,22px)}
.dx-relai .releve{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#2a0f2a;transition:box-shadow .5s,transform .5s var(--ressort)}
.dx.transmet .dx-relai .releve{box-shadow:0 0 22px rgba(255,179,230,.9);transform:scale(1.1)}
/* le carnet : sa couverture à son nom, puis ses pages */
.dx-cahier{left:50%;top:56%;width:min(88cqw,62cqh);aspect-ratio:3/4;container-type:size;opacity:0;transform:translate(-50%,-50%) scale(.5);perspective:1600px;
  transition:opacity .5s,transform .9s var(--ressort)}
.dx-cahier::before{content:"";position:absolute;inset:-12%;border-radius:40%;background:radial-gradient(closest-side,rgba(255,210,122,.32),transparent);z-index:-1}
.dx.temps .dx-cahier{opacity:1;transform:translate(-50%,-50%) scale(.82)}
.dx.livre .dx-cahier{transform:translate(-50%,-50%) scale(1)}
.dx-page,.dx-couv{position:absolute;inset:0;border-radius:5px 14px 14px 5px;transform-origin:0 50%;backface-visibility:hidden;transition:transform 1s cubic-bezier(.6,0,.3,1),opacity .3s}
.dx-couv{z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:0 10%;text-align:center;color:#f6d79b;
  background:radial-gradient(120% 90% at 30% 20%,#6b3622,#2c130b);border:2px solid #c9a46a;box-shadow:0 18px 40px -14px rgba(0,0,0,.8),inset 0 0 0 7px rgba(201,164,106,.22)}
.dx-couv img{width:36%;filter:drop-shadow(0 6px 14px rgba(0,0,0,.6))}
.dx-couv small{font-size:3.6cqw;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:#c9a46a}
.dx-couv b{font-family:'Playfair Display',Georgia,serif;font-size:8.6cqw;font-weight:700;line-height:1.08}
.dx.livre .dx-couv{transform:rotateY(-178deg);opacity:0;transition:transform 1.1s cubic-bezier(.6,0,.3,1),opacity .25s ease .8s}
.dx-page{display:flex;flex-direction:column;overflow:hidden;padding:6% 6% 6% 12%;text-align:left;color:#3a2410;
  background:repeating-linear-gradient(180deg,transparent 0 23px,rgba(160,120,70,.12) 23px 24px),linear-gradient(180deg,#fff9ee,#f3e2c4);
  box-shadow:inset 12px 0 14px -10px rgba(120,70,20,.45),0 18px 40px -14px rgba(0,0,0,.7)}
.dx-page::before{content:"";position:absolute;left:5.5%;top:4%;bottom:4%;width:2px;background:repeating-linear-gradient(180deg,#c9a46a 0 6px,transparent 6px 12px)}
.dx-p1{z-index:2}
.dx-p2{z-index:1}
.dx-titre{margin:0 0 4%;font-family:'Playfair Display',Georgia,serif;font-size:7.2cqw;font-weight:700;line-height:1.08;color:#5a2d1d}
.dx-titre small{display:block;margin-bottom:2px;font-family:inherit;font-style:normal;font-size:.5em;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#a0522d}
.dx-grille{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6% 7%}
.dx-item{position:relative;min-height:0;display:flex;flex-direction:column;gap:5px;opacity:0;transform:scale(.5) rotate(var(--r));
  transition:opacity .3s,transform .55s var(--ressort),filter .5s}
.dx-item.on{opacity:1;transform:rotate(var(--r))}
.dx-item em{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:700;font-size:5cqw;line-height:1;color:#5a2d1d;text-align:center}
.dx-cadre{position:relative;flex:1;min-height:0;display:flex;background:#fff;padding:5%;box-shadow:0 6px 14px -6px rgba(0,0,0,.5)}
.dx-cadre img{width:100%;height:100%;object-fit:cover}
.dx-cadre.film::after{content:"▶";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:2.2em;height:2.2em;display:grid;place-items:center;border-radius:50%;
  background:rgba(255,255,255,.92);color:#ff2e9a;font-size:4cqw;box-shadow:0 4px 10px rgba(0,0,0,.35)}
.dx-cadre.memo{flex-direction:column;justify-content:center;gap:8%;padding:9%;background:#ffe9a8;color:#5a3a10;text-align:left}
.dx-cadre.memo b{font-size:4.4cqw;font-weight:900;line-height:1.15}
.dx-cadre.memo .mini{display:flex;align-items:center;gap:2px;height:24%}
.dx-cadre.memo .mini i{flex:1;height:var(--h);border-radius:2px;background:#e0912e}
.dx-cadre.memo .mini.plume{height:auto;display:block;font-size:7cqw}
.dx-cadre.memo small{font-size:3.8cqw;font-weight:900;color:#a0522d}
.dx-cadre.ville{flex-wrap:wrap;align-content:center;justify-content:center;gap:4px}
.dx-cadre.ville b{display:grid;place-items:center;width:8.6cqw;aspect-ratio:1;border-radius:50%;border:2px solid #fff;background:var(--c);color:#fff;
  font-size:3.8cqw;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.dx-cadre.ville span{width:100%;margin-top:2px;text-align:center;font-weight:900;font-size:3.8cqw;color:#d43a6a}
.dx-tampon{position:absolute;right:6%;bottom:5%;z-index:2;padding:5px 11px;border:3px solid #8b3fd0;border-radius:10px;background:rgba(255,249,238,.88);color:#8b3fd0;
  font-weight:900;font-size:4.4cqw;letter-spacing:.04em;text-transform:uppercase;opacity:0;transform:rotate(-12deg) scale(2.4);
  transition:opacity .15s,transform .45s cubic-bezier(.2,1.6,.4,1)}
.dx.transmet .dx-tampon{opacity:1;transform:rotate(-12deg)}
/* page suivante : ses chiffres */
.dx.chiffres .dx-p1{transform:rotateY(-178deg);opacity:0;transition:transform 1.1s cubic-bezier(.6,0,.3,1),opacity .25s ease .8s}
.dx-prod{margin-top:3%;padding-top:3%;border-top:1px dashed rgba(160,120,70,.4)}
.dx-prod b{display:block;font-size:5.4cqw;font-weight:900;line-height:1.15}
.dx-prod span{display:block;margin-top:1px;font-size:4cqw;font-weight:700;color:#7a5a3a}
.dx-verdict{display:inline-block;margin-top:1.4cqw;padding:.8cqw 3cqw;border-radius:999px;font-size:4cqw;font-weight:900;line-height:1.2;opacity:0;transform:scale(.6);
  transition:opacity .3s ease var(--d),transform .4s var(--ressort) var(--d)}
.dx-verdict.ok{background:#d6f7ea;color:#0f7a55}
.dx-verdict.moyen{background:#ffecc7;color:#9a5b00}
.dx-verdict.non{background:#ffe0e0;color:#b3261e}
.dx.bilan-ok .dx-verdict.ok,.dx.bilan-non .dx-verdict.moyen,.dx.bilan-non .dx-verdict.non{opacity:1;transform:none}
.dx-exemple{align-self:flex-start;margin-top:auto;padding:.5cqw 2.6cqw;border-radius:999px;background:rgba(160,82,45,.12);font-size:3.6cqw;font-weight:800;color:#a0522d}
/* on revient à la première page : le mémo vocal s'ouvre, et c'est SA voix */
.dx.ecoute .dx-p1{transform:none;opacity:1;transition:transform 1s cubic-bezier(.6,0,.3,1),opacity .15s}
.dx.ecoute .dx-item:not(.secret),.dx.ecoute .dx-tampon{filter:blur(1.5px);opacity:.3}
.dx.ecoute .dx-item.secret{filter:drop-shadow(0 0 12px rgba(255,190,90,.95))}
.dx-voix{left:50%;top:56%;width:min(88cqw,80cqh);padding:14px 16px 12px;border-radius:10px;background:#ffe9a8;color:#5a3a10;text-align:left;z-index:5;
  box-shadow:0 24px 50px -16px rgba(0,0,0,.75);opacity:0;transform:translate(-30%,-90%) scale(.3) rotate(2deg);
  transition:opacity .4s ease .7s,transform .8s var(--ressort) .7s,top .8s var(--ressort)}
.dx.ecoute .dx-voix{opacity:1;transform:translate(-50%,-50%) rotate(-1.5deg)}
.dx-voix small{display:block;font-size:clamp(10px,3.1cqmin,13px);font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#a0522d}
.dx-voix-corps{display:flex;align-items:center;gap:12px;margin-top:8px}
.dx-onde{flex:none;width:clamp(56px,18cqmin,90px);height:clamp(34px,10cqmin,52px);display:flex;align-items:center;gap:3px}
.dx-onde i{flex:1;height:22%;border-radius:4px;background:linear-gradient(180deg,#e0612e,#e0912e);transition:height .12s}
.dx-onde.ouvre i{height:var(--h)}
.dx-plume{flex:none;font-size:clamp(26px,9cqmin,44px);transition:transform .12s}
.dx-plume.ouvre{transform:rotate(-12deg)}
.dx-voix p{margin:0;flex:1;font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:700;font-size:clamp(14px,4.6cqmin,22px);line-height:1.25}
.dx-voix p::before{content:"« "}.dx-voix p::after{content:" »"}
.dx-voix em{display:block;margin-top:6px;font-style:normal;font-weight:900;font-size:clamp(11px,3.2cqmin,13px);color:#a0522d}
/* la promesse */
.dx.promesse .dx-haut{opacity:0}
.dx.promesse .dx-cahier{opacity:.16;transform:translate(-50%,-50%) scale(.92)}
.dx.promesse .dx-voix{top:76%;transform:translate(-50%,-50%) scale(.88) rotate(-1.5deg);transition-delay:0s}
.dx-promesse{left:0;right:0;top:5%;text-align:center;z-index:6;opacity:0;transform:translateY(14px) scale(.94);transition:opacity .6s,transform .8s var(--ressort)}
.dx.promesse .dx-promesse{opacity:1;transform:none}
.dx-promesse h2{margin:0;font-size:clamp(30px,10cqmin,58px);font-weight:900;letter-spacing:-.035em;line-height:1.02;text-shadow:0 10px 30px rgba(0,0,0,.5)}
.dx-promesse h2 em{font-style:normal;background:linear-gradient(90deg,var(--acc),var(--acc2));-webkit-background-clip:text;background-clip:text;color:transparent}
.dx-promesse .pr-etin{top:45%}
/* sur un écran large : l'année et la relève à gauche, le carnet au milieu */
@container (min-aspect-ratio:4/3){
  .dx-haut{left:6%;right:auto;top:50%;transform:translateY(-50%);align-items:flex-start}
  .dx-cahier,.dx-voix{top:50%}
  .dx-cahier{width:min(84cqw,72cqh)}
  .dx.promesse .dx-voix{top:72%}
}
@media (prefers-reduced-motion:reduce){.nx-etoiles i,.nx-vol img{animation:none!important}}

/* ── LE OUI, À LA TOUTE FIN. « Lors de la démo, je n'aurai qu'une chance pour qu'à la fin il dise OUI » : ce qu'il
   vient de voir, en trois lignes qui se cochent une à une sur la voix, puis un seul gros bouton, qui crée sa page
   (un petit geste immédiat, pas une signature). Il reste à l'écran jusqu'à ce qu'on le ferme. */
.oy{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,3.2cqh,24px)}
.oy-titre{margin:0;font-size:clamp(26px,8.6cqmin,54px);font-weight:900;letter-spacing:-.03em;line-height:1.05;text-align:center;opacity:0;transform:translateY(12px);transition:opacity .5s,transform .6s var(--ressort)}
.oy.on .oy-titre{opacity:1;transform:none}
.oy-titre em{font-style:normal;background:linear-gradient(90deg,#FF5DB8,#FFB347);-webkit-background-clip:text;background-clip:text;color:transparent}
.oy-liste{display:flex;flex-direction:column;gap:clamp(7px,2cqh,14px);width:min(100%,460px)}
.oy-p{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:9px 12px 9px 9px;border-radius:16px;text-align:left;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);opacity:.28;transform:scale(.96);transition:opacity .4s,transform .5s var(--ressort),background .4s,border-color .4s}
.oy-p.on{opacity:1;transform:none;background:rgba(255,46,154,.12);border-color:rgba(255,93,184,.6)}
.oy-p .s2-tuile{font-size:clamp(34px,10cqmin,46px)}
.oy-p b{display:block;font-size:clamp(15px,4.6cqmin,20px);font-weight:900;letter-spacing:-.01em}
.oy-p small{display:block;margin-top:2px;font-size:clamp(11.5px,3.4cqmin,14px);font-weight:600;line-height:1.25;color:rgba(255,255,255,.75)}
.oy-p i{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;font-style:normal;font-weight:900;font-size:14px;color:#fff;
  background:linear-gradient(135deg,#2FBF8F,#3DE2A6);box-shadow:0 0 0 3px rgba(61,226,166,.18);transform:scale(0);transition:transform .45s var(--ressort) .12s}
.oy-p.on i{transform:none}
.oy-go{pointer-events:auto;display:flex;flex-direction:column;align-items:center;gap:3px;padding:14px 28px 12px;border-radius:999px;color:#fff;text-decoration:none;text-align:center;
  font-weight:900;font-size:clamp(17px,5cqmin,23px);letter-spacing:-.01em;background:linear-gradient(135deg,#FF2E9A,#FF8A3D);box-shadow:0 16px 36px -10px rgba(255,46,154,.9);
  opacity:0;transform:translateY(14px) scale(.85);transition:opacity .4s,transform .7s var(--ressort)}
.oy-go small{font-size:clamp(10.5px,3.1cqmin,13px);font-weight:700;opacity:.95}
.oy.lance .oy-go{opacity:1;transform:none;animation:oy-pouls 1.9s ease-in-out 1.2s infinite}
@keyframes oy-pouls{50%{transform:scale(1.045);box-shadow:0 0 0 9px rgba(255,93,184,.16),0 16px 36px -10px rgba(255,46,154,.9)}}
.oy-offre{margin:0;font-size:clamp(12px,3.5cqmin,15px);font-weight:700;color:rgba(255,255,255,.82);text-align:center;opacity:0;transition:opacity .5s .4s}
.oy.lance .oy-offre{opacity:1}
@container (max-height:430px){
  .oy{gap:9px}
  .oy-titre{font-size:clamp(22px,7.4cqmin,40px)}
  .oy-p{padding:6px 10px 6px 6px;gap:9px;border-radius:13px}
  .oy-p .s2-tuile{font-size:30px}
  .oy-go{padding:11px 22px 10px}
}
@media (prefers-reduced-motion:reduce){.oy.lance .oy-go{animation:none}}
.fin .fin-conclure{align-self:center;padding:.3em .8em;border:0;background:none;color:rgba(255,255,255,.62);font-weight:700;font-size:.86em;text-decoration:underline;text-underline-offset:.2em}
"""

JS = r"""
  /* ═══ LES DEUX PROMESSES : « Et cette nuit… », « Et demain… » ═══
     Racontées comme l'intro, sur le même écran (jouerPromesse) ; chacune à la fin de son chapitre, sur son
     bouton (« 🌙 Et cette nuit ? », « ✨ Et demain ? »). Une idée par écran ; les mots déclenchent les gestes. */
  const PR = __PR__;
  const prBoutique = () => '<div class="pr-boutique"><span class="pr-enseigne">' + PR.lieu + '</span><svg viewBox="0 0 100 105" aria-hidden="true"><defs>' +
    '<pattern id="pr-ray" width="12" height="10" patternUnits="userSpaceOnUse"><rect width="6" height="10" fill="#ff5db8"/><rect x="6" width="6" height="10" fill="#fff4e6"/></pattern></defs>' +
    '<rect class="mur" x="8" y="22" width="84" height="83" rx="4"/><path d="M2 22H98L92 38H8Z" fill="url(#pr-ray)"/>' +
    '<path d="M8 38q6 6 12 0t12 0 12 0 12 0 12 0 12 0 12 0" fill="none" stroke="#ff5db8" stroke-width="2"/>' +
    '<rect class="vitre" x="15" y="50" width="44" height="38" rx="3"/><rect class="porte" x="66" y="50" width="20" height="55" rx="3"/><circle cx="82" cy="78" r="1.7" fill="#f6b54b"/></svg></div>';
  const prEtin = (n) => '<span class="pr-etin">' + Array.from({ length: n }, (_, k) => '<i style="--a:' + Math.round(k * 360 / n) + "deg;--d:" + ((k % 3) * 0.07).toFixed(2) + 's"></i>').join("") + "</span>";
  /* la durée de son mémo vocal, comme sur un téléphone (0:03) */
  const DX_DUREE = "0:" + String(Math.max(1, Math.round((__DUREE_VOIX__) || 0))).padStart(2, "0");
  const DX_VERDICTS = { ok: "✓ Ça marche", moyen: "Le film plaît, la réservation ne suit pas", non: "✗ Ça ne prend pas" };
  const prMin = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const DECORS_PR = {
    nuit: () => '<div class="nx"><div class="nx-ciel"></div><div class="nx-nuit"></div><div class="nx-aube"></div>' +
      '<div class="nx-etoiles">' + Array.from({ length: 22 }, (_, k) => '<i style="--x:' + ((k * 37) % 97 + 1) + "%;--y:" + ((k * 53) % 88 + 4) + "%;--s:" + (1.5 + (k % 3)) + "px;--d:" + ((k % 7) * 0.12).toFixed(2) + 's"></i>').join("") + "</div>" +
      '<div class="nx-titre"></div><div class="nx-sol"></div>' + prBoutique() +
      '<div class="nx-maison"><div class="nx-toit"></div><div class="nx-corps"></div><div class="nx-fen"><img src="' + PR.piece + '" alt=""></div>' +
        '<img class="nx-lea" src="fantome-maison.webp" alt=""><span class="nx-nom">🏠 La Maison de ' + PR.lea[0] + "</span></div>" +
      '<div class="nx-bulle">💭 ' + PR.lea[0] + " " + PR.lea[1] + "</div>" +
      '<div class="nx-vol"><img src="' + PR.fant + '" alt=""></div><div class="nx-cadeau">🎁</div>' +
      '<div class="nx-notifs"><div class="nx-n nx-n1"><header><img src="fantome-maison.webp" alt="">Chez ' + PR.lea[0] + "<em>☀️ 8:02</em></header>" +
          "<b>🎁 Votre surprise : " + prMin(PR.surprise.titre) + '</b><u data-fait="' + PR.surprise.fait + '">' + PR.surprise.bouton + "</u></div>" +
        '<div class="nx-n nx-n2"><header><img src="' + PR.fant + '" alt="">Chez vous · ' + PR.lieu + "<em>exemple</em></header><b>🔔 " + PR.surprise.notif + "</b></div></div>" +
      prEtin(12) + "</div>",
    // LE LIVRE DE SON COMMERCE : la couverture à son nom ; page 1, ce qui fait son commerce (sa photo, son
    // mémo vocal, son film, sa ville) et le tampon de la relève ; page 2, ses chiffres ; puis son mémo, ouvert
    demain: () => '<div class="dx">' +
      '<div class="dx-haut"><span class="dx-annee">2026</span><div class="dx-relai"><span class="vous">Vous</span><span class="dx-fl">→</span><span class="releve">La relève</span></div></div>' +
      '<div class="dx-cahier">' +
        '<div class="dx-page dx-p2"><h3 class="dx-titre"><small>Le livre de ' + PR.lieu + "</small>Ce qui marche… ou pas</h3>" +
          PR.stats.map(([e, nom, vues, resas, v], k) => '<div class="dx-prod" style="--d:' + (k * 0.15).toFixed(2) + 's"><b>' + e + " " + nom + "</b><span>🎬 " + vues.toLocaleString("fr-FR") +
            " vues · 📅 " + resas + " réservation" + (resas > 1 ? "s" : "") + '</span><strong class="dx-verdict ' + v + '">' + DX_VERDICTS[v] + "</strong></div>").join("") +
          '<span class="dx-exemple">exemple</span></div>' +
        '<div class="dx-page dx-p1"><h3 class="dx-titre"><small>Le livre de ' + PR.lieu + "</small>Tout ce qui fait votre commerce</h3>" +
          '<div class="dx-grille">' +
            '<div class="dx-item" data-k="0" style="--r:-3deg"><div class="dx-cadre"><img src="' + PR.geste + '" alt=""></div><em>Vos gestes</em></div>' +
            '<div class="dx-item secret" data-k="1" style="--r:2.5deg"><div class="dx-cadre memo"><b>' + (PR.voix ? "🎙️ Le secret de " : "✒️ Le secret de ") + PR.qui + "</b>" +
              (PR.voix ? '<span class="mini">' + Array.from({ length: 12 }, (_, k) => '<i style="--h:' + (25 + ((k * 37) % 75)) + '%"></i>').join("") + "</span><small>▶ " + DX_DUREE + "</small>"
                : '<span class="mini plume">✒️</span><small>de sa main</small>') + "</div><em>Vos secrets</em></div>" +
            '<div class="dx-item" data-k="2" style="--r:2deg"><div class="dx-cadre film"><img src="' + PR.film + '" alt=""></div><em>Vos histoires</em></div>' +
            '<div class="dx-item" data-k="3" style="--r:-2deg"><div class="dx-cadre ville">' + [["C", "#FF2E9A"], ["M", "#7C4DFF"], ["S", "#2FBF8F"], ["L", "#FF8A3D"], ["+", "#c9a46a"]].map(([l, c]) => '<b style="--c:' + c + '">' + l + "</b>").join("") +
              "<span>♥ vous suivent</span></div><em>Votre ville</em></div>" +
          '</div><span class="dx-tampon">✓ Transmis à la relève</span></div>' +
        '<div class="dx-couv"><img src="' + PR.fant + '" alt=""><small>Le livre de</small><b>' + PR.lieu + "</b><small>depuis 2026</small></div>" +
      "</div>" +
      '<div class="dx-voix"><small>📖 Gardé dans le livre · ' + (PR.voix ? "la voix de " : "les mots de ") + PR.qui + '</small><div class="dx-voix-corps">' +
        (PR.voix ? '<div class="dx-onde">' + Array.from({ length: 9 }, (_, k) => '<i style="--h:' + (30 + ((k * 41) % 70)) + '%"></i>').join("") + "</div>" : '<div class="dx-plume">✒️</div>') +
        "<p></p></div><em>— " + PR.qui + " · " + PR.lieu + "</em></div>" +
      '<div class="dx-promesse"><h2>Votre savoir-faire<br>ne mourra <em>jamais</em>.</h2>' + prEtin(14) + "</div></div>",
    carte: (l) => '<div class="s0"><span class="s0-num">' + l.num + "</span><small>" + l.petit + "</small><h2>" + l.titre + "</h2><p>" + l.sous + "</p></div>",
    // LE OUI : ce qu'il a vu (le chapitre bonus, s'il en a vu un), puis le bouton qui crée sa page
    oui: () => '<div class="oy"><h2 class="oy-titre">Alors, on y <em>va</em>' + NB + "?</h2><div class=\"oy-liste\">" +
      OUI_PROMESSES.filter((p) => !p.vu || p.vu === ouiVu).map((p, k) => '<div class="oy-p" data-k="' + k + '"><span class="s2-tuile"><svg viewBox="0 0 24 24" aria-hidden="true">' + p.ico +
        "</svg></span><span><b>" + p.titre + "</b><small>" + p.sous + "</small></span><i>✓</i></div>").join("") + "</div>" +
      '<a class="oy-go" href="' + OUI_CREER + '" target="_blank" rel="noopener">Créer ma page maintenant →<small>avec votre fiche Google · 2 minutes</small></a>' +
      (OUI_OFFRE ? '<p class="oy-offre">' + OUI_OFFRE + "</p>" : "") + prEtin(14) + "</div>",
  };
  const OUI_OFFRE = __OUI_OFFRE__, OUI_CREER = __OUI_CREER__;
  const OUI_PROMESSES = [
    { titre: "Plus de clients", sous: "sans y passer de temps", ico: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19.5a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.2A4.6 4.6 0 0 1 21 19"/>' },
    { titre: "Moins de dépenses", sous: "grâce à vos commerçants voisins", ico: '<circle cx="12" cy="12" r="8.5"/><path d="M15.4 8.7a4.3 4.3 0 1 0 0 6.6M7 10.8h6.2M7 13.3h6.2"/>' },
    { vu: "nuit", titre: "Même la nuit", sous: "votre fantôme vous ramène des clients", ico: '<path d="M20 14.6A8 8 0 1 1 9.4 4a6.4 6.4 0 0 0 10.6 10.6Z"/>' },
    { vu: "demain", titre: "Votre savoir-faire", sous: "gardé pour toujours, transmis à la relève", ico: '<path d="M4 5.6A2.6 2.6 0 0 1 6.6 3H20v14.5H6.6A2.6 2.6 0 0 0 4 20.1Z"/><path d="M4 20.1A1.9 1.9 0 0 0 5.9 22H20"/>' },
  ];
  let ouiVu = null;
  const ouiCoche = (k) => iTout(iAllume('.oy-p[data-k="' + k + '"]'), iSon("ding"));
  const OUI = {
    a: { nom: "oui-a", x: 50, decor: "oui", apres: 450, dit: __OUI_A__, debut: iTout(iAllume(".oy"), iSon("apparition")),
      mots: { clients: ouiCoche(0), "dépenses": ouiCoche(1) } },
    nuit: { nom: "oui-nuit", x: 50, garde: true, apres: 450, dit: __OUI_NUIT__, mots: { nuit: ouiCoche(2) } },
    demain: { nom: "oui-main", x: 50, garde: true, apres: 450, dit: __OUI_MAIN__, mots: { jamais: ouiCoche(2) } },
    b: { nom: "oui-b", x: 50, garde: true, apres: 300, dit: __OUI_B__, mots: { page: iTout(iAllume(".oy", "lance"), iGeste("salue", 1500), iSon("arrivee")) } },
  };
  /* le titre de la nuit, en trois temps */
  const nxTitre = (txt) => () => {
    const e = decorIntro(".nx-titre"); if (!e) return;
    e.classList.add("change"); setTimeout(() => { e.textContent = txt; e.classList.remove("change"); }, 200);
  };
  const nxToc = () => { const m = decorIntro(".nx-maison"); if (m) { m.classList.remove("toc"); void m.offsetWidth; m.classList.add("toc"); } son("pop"); setTimeout(() => son("pop"), 160); };
  const dxAnnees = () => {
    const b = decorIntro(".dx-annee"); if (!b) return;
    const t0 = performance.now();
    const pas = (t) => { const k = Math.min(1, (t - t0) / 2400); b.textContent = 2026 + Math.round(20 * (1 - Math.pow(1 - k, 2))); if (k < 1 && b.isConnected) requestAnimationFrame(pas); };
    requestAnimationFrame(pas);
  };
  const dxItem = (k) => iTout(iAllume('.dx-item[data-k="' + k + '"]'), iSon("carte"));
  const NUIT = [
    { carte: true, classe: "si-c4", num: "03", petit: "Chapitre 3", titre: "Pendant la <em>nuit</em>…", sous: "Pendant que vous dormez, votre fantôme travaille.", puce: "<b>03</b>Pendant la nuit" },
    { nom: "nuit-a", x: 50, decor: "nuit", apres: 1300, dit: __NUIT_A__, debut: nxTitre("🌙 Cette nuit…"),
      mots: { fermez: iTout(iAllume(".nx", "nuit"), iAllume(".pr-boutique", "eteinte"), iSon("declic")),
        sors: iTout(iAllume(".nx", "sort"), iSon("elan")),
        frappe: iTout(iAllume(".nx", "va"), nxTitre("👻 …votre fantôme rend visite à vos clients"), iPuis(900, nxToc)),
        habitants: iTout(iAllume(".nx", "chez"), iSon("eveil")),
        plaisir: iTout(iAllume(".nx", "envie"), iSon("note")),
        sarrange: iTout(iAllume(".nx", "cadeau"), iSon("magie")),
        matin: iTout(iAllume(".nx", "aube"), nxTitre("☀️ …et au réveil, ils réservent."), iSon("arrivee")),
        là: iTout(iAllume(".nx", "reserve"), iGeste("salue", 1500), iSon("ding")) } },
  ];
  const DEMAIN = [
    { carte: true, classe: "si-c3", num: "04", petit: "Chapitre 4", titre: "Quand vous passerez la <em>main</em>…", sous: "Ce que votre fantôme vous promet.", puce: "<b>04</b>Quand vous passerez la main" },
    // ① le livre de votre savoir-faire, transmis à la relève
    { nom: "demain-a", x: 50, decor: "demain", apres: 700, dit: __DEMAIN_A__,
      // pas de bruit sur « la main » (le souffle la couvrait : on ne l'entendait pas)
      mots: { jour: iTout(iAllume(".dx", "temps"), dxAnnees, iSon("glissement")), main: iAllume(".dx", "relai"),
        perdu: iTout(iAllume(".dx", "livre"), iSon("magie")), gestes: dxItem(0), secrets: dxItem(1), histoires: dxItem(2), ville: dxItem(3),
        transmets: iTout(iAllume(".dx", "transmet"), iGeste("salue", 1400), iSon("piece")) } },
    // ② ce qui a marché, ce qui n'a pas marché
    // la page tourne : ses chiffres
    { nom: "demain-chiffres", x: 50, garde: true, apres: 1600, dit: __DEMAIN_CHIFFRES__, debut: iTout(iAllume(".dx", "chiffres"), iSon("glissement")),
      mots: { "marché": iTout(iAllume(".dx", "bilan-ok"), iSon("ding")), pas: iTout(iAllume(".dx", "bilan-non"), iSon("choc")) } },
    // ③ on revient à la première page : son mémo s'ouvre, et c'est SA vraie voix (le fantôme se tait) ; sans
    // vocal enregistré, ses mots s'écrivent à la plume ; puis la promesse
    { nom: "demain-voix", garde: true, apres: 600, attente: 1500, dans: ".dx-voix p", qui: PR.voix ? ".dx-onde" : ".dx-plume", debut: iTout(iAllume(".dx", "ecoute"), iSon("apparition")), dit: PR.extrait },
    { nom: "demain-b", x: 50, garde: true, apres: 2800, debut: iAllume(".dx", "promesse"), dit: __DEMAIN_B__,
      mots: { jamais: iTout(iAllume(".dx", "jaillit"), iGeste("salue", 1800), iSon("ding")) } },
  ];
  Object.assign(TEMPS, __PR_TEMPS__);
  __PR_ENR__.forEach((n) => { if (!ENREGISTREES.includes(n)) ENREGISTREES.push(n); });
  // une réplique pas encore enregistrée : un rythme de parole estimé, sans son (comme l'intro)
  [...NUIT, ...DEMAIN, ...Object.values(OUI)].forEach((l) => {
    if (!l.nom || TEMPS[l.nom]) return;
    const m = [], ouvert = []; let t = 0.12;
    for (const mot of l.dit.split(" ")) {
      m.push(+t.toFixed(2));
      const d = 0.07 + mot.replace(/[^\p{L}\d]/gu, "").length * 0.05;
      ouvert.push([t, t + d]);
      t += d + (/[.?!:…]$/.test(mot) ? 0.32 : /[,;]$/.test(mot) ? 0.16 : 0.03);
    }
    const d = +(t + 0.1).toFixed(2);
    TEMPS[l.nom] = { d, m, b: Array.from({ length: Math.ceil(d / 0.04) }, (_, k) => (k % 4 !== 3 && ouvert.some(([a, z]) => k * 0.04 >= a && k * 0.04 < z) ? "1" : "0")).join("") };
  });
  /* Joue une scène sur l'écran de l'intro (sorti de l'accueil, posé sur la page) : la carte de son
     chapitre, puis ses répliques ; un appui finit la phrase, « Passer » ferme. */
  async function jouerPromesse(SEQ) {
    const it = $("#intro"), dit = $("#intro-dit"), scene = $("#si-scene"), fant = $("#si-fant"), decor = $("#si-decor"), prog = $("#si-progres");
    if (it.parentNode !== document.body) document.body.appendChild(it);
    taireVoix(); effacer(); viser(null);
    const ancien = prog.innerHTML;
    prog.innerHTML = SEQ.filter((l) => l.nom).map(() => "<i></i>").join("");
    const barres = $$("#si-progres i");
    let fini = false, actions = {}, passeCarte = null;
    it.classList.remove("si-sort", "si-c1", "si-c2", "si-c3", "si-c4", "si-chap-la");
    it.classList.add("pr-scene");
    it.hidden = false;
    son("apparition");
    $("#intro-passer").onclick = (e) => { e.stopPropagation(); fini = true; taireVoix(); if (passeCarte) passeCarte(); };
    it.onclick = () => { if (enParole) viteVoix = true; else if (passeCarte) passeCarte(); };
    const lettres = (s) => s.toLowerCase().replace(/[^\p{L}]/gu, "");
    const ecoute = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      const k = lettres(n.textContent), f = actions[k];
      if (f) { delete actions[k]; f(); }
    })));
    ecoute.observe(dit, { childList: true });
    await attendreMs(reduit ? 0 : 350);
    let n = 0;
    for (const l of SEQ) {
      if (fini) break;
      dit.textContent = "";
      fant.classList.remove("salue", "saute", "inquiet");
      if (l.carte) {
        it.classList.add(l.classe);
        $("#si-chap").innerHTML = l.puce;
        scene.style.setProperty("--x", "50%");
        decor.innerHTML = DECORS_PR.carte(l);
        fant.classList.add("salue"); son("accord");
        await new Promise((ok) => { passeCarte = ok; setTimeout(ok, reduit ? 900 : 1600); });
        passeCarte = null;
        it.classList.add("si-chap-la");
        continue;
      }
      dit.classList.toggle("long", !l.dans && l.dit.length > 100);
      scene.style.setProperty("--x", (l.x || 50) + "%");
      if (!l.garde) decor.innerHTML = l.decor ? DECORS_PR[l.decor]() : "";
      if (l.debut) requestAnimationFrame(() => requestAnimationFrame(l.debut));
      actions = { ...(l.mots || {}) };
      const b = barres[n++];
      if (b) { b.style.setProperty("--t", TEMPS[l.nom].d + "s"); b.style.setProperty("--p", "100%"); }
      const cible = l.dans ? decorIntro(l.dans) : dit, qui = l.qui ? decorIntro(l.qui) : fant;
      if (l.dans) await attendreMs(reduit ? 0 : l.attente || 700);
      if (!cible || !qui || !(await prononcer(qui, cible, l.dit, l.nom)) || fini) break;
      if (b) b.style.setProperty("--t", ".25s");
      await attendreMs(fini ? 0 : reduit ? 250 : l.apres);
    }
    ecoute.disconnect();
    fant.classList.remove("parle", "ouvre", "salue");
    if (SEQ.reste) {
      if (!decorIntro(".oy")) decor.innerHTML = DECORS_PR.oui();
      const oy = decorIntro(".oy"); oy.classList.add("on", "lance"); $$(".oy-p", oy).forEach((p) => p.classList.add("on"));
      await new Promise((ok) => { $("#intro-passer").onclick = (e) => { e.stopPropagation(); taireVoix(); ok(); }; });
    }
    it.classList.add("si-sort");
    await attendreMs(reduit ? 0 : 420);
    it.hidden = true;
    it.classList.remove("si-sort", "pr-scene", "si-c3", "si-c4", "si-chap-la");
    prog.innerHTML = ancien; decor.innerHTML = ""; dit.textContent = "";
  }
  /* LE OUI : après le chapitre bonus qu'il a vu (ou directement), ce qu'il a vu, coché, et le bouton */
  async function jouerOui(vu) {
    ouiVu = vu || null;
    const seq = [OUI.a, ...(ouiVu ? [OUI[ouiVu]] : []), OUI.b];
    seq.reste = true;
    await jouerPromesse(seq);
  }
"""


def une_fois(t, vieux, neuf, quoi):
    if t.count(vieux) != 1:
        raise SystemExit(f"{quoi} : {t.count(vieux)} occurrences")
    return t.replace(vieux, neuf)


def js(v):
    return json.dumps(v, ensure_ascii=False)


# ─── LES VOIX : la promesse coupée en deux (pour y glisser la voix du commerçant), mesurées ──────
os.makedirs(f"{R}/demain/coupe", exist_ok=True)
src = f"{R}/demain/demain.mp3"
COUPE = 11.40   # le silence entre « …je le transmets. » et « Votre savoir-faire… »
ff("-i", src, "-t", str(COUPE), "-af", "afade=t=out:st=%.2f:d=0.08" % (COUPE - 0.08), "-c:a", "libmp3lame", "-q:a", "3", f"{R}/demain/coupe/demain-a.mp3")
ff("-ss", str(COUPE), "-i", src, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.03", "-c:a", "libmp3lame", "-q:a", "3", f"{R}/demain/coupe/demain-b.mp3")
mesures = {}
for nom in ("demain-a", "demain-b"):
    mesures[nom] = aligner(FF, f"{R}/demain/coupe/{nom}.mp3", TEXTES[nom])
nuit = {}  # les répliques enregistrées au-delà de « demain » (la nuit, les chiffres)
COUPURES = {}
# nuit-a est dite vite : ses petites respirations (« Ce soir, | vous fermez. ») ne passent sous -45 dB ;
# à -38 dB, chaque phrase trouve son morceau (pauses mesurées à 0,63 s, 1,35 s, 2,03 s…)
SEUILS = {"nuit-a": "-38dB"}
for nom, dossier_voix in DOSSIER_VOIX.items():
    f = f"{R}/{dossier_voix}/{nom}.mp3"
    if os.path.exists(f):
        nuit[nom] = aligner(FF, f, TEXTES[nom], COUPURES.get(nom, ()), SEUILS.get(nom, "-45dB"))
print("demain", {k: (v["d"], len(v["m"])) for k, v in mesures.items()}, "· nuit enregistrée :", sorted(nuit) or "pas encore")

BOUTONS_FIN = ('<button type="button" class="go fin-chap" id="fin-%s-autre">Et pendant la nuit' + NB + '? →</button>'
               '<button type="button" class="go fin-chap" id="fin-%s-demain">Et quand vous passerez la main →</button>'
               '<button type="button" class="fin-conclure" id="fin-%s-oui">Passer à la conclusion →</button>')
for d, c in TOURS.items():
    dossier = f"{S}/{d}"
    page = f"{dossier}/index.html"
    t = open(page, encoding="utf-8").read()
    # sa vraie voix : le passage de son interview, coupé net (sans les silences du bord). Clara, Alice
    # et Inès n'ont pas encore de vocal (voix.mp3 muet, en attendant le leur) : leurs mots s'écrivent
    # alors dans le livre, à la plume, sans son — jamais une onde qui bouge sur du silence.
    a, z, texte = c["extrait"]
    temps = dict(mesures)
    fort = subprocess.run([FF, "-hide_banner", "-i", f"{dossier}/voix.mp3", "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    a_voix = float(re.search(r"max_volume: (-?[\d.]+) dB", fort).group(1)) > -60
    if a_voix:
        ff("-ss", str(a), "-to", str(z), "-i", f"{dossier}/voix.mp3",
           "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,afade=t=in:d=0.02",
           "-c:a", "libmp3lame", "-q:a", "3", f"{dossier}/demain-voix.mp3")
        temps["demain-voix"] = aligner(FF, f"{dossier}/demain-voix.mp3", texte)
    elif os.path.exists(f"{dossier}/demain-voix.mp3"):
        os.remove(f"{dossier}/demain-voix.mp3")
    temps.update(nuit)
    for nom in ("demain-a", "demain-b"):
        shutil.copy2(f"{R}/demain/coupe/{nom}.mp3", f"{dossier}/{nom}.mp3")
    for nom in nuit:
        shutil.copy2(f"{R}/{DOSSIER_VOIX[nom]}/{nom}.mp3", f"{dossier}/{nom}.mp3")
    # la pièce de Ma Maison où tombe la surprise (à la fenêtre de Léa) et le fantôme de Léa, tels que
    # l'application les montre
    piece = PIECES[c["pieces"][0][0]][1]
    shutil.copy2(f"{MAISON_APP}/{piece}", f"{dossier}/{piece}")
    shutil.copy2(f"{MAISON_APP}/fantome-maison.webp", f"{dossier}/fantome-maison.webp")
    pr = {"lieu": c["lieu"], "qui": c["qui"], "fant": c["fant"], "extrait": texte, "voix": a_voix, "lea": c["maisons"][0][:2], "piece": piece, "geste": c["geste"], "film": c["pages"][0],
          "surprise": c["surprise"], "stats": c["stats"]}
    for f in [piece, "fantome-maison.webp", c["fant"], c["geste"], c["pages"][0]]:
        if not os.path.exists(f"{dossier}/{f}"):
            raise SystemExit(f"{d} : image manquante {f}")
    code = (JS.replace("__PR__", js(pr)).replace("__PR_TEMPS__", js(temps)).replace("__PR_ENR__", js(sorted(temps)))
            .replace("__NUIT_A__", js(TEXTES["nuit-a"]))
            .replace("__DEMAIN_CHIFFRES__", js(TEXTES["demain-chiffres"]))
            .replace("__DUREE_VOIX__", js(temps["demain-voix"]["d"] if a_voix else 0))
            .replace("__DEMAIN_A__", js(TEXTES["demain-a"])).replace("__DEMAIN_B__", js(TEXTES["demain-b"]))
            .replace("__OUI_A__", js(TEXTES["oui-a"])).replace("__OUI_NUIT__", js(TEXTES["oui-nuit"])).replace("__OUI_MAIN__", js(TEXTES["oui-main"]))
            .replace("__OUI_B__", js(TEXTES["oui-b"])).replace("__OUI_OFFRE__", js(OFFRE)).replace("__OUI_CREER__", js(CREER)))
    t = une_fois(t, "</style>\n", CSS.lstrip("\n") + "</style>\n", "style")
    t = une_fois(t, "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", code.lstrip("\n") + "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", "js")
    # LES DEUX CHAPITRES DE PLUS, au bout des deux conversations (« Plus de clients » comme « Moins de
    # dépenses ») : « Pendant la nuit » (03) et « Quand vous passerez la main » (04), « avec le même graphisme
    # puisqu'elles valent autant l'une que l'autre ». « Rejouer » et « Et sans rien dire ? Notre spécialiste » s'en vont.
    t = une_fois(t, '<button type="button" class="go" id="fin-c-autre">Et vos dépenses ? →</button>', BOUTONS_FIN % ("c", "c", "c"), "boutons clients")
    t, n = re.subn(r'<button type="button" class="fin-rejouer fin-scenario" id="fin-c-scenario">[^<]*</button>', "", t)
    t, m = re.subn(r'  /\* « Montrer les 3 façons ».*?\n  \}\);\n', "", t, flags=re.S)
    if (n, m) != (1, 1):
        raise SystemExit(f"{d} : bouton « autre façon » introuvable ({n}, {m})")
    t = une_fois(t, '<button type="button" class="fin-rejouer" id="fin-c-rejouer">↺ Rejouer</button>', "", "rejouer clients")
    t = une_fois(t, '<button type="button" class="go" id="fin-d-autre">Et vos clients ? →</button><button type="button" class="fin-rejouer" id="fin-d-rejouer">↺ Rejouer</button>',
                 BOUTONS_FIN % ("d", "d", "d"), "boutons dépenses")
    t = une_fois(t, '  $("#fin-c-autre").addEventListener("click", () => { contexte(); changer("depenses"); });\n'
                 '  $("#fin-d-autre").addEventListener("click", () => { contexte(); changer("clients"); });\n',
                 '  /* Les deux chapitres de plus, au bout des deux conversations : « Pendant la nuit » (03) et « Quand vous\n'
                 '     passerez la main » (04). On reste ensuite sur la fin ; les onglets du haut mènent à l\'autre conversation. */\n'
                 '  [["#fin-c-autre", "nuit"], ["#fin-d-autre", "nuit"], ["#fin-c-demain", "demain"], ["#fin-d-demain", "demain"]].forEach(([sel, quoi]) =>\n'
                 '    $(sel).addEventListener("click", async () => { contexte(); await jouerPromesse(quoi === "nuit" ? NUIT : DEMAIN); await jouerOui(quoi); }));\n'
                 '  /* « Un seul chapitre bonus, choisi pour lui », puis le oui ; ou le oui tout de suite */\n'
                 '  ["#fin-c-oui", "#fin-d-oui"].forEach((sel) => $(sel).addEventListener("click", async () => { contexte(); await jouerOui(null); }));\n', "clics")
    t = une_fois(t, '  $("#fin-c-rejouer").addEventListener("click", () => { contexte(); aller(0); });\n', "", "clic rejouer clients")
    t = une_fois(t, '  $("#fin-d-rejouer").addEventListener("click", () => { contexte(); aller(0); });\n', "", "clic rejouer dépenses")
    open(page, "w", encoding="utf-8").write(t)
    print(d, "· voix du commerçant", temps["demain-voix"]["d"] if a_voix else "aucune (à la plume)", "s ·", texte)
