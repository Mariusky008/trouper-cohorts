import { Footer } from "@/components/layout/Footer"
import Link from "next/link"
import { Trophy, ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="p-6 border-b flex justify-between items-center container mx-auto">
        <Link href="/" className="font-black text-xl tracking-tighter flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span>TROUPERS</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
           <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
         <h1 className="text-3xl font-black mb-8">Politique de Confidentialité</h1>
         
         <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
               <h2 className="text-xl font-bold mb-4">1. Données Collectées</h2>
               <p>Pour faire fonctionner l'escouade, nous collectons le strict minimum :</p>
               <ul className="list-disc pl-5 space-y-2">
                  <li>Votre email (pour l'authentification).</li>
                  <li>Vos liens publics (Profil TikTok, Vidéos) pour les partager à votre escouade.</li>
                  <li>Vos statistiques d'activité sur la plateforme (missions réussies, score de discipline).</li>
               </ul>
            </section>

            <section>
               <h2 className="text-xl font-bold mb-4">2. Utilisation des Données</h2>
               <p>Vos données servent uniquement à :</p>
               <ul className="list-disc pl-5 space-y-2">
                  <li>Vous attribuer une escouade adaptée.</li>
                  <li>Générer les missions quotidiennes pour vos camarades.</li>
                  <li>Calculer votre score de fiabilité et vos classements.</li>
               </ul>
               <p className="font-bold mt-2">Nous ne vendons pas vos données à des tiers.</p>
            </section>

            <section>
               <h2 className="text-xl font-bold mb-4">3. Visibilité Publique</h2>
               <p>
                  En rejoignant Troupers, vous acceptez que votre profil (Pseudo, Liens sociaux, Score) soit visible par :
               </p>
               <ul className="list-disc pl-5 space-y-2">
                  <li>Les membres de votre escouade (pour qu'ils puissent vous soutenir).</li>
                  <li>La communauté entière lors des "Boost Windows" (pour recevoir un soutien massif).</li>
               </ul>
            </section>

            <section>
               <h2 className="text-xl font-bold mb-4">4. Cookies</h2>
               <p>
                  Nous utilisons des cookies essentiels pour maintenir votre session connectée. Aucun traceur publicitaire tiers n'est installé.
               </p>
            </section>

            <section>
               <h2 className="text-xl font-bold mb-4">5. Vos Droits</h2>
               <p>
                  Conformément au RGPD, vous pouvez demander la suppression intégrale de votre compte et de vos données à tout moment en contactant le support ou via les paramètres de votre compte.
               </p>
            </section>
         </div>
      </main>

      <Footer />
    </div>
  )
}
