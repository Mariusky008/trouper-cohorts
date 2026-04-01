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

export default function PopeyHumanTestV4Page() {
  const [tick, setTick] = useState(0);
  const month = (tick % 6) + 1;
  const doorOpen = tick % 4 >= 2;
  const activeJourney = tick % 3;
  const duoRevenue = month * 600;
  const incomingRevenue = Math.max(month - 1, 0) * 400;
  const commissionRevenue = Math.max(month - 2, 0) * 500;
  const totalRevenue = duoRevenue + incomingRevenue + commissionRevenue;

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
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16 lg:min-h-[72vh] flex items-center">
          <div className="w-full">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-black">
              <span className="h-2 w-2 bg-[#B6FF2B] animate-pulse" />
              Landing V4.1 Conversion
            </p>
            <h1 className="mt-4 text-4xl md:text-6xl font-black leading-[1.04] max-w-5xl">
              Ne cherchez plus vos clients, allez là où ils sont déjà.
              <br />
              Chez ceux qui vendent juste avant ou juste après vous.
            </h1>
            <p className="mt-4 text-base md:text-lg font-medium text-black/80 max-w-3xl">
              Arrêtez de prospecter seul. Popey vous associe chaque mois à un partenaire stratégique et crée votre Pack Duo clé en main pour transformer l’alliance en chiffre d’affaires.
            </p>
            <p className="mt-3 inline-flex rounded-full border border-black/20 bg-[#B6FF2B]/30 px-4 py-1.5 text-xs md:text-sm font-black uppercase tracking-wide">
              Objectif : activer 3 flux de revenus complémentaires en 6 mois grâce à un écosystème de 19 métiers partenaires.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:translate-y-[-1px] hover:shadow-[0_8px_0_0_#B6FF2B]">
                Postuler à l’Audit de Synergie
              </Link>
              <a href="#parcours-v4" className="inline-flex items-center justify-center rounded-md border border-black px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-black hover:text-white">
                Voir le parcours 3 mois
              </a>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-black/70">Audit 15 min • Sur sélection</p>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Le problème à résoudre</p>
              <h2 className="mt-3 text-3xl md:text-5xl font-black max-w-5xl">
                Vos clients achètent déjà ailleurs avant et après vous. Le problème, c’est que vous n’êtes pas dans la boucle.
              </h2>
              <p className="mt-4 text-base md:text-lg font-medium text-white/85 max-w-5xl">
                Un client qui vous fait confiance continue souvent son parcours chez d’autres professionnels complémentaires : courtier, architecte d’intérieur, CGP, cuisiniste, déménageur, conciergerie privée.
              </p>
              <p className="mt-3 text-base md:text-lg font-medium text-white/85 max-w-5xl">
                Si ces achats se font sans vous, vous laissez partir de la valeur, des recommandations, des commissions et des opportunités de fidélisation.
              </p>
              <p className="mt-3 text-base md:text-lg font-medium text-white/85 max-w-5xl">
                De l’autre côté, les métiers complémentaires hors de votre boucle ne vous recommandent pas. Vous perdez aussi des clients potentiels.
              </p>
              <div className="mt-4 rounded-xl border border-[#B6FF2B] bg-[#B6FF2B]/10 px-4 py-3 max-w-5xl">
                <p className="font-black">Popey sert à remettre votre métier au centre de cette chaîne de valeur.</p>
              </div>
            </div>

            <div className="relative rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-4 md:p-5 overflow-hidden">
              <div className="absolute -top-8 -left-8 h-28 w-28 rounded-full bg-[#B6FF2B]/20 blur-2xl" />
              <p className="text-[11px] uppercase tracking-[0.18em] font-black text-white/70">Vous êtes ici</p>
              <div className="mt-3 relative h-[260px] rounded-xl border border-white/15 bg-black/50 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,rgba(182,255,43,0.15),transparent_40%)]" />
                <div className="absolute left-7 bottom-12 flex flex-col items-center gap-1 z-20">
                  <div className="h-7 w-7 rounded-full border-2 border-white" />
                  <div className="h-10 w-[3px] bg-white rounded-full" />
                  <div className="w-10 h-[3px] bg-white rounded-full -mt-8" />
                  <div className="h-8 w-[3px] bg-white rounded-full rotate-[20deg] origin-top translate-x-1" />
                  <div className="h-8 w-[3px] bg-white rounded-full -rotate-[20deg] origin-top -translate-x-1 -mt-8" />
                </div>
                <p className="absolute left-5 bottom-4 text-[10px] uppercase tracking-wide font-black text-white/70">Votre activité</p>

                <div className="absolute right-10 top-6 text-[10px] uppercase tracking-wide font-black text-white/65">Avant vous</div>
                <div className="absolute right-10 bottom-6 text-[10px] uppercase tracking-wide font-black text-white/65">Après vous</div>

                <div className="absolute right-[18%] top-[20%] h-[58%] w-[34%] perspective-[800px]">
                  <div className="absolute inset-y-0 left-0 w-[60%] rounded-l-lg bg-[#F4F4F4] shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    <div
                      className="absolute inset-0 origin-left rounded-l-lg bg-gradient-to-r from-white to-[#D8D8D8] border-l border-white/40 transition-transform duration-700"
                      style={{ transform: doorOpen ? "rotateY(-68deg)" : "rotateY(0deg)" }}
                    />
                  </div>
                  <div className="absolute inset-y-1 left-[56%] w-[40%] rounded-r-lg bg-[#B6FF2B]/20 border border-[#B6FF2B]/40 shadow-[0_0_30px_rgba(182,255,43,0.35)]" />
                </div>

                <div className="absolute left-[34%] top-[34%] h-[2px] w-[23%] bg-white/50 door-flow" />
                <div className="absolute left-[34%] top-[51%] h-[2px] w-[23%] bg-white/50 door-flow [animation-delay:1.2s]" />
                <div className="absolute right-4 top-24 rounded-full bg-white/10 border border-white/20 px-2 py-1 text-[10px] font-black">
                  {activeJourney === 0 ? "Client chez courtier" : activeJourney === 1 ? "Client chez architecte" : "Client chez CGP"}
                </div>
                <div className="absolute right-4 top-36 rounded-full bg-white/10 border border-white/20 px-2 py-1 text-[10px] font-black">
                  {activeJourney === 0 ? "Client chez cuisiniste" : activeJourney === 1 ? "Client chez déménageur" : "Client en conciergerie"}
                </div>
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#B6FF2B]">
                {doorOpen ? "La porte s’ouvre : vous entrez dans la boucle de valeur." : "La porte reste fermée : vos clients circulent sans vous."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black max-w-5xl">
            Avant Popey, votre réseau est passif. Après Popey, il devient une machine à opportunités.
          </h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-black/15 bg-[#F7F7F7] p-5">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Sans Popey</p>
              <ul className="mt-3 space-y-1.5 text-sm font-semibold text-black/80">
                <li>• 1 client = 1 vente</li>
                <li>• réseau informel</li>
                <li>• partenaires mal choisis</li>
                <li>• recommandations aléatoires</li>
                <li>• commissions floues ou inexistantes</li>
                <li>• dépendance à la prospection ou au hasard</li>
              </ul>
            </div>
            <div className="rounded-xl border border-black bg-black text-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Avec Popey</p>
              <ul className="mt-3 space-y-1.5 text-sm font-semibold">
                <li>• 1 client = 2 à 5 opportunités potentielles</li>
                <li>• 1 partenaire complémentaire activé intelligemment</li>
                <li>• 1 offre commune simple à vendre</li>
                <li>• recommandations traçables</li>
                <li>• commissions structurées</li>
                <li>• système duplicable Mois 1 → 2 → 3</li>
              </ul>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-black bg-white p-4 text-center">
            <p className="text-lg md:text-3xl font-black">1 client = 1 vente VS 1 client = 2 à 5 opportunités</p>
          </div>
          <div className="mt-6">
            <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:translate-y-[-1px] hover:shadow-[0_8px_0_0_#B6FF2B]">
              Postuler à l’Audit de Synergie
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="rounded-2xl bg-[#0B0B0B] p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Simulation revenus 6 mois</p>
              <p className="text-xs font-bold border border-white/30 rounded-full px-3 py-1">M{month}/6</p>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={cn("h-1 rounded-full", index < month ? "bg-[#B6FF2B]" : "bg-white/20")} />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide font-black">Pack duo</p>
                  <p className="text-xl font-black">{duoRevenue.toLocaleString("fr-FR")}€</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide font-black">Reco entrantes</p>
                  <p className="text-xl font-black">{incomingRevenue.toLocaleString("fr-FR")}€</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide font-black">Reco sortantes (10%)</p>
                  <p className="text-xl font-black">{commissionRevenue.toLocaleString("fr-FR")}€</p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-[#B6FF2B] text-black p-3">
              <p className="text-[11px] uppercase tracking-wide font-black">CA cumulé simulé à M{month}</p>
              <p className="text-3xl font-black">{totalRevenue.toLocaleString("fr-FR")}€</p>
            </div>
            <p className="mt-3 text-xs font-black uppercase tracking-wide text-white/90">{phaseMessage}</p>
          </div>
        </div>
      </section>

      <section id="parcours-v4" className="border-b border-black/10">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black">Parcours 3 mois</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <article className="rounded-xl border border-black/15 p-5 bg-white">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Mois 1</p>
              <h3 className="mt-2 text-xl font-black">Première synergie rentable</h3>
              <p className="mt-2 text-sm font-medium text-black/75">Création de votre 1er binôme et de votre offre DUO. Nous la créons entièrement pour vous et nous nous occupons de votre communication. Objectif : aller chercher des clients que vous n’avez pas encore.</p>
            </article>
            <article className="rounded-xl border border-black/15 p-5 bg-white">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Mois 2</p>
              <h3 className="mt-2 text-xl font-black">Duplication</h3>
              <p className="mt-2 text-sm font-medium text-black/75">2e partenaire, 2e source de revenu, recommandations en chaîne.</p>
            </article>
            <article className="rounded-xl border border-black/15 p-5 bg-white">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-black/60">Mois 3</p>
              <h3 className="mt-2 text-xl font-black">Ouverture de la sphère</h3>
              <p className="mt-2 text-sm font-medium text-black/75">Vous rejoignez l’ensemble des 20 métiers qui constituent toute la chaîne client. C’est à partir de là que la chaîne de recommandations s’active : 10% pour les apporteurs d’affaires et des clients pour ceux qui acceptent les mises en relation.</p>
            </article>
          </div>
          <div className="mt-6">
            <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:translate-y-[-1px] hover:shadow-[0_8px_0_0_#B6FF2B]">
              Postuler à l’Audit de Synergie
            </Link>
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

      <section className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-3xl md:text-5xl font-black max-w-4xl">Nous ne retenons pas tous les profils.</h2>
          <p className="mt-4 text-base md:text-lg font-medium text-black/80 max-w-5xl">
            Popey fonctionne mieux avec des professionnels qui ont déjà une expertise, vendent une offre claire, comprennent la réciprocité et peuvent activer une vraie complémentarité métier.
          </p>
          <p className="mt-4 text-base md:text-lg font-medium text-black/80 max-w-5xl">
            L’Audit de Synergie sert à vérifier si votre métier est compatible, quel partenaire activer en premier, et si une synergie rentable peut être construite rapidement.
          </p>
          <div className="mt-5 rounded-xl border border-black bg-white px-4 py-3 max-w-5xl">
            <p className="font-black">Si votre profil est validé, vous repartez avec une direction claire. Si ce n’est pas le bon moment, on vous le dira.</p>
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

      <div className="fixed bottom-3 left-3 right-3 z-50 md:left-auto md:right-6 md:w-[380px]">
        <Link href="/programme-commando/postuler" className="flex items-center justify-center rounded-md bg-[#B6FF2B] text-black px-4 py-4 md:py-3 text-base md:text-sm font-black uppercase tracking-wide shadow-[0_12px_30px_-12px_rgba(182,255,43,0.9)] transition hover:scale-[1.01]">
          Postuler à l’Audit de Synergie
        </Link>
      </div>
      <style jsx global>{`
        @keyframes doorFlow {
          0% { transform: translateX(0); opacity: 0.2; }
          50% { transform: translateX(8px); opacity: 0.7; }
          100% { transform: translateX(16px); opacity: 0.15; }
        }
        .door-flow {
          animation: doorFlow 1.6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
