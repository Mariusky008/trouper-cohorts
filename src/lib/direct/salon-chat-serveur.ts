/**
 * 🐾 LE CHAT DU SALON, CÔTÉ SERVEUR (`docs/univers/salon-du-duo.md`, section 4.5 ; le lot S3, deuxième partie) — celui
 * de l'essai C0 (le propriétaire, le 16 novembre 2026 : « celui qu'on a conçu déjà sur l'admin est mieux que celui de la
 * maquette ») : ses boucles faites, dans le catalogue des compagnons (`compagnons/chat/<boucle>/video.mp4`), et son vrai
 * son enregistré (le ronronnement, `son.json` d'une boucle), s'il est déposé.
 *
 * À ADRESSE STABLE (section 7.2) : l'ouverture du salon donne `/api/direct/salon/chat/<boucle>` ; cette adresse renvoie
 * vers la vidéo signée pour sept jours, et le téléphone garde ce renvoi six jours (il ne retélécharge pas le chat à chaque
 * conversation). Les boucles faites se relisent à chaque ouverture (huit petites listes, en même temps que le reste).
 *
 * `CLIKME_CHAT_SALON=0` : le frein (le salon sans lui).
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { BOUCLES, ESPECES, boucleValide, type Boucle } from "./compagnons";
import { depotDans, signer } from "./ma-figurine-serveur";
import type { ChatSalon } from "./salon";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const ESPECE = "chat" as const;
const dossierBoucle = (b: Boucle) => `compagnons/${ESPECE}/${b}`;
/** Ce que l'adresse stable sert : une boucle, ou son son. */
export const QUOI_CHAT = /^(?:son|assis|marche|dort|genoux|alerte|saut|renifle|joue)$/;
/** (le renvoi, gardé six jours par le téléphone ; l'adresse signée vaut sept jours) */
export const GARDE_RENVOI_S = 6 * 86_400;
const SIGNEE_S = 7 * 86_400;

type Catalogue = { boucles: Boucle[]; son?: string };

/** Les boucles faites, et le fichier de son son (le chemin). */
async function lireCatalogue(supabase: Supabase): Promise<Catalogue> {
  const listes = await Promise.all(BOUCLES.map((b) => depotDans(supabase, dossierBoucle(b.cle)).lister().catch(() => [] as string[])));
  const boucles = BOUCLES.filter((_, i) => listes[i].includes("video.mp4")).map((b) => b.cle as Boucle);
  // (son son : celui des genoux d'abord — il y ronronne —, sinon le premier déposé)
  const avecSon = [BOUCLES.findIndex((b) => b.cle === "genoux"), ...BOUCLES.map((_, i) => i)].find((i) => i >= 0 && listes[i].includes("son.json"));
  let son: string | undefined;
  if (avecSon !== undefined) {
    const b = BOUCLES[avecSon].cle as Boucle;
    const f = await depotDans(supabase, dossierBoucle(b))
      .lire("son.json")
      .then((x) => JSON.parse(x?.toString() || "{}") as { fichier?: unknown })
      .catch(() => ({}) as { fichier?: unknown });
    if (s(f.fichier)) son = `${dossierBoucle(b)}/${s(f.fichier)}`;
  }
  return { boucles, ...(son ? { son } : {}) };
}

/** 🐾 Le chat du salon : son nom, ses boucles faites (à adresse stable), son son. `null` sans boucle (ou freiné). */
export async function chatDuSalon(supabase: Supabase): Promise<ChatSalon | null> {
  if (s(process.env.CLIKME_CHAT_SALON) === "0") return null;
  const c = await lireCatalogue(supabase).catch(() => null);
  if (!c?.boucles.length) return null;
  return {
    nom: ESPECES.find((e) => e.cle === ESPECE)?.nomParDefaut ?? "Moustache",
    boucles: Object.fromEntries(c.boucles.map((b) => [b, `/api/direct/salon/chat/${b}`])) as Partial<Record<Boucle, string>>,
    ...(c.son ? { son: "/api/direct/salon/chat/son" } : {}),
  };
}

/** L'adresse signée (sept jours) d'une boucle ou de son son ; « » s'il n'y en a pas. */
export async function adresseDuChat(supabase: Supabase, quoi: string): Promise<string> {
  if (!QUOI_CHAT.test(quoi)) return "";
  const c = await lireCatalogue(supabase).catch(() => null);
  if (!c) return "";
  if (quoi === "son") return c.son ? await signer(supabase, c.son, SIGNEE_S).catch(() => "") : "";
  if (!boucleValide(quoi) || !c.boucles.includes(quoi)) return "";
  return signer(supabase, `${dossierBoucle(quoi)}/video.mp4`, SIGNEE_S).catch(() => "");
}
