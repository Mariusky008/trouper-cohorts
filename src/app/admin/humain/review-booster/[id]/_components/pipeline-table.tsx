"use client";

type Client = {
  id: string;
  prenom: string;
  telephone: string;
  date_prestation: string;
  statut: string;
  date_envoi_j1: string | null;
  satisfaction: string | null;
};

type Props = {
  clients: Client[];
  statutLabels: Record<string, string>;
};

function badgeTone(statut: string) {
  if (statut === "avis_laissé") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (statut === "insatisfait") return "bg-red-50 text-red-700 border-red-200";
  if (statut === "cliqué") return "bg-blue-50 text-blue-700 border-blue-200";
  if (statut === "envoyé") return "bg-sky-50 text-sky-700 border-sky-200";
  if (statut === "relancé") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function PipelineTable({ clients, statutLabels }: Props) {
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4 sm:px-6">
        <h2 className="font-bold text-slate-900">Pipeline clients ({clients.length})</h2>
      </div>

      {clients.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">
          Aucun client importé. Utilisez l'import CSV ci-dessus.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left sm:px-6">Client</th>
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-left">Statut</th>
                <th className="px-3 py-3 text-left">Envoi J+1</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 sm:px-6">
                    <p className="font-medium text-slate-900">{c.prenom}</p>
                    <p className="text-xs text-slate-400">{c.telephone}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(c.date_prestation)}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeTone(c.statut)}`}>
                      {statutLabels[c.statut] ?? c.statut}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400">
                    {c.date_envoi_j1 ? formatDate(c.date_envoi_j1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totaux */}
      <div className="border-t px-5 py-3 sm:px-6">
        <p className="text-xs text-slate-500">
          Total : {clients.length} ·{" "}
          <span className="text-emerald-600 font-medium">{clients.filter((c) => c.statut === "avis_laissé").length} avis</span> ·{" "}
          <span className="text-red-600 font-medium">{clients.filter((c) => c.statut === "insatisfait").length} insatisfaits</span>
        </p>
      </div>
    </div>
  );
}
