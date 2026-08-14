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
