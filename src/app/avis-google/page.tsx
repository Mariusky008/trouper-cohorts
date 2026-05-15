"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut", delay } } }}
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

function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 220, height: 440 }}>
      {/* Phone frame */}
      <div className="absolute inset-0 rounded-[2.8rem] bg-neutral-900 shadow-2xl shadow-black/60 border-2 border-neutral-700" />
      <div className="absolute inset-[3px] rounded-[2.5rem] bg-[#075E54] overflow-hidden flex flex-col">
        {/* Status bar */}
        <div className="bg-[#075E54] px-4 pt-3 pb-2 flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-emerald-300 flex items-center justify-center text-xs font-bold text-emerald-900">JP</div>
          <div>
            <div className="text-white text-xs font-semibold leading-none">Jean-Philippe</div>
            <div className="text-green-300 text-[10px]">en ligne</div>
          </div>
        </div>
        {/* Chat */}
        <div className="flex-1 bg-[#ECE5DD] px-2 pt-2 pb-2 space-y-2 overflow-hidden" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5bdb4' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
          {/* Incoming message */}
          <div className="flex justify-start">
            <div className="bg-white rounded-xl rounded-tl-sm px-2.5 py-1.5 max-w-[75%] shadow-sm">
              <p className="text-[10px] text-neutral-800 leading-tight">Bonjour Martin 👋</p>
              <p className="text-[10px] text-neutral-800 leading-tight mt-0.5">Merci pour votre visite chez <strong>Salon Éclat</strong> ✨</p>
              <p className="text-[10px] text-neutral-600 mt-1">Votre avis nous aide beaucoup !</p>
              <div className="mt-1.5 bg-emerald-500 rounded-lg px-2 py-1 text-center">
                <span className="text-white text-[10px] font-semibold">⭐ Laisser mon avis</span>
              </div>
              <p className="text-[9px] text-neutral-400 text-right mt-0.5">10:23 ✓✓</p>
            </div>
          </div>
          {/* Reply */}
          <div className="flex justify-end">
            <div className="bg-[#dcf8c6] rounded-xl rounded-tr-sm px-2.5 py-1.5 max-w-[70%] shadow-sm">
              <p className="text-[10px] text-neutral-800">Avec plaisir ! 😊</p>
              <p className="text-[9px] text-neutral-400 text-right mt-0.5">10:31 ✓✓</p>
            </div>
          </div>
          {/* Relance J+6 */}
          <div className="flex justify-start">
            <div className="bg-white rounded-xl rounded-tl-sm px-2.5 py-1.5 max-w-[75%] shadow-sm">
              <p className="text-[10px] text-neutral-800 leading-tight">Martin, vous avez pensé à cet avis ? 🙏</p>
              <div className="mt-1 bg-emerald-500 rounded-lg px-2 py-1 text-center">
                <span className="text-white text-[10px] font-semibold">⭐ 2 min, c&apos;est tout</span>
              </div>
              <p className="text-[9px] text-neutral-400 text-right mt-0.5">J+6 ✓✓</p>
            </div>
          </div>
        </div>
        {/* Input bar */}
        <div className="bg-[#F0F0F0] px-2 py-1.5 flex items-center gap-1 shrink-0">
          <div className="flex-1 bg-white rounded-full px-2 py-1">
            <span className="text-[10px] text-neutral-400">Message</span>
          </div>
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-[9px]">↑</span>
          </div>
        </div>
      </div>
      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-neutral-900 rounded-full" />
    </div>
  );
}

function GoogleMapsMockup({ position, rating, reviews, name, isTop }: { position: number; rating: number; reviews: number; name: string; isTop: boolean }) {
  return (
    <div className={`rounded-xl border p-3 shadow-sm transition-all ${isTop ? "bg-white border-emerald-200 ring-2 ring-emerald-400" : "bg-white border-gray-200 opacity-70"}`}>
      <div className="flex items-start gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isTop ? "bg-emerald-500" : "bg-gray-400"}`}>
          {position}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isTop ? "text-emerald-700" : "text-gray-500"}`}>{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-yellow-400 text-xs">{"★".repeat(Math.round(rating))}</span>
            <span className="text-xs text-gray-600 font-medium">{rating}</span>
            <span className="text-xs text-gray-400">({reviews} avis)</span>
          </div>
        </div>
        {isTop && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full shrink-0">TOP</span>}
      </div>
    </div>
  );
}

export default function AvisGooglePage() {
  return (
    <main className="bg-white text-neutral-900 overflow-x-hidden">
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-neutral-950">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-widest uppercase rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Spécialiste avis Google
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-[family-name:var(--font-cormorant)] text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.1] text-white mb-6"
            >
              De 60 à<br />
              <span className="text-emerald-400">500 avis Google</span><br />
              sans effort
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-neutral-400 text-lg leading-relaxed mb-8 max-w-lg"
            >
              Vos clients satisfaits reçoivent un WhatsApp automatique après leur visite.
              Ils cliquent, ils écrivent, vous montez dans Google. <strong className="text-white">Vous ne faites rien.</strong>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <a
                href="https://wa.me/33622129675"
                className="group inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full px-7 py-3.5 font-semibold transition-all text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
              >
                <span>💬</span> Démarrer — 79€/mois
              </a>
              <a
                href="#comment-ca-marche"
                className="inline-flex items-center justify-center gap-2 border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white rounded-full px-7 py-3.5 font-semibold transition-all text-sm"
              >
                Voir comment ça marche ↓
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-4 text-xs text-neutral-500"
            >
              <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Sans engagement</span>
              <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Résultats dès J+2</span>
              <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Zéro effort</span>
            </motion.div>
          </div>

          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: -2 }}
            transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              <div className="absolute -inset-8 bg-emerald-500/10 rounded-full blur-2xl" />
              <PhoneMockup />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-neutral-500"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-lg"
          >↓</motion.div>
        </motion.div>
      </section>

      {/* ─── BEFORE / AFTER ──────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-rose-500 mb-3 block">La réalité aujourd&apos;hui</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light">
              Vos concurrents vous <span className="italic text-rose-500">écrasent</span> sur Google
            </h2>
            <p className="mt-4 text-neutral-500 max-w-xl mx-auto">
              Le client tape &ldquo;coiffeur Bordeaux&rdquo;. Il clique sur les 3 premiers. Vous êtes en 8ème position. Il ne vous voit pas.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Before */}
            <FadeIn delay={0.1}>
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-rose-50 border-b border-rose-100 px-5 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Avant — Aujourd&apos;hui</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-xs text-gray-400 mb-3 font-medium">Résultats Google Maps — &ldquo;coiffeur bordeaux&rdquo;</div>
                  <GoogleMapsMockup position={1} rating={4.8} reviews={487} name="Salon Prestige" isTop={true} />
                  <GoogleMapsMockup position={2} rating={4.7} reviews={312} name="Studio Coif'" isTop={false} />
                  <GoogleMapsMockup position={3} rating={4.6} reviews={201} name="L'Atelier Cheveux" isTop={false} />
                  <div className="border-t border-dashed border-gray-200 my-2 pt-2">
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-rose-400 flex items-center justify-center text-xs font-bold text-white shrink-0">8</div>
                      <div>
                        <p className="text-sm font-semibold text-rose-500 truncate">Votre salon</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-yellow-400 text-xs">★★★★☆</span>
                          <span className="text-xs text-gray-500">4.4 <span className="text-gray-400">(62 avis)</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>

            {/* After */}
            <FadeIn delay={0.25}>
              <div className="rounded-2xl bg-white border border-emerald-200 shadow-sm overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Après — 12 mois</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-xs text-gray-400 mb-3 font-medium">Résultats Google Maps — &ldquo;coiffeur bordeaux&rdquo;</div>
                  <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-3 flex items-center gap-2 ring-2 ring-emerald-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white shrink-0">1</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-emerald-700 truncate">Votre salon ✨</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-yellow-400 text-xs">★★★★★</span>
                        <span className="text-xs text-gray-700 font-medium">4.8 <span className="text-gray-400">(186 avis)</span></span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full">#1</span>
                  </div>
                  <GoogleMapsMockup position={2} rating={4.8} reviews={487} name="Salon Prestige" isTop={false} />
                  <GoogleMapsMockup position={3} rating={4.7} reviews={312} name="Studio Coif'" isTop={false} />
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.3} className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 bg-emerald-900/5 border border-emerald-200 rounded-2xl px-6 py-4">
              <span className="text-2xl">📈</span>
              <p className="text-sm text-emerald-800 font-medium">
                +10 avis réels par mois · de 62 à 186 avis en 12 mois · position #1 dans votre ville
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="comment-ca-marche" className="bg-white py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3 block">Le processus</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light">
              3 étapes. <span className="italic">10 secondes</span> de votre temps.
            </h2>
          </FadeIn>

          <StaggerIn className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                emoji: "📱",
                color: "emerald",
                title: "Vous notez le client",
                desc: "Après la prestation, vous entrez le prénom + numéro WhatsApp en 10 secondes dans un formulaire simple.",
                detail: "Une URL sur votre téléphone. C'est tout.",
              },
              {
                step: "02",
                emoji: "🤖",
                color: "violet",
                title: "On envoie automatiquement",
                desc: "Le lendemain matin, votre client reçoit un WhatsApp chaleureux, personnalisé avec son prénom et votre nom.",
                detail: "Message J+1, puis relance J+6 si pas de réponse.",
              },
              {
                step: "03",
                emoji: "📈",
                color: "amber",
                title: "Vous montez dans Google",
                desc: "Les avis s'accumulent chaque semaine. Google vous remonte. Les nouveaux clients vous trouvent en premier.",
                detail: "Résultats visibles dès le 2ème mois.",
              },
            ].map(({ step, emoji, color, title, desc, detail }) => (
              <motion.div
                key={step}
                variants={fadeUp}
                className={`rounded-2xl border p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 ${
                  color === "emerald" ? "border-emerald-100 bg-emerald-50/50" :
                  color === "violet" ? "border-violet-100 bg-violet-50/50" :
                  "border-amber-100 bg-amber-50/50"
                }`}
              >
                <div className={`text-6xl font-black absolute -top-2 -right-2 select-none ${
                  color === "emerald" ? "text-emerald-100" :
                  color === "violet" ? "text-violet-100" :
                  "text-amber-100"
                }`}>{step}</div>
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed mb-3">{desc}</p>
                <p className={`text-xs font-semibold ${
                  color === "emerald" ? "text-emerald-600" :
                  color === "violet" ? "text-violet-600" :
                  "text-amber-600"
                }`}>{detail}</p>
              </motion.div>
            ))}
          </StaggerIn>
        </div>
      </section>

      {/* ─── THE MAGIC FILTER ────────────────────────────────────────────── */}
      <section className="bg-neutral-950 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        <div className="absolute -top-32 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3 block">La fonctionnalité secrète</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light text-white mb-4">
              Les insatisfaits restent <span className="text-rose-400">privés</span>
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Avant de diriger un client vers Google, on lui pose la question. Sa réponse détermine la suite.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <FadeIn delay={0.1}>
              <div className="rounded-2xl bg-neutral-900 border border-rose-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-lg">😕</div>
                  <span className="text-rose-400 font-semibold text-sm">&ldquo;Bof, pas super...&rdquo;</span>
                </div>
                <div className="bg-neutral-800 rounded-xl p-4 mb-4">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Le client exprime son mécontentement. Ce message vous arrive <strong className="text-white">en privé</strong> sur votre tableau de bord.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-rose-400">
                  <span>🔒</span>
                  <span>Jamais publié sur Google</span>
                </div>
                <p className="mt-3 text-xs text-neutral-500">Vous gérez le problème, vous gardez votre réputation.</p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="rounded-2xl bg-neutral-900 border border-emerald-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg">😍</div>
                  <span className="text-emerald-400 font-semibold text-sm">&ldquo;Parfait, super !&rdquo;</span>
                </div>
                <div className="bg-neutral-800 rounded-xl p-4 mb-4">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Le client est redirigé vers votre fiche Google et laisse un <strong className="text-white">vrai avis 5 étoiles</strong> en 2 clics.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span>⭐</span>
                  <span>Publié sur votre fiche Google</span>
                </div>
                <p className="mt-3 text-xs text-neutral-500">+1 avis. Compteur qui monte. Ranking qui suit.</p>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.3} className="mt-10 text-center">
            <p className="text-neutral-400 text-sm">
              Résultat : votre note Google <strong className="text-white">monte</strong>, vos problèmes restent <strong className="text-white">privés</strong>.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <StaggerIn className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { value: "+10", label: "avis réels par mois", sub: "en moyenne sur nos clients actifs", color: "emerald" },
              { value: "4,7★", label: "note moyenne", sub: "atteinte après 6 mois de service", color: "amber" },
              { value: "40%", label: "taux de clic", sub: "des clients cliquent sur le bouton avis", color: "violet" },
            ].map(({ value, label, sub, color }) => (
              <motion.div key={label} variants={fadeUp} className="space-y-2">
                <div className={`text-5xl font-black ${
                  color === "emerald" ? "text-emerald-500" :
                  color === "amber" ? "text-amber-500" :
                  "text-violet-500"
                }`}>{value}</div>
                <div className="font-semibold text-neutral-900">{label}</div>
                <div className="text-sm text-neutral-400">{sub}</div>
              </motion.div>
            ))}
          </StaggerIn>
        </div>
      </section>

      {/* ─── 500 AVIS ─────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-950 via-neutral-900 to-violet-950 py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4 block">L&apos;objectif ultime</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-5xl sm:text-7xl font-light text-white mb-6 leading-tight">
              500 avis : le seuil<br />où vous devenez<br /><span className="text-emerald-400 italic">imbattable</span>
            </h2>
            <p className="text-neutral-300 text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
              Dans votre ville, combien de concurrents ont plus de 200 avis ? <strong className="text-white">Un ou deux.</strong>
              Celui qui en a 500 devient LA référence. Les autres travaillent pour lui.
              <br /><br />
              À 79€/mois, vous y êtes en moins de 4 ans — et vous prenez de l&apos;avance <strong className="text-emerald-400">dès le 6ème mois.</strong>
            </p>

            {/* Timeline */}
            <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto mb-12">
              {[
                { mois: "M1", avis: "10", label: "Premiers avis", active: false },
                { mois: "M6", avis: "60", label: "Top 3 local", active: false },
                { mois: "M12", avis: "120", label: "Référence ville", active: false },
                { mois: "M48", avis: "500+", label: "Imbattable", active: true },
              ].map(({ mois, avis, label, active }) => (
                <div key={mois} className={`rounded-xl p-3 border ${active ? "border-emerald-400 bg-emerald-400/10" : "border-neutral-700 bg-neutral-800/50"}`}>
                  <div className="text-xs text-neutral-400 mb-1">{mois}</div>
                  <div className={`text-2xl font-bold ${active ? "text-emerald-400" : "text-white"}`}>{avis}</div>
                  <div className="text-xs text-neutral-400">{label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── WHAT'S INCLUDED ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3 block">Votre abonnement</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light">
              Tout inclus. Rien à gérer.
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: "💬", title: "WhatsApp automatique J+1 et J+6", desc: "Message chaleureux, personnalisé avec le prénom." },
              { icon: "🔒", title: "Filtre anti-mauvais avis", desc: "Les insatisfaits restent en privé. Toujours." },
              { icon: "📊", title: "Tableau de bord en temps réel", desc: "Vos stats, vos avis, vos clients — tout en un." },
              { icon: "📋", title: "Rapport mensuel d&apos;évolution", desc: "Vous voyez la progression mois par mois." },
              { icon: "💡", title: "Réponse à vos avis Google", desc: "Je réponds à vos avis chaque semaine pour vous." },
              { icon: "🤝", title: "Support WhatsApp direct", desc: "Je réponds sous 2h. Pas un chatbot. Moi." },
            ].map(({ icon, title, desc }) => (
              <FadeIn key={title}>
                <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <span className="text-2xl shrink-0">{icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-neutral-900 mb-0.5" dangerouslySetInnerHTML={{ __html: title }} />
                    <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3 block">Tarif</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light">
              Simple. Transparent.
            </h2>
          </FadeIn>

          <FadeIn>
            <div className="max-w-sm mx-auto">
              <div className="rounded-3xl border-2 border-neutral-900 bg-white shadow-2xl shadow-neutral-200 overflow-hidden">
                <div className="bg-neutral-900 px-8 py-6 text-center">
                  <div className="text-5xl font-black text-white mb-1">79€</div>
                  <div className="text-neutral-400 text-sm">par mois · sans engagement</div>
                </div>
                <div className="px-8 py-6 space-y-4">
                  {[
                    "WhatsApp automatique J+1 et J+6",
                    "Filtre anti-mauvais avis",
                    "Tableau de bord en temps réel",
                    "Rapport mensuel d'évolution",
                    "Réponse aux avis Google (1x/semaine)",
                    "Support WhatsApp — réponse sous 2h",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-neutral-700">
                      <span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="px-8 pb-8">
                  <a
                    href="https://wa.me/33622129675"
                    className="block w-full bg-neutral-900 hover:bg-neutral-700 text-white rounded-full px-8 py-3.5 font-semibold transition-colors text-center text-sm mb-3"
                  >
                    Démarrer maintenant →
                  </a>
                  <p className="text-center text-xs text-neutral-400">
                    Résiliation à tout moment · Pas de frais cachés
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2} className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 max-w-md">
              <span className="text-2xl">🧮</span>
              <p className="text-sm text-emerald-800">
                <strong>ROI garanti :</strong> 1 nouveau client Google = 50 à 200€.
                Il suffit d&apos;1 client par mois pour être rentable.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-14">
            <h2 className="font-[family-name:var(--font-cormorant)] text-4xl sm:text-5xl font-light">
              Vos questions
            </h2>
          </FadeIn>

          <div className="max-w-2xl mx-auto space-y-3">
            {[
              {
                q: "Est-ce que mes clients vont trouver ça bizarre ?",
                a: "Non. Le message WhatsApp est naturel, chaleureux, personnalisé avec leur prénom et votre nom. 40% des clients cliquent. C'est 3x plus qu'un email.",
              },
              {
                q: "Et si un client est insatisfait ?",
                a: "Il ne va pas sur Google. Il répond en privé et son message arrive sur votre tableau de bord. Vous gérez, vous fidélisez. Seuls les clients heureux publient un avis.",
              },
              {
                q: "Je dois installer quelque chose ?",
                a: "Non. Juste une URL sur votre téléphone pour noter prénom + numéro après chaque client. 10 secondes maximum.",
              },
              {
                q: "Combien de temps avant de voir des résultats ?",
                a: "Les premiers avis arrivent dans les 48h suivant le lancement. En général +10 nouveaux avis dès le 1er mois.",
              },
              {
                q: "Sans engagement, ça veut dire quoi ?",
                a: "Vous payez mois par mois, par virement ou carte. Vous arrêtez quand vous voulez, sans frais ni justification. Je ne fais pas de rétention.",
              },
              {
                q: "Est-ce conforme au RGPD ?",
                a: "Oui. Les numéros WhatsApp sont collectés avec accord du client (il les donne volontairement). Les données sont stockées sur des serveurs sécurisés européens.",
              },
            ].map(({ q, a }) => (
              <FadeIn key={q}>
                <details className="group rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-neutral-900 hover:bg-slate-50 transition-colors list-none text-sm">
                    {q}
                    <span className="text-neutral-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4">↓</span>
                  </summary>
                  <div className="px-5 pb-5 text-neutral-600 leading-relaxed text-sm border-t border-slate-100 pt-4">
                    {a}
                  </div>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative bg-neutral-950 py-24 sm:py-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-6 block">Prochaine étape</span>
            <h2 className="font-[family-name:var(--font-cormorant)] text-5xl sm:text-6xl font-light text-white mb-6">
              Devenez la référence<br />de votre ville
            </h2>
            <p className="text-neutral-400 text-lg mb-10 leading-relaxed">
              Envoyez-moi un message WhatsApp. On échange 10 minutes.
              Je vous montre exactement où vous en êtes sur Google et ce qu&apos;on peut faire.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <a
                href="https://wa.me/33622129675"
                className="group inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full px-8 py-4 font-semibold transition-all text-base shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1"
              >
                <span className="text-xl">💬</span>
                Contacter Jean-Philippe sur WhatsApp
              </a>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Réponse sous 2h</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 79€/mois</span>
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Sans engagement</span>
            </div>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
