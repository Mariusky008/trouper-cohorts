"use client";

export default function PopeyHumanApporteursInfoPage() {
  const version = "20260510-apporteurs-info-v7";

  return (
    <main className="h-screen w-full overflow-hidden bg-[#07090C]">
      <iframe
        title="Popey · Apporteurs d'affaires"
        src={`/popey-apporteurs-info.html?v=${version}`}
        className="h-full w-full border-0"
      />
    </main>
  );
}
