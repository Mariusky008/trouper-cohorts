"use client";

// Apparition douce des sections au scroll (fondu + léger glissé vers le haut) —
// le détail qui fait « site premium » plutôt que « page plate ». Sans JS (ou en
// reduced-motion), tout reste visible : la classe qui masque n'est ajoutée que
// par ce composant, donc aucun risque de contenu caché.
import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>(".mqc section, .mqc .close"));
    if (!els.length) return;
    els.forEach((el) => el.classList.add("rvl"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("rvl-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
