import { ThumbsUp, MessageCircle, TrendingUp, TrendingDown } from "lucide-react"

export function Truth() {
  return (
    <section className="py-24 md:py-32 border-b">
      <div className="container mx-auto max-w-5xl px-4 text-center">
        <h2 className="mb-16 text-3xl font-bold tracking-tight md:text-4xl">
          La dure vérité : <span className="text-primary">Engagement &gt; Talent</span>
        </h2>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Video A - Viral */}
          <div className="flex flex-col rounded-xl border-2 border-primary bg-background p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-bl-lg z-10">
              Propulsé
            </div>
            
            {/* Thumbnail Container 16:9 */}
            <div className="mb-6 w-full h-48 rounded-lg bg-yellow-400 overflow-hidden relative group shadow-sm border flex items-center justify-center">
              {/* CSS-only Clickbait Thumbnail */}
              <div className="absolute inset-0 bg-yellow-400" />
              <div className="relative z-10 text-9xl transform group-hover:scale-110 transition-transform duration-300">
                😱
              </div>
              
              {/* Clickbait Text Overlay */}
              <div className="absolute top-4 left-4 right-4 z-20">
                 <span className="bg-red-600 text-white text-xl md:text-2xl font-black uppercase px-3 py-1 -rotate-3 inline-block shadow-lg border-2 border-black">
                   J'AI TOUT QUITTÉ !!
                 </span>
              </div>

              {/* Progress Bar (Watched) */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                <div className="h-full w-[90%] bg-red-600" />
              </div>

              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                8:02
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">100k</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Likes</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold">8k</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Coms</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">Viral</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Portée</span>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t">
              <p className="font-semibold text-green-600">"Contenu simple mais engageant"</p>
            </div>
          </div>

          {/* Video B - Flop */}
          <div className="flex flex-col rounded-xl border bg-muted/30 p-6 opacity-80">
            {/* Thumbnail Container 16:9 */}
            <div className="mb-6 w-full h-48 rounded-lg bg-zinc-900 overflow-hidden relative border border-dashed grayscale-[30%]">
               {/* Reliable Image Source */}
               <img 
                 src="https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=800&auto=format&fit=crop" 
                 alt="Miniature Artistique" 
                 className="h-full w-full object-cover opacity-60"
               />
              
              {/* Artistic/Clean Text */}
              <div className="absolute bottom-8 left-0 right-0 text-center">
                 <p className="text-white/90 font-serif italic text-sm tracking-widest drop-shadow-md">Essai sur la solitude contemporaine...</p>
              </div>

              {/* Duration */}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                24:15
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-muted-foreground">12</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Likes</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-muted-foreground">0</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Coms</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-red-500">Stop</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Portée</span>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t">
              <p className="font-semibold text-muted-foreground">"Chef-d'œuvre invisible"</p>
            </div>
          </div>
        </div>

        <div className="mt-16 mx-auto max-w-2xl">
          <p className="text-xl font-medium">
            Les plateformes poussent l’engagement, pas le mérite.
          </p>
          <p className="mt-4 text-muted-foreground">
            Pour percer, tu as besoin d'une étincelle initiale. C'est mathématique.
          </p>
        </div>
      </div>
    </section>
  )
}
