import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Ajouter un client",
  robots: "noindex",
};

export default function SaisieLayout({ children }: { children: React.ReactNode }) {
  return <div className={dmSans.variable}>{children}</div>;
}
