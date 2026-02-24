import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4 animate-pulse">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="relative bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
             <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      </div>
      <p className="text-slate-400 text-sm font-medium animate-pulse">Chargement de votre espace...</p>
    </div>
  );
}