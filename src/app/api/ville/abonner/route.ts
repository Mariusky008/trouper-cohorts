// Inscription au Direct d'une ville.
//
// DOUBLE OPT-IN : cette route n'inscrit personne — elle enregistre une demande
// et envoie un lien de confirmation. Tant qu'il n'est pas cliqué, aucun envoi ne
// part. C'est ce qui rend l'adresse défendable, et ce qui évite d'écrire à
// quelqu'un dont un tiers aurait saisi l'adresse.
//
// On répond la MÊME chose dans tous les cas de figure : sans ça, la route dirait
// à n'importe qui si une adresse est déjà inscrite dans une ville donnée.
//
// L'IDENTITÉ EST PROGRESSIVE. Une personne qui a déjà gardé des offres possède
// une ligne d'appareil, sans adresse. Donner son adresse doit se POSER sur cette
// ligne, pas en créer une seconde : ses gardées et ses commerces suivis sont
// déjà là, et les perdre au moment où elle nous fait confiance serait le pire
// moment possible.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cityDirectory } from "@/lib/site-internet/collectif";
import { consentPhrase, sendConfirmation, villeSlug } from "@/lib/site-internet/ville-mail";
import { habitantCourant, fusionner, poserCookie } from "@/lib/direct/habitant";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
// Volontairement permissif : le rôle de la validation est d'écarter les fautes de
// frappe évidentes, pas de trancher ce qu'est une adresse valide. La confirmation
// s'en charge — une adresse qui n'existe pas ne cliquera jamais.
const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const IP_MAX = 6;
const IP_WINDOW_MS = 10 * 60 * 1000;
const ipHits = new Map<string, number[]>();

function ipThrottled(ip: string): boolean {
  if (!ip) return false;
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (ipHits.size > 5000) ipHits.clear();
  if (hits.length >= IP_MAX) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

// Réponse unique : « regardez vos e-mails ». Elle ne révèle jamais l'état réel.
const OK = NextResponse.json({ ok: true });

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const slug = villeSlug(s(p?.ville).slice(0, 80));
  const email = s(p?.email).slice(0, 180).toLowerCase();
  if (!slug || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  if (p?.consent !== true) {
    return NextResponse.json({ error: "Votre accord est requis." }, { status: 400 });
  }

  const fwd = request.headers.get("x-forwarded-for") || "";
  const ip = (fwd.split(",")[0] || request.headers.get("x-real-ip") || "").trim();
  if (ipThrottled(ip)) return OK;

  const supabase = createAdminClient();

  // La ville doit EXISTER (au moins un commerce publié) : sinon on collecterait
  // des adresses pour un fil qui ne se remplira jamais.
  const { ville } = await cityDirectory(supabase, slug);
  if (!ville) {
    return NextResponse.json({ error: "Aucun commerce n'est encore en ligne dans cette ville." }, { status: 404 });
  }

  const consentement = { consent_text: consentPhrase(ville), consent_at: new Date().toISOString() };

  try {
    const surAppareil = await habitantCourant(supabase);

    const { data: ex } = await supabase
      .from("human_habitants")
      .select("id, device_token, confirm_token, confirmed_at, unsubscribed_at")
      .eq("ville_slug", slug)
      .eq("email", email)
      .maybeSingle();
    const parEmail = (ex as Record<string, unknown> | null) ?? null;

    if (parEmail) {
      const idEmail = s(parEmail.id);
      // Cette adresse est déjà connue ici. Si l'appareil portait une AUTRE ligne,
      // on la replie dans celle-ci : c'est la même personne, et ses gardées
      // doivent suivre.
      if (surAppareil && surAppareil.id !== idEmail) {
        await fusionner(supabase, surAppareil.id, idEmail);
      }
      await poserCookie(s(parEmail.device_token));

      // Un retrait passé se respecte : se réinscrire demande un geste explicite,
      // et ce geste, c'est de recliquer le lien de confirmation.
      if (parEmail.unsubscribed_at) {
        await supabase
          .from("human_habitants")
          .update({ unsubscribed_at: null, confirmed_at: null, recoit_resume: true, ...consentement })
          .eq("id", idEmail);
      }
      if (!parEmail.confirmed_at || parEmail.unsubscribed_at) {
        await sendConfirmation(email, ville, s(parEmail.confirm_token));
      }
      return OK;
    }

    // Adresse inconnue. Si l'appareil a déjà une ligne POUR CETTE VILLE,
    // l'adresse s'y pose ; sinon on en crée une nouvelle.
    //
    // On ne réécrit PAS `ville_slug` sur une ligne existante : la même personne
    // peut suivre deux villes depuis le même téléphone, et déplacer sa ligne
    // annulerait silencieusement son premier abonnement.
    if (surAppareil && surAppareil.villeSlug === slug) {
      const { data: maj, error } = await supabase
        .from("human_habitants")
        .update({
          email,
          ville,
          recoit_resume: true,
          // REMISE À ZÉRO DE LA CONFIRMATION. Sans elle, quelqu'un de déjà
          // confirmé qui change d'adresse verrait la NOUVELLE recevoir le
          // résumé du lendemain sans avoir jamais cliqué : le double opt-in
          // sauté par une porte dérobée. Et un désabonné n'aurait jamais pu
          // revenir, la page de confirmation ne levant le retrait que si la
          // confirmation est nulle.
          confirmed_at: null,
          unsubscribed_at: null,
          ...consentement,
        })
        .eq("id", surAppareil.id)
        .select("confirm_token")
        .maybeSingle();
      if (error) throw new Error(error.message);
      const token = s((maj as Record<string, unknown> | null)?.confirm_token);
      if (token) await sendConfirmation(email, ville, token);
      return OK;
    }

    const { data: ins, error } = await supabase
      .from("human_habitants")
      .insert({ ville, ville_slug: slug, email, recoit_resume: true, ...consentement })
      .select("device_token, confirm_token")
      .maybeSingle();
    if (error) throw new Error(error.message);

    const row = (ins as Record<string, unknown> | null) ?? null;
    await poserCookie(s(row?.device_token));
    const token = s(row?.confirm_token);
    if (token) await sendConfirmation(email, ville, token);
    return OK;
  } catch (e) {
    // Table absente (migration non appliquée) : on le DIT, plutôt que d'afficher
    // « c'est fait » à quelqu'un qui ne recevra jamais rien.
    const msg = e instanceof Error ? e.message : "";
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return NextResponse.json({ error: "L'inscription n'est pas encore ouverte. Réessayez bientôt." }, { status: 503 });
    }
    return NextResponse.json({ error: "Inscription impossible pour le moment." }, { status: 500 });
  }
}
