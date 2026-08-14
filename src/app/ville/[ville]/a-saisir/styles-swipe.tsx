// Les styles de l'écran « À saisir ».
//
// Ils vivent à part de ceux du Direct parce que cet écran est le seul à être
// plein écran et sombre : mélangés aux autres, ils seraient chargés par les
// trois écrans qui n'en ont pas besoin, et surtout on finirait par les retoucher
// « pour le fil » sans voir qu'on casse le swipe.
export function StylesSwipe() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* L'écran est PLEIN ÉCRAN ET SOMBRE : le glissement vertical réserve, et un
   geste vertical ne peut pas cohabiter avec une page qui défile — le
   navigateur gagnerait toujours. La coque s'assombrit avec lui, sinon une
   barre claire découpe le bas d'une image. */
.dir:has(.asx),.dir:has(.asx-fin){background:#0A1310;}
.dir:has(.asx) .vue,.dir:has(.asx-fin) .vue{display:flex;flex-direction:column;min-height:100dvh;padding-bottom:0;}

.asx{flex:1;display:flex;flex-direction:column;padding:20px 14px 0;color:#fff;min-height:0;}
.asx-top{display:flex;align-items:center;gap:11px;}
.asx-top .t{font-size:13px;font-weight:800;color:#fff;}
.asx-top .s{color:#7E9A8D;font-size:10.5px;margin-top:2px;}

/* UNE BARRE PAR CARTE, pas une jauge continue. Une jauge dit « vous avancez » ;
   des segments disent « il en reste trois », ce qui est la seule question
   qu'on se pose en glissant. */
.asx-seg{display:flex;gap:4px;margin-top:12px;}
.asx-seg i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.2);}
.asx-seg i.on{background:#fff;}

.asx-pile{flex:1;display:flex;flex-direction:column;min-height:0;margin-top:13px;}
.asx-stack{position:relative;flex:1;min-height:0;}
/* La pile derrière : deux barres décalées, pas des cartes tournées. Un empilage
   penché fait « jeu de cartes » ; deux traits droits font « il y en a
   d'autres », ce qui est l'information. */
.asx-derr{position:absolute;border-radius:24px;}
.asx-derr.b2{left:16px;right:16px;top:-9px;height:26px;background:#22392C;}
.asx-derr.b1{left:8px;right:8px;top:-4px;height:20px;background:#31543F;}

.asx-carte{position:absolute;inset:0;border-radius:26px;overflow:hidden;background:#fff;
  box-shadow:0 22px 46px -18px rgba(0,0,0,.85);display:flex;flex-direction:column;
  transition:transform .22s cubic-bezier(.2,.7,.3,1);touch-action:none;cursor:grab;user-select:none;}
.asx-carte:active{cursor:grabbing;}

/* La photo absorbe l'espace disponible, le reste prend ce qu'il lui faut. */
.asx-img{flex:1;min-height:140px;position:relative;background-size:cover;background-position:center;
  background-color:#2E4A3C;}
.asx-mono{position:absolute;top:50%;left:50%;transform:translate(-50%,-62%);
  font-family:var(--fd),Georgia,serif;font-size:82px;line-height:1;color:#fff;letter-spacing:.05em;opacity:.17;}
.asx-ech{position:absolute;top:13px;left:13px;background:#C4553A;color:#fff;font-size:12.5px;
  font-weight:800;padding:8px 14px;border-radius:999px;}
.asx-dist{position:absolute;top:13px;right:13px;background:rgba(14,42,28,.8);backdrop-filter:blur(8px);
  color:#fff;font-size:13.5px;font-weight:600;padding:8px 15px;border-radius:999px;}
.asx-voile{position:absolute;left:0;right:0;bottom:0;height:120px;
  background:linear-gradient(180deg,transparent,rgba(14,42,28,.95));}
.asx-qui{position:absolute;bottom:14px;left:16px;right:16px;color:#fff;text-shadow:0 1px 3px rgba(8,20,14,.6);}
.asx-qui em{display:block;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;opacity:.85;font-style:normal;}
.asx-qui b{display:block;font-family:var(--fd),Georgia,serif;font-size:21px;font-weight:700;line-height:1.15;margin-top:4px;}
.asx-tampon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-11deg);
  border:3px solid #fff;color:#fff;font-size:21px;font-weight:800;letter-spacing:.09em;padding:8px 17px;
  border-radius:11px;background:rgba(20,32,26,.42);}

.asx-corps{padding:13px 14px 10px;flex:none;}
.asx-texte{font-family:var(--fd),Georgia,serif;font-size:16px;font-weight:700;color:#14201A;line-height:1.3;margin:0;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}

/* L'ÉCHELLE DES PRIX, DANS LA CARTE. Sans elle, on glisse sur des annonces
   sans savoir ce qu'elles proposent — c'est-à-dire qu'on glisse au hasard.
   Réduite, et NON CLIQUABLE : la carte se manipule au doigt, un lien dedans se
   déclencherait à chaque geste raté. */
.asx-fac{padding:0 14px 12px;}
.asx-fac-l{display:flex;align-items:center;gap:10px;border:1.5px solid var(--line2);border-radius:16px;
  padding:9px 11px;margin-bottom:6px;background:#fff;}
.asx-fac-l:last-child{margin-bottom:0;}
.asx-fac-ic{width:32px;height:32px;flex:none;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:15px;background:var(--bg);}
.asx-fac-pr{display:block;font-family:var(--fd),Georgia,serif;font-size:19px;font-weight:700;color:#14201A;line-height:1;}
/* En bloc : côte à côte, « 19 € » et « LE CADEAU » se collaient en
   « 19 €LE CADEAU ». */
.asx-fac-nm{display:block;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;color:var(--soft);margin-top:3px;}
.asx-fac-l.f-cadeau{border-color:#C4E0A8;background:#FBFDF7;}
.asx-fac-l.f-cadeau .asx-fac-ic{background:#E4F2DC;} .asx-fac-l.f-cadeau .asx-fac-nm{color:#2C8A4B;}
.asx-fac-l.f-express{border-color:#F0D9B4;background:#FDF2E4;}
.asx-fac-l.f-express .asx-fac-ic{background:#F8E7CE;} .asx-fac-l.f-express .asx-fac-nm{color:#DB8A2C;}
.asx-fac-l.f-collectif{border-color:#CFC8F2;background:#EEEBFB;}
.asx-fac-l.f-collectif .asx-fac-ic{background:#DFDAF7;} .asx-fac-l.f-collectif .asx-fac-nm{color:#6B5BD4;}

.asx-boutons{flex:none;display:flex;justify-content:center;gap:16px;padding:16px 0 6px;}
.asx-boutons .b{width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.22);color:#fff;font-size:21px;display:flex;align-items:center;
  justify-content:center;cursor:pointer;font-family:inherit;}
/* Le geste principal est le SEUL en lime : trois boutons identiques ne disent
   pas lequel fait avancer. */
.asx-boutons .g{background:rgba(147,208,44,.16);border-color:rgba(147,208,44,.4);color:var(--gl);}
.asx-leg{flex:none;display:flex;justify-content:center;gap:16px;padding-bottom:104px;}
.asx-leg span{width:56px;text-align:center;font-size:9.5px;color:#7E9A8D;font-weight:700;white-space:nowrap;}
.asx-aide{text-align:center;font-size:10.5px;color:#7E9A8D;margin:6px 0 0;}

.asx-fin{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:40px 28px 120px;color:#7E9A8D;}
.asx-fin h2{font-family:var(--fd),Georgia,serif;font-size:22px;font-weight:700;color:#fff;margin:0 0 10px;}
.asx-fin p{font-size:14px;line-height:1.5;margin:0;max-width:340px;}
.asx-retour{margin-top:22px;background:var(--gl);color:#08140E;border:none;border-radius:999px;
  padding:14px 26px;font-family:var(--fd),Georgia,serif;font-size:16px;font-weight:700;cursor:pointer;}

@media (prefers-reduced-motion:reduce){.asx-carte{transition:none!important;}}
`,
      }}
    />
  );
}
