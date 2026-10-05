/**
 * 📇 LA FICHE D'UN VRAI COMMERÇANT, LUE DANS LA BASE — une seule façon de la faire.
 *
 * ═══ POURQUOI ELLE A QUITTÉ LA PAGE ════════════════════════════════════════
 *
 * « Avec chaque commerçant, comment vais-je faire pour que ça puisse être
 * automatisé sans que j'aie à intervenir ? »
 *
 * LE DOUBLE DU CHEF NE CONNAISSAIT QUE LES RESTAURANTS DE LA DÉMONSTRATION :
 * sa route cherchait la carte dans le paquet écrit à la main, et un vrai
 * restaurant n'y est pas. Sa page, elle, savait fabriquer sa carte — nom,
 * horaires, prestations, photos — mais le faisait au milieu de son rendu.
 *
 * LA RECETTE EST DONC ICI, ET LES DEUX LA SUIVENT. Deux copies d'une même fiche
 * finissent par ne plus dire la même chose ; le jour où la page ajoute une
 * ligne, le double l'apprend en même temps.
 *
 * FICHIER SERVEUR : il lit la base avec la clé d'administration.
 */
import { experienceDuDiagnostic } from "@/lib/site-internet/experience-donnees";
import { piecesDuDiagnostic } from "@/lib/site-internet/pieces-comptoir";
import { createAdminClient } from "@/lib/supabase/admin";
import { horairesLisibles } from "@/lib/site-internet/horaires-pro";
import { ligneDuJour } from "@/lib/site-internet/opening-hours";
import { numeroAppel, numeroReservations } from "@/lib/site-internet/pro-phone";
import { carteDepuisFiche, type FicheCommercant } from "@/lib/site-internet/carte-depuis-fiche";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import { couvertureAffichee, couvertureDuDiagnostic, photoSansHote } from "@/lib/site-internet/couverture";
import { lireDecor, type DecorMesure } from "@/lib/direct/scenes-ville";

/**
 * SA SCÈNE POUR LE FIL DE LA VILLE — la zone d'affiche posée sur sa photo
 * ClikMe dans l'administration (`/admin/humain/scenes`). ELLE NE VAUT QUE
 * POUR CETTE PHOTO : s'il en change, les quatre coins ne tombent plus sur sa
 * vitrine, et on ne la montre plus jusqu'à ce qu'elle soit reposée. « Elle
 * peut être renouvelée lorsque le commerçant change sa photo. »
 */
function sceneVilleDuDiagnostic(diag: Record<string, unknown>, couverture: string | undefined): DecorMesure | undefined {
  const d = lireDecor(diag.sceneVille);
  return d && couverture && d.decor === couverture ? d : undefined;
}
import { nomPropre } from "@/lib/site-internet/nom-propre";
import { carteLueDuDiagnostic, suiviDeLaCarte } from "@/lib/site-internet/carte-lue";

const str = (v: unknown) => (v == null ? "" : String(v));
const capWords = (s: string) =>
  s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());

/** Les colonnes que la fiche lit — la page et le double demandent les mêmes. */
export const COLONNES_FICHE =
  "id, business_name, city, activite, address, google_rating, google_reviews, google_place_id, diagnostic, published, gallery_photos, current_offer";

/** « 16 h », « 16 h 30 » : l'heure murale de Paris, le serveur peut tourner ailleurs. */
function heureDeParis(t: Date): { jour: string; h: number; m: number } {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .formatToParts(t);
  const n = (k: string) => Number(p.find((x) => x.type === k)?.value ?? 0);
  return { jour: t.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }), h: n("hour"), m: n("minute") };
}

/**
 * ═══ SON ANNONCE EN COURS, POUR LE BANDEAU DE SA PAGE ════════════════════
 *
 * « Sur la page réelle d'un restaurant, afficher le bandeau "Il en reste !". »
 *
 * LE COMPTOIR L'ÉCRIVAIT DÉJÀ, ET PERSONNE NE LA LISAIT ICI. La route des
 * annonces range la dernière dans `current_offer` (« le bandeau de SON
 * site ») et une publication dans Le Direct ; la page, elle, ne demandait
 * pas la colonne. Une annonce passée ne s'affiche plus : « il en reste » à
 * 14 h ne veut plus rien dire à 18 h.
 *
 * SA PHOTO SEULEMENT SI ELLE EST CHEZ NOUS (https). Celle du comptoir arrive
 * en `data:` et pèse jusqu'à un mégaoctet : la recopier dans chaque page
 * servie pour une vignette serait absurde. Le bandeau prend alors la photo du
 * plat, qui, elle, est rangée.
 */
export function offreDuSite(v: unknown, maintenant = new Date()): FicheCommercant["offre"] {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const texte = str(o.text).replace(/\s+/g, " ").trim().slice(0, 160);
  if (!texte) return undefined;
  const fin = str(o.until) ? new Date(str(o.until)) : null;
  if (fin && Number.isFinite(fin.getTime()) && fin.getTime() <= maintenant.getTime()) return undefined;
  let jusqua: string | undefined;
  if (fin && Number.isFinite(fin.getTime())) {
    const a = heureDeParis(fin);
    const ici = heureDeParis(maintenant);
    if (a.jour !== ici.jour) {
      jusqua = `jusqu’au ${fin.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" })}`;
    } else if (a.h * 60 + a.m >= 23 * 60 + 30) {
      // 23 h 59 : c'est « le plat du jour », pas une heure à surveiller.
      jusqua = "jusqu’à ce soir";
    } else {
      jusqua = `jusqu’à ${a.h} h${a.m ? ` ${String(a.m).padStart(2, "0")}` : ""}`;
    }
  }
  const photo = /^https:\/\//i.test(str(o.photo)) ? str(o.photo) : undefined;
  return { texte, jusqua, photo };
}

/**
 * FABRIQUE LA FICHE À PARTIR DE CE QUI A ÉTÉ LU.
 *
 * `disponibilites` : ses horaires saisis dans l'espace pro, s'il en a ;
 * `services` : ses prestations, telles que la colonne les garde.
 */
export function construireFiche(
  slug: string,
  row: Record<string, unknown>,
  o: { disponibilites?: Array<Record<string, unknown>> | null; services?: unknown } = {},
): { fiche: FicheCommercant; nom: string; ville: string; note: string | null; reviews: number | null } {
  // LES PAGES DÉJÀ CRÉÉES AVEC UN NOM EN MINUSCULES se redressent ici aussi.
  const nom = nomPropre(str(row.business_name)) || "Votre commerce";
  const ville = str(row.city);
  const activite = str(row.activite) || "Commerce";
  const villeAff = capWords(ville);
  const rating = typeof row.google_rating === "number" ? row.google_rating : null;
  const reviews = typeof row.google_reviews === "number" ? row.google_reviews : null;
  const note = rating != null ? rating.toFixed(1).replace(".", ",") : null;
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;

  // LES HORAIRES DU COMMERÇANT PRIMENT. `diagnostic.horaires` vient de Google :
  // c'est une information de seconde main, qu'il ne contrôle pas. Lui les
  // saisit dans son espace pro, où ils partent dans `human_site_availability`.
  // Repli sur Google quand il n'a rien saisi : mieux vaut une information de
  // seconde main qu'une ligne vide.
  let horaires = (Array.isArray(diag.horaires) ? diag.horaires : []) as Array<{ jours?: string; horaires?: string }>;
  const siennes = horairesLisibles(
    (o.disponibilites ?? []).map((w) => ({
      weekday: Number(w.weekday),
      start_min: Number(w.start_min),
      end_min: Number(w.end_min),
    })),
  );
  if (siennes.length) horaires = siennes;

  /**
   * ═══ SES PHOTOS D'ABORD, PUIS CELLES DE GOOGLE — PLUS « SINON » ═══════════
   *
   * « Sur la fiche Google de Gaïa je vois des dizaines de photos, et pourtant
   * sur sa page ClikMe il n'y en a aucune. Et je vois deux photos qui sont des
   * photos que j'ai moi-même prises, pas du tout celles de la fiche Google. »
   *
   * LES DEUX MOITIÉS DE SA PHRASE SONT LA MÊME LIGNE DE CODE. Elle disait
   * `proPhotos.length ? proPhotos : googlePhotos` : dès que le commerçant
   * dépose UNE photo, toutes celles de Google disparaissent. Deux photos
   * déposées effaçaient donc les dizaines de la fiche — et sur les commerces
   * où il en avait déposé, la galerie Google n'a jamais existé.
   *
   * « EN PRIORITÉ » VEUT DIRE EN PREMIER, PAS À LA PLACE. C'est tout le
   * malentendu de ce ternaire, et il est facile à faire : le mot « priorité »
   * du commentaire décrivait un ORDRE, le code appliquait un REMPLACEMENT.
   * Les siennes ouvrent la bande — ce sont les plus récentes et les plus
   * justes — et celles de Google suivent.
   *
   * ET ON NE MONTRE PAS DEUX FOIS LA MÊME. Un doublon dans une bande de
   * vignettes se lit comme un bogue, même quand c'est la même photo publiée
   * deux fois.
   */
  const proPhotos = (Array.isArray(row.gallery_photos) ? row.gallery_photos : [])
    .map((p) => str(p))
    .filter((u) => /^data:image\//i.test(u))
    .slice(0, 10);
  const googlePhotos = (Array.isArray(diag.photos) ? diag.photos : [])
    .map((p) => str(p))
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 12);
  const photos = [...new Set([...proPhotos, ...googlePhotos])];

  // Prestations RÉELLES saisies par le pro. Bornées et nettoyées : aucun tarif
  // inventé ne peut entrer ici, et le catalogue reste vide s'il n'a rien saisi.
  const services = (Array.isArray(o.services) ? o.services : [])
    .map((x) => (x && typeof x === "object" ? (x as Record<string, unknown>) : {}))
    .map((x) => ({
      nom: str(x.name).slice(0, 80),
      prix: str(x.price).slice(0, 40) || undefined,
      detail: str(x.desc).slice(0, 160) || undefined,
    }))
    .filter((x) => x.nom.length > 0)
    .slice(0, 12);

  // LES AVIS GOOGLE, TELS QU'ILS ONT ÉTÉ ÉCRITS. Ils dormaient dans le
  // diagnostic depuis toujours et l'ancienne maquette les affichait ; la
  // boutique, elle, ne connaissait que les avis laissés DANS ClikMe — donc
  // aucun, chez un prospect. Bornés et nettoyés, comme le reste.
  const avisGoogle = (Array.isArray(diag.reviews_top) ? diag.reviews_top : [])
    .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : {}))
    .map((r) => ({
      qui: str(r.name).slice(0, 60) || "Un client",
      texte: str(r.text).slice(0, 400),
      note: typeof r.stars === "number" ? (r.stars as number) : null,
    }))
    .filter((r) => r.texte.length > 0)
    .slice(0, 4);

  const fiche: FicheCommercant = {
    slug,
    nom,
    metier: activite,
    ville: villeAff,
    adresse: str(row.address).replace(/,?\s*France\s*$/i, "").trim(),
    horaires: ligneDuJour(horaires),
    semaine: horaires
      .map((h) => ({ jours: str(h.jours).slice(0, 40), horaires: str(h.horaires).slice(0, 80) }))
      .filter((h) => h.jours && h.horaires)
      .slice(0, 14),
    photos,
    note: note ?? undefined,
    avis: reviews ?? undefined,
    // ═══ SON NUMÉRO, ET IL Y A UNE SEULE VÉRITÉ SUR LE SUJET ══════════════
    //
    // « Ouvrir le WhatsApp avec le numéro du pro et le message pré-rempli. »
    //
    // `diag.telephone` N'EXISTE PAS. La clé du diagnostic est `phone`, et il y
    // a trois endroits où un numéro peut se trouver selon la façon dont ce
    // commerce est entré dans le produit — la colonne WhatsApp s'il a ouvert
    // son espace, le formulaire de rappel s'il nous a laissé le sien, la fiche
    // Google sinon. `pro-phone.ts` connaît les trois, plus les congés, et
    // répond à la bonne question : « à quel numéro les HABITANTS écrivent-ils ? »
    // — qui n'est pas la même que « comment joint-on le commerçant ? ».
    //
    // WHATSAPP D'ABORD, LE FIXE SINON. Un restaurant publie presque toujours
    // un fixe, et un fixe ne fait pas de WhatsApp : la boutique retombe alors
    // sur le bouton « Appeler », qui est juste en dessous.
    telephone: numeroReservations(row) || numeroAppel(row) || undefined,
    site: str(diag.website) || str(diag.site) || undefined,
    mapsHref: `https://www.google.com/maps/search/${encodeURIComponent(`${nom} ${ville}`)}`,
    // SA PAGE D'AVIS, ET SEULEMENT SI ON SAIT DE QUELLE FICHE IL S'AGIT. Sans
    // `place_id`, une recherche par nom peut tomber sur un homonyme — et
    // envoyer ses clients lire les avis de quelqu'un d'autre.
    avisHref: str(row.google_place_id)
      ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(str(row.google_place_id))}`
      : undefined,
    services,
    avisGoogle,
    couverture: couvertureAffichee(couvertureDuDiagnostic(diag)),
    couvertureHote: couvertureDuDiagnostic(diag)?.hote,
    couvertureSansHote: photoSansHote(couvertureDuDiagnostic(diag)),
    sceneVille: sceneVilleDuDiagnostic(diag, couvertureAffichee(couvertureDuDiagnostic(diag))),
    carteLue: carteLueDuDiagnostic(diag),
    // CE QU'IL A DONNÉ À SON EXPÉRIENCE RESTAURANT — voir `experience-donnees.ts`.
    experience: experienceDuDiagnostic(diag) ?? undefined,
    // CE QU'IL A MIS À ESSAYER OU EN CONSEIL DEPUIS SON COMPTOIR.
    pieces: piecesDuDiagnostic(diag),
    // SON ANNONCE EN COURS : le bandeau de sa page — voir `offreDuSite`.
    offre: offreDuSite(row.current_offer),
    carteSuivi: suiviDeLaCarte(diag),
    photosCarte: (Array.isArray(diag.photos_menu) ? diag.photos_menu : [])
      .map((u) => str(u))
      .filter((u) => /^https:\/\//i.test(u))
      .slice(0, 16),
    ficheGoogle: {
      menu: /^https?:\/\//i.test(str(diag.menu_url)) ? str(diag.menu_url) : undefined,
      prix: str(diag.prix_moyen).slice(0, 30) || undefined,
      services: (Array.isArray(diag.services_google) ? diag.services_google : []).map((x) => str(x)).filter(Boolean).slice(0, 8),
    },
  };
  return { fiche, nom, ville, note, reviews };
}

/** Ce que le double sait EN PLUS de la carte : ce que le commerçant a dit de lui. */
export type SavoirDuSite = {
  /** Le prénom qu'il a donné à son double, dans la carte de sa voix. */
  prenom: string;
  /** Sa fiche de connaissances (spécialités, ce qu'il ne fait pas, questions fréquentes), en clair. */
  notes: string;
  /** Ce qu'il a raconté à voix haute en donnant sa voix, retranscrit. */
  recit: string;
  /** L'identifiant de sa voix clonée, s'il l'a donnée ET qu'il est d'accord. */
  voixId: string;
};

/**
 * LIT LA CARTE D'UN VRAI COMMERÇANT, SANS RIEN COMPTER NI RIEN ÉCRIRE.
 *
 * La page compte ses vues ; le double, lui, ne fait que lire. Les colonnes
 * récentes sont lues à part et sans exiger leur présence : une migration pas
 * encore appliquée coûte une information, jamais la conversation.
 */
export async function lireLeSite(slug: string): Promise<{ carte: CarteAutour; savoir: SavoirDuSite; siteId: string } | null> {
  if (!slug || !/^[a-z0-9-]{2,120}$/i.test(slug)) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("human_vitrine_sites")
    .select(COLONNES_FICHE)
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  if (!row) return null;
  const siteId = str(row.id);

  let services: unknown = [];
  const savoir: SavoirDuSite = { prenom: "", notes: "", recit: "", voixId: "" };
  try {
    const { data: ex } = await supabase.from("human_vitrine_sites").select("services, assistant_kb").eq("id", siteId).maybeSingle();
    const e = (ex as Record<string, unknown> | null) ?? {};
    services = e.services;
    const kb = (e.assistant_kb && typeof e.assistant_kb === "object" ? e.assistant_kb : {}) as Record<string, unknown>;
    const faq = (Array.isArray(kb.faq) ? kb.faq : []) as Array<{ q?: string; a?: string }>;
    savoir.notes = [
      str(kb.specialites) ? `Spécialités : ${str(kb.specialites).slice(0, 1500)}` : "",
      str(kb.exclusions) ? `Ce qu'il ne propose PAS : ${str(kb.exclusions).slice(0, 800)}` : "",
      ...faq.slice(0, 20).map((f) => (str(f.q) && str(f.a) ? `Q : ${str(f.q)} → R : ${str(f.a)}` : "")),
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    /* colonnes non migrées */
  }
  try {
    const { data: v } = await supabase
      .from("human_vitrine_sites")
      .select("double_voix_id, double_voix_accord_at, double_voix_prenom, double_voix_recit")
      .eq("id", siteId)
      .maybeSingle();
    const w = (v as Record<string, unknown> | null) ?? {};
    /* PAS D'ACCORD DATÉ, PAS DE VOIX. L'identifiant seul ne suffit pas : c'est
       l'accord qui autorise, et on le relit à chaque fois. */
    if (str(w.double_voix_id) && str(w.double_voix_accord_at)) savoir.voixId = str(w.double_voix_id);
    if (str(w.double_voix_prenom)) savoir.prenom = str(w.double_voix_prenom).slice(0, 30);
    savoir.recit = str(w.double_voix_recit).slice(0, 2500);
  } catch {
    /* migration de la voix pas encore appliquée */
  }

  let disponibilites: Array<Record<string, unknown>> = [];
  try {
    const { data: av } = await supabase.from("human_site_availability").select("weekday, start_min, end_min").eq("site_id", siteId);
    disponibilites = (Array.isArray(av) ? av : []) as Array<Record<string, unknown>>;
  } catch {
    /* table absente → horaires de Google */
  }

  const { fiche } = construireFiche(slug, row, { disponibilites, services });
  const carte = carteDepuisFiche(fiche);
  return { carte, savoir, siteId };
}
