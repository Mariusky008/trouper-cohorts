// Lead public depuis la landing de contact (QR de la lettre "Site internet").
// Enregistre contact_lead_at + passe letter_status à 'contacted' + stocke le
// lead dans metadata. Route publique (pas d'auth admin) : on ne lit/écrit que
// via le slug d'une fiche channel='letter', et on n'expose rien en retour.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const name = String(payload?.name || "").trim().slice(0, 80);
  const phoneRaw = String(payload?.phone || "").trim();
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, metadata, contact_lead_at")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });

  const now = new Date().toISOString();
  const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const leads = Array.isArray(meta.leads) ? (meta.leads as unknown[]) : [];
  leads.push({ name, phone: phoneRaw.slice(0, 40), at: now });

  const patch: Record<string, unknown> = {
    metadata: { ...meta, leads },
    letter_status: "contacted",
  };
  // Ne réécrit pas la date du 1er contact.
  if (!row.contact_lead_at) patch.contact_lead_at = now;

  const { error } = await supabase.from("human_vitrine_sites").update(patch).eq("id", String(row.id));
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });

  return NextResponse.json({ ok: true }, { status: 200 });
}
