// 👗 L'ESSAYAGE DE SA VITRINE — sa route à lui.
//
//   · GET : où il en est. La page le demande pendant qu'elle attend le rendu
//     (voir `avant-apres-vitrine.tsx`) ; un échec dit pourquoi, en clair pour
//     le commerçant et en détail pour nous.
//   · POST : le lancer, s'il est à faire. Sonné par sa page quand LUI la
//     regarde, et par la lecture de sa fiche Google dès que ses photos sont
//     là — pour que l'essai soit prêt AVANT qu'il lance la présentation.
//     PUIS SES AUTRES PIÈCES (`completerPiecesDemo`), celles qu'elle essaiera
//     elle-même après la présentation : APRÈS l'essai, jamais en même temps —
//     les deux écrivent dans le même diagnostic. Le GET les rend (`autres`).
//
// ELLE A SES CINQ MINUTES À ELLE. L'essai passait par la route `hote`, après
// la photo ClikMe et sa version sans hôte : deux rendus d'image avant le sien,
// dans le même budget. Seul, il tient : choisir la pièce, la recadrer,
// habiller l'avant.
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { essaiVitrineDuDiagnostic, piecesDemoDuDiagnostic, raisonLisible } from "@/lib/site-internet/essai-vitrine-donnees";
import { completerEssaiVitrine, completerPiecesDemo } from "@/lib/site-internet/essai-vitrine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const lisible = (slug: string) => /^[a-z0-9-]{2,120}$/i.test(slug);

export async function GET(req: Request) {
  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim();
  if (!lisible(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  try {
    const { data } = await createAdminClient()
      .from("human_vitrine_sites")
      .select("diagnostic")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const diag = (data as Record<string, unknown> | null)?.diagnostic;
    const e = essaiVitrineDuDiagnostic(diag);
    /* SES AUTRES PIÈCES : la liste quand on l'a cherchée, et où on en est. */
    const pd = piecesDemoDuDiagnostic(diag);
    const autres = { autres: pd?.etat === "prete" ? pd.pieces.map(({ photo, nom, genre }) => ({ photo, nom, genre })) : undefined, autresEtat: pd?.etat ?? "absent" };
    if (e?.etat === "prete" && e.apres && e.avant) {
      return NextResponse.json({ etat: "prete", avant: e.avant, apres: e.apres, piece: e.piece, nom: e.nom, ...autres });
    }
    /* L'ÉCHEC DIT POURQUOI : la raison pour lui, le détail pour nous. */
    return NextResponse.json({
      etat: e?.etat ?? "absent",
      essais: e?.essais,
      at: e?.at,
      piece: e?.piece,
      nom: e?.nom,
      raison: e && (e.etat === "echec" || e.etat === "aucune") ? raisonLisible(e) : undefined,
      erreur: e?.erreur,
      v: e?.v,
      ...autres,
    });
  } catch {
    return NextResponse.json({ etat: "absent" });
  }
}

export async function POST(req: Request) {
  const p = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = String(p.slug ?? "").trim();
  if (!lisible(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  const origine = new URL(req.url).origin;
  after(async () => {
    try {
      await completerEssaiVitrine(slug, origine);
    } catch {
      /* la prochaine visite relancera */
    }
    try {
      await completerPiecesDemo(slug);
    } catch {
      /* la prochaine visite relancera */
    }
  });
  return NextResponse.json({ lance: true }, { status: 202 });
}
