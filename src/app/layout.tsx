import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { RecoveryRedirectGuard } from "@/components/auth/recovery-redirect-guard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.popey.academy"),
  title: "Popey — le club des bons plans de ta ville",
  description: "Les offres, gratuités et privilèges des meilleurs commerçants près de chez toi, à swiper. Deviens leur habitué·e et sois prévenu·e en premier de leurs coups de feu.",
  openGraph: {
    title: "Popey — le club des bons plans de ta ville",
    description: "Les offres, gratuités et privilèges des meilleurs commerçants près de chez toi, à swiper. Deviens leur habitué·e et sois prévenu·e en premier de leurs coups de feu.",
    siteName: "Popey",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Popey — le club des bons plans de ta ville",
    description: "Les offres, gratuités et privilèges des meilleurs commerçants près de chez toi, à swiper. Deviens leur habitué·e et sois prévenu·e en premier de leurs coups de feu.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Popey",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <RecoveryRedirectGuard />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
