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
import { famillesDe } from "./famille-serveur";
import { figurineDu } from "./figurines-commerces";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import {
  COMMERCES_MAX_MESSAGE,
  DUREE_MAX_MESSAGE,
  IMAGES_DEMO,
  SENTIMENTS,
  figurinesEnTout,
  optionsOuvertes,
  sentimentOuvert,
  voixOuverte,
  idMessageValide,
  prenomValide,
  sentimentValide,
  texteValide,
  voixValide,
  type CommerceCite,
  type EtatMaFigurine,
  type Expressions,
  type MessageFigurine,
} from "./ma-figurine";
import { expressionsCompletes, expressionsDe, fabriquerUnTour, type Depot } from "./figurine-expressions-serveur";
import { lireLeTexte, voixBranchee } from "./voix-figurine-serveur";
import { motInterdit } from "./mots-interdits";
import { FABRICATIONS_PAR_JOUR, NOM_NEUTRE, NOM_PARLE, fabricationsParJourPourTous, fabriquerUnPas, moteurBranche } from "./ma-figurine-fabrique-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
type Ligne = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export const SEAU_FIGURINES = s(process.env.FIGURINES_CLIENTS_BUCKET) || "figurines-clients";
const MESSAGES_PAR_JOUR = 30;

// ─── le stockage privé ────────────────────────────────────────────────────────────────────────
async function deposer(supabase: Supabase, chemin: string, octets: Buffer, type: string): Promise<boolean> {
  const envoyer = () => supabase.storage.from(SEAU_FIGURINES).upload(chemin, octets, { contentType: type, upsert: true });
  let { error } = await envoyer();
  if (error && /bucket/i.test(error.message)) {
    // le seau n'existe pas encore (la migration le crée aussi) : on le crée, privé
    await supabase.storage.createBucket(SEAU_FIGURINES, { public: false });
    ({ error } = await envoyer());
  }
  return !error;
}

async function signer(supabase: Supabase, chemin: string, secondes = 3600): Promise<string> {
  if (!chemin) return "";
  const { data } = await supabase.storage.from(SEAU_FIGURINES).createSignedUrl(chemin, secondes);
  return s(data?.signedUrl);
}

const empreinte = (b: Buffer | string) => createHash("sha1").update(b).digest("hex").slice(0, 16);

async function telecharger(supabase: Supabase, chemin: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(SEAU_FIGURINES).download(chemin);
  return error || !data ? null : Buffer.from(await data.arrayBuffer());
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
const dossierExpressions = (habitantId: string, neutre: string) => `${habitantId}/expr-${empreinte(neutre)}`;
/** La démonstration (la figurine du propriétaire) : ses expressions, les textes lus, les messages envoyés. */
const DOSSIER_DEMO = "demo-proprio/v1";

/** Ses expressions faites, en adresses signées. */
async function expressionsSignees(supabase: Supabase, dossier: string, secondes = 3600): Promise<{ expressions: Expressions; complete: boolean }> {
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

async function lireLigne(supabase: Supabase, habitantId: string): Promise<{ ok: boolean; ligne: Ligne | null }> {
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
const dossierFabrique = (habitantId: string, jeton: string) => `${habitantId}/fab-${jeton}`;
const nouveauJeton = () => randomBytes(6).toString("hex");
const essaisRestants = (f: Partial<Fabrique>) => Math.max(0, FABRICATIONS_PAR_JOUR - (f.jour === jourParis() ? Number(f.essais) || 0 : 0));

/** Les visages qu'il a ouverts (la joie dès le départ ; les autres, une visite après l'autre). */
const visagesOuverts = (total: number) => SENTIMENTS.map((x) => x.cle).filter((c) => sentimentOuvert(c, total));

export async function etatMaFigurine(supabase: Supabase, habitant: Habitant | null): Promise<EtatMaFigurine> {
  const vide: EtatMaFigurine = { total: 0, etape: "photo", prenom: "", compte: false, auto: moteurBranche(), commerces: [], messages: [] };
  if (!habitant) return vide;
  const [{ total, commerces }, prenom, { ok, ligne }] = await Promise.all([
    sesFigurines(supabase, habitant.id),
    prenomDe(supabase, habitant),
    lireLigne(supabase, habitant.id),
  ]);
  const base: EtatMaFigurine = { ...vide, total, prenom, commerces, compte: true };
  const prete = Boolean(ligne?.prete_le && s(ligne?.neutre) && s(ligne?.parle));
  if (!ok) return { ...base, etape: "bientot" };
  if (!prete && (!ligne || !s(ligne.photo) || s(ligne.refus))) return { ...base, etape: "photo", ...(s(ligne?.refus) ? { refus: s(ligne?.refus) } : {}) };
  if (!prete) return { ...base, etape: "fabrication" };
  const [neutre, parle, { data: msgs }, expr, fab] = await Promise.all([
    signer(supabase, s(ligne!.neutre)),
    signer(supabase, s(ligne!.parle)),
    supabase.from("clik_figurine_message").select("*").eq("habitant_id", habitant.id).order("created_at", { ascending: false }).limit(20),
    expressionsSignees(supabase, dossierExpressions(habitant.id, s(ligne!.neutre))),
    lireJson<Fabrique>(supabase, cheminFabrique(habitant.id)),
  ]);
  const ouverts = visagesOuverts(total);
  return {
    ...base,
    etape: "prete",
    neutre,
    parle,
    expressions: expr.expressions,
    expressionsAFaire: ouverts.some((c) => !expr.expressions[c]),
    voixTexte: voixBranchee(),
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
 * 🛠️ UN PAS DE FABRICATION DE SA FIGURINE (le moteur d'image) : sa figurine, puis sa bouche ouverte ; à la fin, elle
 * est prête. Sans moteur branché : rien (ClikMe la fait à la main, depuis l'admin).
 */
export async function fabriquerMaFigurine(supabase: Supabase, habitant: Habitant, avant: number): Promise<{ error?: string; enCours?: boolean; statut?: number }> {
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
  const photo = await telecharger(supabase, s(ligne.photo));
  if (!photo) return { error: "Ta photo est introuvable : envoie-la de nouveau.", statut: 400 };
  const r = await fabriquerUnPas(depotDans(supabase, dossier()), photo, avant);
  if (r.nouvelle) {
    const tous = `fabrication/jour/${jourParis()}.json`;
    const compte = await lireJson<{ n: number }>(supabase, tous);
    await ecrireJson(supabase, tous, { n: (compte.n ?? 0) + 1 });
  }
  if (r.erreur) return { error: r.erreur, statut: 502 };
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
export async function refaireMaFigurine(supabase: Supabase, habitant: Habitant, autrePhoto: boolean): Promise<{ error?: string; statut?: number }> {
  const { ok, ligne } = await lireLigne(supabase, habitant.id);
  if (!ok || !ligne) return { error: "Envoie d’abord ta photo.", statut: 400 };
  const fab = await lireJson<Fabrique>(supabase, cheminFabrique(habitant.id));
  if (!autrePhoto && !moteurBranche()) return { error: "Ta figurine ne peut pas être refaite ici.", statut: 400 };
  if (!autrePhoto && essaisRestants(fab) <= 0) return { error: "Assez d’essais pour aujourd’hui : reviens demain.", statut: 429 };
  const maintenant = new Date().toISOString();
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
export async function fabriquerSesExpressions(supabase: Supabase, habitant: Habitant, avant: number): Promise<{ error?: string; enCours?: boolean }> {
  const { ligne } = await lireLigne(supabase, habitant.id);
  if (!ligne?.prete_le || !s(ligne.neutre)) return { error: "Ta figurine n’est pas encore prête." };
  const source = await telecharger(supabase, s(ligne.neutre));
  if (!source) return { error: "Ta figurine est introuvable." };
  // seulement les visages qu'il a ouverts : les autres se feront quand il les aura gagnés
  const { total } = await sesFigurines(supabase, habitant.id);
  const r = await fabriquerUnTour(depotDans(supabase, dossierExpressions(habitant.id, s(ligne.neutre))), source, avant, visagesOuverts(total));
  return r.erreur ? { error: r.erreur } : r.enCours ? { enCours: true } : {};
}

/** ✍️ Son texte, lu par la voix choisie : 20 lectures par jour au plus (chacune coûte). */
const LECTURES_PAR_JOUR = 20;
export async function lireSonTexte(supabase: Supabase, habitant: Habitant, texte: unknown, voix: unknown): Promise<{ mp3?: Buffer; error?: string; statut?: number }> {
  const t = texteValide(texte);
  const v = voixValide(voix);
  if (!t || !v) return { error: "Écris ce qu’elle doit dire, et choisis sa voix.", statut: 400 };
  if (motInterdit(t)) return { error: MOT_REFUSE, statut: 422 };
  const etat = await etatMaFigurine(supabase, habitant);
  if (etat.etape !== "prete") return { error: "Ta figurine n’est pas encore prête.", statut: 400 };
  if (!voixOuverte(v, etat.total)) return { error: "Cette voix s’ouvre à ta 2ᵉ visite chez un commerce ClikMe.", statut: 403 };
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

async function lireJson<T extends object>(supabase: Supabase, chemin: string): Promise<Partial<T>> {
  try {
    return JSON.parse((await telecharger(supabase, chemin))?.toString() || "{}") as Partial<T>;
  } catch {
    return {};
  }
}
const ecrireJson = (supabase: Supabase, chemin: string, x: unknown) => deposer(supabase, chemin, Buffer.from(JSON.stringify(x)), "application/json");

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
export async function envoyerPhoto(supabase: Supabase, habitant: Habitant, photo: unknown, accord: unknown, prenom?: unknown): Promise<{ error?: string }> {
  if (accord !== true) return { error: "Coche « C’est bien moi sur la photo »." };
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
): Promise<{ id?: string; error?: string }> {
  const m = /^data:(audio\/(?:webm|ogg|mp4|mpeg|x-m4a|aac|wav))(?:;[^,]*)?;base64,(.+)$/i.exec(s(son));
  if (!m) return { error: "Ton message n’a pas pu être enregistré. Réessaie." };
  const brut = Buffer.from(m[2], "base64");
  const d = Number(duree);
  if (!brut.length || brut.length > 2 * 1024 * 1024 || !(d > 0.3) || d > DUREE_MAX_MESSAGE + 1) return { error: `Un message dure ${DUREE_MAX_MESSAGE} secondes au plus.` };
  const etat = await etatMaFigurine(supabase, habitant);
  if (etat.etape !== "prete") return { error: "Ta figurine n’est pas encore prête." };
  // SES OPTIONS, tenues ici aussi (pas seulement sur la page)
  if (!sentimentOuvert(sentimentValide(sentiment), etat.total)) return { error: "Ce visage s’ouvre avec tes prochaines visites chez les commerces ClikMe." };
  const vOk = voixValide(voix);
  // (sa propre voix : la 2ᵉ option — ou dès le départ quand aucune voix ne lit les textes)
  if (texteValide(texte) ? vOk && !voixOuverte(vOk, etat.total) : !voixOuverte("micro", etat.total) && voixBranchee()) return { error: "Cette voix s’ouvre à ta 2ᵉ visite chez un commerce ClikMe." };
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
  const sent = sentimentValide(sentiment);
  const t = texteValide(texte);
  const v = voixValide(voix);
  const plus = { ...(sent ? { sentiment: sent } : {}), ...(t ? { texte: t } : {}), ...(t && v ? { voix: v } : {}) };
  let { error } = await supabase.from("clik_figurine_message").insert({ ...ligne, ...plus });
  // « sentiment », « texte » et « voix » arrivent avec leurs migrations : sans elles, le message part quand même
  const manque = (e: typeof error) => /sentiment|texte|voix/i.test(`${e?.message ?? ""} ${(e as { details?: string } | null)?.details ?? ""}`);
  if (error && Object.keys(plus).length && manque(error)) ({ error } = await supabase.from("clik_figurine_message").insert(sent ? { ...ligne, sentiment: sent } : ligne));
  if (error && sent && manque(error)) ({ error } = await supabase.from("clik_figurine_message").insert(ligne));
  return error ? { error: "Ton message n’est pas parti. Réessaie dans un instant." } : { id };
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
  const sentiment = sentimentValide(r.sentiment);
  const [neutre, parle, expr, siennes] = await Promise.all([
    signer(supabase, s(fig.neutre), 7200),
    signer(supabase, s(fig.parle), 7200),
    sentiment ? expressionsSignees(supabase, dossierExpressions(s(r.habitant_id), s(fig.neutre)), 7200).catch(() => null) : Promise.resolve(null),
    // ✨ le cadre doré : une option de l'expéditeur (ses figurines gagnées, aujourd'hui)
    sesFigurines(supabase, s(r.habitant_id)).catch(() => ({ total: 0 })),
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
    ...(optionsOuvertes(siennes.total).has("or") ? { or: true } : {}),
    commerces: slugs.flatMap((slug) => {
      const x = parSlug.get(slug);
      if (!x) return [];
      const metier = s(x.activite);
      return [{ slug, nom: s(x.business_name), ville: s(x.city).replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim(), figurine: figurineDu(slug, { branche: brancheDuMetier(metier), metier }) }];
    }),
  };
}

/** Sa voix, pour la page du message (et une écoute de plus). */
export async function sonDuMessage(supabase: Supabase, id: string): Promise<{ octets: Buffer; type: string } | null> {
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
  await supabase.from("clik_figurine_message").update({ ecoutes: (Number(r.ecoutes) || 0) + 1 }).eq("id", id);
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
export type MessageSignale = { id: string; prenom: string; le: string; son: string };

export async function figurinesClients(supabase: Supabase): Promise<{ ok: boolean; figurines: FigurineAFaire[]; signales: MessageSignale[] }> {
  const { data, error } = await supabase.from("clik_ma_figurine").select("*").order("demande_le", { ascending: false }).limit(200);
  if (error) return { ok: false, figurines: [], signales: [] };
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
  const { data: sig } = await supabase.from("clik_figurine_message").select("*").not("signale_le", "is", null).is("retire_le", null).limit(100);
  const prenoms = new Map(lignes.map((l) => [s(l.habitant_id), s(l.prenom)]));
  const signales = await Promise.all(
    ((Array.isArray(sig) ? sig : []) as Ligne[]).map(async (m) => ({ id: s(m.id), prenom: prenoms.get(s(m.habitant_id)) ?? "", le: s(m.signale_le), son: await signer(supabase, s(m.son)) })),
  );
  return { ok: true, figurines, signales };
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

/** Un message signalé : le remettre, ou le retirer pour de bon. */
export async function modererMessage(supabase: Supabase, id: string, geste: unknown): Promise<{ error?: string }> {
  if (!idMessageValide(id) || (geste !== "remettre" && geste !== "retirer")) return { error: "Demande incomplète." };
  const { error } = await supabase
    .from("clik_figurine_message")
    .update(geste === "remettre" ? { signale_le: null } : { retire_le: new Date().toISOString() })
    .eq("id", id);
  return error ? { error: "Pas enregistré." } : {};
}
