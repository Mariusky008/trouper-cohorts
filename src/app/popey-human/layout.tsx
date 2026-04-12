import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-popey-human.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Popey Human",
  },
};

export default function PopeyHumanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

