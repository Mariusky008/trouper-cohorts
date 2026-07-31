// Inscription aux annonces d'une ville.
//
// DOUBLE OPT-IN : cette route n'inscrit personne — elle enregistre une demande
// et envoie un lien de confirmation. Tant qu'il n'est pas cliqué, aucun digest
// ne part. C'est ce qui rend l'adresse défendable, et ce qui évite d'écrire à
// quelqu'un dont un tiers aurait saisi l'adresse.
//
// On répond la MÊME chose dans tous les cas de figure : sans ça, la route dirait
// à n'importe qui si une adresse est déjà inscrite dans une ville donnée.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cityDirectory } from "@/lib/site-internet/collectif";
import { consentPhrase, sendConfirmation, villeSlug } from "@/lib/site-internet/ville-mail";

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
  // des adresses pour un catalogue qui ne se remplira jamais.
  const { ville } = await cityDirectory(supabase, slug);
  if (!ville) return NextResponse.json({ error: "Aucun commerce n'est encore en ligne dans cette ville." }, { status: 404 });

  try {
    // Déjà inscrit·e ? On ne réécrit ni le consentement ni les jetons : on renvoie
    // simplement la confirmation si elle n'a jamais été validée.
    const { data: ex } = await supabase
      .from("human_ville_abonnes")
      .select("id, confirm_token, confirmed_at, unsubscribed_at")
      .eq("ville_slug", slug)
      .eq("email", email)
      .maybeSingle();
    const row = (ex as Record<string, unknown> | null) ?? null;

    if (row) {
      // Un retrait passé se respecte : se réinscrire demande un geste explicite,
      // et ce geste, c'est de recliquer le lien de confirmation.
      if (row.unsubscribed_at) {
        await supabase
          .from("human_ville_abonnes")
          .update({ unsubscribed_at: null, confirmed_at: null, consent_text: consentPhrase(ville), consent_at: new Date().toISOString() })
          .eq("id", s(row.id));
      }
      if (!row.confirmed_at || row.unsubscribed_at) {
        await sendConfirmation(email, ville, s(row.confirm_token));
      }
      return OK;
    }

    const { data: ins, error } = await supabase
      .from("human_ville_abonnes")
      .insert({
        ville,
        ville_slug: slug,
        email,
        consent_text: consentPhrase(ville),
        consent_at: new Date().toISOString(),
      })
      .select("confirm_token")
      .maybeSingle();
    if (error) throw new Error(error.message);

    const token = s((ins as Record<string, unknown> | null)?.confirm_token);
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
