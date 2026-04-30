"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Sphere = "toutes" | "habitat" | "sante" | "auto";

type AdminVocal = {
  id: string;
  from: string;
  metier: string;
  sphere: Exclude<Sphere, "toutes">;
  urgent?: boolean;
  duration: string;
};

const adminVocals: AdminVocal[] = [
  { id: "VOC-991", from: "Thomas", metier: "Carreleur", sphere: "habitat", urgent: true, duration: "0:34" },
  { id: "VOC-992", from: "Claire", metier: "Agent Immo", sphere: "habitat", duration: "0:27" },
  { id: "VOC-993", from: "David", metier: "Plombier", sphere: "habitat", duration: "0:42" },
  { id: "VOC-994", from: "Nora", metier: "Coach accompagnement", sphere: "sante", duration: "0:31" },
  { id: "VOC-995", from: "Lucas", metier: "Garagiste", sphere: "auto", duration: "0:29" },
];

const dispatchMetiers = [
  "Agent Immo", "Courtier", "Coordinateur patrimonial", "Architecte", "Maître d'Oeuvre", "Cuisiniste", "Plombier", "Électricien",
  "Menuisier", "Carreleur", "Façadier", "Peintre", "Terrassier", "Pisciniste", "Paysagiste", "Couvreur",
  "Déménageur", "Conciergerie", "Diagnostiqueur", "Syndic", "Consultant business", "CGP", "Consultant Pilotage Financier", "Banquier",
  "Garagiste", "Carrossier", "Contrôle Technique", "Coach accompagnement", "Coach mobilité", "Opticien",
];

const memberHealth = [
  { name: "Thomas", metier: "Carreleur", status: "ok", overdueDays: 0 },
  { name: "Claire", metier: "Agent Immo", status: "ok", overdueDays: 0 },
  { name: "David", metier: "Plombier", status: "alert", overdueDays: 19 },
  { name: "Nora", metier: "Coach accompagnement", status: "ok", overdueDays: 0 },
];

const adminMetricsBySphere: Record<Sphere, { leadsQualifies: number; commissionsValidees: number; caTotalReseau: number }> = {
  toutes: { leadsQualifies: 7, commissionsValidees: 3280, caTotalReseau: 450000 },
  habitat: { leadsQualifies: 5, commissionsValidees: 2510, caTotalReseau: 312000 },
  sante: { leadsQualifies: 1, commissionsValidees: 470, caTotalReseau: 74000 },
  auto: { leadsQualifies: 1, commissionsValidees: 300, caTotalReseau: 64000 },
};

export default function RadarEliteAdminPreviewPage() {
  const [adminSphere, setAdminSphere] = useState<Sphere>("toutes");
  const [selectedVocalId, setSelectedVocalId] = useState<string>(adminVocals[0].id);
  const [playingVocalId, setPlayingVocalId] = useState<string | null>(null);
  const [listenedVocalIds, setListenedVocalIds] = useState<string[]>([]);
  const [dispatchSelectionByVocal, setDispatchSelectionByVocal] = useState<Record<string, string[]>>({});
  const [flashAdminVocalId] = useState<string | null>("VOC-991");
  const [memberLeadOpenedById] = useState<Record<string, boolean>>({ "L-204": false, "L-213": true });
  const vocalLeadMap: Record<string, string> = { "VOC-991": "L-204", "VOC-993": "L-213" };

  const visibleAdminVocals = useMemo(
    () => adminVocals.filter((v) => adminSphere === "toutes" || v.sphere === adminSphere),
    [adminSphere]
  );
  const selectedVocal = useMemo(
    () => visibleAdminVocals.find((v) => v.id === selectedVocalId) ?? visibleAdminVocals[0] ?? null,
    [visibleAdminVocals, selectedVocalId]
  );
  const selectedDispatchTargets = selectedVocal ? dispatchSelectionByVocal[selectedVocal.id] ?? [] : [];
  const healthByMember = useMemo(
    () => Object.fromEntries(memberHealth.map((m) => [m.name, m])) as Record<string, (typeof memberHealth)[number]>,
    []
  );
  const adminMetrics = adminMetricsBySphere[adminSphere];

  const toggleDispatchMetier = (vocalId: string, metier: string) => {
    setDispatchSelectionByVocal((prev) => {
      const current = prev[vocalId] ?? [];
      const next = current.includes(metier)
        ? current.filter((item) => item !== metier)
        : [...current, metier];
      return { ...prev, [vocalId]: next };
    });
  };

  return (
    <main className="min-h-screen bg-[#0A0B0C] text-white pb-10">
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-5 md:py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-4xl md:text-5xl font-black leading-tight">Popey Radar</h1>
          <Link href="/radar-elite-preview" className="h-10 rounded-lg border border-white/20 px-3 inline-flex items-center text-xs font-black uppercase tracking-wide text-white/85">
            Retour membre
          </Link>
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-white/60">Vue admin</p>
        <h2 className="mt-2 text-[34px] leading-[1.05] md:text-2xl font-black">Mon cockpit admin</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { key: "toutes", label: "Toutes" },
            { key: "habitat", label: "Habitat" },
            { key: "sante", label: "Santé" },
            { key: "auto", label: "Auto" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setAdminSphere(s.key as Sphere)}
              className={`h-9 rounded-full px-3 text-xs font-black uppercase tracking-wide ${
                adminSphere === s.key ? "bg-white text-black" : "border border-white/20 text-white/75"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-white/15 bg-white/5 p-3">
            <p className="text-[10px] uppercase font-black tracking-[0.12em] text-white/65">Vocaux reçus</p>
            <p className="mt-1 text-xl font-black">{visibleAdminVocals.length}</p>
          </div>
          <div className="rounded-xl border border-[#EAC886]/25 bg-[#2A2111] p-3">
            <p className="text-[10px] uppercase font-black tracking-[0.12em] text-[#EAC886]/80">Leads qualifiés</p>
            <p className="mt-1 text-xl font-black text-[#EAC886]">{adminMetrics.leadsQualifies}</p>
          </div>
          <div className="rounded-xl border border-emerald-400/25 bg-[#10251D] p-3">
            <p className="text-[10px] uppercase font-black tracking-[0.12em] text-emerald-300/80">Commissions validées</p>
            <p className="mt-1 text-xl font-black text-emerald-300">{adminMetrics.commissionsValidees.toLocaleString("fr-FR")}€</p>
          </div>
          <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/10 p-3">
            <p className="text-[10px] uppercase font-black tracking-[0.12em] text-cyan-200/85">CA Total Réseau</p>
            <p className="mt-1 text-xl font-black text-cyan-200">{adminMetrics.caTotalReseau.toLocaleString("fr-FR")}€</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Timeline de distribution</p>
          <p className="mt-1 text-lg font-black">Vocaux reçus</p>
          <div className="mt-3 space-y-2">
            {visibleAdminVocals.map((vocal) => (
              <div
                key={vocal.id}
                onClick={() => setSelectedVocalId(vocal.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left ${
                  flashAdminVocalId === vocal.id
                    ? "border-emerald-300/55 bg-emerald-500/20 animate-[newLeadPulse_1.1s_ease-in-out_infinite]"
                    : vocal.urgent
                    ? "border-red-300/45 bg-red-500/15 animate-[urgPulse_1.4s_ease-in-out_infinite]"
                    : selectedVocal?.id === vocal.id
                    ? "border-emerald-300/45 bg-emerald-500/10"
                    : "border-white/15 bg-black/25"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black flex items-center gap-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${healthByMember[vocal.from]?.status === "alert" ? "bg-red-400" : "bg-emerald-400"}`} />
                    {vocalLeadMap[vocal.id] && !memberLeadOpenedById[vocalLeadMap[vocal.id]] && <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />}
                    {vocal.id} · {vocal.from} ({vocal.metier})
                    {vocal.urgent ? " · URGENCE" : ""}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setListenedVocalIds((prev) => (prev.includes(vocal.id) ? prev : [...prev, vocal.id]));
                      setPlayingVocalId((prev) => (prev === vocal.id ? null : vocal.id));
                    }}
                    className={`h-8 rounded-md border px-2 text-[11px] font-black uppercase tracking-wide ${
                      playingVocalId === vocal.id
                        ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-200"
                        : listenedVocalIds.includes(vocal.id)
                        ? "border-white/10 bg-white/5 text-white/45"
                        : "border-white/20 text-white/90"
                    }`}
                  >
                    {playingVocalId === vocal.id ? `Pause ${vocal.duration}` : `Play ${vocal.duration}`}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedVocal && (
          <div className="mt-3 rounded-2xl border border-white/15 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-white/65">Dispatch chirurgical</p>
            <p className="mt-1 text-sm font-black">{selectedVocal.id} · Cochez les métiers à notifier</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto pr-1">
              {dispatchMetiers.map((metier) => {
                const checked = selectedDispatchTargets.includes(metier);
                return (
                  <label key={metier} className={`rounded-lg border px-2 py-2 text-xs font-bold ${checked ? "border-emerald-300/45 bg-emerald-500/10" : "border-white/15 bg-black/20"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleDispatchMetier(selectedVocal.id, metier)} className="mr-2 align-middle" />
                    {metier}
                  </label>
                );
              })}
            </div>
            <button className="mt-3 h-10 w-full rounded-lg bg-emerald-400 text-black text-xs font-black uppercase tracking-wide">
              Valider et notifier ({selectedDispatchTargets.length})
            </button>
          </div>
        )}
      </div>
      <style jsx global>{`
        @keyframes urgPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0.25); }
          50% { box-shadow: 0 0 0 10px rgba(248,113,113,0); }
        }
        @keyframes newLeadPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(52,211,153,0); }
        }
      `}</style>
    </main>
  );
}

