// 🤔 « ÇA ME VA ? » — l'essai envoyé aux amis, et leurs votes. Voir `lib/direct/avis-amis.ts`.
//
//   GET                               → ses demandes d'avis et les votes arrivés ;
//   POST { action: "lien", ville }    → le lien signé, avant l'envoi (ne range rien) ;
//   POST { action: "envoyer", jeton, image, quoi, … } → l'essai entre dans sa Maison ;
//   POST { action: "voter", jeton, v, votant, prenom } → un ami vote, sans compte ;
//   GET ?salon=<jeton>&votant=…       → le salon de l'essai (mots, votes, ClikMe) ;
//   POST { action: "ecrire", jeton, votant, prenom, texte } → un mot dans le salon ;
//   POST { action: "clikme", jeton, votant, question? }     → ClikMe tranche, ou répond ;
//   PATCH { e }                       → il a vu les avis arrivés.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assurerHabitant, habitantCourant } from "@/lib/direct/habitant";
import { villeSlug } from "@/lib/direct/ville";
import { SITE_URL } from "@/lib/site-url";
import {
  avantClikMe,
  creerAvis,
  ecrireClikMe,
  ecrireDansSalonEssai,
  imageAvis,
  lienCourtAvis,
  lireJetonAvis,
  lireSalonEssai,
  listerAvis,
  marquerAvisVus,
  nouvelAvis,
  signerAvis,
  voter,
} from "@/lib/direct/avis-amis";
import { demanderAClikMe } from "@/lib/direct/clikme-tranche";

export const dynamic = "force-dynamic";

const PRIVE = { "cache-control": "private, no-store" };
const s = (v: unknown, n = 120) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

function client() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

async function corps(req: Request): Promise<Record<string, unknown>> {
  try {
    const o = await req.json();
    return o && typeof o === "object" ? (o as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Le lien de vote et l'image, tels qu'on les met dans un message — le lien COURT. */
const adresses = (e: string) => {
  const court = lienCourtAvis(e);
  return court ? { lien: `${SITE_URL}/ca-me-va/${court}`, image: `/api/direct/avis-amis/image?j=${court}` } : null;
};

export async function GET(req: Request) {
  const supabase = client();
  if (!supabase) return NextResponse.json({ ok: false }, { headers: PRIVE });
  // 💬 LE SALON DE L'ESSAI : le lien suffit, comme pour voter.
  const q = new URL(req.url).searchParams;
  if (q.has("salon")) {
    const j = lireJetonAvis(s(q.get("salon"), 600));
    if (!j) return NextResponse.json({ ok: false, error: "Ce lien n'est plus valable." }, { status: 400, headers: PRIVE });
    const h = await habitantCourant(supabase);
    const salon = await lireSalonEssai(supabase, j.e, { votant: q.get("votant"), habitant: h?.id ?? null });
    return NextResponse.json(salon ? { ok: true, salon } : { ok: false, attente: true }, { headers: PRIVE });
  }
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ ok: true, avis: [] }, { headers: PRIVE });
  const avis = await listerAvis(supabase, h.id, adresses);
  return NextResponse.json(avis ? { ok: true, avis } : { ok: false }, { headers: PRIVE });
}

export async function POST(req: Request) {
  const supabase = client();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503, headers: PRIVE });
  const p = await corps(req);

  // ═══ L'AMI VOTE : ni cookie ni compte, le lien suffit ═══════════════════
  if (p.action === "voter") {
    const j = lireJetonAvis(s(p.jeton, 600));
    if (!j) return NextResponse.json({ ok: false, error: "Ce lien n'est plus valable." }, { status: 400, headers: PRIVE });
    const r = await voter(supabase, j.e, p.votant, p.v, p.prenom);
    if ("erreur" in r) return NextResponse.json({ ok: false, error: r.erreur }, { status: r.statut, headers: PRIVE });
    return NextResponse.json({ ok: true, ...r }, { headers: PRIVE });
  }

  // ═══ UN MOT DANS LE SALON DE L'ESSAI ═══════════════════════════════════
  if (p.action === "ecrire") {
    const j = lireJetonAvis(s(p.jeton, 600));
    if (!j) return NextResponse.json({ ok: false, error: "Ce lien n'est plus valable." }, { status: 400, headers: PRIVE });
    const h = await habitantCourant(supabase);
    const r = await ecrireDansSalonEssai(supabase, j.e, { votant: p.votant, prenom: p.prenom, texte: p.texte, habitant: h?.id ?? null });
    if ("erreur" in r) return NextResponse.json({ ok: false, error: r.erreur }, { status: r.statut, headers: PRIVE });
    return NextResponse.json({ ok: true }, { headers: PRIVE });
  }

  // ═══ CLIKME TRANCHE (sans question) OU RÉPOND (avec) ════════════════════
  if (p.action === "clikme") {
    const j = lireJetonAvis(s(p.jeton, 600));
    if (!j) return NextResponse.json({ ok: false, error: "Ce lien n'est plus valable." }, { status: 400, headers: PRIVE });
    const avant = await avantClikMe(supabase, j.e, p.votant);
    if ("erreur" in avant) return NextResponse.json({ ok: false, error: avant.erreur }, { status: avant.statut, headers: PRIVE });
    const image = await imageAvis(supabase, j.e);
    if (!image) return NextResponse.json({ ok: false, error: "L’essai arrive encore : réessayez dans un instant." }, { status: 409, headers: PRIVE });
    const question = s(p.question, 280);
    const r = await demanderAClikMe(image, { ...avant, ...(question ? { question } : {}) });
    if ("erreur" in r) {
      console.error("[avis-amis] ClikMe muet :", r.erreur);
      return NextResponse.json({ ok: false, error: "ClikMe ne peut pas regarder la photo pour l’instant. Demandez à vos amis !" }, { status: 503, headers: PRIVE });
    }
    const ecrit = await ecrireClikMe(supabase, j.e, p.votant, r.texte, r.verdict);
    return NextResponse.json(ecrit ? { ok: true } : { ok: false, error: "Réponse non enregistrée." }, { status: ecrit ? 200 : 500, headers: PRIVE });
  }

  /* DEMANDER L'AVIS DE SES AMIS FAIT NAÎTRE L'HABITANT, comme une mise de
     côté : un jeton anonyme sur ce téléphone, pour retrouver les votes. */
  const ville = p.action === "lien" ? villeSlug(s(p.ville, 80)) : "";
  const h = (await habitantCourant(supabase)) ?? (ville ? await assurerHabitant(supabase, ville) : null);
  if (!h) return NextResponse.json({ ok: false, sansMaison: true }, { status: 401, headers: PRIVE });

  if (p.action === "lien") {
    const jeton = signerAvis({ e: nouvelAvis(), h: h.id, t: Date.now() });
    if (!jeton) return NextResponse.json({ ok: false }, { status: 503, headers: PRIVE });
    const j = lireJetonAvis(jeton);
    const a = j ? adresses(j.e) : null;
    if (!j || !a) return NextResponse.json({ ok: false }, { status: 503, headers: PRIVE });
    return NextResponse.json({ ok: true, e: j.e, jeton, ...a }, { headers: PRIVE });
  }

  if (p.action === "envoyer") {
    const j = lireJetonAvis(s(p.jeton, 600));
    // UN LIEN N'ACCUEILLE QUE L'ESSAI DE CELUI À QUI IL A ÉTÉ FAIT (jamais un lien court : il ne porte personne).
    if (!j || !j.h || j.h !== h.id) return NextResponse.json({ ok: false, error: "Lien inconnu." }, { status: 400, headers: PRIVE });
    const quoi = s(p.quoi);
    const m = /^data:image\/(?:jpeg|jpg|png|webp);base64,(.+)$/i.exec(String(p.image ?? ""));
    if (!quoi || !m) return NextResponse.json({ ok: false, error: "Quel essai ?" }, { status: 400, headers: PRIVE });
    const brut = Buffer.from(m[1], "base64");
    if (brut.length > 8 * 1024 * 1024) return NextResponse.json({ ok: false, error: "Image trop lourde." }, { status: 413, headers: PRIVE });
    const r = await creerAvis(supabase, j, brut, { quoi, prix: s(p.prix, 30), magasin: s(p.magasin, 80), carte: s(p.carte, 80), page: s(p.page, 200), ceci: s(p.ceci, 40), prenom: s(p.prenom, 30) });
    if (r !== "ok") return NextResponse.json({ ok: false, error: r }, { status: r === "plein" ? 429 : r === "image" ? 400 : 500, headers: PRIVE });
    return NextResponse.json({ ok: true, e: j.e }, { headers: PRIVE });
  }

  return NextResponse.json({ ok: false, error: "Action inconnue." }, { status: 400, headers: PRIVE });
}

export async function PATCH(req: Request) {
  const supabase = client();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503, headers: PRIVE });
  const h = await habitantCourant(supabase);
  if (!h) return NextResponse.json({ ok: false }, { status: 401, headers: PRIVE });
  const e = s((await corps(req)).e, 40);
  const ok = e ? await marquerAvisVus(supabase, h.id, e) : false;
  return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers: PRIVE });
}
