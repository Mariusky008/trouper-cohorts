// 📅 SON PLANNING D'ANNONCES — préparer la semaine ou le mois en une fois,
// depuis son comptoir (`autour-de-moi/assistante`, « Mon planning »).
// Voir `lib/direct/planning-annonces.ts` (les règles),
// `lib/direct/comptoir-planning.ts` (l'écran) et
// `lib/direct/planning-activation.ts` (le jour venu).
//
// POST, le jeton de son lien pro (`slug` + `token`) :
//   · `lire`      → { planning, enLigne, aujourdhui, horizon, maintenant }
//                   Ce qui est dû part d'abord : il voit l'état réel.
//   · `comptoir`  → { texte, famille, jour, jours, repeter?, comptoir: { nom, prix?,
//                   photos, voix?, voixSecondes?, voixTexte?, plat?, rayon?, decrire? } }
//                   L'annonce préparée avec son fantôme : le jour venu, elle
//                   part comme « Publier » (le plat et sa voix, la pièce au
//                   catalogue, Le Direct). `repeter` : la même chaque semaine,
//                   jusqu'à un mois. Rend `placees`, et `ignores` : les
//                   semaines déjà pleines.
//   · `retirer`   → { id, serie? }  — `serie` : toutes les semaines de la série.
//
// SES PHOTOS ET SA VOIX SONT RANGÉES CHEZ NOUS AU MOMENT DE PROGRAMMER : sa
// fiche est lue par toutes ses pages, elle ne doit jamais porter un `data:`
// d'un mégaoctet.
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { rangerPhoto } from "@/lib/direct/ranger-photo";
import { rangerVoix } from "@/lib/site-internet/experience-scenes";
import { siennesVivantes } from "@/lib/direct/publications";
import { jourParis } from "@/lib/jour-paris";
import { activerPlanning } from "@/lib/direct/planning-activation";
import {
  HORIZON_JOURS,
  MAX_PROGRAMMEES,
  ajouterJours,
  bornes,
  chargeParJour,
  jourEnClair,
  jourPlein,
  joursCouverts,
  lirePlanning,
  verifierDates,
  adresseSure,
  type AnnoncePlanifiee,
  type ComptoirPlanifie,
  type FamillePlanifiee,
} from "@/lib/direct/planning-annonces";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const s = (v: unknown) => String(v ?? "").trim();
const objet = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const COLONNES = "id, slug, business_name, city, activite, pro_token, diagnostic, current_offer";

async function laFiche(slug: string, token: string) {
  if (!/^[a-z0-9-]{2,120}$/i.test(slug) || !token) return null;
  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select(COLONNES).eq("slug", slug).eq("channel", "letter").maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? null;
  return row && s(row.pro_token) && s(row.pro_token) === token ? row : null;
}

/** Ses annonces qui tournent en ce moment — elles comptent dans les trois du jour. */
async function enLigneDe(siteId: string) {
  try {
    return (await siennesVivantes(createAdminClient(), siteId)).map((a) => ({
      id: a.id,
      texte: a.texte,
      photo: a.photo,
      famille: a.famille,
      publieLe: a.publieLe,
      expireLe: a.expireLe,
    }));
  } catch {
    return [];
  }
}

async function etat(row: Record<string, unknown>) {
  return {
    ok: true,
    planning: lirePlanning(row.diagnostic),
    enLigne: await enLigneDe(s(row.id)),
    aujourdhui: jourParis(),
    maintenant: new Date().toISOString(),
    horizon: ajouterJours(jourParis(), HORIZON_JOURS),
  };
}

/** Relire sa fiche, changer son planning, écrire — sans rien effacer d'autre. */
async function changer(id: string, maj: (p: AnnoncePlanifiee[]) => AnnoncePlanifiee[]): Promise<Record<string, unknown>> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select(COLONNES).eq("id", id).maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? {};
  const diag = objet(row.diagnostic);
  const planning = maj(lirePlanning(diag)).slice(0, MAX_PROGRAMMEES);
  const { error } = await supabase.from("human_vitrine_sites").update({ diagnostic: { ...diag, planning } }).eq("id", id);
  if (error) throw new Error(s((error as { message?: string }).message) || "écriture refusée");
  return { ...row, diagnostic: { ...diag, planning } };
}

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  let row = await laFiche(slug, s(p?.token)).catch(() => null);
  if (!row) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const id = s(row.id);
  const action = s(p?.action) || "lire";
  const supabase = createAdminClient();

  // CE QUI EST DÛ PART D'ABORD : son planning montre ce qui est vraiment en ligne.
  row = (await activerPlanning(supabase, row)).row;

  if (action === "lire") return NextResponse.json(await etat(row));

  if (action === "retirer") {
    const cible = s(p?.id);
    if (!cible) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const serie = p?.serie === true ? lirePlanning(row.diagnostic).find((a) => a.id === cible)?.serie : undefined;
    try {
      row = await changer(id, (l) => l.filter((a) => a.id !== cible && !(serie && a.serie === serie)));
    } catch (e) {
      return NextResponse.json({ error: `Enregistrement impossible : ${String((e as Error).message ?? e)}` }, { status: 500 });
    }
    return NextResponse.json(await etat(row));
  }

  // ── PROGRAMMER : les règles des dates, et trois annonces par jour au plus ──
  const planningAvant = lirePlanning(row.diagnostic);
  const enLigne = await enLigneDe(id);
  const charge = chargeParJour(planningAvant, enLigne.map((a) => ({ debut: a.publieLe, fin: a.expireLe })));

  /** Les occurrences voulues → celles qui tiennent, et les jours pleins qui en ont fait sauter. */
  const placer = (modele: Omit<AnnoncePlanifiee, "id" | "jour" | "debut" | "fin" | "creeLe">, jours: string[]) => {
    const placees: AnnoncePlanifiee[] = [];
    const pleins: string[] = [];
    for (const jour of jours) {
      const plein = jourPlein({ jour, jours: modele.jours }, charge);
      if (plein) {
        pleins.push(plein);
        continue;
      }
      const a: AnnoncePlanifiee = { ...modele, id: `pl-${randomUUID().slice(0, 12)}`, jour, ...bornes(jour, modele.jours), creeLe: new Date().toISOString() };
      joursCouverts(a).forEach((j) => charge.set(j, (charge.get(j) ?? 0) + 1));
      placees.push(a);
    }
    return { placees, pleins };
  };

  const repondre = async (placees: AnnoncePlanifiee[], pleins: string[]) => {
    if (!placees.length) {
      const j = pleins[0];
      return NextResponse.json(
        { error: j ? `Le ${jourEnClair(j)} a déjà 3 annonces : retires-en une, ou choisis un autre jour.` : "Rien à programmer." },
        { status: 400 },
      );
    }
    if (planningAvant.length + placees.length > MAX_PROGRAMMEES) {
      return NextResponse.json({ error: `Tu as déjà ${planningAvant.length} annonces programmées : c’est le maximum.` }, { status: 400 });
    }
    try {
      row = await changer(id, (l) => [...l, ...placees]);
    } catch (e) {
      return NextResponse.json({ error: `Enregistrement impossible : ${String((e as Error).message ?? e)}` }, { status: 500 });
    }
    // CELLE QUI COMMENCE AUJOURD'HUI PART TOUT DE SUITE.
    row = (await activerPlanning(supabase, row)).row;
    return NextResponse.json({ ...(await etat(row)), ajoutees: placees.length, placees, ignores: [...new Set(pleins)] });
  };

  /** Le premier jour, et les semaines suivantes qui tiennent dans le mois. */
  const lesJours = (jour: string, jours: number, repeter: boolean) => {
    const voulus = [jour];
    if (repeter) {
      for (let k = 1; k <= 5; k++) {
        const j = ajouterJours(jour, 7 * k);
        if (verifierDates(j, jours)) break;
        voulus.push(j);
      }
    }
    return voulus;
  };

  if (action === "comptoir") {
    const texte = s(p?.texte).replace(/\s+/g, " ").slice(0, 140);
    const c = objet(p?.comptoir);
    const nom = s(c.nom).slice(0, 80);
    if (!texte || !nom) return NextResponse.json({ error: "Dis-moi d’abord ce que tu annonces." }, { status: 400 });
    const jour = s(p?.jour);
    const jours = Math.round(Number(p?.jours));
    const souci = verifierDates(jour, jours);
    if (souci) return NextResponse.json({ error: souci }, { status: 400 });

    // SES PHOTOS ET SA VOIX, RANGÉES CHEZ NOUS MAINTENANT : sa fiche ne garde que leurs adresses.
    const photos: string[] = [];
    for (const v of (Array.isArray(c.photos) ? c.photos : []).slice(0, 4)) {
      const u = adresseSure(await rangerPhoto("planning-clikme", slug, v));
      if (u) photos.push(u);
    }
    if (!photos.length) return NextResponse.json({ error: "La photo n’a pas pu être enregistrée : réessaie." }, { status: 400 });
    let voix: string | undefined;
    if (s(c.voix)) {
      const r = await rangerVoix(slug, s(c.voix));
      // UN MOT QUI N'A PAS PU PARTIR N'EMPÊCHE PAS L'ANNONCE (comme au catalogue).
      if (typeof r === "string") voix = r;
    }
    const secondes = Math.round(Number(c.voixSecondes));
    const comptoir: ComptoirPlanifie = {
      nom,
      photos,
      ...(s(c.prix) ? { prix: s(c.prix).slice(0, 20) } : {}),
      ...(voix ? { voix, ...(secondes > 0 ? { voixSecondes: secondes } : {}) } : {}),
      ...(s(c.voixTexte) ? { voixTexte: s(c.voixTexte).slice(0, 400) } : {}),
      ...(c.plat === true ? { plat: true } : {}),
      ...(s(c.rayon) ? { rayon: s(c.rayon).slice(0, 40) } : {}),
      ...(s(c.decrire) ? { decrire: s(c.decrire).slice(0, 300) } : {}),
    };
    const famille = (s(p?.famille) === "menu" ? "menu" : "offre") as FamillePlanifiee;
    const voulus = lesJours(jour, jours, p?.repeter === true);
    const serie = voulus.length > 1 ? `s-${randomUUID().slice(0, 8)}` : undefined;
    const { placees, pleins } = placer(
      { texte, famille, photo: photos[0], ...(comptoir.prix ? { prix: comptoir.prix } : {}), jours, comptoir, ...(serie ? { serie } : {}) },
      voulus,
    );
    return repondre(placees, pleins);
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
