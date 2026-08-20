// La page de ce segment est entièrement CLIENTE et lit `useSearchParams()` :
// elle ne peut donc pas poser sa propre frontière de Suspense, il lui en faut
// une venue d'un parent serveur. Voir `frontiere-suspense.tsx` : elle empruntait
// celle du `loading.tsx` racine, retiré parce qu'il avalait les codes 404.
import { FrontiereSuspense } from "@/components/frontiere-suspense";

export default function Calque({ children }: { children: React.ReactNode }) {
  return <FrontiereSuspense>{children}</FrontiereSuspense>;
}
