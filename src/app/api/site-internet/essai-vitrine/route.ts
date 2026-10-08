// 👗 OÙ EN EST L'ESSAYAGE DE SA VITRINE — la page le demande pendant qu'elle
// attend le rendu (voir `avant-apres-vitrine.tsx`), et se remplit quand il
// arrive. Lecture seule : c'est la route `hote` qui le fabrique.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { essaiVitrineDuDiagnostic } from "@/lib/site-internet/essai-vitrine-donnees";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = (new URL(req.url).searchParams.get("slug") ?? "").trim();
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  try {
    const { data } = await createAdminClient()
      .from("human_vitrine_sites")
      .select("diagnostic")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const e = essaiVitrineDuDiagnostic((data as Record<string, unknown> | null)?.diagnostic);
    if (e?.etat === "prete" && e.apres && e.avant) {
      return NextResponse.json({ etat: "prete", avant: e.avant, apres: e.apres, piece: e.piece, nom: e.nom });
    }
    return NextResponse.json({ etat: e?.etat ?? "absent" });
  } catch {
    return NextResponse.json({ etat: "absent" });
  }
}
