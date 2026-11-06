/**
 * 🎁 SES CADEAUX, CÔTÉ SERVEUR (`etapes.ts`) — les étapes qu'il a franchies, lues là où elles se trouvent déjà : sa
 * figurine (`clik_ma_figurine`), sa carte (`<habitant>/personnage.json`), ses messages (`clik_figurine_message`), ses
 * rencontres (`<habitant>/rencontres.json` : rencontres, ce qu'il a dit de lui, amis, membres), ses jours de présence
 * (`<habitant>/presence.json`, noté ici : un jour par visite de la page) et ses figurines du mois (les familles).
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
  const [fig, carte, msg, rencontres, presence, notes] = await Promise.all([
    Promise.resolve(supabase.from("clik_ma_figurine").select("prete_le").eq("habitant_id", habitantId).maybeSingle()).catch(() => ({ data: null })),
    lire<object>(supabase, `${habitantId}/personnage.json`),
    Promise.resolve(supabase.from("clik_figurine_message").select("id").eq("habitant_id", habitantId).limit(1)).catch(() => ({ data: null })),
    lire<Rencontres>(supabase, `${habitantId}/rencontres.json`),
    lire<{ jours?: string[] }>(supabase, `${habitantId}/presence.json`),
    lire<{ acquis?: number }>(supabase, `${habitantId}/cadeaux.json`),
  ]);

  // SA PRÉSENCE : aujourd'hui compte (les 30 derniers jours suffisent)
  const jour = jourParis();
  const jours = Array.isArray(presence?.jours) ? presence.jours.map(s) : [];
  if (noterPresence && !jours.includes(jour)) {
    jours.push(jour);
    await ecrire(supabase, `${habitantId}/presence.json`, { jours: jours.slice(-30) });
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
    rencontre: liste.length > 0,
    // (ce qu'il a dit de lui : la question du jour, « Et toi ? »)
    questions: (Array.isArray(rencontres?.dit) ? rencontres.dit.length : 0) >= 3,
    ami: Array.isArray(rencontres?.amis) && rencontres.amis.length > 0,
    membre: Boolean(s(rencontres?.membreJour)),
    fidele: new Set(jours).size >= 3,
    souvenirs: liste.length >= 5,
    commerce: figurines >= 1,
  };
  const etapes = ETAPES.map((e) => e.cle).filter((c) => faites[c]);
  return { cadeaux: Math.max(etapes.length, acquis), etapes };
}
