// LIRE L'ARDOISE À LA PLACE DU RESTAURATEUR.
//
// LE PROBLÈME QUE ÇA RÉSOUT, et il commande tout le reste du produit. On veut
// que la carte du jour porte des données : le prix, les plats, de quoi comparer
// six menus en dix secondes et, plus tard, savoir ce qui marche chez lui. Mais
// on a promis au restaurateur UN SEUL GESTE — « il photographie son ardoise et
// il valide ». Les deux sont incompatibles tant que c'est LUI qui doit taper :
// un formulaire à six champs à midi moins dix, personne ne le remplit quatre
// jours de suite.
//
// La machine lit donc la photo. Il photographie, on lui rend les plats et le
// prix DÉJÀ ÉCRITS, il corrige d'un doigt si c'est faux, il publie. Le geste
// reste le même, les données existent.
//
// TROIS RÈGLES, et elles ne sont pas négociables :
//
//  1. RIEN N'EST INVENTÉ. Le modèle recopie ce qui est écrit sur l'ardoise. Un
//     prix deviné et publié, c'est le restaurateur qui ment à toute sa ville
//     sans le savoir — et c'est un client qui arrive avec 15 € pour un menu à
//     19. En cas de doute, la fonction rend vide : on préfère un champ à
//     remplir à un champ faux.
//
//  2. RIEN NE BLOQUE. La lecture est une COMMODITÉ, jamais un passage obligé :
//     clé absente, panne, photo illisible, lenteur — la carte du jour se publie
//     exactement comme avant. Cette route ne renvoie donc jamais d'erreur qui
//     arrête l'écran ; au pire, elle rend des champs vides.
//
//  3. LE COMMERÇANT A LE DERNIER MOT. Ce qui revient d'ici pré-remplit un champ
//     qu'il voit et qu'il peut corriger avant de publier. Rien ne part en ligne
//     sans être passé sous ses yeux.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aEteCoupee, aRefuse, texteDuModele } from "@/lib/site-internet/reponse-modele";
import { lirePrix } from "@/lib/direct/prix";

export const dynamic = "force-dynamic";

// La lecture d'une ardoise est de la transcription : de l'écriture à la craie,
// de travers, mal éclairée, avec des ratures. C'est exactement le genre de
// tâche où un modèle moins capable invente pour combler — et inventer est ici
// le seul résultat inacceptable.
const MODELE = "claude-opus-5";

// Le même plafond que la galerie : au-delà, c'est une photo non compressée
// envoyée par erreur, et l'envoyer au modèle coûterait sans rien lire de plus.
const MAX_PHOTO = 900_000;

const str = (v: unknown) => String(v ?? "").trim();

/** Les octets et le type d'une image en clair, ou `null` si ce n'en est pas une. */
function imageDataUrl(v: string): { media: string; base64: string } | null {
  const m = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (!m) return null;
  // `image/jpg` n'est pas un type MIME : l'API le refuse. Les téléphones en
  // produisent quand même.
  const media = m[1] === "image/jpg" ? "image/jpeg" : m[1];
  return { media, base64: m[2] };
}

/** La réponse quand on ne sait pas lire : des champs vides, jamais une erreur. */
const RIEN = { ok: true as const, texte: "", prix: null as number | null, lu: false as const };

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = str(p?.slug);
  const token = str(p?.token);
  const photo = str(p?.photo);
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, business_name")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || str(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  // Tout ce qui suit est du confort : on répond « rien lu », l'écran continue.
  const img = photo.length <= MAX_PHOTO ? imageDataUrl(photo) : null;
  const apiKey = str(process.env.ANTHROPIC_API_KEY);
  if (!img || !apiKey) return NextResponse.json(RIEN);

  const system =
    `Tu transcris la photo d'une ardoise de restaurant — le menu du jour, écrit à la craie ou imprimé.\n` +
    `RÈGLE ABSOLUE : tu RECOPIES ce qui est écrit. Tu n'inventes AUCUN plat, AUCUN prix, ` +
    `AUCUN ingrédient, AUCUNE catégorie qui ne soit pas sur la photo. Un plat que tu n'arrives pas ` +
    `à lire, tu l'omets — il vaut mieux une ligne manquante qu'une ligne fausse.\n` +
    `Rends deux choses :\n` +
    `- "texte" : les plats, une par ligne, dans l'ordre de l'ardoise. Garde les intitulés de section ` +
    `s'il y en a (Entrées, Plats, Desserts) sur leur propre ligne. Corrige l'orthographe et les ` +
    `accents, n'ajoute rien. N'écris ni le nom du restaurant, ni la date, ni « menu du jour », ` +
    `ni les prix — ils ont leur place ailleurs. Chaîne vide si tu ne lis aucun plat.\n` +
    `- "prix" : le prix du menu ou de la formule complète, en euros, en nombre (18 ou 18.5). ` +
    `S'il y a plusieurs formules, prends la moins chère. S'il n'y a aucun prix lisible, ou seulement ` +
    `des prix de plats isolés sans formule, rends null. Ne devine JAMAIS un prix.\n` +
    `Réponds uniquement l'objet JSON demandé.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODELE,
        // La réflexion est active par défaut et se paie sur ce plafond. Une
        // ardoise fait vingt lignes : le texte est court, la marge sert à la
        // lecture de l'image elle-même.
        max_tokens: 3000,
        system,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: img.media, data: img.base64 } },
              { type: "text", text: "Transcris cette ardoise." },
            ],
          },
        ],
        output_config: {
          // Transcrire n'est pas raisonner, et le restaurateur attend devant
          // son écran, le téléphone à la main, au milieu de son service.
          effort: "low",
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              properties: {
                texte: { type: "string" },
                prix: { type: ["number", "null"] },
              },
              required: ["texte", "prix"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!res.ok) {
      console.error(`[ardoise] appel Anthropic refusé : HTTP ${res.status}`);
      return NextResponse.json(RIEN);
    }
    const data = await res.json();
    if (aRefuse(data) || aEteCoupee(data)) return NextResponse.json(RIEN);
    let lu: { texte?: unknown; prix?: unknown } = {};
    try {
      lu = JSON.parse(texteDuModele(data)) as typeof lu;
    } catch {
      return NextResponse.json(RIEN);
    }
    // Borné ICI aussi, pas seulement à la saisie : ce texte va pré-remplir un
    // champ plafonné à 400 signes, et un modèle bavard le remplirait entier.
    const texte = str(lu.texte).slice(0, 400);
    const prix = lirePrix(lu.prix);
    return NextResponse.json({ ok: true, texte, prix, lu: Boolean(texte || prix != null) });
  } catch (e) {
    console.error(`[ardoise] lecture impossible : ${(e as Error)?.message || "réseau"}`);
    return NextResponse.json(RIEN);
  }
}
