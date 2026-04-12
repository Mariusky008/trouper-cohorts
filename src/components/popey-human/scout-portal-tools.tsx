"use client";

import { useMemo, useState, useEffect } from "react";
import { Share2, Copy, Smartphone } from "lucide-react";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const SCOUT_TOKEN_KEY = "popey_human_scout_token";

function formatTokenForReadability(token: string) {
  return token.replace(/(.{4})/g, "$1 ").trim();
}

export function ScoutPortalTools({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const portalUrl = useMemo(() => {
    if (typeof window === "undefined") return `/popey-human/eclaireur/${token}`;
    return `${window.location.origin}/popey-human/eclaireur/${token}`;
  }, [token]);

  useEffect(() => {
    try {
      localStorage.setItem(SCOUT_TOKEN_KEY, token);
    } catch {
      // ignore storage errors
    }
  }, [token]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    const text = "Voici mon portail Éclaireur Popey Human";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Portail Éclaireur", text, url: portalUrl });
      } catch {
        // user cancelled or share failed
      }
      return;
    }
    await handleCopy();
  };

  return (
    <>
      <section className="rounded-2xl border border-[#EAC886]/35 bg-[#2A2111]/80 p-4 space-y-3">
        <p className="text-xs uppercase font-black tracking-[0.12em] text-[#EAC886]/85">Accès rapide éclaireur</p>
        <p className="text-xs text-[#F6E7CA] break-all">{portalUrl}</p>
        <p className="text-[11px] text-[#F6E7CA]/80">
          Code d'accès: <span className="font-black tracking-wider">{formatTokenForReadability(token)}</span>
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleShare}
            className="h-10 rounded-lg border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide inline-flex items-center justify-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="h-10 rounded-lg border border-white/20 bg-white/10 text-xs font-black uppercase tracking-wide inline-flex items-center justify-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copié" : "Copier"}
          </button>
          <button
            type="button"
            onClick={() => setShowInstall(true)}
            className="h-10 rounded-lg bg-[#EAC886] text-black text-xs font-black uppercase tracking-wide inline-flex items-center justify-center gap-2"
          >
            <Smartphone className="h-4 w-4" />
            Installer
          </button>
        </div>
      </section>
      {showInstall ? <PWAInstallPrompt forceShow onDismiss={() => setShowInstall(false)} /> : null}
    </>
  );
}

