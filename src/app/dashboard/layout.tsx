"use client"

import Link from "next/link"
import { Home, Users, Settings, LogOut, Trophy, Video, GraduationCap, BookOpen, Coffee } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { assignUserToSquad } from "@/lib/squad-actions"
import { toast } from "sonner"
import { GlitchLogo } from "@/components/ui/glitch-logo" // Import GlitchLogo

import { SquadChatWidget } from "@/components/dashboard/squad-chat-widget"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<{username: string, avatar_url: string | null}>({username: "Recrue", avatar_url: null})
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // Try fetching profile first
      const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
      
      // Determine display name priority: Profile Username -> Metadata Username -> Email Name -> "Recrue"
      let displayName = "Recrue"
      
      if (data?.username) {
        displayName = data.username
      } else if (user.user_metadata?.username) {
        displayName = user.user_metadata.username
      } else if (user.user_metadata?.full_name) {
        displayName = user.user_metadata.full_name
      } else if (user.email) {
        displayName = user.email.split('@')[0]
      }

      setUserProfile({
        username: displayName,
        avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || null
      })

      // Self-healing: Check if user is in a squad
      try {
        const { data: squadMembership } = await supabase
          .from('squad_members')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!squadMembership) {
          console.log("Orphan user detected. Assigning to squad...")
          const result = await assignUserToSquad(supabase, user.id)
          if (result.success) {
             toast.success("Tu as rejoint une escouade !", {
               description: "Affectation automatique réussie."
             })
             // Force refresh to update dashboard if needed
             window.location.reload() 
          }
        }
      } catch (e) {
        console.error("Auto-assign error", e)
      }
    }
    getUser()
  }, [router, pathname]) // Re-fetch on navigation (e.g. after settings update)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const navItems = [
    { href: "/dashboard", label: "Tableau de bord", icon: Home },
    { href: "/dashboard/group", label: "Mon Escouade", icon: Users },
    { href: "/dashboard/my-posts", label: "Mes posts TikTok", icon: Video },
    { href: "/dashboard/leaves", label: "Demain je suis Off", icon: Coffee },
    { href: "/dashboard/rules", label: "Règles du jeu", icon: BookOpen },
    { href: "/dashboard/academy", label: "Academy (Obj 10K)", icon: GraduationCap },
    { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-32 items-center justify-center border-b px-0 py-0">
          <Link href="/dashboard" className="flex items-center justify-center w-full h-full">
            <div className="relative h-full w-full overflow-hidden">
               <GlitchLogo width={256} height={128} className="w-full h-full" imageClassName="object-cover" />
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors",
                pathname === item.href 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <SquadChatWidget />
    </div>
  )
}
