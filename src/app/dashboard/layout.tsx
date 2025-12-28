"use client"

import Link from "next/link"
import { Home, Users, Settings, LogOut, Trophy } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<{username: string, avatar_url: string | null}>({username: "Membre", avatar_url: null})
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
      if (data) {
        setUserProfile({
          username: data.username || "Membre",
          avatar_url: data.avatar_url
        })
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
    { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <Trophy className="h-6 w-6 text-primary" />
            <span>Troupers</span>
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
        <header className="flex h-16 items-center justify-between border-b bg-background px-6 md:px-8">
          <h1 className="text-lg font-semibold md:hidden">Troupers</h1>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/dashboard/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                {userProfile.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  userProfile.username.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-sm font-medium">{userProfile.username}</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
