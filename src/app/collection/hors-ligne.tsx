"use client";

/**
 * 📡 PAS DE CONNEXION — l'audit UX du 28 novembre 2026, lot 5b : quand le réseau tombe, l'appli le dit, en haut de
 * l'écran (« ClikMe reprend dès qu'elle revient »), au lieu de laisser chaque écran échouer sans un mot. Et l'appli
 * installée prépare son écran « Pas de connexion » pour un lancement sans réseau (`preparerHorsLigne`).
 *
 * FICHIER NAVIGATEUR.
 */
import { useEffect, useSyncExternalStore } from "react";
import { preparerHorsLigne } from "@/lib/direct/appli-collection";

export const PHRASE_HORS_LIGNE = "📡 Pas de connexion : ClikMe reprend dès qu’elle revient.";

function abonner(f: () => void) {
  window.addEventListener("online", f);
  window.addEventListener("offline", f);
  return () => {
    window.removeEventListener("online", f);
    window.removeEventListener("offline", f);
  };
}

export function BandeauHorsLigne() {
  const enLigne = useSyncExternalStore(abonner, () => navigator.onLine, () => true);
  useEffect(() => preparerHorsLigne(), []);
  if (enLigne) return null;
  return (
    <p className="hl-bandeau" role="status" data-hors-ligne>
      {PHRASE_HORS_LIGNE}
      <style>{`.hl-bandeau{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));z-index:80;transform:translateX(-50%);max-width:calc(100% - 32px);margin:0;padding:10px 16px;border-radius:14px;background:#FFD27A;color:#22091B;font-weight:800;font-size:13.5px;line-height:1.35;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.45)}`}</style>
    </p>
  );
}
