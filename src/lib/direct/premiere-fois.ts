// CE QU'ON N'EXPLIQUE QU'UNE FOIS.
//
// LE DÉFAUT QUE CE MODULE RÈGLE, RELEVÉ AU TEST : « quand on balaie à droite,
// les gens ne comprennent pas vraiment où ils arrivent ». C'est le geste
// central du produit — celui qui fait passer d'une annonce à une conversation
// — et il était deviné plutôt que compris. Un doigt animé sur la carte disait
// « ça se balaie » ; il ne disait pas ce que chaque côté fait.
//
// POURQUOI UNE SEULE FOIS, ET PAS UN RÉGLAGE. Une aide qu'on revoit à chaque
// ouverture devient un obstacle entre la personne et ce qu'elle est venue
// chercher ; une aide qu'on ne voit jamais ne sert à rien. On la montre au
// premier passage, et elle ne revient plus.
//
// CE N'EST PAS UN COMPTEUR D'USAGE. On n'enregistre pas ce que la personne
// fait : on note seulement qu'une explication a déjà été donnée, ce qui est la
// stricte information nécessaire pour ne pas la redonner.

const CLE = "clikme-vu-v1";

/**
 * ═══ LE MODE DÉMONSTRATION ═════════════════════════════════════════════════
 *
 * « Quand j'ouvre l'app, j'aimerais voir l'écran de démarrage que tu as fait à
 * chaque fois que j'ouvre l'app pour le moment ; on rectifiera plus tard en
 * l'enlevant une fois que j'aurai terminé les démos. »
 *
 * IL EST ÉCRIT POUR ÊTRE RETIRÉ, ET DE DEUX FAÇONS. Vider `TOUJOURS_REVOIR`
 * l'enlève pour tout le monde, définitivement, en une ligne et sans toucher à
 * la page. Poser `clikme-demo-v1 = "0"` dans le stockage l'enlève sur UN
 * téléphone, tout de suite, sans redéployer — c'est ce qui permet de montrer
 * l'application « comme un habitant la verra » au milieu d'une démonstration.
 *
 * LA RÈGLE EST POSÉE ICI ET NON AU POINT D'APPEL. Une condition en dur dans la
 * page aurait demandé de retrouver laquelle, dans quel composant, le jour où il
 * faudra la défaire.
 */
export const TOUJOURS_REVOIR = new Set<string>(["accueil"]);
const CLE_DEMO = "clikme-demo-v1";

/**
 * ═══ SOMMES-NOUS EN DÉMONSTRATION ? ════════════════════════════════════════
 *
 * EXPORTÉE PARCE QUE DEUX AUTRES ÉCRANS EN ONT BESOIN, et qu'ils doivent
 * répondre à la même question que celui-ci. Les deux annonces autonomes — le
 * relooking et la journée — ne reviennent normalement qu'une fois par jour ;
 * pendant une démonstration, c'est la règle qui les rend invisibles au deuxième
 * commerçant de la matinée.
 *
 * « Quand je quitte la page et que je reviens en recommençant tout depuis le
 * début, j'aimerais revoir les mêmes annonces pour refaire la démo à un nouveau
 * commerçant dans la même journée. »
 *
 * C'EST EXACTEMENT LA RÈGLE DE L'ÉCRAN D'OUVERTURE, et il n'y en aura donc
 * qu'une : en démonstration, ce qui a été vu l'a été POUR CETTE SESSION, pas
 * pour la journée. Rouvrir la page rend les trois d'un coup. Le jour où le mode
 * démonstration s'en va — `clikme-demo-v1 = "0"`, ou `TOUJOURS_REVOIR` vidé —
 * les annonces retrouvent leur règle du jour sans qu'on touche à leur code.
 */
export function enModeDemonstration(): boolean {
  if (typeof window === "undefined") return false;
  return enDemo();
}

function enDemo(): boolean {
  if (!TOUJOURS_REVOIR.size) return false;
  try {
    return window.localStorage.getItem(CLE_DEMO) !== "0";
  } catch {
    // STOCKAGE REFUSÉ : on garde le mode démonstration. Entre revoir un écran
    // qu'on connaît et ne jamais voir celui qui explique le geste central du
    // produit, le premier défaut est le moins cher.
    return true;
  }
}

/**
 * ═══ CE QU'ON A FERMÉ PENDANT CETTE SESSION, ET RIEN DE PLUS ══════════════
 *
 * SANS CETTE MÉMOIRE-LÀ, L'ÉCRAN DEVIENDRAIT IMPOSSIBLE À FERMER. Premier
 * jet : `marquerVu` ne faisait rien du tout pour les explications qui
 * reviennent. La page lit `!vus.includes("accueil")` pour décider de les
 * afficher — donc le balayage qui referme l'écran ne changeait plus rien, et
 * l'écran restait posé par-dessus l'application pour toujours. En voulant le
 * montrer à chaque ouverture, on l'aurait rendu définitif.
 *
 * ELLE VIT EN MÉMOIRE ET NON DANS LE TÉLÉPHONE, et c'est toute la différence :
 * fermer vaut pour cette visite, rouvrir l'application le remontre. Rien n'est
 * écrit, donc le jour où l'on retire le mode démonstration, son téléphone n'en
 * garde aucune trace qui ferait disparaître l'écran pour de bon.
 */
const fermesCetteSession = new Set<string>();

const abonnes = new Set<() => void>();
/**
 * LA MÊME RÉFÉRENCE TANT QUE RIEN NE CHANGE.
 *
 * `useSyncExternalStore` compare les instantanés par identité : rendre un
 * tableau neuf à chaque lecture ferait boucler le rendu à l'infini. Défaut déjà
 * payé sur ce projet, on ne le repaie pas.
 */
export const RIEN_VU: string[] = [];
let cache: string[] | null = null;

export function chargerVus(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return RIEN_VU;
  let lu: string[] = [];
  try {
    const brut = window.localStorage.getItem(CLE);
    lu = brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    lu = [];
  }
  if (enDemo()) {
    // CE QUI REVIENT À CHAQUE OUVERTURE N'EST « DÉJÀ VU » QUE SI ON VIENT DE LE
    // FERMER. Le filtre est posé à la lecture pour que les points d'appel de la
    // page continuent de s'écrire `!vus.includes(...)`, sans rien savoir d'ici.
    lu = lu.filter((x) => !TOUJOURS_REVOIR.has(x));
    for (const x of fermesCetteSession) if (!lu.includes(x)) lu.push(x);
  }
  cache = lu;
  return cache;
}

export function abonnerVus(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/**
 * Vrai si cette explication n'a jamais été donnée.
 *
 * À N'APPELER QUE HORS RENDU — dans un gestionnaire, jamais dans le corps d'un
 * composant. Sur le serveur il n'y a pas de stockage : cette fonction répond
 * donc « jamais vu » pendant le pré-rendu, et l'inverse sur le téléphone de
 * quelqu'un qui a déjà fermé l'aide. Deux HTML différents pour la même page —
 * React error #418, mesurée. Dans un rendu, on passe par l'instantané que
 * `useSyncExternalStore` fournit à partir de `chargerVus`.
 */
export function jamaisVu(quoi: string): boolean {
  return !chargerVus().includes(quoi);
}

/** On l'a montrée : elle ne reviendra pas — sauf en mode démonstration. */
export function marquerVu(quoi: string) {
  const v = chargerVus();
  if (v.includes(quoi)) return;
  if (enDemo() && TOUJOURS_REVOIR.has(quoi)) {
    // FERMÉE POUR CETTE VISITE, ET RIEN N'EST ÉCRIT. Voir `fermesCetteSession`.
    fermesCetteSession.add(quoi);
    cache = [...v, quoi];
    abonnes.forEach((f) => f());
    return;
  }
  cache = [...v, quoi];
  try {
    window.localStorage.setItem(CLE, JSON.stringify(cache));
  } catch {
    /* Stockage refusé : elle reviendra à la prochaine visite, tant pis. */
  }
  abonnes.forEach((f) => f());
}
