// /admin/rejoindre/lettre — Liste tous les prospects avec lien vers leur lettre PDF
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LettreIndexPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_marketplace_places")
    .select("id, company_name, prenom, metier, city, commerce_slug, reco_status, deadline_at, letter_sent_at")
    .not("commerce_slug", "is", null)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const statusLabel: Record<string, string> = {
    prospect: "📬 Prospect",
    claimed: "✅ Réclamé",
    expired: "❌ Expiré",
  };

  const fmtDate = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Lettres d&apos;invitation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cliquez sur « Lettre » pour ouvrir la preview recto+verso → Cmd+P → PDF.
        </p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">
            {rows.length} commerçant{rows.length > 1 ? "s" : ""} avec QR actif
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Aucun commerçant avec un <code>commerce_slug</code> pour l&apos;instant.
            Créez-en un depuis{" "}
            <Link href="/admin/humain/catalogue" className="underline">
              le catalogue admin
            </Link>
            .
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Commerçant</th>
                  <th className="px-4 py-3 font-medium">Métier</th>
                  <th className="px-4 py-3 font-medium">Ville</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Slug / QR</th>
                  <th className="px-4 py-3 font-medium">Lettre</th>
                  <th className="px-4 py-3 font-medium">Envoyée le</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {r.company_name || r.prenom || "—"}
                      {r.prenom && r.company_name && (
                        <div className="text-xs font-normal text-muted-foreground">{r.prenom}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.metier || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{r.city || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs">{statusLabel[r.reco_status] ?? r.reco_status}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.commerce_slug}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/rejoindre/lettre/${r.commerce_slug}`}
                        target="_blank"
                        className="rounded bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800"
                      >
                        Lettre →
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {fmtDate(r.letter_sent_at) ? (
                        <span className="font-medium text-emerald-700">📬 {fmtDate(r.letter_sent_at)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <form action="/api/admin/rejoindre/prospect" method="post">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="redirect" value="/admin/rejoindre/lettre" />
                          <input
                            type="hidden"
                            name="action"
                            value={r.letter_sent_at ? "unmark_sent" : "mark_sent"}
                          />
                          <button
                            type="submit"
                            className="rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            {r.letter_sent_at ? "↩︎ Annuler envoi" : "✓ Marquer envoyée"}
                          </button>
                        </form>
                        <form action="/api/admin/rejoindre/prospect" method="post">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="redirect" value="/admin/rejoindre/lettre" />
                          <input type="hidden" name="action" value="free_slot" />
                          <button
                            type="submit"
                            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            🗑 Libérer
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
