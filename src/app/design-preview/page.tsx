import { WaitingCardPreview, MysteryCardPreview, MatchCardPreview, MatchCardFounderStylePreview, MysteryCardLockedPreview, FounderCardPreview, MissionValidationPreview, MatchCardWhatsAppPreview, GoldMatchCardPreview } from "@/components/dashboard/design-system-preview";
import { PremiumLockedCard } from "@/components/dashboard/premium-locked-card";

function ServiceMissionOpportunityCardPreview() {
  return (
    <div className="relative w-full max-w-sm mx-auto rounded-[2rem] overflow-hidden border border-white/10 bg-gradient-to-b from-[#101522] to-[#0B0F19] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.75)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_50%)]" />
      <div className="relative p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200">
            Mission opportunité
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Contact récent</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-300">Pour</p>
          <p className="text-lg font-black text-white">Jean Dupont · Designer</p>
          <p className="text-xs text-slate-400 mt-1">Besoin détecté: Le Prescripteur</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-white leading-tight">Trouver 1 mise en relation commerçant qualifié</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Propose un contact pertinent (artisan, commerçant, agence locale) et envoie une intro en message.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-200">Gain attendu</p>
            <p className="text-sm font-black text-emerald-100">+1 service rendu</p>
          </div>
          <div className="rounded-xl border border-amber-300/25 bg-amber-400/10 p-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-amber-200">Impact</p>
            <p className="text-sm font-black text-amber-100">Dette de service créée</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button className="h-11 rounded-xl border border-rose-300/30 bg-rose-500/10 text-rose-200 font-black text-xs uppercase tracking-wider">
            Pas intéressé
          </button>
          <button className="h-11 rounded-xl border border-emerald-300/30 bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30">
            Intéressé
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">État après clic “Intéressé”</p>
          <button className="w-full h-11 rounded-xl border border-cyan-300/30 bg-cyan-500/20 text-cyan-100 font-black text-xs uppercase tracking-wider">
            Mission terminée
          </button>
        </div>
      </div>
    </div>
  );
}

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

          <div className="space-y-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-cyan-400 w-2 h-8 rounded-full"></span>
              9. Carte Mission Opportunité
            </h2>
            <p className="text-sm text-slate-400 mb-4">Prototype UX de la nouvelle carte “service rendu / service reçu” avec CTA Intéressé/Pas intéressé.</p>
            <ServiceMissionOpportunityCardPreview />
          </div>

        </div>
      </div>
    </div>
  );
}
