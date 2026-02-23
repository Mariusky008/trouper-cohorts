import { 
  MessageCircle, Phone, Target, Star, ShieldCheck, 
  AlertCircle, CheckCircle2, ArrowRight, Play, Users, Briefcase, Zap, TrendingUp 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GuidePage() {
  return (
    <div className="pb-24 space-y-12 max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div className="space-y-4">
        <Badge className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border-blue-500/20 uppercase tracking-widest px-3 py-1">
          Ressource Officielle
        </Badge>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
          Votre script d’appel : <span className="text-blue-400">5 étapes pour des échanges productifs</span>
        </h1>
        <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
          Chaque jour, vous avez 5 à 10 minutes pour créer des opportunités. Suivez ce guide pour que chaque appel compte.
        </p>
      </div>

      {/* 1. THE SCRIPT STEPS */}
      <div className="space-y-8">
        <div className="bg-[#1e293b]/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/5 shadow-lg shadow-black/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl uppercase tracking-wider shadow-lg">
             Structure Idéale (10 min)
           </div>
           
           <div className="space-y-10 relative z-10">
              
              {/* STEP 1 */}
              <div className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-black border border-blue-500/20 shadow-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">1</div>
                  <div className="w-0.5 h-full bg-white/5 mt-2 group-hover:bg-blue-500/20 transition-colors"></div>
                </div>
                <div className="pb-4 flex-1">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">L'Introduction (30 sec)</h3>
                  <p className="text-slate-400 mb-3 text-sm">Brisez la glace immédiatement avec énergie.</p>
                  <div className="bg-[#0a0f1c]/50 border border-white/5 rounded-xl p-4 text-slate-300 font-medium italic relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl opacity-50"></div>
                    "Salut [Prénom], c'est [Votre Prénom] de Popey Academy ! Ravi de te parler, je vois qu'on est tous les deux basés à [Ville]. Tu as 5 minutes ?"
                  </div>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-black border border-purple-500/20 shadow-sm shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">2</div>
                  <div className="w-0.5 h-full bg-white/5 mt-2 group-hover:bg-purple-500/20 transition-colors"></div>
                </div>
                <div className="pb-4 flex-1">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Le Pitch "Elevator" (1 min)</h3>
                  <p className="text-slate-400 mb-3 text-sm">Soyez clair sur ce que vous faites. Pas de jargon.</p>
                  <div className="bg-[#0a0f1c]/50 border border-white/5 rounded-xl p-4 text-slate-300 font-medium italic relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-xl opacity-50"></div>
                    "Pour faire simple, j'aide [Cible] à [Résultat] grâce à [Votre Méthode]. Et toi, quel est ton gros focus du moment ?"
                  </div>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/20 shadow-sm shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">3</div>
                  <div className="w-0.5 h-full bg-white/5 mt-2 group-hover:bg-emerald-500/20 transition-colors"></div>
                </div>
                <div className="pb-4 flex-1">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">La Recherche d'Opportunité (3 min)</h3>
                  <p className="text-slate-400 mb-3 text-sm">C'est le cœur de l'échange. Cherchez comment vous aider mutuellement.</p>
                  <div className="bg-[#0a0f1c]/50 border border-white/5 rounded-xl p-4 text-slate-300 font-medium italic mb-4 relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-xl opacity-50"></div>
                    "De quoi as-tu le plus besoin cette semaine ? Un contact ? Un avis ? De la visibilité ?"
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                       <Target className="h-4 w-4 text-red-400" /> Trouver des clients (10 pts)
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                       <Users className="h-4 w-4 text-blue-400" /> Mise en relation (8 pts)
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                       <Star className="h-4 w-4 text-yellow-400" /> Recommandation (5 pts)
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/5 border border-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                       <TrendingUp className="h-4 w-4 text-indigo-400" /> Synergies (3 pts)
                     </div>
                  </div>
                </div>
              </div>

              {/* STEP 4 */}
              <div className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center font-black border border-orange-500/20 shadow-sm shrink-0 group-hover:bg-orange-600 group-hover:text-white transition-colors">4</div>
                  <div className="w-0.5 h-full bg-white/5 mt-2 group-hover:bg-orange-500/20 transition-colors"></div>
                </div>
                <div className="pb-4 flex-1">
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">L'Action Concrète (30 sec)</h3>
                  <p className="text-slate-400 mb-3 text-sm">Ne raccrochez jamais sans une prochaine étape définie.</p>
                  <div className="bg-[#0a0f1c]/50 border border-white/5 rounded-xl p-4 text-slate-300 font-medium italic relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-xl opacity-50"></div>
                    "Super, je t'envoie le contact de [Nom] par SMS tout de suite. De ton côté, tu penses à moi si tu croises un [Votre Cible], ça marche ?"
                  </div>
                </div>
              </div>

               {/* STEP 5 */}
               <div className="flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-slate-700 text-white flex items-center justify-center font-black border border-slate-600 shadow-sm shrink-0 group-hover:bg-white group-hover:text-slate-900 transition-colors">5</div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">La Validation (Post-Appel)</h3>
                  <p className="text-slate-400 mb-3 text-sm">N'oubliez pas de valider l'échange sur le dashboard pour vos points.</p>
                  <Button size="sm" variant="outline" className="h-8 text-xs font-bold bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10">
                    Voir mes opportunités
                  </Button>
                </div>
              </div>

           </div>
        </div>
      </div>

      {/* 2. DO'S AND DON'TS */}
      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-emerald-500/10 backdrop-blur-md rounded-[2rem] p-8 border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="font-black text-xl text-emerald-100">À FAIRE</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                <p className="text-emerald-100/80 text-sm font-medium">Écouter plus que parler (Règle du 60/40).</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                <p className="text-emerald-100/80 text-sm font-medium">Être curieux sincèrement du business de l'autre.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                <p className="text-emerald-100/80 text-sm font-medium">Proposer de l'aide AVANT de demander quelque chose.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                <p className="text-emerald-100/80 text-sm font-medium">Respecter le timing (10-15 min max).</p>
              </li>
            </ul>
         </div>

         <div className="bg-red-500/10 backdrop-blur-md rounded-[2rem] p-8 border border-red-500/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="font-black text-xl text-red-100">À ÉVITER</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.5)]"></div>
                <p className="text-red-100/80 text-sm font-medium">Vendre votre produit directement (c'est du réseau, pas du démarchage).</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.5)]"></div>
                <p className="text-red-100/80 text-sm font-medium">Monopoliser la parole.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.5)]"></div>
                <p className="text-red-100/80 text-sm font-medium">Oublier de noter l'échange après l'appel.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.5)]"></div>
                <p className="text-red-100/80 text-sm font-medium">Dire "On se recontacte" sans date précise.</p>
              </li>
            </ul>
         </div>
      </div>

    </div>
  );
}
