import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckSquare, Crosshair, FileText, Lock, ShieldAlert, Target, UserX, Users } from "lucide-react";
import { PreRegistrationForm } from "@/components/pre-registration-form";

export default function LandingV3() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-50 font-mono selection:bg-orange-500/30">
      {/* Top Bar "Classified" */}
      <div className="bg-orange-600 text-stone-950 text-xs font-bold uppercase tracking-widest text-center py-1">
        /// TRANSMISSION PRIORITAIRE /// ACCÈS RESTREINT ///
      </div>

      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-950 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 text-stone-50">
                <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="512" height="512" rx="0" fill="currentColor" />
                    <path d="M277.333 234.667V149.333L170.667 298.667H234.667V384L341.333 234.667H277.333Z" fill="#0c0a09"/>
                </svg>
             </div>
            <span className="font-bold text-lg tracking-tight uppercase">Popey Academy</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-stone-400 hover:text-white hover:bg-stone-900 hidden sm:inline-flex uppercase text-xs tracking-widest" asChild>
              <Link href="/login">Identification</Link>
            </Button>
            <Button className="bg-stone-50 text-stone-950 hover:bg-stone-200 font-bold uppercase text-xs tracking-widest rounded-none" asChild>
              <Link href="#join">S'enrôler</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* 1. Hero Section */}
        <section className="relative py-20 px-4 border-b border-stone-800">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-2 py-1 border border-orange-500/50 text-orange-500 text-xs font-bold uppercase tracking-widest">
                        <span className="animate-pulse">●</span> Statut : Recrutement Actif
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter leading-none">
                        Exécution.<br/>
                        Discipline.<br/>
                        <span className="text-orange-500">Alliance.</span>
                    </h1>
                    
                    <p className="text-lg text-stone-400 font-sans max-w-md">
                        14 jours pour briser l'isolement et imposer votre autorité locale.
                        Un seul pro par métier. Zéro théorie.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase tracking-widest rounded-none h-14 px-8" asChild>
                            <Link href="#join">
                                Rejoindre le Commando
                            </Link>
                        </Button>
                        <div className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-widest border border-stone-800 px-4 py-2">
                            <Lock className="h-3 w-3" /> 1 Place / Métier / Dép.
                        </div>
                    </div>
                </div>

                {/* Visual "Dossier de Mission" */}
                <div className="border-2 border-stone-800 bg-stone-900/50 p-6 relative">
                    <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-orange-500"></div>
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-orange-500"></div>
                    
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4 border-b border-stone-800 pb-2 text-stone-500">
                        /// FICHE TECHNIQUE
                    </h3>
                    <ul className="space-y-4 text-sm font-sans">
                        <li className="flex justify-between items-center">
                            <span className="text-stone-400">Durée Opérationnelle</span>
                            <span className="font-bold text-white">14 Jours (Sprint)</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-stone-400">Format</span>
                            <span className="font-bold text-white">100% Action (No Bullshit)</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-stone-400">Structure</span>
                            <span className="font-bold text-white">Escouade Locale (1/101)</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-stone-400">Pression</span>
                            <span className="font-bold text-orange-500">Maximale</span>
                        </li>
                    </ul>
                </div>
            </div>
          </div>
        </section>

        {/* 2. Section “Pourquoi ça existe” */}
        <section className="py-20 px-4 bg-stone-900 border-b border-stone-800">
            <div className="container mx-auto max-w-3xl text-center space-y-8">
                <h2 className="text-2xl font-bold uppercase tracking-widest text-stone-500">
                    /// ANALYSE DE LA SITUATION
                </h2>
                <p className="text-2xl md:text-3xl font-bold leading-tight">
                    Vous savez quoi faire.<br/>
                    Mais vous ne le faites pas.
                </p>
                <div className="grid md:grid-cols-3 gap-8 text-left pt-8 font-sans">
                    <div className="space-y-2">
                        <UserX className="h-8 w-8 text-stone-600" />
                        <h3 className="font-bold text-white">Isolement</h3>
                        <p className="text-stone-400 text-sm">Personne ne vous regarde travailler. Personne ne vous challenge.</p>
                    </div>
                    <div className="space-y-2">
                        <FileText className="h-8 w-8 text-stone-600" />
                        <h3 className="font-bold text-white">Théorie</h3>
                        <p className="text-stone-400 text-sm">Vous consommez du contenu mais n'exécutez pas.</p>
                    </div>
                    <div className="space-y-2">
                        <Target className="h-8 w-8 text-orange-600" />
                        <h3 className="font-bold text-white">Solution</h3>
                        <p className="text-stone-400 text-sm">Structure + Pression + Collectif = Exécution Forcée.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* 3. Section “Comment ça fonctionne” */}
        <section className="py-20 px-4 border-b border-stone-800">
            <div className="container mx-auto max-w-5xl">
                <h2 className="text-2xl font-bold uppercase tracking-widest text-stone-500 mb-12 text-center">
                    /// PROTOCOLE OPÉRATIONNEL
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border border-stone-800">
                    {[
                        { title: "01. COMMANDO", desc: "14 jours. Missions quotidiennes à 6h00. Exécution avant midi." },
                        { title: "02. BINÔME", desc: "Partenaire de responsabilité. Si tu coules, il coule. Ne le déçois pas." },
                        { title: "03. PREUVES", desc: "Screenshot, Lien, Vidéo. Pas de preuve = Pas de points." },
                        { title: "04. RANKING", desc: "Classement public. Les meilleurs montent, les touristes dégagent." },
                    ].map((step, i) => (
                        <div key={i} className="p-8 border-r border-b border-stone-800 last:border-r-0 lg:last:border-r-0 md:nth-2:border-r-0">
                            <h3 className="text-xl font-bold text-orange-500 mb-4 font-mono">{step.title}</h3>
                            <p className="text-stone-400 font-sans text-sm leading-relaxed">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* 4. Section “Les règles du jeu” */}
        <section className="py-20 px-4 bg-stone-950 border-b border-stone-800">
            <div className="container mx-auto max-w-4xl">
                <div className="bg-stone-900 border-l-4 border-orange-600 p-8 md:p-12">
                    <h2 className="text-2xl font-bold uppercase tracking-widest mb-8 flex items-center gap-3">
                        <ShieldAlert className="h-6 w-6 text-orange-600" />
                        RÈGLES D'ENGAGEMENT
                    </h2>
                    <ul className="space-y-6 font-mono text-sm md:text-base">
                        <li className="flex items-start gap-4">
                            <span className="text-orange-600 font-bold">01.</span>
                            <span>UN SEUL PRO PAR MÉTIER PAR DÉPARTEMENT. PREMIER ARRIVÉ, PREMIER SERVI.</span>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="text-orange-600 font-bold">02.</span>
                            <span>ENGAGEMENT QUOTIDIEN REQUIS. 3 JOURS D'ABSENCE = EXCLUSION.</span>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="text-orange-600 font-bold">03.</span>
                            <span>PAS D'OBSERVATEURS. TOUT LE MONDE EST SUR LE TERRAIN.</span>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="text-orange-600 font-bold">04.</span>
                            <span>BIENVEILLANCE BRUTALE. ON SE DIT LA VÉRITÉ POUR AVANCER.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>

        {/* 5. Section “À qui ce n’est PAS destiné” */}
        <section className="py-20 px-4 border-b border-stone-800">
            <div className="container mx-auto max-w-3xl text-center space-y-8">
                <h2 className="text-xl font-bold uppercase tracking-widest text-stone-600">
                    /// AVERTISSEMENT
                </h2>
                <h3 className="text-3xl font-bold">NE REJOIGNEZ PAS SI...</h3>
                <div className="space-y-4 font-sans text-stone-400">
                    <p className="flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-stone-600" /> Vous cherchez une pilule magique sans effort.
                    </p>
                    <p className="flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-stone-600" /> Vous avez peur de passer des coups de fil.
                    </p>
                    <p className="flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-stone-600" /> Vous ne finissez jamais ce que vous commencez.
                    </p>
                </div>
                <p className="text-sm font-mono text-orange-600 pt-4 uppercase">
                    CECI N'EST PAS UNE FORMATION. C'EST UN ENTRAÎNEMENT.
                </p>
            </div>
        </section>

        {/* 6. CTA final */}
        <section id="join" className="py-24 px-4 bg-stone-950">
            <div className="container mx-auto max-w-xl">
                <div className="border-2 border-stone-800 bg-stone-900/30 p-8 md:p-12 relative">
                    {/* Corner marks */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-stone-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-stone-500"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-stone-500"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-stone-500"></div>

                    <div className="text-center mb-10 space-y-4">
                        <h2 className="text-3xl font-bold uppercase tracking-tighter">
                            INITIALISATION
                        </h2>
                        <p className="text-stone-400 font-sans text-sm">
                            Vérification de l'éligibilité. Sécurisez votre secteur maintenant.
                        </p>
                    </div>

                    <div className="dark font-sans">
                        <PreRegistrationForm />
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-stone-800 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs text-stone-600 font-mono uppercase">
                            <CheckSquare className="h-3 w-3" /> Données chiffrées
                            <span className="mx-2">|</span>
                            <CheckSquare className="h-3 w-3" /> Place verrouillée
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main>
      
      <footer className="py-8 border-t border-stone-900 bg-stone-950 text-center">
        <p className="text-stone-600 text-xs font-mono uppercase tracking-widest">
            POPEY ACADEMY © 2026 — UNITÉ D'ÉLITE LOCALE
        </p>
      </footer>
    </div>
  );
}
