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
import { toutesLesCartes, type CarteAutour } from "@/lib/direct/apercu-habitant";
import { carteDeDemo, estAdresseDeDemo } from "@/lib/site-internet/fiches-demo";
import { lireLeSite } from "@/lib/site-internet/fiche-du-site";
import { ficheDuDouble, type FicheDouble } from "@/lib/direct/double-chef";

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

export async function trouverLeCommerce(id: string): Promise<CommerceDuDouble | null> {
  const cle = String(id ?? "").trim();
  if (!cle) return null;
  const duPaquet = toutesLesCartes().find((c) => c.id === cle);
  if (duPaquet) return { carte: duPaquet, fiche: ficheDuDouble(duPaquet) };
  if (estAdresseDeDemo(cle)) {
    const c = carteDeDemo(cle);
    return c ? { carte: c, fiche: ficheDuDouble(c) } : null;
  }
  const r = recent.get(cle);
  if (r && Date.now() - r.quand < DUREE) return r.c;
  let c: CommerceDuDouble | null = null;
  try {
    const lu = await lireLeSite(cle);
    if (lu && lu.carte.branche === "restaurant") {
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
