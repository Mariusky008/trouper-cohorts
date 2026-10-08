// Fiche de connaissances de l'assistante (Espace Pro, jeton privé). Le pro décrit
// ses spécialités, ce qu'il ne fait pas, et des questions/réponses fréquentes.
// Ce contenu nourrit le prompt de l'accueil-chat et du double (l'assistante
// répond avec SES mots). Get/Set. Best-effort si la colonne n'est pas migrée.
//
// ═══ DEUX ÉCRANS, UNE SEULE COLONNE ═══════════════════════════════════════
//
// « Ce que mon fantôme sait », dans son comptoir, écrit ici aussi : ses
// réponses aux questions de son métier portent une clé (`cle`), et la file des
// questions de ses clients restées sans réponse (`attente`) y est rangée par
// le double — voir `savoir-fantome.ts` et `savoir-en-base.ts`.
//
// L'ENREGISTREMENT NE REMPLACE QUE CE QUE L'ÉCRAN ÉCRIT. La file d'attente
// est relue en base au moment d'écrire : une question arrivée pendant qu'il
// tapait sa réponse n'est pas effacée. L'ancienne fiche ne connaît pas les
// clés : on les lui rend en retrouvant la même question.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { oublierLeCommerce } from "@/lib/direct/double-commerce";
import { memeQuestion, nettoyerSavoir, sansCeQuiEstRepondu, type SavoirFantome } from "@/lib/direct/savoir-fantome";

export const dynamic = "force-dynamic";

const s = (v: unknown) => String(v ?? "").trim();

export type AssistantKb = Omit<SavoirFantome, "attente"> & { attente?: SavoirFantome["attente"] };

export async function POST(request: Request) {
  let p: Record<string, unknown> | null = null;
  try {
    p = await request.json();
  } catch {
    p = null;
  }
  const slug = s(p?.slug);
  const token = s(p?.token);
  const action = s(p?.action) || "get";
  if (!slug || !token) return NextResponse.json({ error: "slug/token requis" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("human_vitrine_sites")
    .select("id, pro_token, assistant_kb")
    .eq("slug", slug)
    .eq("channel", "letter")
    .maybeSingle();
  const site = (row as Record<string, unknown> | null) ?? null;
  if (!site || !site.pro_token || s(site.pro_token) !== token) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const brut = (site.assistant_kb && typeof site.assistant_kb === "object" ? site.assistant_kb : {}) as Record<string, unknown>;
  const avant = nettoyerSavoir(brut);

  if (action === "set") {
    const recu = nettoyerSavoir(p?.kb);
    // LA CLÉ PERDUE PAR L'ANCIENNE FICHE : retrouvée par la question elle-même.
    const faq = recu.faq.map((f) => {
      if (f.cle) return f;
      const cle = avant.faq.find((x) => x.cle && memeQuestion(x.q, f.q))?.cle;
      return cle ? { ...f, cle } : f;
    });
    const ecarter = (Array.isArray(p?.ecarter) ? p.ecarter : []).map((x) => s(x).slice(0, 200)).filter(Boolean).slice(0, 40);
    const suite = sansCeQuiEstRepondu({ ...recu, faq, attente: avant.attente }, ecarter);
    const { error } = await supabase
      .from("human_vitrine_sites")
      .update({ assistant_kb: { ...brut, ...suite } })
      .eq("id", s(site.id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // LA PHRASE SUIVANTE DE SON FANTÔME RELIT LA BASE — voir `double-commerce.ts`.
    oublierLeCommerce(slug);
    return NextResponse.json({ ok: true, kb: suite });
  }

  return NextResponse.json({ ok: true, kb: avant });
}
