// Désinscription des annonces d'une ville — un clic, sans connexion, sans motif.
//
// Le retrait s'applique AVANT tout affichage : la page ne dit « c'est fait » que
// si ça l'est. On ne supprime pas la ligne (on marque la date) : c'est ce qui
// permet de ne jamais réécrire à quelqu'un par accident.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Désinscription", robots: { index: false, follow: false } };

const str = (v: unknown) => (v == null ? "" : String(v));

export default async function StopVille({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let ville = "";
  let ok = false;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_habitants")
      .select("id, ville")
      .eq("unsub_token", str(token))
      .maybeSingle();
    const row = (data as Record<string, unknown> | null) ?? null;
    if (row) {
      const { error } = await supabase
        .from("human_habitants")
        // Tous les canaux, pas seulement la date : l'habitant a désormais
        // quatre canaux indépendants, et « je me désabonne » veut dire les
        // quatre. Ne marquer que la date laisserait les alertes actives pour le
        // jour où on les branchera.
        .update({
          unsubscribed_at: new Date().toISOString(),
          recoit_resume: false,
          recoit_alertes: false,
          recoit_suivis: false,
          recoit_ville_infos: false,
        })
        .eq("id", str(row.id));
      if (!error) {
        ville = str(row.ville);
        ok = true;
      }
    }
  } catch {
    /* on n'affiche jamais « c'est fait » si l'écriture n'a pas eu lieu */
  }

  return (
    <main className="vstop">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .vstop{min-height:100vh;background:#0E1014;color:#fff;display:flex;align-items:center;justify-content:center;
            padding:28px 18px;font-family:var(--fb),system-ui,sans-serif;}
          .vstop .bx{max-width:420px;width:100%;text-align:center;}
          .vstop .ic{font-size:44px;line-height:1;}
          .vstop h1{font-family:var(--fd),Georgia,serif;font-size:26px;font-weight:600;line-height:1.15;margin:14px 0 0;}
          .vstop p{font-size:14px;line-height:1.65;color:#A8AEBC;margin:13px 0 0;}
          `,
        }}
      />
      <div className="bx">
        {ok ? (
          <>
            <div className="ic">👋</div>
            <h1>C&apos;est fait.</h1>
            <p>
              Vous ne recevrez plus les annonces{ville ? ` de ${ville}` : ""}. Aucun autre e-mail ne partira à cette
              adresse.
            </p>
          </>
        ) : (
          <>
            <div className="ic">🤔</div>
            <h1>Ce lien n&apos;est plus valide.</h1>
            <p>
              Vous êtes peut-être déjà désinscrit·e. Si vous recevez encore des e-mails, répondez à l&apos;un
              d&apos;eux et nous vous retirons à la main.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
