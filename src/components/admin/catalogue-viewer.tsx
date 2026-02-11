"use client";

import { Brain, Video, Users, CalendarDays, Target } from "lucide-react";
import React from "react";

// Helper pour formater le texte avec sauts de lignes et listes
const formatText = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
        // Détection simple des listes
        if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
            return <li key={i} className="ml-4 list-disc pl-2 mb-1">{line.replace(/^[-•]\s*/, '')}</li>
        }
        // Paragraphes normaux
        return <p key={i} className="mb-2 last:mb-0">{line}</p>
    });
};

export function CatalogueViewer({ templates }: { templates: any[] }) {
    return (
        <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0 font-sans">
            
            {/* Bouton d'impression */}
            <div className="fixed top-6 right-6 z-50 print:hidden flex flex-col gap-2 items-end">
                <button 
                    onClick={() => window.print()} 
                    className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm uppercase tracking-wider"
                >
                    🖨️ Imprimer / PDF
                </button>
            </div>

            {/* PAGE DE COUVERTURE (Reste identique) */}
            <div className="w-[210mm] h-[297mm] bg-slate-900 text-white p-16 mx-auto mb-10 shadow-2xl relative flex flex-col justify-between print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
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

            {/* BOUCLE DES JOURS (2 PAGES PAR JOUR) */}
            {templates.map((day) => {
                const steps = day.mission_step_templates || [];
                const intellectualSteps = steps.filter((s: any) => s.category === 'intellectual');
                const creativeSteps = steps.filter((s: any) => s.category === 'creative');
                const socialSteps = steps.filter((s: any) => s.category === 'social');
                const eventSteps = steps.filter((s: any) => s.category === 'event');

                return (
                    <React.Fragment key={day.id}>
                        
                        {/* --- PAGE 1 : L'ESPRIT (Intention) --- */}
                        <div className="w-[210mm] h-[297mm] bg-slate-900 text-white p-16 mx-auto mb-10 shadow-lg relative flex flex-col justify-center items-center text-center print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break overflow-hidden">
                            
                            {/* Numéro du jour en fond */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] font-black text-slate-800 opacity-20 pointer-events-none select-none">
                                {day.day_index}
                            </div>

                            <div className="relative z-10 space-y-12 max-w-3xl">
                                <div className="inline-block bg-orange-500 text-white px-6 py-2 font-bold uppercase tracking-widest rounded-full mb-4">
                                    Jour {day.day_index}
                                </div>
                                
                                <h2 className="text-6xl font-black uppercase leading-tight">
                                    {day.title}
                                </h2>
                                
                                <div className="w-24 h-1 bg-white mx-auto opacity-50"></div>

                                <blockquote className="text-3xl font-light italic leading-relaxed text-slate-300">
                                    "{day.description}"
                                </blockquote>
                            </div>

                            <div className="absolute bottom-12 text-slate-500 text-sm uppercase tracking-widest">
                                Popey Academy • Intention & Focus
                            </div>
                        </div>


                        {/* --- PAGE 2 : L'ACTION (Les 4 Piliers - Flux Libre) --- */}
                        <div className="w-[210mm] min-h-[297mm] bg-white p-12 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-auto print:overflow-visible break-after-page page-break">
                            
                            {/* Header Page 2 */}
                            <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase">Feuille de Route</h3>
                                    <div className="print:hidden text-[10px] text-red-500 font-mono mt-1">
                                        DEBUG CATS: {steps.map((s:any) => s.category || 'null').join(', ')}
                                    </div>
                                </div>
                                <div className="text-slate-400 font-bold">J{day.day_index} • {day.title}</div>
                            </div>

                            {/* Liste Verticale (Full Width) */}
                            <div className="flex flex-col gap-8 pb-8">
                                
                                {/* Bloc Intellectuel */}
                                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col break-inside-avoid">
                                    <h4 className="font-black text-blue-900 flex items-center gap-3 mb-4 uppercase text-sm tracking-widest border-b border-blue-200 pb-4">
                                        <div className="p-2 bg-blue-100 rounded-lg"><Brain className="h-5 w-5 text-blue-600" /></div>
                                        Intellectuel & Admin
                                    </h4>
                                    <div className="text-sm text-slate-700 leading-relaxed">
                                        {intellectualSteps.length > 0 ? (
                                            <ul className="space-y-4">
                                                {intellectualSteps.sort((a: any, b: any) => a.position - b.position).map((step: any) => (
                                                    <li key={step.id} className="flex gap-3">
                                                        <span className="text-blue-500 font-bold text-lg leading-none">•</span>
                                                        <div>{formatText(step.content)}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-slate-400 italic">Rien à signaler.</p>}
                                    </div>
                                </div>

                                {/* Bloc Créatif */}
                                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col break-inside-avoid">
                                    <h4 className="font-black text-purple-900 flex items-center gap-3 mb-4 uppercase text-sm tracking-widest border-b border-purple-200 pb-4">
                                        <div className="p-2 bg-purple-100 rounded-lg"><Video className="h-5 w-5 text-purple-600" /></div>
                                        Créatif & Contenu
                                    </h4>
                                    <div className="text-sm text-slate-700 leading-relaxed">
                                        {creativeSteps.length > 0 ? (
                                            <ul className="space-y-4">
                                                {creativeSteps.sort((a: any, b: any) => a.position - b.position).map((step: any) => (
                                                    <li key={step.id} className="flex gap-3">
                                                        <span className="text-purple-500 font-bold text-lg leading-none">•</span>
                                                        <div>{formatText(step.content)}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-slate-400 italic">Rien à signaler.</p>}
                                    </div>
                                </div>

                                {/* Bloc Social */}
                                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 flex flex-col break-inside-avoid">
                                    <h4 className="font-black text-orange-900 flex items-center gap-3 mb-4 uppercase text-sm tracking-widest border-b border-orange-200 pb-4">
                                        <div className="p-2 bg-orange-100 rounded-lg"><Users className="h-5 w-5 text-orange-600" /></div>
                                        Social & Live
                                    </h4>
                                    <div className="text-sm text-slate-700 leading-relaxed">
                                        {socialSteps.length > 0 ? (
                                            <ul className="space-y-4">
                                                {socialSteps.sort((a: any, b: any) => a.position - b.position).map((step: any) => (
                                                    <li key={step.id} className="flex gap-3">
                                                        <span className="text-orange-500 font-bold text-lg leading-none">•</span>
                                                        <div>{formatText(step.content)}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-slate-400 italic">Rien à signaler.</p>}
                                    </div>
                                </div>

                                {/* Bloc Événement */}
                                <div className={`bg-red-50 p-8 rounded-2xl border border-red-100 flex flex-col break-inside-avoid ${eventSteps.length === 0 ? 'opacity-50 grayscale' : ''}`}>
                                    <h4 className="font-black text-red-900 flex items-center gap-3 mb-4 uppercase text-sm tracking-widest border-b border-red-200 pb-4">
                                        <div className="p-2 bg-red-100 rounded-lg"><CalendarDays className="h-5 w-5 text-red-600" /></div>
                                        Événement / Action
                                    </h4>
                                    <div className="text-sm text-slate-700 leading-relaxed">
                                        {eventSteps.length > 0 ? (
                                            <ul className="space-y-4">
                                                {eventSteps.sort((a: any, b: any) => a.position - b.position).map((step: any) => (
                                                    <li key={step.id} className="flex gap-3">
                                                        <span className="text-red-500 font-bold text-lg leading-none">➜</span>
                                                        <div className="font-medium text-slate-900">{formatText(step.content)}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-slate-400 italic">Aucun événement majeur.</p>}
                                    </div>
                                </div>

                            </div>
                        </div>

                    </React.Fragment>
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
