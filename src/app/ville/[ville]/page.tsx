// « Aujourd'hui à {ville} » — le catalogue commun des commerçants d'une ville.
//
// Le bloc affiché chez un commerçant ne montre que quelques annonces : c'est un
// aperçu. Cette page montre TOUT ce qui se passe aujourd'hui dans la ville, sans
// plafond — donc sans commerçant invisible, ce qui était le défaut du système à
// quatre emplacements.
//
// Honnêteté : la page affiche ce qui existe. Trois annonces, elle en montre trois
// et le dit. On ne remplit jamais avec des exemples.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { cityOffers, ilYA, noteCatalogueViews } from "@/lib/site-internet/collectif";
import { slugify } from "@/lib/popey-marketplace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const str = (v: unknown) => (v == null ? "" : String(v));
const capWords = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());

/** Retrouve le nom exact de la ville à partir de son slug d'URL. */
async function resolveVille(slug: string): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("human_vitrine_sites")
      .select("city")
      .eq("channel", "letter")
      .eq("published", true)
      .limit(500);
    const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    for (const r of rows) {
      const c = str(r.city).trim();
      if (c && slugify(c) === slug) return c;
    }
  } catch {
    /* base indisponible → page vide plutôt qu'une erreur */
  }
  return "";
}

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const nom = capWords(await resolveVille(ville)) || "votre ville";
  const title = `Aujourd'hui à ${nom}`;
  const description = `Ce que proposent les commerçants de ${nom} en ce moment : places qui se libèrent, offres du jour, nouveautés.`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function VillePage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const nomVille = await resolveVille(ville);
  const affiche = capWords(nomVille) || "cette ville";
  const supabase = createAdminClient();
  const offers = nomVille ? await cityOffers(supabase, nomVille) : [];
  // Chaque annonce rendue ici est une exposition de plus pour son commerce :
  // c'est ce chiffre que l'Espace Pro lui montre. Non bloquant.
  await noteCatalogueViews(supabase, offers);

  return (
    <main className="vil">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .vil{min-height:100vh;background:#0E1014;color:#fff;font-family:'Inter',system-ui,sans-serif;
            padding:34px 18px 60px;}
          .vil .in{max-width:660px;margin:0 auto;}
          .vil .k{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;font-weight:800;color:#7FE6C0;}
          .vil h1{font-family:Georgia,serif;font-size:34px;font-weight:600;line-height:1.1;margin:9px 0 0;}
          .vil .sub{font-size:14px;line-height:1.6;color:#A8AEBC;margin-top:11px;}
          .vil .list{display:flex;flex-direction:column;gap:11px;margin-top:26px;}
          .vil .c{display:flex;align-items:flex-start;gap:13px;text-decoration:none;color:inherit;
            background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.12);border-radius:17px;padding:14px;}
          .vil .c:active{transform:scale(.995);}
          .vil .im{width:58px;height:58px;flex:none;border-radius:14px;background-size:cover;background-position:center;
            background-image:linear-gradient(150deg,#2C3A2E,#151A15);}
          .vil .b{flex:1;min-width:0;}
          .vil .n{display:block;font-size:15px;font-weight:800;}
          .vil .m{display:block;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:#7FE6C0;font-weight:700;margin-top:2px;}
          .vil .t{display:block;font-size:13.5px;line-height:1.45;color:#D6DAE2;margin-top:6px;}
          .vil .w{display:block;font-size:11px;color:#7B8291;margin-top:6px;}
          .vil .go{flex:none;font-size:20px;color:rgba(255,255,255,.4);font-weight:700;align-self:center;}
          .vil .none{margin-top:26px;border:1px dashed rgba(255,255,255,.2);border-radius:17px;padding:22px 18px;
            font-size:14px;line-height:1.6;color:#A8AEBC;}
          .vil .foot{margin-top:30px;font-size:11.5px;line-height:1.6;color:#6F7684;}
          @media (min-width:760px){.vil{padding:60px 24px 80px;} .vil h1{font-size:44px;}}
          `,
        }}
      />
      <div className="in">
        <div className="k">🤝 Le collectif</div>
        <h1>Aujourd&apos;hui à {affiche}.</h1>
        <p className="sub">
          Ce que les commerçants de {affiche} proposent en ce moment — places qui se libèrent, offres du jour,
          nouveautés. Rien d&apos;autre que ce qu&apos;ils ont annoncé eux-mêmes.
        </p>

        {offers.length === 0 ? (
          <div className="none">
            Aucune annonce en cours à {affiche} pour l&apos;instant. Le collectif se construit commerce par
            commerce&nbsp;: revenez bientôt.
          </div>
        ) : (
          <div className="list">
            {offers.map((o) => (
              <a className="c" key={o.slug} href={`/site-internet/apercu/${o.slug}?via=catalogue`}>
                <span className="im" aria-hidden="true" style={o.photo ? { backgroundImage: `url("${o.photo}")` } : undefined} />
                <span className="b">
                  <span className="n">{o.nom}</span>
                  <span className="m">{o.metier}</span>
                  <span className="t">{o.texte}</span>
                  {ilYA(o.publieLe) && <span className="w">{ilYA(o.publieLe)}</span>}
                </span>
                <span className="go" aria-hidden="true">›</span>
              </a>
            ))}
          </div>
        )}

        <p className="foot">
          Chaque annonce est publiée par le commerce lui-même. Seule l&apos;annonce circule — aucune donnée de
          client n&apos;est partagée, jamais.
        </p>
      </div>
    </main>
  );
}
