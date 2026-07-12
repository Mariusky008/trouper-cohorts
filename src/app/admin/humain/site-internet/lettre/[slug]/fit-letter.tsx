"use client";
// Garde-fou « tenir sur 1 page A4 » : après chargement des polices, si le
// contenu d'une feuille dépasse le cadre, on le met légèrement à l'échelle pour
// qu'il rentre TOUJOURS — quelle que soit la longueur des textes (édités,
// noms longs…) ou l'environnement. Actif seulement en cas de débordement réel
// (sinon échelle = 1, aucun changement). Le résultat est capturé tel quel par
// l'export PNG (html-to-image) et par l'impression.
import { useEffect } from "react";

export function FitLetter() {
  useEffect(() => {
    let cancelled = false;

    const fit = () => {
      if (cancelled) return;
      const frames = document.querySelectorAll<HTMLElement>("#letter-root .sheet .frame");
      frames.forEach((frame) => {
        if (frame.dataset.fitted) return;
        // Enveloppe le contenu pour pouvoir le mettre à l'échelle d'un bloc.
        const inner = document.createElement("div");
        inner.style.display = "flex";
        inner.style.flexDirection = "column";
        inner.style.width = "100%";
        inner.style.flex = "none";
        inner.style.transformOrigin = "top center";
        while (frame.firstChild) inner.appendChild(frame.firstChild);
        frame.appendChild(inner);
        frame.style.overflow = "hidden";

        // Hauteur naturelle du contenu vs hauteur dispo du cadre.
        inner.style.height = "auto";
        const natural = inner.scrollHeight;
        const avail = frame.clientHeight;
        if (natural > avail + 1) {
          const s = Math.max(0.6, avail / natural);
          inner.style.height = natural + "px";
          inner.style.transform = `scale(${s})`;
        } else {
          inner.style.height = "100%"; // rien à faire : le contenu remplit le cadre
        }
        frame.dataset.fitted = "1";
      });
    };

    const run = async () => {
      try {
        await (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready;
      } catch {
        /* pas de Font Loading API → on continue */
      }
      if (cancelled) return;
      // Laisse deux frames au layout pour se stabiliser avant de mesurer.
      requestAnimationFrame(() => requestAnimationFrame(fit));
    };
    run();

    return () => { cancelled = true; };
  }, []);

  return null;
}
