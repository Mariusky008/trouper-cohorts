"use client";

// La carte du fil.
//
// Sa première ligne porte les trois marqueurs — distance, fraîcheur, échéance —
// et c'est le seul détail de mise en page qui compte vraiment ici : c'est cette
// ligne qui donne la sensation qu'il se passe quelque chose maintenant, près de
// soi. En pied, elle ne serait lue qu'après avoir décidé, c'est-à-dire jamais.
//
// Le ♥ est optimiste : il s'allume avant la réponse du serveur et se rétracte si
// l'appel échoue. Un cœur qui met 400 ms à répondre ne se reclique pas, il se
// re-tape — et on se retrouve avec deux appels et un état faux.
import { useState, useTransition } from "react";
import Link from "next/link";
import { FAMILLE_LABEL, type Famille } from "@/lib/direct/publications";

export type CarteVue = {
  id: string;
  famille: Famille;
  texte: string;
  photo: string | null;
  lien: string | null;
  auteurNom: string;
  auteurMetier: string;
  auteurSlug: string;
  /** Déjà formatés côté serveur : le fuseau du serveur fait foi, et un rendu
   *  client divergent provoquerait une erreur d'hydratation à chaque carte. */
  repere: string;
  fraicheur: string;
  echeance: string;
};

export function Carte({
  p,
  gardee,
  ville,
  action = "garder",
}: {
  p: CarteVue;
  gardee: boolean;
  ville: string;
  /** « garder » sur le fil, « retirer » dans Mes commerces. */
  action?: "garder" | "retirer";
}) {
  const [on, setOn] = useState(gardee);
  const [, demarrer] = useTransition();

  const basculer = async () => {
    const vise = !on;
    setOn(vise); // optimiste
    try {
      const r = await fetch("/api/direct/garder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicationId: p.id, ville, garder: vise }),
      });
      if (!r.ok) throw new Error(String(r.status));
      demarrer(() => {});
    } catch {
      setOn(!vise); // l'appel a échoué : on ne laisse pas un état faux à l'écran
    }
  };

  // `apercu` est la boutique publique du commerce. `/site-internet/${slug}` sans
  // `apercu` est la landing de PROSPECTION (cible du QR de la lettre) : y envoyer
  // un habitant lui proposerait de faire refaire son site.
  // `via=direct` : même convention d'attribution que le lien du résumé quotidien.
  const fiche = p.auteurSlug ? `/site-internet/apercu/${p.auteurSlug}?via=direct` : null;

  return (
    <article className="post">
      <div className="meta">
        {p.repere ? <span className="dist">{p.repere}</span> : null}
        {p.repere && p.fraicheur ? <span className="sep">·</span> : null}
        {p.fraicheur ? <span className="fresh">{p.fraicheur}</span> : null}
        {p.echeance ? <span className="sep">·</span> : null}
        {p.echeance ? <span className="left">{p.echeance}</span> : null}
        <span className={`kind k-${p.famille}`}>{FAMILLE_LABEL[p.famille]}</span>
      </div>

      {fiche ? (
        <Link href={fiche} className="ph" prefetch={false}>
          <span className="pav" aria-hidden="true">{p.auteurNom.charAt(0).toUpperCase()}</span>
          <span>
            <span className="pn" style={{ display: "block" }}>{p.auteurNom}</span>
            {p.auteurMetier ? <span className="pm">{p.auteurMetier}</span> : null}
          </span>
        </Link>
      ) : (
        <div className="ph">
          <span className="pav" aria-hidden="true">{p.auteurNom.charAt(0).toUpperCase()}</span>
          <span>
            <span className="pn" style={{ display: "block" }}>{p.auteurNom}</span>
            {p.auteurMetier ? <span className="pm">{p.auteurMetier}</span> : null}
          </span>
        </div>
      )}

      <p className="pb">{p.texte}</p>
      {p.photo ? <div className="pimg" style={{ backgroundImage: `url(${JSON.stringify(p.photo)})` }} role="presentation" /> : null}

      <div className="pf">
        {fiche ? (
          <Link href={fiche} className="act gh" prefetch={false}>La boutique</Link>
        ) : p.lien ? (
          <a className="act gh" href={p.lien} target="_blank" rel="noreferrer noopener">En savoir plus</a>
        ) : null}
        <button
          type="button"
          className={`coeur${on ? " on" : ""}`}
          onClick={basculer}
          aria-pressed={on}
          aria-label={on ? "Retirer de mes gardées" : "Garder"}
          title={action === "retirer" ? "Retirer" : "Garder"}
        >
          {on ? "♥" : "♡"}
        </button>
      </div>
    </article>
  );
}
