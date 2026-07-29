// « Suivre ce commerce » — inscription faite par le VISITEUR depuis le site public.
// Jusqu'ici seul le commerçant pouvait saisir des contacts : un visiteur qui
// laissait son numéro n'entrait dans aucune liste et ne pouvait pas se désinscrire.
// Cette route ouvre la porte manquante, dans la MÊME table opt-in que l'Espace Pro
// (une seule audience, un seul retrait via /site-internet/stop/[token]).
//
// Garde-fous :
//  • consentement explicite obligatoire (case décochée côté visiteur) ;
//  • on archive la phrase exacte acceptée + l'horodatage (preuve du consentement) ;
//  • déonto : refusé pour la santé encadrée et le droit, comme la route Espace Pro ;
//  • une désinscription ne peut jamais être annulée en douce par une réinscription.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { toE164 } from "@/lib/site-internet/phone";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const migrationMissing = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);

// ── Durcissement (route publique, sans jeton) ────────────────────────────────
// Trois filets complémentaires, du moins au plus coûteux :
//  1. pot de miel — un champ invisible que seuls les robots remplissent ;
//  2. limite par IP, en mémoire — bloque le martèlement depuis une même source
//     (par instance : imparfait en serverless, mais gratuit et immédiat) ;
//  3. plafond horaire par établissement, en base — le vrai garde-fou : même
//     réparti sur mille IP, un commerce ne gagne pas 200 abonnés en une heure.
const IP_MAX = 5;
const IP_WINDOW_MS = 10 * 60 * 1000;
const SITE_MAX_PER_HOUR = 40;
const ipHits = new Map<string, number[]>();

function ipThrottled(ip: string): boolean {
  if (!ip) return false;
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  // Ménage : la table ne doit pas grandir indéfiniment sur une instance longue.
  if (ipHits.size > 5000) ipHits.clear();
  if (hits.length >= IP_MAX) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for") || "";
  return (fwd.split(",")[0] || request.headers.get("x-real-ip") || "").trim();
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const slug = s(p?.slug);
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  // Pot de miel : champ invisible côté visiteur. Rempli = robot. On répond « ok »
  // pour ne pas lui apprendre qu'il a été repéré, mais on n'enregistre rien.
  if (s(p?.website)) return NextResponse.json({ ok: true });

  if (ipThrottled(clientIp(request))) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }

  // Consentement : sans lui, on n'enregistre rien. Jamais de case pré-cochée côté client.
  if (p?.consent !== true) {
    return NextResponse.json({ error: "Votre accord est nécessaire pour vous prévenir." }, { status: 400 });
  }

  const phone = toE164(s(p?.phone));
  if (!phone || phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ error: "Ce numéro ne semble pas valide." }, { status: 400 });
  }
  const prenom = s(p?.prenom).slice(0, 80);
  if (!prenom) return NextResponse.json({ error: "Votre prénom est nécessaire." }, { status: 400 });

  const consentText = s(p?.consentText).slice(0, 500) || null;
  const topics = Array.isArray(p?.topics)
    ? (p.topics as unknown[]).map((t) => s(t).slice(0, 40)).filter(Boolean).slice(0, 8)
    : [];

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, activite")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site) return NextResponse.json({ error: "Commerce introuvable." }, { status: 404 });

  // Garde-fou déontologique (NON négociable) : pas de liste de recontact pour les
  // professions réglementées, même si l'UI l'affichait par erreur.
  const mp = resolveMetier(s(site.activite));
  if (!mp.def.avis_sollicitation) {
    return NextResponse.json({ error: "Non disponible pour cette profession." }, { status: 403 });
  }

  const siteId = s(site.id);

  // Plafond horaire par établissement : un commerce ne gagne pas 40 abonnés en
  // une heure. Au-delà, c'est du bruit — on refuse sans rien enregistrer.
  try {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabase
      .from("human_site_contacts")
      .select("id", { count: "exact", head: true })
      .eq("site_id", siteId)
      .eq("source", "site")
      .gte("created_at", since);
    if (typeof count === "number" && count >= SITE_MAX_PER_HOUR) {
      return NextResponse.json({ error: "Trop d'inscriptions en peu de temps. Réessayez plus tard." }, { status: 429 });
    }
  } catch {
    /* table non migrée → le plafond ne s'applique pas, les autres filets restent */
  }

  // Respect des désinscriptions : un numéro retiré ne se réinscrit pas en douce.
  try {
    const { data: existing } = await supabase
      .from("human_site_contacts")
      .select("opted_out_at")
      .eq("site_id", siteId)
      .eq("phone_e164", phone)
      .maybeSingle();
    if (existing && (existing as Record<string, unknown>).opted_out_at) {
      return NextResponse.json(
        { error: "Ce numéro s'est désinscrit. Contactez directement le commerce pour revenir." },
        { status: 409 }
      );
    }
  } catch {
    /* table non migrée → best-effort */
  }

  // Les colonnes `topics` / `consent_text` / `consent_at` n'existent qu'après la
  // migration « follow ». Si elle n'est pas passée, on RÉESSAYE sans elles : mieux
  // vaut un abonné enregistré sans sa preuve de consentement qu'un abonné perdu
  // pendant qu'on lui affiche « c'est fait ».
  const base = { site_id: siteId, prenom, phone_e164: phone, consent: true, source: "site" };
  const full = {
    ...base,
    topics: topics.length ? topics : null,
    consent_text: consentText,
    consent_at: new Date().toISOString(),
  };
  const save = async (row: Record<string, unknown>) => {
    const { error } = await supabase.from("human_site_contacts").upsert(row, { onConflict: "site_id,phone_e164" });
    if (error) throw new Error(error.message);
  };
  try {
    await save(full);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (!migrationMissing(msg)) {
      return NextResponse.json({ error: "L'inscription n'a pas pu être enregistrée." }, { status: 500 });
    }
    try {
      await save(base);
    } catch (e2) {
      const m2 = e2 instanceof Error ? e2.message : "";
      // Table absente : on ne peut rien faire, mais on le DIT au lieu de laisser
      // croire à la personne qu'elle est abonnée.
      return NextResponse.json(
        { error: migrationMissing(m2) ? "Le service d'abonnement n'est pas encore actif ici." : "L'inscription n'a pas pu être enregistrée." },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
