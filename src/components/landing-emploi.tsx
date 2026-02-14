"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Anchor, Brain, CheckCircle2, Compass, HelpCircle, LayoutList, LifeBuoy, Map, Rocket, ShieldCheck, Ship, Sparkles, Target, Users, Zap } from "lucide-react";
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
    <div ref={targetRef} className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      
      {/* Header - Fixed Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-white/50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 text-orange-600">
                <Anchor className="h-full w-full" strokeWidth={2.5} />
             </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic text-slate-900">Popey <span className="text-orange-600">Academy</span></span>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-sm font-bold text-orange-600 uppercase tracking-widest animate-pulse flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-600"></span>
                Inscriptions Ouvertes
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
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.95] text-slate-900">
                  Et si dans 5 semaines<br />
                  tu passais de<br />
                  <span className="text-slate-400">“je ne sais pas quoi faire”</span><br/>
                  à <span className="text-orange-600">“j’ai trouvé ma vocation…<br/>et mes premiers clients” ?</span>
                </h1>
                
                <div className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto font-medium leading-relaxed space-y-6">
                    <div className="grid md:grid-cols-2 gap-8 text-left bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mt-8">
                        <div>
                            <span className="block text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Formation 1</span>
                            <p className="text-slate-900 font-bold">3 semaines pour révéler le métier qui te correspond vraiment.</p>
                        </div>
                        <div>
                            <span className="block text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Formation 2</span>
                            <p className="text-slate-900 font-bold">2 semaines pour le transformer en activité avec tes premiers clients.</p>
                        </div>
                    </div>

                    <p className="text-center font-black text-slate-900 text-2xl pt-4">
                        Dans 5 semaines, tu ne cherches plus ta voie.<br/>
                        <span className="text-orange-600 underline decoration-4 underline-offset-4">Tu es dans le mouvement.</span>
                    </p>
                </div>

                <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-6">
                    <Button size="lg" className="h-16 px-10 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg uppercase tracking-widest rounded-full shadow-xl shadow-orange-200 hover:shadow-2xl hover:-translate-y-1 transition-all w-full md:w-auto" asChild>
                        <Link href="#join">
                            <span className="flex items-center gap-3 text-center">
                                <span>Je deviens Entrepreneur</span>
                                <Rocket className="h-6 w-6" />
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

        {/* 2. VISION IDENTITAIRE */}
        <section className="py-24 bg-slate-900 text-white relative z-20">
            <div className="container mx-auto px-4 max-w-4xl text-center space-y-12">
                <FadeIn>
                    <h2 className="text-4xl font-black uppercase italic mb-8">Vision Identitaire</h2>
                    <p className="text-2xl text-slate-300 leading-relaxed">
                        Tu ne te présentes plus comme <span className="line-through text-slate-600">“en reconversion”</span>.<br/>
                        <span className="text-white font-black bg-orange-600 px-2">Tu te présentes comme entrepreneur.</span>
                    </p>
                </FadeIn>
                
                <div className="grid md:grid-cols-3 gap-6 pt-8">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-4" />
                        <h3 className="font-bold text-lg uppercase">Avec une offre.</h3>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <Compass className="h-8 w-8 text-blue-500 mx-auto mb-4" />
                        <h3 className="font-bold text-lg uppercase">Avec une direction.</h3>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <Users className="h-8 w-8 text-orange-500 mx-auto mb-4" />
                        <h3 className="font-bold text-lg uppercase">Avec des clients.</h3>
                    </div>
                </div>

                <FadeIn delay={0.2}>
                    <div className="mt-16 p-8 bg-slate-800/50 rounded-3xl border border-slate-700">
                        <h3 className="text-3xl font-black uppercase italic text-white mb-4">On ne t’aide pas à réfléchir.<br/><span className="text-orange-500">On t’aide à devenir.</span></h3>
                        <div className="flex justify-center items-center gap-8 mt-8 text-sm font-bold uppercase tracking-widest text-slate-400">
                            <span>24 Personnes</span>
                            <span>•</span>
                            <span>24 Dynamiques</span>
                            <span>•</span>
                            <span>24 Réseaux Activés</span>
                        </div>
                    </div>
                </FadeIn>
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
                                { title: "Semaine 3 : Lancement", desc: "Plan d'action, outils, préparation au sprint." }
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

                {/* LA MÉCANIQUE HUMAINE */}
                <div className="py-12 md:py-24">
                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
                        {/* Background Elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                        
                        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black uppercase italic mb-6 leading-tight">
                                    La Mécanique Humaine<br/><span className="text-orange-500">de Popey.Academy</span>
                                </h2>
                                <p className="text-xl md:text-2xl text-blue-200 font-medium max-w-2xl mx-auto">
                                    Pendant 5 semaines, tu ne restes jamais seul.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="text-4xl font-black text-white mb-2">30</div>
                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Jours d'action</div>
                                </div>
                                <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md transform scale-105 shadow-xl">
                                    <div className="text-4xl font-black text-orange-500 mb-2">30</div>
                                    <div className="text-sm font-bold text-white uppercase tracking-widest">Binômes différents</div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="text-4xl font-black text-white mb-2">30</div>
                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Regards nouveaux</div>
                                </div>
                            </div>

                            <div className="space-y-8 text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                                <div className="space-y-2">
                                    <p><span className="text-white font-bold">Chaque jour,</span> quelqu’un te challenge.</p>
                                    <p><span className="text-white font-bold">Chaque jour,</span> quelqu’un révèle une force que tu ne vois pas.</p>
                                    <p><span className="text-white font-bold">Chaque jour,</span> quelqu’un t’oblige à passer à l’action.</p>
                                </div>

                                <div className="py-8">
                                    <p className="text-2xl md:text-4xl font-black uppercase italic text-white mb-2">
                                        Ce n’est pas un groupe.
                                    </p>
                                    <p className="text-2xl md:text-4xl font-black uppercase italic text-blue-400">
                                        C’est un accélérateur identitaire.
                                    </p>
                                </div>

                                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 inline-block">
                                    <p className="mb-4 text-slate-400 text-sm uppercase tracking-widest font-bold">Le Constat</p>
                                    <p className="italic text-white">
                                        "Parce que parfois, ce qu’il manque pour avancer,<br/>
                                        ce n’est pas une méthode.<br/>
                                        <span className="text-orange-500 font-black not-italic text-2xl mt-2 block">C’est un environnement."</span>
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Badge className="bg-orange-600 text-white border-0 px-6 py-2 text-sm md:text-base font-bold uppercase tracking-widest hover:bg-orange-500">
                                    Tu ne restes pas le même. Parce que 30 miroirs ne mentent pas.
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PHASE 2 */}
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="bg-slate-50 border border-slate-200 p-8 rounded-3xl relative overflow-hidden shadow-lg order-2 md:order-1">
                        <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest">Formation 2</div>
                        <h3 className="text-xl font-black text-slate-900 uppercase mb-8 flex items-center gap-2">
                            <Rocket className="text-orange-600" /> Le Parcours
                        </h3>
                        <div className="space-y-8 relative">
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                            {[
                                { title: "Semaine 4 : L'Offre", desc: "Créer une offre irrésistible qui répond à un besoin réel." },
                                { title: "Semaine 5 : La Vente", desc: "Trouver ses premiers clients, pitcher, vendre sans forcer." },
                                { title: "Le Sprint", desc: "15 jours d'action intensive avec l'Armada pour décoller." }
                            ].map((step, i) => (
                                <div key={i} className="relative flex gap-6">
                                    <div className="h-6 w-6 rounded-full bg-white border-4 border-orange-600 z-10 shrink-0 shadow-sm"></div>
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
                            <div className="inline-block bg-orange-100 text-orange-700 font-black border-2 border-orange-200 mb-6 uppercase tracking-widest px-6 py-3 rounded-full text-sm shadow-sm">
                                Partie 2 • L'Accélération
                            </div>
                            <h2 className="text-4xl font-black uppercase italic text-slate-900 leading-tight">
                                2 Semaines pour<br/>trouver <span className="text-orange-600">tes clients</span>
                            </h2>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <p className="text-lg text-slate-500 leading-relaxed">
                                Une seule obsession : terminer cette quinzaine avec plus de clients ou d'opportunités qu'au départ.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-white p-4 rounded-xl text-center border border-slate-100 shadow-sm">
                                    <div className="text-3xl font-black text-orange-600 mb-1">24</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold">Réseaux</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl text-center border border-slate-100 shadow-sm">
                                    <div className="text-3xl font-black text-blue-600 mb-1">∞</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold">Visibilité</div>
                                </div>
                            </div>
                            
                            <div className="mt-8 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                                <h4 className="font-black text-orange-700 uppercase text-sm mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Le Secret du Pod
                                </h4>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    Vous n'êtes plus seul. Vous avancez avec <strong>23 autres entrepreneurs</strong> qui deviennent votre socle. Chaque jour, vous pitchez à une nouvelle personne.
                                </p>
                            </div>
                        </FadeIn>
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
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all">
                            <h4 className="font-black text-slate-900 text-lg mb-3 flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-orange-500" /> {item.q}
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
                            <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-lg">T</div>
                            <div>
                                <div className="font-bold text-slate-900">Thomas</div>
                                <div className="text-xs font-bold text-slate-400 uppercase">Au chômage depuis 1 an</div>
                            </div>
                        </div>
                        <p className="text-slate-600 italic mb-6">"L'isolement me tuait. Retrouver un groupe de 24 personnes qui avancent, ça m'a redonné vie. J'ai lancé mon offre de coaching sportif."</p>
                        <Badge className="bg-orange-100 text-orange-700 border-0 text-xs font-bold">Fin de l'isolement</Badge>
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

        {/* 6. CTA FINAL */}
        <section id="join" className="py-32 bg-slate-900 relative overflow-hidden text-white">
             <div className="container mx-auto px-4 max-w-xl text-center relative z-20">
                <FloatingIcon duration={4}>
                    <div className="bg-white/10 p-6 rounded-full inline-block mb-8 backdrop-blur-sm border border-white/20">
                        <Rocket className="h-16 w-16 text-orange-500" />
                    </div>
                </FloatingIcon>
                
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 leading-tight">
                    Trouve ton métier.<br/>Lance-toi.<br/>
                    <span className="text-orange-500">Obtiens tes premiers clients.</span>
                </h2>

                <div className="text-center mb-12 space-y-4">
                    <div className="inline-block bg-white text-slate-900 px-6 py-2 font-black text-xl md:text-2xl -skew-x-12">
                        CHOISIS 1 FORMATION OU LES 2
                    </div>
                    <div className="flex flex-col gap-2 text-slate-400 font-bold uppercase tracking-widest text-sm">
                        <span>Session limitée à 24 personnes</span>
                        <span>Entretien préalable obligatoire</span>
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
                        <Anchor className="h-6 w-6 text-orange-600" />
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
                        <li><Link href="/emploi" className="hover:text-orange-600">Trouver sa voie</Link></li>
                        <li><Link href="/entrepreneurs" className="hover:text-orange-600">Lancer son activité</Link></li>
                        <li><Link href="/admin/catalogue-chomeur" className="hover:text-orange-600">Catalogue PDF</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Légal</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="/legal/mentions" className="hover:text-orange-600">Mentions Légales</Link></li>
                        <li><Link href="/legal/terms" className="hover:text-orange-600">CGV / CGU</Link></li>
                        <li><Link href="/legal/privacy" className="hover:text-orange-600">Politique de Confidentialité</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Contact</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li>hello@popey.academy</li>
                        <li>Paris, France</li>
                        <li className="flex gap-4 mt-4">
                            {/* Social Icons Placeholder */}
                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-orange-100 hover:text-orange-600 transition-colors cursor-pointer">
                                <span className="font-black text-xs">IN</span>
                            </div>
                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-orange-100 hover:text-orange-600 transition-colors cursor-pointer">
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
