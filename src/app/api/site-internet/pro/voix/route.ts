// 🎙️ SA VOIX, DONNÉE DEPUIS SON ESPACE PRO (jeton privé).
//
// « Avec chaque commerçant, comment vais-je faire pour que ça puisse être
// automatisé sans que j'aie à intervenir ? On ne peut pas le faire directement
// depuis leur admin ? »
//
// TROIS GESTES, ET PERSONNE CHEZ CLIKME N'A À INTERVENIR :
//
//   · « get »       — où en est sa voix (donnée ou non, le prénom, l'accord) ;
//   · « creer »     — son accord coché, son prénom et ses trois réponses
//                     enregistrées : ElevenLabs crée sa voix, on garde
//                     l'identifiant, l'accord daté et ce qu'il a raconté ;
//   · « supprimer » — sa voix est effacée chez ElevenLabs ET ici.
//
// LES ENREGISTREMENTS NE SONT PAS GARDÉS. Ils traversent le serveur le temps
// de l'envoi. On ne garde que l'identifiant de la voix et la transcription de
// ce qu'il a raconté, qui nourrit ce que son double sait de lui.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ACCORD_VOIX,
  clonageDisponible,
  creerVoixClonee,
  lireEnregistrement,
  questionsVoix,
  supprimerVoixClonee,
  transcrireReponse,
  type Enregistrement,
} from "@/lib/direct/voix-clonee";
import { oublierLeCommerce } from "@/lib/direct/double-commerce";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const s = (v: unknown) => String(v ?? "").trim();

/** Une réponse de 45 secondes au plus, en data-URL. Trois tiennent sous la limite
 *  de 4,5 Mo d'une requête Vercel, même en AAC d'iPhone. */
const MAX_PAR_REPONSE = 1_400_000;
/** Moins de 30 secondes au total, la copie ressemble à tout le monde. */
const MIN_SECONDES = 30;

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "get";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, business_name, contact_prenom, activite")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const siteId = s(site.id);
  /* LES QUESTIONS DE SON MÉTIER — voir `questionsVoix`. */
  const QUESTIONS_VOIX = questionsVoix(s(site.activite));

  /* L'ÉTAT DE SA VOIX. Lu à part : sans la migration, la carte dit simplement
     que la fonction arrive, au lieu de faire tomber l'Espace Pro. */
  let voix: Record<string, unknown> = {};
  let migree = true;
  try {
    const { data: v, error } = await supabase
      .from("human_vitrine_sites")
      .select("double_voix_id, double_voix_prenom, double_voix_accord_at, double_voix_cree_at")
      .eq("id", siteId)
      .maybeSingle();
    if (error) migree = false;
    voix = (v as Record<string, unknown> | null) ?? {};
  } catch {
    migree = false;
  }
  const etat = () => ({
    ok: true,
    disponible: clonageDisponible() && migree,
    donnee: !!s(voix.double_voix_id) && !!s(voix.double_voix_accord_at),
    prenom: s(voix.double_voix_prenom) || s(site.contact_prenom).split(/\s+/)[0] || "",
    creeLe: s(voix.double_voix_cree_at) || null,
    accord: ACCORD_VOIX,
    questions: QUESTIONS_VOIX,
  });

  if (action === "get") return NextResponse.json(etat());
  if (!migree) return NextResponse.json({ error: "La fonction n'est pas encore activée (base à mettre à jour)." }, { status: 503 });

  if (action === "supprimer") {
    const ancien = s(voix.double_voix_id);
    if (ancien && !(await supprimerVoixClonee(ancien))) {
      return NextResponse.json({ error: "La suppression n'a pas abouti. Réessayez dans un instant." }, { status: 502 });
    }
    const { error } = await supabase
      .from("human_vitrine_sites")
      .update({ double_voix_id: null, double_voix_accord_at: null, double_voix_accord_texte: null, double_voix_recit: null, double_voix_cree_at: null })
      .eq("id", siteId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    oublierLeCommerce(slug);
    voix = {};
    return NextResponse.json(etat());
  }

  if (action === "creer") {
    if (!clonageDisponible()) return NextResponse.json({ error: "La création de voix n'est pas encore activée sur ClikMe." }, { status: 503 });
    /* PAS D'ACCORD, RIEN NE PART. Le texte accepté est celui du serveur, pas
       celui que le navigateur prétend avoir affiché. */
    if (p?.accord !== true) return NextResponse.json({ error: "Il faut cocher votre accord." }, { status: 400 });
    const prenom = s(p?.prenom).replace(/[^\p{L}\s'’-]/gu, "").slice(0, 30);
    if (!prenom) return NextResponse.json({ error: "Indiquez le prénom que portera votre double." }, { status: 400 });
    const brut = Array.isArray(p?.reponses) ? (p?.reponses as unknown[]) : [];
    const secondes = Number(p?.secondes) || 0;
    const enregistrements = brut
      .map((x, i) => (typeof x === "string" && x.length <= MAX_PAR_REPONSE ? lireEnregistrement(x, i) : null))
      .filter((x): x is Enregistrement => !!x)
      .slice(0, QUESTIONS_VOIX.length);
    if (enregistrements.length < 2 || secondes < MIN_SECONDES) {
      return NextResponse.json({ error: `Il faut au moins ${MIN_SECONDES} secondes de voix en tout. Répondez un peu plus longuement.` }, { status: 400 });
    }

    const cree = await creerVoixClonee(`${s(site.business_name)} (${prenom})`, enregistrements);
    if (!cree.ok) return NextResponse.json({ error: cree.erreur }, { status: 502 });

    /* CE QU'IL A RACONTÉ, EN TEXTE — en parallèle, et sans jamais bloquer : une
       transcription ratée coûte une information, pas sa voix. */
    const textes = await Promise.all(enregistrements.map((e) => transcrireReponse(e)));
    const recit = textes
      .map((t, i) => (t ? `${QUESTIONS_VOIX[i]}\n${t}` : ""))
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 2500);

    const ancien = s(voix.double_voix_id);
    const maintenant = new Date().toISOString();
    const { error } = await supabase
      .from("human_vitrine_sites")
      .update({
        double_voix_id: cree.voixId,
        double_voix_prenom: prenom,
        double_voix_accord_at: maintenant,
        double_voix_accord_texte: ACCORD_VOIX,
        double_voix_recit: recit || null,
        double_voix_cree_at: maintenant,
      })
      .eq("id", siteId);
    if (error) {
      await supprimerVoixClonee(cree.voixId);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    /* L'ANCIENNE VOIX PART APRÈS, pas avant : si la nouvelle avait échoué, il
       aurait perdu les deux. */
    if (ancien && ancien !== cree.voixId) await supprimerVoixClonee(ancien);
    oublierLeCommerce(slug);
    voix = { double_voix_id: cree.voixId, double_voix_prenom: prenom, double_voix_accord_at: maintenant, double_voix_cree_at: maintenant };
    return NextResponse.json({ ...etat(), recit: !!recit });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
