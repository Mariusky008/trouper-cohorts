// LA PAGE D'ACCUEIL DES HABITANTS — d'après la maquette du propriétaire.
//
// « Oula, c'est beaucoup trop compliqué à comprendre, ça manque de simplicité !
// J'ai fait un mock-up que tu peux répliquer et animer. »
//
// LA MAQUETTE A RAISON CONTRE LA VERSION D'AVANT. Six chapitres qui démontraient
// chacun une chose vraie faisaient une page qu'il fallait LIRE ; celle-ci dit la
// même chose en quatre écrans et donne un objet à manipuler. Le raisonnement et
// le texte sont dans `histoire.tsx` ; ce fichier ne tient que l'enveloppe, les
// polices et la feuille de style.
//
// LA MARQUE EST CLIKME, ET « LE DIRECT » EST LE NOM D'UN ÉCRAN À L'INTÉRIEUR.
// L'adresse reste `/le-direct` parce qu'elle est partagée par lien à des
// testeurs ; rien d'autre ne porte ce mot en titre.
//
// NOINDEX, toujours : la maquette qu'elle annonce n'est pas le produit ouvert,
// et cette page ne doit pas devenir le premier résultat pour « clikme » tant
// qu'elle n'accueille pas de vrais commerçants.
import type { Metadata, Viewport } from "next";
import { Caveat } from "next/font/google";
import { MARQUE } from "@/lib/marque";
import { Histoire } from "./histoire";

/**
 * L'ÉCRITURE MANUSCRITE DES ANNOTATIONS.
 *
 * ELLE FAIT LA MOITIÉ DU TON DE LA MAQUETTE. Les quatre petites phrases en
 * travers — « Un swipe. Une envie. Une réponse. », « Votre fantôme vous
 * accompagne » — sont ce qui empêche la page de ressembler à une brochure. En
 * caractères d'imprimerie elles deviennent des légendes ; à la main, elles
 * deviennent quelqu'un qui vous montre son produit.
 *
 * ELLE EST SERVIE PAR LE SITE, PAS PAR GOOGLE : `next/font` la télécharge à la
 * compilation et la sert depuis notre domaine. Pas de requête vers un tiers au
 * chargement, et pas de saut de texte quand elle arrive.
 */
const caveat = Caveat({
  variable: "--ld-main",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0A18",
};

export const metadata: Metadata = {
  title: { absolute: `${MARQUE} — votre ville bouge, voyez ce qui se passe` },
  description:
    "Le Direct vous montre en temps réel ce qui est disponible autour de vous. Et vous pouvez l’essayer sur vous — une coupe, une tenue, des ongles, un tatouage — avant de vous déplacer.",
  robots: { index: false, follow: false },
  openGraph: {
    title: `${MARQUE} — votre ville bouge, voyez ce qui se passe`,
    description:
      "Voyez. Essayez. Décidez. Ce que les commerçants de votre ville proposent aujourd’hui, essayé sur votre photo avant de vous déplacer.",
    locale: "fr_FR",
    type: "website",
  },
};

/**
 * LA FEUILLE DE STYLE EST POSÉE ICI, comme sur `/autour-de-moi` : cette page ne
 * partage rien avec le reste du site, et un fichier global de plus pour un écran
 * serait une dette pour personne.
 *
 * ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Ce bloc
 * est un litteral de gabarit — un seul accent grave terminerait la chaine et
 * casserait la compilation. Le defaut a ete paye huit fois sur ce projet, et
 * `npm run verifier:styles` le mesure.
 */
function StylesLeDirect() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* ═══════════════════════════════════════════════════════════════════════
   LE VIOLET PREND LA PLACE DE LA MENTHE, ET C'EST LA MAQUETTE QUI TRANCHE.
   Le reste du produit est menthe sur noir ; cette page est violette sur
   blanc. L'ecart se defend : le violet EST la couleur de l'essai dans
   l'application — le bouton « Je reserve mon creneau », le fantome, la
   pastille du rendu — et l'essai est le sujet de cette page. Quelqu'un qui
   descend puis appuie arrive donc dans le meme monde, pas dans un autre.
   ATTENTION : jamais d'accent grave dans ces commentaires.
   ═══════════════════════════════════════════════════════════════════════ */
.ld{--violet:#7C5CFF;--violet2:#A78BFA;--violet3:#5B3FD9;
  --encre:#14122B;--encre2:#4B4A63;--encre3:#8B8AA3;
  --blanc:#FFFFFF;--gris:#F5F5FA;--trait:rgba(20,18,43,.1);
  --nuit:#0B0A18;--nuit2:#161431;
  background:var(--blanc);color:var(--encre);
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  min-height:100vh;overflow-x:hidden}
.ld *{box-sizing:border-box}
.ld h1,.ld h2{font-weight:800;letter-spacing:-.035em;line-height:1.06;
  margin:0;text-wrap:balance}

/* ── CE QUI APPARAIT EN ARRIVANT DESSUS ─────────────────────────────────
   Une seule regle pour toute la page, et un retard par element (--d) pour
   que les choses arrivent les unes apres les autres. Rien ne se rejoue. */
.ld [data-r]{opacity:0;transform:translate3d(0,16px,0);
  transition:opacity .6s cubic-bezier(.16,1,.3,1) var(--d,0ms),
             transform .6s cubic-bezier(.16,1,.3,1) var(--d,0ms)}
.ld [data-r].vu{opacity:1;transform:none}

/* ── L'ECRITURE A LA MAIN ───────────────────────────────────────────────
   Quatre petites phrases en travers, et elles font la moitie du ton. En
   caracteres d'imprimerie elles deviennent des legendes ; a la main, elles
   deviennent quelqu'un qui vous montre son produit.
   ELLES SONT DECORATIVES : aria-hidden partout, et elles disparaissent sur
   les ecrans etroits ou il n'y a pas de marge pour elles. */
.ld-main{font-family:var(--ld-main),'Bradley Hand','Segoe Script',cursive;
  font-size:clamp(17px,1.5vw,21px);line-height:1.3;color:var(--violet);
  margin:0;pointer-events:none}

/* ── LA BARRE ───────────────────────────────────────────────────────────
   Elle flotte sur l'ouverture sombre, puis devient blanche en descendant :
   une barre sombre sur une section blanche disparaitrait, et une barre
   blanche sur l'ouverture sombre ecraserait le titre. */
/* ELLE EST OPAQUE, ET C'EST UN ECART ASSUME A LA MAQUETTE. La maquette la
   pose transparente sur la photo de l'ouverture — c'est joli, et ca ne tient
   pas debout des qu'on descend : collee en haut, une barre translucide sombre
   passe sur les sections BLANCHES et devient une bande grise sale. Mesure
   faite, c'est exactement ce qu'on voyait. Soit elle est transparente et ne
   colle pas, soit elle colle et elle est opaque. Elle colle. */
.ld-nav{position:sticky;top:0;z-index:30;display:flex;align-items:center;
  justify-content:space-between;gap:16px;
  padding:14px clamp(16px,4vw,44px);
  background:var(--nuit);border-bottom:1px solid rgba(255,255,255,.08)}
.ld-marque{display:inline-flex;align-items:center;gap:9px;text-decoration:none;
  font-size:21px;font-weight:850;letter-spacing:-.04em;color:#fff}
.ld-marque b{color:var(--violet2);font-weight:850}
.ld-marque i{display:block;width:26px;height:26px;color:var(--violet)}
.ld-marque i svg{width:100%;height:100%;display:block}
.ld-marque.grand{font-size:30px;color:var(--encre)}
.ld-marque.grand b{color:var(--violet)}
.ld-nav-l{display:flex;align-items:center;gap:clamp(14px,2.4vw,30px)}
/* LES DEUX LIENS DISPARAISSENT SUR TELEPHONE, ET CE N'EST PAS DE LA PARESSE :
   mesure a 390 points, « Decouvrir » + « Comment ca marche » + le bouton ne
   tiennent pas, et c'est LE BOUTON qui sortait de l'ecran par la droite. Deux
   raccourcis vers des sections qu'on atteint en faisant defiler ne valent pas
   le seul geste que la page demande. */
/* « :not(.ld-cta) » N'EST PAS UNE PRECAUTION, C'EST UNE CORRECTION. Ecrite
   sans lui, la regle masquait AUSSI le bouton — un lien est un lien, et
   celui-la en est un. Resultat mesure a 390 points : la barre ne portait plus
   que le logo, et le seul geste que la page demande avait disparu de son
   endroit le plus visible. */
.ld-nav-l a:not(.ld-cta){display:none;text-decoration:none;font-size:14px;
  font-weight:650;color:rgba(255,255,255,.82)}
@media (min-width:720px){ .ld-nav-l a:not(.ld-cta){display:inline} }
.ld-nav-l a:not(.ld-cta):hover{color:#fff}

/* ── LE BOUTON ──────────────────────────────────────────────────────────
   Un seul dessin pour tous, et il ne change que de taille. Trois boutons
   de trois formes sur une page font trois promesses differentes. */
.ld-cta{display:inline-flex;align-items:center;gap:10px;text-decoration:none;
  font-size:15px;font-weight:750;color:#fff;border-radius:999px;
  padding:14px 26px;
  background:linear-gradient(120deg,var(--violet),var(--violet3));
  box-shadow:0 14px 34px -12px rgba(124,92,255,.75);
  transition:transform .16s ease,box-shadow .16s ease;white-space:nowrap}
.ld-cta s{text-decoration:none;font-size:15px;line-height:1;
  transition:transform .18s ease}
.ld-cta:hover{transform:translateY(-2px);box-shadow:0 20px 44px -14px rgba(124,92,255,.9)}
.ld-cta:hover s{transform:translateX(3px)}
.ld-cta:active{transform:scale(.98)}
.ld-cta:focus-visible{outline:2px solid var(--violet2);outline-offset:3px}
.ld-cta.grand{font-size:16.5px;padding:17px 34px}
.ld-cta.petit{font-size:13.5px;padding:10px 18px;
  background:transparent;color:#fff;box-shadow:none;
  border:1px solid rgba(255,255,255,.32)}
.ld-cta.petit:hover{background:rgba(255,255,255,.1);transform:none}
/* LE BOUTON CREUX — le second geste d'une section. Il est un lien souligne
   par sa bordure et non un bouton plein : deux boutons pleins de meme poids
   obligent a choisir, et on ne choisit pas, on referme. */
.ld-creux{display:inline-flex;align-items:center;gap:9px;text-decoration:none;
  font-size:14.5px;font-weight:700;color:var(--encre);
  border:1px solid var(--trait);border-radius:999px;padding:13px 24px;
  background:var(--blanc);transition:border-color .16s ease,transform .16s ease}
.ld-creux s{text-decoration:none;color:var(--violet);
  transition:transform .18s ease}
.ld-creux:hover{border-color:var(--violet);transform:translateY(-1px)}
.ld-creux:hover s{transform:translateX(3px)}

/* ── 1 · L'OUVERTURE ────────────────────────────────────────────────────
   PAS DE PHOTO DE VILLE, ET CE N'EST PAS UN OUBLI. Le depot n'en contient
   aucune qui respecte sa propre regle — ni enseigne lisible, ni visage. On
   pose donc une texture chaude, floutee et assombrie au point que rien n'y
   est identifiable, et le jour ou une photo de Dax arrive elle prend sa
   place en changeant une ligne. */
.ld-hero{position:relative;overflow:hidden;background:var(--nuit);
  padding:clamp(44px,7vh,80px) clamp(20px,5vw,44px) clamp(40px,6vh,70px)}
.ld-hero-fond{position:absolute;inset:0;
  background:
    radial-gradient(80% 70% at 78% 40%,rgba(124,92,255,.3),transparent 62%),
    radial-gradient(60% 60% at 12% 18%,rgba(255,168,90,.18),transparent 64%),
    url('/direct/terrasse-au-soleil.jpg') center/cover;
  filter:blur(2px) saturate(.85);opacity:.42}
.ld-hero::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(11,10,24,.72),rgba(11,10,24,.42) 40%,
    rgba(11,10,24,.9))}
.ld-hero-in{position:relative;z-index:2;max-width:1180px;margin:0 auto;
  display:grid;gap:clamp(26px,4vw,50px);align-items:center;
  grid-template-columns:1fr}
.ld-hero-mot{display:flex;flex-direction:column;align-items:flex-start;gap:18px}
.ld-oeil{margin:0;font-size:11px;font-weight:800;letter-spacing:.17em;
  text-transform:uppercase;color:rgba(255,255,255,.66)}
.ld-oeil.v{color:var(--violet)}
.ld-t1{font-size:clamp(36px,5.6vw,62px);color:#fff}
.ld-t1 span{display:block;color:var(--violet2)}
.ld-t2{font-size:clamp(28px,3.7vw,44px)}
.ld-t2 span{display:block;color:var(--violet)}
.ld-hero .ld-t2 span{color:var(--violet2)}
.ld-s{margin:0;font-size:clamp(15px,1.35vw,18px);line-height:1.6;
  color:rgba(255,255,255,.8);max-width:34ch}
.ld-s b{color:#fff;font-weight:700}
.ld-hero-b{display:flex;flex-wrap:wrap;align-items:center;gap:14px}
/* LE TELEPHONE EST INCLINE, COMME DANS LA MAQUETTE. Pose droit il a l'air
   d'une capture d'ecran ; incline de six degres il a l'air tenu. */
/* IL EST INCLINE ET PLUS PETIT QUE DANS LE RESTE DU PRODUIT. Pose droit il a
   l'air d'une capture d'ecran ; incline de cinq degres il a l'air tenu. Et a
   l'echelle de l'application il remplissait toute l'ouverture : ici il est une
   illustration a cote d'un titre, pas l'ecran principal. */
.ld-hero-tel{position:relative;display:flex;justify-content:center;
  transform:rotate(-5deg)}
.ld-hero-tel .ld-vitrine{margin:0}
.ld-hero-tel .ld-vt{--ld-vt-k:.58}
@media (min-width:900px){ .ld-hero-tel .ld-vt{--ld-vt-k:.66} }
.ld-main.a{position:absolute;right:-6px;top:8%;transform:rotate(-7deg);
  text-align:left;color:#fff;display:none}

/* ── LES SECTIONS CLAIRES, EN DEUX COLONNES ─────────────────────────────
   MEME GABARIT POUR LES DEUX, et la seconde inverse l'ordre. Deux mises en
   page differentes pour deux sections qui font la meme chose obligeraient a
   reapprendre a lire au milieu de la page. */
.ld-clair{background:var(--blanc);
  padding:clamp(52px,8vh,104px) clamp(20px,5vw,44px)}
.ld-clair.gris{background:var(--gris)}
.ld-deux{position:relative;max-width:1180px;margin:0 auto;display:grid;
  gap:clamp(26px,4vw,58px);align-items:center;grid-template-columns:1fr}
.ld-deux-d{display:flex;flex-direction:column;align-items:flex-start;gap:16px}
.ld-p{margin:0;font-size:clamp(15px,1.3vw,17px);line-height:1.65;
  color:var(--encre2);max-width:42ch}
.ld-deux-f{display:none}
.ld-main.b{text-align:right;transform:rotate(-6deg)}
.ld-main.c{position:absolute;right:0;bottom:14%;transform:rotate(-6deg);
  text-align:left;display:none;max-width:16ch}

/* ── 2 · LA SECTION QU'ON MANIPULE ──────────────────────────────────────
   « Quand section 2 on clique sur un metier on a un exemple anime. »
   Le panneau a gauche, la colonne des metiers au milieu : c'est la
   maquette, et c'est aussi la seule facon de faire comprendre ce produit
   sans l'expliquer — on donne un objet, pas un argumentaire. */
.ld-es{display:grid;gap:16px;grid-template-columns:1fr auto;align-items:center}
.ld-es-vue{border-radius:24px;overflow:hidden;background:var(--gris);
  box-shadow:0 28px 60px -34px rgba(20,18,43,.4),
    0 0 0 1px rgba(20,18,43,.07);
  animation:ldEntre .45s cubic-bezier(.16,1,.3,1) both}
@keyframes ldEntre{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
.ld-es-vue .ld-miroir{border-radius:0;border:0;box-shadow:none;aspect-ratio:4/5}
.ld-es-vue .ld-miroir-h{margin:0;max-width:none}
/* LA PIECE SEULE, QUAND ON N'A PAS DE PAIRE. On montre ce qu'on essaie, pas
   un resultat : poser la photo d'un mannequin sous l'etiquette « apres »
   serait exactement le mensonge que ce produit combat. */
.ld-es-p{position:relative;margin:0;aspect-ratio:4/5;overflow:hidden}
.ld-es-pi{width:100%;height:100%;object-fit:cover;display:block}
.ld-es-p figcaption{position:absolute;left:0;right:0;bottom:0;
  display:flex;flex-direction:column;gap:2px;padding:44px 16px 14px;
  background:linear-gradient(180deg,transparent,rgba(11,10,24,.88))}
.ld-es-chez{font-size:10.5px;font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;color:rgba(255,255,255,.62)}
.ld-es-p b{font-size:17px;font-weight:800;color:#fff}
.ld-es-p em{font-style:normal;font-size:15px;font-weight:800;color:var(--violet2)}
/* LA COLONNE DES METIERS. Une vignette et un mot : la vignette dit de quoi
   on parle avant qu'on ait lu le mot, et c'est elle qui donne envie
   d'appuyer. */
.ld-es-l{display:flex;flex-direction:column;gap:8px}
.ld-es-l button{display:flex;align-items:center;gap:11px;font-family:inherit;
  cursor:pointer;padding:5px 12px 5px 5px;border-radius:16px;
  border:1px solid transparent;background:transparent;color:var(--encre2);
  transition:background .16s ease,border-color .16s ease,color .16s ease}
.ld-es-l button span{font-family:var(--ld-main),'Bradley Hand',cursive;
  font-size:19px;font-weight:600;white-space:nowrap}
.ld-es-v{width:48px;height:60px;object-fit:cover;border-radius:11px;
  display:block;transition:transform .18s ease}
.ld-es-l button:hover{background:rgba(124,92,255,.07);color:var(--encre)}
.ld-es-l button.on{background:rgba(124,92,255,.11);
  border-color:rgba(124,92,255,.34);color:var(--violet3)}
.ld-es-l button.on .ld-es-v{transform:scale(1.06)}
.ld-es-l button:focus-visible{outline:2px solid var(--violet);outline-offset:2px}

/* ═══ LE TELEPHONE DESSINE ET LE MIROIR ═══════════════════════════════════
   REPRIS TELS QUELS DE LA VERSION PRECEDENTE. Ces deux objets sont les seuls
   que la maquette garde : le telephone incline de l'ouverture, et la
   glissiere avant/apres de la section 2. Leur raisonnement complet — pourquoi
   le cadre est dessine et non photographie, pourquoi le calque est masque et
   non retreci, pourquoi le facteur d'echelle est un nombre nu — est dans les
   commentaires ci-dessous, et chacun paie une faute deja commise. */

/* ON REDUIT LA CARTE, ON NE LA RETRECIT PAS — ET C'EST TOUTE LA DIFFERENCE.
   Premier jet : la carte remplissait le cadre, donc elle etait MISE EN PAGE
   pour 282 points de large. Resultat : « MENU DU J... », « LASAGNE▌ » coupe au
   bord, le prix a cheval sur la photo. On ne montrait pas le produit, on
   montrait le produit casse.
   LE CADRE CONTIENT DONC UN VRAI TELEPHONE DE 390x844, ET C'EST LUI QU'ON
   MET A L'ECHELLE. La carte se croit sur un iPhone, elle se met en page comme
   sur un iPhone, et on la regarde de plus loin. La variable ld-vt-k est ce
   recul, et c'est le CADRE qui se deduit d'elle, pas l'inverse.

   ELLE EST UN NOMBRE NU, ET IL A FALLU UN ECRAN PLAT POUR LE COMPRENDRE. Ecrite
   calc((min(300px,84vw) - 18px) / 390), elle vaut une LONGUEUR : une longueur
   divisee par un nombre reste une longueur. Plus bas on demande 844px fois
   cette valeur — px fois px n'existe pas, la hauteur devient invalide, et le
   telephone s'ecrase a quelques points de haut. CSS ne sait pas diviser une
   longueur par une longueur pour en tirer un nombre : le recul se choisit donc
   a la main, par palier. */
.ld-vt{--ld-vt-k:.723;
  position:relative;width:calc(390px * var(--ld-vt-k) + 18px);
  border-radius:42px;padding:9px;
  background:linear-gradient(160deg,#1B2630,#090D11 62%);
  box-shadow:0 50px 90px -40px rgba(0,0,0,.95),
    0 0 0 1px rgba(255,255,255,.09),
    inset 0 1px 0 rgba(255,255,255,.14);}
/* L'ENCOCHE A ETE RETIREE, ET CE N'EST PAS UN OUBLI. Posee au milieu du haut,
   elle tombait sur la premiere ligne de la carte — « MENU DU JOUR » avec un
   galet noir au milieu. Un ornement qui abime ce qu'il encadre coute plus
   qu'il ne rapporte : le bord arrondi et l'ombre suffisent a dire telephone.
   La regle reste declaree pour que le composant ne casse pas s'il la rend. */
.ld-vt-encoche{display:none;}
.ld-vt-ecran{position:relative;width:100%;height:calc(844px * var(--ld-vt-k));
  border-radius:34px;overflow:hidden;background:#05080B;}
/* LES CARTES SONT TOUTES EN PLACE, UNE SEULE EST VISIBLE. On ne demonte pas
   celles qui attendent : leurs photos restent chargees, donc le passage est
   instantane. Demonter rechargerait l'image a chaque tour, et le premier tour
   serait le seul beau. */
.ld-vt-c{position:absolute;top:0;left:0;width:390px;height:844px;
  transform-origin:top left;transform:scale(var(--ld-vt-k));
  display:flex;align-items:stretch;
  opacity:0;transition:opacity .62s ease;pointer-events:none;}
.ld-vt-c.on{opacity:1;}
.ld-vt-c .cd-carte{width:100%;max-width:none;aspect-ratio:auto;height:100%;
  border-radius:0;box-shadow:none;}

.ld-vitrine-p{display:flex;gap:7px;}
.ld-vitrine-p i{width:6px;height:6px;border-radius:50%;
  background:rgba(255,255,255,.2);transition:background .3s ease,width .3s ease;}
.ld-vitrine-p i.on{width:20px;border-radius:4px;background:var(--ld-menthe,#3DE2A6);}

/* LES TROIS RECULS. Sur un petit telephone le cadre doit laisser la marge de
   la page ; sur un ordinateur on a la place de s'approcher, et la vitrine est
   le seul objet que l'on vient regarder. */
@media (max-width:359px){ .ld-vt{--ld-vt-k:.62;} }
@media (min-width:900px){ .ld-vt{--ld-vt-k:.84;} }

@media (prefers-reduced-motion:reduce){
  .ld-vt-c{transition:none;}
}

.ld-gestes{position:relative;z-index:1;display:flex;flex-wrap:wrap;
  justify-content:center;gap:clamp(10px,2vw,26px);
  list-style:none;margin:clamp(34px,6vh,60px) auto 0;padding:0;max-width:940px}
.ld-gestes li{position:relative;flex:1 1 200px;max-width:270px;
  display:flex;flex-direction:column;align-items:center;gap:5px;
  text-align:center;padding:20px 16px;border-radius:20px;
  background:var(--nuit2);border:1px solid var(--trait)}
.ld-gestes i{font-style:normal;font-size:28px;line-height:1}
.ld-gestes b{font-size:17px;font-weight:850;letter-spacing:-.02em}
.ld-gestes em{font-style:normal;font-size:13px;line-height:1.4;color:var(--craie2)}
.ld-fleche{position:absolute;right:calc(-1 * clamp(10px,2vw,26px) / 2 - 8px);
  top:50%;transform:translateY(-50%);text-decoration:none;
  font-size:17px;color:var(--menthe);opacity:.8}


/* ── LE MIROIR : ON TIRE LE TRAIT, ON NE LIT PAS UNE LEGENDE ────────────
   Deux photos cote a cote laissent le lecteur chercher la difference ; une
   glissiere la lui fait produire. C'est le seul endroit de la page ou l'on
   touche quelque chose, et ce n'est pas un ornement : ce produit se joue. */
.ld-miroir-h{display:flex;justify-content:center;margin:0 auto;max-width:560px}
/* LE CADRE EST AU FORMAT DES PHOTOS, 4/3, ET NON CARRE. Recadrees en carre,
   les deux images perdaient la table basse par les cotes — c'est-a-dire
   l'endroit ou les bougies apparaissent. */
.ld-miroir{position:relative;width:100%;aspect-ratio:4/3;overflow:hidden;
  border-radius:22px;border:1px solid color-mix(in srgb,var(--ton) 30%,transparent);
  background:var(--nuit2);touch-action:pan-y;
  box-shadow:0 34px 70px -36px rgba(0,0,0,.9)}
.ld-mi-i{display:block;width:100%;height:100%;object-fit:cover}
/* LE « AVANT » EST DECOUPE, IL N'EST PAS RETRECI — ET LA NUANCE EST TOUT.
   Ecrit width:var(--x) avec overflow:hidden, le calque garde bien la bonne
   largeur, mais la photo dedans se met en page dans cette largeur-la : on
   comparerait un poignet comprime a un poignet normal, c'est-a-dire deux
   poignets differents, c'est-a-dire rien.
   clip-path laisse le calque a la taille du cadre et se contente de MASQUER
   ce qui depasse le trait. La photo ne bouge pas d'un pixel pendant qu'on
   tire, et les deux moitiés se raccordent exactement. */
.ld-mi-av{position:absolute;inset:0;
  clip-path:inset(0 calc(100% - var(--x)) 0 0)}
.ld-mi-av .ld-mi-i{width:100%;height:100%}

/* LE TRAIT, ET SA POIGNEE. Il ne recoit aucun appui : c'est la glissiere,
   dessous, qui les recoit tous. Sans ce mot, le trait volerait au doigt les
   appuis destines a la glissiere, precisement la ou l'on vise. */
.ld-mi-t{position:absolute;top:0;bottom:0;left:var(--x);width:2px;
  background:rgba(255,255,255,.9);pointer-events:none;z-index:3;
  box-shadow:0 0 0 1px rgba(0,0,0,.28)}
.ld-mi-t i{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:42px;height:42px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-style:normal;font-size:17px;color:#0A1210;
  background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.5)}
/* CHAQUE ETIQUETTE TIENT DANS SA MOITIE, ET C'EST UNE CORRECTION.
   Sans le plafond, « Les bougies de l'atelier » depassait vers la gauche et
   venait se poser sur « Votre salon » des que le trait passait au milieu :
   deux legendes superposees, illisibles toutes les deux. */
.ld-mi-e{position:absolute;bottom:12px;z-index:2;pointer-events:none;
  max-width:46%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  font-size:10.5px;font-weight:850;letter-spacing:.09em;text-transform:uppercase;
  color:#fff;background:rgba(5,9,12,.62);backdrop-filter:blur(6px);
  border-radius:999px;padding:6px 11px}
.ld-mi-e.a{left:12px}
.ld-mi-e.b{right:12px;color:var(--ton)}
/* LA GLISSIERE COUVRE TOUT LE CADRE ET NE SE VOIT PAS. C'est un vrai champ
   de formulaire : le clavier, la molette et les lecteurs d'ecran marchent
   sans une ligne de plus, ce qu'une glissiere ecrite a la main n'aurait pas
   donne. Son curseur natif est efface parce qu'on en dessine un autre. */
.ld-mi-r{position:absolute;inset:0;z-index:4;width:100%;height:100%;margin:0;
  appearance:none;background:transparent;cursor:ew-resize;opacity:0}
.ld-mi-r::-webkit-slider-thumb{appearance:none;width:44px;height:100%}
.ld-mi-r::-moz-range-thumb{width:44px;height:100%;border:0;background:transparent}
.ld-mi-r:focus-visible{outline:2px solid var(--ton);outline-offset:3px;opacity:1}


/* ── 3 · LE SALON ───────────────────────────────────────────────────────
   Une vraie capture dans le telephone dessine. La maquette y met une
   conversation redessinee ; on prefere celle qui existe, parce qu'une page
   qui redessine son produit en plus joli promet un ecran qui n'existe pas. */
/* LE TELEPHONE SE CALE A GAUCHE DE SA COLONNE SUR LES GRANDS ECRANS, et ce
   n'est pas un choix esthetique : l'annotation manuscrite se pose a droite, et
   centre, le telephone la recouvrait — mesure faite, cinquante points de
   chevauchement, deux textes l'un sur l'autre. */
.ld-sal{position:relative;display:flex;justify-content:center}
@media (min-width:900px){ .ld-sal{justify-content:flex-start} }
.ld-sal .ld-vt{transform:rotate(3deg)}
.ld-sal .ld-vt-ecran img{width:100%;height:100%;object-fit:cover;display:block}

/* ── 4 · LA BANDE SOMBRE ────────────────────────────────────────────────
   SON FOND A CHANGE, ET C'ETAIT UNE FAUTE DE REGLE. Il portait
   vitrine-du-soir.jpg — la devanture eclairee de LA COMMANDERIE, dont
   l'enseigne reste lisible sous six points de flou et trente pour cent
   d'opacite. Le LISEZ-MOI du depot l'ecarte nommement pour cette raison : une
   enseigne identifiable ferait passer un vrai commercant pour un client de
   ClikMe sans qu'il ait rien signe, et une page d'accueil est le pire endroit
   ou le faire. concert-kiosque.jpg ne montre que des silhouettes a
   contre-jour : ni visage reconnaissable, ni marque, et il dit mieux ce que
   cette bande raconte — une ville qui bouge le soir.
   Elle ferme la page comme l'ouverture l'a commencee, et elle porte la
   seule enumeration de la page — placee tout a la fin, apres trois
   demonstrations, parce qu'une liste posee avant une preuve se lit comme un
   catalogue. */
.ld-bande{position:relative;overflow:hidden;background:var(--nuit);
  padding:clamp(52px,8vh,100px) clamp(20px,5vw,44px)}
.ld-bande-fond{position:absolute;inset:0;
  background:
    radial-gradient(70% 80% at 80% 50%,rgba(124,92,255,.28),transparent 64%),
    url('/direct/concert-kiosque.jpg') center/cover;
  filter:blur(6px) saturate(.7);opacity:.3}
.ld-bande::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(11,10,24,.86),rgba(11,10,24,.7))}
.ld-bande-in{position:relative;z-index:2;max-width:1180px;margin:0 auto;
  display:flex;flex-direction:column;align-items:flex-start;gap:16px}
.ld-bande .ld-t2{color:#fff}
.ld-fam{display:flex;flex-wrap:wrap;gap:clamp(18px,3.4vw,44px);
  list-style:none;margin:clamp(16px,3vh,30px) 0 0;padding:0}
.ld-fam li{display:flex;flex-direction:column;align-items:center;gap:8px;
  min-width:64px}
.ld-fam i{font-style:normal;font-size:26px;line-height:1}
.ld-fam span{font-size:12.5px;font-weight:650;color:rgba(255,255,255,.74);
  white-space:nowrap}
.ld-bande-f{display:none}
.ld-main.d{text-align:right;transform:rotate(-5deg);color:#fff}

/* ── LE FANTOME, DESSINE ────────────────────────────────────────────────
   Il flotte lentement — sept secondes par tour — parce que c'est la seule
   chose qui bouge en continu sur cette page, et qu'au-dela on la sent. */
.ld-f3{display:block;width:clamp(76px,8vw,112px);
  filter:drop-shadow(0 18px 34px rgba(124,92,255,.55));
  animation:ldFlotteF 7s ease-in-out infinite}
.ld-f3 svg{width:100%;height:auto;display:block}
.ld-f3.petit{width:clamp(58px,6vw,84px)}
@keyframes ldFlotteF{
  0%,100%{transform:translateY(0) rotate(-2deg)}
  50%{transform:translateY(-11px) rotate(2deg)}
}

/* ── LE PIED ────────────────────────────────────────────────────────────
   Clair, centre, et il porte la derniere promesse : trois verbes, un
   bouton, et l'aveu que c'est une maquette. */
.ld-pied{position:relative;background:var(--gris);text-align:center;
  display:flex;flex-direction:column;align-items:center;gap:14px;
  padding:clamp(50px,8vh,96px) clamp(20px,5vw,44px) clamp(38px,6vh,64px)}
.ld-slogan{margin:6px 0 0;font-size:clamp(19px,2.6vw,30px);font-weight:850;
  letter-spacing:.1em;color:var(--encre)}
.ld-pied-s{margin:0;font-size:14.5px;color:var(--encre2)}
/* LES DEUX BADGES NE SONT NI DES LIENS NI DES BOUTONS, et c'est deliberé :
   il n'y a pas d'application a telecharger. Un badge de magasin qui ne mene
   nulle part est la promesse la plus concrete qu'une page puisse rompre. */
.ld-magasins{display:flex;flex-wrap:wrap;justify-content:center;gap:11px;
  margin:8px 0 4px}
.ld-mag{display:inline-flex;align-items:center;gap:9px;
  padding:9px 16px;border-radius:12px;background:var(--encre);
  color:#fff;opacity:.42;cursor:default}
.ld-mag i{font-style:normal;font-size:18px;line-height:1}
.ld-mag em{display:flex;flex-direction:column;font-style:normal;
  font-size:9px;letter-spacing:.04em;text-align:left;line-height:1.25}
.ld-mag b{font-size:13px;font-weight:750}
.ld-main.e{margin-top:10px;transform:rotate(-4deg)}
.ld-pied-n{margin:18px 0 0;max-width:58ch;font-size:11.5px;line-height:1.6;
  color:var(--encre3)}
.ld-pied-n b{color:var(--encre2);font-weight:700}

/* ── L'APPLICATION, PAR-DESSUS LA PAGE ──────────────────────────────────
   DEFAUT MESURE A L'USAGE : « quand je clique dessus je pars sur une autre
   page et je ne peux pas revenir facilement, et sur telephone on sait que si
   la personne part elle ne reviendra plus ». Elle se pose donc par-dessus,
   avec une seule chose en plus : fermer. */
.ld-essai{position:fixed;inset:0;z-index:80;background:var(--nuit);
  display:flex;flex-direction:column}
.ld-essai iframe{display:block;width:100%;height:100%;border:0}
.ld-essai-x{position:absolute;left:50%;transform:translateX(-50%);
  bottom:calc(14px + env(safe-area-inset-bottom));z-index:2;
  display:inline-flex;align-items:center;gap:7px;font-family:inherit;
  font-size:13.5px;font-weight:800;color:#fff;cursor:pointer;
  border-radius:999px;padding:11px 20px;border:1px solid rgba(255,255,255,.2);
  background:rgba(11,10,24,.86);
  -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.ld-essai-x i{font-style:normal;font-size:12px;line-height:1}
.ld-essai-x:active{transform:translateX(-50%) scale(.97)}

/* ── LES ECRANS LARGES ──────────────────────────────────────────────────
   TOUT CE QUI SUIT N'EXISTE QU'AU-DELA DE 900 POINTS : les deux colonnes,
   les annotations manuscrites et les fantomes. Sur un telephone il n'y a de
   place ni pour une seconde colonne ni pour une phrase en travers, et les
   entasser ferait exactement ce qu'on vient de corriger — une page trop
   chargee pour etre comprise. */
@media (min-width:900px){
  .ld-hero{padding-top:clamp(56px,9vh,110px)}
  .ld-hero-in{grid-template-columns:1.05fr .95fr}
  .ld-main.a{display:block}
  .ld-deux{grid-template-columns:1.05fr .95fr}
  .ld-deux.inverse .ld-deux-d{order:1}
  .ld-deux.inverse .ld-deux-g{order:2}
  .ld-main.c{display:block}
  /* LE FANTOME ET SON ANNOTATION SE POSENT DANS LA MARGE, sans pousser la
     mise en page : ils sont absolus, donc ils n'ont pas de hauteur. */
  .ld-deux-f{display:flex;align-items:center;gap:12px;
    position:absolute;right:0;top:-6px}
  .ld-bande-f{display:flex;align-items:center;gap:14px;
    position:absolute;right:0;bottom:6px}
  .ld-bande-in{position:relative;padding-right:clamp(200px,22vw,330px)}
}

/* LES METIERS PASSENT AU-DESSUS DU PANNEAU quand la largeur ne suffit plus :
   une colonne de cinq vignettes a cote d'une image de 4/5 rend les deux
   illisibles en dessous de 560 points. */
@media (max-width:559px){
  .ld-es{grid-template-columns:1fr;gap:12px}
  .ld-es-l{flex-direction:row;overflow-x:auto;gap:6px;
    scrollbar-width:none;padding-bottom:2px}
  .ld-es-l::-webkit-scrollbar{display:none}
  .ld-es-l button{flex:none;flex-direction:column;gap:6px;padding:6px}
  .ld-es-l button span{font-size:15px}
  .ld-es-v{width:58px;height:44px}
}

@media (prefers-reduced-motion:reduce){
  .ld [data-r]{opacity:1;transform:none;transition:none}
  .ld-f3,.ld-es-vue{animation:none}
  .ld-cta,.ld-creux{transition:none}
}
        `,
      }}
    />
  );
}

export default function LeDirectPage() {
  return (
    <main className={`ld ${caveat.variable}`}>
      <StylesLeDirect />
      <Histoire />
    </main>
  );
}
