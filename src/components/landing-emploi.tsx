"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Anchor, Brain, CheckCircle2, Compass, LayoutList, LifeBuoy, Map, ShieldCheck, Ship, Sparkles, Target, Users, Zap } from "lucide-react";
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
    <div ref={targetRef} className="min-h-screen bg-amber-50/50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      
      {/* Header - Fixed Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-orange-100 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 text-orange-600">
                <Anchor className="h-full w-full" strokeWidth={2.5} />
             </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic text-slate-900">Popey <span className="text-orange-600">Emploi</span></span>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-sm font-bold text-orange-600 uppercase tracking-widest animate-pulse flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-600"></span>
                Candidatures Ouvertes
             </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-500 hover:text-orange-600 font-bold uppercase tracking-wider hidden sm:flex" asChild>
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
        {/* 1. HERO : LE BROUILLARD VERS LA CLARTÉ */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-40 pb-32">
          {/* Background Warmth */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 via-white to-amber-50/30 z-0" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-200/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
            <div className="space-y-8">
                <FloatingIcon>
                    <Badge className="bg-white text-orange-600 border border-orange-100 px-4 py-1.5 text-sm uppercase tracking-widest font-black mb-4 shadow-sm">
                        🧭 Programme Pilote • 15 Jours
                    </Badge>
                </FloatingIcon>
                
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-slate-900">
                  15 Jours pour<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 italic pr-2">
                    transformer votre vécu
                  </span><br/>
                  en 1ère Offre.
                </h1>
                
                <div className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed space-y-6">
                    <p>
                        Arrêtez de chercher un emploi. <span className="text-slate-900 font-bold underline decoration-orange-300 decoration-4 underline-offset-4">Créez votre activité.</span><br/>
                        <span className="text-sm text-slate-500 uppercase tracking-widest font-bold mt-2 block">Sans diplôme • Sans capital • 100% Action</span>
                    </p>
                    
                    {/* Barre d'Objectifs J15 */}
                    <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-8 text-sm md:text-base font-bold text-slate-700 mt-8 bg-white p-6 rounded-2xl shadow-xl shadow-orange-100/50 border border-orange-50 inline-flex mx-auto w-full md:w-auto max-w-2xl">
                        <span className="flex items-center gap-2 justify-center"><div className="bg-green-100 p-1 rounded-full"><CheckCircle2 className="text-green-600 h-4 w-4" /></div> 1 Offre Validée</span>
                        <span className="hidden md:block text-slate-200">|</span>
                        <span className="flex items-center gap-2 justify-center"><div className="bg-green-100 p-1 rounded-full"><CheckCircle2 className="text-green-600 h-4 w-4" /></div> 1 Page Pro Active</span>
                        <span className="hidden md:block text-slate-200">|</span>
                        <span className="flex items-center gap-2 justify-center"><div className="bg-green-100 p-1 rounded-full"><CheckCircle2 className="text-green-600 h-4 w-4" /></div> 1er Contact Client</span>
                    </div>
                </div>

                <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6">
                    <Button size="lg" className="h-16 px-10 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg uppercase tracking-widest rounded-full shadow-xl shadow-orange-200 hover:shadow-2xl hover:-translate-y-1 transition-all w-full md:w-auto" asChild>
                        <Link href="#join">
                            <span className="flex items-center gap-3 text-center">
                                <span>Je rejoins l'Expédition</span>
                                <Compass className="h-6 w-6" />
                            </span>
                        </Link>
                    </Button>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gratuit & Financé</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-16 max-w-5xl mx-auto">
                    {[
                        { icon: Brain, label: "Clarté Mentale", sub: "Sortir du flou" },
                        { icon: Users, label: "Binôme Quotidien", sub: "Ne plus être seul" },
                        { icon: Zap, label: "Action Immédiate", sub: "Stop procrastination" },
                        { icon: Target, label: "Projet Concret", sub: "Offre & Cible" }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg shadow-orange-100/20 hover:shadow-xl hover:-translate-y-1 transition-all">
                            <div className="bg-orange-50 p-3 rounded-full text-orange-600">
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div className="text-center">
                                <span className="block font-black text-slate-900 text-sm uppercase mb-1">{item.label}</span>
                                <span className="block text-xs text-slate-500 font-medium">{item.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="absolute bottom-0 w-full text-white z-20 pointer-events-none">
             <Wave />
          </div>
        </section>

        {/* 2. LA MÉTHODE POPEY */}
        <section className="py-32 bg-white relative z-20">
            <div className="container mx-auto px-4 max-w-5xl space-y-24">
                
                {/* 3 Piliers */}
                <div className="space-y-16">
                     <div className="text-center">
                        <FadeIn>
                            <span className="text-orange-600 font-black uppercase tracking-widest text-sm mb-2 block">Notre Philosophie</span>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">La Méthode Popey™</h2>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                                Pourquoi ça marche là où le reste échoue.
                            </p>
                        </FadeIn>
                     </div>

                     <div className="grid md:grid-cols-3 gap-8">
                        {/* Pilier 1 */}
                        <FadeIn delay={0}>
                            <div className="bg-amber-50 p-8 rounded-3xl text-center h-full border border-amber-100 hover:shadow-lg transition-shadow">
                                <div className="h-16 w-16 bg-white text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 font-black text-2xl shadow-sm rotate-3">1</div>
                                <h3 className="font-black text-xl text-slate-900 mb-3 uppercase">L'Identité d'abord</h3>
                                <p className="text-slate-600 leading-relaxed text-sm">On ne construit pas sur du sable. On part de qui vous êtes vraiment pour créer une offre qui vous ressemble.</p>
                            </div>
                        </FadeIn>
                        
                        {/* Pilier 2 */}
                        <FadeIn delay={0.1}>
                            <div className="bg-slate-900 p-8 rounded-3xl text-center h-full shadow-2xl shadow-slate-200 transform md:-translate-y-6 relative">
                                 <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-2xl uppercase tracking-widest">Moteur</div>
                                <div className="h-16 w-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 font-black text-2xl shadow-lg -rotate-3">2</div>
                                <h3 className="font-black text-xl text-white mb-3 uppercase">L'Action Immédiate</h3>
                                <p className="text-slate-300 leading-relaxed text-sm">On apprend en faisant, pas en regardant des vidéos. Zéro théorie inutile, 100% pratique.</p>
                            </div>
                        </FadeIn>
                        
                        {/* Pilier 3 */}
                        <FadeIn delay={0.2}>
                            <div className="bg-amber-50 p-8 rounded-3xl text-center h-full border border-amber-100 hover:shadow-lg transition-shadow">
                                <div className="h-16 w-16 bg-white text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 font-black text-2xl shadow-sm rotate-3">3</div>
                                <h3 className="font-black text-xl text-slate-900 mb-3 uppercase">Le Collectif</h3>
                                <p className="text-slate-600 leading-relaxed text-sm">On ne réussit pas seul devant son écran. La force du groupe vous porte et vous challenge.</p>
                            </div>
                        </FadeIn>
                     </div>
                </div>

                {/* 6 Actes */}
                <div className="space-y-12">
                    <div className="text-center space-y-4">
                        <FadeIn>
                            <h3 className="text-3xl font-black text-slate-900">Le Rituel Quotidien</h3>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                Chaque jour est construit en 6 actes pour débloquer l'action.
                            </p>
                        </FadeIn>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                        { id: 1, title: "La Tension", desc: "On rend l'inaction inconfortable.", icon: "🔥" },
                        { id: 2, title: "L'Exploration", desc: "On creuse le vrai besoin.", icon: "🧐" },
                        { id: 3, title: "L'Outil", desc: "IA, Notion, Canva pour structurer.", icon: "🛠️" },
                        { id: 4, title: "Le Binôme", desc: "On valide avec un pair.", icon: "🤝" },
                        { id: 5, title: "L'Action", desc: "Un message, un appel. Tout de suite.", icon: "⚡" },
                        { id: 6, title: "L'Ancrage", desc: "On célèbre la victoire.", icon: "⚓" },
                    ].map((act, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-50 transition-all group h-full">
                                <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">{act.icon}</div>
                                <h3 className="font-bold text-lg mb-2 text-slate-900 group-hover:text-orange-600 transition-colors">{act.title}</h3>
                                <p className="text-slate-500 text-xs leading-relaxed">{act.desc}</p>
                            </div>
                        </FadeIn>
                    ))}
                    </div>
                </div>
            </div>
        </section>

        {/* 3. LE PROGRAMME 15 JOURS */}
        <section className="py-32 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="text-center mb-20 space-y-4">
                    <FadeIn>
                        <Badge className="bg-orange-100 text-orange-700 border-0 uppercase tracking-widest px-4 py-2 hover:bg-orange-200">Parcours Intensif</Badge>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                            3 Phases de Transformation
                        </h2>
                    </FadeIn>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 items-start">
                    {/* PHASE 1 */}
                    <FadeIn delay={0}>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-orange-200 transition-colors">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 bg-slate-50 inline-block px-3 py-1 rounded-full">Jours 1 à 4</div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase mb-6">Le Brouillard</h3>
                            <ul className="space-y-4 text-slate-600 text-sm font-medium">
                                <li className="flex gap-3"><div className="bg-slate-100 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-slate-500" /></div> Sortir du "Je ne sais pas"</li>
                                <li className="flex gap-3"><div className="bg-slate-100 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-slate-500" /></div> Identifier ses vraies forces</li>
                                <li className="flex gap-3"><div className="bg-slate-100 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-slate-500" /></div> Tester une première idée</li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* PHASE 2 */}
                    <FadeIn delay={0.2}>
                        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl shadow-orange-200/50 text-white transform lg:-translate-y-8 relative border border-slate-800">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Crucial</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 bg-slate-800 inline-block px-3 py-1 rounded-full">Jours 5 à 9</div>
                            <h3 className="text-2xl font-black text-white uppercase mb-6">L'Offre Visible</h3>
                            <ul className="space-y-4 text-slate-300 text-sm font-medium">
                                <li className="flex gap-3"><div className="bg-slate-800 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-orange-500" /></div> Définir sa cible réelle</li>
                                <li className="flex gap-3"><div className="bg-slate-800 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-orange-500" /></div> Créer un visuel pro</li>
                                <li className="flex gap-3"><div className="bg-slate-800 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-orange-500" /></div> Lancer sa communauté</li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* PHASE 3 */}
                    <FadeIn delay={0.4}>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-orange-200 transition-colors">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 bg-slate-50 inline-block px-3 py-1 rounded-full">Jours 10 à 15</div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase mb-6">La Réalité</h3>
                            <ul className="space-y-4 text-slate-600 text-sm font-medium">
                                <li className="flex gap-3"><div className="bg-slate-100 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-slate-500" /></div> Fixer ses prix & objectifs</li>
                                <li className="flex gap-3"><div className="bg-slate-100 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-slate-500" /></div> Automatiser ses contacts</li>
                                <li className="flex gap-3"><div className="bg-slate-100 p-1 rounded-full"><CheckCircle2 className="h-3 w-3 text-slate-500" /></div> S'engager officiellement</li>
                            </ul>
                        </div>
                    </FadeIn>
                </div>

                <div className="pt-20 text-center">
                    <Button variant="ghost" className="text-slate-400 hover:text-orange-600 hover:bg-orange-50 uppercase font-bold tracking-widest h-12 px-8 rounded-full" asChild>
                        <Link href="/admin/catalogue-chomeur" target="_blank">Voir le programme détaillé PDF</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* 3b. NIVEAUX D'INTENSITÉ */}
        <section className="py-24 bg-white relative z-20">
            <div className="container mx-auto px-4 max-w-5xl space-y-16">
                <div className="text-center space-y-4">
                     <FadeIn>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                            Votre Rythme, Votre Choix
                        </h2>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            Adaptez l'intensité du programme à votre énergie actuelle.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Level 1 */}
                    <FadeIn delay={0}>
                         <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-slate-300 transition-all h-full flex flex-col">
                            <h3 className="text-lg font-black uppercase text-slate-400 mb-2">Minimum Vital</h3>
                            <div className="text-4xl font-black text-slate-900 mb-4">1h <span className="text-sm font-medium text-slate-400">/ jour</span></div>
                            <p className="text-sm text-slate-500 mb-8 flex-1">Pour ceux qui sont épuisés mais veulent garder un pied dans l'action.</p>
                            <div className="pt-6 border-t border-slate-200 w-full">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">L'Essentiel</span>
                            </div>
                         </div>
                    </FadeIn>

                    {/* Level 2 */}
                    <FadeIn delay={0.1}>
                         <div className="bg-white p-8 rounded-3xl border-2 border-orange-500 shadow-2xl shadow-orange-100 relative h-full flex flex-col transform md:-translate-y-4">
                            <div className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Recommandé</div>
                            <h3 className="text-lg font-black uppercase text-orange-600 mb-2">Standard</h3>
                            <div className="text-4xl font-black text-slate-900 mb-4">4h <span className="text-sm font-medium text-slate-400">/ jour</span></div>
                            <p className="text-sm text-slate-600 mb-8 flex-1">L'équilibre parfait pour avancer concrètement sans s'épuiser.</p>
                            <div className="pt-6 border-t border-slate-100 w-full">
                                <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Le Programme Complet</span>
                            </div>
                         </div>
                    </FadeIn>

                    {/* Level 3 */}
                    <FadeIn delay={0.2}>
                         <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 h-full flex flex-col text-white">
                            <h3 className="text-lg font-black uppercase text-slate-400 mb-2">Intensif</h3>
                            <div className="text-4xl font-black text-white mb-4">Full <span className="text-sm font-medium text-slate-500">Time</span></div>
                            <p className="text-sm text-slate-400 mb-8 flex-1">Immersion totale pour une transformation radicale et rapide.</p>
                            <div className="pt-6 border-t border-slate-800 w-full">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Deep Work</span>
                            </div>
                         </div>
                    </FadeIn>
                </div>
            </div>
        </section>

        {/* 3d. RÉASSURANCE */}
        <section className="py-24 bg-orange-50/50 border-y border-orange-100/50">
             <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <FadeIn>
                        <h2 className="text-3xl font-black text-slate-900 mb-8">
                            Zone de Sécurité Émotionnelle
                        </h2>
                        <div className="space-y-8">
                             <div className="flex gap-5">
                                <div className="bg-white p-3 rounded-full shadow-sm text-orange-500 h-fit"><LifeBuoy className="h-6 w-6" /></div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Pas de caméra obligatoire</h4>
                                    <p className="text-sm text-slate-600 mt-1">Vous ne voulez pas vous montrer ? Participez en audio ou par chat. C'est OK.</p>
                                </div>
                             </div>
                             <div className="flex gap-5">
                                <div className="bg-white p-3 rounded-full shadow-sm text-orange-500 h-fit"><ShieldCheck className="h-6 w-6" /></div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Bienveillance Radicale</h4>
                                    <p className="text-sm text-slate-600 mt-1">Ici, pas de jugement. Tout le monde est dans le même bateau. On s'entraide.</p>
                                </div>
                             </div>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-orange-100/50 border border-white rotate-2">
                            <div className="text-4xl text-orange-200 mb-4 font-serif">"</div>
                            <p className="text-lg font-medium text-slate-700 mb-6 relative z-10">J'avais peur d'être jugé sur ma situation. J'ai trouvé des gens qui me comprenaient mieux que ma propre famille.</p>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400">M</div>
                                <div>
                                    <div className="font-bold text-slate-900">Marc D.</div>
                                    <div className="text-xs font-bold text-orange-500 uppercase tracking-wide">Participant Cohorte Bêta</div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
             </div>
        </section>

        {/* 3e. LE COACH IA */}
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 z-0" />
             
             <div className="container mx-auto px-4 max-w-5xl relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <FadeIn>
                            <Badge className="bg-blue-600 hover:bg-blue-500 text-white border-0 mb-6 uppercase tracking-widest px-3 py-1">Technologie</Badge>
                            <h2 className="text-4xl font-black mb-6 leading-tight">
                                L'IA Comme <br/><span className="text-blue-400">Boussole Intelligente</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed">
                                Les chercheurs d'emploi sont souvent dans le brouillard. <br/>
                                Notre Coach IA agit comme un <strong>Psychologue Stratège</strong> disponible 24/7.
                            </p>
                        </FadeIn>
                        
                        <div className="space-y-6 pt-4">
                            <FadeIn delay={0.1}>
                                <div className="flex gap-5 items-start">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                                        <Sparkles className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">Elle connecte les points</h4>
                                        <p className="text-sm text-slate-500 mt-1">"Tu aimes l'écriture (J1) et tu es rigoureux (J3) ? As-tu pensé au Copywriting Technique ?"</p>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                    
                    <FadeIn delay={0.3}>
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                            <div className="space-y-6 font-mono text-sm">
                                <div className="bg-slate-950 p-4 rounded-2xl rounded-tl-none border border-slate-800 text-slate-400 max-w-[90%]">
                                    J'ai peur de me lancer car je n'ai pas de diplôme.
                                </div>
                                <div className="bg-blue-900/20 p-4 rounded-2xl rounded-tr-none border border-blue-500/20 text-blue-100 ml-auto max-w-[90%]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse"></div>
                                        <span className="text-blue-400 font-bold text-xs uppercase tracking-widest">Coach Popey</span>
                                    </div>
                                    On s'en fiche du diplôme. Regarde tes exercices du Jours 2 : tu as géré une asso pendant 3 ans. C'est ça ta preuve de compétence. Transformons ça en offre.
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
             </div>
        </section>

        {/* 4. CTA : CANDIDATURE */}
        <section id="join" className="py-32 bg-white relative overflow-hidden">
             <div className="container mx-auto px-4 max-w-xl text-center relative z-20 pt-10">
                <FloatingIcon duration={4}>
                    <div className="bg-orange-50 p-6 rounded-full inline-block mb-8">
                        <Map className="h-16 w-16 text-orange-500" />
                    </div>
                </FloatingIcon>
                
                <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-8 text-slate-900 leading-none">
                    Prêt à sortir<br/>du brouillard ?
                </h2>

                <div className="text-center mb-12">
                    <span className="text-6xl font-black text-orange-500 tracking-tighter block mb-2">Gratuit</span>
                    <p className="text-slate-400 uppercase tracking-widest text-xs font-bold">Financé par le dispositif Pilote (Places Limitées)</p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-green-600 text-sm font-bold uppercase tracking-wide bg-green-50 py-2 px-4 rounded-full inline-flex">
                        <ShieldCheck className="h-4 w-4" />
                        <span>100% Compatible France Travail</span>
                    </div>
                </div>
                
                <div className="bg-white text-slate-900 p-8 md:p-10 rounded-3xl border-2 border-slate-100 shadow-2xl shadow-slate-200 text-left relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
                     <div className="mb-8">
                        <h3 className="font-black text-2xl uppercase mb-2">Candidature Pilote</h3>
                        <p className="text-slate-500">Remplissez ce formulaire pour vérifier votre éligibilité. Réponse sous 24h.</p>
                     </div>
                    <div className="light">
                         <PreRegistrationForm programType="job_seeker" />
                    </div>
                </div>
             </div>
        </section>
      </main>
        
        <footer className="bg-white py-12 text-center border-t border-slate-100 text-slate-900">
            <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
                <Anchor className="h-6 w-6" />
                <span className="font-black uppercase tracking-widest">Popey Emploi</span>
            </div>
            <p className="text-slate-400 text-sm">© 2026. Action &gt; Réflexion.</p>
        </footer>
    </div>
  );
}
