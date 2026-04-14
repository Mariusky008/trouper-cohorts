"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const CONTACT_FLOW = ["Claire R.", "Jean-Mi B.", "Sophie T.", "Nicolas G.", "Laura T."];

export default function EclaireurLandingTestPage() {
  const [contactsCount, setContactsCount] = useState(800);
  const [activeContactIndex, setActiveContactIndex] = useState(0);
  const [pointer, setPointer] = useState({ x: 300, y: 220 });
  const howItWorksRef = useRef<HTMLDivElement | null>(null);
  const methodRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll();
  const { scrollYProgress: methodProgress } = useScroll({
    target: methodRef,
    offset: ["start end", "end start"],
  });
  const { scrollYProgress: howProgress } = useScroll({
    target: howItWorksRef,
    offset: ["start center", "end center"],
  });

  const glowingWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const methodBar = useTransform(methodProgress, [0, 1], [0, 100]);
  const phoneGlow = useTransform(howProgress, [0, 1], [0.35, 0.95]);

  const step = useTransform(howProgress, [0, 0.33, 0.66, 1], [0, 1, 2, 2]);
  const [currentStep, setCurrentStep] = useState(0);
  useEffect(() => {
    return step.on("change", (value) => setCurrentStep(Math.round(value)));
  }, [step]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveContactIndex((value) => (value + 1) % CONTACT_FLOW.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  const estimatedAnnual = useMemo(() => Math.round(contactsCount * 0.05 * 500), [contactsCount]);

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-black text-white"
      onMouseMove={(event) => setPointer({ x: event.clientX, y: event.clientY })}
      onTouchMove={(event) => {
        const touch = event.touches[0];
        if (!touch) return;
        setPointer({ x: touch.clientX, y: touch.clientY });
      }}
    >
      <motion.div className="fixed left-0 top-0 z-40 h-1 bg-gradient-to-r from-[#00FF9D] via-cyan-300 to-[#00FF9D]" style={{ width: glowingWidth }} />
      <div className="pointer-events-none fixed inset-0 z-10">
        <div
          className="absolute h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00FF9D]/20 blur-3xl"
          style={{ left: pointer.x, top: pointer.y }}
        />
      </div>

      <section className="relative z-20 mx-auto max-w-6xl px-4 pb-20 pt-12 sm:pt-16">
        <div className="rounded-full border border-[#00FF9D]/30 bg-[#00FF9D]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-[#8CFFD1] w-fit">
          [ Nouveau ] Le Daily Scanning débarque à Dax
        </div>
        <div className="mt-6 grid items-center gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">Votre répertoire téléphonique vaut de l or.</h1>
            <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
              Activez le Daily Scan Popey. 2 minutes par jour pour aider vos proches et générer jusqu à un SMIC de commissions par mois.
            </p>
            <button className="mt-6 rounded-2xl border border-[#00FF9D]/30 bg-gradient-to-r from-[#00FF9D] via-cyan-300 to-[#00FF9D] px-6 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[0_0_35px_rgba(0,255,157,0.35)]">
              Commencer mon scan gratuit
            </button>
          </div>

          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto w-full max-w-sm rounded-[2.2rem] border border-white/20 bg-white/5 p-3 backdrop-blur"
          >
            <div className="rounded-[1.8rem] border border-white/15 bg-gradient-to-b from-[#061019] to-[#02120D] p-4">
              <p className="text-center text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Daily scan en direct</p>
              <div className="mt-4 space-y-2">
                {CONTACT_FLOW.map((name, index) => (
                  <div
                    key={name}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      index === activeContactIndex
                        ? "border-[#00FF9D]/50 bg-[#00FF9D]/10 text-[#CFFFF0]"
                        : "border-white/10 bg-black/25 text-white/70"
                    }`}
                  >
                    {name}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-[#EAC886]/30 bg-[#1A1510] px-3 py-2 text-sm text-[#F2D9A2]">
                Contact révélé: {CONTACT_FLOW[activeContactIndex]} • Potentiel commission détecté €
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section ref={methodRef} className="relative z-20 mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-black sm:text-5xl">La méthode 20 / 40</h2>
        <p className="mt-3 text-white/75">20 contacts par matin. 40 jours pour changer de vie.</p>
        <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
          <div className="h-3 rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-[#00FF9D] to-cyan-300" style={{ width: useTransform(methodBar, (v) => `${v}%`) }} />
          </div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Jour 0 : 800 contacts endormis</p>
            <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Jour 20 : 400 contacts qualifiés</p>
            <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Jour 40 : réseau machine de guerre</p>
          </div>
        </div>
      </section>

      <section ref={howItWorksRef} className="relative z-20 mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-black sm:text-5xl">Swipez. Recommandez. Encaissez.</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <article className={`rounded-2xl border p-4 transition ${currentStep === 0 ? "border-[#00FF9D]/45 bg-[#00FF9D]/10" : "border-white/10 bg-black/20"}`}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Étape 1</p>
              <h3 className="mt-1 text-xl font-black">Swipez</h3>
              <p className="text-sm text-white/75">L IA réveille les besoins cachés de vos proches.</p>
            </article>
            <article className={`rounded-2xl border p-4 transition ${currentStep === 1 ? "border-[#00FF9D]/45 bg-[#00FF9D]/10" : "border-white/10 bg-black/20"}`}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Étape 2</p>
              <h3 className="mt-1 text-xl font-black">Recommandez</h3>
              <p className="text-sm text-white/75">Mettez-les en relation avec les cracks de Dax en 3 clics.</p>
            </article>
            <article className={`rounded-2xl border p-4 transition ${currentStep === 2 ? "border-[#00FF9D]/45 bg-[#00FF9D]/10" : "border-white/10 bg-black/20"}`}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200">Étape 3</p>
              <h3 className="mt-1 text-xl font-black">Encaissez</h3>
              <p className="text-sm text-white/75">Suivez vos commissions en temps réel. Argent validé, prêt à être viré.</p>
            </article>
          </div>

          <motion.div style={{ opacity: phoneGlow }} className="rounded-[2rem] border border-white/20 bg-white/5 p-3 backdrop-blur">
            <div className="rounded-[1.6rem] border border-white/15 bg-[#071018] p-4">
              {currentStep === 0 && (
                <div className="rounded-xl border border-[#00FF9D]/30 bg-[#00FF9D]/10 p-4 text-center">
                  <p className="text-xs text-white/70">Carte contact</p>
                  <p className="text-2xl font-black">Jean-Mi B.</p>
                  <p className="mt-3 text-sm text-[#9CF6D1]">Swipe à droite détecté</p>
                </div>
              )}
              {currentStep === 1 && (
                <div className="space-y-2">
                  <p className="text-xs text-white/70">Pros compatibles</p>
                  <div className="rounded-lg border border-white/15 bg-black/20 p-2 text-sm">Camille Durand • Courtier • Dax</div>
                  <div className="rounded-lg border border-white/15 bg-black/20 p-2 text-sm">Atelier Nova • Travaux • Dax</div>
                </div>
              )}
              {currentStep === 2 && (
                <div className="text-center">
                  <p className="text-xs text-white/70">Commissions</p>
                  <motion.p
                    key="counter"
                    initial={{ opacity: 0.5, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 text-4xl font-black text-[#00FF9D]"
                  >
                    1 450 €
                  </motion.p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative z-20 mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-black sm:text-5xl">Calculatrice de potentiel</h2>
        <div className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
          <label className="text-sm text-white/80">Combien de contacts avez-vous ?</label>
          <input
            type="range"
            min={100}
            max={2000}
            step={10}
            value={contactsCount}
            onChange={(event) => setContactsCount(Number(event.target.value))}
            className="mt-3 w-full"
          />
          <p className="mt-2 text-sm text-white/75">Contacts: {contactsCount}</p>
          <p className="mt-4 text-xl font-black text-[#00FF9D]">Votre potentiel de gain estimé : {estimatedAnnual.toLocaleString("fr-FR")} € / an</p>
          <p className="mt-1 text-xs text-white/60">Calcul: contacts × 0.05 conversion × 500€ commission moyenne</p>
        </div>
      </section>

      <section className="relative z-20 mx-auto max-w-6xl px-4 pb-24 pt-6">
        <div className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-white/10 to-white/5 p-6 backdrop-blur">
          <h2 className="text-3xl font-black sm:text-5xl">Le cercle vertueux Popey</h2>
          <p className="mt-4 text-white/80">
            Arrêtez d envoyer vos amis vers des inconnus. Devenez leur tiers de confiance. Vous aidez un proche à réussir son projet, vous aidez un artisan local, et vous êtes payé pour ça.
          </p>
          <button className="mt-6 rounded-2xl border border-[#00FF9D]/30 bg-gradient-to-r from-[#00FF9D] via-cyan-300 to-[#00FF9D] px-6 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[0_0_35px_rgba(0,255,157,0.35)]">
            Réveiller mon annuaire
          </button>
        </div>
      </section>
    </main>
  );
}
