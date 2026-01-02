"use client"

import { Button } from "@/components/ui/button"
import { Trophy, TrendingUp, AlertTriangle, ExternalLink, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function GroupPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setUser] = useState<any>(null)
  const [confirmingSubscription, setConfirmingSubscription] = useState<string | null>(null) // ID of member being subscribed to
  const supabase = createClient()

  const fetchMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)

      // 1. Get Squad ID
      const { data: membership } = await supabase.from('squad_members').select('squad_id').eq('user_id', user.id).single()
      
      if (membership) {
         // 2. Fetch all members with their profiles
         const { data: squadMembers } = await supabase
           .from('squad_members')
           .select('joined_at, profiles(id, username, discipline_score, main_platform)')
           .eq('squad_id', membership.squad_id)
           .order('profiles(discipline_score)', { ascending: false })

         // 3. Fetch current user's subscriptions
         const { data: subscriptions } = await supabase
           .from('member_subscriptions')
           .select('target_user_id')
           .eq('subscriber_id', user.id)
         
         const subscribedIds = new Set(subscriptions?.map((s: { target_user_id: string }) => s.target_user_id))

         if (squadMembers) {
            const formattedMembers = squadMembers.map((m: any, index: number) => {
               const score = m.profiles?.discipline_score || 0
               let status = "active"
               
               return {
                 id: m.profiles?.id,
                 name: m.profiles?.username || "Membre",
                 platform_link: m.profiles?.main_platform || "https://tiktok.com",
                 score,
                 status,
                 rank: index + 1,
                 isMe: m.profiles?.id === user.id,
                 isSubscribed: subscribedIds.has(m.profiles?.id)
               }
            })
            setMembers(formattedMembers)
         }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const handleSubscribe = async () => {
    if (!confirmingSubscription) return

    try {
      const { error } = await supabase.from('member_subscriptions').insert({
        subscriber_id: currentUser.id,
        target_user_id: confirmingSubscription
      })

      if (error) throw error

      toast.success("Abonnement confirmé !")
      
      // Optimistic update
      setMembers(members.map(m => 
        m.id === confirmingSubscription ? { ...m, isSubscribed: true } : m
      ))
      setConfirmingSubscription(null)

    } catch (error) {
      toast.error("Erreur lors de la validation")
    }
  }

  if (loading) return <div className="p-8 text-center">Chargement du classement...</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Escouade Alpha</h1>
          <p className="text-muted-foreground">{members.length} créateurs • Objectif TikTok</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-2 text-yellow-600">
          <Trophy className="h-5 w-5" />
          <span className="font-bold">Top 5%</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6">
          <div className="space-y-1">
            {members.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">
                 Tu es le seul membre pour l'instant ! Invite tes amis.
               </div>
            ) : (
            members.map((member) => (
              <div 
                key={member.id} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between border-b py-4 last:border-0 hover:bg-muted/50 px-2 rounded-lg transition-colors gap-4 ${member.isMe ? 'bg-primary/5 border-primary/20' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center font-bold text-muted-foreground">
                    #{member.rank}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground uppercase">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {member.name} {member.isMe && "(Toi)"}
                      {member.isSubscribed && !member.isMe && (
                        <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle className="h-3 w-3" /> Abonné
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.status === "active" ? "En feu 🔥" : member.status === "warning" ? "Attention ⚠️" : "En danger 🚨"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 ml-12 sm:ml-0">
                  {!member.isMe && !member.isSubscribed && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 gap-2 text-xs"
                      onClick={() => {
                        window.open(member.platform_link, '_blank')
                        // Trigger confirmation dialog
                        setConfirmingSubscription(member.id)
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      S'abonner
                    </Button>
                  )}
                  
                  <div className="text-right min-w-[60px]">
                    <div className={`font-bold text-lg ${member.score >= 90 ? "text-green-600" : member.score >= 50 ? "text-orange-500" : "text-red-500"}`}>
                      {member.score} pts
                    </div>
                    <p className="text-xs text-muted-foreground">Discipline</p>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!confirmingSubscription} onOpenChange={(open) => !open && setConfirmingSubscription(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation d'abonnement</DialogTitle>
            <DialogDescription>
              Pour valider cette action, tu dois t'être abonné au compte de ce membre.
              <br />
              C'est important pour le soutien mutuel de l'escouade !
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmingSubscription(null)}>
              Pas encore
            </Button>
            <Button onClick={handleSubscribe} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              C'est fait, je suis abonné
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
