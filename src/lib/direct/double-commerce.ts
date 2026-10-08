/**
 * 🔎 À QUI PARLE-T-ON ? — le restaurant derrière un identifiant de double.
 *
 * LE DOUBLE NE CONNAISSAIT QUE LA DÉMONSTRATION. Sa route cherchait la carte
 * dans le paquet écrit à la main : sur la page d'un vrai restaurant, elle ne
 * trouvait rien, et le double répondait par mots-clés avec une fiche vide.
 *
 * TROIS ENDROITS, DANS CET ORDRE :
 *
 *   1. le paquet de la démonstration (Chez Bergine, Le Bocal de Margot…) ;
 *   2. les adresses de démonstration de la page commerçant (`demo-restaurant`) ;
 *   3. la base : un vrai commerçant, lu par son adresse, avec ce qu'il a dit
 *      de lui dans son Espace Pro et sa voix s'il l'a donnée.
 *
 * TOUT EST RELU CÔTÉ SERVEUR, À CHAQUE FOIS. Le navigateur n'envoie qu'un
 * identifiant : jamais ce que le double sait, jamais la voix à utiliser.
 *
 * FICHIER SERVEUR.
 */
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import { carteDuPaquet } from "@/lib/direct/copies-presentation";
import { carteDeDemo, estAdresseDeDemo } from "@/lib/site-internet/fiches-demo";
import { lireLeSite } from "@/lib/site-internet/fiche-du-site";
import { ficheDuDouble, type FicheDouble } from "@/lib/direct/double-chef";
import { aUnDouble } from "@/lib/direct/double-metiers";

export type CommerceDuDouble = {
  carte: CarteAutour;
  fiche: FicheDouble;
  /** La ligne du vrai commerçant en base — absente pour la démonstration. */
  siteId?: string;
  /** Sa voix clonée, seulement s'il l'a donnée ET que son accord est daté. */
  voixClonee?: string;
};

/** Mémoire courte : une conversation relit la même fiche à chaque phrase. */
const recent = new Map<string, { quand: number; c: CommerceDuDouble | null }>();
const DUREE = 60_000;

/**
 * `frais` : relire la base sans la mémoire courte — c'est le commerçant qui
 * essaie son fantôme depuis son comptoir, juste après lui avoir appris
 * quelque chose : il doit l'entendre tout de suite.
 */
export async function trouverLeCommerce(id: string, { frais = false }: { frais?: boolean } = {}): Promise<CommerceDuDouble | null> {
  const cle = String(id ?? "").trim();
  if (!cle) return null;
  /* TOUS LES MÉTIERS ONT LEUR DOUBLE, pas seulement les restaurants — voir
     `double-metiers.ts`. Un événement n'en a pas : il n'y a personne derrière
     le comptoir à qui parler. */
  const duPaquet = carteDuPaquet(cle);
  if (duPaquet) return aUnDouble(duPaquet) ? { carte: duPaquet, fiche: ficheDuDouble(duPaquet) } : null;
  if (estAdresseDeDemo(cle)) {
    const c = carteDeDemo(cle);
    return c && aUnDouble(c) ? { carte: c, fiche: ficheDuDouble(c) } : null;
  }
  const r = recent.get(cle);
  if (r && !frais && Date.now() - r.quand < DUREE) return r.c;
  let c: CommerceDuDouble | null = null;
  try {
    const lu = await lireLeSite(cle);
    if (lu && aUnDouble(lu.carte)) {
      c = {
        carte: lu.carte,
        fiche: ficheDuDouble(lu.carte, lu.savoir),
        siteId: lu.siteId,
        voixClonee: lu.savoir.voixId || undefined,
      };
    }
  } catch {
    c = null;
  }
  recent.set(cle, { quand: Date.now(), c });
  if (recent.size > 200) recent.delete(recent.keys().next().value as string);
  return c;
}

/** À appeler quand sa voix ou sa fiche change : la phrase suivante relit la base. */
export function oublierLeCommerce(id: string): void {
  recent.delete(id);
}
