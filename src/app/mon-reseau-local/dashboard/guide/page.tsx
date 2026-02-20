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
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 uppercase tracking-widest px-3 py-1">
          Ressource Officielle
        </Badge>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Votre script d’appel : <span className="text-blue-600">5 étapes pour des échanges productifs</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
          Chaque jour, vous avez 5 à 10 minutes pour créer des opportunités. Suivez ce guide pour que chaque appel compte.
        </p>
      </div>

      {/* 1. THE SCRIPT STEPS */}
      <div className="space-y-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl uppercase tracking-wider">
             Structure Idéale (10 min)
           </div>
           
           <div className="space-y-10 relative z-10">
              
              {/* STEP 1 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black border-4 border-white shadow-sm shrink-0">1</div>
                  <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                </div>
                <div className="pb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">L'Introduction (30 sec)</h3>
                  <p className="text-slate-500 mb-3 text-sm">Brisez la glace immédiatement avec énergie.</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium italic">
                    "Salut [Prénom], c'est [Votre Prénom] de Popey Academy ! Ravi de te parler, je vois qu'on est tous les deux basés à [Ville]. Tu as 5 minutes ?"
                  </div>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black border-4 border-white shadow-sm shrink-0">2</div>
                  <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                </div>
                <div className="pb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Le Pitch "Elevator" (1 min)</h3>
                  <p className="text-slate-500 mb-3 text-sm">Soyez clair sur ce que vous faites. Pas de jargon.</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium italic">
                    "Pour faire simple, j'aide [Cible] à [Résultat] grâce à [Votre Méthode]. Et toi, quel est ton gros focus du moment ?"
                  </div>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-black border-4 border-white shadow-sm shrink-0">3</div>
                  <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                </div>
                <div className="pb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">La Recherche d'Opportunité (3 min)</h3>
                  <p className="text-slate-500 mb-3 text-sm">C'est le cœur de l'échange. Cherchez comment vous aider mutuellement.</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium italic mb-4">
                    "De quoi as-tu le plus besoin cette semaine ? Un contact ? Un avis ? De la visibilité ?"
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 p-2 rounded-lg">
                       <Target className="h-4 w-4 text-red-500" /> Trouver des clients (10 pts)
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 p-2 rounded-lg">
                       <Users className="h-4 w-4 text-blue-500" /> Mise en relation (8 pts)
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 p-2 rounded-lg">
                       <Star className="h-4 w-4 text-yellow-500" /> Recommandation (5 pts)
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 p-2 rounded-lg">
                       <TrendingUp className="h-4 w-4 text-indigo-500" /> Synergies (3 pts)
                     </div>
                  </div>
                </div>
              </div>

              {/* STEP 4 */}
              <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black border-4 border-white shadow-sm shrink-0">4</div>
                  <div className="w-0.5 h-full bg-slate-100 mt-2"></div>
                </div>
                <div className="pb-4">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">L'Action Concrète (30 sec)</h3>
                  <p className="text-slate-500 mb-3 text-sm">Ne raccrochez jamais sans une prochaine étape définie.</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium italic">
                    "Super, je t'envoie le contact de [Nom] par SMS tout de suite. De ton côté, tu penses à moi si tu croises un [Votre Cible], ça marche ?"
                  </div>
                </div>
              </div>

               {/* STEP 5 */}
               <div className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black border-4 border-white shadow-sm shrink-0">5</div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">La Validation (Post-Appel)</h3>
                  <p className="text-slate-500 mb-3 text-sm">N'oubliez pas de valider l'échange sur le dashboard pour vos points.</p>
                  <Button size="sm" variant="outline" className="h-8 text-xs font-bold">
                    Voir mes opportunités
                  </Button>
                </div>
              </div>

           </div>
        </div>
      </div>

      {/* 2. DO'S AND DON'TS */}
      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-green-50 rounded-3xl p-8 border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-black text-xl text-green-900">À FAIRE</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                <p className="text-green-800 text-sm font-medium">Écouter plus que parler (Règle du 60/40).</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                <p className="text-green-800 text-sm font-medium">Être curieux sincèrement du business de l'autre.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                <p className="text-green-800 text-sm font-medium">Proposer de l'aide AVANT de demander quelque chose.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                <p className="text-green-800 text-sm font-medium">Respecter le timing (10-15 min max).</p>
              </li>
            </ul>
         </div>

         <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center border border-red-200">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-black text-xl text-red-900">À ÉVITER</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <p className="text-red-800 text-sm font-medium">Vendre votre produit directement (c'est du réseau, pas du démarchage).</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <p className="text-red-800 text-sm font-medium">Monopoliser la parole.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <p className="text-red-800 text-sm font-medium">Oublier de noter l'échange après l'appel.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <p className="text-red-800 text-sm font-medium">Dire "On se recontacte" sans date précise.</p>
              </li>
            </ul>
         </div>
      </div>

    </div>
  );
}
