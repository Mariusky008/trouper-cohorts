"use client";

import { Calculator, PieChart, Users, CheckCircle2, Building2 } from "lucide-react";

export function BudgetViewer() {
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

            {/* --- PAGE UNIQUE : BUDGET --- */}
            <div className="w-[210mm] h-[297mm] bg-white p-16 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                
                {/* Header */}
                <header className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">PROPOSITION FINANCIÈRE</h1>
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">Modèle Économique & Coûts Pédagogiques</p>
                    </div>
                    <div className="text-right">
                        <div className="text-orange-600 font-black text-2xl tracking-tighter">POPEY</div>
                        <div className="text-xs font-bold text-slate-400 uppercase">Confidentiel</div>
                    </div>
                </header>

                <div className="flex-1 space-y-12">
                    
                    {/* 1. Coût Unitaire */}
                    <section className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 uppercase tracking-wide">
                                <Calculator className="text-slate-800" /> Coût Unitaire Cible
                            </h2>
                            <div className="text-right">
                                <div className="text-4xl font-black text-slate-900">2 200 € <span className="text-lg font-medium text-slate-500">HT</span></div>
                                <div className="text-xs text-slate-500 uppercase tracking-wide">Par participant / parcours complet</div>
                            </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed text-justify border-t border-slate-200 pt-4">
                            Ce tarif correspond à un parcours d'accompagnement intensif de <strong>30 heures</strong> (15 jours x 2h), incluant l'accès à la plateforme, 
                            l'animation de la cohorte, le support technique et le suivi pédagogique individualisé par le système de binôme supervisé.
                        </p>
                    </section>

                    {/* 2. Ventilation des Coûts */}
                    <section>
                        <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-6 uppercase tracking-wide">
                            <PieChart className="text-orange-600" /> Ventilation de la Valeur
                        </h2>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="border border-slate-200 p-5 rounded-xl text-center">
                                <div className="text-3xl font-black text-blue-600 mb-2">30%</div>
                                <div className="font-bold text-slate-900 text-sm mb-1">Ingénierie & Contenu</div>
                                <div className="text-xs text-slate-500">Conception, Vidéos, Outils</div>
                            </div>
                            <div className="border border-slate-200 p-5 rounded-xl text-center bg-orange-50 border-orange-100">
                                <div className="text-3xl font-black text-orange-600 mb-2">40%</div>
                                <div className="font-bold text-slate-900 text-sm mb-1">Animation & Suivi</div>
                                <div className="text-xs text-slate-500">Coaching, Support, Lives</div>
                            </div>
                            <div className="border border-slate-200 p-5 rounded-xl text-center">
                                <div className="text-3xl font-black text-purple-600 mb-2">30%</div>
                                <div className="font-bold text-slate-900 text-sm mb-1">Plateforme & Tech</div>
                                <div className="text-xs text-slate-500">Hébergement, Gamification</div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Simulation Cohorte */}
                    <section>
                        <h2 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-6 uppercase tracking-wide">
                            <Users className="text-green-600" /> Simulation Cohorte Standard
                        </h2>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="p-4">Poste</th>
                                        <th className="p-4">Détail</th>
                                        <th className="p-4 text-right">Total HT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="p-4 font-medium text-slate-900">Groupe Standard</td>
                                        <td className="p-4 text-slate-600">12 Participants x 2 200 €</td>
                                        <td className="p-4 text-right font-bold">26 400 €</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium text-slate-900">Groupe Étendu</td>
                                        <td className="p-4 text-slate-600">16 Participants x 2 200 €</td>
                                        <td className="p-4 text-right font-bold">35 200 €</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="bg-slate-50 p-4 text-xs text-slate-500 italic text-center border-t border-slate-200">
                                * Tarifs dégressifs possibles pour des engagements pluriannuels ou multi-cohortes.
                            </div>
                        </div>
                    </section>

                    {/* 4. Cadre Institutionnel */}
                    <section className="bg-white border-2 border-slate-900 p-6 rounded-xl mt-auto">
                        <div className="flex items-start gap-4">
                            <Building2 className="h-8 w-8 text-slate-900 mt-1" />
                            <div>
                                <h3 className="font-black text-slate-900 uppercase mb-2">Cadre Administratif & Qualiopi</h3>
                                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                                    L'action de formation peut être conventionnée et financée (AIF, CPF, OPCO) via notre partenaire organisme de formation certifié <strong>Qualiopi</strong>.
                                </p>
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-2 text-sm font-bold text-green-700">
                                        <CheckCircle2 className="h-4 w-4" /> Éligible Financement Public
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-bold text-green-700">
                                        <CheckCircle2 className="h-4 w-4" /> Suivi d'assiduité conforme
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                <footer className="mt-12 text-center text-xs text-slate-400 uppercase tracking-widest">
                    Document Confidentiel • Ne pas diffuser sans accord • {new Date().getFullYear()}
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
