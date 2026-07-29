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

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const slug = s(p?.slug);
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

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

  const { error } = await supabase.from("human_site_contacts").upsert(
    {
      site_id: siteId,
      prenom,
      phone_e164: phone,
      consent: true,
      source: "site",
      topics: topics.length ? topics : null,
      consent_text: consentText,
      consent_at: new Date().toISOString(),
    },
    { onConflict: "site_id,phone_e164" }
  );
  if (error && !migrationMissing(error.message)) {
    return NextResponse.json({ error: "L'inscription n'a pas pu être enregistrée." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
