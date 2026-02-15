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
            <Link 
                href="#join" 
                className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-wider h-10 px-6 inline-flex items-center justify-center rounded-full text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
                Rejoindre
            </Link>
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
                <div className="pt-8">
                    <Button size="lg" className="h-16 px-10 bg-orange-600 hover:bg-orange-500 text-white font-black text-lg md:text-xl uppercase tracking-widest rounded-full shadow-xl shadow-orange-200 hover:shadow-2xl hover:-translate-y-1 transition-all" asChild>
                        <Link href="#join">
                           Je rejoins la prochaine cohorte
                        </Link>
                    </Button>
                    <p className="mt-4 text-slate-500 text-sm font-medium uppercase tracking-widest">
                        Tu ne seras plus jamais invisible dans ton marché.
                    </p>
                </div>
            </FadeIn>
          </div>

          <div className="absolute bottom-0 w-full text-white z-20 pointer-events-none">
             <Wave />
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
                        
                        <div className="flex flex-col items-center gap-6">
                            <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-black uppercase tracking-widest px-10 h-16 text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-full" asChild>
                                <Link href="#join">Réserver ma place dans l'Armada</Link>
                            </Button>
                            <p className="text-orange-200 text-sm font-bold uppercase tracking-widest">
                                Prochaine session limitée à 24 participants
                            </p>
                        </div>
                     </div>
                </div>

            </div>
        </section>

        {/* RYTHME & STRUCTURE */}
        <section className="py-24 bg-white">
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
                             <Button variant="ghost" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 uppercase tracking-widest text-xs font-bold" asChild>
                                <Link href="#join">Voir mon futur quotidien <ArrowRight className="ml-2 h-4 w-4" /></Link>
                             </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 3. CONCRÈTEMENT : COMMENT ÇA MARCHE */}
        <section className="py-24 bg-slate-50 border-t border-slate-200">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <Badge variant="outline" className="border-slate-300 text-slate-500 uppercase mb-4">Mode d'Emploi</Badge>
                    <h2 className="text-4xl font-black uppercase italic text-slate-900">Concrètement, comment ça marche ?</h2>
                    <p className="text-slate-500 mt-4 text-lg">Un entrepreneur établi veut du concret. Sinon il part.</p>
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
            </div>
        </section>

        {/* 4. PREUVE SOCIALE */}
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black uppercase italic text-slate-900">Sans preuve = Méfiance</h2>
                    <p className="text-slate-500 mt-4">Voici ce qui arrive quand on joue le jeu.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Témoignage 1 */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">JP</div>
                            <div>
                                <div className="font-bold text-slate-900">Jean-Pierre</div>
                                <div className="text-xs text-slate-500">Consultant RSE</div>
                            </div>
                        </div>
                        <p className="text-slate-600 italic text-sm mb-4">"J'avais peur de poster. En J3, j'ai fait 2000 vues grâce au groupe. En J10, j'ai signé mon premier contrat à 3k€."</p>
                        <div className="flex gap-2">
                            <Badge className="bg-green-100 text-green-700 border-0 text-xs">+3000€ CA</Badge>
                        </div>
                    </div>

                    {/* Témoignage 2 */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">S</div>
                            <div>
                                <div className="font-bold text-slate-900">Sarah</div>
                                <div className="text-xs text-slate-500">Graphiste</div>
                            </div>
                        </div>
                        <p className="text-slate-600 italic text-sm mb-4">"Je pensais que je n'avais pas de réseau. Mon binôme du J5 m'a mis en relation avec son ancien boss. RDV pris le lendemain."</p>
                        <div className="flex gap-2">
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">3 RDV Qualifiés</Badge>
                        </div>
                    </div>

                    {/* Témoignage 3 */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-400">M</div>
                            <div>
                                <div className="font-bold text-slate-900">Marc</div>
                                <div className="text-xs text-slate-500">Coach Sportif</div>
                            </div>
                        </div>
                        <p className="text-slate-600 italic text-sm mb-4">"L'intensité m'a forcé à bouger. J'ai arrêté de peaufiner mon site et j'ai commencé à appeler. Résultat immédiat."</p>
                        <div className="flex gap-2">
                            <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">Action Massive</Badge>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 5. OBJECTIONS */}
        <section className="py-24 bg-slate-50 border-t border-slate-200">
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
            </div>
        </section>

        {/* 6. CTA FINAL */}
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
                        <PreRegistrationForm />
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
