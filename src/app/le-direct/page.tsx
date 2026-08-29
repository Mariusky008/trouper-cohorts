// LA PAGE D'ACCUEIL DES HABITANTS.
//
// CE QU'ELLE DOIT FAIRE, ET DANS CET ORDRE : dire de quelle application on
// parle, poser le titre — « le direct de votre ville » —, puis raconter quatre
// situations concrètes dans lesquelles quelqu'un se reconnaît, chacune en deux
// ou trois écrans, chacune se terminant par quelque chose qui n'existe nulle
// part ailleurs. La forme et le texte sont dans `histoire.tsx`, qui porte le
// raisonnement ; ce fichier ne tient que l'enveloppe et la feuille de style.
//
// LA VERSION D'AVANT RACONTAIT UNE BOUCLE ABSTRAITE — je regarde, je trouve,
// j'en parle, on décide — et le jugement de l'usage a été net : « les écrans
// que tu as mis sont hyper compliqués et il manque La Ville ». Une boucle ne
// se reconnaît pas ; une situation, si.
//
// NOINDEX, toujours : la maquette qu'elle annonce n'est pas le produit ouvert,
// et cette page ne doit pas devenir le premier résultat pour « clikme » tant
// que Le Direct n'accueille pas de vrais habitants. Une seule ligne à changer
// le jour où ça bascule.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { Histoire } from "./histoire";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Le direct de votre ville — ${MARQUE}` },
  description:
    "Ce qui se passe autour de vous, à l’instant où ça se passe. Vous le voyez, vous en parlez à vos amis, et vous décidez ensemble.",
  robots: { index: false, follow: false },
  openGraph: {
    title: `Le direct de votre ville — ${MARQUE}`,
    description:
      "On mange où ? Une place vient de se libérer. Un concert au kiosque. Ils cherchent quelqu’un. Vous voyez, vous en parlez, vous y allez.",
    locale: "fr_FR",
    type: "website",
  },
};

/**
 * LA FEUILLE DE STYLE EST POSÉE ICI, comme sur `/autour-de-moi` : cette page
 * ne partage rien avec le reste du site, et un fichier global de plus pour
 * deux écrans serait une dette pour personne.
 *
 * ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Ce bloc
 * est un littéral de gabarit — un seul accent grave terminerait la chaîne et
 * casserait la compilation. Le défaut a été payé sept fois sur ce projet, et
 * `npm run verifier:styles` le mesure.
 */
function StylesLeDirect() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* ═══════════════════════════════════════════════════════════════════════
   LE MONDE DE L'APPLICATION, PAS CELUI D'UNE PAGE DE VENTE.
   Le noir vert d'un ecran ouvert dans la rue, la menthe de ce qui est
   vivant, l'or d'une place qui se libere, le rose de ce que la ville
   organise, le bleu d'un poste. Quelqu'un qui descend cette page puis
   appuie sur le bouton doit arriver dans le meme endroit — sinon la page
   promet un produit et en livre un autre.
   ATTENTION : jamais d'accent grave dans ces commentaires.
   ═══════════════════════════════════════════════════════════════════════ */
.ld{--nuit:#05090C;--nuit2:#0A1210;--craie:#EAF2EC;--craie2:#93A79C;
  --craie3:#6C8078;--menthe:#3DE2A6;--menthe2:#0BA97B;--or:#F0B429;
  --rose:#F472B6;--bleu:#7DA8FF;--trait:rgba(234,242,236,.11);
  background:var(--nuit);color:var(--craie);
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  min-height:100vh;overflow-x:hidden}
.ld *{box-sizing:border-box}
.ld h1,.ld h2{font-family:Georgia,'Times New Roman',serif;font-weight:700;
  letter-spacing:-.03em;line-height:1.02;margin:0;text-wrap:balance}

/* ── CE QUI APPARAIT EN ARRIVANT DESSUS ─────────────────────────────────
   Une seule regle pour toute la page, et un retard par element (--d) pour
   que les choses arrivent les unes apres les autres au lieu de surgir
   ensemble. Rien ne se rejoue : la classe est posee une fois. */
.ld [data-r]{opacity:0;transform:translate3d(0,18px,0);
  transition:opacity .62s cubic-bezier(.16,1,.3,1) var(--d,0ms),
             transform .62s cubic-bezier(.16,1,.3,1) var(--d,0ms)}
.ld [data-r].vu{opacity:1;transform:none}

/* ── LA BARRE ───────────────────────────────────────────────────────── */
.ld-nav{position:sticky;top:0;z-index:20;display:flex;align-items:center;
  justify-content:space-between;gap:16px;
  padding:12px clamp(16px,4vw,40px);
  background:rgba(5,9,12,.72);border-bottom:1px solid var(--trait);
  -webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}
.ld-marque{display:inline-flex;align-items:center;gap:7px;
  font-size:18px;font-weight:850;letter-spacing:-.03em;color:#fff}
.ld-marque i{font-style:normal;font-size:15px;line-height:1;color:var(--menthe)}
.ld-marque.grand{font-size:26px}

/* ── LE BOUTON ──────────────────────────────────────────────────────── */
.ld-cta{display:inline-flex;align-items:center;gap:9px;text-decoration:none;
  font-size:15.5px;font-weight:850;color:#04150E;border-radius:14px;
  padding:14px 22px;background:linear-gradient(140deg,var(--menthe),var(--menthe2));
  box-shadow:0 16px 34px -16px rgba(18,185,129,.9);
  transition:transform .16s ease,box-shadow .16s ease}
.ld-cta:hover{transform:translateY(-2px);box-shadow:0 22px 44px -18px rgba(18,185,129,1)}
.ld-cta:active{transform:scale(.98)}
.ld-cta:focus-visible{outline:2px solid var(--menthe);outline-offset:3px}
.ld-cta.grand{font-size:17px;padding:17px 30px}
.ld-cta.petit{font-size:13.5px;padding:9px 16px;border-radius:11px}

/* ── L'OUVERTURE ────────────────────────────────────────────────────── */
.ld-hero{position:relative;overflow:hidden;
  padding:clamp(56px,11vh,120px) clamp(20px,5vw,48px) clamp(40px,7vh,80px)}
.ld-hero-mot{position:relative;z-index:1;max-width:900px;margin:0 auto;
  display:flex;flex-direction:column;align-items:center;gap:20px;
  text-align:center}
/* LES TROIS HALOS. Ils bougent lentement — vingt-deux secondes pour un
   tour — parce que c'est la seule animation qui tourne en continu sur
   cette page : au-dela, on la sent, et une page qui palpite fatigue. */
.ld-halo{position:absolute;inset:-20% -10% auto;height:120%;pointer-events:none;
  filter:blur(70px);opacity:.5}
.ld-halo i{position:absolute;display:block;border-radius:50%}
.ld-halo i:nth-child(1){width:44vw;height:44vw;left:4%;top:-6%;
  background:rgba(61,226,166,.34);animation:ldFlotte 22s ease-in-out infinite}
.ld-halo i:nth-child(2){width:36vw;height:36vw;right:2%;top:6%;
  background:rgba(125,168,255,.26);animation:ldFlotte 27s ease-in-out infinite reverse}
.ld-halo i:nth-child(3){width:30vw;height:30vw;left:38%;top:34%;
  background:rgba(244,114,182,.2);animation:ldFlotte 32s ease-in-out infinite}
@keyframes ldFlotte{
  0%,100%{transform:translate3d(0,0,0) scale(1)}
  50%{transform:translate3d(4%,6%,0) scale(1.12)}
}
.ld-oeil{margin:0;font-size:11px;font-weight:850;letter-spacing:.2em;
  text-transform:uppercase;color:var(--menthe)}
.ld-t1{font-size:clamp(40px,7.6vw,88px)}
.ld-t2{font-size:clamp(28px,4.4vw,52px)}
.ld-t2 span{display:block;color:var(--menthe)}
.ld-s{margin:0;font-size:clamp(15px,1.55vw,19px);line-height:1.6;
  color:var(--craie2);max-width:52ch}
.ld-s b{color:var(--craie);font-weight:700}
.ld-n{margin:0;font-size:12.5px;color:var(--craie3)}
.ld-hero-b{display:flex;flex-direction:column;align-items:center;gap:11px}

/* ── LES TROIS GESTES ───────────────────────────────────────────────── */
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

/* ── UNE SITUATION ──────────────────────────────────────────────────── */
.ld-cas{position:relative;padding:clamp(56px,9vh,110px) clamp(16px,4vw,48px);
  border-top:1px solid var(--trait)}
.ld-cas-h{max-width:760px;margin:0 auto;display:flex;flex-direction:column;
  align-items:center;gap:14px;text-align:center}
/* L'HEURE EN TETE DE CHAQUE CAS. C'est elle qui fait qu'on se reconnait :
   « 11 h 45 » se lit comme un moment de sa propre journee, « restauration »
   se lit comme une categorie. */
.ld-quand{display:inline-flex;align-items:center;gap:8px;margin:0;
  font-size:12px;font-weight:850;letter-spacing:.16em;text-transform:uppercase;
  color:var(--ton,var(--menthe));
  background:color-mix(in srgb,var(--ton,var(--menthe)) 13%,transparent);
  border:1px solid color-mix(in srgb,var(--ton,var(--menthe)) 34%,transparent);
  border-radius:999px;padding:7px 15px}
.ld-quand i{font-style:normal;font-size:9px;line-height:1;
  animation:ldBat 2.4s ease-in-out infinite}
@keyframes ldBat{0%,100%{opacity:1}50%{opacity:.3}}
.ld-cas.t-menthe{--ton:var(--menthe)}
.ld-cas.t-or{--ton:var(--or)}
.ld-cas.t-rose{--ton:var(--rose)}
.ld-cas.t-bleu{--ton:var(--bleu)}
.ld-cas.t-ville{--ton:var(--menthe)}
.ld-cas .ld-t2 span{color:var(--ton)}

/* ── LA BANDE DES ECRANS ────────────────────────────────────────────────
   Sur telephone, elle se fait defiler au doigt avec un arret sur chaque
   ecran : trois captures empilees verticalement font une page
   interminable. Au-dela, elles se rangent cote a cote et se lisent comme
   une bande dessinee — c'est exactement ce qu'elles sont. */
/* JUSTIFY-CONTENT: SAFE CENTER, ET C'EST LE CORRECTIF D'UN DEFAUT MESURE.
   Un conteneur qui defile et dont le contenu est centre deborde des DEUX
   cotes : le navigateur ouvre alors la page au milieu de la bande, et sur
   telephone on arrivait sur le DEUXIEME ecran — l'histoire commencait par
   son milieu. Vu sur la capture. Le mot-cle safe rend l'alignement au debut
   des que ca deborde, et garde le centrage quand tout tient. */
.ld-bande{display:flex;gap:clamp(14px,2.6vw,34px);justify-content:center;
  justify-content:safe center;
  align-items:flex-start;
  margin:clamp(30px,5vh,54px) auto 0;max-width:1180px;
  overflow-x:auto;scroll-snap-type:x mandatory;
  padding:0 max(0px,calc((100% - 1180px)/2)) 6px;
  scrollbar-width:none}
.ld-bande::-webkit-scrollbar{display:none}
.ld-ec{flex:0 0 auto;width:min(268px,64vw);margin:0;scroll-snap-align:center;
  display:flex;flex-direction:column;gap:14px}
.ld-tel{position:relative;border-radius:30px;padding:7px;
  background:linear-gradient(170deg,rgba(234,242,236,.17),rgba(234,242,236,.03));
  box-shadow:0 0 0 1px rgba(0,0,0,.7),0 40px 80px -34px rgba(0,0,0,.95);
  transition:transform .5s cubic-bezier(.16,1,.3,1)}
.ld-ec:hover .ld-tel{transform:translateY(-6px)}
.ld-img{display:block;width:100%;height:auto;border-radius:23px}
/* LE RANG DE L'ECRAN DANS L'HISTOIRE. Sans lui, trois captures cote a cote
   sont trois options ; avec lui, ce sont trois moments. */
.ld-rang{position:absolute;left:-9px;top:-9px;z-index:2;
  display:flex;align-items:center;justify-content:center;
  width:34px;height:34px;border-radius:50%;
  font-size:15px;font-weight:850;color:#04150E;
  background:var(--ton,var(--menthe));
  box-shadow:0 8px 20px -8px rgba(0,0,0,.9)}
.ld-dit{margin:0;font-size:14px;line-height:1.5;color:var(--craie2)}
/* LE DERNIER ECRAN D'UN CAS SE DISTINGUE, et c'est tout l'argument de la
   page : voir ce qui se passe, tout le monde le fait ; conclure, personne. */
.ld-ec.fin .ld-tel{box-shadow:0 0 0 1px rgba(0,0,0,.7),
  0 0 0 2px color-mix(in srgb,var(--ton,var(--menthe)) 70%,transparent),
  0 46px 90px -34px color-mix(in srgb,var(--ton,var(--menthe)) 55%,transparent)}
.ld-ec.fin .ld-dit{color:var(--craie)}
/* LA PASTILLE PREND SA LIGNE. En inline-flex, la legende repartait sur la
   meme ligne juste apres elle — « Decide en dix minutes Camille y est deja » —
   et les deux se lisaient comme une seule phrase. Vu sur la capture. */
.ld-fin-b{display:flex;width:fit-content;align-items:center;gap:6px;
  margin-bottom:8px;
  font-size:11.5px;font-weight:850;letter-spacing:.02em;
  color:color-mix(in srgb,var(--ton,var(--menthe)) 88%,white);
  background:color-mix(in srgb,var(--ton,var(--menthe)) 14%,transparent);
  border:1px solid color-mix(in srgb,var(--ton,var(--menthe)) 38%,transparent);
  border-radius:999px;padding:5px 11px}
.ld-fin-b i{font-style:normal;font-size:11px;line-height:1}
.ld-chute{max-width:660px;margin:clamp(26px,4vh,44px) auto 0;text-align:center;
  font-size:clamp(16px,1.9vw,22px);line-height:1.5;color:var(--craie);
  font-family:Georgia,'Times New Roman',serif;text-wrap:balance}

/* ── LA VILLE : UN ECRAN, ET CE QUI LE PROTEGE ──────────────────────── */
.ld-bande.une{align-items:center;overflow:visible;flex-wrap:wrap}
.ld-atouts{flex:1 1 320px;max-width:460px;list-style:none;margin:0;padding:0;
  display:flex;flex-direction:column;gap:10px}
.ld-atouts li{display:grid;grid-template-columns:30px 1fr;gap:12px;
  align-items:start;padding:14px 16px;border-radius:16px;
  background:var(--nuit2);border:1px solid var(--trait)}
.ld-atouts i{font-style:normal;font-size:19px;line-height:1.2}
.ld-atouts b{display:block;font-size:15px;font-weight:800;margin-bottom:2px}
.ld-atouts span{font-size:13.5px;line-height:1.45;color:var(--craie2)}

/* ── CE QUE CHAQUE CAS APPORTE ──────────────────────────────────────────
   Les captures montrent le mecanisme ; ces trois points disent ce qu'on y
   gagne. Sans eux, on comprend comment ca marche et on referme sans savoir
   pourquoi on l'installerait. */
.ld-atouts.cas{flex:none;max-width:940px;margin:clamp(26px,4vh,44px) auto 0;
  display:grid;grid-template-columns:repeat(auto-fit,minmax(258px,1fr));gap:12px}
.ld-atouts.cas li{border-color:color-mix(in srgb,var(--ton,var(--menthe)) 24%,transparent);
  background:color-mix(in srgb,var(--ton,var(--menthe)) 6%,var(--nuit2))}
.ld-atouts.cas b{color:#fff}
.ld-atouts.cas i{color:var(--ton,var(--menthe))}

/* ── L'ESSAI, PAR-DESSUS LA PAGE ────────────────────────────────────────
   DEFAUT MESURE A L'USAGE : « quand je clique dessus je pars sur une autre
   page et je ne peux pas revenir facilement, et sur telephone on sait que si
   la personne part elle ne reviendra plus ». Une page d'accueil dont le seul
   bouton est une porte sans poignee de retour depense en une seconde tout ce
   qu'elle a mis deux minutes a construire.
   L'application s'ouvre donc PAR-DESSUS, plein ecran, avec une seule chose en
   plus : un bouton pour fermer. On ferme, on est exactement la ou l'on
   s'etait arrete. */
.ld-essai{position:fixed;inset:0;z-index:80;background:#05090C;
  animation:ldEssai .22s ease both}
@keyframes ldEssai{from{opacity:0}to{opacity:1}}
.ld-essai iframe{display:block;width:100%;height:100%;border:0}
/* IL FLOTTE EN BAS, PAS EN HAUT. Le haut de l'application porte deja ses
   propres commandes, et un pouce ne monte pas jusqu'au coin oppose. La marge
   du bas evite la barre d'accueil des telephones sans bouton. */
.ld-essai-x{position:absolute;left:50%;transform:translateX(-50%);
  bottom:calc(14px + env(safe-area-inset-bottom));z-index:1;
  display:inline-flex;align-items:center;gap:7px;font:inherit;font-size:13.5px;
  font-weight:850;cursor:pointer;color:#04150E;border:0;border-radius:999px;
  padding:11px 20px;background:#EAF2EC;
  box-shadow:0 12px 30px -10px rgba(0,0,0,.9)}
.ld-essai-x i{font-style:normal;font-size:12px;line-height:1}
.ld-essai-x:active{transform:translateX(-50%) scale(.97)}

/* ── LES DEUX SALONS ────────────────────────────────────────────────────
   DEUX CARTES QUI NE SE RESSEMBLENT PAS, ET C'EST LE FOND DU SUJET. Si les
   deux salons se presentaient pareil, on ecrirait dans le mauvais. Celui de
   gauche porte la menthe de la conversation, celui de droite l'ambre de
   l'engagement — on les distingue avant d'avoir lu un mot. */
.ld-salons{position:relative;--ton:var(--or);
  padding:clamp(56px,9vh,110px) clamp(16px,4vw,48px);
  border-top:1px solid var(--trait);
  background:radial-gradient(80% 55% at 50% 0%,rgba(240,180,41,.07),transparent 62%)}
.ld-salons .ld-quand{--ton:var(--or)}

.ld-portes{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));
  gap:clamp(12px,2vw,22px);max-width:980px;
  margin:clamp(26px,4.5vh,46px) auto 0}
.ld-porte{display:flex;flex-direction:column;gap:11px;
  padding:clamp(18px,3vw,26px);border-radius:24px;
  border:1px solid var(--trait);background:var(--nuit2)}
.ld-porte.prive{--ton:var(--menthe);
  background:linear-gradient(170deg,rgba(61,226,166,.07),var(--nuit2) 62%);
  border-color:color-mix(in srgb,var(--menthe) 26%,transparent)}
.ld-porte.public{--ton:var(--or);
  background:linear-gradient(170deg,rgba(240,180,41,.08),var(--nuit2) 62%);
  border-color:color-mix(in srgb,var(--or) 30%,transparent)}

/* L'ETIQUETTE PORTE LE MOT DU BOUTON *ET* L'ENDROIT OU ON LE TROUVE. Les
   deux portes ne sont jamais au meme endroit sur l'annonce, et c'est la
   seule chose qui empeche de se tromper de salon : ca s'ecrit, ca ne se
   devine pas. */
.ld-porte-e{margin:0;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.ld-porte-e b{display:inline-flex;align-items:center;gap:7px;
  font-size:13px;font-weight:850;letter-spacing:.04em;color:var(--ton);
  background:color-mix(in srgb,var(--ton) 14%,transparent);
  border:1px solid color-mix(in srgb,var(--ton) 36%,transparent);
  border-radius:999px;padding:6px 13px}
.ld-porte-e em{font-style:normal;font-size:12px;color:var(--craie3)}
/* « BIENTOT » N'EST PAS UNE PRECAUTION DE STYLE : cette page ouvre
   l'application juste a cote, et le salon public n'y est pas encore. Sans ce
   mot, on envoie quelqu'un chercher un bouton qui n'existe pas. */
.ld-porte-e s{margin-left:auto;text-decoration:none;font-size:11px;
  font-weight:800;letter-spacing:.1em;text-transform:uppercase;
  color:var(--craie3);border:1px dashed var(--trait);
  border-radius:999px;padding:4px 10px}
.ld-porte h3{margin:0;font-family:Georgia,'Times New Roman',serif;
  font-size:clamp(21px,2.6vw,29px);font-weight:800;line-height:1.12;
  letter-spacing:-.02em;color:var(--craie)}
.ld-porte-p{margin:0;font-size:14.5px;line-height:1.55;color:var(--craie2)}
.ld-porte-p b{color:var(--craie);font-weight:750}
/* QUI PEUT ME LIRE — EN PERMANENCE, PAS UNE FOIS. Le vrai danger de deux
   salons n'est pas de se tromper de bouton, c'est de confier a des inconnus
   ce qu'on croyait dire a ses amis. */
.ld-porte-q{margin:auto 0 0;display:flex;align-items:center;gap:8px;
  font-size:12.5px;color:var(--craie3);
  border-top:1px solid var(--trait);padding-top:12px}
.ld-porte-q i{font-style:normal;font-size:13px;line-height:1}

/* ── LE FIL, DU COTE PRIVE ──────────────────────────────────────────────
   Meme boite que la jauge — meme fond, meme rayon, meme retrait — et la
   menthe a la place de l'or. Les deux cartes portent ainsi un objet de meme
   poids : ce qui les separe est la couleur et l'enjeu, pas la quantite. */
.ld-fil{display:flex;flex-direction:column;gap:9px;
  padding:15px 16px;border-radius:18px;background:rgba(5,9,12,.55);
  border:1px solid color-mix(in srgb,var(--menthe) 24%,transparent)}
.ld-f-q{margin:0;font-size:12.5px;color:var(--craie3)}
.ld-f-l{list-style:none;margin:0;padding:0;display:flex;
  flex-direction:column;gap:6px}
.ld-f-l li{align-self:flex-start;max-width:88%;
  font-size:12.5px;line-height:1.4;color:var(--craie2);
  padding:8px 11px;border-radius:13px 13px 13px 4px;
  background:rgba(234,242,236,.06)}
.ld-f-l li.moi{align-self:flex-end;color:var(--craie);
  border-radius:13px 13px 4px 13px;
  background:color-mix(in srgb,var(--menthe) 15%,transparent)}
.ld-f-l b{display:block;font-size:11px;font-weight:800;letter-spacing:.02em;
  color:var(--menthe);margin-bottom:2px}
/* LA CONCLUSION N'EST PAS UNE BULLE. C'est ce que le salon a PRODUIT, et une
   bulle de plus la ferait lire comme une phrase de quelqu'un. */
.ld-f-c{margin:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  font-size:12.5px;font-weight:750;color:var(--craie);
  padding:9px 12px;border-radius:13px;
  background:color-mix(in srgb,var(--menthe) 11%,transparent);
  border:1px solid color-mix(in srgb,var(--menthe) 30%,transparent)}
.ld-f-c i{font-style:normal;font-size:13px;line-height:1}
.ld-f-c s{text-decoration:none;font-weight:400;font-size:11.5px;
  color:var(--craie3)}

/* ── LA JAUGE ───────────────────────────────────────────────────────────
   LE SEUL OBJET NOUVEAU DU PRODUIT, ET LE MEME PARTOUT : « 7 sur 10 » chez
   le vendeur de pantalons, « 9 sur 12 » chez le boulanger qui allumera son
   four. Meme forme, meme place — on en apprend UN, on le retrouve dans
   toute la ville. */
.ld-jauge{display:flex;flex-direction:column;gap:9px;
  padding:15px 16px;border-radius:18px;background:rgba(5,9,12,.55);
  border:1px solid color-mix(in srgb,var(--or) 28%,transparent)}
.ld-j-q{margin:0;font-size:12.5px;color:var(--craie3)}
.ld-pts{display:flex;gap:5px}
.ld-pts i{flex:1;height:9px;border-radius:99px;background:rgba(234,242,236,.12)}
.ld-pts i.pris{background:var(--or)}
.ld-j-n{margin:0;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
/* Les deux chiffres occupent la MEME place : l'un s'efface, l'autre arrive,
   et le bloc ne bouge pas d'un pixel. Le gabarit est reserve a la largeur du
   PLUS LARGE des deux — sans lui, « sur 10 » se colle au chiffre et se fait
   recouvrir a la bascule. */
.ld-j-g{position:relative;display:inline-block;min-width:2.4ch;height:29px}
.ld-j-n b{position:absolute;left:0;top:0;
  font-family:Georgia,'Times New Roman',serif;font-size:29px;font-weight:800;
  line-height:1;color:var(--or)}
.ld-j-n .ap{opacity:0}
.ld-j-n em{font-style:normal;font-size:12.5px;color:var(--craie3)}
.ld-j-n s{margin-left:auto;text-decoration:none;font-size:14px;
  color:var(--craie3)}
.ld-j-n u{text-decoration:none;font-family:Georgia,'Times New Roman',serif;
  font-size:23px;font-weight:800;color:var(--menthe);opacity:0}
.ld-j-x{position:relative;margin:0;min-height:2.6em;
  font-size:12.5px;line-height:1.45;color:var(--craie2)}
.ld-j-x span{display:block}
.ld-j-x .ap{position:absolute;left:0;top:0;opacity:0;
  color:var(--menthe);font-weight:700}

/* ELLE SE REMPLIT EN ARRIVANT A L'ECRAN, pas au chargement : une jauge deja
   pleine quand on la decouvre montre un resultat, pas un mecanisme. La
   classe « vu » est posee par l'observateur de la page, une seule fois. */
.ld-porte.public.vu .ld-pts i.libre{animation:ldPrend .45s ease-out both}
.ld-porte.public.vu .ld-pts i.l1{animation-delay:.55s}
.ld-porte.public.vu .ld-pts i.l2{animation-delay:.9s}
.ld-porte.public.vu .ld-pts i.l3{animation-delay:1.25s}
.ld-porte.public.vu .ld-j-n .av{animation:ldPart .3s ease-out 1.6s both}
.ld-porte.public.vu .ld-j-n .ap{animation:ldVient .3s ease-out 1.7s both}
.ld-porte.public.vu .ld-j-n u{animation:ldVient .4s ease-out 1.9s both}
.ld-porte.public.vu .ld-j-n s{animation:ldBarre .4s ease-out 1.9s both}
.ld-porte.public.vu .ld-j-x .av{animation:ldPart .3s ease-out 2s both}
.ld-porte.public.vu .ld-j-x .ap{animation:ldVient .35s ease-out 2.15s both}
@keyframes ldPrend{from{background:rgba(234,242,236,.12);transform:scaleY(.55)}
  to{background:var(--or);transform:scaleY(1)}}
@keyframes ldPart{to{opacity:0;transform:translateY(-6px)}}
@keyframes ldVient{from{opacity:0;transform:translateY(7px)}
  to{opacity:1;transform:none}}
@keyframes ldBarre{to{text-decoration:line-through;opacity:.55}}

/* LA MEME JAUGE NE SERT PAS QU'A FAIRE BAISSER UN PRIX. Ce qui est en jeu
   change de metier en metier ; la forme, jamais. */
.ld-seuils{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
  gap:10px;list-style:none;padding:0;max-width:980px;
  margin:clamp(14px,2.4vh,24px) auto 0}
.ld-seuils li{display:flex;flex-direction:column;gap:4px;
  padding:15px 16px;border-radius:16px;
  background:var(--nuit2);border:1px solid var(--trait)}
.ld-seuils b{font-family:Georgia,'Times New Roman',serif;font-size:21px;
  font-weight:800;line-height:1;color:var(--or)}
.ld-seuils em{font-style:normal;font-size:12.5px;line-height:1.45;
  color:var(--craie2)}

@media(max-width:560px){
  .ld-portes{grid-template-columns:1fr}
  .ld-porte h3{font-size:21px}
}

/* ── LA DIFFERENCE, APRES QUATRE DEMONSTRATIONS ─────────────────────── */
.ld-final{display:flex;flex-direction:column;align-items:center;gap:18px;
  text-align:center;border-top:1px solid var(--trait);
  padding:clamp(64px,11vh,130px) clamp(20px,5vw,48px) clamp(70px,12vh,140px);
  background:radial-gradient(90% 60% at 50% 0%,rgba(61,226,166,.1),transparent 64%)}
.ld-preuves{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));
  gap:12px;list-style:none;margin:clamp(16px,3vh,30px) 0 8px;padding:0;
  width:100%;max-width:960px}
.ld-preuves li{display:flex;flex-direction:column;align-items:center;gap:6px;
  padding:22px 16px;border-radius:20px;text-align:center;
  background:var(--nuit2);border:1px solid var(--trait)}
.ld-preuves i{font-style:normal;font-size:26px;line-height:1}
.ld-preuves b{font-size:15px;font-weight:850;letter-spacing:-.01em;line-height:1.25}
.ld-preuves em{font-style:normal;font-size:12.5px;line-height:1.4;color:var(--craie2)}

/* ── LE PIED DE PAGE ────────────────────────────────────────────────── */
.ld-pied{border-top:1px solid var(--trait);background:#03070A;
  padding:clamp(38px,6vh,64px) clamp(20px,5vw,48px);
  display:flex;flex-wrap:wrap;gap:22px 40px;align-items:flex-start;
  justify-content:space-between;max-width:1180px;margin:0 auto}
.ld-pied-h{display:flex;flex-direction:column;gap:5px}
.ld-pied-h p{margin:0;font-size:14px;color:var(--craie2)}
.ld-pied-l{display:flex;flex-direction:column;gap:9px}
.ld-pied-l a{font-size:14px;font-weight:600;color:var(--craie2);
  text-decoration:none;transition:color .16s ease}
.ld-pied-l a:hover{color:var(--menthe)}
.ld-pied-n{flex:1 1 100%;margin:0;font-size:11.5px;line-height:1.5;
  color:var(--craie3);border-top:1px solid var(--trait);padding-top:18px}

/* ── LES ECRANS ETROITS ─────────────────────────────────────────────── */
@media (max-width:760px){
  .ld-bande{padding-left:max(16px,calc(50% - 134px));
    padding-right:max(16px,calc(50% - 134px))}
  .ld-bande.une{padding-left:16px;padding-right:16px}
  .ld-gestes li{flex:1 1 100%;max-width:none;flex-direction:row;
    align-items:center;text-align:left;gap:13px;padding:14px 16px}
  .ld-gestes i{font-size:22px}
  .ld-gestes b{flex:none}
  .ld-gestes em{flex:1}
  .ld-fleche{display:none}
  .ld-halo{filter:blur(52px);opacity:.42}
}

@media (prefers-reduced-motion:reduce){
  .ld [data-r]{transition:none}
  .ld-cta,.ld-tel{transition:none}
  .ld-halo i,.ld-quand i{animation:none}
  /* LE MOUVEMENT DE LA JAUGE EST UN CONFORT, PAS L'INFORMATION : sans lui
     elle est simplement montree pleine, prix tombe. Rien ne manque. */
  .ld-porte.public.vu .ld-pts i,.ld-porte.public.vu .ld-j-n b,
  .ld-porte.public.vu .ld-j-n u,.ld-porte.public.vu .ld-j-n s,
  .ld-porte.public.vu .ld-j-x span{animation:none}
  .ld-pts i.libre{background:var(--or)}
  .ld-j-n .av,.ld-j-x .av{opacity:0}
  .ld-j-n .ap,.ld-j-x .ap,.ld-j-n u{opacity:1}
  .ld-j-n s{text-decoration:line-through;opacity:.55}
}
        `,
      }}
    />
  );
}

export default function LeDirectPage() {
  return (
    <main className="ld">
      <StylesLeDirect />
      <Histoire />
    </main>
  );
}
