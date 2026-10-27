"use client";

// 👻 MES FAMILLES — dans Ma Maison : chaque commerce où il a libéré son fantôme.
//
// Pour chacun : son écusson de la famille (la couleur de son palier, cousue à son numéro), « Fantôme
// n°12 · 🥈 Argent », ce qui le fera monter, et sa page (`/f/<lien>`), pour y revenir ouvrir la cage
// du jour. Seulement dans une vraie ville (`api/direct/famille?moi=1`) : dans la démonstration, il
// n'est de la famille de personne, et on ne lui en invente pas. Voir `lib/direct/famille.ts`.
import { useEffect, useState } from "react";
import { cheminEnMots, EMOJI_GRADE, NOM_GRADE, prochainPalier, type MaFamille } from "@/lib/direct/famille";

export function MesFamilles({ reelle }: { reelle: boolean }) {
  const [familles, setFamilles] = useState<MaFamille[] | null>(null);

  useEffect(() => {
    if (!reelle) return;
    let fini = false;
    void fetch("/api/direct/famille?moi=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { ok?: boolean; familles?: MaFamille[] } | null) => {
        if (!fini && j?.ok) setFamilles(j.familles ?? []);
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [reelle]);

  if (!familles?.length) return null;
  return (
    <section className="mf" aria-label="Mes familles">
      <h2 className="mf-titre">👻 Mes familles</h2>
      <ul className="mf-liste">
        {familles.map((f) => {
          const suivant = prochainPalier(f.parcours);
          return (
            <li key={f.slug}>
              <a href={`/f/${encodeURIComponent(f.slug)}`}>
                <span className={`mf-palier ${f.grade}`} aria-hidden="true">
                  <b>{f.numero}</b>
                </span>
                <span className="mf-texte">
                  <b>{f.nom}</b>
                  <small>
                    Fantôme n°{f.numero} · {EMOJI_GRADE[f.grade]} {NOM_GRADE[f.grade]} · {f.membres} {f.membres > 1 ? "fantômes" : "fantôme"}
                  </small>
                  <em>
                    {suivant
                      ? `${NOM_GRADE[suivant.grade]} ${EMOJI_GRADE[suivant.grade]} : ${cheminEnMots(suivant.chemins, f.nom)
                          .replace(/\.$/, "")
                          .replace(/^./, (x) => x.toLowerCase())}`
                      : "Tu as ses bons plans en premier."}
                  </em>
                </span>
                <s aria-hidden="true">›</s>
              </a>
            </li>
          );
        })}
      </ul>
      <style>{STYLES}</style>
    </section>
  );
}

const STYLES = `
.mf{display:flex;flex-direction:column;gap:10px;margin:16px 16px 0;}
.mf-titre{margin:0 2px;font-size:17px;font-weight:850;letter-spacing:-.01em;color:#fff;}
.mf-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;}
.mf-liste a{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:16px;background:#1F150F;border:1px solid rgba(255,235,215,.14);color:#FFF4E6;text-decoration:none;}
.mf-palier{position:relative;flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;transform:rotate(-8deg);
  background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.45),transparent 58%),var(--e);box-shadow:0 1px 2px rgba(0,0,0,.5);}
.mf-palier::before{content:"";position:absolute;inset:4px;border-radius:50%;border:2px dashed rgba(255,248,234,.85);}
.mf-palier b{font-size:15px;font-weight:800;color:#3A1D08;}
.mf-palier.bronze{--e:#C98A4B;}.mf-palier.argent{--e:#BFC5CF;}.mf-palier.or{--e:#E2B04A;}
.mf-texte{display:flex;flex-direction:column;min-width:0;flex:1;}
.mf-texte b{font-size:14.5px;font-weight:800;}
.mf-texte small{font-size:12.5px;line-height:1.35;color:#C4B9B3;}
.mf-texte em{font-style:normal;font-size:12px;line-height:1.35;color:#E8C77A;}
.mf-liste s{text-decoration:none;font-size:20px;color:#8A7D76;}
`;
