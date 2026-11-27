"use client";

/**
 * 🙂 LA PAGE SOUS SON PRÉNOM (`#personnage`, `#moi`) — refaite le 26 novembre 2026 (le propriétaire : « la plupart des
 * choses n'ont plus rien à voir avec notre concept » ; la maquette validée le même jour,
 * https://claude.ai/artifact/YZMMFvuTP8CYSzDhR9puCk).
 *
 * En haut, SA FIGURINE, son prénom et le gros bouton « ✨ Ma figurine » (le même écran « Mon double du jour » que depuis
 * Ma maison, `mon-double.tsx`). Dessous, ses réglages, rangés par thème :
 *   · MA FIGURINE : la refaire (l'atelier, `/univers/figurine`), la sauvegarder (son adresse : le cadenas d'avant, en
 *     haut, devient cette ligne) ;
 *   · CE QUE J'AIME : ses passions (elles choisissent son fil ; avant, on ne les changeait que depuis « Tous les salons ») ;
 *   · QUI ME VOIT : « Là maintenant » chez ses proches (`MaPresence`), qui peut venir voir sa pièce (le réglage de Ma
 *     maison, `QuiPeutEntrer`) ;
 *   · QUAND JE NE SUIS PAS LÀ : sa figurine parle pour lui (`MaFigurineParle`), elle range sans lui demander
 *     (`RangeSansDemander`) ;
 *   · MON TÉLÉPHONE : l'écran d'accueil et les notifications (`MonTelephone`) ;
 *   · MES DONNÉES : ce que ClikMe sait de lui (`CeQueTaFigurineSait` : tout, daté ; il efface).
 * Partis : la carte de personnage (le test en sept questions, ses niveaux, ses cadres, la partager), le « ! » à côté du
 * prénom, sa figurine du mois (elle est dans « Ma figurine » ; hors de l'univers, elle reste ici), les raccourcis vers le studio des mèmes (le propriétaire,
 * le même jour : « les retirer de la page » ; leurs écrans restent).
 */
import { ReapparaitreDansLesSalons } from "./reapparaitre";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { EtatMaFigurine } from "@/lib/direct/ma-figurine";
import { VISIBILITES_MAISON, type MaMaisonVue } from "@/lib/direct/ma-maison";
import { RefaireMaFigurine } from "./ma-figurine";
import { MonDouble } from "./mon-double";
import { TesPassions } from "./tes-passions";
import { QuiPeutEntrer } from "./ajouter-chez-moi";
import { MaPresence } from "./proches";
import { MaFigurineParle } from "./rituel";
import { RangeSansDemander } from "./etagere";
import { MonTelephone } from "./mon-telephone";
import { CeQueTaFigurineSait } from "./connaitre";
import { MaFigurineDuMois } from "./figurine-du-mois";

/** Les mots de la page. */
export const PHRASES_MOI = {
  sous: "C’est elle que tout le monde voit",
  maFigurine: "✨ Ma figurine",
  groupes: { figurine: "Ma figurine", aime: "Ce que j’aime", voit: "Qui me voit", absent: "Quand je ne suis pas là", telephone: "Mon téléphone", donnees: "Mes données" },
  refaire: "Refaire ma figurine",
  refaireDit: "Un nouveau selfie, dans l’atelier",
  sauver: "Sauvegarder ma figurine",
  sauverDit: "Ton adresse, pour la retrouver sur un autre téléphone",
  sauvee: "✓ Sauvegardée",
  aFaire: "À faire",
  passions: "Mes passions",
  passionsDit: "Elles choisissent ce que tu vois dans Découvrir",
  aucunePassion: "Choisis-les",
  porte: "Qui peut venir voir ma pièce",
  porteDit: "Le même réglage que dans Ma maison",
  retour: "‹ Moi",
} as const;

type Theme = { id: string; nom: string; e: string };

function Ligne({ ico, titre, dit, droite, onClick, href, enfant, data }: { ico: string; titre: string; dit: string; droite?: React.ReactNode; onClick?: () => void; href?: string; enfant?: React.ReactNode; data?: string }) {
  const dedans = (
    <>
      <span className="pm-ico" aria-hidden="true">
        {ico}
      </span>
      <span className="pm-txt">
        <b>{titre}</b>
        <small>{dit}</small>
        {enfant}
      </span>
      {droite ?? (
        <i className="pm-fleche" aria-hidden="true">
          ›
        </i>
      )}
    </>
  );
  return href ? (
    <a className="pm-ligne" href={href} data-ligne={data}>
      {dedans}
    </a>
  ) : (
    <button type="button" className="pm-ligne" onClick={onClick} data-ligne={data}>
      {dedans}
    </button>
  );
}

function Groupe({ titre, children, cle }: { titre: string; children: React.ReactNode; cle: string }) {
  return (
    <section className="pm-groupe" aria-label={titre} data-groupe={cle}>
      <h3>{titre}</h3>
      {children}
    </section>
  );
}

export function PageMoi({
  etat,
  univers,
  maison,
  onEtat,
  onProteger,
  allerA,
}: {
  etat: EtatMaFigurine | null;
  univers: boolean;
  maison: boolean;
  onEtat: (e: EtatMaFigurine) => void;
  onProteger: () => void;
  allerA: (o: string) => void;
}) {
  const prete = etat?.etape === "prete";
  const [double, setDouble] = useState(false);
  const [vue, setVue] = useState<"page" | "passions">("page");
  // ❤️ ses passions (leurs noms, tels que le serveur les donne)
  const [passions, setPassions] = useState<Theme[] | null>(null);
  // 🚪 sa pièce et qui peut y venir (Ma maison allumée seulement)
  const [piece, setPiece] = useState<MaMaisonVue | null>(null);
  const [porte, setPorte] = useState(false);

  useEffect(() => {
    if (vue !== "page") return;
    let fini = false;
    fetch("/api/direct/passions", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { themes?: Theme[]; passions?: string[] } | null) => {
        if (fini || !j) return;
        const themes = j.themes ?? [];
        setPassions((j.passions ?? []).map((id) => themes.find((t) => t.id === id)).filter((t): t is Theme => Boolean(t)));
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [vue]);
  useEffect(() => {
    if (!univers || !maison || !prete) return;
    let fini = false;
    fetch("/api/direct/ma-piece", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { maison?: MaMaisonVue } | null) => !fini && j?.maison?.scene && setPiece(j.maison))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [univers, maison, prete]);

  if (vue === "passions")
    return (
      <div className="pm pm-passions">
        <button type="button" className="pm-retour" onClick={() => setVue("page")} data-retour-moi>
          {PHRASES_MOI.retour}
        </button>
        <TesPassions onglet onFini={() => setVue("page")} />
      </div>
    );

  const visibilite = piece ? (VISIBILITES_MAISON.find((x) => x.v === (piece.visibilite ?? "proches")) ?? VISIBILITES_MAISON[0]) : null;
  return (
    <div className="pm">
      <section className="pm-qui" aria-label="Ma figurine">
        <span className="pm-fig" aria-hidden="true">
          {prete && etat?.neutre ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={etat.neutre} alt="" draggable={false} />
          ) : (
            <span>🙂</span>
          )}
        </span>
        <h2>{etat?.prenom || "Moi"}</h2>
        <small>{PHRASES_MOI.sous}</small>
        {prete && univers ? (
          <button type="button" className="pm-gros" onClick={() => setDouble(true)} data-ma-figurine>
            {PHRASES_MOI.maFigurine}
          </button>
        ) : !prete ? (
          <button type="button" className="pm-gros" onClick={() => (univers ? window.location.assign("/univers/figurine") : allerA("creer"))} data-creer>
            ✨ Créer ma figurine
          </button>
        ) : null}
      </section>

      {prete && etat && (
        <Groupe titre={PHRASES_MOI.groupes.figurine} cle="figurine">
          <div className="pm-liste">
            {univers && <Ligne ico="🔁" titre={PHRASES_MOI.refaire} dit={PHRASES_MOI.refaireDit} href="/univers/figurine" data="refaire" />}
            <Ligne
              ico="🔒"
              titre={PHRASES_MOI.sauver}
              dit={PHRASES_MOI.sauverDit}
              onClick={etat.protegee ? undefined : onProteger}
              droite={<span className={`pm-etat ${etat.protegee ? "ok" : "a-faire"}`}>{etat.protegee ? PHRASES_MOI.sauvee : PHRASES_MOI.aFaire}</span>}
              data="sauver"
            />
          </div>
          {/* (hors de l'univers, sans l'écran « Ma figurine » : sa figurine du mois, et la refaire, comme avant) */}
          {!univers && <MaFigurineDuMois />}
          {!univers && <RefaireMaFigurine etat={etat} onEtat={onEtat} onFait={() => allerA("figurine")} />}
        </Groupe>
      )}

      <Groupe titre={PHRASES_MOI.groupes.aime} cle="aime">
        <div className="pm-liste">
          <Ligne
            ico="❤️"
            titre={PHRASES_MOI.passions}
            dit={PHRASES_MOI.passionsDit}
            onClick={() => setVue("passions")}
            data="passions"
            enfant={
              passions && (
                <span className="pm-puces">
                  {passions.length ? (
                    passions.map((t) => (
                      <em key={t.id}>
                        {t.e} {t.nom}
                      </em>
                    ))
                  ) : (
                    <em className="plus">＋ {PHRASES_MOI.aucunePassion}</em>
                  )}
                </span>
              )
            }
          />
        </div>
      </Groupe>

      {prete && (
        <Groupe titre={PHRASES_MOI.groupes.voit} cle="voit">
          <MaPresence />
          {visibilite && (
            <div className="pm-liste">
              <Ligne ico="🚪" titre={PHRASES_MOI.porte} dit={PHRASES_MOI.porteDit} onClick={() => setPorte(true)} droite={<span className="pm-etat val">{visibilite.titre}</span>} data="porte" />
            </div>
          )}
        </Groupe>
      )}

      {prete && (
        <Groupe titre={PHRASES_MOI.groupes.absent} cle="absent">
          <MaFigurineParle />
          <RangeSansDemander />
          <ReapparaitreDansLesSalons />
        </Groupe>
      )}

      {etat?.compte && (
        <Groupe titre={PHRASES_MOI.groupes.telephone} cle="telephone">
          <MonTelephone />
        </Groupe>
      )}

      {etat?.compte && (
        <Groupe titre={PHRASES_MOI.groupes.donnees} cle="donnees">
          <CeQueTaFigurineSait />
        </Groupe>
      )}

      {double &&
        createPortal(
          <MonDouble retour={PHRASES_MOI.retour} onFermer={() => setDouble(false)} onChange={() => undefined} />,
          document.body,
        )}
      {porte &&
        piece &&
        createPortal(
          <QuiPeutEntrer
            maison={piece}
            onFermer={() => setPorte(false)}
            onChoisi={(m) => {
              setPiece(m);
              setPorte(false);
            }}
          />,
          document.body,
        )}
    </div>
  );
}

export const STYLES_PAGE_MOI = `
.pm{display:flex;flex-direction:column;gap:18px;padding-bottom:12px}
.pm-qui{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding-top:6px}
.pm-fig{display:grid;place-items:center;width:120px;height:120px;border-radius:50%;overflow:hidden;background:radial-gradient(70% 60% at 50% 40%,#FF9AD0,#C2367F 62%,#5E1240);box-shadow:0 0 0 3px rgba(255,46,154,.35),0 0 40px -6px rgba(255,46,154,.7);font-size:58px}
.pm-fig img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.pm-qui h2{margin:2px 0 0;font-size:25px;font-weight:900;letter-spacing:-.02em;color:#FFF4E6}
.pm-qui small{color:#CDB4C0;font-size:13px}
.pm-gros{display:inline-flex;align-items:center;gap:8px;min-height:48px;margin-top:4px;padding:0 24px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-weight:900;font-size:16px;box-shadow:0 10px 22px -10px rgba(255,46,154,.95);cursor:pointer}
.pm-groupe{display:flex;flex-direction:column;gap:8px}
.pm-groupe > h3{margin:0 4px;font-size:11.5px;font-weight:900;letter-spacing:.09em;text-transform:uppercase;color:#FF8FCB}
.pm-liste{display:flex;flex-direction:column;border-radius:20px;background:rgba(255,255,255,.05);overflow:hidden}
.pm-ligne{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-height:60px;padding:12px 14px;box-sizing:border-box;border:0;background:none;color:#FFF4E6;font:inherit;text-align:left;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pm-ligne + .pm-ligne{border-top:1px solid rgba(255,255,255,.08)}
.pm-ligne:hover{background:rgba(255,255,255,.03)}
.pm-ligne:focus-visible{outline:2px solid #FFF4E6;outline-offset:-2px}
.pm-ico{font-size:21px;text-align:center}
.pm-txt{display:flex;flex-direction:column;gap:1px;min-width:0}
.pm-txt b{font-size:15px;font-weight:800}
.pm-txt small{font-size:12.5px;line-height:1.35;color:#CDB4C0}
.pm-fleche{color:#CDB4C0;font-style:normal;font-size:20px}
.pm-etat{max-width:44vw;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pm-etat.a-faire{background:rgba(242,196,107,.16);color:#F2C46B}
.pm-etat.ok{background:rgba(61,220,132,.14);color:#7FE8AE}
.pm-etat.val{background:rgba(255,255,255,.08);color:#FFF4E6}
.pm-puces{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.pm-puces em{font-style:normal;padding:4px 10px;border-radius:999px;background:rgba(255,46,154,.14);color:#FFC2E3;font-size:12.5px;font-weight:800}
.pm-puces em.plus{background:none;box-shadow:inset 0 0 0 1.5px rgba(255,46,154,.5)}
.pm-retour{align-self:flex-start;min-height:40px;padding:0 14px;border:0;border-radius:999px;background:rgba(255,255,255,.08);color:#FFF4E6;font:inherit;font-weight:800;cursor:pointer}
.pm-passions{gap:6px}
`;
