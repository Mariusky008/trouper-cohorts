// Branche FAQ en texte libre de l'accueil intelligent (Phase 2).
// FLUX DE SÉCURITÉ : on classe le message avec le filtre DÉTERMINISTE d'abord.
// - urgence → réponse fixe (15/3114/112), LLM JAMAIS appelé.
// - medical → refus chaleureux + propose un RDV, LLM JAMAIS appelé.
// - ok → Claude (Haiku), system prompt strict : accueil/organisation UNIQUEMENT,
//   aucun conseil médical, n'invente pas d'info, propose un rendez-vous.
// Sans ANTHROPIC_API_KEY : dégradation propre (message neutre + RDV).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyMessage, URGENCE_REPLY, medicalReply } from "@/lib/site-internet/accueil-safety";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = str(p?.slug).slice(0, 120);
  const message = str(p?.message).slice(0, 500);
  if (!message) return NextResponse.json({ kind: "ok", reply: "" });

  // Contexte du cabinet (pour des réponses justes, sans rien inventer).
  let praticien = "le praticien";
  let ville = "";
  let activite = "";
  let adresse = "";
  let horaires: Array<{ jours?: string; horaires?: string }> = [];
  let kbText = ""; // fiche de connaissances remplie par le pro (spécialités, FAQ)
  if (slug) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("human_vitrine_sites")
        .select("business_name, city, activite, address, diagnostic, assistant_kb")
        .eq("slug", slug)
        .eq("channel", "letter")
        .maybeSingle();
      const row = (data as Record<string, unknown> | null) ?? null;
      if (row) {
        praticien = str(row.business_name) || praticien;
        ville = str(row.city);
        activite = str(row.activite);
        adresse = str(row.address);
        const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
        horaires = (Array.isArray(diag.horaires) ? diag.horaires : []) as Array<{ jours?: string; horaires?: string }>;
        // Fiche de connaissances renseignée par le pro.
        const kb = (row.assistant_kb && typeof row.assistant_kb === "object" ? row.assistant_kb : {}) as Record<string, unknown>;
        const spec = str(kb.specialites);
        const excl = str(kb.exclusions);
        const faq = (Array.isArray(kb.faq) ? kb.faq : []) as Array<{ q?: string; a?: string }>;
        const faqTxt = faq
          .map((f) => `Q: ${str(f.q)} → R: ${str(f.a)}`)
          .filter((l) => l.length > 8)
          .slice(0, 20)
          .join("\n");
        kbText =
          (spec ? `Spécialités / ce que propose ${praticien} : ${spec}\n` : "") +
          (excl ? `Ce que ${praticien} ne propose PAS : ${excl}\n` : "") +
          (faqTxt ? `Questions fréquentes (réponds à partir de ça) :\n${faqTxt}\n` : "");
      }
    } catch {
      /* best-effort */
    }
  }

  // ── GARDE PRIMAIRE : filtre déterministe, avant tout appel modèle ──────────
  const kind = classifyMessage(message);
  if (kind === "urgence") return NextResponse.json({ kind, reply: URGENCE_REPLY });
  if (kind === "medical") return NextResponse.json({ kind, reply: medicalReply(praticien) });

  // ── Message bénin → Claude, cadré strictement ─────────────────────────────
  const apiKey = str(process.env.ANTHROPIC_API_KEY);
  const fallback = `Je transmets votre question au cabinet. Souhaitez-vous que je vous propose un rendez-vous avec ${praticien} en attendant ?`;
  if (!apiKey) return NextResponse.json({ kind: "ok", reply: fallback });

  const horairesTxt = horaires
    .slice(0, 7)
    .map((h) => `${str(h.jours)} : ${str(h.horaires)}`)
    .filter((l) => l.length > 3)
    .join(" ; ");

  const system =
    `Tu es l'accueil AUTOMATIQUE de ${praticien}` +
    (activite ? `, ${activite}` : "") +
    (ville ? ` à ${ville}` : "") +
    `.\n` +
    `Tu réponds aux questions pratiques et d'organisation (accès, stationnement, horaires, déroulé, ` +
    `moyens de paiement, prise de rendez-vous)` +
    (kbText ? ` ET aux questions sur les prestations, en t'appuyant UNIQUEMENT sur la fiche ci-dessous.` : `.`) +
    `\n` +
    `RÈGLES ABSOLUES :\n` +
    `- JAMAIS de conseil médical, d'interprétation de symptômes, de diagnostic ni d'avis sur un traitement. ` +
    `Si on te pose une question de santé, réponds : « Je ne peux pas répondre à une question de santé ; ` +
    `parlez-en directement avec ${praticien}. Souhaitez-vous un rendez-vous ? »\n` +
    `- Réponds à partir des INFOS CONNUES ci-dessous. Hors de ces infos, n'invente RIEN : dis simplement ` +
    `« je vérifie ce point avec ${praticien} » et propose un rendez-vous ou de transmettre la demande.\n` +
    `- Ne demande AUCUNE donnée de santé.\n` +
    `- Réponses courtes (1 à 3 phrases), ton posé et chaleureux, en français. Tu peux toujours proposer un rendez-vous.\n` +
    `INFOS CONNUES :\n` +
    (adresse ? `Adresse : ${adresse}.\n` : "") +
    (horairesTxt ? `Horaires : ${horairesTxt}.\n` : "Horaires non communiqués.\n") +
    (kbText || "");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        temperature: 0.3,
        system,
        messages: [{ role: "user", content: message }],
      }),
    });
    if (!res.ok) return NextResponse.json({ kind: "ok", reply: fallback });
    const data = await res.json();
    const text = str(data?.content?.[0]?.text);
    return NextResponse.json({ kind: "ok", reply: text || fallback });
  } catch {
    return NextResponse.json({ kind: "ok", reply: fallback });
  }
}
