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
import { campagneParId, maParticipation, etatDe, phraseClik, avancement, remise, FACON_LABEL } from "@/lib/direct/cliks";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { ActionClik } from "./action-clik";
import { codeDe } from "@/lib/direct/code-bon";

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

/** La même icône que sur la ligne du fil : c'est ce qui dit qu'on est bien
 *  arrivé sur la porte qu'on a poussée. */
const ICONE: Record<string, string> = { simple: "🕐", cadeau: "🎁", express: "⚡", collectif: "👥" };

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
        {/* UN SEUL BLOC, DE LA COULEUR DE LA FAÇON. L'écran empilait des
            encarts blancs : rien ne rappelait sur quelle porte on venait
            d'appuyer, et les trois façons se ressemblaient une fois dedans. */}
        <div className={`ck-blk b-${campagne.type}`}>
          <div className="ck-hh">
            <span className="ck-ic" aria-hidden="true">{ICONE[campagne.type]}</span>
            <div>
              <div className="ck-pr">
                {campagne.prixGroupe != null
                  ? euro(campagne.prixGroupe)
                  : campagne.prixInitial != null
                    ? euro(campagne.prixInitial)
                    : "Prix habituel"}
                {/* Le prix barré n'apparaît QUE s'il baisse vraiment. Barré
                    sur un cadeau, il ferait croire à une remise qui n'existe
                    pas — le cadeau se prend au prix normal. */}
                {campagne.prixGroupe != null && campagne.prixInitial != null && (
                  <span className="ck-old">{euro(campagne.prixInitial)}</span>
                )}
              </div>
              <div className="ck-nm">
                {campagne.nom || FACON_LABEL[campagne.type]}
                {pct != null ? ` · −${pct} %` : ""}
              </div>
            </div>
          </div>

          <h2>{campagne.titre || "Une offre de la ville"}</h2>
          <p>{phraseClik(campagne)}</p>

          {/* CE QU'ON PEUT OBTENIR, avant d'appuyer. La séquence est figée et
              mélangée : on ne peut pas promettre lequel on aura, mais on peut
              dire ce qu'il reste et à quelle condition — et il le faut. Une
              condition d'achat découverte APRÈS le clic se lit comme un piège,
              alors que c'est elle qui rend l'opération tenable. */}
          {campagne.type === "cadeau" && !participation?.libelle && campagne.aGagner.length > 0 && etat !== "epuise" && (
            <div className="ck-pool">
              <div className="ck-pool-t">{campagne.aGagner.length > 1 ? "Un avantage parmi" : "Ce qui vous attend"}</div>
              <ul className="ck-pool-l">
                {campagne.aGagner.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              {campagne.conditions.length > 0 && (
                <div className="ck-pool-c">{conditionLisible(campagne.conditions)}</div>
              )}
            </div>
          )}

          {/* LE GROUPE EN PASTILLES. « 2 sur 4 » est un chiffre ; deux ronds
              pleins et deux vides sont un groupe qu'il manque deux personnes à
              finir. Même donnée, autre envie. */}
          {campagne.type === "collectif" && campagne.objectif ? (
            <>
              <div className="ck-pp" aria-hidden="true">
                {Array.from({ length: Math.min(campagne.objectif, 12) }, (_, i) => (
                  <i key={i} className={i < campagne.participants ? "" : "vide"}>
                    {i < campagne.participants ? "✓" : "?"}
                  </i>
                ))}
              </div>
              <div className="ck-jauge" aria-hidden="true">
                <i style={{ width: `${Math.round(part * 100)}%` }} />
              </div>
            </>
          ) : campagne.total != null ? (
            <div className="ck-when">
              <span className="w1">Il en reste</span>
              <span className="w2">{campagne.restants} sur {campagne.total}</span>
            </div>
          ) : null}

          {/* L'ÉCHÉANCE DANS SON PROPRE ENCADRÉ : en ligne de texte parmi
              d'autres, elle se lisait après avoir décidé, c'est-à-dire jamais.
              C'est pourtant la seule contrainte à retenir. */}
          {fin && (
            <div className="ck-when">
              <span className="w1">{campagne.type === "express" ? "Vous devez arriver" : "Jusqu'à"}</span>
              {/* `echeanceCourte` rend déjà « jusqu'à 18 h 53 » : sous une
                  étiquette « JUSQU'À », ça donnait « jusqu'à jusqu'à ». */}
              <span className="w2">{fin.replace(/^jusqu.à\s*/i, "")}</span>
            </div>
          )}

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
            // Le même calcul que la route, pour que le code survive à un
            // rechargement : sans lui, revenir sur la page effacerait ce que le
            // commerçant doit retrouver.
            codeInitial={dedans && habitant ? codeDe(campagne.id, habitant.id) : null}
          />
        </div>

        {/* CE QU'ON RISQUE — c'est-à-dire rien, et ça se dit. Le filet de
            sécurité est la moitié de l'argument : sans lui, rejoindre
            ressemble à un pari. */}
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
