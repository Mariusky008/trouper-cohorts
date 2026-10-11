/**
 * 🎨 LA FEUILLE DU DRESSING — Mon dressing, l'ajout d'une pièce, le look.
 *
 * LES TONS DE LA MAQUETTE, QUI SONT CEUX DE MA MAISON : un brun très sombre,
 * une lueur chaude en haut, le bouton doré des surprises (`.sp-cta`), des
 * vignettes crème pour les vêtements — une pièce photographiée sur un mur clair
 * se lit mieux sur du clair que sur du brun.
 *
 * TOUT EST PRÉFIXÉ `dr-` : le dressing s'ouvre par-dessus l'application, Ma
 * Maison et la page d'une boutique, et ne doit rien leur prendre.
 */
export function StylesDressing() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.dr{position:fixed;inset:0;z-index:3000;display:flex;flex-direction:column;color:#FFF4E6;
  background:radial-gradient(120% 60% at 50% -8%,rgba(246,181,75,.16),rgba(246,181,75,0) 60%),#1A120C;
  font-family:inherit;-webkit-font-smoothing:antialiased;}
.dr.dedans{position:relative;inset:auto;z-index:auto;min-height:100%;background:transparent;}
.dr.dedans .dr-corps{overflow:visible;}
.dr-corps{flex:1;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 16px calc(28px + env(safe-area-inset-bottom));}
.dr-tete{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:8px;padding:calc(12px + env(safe-area-inset-top)) 16px 6px;}
.dr-tete h1{margin:0;text-align:center;font-size:21px;line-height:1.1;font-weight:850;letter-spacing:-.01em;color:#fff;}
.dr-tete p{margin:3px 0 0;text-align:center;font-size:13px;color:#BFAE98;}
.dr-rond{display:grid;place-items:center;width:44px;height:44px;padding:0;border-radius:50%;cursor:pointer;font-size:18px;color:#fff;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,240,230,.18);}
.dr-rond:disabled{opacity:.35;cursor:default;}
.dr-rond svg{width:20px;height:20px;}

/* LES BOUTONS : doré plein (le geste du moment), doré contour (l'autre chemin), texte. */
.dr-cta{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;min-height:52px;padding:14px 14px;border:0;border-radius:16px;cursor:pointer;
  font-size:16px;font-weight:900;letter-spacing:-.015em;line-height:1.2;color:#2a1405;text-align:center;
  background:linear-gradient(180deg,#FFD27A,#F39C2B);box-shadow:0 12px 28px -12px rgba(243,156,43,.9),inset 0 1px 0 rgba(255,255,255,.6);}
.dr-cta:disabled{opacity:.5;cursor:default;}
.dr-cta svg,.dr-bis svg{width:21px;height:21px;flex:none;}
.dr-bis{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:50px;padding:13px 18px;border-radius:16px;cursor:pointer;
  font-size:15.5px;font-weight:800;color:#F6C26B;background:rgba(246,181,75,.04);border:1.5px solid rgba(246,181,75,.75);}
.dr-lien{display:block;margin:12px auto 0;padding:8px 10px;border:0;background:transparent;cursor:pointer;font-size:14.5px;font-weight:700;color:#D9CCBC;text-align:center;}
.dr-pile{display:grid;gap:10px;margin-top:18px;}

/* LE FANTÔME ET SA LUEUR */
.dr-fant{display:block;margin:0 auto;width:150px;height:auto;filter:drop-shadow(0 10px 26px rgba(246,181,75,.45));animation:dr-flotte 4.6s ease-in-out infinite;}
@keyframes dr-flotte{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}
.dr-titre{margin:14px 0 0;text-align:center;font-size:25px;line-height:1.15;font-weight:900;letter-spacing:-.015em;color:#fff;}
.dr-sous{margin:8px auto 0;max-width:330px;text-align:center;font-size:14.5px;line-height:1.45;color:#CDBFAE;}
.dr-or{color:#F6B54B;}

/* L'ACCUEIL DE MON DRESSING */
.dr-hero{display:grid;grid-template-columns:132px 1fr;align-items:center;gap:6px;margin-top:6px;}
.dr-hero .dr-fant{width:132px;margin:0;}
.dr-hero h2{margin:0;font-size:25px;line-height:1.08;font-weight:900;letter-spacing:-.015em;color:#fff;}
.dr-hero p{margin:8px 0 0;font-size:13.5px;line-height:1.42;color:#D8CABA;}
.dr-trois{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0 0;}
.dr-trois div{display:flex;align-items:center;gap:6px;font-size:11px;line-height:1.25;color:#CDBFAE;}
.dr-trois i{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:10px;border:1px solid rgba(246,181,75,.45);color:#F6B54B;font-style:normal;}
.dr-trois svg{width:18px;height:18px;}
.dr-ou{display:flex;align-items:flex-start;gap:8px;margin:16px 0 0;font-size:12.5px;line-height:1.4;color:#A8977F;}
.dr-ou svg{flex:none;width:17px;height:17px;margin-top:1px;color:#C9A36A;}
.dr-ou b{color:#E9D9C4;font-weight:700;}

.dr-h2{display:flex;align-items:center;justify-content:space-between;margin:24px 0 10px;padding-top:18px;border-top:1px solid rgba(255,240,230,.09);}
.dr-h2 h2{margin:0;font-size:19px;font-weight:850;color:#fff;}
.dr-gerer{display:flex;align-items:center;gap:6px;padding:6px 4px;border:0;background:transparent;cursor:pointer;font-size:14.5px;color:#E2D3C0;}
.dr-gerer svg{width:18px;height:18px;}
.dr-filtres{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px 2px;}
.dr-filtres::-webkit-scrollbar{display:none;}
.dr-filtres button{flex:none;padding:8px 15px;border-radius:999px;cursor:pointer;font-size:13.5px;font-weight:700;color:#E8DCCB;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,240,230,.16);}
.dr-filtres button[aria-pressed="true"]{color:#2a1405;background:linear-gradient(180deg,#FFD27A,#F39C2B);border-color:transparent;}

/* LA GRILLE : des vignettes crème, carrées, trois par ligne. */
.dr-grille{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:14px;}
.dr-vig{position:relative;aspect-ratio:1;padding:0;border-radius:14px;overflow:hidden;cursor:pointer;background:#F2ECE3;border:1px solid rgba(255,240,230,.12);}
.dr-vig img{width:100%;height:100%;object-fit:cover;display:block;}
.dr-vig b{position:absolute;left:6px;right:6px;bottom:6px;padding:3px 6px;border-radius:8px;font-size:11px;font-weight:700;line-height:1.2;color:#2a1a0e;background:rgba(255,255,255,.86);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;}
.dr-vig .dr-moins{position:absolute;top:6px;right:6px;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;font-size:16px;font-weight:900;color:#fff;background:#C8402F;border:2px solid #fff;}
.dr-vig.choisie{outline:3px solid #F6B54B;outline-offset:-3px;}
.dr-vig .dr-coche{position:absolute;top:6px;right:6px;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#F6B54B;color:#2a1405;font-size:14px;font-weight:900;}
.dr-plus{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;aspect-ratio:1;border-radius:14px;cursor:pointer;
  font-size:12px;color:#CDBFAE;background:transparent;border:1.5px dashed rgba(255,240,230,.28);}
.dr-plus span{font-size:28px;line-height:1;color:#fff;font-weight:300;}

/* LE DRESSING VIDE */
.dr-vide{margin-top:14px;padding:22px 16px 20px;border-radius:18px;text-align:center;border:1.5px dashed rgba(255,240,230,.22);}
.dr-vide-dessins{display:flex;justify-content:center;gap:10px;color:rgba(255,240,230,.32);}
.dr-vide-dessins svg{width:34px;height:34px;}
.dr-vide b{display:block;margin-top:12px;font-size:17px;color:#fff;}
.dr-vide p{margin:6px auto 14px;max-width:290px;font-size:13.5px;line-height:1.42;color:#BFAE98;}
.dr-vide .dr-cta{width:auto;display:inline-flex;min-height:46px;padding:11px 22px;font-size:15px;}

/* L'AJOUT : les trois étapes */
.dr-etapes{display:flex;justify-content:space-between;align-items:flex-start;margin:4px 6px 0;position:relative;}
.dr-etapes::before{content:"";position:absolute;left:12%;right:12%;top:15px;height:1px;background:rgba(255,240,230,.18);}
.dr-etapes div{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;width:33%;font-size:12.5px;color:#A8977F;}
.dr-etapes i{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;font-style:normal;font-weight:800;font-size:14px;color:#E8DCCB;background:#1A120C;border:1px solid rgba(255,240,230,.25);}
.dr-etapes .fait i,.dr-etapes .la i{color:#2a1405;background:#F6B54B;border-color:#F6B54B;}
.dr-etapes .la{color:#F6B54B;font-weight:700;}
.dr-conseil{display:grid;grid-template-columns:86px 1fr;align-items:center;gap:8px;margin-top:18px;padding:12px 14px 12px 6px;border-radius:18px;background:rgba(0,0,0,.28);border:1px solid rgba(255,240,230,.1);}
.dr-conseil img{width:86px;height:auto;}
.dr-conseil b{display:block;font-size:15px;color:#fff;}
.dr-conseil ul{margin:6px 0 0;padding:0;list-style:none;display:grid;gap:4px;font-size:13.5px;color:#E2D3C0;}
.dr-conseil li::before{content:"✓";margin-right:7px;color:#F6B54B;font-weight:900;}
.dr-cadre{position:relative;margin:16px auto 0;width:min(78vw,300px);aspect-ratio:3/4;border-radius:18px;overflow:hidden;background:#2A1E15;}
.dr-cadre img{width:100%;height:100%;object-fit:cover;display:block;}
.dr-cadre.vide{display:grid;place-items:center;background:linear-gradient(160deg,#3A2A1C,#22170F);}
.dr-cadre.vide::before,.dr-cadre.vide::after{content:"";position:absolute;width:34px;height:34px;border:3px solid rgba(255,255,255,.75);}
.dr-cadre.vide::before{top:14px;left:14px;border-right:0;border-bottom:0;border-radius:8px 0 0 0;}
.dr-cadre.vide::after{bottom:14px;right:14px;border-left:0;border-top:0;border-radius:0 0 8px 0;}
.dr-cadre.vide svg{width:56px;height:56px;color:rgba(255,255,255,.5);}
.dr-exemples{margin-top:16px;}
.dr-exemples b{display:block;font-size:13px;color:#BFAE98;font-weight:600;}
.dr-exemples div{display:flex;gap:8px;margin-top:8px;}
.dr-exemples span{position:relative;flex:1;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#F2ECE3;}
.dr-exemples span img{width:100%;height:100%;object-fit:cover;}
.dr-exemples span i{position:absolute;top:3px;right:3px;display:grid;place-items:center;width:18px;height:18px;border-radius:50%;font-size:11px;font-style:normal;font-weight:900;color:#fff;background:#2E9B57;}
.dr-exemples span.non i{background:#C8402F;}
.dr-exemples span.non{background:#6B5A4E;}
.dr-note{margin:14px 0 0;font-size:12px;line-height:1.45;color:#9C8B76;text-align:center;}
.dr-erreur{margin:12px 0 0;padding:10px 12px;border-radius:12px;font-size:13.5px;line-height:1.4;color:#FFE1D6;background:rgba(200,64,47,.22);border:1px solid rgba(200,64,47,.5);}

/* L'ANALYSE : le fantôme cherche, la barre avance, les cases se cochent une à une. */
.dr-barre{height:8px;margin:18px auto 0;max-width:280px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.1);}
.dr-barre i{display:block;height:100%;width:100%;transform-origin:left;border-radius:999px;background:linear-gradient(90deg,#FFD27A,#F39C2B);animation:dr-avance 2.2s cubic-bezier(.3,.6,.4,1) forwards;}
.dr-barre.lente i{animation-duration:9s;}
@keyframes dr-avance{from{transform:scaleX(.04);}to{transform:scaleX(.92);}}
.dr-liste{margin:20px auto 0;padding:0;max-width:240px;list-style:none;display:grid;gap:11px;}
.dr-liste li{display:flex;align-items:center;gap:10px;font-size:15px;color:#E8DCCB;opacity:.35;animation:dr-coche .3s ease forwards;}
.dr-liste li i{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;font-size:13px;font-style:normal;font-weight:900;color:#fff;background:#2E9B57;transform:scale(.4);animation:dr-pop .3s ease forwards;animation-delay:inherit;}
@keyframes dr-coche{to{opacity:1;}}
@keyframes dr-pop{to{transform:scale(1);}}

/* LA PIÈCE AJOUTÉE */
.dr-ajoutee{position:relative;margin:18px auto 0;width:170px;aspect-ratio:1;border-radius:18px;overflow:visible;background:#F2ECE3;}
.dr-ajoutee img{width:100%;height:100%;object-fit:cover;border-radius:18px;}
.dr-ajoutee i{position:absolute;left:50%;bottom:-20px;transform:translateX(-50%);display:grid;place-items:center;width:46px;height:46px;border-radius:50%;
  font-style:normal;font-size:24px;font-weight:900;color:#fff;background:#2E9B57;border:3px solid #1A120C;animation:dr-pop .35s ease forwards;}
.dr-puces{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:14px;}
.dr-puces span,.dr-puces button{padding:7px 13px;border-radius:999px;font-size:13.5px;font-weight:700;color:#E8DCCB;background:rgba(255,255,255,.04);border:1px solid rgba(255,240,230,.2);}
.dr-puces button{cursor:pointer;}
.dr-puces button[aria-pressed="true"]{color:#2a1405;background:#F6B54B;border-color:#F6B54B;}
.dr-puces .ton{display:inline-block;width:12px;height:12px;margin-right:6px;border-radius:50%;vertical-align:-1px;border:1px solid rgba(255,255,255,.4);}
.dr-champ{display:block;margin:16px 0 0;}
.dr-champ span{display:block;margin-bottom:6px;font-size:13px;font-weight:700;color:#BFAE98;}
.dr-champ input{width:100%;padding:12px 14px;border-radius:12px;font-size:16px;color:#fff;background:rgba(255,255,255,.05);border:1px solid rgba(255,240,230,.2);}
.dr-question{margin:18px 0 0;font-size:15px;font-weight:800;color:#fff;}

/* LA FICHE D'UNE PIÈCE (feuille du bas) */
.dr-voile{position:fixed;inset:0;z-index:3010;background:rgba(10,6,3,.62);display:flex;align-items:flex-end;}
.dr-feuille{width:100%;max-height:88vh;overflow-y:auto;padding:18px 16px calc(20px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#21170F;border-top:1px solid rgba(255,240,230,.12);}
.dr-feuille .dr-grande{display:block;width:100%;max-width:300px;aspect-ratio:1;margin:0 auto;border-radius:18px;object-fit:cover;background:#F2ECE3;}
.dr-feuille h3{margin:14px 0 0;text-align:center;font-size:20px;color:#fff;}
.dr-retirer{display:block;margin:14px auto 0;padding:10px 14px;border:0;background:transparent;cursor:pointer;font-size:14.5px;font-weight:700;color:#FF9C8A;}

/* ═══ LE LOOK ═══ */
.dr-avantages{margin:18px auto 0;padding:0;max-width:300px;list-style:none;display:grid;gap:12px;}
.dr-avantages li{display:flex;align-items:center;gap:12px;font-size:14.5px;color:#E8DCCB;}
.dr-avantages svg{flex:none;width:26px;height:26px;padding:4px;border-radius:9px;color:#F6B54B;background:rgba(246,181,75,.1);}
.dr-mosaique{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px;}
.dr-mosaique figure{position:relative;margin:0;border-radius:14px;overflow:hidden;background:#F2ECE3;box-shadow:0 0 0 1.5px rgba(246,181,75,.55),0 10px 24px -14px rgba(246,181,75,.8);}
.dr-mosaique img{display:block;width:100%;aspect-ratio:1;object-fit:cover;}
.dr-mosaique figcaption{padding:5px 4px 6px;font-size:10.5px;line-height:1.15;font-weight:700;text-align:center;color:#3A2716;background:#F7F1E8;}
.dr-mosaique i{position:absolute;top:5px;right:5px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;font-size:11px;font-style:normal;font-weight:900;color:#2a1405;background:#F6B54B;}
.dr-mosaique figure.boutique{box-shadow:0 0 0 2.5px #F6B54B,0 10px 24px -10px rgba(246,181,75,.9);}
.dr-encart{display:flex;align-items:center;gap:12px;margin-top:16px;padding:13px 14px;border-radius:16px;font-size:14px;line-height:1.4;color:#E8DCCB;background:rgba(0,0,0,.25);border:1px solid rgba(246,181,75,.25);}
.dr-encart svg{flex:none;width:30px;height:30px;color:#F6B54B;}
.dr-encart b{color:#fff;}
.dr-modifier{padding:7px 13px;border-radius:999px;cursor:pointer;font-size:13.5px;font-weight:800;color:#F6C26B;background:transparent;border:1.5px solid rgba(246,181,75,.7);}
.dr-modifier[aria-pressed="true"]{color:#2a1405;background:#F6B54B;}
.dr-lignes{display:grid;gap:9px;margin-top:10px;}
.dr-ligne{display:flex;align-items:center;gap:12px;margin-top:10px;padding:9px 12px 9px 9px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,240,230,.12);}
.dr-lignes .dr-ligne{margin-top:0;}
.dr-ligne img{flex:none;width:66px;height:66px;border-radius:11px;object-fit:cover;background:#F2ECE3;}
.dr-ligne span{display:flex;flex-direction:column;gap:2px;min-width:0;}
.dr-ligne b{font-size:15px;color:#fff;}
.dr-ligne strong{font-size:16px;font-weight:900;color:#F6B54B;}
.dr-ligne em{display:flex;align-items:center;gap:6px;font-style:normal;font-size:12.5px;color:#BFAE98;}
.dr-ligne em svg{width:15px;height:15px;}
.dr-ligne.boutique{border-color:rgba(246,181,75,.6);background:rgba(246,181,75,.06);}
.dr-ligne.carte{margin-top:18px;border-color:rgba(246,181,75,.45);}
.dr-gardee{align-self:flex-start;margin-top:4px;padding:4px 10px;border-radius:999px;font-size:12.5px;font-weight:800;text-decoration:none;color:#9BE3B4;background:rgba(46,155,87,.16);border:1px solid rgba(46,155,87,.6);}
.dr-rendu{position:relative;margin-top:8px;border-radius:20px;overflow:hidden;background:#2A1E15;aspect-ratio:2/3;}
.dr-rendu-img{display:block;width:100%;height:100%;object-fit:cover;}
.dr-colonne{position:absolute;left:10px;top:10px;bottom:10px;display:flex;flex-direction:column;gap:8px;width:27%;max-width:98px;}
.dr-colonne figure{margin:0;border-radius:12px;overflow:hidden;background:rgba(242,236,227,.96);box-shadow:0 8px 20px -10px rgba(0,0,0,.6);}
.dr-colonne img{display:block;width:100%;aspect-ratio:1;object-fit:cover;}
.dr-colonne figcaption{padding:3px 4px 5px;font-size:10px;line-height:1.15;font-weight:700;text-align:center;color:#3A2716;}
.dr-planche{display:grid;grid-template-columns:1.25fr 1fr;gap:8px;width:100%;height:100%;padding:12px 12px 12px 39%;background:#F2ECE3;}
.dr-rendu .dr-planche{padding-left:calc(27% + 22px);}
.dr-planche img{width:100%;height:100%;object-fit:contain;}
.dr-planche>div{display:grid;gap:8px;grid-auto-rows:1fr;}
.dr-planche.petite{padding:10px;aspect-ratio:4/5;border-radius:14px;}
.dr-carrousel{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;margin:8px -16px 0;padding:4px 16px 10px;scrollbar-width:none;}
.dr-carrousel::-webkit-scrollbar{display:none;}
.dr-idee{flex:none;width:78%;scroll-snap-align:center;display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:20px;background:rgba(255,255,255,.035);border:1.5px solid rgba(255,240,230,.12);}
.dr-idee.vue{border-color:#F6B54B;}
.dr-idee-img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:14px;}
.dr-idee b{margin-top:4px;font-size:16px;color:#fff;text-align:center;}
.dr-idee em{font-style:normal;font-size:12.5px;color:#BFAE98;text-align:center;}
.dr-idee-pieces{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:4px;}
.dr-idee-pieces img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;background:#F2ECE3;}
.dr-idee-raison{margin:4px 0 2px;font-size:12.5px;line-height:1.35;color:#D8CABA;text-align:center;}
.dr-idee .dr-cta,.dr-idee .dr-bis{min-height:44px;padding:10px;font-size:14.5px;margin-top:auto;}
.dr-points{display:flex;justify-content:center;gap:7px;margin-top:6px;}
.dr-points i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.25);}
.dr-points i.la{background:#F6B54B;}
.dr-hero-look{display:grid;grid-template-columns:44% 1fr;gap:12px;align-items:center;margin-top:8px;padding:10px;border-radius:20px;border:1.5px solid rgba(246,181,75,.55);background:rgba(246,181,75,.05);}
.dr-hero-look>img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:14px;}
.dr-hero-look>div{display:flex;flex-direction:column;gap:6px;}
.dr-k{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#F6B54B;}
.dr-hero-look b{font-size:20px;line-height:1.1;color:#fff;}
.dr-hero-look em{font-style:normal;font-size:13px;line-height:1.4;color:#D8CABA;}

/* ═══ « COMMENT VOULEZ-VOUS L'ESSAYER ? » ═══ */
.dr-choix{position:relative;color:#FFF4E6;}
.dr-choix-x{position:absolute;top:12px;right:12px;width:38px;height:38px;}
.dr-choix-tete{position:relative;width:150px;margin:6px auto 0;}
.dr-choix-tete .piece{display:block;width:150px;height:150px;border-radius:20px;object-fit:cover;background:#F2ECE3;box-shadow:0 0 0 2px rgba(246,181,75,.6);}
.dr-choix-tete .fant{position:absolute;right:-54px;bottom:-14px;width:84px;filter:drop-shadow(0 8px 16px rgba(0,0,0,.45));}
.dr-choix h3{margin:14px 0 0;text-align:center;font-size:18px;color:#fff;}
.dr-choix-q{margin:4px 0 14px;text-align:center;font-size:14px;color:#BFAE98;}
.dr-option{display:flex;align-items:center;gap:12px;width:100%;margin-top:10px;padding:13px 14px;border-radius:16px;cursor:pointer;text-align:left;color:#FFF4E6;
  background:rgba(255,255,255,.035);border:1px solid rgba(255,240,230,.14);}
.dr-option.une{border:1.5px solid #F6B54B;background:rgba(246,181,75,.08);}
.dr-option i{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:12px;color:#F6B54B;background:rgba(246,181,75,.1);}
.dr-option i svg{width:22px;height:22px;}
.dr-option span{flex:1;display:flex;flex-direction:column;gap:2px;}
.dr-option b{font-size:15.5px;}
.dr-option.une b{color:#F6C26B;}
.dr-option em{font-style:normal;font-size:12.5px;color:#BFAE98;}
.dr-option>svg{flex:none;width:18px;height:18px;color:#8C7B66;}

@media (max-width:360px){.dr-tete h1{font-size:18px;}.dr-tete p{font-size:12px;}.dr-hero{grid-template-columns:104px 1fr;}.dr-hero .dr-fant{width:104px;}.dr-hero h2{font-size:22px;}.dr-trois{grid-template-columns:1fr;}.dr-titre{font-size:22px;}}
@media (prefers-reduced-motion: reduce){.dr-fant{animation:none;}.dr-barre i{animation-duration:.01s;}.dr-liste li,.dr-liste li i,.dr-ajoutee i{animation-duration:.01s;animation-delay:0s !important;}}
`,
      }}
    />
  );
}
