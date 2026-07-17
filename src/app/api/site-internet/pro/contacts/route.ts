// Liste de contacts OPT-IN de l'Espace Pro (audience consentante du commerçant).
// Protégé par le jeton privé (?k=…), revalidé côté serveur. GARDE-FOU DÉONTO :
// réservé aux professions non réglementées (avis sollicitables) — refusé pour la
// santé encadrée / le droit, même avec un jeton valide. Aucun envoi ici : on ne
// fait que stocker/lister les destinataires (l'envoi reste natif via wa.me).
// Best-effort : si la table n'est pas migrée, on renvoie une liste vide sans casser.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { toE164 } from "@/lib/site-internet/phone";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const migrationMissing = (msg: string) => /does not exist|schema cache|Could not find/i.test(msg);

type Contact = {
  id: string;
  prenom: string | null;
  phone_e164: string;
  last_contacted_at: string | null;
  created_at: string;
  unsub_token: string;
};

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "list";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, activite")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();

  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Garde-fou déontologique (NON négociable) : pas de liste de recontact pour les
  // professions réglementées, même si l'UI l'affichait par erreur.
  const mp = resolveMetier(s(site.activite));
  if (!mp.def.avis_sollicitation) {
    return NextResponse.json({ error: "Non disponible pour cette profession." }, { status: 403 });
  }

  const siteId = s(site.id);
  let summary: Record<string, number> | null = null;

  if (action === "add") {
    // Consentement EXPLICITE requis : sans lui, on n'enregistre rien.
    if (p?.consent !== true) {
      return NextResponse.json({ error: "Le consentement du client est requis." }, { status: 400 });
    }
    const phone = toE164(s(p?.phone));
    if (!phone || phone.replace(/\D/g, "").length < 9) {
      return NextResponse.json({ error: "Numéro invalide." }, { status: 400 });
    }
    const prenomRaw = s(p?.prenom);
    const prenom = prenomRaw ? prenomRaw.slice(0, 80) : null;
    // Respect des désinscriptions : un numéro qui s'est retiré ne peut PAS être
    // rajouté en douce (on ne réécrit jamais opted_out_at à null).
    try {
      const { data: existing } = await supabase
        .from("human_site_contacts")
        .select("opted_out_at")
        .eq("site_id", siteId)
        .eq("phone_e164", phone)
        .maybeSingle();
      if (existing && (existing as Record<string, unknown>).opted_out_at) {
        return NextResponse.json(
          { error: "Ce numéro s'est désinscrit : il ne peut pas être rajouté." },
          { status: 409 }
        );
      }
    } catch {
      /* table non migrée → on laisse passer */
    }
    const { error } = await supabase.from("human_site_contacts").upsert(
      { site_id: siteId, prenom, phone_e164: phone, consent: true, source: "pro" },
      { onConflict: "site_id,phone_e164" }
    );
    if (error && !migrationMissing(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (action === "add_bulk") {
    // Import en masse (liste collée). Consentement global obligatoire.
    if (p?.consent !== true) {
      return NextResponse.json({ error: "Le consentement est requis." }, { status: 400 });
    }
    const raw = Array.isArray(p?.items) ? (p.items as unknown[]) : [];
    // Normalise + dédoublonne dans le lot.
    const seen = new Set<string>();
    const valid: Array<{ phone: string; prenom: string | null }> = [];
    let invalid = 0;
    for (const it of raw.slice(0, 1000)) {
      const o = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
      const phone = toE164(s(o.phone));
      if (!phone || phone.replace(/\D/g, "").length < 9) {
        invalid++;
        continue;
      }
      if (seen.has(phone)) continue;
      seen.add(phone);
      const pr = s(o.prenom).slice(0, 80);
      valid.push({ phone, prenom: pr || null });
    }

    let added = 0;
    let updated = 0;
    let optedOut = 0;
    if (valid.length) {
      const phones = valid.map((v) => v.phone);
      const existing = new Set<string>();
      const opted = new Set<string>();
      try {
        const { data: ex } = await supabase
          .from("human_site_contacts")
          .select("phone_e164, opted_out_at")
          .eq("site_id", siteId)
          .in("phone_e164", phones);
        if (Array.isArray(ex)) {
          for (const r of ex as Array<Record<string, unknown>>) {
            existing.add(s(r.phone_e164));
            if (r.opted_out_at) opted.add(s(r.phone_e164));
          }
        }
      } catch {
        /* table non migrée */
      }
      // On n'écrase JAMAIS une désinscription.
      const toInsert = valid.filter((v) => !opted.has(v.phone));
      optedOut = valid.length - toInsert.length;
      added = toInsert.filter((v) => !existing.has(v.phone)).length;
      updated = toInsert.length - added;
      if (toInsert.length) {
        const { error } = await supabase.from("human_site_contacts").upsert(
          toInsert.map((v) => ({ site_id: siteId, prenom: v.prenom, phone_e164: v.phone, consent: true, source: "pro" })),
          { onConflict: "site_id,phone_e164" }
        );
        if (error && !migrationMissing(error.message)) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }
    summary = { received: raw.length, added, updated, invalid, optedOut };
  } else if (action === "remove") {
    const id = s(p?.id);
    if (id) {
      await supabase.from("human_site_contacts").delete().eq("site_id", siteId).eq("id", id);
    }
  } else if (action === "touch") {
    // Journalise qu'un envoi WhatsApp a été ouvert pour ce contact (best-effort).
    const id = s(p?.id);
    if (id) {
      await supabase
        .from("human_site_contacts")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("site_id", siteId)
        .eq("id", id);
    }
  }

  // Liste courante (après mutation éventuelle).
  let contacts: Contact[] = [];
  try {
    const { data } = await supabase
      .from("human_site_contacts")
      .select("id, prenom, phone_e164, last_contacted_at, created_at, unsub_token")
      .eq("site_id", siteId)
      .is("opted_out_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (Array.isArray(data)) contacts = data as Contact[];
  } catch {
    /* table pas encore migrée → liste vide, la page reste fonctionnelle */
  }

  return NextResponse.json({ ok: true, contacts, summary }, { status: 200 });
}
