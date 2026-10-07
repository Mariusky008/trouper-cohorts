// 📸 LA VITRINE DU COMMERÇANT — ses photos de produits, avec leur libellé.
//
// « Il faut pouvoir rajouter pour tous les commerçants la possibilité de
// rajouter des photos de leurs produits, qui iront sur leur page commerçant et
// sur les annonces (exemple : un coiffeur qui met une annonce d'une coupe aura
// pu mettre au préalable 10 ou 15 coiffures différentes pour que ses clients
// puissent les essayer, idem pour onglerie, librairie, tatoo ou autre). »
//
// CE N'EST PAS UNE ANNONCE : elle ne s'efface pas le soir. Une annonce dit
// « aujourd'hui » ; la vitrine dit « voilà ce que je fais », et elle reste
// jusqu'à ce qu'il retire une photo.
//
// DEUX ENDROITS, SELON QUI PARLE :
//   · un VRAI commerçant (/ville/dax) : ses photos partent en base, parmi ses
//     pièces du comptoir, marquées `vitrine` et sans fin — voir
//     `pieces-comptoir.ts` et `/api/site-internet/pro/pieces`. Elles entrent
//     dans son catalogue, donc sur sa page, dans l'essayage de ses annonces et
//     dans « Ton prochain livre » ;
//   · la DÉMONSTRATION (/autour-de-moi) : elles restent dans ce téléphone, sous
//     l'identifiant du commerce, et rejoignent le catalogue de sa carte
//     (`avecSaVitrine`).
//
// LES MOTS SONT CEUX DU MÉTIER : on ajoute des coupes chez le coiffeur, des
// livres chez le libraire, des flashs chez le tatoueur (`motsDeLaVitrine`).
import type { CarteAutour } from "@/lib/direct/apercu-habitant";

/** Une photo de la vitrine, telle que le comptoir la montre. */
export type ArticleVitrine = {
  id: string;
  nom: string;
  prix?: string;
  /** data: dans la démonstration, https chez un vrai commerçant. */
  photo: string;
  ajouteLe: number;
};

/** Combien de photos au plus — « 10 ou 15 », avec de la marge. */
export const MAX_VITRINE = 30;

export type MotsVitrine = {
  /** « Tes coupes » */
  titre: string;
  /** « coupe » — une photo, au singulier. */
  un: string;
  /** « coupes » */
  plusieurs: string;
  /** Le rayon de son catalogue. */
  rayon: string;
  /** Ce que la photo devient chez ses clients. */
  usage: string;
  /** L'exemple de libellé. */
  exemple: string;
};

/** LES MOTS DE SA VITRINE, selon sa famille (et son métier, pour le tatoueur). */
export function motsDeLaVitrine(famille: string, metier = ""): MotsVitrine {
  if (famille === "seance" && /tatou|tattoo/i.test(metier))
    return { titre: "Tes flashs", un: "flash", plusieurs: "flashs", rayon: "Flashs à essayer", usage: "Tes clients les essaieront sur leur peau, depuis ta page et tes annonces.", exemple: "Hirondelle fine line" };
  const m: Record<string, MotsVitrine> = {
    coiffure: { titre: "Tes coupes", un: "coupe", plusieurs: "coupes", rayon: "Coupes à essayer", usage: "Tes clients les essaieront sur leur propre photo, depuis ta page et tes annonces.", exemple: "Carré court dégradé" },
    ongles: { titre: "Tes poses", un: "pose", plusieurs: "poses", rayon: "Poses à essayer", usage: "Tes clientes les essaieront sur leur main, depuis ta page et tes annonces.", exemple: "French rose poudré" },
    lunettes: { titre: "Tes montures", un: "monture", plusieurs: "montures", rayon: "Montures à essayer", usage: "Tes clients les essaieront sur leur visage, depuis ta page et tes annonces.", exemple: "Écaille ronde" },
    mode: { titre: "Tes pièces", un: "pièce", plusieurs: "pièces", rayon: "Pièces à essayer", usage: "Tes clients les essaieront sur eux, depuis ta page et tes annonces.", exemple: "Blazer rose, du 36 au 44" },
    createur: { titre: "Tes créations", un: "création", plusieurs: "créations", rayon: "Créations", usage: "Tes clients les verront chez eux, depuis ta page et tes annonces.", exemple: "Bougie figue et cèdre" },
    librairie: { titre: "Tes livres", un: "livre", plusieurs: "livres", rayon: "Ses coups de cœur", usage: "Ce sont eux que « Ton prochain livre » conseillera à tes lecteurs. Photographie la couverture, et écris le titre et l’auteur.", exemple: "L’Anomalie — Hervé Le Tellier" },
    fleurs: { titre: "Tes bouquets", un: "bouquet", plusieurs: "bouquets", rayon: "Bouquets", usage: "Tes clients les verront chez eux, depuis ta page et tes annonces.", exemple: "Bouquet de pivoines" },
    table: { titre: "Tes plats", un: "plat", plusieurs: "plats", rayon: "La carte", usage: "Ils s’afficheront sur ta page et dans tes annonces.", exemple: "Magret frites maison" },
    bar: { titre: "Ta carte", un: "photo", plusieurs: "photos", rayon: "La carte", usage: "Elles s’afficheront sur ta page et dans tes annonces.", exemple: "Planche à partager" },
    seance: { titre: "Tes séances", un: "séance", plusieurs: "séances", rayon: "Séances", usage: "Elles s’afficheront sur ta page et dans tes annonces.", exemple: "Séance découverte d’une heure" },
  };
  return m[famille] ?? { titre: "Tes produits", un: "produit", plusieurs: "produits", rayon: "Ses produits", usage: "Ils s’afficheront sur ta page et dans tes annonces.", exemple: "Le produit du moment" };
}

// ═══ LA DÉMONSTRATION : DANS LE TÉLÉPHONE (navigateur) ═══════════════════════
const CLE = "clikme-vitrine-v1";
type Vitrines = Record<string, ArticleVitrine[]>;
export const VITRINES_VIDES: Vitrines = {};
let cache: Vitrines | null = null;
const abonnes = new Set<() => void>();

export function chargerVitrines(): Vitrines {
  if (cache) return cache;
  if (typeof window === "undefined") return VITRINES_VIDES;
  try {
    const v = JSON.parse(window.localStorage.getItem(CLE) ?? "{}") as Vitrines;
    cache = v && typeof v === "object" ? v : {};
  } catch {
    cache = {};
  }
  return cache;
}

export function abonnerVitrines(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}

function garder(v: Vitrines): string | null {
  cache = v;
  abonnes.forEach((f) => f());
  try {
    window.localStorage.setItem(CLE, JSON.stringify(v));
    return null;
  } catch {
    // LE STOCKAGE DU TÉLÉPHONE EST PLEIN (cinq mégaoctets en tout) : la
    // photo reste pour la visite, et on le dit.
    return "Le téléphone n’a plus de place pour garder cette photo après la visite.";
  }
}

/** Ajouter (ou remplacer) une photo dans la vitrine de ce commerce. */
export function poserDansVitrine(commerce: string, a: ArticleVitrine): string | null {
  const v = chargerVitrines();
  const liste = [a, ...(v[commerce] ?? []).filter((x) => x.id !== a.id)].slice(0, MAX_VITRINE);
  return garder({ ...v, [commerce]: liste });
}

export function retirerDeVitrine(commerce: string, id: string) {
  const v = chargerVitrines();
  garder({ ...v, [commerce]: (v[commerce] ?? []).filter((x) => x.id !== id) });
}

/**
 * SA CARTE, AVEC SA VITRINE DEVANT SON CATALOGUE — dans la démonstration. Ses
 * photos deviennent des articles : l'essayage les pose sur le client, « Ton
 * prochain livre » les conseille.
 */
export function avecSaVitrine<C extends CarteAutour | undefined>(c: C, vitrines: Vitrines, famille?: string): C {
  if (!c) return c;
  const liste = vitrines[c.id];
  if (!liste?.length) return c;
  const mots = motsDeLaVitrine(famille ?? familleDeBranche(c.branche, c.metier), c.metier);
  return {
    ...c,
    catalogue: [
      ...liste.map((a) => ({
        id: a.id,
        nom: a.nom,
        prix: a.prix,
        photo: a.photo,
        rayon: mots.rayon,
        // L'ESSAI REPRODUIT CE QU'IL A ÉCRIT SOUS SA PHOTO, pas un nom de prestation.
        ...(c.branche !== "librairie" ? { decrire: a.nom } : {}),
      })),
      ...(c.catalogue ?? []),
    ],
    // SES PHOTOS SONT LES SIENNES : plus de catalogue « proposé » par le métier.
    cataloguePropose: false,
  };
}

/** La famille d'une carte, pour ses mots — la même lecture que le double. */
function familleDeBranche(branche: string, metier?: string): string {
  const m = (metier ?? "").toLowerCase();
  if (/ongl|manucur/.test(m) || branche === "ongles") return "ongles";
  if (/coiff|barbier/.test(m) || branche === "coiffeur") return "coiffure";
  if (/tatou|tattoo/.test(m)) return "seance";
  if (branche === "librairie") return "librairie";
  if (branche === "lunetier") return "lunettes";
  if (branche === "mode") return "mode";
  if (branche === "fleuriste") return "fleurs";
  if (branche === "restaurant") return "table";
  if (branche === "bar") return "bar";
  if (branche === "artisan") return "createur";
  return "";
}
