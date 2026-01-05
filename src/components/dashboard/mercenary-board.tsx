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

import { MissionPlan } from "./MissionPlan"

export function MercenaryBoard({ onCreditsEarned }: { onCreditsEarned?: () => void }) {
  const [isMounted, setIsMounted] = useState(false)
  const [bounties, setBounties] = useState<any[]>([])
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ... rest of state ...
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [strikeAlert, setStrikeAlert] = useState<any>(null)
  const [hasViewedVideo, setHasViewedVideo] = useState(false)
  
  const supabase = createClient()
  // const [debugInfo, setDebugInfo] = useState<string>("") // Removed unused state

  const fetchBounties = async () => {
    try {
      // setDebugInfo("Fetching...")
      // Fix: Remove the relation query for now to debug basic access
      // Try simple fetch first
      const { data, error } = await supabase
        .from('bounties')
        .select(`
            id,
            squad_id,
            defector_user_id,
            target_user_id,
            status,
            type,
            video_url,
            reward_credits,
            created_at
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      
      // If basic fetch works, we can manually fetch profiles later if needed
      // But let's fix the immediate crash first

      
      if (error) {
         // setDebugInfo(`Error: ${error.message} (${error.code})`)
         console.error("Supabase Error:", error)
         if (error.code === '42P01') {
             toast.error("Table 'bounties' introuvable")
         }
       } else {
         // setDebugInfo(`Success: Got ${data?.length || 0} bounties.`)
       }
       
       // Filter out bounties where I am the defector
       let visibleBounties = (data || []).filter((b: any) => b.defector_user_id !== user?.id)
       
       // setDebugInfo(prev => `${prev} | Visible: ${visibleBounties.length} | My ID: ${user?.id}`)
       
       // MANUALLY FETCH USER NAMES to fix display
       // Extract all user IDs we need to look up
       const targetIds = [...new Set(visibleBounties.map((b: any) => b.target_user_id))]
       
       if (targetIds.length > 0) {
           const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, current_video_url')
            .in('id', targetIds)
            
           // Create a map for quick lookup
           const profileMap = new Map()
           profiles?.forEach((p: any) => profileMap.set(p.id, p))
           
           // Enrich bounties with profile data manually
           visibleBounties = visibleBounties.map((b: any) => ({
               ...b,
               target: profileMap.get(b.target_user_id) || { username: 'Soldat Inconnu', current_video_url: b.video_url }
           }))
       }

       setBounties(visibleBounties)
       
       // REMOVE DIAGNOSTIC LOGIC (Clean up)
      if ((data || []).length === 0) {
          fetch('/api/cron/debug-bounties').then(res => res.json()).then(debugData => {
              if (debugData.count > 0) {
                  toast.error("Erreur de Permissions Détectée", {
                      description: `Il y a ${debugData.count} missions dans la base, mais vous ne pouvez pas les voir. Exécutez le script SQL de réparation (RLS).`,
                      duration: 10000
                  })
              }
          })
      }
    } catch (e) {
      console.error("Error fetching bounties", e)
    } finally {
      setLoading(false)
    }
  }

  const checkMyStrikes = async (userId: string) => {
      // Check if I have caused any bounties TODAY (meaning I got a strike today)
      // IMPORTANT: bounties created_at is in UTC. We need to match the day correctly.
      const now = new Date()
      // Create date string for start of today UTC
      const today = now.toISOString().split('T')[0]
      
      const { data: myFaults } = await supabase
        .from('bounties')
        .select('id')
        .eq('defector_user_id', userId)
        .gte('created_at', today)
        
      if (myFaults && myFaults.length > 0) {
          const count = myFaults.length
          // Check if user has already acknowledged this alert (using localStorage to avoid spamming every refresh)
          const ackKey = `strike_ack_${today}_${userId}`
          if (!localStorage.getItem(ackKey)) {
             setStrikeAlert({ count })
             localStorage.setItem(ackKey, 'true')
          }
      }
  }

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
            fetchBounties()
            checkMyStrikes(user.id)
        }

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
    setHasViewedVideo(false)
  }

  const handleCompleteBounty = async () => {
    if (!selectedBounty || !user) return
    setProcessing(true)

    // Handle simulation completion locally
    // REMOVED FOR PRODUCTION - Simulation logic commented out to force real DB interaction
    /*
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
    */

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
        
        // Refresh the list immediately to show remaining bounties
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

  if (!isMounted) {
    return (
        <div className="rounded-xl border border-slate-200 p-8 flex items-center justify-center">
            <div className="h-8 w-8 text-slate-400 animate-spin rounded-full border-4 border-slate-200 border-t-red-600"></div>
        </div>
    )
  }

  if (loading) return null

  // Safe check for bounties array
  const safeBounties = Array.isArray(bounties) ? bounties : []
  
  if (safeBounties.length === 0) {
      return (
          <>
          <div className="rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200 p-8 text-center shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
             {/* Background Decoration */}
             <div className="absolute top-0 right-0 p-8 opacity-5 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <ShieldAlert className="h-32 w-32 text-slate-400" />
             </div>
             
             <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-2 animate-pulse-slow">
                   <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">
                   Secteur Sécurisé
                </h3>
                
                <p className="text-sm text-slate-500 max-w-sm font-medium">
                   Aucune alerte Mercenaire en cours. <br/>
                   <span className="text-slate-400 font-normal">Toutes les escouades sont opérationnelles. Repose-toi soldat.</span>
                </p>

                {/* Hidden Trigger for Demo - Kept for Admin testing if needed */}
                <Button variant="ghost" size="sm" onClick={simulateProtocol} className="mt-4 opacity-0 hover:opacity-100 text-[10px] text-slate-300 transition-opacity absolute bottom-2 right-2">
                   (Dev: Test)
                </Button>
             </div>
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
          <div className="flex flex-col items-end">
             <Badge variant="destructive" className="animate-pulse">
                {safeBounties.length} Missions Urgentes
             </Badge>
          </div>
       </div>

       {/* Grid limited to 2 items for compact view */}
       <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
          {safeBounties.slice(0, 2).map((bounty) => (
             <motion.div  
                layout
                key={bounty.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                className="bg-gradient-to-br from-red-50 to-slate-50 border border-red-200 rounded-xl p-4 shadow-sm relative overflow-hidden h-full"
             >
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Sword className="h-24 w-24 text-red-900" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                   <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                         Sauvetage Escouade
                      </Badge>
                      <span className="text-xs font-bold text-red-600">Expire à minuit</span>
                   </div>
                   
                   <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1">
                      Soutenir {bounty.target?.username || "Soldat Inconnu"}
                   </h3>
                   <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      Un membre a déserté. L'escouade a besoin de renfort immédiat.
                   </p>

                   <div className="mt-auto space-y-3">
                       <div className="flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 w-fit">
                          <Sword className="h-4 w-4" />
                          Récompense : 1 Crédit + Gloire
                       </div>

                       <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                          <span>Mission #{bounty.id.toString().slice(-4)}</span>
                          <span className="font-mono">{safeBounties.indexOf(bounty) + 1}/{safeBounties.length}</span>
                       </div>

                       <Button 
                         className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-500/20"
                         onClick={() => handleClaimBounty(bounty)}
                       >
                          ACCEPTER LA MISSION
                       </Button>
                   </div>
                </div>
             </motion.div>
          ))}
          </AnimatePresence>
       </div>

       {safeBounties.length > 2 && (
           <p className="text-center text-xs text-slate-400 font-medium animate-pulse">
               +{safeBounties.length - 2} autres missions en attente... Complète celles-ci pour voir la suite.
           </p>
       )}

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
                     onClick={() => setHasViewedVideo(true)}
                     className="text-lg font-bold text-blue-600 hover:underline flex items-center justify-center gap-2"
                  >
                     <ExternalLink className="h-4 w-4" />
                     Voir la Vidéo
                  </a>
               </div>

               <MissionPlan 
                  type={selectedBounty.type || 'like'} 
                  scenario={
                      // Simulation de la répartition 85/15 en attendant le backend
                      // On utilise le dernier chiffre de l'ID ou du timestamp
                      (parseInt(selectedBounty.id) || Date.parse(selectedBounty.created_at)) % 7 === 0 
                        ? 'abandon' 
                        : 'engagement'
                  }
                  delayMinutes={(parseInt(selectedBounty.id) || Date.parse(selectedBounty.created_at)) % 20} // Simulation déterministe du délai
                  trafficSource={
                      // 50% Search, 30% Profile, 20% Direct
                      (parseInt(selectedBounty.id) || 0) % 2 === 0 ? 'search' : ((parseInt(selectedBounty.id) || 0) % 3 === 0 ? 'profile' : 'direct')
                  }
                  targetUsername={selectedBounty.target?.username || "inconnu"}
               />
            </div>

            <DialogFooter>
               <Button 
                  onClick={handleCompleteBounty} 
                  disabled={processing || !hasViewedVideo}
                  className={`w-full font-bold transition-all ${
                     !hasViewedVideo 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
               >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : (!hasViewedVideo ? "VOIR LA VIDÉO D'ABORD" : "J'AI FAIT LE JOB (RÉCLAMER)")}
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

       {/* STRIKE ALERT MODAL */}
       {strikeAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in-95 duration-300">
             <div className="relative w-full max-w-md rounded-xl bg-slate-900 border border-red-500/50 p-8 text-center shadow-2xl">
                
                <div className="flex flex-col items-center gap-6">
                   <div className="relative">
                      <div className="absolute inset-0 bg-red-500 blur-xl opacity-20 animate-pulse" />
                      <AlertTriangle className="h-20 w-20 text-red-500" />
                   </div>

                   <div className="space-y-4">
                      <h2 className="text-3xl font-black uppercase text-white tracking-tighter">
                         MANQUEMENT AU DEVOIR
                      </h2>
                      <p className="text-slate-300 font-medium leading-relaxed">
                         Soldat, tu n'as pas rempli tes missions hier. <br/>
                         Le Protocole Mercenaire a été activé.
                      </p>
                      
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
                         <div className="flex items-center justify-between text-red-200">
                            <span>Avertissements (Strikes)</span>
                            <span className="font-bold text-red-500">+{strikeAlert.count}</span>
                         </div>
                         <div className="flex items-center justify-between text-red-200">
                            <span>Discipline Perdue</span>
                            <span className="font-bold text-red-500">-{strikeAlert.count * 10} pts</span>
                         </div>
                      </div>
                      
                      <p className="text-xs text-slate-500 italic">
                         Tes camarades ont reçu une prime pour faire ton travail à ta place. Ressaisis-toi.
                      </p>
                   </div>

                   <Button 
                      onClick={() => setStrikeAlert(false)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 uppercase tracking-widest"
                   >
                      COMPRIS, JE ME REPRENDS
                   </Button>
                </div>
             </div>
          </div>
       )}
    </div>
  )
}
