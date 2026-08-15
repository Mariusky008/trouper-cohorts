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

type Verdict = { campagneId: string; type: string; titre: string; visible: boolean; cause: string; detail: string };
type Diagnostic = {
  colonnes: { ordre: boolean; nom_facon: boolean; reste: boolean; ardoise: boolean };
  typesAcceptes: { simple: boolean; express: boolean };
  villeDuFil: string;
  facons: Verdict[];
  resume: string;
};

const ICONE: Record<string, string> = { simple: "🕐", cadeau: "🎁", express: "⚡", collectif: "👥" };

export function ProDiagnostic({ slug, token }: { slug: string; token: string }) {
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
  const colonnesManquantes = Object.entries(d.colonnes).filter(([, ok]) => !ok).map(([c]) => c);
  // Tout va bien : le bloc n'existe pas.
  if (!bloquees.length && !colonnesManquantes.length) return null;

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
          {colonnesManquantes.length
            ? "Votre base n'est pas tout à fait à jour"
            : `${bloquees.length} de vos façons ne s'affiche${bloquees.length > 1 ? "nt" : ""} pas dans Le Direct`}
        </div>
        <div className="s">{d.resume}</div>

        {colonnesManquantes.length > 0 && (
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

        {bloquees.length > 0 && (
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
