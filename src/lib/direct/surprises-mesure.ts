// 🎁 CE QUE LES SURPRISES DEVIENNENT — la seule mesure qui dira si le Fantôme
// paraît intelligent ou bavard.
//
// UNE LIGNE PAR GESTE, DANS LA TABLE ANONYME DU PARCOURS (`apercu_parcours`,
// événement « surprise ») : trouvée, ouverte, ❤️, 👎, « Voir », « Pourquoi
// moi ? », « Ne plus me proposer ». Le `contexte` porte quatre mots, écrits par
// le code et jamais par la personne : le geste, la sorte de raison (dit /
// crois / va-avec), la pièce, la ville. La `valeur` est le score.
//
// CE QU'ON NE GARDE PAS, ET C'EST VOULU : ni ce qu'était la surprise, ni chez
// quel commerçant, ni qui l'a reçue. Le jeton de session meurt avec l'onglet
// (voir la migration du parcours). On compte des raisons, on ne suit personne.
//
// FICHIER PARTAGÉ : le téléphone écrit avec `contexteDe`, le tableau de bord
// relit avec `lireContexte` et additionne avec `agreger`.
import { PIECES, type ClePiece } from "@/lib/direct/maison";
import { SORTES_DE_RAISON, type SorteDeRaison } from "@/lib/direct/surprises";

export type GesteDeSurprise = "trouvee" | "vue" | "aime" | "bof" | "voir" | "pourquoi" | "refus";
export const GESTES: GesteDeSurprise[] = ["trouvee", "vue", "aime", "bof", "voir", "pourquoi", "refus"];

const CLES = new Set<string>(PIECES.map((p) => p.cle));
/** La démonstration se compte à part : ses habitants ne sont pas de vrais habitants. */
export const DEMO = "demo";

/**
 * QUATRE MOTS, QUARANTE SIGNES AU PLUS — la borne de la route. La ville passe
 * en dernier : coupée si son nom est long, elle reste reconnaissable.
 */
export function contexteDe(geste: GesteDeSurprise, sorte: SorteDeRaison | undefined, piece: ClePiece, ville: string | null): string {
  const v = (ville || DEMO).toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 15).replace(/-+$/, "") || DEMO;
  return `${geste} ${sorte ?? "dit"} ${piece} ${v}`.slice(0, 40);
}

export type GesteLu = { geste: GesteDeSurprise; sorte: SorteDeRaison; piece: ClePiece; ville: string };

/** Relire une ligne. Ce qui n'a pas la forme attendue est ignoré, jamais deviné. */
export function lireContexte(contexte: unknown): GesteLu | null {
  const [geste, sorte, piece, ville] = String(contexte ?? "").split(" ");
  if (!GESTES.includes(geste as GesteDeSurprise)) return null;
  if (!SORTES_DE_RAISON.includes(sorte as SorteDeRaison)) return null;
  if (!CLES.has(piece)) return null;
  return { geste: geste as GesteDeSurprise, sorte: sorte as SorteDeRaison, piece: piece as ClePiece, ville: ville || DEMO };
}

export type Compte = Record<GesteDeSurprise, number>;
const zero = (): Compte => ({ trouvee: 0, vue: 0, aime: 0, bof: 0, voir: 0, pourquoi: 0, refus: 0 });

export type Agregat = {
  total: Compte;
  parSorte: Record<SorteDeRaison, Compte>;
  parPiece: Record<ClePiece, Compte>;
  /** Pièce × sorte : « au Dressing, est-ce que « va avec » tient mieux que « je crois » ? » */
  croise: Record<string, Compte>;
  villes: string[];
};

/** Additionner, avec un filtre de ville (`null` : toutes les vraies villes, sans la démonstration). */
export function agreger(lignes: { contexte?: unknown }[], ville: string | null): Agregat {
  const total = zero();
  const parSorte = Object.fromEntries(SORTES_DE_RAISON.map((s) => [s, zero()])) as Record<SorteDeRaison, Compte>;
  const parPiece = Object.fromEntries(PIECES.map((p) => [p.cle, zero()])) as Record<ClePiece, Compte>;
  const croise: Record<string, Compte> = {};
  const villes = new Set<string>();
  for (const l of lignes) {
    const g = lireContexte(l.contexte);
    if (!g) continue;
    villes.add(g.ville);
    if (ville === null ? g.ville === DEMO : g.ville !== ville) continue;
    total[g.geste]++;
    parSorte[g.sorte][g.geste]++;
    parPiece[g.piece][g.geste]++;
    (croise[`${g.piece}|${g.sorte}`] ??= zero())[g.geste]++;
  }
  return { total, parSorte, parPiece, croise, villes: [...villes].sort() };
}

/** Un taux, ou rien quand il n'y a pas de quoi le calculer. */
export const taux = (n: number, sur: number) => (sur > 0 ? n / sur : null);

/** En dessous, on montre les chiffres mais on ne conclut pas. */
export const AVIS_MIN = 10;
