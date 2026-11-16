/**
 * 🗂️ UN FICHIER DU SALON, À ADRESSE STABLE (`lib/direct/salon-fichiers-serveur.ts` ; `docs/univers/salon-du-duo.md`,
 * section 7.2 ; lot S0b).
 *
 * GET /api/direct/salon/fichier/<empreinte>-<largeur>.webp → l'image, gardée un an par le téléphone
 * (`private, max-age=31536000, immutable`) : son nom contient l'empreinte de son contenu, il ne change jamais ; une
 * nouvelle image a un nouveau nom. Une session d'habitant (ou d'administrateur) suffit : le nom, que seuls les deux du
 * duo reçoivent (`?ouvrir=`), en est la clé (128 bits), comme celle d'une adresse signée.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { telecharger } from "@/lib/direct/ma-figurine-serveur";
import { NOM_FICHIER_SALON, cheminFichierSalon } from "@/lib/direct/salon-fichiers-serveur";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ nom: string }> };
const sansCache = { "cache-control": "private, no-store" };

export async function GET(request: Request, { params }: RouteContext) {
  const { nom } = await params;
  if (!NOM_FICHIER_SALON.test(nom)) return NextResponse.json({ error: "Ce fichier n’existe pas." }, { status: 404, headers: sansCache });
  const supabase = createAdminClient();
  if (!(await habitantCourant(supabase)) && !(await isCurrentUserAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403, headers: sansCache });
  // (le téléphone l'a déjà : son nom ne change jamais)
  const etiquette = `"${nom}"`;
  if (request.headers.get("if-none-match") === etiquette) return new NextResponse(null, { status: 304, headers: { etag: etiquette, "cache-control": "private, max-age=31536000, immutable" } });
  const octets = await telecharger(supabase, cheminFichierSalon(nom));
  if (!octets) return NextResponse.json({ error: "Ce fichier n’existe pas." }, { status: 404, headers: sansCache });
  return new NextResponse(new Uint8Array(octets), {
    headers: { "content-type": "image/webp", "content-length": String(octets.length), "cache-control": "private, max-age=31536000, immutable", etag: etiquette },
  });
}
