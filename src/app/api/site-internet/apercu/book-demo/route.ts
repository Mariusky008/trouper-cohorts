// Réservation de démo depuis l'accueil intelligent de la maquette.
// Enregistre la demande (organisationnel uniquement : prénom, tél, créneau —
// AUCUNE donnée de santé) et notifie le vendeur, en best-effort : la
// confirmation s'affiche côté visiteur même si l'enregistrement/notif échoue.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim().slice(0, 200);

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const prenom = s(p?.prenom);
  const tel = s(p?.tel);
  const slot = s(p?.slot);
  const pourQui = s(p?.pourQui);
  const premiere = s(p?.premiere);
  if (!slug || !prenom || !tel || !slot) {
    return NextResponse.json({ ok: false, error: "Champs requis manquants." }, { status: 400 });
  }

  const supabase = createAdminClient();
  let business = "";
  let ville = "";
  try {
    const { data: site } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (site as Record<string, unknown> | null) ?? null;
    business = s(row?.business_name);
    ville = s(row?.city);
  } catch {
    /* best-effort */
  }

  // Enregistrement (table dédiée ; si non migrée, on ignore sans casser).
  try {
    await supabase.from("human_site_demo_bookings").insert({
      slug,
      business_name: business || null,
      prenom,
      tel,
      slot,
      pour_qui: pourQui || null,
      premiere: premiere || null,
      created_at: new Date().toISOString(),
    });
  } catch {
    /* table pas encore migrée → best-effort */
  }

  // Notification vendeur (email best-effort). On réutilise la config Resend
  // existante : destinataire = SITE_NOTIFY_EMAIL sinon ADMIN_NOTIFICATION_EMAIL ;
  // expéditeur = RESEND_FROM sinon l'adresse par défaut du projet.
  const to = String(process.env.SITE_NOTIFY_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || "").trim();
  const key = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.RESEND_FROM || "Popey Academy <contact@popey.academy>").trim();
  if (to && key && from) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(key);
      const label = business ? `${business}${ville ? ` (${ville})` : ""}` : slug;
      await resend.emails.send({
        from,
        to,
        subject: `Démo accueil réservée — ${label}`,
        text:
          `Un visiteur a testé l'accueil de la maquette « ${label} » et réservé un créneau de démo.\n\n` +
          `Créneau : ${slot}\nPrénom : ${prenom}\nTéléphone : ${tel}\n` +
          (pourQui ? `Pour : ${pourQui}\n` : "") +
          (premiere ? `Type : ${premiere}\n` : "") +
          `\nMaquette : /site-internet/apercu/${slug}`,
      });
    } catch {
      /* best-effort */
    }
  }

  return NextResponse.json({ ok: true });
}
