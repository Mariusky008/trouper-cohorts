// Les styles du Direct, en UN endroit.
//
// Quatre écrans partagent la carte, la pastille de famille, la ligne de
// marqueurs et la barre d'onglets. Les dupliquer par écran, c'est se garantir
// qu'ils divergeront — et la cohérence est précisément ce qui fait qu'une
// application ressemble à une application plutôt qu'à quatre pages.
//
// Tout est préfixé `.dir` : ces écrans cohabitent avec le reste du site.
import { STYLES_VIDEO_CARTE } from "./video-carte";

export function StylesDirect() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: STYLES_VIDEO_CARTE + `
/* LES JETONS DU PROTOTYPE, repris tels quels.
   Les miens en étaient proches sans l'être : chaque écart de 2 px et de 5 %
   d'opacité s'accumule, et l'ensemble finit par « ressembler à » sans jamais
   être la même chose. Les rayons portent leurs noms d'origine (--rm/--rl/--rx)
   parce que c'est leur rapport qui compte, pas leur valeur isolée.

   Deux corrections MESURÉES, et elles tiennent toujours : le lime ne fait que
   1,68:1 sur la crème, il ne porte donc jamais de texte sur fond clair ; et les
   gris secondaires sont remontés à 5,9 et 5,0:1 — c'est un fil qu'on lit
   dehors, en plein soleil. */
.dir{--ink:#0E2A1C;--body:#3A453E;--soft:#54605A;--faint:#5F6B63;--line:#E6E2DA;--line2:#D8D3C9;
  --paper:#FFF;--bg:#F5F3EF;--g:#2C8A4B;--gl:#93D02C;--gld:#6FA81C;--gs:#E9F6D6;--gd:#1F6B39;
  --orange:#DB8A2C;--red:#C4553A;--vio:#6B5BD4;
  --rm:14px;--rl:20px;--rx:26px;
  --sh:0 1px 2px rgba(14,42,28,.04),0 10px 26px -14px rgba(14,42,28,.26);
  background:var(--bg);color:var(--body);font-family:var(--fb),system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  min-height:100dvh;display:flex;flex-direction:column;}
.dir *{box-sizing:border-box;}
.dir .vue{flex:1;padding-bottom:96px;max-width:620px;width:100%;margin:0 auto;}

/* ── L'EN-TÊTE ────────────────────────────────────────────────────────────
   SUR FOND CLAIR, comme le prototype. Le bandeau vert foncé que j'avais mis
   fait « application » ; le fond crème fait « journal du jour », et c'est ce
   qu'on veut : on ouvre une page, pas un tableau de bord. Le titre en serif
   sombre sur crème est aussi ce qui se lit le mieux dehors. */
.dir .fhead{background:var(--bg);color:var(--ink);padding:20px 16px 0;}
.dir .fhead h1{font-family:var(--fd),Georgia,serif;font-size:31px;font-weight:700;margin:14px 0 0;
  line-height:1.12;letter-spacing:-.6px;color:var(--ink);}
.dir .fhead h1 .lg{display:block;}
.dir .fhead .live{display:flex;align-items:center;gap:8px;font-size:12px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--g);font-weight:800;}
/* Le point qui bat, avec son halo : c'est le seul signe qui dit « maintenant »
   avant qu'on ait lu quoi que ce soit. */
.dir .fhead .live .dot{width:8px;height:8px;border-radius:50%;background:var(--gl);position:relative;}
.dir .fhead .live .dot::after{content:"";position:absolute;inset:-4px;border-radius:50%;
  border:1.5px solid var(--gl);animation:dirPulse 2.2s infinite;}
@keyframes dirPulse{0%{transform:scale(.6);opacity:.85}100%{transform:scale(2);opacity:0}}
.dir .fhead .upd{font-size:14.5px;color:var(--soft);margin-top:8px;line-height:1.4;}

/* ── le pouls ────────────────────────────────────────────────────────────── */
.dir .pulse{background:linear-gradient(160deg,#1B2E25,#0E1913);color:#fff;padding:15px 16px 16px;}
.dir .pulse .n{font-family:var(--fd),Georgia,serif;font-size:26px;font-weight:600;line-height:1.15;}
.dir .pulse .sub{font-size:11px;color:#9DB5A8;margin-top:5px;}
.dir .pulse .rows{display:flex;gap:7px;margin-top:12px;}
.dir .pulse .r{flex:1;background:rgba(255,255,255,.07);border-radius:10px;padding:9px 7px;text-align:center;}
.dir .pulse .r b{display:block;font-family:var(--fd),Georgia,serif;font-size:16px;color:#fff;line-height:1;}
.dir .pulse .r span{font-size:8.5px;color:#8FA79A;display:block;margin-top:4px;line-height:1.25;}
.dir .pulse .cta{display:block;margin-top:13px;background:var(--gl);color:#08140E;border-radius:23px;padding:13px;
  text-align:center;font-size:13px;font-weight:700;text-decoration:none;border:none;width:100%;cursor:pointer;font-family:inherit;}

/* ── LES ONGLETS ─────────────────────────────────────────────────────────
   Plus collants et plus grands : ils se touchent au pouce, en marchant. Le
   fond n'est plus blanc — sur un en-tête clair, une bande blanche dessinait
   une frontière là où il n'y en a pas. */
.dir .chips{display:flex;gap:7px;padding:18px 16px 4px;overflow-x:auto;background:var(--bg);
  scrollbar-width:none;}
.dir .chips::-webkit-scrollbar{display:none;}
.dir .chip{font-size:13.5px;font-weight:600;padding:10px 17px;border-radius:999px;border:1px solid var(--line2);
  color:var(--body);white-space:nowrap;background:var(--paper);text-decoration:none;cursor:pointer;
  font-family:inherit;flex:none;}
.dir .chip.on{background:var(--ink);border-color:var(--ink);color:#fff;}

/* Le titre de section, avec sa preuve de fraîcheur à droite. */
.dir .sect{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:24px 16px 12px;}
.dir .sect .st{font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink);font-weight:800;}
.dir .sect .ss{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--soft);
  white-space:nowrap;margin:0;}
.dir .sect .ss::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--gl);flex:none;}

/* ── la carte ────────────────────────────────────────────────────────────── */
.dir .feed{padding:0 16px;}
/* La carte DÉTACHÉE du fond : rayon large, ombre portée, pas de trait. Le
   contour fin qu'elle avait la collait à la page ; l'ombre la pose dessus, et
   c'est ce qui donne l'impression d'objets qu'on peut prendre. */
.dir .post{background:var(--paper);border-radius:var(--rx);margin-bottom:16px;overflow:hidden;
  box-shadow:var(--sh);}
/* L'ANCIENNE CARTE — ligne de marqueurs, en-tête d'auteur, corps de texte,
   photo en pied — a été retirée avec le passage à l'image d'abord. Les règles
   sont parties avec elle : du CSS qui ne s'applique plus à rien finit toujours
   par être recopié « au cas où » dans le suivant. */

/* ── L'IMAGE D'ABORD ──────────────────────────────────────────────────────
   La carte s'ouvre sur l'image, et le texte est POSÉ DESSUS. Photo en bas de
   carte, on lit une notice ; photo en tête avec le titre dedans, on regarde une
   vitrine. C'est le même contenu et ce n'est pas le même geste.

   REPLI SANS PHOTO : jamais de carte vide dans un fil qui vit de l'image. Un
   aplat teinté, marqué du monogramme du commerce — mieux vaut un carton propre
   qu'une photo de vitrine posée à côté d'un plat qu'elle ne montre pas. Une
   image qui ne correspond pas à l'annonce est un mensonge par juxtaposition,
   et elle coûte plus cher que pas d'image du tout. */
.dir .pic{position:relative;height:280px;overflow:hidden;background:#2A2318;}
.dir .pic .fond{position:absolute;inset:0;background-size:cover;background-position:center;}
.dir .pic .voile{position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(14,42,28,.46) 0,rgba(14,42,28,0) 26%,rgba(14,42,28,.32) 52%,rgba(14,42,28,.92) 100%);}
/* Le monogramme se centre dans la MOITIÉ HAUTE : le bas de l'image appartient à
   la pastille et au titre. Centré sur toute la hauteur, il passait dessous. */
.dir .pic .repli{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 22px 86px;}
.dir .pic .repli span{font-family:var(--fd),Georgia,serif;font-size:62px;line-height:1;color:#fff;
  letter-spacing:.05em;opacity:.19;}
/* LE NOM ET LA DISTANCE, sur fond sombre translucide : posé en blanc opaque,
   le badge découpait un trou dans la photo. Il doit se lire sans arracher
   l'image, puisque c'est l'image qui vend. */
.dir .pic .bg{position:absolute;top:13px;left:13px;background:rgba(14,42,28,.8);color:#fff;
  backdrop-filter:blur(8px);border-radius:999px;padding:8px 15px;font-size:13.5px;font-weight:600;
  max-width:62%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.dir .pic .bd{position:absolute;top:13px;right:13px;background:rgba(255,255,255,.94);color:var(--ink);
  border-radius:999px;padding:8px 14px;font-size:12.5px;font-weight:800;}
/* Rouge quand ça presse — et seulement là. Une heure limite toujours rouge ne
   presse plus personne au bout de trois cartes. */
.dir .pic .bd.chaud{background:var(--red);color:#fff;}
/* Le texte posé sur l'image porte une ombre courte. Le voile suffit sur une
   photo ordinaire, mais on ne choisit pas les photos : un commerçant enverra un
   plat très clair sur une nappe blanche, et ce jour-là le voile seul ne tient
   plus. L'ombre ne se voit pas sur un fond sombre et sauve le fond clair. */
.dir .sur{position:absolute;left:16px;right:16px;bottom:16px;color:#fff;text-decoration:none;display:block;
  text-shadow:0 1px 3px rgba(8,20,14,.6);}
.dir .sur .conf{display:flex;align-items:center;gap:7px;font-size:13px;color:#DCE8E1;margin-top:10px;}
.dir .sur .conf i{width:7px;height:7px;border-radius:50%;background:var(--gl);font-style:normal;}
/* TROIS LIGNES, PAS PLUS.
   Le texte est écrit par un commerçant, et parfois par une assistante bavarde :
   « Un créneau s'est libéré lundi 10 de 11h à 13h, avec un café offert sur
   place. Répondez-moi pour réserver ce moment ! » remplissait quatre lignes,
   poussait le bloc jusqu'à percuter les badges du haut, et faisait passer le
   nom du commerce sur deux lignes. La carte du fil est une accroche, pas
   l'annonce entière — la suite est sur la boutique, à un doigt de là.
   Une carte qui déborde ne dit pas « il y a beaucoup à lire », elle dit
   « c'est cassé ». */
.dir .sur h3{font-family:var(--fd),Georgia,serif;font-size:23px;font-weight:700;line-height:1.15;margin:10px 0 0;color:#fff;letter-spacing:-.3px;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
/* Le nom tient sur UNE ligne : « Esthéticienne Guinot - LPG - institut de
   beauté » est une liste de mots-clés, pas une information à lire en entier. */
.dir .sur .qui{font-size:13.5px;color:#DCE8E1;margin-top:8px;display:block;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

/* ── LES PASTILLES DE FAMILLE ─────────────────────────────────────────────
   Elles sont posées SUR UNE PHOTO, et c'est tout ce qui dicte leur dessin :

     · OPAQUES. Une pastille translucide prend la couleur de ce qu'il y a
       dessous ; sur une photo claire elle disparaît, et c'est justement sur
       une photo appétissante qu'on a le plus besoin de lire « Plat du jour ».
     · UNE COULEUR PAR FAMILLE. Cinq familles qu'il faut distinguer SANS LIRE,
       à la vitesse d'un pouce qui défile. Les cinq portaient la même teinte
       verte : la couleur ne disait plus rien, elle décorait.
     · UNE OMBRE COURTE, pour les décoller d'un fond chargé sans les alourdir.

   Les cinq couples texte/fond sont mesurés, le plus faible tient 6,15:1. */
.dir .pastille{display:inline-flex;align-items:center;text-shadow:none;border-radius:999px;
  padding:8px 15px;font-size:12.5px;font-weight:800;letter-spacing:.02em;box-shadow:0 1px 4px rgba(8,20,14,.34);}
/* Le lime est la couleur signature, et « Place libre » est le signal
   signature : ce qui part maintenant, chez quelqu'un, tout près. */
.dir .k-place{background:var(--gl);color:#0E2A1C;}      /*  8,27:1 */
/* Le plat du jour a sa propre couleur : confondu avec « Offre », on ne
   distinguerait plus la seule famille qui meurt à la fin du service. */
.dir .k-menu{background:#F5B921;color:#3D2604;}         /*  8,02:1 */
.dir .k-offre{background:var(--gd);color:#fff;}         /*  6,52:1 */
.dir .k-evenement{background:var(--vio);color:#fff;}    /*  6,15:1 */
/* « Ma ville » ne vend rien : elle reste en retrait, sur un parchemin calme,
   là où les quatre autres réclament un geste. */
.dir .k-ville{background:#F1E6CE;color:#6B4E12;}        /*  6,22:1 */
/* ── COMMENT VOULEZ-VOUS EN PROFITER ? ────────────────────────────────────
   Les façons se lisent comme une colonne de PRIX QUI DESCEND. C'est la forme
   qui porte le sens : on voit d'un coup qu'il y a trois portes, et que la
   moins chère demande le plus d'effort. Trois bandes identiques auraient dit
   « trois promos » ; trois prix alignés disent « choisissez votre échange ».

   Chaque façon garde sa teinte propre, la même partout dans l'application :
   le cadeau en crème, l'express en ambre, la table à partager en violet. */
/* Pas de trait de séparation : la carte est un objet d'un seul tenant, et
   l'échelle des prix en fait partie. */
.dir .fac{padding:18px 16px 6px;}
.dir .fac-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:13px;}
.dir .fac-q{font-family:var(--fd),Georgia,serif;font-size:17px;font-weight:700;color:var(--ink);line-height:1.25;}
/* La suite des prix, en petit et à droite : elle résume la carte avant même
   qu'on lise les lignes. */
.dir .fac-pr{font-family:var(--fd),Georgia,serif;font-size:14px;color:var(--soft);font-weight:700;white-space:nowrap;flex:none;}

.dir .fac-l{display:flex;align-items:center;gap:12px;padding:13px;border-radius:var(--rl);background:var(--paper);
  border:1.5px solid var(--line2);text-decoration:none;margin-bottom:9px;}
.dir .fac-l:last-child{margin-bottom:0;}
.dir .fac-ic{width:40px;height:40px;border-radius:50%;flex:none;display:flex;align-items:center;
  justify-content:center;font-size:19px;background:var(--bg);}
.dir .fac-c{flex:1;min-width:0;}
.dir .fac-t{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;}
.dir .fac-t b{font-family:var(--fd),Georgia,serif;font-size:23px;font-weight:700;color:var(--ink);line-height:1;}
.dir .fac-t em{font-style:normal;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--soft);}
.dir .fac-s{display:block;font-size:12.5px;color:var(--soft);margin-top:5px;line-height:1.35;}
/* L'heure limite est la seule information vraiment urgente de la ligne : elle
   porte une pastille, pas une nuance de gris. */
.dir .fac-q2{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:var(--soft);
  background:var(--bg);border-radius:999px;padding:5px 10px;margin-top:8px;}
.dir .fac-q2::before{content:"⏱";font-weight:400;}
.dir .fac-j{display:block;height:5px;border-radius:3px;background:var(--line2);margin-top:8px;overflow:hidden;}
.dir .fac-j i{display:block;height:100%;border-radius:3px;background:var(--vio);}
.dir .fac-go{flex:none;font-size:19px;color:var(--faint);line-height:1;}

/* UNE COULEUR PAR FAÇON, celles du prototype. Elles ne décorent pas : elles
   sont le seul moyen de reconnaître une façon d'un coup d'œil quand on a déjà
   vu trois cartes, et elles doivent donc être les mêmes partout — fil, écran du
   Clik, espace du commerçant. La pastille d'heure limite prend la même teinte,
   plus soutenue : c'est l'information urgente de la ligne. */
.dir .fac-cadeau{background:#FBFDF7;border-color:#C4E0A8;}
.dir .fac-cadeau .fac-ic{background:#E4F2DC;}
.dir .fac-cadeau .fac-t em{color:#2C8A4B;}
.dir .fac-cadeau .fac-q2{background:#E4F2DC;color:#1F6B39;}

.dir .fac-express{background:#FDF2E4;border-color:#F0D9B4;}
.dir .fac-express .fac-ic{background:#F8E7CE;}
.dir .fac-express .fac-t em{color:#DB8A2C;}
.dir .fac-express .fac-q2{background:#F6DFC0;color:#96601A;}

.dir .fac-collectif{background:#EEEBFB;border-color:#CFC8F2;}
.dir .fac-collectif .fac-ic{background:#DFDAF7;}
.dir .fac-collectif .fac-t em{color:#6B5BD4;}
.dir .fac-collectif .fac-q2{background:#DFDAF7;color:#4B3CA8;}
.dir .fac-collectif .fac-j{background:rgba(107,91,212,.18);}
.dir .fac-collectif .fac-j i{background:#6B5BD4;}

/* « À prendre » n'est pas une remise : il reste neutre, et seule son heure
   limite est rouge — c'est la seule chose qui presse. */
.dir .fac-simple{background:var(--paper);border-color:var(--line2);}
.dir .fac-simple .fac-ic{background:var(--bg);}
.dir .fac-simple .fac-t em{color:var(--soft);}
.dir .fac-simple .fac-q2{background:#FBEDE8;color:#C4553A;}
/* Épuisée, la façon RESTE À L'ÉCRAN, éteinte : la retirer ferait croire qu'elle
   n'a jamais existé, et priverait les deux autres de leur point de comparaison. */
.dir .fac-off{opacity:.5;}
.dir .fac-off .fac-t b{text-decoration:line-through;}

.dir .post .pf{display:flex;align-items:center;gap:8px;padding:8px 16px 16px;}
/* La sortie vers le commerce prend toute la place qui reste : c'est le geste
   qui suit la décision, pas une option à côté du cœur. */
.dir .post .pf .act{flex:1;text-align:center;padding:12px;border-radius:999px;font-size:13.5px;font-weight:700;
  background:var(--paper);border:1.5px solid var(--line2);color:var(--ink);}
.dir .act{font-size:11px;font-weight:700;padding:7px 13px;border-radius:16px;background:var(--ink);color:#fff;
  text-decoration:none;border:none;cursor:pointer;font-family:inherit;}
.dir .act.gh{background:#fff;border:1px solid var(--line2);color:var(--body);}
.dir .coeur{margin-left:auto;font-size:17px;color:var(--faint);background:none;border:none;cursor:pointer;padding:2px 4px;line-height:1;}
.dir .coeur.on{color:var(--red);}

/* ── L'ÉCRAN D'UN CLIK ────────────────────────────────────────────────────
   UN BLOC, DE LA COULEUR DE LA FAÇON. L'écran était une suite d'encarts blancs
   posés les uns sous les autres : rien ne rappelait sur quelle porte on venait
   d'appuyer, et les trois façons se ressemblaient une fois qu'on y était.
   Le bloc reprend la teinte de la ligne du fil — vert, orange, violet — et
   c'est ce qui fait qu'on se sait au bon endroit. */
.dir .ck{padding:20px 16px 0;}
.dir .ck-blk{border-radius:var(--rx);padding:20px 18px;border:1.5px solid var(--line2);background:var(--paper);}
.dir .ck-blk.b-cadeau{border-color:#C4E0A8;background:#FBFDF7;}
.dir .ck-blk.b-express{border-color:#F0D9B4;background:#FDF2E4;}
.dir .ck-blk.b-collectif{border-color:#CFC8F2;background:#EEEBFB;}
.dir .ck-hh{display:flex;align-items:center;gap:12px;}
.dir .ck-ic{width:52px;height:52px;border-radius:50%;flex:none;display:flex;align-items:center;
  justify-content:center;font-size:25px;background:#fff;}
.dir .ck-pr{font-family:var(--fd),Georgia,serif;font-size:32px;font-weight:700;color:var(--ink);line-height:1;}
.dir .ck-old{font-family:var(--fd),Georgia,serif;font-size:19px;color:var(--faint);text-decoration:line-through;margin-left:9px;}
.dir .ck-nm{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;margin-top:5px;}
.dir .b-cadeau .ck-nm{color:#2C8A4B;}
.dir .b-express .ck-nm{color:#DB8A2C;}
.dir .b-collectif .ck-nm{color:#6B5BD4;}
.dir .b-simple .ck-nm{color:var(--soft);}
.dir .ck-blk h2{font-family:var(--fd),Georgia,serif;font-size:19px;font-weight:700;color:var(--ink);
  margin:15px 0 0;line-height:1.25;}
.dir .ck-blk p{font-size:14px;color:var(--soft);margin:8px 0 0;line-height:1.55;}

/* L'ÉCHÉANCE DANS SON PROPRE ENCADRÉ BLANC. En ligne de texte parmi d'autres,
   elle se lisait après avoir décidé — c'est-à-dire jamais. C'est pourtant la
   seule contrainte que l'habitant doit retenir. */
.dir .ck-when{display:flex;flex-direction:column;background:#fff;border-radius:var(--rm);
  padding:12px 14px;margin-top:14px;}
.dir .ck-when .w1{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--soft);font-weight:800;}
.dir .ck-when .w2{font-family:var(--fd),Georgia,serif;font-size:17px;font-weight:700;color:var(--ink);margin-top:3px;}

/* LES PARTICIPANTS EN PASTILLES. « 2 sur 4 » est un chiffre ; deux ronds
   pleins et deux vides sont un groupe qu'il manque deux personnes à finir.
   C'est la même donnée, et ce n'est pas la même envie. */
.dir .ck-pp{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap;}
/* « flex:none » : sans lui, les pastilles s'étirent en ellipses dans la ligne
   flexible qui les contient — un rond aplati ne se lit plus comme quelqu'un. */
.dir .ck-pp i{width:34px;height:34px;flex:none;border-radius:50%;background:#6B5BD4;display:flex;
  align-items:center;justify-content:center;font-size:15px;color:#fff;font-weight:800;font-style:normal;}
.dir .ck-pp i.vide{background:transparent;border:2px dashed #CFC8F2;color:var(--faint);}
.dir .ck-jauge{height:8px;border-radius:5px;background:rgba(107,91,212,.18);overflow:hidden;margin-top:12px;}
.dir .ck-jauge i{display:block;height:100%;background:#6B5BD4;border-radius:5px;transition:width .3s ease;}

.dir .ck-b{width:100%;margin-top:14px;padding:15px;border-radius:999px;border:none;background:var(--ink);
  color:#fff;font-family:var(--fd),Georgia,serif;font-size:16px;font-weight:700;cursor:pointer;}
.dir .ck-b:disabled{background:var(--line2);color:var(--faint);cursor:default;}
.dir .ck-msg{margin-top:12px;font-size:13.5px;color:var(--red);font-weight:600;line-height:1.5;}

/* ── CE QU'ON PEUT OBTENIR ─────────────────────────────────────────────── */
.dir .ck-pool{margin-top:14px;background:#fff;border-radius:var(--rm);padding:14px;}
.dir .ck-pool-t{font-size:11px;letter-spacing:.09em;text-transform:uppercase;font-weight:800;color:var(--soft);}
.dir .ck-pool-l{margin:7px 0 0;padding:0;list-style:none;}
.dir .ck-pool-l li{font-family:var(--fd),Georgia,serif;font-size:17px;font-weight:700;color:var(--ink);line-height:1.35;}
.dir .ck-pool-l li + li{margin-top:4px;}
.dir .ck-pool-c{font-size:13px;color:var(--soft);margin-top:8px;line-height:1.5;}

/* ── L'ÉCRAN DE CONFIRMATION ──────────────────────────────────────────────
   Centré, avec une pastille pleine : c'est le seul moment où l'application a
   quelque chose à célébrer, et elle le faisait dans un encart de la taille
   d'un message d'erreur. */
.dir .ck-fait{text-align:center;padding:4px 0 0;}
.dir .ck-sl{width:92px;height:92px;border-radius:50%;margin:24px auto 0;display:flex;align-items:center;
  justify-content:center;font-size:40px;color:#fff;background:#2C8A4B;}
.dir .ck-sl.s-express{background:#DB8A2C;}
.dir .ck-sl.s-collectif{background:#6B5BD4;}
.dir .ck-fait-k{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);
  font-weight:800;margin-top:18px;}
.dir .ck-fait-t{font-family:var(--fd),Georgia,serif;font-size:27px;font-weight:700;color:var(--ink);
  margin-top:12px;line-height:1.24;letter-spacing:-.3px;}
.dir .ck-fait-g{font-family:var(--fd),Georgia,serif;font-size:20px;font-weight:700;color:var(--ink);
  margin-top:8px;line-height:1.3;}
.dir .ck-fait-g span{display:block;font-family:var(--fb),system-ui,sans-serif;font-size:14px;
  font-weight:400;color:var(--soft);margin-top:6px;}
.dir .ck-fait-s{font-size:14.5px;color:var(--body);margin-top:11px;line-height:1.5;}
/* LE BON À PRÉSENTER. Sans code, « c'est réservé » n'est qu'une promesse à
   l'écran : le commerçant n'a rien à quoi se raccrocher quand la personne
   arrive. */
.dir .ck-code{display:inline-flex;align-items:center;gap:8px;border:1.5px solid #C4E0A8;border-radius:999px;
  padding:11px 21px;font-size:14.5px;color:#2C8A4B;font-weight:600;margin-top:16px;}
.dir .ck-code i{width:7px;height:7px;border-radius:50%;background:var(--gl);font-style:normal;}
.dir .ck-code b{font-family:var(--fd),Georgia,serif;letter-spacing:.06em;color:var(--ink);}
.dir .ck-fini{margin-top:14px;font-size:14px;color:var(--soft);line-height:1.6;text-align:center;}
.dir .ck-fini a{color:#2C8A4B;font-weight:700;}

.dir .ck-filet{font-size:13.5px;color:var(--soft);line-height:1.6;margin:16px 0 0;}
.dir .ck-note{font-size:12.5px;color:var(--faint);line-height:1.6;margin:10px 0 0;}
.dir .ck-retour{display:inline-block;margin-top:22px;font-family:var(--fd),Georgia,serif;font-size:15.5px;
  font-weight:700;color:var(--ink);text-decoration:none;border-bottom:2px solid var(--gl);padding-bottom:3px;}

/* ── état vide ───────────────────────────────────────────────────────────── */
.dir .vide{margin:16px;padding:26px 20px;background:#fff;border:1px solid var(--line);border-radius:14px;text-align:center;}
.dir .vide h3{font-family:var(--fd),Georgia,serif;font-size:17px;font-weight:600;color:var(--ink);margin:0 0 7px;}
.dir .vide p{font-size:12px;color:var(--soft);line-height:1.6;margin:0;}

/* ── LA BARRE D'ONGLETS ────────────────────────────────────────────────────
   Elle prend le fond crème de l'application, pas du blanc : sur un fil clair,
   une barre blanche découpe une bande là où il n'y a rien à séparer.

   L'onglet actif porte une pastille lime pleine derrière son icône — une
   forme, pas une teinte. Signalé par une nuance de vert sur une nuance de
   gris, il s'effaçait en plein soleil et n'existait pas pour un daltonien. */
.dir .nav{position:fixed;left:0;right:0;bottom:0;background:rgba(245,243,239,.97);backdrop-filter:blur(18px);
  border-top:1px solid var(--line);display:flex;padding:10px 0 max(22px,env(safe-area-inset-bottom));z-index:60;
  max-width:620px;margin:0 auto;}
.dir .nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;
  font-size:10.5px;color:var(--soft);font-weight:700;text-decoration:none;line-height:1.1;}
.dir .nav a .i{display:flex;align-items:center;justify-content:center;width:48px;height:28px;
  border-radius:999px;font-size:19px;line-height:1;transition:background .16s,color .16s;}
.dir .nav a.on{color:var(--ink);font-weight:800;}
.dir .nav a.on .i{background:var(--gl);color:#0E2A1C;}
/* « À saisir » est plein écran et sombre : la barre s'y accorde, sinon elle
   découpe un bandeau clair au bas d'une image. */
.dir .nav.dark{background:rgba(10,19,16,.97);border-top-color:rgba(255,255,255,.1);}
.dir .nav.dark a{color:#8FA79A;}
.dir .nav.dark a.on{color:#fff;}
.dir .nav.dark a.on .i{background:var(--gl);color:#0E2A1C;}

/* ── onglets internes (Mes commerces) ────────────────────────────────────── */
.dir .tabs{display:flex;background:var(--paper);border-bottom:1px solid var(--line);}
.dir .tabs a{flex:1;text-align:center;padding:12px 0;font-size:11.5px;font-weight:700;color:var(--faint);
  border-bottom:2px solid transparent;text-decoration:none;}
.dir .tabs a.on{color:var(--ink);border-bottom-color:var(--ink);}

/* ── commerce suivi ──────────────────────────────────────────────────────── */
.dir .mc{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px;display:flex;gap:11px;align-items:center;}
.dir .mc .av{width:40px;height:40px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;
  color:#fff;font-weight:700;font-size:15px;background:#3C4A43;}
.dir .mc .nm{font-size:12.5px;font-weight:700;color:var(--ink);}
.dir .mc .sb{font-size:9.5px;color:var(--soft);margin-top:2px;}
.dir .mc .rel{margin-top:6px;display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
.dir .mc .hearts{font-size:10.5px;color:var(--g);letter-spacing:1px;}
.dir .mc .adv{font-size:9px;color:var(--gd);background:var(--gs);padding:3px 7px;border-radius:9px;font-weight:700;}
.dir .mc .go{margin-left:auto;color:var(--faint);font-size:16px;text-decoration:none;}

/* ── réglages (Moi) ──────────────────────────────────────────────────────── */
.dir .prof{background:var(--ink);color:#fff;padding:26px 16px 18px;text-align:center;}
/* L'avatar portait encore le menthe de l'ancienne palette — sur l'écran le plus
   personnel, c'est-à-dire celui qu'on regarde le plus longtemps. */
.dir .prof .av{width:58px;height:58px;border-radius:50%;background:linear-gradient(150deg,#A8E03A,#6FAF1E);
  margin:0 auto 10px;display:flex;align-items:center;justify-content:center;font-size:23px;color:#08140E;font-weight:700;}
.dir .prof .nm{font-family:var(--fd),Georgia,serif;font-size:18px;font-weight:600;}
.dir .prof .sb{font-size:10px;color:#8FA79A;margin-top:4px;}
.dir .row{background:#fff;border-bottom:1px solid var(--line);padding:13px 16px;display:flex;align-items:center;gap:11px;
  width:100%;text-align:left;font-family:inherit;border-left:none;border-right:none;border-top:none;}
.dir .row .ic{width:26px;text-align:center;font-size:15px;color:var(--g);flex:none;}
.dir .row .t{font-size:12px;font-weight:600;color:var(--ink);}
.dir .row .s{font-size:9.5px;color:var(--soft);margin-top:2px;}
.dir .row .go{margin-left:auto;font-size:15px;color:var(--faint);}
.dir .tog{margin-left:auto;width:36px;height:20px;border-radius:11px;background:var(--g);position:relative;flex:none;
  border:none;cursor:pointer;padding:0;transition:background .18s;}
.dir .tog::after{content:"";position:absolute;right:2px;top:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.18s;}
.dir .tog.off{background:var(--line2);} .dir .tog.off::after{right:auto;left:2px;}
.dir .grp{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--faint);font-weight:700;padding:16px 16px 7px;}

/* Panneau déplié sous une ligne de réglage. Fond légèrement en retrait : il doit
   se lire comme appartenant à la ligne au-dessus, pas comme une nouvelle
   section. */
.dir .panneau{background:#FAFCFB;border-bottom:1px solid var(--line);padding:13px 16px 15px;}
.dir .panneau .aide{font-size:11px;color:var(--soft);line-height:1.55;margin:0 0 11px;}
.dir .panneau .etiq{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);font-weight:700;margin:0 0 7px;display:block;}
.dir .puces{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:13px;}
.dir .puce{font-size:11.5px;font-weight:600;padding:7px 12px;border-radius:16px;border:1px solid var(--line2);
  background:#fff;color:var(--soft);cursor:pointer;font-family:inherit;}
.dir .puce.on{background:var(--ink);border-color:var(--ink);color:#fff;}
.dir .panneau input[type=email]{width:100%;padding:11px 13px;border:1px solid var(--line2);border-radius:11px;
  font-size:15px;font-family:inherit;color:var(--ink);background:#fff;}
.dir .panneau select{width:100%;padding:9px 11px;border:1px solid var(--line2);border-radius:10px;
  font-size:13px;font-family:inherit;color:var(--ink);background:#fff;}
.dir .panneau .duo{display:flex;gap:10px;}
.dir .panneau .duo label{flex:1;}
.dir .panneau .accord{display:flex;gap:9px;align-items:flex-start;margin:11px 0;font-size:10.5px;
  color:var(--soft);line-height:1.5;cursor:pointer;}
.dir .panneau .accord input{margin-top:2px;flex:none;width:16px;height:16px;accent-color:var(--g);}
.dir .panneau .valider{width:100%;padding:12px;border-radius:22px;border:none;background:var(--g);color:#fff;
  font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-top:4px;}
.dir .panneau .valider:disabled{background:var(--line2);color:var(--faint);cursor:default;}
.dir .panneau .valider.danger{background:var(--red);}
.dir .panneau .lien{display:block;width:100%;background:none;border:none;padding:10px 0 0;font-size:11.5px;
  font-weight:600;color:var(--soft);cursor:pointer;font-family:inherit;text-align:center;}
.dir .panneau .lien.danger{color:var(--red);}
.dir .alerte{font-size:11px;color:var(--red);font-weight:600;padding:9px 16px;background:#FBE9E4;}

@media (prefers-reduced-motion:reduce){.dir *{animation:none!important;transition:none!important;}}
`,
      }}
    />
  );
}
