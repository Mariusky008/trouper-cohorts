// ÉCRAN 3 — MES COMMERCES.
//
// Deux onglets internes : ce que j'ai gardé, et les commerces que je suis.
//
// Les gardées sont triées par ÉCHÉANCE, pas par date d'ajout : ce qui expire
// aujourd'hui doit être en tête, sinon la liste devient une archive et l'offre
// se périme sans avoir servi. C'est le seul tri qui rend cet écran utile.
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { configVille } from "@/lib/direct/ville";
import { habitantCourant, suivis, barreCoeurs, coeurs, PALIER_AVANTAGE } from "@/lib/direct/habitant";
import { estVivante, type Publication } from "@/lib/direct/publications";
import { repereSpatial } from "@/lib/direct/degradation";
import { cliksDeVille, faconsParPublication } from "@/lib/direct/cliks";
import { faconsVue } from "@/lib/direct/facons-vue";
import { reactionsDesPublications } from "@/lib/direct/reactions";
import { ilYA } from "@/lib/site-internet/collectif";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { presse } from "@/lib/direct/fil";
import { Carte, type CarteVue } from "../_ui/carte";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const cfg = await configVille(createAdminClient(), ville);
  return { title: `Mes commerces — ${cfg.nom}`, robots: { index: false } };
}

/**
 * Les gardées encore vivantes, triées par échéance.
 *
 * Hors du composant : c'est une lecture de base avec une horloge, et la faire
 * pendant le rendu rendrait le résultat dépendant du moment où React se relance.
 */
async function chargerGardees(
  supabase: ReturnType<typeof createAdminClient>,
  habitantId: string
): Promise<Publication[]> {
  const BASE =
    "id, famille, texte, photo, video, lien, auteur_nom, auteur_metier, auteur_slug, site_id, publie_le, expire_le, retire_le";
  const lire = (champs: string) =>
    supabase.from("human_gardees").select(`publication_id, human_publications!inner(${champs})`).eq("habitant_id", habitantId);
  try {
    // Les deux colonnes récentes en premier, puis sans elles : PostgREST refuse
    // TOUTE la requête quand une seule colonne demandée n'existe pas, et une
    // migration non appliquée ne doit pas vider les gardées de quelqu'un.
    const premier = await lire(`${BASE}, reste, ardoise`);
    const { data } = premier.error ? await lire(BASE) : premier;
    const maintenant = Date.now();
    // `as unknown` d'abord : la sélection est construite à l'exécution (deux
    // listes de colonnes possibles), le typage statique de PostgREST ne peut
    // donc pas la déduire.
    return ((Array.isArray(data) ? data : []) as unknown as Array<Record<string, unknown>>)
      .map((r) => r.human_publications as Record<string, unknown> | null)
      .filter((p): p is Record<string, unknown> => Boolean(p) && !str(p!.retire_le))
      .map((p) => ({
        id: str(p.id),
        famille: (str(p.famille) || "offre") as Publication["famille"],
        texte: str(p.texte),
        photo: str(p.photo) || null,
        video: str(p.video) || null,
        lien: str(p.lien) || null,
        auteurNom: str(p.auteur_nom) || "Un commerce",
        auteurMetier: str(p.auteur_metier),
        auteurSlug: str(p.auteur_slug),
        siteId: str(p.site_id) || null,
        publieLe: str(p.publie_le),
        expireLe: str(p.expire_le) || null,
        lat: null,
        lng: null,
        quartier: "",
        reste: str(p.reste).trim().slice(0, 40),
        ardoise: /^https?:\/\//i.test(str(p.ardoise)) ? str(p.ardoise) : null,
      }))
      // Une gardée expirée n'est pas une gardée : elle ne peut plus servir, et
      // la laisser donnerait l'impression d'une offre qu'on a laissée filer.
      .filter((p) => estVivante(p, maintenant))
      // TRI PAR ÉCHÉANCE. Sans échéance = à la fin : rien ne presse. C'est le
      // seul tri qui rend cet écran utile — par date d'ajout, il devient une
      // archive et l'offre se périme sans avoir servi.
      .sort((a, b) => {
        const ea = a.expireLe ? Date.parse(a.expireLe) : Number.MAX_SAFE_INTEGER;
        const eb = b.expireLe ? Date.parse(b.expireLe) : Number.MAX_SAFE_INTEGER;
        return ea - eb;
      });
  } catch {
    return [];
  }
}

/** Combien de ces gardées expirent avant ce soir. */
function expirantAujourdhui(ps: Publication[]): number {
  const finJour = new Date();
  finJour.setHours(23, 59, 59, 999);
  return ps.filter((p) => p.expireLe && Date.parse(p.expireLe) <= finJour.getTime()).length;
}

const moisDepuis = (iso: string): string => {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const j = Math.floor((Date.now() - t) / 86400000);
  if (j < 7) return "cette semaine";
  if (j < 35) return `depuis ${Math.max(1, Math.round(j / 7))} semaine${j >= 14 ? "s" : ""}`;
  return `depuis ${Math.round(j / 30)} mois`;
};

export default async function MesCommercesPage({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ville } = await params;
  const sp = await searchParams;
  const onglet = String(Array.isArray(sp.t) ? sp.t[0] : sp.t || "") === "suivis" ? "suivis" : "gardees";

  const supabase = createAdminClient();
  const [cfg, habitant] = await Promise.all([configVille(supabase, ville), habitantCourant(supabase)]);

  const gardeesVives = habitant ? await chargerGardees(supabase, habitant.id) : [];

  // Les Cliks en cours, pour les annonces gardées. C'est ici qu'ils comptent le
  // plus : quelqu'un qui a gardé une annonce est exactement la personne à
  // prévenir quand il ne manque plus que deux personnes au groupe.
  const cliksParPub = faconsParPublication(await cliksDeVille(supabase, cfg.slug));
  const expirentAujourdhui = expirantAujourdhui(gardeesVives);

  const ctx = { moi: null, quartierHabitant: habitant?.quartier, ville: cfg.nom };
  // Les réactions des annonces affichées, en UNE lecture : une requête par
  // carte multiplierait les allers-retours par le nombre d'annonces.
  const reacts = await reactionsDesPublications(supabase, gardeesVives.map((p) => p.id), habitant?.id ?? null);

  const cartes: CarteVue[] = gardeesVives.map((p) => ({
    id: p.id,
    famille: p.famille,
    texte: p.texte,
    photo: p.photo,
    video: p.video,
    lien: p.lien,
    auteurNom: p.auteurNom,
    auteurMetier: p.auteurMetier,
    auteurSlug: p.auteurSlug,
    repere: repereSpatial(p, ctx),
    lat: p.lat,
    lng: p.lng,
    fraicheur: ilYA(p.publieLe),
    echeance: echeanceCourte(p.expireLe),
    urgent: presse(p.expireLe),
    facons: faconsVue(cliksParPub.get(p.id)),
    reste: p.reste,
    ardoise: p.ardoise,
    reactions: reacts.get(p.id) ?? { compte: {}, miennes: [] },
  }));

  // ── Les commerces suivis ──────────────────────────────────────────────────
  const mesSuivis = habitant ? await suivis(supabase, habitant.id) : [];
  const fiches = new Map<string, Record<string, unknown>>();
  if (mesSuivis.length) {
    try {
      const { data } = await supabase
        .from("human_vitrine_sites")
        .select("id, slug, business_name, activite")
        .in("id", mesSuivis.map((s) => s.siteId));
      for (const r of (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>) fiches.set(str(r.id), r);
    } catch {
      /* fiche introuvable → la ligne ne s'affiche pas, plutôt qu'une ligne vide */
    }
  }

  const racine = `/ville/${ville}/mes-commerces`;

  return (
    <>
      <header className="fhead">
        <h1>Mes commerces</h1>
        <div className="upd">
          {gardeesVives.length} gardée{gardeesVives.length > 1 ? "s" : ""} · {mesSuivis.length} commerce
          {mesSuivis.length > 1 ? "s" : ""} suivi{mesSuivis.length > 1 ? "s" : ""}
        </div>
      </header>

      <nav className="tabs" aria-label="Mes commerces">
        <Link href={racine} className={onglet === "gardees" ? "on" : undefined} scroll={false}>Gardées</Link>
        <Link href={`${racine}?t=suivis`} className={onglet === "suivis" ? "on" : undefined} scroll={false}>Je suis</Link>
      </nav>

      {onglet === "gardees" ? (
        cartes.length > 0 ? (
          <>
            <div className="sect">
              <div className="st">À utiliser bientôt</div>
              <div className="ss">
                {expirentAujourdhui > 0
                  ? `${expirentAujourdhui} expire${expirentAujourdhui > 1 ? "nt" : ""} aujourd'hui`
                  : "les plus urgentes en tête"}
              </div>
            </div>
            <div className="feed">
              {cartes.map((c) => (
                <Carte key={c.id} p={c} gardee ville={ville} action="retirer" />
              ))}
            </div>
          </>
        ) : (
          <div className="vide">
            <h3>Rien de gardé pour l&apos;instant</h3>
            <p>
              Sur le fil, touchez le ♡ d&apos;une offre pour la retrouver ici. Rien ne vous est demandé —
              ni compte, ni adresse.
            </p>
          </div>
        )
      ) : mesSuivis.length > 0 ? (
        <>
          <div className="sect">
            <div className="st">Commerces suivis</div>
            <div className="ss">vous êtes prévenu quand ils publient</div>
          </div>
          <div className="feed">
            {mesSuivis.map((s) => {
              const f = fiches.get(s.siteId);
              if (!f) return null;
              const nom = str(f.business_name) || "Un commerce";
              const { resteAvantAvantage } = coeurs(s.visites);
              return (
                <div className="mc" key={s.siteId}>
                  <span className="av" aria-hidden="true">{nom.charAt(0).toUpperCase()}</span>
                  <div>
                    <div className="nm">{nom}</div>
                    <div className="sb">
                      Suivi {moisDepuis(s.depuis)}
                      {s.visites > 0 ? ` · ${s.visites} visite${s.visites > 1 ? "s" : ""}` : ""}
                    </div>
                    <div className="rel">
                      <span className="hearts" aria-label={`${s.visites} visites sur ${PALIER_AVANTAGE}`}>
                        {barreCoeurs(s.visites)}
                      </span>
                      {resteAvantAvantage > 0 && resteAvantAvantage <= 2 && (
                        <span className="adv">
                          Avantage habitué dans {resteAvantAvantage} visite{resteAvantAvantage > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/site-internet/apercu/${str(f.slug)}?via=direct`} className="go" aria-label={`Ouvrir ${nom}`} prefetch={false}>›</Link>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="vide">
          <h3>Vous ne suivez encore personne</h3>
          <p>
            Depuis la page d&apos;un commerce, choisissez « Suivre » pour être prévenu quand il publie
            quelque chose. C&apos;est le seul geste social du Direct — ni commentaire, ni note publique.
          </p>
        </div>
      )}
    </>
  );
}
