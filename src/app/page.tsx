"use client";

import { useEffect } from "react";

export default function HomePage() {
  const landingVersion = "20260427-accueil-v3";

  useEffect(() => {
    if (window.location.hash === "#hero-demo") {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return (
    <main className="h-screen w-full overflow-hidden bg-[#080A0E]">
      <iframe
        title="Popey Accueil"
        src={`/popey-human-smart-scan-landing.html?v=${landingVersion}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
