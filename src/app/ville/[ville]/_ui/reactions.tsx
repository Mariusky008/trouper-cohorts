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
import { useState } from "react";
import { REACTIONS, REACTION_UI, compteAffiche, type Reaction, type VueReactions } from "@/lib/direct/reactions";

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

  const basculer = async (type: Reaction) => {
    const avait = miennes.includes(type);
    const vise = !avait;
    // Optimiste : l'état part tout de suite, le compteur suit.
    setMiennes((l) => (vise ? [...l, type] : l.filter((x) => x !== type)));
    setCompte((c) => ({ ...c, [type]: Math.max(0, (c[type] ?? 0) + (vise ? 1 : -1)) }));
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
    </div>
  );
}
