// 🗂️ L'INDEX DES DÉMONSTRATIONS — /site-internet/apercu/demo
//
// POURQUOI UNE PAGE POUR ÇA. Les treize adresses ne servent qu'à une chose :
// être ouvertes L'UNE APRÈS L'AUTRE, parce qu'un gabarit ne se juge pas sur son
// meilleur cas. Sans index, il faut retenir treize adresses — donc on en essaie
// deux, toujours les mêmes, et les onze autres ne sont jamais regardées.
//
// ELLE SERT AUSSI DE FILET. Une adresse en `demo-` qui n'existe pas tombe ici
// plutôt que sur « lien introuvable » : la page dit lesquelles existent, ce qui
// répond à la question qu'on se posait en tapant l'adresse.
import Link from "next/link";

export function IndexDesDemos({
  entrees,
  inconnue,
}: {
  entrees: Array<{ slug: string; titre: string; nom: string; metier: string }>;
  /** L'adresse demandée quand elle n'existe pas. Vide pour l'index lui-même. */
  inconnue?: string;
}) {
  const orpheline = inconnue && inconnue !== "demo" ? inconnue : "";
  return (
    <main className="idm">
      <Styles />
      <div className="idm-c">
        <div className="idm-k">ClikMe · démonstrations</div>
        <h1 className="idm-t">La page d’un commerçant, métier par métier</h1>
        <p className="idm-p">
          Chaque adresse montre la même page sur un commerce différent. Elles ne lisent aucune
          base : ce sont les commerces du paquet de démonstration, et aucun n’existe.
        </p>
        {orpheline && (
          <p className="idm-w">
            <b>{orpheline}</b> n’existe pas. Voici celles qui existent.
          </p>
        )}
        <ul className="idm-l">
          {entrees.map((e) => (
            <li key={e.slug}>
              <Link href={`/site-internet/apercu/${e.slug}`} prefetch={false}>
                <span className="idm-n">{e.titre}</span>
                <span className="idm-d">
                  {e.nom} · {e.metier}
                </span>
                <span className="idm-a" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.idm{ min-height:100svh; background:rgb(5,9,12); color:#F6F2EC;
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
  padding:40px 16px calc(40px + env(safe-area-inset-bottom)); }
.idm-c{ max-width:560px; margin:0 auto; }
.idm-k{ font-size:11px; letter-spacing:.14em; text-transform:uppercase;
  color:rgba(255,255,255,.44); font-weight:700; }
.idm-t{ margin:10px 0 0; font-size:27px; line-height:1.18; font-weight:800; letter-spacing:-.01em; }
.idm-p{ margin:12px 0 0; font-size:14px; line-height:1.55; color:rgba(246,242,236,.68); }
.idm-w{ margin:16px 0 0; padding:12px 14px; border-radius:14px; font-size:13px;
  background:rgba(255,170,90,.12); border:1px solid rgba(255,170,90,.28); color:#FFD9B0; }
.idm-l{ list-style:none; margin:24px 0 0; padding:0; display:grid; gap:10px; }
.idm-l a{ display:grid; grid-template-columns:1fr auto; align-items:center; gap:4px 12px;
  padding:14px 16px; border-radius:16px; text-decoration:none; color:inherit;
  background:rgba(255,255,255,.055); border:1px solid rgba(255,255,255,.10); }
.idm-n{ grid-column:1; font-size:15px; font-weight:700; }
.idm-d{ grid-column:1; font-size:12.5px; color:rgba(246,242,236,.56); }
.idm-a{ grid-column:2; grid-row:1 / span 2; font-size:18px; color:rgba(246,242,236,.44); }
`,
      }}
    />
  );
}
