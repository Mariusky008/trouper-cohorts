// ✨ « MON VŒU » (`lib/direct/voeu.ts`, `lib/direct/voeu-serveur.ts`).
//
// GET : tout « Mon vœu » — sa figurine est prête, ses 18 ans (`adulte`, `null` : à demander), son vœu et ses réponses,
//       sa mission du jour (les 3 vœux à encourager, choisis la première fois qu'il l'ouvre). Sans compte : rien.
// POST { action: "dix-huit", oui: true|false } : 🔞 « As-tu 18 ans ou plus ? » (une fois ; un « non » ne se change pas).
// POST { action: "publier", texte, categorie } → { id } : il dépose son vœu (un seul en route à la fois).
// POST { action: "modifier", texte } : il le reformule (le compteur continue).
// POST { action: "pause", oui: true|false } : en pause, ou il reprend sa route.
// POST { action: "annuler" } / { action: "remplacer", texte, categorie } : il l'annule, ou en dépose un autre à la place.
// POST { action: "geste", vue, geste: "encourage"|"aide"|"passe"|"signale", tete?, texte?, son?, duree? } → { mission } :
//      son geste sur un vœu de sa mission (une tête ; une aide : une phrase, ou sa voix — 20 s ; passer ; signaler).
// POST { action: "phrases", vue } → { phrases } : « Je peux aider » — trois phrases toutes prêtes pour ce vœu.
// POST { action: "surprise", sauf?: [textes] } → { texte, categorie, par } : 🎲 la tuile « Surprise ».
// POST { action: "vues" } : il a vu ses réponses (le badge s'éteint).
// POST { action: "signaler-reponse", vue } : l'auteur signale une réponse (elle ne s'affiche plus).
// POST { action: "aide-reponse", vue, oui } → { cle?, prenom?, etat } : ✋ il répond à une aide — « Lui répondre avec ma
//      figurine » (ils deviennent proches : `cle` ouvre leur conversation) ou « Pas pour moi » (l'autre ne le saura pas).
// POST { action: "repondre-tete", vue, tete } → { ok } : 🙂 l'auteur répond à une réponse avec sa tête (merci, mdr, grave,
//      tropbien) ; l'écran l'a déjà posée, la route ne renvoie pas l'état.
// POST { action: "retours-vus" } : ↩️ il a vu les têtes qu'on lui a répondues.
// GET ?mes=1 → { mes } : 📒 « Mes vœux » (dans « Moi »). POST { action: "montrer", oui } : le montrer sur sa carte.
// POST { action: "exaucer", par: <vue d'une aide> | "seul" } → { fete, etat } : 🎉 son vœu est exaucé.
// POST { action: "reformuler" } → { proposition?, conseils } : 💡 Pablito propose de le dire autrement.
// Toutes les réponses : `{ ok: true, etat }` (l'état à jour), sauf mention.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import {
  direSesDixHuitAns,
  etatVoeu,
  annulerVoeu,
  exaucerVoeu,
  mesVoeux,
  montrerSurLaCarte,
  reformulerVoeu,
  gesteSurVoeu,
  marquerReponsesVues,
  marquerRetoursVus,
  modifierVoeu,
  pauseVoeu,
  phrasesPourAider,
  publierVoeu,
  repondreAide,
  repondreAvecSaTete,
  signalerReponse,
  voeuSurprise,
} from "@/lib/direct/voeu-serveur";

export const dynamic = "force-dynamic";
// (une aide en vocal : la transcription)
export const maxDuration = 60;

const sansCache = { "cache-control": "private, no-store" };
const erreur = (r: { error?: string; statut?: number } & Record<string, unknown>) => {
  const { error, statut, ...reste } = r;
  return NextResponse.json({ error, ...reste }, { status: statut ?? 400 });
};

export async function GET(request: Request) {
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (new URL(request.url).searchParams.get("mes")) {
    const mes = moi ? await mesVoeux(supabase, moi) : null;
    return NextResponse.json({ ok: true, mes }, { headers: sansCache });
  }
  return NextResponse.json({ ok: true, etat: await etatVoeu(supabase, moi) }, { headers: sansCache });
}

export async function POST(request: Request) {
  const p = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const supabase = createAdminClient();
  const moi = await habitantCourant(supabase);
  if (!moi) return NextResponse.json({ error: "Crée d’abord ta figurine." }, { status: 401 });
  const etat = async () => NextResponse.json({ ok: true, etat: await etatVoeu(supabase, moi) }, { headers: sansCache });

  switch (p?.action) {
    case "dix-huit": {
      const r = await direSesDixHuitAns(supabase, moi.id, p.oui);
      return r.error ? erreur(r) : etat();
    }
    case "publier": {
      const r = await publierVoeu(supabase, moi, p.texte, p.categorie);
      return r.error ? erreur(r) : etat();
    }
    case "modifier": {
      const r = await modifierVoeu(supabase, moi, p.texte);
      return r.error ? erreur(r) : etat();
    }
    case "pause": {
      const r = await pauseVoeu(supabase, moi, p.oui);
      return r.error ? erreur(r) : etat();
    }
    case "annuler": {
      const r = await annulerVoeu(supabase, moi);
      return r.error ? erreur(r) : etat();
    }
    case "remplacer": {
      // (le nouveau vœu d'abord relu : on ne retire pas l'ancien pour un texte refusé)
      const r = await publierVoeu(supabase, moi, p.texte, p.categorie, true);
      return r.error ? erreur(r) : etat();
    }
    case "geste": {
      const r = await gesteSurVoeu(supabase, moi, { vue: p.vue, geste: p.geste, tete: p.tete, texte: p.texte, son: p.son, duree: p.duree });
      return r.error ? erreur(r) : NextResponse.json({ ok: true, mission: r.mission }, { headers: sansCache });
    }
    case "phrases": {
      const r = await phrasesPourAider(supabase, moi, p.vue);
      return r.error ? erreur(r) : NextResponse.json({ ok: true, phrases: r.phrases }, { headers: sansCache });
    }
    case "surprise": {
      const r = await voeuSurprise(supabase, moi, p.sauf);
      return r.error ? erreur(r) : NextResponse.json({ ok: true, texte: r.texte, categorie: r.categorie, par: r.par }, { headers: sansCache });
    }
    case "vues": {
      await marquerReponsesVues(supabase, moi);
      return NextResponse.json({ ok: true }, { headers: sansCache });
    }
    case "exaucer": {
      const r = await exaucerVoeu(supabase, moi, p.par);
      if (r.error) return erreur(r);
      return NextResponse.json({ ok: true, fete: r.fete, etat: await etatVoeu(supabase, moi) }, { headers: sansCache });
    }
    case "montrer": {
      const r = await montrerSurLaCarte(supabase, moi, p.oui);
      return r.error ? erreur(r) : NextResponse.json({ ok: true, mes: await mesVoeux(supabase, moi) }, { headers: sansCache });
    }
    case "reformuler": {
      const r = await reformulerVoeu(supabase, moi);
      return r.error ? erreur(r) : NextResponse.json({ ok: true, proposition: r.proposition, conseils: r.conseils }, { headers: sansCache });
    }
    case "repondre-tete": {
      // (sans recalculer tout « Mon vœu » : l'écran l'a déjà posée — c'était plusieurs secondes d'attente)
      const r = await repondreAvecSaTete(supabase, moi, p.vue, p.tete);
      return r.error ? erreur(r) : NextResponse.json({ ok: true }, { headers: sansCache });
    }
    case "retours-vus": {
      await marquerRetoursVus(supabase, moi);
      return NextResponse.json({ ok: true }, { headers: sansCache });
    }
    case "aide-reponse": {
      const r = await repondreAide(supabase, moi, p.vue, p.oui);
      if (r.error) return erreur(r);
      return NextResponse.json({ ok: true, cle: r.cle, prenom: r.prenom, etat: await etatVoeu(supabase, moi) }, { headers: sansCache });
    }
    case "signaler-reponse": {
      const r = await signalerReponse(supabase, moi, p.vue);
      return r.error ? erreur(r) : etat();
    }
  }
  return NextResponse.json({ error: "Demande incomplète." }, { status: 400 });
}
