"use client";

// 🎺 L'EXEMPLE « SORTIES » DE L'ÉCRAN D'OUVERTURE — les trois vrais écrans.
//
// ═══ CE QU'IL REMPLACE, ET POURQUOI ═══════════════════════════════════════
//
// « Je n'aime pas du tout le design de cet exemple. J'aimerais qu'on ait
// comme sur la photo 2 : d'abord la musique, que je puisse appuyer dessus pour
// l'écouter, et pouvoir appuyer sur "suivant" pour voir les deux autres phases
// — ce qu'on recherche dans cette soirée, et le live chat qui permet de voir
// ce que les gens disent et qui y sera. »
//
// L'EXEMPLE MONTRAIT LE BON RÉCIT DANS LE MAUVAIS DESSIN. Il avait déjà les
// trois temps — le son, les envies, le Live — mais posés en pastilles sur
// trois cartes inclinées qui défilaient toutes seules : « 10 s du son de ce
// soir » écrit en petit dans un coin. On lisait l'ÉTIQUETTE d'un écran au lieu
// de voir l'écran.
//
// ═══ LA RÈGLE QUE CE FICHIER APPLIQUE ════════════════════════════════════
//
// ON NE REDESSINE PAS, ON REJOUE. Les quatre autres exemples de l'écran
// d'ouverture montrent une PHOTO du résultat — une coupe, un bouquet, un plat
// — et c'est juste : le résultat est une image. Une soirée, non : ce qu'on y
// vend est une MÉCANIQUE, et une mécanique ne se photographie pas. Elle se
// touche.
//
// D'OÙ LE SEUL EXEMPLE QUI RÉPOND AU DOIGT. On écoute vraiment les dix
// secondes, on passe vraiment à l'écran suivant. Le reste de l'écran
// d'ouverture reste une démonstration automatique ; celui-ci s'arrête dès
// qu'on y touche, et c'est la personne qui mène.
//
// ═══ TOUT VIENT DE LA SOIRÉE, RIEN N'EST ÉCRIT ICI ═══════════════════════
//
// Le morceau, son étiquette, les intentions, le nombre du Live et les messages
// du chat sortent de `SOIREES.kiosque` et d'`INTENTIONS`. Recopiés ici, ils
// auraient divergé du vrai écran à la première retouche — et l'écran
// d'ouverture aurait promis une soirée que l'application ne donne pas.
import { useEffect, useRef, useState } from "react";
import { INTENTIONS, SOIREES } from "@/lib/direct/soiree";

/**
 * ═══ QUATRE TEMPS, ET LE PREMIER DIT DE QUELLE SOIRÉE ON PARLE ═════════════
 *
 * « Il manque le premier écran de l'annonce de départ : là je vois directement
 * l'ambiance musicale sans qu'on sache quelle est l'annonce. Choisis une sortie
 * parmi les annonces et elle devra apparaître en premier. »
 *
 * IL A RAISON, ET LE DÉFAUT ÉTAIT DE RÉCIT. On entrait par « LE SON DE CE
 * SOIR » et une forme d'onde : un extrait de musique sans rien dire de quoi.
 * Les trois temps qui suivaient — le son, les envies, le Live — répondent tous
 * à la question « comment c'est ? », et aucun ne répond à « c'est quoi ? ».
 *
 * L'ANNONCE EST DONC LE PREMIER TEMPS, et elle vient de la soirée elle-même :
 * son lieu, son heure, son titre. Rien n'est écrit ici — voir l'en-tête.
 */
const TEMPS = ["annonce", "son", "envies", "live"] as const;
type Temps = (typeof TEMPS)[number];

/**
 * LES BARRES DE L'ONDE, ET ELLES SONT TIRÉES UNE FOIS.
 *
 * Un tirage à chaque rendu ferait frémir l'onde à chaque battement de
 * l'horloge, c'est-à-dire un bruit visuel permanent sur un écran qu'on regarde
 * dix secondes. Elles sont donc fixes, et c'est la LECTURE qui les anime.
 */
const ONDE = Array.from({ length: 34 }, (_, i) => 0.3 + 0.7 * Math.abs(Math.sin(i * 1.7)));

export function SortieEnTrois({
  /** Vrai tant que l'écran d'ouverture est là : on ne joue rien derrière. */
  actif,
  /** Prévient le parent qu'on a pris la main — la ronde des exemples s'arrête. */
  onPrendreLaMain,
}: {
  actif: boolean;
  onPrendreLaMain: () => void;
}) {
  const soiree = SOIREES.kiosque;
  const essai = soiree.essais[0];
  const [temps, setTemps] = useState<Temps>("annonce");
  /** Vrai dès le premier appui : la suite se fait au doigt, plus au minuteur. */
  const [aLaMain, setALaMain] = useState(false);
  const [joue, setJoue] = useState(false);
  const [reste, setReste] = useState(essai?.duree ?? 10);
  const audio = useRef<HTMLAudioElement | null>(null);

  /**
   * LA RONDE DES TROIS TEMPS, TANT QUE PERSONNE N'A TOUCHÉ.
   *
   * L'écran d'ouverture est une DÉMONSTRATION : quelqu'un qui le regarde sans
   * rien faire doit voir les trois temps passer, sinon il ne sait pas qu'ils
   * existent et n'a aucune raison d'appuyer. Dès le premier appui, elle se
   * tait pour de bon — on ne reprend pas la main à quelqu'un qui vient de la
   * prendre.
   */
  useEffect(() => {
    if (!actif || aLaMain) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      setTemps((v) => TEMPS[(TEMPS.indexOf(v) + 1) % TEMPS.length]);
    }, 2600);
    return () => window.clearInterval(t);
  }, [actif, aLaMain]);

  /**
   * L'ÉCRAN D'OUVERTURE DISPARAÎT : LE SON S'ARRÊTE AVEC LUI, TOUJOURS.
   *
   * ON NE TOUCHE PAS `joue` ICI, et ce n'est pas un détail de style : c'est
   * l'élément audio qui sait s'il joue, pas nous. Le mettre à faux à la main
   * ouvre la porte aux deux états qui se contredisent — bouton en pause,
   * musique en cours — le jour où la lecture s'arrête pour une raison qu'on
   * n'a pas prévue. `onPlay` et `onPause`, plus bas, sont la seule source.
   */
  useEffect(() => {
    if (actif) return;
    try {
      audio.current?.pause();
    } catch {
      /* best-effort */
    }
  }, [actif]);

  const prendre = () => {
    if (!aLaMain) {
      setALaMain(true);
      onPrendreLaMain();
    }
  };

  const suivant = () => {
    prendre();
    setTemps((v) => TEMPS[(TEMPS.indexOf(v) + 1) % TEMPS.length]);
  };

  /**
   * ÉCOUTER, VRAIMENT — c'est la demande, et c'est le cœur de l'exemple.
   *
   * L'extrait ne se charge QU'À L'APPUI (`preload="none"`) : quatre cent
   * quarante kilooctets sur l'écran que tout le monde voit au premier
   * lancement, souvent en quatre G, pour un son qu'on n'écoutera peut-être
   * pas. C'est la même règle que dans le vrai écran de la soirée.
   */
  const basculer = () => {
    prendre();
    const a = audio.current;
    if (!a) return;
    if (joue) {
      a.pause();
      return;
    }
    // `onPlay` allume le bouton quand le son démarre vraiment. Un appui refusé
    // par le navigateur — ce qui arrive tant qu'on n'a pas interagi avec la
    // page — ne laisse donc pas un bouton « en lecture » sur un silence.
    a.play().catch(() => {
      /* lecture refusée : le bouton reste tel qu'il est */
    });
  };

  const dernier = temps === "live";

  return (
    <div className="s3">
      <Styles />
      <div
        className="s3-fond"
        style={{ backgroundImage: `url("${soiree.photo}")` }}
        aria-hidden="true"
      />
      <div className="s3-voile" aria-hidden="true" />

      {/* ═══ LE FANTÔME RESTE LE GUIDE DE CET ÉCRAN ════════════════════════

          « Le Fantôme doit être le guide de cette animation. » Il l'est sur
          les quatre autres exemples, posé devant les cartes — et il avait
          disparu de celui-ci en même temps qu'elles.

          IL EST EN HAUT ICI, ET PAS DEVANT. La carte occupe le bas du cadre
          et porte un bouton qu'on doit pouvoir toucher : un Fantôme posé
          par-dessus mangerait l'onde et le bouton d'écoute. Il occupe donc le
          haut, qui était vide, et regarde la carte. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className="s3-f" aria-hidden="true">
        <img src="/clikme-fantome.png" alt="" />
      </span>

      {/* LES TROIS POINTS DISENT OÙ L'ON EN EST. Sans eux, « suivant » mène
          quelque part sans qu'on sache combien il en reste — et on n'appuie
          pas sur un bouton qui ne dit pas où il va. */}
      <div className="s3-rang" aria-hidden="true">
        {TEMPS.map((t) => (
          <i key={t} className={t === temps ? "on" : ""} />
        ))}
      </div>

      <div className="s3-carte" key={temps}>
        {/* ═══ L'ANNONCE — DE QUELLE SOIRÉE ON PARLE ═══════════════════════

            ELLE PORTE CE QU'UNE ANNONCE PORTE, et rien de plus : le lieu,
            l'heure, ce qu'on propose. Ce sont les trois choses qu'il faut
            savoir avant de décider si l'on veut écouter dix secondes de
            musique, et ce sont exactement celles que l'exemple ne disait pas.

            LE COMPTE DES INTENTIONS EST DESSOUS, parce qu'il annonce la suite :
            quelqu'un a déjà dit ce qu'il cherchait ce soir, donc l'écran des
            envies ne sortira pas de nulle part. */}
        {temps === "annonce" && (
          <>
            <span className="s3-ch">◉ {soiree.quand.toUpperCase()}</span>
            <p className="s3-t">
              {soiree.lieu.split(" ").slice(0, 1).join(" ")}{" "}
              <b>{soiree.lieu.split(" ").slice(1).join(" ")}</b>
            </p>
            <p className="s3-ann">{soiree.phrase}</p>
            <span className="s3-plus s3-cpt">
              <b>{soiree.intentions}</b> ont déjà dit ce qu’ils cherchent
            </span>
          </>
        )}

        {temps === "son" && essai && (
          <>
            <div className="s3-h">
              <span className="s3-ch">♫ {essai.chapeau}</span>
              {essai.etiquette && (
                <span className="s3-et">
                  <b>{essai.etiquette.haut}</b>
                  <em>{essai.etiquette.bas}</em>
                </span>
              )}
            </div>
            <p className="s3-t">{essai.titre}</p>
            {essai.media && (
              <audio
                ref={audio}
                src={essai.media}
                preload="none"
                onTimeUpdate={(e) => {
                  const a = e.currentTarget;
                  setReste(Math.max(0, Math.ceil((a.duration || 10) - a.currentTime)));
                }}
                onPlay={() => setJoue(true)}
                onPause={() => setJoue(false)}
                onEnded={() => setReste(essai.duree ?? 10)}
              />
            )}
            <div className="s3-onde">
              {ONDE.slice(0, 17).map((n, i) => (
                <i key={`g${i}`} className={joue ? "joue" : ""} style={{ height: `${Math.round(n * 100)}%` }} />
              ))}
              <button
                type="button"
                className={`s3-lire${joue ? " joue" : ""}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={basculer}
                aria-label={joue ? "Mettre l’extrait en pause" : "Écouter l’extrait"}
              >
                {joue ? "❚❚" : "▶"}
              </button>
              {ONDE.slice(17).map((n, i) => (
                <i key={`d${i}`} className={joue ? "joue" : ""} style={{ height: `${Math.round(n * 100)}%` }} />
              ))}
            </div>
            <span className="s3-duree">00:{String(reste).padStart(2, "0")}</span>
          </>
        )}

        {temps === "envies" && (
          <>
            <span className="s3-ch">VOTRE FANTÔME</span>
            <p className="s3-t">
              Et vous, qu’est-ce que <b>vous cherchez ce soir&nbsp;?</b>
            </p>
            {/* TROIS DES SIX, ET LE COMPTE DU RESTE.
                MESURÉ À L'ÉCRAN, ET ÇA A COÛTÉ UN FANTÔME : à quatre, la carte
                mangeait toute la hauteur du cadre et le Fantôme se réduisait à
                un point. Il absorbe la place qui reste — c'est ce qui
                l'empêche d'être coupé — donc chaque ligne de trop la lui
                prend. Trois suffisent à faire comprendre qu'on CHOISIT, et
                « +3 autres » dit ce qu'on ne montre pas au lieu de laisser
                croire qu'il n'y a que ça. */}
            <ul className="s3-env">
              {INTENTIONS.slice(0, 3).map((x) => (
                <li key={x.cle}>
                  <b>{x.emoji}</b>
                  <span>
                    <u>{x.mot}</u>
                    <em>{x.detail}</em>
                  </span>
                </li>
              ))}
            </ul>
            <span className="s3-plus">+{INTENTIONS.length - 3} autres · personne ne verra votre nom</span>
          </>
        )}

        {temps === "live" && (
          <>
            <span className="s3-ch">◉ EN DIRECT</span>
            <p className="s3-t">
              Le Live <b>de ce soir</b>
            </p>
            <span className="s3-plus s3-cpt">
              <b>{soiree.dansLeLive}</b> personnes dans le Live
            </span>
            <ul className="s3-live">
              {soiree.live.slice(0, 3).map((m) => (
                <li key={m.id}>
                  <b className={m.maison ? "maison" : ""}>{m.qui}</b>
                  <span>{m.mot}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* ═══ « SUIVANT », ET IL EXISTE PARCE QU'IL L'A DEMANDÉ ══════════════

          C'est le seul bouton de tout l'écran d'ouverture qui fasse avancer le
          récit au doigt. Sur le dernier temps il boucle plutôt que de
          s'éteindre : un bouton qui disparaît laisse le pouce en l'air, et on
          ne saurait pas comment revenir au son qu'on voulait écouter. */}
      <button
        type="button"
        className="s3-suiv"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={suivant}
      >
        {dernier ? "Revoir l’annonce" : "Suivant"}
        <s aria-hidden="true">{dernier ? "↺" : "→"}</s>
      </button>
    </div>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
/* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
   litteral de gabarit et un seul terminerait la chaine.
   npm run verifier:styles le mesure avant chaque construction. */
.s3{position:relative;width:100%;height:100%;border-radius:22px;
  overflow:hidden;display:flex;flex-direction:column;
  justify-content:flex-end;gap:10px;padding:12px;
  background:#0B0714;}
.s3-fond{position:absolute;inset:0;background-size:cover;
  background-position:center 40%;}
.s3-voile{position:absolute;inset:0;
  background:linear-gradient(to bottom,rgba(11,7,20,.34) 0%,
    rgba(11,7,20,.72) 44%,rgba(11,7,20,.94) 100%);}
/* ─── LE FANTOME PREND LA PLACE QUI RESTE, ET JAMAIS CELLE DE LA CARTE ───
   Pose en absolu, il passait DERRIERE la carte : sur le temps des envies,
   qui est le plus haut des trois, on ne voyait plus que sa casquette. C'est
   le defaut qu'il avait deja releve une fois — un fantome coupe n'est pas un
   guide, c'est un accident de mise en page.
   Il est donc dans le flux, en premier, et il absorbe la hauteur libre : une
   part de flex avec une hauteur minimale nulle le laisse se reduire jusqu'a
   disparaitre quand la carte est haute, sans jamais la recouvrir ni deborder
   du cadre. */
.s3-f{position:relative;flex:1;min-height:0;display:flex;
  align-items:flex-end;justify-content:center;
  pointer-events:none;
  animation:s3Flotte 3.4s ease-in-out infinite alternate;}
.s3-f img{max-height:100%;max-width:46%;object-fit:contain;
  filter:drop-shadow(0 10px 26px rgba(229,107,224,.42));}
@keyframes s3Flotte{from{transform:translateY(0);}to{transform:translateY(-7px);}}
.s3-rang{position:relative;display:flex;gap:5px;justify-content:center;}
.s3-rang i{width:14px;height:3px;border-radius:99px;background:rgba(255,255,255,.26);
  transition:background .2s ease;}
.s3-rang i.on{background:#E56BE0;}

/* LE TEXTE DE L'ANNONCE — deux lignes, pas plus : c'est une annonce, pas une
   fiche. Ce qui vient apres (le son, les envies, le Live) repond deja au
   « comment c'est ». */
.s3-ann{margin:6px 0 0;font-size:12px;line-height:1.35;
  color:rgba(255,255,255,.76);}

.s3-carte{position:relative;border-radius:18px;padding:13px 14px;
  background:rgba(22,14,36,.82);border:1px solid rgba(229,107,224,.34);
  backdrop-filter:blur(7px);
  animation:s3Entre .34s cubic-bezier(.2,.7,.3,1) both;}
@keyframes s3Entre{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}

.s3-h{display:flex;align-items:center;justify-content:space-between;gap:9px;}
.s3-ch{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;
  color:#E56BE0;}
.s3-et{flex:none;text-align:center;border-radius:11px;padding:4px 9px;
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);}
.s3-et b{display:block;font-size:9.5px;font-weight:800;letter-spacing:.05em;color:#fff;}
.s3-et em{display:block;font-style:normal;font-size:9px;color:rgba(255,255,255,.62);}
.s3-t{margin:7px 0 0;font-size:14px;line-height:1.28;font-weight:700;color:#fff;}
.s3-t b{color:#E56BE0;}

.s3-onde{display:flex;align-items:center;justify-content:center;gap:2px;
  height:46px;margin-top:10px;}
.s3-onde i{flex:1;min-width:2px;max-width:4px;border-radius:99px;
  background:linear-gradient(to top,#8B5CF6,#E56BE0);opacity:.55;
  transition:opacity .2s ease;}
.s3-onde i.joue{opacity:1;animation:s3Onde .9s ease-in-out infinite alternate;}
.s3-onde i.joue:nth-child(3n){animation-duration:1.25s;}
.s3-onde i.joue:nth-child(4n){animation-duration:.7s;}
@keyframes s3Onde{from{transform:scaleY(.45);}to{transform:scaleY(1);}}
.s3-lire{flex:none;width:44px;height:44px;margin:0 8px;border-radius:999px;
  border:none;cursor:pointer;font-size:15px;color:#fff;
  background:linear-gradient(135deg,#8B5CF6,#E56BE0);
  box-shadow:0 6px 18px rgba(229,107,224,.45);}
.s3-lire.joue{box-shadow:0 0 0 6px rgba(229,107,224,.18);}
.s3-duree{display:block;text-align:right;margin-top:2px;font-size:10.5px;
  color:rgba(255,255,255,.55);}

.s3-env{list-style:none;margin:9px 0 0;padding:0;display:grid;gap:5px;}
.s3-env li{display:flex;align-items:center;gap:8px;padding:6px 9px;
  border-radius:11px;background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.09);}
.s3-env b{flex:none;font-size:13px;}
.s3-env u{display:block;text-decoration:none;font-size:11.5px;font-weight:700;color:#fff;}
.s3-env em{display:block;font-style:normal;font-size:9.5px;color:rgba(255,255,255,.5);}
.s3-plus{display:block;margin-top:8px;font-size:10px;color:rgba(255,255,255,.5);}
.s3-cpt b{color:#fff;font-size:12px;}

.s3-live{list-style:none;margin:9px 0 0;padding:0;display:grid;gap:5px;}
.s3-live li{padding:6px 9px;border-radius:11px;background:rgba(255,255,255,.06);
  border:1px solid rgba(255,255,255,.09);}
.s3-live b{display:block;font-size:10px;color:#E56BE0;}
.s3-live b.maison{color:#FFC55B;}
.s3-live span{display:block;font-size:11px;line-height:1.3;color:rgba(255,255,255,.82);}

.s3-suiv{position:relative;display:flex;align-items:center;justify-content:center;
  gap:8px;width:100%;font:inherit;font-size:13px;font-weight:800;cursor:pointer;
  padding:11px;border-radius:999px;border:none;color:#fff;
  background:linear-gradient(135deg,#8B5CF6,#E56BE0);
  box-shadow:0 8px 22px rgba(139,92,246,.4);}
.s3-suiv s{text-decoration:none;font-size:14px;}

@media (prefers-reduced-motion: reduce){
  .s3-carte{animation:none;}
  .s3-f{animation:none;}
  .s3-onde i.joue{animation:none;}
}
`,
      }}
    />
  );
}
