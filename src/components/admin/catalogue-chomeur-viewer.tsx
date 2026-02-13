"use client";

import { Brain, Zap, Users, Search, PenTool, MessageCircle, Video, CheckCircle2 } from "lucide-react";
import React from "react";
import { programmeChomageData } from "@/data/programme-chomage-data";

// --- FORMATAGE AVANCÉ DU TEXTE ---
const highlightKeywords = (text: string) => {
    if (!text) return null;
    
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-black text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const formatText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, i) => {
        const cleanLine = line.trim();
        if (!cleanLine) return <div key={i} className="h-2" />;

        if (cleanLine.length < 80 && (cleanLine.endsWith(':') || cleanLine.endsWith('?') || cleanLine.includes("Règle d'or"))) {
             return (
                <h4 key={i} className="font-black text-xs text-slate-900 mt-3 mb-1 uppercase tracking-wide border-l-2 border-slate-900 pl-2 bg-slate-100 py-0.5 rounded-r break-after-avoid">
                    {cleanLine}
                </h4>
            );
        }

        if (cleanLine.match(/^([0-9]+[.)]|1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|-|•|⚠️|👉|💡|🔥|🚀)/)) {
             return (
                <div key={i} className="flex gap-2 mb-1 pl-1 items-start">
                     <span className="font-bold text-slate-900 mt-0.5 text-sm leading-none select-none">👉</span>
                     <div className="text-slate-700 text-xs font-medium leading-relaxed w-full">
                        {highlightKeywords(cleanLine.replace(/^([-•]|[0-9]+[.)]|1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|⚠️|👉|💡|🔥|🚀)\s*/, ''))}
                     </div>
                </div>
             );
        }

        return (
            <div key={i} className="mb-1 text-xs text-slate-600 leading-relaxed">
                {highlightKeywords(cleanLine)}
            </div>
        );
    });
};

export function CatalogueChomeurViewer() {
    return (
        <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0 font-sans">
            
            {/* Bouton d'impression */}
            <div className="fixed top-6 right-6 z-50 print:hidden flex flex-col gap-2 items-end">
                <button 
                    onClick={() => window.print()} 
                    className="bg-blue-900 text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm uppercase tracking-wider"
                >
                    🖨️ Imprimer / PDF
                </button>
            </div>

            {/* PAGE DE COUVERTURE */}
            <div className="w-[210mm] h-[297mm] bg-blue-900 text-white p-16 mx-auto mb-10 shadow-2xl relative flex flex-col justify-between print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                <div className="space-y-4">
                    <div className="text-white font-black text-6xl tracking-tighter">POPEY</div>
                    <div className="text-2xl font-light tracking-widest uppercase opacity-80">Academy</div>
                </div>
                <div className="space-y-8 relative z-10">
                    <h1 className="text-7xl font-black leading-[0.9]">
                        PROGRAMME<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                            RETOUR À L'EMPLOI
                        </span>
                    </h1>
                    <div className="w-32 h-2 bg-blue-500"></div>
                    <p className="text-2xl font-light text-blue-200 max-w-2xl leading-relaxed mt-8">
                        15 jours pour structurer son avenir professionnel.
                        Psychologie, Maturité, Outils & Action.
                    </p>
                </div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-800 to-transparent rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex justify-between items-end border-t border-blue-800 pt-8 relative z-10">
                    <div>
                        <div className="text-sm text-blue-400 uppercase tracking-widest mb-1">Catalogue Officiel</div>
                        <div className="font-bold text-xl">{new Date().getFullYear()} Edition</div>
                    </div>
                    <div className="text-right">
                        <div className="text-6xl font-black text-blue-800">15 JOURS</div>
                    </div>
                </div>
            </div>

            {/* BOUCLE DES JOURS (2 PAGES PAR JOUR) */}
            {programmeChomageData.map((day) => {
                const acts = day.mission_step_templates;

                return (
                    <React.Fragment key={day.day_index}>
                        
                        {/* --- PAGE 1 : L'ESPRIT (Intention) --- */}
                        <div className="w-[210mm] h-[297mm] bg-blue-900 text-white p-16 mx-auto mb-10 shadow-lg relative flex flex-col justify-center items-center text-center print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break overflow-hidden">
                            
                            {/* Numéro du jour en fond */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] font-black text-blue-950 opacity-40 pointer-events-none select-none">
                                {day.day_index}
                            </div>

                            <div className="relative z-10 space-y-12 max-w-3xl">
                                <div className="inline-block bg-blue-500 text-white px-6 py-2 font-bold uppercase tracking-widest rounded-full mb-4">
                                    Jour {day.day_index}
                                </div>
                                
                                <h2 className="text-6xl font-black uppercase leading-tight">
                                    {day.title}
                                </h2>
                                
                                <div className="w-24 h-1 bg-white mx-auto opacity-50"></div>

                                <blockquote className="text-3xl font-light italic leading-relaxed text-blue-200">
                                    "{day.description}"
                                </blockquote>
                            </div>

                            <div className="absolute bottom-12 text-blue-500 text-sm uppercase tracking-widest">
                                Popey Academy • Intention & Focus
                            </div>
                        </div>


                        {/* --- PAGE 2 : L'ACTION (Les 6 Actes) --- */}
                        <div className="w-[210mm] min-h-[297mm] bg-white p-10 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-auto print:overflow-visible break-after-page page-break">
                            
                            {/* Header Page 2 */}
                            <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                                <h3 className="text-2xl font-black text-slate-900 uppercase">Les 6 Actes du Jour</h3>
                                <div className="text-slate-400 font-bold">J{day.day_index} • {day.title}</div>
                            </div>

                            {/* Grille 2 colonnes x 3 lignes = 6 blocs */}
                            <div className="grid grid-cols-2 gap-6 pb-4">
                                
                                {/* ACTE 1 : TENSION (Rouge) */}
                                <div className="bg-red-50 p-5 rounded-xl border border-red-100 flex flex-col break-inside-avoid">
                                    <h4 className="font-black text-red-900 flex items-center gap-2 mb-2 uppercase text-xs tracking-widest border-b border-red-200 pb-2">
                                        <div className="p-1 bg-red-100 rounded"><Zap className="h-4 w-4 text-red-600" /></div>
                                        Acte 1 : {acts[0]?.title}
                                    </h4>
                                    <div className="text-xs text-slate-700 leading-relaxed">
                                        {formatText(acts[0]?.content)}
                                    </div>
                                </div>

                                {/* ACTE 2 : EXPLORATION (Indigo) */}
                                <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 flex flex-col break-inside-avoid">
                                    <h4 className="font-black text-indigo-900 flex items-center gap-2 mb-2 uppercase text-xs tracking-widest border-b border-indigo-200 pb-2">
                                        <div className="p-1 bg-indigo-100 rounded"><Search className="h-4 w-4 text-indigo-600" /></div>
                                        Acte 2 : {acts[1]?.title}
                                    </h4>
                                    <div className="text-xs text-slate-700 leading-relaxed">
                                        {formatText(acts[1]?.content)}
                                    </div>
                                </div>

                                {/* ACTE 3 : BINÔME (Violet) - Était Outil */}
                                <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 flex flex-col break-inside-avoid">
                                    <h4 className="font-black text-purple-900 flex items-center gap-2 mb-2 uppercase text-xs tracking-widest border-b border-purple-200 pb-2">
                                        <div className="p-1 bg-purple-100 rounded"><Users className="h-4 w-4 text-purple-600" /></div>
                                        Acte 3 : {acts[2]?.title}
                                    </h4>
                                    <div className="text-xs text-slate-700 leading-relaxed">
                                        {formatText(acts[2]?.content)}
                                    </div>
                                </div>

                                {/* ACTE 4 : OUTIL (Bleu) - Était Binôme */}
                                <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col break-inside-avoid">
                                    <h4 className="font-black text-blue-900 flex items-center gap-2 mb-2 uppercase text-xs tracking-widest border-b border-blue-200 pb-2">
                                        <div className="p-1 bg-blue-100 rounded"><PenTool className="h-4 w-4 text-blue-600" /></div>
                                        Acte 4 : {acts[3]?.title}
                                    </h4>
                                    <div className="text-xs text-slate-700 leading-relaxed">
                                        {formatText(acts[3]?.content)}
                                    </div>
                                </div>

                                {/* ACTE 5 : ACTION (Orange) */}
                                <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 flex flex-col break-inside-avoid">
                                    <h4 className="font-black text-orange-900 flex items-center gap-2 mb-2 uppercase text-xs tracking-widest border-b border-orange-200 pb-2">
                                        <div className="p-1 bg-orange-100 rounded"><CheckCircle2 className="h-4 w-4 text-orange-600" /></div>
                                        Acte 5 : {acts[4]?.title}
                                    </h4>
                                    <div className="text-xs text-slate-700 leading-relaxed">
                                        {formatText(acts[4]?.content)}
                                    </div>
                                </div>

                                {/* ACTE 6 : ANCRAGE (Vert/Teal) */}
                                <div className="bg-teal-50 p-5 rounded-xl border border-teal-100 flex flex-col break-inside-avoid">
                                    <h4 className="font-black text-teal-900 flex items-center gap-2 mb-2 uppercase text-xs tracking-widest border-b border-teal-200 pb-2">
                                        <div className="p-1 bg-teal-100 rounded"><Video className="h-4 w-4 text-teal-600" /></div>
                                        Acte 6 : {acts[5]?.title}
                                    </h4>
                                    <div className="text-xs text-slate-700 leading-relaxed">
                                        {formatText(acts[5]?.content)}
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
