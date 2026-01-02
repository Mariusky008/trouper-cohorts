"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { TrendingUp, Music, Lightbulb, PenTool, Sparkles, Copy, Check, FileText, CheckSquare, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function MyPostsPage() {
  const [dailyTrend, setDailyTrend] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copiedHook, setCopiedHook] = useState<string | null>(null)
  
  // Script Builder State
  const [scriptType, setScriptStyle] = useState("educatif")
  const [scriptData, setScriptData] = useState({ hook: "", body: "", cta: "" })
  
  // Checklist State
  const [checklist, setChecklist] = useState({
    lighting: false,
    sound: false,
    hook: false,
    captions: false,
    cta: false
  })

  // Exemple de Hooks viraux
  const viralHooks = [
    "Arrête de scroller si tu veux...",
    "Je parie que tu ne savais pas ça sur...",
    "3 erreurs qui tuent ta progression...",
    "Le secret que personne ne te dit...",
    "Pov : Quand tu réalises que..."
  ]

  // Script Templates
  const scriptTemplates: any = {
    educatif: {
      title: "Éducatif / Tuto",
      hookPlaceholder: "Comment [Résultat] sans [Douleur]...",
      bodyPlaceholder: "Étape 1 : Fais ceci...\nÉtape 2 : Attention à ça...\nLe secret c'est de...",
      ctaPlaceholder: "Abonne-toi pour plus d'astuces sur [Sujet] !"
    },
    mythe: {
      title: "Casser un Mythe",
      hookPlaceholder: "Arrête de croire que [Croyance Populaire] !",
      bodyPlaceholder: "La vérité c'est que...\nVoici la preuve : ...\nÇa change tout parce que...",
      ctaPlaceholder: "Dis-moi en comm si tu le savais !"
    },
    story: {
      title: "Storytime / Anecdote",
      hookPlaceholder: "J'ai failli tout perdre à cause de...",
      bodyPlaceholder: "Tout a commencé quand...\nJ'ai réalisé que...\nEt finalement...",
      ctaPlaceholder: "Like si ça t'est déjà arrivé !"
    }
  }

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
       try {
         // Fetch Daily Trend
         const { data: trend } = await supabase
            .from('daily_trends')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
         
         if (trend) setDailyTrend(trend)
       } catch (e) {
         console.error(e)
       } finally {
         setLoading(false)
       }
    }
    fetchData()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHook(text)
    toast.success("Accroche copiée !")
    setTimeout(() => setCopiedHook(null), 2000)
  }

  const resetScript = () => {
    setScriptData({ hook: "", body: "", cta: "" })
    toast.success("Script réinitialisé")
  }

  const copyScript = () => {
    const fullScript = `${scriptData.hook}\n\n${scriptData.body}\n\n${scriptData.cta}`
    navigator.clipboard.writeText(fullScript)
    toast.success("Script complet copié !")
  }

  if (loading) return <div className="p-8 text-center">Chargement du Labo Créatif...</div>

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <PenTool className="h-8 w-8 text-primary" />
          MES POSTS TIKTOK
        </h1>
        <p className="text-muted-foreground mt-2">
          Ton atelier de création. Analyse les tendances, prépare tes scripts et domine l'algo.
        </p>
      </div>

      {/* === TOP SECTION: RADAR TACTIQUE === */}
      <div className="w-full">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Radar Tactique (Trend du Jour)
          </h2>
          
          {dailyTrend ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 relative overflow-hidden shadow-xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse" />
              
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start justify-between">
                <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          Ordre de mission
                      </span>
                      <span className="text-xs text-slate-400">{new Date(dailyTrend.created_at).toLocaleDateString()}</span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{dailyTrend.title}</h3>
                      <p className="text-slate-300 leading-relaxed max-w-2xl">
                          {dailyTrend.description}
                      </p>
                    </div>
                </div>

                {dailyTrend.sound_url && (
                   <Button 
                     className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 gap-2 shrink-0"
                     asChild
                   >
                     <a href={dailyTrend.sound_url} target="_blank" rel="noopener noreferrer">
                       <Music className="h-4 w-4" />
                       Utiliser ce Son
                     </a>
                   </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="p-8 border border-dashed rounded-xl text-center text-muted-foreground bg-slate-50">
              Aucune trend détectée aujourd'hui. Repose-toi ou innove !
            </div>
          )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        
        {/* === LEFT COLUMN (2/3): SCRIPT BUILDER === */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Constructeur de Scripts
              </h2>
              <Button variant="ghost" size="sm" onClick={resetScript} className="text-muted-foreground hover:text-red-500">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
           </div>

           <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
              <Tabs value={scriptType} onValueChange={(val) => setScriptStyle(val)} className="w-full">
                <div className="bg-slate-50 border-b px-4 py-2">
                  <TabsList className="bg-slate-200/50">
                    <TabsTrigger value="educatif">Éducatif</TabsTrigger>
                    <TabsTrigger value="mythe">Mythe</TabsTrigger>
                    <TabsTrigger value="story">Storytime</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6 space-y-6">
                   <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                      <Lightbulb className="h-4 w-4" />
                      <span>Mode : <strong>{scriptTemplates[scriptType].title}</strong></span>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-blue-600 font-bold">1. L'Accroche (Hook) - 3 premières secondes</Label>
                      <Input 
                        key={`hook-${scriptType}`}
                        placeholder={scriptTemplates[scriptType].hookPlaceholder} 
                        className="font-medium text-lg border-blue-100 focus-visible:ring-blue-500"
                        value={scriptData.hook}
                        onChange={(e) => setScriptData({...scriptData, hook: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">Doit stopper le scroll immédiatement.</p>
                   </div>

                   <div className="space-y-2">
                      <Label className="font-bold">2. Le Corps (La Valeur)</Label>
                      <Textarea 
                        key={`body-${scriptType}`}
                        placeholder={scriptTemplates[scriptType].bodyPlaceholder} 
                        className="min-h-[150px] resize-none border-slate-200"
                        value={scriptData.body}
                        onChange={(e) => setScriptData({...scriptData, body: e.target.value})}
                      />
                   </div>

                   <div className="space-y-2">
                      <Label className="text-green-600 font-bold">3. L'Appel à l'action (CTA)</Label>
                      <Input 
                        key={`cta-${scriptType}`}
                        placeholder={scriptTemplates[scriptType].ctaPlaceholder} 
                        className="border-green-100 focus-visible:ring-green-500"
                        value={scriptData.cta}
                        onChange={(e) => setScriptData({...scriptData, cta: e.target.value})}
                      />
                   </div>
                </div>

                <div className="bg-slate-50 p-4 border-t flex justify-end">
                   <Button onClick={copyScript} className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copier le Script
                   </Button>
                </div>
              </Tabs>
           </div>
        </div>

        {/* === RIGHT COLUMN (1/3): TOOLS === */}
        <div className="space-y-8">
           
           {/* HOOKS GENERATOR */}
           <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                Idées d'Accroches
              </h2>
              
              <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
                {viralHooks.map((hook, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer" onClick={() => copyToClipboard(hook)}>
                    <span className="font-medium text-sm leading-tight">{hook}</span>
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </div>
                ))}
              </div>
           </div>

           {/* CHECKLIST VIRALITÉ */}
           <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                Check-list "Pré-Vol"
              </h2>
              
              <div className="rounded-xl border bg-green-50/50 border-green-100 p-5 space-y-4">
                 <div className="flex items-center space-x-2">
                    <Checkbox id="light" checked={checklist.lighting} onCheckedChange={(c) => setChecklist({...checklist, lighting: !!c})} />
                    <Label htmlFor="light" className="cursor-pointer">Lumière face à moi (pas de contre-jour)</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="sound" checked={checklist.sound} onCheckedChange={(c) => setChecklist({...checklist, sound: !!c})} />
                    <Label htmlFor="sound" className="cursor-pointer">Son clair (pas d'écho/bruit)</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="hook" checked={checklist.hook} onCheckedChange={(c) => setChecklist({...checklist, hook: !!c})} />
                    <Label htmlFor="hook" className="cursor-pointer font-bold">Hook visuel ou sonore dans les 3s</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="captions" checked={checklist.captions} onCheckedChange={(c) => setChecklist({...checklist, captions: !!c})} />
                    <Label htmlFor="captions" className="cursor-pointer">Sous-titres dynamiques activés</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="cta" checked={checklist.cta} onCheckedChange={(c) => setChecklist({...checklist, cta: !!c})} />
                    <Label htmlFor="cta" className="cursor-pointer">CTA clair à la fin</Label>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  )
}
