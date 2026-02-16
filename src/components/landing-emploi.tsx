"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Anchor, ArrowRight, Brain, CheckCircle2, Compass, HelpCircle, LayoutList, LifeBuoy, Map, Rocket, ShieldCheck, Ship, Sparkles, Target, Users, Zap } from "lucide-react";
import { motion, useScroll } from "framer-motion";
import { useRef } from "react";
import { PreRegistrationForm } from "@/components/pre-registration-form";

// --- ANIMATIONS ---

const Wave = ({ className }: { className?: string }) => (
  <div className={`absolute w-full overflow-hidden leading-none ${className}`}>
    <svg className="relative block w-[calc(100%+1.3px)] h-[150px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-current"></path>
    </svg>
  </div>
);

const FloatingIcon = ({ children, delay = 0, duration = 3 }: { children: React.ReactNode, delay?: number, duration?: number }) => (
    <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration, ease: "easeInOut", delay }}
    >
        {children}
    </motion.div>
);

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export function LandingEmploi() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  return (
    <div ref={targetRef} className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      
      {/* Header - Fixed Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-white/50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 text-purple-600">
                <Anchor className="h-full w-full" strokeWidth={2.5} />
             </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic text-slate-900">Popey <span className="text-purple-600">Academy</span></span>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-sm font-bold text-purple-600 uppercase tracking-widest animate-pulse flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                Inscriptions Ouvertes
             </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-500 hover:text-purple-600 font-bold uppercase tracking-wider hidden sm:flex" asChild>
                <Link href="/login">Connexion</Link>
            </Button>
            <Link 
                href="#join" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider h-10 px-6 inline-flex items-center justify-center rounded-full text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
                Postuler
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-40 pb-32">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-slate-50 z-0" />
          
          <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
            <div className="space-y-8">
                <FloatingIcon>
                    <Badge className="bg-white text-blue-600 border-2 border-blue-100 px-4 py-1.5 text-sm uppercase tracking-widest font-black mb-4 shadow-sm">
                        🚀 Programme 5 Semaines
                    </Badge>
                </FloatingIcon>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.95] text-blue-950">
                  Et si dans 5 semaines<br />
                  tu passais de<br />
                  <span className="text-purple-600">“je ne sais pas quoi faire de ma vie”</span><br/>
                  à entrepreneur avec tes premiers clients ?
                </h1>
                
                <div className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto font-medium leading-relaxed space-y-6">
                    <div className="grid md:grid-cols-2 gap-8 text-left bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mt-8">
                        <div>
                            <span className="block text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Formation 1</span>
                            <p className="text-slate-900 font-bold">3 semaines pour découvrir le métier qui te correspond vraiment.</p>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-purple-500 uppercase tracking-widest mb-1">Formation 2</span>
                            <p className="text-slate-900 font-bold">2 semaines avec 23 autres personnes pour trouver tes premiers clients.</p>
                        </div>
                    </div>

                    <p className="text-center font-black text-slate-900 text-2xl pt-4">
                        Dans 5 semaines, tu ne cherches plus ta voie.<br/>
                        <span className="text-purple-600 underline decoration-4 underline-offset-4">Tu es dans le mouvement.</span>
                    </p>
                </div>

                <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6 px-4">
                    <Button size="lg" className="h-auto min-h-[4rem] py-4 px-6 md:px-10 bg-purple-600 hover:bg-purple-500 text-white font-black text-base md:text-xl uppercase tracking-widest rounded-full shadow-xl shadow-purple-200 hover:shadow-2xl hover:-translate-y-1 transition-all w-full md:w-auto whitespace-normal leading-tight" asChild>
                        <Link href="#join" className="flex items-center justify-center text-center">
                            <span className="flex items-center gap-3 text-center justify-center">
                                <span>Je candidate au programme</span>
                                <Rocket className="h-6 w-6 shrink-0" />
                            </span>
                        </Link>
                    </Button>
                </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 w-full text-white z-20 pointer-events-none">
             <Wave />
          </div>
        </section>

        {/* SECTION 1 — PREUVES CHIFFRÉES */}
        <section className="py-16 bg-white relative z-30 -mt-10 mx-4">
            <div className="container mx-auto max-w-5xl">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-black uppercase italic text-slate-900">Ils ont déjà fait le pas</h2>
                        <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
                            Des personnes qui, comme vous, doutaient, hésitaient ou ne savaient pas par où commencer. Aujourd’hui, elles avancent.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="space-y-2">
                            <div className="text-4xl md:text-5xl font-black text-purple-600">+120</div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide">Participants accompagnés</p>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl md:text-5xl font-black text-blue-600">85%</div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide">Trouvent une voie claire</p>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl md:text-5xl font-black text-green-600">72%</div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide">Obtiennent des opportunités</p>
                        </div>
                        <div className="space-y-2">
                            <div className="text-4xl md:text-5xl font-black text-orange-600">4,8/5</div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide">Satisfaction moyenne</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 2. VISION IDENTITAIRE */}
        <section className="py-24 bg-slate-900 text-white relative z-20">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <FadeIn>
                            <h2 className="text-4xl font-black uppercase italic mb-8 leading-tight">
                                La Transformation<br/><span className="text-purple-500">en 5 semaines</span>
                            </h2>
                        </FadeIn>
                        
                        <FadeIn delay={0.1}>
                            <div className="space-y-6">
                                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                    <h3 className="text-slate-400 font-bold uppercase text-sm mb-4 flex items-center gap-2">
                                        <HelpCircle className="h-4 w-4" /> Tu entres avec :
                                    </h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-3 text-slate-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-500"></div>
                                            Du doute
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-500"></div>
                                            Des questions
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-300">
                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-500"></div>
                                            Aucune direction claire
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-white/5 p-6 rounded-2xl border border-purple-500/30 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
                                    <h3 className="text-purple-500 font-black uppercase text-sm mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" /> Tu ressors avec :
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ul className="space-y-3">
                                            <li className="flex items-center gap-2 text-white font-bold">
                                                <CheckCircle2 className="h-4 w-4 text-purple-500" /> Ton métier identifié
                                            </li>
                                            <li className="flex items-center gap-2 text-white font-bold">
                                                <CheckCircle2 className="h-4 w-4 text-purple-500" /> Une offre claire
                                            </li>
                                            <li className="flex items-center gap-2 text-white font-bold">
                                                <CheckCircle2 className="h-4 w-4 text-purple-500" /> Un positionnement défini
                                            </li>
                                        </ul>
                                        <ul className="space-y-3">
                                            <li className="flex items-center gap-2 text-white font-bold">
                                                <CheckCircle2 className="h-4 w-4 text-purple-500" /> Un plan d’action prêt
                                            </li>
                                            <li className="flex items-center gap-2 text-white font-bold">
                                                <CheckCircle2 className="h-4 w-4 text-purple-500" /> Des contacts
                                            </li>
                                            <li className="flex items-center gap-2 text-white font-bold">
                                                <CheckCircle2 className="h-4 w-4 text-purple-500" /> Des rendez-vous
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full" />
                        <div className="relative bg-slate-800 border border-slate-700 p-8 rounded-2xl text-center space-y-8 shadow-xl">
                            <div className="space-y-4">
                                <p className="text-2xl font-black uppercase italic text-slate-400 line-through decoration-2 decoration-slate-600">
                                    Tu es sans emploi.
                                </p>
                                <ArrowRight className="h-8 w-8 text-purple-500 mx-auto rotate-90 md:rotate-0" />
                                <p className="text-3xl md:text-4xl font-black uppercase italic text-white leading-tight">
                                    Tu es entrepreneur<br/><span className="text-blue-500">en action.</span>
                                </p>
                            </div>

                            <div className="pt-8 border-t border-slate-700">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-3xl font-black text-white mb-1">5</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Semaines</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-purple-500 mb-1">2</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Formations</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-blue-500 mb-1">1</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vocation</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 3. DÉTAIL DES 2 PHASES */}
        <section className="py-32 bg-white relative z-20">
            <div className="container mx-auto px-4 max-w-6xl space-y-24">
                
                {/* PHASE 1 */}
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <FadeIn>
                            <div className="inline-block bg-blue-100 text-blue-700 font-black border-2 border-blue-200 mb-6 uppercase tracking-widest px-6 py-3 rounded-full text-sm shadow-sm">
                                Partie 1 • La Fondation
                            </div>
                            <h2 className="text-4xl font-black uppercase italic text-slate-900 leading-tight">
                                3 Semaines pour<br/>trouver <span className="text-blue-600">ta voie</span>
                            </h2>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <p className="text-lg text-slate-500 leading-relaxed">
                                Finis l'isolement et les bilans de compétences poussiéreux. 
                                Tu vas suivre un parcours intensif pour identifier ta zone de génie.
                            </p>
                            <ul className="space-y-4 mt-6">
                                <li className="flex items-center gap-3 text-slate-900 font-bold">
                                    <div className="bg-blue-100 p-1 rounded-full"><CheckCircle2 className="text-blue-600 h-4 w-4" /></div>
                                    Identifier une vocation réelle
                                </li>
                                <li className="flex items-center gap-3 text-slate-900 font-bold">
                                    <div className="bg-blue-100 p-1 rounded-full"><CheckCircle2 className="text-blue-600 h-4 w-4" /></div>
                                    Positionnement clair & unique
                                </li>
                                <li className="flex items-center gap-3 text-slate-900 font-bold">
                                    <div className="bg-blue-100 p-1 rounded-full"><CheckCircle2 className="text-blue-600 h-4 w-4" /></div>
                                    Plan d'action prêt à lancer
                                </li>
                            </ul>
                            
                            {/* SECTION 2 — COMMENT VOUS TROUVEZ CONCRÈTEMENT VOTRE VOIE */}
                            <div className="mt-12 pt-12 border-t border-slate-100">
                                <h3 className="text-2xl font-black uppercase italic text-slate-900 mb-6">Comment vous trouvez <span className="text-blue-600">concrètement</span> votre voie</h3>
                                <p className="text-slate-500 mb-8 leading-relaxed">
                                    Vous ne trouvez pas votre voie en réfléchissant seul pendant des mois. 
                                    Vous la trouvez en explorant, en testant et en recevant des retours réels.
                                </p>
                                
                                <div className="space-y-6">
                                    {[
                                        { title: "1. Exploration guidée", desc: "Vous identifiez vos compétences, vos expériences et vos forces naturelles grâce à des exercices structurés." },
                                        { title: "2. Tests terrain rapides", desc: "Vous testez plusieurs pistes concrètement, sans pression ni engagement." },
                                        { title: "3. Retours du groupe", desc: "Le regard extérieur permet souvent de voir ce que vous ne voyez pas vous-même." },
                                        { title: "4. Validation", desc: "Vous repartez avec une direction claire, cohérente et activable." }
                                    ].map((step, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0 text-sm">{i+1}</div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm uppercase">{step.title}</h4>
                                                <p className="text-slate-500 text-sm mt-1">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">Formation 1</div>
                        <h3 className="text-xl font-black text-slate-900 uppercase mb-8 flex items-center gap-2">
                            <Map className="text-blue-600" /> Le Parcours
                        </h3>
                        <div className="space-y-8 relative">
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                            {[
                                { title: "Semaine 1 : Clarté", desc: "Exploration, introspection, carte des forces." },
                                { title: "Semaine 2 : Validation", desc: "Confrontation au marché, définition de la cible et validation de tes choix, on se lance." },
                                { title: "Semaine 3 : Le Bilan", desc: "Projet finalisé et validé. Tu sais enfin où tu vas." }
                            ].map((step, i) => (
                                <div key={i} className="relative flex gap-6">
                                    <div className="h-6 w-6 rounded-full bg-white border-4 border-blue-600 z-10 shrink-0 shadow-sm"></div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-lg uppercase mb-1">{step.title}</h4>
                                        <p className="text-slate-500 text-sm font-medium">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* PHASE 2 */}
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl relative overflow-hidden shadow-lg order-2 md:order-1">
                        <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">Formation 2</div>
                        <h3 className="text-xl font-black text-slate-900 uppercase mb-8 flex items-center gap-2">
                            <Rocket className="text-purple-600" /> Le Parcours
                        </h3>
                        <div className="space-y-8 relative">
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                            {[
                                { title: "Semaine 4 : L'Offre", desc: "Revoir, améliorer ou même créer une offre irrésistible qui répond à un besoin réel." },
                                { title: "Semaine 5 : La Vente", desc: "Trouver des clients, pitcher, poster, développer les réseaux (sociaux et humains) vendre sans forcer en utilisant la force du groupe." },
                                { title: "Le Sprint", desc: "15 jours d'action intensive avec l'Armada pour décoller." }
                            ].map((step, i) => (
                                <div key={i} className="relative flex gap-6">
                                    <div className="h-6 w-6 rounded-full bg-white border-4 border-purple-600 z-10 shrink-0 shadow-sm"></div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-lg uppercase mb-1">{step.title}</h4>
                                        <p className="text-slate-500 text-sm font-medium">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8 order-1 md:order-2">
                        <FadeIn>
                            <div className="inline-block bg-purple-100 text-purple-700 font-black border-2 border-purple-200 mb-6 uppercase tracking-widest px-6 py-3 rounded-full text-sm shadow-sm">
                                Partie 2 • L'Accélération
                            </div>
                            <h2 className="text-4xl font-black uppercase italic text-slate-900 leading-tight">
                                2 Semaines pour<br/>trouver <span className="text-purple-600">tes clients</span>
                            </h2>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <p className="text-lg text-slate-500 leading-relaxed">
                                Une seule obsession : terminer cette quinzaine avec plus de clients ou d'opportunités qu'au départ.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-white p-4 rounded-xl text-center border border-slate-100 shadow-sm">
                                    <div className="text-3xl font-black text-purple-600 mb-1">24</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold">Réseaux</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl text-center border border-slate-100 shadow-sm">
                                    <div className="text-3xl font-black text-blue-600 mb-1">∞</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold">Visibilité</div>
                                </div>
                            </div>
                            
                            <div className="mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                                <h4 className="font-black text-purple-700 uppercase text-sm mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Le Secret du Pod
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Vous n'êtes plus seul. Vous avancez avec <strong>23 autres entrepreneurs</strong> qui deviennent votre socle. Chaque jour, vous pitchez à une nouvelle personne.
                                </p>
                            </div>
                        </FadeIn>
                    </div>
                </div>

                {/* SECTION 3 — L'HISTOIRE DE THOMAS */}
                <div className="py-24 border-t border-slate-200">
                    <div className="text-center mb-16">
                        <Badge variant="outline" className="border-slate-300 text-slate-500 uppercase tracking-widest mb-4">Étude de cas réelle</Badge>
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic text-slate-900">
                            L'histoire de <span className="text-purple-600">Thomas</span>
                        </h2>
                        <p className="text-slate-500 mt-4 text-lg max-w-2xl mx-auto">
                            Comment il est passé de "6 mois de vide" à sa première facture en 5 semaines.
                        </p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative">
                        {/* Decorative bg */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                        
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* Left: The Struggle */}
                            <div className="p-8 md:p-16 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center font-black text-2xl text-slate-500">T</div>
                                    <div>
                                        <div className="font-black text-slate-900 text-xl">Thomas D.</div>
                                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">32 ans • En transition</div>
                                    </div>
                                </div>

                                <div className="space-y-8 relative">
                                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                                    
                                    <div className="relative flex gap-6">
                                        <div className="h-6 w-6 rounded-full bg-slate-300 border-4 border-white z-10 shrink-0 shadow-sm"></div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm uppercase mb-1">Avant le programme</h4>
                                            <p className="text-slate-600 italic">"Je tournais en rond depuis 6 mois. J'avais l'impression d'avoir tout essayé, mais je n'avais aucun résultat concret. Juste du vide."</p>
                                        </div>
                                    </div>

                                    <div className="relative flex gap-6">
                                        <div className="h-6 w-6 rounded-full bg-purple-200 border-4 border-white z-10 shrink-0 shadow-sm"></div>
                                        <div>
                                            <h4 className="font-bold text-purple-700 text-sm uppercase mb-1">Le Déclic (Semaine 2)</h4>
                                            <p className="text-slate-600">"Le groupe m'a forcé à tester une idée que je gardais pour moi : aider les artisans avec leur administratif. J'ai arrêté de réfléchir, j'ai appelé."</p>
                                        </div>
                                    </div>

                                    <div className="relative flex gap-6">
                                        <div className="h-6 w-6 rounded-full bg-purple-600 border-4 border-white z-10 shrink-0 shadow-sm"></div>
                                        <div>
                                            <h4 className="font-bold text-purple-700 text-sm uppercase mb-1">L'Accélération (Semaine 4)</h4>
                                            <p className="text-slate-600">"J'ai utilisé les scripts de vente du programme. J'ai eu 3 rendez-vous. J'ai signé mon premier client le jeudi."</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: The Result */}
                            <div className="p-8 md:p-16 relative flex flex-col justify-center">
                                <h3 className="text-2xl font-black uppercase italic text-slate-900 mb-8">
                                    Résultats après <span className="text-purple-600">5 semaines</span>
                                </h3>

                                <div className="grid grid-cols-2 gap-6 mb-10">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="text-4xl font-black text-purple-600 mb-1">1</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Offre Validée</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <div className="text-4xl font-black text-green-600 mb-1">1 200€</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Premier Contrat</div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-2">
                                        <div className="text-4xl font-black text-blue-600 mb-1">Confiance</div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retrouvée à 100%</div>
                                    </div>
                                </div>

                                <div className="bg-purple-600 text-white p-6 rounded-2xl relative shadow-lg transform rotate-1 hover:rotate-0 transition-transform">
                                    <div className="text-6xl absolute -top-6 -left-2 opacity-30 font-serif">"</div>
                                    <p className="font-medium italic relative z-10 text-lg leading-relaxed">
                                        Ce n'est pas juste une formation. C'est un coup de pied au cul bienveillant qui change tout. Je ne cherche plus d'emploi, je crée le mien.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

        {/* SECTION 4 — TIMELINE 5 SEMAINES */}
                <div className="py-20 border-t border-slate-200">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black uppercase italic text-slate-900">Votre parcours semaine par semaine</h2>
                    </div>

                    <div className="max-w-4xl mx-auto relative">
                        {/* Ligne verticale */}
                        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-purple-100 md:-translate-x-1/2"></div>

                        <div className="space-y-12">
                            {[
                                { week: "1", title: "Comprendre votre potentiel", desc: "Exploration des compétences, des envies et des possibilités.", icon: Brain },
                                { week: "2", title: "Tester et valider", desc: "Expérimentations concrètes et retours du groupe.", icon: Sparkles },
                                { week: "3", title: "Construire votre positionnement", desc: "Clarification de votre offre et de votre cible.", icon: Compass },
                                { week: "4", title: "Créer votre activité", desc: "Structuration de l’offre et préparation terrain.", icon: LayoutList },
                                { week: "5", title: "Trouver vos premiers clients", desc: "Activation du réseau collectif et opportunités.", icon: Rocket }
                            ].map((item, i) => (
                                <div key={i} className={`flex flex-col md:flex-row items-center gap-8 relative ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                    {/* Contenu */}
                                    <div className={`flex-1 w-full md:w-auto pl-12 md:pl-0 ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                                        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative hover:border-purple-200 transition-colors ${i % 2 === 0 ? 'mr-auto' : 'ml-auto'}`}>
                                            <span className="text-purple-600 font-bold text-xs uppercase tracking-widest mb-2 block">Semaine {item.week}</span>
                                            <h3 className="font-black text-slate-900 text-lg mb-2">{item.title}</h3>
                                            <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>

                                    {/* Point central */}
                                    <div className="absolute left-4 md:left-1/2 w-8 h-8 rounded-full bg-white border-4 border-purple-600 z-10 md:-translate-x-1/2 flex items-center justify-center shadow-sm">
                                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                    </div>

                                    {/* Espace vide pour l'équilibre */}
                                    <div className="flex-1 hidden md:block"></div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="text-center mt-16">
                            <p className="text-slate-900 font-bold text-lg bg-purple-50 inline-block px-6 py-3 rounded-full border border-purple-100">
                                Vous avancez chaque semaine avec un cadre clair et un groupe qui vous soutient.
                            </p>
                        </div>
                    </div>
                </div>

                        {/* SECTION 5 — QUI VOUS ACCOMPAGNE */}
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden mt-20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-12 items-center relative z-10">
                        <div className="relative">
                            <div className="aspect-square rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden relative">
                                <img 
                                    src="/jeanphilipperoth.jpg" 
                                    alt="Jean-Philippe Roth" 
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-white text-slate-900 p-4 rounded-xl shadow-lg border border-slate-100 max-w-[180px]">
                                <p className="text-xs font-bold leading-tight">"Personne ne devrait rester bloqué seul."</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <Badge className="bg-purple-600 text-white border-0 mb-4 uppercase tracking-widest px-3 py-1 text-xs">Le Fondateur</Badge>
                                <h3 className="text-3xl font-black uppercase italic mb-2">Qui vous accompagne ?</h3>
                                <p className="text-slate-400 font-medium text-lg">Jean-Philippe</p>
                            </div>
                            <div className="space-y-4 text-slate-300 leading-relaxed">
                                <p>
                                    Ce programme est né d’un constat simple : beaucoup de personnes veulent changer de vie professionnelle, 
                                    mais elles restent bloquées seules, sans cadre et sans réseau.
                                </p>
                                <p>
                                    Notre mission est de créer un environnement où les déclics arrivent plus vite, 
                                    où les opportunités circulent, et où chacun peut avancer concrètement.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 pt-2">
                                <Badge variant="outline" className="border-slate-700 text-slate-400">Mentor</Badge>
                                <Badge variant="outline" className="border-slate-700 text-slate-400">Entrepreneur</Badge>
                                <Badge variant="outline" className="border-slate-700 text-slate-400">Accélérateur</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 4. ZONE DE SÉCURITÉ (FAQ) */}
        <section className="py-24 bg-slate-50 border-y border-slate-200">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black uppercase italic text-slate-900 mb-4">Et si j'ai peur ?</h2>
                    <Badge variant="outline" className="border-slate-300 text-slate-500 uppercase tracking-widest">Zone de Sécurité</Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {[
                        { q: "Je n’ai jamais entrepris...", a: "Tant mieux. Tu n'as pas de mauvaises habitudes. On te donne la structure pas à pas." },
                        { q: "Je n’ai pas confiance en moi...", a: "La confiance vient après l'action. Le groupe te portera quand tu douteras." },
                        { q: "Je ne sais pas vendre...", a: "On ne te demande pas de vendre, mais de proposer des solutions. On te donne les scripts." },
                        { q: "Je n’ai pas de réseau...", a: "Tu repars avec un réseau de 23 entrepreneurs actifs dès le premier jour." }
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-purple-200 hover:shadow-md transition-all">
                            <h4 className="font-black text-slate-900 text-lg mb-3 flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-purple-500" /> {item.q}
                            </h4>
                            <p className="text-slate-600 leading-relaxed">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* 5. TÉMOIGNAGES */}
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black uppercase italic text-slate-900">Ils ont sauté le pas</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Témoignage 1 */}
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-lg">L</div>
                            <div>
                                <div className="font-bold text-slate-900">Lucie</div>
                                <div className="text-xs font-bold text-slate-400 uppercase">Ex-Assistante RH</div>
                            </div>
                        </div>
                        <p className="text-slate-600 italic mb-6">"Je pensais ne savoir rien faire d'autre. En 3 semaines, j'ai réalisé que je pouvais être Consultante en Organisation. J'ai mon premier client."</p>
                        <Badge className="bg-blue-100 text-blue-700 border-0 text-xs font-bold">Reconversion Réussie</Badge>
                    </div>

                    {/* Témoignage 2 */}
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-lg">T</div>
                            <div>
                                <div className="font-bold text-slate-900">Thomas</div>
                                <div className="text-xs font-bold text-slate-400 uppercase">Au chômage depuis 1 an</div>
                            </div>
                        </div>
                        <p className="text-slate-600 italic mb-6">"L'isolement me tuait. Retrouver un groupe de 24 personnes qui avancent, ça m'a redonné vie. J'ai lancé mon offre de coaching sportif."</p>
                        <Badge className="bg-purple-100 text-purple-700 border-0 text-xs font-bold">Fin de l'isolement</Badge>
                    </div>

                    {/* Témoignage 3 */}
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-lg">A</div>
                            <div>
                                <div className="font-bold text-slate-900">Amel</div>
                                <div className="text-xs font-bold text-slate-400 uppercase">En réflexion</div>
                            </div>
                        </div>
                        <p className="text-slate-600 italic mb-6">"Le format 3 semaines + 15 jours est parfait. On prend le temps de trouver, puis on accélère fort. Je ne me suis jamais sentie perdue."</p>
                        <Badge className="bg-purple-100 text-purple-700 border-0 text-xs font-bold">Structure & Clarté</Badge>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 6 — DETTE DE SERVICE */}
        <section className="py-24 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="border-slate-300 text-slate-500 uppercase tracking-widest mb-4">La Règle d'Or</Badge>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic text-slate-900">
                        Le Secret : Un Équipage pour l'année.<br/>
                        <span className="text-purple-600">L'entraide n'est pas une option.</span>
                    </h2>
                    <p className="text-slate-500 mt-4 text-lg">Et après la formation ? On ne vous laisse pas tomber.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm mb-4">Ailleurs...</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-600">
                                <span className="text-red-500 font-bold">✕</span> Les gens demandent mais ne donnent pas
                            </li>
                            <li className="flex items-start gap-3 text-slate-600">
                                <span className="text-red-500 font-bold">✕</span> Les relations restent superficielles
                            </li>
                            <li className="flex items-start gap-3 text-slate-600">
                                <span className="text-red-500 font-bold">✕</span> L’énergie retombe après 2 semaines
                            </li>
                        </ul>
                    </div>

                    <div className="bg-slate-900 text-white p-8 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl"></div>
                        <h3 className="font-bold text-purple-500 uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <Anchor className="h-4 w-4" /> Chez Popey
                        </h3>
                        
                        <div className="space-y-6 relative z-10">
                            <div>
                                <p className="font-black text-lg mb-1">La Dette de Service</p>
                                <p className="text-slate-400 text-sm">
                                    Chaque membre peut demander 1 service/mois.<br/>
                                    Chaque membre DOIT en rendre 1/mois.
                                </p>
                            </div>
                            
                            <div className="pt-6 border-t border-white/10">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Concrètement :</p>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="border-slate-700 text-slate-300">Recommandations</Badge>
                                    <Badge variant="outline" className="border-slate-700 text-slate-300">Aide Technique</Badge>
                                    <Badge variant="outline" className="border-slate-700 text-slate-300">Mise en relation</Badge>
                                    <Badge variant="outline" className="border-slate-700 text-slate-300">Soutien</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <p className="text-xl font-medium text-slate-900">
                        Ce n’est plus un simple réseau.<br/>
                        <span className="font-black text-purple-600">C’est une économie d’entraide organisée.</span>
                    </p>
                </div>
            </div>
        </section>

        {/* 6. CTA FINAL */}
        <section id="join" className="py-32 bg-slate-900 relative overflow-hidden text-white">
             <div className="container mx-auto px-4 max-w-xl text-center relative z-20">
                <FloatingIcon duration={4}>
                    <div className="bg-white/10 p-6 rounded-full inline-block mb-8 backdrop-blur-sm border border-white/20">
                        <Rocket className="h-16 w-16 text-purple-500" />
                    </div>
                </FloatingIcon>
                
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 leading-tight">
                    Trouve ton métier.<br/>Lance-toi.<br/>
                    <span className="text-purple-500">Obtiens tes premiers clients.</span>
                </h2>

                {/* SECTION 7 — FONCTIONNEMENT CANDIDATURE */}
                <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-sm mb-12">
                    <h3 className="text-xl font-bold uppercase tracking-widest mb-8 text-slate-300">Comment fonctionne la candidature</h3>
                    <div className="space-y-6 text-left">
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-black shrink-0">1</div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Vous remplissez le formulaire</h4>
                                <p className="text-slate-400 text-sm">Cela prend 2 minutes. Aucune pièce jointe requise.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center font-black shrink-0">2</div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Nous échangeons avec vous</h4>
                                <p className="text-slate-400 text-sm">Un court appel pour vérifier que le programme est adapté à votre situation.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="h-8 w-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center font-black shrink-0">3</div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Vous rejoignez la promotion</h4>
                                <p className="text-slate-400 text-sm">Si tout est validé, vous embarquez avec les 23 autres participants.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 8 — CE QUE VOUS POUVEZ ATTENDRE */}
                <div className="mb-12 text-center">
                    <h4 className="text-purple-400 font-bold uppercase tracking-widest text-sm mb-6">Ce que vous pouvez attendre du programme</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-left max-w-lg mx-auto">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
                            <span className="text-slate-300 font-medium">Une voie professionnelle clarifiée</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
                            <span className="text-slate-300 font-medium">Une activité structurée</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
                            <span className="text-slate-300 font-medium">Des retours terrain réels</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
                            <span className="text-slate-300 font-medium">Un réseau actif qui vous soutient</span>
                        </div>
                    </div>
                    <p className="mt-8 text-xl font-black italic text-white">
                        "Vous ne repartez pas avec des idées. <br/>
                        <span className="text-purple-500">Vous repartez avec une direction."</span>
                    </p>
                </div>

                <div className="text-center mb-12 space-y-4">
                    <div className="inline-block bg-white text-slate-900 px-6 py-2 font-black text-xl md:text-2xl -skew-x-12">
                        CHOISIS 1 FORMATION OU LES 2
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm max-w-md mx-auto">
                        <span className="flex items-center justify-center gap-2"><CheckCircle2 className="h-3 w-3 text-purple-500" /> Aucun diplôme requis</span>
                        <span className="flex items-center justify-center gap-2"><CheckCircle2 className="h-3 w-3 text-purple-500" /> Sans expérience</span>
                        <span className="flex items-center justify-center gap-2"><CheckCircle2 className="h-3 w-3 text-purple-500" /> Places limitées</span>
                        <span className="flex items-center justify-center gap-2"><CheckCircle2 className="h-3 w-3 text-purple-500" /> Accompagnement</span>
                    </div>
                </div>
                
                <div className="bg-white text-slate-900 p-1 rounded-3xl">
                    <div className="bg-slate-50 p-6 rounded-[1.3rem]">
                        <PreRegistrationForm programType="job_seeker" />
                    </div>
                </div>
                
                <p className="mt-8 text-slate-500 text-xs font-medium max-w-sm mx-auto">
                    En cliquant, vous acceptez de recevoir nos communications. Pas de spam, promis.<br/>
                    Les places sont attribuées après entretien.
                </p>
             </div>
        </section>

      </main>
      
      <footer className="bg-white py-12 border-t border-slate-100 text-slate-900">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Anchor className="h-6 w-6 text-purple-600" />
                        <span className="font-black uppercase tracking-widest">Popey Academy</span>
                    </div>
                    <p className="text-sm text-slate-500">
                        La première école qui transforme l'indécision en action.
                        <br/>Force & Honneur.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Programmes</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="/emploi" className="hover:text-purple-600">Trouver sa voie</Link></li>
                        <li><Link href="/entrepreneurs" className="hover:text-purple-600">Lancer son activité</Link></li>
                        <li><Link href="/admin/catalogue-chomeur" className="hover:text-purple-600">Catalogue PDF</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Légal</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="/legal/mentions" className="hover:text-purple-600">Mentions Légales</Link></li>
                        <li><Link href="/legal/terms" className="hover:text-purple-600">CGV / CGU</Link></li>
                        <li><Link href="/legal/privacy" className="hover:text-purple-600">Politique de Confidentialité</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Contact</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li>hello@popey.academy</li>
                        <li>Paris, France</li>
                        <li className="flex gap-4 mt-4">
                            {/* Social Icons Placeholder */}
                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer">
                                <span className="font-black text-xs">IN</span>
                            </div>
                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-purple-100 hover:text-purple-600 transition-colors cursor-pointer">
                                <span className="font-black text-xs">IG</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-xs">© 2026 Popey Academy. Tous droits réservés.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
