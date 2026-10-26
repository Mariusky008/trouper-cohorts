"use client";

// 🧵 MES ÉCUSSONS — dans Ma Maison : son fantôme en grand, ses écussons cousus dessus.
//
// Puis les trois : ceux gagnés en couleur (avec les commerces : ses pins, ses coups de
// cœur), les autres en pointillés, avec la façon de les gagner. Un écusson tout neuf se
// coud sous ses yeux, une fois (ce téléphone retient ceux qu'il a vus). Dans une vraie
// ville, la route (`api/direct/ecussons`) ; dans la démonstration, il n'y a pas de
// commerçant pour noter son passage : tout est en pointillés, et c'est vrai.
// Voir `lib/direct/ecussons.ts`.
import { useEffect, useState, useSyncExternalStore } from "react";
import { abonnerLook, lookDe, monLook } from "@/lib/direct/look";
import { ECUSSONS, ecussonsGagnes, type Ecusson, type MesEcussons as Gagnes } from "@/lib/direct/ecussons";
import { Ecussons, STYLES_ECUSSONS } from "./vitrine-fantomes";

const CLE_VUS = "clikme-ecussons-vus";
function lireVus(): Ecusson[] {
  try {
    return JSON.parse(window.localStorage.getItem(CLE_VUS) || "[]");
  } catch {
    return [];
  }
}

export function MesEcussons({ reelle }: { reelle: boolean }) {
  const look = useSyncExternalStore(abonnerLook, monLook, () => lookDe(null));
  const [gagnes, setGagnes] = useState<Gagnes | null>(() => (reelle ? null : { pins: [], coeurs: [] }));
  const [neufs, setNeufs] = useState<Ecusson[]>([]);

  useEffect(() => {
    if (!reelle) return;
    let fini = false;
    void fetch("/api/direct/ecussons", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: (Gagnes & { ok?: boolean }) | null) => {
        if (fini || !j?.ok) return;
        const g = { pins: j.pins ?? [], coeurs: j.coeurs ?? [] };
        setGagnes(g);
        // CEUX QU'IL N'A JAMAIS VUS se cousent sous ses yeux — une fois.
        const vus = lireVus();
        const nouveaux = ecussonsGagnes(g).filter((e) => !vus.includes(e));
        if (nouveaux.length) {
          setNeufs(nouveaux);
          try {
            window.localStorage.setItem(CLE_VUS, JSON.stringify([...vus, ...nouveaux]));
          } catch {
            /* stockage indisponible : ils se recoudront la prochaine fois */
          }
        }
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [reelle]);

  if (!gagnes) return null;
  const liste = ecussonsGagnes(gagnes);
  const detail = (id: Ecusson) => {
    if (id === "pin" && gagnes.pins.length) return gagnes.pins.map((p) => p.nom).join(" · ");
    if (id === "parole" && gagnes.pins.length) return `Parole tenue ${gagnes.pins.length > 1 ? `chez ${gagnes.pins.length} commerces` : `chez ${gagnes.pins[0].nom}`}`;
    if (id === "coeur" && gagnes.coeurs.length) return `Le coup de cœur de ${gagnes.coeurs.map((c) => c.nom).join(" · ")}`;
    return "";
  };
  return (
    <section className="ec" aria-label="Mes écussons">
      <h2 className="ec-titre">🧵 Mes écussons</h2>
      <div className="ec-haut">
        <span className="ec-fantome">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={look.debout ?? look.image} alt="Ton fantôme" />
          {liste.length > 0 && <Ecussons liste={liste} neufs={neufs} />}
        </span>
        <p>
          {liste.length
            ? "Cousus sur ton fantôme : on les voit dans toutes les vitrines."
            : "Ils se cousent sur ton fantôme, et se voient dans toutes les vitrines. Le premier : tiens une promesse."}
        </p>
      </div>
      <ul className="ec-liste">
        {ECUSSONS.map((e) => {
          const a = liste.includes(e.id);
          return (
            <li key={e.id} className={a ? "on" : ""}>
              <span className="ec-pastille" style={{ "--e": e.couleur } as React.CSSProperties}>
                {e.icone}
              </span>
              <span>
                <b>{e.nom}</b>
                <small>{a ? detail(e.id) : e.gagner}</small>
              </span>
            </li>
          );
        })}
      </ul>
      <style>{STYLES_ECUSSONS + STYLES}</style>
    </section>
  );
}

const STYLES = `
.ec{display:flex;flex-direction:column;gap:10px;margin:16px 16px 0;}
.ec-titre{margin:0 2px;font-size:17px;font-weight:850;letter-spacing:-.01em;color:#fff;}
.ec-haut{display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:20px;background:#1F150F;border:1px solid rgba(255,235,215,.1);}
.ec-fantome{position:relative;flex:none;width:96px;aspect-ratio:.91;}
.ec-fantome img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4));}
.ec-fantome .vf-ecus{width:21%;}
.ec-haut p{margin:0;font-size:13.5px;line-height:1.45;color:#C4B9B3;}
.ec-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;}
.ec-liste li{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:16px;border:1.5px dashed rgba(255,235,215,.18);color:#B3A59D;}
.ec-liste li.on{border-style:solid;border-color:rgba(255,235,215,.14);background:#1F150F;color:#FFF4E6;}
.ec-pastille{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:19px;border:2px dashed rgba(255,235,215,.3);filter:grayscale(1);opacity:.6;}
.ec-liste li.on .ec-pastille{border:2px dashed rgba(255,248,234,.85);background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.38),transparent 58%),var(--e);filter:none;opacity:1;}
.ec-liste span:last-child{display:flex;flex-direction:column;min-width:0;}
.ec-liste b{font-size:14.5px;font-weight:800;}
.ec-liste small{font-size:12.5px;line-height:1.35;}
`;
