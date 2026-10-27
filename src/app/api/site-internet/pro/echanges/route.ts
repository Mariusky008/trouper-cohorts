// L'ÉCHANGE ENTRE COMMERÇANTS, EN VRAI — la caisse commune du comptoir.
//
// POST, jeton pro privé requis ({ slug, token, action }) — OU le lien personnel
// d'un membre de son équipe ({ membre: <jeton>, action }) :
//   etat                          → son offre, son compte, sa ville, les offres des autres, ses bons
//   offre { titre, prix, parMois, duJour, paiement, accepte }
//                                 → publie ou modifie sa première offre (il accepte les règles)
//   autre { id?, titre, prix, parMois, paiement, photo? }
//                                 → ajoute (sans id) ou modifie sa 2e ou 3e offre
//   autre_retirer { id }          → retire sa 2e ou 3e offre (les bons déjà pris dessus restent)
//   pause { actif }               → met ses offres en pause ou les réactive — pas tant qu'il doit
//   prendre { fournisseur, offre?, mode }
//                                 → réserve une offre d'un autre, pour lui (fonction `echanges_prendre`) :
//                                   avec ses crédits (`credits`), ou à moitié prix (`moitie`)
//   valider { code }              → il valide le code d'un commerçant venu chez lui :
//                                   c'est là, et seulement là, que le crédit est gagné
//   annuler { bon }               → annule un bon encore réservé (celui qui l'a pris ; celui qui
//                                   le fournit seulement s'il ne doit rien)
//   signaler { bon, motif, detail? }
//                                 → celui qui a pris un bon dit qu'il n'a pas été honoré (fonction
//                                   `echanges_signaler`) : un bon encore réservé est annulé ; deux
//                                   commerces différents → les offres de l'autre passent en pause
//   inviter { prenom }            → un membre de plus dans son équipe : son lien personnel (`/e/<jeton>`)
//   retirer { membre }            → son lien ne marche plus ; ce qu'il a pris reste dû par le commerce
//   factures                      → « Mes factures » : émises, reçues, en attente, et le relevé de ses échanges
//   facturation { nomLegal, forme, capital, immatriculation, adresse, siret, franchise, taux, nature, accepte }
//                                 → ses infos de facturation, une fois ; ses factures en attente sont faites
//
// À MOITIÉ PRIX (`20261022130000_echanges_moitie_prix.sql`, simplifiée par
// `20261024120000_echanges_moitie_simple.sql`) : quand une offre le propose — pour écouler
// son stock —, l'acheteur règle la moitié en euros, sur place, et c'est tout : aucun crédit
// d'un côté ni de l'autre. Pas chez une libraire (prix unique du livre).
//
// « 3 OFFRES MAX ET LIMITE PAR OFFRE » (`20261023120000_echanges_offres.sql`) : sa
// première offre dit qui il est et s'il est en pause ; deux autres au plus, chacune
// avec sa limite du mois et sa façon d'être payée (`paiement` : les deux, crédits
// seulement, moitié prix seulement — une librairie : crédits seulement).
//
// LA FACTURE D'ÉCHANGE (`20261021120000_echanges_factures.sql`) : chaque bon validé
// est une vente du fournisseur au preneur, payée par échange. ClikMe la prépare au
// nom du fournisseur dès qu'il a donné ses infos, en France seulement (ailleurs, le
// relevé). Voir `lib/echanges/factures-serveur.ts`.
//
// L'ÉQUIPE (`20261020120000_echanges_equipe.sql`) : chaque membre a son accès et
// ses 50 € par mois ; il peut regarder, prendre pour lui, annuler SES bons et
// valider un bon au comptoir. Le reste — l'offre, la pause, l'équipe — est au
// responsable, qui voit tout.
//
// « 🎁 POUR MES CLIENTS » (le cadeau du voisin) A ÉTÉ RETIRÉ : ses actions
// (cadeau, offrir, donner, reprendre, venus) n'existent plus. Ses tables et ses
// colonnes restent en base, sans servir ; un ancien bon cadeau compte encore
// dans les soldes, mais ne s'affiche plus.
//
// LES RÈGLES (migrations `20261017120000_echanges_commercants.sql` et
// `20261019120000_echanges_reseau.sql`) : jamais d'euros ; 50 € d'avance par
// personne de l'équipe ; tant qu'il doit, ni pause ni refus ; un bon réservé
// expire au bout de 30 jours ; l'échange s'ouvre dans une ville à partir de
// 12 commerçants (`ECHANGES_SEUIL_VILLE` pour un essai à moins). Tant que les
// migrations ne sont pas appliquées, `etat` répond `{ pret: false }` et
// l'écran dit « bientôt ».
import { NextResponse } from "next/server";
import { createHash, randomBytes, randomInt } from "node:crypto";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireLeSite } from "@/lib/site-internet/fiche-du-site";
import { villeSlug } from "@/lib/direct/ville";
import { aPied, distanceM, type Point } from "@/lib/direct/voisins";
import { paysDuCommerce } from "@/lib/site-internet/pays";
import { enregistrerInfos, facturer, lireFactures } from "@/lib/echanges/factures-serveur";
import {
  ALPHABET_CODE,
  MAX_MEMBRES,
  MAX_OFFRES,
  MOTIFS_SIGNALEMENT,
  PAR_MOIS,
  PAR_PERSONNE,
  seuilVilleEchanges,
  accepte,
  codeNormalise,
  decouvertDe,
  enEuros,
  paiementLu,
  sansMoitie,
  type BonReel,
  type EtatEchanges,
  type MembreEquipe,
  type MotifSignalement,
  type OffreReelle,
  type Paiement,
  type VilleDuReseau,
} from "@/lib/echanges/echanges";

export const dynamic = "force-dynamic";

/** Une raison de signalement telle que la base la rend, ramenée aux quatre connues. */
const motifLu = (m: string): MotifSignalement => (MOTIFS_SIGNALEMENT.find((x) => x.cle === m)?.cle ?? "autre");

const str = (v: unknown) => String(v ?? "").trim();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Une migration n'est pas appliquée (table, colonne ou fonction inconnue). */
const absente = (e: { code?: string; message?: string } | null | undefined) =>
  !!e && (e.code === "42P01" || e.code === "42883" || e.code === "42703" || /does not exist|schema cache|Could not find|PGRST20\d/i.test(String(e.message ?? "")));

/** Le seuil d'ouverture d'une ville : 12, ou moins pour un essai (`ECHANGES_SEUIL_VILLE`). */
const seuilVille = seuilVilleEchanges;

type LigneOffre = {
  site_id: string;
  titre: string;
  prix: number;
  par_mois: number;
  du_jour: boolean;
  photo: string | null;
  commerce: string;
  metier: string;
  branche: string;
  ville: string;
  ville_slug: string;
  actif: boolean;
  maj_le: string;
  equipe: number;
  paiement: Paiement;
};
/** Sa 2e ou 3e offre (seulement celles qui ne sont pas retirées). */
type LigneAutre = { id: string; site_id: string; rang: number; titre: string; prix: number; par_mois: number; photo: string | null; paiement: Paiement };
type LigneBon = {
  id: string;
  code: string;
  preneur_id: string;
  fournisseur_id: string;
  titre: string;
  prix: number;
  photo: string | null;
  du_jour: boolean;
  statut: BonReel["statut"];
  cree_le: string;
  utilise_le: string | null;
  /** `client` : un ancien bon cadeau (« Pour mes clients », retiré). */
  pour: "moi" | "client";
  mode: "credits" | "moitie";
  /** Ce que le fournisseur gagne en crédits à la validation (rien à moitié prix ; la route le recompte d'après `mode`). */
  credits: number;
  /** À moitié prix : ce que le preneur règle en euros, sur place. */
  a_regler: number | string;
  expire_le: string;
  membre_id: string | null;
  valide_par: string | null;
  /** Pris sur sa 2e ou 3e offre (vide : sa première). */
  offre_id: string | null;
};
type LigneMembre = { id: string; prenom: string; jeton: string; active_le: string | null; retire_le: string | null };
/** Un membre de son équipe, venu par son lien personnel. */
type Membre = { id: string; prenom: string };

const COLONNES_OFFRE =
  "site_id, titre, prix, par_mois, du_jour, photo, commerce, metier, branche, ville, ville_slug, actif, maj_le, equipe, paiement";
const COLONNES_AUTRE = "id, site_id, rang, titre, prix, par_mois, photo, paiement";
const COLONNES_BON =
  "id, code, preneur_id, fournisseur_id, titre, prix, photo, du_jour, statut, cree_le, utilise_le, pour, mode, credits, a_regler, expire_le, membre_id, valide_par, offre_id";

function nouveauCode(): string {
  let c = "";
  for (let i = 0; i < 6; i++) c += ALPHABET_CODE[randomInt(ALPHABET_CODE.length)];
  return `CLK-${c}`;
}

/** Une photo qu'on peut montrer aux autres : une adresse, pas une image entière collée dans la ligne. */
const photoMontrable = (p: unknown) => {
  const s = str(p);
  return (/^https:\/\//i.test(s) || /^\/[^/]/.test(s)) && s.length < 2048 ? s : "";
};

/* LA PHOTO DE SON OFFRE, prise à l'étape 1 du départ : ramenée à 1200 points
   et rangée sous son empreinte, dans le même seau que les pièces du comptoir
   (`pro/pieces`). La ligne de l'offre ne garde que son adresse. */
const SEAU_PHOTOS = str(process.env.COUVERTURE_BUCKET) || "marketplace-privilege-offers";
async function rangerPhoto(supabase: ReturnType<typeof createAdminClient>, slug: string, valeur: string): Promise<string | { erreur: string }> {
  const m = /^data:(image\/(?:jpeg|jpg|png|webp|heic|heif));base64,(.+)$/i.exec(valeur);
  if (!m) return { erreur: "Cette photo est illisible." };
  const brut = Buffer.from(m[2], "base64");
  if (brut.length > 8 * 1024 * 1024) return { erreur: "Cette photo est trop lourde." };
  let octets: Buffer;
  try {
    octets = await sharp(brut).rotate().resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84 }).toBuffer();
  } catch {
    return { erreur: "Cette photo est illisible." };
  }
  const chemin = `comptoir-clikme/${slug}-echange-${createHash("sha1").update(brut).digest("hex").slice(0, 16)}.jpg`;
  const { error } = await supabase.storage.from(SEAU_PHOTOS).upload(chemin, octets, { contentType: "image/jpeg", upsert: true });
  if (error) return { erreur: "La photo n'a pas pu être enregistrée. Réessaie." };
  return supabase.storage.from(SEAU_PHOTOS).getPublicUrl(chemin).data.publicUrl;
}

/** Début du mois en cours, à l'heure de Paris. */
function debutDuMois(): number {
  const jour = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(new Date());
  // « 2026-10 » → minuit le 1er à Paris ; à une heure près (heure d'été), sans conséquence pour un compte du mois.
  return Date.parse(`${jour}-01T00:00:00+01:00`);
}

const pointDe = (r: Record<string, unknown>): Point | undefined => {
  const lat = Number(r.latitude);
  const lng = Number(r.longitude);
  return r.latitude != null && r.longitude != null && Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0) ? { lat, lng } : undefined;
};

const ajouter = (m: Map<string, number>, k: string, n: number) => m.set(k, (m.get(k) ?? 0) + n);

/** Le commerce qui appelle : son id, sa ville, son pays (une facture ne se fait qu'en France). */
type Moi = { id: string; city: string; pays: string };

async function lireEtat(supabase: ReturnType<typeof createAdminClient>, moi: Moi, membre: Membre | null = null): Promise<EtatEchanges | null> {
  const seuil = seuilVille();
  const maVilleVide = { slug: villeSlug(moi.city), nom: moi.city, offres: 0, ouverte: false, seuil, deja: [] };
  const vide: EtatEchanges = {
    pret: false,
    moi: { role: membre ? "membre" : "responsable", prenom: membre?.prenom ?? "", reste: 0 },
    equipe: [],
    mien: null,
    compte: { decouvert: 0, equipe: 1, gagne: 0, pris: 0, aDepenser: 0, du: 0 },
    maVille: maVilleVide,
    villes: [],
    offres: [],
    pris: [],
    recus: [],
    factures: null,
  };

  /* LES BONS PÉRIMÉS D'ABORD : un bon de plus de 30 jours ne bloque plus rien.
     C'est aussi le témoin de la seconde migration. */
  const { error: ex } = await supabase.rpc("echanges_expirer");
  if (ex) return absente(ex) ? vide : null;

  const { data: lo, error: eo } = await supabase.from("human_echanges_offres").select(COLONNES_OFFRE).limit(1000);
  if (eo) return absente(eo) ? vide : null;
  /* LEURS 2e ET 3e OFFRES (celles qui ne sont pas retirées). */
  const { data: la, error: ea } = await supabase.from("human_echanges_offres_autres").select(COLONNES_AUTRE).eq("actif", true).order("rang").limit(2000);
  if (ea) return absente(ea) ? vide : null;
  const { data: lb, error: eb } = await supabase
    .from("human_echanges_bons")
    .select(COLONNES_BON)
    .neq("statut", "annule")
    .order("cree_le", { ascending: false })
    .limit(10000);
  if (eb) return absente(eb) ? vide : null;
  /* SON ÉQUIPE : ceux qui ont ouvert leur lien comptent ; un retiré ne compte plus. */
  const { data: lm, error: em } = await supabase.from("human_echanges_membres").select("id, prenom, jeton, active_le, retire_le").eq("site_id", moi.id).limit(50);
  if (em) return absente(em) ? vide : null;
  const membres = (lm ?? []) as LigneMembre[];
  const prenomDe = new Map(membres.map((m) => [m.id, m.prenom]));
  /* « SIGNALER » (`20261025121000_echanges_signalements.sql`) : les bons qu'il a déjà
     signalés, et SA pause s'il en a une. Sans la migration, rien de tout ça. */
  const signales = new Set<string>();
  let pause: EtatEchanges["pause"] = null;
  {
    const { data: ls, error: es } = await supabase.from("human_echanges_signalements").select("bon_id").eq("signale_par", moi.id).limit(2000);
    if (!es) for (const r of (ls ?? []) as Array<{ bon_id: string }>) signales.add(r.bon_id);
    const { data: lz, error: ez } = await supabase.from("human_echanges_pauses").select("depuis").eq("site_id", moi.id).is("levee_le", null).maybeSingle();
    const z = lz as { depuis: string } | null;
    if (!ez && z) {
      const { data: lmo } = await supabase
        .from("human_echanges_signalements")
        .select("motif, cree_le")
        .eq("fournisseur_id", moi.id)
        .eq("statut", "ouvert")
        .order("cree_le", { ascending: false })
        .limit(20);
      pause = {
        depuis: z.depuis,
        motifs: ((lmo ?? []) as Array<{ motif: string; cree_le: string }>).map((r) => ({ motif: motifLu(r.motif), le: r.cree_le })),
      };
    }
  }
  /* SES FACTURES (le responsable seulement) : a-t-il donné ses infos ? Sans la migration, rien. */
  let factures: EtatEchanges["factures"] = null;
  if (!membre) {
    const { data: lf, error: ef } = await supabase.from("human_echanges_facturation").select("site_id").eq("site_id", moi.id).maybeSingle();
    if (!ef) factures = { pays: moi.pays, infos: Boolean(lf) };
  }

  const offresLues = (lo ?? []) as LigneOffre[];
  const bons = (lb ?? []) as LigneBon[];
  const parSite = new Map(offresLues.map((o) => [o.site_id, o]));
  const autresDe = new Map<string, LigneAutre[]>();
  for (const a of (la ?? []) as LigneAutre[]) autresDe.set(a.site_id, [...(autresDe.get(a.site_id) ?? []), a]);
  const maVilleSlug = villeSlug(moi.city);

  /* LES VILLES : combien de commerçants y échangent, et si elles sont ouvertes. */
  const parVille = new Map<string, VilleDuReseau>();
  for (const o of offresLues) {
    if (!o.actif || !o.ville_slug) continue;
    const v = parVille.get(o.ville_slug) ?? { slug: o.ville_slug, nom: o.ville || o.ville_slug, offres: 0, ouverte: false };
    v.offres += 1;
    v.ouverte = v.offres >= seuil;
    parVille.set(o.ville_slug, v);
  }
  const ouverte = (slug: string) => Boolean(parVille.get(slug)?.ouverte);

  /* OÙ ILS SONT : seulement dans sa ville, pour dire « à 4 min à pied ». */
  const idsVille = [moi.id, ...offresLues.filter((o) => o.ville_slug === maVilleSlug && o.site_id !== moi.id).map((o) => o.site_id)];
  const points = new Map<string, Point>();
  if (idsVille.length > 1) {
    const { data: lp } = await supabase.from("human_vitrine_sites").select("id, latitude, longitude").in("id", idsVille.slice(0, 300));
    for (const r of (lp ?? []) as Record<string, unknown>[]) {
      const pt = pointDe(r);
      if (pt) points.set(str(r.id), pt);
    }
  }
  const ici = points.get(moi.id);
  const distance = (id: string) => {
    const la = points.get(id);
    return ici && la ? distanceM(ici, la) : Number.POSITIVE_INFINITY;
  };

  /* LES SOLDES DE TOUT LE MONDE, recalculés depuis les bons : il en faut un
     pour savoir qui doit (son offre passe en tête). Un bon expiré ne compte
     plus ; un ancien bon cadeau compte comme un autre (pris par celui qui
     offrait, gagné par celui qui servait). À MOITIÉ PRIX, tout se paie en
     euros : rien de pris en crédits, rien de gagné. CHAQUE OFFRE A SA LIMITE :
     on compte ses bons du mois offre par offre. ET COMBIEN DE FOIS ELLE A ÉTÉ
     RÉSERVÉE depuis sa mise en ligne (« pour montrer la communauté ») : ses
     bons réservés ou utilisés — une offre dont le titre change repart de zéro. */
  const gagne = new Map<string, number>();
  const pris = new Map<string, number>();
  const ceMoisPourEux = new Map<string, number>();
  const reservations = new Map<string, number>();
  const cleOffre = (fournisseur: string, offre: string | null) => `${fournisseur}|${offre ?? ""}`;
  const cleTitre = (fournisseur: string, offre: string | null, duJour: boolean, titre: string) => `${cleOffre(fournisseur, offre)}|${duJour ? "" : titre}`;
  const debut = debutDuMois();
  for (const b of bons) {
    if (b.statut === "expire") continue;
    if (b.mode !== "moitie") {
      if (b.statut === "utilise") ajouter(gagne, b.fournisseur_id, b.prix);
      ajouter(pris, b.preneur_id, b.prix);
    }
    if (b.pour === "client") continue;
    if (Date.parse(b.cree_le) >= debut) ajouter(ceMoisPourEux, cleOffre(b.fournisseur_id, b.offre_id), 1);
    ajouter(reservations, cleTitre(b.fournisseur_id, b.offre_id, b.du_jour, b.titre), 1);
  }
  const doit = (id: string) => (pris.get(id) ?? 0) > (gagne.get(id) ?? 0);

  const mienLu = parSite.get(moi.id);
  const equipe = Math.min(5, 1 + membres.filter((m) => m.active_le && !m.retire_le).length);
  const decouvert = mienLu ? decouvertDe(equipe) : 0;
  /* CE QUE CHAQUE MEMBRE A PRIS CE MOIS-CI, sur ses 50 €. */
  const parMembre = new Map<string, number>();
  for (const b of bons) {
    if (!b.membre_id || b.mode === "moitie" || b.preneur_id !== moi.id || !["reserve", "utilise"].includes(b.statut) || Date.parse(b.cree_le) < debut) continue;
    ajouter(parMembre, b.membre_id, b.prix);
  }
  const g = gagne.get(moi.id) ?? 0;
  const p = pris.get(moi.id) ?? 0;

  const nomDe = (id: string) => parSite.get(id)?.commerce || "Un commerçant ClikMe";
  const villeDe = (id: string) => parSite.get(id)?.ville || "";
  const enBon = (b: LigneBon, autre: string): BonReel => ({
    id: b.id,
    code: b.code,
    titre: b.du_jour ? "Le produit du jour" : b.titre,
    prix: b.prix,
    photo: photoMontrable(b.photo),
    statut: b.statut,
    mode: b.mode === "moitie" ? "moitie" : "credits",
    aRegler: Number(b.a_regler) || 0,
    credits: b.mode === "moitie" ? 0 : b.prix,
    autre: nomDe(autre),
    autreVille: villeDe(autre),
    cree: b.cree_le,
    utilise: b.utilise_le ?? undefined,
    expire: b.expire_le,
    ...(b.membre_id && prenomDe.get(b.membre_id) ? { qui: prenomDe.get(b.membre_id) } : {}),
    ...(b.valide_par && prenomDe.get(b.valide_par) ? { validePar: prenomDe.get(b.valide_par) } : {}),
    ...(signales.has(b.id) ? { signale: true } : {}),
  });
  const aPiedDe = (id: string) => {
    const d = distance(id);
    return Number.isFinite(d) ? { aPied: aPied(d) } : {};
  };

  /* LES OFFRES DES AUTRES : la première de chacun, puis ses autres. Ce que les
     autres voient de lui (nom, métier, ville, pause) vient de sa première. */
  const autres = offresLues.filter((o) => o.actif && o.site_id !== moi.id);
  const offres: OffreReelle[] = autres
    // TANT QU'IL DOIT, SES OFFRES PASSENT EN TÊTE ; ensuite, les plus récentes.
    .sort((a, b) => Number(doit(b.site_id)) - Number(doit(a.site_id)) || Date.parse(b.maj_le) - Date.parse(a.maj_le))
    .flatMap((o) => {
      const commun = {
        fournisseur: o.site_id,
        commerce: o.commerce,
        metier: o.metier,
        branche: o.branche,
        ville: o.ville,
        villeSlug: o.ville_slug,
        villeOuverte: ouverte(o.ville_slug),
        doit: doit(o.site_id),
        ...aPiedDe(o.site_id),
        ...(sansMoitie(o) ? { sansMoitie: true } : {}),
      };
      // UNE LIBRAIRIE : en échange seulement, quoi que dise une offre d'avant.
      const paiementDe = (p: Paiement): Paiement => (sansMoitie(o) ? "credits" : paiementLu(p));
      const premiere: OffreReelle = {
        ...commun,
        id: o.site_id,
        offre: null,
        paiement: paiementDe(o.paiement),
        titre: o.du_jour ? "Son produit du jour" : o.titre,
        prix: o.prix,
        photo: photoMontrable(o.photo),
        parMois: o.par_mois,
        restant: Math.max(0, o.par_mois - (ceMoisPourEux.get(cleOffre(o.site_id, null)) ?? 0)),
        reservations: reservations.get(cleTitre(o.site_id, null, o.du_jour, o.titre)) ?? 0,
      };
      return [
        premiere,
        ...(autresDe.get(o.site_id) ?? []).slice(0, MAX_OFFRES - 1).map((a) => ({
          ...commun,
          id: a.id,
          offre: a.id,
          paiement: paiementDe(a.paiement),
          titre: a.titre,
          prix: a.prix,
          photo: photoMontrable(a.photo),
          parMois: a.par_mois,
          restant: Math.max(0, a.par_mois - (ceMoisPourEux.get(cleOffre(o.site_id, a.id)) ?? 0)),
          reservations: reservations.get(cleTitre(o.site_id, a.id, false, a.titre)) ?? 0,
        })),
      ];
    });

  const maVille = parVille.get(maVilleSlug) ?? { slug: maVilleSlug, nom: moi.city, offres: 0, ouverte: false };
  const aDepenser = Math.max(0, decouvert + g - p);
  const equipeVue: MembreEquipe[] = membre
    ? []
    : membres
        .filter((m) => !m.retire_le)
        .map((m) => ({ id: m.id, prenom: m.prenom, actif: Boolean(m.active_le), prisCeMois: parMembre.get(m.id) ?? 0, lien: `/e/${m.jeton}` }));
  return {
    pret: true,
    moi: {
      role: membre ? "membre" : "responsable",
      prenom: membre?.prenom ?? "",
      // UN MEMBRE : ses 50 € du mois, dans la limite du compte du commerce.
      reste: membre ? Math.max(0, Math.min(PAR_PERSONNE - (parMembre.get(membre.id) ?? 0), aDepenser)) : aDepenser,
    },
    equipe: equipeVue,
    mien: mienLu
      ? {
          titre: mienLu.titre,
          prix: mienLu.prix,
          parMois: mienLu.par_mois,
          duJour: mienLu.du_jour,
          photo: photoMontrable(mienLu.photo),
          actif: mienLu.actif,
          equipe,
          paiement: paiementLu(mienLu.paiement),
          autres: (autresDe.get(moi.id) ?? []).map((a) => ({
            id: a.id,
            titre: a.titre,
            prix: a.prix,
            parMois: a.par_mois,
            paiement: paiementLu(a.paiement),
            photo: photoMontrable(a.photo),
          })),
        }
      : null,
    compte: { decouvert, equipe, gagne: g, pris: p, aDepenser, du: Math.max(0, p - g) },
    maVille: {
      ...maVille,
      nom: moi.city || maVille.nom,
      seuil,
      deja: offresLues
        .filter((o) => o.actif && o.ville_slug === maVilleSlug)
        .slice(0, seuil)
        .map((o) => ({ commerce: o.commerce, metier: o.metier, branche: o.branche, photo: photoMontrable(o.photo) })),
    },
    villes: [...parVille.values()].filter((v) => v.ouverte).sort((a, b) => Number(b.slug === maVilleSlug) - Number(a.slug === maVilleSlug) || b.offres - a.offres),
    offres,
    // UN MEMBRE NE VOIT QUE SES BONS ; le responsable, ceux de toute l'équipe.
    pris: bons.filter((b) => b.preneur_id === moi.id && b.pour !== "client" && (!membre || b.membre_id === membre.id)).map((b) => enBon(b, b.fournisseur_id)),
    recus: bons.filter((b) => b.fournisseur_id === moi.id && b.pour !== "client" && b.statut !== "expire").map((b) => enBon(b, b.preneur_id)),
    factures,
    pause,
  };
}

/** Pourquoi on ne peut pas encore prendre : sa ville, ou celle de l'autre, n'est pas ouverte. */
function villeFermee(etat: EtatEchanges, autre?: { villeSlug: string; ville: string }): string | null {
  const m = etat.maVille;
  if (!m.ouverte) {
    const manque = Math.max(1, m.seuil - m.offres);
    return `L’échange s’ouvre à ${m.nom || "ta ville"} dès ${m.seuil} commerçants : il en manque ${manque}. Ton offre est prête, elle sera là dès l’ouverture.`;
  }
  if (autre && !etat.villes.some((v) => v.slug === autre.villeSlug)) return `L’échange n’est pas encore ouvert à ${autre.ville || "cette ville"}.`;
  return null;
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  let slug = str(p?.slug);
  const token = str(p?.token);
  // `membre` est le jeton d'un membre SEULEMENT sans jeton de responsable : chez le
  // responsable, `retirer { membre }` désigne le membre qu'il retire.
  const jetonMembre = token ? "" : str(p?.membre);
  const action = str(p?.action) || "etat";
  if (!jetonMembre && (!slug || !token)) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  let moi: Moi;
  let membre: Membre | null = null;
  /** Sa fiche (nom, adresse), pour proposer ses infos de facturation. Le responsable seulement. */
  let siteLu: Record<string, unknown> | null = null;
  if (jetonMembre) {
    /* UN MEMBRE DE SON ÉQUIPE, PAR SON LIEN PERSONNEL. La première fois qu'il
       l'ouvre, il compte dans l'équipe (pas quand WhatsApp en fait l'aperçu :
       l'aperçu ne passe pas par ici). */
    const { data: lm, error: em } = await supabase.from("human_echanges_membres").select("id, site_id, prenom, active_le, retire_le").eq("jeton", jetonMembre).maybeSingle();
    if (em) return NextResponse.json({ error: absente(em) ? "L'échange n'est pas encore ouvert." : "Lecture impossible." }, { status: absente(em) ? 403 : 500 });
    const m = lm as { id: string; site_id: string; prenom: string; active_le: string | null; retire_le: string | null } | null;
    if (!m || m.retire_le) return NextResponse.json({ error: "Ce lien n'est plus valable. Demande-en un nouveau à ton responsable." }, { status: 403 });
    const { data: lsite } = await supabase.from("human_vitrine_sites").select("id, slug, city, address, diagnostic").eq("id", m.site_id).maybeSingle();
    const site = (lsite as Record<string, unknown> | null) ?? null;
    if (!site) return NextResponse.json({ error: "Ce lien n'est plus valable." }, { status: 403 });
    if (!m.active_le) await supabase.from("human_echanges_membres").update({ active_le: new Date().toISOString() }).eq("id", m.id).is("active_le", null);
    moi = { id: str(site.id), city: str(site.city), pays: paysDuCommerce(site) };
    slug = str(site.slug);
    membre = { id: m.id, prenom: m.prenom };
    // CE QU'UN MEMBRE PEUT FAIRE ; le reste est au responsable.
    if (!["etat", "prendre", "annuler", "valider", "signaler"].includes(action)) {
      return NextResponse.json({ error: "C'est le responsable du commerce qui s'en occupe." }, { status: 403 });
    }
  } else {
    const { data: row } = await supabase
      .from("human_vitrine_sites")
      .select("id, slug, city, pro_token, address, diagnostic, business_name")
      .eq("slug", slug)
      .eq("channel", "letter")
      .maybeSingle();
    const site = (row as Record<string, unknown> | null) ?? null;
    if (!site || !site.pro_token || str(site.pro_token) !== token) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    moi = { id: str(site.id), city: str(site.city), pays: paysDuCommerce(site) };
    siteLu = site;
  }
  const repondre = async (extra: Record<string, unknown> = {}) => {
    const etat = await lireEtat(supabase, moi, membre);
    if (!etat) return NextResponse.json({ error: "Lecture impossible pour l'instant." }, { status: 500 });
    return NextResponse.json({ ...extra, etat });
  };
  /** L'état d'abord, pour décider (sa ville est-elle ouverte ? doit-il ?). */
  const avant = async () => {
    const etat = await lireEtat(supabase, moi, membre);
    if (!etat) return { etat: null, erreur: NextResponse.json({ error: "Lecture impossible pour l'instant." }, { status: 500 }) };
    if (!etat.pret) return { etat: null, erreur: NextResponse.json({ error: "L'échange n'est pas encore ouvert." }, { status: 500 }) };
    return { etat, erreur: null };
  };
  const refus = (etat: EtatEchanges, message: string, extra: Record<string, unknown> = {}) => NextResponse.json({ ok: false, message, ...extra, etat });

  if (action === "etat") return repondre();

  /* ── SON OFFRE ─────────────────────────────────────────────────────────── */
  if (action === "offre") {
    if (p?.accepte !== true) return NextResponse.json({ error: "Il faut accepter les règles de l'échange." }, { status: 400 });
    const duJour = p?.duJour === true;
    const titre = duJour ? "Mon produit du jour" : str(p?.titre).slice(0, 80);
    const prix = Math.round(Number(p?.prix));
    const parMois = Math.round(Number(p?.parMois));
    if (titre.length < 2) return NextResponse.json({ error: "Écris ce que tu offres." }, { status: 400 });
    if (!Number.isFinite(prix) || prix < 5 || prix > 2000) return NextResponse.json({ error: "Le prix doit être entre 5 et 2000 €." }, { status: 400 });
    if (!PAR_MOIS.includes(parMois)) return NextResponse.json({ error: "Combien par mois ? 1, 2, 4 ou 8." }, { status: 400 });
    /* CE QUE LES AUTRES VOIENT DE LUI, lu sur sa propre fiche (pas sur ce
       que l'écran envoie) : son nom, son métier. SA PHOTO : celle qu'il vient
       de prendre, sinon celle que son offre avait déjà, sinon celle de sa fiche. */
    const lu = await lireLeSite(slug).catch(() => null);
    const carte = lu?.carte;
    // COMMENT ON LA LUI PAIE — une librairie : en échange seulement (prix unique du livre).
    const librairie = sansMoitie({ metier: str(carte?.metier), branche: str(carte?.branche) });
    const paiement: Paiement = librairie ? "credits" : paiementLu(p?.paiement);
    let photo = "";
    if (str(p?.photo).startsWith("data:image/")) {
      const rangee = await rangerPhoto(supabase, slug, str(p?.photo));
      if (typeof rangee !== "string") return NextResponse.json({ error: rangee.erreur }, { status: 400 });
      photo = rangee;
    } else {
      const { data: deja } = await supabase.from("human_echanges_offres").select("photo").eq("site_id", moi.id).maybeSingle();
      photo = photoMontrable((deja as { photo?: string } | null)?.photo) || photoMontrable(carte?.photo);
    }
    const ligne = {
      site_id: moi.id,
      titre,
      prix,
      par_mois: parMois,
      du_jour: duJour,
      photo: photo || null,
      commerce: str(carte?.nom) || slug,
      metier: str(carte?.metier),
      branche: str(carte?.branche),
      ville: moi.city,
      ville_slug: villeSlug(moi.city),
      actif: true,
      regles_acceptees_le: new Date().toISOString(),
      maj_le: new Date().toISOString(),
      // Un écran d'avant n'envoie pas `paiement` : on garde ce qu'il avait choisi.
      ...(p?.paiement !== undefined || librairie ? { paiement } : {}),
    };
    const { error } = await supabase.from("human_echanges_offres").upsert(ligne, { onConflict: "site_id" });
    if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Enregistrement impossible." }, { status: 500 });
    return repondre({ ok: true });
  }

  /* ── SES 2e ET 3e OFFRES ───────────────────────────────────────────────── */
  if (action === "autre") {
    const id = str(p?.id);
    if (id && !UUID.test(id)) return NextResponse.json({ error: "Offre inconnue." }, { status: 400 });
    const titre = str(p?.titre).slice(0, 80);
    const prix = Math.round(Number(p?.prix));
    const parMois = Math.round(Number(p?.parMois));
    if (titre.length < 2) return NextResponse.json({ error: "Écris ce que tu offres." }, { status: 400 });
    if (!Number.isFinite(prix) || prix < 5 || prix > 2000) return NextResponse.json({ error: "Le prix doit être entre 5 et 2000 €." }, { status: 400 });
    if (!PAR_MOIS.includes(parMois)) return NextResponse.json({ error: "Combien par mois ? 1, 2, 4 ou 8." }, { status: 400 });
    const { data: lp, error: ep } = await supabase.from("human_echanges_offres").select("metier, branche").eq("site_id", moi.id).maybeSingle();
    if (ep) return NextResponse.json({ error: absente(ep) ? "L'échange n'est pas encore ouvert." : "Lecture impossible." }, { status: 500 });
    if (!lp) return NextResponse.json({ error: "Publie d'abord ta première offre." }, { status: 400 });
    const paiement: Paiement = sansMoitie(lp as { metier?: string; branche?: string }) ? "credits" : paiementLu(p?.paiement);
    // SA PHOTO : celle qu'il vient de prendre ; sinon, en la modifiant, celle qu'elle avait.
    let photo = "";
    if (str(p?.photo).startsWith("data:image/")) {
      const rangee = await rangerPhoto(supabase, slug, str(p?.photo));
      if (typeof rangee !== "string") return NextResponse.json({ error: rangee.erreur }, { status: 400 });
      photo = rangee;
    }
    const maj_le = new Date().toISOString();
    if (id) {
      const { data, error } = await supabase
        .from("human_echanges_offres_autres")
        .update({ titre, prix, par_mois: parMois, paiement, ...(photo ? { photo } : {}), maj_le })
        .eq("id", id)
        .eq("site_id", moi.id)
        .eq("actif", true)
        .select("id");
      if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
      if (!(data ?? []).length) return NextResponse.json({ error: "Offre inconnue." }, { status: 404 });
      return repondre({ ok: true, message: "C’est noté ✓" });
    }
    // TROIS OFFRES AU PLUS : la première, et les rangs 2 et 3 (la base le garantit aussi).
    const plein = `${MAX_OFFRES} offres au plus : retire-en une pour en mettre une autre.`;
    const { data: deja, error: ed } = await supabase.from("human_echanges_offres_autres").select("rang").eq("site_id", moi.id).eq("actif", true);
    if (ed) return NextResponse.json({ error: absente(ed) ? "L'échange n'est pas encore ouvert." : "Lecture impossible." }, { status: 500 });
    const occupes = new Set(((deja ?? []) as Array<{ rang: number }>).map((r) => r.rang));
    const rang = Array.from({ length: MAX_OFFRES - 1 }, (_, i) => i + 2).find((r) => !occupes.has(r));
    if (!rang) return repondre({ ok: false, message: plein });
    const { error } = await supabase.from("human_echanges_offres_autres").insert({ site_id: moi.id, rang, titre, prix, par_mois: parMois, paiement, photo: photo || null, maj_le });
    if (error?.code === "23505") return repondre({ ok: false, message: plein });
    if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Enregistrement impossible." }, { status: 500 });
    return repondre({ ok: true, message: "Ta nouvelle offre est ajoutée ✓" });
  }

  if (action === "autre_retirer") {
    const id = str(p?.id);
    if (!UUID.test(id)) return NextResponse.json({ error: "Offre inconnue." }, { status: 400 });
    // RETIRÉE, PAS EFFACÉE : les bons déjà pris dessus la gardent.
    const { data, error } = await supabase
      .from("human_echanges_offres_autres")
      .update({ actif: false, maj_le: new Date().toISOString() })
      .eq("id", id)
      .eq("site_id", moi.id)
      .eq("actif", true)
      .select("titre");
    if (error) return NextResponse.json({ error: "Modification impossible." }, { status: 500 });
    const titre = str((data as Array<{ titre: string }> | null)?.[0]?.titre);
    return repondre({ ok: Boolean(titre), message: titre ? `« ${titre} » est retirée. Les bons déjà pris dessus restent valables.` : "Offre inconnue." });
  }

  if (action === "pause") {
    const actif = p?.actif === true;
    if (actif) {
      // EN PAUSE APRÈS DEUX SIGNALEMENTS : c'est ClikMe qui la lève, après en avoir parlé avec lui.
      const { data: lz, error: ez } = await supabase.from("human_echanges_pauses").select("depuis").eq("site_id", moi.id).is("levee_le", null).maybeSingle();
      if (!ez && lz) {
        const etat = await lireEtat(supabase, moi, membre);
        if (etat) return refus(etat, "Tes offres sont en pause après deux signalements. ClikMe te contacte pour en parler, puis lève la pause.");
      }
    }
    if (!actif) {
      // TANT QU'IL DOIT, SON OFFRE RESTE VISIBLE : c'est elle qui fait baisser sa dette.
      const { etat, erreur } = await avant();
      if (!etat) return erreur;
      if (etat.compte.du > 0) return refus(etat, `Tant que tu dois ${etat.compte.du} € au réseau, ton offre reste visible : c’est en servant que ta dette baisse.`);
    }
    const { error } = await supabase.from("human_echanges_offres").update({ actif, maj_le: new Date().toISOString() }).eq("site_id", moi.id);
    if (error) return NextResponse.json({ error: "Modification impossible." }, { status: 500 });
    return repondre({ ok: true });
  }

  /* ── PRENDRE CHEZ UN AUTRE, POUR SOI ───────────────────────────────────── */
  if (action === "prendre") {
    const fournisseur = str(p?.fournisseur);
    // SA 2e OU 3e OFFRE ; rien : sa première.
    const offre = str(p?.offre);
    if (!UUID.test(fournisseur) || (offre && !UUID.test(offre))) return NextResponse.json({ error: "Offre inconnue." }, { status: 400 });
    const mode = str(p?.mode) === "moitie" ? "moitie" : "credits";
    const { etat, erreur } = await avant();
    if (!etat) return erreur;
    const o = etat.offres.find((x) => x.fournisseur === fournisseur && (x.offre ?? "") === offre);
    const ferme = villeFermee(etat, o);
    if (ferme) return refus(etat, ferme, { raison: "ville" });
    if (mode === "moitie" && o?.sansMoitie) {
      return refus(etat, "Pas de moitié prix chez une librairie : le prix d’un livre neuf ne se remise que de 5 %. Avec tes crédits, c’est possible.", { raison: "livre" });
    }
    const pasCommeCa = (paiement: string) =>
      paiement === "moitie"
        ? "Ce commerçant propose ce produit à moitié prix seulement : tu règles la moitié sur place."
        : "Ce commerçant propose ce produit en échange seulement : avec tes crédits.";
    if (o && !accepte(o.paiement, mode)) return refus(etat, pasCommeCa(o.paiement), { raison: "paiement" });
    // Un code déjà pris (une chance sur des centaines de millions) : on en tire un autre.
    for (let essai = 0; essai < 3; essai++) {
      const { data, error } = await supabase.rpc("echanges_prendre", {
        p_preneur: moi.id,
        p_fournisseur: fournisseur,
        p_code: nouveauCode(),
        p_par_personne: PAR_PERSONNE,
        p_membre: membre?.id ?? null,
        p_mode: mode,
        p_offre: offre || null,
      });
      if (error?.code === "23505") continue;
      if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Réservation impossible." }, { status: 500 });
      const r = (data ?? {}) as { ok?: boolean; raison?: string; manque?: number; reste?: number; paiement?: string; bon?: LigneBon };
      if (!r.ok) {
        const pourquoi: Record<string, string> = {
          solde: membre
            ? `Le compte de ta boutique est au plus bas : il manque ${r.manque ?? 0} €. Dès qu'elle sert un commerçant, tu peux reprendre.`
            : `Il te manque ${r.manque ?? 0} €. Dès qu'un commerçant prend ton produit, tu peux reprendre.`,
          plafond_perso: `Il te reste ${r.reste ?? 0} € de tes 50 € ce mois-ci. Ils reviennent le 1er du mois.`,
          membre: "Ce lien n'est plus valable. Demande-en un nouveau à ton responsable.",
          complet: "Ce commerçant a déjà donné tout ce qu'il pouvait de ce produit ce mois-ci.",
          offre_retiree: "Cette offre n'est plus proposée : le commerçant l'a retirée ou mise en pause.",
          sans_offre: membre
            ? "Ta boutique n'a pas encore publié son offre : dès que c'est fait, tu pourras prendre."
            : "Publie d'abord ton offre : c'est ce qui te permet de prendre chez les autres.",
          soi: "C'est ta propre offre.",
          mode: "Comment tu paies ? Avec tes crédits, ou à moitié prix.",
          paiement: pasCommeCa(str(r.paiement)),
        };
        return repondre({ ok: false, raison: r.raison, message: pourquoi[str(r.raison)] ?? "Réservation impossible." });
      }
      return repondre({ ok: true, code: r.bon?.code ?? "" });
    }
    return NextResponse.json({ error: "Réservation impossible, réessaie." }, { status: 500 });
  }

  /* ── VALIDER LE CODE D'UN COMMERÇANT VENU CHEZ LUI ─────────────────────── */
  if (action === "valider") {
    const code = codeNormalise(str(p?.code));
    if (!code) return repondre({ ok: false, message: "Ce code n'a pas la bonne forme : CLK- suivi de 6 lettres ou chiffres." });
    // UN BON DE PLUS DE 30 JOURS NE SE VALIDE PLUS.
    await supabase.rpc("echanges_expirer");
    const { data, error } = await supabase
      .from("human_echanges_bons")
      .update({ statut: "utilise", utilise_le: new Date().toISOString(), valide_par: membre?.id ?? null })
      .eq("code", code)
      .eq("fournisseur_id", moi.id)
      .eq("statut", "reserve")
      .select("id, prix, preneur_id, mode, credits, a_regler");
    if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Validation impossible." }, { status: 500 });
    const fait = ((data ?? []) as Array<{ id: string; prix: number; preneur_id: string; mode: string; credits: number; a_regler: number | string }>)[0];
    if (fait) {
      const { data: o } = await supabase.from("human_echanges_offres").select("commerce").eq("site_id", fait.preneur_id).maybeSingle();
      const qui = str((o as { commerce?: string } | null)?.commerce) || "Ce commerçant";
      // UN BON VALIDÉ, UNE FACTURE — tout de suite s'il a donné ses infos ; sinon elle l'attend.
      const f = await facturer(supabase, moi.id);
      const facture = f.faites > 0 ? "faite" : moi.pays === "fr" && !f.infos ? "infos" : "";
      const rappel = facture === "infos" && !membre ? " 📄 Ta facture d’échange t’attend dans « Mes factures »." : "";
      // À MOITIÉ PRIX : il encaisse la moitié en euros, sur place, et c'est tout.
      if (fait.mode === "moitie") {
        const euros = enEuros(Number(fait.a_regler) || 0);
        return repondre({
          ok: true,
          facture,
          message: `Validé ✓ ${qui} a pris ${membre ? "le produit de ta boutique" : "ton produit"} à moitié prix : encaisse ${euros} sur place.${membre ? "" : rappel}`,
        });
      }
      return repondre({
        ok: true,
        facture,
        message: membre ? `Validé ✓ ${qui} a bien reçu le produit de ta boutique : elle a gagné ${fait.prix} €.` : `Validé ✓ ${qui} a bien reçu ton produit : tu as gagné ${fait.prix} €.${rappel}`,
      });
    }
    // Pourquoi pas : inconnu chez lui, déjà validé, annulé ou expiré.
    const { data: lu } = await supabase.from("human_echanges_bons").select("statut").eq("code", code).eq("fournisseur_id", moi.id).maybeSingle();
    const statut = str((lu as { statut?: string } | null)?.statut);
    const message =
      statut === "utilise"
        ? "Ce bon a déjà été validé."
        : statut === "annule"
          ? "Ce bon a été annulé."
          : statut === "expire"
            ? "Ce bon a expiré : il était valable 30 jours."
            : "Ce code ne correspond à aucun bon pris chez toi.";
    return repondre({ ok: false, message });
  }

  /* ── ANNULER UN BON ENCORE RÉSERVÉ ─────────────────────────────────────── */
  if (action === "annuler") {
    const bon = str(p?.bon);
    if (!UUID.test(bon)) return NextResponse.json({ error: "Bon inconnu." }, { status: 400 });
    const { data: lu } = await supabase.from("human_echanges_bons").select("preneur_id, fournisseur_id, statut, membre_id").eq("id", bon).maybeSingle();
    const b = lu as { preneur_id?: string; fournisseur_id?: string; statut?: string; membre_id?: string | null } | null;
    const role = b?.preneur_id === moi.id ? "preneur" : b?.fournisseur_id === moi.id ? "fournisseur" : "";
    if (!b || !role) return NextResponse.json({ error: "Bon inconnu." }, { status: 404 });
    // UN MEMBRE N'ANNULE QUE SES PROPRES BONS.
    if (membre && (role !== "preneur" || b.membre_id !== membre.id)) return NextResponse.json({ error: "C'est le responsable du commerce qui s'en occupe." }, { status: 403 });
    if (b.statut !== "reserve") return repondre({ ok: false, message: "Ce bon ne peut plus être annulé." });
    if (role === "fournisseur") {
      // TANT QU'IL DOIT, IL SERT : refuser un bon, c'est refuser de rendre.
      const { etat, erreur } = await avant();
      if (!etat) return erreur;
      if (etat.compte.du > 0) return refus(etat, `Tant que tu dois ${etat.compte.du} € au réseau, tu ne peux pas refuser un bon : c’est en servant que ta dette baisse.`);
    }
    const { error } = await supabase
      .from("human_echanges_bons")
      .update({ statut: "annule", annule_par: role, annule_le: new Date().toISOString() })
      .eq("id", bon)
      .eq("statut", "reserve");
    if (error) return NextResponse.json({ error: "Annulation impossible." }, { status: 500 });
    return repondre({ ok: true, message: "Bon annulé." });
  }

  /* ── SIGNALER UN BON NON HONORÉ ─────────────────────────────────────────── */
  if (action === "signaler") {
    const bon = str(p?.bon);
    const motif = str(p?.motif);
    if (!UUID.test(bon)) return NextResponse.json({ error: "Bon inconnu." }, { status: 400 });
    if (!MOTIFS_SIGNALEMENT.some((m) => m.cle === motif)) return NextResponse.json({ error: "Dis-nous ce qui s'est passé." }, { status: 400 });
    const detail = str(p?.detail).replace(/\s+/g, " ").slice(0, 500);
    const { data: lu } = await supabase.from("human_echanges_bons").select("preneur_id, membre_id, mode, prix").eq("id", bon).maybeSingle();
    const b = lu as { preneur_id?: string; membre_id?: string | null; mode?: string; prix?: number } | null;
    if (!b || b.preneur_id !== moi.id) return NextResponse.json({ error: "Bon inconnu." }, { status: 404 });
    // UN MEMBRE NE SIGNALE QUE LES BONS QU'IL A PRIS LUI-MÊME.
    if (membre && b.membre_id !== membre.id) return NextResponse.json({ error: "C'est le responsable du commerce qui s'en occupe." }, { status: 403 });
    const { data, error } = await supabase.rpc("echanges_signaler", { p_preneur: moi.id, p_bon: bon, p_motif: motif, p_detail: detail || null });
    if (error) {
      return absente(error)
        ? NextResponse.json({ error: "Le signalement n'est pas encore ouvert. Écris-nous directement." }, { status: 503 })
        : NextResponse.json({ error: "Signalement impossible pour l'instant." }, { status: 500 });
    }
    const r = (data ?? {}) as { ok?: boolean; raison?: string; annule?: boolean; pause?: boolean };
    if (!r.ok) {
      const pourquoi: Record<string, string> = {
        deja: "Tu as déjà signalé ce bon : ClikMe s'en occupe.",
        annule: "Ce bon est annulé : il n'y a rien à signaler.",
        trop_tard: "Ce bon a plus de 60 jours : écris-nous directement.",
        motif: "Dis-nous ce qui s'est passé.",
        bon: "Bon inconnu.",
      };
      return repondre({ ok: false, message: pourquoi[str(r.raison)] ?? "Signalement impossible." });
    }
    const credits = b.mode === "moitie" ? 0 : Number(b.prix) || 0;
    const message = r.annule
      ? credits
        ? `Merci, c'est signalé. Ton bon est annulé : tes ${credits} crédits te reviennent.`
        : "Merci, c'est signalé. Ton bon est annulé."
      : "Merci, c'est signalé. ClikMe regarde ça avec lui.";
    return repondre({ ok: true, message, ...(r.pause ? { pause: true } : {}) });
  }

  /* ── SON ÉQUIPE ────────────────────────────────────────────────────────── */
  if (action === "inviter") {
    const prenom = str(p?.prenom).replace(/\s+/g, " ").slice(0, 40);
    if (!prenom) return NextResponse.json({ error: "Son prénom ?" }, { status: 400 });
    const { data: deja, error: ed } = await supabase.from("human_echanges_membres").select("id").eq("site_id", moi.id).is("retire_le", null);
    if (ed) return NextResponse.json({ error: absente(ed) ? "L'échange n'est pas encore ouvert." : "Lecture impossible." }, { status: 500 });
    if ((deja ?? []).length >= MAX_MEMBRES) return repondre({ ok: false, message: `Ton équipe est complète : ${MAX_MEMBRES} personnes, et toi.` });
    // UN LIEN QU'ON NE DEVINE PAS : 18 octets au hasard, 24 signes.
    const jeton = randomBytes(18).toString("base64url");
    const { data: m, error } = await supabase.from("human_echanges_membres").insert({ site_id: moi.id, prenom, jeton }).select("id").single();
    if (error || !m) return NextResponse.json({ error: "L'invitation n'a pas pu être créée." }, { status: 500 });
    return repondre({ ok: true, membre: (m as { id: string }).id, lien: `/e/${jeton}`, prenom });
  }

  if (action === "retirer") {
    const id = str(p?.membre);
    if (!UUID.test(id)) return NextResponse.json({ error: "Membre inconnu." }, { status: 400 });
    const { data, error } = await supabase
      .from("human_echanges_membres")
      .update({ retire_le: new Date().toISOString() })
      .eq("id", id)
      .eq("site_id", moi.id)
      .is("retire_le", null)
      .select("prenom");
    if (error) return NextResponse.json({ error: "Modification impossible." }, { status: 500 });
    const qui = str((data as Array<{ prenom: string }> | null)?.[0]?.prenom);
    return repondre({ ok: Boolean(qui), message: qui ? `${qui} ne fait plus partie de ton équipe : son lien ne marche plus.` : "Membre inconnu." });
  }

  /* ── SES FACTURES D'ÉCHANGE ────────────────────────────────────────────── */
  if (action === "factures" || action === "facturation") {
    let message = "";
    if (action === "facturation") {
      if (moi.pays !== "fr") return NextResponse.json({ error: "Les factures d’échange arrivent bientôt dans ton pays." }, { status: 400 });
      const r = await enregistrerInfos(supabase, moi.id, p ?? {});
      if ("erreur" in r) return NextResponse.json({ error: r.erreur }, { status: 400 });
      const f = await facturer(supabase, moi.id);
      message = f.faites > 0 ? `C’est noté ✓ ${f.faites} facture${f.faites > 1 ? "s" : ""} d’échange ${f.faites > 1 ? "sont prêtes" : "est prête"}.` : "C’est noté ✓ Tes prochaines factures d’échange seront faites toutes seules.";
    } else await facturer(supabase, moi.id);
    const { data: lo } = await supabase.from("human_echanges_offres").select("metier").eq("site_id", moi.id).maybeSingle();
    const factures = await lireFactures(supabase, {
      id: moi.id,
      business_name: str(siteLu?.business_name),
      address: str(siteLu?.address),
      city: moi.city,
      diagnostic: siteLu?.diagnostic,
      metier: str((lo as { metier?: string } | null)?.metier),
    });
    if (!factures) return NextResponse.json({ error: "Lecture impossible pour l'instant." }, { status: 500 });
    return NextResponse.json({ ok: true, message, factures });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
