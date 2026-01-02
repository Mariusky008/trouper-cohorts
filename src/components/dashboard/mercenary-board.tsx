"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Sword, ShieldAlert, Skull, CheckCircle, Loader2, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function MercenaryBoard() {
  const [bounties, setBounties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  
  const supabase = createClient()

  const fetchBounties = async () => {
    try {
      const { data } = await supabase
        .from('bounties')
        .select(`
            *,
            target:target_user_id (
                username,
                current_video_url
            ),
            squad:squad_id (
                name
            )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      
      setBounties(data || [])
    } catch (e) {
      console.error("Error fetching bounties", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        fetchBounties()

        // Realtime subscription
        const channel = supabase
            .channel('bounties-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bounties' }, () => {
                fetchBounties()
            })
            .subscribe()
            
        return () => {
            supabase.removeChannel(channel)
        }
    }
    init()
  }, [])

  const handleClaimBounty = async (bounty: any) => {
    setSelectedBounty(bounty)
  }

  const handleCompleteBounty = async () => {
    if (!selectedBounty || !user) return
    setProcessing(true)

    try {
        // 1. Mark bounty as completed
        const { error } = await supabase
            .from('bounties')
            .update({ 
                status: 'completed',
                mercenary_id: user.id
            })
            .eq('id', selectedBounty.id)
        
        if (error) throw error

        // 2. Give Credits to Mercenary
        // (Assuming we have a logic for credits, simplified here)
        await supabase.rpc('increment_credits', { user_id: user.id, amount: 1 })

        toast.success("Mission Mercenaire Accomplie !", {
            description: "Tu as sauvé l'escouade. +1 Crédit + Gloire.",
            icon: <Sword className="h-4 w-4 text-red-600" />
        })

        setSelectedBounty(null)
        fetchBounties()

    } catch (e) {
        console.error(e)
        toast.error("Erreur lors de la validation")
    } finally {
        setProcessing(false)
    }
  }

  // DEV ONLY: Trigger Simulation
  const simulateProtocol = async () => {
    if (!user) return
    setProcessing(true)
    try {
        // Create a fake bounty
        await supabase.from('bounties').insert({
            target_user_id: user.id, // Myself as target for testing
            defector_user_id: user.id, // Myself as defector
            video_url: "https://tiktok.com/@test/video/123",
            status: 'open',
            reward_credits: 1
        })
        toast.success("Protocole Mercenaire Déclenché (Simulation)")
        fetchBounties()
    } catch (e) {
        toast.error("Erreur simulation")
    } finally {
        setProcessing(false)
    }
  }

  if (loading) return null

  if (bounties.length === 0) {
      return (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center bg-slate-50/50">
             <div className="flex justify-center mb-2">
                <ShieldAlert className="h-8 w-8 text-slate-300" />
             </div>
             <h3 className="text-sm font-semibold text-slate-500">Aucune alerte Mercenaire</h3>
             <p className="text-xs text-slate-400">Toutes les escouades sont opérationnelles.</p>
             
             {/* Hidden Trigger for Demo */}
             <Button variant="ghost" size="sm" onClick={simulateProtocol} className="mt-4 opacity-10 hover:opacity-100 text-xs">
                (Dev: Simuler Alerte)
             </Button>
          </div>
      )
  }

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-red-900 flex items-center gap-2 uppercase tracking-tight">
             <Skull className="h-6 w-6 text-red-600" />
             Protocole Mercenaire Actif
          </h2>
          <Badge variant="destructive" className="animate-pulse">
             {bounties.length} Missions Urgentes
          </Badge>
       </div>

       <div className="grid gap-4 md:grid-cols-2">
          {bounties.map((bounty) => (
             <motion.div 
                key={bounty.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-red-50 to-slate-50 border border-red-200 rounded-xl p-4 shadow-sm relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Sword className="h-24 w-24 text-red-900" />
                </div>

                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                         Sauvetage Escouade
                      </Badge>
                      <span className="text-xs font-bold text-red-600">Expire à minuit</span>
                   </div>
                   
                   <h3 className="font-bold text-lg text-slate-800 mb-1">
                      Soutenir {bounty.target?.username || "Soldat Inconnu"}
                   </h3>
                   <p className="text-sm text-slate-600 mb-4">
                      Un membre a déserté. L'escouade a besoin de renfort immédiat.
                   </p>

                   <div className="flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 w-fit mb-4">
                      <Sword className="h-4 w-4" />
                      Récompense : 1 Crédit + Gloire
                   </div>

                   <Button 
                     className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20"
                     onClick={() => handleClaimBounty(bounty)}
                   >
                      ACCEPTER LA MISSION
                   </Button>
                </div>
             </motion.div>
          ))}
       </div>

       {/* Mission Dialog */}
       <Dialog open={!!selectedBounty} onOpenChange={(open) => !open && setSelectedBounty(null)}>
         <DialogContent className="sm:max-w-md border-red-200 bg-slate-50">
            <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-red-900">
                  <Sword className="h-5 w-5 text-red-600" />
                  MISSION MERCENAIRE
               </DialogTitle>
               <DialogDescription>
                  Tu remplaces un soldat défaillant. Fais le job, prends la récompense.
               </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
               <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Cible à soutenir</p>
                  <a 
                     href={selectedBounty?.video_url} 
                     target="_blank" 
                     className="text-lg font-bold text-blue-600 hover:underline flex items-center justify-center gap-2"
                  >
                     <ExternalLink className="h-4 w-4" />
                     Voir la Vidéo
                  </a>
               </div>

               <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-white rounded border border-slate-100">
                     <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold">1</div>
                     <span className="text-sm">Liker la vidéo</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-white rounded border border-slate-100">
                     <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold">2</div>
                     <span className="text-sm">Mettre un commentaire (4 mots min)</span>
                  </div>
               </div>
            </div>

            <DialogFooter>
               <Button 
                  onClick={handleCompleteBounty} 
                  disabled={processing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
               >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "J'AI FAIT LE JOB (RÉCLAMER)"}
               </Button>
            </DialogFooter>
         </DialogContent>
       </Dialog>
    </div>
  )
}
