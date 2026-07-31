// « Aujourd'hui à {ville} » — le catalogue commun des commerçants d'une ville.
//
// Deux étages, et l'ordre compte :
//   1. Les annonces du moment, de la plus fraîche à la plus ancienne. C'est la
//      raison de revenir : ce qui est vrai aujourd'hui et plus demain.
//   2. Les commerces de la ville qui n'ont rien annoncé. C'est la raison de ne
//      pas repartir : même sans annonce, on découvre qui est là.
//
// Sans le second étage, la page restait vide tant que personne n'avait publié —
// et une page vide ne ramène personne. Avec, le catalogue existe dès le premier
// commerce en ligne, et une annonce publiée passe mécaniquement devant.
//
// Honnêteté : la page affiche ce qui existe. Aucune annonce inventée pour
// remplir, et seuls les sites PUBLIÉS y figurent — un commerce simplement
// démarché n'a jamais accepté d'apparaître où que ce soit.
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { cityDirectory, cityList, ilYA, noteCatalogueViews } from "@/lib/site-internet/collectif";
import { VilleSuivre } from "./ville-suivre";
import { VilleBarre } from "./ville-barre";
import type { Fiche } from "./ville-decouverte";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const capWords = (s: string) => s.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_m, p, c) => p + c.toUpperCase());

/** Nom affichable même sans commerce trouvé : le slug d'URL vaut mieux que « cette ville ». */
const afficheVille = (ville: string, slug: string) => capWords(ville || slug.replace(/-/g, " ")) || "cette ville";

export async function generateMetadata({ params }: { params: Promise<{ ville: string }> }): Promise<Metadata> {
  const { ville } = await params;
  const { ville: nom } = await cityDirectory(createAdminClient(), ville);
  const affiche = afficheVille(nom, ville);
  const title = `Aujourd'hui à ${affiche}`;
  const description = `Ce que proposent les commerçants de ${affiche} en ce moment : places qui se libèrent, offres du jour, nouveautés.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    // Manifeste PAR VILLE : l'icône ajoutée à l'écran d'accueil rouvre CETTE ville.
    manifest: `/ville/${ville}/manifest.webmanifest`,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: affiche },
  };
}

export default async function VillePage({ params }: { params: Promise<{ ville: string }> }) {
  const { ville } = await params;
  const supabase = createAdminClient();
  const [{ ville: nomVille, offers, autres }, villes] = await Promise.all([
    cityDirectory(supabase, ville),
    cityList(supabase),
  ]);
  const affiche = afficheVille(nomVille, ville);
  // Une fiche n'est pas une annonce : on ne compte que les annonces, pour que le
  // chiffre montré au commerçant garde exactement le sens qu'on lui donne.
  await noteCatalogueViews(supabase, offers);

  // Le mode découverte parcourt TOUT le monde — annonce ou pas. Les commerces qui
  // ont publié passent devant : ils ont quelque chose à dire aujourd'hui.
  const fiches: Fiche[] = [
    ...offers.map((o) => ({
      slug: o.slug,
      nom: o.nom,
      metier: o.metier,
      photo: o.photo,
      note: o.note ?? null,
      avis: o.avis ?? null,
      texte: o.texte,
      quand: ilYA(o.publieLe),
    })),
    ...autres.map((m) => ({ ...m, texte: "", quand: "" })),
  ];

  return (
    <main className="vil">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Fond du catalogue Privilège : un dégradé, pas un aplat. */
          .vil{min-height:100vh;color:#fff;font-family:var(--fb),system-ui,sans-serif;padding:34px 18px 60px;
            background:linear-gradient(165deg,#0E1318 0%,#0A0C10 55%,#0D1209 100%);}
          .vil *{box-sizing:border-box;}
          .vil .in{max-width:660px;margin:0 auto;}
          .vil .k{font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;font-weight:800;color:#00C896;}
          .vil h1{font-family:var(--fd),Georgia,serif;font-size:34px;font-weight:600;line-height:1.1;margin:9px 0 0;}
          .vil .sub{font-size:14px;line-height:1.6;color:#A8AEBC;margin-top:11px;}
          .vil .sec{margin-top:30px;}
          .vil .sec-k{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:#7B8291;}
          .vil .sec-h{font-family:var(--fd),Georgia,serif;font-size:21px;font-weight:600;margin-top:6px;}
          .vil .sec-p{font-size:12.5px;line-height:1.55;color:#7B8291;margin-top:6px;}
          .vil .list{display:flex;flex-direction:column;gap:11px;margin-top:16px;}
          .vil .c{display:flex;align-items:flex-start;gap:13px;text-decoration:none;color:inherit;
            background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.12);border-radius:17px;padding:14px;}
          .vil .c:active{transform:scale(.995);}
          .vil .im{width:58px;height:58px;flex:none;border-radius:14px;background-size:cover;background-position:center;
            background-image:linear-gradient(150deg,#2C3A2E,#151A15);}
          .vil .b{flex:1;min-width:0;}
          .vil .n{display:block;font-size:15px;font-weight:800;}
          .vil .m{display:block;font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:#00C896;font-weight:700;margin-top:2px;}
          .vil .t{display:block;font-size:13.5px;line-height:1.45;color:#D6DAE2;margin-top:6px;}
          .vil .w{display:block;font-size:11px;color:#7B8291;margin-top:6px;}
          .vil .go{flex:none;font-size:20px;color:rgba(255,255,255,.4);font-weight:700;align-self:center;}
          /* Fiches sans annonce : plus sobres, pour que les annonces gardent la vedette. */
          .vil .grid{display:grid;grid-template-columns:1fr;gap:9px;margin-top:16px;}
          @media (min-width:560px){.vil .grid{grid-template-columns:1fr 1fr;}}
          .vil .f{display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit;
            background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);border-radius:15px;padding:11px;}
          .vil .f:active{transform:scale(.995);}
          .vil .f .im{width:46px;height:46px;border-radius:12px;}
          .vil .f .n{font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .vil .f .m{font-size:10px;}
          .vil .rt{display:block;font-size:11.5px;color:#B9BDB2;margin-top:4px;}
          .vil .rt s{text-decoration:none;color:#F0B429;}
          .vil .none{margin-top:18px;border:1px dashed rgba(255,255,255,.2);border-radius:17px;padding:20px 18px;
            font-size:13.5px;line-height:1.6;color:#A8AEBC;}
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

        {/* ── Étage 1 : les annonces du moment ─────────────────────────────── */}
        <section className="sec">
          <div className="sec-k">Les annonces du moment</div>
          {offers.length === 0 ? (
            <div className="none">
              Aucune annonce en cours à {affiche} pour l&apos;instant. Dès qu&apos;un commerce en publie une, elle
              apparaît ici, en tête.
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
        </section>

        {/* ── Étage 2 : les commerces d'ici, annonce ou pas ─────────────────── */}
        {autres.length > 0 && (
          <section className="sec">
            <div className="sec-k">Les commerces de {affiche}</div>
            <div className="sec-h">
              {autres.length} commerce{autres.length > 1 ? "s" : ""} à découvrir
            </div>
            <div className="sec-p">Ils n&apos;ont rien annoncé aujourd&apos;hui — leur site vous dit tout le reste.</div>
            <div className="grid">
              {autres.map((m) => (
                <a className="f" key={m.slug} href={`/site-internet/apercu/${m.slug}?via=catalogue`}>
                  <span className="im" aria-hidden="true" style={m.photo ? { backgroundImage: `url("${m.photo}")` } : undefined} />
                  <span className="b">
                    <span className="n">{m.nom}</span>
                    <span className="m">{m.metier}</span>
                    {m.note != null && m.avis != null && m.avis > 0 && (
                      <span className="rt">
                        <s>★</s> {m.note.toFixed(1).replace(".", ",")} · {m.avis} avis
                      </span>
                    )}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {fiches.length > 0 && (
          <VilleBarre ville={affiche} villeSlug={ville} villes={villes} fiches={fiches} />
        )}

        {/* L'inscription n'a de sens que si la ville existe : sinon on collecterait
            des adresses pour un catalogue qui ne se remplira jamais. */}
        {nomVille && <VilleSuivre ville={affiche} villeSlug={ville} />}

        <p className="foot">
          Chaque annonce est publiée par le commerce lui-même. Seule l&apos;annonce circule — aucune donnée de
          client n&apos;est partagée, jamais.
        </p>
      </div>
    </main>
  );
}
