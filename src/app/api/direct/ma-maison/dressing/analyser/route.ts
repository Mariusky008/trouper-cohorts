// 🔎 « CLIKME ANALYSE VOTRE VÊTEMENT » — couleur, type, style, matière, saison.
//
// RIEN N'EST GARDÉ ICI : la photo arrive, part chez le modèle qui voit, et la
// réponse revient. Elle n'est rangée que si la personne valide, par la route
// du dressing. C'est aussi pourquoi cette route ne demande pas de cookie : la
// démonstration, qui garde le dressing sur le téléphone, s'en sert autant que
// la vraie ville.
//
// UNE LIMITE PAR ADRESSE, PARCE QU'UN APPEL A UN PRIX. Elle est tenue en
// mémoire, donc par instance du serveur : c'est un garde-fou contre une boucle
// ou un abus grossier, pas un compteur exact. Une personne qui range son
// placard ajoute quelques pièces, pas cent.
import { NextResponse } from "next/server";
import { analyserVetement, analyseConfiguree, lireImage } from "@/lib/direct/dressing-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Une photo réduite à 640 points par le téléphone : quelques dizaines de kilo-octets. */
const IMAGE_MAX = 1_500_000;
const PAR_HEURE = 40;
const appels = new Map<string, number[]>();

function trop(ip: string): boolean {
  const maintenant = Date.now();
  const recents = (appels.get(ip) ?? []).filter((t) => maintenant - t < 3_600_000);
  recents.push(maintenant);
  appels.set(ip, recents);
  if (appels.size > 5000) appels.clear();
  return recents.length > PAR_HEURE;
}

export async function POST(req: Request) {
  if (!analyseConfiguree()) return NextResponse.json({ ok: false, sansIA: true }, { status: 503 });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "inconnue";
  if (trop(ip)) return NextResponse.json({ ok: false, error: "Trop d'analyses d'un coup : réessayez dans un moment." }, { status: 429 });
  let corps: Record<string, unknown> | null = null;
  try {
    corps = (await req.json()) as Record<string, unknown>;
  } catch {
    corps = null;
  }
  const image = lireImage(corps?.image, IMAGE_MAX);
  if (!image) return NextResponse.json({ ok: false, error: "Photo illisible ou trop lourde." }, { status: 413 });
  const r = await analyserVetement(image);
  if ("erreur" in r) return NextResponse.json({ ok: false, error: "L'analyse n'a pas abouti." }, { status: 502 });
  return NextResponse.json({ ok: true, vetement: r.vetement, fiche: r.fiche }, { headers: { "cache-control": "no-store" } });
}
