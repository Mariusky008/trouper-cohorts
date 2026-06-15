import type { Metadata } from "next";

// Le `manifest` PWA (dynamique, dépend de la ville + du ref) est généré dans page.tsx,
// car un LAYOUT ne reçoit pas `searchParams` et son `params` async retombait sur "dax".
// Ici on ne garde que le réglage iOS statique.
export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Catalogue Popey",
  },
};

export default function PrivilegeCityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
