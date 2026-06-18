import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";
import { loadWaveBuckets, COUP_WAVES, monthlyMessagesUsed, COUP_MONTHLY_QUOTA, type WaveSnapshot } from "@/lib/popey-human/coup";
import { sendPrivilegeAlertBroadcast } from "@/lib/actions/whatsapp-twilio";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST { p|token, id } — ÉLARGIT le Coup de feu à la vague suivante (niveau inférieur).
// À déclencher quand les places ne se remplissent pas. Envoie la vague current_wave+1.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as { p?: string; token?: string; id?: string } | null;
    const cred = String(body?.p || body?.token || "").trim();
    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });
    const id = String(body?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Campagne manquante." }, { status: 400 });

    const supabase = createAdminClient();
    const { data: campaign } = await supabase
      .from("human_privilege_coup_campaigns")
      .select("*")
      .eq("id", id)
      .eq("place_id", placeId)
      .maybeSingle();
    if (!campaign) return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });
    const c = campaign as { current_wave: number; offer_text: string; status: string; waves: WaveSnapshot[] };

    const nextIdx = Number(c.current_wave) + 1;
    if (c.status !== "live") return NextResponse.json({ error: "Cette campagne est terminée." }, { status: 409 });
    if (nextIdx >= COUP_WAVES.length) {
      // Plus de vague → on clôt la campagne.
      await supabase.from("human_privilege_coup_campaigns").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ ok: true, done: true, message: "Toutes les vagues ont été envoyées." });
    }

    const waves: WaveSnapshot[] = Array.isArray(c.waves) ? c.waves : [];
    if (waves[nextIdx] && waves[nextIdx].sent_at) {
      return NextResponse.json({ error: "Cette vague a déjà été envoyée." }, { status: 409 });
    }

    // Recalcule les destinataires de la vague visée (au cas où de nouveaux fans/niveaux).
    const buckets = await loadWaveBuckets(placeId);
    const bucket = buckets.find((b) => b.idx === nextIdx);

    // Garde quota : on n'élargit pas si la vague dépasse le quota mensuel restant (maîtrise du coût).
    const used = await monthlyMessagesUsed(placeId);
    const remaining = Math.max(0, COUP_MONTHLY_QUOTA - used);
    const bucketSize = bucket?.phones.length || 0;
    if (bucketSize > remaining) {
      return NextResponse.json(
        {
          error: `Quota mensuel atteint : il te reste ${remaining} message${remaining > 1 ? "s" : ""} ce mois et cette vague en demande ${bucketSize}. Augmente ton quota pour élargir.`,
          quota: { used, included: COUP_MONTHLY_QUOTA, remaining },
        },
        { status: 409 },
      );
    }

    const nowIso = new Date().toISOString();
    let sent = 0;
    let skipped = false;
    if (bucket && bucket.phones.length > 0) {
      const { data: place } = await supabase
        .from("human_marketplace_places")
        .select("company_name,owner_display_name,metier")
        .eq("id", placeId)
        .maybeSingle();
      const p = (place as Record<string, unknown>) || {};
      const name = String(p.company_name || p.owner_display_name || p.metier || "ce commerçant").trim() || "ce commerçant";
      const link = `${new URL(request.url).origin}/o/${id}`;
      const res = await sendPrivilegeAlertBroadcast(bucket.phones, { merchantName: name, offerText: c.offer_text, link });
      skipped = res.skipped === true;
      sent = res.results.filter((r) => r.sid).length;
    }

    while (waves.length <= nextIdx) waves.push({ idx: waves.length, label: COUP_WAVES[waves.length]?.label || "", fans: 0, sent: 0, sent_at: null });
    waves[nextIdx] = { ...waves[nextIdx], fans: bucket?.phones.length || waves[nextIdx].fans || 0, sent, sent_at: nowIso };

    const { data: updated } = await supabase
      .from("human_privilege_coup_campaigns")
      .update({ current_wave: nextIdx, waves, updated_at: nowIso })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      campaign: updated || campaign,
      wave: { idx: nextIdx, fans: bucket?.phones.length || 0, sent },
      whatsappConfigured: !skipped,
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
