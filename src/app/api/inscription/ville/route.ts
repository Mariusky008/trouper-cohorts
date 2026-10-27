// 🟢 SA VILLE, POUR LA PAGE D'INSCRIPTION (`/inscription`) : est-elle ouverte (`villes-ouvertes.ts`), et combien de
// commerçants de la ville ont déjà leur page ClikMe — ce que la page affiche dès qu'il a tapé sa ville.
//
//   GET /api/inscription/ville?nom=Annecy   →   { nom: "Annecy", slug: "annecy", ouverte: false, inscrits: 3 }
//
// LES INSCRITS : les commerçants qui ont gardé leur page (`est_client`), pas les aperçus. Le nom stocké sur les fiches
// n'est jamais propre (« 74000 Annecy, France ») : `ilike` large, puis le tri fin sur le slug, comme `configVille`.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nomDeVille, villeSlug } from "@/lib/direct/ville";
import { villeOuverte } from "@/lib/direct/villes-ouvertes";

export const dynamic = "force-dynamic";

const str = (v: unknown) => (v == null ? "" : String(v));

export async function GET(request: Request) {
  const nom = str(new URL(request.url).searchParams.get("nom")).trim().slice(0, 60);
  const slug = villeSlug(nom);
  if (slug.length < 2) return NextResponse.json({ error: "Indiquez votre ville." }, { status: 400 });

  let inscrits = 0;
  try {
    const { data } = await createAdminClient()
      .from("human_vitrine_sites")
      .select("city")
      .eq("channel", "letter")
      .eq("est_client", true)
      .ilike("city", `%${slug.replace(/-/g, " ")}%`)
      .limit(500);
    for (const r of (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>) {
      const cs = villeSlug(str(r.city).replace(/\b\d{5}\b/g, " "));
      if (cs === slug || cs.startsWith(`${slug}-`) || cs.endsWith(`-${slug}`)) inscrits++;
    }
  } catch {
    /* base indisponible : on ne compte personne, la page n'affiche pas de nombre */
  }
  return NextResponse.json(
    { nom: nomDeVille(nom), slug, ouverte: villeOuverte(slug), inscrits },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
