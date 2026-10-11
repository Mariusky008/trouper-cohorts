// 📷 LA PHOTO D'UNE PIÈCE DU DRESSING — seulement pour celui à qui elle est.
//
// PAS D'ADRESSE SIGNÉE QU'ON POURRAIT RECOPIER : chaque image revérifie le
// cookie de l'habitant. Une adresse collée ailleurs, ou ouverte par quelqu'un
// d'autre, rend un 404 — on ne dit même pas que la pièce existe.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { photoDuDressing } from "@/lib/direct/dressing-serveur";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return new NextResponse(null, { status: 503 });
  }
  const h = await habitantCourant(supabase);
  const octets = h ? await photoDuDressing(supabase, h.id, id) : null;
  if (!octets) return new NextResponse(null, { status: 404, headers: { "cache-control": "private, no-store" } });
  return new NextResponse(new Uint8Array(octets), {
    headers: {
      "content-type": "image/webp",
      // PRIVÉ : le téléphone la garde une heure, aucun cache partagé ne la voit.
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
    },
  });
}
