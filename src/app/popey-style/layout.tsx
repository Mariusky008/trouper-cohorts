import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Popey, la force du réseau",
  description: "5 minutes par jour pour changer votre business",
  openGraph: {
    title: "Popey, la force du réseau",
    description: "5 minutes par jour pour changer votre business",
  },
};

export default function PopeyStyleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
