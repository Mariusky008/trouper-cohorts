// 📅 SON PLANNING D'ANNONCES — préparer la semaine ou le mois en une fois.
// Voir `lib/direct/planning-annonces.ts` (les règles) et
// `lib/direct/planning-activation.ts` (le jour venu).
//
// POST, même jeton que le reste de l'Espace Pro (`slug` + `token`) :
//   · `lire`      → { planning, enLigne, photos, vedettePossible, aujourdhui, ville }
//                   Ce qui est dû part d'abord : il voit l'état réel.
//   · `ajouter`   → { texte, famille, photo, prix?, jour, jours, vedette?, repeter? }
//                   `repeter` : la même, chaque semaine, jusqu'à un mois.
//                   Rend aussi `ignores` : les semaines déjà pleines.
//   · `retirer`   → { id, serie? }  — `serie` : toutes les semaines de la série.
//   · `dupliquer` → { id, jour }    — la même annonce, un autre jour.
//
// LA PHOTO EST RANGÉE CHEZ NOUS AU MOMENT DE PROGRAMMER : sa fiche est lue par
// toutes ses pages, elle ne doit jamais porter un `data:` d'un mégaoctet. On
// n'accepte qu'une photo de sa galerie ou une photo qu'il vient de prendre —
// pas une adresse d'image quelconque, qui s'afficherait sur la page de la ville.
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { photosDe } from "@/lib/site-internet/collectif";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { rangerPhoto } from "@/lib/direct/ranger-photo";
import { siennesVivantes } from "@/lib/direct/publications";
import { villeSlug } from "@/lib/direct/ville";
import { jourParis } from "@/lib/jour-paris";
import { activerPlanning } from "@/lib/direct/planning-activation";
import {
  HORIZON_JOURS,
  MAX_PROGRAMMEES,
  SORTES_PLANNING,
  ajouterJours,
  bornes,
  chargeParJour,
  jourEnClair,
  jourPlein,
  joursCouverts,
  lirePlanning,
  verifierDates,
  type AnnoncePlanifiee,
  type FamillePlanifiee,
} from "@/lib/direct/planning-annonces";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const s = (v: unknown) => String(v ?? "").trim();
const objet = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
const COLONNES = "id, slug, business_name, city, activite, pro_token, diagnostic, current_offer, gallery_photos";
/** Les métiers où une annonce peut aussi se mettre en vedette dans l'essayage. */
const AVEC_ESSAI = new Set(["mode", "coiffeur", "ongles"]);

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
  const branche = brancheDuMetier(s(row.activite));
  return {
    ok: true,
    planning: lirePlanning(row.diagnostic),
    enLigne: await enLigneDe(s(row.id)),
    photos: photosDe(row),
    vedettePossible: AVEC_ESSAI.has(branche),
    restaurant: branche === "restaurant" || branche === "bar",
    aujourdhui: jourParis(),
    // L'HEURE DU SERVEUR : l'écran s'en sert pour situer ses annonces, sans lire l'horloge pendant un rendu.
    maintenant: new Date().toISOString(),
    horizon: ajouterJours(jourParis(), HORIZON_JOURS),
    ville: s(row.city) ? villeSlug(s(row.city)) : "",
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

  // ── AJOUTER, DUPLIQUER : les mêmes règles, la même charge par jour ──
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
        { error: j ? `Le ${jourEnClair(j)} a déjà 3 annonces : retirez-en une, ou choisissez un autre jour.` : "Rien à programmer." },
        { status: 400 },
      );
    }
    if (planningAvant.length + placees.length > MAX_PROGRAMMEES) {
      return NextResponse.json({ error: `Vous avez déjà ${planningAvant.length} annonces programmées : c’est le maximum.` }, { status: 400 });
    }
    try {
      row = await changer(id, (l) => [...l, ...placees]);
    } catch (e) {
      return NextResponse.json({ error: `Enregistrement impossible : ${String((e as Error).message ?? e)}` }, { status: 500 });
    }
    // CELLE QUI COMMENCE AUJOURD'HUI PART TOUT DE SUITE.
    row = (await activerPlanning(supabase, row)).row;
    return NextResponse.json({ ...(await etat(row)), ajoutees: placees.length, ignores: [...new Set(pleins)] });
  };

  if (action === "dupliquer") {
    const source = planningAvant.find((a) => a.id === s(p?.id));
    if (!source) return NextResponse.json({ error: "Cette annonce n’est plus dans votre planning." }, { status: 404 });
    const jour = s(p?.jour);
    const souci = verifierDates(jour, source.jours);
    if (souci) return NextResponse.json({ error: souci }, { status: 400 });
    const { id: _i, jour: _j, debut: _d, fin: _f, creeLe: _c, serie: _s, ...modele } = source;
    void _i;
    void _j;
    void _d;
    void _f;
    void _c;
    void _s;
    const { placees, pleins } = placer(modele, [jour]);
    return repondre(placees, pleins);
  }

  if (action === "ajouter") {
    const texte = s(p?.texte).replace(/\s+/g, " ").slice(0, 140);
    if (!texte) return NextResponse.json({ error: "Écrivez votre annonce." }, { status: 400 });
    const famille = (SORTES_PLANNING.some((x) => x.cle === s(p?.famille)) ? s(p?.famille) : "offre") as FamillePlanifiee;
    const jour = s(p?.jour);
    const jours = Math.round(Number(p?.jours));
    const souci = verifierDates(jour, jours);
    if (souci) return NextResponse.json({ error: souci }, { status: 400 });

    // SA PHOTO : une de sa galerie, ou une qu'il vient de prendre — rangée chez nous.
    const voulue = s(p?.photo);
    if (!voulue) return NextResponse.json({ error: "Une annonce a besoin d’une photo." }, { status: 400 });
    const galerie = photosDe(row);
    let photo: string | undefined;
    if (/^https:\/\//i.test(voulue)) photo = galerie.includes(voulue) ? voulue : undefined;
    else if (/^data:image\//i.test(voulue)) photo = await rangerPhoto("planning-clikme", slug, voulue);
    if (!photo) return NextResponse.json({ error: "Cette photo n’a pas pu être enregistrée : choisissez-en une autre." }, { status: 400 });

    const branche = brancheDuMetier(s(row.activite));
    const prix = s(p?.prix).slice(0, 20);
    const modele = {
      texte,
      famille,
      photo,
      ...(prix ? { prix } : {}),
      jours,
      // EN VEDETTE : une pièce à essayer — pas une soirée ni un créneau.
      ...(p?.vedette === true && famille === "offre" && AVEC_ESSAI.has(branche) ? { vedette: true } : {}),
    };

    // CHAQUE SEMAINE, JUSQU'À UN MOIS : le jeudi, puis les jeudis suivants qui tiennent dans l'horizon.
    const voulus = [jour];
    if (p?.repeter === true) {
      for (let k = 1; k <= 5; k++) {
        const j = ajouterJours(jour, 7 * k);
        if (verifierDates(j, jours)) break;
        voulus.push(j);
      }
    }
    const serie = voulus.length > 1 ? `s-${randomUUID().slice(0, 8)}` : undefined;
    const { placees, pleins } = placer({ ...modele, ...(serie ? { serie } : {}) }, voulus);
    return repondre(placees, pleins);
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
