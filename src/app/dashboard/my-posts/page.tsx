"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { TrendingUp, Music, Lightbulb, PenTool, Sparkles, Copy, FileText, CheckSquare, RefreshCw, Heart, UserPlus, MessageCircle, Bookmark, Edit3, Trophy } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function MyPostsPage() {
  const [dailyTrend, setDailyTrend] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copiedHook, setCopiedHook] = useState<string | null>(null)
  
  // Stats State
  const [myStats, setMyStats] = useState({
    total_likes: 0,
    total_followers_gained: 0,
    total_comments: 0,
    total_saves: 0
  })
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [statsForm, setStatsForm] = useState(myStats)

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
         const { data: { user } } = await supabase.auth.getUser()
         
         if (user) {
            // Fetch User Stats
            const { data: profile } = await supabase
              .from('profiles')
              .select('total_likes, total_followers_gained, total_comments, total_saves')
              .eq('id', user.id)
              .single()
            
            if (profile) {
              setMyStats({
                total_likes: profile.total_likes || 0,
                total_followers_gained: profile.total_followers_gained || 0,
                total_comments: profile.total_comments || 0,
                total_saves: profile.total_saves || 0
              })
              setStatsForm({
                total_likes: profile.total_likes || 0,
                total_followers_gained: profile.total_followers_gained || 0,
                total_comments: profile.total_comments || 0,
                total_saves: profile.total_saves || 0
              })
            }
         }

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

  const updateStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('profiles').update({
        total_likes: parseInt(statsForm.total_likes as any),
        total_followers_gained: parseInt(statsForm.total_followers_gained as any),
        total_comments: parseInt(statsForm.total_comments as any),
        total_saves: parseInt(statsForm.total_saves as any)
      }).eq('id', user.id)

      if (error) throw error

      setMyStats(statsForm)
      setIsStatsOpen(false)
      toast.success("Tableau de chasse mis à jour !", { icon: <Trophy className="h-4 w-4 text-yellow-500" /> })
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    }
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

      {/* === TABLEAU DE CHASSE (STATS) === */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Mon Tableau de Chasse (Stats TikTok)
           </h2>
           <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100">
                   <Edit3 className="h-4 w-4" />
                   Mettre à jour mes chiffres
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Mettre à jour mon Tableau de Chasse</DialogTitle>
                  <DialogDescription>
                    Rentre ici les stats que tu vois sur ton profil TikTok.
                    C'est manuel : l'app ne peut pas (encore) lire tes pensées ! 😉
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="followers" className="text-right">Abonnés</Label>
                    <Input id="followers" type="number" value={statsForm.total_followers_gained} onChange={(e) => setStatsForm({...statsForm, total_followers_gained: parseInt(e.target.value)})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="likes" className="text-right">Likes</Label>
                    <Input id="likes" type="number" value={statsForm.total_likes} onChange={(e) => setStatsForm({...statsForm, total_likes: parseInt(e.target.value)})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="comments" className="text-right">Commentaires</Label>
                    <Input id="comments" type="number" value={statsForm.total_comments} onChange={(e) => setStatsForm({...statsForm, total_comments: parseInt(e.target.value)})} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="saves" className="text-right">Favoris</Label>
                    <Input id="saves" type="number" value={statsForm.total_saves} onChange={(e) => setStatsForm({...statsForm, total_saves: parseInt(e.target.value)})} className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={updateStats}>Sauvegarder les stats</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>

        {myStats.total_likes === 0 && myStats.total_followers_gained === 0 ? (
           <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 text-center">
              <p className="text-yellow-800 font-medium mb-2">Tu n'as pas encore rentré tes statistiques TikTok !</p>
              <p className="text-sm text-yellow-700/80 mb-4">Clique sur "Mettre à jour" pour suivre ta progression et motiver l'escouade.</p>
              <Button onClick={() => setIsStatsOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                 Commencer le tracking
              </Button>
           </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <UserPlus className="h-16 w-16 text-blue-600" />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Abonnés Gagnés</p>
                    <p className="text-3xl font-black text-slate-900">{myStats.total_followers_gained}</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Heart className="h-16 w-16 text-red-600" />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Likes Reçus</p>
                    <p className="text-3xl font-black text-slate-900">{myStats.total_likes}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <MessageCircle className="h-16 w-16 text-green-600" />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Commentaires</p>
                    <p className="text-3xl font-black text-slate-900">{myStats.total_comments}</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Bookmark className="h-16 w-16 text-yellow-600" />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-bold uppercase text-slate-500 mb-1">Favoris</p>
                    <p className="text-3xl font-black text-slate-900">{myStats.total_saves}</p>
                </div>
              </div>
          </div>
        )}
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
