// Actions admin sur un prospect / lead depuis les pages 🔔 Leads et 📬 Lettres QR
// - mark_sent   : enregistre la date d'envoi de la lettre (letter_sent_at = now)
// - unmark_sent : annule la date d'envoi
// - free_slot   : libère l'emplacement (efface les infos du prospect, garde ville+métier)
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const formData = await req.formData();
  const id = String(formData.get("id") || "").trim();
  const action = String(formData.get("action") || "").trim();
  const redirectTo = String(formData.get("redirect") || "/admin/rejoindre/lettre");

  if (!id || !action) {
    return NextResponse.json({ error: "id et action requis" }, { status: 400 });
  }

  const supabase = createAdminClient();

  let patch: Record<string, unknown>;
  if (action === "mark_sent") {
    patch = { letter_sent_at: new Date().toISOString() };
  } else if (action === "unmark_sent") {
    patch = { letter_sent_at: null };
  } else if (action === "free_slot") {
    // On efface les infos du prospect mais on garde l'emplacement ville+métier.
    // Emplacement libre = pas de commerce_slug + reco_status 'prospect' (la valeur
    // par défaut). reco_status ne peut pas être null (contrainte CHECK).
    patch = {
      commerce_slug: null,
      prenom: null,
      activite: null,
      reco_status: "prospect",
      claimed_at: null,
      letter_sent_at: null,
    };
  } else {
    return NextResponse.json({ error: "action inconnue" }, { status: 400 });
  }

  const { error } = await supabase
    .from("human_marketplace_places")
    .update(patch)
    .eq("id", id);

  if (error) {
    // Fallback : si une colonne n'existe pas encore, on retire les champs optionnels.
    const stripped = { ...patch };
    delete (stripped as Record<string, unknown>).letter_sent_at;
    delete (stripped as Record<string, unknown>).activite;
    if (Object.keys(stripped).length > 0) {
      await supabase.from("human_marketplace_places").update(stripped).eq("id", id);
    }
  }

  return NextResponse.redirect(new URL(redirectTo, req.url), { status: 303 });
}
