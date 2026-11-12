// 💬 LA CONVERSATION AVEC PABLITO — chantier « Univers », lot 3 (`lib/direct/conversation-univers.ts`,
// `conversation-univers-serveur.ts`). D'ABORD RÉSERVÉE AU PROPRIÉTAIRE (une session d'administrateur), comme la
// nouvelle figurine.
//
// GET                                    → { etape, messages, esquisse, assez, proposition?, attend, dictee, figurine?, version? }
// POST { action: "commencer" }           → { ok } : « C'est parti », Pablito pose sa première question
// POST { action: "message", texte }      → { ok } : son message ; Pablito répond après la réponse (l'écran relit)
// POST { action: "dicter", audio, type } → { texte } : sa voix devient du texte, qu'il relit avant d'envoyer
// POST { action: "reprendre" }           → { ok } : après le message d'aide, il reprend à son rythme
// POST { action: "proposer" }            → { ok } : « Voir ce que j'imagine » (préparé après la réponse)
// POST { action: "corriger", texte }     → { ok } : il corrige ou complète la proposition (après la réponse)
// POST { action: "retirer", id }         → { ok } : un élément de la proposition s'en va
// POST { action: "valider" }             → { version } : « C'est mon univers ! » — la fiche de son univers
// POST { action: "effacer" }             → { ok } : la conversation s'efface
import { NextResponse, after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { habitantCourant } from "@/lib/direct/habitant";
import {
  commencer,
  demanderCorrection,
  demanderProposition,
  dicter,
  effacerConversation,
  envoyerMessage,
  etatConversation,
  preparerProposition,
  repondre,
  reprendre,
  retirerElement,
  validerUnivers,
} from "@/lib/direct/conversation-univers-serveur";

export const dynamic = "force-dynamic";
// (Pablito répond après la réponse : le modèle peut prendre une demi-minute)
export const maxDuration = 120;

const sansCache = { "cache-control": "private, no-store" };
const REFUS = { error: "Bientôt 🙂" };

export async function GET() {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  return NextResponse.json({ ok: true, ...(await etatConversation(supabase, moi?.id ?? null)) }, { headers: sansCache });
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json(REFUS, { status: 403 });
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 400 });
  const h = moi.id;
  const repondreJson = (r: { error?: string; statut?: number }, ok: Record<string, unknown> = {}) =>
    NextResponse.json(r.error ? { error: r.error } : { ok: true, ...ok }, { status: r.error ? (r.statut ?? 400) : 200, headers: sansCache });

  switch (p?.action) {
    case "commencer":
      return repondreJson(await commencer(supabase, h));
    case "message": {
      const r = await envoyerMessage(supabase, h, p.texte);
      if (r.repondre) after(() => repondre(supabase, h));
      return repondreJson(r);
    }
    case "dicter": {
      const r = await dicter(p.audio, p.type);
      return repondreJson(r, { texte: r.texte });
    }
    case "reprendre":
      return repondreJson(await reprendre(supabase, h));
    case "proposer":
    case "corriger": {
      const r = p.action === "proposer" ? await demanderProposition(supabase, h) : await demanderCorrection(supabase, h, p.texte);
      if (r.preparer) after(() => preparerProposition(supabase, h));
      return repondreJson(r);
    }
    case "retirer":
      return repondreJson(await retirerElement(supabase, h, p.id));
    case "valider": {
      const r = await validerUnivers(supabase, h);
      return repondreJson(r, { version: r.version });
    }
    case "effacer":
      return repondreJson(await effacerConversation(supabase, h));
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
