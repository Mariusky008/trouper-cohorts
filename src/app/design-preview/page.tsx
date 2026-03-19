import { WaitingCardPreview, MysteryCardPreview, MatchCardPreview, MatchCardFounderStylePreview, MysteryCardLockedPreview, FounderCardPreview, MissionValidationPreview, MatchCardWhatsAppPreview, GoldMatchCardPreview } from "@/components/dashboard/design-system-preview";
import { PremiumLockedCard } from "@/components/dashboard/premium-locked-card";

export default function DesignPreviewPage() {
  const stripePriceId = "price_1TB9jwDfAHlQD3uITPZVQX5T";
  
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

          {/* 3. Match (Mission Selector) */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-emerald-500 w-2 h-8 rounded-full"></span>
              3. Match (Standard)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Aperçu interactif du sélecteur de mission.</p>
            <MatchCardPreview />
          </div>

          {/* 3b. Match (Founder Style) */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-indigo-500 w-2 h-8 rounded-full"></span>
              3b. Match (Style Joker)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Alternative UX inspirée du Joker Fondateur.</p>
            <MatchCardFounderStylePreview />
          </div>

          {/* 3c. Match (WhatsApp Entremetteur) */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-[#25D366] w-2 h-8 rounded-full"></span>
              3c. Match (WhatsApp)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Stratégie "L'Entremetteur" avec message pré-rempli.</p>
            <MatchCardWhatsAppPreview />
          </div>

          {/* 4. Founder Joker State (Onboarding) */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-amber-500 w-2 h-8 rounded-full"></span>
              4. Joker Fondateur (J+2)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Onboarding VIP personnalisé.</p>
            <FounderCardPreview type="onboarding" />
          </div>

          {/* 5. Founder Joker State (Rescue) */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-red-500 w-2 h-8 rounded-full"></span>
              5. Joker Sauvetage
            </h2>
            <p className="text-sm text-slate-400 mb-4">Impair ou pas de match dispo.</p>
            <FounderCardPreview type="rescue" />
          </div>

          {/* 6. Pay-to-Reveal (Strategy) */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-yellow-500 w-2 h-8 rounded-full"></span>
              6. Pay-to-Reveal (Futur)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Stratégie monétisation J3+.</p>
            <PremiumLockedCard priceId={stripePriceId} />
          </div>

          {/* 7. Mission Validation (Post-Call) */}
          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-green-500 w-2 h-8 rounded-full"></span>
              7. Validation (Post-Appel)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Flow de fin de mission et récompense.</p>
            <MissionValidationPreview />
          </div>

          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-yellow-400 w-2 h-8 rounded-full"></span>
              8. Gold Match (Test)
            </h2>
            <p className="text-sm text-slate-400 mb-4">Exemple ultra concret Digital Marketer × Copywriter avec offre et plan d&apos;action explicites.</p>
            <GoldMatchCardPreview />
          </div>

        </div>
      </div>
    </div>
  );
}
