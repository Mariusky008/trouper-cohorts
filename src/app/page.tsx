"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Anchor, CalendarClock, CheckCircle2, Clock, LayoutList, LifeBuoy, Megaphone, ShieldCheck, Ship, Skull, Sparkles, Target, Trophy, UserPlus, Users, Video } from "lucide-react";
import { PreRegistrationForm } from "@/components/pre-registration-form";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// Animation de vague CSS
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

export default function Home() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"]
  });

  return (
    <div ref={targetRef} className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-orange-500 overflow-x-hidden">
      
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 text-orange-500">
                <Anchor className="h-full w-full" strokeWidth={2.5} />
             </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic">Popey Academy</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-sm font-bold text-orange-400 uppercase tracking-widest animate-pulse">● Embarquement Immédiat</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 font-bold uppercase tracking-wider" asChild>
                <Link href="/login">Connexion</Link>
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider -skew-x-12" asChild>
                <Link href="#join">
                    <span className="skew-x-12">
                        <span className="hidden sm:inline">Monter à Bord</span>
                        <span className="sm:hidden">Go</span>
                    </span>
                </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO (Design V7 / Contenu V6) */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-40 pb-32">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 z-0" />
          
          {/* Particles */}
          <div className="absolute inset-0 opacity-30">
              {[...Array(20)].map((_, i) => (
                  <motion.div 
                    key={i}
                    className="absolute bg-white rounded-full opacity-20"
                    style={{
                        width: Math.random() * 10 + 2 + "px",
                        height: Math.random() * 10 + 2 + "px",
                        left: Math.random() * 100 + "%",
                        top: Math.random() * 100 + "%",
                    }}
                    animate={{ y: [0, -1000] }}
                    transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
                  />
              ))}
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center space-y-8">
            <div className="space-y-6">
                <FloatingIcon>
                    <Badge className="bg-orange-600 text-white border-0 px-4 py-1 text-sm uppercase tracking-widest font-black mb-4">
                        ⚓️ Expédition Business • 14 Jours
                    </Badge>
                </FloatingIcon>
                
                <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">
                  14 jours pour devenir la Référence<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                    Locale.
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-blue-200 max-w-2xl mx-auto font-medium leading-relaxed">
                  Un programme quotidien de 2h à 3h. Un équipage de 24 pros.
                  Concentrez votre communication plus efficacement qu'en un an d'efforts isolés.
                </p>

                <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-6">
                    <Button size="lg" className="h-16 px-10 bg-white text-slate-900 hover:bg-slate-200 font-black text-xl uppercase tracking-widest rounded-none -skew-x-12 border-b-4 border-slate-400 active:border-b-0 active:translate-y-1 transition-all" asChild>
                        <Link href="#join">
                            <span className="skew-x-12 flex items-center gap-3">
                                Je Prends la Barre de ma communication <Ship className="h-6 w-6" />
                            </span>
                        </Link>
                    </Button>
                </div>
                
                {/* Stats Grid V6 style but Dark */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 max-w-4xl mx-auto opacity-80">
                    {[
                        { icon: CalendarClock, label: "14 Jours", sub: "Consécutifs" },
                        { icon: Clock, label: "2h à 3h / jour", sub: "Focus total" },
                        { icon: Users, label: "Groupe de 24", sub: "Soutien actif" },
                        { icon: Megaphone, label: "Visibilité", sub: "Locale & Ciblée" }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700 backdrop-blur-sm">
                            <item.icon className="h-6 w-6 text-orange-400" />
                            <span className="font-bold text-white text-sm uppercase">{item.label}</span>
                            <span className="text-xs text-slate-400">{item.sub}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="absolute bottom-0 w-full text-slate-950 z-20">
             <Wave />
          </div>
        </section>

        {/* 2. LE PROBLÈME (Contenu V6 / Design V7) */}
        <section className="py-24 bg-slate-950 relative z-20">
            <div className="container mx-auto px-4 max-w-4xl text-center space-y-12">
                <FadeIn>
                    <h2 className="text-4xl font-black uppercase italic text-white">Pourquoi vous n'êtes pas assez visible ?</h2>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 md:p-12 text-lg text-slate-400 leading-relaxed rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500" />
                        <p>
                            La plupart des indépendantes savent qu'elles doivent communiquer. 
                            Mais elles le font <strong>seules</strong>, sans structure, quand elles ont le temps.
                        </p>
                        <div className="my-8 h-px bg-slate-800 w-full" />
                        <p>
                            Résultat : des efforts dispersés, peu d'écho, et une visibilité qui ne décolle pas.
                            <br/>
                            Le problème n'est pas votre compétence, c'est l'absence de <span className="text-orange-400 font-bold uppercase">cadre collectif</span>.
                        </p>
                    </div>
                    <div className="pt-8">
                        <Button variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white uppercase font-bold tracking-widest" asChild>
                            <Link href="#join">Je veux une carte et un cap</Link>
                        </Button>
                    </div>
                </FadeIn>

                <div className="pt-8 text-center">
                    <Button className="bg-white text-blue-900 hover:bg-blue-50 font-black uppercase tracking-widest h-14 px-8 text-lg" asChild>
                        <Link href="#join">Réserver ma place dans l'Armada</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* 3. LE PROGRAMME QUOTIDIEN (Contenu V6 / Design V7) */}
        <section className="py-32 bg-slate-900 relative overflow-hidden">
             {/* Map Texture */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="text-center mb-20 space-y-4">
                    <FadeIn>
                        <Badge variant="outline" className="border-orange-500 text-orange-500 uppercase tracking-widest px-4 py-2">Rythme & Structure</Badge>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic text-white">
                            Chaque jour, un Cap Précis.
                        </h2>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                            Fini de naviguer à vue. Tout est guidé. 
                            Prévoyez 2 à 3 heures par jour dédiées à 100% à votre visibilité.
                        </p>
                    </FadeIn>
                </div>

                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        {[
                            { id: 1, title: "Programme Clair", desc: "Chaque matin, découvrez vos actions du jour : vidéo courte, post structuré, interaction locale." },
                            { id: 2, title: "Interventions Croisées", desc: "Réalisez des Lives et des vidéos en duo/trio avec les autres membres. Multipliez votre audience par 2 ou 3." },
                            { id: 3, title: "Actions Concrètes", desc: "Pas de théorie. Vous contactez, vous publiez, vous invitez. Tout est fait pour générer des RDV." }
                        ].map((item, i) => (
                            <FadeIn key={item.id} delay={i * 0.1}>
                                <div className="flex gap-6 group p-6 border border-slate-800 hover:border-orange-500/30 rounded-xl bg-slate-800/30 transition-all">
                                    <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-orange-500 font-bold text-xl shrink-0 group-hover:scale-110 group-hover:border-orange-500 transition-all duration-300">
                                        {item.id}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl text-white mb-2 uppercase italic">{item.title}</h3>
                                        <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                    
                    <FadeIn delay={0.3}>
                        <div className="bg-slate-800 p-8 md:p-10 rounded-xl shadow-2xl border-2 border-slate-700 relative overflow-hidden -skew-x-2">
                            <div className="absolute top-0 right-0 bg-orange-600 text-white text-xs font-bold px-4 py-2 uppercase tracking-widest">Exemple J4</div>
                            
                            <h4 className="font-black text-2xl text-white mb-8 flex items-center gap-3 uppercase italic skew-x-2">
                                <LayoutList className="h-6 w-6 text-orange-500" /> Votre Journée Type
                            </h4>
                            
                            <ul className="space-y-4 skew-x-2">
                                {[
                                    { time: "09h00", title: "Briefing & Mission du jour" },
                                    { time: "10h30", title: "Tournage Vidéo Duo (30min)" },
                                    { time: "14h00", title: "10 interactions locales ciblées" },
                                    { time: "18h00", title: "Atelier Live de perfectionnement" }
                                ].map((action, i) => (
                                    <li key={i} className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
                                        <div className="h-8 w-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 shrink-0 border border-blue-800">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                                            <span className="font-mono text-orange-400 text-sm font-bold">{action.time}</span>
                                            <span className="font-medium text-slate-300">{action.title}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </FadeIn>
                </div>

                <div className="pt-16 text-center">
                    <Button variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white uppercase font-bold tracking-widest h-12 px-8" asChild>
                        <Link href="#join">Voir mon futur quotidien</Link>
                    </Button>
                </div>
            </div>
        </section>

        {/* 4. LE GROUPE & GARANTIE (Contenu V6 / Design V7) */}
        <section className="py-24 bg-blue-950 text-white relative">
            <div className="container mx-auto px-4 max-w-5xl space-y-20">
                {/* Collectif */}
                <div className="text-center space-y-12">
                     <h2 className="text-4xl md:text-5xl font-black uppercase italic">La puissance de l'Armada (x24)</h2>
                     <p className="text-blue-200 text-lg max-w-2xl mx-auto">
                        Vous n'êtes plus seule. Vous faites partie d'une équipe de 24 pros qui avancent au même rythme.
                        Chaque membre devient un relais de votre visibilité.
                     </p>
                     
                     <div className="grid md:grid-cols-3 gap-6 text-left">
                        {[
                            { icon: Users, title: "Soutien Quotidien", desc: "On partage ses victoires, on débloque ses peurs. L'énergie du groupe vous porte." },
                            { icon: Video, title: "Visibilité Croisée", desc: "Intervenez dans les lives des autres. Faites-vous connaître de leur audience." },
                            { icon: UserPlus, title: "Recommandations", desc: "Vos coéquipières vous connaissent et vous recommandent naturellement." }
                        ].map((card, i) => (
                            <div key={i} className="bg-blue-900/30 p-6 border border-blue-800/50 rounded-xl hover:bg-blue-900/50 transition-colors">
                                <card.icon className="h-8 w-8 mb-4 text-orange-400" />
                                <h3 className="font-bold text-lg mb-2 uppercase">{card.title}</h3>
                                <p className="text-sm text-blue-200">{card.desc}</p>
                            </div>
                        ))}
                     </div>
                </div>

                {/* Garantie */}
                <FadeIn>
                    <div className="bg-slate-900 border-4 border-orange-500 p-10 rounded-none shadow-[10px_10px_0px_0px_rgba(30,58,138,1)] max-w-3xl mx-auto relative group">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-6 py-2 font-black uppercase tracking-widest text-sm">Garantie Totale</div>
                        
                        <div className="flex flex-col items-center gap-6 text-center">
                            <ShieldCheck className="h-16 w-16 text-orange-500" />
                            <h3 className="font-black text-2xl text-white uppercase italic">Résultat ou Nouveau Départ</h3>
                            <p className="text-slate-300 text-lg leading-relaxed">
                                Si à la fin des 14 jours, vous n'avez pas obtenu <strong>au moins 1 client</strong> ou plusieurs RDV qualifiés, nous vous replaçons <strong>gratuitement</strong> dans la prochaine expédition.
                                <br/><span className="text-orange-400 font-bold">Zéro risque. Que de l'action.</span>
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>

        {/* 5. CTA : Recrutement */}
        <section id="join" className="py-32 bg-slate-900 relative overflow-hidden">
             <div className="absolute top-0 w-full text-blue-950 rotate-180 z-10">
                <Wave />
             </div>
             
             <div className="container mx-auto px-4 max-w-xl text-center relative z-20 pt-20">
                <FloatingIcon duration={4}>
                    <LifeBuoy className="h-20 w-20 text-orange-500 mx-auto mb-8" />
                </FloatingIcon>
                
                <h2 className="text-5xl font-black uppercase italic mb-8">
                    Votre Place est<br/>dans l'Équipage.
                </h2>

                <div className="text-center mb-8">
                    <span className="text-6xl font-black text-white">199€</span>
                    <p className="text-slate-400 mt-2 uppercase tracking-widest text-xs">Rentabilisé au 1er client</p>
                </div>
                
                <div className="bg-white text-slate-900 p-8 -skew-x-3 border-4 border-orange-500 shadow-[10px_10px_0px_0px_rgba(249,115,22,1)]">
                    <div className="skew-x-3">
                         <div className="text-left mb-6">
                            <h3 className="font-black text-xl uppercase mb-1">Fiche d'Enrôlement</h3>
                            <p className="text-sm text-slate-500">Session de Février 2026</p>
                         </div>
                        <div className="light">
                             <PreRegistrationForm />
                        </div>
                    </div>
                </div>
                
                <p className="text-slate-500 mt-8 font-mono text-sm">
                    /// ATTENTION : 1 SEULE PLACE PAR MÉTIER PAR SECTEUR.
                </p>
             </div>
        </section>
      </main>
        
        <footer className="bg-slate-950 py-12 text-center border-t border-slate-800">
            <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
                <Anchor className="h-6 w-6" />
                <span className="font-black uppercase">Popey Academy</span>
            </div>
            <p className="text-slate-600 text-sm">© 2026. Force & Honneur.</p>
        </footer>
    </div>
  );
}
