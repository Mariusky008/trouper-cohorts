"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
  approved_at?: string | null;
  rejected_at?: string | null;
  sent_at?: string | null;
  revision_instructions?: string | null;
  preview_url?: string | null;
  preview_storage_prefix?: string | null;
};

function normalize(value: unknown) {
  return String(value || "").trim();
}

function humanizeError(rawValue: unknown) {
  const raw = normalize(rawValue).replace(/^'+|'+$/g, "");
  if (!raw) return "";
  if (raw === "html_too_small") return "Site généré trop léger (manque de contenu).";
  if (raw === "missing_contact") return "WhatsApp manquant ou invalide.";
  if (raw === "too_little_content") return "Contenu insuffisant sur le site source.";
  if (raw === "no_assets") return "Aucune image exploitable (assets manquants).";
  if (raw === "missing_source_website") return "Site source manquant.";
  if (raw === "phone_e164_digits_only") return "Erreur template WhatsApp (variable manquante).";
  if (raw.startsWith("whatsapp_failed:")) return `WhatsApp: ${raw.replace(/^whatsapp_failed:\s*/i, "")}`;
  return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
}

async function copyToClipboard(value: string) {
  const text = normalize(value);
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function badgeTone(status: string) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "sent") return "border-indigo-200 bg-indigo-50 text-indigo-800";
  if (status === "uploaded") return "border-slate-200 bg-slate-50 text-slate-800";
  if (status === "preview_uploaded") return "border-amber-200 bg-amber-50 text-amber-900";
  if (status === "queued" || status === "queued_preview") return "border-sky-200 bg-sky-50 text-sky-900";
  if (status === "error" || status === "rejected") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-white text-slate-700";
}

function canApprove(status: string) {
  return status === "uploaded";
}

function canReject(status: string) {
  return status === "uploaded" || status === "approved";
}

function canRequeue(status: string) {
  return ["error", "rejected", "generated", "uploaded", "approved", "preview_uploaded"].includes(status);
}

function canSendWhatsApp(status: string) {
  return status === "approved";
}

async function postJson(endpoint: string, payload: Record<string, unknown>) {
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

export function VitrinesDrawerDashboard({ vitrines }: { vitrines: VitrineRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<VitrineRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [instructions, setInstructions] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query).toLowerCase();
    if (!q) return vitrines;
    return vitrines.filter((row) => {
      const hay = [
        row.slug,
        row.business_name,
        row.city,
        row.category,
        row.status,
        row.whatsapp_phone_e164 || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, vitrines]);

  const openRow = (row: VitrineRow) => {
    setError("");
    setInfo("");
    setSelected(row);
    setInstructions(normalize(row.revision_instructions));
  };

  const close = () => {
    setSelected(null);
    setInstructions("");
  };

  const refresh = () => router.refresh();

  const runAction = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await fn();
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onApprove = () =>
    runAction(async () => {
      if (!selected) return;
      await postJson("/api/admin/humain/vitrines/approve", { slug: selected.slug });
      setInfo("Vitrine approuvée.");
    });

  const onReject = () =>
    runAction(async () => {
      if (!selected) return;
      const reasonRaw = window.prompt("Raison du rejet (optionnel) :", "") ?? "";
      const reason = normalize(reasonRaw).slice(0, 250);
      await postJson("/api/admin/humain/vitrines/reject", { slug: selected.slug, reason });
      setInfo("Vitrine rejetée.");
    });

  const onRequeue = () =>
    runAction(async () => {
      if (!selected) return;
      await postJson("/api/admin/humain/vitrines/requeue", { slug: selected.slug });
      setInfo("Requeue demandé.");
    });

  const onSendWhatsApp = () =>
    runAction(async () => {
      if (!selected) return;
      await postJson("/api/admin/humain/vitrines/send-whatsapp", { slug: selected.slug });
      setInfo("Message ajouté à la file d’envoi.");
    });

  const onSaveInstructions = () =>
    runAction(async () => {
      if (!selected) return;
      await postJson("/api/admin/humain/vitrines/update-instructions", { slug: selected.slug, instructions });
      setInfo("Instructions sauvegardées.");
    });

  const onGeneratePreview = () =>
    runAction(async () => {
      if (!selected) return;
      const res = await postJson("/api/admin/humain/vitrines/preview/enqueue", { slug: selected.slug });
      const url =
        typeof res === "object" && res && "previewUrl" in res ? String((res as { previewUrl?: unknown }).previewUrl || "").trim() : "";
      setInfo(url ? `Preview en file d’attente. URL: ${url}` : "Preview en file d’attente.");
    });

  const onPublishPreview = () =>
    runAction(async () => {
      if (!selected) return;
      await postJson("/api/admin/humain/vitrines/preview/publish", { slug: selected.slug });
      setInfo("Preview publiée sur l’URL publique.");
    });

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-5 py-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Vitrines</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">Pilotage</h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="h-10 w-[260px] rounded-full border bg-white px-4 text-sm"
          />
          <a
            href="https://vitrine.popey.academy"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Ouvrir vitrine.popey.academy
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-left text-sm">
          <thead className="bg-white">
            <tr className="border-b text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
              <th className="px-5 py-3">Entreprise</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Ville</th>
              <th className="px-5 py-3">WhatsApp</th>
              <th className="px-5 py-3">Créée</th>
                <th className="px-5 py-3 text-right">Voir</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const status = normalize(row.status);
                const humanError = humanizeError(row.error_reason);
              return (
                <tr
                  key={row.id}
                  className="border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => openRow(row)}
                >
                  <td className="px-5 py-3">
                    <div className="font-black text-slate-950">{normalize(row.business_name) || "—"}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{normalize(row.slug)}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeTone(status)}`}>
                      {status || "—"}
                    </span>
                      {humanError ? <div className="mt-1 text-xs font-semibold text-red-700">{humanError}</div> : null}
                  </td>
                  <td className="px-5 py-3 text-slate-700">{normalize(row.city) || "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{normalize(row.whatsapp_phone_e164) || "—"}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    {normalize(row.created_at) ? new Date(normalize(row.created_at)).toLocaleString("fr-FR") : "—"}
                  </td>
                    <td className="px-5 py-3 text-right text-xs font-semibold text-slate-700">Voir →</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => (!open ? close() : null)}>
        <DialogContent
          className="fixed right-0 top-0 left-auto translate-x-0 translate-y-0 h-[100dvh] w-[min(620px,100%)] max-w-none rounded-none border-l p-0"
          showCloseButton
        >
          <div className="flex h-full flex-col">
            <div className="border-b bg-white px-6 py-5">
              <DialogTitle className="text-xl font-black text-slate-950">
                {selected ? normalize(selected.business_name) || "Vitrine" : "Vitrine"}
              </DialogTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-mono">{selected ? normalize(selected.slug) : ""}</span>
                {selected ? (
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeTone(normalize(selected.status))}`}>
                    {normalize(selected.status) || "—"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div> : null}
              {info ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{info}</div> : null}

              {selected ? (
                <div className="grid gap-3 rounded-2xl border bg-slate-50 p-4">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="font-black uppercase tracking-[0.12em] text-slate-500">Ville</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{normalize(selected.city) || "—"}</div>
                    </div>
                    <div>
                      <div className="font-black uppercase tracking-[0.12em] text-slate-500">Catégorie</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{normalize(selected.category) || "—"}</div>
                    </div>
                    <div>
                      <div className="font-black uppercase tracking-[0.12em] text-slate-500">WhatsApp</div>
                      <div className="mt-1 font-mono text-xs text-slate-900">{normalize(selected.whatsapp_phone_e164) || "—"}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {normalize(selected.public_url) ? (
                      <a
                        href={normalize(selected.public_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        Ouvrir public
                      </a>
                    ) : null}
                    {normalize(selected.source_website) ? (
                      <a
                        href={normalize(selected.source_website)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        Ouvrir source
                      </a>
                    ) : null}
                    {normalize(selected.preview_url) && normalize(selected.status) === "preview_uploaded" ? (
                      <a
                        href={normalize(selected.preview_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        Ouvrir preview
                      </a>
                    ) : normalize(selected.status) === "queued_preview" ? (
                      <button
                        type="button"
                        disabled
                        className="rounded-full border bg-white px-3 py-2 text-xs font-semibold text-slate-500 opacity-70"
                      >
                        Preview en attente
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        const ok = await copyToClipboard(normalize(selected.slug));
                        setInfo(ok ? "Slug copié." : "Impossible de copier le slug.");
                      }}
                      className="rounded-full border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Copier slug
                    </button>
                    {normalize(selected.whatsapp_phone_e164) ? (
                      <a
                        href={`/admin/humain/chat?phone=${encodeURIComponent(normalize(selected.whatsapp_phone_e164))}`}
                        className="rounded-full border bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        Ouvrir chat
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Actions</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Workflow</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !selected || !canApprove(normalize(selected.status))}
                    onClick={onApprove}
                    className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    disabled={busy || !selected || !canReject(normalize(selected.status))}
                    onClick={onReject}
                    className="rounded-full border bg-white px-4 py-2 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Rejeter
                  </button>
                  <button
                    type="button"
                    disabled={busy || !selected || !canRequeue(normalize(selected.status))}
                    onClick={onRequeue}
                    className="rounded-full border bg-white px-4 py-2 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Requeue
                  </button>
                  <button
                    type="button"
                    disabled={busy || !selected || !canSendWhatsApp(normalize(selected.status))}
                    onClick={onSendWhatsApp}
                    className="rounded-full border bg-white px-4 py-2 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Envoyer WhatsApp
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Instructions de modification</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Brief à Claude</div>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={8}
                  placeholder="Ex: Rends la page plus aérée, augmente la taille des titres, ajoute une section avis, CTA WhatsApp sticky..."
                  className="mt-3 w-full rounded-2xl border bg-white p-3 text-sm"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !selected}
                    onClick={onSaveInstructions}
                    className="rounded-full border bg-white px-4 py-2 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    disabled={busy || !selected}
                    onClick={onGeneratePreview}
                    className="rounded-full bg-amber-500 px-4 py-2 text-xs font-black text-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Générer preview
                  </button>
                  <button
                    type="button"
                    disabled={busy || !selected || normalize(selected.status) !== "preview_uploaded" || !normalize(selected.preview_url)}
                    onClick={onPublishPreview}
                    className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Publier preview
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      const cmd =
                        "cd /Users/jeanphilippe/Desktop/trouper-cohorts/vitrine-auto && source venv/bin/activate && python main.py --consume-queue --batch 1";
                      const ok = await copyToClipboard(cmd);
                      setInfo(ok ? "Commande pipeline copiée." : "Impossible de copier la commande pipeline.");
                    }}
                    className="rounded-full border bg-white px-4 py-2 text-xs font-bold text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copier commande pipeline
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Après “Générer preview”, lance le pipeline local: <span className="font-mono">python main.py --consume-queue --batch 1</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
