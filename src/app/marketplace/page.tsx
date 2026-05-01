import { MarketplaceHub } from "@/components/popey-human/marketplace-hub";

export default function MarketplaceLandingPage() {
  // Product guardrail: `/marketplace` must remain the primary marketplace hub.
  return <MarketplaceHub city="Dax" />;
}
