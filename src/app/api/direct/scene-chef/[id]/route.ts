/**
 * 🍽️ L'ÉTAPE 3 D'UN RESTAURANT DE LA DÉMONSTRATION : SA SCÈNE D'ACCUEIL.
 *
 * GET /api/direct/scene-chef/<id> rend la scène « La suite se passe ici » du
 * restaurant `<id>` de la démonstration : son cuisinier (sa photo d'accueil,
 * `photoAccueil`) penché derrière une chaise vide qu'il nous tend, la table
 * au premier plan, son fantôme assis à droite, le nom brodé — la maquette 3.
 * C'est la même consigne que pour un vrai restaurant (`rendreScene`), qui la
 * fait à partir de la photo posée dans son espace commerçant.
 *
 * « Le parcours en 3 étapes côté restaurant n'est pas bon […] voir photo 1 et
 * photo 2. » Sans scène, l'étape 3 recadrait sa photo d'accueil — prise en
 * largeur, sur le pas de sa porte — dans la hauteur d'un téléphone : un visage
 * coupé au bord de l'écran, et un fantôme qui flottait devant.
 *
 * ON COMPOSE UNE FOIS, ET LE RÉSEAU GARDE — la même règle que les cases du
 * « Fantôme de Dax » (`/api/direct/bd`) : un an chez Vercel, et deux lecteurs
 * qui arrivent ensemble attendent la même scène. Seules les photos de la
 * démonstration passent ici : l'identifiant désigne une carte, jamais un
 * fichier. Une adresse avec des paramètres est refusée (une entrée de cache
 * de plus, donc une scène payée de plus).
 *
 * EN CAS D'ÉCHEC, 503, sans cache : l'écran garde la salle de la maquette et
 * son fantôme assis, qu'il montre en attendant — voir `experience-table.tsx`.
 */
import { NextResponse } from "next/server";
import { toutesLesCartes } from "@/lib/direct/apercu-habitant";
import { photoDuDisque, rendreScene } from "@/lib/site-internet/experience-scenes";

export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

const memoire = new Map<string, Buffer>();
const enCours = new Map<string, Promise<Buffer | null>>();

async function composer(nom: string, photo: string): Promise<Buffer | null> {
  const img = await photoDuDisque(photo);
  if (!img) return null;
  const r = await rendreScene("chef", nom, img);
  if ("erreur" in r) {
    console.info("[scene-chef] la scène a échoué", JSON.stringify({ nom, erreur: r.erreur }));
    return null;
  }
  return r.octets;
}

export async function GET(requete: Request, { params }: RouteContext) {
  if (new URL(requete.url).search) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const c = toutesLesCartes().find((x) => x.id === id);
  // UN RESTAURANT DE LA DÉMONSTRATION, AVEC SA PHOTO D'ACCUEIL — rien d'autre.
  if (!c || c.branche !== "restaurant" || !c.photoAccueil?.startsWith("/direct/")) {
    return new NextResponse(null, { status: 404 });
  }
  let octets = memoire.get(id) ?? null;
  if (!octets) {
    let p = enCours.get(id);
    if (!p) {
      p = composer(c.nom, c.photoAccueil).finally(() => enCours.delete(id));
      enCours.set(id, p);
    }
    octets = await p;
    if (octets) memoire.set(id, octets);
  }
  if (!octets) {
    return new NextResponse(null, { status: 503, headers: { "cache-control": "no-store" } });
  }
  return new NextResponse(new Uint8Array(octets), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=86400, s-maxage=31536000, immutable",
    },
  });
}
