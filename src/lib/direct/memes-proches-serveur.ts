/**
 * 🎭 LE MÈME ENVOYÉ À UN PROCHE — la nouvelle interface, lot 4 (la maquette validée le 13 novembre 2026 : le mème « qu'on
 * pourrait envoyer sur WhatsApp ou dans un des messages de la page Chez moi »). Il est fait dans le studio, comme
 * toujours ; « Envoyer à Léa » le range dans leur conversation, à côté de leurs messages :
 *   · `fils/<paire>/memes.json` = { liste: [{ id, de, le }] } — les 100 derniers (l'id : le message-mème, à lui) ;
 *   · Léa est prévenue (« 🎭 Marc t'a envoyé un mème », une fois par jour) ; il compte dans ses non lus ; dans leur fil :
 *     sa vignette (sa figurine, ses mots), un toucher pour le regarder (sa vidéo).
 * Les vérifications (c'est son proche, dans les deux sens) sont faites par la route, avant.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { prevenirUneFoisParJour } from "./appli-collection-serveur";
import { cleProfil } from "./autour-serveur";
import { apercuDUnMeme, ecrireJson, lireJson, lireLigne } from "./ma-figurine-serveur";
import { idMessageValide, lienMessage } from "./ma-figurine";
import type { MemeFil } from "./talkie";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

type MemeRange = { id: string; de: string; le: string };

const paireDe = (a: string, b: string) => [a, b].sort().join("_");
const cheminMemes = (paire: string) => `fils/${paire}/memes.json`;

/** Les mèmes envoyés entre eux deux (les plus anciens d'abord). */
export async function memesRanges(supabase: Supabase, a: string, b: string): Promise<MemeRange[]> {
  const x = await lireJson<{ liste?: MemeRange[] }>(supabase, cheminMemes(paireDe(a, b)));
  return (Array.isArray(x.liste) ? x.liste : []).filter((m) => idMessageValide(s(m?.id)) && s(m?.de) && s(m?.le));
}

/** 🎭 Les mèmes de leur conversation, en vignettes (les 20 derniers) ; `vu` : ce qu'il avait déjà vu (ms). */
export async function memesDuFil(supabase: Supabase, moi: string, lui: string, vu: number): Promise<MemeFil[]> {
  const ranges = (await memesRanges(supabase, moi, lui)).slice(-20);
  const vus = await Promise.all(
    ranges.map(async (m): Promise<MemeFil | null> => {
      const a = await apercuDUnMeme(supabase, m.id).catch(() => null);
      if (!a || a.h !== m.de) return null;
      const nouveau = m.de !== moi && Date.parse(m.le) > vu;
      return { id: m.id, moi: m.de === moi, le: m.le, image: a.ap.image, ...(a.ap.texte ? { texte: a.ap.texte } : {}), ...(a.ap.video ? { video: a.ap.video } : {}), lien: lienMessage(m.id), ...(nouveau ? { nouveau: true } : {}) };
    }),
  );
  return vus.filter((x): x is MemeFil => Boolean(x));
}

/** 🎭 Il envoie son mème à son proche `h` (déjà vérifié : ils se parlent) : rangé dans leur conversation, l'autre prévenu. */
export async function envoyerMemeAuProche(supabase: Supabase, moi: Habitant, h: string, id: unknown): Promise<{ ok?: true; error?: string; statut?: number }> {
  const i = s(id);
  if (!idMessageValide(i)) return { error: "Ce mème n’existe pas.", statut: 400 };
  const a = await apercuDUnMeme(supabase, i).catch(() => null);
  if (!a || a.h !== moi.id) return { error: "Ce mème n’est pas à toi.", statut: 403 };
  const paire = paireDe(moi.id, h);
  const liste = await memesRanges(supabase, moi.id, h);
  if (!liste.some((m) => m.id === i && m.de === moi.id)) await ecrireJson(supabase, cheminMemes(paire), { liste: [...liste, { id: i, de: moi.id, le: new Date().toISOString() }].slice(-100) });
  const prenom = s((await lireLigne(supabase, moi.id)).ligne?.prenom) || "Ton proche";
  await prevenirUneFoisParJour(supabase, h, "meme-proche", { titre: `🎭 ${prenom} t’a envoyé un mème`, corps: "Viens le voir dans ClikMe !", url: `/collection?parler=${cleProfil(moi.id)}#proches`, tag: "meme-proche" }).catch(() => undefined);
  return { ok: true };
}
