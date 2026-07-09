"use client";

// Anime le flux de l'Assistant Avis : les étapes apparaissent en cascade quand
// le bloc entre dans l'écran. Enhancement progressif : si le JS ne tourne pas,
// on n'ajoute jamais « reveal-ready » → les étapes restent visibles.
import { useEffect } from "react";

export function FlowReveal() {
  useEffect(() => {
    const flow = document.querySelector(".mq .spot .flow");
    if (!flow) return;
    // Respecte « réduire les animations ».
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    flow.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            flow.classList.add("in");
            io.disconnect();
          }
        }
      },
      { threshold: 0.35 }
    );
    io.observe(flow);
    return () => io.disconnect();
  }, []);

  return null;
}
