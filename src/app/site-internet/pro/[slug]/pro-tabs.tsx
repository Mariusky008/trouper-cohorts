"use client";

// Coquille à onglets de l'Espace Pro : une barre de menus fixe en bas, chaque
// besoin sur un onglet (accès direct, plus de long scroll). Tous les onglets
// restent montés (leurs données sont prêtes quand on bascule) ; on n'affiche que
// l'actif. La barre est profil-aware : elle ne montre que les onglets fournis.
import { useState, type ReactNode } from "react";

export type ProTab = { key: string; label: string; icon: string; node: ReactNode };

export function ProTabs({ tabs }: { tabs: ProTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key || "");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .protabs{padding-bottom:8px;}
          /* Onglet seul : on neutralise les marges/bordures hautes prévues pour l'empilement. */
          .pro .protab > .action,
          .pro .protab > .contacts,
          .pro .protab > .relance,
          .pro .protab > .agenda{margin-top:0;border-top:none;padding-top:0;}
          .pro .protabbar{position:fixed;left:0;right:0;bottom:0;max-width:440px;margin:0 auto;z-index:40;
            display:flex;background:rgba(255,255,255,.97);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
            border-top:1px solid var(--hair);padding-bottom:env(safe-area-inset-bottom);}
          .pro .protabbar button{flex:1;min-width:0;background:none;border:none;cursor:pointer;font-family:inherit;
            padding:9px 1px 9px;display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--faint);
            border-top:2px solid transparent;margin-top:-1px;}
          .pro .protabbar button .ic{font-size:18px;line-height:1;}
          .pro .protabbar button .lb{font-size:9.5px;font-weight:600;letter-spacing:.005em;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .pro .protabbar button.on{color:var(--ink);border-top-color:var(--gold);}

          /* ══════════ ORDINATEUR : la barre du bas devient un menu latéral ══════════ */
          @media (min-width:900px){
            .pro .protabbar{
              top:0;bottom:auto;left:0;right:auto;width:232px;height:100vh;max-width:none;margin:0;
              flex-direction:column;justify-content:flex-start;align-items:stretch;gap:4px;
              padding:26px 14px;border-top:none;border-right:1px solid var(--hair);
              background:var(--paper);
            }
            .pro .protabbar button{
              flex:none;flex-direction:row;justify-content:flex-start;gap:12px;
              padding:12px 14px;border-top:none;border-left:3px solid transparent;margin-top:0;
              border-radius:11px;
            }
            .pro .protabbar button .ic{font-size:18px;}
            .pro .protabbar button .lb{font-size:13.5px;max-width:none;font-weight:600;}
            .pro .protabbar button:hover{background:#F5F2EA;}
            .pro .protabbar button.on{border-top-color:transparent;border-left-color:var(--gold);background:#F5F2EA;}
          }
          `,
        }}
      />
      <div className="protabs">
        {tabs.map((t) => (
          <div key={t.key} className="protab" hidden={active !== t.key}>
            {t.node}
          </div>
        ))}
      </div>
      <nav className="protabbar" aria-label="Menu">
        {tabs.map((t) => (
          <button key={t.key} type="button" className={active === t.key ? "on" : ""} onClick={() => setActive(t.key)} aria-current={active === t.key}>
            <span className="ic">{t.icon}</span>
            <span className="lb">{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
