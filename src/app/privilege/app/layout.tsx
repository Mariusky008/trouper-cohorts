import type { Metadata } from "next";

// UN LAYOUT NE REÇOIT PAS LES PARAMÈTRES DE L'ADRESSE (`searchParams`) : la ville lue ici était donc
// toujours celle par défaut. Le manifeste garde exactement ce qu'il recevait, sans faire semblant.
export async function generateMetadata(): Promise<Metadata> {
  return {
    manifest: "/privilege/app/manifest.webmanifest?ville=dax",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Catalogue Popey",
    },
  };
}

export default function PrivilegeAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
