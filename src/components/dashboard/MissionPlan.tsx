"use client"

import { CheckCircle2, Clock, MessageSquare, Share2, Star, Play, RotateCcw, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MissionPlanProps {
  type: 'like' | 'comment' | 'favorite' | 'share' | string
  scenario?: 'engagement' | 'abandon' | string
  delayMinutes?: number
  trafficSource?: 'search' | 'profile' | 'direct'
  targetUsername?: string
  shouldFollow?: boolean
}

export function MissionPlan({ type, scenario = 'engagement', delayMinutes = 0, trafficSource = 'search', targetUsername = "le créateur", shouldFollow = false }: MissionPlanProps) {
  return (
    <div className="space-y-6 font-sans">
      {/* HEADER: Mission Title & Target */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-700">
          <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                  <span className="text-xl">🛡️</span>
                  <h3 className="font-bold text-lg tracking-tight text-indigo-100">Mission Optimisée</h3>
              </div>
              <Badge variant="outline" className="text-indigo-200 border-indigo-500/50 bg-indigo-500/10 text-[10px] px-2 py-0.5">
                  v2.2 (Indétectable)
              </Badge>
          </div>
          <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                     {targetUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Cible Prioritaire</p>
                      <p className="text-base font-bold text-white leading-none">@{targetUsername}</p>
                  </div>
              </div>
              {/* Fake progression for design - or use props if available later */}
              <div className="text-right">
                  <p className="text-xs text-slate-500 font-mono">Progression</p>
                  <p className="text-sm font-mono text-indigo-400 font-bold">1 / 10</p>
              </div>
          </div>
      </div>

      {/* GOLDEN RULE */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚠️</span>
              <h4 className="font-black text-amber-800 uppercase text-sm tracking-wide">RÈGLE D'OR (Sécurité)</h4>
          </div>
          <p className="text-sm text-amber-900 font-medium mb-2">
              Si tu as déjà liké cette vidéo dans ton flux "Pour toi" :
          </p>
          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1 ml-1">
              <li><strong>Ne fais RIEN sur TikTok</strong> (ne retire surtout pas le like).</li>
              <li>Valide directement la mission ici.</li>
          </ul>
      </div>

      <div className="space-y-4 relative">
          {/* Vertical Line Connector */}
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-200 -z-10"></div>

          {/* STEP 0: DELAY */}
          {delayMinutes > 0 && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
              <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg shadow-sm border border-slate-200 shrink-0 font-bold z-10">
                      ⏱️
                  </div>
                  <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                          Étape 0 : Le Décalage
                          <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-500">Randomization</Badge>
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                          Attends entre <strong>30s et {Math.max(2, delayMinutes)} min</strong> avant de commencer.
                      </p>
                      <p className="text-xs text-slate-400 italic">
                          (Cela évite que 50 personnes arrivent à la même seconde sur le compte de {targetUsername}).
                      </p>
                  </div>
              </div>
          </div>
          )}

          {/* STEP 1: ACCESS */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
              <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-sm border border-blue-100 shrink-0 font-bold z-10">
                      🔍
                  </div>
                  <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                          Étape 1 : Accès Cible
                          <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-600 border-blue-100">SEO Boost</Badge>
                      </h4>
                      
                      {trafficSource === 'search' ? (
                          <div className="text-sm text-slate-600 space-y-2">
                              <p className="font-medium text-red-500">Ne clique pas sur un lien direct.</p>
                              <ol className="list-decimal list-inside space-y-1 text-slate-700 ml-1">
                                  <li>Ouvre TikTok.</li>
                                  <li>Tape <span className="font-mono bg-slate-100 px-1 rounded font-bold">"{targetUsername} [Sujet]"</span> dans la barre de recherche.</li>
                                  <li className="text-xs text-slate-500 ml-4 mb-1">(Exemple : "{targetUsername} crypto" ou "{targetUsername} humour")</li>
                                  <li>Clique sur sa vidéo depuis les résultats.</li>
                              </ol>
                              <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 border border-blue-100 mt-2">
                                  <strong>Pourquoi ?</strong> Ça booste le SEO. TikTok croira que sa vidéo est une réponse pertinente à une recherche.
                              </div>
                          </div>
                      ) : (
                          <div className="text-sm text-slate-600 space-y-1">
                              <p>Accède au profil via le lien fourni (exceptionnellement).</p>
                              <p className="text-xs text-slate-400">Le mode Recherche n'est pas activé pour cette mission.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          {/* STEP 2: WATCH */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
              <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shadow-sm border border-indigo-100 shrink-0 font-bold z-10">
                      👀
                  </div>
                  <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                          Étape 2 : Visionnage Tactique
                          <Badge variant="secondary" className="text-[10px] h-5 bg-indigo-50 text-indigo-600 border-indigo-100">Rétention</Badge>
                      </h4>
                      <p className="text-sm text-slate-700">
                          Regarde la vidéo <strong>jusqu’au bout</strong>.
                      </p>
                      <div className="flex items-start gap-2 bg-indigo-50/50 p-2 rounded border border-indigo-100/50">
                          <RotateCcw className="w-4 h-4 text-indigo-500 mt-0.5" />
                          <div className="text-xs text-slate-600">
                              <strong>Rewind :</strong> Reviens 3-4 secondes en arrière sur un passage précis (comme si tu voulais revoir un détail).
                          </div>
                      </div>
                      <p className="text-xs text-slate-400 italic mt-1">
                          Pourquoi ? Cela crée un taux de complétion &gt; 100%. Signal n°1 de viralité.
                      </p>
                  </div>
              </div>
          </div>

          {/* STEP 3: ACTION */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
              <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-lg shadow-sm border border-purple-100 shrink-0 font-bold z-10">
                      ⚡
                  </div>
                  <div className="space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                          Étape 3 : L'Action
                          <Badge variant="secondary" className="text-[10px] h-5 bg-purple-50 text-purple-600 border-purple-100">Engagement</Badge>
                      </h4>
                      
                      {/* Scenario Display */}
                      <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2 rounded border text-xs ${scenario !== 'abandon' ? 'bg-purple-100 border-purple-300 ring-1 ring-purple-400' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                              <p className="font-bold text-purple-900 mb-1">Option A (80%)</p>
                              <p className="text-purple-700">
                                  {type === 'comment' ? 'Like + Commentaire' : 
                                   type === 'share' ? 'Like + Partage' : 
                                   'Like + Favori'}
                              </p>
                              {scenario !== 'abandon' && <Badge className="mt-2 bg-purple-600 hover:bg-purple-700">TON ORDRE</Badge>}
                          </div>
                          <div className={`p-2 rounded border text-xs ${scenario === 'abandon' ? 'bg-slate-100 border-slate-300 ring-1 ring-slate-400' : 'bg-slate-50 border-slate-200 opacity-50'}`}>
                              <p className="font-bold text-slate-700 mb-1">Option B (20%)</p>
                              <p className="text-slate-600">Ne fais RIEN</p>
                              {scenario === 'abandon' && <Badge variant="secondary" className="mt-2 bg-slate-600 text-white hover:bg-slate-700">TON ORDRE</Badge>}
                          </div>
                      </div>

                      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                         <strong>Pourquoi ?</strong> Une vidéo avec 100% de likes/vues est suspecte. Le "Ghost Viewing" (Option B) rend le boost réel aux yeux de l'algo.
                      </div>
                  </div>
              </div>
          </div>

          {/* STEP 4: EXIT */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
              <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-lg shadow-sm border border-green-100 shrink-0 font-bold z-10">
                      🔄
                  </div>
                  <div className="space-y-2">
                      <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                          Étape 4 : Sortie Naturelle
                      </h4>
                      <p className="text-sm text-slate-700">
                          Ne ferme pas l'appli tout de suite.
                      </p>
                      <p className="text-sm text-slate-600 font-medium bg-green-50 p-2 rounded border border-green-100 inline-block">
                          Scrolle encore 2 ou 3 vidéos d'autres personnes avant de revenir valider.
                      </p>
                  </div>
              </div>
          </div>

      </div>
    </div>
  )
}
