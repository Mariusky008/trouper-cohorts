"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Anchor, CalendarClock, CheckCircle2, Clock, LayoutList, LifeBuoy, Megaphone, 
    ShieldCheck, Ship, Users, Video, Target, ArrowRight, Zap, MessageCircle,
    Briefcase, Hammer, Lightbulb, Monitor, Scissors
} from "lucide-react";
import { PreRegistrationForm } from "@/components/pre-registration-form";
import { StickyRecruitmentBanner } from "@/components/sticky-recruitment-banner";
import { motion, useScroll } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

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
                Session Mars : Ouverte
             </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-500 hover:text-orange-600 font-bold uppercase tracking-wider hidden sm:flex" asChild>
                <Link href="/login">Connexion</Link>
            </Button>
            <a 
                href="#join" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider h-10 px-6 inline-flex items-center justify-center rounded-full text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
                Rejoindre
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO / ACCROCHE */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-slate-50 z-0" />
          
          <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
            <FadeIn>
                <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm text-orange-600 font-bold mb-6 shadow-sm">
                    <Users className="h-4 w-4" />
                    <span>24 Places Maximum</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.95] mb-8 text-slate-900">
                  Et si on se mettait à<br />
                  <span className="text-orange-600">24 entrepreneurs</span><br />
                  pour faire exploser chacun<br />
                  notre chiffre d’affaires ?
                </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="text-xl md:text-3xl font-black uppercase tracking-tight space-y-4 max-w-4xl mx-auto">
                    <p className="text-orange-600 leading-tight">15 jours intensifs pour développer sa communication sur les réseaux (humains et sociaux)</p>
                    <div className="w-24 h-1 bg-slate-200 mx-auto rounded-full my-6"></div>
                    <p className="text-slate-600">23 partenaires qui activent leur réseau pour vous.</p>
                    <p className="text-slate-900">Une seule obsession : terminer la quinzaine avec plus de clients qu’au départ.</p>
                </div>
            </FadeIn>

            <FadeIn delay={0.4}>
                <div className="pt-8 px-4">
                    <a href="#join" className={cn(buttonVariants({ size: "lg" }), "h-auto min-h-[4rem] py-4 px-6 md:px-10 bg-orange-600 hover:bg-orange-500 text-white font-black text-base md:text-xl uppercase tracking-widest rounded-full shadow-xl shadow-orange-200 hover:shadow-2xl hover:-translate-y-1 transition-all w-auto whitespace-normal leading-tight inline-flex items-center justify-center text-center mx-auto")}>
                       Je rejoins la prochaine cohorte
                    </a>
                    <p className="mt-4 text-slate-500 text-xs font-medium uppercase tracking-widest px-4">
                        Tu ne seras plus jamais invisible dans ton marché.
                    </p>
                </div>
            </FadeIn>
          </div>

          <div className="absolute bottom-0 w-full text-white z-20 pointer-events-none">
             <Wave />
          </div>
        </section>

        {/* SECTION RECRUTEMENT ALLIANCE (PLACES DISPONIBLES) */}
        <section className="bg-slate-900 border-b border-slate-800 relative overflow-hidden">
             <div className="container mx-auto px-4 max-w-6xl py-12 relative z-10">
                 <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-blue-900/20">
                     
                     <div className="flex-1 text-center md:text-left space-y-4">
                         <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold uppercase tracking-widest text-xs animate-pulse">
                             <Briefcase className="h-3 w-3" /> Recrutement Actif
                         </div>
                         <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase leading-tight">
                             Cette Alliance recherche <span className="text-blue-400">ces profils</span>
                         </h2>
                         <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-lg">
                             Il reste encore <span className="text-white font-bold">12 places</span> pour compléter notre équipage de 24. 
                             Votre compétence est peut-être la pièce manquante.
                         </p>
                         <div className="hidden md:block">
                            <a href="#join" className="text-xs font-bold text-blue-400 hover:text-white uppercase tracking-widest border-b border-blue-400/50 pb-0.5 hover:border-white transition-colors">
                                Voir si je corresponds →
                            </a>
                         </div>
                     </div>

                     <div className="flex-1 w-full">
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { name: "Menuisier", icon: Hammer, slots: "1 place", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                                { name: "Électricien", icon: Lightbulb, slots: "1 place", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                                { name: "Web Dev", icon: Monitor, slots: "1 place", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                                { name: "Couturier", icon: Scissors, slots: "1 place", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
                            ].map((role, i) => (
                                <motion.div 
                                    key={i}
                                    whileHover={{ scale: 1.05 }}
                                    className={`p-3 rounded-xl border ${role.border} ${role.bg} flex flex-col items-center text-center gap-2 cursor-pointer relative overflow-hidden group`}
                                >
                                    <div className={`h-8 w-8 rounded-full bg-[#0a0f1c] flex items-center justify-center ${role.color} mb-1 shadow-lg group-hover:bg-white group-hover:text-slate-900 transition-colors`}>
                                        <role.icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-white font-bold text-xs leading-tight">{role.name}</span>
                                    <span className="text-[9px] uppercase font-bold text-slate-300 bg-[#0a0f1c]/50 px-2 py-0.5 rounded-full border border-white/5">
                                        {role.slots}
                                    </span>
                                </motion.div>
                            ))}
                         </div>
                         <div className="mt-6 text-center md:hidden">
                            <a href="#join" className="text-xs font-bold text-blue-400 hover:text-white uppercase tracking-widest border-b border-blue-400/50 pb-0.5">
                                Rejoindre l'équipage
                            </a>
                         </div>
                     </div>

                 </div>
             </div>
        </section>

        {/* SECTION 9 — LIVE WINS (TICKER) */}
        <div className="bg-slate-900 border-y border-slate-800 py-3 overflow-hidden relative z-30" id="live-wins">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-center gap-2 md:gap-8 text-xs font-medium text-slate-300 overflow-x-auto no-scrollbar whitespace-nowrap">
                    <span className="font-bold text-orange-500 uppercase tracking-widest shrink-0">En direct du Cockpit :</span>
                    <span className="flex items-center gap-2 shrink-0"><CheckCircle2 className="h-3 w-3 text-green-500" /> Lucas : "Devis signé à 1500€ !" (Il y a 2h)</span>
                    <span className="hidden md:flex text-slate-700">•</span>
                    <span className="flex items-center gap-2 shrink-0"><CheckCircle2 className="h-3 w-3 text-green-500" /> Sarah : "3 RDV qualifiés ce matin" (Il y a 4h)</span>
                    <span className="hidden md:flex text-slate-700">•</span>
                    <span className="flex items-center gap-2 shrink-0"><CheckCircle2 className="h-3 w-3 text-green-500" /> Marc : "Post viral 10k vues" (Il y a 6h)</span>
                </div>
            </div>
        </div>

        {/* SECTION 1 — PREUVES CHIFFRÉES & TRANSPARENCE */}
        <section className="py-16 bg-white relative z-30 -mt-10 mx-4" id="preuves">
            <div className="container mx-auto max-w-6xl">
                {/* GLOBAL DASHBOARD */}
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100 mb-12">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl font-black uppercase italic text-slate-900">Résultats moyens observés</h2>
                        <p className="text-slate-500 mt-2">Données consolidées sur les 3 dernières cohortes.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center divide-x divide-slate-100">
                        <div className="space-y-2 px-2">
                            <div className="text-3xl md:text-4xl font-black text-orange-600">100%</div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide">Ont obtenu ≥ 1 RDV</p>
                        </div>
                        <div className="space-y-2 px-2">
                            <div className="text-3xl md:text-4xl font-black text-blue-600">68%</div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide">Ont signé 1 client (J+30)</p>
                        </div>
                        <div className="space-y-2 px-2">
                            <div className="text-3xl md:text-4xl font-black text-green-600">~7</div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide">Opportunités / pers.</p>
                        </div>
                        <div className="space-y-2 px-2">
                            <div className="text-3xl md:text-4xl font-black text-purple-600">x3</div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide">Visibilité LinkedIn</p>
                        </div>
                         <div className="space-y-2 px-2">
                            <div className="text-3xl md:text-4xl font-black text-slate-900">32</div>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide">Conversations Business</p>
                        </div>
                    </div>
                </div>

                {/* TRANSPARENCE METRICS */}
                <div className="grid md:grid-cols-3 gap-8 text-left text-sm text-slate-600 bg-slate-50 p-8 rounded-2xl border border-slate-200">
                    <div>
                        <h4 className="font-bold text-slate-900 uppercase mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-orange-600" /> Calcul des Opportunités
                        </h4>
                        <p className="leading-relaxed text-xs">
                            Une opportunité est validée si elle correspond à une demande de RDV, une mise en relation qualifiée, une réponse commerciale positive ou une recommandation active. Tout est vérifié dans le tableau de suivi.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 uppercase mb-2 flex items-center gap-2">
                            <LifeBuoy className="h-4 w-4 text-green-600" /> Mesure de Satisfaction
                        </h4>
                        <p className="leading-relaxed text-xs">
                            Sondage anonyme post-cohorte. Le taux (98%) correspond aux participants se déclarant "Satisfaits" ou "Très Satisfaits" de leur retour sur investissement immédiat.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 uppercase mb-2 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" /> Définition Collaboration
                        </h4>
                        <p className="leading-relaxed text-xs">
                            Partenariat commercial, mission signée entre membres, ou recommandation ayant abouti à un contrat. Les simples échanges de courtoisie ne comptent pas.
                        </p>
                    </div>
                </div>
                
                <div className="text-center mt-12">
                    <a href="#temoignages" className={cn(buttonVariants({ size: "lg" }), "bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-10 py-4 h-auto text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-auto inline-flex items-center justify-center")}>
                        Voir les preuves en direct
                    </a>
                </div>
            </div>
        </section>

        {/* SECTION 7 — INTENSITÉ ACCOMPAGNÉE */}
        <section className="py-24 bg-white border-t border-slate-100">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="border-green-200 text-green-700 uppercase tracking-widest mb-4">Zéro Friction</Badge>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic text-slate-900">Une intensité guidée,<br/><span className="text-green-600">Jamais subie.</span></h2>
                    <p className="text-slate-500 mt-4 text-lg">On a supprimé tout ce qui vous fait perdre du temps.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">⏱️</div>
                        <h3 className="font-bold text-slate-900 mb-2">1h / Jour</h3>
                        <p className="text-sm text-slate-500">Suffisant pour obtenir des résultats. Tout est prémâché pour aller vite.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">🧗</div>
                        <h3 className="font-bold text-slate-900 mb-2">Progressif</h3>
                        <p className="text-sm text-slate-500">On commence doucement (J1-J3) pour monter en puissance sans vous brusquer.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">🤝</div>
                        <h3 className="font-bold text-slate-900 mb-2">Jamais Seul</h3>
                        <p className="text-sm text-slate-500">En cas de blocage, le groupe et le coach débloquent la situation en 10min.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* 2. LE COLLECTIF : 24 ENTREPRENEURS */}
        <section className="py-24 bg-slate-900 text-white relative z-20">
            <div className="container mx-auto px-4 max-w-6xl">
                
                {/* Intro Fusionnée */}
                <div className="text-center mb-20 max-w-4xl mx-auto space-y-6">
                    <FadeIn>
                         <Badge className="bg-orange-500 text-white border-0 mb-6 uppercase tracking-widest px-4 py-1.5 text-sm">Le Collectif</Badge>
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic text-white leading-tight">
                            24 entrepreneurs, 15 jours,<br/><span className="text-orange-500">un effet multiplicateur.</span>
                        </h2>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <p className="text-xl text-slate-300 leading-relaxed">
                            Vous n’êtes plus seul. Chaque membre active son réseau pour vous pendant que vous activez le vôtre. 
                            <br/><span className="text-white font-bold">Résultat :</span> des opportunités, des rendez-vous, des clients… et une visibilité exponentielle.
                        </p>
                    </FadeIn>
                </div>

                {/* Projection Chiffrée Réaliste */}
                <div className="grid md:grid-cols-4 gap-6 mb-24">
                    {[
                        { val: "24", label: "Réseaux Activés", sub: "Effet immédiat", color: "text-orange-500", border: "hover:border-orange-500/50" },
                        { val: "24", label: "Offres Présentées", sub: "Pitch quotidien", color: "text-blue-500", border: "hover:border-blue-500/50" },
                        { val: "30+", label: "Conversations", sub: "Business déclenché", color: "text-green-500", border: "hover:border-green-500/50" },
                        { val: "x24", label: "Visibilité", sub: "Portée cumulée", color: "text-purple-500", border: "hover:border-purple-500/50" }
                    ].map((stat, i) => (
                        <div key={i} className={`bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center transition-all ${stat.border} group`}>
                            <div className={`text-5xl font-black ${stat.color} mb-3 group-hover:scale-110 transition-transform`}>{stat.val}</div>
                            <div className="text-sm font-bold text-white uppercase tracking-wider mb-2">{stat.label}</div>
                            <p className="text-xs text-slate-400 uppercase font-medium">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Storytelling & Preuve */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
                    
                    {/* Colonne Gauche : Imaginez... */}
                    <div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
                        <h3 className="text-2xl font-black uppercase italic text-white mb-8 flex items-center gap-3">
                            <Zap className="text-yellow-500 h-6 w-6" /> Imaginez dans 15 jours
                        </h3>
                        <ul className="space-y-6">
                            {[
                                "Des personnes parlent de vous alors que vous ne les connaissez pas",
                                "Votre téléphone sonne pour des rendez-vous entrants",
                                "Votre activité gagne en visibilité et crédibilité sur votre marché",
                                "Vous avez de vrais clients et un pipeline solide"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="bg-slate-700 p-1.5 rounded-full mt-1"><CheckCircle2 className="h-4 w-4 text-green-400" /></div>
                                    <span className="text-slate-200 font-medium text-lg leading-snug">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Colonne Droite : Le Soutien */}
                    <div className="space-y-8">
                        <div className="bg-slate-800/30 p-8 rounded-2xl border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                            <h4 className="font-black text-white uppercase text-lg mb-2 flex items-center gap-3">
                                <LifeBuoy className="text-blue-500 h-6 w-6" /> Soutien Quotidien
                            </h4>
                            <p className="text-slate-400">Énergie du groupe, partage des victoires et déblocage des peurs. Vous ne lâchez rien car les autres sont là.</p>
                        </div>
                         <div className="bg-slate-800/30 p-8 rounded-2xl border border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                            <h4 className="font-black text-white uppercase text-lg mb-2 flex items-center gap-3">
                                <Megaphone className="text-purple-500 h-6 w-6" /> Visibilité Croisée
                            </h4>
                            <p className="text-slate-400">Interventions dans les lives des autres, mentions croisées. Vous multipliez votre portée par la force du nombre.</p>
                        </div>
                    </div>
                </div>

                {/* Garantie & CTA */}
                <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                     <div className="relative z-10">
                        <h3 className="text-3xl md:text-4xl font-black uppercase italic text-white mb-6">Zéro Risque. Que de l'Action.</h3>
                        <p className="text-orange-100 text-lg md:text-xl max-w-3xl mx-auto mb-10 font-medium leading-relaxed">
                            Si à la fin des 15 jours, vous n’êtes pas pleinement satisfait de vos résultats, 
                            nous vous replaçons gratuitement dans la prochaine session.
                        </p>
                        
                        <div className="flex flex-col items-center gap-6 px-4">
                            <a href="#join" className={cn(buttonVariants({ size: "lg" }), "bg-white text-orange-600 hover:bg-orange-50 font-black uppercase tracking-widest px-6 md:px-10 h-auto min-h-[4rem] py-4 text-base md:text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-full w-auto whitespace-normal leading-tight inline-flex items-center justify-center text-center mx-auto")}>
                                Je réserve
                            </a>
                        </div>
                     </div>
                </div>

            </div>
        </section>

        {/* RYTHME & STRUCTURE */}
        <section className="py-24 bg-white" id="quotidien">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-16 items-start">
                    <div className="space-y-12">
                        <div>
                            <Badge variant="outline" className="border-blue-200 text-blue-600 uppercase mb-4">Méthode</Badge>
                            <h2 className="text-4xl font-black uppercase italic text-slate-900 mb-6">Rythme & Structure</h2>
                            <h3 className="text-2xl font-bold text-slate-700 mb-4">Chaque jour, un Cap Précis.</h3>
                            <div className="flex items-center gap-3 text-green-700 font-bold bg-green-50 p-4 rounded-lg border border-green-100">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <span>Charge Mentale Zéro : On vous dit quoi faire, vous le faites, ça marche.</span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex gap-6">
                                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-xl text-slate-900 border border-slate-200 shrink-0">1</div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 uppercase mb-2">Programme Clair</h4>
                                    <p className="text-slate-500">Chaque matin, découvrez vos actions du jour : vidéo courte, post structuré, interaction locale.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-xl text-slate-900 border border-slate-200 shrink-0">2</div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 uppercase mb-2">Interventions Croisées</h4>
                                    <p className="text-slate-500">Réalisez des Lives et des vidéos en duo/trio avec les autres membres. Multipliez votre audience par 2 ou 3.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-xl text-slate-900 border border-slate-200 shrink-0">3</div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 uppercase mb-2">Actions Concrètes</h4>
                                    <p className="text-slate-500">Pas de théorie. Vous contactez, vous publiez, vous invitez. Tout est fait pour générer des RDV.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 relative shadow-lg">
                        <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-bl-xl uppercase tracking-widest">Exemple J4</div>
                        <h3 className="text-2xl font-black uppercase italic text-slate-900 mb-8">Votre Journée Type</h3>
                        
                        <div className="space-y-0 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

                            {[
                                { time: "09h00", title: "La Munition (Offre)", desc: "On rédige ton message d'approche. Court. Tranchant. Impossible à ignorer.", icon: Target },
                                { time: "10h30", title: "Le Crash-Test (Validation)", desc: "Ton binôme et l'IA testent ton message. On élimine chaque mot faible.", icon: ShieldCheck },
                                { time: "14h00", title: "Le Feu (Action Réelle)", desc: "Passage à l'acte immédiat (10 prospects contactés) + utilisation du réseau du binôme.", icon: Zap },
                                { time: "18h00", title: "Le Tableau de Chasse", desc: "Tu ne fermes pas ton ordi sans une victoire : un RDV, une réponse, une piste.", icon: Megaphone }
                            ].map((slot, i) => (
                                <div key={i} className="flex gap-6 relative py-4">
                                    <div className="h-14 w-14 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center shrink-0 z-10 text-xs font-bold text-slate-500 shadow-sm">
                                        <slot.icon className="h-4 w-4 mb-1 text-blue-600" />
                                        {slot.time.split('h')[0]}h
                                    </div>
                                    <div className="pt-1">
                                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">{slot.time}</div>
                                        <div className="font-black text-slate-900 text-lg leading-tight mb-1">{slot.title}</div>
                                        <div className="text-sm text-slate-500 leading-snug">{slot.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                             {/* CTA Removed */}
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <a href="#join" className={cn(buttonVariants({ size: "lg" }), "bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest px-10 py-4 h-auto text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-auto inline-flex items-center justify-center")}>
                        Je réserve ma place
                    </a>
                </div>
            </div>
        </section>

        {/* SECTION 4 — TIMELINE 15 JOURS */}
        <section className="py-24 bg-slate-900 text-white border-t border-slate-800">
             <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <Badge className="bg-blue-600 text-white border-0 mb-4 uppercase tracking-widest px-4 py-1.5 text-sm">La Transformation</Badge>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic text-white">Progression typique sur 15 jours</h2>
                    <p className="text-slate-400 mt-4 text-lg">Votre pipeline commercial se construit jour après jour.</p>
                </div>

                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-600 before:to-transparent">
                    {[
                        { days: "Jours 1 à 3", title: "Clarification & Validation", desc: "On ne tire pas à blanc. On valide votre offre et votre cible avec le groupe pour s'assurer qu'elle est irrésistible.", color: "border-blue-500 text-blue-400" },
                        { days: "Jours 4 à 7", title: "Visibilité & Premières Conversations", desc: "Vous commencez à exister. Les premières interactions qualifiées démarrent. Vous n'êtes plus invisible.", color: "border-orange-500 text-orange-400" },
                        { days: "Jours 8 à 12", title: "Recommandations & Opportunités", desc: "L'effet de levier s'active. Les membres parlent de vous. Les leads entrants arrivent sans prospection froide.", color: "border-green-500 text-green-400" },
                        { days: "Jours 13 à 15", title: "Closing & Consolidation", desc: "On transforme les conversations en rendez-vous et en signatures. On sécurise la suite.", color: "border-purple-500 text-purple-400" }
                    ].map((item, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 ${item.color} bg-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            </div>
                            
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl bg-slate-800 border border-slate-700 shadow-lg">
                                <div className={`font-black uppercase tracking-widest text-xs mb-1 ${item.color.split(' ')[1]}`}>{item.days}</div>
                                <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </section>

        {/* 3. CONCRÈTEMENT : COMMENT ÇA MARCHE */}
        <section className="py-24 bg-slate-50 border-t border-slate-200" id="profil">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="border-slate-300 text-slate-500 uppercase mb-4">Mode d'Emploi</Badge>
                    <h2 className="text-4xl font-black uppercase italic text-slate-900">Concrètement, pendant 15 jours</h2>
                    <p className="text-slate-500 mt-4 text-lg">Un entrepreneur établi veut du concret. Sinon il part.</p>
                </div>

                {/* STEPPER VISUEL */}
                <div className="mb-20">
                    <div className="grid md:grid-cols-4 gap-4">
                        {[
                            { step: "1", title: "Rencontre du groupe", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                            { step: "2", title: "Activation du réseau", icon: Zap, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
                            { step: "3", title: "Missions quotidiennes", icon: Target, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
                            { step: "4", title: "Opportunités générées", icon: Megaphone, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" }
                        ].map((item, i) => (
                            <div key={i} className={`relative p-6 rounded-2xl border ${item.border} ${item.bg} text-center group hover:-translate-y-1 transition-transform`}>
                                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white border-2 ${item.border} flex items-center justify-center font-black text-sm shadow-sm`}>
                                    {item.step}
                                </div>
                                <div className={`h-12 w-12 mx-auto rounded-full bg-white flex items-center justify-center mb-4 shadow-sm ${item.color}`}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-slate-900 leading-tight">{item.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900 uppercase mb-6 flex items-center gap-2">
                            <LayoutList className="text-orange-600" /> Le Format
                        </h3>
                        <ul className="space-y-4 text-slate-600">
                            <li className="flex items-start gap-3">
                                <span className="bg-slate-100 rounded px-2 py-0.5 text-xs font-bold text-slate-700 mt-1">ACTION</span>
                                <div>1 mission par jour, directement dans ton Cockpit.</div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-slate-100 rounded px-2 py-0.5 text-xs font-bold text-slate-700 mt-1">HUMAIN</span>
                                <div>1 nouveau binôme chaque matin à 6h00.</div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-slate-100 rounded px-2 py-0.5 text-xs font-bold text-slate-700 mt-1">OUTILS</span>
                                <div>Zéro dispersion. Tout se passe sur Popey.Academy (Chat, Visio, Feed).</div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-black text-slate-900 uppercase mb-6 flex items-center gap-2">
                            <CheckCircle2 className="text-green-600" /> Ce qui est inclus
                        </h3>
                        <ul className="space-y-3 text-slate-600">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" /> Ton Équipage (24 entrepreneurs)
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" /> Ton Coach IA personnel (Cerveau du programme)
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" /> Tes Missions scriptées (Pas de page blanche)
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" /> Le Victory Wall (Pour célébrer tes victoires)
                            </li>
                        </ul>
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Ce qui n'est PAS inclus</h4>
                            <p className="text-slate-500 text-sm">Des excuses. De la théorie académique. Des diplômes en papier.</p>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <a href="#join" className={cn(buttonVariants({ size: "lg" }), "bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-900 font-black uppercase tracking-widest px-10 py-4 h-auto text-lg rounded-full shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all w-auto inline-flex items-center justify-center")}>
                        Vérifier si c'est pour moi
                    </a>
                </div>
            </div>
        </section>

        {/* SECTION 2 & 8 — ÉTUDES DE CAS & AVANT/APRÈS */}
        <section className="py-24 border-t border-slate-200">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="border-slate-300 text-slate-500 uppercase tracking-widest mb-4">Du concret</Badge>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic text-slate-900">
                        Ils ne sont pas meilleurs que vous.<br/>
                        <span className="text-orange-600">Ils sont juste mieux entourés.</span>
                    </h2>
                </div>

                <div className="space-y-12">
                    {/* CAS 1: LUCAS */}
                    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                        <div className="grid md:grid-cols-[1fr_2fr] gap-0">
                            <div className="bg-slate-50 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-16 w-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-2xl">L</div>
                                    <div>
                                        <div className="font-black text-slate-900 text-xl">Lucas M.</div>
                                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Freelance Marketing</div>
                                    </div>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="font-bold text-slate-900 uppercase text-xs mb-1">Situation Initiale</p>
                                        <p className="text-slate-600">Revenus en dents de scie (0€ à 4k€). Solitude totale. Pas de stratégie d'acquisition.</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 uppercase text-xs mb-1">Délai</p>
                                        <p className="text-slate-600">Résultats en 12 jours.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 md:p-12">
                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <h4 className="font-bold text-orange-600 uppercase text-sm mb-2 flex items-center gap-2"><Zap className="h-4 w-4" /> Actions Réalisées</h4>
                                        <ul className="space-y-2 text-slate-600 text-sm">
                                            <li>• Réécriture complète de l'offre avec le groupe (J3).</li>
                                            <li>• 10 prises de contact par jour (J5-J10).</li>
                                            <li>• Pitch devant 24 entrepreneurs (J12).</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-600 uppercase text-sm mb-2 flex items-center gap-2"><Target className="h-4 w-4" /> Résultats Mesurés</h4>
                                        <ul className="space-y-2 text-slate-600 text-sm">
                                            <li className="font-bold text-slate-900">• 2 contrats signés (Total 3500€).</li>
                                            <li>• 3 partenaires actifs qui le recommandent.</li>
                                            <li>• Pipeline plein pour le mois suivant.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm italic border-l-4 border-orange-500">
                                    "Je ne cours plus après les clients, ce sont eux qui viennent. L'effet de groupe est juste dingue."
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CAS 2: JULIE */}
                    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
                        <div className="grid md:grid-cols-[1fr_2fr] gap-0">
                            <div className="bg-slate-50 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl">J</div>
                                    <div>
                                        <div className="font-black text-slate-900 text-xl">Julie T.</div>
                                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Consultante RH</div>
                                    </div>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <p className="font-bold text-slate-900 uppercase text-xs mb-1">Situation Initiale</p>
                                        <p className="text-slate-600">Experte reconnue mais invisible sur LinkedIn. Dépendante de 2 gros clients historiques.</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 uppercase text-xs mb-1">Délai</p>
                                        <p className="text-slate-600">Résultats en 15 jours.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 md:p-12">
                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <h4 className="font-bold text-orange-600 uppercase text-sm mb-2 flex items-center gap-2"><Zap className="h-4 w-4" /> Actions Réalisées</h4>
                                        <ul className="space-y-2 text-slate-600 text-sm">
                                            <li>• 5 Posts LinkedIn validés par le coach IA.</li>
                                            <li>• 3 Lives avec d'autres membres de la cohorte.</li>
                                            <li>• Activation des commentaires du groupe (Pod).</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-600 uppercase text-sm mb-2 flex items-center gap-2"><Target className="h-4 w-4" /> Résultats Mesurés</h4>
                                        <ul className="space-y-2 text-slate-600 text-sm">
                                            <li className="font-bold text-slate-900">• +450% de visibilité sur ses posts.</li>
                                            <li>• 5 demandes de RDV entrantes (Inbound).</li>
                                            <li>• 1 mission de conseil signée à 5k€.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm italic border-l-4 border-blue-500">
                                    "Je pensais que LinkedIn ne marchait pas pour moi. En fait, je parlais dans le vide. Avec le groupe, on crie plus fort."
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLEAU AVANT / APRÈS */}
                <div className="mt-20">
                    <h3 className="text-2xl font-black uppercase italic text-slate-900 text-center mb-8">La Métamorphose</h3>
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                        <div className="grid grid-cols-3 bg-slate-900 text-white font-bold uppercase tracking-widest text-sm py-4 px-6 text-center">
                            <div className="text-slate-400">Indicateur</div>
                            <div className="text-slate-400">Avant la Cohorte</div>
                            <div className="text-orange-500">Après 15 Jours</div>
                        </div>
                        <div className="divide-y divide-slate-100 text-sm">
                            <div className="grid grid-cols-3 py-4 px-6 text-center hover:bg-slate-50 transition-colors">
                                <div className="font-bold text-slate-900 text-left md:text-center">Chiffre d'Affaires</div>
                                <div className="text-slate-500">Instable / Imprévisible</div>
                                <div className="font-bold text-green-600">Pipeline Signé ou Engagé</div>
                            </div>
                            <div className="grid grid-cols-3 py-4 px-6 text-center hover:bg-slate-50 transition-colors">
                                <div className="font-bold text-slate-900 text-left md:text-center">Leads Qualifiés</div>
                                <div className="text-slate-500">0 à 2 par mois (Hasard)</div>
                                <div className="font-bold text-green-600">5 à 10 en 15 jours (Système)</div>
                            </div>
                            <div className="grid grid-cols-3 py-4 px-6 text-center hover:bg-slate-50 transition-colors">
                                <div className="font-bold text-slate-900 text-left md:text-center">Audience</div>
                                <div className="text-slate-500">Invisible / Stagnante</div>
                                <div className="font-bold text-green-600">x10 (Effet Multiplicateur)</div>
                            </div>
                            <div className="grid grid-cols-3 py-4 px-6 text-center hover:bg-slate-50 transition-colors">
                                <div className="font-bold text-slate-900 text-left md:text-center">Mental</div>
                                <div className="text-slate-500">Doute / Isolement</div>
                                <div className="font-bold text-green-600">Confiance / Soutien Massif</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <a href="#join" className={cn(buttonVariants({ size: "lg" }), "bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-10 py-4 h-auto text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-auto inline-flex items-center justify-center")}>
                        Obtenir les mêmes résultats
                    </a>
                </div>
            </div>
        </section>

        {/* SECTION 5 & 6 — TÉMOIGNAGES & FONDATEUR */}
        <section className="py-24 bg-white" id="temoignages">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black uppercase italic text-slate-900">Sans preuve = Méfiance</h2>
                    <p className="text-slate-500 mt-4">Voici ce qui arrive quand on joue le jeu.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    {/* Témoignage 1 */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">JP</div>
                            <div>
                                <div className="font-bold text-slate-900">Jean-Pierre</div>
                                <div className="text-xs text-slate-500">Consultant RSE</div>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            <div>
                                <span className="text-[10px] font-bold text-red-500 uppercase">Difficulté</span>
                                <p className="text-xs text-slate-500">"Peur de poster, syndrome de l'imposteur."</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-blue-500 uppercase">Déclic</span>
                                <p className="text-xs text-slate-500">"Le groupe m'a forcé à publier en J3. 2000 vues."</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-green-600 uppercase">Résultat</span>
                                <p className="text-sm font-medium text-slate-900">"1er contrat à 3k€ signé en J10."</p>
                            </div>
                        </div>
                    </div>

                    {/* Témoignage 2 */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">S</div>
                            <div>
                                <div className="font-bold text-slate-900">Sarah</div>
                                <div className="text-xs text-slate-500">Graphiste</div>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            <div>
                                <span className="text-[10px] font-bold text-red-500 uppercase">Difficulté</span>
                                <p className="text-xs text-slate-500">"Je pensais ne pas avoir de réseau."</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-blue-500 uppercase">Déclic</span>
                                <p className="text-xs text-slate-500">"Mon binôme m'a connecté à son ex-boss."</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-green-600 uppercase">Résultat</span>
                                <p className="text-sm font-medium text-slate-900">"3 RDV qualifiés le lendemain."</p>
                            </div>
                        </div>
                    </div>

                    {/* Témoignage 3 */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">M</div>
                            <div>
                                <div className="font-bold text-slate-900">Marc</div>
                                <div className="text-xs text-slate-500">Coach Sportif</div>
                            </div>
                        </div>
                        <div className="space-y-3 flex-1">
                            <div>
                                <span className="text-[10px] font-bold text-red-500 uppercase">Difficulté</span>
                                <p className="text-xs text-slate-500">"Je procrastinais sur mon site web."</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-blue-500 uppercase">Déclic</span>
                                <p className="text-xs text-slate-500">"L'intensité m'a obligé à appeler direct."</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-green-600 uppercase">Résultat</span>
                                <p className="text-sm font-medium text-slate-900">"2 clients closés au téléphone."</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 6 - AUTORITÉ FONDATEUR */}
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-12 items-center relative z-10">
                        <div className="relative">
                            <div className="aspect-square rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-500">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src="/jeanphilipperoth.jpg" 
                                    alt="Jean-Philippe Roth" 
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-4 -right-4 bg-white text-slate-900 p-4 rounded-xl shadow-lg border border-slate-100 max-w-[180px]">
                                <p className="text-xs font-bold leading-tight">"L'action bat toujours la réflexion."</p>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div>
                                <Badge className="bg-orange-600 text-white border-0 mb-4 uppercase tracking-widest px-3 py-1 text-xs">Le Fondateur</Badge>
                                <h3 className="text-3xl font-black uppercase italic mb-2">Qui est derrière Popey Academy ?</h3>
                                <p className="text-slate-400 font-medium text-lg">Jean-Philippe, Entrepreneur & Mentor</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-3xl font-black text-white mb-1">10 ans</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">d'Entrepreneuriat</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white mb-1">450+</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Menttorés</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white mb-1">3</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Entreprises Créées</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white mb-1">2</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase">Exits (Reventes)</div>
                                </div>
                            </div>

                            <div className="space-y-4 text-slate-300 leading-relaxed text-sm border-t border-slate-800 pt-6">
                                <p>
                                    J'ai créé Popey Academy pour offrir ce que j'aurais rêvé avoir à mes débuts : 
                                    <strong className="text-white"> un environnement qui rend l'échec impossible.</strong>
                                </p>
                                <p>
                                    Ici, on ne vend pas de la formation vidéo que vous ne regarderez jamais. On vend du passage à l'acte.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <a href="https://wa.me/33768233347" target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg" }), "bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest px-10 py-4 h-auto text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-auto inline-flex items-center justify-center whitespace-normal text-center leading-tight")}>
                        Discuter avec Jean-Philippe sur WhatsApp
                    </a>
                </div>
            </div>
        </section>

        {/* 5. OBJECTIONS */}
        <section className="py-24 bg-slate-50 border-t border-slate-200" id="faq">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black uppercase italic text-slate-900">On neutralise vos blocages</h2>
                </div>

                <div className="space-y-4">
                    {[
                        { q: "Et si les autres ne jouent pas le jeu ?", a: "Impossible. Le système est basé sur la réciprocité obligatoire. Si tu ne donnes pas, tu ne reçois pas. Les passifs sont éliminés." },
                        { q: "Et si je n’ai pas le temps ?", a: "C'est 1h par jour. Si tu n'as pas 1h pour trouver des clients, tu n'as pas de business. C'est une question de priorité, pas de temps." },
                        { q: "Et si mon offre est trop différente ?", a: "Le mécanisme de vente est universel : Confiance -> Autorité -> Offre. Peu importe que tu vendes du pain ou du code." },
                        { q: "Et si je n’ai pas de réseau ?", a: "C'est justement pour ça que tu viens. Tu empruntes le réseau des 23 autres. Tu repars avec un réseau x24." }
                    ].map((faq, i) => (
                        <div key={i} className="bg-white p-6 rounded-lg border border-slate-200 hover:border-orange-200 transition-all">
                            <h4 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
                                <MessageCircle className="text-orange-600 h-5 w-5" /> {faq.q}
                            </h4>
                            <p className="text-slate-600 pl-7">{faq.a}</p>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <a href="#faq" className={cn(buttonVariants({ size: "lg" }), "bg-white text-slate-900 border-2 border-slate-200 hover:border-orange-500 font-black uppercase tracking-widest px-10 py-4 h-auto text-lg rounded-full shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all w-auto inline-flex items-center justify-center")}>
                        Je lève mes doutes maintenant
                    </a>
                </div>
            </div>
        </section>

        {/* SECTION 6 — DETTE DE SERVICE */}
        <section className="py-24 bg-slate-50 border-t border-slate-200" id="dette">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="border-slate-300 text-slate-500 uppercase tracking-widest mb-4">La Règle d'Or</Badge>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic text-slate-900">
                        Le Secret : Un Équipage pour l'année.<br/>
                        <span className="text-orange-600">L'entraide n'est pas une option.</span>
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
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-2xl"></div>
                        <h3 className="font-bold text-orange-500 uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
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
                        <span className="font-black text-orange-600">C’est une économie d’entraide organisée.</span>
                    </p>
                </div>

                <div className="text-center mt-12">
                    <a href="#join" className={cn(buttonVariants({ size: "lg" }), "bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-10 py-4 h-auto text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all w-auto inline-flex items-center justify-center whitespace-normal text-center leading-tight")}>
                        Je rejoins l'économie d'entraide
                    </a>
                </div>
            </div>
        </section>

        {/* 7. CTA FINAL */}
        <section id="join" className="py-32 bg-slate-900 relative overflow-hidden text-white">
             <div className="absolute top-0 w-full text-blue-950 rotate-180 z-10 pointer-events-none">
                <Wave />
             </div>
             
             <div className="container mx-auto px-4 max-w-xl text-center relative z-20 pt-20">
                <FloatingIcon duration={4}>
                    <LifeBuoy className="h-20 w-20 text-orange-500 mx-auto mb-8" />
                </FloatingIcon>
                
                <h2 className="text-5xl font-black uppercase italic mb-8 text-white">
                    Votre Place est<br/>dans l'Équipage.
                </h2>

                <div className="text-center mb-8">
                    <div className="inline-block bg-white text-slate-900 px-6 py-2 font-black text-3xl md:text-5xl -skew-x-12 mb-4">
                        199€ TTC
                    </div>
                    <div className="flex flex-col gap-2 text-slate-400 font-bold uppercase tracking-widest text-sm">
                        <span>Prochaine Session : 10 Mars</span>
                        <span>24 Places Uniquement</span>
                    </div>
                </div>
                
                <div className="bg-slate-800 p-1 rounded-2xl border-2 border-orange-500/50 shadow-[0px_0px_50px_rgba(249,115,22,0.2)]">
                    <div className="bg-slate-950 p-6 rounded-xl">
                        <PreRegistrationForm programType="entrepreneur" />
                    </div>
                </div>
                
                <p className="mt-8 text-slate-500 text-xs">
                    En cliquant, vous postulez pour rejoindre la cohorte. Un entretien de validation peut être requis.
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
                        <li><Link href="/" className="hover:text-orange-600">Lancer son activité</Link></li>
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
      <StickyRecruitmentBanner forceVisible={true} />
    </div>
  );
}
