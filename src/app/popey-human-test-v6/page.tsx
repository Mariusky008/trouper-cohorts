"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const faqItems = [
  {
    q: "En combien de temps puis-je activer une première synergie ?",
    a: "Objectif : créer une première synergie activable en 30 jours, puis la dupliquer au Mois 2.",
  },
  {
    q: "Est-ce que je dois changer mon métier ?",
    a: "Non. Popey augmente la valeur de vos clients actuels, sans remplacer votre activité principale.",
  },
  {
    q: "Comment fonctionnent les commissions ?",
    a: "Avec des règles cadrées entre partenaires : logique d’apport, traçabilité et activation terrain.",
  },
  {
    q: "Est-ce réservé aux profils avec grosse audience ?",
    a: "Non. Le critère principal est votre capacité à exécuter une offre sérieuse avec un partenaire complémentaire.",
  },
];

export default function PopeyHumanTestV6Page() {
  const [tick, setTick] = useState(0);
  const month = (tick % 6) + 1;
  const duoRevenue = month * 600;
  const incomingRevenue = Math.max(month - 1, 0) * 400;
  const commissionRevenue = Math.max(month - 2, 0) * 500;
  const totalRevenue = duoRevenue + incomingRevenue + commissionRevenue;

  const streamData = [
    { id: "duo", label: "Pack duo", value: duoRevenue, detail: "Offre commune mensuelle" },
    { id: "in", label: "Reco entrantes", value: incomingRevenue, detail: "Nouveaux clients du réseau" },
    { id: "out", label: "Reco sortantes (10%)", value: commissionRevenue, detail: "Commissions d’apport d’affaires" },
  ];

  const phaseMessage = useMemo(() => {
    if (month === 1) return "M1: le pack duo démarre et crée le premier CA.";
    if (month === 2) return "M2: les recommandations entrantes s’ajoutent.";
    return "M3 à M6: les 3 flux tournent ensemble et se cumulent.";
  }, [month]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => (prev + 1) % 1200);
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className={cn("min-h-screen bg-[#F7F7F7] text-[#0B0B0B]", poppins.variable, "font-poppins")}>
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] items-start">
            <div className="space-y-5">
              <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-black">
                <span className="h-2 w-2 bg-[#B6FF2B] animate-pulse" />
                Landing V6 Conversion
              </p>
              <h1 className="text-4xl md:text-6xl font-black leading-[1.04]">
                Augmentez votre chiffre d’affaires avec les mêmes clients, grâce aux bons partenaires business.
              </h1>
              <p className="text-base md:text-lg font-medium text-black/80 max-w-2xl">
                En 30 jours, Popey vous aide à lancer une première synergie rentable. Ensuite, vous dupliquez le modèle pour activer 3 flux de revenus autour des mêmes clients.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:translate-y-[-1px] hover:shadow-[0_8px_0_0_#B6FF2B]">
                  Postuler à l’Audit de Synergie
                </Link>
                <a href="#parcours-v6" className="inline-flex items-center justify-center rounded-md border border-black px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-black hover:text-white">
                  Voir le parcours 3 mois
                </a>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-black/70">
                Audit 15 min • 1 partenaire prioritaire • 1 offre commune possible • Sur sélection
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0B0B] p-5 text-white">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Simulation 6 mois</p>
                <p className="text-xs font-bold border border-white/30 rounded-full px-3 py-1">M{month}/6</p>
              </div>

              <div className="mt-3 grid grid-cols-6 gap-1">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className={cn("h-1 rounded-full", index < month ? "bg-[#B6FF2B]" : "bg-white/20")} />
                ))}
              </div>

              <div className="mt-4 space-y-2">
                {streamData.map((stream) => (
                  <div key={stream.id} className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wide font-black">{stream.label}</p>
                      <p className="text-xl font-black">{stream.value.toLocaleString("fr-FR")}€</p>
                    </div>
                    <p className="text-[11px] text-white/75 font-medium">{stream.detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-[#B6FF2B] text-black p-3">
                <p className="text-[11px] uppercase tracking-wide font-black">CA cumulé simulé à M{month}</p>
                <p className="text-3xl font-black">{totalRevenue.toLocaleString("fr-FR")}€</p>
              </div>

              <p className="mt-3 text-xs font-black uppercase tracking-wide text-white/90">
                {phaseMessage}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Comment ça marche en 3 étapes</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <article className="rounded-xl border border-black/15 p-5">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Étape 1</p>
              <h3 className="mt-2 text-xl font-black">On choisit le bon partenaire</h3>
              <p className="mt-2 text-sm font-medium text-black/75">Un métier complémentaire qui vend déjà à vos mêmes clients.</p>
            </article>
            <article className="rounded-xl border border-black/15 p-5">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Étape 2</p>
              <h3 className="mt-2 text-xl font-black">On construit une offre commune</h3>
              <p className="mt-2 text-sm font-medium text-black/75">Une offre simple, claire, activable rapidement.</p>
            </article>
            <article className="rounded-xl border border-black/15 p-5">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Étape 3</p>
              <h3 className="mt-2 text-xl font-black">On active 3 flux de revenus</h3>
              <p className="mt-2 text-sm font-medium text-black/75">Pack duo, reco entrantes et commissions sortantes.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="parcours-v6" className="border-b border-black/10">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Parcours 3 mois</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <article className="rounded-xl border border-black/15 p-5 bg-white">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Mois 1</p>
              <h3 className="mt-2 text-xl font-black">Première synergie rentable</h3>
              <p className="mt-2 text-sm font-medium text-black/75">Partenaire prioritaire, offre commune, premiers rendez-vous.</p>
            </article>
            <article className="rounded-xl border border-black/15 p-5 bg-white">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Mois 2</p>
              <h3 className="mt-2 text-xl font-black">Duplication</h3>
              <p className="mt-2 text-sm font-medium text-black/75">2e partenaire, 2e source de revenu, recommandations en chaîne.</p>
            </article>
            <article className="rounded-xl border border-black/15 p-5 bg-white">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Mois 3</p>
              <h3 className="mt-2 text-xl font-black">Ouverture de la sphère</h3>
              <p className="mt-2 text-sm font-medium text-black/75">Accès aux métiers complémentaires et montée en puissance des flux.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Ce que vous obtenez en 30 jours</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-3 text-sm font-semibold">
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">1 partenaire complémentaire prioritaire identifié</div>
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">1 offre commune simple à vendre</div>
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">1 logique de recommandation claire</div>
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">1 cadre de commission traçable</div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Questions fréquentes</h2>
          <div className="mt-6 space-y-2">
            {faqItems.map((item) => (
              <details key={item.q} className="rounded-lg border border-black/15 bg-white px-4 py-3">
                <summary className="cursor-pointer font-black text-sm md:text-base">{item.q}</summary>
                <p className="mt-2 text-sm font-medium text-black/75">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl md:text-6xl font-black max-w-4xl">Vérifiez si votre métier peut générer plus avec les mêmes clients.</h2>
          <p className="mt-4 text-base md:text-lg font-medium text-white/85 max-w-4xl">
            En 15 minutes, on valide votre partenaire prioritaire, votre première synergie activable et votre potentiel réel.
          </p>
          <div className="mt-7">
            <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-md bg-[#B6FF2B] text-black px-7 py-3 text-sm font-black uppercase tracking-wide transition hover:translate-y-[-1px]">
              Postuler à l’Audit de Synergie
            </Link>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-white/70">Audit court • Sur sélection • Sans engagement</p>
        </div>
      </section>

      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-6 md:w-[360px]">
        <Link href="/programme-commando/postuler" className="flex items-center justify-center rounded-md bg-[#B6FF2B] text-black px-4 py-3 text-sm font-black uppercase tracking-wide shadow-[0_10px_30px_-12px_rgba(182,255,43,0.9)] transition hover:scale-[1.01]">
          Postuler à l’Audit de Synergie
        </Link>
      </div>
    </main>
  );
}
