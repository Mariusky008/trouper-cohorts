"use client";

// LA BARRE DE RÉACTIONS, sous chaque annonce.
//
// Quatre gestes, et aucun n'est un « like ». Ils disent une INTENTION —
// j'en veux, je passe voir, mon préféré, j'y suis — et c'est ce qui les rend
// lisibles pour le commerçant : « douze personnes passent voir » se comprend,
// « douze pouces levés » ne veut rien dire.
//
// OPTIMISTE, comme le cœur du fil. Une réaction n'engage que soi et un échec se
// rattrape en silence ; attendre 400 ms avant d'allumer ferait retaper, et on
// se retrouverait avec deux appels et un état faux.
import { useEffect, useState } from "react";
import { REACTIONS, REACTION_UI, compteAffiche, type Reaction, type VueReactions } from "@/lib/direct/reactions";

/** CE QUE LE GESTE PRODUIT, dit à celui qui vient de le faire.
 *
 *  « Rien ne se produit » était exact du point de vue de l'habitant : la
 *  pastille s'allume, et c'est tout. Or le geste ne s'adresse pas à lui — il
 *  s'adresse au commerce. Il faut donc le lui dire, et le dire précisément :
 *  « envoyé au commerçant » serait un mensonge (rien n'est envoyé), « merci »
 *  ne dit rien. Chaque phrase décrit ce que le commerce voit vraiment dans son
 *  espace, où ces quatre chiffres sont affichés. */
const RETOUR: Record<Reaction, string> = {
  jenveux: "C'est noté — le commerce voit combien de personnes en veulent.",
  jepassevoir: "C'est noté — le commerce sait que vous comptez passer.",
  prefere: "C'est noté — ce commerce est dans vos préférés.",
  jysuis: "Merci — c'est ce qui prouve au commerce que Le Direct fait venir du monde.",
};

/** Assez pour lire une phrase, assez court pour ne pas encombrer la carte. */
const DUREE_RETOUR_MS = 3200;

export function Reactions({
  publicationId,
  ville,
  initial,
}: {
  publicationId: string;
  ville: string;
  initial: VueReactions;
}) {
  const [miennes, setMiennes] = useState<Reaction[]>(initial.miennes);
  const [compte, setCompte] = useState(initial.compte);
  /** La phrase de retour, et rien d'autre : `null` la plupart du temps. */
  const [retour, setRetour] = useState<Reaction | null>(null);

  // Le message s'efface tout seul. Un minuteur est un système externe : c'est
  // exactement le rôle d'un effet, et il est nettoyé si l'on réappuie entre
  // temps — sinon le premier minuteur effacerait le second message.
  useEffect(() => {
    if (!retour) return;
    const t = window.setTimeout(() => setRetour(null), DUREE_RETOUR_MS);
    return () => window.clearTimeout(t);
  }, [retour]);

  const basculer = async (type: Reaction) => {
    const avait = miennes.includes(type);
    const vise = !avait;
    // Optimiste : l'état part tout de suite, le compteur suit.
    setMiennes((l) => (vise ? [...l, type] : l.filter((x) => x !== type)));
    setCompte((c) => ({ ...c, [type]: Math.max(0, (c[type] ?? 0) + (vise ? 1 : -1)) }));
    // On dit ce que le geste PRODUIT, et seulement quand on l'ajoute : retirer
    // sa réaction n'a pas à être commenté.
    setRetour(vise ? type : null);
    try {
      const r = await fetch("/api/direct/reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicationId, ville, type, actif: vise }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch {
      // L'appel a échoué : on ne laisse pas un état faux à l'écran.
      setMiennes((l) => (vise ? l.filter((x) => x !== type) : [...l, type]));
      setCompte((c) => ({ ...c, [type]: Math.max(0, (c[type] ?? 0) + (vise ? -1 : 1)) }));
    }
  };

  return (
    <div className="rx" role="group" aria-label="Réagir">
      {REACTIONS.map((t) => {
        const on = miennes.includes(t);
        const n = compteAffiche(compte[t]);
        return (
          <button
            key={t}
            type="button"
            className={`rx-b${on ? " on" : ""}`}
            onClick={() => basculer(t)}
            aria-pressed={on}
          >
            <span aria-hidden="true">{REACTION_UI[t].emoji}</span>
            {REACTION_UI[t].label}
            {n && <b>{n}</b>}
          </button>
        );
      })}
      {/* `aria-live` : la phrase apparaît sans que le focus bouge, donc un
          lecteur d'écran ne la verrait jamais sans cette annonce. */}
      {retour && (
        <p className="rx-dit" role="status" aria-live="polite">
          {RETOUR[retour]}
        </p>
      )}
    </div>
  );
}
