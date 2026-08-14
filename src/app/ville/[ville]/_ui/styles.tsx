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
/* La ligne de marqueurs est EN TÊTE, pas en pied : distance, fraîcheur,
   échéance. C'est elle qui crée le réflexe — reléguée en bas, elle ne se lit
   qu'après avoir décidé, donc jamais. */
.dir .meta{display:flex;align-items:center;gap:5px;padding:10px 12px 0;font-size:9.5px;font-weight:700;flex-wrap:wrap;}
.dir .meta .dist{color:var(--ink);}
.dir .meta .sep{color:var(--faint);}
.dir .meta .fresh{color:var(--g);}
.dir .meta .left{color:var(--red);}
.dir .meta .kind{margin-left:auto;font-size:8px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 7px;border-radius:9px;}
.dir .k-place{background:#FBE9E4;color:var(--red);}
.dir .k-offre{background:var(--gs);color:var(--gd);}
/* Le plat du jour a sa propre couleur : confondu avec « Offre », on ne
   distinguerait plus la seule famille qui meurt à la fin du service. */
.dir .k-menu{background:#FBF2DF;color:#A56C11;}
.dir .k-evenement{background:#EDE9F8;color:var(--vio);}
.dir .k-ville{background:#FBF3E3;color:#8A6A22;}
.dir .post .ph{display:flex;align-items:center;gap:9px;padding:8px 12px;text-decoration:none;}
.dir .post .pav{width:29px;height:29px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;
  font-size:12px;color:#fff;font-weight:700;background:#3C4A43;}
.dir .post .pn{font-size:12px;font-weight:700;color:var(--ink);line-height:1.2;}
.dir .post .pm{font-size:9px;color:var(--faint);}
.dir .post .pb{padding:0 12px 10px;font-size:12.5px;color:var(--ink);line-height:1.45;}
.dir .post .pimg{height:150px;background-size:cover;background-position:center;background-color:#DDE4E0;}

/* ── L'IMAGE D'ABORD ──────────────────────────────────────────────────────
   La carte s'ouvre sur l'image, et le texte est POSÉ DESSUS. Photo en bas de
   carte, on lit une notice ; photo en tête avec le titre dedans, on regarde une
   vitrine. C'est le même contenu et ce n'est pas le même geste.

   REPLI SANS PHOTO : jamais de carte vide dans un fil qui vit de l'image. Un
   aplat teinté porte le nom du commerce en grand — mieux vaut un carton propre
   qu'une photo de vitrine posée à côté d'un plat qu'elle ne montre pas. Une
   image qui ne correspond pas à l'annonce est un mensonge par juxtaposition,
   et elle coûte plus cher que pas d'image du tout. */
.dir .pic{position:relative;height:246px;overflow:hidden;background:#2A2318;}
.dir .pic .fond{position:absolute;inset:0;background-size:cover;background-position:center;}
.dir .pic .voile{position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(14,42,28,.46) 0,rgba(14,42,28,0) 26%,rgba(14,42,28,.32) 52%,rgba(14,42,28,.92) 100%);}
.dir .pic .repli{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:22px;}
.dir .pic .repli span{font-family:var(--fd),Georgia,serif;font-size:27px;line-height:1.15;color:#fff;
  text-align:center;opacity:.92;}
.dir .pic .bg{position:absolute;top:12px;left:12px;background:rgba(255,255,255,.94);color:var(--ink);
  border-radius:999px;padding:5px 11px;font-size:10.5px;font-weight:800;}
.dir .pic .bd{position:absolute;top:12px;right:12px;background:rgba(14,42,28,.74);color:#fff;
  border-radius:999px;padding:5px 11px;font-size:10.5px;font-weight:800;}
.dir .sur{position:absolute;left:14px;right:14px;bottom:13px;color:#fff;text-decoration:none;display:block;}
.dir .sur .pastille{display:inline-block;background:var(--gl);color:#0E2A1C;border-radius:999px;
  padding:5px 11px;font-size:10.5px;font-weight:800;letter-spacing:.02em;}
.dir .sur .conf{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#D5E5DB;margin-top:9px;}
.dir .sur .conf i{width:6px;height:6px;border-radius:50%;background:var(--gl);font-style:normal;}
.dir .sur h3{font-family:var(--fd),Georgia,serif;font-size:20px;font-weight:600;line-height:1.22;margin:6px 0 0;color:#fff;}
.dir .sur .qui{font-size:11.5px;color:#CFE0D6;margin-top:4px;}
.dir .post .pf{display:flex;align-items:center;gap:8px;padding:9px 12px;border-top:1px solid var(--line);}
.dir .act{font-size:11px;font-weight:700;padding:7px 13px;border-radius:16px;background:var(--ink);color:#fff;
  text-decoration:none;border:none;cursor:pointer;font-family:inherit;}
.dir .act.gh{background:#fff;border:1px solid var(--line2);color:var(--body);}
.dir .coeur{margin-left:auto;font-size:17px;color:var(--faint);background:none;border:none;cursor:pointer;padding:2px 4px;line-height:1;}
.dir .coeur.on{color:var(--red);}

/* ── état vide ───────────────────────────────────────────────────────────── */
.dir .vide{margin:16px;padding:26px 20px;background:#fff;border:1px solid var(--line);border-radius:14px;text-align:center;}
.dir .vide h3{font-family:var(--fd),Georgia,serif;font-size:17px;font-weight:600;color:var(--ink);margin:0 0 7px;}
.dir .vide p{font-size:12px;color:var(--soft);line-height:1.6;margin:0;}

/* ── onglets ─────────────────────────────────────────────────────────────── */
.dir .nav{position:fixed;left:0;right:0;bottom:0;background:rgba(255,255,255,.97);backdrop-filter:blur(10px);
  border-top:1px solid var(--line);display:flex;padding:8px 0 max(12px,env(safe-area-inset-bottom));z-index:60;}
.dir .nav a{flex:1;text-align:center;font-size:8.5px;color:var(--faint);font-weight:600;text-decoration:none;}
.dir .nav a .i{display:block;font-size:15px;margin-bottom:3px;}
.dir .nav a.on{color:var(--g);}
.dir .nav.dark{background:rgba(10,16,12,.97);border-top-color:#22332B;}
.dir .nav.dark a{color:#6E8579;} .dir .nav.dark a.on{color:var(--gl);}

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
.dir .prof .av{width:58px;height:58px;border-radius:50%;background:linear-gradient(150deg,#4FE0A0,#2E9E74);
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
