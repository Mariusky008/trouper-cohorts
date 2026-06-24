import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";
import { loadWaveBuckets, COUP_WAVES, monthlyMessagesUsed, firstNonEmptyWave, COUP_MONTHLY_QUOTA, type WaveSnapshot } from "@/lib/popey-human/coup";
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

    if (c.status !== "live") return NextResponse.json({ error: "Cette campagne est terminée." }, { status: 409 });
    const fromIdx = Number(c.current_wave) + 1;

    // Recalcule les destinataires (au cas où de nouveaux fans/niveaux) et SAUTE les niveaux vides :
    // on vise la 1ʳᵉ vague peuplée à partir de fromIdx. Le pro n'élargit plus à blanc.
    const buckets = await loadWaveBuckets(placeId);
    const targetIdx = firstNonEmptyWave(buckets, fromIdx);

    const waves: WaveSnapshot[] = Array.isArray(c.waves) ? c.waves : [];
    const nowIso = new Date().toISOString();
    const ensureWave = (i: number) => {
      while (waves.length <= i) waves.push({ idx: waves.length, label: COUP_WAVES[waves.length]?.label || "", fans: 0, sent: 0, sent_at: null });
    };
    const markSkipped = (i: number) => {
      ensureWave(i);
      if (!waves[i].sent_at) waves[i] = { ...waves[i], sent: 0, sent_at: nowIso, skipped: true };
    };

    // Plus aucune vague peuplée en dessous → on marque les niveaux restants comme sautés et on clôt.
    if (targetIdx < 0) {
      for (let i = fromIdx; i < COUP_WAVES.length; i += 1) markSkipped(i);
      await supabase
        .from("human_privilege_coup_campaigns")
        .update({ status: "done", current_wave: COUP_WAVES.length - 1, waves, updated_at: nowIso })
        .eq("id", id);
      return NextResponse.json({ ok: true, done: true, message: "Tous tes fans ont été prévenus." });
    }

    if (waves[targetIdx] && waves[targetIdx].sent_at) {
      return NextResponse.json({ error: "Cette vague a déjà été envoyée." }, { status: 409 });
    }

    const bucket = buckets[targetIdx];

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

    // Niveaux intermédiaires vides (entre l'ancienne vague et la cible) → marqués sautés.
    for (let i = fromIdx; i < targetIdx; i += 1) markSkipped(i);
    ensureWave(targetIdx);
    waves[targetIdx] = { ...waves[targetIdx], fans: bucket?.phones.length || waves[targetIdx].fans || 0, sent, sent_at: nowIso, skipped: false };

    const { data: updated } = await supabase
      .from("human_privilege_coup_campaigns")
      .update({ current_wave: targetIdx, waves, updated_at: nowIso })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      campaign: updated || campaign,
      wave: { idx: targetIdx, label: waves[targetIdx]?.label || "", fans: bucket?.phones.length || 0, sent },
      whatsappConfigured: !skipped,
    });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
