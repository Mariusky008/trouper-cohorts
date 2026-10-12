"use client";

// 🏘️ « MES VOISINS SUR CLIKME » — les deux commerces présentés dans sa rue.
//
// Ses clients les voient en touchant « Explorer ma ville » sur sa page : son
// fantôme au milieu, un voisin à gauche, un à droite, le temps à pied et une
// raison d'y aller. Sans choix de sa part, ce sont les deux plus proches.
import { useCallback, useEffect, useState } from "react";

type Proche = { id: string; nom: string; metier: string; aPied?: string };

export function ProVoisins({ slug, token }: { slug: string; token: string }) {
  const [proches, setProches] = useState<Proche[] | null>(null);
  const [choisis, setChoisis] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState(false);

  const appeler = useCallback(
    async (corps: Record<string, unknown>) => {
      const r = await fetch("/api/site-internet/pro/voisins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, ...corps }),
      });
      const j = (await r.json().catch(() => ({}))) as { proches?: Proche[]; choisis?: string[]; error?: string };
      if (!r.ok) throw new Error(j.error || "Enregistrement impossible.");
      return j;
    },
    [slug, token],
  );

  useEffect(() => {
    let vivant = true;
    appeler({ action: "get" })
      .then((j) => {
        if (!vivant) return;
        setProches(j.proches ?? []);
        setChoisis(j.choisis ?? []);
      })
      .catch(() => vivant && setProches([]));
    return () => {
      vivant = false;
    };
  }, [appeler]);

  const basculer = (id: string) => {
    setFait(false);
    setChoisis((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 2 ? [c[1], id] : [...c, id]));
  };

  const enregistrer = async (liste: string[]) => {
    setOccupe(true);
    setErreur("");
    try {
      const j = await appeler({ action: "set", voisins: liste });
      setChoisis(j.choisis ?? []);
      setFait(true);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setOccupe(false);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .voisins .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .voisins .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .voisins ul{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:8px;}
          .pro .voisins li button{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:12px;border:1px solid var(--hair);
            background:#fff;font:inherit;font-size:14px;text-align:left;cursor:pointer;}
          .pro .voisins li button.pris{border-color:#1B1D1A;background:#F6F5F0;}
          .pro .voisins li i{flex:none;display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;border:1.5px solid var(--hair);font-style:normal;font-size:13px;}
          .pro .voisins li button.pris i{background:#1B1D1A;border-color:#1B1D1A;color:#fff;}
          .pro .voisins li span{flex:1;min-width:0;}
          .pro .voisins li b{display:block;font-weight:700;}
          .pro .voisins li small{color:var(--soft);font-size:12px;}
          .pro .voisins .actions{display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap;}
          .pro .voisins .actions button{height:40px;padding:0 16px;border-radius:10px;border:0;background:#1B1D1A;color:#fff;font:inherit;font-weight:700;font-size:14px;cursor:pointer;}
          .pro .voisins .actions button.lien{background:none;color:var(--soft);padding:0;height:auto;font-weight:600;text-decoration:underline;}
          .pro .voisins .ok{font-size:12.5px;color:#2E7D4F;font-weight:600;}
          .pro .voisins .err{margin-top:9px;font-size:12px;color:#B23B3B;}
          .pro .voisins .vide{margin-top:12px;font-size:13px;color:var(--soft);}
          `,
        }}
      />
      <div className="voisins">
        <div className="a-title">🏘️ Mes voisins sur ClikMe</div>
        <div className="a-sub">
          Quand vos clients touchent « Explorer ma ville », votre fantôme leur présente deux voisins : le temps à pied, et une raison d’y aller.
          Sans choix de votre part, ce sont les deux plus proches. Choisissez-en deux si vous préférez ceux que vous appréciez.
        </div>
        {proches === null ? (
          <div className="vide">Chargement…</div>
        ) : proches.length === 0 ? (
          <div className="vide">Aucun autre commerce ClikMe autour de vous pour l’instant. Vos clients verront « Vos voisins arrivent bientôt ».</div>
        ) : (
          <>
            <ul>
              {proches.map((x) => {
                const pris = choisis.includes(x.id);
                return (
                  <li key={x.id}>
                    <button type="button" className={pris ? "pris" : undefined} aria-pressed={pris} onClick={() => basculer(x.id)}>
                      <i aria-hidden="true">{pris ? "✓" : ""}</i>
                      <span>
                        <b>{x.nom}</b>
                        <small>
                          {x.metier}
                          {x.aPied ? ` · ${x.aPied}` : ""}
                        </small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="actions">
              <button type="button" disabled={occupe} onClick={() => void enregistrer(choisis)}>
                {occupe ? "Enregistrement…" : "Enregistrer mes voisins"}
              </button>
              {choisis.length > 0 && (
                <button type="button" className="lien" disabled={occupe} onClick={() => void enregistrer([])}>
                  Revenir aux plus proches
                </button>
              )}
              {fait && <span className="ok">{choisis.length ? "C’est enregistré." : "Ce seront les deux plus proches."}</span>}
            </div>
          </>
        )}
        {erreur && <div className="err">{erreur}</div>}
      </div>
    </>
  );
}
