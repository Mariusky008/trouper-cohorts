/**
 * 🗑️ SUPPRIMER MON COMPTE — l'audit UX du 28 novembre 2026, lot 5 (`docs/audit-ux.md`, section 10). Le propriétaire,
 * le même jour : « Oui, ces choix me vont » — la suppression est définitive et immédiate (pas de délai), ses messages
 * disparaissent aussi chez ses proches, qui voient seulement « Ce compte a été supprimé ».
 *
 * EN DEUX TEMPS :
 *   1. TOUT DE SUITE (`supprimerLeCompte`, pendant la demande) — ce qu'on trouve depuis lui :
 *      · ses proches : il quitte leurs listes (`<proche>/proches.json`, `ajoute-par.json`, `rencontres.json`), et chacun
 *        garde une ligne « <prénom> a supprimé son compte » (`<proche>/comptes-supprimes.json`, sept jours) ;
 *      · leurs conversations : `fils/<paire>/` en entier (les messages des deux : la conversation n'existe plus) ;
 *      · son lien de proche (`profils/<clé>.json`) : plus personne ne le retrouve ;
 *      · son dossier (`<habitant>/`, le seau des figurines : son selfie, sa figurine, sa maison, son humeur…), ses photos
 *        de la maison privée (`effacerMaison`) ;
 *      · ses lignes dans la base (`LIGNES`), puis son compte (`human_habitants` : le reste part en cascade) ;
 *      · le témoin du balayage : `comptes-supprimes/<habitant>.json` = { q, cle, le, pile? } — rien de personnel.
 *   2. LE BALAYAGE (`balayerLesComptesSupprimes`, juste après la réponse, puis chaque nuit jusqu'au bout) — ce qu'il a
 *      laissé dans les espaces partagés, qu'on reconnaît à son nom de fichier : son identifiant, sa clé de profil ou sa
 *      marque courte (`qui8`) dans un nom (ses mots et écrits sous les vidéos, ses passages dans les salons — « toujours
 *      rempli » ne le rassoit plus —, ses places dans les groupes, ses figurines posées « Autour »…), et ses moments
 *      partagés (`moments/<id>.json`, lu : `h`). Les dossiers des autres habitants ne sont pas parcourus. Quand tout est
 *      passé, le témoin part.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SEAU_FIGURINES, ecrireJson, lireJson, prochesDe, retirerProche, cheminAjoutePar } from "./ma-figurine-serveur";
import { effacerMaison } from "./maison-serveur";
import { cleProfil } from "./autour-serveur";
import { pairDe, qui8 } from "./talkie-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Combien de jours ses proches voient « <prénom> a supprimé son compte ». */
export const JOURS_AVIS_SUPPRIME = 7;
export const cheminAvisSupprimes = (h: string) => `${h}/comptes-supprimes.json`;
const DOSSIER_TEMOINS = "comptes-supprimes";
const cheminTemoin = (h: string) => `${DOSSIER_TEMOINS}/${h}.json`;

/**
 * Ses lignes dans la base, et les colonnes qui le désignent (les tables sans lien vers lui partent en cascade avec
 * `human_habitants`). Une table absente ici est sautée.
 */
export const LIGNES: readonly (readonly [string, string])[] = [
  ["clik_voeu_vue", "auteur_id"],
  ["clik_voeu_vue", "destinataire_id"],
  ["clik_voeu_serie", "habitant_id"],
  ["clik_voeu", "habitant_id"],
  ["clik_figurine_message", "habitant_id"],
  ["clik_ma_figurine", "habitant_id"],
  ["clik_surprise_tirage", "habitant_id"],
  ["clik_accord", "habitant_id"],
  ["clik_presence", "habitant_id"],
  ["clik_mot", "habitant_id"],
  ["clik_message", "habitant_id"],
  ["clik_visite", "habitant_id"],
  ["clik_contact", "habitant_id"],
  ["clik_cage", "habitant_id"],
  ["clik_avis_film", "habitant_id"],
  ["clik_reaction", "habitant_id"],
  ["clik_participation", "habitant_id"],
  ["human_conversation_gestes", "habitant"],
  ["human_habitant_blocages", "bloque"],
];

type Entree = { name?: string; id?: string | null };
async function lister(supabase: Supabase, dossier: string): Promise<{ fichiers: string[]; dossiers: string[] }> {
  const fichiers: string[] = [];
  const dossiers: string[] = [];
  for (let offset = 0; offset < 50_000; offset += 1000) {
    const { data, error } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: 1000, offset });
    if (error) break;
    const l = (Array.isArray(data) ? data : []) as Entree[];
    for (const e of l) {
      const nom = s(e.name);
      if (!nom || nom === ".emptyFolderPlaceholder") continue;
      (e.id ? fichiers : dossiers).push(dossier ? `${dossier}/${nom}` : nom);
    }
    if (l.length < 1000) break;
  }
  return { fichiers, dossiers };
}
async function effacer(supabase: Supabase, chemins: string[]): Promise<number> {
  let n = 0;
  for (let i = 0; i < chemins.length; i += 100) {
    const { error } = await supabase.storage.from(SEAU_FIGURINES).remove(chemins.slice(i, i + 100));
    if (!error) n += Math.min(100, chemins.length - i);
  }
  return n;
}
/** Un dossier entier, et tout ce qu'il contient. */
async function effacerDossier(supabase: Supabase, dossier: string): Promise<number> {
  let n = 0;
  const pile = [dossier];
  while (pile.length) {
    const d = pile.pop()!;
    const l = await lister(supabase, d);
    n += await effacer(supabase, l.fichiers);
    pile.push(...l.dossiers);
  }
  return n;
}

/** Ce qui le désigne dans un nom de fichier : son identifiant, sa clé de profil, sa marque courte (un mot entier). */
export function reconnaitre(h: string, q: string, cle: string): (nom: string) => boolean {
  const echap = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^0-9a-zA-Z])(${[h, q, cle].filter(Boolean).map(echap).join("|")})([^0-9a-zA-Z]|$)`);
  return (nom) => re.test(nom);
}

export type BilanSuppression = { fichiers: number; lignes: number; proches: number };

/**
 * Il quitte les listes de ses proches (dans les deux sens), chacun garde l'avis, et leurs conversations partent. Sans
 * risque à refaire (le balayage le refait si la demande a été coupée) : l'avis n'est pas mis deux fois.
 */
async function delierSesProches(supabase: Supabase, h: string, prenom: string, autres: string[]): Promise<number> {
  let fichiers = 0;
  const le = new Date().toISOString();
  const limite = Date.now() - JOURS_AVIS_SUPPRIME * 86400_000;
  for (const p of autres) {
    // (dans les deux sens : il quitte ses proches à lui, et sa liste « m'a ajouté » — `ajoute-par.json`)
    await retirerProche(supabase, p, h).catch(() => false);
    await retirerProche(supabase, h, p).catch(() => false);
    const avis = await lireJson<{ l?: { prenom: string; le: string; h?: string }[] }>(supabase, cheminAvisSupprimes(p)).catch(() => ({}) as { l?: { prenom: string; le: string; h?: string }[] });
    const garde = (Array.isArray(avis.l) ? avis.l : []).filter((x) => Date.parse(x.le) > limite);
    const marque = qui8(h);
    if (!garde.some((x) => x.h === marque)) await ecrireJson(supabase, cheminAvisSupprimes(p), { l: [...garde, { prenom, le, h: marque }].slice(-20) }).catch(() => false);
    fichiers += await effacerDossier(supabase, `fils/${pairDe(h, p)}`);
  }
  return fichiers;
}

/**
 * 1. TOUT DE SUITE : ce qu'on trouve depuis lui (voir en tête). Rend ce qui est parti. L'ordre compte : le témoin (avec
 * ses proches), puis son lien et son compte (il n'existe plus pour personne), puis ses fichiers et ses proches — coupé
 * en route, le balayage de la nuit finit le travail.
 */
export async function supprimerLeCompte(supabase: Supabase, moi: { id: string; prenom?: string; email?: string | null }): Promise<BilanSuppression> {
  const h = moi.id;
  const q = qui8(h);
  const cle = cleProfil(h);
  const prenom = s(moi.prenom).slice(0, 40) || "Un proche";
  // ses proches, et ceux qui l'ont ajouté
  const [proches, ajoutePar] = await Promise.all([prochesDe(supabase, h).catch(() => new Set<string>()), lireJson<{ ids?: string[] }>(supabase, cheminAjoutePar(h)).catch(() => ({}) as { ids?: string[] })]);
  const autres = [...new Set([...proches, ...(Array.isArray(ajoutePar.ids) ? ajoutePar.ids.map(s) : [])])].filter((x) => x && x !== h).slice(0, 400);
  // (le témoin d'abord : si quelque chose casse plus loin, le balayage reprend tout)
  await ecrireJson(supabase, cheminTemoin(h), { q, cle, le: new Date().toISOString(), prenom, autres });

  // son lien de proche, puis ses lignes et son compte (le reste part en cascade)
  let fichiers = await effacer(supabase, [`profils/${cle}.json`]);
  let lignes = 0;
  for (const [table, colonne] of LIGNES) {
    const { count, error } = await supabase.from(table).delete({ count: "exact" }).eq(colonne, h);
    if (!error) lignes += count ?? 0;
  }
  await supabase.from("clik_presence").update({ amene_par: null }).eq("amene_par", h);
  for (const motif of [`%${h}%`, `%${q}%`]) {
    const { count } = await supabase.from("clik_meme_evenement").delete({ count: "exact" }).ilike("message_id", motif);
    lignes += count ?? 0;
  }
  if (s(moi.email)) {
    const { count } = await supabase.from("human_habitant_codes").delete({ count: "exact" }).ilike("email", s(moi.email));
    lignes += count ?? 0;
  }
  await effacerMaison(supabase, h).catch(() => false);
  const { count, error } = await supabase.from("human_habitants").delete({ count: "exact" }).eq("id", h);
  if (error) throw new Error(`Le compte n’a pas pu être supprimé : ${error.message}`);
  lignes += count ?? 0;

  // ses proches et leurs conversations, son dossier
  fichiers += await delierSesProches(supabase, h, prenom, autres);
  fichiers += await effacerDossier(supabase, h);
  return { fichiers, lignes, proches: autres.length };
}

/** Les avis « <prénom> a supprimé son compte » encore à montrer (les sept derniers jours). */
export async function avisDeComptesSupprimes(supabase: Supabase, h: string): Promise<{ prenom: string; le: string }[]> {
  const avis = await lireJson<{ l?: { prenom: string; le: string }[] }>(supabase, cheminAvisSupprimes(h)).catch(() => ({}) as { l?: { prenom: string; le: string }[] });
  const limite = Date.now() - JOURS_AVIS_SUPPRIME * 86400_000;
  return (Array.isArray(avis.l) ? avis.l : []).filter((x) => s(x.prenom) && Date.parse(x.le) > limite).map((x) => ({ prenom: s(x.prenom), le: s(x.le) }));
}

// ─── 2. LE BALAYAGE ─────────────────────────────────────────────────────────────────────────────────
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Les dossiers du haut qu'on ne parcourt pas : ceux des habitants (des identifiants), les témoins, ce qui n'est pas à eux. */
const PAS_PARCOURUS = new Set([DOSSIER_TEMOINS, "demo-proprio", "essais-univers", "lieux-publics"]);

type Temoin = { q?: string; cle?: string; le?: string; prenom?: string; autres?: string[]; pile?: string[]; commence?: boolean; momentsApres?: string };

/**
 * Un passage de balayage pour un compte supprimé : on reprend sa pile de dossiers (`pile`, gardée dans son témoin),
 * jusqu'à `fin` (une heure). Les fichiers qui le nomment partent ; un dossier qui le nomme part en entier ; un moment
 * partagé (`moments/<id>.json`) est lu, et part avec son image s'il est à lui. Rend s'il reste à faire.
 */
async function balayer(supabase: Supabase, h: string, t: Temoin, fin: number): Promise<{ fichiers: number; reste: boolean }> {
  const q = s(t.q) || qui8(h);
  const cle = s(t.cle) || cleProfil(h);
  const lui = reconnaitre(h, q, cle);
  let pile = Array.isArray(t.pile) ? t.pile.map(s).filter(Boolean) : [];
  let fichiers = 0;
  if (!t.commence) {
    // (au premier passage, ce que la suppression aurait pu laisser si elle a été coupée : ses proches, son dossier, son lien)
    fichiers += await delierSesProches(supabase, h, s(t.prenom) || "Un proche", Array.isArray(t.autres) ? t.autres.map(s).filter((x) => UUID.test(x)) : []);
    fichiers += await effacerDossier(supabase, h);
    fichiers += await effacer(supabase, [`profils/${cle}.json`]);
    const haut = await lister(supabase, "");
    pile = haut.dossiers.filter((d) => !UUID.test(d) && !PAS_PARCOURUS.has(d));
  }
  while (pile.length && Date.now() < fin) {
    const d = pile.pop()!;
    if (lui(d.split("/").pop() ?? "")) {
      fichiers += await effacerDossier(supabase, d);
      continue;
    }
    const l = await lister(supabase, d);
    const aEffacer = l.fichiers.filter((f) => lui(f.split("/").pop() ?? ""));
    // (ses moments : le nom ne dit pas de qui, la fiche si)
    let interrompu = false;
    if (d === "moments") {
      // (reprendre après la dernière fiche lue : les noms sont rangés)
      const apres = s(t.momentsApres);
      for (const f of l.fichiers.filter((x) => x.endsWith(".json") && !aEffacer.includes(x) && (!apres || x > apres))) {
        // (le temps est passé : on reprendra à cette fiche)
        if (Date.now() >= fin) {
          interrompu = true;
          break;
        }
        const m = await lireJson<{ h?: string }>(supabase, f).catch(() => ({}) as { h?: string });
        if (s(m.h) === h) {
          const base = f.slice(0, -5);
          aEffacer.push(f, ...l.fichiers.filter((x) => x !== f && (x.startsWith(`${base}.`) || x.startsWith(`${base}-`))));
        }
        t.momentsApres = f;
      }
    }
    // (`moments/par/<habitant>.json`, son compte du jour : reconnu à son nom, avec le dossier suivant)
    if (interrompu) pile.push(d);
    else pile.push(...l.dossiers);
    fichiers += await effacer(supabase, [...new Set(aEffacer)]);
  }
  const reste = pile.length > 0;
  if (reste) await ecrireJson(supabase, cheminTemoin(h), { ...t, commence: true, pile });
  else await effacer(supabase, [cheminTemoin(h)]);
  return { fichiers, reste };
}

/** 2. LE BALAYAGE de tous les comptes supprimés pas encore finis, jusqu'à `fin`. `seul` : celui-là seulement. */
export async function balayerLesComptesSupprimes(supabase: Supabase, { fin, seul }: { fin: number; seul?: string }): Promise<{ comptes: number; fichiers: number; reste: number }> {
  const temoins = seul ? [`${DOSSIER_TEMOINS}/${seul}.json`] : (await lister(supabase, DOSSIER_TEMOINS)).fichiers;
  let fichiers = 0;
  let reste = 0;
  let comptes = 0;
  for (const chemin of temoins) {
    const h = (chemin.split("/").pop() ?? "").replace(/\.json$/, "");
    if (!UUID.test(h)) continue;
    if (Date.now() >= fin) {
      reste++;
      continue;
    }
    const t = await lireJson<Temoin>(supabase, chemin).catch(() => null);
    if (!t || !s(t.le)) continue;
    comptes++;
    const r = await balayer(supabase, h, t, fin);
    fichiers += r.fichiers;
    if (r.reste) reste++;
  }
  return { comptes, fichiers, reste };
}
