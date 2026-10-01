/**
 * 👻 LES DEUX COPAINS DU QUARTIER — qui un commerçant présente en ouvrant la ville.
 *
 * « Le menu du bas aurait "Explorer ma ville", qui amènerait sur la page de
 * l'app avec un petit twist : au départ, on aurait deux copains commerçants du
 * fantôme, que nous mettrions en fonction des synergies ; et si aucune offre,
 * alors ce sera au hasard ; et si c'est le seul commerçant de la ville, à la
 * place des deux fantômes, le même écran, avec "ils arrivent bientôt". »
 *
 * TROIS RÈGLES, DANS CET ORDRE :
 *   1. LES SYNERGIES : un salon de coiffure présente une onglerie et un
 *      institut, un restaurant présente un bar et un fleuriste — ceux chez qui
 *      on va AVANT ou APRÈS lui. Parmi eux, ceux qui ont une offre aujourd'hui
 *      passent devant.
 *   2. SINON, AU HASARD parmi les autres commerces de sa ville — tirage stable
 *      pour un même commerce un même jour, pour que la page ne change pas à
 *      chaque rechargement.
 *   3. PERSONNE D'AUTRE DANS SA VILLE : « ils arrivent bientôt ».
 *
 * CE QU'ON NE FAIT PAS : présenter des commerces d'une autre ville. Les
 * commerces de démonstration sont à Dax ; un commerçant de Bayonne voit donc
 * « ils arrivent bientôt », pas deux voisins qui n'existent pas chez lui.
 *
 * FICHIER PUR : il ne lit rien, il choisit dans ce qu'on lui donne.
 */
import type { CarteAutour, CleMetier } from "@/lib/direct/apercu-habitant";
import { tenueDu } from "@/lib/direct/double-metiers";

/** Chez qui on va avant ou après lui. Dans l'ordre de préférence. */
const SYNERGIES: Record<CleMetier, CleMetier[]> = {
  coiffeur: ["ongles", "mode", "artisan"],
  ongles: ["coiffeur", "mode", "artisan"],
  mode: ["coiffeur", "lunetier", "ongles"],
  lunetier: ["mode", "coiffeur"],
  restaurant: ["bar", "fleuriste", "artisan"],
  bar: ["restaurant", "mode"],
  fleuriste: ["restaurant", "artisan"],
  artisan: ["fleuriste", "mode", "restaurant"],
};

/** Ce que le bouton d'un copain promet, dans les mots de son métier. */
const BOUTON: Record<CleMetier, string> = {
  ongles: "Essayer sur mes ongles",
  coiffeur: "Essayer cette coupe",
  mode: "Essayer cette tenue",
  lunetier: "Essayer ces lunettes",
  restaurant: "Voir ce qu'on mange",
  bar: "Voir la soirée",
  fleuriste: "Voir les bouquets",
  artisan: "Découvrir l'atelier",
};

export type Copain = {
  id: string;
  nom: string;
  metier: string;
  /** La photo de sa carte, celle qui ouvre sa page. */
  photo: string;
  /** Son fantôme, dans la tenue de son métier. */
  fantome: string;
  /** Son offre du moment, s'il en a une : le titre, et ce qui l'accompagne. */
  offre?: string;
  detail: string;
  bouton: string;
};

const sansAccent = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

/** Le fantôme d'un commerce, dans la tenue de son métier. */
export function fantomeDe(c: Pick<CarteAutour, "branche" | "metier">): string {
  const t = tenueDu(c);
  return t ? `${t.dossier}accueil.webp` : "/clikme-fantome.png";
}

const aUneOffre = (c: CarteAutour) => c.moments.some((m) => m.titre);

function copainDe(c: CarteAutour): Copain {
  const m = c.moments.find((x) => x.titre);
  const photo = c.photoAccueil || c.photo || m?.photo || c.sesPhotos?.[0]?.src || "";
  return {
    id: c.id,
    nom: c.nom,
    metier: c.metier,
    photo,
    fantome: fantomeDe(c),
    offre: m?.titre,
    detail: [m?.prix, c.distance].filter(Boolean).join(" · "),
    bouton: BOUTON[c.branche] ?? "Découvrir",
  };
}

/** Un tirage stable : le même commerce, le même jour, les mêmes copains. */
function melanger<T>(liste: T[], graine: string): T[] {
  let h = 2166136261;
  for (const ch of graine) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const out = [...liste];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function choisirLesCopains(
  moi: Pick<CarteAutour, "id" | "branche" | "ville">,
  tous: CarteAutour[],
  jour = new Date().toISOString().slice(0, 10),
): Copain[] {
  const ville = sansAccent(moi.ville);
  const voisins = tous.filter((c) => c.id !== moi.id && sansAccent(c.ville) === ville && !c.prepare);
  if (!voisins.length) return [];
  const pris: CarteAutour[] = [];
  const prendre = (c?: CarteAutour) => {
    if (c && pris.length < 2 && !pris.some((x) => x.id === c.id || x.branche === c.branche)) pris.push(c);
  };
  // 1. LES SYNERGIES — avec une offre d'abord, puis sans.
  const ordre = SYNERGIES[moi.branche] ?? [];
  for (const avecOffre of [true, false]) {
    for (const b of ordre) {
      prendre(melanger(voisins, `${moi.id}${jour}${b}`).find((c) => c.branche === b && (!avecOffre || aUneOffre(c))));
    }
  }
  // 2. AU HASARD — ceux qui ont une offre d'abord, et jamais deux du même métier.
  const reste = melanger(voisins, `${moi.id}${jour}`).sort((a, b) => Number(aUneOffre(b)) - Number(aUneOffre(a)));
  for (const c of reste) if (c.branche !== moi.branche) prendre(c);
  for (const c of reste) prendre(c);
  return pris.map(copainDe);
}
