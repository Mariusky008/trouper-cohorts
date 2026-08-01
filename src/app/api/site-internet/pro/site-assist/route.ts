// Espace Pro — « l'assistante prépare votre contenu ». Le pro décrit en une
// phrase pourquoi ses client·es viennent le voir ; l'assistante en tire 4 cartes
// « Pour quoi venir me voir ? » (icône + titre court + description) que le pro
// RELIT et VALIDE avant enregistrement. Repli sans IA : découpage simple.
// HONNÊTETÉ : on ne s'appuie QUE sur la phrase du pro — aucun chiffre, aucun
// avis, aucune promesse inventés.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aEteCoupee, aRefuse, texteDuModele } from "@/lib/site-internet/reponse-modele";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const ICONS = ["🎯", "💪", "🌿", "✨", "🧘", "🤝", "🩺", "⏱️", "❤️", "🙂"];

// Repli sans IA : on découpe la phrase en motifs à partir des séparateurs.
function fallback(phrase: string): Array<{ icon: string; title: string; desc: string }> {
  const parts = phrase
    .split(/[,;.\n]|\bet\b|\bou\b/gi)
    .map((x) => x.trim())
    .filter((x) => x.length > 2)
    .slice(0, 4);
  return parts.map((p, i) => {
    const title = p.charAt(0).toUpperCase() + p.slice(1);
    return { icon: ICONS[i % ICONS.length], title: title.slice(0, 48), desc: "" };
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = s(body.slug);
  const token = s(body.token);
  const phrase = s(body.phrase).slice(0, 400);
  if (!slug || !token || !phrase) {
    return NextResponse.json({ error: "Requête incomplète." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("pro_token, business_name, activite")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const activite = s(site.activite);
  const apiKey = s(process.env.ANTHROPIC_API_KEY);
  if (!apiKey) {
    return NextResponse.json({ ok: true, usecases: fallback(phrase), fallback: true });
  }

  const system =
    `Tu aides un·e professionnel·le (${activite || "commerce de proximité"}) à présenter, sur son site, ` +
    `« Pour quoi venir me voir ? ». À partir de SA phrase, propose EXACTEMENT 4 motifs de visite.\n` +
    `Règles STRICTES :\n` +
    `- Ne t'appuie QUE sur ce que dit la phrase. N'invente aucun chiffre, aucun avis, aucune garantie de résultat.\n` +
    `- Chaque motif : un "icon" (un seul emoji pertinent), un "title" court (2 à 5 mots), une "desc" d'une phrase simple et concrète (max ~90 caractères), à la 2e personne quand c'est naturel.\n` +
    `- Français, ton chaleureux et sobre. Pas de superlatifs invérifiables ("le meilleur", "n°1").\n` +
    `- Réponds UNIQUEMENT par un JSON: {"usecases":[{"icon","title","desc"}, ...]} (4 éléments).`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        // Texte que le pro publie sur SON site et juge en un coup d'œil : on prend
        // le modèle qui écrit le mieux (appel court, rare, non bloquant).
        // Ce modèle refuse (400) `temperature`/`top_p`/`top_k` : le ton se règle
        // dans la consigne. La forme est garantie par le schéma de sortie.
        model: "claude-sonnet-5",
        // La réflexion est active par défaut et compte dans ce plafond.
        max_tokens: 2500,
        system,
        messages: [{ role: "user", content: phrase }],
        output_config: {
          effort: "low",
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                usecases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      icon: { type: "string" },
                      title: { type: "string" },
                      desc: { type: "string" },
                    },
                    required: ["icon", "title", "desc"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["usecases"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!res.ok) {
      console.error(`[site-assist] appel Anthropic refusé : HTTP ${res.status}`);
      throw new Error("api");
    }
    const data = await res.json();
    if (aRefuse(data) || aEteCoupee(data)) throw new Error("modele");
    const text = texteDuModele(data);
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
    const arr = Array.isArray(parsed?.usecases) ? parsed.usecases : [];
    const usecases = arr
      .map((u: Record<string, unknown>) => ({
        icon: s(u.icon).slice(0, 4) || "🔹",
        title: s(u.title).slice(0, 60),
        desc: s(u.desc).slice(0, 120),
      }))
      .filter((u: { title: string }) => u.title.length > 0)
      .slice(0, 4);
    if (!usecases.length) throw new Error("empty");
    return NextResponse.json({ ok: true, usecases });
  } catch {
    return NextResponse.json({ ok: true, usecases: fallback(phrase), fallback: true });
  }
}
