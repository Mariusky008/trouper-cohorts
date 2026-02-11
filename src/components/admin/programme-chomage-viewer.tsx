"use client";

import { CheckCircle2, BookOpen, Users, Clock, Target, Zap, Search, PenTool, MessageCircle, Video, Brain } from "lucide-react";
import { programmeChomageData } from "@/data/programme-chomage-data";

export function ProgrammeChomageViewer() {
    // Grouper les jours par phases (similaire au programme détaillé)
    const phases = [
        { name: "Phase 1 : De l'Inaction à la Clarté (J1-J4)", days: programmeChomageData.filter(t => t.day_index <= 4) },
        { name: "Phase 2 : De l'Idée à l'Offre (J5-J9)", days: programmeChomageData.filter(t => t.day_index > 4 && t.day_index <= 9) },
        { name: "Phase 3 : De l'Offre à la Réalité (J10-J14)", days: programmeChomageData.filter(t => t.day_index > 9) },
    ];

    return (
        <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0 font-sans">
            
            {/* Bouton d'impression */}
            <div className="fixed top-6 right-6 z-50 print:hidden">
                <button 
                    onClick={() => window.print()} 
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm uppercase tracking-wider"
                >
                    🖨️ Imprimer / PDF
                </button>
            </div>

            {/* PAGE DE GARDE */}
            <div className="w-[210mm] h-[297mm] bg-white p-12 mx-auto mb-10 shadow-lg relative flex flex-col justify-center items-center text-center print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break border-t-8 border-blue-600">
                <div className="mb-6 text-blue-600 font-black text-3xl tracking-tighter">POPEY ACADEMY</div>
                <h1 className="text-5xl font-black text-slate-900 mb-4 uppercase leading-tight">
                    Programme<br/>Retour à l'Emploi<br/>& Création
                </h1>
                <div className="w-24 h-2 bg-slate-900 mb-6"></div>
                <p className="text-xl text-slate-500 font-light max-w-xl">
                    Parcours intensif de 15 jours pour structurer son projet professionnel.
                    De l'introspection à l'action concrète.
                </p>
                <div className="mt-12 border border-slate-200 p-6 rounded-xl bg-slate-50 text-left max-w-md w-full">
                    <div className="flex justify-between border-b border-slate-200 pb-2 mb-2">
                        <span className="text-slate-500 uppercase text-xs font-bold">Durée</span>
                        <span className="font-bold text-slate-900 text-sm">15 Jours (60h estimées)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2 mb-2">
                        <span className="text-slate-500 uppercase text-xs font-bold">Public</span>
                        <span className="font-bold text-slate-900 text-sm">Chercheurs d'emploi / Reconversion</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 uppercase text-xs font-bold">Modalité</span>
                        <span className="font-bold text-slate-900 text-sm">Distanciel + Binôme Quotidien</span>
                    </div>
                </div>
                <footer className="absolute bottom-12 text-slate-400 text-[10px] uppercase tracking-widest">
                    Document Pédagogique Officiel • {new Date().getFullYear()}
                </footer>
            </div>

            {/* PAGES DE CONTENU (Par Phase) */}
            {phases.map((phase, index) => (
                <div key={index} className="w-[210mm] min-h-[297mm] bg-white p-8 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:min-h-screen break-after-page page-break">
                    
                    {/* Header Phase */}
                    <div className="border-b-4 border-blue-900 pb-2 mb-6">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">{phase.name}</h2>
                        <p className="text-slate-500 text-xs mt-1">Logique Progressive • Semaine {index + 1}</p>
                    </div>

                    {/* Liste des Jours */}
                    <div className="flex-1 space-y-4">
                        {phase.days.map((day) => {
                             const steps = day.mission_step_templates || [];
                             // On sépare les actes en 2 colonnes
                             const col1 = steps.slice(0, 3); // Actes 1-3
                             const col2 = steps.slice(3, 6); // Actes 4-6

                             return (
                                <div key={day.day_index} className="bg-slate-50 border border-slate-200 rounded-lg p-4 break-inside-avoid">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-blue-900 text-white px-2 py-0.5 font-bold rounded text-xs">J{day.day_index}</span>
                                                <h3 className="text-sm font-bold text-slate-900 uppercase">{day.title}</h3>
                                            </div>
                                            <div className="mt-1 text-slate-600 italic text-xs border-l-2 border-blue-400 pl-2">
                                                Thème : "{day.description}"
                                            </div>
                                        </div>
                                        <div className="text-right text-[10px] text-slate-400 font-mono">
                                            4h est.
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        {/* Colonne 1 : Introspection & Outils */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-blue-800 uppercase mb-1 flex items-center gap-1">
                                                <Brain className="h-3 w-3" /> Introspection & Outils
                                            </h4>
                                            <ul className="text-[10px] text-slate-700 space-y-2">
                                                {col1.map((s, i) => (
                                                    <li key={i} className="bg-white p-1.5 rounded border border-slate-100 shadow-sm">
                                                        <strong className="block text-blue-700 text-[9px] uppercase mb-0.5">{s.title}</strong>
                                                        <div className="line-clamp-3">{s.content.split('\n')[0]}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        {/* Colonne 2 : Action & Ancrage */}
                                        <div className="border-l border-slate-200 pl-4">
                                            <h4 className="text-[10px] font-bold text-orange-800 uppercase mb-1 flex items-center gap-1">
                                                <Zap className="h-3 w-3" /> Action & Validation
                                            </h4>
                                            <ul className="text-[10px] text-slate-700 space-y-2">
                                                {col2.map((s, i) => (
                                                    <li key={i} className="bg-white p-1.5 rounded border border-slate-100 shadow-sm">
                                                        <strong className="block text-orange-700 text-[9px] uppercase mb-0.5">{s.title}</strong>
                                                        <div className="line-clamp-3">{s.content.split('\n')[0]}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                             );
                        })}
                    </div>

                    <footer className="mt-6 text-center text-[10px] text-slate-300 uppercase">
                        Page {index + 2} • Programme Retour à l'Emploi Popey Academy
                    </footer>
                </div>
            ))}
            
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
                    .break-inside-avoid {
                        break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
