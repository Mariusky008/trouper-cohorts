// ⚔️ L'ARBITRAGE D'UNE BATTLE — le seul appel de modèle de cette page.
//
// LA CONSIGNE ET LE SCHÉMA SONT DANS `lib/battle/arbitre.ts`, à part : c'est le
// produit, et il doit se lire sans traverser de la plomberie. Ici il n'y a que
// le tuyau — vérifier le corps, appeler, rendre du JSON, et dire clairement ce
// qui a échoué quand ça échoue.
//
// ─── LE MODÈLE, ET POURQUOI CELUI-LÀ ───────────────────────────────────────
//
// « Brancher ChatGPT qui est déjà dans nos fichiers. » Les deux moteurs y sont,
// et ils ne servent pas à la même chose :
//
//   · OpenAI transcrit — `/api/direct/transcrire`, Whisper. C'est lui qui
//     convertit la voix des joueurs en texte, et il reste inchangé ;
//   · Anthropic raisonne — c'est le chemin déjà éprouvé du dépôt, avec un
//     `output_config` en `json_schema` qui GARANTIT la forme de la réponse.
//
// CETTE GARANTIE N'EST PAS UN CONFORT ICI. Un arbitrage est un objet à cinq
// notes par camp : sans schéma imposé, une réponse sur dix rend un champ en
// moins ou une note en toutes lettres, et l'écran tombe au pire moment — juste
// après un match. Le chemin qui existe déjà dans le dépôt est celui qui sait
// faire ça. Si vous préférez OpenAI pour l'arbitrage aussi, c'est une variable
// d'environnement et une fonction à réécrire, pas une refonte.
import { NextResponse } from "next/server";
import {
  SCHEMA_ARBITRAGE,
  consigne,
  transcription,
  type Tour,
} from "@/lib/battle/arbitre";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

const MODELE = s(process.env.BATTLE_ARBITRE_MODELE) || "claude-sonnet-5";

/** Assez pour trois rounds de dix minutes ; au-delà, ce n'est plus une battle. */
const MAX_TOUR = 12_000;

/**
 * VINGT ARBITRAGES PAR HEURE ET PAR ADRESSE.
 *
 * Une battle en consomme UN. Vingt laissent largement de quoi jouer une soirée
 * en famille, et arrêtent net une boucle qui partirait toute seule — c'est le
 * genre d'accident qui se paie en jetons pendant la nuit.
 */
const PAR_HEURE = 20;
const VU = new Map<string, { n: number; depuis: number }>();

function tropSouvent(qui: string): boolean {
  const maintenant = Date.now();
  const e = VU.get(qui);
  if (!e || maintenant - e.depuis > 3_600_000) {
    VU.set(qui, { n: 1, depuis: maintenant });
    return false;
  }
  e.n += 1;
  return e.n > PAR_HEURE;
}

/** Le texte rendu par le modèle, quel que soit l'emballage des blocs. */
function texteDuModele(data: unknown): string {
  const blocs = (data as { content?: unknown })?.content;
  if (!Array.isArray(blocs)) return "";
  return blocs
    .map((b) => (b as { type?: string; text?: string })?.type === "text" ? s((b as { text?: string }).text) : "")
    .join("")
    .trim();
}

export async function POST(request: Request) {
  const cle = s(process.env.ANTHROPIC_API_KEY);
  if (!cle) {
    // ON DIT LAQUELLE MANQUE. Un « service indisponible » nu ferait chercher
    // une panne là où il n'y a qu'une variable d'environnement absente.
    return NextResponse.json(
      { erreur: "ANTHROPIC_API_KEY absente : l’arbitre n’est pas configuré." },
      { status: 503 },
    );
  }

  const qui = s(request.headers.get("x-forwarded-for")).split(",")[0].trim() || "inconnu";
  if (tropSouvent(qui)) {
    return NextResponse.json(
      { erreur: `Trop d’arbitrages sur cette heure (${PAR_HEURE} maximum).` },
      { status: 429 },
    );
  }

  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }

  const sujet = s(p?.sujet).slice(0, 400);
  const a = s(p?.a).slice(0, 40) || "A";
  const b = s(p?.b).slice(0, 40) || "B";
  const format = s(p?.format).slice(0, 60) || "Classic";
  const tours: Tour[] = Array.isArray(p?.tours)
    ? (p.tours as unknown[])
        .map((t) => {
          const o = (t ?? {}) as Record<string, unknown>;
          const camp = s(o.qui) === "b" ? "b" : "a";
          return {
            qui: camp as "a" | "b",
            round: Math.max(1, Math.min(9, Number(o.round) || 1)),
            texte: s(o.texte).slice(0, MAX_TOUR),
          };
        })
        .filter((t) => t.texte)
    : [];

  if (!sujet) {
    return NextResponse.json({ erreur: "Aucun sujet." }, { status: 400 });
  }
  /**
   * IL FAUT AVOIR ENTENDU LES DEUX. Arbitrer un camp qui n'a rien dit
   * reviendrait à noter le silence — et comme la transcription peut rendre
   * vide, ce cas arrive pour de vrai. On préfère le dire que rendre un verdict
   * qui n'a aucun sens.
   */
  const parCamp = { a: 0, b: 0 };
  tours.forEach((t) => (parCamp[t.qui] += 1));
  if (!parCamp.a || !parCamp.b) {
    return NextResponse.json(
      {
        erreur:
          "Un des deux camps n’a rien de transcrit : impossible d’arbitrer. " +
          "Vérifiez le micro et rejouez le tour.",
      },
      { status: 400 },
    );
  }

  const debut = Date.now();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 2500,
        system: consigne(sujet, a, b, format),
        messages: [{ role: "user", content: transcription(tours, a, b) }],
        output_config: {
          // ON LUI LAISSE LE TEMPS DE PESER. Contrairement à l'assistante, qui
          // démêle trois faits d'une phrase, arbitrer demande de comparer deux
          // raisonnements sur cinq axes — c'est le seul endroit du produit où
          // un effort élevé se justifie.
          effort: "medium",
          format: { type: "json_schema", schema: SCHEMA_ARBITRAGE },
        },
      }),
    });

    if (!res.ok) {
      const dit = await res.text().catch(() => "");
      let quoi = "";
      try {
        quoi = s((JSON.parse(dit)?.error ?? {}).message).slice(0, 160);
      } catch {
        quoi = dit.slice(0, 160);
      }
      console.error(`[battle] arbitrage refusé : HTTP ${res.status} — ${quoi}`);
      return NextResponse.json(
        { erreur: `Le modèle a refusé l’appel (HTTP ${res.status})${quoi ? ` : ${quoi}` : ""}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const brut = texteDuModele(data);
    if (!brut) {
      return NextResponse.json(
        { erreur: "Le modèle n’a rien rendu d’exploitable." },
        { status: 502 },
      );
    }
    let r: Record<string, unknown>;
    try {
      r = JSON.parse(brut) as Record<string, unknown>;
    } catch {
      console.error(`[battle] réponse illisible : ${brut.slice(0, 200)}`);
      return NextResponse.json(
        { erreur: "La réponse de l’arbitre était illisible." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ...r, ms: Date.now() - debut, modele: MODELE });
  } catch (e) {
    console.error(`[battle] arbitrage impossible : ${(e as Error)?.message || "réseau"}`);
    return NextResponse.json({ erreur: "Arbitrage impossible." }, { status: 502 });
  }
}
