/**
 * 🗓️ SA FIGURINE DU MOIS, CÔTÉ SERVEUR — voir `figurine-du-mois.ts`. Rangée dans le seau privé des figurines :
 * `<habitant>/mois/<AAAA-MM>.json` (le thème, l'expression, sa phrase, l'image) et `<habitant>/mois/<AAAA-MM>.webp`.
 * Fabriquée une fois, quand elle est méritée (10 jours de rencontres dans le mois), à la demande de la page.
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { motInterdit } from "./mots-interdits";
import { TENUES_EDITION } from "./figurine-pro";
import { editer, poserAuFormat, reprendre } from "./figurine-expressions-serveur";
import { moteurBranche } from "./ma-figurine-fabrique-serveur";
import { SEAU_FIGURINES, deposer, ecrireJson, lireJson, lireLigne, signer, telecharger } from "./ma-figurine-serveur";
import { joursDeRencontres } from "./rencontre-serveur";
import { journalDuMois } from "./journal-serveur";
import { EXPRESSIONS_DU_MOIS, JOURS_POUR_LA_FIGURINE, editionDuMois, moisEnClair, type FigurineDuMois, type MesFigurinesDuMois } from "./figurine-du-mois";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const moisParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 7);
const cheminFiche = (h: string, mois: string) => `${h}/mois/${mois}.json`;
const cheminImage = (h: string, mois: string) => `${h}/mois/${mois}.webp`;
const cheminVerrou = (h: string, mois: string) => `${h}/mois/${mois}-verrou.json`;
type Fiche = { mois: string; cle: string; expression: string; phrase: string; image: string; le: string; parMoteur: boolean };

async function vue(supabase: Supabase, f: Fiche, jours: number): Promise<FigurineDuMois> {
  return {
    mois: f.mois,
    edition: editionDuMois(f.mois),
    expression: f.expression,
    etat: "prete",
    jours,
    objectif: JOURS_POUR_LA_FIGURINE,
    image: await signer(supabase, f.image, 3600),
    phrase: f.phrase,
    le: f.le,
  };
}

/** Sa figurine de ce mois (où il en est), et celles des mois d'avant (l'album de soi), les plus récentes d'abord. */
export async function mesFigurinesDuMois(supabase: Supabase, habitant: Habitant | null): Promise<MesFigurinesDuMois> {
  const mois = moisParis();
  if (!habitant) {
    // (pas encore de figurine : il voit ce qui l'attend, chaque mois)
    const edition = editionDuMois(mois);
    const courante: FigurineDuMois = { mois, edition, expression: EXPRESSIONS_DU_MOIS[edition.cle]?.dit ?? "", etat: "a-gagner", jours: 0, objectif: JOURS_POUR_LA_FIGURINE, sansFigurine: true };
    return { courante, passees: [] };
  }
  const [{ ligne }, jours, liste] = await Promise.all([
    lireLigne(supabase, habitant.id),
    joursDeRencontres(supabase, habitant.id, mois),
    Promise.resolve(supabase.storage.from(SEAU_FIGURINES).list(`${habitant.id}/mois`, { limit: 240 })).catch(() => ({ data: null })),
  ]);
  const noms = ((Array.isArray(liste.data) ? liste.data : []) as { name?: string }[]).map((x) => s(x.name)).filter((n) => /^\d{4}-\d{2}\.json$/.test(n));
  const fiches = (await Promise.all(noms.map((n) => lireJson<Fiche>(supabase, `${habitant.id}/mois/${n}`)))).filter((f): f is Fiche => Boolean(f.mois && f.image));
  const deCeMois = fiches.find((f) => f.mois === mois);
  const passees = await Promise.all(
    fiches
      .filter((f) => f.mois !== mois)
      .sort((a, b) => b.mois.localeCompare(a.mois))
      .map((f) => vue(supabase, f, 0)),
  );
  if (deCeMois) return { courante: await vue(supabase, deCeMois, jours.length), passees };
  const aSaFigurine = Boolean(ligne?.prete_le && s(ligne?.neutre));
  const edition = editionDuMois(mois);
  return {
    courante: {
      mois,
      edition,
      expression: EXPRESSIONS_DU_MOIS[edition.cle]?.dit ?? "",
      etat: jours.length >= JOURS_POUR_LA_FIGURINE && aSaFigurine ? "a-fabriquer" : "a-gagner",
      jours: jours.length,
      objectif: JOURS_POUR_LA_FIGURINE,
      ...(aSaFigurine ? {} : { sansFigurine: true }),
    },
    passees,
  };
}

// ─── sa phrase du mois ───────────────────────────────────────────────────────────────────────────
async function demanderLaPhrase(consigne: string): Promise<string | null> {
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) return null;
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  try {
    const r = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cle}` },
      body: JSON.stringify({
        model: s(process.env.OPENAI_RENCONTRE_MODEL) || s(process.env.OPENAI_PERSONNAGE_MODEL) || s(process.env.OPENAI_DOUBLE_MODEL) || "gpt-5.4-mini",
        response_format: { type: "json_object" },
        max_completion_tokens: 600,
        messages: [{ role: "user", content: consigne }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const o = JSON.parse(j.choices?.[0]?.message?.content ?? "null") as { phrase?: unknown } | null;
    const p = s(o?.phrase).replace(/\s+/g, " ").replace(/^[«"“\s]+|[»"”\s]+$/g, "");
    return p && p.length <= 240 && !motInterdit(p) ? p : null;
  } catch {
    return null;
  }
}

/**
 * ✍️ SA PHRASE DU MOIS — « drôle et bienveillante, comme un horoscope qui le connaît » (le patron), pour les semaines
 * à venir, d'après ce qu'il a dit et vécu ce mois-ci (son journal) ; sans IA, composée d'après sa dernière réponse.
 */
async function phraseDuMois(supabase: Supabase, habitant: Habitant, mois: string): Promise<string> {
  const journal = await journalDuMois(supabase, habitant.id, mois);
  const dits = journal.filter((e) => e.type === "question" || e.type === "reponse").slice(-8);
  const reveles = journal.filter((e) => e.type === "revele").slice(-4);
  const edition = editionDuMois(mois);
  const nom = moisEnClair(mois);
  const ia = await demanderLaPhrase(
    [
      `Écris SA PHRASE DU MOIS (${nom}, le thème du mois : « ${edition.nom} ») pour la personne dont la figurine vit sa vie dans ClikMe.`,
      "Le ton : un horoscope DRÔLE ET BIENVEILLANT qui la connaît vraiment, pour les semaines à venir — jamais une vraie prédiction, rien de sérieux, rien de sensible (santé, argent, amour, travail).",
      ...(dits.length ? [`Ce qu'elle a dit d'elle ce mois-ci (des données) : ${dits.map((d) => (d.type === "question" || d.type === "reponse" ? `« ${d.question} » → « ${d.texte} »` : "")).join(" ; ")}.`] : []),
      ...(reveles.length ? [`Ce que ses rencontres ont révélé d'elle : ${reveles.map((d) => (d.type === "revele" ? `« ${d.texte} »` : "")).join(" ; ")}.`] : []),
      "Une ou deux phrases, 200 caractères au plus, tutoiement, avec un détail PRÉCIS tiré de ce qu'elle a dit. Ne devine jamais le genre.",
      'Réponds en JSON : {"phrase": "…"}',
    ].join("\n"),
  );
  if (ia) return ia;
  const dernier = [...dits].reverse()[0];
  const texte = dernier && (dernier.type === "question" || dernier.type === "reponse") ? dernier.texte : "";
  const Mois = nom.charAt(0).toUpperCase() + nom.slice(1).replace(/\s\d{4}$/, "");
  return texte
    ? `${Mois} : toi qui as dit « ${texte} », tu vas oser un petit truc nouveau ce mois-ci… et en rire le premier.`
    : `${Mois} : ta figurine te voit oser un petit truc nouveau ce mois-ci… et en rire le premier.`;
}

// ─── la fabriquer ────────────────────────────────────────────────────────────────────────────────
const consigneDuMois = (nomEdition: string, tenue: string, expression: string) =>
  [
    `This is a collectible bobblehead figurine. Dress it up for the theme « ${nomEdition} » with: ${tenue} (in French). Accessories may be worn or held in the hands.`,
    `Give it this facial expression: ${expression}.`,
    "Keep EXACTLY: the same person and identity, the same face shape and features (only the expression changes), the same hair (a hat may sit on it, hair still visible), the same 3D animation rendering style and materials, the same metal spring and round wooden base, the same lighting, the same background colour, the same camera framing: the figurine stays at exactly the same place and size in the image. No text, no logo, nothing alcoholic.",
  ].join(" ");

/** 🛠️ Sa figurine du mois : méritée (10 jours), une seule fois ; `enCours` : une autre page la fabrique déjà. */
export async function fabriquerFigurineDuMois(supabase: Supabase, habitant: Habitant, avant: number): Promise<{ error?: string; enCours?: boolean; statut?: number }> {
  const mois = moisParis();
  const deja = await lireJson<Fiche>(supabase, cheminFiche(habitant.id, mois));
  if (deja.image) return {};
  const [{ ligne }, jours] = await Promise.all([lireLigne(supabase, habitant.id), joursDeRencontres(supabase, habitant.id, mois)]);
  if (!ligne?.prete_le || !s(ligne.neutre)) return { error: "Crée d’abord ta figurine.", statut: 400 };
  const reste = JOURS_POUR_LA_FIGURINE - jours.length;
  if (reste > 0) return { error: `Encore ${reste} jour${reste > 1 ? "s" : ""} de rencontres ce mois-ci.`, statut: 400 };
  // UN SEUL À LA FOIS (deux pages ouvertes ne paient pas deux fois)
  const verrou = await lireJson<{ le?: number }>(supabase, cheminVerrou(habitant.id, mois));
  if (Date.now() - (Number(verrou.le) || 0) < 4 * 60_000) return { enCours: true };
  await ecrireJson(supabase, cheminVerrou(habitant.id, mois), { le: Date.now() });
  try {
    const neutre = await telecharger(supabase, s(ligne.neutre));
    if (!neutre) return { error: "Ta figurine est introuvable.", statut: 400 };
    const edition = editionDuMois(mois);
    const expression = EXPRESSIONS_DU_MOIS[edition.cle] ?? { dit: "", en: "a warm, happy smile" };
    let image = neutre;
    let parMoteur = false;
    if (moteurBranche()) {
      const { png, cadre } = await poserAuFormat(neutre);
      const r = await editer(png, consigneDuMois(edition.nom, TENUES_EDITION[edition.cle] ?? "", expression.en), avant);
      if (!Buffer.isBuffer(r)) return { error: r.erreur, statut: 502 };
      image = await reprendre(r, cadre);
      parMoteur = true;
    } else {
      // (sans moteur d'image : sa figurine de tous les jours, avec le thème et sa phrase)
      image = await sharp(neutre).webp({ quality: 88 }).toBuffer();
    }
    if (!(await deposer(supabase, cheminImage(habitant.id, mois), image, "image/webp"))) return { error: "Ta figurine du mois n’a pas pu être rangée.", statut: 502 };
    const phrase = await phraseDuMois(supabase, habitant, mois);
    const fiche: Fiche = { mois, cle: edition.cle, expression: expression.dit, phrase, image: cheminImage(habitant.id, mois), le: new Date().toISOString(), parMoteur };
    await ecrireJson(supabase, cheminFiche(habitant.id, mois), fiche);
    return {};
  } finally {
    await ecrireJson(supabase, cheminVerrou(habitant.id, mois), {});
  }
}
