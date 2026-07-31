// Le digest quotidien d'une ville — « ce qui se passe aujourd'hui chez vos
// commerçants ».
//
// DEUX RÈGLES, et elles sont dans le code, pas dans la promesse marketing :
//   • un envoi par jour AU MAXIMUM (last_sent_at) ;
//   • JAMAIS d'e-mail vide — s'il n'y a rien de neuf depuis le dernier envoi,
//     on ne part pas. Un abonné qui reçoit un e-mail vide se désinscrit, et il a
//     raison.
//
// « Du neuf » se mesure sur la date de publication RÉELLE de l'annonce, pas sur
// sa présence : une annonce déjà envoyée hier et toujours en cours ne redéclenche
// pas un envoi.
//
// Premier envoi (aucun last_sent_at) : on prend les annonces des 7 derniers jours,
// pour que la personne qui vient de confirmer reçoive quelque chose d'utile plutôt
// qu'un premier e-mail vide.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { cityDirectory, type PartnerOffer } from "@/lib/site-internet/collectif";
import { digestAEnvoyer, sendDigest } from "@/lib/site-internet/ville-mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const str = (v: unknown) => (v == null ? "" : String(v));

type Abonne = {
  id: string;
  ville_slug: string;
  email: string;
  unsub_token: string;
  last_sent_at: string | null;
};

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = Date.now();

  let abonnes: Abonne[] = [];
  try {
    const { data, error } = await supabase
      .from("human_ville_abonnes")
      .select("id, ville_slug, email, unsub_token, last_sent_at")
      .not("confirmed_at", "is", null)
      .is("unsubscribed_at", null)
      .limit(5000);
    if (error) throw new Error(error.message);
    abonnes = (Array.isArray(data) ? data : []) as Abonne[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return NextResponse.json({ ok: true, skipped: "migration abonnés non appliquée" });
    }
    return NextResponse.json({ error: "Lecture des abonnés impossible." }, { status: 500 });
  }

  // Le catalogue d'une ville se lit UNE fois, quel que soit le nombre d'abonnés.
  const parVille = new Map<string, PartnerOffer[]>();
  const nomVille = new Map<string, string>();
  for (const a of abonnes) {
    if (parVille.has(a.ville_slug)) continue;
    const { ville, offers } = await cityDirectory(supabase, a.ville_slug);
    parVille.set(a.ville_slug, offers);
    nomVille.set(a.ville_slug, ville);
  }

  let envoyes = 0;
  let sautes = 0;
  for (const a of abonnes) {
    const ville = nomVille.get(a.ville_slug) || "";
    const offers = parVille.get(a.ville_slug) ?? [];
    if (!ville || offers.length === 0) {
      sautes++;
      continue;
    }

    // Rythme et « rien de neuf » : la décision est une fonction pure, testable.
    const neuf = digestAEnvoyer(offers, a.last_sent_at, now);
    if (!neuf) {
      sautes++;
      continue;
    }

    const ok = await sendDigest(a.email, ville, neuf, a.unsub_token);
    if (!ok) {
      sautes++;
      continue;
    }
    // `last_sent_at` n'avance QUE sur un envoi réussi : un échec Resend ne doit
    // pas faire sauter le digest du lendemain.
    await supabase
      .from("human_ville_abonnes")
      .update({ last_sent_at: new Date().toISOString() })
      .eq("id", str(a.id));
    envoyes++;
  }

  return NextResponse.json({ ok: true, abonnes: abonnes.length, envoyes, sautes });
}
