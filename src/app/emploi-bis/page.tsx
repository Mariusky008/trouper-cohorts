"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Anchor, ArrowRight, Brain, CalendarClock, CheckCircle2, Heart, HelpCircle, LifeBuoy, Lightbulb, Map, Megaphone, MessageCircle, Rocket, ShieldCheck, Target, UserCheck, Users, XCircle } from "lucide-react";
import { PreRegistrationForm } from "@/components/pre-registration-form";
import { motion } from "framer-motion";
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

export default function EmploiBisPage() {
  const targetRef = useRef(null);
  
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
             <span className="text-sm font-bold text-orange-400 uppercase tracking-widest animate-pulse">● Inscriptions Ouvertes</span>
          </div>
          <div className="flex items-center gap-2">
            <Link 
                href="#join" 
                className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider -skew-x-12 h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm transition-colors relative z-50"
            >
                <span className="skew-x-12">Postuler</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO / ACCROCHE */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900 via-slate-900 to-slate-950 z-0" />
          
          <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
            <FadeIn>
                <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-full px-4 py-1.5 text-sm text-blue-300 font-bold mb-6">
                    <Rocket className="h-4 w-4" />
                    <span>Programme Transformation • 5 Semaines Total</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.95] mb-8">
                  Et si en 3 semaines<br />
                  tu trouvais enfin<br />
                  <span className="text-orange-500">le métier qui te<br/>correspond vraiment ?</span>
                </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="text-xl md:text-2xl text-blue-100 font-medium leading-relaxed max-w-3xl mx-auto space-y-2">
                    <p>Pas un job par défaut. Pas une option choisie par peur.</p>
                    <p className="font-black text-white text-3xl uppercase italic mt-4">Ton VRAI métier.</p>
                </div>
            </FadeIn>

            <FadeIn delay={0.4}>
                <div className="pt-8">
                    <Button size="lg" className="h-16 px-10 bg-white text-slate-900 hover:bg-slate-200 font-black text-lg md:text-xl uppercase tracking-widest rounded-full shadow-[0px_0px_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all" asChild>
                        <Link href="#join">
                           Je veux trouver ma voie
                        </Link>
                    </Button>
                    <p className="mt-4 text-slate-400 text-sm font-medium uppercase tracking-widest">
                        Gratuit & Financé • Compatible France Travail
                    </p>
                </div>
            </FadeIn>
          </div>

          <div className="absolute bottom-0 w-full text-slate-950 z-20 pointer-events-none">
             <Wave />
          </div>
        </section>

        {/* 2. STORYTELLING & TRANSITION */}
        <section className="py-24 bg-slate-950 relative z-20">
            <div className="container mx-auto px-4 max-w-5xl">
                
                {/* PARTIE 1 : LA QUÊTE (3 SEMAINES) */}
                <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
                    <div className="space-y-8">
                        <FadeIn>
                            <Badge className="bg-blue-600 text-white border-0 mb-4 uppercase tracking-widest">Phase 1 • 3 Semaines</Badge>
                            <h2 className="text-4xl font-black uppercase italic text-white leading-tight">
                                De l'Errance à la <span className="text-blue-400">Vocation</span>
                            </h2>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                Finis l'isolement et les bilans de compétences poussiéreux. 
                                Tu vas suivre un parcours intensif pour identifier ta zone de génie.
                            </p>
                            <ul className="space-y-4 mt-6">
                                <li className="flex items-center gap-3 text-white font-bold">
                                    <CheckCircle2 className="text-blue-500 h-6 w-6 shrink-0" />
                                    Identifier une vocation réelle
                                </li>
                                <li className="flex items-center gap-3 text-white font-bold">
                                    <CheckCircle2 className="text-blue-500 h-6 w-6 shrink-0" />
                                    Positionnement clair & unique
                                </li>
                                <li className="flex items-center gap-3 text-white font-bold">
                                    <CheckCircle2 className="text-blue-500 h-6 w-6 shrink-0" />
                                    Plan d'action prêt à lancer
                                </li>
                            </ul>
                        </FadeIn>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-3xl rounded-full"></div>
                        <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
                            <Map className="text-blue-500" /> Le Parcours
                        </h3>
                        <div className="space-y-6 relative">
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-800"></div>
                            {[
                                { title: "Semaine 1 : Clarté", desc: "Exploration, introspection, carte des forces." },
                                { title: "Semaine 2 : Validation", desc: "Confrontation au marché, définition de la cible." },
                                { title: "Semaine 3 : Lancement", desc: "Plan d'action, outils, préparation au sprint." }
                            ].map((step, i) => (
                                <div key={i} className="relative flex gap-4">
                                    <div className="h-6 w-6 rounded-full bg-slate-900 border-2 border-blue-500 z-10 shrink-0"></div>
                                    <div>
                                        <h4 className="font-bold text-white text-lg">{step.title}</h4>
                                        <p className="text-slate-400 text-sm">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* PONT VERS LA SUITE */}
                <div className="text-center py-12">
                    <ArrowRight className="h-12 w-12 text-slate-700 mx-auto rotate-90 md:rotate-0" />
                </div>

                {/* PARTIE 2 : LE SPRINT (15 JOURS) */}
                <div className="bg-gradient-to-br from-orange-900/20 to-slate-900 rounded-3xl p-8 md:p-12 border border-orange-500/30 shadow-2xl relative overflow-hidden mt-12">
                    <div className="absolute top-0 right-0 bg-orange-600 text-white px-6 py-2 font-black uppercase tracking-widest text-sm rounded-bl-xl">Phase 2 • Le Sprint</div>
                    
                    <div className="text-center mb-12">
                        <h3 className="text-3xl md:text-4xl font-black uppercase italic text-white mb-4">
                            Ensuite, <span className="text-orange-500">15 jours commandos</span><br/>avec 23 alliés.
                        </h3>
                        <p className="text-orange-100 text-lg max-w-2xl mx-auto">
                            Une seule obsession : terminer cette quinzaine avec plus de clients ou d'opportunités qu'au départ.
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {[
                            { val: "24", label: "Réseaux Activés", icon: Users },
                            { val: "24", label: "Offres Présentées", icon: Target },
                            { val: "24", label: "Cercles de Reco.", icon: Heart },
                            { val: "∞", label: "Visibilité Croisée", icon: Megaphone }
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-950/50 p-4 rounded-xl text-center border border-orange-500/20">
                                <stat.icon className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                                <div className="text-3xl font-black text-white">{stat.val}</div>
                                <div className="text-xs uppercase text-slate-400 font-bold">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-950/80 p-6 rounded-xl border border-slate-800 text-center max-w-2xl mx-auto">
                        <h4 className="font-bold text-white text-lg mb-2 uppercase">Résultat en sortie</h4>
                        <p className="text-slate-300">
                            Contenu publié • Prospection réalisée • RDV obtenus • Peur du rejet dépassée.
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-800 font-black text-orange-400 uppercase italic">
                            Tu n’es plus sans emploi — tu es entrepreneur en action.
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <Button className="bg-white text-orange-900 hover:bg-orange-50 font-black uppercase tracking-widest px-8 h-14 text-lg" asChild>
                            <Link href="#join">Trouve ton métier & Lance-toi</Link>
                        </Button>
                    </div>
                </div>

            </div>
        </section>

        {/* 3. À QUI C'EST FAIT POUR */}
        <section className="py-24 bg-slate-900">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-green-900/10 p-8 rounded-xl border border-green-500/20">
                        <h3 className="text-2xl font-black text-green-500 uppercase mb-6 flex items-center gap-2">
                            <CheckCircle2 /> Pour toi si...
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-300">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                Tu veux vraiment changer de vie pro, pas juste "chercher un job".
                            </li>
                            <li className="flex items-start gap-3 text-slate-300">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                Tu acceptes d'agir concrètement chaque jour.
                            </li>
                            <li className="flex items-start gap-3 text-slate-300">
                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                Tu es prêt à jouer collectif et aider les autres.
                            </li>
                        </ul>
                    </div>

                    <div className="bg-red-900/10 p-8 rounded-xl border border-red-500/20">
                        <h3 className="text-2xl font-black text-red-500 uppercase mb-6 flex items-center gap-2">
                            <XCircle /> Pas pour toi si...
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-300">
                                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                Tu veux juste consommer du contenu passif (Netflix style).
                            </li>
                            <li className="flex items-start gap-3 text-slate-300">
                                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                Tu attends que Pôle Emploi trouve pour toi.
                            </li>
                            <li className="flex items-start gap-3 text-slate-300">
                                <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                Tu refuses de sortir de ta zone de confort.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        {/* 4. GESTION DE LA PEUR */}
        <section className="py-24 bg-slate-950 border-y border-slate-900">
            <div className="container mx-auto px-4 max-w-3xl text-center">
                <Badge variant="outline" className="border-slate-700 text-slate-400 uppercase mb-6">Zone de Sécurité</Badge>
                <h2 className="text-3xl font-black uppercase italic text-white mb-12">Et si j'ai peur ?</h2>
                
                <div className="grid sm:grid-cols-2 gap-6 text-left">
                    {[
                        { q: "Je n’ai jamais entrepris...", a: "Tant mieux. Tu n'as pas de mauvaises habitudes. On te donne la structure pas à pas." },
                        { q: "Je n’ai pas confiance en moi...", a: "La confiance vient après l'action. Le groupe te portera quand tu douteras." },
                        { q: "Je ne sais pas vendre...", a: "On ne te demande pas de vendre, mais de proposer des solutions. On te donne les scripts." },
                        { q: "Je n’ai pas de réseau...", a: "Tu repars avec un réseau de 23 entrepreneurs actifs dès le premier jour." }
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-900 p-6 rounded-lg border border-slate-800 hover:border-blue-500/30 transition-colors">
                            <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-blue-500" /> {item.q}
                            </h4>
                            <p className="text-slate-400 text-sm">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* 5. PREUVE */}
        <section className="py-24 bg-slate-900">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black uppercase italic text-white">Ils ont sauté le pas</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Témoignage 1 */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-slate-400">L</div>
                            <div>
                                <div className="font-bold text-white">Lucie</div>
                                <div className="text-xs text-slate-400">Ex-Assistante RH</div>
                            </div>
                        </div>
                        <p className="text-slate-300 italic text-sm mb-4">"Je pensais ne savoir rien faire d'autre. En 3 semaines, j'ai réalisé que je pouvais être Consultante en Organisation. J'ai mon premier client."</p>
                        <Badge className="bg-blue-500/20 text-blue-300 border-0 text-xs">Reconversion Réussie</Badge>
                    </div>

                    {/* Témoignage 2 */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-slate-400">T</div>
                            <div>
                                <div className="font-bold text-white">Thomas</div>
                                <div className="text-xs text-slate-400">Au chômage depuis 1 an</div>
                            </div>
                        </div>
                        <p className="text-slate-300 italic text-sm mb-4">"L'isolement me tuait. Retrouver un groupe de 24 personnes qui avancent, ça m'a redonné vie. J'ai lancé mon offre de coaching sportif."</p>
                        <Badge className="bg-orange-500/20 text-orange-300 border-0 text-xs">Fin de l'isolement</Badge>
                    </div>

                    {/* Témoignage 3 */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-slate-400">A</div>
                            <div>
                                <div className="font-bold text-white">Amel</div>
                                <div className="text-xs text-slate-400">En réflexion</div>
                            </div>
                        </div>
                        <p className="text-slate-300 italic text-sm mb-4">"Le format 3 semaines + 15 jours est parfait. On prend le temps de trouver, puis on accélère fort. Je ne me suis jamais sentie perdue."</p>
                        <Badge className="bg-purple-500/20 text-purple-300 border-0 text-xs">Structure & Clarté</Badge>
                    </div>
                </div>
            </div>
        </section>

        {/* 6. CTA FINAL */}
        <section id="join" className="py-32 bg-slate-950 relative overflow-hidden">
             <div className="absolute top-0 w-full text-blue-950 rotate-180 z-10 pointer-events-none">
                <Wave />
             </div>
             
             <div className="container mx-auto px-4 max-w-xl text-center relative z-20 pt-20">
                <FloatingIcon duration={4}>
                    <LifeBuoy className="h-20 w-20 text-blue-500 mx-auto mb-8" />
                </FloatingIcon>
                
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-8 text-white">
                    Trouve ton métier.<br/>Lance-toi.<br/>
                    <span className="text-orange-500">Obtiens tes premiers clients.</span>
                </h2>

                <div className="text-center mb-8">
                    <div className="inline-block bg-white text-slate-900 px-6 py-2 font-black text-2xl md:text-3xl -skew-x-12 mb-4">
                        GRATUIT & FINANCÉ
                    </div>
                    <div className="flex flex-col gap-2 text-slate-400 font-bold uppercase tracking-widest text-sm">
                        <span>Session limitée à 24 personnes</span>
                        <span>Entretien préalable obligatoire</span>
                    </div>
                </div>
                
                <div className="bg-slate-900 p-1 rounded-2xl border-2 border-blue-500/50 shadow-[0px_0px_50px_rgba(59,130,246,0.2)]">
                    <div className="bg-slate-950 p-6 rounded-xl">
                        <PreRegistrationForm />
                    </div>
                </div>
                
                <p className="mt-8 text-slate-500 text-xs">
                    En cliquant, vous postulez pour rejoindre la cohorte pilote. Les places sont attribuées après entretien.
                </p>
             </div>
        </section>

      </main>
      
      <footer className="bg-slate-950 py-12 text-center border-t border-slate-800">
        <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
            <Anchor className="h-6 w-6 text-white" />
            <span className="font-black uppercase text-white">Popey Academy</span>
        </div>
        <p className="text-slate-600 text-sm">© 2026. Force & Honneur.</p>
      </footer>
    </div>
  );
}
