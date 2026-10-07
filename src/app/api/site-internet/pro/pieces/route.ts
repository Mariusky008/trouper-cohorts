// LES PIÈCES DU COMPTOIR — la coupe, la pose, la monture, la pièce, la
// création à essayer, le livre conseillé. Voir `lib/site-internet/pieces-comptoir.ts`.
//
// POST, même jeton que le reste de l'Espace Pro (`slug` + `token`) :
//   · `lire`    → { pieces }
//   · `poser`   → { piece: { id, nom, prix?, photo, rayon, decrire?, detail?, fin?, vitrine? } }
//                 `vitrine: true` : une photo de sa vitrine — sans fin, elle reste ;
//                 la photo arrive en data: (réduite par le comptoir) ou en https ;
//                 elle est rangée chez nous sous son empreinte, comme celles du plat.
//   · `retirer` → { id }
//
// RANGÉES DANS SON DIAGNOSTIC, relu juste avant d'écrire : la même règle que
// son Expérience restaurant, pour ne rien effacer de ce qui s'y trouve déjà.
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { ligneDuCommercant } from "@/lib/site-internet/experience-scenes";
import { MAX_PIECES, piecesDuDiagnostic, type PieceComptoir } from "@/lib/site-internet/pieces-comptoir";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const s = (v: unknown) => String(v ?? "").trim();
const SEAU = s(process.env.COUVERTURE_BUCKET) || "marketplace-privilege-offers";
const DOSSIER = "comptoir-clikme";
const MAX_MS = 400 * 24 * 3600 * 1000;

/** Sa photo, ramenée à 1600 points et rangée sous son empreinte — voir `rangerPhoto` de l'Expérience. */
async function ranger(slug: string, valeur: string): Promise<string | { erreur: string }> {
  const v = s(valeur);
  if (/^https:\/\//i.test(v)) return v;
  const m = /^data:(image\/(?:jpeg|jpg|png|webp|heic|heif));base64,(.+)$/i.exec(v);
  if (!m) return { erreur: "photo illisible" };
  const brut = Buffer.from(m[2], "base64");
  if (brut.length > 8 * 1024 * 1024) return { erreur: "photo trop lourde" };
  let octets: Buffer;
  try {
    octets = await sharp(brut).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
  } catch {
    return { erreur: "photo illisible" };
  }
  const supabase = createAdminClient();
  const chemin = `${DOSSIER}/${slug}-piece-${createHash("sha1").update(brut).digest("hex").slice(0, 16)}.jpg`;
  const { error } = await supabase.storage.from(SEAU).upload(chemin, octets, { contentType: "image/jpeg", upsert: true });
  if (error) return { erreur: `stockage : ${error.message}` };
  return supabase.storage.from(SEAU).getPublicUrl(chemin).data.publicUrl;
}

/** Relire son diagnostic, changer ses pièces, écrire. */
async function changer(id: string, maj: (p: PieceComptoir[]) => PieceComptoir[]): Promise<PieceComptoir[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", id).maybeSingle();
  const diag = ((data as Record<string, unknown> | null)?.diagnostic ?? {}) as Record<string, unknown>;
  // LES ANNONCES PASSÉES SORTENT D'ABORD : elles ne prennent plus la place
  // d'une photo de sa vitrine, qui, elle, n'a pas de fin.
  const vivantes = piecesDuDiagnostic(diag).filter((x) => !x.fin || Date.parse(x.fin) > Date.now());
  const suite = maj(vivantes).slice(0, MAX_PIECES);
  const { error } = await supabase
    .from("human_vitrine_sites")
    .update({ diagnostic: { ...(typeof diag === "object" ? diag : {}), pieces_comptoir: suite } })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return suite;
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const ligne = await ligneDuCommercant(slug, s(p?.token)).catch(() => null);
  if (!ligne) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const action = s(p?.action) || "lire";

  if (action === "lire") return NextResponse.json({ ok: true, pieces: piecesDuDiagnostic(ligne.diag) });

  if (action === "retirer") {
    const cible = s(p?.id);
    if (!cible) return NextResponse.json({ error: "id requis" }, { status: 400 });
    try {
      const pieces = await changer(ligne.id, (l) => l.filter((x) => x.id !== cible));
      return NextResponse.json({ ok: true, pieces });
    } catch (e) {
      return NextResponse.json({ error: `Enregistrement impossible : ${String((e as Error).message ?? e)}` }, { status: 500 });
    }
  }

  if (action === "poser") {
    const o = (p?.piece && typeof p.piece === "object" ? p.piece : {}) as Record<string, unknown>;
    const id = s(o.id).slice(0, 60);
    const nom = s(o.nom).slice(0, 80);
    if (!id || !nom) return NextResponse.json({ error: "Il manque le nom." }, { status: 400 });
    const photo = await ranger(slug, s(o.photo));
    if (typeof photo !== "string") return NextResponse.json({ error: `Photo : ${photo.erreur}` }, { status: 400 });
    const vitrine = o.vitrine === true;
    const t = typeof o.fin === "number" ? o.fin : Date.parse(s(o.fin));
    const fin =
      !vitrine && Number.isFinite(t) && t > Date.now() ? new Date(Math.min(t, Date.now() + MAX_MS)).toISOString() : undefined;
    const piece: PieceComptoir = {
      id,
      nom,
      prix: s(o.prix).slice(0, 20) || undefined,
      photo,
      rayon: s(o.rayon).slice(0, 40) || "À essayer",
      decrire: s(o.decrire).slice(0, 300) || undefined,
      detail: s(o.detail).slice(0, 300) || undefined,
      publieLe: new Date().toISOString(),
      fin,
      ...(vitrine ? { vitrine: true } : {}),
    };
    try {
      const pieces = await changer(ligne.id, (l) => [piece, ...l.filter((x) => x.id !== id)]);
      return NextResponse.json({ ok: true, pieces });
    } catch (e) {
      return NextResponse.json({ error: `Enregistrement impossible : ${String((e as Error).message ?? e)}` }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
