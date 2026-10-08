import { NextResponse, after } from "next/server";
import { completerLHote, completerSansHote } from "@/lib/site-internet/couverture";
import { completerScenes } from "@/lib/site-internet/experience-scenes";
import { completerEssaiVitrine } from "@/lib/site-internet/essai-vitrine";

// 👻 SON HÔTE REPÉRÉ, PUIS LA PHOTO SANS LUI — après la page, avec le temps qu'il faut.
//
// La page n'a pas le temps d'une retouche d'image (une demi-minute) : elle
// sonne ici, comme pour la lecture de la carte (`carte-lue`). Chaque étape ne
// fait que ce qui manque, et note ses essais : deux visites rapprochées ne
// paient pas deux fois.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(requete: Request) {
  const p = (await requete.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = String(p.slug ?? "").trim();
  if (!/^[a-z0-9-]{2,120}$/i.test(slug)) return NextResponse.json({ erreur: "adresse illisible" }, { status: 400 });
  after(async () => {
    try {
      // LES SCÈNES DE SON EXPÉRIENCE RESTAURANT, en même temps : elles ne
      // touchent pas à la photo ClikMe — voir `experience-scenes.ts`.
      await Promise.all([
        (async () => {
          await completerLHote(slug);
          await completerSansHote(slug);
          // UNE DE SES PIÈCES ESSAYÉE, chez une boutique de vêtements — voir
          // `essai-vitrine.ts`. APRÈS la photo ClikMe, pas en même temps : les
          // deux réécrivent la même colonne, et la seconde à finir effacerait
          // la première.
          await completerEssaiVitrine(slug);
        })(),
        completerScenes(slug),
      ]);
    } catch {
      /* la prochaine visite relancera */
    }
  });
  return NextResponse.json({ lance: true }, { status: 202 });
}
