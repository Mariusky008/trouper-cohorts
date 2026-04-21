"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { GlassCard, uiKit, uiMotion } from "../app/_components/ui-kit";

const persuasionPoints = [
  {
    title: "L image de la fusion",
    text: "Dire votre telephone + celui des deux autres, c est mathematique. On comprend tout de suite que 1 + 1 + 1 = 3 fois plus de chances.",
  },
  {
    title: "Sommeil vs action",
    text: "Le mot dorment cree une frustration immediate. On sent qu il y a deja de l argent la, mais qu il ne travaille pour personne.",
  },
  {
    title: "Le benefice final",
    text: "On ne parle pas juste de vendre. On parle d un planning qui se rejouit, donc d un business plus serein et plus confortable.",
  },
] as const;

const steps = [
  {
    eyebrow: "Etape 1",
    title: "Le Smart Scan",
    subtitle: "L audit de votre mine d or",
    result:
      "Des l inscription, l IA Popey analyse votre repertoire localement, repere les signaux chauds et identifie vos futurs eclaireurs.",
    impact: "Resultat : vous savez exactement sur quel bouton appuyer pour reveiller votre business.",
  },
  {
    eyebrow: "Etape 2",
    title: "La Fusion du Trio",
    subtitle: "Le multiplicateur de puissance",
    result:
      "Vous mettez en synergie votre sphere avec deux partenaires de confiance aux metiers complementaires, de maniere securisee.",
    impact: "Resultat : votre terrain de chasse passe de 500 a 1500 contacts qualifies instantanement.",
  },
  {
    eyebrow: "Etape 3",
    title: "La Recommandation en 1 clic",
    subtitle: "La vitesse sans prospection a froid",
    result:
      "Quand une opportunite apparait, Popey genere un message de recommandation personnalise. Vous validez, puis vous etes introduit avec la confiance du partenaire.",
    impact: "Resultat : vous intervenez sur des dossiers pre-vendus plutot que sur des prospects froids.",
  },
  {
    eyebrow: "Etape 4",
    title: "Le Contrat & Le Cash",
    subtitle: "La securite totale",
    result:
      "Chaque mise en relation declenche un cadre numerique d apport d affaires. La commission est posee, le legal est trace, le partage est clair.",
    impact: "Resultat : vous travaillez l esprit libre et vous etes remunere pour chaque info transformee.",
  },
] as const;

const secrets = [
  {
    title: "L IA Detective",
    text: "Elle surveille le web et les reseaux pour vous alerter quand un contact bouge : demenagement, nouveau job, creation de boite, besoin latent.",
    accent: "from-cyan-400/30 via-sky-400/10 to-transparent",
  },
  {
    title: "L Effet Reseau",
    text: "Vous gagnez sur vos ventes, mais aussi sur les mises en relation et la cooptation activees dans votre sphere de partenaires.",
    accent: "from-emerald-400/30 via-teal-400/10 to-transparent",
  },
  {
    title: "Le Pilotage Automatique",
    text: "Vos agents virtuels s occupent des suivis, des relances et d une partie du marketing pendant que vous etes sur le terrain.",
    accent: "from-amber-400/30 via-orange-400/10 to-transparent",
  },
] as const;

const floatingDots = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  size: 6 + ((index * 5) % 18),
  left: `${6 + ((index * 7) % 86)}%`,
  top: `${4 + ((index * 9) % 88)}%`,
  duration: 6 + (index % 5),
  delay: index * 0.35,
}));

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function formatEuros(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AccueilTestPage() {
  const [myContacts, setMyContacts] = useState(500);
  const [partnerContacts, setPartnerContacts] = useState(500);
  const [conversionRate, setConversionRate] = useState(2);
  const [averageCommission, setAverageCommission] = useState(900);

  const calculator = useMemo(() => {
    const totalContacts = myContacts + partnerContacts * 2;
    const yearlyOpportunities = Math.round(totalContacts * (conversionRate / 100));
    const monthlyOpportunities = Math.max(1, Math.round(yearlyOpportunities / 12));
    const estimatedRevenue = yearlyOpportunities * averageCommission;

    return {
      totalContacts,
      yearlyOpportunities,
      monthlyOpportunities,
      estimatedRevenue,
    };
  }, [averageCommission, conversionRate, myContacts, partnerContacts]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#17306D_0%,#0D1533_38%,#090B16_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-10%] top-[-12%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/18 blur-3xl"
          animate={{ scale: [1, 1.18, 0.96, 1], opacity: [0.4, 0.7, 0.45, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-6%] top-[10%] h-[24rem] w-[24rem] rounded-full bg-emerald-400/15 blur-3xl"
          animate={{ scale: [0.95, 1.12, 1], opacity: [0.28, 0.6, 0.28] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
        />
        <motion.div
          className="absolute bottom-[-8%] left-[18%] h-[20rem] w-[20rem] rounded-full bg-amber-300/12 blur-3xl"
          animate={{ scale: [1, 1.08, 0.94, 1], opacity: [0.18, 0.42, 0.22, 0.18] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />
        {floatingDots.map((dot) => (
          <motion.span
            key={dot.id}
            className="absolute rounded-full bg-white/25"
            style={{ left: dot.left, top: dot.top, width: dot.size, height: dot.size }}
            animate={{ y: [0, -18, 0], opacity: [0.15, 0.6, 0.15], scale: [1, 1.4, 1] }}
            transition={{ duration: dot.duration, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(9,11,22,0.2)_35%,rgba(9,11,22,0.6)_100%)]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className={`${uiKit.pageWrap} max-w-7xl space-y-8`}>
          <GlassCard className="relative overflow-hidden border-white/20 bg-white/[0.07] p-5 shadow-[0_30px_80px_-32px_rgba(34,211,238,0.45)] sm:p-8 lg:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.12),transparent_35%)]" />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100"
                >
                  Popey
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Synergie automatisee
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.08 }}
                  className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl"
                >
                  Votre telephone est une mine d or...
                  <span className="block bg-gradient-to-r from-cyan-200 via-white to-emerald-200 bg-clip-text text-transparent">
                    Imaginez si vous en aviez trois.
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.16 }}
                  className="mt-5 max-w-3xl text-base leading-7 text-white/82 sm:text-xl"
                >
                  Scannez votre repertoire en 10 secondes. Fusionnez vos opportunites avec vos partenaires de confiance.
                  Appuyez sur un bouton pour etre recommande instantanement. Arretez de chasser, commencez a recolter.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.24 }}
                  className="mt-6 flex flex-col gap-3 sm:flex-row"
                >
                  <a
                    href="#calculateur"
                    className={`${uiKit.primaryButton} ${uiMotion.cardHover} inline-flex items-center justify-center px-6 shadow-[0_18px_40px_-18px_rgba(52,211,153,0.75)]`}
                  >
                    Voir mon potentiel
                  </a>
                  <a
                    href="#comment-ca-marche"
                    className={`${uiKit.subtleButton} ${uiMotion.cardHover} inline-flex items-center justify-center px-5 text-sm`}
                  >
                    Comprendre le systeme
                  </a>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                  className="mt-7 grid gap-3 sm:grid-cols-3"
                >
                  {[
                    { value: "3x", label: "plus de surface reseau" },
                    { value: "10 s", label: "pour lancer le smart scan" },
                    { value: "1 clic", label: "pour etre recommande" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/12 bg-black/25 px-4 py-4 backdrop-blur-xl"
                    >
                      <p className="text-2xl font-black text-cyan-100 sm:text-3xl">{item.value}</p>
                      <p className="mt-1 text-sm text-white/70">{item.label}</p>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.16 }}
                className="relative mx-auto flex w-full max-w-xl items-center justify-center py-6"
              >
                <motion.div
                  className="absolute h-72 w-72 rounded-full border border-cyan-300/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute h-96 w-96 rounded-full border border-emerald-300/10"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                />

                <div className="relative flex items-center justify-center">
                  {[
                    { label: "Vous", tint: "from-cyan-400/70 to-blue-500/70", offset: "-translate-x-20 translate-y-3" },
                    { label: "Partenaire A", tint: "from-emerald-400/70 to-teal-500/70", offset: "translate-y-[-3.3rem]" },
                    { label: "Partenaire B", tint: "from-amber-300/75 to-orange-400/70", offset: "translate-x-20 translate-y-3" },
                  ].map((phone, index) => (
                    <motion.div
                      key={phone.label}
                      className={`absolute ${phone.offset}`}
                      animate={{ y: [0, -8, 0], rotate: [0, index === 1 ? 0 : index === 0 ? -2 : 2, 0] }}
                      transition={{ duration: 4.5 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.35 }}
                    >
                      <div className={`h-52 w-32 rounded-[2rem] border border-white/20 bg-gradient-to-b ${phone.tint} p-[1px] shadow-[0_24px_70px_-30px_rgba(34,211,238,0.8)]`}>
                        <div className="flex h-full w-full flex-col justify-between rounded-[1.9rem] bg-[#091124]/90 p-3">
                          <div className="mx-auto h-1.5 w-12 rounded-full bg-white/15" />
                          <div className="space-y-2">
                            <div className="h-16 rounded-2xl bg-white/8" />
                            <div className="h-3 rounded-full bg-white/10" />
                            <div className="h-3 w-4/5 rounded-full bg-white/10" />
                            <div className="grid grid-cols-3 gap-2">
                              <span className="h-7 rounded-xl bg-cyan-300/20" />
                              <span className="h-7 rounded-xl bg-emerald-300/20" />
                              <span className="h-7 rounded-xl bg-amber-300/20" />
                            </div>
                          </div>
                          <p className="text-center text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
                            {phone.label}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <motion.div
                    className="relative z-10 rounded-[2rem] border border-white/20 bg-[#091124]/85 px-7 py-8 text-center shadow-[0_24px_70px_-28px_rgba(16,185,129,0.7)] backdrop-blur-xl"
                    animate={{ scale: [1, 1.04, 1], boxShadow: [
                      "0 24px 70px -28px rgba(16,185,129,0.45)",
                      "0 24px 90px -20px rgba(34,211,238,0.55)",
                      "0 24px 70px -28px rgba(16,185,129,0.45)",
                    ] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Sphere activee</p>
                    <p className="mt-3 text-5xl font-black">1 + 1 + 1</p>
                    <p className="mt-2 text-lg font-bold text-white/85">3 fois plus de chances</p>
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      Vos contacts, ceux de deux partenaires, et un moteur Popey qui reveille les bonnes opportunites.
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <GlassCard className="border-white/15 bg-black/20 p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Texte de la publicite</p>
              <div className="mt-4 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
                <p className="text-lg font-semibold leading-8 text-white/92 sm:text-2xl sm:leading-10">
                  "Vous avez des centaines de contacts dans votre repertoire. Vos deux partenaires les plus proches en ont tout autant.
                  Le probleme ? Ces 2000 contacts dorment. Personne ne les exploite.
                  Avec Popey, nous avons cree le premier systeme de Synergie Automatisee.
                  Scannez votre repertoire en 10 secondes.
                  Fusionnez vos opportunites avec vos partenaires de confiance.
                  Appuyez sur un bouton pour etre recommande instantanement.
                  Trouvez des clients avec une telle facilite que votre planning s en rejouira. Arretez de chasser, commencez a recolter."
                </p>
              </div>
            </GlassCard>

            <div className="grid gap-4">
              {persuasionPoints.map((point, index) => (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  <GlassCard className="h-full border-white/15 bg-white/[0.05] p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-emerald-300/20 text-lg font-black text-cyan-100">
                        0{index + 1}
                      </div>
                      <div>
                        <p className="text-lg font-black text-white">{point.title}</p>
                        <p className="mt-2 text-sm leading-7 text-white/72">{point.text}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>

          <section id="calculateur" className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <GlassCard className="border-cyan-300/20 bg-[#0B1328]/85 p-5 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Calculateur de gain potentiel</p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Votre carnet peut deja contenir votre prochaine annee de business.</h2>
              <p className="mt-3 text-sm leading-7 text-white/75 sm:text-base">
                Si vous avez 500 contacts, et vos 2 partenaires aussi, vous transformez un simple repertoire en une machine de recommandations.
              </p>

              <div className="mt-6 space-y-5">
                <label className="block">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-white/80">Vos contacts</span>
                    <span className="font-black text-cyan-100">{myContacts}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={1500}
                    step={50}
                    value={myContacts}
                    onChange={(event) => setMyContacts(Number(event.target.value))}
                    className="w-full accent-cyan-300"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-white/80">Contacts par partenaire</span>
                    <span className="font-black text-emerald-100">{partnerContacts}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={1500}
                    step={50}
                    value={partnerContacts}
                    onChange={(event) => setPartnerContacts(Number(event.target.value))}
                    className="w-full accent-emerald-300"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-white/80">Taux de reussite des recommandations</span>
                    <span className="font-black text-amber-100">{formatPercent(conversionRate)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={8}
                    step={0.1}
                    value={conversionRate}
                    onChange={(event) => setConversionRate(Number(event.target.value))}
                    className="w-full accent-amber-300"
                  />
                </label>

                <label className="block">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-white/80">Commission moyenne par affaire</span>
                    <span className="font-black text-violet-100">{formatEuros(averageCommission)}</span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={3000}
                    step={50}
                    value={averageCommission}
                    onChange={(event) => setAverageCommission(Number(event.target.value))}
                    className="w-full accent-violet-300"
                  />
                </label>
              </div>
            </GlassCard>

            <GlassCard className="relative overflow-hidden border-white/15 bg-white/[0.06] p-5 sm:p-6">
              <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),transparent_60%)]" />
              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Projection instantanee</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: "Contacts actives",
                      value: calculator.totalContacts.toLocaleString("fr-FR"),
                      helper: "Vous + 2 partenaires",
                      tone: "from-cyan-400/18 to-transparent",
                    },
                    {
                      label: "Affaires annuelles",
                      value: calculator.yearlyOpportunities.toLocaleString("fr-FR"),
                      helper: "Avec votre taux de reussite",
                      tone: "from-emerald-400/18 to-transparent",
                    },
                    {
                      label: "Rythme mensuel",
                      value: `${calculator.monthlyOpportunities}`,
                      helper: "Opportunites par mois",
                      tone: "from-violet-400/18 to-transparent",
                    },
                    {
                      label: "Revenu potentiel",
                      value: formatEuros(calculator.estimatedRevenue),
                      helper: "Projection brute annuelle",
                      tone: "from-amber-300/20 to-transparent",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      className={`rounded-[1.6rem] border border-white/10 bg-gradient-to-br ${item.tone} bg-black/25 p-5`}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.45, delay: index * 0.06 }}
                    >
                      <p className="text-sm font-bold text-white/70">{item.label}</p>
                      <motion.p
                        key={item.value}
                        initial={{ scale: 0.94, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.28 }}
                        className="mt-3 text-3xl font-black text-white sm:text-4xl"
                      >
                        {item.value}
                      </motion.p>
                      <p className="mt-2 text-sm text-white/60">{item.helper}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className="mt-5 rounded-[1.8rem] border border-emerald-300/25 bg-emerald-300/10 p-5"
                  animate={{ boxShadow: [
                    "0 0 0 rgba(52,211,153,0)",
                    "0 0 40px rgba(52,211,153,0.18)",
                    "0 0 0 rgba(52,211,153,0)",
                  ] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-emerald-100">Lecture simple</p>
                  <p className="mt-2 text-lg font-semibold leading-8 text-white/92">
                    Si vous avez <span className="text-emerald-200">{myContacts}</span> contacts, et vos 2 partenaires aussi,
                    vous activez <span className="text-cyan-200">{calculator.totalContacts.toLocaleString("fr-FR")}</span> contacts.
                    Avec seulement <span className="text-amber-200">{formatPercent(conversionRate)}</span> de reussite,
                    cela peut representer <span className="text-white">{calculator.yearlyOpportunities}</span> nouvelles affaires par an.
                  </p>
                </motion.div>
              </div>
            </GlassCard>
          </section>

          <section id="comment-ca-marche">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Comment ca marche</p>
                <h2 className="mt-2 text-3xl font-black sm:text-5xl">Du scan de votre repertoire a votre premiere commission.</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-white/70">
                Tout est pense pour reduire la prospection a froid et transformer votre reseau dormant en machine a recommandations.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.48, delay: index * 0.08 }}
                >
                  <GlassCard className="relative h-full overflow-hidden border-white/15 bg-white/[0.05] p-5 sm:p-6">
                    <div className="absolute inset-y-5 left-5 w-px bg-gradient-to-b from-cyan-300/60 via-transparent to-transparent sm:left-6" />
                    <div className="relative pl-8 sm:pl-10">
                      <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-emerald-300 text-xs font-black text-[#10263A]">
                        {index + 1}
                      </div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">{step.eyebrow}</p>
                      <h3 className="mt-2 text-2xl font-black">{step.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-white/80">{step.subtitle}</p>
                      <p className="mt-4 text-sm leading-7 text-white/72">{step.result}</p>
                      <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-4">
                        <p className="text-sm font-semibold leading-7 text-white/88">{step.impact}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Les 3 secrets de l efficacite Popey</p>
              <h2 className="mt-2 text-3xl font-black sm:text-5xl">Trois moteurs pour rendre votre reseau vivant, reactif et monnayable.</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {secrets.map((secret, index) => (
                <motion.div
                  key={secret.title}
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <GlassCard className="relative h-full overflow-hidden border-white/15 bg-black/20 p-5 sm:p-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${secret.accent}`} />
                    <div className="relative">
                      <div className="mb-5 h-14 w-14 rounded-2xl border border-white/15 bg-white/8" />
                      <h3 className="text-2xl font-black">{secret.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-white/74">{secret.text}</p>
                      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/8">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200"
                          initial={{ width: "22%" }}
                          whileInView={{ width: `${76 + index * 8}%` }}
                          viewport={{ once: true, amount: 0.6 }}
                          transition={{ duration: 0.9, delay: index * 0.08 }}
                        />
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </section>

          <GlassCard className="overflow-hidden border-white/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(255,255,255,0.02),rgba(16,185,129,0.08))] p-6 text-center shadow-[0_30px_90px_-40px_rgba(34,211,238,0.45)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Positionnement a tester</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">Transformez votre reseau en revenu.</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-white/78 sm:text-lg">
              Chaque contact peut deja contenir une opportunite. Popey reveille les bons signaux, connecte les bons partenaires
              et rend la recommandation presque naturelle.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#calculateur"
                className={`${uiKit.primaryButton} ${uiMotion.cardHover} inline-flex items-center justify-center px-7 shadow-[0_18px_40px_-18px_rgba(52,211,153,0.75)]`}
              >
                Tester la projection
              </a>
              <a
                href="#comment-ca-marche"
                className={`${uiKit.subtleButton} ${uiMotion.cardHover} inline-flex items-center justify-center px-6 text-sm`}
              >
                Voir le parcours complet
              </a>
            </div>
          </GlassCard>
        </section>
      </div>
    </main>
  );
}
