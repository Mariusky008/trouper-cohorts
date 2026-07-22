// Q&A commercial de la maquette (panneau « Confier une tâche · côté pro »). Le
// prospect pose ses questions ; Claude répond en incarnant l'assistante de Popey
// (l'équipe d'Audrey & Jean-Philippe). HONNÊTETÉ ABSOLUE : aucun prix, délai ou
// promesse inventés → pour tout point commercial précis, on invite à appeler
// Jean-Philippe. Sans ANTHROPIC_API_KEY : repli qui renvoie vers le téléphone.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const PHONE = "07 68 23 33 47";

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const message = s(p?.message).slice(0, 400);
  if (!slug || !message) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  // Contexte léger : le nom/métier du prospect, pour personnaliser la réponse.
  let nom = "";
  let activite = "";
  let ville = "";
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, activite, city")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (row) {
      nom = s(row.business_name);
      activite = s(row.activite);
      ville = s(row.city);
    }
  } catch {
    /* best-effort */
  }

  const fallback = `Excellente question ! Le mieux, c'est d'en parler de vive voix : appelez Jean-Philippe au ${PHONE}, il vous répond avec plaisir.`;
  const apiKey = s(process.env.ANTHROPIC_API_KEY);
  if (!apiKey) return NextResponse.json({ ok: true, reply: fallback, fallback: true });

  const rawHistory = Array.isArray(p?.history) ? (p.history as unknown[]) : [];
  const convo: Array<{ role: "user" | "assistant"; content: string }> = [];
  const push = (role: "user" | "assistant", content: string) => {
    const c = content.trim();
    if (!c) return;
    if (convo.length === 0 && role !== "user") return;
    const last = convo[convo.length - 1];
    if (last && last.role === role) last.content += "\n" + c;
    else convo.push({ role, content: c });
  };
  for (const h of rawHistory.slice(-8)) {
    const o = (h && typeof h === "object" ? h : {}) as Record<string, unknown>;
    const role = s(o.role) === "ai" || s(o.role) === "assistant" ? "assistant" : "user";
    push(role, s(o.text).slice(0, 500));
  }
  push("user", message);
  if (!convo.length || convo[convo.length - 1].role !== "user") convo.push({ role: "user", content: message });

  const who = [nom, activite, ville].filter(Boolean).join(" · ");
  const system =
    `Tu es l'assistante de Popey — l'équipe d'Audrey et Jean-Philippe. Tu parles à un commerçant ou artisan` +
    (who ? ` (${who})` : "") +
    ` qui découvre, sur une MAQUETTE de démonstration, son futur site web et son assistante.\n` +
    `CE QUE PROPOSE POPEY :\n` +
    `- Un vrai site web moderne, prêt en quelques jours, à son nom.\n` +
    `- Une assistante intelligente intégrée qui répond à ses clients (horaires, accès, tarifs) et prend les rendez-vous À SA PLACE, même quand il est occupé.\n` +
    `- Des outils simples pour récolter des avis Google et prévenir ses clients d'une offre ou d'un créneau libre (sur WhatsApp).\n` +
    `RÈGLES ABSOLUES :\n` +
    `- Ce que le pro fait dans cette démo est une SIMULATION : rien n'est envoyé à ses clients ni à personne. Rappelle-le si c'est utile.\n` +
    `- HONNÊTETÉ TOTALE : n'invente JAMAIS de prix, de délai chiffré, de statistique ou de promesse de résultat. \n` +
    `- Pour toute question commerciale précise (tarif, engagement, délai exact, contrat), n'invente pas : invite chaleureusement à appeler Jean-Philippe au ${PHONE}.\n` +
    `- Réponses courtes (2 à 4 phrases), chaleureuses, en français, vouvoiement. Tu peux finir en proposant d'appeler le ${PHONE} pour aller plus loin.\n` +
    `- Tu réponds comme le feraient Audrey ou Jean-Philippe : humain, simple, rassurant. Pas de jargon.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 300, temperature: 0.5, system, messages: convo }),
    });
    if (!res.ok) return NextResponse.json({ ok: true, reply: fallback, fallback: true });
    const data = await res.json();
    const text = s(data?.content?.[0]?.text);
    return NextResponse.json({ ok: true, reply: text || fallback });
  } catch {
    return NextResponse.json({ ok: true, reply: fallback, fallback: true });
  }
}
