// Configurateur de la maquette (SPEC §9) : enregistre la situation déclarée par
// le praticien + la brique mise en avant, et notifie Marius (SMS ; email en
// secours). Best-effort : la maquette affiche le résultat même si tout échoue.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/site-internet/accueil-sms";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim().slice(0, 40);

const AGENDA: Record<string, string> = { plein: "plein", remplir: "de la place" };
const SECRET: Record<string, string> = { oui: "oui", non: "répond lui-même" };
const PAIN: Record<string, string> = {
  interruption: "interruptions en séance",
  noshow: "RDV non honorés",
  sav: "SAV / documents",
  mauvais: "demandes hors champ",
};
const BRIQUE: Record<string, string> = {
  accueil: "l'accueil intelligent",
  sas: "le sas de qualification",
  hub: "l'espace patient",
  visib: "la visibilité",
};

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const agenda = s(p?.agenda);
  const secret = s(p?.secret);
  const pain = s(p?.pain);
  const brique = s(p?.brique);
  if (!slug || !agenda || !secret || !pain || !brique) {
    return NextResponse.json({ ok: false, error: "Champs requis manquants." }, { status: 400 });
  }

  const supabase = createAdminClient();
  let business = "";
  let ville = "";
  let activite = "";
  try {
    const { data: site } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city, activite")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (site as Record<string, unknown> | null) ?? null;
    business = s(row?.business_name);
    ville = s(row?.city);
    activite = s(row?.activite);
  } catch {
    /* best-effort */
  }

  // Enregistrement (table dédiée ; si non migrée, on ignore sans casser).
  try {
    await supabase.from("human_site_maquette_configs").insert({
      slug,
      business_name: business || null,
      agenda,
      secret,
      pain,
      brique,
      created_at: new Date().toISOString(),
    });
  } catch {
    /* table pas encore migrée → best-effort */
  }

  // Notification à Marius — l'or commercial : il sait sur quoi ouvrir en rappelant.
  const label = business ? `${business}${activite ? ` (${activite}${ville ? `, ${ville}` : ""})` : ""}` : slug;
  const msg =
    `⚙️ ${label} a configuré sa maquette.\n` +
    `Agenda : ${AGENDA[agenda] || agenda} · Secrétariat : ${SECRET[secret] || secret} · Douleur : ${PAIN[pain] || pain}\n` +
    `→ Mis en avant : ${BRIQUE[brique] || brique}`;

  const marius = String(process.env.SITE_NOTIFY_SMS || process.env.SITE_LETTER_PHONE || "").trim();
  if (marius) {
    try {
      await sendSms(marius, msg);
    } catch {
      /* best-effort */
    }
  }

  // Email en secours (réutilise la config Resend existante).
  const to = String(process.env.SITE_NOTIFY_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || "").trim();
  const key = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.RESEND_FROM || "Popey Academy <contact@popey.academy>").trim();
  if (to && key && from) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(key);
      await resend.emails.send({
        from,
        to,
        subject: `Maquette configurée — ${label}`,
        text: `${msg}\n\nMaquette : /site-internet/apercu/${slug}`,
      });
    } catch {
      /* best-effort */
    }
  }

  return NextResponse.json({ ok: true });
}
