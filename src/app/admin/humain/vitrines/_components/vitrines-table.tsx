"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type VitrineRow = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  category: string;
  whatsapp_phone_e164: string | null;
  status: string;
  public_url: string;
  source_website: string;
  error_reason: string | null;
  created_at: string;
};

function normalize(value: unknown) {
  return String(value || "").trim();
}

function canApprove(status: string) {
  return ["uploaded"].includes(status);
}

function canReject(status: string) {
  return ["uploaded", "approved"].includes(status);
}

function canRequeue(status: string) {
  return ["error", "rejected", "generated", "uploaded", "approved"].includes(status);
}

function canSendWhatsApp(status: string) {
  return ["approved"].includes(status);
}

async function callAction(endpoint: string, payload: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMessage =
      typeof json === "object" && json && "error" in json ? String((json as { error?: unknown }).error || "") : "";
    throw new Error(errorMessage || "Erreur inconnue.");
  }
  return json;
}

export function VitrinesTable({ vitrines }: { vitrines: VitrineRow[] }) {
  const router = useRouter();
  const [busySlug, setBusySlug] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const ordered = useMemo(() => vitrines, [vitrines]);

  const onApprove = async (slug: string) => {
    setError("");
    setInfo("");
    setBusySlug(slug);
    try {
      await callAction("/api/admin/humain/vitrines/approve", { slug });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusySlug("");
    }
  };

  const onReject = async (slug: string) => {
    setError("");
    setInfo("");
    const reasonRaw = window.prompt("Raison du rejet (optionnel) :", "") ?? "";
    const reason = normalize(reasonRaw).slice(0, 250);
    setBusySlug(slug);
    try {
      await callAction("/api/admin/humain/vitrines/reject", { slug, reason });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusySlug("");
    }
  };

  const onRequeue = async (slug: string) => {
    setError("");
    setInfo("");
    setBusySlug(slug);
    try {
      await callAction("/api/admin/humain/vitrines/requeue", { slug });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusySlug("");
    }
  };

  const onSendWhatsApp = async (slug: string) => {
    setError("");
    setInfo("");
    setBusySlug(slug);
    try {
      await callAction("/api/admin/humain/vitrines/send-whatsapp", { slug });
      setInfo("Message WhatsApp ajouté à la file d’envoi.");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusySlug("");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-600">Dernières vitrines</h2>
        <a
          href="https://vitrine.popey.academy"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Ouvrir vitrine.popey.academy
        </a>
      </div>

      {error ? <div className="border-b px-5 py-3 text-sm font-semibold text-red-700">{error}</div> : null}
      {info ? <div className="border-b px-5 py-3 text-sm font-semibold text-emerald-700">{info}</div> : null}

      {ordered.length === 0 ? (
        <div className="p-5 text-sm text-muted-foreground">Aucune vitrine pour le moment.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1060px] w-full text-left text-sm">
            <thead className="bg-white">
              <tr className="border-b text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                <th className="px-5 py-3">Entreprise</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3">Ville</th>
                <th className="px-5 py-3">Catégorie</th>
                <th className="px-5 py-3">WhatsApp</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Public</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Créée</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((row) => {
                const publicUrl = normalize(row.public_url);
                const sourceUrl = normalize(row.source_website);
                const status = normalize(row.status);
                const whatsapp = normalize(row.whatsapp_phone_e164);
                const created = normalize(row.created_at);
                const isBusy = busySlug === normalize(row.slug);
                return (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="px-5 py-3 font-semibold text-slate-950">
                      {normalize(row.business_name) || "—"}
                      {row.error_reason ? <div className="mt-1 text-xs font-medium text-red-700">{normalize(row.error_reason)}</div> : null}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">{normalize(row.slug) || "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{normalize(row.city) || "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{normalize(row.category) || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-700">{whatsapp || "—"}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex rounded-full border bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {status || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {publicUrl ? (
                        <a href={publicUrl} target="_blank" rel="noreferrer" className="text-emerald-700 underline">
                          Ouvrir
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {sourceUrl ? (
                        <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-slate-700 underline">
                          Site
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{created ? new Date(created).toLocaleString("fr-FR") : "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isBusy || !canApprove(status)}
                          onClick={() => onApprove(normalize(row.slug))}
                          className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Approuver
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || !canReject(status)}
                          onClick={() => onReject(normalize(row.slug))}
                          className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Rejeter
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || !canRequeue(status)}
                          onClick={() => onRequeue(normalize(row.slug))}
                          className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Requeue
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || !canSendWhatsApp(status)}
                          onClick={() => onSendWhatsApp(normalize(row.slug))}
                          className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Envoyer WhatsApp
                        </button>
                      </div>
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
