// 📄 UNE FACTURE D'ÉCHANGE, TELLE QU'ON L'IMPRIME — la page `/facture/<jeton>` et l'exemple de la
// démonstration. Tout vient de ce que la facture a recopié le jour où elle a été faite
// (`ContenuFacture`, `lib/echanges/factures.ts`) : rien n'est relu ailleurs.
//
// LES MENTIONS D'UNE FACTURE ENTRE PROFESSIONNELS EN FRANCE : numéro et dates, vendeur (nom, forme,
// adresse, SIRET, capital et immatriculation d'une société, TVA intracommunautaire), acheteur, la
// ligne en HT avec son taux, les totaux, la nature de l'opération, le paiement et ses conditions.
// Un vendeur en franchise : « TVA non applicable, art. 293 B du CGI ».
import {
  MENTION_FRANCHISE,
  dateFr,
  estSociete,
  euros,
  siretLisible,
  tauxLisible,
  type FactureComplete,
} from "@/lib/echanges/factures";

const NATURE: Record<string, string> = { biens: "Livraison de biens", services: "Prestation de services", mixte: "Livraison de biens et prestation de services" };

export function FactureVue({ facture, exemple = false }: { facture: FactureComplete; exemple?: boolean }) {
  const { vendeur: v, acheteur: a, ligne: l, bon } = facture.contenu;
  const livree = dateFr(facture.livree);
  return (
    <article className={`fx${exemple ? " exemple" : ""}`} aria-label={`Facture ${facture.numero}`}>
      {exemple && <p className="fx-exemple">Exemple</p>}
      <header className="fx-tete">
        <div>
          <h1>Facture</h1>
          <p className="fx-num">N° {facture.numero}</p>
        </div>
        <dl className="fx-dates">
          <div>
            <dt>Émise le</dt>
            <dd>{dateFr(facture.emise)}</dd>
          </div>
          <div>
            <dt>Livrée le</dt>
            <dd>{livree}</dd>
          </div>
        </dl>
      </header>

      <section className="fx-parties">
        <div>
          <h2>Vendeur</h2>
          <p>
            <b>
              {v.nom}
              {/^ei$/i.test(v.forme) ? " EI" : ""}
            </b>
            {v.enseigne && <span className="fx-gris"> — {v.enseigne}</span>}
          </p>
          {estSociete(v.forme) && (
            <p className="fx-gris">
              {v.forme}
              {v.capital ? ` au capital de ${v.capital}` : ""}
            </p>
          )}
          <p>{v.adresse}</p>
          <p className="fx-gris">SIRET {siretLisible(v.siret)}</p>
          {v.immatriculation && <p className="fx-gris">{v.immatriculation}</p>}
          {v.tvaIntra && <p className="fx-gris">TVA intracommunautaire {v.tvaIntra}</p>}
        </div>
        <div>
          <h2>Facturé à</h2>
          <p>
            <b>{a.nom}</b>
            {a.enseigne && <span className="fx-gris"> — {a.enseigne}</span>}
          </p>
          <p>{a.adresse}</p>
          {a.siret && <p className="fx-gris">SIRET {siretLisible(a.siret)}</p>}
          {a.tvaIntra && <p className="fx-gris">TVA intracommunautaire {a.tvaIntra}</p>}
        </div>
      </section>

      <table className="fx-table">
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Qté</th>
            <th>PU HT</th>
            <th>TVA</th>
            <th>Total HT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <b>{l.designation}</b>
              {l.detail && <small>{l.detail}</small>}
              <small>Bon {bon.code}</small>
            </td>
            <td>1</td>
            <td>{euros(l.ht)}</td>
            <td>{tauxLisible(l.taux)}</td>
            <td>{euros(l.ht)}</td>
          </tr>
        </tbody>
      </table>

      <dl className="fx-totaux">
        <div>
          <dt>Total HT</dt>
          <dd>{euros(l.ht)}</dd>
        </div>
        {v.franchise ? (
          <div>
            <dt>TVA</dt>
            <dd>{euros(0)}</dd>
          </div>
        ) : (
          <div>
            <dt>TVA {tauxLisible(l.taux)}</dt>
            <dd>{euros(l.tva)}</dd>
          </div>
        )}
        <div className="fx-ttc">
          <dt>Total TTC</dt>
          <dd>{euros(l.ttc)}</dd>
        </div>
      </dl>
      {v.franchise && <p className="fx-mention">{MENTION_FRANCHISE}</p>}

      <section className="fx-pied">
        <p>
          <b>Nature de l’opération :</b> {NATURE[l.nature] ?? NATURE.biens}.
        </p>
        <p>
          <b>Paiement :</b> facture acquittée le {livree}, réglée par échange de produits au sein du réseau ClikMe (bon {bon.code}). Aucun règlement en euros.
        </p>
        <p className="fx-petit">
          Pas d’escompte. En cas de retard de paiement : pénalités au taux de trois fois le taux d’intérêt légal, et indemnité forfaitaire de 40 € pour frais de
          recouvrement (art. L441-10 du Code de commerce).
        </p>
        <p className="fx-petit">
          Facture préparée par ClikMe au nom et pour le compte de {v.nom}, à partir du bon {bon.code} validé le {livree}.
        </p>
      </section>
    </article>
  );
}

export function StylesFacture() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.fx{position:relative;width:100%;max-width:760px;margin:0 auto;background:#fff;color:#1a1714;border-radius:14px;padding:28px 24px;
  font-family:var(--font-geist-sans),system-ui,sans-serif;font-size:13.5px;line-height:1.45;box-shadow:0 18px 50px rgba(0,0,0,.35);}
.fx p{margin:0;}
.fx-exemple{position:absolute;top:14px;right:14px;padding:4px 10px;border-radius:999px;background:#FDE7C8;color:#8A4B00;font-size:11px;font-weight:800;
  letter-spacing:.08em;text-transform:uppercase;}
.fx-tete{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:12px;padding-bottom:16px;border-bottom:2px solid #1a1714;}
.fx-tete h1{margin:0;font-size:26px;font-weight:900;letter-spacing:-.02em;text-transform:uppercase;}
.fx-num{font-weight:800;font-size:15px;}
.fx-dates{display:flex;gap:18px;margin:0;}
.fx-dates div{display:flex;flex-direction:column;}
.fx-dates dt{font-size:11px;color:#6b625a;text-transform:uppercase;letter-spacing:.06em;}
.fx-dates dd{margin:0;font-weight:700;}
.fx-parties{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;padding:18px 0;}
.fx h1,.fx h2{font-family:inherit;}
.fx-parties h2{margin:0 0 4px;font-size:11px;font-weight:600;line-height:1.3;color:#6b625a;text-transform:uppercase;letter-spacing:.08em;}
.fx-parties div{display:flex;flex-direction:column;gap:2px;overflow-wrap:anywhere;}
.fx-gris{color:#6b625a;}
.fx-table{width:100%;border-collapse:collapse;margin-top:4px;}
.fx-table th{font-size:11px;color:#6b625a;text-transform:uppercase;letter-spacing:.04em;text-align:right;font-weight:700;padding:8px 4px;border-bottom:1px solid #d9d2ca;}
.fx-table th:first-child,.fx-table td:first-child{text-align:left;}
.fx-table td{text-align:right;vertical-align:top;padding:10px 4px;border-bottom:1px solid #eee7df;white-space:nowrap;}
.fx-table td:first-child{white-space:normal;}
.fx-table td small{display:block;color:#6b625a;font-size:12px;}
.fx-totaux{margin:14px 0 0 auto;max-width:280px;display:flex;flex-direction:column;gap:4px;}
.fx-totaux div{display:flex;justify-content:space-between;gap:16px;}
.fx-totaux dt{color:#4a433d;}
.fx-totaux dd{margin:0;font-weight:700;}
.fx-totaux .fx-ttc{margin-top:4px;padding-top:8px;border-top:2px solid #1a1714;font-size:16px;}
.fx-totaux .fx-ttc dt{color:#1a1714;font-weight:800;}
.fx-mention{margin-top:8px !important;text-align:right;font-weight:700;font-size:12.5px;}
.fx-pied{margin-top:22px;padding-top:14px;border-top:1px solid #d9d2ca;display:flex;flex-direction:column;gap:6px;}
.fx-petit{font-size:11.5px;color:#6b625a;}
@media (max-width:420px){
  .fx{padding:22px 14px;font-size:12.5px;}
  .fx-table th,.fx-table td{padding-left:2px;padding-right:2px;}
  .fx-table th:nth-child(2),.fx-table td:nth-child(2),.fx-table th:nth-child(3),.fx-table td:nth-child(3){display:none;}
}
@media print{
  .fx{box-shadow:none;border-radius:0;max-width:none;padding:0;}
  .fx-exemple{border:1px solid #8A4B00;}
}
`,
      }}
    />
  );
}
