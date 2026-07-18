// Générateur d'annonce assisté par l'IA (Espace Pro, jeton privé). Le pro donne
// une idée en vrac (« fraises en promo -20% ce week-end ») → Claude la transforme
// en UN message WhatsApp prêt à envoyer, dans son ton.
// HONNÊTETÉ : le modèle ne s'appuie QUE sur ce que le pro écrit. Il n'invente
// aucun prix, %, date ni détail — si une info manque, il laisse un [crochet] à
// compléter plutôt que d'inventer. Sans ANTHROPIC_API_KEY : dégradation propre.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = str(p?.slug);
  const token = str(p?.token);
  const brief = str(p?.brief).slice(0, 400);
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });
  if (!brief) return NextResponse.json({ error: "Dites en quelques mots ce que vous proposez." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, business_name, city, activite")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || str(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const nom = str(site.business_name) || "votre commerce";
  const ville = str(site.city);
  const activite = str(site.activite);

  const apiKey = str(process.env.ANTHROPIC_API_KEY);
  if (!apiKey) {
    // Repli honnête : on renvoie le brief tel quel, légèrement mis en forme.
    return NextResponse.json({ ok: true, text: `Bonjour ! ${brief}\n\nRépondez-moi pour en profiter 🙂`, fallback: true });
  }

  const system =
    `Tu écris un court message WhatsApp pour ${nom}` +
    (activite ? `, ${activite}` : "") +
    (ville ? ` à ${ville}` : "") +
    `, à envoyer à ses client·es fidèles.\n` +
    `Le pro te donne une idée en vrac ; transforme-la en UN message WhatsApp prêt à envoyer.\n` +
    `RÈGLES ABSOLUES :\n` +
    `- Appuie-toi UNIQUEMENT sur ce que le pro écrit. N'invente AUCUN prix, pourcentage, date, horaire ni détail non fourni. ` +
    `Si une info utile manque (heure, jour…), laisse un court crochet comme [jour/heure] à compléter plutôt que d'inventer.\n` +
    `- Ton chaleureux, direct et local. Vouvoiement par défaut.\n` +
    `- Court : 2 à 4 phrases. 1 emoji, 2 maximum. Aucun blabla, aucune formule pompeuse.\n` +
    `- Pas de nom de client (le message est diffusé à plusieurs personnes).\n` +
    `- Termine par un appel simple à répondre (ex. « Répondez-moi pour réserver »).\n` +
    `- Réponds UNIQUEMENT le message final, sans guillemets, sans titre, sans commentaire.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 260,
        temperature: 0.7,
        system,
        messages: [{ role: "user", content: brief }],
      }),
    });
    if (!res.ok) return NextResponse.json({ ok: true, text: `Bonjour ! ${brief}\n\nRépondez-moi pour en profiter 🙂`, fallback: true });
    const data = await res.json();
    const text = str(data?.content?.[0]?.text);
    if (!text) return NextResponse.json({ ok: true, text: `Bonjour ! ${brief}\n\nRépondez-moi pour en profiter 🙂`, fallback: true });
    return NextResponse.json({ ok: true, text });
  } catch {
    return NextResponse.json({ ok: true, text: `Bonjour ! ${brief}\n\nRépondez-moi pour en profiter 🙂`, fallback: true });
  }
}
