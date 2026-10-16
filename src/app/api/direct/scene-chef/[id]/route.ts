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
 *
 * « LA PHOTO DU MONSIEUR À CÔTÉ DU FANTÔME A DISPARU. » Le réseau ne garde une
 * scène que pour UN déploiement : chaque mise en ligne la jette, et la
 * mémoire de la fonction aussi. Il fallait donc la refaire après chaque
 * déploiement — une minute de moteur d'images, payée à nouveau, pendant
 * laquelle l'écran montre la salle vide ; et si le moteur échoue ce jour-là,
 * plus de cuisinier du tout. ELLE EST MAINTENANT RANGÉE DANS LE STOCKAGE
 * (le même seau que les scènes des vrais restaurants) dès qu'elle est faite,
 * et relue de là ensuite : faite une fois, pour de bon.
 *
 * ET L'ÉCHEC SE LIT : la réponse 503 dit pourquoi (`{ erreur }`). Ouvrir
 * l'adresse dans un navigateur suffit à savoir ce qui bloque.
 */
import { NextResponse } from "next/server";
import { toutesLesCartes } from "@/lib/direct/apercu-habitant";
import { photoDuDisque, rendreScene } from "@/lib/site-internet/experience-scenes";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

const memoire = new Map<string, Buffer>();
const enCours = new Map<string, Promise<{ octets: Buffer } | { erreur: string }>>();

/** Le seau des scènes des vrais restaurants (`experience-scenes.ts`) : une adresse fixe par restaurant de démonstration. */
const SEAU = String(process.env.COUVERTURE_BUCKET ?? "").trim() || "marketplace-privilege-offers";
const rangement = (id: string) => `experience-clikme/demo-scene-chef-${id}.webp`;

async function lireRangee(id: string): Promise<Buffer | null> {
  try {
    const { data, error } = await createAdminClient().storage.from(SEAU).download(rangement(id));
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  } catch {
    return null;
  }
}

async function ranger(id: string, octets: Buffer) {
  try {
    const { error } = await createAdminClient().storage.from(SEAU).upload(rangement(id), octets, { contentType: "image/webp", upsert: true });
    if (error) console.info("[scene-chef] rangement impossible", JSON.stringify({ id, erreur: error.message }));
  } catch (e) {
    console.info("[scene-chef] rangement impossible", JSON.stringify({ id, erreur: e instanceof Error ? e.message : "erreur" }));
  }
}

async function composer(id: string, nom: string, photo: string): Promise<{ octets: Buffer } | { erreur: string }> {
  // DÉJÀ FAITE UN AUTRE JOUR : on la relit, sans repasser par le moteur.
  const rangee = await lireRangee(id);
  if (rangee) return { octets: rangee };
  const img = await photoDuDisque(photo);
  if (!img) return { erreur: `photo d'accueil introuvable sur le serveur (${photo})` };
  const r = await rendreScene("chef", nom, img);
  if ("erreur" in r) {
    console.info("[scene-chef] la scène a échoué", JSON.stringify({ nom, erreur: r.erreur }));
    return { erreur: r.erreur };
  }
  await ranger(id, r.octets);
  return { octets: r.octets };
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
      p = composer(id, c.nom, c.photoAccueil).finally(() => enCours.delete(id));
      enCours.set(id, p);
    }
    const r = await p;
    if ("erreur" in r) return NextResponse.json({ erreur: r.erreur }, { status: 503, headers: { "cache-control": "no-store" } });
    octets = r.octets;
    memoire.set(id, octets);
  }
  return new NextResponse(new Uint8Array(octets), {
    headers: {
      "content-type": "image/webp",
      "cache-control": "public, max-age=86400, s-maxage=31536000, immutable",
    },
  });
}
