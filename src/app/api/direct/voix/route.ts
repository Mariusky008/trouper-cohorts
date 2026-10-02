/**
 * 🎙️ LA VOIX DES COMMERÇANTS DE LA DÉMONSTRATION — trois récits, trois timbres.
 *
 * ═══ POURQUOI CETTE ROUTE EXISTE ═══════════════════════════════════════════
 *
 * « La voix est hyper robotique, il faut que tu trouves des voix naturelles. »
 *
 * L'ÉCRAN LISAIT LE TEXTE AVEC `speechSynthesis`, c'est-à-dire avec la voix du
 * système. Elle articule, elle ne raconte pas, et aucun réglage ne la rendra
 * chaleureuse — il n'y a pas de bouton « âme » dans l'API du navigateur.
 *
 * LE PROJET AVAIT DÉJÀ LA RÉPONSE, ET LE PARCOURS NE L'APPELAIT PAS.
 * `/api/site-internet/tts` sert des voix ElevenLabs ou OpenAI à l'Espace Pro et
 * à la maquette depuis des mois. Le parcours, lui, appelait `speak()` sans
 * jamais avoir appelé `initCloudTts` : il retombait donc sur la voix du
 * navigateur à chaque fois. C'était un branchement manquant, pas une limite.
 *
 * ═══ POURQUOI UNE ROUTE À PART, ET PAS CELLE QUI EXISTE ════════════════════
 *
 * L'AUTRE EST GARDÉE PAR UN `slug` de maquette : elle vérifie en base que le
 * site existe et qu'il n'est pas publié, pour qu'un site client en ligne
 * n'appelle jamais la voix payante. La démonstration `/autour-de-moi` n'a pas
 * de slug — elle n'est le site de personne.
 *
 * CELLE-CI SE GARDE AUTREMENT, ET MIEUX : elle n'accepte AUCUN texte. On lui
 * donne une clé de commerce, elle va chercher le récit dans les données et ne
 * peut synthétiser que ça. Trois phrases fixes, pas une de plus — il n'y a donc
 * aucune surface pour faire payer à quelqu'un d'autre la lecture de son
 * courrier. L'autre route, elle, accepte cinq cents caractères libres.
 *
 * ET COMME LES TEXTES SONT FIXES, LE RÉSULTAT SE GARDE EN CACHE. Une
 * synthèse par voix et par déploiement, pas une par écoute : c'est la
 * différence entre quelques centimes et une facture qui suit l'audience.
 *
 * SANS CLÉ CONFIGURÉE → 503, ET L'ÉCRAN RETOMBE SUR LA VOIX DU NAVIGATEUR.
 * La démonstration marche donc partout ; elle est seulement plus belle là où la
 * clé existe.
 */
import { NextResponse } from "next/server";
import { carteDuPaquet } from "@/lib/direct/copies-presentation";
import { faireParler, TIMBRES } from "@/lib/direct/timbres";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

/* LES TIMBRES ONT DÉMÉNAGÉ DANS `lib/direct/timbres.ts` : le double du chef
   parle avec la même voix que son récit, et deux copies d'une voix finissent
   toujours par ne plus se ressembler. */

export async function GET(request: Request) {
  const cle = s(new URL(request.url).searchParams.get("cle"));
  if (!TIMBRES[cle]) return NextResponse.json({ error: "Voix inconnue." }, { status: 404 });

  /* LE TEXTE VIENT DES DONNÉES, JAMAIS DE LA REQUÊTE. C'est toute la garde de
     cette route : on ne peut faire dire que ce qui est déjà écrit. */
  const commerce = carteDuPaquet(cle);
  const texte = s(commerce?.voix?.recit || commerce?.voix?.signature);
  if (!texte) return NextResponse.json({ error: "Rien à dire." }, { status: 404 });

  /* UN PEU PLUS LENT QUE LA NORMALE. Ailleurs dans le produit la voix est
     vive parce qu'elle présente ; ici elle RACONTE, et une recette qu'on
     récite à toute vitesse ne donne pas faim. */
  const r = await faireParler(cle, texte, { vitesse: 0.96 });
  if (!r.ok) return NextResponse.json({ error: r.erreur }, { status: r.statut });

  /* UNE JOURNÉE DE CACHE, ET C'EST BEAUCOUP POUR TROIS PHRASES QUI NE BOUGENT
     PAS. `immutable` dit au navigateur de ne même pas revenir demander. */
  return new NextResponse(r.son, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
    },
  });
}
