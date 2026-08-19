// Les styles de l'écran des cartes du jour.
//
// Ils vivent à part parce que la page a DEUX états — un défilé, ou un mot pour
// dire qu'il n'y a rien aujourd'hui — et que le second ne monte pas le défilé.
// Écrits dans le composant client, l'écran vide se serait affiché nu.
export function StylesMenus() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* UNE HAUTEUR DÉFINIE, ET C'EST TOUT LE SUJET.
   Avec « min-height », la colonne n'a pas de hauteur arrêtée : le volet grandit
   alors avec l'ardoise — mesuré à 1700 px de haut — la page se met à défiler
   verticalement, et le bouton « Je réserve » se retrouve à un écran et demi
   sous la barre d'onglets, donc invisible. Il faut donc une hauteur FERME, de
   la coque jusqu'au volet, pour que l'ardoise défile DANS sa colonne et pas en
   poussant la page. */
.dir:has(.menus){height:100dvh;overflow:hidden;background:#0A1310;}
.dir:has(.menus) .vue{height:100%;min-height:0;padding-bottom:0;display:flex;flex-direction:column;}
/* La réserve du bas est ici : la barre d'onglets est fixée et flotte au-dessus.
   Sans elle, elle recouvre exactement les deux boutons de sortie. */
.menus{flex:1;min-height:0;display:flex;flex-direction:column;padding-bottom:92px;background:#0A1310;}

/* UN EN-TÊTE COURT. Chaque pixel qu'il prend est un pixel de menu en moins, et
   c'est le menu qu'on est venu lire. */
.menus .mn-tete{padding:12px 16px 4px;flex:none;}
.menus .mn-retour{display:inline-block;font-size:12.5px;font-weight:700;color:#9FC4B1;text-decoration:none;}
.menus .mn-tete h1{font-family:var(--fd),Georgia,serif;font-size:21px;line-height:1.12;color:#fff;margin:7px 0 0;font-weight:700;}
.menus .mn-tete h1 span{display:block;font-family:var(--fb),system-ui,sans-serif;font-size:12px;
  font-weight:600;color:#9FC4B1;margin-top:3px;letter-spacing:.01em;}
/* Le compteur porte SEUL le nombre de cartes : le répéter dans le sous-titre
   donnerait deux endroits à corriger le jour où l'un des deux se trompe. */
.menus .mn-compte{flex:none;padding:5px 16px 7px;font-size:11.5px;font-weight:800;color:#7FA893;
  font-variant-numeric:tabular-nums;letter-spacing:.06em;}

/* LE RAIL : un volet par écran, aimanté. */
.menus .mn-rail{flex:1;min-height:0;display:flex;overflow-x:auto;overflow-y:hidden;
  scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.menus .mn-rail::-webkit-scrollbar{display:none;}
.menus .mn-v{flex:0 0 100%;width:100%;scroll-snap-align:center;scroll-snap-stop:always;
  display:flex;flex-direction:column;min-width:0;padding:0 12px 12px;}
/* Chaque volet défile VERTICALEMENT dans sa colonne : une ardoise est haute. */
.menus .mn-zone{flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;
  border-radius:16px;background:#15201B;padding:12px;}
.menus .mn-qui{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;padding:2px 4px 11px;}
.menus .mn-qui b{font-size:16.5px;font-weight:800;color:#fff;letter-spacing:-.01em;}
.menus .mn-qui span{font-size:12.5px;color:#9FC4B1;font-weight:600;}
.menus .mn-img{display:block;width:100%;height:auto;border-radius:11px;background:#1B241F;}
.menus .mn-txt{white-space:pre-wrap;font-size:16px;line-height:1.62;color:#EAF2EC;padding:6px 6px 14px;
  font-family:var(--fd),Georgia,serif;}

.menus .mn-act{flex:none;display:flex;gap:9px;align-items:center;padding:11px 4px 0;}
.menus .mn-resa{flex:1;text-align:center;text-decoration:none;background:#25D366;color:#06301C;
  border-radius:14px;padding:15px 14px;font-size:15px;font-weight:800;}
.menus .mn-resa.mn-off{background:rgba(255,255,255,.12);color:#EAF2EC;}
.menus .mn-annonce{flex:none;text-decoration:none;color:#9FC4B1;font-size:13px;font-weight:800;padding:15px 8px;}

.menus .mn-vide{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;
  justify-content:center;padding:24px 22px 30px;text-align:center;}
.menus .mn-vide h2{font-family:var(--fd),Georgia,serif;font-size:24px;color:#fff;font-weight:700;}
.menus .mn-vide p{font-size:14px;line-height:1.6;color:#9FC4B1;margin-top:12px;}
.menus .mn-vide a{display:inline-block;margin-top:20px;color:#25D366;font-weight:800;font-size:14px;text-decoration:none;}

/* ORDINATEUR : deux menus visibles à la fois, le geste reste le même. */
@media (min-width:820px){
  .menus .mn-tete,.menus .mn-compte{max-width:1000px;margin:0 auto;width:100%;}
  .menus .mn-v{flex-basis:50%;}
}
        `,
      }}
    />
  );
}
