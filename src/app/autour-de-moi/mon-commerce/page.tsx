// MON COMMERCE — l'enveloppe et la feuille de style.
//
// NOINDEX : c'est l'écran du commerçant, il montre ce que ses annonces ont
// produit, et il n'a rien à faire dans un moteur de recherche.
//
// ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Le bloc
// est un littéral de gabarit ; un seul accent grave terminerait la chaîne.
// `npm run verifier:styles` le mesure — déjà payé six fois.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { MonCommerce } from "./mon-commerce";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Mon commerce — ${MARQUE}` },
  robots: { index: false, follow: false },
};

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* Le monde de l'application, en version outil — comme l'ecran de preparation :
   meme fond, meme menthe, mais des lignes larges et des libelles lisibles
   debout derriere un comptoir, souvent d'une seule main. */
.mc{--nuit:#05090C;--nuit2:#0E1614;--craie:#EAF2EC;--craie2:#93A79C;
  --craie3:#6C8078;--menthe:#3DE2A6;--or:#F0B429;
  --trait:rgba(234,242,236,.13);
  min-height:100vh;background:var(--nuit);color:var(--craie);
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  padding:clamp(16px,4vw,40px);max-width:720px;margin:0 auto}
.mc *{box-sizing:border-box}
.mc-h{padding-bottom:18px;border-bottom:1px solid var(--trait)}
.mc-oeil{margin:0;font-size:11px;font-weight:850;letter-spacing:.2em;
  text-transform:uppercase;color:var(--menthe)}
.mc h1{margin:6px 0 0;font-size:clamp(24px,6vw,34px);font-weight:900;
  letter-spacing:-.03em;line-height:1.05}
.mc-m{margin:6px 0 0;font-size:14px;color:var(--craie2)}
.mc section{margin-top:28px}
.mc-t{margin:0;font-size:11.5px;font-weight:850;letter-spacing:.14em;
  text-transform:uppercase;color:var(--craie3)}
.mc-n{margin:6px 0 0;font-size:13px;line-height:1.5;color:var(--craie2)}

/* ─── CE QUE CA A DONNE ───
   En premier, et c'est delibere : la recompense avant la corvee. Un ecran qui
   ouvre sur « qu'allez-vous publier ? » est un formulaire ; un ecran qui ouvre
   sur « voila ce que ca a produit » est une raison de l'ouvrir. */
.mc-bilan{margin-top:24px;padding:18px;border-radius:18px;
  background:rgba(61,226,166,.07);border:1px solid rgba(61,226,166,.24)}
.mc-b-quoi{margin:8px 0 0;font-family:Georgia,serif;font-size:19px;
  font-weight:700;letter-spacing:-.02em}
.mc-chiffres{display:flex;flex-wrap:wrap;gap:26px;margin-top:14px}
.mc-chiffres span{display:block;font-size:12.5px;line-height:1.35;
  color:var(--craie2);max-width:16ch}
.mc-chiffres b{display:block;font-size:30px;font-weight:900;color:var(--menthe);
  letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.mc-b-mot{margin:14px 0 0;font-size:12.5px;line-height:1.5;color:var(--craie3)}

/* ─── REMETTRE ───
   Le bouton est a droite et il est plein : c'est le seul geste de l'ecran, et
   il doit se toucher d'un pouce sans viser. */
.mc-liste{list-style:none;margin:12px 0 0;padding:0;display:flex;
  flex-direction:column;gap:8px}
.mc-liste li{display:flex;align-items:center;gap:12px;padding:12px 13px;
  border-radius:14px;background:var(--nuit2);border:1px solid var(--trait)}
.mc-l{flex:1;min-width:0}
.mc-l b{display:block;font-size:15px;font-weight:800;letter-spacing:-.01em}
.mc-l em{display:block;margin-top:3px;font-style:normal;font-size:12px;
  color:var(--craie3)}
.mc-b{flex:none;font:inherit;font-size:13.5px;font-weight:850;cursor:pointer;
  color:#04150E;background:var(--menthe);border:0;border-radius:999px;
  padding:11px 17px}
.mc-b.on{color:var(--menthe);background:rgba(61,226,166,.12);
  border:1px solid rgba(61,226,166,.4)}
.mc-b:active{transform:scale(.97)}
.mc-ok{margin:12px 0 0;font-size:13px;color:var(--menthe)}
.mc-ok a{color:inherit}

/* ─── CE QUI REVIENT ───
   Deduit de l'historique, jamais declare. C'est la seule analyse qui serve a
   decider : « la garbure, plutot le jeudi » se relit, un taux de conversion
   ne se relit pas. */
.mc-hab{list-style:none;margin:12px 0 0;padding:0;display:flex;
  flex-direction:column;gap:9px}
.mc-hab li{padding-left:13px;border-left:2px solid rgba(240,180,41,.5)}
.mc-hab b{display:block;font-size:15px;font-weight:800;letter-spacing:-.01em}
.mc-hab em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;
  color:var(--or)}
.mc-vide{padding:40px;color:#93A79C;font-family:system-ui,sans-serif}
`,
      }}
    />
  );
}

export default function Page() {
  return (
    <>
      <Styles />
      <MonCommerce />
    </>
  );
}
