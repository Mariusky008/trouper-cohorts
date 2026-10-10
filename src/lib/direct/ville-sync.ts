/**
 * 🔄 LE FIL DE LA VILLE, SYNCHRONISÉ AVEC LE SERVEUR.
 *
 * « Une publication "Public dans ma ville" n'est vue que par son auteur. »
 * Branché par `/ville/<ville>` (et seulement là), ce module :
 *
 *   · envoie au serveur chaque publication, réaction, réponse et retrait faits
 *     dans `la-ville.ts` (`brancherLePartageVille`) ;
 *   · relit régulièrement le fil — celui qu'on a le droit de voir, trié par le
 *     serveur — et le pose dans le téléphone (`poserLeFil`) ;
 *   · signale une publication.
 *
 * FICHIER NAVIGATEUR.
 */
import { brancherLePartageVille, poserLeFil, type MessageVille, type NatureVille } from "@/lib/direct/la-ville";
import { monPrenom } from "@/lib/direct/salons";
import { lireContenu, lireScene } from "@/lib/direct/scenes-ville";

const ROUTE = "/api/direct/ville-fil";
const CLE_SIGNALEES = "clikme-ville-signalees-v1";
let ville = "";
let minuteur: number | null = null;

type PublicationLue = {
  id: string;
  qui: string;
  moi: boolean;
  visibilite: "amis" | "public";
  persistant: boolean;
  cree_le: string;
  masque: boolean;
  donnees: Record<string, unknown>;
  coeurs: number;
  monCoeur: boolean;
  reponses: { id: string; qui: string; moi: boolean; texte: string; cree_le: string }[];
  interesses: { qui: string; moi: boolean }[];
};

const s = (v: unknown) => String(v ?? "").trim();

/** Ce que j'ai signalé : je ne le revois plus, même avant la décision. */
function signalees(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem(CLE_SIGNALEES) || "[]") as string[];
  } catch {
    return [];
  }
}

/** « à l'instant », « il y a 5 min » — comme les réponses de la maquette. */
function quandDit(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (!Number.isFinite(min) || min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 1440) return `il y a ${Math.round(min / 60)} h`;
  return `il y a ${Math.round(min / 1440)} j`;
}

/** Une publication du serveur, dans la forme que La ville affiche. Les miennes s'écrivent « Vous ». */
function enMessage(p: PublicationLue, nomVille: string): MessageVille {
  const d = p.donnees;
  const ou = s(d.ou);
  const commerce = d.commerce && typeof d.commerce === "object" ? (d.commerce as { id: string; nom: string; photo?: string }) : undefined;
  // LA PRÉSENTATION FIGÉE AU PARTAGE, relue avec prudence : une scène
  // illisible tombe, et la publication s'affiche en carte simple.
  const scene = lireScene(d.scene);
  const contenu = lireContenu(d.contenu);
  const audio = d.audio && typeof d.audio === "object" ? (d.audio as { src?: unknown; duree?: unknown }) : null;
  const reference = d.reference && typeof d.reference === "object" ? (d.reference as { carte: string; piece: string; nom: string }) : undefined;
  const nature = s(d.nature) as NatureVille;
  return {
    id: p.id,
    qui: p.moi ? "Vous" : p.qui,
    // « Autour de vous » ne parle qu'à son auteur : les autres lisent la ville.
    ou: p.moi ? ou || "Autour de vous" : ou && ou !== "Autour de vous" ? ou : `À ${nomVille}`,
    distance: p.moi ? "0 m" : "",
    metres: 0,
    texte: s(d.texte),
    nature,
    a: Date.parse(p.cree_le) || Date.now(),
    dure: Number(d.dure) || 180,
    coeurs: p.coeurs,
    ...(p.monCoeur ? { monCoeur: true } : {}),
    reponses: p.reponses.map((r) => ({ id: r.id, qui: r.moi ? "Vous" : r.qui, texte: r.texte, quand: quandDit(r.cree_le) })),
    ...(s(d.photo) ? { photo: s(d.photo) } : {}),
    ...(nature === "cherche" || p.interesses.length ? { interesses: p.interesses.map((i) => (i.moi ? "Vous" : i.qui)) } : {}),
    ...(d.genre === "essai" || d.genre === "decouverte" ? { genre: d.genre } : {}),
    visibilite: p.visibilite,
    ...(p.persistant ? { persistant: true } : {}),
    ...(commerce ? { commerce } : {}),
    ...(reference ? { reference } : {}),
    ...(d.vecu ? { vecu: true } : {}),
    ...(s(d.suite) ? { suite: s(d.suite) } : {}),
    ...(scene ? { scene } : {}),
    ...(contenu ? { contenu } : {}),
    ...(audio && s(audio.src) ? { audio: { src: s(audio.src), duree: Math.max(1, Math.min(Number(audio.duree) || 1, 120)) } } : {}),
  };
}

async function poster(corps: unknown): Promise<boolean> {
  try {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    return r.ok;
  } catch {
    return false;
  }
}

const qui = () => monPrenom() || "";

/** Relire le fil et le poser dans le téléphone. */
export async function relireLaVille(nomVille: string): Promise<void> {
  if (!ville) return;
  type Reponse = { ok?: boolean; publications?: PublicationLue[] };
  let j: Reponse | null = null;
  try {
    const r = await fetch(`${ROUTE}?ville=${encodeURIComponent(ville)}`, { cache: "no-store" });
    j = r.ok ? ((await r.json()) as Reponse) : null;
  } catch {
    return;
  }
  // MIGRATION PAS ENCORE APPLIQUÉE (ok: false) : on ne pose rien, le téléphone
  // garde ce qu'il a — plutôt qu'un fil vide qui ferait croire à une panne.
  if (!j?.ok || !Array.isArray(j.publications)) return;
  const cachees = new Set(signalees());
  poserLeFil(j.publications.filter((p) => !cachees.has(p.id)).map((p) => enMessage(p, nomVille)));
}

/** Signaler une publication : elle disparaît de mon fil, et l'administrateur la verra. */
export async function signalerPublication(id: string, nomVille: string, motif = ""): Promise<boolean> {
  try {
    window.localStorage.setItem(CLE_SIGNALEES, JSON.stringify([...new Set([...signalees(), id])].slice(-200)));
  } catch {
    /* stockage refusé : elle reviendra au prochain relevé */
  }
  const ok = await poster({ action: "signaler", id, motif });
  void relireLaVille(nomVille);
  return ok;
}

/** Brancher la vraie ville. Rend de quoi débrancher. */
export function brancherLeFil(slug: string, nomVille: string): () => void {
  ville = slug;
  const relire = () => void relireLaVille(nomVille);
  brancherLePartageVille({
    publier: (m) =>
      void poster({
        action: "publier",
        ville,
        id: m.id,
        visibilite: m.visibilite === "amis" ? "amis" : "public",
        qui: qui(),
        donnees: {
          texte: m.texte,
          nature: m.nature,
          genre: m.genre,
          photo: m.photo,
          ou: m.ou,
          dure: m.dure,
          commerce: m.commerce,
          reference: m.reference,
          vecu: m.vecu,
          suite: m.suite,
          scene: m.scene,
          contenu: m.contenu,
          audio: m.audio,
        },
      }).then(relire),
    geste: (id, g) => void poster({ action: "geste", id, geste: g, qui: qui() }).then(relire),
    retirer: (id) => void poster({ action: "retirer", id }).then(relire),
  });
  relire();
  // LE FIL SE RELIT TOUTES LES QUINZE SECONDES quand l'écran est visible : ce
  // n'est pas une conversation, personne n'attend la seconde d'après.
  const tic = () => {
    if (document.visibilityState === "visible") relire();
  };
  minuteur = window.setInterval(tic, 15_000);
  document.addEventListener("visibilitychange", tic);
  return () => {
    if (minuteur) window.clearInterval(minuteur);
    minuteur = null;
    document.removeEventListener("visibilitychange", tic);
    brancherLePartageVille(null);
    ville = "";
  };
}
