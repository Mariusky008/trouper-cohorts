// ☀️ LA PROPOSITION DU MATIN — voir `lib/direct/proposition-matin.ts`.
//
// POST, même jeton que le reste de l'Espace Pro (`slug` + `token`) :
//   · `lire`     { famille? } → { proposition | null, statut, whatsapp, whatsappPossible }
//   · `autre`    → la suivante (celle-ci ne revient pas aujourd'hui)
//   · `passer`   → rien aujourd'hui
//   · `publiee`  → il a dit oui : la carte devient « ✓ publiée »
//   · `whatsapp` { on } → « me l'envoyer chaque matin sur WhatsApp »
//
// RANGÉE DANS SON DIAGNOSTIC (`proposition_matin`), relu juste avant d'écrire.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ligneDuCommercant } from "@/lib/site-internet/experience-scenes";
import { piecesDuDiagnostic } from "@/lib/site-internet/pieces-comptoir";
import { paysDuCommerce } from "@/lib/site-internet/pays";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { familleDuDouble, type FamilleDouble } from "@/lib/direct/double-metiers";
import { jourParis } from "@/lib/jour-paris";
import {
  apresLeGeste,
  avecLaPiece,
  etatDuDiagnostic,
  etatDuJour,
  propositionDuJour,
  type EtatProposition,
} from "@/lib/direct/proposition-matin";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();
const FAMILLES: FamilleDouble[] = ["table", "bar", "coiffure", "ongles", "fleurs", "mode", "createur", "lunettes", "seance", "librairie"];

/** Le message du matin peut partir : Twilio et son modèle sont posés sur Vercel. */
const whatsappPossible = () =>
  Boolean(s(process.env.TWILIO_ACCOUNT_SID) && s(process.env.TWILIO_AUTH_TOKEN) && s(process.env.TWILIO_PROPOSITION_CONTENT_SID));

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const ligne = await ligneDuCommercant(slug, s(p?.token)).catch(() => null);
  if (!ligne) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const action = s(p?.action) || "lire";

  const supabase = createAdminClient();
  const { data } = await supabase.from("human_vitrine_sites").select("activite, city, address, diagnostic").eq("id", ligne.id).maybeSingle();
  const row = (data as Record<string, unknown> | null) ?? {};
  const diag = (row.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  const voulue = s(p?.famille) as FamilleDouble;
  const famille = FAMILLES.includes(voulue) ? voulue : familleDuDouble({ branche: brancheDuMetier(s(row.activite)), metier: s(row.activite) });
  const pieces = piecesDuDiagnostic(diag);
  const aujourdhui = jourParis();
  let etat: EtatProposition = etatDuJour(etatDuDiagnostic(diag), aujourdhui);

  if (action === "autre" || action === "passer" || action === "publiee") etat = apresLeGeste(etat, action, s(p?.pieceId) || undefined);
  else if (action === "whatsapp") etat = { ...etat, whatsapp: p?.on === true };
  else if (action !== "lire") return NextResponse.json({ error: "action inconnue" }, { status: 400 });

  const proposition = propositionDuJour({ famille, pieces, etat, pays: paysDuCommerce(row) });
  etat = avecLaPiece(etat, proposition?.piece?.id);

  // ON N'ÉCRIT QUE CE QUI A CHANGÉ : relire sa page dix fois ne réécrit pas sa fiche dix fois.
  const avant = JSON.stringify(etatDuDiagnostic(diag));
  if (JSON.stringify(etat) !== avant) {
    const { error } = await supabase.from("human_vitrine_sites").update({ diagnostic: { ...diag, proposition_matin: etat } }).eq("id", ligne.id);
    if (error) console.error("[proposition] écriture impossible :", error.message);
  }

  return NextResponse.json({
    ok: true,
    proposition,
    statut: etat.statut,
    whatsapp: etat.whatsapp === true,
    whatsappPossible: whatsappPossible(),
  });
}
