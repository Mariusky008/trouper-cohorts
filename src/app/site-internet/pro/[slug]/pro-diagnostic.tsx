"use client";

// « VOS FAÇONS N'APPARAISSENT PAS » — et pourquoi, en clair.
//
// Le commerçant coche ses trois options, elles s'enregistrent, et le fil n'en
// montre aucune. Six causes possibles, indiscernables depuis son écran : une
// colonne absente, une façon non rattachée à son annonce, une ville qui ne
// correspond pas, un statut, une échéance passée, une annonce retirée.
//
// IL NE S'AFFICHE QUE S'IL Y A QUELQUE CHOSE À DIRE. Un panneau de diagnostic
// permanent sur l'accueil d'un commerçant transforme son espace en console
// d'administration. Tant que tout va bien, ce bloc n'existe pas.
import { useEffect, useState } from "react";
// LE TYPE VIENT DE LA LIB, il n'est plus recopié ici. Il l'était — et la copie
// a dérivé : le diagnostic renvoyait déjà un champ que cet écran ne connaissait
// pas, donc n'affichait pas. Un `import type` disparaît à la compilation, il
// n'emporte rien du module dans le paquet du navigateur.
import type { Diagnostic } from "@/lib/direct/diagnostic-facons";

const ICONE: Record<string, string> = { simple: "🕐", cadeau: "🎁", express: "⚡", collectif: "👥" };

export function ProDiagnostic({
  slug,
  token,
  seulementBloquant = false,
}: {
  slug: string;
  token: string;
  /**
   * N'AFFICHER QUE CE QUI EMPÊCHE DE PUBLIER.
   *
   * Ce panneau avait été retiré de l'espace du commerçant, et à raison : il
   * comptait comme « défauts » des façons devenues invisibles parce que leur
   * échéance était passée — c'est-à-dire le système qui fonctionne. Il lui
   * annonçait ça en dix-neuf lignes de journal technique en haut de son accueil.
   *
   * Restent deux cas qui ne sont jamais « le système qui fonctionne » : la base
   * refuse d'écrire ses annonces, ou elle ne connaît pas encore la famille de sa
   * carte du jour. Dans les deux cas il publie, l'écran confirme, et rien
   * n'arrive nulle part. C'est le seul moment où il a besoin de nous lire.
   */
  seulementBloquant?: boolean;
}) {
  const [d, setD] = useState<Diagnostic | null>(null);
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    let vivant = true;
    fetch("/api/site-internet/pro/clik", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, action: "diagnostic" }),
    })
      .then(async (r) => (r.ok ? ((await r.json().catch(() => ({}))) as Record<string, unknown>) : null))
      .then((j) => {
        if (vivant && j?.diagnostic) setD(j.diagnostic as Diagnostic);
      })
      .catch(() => {
        /* indisponible : le bloc n'apparaît pas */
      });
    return () => {
      vivant = false;
    };
  }, [slug, token]);

  if (!d) return null;
  const bloquees = d.facons.filter((f) => !f.visible);
  const annoncesKo = (d.annonces ?? []).filter((a) => !a.visible);
  const annoncesOk = (d.annonces ?? []).filter((a) => a.visible).length;
  const colonnesManquantes = Object.entries(d.colonnes).filter(([, ok]) => !ok).map(([c]) => c);
  // LE TEST D'ÉCRITURE PASSE DEVANT TOUT LE RESTE.
  //
  // Quand la base refuse d'enregistrer, il n'y a RIEN à diagnostiquer d'autre :
  // ni annonce invisible, ni façon bloquée, puisque rien n'a jamais été écrit.
  // C'est exactement le cas qui laissait un restaurateur devant « Aucune annonce
  // en ce moment » après avoir publié deux fois — et l'ancien bloc, qui ne
  // parlait que de lignes existantes, se cachait au lieu de le dire.
  const ecriture = d.ecriture ?? { ok: true, cause: "", absentes: [], menuAccepte: true };
  const ecritureKo = !ecriture.ok;
  // Tout va bien : le bloc n'existe pas.
  if (seulementBloquant && !ecritureKo && ecriture.menuAccepte) return null;
  if (!ecritureKo && ecriture.menuAccepte && !bloquees.length && !colonnesManquantes.length && !annoncesKo.length) {
    return null;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .pdiag{margin-top:16px;border:1px solid #F3CDBF;background:#FDF3EF;border-radius:18px;padding:15px 16px;}
          .pro .pdiag .k{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#8A3D26;font-weight:800;}
          .pro .pdiag .t{font-family:var(--fd),Georgia,serif;font-size:16px;font-weight:700;margin-top:6px;line-height:1.3;}
          .pro .pdiag .s{font-size:12.5px;color:var(--soft);line-height:1.5;margin-top:6px;}
          .pro .pdiag .l{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
          .pro .pdiag .e{background:#fff;border:1px solid #F3CDBF;border-radius:12px;padding:11px 12px;}
          .pro .pdiag .e .h{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:800;}
          .pro .pdiag .e .c{font-size:12.5px;color:#8A3D26;margin-top:5px;line-height:1.45;}
          .pro .pdiag .e .d{font-size:11.5px;color:var(--faint);margin-top:5px;line-height:1.45;}
          .pro .pdiag .plus{margin-top:10px;width:100%;border:none;background:none;color:#8A3D26;
            font-size:12.5px;font-weight:800;cursor:pointer;font-family:inherit;padding:4px;}
          .pro .pdiag code{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;background:#F7EDE8;
            border-radius:5px;padding:1px 5px;}
          `,
        }}
      />
      <div className="pdiag">
        <div className="k">À vérifier</div>
        <div className="t">
          {ecritureKo
            ? "Vos annonces ne peuvent pas être enregistrées"
            : !ecriture.menuAccepte
              ? "Votre carte du jour n'arrive pas dans « Déjeuner »"
              : colonnesManquantes.length
            ? "Votre base n'est pas tout à fait à jour"
            : bloquees.length
              ? `${bloquees.length} de vos façons ne s'affiche${bloquees.length > 1 ? "nt" : ""} pas dans Le Direct`
              : `${annoncesKo.length} de vos annonces ne ${annoncesKo.length > 1 ? "sont" : "est"} plus en ligne`}
        </div>
        <div className="s">{d.resume}</div>

        {/* LA RAISON, TELLE QUE LA BASE LA DONNE. Recopiable : c'est elle
            qu'on colle dans un message pour être aidé, et la reformuler en
            « une erreur est survenue » ferait perdre la seule information
            utile. */}
        {ecritureKo && (
          <div className="l">
            <div className="e">
              <div className="h">🗄 La base refuse l&apos;écriture</div>
              <div className="c">{ecriture.cause}</div>
              <div className="d">
                Vos annonces s&apos;affichent sur votre site, mais elles n&apos;entrent ni dans «&nbsp;Mes annonces
                en cours&nbsp;», ni dans le fil de votre ville. Rien n&apos;est perdu de votre côté : c&apos;est une
                migration de base de données à appliquer.
                {ecriture.absentes.length > 0 && (
                  <>
                    {" "}Colonnes absentes&nbsp;: {ecriture.absentes.map((c: string) => (<code key={c}>{c}</code>))}.
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {!ecritureKo && !ecriture.menuAccepte && (
          <div className="l">
            <div className="e">
              <div className="h">🍽 La famille «&nbsp;menu&nbsp;» n&apos;existe pas encore</div>
              <div className="c">Votre carte du jour est publiée, mais rangée dans «&nbsp;Offres&nbsp;».</div>
              <div className="d">
                Elle apparaît bien dans le fil de votre ville et sur votre site — seul l&apos;onglet
                «&nbsp;Déjeuner&nbsp;» lui échappe. La migration{" "}
                <code>20260812120000_famille_menu</code> le corrige.
              </div>
            </div>
          </div>
        )}

        {!seulementBloquant && colonnesManquantes.length > 0 && (
          <div className="l">
            <div className="e">
              <div className="h">🗄 Colonnes absentes</div>
              <div className="c">
                {colonnesManquantes.map((c) => (
                  <code key={c}>{c}</code>
                ))}
              </div>
              <div className="d">
                Les migrations <code>20260815120000_trois_facons</code>, <code>20260815130000_detail_annonce</code> et{" "}
                <code>20260815140000_histoire_du_jour</code> ajoutent ces colonnes. Vos façons continuent de
                fonctionner sans elles, mais vous perdez leur ordre d&apos;affichage et leur nom personnalisé.
              </div>
            </div>
          </div>
        )}

        {/* SES ANNONCES. « Aucune annonce en ce moment » avec une annonce
            publiée le matin même : trois causes possibles — retirée, échéance
            passée, ou plus de trois jours sans date de fin — et aucune n'était
            visible depuis son écran. */}
        {!seulementBloquant && annoncesKo.length > 0 && (
          <div className="l">
            {annoncesKo.slice(0, 4).map((a) => (
              <div className="e" key={a.id}>
                <div className="h">📣 {a.texte}</div>
                <div className="c">{a.cause}</div>
                <div className="d">
                  Elle ne figure donc ni dans «&nbsp;Mes annonces en cours&nbsp;», ni dans le fil de votre ville.
                  {annoncesOk > 0
                    ? ` ${annoncesOk} de vos annonces ${annoncesOk > 1 ? "sont" : "est"} en ligne.`
                    : " Republiez-la pour qu'elle reparte."}
                </div>
              </div>
            ))}
          </div>
        )}

        {!seulementBloquant && bloquees.length > 0 && (
          <>
            <div className="l">
              {(ouvert ? bloquees : bloquees.slice(0, 3)).map((f) => (
                <div className="e" key={f.campagneId}>
                  <div className="h">
                    <span aria-hidden="true">{ICONE[f.type] ?? "•"}</span>
                    {f.titre || f.type}
                  </div>
                  <div className="c">{f.cause}</div>
                  <div className="d">{f.detail}</div>
                </div>
              ))}
            </div>
            {bloquees.length > 3 && (
              <button type="button" className="plus" onClick={() => setOuvert((v) => !v)}>
                {ouvert ? "Masquer" : `Voir les ${bloquees.length}`}
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
