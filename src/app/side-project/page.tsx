"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Anchor, 
    ArrowRight, 
    Briefcase, 
    CalendarClock, 
    CheckCircle2, 
    Clock, 
    Coins, 
    HelpCircle, 
    LayoutList, 
    LifeBuoy, 
    Rocket, 
    ShieldCheck, 
    Target, 
    Users, 
    Zap 
} from "lucide-react";
import { motion } from "framer-motion";
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

export default function SideProjectPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-green-500 selection:text-white overflow-x-hidden">
      
      {/* Header - Fixed Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-white/50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 text-green-600">
                <Anchor className="h-full w-full" strokeWidth={2.5} />
             </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic text-slate-900">Popey <span className="text-green-600">Side</span></span>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-sm font-bold text-green-600 uppercase tracking-widest animate-pulse flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-600"></span>
                Inscriptions Ouvertes
             </span>
          </div>
          <div className="flex items-center gap-3">
            <Link 
                href="#join" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider h-10 px-6 inline-flex items-center justify-center rounded-full text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
                Réserver
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-green-50 via-white to-slate-50 z-0" />
          
          <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
            <FadeIn>
                <div className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-full px-4 py-1.5 text-sm text-green-700 font-bold mb-6 shadow-sm">
                    <Briefcase className="h-4 w-4" />
                    <span>Salariés / Complément de revenu</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.95] mb-8 text-green-700">
                  Et si dans 8 semaines<br />
                  vous ajoutiez une<br />
                  <span className="text-green-500">nouvelle source de revenus</span><br />
                  sans quitter votre emploi ?
                </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="text-xl md:text-2xl text-slate-600 font-medium max-w-3xl mx-auto space-y-4">
                    <p>Pas besoin d’idée parfaite. Pas besoin d’expérience. Pas de risques.</p>
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                        <Badge variant="outline" className="bg-white border-green-200 text-green-700 py-2 px-4 text-sm font-bold uppercase tracking-wide">
                            ✅ 1 à 2h par jour
                        </Badge>
                        <Badge variant="outline" className="bg-white border-green-200 text-green-700 py-2 px-4 text-sm font-bold uppercase tracking-wide">
                            ✅ Méthode guidée
                        </Badge>
                        <Badge variant="outline" className="bg-white border-green-200 text-green-700 py-2 px-4 text-sm font-bold uppercase tracking-wide">
                            ✅ Binôme motivant
                        </Badge>
                    </div>
                    <p className="text-slate-900 font-black mt-6">
                        Objectif : poser les bases d’un complément de revenu réel et obtenir vos premières opportunités.
                    </p>
                </div>
            </FadeIn>

            <FadeIn delay={0.4}>
                <div className="pt-8 flex flex-col items-center gap-4 px-4">
                    <Button size="lg" className="h-auto min-h-[4rem] py-4 px-6 md:px-10 bg-green-600 hover:bg-green-500 text-white font-black text-base md:text-xl uppercase tracking-widest rounded-full shadow-xl shadow-green-200 hover:shadow-2xl hover:-translate-y-1 transition-all w-full md:w-auto whitespace-normal leading-tight" asChild>
                        <Link href="#join" className="flex items-center justify-center text-center">
                           Je réserve ma place
                        </Link>
                    </Button>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                        Programme complet — 490€
                    </p>
                </div>
            </FadeIn>
          </div>

          <div className="absolute bottom-0 w-full text-slate-50 z-20 pointer-events-none">
             <Wave />
          </div>
        </section>

        {/* 2. PROBLÈME (IDENTIFICATION) */}
        <section className="py-24 bg-slate-50 relative z-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black uppercase italic text-slate-900 mb-6">Aujourd’hui vous êtes peut-être dans une de ces situations :</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {[
                        "Votre salaire ne suffit plus vraiment",
                        "Vous aimeriez respirer financièrement",
                        "Vous avez déjà pensé à un projet… sans jamais passer à l’action",
                        "Vous manquez de temps, de cadre ou de confiance",
                        "Vous ne savez pas par où commencer"
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                            <div className="bg-red-100 p-2 rounded-full shrink-0 mt-1">
                                <span className="text-red-500 font-black text-sm">✕</span>
                            </div>
                            <span className="text-slate-700 font-medium">{item}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-2xl text-center shadow-lg">
                    <p className="text-xl font-medium leading-relaxed">
                        Le problème n’est pas votre motivation.<br/>
                        Le problème est l’absence de structure.<br/>
                        <span className="text-green-400 font-black uppercase mt-2 block">Se lancer seul après le travail est difficile.</span>
                    </p>
                </div>
            </div>
        </section>

        {/* 3. PROMESSE */}
        <section className="py-24 bg-white relative z-20">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <FadeIn>
                            <h2 className="text-4xl font-black uppercase italic text-slate-900 leading-tight">
                                Ce programme existe pour une raison simple
                            </h2>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <p className="text-xl text-slate-600 leading-relaxed font-medium">
                                Permettre à des personnes qui travaillent déjà de créer une nouvelle source de revenus <span className="text-green-600 font-bold">sans bouleverser leur vie.</span>
                            </p>
                            
                            <div className="mt-8 space-y-4">
                                <h3 className="font-bold text-slate-900 uppercase tracking-widest text-sm">En 8 semaines, vous allez :</h3>
                                <ul className="space-y-3">
                                    {[
                                        "Identifier une opportunité réaliste",
                                        "Construire une offre simple",
                                        "Apprendre à en parler clairement",
                                        "Activer votre réseau",
                                        "Obtenir vos premiers contacts ou clients"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                                            <div className="bg-green-100 p-1 rounded-full"><CheckCircle2 className="text-green-600 h-4 w-4" /></div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>
                    </div>
                    
                    <div className="bg-green-50 p-8 rounded-3xl border border-green-100 relative">
                        <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-bl-xl uppercase tracking-widest">Format Adapté</div>
                        <h3 className="text-2xl font-black uppercase text-slate-900 mb-8 flex items-center gap-3">
                            <Clock className="text-green-600" /> Compatible vie active
                        </h3>
                        <div className="space-y-6">
                            {[
                                { label: "1 à 2h par jour", icon: Clock },
                                { label: "Sessions guidées", icon: LayoutList },
                                { label: "Accompagnement quotidien", icon: LifeBuoy },
                                { label: "Coach IA disponible 24h/24", icon: Zap },
                                { label: "Binôme de progression", icon: Users },
                                { label: "Groupe de 24 participants", icon: Users }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-green-100/50">
                                    <item.icon className="text-green-600 h-5 w-5" />
                                    <span className="font-bold text-slate-700">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 text-center">
                            <span className="inline-block bg-slate-900 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">
                                Vous n’êtes jamais seul.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 4. PROGRAMME EN 3 PHASES */}
        <section className="py-24 bg-slate-900 text-white relative z-20">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black uppercase italic text-white">Le Programme en 3 Phases</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Phase 1 */}
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-green-500/50 transition-all group">
                        <div className="text-green-500 font-black text-6xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">1</div>
                        <h3 className="text-xl font-bold text-white uppercase mb-2">Trouver une opportunité</h3>
                        <p className="text-sm text-slate-400 font-mono mb-6">Semaines 1 à 4</p>
                        <ul className="space-y-3 text-slate-300 text-sm mb-8">
                            <li>• Identifier vos compétences utiles</li>
                            <li>• Détecter des idées monétisables</li>
                            <li>• Choisir une direction réaliste</li>
                            <li>• Construire une première offre simple</li>
                        </ul>
                        <div className="pt-6 border-t border-slate-700">
                            <p className="text-xs text-green-400 uppercase font-bold tracking-widest">Objectif</p>
                            <p className="font-bold text-white">Savoir quoi proposer et à qui.</p>
                        </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="bg-gradient-to-b from-green-900 to-slate-800 p-8 rounded-2xl border border-green-500/30 hover:border-green-500 transition-all transform md:-translate-y-4 shadow-xl">
                        <div className="text-white font-black text-6xl mb-4">2</div>
                        <h3 className="text-xl font-bold text-white uppercase mb-2">Accélération x24</h3>
                        <p className="text-sm text-green-300 font-mono mb-6">15 Jours Intensifs (Le Cœur)</p>
                        <ul className="space-y-3 text-white text-sm mb-8 font-medium">
                            <li className="flex gap-2"><Zap className="h-4 w-4 text-green-400" /> Travail en binômes</li>
                            <li className="flex gap-2"><Zap className="h-4 w-4 text-green-400" /> Activation des réseaux</li>
                            <li className="flex gap-2"><Zap className="h-4 w-4 text-green-400" /> Visibilité croisée</li>
                            <li className="flex gap-2"><Zap className="h-4 w-4 text-green-400" /> Mise en action quotidienne</li>
                        </ul>
                        <div className="pt-6 border-t border-green-500/30">
                            <p className="text-xs text-green-400 uppercase font-bold tracking-widest">Une seule obsession</p>
                            <p className="font-bold text-white">Obtenir vos premières opportunités.</p>
                        </div>
                    </div>

                    {/* Phase 3 */}
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-green-500/50 transition-all group">
                        <div className="text-green-500 font-black text-6xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">3</div>
                        <h3 className="text-xl font-bold text-white uppercase mb-2">Stabiliser et organiser</h3>
                        <p className="text-sm text-slate-400 font-mono mb-6">Semaines 7-8</p>
                        <ul className="space-y-3 text-slate-300 text-sm mb-8">
                            <li>• Organiser votre temps avec votre emploi</li>
                            <li>• Structurer votre activité</li>
                            <li>• Sécuriser vos premiers revenus</li>
                            <li>• Préparer la suite</li>
                        </ul>
                        <div className="pt-6 border-t border-slate-700">
                            <p className="text-xs text-green-400 uppercase font-bold tracking-widest">Objectif</p>
                            <p className="font-bold text-white">Un système compatible avec votre vie.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 5. MÉCANIQUE HUMAINE */}
        <section className="py-24 bg-white relative z-20">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1 relative">
                        <div className="absolute inset-0 bg-green-100 rounded-full blur-3xl opacity-50"></div>
                        <div className="relative bg-white p-8 rounded-3xl border border-slate-100 shadow-xl space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                <div className="h-12 w-12 bg-slate-900 rounded-full flex items-center justify-center text-white"><Users /></div>
                                <div>
                                    <p className="font-bold text-slate-900">24 Réseaux Personnels</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">S'activent pour vous</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                <div className="h-12 w-12 bg-green-600 rounded-full flex items-center justify-center text-white"><Target /></div>
                                <div>
                                    <p className="font-bold text-slate-900">24 Personnes parlent de vous</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Effet multiplicateur</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white"><ShieldCheck /></div>
                                <div>
                                    <p className="font-bold text-slate-900">24 Regards vous challengent</p>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Bienveillance exigeante</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="order-1 md:order-2 space-y-8">
                        <h2 className="text-4xl font-black uppercase italic text-slate-900 leading-tight">
                            Pourquoi ça fonctionne ?
                        </h2>
                        <p className="text-xl text-slate-600 leading-relaxed">
                            Parce que vous n’êtes pas seul. Seul, tout est lent. <span className="text-green-600 font-black">À plusieurs, tout accélère.</span>
                        </p>
                        
                        <div className="bg-slate-900 text-white p-6 rounded-xl">
                            <h3 className="font-bold uppercase tracking-widest text-sm mb-4 text-green-400">Le Duo Gagnant</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="font-black text-lg mb-1">🤝 Binôme Humain</p>
                                    <p className="text-sm text-slate-400">Pour vous motiver et avancer.</p>
                                </div>
                                <div>
                                    <p className="font-black text-lg mb-1">🤖 Coach IA</p>
                                    <p className="text-sm text-slate-400">Pour répondre à tout, 24/7.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 6. OUTCOMES & TARGET */}
        <section className="py-24 bg-slate-50 border-y border-slate-200">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-2xl font-black uppercase text-slate-900 mb-6 flex items-center gap-3">
                            <Target className="text-green-600" /> Ce que vous pouvez obtenir
                        </h3>
                        <ul className="space-y-4">
                            {[
                                "Une idée claire",
                                "Une offre prête",
                                "Une communication posée",
                                "Des contacts intéressés",
                                "Des premiers clients possibles",
                                "Une nouvelle confiance"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <CheckCircle2 className="text-green-500 h-5 w-5" /> {item}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <p className="text-center font-bold text-slate-900">
                                Vous ne quittez pas votre emploi.<br/>
                                <span className="text-green-600">Vous ajoutez une option.</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-2xl font-black uppercase text-slate-900 mb-6 flex items-center gap-3">
                            <Users className="text-blue-600" /> Pour qui est ce programme
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="font-bold text-green-700 uppercase text-sm mb-2">C'est pour :</p>
                                <ul className="space-y-2 text-slate-700 text-sm">
                                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Salariés</li>
                                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Personnes en reconversion progressive</li>
                                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Personnes qui veulent tester un projet</li>
                                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Personnes qui veulent respirer financièrement</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold text-red-700 uppercase text-sm mb-2">Ce n'est PAS pour :</p>
                                <ul className="space-y-2 text-slate-700 text-sm">
                                    <li className="flex gap-2"><span className="text-red-500 font-bold">✕</span> Ceux qui cherchent de l’argent facile</li>
                                    <li className="flex gap-2"><span className="text-red-500 font-bold">✕</span> Ceux qui refusent de passer à l’action</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 7. INVESTISSEMENT & CTA */}
        <section id="join" className="py-32 bg-slate-900 relative overflow-hidden text-white">
             <div className="container mx-auto px-4 max-w-2xl text-center relative z-20">
                
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 leading-tight">
                    Investissement
                </h2>

                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 mb-12">
                    <p className="text-slate-300 text-sm uppercase tracking-widest font-bold mb-4">Programme complet 8 semaines</p>
                    <div className="text-6xl font-black text-white mb-4">490€</div>
                    <p className="text-slate-400 text-sm mb-8">Coach IA + Binôme + Collectif + Méthode</p>
                    
                    <div className="text-left bg-slate-950/50 p-6 rounded-xl border border-white/5 space-y-2 mb-8">
                        <p className="text-xs text-slate-500 uppercase font-bold">C'est moins que :</p>
                        <p className="text-slate-300 text-sm flex items-center gap-2"><Coins className="h-4 w-4 text-slate-500" /> Beaucoup de formations classiques</p>
                        <p className="text-slate-300 text-sm flex items-center gap-2"><Coins className="h-4 w-4 text-slate-500" /> Une erreur d’orientation</p>
                        <p className="text-slate-300 text-sm flex items-center gap-2"><Coins className="h-4 w-4 text-slate-500" /> Plusieurs mois à hésiter</p>
                    </div>

                    <div className="bg-green-900/30 p-6 rounded-xl border border-green-500/30 mb-8">
                        <h4 className="font-bold text-green-400 uppercase text-sm mb-2 flex items-center justify-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Garantie Psychologique
                        </h4>
                        <p className="text-green-100 text-sm">
                            Si vous suivez le programme sérieusement et que vous estimez ne pas avoir avancé, 
                            nous vous réintégrons gratuitement dans une session suivante. <span className="font-bold text-white">Vous ne prenez pas de risque.</span>
                        </p>
                    </div>

                    <Button size="lg" className="w-full h-auto min-h-[4rem] py-4 bg-green-600 hover:bg-green-500 text-white font-black text-lg md:text-xl uppercase tracking-widest rounded-full shadow-xl shadow-green-900/50 transition-all whitespace-normal leading-tight" asChild>
                        <Link href="#join" className="flex items-center justify-center text-center">Je rejoins la prochaine session</Link>
                    </Button>
                    <p className="mt-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        Places limitées à 24 participants.
                    </p>
                </div>

                <div className="space-y-6">
                    <p className="text-2xl font-black uppercase italic text-white">
                        Votre situation actuelle n’est pas une fatalité.
                    </p>
                    <p className="text-slate-300">
                        Dans 2 mois, vous pouvez continuer comme aujourd’hui<br/>
                        ou avoir commencé quelque chose de nouveau.
                    </p>
                    <p className="font-bold text-white">La décision vous appartient.</p>
                </div>

                {/* Formulaire caché ou affiché ? Le prompt demande un bouton "Je réserve ma place". 
                    On va mettre le formulaire ici pour la conversion directe comme sur les autres pages */}
                <div className="mt-12 bg-white text-slate-900 p-1 rounded-3xl text-left">
                    <div className="bg-slate-50 p-6 rounded-[1.3rem]">
                        <div className="text-center mb-6">
                            <h3 className="font-black text-xl uppercase">Candidature Rapide</h3>
                            <p className="text-sm text-slate-500">Remplissez ce formulaire pour vérifier votre éligibilité.</p>
                        </div>
                        <PreRegistrationForm programType="side_project" />
                    </div>
                </div>

             </div>
        </section>

      </main>
      
      <footer className="bg-white py-12 border-t border-slate-100 text-slate-900">
        <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Anchor className="h-6 w-6 text-green-600" />
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
                        <li><Link href="/emploi" className="hover:text-green-600">Trouver sa voie</Link></li>
                        <li><Link href="/entrepreneurs" className="hover:text-green-600">Lancer son activité</Link></li>
                        <li><Link href="/side-project" className="hover:text-green-600">Side Project</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Légal</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li><Link href="/legal/mentions" className="hover:text-green-600">Mentions Légales</Link></li>
                        <li><Link href="/legal/terms" className="hover:text-green-600">CGV / CGU</Link></li>
                        <li><Link href="/legal/privacy" className="hover:text-green-600">Politique de Confidentialité</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 uppercase mb-4 text-sm">Contact</h4>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li>hello@popey.academy</li>
                        <li>Paris, France</li>
                        <li className="flex gap-4 mt-4">
                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-green-100 hover:text-green-600 transition-colors cursor-pointer">
                                <span className="font-black text-xs">IN</span>
                            </div>
                            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-green-100 hover:text-green-600 transition-colors cursor-pointer">
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