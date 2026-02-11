"use client";

import { CheckCircle2, Target, Users, Calendar, ShieldCheck, Award } from "lucide-react";

export function DossierPiloteViewer() {
    return (
        <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0 font-sans">
            
            {/* Bouton d'impression */}
            <div className="fixed top-6 right-6 z-50 print:hidden">
                <button 
                    onClick={() => window.print()} 
                    className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm uppercase tracking-wider"
                >
                    🖨️ Imprimer / PDF
                </button>
            </div>

            {/* --- PAGE 1 : NOTE DE CADRAGE --- */}
            <div className="w-[210mm] h-[297mm] bg-white p-16 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                
                {/* Header */}
                <header className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-1">NOTE DE CADRAGE</h1>
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">Dispositif Expérimental d'Accompagnement</p>
                    </div>
                    <div className="text-right">
                        <div className="text-orange-600 font-black text-2xl tracking-tighter">POPEY</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Academy</div>
                    </div>
                </header>

                {/* Corps du document */}
                <div className="flex-1 space-y-10">

                    {/* 1. Synthèse du Dispositif */}
                    <section>
                        <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4 uppercase tracking-wide">
                            <Target className="text-orange-500" /> Synthèse du Dispositif
                        </h2>
                        <p className="text-slate-700 leading-relaxed text-justify">
                            <strong>Popey Academy</strong> est un programme intensif de <strong>15 jours</strong> conçu pour réactiver la dynamique professionnelle des indépendants et demandeurs d'emploi en phase de création ou de relance. 
                            Contrairement aux formations théoriques classiques, ce dispositif mise sur <strong>l'action immédiate</strong>, la <strong>responsabilisation par binôme</strong> (Peer-to-Peer Accountability) et la <strong>gamification</strong> pour lever les freins psychologiques à la prospection et à la visibilité.
                        </p>
                    </section>

                    {/* 2. Fiche d'Identité (Grille) */}
                    <section className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Intitulé du Programme</h3>
                            <div className="font-bold text-slate-900 text-lg">"15 Jours pour Passer à l'Action"</div>
                            <div className="text-sm text-slate-600 mt-1">Bootcamp opérationnel de relance d'activité</div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Public Cible</h3>
                            <div className="font-bold text-slate-900 text-lg">Indépendants & Créateurs</div>
                            <div className="text-sm text-slate-600 mt-1">En phase de lancement, stagnation ou pivot.</div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Durée & Rythme</h3>
                            <div className="font-bold text-slate-900 text-lg">15 Jours Consécutifs</div>
                            <div className="text-sm text-slate-600 mt-1">Engagement quotidien (1h à 2h / jour).</div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">Modalité Pédagogique</h3>
                            <div className="font-bold text-slate-900 text-lg">Distanciel Animé</div>
                            <div className="text-sm text-slate-600 mt-1">Plateforme dédiée + Binômes + Lives.</div>
                        </div>
                    </section>

                    {/* 3. Objectifs Pédagogiques */}
                    <section>
                        <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4 uppercase tracking-wide">
                            <Award className="text-orange-500" /> Objectifs Pédagogiques
                        </h2>
                        <ul className="space-y-3">
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700"><strong>Lever les blocages</strong> liés à la légitimité et à la peur de la vente.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700"><strong>Acquérir une routine</strong> de prospection et de création de contenu régulière.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700"><strong>Développer l'autonomie</strong> numérique et l'usage des outils modernes.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700"><strong>Rompre l'isolement</strong> professionnel grâce à la dynamique de cohorte.</span>
                            </li>
                        </ul>
                    </section>

                    {/* 4. Positionnement (Bas de page) */}
                    <section className="mt-auto pt-6 border-t border-slate-200">
                        <div className="flex items-start gap-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <ShieldCheck className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-orange-900 text-sm uppercase mb-1">Cadre du Pilote Expérimental</h3>
                                <p className="text-sm text-orange-800 leading-snug">
                                    Ce dispositif est proposé à titre de <strong>pilote gratuit</strong> et expérimental. 
                                    Il ne comporte <strong>aucune dimension commerciale</strong> (pas de vente additionnelle, pas d'abonnement caché). 
                                    L'objectif unique est de valider la méthodologie d'accompagnement par l'action.
                                </p>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <footer className="mt-12 text-center text-xs text-slate-400 uppercase tracking-widest">
                    Document Confidentiel • Popey Academy • {new Date().getFullYear()}
                </footer>
            </div>

            {/* --- PAGE 2 : DISPOSITIF PÉDAGOGIQUE --- */}
            <div className="w-[210mm] h-[297mm] bg-white p-16 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                
                {/* Header Page 2 */}
                <header className="flex justify-between items-end border-b-2 border-slate-200 pb-6 mb-12">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">DÉTAIL DU DISPOSITIF</h2>
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">Approche & Méthodologie</p>
                    </div>
                    <div className="text-right opacity-50">
                        <div className="text-xs font-bold text-slate-400 uppercase">Page 2/2</div>
                    </div>
                </header>

                <div className="flex-1 space-y-10">

                    {/* 1. Méthodologie "Action-First" */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-orange-500 pl-3">
                            Méthodologie "Action-First"
                        </h3>
                        <p className="text-slate-700 leading-relaxed text-justify mb-4">
                            L'approche pédagogique repose sur l'inversion du modèle traditionnel. Au lieu d'apprendre pour faire, nous faisons pour apprendre. 
                            Chaque journée est structurée autour d'une <strong>mission concrète</strong> (ex: "Contacter 3 prospects", "Publier une offre", "Auditer ses finances").
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-lg text-center">
                                <div className="font-bold text-slate-900 mb-1">10% Théorie</div>
                                <div className="text-xs text-slate-500">Briefing vidéo court</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg text-center">
                                <div className="font-bold text-slate-900 mb-1">80% Pratique</div>
                                <div className="text-xs text-slate-500">Missions terrain</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg text-center">
                                <div className="font-bold text-slate-900 mb-1">10% Feedback</div>
                                <div className="text-xs text-slate-500">Debrief binôme</div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Innovation Sociale : Le Binôme */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-blue-500 pl-3">
                            Innovation Sociale : La Responsabilisation
                        </h3>
                        <div className="flex gap-6 items-start">
                            <div className="flex-1 text-slate-700 text-justify">
                                <p className="mb-2">
                                    L'isolement est le premier facteur d'échec chez les indépendants. 
                                    Le programme impose un système de <strong>Binôme Aléatoire</strong> (Buddy System).
                                </p>
                                <p>
                                    Chaque participant est jumelé avec un pair. Ils doivent se "rendre des comptes" quotidiennement via un système de validation croisée.
                                    Cela crée une obligation morale positive qui booste l'engagement de <strong>+300%</strong> par rapport à une formation e-learning seule.
                                </p>
                            </div>
                            <div className="w-1/3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="text-center font-bold text-blue-900 mb-2">Le Pacte</div>
                                <ul className="text-xs text-blue-800 space-y-2">
                                    <li>• Appel quotidien (5 min)</li>
                                    <li>• Validation des preuves</li>
                                    <li>• Soutien moral</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 3. Programme Synthétique */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-purple-500 pl-3">
                            Calendrier Prévisionnel
                        </h3>
                        <div className="space-y-3">
                            <div className="flex gap-4 items-center">
                                <div className="w-24 font-bold text-slate-400 text-sm">Jours 1-5</div>
                                <div className="flex-1 bg-slate-50 p-3 rounded border border-slate-100 text-sm">
                                    <strong>Phase 1 : Fondations & Mental</strong> — Définir son offre, casser ses croyances limitantes, s'engager publiquement.
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="w-24 font-bold text-slate-900 text-sm">Jours 6-10</div>
                                <div className="flex-1 bg-slate-50 p-3 rounded border border-slate-100 text-sm">
                                    <strong>Phase 2 : Visibilité & Prospection</strong> — Créer du contenu, contacter des prospects, gérer le rejet.
                                </div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="w-24 font-bold text-slate-400 text-sm">Jours 11-15</div>
                                <div className="flex-1 bg-slate-50 p-3 rounded border border-slate-100 text-sm">
                                    <strong>Phase 3 : Vente & Consolidation</strong> — Closer des clients, établir une routine pérenne, bilan.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Résultats Attendus (KPI) */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-3 uppercase tracking-wide border-l-4 border-green-500 pl-3">
                            Indicateurs de Réussite (KPI)
                        </h3>
                        <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-700">
                            <li className="flex justify-between border-b border-slate-100 pb-1">
                                <span>Taux de complétion cible</span>
                                <strong>&gt; 80%</strong>
                            </li>
                            <li className="flex justify-between border-b border-slate-100 pb-1">
                                <span>Actions de prospection / participant</span>
                                <strong>Min. 10</strong>
                            </li>
                            <li className="flex justify-between border-b border-slate-100 pb-1">
                                <span>Contenus publiés / participant</span>
                                <strong>Min. 5</strong>
                            </li>
                            <li className="flex justify-between border-b border-slate-100 pb-1">
                                <span>Confiance acquise (auto-évaluation)</span>
                                <strong>+ 5 pts</strong>
                            </li>
                        </ul>
                    </section>

                </div>

                {/* Footer Page 2 */}
                <footer className="mt-12 text-center text-xs text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6">
                    Document Confidentiel • Popey Academy • {new Date().getFullYear()}
                </footer>
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
                    }
                    .page-break {
                        page-break-after: always;
                    }
                    .break-after-page {
                        break-after: page;
                    }
                }
            `}</style>
        </div>
    );
}
