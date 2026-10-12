// 🤔 « ÇA ME VA ? » — la page qu'un ami ouvre depuis WhatsApp.
//
// SANS APPLICATION ET SANS COMPTE : l'essai, deux réponses, un appui. Puis ce
// que disent les autres, et la boutique où l'essai a été fait — « Essayez
// cette pièce sur vous ». C'est par là que ClikMe se répand : chaque essai
// partagé fait découvrir le commerçant à trois ou quatre personnes.
//
// ELLE NE VOTE PAS EN S'OUVRANT : WhatsApp ouvre lui-même le lien pour en
// faire l'aperçu. Et l'aperçu, c'est l'essai (`og:image`) : on voit la pièce
// portée avant même d'ouvrir.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site-url";
import { lireAvisPublic, lireJetonAvis, type AvisPublic } from "@/lib/direct/avis-amis";
import { Patienter, Vote } from "./vote";

export const dynamic = "force-dynamic";

async function lire(jeton: string): Promise<{ jeton: string; e: string; avis: AvisPublic | null } | null> {
  const brut = decodeURIComponent(jeton);
  const j = lireJetonAvis(brut);
  if (!j) return null;
  try {
    return { jeton: brut, e: j.e, avis: await lireAvisPublic(createAdminClient(), j.e) };
  } catch {
    return { jeton: brut, e: j.e, avis: null };
  }
}

/** « Robe fleurie noire », chez Lili Ross by me */
const quoiChez = (a: AvisPublic) => `« ${a.quoi} »${a.magasin ? `, chez ${a.magasin}` : ""}`;

export async function generateMetadata({ params }: { params: Promise<{ jeton: string }> }): Promise<Metadata> {
  const { jeton } = await params;
  const l = await lire(jeton);
  const base: Metadata = { title: "Ça me va ? — ClikMe", robots: { index: false, follow: false } };
  if (!l?.avis) return base;
  const description = `${l.avis.prenom ? `${l.avis.prenom} vous demande` : "On vous demande"} votre avis : ${quoiChez(l.avis)}. Un appui suffit.`;
  const image = `${SITE_URL}/api/direct/avis-amis/image?j=${encodeURIComponent(l.jeton)}`;
  return {
    ...base,
    title: "Ça me va ?",
    description,
    openGraph: { title: "Ça me va ?", description, type: "website", siteName: "ClikMe", images: [{ url: image, width: 1080, height: 1350 }] },
    twitter: { card: "summary_large_image", title: "Ça me va ?", description, images: [image] },
  };
}

export default async function Page({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const l = await lire(jeton);
  return (
    <main className="cmv">
      <style>{STYLE}</style>
      <div className="cmv-f">
        <p className="cmv-marque">clikme</p>
        {!l ? (
          <>
            <h1>Ce lien n’est plus valable.</h1>
            <p className="cmv-d">Il a expiré, ou il a été mal copié. Demandez à votre ami de vous le renvoyer.</p>
          </>
        ) : !l.avis ? (
          /* L'ESSAI MONTE ENCORE : le lien part dans le geste, l'image suit de quelques secondes. */
          <>
            <h1>L’essai arrive…</h1>
            <p className="cmv-d">Encore une seconde.</p>
            <Patienter />
          </>
        ) : (
          <>
            <p className="cmv-sur">{l.avis.prenom ? `${l.avis.prenom} vous demande votre avis` : "On vous demande votre avis"}</p>
            <h1>Ça me va ?</h1>
            <figure className="cmv-essai">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/direct/avis-amis/image?j=${encodeURIComponent(l.jeton)}`} alt={`Essai : ${l.avis.quoi}`} />
              <figcaption>
                <b>{l.avis.quoi}</b>
                {l.avis.prix && <span>{l.avis.prix}</span>}
              </figcaption>
            </figure>
            {l.avis.magasin && <p className="cmv-chez">Essai fait chez {l.avis.magasin}, sur sa propre photo.</p>}
            <Vote jeton={l.jeton} e={l.e} oui={l.avis.oui} non={l.avis.non} magasin={l.avis.magasin} page={l.avis.page} ceci={l.avis.ceci} />
          </>
        )}
      </div>
    </main>
  );
}

const STYLE = `
.cmv{min-height:100vh;display:flex;justify-content:center;padding:20px 16px 32px;box-sizing:border-box;
  background:radial-gradient(circle at 50% 10%,#3d2615,#1b110a 70%);color:#FFF4E6;font-family:var(--font-clikme),"Poppins",system-ui,sans-serif;}
.cmv-f{width:100%;max-width:440px;}
.cmv-marque{margin:0 0 12px;font-weight:800;font-size:22px;letter-spacing:-.02em;color:#fff;}
.cmv-sur{margin:0 0 2px;font-size:14px;font-weight:700;color:#F6B54B;}
.cmv h1{margin:0 0 12px;font-size:30px;line-height:1.1;font-weight:900;letter-spacing:-.02em;}
.cmv-d{margin:0 0 16px;font-size:15px;line-height:1.45;color:#D9C3A8;}
.cmv-essai{position:relative;margin:0;border-radius:22px;overflow:hidden;background:#2a1a0f;border:1px solid rgba(246,181,75,.35);}
.cmv-essai img{display:block;width:100%;max-height:62vh;object-fit:cover;object-position:top;}
.cmv-essai figcaption{position:absolute;left:10px;bottom:10px;right:10px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;
  padding:9px 12px;border-radius:14px;background:rgba(20,12,6,.78);backdrop-filter:blur(6px);}
.cmv-essai figcaption b{font-size:16px;}
.cmv-essai figcaption span{font-size:14px;font-weight:700;color:#F6B54B;}
.cmv-chez{margin:10px 2px 0;font-size:13.5px;color:#BFAE98;}
`;
