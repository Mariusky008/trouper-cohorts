"use client";

import { MessageCircle, ShieldQuestion, CheckCircle2, Euro, Laptop, BarChart3, Users, Target } from "lucide-react";

export function FaqFinanceursViewer() {
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

            {/* --- PAGE 1 : FONDAMENTAUX & PÉDAGOGIE --- */}
            <div className="w-[210mm] h-[297mm] bg-white p-12 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                
                {/* Header */}
                <header className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">FAQ FINANCEURS</h1>
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">Arguments & Conformité Institutionnelle</p>
                    </div>
                    <div className="text-right">
                        <div className="text-orange-600 font-black text-2xl tracking-tighter">POPEY</div>
                    </div>
                </header>

                <div className="flex-1 space-y-8">
                    
                    {/* Q1 : Distanciel */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 break-inside-avoid">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-3">
                            <Laptop className="text-blue-600 h-6 w-6" />
                            Pourquoi privilégier un format 100% Distanciel ?
                        </h3>
                        <div className="text-slate-700 text-sm leading-relaxed text-justify space-y-2">
                            <p>
                                Le choix du distanciel n'est pas une économie de moyens, mais une <strong>exigence pédagogique</strong>. 
                                Aujourd'hui, 90% de l'activité d'un indépendant (prospection, vente, administration) se fait à distance.
                            </p>
                            <p>
                                Former en présentiel créerait un biais artificiel. En les formant directement sur les outils numériques (Zoom, WhatsApp, CRM en ligne), 
                                nous les mettons en <strong>situation réelle de travail</strong>. De plus, cela garantit l'accessibilité à tous les territoires, y compris les zones rurales (ZRR) ou QPV.
                            </p>
                        </div>
                    </div>

                    {/* Q2 : Engagement */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 break-inside-avoid">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-3">
                            <Users className="text-purple-600 h-6 w-6" />
                            Comment garantissez-vous l'assiduité sans formateur présentiel ?
                        </h3>
                        <div className="text-slate-700 text-sm leading-relaxed text-justify space-y-2">
                            <p>
                                Nous avons remplacé la "surveillance descendante" par la <strong>responsabilisation horizontale</strong>. 
                                Le système de "Binôme Aléatoire" (Buddy System) oblige chaque apprenant à valider sa journée auprès d'un pair.
                            </p>
                            <p>
                                Les résultats sont probants : là où les MOOCs classiques plafonnent à 15% de complétion, nos cohortes pilotes atteignent régulièrement 
                                <strong>80% à 90% de taux de fin de parcours</strong>. L'obligation sociale envers le binôme est un moteur plus puissant que la signature d'une feuille d'émargement.
                            </p>
                        </div>
                    </div>

                    {/* Q3 : Évaluation */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 break-inside-avoid">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-3">
                            <BarChart3 className="text-green-600 h-6 w-6" />
                            Quelle est la méthode d'évaluation des acquis ?
                        </h3>
                        <div className="text-slate-700 text-sm leading-relaxed text-justify space-y-2">
                            <p>
                                Nous ne faisons pas de QCM théoriques. L'évaluation est basée sur la <strong>Preuve d'Action (Proof of Work)</strong>.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li><strong>Savoir-faire :</strong> L'apprenant doit fournir la capture d'écran de ses actions (ex: email envoyé, profil mis à jour).</li>
                                <li><strong>Savoir-être :</strong> L'assiduité aux rendez-vous binôme valide la compétence "fiabilité professionnelle".</li>
                            </ul>
                            <p className="mt-2">
                                Si la preuve n'est pas fournie, la journée n'est pas validée. C'est binaire et factuel.
                            </p>
                        </div>
                    </div>

                </div>

                <footer className="mt-8 text-center text-xs text-slate-400 uppercase tracking-widest">
                    Page 1/2 • Argumentaire Financeurs • Popey Academy
                </footer>
            </div>

            {/* --- PAGE 2 : ÉCONOMIE & CONFORMITÉ --- */}
            <div className="w-[210mm] h-[297mm] bg-white p-12 mx-auto mb-10 shadow-lg relative flex flex-col print:mb-0 print:shadow-none print:w-full print:h-screen break-after-page page-break">
                
                <header className="flex justify-between items-end border-b-2 border-slate-200 pb-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-1">ÉCONOMIE & CONFORMITÉ</h2>
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-sm">Modèle & Positionnement</p>
                    </div>
                    <div className="text-right opacity-50">
                        <div className="text-xs font-bold text-slate-400 uppercase">Page 2/2</div>
                    </div>
                </header>

                <div className="flex-1 space-y-8">
                    
                    {/* Q4 : Coût */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 break-inside-avoid">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-3">
                            <Euro className="text-orange-600 h-6 w-6" />
                            Pourquoi ce modèle économique (Gratuit / Low-cost) ?
                        </h3>
                        <div className="text-slate-700 text-sm leading-relaxed text-justify space-y-2">
                            <p>
                                Dans le cadre du pilote, la gratuité vise à lever la barrière financière pour les publics les plus fragiles (bénéficiaires RSA, ASS).
                            </p>
                            <p>
                                À terme, le coût unitaire restera très inférieur aux standards du marché (formation classique ~1500€ vs Popey &lt; 500€) grâce à l'automatisation 
                                du suivi pédagogique par notre plateforme. Cela permet de massifier l'accompagnement sans exploser les budgets publics.
                            </p>
                        </div>
                    </div>

                    {/* Q5 : Public Cible */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 break-inside-avoid">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-3">
                            <Target className="text-red-600 h-6 w-6" />
                            Est-ce adapté aux publics éloignés de l'emploi ?
                        </h3>
                        <div className="text-slate-700 text-sm leading-relaxed text-justify space-y-2">
                            <p>
                                <strong>Oui, sous condition de motivation.</strong> Le dispositif est conçu pour être "Action-Oriented". Il ne demande pas de pré-requis académiques, 
                                mais il demande du courage.
                            </p>
                            <p>
                                Pour les publics très éloignés (illectronisme sévère), ce dispositif peut être complémentaire d'une action socle, mais ne la remplace pas. 
                                Il est idéal pour la phase de "remobilisation" et de "test d'activité".
                            </p>
                        </div>
                    </div>

                    {/* Conformité Qualiopi */}
                    <div className="mt-8 border-t border-slate-200 pt-8">
                        <h3 className="flex items-center gap-3 text-lg font-bold text-slate-900 mb-4 uppercase tracking-wide">
                            <ShieldQuestion className="text-slate-800 h-6 w-6" />
                            Conformité & Engagements
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="text-sm text-slate-600">
                                    <strong>Objectifs opérationnels définis</strong> et évaluables.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="text-sm text-slate-600">
                                    <strong>Adaptation aux publics</strong> via le rythme flexible.
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="text-sm text-slate-600">
                                    <strong>Moyens pédagogiques</strong> techniques (Plateforme) et humains (Binôme).
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="text-sm text-slate-600">
                                    <strong>Amélioration continue</strong> via feedback quotidien.
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <footer className="mt-12 text-center text-xs text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6">
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
                    .break-inside-avoid {
                        break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
