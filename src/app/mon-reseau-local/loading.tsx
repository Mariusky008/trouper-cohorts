import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0f1c] gap-6 animate-pulse">
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
        
        {/* Spinner Container */}
        <div className="relative bg-[#1e293b] p-6 rounded-3xl shadow-2xl border border-white/5">
             <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center space-y-2">
        <h3 className="text-white font-bold text-lg animate-pulse">Connexion au Réseau...</h3>
        <p className="text-slate-500 text-sm font-medium">Récupération de vos opportunités</p>
      </div>

      {/* Progress Bar Simulation */}
      <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
        <div className="h-full bg-blue-500 rounded-full w-1/3 animate-[loading_1.5s_ease-in-out_infinite]"></div>
      </div>
    </div>
  );
}