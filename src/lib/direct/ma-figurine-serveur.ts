/**
 * 🗣️ SA PROPRE FIGURINE, CÔTÉ SERVEUR — voir `ma-figurine.ts` pour la règle, et la migration
 * `20261106090000_clik_ma_figurine.sql`.
 *
 * TOUT EST PRIVÉ : sa photo, ses deux images et ses messages vont dans le seau `figurines-clients`, sans adresse
 * publique. Les images partent en adresses signées (une heure) ; la voix passe par notre route
 * (`/api/direct/ma-figurine/son`), pour que le navigateur puisse la lire ET faire bouger la bouche dessus.
 *
 * SANS LA MIGRATION : le compteur jusqu'à 10 marche (il ne lit que les collections) ; au-delà, « bientôt ».
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
  SEUIL_MA_FIGURINE,
  figurinesEnTout,
  idMessageValide,
  type CommerceCite,
  type EtatMaFigurine,
  type MessageFigurine,
} from "./ma-figurine";

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

const empreinte = (b: Buffer) => createHash("sha1").update(b).digest("hex").slice(0, 16);

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

export async function etatMaFigurine(supabase: Supabase, habitant: Habitant | null): Promise<EtatMaFigurine> {
  const vide: EtatMaFigurine = { total: 0, seuil: SEUIL_MA_FIGURINE, etape: "a-gagner", prenom: "", commerces: [], messages: [] };
  if (!habitant) return vide;
  const [{ total, commerces }, prenom, { ok, ligne }] = await Promise.all([
    sesFigurines(supabase, habitant.id),
    prenomDe(supabase, habitant),
    lireLigne(supabase, habitant.id),
  ]);
  const base = { ...vide, total, prenom, commerces };
  const prete = Boolean(ligne?.prete_le && s(ligne?.neutre) && s(ligne?.parle));
  if (!ok) return { ...base, etape: total >= SEUIL_MA_FIGURINE ? "bientot" : "a-gagner" };
  if (!prete && total < SEUIL_MA_FIGURINE) return base;
  if (!prete && (!ligne || !s(ligne.photo) || s(ligne.refus))) return { ...base, etape: "photo", ...(s(ligne?.refus) ? { refus: s(ligne?.refus) } : {}) };
  if (!prete) return { ...base, etape: "fabrication" };
  const [neutre, parle, { data: msgs }] = await Promise.all([
    signer(supabase, s(ligne!.neutre)),
    signer(supabase, s(ligne!.parle)),
    supabase.from("clik_figurine_message").select("id, created_at, ecoutes, signale_le, retire_le").eq("habitant_id", habitant.id).order("created_at", { ascending: false }).limit(20),
  ]);
  return {
    ...base,
    etape: "prete",
    neutre,
    parle,
    messages: ((Array.isArray(msgs) ? msgs : []) as Ligne[])
      .filter((m) => !m.retire_le)
      .map((m) => ({ id: s(m.id), le: s(m.created_at), ecoutes: Number(m.ecoutes) || 0, signale: Boolean(m.signale_le) })),
  };
}

// ─── 1. sa photo ───────────────────────────────────────────────────────────────────────────────
export async function envoyerPhoto(supabase: Supabase, habitant: Habitant, photo: unknown, accord: unknown): Promise<{ error?: string }> {
  if (accord !== true) return { error: "Coche « C’est bien moi sur la photo »." };
  const brut = image(photo);
  if (!brut) return { error: "Cette photo n’a pas pu être lue. Essaie une autre photo." };
  const { total } = await sesFigurines(supabase, habitant.id);
  if (total < SEUIL_MA_FIGURINE) return { error: `Il te faut ${SEUIL_MA_FIGURINE} figurines pour avoir la tienne.` };
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
  return error ? { error: "La photo n’est pas partie. Réessaie dans un instant." } : {};
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
): Promise<{ id?: string; error?: string }> {
  const m = /^data:(audio\/(?:webm|ogg|mp4|mpeg|x-m4a|aac|wav))(?:;[^,]*)?;base64,(.+)$/i.exec(s(son));
  if (!m) return { error: "Ton message n’a pas pu être enregistré. Réessaie." };
  const brut = Buffer.from(m[2], "base64");
  const d = Number(duree);
  if (!brut.length || brut.length > 2 * 1024 * 1024 || !(d > 0.3) || d > DUREE_MAX_MESSAGE + 1) return { error: `Un message dure ${DUREE_MAX_MESSAGE} secondes au plus.` };
  const etat = await etatMaFigurine(supabase, habitant);
  if (etat.etape !== "prete") return { error: "Ta figurine n’est pas encore prête." };
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
  const { error } = await supabase.from("clik_figurine_message").insert({ id, habitant_id: habitant.id, son: chemin, duree: Math.round(d * 10) / 10, commerces: cites });
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
  if (!r) return null;
  const { ligne: fig } = await lireLigne(supabase, s(r.habitant_id));
  if (!fig || !s(fig.neutre) || !s(fig.parle)) return null;
  const prenom = s(fig.prenom);
  if (r.signale_le) return { signale: true, prenom };
  const slugs = (Array.isArray(r.commerces) ? r.commerces : []).map(s).filter(Boolean);
  const { data: sites } = slugs.length
    ? await supabase.from("human_vitrine_sites").select("slug, business_name, city, activite, est_client").in("slug", slugs)
    : { data: [] };
  const parSlug = new Map(((Array.isArray(sites) ? sites : []) as Ligne[]).filter((x) => x.est_client === true).map((x) => [s(x.slug), x]));
  const [neutre, parle] = await Promise.all([signer(supabase, s(fig.neutre), 7200), signer(supabase, s(fig.parle), 7200)]);
  return {
    signale: false,
    id,
    prenom,
    neutre,
    parle,
    duree: Number(r.duree) || 0,
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
  if (!r || r.signale_le) return null;
  const { data, error } = await supabase.storage.from(SEAU_FIGURINES).download(s(r.son));
  if (error || !data) return null;
  await supabase.from("clik_figurine_message").update({ ecoutes: (Number(r.ecoutes) || 0) + 1 }).eq("id", id);
  return { octets: Buffer.from(await data.arrayBuffer()), type: data.type || "audio/webm" };
}

/** « Signaler » : le message ne s'affiche plus, jusqu'à ce que l'admin le remette. */
export async function signalerMessage(supabase: Supabase, id: string): Promise<boolean> {
  const r = await ligneMessage(supabase, id);
  if (!r) return false;
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
