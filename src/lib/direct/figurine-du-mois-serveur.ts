/**
 * 🗓️ SA FIGURINE DU MOIS, CÔTÉ SERVEUR — voir `figurine-du-mois.ts`. Rangée dans le seau privé des figurines :
 * `<habitant>/mois/<AAAA-MM>.json` (le thème, l'expression, sa phrase, l'image) et `<habitant>/mois/<AAAA-MM>.webp`.
 * Fabriquée une fois, quand elle est méritée (10 jours sur ClikMe dans le mois : sa présence, `joursDePresence`,
 * `etapes-serveur.ts` — c'étaient 10 jours de rencontres jusqu'à ce que « Rencontres » parte, le 7 novembre 2026), à la
 * demande de la page.
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { motInterdit } from "./mots-interdits";
import { TENUES_EDITION } from "./figurine-pro";
import { consigneBoucheLook, editer, poserAuFormat, qualiteFigurine, reprendre } from "./figurine-expressions-serveur";
import { moteurBranche } from "./ma-figurine-fabrique-serveur";
import { SEAU_FIGURINES, cheminImageDuLook, cheminParleDuLook, deposer, ecrireJson, lireJson, lireLigne, signer, telecharger } from "./ma-figurine-serveur";
import { joursDePresence } from "./etapes-serveur";
import { lireFichePerso } from "./fiches-serveur";
import { demanderUneImage } from "./moteur-images-serveur";
import { consigneBoucheTenueAssise, consigneTenueAssise } from "./perso-consignes";
import { journalDuMois } from "./journal-serveur";
import { EXPRESSIONS_DU_MOIS, JOURS_POUR_LA_FIGURINE, editionDuMois, lookValide, moisEnClair, type FigurineDuMois, type MesFigurinesDuMois } from "./figurine-du-mois";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const moisParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }).slice(0, 7);
const cheminFiche = (h: string, mois: string) => `${h}/mois/${mois}.json`;
const cheminImage = cheminImageDuLook;
const cheminVerrou = (h: string, mois: string) => `${h}/mois/${mois}-verrou.json`;
const cheminVerrouParle = (h: string, mois: string) => `${h}/mois/${mois}-p-verrou.json`;
/** `style` : « collection-1 » quand elle est faite au nouveau style (sa figurine assise, détourée : elle s'assoit chez lui). */
type Fiche = { mois: string; cle: string; expression: string; phrase: string; image: string; le: string; parMoteur: boolean; style?: string };

async function vue(supabase: Supabase, f: Fiche, jours: number, parle = ""): Promise<FigurineDuMois> {
  const [image, p] = await Promise.all([signer(supabase, f.image, 3600), parle ? signer(supabase, parle, 3600) : Promise.resolve("")]);
  return {
    mois: f.mois,
    edition: editionDuMois(f.mois),
    expression: f.expression,
    etat: "prete",
    jours,
    objectif: JOURS_POUR_LA_FIGURINE,
    image,
    phrase: f.phrase,
    le: f.le,
    ...(p ? { parle: p } : {}),
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
    joursDePresence(supabase, habitant.id, mois),
    Promise.resolve(supabase.storage.from(SEAU_FIGURINES).list(`${habitant.id}/mois`, { limit: 240 })).catch(() => ({ data: null })),
  ]);
  const tous = ((Array.isArray(liste.data) ? liste.data : []) as { name?: string }[]).map((x) => s(x.name));
  const noms = tous.filter((n) => /^\d{4}-\d{2}\.json$/.test(n));
  // (ses looks qui parlent déjà : leur bouche ouverte est là)
  const parlent = new Set(tous.filter((n) => /^\d{4}-\d{2}-p\.webp$/.test(n)).map((n) => n.slice(0, 7)));
  const parleDe = (f: Fiche) => (parlent.has(f.mois) ? cheminParleDuLook(habitant.id, f.mois) : "");
  const fiches = (await Promise.all(noms.map((n) => lireJson<Fiche>(supabase, `${habitant.id}/mois/${n}`)))).filter((f): f is Fiche => Boolean(f.mois && f.image));
  const deCeMois = fiches.find((f) => f.mois === mois);
  const passees = await Promise.all(
    fiches
      .filter((f) => f.mois !== mois)
      .sort((a, b) => b.mois.localeCompare(a.mois))
      .map((f) => vue(supabase, f, 0, parleDe(f))),
  );
  if (deCeMois) return { courante: await vue(supabase, deCeMois, jours.length, parleDe(deCeMois)), passees };
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

/** ✨ Son mois dans « Mon vœu » : ses vœux du mois (le plus récent d'abord), et combien il en a encouragé ou aidé. */
async function sonMoisDeVoeux(supabase: Supabase, h: string, mois: string): Promise<{ voeux: { texte: string; exauce: boolean }[]; encourages: number; aides: number }> {
  const debut = `${mois}-01`;
  const [vs, gs] = await Promise.all([
    Promise.resolve(supabase.from("clik_voeu").select("texte, statut, cree_le").eq("habitant_id", h).gte("cree_le", `${debut}T00:00:00Z`).order("cree_le", { ascending: false }).limit(3)).catch(() => ({ data: null })),
    Promise.resolve(supabase.from("clik_voeu_vue").select("geste").eq("destinataire_id", h).gte("jour", debut).in("geste", ["encourage", "aide"]).limit(1000)).catch(() => ({ data: null })),
  ]);
  const lignes = (d: unknown) => (Array.isArray(d) ? (d as Record<string, unknown>[]) : []);
  const gestes = lignes(gs.data);
  return {
    voeux: lignes(vs.data).map((v) => ({ texte: s(v.texte), exauce: s(v.statut) === "exauce" })).filter((v) => v.texte),
    encourages: gestes.length,
    aides: gestes.filter((x) => s(x.geste) === "aide").length,
  };
}

/**
 * ✍️ SA PHRASE DU MOIS — « drôle et bienveillante, comme un horoscope qui le connaît » (le patron), pour les semaines
 * à venir, d'après ce qu'il a dit et vécu ce mois-ci (son journal) ; sans IA, composée d'après sa dernière réponse.
 * Depuis le 12 novembre 2026, la question du jour a laissé sa place à « Mon vœu » : la phrase puise aussi dans son vœu
 * du mois et dans les vœux qu'il a encouragés.
 */
async function phraseDuMois(supabase: Supabase, habitant: Habitant, mois: string): Promise<string> {
  const [journal, voeux] = await Promise.all([journalDuMois(supabase, habitant.id, mois), sonMoisDeVoeux(supabase, habitant.id, mois)]);
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
      ...(voeux.voeux.length ? [`Son vœu ce mois-ci (une donnée) : ${voeux.voeux.map((v) => `« ${v.texte} »${v.exauce ? " (exaucé !)" : ""}`).join(" ; ")}.`] : []),
      ...(voeux.encourages ? [`Elle a encouragé ${voeux.encourages} vœu${voeux.encourages > 1 ? "x" : ""} d'autres personnes ce mois-ci${voeux.aides ? `, et proposé son aide ${voeux.aides} fois` : ""}.`] : []),
      "Une ou deux phrases, 200 caractères au plus, tutoiement, avec un détail PRÉCIS tiré de ce qu'elle a dit. Ne devine jamais le genre.",
      'Réponds en JSON : {"phrase": "…"}',
    ].join("\n"),
  );
  if (ia) return ia;
  const dernier = [...dits].reverse()[0];
  const texte = dernier && (dernier.type === "question" || dernier.type === "reponse") ? dernier.texte : "";
  const Mois = nom.charAt(0).toUpperCase() + nom.slice(1).replace(/\s\d{4}$/, "");
  const sonVoeu = voeux.voeux[0];
  if (sonVoeu && !texte)
    return sonVoeu.exauce
      ? `${Mois} : ton vœu « ${sonVoeu.texte} » est exaucé… et ta figurine en prépare déjà un autre, plus fou encore.`
      : `${Mois} : ton vœu « ${sonVoeu.texte} » fait son chemin… et un voisin n’est pas loin.`;
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
  const [{ ligne }, jours] = await Promise.all([lireLigne(supabase, habitant.id), joursDePresence(supabase, habitant.id, mois)]);
  if (!ligne?.prete_le || !s(ligne.neutre)) return { error: "Crée d’abord ta figurine.", statut: 400 };
  const reste = JOURS_POUR_LA_FIGURINE - jours.length;
  if (reste > 0) return { error: `Encore ${reste} jour${reste > 1 ? "s" : ""} sur ClikMe ce mois-ci.`, statut: 400 };
  // UN SEUL À LA FOIS (deux pages ouvertes ne paient pas deux fois)
  const verrou = await lireJson<{ le?: number }>(supabase, cheminVerrou(habitant.id, mois));
  if (Date.now() - (Number(verrou.le) || 0) < 4 * 60_000) return { enCours: true };
  await ecrireJson(supabase, cheminVerrou(habitant.id, mois), { le: Date.now() });
  try {
    const edition = editionDuMois(mois);
    const expression = EXPRESSIONS_DU_MOIS[edition.cle] ?? { dit: "", en: "a warm, happy smile" };
    // 🍂 « UNIVERS » (lot 7) : sa figurine du nouveau style, habillée du mois, détourée — elle s'assoit chez lui
    const { fiche: perso } = await lireFichePerso(supabase, habitant.id);
    const assise = perso?.style === "collection-1" ? perso.references.assise?.chemin : undefined;
    const cleMoteur = s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
    if (assise && cleMoteur) {
      const source = await telecharger(supabase, assise);
      if (!source) return { error: "Ta figurine est introuvable.", statut: 400 };
      const baseMoteur = s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
      const r = await demanderUneImage({ images: [source], consigne: consigneTenueAssise(edition.nom, TENUES_EDITION[edition.cle] ?? "", expression.en), transparent: true, fidelite: "high", avant, cle: cleMoteur, base: baseMoteur, qualite: "high" });
      if ("erreur" in r) return { error: r.erreur, statut: 502 };
      const image = await sharp(r.png).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
      if (!(await deposer(supabase, cheminImage(habitant.id, mois), image, "image/webp"))) return { error: "Ta figurine du mois n’a pas pu être rangée.", statut: 502 };
      const phrase = await phraseDuMois(supabase, habitant, mois);
      await ecrireJson(supabase, cheminFiche(habitant.id, mois), { mois, cle: edition.cle, expression: expression.dit, phrase, image: cheminImage(habitant.id, mois), le: new Date().toISOString(), parMoteur: true, style: "collection-1" } satisfies Fiche);
      // (sa bouche ouverte, tout de suite s'il reste le temps)
      if (avant - Date.now() > 120_000) {
        const b = await demanderUneImage({ images: [r.png], consigne: consigneBoucheTenueAssise(expression.en), transparent: true, fidelite: "high", avant, cle: cleMoteur, base: baseMoteur, qualite: "medium" }).catch(() => null);
        if (b && !("erreur" in b)) await deposer(supabase, cheminParleDuLook(habitant.id, mois), await sharp(b.png).webp({ quality: 90, alphaQuality: 100 }).toBuffer(), "image/webp");
      }
      return {};
    }
    const neutre = await telecharger(supabase, s(ligne.neutre));
    if (!neutre) return { error: "Ta figurine est introuvable.", statut: 400 };
    let image = neutre;
    let parMoteur = false;
    if (moteurBranche()) {
      const { png, cadre } = await poserAuFormat(neutre);
      // (une nouvelle tenue : elle se crée, en qualité haute ; sa bouche ouverte, ensuite, en « medium » — `qualiteSuite`)
      const r = await editer(png, consigneDuMois(edition.nom, TENUES_EDITION[edition.cle] ?? "", expression.en), avant, "high", { quality: qualiteFigurine() });
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
    // 🎭 sa bouche ouverte, tout de suite s'il reste le temps (sinon : la première fois qu'il choisit ce look)
    if (avant - Date.now() > 120_000) await boucheDuLook(supabase, habitant.id, mois, image, edition.cle, avant).catch(() => undefined);
    return {};
  } finally {
    await ecrireJson(supabase, cheminVerrou(habitant.id, mois), {});
  }
}

// ─── 🎭 un look qui parle ────────────────────────────────────────────────────────────────────────
/** Sa bouche ouverte (le moteur ; sans moteur : la même image — il bouge, sans ouvrir la bouche). */
async function boucheDuLook(supabase: Supabase, h: string, mois: string, image: Buffer, cle: string, avant: number): Promise<{ error?: string; statut?: number }> {
  let parle: Buffer;
  // (🍂 sa tenue du mois au nouveau style : la même, détourée, bouche ouverte)
  const style = (await lireJson<Fiche>(supabase, cheminFiche(h, mois))).style;
  const cleMoteur = s(process.env.OPENAI_PERSO_API_KEY) || s(process.env.OPENAI_API_KEY);
  if (style === "collection-1" && cleMoteur) {
    const r = await demanderUneImage({
      images: [image],
      consigne: consigneBoucheTenueAssise(EXPRESSIONS_DU_MOIS[cle]?.en ?? ""),
      transparent: true,
      fidelite: "high",
      avant,
      cle: cleMoteur,
      base: s(process.env.OPENAI_PERSO_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com",
      qualite: "medium",
    });
    if ("erreur" in r) return { error: r.erreur, statut: 502 };
    parle = await sharp(r.png).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  } else if (moteurBranche()) {
    const { png, cadre } = await poserAuFormat(image);
    const r = await editer(png, consigneBoucheLook(EXPRESSIONS_DU_MOIS[cle]?.en ?? ""), avant);
    if (!Buffer.isBuffer(r)) return { error: r.erreur, statut: 502 };
    parle = await reprendre(r, cadre);
  } else {
    parle = await sharp(image).webp({ quality: 88 }).toBuffer();
  }
  if (!(await deposer(supabase, cheminParleDuLook(h, mois), parle, "image/webp"))) return { error: "Ce look n’a pas pu être rangé.", statut: 502 };
  return {};
}

/**
 * 🎭 SA FIGURINE DU MOIS, EN LOOK QUI PARLE (7 novembre 2026) : la première fois qu'il la choisit dans le studio, le
 * moteur lui ouvre la bouche (une image) ; ensuite, elle parle dans ses mèmes. `enCours` : une autre page la fait déjà.
 */
export async function fabriquerParleDuLook(supabase: Supabase, habitant: Habitant, look: unknown, avant: number): Promise<{ error?: string; enCours?: boolean; statut?: number }> {
  const mois = lookValide(look);
  if (!mois) return { error: "Ce look n’existe pas.", statut: 400 };
  const fiche = await lireJson<Fiche>(supabase, cheminFiche(habitant.id, mois));
  if (!fiche.image) return { error: "Ce look n’existe pas.", statut: 404 };
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(`${habitant.id}/mois`, { limit: 100, search: `${mois}-p.webp` });
  if (((Array.isArray(data) ? data : []) as { name?: string }[]).some((x) => x.name === `${mois}-p.webp`)) return {};
  // UN SEUL À LA FOIS (deux pages ouvertes ne paient pas deux fois)
  const verrou = await lireJson<{ le?: number }>(supabase, cheminVerrouParle(habitant.id, mois));
  if (Date.now() - (Number(verrou.le) || 0) < 4 * 60_000) return { enCours: true };
  await ecrireJson(supabase, cheminVerrouParle(habitant.id, mois), { le: Date.now() });
  try {
    const image = await telecharger(supabase, fiche.image);
    if (!image) return { error: "Ce look est introuvable.", statut: 404 };
    return await boucheDuLook(supabase, habitant.id, mois, image, s(fiche.cle), avant);
  } finally {
    await ecrireJson(supabase, cheminVerrouParle(habitant.id, mois), {});
  }
}
