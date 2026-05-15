"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { commercantId: string; nom: string };

type ParsedRow = { prenom: string; telephone: string; date_prestation: string };

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const iPrenom = header.indexOf("prenom");
  const iTel = header.indexOf("telephone");
  const iDate = header.indexOf("date_prestation");
  if (iPrenom === -1 || iTel === -1 || iDate === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      prenom: cols[iPrenom] ?? "",
      telephone: cols[iTel] ?? "",
      date_prestation: cols[iDate] ?? "",
    };
  });
}

export function CsvImport({ commercantId, nom }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; ignored: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      const rows = parseCsv(text);
      if (!rows.length) { setError("Fichier invalide ou aucune ligne détectée. Colonnes attendues : prenom, telephone, date_prestation"); return; }
      setPreview(rows);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview?.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/humain/review-booster/clients/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commercant_id: commercantId, rows: preview }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); setLoading(false); return; }
      setResult({ imported: data.imported, ignored: data.ignored });
      setPreview(null);
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
      <p className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Importer des clients</p>

      {result && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          ✅ {result.imported} client{result.imported > 1 ? "s" : ""} importé{result.imported > 1 ? "s" : ""}
          {result.ignored > 0 ? ` · ${result.ignored} ignoré${result.ignored > 1 ? "s" : ""}` : ""}
        </div>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${dragging ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
        >
          <p className="text-sm font-medium text-slate-700">📎 Glissez votre fichier CSV ici</p>
          <p className="mt-1 text-xs text-slate-400">ou cliquez pour choisir</p>
          <p className="mt-3 text-xs text-slate-400">Format : prenom, telephone, date_prestation</p>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-slate-700">
            <strong>{preview.length} client{preview.length > 1 ? "s" : ""}</strong> détecté{preview.length > 1 ? "s" : ""} pour {nom}
          </p>
          <div className="mb-4 max-h-40 overflow-y-auto rounded-xl border text-xs">
            <table className="w-full">
              <thead className="border-b bg-slate-50">
                <tr>{["Prénom", "Téléphone", "Date"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {preview.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">{r.prenom}</td>
                    <td className="px-3 py-1.5">{r.telephone}</td>
                    <td className="px-3 py-1.5">{r.date_prestation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 10 && <p className="px-3 py-2 text-slate-400">+{preview.length - 10} autres…</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPreview(null)} className="flex-1 rounded-xl border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
            <button onClick={handleImport} disabled={loading} className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-slate-800">
              {loading ? "Import..." : `Importer ${preview.length} client${preview.length > 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
