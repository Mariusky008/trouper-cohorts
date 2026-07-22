"use client";

// Beacon de scan : au montage (donc dans un VRAI navigateur, pas un robot
// d'aperçu de lien), prévient le serveur qu'on a ouvert la maquette → alerte
// « QR scanné » à Marius (1re fois seulement, dédup côté serveur). Silencieux.
import { useEffect } from "react";

export function ScanBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      fetch(`/api/site-internet/${encodeURIComponent(slug)}/scan`, { method: "POST", keepalive: true });
    } catch {
      /* best-effort */
    }
  }, [slug]);
  return null;
}
