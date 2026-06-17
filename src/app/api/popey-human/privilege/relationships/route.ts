import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toE164 } from "@/lib/popey-human/loyalty";

export const dynamic = "force-dynamic";

// GET ?phone=Y → TOUTES les relations (niveau > 0) du membre, en un appel : { levels: { [placeId]: level } }.
// Sert à afficher les cœurs gagnés directement sur les cartes du catalogue, dès l'ouverture (le numéro
// stocké en local est la clé d'identité). Membre inconnu / tables absentes → { levels: {} } (résilient).
export async function GET(request: NextRequest) {
  try {
    const phone = toE164(String(request.nextUrl.searchParams.get("phone") || ""));
    if (!phone) return NextResponse.json({ levels: {} });

    const supabase = createAdminClient();
    const { data: rels } = await supabase
      .from("human_privilege_relationships")
      .select("place_id,level")
      .eq("member_phone", phone)
      .gt("level", 0)
      .limit(2000);

    const levels: Record<string, number> = {};
    for (const r of (rels as Array<{ place_id: string; level: number }> | null) || []) {
      const id = String(r.place_id || "");
      if (id) levels[id] = Number(r.level) || 0;
    }
    return NextResponse.json({ levels });
  } catch {
    return NextResponse.json({ levels: {} });
  }
}
