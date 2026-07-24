"use client";

// Admin — récupérer le lien de la maquette (site web) d'un prospect, pour l'envoyer
// directement (WhatsApp, SMS, mail) quand on ne peut pas remettre le QR de la lettre.
// Le lien pointe vers la maquette publique : /site-internet/apercu/[slug].
import { useState } from "react";

export function SiteLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const url = () => `${typeof window !== "undefined" ? window.location.origin : ""}/site-internet/apercu/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* presse-papier indisponible → le bouton « Ouvrir » reste utilisable */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <a
        href={`/site-internet/apercu/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
      >
        Ouvrir
      </a>
      <button
        type="button"
        onClick={copy}
        className={`rounded border px-2 py-1 text-xs font-bold ${copied ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "text-sky-700 hover:bg-sky-50"}`}
      >
        {copied ? "✓ Copié" : "🔗 Copier le lien"}
      </button>
    </div>
  );
}
