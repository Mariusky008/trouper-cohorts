// « Demander l'activation Pro » depuis l'Action Flash de la maquette.
// On n'active rien et on ne facture rien : on enregistre une INTENTION
// commerciale (quel commerce, quelles options, quelle annonce, quand) et on
// prévient le vendeur. Best-effort de bout en bout : la confirmation s'affiche
// côté commerçant même si l'enregistrement ou la notification échoue.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug, 120);
  const options = s(p?.options, 200);
  const annonce = s(p?.annonce, 500);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Commerce inconnu." }, { status: 400 });
  }

  const supabase = createAdminClient();
  let business = "";
  let ville = "";
  let tel = "";
  try {
    const { data: site } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city, whatsapp_phone_e164")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (site as Record<string, unknown> | null) ?? null;
    business = s(row?.business_name);
    ville = s(row?.city);
    tel = s(row?.whatsapp_phone_e164, 40);
  } catch {
    /* best-effort */
  }

  // Enregistrement (table dédiée ; si non migrée, on ignore sans casser).
  try {
    await supabase.from("human_site_pro_interests").insert({
      slug,
      business_name: business || null,
      city: ville || null,
      phone: tel || null,
      options: options || null,
      annonce: annonce || null,
      created_at: new Date().toISOString(),
    });
  } catch {
    /* table pas encore migrée → best-effort */
  }

  // Notification vendeur (même configuration Resend que les autres routes aperçu).
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
        subject: `Demande d'activation Pro — ${label}`,
        text:
          `${label} a demandé l'activation des options Pro depuis l'Action Flash de sa maquette.\n\n` +
          `Options demandées : ${options || "(non précisées)"}\n` +
          (tel ? `Téléphone connu : ${tel}\n` : "") +
          (annonce ? `\nAnnonce rédigée :\n${annonce}\n` : "") +
          `\nRien n'a été activé ni facturé : à rappeler pour présenter les conditions.\n` +
          `Maquette : /site-internet/apercu/${slug}`,
      });
    } catch {
      /* best-effort */
    }
  }

  return NextResponse.json({ ok: true });
}
