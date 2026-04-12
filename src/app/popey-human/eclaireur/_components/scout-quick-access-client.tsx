"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const SCOUT_TOKEN_KEY = "popey_human_scout_token";

function extractToken(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "";
    if (/^[a-f0-9]{16,64}$/i.test(last)) return last.toLowerCase();
    if (/^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(last)) return last.toUpperCase();
  } catch {
    // not a URL
  }

  const normalized = trimmed.replace(/\s+/g, "").replace(/-/g, "").toLowerCase();
  if (/^[a-f0-9]{16,64}$/.test(normalized)) return normalized;
  if (/^[a-z0-9]{8}$/i.test(normalized)) {
    const upper = normalized.toUpperCase();
    return `${upper.slice(0, 4)}-${upper.slice(4, 8)}`;
  }
  return "";
}

export function ScoutQuickAccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [manualValue, setManualValue] = useState("");
  const [error, setError] = useState("");
  const queryToken = useMemo(() => searchParams.get("token") || searchParams.get("code") || "", [searchParams]);

  useEffect(() => {
    const directToken = extractToken(queryToken);
    if (directToken) {
      localStorage.setItem(SCOUT_TOKEN_KEY, directToken);
      router.replace(`/popey-human/eclaireur/${directToken}`);
      return;
    }

    const saved = localStorage.getItem(SCOUT_TOKEN_KEY);
    if (saved) {
      router.replace(`/popey-human/eclaireur/${saved}`);
    }
  }, [queryToken, router]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const token = extractToken(manualValue);
    if (!token) {
      setError("Lien ou code invalide. Collez le lien complet reçu.");
      return;
    }
    localStorage.setItem(SCOUT_TOKEN_KEY, token);
    router.push(`/popey-human/eclaireur/${token}`);
  };

  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white">
      <div className="mx-auto max-w-md px-4 py-10 space-y-5">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-[#EAC886]/85">Portail Éclaireur</p>
        <h1 className="text-3xl font-black">Accès rapide</h1>
        <p className="text-sm text-white/75">
          Collez votre lien d&apos;invitation une seule fois. Ensuite, cette page vous reconnecte automatiquement.
        </p>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/15 bg-black/25 p-4 space-y-3">
          <input
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="Collez votre lien /popey-human/eclaireur/..."
            className="h-11 w-full rounded border border-white/20 bg-black/25 px-3 text-sm"
          />
          <button className="h-11 w-full rounded bg-[#EAC886] text-black text-xs font-black uppercase tracking-wide">
            Ouvrir mon portail
          </button>
          {error ? <p className="text-xs text-red-300">{error}</p> : null}
        </form>
      </div>
    </main>
  );
}

