/**
 * 🎨 LA FEUILLE DU PARCOURS COIFFURE — voir `parcours-coiffure-ecran.tsx`.
 *
 * ATTENTION AUX ACCENTS GRAVES DANS CES COMMENTAIRES : la feuille est servie
 * dans un litteral de gabarit, et un accent grave le referme au milieu. Voir
 * `scripts/verifier-styles-en-ligne.mjs`.
 *
 * SA COQUE TIENT EN TROIS OBJETS FIXES — le logo et la frise en haut, la
 * pastille du salon sous eux, le fantome a droite — et une photo qui prend tout
 * le reste. Les quatre etapes ne changent que ce qui est EN BAS de la photo.
 */
export function StylesParcoursCoiffure() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .pc{position:absolute;inset:0;z-index:40;overflow:hidden;
          display:flex;flex-direction:column;
          background:#06060A;
          font-family:var(--font-clikme),system-ui,sans-serif;color:#fff;
          -webkit-user-select:none;user-select:none;}
        .pc-fond{position:absolute;inset:0;background-size:cover;
          background-position:center 12%;}
        /* LE VOILE NE COUVRE QUE LE BAS ET LE TOUT EN HAUT : le milieu, c'est le
           visage, et c'est ce qu'on vient regarder. */
        .pc-voile{position:absolute;inset:0;pointer-events:none;
          background:linear-gradient(180deg,
            rgba(6,6,10,.82) 0%, rgba(6,6,10,.34) 15%, rgba(6,6,10,0) 32%,
            rgba(6,6,10,.5) 58%, rgba(6,6,10,.93) 78%, #06060A 100%);}

        /* ═══ LA COQUE ════════════════════════════════════════════════════ */
        .pc-haut{position:relative;z-index:3;flex:none;
          display:flex;align-items:center;gap:10px;
          padding:calc(8px + var(--ap-encoche,0px)) 14px 0;}
        .pc-logo{margin:0;flex:none;font-weight:900;
          font-size:clamp(24px,min(7.2vw,3.5vh),32px);line-height:1;
          letter-spacing:-.03em;text-shadow:0 2px 12px rgba(0,0,0,.7);}
        .pc-logo b{color:#fff;font-weight:900;}
        .pc-logo i{font-style:normal;color:#FF2E9A;font-weight:900;}
        /* LA FRISE ET SON CHIFFRE, au milieu : quatre ronds relies par un trait,
           comme sur ses quatre maquettes. Le rond se remplit, le trait aussi. */
        .pc-pas{flex:1 1 auto;position:relative;
          display:flex;align-items:center;justify-content:center;gap:0;}
        .pc-pas s{width:11px;height:11px;border-radius:50%;text-decoration:none;
          background:rgba(255,255,255,.22);flex:none;
          box-shadow:0 0 0 1.5px rgba(255,255,255,.3) inset;}
        .pc-pas s+s{margin-left:20px;}
        .pc-pas s+s::before{content:"";position:absolute;width:20px;height:2.5px;
          margin:4px 0 0 -20px;background:rgba(255,255,255,.22);}
        .pc-pas s.on{background:#FF2E9A;box-shadow:0 0 10px rgba(255,46,154,.8);}
        .pc-pas s.on+s.on::before{background:#FF2E9A;}
        .pc-pas em{position:absolute;top:100%;margin-top:3px;font-style:normal;
          font-size:12.5px;font-weight:850;text-shadow:0 1px 8px rgba(0,0,0,.8);}
        .pc-f{flex:none;width:clamp(48px,min(13vw,6.4vh),64px);height:auto;
          filter:drop-shadow(0 0 16px rgba(196,132,255,.65));}

        /* LA PASTILLE DU SALON : elle dit chez qui on est, aux quatre etapes. */
        .pc-salon{position:relative;z-index:3;flex:none;align-self:flex-start;
          display:flex;align-items:center;gap:10px;
          margin:12px 0 0 14px;padding:6px 6px 6px 6px;border-radius:999px;
          background:rgba(12,10,16,.72);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
          max-width:calc(100% - 28px);}
        .pc-salon-v{flex:none;width:42px;height:42px;border-radius:50%;
          background-size:cover;background-position:center;
          border:1.5px solid rgba(255,255,255,.4);}
        .pc-salon-t{min-width:0;display:flex;flex-direction:column;gap:1px;}
        .pc-salon-t b{font-size:14px;font-weight:900;letter-spacing:-.015em;
          line-height:1.14;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .pc-salon-t em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:12px;font-weight:750;color:rgba(255,255,255,.76);
          white-space:nowrap;}
        .pc-salon-t i{font-style:normal;font-size:10px;}
        .pc-sortir{flex:none;width:34px;height:34px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          font:inherit;cursor:pointer;color:#fff;
          background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);}
        .pc-sortir svg{width:17px;height:17px;fill:none;stroke:currentColor;
          stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
        .pc-sortir:active{transform:scale(.92);}

        /* ═══ CE QUI CHANGE : LE BAS DE L'ECRAN ══════════════════════════ */
        .pc-bas{position:relative;z-index:3;margin-top:auto;
          padding:0 16px calc(14px + var(--ap-bas,0px));text-align:center;}
        .pc-t{margin:0;font-size:clamp(26px,min(8.2vw,4.2vh),36px);
          font-weight:900;line-height:1.05;letter-spacing:-.03em;
          text-shadow:0 2px 16px rgba(0,0,0,.85);}
        .pc-t.court{font-size:clamp(23px,min(7vw,3.6vh),31px);}
        .pc-t em{font-style:normal;color:#FF2E9A;}
        .pc-sous{margin:6px 0 0;font-size:15px;font-weight:750;
          color:rgba(255,255,255,.88);text-shadow:0 1px 10px rgba(0,0,0,.85);}
        /* L'ANNONCE DU JOUR, sous la coupe : c'est elle qui dit pourquoi
           maintenant. Discrete, parce que ce n'est pas ce qu'on essaie. */
        .pc-annonce{margin:5px 0 0;display:inline-block;padding:5px 12px;
          border-radius:999px;font-size:12.5px;font-weight:800;color:#FFD9EC;
          background:rgba(255,46,154,.16);border:1px solid rgba(255,46,154,.45);}
        .pc-prix{margin:6px 0 0;font-size:clamp(22px,6.4vw,28px);font-weight:900;
          letter-spacing:-.02em;color:#FFD233;
          text-shadow:0 2px 12px rgba(0,0,0,.85);}
        .pc-simu{margin:7px 0 0;font-size:12.5px;font-weight:700;
          color:rgba(255,255,255,.6);text-shadow:0 1px 8px rgba(0,0,0,.8);}

        .pc-go{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;margin:13px 0 0;padding:15px 18px;
          font:inherit;font-size:clamp(16px,4.8vw,19px);font-weight:900;
          letter-spacing:-.01em;color:#fff;cursor:pointer;text-decoration:none;
          border:0;border-radius:999px;
          background:linear-gradient(96deg,#FF2E9A,#FF4FB0 52%,#FF2E9A);
          box-shadow:0 14px 34px -10px rgba(255,46,154,.85),
            0 0 0 1px rgba(255,255,255,.12) inset;
          transition:transform .12s ease;}
        .pc-go:active{transform:scale(.98);}
        .pc-deux{display:flex;align-items:center;justify-content:center;gap:11px;
          width:100%;margin:10px 0 0;padding:13px 18px;
          font:inherit;font-size:15.5px;font-weight:850;cursor:pointer;
          color:#fff;background:rgba(255,255,255,.04);
          border:1.5px solid rgba(255,255,255,.24);border-radius:999px;}
        .pc-deux:active{transform:scale(.98);}
        .pc-go s,.pc-deux s{text-decoration:none;font-size:1.05em;}
        .pc-i{flex:none;width:23px;height:23px;fill:none;stroke:currentColor;
          stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}

        /* ═══ 2/4 · LA GLISSIERE ════════════════════════════════════════
           ELLE PREND L'ECRAN ENTIER, comme sur sa maquette : la comparaison
           EST l'ecran, elle n'y est pas posee. */
        .pc-gliss{position:absolute;inset:0;touch-action:none;cursor:ew-resize;}
        .pc-g-img{position:absolute;inset:0;background-size:cover;
          background-position:center 12%;}
        /* ON DECOUPE, ON NE REDIMENSIONNE PAS — meme raison que sur le parcours
           mode : redimensionner la boite change le cadrage, et les deux moities
           ne se comparent plus. */
        .pc-g-img.avant{clip-path:inset(0 calc(100% - var(--pc-g,50%)) 0 0);}
        .pc-g-trait{position:absolute;top:0;bottom:0;z-index:2;
          left:var(--pc-g,50%);width:2px;margin-left:-1px;
          background:rgba(255,255,255,.85);
          box-shadow:0 0 14px rgba(255,255,255,.5);}
        .pc-g-et{position:absolute;z-index:3;bottom:30%;padding:9px 18px;
          border-radius:999px;font-size:15px;font-weight:900;color:#fff;
          box-shadow:0 8px 22px -8px rgba(0,0,0,.8);}
        .pc-g-et.g{left:7%;background:rgba(32,30,38,.86);
          border:1px solid rgba(255,255,255,.2);}
        .pc-g-et.d{right:7%;background:#FF2E9A;}

        /* ═══ 3/4 · LES AUTRES COUPES ═══════════════════════════════════ */
        .pc-trois{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;
          margin:12px 0 0;}
        .pc-vign{position:relative;border-radius:14px;overflow:hidden;
          border:1px solid rgba(255,255,255,.16);
          box-shadow:0 10px 26px -12px rgba(0,0,0,.9);}
        .pc-vign>div{aspect-ratio:1 / 1.3;background-size:cover;
          background-position:center 18%;}
        .pc-vign>span{position:absolute;left:0;right:0;bottom:0;
          display:flex;flex-direction:column;gap:1px;padding:20px 7px 7px;
          text-align:left;
          background:linear-gradient(180deg,rgba(6,6,10,0),rgba(6,6,10,.94));}
        .pc-vign b{font-size:10.5px;font-weight:850;line-height:1.16;color:#fff;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .pc-vign em{font-style:normal;font-size:12px;font-weight:900;color:#FF2E9A;}
        /* CHEZ QUI : petit, sous le prix. Toutes ces coupes ne sont pas du meme
           salon, et une vignette qui ne le dit pas laisse croire qu'elles le
           sont. */
        .pc-vign u{text-decoration:none;font-size:9px;font-weight:700;
          line-height:1.14;color:rgba(255,255,255,.62);
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}

        /* ═══ 4/4 · LA FICHE ════════════════════════════════════════════ */
        .pc-fiche{display:flex;align-items:center;gap:12px;width:100%;
          margin:12px 0 0;padding:10px 14px;border-radius:16px;text-align:left;
          background:rgba(20,18,26,.72);border:1px solid rgba(255,255,255,.14);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .pc-fiche-v{flex:none;width:52px;height:52px;border-radius:12px;
          background-size:cover;background-position:center 15%;}
        .pc-fiche-t{min-width:0;flex:1 1 auto;display:flex;flex-direction:column;gap:3px;}
        .pc-fiche-t b{font-size:15px;font-weight:900;letter-spacing:-.015em;
          color:#fff;line-height:1.16;
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
          overflow:hidden;}
        .pc-fiche-t em{display:flex;align-items:center;gap:5px;font-style:normal;
          font-size:12px;font-weight:700;color:rgba(255,255,255,.72);
          overflow:hidden;}
        .pc-fiche-t i{font-style:normal;font-size:10px;}
        .pc-fiche-p{flex:none;font-size:clamp(18px,5.2vw,22px);font-weight:900;
          letter-spacing:-.02em;color:#FFD233;}

        @media (prefers-reduced-motion:reduce){
          .pc-go,.pc-deux,.pc-sortir{transition:none;}
        }
      `,
      }}
    />
  );
}
