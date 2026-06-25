// POST /api/popey-human/rejoindre
// Activation d'un commerçant depuis la page /rejoindre/[commerce]
// Enregistre le WhatsApp pro, notifie Jean-Philippe, confirme au commerçant.
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTextMessage } from "@/lib/actions/whatsapp-twilio";

export const dynamic = "force-dynamic";

function toE164(raw: string): string | null {
  let s = String(raw || "").trim().replace(/[\s.\-()]/g, "");
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (/^0[1-9]\d{8}$/.test(s)) return "+33" + s.slice(1);
  if (/^33[1-9]\d{8}$/.test(s)) return "+" + s;
  if (/^\+33[1-9]\d{8}$/.test(s)) return s;
  if (/^\+[1-9]\d{7,14}$/.test(s)) return s;
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  if (!slug) return NextResponse.json({ error: "Slug manquant." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: place } = await supabase
    .from("human_marketplace_places")
    .select("id, company_name, metier, city, city_slug, commerce_slug, prenom, genre, reco_status, deadline_at")
    .eq("commerce_slug", slug)
    .maybeSingle();

  if (!place) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  return NextResponse.json({ place });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      commerceSlug?: string;
      phone?: string;
    } | null;

    const commerceSlug = String(body?.commerceSlug || "").trim();
    const phone = toE164(String(body?.phone || ""));

    if (!commerceSlug) return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "Numéro WhatsApp invalide." }, { status: 400 });

    const supabase = createAdminClient();

    const { data: place } = await supabase
      .from("human_marketplace_places")
      .select("id, company_name, metier, city, city_slug, prenom, reco_status, deadline_at")
      .eq("commerce_slug", commerceSlug)
      .maybeSingle();

    if (!place) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });

    if (place.reco_status === "claimed") {
      return NextResponse.json({ error: "Cette place est déjà réclamée." }, { status: 409 });
    }

    if (place.deadline_at && new Date(place.deadline_at) < new Date()) {
      return NextResponse.json({ error: "Cette invitation a expiré." }, { status: 410 });
    }

    await supabase
      .from("human_marketplace_places")
      .update({
        reco_status: "claimed",
        pro_whatsapp: phone,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", place.id);

    const prenom = place.prenom ?? place.company_name;
    const city = place.city ?? place.city_slug;

    try {
      await sendWhatsAppTextMessage(
        phone,
        `✅ Votre place Popey est réservée, ${prenom} !\n\nJean-Philippe vous contacte très vite pour créer votre première offre ensemble.\n\nBienvenue dans le Collectif de ${city} 🎉`,
        { source: "rejoindre_activation" }
      );
    } catch (e) {
      console.warn("[rejoindre] confirmation WA failed:", e);
    }

    const adminPhone = process.env.POPEY_ADMIN_PHONE;
    if (adminPhone) {
      try {
        await sendWhatsAppTextMessage(
          adminPhone,
          `🔔 Nouveau membre !\n\n${prenom} — ${place.company_name}\n${place.metier} · ${city}\n📱 ${phone}\n\nÀ rappeler sous 24h pour créer la première offre.`,
          { source: "rejoindre_admin_alert" }
        );
      } catch (e) {
        console.warn("[rejoindre] admin alert WA failed:", e);
      }
    }

    return NextResponse.json({ ok: true, prenom, commerceName: place.company_name, city });
  } catch (e) {
    console.error("[rejoindre]", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
