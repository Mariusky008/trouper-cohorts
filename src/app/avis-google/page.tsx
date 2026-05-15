"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";

// ─── Variants ────────────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// ─── Primitives ──────────────────────────────────────────────────────────────
function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut", delay } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerIn({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Phone (merchant form) ────────────────────────────────────────────────────
function MerchantAppMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 200, height: 400 }}>
      <div className="absolute inset-0 rounded-[2.5rem] bg-neutral-800 shadow-2xl shadow-black/60 border-2 border-neutral-600" />
      <div className="absolute inset-[3px] rounded-[2.4rem] bg-white overflow-hidden flex flex-col">
        {/* top bar */}
        <div className="bg-neutral-900 px-4 pt-3 pb-2 shrink-0 flex items-center justify-between">
          <div className="text-white text-xs font-bold">🌟 Review Booster</div>
          <div className="text-emerald-400 text-[10px]">admin</div>
        </div>
        {/* form */}
        <div className="flex-1 bg-slate-50 px-3 pt-4 pb-3 space-y-3 overflow-hidden">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nouveau client</p>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Prénom</label>
            <div className="bg-white border border-emerald-200 rounded-lg px-2 py-1.5 flex items-center gap-1">
              <span className="text-xs text-neutral-800 font-medium">Martin</span>
              <span className="inline-block w-0.5 h-3 bg-emerald-500 animate-pulse ml-0.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Téléphone WhatsApp</label>
            <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5">
              <span className="text-xs text-neutral-800">06 12 34 56 78</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">Commerce</label>
            <div className="bg-white border border-slate-200 rounded-lg px-2 py-1.5">
              <span className="text-xs text-neutral-600">Salon Éclat</span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-full bg-emerald-500 rounded-xl py-2 text-white text-xs font-bold shadow-md shadow-emerald-400/30"
          >
            ✓ Envoyer le client
          </motion.button>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center gap-2">
            <span className="text-base">⚡</span>
            <p className="text-[9px] text-emerald-700 font-semibold leading-tight">WhatsApp envoyé demain matin automatiquement !</p>
          </div>
        </div>
      </div>
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-neutral-800 rounded-full" />
    </div>
  );
}

// ─── Phone (WhatsApp received) ────────────────────────────────────────────────
function ClientPhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 200, height: 400 }}>
      <div className="absolute inset-0 rounded-[2.5rem] bg-neutral-800 shadow-2xl shadow-black/60 border-2 border-neutral-600" />
      <div className="absolute inset-[3px] rounded-[2.4rem] bg-[#075E54] overflow-hidden flex flex-col">
        <div className="bg-[#075E54] px-3 pt-3 pb-2 flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-xs font-bold text-white">SÉ</div>
          <div>
            <div className="text-white text-xs font-semibold leading-none">Salon Éclat</div>
            <div className="text-green-300 text-[10px]">en ligne</div>
          </div>
        </div>
        <div className="flex-1 bg-[#ECE5DD] px-2 pt-3 pb-2 space-y-2 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-start"
          >
            <div className="bg-white rounded-xl rounded-tl-sm px-2.5 py-2 max-w-[80%] shadow-sm">
              <p className="text-[10px] text-neutral-800 leading-snug font-medium">Bonjour Martin 👋</p>
              <p className="text-[10px] text-neutral-700 leading-snug mt-0.5">Merci pour votre visite chez <strong>Salon Éclat</strong> ✨</p>
              <p className="text-[10px] text-neutral-600 mt-1">Votre avis compte énormément pour nous !</p>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-1.5 bg-emerald-500 rounded-lg px-2 py-1 text-center cursor-pointer"
              >
                <span className="text-white text-[10px] font-bold">⭐ Laisser mon avis Google</span>
              </motion.div>
              <p className="text-[9px] text-neutral-400 text-right mt-0.5">09:15 ✓✓</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="flex justify-end"
          >
            <div className="bg-[#dcf8c6] rounded-xl rounded-tr-sm px-2.5 py-1.5 shadow-sm">
              <p className="text-[10px] text-neutral-800">Avec plaisir ! 😄</p>
              <p className="text-[9px] text-neutral-400 text-right mt-0.5">09:17 ✓✓</p>
            </div>
          </motion.div>
        </div>
        <div className="bg-[#F0F0F0] px-2 py-1.5 flex items-center gap-1 shrink-0">
          <div className="flex-1 bg-white rounded-full px-2 py-1">
            <span className="text-[10px] text-neutral-400">Message…</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-[9px]">↑</span>
          </div>
        </div>
      </div>
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-neutral-800 rounded-full" />
    </div>
  );
}

// ─── Google review card ───────────────────────────────────────────────────────
function GoogleReviewCard({ name, stars, text, delay, className }: { name: string; stars: number; text: string; delay: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, type: "spring", bounce: 0.3 }}
      className={`bg-white rounded-2xl p-4 shadow-lg border border-slate-100 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {name[0]}
        </div>
        <div>
          <p className="text-xs font-semibold text-neutral-800">{name}</p>
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: stars }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: delay + 0.1 + i * 0.08 }}
                className="text-yellow-400 text-xs"
              >★</motion.span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-neutral-600 leading-relaxed">{text}</p>
    </motion.div>
  );
}

// ─── Google Maps rank mockup ──────────────────────────────────────────────────
function RankMockup({ rank, name, reviews, rating, isYou }: { rank: number; name: string; reviews: number; rating: number; isYou?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${isYou ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200" : "bg-white border-gray-100"}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isYou ? "bg-emerald-500" : rank === 2 ? "bg-gray-400" : "bg-gray-300"}`}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold truncate ${isYou ? "text-emerald-700" : "text-gray-500"}`}>{name}</p>
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-[10px]">{"★".repeat(Math.round(rating))}</span>
          <span className="text-[10px] text-gray-500">{rating} ({reviews})</span>
        </div>
      </div>
      {isYou && <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">VOUS</span>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AvisGooglePage() {
  return (
    <main className="bg-white text-neutral-900 overflow-x-hidden">

      {/* ═══ NAVBAR ═════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-emerald-500/30">⭐</div>
            <span className="text-white font-semibold text-sm tracking-tight">Review <span className="text-emerald-400">Booster</span></span>
          </motion.div>

          {/* Nav links */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="hidden sm:flex items-center gap-6">
            {[["Comment ça marche", "#demo"], ["Résultats", "#resultats"], ["Tarif", "#tarif"]].map(([label, href]) => (
              <a key={label} href={href} className="text-neutral-400 hover:text-white text-sm transition-colors font-medium">{label}</a>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.a
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            href="https://wa.me/33622129675"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full px-4 py-2 text-xs font-semibold transition-all shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5"
          >
            <span>💬</span> <span className="hidden sm:inline">Démarrer —</span> 79€/mois
          </motion.a>
        </div>
      </nav>

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-neutral-950 pt-16">
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-widest uppercase rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Spécialiste avis Google · 100% WhatsApp
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.1] text-white mb-5"
            >
              Passez la barre des<br />
              <span className="text-emerald-400 text-5xl sm:text-6xl lg:text-7xl">+500 avis Google</span><br />
              en mode <span className="font-black text-white tracking-tight">PILOTE AUTOMATIQUE</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-neutral-300 text-base sm:text-lg font-medium leading-relaxed mb-4 max-w-lg border-l-2 border-emerald-500 pl-4"
            >
              9 clients sur 10 consultent vos avis avant d&apos;appeler. Ne les laissez plus choisir vos concurrents faute de preuves.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-neutral-400 text-base leading-relaxed mb-8 max-w-lg"
            >
              Vos clients satisfaits reçoivent un WhatsApp après leur visite. Ils cliquent, ils écrivent un avis, vous montez dans Google.
              <strong className="text-white"> Vous ne faites rien.</strong>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <a
                href="https://wa.me/33622129675"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full px-7 py-3.5 font-semibold transition-all text-sm shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
              >
                <span>💬</span> Démarrer — 79€/mois
              </a>
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white rounded-full px-7 py-3.5 font-semibold transition-all text-sm"
              >
                Voir la démo ↓
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Sans engagement</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Résultats dès J+2</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 10 secondes par client</span>
            </motion.div>
          </div>

          {/* Hero phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            className="flex justify-center lg:justify-end gap-4 items-end"
          >
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
              <MerchantAppMockup />
            </motion.div>
            <div className="flex flex-col items-center gap-2 pb-16">
              <div className="flex flex-col items-center gap-1">
                {["⚡", "→", "⭐"].map((s, i) => (
                  <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 + i * 0.2 }} className="text-emerald-400 text-lg">{s}</motion.span>
                ))}
              </div>
            </div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}>
              <ClientPhoneMockup />
            </motion.div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-neutral-500">
          <span className="text-xs tracking-widest uppercase">Voir la démo</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-lg">↓</motion.div>
        </motion.div>
      </section>

      {/* ═══ APP DEMO — 10 secondes ═════════════════════════════════════════ */}
      <section id="demo" className="bg-slate-50 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3 block">L&apos;application commerçant</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light mb-4">
              Votre seul travail :<br /><span className="italic text-emerald-600">10 secondes</span> par client
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto text-sm">
              Prénom + téléphone. Tout le reste se fait automatiquement sans vous.
            </p>
          </FadeIn>

          {/* 3 étapes horizontales propres */}
          <StaggerIn className="flex flex-col sm:flex-row items-center gap-3 max-w-3xl mx-auto mb-14">
            {[
              { n: "1", emoji: "📝", title: "Vous notez", sub: "Prénom + numéro\naprès la prestation", color: "slate" },
              { n: "2", emoji: "💬", title: "WhatsApp auto J+1", sub: "Message personnalisé\nenvoyé par nous", color: "emerald" },
              { n: "3", emoji: "⭐", title: "Avis Google posté", sub: "Le client clique\n5 étoiles publiées", color: "amber" },
            ].map(({ n, emoji, title, sub, color }, i) => (
              <>
                <motion.div
                  key={n}
                  variants={fadeUp}
                  className={`flex-1 rounded-2xl p-5 text-center border-2 ${
                    color === "emerald" ? "border-emerald-200 bg-emerald-50 shadow-lg shadow-emerald-100" :
                    color === "amber" ? "border-amber-200 bg-amber-50" :
                    "border-slate-200 bg-white"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-black text-white ${
                    color === "emerald" ? "bg-emerald-500" : color === "amber" ? "bg-amber-500" : "bg-slate-400"
                  }`}>{n}</div>
                  <div className="text-3xl mb-2">{emoji}</div>
                  <p className="font-semibold text-sm text-neutral-900 mb-1">{title}</p>
                  <p className="text-xs text-neutral-500 whitespace-pre-line leading-relaxed">{sub}</p>
                </motion.div>
                {i < 2 && (
                  <motion.div key={`arrow-${i}`} variants={fadeUp} className="text-emerald-300 text-2xl font-light hidden sm:block shrink-0">→</motion.div>
                )}
              </>
            ))}
          </StaggerIn>

          {/* App screenshot — épuré, deux colonnes claires */}
          <FadeIn delay={0.15}>
            <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
              {/* browser top bar */}
              <div className="bg-neutral-900 px-5 py-3 flex items-center gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="flex-1 bg-neutral-800 rounded-lg px-3 py-1 text-xs text-neutral-400 text-center">
                  app.review-booster.fr
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center text-[10px]">⭐</div>
                  <span className="text-xs text-emerald-400 font-semibold hidden sm:inline">Review Booster</span>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                {/* LEFT — Formulaire ultra-simple */}
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-base shadow-md">SÉ</div>
                    <div>
                      <p className="font-bold text-sm text-neutral-900">Salon Éclat</p>
                      <p className="text-xs text-neutral-400">Bordeaux · <span className="text-emerald-500 font-medium">● Actif</span></p>
                    </div>
                  </div>

                  <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Nouveau client</p>

                  <div className="space-y-3 mb-4">
                    <div className="border-2 border-emerald-300 rounded-2xl px-4 py-3 bg-emerald-50 flex items-center gap-2">
                      <span className="text-xs text-neutral-400 shrink-0">Prénom</span>
                      <div className="w-px h-4 bg-slate-300 shrink-0" />
                      <span className="text-sm font-semibold text-neutral-800">Martin</span>
                      <span className="inline-block w-0.5 h-4 bg-emerald-500 animate-pulse ml-0.5" />
                    </div>
                    <div className="border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <span className="text-xs text-neutral-400 shrink-0">📱</span>
                      <div className="w-px h-4 bg-slate-200 shrink-0" />
                      <span className="text-sm text-neutral-700">06 12 34 56 78</span>
                    </div>
                    <button className="w-full bg-neutral-900 hover:bg-neutral-700 text-white rounded-2xl py-3 text-sm font-bold shadow-lg transition-colors">
                      ✓ Envoyer le client
                    </button>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2">
                    <span>⚡</span>
                    <p className="text-xs text-emerald-800 font-medium">WhatsApp envoyé <strong>demain à 9h</strong> automatiquement.</p>
                  </div>
                </div>

                {/* RIGHT — Résultats du mois */}
                <div className="p-6 sm:p-8 bg-slate-50/50">
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-5">Ce mois-ci</p>

                  {/* 3 stats clés */}
                  <div className="flex gap-3 mb-5">
                    <div className="flex-1 bg-white rounded-2xl border border-emerald-100 p-3 text-center shadow-sm">
                      <div className="text-2xl font-black text-emerald-500">14</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">nouveaux avis</div>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl border border-amber-100 p-3 text-center shadow-sm">
                      <div className="text-2xl font-black text-amber-500">4,8★</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">note Google</div>
                    </div>
                    <div className="flex-1 bg-white rounded-2xl border border-violet-100 p-3 text-center shadow-sm">
                      <div className="text-2xl font-black text-violet-500">#2</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">position locale</div>
                    </div>
                  </div>

                  {/* Derniers avis */}
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Derniers avis reçus</p>
                  <div className="space-y-2">
                    {[
                      { name: "Martin B.", time: "2h", text: "Super coiffeur ! Je recommande." },
                      { name: "Camille R.", time: "hier", text: "Résultat parfait, je reviendrai." },
                      { name: "Thomas K.", time: "2j", text: "Très professionnel et rapide." },
                    ].map(({ name, time, text }) => (
                      <div key={name} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0">{name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-neutral-800">{name}</span>
                            <span className="text-[10px] text-neutral-400 shrink-0">{time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-[10px]">★★★★★</span>
                            <span className="text-[10px] text-neutral-500 truncate">{text}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ BEFORE / AFTER ════════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-3 block">La réalité aujourd&apos;hui</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light">
              Vos concurrents vous <span className="italic text-rose-500">écrasent</span> sur Google
            </h2>
            <p className="mt-4 text-neutral-500 max-w-xl mx-auto text-sm">
              Le client tape &ldquo;coiffeur Bordeaux&rdquo;. Il clique sur les 3 premiers. Vous êtes 8ème. Il ne vous voit pas.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <FadeIn delay={0.05}>
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-rose-50 border-b border-rose-100 px-5 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Aujourd&apos;hui — sans nous</span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[10px] text-gray-400 font-medium mb-2">Google Maps · &ldquo;coiffeur bordeaux&rdquo;</p>
                  {[
                    { pos: 1, name: "Salon Prestige", rating: 4.8, reviews: 487 },
                    { pos: 2, name: "Studio Coif'", rating: 4.7, reviews: 312 },
                    { pos: 3, name: "L'Atelier Cheveux", rating: 4.6, reviews: 201 },
                  ].map(({ pos, name, rating, reviews }) => (
                    <RankMockup key={pos} rank={pos} name={name} rating={rating} reviews={reviews} />
                  ))}
                  <div className="py-1 text-center text-xs text-gray-300">· · ·</div>
                  <RankMockup rank={8} name="Votre salon — 62 avis" rating={4.4} reviews={62} isYou />
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="rounded-2xl bg-white border border-emerald-200 shadow-sm overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Dans 12 mois — avec nous</span>
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[10px] text-gray-400 font-medium mb-2">Google Maps · &ldquo;coiffeur bordeaux&rdquo;</p>
                  <RankMockup rank={1} name="Votre salon — 186 avis 🎉" rating={4.8} reviews={186} isYou />
                  {[
                    { pos: 2, name: "Salon Prestige", rating: 4.8, reviews: 487 },
                    { pos: 3, name: "Studio Coif'", rating: 4.7, reviews: 312 },
                    { pos: 4, name: "L'Atelier Cheveux", rating: 4.6, reviews: 201 },
                  ].map(({ pos, name, rating, reviews }) => (
                    <RankMockup key={pos} rank={pos} name={name} rating={rating} reviews={reviews} />
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══ REVIEWS EXPLOSION ══════════════════════════════════════════════ */}
      <section id="resultats" className="relative bg-gradient-to-b from-amber-50 to-emerald-50 py-20 sm:py-28 overflow-hidden">
        {/* floating stars background */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-300 select-none pointer-events-none"
            style={{ left: `${(i * 8.3) % 100}%`, top: `${(i * 13.7) % 80 + 5}%`, fontSize: `${16 + (i % 4) * 8}px`, opacity: 0.3 }}
            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.4, delay: i * 0.3 }}
          >★</motion.div>
        ))}

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3 block">Ce que ça produit concrètement</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light mb-4">
              Des vrais avis. <span className="italic text-emerald-600">Des vrais clients.</span>
            </h2>
            <p className="text-neutral-600 max-w-xl mx-auto text-sm">
              Chaque avis est un client satisfait qui vous recommande publiquement à toute la ville.
            </p>
          </FadeIn>

          {/* Counter + progress bar */}
          <FadeIn className="max-w-lg mx-auto mb-12">
            <div className="bg-white rounded-3xl shadow-xl border border-amber-100 p-8 text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-2">Avis Google aujourd&apos;hui</div>
              <div className="text-7xl font-black text-emerald-500 mb-1">
                <Counter target={186} />
              </div>
              <div className="flex items-center gap-1 justify-center text-yellow-400 text-2xl mb-4">
                {"★★★★★".split("").map((s, i) => (
                  <motion.span key={i} animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}>{s}</motion.span>
                ))}
              </div>
              <div className="bg-slate-100 rounded-full h-3 overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                  initial={{ width: "12%" }}
                  whileInView={{ width: "37%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>62 avis (départ)</span>
                <span className="text-emerald-600 font-semibold">186 avis aujourd&apos;hui</span>
                <span>500 avis 🎯</span>
              </div>
            </div>
          </FadeIn>

          {/* Cascading review cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <GoogleReviewCard delay={0.05} name="Martin B." stars={5} text="Super coiffeur ! Je suis venu pour une coupe et le résultat est top. Je recommande vivement à tout le monde." />
            <GoogleReviewCard delay={0.15} name="Camille R." stars={5} text="Accueil chaleureux, coupe parfaite. Ma meilleure adresse à Bordeaux depuis des années. 5 étoiles méritées !" />
            <GoogleReviewCard delay={0.25} name="Thomas K." stars={5} text="Très professionnel, à l&apos;écoute et rapide. Prix raisonnables pour une qualité excellente. Bravo !" />
            <GoogleReviewCard delay={0.05} name="Sophie M." stars={5} text="Je cherchais un bon coiffeur depuis longtemps. J&apos;ai enfin trouvé ! Résultat parfait, je reviendrai." />
            <GoogleReviewCard delay={0.15} name="Lucas D." stars={5} text="Génial ! L&apos;équipe est sympa, le salon est propre et moderne. Mon nouveau coiffeur attitré sans hésiter." className="sm:col-start-2" />
            <GoogleReviewCard delay={0.25} name="Emma F." stars={5} text="Franchement bluffée par le résultat. Exactement ce que je voulais. Je recommande les yeux fermés !" />
          </div>

          <FadeIn delay={0.3} className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 bg-white rounded-2xl border border-emerald-200 shadow-sm px-6 py-4">
              <span className="text-2xl">📈</span>
              <p className="text-sm text-emerald-800 font-medium">
                +10 avis réels par mois · chaque avis = +1 client de plus qui vous trouve sur Google
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ PROGRESSION PAR PALIERS ════════════════════════════════════════ */}
      <section className="bg-neutral-950 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent pointer-events-none" />
        <div className="absolute -top-32 left-1/4 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4 block">La progression par paliers</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-6xl font-light text-white mb-4">
              De 0 à 500 avis :<br /><span className="text-emerald-400 italic">l&apos;ascension</span>
            </h2>
            <p className="text-neutral-400 max-w-lg mx-auto text-sm">
              Chaque palier change quelque chose. Voici exactement ce qui se passe à chaque étape.
            </p>
          </FadeIn>

          <div className="space-y-4">
            {[
              {
                count: "10",
                label: "avis",
                emoji: "🌱",
                title: "Le déclic",
                desc: "Les premiers avis arrivent. Votre fiche Google s'anime. Vous passez de \"commerce inconnu\" à \"commerce qui existe\". Vos proches qui hésitaient vous recommandent maintenant avec confiance.",
                color: "emerald",
                milestone: "Mois 1",
              },
              {
                count: "50",
                label: "avis",
                emoji: "🚀",
                title: "Vous sortez de l'anonymat",
                desc: "Google commence à vous afficher dans les suggestions locales. De nouveaux clients que vous ne connaissez pas vous trouvent pour la première fois. Le bouche-à-oreille digital commence.",
                color: "teal",
                milestone: "Mois 5",
              },
              {
                count: "100",
                label: "avis",
                emoji: "🔥",
                title: "Vos concurrents s'inquiètent",
                desc: "Vous êtes dans le Top 5 local. Les clients comparent et vous choisissent. Vos concurrents voient leur trafic baisser. Certains vous demandent comment vous faites.",
                color: "amber",
                milestone: "Mois 10",
              },
              {
                count: "200",
                label: "avis",
                emoji: "👑",
                title: "Vous dominez votre ville",
                desc: "Top 3 garanti. Les nouveaux clients dans la ville vous trouvent en premier. Votre carnet de rendez-vous se remplit sans pub. Votre réputation est établie.",
                color: "violet",
                milestone: "Mois 20",
              },
              {
                count: "500",
                label: "avis",
                emoji: "🏆",
                title: "Personne ne peut vous rattraper",
                desc: "Vous êtes la référence absolue de votre ville. Même si un concurrent lance le même service aujourd&apos;hui, il lui faudra des années pour vous rejoindre. Vous êtes imbattable. Pour toujours.",
                color: "gold",
                milestone: "Mois 48",
              },
            ].map(({ count, label, emoji, title, desc, color, milestone }, i) => (
              <FadeIn key={count} delay={i * 0.08}>
                <div className={`relative rounded-2xl border overflow-hidden ${
                  color === "emerald" ? "border-emerald-800 bg-emerald-950/50" :
                  color === "teal" ? "border-teal-800 bg-teal-950/50" :
                  color === "amber" ? "border-amber-800 bg-amber-950/50" :
                  color === "violet" ? "border-violet-800 bg-violet-950/50" :
                  "border-yellow-600 bg-yellow-950/50 ring-2 ring-yellow-500/30"
                }`}>
                  <div className="flex items-start gap-4 p-5 sm:p-6">
                    <div className={`shrink-0 rounded-2xl p-3 text-center min-w-[70px] ${
                      color === "emerald" ? "bg-emerald-900/50" :
                      color === "teal" ? "bg-teal-900/50" :
                      color === "amber" ? "bg-amber-900/50" :
                      color === "violet" ? "bg-violet-900/50" :
                      "bg-yellow-900/50"
                    }`}>
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className={`text-2xl font-black ${
                        color === "emerald" ? "text-emerald-400" :
                        color === "teal" ? "text-teal-400" :
                        color === "amber" ? "text-amber-400" :
                        color === "violet" ? "text-violet-400" :
                        "text-yellow-400"
                      }`}>{count}</div>
                      <div className="text-xs text-neutral-500">{label}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-white">{title}</h3>
                        <span className="text-xs text-neutral-500 shrink-0 ml-2">{milestone}</span>
                      </div>
                      <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                  {/* progress bar */}
                  <div className="h-1 bg-neutral-800">
                    <motion.div
                      className={`h-full ${
                        color === "emerald" ? "bg-emerald-500" :
                        color === "teal" ? "bg-teal-500" :
                        color === "amber" ? "bg-amber-500" :
                        color === "violet" ? "bg-violet-500" :
                        "bg-yellow-500"
                      }`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(parseInt(count) / 500) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.2} className="mt-12 text-center">
            <div className="inline-block bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-8 py-6">
              <p className="text-yellow-300 font-semibold text-lg">🏆 À 500 avis, le jeu est terminé.</p>
              <p className="text-neutral-400 text-sm mt-1">Vos concurrents travaillent pour vous.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ THE MAGIC FILTER ═══════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3 block">La fonctionnalité qui protège</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light mb-4">
              Les insatisfaits restent <span className="italic text-rose-500">privés</span>
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto text-sm">
              Avant Google, on filtre. Les mauvaises expériences vous arrivent en message privé. Seuls les clients heureux publient.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <FadeIn delay={0.05}>
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">😕</div>
                  <div>
                    <p className="font-semibold text-rose-700">Client insatisfait</p>
                    <p className="text-xs text-rose-500">&ldquo;Bof, c&apos;était moyen…&rdquo;</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 mb-4 border border-rose-100">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Son message vous arrive <strong>en privé</strong> dans votre tableau de bord. Vous lui répondez, vous réglez le problème.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-rose-100 rounded-xl px-3 py-2">
                  <span>🔒</span>
                  <span className="text-xs font-semibold text-rose-700">Jamais publié sur Google</span>
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">😍</div>
                  <div>
                    <p className="font-semibold text-emerald-700">Client satisfait</p>
                    <p className="text-xs text-emerald-600">&ldquo;Super, parfait !&rdquo;</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 mb-4 border border-emerald-100">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Il est redirigé vers votre fiche Google. Il laisse un <strong>vrai avis 5 étoiles</strong> en 2 clics.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-100 rounded-xl px-3 py-2">
                  <span>⭐</span>
                  <span className="text-xs font-semibold text-emerald-700">Publié sur Google. Visible de tous.</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══ STATS ══════════════════════════════════════════════════════════ */}
      <section className="bg-neutral-950 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <StaggerIn className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { target: 10, suffix: "+", label: "avis réels par mois", sub: "en moyenne sur nos clients", color: "text-emerald-400" },
              { target: 40, suffix: "%", label: "taux de clic WhatsApp", sub: "3x plus qu&apos;un email", color: "text-amber-400" },
              { target: 47, suffix: "★", label: "note moyenne atteinte", sub: "après 6 mois de service", color: "text-yellow-400" },
            ].map(({ target, suffix, label, sub, color }) => (
              <motion.div key={label} variants={fadeUp} className="space-y-2">
                <div className={`text-6xl font-black ${color}`}>
                  <Counter target={target} suffix={suffix === "★" ? "" : suffix} />
                  {suffix === "★" && <span className="text-yellow-400">★</span>}
                </div>
                <div className="font-semibold text-white">{label}</div>
                <div className="text-sm text-neutral-500" dangerouslySetInnerHTML={{ __html: sub }} />
              </motion.div>
            ))}
          </StaggerIn>
        </div>
      </section>

      {/* ═══ WHAT'S INCLUDED ═══════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3 block">Votre abonnement</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light">Tout inclus. Rien à gérer.</h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: "💬", title: "WhatsApp automatique J+1 et J+6", desc: "Message chaleureux, personnalisé avec le prénom." },
              { icon: "🔒", title: "Filtre anti-mauvais avis", desc: "Les insatisfaits restent en privé. Toujours." },
              { icon: "📊", title: "Tableau de bord en temps réel", desc: "Vos stats, vos avis, vos clients — tout en un." },
              { icon: "📋", title: "Rapport mensuel d'évolution", desc: "Vous voyez la progression mois par mois." },
              { icon: "💡", title: "Réponse à vos avis Google", desc: "Je réponds à vos avis chaque semaine pour vous." },
              { icon: "🤝", title: "Support WhatsApp direct", desc: "Je réponds sous 2h. Pas un chatbot. Moi." },
            ].map(({ icon, title, desc }) => (
              <FadeIn key={title}>
                <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-2xl shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 mb-0.5">{title}</p>
                    <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ════════════════════════════════════════════════════════ */}
      <section id="tarif" className="bg-white py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light">Simple. Transparent.</h2>
          </FadeIn>
          <FadeIn>
            <div className="max-w-sm mx-auto">
              <div className="rounded-3xl border-2 border-neutral-900 bg-white shadow-2xl shadow-neutral-200 overflow-hidden">
                <div className="bg-neutral-900 px-8 py-6 text-center">
                  <div className="text-5xl font-black text-white mb-1">79€</div>
                  <div className="text-neutral-400 text-sm">par mois · sans engagement</div>
                </div>
                <div className="px-8 py-6 space-y-4">
                  {["WhatsApp automatique J+1 et J+6", "Filtre anti-mauvais avis", "Tableau de bord en temps réel", "Rapport mensuel d'évolution", "Réponse aux avis Google (1x/semaine)", "Support WhatsApp — réponse sous 2h"].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-neutral-700">
                      <span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="px-8 pb-8">
                  <a href="https://wa.me/33622129675" className="block w-full bg-neutral-900 hover:bg-neutral-700 text-white rounded-full px-8 py-3.5 font-semibold transition-colors text-center text-sm mb-3">
                    Démarrer maintenant →
                  </a>
                  <p className="text-center text-xs text-neutral-400">Résiliation à tout moment · Pas de frais cachés</p>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2} className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 max-w-md">
              <span className="text-2xl">🧮</span>
              <p className="text-sm text-emerald-800"><strong>ROI garanti :</strong> 1 client Google = 50–200€. Il suffit d&apos;1 par mois pour être rentable. La plupart en ont 3 à 5 dès le 2ème mois.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FAQ ════════════════════════════════════════════════════════════ */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light">Vos questions</h2>
          </FadeIn>
          <div className="max-w-2xl mx-auto space-y-3">
            {[
              { q: "Est-ce que mes clients vont trouver ça bizarre ?", a: "Non. Le message WhatsApp est naturel, chaleureux, personnalisé avec leur prénom et votre nom. 40% des clients cliquent. C'est 3x plus qu'un email." },
              { q: "Et si un client est insatisfait ?", a: "Il ne va pas sur Google. Il répond en privé et son message arrive sur votre tableau de bord. Vous gérez, vous fidélisez. Seuls les clients heureux publient un avis." },
              { q: "Je dois installer quelque chose ?", a: "Non. Juste une URL sur votre téléphone pour noter prénom + numéro après chaque client. 10 secondes maximum." },
              { q: "Combien de temps avant de voir des résultats ?", a: "Les premiers avis arrivent dans les 48h suivant le lancement. En général +10 nouveaux avis dès le 1er mois." },
              { q: "Sans engagement, ça veut dire quoi ?", a: "Vous payez mois par mois. Vous arrêtez quand vous voulez, sans frais ni justification. Je ne fais pas de rétention." },
              { q: "Est-ce conforme au RGPD ?", a: "Oui. Les numéros WhatsApp sont collectés avec accord du client. Les données sont stockées sur des serveurs sécurisés européens." },
            ].map(({ q, a }) => (
              <FadeIn key={q}>
                <details className="group rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-neutral-900 hover:bg-slate-50 transition-colors list-none text-sm">
                    {q}
                    <span className="text-neutral-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4">↓</span>
                  </summary>
                  <div className="px-5 pb-5 text-neutral-600 leading-relaxed text-sm border-t border-slate-100 pt-4">{a}</div>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ══════════════════════════════════════════════════════ */}
      <section className="relative bg-neutral-950 py-24 sm:py-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        {/* flying stars */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-400/30 select-none pointer-events-none text-2xl"
            style={{ left: `${10 + i * 11}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.5, delay: i * 0.4 }}
          >★</motion.div>
        ))}

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <div className="text-5xl mb-6">🏆</div>
            <h2 className="font-[family-name:var(--font-cormorant)] text-5xl sm:text-6xl font-light text-white mb-6">
              Devenez la référence<br />de votre ville
            </h2>
            <p className="text-neutral-400 text-lg mb-10 leading-relaxed">
              Envoyez-moi un message WhatsApp. On échange 10 minutes.
              Je vous montre exactement où vous en êtes sur Google et ce qu&apos;on peut construire ensemble.
            </p>

            <a
              href="https://wa.me/33622129675"
              className="inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full px-10 py-4 font-semibold transition-all text-lg shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 mb-8"
            >
              <span className="text-xl">💬</span>
              Contacter Jean-Philippe sur WhatsApp
            </a>

            <div className="flex items-center justify-center gap-6 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Réponse sous 2h</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 79€/mois</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Sans engagement</span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════════════════════ */}
      <AvisGoogleFooter />
    </main>
  );
}

// ─── Footer avec popups légaux ────────────────────────────────────────────────
function AvisGoogleFooter() {
  const [modal, setModal] = useState<"cgv" | "cgu" | "mentions" | "contact" | null>(null);

  return (
    <>
      <footer className="bg-neutral-950 border-t border-white/5 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-xs">⭐</div>
              <span className="text-white font-semibold text-sm">Review <span className="text-emerald-400">Booster</span></span>
              <span className="text-neutral-600 text-xs ml-1">by Popey Academy</span>
            </div>

            {/* Legal links */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-neutral-500">
              {([
                ["CGV", "cgv"],
                ["CGU", "cgu"],
                ["Mentions légales", "mentions"],
                ["Contact", "contact"],
              ] as [string, "cgv" | "cgu" | "mentions" | "contact"][]).map(([label, key]) => (
                <button
                  key={key}
                  onClick={() => setModal(key)}
                  className="hover:text-white transition-colors underline-offset-2 hover:underline"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-neutral-600 text-xs">© {new Date().getFullYear()} Popey Academy. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Modales légales */}
      <AnimatePresence>
        {modal && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: "spring", bounce: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-neutral-900">
                  {modal === "cgv" && "Conditions Générales de Vente"}
                  {modal === "cgu" && "Conditions Générales d'Utilisation"}
                  {modal === "mentions" && "Mentions Légales"}
                  {modal === "contact" && "Nous contacter"}
                </h3>
                <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-neutral-500 transition-colors text-lg leading-none">×</button>
              </div>

              {/* Modal content */}
              <div className="overflow-y-auto px-6 py-5 text-sm text-neutral-600 leading-relaxed space-y-4">
                {modal === "mentions" && (
                  <>
                    <p><strong className="text-neutral-900">Éditeur du service</strong><br />
                    Popey Academy<br />
                    23 rue Paul Lahragou, 40100 Dax<br />
                    SIRET : 840 800 106<br />
                    Email : <a href="mailto:contact@popey.academy" className="text-emerald-600 hover:underline">contact@popey.academy</a></p>

                    <p><strong className="text-neutral-900">Directeur de la publication</strong><br />
                    Jean-Philippe — fondateur de Popey Academy</p>

                    <p><strong className="text-neutral-900">Hébergeur</strong><br />
                    Vercel Inc. — 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>

                    <p><strong className="text-neutral-900">Propriété intellectuelle</strong><br />
                    Toute reproduction, représentation ou adaptation du contenu de ce site est interdite sans autorisation écrite préalable de Popey Academy.</p>
                  </>
                )}

                {modal === "cgv" && (
                  <>
                    <p><strong className="text-neutral-900">Prestataire</strong><br />
                    Popey Academy · 23 rue Paul Lahragou, 40100 Dax · SIRET 840 800 106</p>

                    <p><strong className="text-neutral-900">Service proposé</strong><br />
                    Review Booster est un service d'automatisation de collecte d'avis Google via WhatsApp. L'abonnement mensuel est de 79€/mois, sans engagement de durée.</p>

                    <p><strong className="text-neutral-900">Facturation & paiement</strong><br />
                    Le service est facturé mensuellement. Le paiement s'effectue par virement ou carte bancaire. En cas de non-paiement, le service est suspendu après mise en demeure.</p>

                    <p><strong className="text-neutral-900">Résiliation</strong><br />
                    Vous pouvez résilier votre abonnement à tout moment, sans frais ni préavis, en envoyant un message à <a href="mailto:contact@popey.academy" className="text-emerald-600 hover:underline">contact@popey.academy</a>. La résiliation prend effet à la fin de la période en cours.</p>

                    <p><strong className="text-neutral-900">Responsabilité</strong><br />
                    Popey Academy s'engage à déployer les moyens nécessaires pour assurer la continuité du service mais ne peut être tenu responsable des aléas techniques liés aux plateformes tierces (WhatsApp, Google).</p>

                    <p><strong className="text-neutral-900">Droit applicable</strong><br />
                    Les présentes CGV sont soumises au droit français. Tout litige relève de la compétence des tribunaux de Dax.</p>
                  </>
                )}

                {modal === "cgu" && (
                  <>
                    <p><strong className="text-neutral-900">Accès au service</strong><br />
                    L'utilisation de Review Booster est réservée aux professionnels (commerçants, artisans, prestataires de services) ayant souscrit un abonnement valide.</p>

                    <p><strong className="text-neutral-900">Utilisation des données clients</strong><br />
                    Les numéros de téléphone et prénoms saisis dans l'application sont utilisés exclusivement pour l'envoi des messages WhatsApp liés au service. Ces données ne sont jamais revendues ni partagées avec des tiers.</p>

                    <p><strong className="text-neutral-900">Consentement des destinataires</strong><br />
                    L'utilisateur certifie que les clients dont il saisit les coordonnées ont bien fréquenté son établissement et peuvent légitimement recevoir un message de suivi. Il est responsable du respect du RGPD pour les données qu'il collecte.</p>

                    <p><strong className="text-neutral-900">Comportement prohibé</strong><br />
                    Il est interdit d'utiliser le service pour envoyer des messages à des personnes n'ayant pas eu de relation commerciale avec vous, ou de façon abusive (spam).</p>

                    <p><strong className="text-neutral-900">Modifications</strong><br />
                    Popey Academy se réserve le droit de modifier les présentes CGU. Les utilisateurs sont informés par email avec un préavis de 30 jours.</p>
                  </>
                )}

                {modal === "contact" && (
                  <>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                      <span className="text-2xl">💬</span>
                      <div>
                        <p className="font-semibold text-emerald-800 mb-1">WhatsApp — réponse sous 2h</p>
                        <a href="https://wa.me/33622129675" className="text-emerald-700 hover:underline font-medium">+33 6 22 12 96 75</a>
                        <p className="text-xs text-emerald-600 mt-0.5">La façon la plus rapide pour démarrer ou poser une question.</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                      <span className="text-2xl">📧</span>
                      <div>
                        <p className="font-semibold text-neutral-800 mb-1">Email</p>
                        <a href="mailto:contact@popey.academy" className="text-emerald-600 hover:underline">contact@popey.academy</a>
                        <p className="text-xs text-neutral-500 mt-0.5">Pour les demandes administratives, devis ou partenariats.</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                      <span className="text-2xl">📍</span>
                      <div>
                        <p className="font-semibold text-neutral-800 mb-1">Adresse</p>
                        <p>Popey Academy<br />23 rue Paul Lahragou<br />40100 Dax, France</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
