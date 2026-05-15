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
  title: "Votre avis compte",
  robots: "noindex",
};

export default function AvisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${cormorant.variable}`}>
      {children}
    </div>
  );
}
