"use client";

/**
 * 👋 LA BIENVENUE CHEZ PABLITO, À SON ADRESSE DIRECTE : elle se joue comme à la toute première arrivée ; à la fin
 * (« Je crée ma figurine », « Plus tard » ou « Passer »), ce que ce bouton fait dans l'appli, et « Rejouer ». Sans
 * l'univers de Pablito (pas encore adopté), où l'adopter.
 */
import { useEffect, useState } from "react";
import type { UniversDePablito } from "@/lib/direct/bienvenue";
import { STYLES_GUIDE } from "../collection/guide";
import { STYLES_TUTO } from "../collection/tuto";
import { STYLES_BIENVENUE } from "../collection/bienvenue";
import { BienvenueChezPablito, STYLES_BIENVENUE_CHEZ } from "../collection/bienvenue-chez";

const FINS = {
  creer: "Dans l’appli, « 📸 Je crée ma figurine » ouvre l’atelier : le selfie, puis la figurine.",
  passer: "Dans l’appli, « Passer » et « Plus tard » ferment la bienvenue ; elle ne revient plus d’elle-même sur ce téléphone.",
};

export function ApercuBienvenue() {
  const [univers, setUnivers] = useState<UniversDePablito | null | undefined>(undefined);
  const [fin, setFin] = useState<keyof typeof FINS | null>(null);
  const [tour, setTour] = useState(0);
  useEffect(() => {
    let fini = false;
    fetch("/api/direct/chez-pablito", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { univers?: UniversDePablito | null }) => !fini && setUnivers(j.univers ?? null))
      .catch(() => !fini && setUnivers(null));
    return () => {
      fini = true;
    };
  }, []);
  return (
    <main className="ab">
      {univers === undefined && <p className="ab-carte">…</p>}
      {univers === null && (
        <div className="ab-carte">
          <h1>La bienvenue se joue chez Pablito</h1>
          <p>Son univers n’est pas encore adopté. Dans l’admin, ouvre « Univers — les essais », puis « 🏡 L’univers de Pablito » : « Adopter mon univers comme celui de Pablito ».</p>
          <a href="/admin/humain/univers-essais">Ouvrir l’admin</a>
        </div>
      )}
      {univers && !fin && <BienvenueChezPablito key={tour} univers={univers} onFini={() => setFin("passer")} onCreer={() => setFin("creer")} />}
      {univers && fin && (
        <div className="ab-carte">
          <h1>Fin de la bienvenue</h1>
          <p>{FINS[fin]}</p>
          <button
            type="button"
            onClick={() => {
              setFin(null);
              setTour((t) => t + 1);
            }}
          >
            ↺ Rejouer depuis le début
          </button>
        </div>
      )}
      <style>{STYLES_GUIDE + STYLES_TUTO + STYLES_BIENVENUE + STYLES_BIENVENUE_CHEZ + STYLES_APERCU}</style>
    </main>
  );
}

const STYLES_APERCU = `
body{background:#12060F}
.ab{min-height:100dvh;display:grid;place-items:center;padding:24px max(16px,env(safe-area-inset-left)) 24px max(16px,env(safe-area-inset-right));box-sizing:border-box;background:#12060F;color:#FFF4E6;
  font-family:var(--font-clikme),Poppins,system-ui,-apple-system,"Segoe UI",sans-serif}
.ab-carte{max-width:420px;display:flex;flex-direction:column;gap:12px;padding:22px 20px;border-radius:24px;background:linear-gradient(180deg,#3A1230,#22091B);border:1.5px solid rgba(255,46,154,.55);text-align:center}
.ab-carte h1{margin:0;font-size:20px}
.ab-carte p{margin:0;color:#E8D5DF;line-height:1.45}
.ab-carte a,.ab-carte button{align-self:center;min-height:46px;padding:0 20px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-weight:900;display:inline-flex;align-items:center;text-decoration:none;cursor:pointer}
`;
