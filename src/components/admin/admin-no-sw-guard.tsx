"use client";

import { useEffect } from "react";

export function AdminNoServiceWorkerGuard() {
  useEffect(() => {
    let cancelled = false;

    async function disableServiceWorkersForAdmin() {
      try {
        if (!("serviceWorker" in navigator)) return;

        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Admin SW cleanup failed", error);
        }
      }
    }

    disableServiceWorkersForAdmin();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
