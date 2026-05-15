"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm() {
  const [ville, setVille] = useState("Dax");
  const [secteur, setSecteur] = useState("");
  const [limit, setLimit] = useState<10 | 20 | 30>(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ found: number; imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/humain/review-booster/prospection/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ville, secteur, limit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur inconnue.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Recherche Apify</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ville</label>
          <Input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Dax"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secteur</label>
          <Input
            value={secteur}
            onChange={(e) => setSecteur(e.target.value)}
            placeholder="boulangerie, coiffeur, garage..."
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) as 10 | 20 | 30)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={loading}
          className="bg-neutral-900 text-white hover:bg-neutral-700 rounded-full px-6 py-2 text-sm"
        >
          {loading ? "Recherche en cours…" : "Rechercher via Apify"}
        </Button>

        {result && (
          <p className="text-sm text-emerald-700 font-medium">
            {result.found} trouvés · {result.imported} importés · {result.skipped} ignorés
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>
    </form>
  );
}
