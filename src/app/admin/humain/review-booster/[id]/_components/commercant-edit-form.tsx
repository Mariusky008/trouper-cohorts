"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Commerce = {
  id: string;
  nom: string;
  proprietaire: string | null;
  telephone: string | null;
  email: string | null;
  ville: string;
  secteur: string | null;
  place_id: string | null;
  lien_avis: string | null;
  abonnement: string;
  mensualite: number;
  nb_avis_debut: number | null;
  nb_avis_actuel: number | null;
  note_actuelle: number | null;
};

type Props = { commerce: Commerce };

export function CommercantEditForm({ commerce }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: commerce.nom,
    proprietaire: commerce.proprietaire ?? "",
    telephone: commerce.telephone ?? "",
    email: commerce.email ?? "",
    ville: commerce.ville,
    secteur: commerce.secteur ?? "",
    place_id: commerce.place_id ?? "",
    abonnement: commerce.abonnement,
    mensualite: String(commerce.mensualite ?? 79),
    nb_avis_debut: String(commerce.nb_avis_debut ?? 0),
    nb_avis_actuel: String(commerce.nb_avis_actuel ?? 0),
    note_actuelle: String(commerce.note_actuelle ?? ""),
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/humain/review-booster/commercants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commerce.id, ...form, mensualite: Number(form.mensualite), nb_avis_debut: Number(form.nb_avis_debut), nb_avis_actuel: Number(form.nb_avis_actuel), note_actuelle: form.note_actuelle ? Number(form.note_actuelle) : null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); setLoading(false); return; }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erreur réseau");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full rounded-2xl border border-dashed border-slate-300 bg-white py-4 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:bg-slate-50 transition-colors">
        ✏️ Modifier ce commerçant
      </button>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
      <h2 className="mb-5 font-bold text-slate-900">Modifier</h2>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nom *</label>
          <input value={form.nom} onChange={(e) => set("nom", e.target.value)} required className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Propriétaire</label>
          <input value={form.proprietaire} onChange={(e) => set("proprietaire", e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Téléphone</label>
          <input value={form.telephone} onChange={(e) => set("telephone", e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Abonnement</label>
          <select value={form.abonnement} onChange={(e) => set("abonnement", e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300">
            <option value="actif">Actif</option>
            <option value="pause">Pause</option>
            <option value="résilié">Résilié</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Mensualité (€)</label>
          <input type="number" value={form.mensualite} onChange={(e) => set("mensualite", e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Place ID Google</label>
          <input value={form.place_id} onChange={(e) => set("place_id", e.target.value)} placeholder="ChIJ..." className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nb avis au départ</label>
          <input type="number" value={form.nb_avis_debut} onChange={(e) => set("nb_avis_debut", e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nb avis actuel <span className="normal-case font-normal text-slate-400">(aujourd'hui)</span></label>
          <input type="number" value={form.nb_avis_actuel} onChange={(e) => set("nb_avis_actuel", e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Note actuelle <span className="normal-case font-normal text-slate-400">(ex: 4.1)</span></label>
          <input type="number" step="0.1" min="1" max="5" value={form.note_actuelle} onChange={(e) => set("note_actuelle", e.target.value)} placeholder="4.1" className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
        {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 sm:col-span-2">
          <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-xl border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Annuler</button>
          <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-slate-800">{loading ? "Sauvegarde..." : "Enregistrer"}</button>
        </div>
      </form>
    </div>
  );
}
