"use client";

/**
 * 🏘️ « DANS LA RUE DE … » — l'écran qui ouvre la ville depuis la page d'un commerce.
 *
 * « L'idée de mettre les deux voisins les plus proches à droite et à gauche,
 * et ensuite l'application elle-même avec tous les commerçants — je trouve
 * l'idée forte mais mal réalisée sur cette page. »
 *
 * CE QUI N'ALLAIT PAS : quatre lignes de titre avant le premier voisin
 * (« Explore Dax », « Depuis … · … », « Les copains du quartier », « Deux
 * voisins présentés par … »), le second voisin sous le pli, ni gauche ni
 * droite, et rien qui dise pourquoi y aller.
 *
 * ICI, UN SEUL ÉCRAN : une ligne de titre ; lui au milieu, qui présente ; son
 * voisin de gauche et son voisin de droite côte à côte, chacun avec le temps à
 * pied et UNE raison d'y aller ; puis la ville entière. Personne encore : la
 * place est gardée (« Vos voisins arrivent bientôt »).
 *
 * C'EST UN SEUIL, PAS UNE SECONDE APPLICATION : l'application de la ville est
 * derrière ; « Explorer toute la ville » referme la rue dessus.
 */
import { useState } from "react";
import Link from "next/link";

export type VoisinRue = {
  id: string;
  nom: string;
  metier: string;
  photo: string;
  fantome: string;
  /** « À 2 min à pied ». */
  aPied?: string;
  /** Pourquoi y aller, en une ligne. */
  raison: string;
  bouton: string;
  href: string;
};

export type LaRueProps = {
  moi: { nom: string; ville: string; fantome: string };
  voisins: VoisinRue[];
  /** Où revenir : sa page. */
  retour?: string;
  /** Des commerces de démonstration : la page le dit. */
  fictifs?: boolean;
  /** Le libellé du bouton du bas, quand la ville derrière n'est pas la sienne (l'exemple de Dax). */
  villeDerriere?: string;
};

export function LaRue({ moi, voisins, retour, fictifs, villeDerriere }: LaRueProps) {
  const [ouvert, setOuvert] = useState(true);
  if (!ouvert) return null;
  const deux: (VoisinRue | null)[] = [voisins[0] ?? null, voisins[1] ?? null];
  const personne = voisins.length === 0;

  const vitrine = (v: VoisinRue | null, cote: "gauche" | "droite") =>
    v ? (
      <a className={`lr-v ${cote}`} href={v.href}>
        <span className="lr-store" aria-hidden="true" />
        {/* SANS PHOTO ENCORE : son fantôme en grand, au milieu de la vitrine. */}
        <span className={`lr-photo${v.photo ? "" : " sans"}`} style={v.photo ? { backgroundImage: `url("${v.photo}")` } : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.fantome} alt="" />
          {v.aPied && <i className="lr-pied">{v.aPied}</i>}
        </span>
        <span className="lr-t">
          <b>{v.nom}</b>
          <small>{v.metier}</small>
          <em>{v.raison}</em>
        </span>
        <span className="lr-go">{v.bouton}&nbsp;→</span>
      </a>
    ) : (
      <div className={`lr-v vide ${cote}`}>
        <span className="lr-store" aria-hidden="true" />
        <span className="lr-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ombre" src="/clikme-fantome.png" alt="" />
        </span>
        <span className="lr-t">
          <b>Bientôt ici</b>
          <em>Le prochain commerce ClikMe de la rue.</em>
        </span>
      </div>
    );

  return (
    <div className="lr" role="dialog" aria-label={`Dans la rue de ${moi.nom}`}>
      <style>{STYLE}</style>
      <header className="lr-haut">
        {retour ? (
          <Link className="lr-retour" href={retour} aria-label={`Revenir chez ${moi.nom}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5.5M11 5.5 4.5 12l6.5 6.5" />
            </svg>
          </Link>
        ) : (
          <span />
        )}
        <h1>
          Dans la rue de <span>{moi.nom}</span>
        </h1>
      </header>

      <div className="lr-scene">
      <div className="lr-moi">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={moi.fantome} alt="" />
        <p className="lr-bulle">{personne ? "Mes voisins arrivent bientôt !" : voisins.length === 1 ? "Je vous présente mon voisin !" : "Je vous présente mes voisins !"}</p>
      </div>

      <div className="lr-rue">
        {vitrine(deux[0], "gauche")}
        {vitrine(deux[1], "droite")}
      </div>
      {fictifs && !personne && <p className="lr-note">Commerces et offres fictifs</p>}
      </div>

      <button type="button" className="lr-ville" onClick={() => setOuvert(false)}>
        {villeDerriere ?? `Explorer tout ${moi.ville}`} <s aria-hidden="true">→</s>
      </button>
    </div>
  );
}

const STYLE = `
.lr{position:fixed;inset:0;z-index:400;overflow-y:auto;overscroll-behavior:contain;display:flex;flex-direction:column;
  background:radial-gradient(80% 40% at 50% 22%,rgba(245,162,58,.14),rgba(18,12,9,0) 70%),#120C09;
  color:#FFF4E6;font-family:var(--font-clikme),"Poppins",system-ui,sans-serif;
  padding:calc(10px + env(safe-area-inset-top,0px)) 14px calc(16px + env(safe-area-inset-bottom,0px));}
.lr *{box-sizing:border-box;}
.lr-haut{display:grid;grid-template-columns:40px 1fr;align-items:center;gap:10px;width:100%;max-width:760px;margin:0 auto;}
.lr-retour{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;color:#FFF4E6;background:rgba(255,244,230,.08);}
.lr-retour svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;}
.lr h1{grid-column:2;margin:0;font-weight:800;font-size:clamp(16px,4.5vw,26px);line-height:1.15;letter-spacing:-.015em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
/* LA SCÈNE AU MILIEU DE L'ÉCRAN, entre le titre et la ville : pas de grand vide sous la rue. */
.lr-scene{width:100%;margin:auto 0;padding:8px 0 14px;}
.lr h1 span{color:#FFB35C;}
.lr-moi{display:flex;align-items:center;justify-content:center;gap:8px;margin:10px auto 0;max-width:760px;}
.lr-moi img{width:96px;height:auto;filter:drop-shadow(0 10px 18px rgba(0,0,0,.5));}
.lr-bulle{position:relative;margin:0;padding:9px 14px;border-radius:16px;background:#FFF4E6;color:#1A0F08;
  font-family:var(--font-ecrit,"Caveat"),cursive;font-size:19px;font-weight:600;line-height:1.15;max-width:190px;}
.lr-bulle::after{content:"";position:absolute;left:-6px;top:50%;width:14px;height:14px;background:#FFF4E6;transform:translateY(-50%) rotate(45deg);border-radius:3px;}
.lr-rue{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:760px;margin:12px auto 0;padding-bottom:12px;}
/* LE TROTTOIR : la rue, sous les deux vitrines. */
.lr-rue::after{content:"";position:absolute;left:-14px;right:-14px;bottom:0;height:22px;border-top:2px solid rgba(255,196,140,.22);
  background:repeating-linear-gradient(90deg,rgba(255,196,140,.06) 0 38px,rgba(255,196,140,.02) 38px 40px);z-index:-1;}
.lr-v{position:relative;display:flex;flex-direction:column;min-width:0;border-radius:18px 18px 14px 14px;overflow:hidden;text-decoration:none;color:inherit;
  background:#1C1411;border:1px solid rgba(255,196,140,.18);box-shadow:0 18px 40px -20px rgba(0,0,0,.85);}
/* LE STORE DE LA VITRINE : rayé, à la couleur de la maison. */
.lr-store{display:block;height:12px;background:repeating-linear-gradient(90deg,#FF2E9A 0 14px,#FFF4E6 14px 28px);opacity:.9;}
.lr-v.droite .lr-store{background:repeating-linear-gradient(90deg,#F5A23A 0 14px,#FFF4E6 14px 28px);}
.lr-photo{position:relative;display:block;aspect-ratio:4 / 3;background:#2A1F1B center / cover no-repeat;}
.lr-photo img{position:absolute;right:4px;bottom:-4px;width:46%;height:auto;filter:drop-shadow(0 8px 14px rgba(0,0,0,.55));}
.lr-photo.sans{background:radial-gradient(70% 70% at 50% 60%,rgba(255,92,176,.18),rgba(28,20,17,0) 70%),#241915;}
.lr-photo.sans img{right:50%;transform:translateX(50%);bottom:4%;width:62%;}
.lr-photo img.ombre{right:50%;transform:translateX(50%);bottom:12%;width:40%;opacity:.35;filter:grayscale(1) brightness(1.6);}
.lr-pied{position:absolute;left:6px;top:6px;padding:4px 8px;border-radius:999px;font-style:normal;font-size:11.5px;font-weight:800;
  background:rgba(18,12,9,.82);color:#FFF4E6;border:1px solid rgba(255,196,140,.35);white-space:nowrap;}
.lr-t{display:flex;flex-direction:column;gap:2px;padding:9px 10px 2px;min-width:0;flex:1;}
.lr-t b{font-weight:800;font-size:15.5px;line-height:1.15;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lr-t small{font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#FF5CB0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.lr-t em{margin-top:4px;font-style:normal;font-size:13px;line-height:1.3;color:#E8D5C2;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.lr-go{display:block;margin:8px;padding:10px 8px;border-radius:999px;text-align:center;background:#FF2E9A;color:#fff;font-weight:800;font-size:13.5px;line-height:1.15;}
.lr-v.vide{border-style:dashed;border-color:rgba(255,196,140,.35);background:rgba(28,20,17,.55);box-shadow:none;}
.lr-v.vide .lr-store{opacity:.25;}
.lr-v.vide .lr-photo{background:repeating-linear-gradient(135deg,rgba(255,196,140,.06) 0 10px,rgba(255,196,140,.02) 10px 20px);}
.lr-v.vide .lr-t{padding-bottom:12px;}
.lr-v.vide .lr-t em{display:block;-webkit-line-clamp:unset;}
.lr-note{margin:8px 0 0;text-align:center;font-size:12px;color:#B9A594;}
.lr-ville{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:760px;margin:0 auto;padding:15px 18px;
  border-radius:999px;border:1px solid rgba(255,196,140,.35);cursor:pointer;background:rgba(255,244,230,.06);color:#FFF4E6;font:inherit;font-weight:800;font-size:16px;}
.lr-ville s{text-decoration:none;}
@media (min-height:700px){.lr-rue{margin-top:16px;}.lr-moi img{width:118px;}.lr-photo{aspect-ratio:1 / 1;}}
@media (min-height:800px){.lr-photo{aspect-ratio:4 / 5;}}
@media (min-width:700px){.lr-rue{gap:18px;}.lr-t b{font-size:19px;}.lr-t em{font-size:15px;}.lr-go{font-size:15px;}}
@media (max-width:340px){.lr-t em{font-size:12px;-webkit-line-clamp:4;}.lr-go{font-size:12.5px;}.lr-pied{font-size:10.5px;}}
`;
