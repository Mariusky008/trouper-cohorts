/**
 * 📈 LES CHIFFRES DU COMPTOIR, JOUR PAR JOUR — les vrais.
 *
 * « Je ne vois aucune stat de ma journée ou des précédentes pour me motiver à
 * chaque jour poster quelque chose. » En démonstration, `stats-comptoir.ts`
 * les simule et le dit. Pour un vrai commerçant, ils viennent d'ici :
 * `human_compteurs_jour`, une ligne par jour (à l'heure de Paris) — voir la
 * migration `20261004120000_compteurs_du_comptoir.sql`.
 *
 * QUATRE COMPTEURS, ET CHACUN À SON GESTE :
 *   · vues      — sa page s'ouvre (`site-internet/apercu/[slug]`), sauf quand
 *                 c'est lui qui y va depuis son comptoir (`?moi=1`) ;
 *   · ecoutes   — sa voix part, à l'étape 2 de son Expérience ;
 *   · demandes  — une demande est confirmée à son double ;
 *   · partages  — sa page est partagée.
 *
 * LES JOURS OÙ IL A PUBLIÉ viennent de ses publications dans Le Direct
 * (`human_publications`) : c'est par là que passe tout ce qu'il annonce avec
 * une photo depuis son comptoir.
 *
 * SANS LA MIGRATION, RIEN NE CASSE : l'écriture échoue en silence, et la
 * lecture répond `mesure: false` — le comptoir garde alors sa phrase « ils
 * apparaîtront ici dès qu'ils seront mesurés ». Jamais un chiffre inventé.
 *
 * FICHIER SERVEUR : il lit et écrit avec la clé d'administration.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { JourStats } from "@/lib/direct/stats-comptoir";

export type QuoiCompte = "vues" | "ecoutes" | "demandes" | "partages" | QuoiClient;
/**
 * LES GESTES EN CLIENTS — voir la migration `20261016120000_compteurs_en_clients.sql`.
 * Seul `essais` vient du navigateur (le rendu se fait chez le client) ; les
 * autres sont comptés par le serveur, là où le geste a lieu.
 */
export type QuoiClient = "essais" | "cotes" | "confirmees" | "avis" | "amis" | "voisins" | "diffusion";
export const QUOI_PUBLICS: QuoiCompte[] = ["ecoutes", "demandes", "partages", "essais"];

const str = (v: unknown) => (v == null ? "" : String(v));
const nb = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** « 2026-10-04 », le jour de Paris d'un instant. */
const jourParis = (t: number) => new Date(t).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/** Compter un geste. Silencieux : un compteur ne fait jamais échouer une page. */
export async function compterLeJour(siteId: string, quoi: QuoiCompte): Promise<void> {
  if (!siteId) return;
  try {
    await createAdminClient().rpc("compter_jour", { sid: siteId, quoi });
  } catch {
    /* migration non appliquée → on ne compte pas */
  }
}

/** Compter un geste venu du navigateur, par l'adresse de sa page. */
export async function compterParAdresse(slug: string, quoi: QuoiCompte): Promise<void> {
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return;
  try {
    const { data } = await createAdminClient()
      .from("human_vitrine_sites")
      .select("id")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const id = str((data as Record<string, unknown> | null)?.id);
    if (id) await compterLeJour(id, quoi);
  } catch {
    /* base indisponible */
  }
}

/**
 * SES SEPT DERNIERS JOURS, aujourd'hui compris, du plus ancien au plus récent —
 * dans la forme que le comptoir affiche déjà (`JourStats`).
 */
export async function semaineDuCommerce(siteId: string, maintenant = Date.now()): Promise<{ mesure: boolean; jours: JourStats[] }> {
  const supabase = createAdminClient();
  const dates = Array.from({ length: 7 }, (_, i) => maintenant - (6 - i) * 86_400_000);
  const cles = dates.map(jourParis);
  const auj = cles[6];

  const lignes = new Map<string, Record<string, unknown>>();
  let mesure = true;
  try {
    const { data, error } = await supabase
      .from("human_compteurs_jour")
      .select("jour, vues, ecoutes, demandes, partages")
      .eq("site_id", siteId)
      .gte("jour", cles[0]);
    if (error) throw new Error(error.message);
    for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) lignes.set(str(r.jour).slice(0, 10), r);
  } catch {
    mesure = false;
  }
  // SES MISES DE CÔTÉ SONT SES DEMANDES : chez un commerce de mode, la tuile
  // « pièce mise de côté » lit `demandes`, que seul le double incrémente.
  // Requête à part : sans la migration des chiffres en clients, elle échoue
  // seule et le reste s'affiche.
  const cotes = new Map<string, number>();
  if (mesure) {
    try {
      const { data, error } = await supabase.from("human_compteurs_jour").select("jour, cotes").eq("site_id", siteId).gte("jour", cles[0]);
      if (!error) for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) cotes.set(str(r.jour).slice(0, 10), nb(r.cotes));
    } catch {
      /* colonne absente → rien à ajouter */
    }
  }

  // LES JOURS OÙ IL A PUBLIÉ, et ce qu'il a publié ce jour-là (le premier mot).
  const publies = new Map<string, string>();
  try {
    const { data } = await supabase
      .from("human_publications")
      .select("texte, publie_le")
      .eq("site_id", siteId)
      .gte("publie_le", new Date(maintenant - 8 * 86_400_000).toISOString())
      .order("publie_le", { ascending: true })
      .limit(200);
    for (const r of (Array.isArray(data) ? data : []) as Record<string, unknown>[]) {
      const t = Date.parse(str(r.publie_le));
      if (!Number.isFinite(t)) continue;
      const j = jourParis(t);
      if (!publies.has(j)) publies.set(j, str(r.texte).replace(/^il en reste\s*!\s*/i, "").split(" · ")[0].slice(0, 60));
    }
  } catch {
    /* table absente → aucun jour publié */
  }

  const jours: JourStats[] = cles.map((jour, i) => {
    const l = lignes.get(jour);
    // LE JOUR DE LA SEMAINE DE CE JOUR DE PARIS : midi UTC tombe toujours dedans.
    const jds = new Date(`${jour}T12:00:00Z`).getUTCDay();
    return {
      jour,
      court: jour === auj ? "auj." : JOURS_COURTS[jds],
      aujourdhui: i === 6,
      publie: publies.has(jour),
      titre: publies.get(jour) || undefined,
      vues: nb(l?.vues),
      ecoutes: nb(l?.ecoutes),
      demandes: nb(l?.demandes) + (cotes.get(jour) ?? 0),
      partages: nb(l?.partages),
    };
  });
  return { mesure, jours };
}

/** Sa semaine, en clients : les sept derniers jours, et les sept d'avant pour comparer. */
export type SemaineEnClients = {
  /** `false` : la migration des compteurs en clients n'est pas appliquée. */
  mesure: boolean;
  cette: Record<QuoiClient | "vues", number>;
  avant: Record<QuoiClient | "vues", number>;
};

const QUOI_CLIENTS: (QuoiClient | "vues")[] = ["vues", "essais", "cotes", "confirmees", "avis", "amis", "voisins"];
const zeros = () => Object.fromEntries(QUOI_CLIENTS.map((q) => [q, 0])) as Record<QuoiClient | "vues", number>;

export async function semaineEnClients(siteId: string, maintenant = Date.now()): Promise<SemaineEnClients> {
  const cette = zeros();
  const avant = zeros();
  const debut = jourParis(maintenant - 6 * 86_400_000);
  const debutAvant = jourParis(maintenant - 13 * 86_400_000);
  try {
    const { data, error } = await createAdminClient()
      .from("human_compteurs_jour")
      .select(`jour, ${QUOI_CLIENTS.join(", ")}`)
      .eq("site_id", siteId)
      .gte("jour", debutAvant);
    if (error) throw new Error(error.message);
    for (const r of (Array.isArray(data) ? data : []) as unknown as Record<string, unknown>[]) {
      const cible = str(r.jour).slice(0, 10) >= debut ? cette : avant;
      for (const q of QUOI_CLIENTS) cible[q] += nb(r[q]);
    }
    return { mesure: true, cette, avant };
  } catch {
    return { mesure: false, cette, avant };
  }
}
