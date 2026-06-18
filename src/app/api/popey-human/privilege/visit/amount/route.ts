import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveProPlaceId } from "@/lib/popey-human/pro-auth";

export const dynamic = "force-dynamic";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// POST { token|p, visitId, amount } — le pro renseigne (après validation) le montant encaissé sur une
// visite. Facultatif ; alimente le ROI (« promo offerte » vs « généré au plein tarif »). Résilient.
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { token?: string; p?: string; visitId?: string; amount?: number } | null;
    const cred = String(body?.token || body?.p || "").trim();
    const visitId = String(body?.visitId || "").trim();
    const amount = Number(body?.amount);
    if (!isUuid(visitId)) return NextResponse.json({ error: "Visite invalide." }, { status: 400 });
    if (!Number.isFinite(amount) || amount < 0 || amount > 100000) return NextResponse.json({ error: "Montant invalide." }, { status: 400 });

    const placeId = await resolveProPlaceId(cred);
    if (!placeId) return NextResponse.json({ error: "Accès pro non reconnu." }, { status: 403 });

    const supabase = createAdminClient();
    // On ne met à jour que SA visite (scopée au commerçant) et seulement si validée.
    const { error } = await supabase
      .from("human_privilege_visits")
      .update({ amount_eur: Math.round(amount * 100) / 100 })
      .eq("id", visitId)
      .eq("place_id", placeId)
      .eq("status", "validated");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur inattendue." }, { status: 500 });
  }
}
