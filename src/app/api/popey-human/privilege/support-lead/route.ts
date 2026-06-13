import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      | { profileId?: string; firstName?: string; phone?: string; consent?: boolean; ville?: string; ref?: string; refName?: string }
      | null;

    const profileId = String(body?.profileId || "").trim();
    const firstName = String(body?.firstName || "").trim().slice(0, 80);
    const phone = toE164(String(body?.phone || ""));
    const consent = body?.consent === true;

    if (!isUuid(profileId)) return NextResponse.json({ error: "Commerçant invalide." }, { status: 400 });
    if (!firstName) return NextResponse.json({ error: "Prénom requis." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
    if (!consent) return NextResponse.json({ error: "Consentement requis." }, { status: 400 });

    const supabase = createAdminClient();

    // Le profil (commerçant) doit exister → on récupère ville + nom pour l'enregistrement.
    const { data: profile } = await supabase
      .from("human_privilege_tinder_profiles")
      .select("id,city,city_slug,pro_name")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Commerçant introuvable." }, { status: 404 });

    const consentText =
      "J'accepte d'être recontacté(e) par ce commerçant via Popey suite à mon like de soutien. Mes coordonnées ne sont utilisées que pour cette mise en relation.";

    const row = {
      profile_id: profileId,
      pro_name: (profile as { pro_name?: string }).pro_name || null,
      city: (profile as { city?: string }).city || null,
      city_slug: (profile as { city_slug?: string }).city_slug || null,
      first_name: firstName,
      phone,
      ref: String(body?.ref || "").trim().slice(0, 120) || null,
      ref_name: String(body?.refName || "").trim().slice(0, 120) || null,
      consent_text: consentText,
      consent_at: new Date().toISOString(),
      source: "catalogue",
      updated_at: new Date().toISOString(),
    };

    // Upsert : un même numéro qui re-soutient le même commerçant met à jour la ligne.
    const { error } = await supabase
      .from("human_privilege_support_leads")
      .upsert(row, { onConflict: "profile_id,phone" });

    if (error) {
      // Table absente (migration non appliquée) → on ne casse pas le catalogue.
      if (/human_privilege_support_leads/i.test(String(error.message || ""))) {
        return NextResponse.json({ error: "Service de leads pas encore activé." }, { status: 503 });
      }
      console.error("[support-lead] insert error", error.message);
      return NextResponse.json({ error: "Enregistrement impossible pour le moment." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[support-lead] unexpected", error);
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
