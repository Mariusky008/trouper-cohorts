"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Row = { id: string; metier: string; city: string; monthly_searches: number };

export function MarketDataManager({ rows, tableMissing }: { rows: Row[]; tableMissing: boolean }) {
  const router = useRouter();
  const [metier, setMetier] = useState("");
  const [city, setCity] = useState("");
  const [vol, setVol] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const add = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/humain/site-internet/market-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metier: metier.trim(), city: city.trim(), monthly_searches: vol }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(j.error || "Erreur.");
        return;
      }
      setMetier("");
      setCity("");
      setVol("");
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Supprimer cette ligne ?")) return;
    setBusy(true);
    try {
      await fetch("/api/admin/humain/site-internet/market-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const canAdd = metier.trim() && city.trim() && /^\d+$/.test(vol.replace(/\s/g, "")) && !busy;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">Données de marché</p>
      <h1 className="mt-1 text-2xl font-black sm:text-3xl">Recherches Google par métier &amp; ville</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Saisis de <strong>vrais volumes</strong> (Google Keyword Planner, Ubersuggest…). Ils remplissent
        automatiquement le bandeau « ~N recherches/mois » des lettres du même métier + ville, au diagnostic.
        <br />
        <span className="text-slate-500">Le métier doit correspondre à l&apos;« activité » du prospect (accents/majuscules ignorés).</span>
      </p>

      {tableMissing && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          La table n&apos;existe pas encore en base. Applique la migration
          <code className="mx-1">human_site_market_data</code> (Supabase → SQL Editor) pour activer cette page.
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]">
        <input value={metier} onChange={(e) => setMetier(e.target.value)} placeholder="Métier (ex: Hypnothérapeute)" className="h-11 rounded-xl border bg-background px-3 text-sm" />
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville (ex: Pau)" className="h-11 rounded-xl border bg-background px-3 text-sm" />
        <input value={vol} onChange={(e) => setVol(e.target.value)} placeholder="Recherches/mois" inputMode="numeric" className="h-11 rounded-xl border bg-background px-3 text-sm" />
        <button onClick={add} disabled={!canAdd} className="h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "…" : "Ajouter / MAJ"}
        </button>
      </div>
      {error ? <div className="mt-2 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-4">Métier</th>
              <th className="py-2 pr-4">Ville</th>
              <th className="py-2 pr-4">Recherches / mois</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400">Aucune donnée pour l&apos;instant.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2.5 pr-4 font-medium">{r.metier}</td>
                  <td className="py-2.5 pr-4">{r.city}</td>
                  <td className="py-2.5 pr-4 font-mono">{r.monthly_searches.toLocaleString("fr-FR")}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => del(r.id)} disabled={busy} className="text-xs font-semibold text-red-600 hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
