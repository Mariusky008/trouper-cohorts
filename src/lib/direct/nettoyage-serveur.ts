/**
 * 🧹 LE NETTOYAGE DU STOCKAGE, CHAQUE NUIT (après les lots M2 et M3, « Écrire, partager » ; la tâche :
 * `app/api/cron/direct-nettoyage`).
 *
 * Deux sortes de fichiers restent dans le seau sans servir à rien, dans les dossiers des photos (`fils/<paire>/p`), des
 * vidéos (`fils/<paire>/v`) et des aperçus de liens (`fils/<paire>/a`) :
 *   1. LES DÉPÔTS JAMAIS ENVOYÉS (`<qui>-<id>-brut`, `<qui>-<id>-brut.<ext>`) : la feuille fermée, la modération en panne
 *      sans « Réessayer », un téléphone qui a perdu le réseau. Une adresse signée de dépôt vaut deux heures, et
 *      « Réessayer » se fait dans la minute : à 24 heures, il n'en sera plus rien fait ;
 *   2. LES FICHIERS QU'AUCUN MESSAGE NE CITE PLUS (`<id>.webp`, `<id>.mp4`…) : un envoi qui a échoué à mi-chemin, un
 *      message effacé pendant qu'on préparait l'aperçu de son lien. Le nom d'un message (`m/<ts>-<qui>-<id>.json`)
 *      porte l'identifiant de ses fichiers ; un message signalé reste dans le fil (caché chez celui qui l'a signalé),
 *      il garde donc les siens.
 *
 * RIEN D'AUTRE N'EST TOUCHÉ : ni les messages, ni les voix (`s/`), ni l'étagère, ni ce que le fil garde d'autre ; un
 * fichier au nom inattendu, un fichier de moins de 24 heures, un dossier qu'on n'a pas pu lire en entier restent.
 *
 * LA MESURE : avec celle des messages (`noterStatsMessages` : `nettoyes`, `nettoyesKo`), page admin des mèmes.
 * LE FREIN : `CLIKME_NETTOYAGE=0` chez l'hébergeur — plus de nettoyage.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { SEAU_FIGURINES } from "./ma-figurine-serveur";
import { noterStatsMessages } from "./talkie-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
type Objet = { name?: string; id?: string | null; created_at?: string | null; updated_at?: string | null; metadata?: { size?: number } | null };

export const NETTOYAGE = {
  /** L'âge d'un fichier avant qu'on y touche (24 heures). */
  attente: 24 * 3600_000,
  /** Les conversations lues en même temps. */
  ensemble: 6,
  /** Les fichiers effacés d'un coup. */
  parLot: 100,
} as const;

/** 🛑 Le frein : `CLIKME_NETTOYAGE=0` (plus de nettoyage). */
export const nettoyageOuvert = () => String(process.env.CLIKME_NETTOYAGE ?? "").trim() !== "0";

/**
 * Un fichier d'un dossier de photos, de vidéos ou d'aperçus : l'identifiant de son message, et si c'est un dépôt jamais
 * envoyé. `null` : un nom inattendu (on n'y touche pas).
 */
export function quelFichier(nom: string): { id: string; depot: boolean } | null {
  const depot = /^[0-9a-f]{8}-([a-z0-9]{12})-brut(?:\.(?:mp4|mov|webm))?$/.exec(nom);
  if (depot) return { id: depot[1], depot: true };
  const media = /^([a-z0-9]{12})\.(?:webp|mp4|mov|webm)$/.exec(nom);
  return media ? { id: media[1], depot: false } : null;
}
/** (l'identifiant d'un message, d'après son nom) */
const idDuMessage = (nom: string) => /^\d{13}-[0-9a-f]{8}-([a-z0-9]+)\.json$/.exec(nom)?.[1] ?? null;

/** (tout un dossier, page après page ; `null` : il n'a pas pu être lu en entier) */
async function toutLister(supabase: Supabase, dossier: string): Promise<Objet[] | null> {
  const tout: Objet[] = [];
  for (let offset = 0; offset < 100_000; offset += 1000) {
    const { data, error } = await supabase.storage.from(SEAU_FIGURINES).list(dossier, { limit: 1000, offset });
    if (error || !Array.isArray(data)) return null;
    tout.push(...(data as Objet[]));
    if (data.length < 1000) return tout;
  }
  return null;
}
/** (son âge, d'après la plus récente de ses dates ; `null` : on ne le sait pas) */
function age(o: Objet, maintenant: number): number | null {
  const t = Math.max(Date.parse(String(o.created_at ?? "")) || 0, Date.parse(String(o.updated_at ?? "")) || 0);
  return t > 0 ? maintenant - t : null;
}

export type BilanNettoyage = { paires: number; depots: number; orphelins: number; ko: number; ratees: number; fini: boolean; frein?: true };

/**
 * 🧹 LE NETTOYAGE : chaque conversation, ses dossiers de photos, de vidéos et d'aperçus ; les dépôts jamais envoyés et
 * les fichiers qu'aucun message ne cite, de plus de 24 heures, sont effacés. `fin` : l'heure où s'arrêter (la suite, la
 * nuit d'après). `maintenant` : l'heure qu'il est (les essais la décalent).
 */
export async function nettoyerLeStockage(supabase: Supabase, { maintenant = Date.now(), fin = Date.now() + 50_000 } = {}): Promise<BilanNettoyage> {
  const bilan: BilanNettoyage = { paires: 0, depots: 0, orphelins: 0, ko: 0, ratees: 0, fini: false };
  if (!nettoyageOuvert()) return { ...bilan, fini: true, frein: true };
  const fils = await toutLister(supabase, "fils");
  if (!fils) return bilan;
  // (les conversations : des dossiers — sans identifiant —, nommés d'après la paire)
  const paires = fils.filter((o) => !o.id && /^[0-9a-f-]{36}_[0-9a-f-]{36}$/.test(String(o.name ?? ""))).map((o) => String(o.name));
  let i = 0;
  const unePaire = async (pair: string) => {
    const dossiers = ["p", "v", "a"].map((d) => `fils/${pair}/${d}`);
    const listes = await Promise.all(dossiers.map((d) => toutLister(supabase, d)));
    const vieux = (o: Objet) => {
      const a = age(o, maintenant);
      return a !== null && a > NETTOYAGE.attente;
    };
    const candidats: { chemin: string; id: string; depot: boolean; ko: number }[] = [];
    listes.forEach((l, k) => {
      for (const o of l ?? []) {
        const f = o.id ? quelFichier(String(o.name ?? "")) : null;
        if (f && vieux(o)) candidats.push({ chemin: `${dossiers[k]}/${o.name}`, ...f, ko: (Number(o.metadata?.size) || 0) / 1024 });
      }
    });
    if (!candidats.length) return;
    // (les fichiers d'un message : seulement si TOUS ses messages ont pu être lus)
    const medias = candidats.filter((c) => !c.depot);
    let cites: Set<string> | null = new Set();
    if (medias.length) {
      const m = await toutLister(supabase, `fils/${pair}/m`);
      cites = m ? new Set(m.map((o) => idDuMessage(String(o.name ?? ""))).filter((x): x is string => Boolean(x))) : null;
    }
    const aEffacer = candidats.filter((c) => c.depot || (cites !== null && !cites.has(c.id)));
    for (let k = 0; k < aEffacer.length; k += NETTOYAGE.parLot) {
      const lot = aEffacer.slice(k, k + NETTOYAGE.parLot);
      const { error } = await supabase.storage.from(SEAU_FIGURINES).remove(lot.map((c) => c.chemin));
      if (error) {
        bilan.ratees += lot.length;
        continue;
      }
      for (const c of lot) {
        if (c.depot) bilan.depots++;
        else bilan.orphelins++;
        bilan.ko += c.ko;
      }
    }
  };
  // (quelques conversations à la fois, jusqu'à l'heure de s'arrêter)
  const ouvrier = async () => {
    while (i < paires.length && Date.now() < fin) {
      const pair = paires[i++];
      bilan.paires++;
      await unePaire(pair).catch(() => {
        bilan.ratees++;
      });
    }
  };
  await Promise.all(Array.from({ length: NETTOYAGE.ensemble }, ouvrier));
  bilan.fini = i >= paires.length;
  bilan.ko = Math.round(bilan.ko);
  await noterStatsMessages(supabase, { nettoyes: bilan.depots + bilan.orphelins, nettoyesKo: bilan.ko });
  return bilan;
}
