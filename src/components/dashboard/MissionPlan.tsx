"use client"

import { CheckCircle2, Clock, MessageSquare, Share2, Star, Play, RotateCcw, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MissionPlanProps {
  type: 'like' | 'comment' | 'favorite' | 'share' | string
  scenario?: 'engagement' | 'abandon' | string
  delayMinutes?: number
  trafficSource?: 'search' | 'profile' | 'direct'
  targetUsername?: string
}

export function MissionPlan({ type, scenario = 'engagement', delayMinutes = 0, trafficSource = 'search', targetUsername = "le créateur" }: MissionPlanProps) {
  if (scenario === 'abandon') {
    return (
      <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-wider">
          <AlertCircle className="w-4 h-4" />
          Scénario : Micro-Abandon (15%)
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Pour rendre la courbe de statistiques réelle, TikTok a besoin de voir des gens qui ne finissent pas la vidéo.
        </p>
        <div className="space-y-3">
           {/* DELAY INDICATOR */}
           {delayMinutes > 0 && (
             <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 shrink-0 mt-0.5">
                   <Clock className="w-3 h-3" />
                </div>
                <p className="text-sm text-amber-700 font-bold">Attends {delayMinutes} min avant de lancer la vidéo.</p>
             </div>
           )}

          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
            <p className="text-sm text-slate-700">Ouvre la vidéo via <strong>Lien Direct</strong> (Mode Rapide).</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
            <p className="text-sm text-slate-700">Regarde la vidéo pendant environ <strong>70% de sa durée</strong>.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-600 shrink-0 mt-0.5">3</div>
            <p className="text-sm text-slate-700">Quitte la vidéo <strong>sans aucune interaction</strong> (pas de like, pas de com).</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
        <Play className="w-4 h-4" />
        Séquence Tactique (Engagement 85%)
      </div>

      <div className="space-y-3">
        {/* STEP 0: DELAY (Strategic Timing) */}
        {delayMinutes > 0 ? (
           <div className="flex items-start gap-3 p-2 bg-amber-50 rounded border border-amber-100 mb-2">
             <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                <Clock className="w-3 h-3" />
             </div>
             <div className="space-y-1">
               <p className="text-sm font-bold text-amber-800">Décalage Temporel Requis</p>
               <p className="text-xs text-amber-700">
                 Ne commence pas tout de suite. Attends <strong>{delayMinutes} minutes</strong> pour simuler un trafic naturel.
               </p>
             </div>
           </div>
        ) : null}

        {/* STEP 1: TRAFFIC SOURCE (The Hunt) */}
        <div className="flex items-start gap-3 group">
          <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">1</div>
          <div className="space-y-1 w-full">
            <p className="text-sm font-bold text-slate-800">Source d'Entrée : {trafficSource === 'search' ? 'RECHERCHE (SEO)' : (trafficSource === 'profile' ? 'VISITE PROFIL' : 'LIEN DIRECT')}</p>
            
            {trafficSource === 'search' ? (
                <div className="bg-slate-100 p-2 rounded text-xs border border-slate-200 mt-1">
                    <p className="text-slate-500 mb-1">Ouvre TikTok et tape dans la recherche :</p>
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200 font-mono font-bold text-slate-800 select-all cursor-pointer" onClick={() => navigator.clipboard.writeText(targetUsername)}>
                        {targetUsername}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Trouve sa dernière vidéo dans les résultats.</p>
                </div>
            ) : trafficSource === 'profile' ? (
                <p className="text-xs text-slate-500">Va sur le profil <strong>@{targetUsername}</strong> et clique sur sa dernière vidéo (ne clique pas le lien direct).</p>
            ) : (
                <p className="text-xs text-slate-500">Utilise le bouton "Voir la Vidéo" ci-dessus.</p>
            )}
          </div>
        </div>

        {/* STEP 2: Visionnage */}
        <div className="flex items-start gap-3 group">
          <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">2</div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Visionnage Complet</p>
            <p className="text-xs text-slate-500">Regarde la vidéo jusqu'à la toute dernière seconde. Ne saute pas.</p>
          </div>
        </div>

        {/* STEP 3: Rewatch */}
        <div className="flex items-start gap-3 group">
          <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">3</div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Signal d'intérêt</p>
            <p className="text-xs text-slate-500">Reviens en arrière de 3 à 5 secondes pour simuler une re-lecture d'un passage.</p>
          </div>
        </div>

        {/* STEP 4: Action */}
        <div className="flex items-start gap-3 group">
          <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">4</div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 uppercase">Action Finale : {type}</p>
            
            {type === 'comment' ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-slate-500 mb-2 italic">Choisis un modèle et personnalise-le (interdiction de copier-coller exact) :</p>
                
                <div className="grid gap-2">
                   {/* Option 1: Question */}
                  <div className="p-2 bg-slate-50 border rounded text-[11px] text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                    <span className="font-bold text-indigo-500">[Question]</span> "Pourquoi tu fais [X] au lieu de [Y] ? J'ai un doute sur..."
                  </div>
                   {/* Option 2: Débat */}
                  <div className="p-2 bg-slate-50 border rounded text-[11px] text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                    <span className="font-bold text-indigo-500">[Débat]</span> "J'ai testé l'inverse et ça n'a pas donné ça, tu expliques comment ?"
                  </div>
                   {/* Option 3: Reply to Pinned (Nouveau Point 6) */}
                  <div className="p-2 bg-purple-50 border border-purple-100 rounded text-[11px] text-purple-700 cursor-pointer hover:bg-purple-100 transition-colors font-medium">
                    <span className="font-bold">⚡ SIGNAL FORT :</span> Réponds au commentaire épinglé par le créateur (si présent).
                  </div>
                </div>
              </div>
            ) : type === 'share' ? (
              <div className="space-y-1">
                 <p className="text-xs text-slate-500">Utilise "Copier le lien" ou envoie en MP (Message Privé).</p>
                 <Badge variant="outline" className="text-[10px] border-green-200 bg-green-50 text-green-700">Partage Silencieux</Badge>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Effectue l'action {type} maintenant.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
