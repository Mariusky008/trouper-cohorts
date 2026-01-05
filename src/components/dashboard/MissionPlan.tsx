"use client"

import { CheckCircle2, Clock, MessageSquare, Share2, Star, Play, RotateCcw, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MissionPlanProps {
  type: 'like' | 'comment' | 'favorite' | 'share' | string
  scenario?: 'engagement' | 'abandon' | string
}

export function MissionPlan({ type, scenario = 'engagement' }: MissionPlanProps) {
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
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
            <p className="text-sm text-slate-700">Regarde la vidéo pendant environ <strong>70% de sa durée</strong>.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-600 shrink-0 mt-0.5">2</div>
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
        {/* STEP 1: Visionnage */}
        <div className="flex items-start gap-3 group">
          <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">1</div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Visionnage Complet</p>
            <p className="text-xs text-slate-500">Regarde la vidéo jusqu'à la toute dernière seconde. Ne saute pas.</p>
          </div>
        </div>

        {/* STEP 2: Rewatch */}
        <div className="flex items-start gap-3 group">
          <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">2</div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800">Signal d'intérêt</p>
            <p className="text-xs text-slate-500">Reviens en arrière de 3 à 5 secondes pour simuler une re-lecture d'un passage.</p>
          </div>
        </div>

        {/* STEP 3: Action */}
        <div className="flex items-start gap-3 group">
          <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">3</div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 uppercase">Action Finale : {type}</p>
            
            {type === 'comment' ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-slate-500 mb-2 italic">Choisis un modèle et personnalise-le (interdiction de copier-coller exact) :</p>
                <div className="grid gap-2">
                  <div className="p-2 bg-slate-50 border rounded text-[11px] text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                    "Pourquoi tu fais [X] au lieu de [Y] ? J'ai un doute sur..."
                  </div>
                  <div className="p-2 bg-slate-50 border rounded text-[11px] text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                    "Ça marche aussi pour les comptes [Thématique] ?"
                  </div>
                  <div className="p-2 bg-slate-50 border rounded text-[11px] text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                    "J'ai testé l'inverse et ça n'a pas donné ça, tu expliques comment ?"
                  </div>
                </div>
              </div>
            ) : type === 'share' ? (
              <p className="text-xs text-slate-500">Utilise "Copier le lien" ou envoie en MP. Pas besoin de partage public.</p>
            ) : (
              <p className="text-xs text-slate-500">Effectue l'action {type} maintenant.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
