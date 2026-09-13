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
/* ── LE VRAI LOGO, ET NON UNE GOUTTE DE CARTE DESSINEE A LA MAIN ────────
   « Le logo de ClikMe n'est pas le bon, il me semble. » Il ne l'etait pas :
   la barre portait un repere de carte violet suivi du mot « ClikMe » en
   caracteres de la page. Un repere de carte est le logo de tout le monde ;
   celui de ClikMe existe depuis le debut du depot — le mot en minuscules
   dont le K est une fleche de curseur verte, c'est-a-dire le clic qui donne
   son nom au produit.
   DEUX FICHIERS PARCE QU'IL Y A DEUX FONDS : lettres blanches sur la barre
   sombre, encre sur le pied clair, meme fleche verte dans les deux.
   SEULE LA LARGEUR EST IMPOSEE. Le fichier fait 800 sur 322 : une hauteur
   fixee en plus deformerait la fleche des que la police de la page change
   la hauteur de ligne autour. */
.ld-marque{display:inline-flex;align-items:center;text-decoration:none}
.ld-marque img{display:block;width:108px;height:auto}
@media (min-width:720px){ .ld-marque img{width:124px} }
.ld-marque.grand img{width:164px}
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
/* LE VERBE QUI PORTE TOUTE LA PAGE, ET IL EST DE SA MAIN : « et vous permet
   de l'ESSAYER virtuellement ». On peut voir ce qui se passe autour de soi
   dans dix applications ; on ne peut l'essayer nulle part. C'est donc le
   seul mot de l'ouverture qui change de couleur. */
.ld-s .ld-fort{color:var(--violet2);font-weight:850;text-transform:uppercase;
  letter-spacing:.05em}
.ld-hero-b{display:flex;flex-wrap:wrap;align-items:center;gap:14px}
/* LE TELEPHONE EST INCLINE, COMME DANS LA MAQUETTE. Pose droit il a l'air
   d'une capture d'ecran ; incline de six degres il a l'air tenu. */
/* IL EST INCLINE ET PLUS PETIT QUE DANS LE RESTE DU PRODUIT. Pose droit il a
   l'air d'une capture d'ecran ; incline de cinq degres il a l'air tenu. Et a
   l'echelle de l'application il remplissait toute l'ouverture : ici il est une
   illustration a cote d'un titre, pas l'ecran principal. */
.ld-hero-tel{position:relative;display:flex;justify-content:center;
  transform:rotate(-5deg)}
.ld-hero-tel .ld-vt{--ld-vt-k:.58}
@media (min-width:900px){ .ld-hero-tel .ld-vt{--ld-vt-k:.66} }
/* LE FANTOME OUVRE LA PAGE, et il regarde le telephone d'a cote — celui ou
   il se trouve, au milieu de la barre du bas. On le voit ici en grand, on
   le retrouve a sa place dans l'application, et on comprend sans legende
   sur quoi il faut appuyer. Il n'a pas de place sur un telephone : la
   colonne du titre y occupe toute la largeur. */
.ld-hero-f{display:none}
.ld-main.f{text-align:left;transform:rotate(-3deg);color:#fff}

/* ── L'OUVERTURE : DEUX ECRANS ET UN APPUI ──────────────────────────────
   « Le screenshot a cote, j'aurais aime plutot qu'il ait le fantome et la
   barre de menu du bas, pour montrer dans l'animation que lorsqu'on clique
   sur le fantome on peut essayer le produit. »
   LA POSITION DE L'ANNEAU EST MESUREE SUR LA CAPTURE, pas estimee : le
   bouton vert est a 50 pour cent de la largeur et 95,9 pour cent de la
   hauteur, et il fait 15,9 pour cent de large. En pourcentage, donc, et
   jamais en points : ce cadre change d'echelle trois fois selon la largeur
   de l'ecran, et un anneau pose en points glisserait a cote du fantome des
   le premier palier. */
.ld-ouv{position:relative;display:flex;justify-content:center}
.ld-ouv-i{display:block;width:100%;height:100%;object-fit:cover}
.ld-ouv-cible{position:absolute;left:50%;top:95.9%;z-index:3;
  width:21%;aspect-ratio:1;transform:translate(-50%,-50%);
  pointer-events:none}
.ld-ouv-cible i{position:absolute;inset:0;display:block;border-radius:50%}
/* DEUX OBJETS ET PAS UN SEUL. L'anneau qui bat en continu dit « c'est
   ici » ; le disque qui s'ecrase dit « on vient d'appuyer ». Un anneau
   seul se lit comme une decoration, et un appui seul arrive sans prevenir,
   donc on l'a manque.
   IL EST BLANC, ET IL L'A ETE APRES MESURE. Premier jet en menthe : pose
   sur le bouton du fantome, qui est un disque MENTHE, il devenait
   invisible — on voyait un halo un peu plus clair, et rien qui ressemble a
   un appui. Un reperage se dessine dans la couleur que l'ecran vise n'a
   pas. */
.ld-ouv-anneau{border:2.5px solid rgba(255,255,255,.96);
  box-shadow:0 0 0 4px rgba(6,20,14,.32),0 0 16px 2px rgba(255,255,255,.45);
  animation:ldCible 1.9s ease-out infinite}
.ld-ouv-appui{background:rgba(255,255,255,.62);opacity:0;transform:scale(.2)}
.ld-ouv-cible.tape .ld-ouv-anneau{animation:none;transform:scale(.78);
  box-shadow:0 0 0 14px rgba(255,255,255,0)}
.ld-ouv-cible.tape .ld-ouv-appui{animation:ldAppui .56s ease-out both}
@keyframes ldCible{
  0%{transform:scale(.86);opacity:.5}
  55%{transform:scale(1.1);opacity:1}
  100%{transform:scale(1.34);opacity:0}
}
@keyframes ldAppui{
  0%{opacity:.85;transform:scale(.2)}
  100%{opacity:0;transform:scale(1.35)}
}
/* LA FEUILLE D'ESSAI MONTE DU BAS, comme dans l'application, et elle est
   toujours montee dans le document : une image qu'on insere au moment ou
   elle doit glisser arrive en retard au premier tour — et le premier tour
   est le seul que beaucoup verront. */
.ld-ouv-feuille{position:absolute;inset:0;z-index:4;
  transform:translateY(100%);opacity:0;
  transition:transform .52s cubic-bezier(.16,1,.3,1),opacity .26s ease}
.ld-ouv-feuille.ouverte{transform:none;opacity:1}

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
/* LES TROIS RECULS. Sur un petit telephone le cadre doit laisser la marge de
   la page ; sur un ordinateur on a la place de s'approcher, et le telephone
   est le seul objet que l'on vient regarder. */
@media (max-width:359px){ .ld-vt{--ld-vt-k:.62;} }
@media (min-width:900px){ .ld-vt{--ld-vt-k:.84;} }

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


/* ═══ 3 · CE QUI SE PASSE APRES L'ESSAI ═══════════════════════════════════

   « Cette section est tres mal faite : on voit un screen ou les gens parlent
   comme s'ils etaient sur Instagram. L'idee ici c'est de montrer notre
   difference : lorsqu'on a essaye le produit on le note avec des fantomes de
   1 a 5, et ensuite on nous demande — voulez-vous en parler avec vos amis
   dans un salon prive pour recueillir leurs avis ? Et c'est a ce moment
   qu'on a la conversation qui apparait, ET SURTOUT AVEC LES OPTIONS DU
   SALON, qui est la possibilite de choisir autre chose et de reserver. »

   LA VERSION D'AVANT ETAIT UNE CAPTURE FIXE, et il a raison mot pour mot :
   une conversation posee la, sans ce qui l'a declenchee et sans ce qu'on
   peut en faire, ressemble a n'importe quel reseau social. Ce qui est unique
   n'est ni la note ni la conversation prises separement — c'est la CHAINE,
   et une chaine ne se montre pas avec la photo d'un de ses maillons.

   ═══ LE CHEMIN, ET LE FANTOME QUI LE PARCOURT ═══

   IL SE DEPLACE EN POURCENTAGE DE LA RANGEE, et jamais en points : les cinq
   etapes se partagent la largeur a parts egales, donc la n-ieme est centree
   a (n + 0,5) cinquiemes, quelle que soit la largeur de la colonne. */
.ld-ch{position:relative;width:100%;max-width:430px;margin-top:4px;
  padding-top:54px}
/* LA PASTILLE DERRIERE LUI N'EST PAS UN ORNEMENT. Il est blanc, le fond de
   cette section est gris tres clair, et pose tel quel on n'en voyait que les
   joues roses et la bouche — mesure faite. Le halo violet le detache, et il
   le fait lire comme un pion sur un plateau, ce qu'il est ici. */
.ld-ch-p{position:absolute;top:0;display:grid;place-items:center;
  width:48px;height:48px;
  left:calc((var(--i,0) + .5) * 20%);transform:translateX(-50%);
  transition:left .55s cubic-bezier(.34,1.56,.64,1)}
.ld-ch-p::before{content:'';position:absolute;inset:0;border-radius:50%;
  background:radial-gradient(circle,rgba(124,92,255,.26),rgba(124,92,255,0) 68%)}
/* LE POIDS DU SELECTEUR N'EST PAS UNE COQUETTERIE : le bloc du fantome est
   declare PLUS BAS dans cette feuille, et .ld-f{width:64px} l'emportait
   sur une classe de meme poids ecrite plus haut. Defaut mesure — les cinq
   fantomes de la note sortaient de leurs cases et se chevauchaient. */
.ld-f.ld-ch-f{position:relative;width:37px;
  filter:drop-shadow(0 1px .5px rgba(20,18,43,.3))
         drop-shadow(0 7px 12px rgba(124,92,255,.5))}
.ld-ch-l{display:flex;list-style:none;margin:0;padding:0}
.ld-ch-l li{position:relative;flex:1 1 0;min-width:0;display:flex;
  flex-direction:column;align-items:center;gap:5px;text-align:center}
/* LE TRAIT QUI RELIE LES ETAPES PASSE DERRIERE LES PASTILLES : c'est lui
   qui fait lire la rangee comme un chemin, et non comme cinq boutons. */
.ld-ch-l li::before{content:'';position:absolute;top:11px;left:-50%;
  width:100%;height:2px;background:var(--trait)}
.ld-ch-l li:first-child::before{display:none}
.ld-ch-l li i{position:relative;z-index:1;display:grid;place-items:center;
  width:22px;height:22px;border-radius:50%;font-style:normal;font-size:11px;
  font-weight:850;background:var(--blanc);color:var(--encre3);
  border:1.5px solid var(--trait);
  transition:background .3s ease,color .3s ease,transform .3s ease}
.ld-ch-l li span{font-size:11px;font-weight:700;line-height:1.2;
  color:var(--encre3)}
.ld-ch-l li.fait i{background:var(--violet2);border-color:var(--violet2);
  color:#fff}
.ld-ch-l li.fait span{color:var(--encre2)}
.ld-ch-l li.ici i{background:var(--violet);border-color:var(--violet);
  color:#fff;transform:scale(1.16)}
.ld-ch-l li.ici span{color:var(--violet3);font-weight:850}

/* ═══ LE TELEPHONE QUI JOUE LES TROIS DERNIERES ETAPES ═══
   MEME CADRE QUE PARTOUT AILLEURS, et son ecran contient un vrai telephone
   de 390 sur 844 mis a l'echelle : les deux ecrans se mettent donc en page
   comme sur un iPhone et on les regarde de plus loin. Ecrits a la taille du
   cadre, ils seraient mis en page pour 280 points et tout y serait coupe —
   la faute a deja ete payee sur cette page.
   IL SE CALE A GAUCHE DE SA COLONNE SUR LES GRANDS ECRANS : l'annotation
   manuscrite se pose a droite, et centre, le telephone la recouvrait. */
.ld-su{position:relative;display:flex;justify-content:center}
@media (min-width:900px){ .ld-su{justify-content:flex-start} }
.ld-su .ld-vt{transform:rotate(3deg)}
.ld-su .ld-vt-ecran{background:#0B1310}
.ld-su-e{position:absolute;top:0;left:0;width:390px;height:844px;
  transform-origin:top left;transform:scale(var(--ld-vt-k));
  display:flex;flex-direction:column;padding:20px 16px 18px;
  font-size:14px;color:#E8EFF6;opacity:0;pointer-events:none;
  transition:opacity .42s ease}
.ld-su-e.on{opacity:1}
.ld-su-h{margin:0 0 12px;font-size:12.5px;font-weight:750;color:#8FA8B8}
.ld-su-h i{font-style:normal}
.ld-su-h s{text-decoration:none;opacity:.5;margin:0 5px}
/* LE RENDU EST CARRE, ET LA PHOTO EST EN 4/3 : on la recadre par les cotes,
   la table reste entiere. Laissee en 4/3, elle occupait 268 points sur 844 et
   laissait un trou noir de la moitie de l'ecran sous la note — un telephone
   dont la moitie basse est vide se lit comme un ecran casse, pas comme un
   ecran calme. */
.ld-su-rendu{position:relative;margin:0;aspect-ratio:1;overflow:hidden;
  border-radius:18px}
.ld-su-rendu img{display:block;width:100%;height:100%;object-fit:cover}
.ld-su-rendu figcaption{position:absolute;left:10px;top:10px;
  font-size:10px;font-weight:850;letter-spacing:.1em;text-transform:uppercase;
  color:#fff;background:rgba(91,63,217,.88);border-radius:999px;
  padding:5px 11px}
.ld-su-piece{margin:16px 0 0;text-align:center;font-size:19px;font-weight:850;
  color:#fff}
.ld-su-piece em{font-style:normal;color:#FFC94A;margin-left:7px}
.ld-su-q{margin:20px 0 10px;text-align:center;font-size:14px;font-weight:800}
/* LES CINQ FANTOMES DE LA NOTE. Eteints ils sont gris et a demi
   transparents ; allumes ils reprennent leurs couleurs et grandissent. Ce
   sont exactement les deux etats de l'application. */
.ld-su-notes{display:flex;justify-content:center;gap:5px}
.ld-su-notes span{display:grid;place-items:center;width:44px;height:44px}
.ld-f.ld-su-n{width:34px}
.ld-su-n{opacity:.34;transition:opacity .22s ease,transform .22s ease}
.ld-su-n .ld-f-corps{fill:#4A5A68;filter:none}
.ld-su-n .ld-f-bras{fill:#4A5A68;filter:none}
.ld-su-n .ld-f-joue{opacity:0}
.ld-su-notes span.on .ld-su-n,.ld-su-mini span.on .ld-su-n{opacity:1;
  transform:scale(1.12)}
.ld-su-notes span.on .ld-su-n .ld-f-corps,
.ld-su-mini span.on .ld-su-n .ld-f-corps{fill:url(#ldfCorps)}
.ld-su-notes span.on .ld-su-n .ld-f-bras,
.ld-su-mini span.on .ld-su-n .ld-f-bras{fill:#CFE9DC}
.ld-su-notes span.on .ld-su-n .ld-f-joue,
.ld-su-mini span.on .ld-su-n .ld-f-joue{opacity:.55}
/* DIX FANTOMES QUI CLIGNENT ET BALANCENT LES BRAS, A TRENTE POINTS, NE SE
   VOIENT PAS ET COUTENT DIX FOIS. On les fige : a cette taille, seule la
   silhouette se lit. */
.ld-f.ld-su-n .ld-f-bras.g,.ld-f.ld-su-n .ld-f-bras.d,
.ld-f.ld-su-n .ld-f-oeil,.ld-f.ld-su-n .ld-f-ombre{animation:none}
.ld-f.ld-su-n .ld-f-ombre{display:none}
.ld-su-mot{display:block;margin-top:6px;text-align:center;font-style:normal;
  font-size:12.5px;font-weight:800;color:#9FB4C4;min-height:1.3em}
/* LES DEUX GESTES ORDINAIRES DE L'ECRAN DE RENDU. Ils sont la parce qu'ils y
   sont vraiment : « Demander a mes amis » arrive en TROISIEME dans
   l'application, pas en seul. Ils sont eteints — ce n'est pas eux qu'on
   raconte — mais les retirer aurait montre un ecran qui n'existe pas. */
.ld-su-deux{display:flex;gap:10px;margin-top:auto}
.ld-su-deux span{flex:1 1 0;display:grid;place-items:center;padding:14px 8px;
  border-radius:999px;font-size:15px;font-weight:850;color:#D8E4EE;
  border:1px solid rgba(255,255,255,.18)}
.ld-su-deux .ld-su-res2{color:#1A1040;border-color:transparent;
  background:linear-gradient(120deg,#9B7BFF,#C79BFF)}
/* « DEMANDER A MES AMIS » — le bouton de l'application, avec ses mots. Il
   n'arrive qu'apres la note : c'est la question qu'on pose une fois qu'on
   s'est vu avec, pas avant. */
.ld-su-demande{position:relative;display:flex;align-items:center;gap:11px;
  margin-top:10px;padding:13px 15px;border-radius:16px;color:#E5E0FF;
  background:rgba(139,125,246,.14);border:1px solid rgba(139,125,246,.4);
  opacity:0;transform:translateY(10px);
  transition:opacity .34s ease,transform .34s ease,background .2s ease}
.ld-su-demande.la{opacity:1;transform:none}
.ld-su-demande i{font-style:normal;font-size:19px;line-height:1}
.ld-su-demande b{display:block;font-size:15px;font-weight:850}
.ld-su-demande em{display:block;margin-top:2px;font-style:normal;font-size:12px;
  color:#B6AEE6}
.ld-su-demande.tape{background:rgba(139,125,246,.3);transform:scale(.985)}
.ld-su-appui{position:absolute;left:38px;top:50%;width:54px;height:54px;
  margin:-27px 0 0 -27px;border-radius:50%;opacity:0;transform:scale(.2);
  background:rgba(201,188,255,.5)}
.ld-su-demande.tape .ld-su-appui{animation:ldAppui .56s ease-out both}

/* ─── LE SALON ─── */
.ld-su-sh{display:flex;align-items:center;gap:10px;margin:0 0 12px;
  padding-bottom:11px;border-bottom:1px solid rgba(255,255,255,.1)}
.ld-su-sf{width:32px}
.ld-su-sh b{display:block;font-size:15px;font-weight:850;color:#fff}
.ld-su-sh em{display:block;margin-top:1px;font-style:normal;font-size:12px;
  color:#8FA8B8}
/* LA PIECE POSEE SUR LA TABLE DU SALON, ET C'EST ELLE QUI CHANGE quand une
   amie en propose une autre. Le changement EST l'argument : un salon ou
   tout le monde approuve n'est qu'un compteur de « j'aime » de plus. */
.ld-su-prop{display:flex;gap:11px;padding:10px;border-radius:16px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
  animation:ldProp .42s cubic-bezier(.16,1,.3,1) both}
.ld-su-prop.neuve{background:rgba(61,226,166,.1);
  border-color:rgba(61,226,166,.5)}
.ld-su-prop img{flex:none;width:74px;height:74px;border-radius:12px;
  object-fit:cover;display:block}
.ld-su-prop b{display:block;font-size:15px;font-weight:850;color:#fff}
.ld-su-prop > div > span{display:block;margin-top:2px;font-size:12.5px;
  color:#9FB4C4}
.ld-su-prop s{text-decoration:none;opacity:.5;margin:0 4px}
.ld-su-par{display:block;margin-bottom:3px;font-style:normal;font-size:10px;
  font-weight:850;letter-spacing:.09em;text-transform:uppercase;color:#3DE2A6}
.ld-su-mini{display:flex;gap:2px;margin:6px 0 0}
.ld-f.ld-su-mini-n,.ld-su-mini .ld-f.ld-su-n{width:19px}
@keyframes ldProp{from{opacity:0;transform:translateY(-8px) scale(.97)}
  to{opacity:1;transform:none}}
.ld-su-fil{flex:1;list-style:none;margin:12px 0 0;padding:0;display:flex;
  flex-direction:column;gap:11px}
.ld-su-fil li{display:flex;gap:9px;
  animation:ldDit .34s cubic-bezier(.16,1,.3,1) both}
.ld-su-fil i{flex:none;display:grid;place-items:center;width:30px;height:30px;
  border-radius:50%;font-style:normal;font-size:13px;font-weight:850;
  color:#0B1310;background:#8FD9BE}
.ld-su-fil b{display:block;font-size:12px;font-weight:800;color:#9FB4C4}
.ld-su-fil b s{text-decoration:none;margin-left:7px;font-weight:600;opacity:.7}
.ld-su-fil p{margin:3px 0 0;padding:9px 12px;border-radius:14px;
  border-top-left-radius:4px;font-size:14px;line-height:1.35;color:#E8EFF6;
  background:rgba(255,255,255,.07)}
@keyframes ldDit{from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:none}}
/* ─── LES OPTIONS DU SALON ───
   « Et surtout avec les options du salon, qui est la possibilite de choisir
   autre chose et de reserver. » Ce sont les deux boutons de l'application,
   avec ses mots. Elles n'arrivent qu'apres les messages, parce que c'est la
   qu'elles servent : proposer autre chose a personne ne veut rien dire, et
   c'est deja la regle dans l'application. */
.ld-su-opts{display:flex;flex-direction:column;gap:9px;margin-top:12px;
  opacity:0;transform:translateY(12px);
  transition:opacity .4s ease,transform .4s ease}
.ld-su-opts.la{opacity:1;transform:none}
.ld-su-opts button{display:flex;align-items:center;justify-content:center;
  gap:9px;width:100%;font-family:inherit;font-size:14.5px;font-weight:850;
  padding:13px 14px;border-radius:15px;cursor:default;color:#E8EFF6;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16)}
.ld-su-opts button em{font-style:normal;font-size:11.5px;font-weight:700;
  color:#8FA8B8}
.ld-su-opts button.ld-su-res{color:#04231A;border-color:transparent;
  background:linear-gradient(120deg,#3DE2A6,#17B685);opacity:.4;
  transition:opacity .4s ease,box-shadow .4s ease}
.ld-su-opts button.ld-su-res.la{opacity:1;
  box-shadow:0 14px 30px -12px rgba(61,226,166,.85)}
.ld-su-opts button.ld-su-res s{text-decoration:none}
/* LE BOUTON DE LA SECTION EST SOUS LES DEUX COLONNES ET CENTRE : pose dans
   la colonne du texte, il tombait a cote du chemin, et deux appels a
   l'action cote a cote sur la meme ligne se neutralisent. */
.ld-suite-b{display:flex;justify-content:center;margin:clamp(28px,4vw,46px) 0 0}

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

/* ── LE FANTOME ─────────────────────────────────────────────────────────
   « Le fantome doit etre plus present et au coeur des actions, donc
   vraiment utilise-le pour raconter l'histoire narrative et le chemin de A
   a Z. Et comme sur l'app, meme probleme, il est bizarrement coupe a
   droite. »

   CETTE PAGE DESSINAIT SON PROPRE FANTOME, et c'est la cause des deux
   reproches a la fois : un corps blanc, deux ellipses sombres, un arc pour
   la bouche. Soixante lignes de moins que celui de l'application, et
   surtout : pas de bras, pas de joues, pas d'ombre portee, pas de relief.
   Il ne pouvait donc rien faire d'autre que decorer une marge — on ne met
   pas au coeur de l'action quelqu'un qui n'a pas de bras.

   C'EST DESORMAIS CELUI DE L'APPLICATION, trace pour trace : voir
   fantome.tsx. Les encres sont les siennes AUSSI, joues roses comprises.
   Une autre palette ici aurait fait deux fantomes de deux familles, et
   c'est exactement ce qu'on cherche a eviter depuis le debut.

   ET IL N'EST PLUS ROGNE : ses bras depassaient la zone de dessin de six
   dixiemes de point de chaque cote, et un SVG rogne son propre cadre. Le
   cadre s'ouvre d'un point et demi dans fantome.tsx — meme correction,
   meme valeur, meme raison que dans l'application. */
/* LES ENCRES SONT POSEES UNE FOIS, DANS UN SVG DE TAILLE NULLE MAIS RENDU.
   Ni display:none ni visibility:hidden : un element retire de l'arbre de
   rendu ne fournit plus ses serveurs de peinture, et c'est precisement le
   defaut qu'on vient de corriger — tous les fantomes de la page etaient
   sans corps et sans yeux sur telephone. */
.ld-f-encres{position:absolute;width:0;height:0;overflow:hidden}
.ld-f{display:block;width:64px;height:auto;flex:none;overflow:visible}
.ld-f .ld-f-corps{fill:url(#ldfCorps);
  filter:drop-shadow(0 1.5px 1.6px rgba(4,40,26,.24))}
.ld-f .ld-f-creux{fill:url(#ldfCreux)}
.ld-f .ld-f-lueur{fill:url(#ldfLueur)}
.ld-f .ld-f-fil{fill:none;stroke:url(#ldfFil);stroke-width:1.3}
.ld-f .ld-f-ombre{fill:rgba(4,40,26,.22);transform-box:fill-box;
  transform-origin:50% 50%;animation:ldOmbre 4.6s ease-in-out infinite}
/* LES BRAS PENDENT, ILS NE SONT PAS EN CROIX. Un moignon horizontal fait
   une aile ; incline vers le bas, il fait un bras au repos — et c'est
   toute la difference entre un pictogramme et une peluche. */
.ld-f .ld-f-bras{fill:#CFE9DC;transform-box:fill-box;
  filter:drop-shadow(0 1px 1px rgba(4,40,26,.18))}
.ld-f .ld-f-bras.g{transform-origin:88% 50%;
  animation:ldBrasG 4.6s ease-in-out infinite}
.ld-f .ld-f-bras.d{transform-origin:12% 50%;
  animation:ldBrasD 4.6s ease-in-out infinite}
.ld-f .ld-f-joue{fill:#FF9DB4;opacity:.55}
.ld-f .ld-f-oeil{fill:url(#ldfOeil);transform-box:fill-box;
  transform-origin:50% 50%;animation:ldCligne 6.2s infinite}
.ld-f .ld-f-eclat{fill:#fff;opacity:.92}
.ld-f .ld-f-eclat2{fill:#fff;opacity:.5}
.ld-f .ld-f-bouche{fill:none;stroke:#07211A;stroke-width:2.1;
  stroke-linecap:round}
@keyframes ldOmbre{0%,100%{transform:scaleX(1);opacity:1}
  33%{transform:scaleX(.82);opacity:.6}
  66%{transform:scaleX(.92);opacity:.8}}
@keyframes ldBrasG{0%,100%{transform:rotate(17deg)}
  33%{transform:rotate(4deg)}66%{transform:rotate(24deg)}}
@keyframes ldBrasD{0%,100%{transform:rotate(-17deg)}
  33%{transform:rotate(-4deg)}66%{transform:rotate(-24deg)}}
@keyframes ldCligne{0%,95.5%,100%{transform:scaleY(1)}
  97%{transform:scaleY(.08)}98.5%{transform:scaleY(1)}}

/* LES CINQ ENDROITS OU IL PARAIT, ET IL EST LE MEME PARTOUT. Ils ne
   different que par la taille et par la couleur de la lueur qui l'entoure
   — menthe sur les fonds sombres, violette sur les clairs. Il flotte
   lentement, sept secondes par tour : c'est a peu pres la seule chose qui
   bouge en continu sur cette page, et au-dela on la sent. */
/* ═══ ILS NE FLOTTENT PLUS TOUS EN MEME TEMPS ═══════════════════════════

   « Tu peux faire varier un peu ses mouvements, animations, couleur ou
   position pour que ce ne soit pas toujours la meme chose. »

   IL AVAIT RAISON, ET LA CAUSE EST MESURABLE : les quatre partageaient la
   MEME duree — sept secondes — et le meme point de depart. Quatre
   personnages qui montent et descendent a l'unisson ne se lisent pas comme
   quatre personnages : ils se lisent comme un motif qui se repete, et c'est
   exactement l'impression qu'il decrit.

   TROIS CHOSES LES SEPARENT MAINTENANT, et aucune ne coute une ligne de
   JavaScript. Des DUREES premieres entre elles — 6,3 / 7,1 / 8,3 / 9,1 — qui
   ne se resynchronisent jamais ; un RETARD NEGATIF, qui les fait demarrer
   chacun a un endroit different de son cycle plutot qu'a zero ; et trois
   AMPLITUDES, parce qu'un gros fantome qui bouge autant qu'un petit a l'air
   plus lourd, pas plus grand.

   ET LE CLIGNEMENT EST DECALE AUSSI. Quatre paires d'yeux qui se ferment a
   la meme demi-seconde font un effet de robot ; decales, ils font quatre
   personnages qui ne se regardent pas. */
.ld-f-hero{width:clamp(56px,5vw,72px);
  filter:drop-shadow(0 14px 26px rgba(61,226,166,.42));
  animation:ldFlotteF 7.1s ease-in-out -1.3s infinite}
.ld-f-marge{width:clamp(76px,8vw,108px);
  filter:drop-shadow(0 18px 34px rgba(124,92,255,.42));
  animation:ldFlotteG 9.1s ease-in-out -4.2s infinite}
.ld-f-bande{width:clamp(58px,6vw,84px);
  filter:drop-shadow(0 18px 34px rgba(61,226,166,.36));
  animation:ldFlotteF 6.3s ease-in-out -2.6s infinite}
.ld-f-pied{width:clamp(50px,5vw,66px);
  filter:drop-shadow(0 14px 26px rgba(124,92,255,.34));
  animation:ldFlotteP 8.3s ease-in-out -.7s infinite}
.ld-f-hero .ld-f-oeil{animation-delay:-2.1s}
.ld-f-marge .ld-f-oeil{animation-delay:-4.4s}
.ld-f-bande .ld-f-oeil{animation-delay:-.9s}
.ld-f-pied .ld-f-oeil{animation-delay:-3.3s}
@keyframes ldFlotteF{
  0%,100%{transform:translateY(0) rotate(-2deg)}
  50%{transform:translateY(-11px) rotate(2deg)}
}
/* LE GRAND SE BALANCE PLUS QU'IL NE MONTE : a cent points, onze points de
   montee se voient comme un sursaut. */
@keyframes ldFlotteG{
  0%,100%{transform:translateY(0) rotate(-4deg)}
  50%{transform:translateY(-8px) rotate(3deg)}
}
/* ET LE PETIT DU PIED PENCHE LA TETE, sans presque monter : c'est le dernier
   de la page, il salue plus qu'il ne flotte. */
@keyframes ldFlotteP{
  0%,100%{transform:translateY(0) rotate(3deg)}
  35%{transform:translateY(-6px) rotate(-5deg)}
  70%{transform:translateY(-2px) rotate(4deg)}
}
.ld-pied-f{display:flex;flex-direction:column;align-items:center;gap:6px;
  margin-top:14px}

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
  .ld-hero-f{display:flex;align-items:center;gap:13px;margin-top:8px}
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

/* ── QUAND ON A DEMANDE QUE RIEN NE BOUGE ───────────────────────────────
   TOUT S'ARRETE, ET RIEN NE DISPARAIT. L'ouverture se fige sur la feuille
   d'essai et la section 3 sur sa derniere image — le choix est fait dans
   ouverture.tsx et suite.tsx, et il est le meme des deux cotes : on
   garde l'etat qui MONTRE, pas celui qui attend. */
@media (prefers-reduced-motion:reduce){
  .ld [data-r]{opacity:1;transform:none;transition:none}
  .ld-es-vue,.ld-su-prop,.ld-su-fil li{animation:none}
  .ld-f,.ld-f .ld-f-ombre,.ld-f .ld-f-bras,.ld-f .ld-f-oeil{animation:none}
  .ld-ouv-anneau{animation:none;opacity:.9}
  .ld-ouv-feuille,.ld-ch-f,.ld-su-e,.ld-su-demande,.ld-su-opts,
  .ld-su-opts button.ld-su-res,.ld-cta,.ld-creux{transition:none}
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
