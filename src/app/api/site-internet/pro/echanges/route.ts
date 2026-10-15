// L'ÉCHANGE ENTRE COMMERÇANTS, EN VRAI — la caisse commune du comptoir.
//
// POST, jeton pro privé requis ({ slug, token, action }) :
//   etat                          → son offre, son compte, les offres des autres, ses bons
//   offre { titre, prix, parMois, duJour, accepte }
//                                 → publie ou modifie son offre (il accepte les règles)
//   pause { actif }               → met son offre en pause ou la réactive
//   prendre { fournisseur }       → réserve l'offre d'un autre (fonction `echanges_prendre`)
//   valider { code }              → il valide le code d'un commerçant venu chez lui : c'est
//                                   là, et seulement là, que le crédit est gagné
//   annuler { bon }               → annule un bon encore réservé (celui qui a pris, ou
//                                   celui qui fournit s'il ne peut pas l'honorer)
//
// Les règles et leur raison sont dans la migration
// `20261017120000_echanges_commercants.sql`. Tant qu'elle n'est pas appliquée,
// `etat` répond `{ pret: false }` et l'écran ne montre rien de l'échange.
import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireLeSite } from "@/lib/site-internet/fiche-du-site";
import { villeSlug } from "@/lib/direct/ville";
import {
  ALPHABET_CODE,
  DECOUVERT_MAX_DEPART,
  MOIS_AVANT_EUROS,
  PAR_MOIS,
  codeNormalise,
  decouvertDe,
  type BonReel,
  type EtatEchanges,
  type OffreReelle,
} from "@/lib/echanges/echanges";

export const dynamic = "force-dynamic";

const str = (v: unknown) => String(v ?? "").trim();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** La migration n'est pas appliquée (table ou fonction inconnue). */
const absente = (e: { code?: string; message?: string } | null | undefined) =>
  !!e && (e.code === "42P01" || e.code === "42883" || /does not exist|schema cache|Could not find|PGRST20\d/i.test(String(e.message ?? "")));

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
  statut: "reserve" | "utilise" | "annule";
  cree_le: string;
  utilise_le: string | null;
};

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

async function lireEtat(supabase: ReturnType<typeof createAdminClient>, moi: { id: string; city: string }): Promise<EtatEchanges | null> {
  const vide: EtatEchanges = {
    pret: false,
    mien: null,
    compte: { decouvert: 0, gagne: 0, pris: 0, aDepenser: 0, du: 0, echeance: null },
    maVille: { nom: moi.city, slug: villeSlug(moi.city) },
    offres: [],
    pris: [],
    recus: [],
  };
  const { data: lo, error: eo } = await supabase
    .from("human_echanges_offres")
    .select("site_id, titre, prix, par_mois, du_jour, photo, commerce, metier, branche, ville, ville_slug, actif, maj_le")
    .limit(1000);
  if (eo) return absente(eo) ? vide : null;
  const { data: lb, error: eb } = await supabase
    .from("human_echanges_bons")
    .select("id, code, preneur_id, fournisseur_id, titre, prix, photo, du_jour, statut, cree_le, utilise_le")
    .neq("statut", "annule")
    .order("cree_le", { ascending: false })
    .limit(10000);
  if (eb) return absente(eb) ? vide : null;
  const offresLues = (lo ?? []) as LigneOffre[];
  const bons = (lb ?? []) as LigneBon[];
  const parSite = new Map(offresLues.map((o) => [o.site_id, o]));

  /* LES SOLDES DE TOUT LE MONDE, recalculés depuis les bons : il en faut un
     pour savoir qui doit (son offre passe en tête). */
  const gagne = new Map<string, number>();
  const pris = new Map<string, number>();
  const ceMois = new Map<string, number>();
  const debut = debutDuMois();
  for (const b of bons) {
    if (b.statut === "utilise") gagne.set(b.fournisseur_id, (gagne.get(b.fournisseur_id) ?? 0) + b.prix);
    pris.set(b.preneur_id, (pris.get(b.preneur_id) ?? 0) + b.prix);
    if (Date.parse(b.cree_le) >= debut) ceMois.set(b.fournisseur_id, (ceMois.get(b.fournisseur_id) ?? 0) + 1);
  }
  const doit = (id: string) => (pris.get(id) ?? 0) > (gagne.get(id) ?? 0);

  const mienLu = parSite.get(moi.id);
  const decouvert = mienLu ? decouvertDe(mienLu.prix, mienLu.par_mois) : 0;
  const g = gagne.get(moi.id) ?? 0;
  const p = pris.get(moi.id) ?? 0;
  const miensPris = bons.filter((b) => b.preneur_id === moi.id);
  const premier = miensPris.length ? Math.min(...miensPris.map((b) => Date.parse(b.cree_le))) : NaN;
  let echeance: string | null = null;
  if (p > g && Number.isFinite(premier)) {
    const d = new Date(premier);
    d.setMonth(d.getMonth() + MOIS_AVANT_EUROS);
    echeance = d.toISOString();
  }

  const nomDe = (id: string) => parSite.get(id)?.commerce || "Un commerçant ClikMe";
  const villeDe = (id: string) => parSite.get(id)?.ville || "";
  const enBon = (b: LigneBon, autre: string): BonReel => ({
    id: b.id,
    code: b.code,
    titre: b.du_jour ? "Le produit du jour" : b.titre,
    prix: b.prix,
    photo: photoMontrable(b.photo),
    statut: b.statut,
    autre: nomDe(autre),
    autreVille: villeDe(autre),
    cree: b.cree_le,
    utilise: b.utilise_le ?? undefined,
  });

  const offres: OffreReelle[] = offresLues
    .filter((o) => o.actif && o.site_id !== moi.id)
    .map((o) => ({
      id: o.site_id,
      commerce: o.commerce,
      metier: o.metier,
      branche: o.branche,
      ville: o.ville,
      villeSlug: o.ville_slug,
      titre: o.du_jour ? "Son produit du jour" : o.titre,
      prix: o.prix,
      photo: photoMontrable(o.photo),
      parMois: o.par_mois,
      restant: Math.max(0, o.par_mois - (ceMois.get(o.site_id) ?? 0)),
      doit: doit(o.site_id),
    }))
    // TANT QU'IL DOIT, SON OFFRE PASSE EN TÊTE ; ensuite, les plus récentes.
    .sort((a, b) => Number(b.doit) - Number(a.doit) || Date.parse(parSite.get(b.id)?.maj_le ?? "") - Date.parse(parSite.get(a.id)?.maj_le ?? ""));

  return {
    pret: true,
    mien: mienLu
      ? { titre: mienLu.titre, prix: mienLu.prix, parMois: mienLu.par_mois, duJour: mienLu.du_jour, photo: photoMontrable(mienLu.photo), actif: mienLu.actif }
      : null,
    compte: { decouvert, gagne: g, pris: p, aDepenser: Math.max(0, decouvert + g - p), du: Math.max(0, p - g), echeance },
    maVille: { nom: moi.city, slug: villeSlug(moi.city) },
    offres,
    pris: miensPris.map((b) => enBon(b, b.fournisseur_id)),
    recus: bons.filter((b) => b.fournisseur_id === moi.id).map((b) => enBon(b, b.preneur_id)),
  };
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
       que l'écran envoie) : son nom, son métier, sa photo. */
    const lu = await lireLeSite(slug).catch(() => null);
    const carte = lu?.carte;
    const ligne = {
      site_id: moi.id,
      titre,
      prix,
      par_mois: parMois,
      du_jour: duJour,
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

  if (action === "pause") {
    const actif = p?.actif === true;
    const { error } = await supabase.from("human_echanges_offres").update({ actif, maj_le: new Date().toISOString() }).eq("site_id", moi.id);
    if (error) return NextResponse.json({ error: "Modification impossible." }, { status: 500 });
    return repondre({ ok: true });
  }

  /* ── PRENDRE CHEZ UN AUTRE ─────────────────────────────────────────────── */
  if (action === "prendre") {
    const fournisseur = str(p?.fournisseur);
    if (!UUID.test(fournisseur)) return NextResponse.json({ error: "Offre inconnue." }, { status: 400 });
    // Un code déjà pris (une chance sur des centaines de millions) : on en tire un autre.
    for (let essai = 0; essai < 3; essai++) {
      const { data, error } = await supabase.rpc("echanges_prendre", {
        p_preneur: moi.id,
        p_fournisseur: fournisseur,
        p_code: nouveauCode(),
        p_decouvert_max: DECOUVERT_MAX_DEPART,
      });
      if (error?.code === "23505") continue;
      if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Réservation impossible." }, { status: 500 });
      const r = (data ?? {}) as { ok?: boolean; raison?: string; manque?: number; bon?: LigneBon };
      if (!r.ok) {
        const pourquoi: Record<string, string> = {
          solde: `Il te manque ${r.manque ?? 0} €. Dès qu'un commerçant prend ton produit, tu peux dépenser plus.`,
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

  /* ── VALIDER LE CODE D'UN COMMERÇANT VENU CHEZ LUI ─────────────────────── */
  if (action === "valider") {
    const code = codeNormalise(str(p?.code));
    if (!code) return repondre({ ok: false, message: "Ce code n'a pas la bonne forme : CLK- suivi de 6 lettres ou chiffres." });
    const { data, error } = await supabase
      .from("human_echanges_bons")
      .update({ statut: "utilise", utilise_le: new Date().toISOString() })
      .eq("code", code)
      .eq("fournisseur_id", moi.id)
      .eq("statut", "reserve")
      .select("id, prix, preneur_id");
    if (error) return NextResponse.json({ error: absente(error) ? "L'échange n'est pas encore ouvert." : "Validation impossible." }, { status: 500 });
    const fait = ((data ?? []) as Array<{ id: string; prix: number; preneur_id: string }>)[0];
    if (fait) {
      const { data: o } = await supabase.from("human_echanges_offres").select("commerce").eq("site_id", fait.preneur_id).maybeSingle();
      const qui = str((o as { commerce?: string } | null)?.commerce) || "Ce commerçant";
      return repondre({ ok: true, message: `Validé ✓ ${qui} a bien reçu ton produit : tu as gagné ${fait.prix} €.` });
    }
    // Pourquoi pas : inconnu chez lui, déjà validé, ou annulé.
    const { data: lu } = await supabase.from("human_echanges_bons").select("statut").eq("code", code).eq("fournisseur_id", moi.id).maybeSingle();
    const statut = str((lu as { statut?: string } | null)?.statut);
    const message =
      statut === "utilise"
        ? "Ce bon a déjà été validé."
        : statut === "annule"
          ? "Ce bon a été annulé."
          : "Ce code ne correspond à aucun bon pris chez toi.";
    return repondre({ ok: false, message });
  }

  /* ── ANNULER UN BON ENCORE RÉSERVÉ ─────────────────────────────────────── */
  if (action === "annuler") {
    const bon = str(p?.bon);
    if (!UUID.test(bon)) return NextResponse.json({ error: "Bon inconnu." }, { status: 400 });
    const { data: lu } = await supabase.from("human_echanges_bons").select("preneur_id, fournisseur_id, statut").eq("id", bon).maybeSingle();
    const b = lu as { preneur_id?: string; fournisseur_id?: string; statut?: string } | null;
    const role = b?.preneur_id === moi.id ? "preneur" : b?.fournisseur_id === moi.id ? "fournisseur" : "";
    if (!b || !role) return NextResponse.json({ error: "Bon inconnu." }, { status: 404 });
    if (b.statut !== "reserve") return repondre({ ok: false, message: "Ce bon ne peut plus être annulé." });
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
