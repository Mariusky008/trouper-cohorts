"use client";

// 🪄 L'ATELIER, EN PLEIN ÉCRAN — l'essai d'un commerce, par-dessus tout.
//
// « Il faut que l'expérience au clic prenne toute la page, que les couleurs
// soient raccord avec la charte, et surtout pas cette photo qui nous distrait. »
//
// DEUX PORTES Y MÈNENT, ET C'EST POUR ÇA QU'IL EST ICI : l'onglet Expérience de
// la page d'un commerce (`EssaiDuLieu`), et la ville sur un ordinateur
// (`VilleOrdinateur`), où « Essayer sur mes ongles » ouvre l'atelier sans
// quitter le carrousel. Un seul atelier : le même dessin, la même charte, le
// même retour.
//
// C'EST `MurContenu` — la prise de vue, l'essai, le rendu, le salon —, le même
// que dans le fil, repeint aux couleurs de la maison (`maison`, voir
// `lib/direct/charte-maison.ts`).
//
// POSÉ À LA RACINE DU DOCUMENT. Dans un onglet, un « position: fixed » reste
// prisonnier : l'écran entre en glissant (une transformation, qui retient ce
// qui est fixe), et la barre du bas passait par-dessus. À la racine, il
// couvre vraiment toute la page.
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MurContenu } from "@/components/direct/mur-contenu";
import { HEURE_MAX, HEURE_MIN, momentEnCours, type CarteAutour } from "@/lib/direct/apercu-habitant";
import { murDeLaCarte } from "@/lib/direct/fantomes";

/** Ce que l'atelier remet quand on veut montrer son rendu aux amis. */
export type RenduEssai = Parameters<NonNullable<Parameters<typeof MurContenu>[0]["onSalon"]>>[0];

/**
 * LE MUR D'UN COMMERCE, À L'HEURE QU'IL EST.
 *
 * RIEN QUI NE SOIT À LUI : sur une vraie page (`vraiePage`), seulement SES
 * pièces photographiées — jamais celles de la démonstration.
 */
export function useMurDuLieu(c: CarteAutour) {
  /* L'HEURE APRÈS LE PREMIER RENDU, sinon serveur et navigateur calculent
     deux heures différentes et React refuse l'hydratation. */
  const [heure, setHeure] = useState(12);
  useEffect(() => {
    const d = new Date();
    const h = d.getHours() + d.getMinutes() / 60;
    setHeure(h >= HEURE_MIN && h <= HEURE_MAX ? h : 12);
  }, []);
  return useMemo(
    () =>
      murDeLaCarte({
        id: c.id,
        nom: c.nom,
        metier: c.metier,
        branche: c.branche,
        ville: c.ville,
        distance: c.distance,
        photo: c.photo,
        google: c.google,
        telephone: c.telephone,
        catalogue: c.catalogue,
        moment: momentEnCours(c, heure),
        seulementLesSiennes: Boolean(c.vraiePage),
        murDuLieu: c.murDuLieu,
      }),
    [c, heure],
  );
}

export function AtelierPleinEcran({
  c,
  piece,
  grille,
  onFermer,
  onReserver,
  onSalon,
}: {
  c: CarteAutour;
  /** La pièce touchée pour entrer : l'atelier s'ouvre dessus. */
  piece?: string;
  /** « Tout voir » : l'atelier s'ouvre sur la grille de ses pièces. */
  grille?: boolean;
  onFermer: () => void;
  onReserver: () => void;
  onSalon: (o: RenduEssai) => void;
}) {
  const mur = useMurDuLieu(c);
  const onEssaie = mur.depot === "essai";

  /* L'ATELIER BLOQUE LA PAGE DERRIÈRE LUI : on ne fait pas défiler deux
     écrans. Et Échap le referme, comme toute fenêtre sur un ordinateur. */
  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", touche);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", touche);
    };
  }, [onFermer]);

  return createPortal(
    <div className="bx-atelier" role="dialog" aria-label={`Essayer chez ${c.nom}`}>
      <StylesAtelier />
      <header className="bx-atelier-h">
        <button type="button" onClick={onFermer} aria-label="Revenir">
          <span aria-hidden="true">‹</span> Retour
        </button>
        <b>{c.nom}</b>
        <span aria-hidden="true" />
      </header>
      <div className="bx-atelier-c">
        <div className="mu bt-mu atelier">
          <MurContenu
            key={`${c.id}-${piece ?? ""}-${grille ? "grille" : ""}`}
            mur={mur}
            maison
            ouvrirSur={onEssaie ? "depot" : undefined}
            piecePrechoisie={piece}
            ouvrirSurGrille={grille}
            onReserver={() => {
              onFermer();
              onReserver();
            }}
            onSalon={(o) => {
              onFermer();
              onSalon(o);
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* LA FEUILLE DE L'ATELIER. La charte des pages : nuit brune (#120C09),
   crème (#FFF4E6), ambre (#F5A23A), rose (#FF2E9A). */
export function StylesAtelier() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .bx-atelier{position:fixed;inset:0;z-index:500;display:flex;flex-direction:column;
          background:radial-gradient(120% 70% at 50% 0%,#2A1A12 0%,#120C09 55%,#0B0705 100%);
          color:#FFF4E6;font-family:var(--font-geist-sans),system-ui,sans-serif;
          animation:bxOuvre .45s cubic-bezier(.16,1,.3,1) both;}
        @keyframes bxOuvre{from{opacity:0;transform:scale(.985);}to{opacity:1;transform:none;}}
        .bx-atelier-h{flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;
          padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;border-bottom:1px solid rgba(255,196,140,.12);}
        .bx-atelier-h button{justify-self:start;display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:999px;
          cursor:pointer;font:inherit;font-weight:700;font-size:14px;color:#FFF4E6;
          background:rgba(255,244,230,.06);border:1px solid rgba(255,244,230,.16);}
        .bx-atelier-h button span{font-size:20px;line-height:1;}
        .bx-atelier-h b{font-family:var(--font-clikme),sans-serif;font-size:15px;color:#FFF4E6;
          max-width:52vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .bx-atelier-c{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
          padding:14px 12px calc(28px + env(safe-area-inset-bottom,0px));}
        .bx-atelier-c>.mu.bt-mu{width:100%;max-width:680px;margin:0 auto;}
        .mu.bt-mu{min-height:0;background:transparent;}
        .mu.bt-mu.atelier{padding:4px 0 10px;background:transparent;box-shadow:none;}
        .bt-mu .mu-chez,.bt-mu .mu-e-tete{display:none;}
        /* TOUTES SES PIÈCES D'UN COUP D'ŒIL. Dans le fil, elles défilent en une
           rangée ; en plein écran, la rangée coupait la sixième au bord, et
           une souris ne fait pas défiler de côté. Elles passent en grille. */
        .bx-atelier .mu-pieces{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));overflow:visible;}
        .bx-atelier .mu-pieces button{width:auto;}
        @media (prefers-reduced-motion:reduce){.bx-atelier{animation:none;}}
        `,
      }}
    />
  );
}
