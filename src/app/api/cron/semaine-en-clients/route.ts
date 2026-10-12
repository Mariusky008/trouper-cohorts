// 🧾 LE SMS DU LUNDI — « votre semaine chez … : 23 essais, 6 mises de côté, 4 confirmées ».
//
// « Un commerçant ne paie pas des fonctions, il paie des clients. » Chaque
// lundi matin, chaque commerçant client reçoit sur son mobile ce que ClikMe lui
// a amené la semaine passée, avec le lien de son espace pour le détail. Les
// phrases sont celles de son espace (`semaine-en-clients.ts`).
//
// TROIS RÈGLES, DANS LE CODE :
//   • RIEN QUAND IL NE S'EST RIEN PASSÉ — un SMS « 0 essai » fait se désabonner ;
//   • UNE FOIS PAR SEMAINE AU PLUS — la semaine envoyée est notée sur sa fiche
//     (`metadata.semaine_sms`), un second déclenchement le même lundi ne renvoie rien ;
//   • PAS DE SECRET, PAS D'ENVOI — sans `CRON_SECRET` posé sur le serveur, la
//     route ne fait qu'un aperçu (et l'aperçu ne montre ni numéro ni lien).
//
// GET ?apercu=1 → les messages qui partiraient, sans rien envoyer.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { SITE_URL } from "@/lib/site-url";
import { semaineEnClients } from "@/lib/site-internet/compteurs-jour";
import { smsDeLaSemaine } from "@/lib/site-internet/semaine-en-clients";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { numeroReservations, proPhoneFrom } from "@/lib/site-internet/pro-phone";
import { isSmsConfigured, sendSms } from "@/lib/site-internet/accueil-sms";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const str = (v: unknown) => (v == null ? "" : String(v).trim());

/** « 2026-W42 » : la semaine ISO d'un instant, pour n'envoyer qu'une fois par semaine. */
function semaineIso(t: number): string {
  const d = new Date(t);
  const jour = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - jour + 3);
  const premierJeudi = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const n = 1 + Math.round(((d.getTime() - premierJeudi.getTime()) / 86_400_000 - 3 + ((premierJeudi.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(n).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const url = new URL(request.url);
  const apercu = url.searchParams.get("apercu") === "1" || !process.env.CRON_SECRET;
  const supabase = createAdminClient();
  const cle = semaineIso(Date.now());

  const { data, error } = await supabase
    .from("human_vitrine_sites")
    .select("id, slug, business_name, activite, city, address, pro_token, whatsapp_phone_e164, metadata, diagnostic")
    .eq("channel", "letter")
    .eq("est_client", true)
    .limit(1000);
  if (error) return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });

  const rapport = { semaine: cle, apercu, envoyes: 0, rien: 0, deja: 0, sansNumero: 0, echecs: 0, messages: [] as { nom: string; message: string }[] };
  for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
    const meta = (r.metadata && typeof r.metadata === "object" ? r.metadata : {}) as Record<string, unknown>;
    if (str(meta.semaine_sms) === cle) {
      rapport.deja++;
      continue;
    }
    const semaine = await semaineEnClients(str(r.id));
    // SON LIEN COURT, celui qu'il connaît : il ouvre son comptoir, où « Mes stats » l'attend.
    const lien = `${SITE_URL}/p/${encodeURIComponent(str(r.pro_token))}`;
    const message = semaine.mesure ? smsDeLaSemaine(str(r.business_name) || "vous", semaine, brancheDuMetier(str(r.activite)), lien) : null;
    if (!message) {
      rapport.rien++;
      continue;
    }
    // SON NUMÉRO À LUI : celui de son espace, sinon le mobile de sa fiche Google —
    // jamais celui de l'employé qui le remplace pendant ses congés.
    const { whatsapp_relais: _relais, ...sansRelais } = meta;
    void _relais;
    const tel = proPhoneFrom(r) || numeroReservations({ ...r, metadata: sansRelais });
    if (!tel || !str(r.pro_token)) {
      rapport.sansNumero++;
      continue;
    }
    if (apercu) {
      // L'APERÇU NE MONTRE NI SON NUMÉRO NI SON LIEN PRIVÉ.
      rapport.messages.push({ nom: str(r.business_name), message: message.replace(lien, "<lien de son espace>") });
      continue;
    }
    if (!isSmsConfigured()) {
      rapport.echecs++;
      continue;
    }
    const envoi = await sendSms(tel, message);
    if (!envoi.ok) {
      rapport.echecs++;
      continue;
    }
    rapport.envoyes++;
    await supabase.from("human_vitrine_sites").update({ metadata: { ...meta, semaine_sms: cle } }).eq("id", str(r.id));
  }
  return NextResponse.json(rapport);
}
