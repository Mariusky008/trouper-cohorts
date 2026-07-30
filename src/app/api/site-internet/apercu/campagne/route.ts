// « Options Pro » de la démonstration : une phrase du commerçant → trois
// publications, une par canal (WhatsApp, Instagram, Facebook).
//
// C'est l'écran qui justifie les 29 €/mois : il doit être bon. On prend donc le
// modèle qui écrit le mieux — l'appel est court, et l'animation de 4 s le couvre.
//
// Route publique (la maquette n'a pas de jeton) : limite par IP, comme les autres
// routes IA de l'aperçu. Repli déterministe si la clé manque, si le modèle échoue
// ou s'il répond trop tard : l'animation ne doit jamais rester bloquée.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import { campagneFallback, campagneFromModel } from "@/lib/site-internet/campagne";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

const IP_MAX = 12;
const IP_WINDOW_MS = 10 * 60 * 1000;
const ipHits = new Map<string, number[]>();

function ipThrottled(ip: string): boolean {
  if (!ip) return false;
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (ipHits.size > 5000) ipHits.clear();
  if (hits.length >= IP_MAX) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug).slice(0, 120);
  const annonce = s(p?.annonce).slice(0, 400);
  if (!slug || !annonce) return NextResponse.json({ error: "slug/annonce requis" }, { status: 400 });

  const fwd = request.headers.get("x-forwarded-for") || "";
  const ip = (fwd.split(",")[0] || request.headers.get("x-real-ip") || "").trim();

  let nom = "votre commerce";
  let ville = "";
  let activite = "";
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("business_name, city, activite")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    nom = s(row?.business_name) || nom;
    ville = s(row?.city);
    activite = s(row?.activite);
  } catch {
    /* best-effort : le repli n'a pas besoin de la base */
  }
  const metier = resolveMetier(activite).entry?.label ?? activite;
  const secours = campagneFallback(annonce, nom, metier, ville);

  const apiKey = s(process.env.ANTHROPIC_API_KEY);
  // Trop de sollicitations, ou pas de clé : le repli est déjà présentable.
  if (!apiKey || ipThrottled(ip)) {
    return NextResponse.json({ ok: true, ...secours, fallback: true });
  }

  const system =
    `Tu adaptes UNE annonce de ${nom}` +
    (metier ? `, ${metier}` : "") +
    (ville ? ` à ${ville}` : "") +
    ` pour trois canaux. Rends TROIS versions du même message.\n` +
    `- "wa" : WhatsApp, à des client·es fidèles. Court (2 phrases max), chaleureux, ` +
    `on tutoie le canal pas la personne (vouvoiement). Finit par une invitation à répondre. 1 emoji.\n` +
    `- "insta" : légende Instagram. La photo porte le message : 1 à 2 lignes, puis le lieu, ` +
    `puis 3 hashtags maximum (métier, ville, #commercelocal). Pas de lien (Instagram ne les rend pas cliquables).\n` +
    `- "fb" : Facebook. Un peu plus explicite, 2 à 3 phrases, et on indique qu'on réserve depuis le site.\n` +
    `RÈGLES ABSOLUES :\n` +
    `- N'invente AUCUN prix, pourcentage, date, horaire ni détail absent de l'annonce. Reformate, n'ajoute rien.\n` +
    `- Aucun jargon marketing (« offre exceptionnelle », « ne manquez pas », « incroyable »).\n` +
    `- Corrige les fautes du pro, mais ne change jamais ce qu'il annonce.\n` +
    `- Réponds UNIQUEMENT un objet JSON {"wa":"…","insta":"…","fb":"…"}. Aucun texte autour.`;

  try {
    // Garde-fou de temps : au-delà, l'animation a déjà fini d'attendre.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 700,
        temperature: 0.7,
        system,
        messages: [
          { role: "user", content: annonce },
          { role: "assistant", content: "{" }, // amorce : sortie JSON sans préambule
        ],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return NextResponse.json({ ok: true, ...secours, fallback: true });
    const data = await res.json();
    const raw = s(data?.content?.[0]?.text);
    const body = raw.trim().startsWith("{") ? raw : `{${raw}`;
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(body.slice(0, body.lastIndexOf("}") + 1 || undefined));
    } catch {
      parsed = null;
    }
    return NextResponse.json({ ok: true, ...campagneFromModel(parsed, secours) });
  } catch {
    return NextResponse.json({ ok: true, ...secours, fallback: true });
  }
}
