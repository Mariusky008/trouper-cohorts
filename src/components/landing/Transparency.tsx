import { AlertTriangle } from "lucide-react"

export function Transparency() {
  return (
    <section className="py-12 border-t bg-muted/10">
      <div className="container mx-auto max-w-3xl px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4 text-muted-foreground">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold uppercase tracking-wider text-sm">Transparence</span>
        </div>
        <p className="text-muted-foreground">
          Aucun chiffre de vues ou d'abonnés n'est garanti. Les résultats dépendent de la qualité de votre contenu et des algorithmes des plateformes.
          <br className="hidden md:block" />
          Ce que nous garantissons : un <span className="text-foreground font-medium">cadre de travail</span>, un <span className="text-foreground font-medium">système de discipline</span> et une <span className="text-foreground font-medium">communauté active</span>.
        </p>
      </div>
    </section>
  )
}
