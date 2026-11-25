"use client";

/**
 * 🗂️ MA COLLECTION — le lot 5 de « Ma figurine » (`docs/univers/ma-figurine.md`, section 7).
 *
 * Toutes ses figurines du mois, alignées comme des cartes, avec les mois encore vides : l'année en douze cases, de
 * janvier à décembre (et les années d'avant, s'il y a des cartes). Chaque case dit la vérité :
 *   · « prete » : sa carte (son image, le thème du mois) ; on la touche, elle s'ouvre en grand avec sa phrase du mois
 *     et « 🎭 Fais-la parler » ;
 *   · le mois en cours, pas encore là : ses vrais jours (« 4/10 jours »), ou « ✨ en route » quand elle se fabrique ;
 *   · un mois passé sans figurine : vide (rien d'inventé) ;
 *   · un mois à venir : son thème (« 🎄 Noël »), qui l'attend.
 * Aucune donnée nouvelle : tout vient de `useMois()` (ses figurines du mois, et celle de ce mois-ci).
 */
import { useEffect, useState } from "react";
import {
  editionDuMois,
  moisEnClair,
  type FigurineDuMois,
  type MesFigurinesDuMois,
} from "@/lib/direct/figurine-du-mois";
import { versLeStudio } from "./vers-le-studio";

export const PHRASES_ALBUM = {
  titre: "🗂️ Ma collection",
  compte: (n: number, annee: string) =>
    n === 0
      ? `Pas encore de carte en ${annee}`
      : `${n} figurine${n > 1 ? "s" : ""} sur 12 en ${annee}`,
  vide: "Vide",
  aVenir: "À venir",
  enRoute: "✨ En route",
  jours: (j: number, o: number) => `${Math.min(j, o)}/${o} jours`,
  parler: "🎭 Fais-la parler",
  fermer: "Fermer",
  phrase: "🔮 SA PHRASE DU MOIS",
} as const;

const MOIS_COURTS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

type Case =
  | { mois: string; etat: "prete"; f: FigurineDuMois }
  | { mois: string; etat: "en-cours"; f: FigurineDuMois }
  | { mois: string; etat: "vide" | "a-venir" };

/** Les années de l'album, la plus récente d'abord : l'année en cours, et celles d'avant qui ont une carte. */
export function casesDeLAlbum(
  m: MesFigurinesDuMois,
): { annee: string; cases: Case[]; pretes: number }[] {
  const ici = m.courante.mois;
  const pretes = new Map<string, FigurineDuMois>();
  for (const f of [m.courante, ...m.passees])
    if (f.etat === "prete" && f.image) pretes.set(f.mois, f);
  const annees = new Set([
    ici.slice(0, 4),
    ...[...pretes.keys()].map((x) => x.slice(0, 4)),
  ]);
  return [...annees]
    .sort((a, b) => b.localeCompare(a))
    .map((annee) => {
      const cases: Case[] = Array.from({ length: 12 }, (_, k) => {
        const mois = `${annee}-${String(k + 1).padStart(2, "0")}`;
        const f = pretes.get(mois);
        if (f) return { mois, etat: "prete", f };
        if (mois === ici) return { mois, etat: "en-cours", f: m.courante };
        return { mois, etat: mois < ici ? "vide" : "a-venir" };
      });
      return {
        annee,
        cases,
        pretes: cases.filter((c) => c.etat === "prete").length,
      };
    });
}

/** Ce qu'une case sans carte dit : « Vide », son thème à venir, ses vrais jours, ou « en route ». */
function texteDeLaCase(c: Case): string {
  if (c.etat === "vide") return PHRASES_ALBUM.vide;
  if (c.etat === "a-venir") return editionDuMois(c.mois).nom;
  if (c.etat === "en-cours")
    return c.f.etat === "a-fabriquer"
      ? PHRASES_ALBUM.enRoute
      : PHRASES_ALBUM.jours(c.f.jours, c.f.objectif);
  return "";
}

/** La carte en grand : son image, son thème, son visage, sa phrase, et « Fais-la parler ». */
function CarteEnGrand({
  f,
  onFermer,
}: {
  f: FigurineDuMois;
  onFermer: () => void;
}) {
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);
  return (
    <div
      className="alb-voile"
      role="dialog"
      aria-modal="true"
      aria-label={`Ta figurine de ${moisEnClair(f.mois)}`}
      data-album-carte={f.mois}
      onClick={onFermer}
    >
      <div className="alb-grand" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={f.image} alt={`Ta figurine de ${moisEnClair(f.mois)}`} />
        <span className="alb-grand-bas">
          <small>
            {f.edition.emoji} {f.edition.nom} · {moisEnClair(f.mois)}
          </small>
          {f.expression && <b>Son visage du mois : {f.expression}</b>}
        </span>
        {f.phrase && (
          <p className="alb-phrase">
            <small>{PHRASES_ALBUM.phrase}</small>« {f.phrase} »
          </p>
        )}
        <div className="alb-boutons">
          <button
            type="button"
            className="og-go"
            data-album-parler
            onClick={() => versLeStudio({ look: f.mois })}
          >
            {PHRASES_ALBUM.parler}
          </button>
          <button
            type="button"
            className="alb-fermer"
            data-album-fermer
            onClick={onFermer}
          >
            {PHRASES_ALBUM.fermer}
          </button>
        </div>
      </div>
    </div>
  );
}

/** L'album : les douze mois de chaque année, en cartes. */
export function AlbumDuMois({ m }: { m: MesFigurinesDuMois }) {
  const [ouverte, setOuverte] = useState<FigurineDuMois | null>(null);
  const annees = casesDeLAlbum(m);
  return (
    <section className="alb" data-album aria-label="Ma collection">
      <h3>{PHRASES_ALBUM.titre}</h3>
      {annees.map(({ annee, cases, pretes }) => (
        <div key={annee} className="alb-annee" data-album-annee={annee}>
          <p className="alb-compte" data-album-compte={pretes}>
            {PHRASES_ALBUM.compte(pretes, annee)}
          </p>
          <ol className="alb-grille">
            {cases.map((c) => {
              const e =
                c.etat === "prete" || c.etat === "en-cours"
                  ? c.f.edition
                  : editionDuMois(c.mois);
              const nom = MOIS_COURTS[Number(c.mois.slice(5, 7)) - 1];
              return (
                <li
                  key={c.mois}
                  className={`alb-case ${c.etat}`}
                  data-album-mois={c.mois}
                  data-album-etat={c.etat}
                >
                  {c.etat === "prete" ? (
                    <button
                      type="button"
                      className="alb-carte"
                      onClick={() => setOuverte(c.f)}
                      aria-label={`Ta figurine de ${moisEnClair(c.mois)}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.f.image} alt="" loading="lazy" />
                      <span className="alb-nom">
                        {e.emoji} {nom}
                      </span>
                    </button>
                  ) : (
                    <span
                      className="alb-carte"
                      aria-label={`${moisEnClair(c.mois)} : ${c.etat === "vide" ? PHRASES_ALBUM.vide : c.etat === "a-venir" ? `${PHRASES_ALBUM.aVenir}, ${e.nom}` : e.nom}`}
                    >
                      <i aria-hidden="true">{e.emoji}</i>
                      <em>{texteDeLaCase(c)}</em>
                      <span className="alb-nom">{nom}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
      {ouverte && (
        <CarteEnGrand f={ouverte} onFermer={() => setOuverte(null)} />
      )}
    </section>
  );
}

export const STYLES_ALBUM = `
.alb{display:flex;flex-direction:column;gap:10px;margin-top:4px}
.alb h3{margin:0;font-size:17px;font-weight:900;color:#FFF4E6}
.alb-annee{display:flex;flex-direction:column;gap:8px}
.alb-compte{margin:0;font-size:13px;font-weight:800;color:#F2C46B}
.alb-grille{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.alb-case{min-width:0}
.alb-carte{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:100%;aspect-ratio:2/3;padding:0;border-radius:12px;overflow:hidden;font:inherit;color:inherit;text-align:center}
.alb-case.prete .alb-carte{border:1.5px solid rgba(242,196,107,.7);background:#1E0918;cursor:pointer;box-shadow:0 10px 18px -12px rgba(242,196,107,.8)}
.alb-case.prete img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.alb-case.prete .alb-nom{position:absolute;left:0;right:0;bottom:0;padding:10px 2px 4px;background:linear-gradient(transparent,rgba(20,4,14,.9));font-size:11px;font-weight:900;color:#FFF4E6}
.alb-case.vide .alb-carte,.alb-case.a-venir .alb-carte,.alb-case.en-cours .alb-carte{border:1.5px dashed rgba(255,255,255,.22);background:rgba(255,255,255,.04)}
.alb-case.en-cours .alb-carte{border:1.5px solid rgba(255,46,154,.7);background:rgba(255,46,154,.1)}
.alb-carte i{font-style:normal;font-size:22px;line-height:1}
.alb-case.vide .alb-carte i{opacity:.3;filter:grayscale(1)}
.alb-case.a-venir .alb-carte i{opacity:.6}
.alb-carte em{font-style:normal;font-size:10.5px;font-weight:800;line-height:1.2;padding:0 3px;color:#D9C3CB;overflow-wrap:anywhere}
.alb-case.en-cours .alb-carte em{color:#FF9FD2}
.alb-case:not(.prete) .alb-nom{font-size:11px;font-weight:900;color:#FFF4E6;opacity:.85}
.alb-voile{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,2,8,.78)}
.alb-grand{display:flex;flex-direction:column;gap:10px;width:100%;max-width:340px;max-height:100%;overflow:auto;padding:12px;border-radius:24px;background:#24091C;border:2px solid rgba(242,196,107,.65)}
.alb-grand img{display:block;width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:16px}
.alb-grand-bas{display:flex;flex-direction:column;gap:2px}
.alb-grand-bas small{font-size:12px;font-weight:800;color:#F2C46B}
.alb-grand-bas b{font-size:13.5px;color:#FFF4E6}
.alb-phrase{margin:0;padding:12px 14px;border-radius:16px;background:rgba(142,197,255,.1);border:1px solid rgba(142,197,255,.4);font-size:15px;line-height:1.45;font-weight:700;color:#FFF4E6}
.alb-phrase small{display:block;margin-bottom:4px;font-size:10.5px;font-weight:900;letter-spacing:.12em;color:#A8C8F0}
.alb-boutons{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.alb-fermer{min-height:44px;padding:0 18px;border-radius:999px;border:1.5px solid rgba(255,255,255,.3);background:transparent;color:#FFF4E6;font:inherit;font-weight:800}
`;
