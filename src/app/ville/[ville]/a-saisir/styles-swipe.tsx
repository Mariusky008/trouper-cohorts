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
/* La coque passe en sombre pour cet onglet : une barre blanche sous une carte
   plein écran découpe l'image et casse l'effet de pile. */
.dir:has(.asx),.dir:has(.asx-fin){background:radial-gradient(120% 70% at 50% -10%,#1B2E25 0%,#080F0B 60%);}
.dir:has(.asx) .vue,.dir:has(.asx-fin) .vue{display:flex;flex-direction:column;min-height:100dvh;}

.asx{flex:1;display:flex;flex-direction:column;padding:18px 16px 0;color:#fff;min-height:0;}
.asx-top{display:flex;align-items:flex-start;gap:10px;}
.asx-top .t{font-size:12.5px;font-weight:700;}
.asx-top .s{font-size:9.5px;color:#8FA79A;margin-top:2px;}
.asx-cnt{margin-left:auto;text-align:right;flex:none;}
.asx-cnt b{display:block;font-size:12px;font-weight:700;color:#3FD79A;}
.asx-cnt span{font-size:8.5px;color:#8FA79A;}
.asx-jauge{height:3px;border-radius:2px;background:rgba(255,255,255,.12);margin-top:9px;overflow:hidden;}
.asx-jauge span{display:block;height:100%;background:#3FD79A;transition:width .28s ease;}

.asx-pile{flex:1;position:relative;margin-top:14px;min-height:320px;}
.asx-derr{position:absolute;border-radius:20px;background:#22382D;}
.asx-derr.b2{left:15px;right:15px;top:9px;bottom:11px;transform:rotate(2.5deg);}
.asx-derr.b1{left:7px;right:7px;top:4px;bottom:5px;background:#2E4A3C;transform:rotate(-1.8deg);}
.asx-carte{position:absolute;inset:0;border-radius:20px;overflow:hidden;background:#fff;
  box-shadow:0 15px 34px -13px rgba(0,0,0,.7);display:flex;flex-direction:column;
  transition:transform .22s cubic-bezier(.2,.7,.3,1);touch-action:none;cursor:grab;user-select:none;}
.asx-carte:active{cursor:grabbing;}

/* La photo absorbe l'espace disponible, le texte prend ce qu'il lui faut.
   À hauteur fixe, une annonce courte laissait un grand vide blanc sous elle —
   sur un écran dont l'argument est l'image, c'est le pire endroit où mettre du
   blanc. */
.asx-img{flex:1;min-height:170px;position:relative;background-size:cover;background-position:center;
  background-color:#2E4A3C;background-image:linear-gradient(140deg,#D8B08C,#8A5A3B);}
.asx-ech{position:absolute;top:11px;left:11px;background:rgba(210,99,74,.95);color:#fff;font-size:9px;
  font-weight:700;padding:5px 10px;border-radius:12px;text-transform:uppercase;letter-spacing:.03em;}
.asx-dist{position:absolute;top:11px;right:11px;background:rgba(255,255,255,.94);color:#14201A;font-size:9px;
  font-weight:700;padding:5px 10px;border-radius:12px;}
.asx-voile{position:absolute;left:0;right:0;bottom:0;height:72px;background:linear-gradient(180deg,transparent,rgba(20,32,26,.88));}
.asx-qui{position:absolute;bottom:11px;left:13px;right:13px;color:#fff;}
.asx-qui em{display:block;font-size:9px;letter-spacing:.14em;text-transform:uppercase;opacity:.85;font-style:normal;}
.asx-qui b{display:block;font-family:var(--fd),Georgia,serif;font-size:19px;font-weight:600;line-height:1.15;}
.asx-tampon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-11deg);
  border:3px solid #fff;color:#fff;font-size:19px;font-weight:800;letter-spacing:.09em;padding:7px 15px;
  border-radius:9px;background:rgba(20,32,26,.42);}

.asx-corps{padding:14px 15px 15px;flex:none;}
.asx-texte{font-family:var(--fd),Georgia,serif;font-size:16px;font-weight:600;color:#14201A;line-height:1.32;margin:0;}
.asx-quand{margin-top:9px;font-size:10px;color:#6B7A72;}

.asx-boutons{display:flex;justify-content:center;gap:14px;margin-top:16px;}
.asx-boutons .b{border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;}
.asx-boutons .s{width:46px;height:46px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);color:#C9D8D0;font-size:17px;}
.asx-boutons .g{width:57px;height:57px;background:linear-gradient(150deg,#4FE0A0,#2E9E74);border:none;color:#08140E;
  font-size:22px;box-shadow:0 8px 19px -6px rgba(79,224,160,.65);}
.asx-leg{display:flex;justify-content:center;gap:14px;margin-top:7px;}
/* `nowrap` : « La boutique » passait à la ligne dans sa boîte de 46 px, et une
   légende sur deux lignes déséquilibre les trois boutons qu'elle décrit. */
.asx-leg span{width:46px;text-align:center;font-size:8.5px;color:#7C9186;font-weight:600;white-space:nowrap;}
.asx-leg .mid{width:57px;color:#3FD79A;font-weight:700;}
.asx-aide{text-align:center;font-size:9px;color:#7C9186;margin:8px 0 16px;}

.asx-fin{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:40px 28px 90px;color:#fff;}
.asx-fin h2{font-family:var(--fd),Georgia,serif;font-size:22px;font-weight:600;margin:0 0 10px;}
.asx-fin p{font-size:12.5px;color:#9DB5A8;line-height:1.65;margin:0;max-width:340px;}
.asx-retour{margin-top:22px;background:#3FD79A;color:#08140E;border:none;border-radius:23px;
  padding:13px 24px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}

@media (prefers-reduced-motion:reduce){.asx-carte,.asx-jauge span{transition:none!important;}}
`,
      }}
    />
  );
}
