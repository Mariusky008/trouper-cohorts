// 📸 LA PHOTO CLIKME D'UN COMMERCE — la lancer, la suivre, en changer.
//
// POST { slug, source?, refaire?, originale?, reprendre?, photo? }
//   → répond tout de suite avec l'état ; le rendu, s'il y en a un, tourne
//     ensuite (`after`) et l'écran interroge GET pendant ce temps.
// GET ?slug= → l'état seul, sans rien lancer.
//
// QUI PEUT L'APPELER : quiconque a l'adresse de la page, comme le reste de
// l'aperçu. Ce qui le rend sûr n'est donc pas l'identité mais le PLAFOND — voir
// `ESSAIS_MAX` et `COUVERTURE_PAR_JOUR` dans `lib/site-internet/couverture.ts`.
// Au pire, quelqu'un fait refaire quatre fois la couverture d'un commerce.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ESSAIS_MAX, couvertureDuDiagnostic, preparerCouverture } from "@/lib/site-internet/couverture";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// LE RENDU TOURNE APRES LA REPONSE, MAIS DANS LA MEME FONCTION : c'est elle
// qui doit avoir le droit de vivre le temps d'une édition d'image.
export const maxDuration = 300;

const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const lisible = (slug: string) => /^[a-z0-9-]{2,120}$/i.test(slug);

export async function GET(requete: Request) {
  const slug = s(new URL(requete.url).searchParams.get("slug"));
  if (!lisible(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  const { data } = await createAdminClient()
    .from("human_vitrine_sites")
    .select("diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  if (!data) return NextResponse.json({ erreur: "site introuvable" }, { status: 404 });
  const etat = couvertureDuDiagnostic((data as Record<string, unknown>).diagnostic);
  return NextResponse.json({ etat, essaisMax: ESSAIS_MAX }, { headers: { "cache-control": "no-store" } });
}

export async function POST(requete: Request) {
  let p: Record<string, unknown> = {};
  try {
    p = (await requete.json()) as Record<string, unknown>;
  } catch {
    /* corps vide */
  }
  const slug = s(p.slug);
  if (!lisible(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  const origine = new URL(requete.url).origin;
  const prep = await preparerCouverture(slug, origine, {
    source: Number.isInteger(p.source) ? (p.source as number) : undefined,
    refaire: p.refaire === true,
    originale: p.originale === true,
    reprendre: p.reprendre === true,
    // LA PHOTO DE SA DEVANTURE, envoyée depuis sa page, déjà réduite par le navigateur.
    depot: typeof p.photo === "string" && p.photo.length < 6_000_000 ? p.photo : undefined,
  });
  if (prep.travail) after(prep.travail);
  return NextResponse.json(
    { etat: prep.etat, raison: prep.raison, lance: Boolean(prep.travail), essaisMax: ESSAIS_MAX },
    { status: prep.travail ? 202 : 200 },
  );
}
