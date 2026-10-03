// 🍽️ SON EXPÉRIENCE, DEPUIS SON ESPACE COMMERÇANT — le plat, le cuisinier, les scènes.
//
// « Je m'occupe de la page admin du commerçant. » Cette route est ce que sa
// page appelle. Le même jeton que le reste de son espace (`pro_token`).
//
//   GET  ?slug=…&token=…
//        → { experience, montree: { plat, chef } }
//          `montree` : l'image que SA PAGE montre en ce moment — la scène si
//          elle est faite et pas refusée, sinon sa photo d'origine.
//
//   POST { slug, token, action: "poser", plat?: {nom, prix, photo, phrase, phraseFort} | null, chef?: {photo} | null }
//        Les photos en `data:image/...;base64,…` (ou une adresse https).
//        Une photo neuve lance sa scène ; `null` retire.
//
//   POST { slug, token, action: "refuser" | "reprendre" | "refaire", quoi: "plat" | "chef" }
//
// Le rendu prend une à trois minutes : il se fait après la réponse. La page
// relit l'état (GET) pour voir la scène arriver — `etat` passe de `attente`
// à `en-cours`, puis `prete` (ou `echec`, avec `erreur`).
import { NextResponse, after } from "next/server";
import {
  completerScenes,
  deciderScene,
  ligneDuCommercant,
  poserExperience,
  type DemandeExperience,
} from "@/lib/site-internet/experience-scenes";
import { platEnCours, sceneMontree, type ExperienceResto } from "@/lib/site-internet/experience-donnees";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const s = (v: unknown) => (v == null ? "" : String(v)).trim();

function reponse(experience: ExperienceResto | null) {
  const e = experience ?? {};
  return {
    experience: e,
    // FAUX PASSÉ SA FIN : sa page ne le montre plus (« aujourd'hui » s'arrête ce soir).
    platEnLigne: Boolean(platEnCours(e.plat)),
    montree: {
      plat: sceneMontree(e.scenePlat, e.plat?.photo)?.url ?? e.plat?.photo ?? null,
      chef: sceneMontree(e.sceneChef, e.chef?.photo)?.url ?? e.chef?.photo ?? null,
    },
  };
}

export async function GET(requete: Request) {
  const q = new URL(requete.url).searchParams;
  const l = await ligneDuCommercant(s(q.get("slug")), s(q.get("token")));
  if (!l) return NextResponse.json({ erreur: "accès refusé" }, { status: 403 });
  return NextResponse.json(reponse(l.experience), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(requete: Request) {
  const p = (await requete.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = s(p.slug);
  const l = await ligneDuCommercant(slug, s(p.token));
  if (!l) return NextResponse.json({ erreur: "accès refusé" }, { status: 403 });
  const action = s(p.action);

  if (action === "poser") {
    const r = await poserExperience(slug, { plat: p.plat, chef: p.chef } as DemandeExperience);
    if (r.erreur) return NextResponse.json({ erreur: r.erreur }, { status: 400 });
    after(() => completerScenes(slug).catch(() => undefined));
    return NextResponse.json(reponse(r.experience));
  }

  if (action === "refuser" || action === "reprendre" || action === "refaire") {
    const quoi = s(p.quoi);
    if (quoi !== "plat" && quoi !== "chef") return NextResponse.json({ erreur: "quoi : plat ou chef" }, { status: 400 });
    const r = await deciderScene(slug, quoi, action);
    if (r.erreur) return NextResponse.json({ erreur: r.erreur, ...reponse(r.experience) }, { status: 409 });
    if (action === "refaire") after(() => completerScenes(slug).catch(() => undefined));
    return NextResponse.json(reponse(r.experience));
  }

  return NextResponse.json({ erreur: "action inconnue" }, { status: 400 });
}
