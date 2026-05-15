"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type HistoriqueRow = {
  ville: string;
  zone: string;
  secteur: string;
  date: string;
  count: number;
  contactes: number;
};

export function HistoriqueSection({ historique }: { historique: HistoriqueRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState<string | null>(null);

  async function handleClear() {
    if (!confirm("Supprimer tous les prospects contactés et refusés ?")) return;
    setClearing(true);
    setClearResult(null);
    try {
      const res = await fetch("/api/admin/humain/review-booster/prospection/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statuts: ["contacté", "refusé"] }),
      });
      const data = await res.json();
      setClearResult(`${data.deleted ?? 0} prospect(s) supprimé(s).`);
      router.refresh();
    } catch {
      setClearResult("Erreur réseau.");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 sm:px-7">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          <span>{open ? "▾" : "▸"}</span>
          Historique des recherches ({historique.length} entrées)
        </button>
        <div className="flex items-center gap-3">
          {clearResult && <span className="text-xs text-emerald-700 font-medium">{clearResult}</span>}
          <button
            onClick={handleClear}
            disabled={clearing}
            className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {clearing ? "Suppression…" : "🗑 Vider les contactés"}
          </button>
        </div>
      </div>

      {open && (
        <div className="overflow-x-auto border-t">
          {historique.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">Aucune recherche effectuée.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Ville</th>
                  <th className="px-5 py-3">Zone</th>
                  <th className="px-5 py-3">Secteur</th>
                  <th className="px-5 py-3">Importés</th>
                  <th className="px-5 py-3">Contactés</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {historique.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-2.5 text-slate-500">{row.date}</td>
                    <td className="px-5 py-2.5 font-medium text-slate-800">{row.ville}</td>
                    <td className="px-5 py-2.5 text-slate-500">{row.zone || "—"}</td>
                    <td className="px-5 py-2.5 text-slate-600">{row.secteur || "—"}</td>
                    <td className="px-5 py-2.5 text-slate-600">{row.count}</td>
                    <td className="px-5 py-2.5">
                      <span className={row.contactes > 0 ? "font-semibold text-emerald-700" : "text-slate-400"}>
                        {row.contactes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
