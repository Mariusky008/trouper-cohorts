"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
    q: "Que se passe-t-il concrètement en 30 jours ?",
    a: "Vous activez un partenaire complémentaire, une offre DUO créée avec vous et promue sur vos réseaux ainsi que ceux de Popey, une logique de recommandation claire et un cadre de commission traçable.",
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
  const [problemSceneStarted, setProblemSceneStarted] = useState(false);
  const problemSectionRef = useRef<HTMLElement | null>(null);
  const month = (tick % 6) + 1;
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

  useEffect(() => {
    const node = problemSectionRef.current;
    if (!node || problemSceneStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45 && window.scrollY > 120) {
          setProblemSceneStarted(true);
          observer.disconnect();
        }
      },
      { threshold: [0, 0.45, 0.7] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [problemSceneStarted]);

  return (
    <main className={cn("min-h-screen bg-[#F7F7F7] text-[#0B0B0B]", poppins.variable, "font-poppins")}>
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-16 lg:min-h-[72vh] flex items-center">
          <div className="w-full">
            <h1 className="mt-2 text-4xl md:text-6xl font-black leading-[1.04] max-w-5xl">
              Ne cherchez plus vos clients, allez là où ils sont déjà.
              <br />
              <span className="inline-flex items-center gap-3">
                <span className="text-[#B6FF2B]">➜</span>
                Chez ceux qui vendent juste avant ou juste après vous.
              </span>
            </h1>
            <p className="mt-4 text-base md:text-lg font-medium text-black/80 max-w-3xl">
              Arrêtez de prospecter seul. Popey vous associe chaque mois à un partenaire stratégique et crée votre Pack Duo clé en main pour transformer l’alliance en chiffre d’affaires.
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-4xl">
              <div className="rounded-lg border border-black/10 bg-white px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.12em] font-black text-black/60">Pros intégrés</p>
                <p className="mt-1 text-xl font-black">120+</p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.12em] font-black text-black/60">Synergies activées</p>
                <p className="mt-1 text-xl font-black">340+</p>
              </div>
              <div className="rounded-lg border border-black/10 bg-white px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.12em] font-black text-black/60">CA généré</p>
                <p className="mt-1 text-xl font-black">1,2M€</p>
              </div>
            </div>
            <p className="mt-3 inline-flex rounded-full border border-black/20 bg-[#B6FF2B]/30 px-4 py-1.5 text-xs md:text-sm font-black uppercase tracking-wide">
              Objectif : activer 3 flux de revenus complémentaires en 6 mois grâce à un écosystème de 19 métiers partenaires.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:translate-y-[-1px] hover:shadow-[0_8px_0_0_#B6FF2B]">
                Je veux ma 1ère synergie rentable
              </Link>
              <a href="#parcours-v4" className="inline-flex items-center justify-center rounded-md border border-black px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-black hover:text-white">
                Voir le parcours 3 mois
              </a>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-black/70">Audit 15 min • Sur sélection</p>
          </div>
        </div>
      </section>

      <section ref={problemSectionRef} className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
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
                Si ces achats se font sans vous, vous laissez partir de la valeur, des recommandations, des commissions et des opportunités de fidélisation. Et les métiers hors de votre boucle ne vous recommandent pas non plus.
              </p>
              <div className="mt-4 rounded-xl border border-[#B6FF2B] bg-[#B6FF2B]/10 px-4 py-3 max-w-5xl">
                <p className="font-black">Popey sert à remettre votre métier au centre de cette chaîne de valeur.</p>
              </div>
            </div>

            <div className="relative p-1 md:p-2 overflow-visible">
              <div className="absolute -top-8 -left-8 h-28 w-28 rounded-full bg-[#B6FF2B]/20 blur-2xl" />
              <div className="mt-2 relative h-[300px] md:h-[330px] overflow-visible">
                <div className="absolute left-0 right-0 bottom-9 h-[2px] bg-white/25" />

                <div className="walk-man absolute left-2 bottom-9 z-20 h-[102px] w-14" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full border-[3px] border-white" />
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 h-14 w-[4px] bg-white rounded-full" />
                  <div className="absolute top-[48px] left-1/2 -translate-x-1/2 w-10 h-[4px] bg-white rounded-full" />
                  <div className="walk-leg-left absolute top-[66px] left-1/2 h-11 w-[4px] bg-white rounded-full origin-top" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }} />
                  <div className="walk-leg-right absolute top-[66px] left-1/2 h-11 w-[4px] bg-white rounded-full origin-top" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }} />
                </div>

                <div className="absolute right-3 bottom-9 h-[290px] w-[206px] rounded-t-[36px] border-[4px] border-white/85 bg-white/5">
                  <div className="door-light absolute -inset-5 rounded-full bg-[#B6FF2B]/25 blur-2xl" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }} />
                  <div className="door-open absolute inset-y-[8px] left-[8px] right-[8px] rounded-t-[26px] border border-white/35 bg-white shadow-[0_0_30px_rgba(255,255,255,0.45)] origin-left" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }}>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-black/35" />
                    <div className="px-3 pt-4 pb-3">
                      <div className="grid grid-cols-1 gap-2 text-[11px] leading-none font-bold tracking-[0.03em] text-black/75">
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Courtier</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Architecte</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• CGP</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Cuisiniste</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Déménageur</p>
                        <p className="rounded-md border border-black/10 bg-[#F3F4F6] px-2.5 py-1.5">• Conciergerie</p>
                        <p className="added-role inline-flex items-center gap-2 rounded-md border border-[#2F7A00]/35 bg-[#E9F9D9] px-2.5 py-1.5 font-black text-[#2F7A00]" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }}><span className="added-check inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#2F7A00] text-[10px] text-white">✓</span>+ Agent immo</p>
                      </div>
                    </div>
                  </div>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[13px] font-black uppercase tracking-[0.2em] text-[#B6FF2B]">Popey</span>
                </div>

                <div className="final-result absolute right-[6px] bottom-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#B6FF2B]" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }}>
                  Agent immo intégré à la sphère
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
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
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
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
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
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
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">Plan d’activation</p>
          <h2 className="text-3xl md:text-5xl font-black">Ce que vous obtenez en 30 jours</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-3 text-sm font-semibold">
            <article className="rounded-lg bg-white border border-black/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.12em] font-black text-black/55">J+7</p>
              <p className="mt-2 font-black">1 partenaire complémentaire</p>
              <p className="mt-1 text-black/70 font-medium">Partenaire validé selon votre offre et votre zone.</p>
            </article>
            <article className="rounded-lg bg-white border border-black/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.12em] font-black text-black/55">J+15</p>
              <p className="mt-2 font-black">1 offre DUO lancée</p>
              <p className="mt-1 text-black/70 font-medium">Offre créée puis promue sur vos réseaux et ceux de Popey.</p>
            </article>
            <article className="rounded-lg bg-white border border-black/10 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.12em] font-black text-black/55">J+30</p>
              <p className="mt-2 font-black">Reco + commissions cadrées</p>
              <p className="mt-1 text-black/70 font-medium">Logique de recommandation claire et commission traçable.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">Exécution légère</p>
          <h2 className="text-3xl md:text-5xl font-black max-w-4xl">Votre temps et votre planning sont ROI.</h2>
          <p className="mt-4 text-base md:text-lg font-medium text-black/80 max-w-5xl">
            Nous ne prenons que quelques minutes de votre temps pour vous donner une marche à suivre claire, des conseils ciblés et des actions prioritaires qui augmentent votre chiffre d’affaires sans alourdir votre agenda.
          </p>
          <div className="mt-6 grid md:grid-cols-3 gap-3 text-sm font-semibold">
            <div className="rounded-lg border border-black/10 bg-[#F7F7F7] px-4 py-3">Des points courts et structurés, orientés décision et exécution</div>
            <div className="rounded-lg border border-black/10 bg-[#F7F7F7] px-4 py-3">Un plan d’action simple à appliquer dans votre planning existant</div>
            <div className="rounded-lg border border-black/10 bg-[#F7F7F7] px-4 py-3">Une montée en valeur de vos clients actuels sans changer votre métier</div>
          </div>
          <div className="mt-5 rounded-xl border border-[#B6FF2B] bg-[#B6FF2B]/15 px-4 py-3 max-w-4xl">
            <p className="text-sm md:text-base font-black">Exemple simple : 1 offre DUO à 1 500€ + 2 recommandations commissionnées à 250€ = 2 000€ additionnels sur 30 jours.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">Sélection de profils</p>
          <h2 className="text-3xl md:text-5xl font-black">Pour qui / Pas pour qui</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <article className="rounded-xl border border-[#2F7A00]/25 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] font-black text-[#2F7A00]">Pour qui</p>
              <ul className="mt-3 space-y-1.5 text-sm font-semibold text-black/80">
                <li>• Vous avez une offre claire et vendable</li>
                <li>• Vous voulez activer des synergies rapidement</li>
                <li>• Vous êtes prêt à exécuter un plan simple</li>
              </ul>
            </article>
            <article className="rounded-xl border border-black/15 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] font-black text-black/65">Pas pour qui</p>
              <ul className="mt-3 space-y-1.5 text-sm font-semibold text-black/75">
                <li>• Vous cherchez un système sans action terrain</li>
                <li>• Vous refusez la logique de réciprocité partenaire</li>
                <li>• Vous n’avez pas encore de base d’offre solide</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">FAQ rapide</p>
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
        @keyframes walkToPopey {
          0% { transform: translateX(0) translateY(0); opacity: 1; }
          20% { transform: translateX(56px) translateY(-2px); opacity: 1; }
          40% { transform: translateX(116px) translateY(0); opacity: 1; }
          60% { transform: translateX(188px) translateY(-2px); opacity: 1; }
          76% { transform: translateX(248px) translateY(0); opacity: 1; }
          84% { transform: translateX(278px) translateY(0); opacity: 1; }
          92% { transform: translateX(294px) translateY(0); opacity: 0; }
          100% { transform: translateX(294px) translateY(0); opacity: 0; }
        }
        @keyframes doorOpenLoop {
          0%, 54% { transform: rotateY(0deg); }
          68%, 82% { transform: rotateY(-82deg); }
          93%, 100% { transform: rotateY(0deg); }
        }
        @keyframes legSwingLeft {
          0%, 100% { transform: translateX(-4px) rotate(24deg); }
          50% { transform: translateX(-4px) rotate(-24deg); }
        }
        @keyframes legSwingRight {
          0%, 100% { transform: translateX(4px) rotate(-24deg); }
          50% { transform: translateX(4px) rotate(24deg); }
        }
        @keyframes enterGlow {
          0%, 70% { opacity: 0.15; transform: scale(0.85); }
          82%, 100% { opacity: 0.55; transform: scale(1.05); }
        }
        @keyframes revealAddedRole {
          0%, 86% { opacity: 0; transform: translateY(4px); }
          94%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes popCheck {
          0%, 90% { transform: scale(0.5); opacity: 0; }
          95% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes revealFinalResult {
          0%, 90% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .walk-man {
          animation: walkToPopey 6.8s ease-in-out 1 forwards;
        }
        .walk-leg-left {
          animation: legSwingLeft 0.45s ease-in-out 15 forwards;
        }
        .walk-leg-right {
          animation: legSwingRight 0.45s ease-in-out 15 forwards;
        }
        .door-open {
          animation: doorOpenLoop 6.8s ease-in-out 1 forwards;
        }
        .door-light {
          animation: enterGlow 6.8s ease-in-out 1 forwards;
        }
        .added-role {
          animation: revealAddedRole 6.8s ease-in-out 1 forwards;
        }
        .added-check {
          animation: popCheck 6.8s ease-in-out 1 forwards;
        }
        .final-result {
          animation: revealFinalResult 6.8s ease-in-out 1 forwards;
        }
      `}</style>
    </main>
  );
}
