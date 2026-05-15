"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProspectRow = {
  id: string;
  nom: string;
  ville: string;
  secteur: string | null;
  note_google: number | null;
  nb_avis: number | null;
  telephone: string;
  statut: "nouveau" | "contacté" | "converti" | "refusé";
  proprietaire: string | null;
};

const statutColors: Record<string, string> = {
  nouveau: "bg-slate-100 text-slate-700 border-slate-200",
  contacté: "bg-blue-50 text-blue-700 border-blue-200",
  converti: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refusé: "bg-red-50 text-red-700 border-red-200",
};

function NoteCell({ note }: { note: number | null }) {
  if (note === null) return <span className="text-slate-300">—</span>;
  const color = note < 3.0 ? "text-red-600" : note < 3.7 ? "text-amber-600" : "text-emerald-600";
  return <span className={`font-semibold ${color}`}>★ {note.toFixed(1)}</span>;
}

export function ProspectsTable({ prospects }: { prospects: ProspectRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contentSid, setContentSid] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; skipped: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [convertResults, setConvertResults] = useState<Record<string, { slug: string; commercantId: string }>>({});
  const [convertingId, setConvertingId] = useState<string | null>(null);

  function toggleAll() {
    const newable = prospects.filter((p) => p.statut === "nouveau").map((p) => p.id);
    if (newable.every((id) => selected.has(id))) {
      setSelected((prev) => {
        const next = new Set(prev);
        newable.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        newable.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSend() {
    if (!selected.size || !contentSid) return;
    setSendLoading(true);
    setSendResult(null);
    setSendError(null);
    try {
      const res = await fetch("/api/admin/humain/review-booster/prospection/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectIds: Array.from(selected), contentSid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Erreur inconnue.");
      } else {
        setSendResult(data);
        setSelected(new Set());
        router.refresh();
      }
    } catch {
      setSendError("Erreur réseau.");
    } finally {
      setSendLoading(false);
    }
  }

  async function handleConvert(prospectId: string) {
    setConvertingId(prospectId);
    try {
      const res = await fetch("/api/admin/humain/review-booster/prospection/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });
      const data = await res.json();
      if (res.ok) {
        setConvertResults((prev) => ({ ...prev, [prospectId]: data }));
        router.refresh();
      }
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-5 py-4 sm:px-7 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <Input
            value={contentSid}
            onChange={(e) => setContentSid(e.target.value)}
            placeholder="HXxxxxxxxxx..."
            className="w-48"
          />
          <Button
            onClick={handleSend}
            disabled={sendLoading || !selected.size || !contentSid}
            className="bg-neutral-900 text-white hover:bg-neutral-700 rounded-full px-6 py-2 text-sm"
          >
            {sendLoading ? "Envoi…" : "Envoyer WhatsApp aux sélectionnés"}
          </Button>
          {sendResult && (
            <span className="text-sm text-emerald-700 font-medium">
              {sendResult.sent} envoyés · {sendResult.skipped} ignorés
            </span>
          )}
          {sendError && (
            <span className="text-sm text-red-600 font-medium">{sendError}</span>
          )}
        </div>
      </div>

      {prospects.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          Aucun prospect. Utilisez la recherche ci-dessus.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    onChange={toggleAll}
                    checked={
                      prospects.filter((p) => p.statut === "nouveau").length > 0 &&
                      prospects
                        .filter((p) => p.statut === "nouveau")
                        .every((p) => selected.has(p.id))
                    }
                  />
                </th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Secteur</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Avis</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {prospects.map((p) => {
                const converted = convertResults[p.id];
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      {p.statut === "nouveau" && (
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleOne(p.id)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.nom}</td>
                    <td className="px-4 py-3 text-slate-600">{p.ville}</td>
                    <td className="px-4 py-3 text-slate-500">{p.secteur || "—"}</td>
                    <td className="px-4 py-3">
                      <NoteCell note={p.note_google !== null ? Number(p.note_google) : null} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.nb_avis ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{p.telephone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statutColors[p.statut] ?? ""}`}
                      >
                        {p.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {converted ? (
                        <a
                          href={`/admin/humain/review-booster/${converted.commercantId}`}
                          className="text-xs text-emerald-700 font-semibold underline"
                        >
                          Voir le commerçant →
                        </a>
                      ) : (p.statut === "nouveau" || p.statut === "contacté") ? (
                        <button
                          onClick={() => handleConvert(p.id)}
                          disabled={convertingId === p.id}
                          className="text-xs font-semibold text-slate-700 underline hover:text-slate-900 disabled:opacity-50"
                        >
                          {convertingId === p.id ? "…" : "Convertir"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
