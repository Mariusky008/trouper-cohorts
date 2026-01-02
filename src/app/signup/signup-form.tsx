"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const error = searchParams.get('error')
    const error_description = searchParams.get('error_description')
    if (error) {
      toast.error("Erreur d'authentification", {
        description: error_description || "Le lien a expiré ou est invalide."
      })
    }
  }, [searchParams])

  const getURL = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/`
    }
    let url =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_VERCEL_URL ??
      'http://localhost:3000/'
    
    url = url.includes('http') ? url : `https://${url}`
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
    return url
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}auth/callback`,
        data: {
          username: firstName, // Save first name as username in metadata
          full_name: firstName // Standard field often used
        }
      }
    })

    if (error) {
      toast.error("Erreur lors de l'inscription", {
        description: error.message
      })
      setLoading(false)
    } else {
      // If session exists immediately (email confirmation disabled)
      if (data.session) {
         toast.success("Connexion réussie !")
         router.push("/onboarding")
      } else {
         setSuccess(true)
         setLoading(false)
      }
    }
  }

  const handleResend = async () => {
    setLoading(true)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `https://troupers.vercel.app/auth/callback`
      }
    })
    
    if (error) {
      toast.error("Erreur d'envoi", { description: error.message })
    } else {
      toast.success("Email renvoyé !", { description: "Vérifie tes spams/indésirables." })
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <div className="w-full max-w-md space-y-8 rounded-xl border bg-background p-8 shadow-lg text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold">Vérifie ta boîte mail</h2>
          <p className="text-muted-foreground">
            Un lien de confirmation a été envoyé à <span className="font-medium text-foreground">{email}</span>.
          </p>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              💡 Pense à vérifier tes <strong>SPAMS</strong> ou courriers indésirables.
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? "Envoi en cours..." : "Renvoyer l'email"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setSuccess(false)}>
              Retour
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleGoogleLogin = async () => {
    // Note: Google login will get the name from the Google profile automatically
    // but we can't force it here easily without custom parameters or pre-auth state.
    // Supabase will automatically use Google's 'name' as full_name.
    // Our handle_new_user trigger in SQL uses raw_user_meta_data->>'username'.
    // We might need to adjust the SQL trigger to fallback to full_name if username is missing.

    // Dynamically get the current origin to support different ports (3000, 3001, etc.)
    const origin = typeof window !== 'undefined' && window.location.origin 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
        // We can try to pass query params to force prompt, but metadata is usually from provider
      },
    })
    if (error) {
       toast.error("Erreur Google", { description: error.message })
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Link>

      <div className="w-full max-w-md space-y-8 rounded-xl border bg-background p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Rejoins les Troupers</h1>
          <p className="mt-2 text-muted-foreground">Commence ton essai gratuit de 7 jours.</p>
        </div>

        <div className="space-y-4">
          <Button variant="outline" className="w-full h-12" onClick={handleGoogleLogin}>
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuer avec Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou avec email</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="firstname">
                Prénom
              </label>
              <input
                id="firstname"
                type="text"
                placeholder="Ton Prénom"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                placeholder="Mot de passe"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? "Chargement..." : "Continuer"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          En continuant, tu acceptes nos conditions d'utilisation et notre politique de confidentialité.
        </p>
      </div>
    </div>
  )
}
