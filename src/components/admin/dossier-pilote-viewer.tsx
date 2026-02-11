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
