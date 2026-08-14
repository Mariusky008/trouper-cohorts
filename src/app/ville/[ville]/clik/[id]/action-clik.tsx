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

type Etat = "ouverte" | "presque" | "complete" | "epuise" | "terminee";

export function ActionClik({
  campagneId,
  ville,
  type,
  etat,
  dejaDedans,
  statutInitial,
  gainInitial,
}: {
  campagneId: string;
  ville: string;
  type: "cadeau" | "collectif";
  etat: Etat;
  dejaDedans: boolean;
  statutInitial: string | null;
  /** L'avantage déjà obtenu, connu du serveur quand on revient sur la page. */
  gainInitial: { libelle: string; condition: string } | null;
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

  // Déjà dedans : on ne propose plus rien, on confirme. Laisser le bouton
  // actif inviterait à réappuyer, et un second appel ne peut que renvoyer la
  // même chose — l'écran donnerait l'impression de ne pas avoir enregistré.
  if (dedans) {
    return (
      <div className="ck-fait">
        <div className="ck-fait-t">
          {statut === "liste_attente"
            ? "Vous êtes en liste d'attente"
            : gagne
              ? "C'est à vous"
              : "Vous en êtes"}
        </div>
        {gagne && (
          <div className="ck-fait-g">
            {gagne.libelle}
            {gagne.condition ? <span> · valable {gagne.condition}</span> : null}
          </div>
        )}
        <div className="ck-fait-s">
          {statut === "liste_attente"
            ? "Le groupe est complet. Si quelqu'un se désiste, la place est pour vous et vous serez prévenu."
            : type === "collectif"
              ? "Vous serez prévenu dès que le groupe est au complet."
              : "Présentez-vous au commerce, votre avantage vous y attend."}
        </div>
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
        {envoi ? "Un instant…" : type === "cadeau" ? "Je prends" : "J'en suis"}
      </button>
      {message && <div className="ck-msg">{message}</div>}
    </>
  );
}
