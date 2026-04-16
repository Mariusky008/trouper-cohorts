"use client";

import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type DemoInsight = {
  name: string;
  city: string;
  source: "LinkedIn" | "Wiki" | "Nostalgie";
  score: number;
  trait: string;
  badges: string[];
  actionHint: string;
  insight: string;
};

const DEMO_INSIGHTS: DemoInsight[] = [
  {
    name: "Nicolas B.",
    city: "Dax",
    source: "LinkedIn",
    score: 92,
    trait: "Proactif",
    badges: ["Immo", "Padel", "Negociateur"],
    actionHint: "Proposer un courtier premium",
    insight: "Aime des posts sur l immo cette semaine et commente sur les credits.",
  },
  {
    name: "Julie R.",
    city: "Dax",
    source: "Wiki",
    score: 78,
    trait: "Solaire",
    badges: ["Yoga", "Fine gueule", "Bons plans"],
    actionHint: "Envoyer un brise-glace bien-etre",
    insight: "2 eclaireurs la decrivent comme \"Solaire\" et tres connectrice.",
  },
  {
    name: "Karim T.",
    city: "Saint-Paul-les-Dax",
    source: "Nostalgie",
    score: 67,
    trait: "Loyal",
    badges: ["Rock", "Voyage", "Humour"],
    actionHint: "Reprise de lien sans pression",
    insight: "Tu l as ajoute le jour de la finale 2018. Bon moment pour reprendre contact.",
  },
];

export default function EclaireurLandingTestPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [contactsCount, setContactsCount] = useState(800);
  const [activeSection, setActiveSection] = useState("hero");
  const mainRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ container: mainRef });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-220, 220], [-12, 12]);
  const dragOpacity = useTransform(dragX, [-260, -40, 0, 40, 260], [0.15, 0.9, 1, 0.9, 0.15]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((value) => (value + 1) % DEMO_INSIGHTS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-snap-section]"));
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.getAttribute("data-snap-section");
        if (id) setActiveSection(id);
      },
      { root, threshold: [0.45, 0.7, 0.9] },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const sectionAnchors = [
    { id: "hero", label: "Hero" },
    { id: "etapes", label: "Etapes" },
    { id: "ia", label: "IA" },
    { id: "benefices", label: "Benefices" },
    { id: "securite", label: "Securite" },
    { id: "preuve", label: "Preuve" },
    { id: "simulateur", label: "Simulateur" },
  ] as const;

  const current = DEMO_INSIGHTS[activeIndex];
  const potential = useMemo(() => Math.round(contactsCount * 0.05 * 500), [contactsCount]);
  const sourceChipClass =
    current.source === "LinkedIn" ? "bg-[#46C3FF]/20 text-[#D8F2FF] border-[#46C3FF]/45" : current.source === "Wiki" ? "bg-[#B487FF]/20 text-[#F0E6FF] border-[#B487FF]/45" : "bg-[#FFBF66]/20 text-[#FFF0D8] border-[#FFBF66]/45";

  return (
    <main
      ref={mainRef}
      className="relative h-screen overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-mandatory md:h-auto md:overflow-visible md:snap-none bg-[radial-gradient(circle_at_15%_5%,#EEF3FF_0%,#F8FAFF_35%,#F2F4F9_100%)] text-[#111327]"
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -16, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[8%] top-20 h-40 w-40 rounded-full bg-[#7A92FF]/18 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -26, 0], y: [0, 20, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[10%] top-24 h-44 w-44 rounded-full bg-[#FFB94D]/18 blur-3xl"
        />
      </div>
      <motion.div className="fixed left-0 top-0 z-50 h-1 bg-gradient-to-r from-[#3B66FF] via-[#8A5BFF] to-[#FFB72C]" style={{ width: progressWidth }} />
      <div className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 sm:flex md:hidden">
        {sectionAnchors.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-label={section.label}
            onClick={() =>
              mainRef.current
                ?.querySelector<HTMLElement>(`[data-snap-section="${section.id}"]`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className={`h-2.5 w-2.5 rounded-full border transition ${
              activeSection === section.id ? "scale-125 border-[#3B66FF] bg-[#3B66FF]" : "border-[#8A96BF] bg-white/80"
            }`}
          />
        ))}
      </div>

      <section data-snap-section="hero" className="relative snap-start min-h-screen md:min-h-0 mx-auto max-w-6xl px-4 pb-12 pt-10 sm:pt-16 flex items-center">
        <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-black tracking-wide text-[#3B66FF] shadow-[8px_8px_18px_#DCE2F3,-8px_-8px_18px_#FFFFFF]">
          Daily Scan Eclaireurs • Dax
        </div>
        <div className="mt-6 grid gap-10 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">Dax n a plus de secrets pour vous.</h1>
            <p className="mt-4 max-w-xl text-base text-[#30354F] sm:text-lg">
              Chaque matin, Popey analyse 10 de vos contacts et vous livre une pepite. Un besoin client, une anecdote fun ou un secret partage. Sans effort,
              devenez la personne la mieux informee de la ville.
            </p>
            <button className="mt-6 rounded-2xl bg-gradient-to-r from-[#3B66FF] to-[#8A5BFF] px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[10px_10px_22px_#D3DAEE,-8px_-8px_18px_#FFFFFF]">
              Rejoindre l Armee des Eclaireurs 🚀
            </button>
          </div>

          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 0.8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto w-full max-w-sm rounded-[2rem] bg-[#EEF2FF] p-3 shadow-[18px_18px_32px_#D5DCEF,-14px_-14px_26px_#FFFFFF]"
          >
            <div className="relative rounded-[1.6rem] bg-gradient-to-b from-[#16223F] via-[#1B2650] to-[#11182F] p-4 text-white shadow-[inset_4px_4px_14px_rgba(255,255,255,0.06),inset_-4px_-4px_14px_rgba(0,0,0,0.35)]">
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.03, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-0 rounded-[1.6rem] border border-cyan-300/15"
              />
              <p className="text-center text-[11px] font-black uppercase tracking-[0.12em] text-[#9FD0FF]">Flashcard interactive</p>
              <motion.div
                drag="x"
                dragConstraints={{ left: -220, right: 220 }}
                style={{ x: dragX, rotate: dragRotate, opacity: dragOpacity }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 80 || info.offset.x < -80) setActiveIndex((value) => (value + 1) % DEMO_INSIGHTS.length);
                  dragX.set(0);
                }}
                className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4 cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`rounded-full border px-2 py-1 font-black ${sourceChipClass}`}>{current.source}</span>
                  <span>{current.city}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-base font-black">
                    {current.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-tight">{current.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.11em] text-white/70">Score signal: {current.score}/100</p>
                  </div>
                </div>
                <p className="mt-3 rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-sm text-white/90">{current.insight}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {current.badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white/90">
                      {badge}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[#FCD27C]">Action suggeree: {current.actionHint}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button className="h-8 rounded-lg border border-cyan-300/40 bg-cyan-500/15 text-[10px] font-black uppercase tracking-wide">⭐ Matcher</button>
                  <button className="h-8 rounded-lg border border-fuchsia-300/40 bg-fuchsia-500/15 text-[10px] font-black uppercase tracking-wide">📝 Signal</button>
                  <button className="h-8 rounded-lg border border-emerald-300/40 bg-emerald-500/15 text-[10px] font-black uppercase tracking-wide">💬 Ping</button>
                </div>
              </motion.div>
              <p className="mt-3 text-center text-xs text-[#A8B8E8]">Glissez la carte pour tester le swipe</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section data-snap-section="etapes" className="snap-start min-h-screen md:min-h-0 mx-auto max-w-6xl px-4 py-10 flex items-center">
        <h2 className="text-3xl font-black sm:text-5xl">Le Daily en 3 etapes</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <motion.article whileHover={{ y: -4 }} className="rounded-3xl bg-[#EEF2FF] p-5 shadow-[12px_12px_24px_#D3DAEE,-10px_-10px_22px_#FFFFFF]">
            <p className="text-3xl">🛰️</p>
            <h3 className="mt-3 text-lg font-black">L IA Scrutatrice</h3>
            <p className="mt-2 text-sm text-[#373D58]">Pendant que vous dormez, l IA scanne le web, LinkedIn et les signaux de la ville pour 10 proches.</p>
          </motion.article>
          <motion.article whileHover={{ y: -4 }} className="rounded-3xl bg-[#EEF2FF] p-5 shadow-[12px_12px_24px_#D3DAEE,-10px_-10px_22px_#FFFFFF]">
            <p className="text-3xl">🃏</p>
            <h3 className="mt-3 text-lg font-black">La Flashcard Matinale</h3>
            <p className="mt-2 text-sm text-[#373D58]">A 8h, decouvrez 10 fiches utiles: job qui bouge, passion, besoin latent ou opportunite business.</p>
          </motion.article>
          <motion.article whileHover={{ y: -4 }} className="rounded-3xl bg-[#EEF2FF] p-5 shadow-[12px_12px_24px_#D3DAEE,-10px_-10px_22px_#FFFFFF]">
            <p className="text-3xl">⚡</p>
            <h3 className="mt-3 text-lg font-black">Le Swipe Malin</h3>
            <p className="mt-2 text-sm text-[#373D58]">Swipez. Si c est business, encaissez. Si c est fun, souriez. Si c est inutile, passez.</p>
          </motion.article>
        </div>
      </section>

      <section data-snap-section="ia" className="snap-start min-h-screen md:min-h-0 mx-auto max-w-6xl px-4 py-10 flex items-center">
        <h2 className="text-3xl font-black sm:text-5xl">L IA intelligente</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <motion.article whileHover={{ scale: 1.02 }} className="rounded-3xl bg-gradient-to-br from-[#DBE8FF] to-[#EEF3FF] p-5 shadow-[12px_12px_24px_#D3DAEE,-10px_-10px_22px_#FFFFFF]">
            <span className="rounded-full bg-[#3B66FF] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">Externa API</span>
            <h3 className="mt-3 text-lg font-black">Le Radar Digital</h3>
            <p className="mt-2 text-sm text-[#373D58]">Detecte si Nicolas like des posts immo ou si sa boite lance un recrutement.</p>
          </motion.article>
          <motion.article whileHover={{ scale: 1.02 }} className="rounded-3xl bg-gradient-to-br from-[#EFE3FF] to-[#F5EEFF] p-5 shadow-[12px_12px_24px_#D3DAEE,-10px_-10px_22px_#FFFFFF]">
            <span className="rounded-full bg-[#8A5BFF] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">Wiki-Reseau</span>
            <h3 className="mt-3 text-lg font-black">Le Wiki-Reseau</h3>
            <p className="mt-2 text-sm text-[#373D58]">Badges talents, passions cachees et micro-astuces partages anonymement.</p>
          </motion.article>
          <motion.article whileHover={{ scale: 1.02 }} className="rounded-3xl bg-gradient-to-br from-[#FFEFD2] to-[#FFF7E8] p-5 shadow-[12px_12px_24px_#D3DAEE,-10px_-10px_22px_#FFFFFF]">
            <span className="rounded-full bg-[#FF9A2F] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">Metadata locale</span>
            <h3 className="mt-3 text-lg font-black">La Capsule Temporelle</h3>
            <p className="mt-2 text-sm text-[#373D58]">Rappelle un contexte historique utile quand aucune actu n est disponible.</p>
          </motion.article>
        </div>
      </section>

      <section data-snap-section="benefices" className="snap-start min-h-screen md:min-h-0 mx-auto max-w-6xl px-4 py-10 flex items-center">
        <h2 className="text-3xl font-black sm:text-5xl">Pourquoi devenir Eclaireur ?</h2>
        <div className="mt-6 space-y-3">
          <motion.p initial={{ opacity: 0.85, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm shadow-[10px_10px_22px_#D3DAEE,-8px_-8px_18px_#FFFFFF]">
            <span className="font-black">Le Gain:</span> J ai recommande mon voisin a un pro Habitat. Resultat: 300€ sans avoir rien vendu.
          </motion.p>
          <motion.p initial={{ opacity: 0.85, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="ml-auto max-w-[85%] rounded-2xl bg-[#E6EEFF] px-4 py-3 text-sm shadow-[10px_10px_22px_#D3DAEE,-8px_-8px_18px_#FFFFFF]">
            <span className="font-black">Le Lien:</span> Popey m a donne un contexte pour reprendre contact avec un ancien collegue.
          </motion.p>
          <motion.p initial={{ opacity: 0.85, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="max-w-[85%] rounded-2xl bg-[#FFF2D9] px-4 py-3 text-sm shadow-[10px_10px_22px_#D3DAEE,-8px_-8px_18px_#FFFFFF]">
            <span className="font-black">La Curiosite:</span> C est mon horoscope 2.0. Je l ouvre avant Instagram.
          </motion.p>
        </div>
      </section>

      <section data-snap-section="securite" className="snap-start min-h-screen md:min-h-0 mx-auto max-w-6xl px-4 py-10 flex items-center">
        <div className="rounded-3xl bg-[#EEF2FF] p-6 shadow-[14px_14px_28px_#D3DAEE,-10px_-10px_22px_#FFFFFF]">
          <h2 className="text-3xl font-black sm:text-4xl">Transparence & Securite</h2>
          <p className="mt-4 text-sm text-[#363C56]">
            <span className="font-black">Zero Espionnage:</span> nous ne lisons pas vos messages. Les numeros sont haches (SHA-256) pour l anonymat.
          </p>
          <p className="mt-2 text-sm text-[#363C56]">
            <span className="font-black">Controle Total:</span> votre repertoire, vos donnees, vos choix de partage.
          </p>
          <div className="mt-6 rounded-2xl bg-white p-4 shadow-[inset_6px_6px_12px_#DCE2F3,inset_-6px_-6px_12px_#FFFFFF]">
            <p className="text-sm font-black">Connecteur annuaire ultra-fluide (preview)</p>
            <p className="mt-1 text-xs text-[#5E657E]">Objectif onboarding: moins de clics, plus d eclaireurs actifs.</p>
          </div>
        </div>
      </section>

      <section data-snap-section="preuve" className="snap-start min-h-screen md:min-h-0 mx-auto max-w-6xl px-4 pb-20 pt-4 flex items-center">
        <motion.div
          animate={{ scale: [1, 1.015, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-2xl bg-gradient-to-r from-[#1B2D6B] via-[#2F3FA0] to-[#4A3CC4] px-4 py-3 text-center text-sm font-black text-white shadow-[12px_12px_24px_#C9D0E8,-10px_-10px_20px_#FFFFFF]"
        >
          Deja 12 450 secrets reveles a Dax cette semaine.
        </motion.div>
      </section>

      <section data-snap-section="simulateur" className="snap-start min-h-screen md:min-h-0 mx-auto max-w-6xl px-4 pb-24 flex items-center">
        <div className="rounded-3xl bg-white p-5 shadow-[12px_12px_24px_#D3DAEE,-10px_-10px_22px_#FFFFFF]">
          <label className="text-xs font-black uppercase tracking-wide text-[#4A5172]">Simulateur potentiel</label>
          <input
            type="range"
            min={100}
            max={2000}
            step={10}
            value={contactsCount}
            onChange={(event) => setContactsCount(Number(event.target.value))}
            className="mt-3 w-full"
          />
          <p className="mt-2 text-sm text-[#4A5172]">Contacts: {contactsCount}</p>
          <p className="mt-2 text-xl font-black text-[#2F3FA0]">Potentiel estime: {potential.toLocaleString("fr-FR")} € / an</p>
        </div>
      </section>
    </main>
  );
}
