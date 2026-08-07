// ÉCRAN 1 — LE DIRECT.
//
// Tout ce qui se passe dans la ville : le pouls, puis le fil chronologique. Ce
// n'est pas un catalogue, c'est le pouls de la ville en temps réel — le mot
// « catalogue » n'apparaît nulle part à l'écran, et aucune notion d'édition, de
// numéro ni de mois n'existe.
//
// Une publication expirée ne figure pas dans le fil. C'est la traduction directe
// du positionnement : mieux vaut un fil court et vrai qu'un fil rempli d'hier.
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { filDeVille, FAMILLE_LABEL, estFamille, type Famille } from "@/lib/direct/publications";
import { calculerPouls, repereSpatial } from "@/lib/direct/degradation";
import { configVille } from "@/lib/direct/ville";
import { habitantCourant, gardees } from "@/lib/direct/habitant";
import { ilYA } from "@/lib/site-internet/collectif";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { Carte, type CarteVue } from "./_ui/carte";
import { BoutonPosition } from "./_ui/bouton-position";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const cfg = await configVille(createAdminClient(), ville);
  const title = `Le Direct de ${cfg.nom}`;
  const description = `Tout ce qui se passe à ${cfg.nom} en ce moment : places qui se libèrent, offres du jour, événements.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    manifest: `/ville/${ville}/manifest.webmanifest`,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: `Direct ${cfg.nom}` },
  };
}

const FILTRES: Array<{ cle: string; label: string }> = [
  { cle: "", label: "Tout" },
  { cle: "pres", label: "Près de moi" },
  { cle: "offre", label: FAMILLE_LABEL.offre + "s" },
  { cle: "place", label: "Places" },
  { cle: "ville", label: FAMILLE_LABEL.ville },
];

export default async function LeDirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ ville: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ville } = await params;
  const sp = await searchParams;
  const filtre = String(Array.isArray(sp.f) ? sp.f[0] : sp.f || "");

  const supabase = createAdminClient();
  const [cfg, habitant] = await Promise.all([configVille(supabase, ville), habitantCourant(supabase)]);

  // Deux lectures plutôt qu'une : la première décide si la ville a le volume qui
  // rend un fil du jour intéressant, la seconde applique la fenêtre qui en
  // découle. On ne peut pas connaître la fenêtre avant d'avoir compté, et
  // compter sur la mauvaise fenêtre fausserait le seuil.
  const duJour = await filDeVille(supabase, cfg.slug);
  const poulsInitial = calculerPouls(duJour, { seuil: cfg.seuilCompteur, ville: cfg.nom });
  const publications = poulsInitial.fenetreLarge
    ? await filDeVille(supabase, cfg.slug, { fenetreLarge: true })
    : duJour;
  const pouls = calculerPouls(publications, { seuil: cfg.seuilCompteur, ville: cfg.nom });

  const mesGardees = habitant ? await gardees(supabase, habitant.id) : new Set<string>();

  const ctx = { moi: null, quartierHabitant: habitant?.quartier, ville: cfg.nom };
  let visibles = publications;
  if (filtre === "pres") {
    // Sans position, « près de moi » ne peut pas trier par distance. On tombe
    // sur le secteur déclaré dans l'onglet Moi — et si rien n'est déclaré, on
    // n'invente pas un tri : on montre tout, l'onglet Moi propose de le régler.
    const q = habitant?.quartier;
    if (q) visibles = publications.filter((p) => p.quartier === q);
  } else if (estFamille(filtre)) {
    visibles = publications.filter((p) => p.famille === (filtre as Famille));
  }

  const cartes: CarteVue[] = visibles.map((p) => ({
    id: p.id,
    famille: p.famille,
    texte: p.texte,
    photo: p.photo,
    lien: p.lien,
    auteurNom: p.auteurNom,
    auteurMetier: p.auteurMetier,
    auteurSlug: p.auteurSlug,
    repere: repereSpatial(p, ctx),
    lat: p.lat,
    lng: p.lng,
    fraicheur: ilYA(p.publieLe),
    echeance: echeanceCourte(p.expireLe),
  }));

  const maj = publications.length ? ilYA(publications[0].publieLe) : "";

  return (
    <>
      <header className="fhead">
        <div className="live"><span className="dot" aria-hidden="true" />En direct</div>
        <h1>Le Direct de {cfg.nom}</h1>
        <div className="upd">
          Tout ce qui se passe à {cfg.nom}
          {maj ? ` · mis à jour ${maj}` : ""}
        </div>
      </header>

      <section className="pulse" aria-label="Le pouls de la ville">
        <div className="n">{pouls.phrase}</div>
        <div className="sub">{pouls.sous}</div>

        {/* Un sous-compteur à zéro se lit comme « il n'y a rien » : on n'affiche
            que ceux qui portent une information. */}
        {(pouls.pres > 0 || pouls.bientot > 0 || pouls.places > 0) && (
          <div className="rows">
            {pouls.pres > 0 && <div className="r"><b>{pouls.pres}</b><span>près de vous</span></div>}
            {pouls.bientot > 0 && <div className="r"><b>{pouls.bientot}</b><span>finissent bientôt</span></div>}
            {pouls.places > 0 && <div className="r"><b>{pouls.places}</b><span>places libres</span></div>}
          </div>
        )}

        {/* LE PONT entre les deux premiers onglets, et le seul. Si l'habitant ne
            perçoit pas la différence entre Le Direct et À saisir, l'architecture
            a échoué — ce bouton est ce qui la rend évidente. */}
        {publications.length > 0 && (
          <Link href={`/ville/${ville}/a-saisir`} className="cta">
            Voir ce qui vaut le coup maintenant →
          </Link>
        )}
      </section>

      <nav className="chips" aria-label="Filtrer le fil">
        {FILTRES.map((f) => (
          <Link
            key={f.cle || "tout"}
            href={f.cle ? `/ville/${ville}?f=${f.cle}` : `/ville/${ville}`}
            className={`chip${filtre === f.cle ? " on" : ""}`}
            scroll={false}
          >
            {f.label}
          </Link>
        ))}
        <BoutonPosition />
      </nav>

      {cartes.length > 0 ? (
        <>
          <div className="sect">
            <div className="st">Le fil</div>
            <div className="ss">
              du plus récent au plus ancien
              {pouls.fenetreLarge ? " · les sept derniers jours" : ""}
            </div>
          </div>
          <div className="feed">
            {cartes.map((c) => (
              <Carte key={c.id} p={c} gardee={mesGardees.has(c.id)} ville={ville} />
            ))}
          </div>
        </>
      ) : (
        <div className="vide">
          <h3>{cfg.active ? "Rien de neuf pour l'instant" : `${cfg.nom} n'est pas encore couverte`}</h3>
          <p>
            {cfg.active
              ? filtre
                ? "Aucune publication ne correspond à ce filtre en ce moment. Le fil ne garde que ce qui est encore vrai — revenez tout à l'heure."
                : "Le fil ne garde que ce qui est encore vrai aujourd'hui. Les commerçants publient au fil de la journée : revenez tout à l'heure."
              : "Aucun commerce n'a encore rejoint Le Direct ici. C'est en train de se construire, ville par ville."}
          </p>
        </div>
      )}
    </>
  );
}
