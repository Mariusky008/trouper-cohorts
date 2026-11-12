/**
 * 🎁 SES CADEAUX, CÔTÉ SERVEUR (`etapes.ts`) — les étapes qu'il a franchies, lues là où elles se trouvent déjà : sa
 * figurine (`clik_ma_figurine`), sa carte (`<habitant>/personnage.json`), ses messages (`clik_figurine_message`), ce
 * qu'il a dit de lui (`<habitant>/rencontres.json`, `dit` : la question du jour), ses jours de présence
 * (`<habitant>/presence.json`, noté ici : un jour par visite de la page) et ses figurines du mois (les familles).
 *
 * SES JOURS DE PRÉSENCE font aussi sa figurine du mois (10 jours sur ClikMe dans le mois : `joursDePresence`).
 *
 * CE QUI ÉTAIT DÉJÀ OUVERT LE RESTE : à la première lecture, ce que ses figurines lui ouvraient avant (une option par
 * figurine gagnée, jusqu'au 5 novembre 2026) est noté une fois pour toutes (`<habitant>/cadeaux.json`, `acquis`) ; ses
 * cadeaux comptent au moins cela. Ensuite, seules les étapes font progresser.
 *
 * Aucun import de `ma-figurine-serveur` ni de `personnage-serveur` (qui s'en servent tous les deux).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { ETAPES, type Cadeaux, type CleEtape } from "./etapes";
import { OPTIONS_FIGURINE } from "./ma-figurine";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const SEAU = s(process.env.FIGURINES_CLIENTS_BUCKET) || "figurines-clients";
const jourParis = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

async function lire<T>(supabase: Supabase, chemin: string): Promise<T | null> {
  try {
    const { data, error } = await supabase.storage.from(SEAU).download(chemin);
    if (error || !data) return null;
    return JSON.parse(Buffer.from(await data.arrayBuffer()).toString()) as T;
  } catch {
    return null;
  }
}
const ecrire = async (supabase: Supabase, chemin: string, x: unknown) =>
  void (await supabase.storage
    .from(SEAU)
    .upload(chemin, Buffer.from(JSON.stringify(x)), { contentType: "application/json", upsert: true })
    .catch(() => null));

type Rencontres = { liste?: unknown[]; amis?: unknown[]; moi?: number; pas?: number; membreJour?: string; dit?: unknown[] };

/**
 * Ses cadeaux (`figurines` : ses figurines du mois gagnées, tous commerces confondus). `noterPresence` : c'est bien
 * lui qui est sur la page (pas quelqu'un qui ouvre son message) — aujourd'hui compte comme un jour de présence.
 */
export async function cadeauxDe(supabase: Supabase, habitantId: string, figurines: number, noterPresence = true): Promise<Cadeaux> {
  if (!habitantId) return { cadeaux: 0, etapes: [] };
  const [fig, carte, msg, rencontres, presence, notes, duo, voeu] = await Promise.all([
    Promise.resolve(supabase.from("clik_ma_figurine").select("prete_le").eq("habitant_id", habitantId).maybeSingle()).catch(() => ({ data: null })),
    lire<object>(supabase, `${habitantId}/personnage.json`),
    Promise.resolve(supabase.from("clik_figurine_message").select("id").eq("habitant_id", habitantId).limit(1)).catch(() => ({ data: null })),
    lire<Rencontres>(supabase, `${habitantId}/rencontres.json`),
    lire<{ jours?: string[] }>(supabase, `${habitantId}/presence.json`),
    lire<{ acquis?: number }>(supabase, `${habitantId}/cadeaux.json`),
    // (sa première réponse en duo : `ma-figurine-serveur.ts`, `cheminDuo`)
    lire<{ le?: string }>(supabase, `${habitantId}/duo.json`),
    // (✨ son premier vœu, « Mon vœu » : la table peut manquer, la migration se passe à la main)
    Promise.resolve(supabase.from("clik_voeu").select("id").eq("habitant_id", habitantId).limit(1)).catch(() => ({ data: null })),
  ]);

  // SA PRÉSENCE : aujourd'hui compte (62 jours gardés : un mois entier, pour sa figurine du mois)
  const jour = jourParis();
  const jours = Array.isArray(presence?.jours) ? presence.jours.map(s) : [];
  if (noterPresence && !jours.includes(jour)) {
    jours.push(jour);
    await ecrire(supabase, `${habitantId}/presence.json`, { jours: jours.slice(-62) });
  }
  // CE QUE SES FIGURINES LUI AVAIENT OUVERT : noté une fois
  let acquis = notes && typeof notes.acquis === "number" ? notes.acquis : null;
  if (acquis == null) {
    acquis = Math.min(OPTIONS_FIGURINE.length, Math.max(0, figurines));
    await ecrire(supabase, `${habitantId}/cadeaux.json`, { acquis, le: new Date().toISOString() });
  }

  const liste = Array.isArray(rencontres?.liste) ? rencontres.liste : [];
  const faites: Record<CleEtape, boolean> = {
    figurine: Boolean(s((fig.data as { prete_le?: string } | null)?.prete_le)),
    carte: Boolean(carte),
    message: Array.isArray(msg.data) && msg.data.length > 0,
    // (✨ « Faire un vœu », depuis le 12 novembre 2026 — ou, avant, trois réponses à la question du jour : l'acquis reste)
    questions: (Array.isArray(voeu.data) && voeu.data.length > 0) || (Array.isArray(rencontres?.dit) ? rencontres.dit.length : 0) >= 3,
    fidele: new Set(jours).size >= 3,
    duo: Boolean(duo?.le),
  };
  const etapes = ETAPES.map((e) => e.cle).filter((c) => faites[c]);
  // (« Rencontres » est parti le 7 novembre 2026 : ses étapes déjà franchies comptent encore, il ne perd rien)
  const anciennes = [liste.length > 0, liste.length >= 5, Array.isArray(rencontres?.amis) && rencontres.amis.length > 0, Boolean(s(rencontres?.membreJour))].filter(Boolean).length;
  return { cadeaux: Math.max(etapes.length + anciennes, acquis), etapes };
}

/** 🗓️ Ses jours sur ClikMe d'un mois (« 2026-11 ») : sa figurine du mois se mérite à 10 (`figurine-du-mois.ts`). */
export async function joursDePresence(supabase: Supabase, habitantId: string, mois: string): Promise<string[]> {
  const p = await lire<{ jours?: string[] }>(supabase, `${habitantId}/presence.json`);
  const jours = Array.isArray(p?.jours) ? p.jours.map(s) : [];
  return [...new Set(jours.filter((j) => j.startsWith(`${mois}-`)))].sort();
}
