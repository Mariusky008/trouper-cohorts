// ☀️ LA PROPOSITION DU MATIN, SUR SON WHATSAPP — voir `lib/direct/proposition-matin.ts`.
//
// Chaque matin, aux seuls commerçants qui l'ont demandé (« 📲 Me l'envoyer
// chaque matin sur WhatsApp », sur leur comptoir) : sa proposition du jour, et
// le lien de son comptoir, où il n'a plus qu'à dire « oui ».
//
// JAMAIS À QUELQU'UN QUI NE L'A PAS DEMANDÉ : la liste ne lit que les fiches
// où il a allumé l'interrupteur. Un prospect qui a reçu une lettre n'en reçoit
// aucun.
//
// RIEN NE PART SANS SON MODÈLE. WhatsApp n'autorise un premier message du
// matin que par un modèle approuvé (Twilio Content). Variables attendues :
//   {{1}} = le nom du commerce
//   {{2}} = la proposition, en une ligne (« Le pull mohair marine »)
//   {{3}} = le lien de son comptoir
// Sans `TWILIO_PROPOSITION_CONTENT_SID`, la route ne fait rien et le dit.
import { NextResponse } from "next/server";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { SITE_URL } from "@/lib/site-url";
import { jourParis } from "@/lib/jour-paris";
import { proPhoneFrom } from "@/lib/site-internet/pro-phone";
import { paysDuCommerce } from "@/lib/site-internet/pays";
import { piecesDuDiagnostic } from "@/lib/site-internet/pieces-comptoir";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { familleDuDouble } from "@/lib/direct/double-metiers";
import { avecLaPiece, etatDuDiagnostic, etatDuJour, propositionDuJour } from "@/lib/direct/proposition-matin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const s = (v: unknown) => String(v ?? "").trim();

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountSid = s(process.env.TWILIO_ACCOUNT_SID);
  const authToken = s(process.env.TWILIO_AUTH_TOKEN);
  const from = s(process.env.TWILIO_WHATSAPP_FROM) || "whatsapp:+14155238886";
  const contentSid = s(process.env.TWILIO_PROPOSITION_CONTENT_SID);
  if (!accountSid || !authToken || !contentSid) {
    return NextResponse.json({ skipped: true, reason: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ou TWILIO_PROPOSITION_CONTENT_SID manquants" });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("human_vitrine_sites")
    .select("id, slug, business_name, activite, city, address, pro_token, whatsapp_phone_e164, metadata, diagnostic")
    .eq("channel", "letter")
    .eq("diagnostic->proposition_matin->>whatsapp", "true")
    .not("pro_token", "is", null)
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const client = twilio(accountSid, authToken);
  const aujourdhui = jourParis();
  let envoyes = 0;
  const sautes: Record<string, number> = {};
  const saute = (r: string) => (sautes[r] = (sautes[r] ?? 0) + 1);

  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
    const etat0 = etatDuJour(etatDuDiagnostic(diag), aujourdhui);
    if (!etat0.whatsapp) continue;
    if (etat0.notifieLe === aujourdhui) {
      saute("deja");
      continue;
    }
    const telephone = proPhoneFrom(row);
    if (!telephone) {
      saute("sans-numero");
      continue;
    }
    const activite = s(row.activite);
    const famille = familleDuDouble({ branche: brancheDuMetier(activite), metier: activite });
    const proposition = propositionDuJour({ famille, pieces: piecesDuDiagnostic(diag), etat: etat0, pays: paysDuCommerce(row) });
    if (!proposition) {
      saute("rien");
      continue;
    }
    const ligne = (proposition.piece?.nom ?? proposition.phrase).replace(/\s+/g, " ").slice(0, 120);
    try {
      await client.messages.create({
        from,
        to: `whatsapp:${telephone}`,
        contentSid,
        contentVariables: JSON.stringify({ "1": s(row.business_name), "2": ligne, "3": `${SITE_URL}/p/${s(row.pro_token)}` }),
      });
      envoyes++;
    } catch (e) {
      console.error(`[proposition-matin] ${s(row.slug)} :`, e instanceof Error ? e.message : String(e));
      saute("twilio");
      continue;
    }
    // RELU AVANT D'ÉCRIRE : son comptoir a pu changer sa fiche entre-temps.
    try {
      const { data: relu } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", s(row.id)).maybeSingle();
      const d = ((relu as Record<string, unknown> | null)?.diagnostic ?? diag) as Record<string, unknown>;
      const etat = { ...avecLaPiece(etatDuJour(etatDuDiagnostic(d), aujourdhui), proposition.piece?.id), notifieLe: aujourdhui };
      await supabase.from("human_vitrine_sites").update({ diagnostic: { ...d, proposition_matin: etat } }).eq("id", s(row.id));
    } catch {
      /* au pire, il la reçoit deux fois demain matin s'il y a un second passage */
    }
  }

  return NextResponse.json({ envoyes, sautes });
}
