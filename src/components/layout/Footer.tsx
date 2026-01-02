import Link from "next/link"
import { Trophy, Shield, Instagram, Twitter, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4 lg:gap-12">
          
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tighter">
              <Trophy className="h-6 w-6 text-primary" />
              <span>TROUPERS</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              La première plateforme d'engagement militaire pour créateurs de contenu. 
              Discipline, Entraide, Croissance. Rejoignez les rangs et percez l'algorithme.
            </p>
            <div className="flex gap-4">
               <a href="#" className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-700">
                  <Instagram className="h-4 w-4" />
               </a>
               <a href="#" className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-700">
                  <Twitter className="h-4 w-4" />
               </a>
               <a href="https://whatsapp.com/channel/0029VbBcgs71iUxRPnXEdF1z" target="_blank" className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors text-green-700">
                  <MessageCircle className="h-4 w-4" />
               </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-900 dark:text-slate-100">Plateforme</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/how-it-works" className="hover:text-primary transition-colors">
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Connexion Soldat
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-primary transition-colors">
                  Recrutement
                </Link>
              </li>
              <li>
                 <span className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                    Shop (Bientôt)
                 </span>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-slate-900 dark:text-slate-100">Légal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/legal/cgu" className="hover:text-primary transition-colors">
                  Conditions Générales (CGU)
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-primary transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/admin" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Shield className="h-3 w-3" />
                  Administration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Troupers. Fait avec discipline par le QG.</p>
        </div>
      </div>
    </footer>
  )
}
