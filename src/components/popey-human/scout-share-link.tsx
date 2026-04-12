"use client";

import { useState } from "react";
import { Share2, Copy } from "lucide-react";

export function ScoutShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Portail Éclaireur Popey Human",
          text: "Accès direct à votre portail Éclaireur",
          url,
        });
      } catch {
        // noop
      }
      return;
    }
    await handleCopy();
  };

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleShare}
        className="h-8 rounded border border-white/20 px-2 text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1"
      >
        <Share2 className="h-3.5 w-3.5" />
        Partager
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="h-8 rounded border border-white/20 px-2 text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? "Copié" : "Copier lien"}
      </button>
    </div>
  );
}

