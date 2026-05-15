"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm() {
  const router = useRouter();
  const [ville, setVille] = useState("Dax");
  const [zone, setZone] = useState("");
  const [secteur, setSecteur] = useState("");
  const [limit, setLimit] = useState<10 | 20 | 30>(10);
  const [maxAvis, setMaxAvis] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ found: number; imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(modeAuto: boolean) {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/humain/review-booster/prospection/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ville, zone, secteur, limit, maxAvis, modeAuto }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Erreur inconnue.");
      else { setResult(data); router.refresh(); }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Recherche Apify</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ville</label>
          <Input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Bordeaux" required />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Zone / Quartier <span className="normal-case font-normal text-slate-400">(optionnel)</span></label>
          <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Mériadeck, Bacalan…" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secteur</label>
          <Input value={secteur} onChange={(e) => setSecteur(e.target.value)} placeholder="coiffeur, garage…" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nb résultats</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) as 10 | 20 | 30)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max avis Google</label>
          <Input
            type="number"
            value={maxAvis}
            onChange={(e) => setMaxAvis(Number(e.target.value))}
            min={1}
            max={500}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => submit(false)}
          disabled={loading || !secteur}
          className="bg-neutral-900 text-white hover:bg-neutral-700 rounded-full px-6 py-2 text-sm"
        >
          {loading ? "Recherche…" : "Rechercher (1 secteur)"}
        </Button>

        <Button
          type="button"
          onClick={() => submit(true)}
          disabled={loading}
          className="bg-violet-600 text-white hover:bg-violet-700 rounded-full px-6 py-2 text-sm"
        >
          {loading ? "Scan en cours…" : "⚡ Scan auto (10 secteurs)"}
        </Button>

        {result && (
          <p className="text-sm text-emerald-700 font-medium">
            {result.found} trouvés · {result.imported} importés · {result.skipped} ignorés
          </p>
        )}
        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      </div>

      <p className="text-xs text-slate-400">
        Le scan auto recherche : coiffeur, restaurant, boulangerie, garage, plombier, électricien, fleuriste, kiné, pizzeria, bar — et importe ceux avec moins de {maxAvis} avis Google.
      </p>
    </div>
  );
}
