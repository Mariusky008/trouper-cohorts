// Les alertes de dernière minute.
//
// Ce cron n'a AUCUNE règle à lui : toutes les décisions vivent dans
// `alerteAEnvoyer`, une fonction pure et testée. Il lit, il applique, il note.
// C'est délibéré — une règle d'envoi écrite au milieu d'une boucle de cron ne se
// teste pas, et c'est le genre de code qu'on n'ose plus toucher.
//
// Il tourne souvent (toutes les heures) parce qu'une place libre ne prévient
// pas. Le rythme réel est tenu par la fonction, pas par la fréquence du cron :
// tourner plus souvent ne fait pas partir plus de messages.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { filDeVille } from "@/lib/direct/publications";
import { alerteAEnvoyer, heureDans } from "@/lib/direct/alertes";
import { configVille } from "@/lib/direct/ville";
import { sendAlerte } from "@/lib/site-internet/ville-mail";
import type { PartnerOffer } from "@/lib/site-internet/collectif";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const str = (v: unknown) => (v == null ? "" : String(v));

// Les habitants sont français : leur heure locale est celle de Paris. Le jour où
// une ville sortira de ce fuseau, c'est ici qu'on ira chercher sa zone.
const ZONE = "Europe/Paris";

type Abonne = {
  id: string;
  ville_slug: string;
  email: string;
  unsub_token: string;
  last_alerte_at: string | null;
  silence_avant: number;
  silence_apres: number;
};

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const maintenant = Date.now();
  const heureLocale = heureDans(ZONE);

  let abonnes: Abonne[] = [];
  try {
    const { data, error } = await supabase
      .from("human_habitants")
      .select("id, ville_slug, email, unsub_token, last_alerte_at, silence_avant, silence_apres")
      .not("confirmed_at", "is", null)
      .not("email", "is", null)
      .is("unsubscribed_at", null)
      .eq("recoit_alertes", true)
      .limit(5000);
    if (error) throw new Error(error.message);
    abonnes = (Array.isArray(data) ? data : []) as Abonne[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return NextResponse.json({ ok: true, skipped: "migration non appliquée" });
    }
    return NextResponse.json({ error: "Lecture des abonnés impossible." }, { status: 500 });
  }

  if (!abonnes.length) return NextResponse.json({ ok: true, abonnes: 0, envoyes: 0 });

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
    // pas faire sauter l'alerte suivante — c'est le canal urgent.
    await supabase
      .from("human_habitants")
      .update({ last_alerte_at: new Date().toISOString() })
      .eq("id", str(a.id));
    envoyes++;
  }

  return NextResponse.json({ ok: true, abonnes: abonnes.length, envoyes, sautes, heureLocale });
}
