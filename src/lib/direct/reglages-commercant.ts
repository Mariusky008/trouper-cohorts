// CE QU'IL PRÉFÈRE, LUI — et ça ne dépend ni du commerce ni du jour.
//
// ─── LA VOIX SE COUPE ─────────────────────────────────────────────────────
//
// « Je veux pouvoir couper la voix si je veux et utiliser juste l'écriture
// aussi pour aller plus vite si j'en ai envie. »
//
// C'est la bonne réponse à une question qu'on s'était posée autrement. On avait
// débattu de SUPPRIMER la voix pour gagner du rythme, et conclu qu'il fallait
// la garder : c'est le seul « wahou » de cet écran, et sans elle on retombe sur
// une messagerie. Mais ce n'était pas à nous de trancher pour tout le monde et
// pour toujours : la voix impressionne le commerçant à qui l'on fait la
// démonstration, et elle ralentit celui qui s'en sert tous les jours. Les deux
// sont vrais, à deux moments différents.
//
// CE QU'ON GAGNE À LA COUPER, ET C'EST MESURABLE : sa phrase n'est plus DITE,
// donc plus attendue. Une réponse de huit mots prend deux secondes et demie à
// prononcer, et le micro ne se rouvre qu'à la fin. Coupée, la bulle s'affiche
// dès que la réponse arrive et il peut reparler tout de suite.
//
// ─── POURQUOI UN FICHIER À PART ───────────────────────────────────────────
//
// Ce réglage n'est pas celui d'un commerce ni celui d'un jour : c'est le sien.
// Le mettre dans le fil de la journée l'aurait rendu per-commerce en
// démonstration — il aurait recoupé la voix six fois, une par métier.

const CLE = "clikme.reglages.v1";

export type Reglages = {
  /** Vrai quand Léa n'utilise que l'écrit. Sa voix ne part pas du tout. */
  voixCoupee: boolean;
};

/** Le réglage par défaut est une CONSTANTE — un objet neuf ferait boucler React. */
export const REGLAGES_PAR_DEFAUT: Reglages = { voixCoupee: false };
let cache: Reglages | null = null;

export function reglages(): Reglages {
  if (typeof window === "undefined") return REGLAGES_PAR_DEFAUT;
  if (cache) return cache;
  try {
    const brut = window.localStorage.getItem(CLE);
    const v = brut ? (JSON.parse(brut) as Partial<Reglages>) : null;
    cache = { voixCoupee: v?.voixCoupee === true };
  } catch {
    cache = REGLAGES_PAR_DEFAUT;
  }
  return cache;
}

export function enregistrerReglages(r: Reglages) {
  cache = r;
  try {
    window.localStorage.setItem(CLE, JSON.stringify(r));
  } catch {
    /* Quota plein : on garde en mémoire, l'écran continue. */
  }
}
