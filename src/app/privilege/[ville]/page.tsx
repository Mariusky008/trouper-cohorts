import { MarketplaceMobileLanding } from "@/components/popey-human/marketplace-mobile-landing";

type PrivilegePageProps = {
  params: {
    ville: string;
  };
};

function displayCityFromSlug(slug: string) {
  const base = String(slug || "dax")
    .replace(/-/g, " ")
    .trim();
  if (!base) return "Dax";
  return base
    .split(" ")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

export default function PrivilegeByCityPage({ params }: PrivilegePageProps) {
  const city = displayCityFromSlug(params.ville);
  return <MarketplaceMobileLanding city={city} />;
}
