// MES CLICS — ce que j'ai réellement pris, et le code pour le présenter.
//
// L'onglet du bas s'appelait « Mes commerces » et n'affichait que des annonces
// gardées, rendues comme des cartes du fil : on avait l'impression de relire le
// fil dans un autre onglet. Ce qui manquait était l'essentiel — ce qu'on a
// RÉSERVÉ, et le code à montrer en arrivant, qui n'existait que sur l'écran où
// l'on venait de le décrocher.
//
// LE QR EST GÉNÉRÉ AU SERVEUR, en data URI. Une image distante serait un
// aller-retour de plus au moment précis où l'on est devant le comptoir, souvent
// avec un réseau qui ne passe pas. Le code EN CLAIR reste écrit dessous : c'est
// lui qui compte, le QR n'est qu'un raccourci pour le commerçant qui préfère
// scanner.
//
// Composant SERVEUR : il ne fait que rendre ce qu'on lui donne.
import Link from "next/link";
import type { MonClic } from "@/lib/direct/engagements";

const ICONE: Record<string, string> = { simple: "🕐", cadeau: "🎁", express: "⚡", collectif: "👥" };

const STATUT: Record<string, string> = {
  engage: "C'est à vous",
  confirme: "Confirmé",
  liste_attente: "En liste d'attente",
};

export function MesClics({
  clics,
  qr,
  ville,
}: {
  clics: MonClic[];
  /** Le QR de chaque code, déjà encodé en data URI par le serveur. */
  qr: Map<string, string>;
  ville: string;
}) {
  if (!clics.length) {
    return (
      <div className="vide">
        <h3>Aucun Clic pour l&apos;instant</h3>
        <p>
          Sur le fil, choisissez une façon d&apos;en profiter — le cadeau, l&apos;express ou le groupe.
          Votre code apparaîtra ici, avec l&apos;adresse et l&apos;horaire.
        </p>
        <Link href={`/ville/${ville}`} className="vide-b">Voir ce qui se passe →</Link>
      </div>
    );
  }

  return (
    <div className="feed">
      {clics.map((c) => (
        <div className="clic" key={`${c.campagneId}-${c.code}`}>
          <div className="clic-h">
            <span className="clic-ic" aria-hidden="true">{ICONE[c.type] ?? "🕐"}</span>
            <div className="clic-t">
              <div className="clic-ou">{c.commerce || "Un commerce"}</div>
              <div className="clic-q">
                {c.facon}
                {c.titre ? ` · ${c.titre}` : ""}
              </div>
            </div>
            <span className={`clic-st${c.statut === "liste_attente" ? " att" : ""}`}>{STATUT[c.statut] ?? c.statut}</span>
          </div>

          {c.gain && <div className="clic-g">🎁 {c.gain}</div>}

          {/* LE CODE, EN GRAND ET AVEC SON QR. C'est la seule chose qu'on
              cherche en poussant la porte du commerce — pas un historique. */}
          <div className="clic-code">
            {qr.get(c.code) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr.get(c.code)} alt="" width={92} height={92} />
            ) : null}
            <div>
              <div className="clic-k">Votre code</div>
              <div className="clic-v">{c.code}</div>
              <div className="clic-s">À montrer au commerce. Le QR fait la même chose, en plus rapide.</div>
            </div>
          </div>

          <div className="clic-r">
            <Link href={`/ville/${ville}/clik/${c.campagneId}`} prefetch={false}>Voir le détail ›</Link>
            {c.slug && (
              <a href={`/site-internet/apercu/${c.slug}?via=direct`} target="_blank" rel="noreferrer noopener">
                La boutique ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
