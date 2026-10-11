// 🧥 « JE CRÉE VOTRE LOOK… » — la pièce de la boutique, avec les siennes.
//
// LA PAGE ENVOIE LES PHOTOS DÉJÀ RÉDUITES (768 points), dans l'ordre de la
// tenue : la pièce du magasin, puis trois pièces de son dressing au plus. La
// photo de la personne n'arrive que si elle vient de la prendre pour l'essai.
// Rien n'est gardé ici. Voir `lib/direct/look-dressing.ts`.
//
// UN RENDU A UN PRIX : une limite par adresse, tenue en mémoire (garde-fou,
// pas compteur exact), en plus du quota d'essais que l'écran applique déjà.
import { NextResponse } from "next/server";
import { lireImage } from "@/lib/direct/dressing-serveur";
import { moteurLookConfigure, rendreLook, type PieceDuLook } from "@/lib/direct/look-dressing";
import { SORTES_VETEMENT, nomPropre, type SorteVetement } from "@/lib/direct/dressing";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const IMAGE_MAX = 2_500_000;
const PAR_HEURE = 12;
const appels = new Map<string, number[]>();

function trop(ip: string): boolean {
  const maintenant = Date.now();
  const recents = (appels.get(ip) ?? []).filter((t) => maintenant - t < 3_600_000);
  recents.push(maintenant);
  appels.set(ip, recents);
  if (appels.size > 5000) appels.clear();
  return recents.length > PAR_HEURE;
}

function piece(o: unknown): PieceDuLook | null {
  const r = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
  const image = lireImage(r.image, IMAGE_MAX);
  if (!image) return null;
  const sorte = SORTES_VETEMENT.includes(r.sorte as SorteVetement) ? (r.sorte as SorteVetement) : undefined;
  // LA DESCRIPTION DU COMMERÇANT : elle ne sert que si le filtre refuse sa photo. Bornée ici.
  const decrire = typeof r.decrire === "string" ? r.decrire.replace(/\s+/g, " ").trim().slice(0, 300) : "";
  return { nom: nomPropre(r.nom, "Vêtement"), image, ...(sorte ? { sorte } : {}), ...(decrire ? { decrire } : {}) };
}

export async function POST(req: Request) {
  const debut = Date.now();
  if (!moteurLookConfigure()) return NextResponse.json({ ok: false, sansMoteur: true }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "inconnue";
  if (trop(ip)) return NextResponse.json({ ok: false, error: "Trop de looks d'un coup : réessayez dans un moment." }, { status: 429 });
  let corps: Record<string, unknown> | null = null;
  try {
    corps = (await req.json()) as Record<string, unknown>;
  } catch {
    corps = null;
  }
  const boutique = piece(corps?.piece);
  const siennes = (Array.isArray(corps?.autres) ? corps.autres : []).slice(0, 3).map(piece).filter((x): x is PieceDuLook => Boolean(x));
  if (!boutique || !siennes.length) return NextResponse.json({ ok: false, error: "Il manque des pièces pour faire un look." }, { status: 400 });
  const personne = corps?.personne ? lireImage(corps.personne, IMAGE_MAX) : null;
  const r = await rendreLook({
    pour: corps?.pour === "homme" ? "homme" : "femme",
    personne,
    boutique,
    siennes,
    origine: new URL(req.url).origin,
    debut,
  });
  if ("erreur" in r) return NextResponse.json({ ok: false, error: "Le look n'a pas pu être rendu." }, { status: 502 });
  return NextResponse.json(
    { ok: true, image: `data:${r.image.type};base64,${r.image.donnees}`, modele: r.modele, surElle: r.surElle },
    { headers: { "cache-control": "no-store" } },
  );
}
