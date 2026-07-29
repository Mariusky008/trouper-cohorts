// Le Collectif — la version RÉELLE, sur un site en ligne.
//
// Ne s'affiche que s'il y a de vraies annonces de vrais commerces partenaires de
// la même ville. Zéro partenaire = zéro section : on ne laisse pas un cadre vide
// promettre un réseau. Rien n'est cliquable vers un annuaire : chaque carte mène
// au site du commerce partenaire, et à rien d'autre.
import type { PartnerOffer } from "@/lib/site-internet/collectif";

export function CollectifLive({ ville, offers, accent }: { ville: string; offers: PartnerOffer[]; accent: string }) {
  if (!offers.length) return null;

  return (
    <section className="clive" id="mq-collectif" style={{ ["--cv" as string]: accent }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .mqc .clive{margin:14px;border-radius:24px;padding:26px 18px 28px;background:#12140F;color:#fff;overflow:hidden;}
          .mqc .clive .cv-k{font-size:10px;letter-spacing:.22em;text-transform:uppercase;font-weight:700;
            color:color-mix(in srgb,var(--cv) 34%,#fff);}
          .mqc .clive .cv-h{font-family:Georgia,serif;font-size:24px;font-weight:600;line-height:1.15;margin-top:8px;}
          .mqc .clive .cv-p{font-size:13px;line-height:1.55;color:#B9BDB2;margin-top:9px;}
          .mqc .clive .cv-list{display:flex;flex-direction:column;gap:10px;margin-top:18px;}
          .mqc .clive .cv-c{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;
            background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:12px;}
          .mqc .clive .cv-c:active{transform:scale(.995);}
          .mqc .clive .cv-im{width:52px;height:52px;flex:none;border-radius:13px;background-size:cover;background-position:center;
            background-image:linear-gradient(150deg,#2C3A2E,#151A15);}
          .mqc .clive .cv-b{min-width:0;flex:1;}
          .mqc .clive .cv-n{display:block;font-size:14px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
          .mqc .clive .cv-m{display:block;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;
            color:color-mix(in srgb,var(--cv) 34%,#fff);font-weight:700;margin-top:2px;}
          .mqc .clive .cv-o{display:block;font-size:12.5px;line-height:1.4;color:#D6DAD1;margin-top:5px;}
          .mqc .clive .cv-go{flex:none;font-size:19px;color:rgba(255,255,255,.45);font-weight:700;}
          .mqc .clive .cv-note{font-size:11px;line-height:1.5;color:#8B9086;margin-top:15px;}
          @media (min-width:860px){.mqc .clive{margin:22px 20px;padding:44px 24px;} .mqc .clive .cv-h{font-size:30px;}
            .mqc .clive .cv-list{display:grid;grid-template-columns:1fr 1fr;}}
          `,
        }}
      />
      <div className="cv-k">🤝 Le collectif de {ville}</div>
      <div className="cv-h">À découvrir près de chez vous.</div>
      <div className="cv-p">
        Des commerces de {ville} que nous connaissons, et ce qu&apos;ils proposent en ce moment.
      </div>

      <div className="cv-list">
        {offers.map((o) => (
          <a className="cv-c" key={o.slug} href={`/site-internet/apercu/${o.slug}`}>
            <span
              className="cv-im"
              aria-hidden="true"
              style={o.photo ? { backgroundImage: `url("${o.photo}")` } : undefined}
            />
            <span className="cv-b">
              <span className="cv-n">{o.nom}</span>
              <span className="cv-m">{o.metier}</span>
              <span className="cv-o">{o.texte}</span>
            </span>
            <span className="cv-go" aria-hidden="true">›</span>
          </a>
        ))}
      </div>

      <div className="cv-note">
        Que des commerces complémentaires, jamais un concurrent. Seules leurs annonces sont partagées —
        aucune donnée vous concernant ne circule.
      </div>
    </section>
  );
}
