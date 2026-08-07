// ÉCRAN 4 — MOI.
//
// Trois groupes : ce que je reçois, ce qui m'intéresse, mon compte.
//
// Aucun compte n'est obligatoire pour consulter Le Direct : cet écran s'affiche
// même sans identité, et propose alors de recevoir le résumé plutôt que de
// bloquer. La désinscription est immédiate, sans confirmation ni écran de
// rétention.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { configVille } from "@/lib/direct/ville";
import { habitantCourant } from "@/lib/direct/habitant";
import { ReglagesCanaux, SeDesabonner } from "./reglages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const cfg = await configVille(createAdminClient(), ville);
  return { title: `Moi — Le Direct de ${cfg.nom}`, robots: { index: false } };
}

/** « jusqu'à 2 km » · « jusqu'à 800 m ». */
const rayonLisible = (m: number) => (m >= 1000 ? `jusqu'à ${(m / 1000).toFixed(m % 1000 ? 1 : 0).replace(".", ",")} km` : `jusqu'à ${m} m`);

export default async function MoiPage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const supabase = createAdminClient();
  const [cfg, habitant] = await Promise.all([configVille(supabase, ville), habitantCourant(supabase)]);

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
      <div className="row">
        <span className="ic" aria-hidden="true">◈</span>
        <div>
          <div className="t">Mes catégories</div>
          <div className="s">{habitant?.categories.length ? habitant.categories.join(" · ") : "Toutes pour l'instant"}</div>
        </div>
        <span className="go" aria-hidden="true">›</span>
      </div>
      <div className="row">
        <span className="ic" aria-hidden="true">⌖</span>
        <div>
          <div className="t">Mon secteur</div>
          <div className="s">
            {habitant?.quartier ? `${habitant.quartier} · ` : `${cfg.nom} · `}
            {rayonLisible(habitant?.rayonM ?? 2000)}
          </div>
        </div>
        <span className="go" aria-hidden="true">›</span>
      </div>
      <div className="row">
        <span className="ic" aria-hidden="true">◷</span>
        <div>
          <div className="t">Mes horaires</div>
          <div className="s">
            Ne pas déranger avant {habitant?.silenceAvant ?? 9} h et après {habitant?.silenceApres ?? 20} h
          </div>
        </div>
        <span className="go" aria-hidden="true">›</span>
      </div>

      <div className="grp">Mon compte</div>
      <div className="row">
        <span className="ic" aria-hidden="true">✉</span>
        <div>
          <div className="t">Mon adresse</div>
          <div className="s">
            {emailMasque || "Aucune — vous pouvez tout consulter sans en donner"}
          </div>
        </div>
        <span className="go" aria-hidden="true">›</span>
      </div>
      <div className="row">
        <span className="ic" aria-hidden="true">⛉</span>
        <div>
          <div className="t">Mes données</div>
          <div className="s">Voir, exporter ou tout supprimer</div>
        </div>
        <span className="go" aria-hidden="true">›</span>
      </div>
      {habitant ? <SeDesabonner ville={ville} /> : null}

      <div style={{ height: 20 }} />
    </>
  );
}
