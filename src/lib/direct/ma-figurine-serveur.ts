/**
 * 🗣️ SA PROPRE FIGURINE, CÔTÉ SERVEUR — voir `ma-figurine.ts` pour la règle, et la migration
 * `20261106090000_clik_ma_figurine.sql`.
 *
 * TOUT EST PRIVÉ : sa photo, ses deux images et ses messages vont dans le seau `figurines-clients`, sans adresse
 * publique. Les images partent en adresses signées (une heure) ; la voix passe par notre route
 * (`/api/direct/ma-figurine/son`), pour que le navigateur puisse la lire ET faire bouger la bouche dessus.
 *
 * SANS LA MIGRATION : « bientôt ».
 *
 * DÈS LE DÉPART (4 novembre 2026) : plus de seuil. Sa photo → le moteur d'image fabrique sa figurine (`fabriquerMaFigurine`,
 * `ma-figurine-fabrique-serveur.ts`), dans `<habitant>/fab-<jeton>/` ; « Refaire » change de jeton. Ses options
 * (`OPTIONS_FIGURINE`) s'ouvrent avec ses figurines gagnées, et le serveur les tient (visages, voix, cadre doré).
 *
 * LA DÉMONSTRATION (la figurine du propriétaire, qu'on fait parler sans compte) vit dans le même seau, sous
 * `demo-proprio/v1/` : ses expressions (`expr/`), les textes déjà lus (`voix/`, repris sans repayer), les messages
 * envoyés (`messages/<id>.json`) et les compteurs du jour (`jour/`). Pas de table : rien à migrer.
 *
 * FICHIER SERVEUR.
 */
import { createHash, randomBytes } from "crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { cadeauxDe } from "./etapes-serveur";
import { famillesDe } from "./famille-serveur";
import { figurineDu } from "./figurines-commerces";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import {
  AGE_MINIMUM,
  ERREUR_AGE,
  SANS_AGE_TEXTE,
  COMMERCES_MAX_MESSAGE,
  DUREE_MAX_MESSAGE,
  IMAGES_DEMO,
  MEMES_VUS,
  type ApercuMeme,
  type MemePublic,
  type MesMemes,
  type MonMeme,
  type ReponseAMonMeme,
  figurinesEnTout,
  idMessageValide,
  prenomValide,
  sentimentValide,
  SENTIMENTS_EN_BASE,
  danseValide,
  texteValide,
  voixValide,
  universValide,
  type CommerceCite,
  type Sentiment,
  type EtatMaFigurine,
  type Expressions,
  type MessageFigurine,
} from "./ma-figurine";
import { renduGarde } from "./rendus";
import { expressionsCompletes, expressionsDe, fabriquerUnTour, type Depot } from "./figurine-expressions-serveur";
import { adresseMasquee } from "./connaitre";
import { lireLeTexte, voixBranchee } from "./voix-figurine-serveur";
import { lookValide } from "./figurine-du-mois";
import { jourAvant } from "@/lib/jour-paris";
import { reactionsDe } from "./reactions-memes-serveur";
import { themeDuJour, type EtatDuJour } from "./theme-du-jour";
import { motInterdit } from "./mots-interdits";
import { FABRICATIONS_PAR_JOUR, NOM_NEUTRE, NOM_PARLE, fabricationsParJourPourTous, fabriquerUnPas, moteurBranche } from "./ma-figurine-fabrique-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
type Ligne = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export const SEAU_FIGURINES = s(process.env.FIGURINES_CLIENTS_BUCKET) || "figurines-clients";
const MESSAGES_PAR_JOUR = 30;

// ─── le stockage privé ────────────────────────────────────────────────────────────────────────
export async function deposer(supabase: Supabase, chemin: string, octets: Buffer, type: string): Promise<boolean> {
  const envoyer = () => supabase.storage.from(SEAU_FIGURINES).upload(chemin, octets, { contentType: type, upsert: true });
  let { error } = await envoyer();
  if (error && /bucket/i.test(error.message)) {
    // le seau n'existe pas encore (la migration le crée aussi) : on le crée, privé
    await supabase.storage.createBucket(SEAU_FIGURINES, { public: false });
    ({ error } = await envoyer());
  }
  return !error;
}

export async function signer(supabase: Supabase, chemin: string, secondes = 3600): Promise<string> {
  if (!chemin) return "";
  const { data } = await supabase.storage.from(SEAU_FIGURINES).createSignedUrl(chemin, secondes);
  return s(data?.signedUrl);
}

const empreinte = (b: Buffer | string) => createHash("sha1").update(b).digest("hex").slice(0, 16);

export async function telecharger(supabase: Supabase, chemin: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(SEAU_FIGURINES).download(chemin);
  return error || !data ? null : Buffer.from(await data.arrayBuffer());
}

/** Ce fichier est-il dans ce dossier du seau ? (sans le télécharger) */
async function existe(supabase: Supabase, dossier: string, nom: string): Promise<boolean> {
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: 100, search: nom });
  return ((Array.isArray(data) ? data : []) as { name?: string }[]).some((x) => x.name === nom);
}

// ─── 🎭 ses expressions : un dossier par figurine (un nouveau visage : un nouveau dossier) ──────────────────
/** Un dossier du seau, vu comme un `Depot` (`figurine-expressions-serveur.ts`). */
export function depotDans(supabase: Supabase, dossier: string): Depot {
  return {
    lister: async () => {
      const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: 100 });
      return ((Array.isArray(data) ? data : []) as { name?: string }[]).map((f) => s(f.name)).filter(Boolean);
    },
    lire: (nom) => telecharger(supabase, `${dossier}/${nom}`),
    ecrire: (nom, octets, type) => deposer(supabase, `${dossier}/${nom}`, octets, type),
    effacer: async (nom) => void (await supabase.storage.from(SEAU_FIGURINES).remove([`${dossier}/${nom}`])),
  };
}
export const dossierExpressions = (habitantId: string, neutre: string) => `${habitantId}/expr-${empreinte(neutre)}`;
/** 🗓️ Ses looks (ses figurines du mois, `figurine-du-mois-serveur.ts`) : l'image, et sa bouche ouverte. */
export const cheminImageDuLook = (h: string, mois: string) => `${h}/mois/${mois}.webp`;
export const cheminParleDuLook = (h: string, mois: string) => `${h}/mois/${mois}-p.webp`;
/**
 * ↩️ LES RÉPONSES À SES MÈMES : une marque par réponse, dans SON dossier (`rep-<son mème>-<la réponse>.json`) — une
 * par fichier, pour qu'aucune ne se perde quand deux arrivent en même temps. « Mes mèmes » les liste.
 */
const cheminReponse = (h: string, a: string, id: string) => `${h}/rep-${a}-${id}.json`;
/** 👣 Il a répondu en duo à un mème (une étape de ses premiers pas). */
export const cheminDuo = (h: string) => `${h}/duo.json`;
/** La démonstration (la figurine du propriétaire) : ses expressions, les textes lus, les messages envoyés. */
const DOSSIER_DEMO = "demo-proprio/v1";

/** Ses expressions faites, en adresses signées. */
export async function expressionsSignees(supabase: Supabase, dossier: string, secondes = 3600): Promise<{ expressions: Expressions; complete: boolean }> {
  const noms = await depotDans(supabase, dossier).lister();
  const faites = expressionsDe(noms);
  const expressions: Expressions = {};
  await Promise.all(
    Object.entries(faites).map(async ([cle, im]) => {
      const [n, p] = await Promise.all([signer(supabase, `${dossier}/${im!.n}`, secondes), signer(supabase, `${dossier}/${im!.p}`, secondes)]);
      if (n && p) expressions[cle as keyof Expressions] = { n, p };
    }),
  );
  return { expressions, complete: expressionsCompletes(faites) };
}

function image(dataUrl: unknown): Buffer | null {
  const m = /^data:image\/(?:jpeg|jpg|png|webp|heic|heif);base64,(.+)$/i.exec(s(dataUrl));
  if (!m) return null;
  const brut = Buffer.from(m[1], "base64");
  return brut.length && brut.length <= 10 * 1024 * 1024 ? brut : null;
}

// ─── où il en est ──────────────────────────────────────────────────────────────────────────────
async function prenomDe(supabase: Supabase, habitant: Habitant): Promise<string> {
  if (habitant.prenom) return habitant.prenom;
  const { data } = await supabase.from("clik_cage").select("prenom, updated_at").eq("habitant_id", habitant.id).order("updated_at", { ascending: false }).limit(1);
  return s((Array.isArray(data) ? (data[0] as Ligne | undefined) : undefined)?.prenom);
}

export async function lireLigne(supabase: Supabase, habitantId: string): Promise<{ ok: boolean; ligne: Ligne | null }> {
  const { data, error } = await supabase.from("clik_ma_figurine").select("*").eq("habitant_id", habitantId).maybeSingle();
  return { ok: !error, ligne: (data as Ligne | null) ?? null };
}

/** Ses figurines en tout, et les commerces que sa figurine peut citer (ceux où il en a). */
async function sesFigurines(supabase: Supabase, habitantId: string): Promise<{ total: number; commerces: CommerceCite[] }> {
  const familles = await famillesDe(supabase, habitantId);
  return {
    total: figurinesEnTout(familles),
    commerces: familles
      .filter((f) => f.collection && (f.collection.gagnees > 0 || f.collection.trophees.length > 0))
      .map((f) => ({ slug: f.slug, nom: f.nom, figurine: f.figurine ?? "/direct/double/pied/salut-1.webp" })),
  };
}

/** Sa fabrication en cours (le moteur) : son dossier (`jeton`), et ses essais du jour. */
type Fabrique = { jeton?: string; jour?: string; essais?: number };
const cheminFabrique = (habitantId: string) => `${habitantId}/fabrique.json`;
/** La voix qu'il a choisie pour sa figurine (« une voix d'homme ou de femme ? ») : `{ voix }`. */
const cheminSaVoix = (habitantId: string) => `${habitantId}/voix.json`;
/** Son univers (son métier ou sa passion, facultatif) : sa figurine s'habille en conséquence. */
const cheminUnivers = (habitantId: string) => `${habitantId}/univers.json`;
/** 🔞 Son âge, déclaré (`ma-figurine.ts`, `AGE_MINIMUM`) : le jour où il a dit avoir l'âge (15 ans ou plus). */
const cheminMajeur = (habitantId: string) => `${habitantId}/majeur.json`;
export async function aConfirmeSonAge(supabase: Supabase, habitantId: string): Promise<boolean> {
  return Boolean(s((await lireJson<{ le?: string }>(supabase, cheminMajeur(habitantId))).le));
}
export async function confirmerSonAge(supabase: Supabase, habitantId: string): Promise<void> {
  // (sans effacer ce qu'il a dit d'autre : ses 18 ans, pour « Mon vœu », `voeu-serveur.ts`)
  const avant = await lireJson<Record<string, unknown>>(supabase, cheminMajeur(habitantId));
  await ecrireJson(supabase, cheminMajeur(habitantId), { ...avant, le: new Date().toISOString(), age: AGE_MINIMUM });
}
/** Ce que le serveur répond à qui n'a pas dit son âge, quand il veut montrer un mème dans la ville (« Autour », « Découvrir »). */
export const SANS_AGE = { error: SANS_AGE_TEXTE, statut: 403, age: true } as const;
const dossierFabrique = (habitantId: string, jeton: string) => `${habitantId}/fab-${jeton}`;
const nouveauJeton = () => randomBytes(6).toString("hex");
const essaisRestants = (f: Partial<Fabrique>) => Math.max(0, FABRICATIONS_PAR_JOUR - (f.jour === jourParis() ? Number(f.essais) || 0 : 0));

/**
 * 🎭 SES VISAGES, FAITS À LA DEMANDE (le lot 3 : tout est ouvert dès le départ) — chaque visage coûte deux images au
 * moteur : chacun se fabrique la première fois qu'il le choisit (`<habitant>/visages.json`). LA JOIE AUSSI, depuis le
 * 9 novembre 2026 (« 3 ou 4 créations, 50 centimes ») : faite d'office, elle doublait le prix de chaque figurine — deux
 * images de plus, payées aussi par ceux qui ne vont jamais plus loin que la création.
 */
export const cheminVisages = (habitantId: string) => `${habitantId}/visages.json`;
export async function visagesVoulus(supabase: Supabase, habitantId: string): Promise<Sentiment[]> {
  const v = await lireJson<{ voulus?: unknown[] }>(supabase, cheminVisages(habitantId));
  const l = (Array.isArray(v.voulus) ? v.voulus : []).map((x) => sentimentValide(x)).filter((x): x is Sentiment => Boolean(x));
  return [...new Set<Sentiment>(l)];
}

export async function etatMaFigurine(supabase: Supabase, habitant: Habitant | null): Promise<EtatMaFigurine> {
  const vide: EtatMaFigurine = { total: 0, cadeaux: 0, etapes: [], etape: "photo", prenom: "", compte: false, auto: moteurBranche(), commerces: [], messages: [] };
  if (!habitant) return vide;
  const [{ total, commerces }, prenom, { ok, ligne }] = await Promise.all([
    sesFigurines(supabase, habitant.id),
    prenomDe(supabase, habitant),
    lireLigne(supabase, habitant.id),
  ]);
  // 🎁 SES CADEAUX DE CLIKME : ce qui ouvre ses options (plus ses achats)
  const { cadeaux, etapes } = await cadeauxDe(supabase, habitant.id, total);
  const base: EtatMaFigurine = { ...vide, total, cadeaux, etapes, prenom, commerces, compte: true };
  const prete = Boolean(ligne?.prete_le && s(ligne?.neutre) && s(ligne?.parle));
  if (!ok) return { ...base, etape: "bientot" };
  if (!prete && (!ligne || !s(ligne.photo) || s(ligne.refus))) return { ...base, etape: "photo", ...(s(ligne?.refus) ? { refus: s(ligne?.refus) } : {}) };
  if (!prete) {
    // (pendant la fabrication, il prépare déjà son premier mème : la voix qui lit son texte, et celle qu'il a choisie)
    const maVoix = voixValide((await lireJson<{ voix?: string }>(supabase, cheminSaVoix(habitant.id))).voix);
    return { ...base, etape: "fabrication", voixTexte: voixBranchee(), ...(maVoix ? { maVoix } : {}) };
  }
  const [neutre, parle, { data: msgs }, expr, fab, saVoix, sonUnivers, { data: adresse }] = await Promise.all([
    signer(supabase, s(ligne!.neutre)),
    signer(supabase, s(ligne!.parle)),
    supabase.from("clik_figurine_message").select("*").eq("habitant_id", habitant.id).order("created_at", { ascending: false }).limit(20),
    expressionsSignees(supabase, dossierExpressions(habitant.id, s(ligne!.neutre))),
    lireJson<Fabrique>(supabase, cheminFabrique(habitant.id)),
    lireJson<{ voix?: string }>(supabase, cheminSaVoix(habitant.id)),
    lireJson<{ univers?: string }>(supabase, cheminUnivers(habitant.id)),
    Promise.resolve(supabase.from("human_habitants").select("email, email_verifie_le").eq("id", habitant.id).maybeSingle()).catch(() => ({ data: null })),
  ]);
  const verifiee = adresse as { email?: string | null; email_verifie_le?: string | null } | null;
  const maVoix = voixValide(saVoix.voix);
  const ouverts = await visagesVoulus(supabase, habitant.id);
  return {
    ...base,
    etape: "prete",
    neutre,
    parle,
    expressions: expr.expressions,
    expressionsAFaire: ouverts.some((c) => !expr.expressions[c]),
    // (6 novembre 2026 : « il faut juste prévenir que l'expression est en cours de création, et ne pas laisser cliquer dessus »)
    ...(moteurBranche() ? { visagesEnCours: ouverts.filter((c) => !expr.expressions[c]) } : {}),
    voixTexte: voixBranchee(),
    ...(maVoix ? { maVoix } : {}),
    ...(verifiee?.email && verifiee.email_verifie_le ? { protegee: adresseMasquee(verifiee.email) } : {}),
    ...(universValide(sonUnivers.univers) ? { univers: universValide(sonUnivers.univers) } : {}),
    ...(moteurBranche() ? { refaire: essaisRestants(fab) } : {}),
    messages: ((Array.isArray(msgs) ? msgs : []) as Ligne[])
      .filter((m) => !m.retire_le)
      .map((m) => ({
        id: s(m.id),
        le: s(m.created_at),
        ecoutes: Number(m.ecoutes) || 0,
        signale: Boolean(m.signale_le),
        sentiment: sentimentValide(m.sentiment),
        ...(s(m.texte) ? { texte: s(m.texte) } : {}),
      })),
  };
}

/**
 * 🩺 LES DERNIÈRES FABRICATIONS RATÉES (9 novembre 2026, le propriétaire : « sur mobile, “Oups, ça n'a pas marché” —
 * même avec d'autres photos ») : ce que la page a montré, et ce que le moteur a répondu (`detail` : sa raison, jamais
 * montrée à l'écran), gardé pour l'admin (`/admin/humain/figurines-clients#erreurs`) — sans photo, sans identifiant
 * (ses huit premiers signes).
 */
const CHEMIN_ERREURS_FABRICATION = "fabrication/erreurs.json";
export type ErreurFabrication = { le: string; qui: string; erreur: string; statut: number; detail?: string };
async function noterErreurFabrication(supabase: Supabase, h: string, erreur: string, statut: number, detail = ""): Promise<void> {
  try {
    console.error("[ma-figurine] fabrication ratée", JSON.stringify({ qui: h.slice(0, 8), erreur, statut, detail }));
    const f = await lireJson<{ l?: ErreurFabrication[] }>(supabase, CHEMIN_ERREURS_FABRICATION);
    const l = Array.isArray(f.l) ? f.l : [];
    const e: ErreurFabrication = { le: new Date().toISOString(), qui: h.slice(0, 8), erreur: erreur.slice(0, 300), statut, ...(detail ? { detail: detail.slice(0, 420) } : {}) };
    await ecrireJson(supabase, CHEMIN_ERREURS_FABRICATION, { l: [...l, e].slice(-50) });
  } catch {
    /* le relevé ne bloque jamais */
  }
}
export async function erreursDeFabrication(supabase: Supabase): Promise<ErreurFabrication[]> {
  const f = await lireJson<{ l?: ErreurFabrication[] }>(supabase, CHEMIN_ERREURS_FABRICATION);
  return (Array.isArray(f.l) ? f.l : []).slice().reverse();
}

/**
 * 🛠️ UN PAS DE FABRICATION DE SA FIGURINE (le moteur d'image) : sa figurine, puis sa bouche ouverte ; à la fin, elle
 * est prête. Sans moteur branché : rien (ClikMe la fait à la main, depuis l'admin).
 */
export async function fabriquerMaFigurine(supabase: Supabase, habitant: Habitant, avant: number): Promise<{ error?: string; enCours?: boolean; statut?: number }> {
  const { detail, ...r } = await unPasDeSaFigurine(supabase, habitant, avant);
  if (r.error) await noterErreurFabrication(supabase, habitant.id, r.error, r.statut ?? 400, detail);
  return r;
}
async function unPasDeSaFigurine(supabase: Supabase, habitant: Habitant, avant: number): Promise<{ error?: string; enCours?: boolean; statut?: number; detail?: string }> {
  if (!moteurBranche()) return {};
  const { ok, ligne } = await lireLigne(supabase, habitant.id);
  if (!ok || !ligne || !s(ligne.photo) || s(ligne.refus)) return { error: "Envoie d’abord ta photo.", statut: 400 };
  if (ligne.prete_le && s(ligne.neutre) && s(ligne.parle)) return {};
  const fab = await lireJson<Fabrique>(supabase, cheminFabrique(habitant.id));
  let jeton = s(fab.jeton);
  const dossier = () => dossierFabrique(habitant.id, jeton);
  if (!jeton) {
    // UNE NOUVELLE FIGURINE : elle compte (3 par personne et par jour, et le plafond de tout ClikMe)
    const jour = jourParis();
    if (essaisRestants(fab) <= 0) return { error: "Assez d’essais pour aujourd’hui : reviens demain.", statut: 429 };
    const compte = await lireJson<{ n: number }>(supabase, `fabrication/jour/${jour}.json`);
    if ((compte.n ?? 0) >= fabricationsParJourPourTous()) return { error: "Beaucoup de figurines se fabriquent aujourd’hui : la tienne sera faite demain. Reviens !", statut: 429 };
    jeton = nouveauJeton();
    await ecrireJson(supabase, cheminFabrique(habitant.id), { jeton, jour, essais: (fab.jour === jour ? Number(fab.essais) || 0 : 0) + 1 });
  }
  const [photo, univers] = await Promise.all([telecharger(supabase, s(ligne.photo)), lireJson<{ univers?: string }>(supabase, cheminUnivers(habitant.id))]);
  if (!photo) return { error: "Ta photo est introuvable : envoie-la de nouveau.", statut: 400 };
  const r = await fabriquerUnPas(depotDans(supabase, dossier()), photo, avant, universValide(univers.univers));
  if (r.nouvelle) {
    const tous = `fabrication/jour/${jourParis()}.json`;
    const compte = await lireJson<{ n: number }>(supabase, tous);
    await ecrireJson(supabase, tous, { n: (compte.n ?? 0) + 1 });
  }
  if (r.erreur) return { error: r.erreur, statut: 502, ...(r.detail ? { detail: r.detail } : {}) };
  if (r.enCours || !r.fini) return { enCours: true };
  const maintenant = new Date().toISOString();
  const { error } = await supabase
    .from("clik_ma_figurine")
    .update({ neutre: `${dossier()}/${NOM_NEUTRE}`, parle: `${dossier()}/${NOM_PARLE}`, prete_le: maintenant, refus: null, updated_at: maintenant })
    .eq("habitant_id", habitant.id);
  return error ? { error: "Ta figurine n’a pas pu être enregistrée. Réessaie.", statut: 502 } : {};
}

/**
 * 🔁 « REFAIRE MA FIGURINE » (elle ne lui ressemble pas) : une nouvelle, à partir de la même photo — ou, avec
 * `autrePhoto`, retour à la photo. 3 fabrications par jour.
 */
export async function refaireMaFigurine(supabase: Supabase, habitant: Habitant, autrePhoto: boolean, univers?: unknown): Promise<{ error?: string; statut?: number }> {
  const { ok, ligne } = await lireLigne(supabase, habitant.id);
  if (!ok || !ligne) return { error: "Envoie d’abord ta photo.", statut: 400 };
  // CE QUI LUI RESSEMBLE, revu en la refaisant (son métier, sa passion) : la nouvelle s'habille en conséquence
  const u = universValide(univers);
  if (u && motInterdit(u)) return { error: "Ces mots ne passent pas : écris ton métier ou ta passion 🙂", statut: 400 };
  const fab = await lireJson<Fabrique>(supabase, cheminFabrique(habitant.id));
  if (!autrePhoto && !moteurBranche()) return { error: "Ta figurine ne peut pas être refaite ici.", statut: 400 };
  if (!autrePhoto && essaisRestants(fab) <= 0) return { error: "Assez d’essais pour aujourd’hui : reviens demain.", statut: 429 };
  const maintenant = new Date().toISOString();
  if (univers !== undefined) await ecrireJson(supabase, cheminUnivers(habitant.id), { univers: u, le: maintenant });
  const { error } = await supabase
    .from("clik_ma_figurine")
    .update({ neutre: null, parle: null, prete_le: null, ...(autrePhoto ? { photo: null } : {}), refus: null, updated_at: maintenant })
    .eq("habitant_id", habitant.id);
  if (error) return { error: "Pas enregistré. Réessaie.", statut: 502 };
  // un nouveau dossier à la prochaine fabrication (le jeton est tiré, et l'essai compté, à ce moment-là)
  await ecrireJson(supabase, cheminFabrique(habitant.id), { jour: fab.jour, essais: fab.essais });
  return {};
}

/** Sa figurine (bouche fermée), en adresse signée — pour sa carte de personnage ; « » s'il ne l'a pas encore. */
export async function saFigurineSignee(supabase: Supabase, habitantId: string, secondes = 3600): Promise<string> {
  const { ligne } = await lireLigne(supabase, habitantId);
  return ligne?.prete_le && s(ligne.neutre) ? signer(supabase, s(ligne.neutre), secondes) : "";
}

/** 🎭 Un tour de fabrication de ses expressions (le moteur d'image), à partir de sa figurine bouche fermée. */
export async function fabriquerSesExpressions(supabase: Supabase, habitant: Habitant, avant: number, veut?: unknown): Promise<{ error?: string; enCours?: boolean }> {
  const { ligne } = await lireLigne(supabase, habitant.id);
  if (!ligne?.prete_le || !s(ligne.neutre)) return { error: "Ta figurine n’est pas encore prête." };
  const source = await telecharger(supabase, s(ligne.neutre));
  if (!source) return { error: "Ta figurine est introuvable." };
  // seulement les visages qu'il a voulus (la joie, et ceux qu'il a choisis une fois) ; `veut` : celui qu'il vient de choisir
  let voulus = await visagesVoulus(supabase, habitant.id);
  const nouveau = sentimentValide(veut);
  if (nouveau && !voulus.includes(nouveau)) {
    voulus = [...voulus, nouveau];
    await ecrireJson(supabase, cheminVisages(habitant.id), { voulus });
  }
  const r = await fabriquerUnTour(depotDans(supabase, dossierExpressions(habitant.id, s(ligne.neutre))), source, avant, voulus);
  return r.erreur ? { error: r.erreur } : r.enCours ? { enCours: true } : {};
}

/** ✍️ Son texte, lu par la voix choisie : 20 lectures par jour au plus (chacune coûte). */
const LECTURES_PAR_JOUR = 20;
/** 🗣️ SA VOIX, CHOISIE PAR LUI (« une voix d'homme ou de femme ? ») : gardée, elle devient celle de sa figurine. */
export async function choisirSaVoix(supabase: Supabase, habitant: Habitant, voix: unknown): Promise<{ error?: string; statut?: number }> {
  const v = voixValide(voix);
  if (!v) return { error: "Choisis une voix.", statut: 400 };
  await ecrireJson(supabase, cheminSaVoix(habitant.id), { voix: v, le: new Date().toISOString() });
  return {};
}

export async function lireSonTexte(supabase: Supabase, habitant: Habitant, texte: unknown, voix: unknown): Promise<{ mp3?: Buffer; error?: string; statut?: number }> {
  const t = texteValide(texte);
  const v = voixValide(voix);
  if (!t || !v) return { error: "Écris ce qu’elle doit dire, et choisis sa voix.", statut: 400 };
  if (motInterdit(t)) return { error: MOT_REFUSE, statut: 422 };
  const etat = await etatMaFigurine(supabase, habitant);
  // (pendant la fabrication aussi : il prépare son premier mème, sa voix est lue, et il part dès qu'elle apparaît)
  if (etat.etape !== "prete" && etat.etape !== "fabrication") return { error: "Ta figurine n’est pas encore prête.", statut: 400 };
  const jour = new Date().toISOString().slice(0, 10);
  const compteur = `${habitant.id}/voix-jour.json`;
  const avant = JSON.parse((await telecharger(supabase, compteur))?.toString() || "{}") as { jour?: string; n?: number };
  const n = avant.jour === jour ? Number(avant.n) || 0 : 0;
  if (n >= LECTURES_PAR_JOUR) return { error: "Assez de lectures pour aujourd’hui : reviens demain, ou enregistre ta voix.", statut: 429 };
  const r = await lireLeTexte(t, v);
  if ("erreur" in r) return { error: r.erreur, statut: r.statut };
  await deposer(supabase, compteur, Buffer.from(JSON.stringify({ jour, n: n + 1 })), "application/json");
  return { mp3: r.mp3 };
}

// ─── 🎤 les messages de l'ancienne démonstration (on la faisait parler sans compte, jusqu'au 5 novembre 2026) ─────
// Elle a quitté la page (« elle ne sert plus à rien maintenant » : chacun crée la sienne dès le départ) ; les liens
// déjà envoyés s'ouvrent toujours.
const MOT_REFUSE = "Ça, la figurine ne le dit pas. Écris autre chose 🙂";
const jourParis = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

export async function lireJson<T extends object>(supabase: Supabase, chemin: string): Promise<Partial<T>> {
  try {
    return JSON.parse((await telecharger(supabase, chemin))?.toString() || "{}") as Partial<T>;
  } catch {
    return {};
  }
}
export const ecrireJson = (supabase: Supabase, chemin: string, x: unknown) => deposer(supabase, chemin, Buffer.from(JSON.stringify(x)), "application/json");

/** Un message de la démonstration, gardé dans le seau (pas de compte, pas de table). */
type FicheDemo = {
  id: string;
  le: string;
  prenom: string;
  texte: string;
  voix: string;
  sentiment: string | null;
  son: string;
  duree: number;
  visiteur: string;
  ecoutes: number;
  signale_le?: string;
};
const cheminFiche = (id: string) => `${DOSSIER_DEMO}/messages/${id}.json`;
async function ficheDemo(supabase: Supabase, id: string): Promise<FicheDemo | null> {
  if (!idMessageValide(id)) return null;
  const f = await lireJson<FicheDemo>(supabase, cheminFiche(id));
  return f.id === id && f.son ? (f as FicheDemo) : null;
}

async function lireMessageDemo(supabase: Supabase, id: string): Promise<MessageFigurine | null> {
  const f = await ficheDemo(supabase, id);
  if (!f) return null;
  if (f.signale_le) return { signale: true, prenom: f.prenom };
  const sentiment = sentimentValide(f.sentiment);
  const expr = sentiment ? await expressionsSignees(supabase, `${DOSSIER_DEMO}/expr`, 7200).catch(() => null) : null;
  return {
    signale: false,
    id,
    prenom: f.prenom,
    neutre: IMAGES_DEMO.neutre,
    parle: IMAGES_DEMO.parle,
    duree: f.duree,
    sentiment,
    expression: sentiment ? (expr?.expressions[sentiment] ?? null) : null,
    ...(f.texte ? { texte: f.texte } : {}),
    demo: true,
    commerces: [],
  };
}

// ─── 1. sa photo ───────────────────────────────────────────────────────────────────────────────
export async function envoyerPhoto(supabase: Supabase, habitant: Habitant, photo: unknown, accord: unknown, prenom?: unknown, univers?: unknown, majeur?: unknown): Promise<{ error?: string }> {
  if (accord !== true) return { error: "Coche « C’est bien moi sur la photo »." };
  // 🔞 réservée aux 15 ans et plus (`AGE_MINIMUM`) : il le déclare (une case, jamais cochée d'avance)
  if (majeur !== true) return { error: ERREUR_AGE };
  // SON UNIVERS (facultatif) : son métier ou sa passion — sa figurine s'habille en conséquence
  const u = universValide(univers);
  if (u && motInterdit(u)) return { error: "Ces mots ne passent pas : écris ton métier ou ta passion 🙂" };
  const brut = image(photo);
  if (!brut) return { error: "Cette photo n’a pas pu être lue. Essaie une autre photo." };
  // SON PRÉNOM (un nouveau compte n'en a pas) : c'est lui qu'on lit dans « Léa t'a envoyé sa figurine »
  const p = prenomValide(prenom);
  if (p && motInterdit(p)) return { error: "Ce prénom ne passe pas : écris le tien 🙂" };
  if (p && !habitant.prenom) {
    await supabase.from("human_habitants").update({ prenom: p }).eq("id", habitant.id);
    habitant = { ...habitant, prenom: p };
  }
  const { ok, ligne } = await lireLigne(supabase, habitant.id);
  if (!ok) return { error: "Ta figurine arrive très bientôt : réessaie dans quelques jours." };
  if (ligne?.prete_le) return { error: "Ta figurine est déjà faite." };
  let octets: Buffer;
  try {
    octets = await sharp(brut).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
  } catch {
    return { error: "Cette photo n’a pas pu être lue. Essaie une autre photo." };
  }
  const chemin = `${habitant.id}/photo-${empreinte(brut)}.jpg`;
  if (!(await deposer(supabase, chemin, octets, "image/jpeg"))) return { error: "La photo n’est pas partie. Réessaie dans un instant." };
  const maintenant = new Date().toISOString();
  const { error } = await supabase.from("clik_ma_figurine").upsert(
    { habitant_id: habitant.id, prenom: await prenomDe(supabase, habitant), photo: chemin, accord_le: maintenant, demande_le: maintenant, refus: null, updated_at: maintenant },
    { onConflict: "habitant_id" },
  );
  if (error) return { error: "La photo n’est pas partie. Réessaie dans un instant." };
  await ecrireJson(supabase, cheminUnivers(habitant.id), { univers: u, le: maintenant });
  await confirmerSonAge(supabase, habitant.id);
  // une nouvelle photo : une nouvelle figurine (le dossier d'avant ne sert plus ; les essais du jour restent comptés)
  const fab = await lireJson<Fabrique>(supabase, cheminFabrique(habitant.id));
  await ecrireJson(supabase, cheminFabrique(habitant.id), { jour: fab.jour, essais: fab.essais });
  return {};
}

// ─── 2. un message ─────────────────────────────────────────────────────────────────────────────
function nouvelId(): string {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  return [...randomBytes(12)].map((b) => a[b % a.length]).join("");
}

export async function enregistrerMessage(
  supabase: Supabase,
  habitant: Habitant,
  son: unknown,
  duree: unknown,
  commerces: unknown,
  sentiment?: unknown,
  /** Le texte qu'elle dit (lu par une voix) : il s'affiche en bulle chez celui qui reçoit. */
  texte?: unknown,
  voix?: unknown,
  /** 🕺 Elle danse (dès le départ). */
  danse?: unknown,
  /** 💬 Le mème auquel il répond (en duo). */
  repondA?: unknown,
  /** 🗓️ Son look (une figurine du mois qui parle déjà) : c'est elle qui parle dans ce message. */
  look?: unknown,
  /** 🎬 Son graphisme (`rendus.ts` : bd, cinema, affiche) — gardé à côté, pour savoir lesquels plaisent. */
  rendu?: unknown,
  // (`auteurDeLOrigine` : en duo, l'auteur du mème auquel il répond — à prévenir : `appli-collection-serveur.ts`)
): Promise<{ id?: string; error?: string; auteurDeLOrigine?: string }> {
  const m = /^data:(audio\/(?:webm|ogg|mp4|mpeg|x-m4a|aac|wav))(?:;[^,]*)?;base64,(.+)$/i.exec(s(son));
  if (!m) return { error: "Ton message n’a pas pu être enregistré. Réessaie." };
  const brut = Buffer.from(m[2], "base64");
  const d = Number(duree);
  if (!brut.length || brut.length > 2 * 1024 * 1024 || !(d > 0.3) || d > DUREE_MAX_MESSAGE + 1) return { error: `Un message dure ${DUREE_MAX_MESSAGE} secondes au plus.` };
  const etat = await etatMaFigurine(supabase, habitant);
  if (etat.etape !== "prete") return { error: "Ta figurine n’est pas encore prête." };
  // (ses visages et ses voix sont tous ouverts dès le départ : le lot 3)
  const depuis = new Date(Date.now() - 86_400_000).toISOString();
  const { data: recents } = await supabase.from("clik_figurine_message").select("id").eq("habitant_id", habitant.id).gte("created_at", depuis).limit(MESSAGES_PAR_JOUR);
  if (Array.isArray(recents) && recents.length >= MESSAGES_PAR_JOUR) return { error: "Assez de messages pour aujourd’hui : reviens demain." };
  const permis = new Set(etat.commerces.map((c) => c.slug));
  const cites = [...new Set((Array.isArray(commerces) ? commerces : []).map(s))].filter((x) => permis.has(x)).slice(0, COMMERCES_MAX_MESSAGE);
  const type = m[1].toLowerCase();
  const ext = type.includes("webm") ? "webm" : type.includes("ogg") ? "ogg" : type.includes("wav") ? "wav" : type.includes("mpeg") ? "mp3" : "m4a";
  const id = nouvelId();
  const chemin = `${habitant.id}/m-${id}.${ext}`;
  if (!(await deposer(supabase, chemin, brut, type))) return { error: "Ton message n’est pas parti. Réessaie dans un instant." };
  const ligne = { id, habitant_id: habitant.id, son: chemin, duree: Math.round(d * 10) / 10, commerces: cites };
  const humeur = sentimentValide(sentiment);
  // LE FOU RIRE, LA GRIMACE ET LA DANSE : rangés à côté du message, dans le seau (la table ne connaît que les quatre
  // premiers visages : pas de migration pour eux)
  const sent = humeur && SENTIMENTS_EN_BASE.includes(humeur) ? humeur : null;
  // 💬 une réponse : le mème d'origine (un vrai, pas signalé)
  const origine = idMessageValide(s(repondA)) ? await ligneMessage(supabase, s(repondA)) : null;
  const repond = origine && !origine.signale_le ? s(origine.id) : "";
  // 🗓️ son look : une figurine du mois à lui, qui parle (sa bouche ouverte est faite)
  const l = lookValide(look);
  const sonLook = l && (await existe(supabase, `${habitant.id}/mois`, `${l}-p.webp`)) ? l : "";
  const aCote = {
    ...(humeur && !sent ? { sentiment: humeur } : {}),
    ...(danseValide(danse) ? { danse: true } : {}),
    ...(repond ? { repondA: repond } : {}),
    ...(sonLook ? { look: sonLook } : {}),
    ...(renduGarde(rendu) && !repond ? { rendu: renduGarde(rendu) } : {}),
  };
  if (Object.keys(aCote).length && !(await ecrireJson(supabase, `${habitant.id}/m-${id}.json`, aCote))) return { error: "Ton message n’est pas parti. Réessaie dans un instant." };
  const t = texteValide(texte);
  const v = voixValide(voix);
  const plus = { ...(sent ? { sentiment: sent } : {}), ...(t ? { texte: t } : {}), ...(t && v ? { voix: v } : {}) };
  let { error } = await supabase.from("clik_figurine_message").insert({ ...ligne, ...plus });
  // « sentiment », « texte » et « voix » arrivent avec leurs migrations : sans elles, le message part quand même
  const manque = (e: typeof error) => /sentiment|texte|voix/i.test(`${e?.message ?? ""} ${(e as { details?: string } | null)?.details ?? ""}`);
  if (error && Object.keys(plus).length && manque(error)) ({ error } = await supabase.from("clik_figurine_message").insert(sent ? { ...ligne, sentiment: sent } : ligne));
  if (error && sent && manque(error)) ({ error } = await supabase.from("clik_figurine_message").insert(ligne));
  if (error) return { error: "Ton message n’est pas parti. Réessaie dans un instant." };
  // 📈 la mesure : un mème de plus (et une réponse en duo)
  await noterEvenementMeme(supabase, "cree", id);
  if (repond) {
    await noterEvenementMeme(supabase, "reponse", repond);
    // ↩️ l'auteur du mème la verra dans « Mes mèmes » ; et lui a franchi une étape (« Répondre en duo »)
    await Promise.all([
      ecrireJson(supabase, cheminReponse(s(origine!.habitant_id), repond, id), { le: new Date().toISOString() }),
      ecrireJson(supabase, cheminDuo(habitant.id), { le: new Date().toISOString() }),
      // 👯 ils sont « proches » l'un de l'autre : leurs mèmes passent d'abord dans « Découvrir »
      ajouterProche(supabase, habitant.id, s(origine!.habitant_id)),
      ajouterProche(supabase, s(origine!.habitant_id), habitant.id),
    ]);
    return { id, auteurDeLOrigine: s(origine!.habitant_id) };
  }
  return { id };
}

// ─── 📈 la mesure du mème ──────────────────────────────────────────────────────────────────────
export const TYPES_EVENEMENT_MEME = ["cree", "reponse", "vu", "clic", "partage", "nouveau"] as const;
export type EvenementMeme = (typeof TYPES_EVENEMENT_MEME)[number];
/**
 * 📈 UN GESTE AUTOUR D'UN MÈME (`clik_meme_evenement`, la migration `20261110090000`) : jamais bloquant — sans la
 * migration, rien ne se compte et les mèmes partent quand même.
 */
export async function noterEvenementMeme(supabase: Supabase, type: EvenementMeme, messageId: string): Promise<void> {
  if (!idMessageValide(messageId)) return;
  try {
    await supabase.from("clik_meme_evenement").insert({ message_id: messageId, type });
  } catch {
    /* pas encore de table : tant pis */
  }
}
/** Un geste venu de la page (un partage ; une figurine créée par quelqu'un arrivé par un mème) : pour un vrai mème. */
export async function noterGesteMeme(supabase: Supabase, type: unknown, id: unknown): Promise<boolean> {
  if (type !== "partage" && type !== "nouveau") return false;
  const r = await ligneMessage(supabase, s(id));
  if (!r || r.signale_le) return false;
  await noterEvenementMeme(supabase, type, s(r.id));
  return true;
}

export type StatsMemes = {
  ok: boolean;
  /** Les gestes des 7 et des 30 derniers jours. */
  sept: Record<EvenementMeme, number>;
  trente: Record<EvenementMeme, number>;
  /** Jour par jour (les 14 derniers, le plus récent d'abord). */
  jours: { jour: string; n: Record<EvenementMeme, number> }[];
};
/** 📈 Pour la page de l'admin : les gestes des 30 derniers jours. */
export async function statsMemes(supabase: Supabase): Promise<StatsMemes> {
  const vide = () => Object.fromEntries(TYPES_EVENEMENT_MEME.map((x) => [x, 0])) as Record<EvenementMeme, number>;
  const jour = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const depuis = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data, error } = await supabase.from("clik_meme_evenement").select("message_id, type, created_at").gte("created_at", depuis).order("created_at", { ascending: false }).limit(50_000);
  const res: StatsMemes = { ok: !error, sept: vide(), trente: vide(), jours: [] };
  if (error) return res;
  const il7 = Date.now() - 7 * 86_400_000;
  const parJour = new Map<string, Record<EvenementMeme, number>>();
  for (let k = 0; k < 14; k++) parJour.set(jour(new Date(Date.now() - k * 86_400_000)), vide());
  for (const e of (Array.isArray(data) ? data : []) as { message_id?: string; type?: string; created_at?: string }[]) {
    // (les mèmes des commerçants, `c-<id>`, ont leurs propres chiffres : `memes-commerces-serveur.ts`)
    if (s(e.message_id).startsWith("c-")) continue;
    // (ses réactions et ses gags, `r-<clé>` : comptés à part, `statsReactions`)
    if (s(e.message_id).startsWith("r-")) continue;
    // (le talkie-walkie des proches, `t-<conversation>-<qui>` : `statsTalkie`)
    if (s(e.message_id).startsWith("t-")) continue;
    const type = TYPES_EVENEMENT_MEME.find((x) => x === e.type);
    if (!type) continue;
    const quand = new Date(s(e.created_at));
    res.trente[type] += 1;
    if (quand.getTime() >= il7) res.sept[type] += 1;
    const j = parJour.get(jour(quand));
    if (j) j[type] += 1;
  }
  res.jours = [...parJour].map(([j, n]) => ({ jour: j, n }));
  return res;
}

// ─── 📈 le parcours jusqu'au premier mème (7 novembre 2026 : « mesure combien de gens vont jusqu'au premier envoi ») ───
/**
 * Ceux qui ont envoyé leur photo ces `jours` derniers jours : combien ont leur figurine, combien ont fait un premier
 * mème, combien l'ont envoyé (partagé, ou ouvert par quelqu'un) ; et le temps entre la figurine prête et le premier
 * mème (l'objectif : moins d'une minute). Sans table de plus : `clik_ma_figurine`, `clik_figurine_message` et la mesure.
 */
export type ParcoursPremierMeme = { ok: boolean; photos: number; pretes: number; premiers: number; envoyes: number; delais: number[] };
export async function parcoursPremierMeme(supabase: Supabase, jours = 30): Promise<ParcoursPremierMeme> {
  const vide: ParcoursPremierMeme = { ok: false, photos: 0, pretes: 0, premiers: 0, envoyes: 0, delais: [] };
  const depuis = new Date(Date.now() - jours * 86_400_000).toISOString();
  const { data, error } = await supabase.from("clik_ma_figurine").select("habitant_id, accord_le, prete_le").gte("accord_le", depuis).limit(5000);
  if (error) return vide;
  const figs = ((Array.isArray(data) ? data : []) as Ligne[]).filter((f) => s(f.accord_le));
  const prete = new Map(figs.filter((f) => s(f.prete_le)).map((f) => [s(f.habitant_id), new Date(s(f.prete_le)).getTime()]));
  const ids = figs.map((f) => s(f.habitant_id));
  const paquets = <T,>(l: T[], n: number) => Array.from({ length: Math.ceil(l.length / n) }, (_, k) => l.slice(k * n, k * n + n));
  // leurs mèmes (le premier de chacun), puis ceux qui sont partis
  const premier = new Map<string, number>();
  const deQui = new Map<string, string>();
  for (const p of paquets(ids, 200)) {
    const { data: m } = await supabase.from("clik_figurine_message").select("id, habitant_id, created_at").in("habitant_id", p).limit(20_000);
    for (const x of (Array.isArray(m) ? m : []) as Ligne[]) {
      const h = s(x.habitant_id);
      const quand = new Date(s(x.created_at)).getTime();
      deQui.set(s(x.id), h);
      if (!premier.has(h) || quand < premier.get(h)!) premier.set(h, quand);
    }
  }
  const partis = new Set<string>();
  for (const p of paquets([...deQui.keys()], 300)) {
    const { data: e } = await supabase.from("clik_meme_evenement").select("message_id, type").in("message_id", p).limit(50_000);
    for (const x of (Array.isArray(e) ? e : []) as Ligne[]) if (x.type === "partage" || x.type === "vu") partis.add(deQui.get(s(x.message_id)) ?? "");
  }
  partis.delete("");
  const delais = [...premier]
    .filter(([h]) => prete.has(h))
    .map(([h, quand]) => Math.round((quand - prete.get(h)!) / 1000))
    .filter((d) => d >= 0)
    .sort((a, b) => a - b);
  // (une figurine refaite perd sa date « prête » le temps d'être refaite : un mème déjà fait dit qu'elle l'a été)
  const pretes = new Set([...prete.keys(), ...premier.keys()]).size;
  return { ok: true, photos: figs.length, pretes, premiers: premier.size, envoyes: partis.size, delais };
}

// ─── 📥 « mes mèmes » ──────────────────────────────────────────────────────────────────────────
type Cache = Map<string, Promise<Ligne | null>>;
/** Un mème en vignette : qui, son image (son look, s'il en avait un), ses mots, sa vidéo. `h` : de qui il est. */
async function apercuMeme(supabase: Supabase, id: string, cache: Cache, ligne?: Ligne): Promise<{ ap: ApercuMeme; h: string; public: boolean; duo: boolean } | null> {
  const r = ligne ?? (await ligneMessage(supabase, id));
  if (!r || r.signale_le) return null;
  const h = s(r.habitant_id);
  if (!cache.has(h)) cache.set(h, lireLigne(supabase, h).then((x) => x.ligne));
  const [f, aCote] = await Promise.all([cache.get(h)!, lireJson<{ look: string; meme: string; repondA: string; public: Partial<Public>; sentiment: string }>(supabase, `${h}/m-${s(r.id)}.json`)]);
  if (!f || !s(f.neutre)) return null;
  const look = lookValide(aCote.look);
  // 🎭 SA TÊTE DANS CE MÈME (8 novembre 2026 : « j'ai toujours la même tête sur tous mes mèmes, alors que j'y ai des
  // expressions différentes ») : son look ; sinon le visage qu'il avait choisi (la joie, la colère…) ; sinon sa figurine
  const sentiment = look ? null : (sentimentValide(r.sentiment) ?? sentimentValide(aCote.sentiment));
  const visage = look ? cheminImageDuLook(h, look) : sentiment ? `${dossierExpressions(h, s(f.neutre))}/${sentiment}-n.webp` : s(f.neutre);
  const [image0, video] = await Promise.all([signer(supabase, visage), s(aCote.meme) ? signer(supabase, s(aCote.meme)) : Promise.resolve("")]);
  // (ce visage n'existe plus — sa figurine refaite depuis — : sa figurine de tous les jours)
  const image = image0 || (visage !== s(f.neutre) ? await signer(supabase, s(f.neutre)) : "");
  if (!image) return null;
  return {
    h,
    public: Boolean(aCote.public?.ville),
    duo: Boolean(s(aCote.repondA)),
    ap: { id: s(r.id), prenom: s(f.prenom), image, le: s(r.created_at), ...(s(r.texte) ? { texte: s(r.texte) } : {}), ...(video ? { video } : {}) },
  };
}

/**
 * 📥 « MES MÈMES » : les siens (les plus récents), avec leurs vues (`clik_meme_evenement` ; sans la table, ses écoutes)
 * et leurs réponses ; les réponses en duo qu'on lui a faites ; et ceux qu'il a reçus (`recus` : les numéros gardés sur
 * son téléphone — pas les siens).
 */
export async function mesMemes(supabase: Supabase, habitant: Habitant | null, recus: unknown): Promise<MesMemes> {
  const cache: Cache = new Map();
  const idsRecus = [...new Set(String(recus ?? "").split(",").map(s).filter(idMessageValide))].slice(0, MEMES_VUS);
  const lesRecus = async (sauf: Set<string>) =>
    (await Promise.all(idsRecus.filter((id) => !sauf.has(id)).map((id) => apercuMeme(supabase, id, cache))))
      .filter((x): x is NonNullable<typeof x> => Boolean(x) && x!.h !== habitant?.id)
      .map((x) => x.ap);
  if (!habitant) return { envoyes: [], reponses: [], recus: await lesRecus(new Set()) };

  const [{ data }, { data: marques }] = await Promise.all([
    supabase.from("clik_figurine_message").select("*").eq("habitant_id", habitant.id).order("created_at", { ascending: false }).limit(MEMES_VUS),
    supabase.storage.from(SEAU_FIGURINES).list(habitant.id, { limit: 100, search: "rep-", sortBy: { column: "created_at", order: "desc" } }),
  ]);
  const miens = ((Array.isArray(data) ? data : []) as Ligne[]).filter((m) => !m.retire_le);
  const ids = miens.map((m) => s(m.id));
  // SES VUES ET SES RÉPONSES (la mesure) ; sans la table : ses écoutes
  const { data: ev, error } = ids.length
    ? await supabase.from("clik_meme_evenement").select("message_id, type").in("message_id", ids).in("type", ["vu", "reponse"]).limit(5000)
    : { data: [], error: null };
  const compte = (id: string, type: string) => ((Array.isArray(ev) ? ev : []) as { message_id?: string; type?: string }[]).filter((e) => e.message_id === id && e.type === type).length;
  // 😂 ❤️ 🔥 ce que les gens en ont pensé (dans « Découvrir »)
  const reacs = await reactionsDe(supabase, ids).catch(() => ({}) as Awaited<ReturnType<typeof reactionsDe>>);
  const envoyes = (
    await Promise.all(
      miens.map(async (m) => {
        const x = await apercuMeme(supabase, s(m.id), cache, m);
        if (!x) return null;
        const id = s(m.id);
        return {
          ...x.ap,
          vues: error ? Number(m.ecoutes) || 0 : Math.max(compte(id, "vu"), Number(m.ecoutes) || 0),
          reponses: error ? 0 : compte(id, "reponse"),
          ...(x.public ? { public: true } : {}),
          ...(x.duo ? { duo: true } : {}),
          ...(reacs[id] && Object.values(reacs[id].n).some((n) => n > 0) ? { reac: reacs[id].n } : {}),
        } as MonMeme;
      }),
    )
  ).filter((x): x is MonMeme => Boolean(x));
  // LES RÉPONSES EN DUO QU'ON LUI A FAITES (une marque par réponse)
  const textes = new Map(miens.map((m) => [s(m.id), s(m.texte)]));
  const reps = ((Array.isArray(marques) ? marques : []) as { name?: string }[])
    .map((x) => /^rep-([a-z0-9]{12})-([a-z0-9]{12})\.json$/.exec(s(x.name)))
    .filter((x): x is RegExpExecArray => Boolean(x))
    .slice(0, MEMES_VUS);
  const reponses = (
    await Promise.all(
      reps.map(async ([, a, id]) => {
        const x = await apercuMeme(supabase, id, cache);
        return x ? ({ ...x.ap, a, ...(textes.get(a) ? { aTexte: textes.get(a) } : {}) } as ReponseAMonMeme) : null;
      }),
    )
  ).filter((x): x is ReponseAMonMeme => Boolean(x));
  return { envoyes, reponses, recus: await lesRecus(new Set(reponses.map((x) => x.id))) };
}

// ─── 🌍 ses mèmes dans « Découvrir », sur son accord (l'étape 3, 7 novembre 2026) ─────────────────────
/**
 * UN MÈME PUBLIC, SEULEMENT S'IL LE VEUT : un geste à lui (« Montrer dans Découvrir »), pour les gens de SA ville, et
 * il le retire quand il veut. Jamais un duo (il montre aussi la figurine de quelqu'un d'autre), jamais un mème signalé,
 * seulement une vidéo. Une fiche par mème, `publics/<ville>/<jour>/<id>.json` ; et `public` à côté du message.
 */
type Public = { ville: string; jour: string; le: string };
const cheminPublic = (ville: string, jour: string, id: string) => `publics/${ville}/${jour}/${id}.json`;

export async function rendreMemePublic(supabase: Supabase, habitant: Habitant, id: unknown, oui: unknown, duJour = false): Promise<{ public?: boolean; duJour?: boolean; error?: string; statut?: number }> {
  const r = await ligneMessage(supabase, s(id));
  if (!r || s(r.habitant_id) !== habitant.id) return { error: "Ce mème n’est pas le tien.", statut: 404 };
  const chemin = `${habitant.id}/m-${s(r.id)}.json`;
  const aCote = await lireJson<Record<string, unknown>>(supabase, chemin);
  const avant = aCote.public as Partial<Public> | undefined;
  const sonJour = s(aCote.duJour);
  if (oui === true && !(await aConfirmeSonAge(supabase, habitant.id))) return SANS_AGE;
  if (oui !== true) {
    // RETIRÉ : sa fiche quitte « Découvrir » tout de suite (et les réponses au mème du jour)
    if (avant?.ville && avant.jour) await supabase.storage.from(SEAU_FIGURINES).remove([cheminPublic(avant.ville, avant.jour, s(r.id))]);
    if (avant?.ville && sonJour) await supabase.storage.from(SEAU_FIGURINES).remove([cheminDuJour(avant.ville, sonJour, s(r.id)), cheminMaReponse(habitant.id, sonJour)]);
    const reste = { ...aCote };
    delete reste.public;
    delete reste.duJour;
    if (!(await ecrireJson(supabase, chemin, reste))) return { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
    return { public: false };
  }
  if (r.signale_le) return { error: "Ce mème a été signalé : il ne peut pas aller dans « Découvrir ».", statut: 400 };
  if (!s(aCote.meme)) return { error: "Seul un mème en vidéo peut aller dans « Découvrir ».", statut: 400 };
  if (s(aCote.repondA)) return { error: "Un duo montre aussi la figurine de quelqu’un d’autre : il reste entre vous.", statut: 400 };
  if (!habitant.villeSlug) return { error: "Il faut d’abord ta ville.", statut: 400 };
  const p: Public = avant?.ville && avant.jour ? (avant as Public) : { ville: habitant.villeSlug, jour: jourParis(), le: new Date().toISOString() };
  let ok = avant?.ville ? true : await ecrireJson(supabase, cheminPublic(p.ville, p.jour, s(r.id)), { id: s(r.id), h: habitant.id, le: p.le });
  // 🔥 SA RÉPONSE AU MÈME DU JOUR : une par personne et par jour (la nouvelle remplace l'ancienne)
  const jour = jourParis();
  if (duJour && sonJour !== jour) {
    const ancienne = s((await lireJson<{ id?: string }>(supabase, cheminMaReponse(habitant.id, jour))).id);
    if (ancienne && ancienne !== s(r.id)) await supabase.storage.from(SEAU_FIGURINES).remove([cheminDuJour(habitant.villeSlug, jour, ancienne)]);
    ok =
      ok &&
      (await ecrireJson(supabase, cheminDuJour(habitant.villeSlug, jour, s(r.id)), { id: s(r.id), h: habitant.id, le: new Date().toISOString() })) &&
      (await ecrireJson(supabase, cheminMaReponse(habitant.id, jour), { id: s(r.id) }));
  }
  ok = ok && (await ecrireJson(supabase, chemin, { ...aCote, public: p, ...(duJour ? { duJour: jour } : sonJour ? { duJour: sonJour } : {}) }));
  return ok ? { public: true, ...(duJour || sonJour ? { duJour: true } : {}) } : { error: "Ça n’a pas marché. Réessaie.", statut: 502 };
}

// ─── 🛡️ pour la modération (`moderation-serveur.ts`) ─────────────────────────────────────────────────
/** Un mème tel que la modération le voit (même signalé) : son auteur, ses mots, sa vidéo, s'il est dans la ville. */
export type MemeAModerer = { id: string; h: string; texte: string; son: string; video: string; signaleLe: string; public?: { ville: string; jour: string }; duJour?: string };
export async function memeAModerer(supabase: Supabase, id: string): Promise<MemeAModerer | null> {
  if (!idMessageValide(id)) return null;
  const { data } = await supabase.from("clik_figurine_message").select("*").eq("id", id).maybeSingle();
  const r = (data as Ligne | null) ?? null;
  if (!r) return null;
  const h = s(r.habitant_id);
  const aCote = await lireJson<Record<string, unknown>>(supabase, `${h}/m-${id}.json`);
  const p = aCote.public as Partial<Public> | undefined;
  const [son, video] = await Promise.all([signer(supabase, s(r.son)), s(aCote.meme) ? signer(supabase, s(aCote.meme)) : Promise.resolve("")]);
  return {
    id,
    h,
    texte: s(r.texte),
    son,
    video,
    signaleLe: s(r.signale_le),
    ...(p?.ville && p.jour ? { public: { ville: s(p.ville), jour: s(p.jour) } } : {}),
    ...(s(aCote.duJour) ? { duJour: s(aCote.duJour) } : {}),
  };
}
/** 🗑️ Retiré pour de bon : il quitte « Découvrir » et les réponses au mème du jour (ses fiches effacées). */
export async function retirerDeLaVille(supabase: Supabase, m: MemeAModerer): Promise<void> {
  const fiches = [
    ...(m.public ? [cheminPublic(m.public.ville, m.public.jour, m.id)] : []),
    ...(m.public && m.duJour ? [cheminDuJour(m.public.ville, m.duJour, m.id), cheminMaReponse(m.h, m.duJour)] : []),
  ];
  if (fiches.length) await supabase.storage.from(SEAU_FIGURINES).remove(fiches);
  if (m.public || m.duJour) {
    const chemin = `${m.h}/m-${m.id}.json`;
    const reste = { ...(await lireJson<Record<string, unknown>>(supabase, chemin)) };
    delete reste.public;
    delete reste.duJour;
    await ecrireJson(supabase, chemin, reste);
  }
}
/** Lesquels de ces mèmes sont cachés (signalés, ou retirés) : la carte d'« Autour » ne les compte pas. */
export async function memesCaches(supabase: Supabase, ids: string[]): Promise<Set<string>> {
  const valides = [...new Set(ids)].filter(idMessageValide);
  if (!valides.length) return new Set();
  const { data } = await supabase.from("clik_figurine_message").select("id, signale_le, retire_le").in("id", valides);
  return new Set(((Array.isArray(data) ? data : []) as Ligne[]).filter((r) => r.signale_le || r.retire_le).map((r) => s(r.id)));
}

// ─── 🔥 le mème du jour (le lot 2, 7 novembre 2026) : ses réponses, ses chiffres, ses proches d'abord ─────────────
/** Une fiche par réponse, `du-jour/<ville>/<jour>/<id>.json` ; et la sienne, `<habitant>/du-jour/<jour>.json`. */
const cheminDuJour = (ville: string, jour: string, id: string) => `du-jour/${ville}/${jour}/${id}.json`;
const cheminMaReponse = (h: string, jour: string) => `${h}/du-jour/${jour}.json`;
export async function idsDuJour(supabase: Supabase, ville: string, jour: string): Promise<string[]> {
  if (!ville) return [];
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(`du-jour/${ville}/${jour}`, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
  return ((Array.isArray(data) ? data : []) as { name?: string }[]).map((x) => /^([a-z0-9]{12})\.json$/.exec(s(x.name))?.[1] ?? "").filter(Boolean);
}

/** 🔥 Le mème du jour : le thème, combien de réponses dans sa ville (vraies), et s'il a répondu. */
export async function etatDuJour(supabase: Supabase, habitant: Habitant | null): Promise<EtatDuJour> {
  const jour = jourParis();
  const ville = habitant?.villeSlug ?? "";
  const [ids, mienne] = await Promise.all([idsDuJour(supabase, ville, jour), habitant ? lireJson<{ id?: string }>(supabase, cheminMaReponse(habitant.id, jour)) : Promise.resolve({} as { id?: string })]);
  const moi = s(mienne.id);
  const repondu = Boolean(moi && ids.includes(moi));
  return { jour, theme: themeDuJour(jour), ville, n: ids.length, repondu, ...(repondu ? { moi } : {}) };
}

/**
 * 👯 Ses proches : ceux avec qui il a fait un duo, ceux qu'il a ajoutés (le profil d'« Autour »), et ses amis des
 * Rencontres d'avant. C'est SA liste : ceux qui y sont voient ce qu'il dépose pour « Mes proches » (`autour-serveur.ts`),
 * et leurs mèmes passent devant pour lui.
 */
const cheminProches = (h: string) => `${h}/proches.json`;
/** 🎙️ Ceux qui l'ont ajouté (le talkie-walkie : « Nico t'a ajouté — l'ajouter aussi ? », `talkie-serveur.ts`). */
export const cheminAjoutePar = (h: string) => `${h}/ajoute-par.json`;
async function marquerAjoutePar(supabase: Supabase, h: string, par: string, oui: boolean): Promise<void> {
  const a = await lireJson<{ ids?: string[] }>(supabase, cheminAjoutePar(h));
  const ids = (Array.isArray(a.ids) ? a.ids : []).map(s).filter((x) => x && x !== par);
  await ecrireJson(supabase, cheminAjoutePar(h), { ids: (oui ? [...ids, par] : ids).slice(-200) });
}
export async function ajouterProche(supabase: Supabase, h: string, autre: string): Promise<boolean> {
  if (!h || !autre || h === autre) return false;
  const p = await lireJson<{ ids?: string[] }>(supabase, cheminProches(h));
  const ids = Array.isArray(p.ids) ? p.ids : [];
  if (ids.includes(autre)) return true;
  const ok = await ecrireJson(supabase, cheminProches(h), { ids: [...ids, autre].slice(-100) });
  if (ok) await marquerAjoutePar(supabase, autre, h, true).catch(() => undefined);
  return ok;
}
/** Il le retire de ses proches (et de ses amis des Rencontres d'avant, qui comptaient aussi). */
export async function retirerProche(supabase: Supabase, h: string, autre: string): Promise<boolean> {
  if (!h || !autre) return false;
  const [p, r] = await Promise.all([lireJson<{ ids?: string[] }>(supabase, cheminProches(h)), lireJson<Record<string, unknown>>(supabase, `${h}/rencontres.json`)]);
  const ids = Array.isArray(p.ids) ? p.ids : [];
  let ok = !ids.includes(autre) || (await ecrireJson(supabase, cheminProches(h), { ids: ids.filter((x) => x !== autre) }));
  await marquerAjoutePar(supabase, autre, h, false).catch(() => undefined);
  const amis = Array.isArray(r.amis) ? (r.amis as unknown[]).map(s) : [];
  if (amis.includes(autre)) ok = (await ecrireJson(supabase, `${h}/rencontres.json`, { ...r, amis: amis.filter((x) => x !== autre) })) && ok;
  return ok;
}
export async function prochesDe(supabase: Supabase, h: string): Promise<Set<string>> {
  const [p, r] = await Promise.all([lireJson<{ ids?: string[] }>(supabase, cheminProches(h)), lireJson<{ amis?: string[] }>(supabase, `${h}/rencontres.json`)]);
  return new Set([...(Array.isArray(p.ids) ? p.ids : []), ...(Array.isArray(r.amis) ? r.amis : [])].map(s).filter(Boolean));
}

/** Les mèmes de ces fiches, prêts pour le fil : ses proches d'abord, puis les plus récents ; les réactions ; le sien. */
async function enFil(supabase: Supabase, ids: string[], ville: string, moi: Habitant | null, proches: Set<string>, cache: Cache, exigerPublic = true): Promise<MemePublic[]> {
  const vus = (await Promise.all(ids.map((id) => apercuMeme(supabase, id, cache)))).filter((x): x is NonNullable<typeof x> => Boolean(x && (!exigerPublic || x.public) && x.ap.video && !x.duo));
  const reacs = await reactionsDe(supabase, vus.map((x) => x.ap.id), moi?.id).catch(() => ({}) as Awaited<ReturnType<typeof reactionsDe>>);
  return vus
    .map((x) => ({
      ...x.ap,
      villeSlug: ville,
      ...(proches.has(x.h) ? { ami: true } : {}),
      ...(moi && x.h === moi.id ? { moi: true } : {}),
      ...(reacs[x.ap.id] ? { reac: reacs[x.ap.id] } : {}),
    }))
    .sort((a, b) => Number(Boolean(b.moi)) - Number(Boolean(a.moi)) || Number(Boolean(b.ami)) - Number(Boolean(a.ami)) || b.le.localeCompare(a.le));
}

/**
 * 📍 « AUTOUR DE MOI » (`autour-serveur.ts`) : des mèmes déposés dans un lieu, en cartes comme le fil (ses proches
 * d'abord, les réactions, le sien). Le dépôt vaut accord pour ceux qui peuvent le voir : pas besoin de « Découvrir ».
 */
export async function cartesDeMemes(supabase: Supabase, ids: string[], ville: string, moi: Habitant | null): Promise<MemePublic[]> {
  return enFil(supabase, ids, ville, moi, moi ? await prochesDe(supabase, moi.id) : new Set(), new Map(), false);
}

/** 📍 Ce mème peut-il être déposé quelque part ? Le sien, en vidéo, pas un duo, pas signalé, pas retiré. */
export async function memeDeposable(supabase: Supabase, habitant: Habitant, id: unknown): Promise<{ ok?: true; error?: string }> {
  const i = s(id);
  if (!idMessageValide(i)) return { error: "Ce mème n’existe pas." };
  const r = await ligneMessage(supabase, i);
  if (!r || s(r.habitant_id) !== habitant.id || r.retire_le) return { error: "Ce mème n’est pas le tien." };
  if (r.signale_le) return { error: "Ce mème a été signalé : il ne peut pas être déposé." };
  const aCote = await lireJson<{ meme: string; repondA: string }>(supabase, `${habitant.id}/m-${i}.json`);
  if (!s(aCote.meme)) return { error: "Seul un mème en vidéo peut être déposé." };
  if (s(aCote.repondA)) return { error: "Un duo montre aussi la figurine de quelqu’un d’autre : il reste entre vous." };
  return { ok: true };
}

/** 🔥 Les réponses de sa ville au mème du jour — seulement s'il a posté la sienne (« tu postes, puis tu vois »). */
export async function reponsesDuJour(supabase: Supabase, habitant: Habitant | null, etat: EtatDuJour, max = 40): Promise<MemePublic[]> {
  if (!habitant || !etat.repondu || !etat.ville) return [];
  const ids = (await idsDuJour(supabase, etat.ville, etat.jour)).slice(0, max);
  return enFil(supabase, ids, etat.ville, habitant, await prochesDe(supabase, habitant.id), new Map());
}

/** 🌍 Les mèmes que les gens de SA ville ont choisi de montrer, ces trois derniers jours (pas les signalés). */
export async function memesPublics(supabase: Supabase, ville: string, max = 20, moi: Habitant | null = null): Promise<MemePublic[]> {
  if (!ville) return [];
  const cache: Cache = new Map();
  // (les réponses au mème du jour ont leur place à elles, en haut : pas deux fois)
  const duJour = new Set(await idsDuJour(supabase, ville, jourParis()));
  const ids: string[] = [];
  for (let k = 0; k < 3 && ids.length < max; k++) {
    const jour = jourAvant(jourParis(), k);
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(`publics/${ville}/${jour}`, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    ids.push(...((Array.isArray(data) ? data : []) as { name?: string }[]).map((x) => /^([a-z0-9]{12})\.json$/.exec(s(x.name))?.[1] ?? "").filter((id) => id && !duJour.has(id)).slice(0, max - ids.length));
  }
  return enFil(supabase, ids, ville, moi, moi ? await prochesDe(supabase, moi.id) : new Set(), cache);
}

/** 💬 LE MÈME AUQUEL IL RÉPOND (en duo) : ses images (son visage du moment), sa voix, ses mots, son prénom. */
export type MemeARepondre = { id: string; prenom: string; images: { n: string; p: string }; son: string; texte?: string };
export async function memeARepondre(supabase: Supabase, id: unknown): Promise<MemeARepondre | null> {
  const m = idMessageValide(s(id)) ? await lireMessage(supabase, s(id)) : null;
  if (!m || m.signale || m.demo) return null;
  const images = m.expression ? { n: m.expression.n, p: m.expression.p } : { n: m.neutre, p: m.parle };
  return { id: m.id, prenom: m.prenom, images, son: `/api/direct/ma-figurine/son?m=${m.id}&r=1`, ...(m.texte ? { texte: m.texte } : {}) };
}

// ─── 🎭 son mème (la vidéo de son message) ─────────────────────────────────────────────────────
/** Un mème : 15 Mo au plus (une vingtaine de secondes en 720 × 1280). */
const MEME_MAX = 15 * 1024 * 1024;
const extMeme = (type: unknown) => (/^video\/mp4/i.test(s(type)) ? "mp4" : /^video\/webm/i.test(s(type)) ? "webm" : "");
const cheminMeme = (h: string, id: string, ext: string) => `${h}/meme-${id}.${ext}`;

/**
 * 🎭 OÙ ENVOYER LA VIDÉO DE SON MÈME (6 novembre 2026, `meme.ts`) : fabriquée dans son téléphone, elle part tout droit
 * au seau privé (trop lourde pour passer par ici) — une adresse signée, pour SON message seulement.
 */
export async function adresseEnvoiMeme(supabase: Supabase, habitant: Habitant, id: unknown, type: unknown): Promise<{ seau?: string; chemin?: string; jeton?: string; error?: string; statut?: number }> {
  const r = await ligneMessage(supabase, s(id));
  if (!r || s(r.habitant_id) !== habitant.id) return { error: "Ce message n’est pas le tien.", statut: 404 };
  const ext = extMeme(type);
  if (!ext) return { error: "Ce format de vidéo n’est pas pris.", statut: 400 };
  const chemin = cheminMeme(habitant.id, s(r.id), ext);
  const { data, error } = await supabase.storage.from(SEAU_FIGURINES).createSignedUploadUrl(chemin, { upsert: true });
  if (error || !data?.token) return { error: "Ton mème n’a pas pu partir. Réessaie.", statut: 502 };
  return { seau: SEAU_FIGURINES, chemin: data.path ?? chemin, jeton: data.token };
}

/** Le mème est arrivé (sa vidéo est dans le seau, pas trop lourde) : il est rangé à côté du message. */
/**
 * La vidéo de son mème est arrivée : elle est rangée à côté du message. `reglages` (10 novembre 2026, « Créer » sur un
 * seul écran) : sa version (la BD, le film, l'affiche — `null` : la vidéo simple), la danse et sa tête, choisies sur son
 * mème prêt ; une autre version refait la vidéo, à la même place, et les réglages suivent.
 */
export async function poserMeme(supabase: Supabase, habitant: Habitant, id: unknown, type: unknown, reglages?: unknown): Promise<{ ok?: boolean; error?: string; statut?: number }> {
  const r = await ligneMessage(supabase, s(id));
  if (!r || s(r.habitant_id) !== habitant.id) return { error: "Ce message n’est pas le tien.", statut: 404 };
  const ext = extMeme(type);
  if (!ext) return { error: "Ce format de vidéo n’est pas pris.", statut: 400 };
  const nom = `meme-${s(r.id)}.${ext}`;
  const { data } = await supabase.storage.from(SEAU_FIGURINES).list(habitant.id, { limit: 100, search: `meme-${s(r.id)}` });
  const f = ((Array.isArray(data) ? data : []) as { name?: string; metadata?: { size?: number } }[]).find((x) => x.name === nom);
  const taille = Number(f?.metadata?.size) || 0;
  if (!f || taille <= 0) return { error: "La vidéo de ton mème n’est pas arrivée.", statut: 400 };
  if (taille > MEME_MAX) {
    await supabase.storage.from(SEAU_FIGURINES).remove([cheminMeme(habitant.id, s(r.id), ext)]);
    return { error: "Ton mème est trop long.", statut: 413 };
  }
  const chemin = `${s(r.habitant_id)}/m-${s(r.id)}.json`;
  const { rendu: avantRendu, danse: avantDanse, ...aCote } = await lireJson<Record<string, unknown>>(supabase, chemin);
  // (sans réglages : ceux du message restent ; avec : sa version et la danse, telles qu'il les a choisies — jamais une
  // version pour un duo)
  const g = reglages && typeof reglages === "object" ? (reglages as { rendu?: unknown; danse?: unknown; sentiment?: unknown }) : null;
  const rendu = g ? (aCote.repondA ? null : renduGarde(g.rendu)) : renduGarde(avantRendu);
  const danse = g ? danseValide(g.danse) : avantDanse === true;
  // (sa version a pris une autre tête : le message la prend aussi — sa vignette, dans « Mes mèmes », la montre. Les quatre
  // premiers visages vont dans la table ; les autres, à côté du message)
  if (g && "sentiment" in g) {
    const humeur = sentimentValide(g.sentiment);
    const enBase = humeur && SENTIMENTS_EN_BASE.includes(humeur) ? humeur : null;
    if ((sentimentValide(r.sentiment) ?? null) !== enBase) await supabase.from("clik_figurine_message").update({ sentiment: enBase }).eq("id", s(r.id));
    delete aCote.sentiment;
    if (humeur && !enBase) aCote.sentiment = humeur;
  }
  const range = { ...aCote, ...(rendu ? { rendu } : {}), ...(danse ? { danse: true } : {}), meme: cheminMeme(habitant.id, s(r.id), ext), memeType: ext === "mp4" ? "video/mp4" : "video/webm" };
  if (!(await ecrireJson(supabase, chemin, range)))
    return { error: "Ton mème n’a pas pu être rangé.", statut: 502 };
  return { ok: true };
}

// ─── 3. celui qui le reçoit ────────────────────────────────────────────────────────────────────
async function ligneMessage(supabase: Supabase, id: string): Promise<Ligne | null> {
  if (!idMessageValide(id)) return null;
  const { data, error } = await supabase.from("clik_figurine_message").select("*").eq("id", id).maybeSingle();
  const r = (data as Ligne | null) ?? null;
  return error || !r || r.retire_le ? null : r;
}

export async function lireMessage(supabase: Supabase, id: string): Promise<MessageFigurine | null> {
  const r = await ligneMessage(supabase, id);
  if (!r) return lireMessageDemo(supabase, id);
  const { ligne: fig } = await lireLigne(supabase, s(r.habitant_id));
  if (!fig || !s(fig.neutre) || !s(fig.parle)) return null;
  const prenom = s(fig.prenom);
  if (r.signale_le) return { signale: true, prenom };
  const slugs = (Array.isArray(r.commerces) ? r.commerces : []).map(s).filter(Boolean);
  const { data: sites } = slugs.length
    ? await supabase.from("human_vitrine_sites").select("slug, business_name, city, activite, est_client").in("slug", slugs)
    : { data: [] };
  const parSlug = new Map(((Array.isArray(sites) ? sites : []) as Ligne[]).filter((x) => x.est_client === true).map((x) => [s(x.slug), x]));
  // (le fou rire, la grimace, la danse : à côté du message)
  const aCote = await lireJson<{ sentiment: string; danse: boolean; meme: string; memeType: string; look: string }>(supabase, `${s(r.habitant_id)}/m-${id}.json`);
  const sentiment = sentimentValide(r.sentiment) ?? sentimentValide(aCote.sentiment);
  // 🗓️ son look (une figurine du mois) : c'est elle qui parle, avec son visage du mois
  const look = lookValide(aCote.look);
  const [neutre, parle, expr, meme] = await Promise.all([
    signer(supabase, look ? cheminImageDuLook(s(r.habitant_id), look) : s(fig.neutre), 7200),
    signer(supabase, look ? cheminParleDuLook(s(r.habitant_id), look) : s(fig.parle), 7200),
    sentiment && !look ? expressionsSignees(supabase, dossierExpressions(s(r.habitant_id), s(fig.neutre)), 7200).catch(() => null) : Promise.resolve(null),
    // 🎭 son mème (la vidéo), s'il en a un
    s(aCote.meme) ? signer(supabase, s(aCote.meme), 7200) : Promise.resolve(""),
  ]);
  return {
    signale: false,
    id,
    prenom,
    neutre,
    parle,
    duree: Number(r.duree) || 0,
    sentiment,
    expression: sentiment ? (expr?.expressions[sentiment] ?? null) : null,
    ...(s(r.texte) ? { texte: s(r.texte) } : {}),
    ...(aCote.danse === true ? { danse: true } : {}),
    ...(meme ? { meme: { video: meme, type: s(aCote.memeType) || "video/mp4" } } : {}),
    // (le cadre doré : ouvert à tous dès le départ, le lot 3)
    or: true,
    commerces: slugs.flatMap((slug) => {
      const x = parSlug.get(slug);
      if (!x) return [];
      const metier = s(x.activite);
      return [{ slug, nom: s(x.business_name), ville: s(x.city).replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim(), figurine: figurineDu(slug, { branche: brancheDuMetier(metier), metier }) }];
    }),
  };
}

/** Sa voix, pour la page du message (et une écoute de plus). */
export async function sonDuMessage(supabase: Supabase, id: string, compter = true): Promise<{ octets: Buffer; type: string } | null> {
  const r = await ligneMessage(supabase, id);
  if (!r) {
    const f = await ficheDemo(supabase, id);
    if (!f || f.signale_le) return null;
    const octets = await telecharger(supabase, f.son);
    if (!octets) return null;
    await ecrireJson(supabase, cheminFiche(id), { ...f, ecoutes: (Number(f.ecoutes) || 0) + 1 });
    return { octets, type: "audio/mpeg" };
  }
  if (r.signale_le) return null;
  const { data, error } = await supabase.storage.from(SEAU_FIGURINES).download(s(r.son));
  if (error || !data) return null;
  if (compter) await supabase.from("clik_figurine_message").update({ ecoutes: (Number(r.ecoutes) || 0) + 1 }).eq("id", id);
  return { octets: Buffer.from(await data.arrayBuffer()), type: data.type || "audio/webm" };
}

/** « Signaler » : le message ne s'affiche plus, jusqu'à ce que l'admin le remette. */
export async function signalerMessage(supabase: Supabase, id: string): Promise<boolean> {
  const r = await ligneMessage(supabase, id);
  if (!r) {
    const f = await ficheDemo(supabase, id);
    if (!f) return false;
    return f.signale_le ? true : ecrireJson(supabase, cheminFiche(id), { ...f, signale_le: new Date().toISOString() });
  }
  if (!r.signale_le) await supabase.from("clik_figurine_message").update({ signale_le: new Date().toISOString() }).eq("id", id);
  return true;
}

// ─── l'admin : les figurines à faire, les messages signalés ────────────────────────────────────
export type FigurineAFaire = {
  habitantId: string;
  prenom: string;
  demande: string;
  photo: string;
  neutre: string;
  parle: string;
  prete: boolean;
  refus: string;
};
// (les mèmes signalés : `moderation-serveur.ts`)
export async function figurinesClients(supabase: Supabase): Promise<{ ok: boolean; figurines: FigurineAFaire[] }> {
  const { data, error } = await supabase.from("clik_ma_figurine").select("*").order("demande_le", { ascending: false }).limit(200);
  if (error) return { ok: false, figurines: [] };
  const lignes = (Array.isArray(data) ? data : []) as Ligne[];
  const figurines = await Promise.all(
    lignes.map(async (l) => ({
      habitantId: s(l.habitant_id),
      prenom: s(l.prenom),
      demande: s(l.demande_le),
      photo: await signer(supabase, s(l.photo)),
      neutre: await signer(supabase, s(l.neutre)),
      parle: await signer(supabase, s(l.parle)),
      prete: Boolean(l.prete_le),
      refus: s(l.refus),
    })),
  );
  return { ok: true, figurines };
}

/** Les deux images de sa figurine (bouche fermée, bouche ouverte), faites par ClikMe : elle est prête. */
export async function poserImagesFigurine(supabase: Supabase, habitantId: string, neutre: unknown, parle: unknown): Promise<{ error?: string }> {
  const a = image(neutre);
  const b = image(parle);
  if (!a || !b) return { error: "Il faut les deux images : bouche fermée et bouche ouverte." };
  const { ligne } = await lireLigne(supabase, habitantId);
  if (!ligne) return { error: "Pas de demande pour cette personne." };
  const chemins: string[] = [];
  for (const [brut, nom] of [
    [a, "neutre"],
    [b, "parle"],
  ] as const) {
    let octets: Buffer;
    try {
      octets = await sharp(brut).rotate().resize(900, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    } catch {
      return { error: "Une des images n’a pas pu être lue." };
    }
    const chemin = `${habitantId}/${nom}-${empreinte(brut)}.webp`;
    if (!(await deposer(supabase, chemin, octets, "image/webp"))) return { error: "Les images ne sont pas parties." };
    chemins.push(chemin);
  }
  const maintenant = new Date().toISOString();
  const { error } = await supabase.from("clik_ma_figurine").update({ neutre: chemins[0], parle: chemins[1], prete_le: maintenant, refus: null, updated_at: maintenant }).eq("habitant_id", habitantId);
  return error ? { error: "Les images ne sont pas enregistrées." } : {};
}

/** Sa photo ne peut pas servir : il en renverra une autre (on lui dit pourquoi). */
export async function refuserPhoto(supabase: Supabase, habitantId: string, raison: unknown): Promise<{ error?: string }> {
  const r = s(raison).slice(0, 140) || "Cette photo ne permet pas de faire ta figurine.";
  const { error } = await supabase.from("clik_ma_figurine").update({ refus: r, updated_at: new Date().toISOString() }).eq("habitant_id", habitantId);
  return error ? { error: "Pas enregistré." } : {};
}
