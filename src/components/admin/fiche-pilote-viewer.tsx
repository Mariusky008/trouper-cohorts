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
            <div className="w-[210mm] h-[297mm] bg-white p-12 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break border-t-8 border-orange-500">
                
                {/* Header */}
                <header className="flex justify-between items-start mb-10">
                    <div>
                        <div className="bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-widest inline-block mb-3">
                            Appel à Participation
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 leading-none mb-2">FICHE PILOTE<br/>EXPÉRIMENTAL</h1>
                        <p className="text-slate-500 text-lg">Dispositif "Action Immédiate"</p>
                    </div>
                    <div className="text-right">
                        <div className="text-orange-600 font-black text-3xl tracking-tighter">POPEY</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Academy</div>
                    </div>
                </header>

                <div className="flex-1 space-y-10">

                    {/* 1. L'Objectif du Test */}
                    <section className="bg-slate-50 p-6 rounded-xl border-l-4 border-slate-900">
                        <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-3">
                            <Flag className="h-6 w-6 text-slate-700" /> Objectif du Test
                        </h2>
                        <p className="text-slate-700 leading-relaxed">
                            Valider l'efficacité d'un accompagnement <strong>100% action</strong> (sans cours théoriques) pour débloquer les demandeurs d'emploi en phase de création d'entreprise ou de freelancing, qui souffrent d'isolement et de procrastination.
                        </p>
                    </section>

                    {/* 2. Format & Cible */}
                    <section className="grid grid-cols-2 gap-6">
                        <div className="border border-slate-200 p-5 rounded-xl">
                            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4 text-sm uppercase">
                                <CalendarDays className="h-5 w-5 text-blue-600" /> Format
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>Durée</span>
                                    <strong>15 Jours</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>Rythme</span>
                                    <strong>1h30 / jour</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>Lieu</span>
                                    <strong>Distanciel</strong>
                                </li>
                            </ul>
                        </div>
                        <div className="border border-slate-200 p-5 rounded-xl">
                            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-4 text-sm uppercase">
                                <Users className="h-5 w-5 text-purple-600" /> Participants
                            </h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex justify-between border-b border-slate-100 pb-1">
                                    <span>Cohorte</span>
                                    <strong>12 à 16 Personnes</strong>
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
                        <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                            <ArrowRight className="h-6 w-6 text-orange-600" /> Ce que nous demandons (Orientation)
                        </h2>
                        <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 text-orange-900 text-sm leading-relaxed">
                            <p className="font-bold mb-2">Nous recherchons des volontaires "motivés mais bloqués".</p>
                            <p>
                                Idéalement, des profils qui ont déjà une idée ou un statut, mais qui n'arrivent pas à passer à l'action commerciale (syndrome de l'imposteur, peur du téléphone, perfectionnisme). 
                                Pas besoin de pré-requis techniques. Juste l'envie de jouer le jeu.
                            </p>
                        </div>
                    </section>

                    {/* 4. La Promesse (Livrables) */}
                    <section>
                        <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-4">
                            <ClipboardCheck className="h-6 w-6 text-green-600" /> Ce que nous vous fournissons (Bilan)
                        </h2>
                        <ul className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                            <li className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                                <span className="text-green-600 font-bold">✓</span>
                                Bilan individuel de fin de parcours.
                            </li>
                            <li className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                                <span className="text-green-600 font-bold">✓</span>
                                Statistiques globales de la cohorte.
                            </li>
                            <li className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                                <span className="text-green-600 font-bold">✓</span>
                                Témoignages qualitatifs (verbatims).
                            </li>
                            <li className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                                <span className="text-green-600 font-bold">✓</span>
                                Mesure de l'impact sur la confiance.
                            </li>
                        </ul>
                    </section>

                </div>

                {/* Footer Contact */}
                <footer className="mt-12 pt-6 border-t-2 border-slate-900 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-slate-900 uppercase text-sm">Contact Référent</div>
                        <div className="text-slate-600">Jean-Philippe • Fondateur</div>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-slate-900 uppercase text-sm">Prochaine Cohorte</div>
                        <div className="text-orange-600 font-bold">Inscriptions Ouvertes</div>
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
