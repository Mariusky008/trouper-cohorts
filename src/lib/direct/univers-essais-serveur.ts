/**
 * 🧪 LES ESSAIS DU LOT 0, CÔTÉ SERVEUR — voir `univers-essais.ts` pour ce qu'on essaie, et pourquoi.
 *
 * LE SEAU (privé, `figurines-clients`), sous `essais-univers/` (rien d'autre n'y touche) :
 *   · `personnes/<id>.json` = { id, nom, accordLe, le, traits } ; `personnes/<id>.png` = son selfie (1 024 pixels au
 *     plus, redressé) ;
 *   · `resultats/<id>.json` = une image d'essai et tout ce qui la décrit (sa consigne mot pour mot, le moteur, la durée,
 *     les jetons, l'avis du propriétaire) ; `resultats/<id>.png` = l'image ;
 *   · `jours/<jour>.json` = { n } : les images demandées ce jour-là (`IMAGES_PAR_JOUR` au plus).
 *
 * LE MOTEUR : celui des figurines (`moteursDImage` : le plus proche de ChatGPT dans le catalogue du compte), par la clé
 * `OPENAI_ESSAIS_API_KEY` / `OPENAI_ESSAIS_BASE_URL` si elles existent (les essais automatiques : un faux moteur),
 * sinon `OPENAI_API_KEY` / `OPENAI_BASE_URL`. La qualité : `ESSAIS_QUALITE` (« high » par défaut).
 * LES IMAGES SE FONT APRÈS LA RÉPONSE (la route, avec `after`) : la page relit toutes les cinq secondes ; le
 * téléphone peut se mettre en veille.
 *
 * FICHIER SERVEUR.
 */
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "@/lib/supabase/admin";
import { jourParis } from "@/lib/jour-paris";
import { decrireTraits, dejaTransparente, detourerSurFondUni, rogner } from "./figurine-pro-serveur";
import { traitsEnMots, type Traits } from "./figurine-pro";
import { SEAU_FIGURINES, deposer, ecrireJson, lireJson, signer, telecharger } from "./ma-figurine-serveur";
import { moteurRefuse, moteursDImage, noterRefus } from "./moteur-image";
import {
  FICHES_UNIVERS,
  FICHE_MAX,
  IMAGES_PAR_JOUR,
  NOM_MAX,
  NOTE_MAX,
  RETOUCHE_MAX,
  RETOUCHE_PAR_DEFAUT,
  consigneConstance,
  consigneDecor,
  consigneFigurineCollection,
  consigneRetouche,
  consigneVedette,
  directionUnivers,
  ficheUnivers,
  varianteConstance,
  varianteFigurine,
  type DirectionUnivers,
  type EtatEssais,
  type PersonneEssai,
  type ResultatEssai,
  type VarianteConstance,
  type VarianteFigurine,
} from "./univers-essais";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

const DOSSIER = "essais-univers";
const cheminPersonne = (id: string) => `${DOSSIER}/personnes/${id}.json`;
const cheminSelfie = (id: string) => `${DOSSIER}/personnes/${id}.png`;
const cheminResultat = (id: string) => `${DOSSIER}/resultats/${id}.json`;
const cheminImage = (id: string) => `${DOSSIER}/resultats/${id}.png`;
const cheminJour = (jour: string) => `${DOSSIER}/jours/${jour}.json`;
const idValide = (x: unknown) => (typeof x === "string" && /^[a-z0-9]{12}$/.test(x) ? x : null);
const nouvelId = () => randomUUID().replace(/-/g, "").slice(0, 12);
/** Une image qui n'a pas fini en dix minutes : la fonction s'est arrêtée en chemin. */
const PERIMEE_MS = 10 * 60_000;

type FichePersonne = { id: string; nom: string; accordLe: string; le: string; traits: Traits | null };

const cle = () => s(process.env.OPENAI_ESSAIS_API_KEY) || s(process.env.OPENAI_API_KEY);
const base = () => s(process.env.OPENAI_ESSAIS_BASE_URL) || s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
const qualite = () => s(process.env.ESSAIS_QUALITE) || "high";
export const moteurBranche = () => Boolean(cle());

async function lister(supabase: Supabase, dossier: string): Promise<string[]> {
  const noms: string[] = [];
  for (let debut = 0; debut < 5000; debut += 1000) {
    const { data } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: 1000, offset: debut });
    const lot = (Array.isArray(data) ? data : []) as { name?: string }[];
    noms.push(...lot.map((x) => s(x.name)));
    if (lot.length < 1000) break;
  }
  return noms;
}

// ─── ce que la page voit ──────────────────────────────────────────────────────────────────────────
/** 🧪 Tout : les personnes (leur selfie signé), les images (signées), les images du jour. */
export async function etatEssais(supabase: Supabase): Promise<EtatEssais> {
  const [nomsP, nomsR, jour] = await Promise.all([lister(supabase, `${DOSSIER}/personnes`), lister(supabase, `${DOSSIER}/resultats`), lireJson<{ n?: number }>(supabase, cheminJour(jourParis()))]);
  const personnes = (
    await Promise.all(
      nomsP
        .filter((n) => /^[a-z0-9]{12}\.json$/.test(n))
        .map(async (n): Promise<PersonneEssai | null> => {
          const f = await lireJson<FichePersonne>(supabase, `${DOSSIER}/personnes/${n}`);
          if (!f.id) return null;
          return { id: f.id, nom: s(f.nom), accordLe: s(f.accordLe), le: s(f.le), selfie: await signer(supabase, cheminSelfie(f.id), 3600), traits: traitsEnMots(f.traits ?? null).map((l) => l.replace(/^- /, "")) };
        }),
    )
  )
    .filter((x): x is PersonneEssai => Boolean(x))
    .sort((a, b) => a.le.localeCompare(b.le));
  const resultats = (
    await Promise.all(
      nomsR
        .filter((n) => /^[a-z0-9]{12}\.json$/.test(n))
        .map(async (n): Promise<ResultatEssai | null> => {
          const r = await lireJson<ResultatEssai>(supabase, `${DOSSIER}/resultats/${n}`);
          if (!r.id || (!r.personne && r.type !== "univers" && r.type !== "retouche")) return null;
          const perimee = r.etat === "en-cours" && Date.now() - (Date.parse(s(r.le)) || 0) > PERIMEE_MS;
          return {
            ...(r as ResultatEssai),
            ...(perimee ? { etat: "erreur" as const, erreur: "Interrompue en chemin (la fonction s'est arrêtée). Relancez." } : {}),
            image: r.etat === "fait" ? await signer(supabase, cheminImage(r.id), 3600) : undefined,
          };
        }),
    )
  )
    .filter((x): x is ResultatEssai => Boolean(x))
    .sort((a, b) => a.le.localeCompare(b.le));
  return { personnes, resultats, imagesDuJour: Number(jour.n) || 0, plafond: IMAGES_PAR_JOUR, branche: moteurBranche() };
}

// ─── les personnes ────────────────────────────────────────────────────────────────────────────────
const PHOTO = /^data:image\/(jpeg|png|webp|heic|heif);base64,(.+)$/i;

/**
 * 📸 UNE PERSONNE D'ESSAI : un repère (un prénom, « Volontaire 2 »…), son selfie, et l'accord coché — sans lui, rien.
 * Ses traits sont décrits ensuite (`decrireTraits`, la route s'en charge après la réponse).
 */
export async function ajouterPersonne(supabase: Supabase, nom: unknown, accord: unknown, photo: unknown): Promise<{ id?: string; error?: string; statut?: number }> {
  if (accord !== true) return { error: "Cochez d’abord : la personne est d’accord pour cet essai.", statut: 400 };
  const n = s(nom).replace(/\s+/g, " ").slice(0, NOM_MAX);
  if (!n) return { error: "Donnez un repère (un prénom, « Volontaire 2 »…).", statut: 400 };
  const m = PHOTO.exec(s(photo));
  if (!m) return { error: "Choisissez une photo.", statut: 400 };
  const brut = Buffer.from(m[2], "base64");
  if (brut.length > 12 * 1024 * 1024) return { error: "La photo est trop lourde.", statut: 413 };
  let png: Buffer;
  try {
    png = await sharp(brut).rotate().resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch {
    return { error: "Cette photo ne s’ouvre pas. Essayez en JPEG.", statut: 400 };
  }
  const id = nouvelId();
  if (!(await deposer(supabase, cheminSelfie(id), png, "image/png"))) return { error: "La photo n’est pas partie. Réessayez.", statut: 502 };
  const maintenant = new Date().toISOString();
  await ecrireJson(supabase, cheminPersonne(id), { id, nom: n, accordLe: maintenant, le: maintenant, traits: null });
  return { id };
}

/** 🔎 Ses traits, vus sur le selfie (après la réponse). */
export async function decrireSesTraits(supabase: Supabase, id: string): Promise<void> {
  const selfie = await telecharger(supabase, cheminSelfie(id));
  if (!selfie) return;
  const traits = await decrireTraits(selfie);
  const f = await lireJson<FichePersonne>(supabase, cheminPersonne(id));
  if (f.id) await ecrireJson(supabase, cheminPersonne(id), { ...f, traits });
}

/** 🗑️ Elle s'en va : son selfie, sa fiche, et toutes ses images. */
export async function effacerPersonne(supabase: Supabase, id: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const p = idValide(id);
  if (!p) return { error: "Cette personne n’existe pas.", statut: 404 };
  const noms = await lister(supabase, `${DOSSIER}/resultats`);
  const siens: string[] = [];
  await Promise.all(
    noms
      .filter((n) => /^[a-z0-9]{12}\.json$/.test(n))
      .map(async (n) => {
        const r = await lireJson<ResultatEssai>(supabase, `${DOSSIER}/resultats/${n}`);
        if (r.personne === p && r.id) siens.push(cheminResultat(r.id), cheminImage(r.id));
      }),
  );
  const { error } = await supabase.storage.from(SEAU_FIGURINES).remove([cheminPersonne(p), cheminSelfie(p), ...siens]);
  return error ? { error: "Ça n’a pas marché. Réessayez.", statut: 502 } : { ok: true };
}

// ─── les images ───────────────────────────────────────────────────────────────────────────────────
/** Le plafond du jour : `n` images de plus, ou non. */
async function reserver(supabase: Supabase, n: number): Promise<boolean> {
  const jour = jourParis();
  const c = await lireJson<{ n?: number }>(supabase, cheminJour(jour));
  const deja = Number(c.n) || 0;
  if (deja + n > IMAGES_PAR_JOUR) return false;
  await ecrireJson(supabase, cheminJour(jour), { n: deja + n });
  return true;
}

type Demande = {
  id: string;
  personne: string;
  type: ResultatEssai["type"];
  variante: string;
  source?: string;
  fiche?: string;
  figurine?: string;
  retouche?: string;
  consigne: string;
  /** les images données au moteur (aucune : il dessine d'après la consigne seule) */
  entrees: string[];
  /** une figurine détourée (fond transparent), ou une image pleine (un décor, une photo) */
  transparent: boolean;
};

/**
 * 🧸 LA FIGURINE D'UNE PERSONNE, dans les variantes demandées (toutes par défaut) : les fiches « en cours » tout de
 * suite ; les images, `fabriquer` (après la réponse).
 */
export async function demanderFigurines(supabase: Supabase, personne: unknown, variantes: unknown): Promise<{ demandes?: Demande[]; error?: string; statut?: number }> {
  const p = idValide(personne);
  if (!p) return { error: "Cette personne n’existe pas.", statut: 404 };
  const f = await lireJson<FichePersonne>(supabase, cheminPersonne(p));
  if (!f.id) return { error: "Cette personne n’existe pas.", statut: 404 };
  if (!moteurBranche()) return { error: "Le moteur d’image n’est pas branché ici (OPENAI_API_KEY).", statut: 503 };
  const l = (Array.isArray(variantes) && variantes.length ? variantes : ["collection", "collection-photo", "collection-douce"]).map(varianteFigurine).filter((v): v is VarianteFigurine => Boolean(v));
  const vs = [...new Set(l)];
  if (!vs.length) return { error: "Choisissez une variante.", statut: 400 };
  if (!(await reserver(supabase, vs.length))) return { error: `Assez d’images pour aujourd’hui (${IMAGES_PAR_JOUR}).`, statut: 429 };
  const demandes: Demande[] = vs.map((v) => ({ id: nouvelId(), personne: p, type: "figurine", variante: v, consigne: consigneFigurineCollection(v, f.traits ?? null), entrees: [cheminSelfie(p)], transparent: v !== "collection-photo" }));
  await Promise.all(demandes.map((d) => poserEnCours(supabase, d)));
  return { demandes };
}

/** 🔁 LA CONSTANCE d'une figurine qu'il a aimée : bouche ouverte, trois visages, debout (toutes par défaut). */
export async function demanderConstance(supabase: Supabase, source: unknown, variantes: unknown): Promise<{ demandes?: Demande[]; error?: string; statut?: number }> {
  const sid = idValide(source);
  const src = sid ? await lireJson<ResultatEssai>(supabase, cheminResultat(sid)) : {};
  if (!sid || !src.id || src.etat !== "fait" || !src.personne) return { error: "Cette figurine n’existe pas (ou n’est pas finie).", statut: 404 };
  if (!moteurBranche()) return { error: "Le moteur d’image n’est pas branché ici (OPENAI_API_KEY).", statut: 503 };
  const l = (Array.isArray(variantes) && variantes.length ? variantes : ["parle", "joie", "rire", "colere", "debout"]).map(varianteConstance).filter((v): v is VarianteConstance => Boolean(v));
  const vs = [...new Set(l)];
  if (!vs.length) return { error: "Choisissez une variante.", statut: 400 };
  if (!(await reserver(supabase, vs.length))) return { error: `Assez d’images pour aujourd’hui (${IMAGES_PAR_JOUR}).`, statut: 429 };
  const demandes: Demande[] = vs.map((v) => ({ id: nouvelId(), personne: src.personne as string, type: "constance", variante: v, source: sid, consigne: consigneConstance(v), entrees: [cheminImage(sid)], transparent: true }));
  await Promise.all(demandes.map((d) => poserEnCours(supabase, d)));
  return { demandes };
}

function poserEnCours(supabase: Supabase, d: Demande) {
  const r: ResultatEssai = {
    id: d.id,
    personne: d.personne,
    type: d.type,
    variante: d.variante,
    ...(d.source ? { source: d.source } : {}),
    ...(d.fiche ? { fiche: d.fiche } : {}),
    ...(d.figurine ? { figurine: d.figurine } : {}),
    ...(d.retouche ? { retouche: d.retouche } : {}),
    etat: "en-cours",
    qualite: qualite(),
    taille: "1024x1536",
    le: new Date().toISOString(),
    consigne: d.consigne,
  };
  return ecrireJson(supabase, cheminResultat(d.id), r);
}

/** 🎨 Les images demandées (trois à la fois au plus), après la réponse. */
export async function fabriquer(supabase: Supabase, demandes: Demande[]): Promise<void> {
  const avant = Date.now() + 280_000;
  for (let k = 0; k < demandes.length; k += 3) await Promise.all(demandes.slice(k, k + 3).map((d) => fabriquerUne(supabase, d, avant)));
}

async function fabriquerUne(supabase: Supabase, d: Demande, avant: number): Promise<void> {
  const r = await lireJson<ResultatEssai>(supabase, cheminResultat(d.id));
  const finir = (x: Partial<ResultatEssai>) => ecrireJson(supabase, cheminResultat(d.id), { ...r, ...x });
  const entrees = await Promise.all(d.entrees.map((c) => telecharger(supabase, c)));
  if (entrees.some((x) => !x)) return void (await finir({ etat: "erreur", erreur: "L’image de départ est introuvable." }));
  const t0 = Date.now();
  const rendu = await demanderAuMoteur({ images: entrees as Buffer[], consigne: d.consigne, transparent: d.transparent, avant });
  const dureeS = Math.round((Date.now() - t0) / 100) / 10;
  if ("erreur" in rendu) return void (await finir({ etat: "erreur", erreur: rendu.erreur, dureeS }));
  if (!(await deposer(supabase, cheminImage(d.id), rendu.png, "image/png"))) return void (await finir({ etat: "erreur", erreur: "L’image n’a pas pu être rangée.", dureeS }));
  await finir({ etat: "fait", modele: rendu.modele, dureeS, ...(rendu.jetons ? { jetons: rendu.jetons } : {}) });
}

/**
 * UNE IMAGE DEMANDÉE AU MOTEUR — à partir d'images (`/v1/images/edits`), ou d'après la consigne seule
 * (`/v1/images/generations`, un décor) : les replis de moteur (un modèle refusé : le suivant) et de réglages (un réglage
 * inconnu : on le retire et on rejoue), comme pour les figurines d'aujourd'hui.
 */
async function demanderAuMoteur(o: { images: Buffer[]; consigne: string; transparent: boolean; avant: number }): Promise<{ png: Buffer; modele: string; jetons?: number } | { erreur: string }> {
  const k = cle();
  if (!k) return { erreur: "Le moteur d’image n’est pas branché ici." };
  const b = base();
  const { liste } = await moteursDImage(k, b);
  const images = await Promise.all(o.images.map((x) => sharp(x).png().toBuffer()));
  const dessin = images.length === 0;
  let derniere = "Le moteur d’image n’a pas répondu.";
  for (let m = 0; m < liste.length; m++) {
    const modele = liste[m];
    const reglages: Record<string, string> = {
      size: "1024x1536",
      quality: qualite(),
      ...(dessin ? {} : { input_fidelity: "high" }),
      ...(o.transparent ? { background: "transparent" } : {}),
      output_format: "png",
    };
    for (let essai = 0; essai < 4; essai++) {
      const reste = o.avant - Date.now();
      if (reste < 15_000) return { erreur: "Trop long : la fonction allait s’arrêter. Relancez." };
      let r: Response;
      try {
        if (dessin) {
          r = await fetch(`${b}/v1/images/generations`, {
            method: "POST",
            headers: { authorization: `Bearer ${k}`, "content-type": "application/json" },
            body: JSON.stringify({ model: modele, prompt: o.consigne, n: 1, ...reglages }),
            signal: AbortSignal.timeout(reste - 5_000),
          });
        } else {
          const forme = new FormData();
          forme.append("model", modele);
          forme.append("prompt", o.consigne);
          forme.append("n", "1");
          for (const [c, v] of Object.entries(reglages)) forme.append(c, v);
          images.forEach((x, i) => forme.append("image[]", new File([new Uint8Array(x)], `image-${i + 1}.png`, { type: "image/png" })));
          r = await fetch(`${b}/v1/images/edits`, { method: "POST", headers: { authorization: `Bearer ${k}` }, body: forme, signal: AbortSignal.timeout(reste - 5_000) });
        }
      } catch {
        return { erreur: "Le moteur n’a pas répondu à temps. Relancez." };
      }
      if (r.ok) {
        const j = (await r.json().catch(() => null)) as { data?: { b64_json?: string }[]; usage?: { total_tokens?: number } } | null;
        const b64 = j?.data?.[0]?.b64_json;
        if (!b64) return { erreur: "Le moteur n’a pas rendu d’image." };
        try {
          let png: Buffer = Buffer.from(b64, "base64");
          if (o.transparent) {
            if (!(await dejaTransparente(png))) png = await detourerSurFondUni(png);
            png = await rogner(png);
          }
          return { png, modele, ...(j?.usage?.total_tokens ? { jetons: j.usage.total_tokens } : {}) };
        } catch {
          return { erreur: "L’image rendue n’a pas pu être préparée." };
        }
      }
      const txt = await r.text().catch(() => "");
      derniere = `Le moteur a répondu ${r.status} : ${txt.slice(0, 160)}`;
      if (r.status === 400) {
        const inconnus = Object.keys(reglages).filter((c) => new RegExp(`(unknown|unsupported|unrecognized|not supported|invalid)[^.]{0,60}${c}|${c}[^.]{0,60}(unknown|unsupported|not supported|invalid)`, "i").test(txt));
        if (inconnus.length) {
          for (const c of inconnus) delete reglages[c];
          continue;
        }
        if (/safety|rejected|moderation/i.test(txt)) return { erreur: `Refusé par le moteur (sécurité) : ${txt.slice(0, 160)}` };
      }
      if (m < liste.length - 1 && moteurRefuse(r.status, txt)) {
        noterRefus(modele);
        break;
      }
      return { erreur: derniere };
    }
  }
  return { erreur: derniere };
}

// ─── l'étape 2 : les univers ──────────────────────────────────────────────────────────────────────
/**
 * 🌍 DES DÉCORS : des fiches (les trois d'essai, ou « Ma fiche », son texte) × des directions de style. Neuf au plus.
 * Ni personne, ni selfie : le décor est dessiné d'après la consigne seule.
 */
export async function demanderUnivers(supabase: Supabase, fiches: unknown, directions: unknown, texte: unknown): Promise<{ demandes?: Demande[]; error?: string; statut?: number }> {
  if (!moteurBranche()) return { error: "Le moteur d’image n’est pas branché ici (OPENAI_API_KEY).", statut: 503 };
  const perso = s(texte).replace(/\s+/g, " ").slice(0, FICHE_MAX);
  const fs = [...new Set((Array.isArray(fiches) ? fiches : []).map((x): string => (x === "perso" ? "perso" : (ficheUnivers(x) ?? ""))).filter(Boolean))];
  if (fs.includes("perso") && perso.length < 20) return { error: "Écrivez votre fiche (quelques phrases sur le lieu).", statut: 400 };
  const ds = [...new Set((Array.isArray(directions) ? directions : []).map(directionUnivers).filter((x): x is DirectionUnivers => Boolean(x)))];
  if (!fs.length || !ds.length) return { error: "Choisissez une fiche et une direction.", statut: 400 };
  const paires = fs.flatMap((f) => ds.map((d) => [f, d] as const)).slice(0, 9);
  if (!(await reserver(supabase, paires.length))) return { error: `Assez d’images pour aujourd’hui (${IMAGES_PAR_JOUR}).`, statut: 429 };
  const texteDe = (f: string) => (f === "perso" ? perso : (FICHES_UNIVERS.find((x) => x.cle === f)?.fiche ?? ""));
  const demandes: Demande[] = paires.map(([f, d]) => ({ id: nouvelId(), personne: "", type: "univers", variante: d, fiche: f, consigne: consigneDecor(texteDe(f), d), entrees: [], transparent: false }));
  await Promise.all(demandes.map((d) => poserEnCours(supabase, d)));
  return { demandes };
}

/** Un décor fini (un univers, ou sa retouche). */
async function decorFini(supabase: Supabase, id: unknown): Promise<ResultatEssai | null> {
  const d = idValide(id);
  const r = d ? await lireJson<ResultatEssai>(supabase, cheminResultat(d)) : {};
  return r.id && r.etat === "fait" && (r.type === "univers" || r.type === "retouche") ? (r as ResultatEssai) : null;
}

/** ✏️ UNE RETOUCHE d'un décor (« davantage de nature » par défaut) : le reste doit tenir. */
export async function demanderRetouche(supabase: Supabase, decor: unknown, texte: unknown): Promise<{ demandes?: Demande[]; error?: string; statut?: number }> {
  const d = await decorFini(supabase, decor);
  if (!d) return { error: "Ce décor n’existe pas (ou n’est pas fini).", statut: 404 };
  if (!moteurBranche()) return { error: "Le moteur d’image n’est pas branché ici (OPENAI_API_KEY).", statut: 503 };
  const retouche = s(texte).replace(/\s+/g, " ").slice(0, RETOUCHE_MAX) || RETOUCHE_PAR_DEFAUT;
  if (!(await reserver(supabase, 1))) return { error: `Assez d’images pour aujourd’hui (${IMAGES_PAR_JOUR}).`, statut: 429 };
  const demandes: Demande[] = [{ id: nouvelId(), personne: "", type: "retouche", variante: "retouche", source: d.id, fiche: d.fiche, retouche, consigne: consigneRetouche(retouche), entrees: [cheminImage(d.id)], transparent: false }];
  await poserEnCours(supabase, demandes[0]);
  return { demandes };
}

/** ⭐ LA VEDETTE : le moteur pose une figurine détourée dans un décor (à comparer à la scène composée). */
export async function demanderVedette(supabase: Supabase, decor: unknown, figurine: unknown): Promise<{ demandes?: Demande[]; error?: string; statut?: number }> {
  const d = await decorFini(supabase, decor);
  if (!d) return { error: "Ce décor n’existe pas (ou n’est pas fini).", statut: 404 };
  const fid = idValide(figurine);
  const f = fid ? await lireJson<ResultatEssai>(supabase, cheminResultat(fid)) : {};
  if (!fid || !f.id || f.etat !== "fait" || (f.type !== "figurine" && f.type !== "constance") || f.variante === "collection-photo") return { error: "Choisissez une figurine détourée.", statut: 400 };
  if (!moteurBranche()) return { error: "Le moteur d’image n’est pas branché ici (OPENAI_API_KEY).", statut: 503 };
  if (!(await reserver(supabase, 1))) return { error: `Assez d’images pour aujourd’hui (${IMAGES_PAR_JOUR}).`, statut: 429 };
  const demandes: Demande[] = [
    { id: nouvelId(), personne: s(f.personne), type: "vedette", variante: "vedette", source: d.id, fiche: d.fiche, figurine: fid, consigne: consigneVedette(), entrees: [cheminImage(d.id), cheminImage(fid)], transparent: false },
  ];
  await poserEnCours(supabase, demandes[0]);
  return { demandes };
}

// ─── l'avis du propriétaire ───────────────────────────────────────────────────────────────────────
/** 👍 / 👎, et une note : ce qui fera le verdict de chaque essai. */
export async function donnerAvis(supabase: Supabase, id: unknown, avis: unknown, note: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const r = idValide(id);
  const f = r ? await lireJson<ResultatEssai>(supabase, cheminResultat(r)) : {};
  if (!r || !f.id) return { error: "Cette image n’existe pas.", statut: 404 };
  const a = avis === "oui" || avis === "non" ? avis : undefined;
  const n = s(note).slice(0, NOTE_MAX);
  const x: Record<string, unknown> = { ...f };
  delete x.avis;
  delete x.note;
  await ecrireJson(supabase, cheminResultat(r), { ...x, ...(a ? { avis: a } : {}), ...(n ? { note: n } : {}) });
  return { ok: true };
}

/** 🗑️ Une image ratée s'en va. */
export async function effacerResultat(supabase: Supabase, id: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const r = idValide(id);
  if (!r) return { error: "Cette image n’existe pas.", statut: 404 };
  await supabase.storage.from(SEAU_FIGURINES).remove([cheminResultat(r), cheminImage(r)]);
  return { ok: true };
}
