"use client";

// Regroupe plusieurs outils sous un même onglet, avec une navigation par
// pastilles en haut → on passe de 8 icônes en bas à 4 onglets clairs. Chaque
// groupe écoute `pro-goto-tab` : le briefing de l'assistante peut ouvrir
// directement un sous-outil précis via une clé « groupe:sous » (ex. clients:annonce).
import { useEffect, useState, type ReactNode } from "react";

export type Sub = { key: string; label: string; node: ReactNode };

export function ProGroup({ groupKey, subs }: { groupKey: string; subs: Sub[] }) {
  const [sub, setSub] = useState(subs[0]?.key || "");

  useEffect(() => {
    const go = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail !== "string") return;
      const [g, s] = detail.split(":");
      if (g === groupKey && s && subs.some((x) => x.key === s)) setSub(s);
    };
    window.addEventListener("pro-goto-tab", go as EventListener);
    return () => window.removeEventListener("pro-goto-tab", go as EventListener);
  }, [groupKey, subs]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .progroup .subpills{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;margin:2px -20px 4px;padding:0 20px 2px;}
          .pro .progroup .subpills::-webkit-scrollbar{display:none;}
          .pro .progroup .subpills button{flex:none;border:1px solid var(--hair);background:#fff;color:var(--soft);border-radius:20px;padding:8px 14px;font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;white-space:nowrap;}
          .pro .progroup .subpills button.on{background:var(--ink);color:#fff;border-color:var(--ink);}
          /* Neutralise les marges/bordures hautes prévues pour l'empilement seul. */
          .pro .progroup .sub > .action,
          .pro .progroup .sub > .contacts,
          .pro .progroup .sub > .relance,
          .pro .progroup .sub > .agenda{margin-top:6px;border-top:none;padding-top:0;}
          `,
        }}
      />
      <div className="progroup">
        <div className="subpills">
          {subs.map((x) => (
            <button key={x.key} type="button" className={sub === x.key ? "on" : ""} onClick={() => setSub(x.key)}>
              {x.label}
            </button>
          ))}
        </div>
        {subs.map((x) => (
          <div className="sub" key={x.key} hidden={sub !== x.key}>
            {x.node}
          </div>
        ))}
      </div>
    </>
  );
}
