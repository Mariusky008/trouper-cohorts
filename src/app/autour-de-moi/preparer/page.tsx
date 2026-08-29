// L'ÉCRAN DE PRÉPARATION — l'enveloppe et la feuille de style.
//
// NOINDEX, ET CE N'EST PAS NÉGOCIABLE : c'est l'outil de celui qui démarche, il
// contient le nom de commerces qui n'ont rien signé, et il n'a rien à faire
// dans un moteur de recherche. Le contenu, lui, ne quitte jamais l'appareil —
// voir `preparation.ts`.
//
// ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Le bloc
// est un littéral de gabarit ; un seul accent grave terminerait la chaîne.
// `npm run verifier:styles` le mesure.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { Preparer } from "./preparer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Préparer la tournée — ${MARQUE}` },
  robots: { index: false, follow: false },
};

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* Le monde de l'application, en version outil : meme fond, meme menthe, mais
   des champs larges et des libelles lisibles debout dans la rue. */
.pp{--nuit:#05090C;--nuit2:#0E1614;--craie:#EAF2EC;--craie2:#93A79C;
  --craie3:#6C8078;--menthe:#3DE2A6;--or:#F0B429;
  --trait:rgba(234,242,236,.13);
  min-height:100vh;background:var(--nuit);color:var(--craie);
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  padding:clamp(16px,4vw,40px);max-width:820px;margin:0 auto}
.pp *{box-sizing:border-box}
.pp h1{margin:0;font-size:clamp(24px,5vw,34px);letter-spacing:-.03em}
.pp h2{margin:0 0 14px;font-size:15px;letter-spacing:.02em;
  display:flex;align-items:center;gap:9px}
.pp h2 b{font-size:12px;font-weight:850;color:#04150E;background:var(--menthe);
  border-radius:999px;padding:2px 9px}

.pp-h{display:flex;gap:18px;align-items:flex-start;justify-content:space-between;
  flex-wrap:wrap;padding-bottom:18px;border-bottom:1px solid var(--trait)}
.pp-h p{margin:8px 0 0;font-size:14px;line-height:1.5;color:var(--craie2);
  max-width:46ch}
.pp-h p b{color:var(--craie)}
.pp-ouvrir{flex:none;text-decoration:none;font-size:14.5px;font-weight:850;
  color:#04150E;border-radius:12px;padding:12px 18px;background:var(--menthe)}

.pp-f,.pp-liste{margin-top:26px}
.pp-g{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pp-2{grid-column:1 / -1}
.pp-l{display:flex;flex-direction:column;gap:5px}
.pp-l span{font-size:12px;font-weight:700;letter-spacing:.02em;color:var(--craie3)}
.pp-l input,.pp-l select{font:inherit;font-size:15px;color:var(--craie);
  background:var(--nuit2);border:1px solid var(--trait);border-radius:11px;
  padding:12px 13px}
.pp-l input::placeholder{color:#4B5A54}
.pp-l input:focus,.pp-l select:focus{outline:2px solid var(--menthe);
  outline-offset:1px}
/* LE CHAMP QUI FAIT TOUT L'EFFET LE LENDEMAIN : « cote de boeuf maturee 40
   jours » sur SA carte vaut mille explications sur le principe du produit. Il
   se voit, sinon on le remplit a la va-vite comme les six autres. */
.pp-clef input{border-color:rgba(240,180,41,.5);background:rgba(240,180,41,.07)}
.pp-vignette{grid-column:1 / -1;width:110px;border-radius:12px;
  border:1px solid var(--trait)}

.pp-actions{margin-top:16px;display:flex;align-items:center;gap:14px;
  flex-wrap:wrap}
.pp-b{font:inherit;font-size:15px;font-weight:850;color:#04150E;cursor:pointer;
  border:0;border-radius:999px;padding:13px 24px;background:var(--menthe)}
.pp-b:disabled{opacity:.35;cursor:not-allowed}
.pp-echo{font-size:13px;color:var(--menthe)}
.pp-n{margin:10px 0 0;font-size:12.5px;color:var(--craie3)}

.pp-liste ul{list-style:none;margin:0;padding:0;display:flex;
  flex-direction:column;gap:9px}
.pp-liste li{display:flex;align-items:center;gap:12px;padding:11px 13px;
  border-radius:14px;background:var(--nuit2);border:1px solid var(--trait)}
.pp-liste li img{width:44px;height:44px;object-fit:cover;border-radius:10px;
  flex:none}
.pp-liste li i{font-style:normal;font-size:22px;width:44px;text-align:center;
  flex:none}
.pp-liste li span{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.pp-liste li b{font-size:14.5px;font-weight:800}
.pp-liste li em{font-style:normal;font-size:12px;color:var(--craie3)}
.pp-liste li u{text-decoration:none;font-size:12.5px;color:var(--or)}
.pp-liste li button{flex:none;font:inherit;font-size:12.5px;font-weight:750;
  color:var(--craie2);cursor:pointer;background:transparent;
  border:1px solid var(--trait);border-radius:999px;padding:7px 13px}
.pp-vider{margin-top:14px;font:inherit;font-size:12.5px;color:var(--craie3);
  cursor:pointer;background:transparent;border:0;text-decoration:underline}

.pp-rappel{margin:30px 0 0;padding:14px 16px;border-radius:14px;
  font-size:13px;line-height:1.5;color:#C9B37A;
  background:rgba(240,180,41,.07);border:1px solid rgba(240,180,41,.28)}
.pp-rappel b{color:var(--or)}

@media(max-width:560px){
  .pp-g{grid-template-columns:1fr}
  .pp-2{grid-column:auto}
  .pp-ouvrir{width:100%;text-align:center}
}
        `,
      }}
    />
  );
}

export default function Page() {
  return (
    <>
      <Styles />
      <Preparer />
    </>
  );
}
