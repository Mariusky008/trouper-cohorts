import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPrivilegeProDigest } from "@/lib/actions/whatsapp-twilio";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (request.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(request.url).searchParams.get("secret") === secret;
}

function originOf(request: Request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return String(process.env.NEXT_PUBLIC_APP_URL || "https://www.popey.academy").replace(/\/+$/, "");
  }
}

// Digest hebdo WhatsApp au commerçant (rétention). Pour chaque commerçant ACTIF cette semaine (≥1 visite
// validée ou ≥1 nouvel avis), envoie un résumé + un rappel de partage. No-op silencieux si le template
// n'est pas configuré. Auth CRON_SECRET. Programmé lundi (cf. vercel.json).
async function run(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const supabase = createAdminClient();
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const limit = Math.min(2000, Number(new URL(request.url).searchParams.get("limit") || "1000"));

    // Commerçants configurés + joignables.
    const { data: places } = await supabase
      .from("human_marketplace_places")
      .select("id,company_name,owner_display_name,city,pro_slug,partner_whatsapp,direct_contact,privilege_badge")
      .limit(3000);
    type P = {
      id: string;
      company_name: string | null;
      owner_display_name: string | null;
      city: string | null;
      pro_slug: string | null;
      partner_whatsapp: string | null;
      direct_contact: string | null;
      privilege_badge: string | null;
    };
    const rows = ((places as P[] | null) || []).filter(
      (p) => (String(p.company_name || "").trim() || String(p.privilege_badge || "").trim()) && (p.partner_whatsapp || p.direct_contact),
    );
    if (!rows.length) return NextResponse.json({ sent: 0, considered: 0 });
    const placeIds = rows.map((p) => p.id);

    // Visites validées de la semaine, par commerçant.
    const visitsByPlace = new Map<string, number>();
    try {
      const { data } = await supabase
        .from("human_privilege_visits")
        .select("place_id")
        .eq("status", "validated")
        .gte("validated_at", weekStart)
        .in("place_id", placeIds)
        .limit(50000);
      ((data as Array<{ place_id: string }> | null) || []).forEach((r) => visitsByPlace.set(r.place_id, (visitsByPlace.get(r.place_id) || 0) + 1));
    } catch {
      /* résilient */
    }

    // Nouveaux avis de la semaine, par commerçant.
    const reviewsByPlace = new Map<string, number>();
    try {
      const { data } = await supabase
        .from("human_marketplace_place_comments")
        .select("place_id")
        .gte("created_at", weekStart)
        .in("place_id", placeIds)
        .limit(50000);
      ((data as Array<{ place_id: string }> | null) || []).forEach((r) => reviewsByPlace.set(r.place_id, (reviewsByPlace.get(r.place_id) || 0) + 1));
    } catch {
      /* résilient */
    }

    const origin = originOf(request);
    let sent = 0;
    let considered = 0;
    let skippedConfig = false;
    for (const p of rows) {
      const v = visitsByPlace.get(p.id) || 0;
      const r = reviewsByPlace.get(p.id) || 0;
      if (v === 0 && r === 0) continue; // on n'envoie qu'aux commerçants actifs cette semaine (dosage)
      considered += 1;
      if (sent >= limit) break;
      const merchantName = String(p.company_name || p.owner_display_name || "").trim() || "ton commerce";
      const parts: string[] = [];
      if (v > 0) parts.push(`✅ ${v} visite${v > 1 ? "s" : ""} validée${v > 1 ? "s" : ""}`);
      if (r > 0) parts.push(`⭐ ${r} nouvel${r > 1 ? "s" : ""} avis`);
      const summary = `${parts.join(" · ")} cette semaine. Continue de partager ton lien 🚀`;
      const link = `${origin}/c/${encodeURIComponent(String(p.pro_slug || p.id).trim())}`;
      const phone = String(p.partner_whatsapp || p.direct_contact || "").trim();
      const res = await sendPrivilegeProDigest(phone, { merchantName, summary, link });
      if (res.skipped) {
        skippedConfig = true;
        break; // template non configuré → inutile de boucler
      }
      if (res.sid) sent += 1;
    }

    return NextResponse.json({ sent, considered, whatsappConfigured: !skippedConfig });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
