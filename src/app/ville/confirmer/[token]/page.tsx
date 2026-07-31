// Confirmation d'inscription aux annonces d'une ville (2ᵉ moitié du double opt-in).
//
// Le clic sur ce lien EST le consentement : avant lui, aucun digest ne part.
// La page dit exactement ce à quoi la personne vient de dire oui — rythme
// compris — et donne le retrait dans la foulée.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { villeSlug } from "@/lib/site-internet/ville-mail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Inscription confirmée", robots: { index: false, follow: false } };

const str = (v: unknown) => (v == null ? "" : String(v));

export default async function ConfirmerVille({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let ville = "";
  let unsub = "";
  let ok = false;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_ville_abonnes")
      .select("id, ville, unsub_token, confirmed_at")
      .eq("confirm_token", str(token))
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (row) {
      ville = str(row.ville);
      unsub = str(row.unsub_token);
      ok = true;
      // Idempotent : recliquer le lien ne redémarre pas le compteur d'envoi.
      if (!row.confirmed_at) {
        await supabase
          .from("human_ville_abonnes")
          .update({ confirmed_at: new Date().toISOString(), unsubscribed_at: null })
          .eq("id", str(row.id));
      }
    }
  } catch {
    /* table non migrée → on affiche l'échec plutôt qu'une fausse confirmation */
  }

  return (
    <main className="vconf">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .vconf{min-height:100vh;background:#0E1014;color:#fff;display:flex;align-items:center;justify-content:center;
            padding:28px 18px;font-family:var(--fb),system-ui,sans-serif;}
          .vconf .bx{max-width:440px;width:100%;text-align:center;}
          .vconf .ic{font-size:46px;line-height:1;}
          .vconf h1{font-family:var(--fd),Georgia,serif;font-size:28px;font-weight:600;line-height:1.15;margin:14px 0 0;}
          .vconf p{font-size:14px;line-height:1.65;color:#A8AEBC;margin:13px 0 0;}
          .vconf p b{color:#fff;}
          .vconf .go{display:block;margin-top:22px;text-decoration:none;background:#00C896;color:#07100C;
            border-radius:14px;padding:14px;font-size:15px;font-weight:800;}
          .vconf .stop{display:inline-block;margin-top:16px;font-size:12px;color:#6F7684;}
          `,
        }}
      />
      <div className="bx">
        {ok ? (
          <>
            <div className="ic">✓</div>
            <h1>C&apos;est confirmé.</h1>
            <p>
              Vous recevrez les annonces des commerçants de <b>{ville}</b> — <b>un e-mail par jour au maximum</b>,
              et seulement s&apos;il y a du nouveau. Jamais d&apos;e-mail vide.
            </p>
            <a className="go" href={`/ville/${villeSlug(ville)}`}>
              Voir ce qui se passe à {ville} →
            </a>
            {unsub && (
              <a className="stop" href={`/ville/stop/${encodeURIComponent(unsub)}`}>
                Me désinscrire tout de suite
              </a>
            )}
          </>
        ) : (
          <>
            <div className="ic">🤔</div>
            <h1>Ce lien n&apos;est plus valide.</h1>
            <p>
              Il a peut-être déjà servi, ou l&apos;inscription a été retirée. Reprenez depuis la page de votre
              ville, c&apos;est immédiat.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
