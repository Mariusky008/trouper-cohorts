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
    <div ref={targetRef} className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      
      {/* Header - Fixed Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-blue-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 text-blue-600">
                <Anchor className="h-full w-full" strokeWidth={2.5} />
             </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic text-slate-900">Popey <span className="text-blue-600">Emploi</span></span>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-sm font-bold text-blue-500 uppercase tracking-widest animate-pulse">● Candidatures Ouvertes</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-slate-500 hover:text-blue-600 font-bold uppercase tracking-wider" asChild>
                <Link href="/login">Connexion</Link>
            </Button>
            <Link 
                href="#join" 
                className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider -skew-x-12 h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm transition-colors relative z-50 shadow-lg shadow-blue-200"
            >
                <span className="skew-x-12">Postuler</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO : LE BROUILLARD VERS LA CLARTÉ */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-40 pb-32 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-white z-0" />
          
          <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
            <div className="space-y-6">
                <FloatingIcon>
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-4 py-1 text-sm uppercase tracking-widest font-black mb-4">
                        🧭 Programme Pilote • 15 Jours
                    </Badge>
                </FloatingIcon>
                
                <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] text-slate-900">
                  Perdu dans le brouillard ?<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Passez à l'action.
                  </span>
                </h1>
                
                <div className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed space-y-6">
                    <p>
                        Vous ne savez plus par où commencer ? Vous tournez en rond ?
                    </p>
                    <p className="text-slate-900 font-bold border-l-4 border-blue-500 pl-4 md:pl-0 md:border-0">
                        15 jours pour structurer votre projet, retrouver confiance et définir un cap clair.
                        <br/>Sans théorie inutile. Juste du concret.
                    </p>
                </div>

                <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-6">
                    <Button size="lg" className="h-16 px-6 md:px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-base md:text-xl uppercase tracking-widest rounded-none -skew-x-12 shadow-xl shadow-blue-200 transition-all max-w-full" asChild>
                        <Link href="#join">
                            <span className="skew-x-12 flex items-center gap-2 md:gap-3 text-center whitespace-normal leading-tight">
                                <span>Je rejoins l'Expédition</span>
                                <Compass className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
                            </span>
                        </Link>
                    </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
                    {[
                        { icon: Brain, label: "Clarté Mentale", sub: "Sortir du flou" },
                        { icon: Users, label: "Binôme Quotidien", sub: "Ne plus être seul" },
                        { icon: Zap, label: "Action Immédiate", sub: "Stop procrastination" },
                        { icon: Target, label: "Projet Concret", sub: "Offre & Cible" }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                            <item.icon className="h-6 w-6 text-blue-500" />
                            <span className="font-bold text-slate-900 text-sm uppercase">{item.label}</span>
                            <span className="text-xs text-slate-400">{item.sub}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="absolute bottom-0 w-full text-slate-50 z-20 pointer-events-none">
             <Wave />
          </div>
        </section>

        {/* 2. LA MÉTHODE : LES 6 ACTES */}
        <section className="py-24 bg-slate-50 relative z-20">
            <div className="container mx-auto px-4 max-w-5xl space-y-16">
                <div className="text-center space-y-4">
                    <FadeIn>
                        <h2 className="text-4xl font-black uppercase italic text-slate-900">Une Méthode Unique</h2>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            Chaque jour est construit comme un rituel en 6 actes pour débloquer l'action.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { id: 1, title: "La Tension", desc: "On rend l'inaction inconfortable. On pose la question qui fâche.", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
                        { id: 2, title: "L'Exploration", desc: "On creuse profondément. Pourquoi ce blocage ? Quel est le vrai besoin ?", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
                        { id: 3, title: "L'Outil", desc: "On introduit un outil moderne (IA, Notion, Canva) pour structurer le chaos.", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                        { id: 4, title: "Le Binôme", desc: "On valide avec un pair. On ne reste pas seul avec ses doutes.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                        { id: 5, title: "L'Action", desc: "On fait une chose concrète. Un message, un post, un appel. Tout de suite.", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
                        { id: 6, title: "L'Ancrage", desc: "On célèbre la victoire. On grave le progrès dans le marbre.", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
                    ].map((act, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className={`p-6 rounded-xl border ${act.border} ${act.bg} h-full hover:shadow-lg transition-shadow`}>
                                <div className={`font-black text-4xl mb-2 opacity-20 ${act.color}`}>{act.id}</div>
                                <h3 className={`font-bold text-xl mb-3 uppercase ${act.color}`}>{act.title}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{act.desc}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>
            </div>
        </section>

        {/* 3. LE PROGRAMME 15 JOURS */}
        <section className="py-32 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="text-center mb-20 space-y-4">
                    <FadeIn>
                        <Badge variant="outline" className="border-blue-500 text-blue-600 uppercase tracking-widest px-4 py-2">Parcours Intensif</Badge>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic text-slate-900">
                            3 Phases de Transformation
                        </h2>
                    </FadeIn>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* PHASE 1 */}
                    <FadeIn delay={0}>
                        <div className="group border border-slate-200 p-8 rounded-2xl hover:border-blue-400 transition-colors bg-slate-50">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Jours 1 à 4</div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase mb-4 group-hover:text-blue-600 transition-colors">Le Brouillard</h3>
                            <ul className="space-y-3 text-slate-600 text-sm">
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Sortir du "Je ne sais pas"</li>
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Identifier ses vraies forces</li>
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Tester une première idée</li>
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> <strong>Outils :</strong> IA, Notion, Google Trends</li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* PHASE 2 */}
                    <FadeIn delay={0.2}>
                        <div className="group border border-slate-200 p-8 rounded-2xl hover:border-blue-400 transition-colors bg-white shadow-xl shadow-blue-100/50 relative -translate-y-4">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest">Crucial</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Jours 5 à 9</div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase mb-4 group-hover:text-blue-600 transition-colors">L'Offre Visible</h3>
                            <ul className="space-y-3 text-slate-600 text-sm">
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Définir sa cible réelle</li>
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Créer un visuel pro</li>
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Lancer sa communauté</li>
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> <strong>Outils :</strong> Canva, Discord, Facebook</li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* PHASE 3 */}
                    <FadeIn delay={0.4}>
                        <div className="group border border-slate-200 p-8 rounded-2xl hover:border-blue-400 transition-colors bg-slate-50">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Jours 10 à 15</div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase mb-4 group-hover:text-blue-600 transition-colors">La Réalité</h3>
                            <ul className="space-y-3 text-slate-600 text-sm">
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Fixer ses prix & objectifs</li>
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> Automatiser ses contacts</li>
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> S'engager officiellement</li>
                                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /> <strong>Outils :</strong> Excel, Tally, Formalités</li>
                            </ul>
                        </div>
                    </FadeIn>
                </div>

                <div className="pt-16 text-center">
                    <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white uppercase font-bold tracking-widest h-12 px-8" asChild>
                        <Link href="/admin/catalogue-chomeur" target="_blank">Voir le programme détaillé PDF</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* 4. CTA : CANDIDATURE */}
        <section id="join" className="py-32 bg-slate-900 relative overflow-hidden">
             <div className="absolute top-0 w-full text-white rotate-180 z-10 pointer-events-none">
                <Wave />
             </div>
             
             <div className="container mx-auto px-4 max-w-xl text-center relative z-20 pt-20">
                <FloatingIcon duration={4}>
                    <Map className="h-20 w-20 text-blue-400 mx-auto mb-8" />
                </FloatingIcon>
                
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 text-white">
                    Prêt à sortir<br/>du brouillard ?
                </h2>

                <div className="text-center mb-8">
                    <span className="text-6xl font-black text-blue-400">Gratuit</span>
                    <p className="text-slate-400 mt-2 uppercase tracking-widest text-xs">Financé par le dispositif Pilote (Places Limitées)</p>
                </div>
                
                <div className="bg-white text-slate-900 p-8 -skew-x-3 border-4 border-blue-500 shadow-[10px_10px_0px_0px_rgba(59,130,246,1)]">
                    <div className="skew-x-3">
                         <div className="text-left mb-6">
                            <h3 className="font-black text-xl uppercase mb-1">Candidature Pilote</h3>
                            <p className="text-sm text-slate-500">Sélection sur motivation uniquement.</p>
                         </div>
                        <div className="light">
                             <PreRegistrationForm />
                        </div>
                    </div>
                </div>
             </div>
        </section>
      </main>
        
        <footer className="bg-slate-950 py-12 text-center border-t border-slate-800 text-white">
            <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
                <Anchor className="h-6 w-6" />
                <span className="font-black uppercase">Popey Emploi</span>
            </div>
            <p className="text-slate-600 text-sm">© 2026. Action &gt; Réflexion.</p>
        </footer>
    </div>
  );
}
