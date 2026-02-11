"use client";

import { Brain, Video, Users, CalendarDays, Target } from "lucide-react";

export function CatalogueViewer({ templates }: { templates: any[] }) {
    // Force update trigger v2
    return (
        <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0 font-sans">
            
            {/* Bouton d'impression (Masqué à l'impression) */}
            <div className="fixed top-6 right-6 z-50 print:hidden flex flex-col gap-2 items-end">
                <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">DEBUG: {new Date().toLocaleTimeString()}</div>
                <button 
                    onClick={() => window.print()} 
                    className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm uppercase tracking-wider"
                >
                    🖨️ Imprimer / PDF
                </button>
            </div>

            {/* PAGE DE COUVERTURE */}
            <div className="w-[210mm] h-[297mm] bg-red-900 text-white p-16 mx-auto mb-10 shadow-2xl relative flex flex-col justify-between print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                <div className="space-y-4">
                    <div className="text-orange-500 font-black text-6xl tracking-tighter">POPEY</div>
                    <div className="text-2xl font-light tracking-widest uppercase opacity-80">Academy</div>
                </div>

                <div className="space-y-8 relative z-10">
                    <h1 className="text-8xl font-black leading-[0.9]">
                        PROGRAMME<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                            INTENSIF
                        </span>
                    </h1>
                    <div className="w-32 h-2 bg-orange-500"></div>
                    <p className="text-2xl font-light text-slate-300 max-w-2xl leading-relaxed mt-8">
                        15 jours pour passer de l'invisibilité à l'action.
                        Un parcours structuré pour les indépendants qui veulent sortir du lot.
                    </p>
                </div>

                {/* Motif de fond abstrait */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-slate-800 to-transparent rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex justify-between items-end border-t border-slate-800 pt-8 relative z-10">
                    <div>
                        <div className="text-sm text-slate-500 uppercase tracking-widest mb-1">Catalogue Officiel</div>
                        <div className="font-bold text-xl">{new Date().getFullYear()} Edition</div>
                    </div>
                    <div className="text-right">
                        <div className="text-6xl font-black text-slate-800">15 JOURS</div>
                    </div>
                </div>
            </div>

            {/* PAGES JOUR PAR JOUR */}
            {templates.map((day) => {
                const steps = day.mission_step_templates || [];
                const intellectualSteps = steps.filter((s: any) => s.category === 'intellectual');
                const creativeSteps = steps.filter((s: any) => s.category === 'creative');
                const socialSteps = steps.filter((s: any) => s.category === 'social');
                const eventSteps = steps.filter((s: any) => s.category === 'event');

                return (
                    <div key={day.id} className="w-[210mm] h-[297mm] bg-white p-12 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break overflow-hidden">
                        
                        {/* Header Jour */}
                        <div className="flex justify-between items-start mb-8 border-b-4 border-slate-900 pb-6">
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="bg-slate-900 text-white px-4 py-1 font-black text-xl rounded-sm">J{day.day_index}</span>
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Programme Popey</span>
                                </div>
                                <h2 className="text-5xl font-black text-slate-900 uppercase italic leading-none mt-4 max-w-2xl">
                                    {day.title}
                                </h2>
                            </div>
                            <div className="text-right absolute top-12 right-12 opacity-10 pointer-events-none">
                                <div className="text-[180px] font-black text-slate-900 leading-none">
                                    {day.day_index < 10 ? `0${day.day_index}` : day.day_index}
                                </div>
                            </div>
                        </div>

                        {/* Description / Intention */}
                        <div className="mb-10 relative z-10">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-2">
                                <Target className="h-4 w-4" /> Intention du jour
                            </h3>
                            <p className="text-xl text-slate-700 font-medium leading-relaxed italic border-l-4 border-orange-500 pl-6 py-2 bg-orange-50/50 rounded-r-lg">
                                "{day.description}"
                            </p>
                        </div>

                        {/* Les 4 Piliers - Grid Layout */}
                        <div className="grid grid-cols-2 gap-6 flex-1 content-start relative z-10">
                            
                            {/* Bloc Intellectuel */}
                            <div className={`bg-slate-50 p-6 rounded-xl border border-slate-100 ${intellectualSteps.length === 0 ? 'opacity-30 grayscale' : ''}`}>
                                <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-4 uppercase text-xs tracking-widest border-b border-blue-100 pb-2">
                                    <Brain className="h-4 w-4 text-blue-500" /> Intellectuel & Admin
                                </h4>
                                {intellectualSteps.length > 0 ? (
                                    <ul className="space-y-3">
                                        {intellectualSteps.sort((a: any, b: any) => a.position - b.position).map((step: any) => (
                                            <li key={step.id} className="text-sm text-slate-700 leading-snug flex gap-2">
                                                <span className="text-blue-400 font-bold">•</span> {step.content}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-xs text-slate-400 italic">Aucune tâche assignée.</p>}
                            </div>

                            {/* Bloc Créatif */}
                            <div className={`bg-slate-50 p-6 rounded-xl border border-slate-100 ${creativeSteps.length === 0 ? 'opacity-30 grayscale' : ''}`}>
                                <h4 className="font-bold text-purple-900 flex items-center gap-2 mb-4 uppercase text-xs tracking-widest border-b border-purple-100 pb-2">
                                    <Video className="h-4 w-4 text-purple-500" /> Créatif & Contenu
                                </h4>
                                {creativeSteps.length > 0 ? (
                                    <ul className="space-y-3">
                                        {creativeSteps.sort((a: any, b: any) => a.position - b.position).map((step: any) => (
                                            <li key={step.id} className="text-sm text-slate-700 leading-snug flex gap-2">
                                                <span className="text-purple-400 font-bold">•</span> {step.content}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-xs text-slate-400 italic">Aucune tâche assignée.</p>}
                            </div>

                            {/* Bloc Social */}
                            <div className={`bg-slate-50 p-6 rounded-xl border border-slate-100 ${socialSteps.length === 0 ? 'opacity-30 grayscale' : ''}`}>
                                <h4 className="font-bold text-orange-900 flex items-center gap-2 mb-4 uppercase text-xs tracking-widest border-b border-orange-100 pb-2">
                                    <Users className="h-4 w-4 text-orange-500" /> Social & Live
                                </h4>
                                {socialSteps.length > 0 ? (
                                    <ul className="space-y-3">
                                        {socialSteps.sort((a: any, b: any) => a.position - b.position).map((step: any) => (
                                            <li key={step.id} className="text-sm text-slate-700 leading-snug flex gap-2">
                                                <span className="text-orange-400 font-bold">•</span> {step.content}
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-xs text-slate-400 italic">Aucune tâche assignée.</p>}
                            </div>

                            {/* Bloc Événement (Prend 2 colonnes si présent) */}
                            {eventSteps.length > 0 && (
                                <div className="bg-red-50 p-6 rounded-xl border border-red-100 col-span-2 shadow-sm">
                                    <h4 className="font-bold text-red-900 flex items-center gap-2 mb-4 uppercase text-xs tracking-widest border-b border-red-200 pb-2">
                                        <CalendarDays className="h-4 w-4 text-red-600" /> Événement / Action Phare
                                    </h4>
                                    <ul className="space-y-3">
                                        {eventSteps.sort((a: any, b: any) => a.position - b.position).map((step: any) => (
                                            <li key={step.id} className="text-sm text-slate-900 font-medium leading-snug flex gap-2 items-start">
                                                <span className="text-red-500 font-bold mt-0.5">➜</span> 
                                                <span>{step.content}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>

                        {/* Footer Page */}
                        <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">POPEY</span> ACADEMY
                            </div>
                            <div>Jour {day.day_index} / 15</div>
                        </div>
                    </div>
                );
            })}
            
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        background: white;
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
