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
  title: {
    default: "Popey — votre site web gratuit + une assistante qui répond à vos clients",
    template: "%s · Popey",
  },
  description: "Popey crée gratuitement le site de votre commerce à partir de votre fiche Google, avec une assistante qui présente votre activité et répond à vos clients. En un clic, annoncez vos offres, événements et disponibilités.",
  openGraph: {
    title: "Popey — votre site web gratuit + une assistante qui répond à vos clients",
    description: "Un site moderne créé gratuitement à partir de votre fiche Google, avec une assistante IA qui répond à vos clients. Annoncez vos offres en un clic.",
    siteName: "Popey",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Popey — votre site web gratuit + une assistante qui répond à vos clients",
    description: "Un site moderne créé gratuitement à partir de votre fiche Google, avec une assistante IA qui répond à vos clients. Annoncez vos offres en un clic.",
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
