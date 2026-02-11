"use client";

import { CheckCircle2, BookOpen, Users, Clock } from "lucide-react";

export function ProgrammeDetailleViewer({ templates }: { templates: any[] }) {
    // Grouper les jours par phases pour la logique progressive
    const phases = [
        { name: "Phase 1 : Fondations & Mental (J1-J5)", days: templates.filter(t => t.day_index <= 5) },
        { name: "Phase 2 : Visibilité & Prospection (J6-J10)", days: templates.filter(t => t.day_index > 5 && t.day_index <= 10) },
        { name: "Phase 3 : Vente & Consolidation (J11-J15)", days: templates.filter(t => t.day_index > 10) },
    ];

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

            {/* PAGE DE GARDE */}
            <div className="w-[210mm] h-[297mm] bg-white p-12 mx-auto mb-10 shadow-lg relative flex flex-col justify-center items-center text-center print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                <div className="mb-6 text-orange-600 font-black text-3xl tracking-tighter">POPEY ACADEMY</div>
                <h1 className="text-5xl font-black text-slate-900 mb-4 uppercase leading-tight">
                    Programme<br/>Pédagogique<br/>Détaillé
                </h1>
                <div className="w-24 h-2 bg-slate-900 mb-6"></div>
                <p className="text-xl text-slate-500 font-light max-w-xl">
                    Syllabus complet du dispositif "15 Jours pour Passer à l'Action".
                    Objectifs, Contenus et Modalités jour par jour.
                </p>
                <div className="mt-12 border border-slate-200 p-6 rounded-xl bg-slate-50 text-left max-w-md w-full">
                    <div className="flex justify-between border-b border-slate-200 pb-2 mb-2">
                        <span className="text-slate-500 uppercase text-xs font-bold">Durée</span>
                        <span className="font-bold text-slate-900 text-sm">15 Jours (105h estimées)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2 mb-2">
                        <span className="text-slate-500 uppercase text-xs font-bold">Public</span>
                        <span className="font-bold text-slate-900 text-sm">Demandeurs d'emploi / Indépendants</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 uppercase text-xs font-bold">Modalité</span>
                        <span className="font-bold text-slate-900 text-sm">Distanciel + 1 Binôme différent / jour</span>
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
                    <div className="border-b-4 border-slate-900 pb-2 mb-6">
                        <h2 className="text-2xl font-black text-slate-900 uppercase">{phase.name}</h2>
                        <p className="text-slate-500 text-xs mt-1">Logique Progressive • Semaine {index + 1}</p>
                    </div>

                    {/* Liste des Jours */}
                    <div className="flex-1 space-y-4">
                        {phase.days.map((day) => {
                             const steps = day.mission_step_templates || [];
                             const keyTasks = steps.slice(0, 5).map((s:any) => s.content.substring(0, 100) + (s.content.length > 100 ? '...' : ''));

                             return (
                                <div key={day.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 break-inside-avoid">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="bg-slate-900 text-white px-2 py-0.5 font-bold rounded text-xs">J{day.day_index}</span>
                                                <h3 className="text-sm font-bold text-slate-900 uppercase">{day.title}</h3>
                                            </div>
                                            <div className="mt-1 text-slate-600 italic text-xs border-l-2 border-orange-400 pl-2">
                                                Objectif : {day.description}
                                            </div>
                                        </div>
                                        <div className="text-right text-[10px] text-slate-400 font-mono">
                                            2h est.
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                                <BookOpen className="h-3 w-3" /> Travaux
                                            </h4>
                                            <ul className="text-xs text-slate-700 space-y-0.5 list-disc pl-3">
                                                {steps.length > 0 ? steps.map((s:any, i:number) => (
                                                    <li key={i} className="leading-tight">{s.content.split('\n')[0].substring(0, 60)}...</li>
                                                )) : <li className="italic text-slate-400">En cours...</li>}
                                            </ul>
                                        </div>
                                        <div className="border-l border-slate-200 pl-4">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                                <Users className="h-3 w-3" /> Modalités
                                            </h4>
                                            <ul className="text-[10px] text-slate-600 space-y-1">
                                                <li className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                    <span>Preuve visuelle</span>
                                                </li>
                                                <li className="flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-blue-600" />
                                                    <span>Validation Binôme</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                             );
                        })}
                    </div>

                    <footer className="mt-6 text-center text-[10px] text-slate-300 uppercase">
                        Page {index + 2} • Programme Détaillé Popey Academy
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
