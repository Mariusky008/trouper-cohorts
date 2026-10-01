// 🎭 L'ATELIER DES POSES DU DOUBLE — réservé à l'administration.
//
// GET  → les tenues, et pour chacune ses propositions et ses poses validées.
// POST { dossier, pose, action: "generer" | "valider" | "retirer" }
//
// La génération attend le rendu (une à deux minutes) : c'est un geste
// d'administration, fait une fois par tenue, pas un geste d'habitant.
import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { POSES, deciderUnePose, lesTenues, lireIndex, proposerUnePose, type PoseNouvelle } from "@/lib/direct/poses-double";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ erreur: "Accès admin requis." }, { status: 403 });
  try {
    return NextResponse.json({ tenues: lesTenues(), poses: POSES, index: await lireIndex() }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ erreur: e instanceof Error ? e.message : "index illisible" }, { status: 503 });
  }
}

export async function POST(requete: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ erreur: "Accès admin requis." }, { status: 403 });
  const p = (await requete.json().catch(() => ({}))) as Record<string, unknown>;
  const dossier = String(p.dossier ?? "");
  const pose = String(p.pose ?? "") as PoseNouvelle;
  const action = String(p.action ?? "");
  if (!POSES.includes(pose) || !lesTenues().some((t) => t.dossier === dossier)) {
    return NextResponse.json({ erreur: "tenue ou pose inconnue" }, { status: 400 });
  }
  // UNE PANNE DU STOCKAGE SE DIT, ELLE NE S'ÉCRIT PAS : l'index reste tel quel.
  try {
    if (action === "generer") return NextResponse.json({ entree: await proposerUnePose(dossier, pose) });
    if (action === "valider" || action === "retirer") return NextResponse.json({ entree: await deciderUnePose(dossier, pose, action) });
  } catch (e) {
    return NextResponse.json({ erreur: e instanceof Error ? e.message : "stockage indisponible" }, { status: 503 });
  }
  return NextResponse.json({ erreur: "action inconnue" }, { status: 400 });
}
