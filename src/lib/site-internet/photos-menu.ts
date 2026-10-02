/**
 * 📸 LES PHOTOS DE L'ONGLET « MENU » DE SA FICHE GOOGLE.
 *
 * « Le restaurant sur Google a bien un onglet Menu sur lequel on peut appuyer
 * et avoir les menus et les prix — sauf que sur ClikMe ils n'apparaissent
 * toujours pas. »
 *
 * CE QUI MANQUAIT : LE BON TIROIR. On lisait la carte sur les douze premières
 * photos de sa fiche, dans l'ordre où Google les range sous « Tout » : la
 * salle, les plats, la façade. Les pages de sa carte, elles, sont rangées à
 * part, sous l'onglet « Menu » — et n'arrivaient presque jamais parmi les
 * douze premières. Le robot qui lit la fiche (compass) ne sait pas trier les
 * photos par onglet ; un robot dédié aux photos de Google Maps, si.
 *
 * ON LE LANCE EN MÊME TEMPS que la lecture des photos et des avis, dès que sa
 * fiche est trouvée, et on vient chercher le résultat comme pour le reste
 * (`avancerLesPhotosMenu`). Ses photos passent ensuite EN TÊTE de la lecture
 * de la carte — voir `carte-lue.ts`.
 *
 * LE ROBOT SE CHOISIT PAR `APIFY_ACTEUR_MENU` (« aucun » pour s'en passer).
 * Son format de sortie n'est pas le nôtre, et il peut changer : on n'y lit
 * donc que des adresses de photos Google, où qu'elles soient rangées. S'il
 * échoue, rien ne casse : la carte se lit sur les photos ordinaires, comme
 * avant, et la raison est gardée (`carte_photos_erreur`).
 *
 * FICHIER SERVEUR.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { etatRunApify, lancerRunApify, resultatsRunApify } from "@/lib/site-internet/apify";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Le robot des photos par onglet. Par défaut celui qui sait filtrer « menu ». */
export function acteurMenu(): string | null {
  const a = s(process.env.APIFY_ACTEUR_MENU) || "crawlerbros~google-maps-photos";
  return /^(aucun|none|off|0)$/i.test(a) ? null : a.replace("/", "~");
}

/** Plus vieux que ça, le robot a fini ou ne finira plus. */
const MENU_PERIME_MS = 14 * 60_000;

export type RunMenu = { runId: string; datasetId: string; lance: string };

/**
 * L'ENTRÉE DU ROBOT : le repère de sa fiche, l'onglet « menu », seize photos.
 *
 * « placeUrl is required unless placeId is provided » — vu dans la console
 * Apify, au premier vrai passage. La première version envoyait `placeUrls`,
 * au pluriel, que ce robot ignore : il partait sans adresse et s'arrêtait en
 * six secondes. Son repère Google (`placeId`) est ce qu'on a de plus sûr, et
 * il le prend tel quel.
 */
const entreeMenu = (placeId: string) => ({
  placeId,
  photoCategory: "menu",
  maxPhotos: 16,
  /* ═══ VU DEPUIS LA FRANCE ═══════════════════════════════════════════════
     Deuxième passage, deuxième leçon de la console : « Loaded place: Le
     Bordeaux » — la fiche s'ouvrait bien — puis « Requested photo category
     'menu' is not visibly available » sans proxy, et le repli par proxy
     dépassait son délai. Son proxy par défaut est résidentiel… aux
     États-Unis. Un restaurant de Dax se regarde depuis la France : Google y
     montre son onglet « Menu » comme sur le téléphone de ses clients. */
  proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ["RESIDENTIAL"], apifyProxyCountry: "FR" },
});

/**
 * LA VERSION DE CETTE DEMANDE. Une page qui l'a déjà faite ne la refait pas —
 * sauf si la demande a changé depuis : la page du Bordeaux, essayée avec la
 * mauvaise entrée, redemande donc une fois avec la bonne.
 */
export const MENU_VERSION = 3;

/** Les adresses de photos Google contenues dans ce que rend le robot, où qu'elles soient. */
export function photosDuRobot(items: unknown[]): string[] {
  const vues = new Set<string>();
  const out: string[] = [];
  const garder = (u: string) => {
    if (!/^https:\/\/[^\s"']*(googleusercontent\.com|ggpht\.com)\//i.test(u)) return;
    // LA MÊME PHOTO EN TROIS TAILLES N'EN FAIT QU'UNE : on la demande en grand.
    const base = u.replace(/=[swh]\d+[^/?#]*$/i, "");
    if (vues.has(base)) return;
    vues.add(base);
    out.push(`${base}=w1600-h1600`);
  };
  const parcourir = (v: unknown, cle: string, profondeur: number) => {
    if (profondeur > 5 || out.length >= 24) return;
    if (typeof v === "string") {
      // NI LES VIGNETTES, NI LES PORTRAITS DE CEUX QUI ONT PUBLIÉ.
      if (!/thumb|avatar|author|profile|contributor|user/i.test(cle)) garder(v);
      return;
    }
    if (Array.isArray(v)) return v.forEach((x) => parcourir(x, cle, profondeur + 1));
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      // UNE PHOTO QUI DIT SA CATÉGORIE ET QUI N'EST PAS « MENU » N'ENTRE PAS.
      const cat = s(o.category ?? o.photoCategory ?? o.tab);
      if (cat && !/menu|carte/i.test(cat)) return;
      for (const [k, x] of Object.entries(o)) parcourir(x, k, profondeur + 1);
    }
  };
  for (const it of items) parcourir(it, "", 0);
  return out.slice(0, 16);
}

/**
 * LANCE LE ROBOT. Rend ce qu'il faut ranger dans le diagnostic : le numéro de
 * la lecture, ou la raison pour laquelle elle n'est pas partie.
 */
export async function lancerLesPhotosMenu(placeId: string): Promise<Record<string, unknown>> {
  const acteur = acteurMenu();
  const token = s(process.env.APIFY_TOKEN);
  if (!acteur || !token || !placeId) return {};
  const r = await lancerRunApify(token, entreeMenu(placeId), acteur);
  if ("erreur" in r)
    return {
      carte_run: null,
      carte_photos_erreur: `photos du menu : ${r.erreur}`.slice(0, 300),
      carte_photos_tente: new Date().toISOString(),
      carte_photos_v: MENU_VERSION,
    };
  const run: RunMenu = { runId: r.runId, datasetId: r.datasetId, lance: new Date().toISOString() };
  return { carte_run: run, carte_photos_erreur: null, carte_photos_tente: run.lance, carte_photos_v: MENU_VERSION };
}

export function runMenuDe(diag: Record<string, unknown>): RunMenu | null {
  const r = diag.carte_run && typeof diag.carte_run === "object" ? (diag.carte_run as Record<string, unknown>) : null;
  return r && s(r.runId) ? (r as unknown as RunMenu) : null;
}

/** Le robot des photos du menu tourne-t-il encore ? */
export function photosMenuEnCours(diag: Record<string, unknown>): boolean {
  const run = runMenuDe(diag);
  const lance = Date.parse(s(run?.lance));
  return Boolean(run) && Number.isFinite(lance) && Date.now() - lance < MENU_PERIME_MS;
}

/**
 * VIENT CHERCHER LES PHOTOS DU MENU si le robot a fini. Rapide, jamais
 * d'attente. N'écrit que si la lecture en cours est toujours celle-là.
 */
export async function avancerLesPhotosMenu(slug: string): Promise<void> {
  const token = s(process.env.APIFY_TOKEN);
  if (!token) return;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const run = runMenuDe(diag);
  if (!run) return;
  const ecrire = async (ajout: Record<string, unknown>) => {
    // RELU JUSTE AVANT : la fiche a pu écrire entre-temps, on n'écrase rien.
    const { data: frais } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", s(row.id)).maybeSingle();
    const d2 = ((frais as Record<string, unknown> | null)?.diagnostic ?? diag) as Record<string, unknown>;
    if (runMenuDe(d2)?.runId !== run.runId) return;
    await supabase
      .from("human_vitrine_sites")
      .update({ diagnostic: { ...d2, ...ajout, carte_run: null } })
      .eq("id", s(row.id))
      .eq("diagnostic->carte_run->>runId", run.runId);
  };
  if (!photosMenuEnCours(diag)) return ecrire({ carte_photos_erreur: "photos du menu : le robot n'a pas fini à temps" });
  const e = await etatRunApify(token, run.runId);
  if ("erreur" in e) return;
  if (["READY", "RUNNING", "TIMING-OUT", "ABORTING"].includes(e.statut)) return;
  if (e.statut !== "SUCCEEDED") return ecrire({ carte_photos_erreur: `photos du menu : le robot s'est arrêté (${e.statut})` });
  const items = await resultatsRunApify(token, run.datasetId || e.datasetId);
  if (!Array.isArray(items)) return;
  const photos = photosDuRobot(items);
  await ecrire({
    photos_menu: photos,
    carte_photos_erreur: photos.length ? null : "photos du menu : aucune photo dans l'onglet Menu",
  });
}

/**
 * LES PAGES CRÉÉES AVANT CETTE ÉTAPE — « Le Bordeaux » le premier — n'ont
 * jamais demandé leur onglet « Menu ». Si leur carte est vide, la page le
 * demande UNE fois, après s'être affichée. `carte_photos_tente` garde la
 * trace de l'essai : on ne repaie pas à chaque visite.
 */
export function menuATenter(diag: Record<string, unknown>, placeId: string): boolean {
  return Boolean(
    acteurMenu() &&
      s(process.env.APIFY_TOKEN) &&
      placeId &&
      diag.places_found === true &&
      // UN ROBOT RESTÉ EN PLAN (jamais venu chercher) ne bloque pas une nouvelle demande.
      !photosMenuEnCours(diag) &&
      !(Array.isArray(diag.photos_menu) && diag.photos_menu.length) &&
      (!s(diag.carte_photos_tente) || Number(diag.carte_photos_v || 1) < MENU_VERSION) &&
      !(Array.isArray((diag.carte_lue as Record<string, unknown> | undefined)?.plats) &&
        ((diag.carte_lue as Record<string, unknown>).plats as unknown[]).length),
  );
}

export async function tenterLesPhotosMenu(slug: string): Promise<void> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, google_place_id, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const placeId = s(row.google_place_id);
  if (!menuATenter(diag, placeId)) return;
  // NOTÉ AVANT DE LANCER : deux visites rapprochées n'en lancent qu'un.
  const tente = new Date().toISOString();
  let prise = supabase
    .from("human_vitrine_sites")
    .update({ diagnostic: { ...diag, carte_photos_tente: tente, carte_photos_v: MENU_VERSION } })
    .eq("id", s(row.id));
  // LE VERROU : on ne prend la main que si personne ne l'a prise depuis notre lecture.
  prise = s(diag.carte_photos_tente)
    ? prise.eq("diagnostic->>carte_photos_tente", s(diag.carte_photos_tente))
    : prise.is("diagnostic->carte_photos_tente", null);
  const { data: pris } = await prise.select("id");
  if (!Array.isArray(pris) || !pris.length) return;
  const ajout = await lancerLesPhotosMenu(placeId);
  const { data: frais } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", s(row.id)).maybeSingle();
  const d2 = ((frais as Record<string, unknown> | null)?.diagnostic ?? diag) as Record<string, unknown>;
  await supabase
    .from("human_vitrine_sites")
    .update({ diagnostic: { ...d2, ...ajout, carte_photos_tente: tente, carte_photos_v: MENU_VERSION } })
    .eq("id", s(row.id));
}
