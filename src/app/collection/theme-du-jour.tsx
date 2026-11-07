"use client";

/**
 * 🔥 LE MÈME DU JOUR, EN HAUT DE « CRÉER » (le lot 2, 7 novembre 2026) — voir `lib/direct/theme-du-jour.ts`. Le thème
 * d'aujourd'hui (le même pour tout le monde), combien de réponses dans sa ville (vraies), et « 🔥 Je réponds » : le
 * studio s'ouvre sur ce thème (ses trois idées, « Surprends-moi ! »). Déjà répondu : « Voir les réponses », et (le lot 3)
 * « Demain, un nouveau thème : je te préviens vers 11 h 30 ? ». `#jour` : là où mène la notification.
 */
import { useContext, useEffect, useState } from "react";
import { SEUIL_REPONSES, nomVille, type EtatDuJour } from "@/lib/direct/theme-du-jour";
import { OngletVisible } from "./guide";
import { versLeStudio } from "./vers-le-studio";
import { InviterAppli } from "./mon-telephone";

/** « 12 réponses à Dax » — seulement de vrais chiffres ; en dessous du seuil, « Sois parmi les premiers à répondre ». */
export function chiffresDuJour(e: Pick<EtatDuJour, "n" | "ville">): string {
  if (e.n < SEUIL_REPONSES || !e.ville) return "Sois parmi les premiers à répondre";
  return `${e.n} réponses à ${nomVille(e.ville)}`;
}

/** Il répond au mème du jour : le studio s'ouvre sur ce thème, et la page descend jusqu'à lui. */
export function repondreAuJour(e: Pick<EtatDuJour, "theme" | "ville">) {
  versLeStudio({ theme: e.theme.cle, ville: e.ville });
  window.setTimeout(() => document.getElementById("theme-du-jour")?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
}

export function CarteMemeDuJour() {
  const visible = useContext(OngletVisible);
  const [e, setE] = useState<EtatDuJour | null>(null);
  useEffect(() => {
    if (!visible) return;
    let fini = false;
    void fetch("/api/direct/ma-figurine?jour=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { jour?: EtatDuJour } | null) => !fini && j?.jour && setE(j.jour))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [visible]);
  if (!e) return null;
  return (
    <section className="tj" id="jour" aria-label="Le mème du jour">
      <small className="tj-label">🔥 LE MÈME DU JOUR</small>
      <b className="tj-titre">
        <span aria-hidden="true">{e.theme.emoji}</span> {e.theme.titre}
      </b>
      <span className="tj-chiffres">{chiffresDuJour(e)}</span>
      {e.repondu ? (
        <a className="tj-voir" href="#decouvrir">
          ✓ Tu as répondu · voir les réponses →
        </a>
      ) : (
        <button type="button" className="tj-go" onClick={() => repondreAuJour(e)}>
          🔥 Je réponds avec ma figurine
        </button>
      )}
      {/* 🔔 le lot 3 : sa réponse postée (ou l'appli tout juste posée sur son iPhone), « je te préviens demain ? » */}
      <InviterAppli apres="jour" repondu={e.repondu} />
    </section>
  );
}

export const STYLES_THEME_DU_JOUR = `
.tj{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px;border-radius:24px;background:radial-gradient(100% 90% at 0% 0%,rgba(255,122,89,.32),transparent 60%),radial-gradient(90% 80% at 100% 100%,rgba(255,46,154,.28),transparent 60%),rgba(255,255,255,.05);border:1.5px solid rgba(255,122,89,.55)}
.tj-label{font-size:11.5px;font-weight:900;letter-spacing:.14em;color:#FFB08F}
.tj-titre{font-size:21px;line-height:1.2;font-weight:900}
.tj-chiffres{font-size:13px;color:#E8D3DC}
.tj-go{margin-top:6px;width:100%;padding:14px 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF7A59,#FF2E9A);color:#fff;font:inherit;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.tj-voir{margin-top:4px;font-size:14px;font-weight:900;color:#7FF0C4;text-decoration:none}
.tf-theme{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:18px;background:rgba(255,122,89,.12);border:1.5px solid rgba(255,122,89,.55)}
.tf-theme-tete{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.tf-theme-tete b{font-size:15px;font-weight:900;line-height:1.25}
.tf-theme-tete button{flex:none;width:28px;height:28px;border-radius:50%;border:0;background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;cursor:pointer}
.tf-theme-idees{display:flex;flex-direction:column;gap:6px}
.tf-theme-idees button{padding:9px 12px;border-radius:14px;border:1.5px solid rgba(255,255,255,.14);background:rgba(0,0,0,.18);color:#FFF4E6;font:inherit;font-size:13.5px;font-weight:700;text-align:left;cursor:pointer}
.tf-theme-idees button.pris{border-color:#FF7A59;background:rgba(255,122,89,.2)}
.tf-poster-jour{width:100%;padding:14px 16px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF7A59,#FF2E9A);color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer}
.tf-postee{font-size:14px;font-weight:900;color:#7FF0C4;text-decoration:none;text-align:center}
`;
