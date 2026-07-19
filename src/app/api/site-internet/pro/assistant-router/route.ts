// Cerveau du bouton central « Assistante » de l'Espace Pro. Le pro écrit ce qu'il
// veut faire ; Claude choisit le bon OUTIL (parmi ceux réellement codés) et
// répond chaleureusement. HONNÊTE : l'assistante n'ouvre que des outils existants
// et ne promet rien qu'elle ne sait faire. Sans ANTHROPIC_API_KEY : routage par
// mots-clés (dégradation propre).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

type Action = { key: string; label: string; desc: string; soliciter?: boolean };
const ALL_ACTIONS: Action[] = [
  { key: "clients:annonce", label: "Annonce", desc: "rédiger et envoyer une annonce, une promo, une offre ou prévenir d'un créneau libre à ses clients sur WhatsApp", soliciter: true },
  { key: "clients:avis", label: "Demander un avis", desc: "demander un avis Google à un client", soliciter: true },
  { key: "clients:liste", label: "Ma liste de clients", desc: "gérer sa liste de clients (contacts opt-in)", soliciter: true },
  { key: "agenda", label: "Agenda", desc: "voir et gérer les rendez-vous, définir ses disponibilités, envoyer les rappels de RDV de demain, demander l'avis après un RDV honoré" },
  { key: "site:contenu", label: "Contenu du site", desc: "modifier ses prestations, tarifs, et les motifs « pour quoi venir me voir »" },
  { key: "site:photos", label: "Photos", desc: "ajouter ou retirer des photos de son site" },
  { key: "site:fiche", label: "Fiche assistante", desc: "renseigner ce que l'assistante doit savoir pour répondre aux clients (spécialités, FAQ, ce qu'il ne propose pas)" },
  { key: "accueil", label: "Tableau de bord", desc: "voir ses chiffres : vues du site, rendez-vous, avis" },
];

// Repli par mots-clés si pas de clé API (ou en secours).
function keywordRoute(msg: string, actions: Action[]): { key: string; label: string } | null {
  const m = msg.toLowerCase();
  const has = (...w: string[]) => w.some((x) => m.includes(x));
  const pick = (k: string) => actions.find((a) => a.key === k) || null;
  if (has("annonce", "promo", "offre", "créneau", "creneau", "place libre", "prévenir", "prevenir", "message", "diffus")) return pick("clients:annonce");
  if (has("avis", "review", "étoile", "etoile", "note google")) return pick("clients:avis");
  if (has("liste", "contact", "client")) return pick("clients:liste");
  if (has("rendez", "rdv", "agenda", "dispo", "réserv", "reserv", "rappel", "planning", "horaire")) return pick("agenda");
  if (has("photo", "image", "galerie")) return pick("site:photos");
  if (has("tarif", "prix", "prestation", "presta", "menu", "motif", "service")) return pick("site:contenu");
  if (has("fiche", "connaiss", "faq", "spécial", "special", "savoir")) return pick("site:fiche");
  if (has("chiffre", "vue", "statistique", "stat", "tableau", "bord")) return pick("accueil");
  return null;
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  const message = s(p?.message).slice(0, 300);
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });
  if (!message) return NextResponse.json({ error: "Dites-moi ce que vous voulez faire." }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, business_name, activite")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const nom = s(site.business_name) || "votre établissement";
  const activite = s(site.activite);
  const soliciter = resolveMetier(activite).def.avis_sollicitation;
  const actions = ALL_ACTIONS.filter((a) => (a.soliciter ? soliciter : true));
  const labelOf = (k: string) => actions.find((a) => a.key === k)?.label || "";

  const apiKey = s(process.env.ANTHROPIC_API_KEY);
  if (!apiKey) {
    const hit = keywordRoute(message, actions);
    return NextResponse.json({
      ok: true,
      reply: hit ? `Je vous ouvre « ${hit.label} ».` : "Je peux vous aider à envoyer une annonce, demander un avis, gérer votre agenda, vos photos ou vos prestations. Que voulez-vous faire ?",
      goto: hit?.key ?? null,
      label: hit?.label ?? null,
      fallback: true,
    });
  }

  const list = actions.map((a) => `- ${a.key} : ${a.desc}`).join("\n");
  const canAnnounce = actions.some((a) => a.key === "clients:annonce");
  const system =
    `Tu es l'assistante de bord de ${nom}${activite ? `, ${activite}` : ""}. ` +
    `Le professionnel te dit ce qu'il veut faire dans son espace de gestion ; tu l'aides en OUVRANT le bon outil.\n` +
    `Outils disponibles (clé : à quoi ça sert) :\n${list}\n\n` +
    `Réponds STRICTEMENT en JSON, sans texte autour : {"reply": "...", "goto": "<clé exacte ou null>", "prefill": "<texte ou null>"}\n` +
    `- reply : 1 à 2 phrases chaleureuses, en français, vouvoiement. Dis ce que tu ouvres, ou pose UNE question si la demande est ambiguë.\n` +
    `- goto : la clé EXACTE de l'outil le plus adapté, ou null si tu as besoin d'une précision ou si la demande sort de ces outils.\n` +
    (canAnnounce
      ? `- prefill : UNIQUEMENT si goto vaut "clients:annonce" ET que le message décrit une offre concrète (promo, créneau libre, événement, nouveauté), rédige ici le message WhatsApp prêt à envoyer aux clients. Sinon null.\n` +
        `  Règles du prefill : court (2 à 4 phrases), chaleureux, vouvoiement, 1-2 emojis max, finit par un appel à répondre. N'invente AUCUN prix, %, date ou horaire non fourni — si une info manque, laisse un crochet comme [jour/heure]. Pas de nom de client.\n`
      : `- prefill : toujours null.\n`) +
    `- N'invente jamais d'outil hors de la liste. Si la demande sort de ton périmètre, explique gentiment ce que tu sais faire.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 220,
        temperature: 0.3,
        system,
        messages: [{ role: "user", content: message }],
      }),
    });
    if (!res.ok) throw new Error("api");
    const data = await res.json();
    const text = s(data?.content?.[0]?.text);
    let reply = "";
    let goto: string | null = null;
    let prefill: string | null = null;
    try {
      const j = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
      reply = s(j.reply);
      const g = s(j.goto);
      if (g && actions.some((a) => a.key === g)) goto = g;
      // Le pré-remplissage n'a de sens que pour l'annonce (rédaction du message).
      if (goto === "clients:annonce") {
        const pf = s(j.prefill).slice(0, 600);
        if (pf && pf.toLowerCase() !== "null") prefill = pf;
      }
    } catch {
      reply = text; // le modèle a répondu en clair → on garde le texte, sans navigation
    }
    if (!reply) reply = "Dites-m'en un peu plus : que souhaitez-vous faire ?";
    return NextResponse.json({ ok: true, reply, goto, label: goto ? labelOf(goto) : null, prefill });
  } catch {
    const hit = keywordRoute(message, actions);
    return NextResponse.json({
      ok: true,
      reply: hit ? `Je vous ouvre « ${hit.label} ».` : "Je peux vous aider à envoyer une annonce, demander un avis, gérer votre agenda, vos photos ou vos prestations. Que voulez-vous faire ?",
      goto: hit?.key ?? null,
      label: hit?.label ?? null,
      fallback: true,
    });
  }
}
