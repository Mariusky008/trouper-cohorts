"use client";

// L'AUTRE BOUT DU FIL — ce que voit quelqu'un dans la rue, à midi.
//
// CE QU'ELLE RÉSOUT. Toute la page est écrite du côté du commerçant : ce qu'il
// dit, ce que ça devient, ce que ça lui rapporte. C'est cohérent et ça laisse
// entière la seule question qu'il se pose vraiment — « est-ce que quelqu'un
// regarde ? ». On ne répond pas à cette question en l'affirmant. On y répond en
// montrant l'autre bout du fil.
//
// ET C'EST LE MÊME TÉLÉPHONE QUI CHANGE, pas quatre écrans côte à côte. C'est
// tout l'argument, et il tient dans cette contrainte : un annuaire ne PEUT pas
// faire ça. Google sait qui existe dans la rue ; il ne sait pas qu'il reste
// huit parts de lasagnes à 14 h 10. Quatre heures, dans l'ordre, sur un seul
// appareil — et la démonstration se passe de la phrase qui l'explique.
//
// LA BOUCLE SE REFERME SUR LA DEUXIÈME CARTE. Plus haut, la page montre le
// restaurateur qui dit « Il me reste 8 lasagnes maison. » ; ici, à 14 h 10, la
// même chose réapparaît dans le téléphone de quelqu'un d'autre, à 180 mètres.
// C'est le seul endroit de la page où les deux moitiés se touchent, et c'est
// pour ça que cette section est placée ENTRE la phrase du commerçant et sa
// journée entière — dans cet ordre, la page raconte la boucle au lieu de la
// décrire.
//
// PAS DE VOIX, PAS DE BOUTON « LANCER ». La visite guidée du site d'un
// commerçant dure 2 min 25 et se mérite ; celle-ci se regarde sans rien
// demander, en défilant. Elle démarre quand elle entre à l'écran, s'arrête
// quand elle en sort, et les quatre heures sont cliquables pour qui veut
// reprendre la main.
//
// CE QU'ELLE NE MONTRE PAS. Aucune recherche par envie, aucun filtre par prix,
// aucun compteur de gens qui cherchent, aucune alerte. Rien de tout ça
// n'existe dans le produit — voir `momentsDeLaJournee` dans `cartes-demo.ts`,
// où la règle est écrite au long.
import { useEffect, useRef, useState } from "react";
import {
  BarreDirect,
  CarteSwipe,
  GestesDirect,
  StylesDirect,
} from "@/components/direct/carte-swipe";
import { momentsDeLaJournee, motDActionMetier } from "@/lib/direct/cartes-demo";
import { MARQUE } from "@/lib/marque";

// « votre ville » plutôt qu'une ville réelle : le lecteur est un commerçant de
// n'importe où, et nommer Dax en page d'accueil lui dirait que ça ne le
// concerne pas.
const VILLE = "votre ville";
const MOMENTS = momentsDeLaJournee(VILLE);
/** Le mot du milieu suit le métier — jamais un libellé inventé pour la page. */
const ACTION = motDActionMetier("Restaurant");
/** Le temps qu'on laisse à chaque heure. Assez pour lire la carte en entier. */
const DUREE_MS = 5200;

export function Habitant() {
  const [i, setI] = useState(0);
  /** Passe à faux dès que le visiteur choisit une heure : il a pris la main. */
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const cadre = useRef<HTMLDivElement | null>(null);

  // ON NE JOUE QUE CE QUI EST REGARDÉ. Une horloge qui tourne dans une section
  // sortie de l'écran fait défiler la journée pour personne : le visiteur
  // revient au milieu d'une séquence dont il a raté le début.
  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      // Sans observateur, on joue toujours — mais pas dans le corps de l'effet
      // (le compilateur React l'interdit, et il a raison : un `setState`
      // synchrone ici relance un rendu en cascade). Un tour de boucle suffit,
      // et il laisse aussi l'hydratation se terminer avant qu'on change l'état.
      const t = window.setTimeout(() => setVisible(true), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entrees) => entrees.forEach((e) => setVisible(e.isIntersecting)),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible) return;
    // Une image qui change toute seule toutes les cinq secondes est exactement
    // ce que ce réglage demande d'arrêter.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % MOMENTS.length), DUREE_MS);
    return () => window.clearInterval(t);
  }, [auto, visible]);

  const m = MOMENTS[i];

  return (
    <section className="hab">
      <StylesDirect />
      <div className="wrap">
        <div className="hab-tete reveal">
          <div className="hab-k">De l&apos;autre côté</div>
          <h2 className="hab-h">
            Pendant ce temps, quelqu&apos;un dans la rue se demande où manger.
          </h2>
          <div className="hab-q">
            <span>«&nbsp;Où manger&nbsp;?&nbsp;»</span>
            <span>«&nbsp;Qu&apos;est-ce qu&apos;on mange aujourd&apos;hui&nbsp;?&nbsp;»</span>
          </div>
          <p className="hab-p">
            Il n&apos;ouvre pas un annuaire. Il ouvre <b>Le Direct de sa ville</b>, et il y voit ce
            qui se passe maintenant, à deux cents mètres.
          </p>
        </div>

        <div className="hab-scene reveal" ref={cadre} style={{ ["--teinte" as string]: m.teinte }}>
          {/* L'HEURE EST AU-DESSUS DU TÉLÉPHONE, PAS DEDANS. Posée dans l'écran
              elle se lit comme l'horloge du système ; posée au-dessus, elle se
              lit comme « voilà quand ». C'est elle le sujet de la scène. */}
          <div className="hab-h-row" aria-live="polite">
            <b className="hab-heure">{m.heure}</b>
            <span className="hab-rub">{m.rubrique}</span>
          </div>

          <div className="hab-tel">
            <div className="hab-ecran">
              {/* PAS DE PASTILLE AGENDA ICI. Avec quatre éléments, le bandeau
                  dépasse la largeur de l'écran et c'est la marque qui se fait
                  couper — « Clik… », mesuré au navigateur. On garde ce qui sert
                  la démonstration : où on est, et ce qu'on a gardé. */}
              <BarreDirect marque={MARQUE} ville={VILLE} gardees={1} />
              {/* La clé force le remontage : sans elle, React réutilise le même
                  nœud et la carte change de contenu sans bouger — on croit à un
                  rafraîchissement, pas à une autre carte. */}
              <CarteSwipe key={m.heure} carte={m.carte} className="hab-carte" />
              <GestesDirect action={ACTION} />
            </div>
          </div>

          {/* LES QUATRE HEURES SONT DE VRAIS BOUTONS. Elles servent trois fois :
              elles annoncent que la journée a quatre temps (donc qu'il faut
              rester), elles laissent reprendre la main, et elles sont le seul
              contenu qui reste quand l'animation est coupée. */}
          {/* DES BOUTONS, PAS UN « TABLIST ». Le motif onglets suppose un
              panneau qui les suit dans le document ; ici le panneau est
              AU-DESSUS, et annoncer des onglets sans panneau associé
              désoriente un lecteur d'écran plus qu'il ne l'aide. Des boutons
              pressés, et l'heure courante annoncée par la ligne au-dessus, qui
              porte déjà aria-live. */}
          <div className="hab-heures">
            {MOMENTS.map((x, n) => (
              <button
                key={x.heure}
                type="button"
                aria-pressed={n === i}
                aria-label={`Voir ${x.heure} — ${x.rubrique}`}
                className={`hab-t${n === i ? " on" : ""}`}
                style={{ ["--teinte" as string]: x.teinte }}
                onClick={() => {
                  setI(n);
                  setAuto(false);
                }}
              >
                {x.heure}
                {n === i && auto && visible && (
                  <span key={`${i}-${auto}`} className="hab-jauge" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          <p className="hab-legende">
            Le même téléphone. <b>La ville change.</b>
          </p>
        </div>

        {/* LA BOUCLE, ET ELLE EST LITTÉRALEMENT CE QU'ON VIENT DE VOIR. Trois
            lignes suffisent parce que les deux premières sont déjà passées à
            l'écran : la phrase du restaurateur en haut de la page, la carte à
            14 h 10 juste au-dessus. */}
        <div className="hab-loop reveal">
          <div className="hab-l">
            <span className="hab-qui">Le restaurateur</span>
            <span className="hab-quoi">«&nbsp;Il me reste 8 lasagnes maison.&nbsp;»</span>
          </div>
          <span className="hab-fl" aria-hidden="true" />
          <div className="hab-l">
            <span className="hab-qui">{MARQUE}</span>
            <span className="hab-quoi">
              <i aria-hidden="true">🔥</i> Dernières portions · 8 € · 180 m
            </span>
          </div>
          <span className="hab-fl" aria-hidden="true" />
          <div className="hab-l">
            <span className="hab-qui">L&apos;habitant, à deux rues</span>
            <span className="hab-quoi">«&nbsp;J&apos;en prends une.&nbsp;»</span>
          </div>
        </div>

        <p className="hab-fin reveal">
          Google sait <b>qui existe</b>.
          <br />
          {MARQUE} sait <b>ce qui se passe</b>.
        </p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ATTENTION : aucun accent grave dans ces commentaires — ce bloc est un
           littéral de gabarit, un seul terminerait la chaîne. */

        /* LE FOND SOMBRE COMMENCE ICI. Tout ce qui precede est clair et parle du
           commercant ; a partir de cette section on est de l'autre cote, dans
           l'ecran de ses clients, et on y reste jusqu'au pied de page. */
        .hab{background:radial-gradient(120% 55% at 50% 0%,#141F2C 0%,#080D0B 64%),#080D0B;
          color:#EAF2EC;padding:74px 0 62px;}
        .hab .wrap{max-width:760px;margin:0 auto;padding:0 20px;}

        .hab-tete{text-align:center;max-width:580px;margin:0 auto 34px;}
        .hab-k{font-size:11.5px;font-weight:850;letter-spacing:.16em;text-transform:uppercase;
          color:#7FA8CE;margin-bottom:12px;}
        .hab-h{font-size:26px;line-height:1.24;letter-spacing:-.025em;font-weight:850;color:#fff;
          margin:0;text-wrap:balance;}
        .hab-q{display:flex;flex-wrap:wrap;justify-content:center;gap:9px;margin:18px 0 16px;}
        .hab-q span{font-family:Georgia,serif;font-size:16px;color:#fff;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
          border-radius:999px;padding:9px 16px;}
        .hab-p{font-size:17px;line-height:1.5;color:#C7D8CE;margin:0;text-wrap:balance;}
        .hab-p b{color:#fff;font-weight:800;}

        .hab-scene{display:flex;flex-direction:column;align-items:center;gap:14px;}

        .hab-h-row{display:flex;align-items:baseline;gap:11px;flex-wrap:wrap;justify-content:center;
          min-height:26px;}
        .hab-heure{font-family:'Inter',system-ui,sans-serif;font-size:15px;font-weight:850;
          letter-spacing:.1em;color:var(--teinte,#3DE2A6);font-variant-numeric:tabular-nums;
          white-space:nowrap;transition:color .4s ease;}
        .hab-rub{font-size:19px;font-weight:800;letter-spacing:-.02em;color:#fff;}

        /* LE CADRE DE TELEPHONE N'EST PAS UNE DECORATION : sans lui, la carte
           posee sur le fond sombre a l'air d'etre un element de la page, et on
           ne comprend pas qu'on regarde par-dessus l'epaule de quelqu'un. */
        .hab-tel{border:1px solid rgba(255,255,255,.14);border-radius:30px;padding:12px 10px 8px;
          background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.01));
          box-shadow:0 0 0 1px rgba(0,0,0,.5),0 42px 80px -34px rgba(0,0,0,.95),
            0 0 60px -20px color-mix(in srgb,var(--teinte,#3DE2A6) 40%,transparent);
          transition:box-shadow .5s ease;}
        /* L'ECRAN EST REDUIT EN ENTIER, PAS SEULEMENT LA CARTE. En ne zoomant
           que la carte, le bandeau du haut gardait sa taille reelle et devenait
           plus large qu'elle : la marque passait par-dessus la ville. On reduit
           donc le bloc complet — bandeau, carte et gestes gardent entre eux les
           proportions du vrai telephone. 340 px est la largeur native du
           bandeau ; sous cette valeur, rien n'a la place. */
        .hab-ecran{width:340px;zoom:.8;display:flex;flex-direction:column;gap:10px;}
        .hab-carte{animation:habArrive .55s cubic-bezier(.16,1,.3,1);}
        @keyframes habArrive{
          from{opacity:0;transform:translate3d(0,16px,0) scale(.97);}
          to{opacity:1;transform:none;}
        }

        .hab-heures{display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin-top:4px;}
        .hab-t{position:relative;overflow:hidden;font:inherit;font-size:12.5px;font-weight:850;
          letter-spacing:.05em;font-variant-numeric:tabular-nums;cursor:pointer;
          color:#7F988B;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:8px 14px;
          transition:color .3s ease,border-color .3s ease,background .3s ease;}
        .hab-t:hover{color:#C7D8CE;}
        .hab-t.on{color:var(--teinte,#3DE2A6);border-color:color-mix(in srgb,var(--teinte,#3DE2A6) 55%,transparent);
          background:color-mix(in srgb,var(--teinte,#3DE2A6) 12%,transparent);}
        /* La jauge dit combien de temps il reste sur cette heure. Sans elle, le
           changement automatique surprend a chaque fois. */
        .hab-jauge{position:absolute;left:0;bottom:0;height:2px;width:100%;
          transform-origin:left;background:var(--teinte,#3DE2A6);
          animation:habJauge ${DUREE_MS}ms linear forwards;}
        @keyframes habJauge{from{transform:scaleX(0);}to{transform:scaleX(1);}}

        .hab-legende{margin:6px 0 0;font-size:16px;color:#7F988B;text-align:center;}
        .hab-legende b{color:#fff;font-weight:850;}

        /* LA BOUCLE. Trois etages, une fleche entre chacun : c'est le schema le
           plus simple qui montre que le commercant et l'habitant sont les deux
           bouts d'un meme fil. */
        .hab-loop{max-width:420px;margin:44px auto 0;display:flex;flex-direction:column;
          align-items:center;gap:0;}
        .hab-l{width:100%;text-align:center;background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.11);border-radius:16px;padding:13px 16px;}
        .hab-qui{display:block;font-size:10.5px;font-weight:850;letter-spacing:.14em;
          text-transform:uppercase;color:#7F988B;margin-bottom:5px;}
        .hab-quoi{display:block;font-family:Georgia,serif;font-size:16px;color:#fff;}
        .hab-quoi i{font-style:normal;}
        .hab-fl{width:2px;height:20px;background:linear-gradient(180deg,rgba(126,230,192,.15),#3DE2A6);}

        .hab-fin{margin:40px 0 0;text-align:center;font-size:23px;line-height:1.36;
          letter-spacing:-.02em;color:#7F988B;text-wrap:balance;}
        .hab-fin b{color:#fff;font-weight:850;}

        @media (min-width:720px){
          .hab{padding:96px 0 76px;}
          .hab-h{font-size:33px;}
          .hab-ecran{zoom:.92;}
          .hab-fin{font-size:28px;}
        }
        @media (prefers-reduced-motion:reduce){
          .hab-carte{animation:none;}
          .hab-jauge{display:none;}
        }
      `,
        }}
      />
    </section>
  );
}
