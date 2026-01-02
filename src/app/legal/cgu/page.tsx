import { Footer } from "@/components/layout/Footer"
import Link from "next/link"
import { Trophy, ArrowLeft } from "lucide-react"

export default function CGUPage() {
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
         <h1 className="text-3xl font-black mb-8">Conditions Générales d'Utilisation (CGU)</h1>
         <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : 02 Janvier 2026</p>

         <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
               <h2 className="text-xl font-bold mb-4">1. Objet</h2>
               <p>
                  Les présentes CGU régissent l'utilisation de la plateforme Troupers. En vous inscrivant, vous acceptez sans réserve ces conditions. 
                  Troupers est une plateforme d'entraide communautaire pour créateurs de contenu ("Les Soldats").
               </p>
            </section>

            <section>
               <h2 className="text-xl font-bold mb-4">2. Le Code d'Honneur (Règles d'Engagement)</h2>
               <p>L'utilisation de Troupers repose sur la réciprocité. Tout utilisateur s'engage à :</p>
               <ul className="list-disc pl-5 space-y-2">
                  <li>Soutenir réellement les membres de son escouade (pas de bots, pas de faux comptes).</li>
                  <li>Maintenir un comportement respectueux dans les commentaires.</li>
                  <li>Ne pas poster de contenu illégal, haineux ou pornographique via les liens soumis.</li>
               </ul>
            </section>

            <section>
               <h2 className="text-xl font-bold mb-4">3. Le Système de Crédits et Sanctions</h2>
               <p>
                  Troupers utilise un système gamifié. Les "Crédits" n'ont aucune valeur monétaire réelle et ne sont pas convertibles en argent.
                  Ils servent uniquement à débloquer des fonctionnalités internes (Boosts).
               </p>
               <p className="mt-2">
                  <strong>Le Protocole Mercenaire :</strong> L'utilisateur accepte que s'il ne réalise pas ses actions quotidiennes, ses "missions" puissent être réattribuées à d'autres utilisateurs, entraînant une perte virtuelle de points ou de crédits.
               </p>
            </section>

            <section>
               <h2 className="text-xl font-bold mb-4">4. Responsabilité</h2>
               <p>
                  Troupers est un outil de mise en relation. Nous ne garantissons pas :
               </p>
               <ul className="list-disc pl-5 space-y-2">
                  <li>Des résultats spécifiques sur votre croissance TikTok/Instagram.</li>
                  <li>Le fonctionnement continu de l'algorithme des plateformes tierces.</li>
               </ul>
               <p className="mt-2">
                  L'utilisateur est seul responsable de son compte sur les plateformes tierces (TikTok, etc.). Troupers ne saurait être tenu responsable en cas de suspension de compte tiers.
               </p>
            </section>

            <section>
               <h2 className="text-xl font-bold mb-4">5. Résiliation</h2>
               <p>
                  Tout manquement au Code d'Honneur (inactivité prolongée, triche, comportement toxique) pourra entraîner le bannissement définitif de l'escouade et de la plateforme, sans préavis.
               </p>
            </section>
         </div>
      </main>

      <Footer />
    </div>
  )
}
