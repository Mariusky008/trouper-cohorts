// LA DÉCISION DE L'ADMINISTRATEUR SUR UNE PUBLICATION SIGNALÉE DE LA VILLE.
//
// POST { id, verdict: "garde" | "retire" }
//   · garde  → elle réapparaît, et de nouveaux signalements ne la masquent plus ;
//   · retire → elle disparaît du fil pour tout le monde (rien n'est effacé).
//
// Réservé aux administrateurs : sans cette vérification, n'importe qui
// pourrait faire disparaître la publication d'un voisin.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const id = String(p?.id ?? "").trim();
  const verdict = p?.verdict === "garde" ? "garde" : p?.verdict === "retire" ? "retire" : "";
  if (!/^v[a-z0-9]{6,40}$/i.test(id) || !verdict) return NextResponse.json({ error: "Demande illisible." }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("human_ville_publications")
    .update(verdict === "garde" ? { verdict, masque: false } : { verdict, masque: true, retire_le: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
