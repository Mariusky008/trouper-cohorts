import { WaitingCardPreview, MysteryCardPreview, MatchCardPreview, MysteryCardLockedPreview, FounderCardPreview } from "@/components/dashboard/design-system-preview";

export default function DesignPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-white uppercase italic">Design System Preview</h1>
          <p className="text-slate-400">Validation des 4 états de la carte de match avant déploiement.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16 items-start justify-items-center">
          
          {/* 1. Waiting State */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-blue-500 w-2 h-8 rounded-full"></span>
              1. Attente (Waiting)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Post-inscription, en attente du lendemain.</p>
            <WaitingCardPreview />
          </div>

          {/* 2a. Mystery Locked State */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-slate-500 w-2 h-8 rounded-full"></span>
              2a. Mystère Verrouillé
            </h2>
            <p className="text-sm text-slate-400 mb-4">Match futur (demain), teasing vibrant.</p>
            <MysteryCardLockedPreview />
          </div>

          {/* 2b. Mystery State */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-purple-500 w-2 h-8 rounded-full"></span>
              2b. Mystère (Unlocked)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Le match est prêt, à révéler.</p>
            <MysteryCardPreview />
          </div>

          {/* 3. Match State */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-emerald-500 w-2 h-8 rounded-full"></span>
              3. Match (FOMO)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Le profil est révélé, incitation à l'appel.</p>
            <MatchCardPreview />
          </div>

          {/* 4. Founder Joker State */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-amber-500 w-2 h-8 rounded-full"></span>
              4. Joker Fondateur
            </h2>
            <p className="text-sm text-slate-400 mb-4">Impair ou VIP, le fondateur prend le relais.</p>
            <FounderCardPreview />
          </div>

        </div>
      </div>
    </div>
  );
}
