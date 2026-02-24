import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-12 pb-24 relative max-w-6xl mx-auto animate-pulse">
      
      {/* 1. HERO HEADER SKELETON */}
      <div className="relative pt-8 pb-12 overflow-hidden flex flex-col items-center gap-6">
         <Skeleton className="h-8 w-48 rounded-full bg-slate-800" />
         <div className="space-y-4 text-center">
            <Skeleton className="h-16 w-96 mx-auto rounded-xl bg-slate-800" />
            <Skeleton className="h-6 w-64 mx-auto rounded-lg bg-slate-800/50" />
         </div>
      </div>

      {/* 2. DAILY CARD SKELETON */}
      <div className="relative z-20 -mt-8 max-w-md mx-auto w-full">
         <Skeleton className="h-[500px] w-full rounded-[2.5rem] bg-slate-800/50 border border-white/5" />
      </div>

      {/* 3. GRID LAYOUT SKELETON */}
      <div className="grid lg:grid-cols-12 gap-8 items-start mt-12 px-4">
         
         {/* Colonne Gauche */}
         <div className="lg:col-span-7 space-y-6">
             <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-xl bg-slate-800" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32 bg-slate-800" />
                    <Skeleton className="h-3 w-24 bg-slate-800/50" />
                </div>
             </div>
             <Skeleton className="h-64 w-full rounded-[2rem] bg-slate-800/30" />
         </div>

         {/* Colonne Droite */}
         <div className="lg:col-span-5 space-y-6">
             <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-xl bg-slate-800" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32 bg-slate-800" />
                    <Skeleton className="h-3 w-24 bg-slate-800/50" />
                </div>
             </div>
             <Skeleton className="h-64 w-full rounded-[2rem] bg-slate-800/30" />
         </div>

      </div>

    </div>
  );
}