// /admin/rejoindre — Leads du Collectif : commerçants ayant réclamé leur place.
// Protégé par le guard admin du layout. À ouvrir chaque matin pour rappeler sous 24h.
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Lead {
  id: string;
  company_name: string | null;
  prenom: string | null;
  metier: string | null;
  city: string | null;
  commerce_slug: string | null;
  pro_whatsapp: string | null;
  reco_status: string;
  claimed_at: string | null;
  letter_sent_at: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function waLink(phone: string | null): string | null {
  if (!phone) return null;
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
}

export default async function AdminRejoindrePage() {
  const supabase = createAdminClient();

  const { data: leads } = await supabase
    .from("human_marketplace_places")
    .select("id, company_name, prenom, metier, city, commerce_slug, pro_whatsapp, reco_status, claimed_at, letter_sent_at")
    .eq("reco_status", "claimed")
    .order("claimed_at", { ascending: false });

  const rows = (leads ?? []) as Lead[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Leads du Collectif</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Commerçants ayant réclamé leur place via la lettre QR. À rappeler sous 24h pour créer leur première offre.
        </p>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="border-b px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">
            {rows.length} commerçant{rows.length > 1 ? "s" : ""} en attente d&apos;appel
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Aucun lead pour l&apos;instant. Ils apparaîtront ici dès qu&apos;un commerçant scanne sa lettre et réclame sa place.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Commerçant</th>
                  <th className="px-4 py-3 font-medium">Métier</th>
                  <th className="px-4 py-3 font-medium">Ville</th>
                  <th className="px-4 py-3 font-medium">WhatsApp</th>
                  <th className="px-4 py-3 font-medium">Réclamé le</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => {
                  const name = lead.company_name || lead.prenom || "—";
                  const wa = waLink(lead.pro_whatsapp);
                  return (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{name}</div>
                        {lead.prenom && lead.company_name && (
                          <div className="text-xs text-muted-foreground">{lead.prenom}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{lead.metier || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{lead.city || "—"}</td>
                      <td className="px-4 py-3">
                        {wa ? (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-emerald-700 hover:underline"
                          >
                            {lead.pro_whatsapp}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(lead.claimed_at)}</td>
                      <td className="px-4 py-3">
                        <form action="/api/admin/rejoindre/prospect" method="post">
                          <input type="hidden" name="id" value={lead.id} />
                          <input type="hidden" name="redirect" value="/admin/rejoindre" />
                          <input type="hidden" name="action" value="free_slot" />
                          <button
                            type="submit"
                            className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            🗑 Libérer
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
