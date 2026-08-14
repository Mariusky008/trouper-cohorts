// ÉCRAN 2 — À SAISIR.
//
// Deux missions strictement distinctes, et c'est le point le plus important de
// toute l'application :
//
//   Le Direct  · tout ce qui se passe dans ma ville · exhaustif · chronologique
//   À saisir   · ce que Clikme a sélectionné pour moi · 8 cartes max · pertinence
//
// Si l'habitant ne perçoit pas la différence entre les deux onglets,
// l'architecture a échoué. Le titre, le compteur « x sur 8 » et le plein écran
// sont là pour la rendre évidente.
//
// Le tri est celui de la règle de dégradation : sans signal personnel, ce qui
// expire le plus tôt, puis le plus proche, puis le plus récent. C'est déjà utile
// et honnête. La personnalisation s'ajoutera sans changer cet écran.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { filDeVille, noterAffichages } from "@/lib/direct/publications";
import { calculerPouls, selection, repereSpatial } from "@/lib/direct/degradation";
import { configVille } from "@/lib/direct/ville";
import { habitantCourant, gardees, suivis } from "@/lib/direct/habitant";
import { ilYA } from "@/lib/site-internet/collectif";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { presse } from "@/lib/direct/fil";
import { cliksDeVille, faconsParPublication } from "@/lib/direct/cliks";
import { faconsVue } from "@/lib/direct/facons-vue";
import { reactionsDesPublications } from "@/lib/direct/reactions";
import type { CarteVue } from "../_ui/carte";
import { SelectionSwipe } from "./selection-swipe";
import { StylesSwipe } from "./styles-swipe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const cfg = await configVille(createAdminClient(), ville);
  return { title: `À saisir — ${cfg.nom}`, robots: { index: false } };
}

export default async function ASaisirPage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const supabase = createAdminClient();
  const [cfg, habitant] = await Promise.all([configVille(supabase, ville), habitantCourant(supabase)]);

  const duJour = await filDeVille(supabase, cfg.slug);
  const large = calculerPouls(duJour, { seuil: cfg.seuilCompteur, ville: cfg.nom }).fenetreLarge;
  const publications = large ? await filDeVille(supabase, cfg.slug, { fenetreLarge: true }) : duJour;

  const [mesGardees, mesSuivis] = habitant
    ? await Promise.all([gardees(supabase, habitant.id), suivis(supabase, habitant.id)])
    : [new Set<string>(), []];

  // Les signaux personnels n'entrent que s'ils existent. Ils déplacent le
  // classement, ils ne remplacent pas le socle objectif.
  const choisies = selection(publications, {
    suivis: new Set(mesSuivis.map((s) => s.siteId)),
    categories: habitant?.categories.length ? new Set(habitant.categories) : undefined,
  });

  // Seules les huit retenues comptent, pas tout le fil relu pour les choisir.
  void noterAffichages(supabase, choisies);

  // Les façons des annonces retenues : sans les prix, on glisse au hasard.
  const cliksParPub = faconsParPublication(await cliksDeVille(supabase, cfg.slug));

  const ctx = { moi: null, quartierHabitant: habitant?.quartier, ville: cfg.nom };
  // Les réactions des annonces affichées, en UNE lecture : une requête par
  // carte multiplierait les allers-retours par le nombre d'annonces.
  const reacts = await reactionsDesPublications(supabase, choisies.map((p) => p.id), habitant?.id ?? null);

  const cartes: CarteVue[] = choisies.map((p) => ({
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
    // LES FAÇONS S'AFFICHENT ICI AUSSI, mais SANS LIEN : la carte se manipule
    // au glissement, et une bande cliquable posée dedans se déclencherait à
    // chaque geste raté. On montre les prix — sans eux on glisse au hasard —
    // et le glissement vers le haut reste le seul geste qui engage.
    facons: faconsVue(cliksParPub.get(p.id)),
    reste: p.reste,
    ardoise: p.ardoise,
    reactions: reacts.get(p.id) ?? { compte: {}, miennes: [] },
  }));

  return (
    <>
      <StylesSwipe />
      {cartes.length > 0 ? (
        <SelectionSwipe
          cartes={cartes}
          ville={ville}
          villeNom={cfg.nom}
          gardeesInitiales={cartes.filter((c) => mesGardees.has(c.id)).map((c) => c.id)}
        />
      ) : (
        <div className="asx-fin">
          <h2>Rien à saisir pour l&apos;instant</h2>
          <p>
            La sélection ne retient que ce qui est encore vrai maintenant à {cfg.nom}. Dès qu&apos;un commerçant
            publie une place, une offre ou un événement, il apparaît ici.
          </p>
        </div>
      )}
    </>
  );
}
