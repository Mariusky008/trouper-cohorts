// 📄 LA FACTURE D'ÉCHANGE — ce que le serveur, l'écran et la page de la facture partagent.
// Voir `supabase/migrations/20261021120000_echanges_factures.sql` pour les règles (une facture
// par bon validé, figée, numérotée sans trou) et la route des échanges pour leur fabrication.
//
// UN BON VALIDÉ EST UNE VENTE : le fournisseur a remis son produit, à son prix public, au commerce
// qui l'a pris, payé par échange. ClikMe prépare la facture au nom du fournisseur (il l'a accepté en
// donnant ses infos) ; c'est à lui, ou à son comptable, de la déclarer.
//
// LA FRANCE D'ABORD : une facture ne se fait qu'entre deux commerces en France. Ailleurs (la Suisse),
// un relevé des échanges, sans valeur de facture, en attendant l'échange en francs suisses.

export const TAUX_TVA = [20, 10, 5.5, 2.1] as const;
export type TauxTva = (typeof TAUX_TVA)[number];
export const FORMES = ["EI", "EURL", "SARL", "SASU", "SAS", "SA", "SNC", "Autre"] as const;
export type Nature = "biens" | "services" | "mixte";

/** Une société (pas une entreprise individuelle) : son capital et son immatriculation vont sur la facture. */
export const estSociete = (forme: string) => !/^(ei|autre)$/i.test(forme.trim());

export const MENTION_FRANCHISE = "TVA non applicable, art. 293 B du CGI";
/** Ce qui change en 2027 : on le dit, sans rien promettre. */
export const NOTE_FACTURE_ELECTRONIQUE =
  "À partir du 1er septembre 2027, les petites entreprises devront émettre leurs factures entre professionnels en format électronique, par une plateforme agréée.";

/** Ses infos de facturation, telles qu'il les donne une fois. */
export type InfosFacturation = {
  nomLegal: string;
  forme: string;
  capital: string;
  immatriculation: string;
  adresse: string;
  siret: string;
  /** Calculée d'après son SIREN quand il facture la TVA. */
  tvaIntra: string;
  franchise: boolean;
  taux: TauxTva | null;
  nature: Nature;
};

/** Ce que dit une facture, recopié le jour où elle est faite (colonne `contenu`). */
export type ContenuFacture = {
  vendeur: {
    nom: string;
    enseigne: string;
    forme: string;
    capital: string;
    immatriculation: string;
    adresse: string;
    siret: string;
    tvaIntra: string;
    franchise: boolean;
  };
  acheteur: { nom: string; enseigne: string; adresse: string; siret: string; tvaIntra: string };
  ligne: { designation: string; detail: string; nature: Nature; ttc: number; ht: number; tva: number; taux: number | null };
  /** `euros` : à moitié prix, la part réglée en euros sur place (le reste, par échange). */
  bon: { code: string; euros?: number };
};

/** Une facture telle que la page `/facture/<jeton>` l'affiche. */
export type FactureComplete = { numero: string; emise: string; livree: string; contenu: ContenuFacture };

/** Une ligne de « Mes factures ». */
export type FactureLigne = {
  id: string;
  numero: string;
  emise: string;
  livree: string;
  autre: string;
  designation: string;
  ttc: number;
  ht: number;
  tva: number;
  taux: number | null;
  lien: string;
};

/** Un échange validé, dans un sens ou dans l'autre : ce que le relevé du mois reprend. */
export type EchangeDuReleve = {
  sens: "vendu" | "achete";
  date: string;
  code: string;
  titre: string;
  autre: string;
  ttc: number;
  numero: string;
  ht: number | null;
  tva: number | null;
  taux: number | null;
};

export type EtatFactures = {
  pret: boolean;
  /** « fr » : de vraies factures. Ailleurs, le relevé seulement. */
  pays: string;
  infos: InfosFacturation | null;
  /** Ce qu'on lui propose de remplir, d'après sa fiche (Google) et son métier. */
  suggestion: InfosFacturation;
  emises: FactureLigne[];
  recues: FactureLigne[];
  /** Ses bons validés qui attendent sa facture (ses infos manquent). */
  aPreparer: number;
  /** Ce qu'il a pris et qui attend la facture de l'autre commerçant. */
  enAttente: Array<{ titre: string; chez: string; livree: string }>;
  releve: EchangeDuReleve[];
};

/** HT et TVA d'un prix public TTC : le HT arrondi au centime, la TVA fait le compte juste. */
export function montantsTva(ttc: number, taux: number | null): { ht: number; tva: number } {
  if (!taux) return { ht: ttc, tva: 0 };
  const ht = Math.round((ttc * 100) / (1 + taux / 100)) / 100;
  return { ht, tva: Math.round((ttc - ht) * 100) / 100 };
}

/** Un SIRET qui existe peut-être : 14 chiffres, et sa clé (Luhn ; La Poste a la sienne). */
export function siretValide(brut: string): boolean {
  const s = String(brut ?? "").replace(/\s/g, "");
  if (!/^\d{14}$/.test(s)) return false;
  if (s.startsWith("356000000")) return [...s].reduce((t, c) => t + Number(c), 0) % 5 === 0;
  let t = 0;
  for (let i = 0; i < 14; i++) {
    let n = Number(s[13 - i]);
    if (i % 2 === 1) n = n * 2 > 9 ? n * 2 - 9 : n * 2;
    t += n;
  }
  return t % 10 === 0;
}

/** Son numéro de TVA intracommunautaire, calculé d'après son SIREN (les 9 premiers chiffres du SIRET). */
export function tvaIntraDe(siret: string): string {
  const siren = String(siret ?? "").replace(/\s/g, "").slice(0, 9);
  if (!/^\d{9}$/.test(siren)) return "";
  const cle = (12 + 3 * (Number(siren) % 97)) % 97;
  return `FR${String(cle).padStart(2, "0")}${siren}`;
}

/** « 732 829 320 00074 » : le SIRET qui se lit. */
export const siretLisible = (s: string) => (/^\d{14}$/.test(s) ? `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6, 9)} ${s.slice(9)}` : s);

/** Le taux le plus courant pour son métier — à vérifier avec son comptable, l'écran le dit. */
export function tauxConseille(metier: string): TauxTva {
  const m = metier.toLowerCase();
  if (/restaura|bistro|brasserie|pizz|cr[êe]p|traiteur|snack|burger|sushi|kebab|caf[ée]\b/.test(m)) return 10;
  if (/fleur|horticult|p[ée]pini/.test(m)) return 10;
  if (/boulang|p[âa]tiss|chocolat|[ée]picer|primeur|fromag|boucher|charcut|poissonn|librair/.test(m)) return 5.5;
  return 20;
}

/** Ce qu'il vend surtout : des produits ou des services (une mention de la facture). */
export function natureConseillee(metier: string): Nature {
  return /coiff|barb|esth[ée]t|institut|beaut|ongl|\bspa\b|massage|restaura|bistro|brasserie|pizz|cr[êe]p|traiteur|tatou|photograph|garage|pressing|cordonn|coach|yoga|sport|soin/i.test(
    metier,
  )
    ? "services"
    : "biens";
}

export const euros = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
export const tauxLisible = (t: number | null) => (t == null ? "—" : `${String(t).replace(".", ",")} %`);
export const dateFr = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" }) : "";
};
/** « 2026-10 » : le mois d'une date, à l'heure de Paris. */
export const moisDe = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(new Date(t)) : "";
};
export const moisLisible = (mois: string) => {
  const t = Date.parse(`${mois}-15T12:00:00Z`);
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }) : mois;
};

/** LE RELEVÉ DU MOIS POUR LE COMPTABLE : un CSV qu'Excel ouvre tel quel (point-virgule, BOM). */
export function releveCsv(lignes: EchangeDuReleve[]): string {
  const cellule = (v: string | number | null) => {
    if (v == null) return "";
    const s = typeof v === "number" ? String(v).replace(".", ",") : v;
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const tete = ["Date", "Sens", "Facture", "Bon", "Produit", "Avec", "HT", "TVA", "Taux", "TTC"];
  const corps = lignes.map((l) =>
    [dateFr(l.date), l.sens === "vendu" ? "Vendu" : "Acheté", l.numero, l.code, l.titre, l.autre, l.ht, l.tva, l.taux, l.ttc].map(cellule).join(";"),
  );
  return `﻿${[tete.join(";"), ...corps].join("\r\n")}\r\n`;
}
