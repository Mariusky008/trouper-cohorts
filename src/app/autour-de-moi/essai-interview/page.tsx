// L'ÉCRAN D'ESSAI DE L'INTERVIEW — l'enveloppe et la feuille de style.
//
// NOINDEX : c'est un instrument d'essai, pas une page du produit. Il ouvre la
// caméra, appelle un service payant (la transcription) et n'a rien à faire
// dans un moteur de recherche.
//
// ATTENTION : PAS D'ACCENT GRAVE DANS LES COMMENTAIRES CSS ci-dessous. Le bloc
// est un litteral de gabarit ; un seul accent grave terminerait la chaine.
import type { Metadata, Viewport } from "next";
import { MARQUE } from "@/lib/marque";
import { EssaiInterview } from "./essai-interview";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05090C",
};

export const metadata: Metadata = {
  title: { absolute: `L'interview du fantôme — ${MARQUE}` },
  robots: { index: false, follow: false },
};

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ei{--nuit:#05090C;--nuit2:#0E1614;--craie:#EAF2EC;--craie2:#93A79C;
  --craie3:#6C8078;--menthe:#3DE2A6;--or:#F0B429;--rouge:#FF6B6B;
  --trait:rgba(234,242,236,.13);
  min-height:100vh;min-height:100dvh;background:var(--nuit);color:var(--craie);
  font-family:var(--font-clikme),system-ui,-apple-system,sans-serif;
  padding:clamp(16px,4vw,40px);max-width:760px;margin:0 auto}
.ei *{box-sizing:border-box}
.ei h1{margin:0;font-size:clamp(24px,5vw,34px);letter-spacing:-.03em}
.ei h2{margin:0 0 12px;font-size:12px;font-weight:850;letter-spacing:.1em;
  text-transform:uppercase;color:var(--menthe)}
.ei-h{display:flex;gap:18px;align-items:flex-start;justify-content:space-between;
  flex-wrap:wrap;padding-bottom:18px;border-bottom:1px solid var(--trait)}
.ei-h p{margin:8px 0 0;font-size:14px;line-height:1.55;color:var(--craie2);max-width:52ch}
.ei-h p b{color:var(--craie)}
.ei-retour{flex:none;text-decoration:none;font-size:13.5px;font-weight:800;
  color:var(--craie2);border:1px solid var(--trait);border-radius:11px;padding:10px 15px}
.ei-bloc{margin-top:24px}
.ei-champ{display:block;margin-bottom:12px}
.ei-champ span{display:block;font-size:12.5px;font-weight:700;color:var(--craie2);margin-bottom:6px}
.ei-champ input{width:100%;font:inherit;font-size:17px;color:var(--craie);
  background:var(--nuit2);border:1px solid var(--trait);border-radius:12px;padding:12px 14px}
.ei-choix{display:flex;gap:8px}
.ei-choix button{flex:1;font:inherit;font-size:15px;font-weight:800;cursor:pointer;
  color:var(--craie2);background:var(--nuit2);border:1px solid var(--trait);
  border-radius:12px;padding:13px 10px}
.ei-choix button.on{color:#04150E;background:var(--menthe);border-color:var(--menthe)}
/* le nombre de questions, et qui repond : deux grilles de choix, lisibles a 320 px */
.ei-formats,.ei-modes{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ei-formats button,.ei-modes button{font:inherit;cursor:pointer;text-align:left;
  color:var(--craie2);background:var(--nuit2);border:1px solid var(--trait);border-radius:13px;padding:12px 13px}
.ei-formats button b,.ei-modes button b{display:block;font-size:15px;font-weight:850;color:var(--craie)}
.ei-formats button em,.ei-modes button em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;line-height:1.35}
.ei-formats button.on,.ei-modes button.on{background:rgba(61,226,166,.12);border-color:var(--menthe)}
.ei-formats button.on b,.ei-modes button.on b{color:var(--menthe)}
.ei-modes button img{display:block;height:52px;width:auto;margin-bottom:6px}
.ei-case{display:flex;gap:10px;align-items:center;margin-top:14px;font-size:14px;color:var(--craie2)}
.ei-case input{width:20px;height:20px;accent-color:var(--menthe)}
.ei-n{margin:10px 0 0;font-size:12.5px;line-height:1.5;color:var(--craie3)}
.ei-act{display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:28px;text-align:center}
.ei-act.rangee{flex-direction:row;flex-wrap:wrap;justify-content:center}
.ei-go{display:inline-block;text-decoration:none;font:inherit;font-size:18px;font-weight:850;
  color:#04150E;cursor:pointer;border:0;border-radius:999px;padding:18px 36px;
  background:var(--menthe);box-shadow:0 10px 30px rgba(61,226,166,.22)}
.ei-go.second{font-size:15px;padding:13px 20px;color:var(--craie);background:var(--nuit2);
  border:1px solid var(--trait);box-shadow:none}
.ei-go:disabled{opacity:.45;cursor:progress}
.ei-erreur{margin:18px 0 0;padding:13px 15px;border-radius:13px;font-size:14px;line-height:1.5;
  color:#FFD2D2;background:rgba(255,107,107,.1);border:1px solid rgba(255,107,107,.35)}
.ei-rappel{margin:30px 0 0;padding:14px 16px;border-radius:14px;font-size:13px;line-height:1.55;
  color:#C9B37A;background:rgba(240,180,41,.07);border:1px solid rgba(240,180,41,.28)}
.ei-rappel b{color:var(--or)}

/* le montage, puis la video : au format du telephone, jamais plus large que lui */
.ei-toile{margin:20px auto 0;max-width:340px}
.ei-toile canvas,.ei-resultat{display:block;width:100%;max-width:340px;height:auto;
  aspect-ratio:9/16;margin:0 auto;border-radius:18px;background:#000}
.ei-resultat{margin-top:20px}
.ei-attente{width:44px;height:44px;margin:40px auto;border-radius:50%;
  border:4px solid var(--trait);border-top-color:var(--menthe);animation:eiTourne 1s linear infinite}
@keyframes eiTourne{to{transform:rotate(360deg)}}
/* ses reponses, une par ligne : la question, et la photo ou la video qu'il y met */
.ei-reponses{list-style:none;margin:20px 0 0;padding:0;display:grid;gap:10px}
.ei-reponses li{display:flex;gap:12px;align-items:center;justify-content:space-between;
  padding:12px 14px;border-radius:14px;background:var(--nuit2);border:1px solid var(--trait)}
.ei-r-texte{min-width:0}
.ei-r-texte b{display:block;font-size:15px;font-weight:850}
.ei-r-texte em{display:block;margin-top:2px;font-style:normal;font-size:12.5px;color:var(--craie3)}
.ei-r-ajout{position:relative;flex:none;font-size:14px;font-weight:850;color:#04150E;
  background:var(--menthe);border-radius:999px;padding:10px 14px;cursor:pointer;overflow:hidden}
.ei-r-ajout input{position:absolute;inset:0;opacity:0;cursor:pointer;font-size:0}
.ei-r-media{display:flex;align-items:center;gap:8px;flex:none}
.ei-r-media img,.ei-r-media video{width:64px;height:64px;object-fit:cover;border-radius:10px;background:#000}
.ei-r-media button{font:inherit;font-size:12.5px;font-weight:700;color:var(--craie2);cursor:pointer;
  background:transparent;border:1px solid var(--trait);border-radius:999px;padding:7px 11px}
.ei-mesures{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.ei-mesures li{padding:11px 13px;border-radius:13px;background:var(--nuit2);border:1px solid var(--trait)}
.ei-mesures li b{display:block;font-size:13.5px;font-weight:800}
.ei-mesures li em{display:block;margin-top:3px;font-style:normal;font-size:12.5px;line-height:1.45;color:var(--craie3)}
.ei-mesures li.oui{border-color:rgba(61,226,166,.35)}
.ei-mesures li.non{border-color:rgba(255,107,107,.35)}

/* LE DIRECT : la camera plein ecran, en miroir comme une glace, et le reporter pose dessus */
.ei-scene{position:fixed;inset:0;background:#000;overflow:hidden;color:#fff;
  font-family:var(--font-clikme),system-ui,-apple-system,sans-serif}
.ei-camera{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.ei-perso{position:absolute;bottom:calc(env(safe-area-inset-bottom) + 96px);
  height:min(36vh,60vw);aspect-ratio:455/640;pointer-events:none;
  animation:eiFlotte 1.8s ease-in-out infinite alternate}
.ei-perso.chef{aspect-ratio:549/640;animation-delay:-.9s}
.ei-perso.droite{right:2vw}
.ei-perso.gauche{left:2vw}
.ei-perso img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;
  filter:drop-shadow(0 10px 18px rgba(0,0,0,.35))}
@keyframes eiFlotte{from{transform:translateY(0)}to{transform:translateY(-10px)}}
.ei-bulle{position:absolute;margin:0;bottom:calc(env(safe-area-inset-bottom) + 96px + min(36vh,60vw));
  max-width:min(80vw,420px);padding:14px 18px;border-radius:22px;background:#fff;color:#1E1E22;
  font-weight:700;font-size:17px;line-height:1.35;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.ei-bulle.droite{right:4vw}
.ei-bulle.gauche{left:4vw}
/* SANS CAMERA : l'ardoise du jour, le plat ecrit dessus, et les deux fantomes face a face */
.ei-ardoise-fond{position:absolute;inset:0;background:#1d2a24 url(/direct/interview/ardoise.webp) center/cover no-repeat}
.ei-plat{position:absolute;top:calc(env(safe-area-inset-top) + 72px);left:0;right:0;margin:0;padding:0 20px;
  text-align:center;font-family:"Craie ClikMe","Comic Sans MS",cursive;font-weight:700;
  font-size:clamp(26px,7.5vw,42px);line-height:1.15;color:#F6DE78}
.ei-haut{position:absolute;top:calc(env(safe-area-inset-top) + 12px);left:50%;transform:translateX(-50%);
  display:flex;gap:10px;align-items:center;white-space:nowrap;max-width:calc(100vw - 24px);
  overflow:hidden;text-overflow:ellipsis;font-size:14px;font-weight:800;
  background:rgba(0,0,0,.5);border-radius:999px;padding:8px 14px}
.ei-rec{color:#FF6B6B;animation:eiRec 1s steps(2) infinite}
@keyframes eiRec{50%{opacity:.25}}
.ei-decompte{position:absolute;inset:0;display:grid;place-items:center;font-size:30vw;font-weight:900;
  color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.5);pointer-events:none}
.ei-bas{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 16px);
  display:flex;flex-direction:column;align-items:center;gap:10px;padding:0 16px}
.ei-temps{width:min(86vw,420px);height:6px;border-radius:9px;background:rgba(255,255,255,.25);overflow:hidden}
.ei-temps.large{width:100%;margin-top:12px}
.ei-temps i{display:block;height:100%;background:#3DE2A6;transform-origin:left}
.ei-fini{font:inherit;font-size:18px;font-weight:850;color:#04150E;cursor:pointer;
  background:#3DE2A6;border:0;border-radius:999px;padding:16px 30px;box-shadow:0 8px 24px rgba(0,0,0,.3)}
.ei-scene .ei-go{box-shadow:0 8px 24px rgba(0,0,0,.35)}
/* sur la camera, un bouton grise a moitie transparent disparait : il reste lisible */
.ei-scene .ei-go:disabled{opacity:1;color:#fff;background:rgba(20,24,22,.72);box-shadow:none}
@media (prefers-reduced-motion:reduce){.ei-perso,.ei-rec,.ei-attente{animation:none}}
        `,
      }}
    />
  );
}

export default function Page() {
  return (
    <>
      <Styles />
      <EssaiInterview />
    </>
  );
}
