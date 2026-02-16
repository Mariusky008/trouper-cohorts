"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Anchor, ArrowRight, Brain, CheckCircle2, 
    HelpCircle, Map, Rocket, 
    ShieldCheck, Ship, Target, Users
} from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";
import { PreRegistrationForm } from "@/components/pre-registration-form";
import { cn } from "@/lib/utils";

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

export function LandingEmploi() {
  const targetRef = useRef(null);

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
            <a 
                href="#join" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider h-10 px-6 inline-flex items-center justify-center rounded-full text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
                Postuler
            </a>
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
                  <span className="text-purple-600">&quot;je ne sais pas quoi faire&quot;</span><br/>
                  à entrepreneur en action ?
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
                    <a href="#join" className={cn(buttonVariants({ size: "lg" }), "h-auto min-h-[4rem] py-4 px-6 md:px-10 bg-purple-600 hover:bg-purple-500 text-white font-black text-base md:text-xl uppercase tracking-widest rounded-full shadow-xl shadow-purple-200 hover:shadow-2xl hover:-translate-y-1 transition-all w-auto whitespace-normal leading-tight inline-flex items-center justify-center text-center mx-auto")}>
                        <span className="flex items-center gap-3 text-center justify-center">
                            <span>Je candidate au programme</span>
                            <Rocket className="h-6 w-6 shrink-0" />
                        </span>
                    </a>
                </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 w-full text-white z-20 pointer-events-none">
             <Wave />
          </div>
        </section>

        {/* SECTION 1: TRANSPARENCE & METRICS */}
        <section className="py-24 bg-white relative z-30">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="border-slate-300 text-slate-500 uppercase tracking-widest mb-4">Transparence Totale</Badge>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic text-slate-900">
                        On ne vend pas du rêve,<br/>
                        <span className="text-purple-600">On mesure la réalité.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                        <div className="text-4xl font-black text-purple-600 mb-2">92%</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sortie Positive</div>
                        <p className="text-xs text-slate-400 mt-2">Emploi, formation ou création</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                        <div className="text-4xl font-black text-blue-600 mb-2">15j</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Délai Moyen</div>
                        <p className="text-xs text-slate-400 mt-2">Avant 1er client/contrat</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                        <div className="text-4xl font-black text-green-600 mb-2">300+</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Alumni</div>
                        <p className="text-xs text-slate-400 mt-2">Communauté active</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                        <div className="text-4xl font-black text-orange-600 mb-2">4.9/5</div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Satisfaction</div>
                        <p className="text-xs text-slate-400 mt-2">Avis vérifiés</p>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 2: AVANT / APRÈS (DASHBOARD) */}
        <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic mb-6">
                        Le Dashboard de votre <span className="text-purple-500">Transformation</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Visualisez ce qui change concrètement dans votre vie professionnelle en 5 semaines.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* AVANT */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden group hover:bg-white/10 transition-colors">
                        <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                            Avant Popey
                        </div>
                        <div className="space-y-6 mt-6">
                            <div className="flex items-center gap-4 opacity-50 grayscale group-hover:grayscale-0 transition-all">
                                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                                    <HelpCircle className="text-slate-500 h-6 w-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-300">Flou Artistique</div>
                                    <div className="text-sm text-slate-500">&quot;Je ne sais pas quoi faire&quot;</div>
                                </div>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-red-500 w-[10%] h-full"></div>
                            </div>
                            
                            <div className="flex items-center gap-4 opacity-50 grayscale group-hover:grayscale-0 transition-all">
                                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                                    <Users className="text-slate-500 h-6 w-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-300">Isolement</div>
                                    <div className="text-sm text-slate-500">Seul face à son écran</div>
                                </div>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-red-500 w-[5%] h-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* APRÈS */}
                    <div className="bg-purple-600/10 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden group hover:bg-purple-600/20 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                        <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" /> Après 5 Semaines
                        </div>
                        <div className="space-y-6 mt-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Target className="text-purple-400 h-6 w-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Objectif Cristallin</div>
                                    <div className="text-sm text-purple-200">Offre définie &amp; validée</div>
                                </div>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-full"
                                ></motion.div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Ship className="text-blue-400 h-6 w-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Équipage Solide</div>
                                    <div className="text-sm text-blue-200">23 alliés pour la vie</div>
                                </div>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: "100%" }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                    className="bg-gradient-to-r from-blue-500 to-green-500 h-full"
                                ></motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 4: TIMELINE 5 SEMAINES (DÉTAILLÉE) */}
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="border-purple-200 text-purple-600 uppercase tracking-widest mb-4">Le Programme</Badge>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic text-slate-900">
                        5 Semaines pour <span className="text-purple-600">Tout Changer</span>
                    </h2>
                </div>

                <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {[
                        { title: "Semaine 1 : Le Brouillard", desc: "On déconstruit tout. On explore tes forces, tes envies profondes et on tue les fausses croyances.", icon: Brain, color: "bg-slate-900" },
                        { title: "Semaine 2 : L'Exploration", desc: "Tu testes 3 pistes concrètes. Tu appelles des gens. Tu confrontes tes idées au réel.", icon: Map, color: "bg-blue-600" },
                        { title: "Semaine 3 : La Décision", desc: "On tranche. On choisit une voie. On définit ton offre et ton positionnement unique.", icon: Target, color: "bg-purple-600" },
                        { title: "Semaine 4 : L'Armement", desc: "Tu crées tes outils. Ton pitch, ton profil, ton offre. Tu es prêt à tirer.", icon: ShieldCheck, color: "bg-orange-600" },
                        { title: "Semaine 5 : La Chasse", desc: "Tu ne cherches pas, tu chasses. Tu contactes, tu proposes, tu signes tes premiers contrats.", icon: Rocket, color: "bg-green-600" }
                    ].map((step, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <step.icon className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
                                <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-3 ${step.color}`}>
                                    Semaine {i + 1}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* SECTION 5: ÉTUDE DE CAS (STORYTELLING) */}
        <section className="py-24 bg-slate-50 border-y border-slate-200">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-600/10 rounded-3xl rotate-3"></div>
                        <div className="relative bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 rounded-full bg-slate-200 overflow-hidden">
                                    {/* Placeholder for user image */}
                                    <div className="w-full h-full bg-slate-300 flex items-center justify-center text-2xl font-black text-slate-500">S</div>
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-900">L&apos;histoire de Sarah</h3>
                                    <p className="text-sm text-slate-500 uppercase tracking-widest font-bold">34 ans • En reconversion</p>
                                </div>
                            </div>
                            <div className="space-y-4 text-slate-600 italic">
                                <p>&quot;Je tournais en rond depuis 8 mois. Pôle Emploi me proposait des formations qui ne me correspondaient pas.&quot;</p>
                                <p>&quot;En rejoignant Popey, j&apos;ai arrêté de réfléchir seule. Le groupe m&apos;a poussée à contacter des agences de voyage pour proposer mes services de rédaction.&quot;</p>
                                <p className="font-bold text-purple-600">&quot;Résultat : J&apos;ai signé mon premier devis à 1500€ en Semaine 4.&quot;</p>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-100 flex gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-slate-900">8</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Mois perdus</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-purple-600">5</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Semaines Popey</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-green-600">1</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Nouvelle Vie</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        <Badge variant="outline" className="border-purple-200 text-purple-600 uppercase tracking-widest">Étude de Cas</Badge>
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic text-slate-900">
                            Arrêtez de chercher.<br/>
                            <span className="text-purple-600">Commencez à trouver.</span>
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            L&apos;histoire de Sarah n&apos;est pas une exception. C&apos;est la norme quand on arrête de s&apos;isoler et qu&apos;on suit une méthode prouvée.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-500 h-6 w-6 shrink-0" />
                                <span className="font-medium text-slate-900">Fini le syndrome de l&apos;imposteur</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-500 h-6 w-6 shrink-0" />
                                <span className="font-medium text-slate-900">Fini la procrastination</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-green-500 h-6 w-6 shrink-0" />
                                <span className="font-medium text-slate-900">Action massive et immédiate</span>
                            </li>
                        </ul>
                        <a href="#join" className={cn(buttonVariants(), "bg-slate-900 text-white hover:bg-slate-800 rounded-full px-8 py-6 font-black uppercase tracking-widest text-sm shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-auto inline-flex items-center justify-center")}>
                            Je veux ça
                        </a>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 6: TÉMOIGNAGES (ID: temoignages) */}
        <section id="temoignages" className="py-24 bg-white">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black uppercase italic text-slate-900">Paroles Brutes</h2>
                    <p className="text-slate-500 mt-4">Ce qu&apos;ils disent quand on ne les enregistre pas (ou presque).</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { name: "Marc", role: "Ex-Commercial", quote: "Je pensais être trop vieux pour changer. Le groupe m'a prouvé le contraire. J'ai retrouvé une énergie de gamin." },
                        { name: "Julie", role: "Graphiste", quote: "Je savais faire des logos, mais je ne savais pas trouver des clients. En 2 semaines, j'ai appris plus qu'en 3 ans d'école." },
                        { name: "Karim", role: "Développeur", quote: "La force du réseau est dingue. J'ai trouvé ma première mission grâce à un autre membre de la cohorte." }
                    ].map((t, i) => (
                        <div key={i} className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:border-purple-200 transition-colors">
                            {/* Star icons removed from map to avoid key warning if using index, simplified */}
                            <div className="flex gap-1 mb-4 text-orange-400">
                                ★★★★★
                            </div>
                            <p className="text-slate-700 italic mb-6">&quot;{t.quote}&quot;</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500">{t.name[0]}</div>
                                <div>
                                    <div className="font-bold text-slate-900 text-sm">{t.name}</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* SECTION 7: AUTORITÉ (JEAN-PHILIPPE) */}
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
            
            <div className="container mx-auto px-4 max-w-5xl relative z-10">
                <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-center">
                    <div className="relative">
                         <div className="aspect-[3/4] rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden relative shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src="/jeanphilipperoth.jpg" 
                                alt="Jean-Philippe Roth" 
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div>
                            <Badge className="bg-purple-600 text-white border-0 mb-4 uppercase tracking-widest px-3 py-1 text-xs">Le Capitaine</Badge>
                            <h2 className="text-4xl font-black uppercase italic mb-4">Jean-Philippe Roth</h2>
                            <p className="text-xl text-slate-300 font-medium">&quot;J&apos;ai créé l&apos;école que j&apos;aurais voulu avoir quand j&apos;étais perdu.&quot;</p>
                        </div>
                        <div className="space-y-4 text-slate-400 leading-relaxed">
                            <p>
                                Entrepreneur depuis 15 ans, j&apos;ai connu les hauts vertigineux et les bas solitaires. 
                                J&apos;ai compris une chose : <strong>l&apos;isolement est le seul véritable ennemi.</strong>
                            </p>
                            <p>
                                Avec Popey Academy, je ne vous promets pas la facilité. Je vous promets un cadre, une méthode et une tribu 
                                pour que vous ne soyez plus jamais seul face à vos décisions.
                            </p>
                        </div>
                        <div className="pt-4">
                            <a href="https://wa.me/33768223347" target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline" }), "border-slate-700 text-white hover:bg-slate-800 hover:text-white rounded-full px-8 py-6 uppercase tracking-widest font-bold")}>
                                Discuter avec Jean-Philippe
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* SECTION 8: JOURNÉE TYPE */}
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black uppercase italic text-slate-900">À quoi ressemble une journée ?</h2>
                    <p className="text-slate-500 mt-4">Pas de théorie ennuyeuse. De l&apos;action rythmée.</p>
                </div>

                <div className="space-y-4">
                    {[
                        { time: "09:00", title: "Le Kick-off", desc: "Lancement de la journée avec l'équipage. On pose les objectifs." },
                        { time: "10:00", title: "Deep Work", desc: "Travail sur votre projet (recherche, création, appels). Pas de distraction." },
                        { time: "14:00", title: "Le Lab", desc: "Atelier pratique ou feedback collectif sur vos avancées." },
                        { time: "17:00", title: "Le Debrief", desc: "On célèbre les victoires, on débloque les problèmes." }
                    ].map((slot, i) => (
                        <div key={i} className="flex items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100 hover:border-purple-200 transition-colors shadow-sm">
                            <div className="w-24 font-black text-2xl text-purple-600 text-center shrink-0">{slot.time}</div>
                            <div className="w-px h-12 bg-slate-100 shrink-0"></div>
                            <div>
                                <h4 className="font-bold text-slate-900 uppercase text-sm mb-1">{slot.title}</h4>
                                <p className="text-slate-500 text-sm">{slot.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* SECTION 9: LIVE PROOF (CTA) */}
        <section id="live-wins" className="py-24 bg-white border-t border-slate-100">
            <div className="container mx-auto px-4 text-center">
                 <div className="inline-flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-xs mb-6 animate-pulse">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    En direct
                </div>
                <h2 className="text-3xl md:text-5xl font-black uppercase italic text-slate-900 mb-8">
                    Voir les victoires<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">en temps réel</span>
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto mb-12 text-lg">
                    Nos membres postent leurs résultats tous les jours sur LinkedIn. Ne nous croyez pas sur parole, allez voir.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <a href="https://www.linkedin.com/search/results/content/?keywords=%23popeyacademy" target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg" }), "bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest px-10 py-6 h-auto text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-auto inline-flex items-center justify-center")}>
                        <span className="flex items-center gap-2">
                            Voir le flux LinkedIn <ArrowRight className="h-5 w-5" />
                        </span>
                    </a>
                </div>
            </div>
        </section>

        {/* CTA FINAL */}
        <section id="join" className="py-32 bg-slate-900 relative overflow-hidden text-white">
             <div className="container mx-auto px-4 max-w-xl text-center relative z-20">
                <FloatingIcon duration={4}>
                    <div className="bg-white/10 p-6 rounded-full inline-block mb-8 backdrop-blur-sm border border-white/20">
                        <Rocket className="h-16 w-16 text-purple-500" />
                    </div>
                </FloatingIcon>
                
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 leading-tight">
                    Ta nouvelle vie<br/>commence <span className="text-purple-500">lundi.</span>
                </h2>

                <div className="bg-white text-slate-900 p-1 rounded-3xl shadow-2xl">
                    <div className="bg-slate-50 p-6 rounded-[1.3rem]">
                        <PreRegistrationForm programType="job_seeker" />
                    </div>
                </div>
                
                <p className="mt-8 text-slate-500 text-xs font-medium max-w-sm mx-auto">
                    Places limitées à 24 participants par session.<br/>
                    Sélection sur motivation.
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
                        La première école qui transforme l&apos;indécision en action.
                        <br/>Force &amp; Honneur.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Programmes</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="/emploi" className="hover:text-purple-600">Trouver sa voie</Link></li>
                        <li><Link href="/" className="hover:text-purple-600">Lancer son activité</Link></li>
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
