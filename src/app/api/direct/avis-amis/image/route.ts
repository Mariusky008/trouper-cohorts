// 🖼️ L'IMAGE D'UN « ÇA ME VA ? » — pour qui a le lien : l'ami, et l'aperçu de WhatsApp.
//
// GET ?j=<jeton> → l'image elle-même (pas une redirection : le robot de
// WhatsApp qui fabrique l'aperçu ne suit pas toujours). Même réponse (404)
// pour « n'existe pas » et « lien faux ».
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageAvis, lireJetonAvis } from "@/lib/direct/avis-amis";

export const dynamic = "force-dynamic";

const introuvable = () => new NextResponse("Introuvable.", { status: 404, headers: { "cache-control": "no-store" } });

export async function GET(request: Request) {
  const j = lireJetonAvis(String(new URL(request.url).searchParams.get("j") ?? "").slice(0, 600));
  if (!j) return introuvable();
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return introuvable();
  }
  const octets = await imageAvis(supabase, j.e);
  if (!octets) return introuvable();
  return new NextResponse(new Uint8Array(octets), {
    status: 200,
    headers: { "content-type": "image/jpeg", "cache-control": "private, max-age=3600", "x-robots-tag": "noindex" },
  });
}
