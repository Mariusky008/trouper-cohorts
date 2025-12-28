"use client"

import { Button } from "@/components/ui/button"
import { Trophy, TrendingUp, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function GroupPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Get Squad ID
        const { data: membership } = await supabase.from('squad_members').select('squad_id').eq('user_id', user.id).single()
        
        if (membership) {
           // 2. Fetch all members with their profiles
           const { data: squadMembers } = await supabase
             .from('squad_members')
             .select('joined_at, profiles(id, username, discipline_score)')
             .eq('squad_id', membership.squad_id)
             .order('profiles(discipline_score)', { ascending: false })

           if (squadMembers) {
              const formattedMembers = squadMembers.map((m: any, index: number) => {
                 const score = m.profiles?.discipline_score || 0
                 let status = "active"
                 
                 return {
                   id: m.profiles?.id,
                   name: m.profiles?.username || "Membre",
                   score,
                   status,
                   rank: index + 1,
                   isMe: m.profiles?.id === user.id
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
    fetchMembers()
  }, [])

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
                className={`flex items-center justify-between border-b py-4 last:border-0 hover:bg-muted/50 px-2 rounded-lg transition-colors ${member.isMe ? 'bg-primary/5 border-primary/20' : ''}`}
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
                      {member.status === "warning" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      {member.status === "danger" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.status === "active" ? "En feu 🔥" : member.status === "warning" ? "Attention ⚠️" : "En danger 🚨"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-lg text-primary`}>
                    {member.score} XP
                  </div>
                  <p className="text-xs text-muted-foreground">Discipline</p>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
