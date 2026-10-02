"use client";

// ✨ L'EXPÉRIENCE DU LIEU — l'invitation, puis l'atelier en plein écran.
//
// « C'est une clé addictive de la page du commerçant. Il faut que l'expérience
// au clic prenne toute la page, que les couleurs soient raccord avec la charte,
// et surtout pas cette photo qui nous distrait sur la gauche. Repense le
// design de cette page entièrement, pour quelque chose d'époustouflant et
// d'animé. »
//
// DEUX TEMPS, DEUX ÉCRANS :
//   · L'INVITATION, dans l'onglet : une nuit qui respire (deux lueurs, ambre et
//     rose), le fantôme du métier en action — dessiné par lui, voir
//     `public/direct/fantomes/` —, la promesse en une phrase, trois étapes qui
//     disent le geste, ses créations à essayer, et un seul bouton rose.
//   · L'ATELIER, au toucher : il prend TOUTE la page, par-dessus tout, sans
//     photo ni barre autour. C'est `MurContenu` — la prise de vue, l'essai, le
//     rendu, le salon —, le même que dans le fil, repeint aux couleurs de la
//     maison (`maison`, voir `lib/direct/charte-maison.ts`).
//
// RIEN QUI NE SOIT À LUI. « Il y a des coupes enregistrées pour la démo, qui
// ne devraient pas être sur la page du commerçant. » Sur une vraie page, on ne
// propose que SES pièces photographiées (`seulementLesSiennes`) ; sans elles,
// l'invitation dit honnêtement qu'elles arrivent — et au commerçant, comment
// les ajouter.
import { useCallback, useMemo, useState } from "react";
import { AtelierPleinEcran, useMurDuLieu, type RenduEssai } from "@/components/direct/atelier-plein-ecran";
import type { CarteAutour } from "@/lib/direct/apercu-habitant";
import { parcoursPromis } from "@/lib/direct/parcours-promis";

export type { RenduEssai };

/** Les mots de l'essai, métier par métier. */
type MotsEssai = {
  fantome: string;
  titre: [string, string, string];
  pieces: string;
  pose: string;
  geste: string;
};
const ESSAI: Record<string, MotsEssai> = {
  coiffeur: {
    fantome: "hote-coiffeur",
    titre: ["Votre prochaine coupe,", "sur vous", "avant le rendez-vous."],
    pieces: "coupes",
    pose: "pose la coupe",
    geste: "Me prendre en photo",
  },
  ongles: {
    fantome: "hote-onglerie",
    titre: ["Votre prochaine pose,", "sur votre main", "avant de venir."],
    pieces: "poses",
    pose: "pose le vernis",
    geste: "Photographier ma main",
  },
  lunetier: {
    fantome: "hote-opticien",
    titre: ["Vos futures lunettes,", "sur votre visage", "avant d'entrer."],
    pieces: "montures",
    pose: "pose la monture",
    geste: "Me prendre en photo",
  },
  mode: {
    fantome: "hote-mode",
    titre: ["La pièce qui vous plaît,", "sur vous", "avant d'entrer."],
    pieces: "pièces",
    pose: "vous habille",
    geste: "Me prendre en photo",
  },
  fleuriste: {
    fantome: "hote-fleuriste",
    titre: ["Le bouquet,", "chez vous", "avant de l'offrir."],
    pieces: "bouquets",
    pose: "le pose chez vous",
    geste: "Photographier ma pièce",
  },
  artisan: {
    fantome: "hote-artisan",
    titre: ["La création,", "chez vous", "avant de l'adopter."],
    pieces: "créations",
    pose: "la pose chez vous",
    geste: "Photographier ma pièce",
  },
};
const motsEssai = (branche: string) => ESSAI[branche] ?? ESSAI.artisan;

export function EssaiDuLieu({
  c,
  saPage,
  onReserver,
  onSalon,
}: {
  c: CarteAutour;
  /** On montre au commerçant SA page : l'état « bientôt » lui dit quoi faire. */
  saPage: boolean;
  onReserver: () => void;
  onSalon: (o: RenduEssai) => void;
}) {
  /** L'atelier ouvert, et la pièce choisie pour y entrer. */
  const [atelier, setAtelier] = useState<{ piece?: string; grille?: boolean } | null>(null);
  const fermer = useCallback(() => setAtelier(null), []);
  const murDuLieu = useMurDuLieu(c);
  const onEssaie = murDuLieu.depot === "essai";
  const pieces = useMemo(() => (murDuLieu.essai?.pieces ?? []).filter((p) => !p.bientot), [murDuLieu]);
  const promis = useMemo(
    () =>
      !onEssaie && !murDuLieu.gout && !murDuLieu.soiree
        ? parcoursPromis({ branche: c.branche, metier: c.metier })
        : undefined,
    [onEssaie, murDuLieu.gout, murDuLieu.soiree, c.branche, c.metier],
  );
  const mots = motsEssai(c.branche);
  /** Rien à essayer chez lui pour l'instant : ni pièce, ni autre porte ouverte. */
  const bientot = Boolean(promis) || (onEssaie && pieces.length === 0);

  return (
    <div className="bx">
      <StylesExperience />
      <div className="bx-aurore" aria-hidden="true">
        <i />
        <i />
      </div>

      {/* ═══ LE FANTÔME DU MÉTIER, EN ACTION ═══ */}
      <div className="bx-scene">
        <div className="bx-fantome">
          <span className="bx-halo" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/direct/fantomes/${mots.fantome}.png`} alt="" draggable={false} />
          <span className="bx-etincelles" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="bx-texte">
          <p className="bx-k">L’expérience · {c.nom}</p>
          <h2 className="bx-t">
            <span>{mots.titre[0]}</span> <em>{mots.titre[1]}</em> <span>{mots.titre[2]}</span>
          </h2>
          <ol className="bx-etapes">
            <li>
              <b>1</b> {mots.geste === "Me prendre en photo" ? "Une photo de vous" : mots.geste}
            </li>
            <li>
              <b>2</b> L’IA {mots.pose}
            </li>
            <li>
              <b>3</b> Vos amis donnent leur avis
            </li>
          </ol>
        </div>
      </div>

      {/* ═══ SES CRÉATIONS À ESSAYER — les siennes, et elles seules ═══ */}
      {pieces.length > 0 && (
        <section className="bx-pieces" aria-label={`Les ${mots.pieces} à essayer`}>
          <h3>
            À essayer ici <span>· {pieces.length}</span>
          </h3>
          <div className="bx-grille">
            {pieces.slice(0, pieces.length > 12 ? 11 : 12).map((p, i) => (
              <button
                key={p.id}
                type="button"
                style={{ ["--i" as string]: i }}
                onClick={() => setAtelier({ piece: p.id })}
                aria-label={`Essayer ${p.nom}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt="" loading="lazy" />
                <span>
                  <b>{p.nom}</b>
                  {p.prix && <i>{p.prix}</i>}
                </span>
              </button>
            ))}
            {/* LES AUTRES, DANS L'ATELIER : douze cases suffisent à donner
                envie, et la douzième ouvre toutes les autres — elle ferme la
                grille au lieu de pendre seule sur une ligne. */}
            {pieces.length > 12 && (
              <button type="button" className="bx-plus" onClick={() => setAtelier({ grille: true })}>
                <b>+{pieces.length - 11}</b>
                <span>Tout voir</span>
              </button>
            )}
          </div>
        </section>
      )}

      {/* ═══ LE GRAND BOUTON — ou l'aveu honnête que rien n'est encore là ═══ */}
      {bientot ? (
        <div className="bx-bientot">
          {saPage ? (
            <>
              <b>Vos {mots.pieces} arrivent ici.</b>
              <p>
                Ajoutez-les dans votre Espace Pro — une photo, un nom, un prix. Vos clients les essaieront sur eux, ici,
                en quelques secondes, avant de vous écrire.
              </p>
            </>
          ) : (
            <>
              <b>
                Ses {mots.pieces} arrivent bientôt ici.
              </b>
              <p>Vous pourrez les essayer sur vous en quelques secondes. En attendant, demandez conseil.</p>
            </>
          )}
          <button type="button" className="bx-second" onClick={onReserver}>
            Demander conseil <s aria-hidden="true">›</s>
          </button>
        </div>
      ) : (
        <button type="button" className="bx-go" onClick={() => setAtelier({})}>
          <span>{onEssaie ? mots.geste : "Découvrir"}</span>
          <s aria-hidden="true">→</s>
        </button>
      )}

      {/* ═══ L'ATELIER, EN PLEIN ÉCRAN — voir `AtelierPleinEcran` ═══ */}
      {atelier && (
        <AtelierPleinEcran
          c={c}
          piece={atelier.piece}
          grille={atelier.grille}
          onFermer={fermer}
          onReserver={onReserver}
          onSalon={onSalon}
        />
      )}
    </div>
  );
}

/* LA FEUILLE DE L'EXPÉRIENCE. La charte des pages : nuit brune (#120C09),
   crème (#FFF4E6), ambre (#F5A23A) pour ce qui s'allume, rose (#FF2E9A) pour
   ce qu'on touche. Tout ce qui bouge bouge lentement, et s'arrête sous
   prefers-reduced-motion. */
function StylesExperience() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .bx{position:relative;isolation:isolate;padding:6px 2px 8px;}
        .bx-aurore{position:absolute;inset:-40px -24px;z-index:-1;pointer-events:none;}
        .bx-aurore i{position:absolute;width:70%;aspect-ratio:1;border-radius:50%;filter:blur(60px);opacity:.5;}
        .bx-aurore i:first-child{left:-10%;top:0;background:radial-gradient(circle,rgba(245,162,58,.55),transparent 65%);
          animation:bxDerive 14s ease-in-out infinite alternate;}
        .bx-aurore i:last-child{right:-12%;top:30%;background:radial-gradient(circle,rgba(255,46,154,.42),transparent 65%);
          animation:bxDerive 17s ease-in-out -6s infinite alternate-reverse;}
        @keyframes bxDerive{from{transform:translate(0,0) scale(1);}to{transform:translate(8%,10%) scale(1.15);}}

        .bx-scene{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;}
        .bx-fantome{position:relative;width:min(62vw,250px);aspect-ratio:1;
          animation:bxEntre .9s cubic-bezier(.16,1,.3,1) both;}
        .bx-fantome img{position:relative;z-index:1;width:100%;height:100%;object-fit:contain;
          filter:drop-shadow(0 22px 30px rgba(0,0,0,.55));animation:bxFlotte 4.2s ease-in-out infinite;}
        .bx-halo{position:absolute;inset:8%;border-radius:50%;
          background:radial-gradient(circle,rgba(255,201,122,.45),rgba(255,46,154,.16) 55%,transparent 72%);
          animation:bxRespire 4.2s ease-in-out infinite;}
        .bx-etincelles i{position:absolute;z-index:2;width:12px;height:12px;
          background:radial-gradient(circle,#FFF4E6 0 18%,rgba(255,201,122,.9) 30%,transparent 70%);
          clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);
          animation:bxScintille 2.8s ease-in-out infinite;}
        .bx-etincelles i:nth-child(1){left:6%;top:18%;}
        .bx-etincelles i:nth-child(2){right:4%;top:8%;width:16px;height:16px;animation-delay:.7s;}
        .bx-etincelles i:nth-child(3){right:12%;bottom:22%;animation-delay:1.4s;}
        .bx-etincelles i:nth-child(4){left:14%;bottom:10%;width:9px;height:9px;animation-delay:2.1s;}
        @keyframes bxFlotte{0%,100%{transform:translateY(0) rotate(-1deg);}50%{transform:translateY(-10px) rotate(1.5deg);}}
        @keyframes bxRespire{0%,100%{opacity:.6;transform:scale(.94);}50%{opacity:1;transform:scale(1.06);}}
        @keyframes bxScintille{0%,100%{opacity:0;transform:scale(.4) rotate(0);}50%{opacity:1;transform:scale(1) rotate(45deg);}}
        @keyframes bxEntre{from{opacity:0;transform:translateY(24px) scale(.9);filter:blur(10px);}to{opacity:1;transform:none;filter:none;}}

        .bx-texte>*{animation:bxMonte .7s cubic-bezier(.16,1,.3,1) both;}
        .bx-texte>:nth-child(2){animation-delay:.08s;}
        .bx-texte>:nth-child(3){animation-delay:.16s;}
        @keyframes bxMonte{from{opacity:0;transform:translateY(14px);filter:blur(6px);}to{opacity:1;transform:none;filter:none;}}
        .bx-k{margin:0;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#FFC97A;}
        .bx-t{margin:8px 0 0;font-family:var(--font-clikme),sans-serif;font-weight:800;
          font-size:clamp(28px,8vw,40px);line-height:1.06;letter-spacing:-.03em;color:#FFF4E6;text-wrap:balance;}
        .bx-t em{font-style:normal;background:linear-gradient(100deg,#FFC97A,#FF7A4A 45%,#FF2E9A 90%);
          background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;
          animation:bxMiroite 5s ease-in-out infinite;}
        @keyframes bxMiroite{0%,100%{background-position:0 0;}50%{background-position:100% 0;}}
        .bx-etapes{list-style:none;margin:16px 0 0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:7px;}
        .bx-etapes li{display:flex;align-items:center;gap:7px;padding:7px 12px 7px 7px;border-radius:999px;
          font-size:13px;font-weight:600;color:#FFF4E6;background:rgba(255,244,230,.06);border:1px solid rgba(255,196,140,.16);}
        .bx-etapes b{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;font-size:12px;
          color:#1A0F08;background:#F5A23A;}

        .bx-pieces{margin-top:22px;}
        .bx-pieces h3{margin:0 0 10px;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:17px;color:#FFF4E6;}
        .bx-pieces h3 span{font-family:var(--font-geist-sans),sans-serif;font-weight:500;font-size:13px;color:#CDB8A4;}
        .bx-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;}
        .bx-grille button{position:relative;padding:0;border:1px solid rgba(255,196,140,.16);border-radius:16px;overflow:hidden;
          cursor:pointer;background:#1C1411;text-align:left;aspect-ratio:3/4;
          animation:bxMonte .6s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(.05s * var(--i,0));
          transition:transform .25s cubic-bezier(.34,1.4,.64,1),box-shadow .25s ease;}
        .bx-grille button:hover{transform:translateY(-3px);box-shadow:0 16px 30px -14px rgba(255,46,154,.55);}
        .bx-grille img{width:100%;height:100%;object-fit:cover;display:block;}
        .bx-grille span{position:absolute;left:0;right:0;bottom:0;padding:22px 9px 8px;display:flex;flex-direction:column;gap:2px;
          background:linear-gradient(180deg,transparent,rgba(18,12,9,.92) 55%);}
        .bx-grille b{font-size:12.5px;font-weight:700;color:#FFF4E6;line-height:1.2;}
        .bx-grille .bx-plus{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
          background:radial-gradient(circle at 50% 40%,rgba(255,46,154,.22),rgba(28,20,17,1) 70%);}
        .bx-grille .bx-plus b{font-family:var(--font-clikme),sans-serif;font-size:30px;color:#FFF4E6;}
        .bx-grille .bx-plus span{position:static;padding:0;background:none;font-size:13px;font-weight:700;color:#FFC97A;}
        .bx-grille i{font-style:normal;font-size:12.5px;font-weight:800;color:#F5A23A;}

        .bx-go{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:12px;
          width:100%;margin:22px 0 4px;padding:18px 22px;border:0;border-radius:999px;cursor:pointer;
          font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:19px;color:#fff;
          background:linear-gradient(135deg,#FF4FB0,#FF2E9A 60%,#E0187F);
          box-shadow:0 18px 40px -14px rgba(255,46,154,.75);
          animation:bxMonte .7s cubic-bezier(.16,1,.3,1) .24s both;transition:transform .2s cubic-bezier(.34,1.4,.64,1);}
        .bx-go::after{content:"";position:absolute;inset:0;
          background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);
          transform:translateX(-120%);animation:bxReflet 3.4s cubic-bezier(.16,1,.3,1) 1s infinite;}
        @keyframes bxReflet{0%{transform:translateX(-120%);}55%,100%{transform:translateX(120%);}}
        .bx-go:active{transform:scale(.97);}
        .bx-go s{text-decoration:none;font-size:22px;}

        .bx-bientot{margin:22px 0 4px;padding:18px;border-radius:20px;text-align:center;
          background:rgba(255,244,230,.05);border:1px dashed rgba(255,196,140,.28);
          animation:bxMonte .7s cubic-bezier(.16,1,.3,1) .24s both;}
        .bx-bientot b{display:block;font-family:var(--font-clikme),sans-serif;font-size:17px;color:#FFF4E6;}
        .bx-bientot p{margin:6px 0 12px;font-size:14px;line-height:1.5;color:#CDB8A4;}
        .bx-second{padding:11px 18px;border-radius:999px;cursor:pointer;font:inherit;font-weight:700;font-size:15px;
          color:#FFF4E6;background:transparent;border:1px solid rgba(255,244,230,.28);}
        .bx-second s{text-decoration:none;margin-left:4px;}

        /* SUR UN ORDINATEUR, L'INVITATION SE MET EN SCÈNE SUR DEUX COLONNES. */
        @media (min-width:960px){
          .bx{max-width:980px;margin:0 auto;padding-top:28px;}
          .bx-scene{flex-direction:row;justify-content:center;text-align:left;gap:40px;}
          .bx-fantome{width:300px;flex:none;}
          .bx-texte{max-width:520px;}
          .bx-etapes{justify-content:flex-start;}
          .bx-go,.bx-bientot{max-width:520px;margin-left:auto;margin-right:auto;}
          .bx-grille{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));}
        }
        @media (prefers-reduced-motion:reduce){
          .bx *,.bx *::before,.bx *::after{animation:none !important;}
        }
        `,
      }}
    />
  );
}
