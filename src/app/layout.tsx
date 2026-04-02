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
  themeColor: "#E2D9BC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Popey Academy — La force du groupe",
  description: "Popey Academy 100% humain. Activez des synergies business locales avec des partenaires complémentaires et générez de nouveaux clients.",
  openGraph: {
    title: "Popey Academy — La force du groupe",
    description: "Popey Academy 100% humain. Activez des synergies business locales avec des partenaires complémentaires et générez de nouveaux clients.",
    siteName: "Popey Academy",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Popey Academy — La force du groupe",
    description: "Popey Academy 100% humain. Activez des synergies business locales avec des partenaires complémentaires et générez de nouveaux clients.",
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
