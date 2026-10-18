/**
 * 🚪 LA PORTE DE SES POSTS — `clikme.fr/b/<sa-page>`.
 *
 * « Chaque post, sur tous les réseaux, devient une porte. » Deux liens y
 * mènent, et ce sont les mêmes à une lettre près :
 *
 *   · `/b/<slug>` — LE LIEN DE SA BIO INSTAGRAM, fixe toute l'année
 *     (Instagram ne rend pas un lien cliquable dans un texte : la légende dit
 *     « lien en bio »). Il ouvre sa page sur son expérience, où sa pièce du
 *     jour est en vedette — « il ouvre toujours les pièces du jour ».
 *   · `/b/<slug>?p=<pièce>` — LE LIEN D'UN POST (Facebook, le bouton de son
 *     post Google) : il ouvre l'essai de CETTE pièce-là, avec sa photo à soi —
 *     et chez une boutique de vêtements, « Avec mes vêtements », son jean à soi.
 *
 * COURT PARCE QU'IL SE LIT : il est écrit dans sa bio et au bout de ses posts.
 * Il redirige vers sa vraie page, qui porte `via=reseaux` : c'est un visiteur,
 * jamais le commerçant à qui l'on présenterait sa propre page (voir
 * `VIA_PUBLIC`). Une pièce finie ou retirée ouvre simplement son expérience.
 *
 * Voir `porteDuPost` et `lienDeLaPorte` dans `lib/reseaux/reseaux-donnees.ts`.
 */
import { NextResponse } from "next/server";
import { idDePiece } from "@/lib/reseaux/reseaux-donnees";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = String((await params).slug ?? "").trim();
  if (!/^[\w.-]{1,120}$/.test(slug)) return new NextResponse("Lien introuvable", { status: 404 });
  const ici = new URL(request.url);
  const cible = new URL(`/site-internet/apercu/${encodeURIComponent(slug)}`, ici.origin);
  // LE MESSAGE DU MOIS (`?via=diffusion`) se compte à part : « 37 amis sont venus par ton message ».
  cible.searchParams.set("via", ici.searchParams.get("via") === "diffusion" ? "diffusion" : "reseaux");
  cible.searchParams.set("onglet", "experience");
  const piece = idDePiece(ici.searchParams.get("p"));
  if (piece) cible.searchParams.set("essayer", piece);
  // 302 ET PAS 301 : ce qu'il y a derrière change avec ses pièces du jour.
  return NextResponse.redirect(cible, 302);
}
