// 🧠 MIEUX LE CONNAÎTRE (`lib/direct/connaitre.ts`, le lot 2 de la stratégie de « Ma collection »).
//
// GET : sa question du jour (et sa réponse s'il l'a donnée).
// GET ?savoir=1 : « ce que ta figurine sait de toi » (sa carte en mots, et tout son journal).
// POST { action: "question", cle, texte } : sa réponse à la question du jour → { question }.
// POST { action: "oublier", le } : il efface une chose ; { action: "tout-oublier" } : il efface tout.
// POST { action: "code", email } : un code à six chiffres par e-mail (protéger / retrouver sa figurine).
// POST { action: "verifier", email, code } : le bon code → ce téléphone retrouve sa figurine (`retrouvee`), ou son
//       adresse protège celle de ce téléphone (`protegee`).
// Jamais de réponse qui dise si une adresse est connue (le code part, ou pas, sans qu'on le sache ici).
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fusionner, habitantCourant, poserCookie } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { EMAIL_VALIDE, normaliserEmail, nouveauCode, verifierCode } from "@/lib/direct/maison-serveur";
import { envoyerCodeFigurine } from "@/lib/site-internet/ville-mail";
import { adresseMasquee } from "@/lib/direct/connaitre";
import { oublierUneChose, questionDuJourDe, repondreALaQuestion, savoirDe, toutOublier } from "@/lib/direct/connaitre-serveur";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
const sansCache = { "cache-control": "private, no-store" };
const s = (v: unknown) => String(v ?? "").trim();

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ ok: true, compte: false }, { headers: sansCache });
  const q = new URL(request.url).searchParams;
  if (q.get("savoir")) return NextResponse.json({ ok: true, savoir: await savoirDe(supabase, moi) }, { headers: sansCache });
  return NextResponse.json({ ok: true, compte: true, question: await questionDuJourDe(supabase, moi) }, { headers: sansCache });
}

type Ligne = Record<string, unknown>;

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);

  // ─── 🔐 protéger / retrouver sa figurine (le code de la Maison : 3 codes par adresse en 15 minutes) ───
  if (p?.action === "code") {
    const email = normaliserEmail(p.email);
    if (!EMAIL_VALIDE.test(email)) return NextResponse.json({ error: "Cette adresse ne semble pas complète." }, { status: 400 });
    const r = await nouveauCode(supabase, email, moi?.villeSlug || villeSlug(s(p.ville)) || "toutes");
    if ("erreur" in r) {
      return r.erreur === "trop"
        ? NextResponse.json({ error: "Trois codes viennent de partir. Patiente quelques minutes." }, { status: 429 })
        : NextResponse.json({ error: "Indisponible pour le moment." }, { status: 503 });
    }
    // SANS SERVICE D'E-MAIL, EN DÉVELOPPEMENT SEULEMENT, le code s'écrit dans le journal du serveur
    if (!process.env.RESEND_API_KEY) {
      if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "L'envoi d'e-mails n'est pas configuré." }, { status: 503 });
      console.log(`[ma-figurine] code pour ${email} : ${r.code}`);
      return NextResponse.json({ ok: true, a: adresseMasquee(email) });
    }
    const parti = await envoyerCodeFigurine(email, r.code);
    return parti ? NextResponse.json({ ok: true, a: adresseMasquee(email) }) : NextResponse.json({ error: "L'e-mail n'est pas parti. Réessaie." }, { status: 502 });
  }
  if (p?.action === "verifier") {
    const email = normaliserEmail(p.email);
    const code = s(p.code).replace(/\D/g, "");
    if (!EMAIL_VALIDE.test(email) || code.length !== 6) return NextResponse.json({ error: "Il faut ton adresse et les six chiffres." }, { status: 400 });
    const verdict = await verifierCode(supabase, email, code);
    const MOTS = { faux: "Ce n'est pas le bon code.", expire: "Ce code n'est plus valable : demandes-en un nouveau.", trop: "Trop d'essais : demande un nouveau code.", base: "Indisponible pour le moment." };
    if (verdict !== "ok") return NextResponse.json({ error: MOTS[verdict] }, { status: verdict === "base" ? 503 : 400 });
    const maintenant = new Date().toISOString();
    // QUI A DÉJÀ CETTE ADRESSE ? (de préférence, celui qui a une figurine)
    const { data } = await supabase.from("human_habitants").select("id, device_token").eq("email", email);
    const lignes = (Array.isArray(data) ? data : []) as Ligne[];
    const aUneFigurine = async (id: string) => {
      const { data: f } = await supabase.from("clik_ma_figurine").select("photo").eq("habitant_id", id).maybeSingle();
      return Boolean((f as Ligne | null)?.photo);
    };
    let proprio: Ligne | null = null;
    for (const l of lignes) if (!proprio || (await aUneFigurine(s(l.id)))) proprio = l;
    if (proprio && s(proprio.id) !== moi?.id) {
      const figIci = moi ? await aUneFigurine(moi.id) : false;
      const figProprio = await aUneFigurine(s(proprio.id));
      // SA FIGURINE EST SUR CE TÉLÉPHONE, pas sur l'ancien compte : l'ancien compte rejoint celui-ci (rien ne se perd)
      if (moi && figIci && !figProprio) {
        await fusionner(supabase, s(proprio.id), moi.id);
        await supabase.from("human_habitants").update({ email, email_verifie_le: maintenant }).eq("id", moi.id);
        return NextResponse.json({ ok: true, protegee: true, a: adresseMasquee(email) }, { headers: sansCache });
      }
      // SINON, CE TÉLÉPHONE RETROUVE SA FIGURINE (ce qu'il savait ici la rejoint, s'il n'avait pas de figurine)
      if (moi && !figIci) await fusionner(supabase, moi.id, s(proprio.id));
      await poserCookie(s(proprio.device_token));
      await supabase.from("human_habitants").update({ email_verifie_le: maintenant }).eq("id", s(proprio.id));
      return NextResponse.json({ ok: true, retrouvee: true, a: adresseMasquee(email) }, { headers: sansCache });
    }
    if (!moi) return NextResponse.json({ error: "Aucune figurine n'est liée à cette adresse." }, { status: 404 });
    // SON ADRESSE PROTÈGE SA FIGURINE (une autre adresse confirmée pour le résumé ne passe pas en douce à celle-ci)
    await supabase
      .from("human_habitants")
      .update({ email, email_verifie_le: maintenant, ...(moi.email && moi.email !== email ? { confirmed_at: null } : {}) })
      .eq("id", moi.id);
    return NextResponse.json({ ok: true, protegee: true, a: adresseMasquee(email) }, { headers: sansCache });
  }

  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 403 });
  if (p?.action === "question") {
    const r = await repondreALaQuestion(supabase, moi, p.cle, p.texte);
    if (r.error) return NextResponse.json({ error: r.error }, { status: r.statut ?? 400 });
    return NextResponse.json({ ok: true, question: r.question }, { headers: sansCache });
  }
  if (p?.action === "oublier") {
    const ok = await oublierUneChose(supabase, moi, p.le);
    return ok ? NextResponse.json({ ok: true, savoir: await savoirDe(supabase, moi) }, { headers: sansCache }) : NextResponse.json({ error: "C'est déjà effacé." }, { status: 404 });
  }
  if (p?.action === "tout-oublier") {
    await toutOublier(supabase, moi);
    return NextResponse.json({ ok: true, savoir: await savoirDe(supabase, moi) }, { headers: sansCache });
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
