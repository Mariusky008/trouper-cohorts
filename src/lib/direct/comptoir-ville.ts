/**
 * 🏙️ DU COMPTOIR À LA VILLE — ce qu'il publie arrive là où on le cherche.
 *
 * « "Il en reste !" n'arrive nulle part : ni sur sa page, ni dans Le Direct,
 * où il serait le plus utile vers 14 h. Les autres métiers ont le même trou.
 * Le livre conseillé, la coupe ou la pose à essayer devraient alimenter "Ton
 * prochain livre", l'essayage sur sa page, Le Direct. »
 *
 * EN DÉMONSTRATION, LE CHEMIN EST CELUI DE L'ANCIENNE LÉA : la journée du
 * téléphone (`journee.ts`), que l'application `/autour-de-moi` lit et place en
 * tête de la ville. Chaque publication y entre sous la forme que l'application
 * sait montrer :
 *
 *   · un MOMENT dans Le Direct, toujours — le plat, le livre, la coupe ;
 *   · « Il en reste ! » en FLASH, avec son compte à rebours : c'est la forme
 *     que Le Direct met en avant, et c'est exactement ce que veut dire « il
 *     me reste cinq parts, à 12 euros » ;
 *   · le plat du jour devient aussi son MENU, et sa voix l'étape 2 de son
 *     Expérience (« La voix du chef ») ;
 *   · la coupe, la pose, la monture, la pièce, la création entrent dans son
 *     CATALOGUE avec leur photo : c'est elle que l'essayage pose sur le client ;
 *   · le livre entre dans son catalogue en « coup de cœur » : « Ton prochain
 *     livre » choisit parmi eux.
 *
 * DANS LE VRAI PRODUIT, la même publication partira en base au nom du
 * commerçant (étape 2 du programme) ; cette forme-ci est celle que sa page et
 * la ville liront.
 *
 * FICHIER NAVIGATEUR.
 */
import type { CleMetier, MomentJour } from "@/lib/direct/apercu-habitant";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import { momentDuFlash } from "@/lib/direct/flash";
import { ouvrirJournee, poserDansLaJournee, publierMoment, retirerDeLaJournee, chargerJournee } from "@/lib/direct/journee";
import type { Publication } from "@/lib/direct/comptoir";
import type { Mission } from "@/lib/direct/missions-commercant";

/** Le commerce du comptoir : un commerce de la démonstration, ou celui de la page d'où l'on vient. */
export type CommerceComptoir = {
  id: string;
  famille: FamilleDouble;
  metier: string;
  branche: string;
  /** Comment le fantôme l'appelle : « Margot », « Chef ». Vide : « Salut ! ». */
  prenom: string;
  nom: string;
  photo?: string;
  adresse?: string;
  horaires?: string;
  distance?: string;
  metres?: number;
  /** Où le mène « Voir dans la ville » après avoir publié. */
  ville?: string;
};

/** Les familles dont la pièce s'essaie sur soi : elle entre au catalogue avec sa photo. */
const S_ESSAIE: FamilleDouble[] = ["coiffure", "ongles", "lunettes", "mode", "createur"];

const heure = () => {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
};

/** Jusqu'à quand le moment se montre aujourd'hui : le service de midi, la soirée, ou la journée. */
function finDuMoment(famille: FamilleDouble, h: number): number {
  if (famille === "table") return h < 15 ? 15 : 22.5;
  if (famille === "bar") return 24;
  return 20;
}

/** Ce que dit le bouton de la carte, dans les mots du métier. */
const ACTION: Partial<Record<FamilleDouble, string>> = {
  table: "Réserver",
  bar: "Réserver",
  coiffure: "L’essayer",
  ongles: "L’essayer",
  lunettes: "L’essayer",
  mode: "L’essayer",
  createur: "La voir",
  librairie: "Me le garder",
  fleurs: "Le commander",
  seance: "Réserver",
};

function ouvrir(c: CommerceComptoir, photo?: string) {
  const j = chargerJournee();
  ouvrirJournee({
    id: c.id,
    prenom: c.prenom,
    nom: c.nom,
    metier: c.metier,
    branche: c.branche as CleMetier,
    adresse: c.adresse ?? "Dax",
    horaires: c.horaires ?? "Aujourd’hui",
    distance: c.distance ?? "300 m",
    metres: c.metres ?? 300,
    photo: c.photo ?? (j?.commerce.id === c.id ? j.commerce.photo : undefined) ?? photo,
  });
}

/** Le prix « 12 € » en nombre, pour savoir s'il a baissé. */
const enNombre = (p?: string) => {
  const n = Number(String(p ?? "").replace(/[^\d,.]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Envoyer une publication du comptoir dans la ville. */
export function envoyerALaVille(c: CommerceComptoir, mission: Mission, p: Publication, principal?: Publication): void {
  const photo = p.photos[0];
  ouvrir(c, photo);
  const h = heure();

  // ── « IL EN RESTE ! » : UN FLASH, AVEC SON COMPTE À REBOURS ──
  if (p.genre === "relance") {
    const combien = Number((p.detail ?? "").match(/\d+/)?.[0] ?? 0);
    const avant = principal?.prix;
    const baisse = enNombre(p.prix) !== null && enNombre(avant) !== null && enNombre(p.prix)! < enNombre(avant)!;
    const m: Omit<MomentJour, "publie"> = {
      ...momentDuFlash({
        quoi: p.nom,
        avantage: p.detail || "Les dernières",
        avant: baisse ? avant : undefined,
        apres: p.prix || undefined,
        combien,
        photo: photo || principal?.photos[0],
        lance: h,
        fin: Math.min(23.9, h + 2),
      }),
      etiquette: "Il en reste !",
    };
    publierMoment(m, h);
    return;
  }

  // ── LE MOMENT DU JOUR, DANS LE DIRECT ──
  const moment: Omit<MomentJour, "publie"> = {
    de: Math.max(0, h - 0.1),
    a: Math.max(h + 1, finDuMoment(c.famille, h)),
    quand: "aujourd’hui",
    icone: mission.icone,
    titre: p.nom,
    lignes: [mission.quoi, ...(p.voixTexte ? [`« ${p.voixTexte} »`] : [])],
    ...(p.prix ? { prix: p.prix } : {}),
    ...(photo ? { photo } : {}),
    etiquette: mission.quoi,
    action: ACTION[c.famille] ?? "J’y vais",
    envies: [],
  };
  publierMoment(moment, h);

  // ── LE PLAT DU JOUR ET SA VOIX : L'EXPÉRIENCE DU RESTAURANT ──
  if (c.famille === "table" || c.famille === "bar") {
    poserDansLaJournee({
      menu: { plat: p.nom, description: p.voixTexte ?? mission.quoi, prix: p.prix || "", photo: photo ?? c.photo ?? "" },
    });
  }
  if (p.voix || p.voixTexte) poserDansLaJournee({ voix: { extrait: p.voix, citation: p.voixTexte } });

  // ── LA PIÈCE À ESSAYER, LE LIVRE CONSEILLÉ ──
  if (photo && (S_ESSAIE.includes(c.famille) || c.famille === "librairie")) {
    const j = chargerJournee();
    const article = {
      id: p.id,
      nom: p.nom,
      prix: p.prix || undefined,
      photo,
      rayon: c.famille === "librairie" ? "Coup de cœur" : mission.quoi,
      ...(p.voixTexte ? { detail: p.voixTexte } : {}),
      // LA CIBLE DE L'ESSAI : son nom dit ce qu'est la coupe ; la photo, elle,
      // tient la forme (voir `consigne-essai.ts`).
      ...(S_ESSAIE.includes(c.famille) ? { decrire: p.nom } : {}),
    };
    poserDansLaJournee({ catalogue: [article, ...(j?.catalogue ?? []).filter((a) => a.id !== p.id)] });
  }
}

/** Ce qu'il retire de son comptoir sort aussi de la ville. */
export function retirerDeLaVille(p: Publication): void {
  retirerDeLaJournee(p.nom, p.id);
}
