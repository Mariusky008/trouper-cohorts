import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPrivilegeAlertOptin } from "@/lib/actions/whatsapp-twilio";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// Normalise un numéro FR (ou international simple) en E.164. Retourne null si invalide.
function toE164(raw: string): string | null {
  let s = String(raw || "").trim().replace(/[\s.\-()]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (/^0[1-9]\d{8}$/.test(s)) return "+33" + s.slice(1); // 0X........ → +33X........
  if (/^33[1-9]\d{8}$/.test(s)) return "+" + s; // 33X........
  if (/^\+33[1-9]\d{8}$/.test(s)) return s; // déjà +33…
  if (/^\+[1-9]\d{7,14}$/.test(s)) return s; // autre indicatif E.164 valide
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { placeId?: string; phone?: string; consent?: boolean; ville?: string }
      | null;
    const placeId = String(body?.placeId || "").trim();
    const phone = toE164(String(body?.phone || ""));
    const consent = body?.consent === true;

    if (!isUuid(placeId)) return NextResponse.json({ error: "Commerçant invalide." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
    if (!consent) return NextResponse.json({ error: "Consentement requis." }, { status: 400 });

    const supabase = createAdminClient();

    // Le commerçant doit exister (et on récupère sa ville pour l'enregistrement).
    const { data: place } = await supabase
      .from("human_marketplace_places")
      .select("id,city,city_slug,company_name,owner_display_name")
      .eq("id", placeId)
      .maybeSingle();
    if (!place) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });

    const consentText =
      "J'accepte de recevoir par WhatsApp les offres et actualités de ce commerçant via Popey. Désinscription à tout moment en répondant STOP.";

    const row = {
      place_id: placeId,
      city: (place as { city?: string }).city || null,
      city_slug: (place as { city_slug?: string }).city_slug || null,
      phone,
      status: "pending" as const,
      consent_text: consentText,
      consent_at: new Date().toISOString(),
      source: "catalogue",
      updated_at: new Date().toISOString(),
    };

    // Upsert : si le couple (place_id, phone) existe déjà, on réactive en 'pending'.
    const { error } = await supabase
      .from("human_privilege_alert_subscribers")
      .upsert(row, { onConflict: "place_id,phone" });

    if (error) {
      // Table absente (migration non appliquée) → on ne casse pas le catalogue.
      if (/human_privilege_alert_subscribers/i.test(String(error.message || ""))) {
        return NextResponse.json({ error: "Service d'alertes pas encore activé." }, { status: 503 });
      }
      console.error("[alerts/subscribe] insert error", error.message);
      return NextResponse.json({ error: "Inscription impossible pour le moment." }, { status: 500 });
    }

    // Confirmation double opt-in (envoi DIRECT, immédiat). No-op silencieux si le compte Twilio
    // ou le Content SID d'opt-in n'est pas configuré → l'inscription n'échoue jamais pour autant.
    const placeRow = place as { city?: string; company_name?: string; owner_display_name?: string };
    const merchantName = String(placeRow.company_name || placeRow.owner_display_name || "").trim() || "ce commerçant";
    const optin = await sendPrivilegeAlertOptin(phone, { merchantName, city: String(placeRow.city || "") });

    return NextResponse.json({ ok: true, pending: true, confirmationSent: Boolean(optin.success) });
  } catch (error) {
    console.error("[alerts/subscribe] unexpected", error);
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
