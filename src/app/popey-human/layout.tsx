import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-popey-human.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Popey Human",
  },
  other: {
    "theme-color": "#0A0B0C",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0C",
  viewportFit: "cover",
};

export default function PopeyHumanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
