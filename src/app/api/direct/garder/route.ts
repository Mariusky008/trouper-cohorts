// Garder / retirer une publication.
//
// C'est le premier geste qui engage, et donc le premier moment où une ligne
// habitant est créée. Rien n'est demandé : on pose un jeton d'appareil et on
// enregistre. Ouvrir un formulaire ici ferait perdre le geste — et c'est le
// geste qui a de la valeur, pas l'adresse.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: Record<string, unknown> | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }
  const publicationId = String(payload?.publicationId || "").trim();
  const garder = payload?.garder !== false;
  const ville = villeSlug(String(payload?.ville || ""));
  if (!publicationId) return NextResponse.json({ error: "publicationId requis" }, { status: 400 });

  const supabase = createAdminClient();
  const habitant = await assurerHabitant(supabase, ville);
  if (!habitant) return NextResponse.json({ error: "Impossible d'enregistrer pour l'instant." }, { status: 503 });

  try {
    if (garder) {
      const { error } = await supabase
        .from("human_gardees")
        .upsert({ habitant_id: habitant.id, publication_id: publicationId }, { onConflict: "habitant_id,publication_id" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("human_gardees")
        .delete()
        .eq("habitant_id", habitant.id)
        .eq("publication_id", publicationId);
      if (error) throw new Error(error.message);
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, garde: garder });
}
