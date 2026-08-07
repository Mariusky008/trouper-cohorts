// ÉCRAN 4 — MOI.
//
// Trois groupes : ce que je reçois, ce qui m'intéresse, mon compte.
//
// Aucun compte n'est obligatoire pour consulter Le Direct : cet écran s'affiche
// même sans identité, et propose alors de recevoir le résumé plutôt que de
// bloquer. La désinscription est immédiate, sans confirmation ni rétention ; la
// seule confirmation de l'écran porte sur la suppression des données, parce
// qu'elle est la seule chose irréversible.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { configVille, villeSlug } from "@/lib/direct/ville";
import { habitantCourant } from "@/lib/direct/habitant";
import { consentPhrase } from "@/lib/site-internet/ville-mail";
import { resolveMetier } from "@/lib/site-internet/metier-profiles";
import {
  ReglagesCanaux,
  PanneauCategories,
  PanneauSecteur,
  PanneauHoraires,
  PanneauAdresse,
  PanneauDonnees,
  SeDesabonner,
} from "./reglages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const cfg = await configVille(createAdminClient(), ville);
  return { title: `Moi — Le Direct de ${cfg.nom}`, robots: { index: false } };
}

/**
 * Les catégories proposées sont celles qui EXISTENT dans cette ville.
 *
 * Une liste de métiers en dur proposerait « Fleuriste » à une ville qui n'en a
 * pas : la personne le coche, ne reçoit rien, et en conclut que l'application ne
 * marche pas. Mieux vaut une liste courte et vraie.
 */
async function categoriesDeLaVille(
  supabase: ReturnType<typeof createAdminClient>,
  slug: string
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("city, activite")
      .eq("channel", "letter")
      .eq("published", true)
      .limit(500);
    const vus = new Set<string>();
    for (const r of (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>) {
      if (villeSlug(str(r.city)) !== slug) continue;
      const label = resolveMetier(str(r.activite)).entry?.label;
      if (label) vus.add(label);
    }
    return Array.from(vus).sort((a, b) => a.localeCompare(b, "fr"));
  } catch {
    return [];
  }
}

export default async function MoiPage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const supabase = createAdminClient();
  const [cfg, habitant] = await Promise.all([configVille(supabase, ville), habitantCourant(supabase)]);
  const categories = await categoriesDeLaVille(supabase, cfg.slug);

  const prenom = habitant?.prenom || "";
  const initiale = (prenom || cfg.nom).charAt(0).toUpperCase();
  // Une adresse ne s'affiche jamais en clair sur un écran qu'on peut consulter
  // par-dessus l'épaule.
  const emailMasque = habitant?.email
    ? habitant.email.replace(/^(.).*(.)@/, (_m, a, b) => `${a}••••${b}@`)
    : "";

  return (
    <>
      <header className="prof">
        <div className="av" aria-hidden="true">{initiale}</div>
        <div className="nm">{prenom || "Bonjour"}</div>
        <div className="sb">
          {habitant
            ? `${habitant.confirme ? "Abonné au Direct" : "Sur cet appareil"}${habitant.quartier ? ` · ${habitant.quartier}` : ` · ${cfg.nom}`}`
            : `Vous lisez Le Direct de ${cfg.nom} sans compte`}
        </div>
      </header>

      <div className="grp">Ce que je reçois</div>
      <ReglagesCanaux
        actif={Boolean(habitant?.email)}
        initial={{
          recoitResume: habitant?.recoitResume ?? true,
          recoitAlertes: habitant?.recoitAlertes ?? true,
          recoitSuivis: habitant?.recoitSuivis ?? true,
          recoitVilleInfos: habitant?.recoitVilleInfos ?? false,
        }}
      />

      <div className="grp">Ce qui m&apos;intéresse</div>
      <PanneauCategories disponibles={categories} initial={habitant?.categories ?? []} />
      <PanneauSecteur
        quartiers={cfg.quartiers}
        quartierInitial={habitant?.quartier ?? ""}
        rayonInitial={habitant?.rayonM ?? 2000}
        ville={cfg.nom}
      />
      <PanneauHoraires avantInitial={habitant?.silenceAvant ?? 9} apresInitial={habitant?.silenceApres ?? 20} />

      <div className="grp">Mon compte</div>
      <PanneauAdresse
        emailMasque={emailMasque}
        ville={ville}
        villeNom={cfg.nom}
        phraseConsentement={consentPhrase(cfg.nom)}
      />
      <PanneauDonnees />
      {habitant ? <SeDesabonner ville={ville} /> : null}

      <div style={{ height: 20 }} />
    </>
  );
}
