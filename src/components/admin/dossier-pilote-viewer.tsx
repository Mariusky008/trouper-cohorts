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
            <div className="w-[210mm] h-[297mm] bg-white p-8 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                
                {/* Header */}
                <header className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">NOTE DE CADRAGE</h1>
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Dispositif Expérimental d'Accompagnement</p>
                    </div>
                    <div className="text-right">
                        <div className="text-orange-600 font-black text-2xl tracking-tighter">POPEY</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Academy</div>
                    </div>
                </header>

                {/* Corps du document */}
                <div className="flex-1 space-y-6">

                    {/* 1. Synthèse du Dispositif */}
                    <section>
                        <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">
                            <Target className="text-orange-500 h-5 w-5" /> Synthèse & Philosophie
                        </h2>
                        <div className="text-slate-700 text-sm leading-relaxed text-justify space-y-2">
                            <p>
                                <strong>Le Constat :</strong> 80% des porteurs de projet échouent non pas par manque de compétences techniques, mais par <strong>inhibition de l'action</strong> (peur de vendre, syndrome de l'imposteur, procrastination). L'isolement du créateur est le premier facteur d'abandon.
                            </p>
                            <p>
                                <strong>La Réponse :</strong> Popey Academy est un dispositif expérimental de <strong>"Mise en Mouvement"</strong>. Ce n'est pas une formation théorique classique ("Savoir"), mais un entraînement comportemental intensif ("Faire").
                            </p>
                            <p>
                                <strong>La Mécanique :</strong> Durant <strong>15 jours (60h)</strong>, les participants sont immergés dans une dynamique de groupe où l'action précède la réflexion. Chaque jour, ils doivent valider une mission concrète (prospection, visibilité, vente) sous peine d'exclusion symbolique. Cette <strong>gamification de l'effort</strong> permet de débloquer les freins psychologiques en un temps record.
                            </p>
                        </div>
                    </section>

                    {/* 2. Fiche d'Identité (Grille) */}
                    <section className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Intitulé du Programme</h3>
                            <div className="font-bold text-slate-900 text-base">"15 Jours pour Passer à l'Action"</div>
                            <div className="text-xs text-slate-600 mt-1">Bootcamp opérationnel de relance d'activité</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Public Cible</h3>
                            <div className="font-bold text-slate-900 text-base">Indépendants & Créateurs</div>
                            <div className="text-xs text-slate-600 mt-1">En phase de lancement, stagnation ou pivot.</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Durée & Rythme</h3>
                            <div className="font-bold text-slate-900 text-base">15 Jours Consécutifs</div>
                            <div className="text-xs text-slate-600 mt-1">4h00 / jour + échange binôme.</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-1">Modalité Pédagogique</h3>
                            <div className="font-bold text-slate-900 text-base">Distanciel Animé</div>
                            <div className="text-xs text-slate-600 mt-1">Plateforme dédiée + Binômes + Lives.</div>
                        </div>
                    </section>

                    {/* 3. Objectifs Pédagogiques */}
                    <section>
                        <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-2 uppercase tracking-wide">
                            <Award className="text-orange-500 h-5 w-5" /> Objectifs Pédagogiques
                        </h2>
                        <ul className="space-y-2">
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700 text-sm"><strong>Lever les blocages</strong> liés à la légitimité et à la peur de la vente.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700 text-sm"><strong>Acquérir une routine</strong> de prospection et de création de contenu régulière.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700 text-sm"><strong>Développer l'autonomie</strong> numérique et l'usage des outils modernes.</span>
                            </li>
                            <li className="flex gap-3 items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700 text-sm"><strong>Rompre l'isolement</strong> professionnel grâce à la dynamique de cohorte.</span>
                            </li>
                        </ul>
                    </section>

                    {/* 4. Positionnement (Bas de page) */}
                    <section className="mt-auto pt-4 border-t border-slate-200">
                        <div className="flex items-start gap-4 bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <ShieldCheck className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-orange-900 text-xs uppercase mb-1">Cadre du Pilote Expérimental</h3>
                                <p className="text-xs text-orange-800 leading-snug">
                                    Ce dispositif est proposé à titre de <strong>pilote gratuit</strong> et expérimental. 
                                    Il ne comporte <strong>aucune dimension commerciale</strong> (pas de vente additionnelle, pas d'abonnement caché). 
                                    L'objectif unique est de valider la méthodologie d'accompagnement par l'action.
                                </p>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Footer */}
                <footer className="mt-6 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                    Document Confidentiel • Popey Academy • {new Date().getFullYear()}
                </footer>
            </div>

            {/* --- PAGE 2 : DISPOSITIF PÉDAGOGIQUE --- */}
            <div className="w-[210mm] h-[297mm] bg-white p-8 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                
                {/* Header Page 2 */}
                <header className="flex justify-between items-end border-b-2 border-slate-200 pb-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">DÉTAIL DU DISPOSITIF</h2>
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Approche & Méthodologie</p>
                    </div>
                    <div className="text-right opacity-50">
                        <div className="text-xs font-bold text-slate-400 uppercase">Page 2/2</div>
                    </div>
                </header>

                <div className="flex-1 space-y-6">

                    {/* 1. Méthodologie "Action-First" */}
                    <section>
                        <h3 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wide border-l-4 border-orange-500 pl-3">
                            Méthodologie "Action-First"
                        </h3>
                        <p className="text-slate-700 text-sm leading-relaxed text-justify mb-3">
                            L'approche pédagogique repose sur l'inversion du modèle traditionnel. Au lieu d'apprendre pour faire, nous faisons pour apprendre. 
                            Chaque journée est structurée autour d'une <strong>mission concrète</strong> (ex: "Contacter 3 prospects", "Publier une offre", "Auditer ses finances").
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-50 p-3 rounded-lg text-center">
                                <div className="font-bold text-slate-900 mb-1 text-sm">10% Théorie</div>
                                <div className="text-[10px] text-slate-500">Briefing vidéo court</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg text-center">
                                <div className="font-bold text-slate-900 mb-1 text-sm">80% Pratique</div>
                                <div className="text-[10px] text-slate-500">Missions terrain</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg text-center">
                                <div className="font-bold text-slate-900 mb-1 text-sm">10% Feedback</div>
                                <div className="text-[10px] text-slate-500">Debrief binôme</div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Innovation Sociale : Le Binôme */}
                    <section>
                        <h3 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wide border-l-4 border-blue-500 pl-3">
                            Innovation Sociale : La Responsabilisation
                        </h3>
                        <div className="flex gap-4 items-start">
                            <div className="flex-1 text-slate-700 text-sm text-justify">
                                <p className="mb-2">
                                    L'isolement est le premier facteur d'échec chez les indépendants. 
                                    Le programme impose un système de <strong>Binôme Aléatoire</strong> (Buddy System).
                                </p>
                                <p>
                                    Chaque participant est jumelé avec un pair. Ils doivent se "rendre des comptes" quotidiennement via un système de validation croisée.
                                    Cela crée une obligation morale positive qui booste l'engagement de <strong>+300%</strong> par rapport à une formation e-learning seule.
                                </p>
                            </div>
                            <div className="w-1/3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <div className="text-center font-bold text-blue-900 mb-1 text-sm">Le Pacte</div>
                                <ul className="text-[10px] text-blue-800 space-y-1">
                                    <li>• Appel quotidien (5 min)</li>
                                    <li>• Validation des preuves</li>
                                    <li>• Soutien moral</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* 3. Programme Synthétique */}
                    <section>
                        <h3 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wide border-l-4 border-purple-500 pl-3">
                            Calendrier Prévisionnel
                        </h3>
                        <div className="space-y-2">
                            <div className="flex gap-3 items-center">
                                <div className="w-20 font-bold text-slate-400 text-xs">Jours 1-5</div>
                                <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                                    <strong>Phase 1 : Fondations & Mental</strong> — Définir son offre, casser ses croyances limitantes, s'engager publiquement.
                                </div>
                            </div>
                            <div className="flex gap-3 items-center">
                                <div className="w-20 font-bold text-slate-900 text-xs">Jours 6-10</div>
                                <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                                    <strong>Phase 2 : Visibilité & Prospection</strong> — Créer du contenu, contacter des prospects, gérer le rejet.
                                </div>
                            </div>
                            <div className="flex gap-3 items-center">
                                <div className="w-20 font-bold text-slate-400 text-xs">Jours 11-15</div>
                                <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                                    <strong>Phase 3 : Vente & Consolidation</strong> — Closer des clients, établir une routine pérenne, bilan.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 4. Résultats Attendus (KPI) */}
                    <section>
                        <h3 className="text-base font-bold text-slate-900 mb-2 uppercase tracking-wide border-l-4 border-green-500 pl-3">
                            Indicateurs de Réussite (KPI)
                        </h3>
                        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-slate-700">
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
                <footer className="mt-6 text-center text-[10px] text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-4">
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
                        zoom: 0.9;
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
