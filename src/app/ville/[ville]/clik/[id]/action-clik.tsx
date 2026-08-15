"use client";

// LE BOUTON QUI ENGAGE.
//
// Un seul, et il dit ce qu'il fait. « Participer » ne veut rien dire ; « J'en
// suis » et « Je prends » disent l'engagement à la première personne, ce qui
// est exactement ce qui se passe.
//
// PAS D'OPTIMISME ICI, contrairement au ♥ du fil. Le cœur peut s'allumer avant
// la réponse parce qu'il n'engage que soi et qu'un échec se rattrape en
// silence. Rejoindre un groupe, non : la base peut répondre « liste d'attente »
// ou « complet », et afficher « vous en êtes » avant de savoir reviendrait à
// promettre une place qu'on n'a peut-être pas. On attend, et on le montre.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecapCommerce } from "./recap";
import type { CommerceVue } from "@/lib/direct/commerce-vue";
import { conditionPhrase } from "@/lib/direct/condition-achat";
import { LaisserContact } from "./contact";

type Etat = "ouverte" | "presque" | "complete" | "epuise" | "terminee";

export function ActionClik({
  campagneId,
  ville,
  villeNom,
  type,
  etat,
  dejaDedans,
  statutInitial,
  gainInitial,
  codeInitial,
  commerce,
  contact,
}: {
  campagneId: string;
  ville: string;
  /** Le nom lisible de la ville — dernier repère spatial quand on n'a ni
   *  position accordée ni quartier. */
  villeNom: string;
  type: "simple" | "cadeau" | "express" | "collectif";
  etat: Etat;
  dejaDedans: boolean;
  statutInitial: string | null;
  /** L'avantage déjà obtenu, connu du serveur quand on revient sur la page. */
  gainInitial: { libelle: string; condition: string } | null;
  /** Le code, quand le serveur le connaît déjà (on revient sur la page). */
  codeInitial: string | null;
  /** Où se rendre. `null` quand la fiche du commerce est introuvable — on
   *  n'invente pas une adresse. */
  commerce: CommerceVue | null;
  /** Ce que la personne a déjà laissé, s'il y a lieu. On ne le redemande pas. */
  contact: { prenom: string; telephone: string };
}) {
  const router = useRouter();
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState("");
  const [dedans, setDedans] = useState(dejaDedans);
  const [statut, setStatut] = useState(statutInitial);
  /** L'avantage obtenu — LE SEUL ENDROIT qui l'affiche.
   *
   *  Il vient soit du serveur (on revient sur la page), soit de la réponse au
   *  clic. Pris de la réponse, il s'affiche sans attendre le rafraîchissement :
   *  c'est la seconde qui porte toute la mécanique, et « Vous en êtes » sans
   *  dire quoi, le temps qu'une requête revienne, transforme le moment de la
   *  récompense en écran de chargement. */
  const [gagne, setGagne] = useState(gainInitial);
  /** Le code à présenter, renvoyé par le serveur au moment de l'engagement. */
  const [code, setCode] = useState(codeInitial);

  // Déjà dedans : on ne propose plus rien, on confirme. Laisser le bouton
  // actif inviterait à réappuyer, et un second appel ne peut que renvoyer la
  // même chose — l'écran donnerait l'impression de ne pas avoir enregistré.
  if (dedans) {
    const attente = statut === "liste_attente";
    return (
      <div className="ck-fait">
        {/* UNE PASTILLE PLEINE, ET CENTRÉE. C'est le seul moment où
            l'application a quelque chose à célébrer, et elle le faisait dans un
            encart de la taille d'un message d'erreur. */}
        <div className={`ck-sl s-${type}`} aria-hidden="true">{attente ? "⏳" : "✓"}</div>
        <div className="ck-fait-k">{attente ? "En liste d'attente" : "C'est confirmé"}</div>
        <div className="ck-fait-t">
          {attente ? "Vous êtes en liste d'attente" : gagne ? "C'est à vous" : "Vous en êtes"}
        </div>
        {gagne && (
          <div className="ck-fait-g">
            {gagne.libelle}
            {/* La phrase complète, pas « valable » + ce qu'il a tapé : il a
                tapé « 12 », et cet écran affichait « valable 12 » — juste après
                que quelqu'un se soit engagé, c'est-à-dire au pire moment. */}
            {gagne.condition ? <span>{conditionPhrase(gagne.condition)}</span> : null}
          </div>
        )}
        <div className="ck-fait-s">
          {attente
            ? "Le groupe est complet. Si quelqu'un se désiste, la place est pour vous et vous serez prévenu."
            : type === "collectif"
              ? "Vous serez prévenu dès que le groupe est au complet."
              : type === "express"
                ? "Venez avant l'heure indiquée et annoncez-vous : le prix réduit est à vous."
                : type === "simple"
                  ? "Le créneau est à vous. Présentez-vous au commerce à l'heure prévue."
                  : "Présentez-vous au commerce, votre avantage vous y attend."}
        </div>
        {/* LE CODE À PRÉSENTER. Sans lui, « c'est confirmé » n'est qu'une
            promesse à l'écran : le commerçant n'a rien à quoi se raccrocher
            quand la personne se présente. */}
        {code && !attente && (
          <div className="ck-code"><i />Code <b>{code}</b></div>
        )}
        {/* OÙ SE RENDRE. Le code s'adresse au commerçant ; ces quatre lignes
            s'adressent à celui qui vient. Sans elles, on repartait d'ici avec
            une confirmation et aucune idée d'où aller.

            Affiché aussi en liste d'attente : la place peut se libérer d'un
            instant à l'autre, et c'est justement à ce moment-là qu'on n'a plus
            le temps de chercher l'adresse. */}
        {commerce && <RecapCommerce commerce={commerce} villeNom={villeNom} />}
        {/* COMMENT VOUS JOINDRE — proposé ici et nulle part avant. L'écran
            promettait « vous serez prévenu » sans que personne ne demande
            jamais comment : le commerçant n'avait aucun contact, et la
            promesse ne pouvait pas être tenue. Facultatif : refuser ne retire
            rien à la place déjà obtenue. */}
        <LaisserContact dejaPrenom={contact.prenom} dejaTel={contact.telephone} />
      </div>
    );
  }

  if (etat === "terminee" || etat === "epuise") {
    return (
      <div className="ck-fini">
        {etat === "epuise" ? "Tout est parti." : "Cette opération est terminée."}{" "}
        <a href={`/ville/${ville}`}>Voir ce qui se passe maintenant →</a>
      </div>
    );
  }

  const agir = async () => {
    if (envoi) return;
    setEnvoi(true);
    setMessage("");
    try {
      const r = await fetch("/api/direct/clik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Le cadeau puise dans un stock ; l'express et le groupe enregistrent
        // un engagement. C'est la seule différence de chemin entre les trois.
        body: JSON.stringify({ campagneId, ville, action: type === "cadeau" ? "prendre" : "rejoindre" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMessage("Impossible d'enregistrer pour l'instant. Réessayez dans un instant.");
        return;
      }
      if (j.ok) {
        setDedans(true);
        setStatut(String(j.etat ?? "engage"));
        if (j.libelle) setGagne({ libelle: String(j.libelle), condition: String(j.conditionAchat ?? "") });
        if (j.code) setCode(String(j.code));
        // Le compteur du groupe a changé pour tout le monde : on rafraîchit les
        // données du serveur pour que la jauge au-dessus dise la vérité, sans
        // recharger la page ni perdre l'état de ce composant.
        router.refresh();
        return;
      }
      setMessage(String(j.phrase || "Ce n'est plus possible."));
      router.refresh();
    } catch {
      setMessage("Connexion perdue. Réessayez dans un instant.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <button type="button" className="ck-b" onClick={agir} disabled={envoi} aria-busy={envoi}>
        {envoi
          ? "Un instant…"
          : type === "cadeau"
            ? "Je prends"
            : type === "express"
              ? "J'y vais tout de suite"
              : type === "simple"
                ? "Je prends le créneau"
                : "J'en suis"}
      </button>
      {message && <div className="ck-msg">{message}</div>}
    </>
  );
}
