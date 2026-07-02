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
