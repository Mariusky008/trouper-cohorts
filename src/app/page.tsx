import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlitchLogo } from "@/components/ui/glitch-logo";
import { ArrowRight, CheckCircle2, Trophy, Users, Zap } from "lucide-react";
import { PreRegistrationForm } from "@/components/pre-registration-form";

import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 relative overflow-hidden rounded bg-primary flex items-center justify-center">
                <span className="font-black text-primary-foreground text-xs">PA</span>
             </div>
            <span className="font-bold text-lg tracking-tight">Popey Academy</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link href="/#join">Rejoindre une cohorte</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-4 text-center space-y-8 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto max-w-4xl space-y-6">
            <Badge variant="outline" className="px-4 py-1.5 text-sm rounded-full border-primary/20 bg-primary/5 text-primary">
              🚀 Nouvelle cohorte : Démarrage lundi prochain
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-balance">
              Popey Academy <br className="hidden md:block" />
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                La force du groupe.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              14 jours. 24 pros. 1 seul par métier.
              <br />
              Le sprint intensif pour dominer votre marché local.
            </p>

            <div id="join" className="pt-8 w-full max-w-md mx-auto">
              <PreRegistrationForm />
            </div>

            <div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground grayscale opacity-70">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" /> 24 places max
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" /> 14 jours intensifs
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Leaderboard live
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30 border-y">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: "VOTRE ÉQUIPAGE DE GUERRE",
                  desc: "Pas de concurrents. Que des alliés. Un seul pro par métier. Vous formez une alliance stratégique impénétrable sur votre secteur. On avance ensemble, ou on meurt seul.",
                },
                {
                  icon: Zap,
                  title: "COMMANDO 14 JOURS",
                  desc: "Fini de jouer. Chaque matin : Vidéo, Prospection, Live. Si tu ne fais pas le job, tu fais couler ton équipe. Un programme d'élite pour ceux qui veulent vraiment des résultats.",
                },
                {
                  icon: Trophy,
                  title: "SURVIE & GLOIRE",
                  desc: "Classement impitoyable. Les faibles abandonnent, les forts dominent. Prouve ta valeur chaque jour avec des preuves concrètes. Pas de blabla, que des résultats.",
                },
              ].map((feature, i) => (
                <div key={i} className="bg-background p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Program Teaser */}
            <div className="mt-20 text-center space-y-8">
                <h2 className="text-3xl font-black tracking-tight">CE QUI VOUS ATTEND</h2>
                <div className="grid md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
                    <div className="bg-background border p-4 rounded-lg">
                        <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Jour 1-3</div>
                        <div className="font-bold">Le Choc</div>
                        <p className="text-sm text-muted-foreground mt-2">Audit brutal, Vidéo de présentation, Duo "No Mercy".</p>
                    </div>
                    <div className="bg-background border p-4 rounded-lg">
                        <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Jour 4-7</div>
                        <div className="font-bold">La Production</div>
                        <p className="text-sm text-muted-foreground mt-2">Création de contenu massive, Masterclass Vente, Trio Pitch.</p>
                    </div>
                    <div className="bg-background border p-4 rounded-lg">
                        <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Jour 8-10</div>
                        <div className="font-bold">La Chasse</div>
                        <p className="text-sm text-muted-foreground mt-2">50 contacts/jour, Cold Calling en live, Gestion des objections.</p>
                    </div>
                    <div className="bg-background border p-4 rounded-lg">
                        <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Jour 11-14</div>
                        <div className="font-bold">Le Closing</div>
                        <p className="text-sm text-muted-foreground mt-2">Signature de contrats, Examen final, Plan à 90 jours.</p>
                    </div>
                </div>
            </div>

          </div>
        </section>

        {/* Value Prop */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl bg-primary text-primary-foreground rounded-3xl p-8 md:p-16 text-center space-y-8 overflow-hidden relative">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Prêt à passer à l'action ?
              </h2>
              <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
                Fini de poster dans le vide. Rejoignez une escouade locale et décuplez votre visibilité.
              </p>
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full" asChild>
                <Link href="/#join">
                  Rejoindre la prochaine cohorte
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
