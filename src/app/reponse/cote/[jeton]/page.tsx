// ✅ LA PAGE OÙ LE MAGASIN RÉPOND À UNE MISE DE CÔTÉ — ouverte depuis le
// message WhatsApp qu'un client lui a envoyé après avoir vu la pièce avec ses
// propres vêtements (le look de son dressing), ou essayée seule sur sa photo.
//
// ELLE NE FAIT RIEN EN S'OUVRANT : WhatsApp ouvre lui-même le lien pour en
// faire l'aperçu. Deux boutons, et c'est l'appui qui répond (voir
// `api/direct/reponse-cote`). La même règle, et le même dessin, que la page
// des duels (`/reponse/<jeton>`).
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { etatDeLaDemande, lireJetonCote } from "@/lib/direct/mise-de-cote";
import { BoutonsReponse } from "../../[jeton]/boutons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Une demande ClikMe",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const brut = decodeURIComponent(jeton);
  const j = lireJetonCote(brut);
  let initial: "confirme" | "refuse" | undefined;
  if (j) {
    try {
      const e = await etatDeLaDemande(createAdminClient(), j);
      initial = e === "confirmee" ? "confirme" : e === "refusee" ? "refuse" : undefined;
    } catch {
      initial = undefined;
    }
  }
  return (
    <main className="rc">
      <style>{STYLE}</style>
      <div className="rc-f">
        <p className="rc-marque">clikme</p>
        {!j ? (
          <>
            <h1>Ce lien n’est plus valable.</h1>
            <p className="rc-d">Il a expiré, ou il a été mal copié. Le client peut vous réécrire.</p>
          </>
        ) : (
          <>
            <p className="rc-sur">Une demande arrive de ClikMe</p>
            <h1>{j.q || "Un client"} aimerait que vous lui mettiez de côté</h1>
            <div className="rc-objet">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {j.ph && <img src={j.ph} alt="" />}
              <span className="rc-txt">
                <b>« {j.o} »</b>
                {j.p && <span>{j.p}</span>}
              </span>
            </div>
            <p className="rc-d">
              {j.q || "Ce client"} l’a vue sur ClikMe{j.m ? `, chez ${j.m}` : ""}, et l’a essayée {j.s ? "sur sa propre photo" : "avec ses propres vêtements"}. Votre réponse s’affiche dans son application.
            </p>
            <BoutonsReponse jeton={brut} initial={initial} action="Mettre de côté" client={j.q || ""} adresse="/api/direct/reponse-cote" ou="dans ClikMe" />
          </>
        )}
      </div>
    </main>
  );
}

const STYLE = `
.rc{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box;
  background:radial-gradient(circle at 50% 20%,#3d2615,#1b110a 70%);color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;}
.rc-f{width:100%;max-width:420px;padding:22px 20px;border-radius:24px;background:rgba(36,22,12,.92);border:1px solid rgba(246,181,75,.45);
  box-shadow:0 20px 50px -20px rgba(0,0,0,.8);}
.rc-marque{margin:0 0 14px;font-weight:800;font-size:22px;letter-spacing:-.02em;color:#fff;}
.rc-sur{margin:0 0 6px;font-size:13px;font-weight:700;color:#F6B54B;letter-spacing:.02em;}
.rc h1{margin:0 0 12px;font-size:22px;line-height:1.25;font-weight:800;}
.rc-objet{display:flex;align-items:center;gap:12px;margin:0 0 12px;padding:12px 14px;border-radius:14px;background:rgba(246,181,75,.1);border:1px solid rgba(246,181,75,.35);}
.rc-objet img{width:56px;height:70px;object-fit:cover;border-radius:10px;flex:none;}
.rc-txt{display:flex;flex-direction:column;gap:2px;min-width:0;}
.rc-txt b{font-size:16px;}
.rc-txt span{font-size:14px;color:#F6B54B;font-weight:700;}
.rc-d{margin:0 0 16px;font-size:14px;line-height:1.45;color:#D9C3A8;}
`;
