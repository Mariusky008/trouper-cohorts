/**
 * 📬 SON MESSAGE DU MOIS — ce qu'il a publié ce mois-ci, et combien de ses amis sont venus.
 *
 * Voir `lib/direct/message-du-mois.ts`. Le même jeton que tout l'Espace Pro.
 * Rend :
 *   · `nouveautes` — ses annonces du mois dans Le Direct (`human_publications`),
 *                    sans doublon, les plus récentes d'abord ;
 *   · `clics`      — les ouvertures de sa page par le lien du message ce mois-ci
 *                    (`diffusion`, `20261025130000_compteurs_diffusion.sql`) ;
 *                    `mesure: false` tant que la migration n'est pas appliquée.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { moisDe, nouveautesDuMois } from "@/lib/direct/message-du-mois";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const slug = s(p?.slug);
  const token = s(p?.token);
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("id, pro_token").eq("slug", slug).eq("channel", "letter").maybeSingle();
  const site = (data as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const siteId = s(site.id);

  // LE PREMIER JOUR DU MOIS, À PARIS — minuit de Paris, au plus large (UTC+2 l'été).
  const mois = moisDe(Date.now());
  const debut = new Date(`${mois}-01T00:00:00+02:00`).toISOString();

  let textes: string[] = [];
  try {
    const { data: lp } = await supabase
      .from("human_publications")
      .select("texte, publie_le")
      .eq("site_id", siteId)
      .gte("publie_le", debut)
      .order("publie_le", { ascending: false })
      .limit(60);
    textes = ((lp ?? []) as Array<{ texte: string }>).map((r) => s(r.texte));
  } catch {
    /* table absente → aucune annonce */
  }

  let clics = 0;
  let mesure = true;
  try {
    const { data: lc, error } = await supabase.from("human_compteurs_jour").select("jour, diffusion").eq("site_id", siteId).gte("jour", `${mois}-01`);
    if (error) throw new Error(error.message);
    for (const r of (lc ?? []) as Array<{ diffusion?: number }>) clics += Number(r.diffusion) || 0;
  } catch {
    mesure = false;
  }

  return NextResponse.json({ ok: true, mois, nouveautes: nouveautesDuMois(textes), clics, mesure });
}
