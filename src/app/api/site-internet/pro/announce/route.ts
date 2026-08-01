// Générateur d'annonce assisté par l'IA (Espace Pro, jeton privé). Le pro donne
// une idée en vrac (« fraises en promo -20% ce week-end ») → Claude la transforme
// en UN message WhatsApp prêt à envoyer, dans son ton.
// HONNÊTETÉ : le modèle ne s'appuie QUE sur ce que le pro écrit. Il n'invente
// aucun prix, %, date ni détail — si une info manque, il laisse un [crochet] à
// compléter plutôt que d'inventer. Sans ANTHROPIC_API_KEY : dégradation propre.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Ce modèle REFUSE (400) `temperature`/`top_p`/`top_k` et l'amorce de réponse
// par un tour « assistant ». La forme de sortie passe donc par `output_config`,
// et le ton se règle dans la consigne, plus par un réglage d'échantillonnage.
const MODELE = "claude-sonnet-5";

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
    .select("id, pro_token, business_name, city, activite, services")
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

  // CONTEXTE : sans lui, le modèle écrivait à l'aveugle et sortait du générique.
  // Ses vraies prestations lui permettent de nommer ce qu'il vend ; la date du
  // jour lui permet de comprendre « jeudi » ou « ce week-end » sans se tromper.
  const prestations = (Array.isArray(site.services) ? site.services : [])
    .map((x) => str((x as Record<string, unknown>)?.name))
    .filter(Boolean)
    .slice(0, 8);
  const aujourdhui = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris",
  }).format(new Date());

  const apiKey = str(process.env.ANTHROPIC_API_KEY);
  if (!apiKey) {
    // Repli honnête : on renvoie le brief tel quel, légèrement mis en forme.
    return NextResponse.json({ ok: true, text: `Bonjour ! ${brief}\n\nRépondez-moi pour en profiter 🙂`, fallback: true });
  }

  const system =
    `Tu écris des messages WhatsApp pour ${nom}` +
    (activite ? `, ${activite}` : "") +
    (ville ? ` à ${ville}` : "") +
    `, à envoyer à ses client·es fidèles.\n` +
    `Nous sommes ${aujourdhui}.\n` +
    (prestations.length ? `Ce que ce commerce propose : ${prestations.join(", ")}.\n` : "") +
    `Le pro te donne une idée en vrac. Rends-lui TROIS messages prêts à envoyer, avec des angles différents :\n` +
    `1. DIRECT — l'info d'abord, en une phrase, puis l'invitation.\n` +
    `2. CHALEUREUX — on s'adresse à quelqu'un qu'on connaît, ton du commerce de quartier.\n` +
    `3. COURT — deux lignes maximum, pour qui lit son téléphone entre deux portes.\n` +
    `RÈGLES ABSOLUES :\n` +
    `- Appuie-toi UNIQUEMENT sur ce que le pro écrit. N'invente AUCUN prix, pourcentage, date, horaire ni détail non fourni. ` +
    `Si une info utile manque (heure, jour…), laisse un court crochet comme [jour/heure] à compléter plutôt que d'inventer.\n` +
    `- Le pro écrit vite et mal : corrige ses fautes, complète ses abréviations, mais ne change JAMAIS ce qu'il annonce.\n` +
    `- Ton chaleureux, direct et local. Vouvoiement par défaut. Aucune formule pompeuse, aucun jargon marketing ` +
    `(« profitez de notre offre exceptionnelle », « ne manquez pas », « incroyable »).\n` +
    `- 1 emoji, 2 maximum, jamais en début de message.\n` +
    `- Pas de nom de client (le message part à plusieurs personnes).\n` +
    `- Termine par un appel simple à répondre (ex. « Répondez-moi pour réserver »).\n` +
    `- Réponds UNIQUEMENT un objet JSON : {"variantes":["…","…","…"]}. Aucun texte autour.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        // La qualité de ce texte EST le produit : le pro le juge en 2 secondes.
        // On prend le modèle qui écrit le mieux, l'appel reste court et rare.
        model: MODELE,
        max_tokens: 900,
        system,
        messages: [{ role: "user", content: brief }],
        // La forme est GARANTIE par le schéma. Avant, on amorçait la réponse avec
        // un début de JSON — une amorce d'assistant, que ce modèle refuse.
        output_config: {
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: { variantes: { type: "array", items: { type: "string" } } },
              required: ["variantes"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!res.ok) return NextResponse.json(secours(brief, nom, await pourquoi(res)), { status: 200 });
    const data = await res.json();
    // Le modèle peut décliner une demande : ce n'est pas une erreur HTTP.
    if (str(data?.stop_reason) === "refusal") return NextResponse.json(secours(brief, nom, "refus"), { status: 200 });
    const variantes = parseVariantes(str(data?.content?.[0]?.text));
    if (!variantes.length) return NextResponse.json(secours(brief, nom, "réponse illisible"), { status: 200 });
    return NextResponse.json({ ok: true, text: variantes[0], variantes });
  } catch (e) {
    return NextResponse.json(secours(brief, nom, (e as Error)?.message || "réseau"), { status: 200 });
  }
}

/**
 * Pourquoi l'appel a échoué — journalisé, jamais renvoyé au commerçant.
 *
 * Sans ça, une requête invalide (paramètre retiré du modèle, schéma refusé)
 * était indiscernable d'une panne réseau : le repli s'activait en silence et
 * l'assistante paraissait fonctionner alors qu'elle n'était jamais appelée.
 */
async function pourquoi(res: Response): Promise<string> {
  let detail = "";
  try {
    const j = await res.json();
    detail = str(j?.error?.message) || str(j?.error?.type);
  } catch {
    /* corps illisible → le statut suffit */
  }
  const raison = `HTTP ${res.status}${detail ? ` — ${detail}` : ""}`;
  console.error(`[announce] appel Anthropic refusé : ${raison}`);
  return raison;
}

// Repli quand le modèle est indisponible : on met en forme ce que le pro a écrit,
// sans rien inventer, et on le SIGNALE (`fallback`) pour ne pas faire passer ça
// pour de la rédaction assistée.
function secours(brief: string, nom: string, raison = "") {
  const t = brief.trim().replace(/\s+/g, " ");
  const phrase = /[.!?]$/.test(t) ? t : `${t}.`;
  if (raison) console.error(`[announce] repli de secours (${raison})`);
  return {
    ok: true,
    text: `Bonjour ! ${phrase}\n\nRépondez-moi pour en profiter — à très vite chez ${nom} 🙂`,
    fallback: true,
  };
}

// Le modèle répond `…"], …}` (on a amorcé l'ouverture). On recolle, et à défaut
// on récupère les chaînes une par une : mieux vaut deux variantes que zéro.
function parseVariantes(raw: string): string[] {
  const clean = (v: unknown) => String(v ?? "").trim();
  const body = raw.trim().startsWith("{") ? raw.trim() : `{"variantes":[${raw}`;
  try {
    const j = JSON.parse(body.slice(0, body.lastIndexOf("}") + 1 || undefined));
    const arr = Array.isArray(j?.variantes) ? j.variantes : [];
    const out = arr.map(clean).filter(Boolean).slice(0, 3);
    if (out.length) return out;
  } catch {
    /* JSON tronqué → extraction ligne à ligne ci-dessous */
  }
  const found = body.match(/"((?:[^"\\]|\\.)*)"/g) ?? [];
  return found
    .map((s) => clean(s.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"')))
    .filter((s) => s.length > 20 && s !== "variantes")
    .slice(0, 3);
}
