// 💬 « CRÉE OU RÉPONDS AVEC TON MÈME » — le bouton de la page d'un mème passe par ici : le geste est compté (la mesure,
// `clik_meme_evenement`), puis « Ma collection » s'ouvre sur sa figurine, prête à répondre en duo (`?repondre=<id>` ;
// sans figurine, il la crée d'abord — sa réponse attend).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { noterEvenementMeme } from "@/lib/direct/ma-figurine-serveur";
import { idMessageValide } from "@/lib/direct/ma-figurine";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = idMessageValide(id);
  if (ok) await noterEvenementMeme(createAdminClient(), "clic", id);
  return NextResponse.redirect(new URL(ok ? `/collection?repondre=${id}#figurine` : "/collection#figurine", request.url), 302);
}
