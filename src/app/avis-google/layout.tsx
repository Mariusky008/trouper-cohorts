import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Boostez vos avis Google | Popey Academy",
  description:
    "Collectez +10 avis Google réels par mois via WhatsApp. Sans effort, sans engagement. 79€/mois pour les commerçants locaux.",
};

export default function AvisGoogleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${dmSans.variable} ${cormorant.variable} font-[family-name:var(--font-dm-sans)]`}>
      {children}
    </div>
  );
}
