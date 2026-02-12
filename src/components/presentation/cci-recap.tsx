"use client";

import { Brain, Rocket, Users, Target, CheckCircle2, Zap, Trophy, ArrowRight, Laptop, Sparkles } from "lucide-react";
import { SalesCoachWidget } from "./sales-coach-widget";

export function CCIRecapViewer() {
    return (
        <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0 font-sans text-slate-900">
            
            {/* Sales Coach Widget */}
            <SalesCoachWidget />

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
                            15 ou 30 Jours
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
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 relative z-10 h-[500px] items-stretch">
                        {/* Phase 1 */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative group hover:border-blue-300 transition-colors flex flex-col">
                            <div className="absolute -top-4 left-6 bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold uppercase rounded-full">Phase 1 • 15 Jours</div>
                            <h3 className="text-2xl font-black text-slate-900 mb-1 uppercase italic">Le Réveil</h3>
                            <p className="text-xs font-bold text-blue-600 mb-4 uppercase tracking-wider">Reconversion & Clarté</p>
                            
                            <div className="flex-1 space-y-3">
                                <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Pour qui ?</p>
                                    <p className="text-sm text-slate-700 font-medium leading-tight">Demandeurs d'emploi perdus.</p>
                                </div>
                                
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Le Problème</p>
                                    <p className="text-sm text-slate-600 leading-snug">80% des chômeurs ne savent pas quoi faire. Le bilan de compétences est trop lent et passif.</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">La Solution</p>
                                    <p className="text-sm text-slate-600 leading-snug">Un électrochoc bienveillant. Identifier ses "Super-Pouvoirs" (Soft Skills) et construire un projet aligné.</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-4">
                                <p className="text-[10px] font-bold text-blue-800 uppercase mb-0.5">Résultat J+15</p>
                                <p className="text-sm font-bold text-slate-900 leading-tight">Dossier "Projet Pro" validé et pitché devant jury.</p>
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex flex-col items-center justify-center relative z-20 px-2">
                            <div className="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full mb-2 uppercase shadow-sm tracking-wider">Optionnel</div>
                            <ArrowRight className="h-6 w-6 text-slate-300" />
                        </div>

                        {/* Phase 2 */}
                        <div className="bg-slate-900 text-white rounded-2xl p-6 relative group shadow-2xl flex flex-col border-2 border-orange-500/30">
                            <div className="absolute -top-4 left-6 bg-orange-500 text-white px-3 py-1 text-xs font-bold uppercase rounded-full">Phase 2 • 15 Jours</div>
                            <div className="absolute -top-4 right-4 bg-green-500 text-white px-2 py-1 text-[10px] font-bold uppercase rounded-full animate-pulse shadow-lg transform rotate-2">Accès Direct</div>
                            
                            <h3 className="text-2xl font-black text-white mb-1 uppercase italic">L'Attaque</h3>
                            <p className="text-xs font-bold text-orange-400 mb-4 uppercase tracking-wider">Entrepreneuriat & Vente</p>
                            
                            <div className="flex-1 space-y-3">
                                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Pour qui ?</p>
                                    <p className="text-sm text-slate-200 font-medium leading-tight">Futurs Entrepreneurs.</p>
                                </div>
                                
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Le Problème</p>
                                    <p className="text-sm text-slate-300 leading-snug">Trop de théorie (Business Plan), pas assez de vente. Risque d'épuisement sans CA.</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">La Solution</p>
                                    <p className="text-sm text-slate-300 leading-snug">Action massive. Marketing Digital, Réseaux Sociaux, Inbound/Outbound pour générer des leads.</p>
                                </div>
                            </div>

                            <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/50 mt-4">
                                <p className="text-[10px] font-bold text-orange-300 uppercase mb-0.5">Résultat J+30</p>
                                <p className="text-sm font-bold text-white leading-tight">Première facture envoyée ou devis signé.</p>
                            </div>
                        </div>
                    </div>

                    {/* Connector Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
                </div>

                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mt-12">
                    <h4 className="font-bold text-orange-900 uppercase mb-2">La Promesse Unifiée</h4>
                    <p className="text-slate-700">
                        Un apprenant peut commencer de <strong className="text-orange-600">zéro</strong> et finir <strong className="text-orange-600">30 jours plus tard</strong> avec une entreprise. Ou rejoindre directement la Phase 2 pour accélérer.
                    </p>
                </div>
            </div>

            {/* PAGE 3 : FORMATION 1 (CHOMEURS) */}
            <div className="w-[210mm] h-[297mm] bg-white mx-auto mb-10 shadow-lg relative flex flex-col px-12 py-10 print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">02. Formation Initiale</span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">15 Jours Intensifs</span>
                </div>

                <h2 className="text-4xl font-black text-blue-900 mb-4 uppercase italic">Le Réveil</h2>
                <p className="text-lg text-slate-500 font-light mb-8 border-l-4 border-blue-500 pl-4 leading-tight">
                    "On ne trouve pas sa voie en réfléchissant, mais en agissant."<br/>
                    Le programme pour redonner confiance et structure.
                </p>

                <div className="flex-1 flex flex-col justify-between min-h-0">
                    <div className="grid grid-cols-2 gap-8 h-full">
                        <div className="flex flex-col justify-start">
                            <h3 className="font-bold text-slate-900 uppercase mb-4 flex items-center gap-2 text-base">
                                <Target className="h-5 w-5 text-blue-600"/> Objectifs Pédagogiques
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">1</div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">Retrouver une posture active</p>
                                        <p className="text-xs text-slate-600 leading-snug">Sortir de l'isolement et reprendre le contrôle de son emploi du temps.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">2</div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">Identifier sa "Zone de Génie"</p>
                                        <p className="text-xs text-slate-600 leading-snug">Transformer ses talents naturels et compétences en une offre de service.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-xs font-bold text-blue-600">3</div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">Valider un projet pro</p>
                                        <p className="text-xs text-slate-600 leading-snug">Choisir entre Salariat et Entrepreneuriat avec un plan d'action validé par le marché.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex flex-col h-full">
                            <h3 className="font-bold text-slate-900 uppercase mb-4 flex items-center gap-2 text-base">
                                <Brain className="h-5 w-5 text-purple-600"/> Le Programme Jour par Jour
                            </h3>
                            <div className="space-y-4 flex-1 overflow-hidden">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-blue-500 tracking-wider">Semaine 1</span>
                                        <span className="text-xs font-black text-slate-900">Introspection & Mindset</span>
                                    </div>
                                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                        <li><strong>J1-J2</strong> : Bilan de compétences flash & Ikigai.</li>
                                        <li><strong>J3-J4</strong> : Identifier ses freins et peurs (Syndrome de l'imposteur).</li>
                                        <li><strong>J5</strong> : Définir sa vision à 3 ans.</li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-blue-500 tracking-wider">Semaine 2</span>
                                        <span className="text-xs font-black text-slate-900">Exploration & Enquête</span>
                                    </div>
                                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                        <li><strong>J6-J7</strong> : Analyser le marché caché de l'emploi.</li>
                                        <li><strong>J8-J9</strong> : Mener 5 enquêtes métiers (interviews pro).</li>
                                        <li><strong>J10</strong> : Synthèse des opportunités détectées.</li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-blue-500 tracking-wider">Semaine 3</span>
                                        <span className="text-xs font-black text-slate-900">Décision & Action</span>
                                    </div>
                                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                        <li><strong>J11-J12</strong> : Construire son plan d'action (CV ou Offre).</li>
                                        <li><strong>J13-J14</strong> : Préparer son Pitch de présentation.</li>
                                        <li><strong>J15</strong> : Grand Oral devant le jury de la cohorte.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 border-l-4 border-green-500 p-4 rounded-r-xl mt-6 shrink-0">
                    <p className="font-bold text-green-700 uppercase text-xs mb-1">La Passerelle Entrepreneur</p>
                    <p className="text-slate-700 text-sm leading-snug">
                        Si à la fin de ces 15 jours, l'apprenant valide un projet de création d'entreprise, il est <strong>automatiquement éligible</strong> pour rejoindre la phase "L'Attaque" et obtenir ses premiers clients en 15 jours supplémentaires.
                    </p>
                </div>

                <div className="mt-4 bg-blue-900 text-white p-5 rounded-xl flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-blue-300 text-[10px] uppercase font-bold mb-0.5">Résultat garanti</p>
                        <p className="text-lg font-bold">Un dossier "Projet Professionnel" complet et pitché.</p>
                    </div>
                    <div className="text-right">
                         <p className="text-blue-300 text-[10px] uppercase font-bold mb-0.5">En savoir plus</p>
                         <p className="font-mono text-xs">popey.academy/emploi</p>
                    </div>
                </div>
            </div>

            {/* PAGE 4 : FORMATION 2 (ENTREPRENEURS) */}
            <div className="w-[210mm] h-[297mm] bg-white mx-auto mb-10 shadow-lg relative flex flex-col px-12 py-10 print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">03. Formation Avancée</span>
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase">15 Jours Commandos</span>
                </div>

                <h2 className="text-4xl font-black text-orange-600 mb-4 uppercase italic">L'Attaque</h2>
                <p className="text-lg text-slate-500 font-light mb-8 border-l-4 border-orange-500 pl-4 leading-tight">
                    "Pas de Business Plan de 50 pages. Des clients, maintenant."<br/>
                    Le programme radical pour lancer son activité et générer du cash.
                </p>

                <div className="flex-1 flex flex-col justify-between min-h-0">
                    <div className="grid grid-cols-2 gap-8 h-full">
                        <div className="flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 uppercase mb-4 flex items-center gap-2 text-base">
                                    <Rocket className="h-5 w-5 text-orange-600"/> Compétences Acquises
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-xs font-bold text-orange-600">1</div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Marketing Digital & Réseaux</p>
                                            <p className="text-xs text-slate-600 leading-snug">Devenir visible et attractif (LinkedIn, Instagram, etc.) pour attirer les opportunités.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-xs font-bold text-orange-600">2</div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Prospection Omni-canal</p>
                                            <p className="text-xs text-slate-600 leading-snug">Maîtriser l'Inbound (attirer) et l'Outbound (chasser) pour générer des leads qualifiés.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-xs font-bold text-orange-600">3</div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">Vente & Closing</p>
                                            <p className="text-xs text-slate-600 leading-snug">Mener un entretien de vente, traiter les objections et encaisser l'acompte.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100 flex flex-col h-full">
                            <h3 className="font-bold text-slate-900 uppercase mb-4 flex items-center gap-2 text-base">
                                <Trophy className="h-5 w-5 text-yellow-600"/> Le Programme Jour par Jour
                            </h3>
                            <div className="space-y-4 flex-1 overflow-hidden">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-orange-500 tracking-wider">Semaine 1</span>
                                        <span className="text-xs font-black text-slate-900">Le Produit (Offre & Branding)</span>
                                    </div>
                                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                        <li><strong>J1-J2</strong> : Créer une Offre Irrésistible (Packagée).</li>
                                        <li><strong>J3-J4</strong> : Optimiser son profil LinkedIn / Landing Page.</li>
                                        <li><strong>J5</strong> : Définir sa stratégie de pricing.</li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-orange-500 tracking-wider">Semaine 2</span>
                                        <span className="text-xs font-black text-slate-900">Les Prospects (Acquisition)</span>
                                    </div>
                                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                        <li><strong>J6-J8</strong> : Campagne de Cold Outreach (Email/DM).</li>
                                        <li><strong>J9</strong> : Stratégie de contenu (Copywriting).</li>
                                        <li><strong>J10</strong> : Lancer son premier webinaire ou lead magnet.</li>
                                    </ul>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase text-orange-500 tracking-wider">Semaine 3</span>
                                        <span className="text-xs font-black text-slate-900">Le Cash (Vente & Closing)</span>
                                    </div>
                                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                                        <li><strong>J11-J12</strong> : Scripts de vente & Traitement des objections.</li>
                                        <li><strong>J13-J14</strong> : Négociation & Contrats.</li>
                                        <li><strong>J15</strong> : Facturation & Onboarding client.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-orange-600 text-white p-5 rounded-xl flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-orange-200 text-[10px] uppercase font-bold mb-0.5">Résultat visé</p>
                        <p className="text-lg font-bold">Premier encaissement ou devis signé.</p>
                    </div>
                    <div className="text-right">
                         <p className="text-orange-200 text-[10px] uppercase font-bold mb-0.5">En savoir plus</p>
                         <p className="font-mono text-xs">popey.academy/entrepreneurs</p>
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