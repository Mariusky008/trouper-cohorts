"use client";

import { Flag, Users, ClipboardCheck, CalendarDays, ArrowRight } from "lucide-react";

export function FichePiloteViewer() {
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

            {/* --- PAGE UNIQUE : FICHE PILOTE --- */}
            <div className="w-[210mm] h-[297mm] bg-white p-6 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break border-t-8 border-orange-500">
                
                {/* Header */}
                <header className="flex justify-between items-start mb-4">
                    <div>
                        <div className="bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-widest inline-block mb-2">
                            Appel à Participation
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 leading-none mb-1">FICHE PILOTE<br/>EXPÉRIMENTAL</h1>
                        <p className="text-slate-500 text-base">Dispositif "Action Immédiate"</p>
                    </div>
                    <div className="text-right">
                        <div className="text-orange-600 font-black text-2xl tracking-tighter">POPEY</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Academy</div>
                    </div>
                </header>

                <div className="flex-1 space-y-4">

                    {/* 1. L'Objectif du Test */}
                    <section className="bg-slate-50 p-3 rounded-xl border-l-4 border-slate-900">
                        <h2 className="flex items-center gap-3 text-base font-bold text-slate-900 mb-1">
                            <Flag className="h-4 w-4 text-slate-700" /> Objectif du Test
                        </h2>
                        <p className="text-slate-700 text-xs leading-relaxed">
                            Valider l'efficacité d'un accompagnement <strong>100% action</strong> (sans cours théoriques) pour débloquer les demandeurs d'emploi en phase de création d'entreprise ou de freelancing, qui souffrent d'isolement et de procrastination.
                        </p>
                    </section>

                    {/* 2. Format & Cible */}
                    <section className="grid grid-cols-2 gap-3">
                        <div className="border border-slate-200 p-3 rounded-xl">
                            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-2 text-xs uppercase">
                                <CalendarDays className="h-4 w-4 text-blue-600" /> Format
                            </h3>
                            <ul className="space-y-1 text-xs text-slate-600">
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>Durée</span>
                                    <strong>15 Jours (60h)</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>Rythme</span>
                                    <strong>4h00 / jour + échange binôme</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>Lieu</span>
                                    <strong>Distanciel</strong>
                                </li>
                            </ul>
                        </div>
                        <div className="border border-slate-200 p-3 rounded-xl">
                            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-2 text-xs uppercase">
                                <Users className="h-4 w-4 text-purple-600" /> Participants
                            </h3>
                            <ul className="space-y-1 text-xs text-slate-600">
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>Cohorte</span>
                                    <strong>18 à 24 Personnes</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>Profil</span>
                                    <strong>Indépendants</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>État</span>
                                    <strong>Lancé ou en projet</strong>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* 3. La Demande (Orientation) */}
                    <section>
                        <h2 className="flex items-center gap-3 text-base font-bold text-slate-900 mb-2">
                            <ArrowRight className="h-4 w-4 text-orange-600" /> Ce que nous demandons (Orientation)
                        </h2>
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-orange-900 text-xs leading-relaxed">
                            <p className="font-bold mb-1">Nous recherchons des volontaires "motivés mais bloqués".</p>
                            <p>
                                Idéalement, des profils qui ont déjà une idée ou un statut, mais qui n'arrivent pas à passer à l'action commerciale (syndrome de l'imposteur, peur du téléphone, perfectionnisme). 
                                Pas besoin de pré-requis techniques. Juste l'envie de jouer le jeu.
                            </p>
                        </div>
                    </section>

                    {/* 4. La Promesse (Livrables) */}
                    <section>
                        <h2 className="flex items-center gap-3 text-base font-bold text-slate-900 mb-2">
                            <ClipboardCheck className="h-4 w-4 text-green-600" /> Ce que nous vous fournissons (Bilan)
                        </h2>
                        <ul className="grid grid-cols-1 gap-2 text-xs text-slate-700">
                            <li className="flex items-start gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="text-green-600 font-bold mt-0.5 text-base">✓</span>
                                <div>
                                    <strong className="text-slate-900 text-xs">Bilan individuel de fin de parcours</strong>
                                    <p className="text-slate-600 mt-0.5 leading-snug text-[11px]">
                                        Une fiche de synthèse détaillée par participant incluant l'assiduité, les Soft Skills activés durant les challenges, et la validation concrète des compétences entrepreneuriales mises en œuvre.
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="text-green-600 font-bold mt-0.5 text-base">✓</span>
                                <div>
                                    <strong className="text-slate-900 text-xs">Statistiques globales de la cohorte</strong>
                                    <p className="text-slate-600 mt-0.5 leading-snug text-[11px]">
                                        Un reporting quantitatif précis : taux de passage à l'action quotidien, volume de démarches effectuées, et indicateurs clés de performance (KPI) du groupe entier.
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="text-green-600 font-bold mt-0.5 text-base">✓</span>
                                <div>
                                    <strong className="text-slate-900 text-xs">Témoignages qualitatifs (verbatims)</strong>
                                    <p className="text-slate-600 mt-0.5 leading-snug text-[11px]">
                                        Un recueil des retours d'expérience bruts et authentiques des participants pour alimenter vos rapports d'impact qualitatifs et votre communication interne.
                                    </p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="text-green-600 font-bold mt-0.5 text-base">✓</span>
                                <div>
                                    <strong className="text-slate-900 text-xs">Mesure de l'impact sur la confiance</strong>
                                    <p className="text-slate-600 mt-0.5 leading-snug text-[11px]">
                                        Une évaluation comparative "Avant / Après" focalisée sur l'évolution de la posture professionnelle, le sentiment de légitimité et la levée des freins psychologiques.
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </section>

                </div>

                {/* Footer Contact */}
                <footer className="mt-4 pt-3 border-t-2 border-slate-900 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-slate-900 uppercase text-[10px]">Contact Référent</div>
                        <div className="text-slate-600 text-[10px]">Jean-Philippe • Fondateur</div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-slate-900 uppercase text-[10px]">Prochaine Cohorte</div>
                        <div className="text-orange-600 font-bold text-[10px]">Inscriptions Ouvertes</div>
                    </div>
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
