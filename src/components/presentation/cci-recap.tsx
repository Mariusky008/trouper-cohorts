"use client";

import { Brain, Rocket, Users, Target, CheckCircle2, Zap, Trophy, ArrowRight, Laptop, Sparkles } from "lucide-react";

export function CCIRecapViewer() {
    return (
        <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0 font-sans text-slate-900">
            
            {/* Bouton d'impression */}
            <div className="fixed top-6 right-6 z-50 print:hidden">
                <button 
                    onClick={() => window.print()} 
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm uppercase tracking-wider"
                >
                    🖨️ Imprimer / Sauvegarder en PDF
                </button>
            </div>

            {/* PAGE 1 : COUVERTURE */}
            <div className="w-[210mm] h-[297mm] bg-white mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break overflow-hidden">
                
                {/* Background Design Elements */}
                <div className="absolute top-0 right-0 w-2/3 h-full bg-slate-50 skew-x-12 translate-x-1/4 z-0"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-orange-50 -skew-x-12 -translate-x-1/4 z-0"></div>

                <div className="relative z-10 p-16 h-full flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-12">
                            <div className="h-12 w-12 bg-blue-900 rounded-full flex items-center justify-center">
                                <span className="text-white font-black text-xl italic">P</span>
                            </div>
                            <span className="text-blue-900 font-black text-xl tracking-tighter uppercase">Popey Academy</span>
                        </div>

                        <div className="w-20 h-2 bg-orange-500 mb-8"></div>

                        <h1 className="text-6xl font-black text-slate-900 mb-6 leading-[1.1] uppercase tracking-tight">
                            Le Dispositif<br/>
                            <span className="text-blue-600">Accélération</span><br/>
                            30 Jours
                        </h1>

                        <p className="text-2xl text-slate-500 font-light max-w-lg leading-relaxed">
                            De la recherche de sens à la première facture.<br/>
                            Un parcours unique pour sécuriser le retour à l'emploi et la création d'entreprise.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white/80 backdrop-blur-sm border-l-4 border-blue-600 p-6 shadow-sm">
                            <p className="text-sm font-bold text-blue-900 uppercase mb-1">Pour la CCI & Les Partenaires</p>
                            <p className="text-lg text-slate-700 font-medium">
                                "Transformer l'incertitude en action concrète grâce à la force du collectif."
                            </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200 pt-8">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Préparé par</p>
                                <p className="font-bold text-slate-900">L'Équipe Pédagogique Popey</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Date</p>
                                <p className="font-bold text-slate-900">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PAGE 2 : LE CONCEPT (LE PONT) */}
            <div className="w-[210mm] h-[297mm] bg-white mx-auto mb-10 shadow-lg relative flex flex-col p-16 print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                <div className="flex items-center gap-2 mb-12 opacity-50">
                    <span className="text-xs font-bold uppercase tracking-widest">01. La Vision</span>
                </div>

                <h2 className="text-4xl font-black text-slate-900 mb-12 uppercase">Le Parcours <span className="text-orange-500">"Zéro à Héros"</span></h2>

                <div className="flex-1 flex flex-col justify-center relative">
                    {/* The Bridge Visualization */}
                    <div className="flex items-center justify-between relative z-10">
                        {/* Phase 1 */}
                        <div className="w-[45%] bg-slate-50 border border-slate-200 rounded-2xl p-8 relative group hover:border-blue-300 transition-colors h-[420px] flex flex-col">
                            <div className="absolute -top-4 left-8 bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold uppercase rounded-full">Phase 1 • 15 Jours</div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase italic">Le Réveil</h3>
                            <p className="text-sm font-bold text-blue-600 mb-4 uppercase tracking-wider">Reconversion & Clarté</p>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                                <strong>Pour qui ?</strong> Chômeurs en quête de sens.<br/>
                                <strong>Le problème :</strong> 80% des chercheurs d'emploi sont perdus après une rupture.<br/>
                                <strong>La solution :</strong> Un électrochoc bienveillant. On ne cherche pas un "job", on construit un projet de vie aligné avec ses talents naturels.
                            </p>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Résultat J+15</p>
                                <p className="text-sm font-bold text-slate-900">Un dossier "Projet Pro" validé et pitché.</p>
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="h-4 w-4 text-blue-500"/> Confiance retrouvée</li>
                                <li className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle2 className="h-4 w-4 text-blue-500"/> Soft Skills identifiés</li>
                            </ul>
                        </div>

                        {/* Arrow */}
                        <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-20">
                            <div className="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded mb-2 uppercase shadow-sm">Optionnel</div>
                            <ArrowRight className="h-8 w-8 text-slate-300" />
                        </div>

                        {/* Phase 2 */}
                        <div className="w-[45%] bg-slate-900 text-white rounded-2xl p-8 relative group shadow-2xl h-[420px] flex flex-col border-2 border-orange-500/30">
                            <div className="absolute -top-4 left-8 bg-orange-500 text-white px-3 py-1 text-xs font-bold uppercase rounded-full">Phase 2 • 15 Jours</div>
                            <div className="absolute -top-4 right-8 bg-green-500 text-white px-3 py-1 text-xs font-bold uppercase rounded-full animate-pulse">Accès Direct Possible</div>
                            
                            <h3 className="text-2xl font-black text-white mb-2 uppercase italic">L'Attaque</h3>
                            <p className="text-sm font-bold text-orange-400 mb-4 uppercase tracking-wider">Entrepreneuriat & Vente</p>
                            <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-1">
                                <strong>Pour qui ?</strong> Entrepreneurs prêts à décoller.<br/>
                                <strong>Le problème :</strong> Trop de théorie, pas assez de vente.<br/>
                                <strong>La solution :</strong> Action massive. Marketing digital, Réseaux sociaux, Inbound/Outbound pour générer des leads en 15 jours.
                            </p>
                            <div className="bg-orange-500/20 p-4 rounded-xl border border-orange-500/50 mb-4">
                                <p className="text-xs font-bold text-orange-300 uppercase mb-1">Résultat J+30</p>
                                <p className="text-sm font-bold text-white">Première facture envoyée ou devis signé.</p>
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="h-4 w-4 text-orange-500"/> Offre & Marketing</li>
                                <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="h-4 w-4 text-orange-500"/> Clients & Facturation</li>
                            </ul>
                        </div>
                    </div>

                    {/* Connector Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mt-12">
                    <h4 className="font-bold text-orange-900 uppercase mb-2">La Promesse Unifiée</h4>
                    <p className="text-slate-700">
                        Un apprenant peut commencer de <strong className="text-orange-600">zéro</strong> (sans idée, sans confiance) et finir <strong className="text-orange-600">30 jours plus tard</strong> avec une entreprise immatriculée et ses premiers clients. C'est le pont le plus rapide vers l'autonomie financière.
                    </p>
                </div>
            </div>

            {/* PAGE 3 : FORMATION 1 (CHOMEURS) */}
            <div className="w-[210mm] h-[297mm] bg-white mx-auto mb-10 shadow-lg relative flex flex-col p-16 print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">02. Formation Initiale</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase">15 Jours Intensifs</span>
                </div>

                <h2 className="text-5xl font-black text-blue-900 mb-6 uppercase italic">Le Réveil</h2>
                <p className="text-xl text-slate-500 font-light mb-12 border-l-4 border-blue-500 pl-6">
                    "On ne trouve pas sa voie en réfléchissant, mais en agissant."<br/>
                    Le programme pour redonner confiance et structure.
                </p>

                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600"/> Objectifs Pédagogiques
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">1</div>
                                <p className="text-sm text-slate-600"><strong>Retrouver une posture active</strong> : Sortir de l'isolement du chercheur d'emploi.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">2</div>
                                <p className="text-sm text-slate-600"><strong>Identifier sa "Zone de Génie"</strong> : Ce que je sais faire vs ce que le marché attend.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">3</div>
                                <p className="text-sm text-slate-600"><strong>Valider un projet pro</strong> : Salariat ou Entrepreneuriat ? La réponse à la fin.</p>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl">
                        <h3 className="font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-600"/> Le Programme
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                                <span className="text-slate-600">Semaine 1</span>
                                <span className="font-bold text-slate-900">Introspection & Mindset</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                                <span className="text-slate-600">Semaine 2</span>
                                <span className="font-bold text-slate-900">Enquête Métier & Validation</span>
                            </div>
                            <div className="flex justify-between text-sm pb-2">
                                <span className="text-slate-600">Semaine 3</span>
                                <span className="font-bold text-slate-900">Pitch & Plan d'Action</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto bg-blue-900 text-white p-8 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-blue-300 text-xs uppercase font-bold mb-1">Résultat garanti</p>
                        <p className="text-xl font-bold">Un dossier "Projet Professionnel" complet et pitché.</p>
                    </div>
                    <div className="text-right">
                         <p className="text-blue-300 text-xs uppercase font-bold mb-1">En savoir plus</p>
                         <p className="font-mono text-sm">popey.academy/emploi</p>
                    </div>
                </div>
            </div>

            {/* PAGE 4 : FORMATION 2 (ENTREPRENEURS) */}
            <div className="w-[210mm] h-[297mm] bg-white mx-auto mb-10 shadow-lg relative flex flex-col p-16 print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">03. Formation Avancée</span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold uppercase">15 Jours Commandos</span>
                </div>

                <h2 className="text-5xl font-black text-orange-600 mb-6 uppercase italic">L'Attaque</h2>
                <p className="text-xl text-slate-500 font-light mb-12 border-l-4 border-orange-500 pl-6">
                    "Pas de Business Plan de 50 pages. Des clients, maintenant."<br/>
                    Le programme radical pour lancer son activité et générer du cash.
                </p>

                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <h3 className="font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-orange-600"/> Compétences Acquises
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-xs font-bold text-orange-600">1</div>
                                <p className="text-sm text-slate-600"><strong>Marketing Digital & Réseaux</strong> : Devenir visible et attractif (LinkedIn, Instagram, etc.).</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-xs font-bold text-orange-600">2</div>
                                <p className="text-sm text-slate-600"><strong>Prospection Omni-canal</strong> : Inbound (attirer) et Outbound (chasser) pour avoir des leads.</p>
                            </li>
                            <li className="flex gap-3">
                                <div className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-xs font-bold text-orange-600">3</div>
                                <p className="text-sm text-slate-600"><strong>Vente & Closing</strong> : Convaincre en visio ou téléphone et encaisser l'acompte.</p>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl">
                        <h3 className="font-bold text-slate-900 uppercase mb-4 flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-600"/> Le Programme
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                                <span className="text-slate-600">Semaine 1</span>
                                <span className="font-bold text-slate-900">Offre Irrésistible & Branding</span>
                            </div>
                            <div className="flex justify-between text-sm border-b border-slate-200 pb-2">
                                <span className="text-slate-600">Semaine 2</span>
                                <span className="font-bold text-slate-900">Acquisition & Marketing Digital</span>
                            </div>
                            <div className="flex justify-between text-sm pb-2">
                                <span className="text-slate-600">Semaine 3</span>
                                <span className="font-bold text-slate-900">Vente, Négociation & Facturation</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto bg-orange-600 text-white p-8 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-orange-200 text-xs uppercase font-bold mb-1">Résultat visé</p>
                        <p className="text-xl font-bold">Premier encaissement ou devis signé.</p>
                    </div>
                    <div className="text-right">
                         <p className="text-orange-200 text-xs uppercase font-bold mb-1">En savoir plus</p>
                         <p className="font-mono text-sm">popey.academy/entrepreneurs</p>
                    </div>
                </div>
            </div>

            {/* PAGE 5 : LA PLATEFORME & METHODE */}
            <div className="w-[210mm] h-[297mm] bg-slate-900 text-white mx-auto mb-10 shadow-lg relative flex flex-col p-16 print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                <div className="flex items-center justify-between mb-12">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">04. L'Expérience</span>
                    <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">Technologie & Humain</span>
                </div>

                <h2 className="text-5xl font-black mb-12 uppercase">La Méthode <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">Popey</span></h2>

                <div className="grid grid-cols-2 gap-8 flex-1">
                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 col-span-2 flex items-start gap-6 bg-gradient-to-r from-slate-800 to-blue-900/50">
                        <Users className="h-12 w-12 text-blue-400 shrink-0" />
                        <div>
                            <h3 className="text-2xl font-bold uppercase mb-2 text-white">L'Effet de Levier "Réseau"</h3>
                            <p className="text-slate-300 text-base leading-relaxed mb-4">
                                Chaque cohorte rassemble <strong>24 talents</strong> qui s'entraident quotidiennement. Au bout de 30 jours, vous repartez avec 24 ambassadeurs qui connaissent votre offre par cœur.
                            </p>
                            <div className="bg-white/10 p-4 rounded-xl inline-block">
                                <p className="text-sm font-bold text-blue-200">💎 Valeur inestimable : Le Bouche-à-Oreille</p>
                                <p className="text-xs text-slate-400">Vos premiers clients sont souvent vos pairs ou leurs réseaux.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                        <Laptop className="h-10 w-10 text-purple-400 mb-6" />
                        <h3 className="text-xl font-bold uppercase mb-2">Le Dashboard Gamifié</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Suivi de progression en temps réel, missions débloquées jour après jour, "Mur des Victoires" pour célébrer chaque succès. On rend le travail addictif.
                        </p>
                    </div>

                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                        <Sparkles className="h-10 w-10 text-orange-400 mb-6" />
                        <h3 className="text-xl font-bold uppercase mb-2">Coach IA 24/7</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Notre IA "Coach Popey" est intégrée à la plateforme. Elle aide à reformuler, brainstormer et corriger les livrables instantanément, à toute heure.
                        </p>
                    </div>

                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
                        <CheckCircle2 className="h-10 w-10 text-green-400 mb-6" />
                        <h3 className="text-xl font-bold uppercase mb-2">Pédagogie Inversée</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Pas de cours magistraux interminables. Une vidéo courte (5min) le matin, et 90% du temps consacré à l'action et à la production.
                        </p>
                    </div>
                </div>
            </div>

            {/* PAGE 6 : CONTACT (BACK COVER) */}
            <div className="w-[210mm] h-[297mm] bg-blue-900 mx-auto mb-10 shadow-lg relative flex flex-col justify-center items-center text-center text-white print:mb-0 print:shadow-none print:w-full print:h-screen">
                <div className="mb-8 h-24 w-24 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-900 font-black text-4xl italic">P</span>
                </div>
                
                <h2 className="text-4xl font-black uppercase mb-6">Prêt à collaborer ?</h2>
                <p className="text-xl text-blue-200 max-w-lg mb-12 font-light">
                    Ensemble, offrons aux talents de demain l'accompagnement qu'ils méritent. Moderne, humain et efficace.
                </p>

                <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 w-full max-w-md text-left space-y-6">
                    <div>
                        <p className="text-xs text-blue-300 uppercase font-bold tracking-widest mb-1">Email Direction</p>
                        <p className="text-xl font-bold">contact@popey.academy</p>
                    </div>
                    <div>
                        <p className="text-xs text-blue-300 uppercase font-bold tracking-widest mb-1">Site Web</p>
                        <p className="text-xl font-bold">www.popey.academy</p>
                    </div>
                    <div>
                        <p className="text-xs text-blue-300 uppercase font-bold tracking-widest mb-1">Téléphone</p>
                        <p className="text-xl font-bold">07 68 23 33 47</p>
                    </div>
                </div>

                <div className="absolute bottom-12 text-blue-400 text-[10px] uppercase tracking-widest">
                    © {new Date().getFullYear()} Popey Academy — Tous droits réservés
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .page-break {
                        page-break-after: always;
                    }
                    .break-after-page {
                        break-after: page;
                    }
                    /* Force background colors */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}