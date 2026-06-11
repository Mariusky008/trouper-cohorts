"use client";

import { useEffect } from "react";

// Désenregistre les service workers périmés + vide les caches sur les pages
// /privilege (catalogue public). Corrige le cas "vieil écran" sur l'app installée
// (PWA) où un ancien SW servait une version périmée de la page.
// Si la page était contrôlée par un SW, on recharge UNE seule fois (garde
// sessionStorage anti-boucle) pour récupérer la version fraîche.
export function PrivilegeFreshGuard() {
  useEffect(() => {
    let cancelled = false;
    async function cleanup() {
      try {
        if (!("serviceWorker" in navigator)) return;
        const hadController = Boolean(navigator.serviceWorker.controller);
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length) {
          await Promise.all(registrations.map((r) => r.unregister()));
        }
        if ("caches" in window) {
          const names = await caches.keys();
          await Promise.all(names.map((n) => caches.delete(n)));
        }
        const FLAG = "popey_priv_sw_purged_v1";
        if ((hadController || registrations.length > 0) && !sessionStorage.getItem(FLAG)) {
          sessionStorage.setItem(FLAG, "1");
          window.location.reload();
        }
      } catch (error) {
        if (!cancelled) console.warn("Privilege SW cleanup failed", error);
      }
    }
    cleanup();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
