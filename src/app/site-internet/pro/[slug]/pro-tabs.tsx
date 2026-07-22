"use client";

// Coquille à onglets de l'Espace Pro : une barre de menus fixe en bas, chaque
// besoin sur un onglet (accès direct, plus de long scroll). Tous les onglets
// restent montés (leurs données sont prêtes quand on bascule) ; on n'affiche que
// l'actif. La barre est profil-aware : elle ne montre que les onglets fournis.
import { useEffect, useState, type ReactNode } from "react";

export type ProTab = { key: string; label: string; icon: string; node: ReactNode };

export function ProTabs({ tabs }: { tabs: ProTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key || "");

  // Le « briefing » (et tout autre bloc) peut demander de basculer d'onglet via
  // un évènement global — découplé, sans remonter d'état.
  useEffect(() => {
    const go = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail !== "string") return;
      const key = detail.split(":")[0]; // « groupe:sous » → on ne garde que le groupe
      if (tabs.some((t) => t.key === key)) {
        setActive(key);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("pro-goto-tab", go as EventListener);
    return () => window.removeEventListener("pro-goto-tab", go as EventListener);
  }, [tabs]);

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
          .pro .protabbar{position:fixed;left:0;right:0;bottom:0;max-width:460px;margin:0 auto;z-index:40;
            display:flex;background:rgba(255,255,255,.94);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);
            border-top:1px solid var(--hair);box-shadow:0 -10px 30px -20px rgba(25,26,44,.35);padding-bottom:env(safe-area-inset-bottom);}
          .pro .protabbar button{flex:1;min-width:0;background:none;border:none;cursor:pointer;font-family:inherit;
            padding:8px 1px 7px;display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--faint);}
          .pro .protabbar button .ic{font-size:17px;line-height:1;width:44px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:13px;transition:background .15s ease;}
          .pro .protabbar button .lb{font-size:9.5px;font-weight:700;letter-spacing:.005em;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .pro .protabbar button.on{color:var(--violet);}
          .pro .protabbar button.on .ic{background:rgba(109,74,224,.13);}

          /* ══════════ ORDINATEUR : la barre du bas devient un menu latéral ══════════ */
          @media (min-width:900px){
            .pro .protabbar{
              top:0;bottom:auto;left:0;right:auto;width:236px;height:100vh;max-width:none;margin:0;
              flex-direction:column;justify-content:flex-start;align-items:stretch;gap:4px;
              padding:26px 14px;border-top:none;border-right:1px solid var(--hair);box-shadow:none;
              background:rgba(255,255,255,.72);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
            }
            .pro .protabbar button{
              flex:none;flex-direction:row;justify-content:flex-start;gap:11px;
              padding:11px 13px;border-radius:13px;
            }
            .pro .protabbar button .ic{width:26px;height:26px;font-size:18px;border-radius:0;background:none;}
            .pro .protabbar button .lb{font-size:13.5px;max-width:none;font-weight:700;}
            .pro .protabbar button:hover{background:#F1EFFB;}
            .pro .protabbar button.on{background:rgba(109,74,224,.10);}
            .pro .protabbar button.on .ic{background:none;}
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
