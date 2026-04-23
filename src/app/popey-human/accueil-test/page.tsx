"use client";

import { useMemo, useState } from "react";

const visualSteps = [
  { icon: "🟢", title: "SCAN", line: "On analyse ton reseau", tone: "from-emerald-300/35 to-emerald-300/10" },
  { icon: "🟡", title: "ACTIVER", line: "Tu contactes les bonnes personnes", tone: "from-amber-300/35 to-amber-300/10" },
  { icon: "🔵", title: "OPPORTUNITES", line: "Elles arrivent directement", tone: "from-cyan-300/35 to-cyan-300/10" },
  { icon: "🟣", title: "CASH", line: "Tu suis et encaisses", tone: "from-fuchsia-300/35 to-fuchsia-300/10" },
] as const;

const métierMap: Array<{ keys: string[]; targets: string[] }> = [
  { keys: ["immo", "immobilier", "agent"], targets: ["Courtier", "Notaire", "Diagnostiqueur"] },
  { keys: ["dev", "developpeur", "freelance", "web"], targets: ["Agence web", "Consultant SEO", "Photographe pro"] },
  { keys: ["coach", "formation"], targets: ["RH", "Dirigeant PME", "Consultant bilan"] },
  { keys: ["courtier", "banque", "finance"], targets: ["Agent immo", "Notaire", "Gestionnaire patrimoine"] },
];

function getTargets(metier: string) {
  const normalized = metier.toLowerCase().trim();
  if (!normalized) return [];
  const hit = métierMap.find((entry) => entry.keys.some((key) => normalized.includes(key)));
  if (hit) return hit.targets;
  return ["Partenaire local", "Prescripteur metier", "Apporteur de confiance"];
}

export default function AccueilTestPage() {
  const [metier, setMetier] = useState("");
  const [monthlyOps, setMonthlyOps] = useState(12);

  const targets = useMemo(() => getTargets(metier), [metier]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#0f172a_48%,#090b16_100%)] text-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <section className="grid items-center gap-6 rounded-3xl border border-white/15 bg-white/5 p-6 shadow-[0_24px_80px_-36px_rgba(16,185,129,0.6)] lg:grid-cols-[1.05fr_0.95fr] sm:p-8">
          <div>
            <p className="inline-flex rounded-full border border-emerald-300/35 bg-emerald-300/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100">
              Popey - Landing test v2
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[0.95] sm:text-6xl">
              Ton telephone contient deja tes prochains clients.
            </h1>
            <p className="mt-4 text-lg font-semibold text-cyan-100">On te montre comment les activer.</p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85">Ton reseau te ramene des clients. Sans prospecter.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="/popey-human/smart-scan"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-emerald-300/35 bg-emerald-300/20 px-6 text-sm font-black uppercase tracking-[0.08em] text-emerald-100 transition hover:bg-emerald-300/30"
              >
                Voir qui peut m apporter des clients
              </a>
              <a
                href="/popey-human/smart-scan"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-black uppercase tracking-[0.08em] text-white/90 transition hover:bg-white/15"
              >
                Activer mon reseau maintenant
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/35 bg-[#0A1434]/80 p-4 shadow-[0_30px_90px_-45px_rgba(34,211,238,0.8)]">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">Demo visuelle (GIF style)</p>
            <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3">
              <p className="rounded-xl border border-emerald-300/30 bg-emerald-300/15 px-2 py-1 text-[11px] font-black text-emerald-100">
                1) Scan telephone lance
              </p>
              <p className="rounded-xl border border-white/15 bg-white/10 px-2 py-1 text-[11px]">2) 582 contacts detectes</p>
              <p className="rounded-xl border border-orange-300/30 bg-orange-300/15 px-2 py-1 text-[11px] font-black text-orange-100">
                3) 14 profils potentiel eleve 🔥
              </p>
              <p className="rounded-xl border border-cyan-300/30 bg-cyan-300/15 px-2 py-1 text-[11px]">4) Message pret, 1 clic pour envoyer</p>
              <p className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/15 px-2 py-1 text-[11px] font-black text-fuchsia-100">
                5) Notification: Nouvelle opportunite recue
              </p>
            </div>
            <p className="mt-2 text-[10px] text-white/65">Ajoute ensuite une vraie video produit 15-30s en autoplay mute loop.</p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-rose-300/25 bg-rose-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-rose-100">Avant</p>
            <p className="mt-2 text-sm text-white/90">500 contacts. 0 opportunite.</p>
          </article>
          <article className="rounded-3xl border border-emerald-300/25 bg-emerald-300/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-100">Apres Popey</p>
            <p className="mt-2 text-sm text-white/90">500 contacts. {monthlyOps} opportunites / mois.</p>
            <input
              type="range"
              min={1}
              max={24}
              value={monthlyOps}
              onChange={(event) => setMonthlyOps(Number(event.target.value))}
              className="mt-3 w-full accent-emerald-300"
            />
          </article>
        </section>

        <section className="mt-8">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Comment ca marche</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {visualSteps.map((step) => (
              <article
                key={step.title}
                className={`rounded-2xl border border-white/15 bg-gradient-to-br ${step.tone} p-4 transition hover:-translate-y-1 hover:shadow-[0_14px_34px_-20px_rgba(34,211,238,0.7)]`}
              >
                <p className="text-xl">{step.icon}</p>
                <h3 className="mt-1 text-lg font-black">{step.title}</h3>
                <p className="mt-1 text-sm text-white/90">{step.line}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-100">Preuves visuelles</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-[11px] font-black text-cyan-100">📲 Nicolas t a envoye un contact</p>
              <p className="mt-2 text-xs text-white/75">Notification app en direct</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-[11px] font-black text-emerald-100">📌 Deal en cours: RDV pris</p>
              <p className="mt-2 text-xs text-white/75">Suivi clair par etapes</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="text-[11px] font-black text-amber-100">💶 +800 EUR valide</p>
              <p className="mt-2 text-xs text-white/75">Commission tracee</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-cyan-300/25 bg-cyan-300/10 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Quel est ton metier ?</h2>
          <p className="mt-2 text-sm text-white/88">On te montre qui activer en priorite.</p>
          <input
            value={metier}
            onChange={(event) => setMetier(event.target.value)}
            placeholder="Ex: Agent immo, Developpeur web, Coach..."
            className="mt-3 h-11 w-full rounded-xl border border-white/15 bg-black/25 px-3 text-sm"
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {targets.length > 0 ? (
              targets.map((target) => (
                <div key={target} className="rounded-xl border border-cyan-300/30 bg-cyan-300/15 px-3 py-2 text-sm font-black text-cyan-100">
                  {target}
                </div>
              ))
            ) : (
              <p className="text-sm text-white/75">Ecris ton metier pour voir les partenaires utiles.</p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/15 bg-white/5 p-6">
          <h2 className="text-2xl font-black sm:text-4xl">Pas de spam. Pas de forcing.</h2>
          <p className="mt-3 text-sm leading-7 text-white/90 sm:text-base">
            Popey n envoie rien a ta place. Tu restes toujours en controle. Tu actives uniquement les bonnes personnes.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-emerald-300/30 bg-emerald-300/15 p-6 text-center sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-100">CTA final</p>
          <h2 className="mt-2 text-3xl font-black sm:text-5xl">Tes prochains clients sont deja dans ton reseau.</h2>
          <a
            href="/popey-human/smart-scan"
            className="mx-auto mt-6 inline-flex h-12 items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-300/25 px-7 text-sm font-black uppercase tracking-[0.08em] text-emerald-50 transition hover:bg-emerald-300/35"
          >
            Trouver mes contacts utiles
          </a>
        </section>
      </div>
    </main>
  );
}
