// L'ÉCHANGE ENTRE COMMERÇANTS, EN VRAI — la caisse commune du comptoir, et
// « le cadeau du voisin ».
//
// POST, jeton pro privé requis ({ slug, token, action }) :
//   etat                          → son offre, son compte, sa ville, les offres et cadeaux des autres, ses bons
//   offre { titre, prix, parMois, duJour, equipe, accepte }
//                                 → publie ou modifie son offre (il accepte les règles)
//   cadeau { titre, prix, parMois } | { retirer: true }
//                                 → ce qu'il accepte d'être offert aux clients des autres
//   pause { actif }               → met son offre en pause ou la réactive — pas tant qu'il doit
//   prendre { fournisseur }       → réserve l'offre d'un autre, pour lui (fonction `echanges_prendre`)
//   offrir { fournisseur, quantite, occasion }
//                                 → offre à SES clients un lot de cadeaux chez un autre (`echanges_offrir`)
//   donner { cadeau }             → le prochain bon du lot, remis à un client (son code)
//   reprendre { cadeau }          → les bons du lot pas encore remis : annulés, le montant lui revient
//   valider { code }              → il valide le code d'un commerçant, ou d'un client, venu chez lui :
//                                   c'est là, et seulement là, que le crédit est gagné
//   venus { bon, n }              → « venu à combien ? » pour un bon cadeau qu'il vient de valider
//   annuler { bon }               → annule un bon encore réservé (celui qui l'a pris ; celui qui
//                                   le fournit seulement s'il ne doit rien et que ce n'est pas un cadeau)
//
// LES RÈGLES (migrations `20261017120000_echanges_commercants.sql` et
// `20261019120000_echanges_reseau.sql`) : jamais d'euros ; 50 € d'avance par
// personne de l'équipe ; tant qu'il doit, ni pause ni refus ; un bon réservé
// expire au bout de 30 jours ; l'échange s'ouvre dans une ville à partir de
// 12 commerçants (`ECHANGES_SEUIL_VILLE` pour un essai à moins). Tant que les
// migrations ne sont pas appliquées, `etat` répond `{ pret: false }` et
// l'écran dit « bientôt ».
import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireLeSite } from "@/lib/site-internet/fiche-du-site";
import { villeSlug } from "@/lib/direct/ville";
import { aPied, distanceM, type Point } from "@/lib/direct/voisins";
import {
  ALPHABET_CODE,
  CADEAU_PAR_MOIS,
  EQUIPE,
  PAR_MOIS,
  PAR_PERSONNE,
  SEUIL_VILLE,
  codeNormalise,
  decouvertDe,
  type BonReel,
  type CadeauDuReseau,
  type EtatEchanges,
  type MonLotDeCadeaux,
  type OffreReelle,
  type VilleDuReseau,
} from "@/lib/echanges/echanges";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Une migration n'est pas appliquée (table, colonne ou fonction inconnue). */
const absente = (e: { code?: string; message?: string } | null | undefined) =>
  !!e && (e.code === "42P01" || e.code === "42883" || e.code === "42703" || /does not exist|schema cache|Could not find|PGRST20\d/i.test(String(e.message ?? "")));

/** Le seuil d'ouverture d'une ville : 12, ou moins pour un essai (`ECHANGES_SEUIL_VILLE`). */
function seuilVille(): number {
  const n = Math.round(Number(process.env.ECHANGES_SEUIL_VILLE));
  return Number.isFinite(n) && n >= 1 ? n : SEUIL_VILLE;
}

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
  cadeau_titre: string | null;
  cadeau_prix: number | null;
  cadeau_par_mois: number | null;
};
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
  pour: "moi" | "client";
  cadeau_id: string | null;
  donne_le: string | null;
  venus: number | null;
  expire_le: string;
};
type LigneCadeau = {
  id: string;
  fournisseur_id: string;
  titre: string;
  prix: number;
  photo: string | null;
  occasion: string;
  quantite: number;
  cree_le: string;
};

const COLONNES_OFFRE =
  "site_id, titre, prix, par_mois, du_jour, photo, commerce, metier, branche, ville, ville_slug, actif, maj_le, equipe, cadeau_titre, cadeau_prix, cadeau_par_mois";
const COLONNES_BON = "id, code, preneur_id, fournisseur_id, titre, prix, photo, du_jour, statut, cree_le, utilise_le, pour, cadeau_id, donne_le, venus, expire_le";

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

async function lireEtat(supabase: ReturnType<typeof createAdminClient>, moi: { id: string; city: string }): Promise<EtatEchanges | null> {
  const seuil = seuilVille();
  const maVilleVide = { slug: villeSlug(moi.city), nom: moi.city, offres: 0, ouverte: false, seuil, deja: [] };
  const vide: EtatEchanges = {
    pret: false,
    mien: null,
    compte: { decouvert: 0, equipe: 1, gagne: 0, pris: 0, aDepenser: 0, du: 0 },
    maVille: maVilleVide,
    villes: [],
    offres: [],
    cadeaux: [],
    mesCadeaux: [],
    pris: [],
    recus: [],
    cadeauxAServir: [],
    reseau: { clientsRecus: 0, personnesRecues: 0, clientsEnvoyes: 0, personnesEnvoyees: 0 },
  };

  /* LES BONS PÉRIMÉS D'ABORD : un bon de plus de 30 jours ne bloque plus rien.
     C'est aussi le témoin de la seconde migration. */
  const { error: ex } = await supabase.rpc("echanges_expirer");
  if (ex) return absente(ex) ? vide : null;

  const { data: lo, error: eo } = await supabase.from("human_echanges_offres").select(COLONNES_OFFRE).limit(1000);
  if (eo) return absente(eo) ? vide : null;
  const { data: lb, error: eb } = await supabase
    .from("human_echanges_bons")
    .select(COLONNES_BON)
    .neq("statut", "annule")
    .order("cree_le", { ascending: false })
    .limit(10000);
  if (eb) return absente(eb) ? vide : null;
  const { data: lc, error: ec } = await supabase
    .from("human_echanges_cadeaux")
    .select("id, fournisseur_id, titre, prix, photo, occasion, quantite, cree_le")
    .eq("donneur_id", moi.id)
    .order("cree_le", { ascending: false })
    .limit(60);
  if (ec) return absente(ec) ? vide : null;

  const offresLues = (lo ?? []) as LigneOffre[];
  const bons = (lb ?? []) as LigneBon[];
  const lots = (lc ?? []) as LigneCadeau[];
  const parSite = new Map(offresLues.map((o) => [o.site_id, o]));
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

  /* OÙ ILS SONT : seulement dans sa ville, pour dire « à 4 min à pied » et ranger les cadeaux du plus proche. */
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
     plus ; un bon cadeau compte comme un autre (pris par celui qui offre,
     gagné par celui qui sert). */
  const gagne = new Map<string, number>();
  const pris = new Map<string, number>();
  const ceMoisPourEux = new Map<string, number>();
  const ceMoisCadeaux = new Map<string, number>();
  const debut = debutDuMois();
  for (const b of bons) {
    if (b.statut === "expire") continue;
    if (b.statut === "utilise") ajouter(gagne, b.fournisseur_id, b.prix);
    ajouter(pris, b.preneur_id, b.prix);
    if (Date.parse(b.cree_le) >= debut) ajouter(b.pour === "client" ? ceMoisCadeaux : ceMoisPourEux, b.fournisseur_id, 1);
  }
  const doit = (id: string) => (pris.get(id) ?? 0) > (gagne.get(id) ?? 0);

  const mienLu = parSite.get(moi.id);
  const equipe = mienLu?.equipe ?? 1;
  const decouvert = mienLu ? decouvertDe(equipe) : 0;
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
    pour: b.pour === "client" ? "client" : "moi",
    autre: nomDe(autre),
    autreVille: villeDe(autre),
    cree: b.cree_le,
    utilise: b.utilise_le ?? undefined,
    expire: b.expire_le,
    ...(b.venus ? { venus: b.venus } : {}),
  });
  const aPiedDe = (id: string) => {
    const d = distance(id);
    return Number.isFinite(d) ? { aPied: aPied(d) } : {};
  };

  const autres = offresLues.filter((o) => o.actif && o.site_id !== moi.id);
  const offres: OffreReelle[] = autres
    .map((o) => ({
      id: o.site_id,
      commerce: o.commerce,
      metier: o.metier,
      branche: o.branche,
      ville: o.ville,
      villeSlug: o.ville_slug,
      villeOuverte: ouverte(o.ville_slug),
      titre: o.du_jour ? "Son produit du jour" : o.titre,
      prix: o.prix,
      photo: photoMontrable(o.photo),
      parMois: o.par_mois,
      restant: Math.max(0, o.par_mois - (ceMoisPourEux.get(o.site_id) ?? 0)),
      doit: doit(o.site_id),
      ...aPiedDe(o.site_id),
    }))
    // TANT QU'IL DOIT, SON OFFRE PASSE EN TÊTE ; ensuite, les plus récentes.
    .sort((a, b) => Number(b.doit) - Number(a.doit) || Date.parse(parSite.get(b.id)?.maj_le ?? "") - Date.parse(parSite.get(a.id)?.maj_le ?? ""));

  /* LES CADEAUX DES AUTRES, à offrir à ses clients : sa ville d'abord, du plus
     proche au plus loin — un dessert à deux minutes vaut mieux qu'à deux kilomètres. */
  const cadeaux: CadeauDuReseau[] = autres
    .filter((o) => o.cadeau_titre && o.cadeau_prix && o.cadeau_par_mois && ouverte(o.ville_slug))
    .sort(
      (a, b) =>
        Number(b.ville_slug === maVilleSlug) - Number(a.ville_slug === maVilleSlug) ||
        distance(a.site_id) - distance(b.site_id) ||
        Number(doit(b.site_id)) - Number(doit(a.site_id)) ||
        Date.parse(b.maj_le) - Date.parse(a.maj_le),
    )
    .map((o) => ({
      id: o.site_id,
      commerce: o.commerce,
      metier: o.metier,
      branche: o.branche,
      ville: o.ville,
      villeSlug: o.ville_slug,
      titre: str(o.cadeau_titre),
      prix: Number(o.cadeau_prix),
      photo: photoMontrable(o.photo),
      restant: Math.max(0, Number(o.cadeau_par_mois) - (ceMoisCadeaux.get(o.site_id) ?? 0)),
      ...aPiedDe(o.site_id),
    }));

  /* SES LOTS DE CADEAUX : remis, utilisés, personnes venues, à donner. */
  const mesCadeaux: MonLotDeCadeaux[] = lots.map((c) => {
    const du = bons.filter((b) => b.cadeau_id === c.id);
    const utilises = du.filter((b) => b.statut === "utilise");
    const fins = du.map((b) => Date.parse(b.expire_le)).filter(Number.isFinite);
    return {
      id: c.id,
      chez: nomDe(c.fournisseur_id),
      chezId: c.fournisseur_id,
      titre: c.titre,
      prix: c.prix,
      photo: photoMontrable(c.photo),
      occasion: c.occasion,
      quantite: c.quantite,
      donnes: du.filter((b) => b.donne_le).length,
      utilises: utilises.length,
      personnes: utilises.reduce((s, b) => s + (b.venus ?? 1), 0),
      aDonner: du.filter((b) => b.statut === "reserve" && !b.donne_le).length,
      expires: du.filter((b) => b.statut === "expire").length,
      cree: c.cree_le,
      expire: new Date(fins.length ? Math.max(...fins) : Date.parse(c.cree_le) + 30 * 86_400_000).toISOString(),
    };
  });

  /* CE QUE LE RÉSEAU LUI A AMENÉ — en clients, pas en euros. */
  const servis = bons.filter((b) => b.pour === "client" && b.statut === "utilise" && b.fournisseur_id === moi.id);
  const envoyes = bons.filter((b) => b.pour === "client" && b.statut === "utilise" && b.preneur_id === moi.id);
  const aServir = new Map<string, { de: string; titre: string; n: number }>();
  for (const b of bons) {
    if (b.pour !== "client" || b.statut !== "reserve" || b.fournisseur_id !== moi.id) continue;
    const k = `${b.preneur_id}|${b.titre}`;
    const x = aServir.get(k) ?? { de: nomDe(b.preneur_id), titre: b.titre, n: 0 };
    x.n += 1;
    aServir.set(k, x);
  }

  const maVille = parVille.get(maVilleSlug) ?? { slug: maVilleSlug, nom: moi.city, offres: 0, ouverte: false };
  return {
    pret: true,
    mien: mienLu
      ? {
          titre: mienLu.titre,
          prix: mienLu.prix,
          parMois: mienLu.par_mois,
          duJour: mienLu.du_jour,
          photo: photoMontrable(mienLu.photo),
          actif: mienLu.actif,
          equipe,
          cadeau:
            mienLu.cadeau_titre && mienLu.cadeau_prix && mienLu.cadeau_par_mois
              ? { titre: mienLu.cadeau_titre, prix: mienLu.cadeau_prix, parMois: mienLu.cadeau_par_mois }
              : null,
        }
      : null,
    compte: { decouvert, equipe, gagne: g, pris: p, aDepenser: Math.max(0, decouvert + g - p), du: Math.max(0, p - g) },
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
    cadeaux,
    mesCadeaux,
    pris: bons.filter((b) => b.preneur_id === moi.id && b.pour !== "client").map((b) => enBon(b, b.fournisseur_id)),
    recus: bons
      .filter((b) => b.fournisseur_id === moi.id && (b.pour === "client" ? b.statut === "utilise" : b.statut !== "expire"))
      .map((b) => enBon(b, b.preneur_id)),
    cadeauxAServir: [...aServir.values()],
    reseau: {
      clientsRecus: servis.length,
      personnesRecues: servis.reduce((s, b) => s + (b.venus ?? 1), 0),
      clientsEnvoyes: envoyes.length,
      personnesEnvoyees: envoyes.reduce((s, b) => s + (b.venus ?? 1), 0),
    },
  };
}

/** Pourquoi on ne peut pas encore prendre ni offrir : sa ville, ou celle de l'autre, n'est pas ouverte. */
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
  const slug = str(p?.slug);
  const token = str(p?.token);
  const action = str(p?.action) || "etat";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, slug, city, pro_token")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || str(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const moi = { id: str(site.id), city: str(site.city) };
  const repondre = async (extra: Record<string, unknown> = {}) => {
    const etat = await lireEtat(supabase, moi);
    if (!etat) return NextResponse.json({ error: "Lecture impossible pour l'instant." }, { status: 500 });
    return NextResponse.json({ ...extra, etat });
  };
  /** L'état d'abord, pour décider (sa ville est-elle ouverte ? doit-il ?). */
  const avant = async () => {
    const etat = await lireEtat(supabase, moi);
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
    const equipe = Math.round(Number(p?.equipe ?? 1));
    if (titre.length < 2) return NextResponse.json({ error: "Écris ce que tu offres." }, { status: 400 });
    if (!Number.isFinite(prix) || prix < 5 || prix > 2000) return NextResponse.json({ error: "Le prix doit être entre 5 et 2000 €." }, { status: 400 });
    if (!PAR_MOIS.includes(parMois)) return NextResponse.json({ error: "Combien par mois ? 1, 2, 4 ou 8." }, { status: 400 });
    if (!EQUIPE.includes(equipe)) return NextResponse.json({ error: "Vous êtes combien à en profiter ? De 1 à 5." }, { status: 400 });
    /* CE QUE LES AUTRES VOIENT DE LUI, lu sur sa propre fiche (pas sur ce
       que l'écran envoie) : son nom, son métier, sa photo. */
    const lu = await lireLeSite(slug).catch(() => null);
    const carte = lu?.carte;
    const ligne = {
      site_id: moi.id,
      titre,
      prix,
      par_mois: parMois,
      du_jour: duJour,
      equipe,
      photo: photoMontrable(carte?.photo) || null,
      commerce: str(carte?.nom) || slug,
      metier: str(carte?.metier),
      branche: str(carte?.branche),
      ville: moi.city,
      ville_slug: villeSlug(moi.city),
      actif: true,
      regles_acceptees_le: new Date().toISOString(),
      maj_le: new Date().toISOString(),
    };
    const { error } = await supabase.from("human_echanges_offres").upsert(ligne, { onConflict: "site_id" });
    if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Enregistrement impossible." }, { status: 500 });
    return repondre({ ok: true });
  }

  /* ── LE CADEAU QU'IL ACCEPTE D'ÊTRE OFFERT AUX CLIENTS DES AUTRES ───────── */
  if (action === "cadeau") {
    const retirer = p?.retirer === true;
    const titre = str(p?.titre).slice(0, 60);
    const prix = Math.round(Number(p?.prix));
    const parMois = Math.round(Number(p?.parMois));
    if (!retirer) {
      if (titre.length < 2) return NextResponse.json({ error: "Écris le petit cadeau que tu proposes." }, { status: 400 });
      if (!Number.isFinite(prix) || prix < 2 || prix > 60) return NextResponse.json({ error: "Un cadeau, c'est entre 2 et 60 €." }, { status: 400 });
      if (!CADEAU_PAR_MOIS.includes(parMois)) return NextResponse.json({ error: "Combien par mois ? 5, 10, 20 ou 40." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("human_echanges_offres")
      .update(retirer ? { cadeau_titre: null, cadeau_prix: null, cadeau_par_mois: null, maj_le: new Date().toISOString() } : { cadeau_titre: titre, cadeau_prix: prix, cadeau_par_mois: parMois, maj_le: new Date().toISOString() })
      .eq("site_id", moi.id)
      .select("site_id");
    if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Enregistrement impossible." }, { status: 500 });
    if (!data?.length) return repondre({ ok: false, message: "Publie d'abord ton offre aux commerçants." });
    return repondre({ ok: true, message: retirer ? "Ton cadeau n'est plus proposé aux autres commerçants." : "🎁 Les autres commerçants peuvent maintenant offrir ton cadeau à leurs clients." });
  }

  if (action === "pause") {
    const actif = p?.actif === true;
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
    if (!UUID.test(fournisseur)) return NextResponse.json({ error: "Offre inconnue." }, { status: 400 });
    const { etat, erreur } = await avant();
    if (!etat) return erreur;
    const o = etat.offres.find((x) => x.id === fournisseur);
    const ferme = villeFermee(etat, o);
    if (ferme) return refus(etat, ferme, { raison: "ville" });
    // Un code déjà pris (une chance sur des centaines de millions) : on en tire un autre.
    for (let essai = 0; essai < 3; essai++) {
      const { data, error } = await supabase.rpc("echanges_prendre", {
        p_preneur: moi.id,
        p_fournisseur: fournisseur,
        p_code: nouveauCode(),
        p_par_personne: PAR_PERSONNE,
      });
      if (error?.code === "23505") continue;
      if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Réservation impossible." }, { status: 500 });
      const r = (data ?? {}) as { ok?: boolean; raison?: string; manque?: number; bon?: LigneBon };
      if (!r.ok) {
        const pourquoi: Record<string, string> = {
          solde: `Il te manque ${r.manque ?? 0} €. Dès qu'un commerçant prend ton produit, tu peux reprendre.`,
          complet: "Ce commerçant a déjà donné tout ce qu'il pouvait ce mois-ci.",
          offre_retiree: "Ce commerçant a mis son offre en pause.",
          sans_offre: "Publie d'abord ton offre : c'est ce qui te permet de prendre chez les autres.",
          soi: "C'est ta propre offre.",
        };
        return repondre({ ok: false, raison: r.raison, message: pourquoi[str(r.raison)] ?? "Réservation impossible." });
      }
      return repondre({ ok: true, code: r.bon?.code ?? "" });
    }
    return NextResponse.json({ error: "Réservation impossible, réessaie." }, { status: 500 });
  }

  /* ── OFFRIR À SES CLIENTS UN CADEAU CHEZ UN VOISIN ─────────────────────── */
  if (action === "offrir") {
    const fournisseur = str(p?.fournisseur);
    const quantite = Math.round(Number(p?.quantite));
    const occasion = str(p?.occasion).replace(/\s+/g, " ").slice(0, 80);
    if (!UUID.test(fournisseur)) return NextResponse.json({ error: "Cadeau inconnu." }, { status: 400 });
    if (!Number.isFinite(quantite) || quantite < 1 || quantite > 60) return NextResponse.json({ error: "Combien de cadeaux ? De 1 à 60." }, { status: 400 });
    const { etat, erreur } = await avant();
    if (!etat) return erreur;
    const c = etat.cadeaux.find((x) => x.id === fournisseur);
    const o = etat.offres.find((x) => x.id === fournisseur);
    const ferme = villeFermee(etat, c ?? o);
    if (ferme) return refus(etat, ferme, { raison: "ville" });
    for (let essai = 0; essai < 3; essai++) {
      const codes = new Set<string>();
      while (codes.size < quantite) codes.add(nouveauCode());
      const { data, error } = await supabase.rpc("echanges_offrir", {
        p_donneur: moi.id,
        p_fournisseur: fournisseur,
        p_quantite: quantite,
        p_occasion: occasion,
        p_codes: [...codes],
        p_par_personne: PAR_PERSONNE,
      });
      if (error?.code === "23505") continue;
      if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "L'offre n'a pas pu être enregistrée." }, { status: 500 });
      const r = (data ?? {}) as { ok?: boolean; raison?: string; manque?: number; restant?: number; cadeau?: { id?: string } };
      if (!r.ok) {
        const chez = c?.commerce ?? o?.commerce ?? "Ce commerçant";
        const pourquoi: Record<string, string> = {
          solde: `Il te manque ${r.manque ?? 0} € pour ${quantite} cadeaux. Offres-en moins, ou attends qu'un commerçant prenne ton produit.`,
          complet: r.restant ? `${chez} accepte encore ${r.restant} cadeau${r.restant > 1 ? "x" : ""} ce mois-ci.` : `${chez} a déjà été offert autant qu'il le peut ce mois-ci.`,
          offre_retiree: "Ce commerçant ne propose plus de cadeau.",
          sans_offre: "Publie d'abord ton offre : c'est ce qui te permet d'offrir chez les autres.",
          quantite: "Combien de cadeaux ? De 1 à 60.",
          soi: "C'est ton propre cadeau.",
        };
        return repondre({ ok: false, raison: r.raison, message: pourquoi[str(r.raison)] ?? "L'offre n'a pas pu être enregistrée." });
      }
      return repondre({ ok: true, cadeau: r.cadeau?.id ?? "" });
    }
    return NextResponse.json({ error: "L'offre n'a pas pu être enregistrée, réessaie." }, { status: 500 });
  }

  /* ── REMETTRE UN BON DU LOT À UN CLIENT ─────────────────────────────────── */
  if (action === "donner") {
    const cadeau = str(p?.cadeau);
    if (!UUID.test(cadeau)) return NextResponse.json({ error: "Lot inconnu." }, { status: 400 });
    // DEUX TÉLÉPHONES PEUVENT DONNER EN MÊME TEMPS : le bon n'est à lui que si personne ne l'a marqué entre-temps.
    for (let essai = 0; essai < 4; essai++) {
      const { data: libres, error } = await supabase
        .from("human_echanges_bons")
        .select("id, code")
        .eq("cadeau_id", cadeau)
        .eq("preneur_id", moi.id)
        .eq("statut", "reserve")
        .is("donne_le", null)
        .order("code")
        .limit(1);
      if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Lecture impossible." }, { status: 500 });
      const b = ((libres ?? []) as Array<{ id: string; code: string }>)[0];
      if (!b) return repondre({ ok: false, message: "Tous les bons de ce lot ont déjà été donnés." });
      const { data: pris } = await supabase
        .from("human_echanges_bons")
        .update({ donne_le: new Date().toISOString() })
        .eq("id", b.id)
        .eq("statut", "reserve")
        .is("donne_le", null)
        .select("id");
      if (pris?.length) return repondre({ ok: true, code: b.code });
    }
    return NextResponse.json({ error: "Réessaie dans un instant." }, { status: 500 });
  }

  if (action === "reprendre") {
    const cadeau = str(p?.cadeau);
    if (!UUID.test(cadeau)) return NextResponse.json({ error: "Lot inconnu." }, { status: 400 });
    const { data, error } = await supabase
      .from("human_echanges_bons")
      .update({ statut: "annule", annule_par: "preneur", annule_le: new Date().toISOString() })
      .eq("cadeau_id", cadeau)
      .eq("preneur_id", moi.id)
      .eq("statut", "reserve")
      .is("donne_le", null)
      .select("id, prix");
    if (error) return NextResponse.json({ error: "Annulation impossible." }, { status: 500 });
    const faits = (data ?? []) as Array<{ prix: number }>;
    const total = faits.reduce((s, b) => s + b.prix, 0);
    return repondre({
      ok: faits.length > 0,
      message: faits.length ? `${faits.length} bon${faits.length > 1 ? "s" : ""} repris : ${total} € reviennent dans ce que tu peux dépenser.` : "Aucun bon à reprendre : ils ont tous été donnés.",
    });
  }

  /* ── VALIDER LE CODE D'UN COMMERÇANT, OU D'UN CLIENT, VENU CHEZ LUI ─────── */
  if (action === "valider") {
    const code = codeNormalise(str(p?.code));
    if (!code) return repondre({ ok: false, message: "Ce code n'a pas la bonne forme : CLK- suivi de 6 lettres ou chiffres." });
    // UN BON DE PLUS DE 30 JOURS NE SE VALIDE PLUS.
    await supabase.rpc("echanges_expirer");
    const { data, error } = await supabase
      .from("human_echanges_bons")
      .update({ statut: "utilise", utilise_le: new Date().toISOString() })
      .eq("code", code)
      .eq("fournisseur_id", moi.id)
      .eq("statut", "reserve")
      .select("id, prix, preneur_id, pour, titre");
    if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Validation impossible." }, { status: 500 });
    const fait = ((data ?? []) as Array<{ id: string; prix: number; preneur_id: string; pour: string; titre: string }>)[0];
    if (fait) {
      const { data: o } = await supabase.from("human_echanges_offres").select("commerce").eq("site_id", fait.preneur_id).maybeSingle();
      const qui = str((o as { commerce?: string } | null)?.commerce) || "Ce commerçant";
      if (fait.pour === "client") {
        return repondre({ ok: true, client: true, bon: fait.id, message: `🎁 Validé ✓ Un client envoyé par ${qui} : ${fait.titre}. Tu as gagné ${fait.prix} €.` });
      }
      return repondre({ ok: true, message: `Validé ✓ ${qui} a bien reçu ton produit : tu as gagné ${fait.prix} €.` });
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

  /* ── « VENU À COMBIEN ? » ──────────────────────────────────────────────── */
  if (action === "venus") {
    const bon = str(p?.bon);
    const n = Math.round(Number(p?.n));
    if (!UUID.test(bon) || !Number.isFinite(n) || n < 1 || n > 20) return NextResponse.json({ error: "Combien de personnes ? De 1 à 20." }, { status: 400 });
    const { data, error } = await supabase
      .from("human_echanges_bons")
      .update({ venus: n })
      .eq("id", bon)
      .eq("fournisseur_id", moi.id)
      .eq("pour", "client")
      .eq("statut", "utilise")
      .select("id");
    if (error) return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    if (!data?.length) return NextResponse.json({ error: "Bon inconnu." }, { status: 404 });
    return repondre({ ok: true, message: n > 1 ? `Noté : ${n} personnes venues grâce au cadeau 🎉` : "Noté ✓" });
  }

  /* ── ANNULER UN BON ENCORE RÉSERVÉ ─────────────────────────────────────── */
  if (action === "annuler") {
    const bon = str(p?.bon);
    if (!UUID.test(bon)) return NextResponse.json({ error: "Bon inconnu." }, { status: 400 });
    const { data: lu } = await supabase.from("human_echanges_bons").select("preneur_id, fournisseur_id, statut, pour, donne_le").eq("id", bon).maybeSingle();
    const b = lu as { preneur_id?: string; fournisseur_id?: string; statut?: string; pour?: string; donne_le?: string | null } | null;
    const role = b?.preneur_id === moi.id ? "preneur" : b?.fournisseur_id === moi.id ? "fournisseur" : "";
    if (!b || !role) return NextResponse.json({ error: "Bon inconnu." }, { status: 404 });
    if (b.statut !== "reserve") return repondre({ ok: false, message: "Ce bon ne peut plus être annulé." });
    if (role === "fournisseur") {
      if (b.pour === "client") return repondre({ ok: false, message: "C’est un cadeau promis à un client : il ne se refuse pas." });
      // TANT QU'IL DOIT, IL SERT : refuser un bon, c'est refuser de rendre.
      const { etat, erreur } = await avant();
      if (!etat) return erreur;
      if (etat.compte.du > 0) return refus(etat, `Tant que tu dois ${etat.compte.du} € au réseau, tu ne peux pas refuser un bon : c’est en servant que ta dette baisse.`);
    }
    if (role === "preneur" && b.pour === "client" && b.donne_le) return repondre({ ok: false, message: "Ce bon est déjà chez ton client." });
    const { error } = await supabase
      .from("human_echanges_bons")
      .update({ statut: "annule", annule_par: role, annule_le: new Date().toISOString() })
      .eq("id", bon)
      .eq("statut", "reserve");
    if (error) return NextResponse.json({ error: "Annulation impossible." }, { status: 500 });
    return repondre({ ok: true, message: "Bon annulé." });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}
