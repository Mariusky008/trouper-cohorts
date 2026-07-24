// Actions sur un prospect "Site internet" (canal lettre) depuis la liste admin.
// - validate  : letter_status = 'validated'
// - printed   : letter_status = 'printed'  + letter_printed_at = now
// - delivered : letter_status = 'delivered' + letter_delivered_at = now
// - skip      : letter_status = 'skipped'
// - reset     : retour 'draft'
// - delete    : suppression de la fiche
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = String(formData.get("id") || "").trim();
  const action = String(formData.get("action") || "").trim();
  const redirectTo = String(formData.get("redirect") || "/admin/humain/site-internet");

  if (!id || !action) {
    return NextResponse.json({ error: "id et action requis" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  if (action === "delete") {
    await supabase.from("human_vitrine_sites").delete().eq("id", id).eq("channel", "letter");
    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  }

  // Démo « choc » de démarchage : une seule cible active à la fois. On stocke le
  // drapeau dans metadata.demarchage_target (aucune migration nécessaire).
  if (action === "demo_target" || action === "demo_target_off") {
    // 1) On retire le drapeau partout où il est posé.
    const { data: flagged } = await supabase
      .from("human_vitrine_sites")
      .select("id, metadata")
      .eq("metadata->>demarchage_target", "true");
    for (const r of (flagged as Array<{ id: string; metadata: Record<string, unknown> | null }> | null) ?? []) {
      const m = { ...(r.metadata || {}) };
      delete m.demarchage_target;
      await supabase.from("human_vitrine_sites").update({ metadata: m }).eq("id", r.id);
    }
    // 2) On (re)pose le drapeau sur la cible demandée (sauf pour un simple retrait).
    if (action === "demo_target") {
      const { data: cur } = await supabase
        .from("human_vitrine_sites")
        .select("metadata")
        .eq("id", id)
        .maybeSingle();
      const m = { ...(((cur as { metadata: Record<string, unknown> | null } | null)?.metadata) || {}), demarchage_target: true };
      await supabase.from("human_vitrine_sites").update({ metadata: m }).eq("id", id);
    }
    return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
  }

  const patches: Record<string, Record<string, unknown>> = {
    validate: { letter_status: "validated" },
    printed: { letter_status: "printed", letter_printed_at: now },
    delivered: { letter_status: "delivered", letter_delivered_at: now },
    skip: { letter_status: "skipped" },
    reset: { letter_status: "draft" },
  };

  const patch = patches[action];
  if (!patch) return NextResponse.json({ error: "action inconnue" }, { status: 400 });

  await supabase.from("human_vitrine_sites").update(patch).eq("id", id).eq("channel", "letter");

  return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}
