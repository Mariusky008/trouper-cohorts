import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser, formatPhoneToE164 } from "@/lib/actions/review-booster-admin";

export const dynamic = "force-dynamic";

type CsvRow = {
  prenom: string;
  telephone: string;
  date_prestation: string;
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function isValidDate(d: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
}

function isWithin30Days(dateStr: string): boolean {
  const diff = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const commercantId = String(body.commercant_id || "").trim();
  const rows: unknown[] = Array.isArray(body.rows) ? body.rows : [];

  if (!commercantId) return NextResponse.json({ error: "commercant_id manquant." }, { status: 400 });
  if (!rows.length) return NextResponse.json({ error: "Aucune ligne reçue." }, { status: 400 });

  const supabase = createAdminClient();

  // Vérifier que le commerçant existe
  const { data: commerce } = await supabase
    .from("human_review_commercants")
    .select("id")
    .eq("id", commercantId)
    .maybeSingle();

  if (!commerce) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });

  const valid: { commercant_id: string; prenom: string; telephone: string; date_prestation: string; lien_unique: string; statut: string }[] = [];
  const ignored: { ligne: number; raison: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as CsvRow;
    const prenom = String(row?.prenom || "").trim();
    const telephoneRaw = String(row?.telephone || "").trim();
    const datePrestation = String(row?.date_prestation || "").trim();

    if (!prenom) { ignored.push({ ligne: i + 1, raison: "Prénom manquant" }); continue; }
    if (!isValidDate(datePrestation)) { ignored.push({ ligne: i + 1, raison: "Date invalide" }); continue; }
    if (!isWithin30Days(datePrestation)) { ignored.push({ ligne: i + 1, raison: "Date > 30 jours" }); continue; }

    const telephone = formatPhoneToE164(telephoneRaw);
    if (!telephone) { ignored.push({ ligne: i + 1, raison: "Téléphone invalide" }); continue; }

    valid.push({
      commercant_id: commercantId,
      prenom: capitalize(prenom),
      telephone,
      date_prestation: datePrestation,
      lien_unique: crypto.randomUUID(),
      statut: "en_attente",
    });
  }

  if (!valid.length) {
    return NextResponse.json({ imported: 0, ignored: ignored.length, details: ignored });
  }

  // upsert avec ignore des doublons (contrainte unique commercant_id + telephone + date)
  const { error } = await supabase
    .from("human_review_clients_finaux")
    .upsert(valid, { onConflict: "commercant_id,telephone,date_prestation", ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ imported: valid.length, ignored: ignored.length, details: ignored });
}
