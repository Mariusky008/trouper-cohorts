/**
 * 🔔 CE QUI ATTEND, CÔTÉ SERVEUR (le lot S8 ; les règles : `ce-qui-attend.ts`).
 *
 * Ce que `de` a laissé à `pour` depuis sa dernière visite : ses messages depuis la dernière fois que `pour` a lu leur
 * fil (`<habitant>/fils-lus.json`, les trente derniers au plus), ses gestes et ses panneaux depuis les derniers que
 * `pour` a vus (`<habitant>/gestes-vus.json`). La notification (`prevenirDUneParole`) s'en sert : deux choses ou plus,
 * la phrase qui dit tout.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import { lireJson } from "./ma-figurine-serveur";
import { cheminLus, dossierMessages, nomsDuFil, pairDe, qui8, type FicheMessage } from "./talkie-serveur";
import { cheminGestes, cheminGestesVus } from "./vivant-serveur";
import { ATTENTE_VIDE, phraseDeCeQuiAttend, type Attente } from "./ce-qui-attend";

type Supabase = ReturnType<typeof createAdminClient>;
type GesteLu = { de8?: string; le?: string; type?: string; cle?: string };

/** Ce que `de` a laissé à `pour` depuis sa dernière visite, compté. */
export async function ceQuiAttend(supabase: Supabase, pour: string, de: string): Promise<Attente> {
  const pair = pairDe(pour, de);
  const de8 = qui8(de);
  const [lus, noms, gestes, gvus] = await Promise.all([
    lireJson<Record<string, number>>(supabase, cheminLus(pour)),
    nomsDuFil(supabase, pair),
    lireJson<{ liste?: unknown }>(supabase, cheminGestes(pair)),
    lireJson<Record<string, number>>(supabase, cheminGestesVus(pour)),
  ]);
  const vu = Number(lus[de]) || 0;
  const neufs = noms.filter((n) => n.de8 === de8 && n.ts > vu).slice(-30);
  const fiches = await Promise.all(neufs.map((n) => lireJson<FicheMessage>(supabase, `${dossierMessages(pair)}/${n.nom}`)));
  const a: Attente = { ...ATTENTE_VIDE, gestes: [] };
  for (const f of fiches) {
    if (!f.id) continue;
    if (f.genre === "ecrit") a.messages++;
    else if (f.genre === "meme") a.memes++;
    else if (f.genre === "photo") a.photos++;
    else if (f.genre === "video") a.videos++;
    else if (f.genre === "fichier") a.fichiers++;
    else if (f.son) a.vocaux++;
  }
  const vuG = Number(gvus[pair]) || 0;
  for (const g of Array.isArray(gestes.liste) ? (gestes.liste as GesteLu[]) : []) {
    if (g.de8 !== de8 || !g.cle || !(Date.parse(String(g.le)) > vuG)) continue;
    if (g.type === "geste") a.gestes.push(g.cle);
    else if (g.type === "panneau") a.gestes.push(`panneau:${g.cle}`);
  }
  return a;
}

/** 🔔 La phrase qui dit tout ce qui attend (deux choses ou plus), sinon `null`. Jamais bloquant. */
export async function resumeQuiAttend(supabase: Supabase, pour: string, de: string, prenom: string, dernier?: string): Promise<{ titre: string; corps: string } | null> {
  try {
    return phraseDeCeQuiAttend(prenom, await ceQuiAttend(supabase, pour, de), dernier);
  } catch {
    return null;
  }
}
