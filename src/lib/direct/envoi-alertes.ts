// L'ENVOI DES ALERTES — partagé entre le déclenchement et le filet quotidien.
//
// POURQUOI PAS UN CRON FRÉQUENT
//
// Une alerte est une RÉACTION À UN ÉVÉNEMENT, pas un balayage périodique.
// Interroger la base toutes les heures pour découvrir une place libérée il y a
// cinquante-cinq minutes, c'est déjà rater ce qu'on prétend annoncer — et le
// plan Vercel du projet n'autorise de toute façon qu'un cron quotidien, ce que
// tous les autres crons du dépôt respectent.
//
// Donc : l'alerte part au moment de la publication, via `after()` — après la
// réponse, pour ne pas faire attendre le commerçant qui vient de publier. Le
// cron quotidien reste comme FILET : il rattrape ce qu'un envoi raté aurait
// laissé passer. Aucun risque de doublon, `last_alerte_at` étant la même borne
// pour les deux chemins.
import { filDeVille } from "./publications";
import { alerteAEnvoyer, heureDans } from "./alertes";
import { configVille } from "./ville";
import { sendAlerte } from "@/lib/site-internet/ville-mail";
import type { PartnerOffer } from "@/lib/site-internet/collectif";

const str = (v: unknown) => (v == null ? "" : String(v));

// Les habitants sont français : leur heure locale est celle de Paris. Le jour où
// une ville sortira de ce fuseau, c'est ici qu'on ira chercher sa zone.
export const ZONE = "Europe/Paris";

type Supabase = { from: (t: string) => any }; // eslint-disable-line @typescript-eslint/no-explicit-any

type Abonne = {
  id: string;
  ville_slug: string;
  email: string;
  unsub_token: string;
  last_alerte_at: string | null;
  silence_avant: number;
  silence_apres: number;
};

export type Bilan = { abonnes: number; envoyes: number; sautes: number; skipped?: string };

/**
 * Envoie les alertes qui doivent l'être.
 *
 * `villeSlug` restreint à une ville : c'est le cas du déclenchement, où l'on
 * sait exactement qui vient de publier. Sans lui, on balaie toutes les villes —
 * c'est le filet quotidien.
 *
 * Ne décide rien : `alerteAEnvoyer` décide, cette fonction lit, applique et
 * note. Une règle d'envoi écrite au milieu d'une boucle ne se teste pas.
 */
export async function envoyerAlertes(supabase: Supabase, villeSlug?: string): Promise<Bilan> {
  const maintenant = Date.now();
  const heureLocale = heureDans(ZONE);

  let abonnes: Abonne[] = [];
  try {
    let q = supabase
      .from("human_habitants")
      .select("id, ville_slug, email, unsub_token, last_alerte_at, silence_avant, silence_apres")
      .not("confirmed_at", "is", null)
      .not("email", "is", null)
      .is("unsubscribed_at", null)
      .eq("recoit_alertes", true);
    if (villeSlug) q = q.eq("ville_slug", villeSlug);
    const { data, error } = await q.limit(5000);
    if (error) throw new Error(error.message);
    abonnes = (Array.isArray(data) ? data : []) as Abonne[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return { abonnes: 0, envoyes: 0, sautes: 0, skipped: "migration non appliquée" };
    }
    return { abonnes: 0, envoyes: 0, sautes: 0, skipped: "lecture impossible" };
  }

  if (!abonnes.length) return { abonnes: 0, envoyes: 0, sautes: 0 };

  // Le fil d'une ville se lit UNE fois, quel que soit le nombre d'abonnés.
  const parVille = new Map<string, Awaited<ReturnType<typeof filDeVille>>>();
  const nomVille = new Map<string, string>();
  for (const a of abonnes) {
    if (parVille.has(a.ville_slug)) continue;
    parVille.set(a.ville_slug, await filDeVille(supabase, a.ville_slug));
    nomVille.set(a.ville_slug, (await configVille(supabase, a.ville_slug)).nom);
  }

  let envoyes = 0;
  let sautes = 0;
  for (const a of abonnes) {
    const ville = nomVille.get(a.ville_slug) || "";
    const publications = parVille.get(a.ville_slug) ?? [];
    if (!ville || !publications.length) {
      sautes++;
      continue;
    }

    const urgentes = alerteAEnvoyer(
      publications,
      {
        derniereAlerteAt: a.last_alerte_at,
        heureLocale,
        silenceAvant: typeof a.silence_avant === "number" ? a.silence_avant : 9,
        silenceApres: typeof a.silence_apres === "number" ? a.silence_apres : 20,
      },
      maintenant
    );
    if (!urgentes) {
      sautes++;
      continue;
    }

    const offres: PartnerOffer[] = urgentes.map((p) => ({
      id: p.id,
      slug: p.auteurSlug,
      nom: p.auteurNom,
      metier: p.auteurMetier,
      texte: p.texte,
      photo: p.photo,
      publieLe: p.publieLe,
      jusqua: p.expireLe,
    }));

    const ok = await sendAlerte(a.email, ville, offres, str(a.unsub_token));
    if (!ok) {
      sautes++;
      continue;
    }
    // `last_alerte_at` n'avance QUE sur un envoi réussi : un échec Resend ne doit
    // pas faire sauter l'alerte suivante — c'est le canal urgent. C'est aussi
    // cette borne qui empêche le filet quotidien de renvoyer ce que le
    // déclenchement a déjà envoyé.
    await supabase
      .from("human_habitants")
      .update({ last_alerte_at: new Date().toISOString() })
      .eq("id", str(a.id));
    envoyes++;
  }

  return { abonnes: abonnes.length, envoyes, sautes };
}
