// 🔊 LA VOIX D'UN MESSAGE DE FIGURINE — GET ?m=<id>. Servie par nous (même origine) : le navigateur peut la lire ET
// en mesurer le volume pour faire bouger la bouche. Un message signalé ou retiré : 404. Chaque lecture compte une
// écoute.
import { createAdminClient } from "@/lib/supabase/admin";
import { sonDuMessage } from "@/lib/direct/ma-figurine-serveur";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  // (`r=1` : pour lui répondre en duo — ce n'est pas une écoute)
  const son = await sonDuMessage(createAdminClient(), q.get("m") ?? "", q.get("r") !== "1");
  if (!son) return new Response("Introuvable.", { status: 404, headers: { "cache-control": "no-store" } });
  return new Response(new Uint8Array(son.octets), {
    headers: { "content-type": son.type, "content-length": String(son.octets.length), "cache-control": "private, max-age=600" },
  });
}
