import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-popey-human-entrepreneur.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Smart Scan",
  },
};

export default function EntrepreneurSmartScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
