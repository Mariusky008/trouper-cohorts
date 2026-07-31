"use client";

// Espace Pro — participation au Collectif.
//
// On dit la vérité sur l'état du réseau : combien de commerces sont réellement
// en ligne dans sa ville aujourd'hui. Zéro, c'est zéro — et on l'écrit. Un
// commerçant qui découvre plus tard que le réseau était vide ne nous croira plus
// sur le reste.
import { useEffect, useState } from "react";

export function ProCollectif({ slug, token }: { slug: string; token: string }) {
  const [actif, setActif] = useState(true);
  const [voisins, setVoisins] = useState(0);
  const [ville, setVille] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/site-internet/pro/collectif", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, ...body }),
    });
    return (await r.json().catch(() => ({}))) as Record<string, unknown>;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await call({ action: "get" });
        if (cancelled) return;
        if (typeof j.actif === "boolean") setActif(j.actif);
        if (typeof j.voisins === "number") setVoisins(j.voisins);
        if (typeof j.ville === "string") setVille(j.ville);
      } catch {
        /* best-effort */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, token]);

  const toggle = async () => {
    if (busy) return;
    const next = !actif;
    setBusy(true);
    setActif(next);
    const j = await call({ action: "set", actif: next });
    setBusy(false);
    if (typeof j.error === "string") setActif(!next); // échec → on revient en arrière
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .pcol .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .pcol .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .pcol .box{margin-top:15px;border:1px solid var(--hair);border-radius:14px;background:#fff;padding:14px;
            display:flex;align-items:center;gap:12px;}
          .pro .pcol .box .bb{flex:1;min-width:0;}
          .pro .pcol .box .bb b{display:block;font-size:14px;font-weight:800;}
          .pro .pcol .box .bb span{display:block;font-size:12px;color:var(--soft);margin-top:3px;line-height:1.4;}
          .pro .pcol .sw{flex:none;width:52px;height:30px;border-radius:999px;border:none;cursor:pointer;position:relative;
            background:#D8D4CA;transition:background .2s ease;}
          .pro .pcol .sw.on{background:#1B7A3E;}
          .pro .pcol .sw i{position:absolute;top:3px;left:3px;width:24px;height:24px;border-radius:50%;background:#fff;
            transition:left .2s cubic-bezier(.22,1,.36,1);box-shadow:0 2px 6px rgba(0,0,0,.25);}
          .pro .pcol .sw.on i{left:25px;}
          .pro .pcol .sw:disabled{opacity:.6;cursor:wait;}
          .pro .pcol .state{margin-top:12px;font-size:12.5px;line-height:1.5;border-radius:11px;padding:11px 12px;}
          .pro .pcol .state.vide{color:#8A6A12;background:#FFF7E9;border:1px solid #F6E4BD;}
          .pro .pcol .state.plein{color:#1B7A3E;background:#F1F8F3;border:1px solid #D6EBDD;}
          .pro .pcol .note{margin-top:11px;font-size:11.5px;color:var(--faint);line-height:1.5;}
          `,
        }}
      />
      <div className="pcol">
        <div className="a-title">🤝 Le collectif</div>
        <div className="a-sub">
          Vos annonces entrent dans le <b>catalogue de votre ville</b>, et votre site en montre une fenêtre.
          Dans cette fenêtre&nbsp;: jamais un concurrent, seulement des métiers complémentaires.
        </div>

        <div className="box">
          <span className="bb">
            <b>{actif ? "Vous participez" : "Vous ne participez pas"}</b>
            <span>
              {actif
                ? "Vos annonces entrent dans le catalogue, et vous en affichez une fenêtre."
                : "Vos annonces n'entrent pas dans le catalogue, et votre site n'en montre pas."}
            </span>
          </span>
          <button
            type="button"
            className={`sw${actif ? " on" : ""}`}
            onClick={toggle}
            disabled={busy}
            aria-pressed={actif}
            aria-label="Participer au collectif"
          >
            <i />
          </button>
        </div>

        {loaded && (
          <div className={`state ${voisins > 0 ? "plein" : "vide"}`}>
            {voisins > 0
              ? `${voisins} autre${voisins > 1 ? "s" : ""} commerce${voisins > 1 ? "s sont" : " est"} déjà en ligne${ville ? ` à ${ville}` : ""}. Leur site montre le catalogue, donc votre annonce peut y apparaître dès aujourd'hui.`
              : `Aucun autre commerce n'est encore en ligne${ville ? ` à ${ville}` : ""}. Le catalogue existe déjà et votre annonce y entre — vous y êtes seul·e pour l'instant.`}
          </div>
        )}

        <div className="note">
          Seules vos annonces circulent. Aucune donnée de vos client·es n&apos;est partagée, jamais.
        </div>
      </div>
    </>
  );
}
