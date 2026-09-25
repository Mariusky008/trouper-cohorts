"use client";

// 🖼️ LA CARTE, RÉORGANISÉE AUTOUR DE LA PHOTO — proposition, pas le produit.
//
// ═══ CE QU'IL A DEMANDÉ, POINT PAR POINT ═══════════════════════════════════
//
// « La photo occupe tout l'écran et sur le dernier quart en bas il y a un
// fondu équivalent à la couleur du bas de la photo, pour que ce soit doux et
// joli. Police comme sur la maquette. "2 essayages" est une pop-up sur le
// fantôme du bas, visible deux ou trois secondes, pas en aussi grand. En
// parler, rendez-vous et favori restent sur le côté droit en petits boutons.
// Le bouton rond des tarifs reste comme avant. Le menu du bas aussi. »
//
// LES DEUX PREMIÈRES VERSIONS SE SONT TROMPÉES DE PROBLÈME. J'ai cru qu'il
// fallait SORTIR les choses de la photo — d'abord tout dessous, puis moitié
// dessous. Ce n'est pas ça : la photo doit rester pleine page. Ce qu'il ne
// veut pas, c'est qu'on lui POSE DES BLOCS EN PLEIN MILIEU.
//
// LA RÈGLE EST DONC : LE MILIEU EST À LA PHOTO, LES BORDS SONT À NOUS. Le haut
// porte la barre, le côté porte trois petits ronds, le bas porte tout le
// reste — sous un fondu qui part de la couleur de la photo elle-même.
//
// ═══ LE FONDU PREND SA COULEUR DANS L'IMAGE ════════════════════════════════
//
// « Un fondu équivalent à la couleur du bas de la photo. »
//
// UN DÉGRADÉ VERS LE NOIR MARCHE SUR UNE PHOTO SOMBRE ET SALIT TOUTES LES
// AUTRES : sur un fond de studio blanc il fait une barre grise, sur une
// devanture chaude il éteint le cuivre. On LIT donc la couleur moyenne du bas
// de l'image — huit pour cent de sa hauteur — et le fondu va vers elle. Ça
// coûte une lecture de toile, une fois, au chargement.
//
// ELLE NE TOUCHE PAS AU PRODUIT. C'est une page à part, à son adresse.
import { useEffect, useMemo, useRef, useState } from "react";
import { toutesLesCartes } from "@/lib/direct/apercu-habitant";
import { MURS } from "@/lib/direct/fantomes";

/**
 * LA COULEUR MOYENNE DU BAS D'UNE IMAGE.
 *
 * ON NE LIT QU'UNE LIGNE SUR QUATRE ET UNE COLONNE SUR QUATRE : la moyenne ne
 * bouge pas d'un point et le calcul coûte seize fois moins. Sur une photo de
 * mille points de large, c'est quelques milliers de pixels, pas un million.
 */
function couleurDuBas(img: HTMLImageElement): string | null {
  try {
    const l = Math.min(img.naturalWidth, 240);
    const h = Math.max(1, Math.round((l / img.naturalWidth) * img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = l;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) return null;
    g.drawImage(img, 0, 0, l, h);
    const hautDeBande = Math.max(0, h - Math.max(2, Math.round(h * 0.08)));
    const d = g.getImageData(0, hautDeBande, l, h - hautDeBande).data;
    let r = 0;
    let v = 0;
    let b = 0;
    let n = 0;
    for (let i = 0; i < d.length; i += 4 * 4) {
      r += d[i];
      v += d[i + 1];
      b += d[i + 2];
      n++;
    }
    if (!n) return null;
    /* ON ASSOMBRIT DE TRENTE POUR CENT. La couleur brute du bas d'une photo
       est souvent claire — un fond de studio, un pull beige — et du texte
       blanc n'y tient pas. Assombrie, elle reste la MÊME couleur : c'est ce
       qui fait que le fondu a l'air d'appartenir à l'image. */
    const t = (x: number) => Math.round((x / n) * 0.7);
    return `rgb(${t(r)}, ${t(v)}, ${t(b)})`;
  } catch {
    /* UNE TOILE QUE LE NAVIGATEUR REFUSE DE LIRE N'EST PAS UNE PANNE : on
       garde le fondu sombre par défaut, qui marche partout. */
    return null;
  }
}

/** La largeur de la carte, en points. Le fondu en dépend, donc elle est écrite une fois. */
const LARGEUR = 390;
/** Sa hauteur. Les deux décident de tout le cadrage ci-dessous. */
const HAUTEUR = 844;

/**
 * ═══ JUSQU'OÙ LA PHOTO DESCEND ════════════════════════════════════════════
 *
 * « Pour l'homme, le flou commence beaucoup trop haut et prend plus de la
 * moitié de l'écran, au lieu d'être à partir de juste en dessous des
 * miniatures comme pour la femme. »
 *
 * ET LA CAUSE EST DANS LA PHOTO, PAS DANS LE DESSIN. Sa photo d'homme est
 * CARRÉE : à pleine largeur elle ne fait que 390 points de haut sur 844. Le
 * fondu, qui finit au bord de l'image, commençait donc à 220 — un quart de
 * l'écran — et tout le bas devenait de la couleur. Celle de la femme est
 * verticale : 585 points, et le compte tombe juste. Même règle, deux formats,
 * deux résultats.
 *
 * ON VISE DONC UNE HAUTEUR, ET ON ROGNE LE MINIMUM POUR L'ATTEINDRE. La photo
 * descend jusqu'à soixante-deux pour cent de la carte quand elle le peut ; si
 * son format ne le permet qu'en coupant, on coupe — MAIS JAMAIS PLUS DE VINGT-
 * CINQ POUR CENT DE LA LARGEUR, douze et demi de chaque côté.
 *
 * LE PLAFOND EST LE CŒUR DE LA RÈGLE. Sans lui on retombe sur « cover », qui
 * mangeait vingt-six pour cent de chaque côté — les côtés de la coupe. Avec
 * lui, une photo carrée monte de 390 à 520 points en perdant douze et demi par
 * bord au lieu de vingt-six : le sujet reste entier et le fondu redescend.
 * Une photo panoramique, elle, n'atteindra pas la cible et c'est très bien :
 * mieux vaut une image courte qu'une image amputée.
 */
const CIBLE = Math.round(HAUTEUR * 0.62);
const ROGNAGE_MAX = 0.25;

export function hauteurDe(l: number, h: number): number {
  if (!l || !h) return LARGEUR;
  /* À PLEINE LARGEUR, SANS RIEN COUPER. */
  const pleine = (LARGEUR * h) / l;
  if (pleine >= CIBLE) return Math.round(pleine);
  /* IL FAUT AGRANDIR POUR ATTEINDRE LA CIBLE, donc rogner les côtés. Un
     agrandissement de facteur k coupe (1 − 1/k) de la largeur. */
  const kMax = 1 / (1 - ROGNAGE_MAX);
  return Math.round(Math.min(CIBLE, pleine * kMax));
}

export default function Proposition() {
  /* ON PREND LA CARTE ET L'ANNONCE DONT IL PARLE — la coupe homme du salon du
     centre — dans les VRAIES données. Une proposition faite sur des chiffres
     inventés ne prouve rien. */
  const { carte, annonce, coupes, lieu, promesse } = useMemo(() => {
    const c = toutesLesCartes().find((x) => x.id === "coif-centre");
    const a = c?.moments.find((m) => m.titre === "Coupe homme") ?? c?.moments[0];
    /* LE MUR PORTE LA CLÉ DU MÉTIER, pas celle de la carte : « coiffeur », et
       non « coif-centre ». Un `find` qui ne trouve pas rend `undefined`, et
       `undefined` ne fait pas de bruit — la bande de vignettes sortait vide. */
    const mur = MURS.find((m) => m.cle === "coiffeur");
    return {
      carte: c,
      annonce: a,
      coupes: (mur?.essai?.pieces ?? []).filter((p) => p.photo).slice(0, 5),
      lieu: mur?.photoLieu ?? "",
      promesse: mur?.essai?.mots?.promesse ?? "",
    };
  }, []);

  /* ON OUVRE SUR LA PHOTO DE L'ANNONCE, pas sur la première pièce du salon :
     « Coupe homme » ouvrait sur un motif rasé vu de dos. */
  const depart = Math.max(
    0,
    coupes.findIndex((p) => p.photo === annonce?.photo),
  );
  const [choisie, setChoisie] = useState(depart);
  const grande = coupes[choisie]?.photo || annonce?.photo || carte?.photo || "";

  /* LE FONDU SUIT LA PHOTO AFFICHÉE, donc il se recalcule quand on tape une
     vignette : c'est tout l'intérêt d'aller chercher la couleur dans l'image
     plutôt que de l'écrire une fois pour toutes. */
  const [fond, setFond] = useState<string | null>(null);
  const [hauteur, setHauteur] = useState(LARGEUR);
  const cache = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!grande) return;
    const connue = cache.current[grande];
    if (connue) setFond(connue);
    let vivant = true;
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => {
      if (!vivant) return;
      setHauteur(hauteurDe(i.naturalWidth, i.naturalHeight));
      const c = couleurDuBas(i);
      if (!c) return;
      cache.current[grande] = c;
      setFond(c);
    };
    i.src = grande;
    return () => {
      vivant = false;
    };
  }, [grande]);

  /**
   * ═══ LA BULLE PASSE, ELLE NE S'INSTALLE PAS ═══════════════════════════════
   *
   * « C'est une pop-up qui est sur le fantôme du bas et qui se voit juste deux
   * ou trois secondes, pas en aussi grand. »
   *
   * J'EN AVAIS FAIT UN BLOC PERMANENT de cinquante points de haut, qui
   * poussait tout le reste. Une chose qui passe n'a pas besoin de place
   * réservée : elle sort au-dessus du fantôme et elle s'en va.
   */
  const [bulle, setBulle] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setBulle(false), 3200);
    return () => window.clearTimeout(t);
  }, []);

  if (!carte || !annonce) return null;

  return (
    <div className="pr-tel">
      <div
        className="pr-carte"
        style={
          {
            ...(fond ? { ["--fond"]: fond } : {}),
            ["--photo-h"]: `${hauteur}px`,
          } as React.CSSProperties
        }
      >
        {/* ═══ 1 · LA PHOTO, PLEIN ÉCRAN ═══════════════════════════════════ */}
        <div className="pr-photo" style={{ backgroundImage: `url("${encodeURI(grande)}")` }} />
        {/* LE FONDU — voir `couleurDuBas`. Il part de rien au milieu et finit
            sur la couleur du bas de l'image. */}
        <div className="pr-fondu" />

        <header className="pr-haut">
          <div className="pr-puce">
            {lieu && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lieu} alt="" />
            )}
            <div>
              <b>{carte.nom}</b>
              <span>
                {carte.metier} · {carte.metres} m
              </span>
            </div>
            <i>↗</i>
          </div>
          <span className="pr-filtre">☰ COIFFEURS</span>
          <span className="pr-coeur">♥ 2</span>
          <span className="pr-cloche">🔔</span>
        </header>

        {/* LE ROND DES TARIFS, COMME AVANT. */}
        <button type="button" className="pr-tarifs">
          <span>LES TARIFS</span>
          <i>✂️</i>
          <span>VOIR ›</span>
        </button>

        {/* LA COLONNE DE DROITE, EN PETITS RONDS, COMME AVANT. */}
        <div className="pr-rail">
          <button type="button">
            <i>👥</i>
            <span>En parler</span>
          </button>
          <button type="button">
            <i>🗓️</i>
            <span>
              Prendre
              <br />
              rendez-vous
            </span>
          </button>
          <button type="button">
            <i>♡</i>
            <span>Favori</span>
          </button>
        </div>

        <button type="button" className="pr-suite" aria-label="Carte suivante">
          ›
        </button>

        {/* ═══ 2 · TOUT LE TEXTE DANS LE BAS, SUR LE FONDU ══════════════════
            Le milieu de la photo reste vide : c'est la seule règle. */}
        <div className="pr-bas">
          <h1>{annonce.titre}</h1>
          <p className="pr-detail">
            {annonce.lignes?.[0]}
            {annonce.lignes?.[1] ? ` · ${annonce.lignes[1]}` : ""}
          </p>
          <div className="pr-prix">
            <b>{annonce.prix}</b>
            <span>
              <i>📍</i> à {carte.metres} m · {carte.ville}
            </span>
          </div>

          <div className="pr-vignettes">
            {coupes.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={i === choisie ? "on" : ""}
                onClick={() => setChoisie(i)}
                aria-label={p.nom}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.photo} alt="" />
              </button>
            ))}
          </div>

          <div className="pr-nom">
            <b>{carte.nom}</b>
            <span>
              <i>★</i> {carte.google?.note} ({carte.google?.avis} avis)
            </span>
            <button type="button" className="pr-offres">
              Voir toutes les offres + infos ↓
            </button>
          </div>

          <button type="button" className="pr-essai">
            <i>👻</i> Essayer sur moi <b>→</b>
          </button>
          <p className="pr-promesse">✨ {promesse}</p>
        </div>

        {/* LA BULLE, PETITE, AU-DESSUS DU FANTÔME, ET ELLE S'EN VA. */}
        {bulle && (
          <div className="pr-bulle">
            <i>👻👻</i>
            <div>
              <b>2 essayages de cette coupe</b>
              <span>Voir le résultat sur d’autres →</span>
            </div>
          </div>
        )}

        {/* ═══ 3 · LA BARRE DU BAS, COMME AVANT ════════════════════════════ */}
        <nav className="pr-barre">
          <span className="on">
            <i>⚡</i>LE DIRECT
          </span>
          <span>
            <i>🏛️</i>LA VILLE
          </span>
          <span className="pr-fantome">
            <i>👻</i>
          </span>
          <span>
            <i>💬</i>PROPOSITIONS
          </span>
          <span>
            <i>🙂</i>PROFIL
          </span>
        </nav>
      </div>

      <p className="pr-note">
        Proposition — la carte du produit n’est pas modifiée. Tapez une vignette : la grande photo
        change, et le fondu reprend la couleur du bas de la nouvelle image.
      </p>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pr-tel{min-height:100dvh;background:#05060b;display:grid;justify-items:center;
          align-content:start;gap:14px;padding:18px 12px 40px;
          font:15px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;}
        .pr-carte{--fond:#0a0c14;position:relative;width:min(390px,100%);height:844px;
          background:var(--fond);border-radius:26px;overflow:hidden;
          box-shadow:0 30px 80px rgba(0,0,0,.6);}

        /* LA PHOTO PREND TOUT, ET RIEN NE SE POSE EN SON MILIEU. */
        /* ═══ JAMAIS DE ROGNAGE LATERAL ═══
           « On voit la coupe encore une fois qu'en partie mais pas vraiment
           clairement et totalement. »
           « cover » remplit le cadre en coupant ce qui depasse — et sur un
           telephone, ce qui depasse est TOUJOURS la largeur : une photo carree
           y perd vingt-six pour cent de chaque cote, c'est-a-dire les cotes de
           la coupe, les manches du vetement, les doigts de la main.
           LA LARGEUR EST DONC TOUJOURS PLEINE, et la hauteur suit. Ce qui
           reste dessous n'est pas un vide : c'est la couleur du bas de la
           photo elle-meme, et le fondu s'y rend sans qu'on voie la jointure.
           Une photo plus haute que l'ecran ne perd que son bas, sous le
           fondu. */
        .pr-photo{position:absolute;left:0;right:0;top:0;height:var(--photo-h);
          background:transparent center top no-repeat;background-image:inherit;}
        /* LA HAUTEUR COMMANDE, LA LARGEUR SUIT — et déborde quand il le faut,
           d'au plus douze et demi pour cent de chaque côté. Voir hauteurDe. */
        .pr-photo{background-size:auto var(--photo-h);background-position:center top;}
        /* LE FONDU VA VERS LA COULEUR LUE DANS L'IMAGE — voir couleurDuBas. */
        /* LE FONDU PART PLUS BAS QUE LE VISAGE. A trente-huit pour cent il
           voilait les yeux ; le titre commence de toute facon a cinquante. */
        /* ═══ LE FONDU FINIT EXACTEMENT OU LA PHOTO FINIT ═══
           Premier essai : il atteignait sa pleine opacite bien APRES le bas de
           l'image. Resultat, une arete nette — photo voilee a trente pour cent
           d'un cote, couleur pleine de l'autre. Mesure : la cassure tombait a
           390 points, la ou la photo s'arrete.
           IL OCCUPE DONC LES CENT SOIXANTE-DIX DERNIERS POINTS DE LA PHOTO, et
           il arrive a la couleur pile a son bord. Sous ce bord, c'est le fond
           de la carte — la meme couleur. La jointure n'existe plus.
           SUR UNE PHOTO PLUS HAUTE QUE L'ECRAN il se colle au bas de l'ecran :
           sans ce min, il partirait hors champ et on perdrait le fondu. */
        .pr-fondu{position:absolute;left:0;right:0;height:170px;
          top:min(max(0px, calc(var(--photo-h) - 170px)), calc(100% - 170px));
          background:linear-gradient(180deg,
            rgba(0,0,0,0) 0%,
            color-mix(in srgb, var(--fond) 62%, transparent) 58%,
            var(--fond) 100%);}

        .pr-haut{position:absolute;left:0;right:0;top:0;z-index:3;display:flex;
          align-items:center;gap:6px;padding:11px;
          background:linear-gradient(180deg,rgba(0,0,0,.55),transparent);}
        .pr-puce{display:flex;align-items:center;gap:7px;background:rgba(18,20,30,.82);
          border-radius:999px;padding:5px 9px 5px 5px;min-width:0;flex:1;}
        .pr-puce img{width:26px;height:26px;border-radius:50%;object-fit:cover;flex:none;}
        .pr-puce div{min-width:0;}
        .pr-puce b{display:block;color:#fff;font-size:12px;line-height:1.15;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .pr-puce span{display:block;color:#9aa4c4;font-size:10px;}
        .pr-puce i{font-style:normal;color:#9aa4c4;font-size:10px;}
        .pr-filtre{background:rgba(18,20,30,.82);color:#fff;border-radius:999px;
          padding:6px 9px;font-size:10px;font-weight:700;letter-spacing:.05em;white-space:nowrap;}
        .pr-coeur{background:rgba(18,20,30,.82);color:#ff5b8a;border-radius:999px;
          padding:6px 8px;font-size:11px;font-weight:700;white-space:nowrap;}
        .pr-cloche{background:rgba(18,20,30,.82);border-radius:50%;width:28px;height:28px;
          display:grid;place-items:center;font-size:12px;flex:none;}

        .pr-tarifs{position:absolute;right:13px;top:62px;z-index:3;
          width:76px;height:76px;border-radius:50%;border:2px solid #c4a2ff;
          background:rgba(10,12,20,.8);color:#fff;display:grid;place-content:center;gap:2px;
          font-size:8.5px;font-weight:800;letter-spacing:.07em;cursor:pointer;}
        .pr-tarifs i{font-style:normal;font-size:17px;}

        /* LES TROIS PETITS RONDS, SUR LE COTE, COMME AVANT. */
        /* LES TROIS RONDS REMONTENT AU-DESSUS DU TEXTE. A quarante-sept pour
           cent, « En parler » tombait sur le E de « Coupe homme » : deux
           choses a la meme hauteur sur un ecran de trois cent quatre-vingt-dix
           points se marchent dessus, quoi qu'on fasse. */
        .pr-rail{position:absolute;right:10px;top:27%;z-index:3;display:grid;gap:11px;
          justify-items:center;}
        .pr-rail button{width:46px;border:0;background:none;color:#fff;display:grid;
          gap:3px;justify-items:center;cursor:pointer;padding:0;}
        .pr-rail i{font-style:normal;font-size:16px;width:42px;height:42px;border-radius:50%;
          background:rgba(12,14,22,.66);display:grid;place-items:center;}
        .pr-rail span{font-size:8.5px;line-height:1.15;text-align:center;font-weight:600;
          text-shadow:0 1px 6px rgba(0,0,0,.7);}
        .pr-suite{position:absolute;right:16px;top:19%;z-index:3;
          width:32px;height:32px;border-radius:50%;border:0;background:rgba(12,14,22,.66);
          color:#fff;font-size:19px;line-height:1;cursor:pointer;}

        /* ═══ LE BAS ═══ */
        .pr-bas{position:absolute;left:0;right:0;bottom:62px;z-index:2;padding:0 14px;
          display:grid;gap:8px;}
        /* LA POLICE DE SA MAQUETTE — Poppins 900, déjà servie par le site sous
           --font-clikme. Pas de capitales forcées : « Coupe homme » s'écrit
           comme il l'a dessiné. */
        .pr-bas h1{margin:0;font-family:var(--font-clikme),system-ui,sans-serif;
          font-weight:900;font-size:41px;line-height:.92;letter-spacing:-.025em;color:#fff;
          text-shadow:0 2px 20px rgba(0,0,0,.45);}
        /* LE TITRE S'ARRETE AVANT LA COLONNE, meme quand elle est plus haut :
           une ligne longue irait la rejoindre. */
        .pr-bas h1,.pr-detail{padding-right:58px;}
        .pr-detail{margin:0;font-size:13px;color:rgba(255,255,255,.84);}
        .pr-prix{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;}
        .pr-prix b{font-family:var(--font-clikme),system-ui,sans-serif;font-weight:900;
          font-size:40px;line-height:1;color:#ffd233;letter-spacing:-.03em;
          text-shadow:0 2px 20px rgba(0,0,0,.45);}
        .pr-prix span{font-size:11.5px;color:rgba(255,255,255,.84);}
        .pr-prix i{font-style:normal;}

        .pr-vignettes{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;height:56px;}
        .pr-vignettes::-webkit-scrollbar{display:none;}
        .pr-vignettes button{flex:none;width:56px;height:56px;padding:0;
          border:2px solid rgba(255,255,255,.25);border-radius:13px;overflow:hidden;
          background:#11131f;cursor:pointer;}
        .pr-vignettes button.on{border-color:#c4a2ff;box-shadow:0 0 0 3px rgba(168,85,247,.3);}
        .pr-vignettes img{width:100%;height:100%;object-fit:cover;display:block;}

        .pr-nom{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .pr-nom b{color:#fff;font-size:13.5px;}
        .pr-nom>span{color:rgba(255,255,255,.7);font-size:12px;}
        .pr-nom i{color:#ffcc33;font-style:normal;}
        .pr-offres{background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:999px;
          padding:7px 12px;font-size:11.5px;font-weight:600;cursor:pointer;}

        .pr-essai{display:flex;align-items:center;justify-content:center;gap:9px;
          background:linear-gradient(90deg,#7b4dff,#e0389f);color:#fff;border:0;
          border-radius:17px;padding:14px;font-size:17px;font-weight:800;cursor:pointer;}
        .pr-essai i,.pr-essai b{font-style:normal;}
        .pr-promesse{margin:0;font-size:11.5px;color:#d9c6ff;}

        /* LA BULLE : PETITE, AU-DESSUS DU FANTOME, ET ELLE S'EN VA. */
        .pr-bulle{position:absolute;left:50%;bottom:58px;z-index:5;transform:translateX(-50%);
          display:flex;align-items:center;gap:7px;background:rgba(40,32,78,.94);
          border:1px solid rgba(140,116,220,.5);border-radius:12px;padding:5px 10px;
          white-space:nowrap;box-shadow:0 8px 26px rgba(0,0,0,.5);
          animation:prBulle .28s ease-out;}
        .pr-bulle::after{content:"";position:absolute;left:50%;bottom:-6px;
          width:11px;height:11px;background:rgba(40,32,78,.94);
          border-right:1px solid rgba(140,116,220,.5);border-bottom:1px solid rgba(140,116,220,.5);
          transform:translateX(-50%) rotate(45deg);}
        .pr-bulle i{font-style:normal;font-size:12px;}
        .pr-bulle b{display:block;color:#fff;font-size:11px;line-height:1.25;font-weight:700;}
        .pr-bulle span{display:block;color:#bda9f2;font-size:9.5px;line-height:1.25;}
        @keyframes prBulle{from{opacity:0;transform:translateX(-50%) translateY(6px);}}

        .pr-barre{position:absolute;left:0;right:0;bottom:0;z-index:4;
          display:grid;grid-template-columns:repeat(5,1fr);align-items:center;
          background:rgba(8,10,16,.92);border-top:1px solid rgba(255,255,255,.07);
          padding:7px 0 9px;}
        .pr-barre span{display:grid;gap:2px;justify-items:center;color:#7f89ab;
          font-size:9px;font-weight:700;letter-spacing:.03em;}
        .pr-barre span.on{color:#eef;}
        .pr-barre i{font-style:normal;font-size:15px;}
        .pr-fantome{width:50px;height:50px;border-radius:50%;
          background:radial-gradient(circle at 50% 40%,#8cf5c8,#2fd8a0);
          display:grid;place-items:center;justify-self:center;margin-top:-15px;}
        .pr-fantome i{font-size:23px;}

        .pr-note{color:#6f7796;font-size:12.5px;text-align:center;max-width:390px;margin:0;}
      `,
        }}
      />
    </div>
  );
}
