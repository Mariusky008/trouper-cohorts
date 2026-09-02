// L'ÉCRAN D'ESSAI VOCAL — l'enveloppe et la feuille de style.
//
// NOINDEX : c'est un instrument de mesure, pas une page du produit. Il n'a rien
// à faire dans un moteur de recherche, et il appelle un service payant.
//
// ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Le bloc
// est un litteral de gabarit ; un seul accent grave terminerait la chaine.
// `npm run verifier:styles` le mesure — et l'a deja mesure six fois.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { EssaiVoix } from "./essai-voix";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `Essai vocal — ${MARQUE}` },
  robots: { index: false, follow: false },
};

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* Le monde de l'application, en version instrument : meme fond, meme menthe,
   mais des chiffres lisibles debout dans un endroit bruyant. */
.ev{--nuit:#05090C;--nuit2:#0E1614;--craie:#EAF2EC;--craie2:#93A79C;
  --craie3:#6C8078;--menthe:#3DE2A6;--or:#F0B429;--rouge:#FF6B6B;
  --trait:rgba(234,242,236,.13);
  min-height:100vh;background:var(--nuit);color:var(--craie);
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  padding:clamp(16px,4vw,40px);max-width:760px;margin:0 auto}
.ev *{box-sizing:border-box}
.ev h1{margin:0;font-size:clamp(24px,5vw,34px);letter-spacing:-.03em}
.ev h2{margin:0 0 12px;font-size:12px;font-weight:850;letter-spacing:.1em;
  text-transform:uppercase;color:var(--menthe)}
.ev h3{margin:0 0 8px;font-size:13.5px;font-weight:850;
  display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.ev h3 i{font-style:normal;font-size:11px;font-weight:600;color:var(--craie3)}

.ev-h{display:flex;gap:18px;align-items:flex-start;justify-content:space-between;
  flex-wrap:wrap;padding-bottom:18px;border-bottom:1px solid var(--trait)}
.ev-h p{margin:8px 0 0;font-size:14px;line-height:1.55;color:var(--craie2);
  max-width:48ch}
.ev-h p b{color:var(--craie)}
.ev-retour{flex:none;text-decoration:none;font-size:13.5px;font-weight:800;
  color:var(--craie2);border:1px solid var(--trait);border-radius:11px;
  padding:10px 15px}

.ev-bloc{margin-top:26px}

/* CE QUE L'APPAREIL SAIT FAIRE, EN PREMIER. Si la dictee du navigateur n'existe
   pas ici, le chemin A est mort avant d'avoir parle — et ca se lit en ouvrant
   la page, sans appuyer sur rien. */
.ev-dispo{list-style:none;margin:0;padding:0;display:grid;
  grid-template-columns:1fr 1fr;gap:10px}
.ev-dispo li{padding:11px 13px;border-radius:13px;background:var(--nuit2);
  border:1px solid var(--trait)}
.ev-dispo li b{display:block;font-size:13.5px;font-weight:800}
.ev-dispo li em{display:block;margin-top:3px;font-style:normal;font-size:12px;
  color:var(--craie3)}
.ev-dispo li.oui{border-color:rgba(61,226,166,.35)}
.ev-dispo li.oui em{color:var(--menthe)}
.ev-dispo li.non{border-color:rgba(255,107,107,.35)}
.ev-dispo li.non em{color:var(--rouge)}

.ev-phrase{margin:0;padding:15px 16px;border-radius:14px;
  font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.45;
  background:rgba(240,180,41,.07);border:1px solid rgba(240,180,41,.3)}
.ev-n{margin:10px 0 0;font-size:12.5px;line-height:1.5;color:var(--craie3)}
.ev-n b{color:var(--or)}
.ev-echo{margin:10px 0 0;font-size:13px;color:var(--rouge)}

/* LE BOUTON EST GROS PARCE QU'ON APPUIE DESSUS DEBOUT, dans le bruit, avec une
   main. Un bouton de vingt pixels dans une boulangerie a sept heures se rate. */
.ev-act{display:flex;flex-direction:column;align-items:center;gap:14px}
.ev-micro{font:inherit;font-size:19px;font-weight:850;color:#04150E;
  cursor:pointer;border:0;border-radius:999px;padding:22px 46px;
  background:var(--menthe);box-shadow:0 10px 30px rgba(61,226,166,.22)}
.ev-micro:disabled{opacity:.4;cursor:progress}
.ev-micro.on{color:#fff;background:var(--rouge);
  box-shadow:0 0 0 0 rgba(255,107,107,.6);animation:evBat 1.6s ease-out infinite}
@keyframes evBat{
  0%{box-shadow:0 0 0 0 rgba(255,107,107,.55)}
  70%{box-shadow:0 0 0 22px rgba(255,107,107,0)}
  100%{box-shadow:0 0 0 0 rgba(255,107,107,0)}
}
@media (prefers-reduced-motion:reduce){.ev-micro.on{animation:none}}
/* CE QU'IL ENTEND PENDANT QU'ON PARLE. C'est la seule chose que le chemin B ne
   saura jamais faire, et il faut le voir de ses yeux avant d'en decider. */
.ev-vivant{margin:0;max-width:44ch;text-align:center;font-size:15px;
  line-height:1.45;color:var(--craie2)}

.ev-sep{display:flex;flex-wrap:wrap;justify-content:center;gap:7px}
.ev-sep button{font:inherit;font-size:12px;font-weight:750;cursor:pointer;
  color:var(--craie3);background:transparent;border:1px solid var(--trait);
  border-radius:999px;padding:7px 13px}
.ev-sep button.on{color:#04150E;background:var(--menthe);border-color:var(--menthe)}
.ev-sep button:disabled{opacity:.4;cursor:not-allowed}

/* LES DEUX COTE A COTE, ET JAMAIS L'UN SOUS L'AUTRE TANT QUE L'ECRAN LE PERMET :
   on compare deux transcriptions, et comparer se fait d'un coup d'oeil. */
.ev-duo{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.ev-c{padding:13px 14px;border-radius:14px;background:var(--nuit2);
  border:1px solid var(--trait)}
.ev-c.ok{border-color:rgba(61,226,166,.35)}
.ev-c.ko{border-color:rgba(255,107,107,.35)}
.ev-t{margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14.5px;
  line-height:1.45;color:var(--craie)}
.ev-m{margin:9px 0 0;font-size:11.5px;line-height:1.5;color:var(--craie3)}
.ev-m b{font-size:13px;color:var(--menthe)}
.ev-ko{margin:0;font-size:13px;line-height:1.45;color:var(--rouge)}

.ev-tab{width:100%;border-collapse:collapse;font-size:13px}
.ev-tab th{text-align:left;font-size:11px;font-weight:800;letter-spacing:.08em;
  text-transform:uppercase;color:var(--craie3);padding:0 8px 7px 0}
.ev-tab td{padding:7px 8px 7px 0;border-top:1px solid var(--trait);
  font-variant-numeric:tabular-nums}
.ev-tab td.ko{color:var(--rouge)}
.ev-vider{margin-top:12px;font:inherit;font-size:12.5px;color:var(--craie3);
  cursor:pointer;background:transparent;border:0;text-decoration:underline}

.ev-rappel{margin:30px 0 0;padding:14px 16px;border-radius:14px;
  font-size:13px;line-height:1.55;color:#C9B37A;
  background:rgba(240,180,41,.07);border:1px solid rgba(240,180,41,.28)}
.ev-rappel b{color:var(--or)}

@media(max-width:560px){
  .ev-duo,.ev-dispo{grid-template-columns:1fr}
  .ev-retour{width:100%;text-align:center}
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
      <EssaiVoix />
    </>
  );
}
