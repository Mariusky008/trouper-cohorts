import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/admin-guard";
import { etatDeLHote, poserLHote, refaireSansHote, relancerLHote } from "@/lib/site-internet/couverture";

// L'HÔTE D'UNE PHOTO CLIKME, VU ET RÉGLÉ DEPUIS L'ADMINISTRATION — voir
// `/admin/hote-photo` et `poserLHote` dans `couverture.ts`.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const slugValide = (v: unknown) => (typeof v === "string" && /^[a-z0-9-]{2,120}$/i.test(v) ? v : "");

export async function GET(requete: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ erreur: "Accès admin requis." }, { status: 403 });
  const slug = slugValide(new URL(requete.url).searchParams.get("slug"));
  if (!slug) return NextResponse.json({ erreur: "adresse de page invalide" }, { status: 400 });
  const e = await etatDeLHote(slug);
  if (!e) return NextResponse.json({ erreur: "aucune page à cette adresse" }, { status: 404 });
  return NextResponse.json(e, { headers: { "cache-control": "no-store" } });
}

export async function POST(requete: Request) {
  if (!(await isCurrentUserAdmin())) return NextResponse.json({ erreur: "Accès admin requis." }, { status: 403 });
  const p = (await requete.json().catch(() => ({}))) as Record<string, unknown>;
  const slug = slugValide(p.slug);
  if (!slug) return NextResponse.json({ erreur: "adresse de page invalide" }, { status: 400 });
  try {
    if (p.action === "poser") {
      const etat = await poserLHote(slug, p.boite);
      return etat ? NextResponse.json({ etat }) : NextResponse.json({ erreur: "photo ou cadre invalide" }, { status: 400 });
    }
    if (p.action === "sans-hote") {
      const etat = await refaireSansHote(slug);
      return etat ? NextResponse.json({ etat }) : NextResponse.json({ erreur: "pas d'hôte repéré" }, { status: 400 });
    }
    if (p.action === "relancer") {
      const etat = await relancerLHote(slug);
      return etat ? NextResponse.json({ etat }) : NextResponse.json({ erreur: "pas de photo ClikMe" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ erreur: e instanceof Error ? e.message : "base indisponible" }, { status: 503 });
  }
  return NextResponse.json({ erreur: "action inconnue" }, { status: 400 });
}
