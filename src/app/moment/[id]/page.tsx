// 📸 UN MOMENT ENVOYÉ (`clikme.fr/moment/<id>`) — les grands moments, lot R3 (`lib/direct/moment-partage.ts`).
//
// Quelqu'un a réagi à une seconde d'une vidéo et l'a envoyé (WhatsApp, Instagram, TikTok…). Ici : son image (la
// miniature de la vidéo, l'heure, sa figurine et sa bulle), « ▶ Voir à 2:47 sur YouTube » (trois secondes avant) et
// « ✨ Réagis avec ta figurine ». L'aperçu du lien : la même image. Trente jours ; jamais dans les moteurs de recherche.
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireMoment } from "@/lib/direct/moment-partage-serveur";
import { MOMENT_PARTAGE as MP, PHRASES_MOMENT as P, lienYouTubeDuMoment, minuteDuMoment } from "@/lib/direct/moment-partage";
import { MOMENTS } from "@/lib/direct/grands-moments";

export const dynamic = "force-dynamic";

const charger = cache(async (id: string) => {
  try {
    return await lireMoment(createAdminClient(), id);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const id = (await params).id;
  const m = await charger(id);
  const titre = m ? `${MOMENTS[m.e].e} ${P.aReagi(m.prenom, minuteDuMoment(m.t))}` : "Un moment ClikMe";
  const description = m ? (m.video.titre ? `« ${m.mot} » — ${m.video.titre}` : `« ${m.mot} »`) : P.efface;
  const images = m ? [{ url: `/api/direct/moment/${encodeURIComponent(id)}/image`, width: MP.largeur, height: MP.hauteur, type: "image/png", alt: titre }] : [];
  return {
    title: titre,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: titre, description, type: "website", images },
    twitter: { card: "summary_large_image", title: titre, description, images: images.map((x) => x.url) },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1B0A17" };

export default async function PageMoment({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const m = await charger(id);
  if (!m)
    return (
      <main className="mo mo-efface" data-moment-efface>
        <p>{P.efface}</p>
        <Link className="mo-bouton" href="/collection">
          {P.reagis}
        </Link>
        <style>{STYLES}</style>
      </main>
    );
  const minute = minuteDuMoment(m.t);
  return (
    <main className="mo" data-moment={m.id} style={{ ["--c" as string]: MOMENTS[m.e].couleur } as React.CSSProperties}>
      <h1>
        {MOMENTS[m.e].e} {P.aReagi(m.prenom, minute)}
      </h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mo-image" src={`/api/direct/moment/${m.id}/image`} alt={`${P.aReagi(m.prenom, minute)} : « ${m.mot} »`} width={MP.largeur} height={MP.hauteur} />
      <div className="mo-boutons">
        <a className="mo-bouton" data-youtube href={lienYouTubeDuMoment(m.video.id, m.t)} target="_blank" rel="noopener noreferrer">
          {P.voirYouTube(minute)}
        </a>
        <Link className="mo-bouton plein" data-reagis href="/collection">
          {P.reagis}
        </Link>
      </div>
      <style>{STYLES}</style>
    </main>
  );
}

const STYLES = `
body{margin:0;background:#1B0A17}
.mo{min-height:100dvh;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:16px;padding:max(20px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom));background:radial-gradient(90% 60% at 50% 40%,color-mix(in srgb,var(--c,#FF2E9A) 22%,transparent),transparent 70%),#1B0A17;color:#FFF4E6;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center}
.mo h1{margin:0;font-size:20px;font-weight:800;line-height:1.25;text-wrap:balance}
.mo-image{width:auto;max-width:100%;max-height:68dvh;height:auto;border-radius:18px;box-shadow:0 20px 50px -20px #000}
.mo-boutons{display:flex;flex-direction:column;gap:10px;width:100%;max-width:360px}
.mo-bouton{display:block;padding:13px 18px;border-radius:999px;background:rgba(255,255,255,.12);color:#FFF4E6;font-weight:800;font-size:16px;text-decoration:none}
.mo-bouton.plein{background:#FF2E9A}
.mo-efface{justify-content:center}
`;
