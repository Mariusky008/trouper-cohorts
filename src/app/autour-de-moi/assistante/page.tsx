// L'ESPACE COMMERÇANT — l'enveloppe et la feuille de style.
//
// NOINDEX : c'est l'écran d'un commerçant, pas une page publique, et il n'y a
// pas encore de compte — le manque le plus serieux du produit, et il est note.
//
// ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Le bloc
// est un litteral de gabarit ; un seul accent grave terminerait la chaine.
// `npm run verifier:styles` le mesure — et l'a deja mesure six fois.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { Assistante } from "./assistante";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Léa, votre assistante — ${MARQUE}` },
  robots: { index: false, follow: false },
  // SON PROPRE MANIFESTE, ET C'EST TOUT LE SUJET. Sans lui, « ajouter à l'écran
  // d'accueil » posait bien une icône, mais l'ouvrir renvoyait sur clikme.fr :
  // le manifeste racine porte `start_url: "/"`, et le téléphone suit le
  // manifeste, jamais la page depuis laquelle on installe. Voir le fichier.
  manifest: "/autour-de-moi/assistante/manifest.webmanifest",
  // Sur iPhone, ces deux-là décident du nom sous l'icône et du fait que la
  // barre de Safari disparaisse. Sans eux on ouvre un onglet, pas une
  // application — et un onglet, un commerçant le referme.
  appleWebApp: { capable: true, title: "Léa", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/direct/icone-autour.svg", type: "image/svg+xml" },
      { url: "/direct/icone-autour-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/direct/icone-autour-512.png",
    apple: "/direct/icone-autour-180.png",
  },
};

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* AUSSI SIMPLE QU'UNE MESSAGERIE, ET C'EST LE TEST A PASSER : on doit pouvoir
   dire a un commercant « voila votre assistante, parlez-lui » sans rien ajouter.
   S'il cherche ou creer son annonce, l'ecran a echoue.

   MAIS SIMPLE NE VEUT PAS DIRE NEUTRE, et c'est ce qui manquait : « il faut
   vraiment qu'il y ait un enorme wahoo, pour le moment c'est tres neutre ».
   Une messagerie est un OUTIL, et un outil de plus ne bluffe personne — il y en
   a deja six sur son telephone. Ce qui suit ne rajoute aucun bouton et aucune
   chose a comprendre : ca donne une PRESENCE et une lumiere. */
/* LE FOND DU SITE NE DOIT PAS APPARAITRE SOUS L'ECRAN. Le corps de page porte
   le beige de clikme.fr ; au moindre pixel de decalage — barre d'adresse qui se
   retracte, clavier qui se ferme, capture d'ecran — une bande claire apparait
   sous l'application. Sur un ecran qu'on tend a quelqu'un, ca suffit a le faire
   ressembler a une page web posee dans une autre. */
body{background:#05090C}

.as{--nuit:#05090C;--nuit2:#0E1614;--craie:#EAF2EC;--craie2:#93A79C;
  --craie3:#6C8078;--menthe:#3DE2A6;--menthe2:#7EE6C0;--or:#F0B429;
  --rouge:#FF6B6B;--violet:#B98CFF;
  --trait:rgba(234,242,236,.13);
  position:relative;isolation:isolate;overflow:hidden;
  min-height:100dvh;display:flex;flex-direction:column;
  background:var(--nuit);color:var(--craie);
  font-family:'Inter',system-ui,-apple-system,sans-serif}
.as *{box-sizing:border-box}

/* ═══ LA LUMIERE DE LA PIECE ═══
   Deux halos tres flous qui derivent lentement. Deux div, zero octet de reseau,
   et un aplat noir devient une piece eclairee. Ils accelerent quand Lea parle :
   la piece respire avec elle, ce qui se sent sans se remarquer. */
/* LA LUMIERE DOIT SE VOIR, SINON ELLE NE SERT A RIEN. Premiere version a 50 %
   d'opacite : indiscernable d'un aplat noir sur une capture, donc invisible
   dans une boutique eclairee au neon. On monte, et on remonte encore quand Lea
   parle. */
/* ═══ OU SE POSE LA LUMIERE ═══
   FIXE, ET PAS ABSOLU. La conversation s'allonge : en absolu, les halos
   s'etiraient sur toute la hauteur du fil et se diluaient jusqu'a disparaitre.
   Fixes, ils restent la lumiere de la PIECE — celle qui ne bouge pas quand on
   fait defiler ce qu'il y a dedans.

   ET LA GEOMETRIE SE MESURE, ELLE NE SE DEVINE PAS. Le conteneur avait un
   retrait negatif de 20 %, ce qui decalait son origine a (-78,-169) ; les halos,
   places par rapport a LUI, tombaient a x=-117 pour 273 px de large — presque
   entierement hors de l'ecran. On en voyait un coin, donc rien. Le conteneur
   colle maintenant a la fenetre, et les halos sont assez larges pour qu'une
   bonne moitie soit toujours dedans. */
.as-halo{position:fixed;inset:0;z-index:-1;pointer-events:none;
  filter:blur(64px);opacity:1}
.as-halo span{position:absolute;display:block;border-radius:50%}
.as-halo span:first-child{width:95vw;height:95vw;left:-25vw;top:-10vh;
  background:radial-gradient(circle,rgba(61,226,166,.6),transparent 66%);
  animation:asDerive1 26s ease-in-out infinite alternate}
.as-halo span:last-child{width:95vw;height:95vw;right:-25vw;bottom:-8vh;
  background:radial-gradient(circle,rgba(139,92,246,.62),transparent 66%);
  animation:asDerive2 32s ease-in-out infinite alternate}
.as.ambiance .as-halo{opacity:1;transition:opacity .8s ease}
@keyframes asDerive1{
  0%{transform:translate3d(0,0,0) scale(1)}
  100%{transform:translate3d(14vw,10vh,0) scale(1.18)}
}
@keyframes asDerive2{
  0%{transform:translate3d(0,0,0) scale(1.1)}
  100%{transform:translate3d(-12vw,-9vh,0) scale(.92)}
}
@media (prefers-reduced-motion:reduce){
  .as-halo span{animation:none}
}

/* L'EN-TETE PASSE SOUS L'HORLOGE DE L'IPHONE, ET CA SE VOIT SUR LA CAPTURE :
   « 14:16 » et la barre 5G ecrasaient « Bonjour Margot ». Une fois posee sur
   l'ecran d'accueil, l'application occupe tout l'ecran, encoche comprise —
   c'est le reglage viewportFit qui le veut, et c'est bien ce qu'on veut. Il faut
   alors rendre a la barre d'etat la place qu'elle prend. */
.as-h{flex:none;display:flex;align-items:center;justify-content:space-between;
  padding:calc(14px + env(safe-area-inset-top)) clamp(14px,4vw,26px) 14px;
  border-bottom:1px solid var(--trait)}
.as-h b{font-size:15px;font-weight:850;letter-spacing:-.02em;color:var(--menthe)}
.as-h a{text-decoration:none;font-size:13px;font-weight:750;color:var(--craie3)}

.as-qui{flex:none;display:flex;align-items:center;gap:14px;
  padding:18px clamp(14px,4vw,26px) 8px}
.as-nom{min-width:0}
.as-qui h1{margin:0;font-size:clamp(21px,5.2vw,28px);letter-spacing:-.035em;
  line-height:1.1}
.as-qui p{margin:4px 0 0;font-size:12.5px;color:var(--craie3);
  transition:color .3s ease}
.as-lea.parle~.as-nom p,.as-lea.ecoute~.as-nom p{color:var(--menthe2)}

/* ═══ LEA ═══
   TROIS ANNEAUX ET UNE INITIALE, ET C'EST LA SEULE CHOSE DE CET ECRAN QUI SOIT
   VRAIMENT NEUVE. Au repos elle respire ; quand elle parle, les anneaux
   partent vers l'exterieur ; quand elle ecoute, ils rentrent. Ce n'est pas une
   decoration : c'est la difference entre « j'ecris a un logiciel » et
   « quelqu'un m'ecoute ». Le commercant a qui l'on tend le telephone ne lit pas
   une interface, il rencontre quelqu'un. */
.as-lea{position:relative;flex:none;width:58px;height:58px;border-radius:50%;
  display:flex;align-items:center;justify-content:center}
.as-lea b{position:relative;z-index:2;width:44px;height:44px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:19px;font-weight:850;color:#04150E;letter-spacing:-.02em;
  background:linear-gradient(140deg,var(--menthe2),var(--menthe));
  box-shadow:0 6px 22px rgba(61,226,166,.45);
  animation:asRespire 4.5s ease-in-out infinite}
.as-lea i{position:absolute;inset:0;border-radius:50%;
  border:1.5px solid rgba(126,230,192,.5);opacity:0}
.as-lea.parle i{animation:asOnde 2.1s ease-out infinite}
.as-lea.parle i:nth-child(2){animation-delay:.7s}
.as-lea.parle i:nth-child(3){animation-delay:1.4s}
.as-lea.parle b{animation:asRespire 1.4s ease-in-out infinite}
/* ECOUTER, C'EST L'INVERSE DE PARLER : les anneaux vont vers le centre. On le
   comprend sans que personne ne l'explique, et c'est pour ca qu'on ne l'ecrit
   nulle part a l'ecran. */
.as-lea.ecoute i{border-color:rgba(255,107,107,.55);animation:asAspire 1.8s ease-in infinite}
.as-lea.ecoute i:nth-child(2){animation-delay:.6s}
.as-lea.ecoute i:nth-child(3){animation-delay:1.2s}
.as-lea.ecoute b{background:linear-gradient(140deg,#FFB4B4,var(--rouge));
  color:#2A0505;box-shadow:0 6px 22px rgba(255,107,107,.45)}
@keyframes asRespire{
  0%,100%{transform:scale(1)}
  50%{transform:scale(1.07)}
}
@keyframes asOnde{
  0%{transform:scale(.76);opacity:.85}
  100%{transform:scale(1.5);opacity:0}
}
@keyframes asAspire{
  0%{transform:scale(1.5);opacity:0}
  40%{opacity:.8}
  100%{transform:scale(.78);opacity:0}
}
@media (prefers-reduced-motion:reduce){
  .as-lea b,.as-lea i{animation:none}
  .as-lea i{opacity:.35}
}

/* ═══ CE QUI EST DEJA EN LIGNE ═══
   UN ETAT, PAS UN MESSAGE. Il ne defile pas avec la conversation : il reste en
   haut, sous le nom, et il dit ce que la ville voit EN CE MOMENT. Sans lui, ce
   qui etait publie se perdait dans le fil au milieu des questions, et au bout
   de six tours plus personne ne savait ce qui etait parti. */
.as-enligne{flex:none;margin:6px clamp(14px,4vw,26px) 0;padding:10px 12px;
  border-radius:14px;background:rgba(61,226,166,.08);
  border:1px solid rgba(61,226,166,.26)}
.as-enligne-t{display:block;font-size:9.5px;font-weight:850;letter-spacing:.16em;
  text-transform:uppercase;color:var(--menthe)}
.as-enligne ul{list-style:none;margin:7px 0 0;padding:0;display:flex;
  flex-direction:column;gap:5px}
.as-enligne li{display:flex;align-items:baseline;gap:8px;min-width:0}
.as-enligne b{flex:1;min-width:0;font-size:13.5px;font-weight:750;
  color:var(--craie);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.as-enligne em{flex:none;font-style:normal;font-size:11.5px;color:var(--craie3);
  font-variant-numeric:tabular-nums}

/* ─── LE FIL ───
   Deux bulles, et rien d'autre. Pas d'horodatage, pas d'avatar, pas d'accuse de
   lecture : chaque ornement d'une messagerie ajouterait une chose a comprendre
   a quelqu'un qui n'a rien demande. */
.as-fil{flex:1;min-height:0;overflow-y:auto;
  padding:14px clamp(14px,4vw,26px) 8px;
  display:flex;flex-direction:column;gap:10px}
/* LES BULLES ARRIVENT, ELLES N'APPARAISSENT PAS. Trois dixiemes de seconde de
   montee : c'est ce qui fait qu'une reponse est DONNEE plutot qu'affichee, et
   ca ne coute rien a personne. */
.as-elle,.as-lui{margin:0;max-width:86%;padding:13px 16px;border-radius:20px;
  font-size:15.5px;line-height:1.45;
  animation:asMonte .34s cubic-bezier(.22,1.1,.4,1) both}
@keyframes asMonte{
  from{opacity:0;transform:translate3d(0,10px,0) scale(.985)}
  to{opacity:1;transform:none}
}
@media (prefers-reduced-motion:reduce){.as-elle,.as-lui{animation:none}}
/* SA BULLE A ELLE EST EN VERRE : un fond translucide sur la lumiere du fond,
   et non un rectangle opaque pose dessus. C'est ce qui fait qu'elle appartient
   a la piece au lieu d'y etre collee. */
.as-elle{align-self:flex-start;border-bottom-left-radius:7px;
  color:var(--craie);background:rgba(18,32,28,.66);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(126,230,192,.16);
  box-shadow:0 8px 26px rgba(0,0,0,.35)}
.as-lui{align-self:flex-end;border-bottom-right-radius:7px;
  color:#04150E;font-weight:650;
  background:linear-gradient(140deg,var(--menthe2),var(--menthe));
  box-shadow:0 8px 24px rgba(61,226,166,.28)}
.as-points{display:flex;gap:5px;align-items:center;padding:16px 17px}
.as-points i{width:6px;height:6px;border-radius:50%;background:var(--craie3);
  animation:asPense 1.2s ease-in-out infinite}
.as-points i:nth-child(2){animation-delay:.15s}
.as-points i:nth-child(3){animation-delay:.3s}
@keyframes asPense{0%,60%,100%{opacity:.25}30%{opacity:1}}
@media (prefers-reduced-motion:reduce){.as-points i{animation:none;opacity:.6}}

/* ═══════════════════════════════════════════════════════════════════════
   LES DEUX MOMENTS QUI NE SONT PAS DES REPLIQUES
   ═══════════════════════════════════════════════════════════════════════
   « Les moments cles ne sont pas assez mis en evidence. » C'est juste, et
   c'est vrai des deux seuls endroits ou ce produit PROUVE quelque chose :
   ce qu'il a dit est parti chez des gens, et elle se souvient de sa semaine
   derniere. Les deux etaient des bulles grises identiques a toutes les
   autres — c'est-a-dire invisibles.

   POURQUOI DEUX TRAITEMENTS ET PAS UN. Ils ne disent pas la meme chose. Le
   premier est un RECU : c'est fait, voila ou. Le second est une SURPRISE :
   quelqu'un a suivi sa semaine. Un seul style pour les deux les banaliserait
   l'un l'autre au deuxieme passage.

   ET POURQUOI LE VIOLET POUR LA MEMOIRE. Le vert est deja pris trois fois
   sur cet ecran — sa bulle a lui, la carte a valider, le bouton. Une
   quatrieme chose verte ne se remarque plus. Le violet n'apparait nulle part
   ailleurs ici : il ne peut etre confondu avec rien. */

/* ─── LE RECU : C'EST PARTI CHEZ DES GENS ─── */
.as-fait{align-self:stretch;margin:8px 0 4px;padding:16px 17px;
  display:flex;gap:14px;align-items:flex-start;border-radius:20px;
  color:#04150E;
  background:linear-gradient(135deg,var(--menthe2),var(--menthe) 62%,#28C98C);
  box-shadow:0 16px 44px rgba(61,226,166,.34),0 2px 0 rgba(255,255,255,.28) inset;
  animation:asRecu .5s cubic-bezier(.2,1.15,.35,1) both}
/* LA COCHE SE POSE APRES LE PANNEAU, PAS AVEC LUI. Un dixieme de seconde de
   decalage suffit a faire lire « c'est arrive » plutot que « c'etait la ». */
/* LA COCHE EST UN TAMPON BLANC, ET C'EST CE QUI SEPARE LE RECU DE SA VOIX A
   LUI. Ses bulles sont vertes elles aussi : sans un signe qui n'existe nulle
   part ailleurs, le panneau se lisait au coup d'oeil comme quelque chose qu'il
   venait de dire. Vu sur la capture. */
.as-fait>i{flex:none;width:34px;height:34px;border-radius:50%;
  display:grid;place-items:center;font-style:normal;font-size:18px;font-weight:900;
  background:#FFF;color:#0B7A55;
  box-shadow:0 3px 10px rgba(4,21,14,.22);
  animation:asCoche .42s cubic-bezier(.2,1.5,.4,1) .12s both}
.as-fait b{display:block;font-size:18px;font-weight:900;letter-spacing:-.025em}
.as-fait ul{list-style:none;margin:7px 0 0;padding:0;
  display:flex;flex-direction:column;gap:5px}
.as-fait li{font-size:13.5px;font-weight:700;line-height:1.35;
  display:flex;align-items:center;gap:7px;color:rgba(4,21,14,.82)}
.as-fait li span{font-size:12px}
@keyframes asRecu{
  from{opacity:0;transform:translate3d(0,14px,0) scale(.96)}
  to{opacity:1;transform:none}
}
@keyframes asCoche{from{opacity:0;transform:scale(.3)}to{opacity:1;transform:none}}

/* ─── LA PREUVE QU'ELLE SUIT SON COMMERCE ─── */
.as-souvenir{align-self:stretch;margin:8px 0 4px;padding:15px 17px 16px;
  border-radius:20px;position:relative;overflow:hidden;
  background:linear-gradient(150deg,rgba(185,140,255,.19),rgba(18,14,32,.82));
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border:1px solid rgba(185,140,255,.5);
  box-shadow:0 16px 44px rgba(0,0,0,.5),0 0 34px rgba(185,140,255,.14) inset;
  animation:asMonte .5s cubic-bezier(.22,1.1,.4,1) both}
/* UN FILET LUMINEUX SUR LE BORD GAUCHE : la marge d'un carnet. C'est le seul
   endroit de l'ecran ou quelque chose est cite plutot que dit. */
.as-souvenir::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;
  background:linear-gradient(180deg,var(--violet),rgba(185,140,255,.25))}
.as-souvenir em{display:block;font-style:normal;font-size:10.5px;font-weight:900;
  letter-spacing:.14em;text-transform:uppercase;color:var(--violet);
  margin-bottom:7px}
.as-souvenir p{margin:0;font-size:16.5px;line-height:1.42;font-weight:600;
  color:var(--craie);letter-spacing:-.01em}
@media (prefers-reduced-motion:reduce){
  .as-fait,.as-fait>i,.as-souvenir{animation:none}
}

/* ═══ LA CARTE DE VALIDATION ═══
   TROIS CHIFFRES, GROS, ET UN SEUL BOUTON VERT. Ce n'est pas un apercu de
   l'annonce : un apercu se survole et se valide sans lire. Ce sont les trois
   valeurs qui peuvent etre fausses — le prix, la quantite, l'heure — sorties du
   texte et grossies, parce que c'est exactement la que le vocal se trompe. Une
   erreur coute alors un doigt au lieu d'une journee. */
.as-carte{align-self:stretch;margin:6px 0;padding:16px 17px;border-radius:20px;
  background:linear-gradient(160deg,rgba(61,226,166,.13),rgba(18,32,28,.72));
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border:1px solid rgba(61,226,166,.42);
  box-shadow:0 14px 44px rgba(0,0,0,.45),0 0 0 1px rgba(61,226,166,.08) inset;
  animation:asMonte .38s cubic-bezier(.22,1.1,.4,1) both}
.as-carte h2{margin:0;font-size:17px;font-weight:850;letter-spacing:-.02em;
  display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.as-carte h2 em{font-style:normal;font-size:10.5px;font-weight:850;
  letter-spacing:.1em;text-transform:uppercase;color:var(--or)}
.as-d{margin:5px 0 0;font-size:13.5px;line-height:1.4;color:var(--craie2)}
.as-cles{list-style:none;margin:13px 0 0;padding:0;display:grid;
  grid-template-columns:repeat(3,1fr);gap:9px}
.as-cles li{padding:10px 11px;border-radius:13px;background:rgba(5,9,12,.5);
  border:1px solid var(--trait);text-align:center}
.as-cles b{display:block;font-size:19px;font-weight:850;letter-spacing:-.02em;
  font-variant-numeric:tabular-nums}
/* LA CASE QUE PERSONNE N'A REMPLIE SE PROPOSE. Un « — » gris se lit comme un
   oubli ; un « + » ambre se lit comme une place libre. La quantite n'etant plus
   demandee pour publier, cette case est souvent vide — elle doit avoir l'air
   offerte, et se toucher. */
.as-cles b.vide{color:var(--or);cursor:pointer;line-height:1}
.as-cles b.vide:active{transform:scale(.94)}
/* EN RETOUCHE, LE CHIFFRE DEVIENT UN CHAMP — meme taille, meme place, on ne
   deplace rien. Ce qu'on touche est exactement ce qu'on lisait. */
.as-cles input{width:100%;font:inherit;font-size:19px;font-weight:850;
  letter-spacing:-.02em;font-variant-numeric:tabular-nums;text-align:center;
  color:var(--craie);background:transparent;border:0;border-bottom:2px solid var(--or);
  padding:0 0 2px;border-radius:0}
.as-cles input:focus{outline:none;border-bottom-color:var(--menthe)}
.as-cles.retouche li{border-color:rgba(240,180,41,.45);
  background:rgba(240,180,41,.07)}
.as-cles em{display:block;margin-top:2px;font-style:normal;font-size:10.5px;
  letter-spacing:.06em;text-transform:uppercase;color:var(--craie3)}
.as-valide{display:flex;gap:9px;margin-top:13px}
.as-oui{flex:1;font:inherit;font-size:16.5px;font-weight:850;color:#04150E;
  cursor:pointer;border:0;border-radius:15px;padding:16px;
  background:linear-gradient(140deg,var(--menthe2),var(--menthe));
  box-shadow:0 8px 24px rgba(61,226,166,.35)}
.as-oui:active{transform:scale(.985)}
.as-non{flex:none;font:inherit;font-size:14px;font-weight:750;color:var(--craie2);
  cursor:pointer;background:transparent;border:1px solid var(--trait);
  border-radius:14px;padding:15px 17px}

/* ═══ LA FIN DE JOURNEE ═══
   LA PLUS GRANDE CARTE DE L'ECRAN, ET C'EST VOULU. C'est le seul retour qu'un
   commercant ait jamais de sa journee : ni sa fiche Google, ni son site, ni ses
   reseaux ne reviennent le soir avec un chiffre. C'est ce qui le fait
   recommencer demain, donc c'est ce qui doit rester en memoire quand il rend le
   telephone. */
.as-bilan{align-self:stretch;margin:8px 0;padding:20px 18px;border-radius:22px;
  text-align:center;
  background:linear-gradient(165deg,rgba(139,92,246,.2),rgba(61,226,166,.12) 55%,rgba(10,18,16,.8));
  backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid rgba(185,140,255,.4);
  box-shadow:0 18px 60px rgba(0,0,0,.5);
  animation:asMonte .5s cubic-bezier(.22,1.1,.4,1) both}
.as-bilan-t{display:block;font-size:10.5px;font-weight:850;letter-spacing:.18em;
  text-transform:uppercase;color:var(--violet)}
.as-bilan-h{margin:9px 0 0;font-family:Georgia,'Times New Roman',serif;
  font-size:22px;line-height:1.2;color:#fff}
.as-bilan ul{list-style:none;margin:18px 0 0;padding:0;display:grid;
  grid-template-columns:repeat(3,1fr);gap:10px}
.as-bilan li{padding:13px 8px;border-radius:15px;background:rgba(5,9,12,.45);
  border:1px solid rgba(234,242,236,.1)}
/* LES CHIFFRES SONT ENORMES PARCE QU'ILS SONT LE SUJET. Tout le reste de la
   carte est une phrase autour d'eux. */
.as-bilan b{display:block;font-size:30px;font-weight:850;letter-spacing:-.04em;
  line-height:1;color:#fff;font-variant-numeric:tabular-nums}
.as-bilan em{display:block;margin-top:6px;font-style:normal;font-size:10.5px;
  line-height:1.3;color:var(--craie3)}
.as-bilan-m{margin:16px 0 0;font-size:14px;line-height:1.45;color:var(--craie2)}
.as-bilan-d{margin:14px 0 0;font-size:17px;font-weight:800;color:var(--menthe2)}

.as-retour{align-self:flex-start;margin:0;font-size:12.5px;color:var(--or)}
.as-echo{align-self:flex-start;margin:0;font-size:12.5px;color:var(--rouge)}

.as-bas{flex:none;padding:10px clamp(14px,4vw,26px) calc(12px + env(safe-area-inset-bottom));
  border-top:1px solid var(--trait);background:var(--nuit)}
.as-vivant{margin:0 0 9px;font-size:14.5px;line-height:1.4;color:var(--craie2)}
.as-saisie{display:flex;align-items:center;gap:9px}
/* LE MICRO EST L'ACTION PRINCIPALE : c'est la seule interface qui ne demande pas
   d'apprendre un geste. Il est gros parce qu'on appuie dessus debout, dans le
   bruit, avec une main. */
.as-micro{flex:none;width:56px;height:56px;border-radius:50%;font-size:22px;
  cursor:pointer;border:0;color:#04150E;background:var(--menthe)}
.as-micro.on{color:#fff;background:var(--rouge);
  animation:asBat 1.6s ease-out infinite}
@keyframes asBat{
  0%{box-shadow:0 0 0 0 rgba(255,107,107,.55)}
  70%{box-shadow:0 0 0 18px rgba(255,107,107,0)}
  100%{box-shadow:0 0 0 0 rgba(255,107,107,0)}
}
@media (prefers-reduced-motion:reduce){.as-micro.on{animation:none}}
.as-micro:disabled{opacity:.4}
/* ET LE CLAVIER NE SE CACHE PAS. S'il rate deux fois, il doit pouvoir taper
   sans chercher un bouton — c'est la condition qu'on s'est donnee en choisissant
   le vocal comme entree principale. */
.as-saisie input{flex:1;min-width:0;font:inherit;font-size:16px;
  color:var(--craie);background:var(--nuit2);border:1px solid var(--trait);
  border-radius:999px;padding:15px 17px}
.as-saisie input::placeholder{color:#4B5A54}
.as-saisie input:focus{outline:2px solid var(--menthe);outline-offset:1px}
.as-env{flex:none;width:44px;height:44px;border-radius:50%;font-size:17px;
  font-weight:850;cursor:pointer;color:var(--craie);background:var(--nuit2);
  border:1px solid var(--trait)}
.as-env:disabled{opacity:.3}

/* LA BARRE DE DEMONSTRATION — hors du produit du commercant, et elle en a l'air. */
.as-demo{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:11px}
.as-demo span{font-size:10px;font-weight:850;letter-spacing:.12em;
  text-transform:uppercase;color:#3E4C46}
.as-demo button{font:inherit;font-size:11.5px;font-weight:750;cursor:pointer;
  color:var(--craie3);background:transparent;border:1px solid var(--trait);
  border-radius:999px;padding:5px 11px}
.as-demo button.on{color:#04150E;background:var(--or);border-color:var(--or)}
.as-demo button:disabled{opacity:.35}

/* LA PHOTO SUR LA CARTE DE VALIDATION. Le bouton se voit quand Lea l'a
   demandee, et reste discret sinon : elle est facultative, et une image
   reclamee a chaque annonce se fait ignorer des le troisieme jour. */
/* DEUX BOUTONS COTE A COTE : il ne choisit pas un FORMAT, il choisit ce qu'il a
   sous la main. Le plat qui sort du four se filme mieux qu'il ne se
   photographie, et l'inverse est vrai d'une ardoise. */
.as-media{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}
.as-media label{display:block;cursor:pointer}
.as-media input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.as-media span{display:block;text-align:center;font-size:13.5px;font-weight:800;
  color:var(--craie2);background:rgba(5,9,12,.5);border:1px dashed var(--trait);
  border-radius:13px;padding:13px 8px}
.as-media label.demande span{color:var(--or);border-style:solid;
  border-color:rgba(240,180,41,.55);background:rgba(240,180,41,.09)}
.as-vid{margin:9px 0 0;font-size:12.5px;color:var(--menthe)}
.as-vue{display:block;width:100%;margin-top:12px;border-radius:13px;
  aspect-ratio:16/10;object-fit:cover;cursor:pointer}
/* LA FICHE GOOGLE, ET ON NE FAIT PAS SEMBLANT. Publier tout seul dessus demande
   que le commercant relie son compte — ca n'existe pas encore. Le bouton
   enregistre la photo et ouvre sa fiche : deux gestes au lieu de cinq, et
   aucune promesse tenue a moitie. Discret, parce que c'est un service en plus
   et non l'action principale. */
.as-google{display:flex;align-items:center;gap:11px;width:100%;text-align:left;
  font:inherit;cursor:pointer;margin-top:9px;padding:11px 13px;border-radius:13px;
  background:rgba(5,9,12,.5);border:1px solid var(--trait)}
.as-google i{flex:none;width:26px;height:26px;border-radius:50%;font-style:normal;
  font-size:14px;font-weight:850;display:flex;align-items:center;
  justify-content:center;color:var(--craie3);border:1px solid var(--trait)}
.as-google b{display:block;font-size:13.5px;font-weight:750;color:var(--craie2)}
.as-google em{display:block;margin-top:2px;font-style:normal;font-size:11.5px;
  color:var(--craie3)}
.as-google.on{background:rgba(61,226,166,.08);border-color:rgba(61,226,166,.32)}
.as-google.on i{color:#04150E;background:var(--menthe);border-color:var(--menthe)}
.as-google.on b{color:var(--craie)}

/* LES AMORCES — trois debuts de phrase, pas trois categories. On ne lui demande
   pas de quoi il veut parler : on lui met les premiers mots dans la bouche, il
   appuie, et il finit. Le choix est fait sans qu'il ait eu l'impression de
   choisir. Elles n'apparaissent qu'au RETOUR : le matin, la question fermee de
   Lea fait mieux. */
.as-amorces{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}
.as-amorces button{font:inherit;font-size:13px;font-weight:700;cursor:pointer;
  color:var(--craie2);background:rgba(18,32,28,.6);
  border:1px solid rgba(126,230,192,.2);border-radius:999px;padding:9px 15px}
.as-amorces button:active{transform:scale(.97)}

/* « MAINS LIBRES » N'EXISTE PLUS. Le reglage servait un cas qui ne s'est
   jamais produit, et il le payait sur la ligne la plus precieuse de l'ecran :
   celle juste au-dessus du micro. Le bouton d'arret du micro, gros et rouge,
   fait deja le seul geste dont on ait besoin. */
.as-muette{margin:7px 0 0;font-size:11.5px;line-height:1.45;color:var(--rouge)}

/* ═══ VOIR LE RESULTAT ═══
   « Le bouton pour voir le resultat sur le direct est tres cache et tres
   discret. » Il l'etait : un lien en petit vert, sous une barre de reglages,
   ecrit « voir ce que vos clients voient » — une phrase qui decrit une
   intention au lieu d'annoncer un resultat.

   C'EST POURTANT LA CHUTE DE TOUTE LA DEMONSTRATION. Le commercant vient de
   parler trente secondes ; c'est ici qu'il decouvre que ca a produit quelque
   chose de reel. Toute la largeur, un compte, une fleche, et un halo qui
   respire pour qu'on ne puisse pas ne pas le voir. */
.as-voir{display:flex;align-items:center;gap:12px;margin-top:12px;
  padding:15px 17px;border-radius:17px;text-decoration:none;color:#04150E;
  background:linear-gradient(140deg,var(--menthe2),var(--menthe));
  box-shadow:0 10px 30px rgba(61,226,166,.32);
  animation:asAppelle 3.4s ease-in-out infinite}
.as-voir span{flex:1;min-width:0}
.as-voir b{display:block;font-size:15.5px;font-weight:850;letter-spacing:-.02em}
.as-voir em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;
  font-weight:650;color:rgba(4,21,14,.7)}
.as-voir i{flex:none;font-style:normal;font-size:21px;font-weight:850}
.as-voir:active{transform:scale(.99)}
@keyframes asAppelle{
  0%,100%{box-shadow:0 10px 30px rgba(61,226,166,.28)}
  50%{box-shadow:0 10px 38px rgba(61,226,166,.5)}
}
@media (prefers-reduced-motion:reduce){.as-voir{animation:none}}

/* FIN DE SERVICE : le dernier temps de la demonstration, donc le bouton le plus
   marque de la barre. */
.as-fin{color:var(--violet) !important;
  border-color:rgba(185,140,255,.45) !important;
  background:rgba(139,92,246,.12) !important}

/* ─── LE CHOIX DU METIER, AU DEBUT DE LA DEMONSTRATION ─── */
.as-choix{flex:1;padding:32px clamp(14px,4vw,26px);
  animation:asMonte .5s cubic-bezier(.22,1.1,.4,1) both}
.as-choix h1{margin:0;font-size:clamp(27px,7vw,38px);letter-spacing:-.04em;
  line-height:1.08}
.as-choix p{margin:10px 0 0;font-size:15px;line-height:1.55;color:var(--craie2);
  max-width:42ch}
.as-choix .as-n{font-size:12.5px;color:var(--craie3)}
.as-metiers{margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.as-metiers button{font:inherit;text-align:left;cursor:pointer;
  padding:15px 16px;border-radius:16px;color:var(--craie);
  background:rgba(18,32,28,.6);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border:1px solid rgba(126,230,192,.16);
  transition:border-color .2s ease,transform .2s ease}
.as-metiers button:active{transform:scale(.985)}
.as-metiers button:hover{border-color:var(--menthe)}
.as-metiers b{display:block;font-size:15px;font-weight:800}
.as-metiers em{display:block;margin-top:3px;font-style:normal;font-size:12px;
  color:var(--craie3)}

@media(max-width:420px){.as-metiers{grid-template-columns:1fr}}

/* ═══════════════════════════════════════════════════════════════════════
   LES TROIS ONGLETS
   ═══════════════════════════════════════════════════════════════════════
   Une barre du bas est une promesse : elle dit qu'il y a une VIE ici, pas
   seulement une conversation qu'on ouvre et qu'on ferme. Trois entrees, jamais
   quatre — chaque onglet de plus repousse le seul qui compte.

   ELLE FLOTTE AU-DESSUS DU FOND, pas collee dessus : le meme verre que les
   bulles, pour qu'elle appartienne a la piece. Et elle respecte la barre
   d'accueil de l'iPhone, sinon le pouce tape a cote toute la journee. */
.as-onglets{position:sticky;bottom:0;z-index:5;
  display:grid;grid-template-columns:repeat(3,1fr);gap:2px;
  padding:7px 8px calc(7px + env(safe-area-inset-bottom));
  background:rgba(5,9,12,.82);
  backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border-top:1px solid var(--trait)}
.as-onglets button{position:relative;font:inherit;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;gap:3px;
  padding:8px 4px 7px;border:0;border-radius:14px;background:none;
  color:var(--craie3);transition:color .18s ease,background .18s ease}
.as-onglets button i{font-style:normal;font-size:19px;line-height:1;
  filter:grayscale(1) opacity(.55);transition:filter .18s ease}
.as-onglets button span{font-size:10.5px;font-weight:750;letter-spacing:-.01em}
.as-onglets button.on{color:var(--menthe);background:rgba(61,226,166,.1)}
.as-onglets button.on i{filter:none}
.as-onglets button:active{transform:scale(.96)}
/* LA PASTILLE : le seul badge de l'ecran. Elle ne reclame rien — elle dit
   qu'il a deja travaille aujourd'hui, ce qui est une raison de revenir. */
.as-onglets u{position:absolute;top:4px;left:calc(50% + 7px);
  min-width:16px;height:16px;padding:0 4px;border-radius:9px;
  display:grid;place-items:center;text-decoration:none;
  font-size:10px;font-weight:900;color:#04150E;background:var(--menthe);
  box-shadow:0 2px 8px rgba(61,226,166,.4)}

/* ═══ LES DEUX ECRANS QUE LES ONGLETS OUVRENT ═══
   Ils defilent comme le fil, dans la meme gouttiere, avec la meme lumiere de
   fond : passer d'un onglet a l'autre ne doit pas donner l'impression de
   changer d'application. */
.as-vue{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;
  padding:14px clamp(14px,4vw,26px) 18px;
  display:flex;flex-direction:column;gap:11px;
  animation:asMonte .34s cubic-bezier(.22,1.1,.4,1) both}
/* CHAQUE BLOC GARDE SA HAUTEUR, ET C'EST INDISPENSABLE ICI.
   DEFAUT VU SUR LA CAPTURE : le planning etait ECRASE par le bloc suivant —
   « Votre journee avec Lea » coupe en deux, la liste des rendez-vous invisible,
   « Recommencer a zero » posee par-dessus. C'est le piege classique du
   conteneur flex en colonne : ses enfants se retrecissent par defaut, donc
   quand le contenu depasse la hauteur disponible, ils se compriment au lieu de
   faire defiler. Tant que les blocs etaient courts, ca ne se voyait pas. */
.as-vue > *{flex:none}
.as-fil[hidden],.as-bas[hidden]{display:none}

/* ═══════════════════════════════════════════════════════════════════════
   SES JOURNEES : UNE FORME D'ABORD, DES NOMBRES ENSUITE
   ═══════════════════════════════════════════════════════════════════════
   « L'UX est mauvaise, les resultats ne se voient pas assez, tout se
   ressemble. » Juste, et la cause n'etait pas graphique : six journees qui
   n'affichent que trois nombres du meme format SONT identiques. Et 168 vues,
   tout seul, ne veut rien dire — c'est beaucoup ou peu ?

   CE QU'UN CHIFFRE SEUL NE DIT PAS, UNE FORME LE DIT. Sept barres cote a cote,
   et sa semaine se lit en un coup d'oeil : le creux du lundi, le pic du
   vendredi. Rien a comparer de tete. */
.as-courbe{padding:15px 16px 16px;border-radius:19px;
  background:linear-gradient(155deg,rgba(61,226,166,.14),rgba(18,32,28,.74));
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
  border:1px solid rgba(61,226,166,.34)}
.as-barres{margin-top:14px;display:grid;grid-auto-flow:column;
  grid-auto-columns:1fr;gap:6px;align-items:end;height:132px}
.as-barre{display:flex;flex-direction:column;align-items:center;
  justify-content:flex-end;height:100%;gap:5px}
.as-barre b{font-size:11.5px;font-weight:800;color:var(--craie3);
  font-variant-numeric:tabular-nums;line-height:1}
.as-barre i{width:100%;max-width:30px;border-radius:6px 6px 3px 3px;
  background:rgba(126,230,192,.26);
  transition:height .45s cubic-bezier(.22,1.1,.4,1)}
.as-barre em{font-style:normal;font-size:10px;font-weight:700;
  color:var(--craie3);text-transform:capitalize}
/* LA PLUS HAUTE EST MARQUEE, et c'est la seule information qu'il retiendra
   vraiment de cet ecran : quel jour a marche. */
.as-barre.haut b{color:var(--menthe2);font-size:13px}
.as-barre.haut i{background:linear-gradient(180deg,var(--menthe2),var(--menthe));
  box-shadow:0 0 18px rgba(61,226,166,.45)}
.as-barre.haut em{color:var(--menthe2)}
.as-courbe-p{margin:14px 0 0;padding-top:12px;
  border-top:1px solid rgba(126,230,192,.18);
  display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--craie3)}
.as-courbe-p b{font-size:16px;font-weight:850;color:var(--craie);
  font-variant-numeric:tabular-nums}

/* UNE JOURNEE PASSEE : les vues en gros, le reste en petit, et ce qui a
   MARCHE ecrit en clair. Trois nombres egaux ne creent aucune hierarchie ;
   un gros et deux petits, si. */
.as-jour{padding:13px 15px 14px;border-radius:17px;
  background:rgba(18,32,28,.6);
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
  border:1px solid var(--trait)}
/* LE MEILLEUR JOUR NE SE DEVINE PAS, IL SE VOIT. Un lisere vert et un fond
   plus clair : c'est le seul jour de la liste qui ait le droit d'attirer
   l'oeil, et c'est celui qu'il veut refaire. */
.as-jour.meilleur{
  background:linear-gradient(160deg,rgba(61,226,166,.12),rgba(18,32,28,.7));
  border-color:rgba(61,226,166,.42);
  box-shadow:0 8px 26px rgba(61,226,166,.12)}
.as-jour-t{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.as-jour-t b{font-size:14px;font-weight:800;letter-spacing:-.02em}
.as-jour-t s{text-decoration:none;font-size:9px;font-weight:900;
  letter-spacing:.09em;text-transform:uppercase;padding:2px 7px;
  border-radius:6px;color:#04150E;background:var(--menthe)}
/* LE MARQUEUR « DEMO », JOURNEE PAR JOURNEE. Il doit pouvoir separer en une
   seconde ce qu'il a reellement fait de ce qu'on lui montre — sinon la premiere
   fois qu'il compare avec sa caisse, il ne croit plus rien de ce qu'on affiche. */
.as-jour-t i{font-style:normal;font-size:9px;font-weight:900;letter-spacing:.1em;
  text-transform:uppercase;padding:2px 6px;border-radius:6px;
  color:var(--or);background:rgba(240,180,41,.13);
  border:1px solid rgba(240,180,41,.3)}

/* LA HIERARCHIE : un gros nombre, deux petits. */
.as-jour-c2{margin-top:11px;display:flex;align-items:center;gap:14px}
.as-jour-v{flex:none;display:flex;align-items:baseline;gap:6px}
.as-jour-v b{font-size:30px;font-weight:900;letter-spacing:-.04em;line-height:1;
  font-variant-numeric:tabular-nums;color:var(--craie)}
.as-jour.meilleur .as-jour-v b{color:var(--menthe2)}
.as-jour-v em{font-style:normal;font-size:12px;font-weight:700;color:var(--craie3)}
.as-jour-p{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;
  gap:3px;font-size:11.5px;color:var(--craie3)}
.as-jour-p b{font-size:13px;font-weight:800;color:var(--craie2);
  font-variant-numeric:tabular-nums}
.as-jour-vide{margin:0;font-size:12.5px;font-style:italic;color:var(--craie3)}

/* CE QUI A MARCHE, EN CLAIR — la ligne qui distingue enfin un jour d'un autre,
   et la seule qu'il peut reutiliser demain. */
.as-phare{margin:11px 0 0;padding:8px 10px;border-radius:11px;
  display:flex;align-items:baseline;gap:7px;
  font-size:12.5px;line-height:1.35;color:var(--craie2);
  background:rgba(61,226,166,.09);border:1px solid rgba(61,226,166,.22)}
.as-phare span{flex:none;color:var(--menthe);font-weight:900}
.as-phare b{font-weight:800;color:var(--craie)}

.as-jour-l{list-style:none;margin:11px 0 0;padding:0;
  display:flex;flex-direction:column;gap:5px}
.as-jour-l li{display:flex;align-items:baseline;gap:7px;font-size:13px}
.as-jour-l li span{flex:none;font-size:12px}
.as-jour-l li b{font-weight:650;color:var(--craie2)}
.as-jour-l li em{margin-left:auto;font-style:normal;font-size:12px;
  font-weight:750;color:var(--craie3);font-variant-numeric:tabular-nums}
.as-rien{margin:0;padding:26px 4px;text-align:center;font-size:14px;
  line-height:1.5;color:var(--craie3)}

/* ═══ SON COMMERCE ═══ */
.as-fiche{padding:16px;border-radius:19px;
  background:rgba(18,32,28,.62);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(126,230,192,.16)}
.as-fiche-t b{display:block;font-size:19px;font-weight:900;letter-spacing:-.03em}
.as-fiche-t em{display:block;margin-top:2px;font-style:normal;font-size:13px;
  color:var(--menthe2);font-weight:700}
.as-fiche ul{list-style:none;margin:13px 0 0;padding:0;
  display:flex;flex-direction:column;gap:7px}
.as-fiche li{display:flex;align-items:center;gap:8px;font-size:13.5px;
  color:var(--craie2)}
.as-fiche li span{flex:none;font-size:12px}

/* CE QU'IL IGNORE LE PLUS SOUVENT : qu'il a des abonnes. C'est le meilleur
   argument du produit, et il n'etait ecrit nulle part hors d'un recu fugace. */
.as-abonnes{display:flex;align-items:center;gap:14px;
  padding:15px 16px;border-radius:19px;
  background:linear-gradient(150deg,rgba(185,140,255,.17),rgba(18,14,32,.8));
  border:1px solid rgba(185,140,255,.42)}
.as-abonnes>b{flex:none;font-size:32px;font-weight:900;letter-spacing:-.04em;
  color:var(--violet);font-variant-numeric:tabular-nums;line-height:1}
.as-abonnes>span{font-size:14px;font-weight:750;line-height:1.3}
.as-abonnes em{display:block;margin-top:4px;font-style:normal;font-size:12px;
  font-weight:600;color:var(--craie2);line-height:1.4}

/* ═══ LA VOIX DE LEA, ET C'EST SON CHOIX ═══
   Un seul bouton, qui dit son etat en clair et ce qu'il change. Pas un
   interrupteur muet a cote d'un mot : « Lea vous parle » / « Lea ecrit, elle
   ne parle pas » se lit sans apprendre. */
.as-voix{display:flex;align-items:flex-start;gap:13px;width:100%;text-align:left;
  font:inherit;cursor:pointer;padding:14px 15px;border-radius:19px;
  color:var(--craie);background:rgba(61,226,166,.1);
  border:1px solid rgba(61,226,166,.34)}
.as-voix.coupee{background:rgba(234,242,236,.05);border-color:var(--trait)}
.as-voix i{flex:none;font-style:normal;font-size:20px;line-height:1.1}
.as-voix b{display:block;font-size:14.5px;font-weight:800;letter-spacing:-.02em}
.as-voix em{display:block;margin-top:3px;font-style:normal;font-size:12px;
  line-height:1.4;color:var(--craie2)}
.as-voix:active{transform:scale(.99)}

/* ═══ LA SEMAINE, OU UN JOUR PRECIS ═══
   Sept colonnes a remplir avant que ca serve est le piege de tout planning :
   on ouvre donc sur la semaine. Le point vert dit quels jours ont deja leur
   propre journee — c'est la seule information qu'on ne peut pas deviner. */
.as-fil-j{display:flex;gap:5px;overflow-x:auto;margin-top:12px;
  padding-bottom:3px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.as-fil-j::-webkit-scrollbar{display:none}
.as-fil-j button{position:relative;flex:none;font:inherit;font-size:12px;
  font-weight:750;cursor:pointer;padding:7px 11px;border-radius:999px;
  color:var(--craie2);background:rgba(5,9,12,.42);border:1px solid var(--trait)}
.as-fil-j button.on{color:#04150E;background:var(--menthe);border-color:var(--menthe)}
.as-fil-j button.propre::after{content:"";position:absolute;top:4px;right:5px;
  width:5px;height:5px;border-radius:50%;background:var(--menthe)}
.as-fil-j button.on.propre::after{background:#04150E}
.as-fil-note{margin:9px 0 0;font-size:12px;line-height:1.4;color:var(--craie3)}

/* ═══════════════════════════════════════════════════════════════════════
   LE FIL DE SA JOURNEE
   ═══════════════════════════════════════════════════════════════════════
   « Il faut un planning clair accessible au commercant qu'on peut meme
   modifier s'il le veut. » Il se LIT d'abord, et il se regle ensuite : les
   heures sont a gauche en gros chiffres, ce qu'elles declenchent a cote. On
   doit comprendre sa journee en trois secondes sans rien toucher.

   ET IL SE REGLE SANS OUVRIR DE FENETRE. L'heure est un champ, l'interrupteur
   est a cote — pas d'ecran de reglages, pas de bouton « enregistrer ». Ce qu'on
   touche est ce qu'on lisait, comme dans la carte a valider. */
.as-fil{padding:15px 16px 16px;border-radius:19px;
  background:rgba(18,32,28,.62);
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  border:1px solid rgba(126,230,192,.16)}
.as-fil-t b{display:block;font-size:15.5px;font-weight:850;letter-spacing:-.02em}
.as-fil-t em{display:block;margin-top:4px;font-style:normal;font-size:12.5px;
  line-height:1.45;color:var(--craie2)}
.as-fil ul{list-style:none;margin:13px 0 0;padding:0;
  display:flex;flex-direction:column;gap:7px}
.as-fil li{display:flex;flex-direction:column;gap:7px;
  padding:9px 10px;border-radius:13px;background:rgba(5,9,12,.42);
  border:1px solid var(--trait)}
.as-fil-l{display:flex;align-items:center;gap:10px}
/* SA PHRASE EST LE CONTENU DE LA LIGNE, pas un reglage cache derriere un
   crayon. C'est ce que Lea DIRA : il doit le lire sans rien ouvrir, et le
   reecrire sans rien ouvrir non plus. */
.as-fil-q{width:100%;font:inherit;font-size:13px;line-height:1.4;resize:none;
  color:var(--craie);background:rgba(5,9,12,.55);
  border:1px solid var(--trait);border-radius:10px;padding:8px 10px}
.as-fil-q:focus{outline:none;border-color:rgba(126,230,192,.45)}
.as-fil-q::placeholder{color:var(--craie3)}
.as-fil-x{flex:none;width:26px;height:26px;border-radius:50%;font:inherit;
  font-size:11px;cursor:pointer;color:var(--rouge);background:transparent;
  border:1px solid rgba(255,107,107,.3)}
/* AJOUTER UN MOMENT A LUI. En pointilles : c'est une place vide qui attend,
   pas un bouton d'action de plus. */
.as-fil-plus{width:100%;margin-top:9px;font:inherit;font-size:13px;
  font-weight:750;cursor:pointer;padding:11px;border-radius:13px;
  color:var(--menthe2);background:transparent;
  border:1.5px dashed rgba(126,230,192,.32)}
.as-fil-plus:active{transform:scale(.985)}
/* CE QUI EST ETEINT RESTE LISIBLE, mais cesse de reclamer le regard : c'est un
   choix qu'il a fait, pas une erreur a corriger. */
.as-fil li.off{opacity:.42}
.as-fil-h{width:74px;flex:none;font:inherit;font-size:15px;font-weight:850;
  letter-spacing:-.02em;font-variant-numeric:tabular-nums;text-align:center;
  color:var(--menthe2);background:transparent;
  border:0;border-bottom:1.5px solid rgba(126,230,192,.3);
  border-radius:0;padding:2px 0}
.as-fil-h:focus{outline:none;border-bottom-color:var(--menthe)}
.as-fil-l>b{flex:1;min-width:0;font-size:13.5px;font-weight:750;
  line-height:1.3}
.as-fil-on{flex:none;width:30px;height:30px;border-radius:50%;font:inherit;
  font-size:13px;font-weight:900;cursor:pointer;
  color:var(--craie3);background:transparent;border:1px solid var(--trait)}
.as-fil-on.on{color:#04150E;background:var(--menthe);border-color:var(--menthe)}
.as-fil-on:active{transform:scale(.92)}

/* SES JOURS DE FERMETURE — la moitie la plus importante d'un planning, parce
   que c'est ce qu'on ne fait PAS. Un assistant qui parle le jour de fermeture
   est un assistant qu'on coupe. */
.as-off{margin-top:14px;padding-top:13px;border-top:1px solid var(--trait)}
.as-off>em{display:block;font-style:normal;font-size:11px;font-weight:850;
  letter-spacing:.1em;text-transform:uppercase;color:var(--craie3)}
.as-off>div{margin-top:9px;display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.as-off button{font:inherit;font-size:12px;font-weight:750;cursor:pointer;
  padding:8px 0;border-radius:10px;color:var(--craie2);
  background:rgba(5,9,12,.42);border:1px solid var(--trait)}
.as-off button.off{color:var(--violet);background:rgba(185,140,255,.14);
  border-color:rgba(185,140,255,.45)}
.as-off button:active{transform:scale(.94)}
.as-off>span{display:block;margin-top:9px;font-size:12px;line-height:1.4;
  color:var(--craie3)}

/* LE JOUR OU IL EST FERME, ET CA SE VOIT DES L'OUVERTURE. */
.as-repos{margin:0 clamp(14px,4vw,26px);padding:12px 14px;border-radius:15px;
  font-size:13px;line-height:1.45;color:var(--craie2);
  background:rgba(185,140,255,.1);border:1px solid rgba(185,140,255,.32)}

/* ═══ RECOMMENCER A ZERO ═══
   « Je n'ai plus la possibilite de recommencer a zero. » Il l'avait encore,
   mais ecrit en petit, souligne, coince au bout de la barre de demonstration
   derriere quatre autres boutons — autant dire nulle part. C'est pourtant le
   bouton le plus utilise de la demonstration, puisqu'il sert entre chaque
   commercant a qui l'on tend le telephone.

   IL A DONC SA PLACE A LUI, ET IL EST LE DERNIER DE L'ECRAN — la ou l'on finit
   toujours par descendre. Rouge, parce qu'il efface ; avec sa ligne
   d'explication, parce qu'un bouton qui efface doit dire ce qu'il efface. */
.as-zero{display:flex;align-items:center;gap:12px;margin-top:4px;
  padding:14px 15px;border-radius:17px;
  background:rgba(255,107,107,.07);
  border:1px solid rgba(255,107,107,.28)}
.as-zero>div{flex:1;min-width:0}
.as-zero b{display:block;font-size:14.5px;font-weight:800;letter-spacing:-.02em}
.as-zero em{display:block;margin-top:3px;font-style:normal;font-size:12px;
  line-height:1.4;color:var(--craie2)}
.as-zero button{flex:none;font:inherit;font-size:13px;font-weight:800;
  cursor:pointer;padding:10px 15px;border-radius:12px;
  color:#2A0A0A;background:var(--rouge);border:0;
  box-shadow:0 6px 18px rgba(255,107,107,.28)}
.as-zero button:active{transform:scale(.97)}
        `,
      }}
    />
  );
}

export default function Page() {
  return (
    <>
      <Styles />
      <Assistante />
    </>
  );
}
