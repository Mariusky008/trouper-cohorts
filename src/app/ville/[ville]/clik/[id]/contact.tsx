"use client";

// « POUR QU'ON PUISSE VOUS JOINDRE » — proposé après l'engagement, jamais avant.
//
// L'écran promettait « vous serez prévenu dès que le groupe est complet » et
// personne ne demandait jamais comment. Le commerçant n'avait aucun contact :
// la promesse ne pouvait pas être tenue.
//
// APRÈS LE GESTE, ET FACULTATIF. Un formulaire avant le clic tuerait le clic —
// c'est la règle de l'identité progressive, celle qui fait que garder une offre
// ne demande rien. Ici, la personne a déjà sa place ; on lui propose seulement
// d'être joignable, et refuser ne lui retire rien.
//
// REPLIÉ PAR DÉFAUT. Le moment de la confirmation appartient à la
// confirmation : deux champs ouverts juste sous « c'est confirmé » ramènent un
// formulaire là où on venait de célébrer quelque chose.
import { useState } from "react";

/** CE POUR QUOI ON SERA PRÉVENU, façon par façon.
 *
 *  « Laisser un numéro pour être prévenu » ne disait pas prévenu de QUOI —
 *  c'est-à-dire la seule chose qui donne une raison de le laisser. Chaque
 *  phrase décrit un évènement réel de cette façon-là, jamais une généralité. */
const POURQUOI: Record<string, { bouton: string; titre: string; detail: string }> = {
  collectif: {
    bouton: "Être prévenu quand le groupe est complet →",
    titre: "Pour vous prévenir quand le groupe est complet",
    detail:
      "C'est le moment où le prix se débloque — et celui où il faut venir. Sans numéro, nous n'avons aucun moyen de vous le dire.",
  },
  express: {
    bouton: "Laisser un numéro au commerce →",
    titre: "Pour que le commerce puisse vous joindre",
    detail: "S'il doit fermer plus tôt ou décaler, il vous prévient au lieu de vous laisser venir pour rien.",
  },
  cadeau: {
    bouton: "Laisser un numéro au commerce →",
    titre: "Pour que le commerce puisse vous joindre",
    detail: "S'il y a un imprévu sur votre avantage, il vous prévient plutôt que de vous l'annoncer sur place.",
  },
  simple: {
    bouton: "Laisser un numéro au commerce →",
    titre: "Pour que le commerce puisse vous joindre",
    detail: "Si le créneau bouge, il vous prévient. C'est le seul usage qui en sera fait.",
  },
};

export function LaisserContact({
  dejaPrenom,
  dejaTel,
  type,
}: {
  dejaPrenom: string;
  dejaTel: string;
  /** La façon prise : ce qu'on promet de signaler n'est pas le même. */
  type: string;
}) {
  const quoi = POURQUOI[type] ?? POURQUOI.simple;
  const [prenom, setPrenom] = useState(dejaPrenom);
  const [tel, setTel] = useState(dejaTel);
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [err, setErr] = useState("");
  const [enregistre, setEnregistre] = useState(Boolean(dejaTel || dejaPrenom));

  const envoyer = async () => {
    if (envoi) return;
    setEnvoi(true);
    setErr("");
    try {
      const r = await fetch("/api/direct/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom: prenom.trim(), telephone: tel.trim() }),
      });
      const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      if (!r.ok) {
        setErr(typeof j.error === "string" ? j.error : "Enregistrement impossible.");
        return;
      }
      setEnregistre(true);
      setOuvert(false);
    } catch {
      setErr("Connexion perdue. Réessayez dans un instant.");
    } finally {
      setEnvoi(false);
    }
  };

  if (enregistre && !ouvert) {
    return (
      <div className="ck-ct ok">
        <span>✓ Le commerce peut vous joindre{prenom ? `, ${prenom}` : ""}.</span>
        <button type="button" onClick={() => setOuvert(true)}>Modifier</button>
      </div>
    );
  }

  if (!ouvert) {
    return (
      <button type="button" className="ck-ct-go" onClick={() => setOuvert(true)}>
        {quoi.bouton}
      </button>
    );
  }

  return (
    <div className="ck-ct">
      <div className="ck-ct-t">{quoi.titre}</div>
      <div className="ck-ct-s">
        {quoi.detail} Facultatif, et pour ce commerce uniquement&nbsp;: votre place est déjà à vous.
      </div>
      <input
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
        maxLength={60}
        placeholder="Votre prénom"
        aria-label="Votre prénom"
      />
      <input
        value={tel}
        onChange={(e) => setTel(e.target.value)}
        inputMode="tel"
        maxLength={20}
        placeholder="06 12 34 56 78"
        aria-label="Votre numéro"
      />
      {err && <div className="ck-ct-e">{err}</div>}
      <div className="ck-ct-r">
        <button type="button" className="go" onClick={envoyer} disabled={envoi}>
          {envoi ? "Un instant…" : "Enregistrer"}
        </button>
        <button type="button" onClick={() => { setOuvert(false); setErr(""); }}>Plus tard</button>
      </div>
    </div>
  );
}
