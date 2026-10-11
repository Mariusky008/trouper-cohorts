// ✅ LE MAGASIN RÉPOND À UNE MISE DE CÔTÉ — « c'est mis de côté » ou « plus
// disponible ». Appelée par la page `/reponse/cote/<jeton>`, quand il appuie.
// Le jeton est signé par le serveur (voir `lib/direct/mise-de-cote.ts`) : il
// désigne UNE demande d'UN habitant, et rien d'autre. La réponse entre dans sa
// Maison ; s'il a accepté les notifications, son téléphone sonne.
import { after, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireJetonCote, noterReponse } from "@/lib/direct/mise-de-cote";
import { prevenirUnHabitant } from "@/lib/direct/push-salons";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const j = lireJetonCote(String(p?.jeton ?? ""));
  if (!j) return NextResponse.json({ error: "Ce lien n'est plus valable." }, { status: 400 });
  const etat = p?.etat === "confirme" ? "confirmee" : p?.etat === "refuse" ? "refusee" : null;
  if (!etat) return NextResponse.json({ error: "Réponse illisible." }, { status: 400 });
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Indisponible." }, { status: 503 });
  }
  const r = await noterReponse(supabase, j, etat);
  if ("erreur" in r) return NextResponse.json({ error: r.erreur }, { status: r.statut });
  after(async () => {
    const { data } = await supabase.from("human_habitants").select("ville_slug").eq("id", j.h).maybeSingle();
    const ville = String((data as { ville_slug?: string } | null)?.ville_slug ?? "");
    await prevenirUnHabitant(supabase, j.h, {
      titre: etat === "confirmee" ? "Le magasin confirme !" : "Le magasin vous a répondu",
      corps: etat === "confirmee" ? `« ${j.o.slice(0, 80)} » est mise de côté${j.m ? ` chez ${j.m.slice(0, 60)}` : ""}.` : `« ${j.o.slice(0, 80)} » n'est plus disponible${j.m ? ` chez ${j.m.slice(0, 60)}` : ""}.`,
      url: ville ? `/ville/${encodeURIComponent(ville)}` : "/",
      tag: `cote-${j.r}`,
    });
  });
  return NextResponse.json({ ok: true });
}
