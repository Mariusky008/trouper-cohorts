import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-popey-human-scout.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eclaireur",
  },
};

export default function ScoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

