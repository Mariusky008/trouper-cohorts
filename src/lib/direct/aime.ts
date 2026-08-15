// CE QUE LES GENS AIMENT ICI.
//
// Trois raisons de venir, à la place d'une note sur cinq.
//
//   ❤️ Le magret du vendredi
//   📍 Le café en terrasse le matin
//   😋 La tarte aux pommes
//
// Une note dit « 4,6 » — un chiffre qu'on ne sait pas interpréter et qui ne
// donne envie de rien. Une raison dit ce qu'on vient chercher. C'est la seule
// chose que Google ne sait pas produire, parce qu'elle ne se demande pas dans
// un formulaire : elle se DÉDUIT de ce que les gens ont fait.
//
// RIEN N'EST INVENTÉ, ET C'EST LA RÈGLE QUI COMMANDE TOUT ICI. Chaque ligne est
// une annonce réelle de ce commerce, retenue parce qu'un nombre réel de
// personnes y ont réagi. En dessous du seuil, la section N'EXISTE PAS — elle ne
// s'affiche pas vide, elle ne s'affiche pas « bientôt ». C'est la règle de
// dégradation appliquée telle quelle : un commerce sans historique n'a pas
// encore de raisons à montrer, et le dire serait plus honnête que de les
// fabriquer.
//
// LE TEXTE N'EST PAS ÉCRIT PAR LES CLIENTS. Il vient des annonces du commerce.
// Rien à modérer, rien qui puisse déraper sur la page de quelqu'un.
import { REACTION_UI, estReaction, type Reaction } from "@/lib/direct/reactions";

const str = (v: unknown) => (v == null ? "" : String(v));

type Supabase = {
  from: (t: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/** En dessous, la ligne n'existe pas.
 *
 *  Trois personnes, c'est le moment où « les gens » commence à vouloir dire
 *  quelque chose. À une, on affiche l'avis d'une personne en prétendant parler
 *  d'une ville — et c'est précisément le mensonge qu'on reproche aux notes. */
export const SEUIL_AIME = 3;

/** Trois lignes, pas dix. Une liste de dix « ce que les gens aiment » redevient
 *  une carte de restaurant : on la parcourt sans la lire. */
export const MAX_AIME = 3;

export type Aime = {
  /** L'annonce d'où vient la ligne — pour pouvoir y renvoyer si elle est encore
   *  vivante. */
  publicationId: string;
  /** Ce qu'on affiche : « Le magret du vendredi ». */
  label: string;
  /** Le pictogramme de la réaction dominante : ❤️ n'a pas le même sens que 📍. */
  emoji: string;
  /** Combien de PERSONNES DISTINCTES, toutes réactions confondues.
   *
   *  Des personnes, pas des réactions : quelqu'un qui appuie « j'en veux » puis
   *  « j'y suis » est une seule personne. Compter les réactions gonflerait le
   *  chiffre de ceux qui aiment le plus — et c'est précisément ce nombre qui
   *  doit être vérifiable pour que la section vaille mieux qu'une note. */
  compte: number;
};

/**
 * Le titre court d'une annonce.
 *
 * « Garbure landaise, magret grillé — service jusqu'à 14 h » devient « Garbure
 * landaise ». On coupe à la première ponctuation forte : ce qui suit est
 * presque toujours une précision de circonstance (une heure, un prix, une
 * quantité), c'est-à-dire ce qui périme. La raison de venir, elle, ne périme
 * pas — et c'est elle qu'on veut garder.
 */
export function titreCourt(texte: string, max = 46): string {
  const t = str(texte).replace(/\s+/g, " ").trim();
  if (!t) return "";
  // La première coupure franche. Le point-virgule et le tiret cadratin comptent ;
  // le point simple aussi, mais pas celui de « 14 h 30 » ni d'une abréviation.
  const coupe = t.split(/\s*[,;:]\s*|\s+[—–]\s+|\.\s+/)[0].trim();
  const brut = coupe || t;
  if (brut.length <= max) return majuscule(brut);
  // Trop long : on coupe au dernier mot entier plutôt qu'au milieu d'un mot.
  const tronque = brut.slice(0, max);
  const espace = tronque.lastIndexOf(" ");
  return majuscule((espace > max * 0.6 ? tronque.slice(0, espace) : tronque).trim()) + "…";
}

function majuscule(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Ce que les gens aiment chez un commerce, déduit de leurs réactions.
 *
 * DEUX LECTURES, pas une par annonce : les réactions du commerce, puis le texte
 * des annonces retenues. Un commerce actif depuis un an a des centaines de
 * réactions et une trentaine d'annonces — compter d'abord, lire ensuite.
 *
 * Les annonces EXPIRÉES comptent, et c'est voulu : « le magret du vendredi »
 * est une raison de venir précisément parce qu'il revient. Ne garder que les
 * annonces vivantes ferait disparaître la section chaque lundi matin.
 *
 * Table absente ou vide : un tableau vide, et la section ne s'affiche pas.
 */
export async function ceQuOnAime(supabase: unknown, siteId: string, max = MAX_AIME): Promise<Aime[]> {
  if (!siteId) return [];
  const sb = supabase as Supabase;

  // ── 1. Les réactions de ce commerce, comptées par annonce ────────────────
  const parPub = new Map<string, { gens: Set<string>; parType: Map<Reaction, number> }>();
  try {
    const { data, error } = await sb
      .from("clik_reaction")
      .select("publication_id, type, habitant_id")
      .eq("site_id", siteId);
    if (error || !Array.isArray(data)) return [];
    for (const r of data as Record<string, unknown>[]) {
      const pub = str(r.publication_id);
      const type = str(r.type);
      // Une réaction posée sur le COMMERCE (sans annonce) ne désigne aucune
      // raison : elle ne peut pas produire une ligne « ce qu'on aime ici ».
      if (!pub || !estReaction(type)) continue;
      const e = parPub.get(pub) ?? { gens: new Set<string>(), parType: new Map<Reaction, number>() };
      // DES PERSONNES, PAS DES RÉACTIONS. Quelqu'un qui appuie « j'en veux »
      // puis « j'y suis » compte une fois : sinon le nombre affiché dépasse le
      // nombre de gens, et c'est le seul chiffre de cette section.
      e.gens.add(str(r.habitant_id));
      e.parType.set(type, (e.parType.get(type) ?? 0) + 1);
      parPub.set(pub, e);
    }
  } catch {
    return [];
  }

  const retenues = [...parPub.entries()]
    .filter(([, e]) => e.gens.size >= SEUIL_AIME)
    .sort((a, b) => b[1].gens.size - a[1].gens.size)
    .slice(0, max);
  if (!retenues.length) return [];

  // ── 2. Le texte des annonces retenues ────────────────────────────────────
  const textes = new Map<string, string>();
  try {
    const { data } = await sb
      .from("human_publications")
      .select("id, texte")
      .in("id", retenues.map(([id]) => id));
    for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
      textes.set(str(r.id), str(r.texte));
    }
  } catch {
    return [];
  }

  const out: Aime[] = [];
  for (const [pub, e] of retenues) {
    const label = titreCourt(textes.get(pub) ?? "");
    // Une annonce dont le texte a disparu ne produit pas de ligne : on ne
    // remplit pas le trou par « Une offre » — ce serait inventer une raison.
    if (!label) continue;
    // La réaction dominante donne le pictogramme. À égalité, l'ordre de
    // `REACTION_UI` tranche, pour que deux chargements ne changent pas l'icône.
    let dominante: Reaction | null = null;
    let meilleur = 0;
    for (const t of Object.keys(REACTION_UI) as Reaction[]) {
      const n = e.parType.get(t) ?? 0;
      if (n > meilleur) {
        meilleur = n;
        dominante = t;
      }
    }
    out.push({
      publicationId: pub,
      label,
      emoji: dominante ? REACTION_UI[dominante].emoji : "❤️",
      compte: e.gens.size,
    });
  }
  return out;
}
