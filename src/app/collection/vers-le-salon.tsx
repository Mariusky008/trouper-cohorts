"use client";

/**
 * 🛋️ VERS LE SALON (le lot S8, la bascule ; l'interrupteur : `lib/direct/salon-interrupteur.ts`).
 *
 * - `useSalonDuDuo()` : le salon est-il ouvert sur ce téléphone ? (l'interrupteur, ou l'essai du téléphone :
 *   `/collection?salon=1`, retenu ; `?salon=0`, l'ancien écran) ;
 * - `SalonDansLAppli` : une conversation, dans le salon du duo, posée sur la page entière (par-dessus le menu) ; le
 *   salon n'est téléchargé qu'au besoin (et en avance, dans un temps mort : `useSalonPrecharge`) ;
 * - `useSalonPrecharge(cles)` : les deux premières conversations de la liste, préchargées dans un temps mort (une
 *   requête, leurs images décodées : `src/app/salon/ouvrir.ts`).
 */
import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { MEMOIRE_SALON, salonOuvert } from "@/lib/direct/salon-interrupteur";
import { prechargerQuandLibre } from "@/app/salon/ouvrir";

const chargerLeSalon = () => import("@/app/salon/salon");
const SalonDuDuo = dynamic(() => chargerLeSalon().then((m) => m.SalonDuDuo), {
  ssr: false,
  loading: () => (
    <div className="vs-attente" aria-busy="true">
      <p>La pièce arrive…</p>
    </div>
  ),
});

// ─── le choix du téléphone (lu dans `localStorage`, suivi d'un onglet à l'autre) ───
const abonnes = new Set<() => void>();
function lire(): string | null {
  try {
    return window.localStorage.getItem(MEMOIRE_SALON);
  } catch {
    return null;
  }
}
function sAbonner(f: () => void) {
  abonnes.add(f);
  const ailleurs = (e: StorageEvent) => e.key === MEMOIRE_SALON && f();
  window.addEventListener("storage", ailleurs);
  return () => {
    abonnes.delete(f);
    window.removeEventListener("storage", ailleurs);
  };
}

/** 🛋️ Le salon est-il ouvert sur ce téléphone ? (`?salon=1` / `?salon=0` dans l'adresse : retenu, puis retiré d'elle) */
export function useSalonDuDuo(pourTous?: boolean): boolean {
  const choix = useSyncExternalStore(sAbonner, lire, () => null);
  useEffect(() => {
    const u = new URL(window.location.href);
    const s = u.searchParams.get("salon");
    if (s !== "1" && s !== "0") return;
    try {
      window.localStorage.setItem(MEMOIRE_SALON, s);
    } catch {
      /* rien : le téléphone ne retient pas ; l'interrupteur décide */
    }
    u.searchParams.delete("salon");
    try {
      window.history.replaceState(window.history.state, "", `${u.pathname}${u.search}${u.hash}`);
    } catch {
      /* rien */
    }
    for (const f of abonnes) f();
  }, []);
  return salonOuvert(choix, pourTous);
}

/** ⚡ Les deux premières conversations (et le salon lui-même), préchargées dans un temps mort. */
export function useSalonPrecharge(actif: boolean, cles: string[]): void {
  const deux = cles.slice(0, 2).join(",");
  useEffect(() => {
    if (!actif) return;
    const annuler = prechargerQuandLibre(deux ? deux.split(",") : []);
    const t = window.setTimeout(() => void chargerLeSalon().catch(() => undefined), 1200);
    return () => {
      annuler();
      window.clearTimeout(t);
    };
  }, [actif, deux]);
}

/** 🛋️ Une conversation dans le salon du duo, sur la page entière (« ‹ » la referme : `onFermer`). */
export function SalonDansLAppli({ cle, onFermer }: { cle: string; onFermer: () => void }) {
  return (
    <div className="vs-salon" data-salon-du-duo={cle} role="dialog" aria-modal="true" aria-label="Votre salon">
      <style>{STYLES_VERS_LE_SALON}</style>
      <SalonDuDuo cle={cle} onRetour={onFermer} />
    </div>
  );
}

const STYLES_VERS_LE_SALON = `
.vs-salon{position:fixed;inset:0;z-index:30;background:#1d0a1b;overflow:hidden}
.vs-attente{height:100dvh;display:grid;place-items:center;background:#1d0a1b;color:#c6a6bd;font:600 15px/1.3 -apple-system,system-ui,"Segoe UI",Roboto,sans-serif}
.vs-attente p{margin:0;animation:vs-souffle 1.6s ease-in-out infinite}
@keyframes vs-souffle{50%{opacity:.45}}
@media (prefers-reduced-motion:reduce){.vs-attente p{animation:none}}
`;
