"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Anchor, CalendarClock, CheckCircle2, Clock, LayoutList, LifeBuoy, Megaphone, ShieldCheck, Ship, Users, Video, Target, ArrowRight, Zap, MessageCircle } from "lucide-react";
import { PreRegistrationForm } from "@/components/pre-registration-form";
import { motion, useScroll } from "framer-motion";
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
  
  return (
    <div ref={targetRef} className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-orange-500 overflow-x-hidden">
      
      {/* Header - Fixed Navigation */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 text-orange-500">
                <Anchor className="h-full w-full" strokeWidth={2.5} />
             </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic">Popey Academy</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
             <span className="text-sm font-bold text-orange-400 uppercase tracking-widest animate-pulse">● Session Mars : Ouverte</span>
          </div>
          <div className="flex items-center gap-2">
            <Link 
                href="#join" 
                className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider -skew-x-12 h-10 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm transition-colors relative z-50"
            >
                <span className="skew-x-12">Rejoindre</span>
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
                <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-full px-4 py-1.5 text-sm text-orange-400 font-bold mb-6">
                    <Users className="h-4 w-4" />
                    <span>24 Places Maximum</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.95] mb-8">
                  Et si on se mettait à<br />
                  <span className="text-orange-500">24 entrepreneurs</span><br />
                  pour faire exploser<br />
                  notre chiffre d’affaires ?
                </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
                <div className="text-xl md:text-3xl text-blue-100 font-black uppercase tracking-tight space-y-2">
                    <p>24 personnes.</p>
                    <p>15 jours.</p>
                    <p className="text-orange-400">Une seule obsession : terminer avec plus de clients qu’au départ.</p>
                </div>
            </FadeIn>

            <FadeIn delay={0.4}>
                <div className="pt-8">
                    <Button size="lg" className="h-16 px-10 bg-white text-slate-900 hover:bg-slate-200 font-black text-lg md:text-xl uppercase tracking-widest rounded-full shadow-[0px_0px_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all" asChild>
                        <Link href="#join">
                           Commence Aujourd'hui
                        </Link>
                    </Button>
                    <p className="mt-4 text-slate-400 text-sm font-medium uppercase tracking-widest">
                        Tu ne seras plus jamais invisible dans ton marché.
                    </p>
                </div>
            </FadeIn>
          </div>

          <div className="absolute bottom-0 w-full text-slate-950 z-20 pointer-events-none">
             <Wave />
          </div>
        </section>

        {/* 2. STORYTELLING & BÉNÉFICES */}
        <section className="py-24 bg-slate-950 relative z-20">
            <div className="container mx-auto px-4 max-w-5xl">
                
                <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
                    <div className="space-y-8">
                        <FadeIn>
                            <h2 className="text-4xl font-black uppercase italic text-white leading-tight">
                                Pas de théorie inutile.<br/>
                                <span className="text-slate-500">Pas d'excuses.</span>
                            </h2>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <p className="text-lg text-slate-300 leading-relaxed">
                                L'entrepreneuriat solitaire est un piège. Vous avez les compétences, mais personne ne vous voit.
                                Ici, nous créons un <strong>cadre intensif</strong> avec des actions concrètes.
                            </p>
                            <ul className="space-y-4 mt-6">
                                {[
                                    "Co-promotion quotidienne",
                                    "Recommandations croisées",
                                    "Feedback immédiat sur vos offres",
                                    "Pression positive du groupe"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white font-bold">
                                        <CheckCircle2 className="text-orange-500 h-6 w-6 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </FadeIn>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full" />
                        <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-2xl space-y-6">
                            <h3 className="text-2xl font-black uppercase text-white mb-6 text-center">L'Effet Levier x24</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                                    <div className="text-3xl font-black text-orange-500 mb-1">24</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold">Réseaux Activés</div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                                    <div className="text-3xl font-black text-blue-400 mb-1">24</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold">Offres Présentées</div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                                    <div className="text-3xl font-black text-green-400 mb-1">24</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold">Cercles de Reco.</div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800">
                                    <div className="text-3xl font-black text-purple-400 mb-1">∞</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold">Visibilité Croisée</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transformation Promise */}
                <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-3xl p-8 md:p-12 border border-blue-800/50 shadow-2xl">
                    <div className="text-center mb-10">
                        <h3 className="text-3xl font-black uppercase italic text-white mb-4">La Transformation J15</h3>
                        <p className="text-blue-200">Ce que vous aurez accompli dans 15 jours.</p>
                    </div>
                    
                    <div className="grid md:grid-cols-5 gap-4">
                        {[
                            { icon: Megaphone, label: "Publications Actives" },
                            { icon: Target, label: "Prospection Réalisée" },
                            { icon: CalendarClock, label: "RDV Obtenus" },
                            { icon: ShieldCheck, label: "Peur du NON dépassée" },
                            { icon: Users, label: "Clients en approche" }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 text-center">
                                <div className="h-12 w-12 rounded-full bg-blue-950 border border-blue-700 flex items-center justify-center text-orange-400">
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <span className="text-white font-bold text-sm uppercase leading-tight">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Button className="bg-white text-blue-900 hover:bg-blue-50 font-black uppercase tracking-widest px-8" asChild>
                            <Link href="#join">Je veux ces résultats</Link>
                        </Button>
                        <div className="mt-4 flex flex-col md:flex-row justify-center gap-4 text-xs font-mono text-blue-300 uppercase">
                            <span>Prochaine session : 10 Mars</span>
                            <span className="hidden md:inline">•</span>
                            <span>24 Places max</span>
                            <span className="hidden md:inline">•</span>
                            <span>Sur Sélection</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>

        {/* LA PUISSANCE DE L'ARMADA */}
        <section className="py-24 bg-slate-900 border-t border-slate-800">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <Badge className="bg-orange-600 text-white border-0 mb-4 uppercase tracking-widest">Le Collectif</Badge>
                    <h2 className="text-4xl font-black uppercase italic text-white mb-6">La puissance de l'Armada (x24)</h2>
                    <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                        Vous n'êtes plus seule. Vous faites partie d'une équipe de 24 pros qui avancent au même rythme. 
                        Chaque membre devient un relais de votre visibilité.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-orange-500 transition-colors">
                        <LifeBuoy className="h-10 w-10 text-orange-500 mb-6" />
                        <h3 className="text-xl font-black text-white uppercase mb-4">Soutien Quotidien</h3>
                        <p className="text-slate-400">On partage ses victoires, on débloque ses peurs. L'énergie du groupe vous porte quand la motivation baisse.</p>
                    </div>
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-orange-500 transition-colors">
                        <Megaphone className="h-10 w-10 text-blue-500 mb-6" />
                        <h3 className="text-xl font-black text-white uppercase mb-4">Visibilité Croisée</h3>
                        <p className="text-slate-400">Intervenez dans les lives des autres. Faites-vous connaître de leur audience. Multipliez votre portée.</p>
                    </div>
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-orange-500 transition-colors">
                        <Users className="h-10 w-10 text-green-500 mb-6" />
                        <h3 className="text-xl font-black text-white uppercase mb-4">Recommandations</h3>
                        <p className="text-slate-400">Vos coéquipières vous connaissent et vous recommandent naturellement à leur propre réseau.</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-900/40 to-slate-900 p-8 md:p-12 rounded-3xl border border-orange-500/30 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-2xl md:text-3xl font-black uppercase italic text-white mb-4">Garantie Totale : Résultat ou Nouveau Départ</h3>
                        <p className="text-lg text-orange-100 max-w-2xl mx-auto mb-8">
                            Si à la fin des 15 jours, vous n'avez pas obtenu au moins 1 client ou plusieurs RDV qualifiés, 
                            nous vous replaçons gratuitement dans la prochaine expédition.
                        </p>
                        <div className="inline-block bg-orange-600/20 text-orange-400 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm border border-orange-500/50">
                            Zéro risque. Que de l'action.
                        </div>
                        <div className="mt-8">
                            <Button className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-8 h-12" asChild>
                                <Link href="#join">Réserver ma place dans l'Armada</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* RYTHME & STRUCTURE */}
        <section className="py-24 bg-slate-950">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="grid md:grid-cols-2 gap-16 items-start">
                    <div className="space-y-12">
                        <div>
                            <Badge variant="outline" className="border-blue-500 text-blue-400 uppercase mb-4">Méthode</Badge>
                            <h2 className="text-4xl font-black uppercase italic text-white mb-6">Rythme & Structure</h2>
                            <h3 className="text-2xl font-bold text-white mb-4">Chaque jour, un Cap Précis.</h3>
                            <div className="flex items-center gap-3 text-green-400 font-bold bg-green-900/20 p-4 rounded-lg border border-green-900/50">
                                <CheckCircle2 className="h-6 w-6" />
                                <span>Charge Mentale Zéro : On vous dit quoi faire, vous le faites, ça marche.</span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex gap-6">
                                <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center font-black text-xl text-white border border-slate-700 shrink-0">1</div>
                                <div>
                                    <h4 className="text-xl font-bold text-white uppercase mb-2">Programme Clair</h4>
                                    <p className="text-slate-400">Chaque matin, découvrez vos actions du jour : vidéo courte, post structuré, interaction locale.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center font-black text-xl text-white border border-slate-700 shrink-0">2</div>
                                <div>
                                    <h4 className="text-xl font-bold text-white uppercase mb-2">Interventions Croisées</h4>
                                    <p className="text-slate-400">Réalisez des Lives et des vidéos en duo/trio avec les autres membres. Multipliez votre audience par 2 ou 3.</p>
                                </div>
                            </div>
                            <div className="flex gap-6">
                                <div className="h-12 w-12 bg-slate-800 rounded-full flex items-center justify-center font-black text-xl text-white border border-slate-700 shrink-0">3</div>
                                <div>
                                    <h4 className="text-xl font-bold text-white uppercase mb-2">Actions Concrètes</h4>
                                    <p className="text-slate-400">Pas de théorie. Vous contactez, vous publiez, vous invitez. Tout est fait pour générer des RDV.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-bl-xl uppercase tracking-widest">Exemple J4</div>
                        <h3 className="text-2xl font-black uppercase italic text-white mb-8">Votre Journée Type</h3>
                        
                        <div className="space-y-0 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-800"></div>

                            {[
                                { time: "09h00", title: "Briefing & Mission du jour", icon: Target },
                                { time: "10h30", title: "Tournage Vidéo Duo (30min)", icon: Video },
                                { time: "14h00", title: "10 interactions locales ciblées", icon: Users },
                                { time: "18h00", title: "Atelier Live de perfectionnement", icon: Zap }
                            ].map((slot, i) => (
                                <div key={i} className="flex gap-6 relative py-4">
                                    <div className="h-14 w-14 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center shrink-0 z-10 text-xs font-bold text-slate-400">
                                        <slot.icon className="h-4 w-4 mb-1 text-blue-500" />
                                        {slot.time.split('h')[0]}h
                                    </div>
                                    <div className="pt-2">
                                        <div className="text-sm font-bold text-blue-400 mb-1">{slot.time}</div>
                                        <div className="font-bold text-white text-lg">{slot.title}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                             <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800 uppercase tracking-widest text-xs font-bold" asChild>
                                <Link href="#join">Voir mon futur quotidien <ArrowRight className="ml-2 h-4 w-4" /></Link>
                             </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 3. CONCRÈTEMENT : COMMENT ÇA MARCHE */}
        <section className="py-24 bg-slate-900">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="border-slate-600 text-slate-400 uppercase mb-4">Mode d'Emploi</Badge>
                    <h2 className="text-4xl font-black uppercase italic text-white">Concrètement, comment ça marche ?</h2>
                    <p className="text-slate-400 mt-4 text-lg">Un entrepreneur établi veut du concret. Sinon il part.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                        <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
                            <LayoutList className="text-orange-500" /> Le Format
                        </h3>
                        <ul className="space-y-4 text-slate-300">
                            <li className="flex items-start gap-3">
                                <span className="bg-slate-700 rounded px-2 py-0.5 text-xs font-bold text-white mt-1">QUOTIDIEN</span>
                                <div>1h d'action intensive par jour (Sprint).</div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-slate-700 rounded px-2 py-0.5 text-xs font-bold text-white mt-1">VISIO</span>
                                <div>Briefing le matin, Débriefing le soir.</div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-slate-700 rounded px-2 py-0.5 text-xs font-bold text-white mt-1">OUTILS</span>
                                <div>WhatsApp (Réactivité) + Notion (Ressources) + LinkedIn (Terrain).</div>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700">
                        <h3 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-2">
                            <CheckCircle2 className="text-green-500" /> Ce qui est inclus
                        </h3>
                        <ul className="space-y-3 text-slate-300">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" /> Accès au groupe privé (Le Pod)
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" /> Scripts de vente & Templates
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" /> Binôme rotatif (Networking)
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" /> Coaching IA 24/7
                            </li>
                        </ul>
                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Ce qui n'est PAS inclus</h4>
                            <p className="text-slate-400 text-sm">Des excuses. De la théorie académique. Des diplômes en papier.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 4. PREUVE SOCIALE */}
        <section className="py-24 bg-slate-950 border-y border-slate-900">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black uppercase italic text-white">Sans preuve = Méfiance</h2>
                    <p className="text-slate-400 mt-4">Voici ce qui arrive quand on joue le jeu.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Témoignage 1 */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-500">JP</div>
                            <div>
                                <div className="font-bold text-white">Jean-Pierre</div>
                                <div className="text-xs text-slate-400">Consultant RSE</div>
                            </div>
                        </div>
                        <p className="text-slate-300 italic text-sm mb-4">"J'avais peur de poster. En J3, j'ai fait 2000 vues grâce au groupe. En J10, j'ai signé mon premier contrat à 3k€."</p>
                        <div className="flex gap-2">
                            <Badge className="bg-green-900/30 text-green-400 border-0 text-xs">+3000€ CA</Badge>
                        </div>
                    </div>

                    {/* Témoignage 2 */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-500">S</div>
                            <div>
                                <div className="font-bold text-white">Sarah</div>
                                <div className="text-xs text-slate-400">Graphiste</div>
                            </div>
                        </div>
                        <p className="text-slate-300 italic text-sm mb-4">"Je pensais que je n'avais pas de réseau. Mon binôme du J5 m'a mis en relation avec son ancien boss. RDV pris le lendemain."</p>
                        <div className="flex gap-2">
                            <Badge className="bg-blue-900/30 text-blue-400 border-0 text-xs">3 RDV Qualifiés</Badge>
                        </div>
                    </div>

                    {/* Témoignage 3 */}
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-500">M</div>
                            <div>
                                <div className="font-bold text-white">Marc</div>
                                <div className="text-xs text-slate-400">Coach Sportif</div>
                            </div>
                        </div>
                        <p className="text-slate-300 italic text-sm mb-4">"L'intensité m'a forcé à bouger. J'ai arrêté de peaufiner mon site et j'ai commencé à appeler. Résultat immédiat."</p>
                        <div className="flex gap-2">
                            <Badge className="bg-orange-900/30 text-orange-400 border-0 text-xs">Action Massive</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 5. OBJECTIONS */}
        <section className="py-24 bg-slate-900">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black uppercase italic text-white">On neutralise vos blocages</h2>
                </div>

                <div className="space-y-4">
                    {[
                        { q: "Et si les autres ne jouent pas le jeu ?", a: "Impossible. Le système est basé sur la réciprocité obligatoire. Si tu ne donnes pas, tu ne reçois pas. Les passifs sont éliminés." },
                        { q: "Et si je n’ai pas le temps ?", a: "C'est 1h par jour. Si tu n'as pas 1h pour trouver des clients, tu n'as pas de business. C'est une question de priorité, pas de temps." },
                        { q: "Et si mon offre est trop différente ?", a: "Le mécanisme de vente est universel : Confiance -> Autorité -> Offre. Peu importe que tu vendes du pain ou du code." },
                        { q: "Et si je n’ai pas de réseau ?", a: "C'est justement pour ça que tu viens. Tu empruntes le réseau des 23 autres. Tu repars avec un réseau x24." }
                    ].map((faq, i) => (
                        <div key={i} className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h4 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
                                <MessageCircle className="text-orange-500 h-5 w-5" /> {faq.q}
                            </h4>
                            <p className="text-slate-400 pl-7">{faq.a}</p>
                        </div>
                    ))}
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
                
                <div className="bg-slate-900 p-1 rounded-2xl border-2 border-orange-500/50 shadow-[0px_0px_50px_rgba(249,115,22,0.2)]">
                    <div className="bg-slate-950 p-6 rounded-xl">
                        <PreRegistrationForm />
                    </div>
                </div>
                
                <p className="mt-8 text-slate-500 text-xs">
                    En cliquant, vous postulez pour rejoindre la cohorte. Un entretien de validation peut être requis.
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
