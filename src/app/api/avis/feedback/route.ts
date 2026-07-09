import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

// Instanciation PARESSEUSE : `new Resend` lève si la clé manque. Au chargement
// du module (build « collecting page data »), ça casserait TOUT le déploiement.
// On l'instancie à la requête → une clé absente ne bloque plus jamais le build.
let _resend: Resend | null = null;
const getResend = () => (_resend ??= new Resend(process.env.RESEND_API_KEY || ""));

function formatPhoneToE164(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "+33" + digits.slice(1);
  if (digits.startsWith("33") && digits.length === 11) return "+" + digits;
  if (digits.startsWith("330") && digits.length === 12) return "+33" + digits.slice(3);
  if (raw.startsWith("+") && digits.length >= 10) return "+" + digits;
  return null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const token = String(body.token || "").trim();
  const slug = String(body.slug || "").trim().toLowerCase();
  const message = String(body.message || "").trim();

  if (!token || !slug || !message) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: commerce } = await supabase
    .from("human_review_commercants")
    .select("id, nom, telephone, email, proprietaire")
    .eq("slug", slug)
    .maybeSingle();

  if (!commerce) return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });

  const { data: client } = await supabase
    .from("human_review_clients_finaux")
    .select("id, prenom, telephone, statut")
    .eq("lien_unique", token)
    .eq("commercant_id", commerce.id)
    .maybeSingle();

  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Sauvegarder l'avis négatif
  await supabase.from("human_review_avis_negatifs").insert({
    client_final_id: client.id,
    commercant_id: commerce.id,
    message,
  });

  // Mettre à jour le statut du client
  await supabase
    .from("human_review_clients_finaux")
    .update({ statut: "insatisfait", avis_prive: message })
    .eq("id", client.id);

  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "jdecapsulemavie@gmail.com";
  const messageTruncated = message.length > 200 ? message.slice(0, 200) + "…" : message;

  // ── Email vers l'admin ──
  try {
    await getResend().emails.send({
      from: "Trouper Avis <contact@popey.academy>",
      to: adminEmail,
      subject: `⚠️ Avis négatif — ${commerce.nom}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <h2 style="color:#dc2626;margin-bottom:8px">⚠️ Nouvel avis négatif</h2>
          <p style="color:#374151;margin-bottom:16px">
            <strong>${client.prenom}</strong> a laissé un retour négatif chez
            <strong>${commerce.nom}</strong>.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:16px">
            <p style="color:#7f1d1d;font-style:italic;margin:0">"${messageTruncated}"</p>
          </div>
          <table style="border-collapse:collapse;width:100%;font-size:14px;color:#374151">
            <tr><td style="padding:6px 0;color:#6b7280">Commerce</td><td style="padding:6px 0;font-weight:600">${commerce.nom}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Client</td><td style="padding:6px 0">${client.prenom}${client.telephone ? ` · ${client.telephone}` : ""}</td></tr>
            ${commerce.proprietaire ? `<tr><td style="padding:6px 0;color:#6b7280">Propriétaire</td><td style="padding:6px 0">${commerce.proprietaire}</td></tr>` : ""}
            ${commerce.telephone ? `<tr><td style="padding:6px 0;color:#6b7280">Tel. commerce</td><td style="padding:6px 0">${commerce.telephone}</td></tr>` : ""}
          </table>
          <a href="https://www.popey.academy/admin/humain/review-booster/avis-negatifs"
             style="display:inline-block;margin-top:20px;background:#1e293b;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
            Voir dans l'admin →
          </a>
        </div>
      `,
    });
  } catch (e) {
    console.error("[feedback] email admin error:", e);
  }

  // ── WhatsApp vers le commerçant ──
  const contentSidNotif = String(process.env.TWILIO_REVIEW_CONTENT_SID_NOTIF || "").trim();
  const merchantPhone = commerce.telephone ? formatPhoneToE164(commerce.telephone) : null;

  if (contentSidNotif && merchantPhone) {
    try {
      await supabase.from("human_whatsapp_outbound_queue").insert({
        phone_e164: merchantPhone,
        template_name: contentSidNotif,
        language_code: "fr",
        vars: [
          client.prenom,
          messageTruncated.slice(0, 150),
        ],
        quick_reply_payload: [],
        source: "review_booster_notif_negatif",
        metadata: {
          provider: "twilio",
          content_sid: contentSidNotif,
          commerce_nom: commerce.nom,
          client_prenom: client.prenom,
        },
        status: "queued",
        attempt_count: 0,
        max_attempts: 2,
        random_delay_ms: 0,
        not_before_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[feedback] whatsapp merchant error:", e);
    }
  }

  return NextResponse.json({ success: true });
}
