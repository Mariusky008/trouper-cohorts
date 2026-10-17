// 📄 LES FACTURES D'ÉCHANGE, CÔTÉ SERVEUR — utilisé par la route des échanges seulement.
// Voir `factures.ts` (ce qui est partagé) et `20261021120000_echanges_factures.sql`.
//
// LE SERVEUR ÉCRIT CE QUE DIT LA FACTURE (vendeur, acheteur, montants) ; la fonction SQL
// `echanges_facturer` vérifie le bon, donne le numéro et fige le tout.
import type { createAdminClient } from "@/lib/supabase/admin";
import { paysDuCommerce } from "@/lib/site-internet/pays";
import {
  FORMES,
  TAUX_TVA,
  estSociete,
  montantsTva,
  natureConseillee,
  siretValide,
  tauxConseille,
  tvaIntraDe,
  type ContenuFacture,
  type EchangeDuReleve,
  type EtatFactures,
  type FactureLigne,
  type InfosFacturation,
  type Nature,
  type TauxTva,
} from "@/lib/echanges/factures";

type Supabase = ReturnType<typeof createAdminClient>;
const str = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => Number(v ?? 0) || 0;

const COLONNES_INFOS = "site_id, nom_legal, forme, capital, immatriculation, adresse, siret, tva_intra, franchise, taux, nature";
const COLONNES_SITE = "id, business_name, address, city, diagnostic";
const COLONNES_FACTURE = "id, bon_id, numero, annee, rang, emise_le, livree_le, ttc, ht, tva, taux, jeton, contenu";

type LigneInfos = {
  site_id: string;
  nom_legal: string;
  forme: string;
  capital: string | null;
  immatriculation: string | null;
  adresse: string;
  siret: string;
  tva_intra: string | null;
  franchise: boolean;
  taux: number | string | null;
  nature: Nature;
};
type LigneSite = { id: string; business_name?: string | null; address?: string | null; city?: string | null; diagnostic?: unknown };
type LigneBonValide = {
  id: string;
  code: string;
  preneur_id: string;
  fournisseur_id: string;
  titre: string;
  prix: number;
  utilise_le: string | null;
  pour: string;
  membre_id: string | null;
  /** « Jamais plein tarif » : à moitié prix, une part réglée en euros sur place. */
  mode?: string;
  a_regler?: number | string;
};
type LigneFacture = {
  id: string;
  bon_id: string;
  numero: string;
  annee: number;
  rang: number;
  emise_le: string;
  livree_le: string;
  ttc: number;
  ht: number | string;
  tva: number | string;
  taux: number | string | null;
  jeton: string;
  contenu: ContenuFacture;
};

const versInfos = (r: LigneInfos): InfosFacturation => ({
  nomLegal: r.nom_legal,
  forme: r.forme,
  capital: r.capital ?? "",
  immatriculation: r.immatriculation ?? "",
  adresse: r.adresse,
  siret: r.siret,
  tvaIntra: r.tva_intra ?? "",
  franchise: r.franchise,
  taux: r.taux == null ? null : (Number(r.taux) as TauxTva),
  nature: r.nature,
});

async function sites(supabase: Supabase, ids: string[]): Promise<Map<string, LigneSite>> {
  if (!ids.length) return new Map();
  const { data } = await supabase.from("human_vitrine_sites").select(COLONNES_SITE).in("id", [...new Set(ids)].slice(0, 500));
  return new Map(((data ?? []) as LigneSite[]).map((s) => [s.id, s]));
}

/**
 * FAIRE LES FACTURES QUI MANQUENT CHEZ CE FOURNISSEUR — après chaque validation, quand il donne
 * ses infos, et quand il ouvre « Mes factures ». Rien sans ses infos (`infos: false`), rien hors
 * de France, rien pour un acheteur hors de France. Ne lève jamais : une validation ne doit pas
 * échouer à cause d'une facture.
 */
export async function facturer(supabase: Supabase, fournisseurId: string): Promise<{ infos: boolean; faites: number }> {
  try {
    const { data: li, error: ei } = await supabase.from("human_echanges_facturation").select(COLONNES_INFOS).eq("site_id", fournisseurId).maybeSingle();
    if (ei || !li) return { infos: false, faites: 0 };
    const infos = li as LigneInfos;
    const parId = await sites(supabase, [fournisseurId]);
    const moi = parId.get(fournisseurId);
    if (!moi || paysDuCommerce(moi) !== "fr") return { infos: true, faites: 0 };

    const { data: lb } = await supabase
      .from("human_echanges_bons")
      .select("id, code, preneur_id, fournisseur_id, titre, prix, utilise_le, pour, membre_id, mode, a_regler")
      .eq("fournisseur_id", fournisseurId)
      .eq("statut", "utilise")
      .limit(5000);
    const { data: lf } = await supabase.from("human_echanges_factures").select("bon_id").eq("fournisseur_id", fournisseurId).limit(10000);
    const deja = new Set(((lf ?? []) as Array<{ bon_id: string }>).map((f) => f.bon_id));
    const reste = ((lb ?? []) as LigneBonValide[]).filter((b) => !deja.has(b.id));
    if (!reste.length) return { infos: true, faites: 0 };

    const acheteurs = await sites(supabase, reste.map((b) => b.preneur_id));
    const { data: lia } = await supabase.from("human_echanges_facturation").select(COLONNES_INFOS).in("site_id", [...acheteurs.keys()]);
    const infosAcheteur = new Map(((lia ?? []) as LigneInfos[]).map((r) => [r.site_id, r]));
    const idsMembres = reste.map((b) => b.membre_id).filter((x): x is string => Boolean(x));
    const prenoms = new Map<string, string>();
    if (idsMembres.length) {
      const { data: lm } = await supabase.from("human_echanges_membres").select("id, prenom").in("id", idsMembres);
      for (const m of (lm ?? []) as Array<{ id: string; prenom: string }>) prenoms.set(m.id, m.prenom);
    }

    const taux = infos.franchise || infos.taux == null ? null : Number(infos.taux);
    const vendeur: ContenuFacture["vendeur"] = {
      nom: infos.nom_legal,
      enseigne: str(moi.business_name) !== infos.nom_legal ? str(moi.business_name) : "",
      forme: infos.forme,
      capital: infos.capital ?? "",
      immatriculation: infos.immatriculation ?? "",
      adresse: infos.adresse,
      siret: infos.siret,
      tvaIntra: infos.franchise ? "" : (infos.tva_intra ?? ""),
      franchise: infos.franchise,
    };
    const lignes = reste.flatMap((b) => {
      const s = acheteurs.get(b.preneur_id);
      if (!s || paysDuCommerce(s) !== "fr") return [];
      const ia = infosAcheteur.get(b.preneur_id);
      const enseigne = str(s.business_name);
      const acheteur: ContenuFacture["acheteur"] = {
        nom: ia?.nom_legal || enseigne || "Commerce du réseau ClikMe",
        enseigne: ia && enseigne && enseigne !== ia.nom_legal ? enseigne : "",
        adresse: ia?.adresse || str(s.address) || str(s.city),
        siret: ia?.siret ?? "",
        tvaIntra: ia && !ia.franchise ? (ia.tva_intra ?? "") : "",
      };
      const { ht, tva } = montantsTva(b.prix, taux);
      const prenom = b.membre_id ? prenoms.get(b.membre_id) : "";
      const detail = b.pour === "client" ? `Cadeau offert par ${enseigne || acheteur.nom} à l’un de ses clients` : prenom ? `Pris par ${prenom}, de l’équipe` : "";
      const contenu: ContenuFacture = {
        vendeur,
        acheteur,
        ligne: { designation: b.titre, detail, nature: infos.nature, ttc: b.prix, ht, tva, taux },
        // À MOITIÉ PRIX, la vente est du prix entier : une moitié réglée en euros sur place, l'autre par échange.
        bon: b.mode === "moitie" ? { code: b.code, euros: Number(b.a_regler) || 0 } : { code: b.code },
      };
      return [{ bon: b.id, ttc: b.prix, ht, tva, taux, contenu }];
    });
    if (!lignes.length) return { infos: true, faites: 0 };
    const { data: n, error } = await supabase.rpc("echanges_facturer", { p_fournisseur: fournisseurId, p_lignes: lignes });
    if (error) return { infos: true, faites: 0 };
    return { infos: true, faites: num(n) };
  } catch {
    return { infos: false, faites: 0 };
  }
}

/** SES INFOS DE FACTURATION, données une fois (et modifiables : seules les factures suivantes changent). */
export async function enregistrerInfos(supabase: Supabase, siteId: string, p: Record<string, unknown>): Promise<{ erreur: string } | { ok: true }> {
  const nomLegal = str(p.nomLegal).replace(/\s+/g, " ");
  const forme = str(p.forme);
  const capital = str(p.capital).replace(/\s+/g, " ").slice(0, 40);
  const immatriculation = str(p.immatriculation).replace(/\s+/g, " ").slice(0, 60);
  const adresse = str(p.adresse).replace(/\s+/g, " ");
  const siret = str(p.siret).replace(/\s/g, "");
  const franchise = p.franchise === true;
  const taux = franchise ? null : Number(p.taux);
  const nature = str(p.nature) as Nature;
  if (nomLegal.length < 2 || nomLegal.length > 120) return { erreur: "Ton nom légal (celui de ton entreprise) ?" };
  if (!(FORMES as readonly string[]).includes(forme)) return { erreur: "La forme de ton entreprise ?" };
  if (estSociete(forme) && !capital) return { erreur: "Le capital de ta société ? Il doit figurer sur tes factures." };
  if (adresse.length < 5 || adresse.length > 200) return { erreur: "L’adresse de ton entreprise ?" };
  if (!siretValide(siret)) return { erreur: "Ce SIRET ne semble pas bon : 14 chiffres, ceux de ton avis de situation INSEE." };
  if (!franchise && !(TAUX_TVA as readonly number[]).includes(Number(taux))) return { erreur: "Ton taux de TVA ?" };
  if (!["biens", "services", "mixte"].includes(nature)) return { erreur: "Tu vends des produits ou des services ?" };
  if (p.accepte !== true) return { erreur: "Il faut ton accord pour que ClikMe prépare tes factures d’échange en ton nom." };
  const maintenant = new Date().toISOString();
  const { error } = await supabase.from("human_echanges_facturation").upsert(
    {
      site_id: siteId,
      nom_legal: nomLegal,
      forme,
      capital: estSociete(forme) ? capital : null,
      immatriculation: immatriculation || null,
      adresse,
      siret,
      tva_intra: franchise ? null : tvaIntraDe(siret),
      franchise,
      taux,
      nature,
      mandat_le: maintenant,
      maj_le: maintenant,
    },
    { onConflict: "site_id" },
  );
  if (error) return { erreur: "Tes infos n’ont pas pu être enregistrées. Réessaie." };
  return { ok: true };
}

const versLigne = (f: LigneFacture, autre: string): FactureLigne => ({
  id: f.id,
  numero: f.numero,
  emise: f.emise_le,
  livree: f.livree_le,
  autre,
  designation: f.contenu?.ligne?.designation ?? "",
  ttc: num(f.ttc),
  ht: num(f.ht),
  tva: num(f.tva),
  taux: f.taux == null ? null : num(f.taux),
  lien: `/facture/${f.jeton}`,
});

/** « MES FACTURES » : celles qu'il a émises, celles qu'il a reçues, ce qui attend, et le relevé de tous ses échanges validés. */
export async function lireFactures(supabase: Supabase, site: LigneSite & { metier?: string }): Promise<EtatFactures | null> {
  const pays = paysDuCommerce(site);
  const suggestion: InfosFacturation = {
    nomLegal: str(site.business_name),
    forme: "EI",
    capital: "",
    immatriculation: "",
    adresse: str(site.address),
    siret: "",
    tvaIntra: "",
    franchise: false,
    taux: tauxConseille(str(site.metier)),
    nature: natureConseillee(str(site.metier)),
  };
  const vide: EtatFactures = { pret: false, pays, infos: null, suggestion, emises: [], recues: [], aPreparer: 0, enAttente: [], releve: [] };
  const { data: li, error: ei } = await supabase.from("human_echanges_facturation").select(COLONNES_INFOS).eq("site_id", site.id).maybeSingle();
  if (ei) return vide;
  const infos = li ? versInfos(li as LigneInfos) : null;

  const colBon = "id, code, preneur_id, fournisseur_id, titre, prix, utilise_le, pour, membre_id";
  const [{ data: lv }, { data: la }, { data: le }, { data: lr }] = await Promise.all([
    supabase.from("human_echanges_bons").select(colBon).eq("fournisseur_id", site.id).eq("statut", "utilise").limit(5000),
    supabase.from("human_echanges_bons").select(colBon).eq("preneur_id", site.id).eq("statut", "utilise").limit(5000),
    supabase.from("human_echanges_factures").select(COLONNES_FACTURE).eq("fournisseur_id", site.id).order("emise_le", { ascending: false }).limit(5000),
    supabase.from("human_echanges_factures").select(COLONNES_FACTURE).eq("preneur_id", site.id).order("emise_le", { ascending: false }).limit(5000),
  ]);
  const vendus = (lv ?? []) as LigneBonValide[];
  const achetes = (la ?? []) as LigneBonValide[];
  // LA PLUS RÉCENTE D'ABORD : faites ensemble (même instant), c'est le numéro qui les départage.
  const recentes = (a: LigneFacture, b: LigneFacture) => b.emise_le.localeCompare(a.emise_le) || b.annee - a.annee || b.rang - a.rang;
  const emises = ((le ?? []) as LigneFacture[]).sort(recentes);
  const recues = ((lr ?? []) as LigneFacture[]).sort(recentes);
  const factureDuBon = new Map([...emises, ...recues].map((f) => [f.bon_id, f]));

  const autres = await sites(supabase, [...vendus.map((b) => b.preneur_id), ...achetes.map((b) => b.fournisseur_id)]);
  const nomDe = (id: string) => str(autres.get(id)?.business_name) || "Un commerce du réseau";
  const enFrance = (id: string) => {
    const s = autres.get(id);
    return Boolean(s) && paysDuCommerce(s) === "fr";
  };

  const releve: EchangeDuReleve[] = [
    ...vendus.map((b) => ({ b, sens: "vendu" as const, autre: nomDe(b.preneur_id) })),
    ...achetes.map((b) => ({ b, sens: "achete" as const, autre: nomDe(b.fournisseur_id) })),
  ]
    .map(({ b, sens, autre }) => {
      const f = factureDuBon.get(b.id);
      return {
        sens,
        date: b.utilise_le ?? "",
        code: b.code,
        titre: b.titre,
        autre,
        ttc: b.prix,
        numero: f?.numero ?? "",
        ht: f ? num(f.ht) : null,
        tva: f ? num(f.tva) : null,
        taux: f && f.taux != null ? num(f.taux) : null,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    pret: true,
    pays,
    infos,
    suggestion,
    emises: emises.map((f) => versLigne(f, f.contenu?.acheteur?.enseigne || f.contenu?.acheteur?.nom || "")),
    recues: recues.map((f) => versLigne(f, f.contenu?.vendeur?.enseigne || f.contenu?.vendeur?.nom || "")),
    aPreparer: pays === "fr" ? vendus.filter((b) => !factureDuBon.has(b.id) && enFrance(b.preneur_id)).length : 0,
    enAttente:
      pays === "fr"
        ? achetes
            .filter((b) => !factureDuBon.has(b.id) && enFrance(b.fournisseur_id))
            .map((b) => ({ titre: b.titre, chez: nomDe(b.fournisseur_id), livree: b.utilise_le ?? "" }))
        : [],
    releve,
  };
}

/** UNE FACTURE PAR SON LIEN (`/facture/<jeton>`) : seulement ce qu'elle dit, rien d'autre. */
export async function lireFacture(supabase: Supabase, jeton: string) {
  if (!/^[a-f0-9]{32,64}$/.test(jeton)) return null;
  const { data } = await supabase.from("human_echanges_factures").select("numero, emise_le, livree_le, contenu").eq("jeton", jeton).maybeSingle();
  const f = data as { numero: string; emise_le: string; livree_le: string; contenu: ContenuFacture } | null;
  return f ? { numero: f.numero, emise: f.emise_le, livree: f.livree_le, contenu: f.contenu } : null;
}
