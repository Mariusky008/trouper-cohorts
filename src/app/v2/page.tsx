import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Trophy, Users, Zap, Shield, Target, Clock, ArrowDown } from "lucide-react";
import { PreRegistrationForm } from "@/components/pre-registration-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingV2() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-yellow-500/30">
      {/* Sticky Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 text-yellow-400">
                <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="512" height="512" rx="128" fill="currentColor" />
                    <path d="M277.333 234.667V149.333L170.667 298.667H234.667V384L341.333 234.667H277.333Z" fill="#09090b"/>
                </svg>
             </div>
            <span className="font-bold text-lg tracking-tight text-white">Popey Academy</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-900 hidden sm:inline-flex" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button className="bg-yellow-400 text-zinc-950 hover:bg-yellow-500 font-bold" asChild>
              <Link href="#join">Rejoindre</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* A. Hero Section "L'Urgence" */}
        <section className="relative py-24 md:py-32 px-4 text-center overflow-hidden">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div className="container mx-auto max-w-4xl relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              LIVE : Cohorte en formation
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-balance leading-[0.9]">
              14 jours pour bâtir<br />
              <span className="text-yellow-400">votre alliance locale.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto text-balance font-medium">
              Rejoignez le commando d'élite de votre département.<br/>
              Un seul pro par métier. Zéro théorie.
            </p>

            <div className="pt-8">
              <Button size="lg" className="bg-yellow-400 text-zinc-950 hover:bg-yellow-500 font-black text-lg h-14 px-8 rounded-none skew-x-[-10deg]" asChild>
                <Link href="#join">
                  <span className="skew-x-[10deg]">VÉRIFIER MA DISPONIBILITÉ</span>
                </Link>
              </Button>
              <p className="text-zinc-500 text-sm mt-4">
                Bloquez votre exclusivité avant votre concurrent.
              </p>
            </div>
          </div>
        </section>

        {/* B. Le Concept "1/101" (Bento Grid) */}
        <section className="py-20 bg-zinc-900/50 border-y border-zinc-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-black tracking-tight text-center mb-12">
              LA DOCTRINE <span className="text-yellow-400">1/101</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-yellow-400/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="h-24 w-24" />
                </div>
                <Shield className="h-10 w-10 text-yellow-400 mb-6" />
                <h3 className="text-xl font-bold mb-3">Exclusivité Totale</h3>
                <p className="text-zinc-400 leading-relaxed">
                  101 départements, 1 seule place par métier. Une fois la place prise, elle est verrouillée pour l'année.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-yellow-400/50 transition-colors md:col-span-2">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users className="h-24 w-24" />
                </div>
                <Users className="h-10 w-10 text-yellow-400 mb-6" />
                <h3 className="text-xl font-bold mb-3">Pression Sociale Positive</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Système de binôme (Buddy). Si vous n'avancez pas, votre partenaire vous relance. On ne laisse personne derrière, mais on ne tolère pas les touristes.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-yellow-400/50 transition-colors md:col-span-2">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Target className="h-24 w-24" />
                </div>
                <Target className="h-10 w-10 text-yellow-400 mb-6" />
                <h3 className="text-xl font-bold mb-3">Preuve par l'Image</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Chaque mission est validée par une preuve concrète (screenshot, lien, vidéo). On ne juge pas l'intention, on juge le résultat. Pas de blabla.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-2xl relative overflow-hidden group hover:border-yellow-400/50 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Clock className="h-24 w-24" />
                </div>
                <Clock className="h-10 w-10 text-yellow-400 mb-6" />
                <h3 className="text-xl font-bold mb-3">45min / jour</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Un sprint, pas un marathon. Intensité maximale sur un temps court.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* C. La Timeline d'Intensité */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-black tracking-tight text-center mb-12">
              PLAN DE BATAILLE
            </h2>
            
            <div className="relative border-l border-zinc-800 ml-4 md:ml-0 md:pl-0 space-y-12">
              {[
                { day: "J1-3", title: "LE CHOC", desc: "Audit brutal. Déconstruction de l'offre. On casse tout pour reconstruire solide.", icon: Zap },
                { day: "J4-7", title: "LA PRODUCTION", desc: "Création massive. Tu vas produire plus en 3 jours qu'en 3 mois.", icon: Trophy },
                { day: "J8-10", title: "LA CHASSE", desc: "50 contacts/jour. Cold Calling. On va chercher l'argent où il est.", icon: Target },
                { day: "J11-14", title: "LE CLOSING", desc: "Signature. Encaissement. Célébration. On valide le ROI de la cohorte.", icon: CheckCircle2 },
              ].map((step, i) => (
                <div key={i} className="relative pl-8 md:pl-0 md:grid md:grid-cols-5 md:gap-8 items-center">
                  <div className="md:col-span-2 md:text-right">
                    <span className="text-yellow-400 font-black text-xl">{step.day}</span>
                  </div>
                  <div className="absolute left-[-5px] md:left-auto md:relative md:col-span-1 flex justify-center">
                    <div className="h-3 w-3 bg-yellow-400 rounded-full ring-4 ring-zinc-950"></div>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="font-bold text-lg text-white">{step.title}</h3>
                    <p className="text-zinc-400 text-sm mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* D. Section "L'App en Action" */}
        <section className="py-20 bg-zinc-900/30 border-y border-zinc-800 overflow-hidden">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-black tracking-tight mb-8">
              L'ARME DU CRIME
            </h2>
            <div className="relative max-w-sm mx-auto perspective-1000">
              <div className="relative bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-2xl p-4 transform rotate-x-12 hover:rotate-0 transition-transform duration-500 ease-out border-t-zinc-700">
                {/* Mockup Header */}
                <div className="h-6 w-32 bg-zinc-900 rounded-full mx-auto mb-6"></div>
                
                {/* Mockup Content */}
                <div className="space-y-4 text-left">
                    <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <Badge className="bg-yellow-400 text-zinc-950 hover:bg-yellow-500">J9 : CHASSE</Badge>
                                <span className="text-xs text-zinc-500">45 min</span>
                            </div>
                            <CardTitle className="text-lg mt-2">50 Contacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-zinc-400">Objectif : Volume maximum. Envoie 50 messages personnalisés avant midi.</p>
                            <Button className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700">
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Valider
                            </Button>
                        </CardContent>
                    </Card>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                            <div className="text-xs text-zinc-500 mb-1">PROCHAIN LIVE</div>
                            <div className="font-bold text-yellow-400">18:00</div>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                            <div className="text-xs text-zinc-500 mb-1">BINÔME</div>
                            <div className="font-bold flex items-center gap-2">
                                <div className="h-4 w-4 rounded-full bg-zinc-700"></div>
                                Alex
                            </div>
                        </div>
                    </div>
                </div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-yellow-400/20 blur-3xl -z-10 rounded-full opacity-50"></div>
            </div>
          </div>
        </section>

        {/* E. Le Formulaire de Capture */}
        <section id="join" className="py-24 px-4 bg-zinc-950">
          <div className="container mx-auto max-w-xl">
            <div className="text-center mb-10 space-y-4">
              <h2 className="text-4xl font-black tracking-tight">
                BLOQUEZ VOTRE PLACE
              </h2>
              <p className="text-zinc-400">
                Premier arrivé, premier servi. Vérifiez la disponibilité de votre métier dans votre département maintenant.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-2xl shadow-xl">
                {/* On utilise le composant existant, mais on pourrait le styliser davantage ici */}
                <div className="dark">
                    <PreRegistrationForm />
                </div>
            </div>
            
            <p className="text-center text-zinc-600 text-xs mt-8">
                En rejoignant la liste d'attente, vous acceptez de recevoir nos communications. Désinscription à tout moment.
            </p>
          </div>
        </section>
      </main>
      
      <footer className="py-8 border-t border-zinc-900 text-center text-zinc-600 text-sm">
        <p>© 2026 Popey Academy. Tous droits réservés. Force et Honneur.</p>
      </footer>
    </div>
  );
}
