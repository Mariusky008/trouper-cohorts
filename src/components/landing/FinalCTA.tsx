import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="py-24 md:py-32 text-center">
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-8">
          Prêt à passer à l'action ?
        </h2>
        <Button size="lg" className="h-14 px-8 text-lg" asChild>
          <Link href="/signup">
            Rejoindre le programme gratuit (7 jours)
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
