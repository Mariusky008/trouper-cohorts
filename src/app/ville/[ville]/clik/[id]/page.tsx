// L'ÉCRAN D'UN CLIK.
//
// On y arrive depuis le fil, et on doit pouvoir décider sans rien lire de plus.
// Trois choses, dans cet ordre :
//
//   1. CE QU'ON GAGNE — le prix barré, ou l'avantage. C'est la raison de rester.
//   2. OÙ EN EST LE GROUPE — la jauge et la phrase. C'est la raison d'appuyer
//      MAINTENANT plutôt que ce soir.
//   3. CE QU'ON RISQUE — rien, et il faut le dire. Le filet de sécurité est la
//      moitié de l'argument : si le groupe échoue, la place reste valable au
//      prix normal. Sans cette phrase, rejoindre ressemble à un pari.
//
// CE N'EST PAS UNE RÉSERVATION, et l'écran ne doit jamais le laisser croire.
// Tant qu'aucun plan de salle n'existe chez le commerçant, Clikme garantit LE
// TARIF, pas la table. Le mot « réserver » n'apparaît nulle part ici.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { configVille } from "@/lib/direct/ville";
import { habitantCourant } from "@/lib/direct/habitant";
import { campagneParId, maParticipation, etatDe, phraseClik, avancement, remise, manque } from "@/lib/direct/cliks";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { ActionClik } from "./action-clik";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ ville: string; id: string }> }): Promise<Metadata> {
  const { ville, id } = await params;
  const supabase = createAdminClient();
  const [cfg, c] = await Promise.all([configVille(supabase, ville), campagneParId(supabase, id)]);
  const title = c?.titre ? `${c.titre} · ${cfg.nom}` : `Le Direct de ${cfg.nom}`;
  return { title, description: c?.titre || "", openGraph: { title, type: "website" } };
}

export default async function ClikPage({ params }: { params: Promise<{ ville: string; id: string }> }) {
  const { ville, id } = await params;
  const supabase = createAdminClient();
  const [cfg, habitant, campagne] = await Promise.all([
    configVille(supabase, ville),
    habitantCourant(supabase),
    campagneParId(supabase, id),
  ]);
  if (!campagne) notFound();

  const participation = habitant ? await maParticipation(supabase, campagne.id, habitant.id) : null;
  const etat = etatDe(campagne);
  const part = avancement(campagne);
  const pct = remise(campagne);
  const fin = echeanceCourte(campagne.echeance);

  // « Dedans » couvre les trois statuts qui veulent dire la même chose pour
  // l'habitant : il n'a plus rien à faire. Les distinguer à l'écran
  // demanderait d'expliquer une machine d'états qui ne le regarde pas.
  const dedans = ["engage", "liste_attente", "confirme"].includes(participation?.statut ?? "");

  return (
    <>
      <header className="fhead">
        <div className="live"><span className="dot" aria-hidden="true" />{campagne.type === "collectif" ? "À plusieurs" : "Pour les premiers"}</div>
        <h1>{campagne.titre || "Une offre de la ville"}</h1>
        <div className="upd">
          {cfg.nom}
          {fin ? ` · ${fin}` : ""}
        </div>
      </header>

      <section className="ck">
        {/* ① CE QU'ON GAGNE */}
        {campagne.type === "collectif" && campagne.prixInitial != null && campagne.prixGroupe != null ? (
          <div className="ck-prix">
            <span className="ck-barre">{campagne.prixInitial.toFixed(2).replace(".", ",")} €</span>
            <span className="ck-net">{campagne.prixGroupe.toFixed(2).replace(".", ",")} €</span>
            {pct != null && <span className="ck-pct">−{pct} %</span>}
          </div>
        ) : null}

        {/* ② OÙ EN EST LE GROUPE */}
        <div className={`ck-etat ck-${etat}`}>
          <div className="ck-phrase">{phraseClik(campagne)}</div>
          <div className="ck-jauge" aria-hidden="true">
            <i style={{ width: `${Math.round(part * 100)}%` }} />
          </div>
          {campagne.type === "collectif" && campagne.objectif ? (
            <div className="ck-compte">
              {campagne.participants} sur {campagne.objectif}
              {manque(campagne) > 0 ? " personnes" : " — c'est atteint"}
            </div>
          ) : campagne.total != null ? (
            <div className="ck-compte">
              {campagne.restants} sur {campagne.total} encore disponibles
            </div>
          ) : null}
        </div>

        {/* CE QU'ON PEUT OBTENIR, avant d'appuyer.
            La séquence des avantages est figée et mélangée à la création : on ne
            peut donc pas promettre lequel on aura. Mais on peut dire ce qu'il y
            a dans le stock et à quelle condition — et il le faut. La condition
            d'achat découverte APRÈS avoir appuyé se lit comme un piège, alors
            que c'est la règle qui rend l'opération tenable pour le commerce. */}
        {campagne.type === "cadeau" && !participation?.libelle && campagne.aGagner.length > 0 && etat !== "epuise" && (
          <div className="ck-pool">
            <div className="ck-pool-t">{campagne.aGagner.length > 1 ? "Un avantage parmi" : "Ce qui vous attend"}</div>
            <ul className="ck-pool-l">
              {campagne.aGagner.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            {campagne.conditions.length > 0 && (
              <div className="ck-pool-c">
                Valable {campagne.conditions.join(" ou ")}.
              </div>
            )}
          </div>
        )}

        {/* L'avantage obtenu est affiché par `ActionClik`, et par lui seul —
            qu'il vienne du serveur (on revient sur la page) ou de la réponse
            au clic (on vient d'appuyer). Deux blocs pour la même chose se
            retrouvaient tous les deux à l'écran après le rafraîchissement. */}
        <ActionClik
          campagneId={campagne.id}
          ville={ville}
          type={campagne.type}
          etat={etat}
          dejaDedans={dedans}
          statutInitial={participation?.statut ?? null}
          gainInitial={
            participation?.libelle
              ? { libelle: participation.libelle, condition: participation.conditionAchat ?? "" }
              : null
          }
        />

        {/* ③ CE QU'ON RISQUE — c'est-à-dire rien, et ça se dit. */}
        {campagne.type === "collectif" && (
          <p className="ck-filet">
            Si le groupe n&apos;est pas complet à temps, votre place reste valable au prix
            habituel. Rejoindre ne vous engage à rien de plus que d&apos;y aller.
          </p>
        )}
        <p className="ck-note">
          Clikme vous garantit le tarif, pas une table réservée&nbsp;: présentez-vous
          au commerce comme d&apos;habitude.
        </p>

        <Link href={`/ville/${ville}`} className="ck-retour">← Retour au Direct</Link>
      </section>
    </>
  );
}
