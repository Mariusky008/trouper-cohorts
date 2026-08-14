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
/* PALETTE — celle du prototype, avec deux corrections MESURÉES et non jugées à
   l'œil :
     · le lime ne fait que 1,68:1 sur la crème. Il ne porte donc JAMAIS de texte
       sur fond clair — uniquement des aplats, des pastilles et des points, où
       l'encre sur lime atteint 8,27:1 ;
     · les gris secondaires d'origine tombaient à 3,82 et 2,32:1. Remontés à
       5,93 et 5,03:1 — c'est un fil qu'on lit dehors, en plein soleil, à midi. */
.dir{--ink:#0E2A1C;--body:#3A453E;--soft:#54605A;--faint:#5F6B63;--line:#E6E2DA;--line2:#D8D3C9;
  --paper:#FFF;--bg:#F5F3EF;--g:#257A41;--gl:#93D02C;--gs:#E9F6D6;--gd:#1F6B39;--amber:#B96F12;--red:#B2452C;--vio:#5C4BD4;
  background:var(--bg);color:var(--body);font-family:var(--fb),system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  min-height:100dvh;display:flex;flex-direction:column;}
.dir *{box-sizing:border-box;}
.dir .vue{flex:1;padding-bottom:78px;max-width:620px;width:100%;margin:0 auto;}

/* ── en-tête ─────────────────────────────────────────────────────────────── */
.dir .fhead{background:var(--ink);color:#fff;padding:22px 16px 15px;}
.dir .fhead h1{font-family:var(--fd),Georgia,serif;font-size:21px;font-weight:600;margin:0;}
.dir .fhead .live{display:flex;align-items:center;gap:6px;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gl);font-weight:700;}
.dir .fhead .live .dot{width:6px;height:6px;border-radius:50%;background:var(--gl);animation:dirPulse 2.4s ease-in-out infinite;}
@keyframes dirPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.8)}}
.dir .fhead .upd{font-size:10px;color:#8FA79A;margin-top:4px;}

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

/* ── filtres ─────────────────────────────────────────────────────────────── */
.dir .chips{display:flex;gap:7px;padding:12px 16px 10px;overflow-x:auto;background:var(--paper);border-bottom:1px solid var(--line);
  scrollbar-width:none;position:sticky;top:0;z-index:20;}
.dir .chips::-webkit-scrollbar{display:none;}
.dir .chip{font-size:11.5px;font-weight:600;padding:7px 12px;border-radius:16px;border:1px solid var(--line2);
  color:var(--soft);white-space:nowrap;background:#fff;text-decoration:none;cursor:pointer;font-family:inherit;}
.dir .chip.on{background:var(--ink);border-color:var(--ink);color:#fff;}

.dir .sect{padding:14px 16px 4px;}
.dir .sect .st{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);font-weight:700;}
.dir .sect .ss{font-size:10px;color:var(--faint);margin-top:3px;}

/* ── la carte ────────────────────────────────────────────────────────────── */
.dir .feed{padding:6px 16px 0;}
.dir .post{background:#fff;border:1px solid var(--line);border-radius:14px;margin-bottom:10px;overflow:hidden;}
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
.dir .pic{position:relative;height:246px;overflow:hidden;background:#2A2318;}
.dir .pic .fond{position:absolute;inset:0;background-size:cover;background-position:center;}
.dir .pic .voile{position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(14,42,28,.46) 0,rgba(14,42,28,0) 26%,rgba(14,42,28,.32) 52%,rgba(14,42,28,.92) 100%);}
/* Le monogramme se centre dans la MOITIÉ HAUTE : le bas de l'image appartient à
   la pastille et au titre. Centré sur toute la hauteur, il passait dessous. */
.dir .pic .repli{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 22px 86px;}
.dir .pic .repli span{font-family:var(--fd),Georgia,serif;font-size:62px;line-height:1;color:#fff;
  letter-spacing:.05em;opacity:.19;}
.dir .pic .bg{position:absolute;top:12px;left:12px;background:rgba(255,255,255,.94);color:var(--ink);
  border-radius:999px;padding:5px 11px;font-size:10.5px;font-weight:800;}
.dir .pic .bd{position:absolute;top:12px;right:12px;background:rgba(14,42,28,.74);color:#fff;
  border-radius:999px;padding:5px 11px;font-size:10.5px;font-weight:800;}
/* Le texte posé sur l'image porte une ombre courte. Le voile suffit sur une
   photo ordinaire, mais on ne choisit pas les photos : un commerçant enverra un
   plat très clair sur une nappe blanche, et ce jour-là le voile seul ne tient
   plus. L'ombre ne se voit pas sur un fond sombre et sauve le fond clair. */
.dir .sur{position:absolute;left:14px;right:14px;bottom:13px;color:#fff;text-decoration:none;display:block;
  text-shadow:0 1px 3px rgba(8,20,14,.6);}
.dir .sur .conf{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#D5E5DB;margin-top:9px;}
.dir .sur .conf i{width:6px;height:6px;border-radius:50%;background:var(--gl);font-style:normal;}
.dir .sur h3{font-family:var(--fd),Georgia,serif;font-size:20px;font-weight:600;line-height:1.22;margin:6px 0 0;color:#fff;}
.dir .sur .qui{font-size:11.5px;color:#CFE0D6;margin-top:4px;}

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
.dir .pastille{display:inline-block;text-shadow:none;border-radius:999px;padding:5px 11px;font-size:10.5px;
  font-weight:800;letter-spacing:.02em;box-shadow:0 1px 4px rgba(8,20,14,.34);}
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
/* ── LE CLIK SUR LA CARTE ─────────────────────────────────────────────────
   Une bande pleine largeur, pas un bouton parmi d'autres. C'est le seul
   endroit du fil où le geste de l'habitant change quelque chose POUR LES
   AUTRES, et ça doit se voir avant d'être lu.

   L'état colore la bande, et il n'y en a que trois qui appellent un geste :
     · ouverte  → calme, on informe ;
     · presque  → lime : il manque deux personnes, c'est maintenant que ça se
                  joue, et c'est la seule couleur d'urgence du fil ;
     · complete → vert plein : c'est gagné, on le dit franchement.
   « epuise » garde la bande grise plutôt que de la retirer : disparaître
   ferait croire qu'il n'y a jamais rien eu. */
.dir .clk{display:block;text-decoration:none;padding:10px 12px 11px;border-top:1px solid var(--line);
  background:var(--bg);}
.dir .clk-h{display:flex;align-items:baseline;gap:8px;}
.dir .clk-t{font-size:8.5px;letter-spacing:.13em;text-transform:uppercase;font-weight:800;color:var(--soft);flex:none;}
.dir .clk-p{font-size:12px;font-weight:700;color:var(--ink);line-height:1.25;}
.dir .clk-j{display:block;height:5px;border-radius:3px;background:var(--line2);margin-top:8px;overflow:hidden;}
.dir .clk-j i{display:block;height:100%;background:var(--g);border-radius:3px;}
.dir .clk-presque{background:var(--gs);}
.dir .clk-presque .clk-t{color:var(--gd);}
.dir .clk-presque .clk-j i{background:var(--gl);}
.dir .clk-complete .clk-j i{background:var(--g);}
.dir .clk-epuise .clk-p{color:var(--soft);}
.dir .clk-epuise .clk-j i{background:var(--faint);}

.dir .post .pf{display:flex;align-items:center;gap:8px;padding:9px 12px;border-top:1px solid var(--line);}
.dir .act{font-size:11px;font-weight:700;padding:7px 13px;border-radius:16px;background:var(--ink);color:#fff;
  text-decoration:none;border:none;cursor:pointer;font-family:inherit;}
.dir .act.gh{background:#fff;border:1px solid var(--line2);color:var(--body);}
.dir .coeur{margin-left:auto;font-size:17px;color:var(--faint);background:none;border:none;cursor:pointer;padding:2px 4px;line-height:1;}
.dir .coeur.on{color:var(--red);}

/* ── L'ÉCRAN D'UN CLIK ────────────────────────────────────────────────────
   Le prix barré et le prix obtenu sur la même ligne, l'écart entre les deux
   lisible d'un coup d'œil : c'est l'argument, tout le reste l'explique. */
.dir .ck{padding:16px;}
.dir .ck-prix{display:flex;align-items:baseline;gap:10px;margin-bottom:14px;}
.dir .ck-barre{font-size:15px;color:var(--faint);text-decoration:line-through;}
.dir .ck-net{font-family:var(--fd),Georgia,serif;font-size:34px;font-weight:600;color:var(--ink);line-height:1;}
.dir .ck-pct{background:var(--gl);color:#0E2A1C;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:800;}

.dir .ck-etat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;}
.dir .ck-phrase{font-size:14px;font-weight:700;color:var(--ink);line-height:1.35;}
.dir .ck-jauge{height:7px;border-radius:4px;background:var(--line2);margin-top:11px;overflow:hidden;}
.dir .ck-jauge i{display:block;height:100%;background:var(--g);border-radius:4px;transition:width .3s ease;}
.dir .ck-compte{font-size:10.5px;color:var(--soft);margin-top:7px;}
/* Le lime marque le moment où le geste compte le plus, ici comme dans le fil. */
.dir .ck-presque{background:var(--gs);border-color:#CDE6A6;}
.dir .ck-presque .ck-jauge i{background:var(--gl);}
.dir .ck-epuise .ck-jauge i,.dir .ck-terminee .ck-jauge i{background:var(--faint);}

.dir .ck-pool{margin-top:12px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:13px;}
.dir .ck-pool-t{font-size:9px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:var(--soft);}
/* Sans puce : à un seul avantage, une liste à puces fait bureaucratique, et le
   titre au-dessus dit déjà qu'il y en a plusieurs quand c'est le cas. */
.dir .ck-pool-l{margin:6px 0 0;padding:0;list-style:none;}
.dir .ck-pool-l li{font-size:14px;color:var(--ink);line-height:1.45;font-weight:600;}
.dir .ck-pool-l li + li{margin-top:3px;}
/* La condition d'achat n'est pas une mention légale en bas de page : c'est la
   règle du jeu, et elle se lit avant d'appuyer, à la même taille que le reste. */
.dir .ck-pool-c{font-size:11.5px;color:var(--soft);margin-top:9px;line-height:1.5;}


.dir .ck-b{width:100%;margin-top:14px;padding:15px;border-radius:26px;border:none;background:var(--ink);
  color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:inherit;}
.dir .ck-b:disabled{background:var(--line2);color:var(--faint);cursor:default;}
.dir .ck-msg{margin-top:10px;font-size:11.5px;color:var(--red);font-weight:600;line-height:1.5;}

.dir .ck-fait{margin-top:14px;background:var(--ink);color:#fff;border-radius:14px;padding:15px;}
.dir .ck-fait-t{font-family:var(--fd),Georgia,serif;font-size:19px;font-weight:600;}
/* L'avantage obtenu, sur le bandeau sombre : c'est la ligne qu'on relit, et
   celle qu'on montrera au commerçant. Le lime la sépare du reste sans crier. */
.dir .ck-fait-g{font-size:15px;font-weight:700;color:var(--gl);margin-top:8px;line-height:1.4;}
.dir .ck-fait-g span{color:#9DB5A8;font-weight:600;font-size:12px;}
.dir .ck-fait-s{font-size:11.5px;color:#9DB5A8;margin-top:6px;line-height:1.55;}
.dir .ck-fini{margin-top:14px;font-size:12.5px;color:var(--soft);line-height:1.6;}
.dir .ck-fini a{color:var(--gd);font-weight:700;}

.dir .ck-filet{font-size:11.5px;color:var(--soft);line-height:1.6;margin:14px 0 0;}
.dir .ck-note{font-size:10.5px;color:var(--faint);line-height:1.6;margin:9px 0 0;}
.dir .ck-retour{display:inline-block;margin-top:18px;font-size:12px;font-weight:700;color:var(--soft);text-decoration:none;}

/* ── état vide ───────────────────────────────────────────────────────────── */
.dir .vide{margin:16px;padding:26px 20px;background:#fff;border:1px solid var(--line);border-radius:14px;text-align:center;}
.dir .vide h3{font-family:var(--fd),Georgia,serif;font-size:17px;font-weight:600;color:var(--ink);margin:0 0 7px;}
.dir .vide p{font-size:12px;color:var(--soft);line-height:1.6;margin:0;}

/* ── LA BARRE D'ONGLETS ────────────────────────────────────────────────────
   L'onglet actif était signalé par une nuance de vert sur une nuance de gris —
   la différence la plus fragile qui soit : elle s'efface en plein soleil, et
   elle n'existe pas pour un daltonien. Il porte maintenant une PASTILLE LIME
   pleine derrière son icône. C'est une forme, pas une teinte, et ça se voit
   d'un coup d'œil au bout du bras.

   Le lime en aplat, jamais en texte : sur du blanc il ne monte qu'à 1,68:1.
   Le libellé actif passe donc à l'encre (13,9:1), pas au lime. */
.dir .nav{position:fixed;left:0;right:0;bottom:0;background:rgba(255,255,255,.97);backdrop-filter:blur(10px);
  border-top:1px solid var(--line);display:flex;padding:7px 0 max(11px,env(safe-area-inset-bottom));z-index:60;}
.dir .nav a{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;
  font-size:9px;color:var(--faint);font-weight:600;text-decoration:none;line-height:1.1;}
.dir .nav a .i{display:flex;align-items:center;justify-content:center;width:46px;height:25px;
  border-radius:999px;font-size:15px;line-height:1;transition:background .16s,color .16s;}
.dir .nav a.on{color:var(--ink);font-weight:800;}
.dir .nav a.on .i{background:var(--gl);color:#0E2A1C;}
/* « À saisir » est plein écran et sombre : la barre s'y accorde, sinon elle
   découpe un bandeau blanc au bas d'une image. La pastille, elle, ne change
   pas — c'est le repère qui doit rester constant d'un écran à l'autre. */
.dir .nav.dark{background:rgba(10,16,12,.97);border-top-color:#22332B;}
.dir .nav.dark a{color:#8FA79A;}          /*  7,47:1 */
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
