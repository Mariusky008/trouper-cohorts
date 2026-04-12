import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-popey-human.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Popey Human",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0C",
};

export default function PopeyHumanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
