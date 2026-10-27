// 👻 LA FAMILLE D'UN COMMERCE — ce que montre sa page publique (`/f/<lien>`).
//
// GET ?slug= : la foule d'aujourd'hui, celle d'hier, le record, le nombre de fantômes, et lui
// s'il est de la famille (son numéro, son écusson, ce qu'il a fait, son code d'invitation).
// GET ?moi=1 : ses familles, pour Ma Maison (chaque commerce client où il a libéré son fantôme :
// son numéro, son écusson, ce qu'il a fait).
// Voir `lib/direct/famille.ts` (la règle, les paliers) et `lib/direct/famille-serveur.ts`.
//
// Jamais d'habitant créé ici : sans cookie, on voit la foule, sans « toi ».
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { etatFamille, famillesDe } from "@/lib/direct/famille-serveur";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("moi")) {
    const supabase = createAdminClient();
    const moi = await habitantCourant(supabase);
    return NextResponse.json({ ok: true, familles: moi ? await famillesDe(supabase, moi.id) : [] });
  }
  const slug = s(url.searchParams.get("slug"));
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  const supabase = createAdminClient();
  const { data: site } = await supabase.from("human_vitrine_sites").select("id").eq("slug", slug).maybeSingle();
  const siteId = s((site as Record<string, unknown> | null)?.id);
  if (!siteId) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });
  const moi = await habitantCourant(supabase);
  return NextResponse.json({ ok: true, ...(await etatFamille(supabase, siteId, moi?.id)) });
}
