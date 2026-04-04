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
    q: "Et si je n’ai pas une grosse audience ?",
    a: "Ce n’est pas un prérequis. Popey privilégie la complémentarité métier, la clarté de l’offre et la capacité d’exécution terrain.",
  },
  {
    q: "Et si je n’ai jamais travaillé avec un partenaire ?",
    a: "C’est justement le rôle de Popey : cadrer la collaboration, clarifier les rôles et structurer une première offre DUO simple à lancer.",
  },
  {
    q: "Est-ce que Popey me trouve le bon partenaire ou je dois le chercher moi-même ?",
    a: "Popey identifie et active le partenaire complémentaire avec vous. Vous ne partez pas d’une recherche à froid.",
  },
  {
    q: "Est-ce que l’offre DUO est créée avec moi ou je dois tout construire ?",
    a: "L’offre DUO est co-construite avec vous, puis packagée pour être comprise et vendue facilement.",
  },
  {
    q: "Est-ce que je dois passer des heures en réunions ?",
    a: "Non. Le système est conçu pour des points courts, des actions ciblées et une exécution efficace sans alourdir votre agenda.",
  },
];

export default function PopeyHumanTestV4Page() {
  const [tick, setTick] = useState(0);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showMetierModal, setShowMetierModal] = useState(false);
  const [problemSceneStarted, setProblemSceneStarted] = useState(false);
  const [activationTimelineStarted, setActivationTimelineStarted] = useState(false);
  const problemSectionRef = useRef<HTMLElement | null>(null);
  const problemTriggerRef = useRef<HTMLDivElement | null>(null);
  const problemAnimationRef = useRef<HTMLDivElement | null>(null);
  const activationSectionRef = useRef<HTMLElement | null>(null);
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
    const hasModalOpen = showCityModal || showMetierModal;
    if (!hasModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCityModal(false);
        setShowMetierModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showCityModal, showMetierModal]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const node = isMobile ? problemAnimationRef.current : problemSectionRef.current;
    if (!node || problemSceneStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const mobileShouldStart =
          isMobile &&
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.35 &&
          window.scrollY > 180;
        const desktopShouldStart =
          !isMobile &&
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.45 &&
          window.scrollY > 120;

        if (mobileShouldStart || desktopShouldStart) {
          setProblemSceneStarted(true);
          observer.disconnect();
        }
      },
      { threshold: isMobile ? [0, 0.2, 0.35, 0.6] : [0, 0.45, 0.7] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [problemSceneStarted]);

  useEffect(() => {
    const node = activationSectionRef.current;
    if (!node || activationTimelineStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35 && window.scrollY > 180) {
          setActivationTimelineStarted(true);
          observer.disconnect();
        }
      },
      { threshold: [0, 0.35, 0.6] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activationTimelineStarted]);

  return (
    <main className={cn("min-h-screen bg-[#F7F7F7] text-[#0B0B0B]", poppins.variable, "font-poppins")}>
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20 lg:min-h-[76vh] flex items-center">
          <div className="w-full">
            <h1 className="mt-2 text-5xl md:text-7xl font-black leading-[1.02] max-w-5xl">
              Ne cherchez plus vos clients, allez là où ils sont déjà.
              <br />
              <span className="inline-flex items-center gap-3">
                <span className="text-[#B6FF2B]">➜</span>
                Chez ceux qui vendent juste avant ou juste après vous.
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-2xl font-medium leading-relaxed text-black/75 max-w-4xl">
              Vos clients achètent déjà ailleurs. Popey vous aide à récupérer cette valeur en vous associant chaque mois à un partenaire stratégique et complémentaire pour générer :
            </p>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-4xl text-sm md:text-base font-black text-black/80">
              <li className="rounded-lg border border-black/10 bg-white px-4 py-2">- de nouveaux clients</li>
              <li className="rounded-lg border border-black/10 bg-white px-4 py-2">- des recommandations</li>
              <li className="rounded-lg border border-black/10 bg-white px-4 py-2">- des commissions</li>
              <li className="rounded-lg border border-black/10 bg-white px-4 py-2">- + de chiffre d&apos;affaires</li>
            </ul>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-4xl">
              <div className="rounded-xl border border-black/10 bg-white px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.12em] font-black text-black/60">Professionnels complémentaires intégrés</p>
                <p className="mt-1 text-2xl font-black">120+</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.12em] font-black text-black/60">Synergies déjà activées</p>
                <p className="mt-1 text-2xl font-black">340+</p>
              </div>
              <div className="rounded-xl border border-black/10 bg-white px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.12em] font-black text-black/60">1 objectif</p>
                <p className="mt-1 text-sm md:text-base font-black leading-snug">Plus de CA avec le partage clients</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/programme-commando/postuler" className="inline-flex items-center justify-center rounded-md bg-black text-white px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:translate-y-[-1px] hover:shadow-[0_8px_0_0_#B6FF2B]">
                Trouver mon partenaire stratégique
              </Link>
              <button
                type="button"
                onClick={() => setShowCityModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-black px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-black hover:text-white"
              >
                Voir si ma ville est disponible
              </button>
              <button
                type="button"
                onClick={() => setShowMetierModal(true)}
                className="inline-flex items-center justify-center rounded-md border border-black px-6 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-black hover:text-white"
              >
                Voir si mon métier est dans la liste
              </button>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-black/70">Audit 15 min • Sur sélection</p>
            <div className="mt-8 max-w-4xl rounded-2xl border border-black/10 bg-[#EEF4DF] p-4 md:p-5">
              <div className="hero-flow relative overflow-hidden rounded-xl border border-black/10 bg-white p-3 md:h-[260px] md:p-0">
                <div className="hero-steps flex flex-wrap items-center justify-center gap-2 md:absolute md:inset-x-0 md:top-4">
                  <p className="hero-step hero-step-1 rounded-full border border-black/15 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide">1. Matching</p>
                  <p className="hero-step hero-step-2 rounded-full border border-black/15 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide">2. Offre DUO</p>
                  <p className="hero-step hero-step-3 rounded-full border border-[#2F7A00]/25 bg-[#E9F9D9] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#2F7A00]">3. Nouveaux clients</p>
                </div>

                <div className="hero-cards mt-4 hidden md:flex items-center justify-between gap-2 md:contents">
                  <div className="hero-card hero-card-left relative w-[44%] rounded-xl border border-black/15 bg-white px-2.5 py-2 md:absolute md:left-[7%] md:top-[35%] md:w-[140px] md:p-3">
                    <p className="text-center text-xs md:text-base font-black uppercase tracking-[0.08em] md:tracking-[0.12em]">Vous</p>
                  </div>
                  <div className="hero-card hero-card-right relative w-[44%] rounded-xl border border-black/15 bg-white px-2.5 py-2 md:absolute md:right-[7%] md:top-[35%] md:w-[140px] md:p-3">
                    <p className="text-center text-xs md:text-base font-black uppercase tracking-[0.08em] md:tracking-[0.12em]">Partenaire clé</p>
                  </div>
                </div>

                <div className="hero-track relative mt-6 h-20 md:absolute md:inset-x-0 md:top-0 md:bottom-0 md:mt-0 md:h-auto">
                  <p className="absolute left-[8%] top-0 rounded-full border border-black/20 bg-[#F8FAF2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-black/85 md:hidden">Vous</p>
                  <p className="absolute right-[8%] top-0 rounded-full border border-[#2F7A00]/30 bg-[#E9F9D9] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#2F7A00] md:hidden">Partenaire clé</p>
                  <div className="hero-rail absolute left-[8%] right-[8%] top-[68%] h-[3px] -translate-y-1/2 md:left-[20%] md:right-[20%] md:top-[58%]">
                    <div className="hero-line hero-line-main relative h-full w-full rounded-full bg-black/15" />
                    <div className="hero-token hero-token-main absolute -top-[3px] left-0 h-2.5 w-2.5 rounded-full bg-[#2F7A00]" />
                  </div>
                  <div className="hero-hub absolute left-1/2 top-[68%] z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-[#B6FF2B] flex items-center justify-center text-[9px] font-black uppercase tracking-wide md:top-[58%] md:h-14 md:w-14 md:text-[10px]">Popey</div>
                </div>

                <div className="hero-status-wrap mt-4 hidden md:flex justify-center md:absolute md:inset-x-0 md:bottom-4 md:mt-0">
                  <div className="hero-status rounded-full border border-black/15 bg-white px-4 py-1.5">
                    <p className="text-center text-[10px] md:text-[11px] font-black uppercase tracking-[0.08em] md:tracking-[0.16em] text-black/70">Synergie en cours d’activation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={problemSectionRef} className="border-b border-black/10 bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Le problème à résoudre</p>
              <h2 className="mt-3 text-[46px] md:text-6xl font-black max-w-5xl leading-[1.08]">
                Vos clients achètent déjà ailleurs avant et après vous. Le problème, c’est que vous n’êtes pas dans la boucle.
              </h2>
              <p className="mt-6 text-[20px] md:text-xl font-medium leading-[1.45] text-white/85 max-w-5xl">
                Un client qui vous fait confiance continue souvent son parcours chez d’autres professionnels complémentaires : courtier, architecte d’intérieur, CGP, cuisiniste, déménageur, conciergerie privée.
              </p>
              <p className="mt-5 text-[20px] md:text-xl font-medium leading-[1.45] text-white/85 max-w-5xl">
                Si ces achats se font sans vous, vous laissez partir de la valeur, des recommandations, des commissions et des opportunités de fidélisation. Et les métiers hors de votre boucle ne vous recommandent pas non plus.
              </p>
              <div ref={problemTriggerRef} className="mt-6 rounded-xl border border-[#B6FF2B] bg-[#B6FF2B]/10 px-5 py-4 max-w-5xl">
                <p className="text-xl md:text-2xl font-black">Popey sert à remettre votre métier au centre de cette chaîne de valeur.</p>
              </div>
            </div>

            <div ref={problemAnimationRef} className="relative p-1 md:p-2 overflow-visible mt-8 lg:mt-12">
              <div className="absolute -top-8 -left-8 h-28 w-28 rounded-full bg-[#B6FF2B]/20 blur-2xl" />
              <div className="mt-8 relative h-[300px] md:h-[330px] overflow-visible">
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

                <div className="final-result absolute right-[6px] -bottom-4 md:bottom-1 text-[13px] md:text-[11px] font-black uppercase tracking-[0.14em] text-[#B6FF2B]" style={{ animationPlayState: problemSceneStarted ? "running" : "paused" }}>
                  Agent immo intégré à la sphère
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <h2 className="text-4xl md:text-5xl font-black leading-tight max-w-5xl">
            Avant Popey, votre réseau est passif. Après Popey, il devient une machine à opportunités.
          </h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-black/15 bg-[#F7F7F7] p-5">
              <p className="text-sm uppercase tracking-[0.2em] font-black text-black/60">Sans Popey</p>
              <ul className="mt-3 space-y-2 text-[18px] md:text-base font-semibold leading-[1.45] text-black/80">
                <li>• 1 client = 1 vente… puis il part dépenser ailleurs</li>
                <li>• vos partenaires ne pensent pas à vous au bon moment</li>
                <li>• vos recommandations sont floues et non suivies</li>
                <li>• vous laissez filer des commissions invisibles</li>
                <li>• votre croissance dépend encore de la prospection</li>
              </ul>
            </div>
            <div className="rounded-xl border border-black bg-black text-white p-5">
              <p className="text-sm uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Avec Popey</p>
              <ul className="mt-3 space-y-2 text-[18px] md:text-base font-semibold leading-[1.45]">
                <li>• 1 client peut déclencher plusieurs ventes complémentaires</li>
                <li>• vous activez un partenaire qui vous renvoie aussi des clients</li>
                <li>• vous vendez une offre DUO plus simple à comprendre</li>
                <li>• vos recommandations sont structurées et traçables</li>
                <li>• vous construisez une machine duplicable, pas un simple réseau</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <div className="rounded-2xl bg-[#0B0B0B] p-6 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-[#B6FF2B]">Simulation revenus 6 mois</p>
              <p className="text-sm font-bold border border-white/30 rounded-full px-3 py-1">M{month}/6</p>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={cn("h-1 rounded-full", index < month ? "bg-[#B6FF2B]" : "bg-white/20")} />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm uppercase tracking-wide font-black">Pack duo</p>
                  <p className="text-2xl font-black">{duoRevenue.toLocaleString("fr-FR")}€</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm uppercase tracking-wide font-black">Reco entrantes</p>
                  <p className="text-2xl font-black">{incomingRevenue.toLocaleString("fr-FR")}€</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/20 bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm uppercase tracking-wide font-black">Reco sortantes (10%)</p>
                  <p className="text-2xl font-black">{commissionRevenue.toLocaleString("fr-FR")}€</p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-[#B6FF2B] text-black p-3">
              <p className="text-xs uppercase tracking-wide font-black">CA cumulé simulé à M{month}</p>
              <p className="text-4xl font-black">{totalRevenue.toLocaleString("fr-FR")}€</p>
            </div>
            <p className="mt-3 text-sm font-black uppercase tracking-wide text-white/90">{phaseMessage}</p>
          </div>
        </div>
      </section>

      <section ref={activationSectionRef} className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <p className="text-sm uppercase tracking-[0.2em] font-black text-black/55">Plan d’activation</p>
          <h2 className="text-4xl md:text-5xl font-black">Ce que vous obtenez en 30 jours</h2>
          <div className={cn("timeline-wrap mt-6 rounded-2xl border border-black/10 bg-white p-5 md:p-6", activationTimelineStarted && "timeline-live")}>
            <div className="relative">
              <div className="timeline-line absolute left-3 top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#B6FF2B] via-black/25 to-[#B6FF2B]" />
              <div className="space-y-5">
                <article className="timeline-step timeline-step-1 relative pl-10">
                  <span className="timeline-dot absolute left-0 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#B6FF2B] bg-black text-[10px] font-black text-[#B6FF2B]">1</span>
                  <p className="text-xs uppercase tracking-[0.12em] font-black text-black/55">J+3</p>
                  <p className="mt-1 text-lg font-black">1 partenaire complémentaire</p>
                  <p className="mt-1 text-base md:text-lg text-black/70 font-medium">Partenaire validé selon votre offre et votre zone.</p>
                </article>
                <article className="timeline-step timeline-step-2 relative pl-10">
                  <span className="timeline-dot absolute left-0 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#B6FF2B] bg-black text-[10px] font-black text-[#B6FF2B]">2</span>
                  <p className="text-xs uppercase tracking-[0.12em] font-black text-black/55">J+15</p>
                  <p className="mt-1 text-lg font-black">1 offre DUO lancée</p>
                  <p className="mt-1 text-base md:text-lg text-black/70 font-medium">Offre créée puis promue sur vos réseaux et ceux de Popey.</p>
                </article>
                <article className="timeline-step timeline-step-3 relative pl-10">
                  <span className="timeline-dot absolute left-0 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#B6FF2B] bg-black text-[10px] font-black text-[#B6FF2B]">3</span>
                  <p className="text-xs uppercase tracking-[0.12em] font-black text-black/55">J+30</p>
                  <p className="mt-1 text-lg font-black">Reco + commissions cadrées</p>
                  <p className="mt-1 text-base md:text-lg text-black/70 font-medium">Logique de recommandation claire et commission traçable.</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">Exécution légère</p>
          <h2 className="text-3xl md:text-5xl font-black max-w-4xl">Un système rentable sans alourdir votre agenda</h2>
          <p className="mt-4 text-base md:text-lg font-medium text-black/80 max-w-5xl">
            Nous ne prenons que quelques minutes de votre temps pour vous donner une marche à suivre claire, des conseils ciblés et des actions prioritaires qui augmentent votre chiffre d’affaires sans alourdir votre agenda.
          </p>
          <div className="mt-6 grid md:grid-cols-3 gap-3 text-sm font-semibold">
            <div className="rounded-lg border border-black/10 bg-[#F7F7F7] px-4 py-3">Des points courts et structurés, orientés décision et exécution</div>
            <div className="rounded-lg border border-black/10 bg-[#F7F7F7] px-4 py-3">Un plan d’action simple à appliquer dans votre planning existant</div>
            <div className="rounded-lg border border-black/10 bg-[#F7F7F7] px-4 py-3">Une montée en valeur de vos clients actuels sans changer votre métier</div>
          </div>
          <div className="mt-5 rounded-xl border border-[#B6FF2B] bg-[#B6FF2B]/15 px-4 py-3 max-w-4xl">
            <p className="text-sm md:text-base font-black">Exemple simple : 1 offre DUO à 1 500€ + 2 recommandations commissionnées à 250€ = 2 000€ additionnels sur 30 jours. Ceci est sans compter l’essentiel : les nouveaux clients que vous attirez pour un chiffre d’affaires additionnel.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">Sélection de profils</p>
          <h2 className="text-5xl md:text-6xl font-black leading-tight">Pour qui / Pas pour qui</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <article className="rounded-xl border border-[#2F7A00]/25 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] font-black text-[#2F7A00]">Pour qui</p>
              <ul className="mt-3 space-y-2.5 text-[26px] md:text-2xl leading-[1.35] font-semibold text-black/80">
                <li>✓ Vous avez une offre claire et vendable</li>
                <li>✓ Vous voulez activer des synergies rapidement</li>
                <li>✓ Vous êtes prêt à exécuter un plan simple</li>
              </ul>
            </article>
            <article className="rounded-xl border border-black/15 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.16em] font-black text-black/65">Pas pour qui</p>
              <ul className="mt-3 space-y-2.5 text-[26px] md:text-2xl leading-[1.35] font-semibold text-black/75">
                <li>✕ Vous cherchez un système sans action terrain</li>
                <li>✕ Vous refusez la logique de réciprocité partenaire</li>
                <li>✕ Vous n’avez pas encore de base d’offre solide</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14">
          <p className="text-xs uppercase tracking-[0.2em] font-black text-black/55">FAQ rapide</p>
          <h2 className="text-5xl md:text-6xl font-black leading-tight">Questions fréquentes</h2>
          <div className="mt-7 space-y-3">
            {faqItems.map((item) => (
              <details key={item.q} className="rounded-xl border border-black/15 bg-white px-5 py-4">
                <summary className="cursor-pointer font-black text-[26px] md:text-[30px] leading-[1.25]">{item.q}</summary>
                <p className="mt-3 text-[22px] md:text-2xl leading-[1.45] font-medium text-black/75">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/10 bg-[#F5F5F5]">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-5xl md:text-6xl font-black leading-tight max-w-5xl">Nous ne retenons pas tous les profils.</h2>
          <p className="mt-5 text-[21px] md:text-2xl leading-[1.45] font-medium text-black/80 max-w-5xl">
            Popey fonctionne mieux avec des professionnels qui ont déjà une expertise, vendent une offre claire, comprennent la réciprocité et peuvent activer une vraie complémentarité métier.
          </p>
          <p className="mt-5 text-[21px] md:text-2xl leading-[1.45] font-medium text-black/80 max-w-5xl">
            L’Audit de Synergie sert à vérifier si votre métier est compatible, quel partenaire activer en premier, et si une synergie rentable peut être construite rapidement.
          </p>
          <div className="mt-5 rounded-xl border border-black bg-white px-4 py-3 max-w-5xl">
            <p className="text-[22px] md:text-2xl leading-[1.35] font-black">Si votre profil est validé, vous repartez avec une direction claire. Si ce n’est pas le bon moment, on vous le dira.</p>
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
              Trouver mon partenaire stratégique
            </Link>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-white/70">Audit court • Sur sélection • Sans engagement</p>
        </div>
      </section>

      <div className="fixed bottom-3 left-3 right-3 z-50 md:left-auto md:right-6 md:w-[380px]">
        <Link href="/programme-commando/postuler" className="flex items-center justify-center rounded-md bg-[#B6FF2B] text-black px-4 py-4 md:py-3 text-base md:text-sm font-black uppercase tracking-wide shadow-[0_12px_30px_-12px_rgba(182,255,43,0.9)] transition hover:scale-[1.01]">
          Trouver mon partenaire stratégique
        </Link>
      </div>

      {showCityModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowCityModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Disponibilité ville</p>
                <h3 className="mt-1 text-2xl font-black">Villes actuellement ouvertes</h3>
              </div>
              <button
                onClick={() => setShowCityModal(false)}
                className="rounded-md border border-black/15 px-2 py-1 text-xs font-black uppercase tracking-wide"
              >
                Fermer
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-[#2F7A00]/20 bg-[#E9F9D9] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] font-black text-[#2F7A00]">Ville disponible</p>
              <p className="mt-1 text-xl font-black text-[#1E4F00]">Bordeaux</p>
            </div>
          </div>
        </div>
      )}

      {showMetierModal && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={() => setShowMetierModal(false)}
        >
          <div
            className="w-full max-w-2xl h-[88dvh] sm:h-auto sm:max-h-[86vh] rounded-t-2xl sm:rounded-2xl border border-black/10 bg-white flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-black/10 bg-white px-4 py-3 sm:px-5 sm:py-4 rounded-t-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-black/55">Sphère habitat</p>
                  <h3 className="mt-1 text-xl sm:text-2xl font-black">20 métiers de la liste actuelle</h3>
                </div>
                <button
                  onClick={() => setShowMetierModal(false)}
                  className="rounded-md border border-black/15 px-3 py-1 text-xs font-black uppercase tracking-wide"
                >
                  Fermer
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm font-bold text-black/80">
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Agent immobilier</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Courtier</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Notaire</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Diagnostiqueur immobilier</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Assureur</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Architecte d'intérieur</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Architecte</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Maître d'oeuvre</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Artisan rénovation</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Électricien</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Plombier</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Menuisier</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Cuisiniste</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Home stager</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Photographe immobilier</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Déménageur</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Conciergerie privée</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Décorateur</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Expert-comptable</p>
              <p className="rounded-lg border border-black/10 bg-[#F7F7F7] px-3 py-2">Avocat immobilier</p>
              </div>
            </div>
            <div className="sticky bottom-0 border-t border-black/10 bg-white p-3 sm:hidden">
              <button
                onClick={() => setShowMetierModal(false)}
                className="h-11 w-full rounded-xl bg-black text-sm font-black uppercase tracking-wide text-white"
              >
                Fermer la liste
              </button>
            </div>
          </div>
        </div>
      )}
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
        @keyframes timelineGrow {
          0% { transform: scaleY(0); opacity: 0.25; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes timelineStepIn {
          0% { opacity: 0; transform: translateY(16px); filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes timelineDotPop {
          0% { transform: scale(0.65); box-shadow: 0 0 0 0 rgba(182,255,43,0.6); }
          70% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(182,255,43,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(182,255,43,0); }
        }
        @keyframes heroCardLeftIn {
          0%, 10% { opacity: 0; transform: translateX(-16px); }
          18%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroHubReveal {
          0%, 24% { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          34%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes heroHubBeat {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes heroCardRightIn {
          0%, 46% { opacity: 0; transform: translateX(16px); }
          56%, 100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes heroLineGrow {
          0%, 26% { transform: scaleX(0); opacity: 0.2; }
          38%, 100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes heroTokenFlow {
          0%, 36% { transform: translateX(0); opacity: 0; }
          42% { opacity: 1; }
          72% { transform: translateX(calc(100% - 10px)); opacity: 1; }
          82%, 100% { transform: translateX(calc(100% - 10px)); opacity: 0; }
        }
        @keyframes heroStepReveal1 {
          0%, 10%, 100% { opacity: 0.45; }
          18%, 34% { opacity: 1; }
        }
        @keyframes heroStepReveal2 {
          0%, 26%, 100% { opacity: 0.45; }
          36%, 56% { opacity: 1; }
        }
        @keyframes heroStepReveal3 {
          0%, 50%, 100% { opacity: 0.45; }
          60%, 86% { opacity: 1; }
        }
        @keyframes heroStatusReveal {
          0%, 74% { opacity: 0; transform: translateY(4px); }
          86%, 100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroHubTravelMobile {
          0% { transform: translate(-50%, -50%) translateX(calc(-1 * clamp(66px, 17vw, 90px))); }
          50% { transform: translate(-50%, -50%) translateX(clamp(66px, 17vw, 90px)); }
          100% { transform: translate(-50%, -50%) translateX(calc(-1 * clamp(66px, 17vw, 90px))); }
        }
        @keyframes heroHubRoll {
          0% { transform: translate(-50%, -50%) translateX(calc(-1 * var(--hub-travel))) rotate(-560deg); }
          100% { transform: translate(-50%, -50%) translateX(var(--hub-travel)) rotate(560deg); }
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
        .timeline-line {
          transform-origin: top;
          animation: timelineGrow 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) 1 both;
          animation-play-state: paused;
        }
        .timeline-step {
          animation: timelineStepIn 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) 1 both;
          animation-play-state: paused;
        }
        .timeline-step-1 {
          animation-delay: 0.18s;
        }
        .timeline-step-2 {
          animation-delay: 0.42s;
        }
        .timeline-step-3 {
          animation-delay: 0.66s;
        }
        .timeline-dot {
          animation: timelineDotPop 0.55s ease-out 1 both;
          animation-play-state: paused;
        }
        .timeline-step-1 .timeline-dot {
          animation-delay: 0.24s;
        }
        .timeline-step-2 .timeline-dot {
          animation-delay: 0.48s;
        }
        .timeline-step-3 .timeline-dot {
          animation-delay: 0.72s;
        }
        .timeline-live .timeline-line,
        .timeline-live .timeline-step,
        .timeline-live .timeline-dot {
          animation-play-state: running;
        }
        .hero-card-left {
          animation: none;
        }
        .hero-card-right {
          animation: none;
        }
        .hero-hub {
          --hub-travel: clamp(86px, 14vw, 168px);
          animation: heroHubRoll 4.8s linear infinite alternate;
        }
        .hero-line-main {
          transform-origin: left;
          animation: none;
        }
        .hero-token-main {
          display: none;
        }
        .hero-step-1 {
          animation: none;
        }
        .hero-step-2 {
          animation: none;
        }
        .hero-step-3 {
          animation: none;
        }
        .hero-status {
          animation: none;
        }
        @media (max-width: 767px) {
          .hero-hub {
            --hub-travel: clamp(50px, 17vw, 70px);
            animation-duration: 4.1s;
          }
        }
      `}</style>
    </main>
  );
}
