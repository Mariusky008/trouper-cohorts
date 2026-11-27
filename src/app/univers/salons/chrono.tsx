"use client";
// ⏱️ LE CHRONO DE L'ENTRÉE AU SALON (27 novembre 2026, le propriétaire : « quand je clique sur « Ta place » […] ça prend
// une éternité ») — pour mesurer sur SON téléphone, en vrai, où part le temps. `?chrono=1` l'allume sur ce téléphone (il
// reste allumé d'une entrée à l'autre), `?chrono=0` l'éteint. Une petite bande en haut de l'écran :
//   · serveur : du toucher à la première réponse du serveur (l'entrée au salon côté serveur, la base comprise) ;
//   · page : la page reçue en entier ;
//   · code : le code de l'écran chargé et lancé ;
//   · salon : le salon affiché (sa pièce, ses figurines) ;
//   · et le poids du code téléchargé ;
//   · 🗄 côté serveur (le cookie `clikme-chrono` le lui demande) : l'entrée, le démarrage à froid, les demandes à la base.
// Rien n'est envoyé nulle part : c'est une capture d'écran qui me le rapporte.
import { useEffect, useState } from "react";

const CLE = "clikme-chrono";
const ms = (x: number) => (x >= 1000 ? `${(x / 1000).toFixed(1).replace(".", ",")} s` : `${Math.round(x)} ms`);

/** Ce que le serveur a mesuré en entrant (`page.tsx`) : le temps de l'entrée, les demandes à la base, un démarrage à froid. */
export type VueServeur = { total: number; habitant: number; n: number; moyenne: number; lente: { ms: number; quoi: string }; froid: boolean };

export function ChronoSalon({ demande, serveur }: { demande?: string; serveur?: VueServeur }) {
  const [texte, setTexte] = useState("");
  useEffect(() => {
    let allume = false;
    try {
      if (demande === "1") localStorage.setItem(CLE, "1");
      if (demande === "0") localStorage.removeItem(CLE);
      allume = localStorage.getItem(CLE) === "1";
    } catch {
      allume = demande === "1";
    }
    // (le cookie dit au serveur de chronométrer, lui aussi, les entrées suivantes)
    document.cookie = `${CLE}=${allume ? "1" : "0"}; path=/; max-age=${allume ? 30 * 86400 : 0}; samesite=lax`;
    if (!allume) return;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const fini = () => {
      const salon = performance.now();
      const n = nav ?? (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined);
      const code = performance
        .getEntriesByType("resource")
        .filter((r) => (r as PerformanceResourceTiming).initiatorType === "script" || r.name.endsWith(".js"))
        .reduce((t, r) => t + ((r as PerformanceResourceTiming).transferSize || 0), 0);
      const morceaux = n
        ? [`serveur ${n.responseStart > 0 ? ms(n.responseStart) : "—"}`, `page ${ms(n.responseEnd)}`, `code ${ms(n.domContentLoadedEventEnd)}`, `salon ${ms(salon)}`, `code téléchargé ${Math.round(code / 1024)} Ko`]
        : [`salon ${ms(salon)}`];
      const s = serveur
        ? `\n🗄 entrée ${ms(serveur.total)}${serveur.froid ? " (démarrage à froid)" : ""} · habitant ${ms(serveur.habitant)} · ${serveur.n} demandes à la base, ${ms(serveur.moyenne)} en moyenne · la plus lente ${ms(serveur.lente.ms)} (${serveur.lente.quoi})`
        : "";
      setTexte(`⏱ ${morceaux.join(" · ")}${s}`);
    };
    if (document.querySelector("main[data-salon]")) return void fini();
    const obs = new MutationObserver(() => {
      if (!document.querySelector("main[data-salon]")) return;
      obs.disconnect();
      fini();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [demande, serveur]);
  if (!texte) return null;
  return (
    <div
      data-chrono
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, padding: "6px 10px", background: "rgba(0,0,0,0.82)", color: "#9ff0b0", font: "600 12px/1.35 ui-monospace, monospace", textAlign: "center", pointerEvents: "none", whiteSpace: "pre-line" }}
    >
      {texte}
    </div>
  );
}
