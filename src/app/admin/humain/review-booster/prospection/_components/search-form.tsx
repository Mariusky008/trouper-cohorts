"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ARRONDISSEMENTS: Record<string, string[]> = {
  paris: Array.from({ length: 20 }, (_, i) => i === 0 ? "1er" : `${i + 1}ème`),
  lyon: Array.from({ length: 9 }, (_, i) => i === 0 ? "1er" : `${i + 1}ème`),
  marseille: Array.from({ length: 16 }, (_, i) => i === 0 ? "1er" : `${i + 1}ème`),
};

function getArrondissements(ville: string): string[] | null {
  return ARRONDISSEMENTS[ville.toLowerCase().trim()] ?? null;
}

export function SearchForm() {
  const router = useRouter();
  const [ville, setVille] = useState("Dax");
  const [zone, setZone] = useState("");
  const [secteur, setSecteur] = useState("");
  const [limit, setLimit] = useState(10);
  const [maxAvis, setMaxAvis] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ found: number; imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const arrondissements = useMemo(() => getArrondissements(ville), [ville]);

  function handleVilleChange(v: string) {
    setVille(v);
    setZone(""); // reset zone when city changes
  }

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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ville</label>
          <Input value={ville} onChange={(e) => handleVilleChange(e.target.value)} placeholder="Bordeaux" required />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {arrondissements ? "Arrondissement" : "Zone / Quartier"}
            {!arrondissements && <span className="ml-1 normal-case font-normal text-slate-400">(optionnel)</span>}
          </label>
          {arrondissements ? (
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Tous</option>
              {arrondissements.map((arr) => (
                <option key={arr} value={arr}>{arr}</option>
              ))}
            </select>
          ) : (
            <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Mériadeck, Bacalan…" />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secteur</label>
          <Input value={secteur} onChange={(e) => setSecteur(e.target.value)} placeholder="coiffeur, garage…" />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nb résultats</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
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
        Scan auto : coiffeur, restaurant, boulangerie, garage, plombier, électricien, fleuriste, kiné, pizzeria, bar — moins de {maxAvis} avis.
        {arrondissements && ` Pour ${ville}, sélectionne un arrondissement ou laisse "Tous".`}
      </p>
    </div>
  );
}
