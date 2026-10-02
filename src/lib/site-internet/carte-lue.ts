/**
 * 📖 SA CARTE ET SES PRIX, LUS SUR LES PHOTOS DE SA FICHE GOOGLE.
 *
 * « Ça n'a pas récupéré la carte et les prix. » Sur sa fiche Google, on voit
 * pourtant ses plats et leurs prix — mais le robot d'Apify ne rend que le prix
 * moyen par personne et, parfois, un lien. LA CARTE, ELLE, EST EN PHOTO : la
 * page de menu imprimée, l'ardoise, le tableau. Les commerçants la
 * photographient et la publient sur leur fiche ; elle arrive parmi ses photos.
 *
 * ON LA FAIT LIRE PAR UN MODÈLE QUI VOIT. Ses photos de fiche lui sont
 * montrées ; il repère celles qui sont une carte et recopie les plats LISIBLES
 * avec leur prix exact. Une fraction de centime, une fois, après la lecture de
 * la fiche.
 *
 * CE QU'ON S'INTERDIT : compléter. Un prix illisible reste absent, un plat
 * deviné n'entre pas. Et la page le dit — « Lue sur les photos de sa carte ·
 * prix à confirmer sur place » — parce qu'une carte photographiée peut dater.
 * Dès qu'il saisit ses plats dans son Espace Pro, ce sont les siens qui
 * s'affichent.
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { avancerLesPhotosMenu, photosMenuEnCours } from "@/lib/site-internet/photos-menu";

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

export type PlatLu = { rubrique?: string; nom: string; prix?: string; detail?: string };

/** Ce que la page sait de la carte lue : les plats, et d'où ils viennent. */
export function carteLueDuDiagnostic(diag: unknown): PlatLu[] {
  const d = diag && typeof diag === "object" ? (diag as Record<string, unknown>) : {};
  const c = d.carte_lue && typeof d.carte_lue === "object" ? (d.carte_lue as Record<string, unknown>) : null;
  const plats = Array.isArray(c?.plats) ? (c?.plats as unknown[]) : [];
  return plats
    .map((p) => (p && typeof p === "object" ? (p as Record<string, unknown>) : {}))
    .map((p) => ({
      rubrique: s(p.rubrique).slice(0, 40) || undefined,
      nom: s(p.nom).slice(0, 90),
      prix: s(p.prix).slice(0, 20) || undefined,
      detail: s(p.detail).slice(0, 140) || undefined,
    }))
    .filter((p) => p.nom.length >= 2)
    .slice(0, 40);
}

/** Une photo, demandée à notre route photo-fiche (même porte que partout ailleurs). */
async function lire(src: string, origine: string): Promise<{ type: string; donnees: string } | null> {
  const adresse = /^https?:\/\//i.test(src) ? `${origine}/api/photo-fiche?u=${encodeURIComponent(src)}` : src.startsWith("/") ? `${origine}${src}` : "";
  if (!adresse) return null;
  try {
    const r = await fetch(adresse, { cache: "no-store", signal: AbortSignal.timeout(20_000) });
    const type = (r.headers.get("content-type") || "").split(";")[0];
    if (!r.ok || !type.startsWith("image/")) return null;
    const octets = Buffer.from(await r.arrayBuffer());
    if (octets.length < 2_000 || octets.length > 12_000_000) return null;
    // RÉDUITE AVANT L'ENVOI : douze photos de six mégaoctets dépassent ce que le
    // modèle accepte d'un coup. 1 600 points de côté gardent un prix lisible.
    try {
      const petite = await sharp(octets).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
      return { type: "image/jpeg", donnees: petite.toString("base64") };
    } catch {
      return octets.length > 6_000_000 ? null : { type, donnees: octets.toString("base64") };
    }
  } catch {
    return null;
  }
}

const CONSIGNE = `Ces photos viennent de la fiche Google d'un restaurant ou d'un bar.
Certaines peuvent montrer SA CARTE : une page de menu, une ardoise, un tableau, un panneau de prix.
Recopie UNIQUEMENT les plats et boissons que tu lis clairement sur ces cartes, avec leur prix exact tel qu'écrit (ex. « 5,90 € »).
Règles :
- N'invente rien. Un plat illisible n'entre pas. Un prix illisible reste vide.
- Ne déduis rien des photos de plats servis : seulement ce qui est ÉCRIT sur une carte.
- « rubrique » = le titre de section tel qu'écrit sur la carte (« Entrées », « Tapas », « Desserts »), sinon vide.
- « detail » = la description courte écrite sous le plat, sinon vide.
- Au plus 40 lignes.
Réponds uniquement en JSON : {"plats":[{"rubrique":"","nom":"","prix":"","detail":""}]}. Si aucune carte n'est lisible : {"plats":[]}.`;

const liste = (v: unknown) => (Array.isArray(v) ? v.map(s).filter((u) => /^https?:\/\//i.test(u) || u.startsWith("/")) : []);

/**
 * LES PHOTOS À LIRE, DANS L'ORDRE OÙ LA CARTE A LE PLUS DE CHANCES D'Y ÊTRE :
 * celles de l'onglet « Menu » d'abord (voir `photos-menu.ts`), puis toutes
 * celles de sa fiche. `lot` dit d'où elles viennent : une lecture refaite sur
 * de NOUVELLES photos n'attend pas la demi-heure.
 */
function photosALire(d: Record<string, unknown>): { photos: string[]; lot: string } {
  const menu = liste(d.photos_menu);
  const vues = new Set(menu);
  const autres = [...liste(d.photos_toutes), ...liste(d.photos)].filter((u) => !vues.has(u) && vues.add(u));
  const photos = [...menu, ...autres].slice(0, 36);
  return { photos, lot: `menu:${menu.length}+fiche:${autres.length}` };
}

/** Ce qui a déjà été lu sans y trouver de carte, sous quelle forme. */
const lotLu = (d: Record<string, unknown>) =>
  d.carte_lue && typeof d.carte_lue === "object" ? s((d.carte_lue as Record<string, unknown>).lot) : "";

/**
 * Faut-il (re)tenter la lecture ? Fiche lue, des photos, pas encore de plats —
 * et soit rien n'a été tenté depuis une demi-heure, soit de nouvelles photos
 * sont arrivées depuis la dernière lecture (« aucune carte » sur douze photos
 * ne dit rien de l'onglet Menu).
 */
export function carteALire(diag: unknown): boolean {
  const d = diag && typeof diag === "object" ? (diag as Record<string, unknown>) : {};
  if (d.places_found !== true || carteLueDuDiagnostic(d).length) return false;
  if (photosMenuEnCours(d)) return true; // on viendra chercher ses photos de menu
  const { photos, lot } = photosALire(d);
  if (!photos.length) return false;
  if (d.carte_lue && lotLu(d) === lot) return false;
  const essai = Date.parse(s(d.carte_essai_at));
  const nouveau = s(d.carte_essai_lot) !== lot;
  return nouveau || !(Number.isFinite(essai) && Date.now() - essai < 30 * 60_000);
}

/**
 * LIT SA CARTE UNE FOIS, si ce n'est pas déjà fait et qu'il a des photos.
 * Rend le nombre de plats lus (0 si aucune carte lisible).
 */
export async function lireLaCarte(slug: string, origine: string): Promise<number> {
  const cle = s(process.env.GEMINI_API_KEY) || s(process.env.GOOGLE_API_KEY);
  if (!cle) return 0;
  // LES PHOTOS DE SON ONGLET « MENU » SONT PEUT-ÊTRE ARRIVÉES : on les range d'abord.
  try {
    await avancerLesPhotosMenu(slug);
  } catch {
    /* au tour suivant */
  }
  return lireMaintenant(slug, origine, cle);
}

async function lireMaintenant(slug: string, origine: string, cle: string): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select("id, diagnostic")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return 0;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  if (carteLueDuDiagnostic(diag).length) return carteLueDuDiagnostic(diag).length;
  // LE ROBOT DU MENU TOURNE ENCORE : on attend ses photos, sans rien noter —
  // la prochaine demande relira.
  if (photosMenuEnCours(diag)) return 0;
  if (!carteALire(diag)) return 0;
  const { photos, lot } = photosALire(diag);
  if (!photos.length) return 0;
  // ON NOTE L'ESSAI AVANT DE PAYER : la page peut demander à chaque visite, la
  // lecture ne part qu'une fois par lot de photos (et par demi-heure).
  await supabase
    .from("human_vitrine_sites")
    .update({ diagnostic: { ...diag, carte_essai_at: new Date().toISOString(), carte_essai_lot: lot } })
    .eq("id", s(row.id));

  // PAR PAQUETS DE DOUZE, et on s'arrête dès qu'une carte est lue : ses
  // photos de menu viennent en premier, elles suffisent presque toujours.
  let plats: PlatLu[] = [];
  let erreur = "";
  let lues = 0;
  for (let i = 0; i < photos.length && !plats.length; i += 12) {
    const images = (await Promise.all(photos.slice(i, i + 12).map((p) => lire(p, origine)))).filter(Boolean) as {
      type: string;
      donnees: string;
    }[];
    if (!images.length) continue;
    lues += images.length;
    const r = await lireUnPaquet(images, cle);
    if ("erreur" in r) {
      erreur = r.erreur;
      break;
    }
    plats = r.plats;
  }
  if (!lues && !erreur) erreur = "aucune photo n'a pu être ouverte";
  // ON RELIT AVANT D'ÉCRIRE : la fiche ou la photo ClikMe ont pu écrire entre-temps.
  const { data: frais } = await supabase.from("human_vitrine_sites").select("diagnostic").eq("id", s(row.id)).maybeSingle();
  const d2 = ((frais as Record<string, unknown> | null)?.diagnostic ?? diag) as Record<string, unknown>;
  // UN ÉCHEC NE SE GRAVE PAS COMME « AUCUNE CARTE » : on garde la raison, et
  // la lecture pourra repartir à la prochaine visite (après la demi-heure).
  await supabase
    .from("human_vitrine_sites")
    .update({
      // `carte_fin_at` : la lecture est finie, réussie ou non — la page cesse d'attendre.
      diagnostic: erreur
        ? { ...d2, carte_lue_erreur: erreur, carte_fin_at: new Date().toISOString() }
        : { ...d2, carte_lue: { plats, at: new Date().toISOString(), photos: lues, lot }, carte_lue_erreur: null, carte_fin_at: new Date().toISOString() },
    })
    .eq("id", s(row.id));
  return plats.length;
}

/** Un paquet de photos montré au modèle : les plats lus, ou la raison de l'échec. */
async function lireUnPaquet(images: { type: string; donnees: string }[], cle: string): Promise<{ plats: PlatLu[] } | { erreur: string }> {
  const base = s(process.env.GEMINI_BASE_URL) || "https://generativelanguage.googleapis.com";
  const modele = s(process.env.GEMINI_VISION_MODEL) || "gemini-2.5-flash";
  try {
    const r = await fetch(`${base}/v1beta/models/${modele}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cle },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [...images.map((i) => ({ inlineData: { mimeType: i.type, data: i.donnees } })), { text: CONSIGNE }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!r.ok) return { erreur: `Gemini ${r.status}` };
    const j = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const texte = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    const brut = JSON.parse(texte.slice(texte.indexOf("{"), texte.lastIndexOf("}") + 1)) as { plats?: unknown };
    return { plats: carteLueDuDiagnostic({ carte_lue: { plats: brut.plats } }) };
  } catch (e) {
    return { erreur: e instanceof Error ? e.message.slice(0, 160) : "lecture impossible" };
  }
}
