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

// ═══ MA CARTE : SES LIGNES ET SES PRIX, SAISIS PAR LUI ═══════════════════════
//
// « Pour les restaurants avec la carte des menus, comment la rentre-t-il dans
// son admin ? Il faudrait le prévoir pour les restaurants, bars et tout
// commerce qui possède une carte, comme les coiffeurs (coupe, shampoing,
// massages…), onglerie, etc. Ce n'est pas pour les essayages, mais pour que ça
// arrive directement sur leur CARTE et PRIX, plutôt qu'avoir des photos
// recueillies sur leur fiche Google comme c'est le cas actuellement. »
//
// CE QU'IL SAISIT REMPLACE TOUT LE RESTE : la carte lue sur les photos Google,
// les pages du menu Google, les formules d'exemple du métier. C'est sa parole,
// à jour, et elle passe devant ce qu'on a deviné pour lui. Chez un vrai
// commerçant, elle part dans la colonne `services` — celle que la page lisait
// déjà en premier (voir `carteDepuisFiche`) ; dans la démonstration, elle reste
// dans ce téléphone, à côté de sa vitrine.

/** Une ligne de sa carte : « Plats · Magret frites maison · 19 € ». */
export type LigneCarte = { rubrique?: string; nom: string; prix?: string; detail?: string };

/** Une carte de restaurant tient en quatre-vingts lignes ; une grille de coiffeur en vingt. */
export const MAX_LIGNES_CARTE = 80;

export type MotsCarte = {
  /** « Ma carte », « Mes tarifs » */
  titre: string;
  /** Les rubriques qu'on lui propose pour commencer — il les renomme à son goût. */
  rubriques: string[];
  /** Une ligne d'exemple, pour les champs vides. */
  exemple: { nom: string; detail: string; prix: string };
};

/** LES MOTS DE SA CARTE, selon sa famille — un restaurant a une carte, un coiffeur des tarifs. */
export function motsDeLaCarte(famille: string, metier = ""): MotsCarte {
  if (famille === "seance" && /tatou|tattoo/i.test(metier))
    return { titre: "Mes tarifs", rubriques: ["Flashs", "Projets sur mesure"], exemple: { nom: "Flash petite taille", detail: "Jusqu’à 5 cm", prix: "80 €" } };
  const m: Record<string, MotsCarte> = {
    table: { titre: "Ma carte", rubriques: ["Entrées", "Plats", "Desserts", "Boissons"], exemple: { nom: "Magret frites maison", detail: "Sauce aux cèpes", prix: "19 €" } },
    bar: { titre: "Ma carte", rubriques: ["Cocktails", "Bières", "Vins", "À grignoter"], exemple: { nom: "Spritz maison", detail: "Apérol, prosecco, orange", prix: "8 €" } },
    coiffure: { titre: "Mes tarifs", rubriques: ["Coupes", "Couleur", "Soins", "Barbe"], exemple: { nom: "Coupe femme", detail: "Shampoing, coupe, brushing", prix: "35 €" } },
    ongles: { titre: "Mes tarifs", rubriques: ["Mains", "Pieds", "Nail art"], exemple: { nom: "Pose semi-permanent", detail: "Mains, couleur au choix", prix: "30 €" } },
    seance: { titre: "Mes tarifs", rubriques: ["Séances", "Forfaits"], exemple: { nom: "Massage relaxant", detail: "1 heure", prix: "60 €" } },
    lunettes: { titre: "Mes tarifs", rubriques: ["Montures", "Verres", "Services"], exemple: { nom: "Examen de vue", detail: "Sur rendez-vous", prix: "Offert" } },
    fleurs: { titre: "Mes tarifs", rubriques: ["Bouquets", "Compositions", "Événements"], exemple: { nom: "Bouquet de saison", detail: "Fleurs du jour", prix: "25 €" } },
    librairie: { titre: "Mes services", rubriques: ["Services"], exemple: { nom: "Commande d’un livre", detail: "Reçu en 48 h", prix: "Gratuit" } },
  };
  return m[famille] ?? { titre: "Mes tarifs", rubriques: ["Prestations"], exemple: { nom: "Prestation", detail: "Ce qu’elle comprend", prix: "20 €" } };
}

// ═══ LA DÉMONSTRATION : DANS LE TÉLÉPHONE (navigateur) ═══════════════════════
const CLE = "clikme-vitrine-v1";
/** Ses photos (`articles`) et sa carte saisie (`cartes`), par commerce. */
export type Vitrines = { articles: Record<string, ArticleVitrine[]>; cartes: Record<string, LigneCarte[]> };
export const VITRINES_VIDES: Vitrines = { articles: {}, cartes: {} };
let cache: Vitrines | null = null;
const abonnes = new Set<() => void>();

export function chargerVitrines(): Vitrines {
  if (cache) return cache;
  if (typeof window === "undefined") return VITRINES_VIDES;
  try {
    const v = JSON.parse(window.localStorage.getItem(CLE) ?? "{}") as Record<string, unknown>;
    // LA PREMIÈRE FORME NE GARDAIT QUE LES PHOTOS, rangées à la racine.
    const neuve = v && typeof v === "object" && "articles" in v;
    cache = neuve
      ? { articles: (v.articles as Vitrines["articles"]) ?? {}, cartes: (v.cartes as Vitrines["cartes"]) ?? {} }
      : { articles: (v as Vitrines["articles"]) ?? {}, cartes: {} };
  } catch {
    cache = { articles: {}, cartes: {} };
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
  const liste = [a, ...(v.articles[commerce] ?? []).filter((x) => x.id !== a.id)].slice(0, MAX_VITRINE);
  return garder({ ...v, articles: { ...v.articles, [commerce]: liste } });
}

export function retirerDeVitrine(commerce: string, id: string) {
  const v = chargerVitrines();
  garder({ ...v, articles: { ...v.articles, [commerce]: (v.articles[commerce] ?? []).filter((x) => x.id !== id) } });
}

/** Enregistrer toute sa carte d'un coup — il la publie comme il l'a écrite. */
export function poserLaCarte(commerce: string, lignes: LigneCarte[]): string | null {
  const v = chargerVitrines();
  return garder({ ...v, cartes: { ...v.cartes, [commerce]: lignes.slice(0, MAX_LIGNES_CARTE) } });
}

/**
 * SA CARTE, AVEC SA VITRINE DEVANT SON CATALOGUE — dans la démonstration. Ses
 * photos deviennent des articles : l'essayage les pose sur le client, « Ton
 * prochain livre » les conseille.
 */
export function avecSaVitrine<C extends CarteAutour | undefined>(c0: C, vitrines: Vitrines, famille?: string): C {
  if (!c0) return c0;
  const c = avecSaCarteSaisie(c0, vitrines.cartes[c0.id]);
  const liste = vitrines.articles[c.id];
  if (!liste?.length) return c as C;
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
  } as C;
}

/**
 * SA CARTE SAISIE REMPLACE SON CATALOGUE — lu sur photos, proposé par le
 * métier ou écrit pour la démonstration. Les pages du menu Google s'effacent
 * avec : elles disaient la même chose, en moins à jour.
 */
function avecSaCarteSaisie(c: CarteAutour, lignes?: LigneCarte[]): CarteAutour {
  if (!lignes?.length) return c;
  return {
    ...c,
    catalogue: lignes.map((l, i) => ({ id: `${c.id}-m${i}`, rayon: l.rubrique || undefined, nom: l.nom, prix: l.prix, detail: l.detail })),
    cataloguePropose: false,
    catalogueLuSurPhotos: false,
    photosCarte: undefined,
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
