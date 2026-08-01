// « En ce moment à {ville} » — le catalogue de la ville, posé sur le site d'un
// commerçant.
//
// LE POINT DÉLICAT, ET C'EST TOUT L'ENJEU DU BLOC : ces annonces ne sont PAS
// celles du commerce qui héberge la page. Si le visiteur les prend pour les
// siennes, on lui fait attribuer à quelqu'un une offre qui n'est pas la sienne —
// et le commerçant se retrouve à « annoncer » ce qu'il n'a jamais dit. D'où :
//   • le bandeau reprend l'identité du catalogue (marque + « Aujourd'hui à … »),
//     pas celle du site hôte : on voit qu'on regarde ailleurs ;
//   • chaque carte porte le nom et le métier de SON commerce, jamais l'annonce
//     seule ;
//   • une ligne le dit en toutes lettres, avec le nom de l'hôte.
//
// Le bloc reste un APERÇU (3 annonces) : un fil sans fin sur le site d'un tiers
// est une porte de sortie. Le catalogue entier vit sur sa propre page.
//
// Il s'affiche même sans annonce voisine — sinon /ville n'a aucune porte
// d'entrée tant qu'un deuxième commerce n'a pas publié. Dans ce cas il ne montre
// aucune carte et ne promet rien.
import { ilYA, type PartnerOffer } from "@/lib/site-internet/collectif";
import { echeanceCourte } from "@/lib/site-internet/echeance";
import { MARQUE } from "@/lib/marque";
import { slugify } from "@/lib/popey-marketplace";

export function CollectifLive({
  ville,
  nom,
  offers,
  accent,
}: {
  ville: string;
  /** Le commerce qui héberge la page — nommé pour lever toute ambiguïté. */
  nom: string;
  offers: PartnerOffer[];
  accent: string;
}) {
  const apercu = offers.slice(0, 3);
  const villeSlug = slugify(ville);
  const villeUrl = `/ville/${villeSlug}`;
  // Sans ville, pas de page de destination : on n'affiche pas un lien mort.
  if (!villeSlug) return null;

  return (
    <section className="clive" id="mq-collectif" style={{ ["--cv" as string]: accent }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* La maille du catalogue (cf. /ville) : fond très sombre, menthe, cartes
             pleine photo. C'est ce qui fait reconnaître l'endroit d'un coup d'œil. */
          .mqc .clive{margin:14px;border-radius:24px;padding:0;overflow:hidden;color:#fff;
            background:radial-gradient(120% 70% at 50% 0%,#141A20 0%,#0B0D12 60%,#08090D 100%);
            box-shadow:0 26px 54px -24px rgba(0,0,0,.8);}
          /* Bandeau : l'identité du CATALOGUE, pas celle du site hôte. */
          .mqc .clive .cv-bar{display:flex;align-items:center;gap:10px;padding:16px 16px 12px;
            border-bottom:1px solid rgba(255,255,255,.07);}
          .mqc .clive .cv-logo{font-family:Georgia,serif;font-size:17px;font-weight:800;line-height:1;
            letter-spacing:-.01em;}
          .mqc .clive .cv-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#00E0A0;
            margin-left:4px;vertical-align:middle;}
          .mqc .clive .cv-city{margin-left:auto;font-size:11px;font-weight:700;color:#C9CFDA;border-radius:999px;
            padding:6px 11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);}
          .mqc .clive .cv-in{padding:18px 16px 20px;}
          .mqc .clive .cv-h{font-family:Georgia,serif;font-size:24px;font-weight:600;line-height:1.15;}
          .mqc .clive .cv-p{font-size:13px;line-height:1.55;color:#98A0AE;margin-top:9px;}
          /* La mention qui empêche la confusion. Discrète mais jamais absente. */
          .mqc .clive .cv-src{display:flex;gap:8px;align-items:flex-start;margin-top:13px;padding:10px 12px;
            border-radius:11px;background:rgba(0,224,160,.07);border:1px solid rgba(0,224,160,.18);
            font-size:11.5px;line-height:1.5;color:#9FD9C4;}
          .mqc .clive .cv-src b{color:#D6F5E9;font-weight:700;}
          .mqc .clive .cv-list{display:flex;flex-direction:column;gap:11px;margin-top:16px;}
          /* Carte pleine photo, comme dans le catalogue — pas une ligne d'annuaire. */
          .mqc .clive .cv-c{position:relative;display:block;height:132px;border-radius:17px;overflow:hidden;
            text-decoration:none;color:inherit;background:linear-gradient(150deg,#2C3A5E,#141A2E);}
          .mqc .clive .cv-c:active{transform:scale(.995);}
          .mqc .clive .cv-im{position:absolute;inset:0;background-size:cover;background-position:center;}
          .mqc .clive .cv-veil{position:absolute;inset:0;
            background:linear-gradient(180deg,rgba(8,9,13,.05) 0%,rgba(8,9,13,.72) 58%,rgba(8,9,13,.95) 100%);}
          .mqc .clive .cv-top{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:6px;align-items:center;}
          .mqc .clive .cv-m{font-size:9.5px;letter-spacing:.09em;text-transform:uppercase;font-weight:800;
            color:#06231A;background:#00E0A0;border-radius:6px;padding:4px 8px;}
          .mqc .clive .cv-cd{margin-left:auto;font-size:9.5px;font-weight:800;color:#3A2A00;background:#FFC400;
            border-radius:6px;padding:4px 8px;}
          .mqc .clive .cv-b{position:absolute;left:12px;right:12px;bottom:11px;}
          .mqc .clive .cv-n{display:block;font-family:Georgia,serif;font-size:16px;font-weight:700;line-height:1.15;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .mqc .clive .cv-o{display:block;font-size:12.5px;line-height:1.4;color:#DDE3EC;margin-top:4px;
            display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
          .mqc .clive .cv-w{display:block;font-size:10px;color:#8B93A6;margin-top:4px;}
          .mqc .clive .cv-all{display:block;margin-top:15px;text-align:center;text-decoration:none;
            font-size:13.5px;font-weight:800;color:#06231A;border-radius:14px;padding:14px;
            background:linear-gradient(90deg,#00E0A0,#07B083);}
          .mqc .clive .cv-note{font-size:11px;line-height:1.5;color:#767E8C;margin-top:13px;}
          @media (min-width:860px){
            .mqc .clive{margin:22px 20px;}
            .mqc .clive .cv-in{padding:30px 24px 26px;}
            .mqc .clive .cv-h{font-size:30px;}
            .mqc .clive .cv-list{display:grid;grid-template-columns:1fr 1fr;}
          }
          `,
        }}
      />

      <div className="cv-bar">
        <span className="cv-logo">
          {MARQUE}
          <span className="cv-dot" aria-hidden="true" />
        </span>
        <span className="cv-city">📍 {ville}</span>
      </div>

      <div className="cv-in">
        <div className="cv-h">En ce moment à {ville}.</div>
        <div className="cv-p">
          {apercu.length
            ? `Le catalogue de la ville : ce que des commerçants de ${ville} annoncent aujourd'hui.`
            : `Le catalogue rassemble les annonces du jour des commerçants de ${ville}. Il se construit commerce par commerce.`}
        </div>

        {apercu.length > 0 && (
          <div className="cv-src">
            <span aria-hidden="true">ⓘ</span>
            <span>
              Ces annonces sont publiées par <b>d&apos;autres commerces de {ville}</b>, pas par {nom}.
            </span>
          </div>
        )}

        {apercu.length > 0 && (
          <div className="cv-list">
            {apercu.map((o) => {
              const fin = echeanceCourte(o.jusqua);
              const depuis = ilYA(o.publieLe);
              return (
                <a className="cv-c" key={o.slug} href={`/site-internet/apercu/${o.slug}?via=catalogue`}>
                  {o.photo && <span className="cv-im" aria-hidden="true" style={{ backgroundImage: `url("${o.photo}")` }} />}
                  <span className="cv-veil" aria-hidden="true" />
                  <span className="cv-top">
                    <span className="cv-m">{o.metier}</span>
                    {/* L'échéance suit l'annonce partout : sans elle, une offre
                        « jusqu'à 18 h » se lisait ici comme sans fin. */}
                    {fin && <span className="cv-cd">⏳ {fin}</span>}
                  </span>
                  <span className="cv-b">
                    <span className="cv-n">{o.nom}</span>
                    <span className="cv-o">{o.texte}</span>
                    {depuis && <span className="cv-w">{depuis}</span>}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        <a className="cv-all" href={villeUrl}>
          {apercu.length ? `Ouvrir le catalogue de ${ville} →` : `Voir le catalogue de ${ville} →`}
        </a>

        <div className="cv-note">
          Que des commerces complémentaires, jamais un concurrent. Seules leurs annonces sont partagées —
          aucune donnée vous concernant ne circule.
        </div>
      </div>
    </section>
  );
}
