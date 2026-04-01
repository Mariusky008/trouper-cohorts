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

const synergyExamples = [
  {
    title: "Agent immobilier + Architecte",
    text: "Projection d’aménagement pour accélérer la décision et augmenter la valeur perçue.",
  },
  {
    title: "CGP + Courtier + Fiscaliste",
    text: "Chaîne de valeur autour du financement, de la structuration et de l’optimisation patrimoniale.",
  },
  {
    title: "Architecte + Cuisiniste + Domotique",
    text: "Continuité premium du projet avec plusieurs portes d’entrée et recommandations croisées.",
  },
];

export default function PopeyHumanTestV6Page() {
  const [tick, setTick] = useState(0);
  const month = (tick % 6) + 1;
  const activeStream = tick % 3;
  const duoRevenue = month * 600;
  const incomingRevenue = Math.max(month - 1, 0) * 400;
  const commissionRevenue = Math.max(month - 2, 0) * 500;
  const totalRevenue = duoRevenue + incomingRevenue + commissionRevenue;

  const streamData = useMemo(
    () => [
      { id: "duo", label: "Pack duo", value: duoRevenue, detail: "Offre commune vendue chaque mois" },
      { id: "in", label: "Reco entrantes", value: incomingRevenue, detail: "Nouveaux clients issus du réseau" },
      { id: "out", label: "Reco sortantes (10%)", value: commissionRevenue, detail: "Commissions d’apport d’affaires" },
    ],
    [duoRevenue, incomingRevenue, commissionRevenue],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => (prev + 1) % 1200);
    }, 1500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className={cn("min-h-screen bg-white text-[#0B0B0B]", poppins.variable, "font-poppins")}>
      <section className="border-b border-black/10">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-black">
                <span className="h-2 w-2 bg-[#B6FF2B] animate-pulse" />
                Landing V6 Conversion
              </p>
              <h1 className="text-4xl md:text-6xl font-black leading-[1.03]">
                Augmentez votre chiffre d’affaires avec les mêmes clients, grâce aux bons partenaires business.
              </h1>
              <p className="text-base md:text-lg font-medium text-black/80 max-w-3xl">
                En 30 jours, Popey vous aide à créer une première offre commune rentable avec un professionnel complémentaire. Ensuite, nous dupliquons le système pour générer recommandations, commissions et opportunités récurrentes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:translate-y-[-1px] hover:shadow-[0_8px_0_0_#B6FF2B]">
                  Postuler à l’Audit de Synergie
                </Link>
                <a href="#exemple-v6" className="inline-flex items-center justify-center rounded-md border border-black px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-black hover:text-white">
                  Voir un exemple concret
                </a>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-black/70">
                Audit 15 min • 1 partenaire prioritaire • 1 offre commune possible • Sur sélection
              </p>
            </div>

            <div className="rounded-2xl bg-[#0B0B0B] p-4 md:p-5 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#B6FF2B]/30 blur-2xl animate-pulse" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Simulation 6 mois</p>
                  <p className="text-xs font-bold border border-white/30 rounded-full px-3 py-1">M{month}/6</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {streamData.map((stream, index) => (
                    <div
                      key={stream.id}
                      className={cn(
                        "rounded-lg border px-2 py-2 transition-all duration-500",
                        activeStream === index ? "border-[#B6FF2B] bg-[#B6FF2B]/10 scale-[1.02]" : "border-white/20 bg-white/5",
                      )}
                    >
                      <p className="text-[10px] uppercase tracking-wide font-black">{stream.label}</p>
                      <p className="mt-1 text-base font-black">{stream.value.toLocaleString("fr-FR")}€</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-white/20 bg-white/5 p-3 relative">
                  <div className="relative h-[180px]">
                    <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#B6FF2B] flex items-center justify-center text-xs font-black bg-black">
                      Client
                    </div>
                    <div className={cn("absolute left-[7%] top-[14%] text-[11px] font-bold border px-2 py-1 rounded-full transition-all duration-500", activeStream === 0 ? "border-[#B6FF2B] bg-[#B6FF2B]/10" : "border-white/30")}>
                      Pack duo
                    </div>
                    <div className={cn("absolute right-[7%] top-[14%] text-[11px] font-bold border px-2 py-1 rounded-full transition-all duration-500", activeStream === 1 ? "border-[#B6FF2B] bg-[#B6FF2B]/10" : "border-white/30")}>
                      Reco entrantes
                    </div>
                    <div className={cn("absolute right-[7%] bottom-[12%] text-[11px] font-bold border px-2 py-1 rounded-full transition-all duration-500", activeStream === 2 ? "border-[#B6FF2B] bg-[#B6FF2B]/10" : "border-white/30")}>
                      Reco sortantes 10%
                    </div>
                    <div className="absolute left-[48%] top-[48%] h-px w-[27%] bg-white/60 rotate-[-32deg]" />
                    <div className="absolute left-[51%] top-[48%] h-px w-[26%] bg-white/60 rotate-[33deg]" />
                    <div className="absolute left-[51%] top-[54%] h-px w-[26%] bg-white/60 rotate-[63deg]" />
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#B6FF2B] text-black px-3 py-3 animate-pulse">
                  <p className="text-[11px] uppercase tracking-wide font-black">CA cumulé simulé à M{month}</p>
                  <p className="text-2xl font-black">{totalRevenue.toLocaleString("fr-FR")}€</p>
                  <p className="text-xs font-bold mt-1">{streamData[activeStream].detail}</p>
                </div>
                <p className="mt-3 text-xs uppercase tracking-wide font-black text-white/85">
                  3 flux activés dès le Mois 1 pour créer une dynamique de revenus croissants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl md:text-5xl font-black max-w-4xl">Avant Popey, votre réseau est passif. Après Popey, il devient une machine à opportunités.</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-black/10 bg-white p-5 transition hover:-translate-y-1">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Sans Popey</p>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-black/80">
                <li>1 client = 1 vente</li>
                <li>Réseau informel et peu activé</li>
                <li>Recommandations aléatoires</li>
                <li>Commissions floues</li>
              </ul>
            </div>
            <div className="rounded-xl border border-black bg-black text-white p-5 transition hover:-translate-y-1">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Avec Popey</p>
              <ul className="mt-3 space-y-2 text-sm font-semibold">
                <li>1 client = 2 à 5 opportunités potentielles</li>
                <li>Partenaire complémentaire activé intelligemment</li>
                <li>Recommandations traçables</li>
                <li>Commissions structurées et duplicables</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-black bg-white p-4 text-center">
            <p className="text-xl md:text-3xl font-black">1 client = 1 vente <span className="text-[#5A5A5A]">vs</span> 1 client = 2 à 5 opportunités</p>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl md:text-5xl font-black">Le parcours Popey en 3 mois</h2>
          <p className="mt-3 text-base md:text-lg text-black/75 font-medium max-w-4xl">
            D’abord une première synergie rentable, puis duplication, puis ouverture de la sphère des 20 métiers.
          </p>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <article className="rounded-xl border border-black/15 p-5 bg-white transition hover:shadow-[0_0_0_2px_#B6FF2B_inset]">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Mois 1</p>
              <h3 className="mt-2 text-xl font-black">1ère synergie rentable</h3>
              <p className="mt-2 text-sm font-medium text-black/75">Partenaire prioritaire, offre commune, scripts, activation terrain.</p>
            </article>
            <article className="rounded-xl border border-black/15 p-5 bg-white transition hover:shadow-[0_0_0_2px_#B6FF2B_inset]">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Mois 2</p>
              <h3 className="mt-2 text-xl font-black">Duplication du système</h3>
              <p className="mt-2 text-sm font-medium text-black/75">2e partenaire, 2e angle d’offre, recommandations en chaîne.</p>
            </article>
            <article className="rounded-xl border border-black/15 p-5 bg-white transition hover:shadow-[0_0_0_2px_#B6FF2B_inset]">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Mois 3</p>
              <h3 className="mt-2 text-xl font-black">Ouverture de la sphère</h3>
              <p className="mt-2 text-sm font-medium text-black/75">20 métiers complémentaires, commissions élargies, flux récurrents.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="exemple-v6" className="border-b border-black/10 bg-[#0B0B0B] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Exemple concret</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-black max-w-5xl">
            Chasseur immobilier de luxe : comment transformer un client en mini écosystème rentable.
          </h2>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/20 p-5 bg-white/5 transition hover:bg-white/10">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Mois 1</p>
              <p className="mt-2 text-sm font-semibold">Architecte d’intérieur + offre de projection premium pour accélérer la décision.</p>
            </div>
            <div className="rounded-xl border border-white/20 p-5 bg-white/5 transition hover:bg-white/10">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Mois 2</p>
              <p className="mt-2 text-sm font-semibold">Ajout courtier/CGP pour ouvrir une 2e source de revenu autour du même client.</p>
            </div>
            <div className="rounded-xl border border-white/20 p-5 bg-white/5 transition hover:bg-white/10">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Mois 3</p>
              <p className="mt-2 text-sm font-semibold">Ouverture à la sphère premium : domotique, conciergerie, déménagement, chef, home organizer.</p>
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-[#B6FF2B] text-black p-4">
            <p className="font-black">Le but n’est pas d’avoir plus de contacts. Le but est de créer plus de valeur par client, mois après mois.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl md:text-5xl font-black">Exemples de synergies activables</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {synergyExamples.map((item, index) => (
              <article key={item.title} className="rounded-xl border border-black/15 p-5 bg-white transition duration-500 hover:-translate-y-1" style={{ transitionDelay: `${index * 60}ms` }}>
                <h3 className="text-lg font-black">{item.title}</h3>
                <p className="mt-2 text-sm text-black/75 font-medium">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#F7F7F7]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl md:text-5xl font-black">Ce que vous obtenez en 30 jours</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-3 text-sm font-semibold">
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">1 partenaire complémentaire prioritaire identifié</div>
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">1 offre commune simple à vendre</div>
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">1 logique de recommandation claire</div>
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">1 cadre de commission traçable</div>
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">Scripts et messages prêts à activer</div>
            <div className="rounded-lg bg-white border border-black/10 px-4 py-3">Plan d’activation terrain</div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10">
        <div className="mx-auto max-w-4xl px-4 py-16">
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
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-6xl font-black max-w-4xl">Vérifiez si votre métier peut générer plus avec les mêmes clients.</h2>
          <p className="mt-4 text-base md:text-lg font-medium text-white/85 max-w-4xl">
            En 15 minutes, nous identifions votre partenaire prioritaire, votre première synergie activable et votre potentiel réel.
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
