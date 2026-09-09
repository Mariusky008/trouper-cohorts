"use client";

// 👻 LE MUR DU JOUR — l'écran.
//
// Le pourquoi est en tête de `page.tsx`, le concept en tête de
// `lib/direct/fantomes.ts`. Ici, les cinq décisions d'écran, et elles découlent
// toutes du test : « en une seconde, ai-je envie de voir le suivant ? »
//
// ═══ 1. UN FANTÔME PAR ÉCRAN, ET LA PHOTO EST L'ÉCRAN ═════════════════════
//
// La leçon du paquet, reprise telle quelle : « l'image semble être dans un
// rectangle, et quand on scrolle on voit trop les bordures ; chez eux la photo
// prend tout le cadre et c'est plus beau. » Une photo encadrée se regarde, une
// photo plein cadre se REGARDE. Le mot et le geste se posent dessus, sur un
// voile dégradé — jamais sur un fond plein, qui serait une bordure de plus.
//
// ═══ 2. LE GESTE EST TOUJOURS AU MÊME ENDROIT ═════════════════════════════
//
// « Ça m'intéresse » ne bouge pas d'un fantôme à l'autre, ne change pas de
// taille et ne change pas de couleur. Un bouton qu'on retrouve sans le chercher
// se presse ; un bouton qu'on relocalise à chaque écran se lit d'abord, et lire
// coûte la seconde qu'on n'a pas.
//
// ═══ 3. « SUIVANT » DOIT ÊTRE PLUS FACILE QUE TOUT LE RESTE ═══════════════
//
// Trois chemins pour le même geste, et ce n'est pas du luxe : le balayage pour
// qui connaît, la moitié droite de l'écran pour qui essaie, les flèches pour qui
// doute. Le mur ne vaut que si l'on en voit six ; s'il faut viser, on en voit
// deux.
//
// ═══ 4. LE COMPTEUR RESTE PETIT ═══════════════════════════════════════════
//
// « Ça m'intéresse · 8 » n'est pas un score. Le jour où le chiffre devient gros,
// on a refabriqué le like — et un like est gratuit, donc il ne veut rien dire.
// Celui-ci engage : huit, ce sont huit personnes prêtes à parler.
//
// ═══ 5. CE QUI SUIT L'APPUI EST UNE MISE EN RELATION, PAS UN MERCI ════════
//
// C'est là que le produit se gagne ou se perd. « Merci pour votre retour »
// tuerait la mécanique en trois mots : on n'a pas voté, on a dit qu'on était
// disponible. La feuille qui monte dit donc ce que CETTE personne cherche, et
// propose de lui écrire.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MURS,
  QUOTA_DU_JOUR,
  miseEnRelation,
  motDeLIntention,
  motDuVerbe,
  type Fantome,
} from "@/lib/direct/fantomes";

/** Le dessin du fantôme, en petit : la signature, pas une illustration. */
function Signe({ classe }: { classe?: string }) {
  return (
    <svg className={classe} viewBox="0 0 40 44" aria-hidden="true">
      <path
        className="fm-f-corps"
        d="M20 2.5c-8.7 0-15.6 6.6-15.6 15.1v18.6c0 2.2 2.3 3.3 3.9 1.9l2.4-2.1c.9-.8 2.2-.8 3.1 0l2.3 2c.9.8 2.2.8 3.1 0l2.3-2c.9-.8 2.2-.8 3.1 0l2.4 2.1c1.6 1.4 3.9.3 3.9-1.9V17.6C35.6 9.1 28.7 2.5 20 2.5Z"
      />
      <ellipse className="fm-f-oeil" cx="14.4" cy="18.4" rx="2.1" ry="2.6" />
      <ellipse className="fm-f-oeil" cx="25.6" cy="18.4" rx="2.1" ry="2.6" />
      <path className="fm-f-bouche" d="M16.2 25.6c1 1.5 2.3 2.2 3.8 2.2s2.8-.7 3.8-2.2" />
    </svg>
  );
}

/**
 * L'ÉTIQUETTE DE GENRE — ce que ce fantôme est venu faire.
 *
 * ELLE PASSE AVANT LE MOT, ET C'EST L'ORDRE DE LECTURE : « JE CHERCHE » dit en
 * un coup d'oeil qu'il va falloir répondre quelque chose, « ESSAYÉ ICI » qu'on
 * regarde une hésitation. Sans elle, six fantômes de natures différentes
 * défilent avec la même tête, et on ne sait plus ce qu'on lit.
 */
function Etiquette({ f }: { f: Fantome }) {
  if (f.genre === "demande") {
    return <span className="fm-eti demande">{motDuVerbe(f.verbe)?.mot}</span>;
  }
  if (f.genre === "intention") {
    const i = motDeLIntention(f.intention);
    return (
      <span className="fm-eti intention">
        <i aria-hidden="true">{i?.emoji}</i>
        {i?.mot}
      </span>
    );
  }
  if (f.genre === "essai") {
    return (
      <span className="fm-eti essai">
        <i aria-hidden="true">✨</i>
        Essayé ici · {f.essai?.quoi}
      </span>
    );
  }
  return null;
}

export function Mur() {
  const [cle, setCle] = useState("margot");
  const mur = useMemo(() => MURS.find((m) => m.cle === cle) ?? MURS[0], [cle]);
  const [rang, setRang] = useState(0);
  /** Ceux sur lesquels on a appuyé. Le compteur monte d'un, jamais de deux. */
  const [dits, setDits] = useState<string[]>([]);
  /** La feuille de mise en relation, quand elle est ouverte. */
  const [relation, setRelation] = useState<Fantome | null>(null);
  const [sens, setSens] = useState<"avant" | "arriere">("avant");

  const f = mur.fantomes[Math.min(rang, mur.fantomes.length - 1)];
  const dit = dits.includes(f.id);

  useEffect(() => {
    setRang(0);
    setRelation(null);
  }, [cle]);

  const bouger = (pas: number) => {
    setSens(pas > 0 ? "avant" : "arriere");
    setRang((r) => {
      const n = r + pas;
      if (n < 0) return 0;
      if (n > mur.fantomes.length - 1) return mur.fantomes.length - 1;
      return n;
    });
    setRelation(null);
  };

  /**
   * LE BALAYAGE, ET IL NE SE DÉCLENCHE QUE SUR UN VRAI GESTE.
   *
   * QUARANTE POINTS ET PLUS HORIZONTAL QUE VERTICAL. En dessous, c'est un doigt
   * qui se pose pour appuyer, et une carte qui part sous le pouce au moment où
   * l'on vise « Ça m'intéresse » est la façon la plus rapide de faire lâcher
   * l'écran.
   */
  const depart = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    depart.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: React.PointerEvent) => {
    const d = depart.current;
    depart.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    bouger(dx < 0 ? 1 : -1);
  };

  const interesse = () => {
    if (dit) {
      setRelation(f);
      return;
    }
    setDits((l) => [...l, f.id]);
    setRelation(f);
  };

  const combien = f.interesses + (dit ? 1 : 0);
  const rel = miseEnRelation(f);

  return (
    <div className="fm">
      <Styles />

      {/* ─── LE SELECTEUR DE MAQUETTE ───
          TROIS MURS ET PAS UN, parce qu'ils sont trois EPREUVES et pas trois
          exemples : un restaurant dont le mur parle surtout d'autre chose, un
          bar ou le contenu est une intention, une onglerie ou c'est un essai.
          Si le meme ecran tient les trois sans se tordre, le concept tient.
          Il disparait a l'atterrissage. */}
      <div className="fm-maq">
        {MURS.map((m) => (
          <button
            key={m.cle}
            type="button"
            className={m.cle === mur.cle ? "on" : ""}
            onClick={() => setCle(m.cle)}
          >
            {m.lieu}
          </button>
        ))}
      </div>

      <div className="fm-ecran" onPointerDown={onDown} onPointerUp={onUp}>
        {/* LA PHOTO EST L'ECRAN. Le voile la garde lisible sans l'encadrer. */}
        {f.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={`fm-photo ${sens}`} key={f.id} src={f.photo} alt="" />
        ) : (
          <div className="fm-photo vide" aria-hidden="true" />
        )}
        <div className="fm-voile" aria-hidden="true" />

        <header className="fm-haut">
          <Link className="fm-retour" href="/autour-de-moi" prefetch={false}>
            <i aria-hidden="true">←</i>
          </Link>
          <div className="fm-titre">
            <b>Le mur du jour</b>
            <em>
              {mur.lieu} · {mur.ville}
            </em>
          </div>
          {/* LE QUOTA EST ECRIT D'AVANCE. Un mur invisible sur lequel on se
              cogne est une panne ; annonce, il devient une raison de choisir ou
              l'on se pose. */}
          {/* UN CHIFFRE NU A COTE D'UN FANTOME SE LIT « TROIS FANTOMES ICI »,
              c'est-a-dire l'inverse de ce qu'il dit. Le mot coute six lettres
              et enleve l'ambiguite. */}
          <span className="fm-quota">
            <Signe classe="fm-quota-s" />
            {QUOTA_DU_JOUR} restants
          </span>
        </header>

        {/* LES DEUX MOITIES DE L'ECRAN AVANCENT ET RECULENT. Elles sont sous
            tout le reste : elles ne prennent le doigt que la ou il n'y a rien. */}
        <button
          type="button"
          className="fm-zone gauche"
          aria-label="Fantôme précédent"
          onClick={() => bouger(-1)}
        />
        <button
          type="button"
          className="fm-zone droite"
          aria-label="Fantôme suivant"
          onClick={() => bouger(1)}
        />

        <div className={`fm-bas ${sens}`} key={`${f.id}-bas`}>
          <div className="fm-qui">
            <Signe classe="fm-signe" />
            <b>{f.qui}</b>
            {/* LES FANTOMES DE LA MAISON SONT MARQUES, ET CE N'EST PAS
                NEGOCIABLE : un fantome du patron qui passerait pour un client,
                c'est un faux avis.
                UNE SEULE PASTILLE, PAS DEUX. Il y en avait une pour le role et
                une pour « ici » : « CHEF ICI » se lisait comme deux etiquettes
                sans rapport. Le role EST la marque — un client n'en a jamais —
                et la menthe suffit a le dire. */}
            {f.role && <u className={f.maison ? "maison" : undefined}>{f.role}</u>}
            <em>{f.depuis}</em>
          </div>

          <Etiquette f={f} />

          <p className="fm-mot">{f.mot}</p>

          <div className="fm-pied">
            {/* LA DUREE EST ECRITE SUR CHAQUE FANTOME. C'est ce qui le
                distingue d'une publication : il n'est pas archive, il
                s'efface — et savoir quand change la facon de le lire. */}
            <span className="fm-duree">
              <i aria-hidden="true">⏳</i>
              {f.jusqua}
            </span>
            <span className="fm-rang">
              {rang + 1} / {mur.fantomes.length}
            </span>
          </div>

          <button
            type="button"
            className={`fm-int${dit ? " on" : ""}`}
            aria-pressed={dit}
            onClick={interesse}
          >
            <i aria-hidden="true">👍</i>
            <b>Ça m’intéresse</b>
            <em>{combien}</em>
          </button>

          {/* LA SORTIE, DISCRETE ET PERMANENTE. Le fantome laisse ici remonte
              dans le fil de la ville avec son tampon de lieu : le lieu ancre,
              il n'enferme pas. Sans cette phrase, le mur a l'air d'etre le mur
              du restaurant — et c'est exactement le contresens qu'on veut
              eviter. */}
          <p className="fm-ville">
            Ces fantômes apparaissent aussi dans <b>Le Direct de {mur.ville}</b>.
          </p>
        </div>

        {/* LES FLECHES, POUR QUI NE DEVINE NI LE BALAYAGE NI LES ZONES. */}
        <div className="fm-fleches">
          <button
            type="button"
            disabled={rang === 0}
            aria-label="Précédent"
            onClick={() => bouger(-1)}
          >
            ←
          </button>
          <button
            type="button"
            disabled={rang >= mur.fantomes.length - 1}
            aria-label="Suivant"
            onClick={() => bouger(1)}
          >
            →
          </button>
        </div>
      </div>

      {/* ─── LA MISE EN RELATION ───
          CE N'EST PAS UNE CONFIRMATION. « Merci pour votre retour » tuerait la
          mecanique en trois mots : on n'a pas vote, on a dit qu'on etait
          disponible. La feuille dit donc ce que CETTE personne cherche, et
          propose de lui ecrire. La conversation est privee et temporaire — elle
          ne fabrique ni profil, ni fil, ni abonne. */}
      {relation && (
        <>
          <button
            type="button"
            className="fm-fond"
            aria-label="Fermer"
            onClick={() => setRelation(null)}
          />
          <div className="fm-feuille" role="dialog" aria-modal="true">
            {/* ─── LE TITRE DE LA FEUILLE, ET IL A ETE FAUX ───
                Il disait « votre fantome s'est manifeste ». C'est l'inverse de
                ce qui vient de se passer : personne n'a reagi a MON fantome,
                c'est MOI qui viens de me declarer disponible. Cette phrase-la
                est celle de la notification qu'on recoit plus tard, et la
                confondre brouille exactement la mecanique qu'on essaie de faire
                comprendre. Ce qui doit s'ecrire ici est la promesse du produit,
                mot pour mot : ClikMe vous met en relation. */}
            <div className="fm-f-t">
              <Signe classe="fm-f-signe" />
              <b>ClikMe vous met en relation</b>
            </div>
            <p className="fm-f-q">{rel.quoi}</p>
            <button type="button" className="fm-f-b">
              {rel.geste}
            </button>
            <p className="fm-f-n">
              Conversation privée, le temps que le fantôme vit. Ni profil, ni abonnement, ni
              historique public.
            </p>
            <button type="button" className="fm-f-x" onClick={() => setRelation(null)}>
              Plus tard
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Styles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        /* ATTENTION : pas d'accent grave dans ces commentaires, ce bloc est un
           litteral de gabarit et un seul terminerait la chaine. */

        html:has(.fm),body:has(.fm){height:100%;margin:0;background:#05090C;
          overflow:hidden;overscroll-behavior:none;}

        .fm{--fm-menthe:#3DE2A6;--fm-encre:#EAF2EC;--fm-pale:#A9BDB1;
          position:fixed;inset:0;display:flex;flex-direction:column;
          background:#05090C;color:var(--fm-encre);
          font-family:'Inter',system-ui,-apple-system,sans-serif;
          -webkit-font-smoothing:antialiased;}
        .fm *{box-sizing:border-box;}

        .fm-maq{flex:none;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;
          background:#0B1218;border-bottom:1px solid rgba(255,255,255,.08);
          padding:calc(7px + env(safe-area-inset-top)) 10px 8px;}
        .fm-maq::-webkit-scrollbar{display:none;}
        .fm-maq button{flex:none;font-family:inherit;font-size:11.5px;font-weight:700;
          border:1px solid rgba(255,255,255,.12);background:transparent;color:#9FB3A7;
          border-radius:20px;padding:6px 11px;white-space:nowrap;cursor:pointer;}
        .fm-maq button.on{background:var(--fm-menthe);color:#04150E;border-color:transparent;}

        /* ─── LA PHOTO EST L'ECRAN ───
           Pas de marge, pas de coin arrondi, pas de cadre : trois bordures entre
           l'oeil et l'image suffisent a ce qu'on ne la regarde plus. */
        .fm-ecran{position:relative;flex:1;min-height:0;overflow:hidden;
          touch-action:pan-y;user-select:none;-webkit-user-select:none;}
        .fm-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;
          display:block;}
        .fm-photo.vide{background:linear-gradient(160deg,#16242E,#0A1310);}
        .fm-voile{position:absolute;inset:0;
          background:linear-gradient(180deg,rgba(4,8,6,.72) 0%,rgba(4,8,6,.12) 26%,
            rgba(4,8,6,.28) 44%,rgba(4,8,6,.86) 72%,rgba(5,9,12,.97) 100%);}

        /* ─── LE BANDEAU ───
           Il flotte sur la photo. Le quota y est, ecrit d'avance. */
        .fm-haut{position:absolute;top:0;left:0;right:0;z-index:5;
          display:flex;align-items:center;gap:11px;padding:12px 13px;}
        .fm-retour{flex:none;display:inline-flex;align-items:center;justify-content:center;
          width:34px;height:34px;border-radius:50%;text-decoration:none;
          color:var(--fm-menthe);font-size:16px;background:rgba(4,10,8,.5);
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .fm-retour i{font-style:normal;}
        .fm-titre{flex:1;min-width:0;}
        .fm-titre b{display:block;font-size:12px;font-weight:900;letter-spacing:.15em;
          text-transform:uppercase;color:var(--fm-menthe);}
        /* SUR UNE LIGNE, COUPEE S'IL LE FAUT. « Une prothesiste ongulaire ·
           Dax » passait a la ligne et poussait le quota hors de son rang : le
           bandeau grandissait selon la longueur du nom du commerce. */
        .fm-titre em{display:block;font-style:normal;font-size:12.5px;font-weight:600;
          color:#DCE8E1;margin-top:1px;white-space:nowrap;overflow:hidden;
          text-overflow:ellipsis;text-shadow:0 1px 10px rgba(0,0,0,.7);}
        .fm-quota{flex:none;display:inline-flex;align-items:center;gap:5px;
          white-space:nowrap;font-size:11.5px;font-weight:800;color:#DCE8E1;
          background:rgba(4,10,8,.5);border-radius:20px;padding:6px 11px 6px 8px;
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .fm-quota-s{width:15px;height:16px;}
        .fm-quota-s .fm-f-corps{fill:var(--fm-menthe);}
        .fm-quota-s .fm-f-oeil{fill:#05221A;}
        .fm-quota-s .fm-f-bouche{fill:none;stroke:#05221A;stroke-width:1.6;
          stroke-linecap:round;}

        /* Les deux moities avancent. Sous tout le reste : elles ne prennent le
           doigt que la ou il n'y a rien a toucher. */
        .fm-zone{position:absolute;top:64px;bottom:44%;width:50%;z-index:1;
          border:none;background:none;padding:0;cursor:pointer;
          -webkit-tap-highlight-color:transparent;}
        .fm-zone.gauche{left:0;}
        .fm-zone.droite{right:0;}

        /* ─── LE BAS, QUI PORTE TOUT ─── */
        .fm-bas{position:absolute;left:0;right:0;bottom:0;z-index:4;
          padding:0 16px calc(14px + env(safe-area-inset-bottom));}
        .fm-bas.avant{animation:fmEntreD .26s ease both;}
        .fm-bas.arriere{animation:fmEntreG .26s ease both;}
        @keyframes fmEntreD{from{opacity:0;transform:translateX(16px);}
          to{opacity:1;transform:translateX(0);}}
        @keyframes fmEntreG{from{opacity:0;transform:translateX(-16px);}
          to{opacity:1;transform:translateX(0);}}
        .fm-photo.avant{animation:fmPhoto .34s ease both;}
        .fm-photo.arriere{animation:fmPhoto .34s ease both;}
        @keyframes fmPhoto{from{opacity:0;transform:scale(1.04);}
          to{opacity:1;transform:scale(1);}}

        .fm-qui{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:9px;}
        .fm-signe{width:22px;height:24px;flex:none;
          filter:drop-shadow(0 2px 8px rgba(0,0,0,.6));}
        .fm-signe .fm-f-corps{fill:#F2FBF6;}
        .fm-signe .fm-f-oeil{fill:#0B1A14;}
        .fm-signe .fm-f-bouche{fill:none;stroke:#0B1A14;stroke-width:1.7;
          stroke-linecap:round;}
        .fm-qui b{font-size:19px;font-weight:800;
          text-shadow:0 2px 12px rgba(0,0,0,.7);}
        .fm-qui u{text-decoration:none;font-size:11.5px;font-weight:800;
          letter-spacing:.05em;text-transform:uppercase;color:#DCE8E1;
          background:rgba(255,255,255,.16);border-radius:20px;padding:3px 8px;}
        /* LA MENTHE EST LA MARQUE DE LA MAISON, et c'est la seule chose de
           l'ecran qui la porte a cet endroit. Voir le commentaire du composant :
           un fantome du patron qui passerait pour un client est un faux avis. */
        .fm-qui u.maison{background:var(--fm-menthe);color:#04150E;font-weight:900;}
        .fm-qui em{font-style:normal;font-size:11.5px;color:var(--fm-pale);
          margin-left:auto;text-shadow:0 1px 8px rgba(0,0,0,.7);}

        /* ─── L'ETIQUETTE DE GENRE ───
           Elle passe AVANT le mot : « JE CHERCHE » dit en un coup d'oeil qu'il
           faudra repondre, « ESSAYE ICI » qu'on regarde une hesitation. */
        .fm-eti{display:inline-flex;align-items:center;gap:6px;margin-bottom:8px;
          font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;
          border-radius:20px;padding:5px 11px;}
        .fm-eti i{font-style:normal;font-size:12px;letter-spacing:0;}
        .fm-eti.demande{background:#FFC400;color:#2A1A00;}
        .fm-eti.intention{background:rgba(255,255,255,.17);color:#F2FBF6;
          -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
        .fm-eti.essai{background:rgba(109,40,217,.86);color:#F0E6FF;}

        /* LE MOT, EN GRAND. C'est lui qu'on lit en une seconde ; tout le reste
           est autour. Deux tailles selon la longueur : une phrase de vingt
           signes et une de cent n'ont pas le meme corps juste. */
        .fm-mot{margin:0 0 12px;font-size:20px;line-height:1.32;font-weight:600;
          text-wrap:pretty;text-shadow:0 2px 16px rgba(0,0,0,.75);}

        .fm-pied{display:flex;align-items:center;gap:10px;margin-bottom:11px;}
        .fm-duree{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;
          font-weight:700;color:var(--fm-pale);}
        .fm-duree i{font-style:normal;font-size:12px;}
        .fm-rang{margin-left:auto;font-size:11.5px;font-weight:800;color:var(--fm-pale);
          font-variant-numeric:tabular-nums;}

        /* ─── LE GESTE ───
           TOUJOURS AU MEME ENDROIT, MEME TAILLE, MEME COULEUR. Un bouton qu'on
           retrouve sans le chercher se presse ; un bouton qu'on relocalise a
           chaque ecran se lit d'abord, et lire coute la seconde qu'on n'a pas.
           LE COMPTEUR RESTE PETIT : le jour ou il devient gros, on a refabrique
           le like — et un like est gratuit, donc il ne veut rien dire. */
        .fm-int{display:flex;align-items:center;gap:10px;width:100%;
          font-family:inherit;cursor:pointer;border:none;border-radius:26px;
          padding:15px 18px;background:var(--fm-menthe);color:#04150E;
          box-shadow:0 16px 38px -20px rgba(61,226,166,.95);
          transition:transform .12s ease;}
        .fm-int i{font-style:normal;font-size:18px;line-height:1;}
        .fm-int b{flex:1;text-align:left;font-size:15.5px;font-weight:900;
          letter-spacing:.01em;}
        .fm-int em{font-style:normal;font-size:13px;font-weight:800;
          font-variant-numeric:tabular-nums;opacity:.72;}
        .fm-int:active{transform:scale(.975);}
        /* Appuye : il reste lisible et cesse de crier. On ne le desactive pas —
           on doit pouvoir rouvrir la mise en relation. */
        .fm-int.on{background:rgba(61,226,166,.17);color:#BFF6E0;
          box-shadow:inset 0 0 0 1px rgba(61,226,166,.5);}
        .fm-int.on em{opacity:1;color:var(--fm-menthe);}

        .fm-ville{margin:10px 0 0;font-size:11px;line-height:1.4;text-align:center;
          color:var(--fm-pale);}
        .fm-ville b{color:#DCE8E1;font-weight:700;}

        .fm-fleches{position:absolute;z-index:5;left:0;right:0;top:50%;
          transform:translateY(-50%);display:flex;justify-content:space-between;
          padding:0 8px;pointer-events:none;}
        .fm-fleches button{pointer-events:auto;width:38px;height:38px;border-radius:50%;
          border:none;cursor:pointer;font-size:17px;font-family:inherit;
          color:#EAF2EC;background:rgba(4,10,8,.42);
          -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
          transition:opacity .16s ease;}
        .fm-fleches button:disabled{opacity:0;pointer-events:none;}

        /* ─── LA MISE EN RELATION ─── */
        .fm-fond{position:fixed;inset:0;z-index:30;border:none;padding:0;
          background:rgba(3,7,5,.62);cursor:pointer;
          -webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);
          animation:fmFond .18s ease both;}
        @keyframes fmFond{from{opacity:0;}to{opacity:1;}}
        .fm-feuille{position:fixed;z-index:31;left:0;right:0;bottom:0;
          max-width:560px;margin:0 auto;
          background:linear-gradient(180deg,#101C17,#08110D);
          border-top:1px solid rgba(61,226,166,.28);
          border-radius:26px 26px 0 0;
          padding:20px 18px calc(20px + env(safe-area-inset-bottom));
          animation:fmMonte .24s cubic-bezier(.2,.8,.25,1) both;}
        @keyframes fmMonte{from{transform:translateY(100%);}to{transform:translateY(0);}}
        .fm-f-t{display:flex;align-items:center;gap:9px;margin-bottom:10px;}
        .fm-f-signe{width:24px;height:26px;flex:none;}
        .fm-f-signe .fm-f-corps{fill:var(--fm-menthe);}
        .fm-f-signe .fm-f-oeil{fill:#05221A;}
        .fm-f-signe .fm-f-bouche{fill:none;stroke:#05221A;stroke-width:1.7;
          stroke-linecap:round;}
        .fm-f-t b{font-size:12px;font-weight:900;letter-spacing:.12em;
          text-transform:uppercase;color:var(--fm-menthe);}
        .fm-f-q{margin:0 0 16px;font-size:18px;line-height:1.35;font-weight:600;}
        .fm-f-b{display:block;width:100%;font-family:inherit;font-size:15px;
          font-weight:900;cursor:pointer;border:none;border-radius:24px;
          padding:15px 16px;background:var(--fm-menthe);color:#04150E;}
        .fm-f-b:active{transform:scale(.98);}
        .fm-f-n{margin:12px 0 0;font-size:11.5px;line-height:1.5;text-align:center;
          color:var(--fm-pale);}
        .fm-f-x{display:block;width:100%;margin-top:6px;font-family:inherit;
          font-size:13px;font-weight:700;cursor:pointer;border:none;background:none;
          color:var(--fm-pale);padding:10px;}

        @media (min-width:560px){
          .fm-ecran{max-width:560px;margin:0 auto;width:100%;
            border-left:1px solid rgba(255,255,255,.07);
            border-right:1px solid rgba(255,255,255,.07);}
          .fm-mot{font-size:22px;}
        }

        /* Moins d'animation n'est pas moins d'information : seuls les
           mouvements tombent. */
        @media (prefers-reduced-motion:reduce){
          .fm *{animation:none !important;transition:none !important;}
        }
      `,
      }}
    />
  );
}
