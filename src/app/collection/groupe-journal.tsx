"use client";

/**
 * 📖 LE JOURNAL DU GROUPE (Mes groupes, le lot G7, 26 novembre 2026 ; `lib/direct/groupes-journal-serveur.ts`, la
 * maquette G0 validée, planche « Groupe ») : notre histoire, du plus récent à la naissance du groupe, sur une ligne de
 * temps. Seulement ce qui s'est vraiment passé.
 */
import { useEffect, useState } from "react";
import { vignetteYouTube } from "@/lib/direct/tele";
import { jourDuJournal, type EntreeJournal } from "@/lib/direct/groupes";

export function OngletJournal({ gid }: { gid: string }) {
  const [journal, setJournal] = useState<EntreeJournal[] | null>(null);
  const [maintenant] = useState(() => Date.now());
  useEffect(() => {
    let fini = false;
    void fetch(`/api/direct/mes-groupes?groupe=${encodeURIComponent(gid)}&journal=1`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { journal?: EntreeJournal[] }) => !fini && j.journal && setJournal(j.journal))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [gid]);
  if (!journal) return null;
  const jours = journal.map((x) => jourDuJournal(x.le, maintenant));
  return (
    <div className="gjo" data-onglet-journal>
      {journal.map((x, k) => {
        const jour = jours[k];
        const nouveau = k === 0 || jour !== jours[k - 1];
        return (
          <div key={x.id} className="gjo-jour" data-journal={x.id}>
            <i className={`gjo-point${x.ne ? " ne" : ""}`} aria-hidden="true" />
            {nouveau && <p className="gjo-quand">{jour}</p>}
            <div className="gjo-carte">
              {x.video ? (
                <span className="gjo-vignette" style={{ backgroundImage: `url(${vignetteYouTube(x.video)})` }} aria-hidden="true" />
              ) : x.qui?.length === 1 && x.qui[0].src ? (
                <span className="gjo-tete">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.qui[0].src} alt={x.qui[0].prenom} draggable={false} />
                </span>
              ) : (
                <span className="gjo-e" aria-hidden="true">
                  {x.e}
                </span>
              )}
              <div className="gjo-texte">
                <p className="gjo-titre">
                  {x.video || (x.qui?.length === 1 && x.qui[0].src) ? `${x.e} ` : ""}
                  {x.titre}
                </p>
                {x.sous && <p className="gjo-sous">{x.sous}</p>}
                {x.qui && x.qui.length > 1 && (
                  <span className="gjo-pile">
                    {x.qui.map((p) => (
                      <span key={p.q} className="gjo-tete petit" title={p.prenom}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.src ? <img src={p.src} alt={p.prenom} draggable={false} /> : <span aria-hidden="true">🙂</span>}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const STYLES_JOURNAL = `
.gjo{display:flex;flex-direction:column;gap:14px;padding:0 16px}
.gjo-jour{position:relative;padding-left:26px}
.gjo-jour::before{content:"";position:absolute;left:8px;top:6px;bottom:-14px;width:2px;background:rgba(255,196,140,.18)}
.gjo-jour:last-child::before{display:none}
.gjo-point{position:absolute;left:1px;top:2px;width:16px;height:16px;border-radius:50%;background:#f5a23a;box-shadow:0 0 0 3px #120c09}
.gjo-point.ne{background:#ff2e9a}
.gjo-quand{margin:0 0 6px;color:#cdb8a4;font-size:13px;font-weight:700}
.gjo-carte{display:flex;align-items:center;gap:10px;padding:12px;border-radius:18px;background:#1f1612;box-shadow:0 0 0 1px rgba(255,196,140,.12)}
.gjo-vignette{flex:none;width:92px;height:58px;border-radius:12px;background:#2a1d18 center/cover no-repeat}
.gjo-e{flex:none;font-size:28px;line-height:1}
.gjo-tete{flex:none;display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;overflow:hidden;background:#3a2430}
.gjo-tete img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.gjo-tete.petit{width:30px;height:30px;margin-left:-8px;box-shadow:0 0 0 2px #1f1612}
.gjo-tete.petit:first-child{margin-left:0}
.gjo-texte{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.gjo-titre{margin:0;font-size:15px;font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.gjo-sous{margin:0;color:#cdb8a4;font-size:13px;overflow-wrap:anywhere}
.gjo-pile{display:flex;margin-top:4px}
`;
