import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";
import { loadWaveBuckets, snapshotFromBuckets, type WaveSnapshot } from "@/lib/popey-human/coup";
import { sendPrivilegeAlertBroadcast } from "@/lib/actions/whatsapp-twilio";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function originOf(request: NextRequest): string {
  try {
    return new URL(request.url).origin;
  } catch {
    return "https://www.popey.academy";
  }
}

async function merchantName(placeId: string): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_marketplace_places")
      .select("company_name,owner_display_name,metier")
      .eq("id", placeId)
      .maybeSingle();
    const p = (data as Record<string, unknown>) || {};
    return String(p.company_name || p.owner_display_name || p.metier || "ce commerçant").trim() || "ce commerçant";
  } catch {
    return "ce commerçant";
  }
}

// GET ?p=<cred>[&id=<campaignId>] — pour l'espace pro :
//   sans id  → { merchant, wavesPreview:[{idx,label,fans}], active:<campagne live|null> } (composer + suivi)
//   avec id  → { campaign:<full> } (suivi live d'une campagne précise : places restantes, vagues envoyées)
export async function GET(request: NextRequest) {
  try {
    const cred = String(request.nextUrl.searchParams.get("p") || request.nextUrl.searchParams.get("token") || "").trim();
    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });
    const supabase = createAdminClient();
    const id = String(request.nextUrl.searchParams.get("id") || "").trim();

    if (id) {
      const { data: campaign } = await supabase
        .from("human_privilege_coup_campaigns")
        .select("*")
        .eq("id", id)
        .eq("place_id", placeId)
        .maybeSingle();
      return NextResponse.json({ campaign: campaign || null });
    }

    const buckets = await loadWaveBuckets(placeId);
    const wavesPreview = buckets.map((b) => ({ idx: b.idx, label: b.label, fans: b.phones.length }));

    let active: Record<string, unknown> | null = null;
    try {
      const { data } = await supabase
        .from("human_privilege_coup_campaigns")
        .select("*")
        .eq("place_id", placeId)
        .eq("status", "live")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      active = (data as Record<string, unknown>) || null;
    } catch {
      /* table absente → pas de campagne active */
    }

    return NextResponse.json({ wavesPreview, totalFans: wavesPreview.reduce((a, w) => a + w.fans, 0), active });
  } catch {
    return NextResponse.json({ wavesPreview: [], totalFans: 0, active: null });
  }
}

// POST { p|token, offerText, totalPlaces?, durationMin?, reason? } — LANCE un Coup de feu :
// crée la campagne, calcule les vagues, et ENVOIE LA VAGUE 1 (niveau 5) par WhatsApp (Twilio).
// Le lien du message pointe vers la fiche deep-link /o/<campaignId> (réservation 1 tap).
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { p?: string; token?: string; offerText?: string; totalPlaces?: number; durationMin?: number; reason?: string }
      | null;
    const cred = String(body?.p || body?.token || "").trim();
    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });

    const offerText = String(body?.offerText || "").trim().slice(0, 160);
    if (offerText.length < 3) return NextResponse.json({ error: "Décris ton offre (l'offre du Coup de feu)." }, { status: 400 });
    const totalPlaces = Math.max(0, Math.min(999, Math.floor(Number(body?.totalPlaces) || 0)));
    const durationMin = Math.max(15, Math.min(1440, Math.floor(Number(body?.durationMin) || 120)));
    const reason = String(body?.reason || "").trim().slice(0, 120) || null;

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationMin * 60 * 1000).toISOString();

    // Vagues figées à la création (compteurs de fans).
    const buckets = await loadWaveBuckets(placeId);
    const waves: WaveSnapshot[] = snapshotFromBuckets(buckets);

    // 1) Crée la campagne (on a besoin de l'id pour le deep-link AVANT d'envoyer).
    const { data: created, error: insErr } = await supabase
      .from("human_privilege_coup_campaigns")
      .insert({
        place_id: placeId,
        reason,
        offer_text: offerText,
        total_places: totalPlaces,
        duration_min: durationMin,
        status: "live",
        current_wave: -1,
        waves,
        expires_at: expiresAt,
      })
      .select("*")
      .maybeSingle();
    if (insErr || !created) {
      if (/human_privilege_coup_campaigns/i.test(String(insErr?.message || ""))) {
        return NextResponse.json({ error: "Coup de feu pas encore activé (migration manquante)." }, { status: 503 });
      }
      return NextResponse.json({ error: insErr?.message || "Création impossible." }, { status: 500 });
    }
    const campaignId = String((created as { id: string }).id);
    const link = `${originOf(request)}/o/${campaignId}`;

    // 2) Envoie la VAGUE 0 (les plus fidèles) — réutilise la diffusion Twilio des alertes.
    const wave0 = buckets[0];
    let sent0 = 0;
    let skipped = false;
    if (wave0 && wave0.phones.length > 0) {
      const name = await merchantName(placeId);
      const res = await sendPrivilegeAlertBroadcast(wave0.phones, { merchantName: name, offerText, link });
      skipped = res.skipped === true;
      sent0 = res.results.filter((r) => r.sid).length;
    }
    waves[0] = { ...waves[0], sent: sent0, sent_at: nowIso };

    // 3) Marque la vague 0 comme envoyée.
    const { data: updated } = await supabase
      .from("human_privilege_coup_campaigns")
      .update({ current_wave: 0, waves, updated_at: nowIso })
      .eq("id", campaignId)
      .select("*")
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      campaign: updated || created,
      link,
      wave: { idx: 0, fans: wave0?.phones.length || 0, sent: sent0 },
      whatsappConfigured: !skipped,
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
