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
import { usePosition } from "@/lib/direct/position";
import { distanceCourte, metresEntre } from "@/lib/direct/degradation";
import { VideoCarte } from "./video-carte";
import { teinte, initiales } from "./teinte";

export type CarteVue = {
  id: string;
  famille: Famille;
  texte: string;
  photo: string | null;
  /** Vidéo de l'annonce. La photo reste l'image d'affiche : elle s'affiche
   *  partout où la vidéo ne peut pas se lire (e-mail, aperçu de lien). */
  video: string | null;
  lien: string | null;
  auteurNom: string;
  auteurMetier: string;
  auteurSlug: string;
  /** Déjà formatés côté serveur : le fuseau du serveur fait foi, et un rendu
   *  client divergent provoquerait une erreur d'hydratation à chaque carte. */
  repere: string;
  /** Position du commerce, quand on l'a. Sert à remplacer le repère de repli par
   *  une distance réelle SI la personne a accordé la sienne. Le serveur rend
   *  toujours le repli : sans permission, l'écran est identique. */
  lat: number | null;
  lng: number | null;
  fraicheur: string;
  echeance: string;
  /** LES FAÇONS DE PROFITER DE L'ANNONCE, déjà résumées par le serveur, dans
   *  l'ordre d'affichage (du prix le plus haut au plus bas). Vide quand il n'y
   *  en a aucune, ou qu'elles sont toutes terminées. */
  facons: Array<{
    id: string;
    type: "simple" | "cadeau" | "express" | "collectif";
    /** « Le cadeau », « L'express », « Table à partager ». */
    label: string;
    /** Ce qu'on doit faire pour l'obtenir. */
    promesse: string;
    /** Le prix à payer avec cette façon, déjà mis en forme. */
    prix: string;
    /** La contrainte de temps, en clair : « Arrivée avant 12 h 47 ». */
    quand: string;
    /** « 2 / 4 déjà intéressés » — uniquement pour la table à partager. */
    compte: string;
    /** Avancement entre 0 et 1, pour la jauge. `null` sans jauge à montrer. */
    part: number | null;
    etat: "ouverte" | "presque" | "complete" | "epuise";
  }>;
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
  const moi = usePosition();

  // La distance ne remplace le repli que si les deux positions existent.
  const repere =
    moi && p.lat != null && p.lng != null
      ? distanceCourte(metresEntre(moi.lat, moi.lng, p.lat, p.lng))
      : p.repere;

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
  // `pub` transporte l'annonce qui a mené au clic : c'est ce qui permet de dire
  // au commerçant QUELLE offre a fonctionné, pas seulement qu'on est venu du
  // Direct. Compté à l'arrivée, donc sans aller-retour supplémentaire.
  const fiche = p.auteurSlug ? `/site-internet/apercu/${p.auteurSlug}?via=direct&pub=${p.id}` : null;

  return (
    <article className="post">
      {/* NIVEAU 1 — L'ENVIE. L'image occupe la tête de carte et porte le texte.
          Sans photo, un aplat teinté avec le nom du commerce : jamais de carte
          vide, et surtout jamais une photo de vitrine posée à côté d'un plat
          qu'elle ne montre pas — l'image doit dire ce que l'annonce dit. */}
      <div className="pic">
        {p.video ? (
          <VideoCarte src={p.video} poster={p.photo} alt={`Vidéo de ${p.auteurNom}`} />
        ) : p.photo ? (
          <div className="fond" style={{ backgroundImage: `url(${JSON.stringify(p.photo)})` }} role="presentation" />
        ) : (
          <div className="repli" style={{ background: teinte(p.auteurNom) }} aria-hidden="true">
            <span>{initiales(p.auteurNom)}</span>
          </div>
        )}
        <div className="voile" aria-hidden="true" />
        {repere ? <span className="bg">{repere}</span> : null}
        {p.echeance ? <span className="bd">{p.echeance}</span> : null}

        {/* NIVEAU 2 — LA DÉCISION, puis NIVEAU 3 — LA PREUVE : la fraîcheur.
            « il y a 4 min » est le signal qui sépare ce fil d'un annuaire. */}
        {fiche ? (
          <Link href={fiche} className="sur" prefetch={false}>
            <span className={`pastille k-${p.famille}`}>{FAMILLE_LABEL[p.famille]}</span>
            {p.fraicheur ? <span className="conf"><i />{p.fraicheur}</span> : null}
            <h3>{p.texte}</h3>
            <span className="qui">{p.auteurNom}{p.auteurMetier ? ` · ${p.auteurMetier}` : ""}</span>
          </Link>
        ) : (
          <div className="sur">
            <span className={`pastille k-${p.famille}`}>{FAMILLE_LABEL[p.famille]}</span>
            {p.fraicheur ? <span className="conf"><i />{p.fraicheur}</span> : null}
            <h3>{p.texte}</h3>
            <span className="qui">{p.auteurNom}{p.auteurMetier ? ` · ${p.auteurMetier}` : ""}</span>
          </div>
        )}
      </div>

      {/* COMMENT VOULEZ-VOUS EN PROFITER ?
          Les façons sont montrées ENSEMBLE, et c'est tout l'intérêt : c'est la
          descente des prix qui rend chacun compréhensible. Une seule façon à
          l'écran, l'habitant lit une remise ; les trois, il comprend qu'on lui
          propose un échange — payer moins contre venir vite, ou à plusieurs.
          Le commerce ne brade pas, il rémunère un comportement. */}
      {p.facons.length > 0 && (
        <div className="fac">
          {/* L'EN-TÊTE DÉPEND DE CE QU'IL Y A À CHOISIR.
              « Comment voulez-vous en profiter ? » devant une seule porte est
              une question sans objet — et pire, elle laisse croire qu'on cache
              les autres. Un créneau qui se libère n'a rien à comparer : il a
              une seule chose à faire, et on le dit comme ça. */}
          <div className="fac-h">
            <span className="fac-q">
              {p.facons.length > 1 ? "Comment voulez-vous en profiter ?" : "Une seule chose à faire"}
            </span>
            {p.facons.length > 1 && (
              <span className="fac-pr" aria-hidden="true">
                {p.facons.map((f) => f.prix).join(" → ")}
              </span>
            )}
          </div>
          {p.facons.map((f) => (
            <Link
              key={f.id}
              href={`/ville/${ville}/clik/${f.id}`}
              className={`fac-l fac-${f.type}${f.etat === "epuise" ? " fac-off" : ""}`}
              prefetch={false}
            >
              <span className="fac-ic" aria-hidden="true">
                {f.type === "cadeau" ? "🎁" : f.type === "express" ? "⚡" : f.type === "collectif" ? "👥" : "🕐"}
              </span>
              <span className="fac-c">
                <span className="fac-t">
                  <b>{f.prix}</b>
                  <em>{f.label}</em>
                </span>
                <span className="fac-s">{f.compte || f.promesse}</span>
                {f.quand && <span className="fac-q2">{f.quand}</span>}
                {f.part != null && (
                  <span className="fac-j" aria-hidden="true">
                    <i style={{ width: `${Math.round(f.part * 100)}%` }} />
                  </span>
                )}
              </span>
              <span className="fac-go" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      )}

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
