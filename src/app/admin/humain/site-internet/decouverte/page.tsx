// /admin/humain/site-internet/decouverte — Découverte EN LOT.
// Haut : lanceur (matrice métiers × villes, orchestration côté navigateur).
// Bas : les prospects créés, RANGÉS PAR VILLE → MÉTIER, chacun avec son bouton
// Lettre prêt à imprimer. C'est la page « je n'ai plus qu'à cliquer Lettre ».
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { BatchDiscover } from "../_components/batch-discover";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  id: string;
  slug: string;
  business_name: string | null;
  city: string | null;
  activite: string | null;
  variant: string | null;
  google_rating: number | null;
  letter_status: string | null;
  letter_delivered_at: string | null;
  contact_scanned_at: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "📝 Brouillon",
  validated: "✅ Validée",
  printed: "🖨️ Imprimée",
  delivered: "🤝 Remise",
  contacted: "📞 Contact reçu",
  skipped: "⏭️ Ignorée",
  excluded: "🚫 Exclue",
};

const txt = (v: unknown) => String(v || "").trim();
const norm = (v: unknown) =>
  txt(v).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const cap = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

export default async function DecouvertePage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_vitrine_sites")
    .select(
      "id,slug,business_name,city,activite,variant,google_rating,letter_status,letter_delivered_at,contact_scanned_at"
    )
    .eq("channel", "letter")
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows: Row[] = Array.isArray(data) ? (data as Row[]) : [];
  const hasError = Boolean(error);

  // Groupement ville → métier (on ignore les prospects sans ville/métier ici :
  // ils restent visibles dans la liste principale).
  const byVille = new Map<string, { label: string; metiers: Map<string, { label: string; rows: Row[] }> }>();
  for (const r of rows) {
    const vKey = norm(r.city);
    const mKey = norm(r.activite);
    if (!vKey || !mKey) continue;
    if (!byVille.has(vKey)) byVille.set(vKey, { label: cap(txt(r.city)), metiers: new Map() });
    const v = byVille.get(vKey)!;
    if (!v.metiers.has(mKey)) v.metiers.set(mKey, { label: txt(r.activite), rows: [] });
    v.metiers.get(mKey)!.rows.push(r);
  }
  const villes = Array.from(byVille.values()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
  const grouped = villes.length > 0;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">100% Humain · Prospection</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Découverte en lot</h1>
          </div>
          <Link href="/admin/humain/site-internet" className="text-sm font-semibold text-slate-600 hover:underline">
            ← Liste des prospects
          </Link>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          Lance la recherche pour tes métiers et villes cibles. Les prospects se créent automatiquement, rangés ci-dessous
          par ville puis par métier. Ouvre chaque <strong>Lettre</strong> pour la valider et l&apos;imprimer.
        </p>
      </div>

      <BatchDiscover />

      {hasError ? (
        <div className="rounded-2xl border bg-white p-5 text-sm text-red-700 shadow-sm">
          Erreur Supabase : {txt(error?.message)}
        </div>
      ) : !grouped ? (
        <div className="rounded-2xl border bg-white px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
          Aucun prospect issu de la découverte pour l&apos;instant. Lance une ville ci-dessus.
        </div>
      ) : (
        <div className="space-y-5">
          {villes.map((v) => {
            const metiers = Array.from(v.metiers.values()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
            const total = metiers.reduce((n, m) => n + m.rows.length, 0);
            return (
              <div key={v.label} className="rounded-2xl border bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
                  <h2 className="text-lg font-black text-slate-900">{v.label}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500">{total} prospect{total > 1 ? "s" : ""}</span>
                    <Link
                      href={`/admin/humain/site-internet/lettres/${encodeURIComponent(v.label)}`}
                      target="_blank"
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      🖨️ Toutes les lettres ({total}) → PDF
                    </Link>
                  </div>
                </div>
                <div className="divide-y">
                  {metiers.map((m) => (
                    <details key={m.label} className="group px-5 py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-xs font-black uppercase tracking-wide text-sky-700 marker:content-none [&::-webkit-details-marker]:hidden">
                        <span>{m.label} <span className="text-slate-400">· {m.rows.length}</span></span>
                        <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
                      </summary>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-sm">
                          <tbody>
                            {m.rows.map((r) => (
                              <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="py-2 pr-3 font-semibold text-slate-900">{r.business_name || "—"}</td>
                                <td className="py-2 pr-3">
                                  {r.variant ? (
                                    <span
                                      className="rounded px-2 py-0.5 text-xs font-bold text-black"
                                      style={{ background: r.variant === "A" ? "#fbbf24" : "#93c5fd" }}
                                    >
                                      {r.variant}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="py-2 pr-3 text-xs text-slate-600">
                                  {STATUS_LABEL[txt(r.letter_status)] ?? r.letter_status}
                                  {r.contact_scanned_at && (
                                    <span className="ml-1 font-semibold text-sky-600">👁</span>
                                  )}
                                </td>
                                <td className="py-2 pr-3">
                                  <Link
                                    href={`/admin/humain/site-internet/lettre/${r.slug}`}
                                    target="_blank"
                                    className="rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800"
                                  >
                                    Lettre →
                                  </Link>
                                </td>
                                <td className="py-2">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {[
                                      { action: "validate", label: "Valider" },
                                      { action: "printed", label: "Imprimée" },
                                      { action: "delivered", label: "Remise" },
                                      { action: "skip", label: "Ignorer" },
                                    ].map((a) => (
                                      <form key={a.action} action="/api/admin/humain/site-internet/prospect" method="post">
                                        <input type="hidden" name="id" value={r.id} />
                                        <input type="hidden" name="action" value={a.action} />
                                        <button type="submit" className="rounded border px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100">
                                          {a.label}
                                        </button>
                                      </form>
                                    ))}
                                    <form action="/api/admin/humain/site-internet/prospect" method="post">
                                      <input type="hidden" name="id" value={r.id} />
                                      <input type="hidden" name="action" value="delete" />
                                      <button type="submit" className="rounded px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50">
                                        🗑
                                      </button>
                                    </form>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
