// 🌉 « RELIER MON DRESSING » — la page de clikme.fr où l'on accepte de relier
// sa Maison à la page d'un magasin servie sous son propre nom de domaine.
// Elle ne fait rien en s'ouvrant : c'est l'appui sur « Relier » qui part
// (voir `lib/direct/pont-maison.ts`).
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { habitantCourant } from "@/lib/direct/habitant";
import { hoteDe, magasinDuDomaine } from "@/lib/direct/pont-maison";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Relier mon dressing — ClikMe", robots: { index: false, follow: false } };

const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const retour = un((await searchParams).retour).slice(0, 600);
  const hote = hoteDe(retour);
  let magasin: { slug: string; nom: string } | null = null;
  let aUneMaison = false;
  try {
    const supabase = createAdminClient();
    magasin = hote ? await magasinDuDomaine(supabase, hote) : null;
    aUneMaison = Boolean(await habitantCourant(supabase));
  } catch {
    magasin = null;
  }
  return (
    <main className="rl">
      <style>{STYLE}</style>
      <div className="rl-f">
        <p className="rl-marque">clikme</p>
        {!magasin ? (
          <>
            <h1>Ce lien n’est pas valable.</h1>
            <p className="rl-d">Il ne désigne pas la page d’un magasin ClikMe.</p>
          </>
        ) : !aUneMaison ? (
          <>
            <h1>Aucun dressing ClikMe sur ce téléphone</h1>
            <p className="rl-d">
              Sur ce navigateur, vous n’avez pas encore de Maison ClikMe. Revenez chez {magasin.nom || "le magasin"} : vous pouvez y créer votre dressing, ou le retrouver avec votre adresse e-mail.
            </p>
            <a className="rl-b plein" href={`${retour}${retour.includes("?") ? "&" : "?"}pont=aucun`}>
              Revenir chez {magasin.nom || "le magasin"}
            </a>
          </>
        ) : (
          <>
            <p className="rl-sur">Votre dressing, partout</p>
            <h1>Relier votre dressing à la page de {magasin.nom || "ce magasin"} ?</h1>
            <p className="rl-d">
              Vos vêtements rangés dans Ma Maison seront là sur {hote}, et ce que vous y ajoutez rejoindra votre Maison. Ils restent privés : le magasin ne les voit pas.
            </p>
            <form method="post" action="/api/direct/ma-maison/pont">
              <input type="hidden" name="retour" value={retour} />
              <button type="submit" className="rl-b plein">
                Relier mon dressing
              </button>
            </form>
            <a className="rl-b" href={retour}>
              Pas maintenant
            </a>
          </>
        )}
      </div>
    </main>
  );
}

const STYLE = `
.rl{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box;
  background:radial-gradient(circle at 50% 20%,#3d2615,#1b110a 70%);color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;}
.rl-f{width:100%;max-width:420px;padding:22px 20px;border-radius:24px;background:rgba(36,22,12,.92);border:1px solid rgba(246,181,75,.45);box-shadow:0 20px 50px -20px rgba(0,0,0,.8);}
.rl-marque{margin:0 0 14px;font-weight:800;font-size:22px;letter-spacing:-.02em;color:#fff;}
.rl-sur{margin:0 0 6px;font-size:13px;font-weight:700;color:#F6B54B;}
.rl h1{margin:0 0 12px;font-size:22px;line-height:1.25;font-weight:800;}
.rl-d{margin:0 0 16px;font-size:14px;line-height:1.45;color:#D9C3A8;}
.rl form{margin:0;}
.rl-b{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;margin-top:10px;border-radius:999px;font:inherit;font-size:15px;font-weight:800;cursor:pointer;text-decoration:none;box-sizing:border-box;
  color:#FFF4E6;background:none;border:1px solid rgba(255,244,230,.35);}
.rl-b.plein{color:#2A1608;border:0;background:linear-gradient(180deg,#FBC766,#F0A23A);}
`;
