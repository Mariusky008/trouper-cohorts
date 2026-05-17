import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const RELANCE_COOLDOWN_DAYS = 30;
const MAX_RECIPIENTS = 300;

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const remise = String(body.remise || "").trim();       // ex: "20"
  const service = String(body.service || "").trim();     // ex: "coupe homme"
  const dateLimit = String(body.dateLimit || "").trim(); // ex: "dimanche 25 mai"

  if (!remise || !service || !dateLimit) {
    return NextResponse.json({ error: "Remise, service et date limite obligatoires." }, { status: 400 });
  }

  const contentSid = String(process.env.TWILIO_REVIEW_CONTENT_SID_RELANCE || "").trim();
  if (!contentSid) {
    return NextResponse.json({ error: "Template relance non configuré (TWILIO_REVIEW_CONTENT_SID_RELANCE manquant)." }, { status: 503 });
  }

  const supabase = createAdminClient();

  const { data: commerce } = await supabase
    .from("human_review_commercants")
    .select("id, nom, abonnement, last_relance_at")
    .eq("token_saisie", normalizedToken)
    .maybeSingle();

  if (!commerce || commerce.abonnement === "résilié") {
    return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });
  }

  // Vérifier le cooldown 30 jours
  if (commerce.last_relance_at) {
    const daysSince = (Date.now() - new Date(commerce.last_relance_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < RELANCE_COOLDOWN_DAYS) {
      const daysLeft = Math.ceil(RELANCE_COOLDOWN_DAYS - daysSince);
      return NextResponse.json(
        { error: `Relance disponible dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}.`, cooldown: true, daysLeft },
        { status: 429 }
      );
    }
  }

  // Récupérer tous les clients uniques (dédupliqués par téléphone)
  const { data: clients } = await supabase
    .from("human_review_clients_finaux")
    .select("telephone, prenom")
    .eq("commercant_id", commerce.id)
    .not("telephone", "is", null)
    .order("created_at", { ascending: false });

  if (!clients || clients.length === 0) {
    return NextResponse.json({ error: "Aucun client enregistré pour ce commerce." }, { status: 400 });
  }

  // Dédupliquer par téléphone
  const seen = new Set<string>();
  const unique = clients.filter((c) => {
    if (!c.telephone || seen.has(c.telephone)) return false;
    seen.add(c.telephone);
    return true;
  }).slice(0, MAX_RECIPIENTS);

  // Insérer dans la queue WhatsApp
  const now = new Date().toISOString();
  const rows = unique.map((c) => ({
    phone_e164: c.telephone,
    template_name: contentSid,
    language_code: "fr",
    vars: [commerce.nom, remise, service, dateLimit, c.prenom ?? ""],
    quick_reply_payload: [],
    source: "review_booster_relance_promo",
    metadata: {
      provider: "twilio",
      content_sid: contentSid,
      commerce_nom: commerce.nom,
      remise,
      service,
      date_limit: dateLimit,
    },
    status: "queued",
    attempt_count: 0,
    max_attempts: 2,
    random_delay_ms: 0,
    not_before_at: now,
    updated_at: now,
  }));

  const { error: insertError } = await supabase
    .from("human_whatsapp_outbound_queue")
    .insert(rows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Mettre à jour last_relance_at
  await supabase
    .from("human_review_commercants")
    .update({ last_relance_at: now, updated_at: now })
    .eq("id", commerce.id);

  return NextResponse.json({ success: true, sent: unique.length });
}
