"use client";

import { useEffect } from "react";

export default function PopeyHumanAccueilTestPage() {
  const landingVersion = "20260427-accueil-v3";

  useEffect(() => {
    if (window.location.hash === "#hero-demo") {
      window.history.replaceState({}, "", "/popey-human/accueil-test");
    }
  }, []);

  return (
    <main className="h-screen w-full overflow-hidden bg-[#080A0E]">
      <iframe
        title="Popey Human Accueil Daily Scan"
        src={`/popey-human-smart-scan-landing.html?v=${landingVersion}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
