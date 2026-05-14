"use client";

import { useMemo, useState } from "react";

function trim(value: string): string {
  return String(value || "").trim();
}

export function ApifySearchCommand() {
  const [city, setCity] = useState("Dax");
  const [queries, setQueries] = useState("artisan,entreprise,plombier");
  const [batch, setBatch] = useState("5");
  const [maxRating, setMaxRating] = useState("3.5");
  const [copied, setCopied] = useState(false);

  const cmd = useMemo(() => {
    const safeCity = trim(city) || "Dax";
    const safeQueries = trim(queries) || "artisan,entreprise";
    const safeBatch = String(Math.max(1, Math.min(50, Number(batch || 5) || 5)));
    const safeMax = String(Math.max(0, Math.min(5, Number(maxRating || 3.5) || 3.5)));
    return `cd /Users/jeanphilippe/Desktop/trouper-cohorts/vitrine-auto && source venv/bin/activate && python main.py --ville "${safeCity}" --queries "${safeQueries}" --batch ${safeBatch} --max-rating ${safeMax}`;
  }, [batch, city, maxRating, queries]);

  const onCopy = async () => {
    setCopied(false);
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Recherche Apify</p>
      <h2 className="mt-1 text-xl font-black sm:text-2xl">Trouver des pros automatiquement</h2>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
        Pour l’instant, le lancement Apify se fait via une commande à copier-coller (le pipeline tourne en local).
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Ville (ex: Dax)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={queries}
          onChange={(event) => setQueries(event.target.value)}
          placeholder='Requêtes (ex: "artisan,entreprise,plombier")'
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={batch}
          onChange={(event) => setBatch(event.target.value)}
          placeholder="Batch (ex: 5)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
        <input
          value={maxRating}
          onChange={(event) => setMaxRating(event.target.value)}
          placeholder="Note max (ex: 3.5)"
          className="h-11 rounded-xl border bg-background px-3 text-sm"
        />
      </div>
      <div className="mt-4 rounded-2xl border bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-xs text-slate-600">
            <div className="font-mono break-all">{cmd}</div>
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white"
          >
            {copied ? "Copié" : "Copier commande"}
          </button>
        </div>
      </div>
    </div>
  );
}

