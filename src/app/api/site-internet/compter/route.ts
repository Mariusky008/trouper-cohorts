// COMPTER UN GESTE SUR LA PAGE D'UN COMMERÇANT — une écoute de sa voix, une
// demande confirmée à son double, un partage. Voir `compteurs-jour.ts`.
//
// POST { slug, quoi } → 204, toujours. Les vues, elles, ne passent pas par ici :
// la page les compte elle-même en se rendant, et une route publique qui
// accepterait « vues » serait un bouton pour gonfler ses propres chiffres.
//
// UN COMMERCE DE LA DÉMONSTRATION n'a pas de ligne en base : le geste est
// simplement ignoré.
import { compterParAdresse, QUOI_PUBLICS, type QuoiCompte } from "@/lib/site-internet/compteurs-jour";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const p = (await request.json()) as { slug?: unknown; quoi?: unknown };
    const slug = String(p.slug ?? "").trim();
    const quoi = String(p.quoi ?? "") as QuoiCompte;
    if (QUOI_PUBLICS.includes(quoi)) await compterParAdresse(slug, quoi);
  } catch {
    /* corps illisible → rien à compter */
  }
  return new Response(null, { status: 204 });
}
