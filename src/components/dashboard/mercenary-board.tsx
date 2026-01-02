"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Sword, ShieldAlert, Skull, CheckCircle, Loader2, ExternalLink, Medal, Star, Flame } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

export function MercenaryBoard({ onCreditsEarned }: { onCreditsEarned?: () => void }) {
  const [bounties, setBounties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  
  const supabase = createClient()

  const fetchBounties = async () => {
    try {
      const { data, error } = await supabase
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
      
      if (error) {
        console.error("Supabase Error:", error)
        // If table doesn't exist (code 42P01), we don't crash, just show empty
        if (error.code === '42P01') {
            toast.error("Table 'bounties' introuvable", { description: "Demandez à l'admin d'exécuter la migration SQL." })
        }
      }

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

    // Handle simulation completion locally
    if (selectedBounty.id.toString().startsWith('simulated-')) {
        setProcessing(false) // Stop loading immediately
        setSelectedBounty(null) // Close mission dialog
        
        // Remove the bounty from list
        setBounties(prev => prev.filter(b => b.id !== selectedBounty.id))
        
        // Show victory modal immediately
        setShowVictoryModal(true)
        
        // Trigger confetti
        setTimeout(() => triggerConfetti(), 100)
        
        if (onCreditsEarned) onCreditsEarned()
        return
    }

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
        // We handle credits update via RPC or direct update if RPC is missing
        const { error: creditError } = await supabase.rpc('increment_credits', { user_id: user.id, amount: 1 })
        
        // Fallback if RPC fails (e.g. function doesn't exist yet)
        if (creditError) {
             console.log("RPC failed, trying direct update", creditError)
             // Fetch current credits first
             const { data: profile } = await supabase.from('profiles').select('boost_credits').eq('id', user.id).single()
             if (profile) {
                 await supabase.from('profiles').update({ boost_credits: (profile.boost_credits || 0) + 1 }).eq('id', user.id)
             }
        }

        setShowVictoryModal(true)
        setTimeout(() => triggerConfetti(), 100)
        if (onCreditsEarned) onCreditsEarned() // Trigger parent animation
        setSelectedBounty(null)
        fetchBounties()

    } catch (e) {
        console.error(e)
        toast.error("Erreur lors de la validation")
    } finally {
        setProcessing(false)
    }
  }

  const triggerConfetti = () => {
    // Check if confetti is loaded globally
    const confetti = (window as any).confetti
    if (!confetti) {
        console.warn("Confetti library not loaded yet")
        return
    }

    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#EF4444', '#B91C1C', '#F59E0B']
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#EF4444', '#B91C1C', '#F59E0B']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()
  }

  // DEV ONLY: Trigger Simulation
  const simulateProtocol = async () => {
    if (!user) return
    setProcessing(true)
    
    // Simulate local state update directly for immediate feedback
    const fakeBounty = {
        id: "simulated-" + Date.now(),
        target_user_id: user.id,
        defector_user_id: user.id,
        video_url: "https://tiktok.com/@test/video/123",
        status: 'open',
        reward_credits: 1,
        created_at: new Date().toISOString(),
        target: { username: "Simulation Target", current_video_url: "#" },
        squad: { name: "Alpha Squad" }
    }
    
    // Use functional update to ensure we don't lose previous state and force re-render
    setBounties(prev => {
        const newState = [fakeBounty, ...prev]
        console.log("Simulating Bounty. New State:", newState)
        return newState
    })
    
    toast.success("Protocole Mercenaire Déclenché (Simulation Local)")
    
    try {
        // Create a fake bounty in DB
        const { error } = await supabase.from('bounties').insert({
            target_user_id: user.id, // Myself as target for testing
            defector_user_id: user.id, // Myself as defector
            video_url: "https://tiktok.com/@test/video/123",
            status: 'open',
            reward_credits: 1
        })
        if (error) console.error("Simulation Insert Error:", error)
    } catch (e) {
        console.error("Simulation Exception:", e)
    } finally {
        setProcessing(false)
    }
  }

  if (loading) return null

  if (bounties.length === 0) {
      return (
          <>
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
          
          {/* Victory Modal needs to be here too if state persists after clearing bounties */}
          {showVictoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-yellow-500/50 p-6 text-center shadow-2xl">
                    <button onClick={() => setShowVictoryModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                    <div className="flex flex-col items-center gap-4 py-6">
                        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", bounce: 0.5 }} className="relative">
                            <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse" />
                            <Medal className="h-32 w-32 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]" />
                            <Star className="h-10 w-10 text-white absolute -top-2 -right-2 animate-ping" />
                        </motion.div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 tracking-tighter drop-shadow-sm">MISSION ACCOMPLIE !</h2>
                            <p className="text-slate-300 font-medium text-lg">L'escouade te doit une fière chandelle, Mercenaire.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full mt-6">
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white p-4 rounded-xl border-4 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] flex flex-col items-center transform hover:scale-105 transition-transform">
                                <Flame className="h-8 w-8 text-orange-500 mb-2" />
                                <span className="text-4xl font-black text-slate-900">+1</span>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Crédit Boost</span>
                            </motion.div>
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white p-4 rounded-xl border-4 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] flex flex-col items-center transform hover:scale-105 transition-transform">
                                <Sword className="h-8 w-8 text-red-600 mb-2" />
                                <span className="text-4xl font-black text-slate-900">+50</span>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">XP Gloire</span>
                            </motion.div>
                        </div>
                        <Button onClick={() => setShowVictoryModal(false)} className="w-full mt-8 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-black text-xl h-14 shadow-lg uppercase tracking-widest">Continuer le Combat</Button>
                    </div>
                </div>
            </div>
          )}
          </>
      )
  }

  return (
    <div className="space-y-4">
       <Script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js" strategy="lazyOnload" />

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
                     <span className="text-sm">Effectuer 1 action (Like, Commentaire ou Favori)</span>
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

       {/* VICTORY MODAL */}
       {/* Use a simple fixed overlay for testing if Dialog fails */}
       {showVictoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
             <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-yellow-500/50 p-6 text-center shadow-2xl">
                
                {/* Close Button */}
                <button 
                  onClick={() => setShowVictoryModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  ✕
                </button>

                <div className="flex flex-col items-center gap-4 py-6">
                   <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="relative"
                   >
                      <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse" />
                      <Medal className="h-32 w-32 text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]" />
                      <Star className="h-10 w-10 text-white absolute -top-2 -right-2 animate-ping" />
                   </motion.div>

                   <div className="space-y-2">
                      <h2 className="text-4xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 tracking-tighter drop-shadow-sm">
                         MISSION ACCOMPLIE !
                      </h2>
                      <p className="text-slate-300 font-medium text-lg">
                         L'escouade te doit une fière chandelle, Mercenaire.
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 w-full mt-6">
                      <motion.div 
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         transition={{ delay: 0.2 }}
                         className="bg-white p-4 rounded-xl border-4 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)] flex flex-col items-center transform hover:scale-105 transition-transform"
                      >
                         <Flame className="h-8 w-8 text-orange-500 mb-2" />
                         <span className="text-4xl font-black text-slate-900">+1</span>
                         <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Crédit Boost</span>
                      </motion.div>
                      
                      <motion.div 
                         initial={{ y: 20, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         transition={{ delay: 0.4 }}
                         className="bg-white p-4 rounded-xl border-4 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] flex flex-col items-center transform hover:scale-105 transition-transform"
                      >
                         <Sword className="h-8 w-8 text-red-600 mb-2" />
                         <span className="text-4xl font-black text-slate-900">+50</span>
                         <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">XP Gloire</span>
                      </motion.div>
                   </div>

                   <Button 
                      onClick={() => setShowVictoryModal(false)}
                      className="w-full mt-8 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-black text-xl h-14 shadow-lg uppercase tracking-widest"
                   >
                      Continuer le Combat
                   </Button>
                </div>
             </div>
          </div>
       )}
    </div>
  )
}
