"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form State
  const [profile, setProfile] = useState({
    username: "",
    main_platform: "",
    objective: "",
    avatar_url: ""
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          setProfile({
            username: data.username || "",
            main_platform: data.main_platform || "",
            objective: data.objective || "",
            avatar_url: data.avatar_url || ""
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading("Upload de l'avatar...")
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('proofs') // Using proofs bucket for now for simplicity, ideally separate 'avatars' bucket
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(fileName)

      // Update profile immediately
      const { error: updateError } = await supabase.from('profiles').update({
        avatar_url: publicUrl
      }).eq('id', user.id)

      if (updateError) throw updateError

      setProfile({ ...profile, avatar_url: publicUrl })
      toast.success("Avatar mis à jour !")
      router.refresh()
    } catch (error: any) {
      toast.error("Erreur", { description: error.message })
    } finally {
      toast.dismiss(toastId)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('profiles').update({
        username: profile.username,
        main_platform: profile.main_platform,
        objective: profile.objective
      }).eq('id', user.id)

      if (error) throw error

      toast.success("Profil mis à jour !")
      router.refresh()
    } catch (error: any) {
      toast.error("Erreur", { description: error.message })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) return <div className="p-8 text-center">Chargement...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gère ton profil, ton abonnement et tes préférences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="billing">Abonnement</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil Public</CardTitle>
              <CardDescription>
                Ces informations seront visibles par les membres de ton escouade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-muted-foreground">{profile.username?.charAt(0).toUpperCase()}</span>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div>
                  <Button variant="outline" size="sm" className="relative">
                    Changer la photo
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleAvatarUpload}
                    />
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG max 2MB</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nom d'affichage (Pseudo)</Label>
                <Input 
                  id="username" 
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  placeholder="Ex: Jules Créateur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Plateforme Principale</Label>
                <Input 
                  id="platform" 
                  value={profile.main_platform}
                  onChange={(e) => setProfile({ ...profile, main_platform: e.target.value })}
                  placeholder="Ex: TikTok"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective">Objectif Principal</Label>
                <Input 
                  id="objective" 
                  value={profile.objective}
                  onChange={(e) => setProfile({ ...profile, objective: e.target.value })}
                  placeholder="Ex: Visibilité"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Enregistrement..." : "Sauvegarder les modifications"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Abonnement Actuel</CardTitle>
              <CardDescription>
                Gère ton plan et tes méthodes de paiement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Plan Starter (Essai Gratuit)</p>
                  <p className="text-sm text-muted-foreground">Fin de l'essai dans 7 jours</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">0€ / mois</p>
                  <p className="text-xs text-muted-foreground">puis 50€/mois</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Annuler l'essai</Button>
              <Button>Mettre à jour le paiement</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de contact</CardTitle>
              <CardDescription>
                Choisis comment nous pouvons te contacter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Rappels quotidiens</Label>
                  <p className="text-sm text-muted-foreground">
                    Reçois un email si tu n'as pas validé tes tâches à 18h.
                  </p>
                </div>
                {/* Switch component would go here, using a checkbox for MVP */}
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Activité de l'escouade</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications quand un membre commente ton travail.
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Enregistrer les préférences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="pt-6 border-t">
         <Button variant="destructive" className="w-full sm:w-auto" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
         </Button>
      </div>
    </div>
  )
}
