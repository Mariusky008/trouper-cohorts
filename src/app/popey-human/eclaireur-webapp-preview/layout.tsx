import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-popey-human-scout-preview.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eclaireur",
  },
  other: {
    "theme-color": "#0A0B0C",
  },
};

export default function ScoutPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
