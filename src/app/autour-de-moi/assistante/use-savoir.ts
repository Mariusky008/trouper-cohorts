"use client";

// 🧠 CE QUE SON FANTÔME SAIT, POUR LE COMPTOIR — lu une fois, partagé entre
// l'accueil (qui annonce « 3 questions de clients t'attendent ») et l'écran
// où il y répond. Voir `savoir-fantome.ts`.
//
//   · un VRAI commerçant : sa colonne `assistant_kb`, par la route de l'Espace
//     Pro, avec son jeton ;
//   · la DÉMONSTRATION : ce téléphone. Les questions posées à son fantôme dans
//     l'application y arrivent en direct, même depuis un autre onglet.
import { useEffect, useState, useSyncExternalStore } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import {
  abonnerSavoirs,
  chargerSavoirs,
  nettoyerSavoir,
  poserSavoirLocal,
  SAVOIR_VIDE,
  SAVOIRS_VIDES,
  sansCeQuiEstRepondu,
  type SavoirFantome,
} from "@/lib/direct/savoir-fantome";

export type SavoirDuComptoir = {
  /** `null` tant qu'il n'est pas lu. */
  savoir: SavoirFantome | null;
  /** Enregistre, et sort de la file les questions écartées. Rend un message d'ennui, ou `null`. */
  poser: (s: SavoirFantome, ecarter?: string[]) => Promise<string | null>;
  /** Relire (en arrivant sur l'écran : de nouvelles questions ont pu tomber). */
  relire: () => void;
};

export function useSavoir(commerce: CommerceComptoir): SavoirDuComptoir {
  const reel = commerce.reel;
  const locaux = useSyncExternalStore(abonnerSavoirs, chargerSavoirs, () => SAVOIRS_VIDES);
  const [enBase, setEnBase] = useState<SavoirFantome | null>(null);
  const [tour, setTour] = useState(0);

  useEffect(() => {
    if (!reel) return;
    let fini = false;
    fetch("/api/site-internet/pro/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: reel.slug, token: reel.token, action: "get" }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { kb?: unknown }) => {
        if (!fini) setEnBase(nettoyerSavoir(j.kb));
      })
      .catch(() => {
        // HORS LIGNE : on garde ce qu'on avait ; un écran vide plutôt qu'un faux savoir.
        if (!fini) setEnBase((s) => s ?? SAVOIR_VIDE);
      });
    return () => {
      fini = true;
    };
  }, [reel, tour]);

  const poser = async (s: SavoirFantome, ecarter: string[] = []): Promise<string | null> => {
    if (!reel) return poserSavoirLocal(commerce.id, sansCeQuiEstRepondu(s, ecarter));
    try {
      const r = await fetch("/api/site-internet/pro/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: reel.slug,
          token: reel.token,
          action: "set",
          kb: { specialites: s.specialites, exclusions: s.exclusions, faq: s.faq },
          ecarter,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { kb?: unknown; error?: string };
      if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
      setEnBase(nettoyerSavoir(j.kb));
      return null;
    } catch (e) {
      return `Ce n’est pas parti : ${e instanceof Error ? e.message : "réessaie"}.`;
    }
  };

  return {
    savoir: reel ? enBase : (locaux[commerce.id] ?? SAVOIR_VIDE),
    poser,
    relire: () => setTour((t) => t + 1),
  };
}
