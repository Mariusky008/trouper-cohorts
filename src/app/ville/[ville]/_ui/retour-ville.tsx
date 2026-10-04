"use client";

// ← LE DIRECT DE LA VILLE, DEPUIS SES ANCIENNES PAGES.
//
// « On garde les messages de la mairie et on supprime les anciens onglets
// Menus / Mes commerces / Moi » — « OK ». La barre des quatre onglets est
// partie avec eux. Les pages restent joignables par les liens déjà envoyés
// (le résumé par courriel, ses réglages, une carte partagée) : elles gardent
// donc une seule porte, vers la ville. Sur la ville elle-même, rien.
import Link from "next/link";
import { usePathname } from "next/navigation";

export function RetourVille({ ville }: { ville: string }) {
  const chemin = usePathname() || "";
  const racine = `/ville/${ville}`;
  if (chemin === racine || chemin === `${racine}/`) return null;
  return (
    <Link href={racine} className="retour-ville">
      ← Le Direct
      <style>{`
        .retour-ville{position:fixed;left:12px;top:calc(10px + env(safe-area-inset-top,0px));z-index:50;
          padding:7px 13px;border-radius:999px;font-size:13px;font-weight:800;text-decoration:none;
          color:#fff;background:rgba(18,12,9,.82);border:1px solid rgba(255,255,255,.2);}
      `}</style>
    </Link>
  );
}
