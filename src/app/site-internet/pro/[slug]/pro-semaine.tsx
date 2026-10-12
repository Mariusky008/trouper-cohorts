// 🧾 « VOTRE SEMAINE EN CLIENTS » — en tête de son espace, ce que ClikMe lui a amené.
//
// Les sept derniers jours, en personnes et en gestes : des essais, des mises de
// côté demandées puis confirmées, des amis venus voir, des clients envoyés par
// ses voisins. Les mêmes phrases que le SMS du lundi (`semaine-en-clients.ts`).
import type { CleMetier } from "@/lib/direct/apercu-habitant";
import type { SemaineEnClients } from "@/lib/site-internet/compteurs-jour";
import { lignesDeLaSemaine } from "@/lib/site-internet/semaine-en-clients";

export function ProSemaine({ semaine, branche }: { semaine: SemaineEnClients; branche?: CleMetier }) {
  const lignes = lignesDeLaSemaine(semaine, branche);
  return (
    <section className="semaine" aria-label="Votre semaine en clients">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .semaine{margin:16px 0 0;padding:16px 16px 14px;border-radius:16px;background:#fff;border:1px solid var(--hair);}
          .pro .semaine h2{margin:0;font-family:var(--fd),Georgia,serif;font-weight:700;font-size:20px;}
          .pro .semaine .sous{margin:3px 0 0;font-size:13px;color:var(--soft);}
          .pro .semaine ul{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:10px;}
          .pro .semaine li{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;line-height:1.4;}
          .pro .semaine li i{flex:none;font-style:normal;font-size:18px;line-height:1.2;}
          .pro .semaine li span{flex:1;min-width:0;}
          .pro .semaine li em{flex:none;font-style:normal;font-size:12px;font-weight:700;color:#2E7D4F;background:#E8F4EC;border-radius:999px;padding:2px 8px;}
          .pro .semaine .vide{margin:12px 0 0;font-size:13.5px;color:var(--soft);line-height:1.45;}
          `,
        }}
      />
      <h2>Votre semaine en clients</h2>
      <p className="sous">Les 7 derniers jours, grâce à votre page ClikMe.</p>
      {!semaine.mesure ? (
        <p className="vide">Vos chiffres en clients apparaîtront ici dès que leur comptage sera activé.</p>
      ) : lignes.length === 0 ? (
        <p className="vide">Rien encore cette semaine. Partagez votre page : chaque client qui essaie, réserve ou demande l’avis de ses amis s’affichera ici.</p>
      ) : (
        <ul>
          {lignes.map((l) => (
            <li key={l.cle}>
              <i aria-hidden="true">{l.emoji}</i>
              <span>{l.texte}</span>
              {l.hausse ? <em title="Par rapport à la semaine d’avant">+{l.hausse}</em> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
