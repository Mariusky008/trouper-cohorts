import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";
import { toE164 } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

// Page d'opt-in « QR en boutique » : un passant scanne le QR du commerçant et s'abonne à ses Coups de feu.
// GET ?id=<slug|uuid> → infos commerçant (affichage de la page). POST → inscription (consentement IN-APP
// = l'opt-in, statut confirmed, AUCUN WhatsApp à confirmer). Tout résilient.

export async function GET(request: NextRequest) {
  try {
    const id = String(request.nextUrl.searchParams.get("id") || "").trim();
    const placeId = await resolveProPlaceId(id);
    if (!placeId) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });
    const supabase = createAdminClient();
    const { data: place } = await supabase
      .from("human_marketplace_places")
      .select("company_name,owner_display_name,metier,city,logo_url")
      .eq("id", placeId)
      .maybeSingle();
    const p = (place as Record<string, unknown>) || {};
    return NextResponse.json({
      ok: true,
      merchant: String(p.company_name || p.owner_display_name || p.metier || "Commerçant"),
      metier: String(p.metier || ""),
      city: String(p.city || ""),
      logo: String(p.logo_url || ""),
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { id?: string; phone?: string; name?: string; consent?: boolean } | null;
    const placeId = await resolveProPlaceId(String(body?.id || "").trim());
    const phone = toE164(String(body?.phone || ""));
    const name = String(body?.name || "").trim().slice(0, 40);
    if (!placeId) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
    if (body?.consent === false) return NextResponse.json({ error: "Consentement requis." }, { status: 400 });

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data: place } = await supabase.from("human_marketplace_places").select("city,city_slug").eq("id", placeId).maybeSingle();
    const city = (place as { city?: string } | null)?.city || null;
    const citySlug = (place as { city_slug?: string } | null)?.city_slug || null;

    try {
      await supabase
        .from("human_privilege_members")
        .upsert({ phone_e164: phone, first_name: name || null, city, updated_at: nowIso }, { onConflict: "phone_e164" });
    } catch {
      /* résilient */
    }
    try {
      const { data: rel } = await supabase
        .from("human_privilege_relationships")
        .select("id")
        .eq("place_id", placeId)
        .eq("member_phone", phone)
        .maybeSingle();
      if (!rel) await supabase.from("human_privilege_relationships").insert({ place_id: placeId, member_phone: phone, level: 0 });
    } catch {
      /* résilient */
    }
    try {
      const { error } = await supabase.from("human_privilege_alert_subscribers").upsert(
        {
          place_id: placeId,
          city,
          city_slug: citySlug,
          phone,
          status: "confirmed",
          consent_text: "Opt-in via QR en boutique : veut être prévenu·e en premier des Coups de feu de ce commerçant. STOP à tout moment.",
          consent_at: nowIso,
          confirmed_at: nowIso,
          source: "qr",
          updated_at: nowIso,
        },
        { onConflict: "place_id,phone" },
      );
      if (error && /human_privilege_alert_subscribers/i.test(String(error.message || ""))) {
        return NextResponse.json({ error: "Service d'alertes pas encore activé." }, { status: 503 });
      }
    } catch {
      /* résilient */
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
