import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/site-url";
import { MARQUE } from "@/lib/marque";
import { Geist, Geist_Mono, Anton } from "next/font/google";
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

/**
 * LA FONTE D'AFFICHE DU DIRECT — « 8 LASAGNES », « 9 € ».
 *
 * POURQUOI CELLE-CI ET PAS UNE AUTRE. « La police d'écriture n'est pas aussi
 * bien que sur le mock-up, qui a beaucoup plus de caractère. » C'était juste :
 * Archivo Black est une grotesque LARGE et ronde — lisible, mais sage. La
 * maquette porte une condensée d'affiche, haute et serrée, celle des ardoises
 * et des affiches de marché. Anton est exactement cette lettre-là : à taille
 * égale elle est un tiers plus étroite, donc plus haute pour la même largeur,
 * donc plus forte. Ce n'est pas du décor : « La côte de bœuf maturée » y tient
 * en deux lignes quand la précédente en demandait trois.
 *
 * ELLE EST SERVIE PAR LE SITE, PAS PAR GOOGLE. `next/font` la télécharge au
 * BUILD et l'héberge avec nous : aucune requête vers un tiers depuis le
 * téléphone d'un habitant, et rien à charger avant que le texte s'affiche.
 */
const anton = Anton({
  variable: "--font-affiche",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // LE TITRE ET LA DESCRIPTION DÉCRIVENT LE PRODUIT D'AUJOURD'HUI.
  // Ils annonçaient « votre site web gratuit + une assistante qui répond à vos
  // clients » : le produit de l'époque où le site était le sujet. Le site est
  // toujours offert — il reste dans la description, en second — mais ce qu'on
  // vend est Le Direct. Ces deux lignes sont ce que Google affiche et ce qu'un
  // WhatsApp montre : c'est souvent la première phrase qu'on lit de nous.
  title: {
    default: `${MARQUE} — votre commerce en direct dans votre ville`,
    template: `%s · ${MARQUE}`,
  },
  description: "Votre carte du jour, vos places libres, ce qu'il vous reste : dites-le, et les habitants de votre ville le voient tout de suite. Votre site est créé gratuitement à partir de votre fiche Google.",
  openGraph: {
    title: `${MARQUE} — votre commerce en direct dans votre ville`,
    description: "Votre carte du jour, vos places libres, ce qu'il vous reste : dites-le, et les habitants de votre ville le voient tout de suite. Votre site est créé gratuitement à partir de votre fiche Google.",
    siteName: MARQUE,
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${MARQUE} — votre commerce en direct dans votre ville`,
    description: "Votre carte du jour, vos places libres, ce qu'il vous reste : dites-le, et les habitants de votre ville le voient tout de suite. Votre site est créé gratuitement à partir de votre fiche Google.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: MARQUE,
  },
  icons: {
    // Le SVG est en tracés purs (pas de <text>) : il s'affiche partout à
    // l'identique. Le PNG sert aux plateformes qui refusent le SVG — iOS
    // notamment, pour l'icône « ajouter à l'écran d'accueil ».
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/icon.svg",
    apple: "/apple-touch-icon.png",
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
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} antialiased`}
        suppressHydrationWarning
      >
        <RecoveryRedirectGuard />
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
