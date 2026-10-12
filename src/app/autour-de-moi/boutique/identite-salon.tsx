"use client";

// 👻 QUI PARLE ? — le fantôme et le prénom, sur la page d'un commerçant.
//
// « Sur la page commerçant, quand je clique sur le salon et que je l'ouvre en
// tant qu'utilisatrice, on ne m'a pas demandé de choisir mon fantôme pour
// m'identifier ? » On écrivait sous « Vous », et les amis lisaient « Vous ».
//
// AU PREMIER GESTE QUI PARLE AUX AUTRES — un message, une invitation, un
// salon ouvert depuis un essai —, et seulement s'il manque quelque chose :
//   1. le fantôme, avec LE MÊME PANNEAU que l'application (`PanneauPlace`,
//      « Choisis ton fantôme » ; « Choisir plus tard » garde celui par défaut) ;
//   2. le prénom, avec la même question : « Comment vous appelez-vous ? Juste
//      un prénom, pour que les autres sachent qui parle. »
// Puis le geste se fait. Déjà connus (choisis ici ou dans l'application, sur
// ce navigateur), rien n'est redemandé.
//
// CE N'EST PAS UN COMPTE : le fantôme est une apparence, le prénom ce que les
// autres lisent. Ce qui fait « moi » pour le serveur reste le jeton du
// téléphone (`lib/direct/habitant.ts`) — et, pour le retrouver ailleurs,
// « Emportez votre Maison » (`emporter-maison.tsx`).

import { useState, type ReactNode } from "react";
import { choisirPuis, PanneauPlace } from "../prendre-place";
import { direSonPrenom, monPrenom } from "@/lib/direct/salons";

export function useIdentite(actif: boolean): { identifierPuis: (apres: () => void) => void; rendu: ReactNode } {
  const [prenomPour, setPrenomPour] = useState<(() => void) | null>(null);
  const [brouillon, setBrouillon] = useState("");
  const identifierPuis = (apres: () => void) => {
    if (!actif) {
      apres();
      return;
    }
    const suite = () => (monPrenom() ? apres() : setPrenomPour(() => apres));
    choisirPuis(suite);
  };
  const rendu = (
    <>
      {/* LE PANNEAU DE L'APPLICATION, posé par-dessus toute la page. */}
      <div className="id-place">
        <PanneauPlace />
      </div>
      {prenomPour && (
        <div className="id-voile" role="dialog" aria-modal="true" aria-label="Votre prénom" onClick={() => setPrenomPour(null)}>
          <form
            className="id-feuille"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const n = brouillon.trim();
              if (!n) return;
              direSonPrenom(n);
              const suite = prenomPour;
              setPrenomPour(null);
              suite();
            }}
          >
            <b>Comment vous appelez-vous&nbsp;?</b>
            <span>Juste un prénom, pour que les autres sachent qui parle.</span>
            <input value={brouillon} onChange={(e) => setBrouillon(e.target.value)} maxLength={24} autoFocus placeholder="Camille" aria-label="Votre prénom" />
            <button type="submit" disabled={!brouillon.trim()}>
              C’est moi <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      )}
      <StylesIdentite />
    </>
  );
  return { identifierPuis, rendu };
}

function StylesIdentite() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.id-place{position:fixed;inset:0;z-index:1200;pointer-events:none;--ap-onglets-h:0px;}
.id-place .pp{pointer-events:auto;}
.id-voile{position:fixed;inset:0;z-index:1210;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,6,4,.6);
  -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);}
.id-feuille{display:flex;flex-direction:column;gap:10px;width:min(480px,100%);padding:22px 20px calc(22px + env(safe-area-inset-bottom,0px));
  border-radius:24px 24px 0 0;background:#21150F;border:1px solid rgba(255,214,150,.18);color:#FFF4E6;animation:idMonte .28s ease both;}
.id-feuille b{font-size:20px;font-weight:900;}
.id-feuille span{font-size:14px;line-height:1.4;color:#E3CDB4;}
.id-feuille input{margin-top:4px;padding:14px 16px;border-radius:14px;border:1.5px solid rgba(255,214,150,.3);background:rgba(255,244,230,.06);
  font:inherit;font-size:17px;color:#FFF4E6;outline:none;}
.id-feuille input:focus{border-color:#F5A23A;}
.id-feuille button{margin-top:4px;padding:14px 18px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:16px;font-weight:900;
  color:#2A1708;background:linear-gradient(180deg,#FFC867,#F5A23A);}
.id-feuille button:disabled{opacity:.5;cursor:default;}
@keyframes idMonte{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.id-feuille{animation:none;}}
`,
      }}
    />
  );
}
