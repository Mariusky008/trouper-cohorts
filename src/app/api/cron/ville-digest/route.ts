// Le résumé quotidien d'une ville — « ce qui se passe aujourd'hui ».
//
// DEUX RÈGLES, et elles sont dans le code, pas dans la promesse marketing :
//   • un envoi par jour AU MAXIMUM ;
//   • JAMAIS d'e-mail vide — s'il n'y a rien de neuf depuis le dernier envoi,
//     on ne part pas. Un abonné qui reçoit un e-mail vide se désinscrit, et il a
//     raison.
//
// Elles vivent dans `composerResume`, fonction pure et testée. Ce cron ne fait
// que lire, appliquer et noter : une règle d'envoi écrite au milieu d'une boucle
// ne se teste pas, et c'est le genre de code qu'on n'ose plus toucher ensuite.
//
// LE CANAL « COMMERCES SUIVIS » PASSE PAR ICI, pas par un envoi séparé. Une
// annonce d'un commerce suivi est déjà dans le fil de la ville : un troisième
// e-mail quotidien n'ajouterait aucune information, il dépenserait une attention
// qui est un budget fixe. Le suivi change la composition et l'ordre du résumé,
// jamais sa fréquence.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron-auth";
import { type PartnerOffer } from "@/lib/site-internet/collectif";
import { sendDigest } from "@/lib/site-internet/ville-mail";
import { filDeVille, type Publication } from "@/lib/direct/publications";
import { composerResume } from "@/lib/direct/resume";
import { configVille } from "@/lib/direct/ville";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const str = (v: unknown) => (v == null ? "" : String(v));

type Abonne = {
  id: string;
  ville_slug: string;
  email: string;
  unsub_token: string;
  last_sent_at: string | null;
  recoit_resume: boolean;
  recoit_suivis: boolean;
};

/** Les publications voyagent en `PartnerOffer` : le gabarit d'e-mail est
 *  éprouvé, c'est la source qui avait changé, pas le rendu. */
const enOffre = (p: Publication): PartnerOffer => ({
  id: p.id,
  slug: p.auteurSlug,
  nom: p.auteurNom,
  metier: p.auteurMetier,
  texte: p.texte,
  photo: p.photo,
  publieLe: p.publieLe,
  jusqua: p.expireLe,
});

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = Date.now();

  let abonnes: Abonne[] = [];
  try {
    const { data, error } = await supabase
      .from("human_habitants")
      .select("id, ville_slug, email, unsub_token, last_sent_at, recoit_resume, recoit_suivis")
      // `recoit_resume` OU `recoit_suivis` : quelqu'un peut avoir coupé le
      // résumé général tout en voulant les nouvelles de SES commerces. Filtrer
      // sur le seul résumé le priverait du canal qu'il a gardé exprès.
      .or("recoit_resume.eq.true,recoit_suivis.eq.true")
      .not("confirmed_at", "is", null)
      .not("email", "is", null)
      .is("unsubscribed_at", null)
      .limit(5000);
    if (error) throw new Error(error.message);
    abonnes = (Array.isArray(data) ? data : []) as Abonne[];
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/does not exist|schema cache|Could not find/i.test(msg)) {
      return NextResponse.json({ ok: true, skipped: "migration habitants non appliquée" });
    }
    return NextResponse.json({ error: "Lecture des abonnés impossible." }, { status: 500 });
  }

  if (!abonnes.length) return NextResponse.json({ ok: true, abonnes: 0, envoyes: 0 });

  // Le fil d'une ville se lit UNE fois, quel que soit le nombre d'abonnés.
  const parVille = new Map<string, Publication[]>();
  const nomVille = new Map<string, string>();
  for (const a of abonnes) {
    if (parVille.has(a.ville_slug)) continue;
    parVille.set(a.ville_slug, await filDeVille(supabase, a.ville_slug, { fenetreLarge: true }));
    nomVille.set(a.ville_slug, (await configVille(supabase, a.ville_slug)).nom);
  }

  // Les commerces suivis, PAR LOTS. Un `in()` sur cinq mille identifiants dépasse la longueur d'URL
  // acceptée : la requête échouait, le `catch` la traduisait en « personne ne
  // suit personne », et la section « Vos commerces » disparaissait sans bruit —
  // en emportant le cas « résumé coupé, suivis gardés », qui n'aurait alors plus
  // rien envoyé du tout.
  const suivisPar = new Map<string, Set<string>>();
  const LOT = 200;
  for (let i = 0; i < abonnes.length; i += LOT) {
    const ids = abonnes.slice(i, i + LOT).map((a) => a.id);
    try {
      const { data, error } = await supabase.from("human_suivis").select("habitant_id, site_id").in("habitant_id", ids);
      if (error) throw new Error(error.message);
      for (const r of (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>) {
        const h = str(r.habitant_id);
        if (!suivisPar.has(h)) suivisPar.set(h, new Set());
        suivisPar.get(h)!.add(str(r.site_id));
      }
    } catch {
      /* ce lot échoue → ses abonnés reçoivent le résumé sans section « Vos
         commerces », les autres lots ne sont pas pénalisés */
    }
  }

  let envoyes = 0;
  let sautes = 0;
  for (const a of abonnes) {
    const ville = nomVille.get(a.ville_slug) || "";
    const publications = parVille.get(a.ville_slug) ?? [];
    if (!ville || !publications.length) {
      sautes++;
      continue;
    }

    const resume = composerResume(
      publications,
      {
        recoitResume: a.recoit_resume !== false,
        recoitSuivis: a.recoit_suivis !== false,
        suivis: suivisPar.get(a.id) ?? new Set(),
        lastSentAt: a.last_sent_at,
      },
      now
    );
    if (!resume) {
      sautes++;
      continue;
    }

    const ok = await sendDigest(
      a.email,
      ville,
      resume.deLaVille.map(enOffre),
      str(a.unsub_token),
      resume.desSuivis.map(enOffre)
    );
    if (!ok) {
      sautes++;
      continue;
    }
    // `last_sent_at` n'avance QUE sur un envoi réussi : un échec Resend ne doit
    // pas faire sauter le résumé du lendemain.
    await supabase
      .from("human_habitants")
      .update({ last_sent_at: new Date().toISOString() })
      .eq("id", str(a.id));
    envoyes++;
  }

  return NextResponse.json({ ok: true, abonnes: abonnes.length, envoyes, sautes });
}
