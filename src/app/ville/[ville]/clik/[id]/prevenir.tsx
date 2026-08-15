"use client";

// PRÉVENIR LE COMMERCE — le bouton qui rend la réservation réelle.
//
// C'est le geste le plus important de tout le parcours, et il est aussi le plus
// simple : on ouvre WhatsApp avec le message déjà écrit, le client appuie sur
// envoyer. Rien à installer, rien à payer, et ça arrive à coup sûr.
//
// IL RESTE APRÈS L'ENVOI. Le client a pu fermer WhatsApp sans envoyer, ou vouloir
// relancer parce que personne ne répond : le bouton devient « Renvoyer » et ne
// disparaît jamais. On ne sait pas si le message est parti — c'est précisément
// pour ça qu'on laisse la possibilité de recommencer.
//
// ON N'ÉCRIT RIEN EN BASE À CE MOMENT. Enregistrer « prévenu » sur un clic
// serait un mensonge : le clic ouvre WhatsApp, il n'envoie rien. La seule
// vérité, c'est la réponse du commerçant — dans WhatsApp.
import { useState } from "react";

export function Prevenir({ lien, commerce }: { lien: string; commerce: string }) {
  const [ouvert, setOuvert] = useState(false);

  // Sans numéro, pas de bouton : mieux vaut ne rien proposer que d'ouvrir
  // WhatsApp sur le vide.
  if (!lien) return null;

  return (
    <div className="ck-wa">
      <a
        className="ck-wa-b"
        href={lien}
        target="_blank"
        rel="noreferrer noopener"
        onClick={() => setOuvert(true)}
      >
        <span aria-hidden="true">💬</span>
        {ouvert ? "Renvoyer le message" : `Prévenir ${commerce || "le commerce"}`}
      </a>
      <p className="ck-wa-s">
        {ouvert
          ? "Vérifiez que le message est bien parti dans WhatsApp. C'est sa réponse qui confirme votre place."
          : "Le message est déjà écrit — il ne reste qu'à l'envoyer. C'est ce qui garantit qu'on vous attend."}
      </p>
    </div>
  );
}
