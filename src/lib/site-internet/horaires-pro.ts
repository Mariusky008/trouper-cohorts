// Les horaires que le COMMERÇANT a saisis, mis en forme pour son site public.
//
// LE BUG QUE CE MODULE CORRIGE : la page publique lisait `diagnostic.horaires`,
// c'est-à-dire ce que Google dit du commerce. Le commerçant, lui, saisit ses
// jours et ses plages dans son espace pro, où ils partent dans
// `human_site_availability`. Deux sources, et c'est celle qu'il ne contrôle pas
// qui s'affichait : il modifiait ses horaires, rien ne changeait sur son site,
// et rien ne le lui disait.
//
// Ses horaires l'emportent quand il en a saisi. Sinon on retombe sur Google —
// mieux vaut une information de seconde main qu'une section vide.

export type PlagePro = { weekday: number; start_min: number; end_min: number };
export type LigneHoraire = { jours: string; horaires: string };

// INDEXÉ PAR LA CONVENTION JAVASCRIPT — 0 = dimanche — parce que c'est ce que
// `weekday` contient : l'espace pro écrit ses plages avec `getDay()`. Un tableau
// commençant à lundi décalait TOUS les jours d'un cran : « lundi – vendredi »
// s'affichait « mardi – samedi », et le jour de fermeture désignait le mauvais.
const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// L'ordre d'AFFICHAGE, lui, commence le lundi : c'est ainsi qu'on lit des
// horaires de commerce. Les deux ordres coexistent, chacun nommé pour ce qu'il
// est — les confondre est précisément ce qui a produit le décalage.
const ORDRE_LECTURE = [1, 2, 3, 4, 5, 6, 0];

/** 570 → « 9 h 30 », 540 → « 9 h ». Les minutes ne s'écrivent que si elles
 *  existent : « 9 h 00 » se lit comme une heure d'ouverture de gare. */
export function minutesEnHeure(m: number): string {
  const h = Math.floor(m / 60);
  const mn = m % 60;
  return mn ? `${h} h ${String(mn).padStart(2, "0")}` : `${h} h`;
}

/**
 * Les plages d'un jour, dans l'ordre : « 9 h – 12 h, 14 h – 19 h ».
 *
 * Le tiret demi-cadratin et les espaces insécables, parce que c'est une plage
 * qui ne doit pas se couper en fin de ligne sur un téléphone.
 */
function plagesDuJour(plages: PlagePro[]): string {
  return plages
    .slice()
    .sort((a, b) => a.start_min - b.start_min)
    .map((p) => `${minutesEnHeure(p.start_min)} – ${minutesEnHeure(p.end_min)}`)
    .join(", ");
}

/**
 * Les sept jours, en regroupant les jours CONSÉCUTIFS identiques.
 *
 * « Lundi – Vendredi : 9 h – 19 h » plutôt que cinq lignes qui répètent la même
 * chose. Un tableau de sept lignes identiques se parcourt sans être lu, et la
 * seule ligne qui diffère — le samedi — s'y noie.
 *
 * Les jours FERMÉS apparaissent : « on est fermé le mercredi » est exactement
 * ce qu'un client vient vérifier, et l'absence de ligne ne le dit pas.
 */
export function horairesLisibles(plages: PlagePro[]): LigneHoraire[] {
  if (!plages.length) return [];

  const parJour = new Map<number, PlagePro[]>();
  for (const p of plages) {
    if (!Number.isFinite(p.weekday) || p.weekday < 0 || p.weekday > 6) continue;
    if (!(p.end_min > p.start_min)) continue;
    if (!parJour.has(p.weekday)) parJour.set(p.weekday, []);
    parJour.get(p.weekday)!.push(p);
  }
  if (!parJour.size) return [];

  const texte = (j: number) => {
    const p = parJour.get(j);
    return p && p.length ? plagesDuJour(p) : "Fermé";
  };

  const lignes: LigneHoraire[] = [];
  let debut = 0; // index dans ORDRE_LECTURE, pas un jour
  for (let i = 1; i <= 7; i++) {
    if (i < 7 && texte(ORDRE_LECTURE[i]) === texte(ORDRE_LECTURE[debut])) continue;
    const fin = i - 1;
    lignes.push({
      jours:
        debut === fin
          ? JOURS[ORDRE_LECTURE[debut]]
          : `${JOURS[ORDRE_LECTURE[debut]]} – ${JOURS[ORDRE_LECTURE[fin]]}`,
      horaires: texte(ORDRE_LECTURE[debut]),
    });
    debut = i;
  }
  return lignes;
}
