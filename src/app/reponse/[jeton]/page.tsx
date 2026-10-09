// ✅ LA PAGE OÙ LE COMMERÇANT RÉPOND — ouverte depuis le message WhatsApp
// qu'un client lui a envoyé après un duel dans un salon d'Ensemble.
//
// ELLE NE FAIT RIEN EN S'OUVRANT. WhatsApp ouvre lui-même le lien pour en
// faire l'aperçu, au moment où le client envoie son message : une page qui
// confirmerait en s'affichant se confirmerait toute seule. Deux boutons, et
// c'est l'appui qui répond (voir `api/direct/reponse-commerce`).
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { lireJetonReponse } from "@/lib/direct/reponse-commerce";
import { motsDeLAction } from "@/lib/direct/duel";
import { BoutonsReponse } from "./boutons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Une demande ClikMe",
  robots: { index: false, follow: false },
};

/** La dernière réponse déjà donnée à ce duel, s'il y en a une. */
async function dejaRepondu(c: string, d: string): Promise<"confirme" | "refuse" | undefined> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("human_conversation_gestes").select("id, geste").eq("conversation", c).is("habitant", null).order("id", { ascending: true }).limit(200);
    let e: "confirme" | "refuse" | undefined;
    for (const r of (data ?? []) as { geste?: { type?: string; duel?: string; etat?: string } }[]) {
      if (r.geste?.type === "duelReponse" && r.geste.duel === d) e = r.geste.etat === "confirme" ? "confirme" : "refuse";
    }
    return e;
  } catch {
    return undefined;
  }
}

export default async function Page({ params }: { params: Promise<{ jeton: string }> }) {
  const { jeton } = await params;
  const j = lireJetonReponse(decodeURIComponent(jeton));
  const etat = j ? await dejaRepondu(j.c, j.d) : undefined;
  /** Ce qu'il demande, dit comme une phrase : la suite de « Marie aimerait… ». La chose elle-même suit, en dessous. */
  const demande = motsDeLAction(j?.a || "Mettre de côté").demande;
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
            <h1>
              {j.q || "Un client"} aimerait {demande}
            </h1>
            <div className="rc-objet">
              <b>« {j.o} »</b>
              {j.p && <span>{j.p}</span>}
            </div>
            <p className="rc-d">
              C’est son choix, tranché avec ses amis dans un salon ClikMe{j.m ? ` — chez ${j.m}` : ""}. Votre réponse s’affiche dans son salon.
            </p>
            <BoutonsReponse jeton={decodeURIComponent(jeton)} initial={etat} action={j.a || "Mettre de côté"} client={j.q || ""} />
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
.rc-objet{display:flex;flex-direction:column;gap:2px;margin:0 0 12px;padding:12px 14px;border-radius:14px;background:rgba(246,181,75,.1);border:1px solid rgba(246,181,75,.35);}
.rc-objet b{font-size:16px;}
.rc-objet span{font-size:14px;color:#F6B54B;font-weight:700;}
.rc-d{margin:0 0 16px;font-size:14px;line-height:1.45;color:#D9C3A8;}
`;
