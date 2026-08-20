// `MarketplaceMobileLanding` lit `useSearchParams()`. Ce crochet exige une
// frontière de Suspense au-dessus de lui pour que la page puisse être
// pré-rendue — voir `frontiere-suspense.tsx` pour l'histoire complète. Elle
// empruntait jusqu'ici celle du `loading.tsx` racine, retiré depuis parce qu'il
// avalait les codes 404 de tout le site. C'est cette page qui a arrêté la
// compilation.
import { MarketplaceMobileLanding } from "@/components/popey-human/marketplace-mobile-landing";
import { FrontiereSuspense } from "@/components/frontiere-suspense";

export default function PopeyHumanMarketplaceAccueilPage() {
  return (
    <FrontiereSuspense>
      <MarketplaceMobileLanding city="Grand Dax" />
    </FrontiereSuspense>
  );
}
