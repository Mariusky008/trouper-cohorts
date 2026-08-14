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
import { campagneParId, maParticipation, etatDe, phraseClik, avancement, remise, manque, FACON_LABEL } from "@/lib/direct/cliks";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { ActionClik } from "./action-clik";

/**
 * La condition d'achat, telle qu'on peut la lire.
 *
 * Le commerçant écrit ce qu'il veut. « dès 10 € d'achat » se préfixe bien par
 * « Valable » ; « 12 » donne « Valable 12. », qui ne veut rien dire. On ne
 * préfixe donc que si la phrase commence comme une condition — sinon on la
 * présente autrement, plutôt que de produire une phrase bancale.
 */
function conditionLisible(conditions: readonly string[]): string {
  const t = conditions.join(" ou ").trim();
  if (!t) return "";
  if (/^(d[eè]s|[àa] partir|pour|avec|sur|en cas|jusqu)/i.test(t)) return `Valable ${t}.`;
  // Un nombre seul est presque toujours un montant : on le dit comme tel.
  if (/^\d+([.,]\d+)?\s*€?$/.test(t)) return `Valable dès ${t.replace(/\s*€?$/, "")} € d'achat.`;
  return `Condition : ${t}.`;
}

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
  const euro = (v: number) => `${v.toFixed(2).replace(/[.,]00$/, "").replace(".", ",")} €`;

  // « Dedans » couvre les trois statuts qui veulent dire la même chose pour
  // l'habitant : il n'a plus rien à faire. Les distinguer à l'écran
  // demanderait d'expliquer une machine d'états qui ne le regarde pas.
  const dedans = ["engage", "liste_attente", "confirme"].includes(participation?.statut ?? "");

  return (
    <>
      <header className="fhead">
        {/* Le nom de la façon, pas une approximation : « Pour les premiers »
            s'affichait au-dessus d'un express, qui n'a aucun stock. Le nom
            choisi par le commerçant prime quand il en a donné un. */}
        <div className="live"><span className="dot" aria-hidden="true" />{campagne.nom || FACON_LABEL[campagne.type]}</div>
        <h1>{campagne.titre || "Une offre de la ville"}</h1>
        <div className="upd">
          {cfg.nom}
          {fin ? ` · ${fin}` : ""}
        </div>
      </header>

      <section className="ck">
        {/* ① CE QU'ON GAGNE — pour TOUTES les façons qui portent un prix.
            Le bloc était réservé au collectif : l'express annonçait « prix
            réduit si vous venez vite » sans jamais dire de combien, et le
            cadeau ne montrait pas ce qu'on paie. Une offre dont on cache le
            prix ne se compare à rien. */}
        {campagne.prixGroupe != null && campagne.prixInitial != null ? (
          <div className="ck-prix">
            <span className="ck-barre">{euro(campagne.prixInitial)}</span>
            <span className="ck-net">{euro(campagne.prixGroupe)}</span>
            {pct != null && <span className="ck-pct">−{pct} %</span>}
          </div>
        ) : campagne.prixInitial != null ? (
          // Le cadeau se prend au prix normal : on l'affiche seul, sans barré —
          // barrer un prix qui ne baisse pas serait un mensonge.
          <div className="ck-prix">
            <span className="ck-net">{euro(campagne.prixInitial)}</span>
            <span className="ck-plus">+ un cadeau</span>
          </div>
        ) : null}

        {/* ② OÙ EN EST LE GROUPE */}
        <div className={`ck-etat ck-${etat}`}>
          <div className="ck-phrase">{phraseClik(campagne)}</div>
          {/* Pas de jauge pour l'express ni « à prendre » : ils ne se
              remplissent pas. Une barre vide sous « prix réduit si vous venez
              vite » laissait croire qu'on attendait du monde. */}
          {(campagne.type === "collectif" || campagne.type === "cadeau") && (
            <div className="ck-jauge" aria-hidden="true">
              <i style={{ width: `${Math.round(part * 100)}%` }} />
            </div>
          )}
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
            {/* On ne préfixe QUE si la phrase du commerçant n'est pas déjà une
                condition complète. « Valable dès 10 € d'achat » se lit ;
                « Valable 12. » ne veut rien dire — et un commerçant tape « 12 »
                plus souvent qu'on ne le croit. */}
            {campagne.conditions.length > 0 && (
              <div className="ck-pool-c">{conditionLisible(campagne.conditions)}</div>
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
