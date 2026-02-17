"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Building2, Users, Target, CheckCircle2, 
    ArrowRight, BarChart3, ShieldCheck, Brain, 
    Briefcase, Handshake, LayoutList, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function FranceTravailPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* HEADER INSTITUTIONNEL */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-blue-900 rounded-lg flex items-center justify-center text-white">
                <Building2 className="h-6 w-6" />
             </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Popey <span className="text-blue-700">Institutionnel</span></span>
          </div>
          <div className="flex items-center gap-4">
             <span className="hidden md:inline-flex px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold uppercase tracking-wider rounded-full border border-blue-100">
                Proposition Pilote 2026
             </span>
             <a 
                href="mailto:jean-philippe@popey.academy" 
                className={cn(buttonVariants({ variant: "default" }), "bg-blue-900 hover:bg-blue-800 text-white")}
             >
                Contacter la Direction
             </a>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO SECTION */}
        <section className="py-20 md:py-32 bg-slate-50 border-b border-slate-200">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <Badge className="bg-white text-blue-700 border-blue-200 mb-8 px-4 py-1.5 text-sm font-bold shadow-sm">
                Innovation Sociale & Retour à l'Emploi
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8 leading-tight">
              Une alternative active à la<br/>
              <span className="text-blue-700">formation passive.</span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Nous proposons à France Travail un dispositif expérimental de <strong>5 semaines</strong> pour remobiliser 24 demandeurs d'emploi par la force du collectif et de l'action quotidienne.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="#concept" className={cn(buttonVariants({ size: "lg" }), "bg-blue-700 hover:bg-blue-600 text-white px-8 rounded-full")}>
                    Découvrir le dispositif
                </a>
                <a href="#pilote" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white border-slate-300 text-slate-700 hover:bg-slate-50 px-8 rounded-full")}>
                    Voir l'offre pilote (Gratuit)
                </a>
            </div>
          </div>
        </section>

        {/* 2. LE CONSTAT (PROBLEME) */}
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Le constat terrain</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            Malgré les dispositifs existants, une partie des demandeurs d'emploi s'enlise dans une spirale d'isolement. La formation technique ne suffit plus si la dynamique personnelle est brisée.
                        </p>
                        <div className="space-y-4 pt-4">
                            <div className="flex gap-4 items-start">
                                <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                                    <Users className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">L'Isolement</h4>
                                    <p className="text-sm text-slate-500">Le chercheur d'emploi est souvent seul face à son écran, sans feedback ni soutien quotidien.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                                    <Brain className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">La Perte de Sens</h4>
                                    <p className="text-sm text-slate-500">"Je ne sais plus ce que je vaux ni ce que je veux faire."</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="h-10 w-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                                    <Target className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">La Passivité</h4>
                                    <p className="text-sm text-slate-500">La consommation de contenu (vidéos, MOOCs) remplace trop souvent l'action réelle (contacts, projets).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-100 rounded-2xl p-8 border border-slate-200">
                        <h3 className="font-bold text-xl text-slate-900 mb-6">Notre Réponse : L'Action Collective</h3>
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <span className="font-medium text-slate-700">Responsabilisation par les pairs (Binômes quotidiens)</span>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <span className="font-medium text-slate-700">Missions concrètes chaque jour (Pas de théorie)</span>
                            </div>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <span className="font-medium text-slate-700">Résultats mesurables en 5 semaines</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* 3. LE PROGRAMME 5 SEMAINES */}
        <section id="concept" className="py-20 bg-slate-900 text-white">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-16">
                    <Badge className="bg-blue-600 hover:bg-blue-500 text-white mb-4">Le Dispositif</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Un parcours hybride de 5 semaines</h2>
                    <p className="text-slate-400 text-lg">Introspection active + Accélération entrepreneuriale</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 relative">
                    {/* Connecteur visuel */}
                    <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-slate-900 rounded-full p-2 z-10 border-4 border-slate-900 font-bold">
                        +
                    </div>

                    {/* PHASE 1 */}
                    <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                        <div className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-2">Phase 1 • 3 Semaines</div>
                        <h3 className="text-2xl font-bold mb-6">Redéfinition & Orientation</h3>
                        <ul className="space-y-4 text-slate-300">
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                <span>Bilan de compétences "à chaud" et identification des forces.</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                <span>Exploration de 3 pistes professionnelles concrètes.</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                <span>Enquêtes métier réelles (interviews de professionnels).</span>
                            </li>
                        </ul>
                    </div>

                    {/* PHASE 2 */}
                    <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                        <div className="text-orange-400 font-bold uppercase tracking-widest text-sm mb-2">Phase 2 • 2 Semaines</div>
                        <h3 className="text-2xl font-bold mb-6">Action & Confrontation</h3>
                        <ul className="space-y-4 text-slate-300">
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                                <span>Création d'une offre de service (Freelance) ou d'un profil "Offre" (Salarié).</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                                <span>Prospection active et activation du réseau.</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                                <span>Premiers retours marché (Devis, Entretiens, Feedback).</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        {/* 4. METHODOLOGIE & OUTILS */}
        <section className="py-20 bg-slate-50">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Une méthodologie éprouvée</h2>
                    <p className="text-slate-600">Nous utilisons les codes des startups (Agilité, Itération, Pair-working) appliqués à l'insertion.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <Users className="h-10 w-10 text-blue-700 mb-4" />
                        <h3 className="font-bold text-lg mb-2">Le Binômage Quotidien</h3>
                        <p className="text-sm text-slate-600">Chaque matin, un partenaire différent. Cela brise l'isolement et oblige à verbaliser ses objectifs.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <LayoutList className="h-10 w-10 text-blue-700 mb-4" />
                        <h3 className="font-bold text-lg mb-2">Le Cockpit Digital</h3>
                        <p className="text-sm text-slate-600">Une interface gamifiée où chaque action est validée. Fini les to-do lists papier qui se perdent.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <BarChart3 className="h-10 w-10 text-blue-700 mb-4" />
                        <h3 className="font-bold text-lg mb-2">La Preuve par l'Action</h3>
                        <p className="text-sm text-slate-600">Nous ne demandons pas "Avez-vous compris ?", nous demandons "Montrez ce que vous avez fait".</p>
                    </div>
                </div>
            </div>
        </section>

        {/* 5. OFFRE PILOTE (CTA) */}
        <section id="pilote" className="py-20 bg-white border-t border-slate-200">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 md:p-12 text-center">
                    <Badge className="bg-blue-900 text-white mb-6 px-4 py-1">Appel à Partenariat</Badge>
                    <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-6">
                        Expérimentation "Cohorte Pilote"
                    </h2>
                    <p className="text-lg text-blue-800 mb-8 leading-relaxed">
                        Nous offrons <strong>24 places gratuites</strong> (Valeur 24 x 199€) pour tester ce dispositif avec des profils sélectionnés par vos soins.
                        <br/>Notre objectif : vous démontrer l'efficacité du modèle par les résultats.
                    </p>

                    <div className="bg-white rounded-xl p-6 mb-8 text-left max-w-2xl mx-auto shadow-sm border border-blue-100">
                        <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5" /> Profils recherchés pour le test :
                        </h4>
                        <ul className="space-y-2 text-slate-700 text-sm">
                            <li className="flex gap-2"><Check className="h-4 w-4 text-green-600 shrink-0" /> Demandeurs d'emploi de longue durée (ou risque de l'être)</li>
                            <li className="flex gap-2"><Check className="h-4 w-4 text-green-600 shrink-0" /> Ouverts au numérique (usage basique requis)</li>
                            <li className="flex gap-2"><Check className="h-4 w-4 text-green-600 shrink-0" /> Prêts à s'engager 1h à 2h par jour pendant 5 semaines</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-4 justify-center items-center">
                        <a href="mailto:jean-philippe@popey.academy?subject=Partenariat France Travail - Pilote" className={cn(buttonVariants({ size: "lg" }), "bg-blue-900 hover:bg-blue-800 text-white px-10 py-6 text-lg rounded-full w-full md:w-auto")}>
                            Organiser une démo du Cockpit
                        </a>
                        <p className="text-sm text-blue-600 font-medium">
                            Contact direct : Jean-Philippe Roth (Fondateur)
                        </p>
                    </div>
                </div>
            </div>
        </section>

        {/* FOOTER SIMPLE */}
        <footer className="bg-slate-900 text-slate-400 py-12 text-center text-sm">
            <div className="container mx-auto px-4">
                <p className="mb-4">Popey Academy - Organisme de formation nouvelle génération.</p>
                <p>© 2026 Tous droits réservés.</p>
            </div>
        </footer>

      </main>
    </div>
  );
}

function Check({ className }: { className?: string }) {
    return <CheckCircle2 className={cn("h-4 w-4", className)} />;
}
