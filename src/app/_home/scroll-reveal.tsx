"use client";

// Révélation au défilement : ajoute .reveal-in aux éléments .reveal quand ils
// entrent dans le viewport (effet d'apparition doux, échelonné). Sans JS/observer,
// tout reste visible (dégradation propre).
import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("reveal-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("reveal-in");
            io.unobserve(en.target);
          }
        });
      },
      // Très permissif : dès qu'un pixel entre, on révèle (jamais de bloc coincé).
      { threshold: 0.02, rootMargin: "0px 0px -2% 0px" },
    );
    els.forEach((e) => io.observe(e));
    // Filet de sécurité : au cas où l'observer ne se déclencherait pas (scroll
    // programmatique, navigateur exotique), tout devient visible après un délai.
    const safety = window.setTimeout(() => els.forEach((e) => e.classList.add("reveal-in")), 4500);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);
  return null;
}
