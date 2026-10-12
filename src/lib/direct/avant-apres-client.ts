/**
 * ⚖️ « AVANT OU APRÈS ? », CÔTÉ TÉLÉPHONE — publier son essai dans La ville.
 *
 * Les deux photos sont réduites ici avant de partir (un essai sort du moteur
 * en pleine taille : deux comme ça ne tiendraient pas dans une requête). Le
 * serveur range les photos, publie pour 48 heures et ouvre le salon public
 * dans le même geste. Voir `lib/direct/avant-apres.ts`.
 *
 * FICHIER NAVIGATEUR.
 */
import { reduirePhoto } from "@/lib/direct/dressing-depot";
import { direSonPrenom } from "@/lib/direct/salons";
import { villeSlug } from "@/lib/direct/ville";

export type PublicationAA = { id: string; fin: string; salon?: string; ville: string };

/** Une image (data:, ou une adresse du site) réduite à 1080 points, en JPEG. */
async function reduire(image: string): Promise<string | null> {
  try {
    const r = await fetch(image);
    if (!r.ok) return null;
    return (await reduirePhoto(await r.blob(), 1080, 0.85))?.dataUrl ?? null;
  } catch {
    return null;
  }
}

/** Un identifiant de publication, au format de La ville. */
const nouvelId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export async function publierAvantApres(p: {
  ville: string;
  qui: string;
  avant: string;
  apres: string;
  quoi: string;
  prix?: string;
  magasin?: string;
  carte?: string;
  piece?: string;
  page?: string;
  /** « Ça me va ? » envoyé aux amis depuis la même feuille : leurs votes comptent aussi. */
  avis?: string;
}): Promise<{ ok: true; pub: PublicationAA } | { ok: false; erreur: string }> {
  const slug = villeSlug(p.ville);
  if (!slug) return { ok: false, erreur: "La ville n’est pas connue ici." };
  const [avant, apres] = await Promise.all([reduire(p.avant), reduire(p.apres)]);
  if (!avant || !apres) return { ok: false, erreur: "Les photos n’ont pas pu être préparées." };
  const qui = p.qui.trim().slice(0, 30);
  if (qui) direSonPrenom(qui);
  const id = nouvelId();
  try {
    const r = await fetch("/api/direct/ville-fil", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "publier",
        ville: slug,
        id,
        qui,
        donnees: {
          texte: "Avant ou après ? 🤔",
          nature: "question",
          genre: "essai",
          avantApres: true,
          photo: apres,
          avant,
          quoi: p.quoi,
          ...(p.prix ? { prix: p.prix } : {}),
          ...(p.page ? { page: p.page } : {}),
          ...(p.avis ? { avis: p.avis } : {}),
          ...(p.magasin ? { ou: p.magasin } : {}),
          ...(p.carte && p.magasin ? { commerce: { id: p.carte, nom: p.magasin } } : {}),
          ...(p.carte && p.piece ? { reference: { carte: p.carte, piece: p.piece, nom: p.quoi } } : {}),
        },
      }),
    });
    const j = (await r.json()) as { ok?: boolean; id?: string; fin?: string; salon?: string; error?: string };
    if (!r.ok || !j.ok || !j.fin) return { ok: false, erreur: j.error || "La publication n’a pas pu partir." };
    return { ok: true, pub: { id, fin: j.fin, ville: slug, ...(j.salon ? { salon: j.salon } : {}) } };
  } catch {
    return { ok: false, erreur: "Pas de réseau : réessayez dans un instant." };
  }
}

/** Retirer tout, tout de suite : la publication, les deux photos, le salon. */
export async function retirerAvantApres(id: string): Promise<boolean> {
  try {
    const r = await fetch("/api/direct/ville-fil", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "retirer", id }) });
    return r.ok;
  } catch {
    return false;
  }
}
