"use client";

/**
 * 🏠 « MA MAISON » — LA PIÈCE DE CHACUN (`lib/direct/ma-maison.ts`, `docs/univers/ma-maison.md` ; le lot M1).
 *
 * Sa pièce du catalogue : son image, celle de la messagerie (en hauteur, depuis le 20 novembre 2026 : plus le panorama),
 * dans la lumière de l'heure, centrée comme la messagerie ; sa figurine posée à sa place, dans son fauteuil (une ombre au sol, la teinte du moment) ; ses emplacements,
 * qu'on touche (ce que chacun accueillera ; une lampe s'allume) ; ⚙️ « Changer de pièce ». Sans pièce : « Choisis ta
 * pièce » (les neuf, dans l'ordre de son âge ; un toucher la montre en grand ; « Je m'installe ici »).
 *
 * 🏠 (lot M2) CE QU'IL A GARDÉ, À SA PLACE (`placerChezMoi`) : ses photos dans les cadres, la dernière chanson sur la
 * platine (le disque tourne), la dernière vidéo à la télé (son affiche), le reste sur l'étagère ; un toucher : ce que
 * c'est, avec qui il l'a gardé, « ▶ Écouter », « 🔍 La voir en grand ». À l'arrivée, ce qu'il a gardé depuis sa dernière
 * visite : « ✨ 3 choses gardées avec Léa », et la caméra passe sur chacune (`arriveeChezMoi`) ; un toucher l'arrête.
 *
 * Rien n'est généré à l'ouverture : des images à adresse stable (gardées par le téléphone), la vignette floue d'abord ;
 * on n'anime que `transform` et `opacity` (`ma-maison.md`, section 9).
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MEMOIRE_MAISON, ecrireMemoire, lireMemoire } from "./memoire-locale";
import {
  EMPLACEMENTS_MAISON,
  MAISON_VIDE,
  PHRASES_AJOUT,
  PHRASES_BAS,
  PHRASES_MAISON,
  PHRASES_VISITE,
  arriveeChezMoi,
  ditDeLObjet,
  objetsPlaces,
  phraseAbsence,
  phraseNouveautes,
  puceDeLObjet,
  PHRASES_CADEAU,
  PHRASES_QUESTION,
  type CadeauMaison,
  type QuestionChezLui,
  type CatalogueMaison,
  type ContenuMaison,
  type EmplacementMaison,
  type MaMaisonVue,
  type MaisonVisitee,
  type ObjetMaison,
  type PieceAuCatalogue,
} from "@/lib/direct/ma-maison";
import { createPortal } from "react-dom";
import { AjouterChezMoi, EnleverDeChezMoi, LaisserUneSurprise, PendantTonAbsence, QuiPeutEntrer, RegarderADeux, type LigneAbsence } from "./ajouter-chez-moi";
import { PHRASES_REGARDER } from "@/lib/direct/regarder-a-deux";
import { PHRASES_CARNET } from "@/lib/direct/carnet-proches";
import { CarnetDesProches } from "./carnet-proches";
import { FeuilleRevoir } from "./revoir";
import { PHRASES_REVOIR, lienRevoir } from "@/lib/direct/revoir";
import { MOMENTS_DUO, type EmplacementsDuo, type Zone } from "@/lib/direct/pieces-duo";
import { lecteurYouTube, videoYouTube } from "@/lib/direct/tele";

const ROUTE = "/api/direct/ma-piece";

type Lecture = { maison?: MaMaisonVue; catalogue?: CatalogueMaison; error?: string };
async function lire(url: string, corps?: unknown): Promise<Lecture & { statut: number }> {
  try {
    const r = await fetch(url, corps ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) } : { cache: "no-store" });
    return { statut: r.status, ...((await r.json().catch(() => ({}))) as Lecture) };
  } catch {
    return { statut: 0, error: "Pas de réseau : réessaie dans un instant." };
  }
}

/** Les zones qu'on touche : chaque emplacement relevé (un cadre, une lampe : chacun le sien ; le chat : un point). */
type ZoneTouchee = { cle: EmplacementMaison; k: number; z: Zone };
function zonesDe(e: EmplacementsDuo | null): ZoneTouchee[] {
  if (!e) return [];
  const une = (cle: EmplacementMaison, z: Zone | undefined, k = 0): ZoneTouchee[] => (z ? [{ cle, k, z }] : []);
  return [
    ...une("fenetre", e.fenetre),
    ...une("etagere", e.etagere),
    ...une("tele", e.tele),
    ...une("platine", e.platine),
    ...e.cadres.flatMap((z, k) => une("cadres", z, k)),
    ...une("table", e.table),
    ...(e.lampes ?? []).flatMap((z, k) => une("lampes", z, k)),
    ...(e.chat ? une("chat", [Math.max(0, e.chat.x - 0.025), Math.max(0, e.chat.y - 0.06), 0.05, 0.1]) : []),
  ];
}

/** (un lien qu'on peut ouvrir : une page web, jamais autre chose) */
const lienSur = (l?: string) => (l && /^https?:\/\//i.test(l) ? l : "");
/** 📺 (retours du 20 novembre 2026) une vidéo YouTube : elle joue sur la télé de la pièce, on reste dans la scène */
const videoDe = (o: ObjetMaison | null) => (o && o.sorte !== "musique" && lienSur(o.lien) ? videoYouTube(lienSur(o.lien)) : null);
const place = (z: Zone) => ({ left: `${z[0] * 100}%`, top: `${z[1] * 100}%`, width: `${z[2] * 100}%`, height: `${z[3] * 100}%` });

/** 🏠 (lot M2) Ce qu'il a gardé, posé à ses emplacements : un bouton chacun (`data-objet`). */
function ObjetsDeLaMaison({
  contenu,
  e,
  vise,
  enTele,
  onToucher,
  onAppuiLong,
}: {
  contenu: ContenuMaison;
  e: EmplacementsDuo | null;
  vise: string | null;
  /** (📺 la télé joue : son ▶ s'efface) */
  enTele?: boolean;
  onToucher: (o: ObjetMaison) => void;
  onAppuiLong: (o: ObjetMaison) => void;
}) {
  // (🗑️ un appui long : « L'enlever de chez moi » — le toucher qui suit ne compte pas)
  const appui = useRef<{ t: number; long: boolean }>({ t: 0, long: false });
  if (!e) return null;
  const appuyer = (o: ObjetMaison) => {
    window.clearTimeout(appui.current.t);
    appui.current = {
      long: false,
      t: window.setTimeout(() => {
        appui.current.long = true;
        onAppuiLong(o);
      }, 550),
    };
  };
  const lacher = () => window.clearTimeout(appui.current.t);
  const bouton = (o: ObjetMaison, classe: string, style: React.CSSProperties | undefined, enfants: React.ReactNode, ou: string) => (
    <button
      key={`${ou}-${o.id}`}
      type="button"
      className={`mmc-objet ${classe}${vise === o.id ? " vise" : ""}`}
      data-objet={o.id}
      data-place={ou}
      style={style}
      aria-label={`${o.emoji} ${o.titre}`}
      onPointerDown={() => appuyer(o)}
      onPointerUp={lacher}
      onPointerLeave={lacher}
      onPointerCancel={lacher}
      onContextMenu={(ev) => ev.preventDefault()}
      onClick={(ev) => {
        ev.stopPropagation();
        if (appui.current.long) {
          appui.current.long = false;
          return;
        }
        onToucher(o);
      }}
    >
      {enfants}
    </button>
  );
  // eslint-disable-next-line @next/next/no-img-element
  const image = (o: ObjetMaison) => (o.image ? <img src={o.image.src} alt="" draggable={false} decoding="async" /> : <span className="mmc-emoji">{o.emoji}</span>);
  return (
    <>
      {contenu.cadres.map((o, k) => (o && e.cadres[k] ? bouton(o, "mmc-photo", place(e.cadres[k]), image(o), `cadre-${k}`) : null))}
      {contenu.platine &&
        e.platine &&
        bouton(
          contenu.platine,
          "mmc-platine",
          place(e.platine),
          <>
            <i className="mmc-disque" aria-hidden="true" />
            {image(contenu.platine)}
          </>,
          "platine",
        )}
      {contenu.tele &&
        e.tele &&
        bouton(
          contenu.tele,
          "mmc-tele",
          place(e.tele),
          <>
            {image(contenu.tele)}
            {!enTele && (
              <i className="mmc-play" aria-hidden="true">
                ▶
              </i>
            )}
          </>,
          "tele",
        )}
      {contenu.etagere.length > 0 && e.etagere && (
        <div className="mmc-rayon" style={place(e.etagere)}>
          {contenu.etagere.map((o) => bouton(o, `mmc-carte-objet${o.image ? " imagee" : ""}`, undefined, image(o), "etagere"))}
        </div>
      )}
    </>
  );
}

/** 🛋️ La pièce, au doigt : l'image de la pièce (celle de la messagerie), sa figurine à sa place, les emplacements. */
function Piece({
  maison,
  phrase,
  onReglages,
  onMaison,
  visite,
}: {
  maison: MaMaisonVue & { scene: NonNullable<MaMaisonVue["scene"]> };
  phrase?: string;
  onReglages: () => void;
  onMaison: (m: MaMaisonVue) => void;
  /** 🚪 (lot M4) en visite chez quelqu'un : son prénom ; frapper à sa porte (rien d'autre ne s'y fait) */
  visite?: {
    prenom: string;
    frappe: boolean;
    onFrapper: () => Promise<string | null>;
    /** 🎁✨ (lot M5) un proche peut laisser une surprise ; les siennes qui attendent ; ce qui est nouveau aujourd'hui */
    peutLaisser?: boolean;
    mesCadeaux?: number;
    nouveaux?: string[];
    cle?: string;
    /** 💬 (lot M5) sa question du jour (à ses proches) */
    question?: QuestionChezLui;
  };
}) {
  const { scene, figurine } = maison;
  const pano = scene.panorama;
  const ratio = pano.largeur / Math.max(1, pano.hauteur);
  const cadre = useRef<HTMLDivElement>(null);
  const defile = useRef<HTMLDivElement>(null);
  const [hauteur, setHauteur] = useState(0);
  // (l'indice, « Touche les objets de ta pièce » : il s'en va au premier toucher)
  const [indice, setIndice] = useState(true);
  const [bulle, setBulle] = useState<{ cle: EmplacementMaison; k: number } | null>(null);
  const [allumees, setAllumees] = useState<number[]>([]);
  const [saute, setSaute] = useState(0);
  // (la position où l'on a fait défiler la pièce soi-même : un défilement qui y arrive n'est pas un geste de lui)
  const cible = useRef<number | null>(null);
  // 🏠 (lot M2) l'objet touché, la photo en grand ; ✨ l'arrivée (sa phrase, l'objet que la caméra regarde)
  const [objet, setObjet] = useState<ObjetMaison | null>(null);
  const [grand, setGrand] = useState<ObjetMaison | null>(null);
  // 📺 (retours du 20 novembre 2026) la vidéo qui passe sur la télé de la pièce : on reste dans la scène
  const [enTele, setEnTele] = useState<{ id: string; debut?: number; objet: string } | null>(null);
  const [arrivee, setArrivee] = useState("");
  const [vise, setVise] = useState<string | null>(null);
  const enVisite = useRef(false);
  const interrompre = useRef<() => void>(() => undefined);
  // ＋🗑️ (lot M2, deuxième partie) ajouter chez moi ; l'objet à enlever (un appui long) ; ce qui vient d'être fait
  const [ajout, setAjout] = useState(false);
  const [qui, setQui] = useState(false);
  // 👯 (21 novembre 2026, section 25) le carnet de mes proches
  const [carnet, setCarnet] = useState(false);
  // 📼 (section 31 de Découvrir) mes vidéos déjà vues
  const [revoir, setRevoir] = useState(false);
  // 🎁 (lot M5) le cadeau touché sur la table (et ouvert) ; la surprise à laisser, en visite ; les miennes qui attendent
  const [cadeau, setCadeau] = useState<CadeauMaison | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [surprise, setSurprise] = useState(false);
  // 🎬 (« Regarder à deux », section 24) la feuille, en visite chez un proche
  const [regarder, setRegarder] = useState(false);
  const [mesCadeaux, setMesCadeaux] = useState(visite?.mesCadeaux ?? 0);
  // 💬 (lot M5) la question du jour : la bulle ouverte ; en visite, sa question (mise à jour quand on y répond)
  const [questionOuverte, setQuestionOuverte] = useState(false);
  const [question, setQuestion] = useState<QuestionChezLui | undefined>(visite?.question);
  const [reponse, setReponse] = useState("");
  const [erreurQ, setErreurQ] = useState("");
  const [frappe, setFrappe] = useState(Boolean(visite?.frappe));
  // 🎨 (la maquette) « Pendant ton absence » ouvert ; en visite, la porte qui s'ouvre et « Oh, te voilà ! Entre 😊 »
  const [absenceOuverte, setAbsenceOuverte] = useState(false);
  const [accueil, setAccueil] = useState(false);
  // (la porte ouverte, on est entré : ce qu'il a mis aujourd'hui peut se montrer — juste après « Léa saura que tu as frappé »)
  const [entre, setEntre] = useState(!visite || Boolean(visite.frappe));
  const [aEnlever, setAEnlever] = useState<ObjetMaison | null>(null);
  const [fait, setFait] = useState("");
  /** (le nouvel objet : la caméra va le voir, il s'éclaire un instant) */
  /** 📺 Sa vidéo sur la télé de la pièce (la caméra y va) ; `false` : pas une vidéo YouTube, ou pas de télé ici. */
  const jouerALaTele = (o: ObjetMaison) => {
    const v = videoDe(o);
    if (!v || !scene.emplacements?.tele) return false;
    setEnTele({ ...v, objet: o.id });
    window.requestAnimationFrame(() => {
      const el = defile.current?.querySelector<HTMLElement>("[data-tele-joue]");
      if (!el) return;
      enVisite.current = true;
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      window.setTimeout(() => (enVisite.current = false), 1200);
    });
    return true;
  };
  const montrer = (id: string) => {
    window.requestAnimationFrame(() => {
      const el = defile.current?.querySelector<HTMLElement>(`[data-objet="${id}"]`);
      if (!el) return;
      enVisite.current = true;
      el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      setVise(id);
      window.setTimeout(() => {
        setVise(null);
        enVisite.current = false;
      }, 1800);
    });
  };
  // (la hauteur de la scène : la largeur du panorama, et la taille d'image à demander)
  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const mesurer = () => setHauteur(el.clientHeight);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // (à l'arrivée, et quand la pièce change : la figurine au milieu de l'écran)
  // (la largeur du panorama est posée avant que l'image arrive — sans quoi, sur un téléphone, le défilement restait
  // collé à gauche, la figurine hors de l'écran ; on recentre encore à l'image suivante, tant qu'on n'a pas bougé)
  const touche = useRef(false);
  // (le cadrage, comme la messagerie : l'image au milieu de l'écran — sans jamais couper sa figurine)
  const rFig = figurine ? figurine.largeur / Math.max(1, figurine.hauteur) : 0.7;
  const cadrage = (h: number, l: number) => {
    const w = h * ratio;
    const fx = scene.centre.x * w;
    const demi = (scene.centre.hauteur * h * rFig) / 2 + 8;
    return Math.max(0, Math.min(w - l, Math.min(fx - demi, Math.max(fx + demi - l, w / 2 - l / 2))));
  };
  // (vrai : c'est fait — ou il n'y a plus rien à faire ; faux : le défilement n'a pas encore pris, on réessaiera)
  const centrer = () => {
    const d = defile.current;
    if (!d || touche.current || enVisite.current) return true;
    if (!hauteur || d.scrollWidth <= d.clientWidth) return false;
    const voulu = Math.min(d.scrollWidth - d.clientWidth, cadrage(hauteur, d.clientWidth));
    if (Math.abs(d.scrollLeft - voulu) < 1) return true;
    cible.current = voulu;
    d.scrollLeft = voulu;
    return Math.abs(d.scrollLeft - voulu) < 1;
  };
  const centrerRef = useRef(centrer);
  useEffect(() => {
    centrerRef.current = centrer;
  });
  // (sur un téléphone lent, la pièce n'est pas toujours prête à défiler tout de suite : on réessaie à chaque image,
  // une quarantaine de fois au plus, tant qu'il n'a pas touché)
  useLayoutEffect(() => {
    touche.current = false;
    let r = 0;
    let essais = 0;
    const encore = () => {
      if (centrerRef.current() || ++essais > 40) return;
      r = window.requestAnimationFrame(encore);
    };
    encore();
    return () => window.cancelAnimationFrame(r);
  }, [hauteur, ratio, scene.piece, scene.centre.x, scene.centre.hauteur, rFig]);
  // ✨ L'ARRIVÉE (lot M2) : ce qu'il a gardé depuis sa dernière visite — la phrase, puis la caméra passe sur chacun (un
  // toucher l'arrête) ; ensuite le serveur retient la visite (`vu`). Rien de nouveau : la visite est retenue tout de suite.
  const pret = hauteur > 0;
  const enVisiteChez = Boolean(visite);
  // (🚪 en visite, l'arrivée attend qu'on soit entré : on a frappé)
  const porteOuverte = entre;
  useEffect(() => {
    if (!pret || !porteOuverte) return;
    // (la réponse est lue : sans quoi la requête resterait ouverte ; en visite, rien n'est retenu — c'est chez lui)
    const dire = () => {
      if (enVisiteChez) return;
      void fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "vu" }) })
        .then((r) => r.text())
        .catch(() => undefined);
    };
    // (chez moi : 🚪 qui a frappé pendant mon absence (lot M5), puis ✨ ce que j'ai gardé ; en visite chez un proche :
    // ✨ ce qu'il a mis chez lui aujourd'hui)
    // (💬 lot M5 : qui a répondu à ma question du jour depuis ma dernière visite)
    const repondus = visite ? [] : [...new Set((maison.question?.reponses ?? []).filter((r) => (Date.parse(r.le) || 0) > (maison.vuLe ?? 0)).map((r) => r.de))];
    const annonces = visite ? [] : [phraseAbsence(maison.absence ?? []), repondus.length ? PHRASES_QUESTION.arrivee(repondus) : null].filter((x): x is string => Boolean(x));
    const absence = annonces[0] ?? null;
    const neufs = visite?.nouveaux?.length ? objetsPlaces(maison.contenu ?? { cadres: [], platine: null, tele: null, etagere: [], total: 0 }).filter((o) => visite.nouveaux!.includes(o.id)) : [];
    const a = visite
      ? neufs.length
        ? { phrase: phraseNouveautes(visite.prenom, neufs) ?? "", ids: neufs.slice(0, 4).map((o) => o.id) }
        : null
      : maison.contenu
        ? arriveeChezMoi(maison.contenu, maison.vuLe ?? 0)
        : null;
    if (!a && !absence) {
      dire();
      return;
    }
    const d = defile.current;
    const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const minuteries: number[] = [];
    let fini = false;
    const aller = (left: number) => {
      if (!d) return;
      enVisite.current = true;
      d.scrollTo({ left, behavior: reduit ? "auto" : "smooth" });
    };
    const viser = (id: string) => {
      const el = d?.querySelector<HTMLElement>(`[data-objet="${id}"]`);
      if (!d || !el) return;
      const r = el.getBoundingClientRect();
      const rd = d.getBoundingClientRect();
      aller(d.scrollLeft + r.left + r.width / 2 - (rd.left + rd.width / 2));
      setVise(id);
    };
    const finir = () => {
      if (fini) return;
      fini = true;
      minuteries.forEach((t) => window.clearTimeout(t));
      enVisite.current = false;
      setVise(null);
      setArrivee("");
      dire();
    };
    interrompre.current = finir;
    let t = 0;
    if (absence) {
      void Promise.resolve().then(() => !fini && setArrivee(absence));
      t = 2800;
      for (const autre of annonces.slice(1)) {
        minuteries.push(window.setTimeout(() => setArrivee(autre), t));
        t += 2800;
      }
    }
    if (a) {
      if (absence) minuteries.push(window.setTimeout(() => setArrivee(a.phrase), t));
      else void Promise.resolve().then(() => !fini && setArrivee(a.phrase));
      t += 900;
      for (const id of a.ids) {
        minuteries.push(window.setTimeout(() => viser(id), t));
        t += 1900;
      }
      minuteries.push(
        window.setTimeout(() => {
          setVise(null);
          if (d) aller(cadrage(d.clientHeight, d.clientWidth));
        }, t),
      );
      t += 1100;
    }
    minuteries.push(window.setTimeout(finir, t));
    return () => {
      // (sans retenir la visite : l'arrivée reprendra — un nouveau rendu, le mode strict)
      fini = true;
      minuteries.forEach((x) => window.clearTimeout(x));
      enVisite.current = false;
      interrompre.current = () => undefined;
    };
    // (une fois la scène mesurée)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret, enVisiteChez, porteOuverte]);
  const zones = zonesDe(scene.emplacements);
  const dit = bulle ? EMPLACEMENTS_MAISON[bulle.cle] : null;
  const moment = MOMENTS_DUO.find((m) => m.cle === scene.moment);
  const c = scene.centre;
  // 🎨 (la maquette) ce qui attend chez moi : qui a frappé, les surprises, les réponses, ce qui est arrivé — et sa pastille
  const neufsChezMoi = visite || !maison.contenu ? null : arriveeChezMoi(maison.contenu, maison.vuLe ?? 0);
  const cadeauxEnAttente = (maison.table ?? []).filter((g) => g.attente);
  const repondus = visite ? [] : [...new Set((maison.question?.reponses ?? []).filter((r) => (Date.parse(r.le) || 0) > (maison.vuLe ?? 0)).map((r) => r.de))];
  const fermerTout = () => {
    setIndice(false);
    setBulle(null);
    setObjet(null);
    setCadeau(null);
  };
  const lignesAbsence: LigneAbsence[] = visite
    ? []
    : [
        ...(maison.absence ?? []).map((p, k) => ({ cle: `frappe-${k}`, e: "🚪", texte: PHRASES_BAS.frappe(p) })),
        ...(maison.aRevoir ?? []).map((x) => ({
          cle: `revoir-${x.id}`,
          e: "💬",
          texte: PHRASES_REVOIR.ligne(x.de, x.titre),
          action: { nom: PHRASES_REVOIR.revoir, faire: () => window.location.assign(lienRevoir(x.id)) },
        })),
        ...(maison.regarder ?? []).map((x) => ({
          cle: `regarder-${x.cle}`,
          e: "🎬",
          texte: PHRASES_REGARDER.ligne(x.prenom, x.titre),
          action: { nom: PHRASES_REGARDER.regarder, faire: () => window.location.assign(`/univers/salons?chez=${encodeURIComponent(x.cle)}`) },
        })),
        ...cadeauxEnAttente.map((g) => ({
          cle: `cadeau-${g.id}`,
          e: "🎁",
          texte: PHRASES_BAS.cadeau(g.de),
          action: {
            nom: PHRASES_BAS.ouvrir,
            faire: () => {
              setAbsenceOuverte(false);
              fermerTout();
              setOuvert(false);
              setCadeau(g);
            },
          },
        })),
        ...(maison.question?.reponses.length
          ? [
              {
                cle: "question",
                e: "💬",
                texte: PHRASES_BAS.reponses(new Set(maison.question.reponses.map((r) => r.de)).size),
                detail: `« ${maison.question.q} »`,
                action: {
                  nom: PHRASES_BAS.voir,
                  faire: () => {
                    setAbsenceOuverte(false);
                    fermerTout();
                    setQuestionOuverte(true);
                  },
                },
              },
            ]
          : []),
        ...(neufsChezMoi?.ids.length
          ? [
              {
                cle: "garde",
                e: "✨",
                texte: neufsChezMoi.phrase.replace(/^✨\s*/u, ""),
                action: {
                  nom: PHRASES_BAS.voir,
                  faire: () => {
                    setAbsenceOuverte(false);
                    fermerTout();
                    montrer(neufsChezMoi.ids[0]);
                  },
                },
              },
            ]
          : []),
      ];
  const pastille = (maison.absence?.length ?? 0) + (maison.regarder?.length ?? 0) + (maison.aRevoir?.length ?? 0) + cadeauxEnAttente.length + (repondus.length ? 1 : 0) + (neufsChezMoi?.ids.length ? 1 : 0);
  // (en visite : ce qui est nouveau chez lui aujourd'hui, en puces)
  const neufsVisite = visite?.nouveaux?.length ? objetsPlaces(maison.contenu ?? { cadres: [], platine: null, tele: null, etagere: [], total: 0 }).filter((o) => visite.nouveaux!.includes(o.id)).slice(0, 3) : [];
  const questionIci = visite ? question : maison.question;
  const frapper = async () => {
    if (!visite) return;
    const e = await visite.onFrapper();
    if (e) {
      setFait(e);
      return;
    }
    setFrappe(true);
    setAccueil(true);
    setFait(PHRASES_VISITE.frappe(visite.prenom));
    window.setTimeout(() => {
      setFait("");
      setEntre(true);
    }, 2600);
    window.setTimeout(() => setAccueil(false), 3200);
  };
  return (
    <div className={`mmc-scene moment-${scene.moment}${visite ? " en-visite" : ""}`} data-piece={scene.piece} data-moment={scene.moment}>
      {/* 🎨 l'en-tête : sa figurine en médaillon, « Ma maison » (ou « Chez Léa »), sa pièce et son moment, son humeur */}
      <header className="mmc-entete">
        {visite && (
          <a className="mmc-rond mmc-retour" href="/collection#proches" aria-label={PHRASES_VISITE.retour}>
            ‹
          </a>
        )}
        {figurine && (
          <span className="mmc-medaillon" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={figurine.src} alt="" />
          </span>
        )}
        <span className="mmc-titre">
          <b className="mmc-nom">{visite ? `🏠 ${PHRASES_VISITE.chez(visite.prenom)}` : PHRASES_BAS.maMaison}</b>
          <small className="mmc-ou">
            {scene.emoji} {scene.nom}
            {moment && ` · ${moment.emoji} ${moment.nom.toLowerCase()}`}
          </small>
        </span>
        {maison.humeur && (
          <span className="mmc-humeur" data-humeur>
            {maison.humeur.emoji} {maison.humeur.nom}
          </span>
        )}
        {!visite && (
          <button type="button" className="mmc-rond" onClick={onReglages} aria-label="Changer de pièce" data-geste="reglages">
            ⚙️
          </button>
        )}
      </header>
      {/* (la pièce, en carte ; tant qu'on n'a rien touché, ce qui se touche est entouré) */}
      {/* (21 novembre 2026, le propriétaire : « il y a des rectangles blancs autour de ce qui est cliquable » — plus de
          contours : « 👆 Touche les objets » suffit) */}
      <div className="mmc-cadre" ref={cadre}>
      <div
        className="mmc-defile"
        ref={defile}
        onScroll={(e) => {
          const c = cible.current;
          if (c !== null && Math.abs(e.currentTarget.scrollLeft - c) < 2) return;
          cible.current = null;
          if (enVisite.current) return;
          touche.current = true;
          setIndice(false);
          setBulle(null);
          setObjet(null);
        }}
        onPointerDown={() => {
          interrompre.current();
          setIndice(false);
        }}
      >
        <div className="mmc-pano" style={{ backgroundImage: `url(${pano.flou})`, ...(hauteur ? { width: Math.round(hauteur * ratio) } : {}) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mmc-fond"
            src={pano.src}
            srcSet={pano.srcset}
            sizes={hauteur ? `${Math.round(hauteur * ratio)}px` : "2400px"}
            width={pano.largeur}
            height={pano.hauteur}
            alt={scene.nom}
            draggable={false}
            decoding="async"
          />
          {zones.map(({ cle, k, z }) => (
            <button
              key={`${cle}${k}`}
              type="button"
              className={`mmc-zone${bulle?.cle === cle && bulle.k === k ? " touchee" : ""}`}
              data-zone={cle}
              style={{ left: `${z[0] * 100}%`, top: `${z[1] * 100}%`, width: `${z[2] * 100}%`, height: `${z[3] * 100}%` }}
              aria-label={`${EMPLACEMENTS_MAISON[cle].emoji} ${EMPLACEMENTS_MAISON[cle].nom}`}
              onClick={() => {
                setIndice(false);
                if (cle === "lampes") setAllumees((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
                setObjet(null);
                setBulle({ cle, k });
              }}
            >
              {cle === "lampes" && <span className={`mmc-lueur${allumees.includes(k) ? " allumee" : ""}`} aria-hidden="true" />}
            </button>
          ))}
          {/* 🏠 (lot M2) ce qu'il a gardé, à sa place */}
          {maison.contenu && (
            <ObjetsDeLaMaison
              contenu={maison.contenu}
              e={scene.emplacements}
              vise={vise}
              enTele={Boolean(enTele)}
              onToucher={(o) => {
                setIndice(false);
                setBulle(null);
                setObjet(o);
                // (📺 la télé touchée : sa vidéo passe sur son écran, tout de suite)
                if (o.id === maison.contenu?.tele?.id) jouerALaTele(o);
              }}
              onAppuiLong={(o) => {
                if (visite) return;
                setObjet(null);
                setAEnlever(o);
              }}
            />
          )}
          {/* 📺 la vidéo, sur l'écran de la télé de la pièce (le lecteur de YouTube tout simple, sans cookie) */}
          {enTele && scene.emplacements?.tele && (
            <div className="mmc-ecran" style={place(scene.emplacements.tele)} data-tele-joue={enTele.id}>
              <iframe key={enTele.id} title="La télé" src={lecteurYouTube(enTele.id, { debut: enTele.debut })} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
            </div>
          )}
          {/* 🎁 (lot M5) sur la table basse : les cadeaux des proches — emballés tant qu'ils ne sont pas ouverts */}
          {maison.table && maison.table.length > 0 && scene.emplacements?.table && (
            <div className="mmc-table" style={place(scene.emplacements.table)}>
              {maison.table.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`mmc-cadeau${g.attente ? " emballe" : ""}`}
                  data-cadeau={g.id}
                  data-attente={g.attente ? "1" : undefined}
                  aria-label={g.attente ? PHRASES_CADEAU.attente(g.de) : `${g.emoji} ${g.nom}`}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    setIndice(false);
                    setBulle(null);
                    setObjet(null);
                    setOuvert(false);
                    setCadeau(g);
                  }}
                >
                  {g.attente ? "🎁" : g.emoji}
                </button>
              ))}
            </div>
          )}
          {/* 🪑 sa figurine, au centre : son ombre au sol, puis elle, dans son fauteuil */}
          <span className="mmc-ombre" style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%`, width: `${c.hauteur * 0.62 * (100 / ratio)}%` }} aria-hidden="true" />
          {figurine && (
            <button
              type="button"
              className="mmc-fig"
              data-saute={saute % 2}
              style={{ left: `${c.x * 100}%`, bottom: `${(1 - c.y) * 100}%`, height: `${c.hauteur * 100}%` }}
              aria-label="Ma figurine, chez moi"
              onClick={() => {
                setIndice(false);
                setBulle(null);
                setObjet(null);
                setSaute((n) => n + 1);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={figurine.src} srcSet={figurine.srcset} sizes={hauteur ? `${Math.round(hauteur * c.hauteur * (figurine.largeur / Math.max(1, figurine.hauteur)))}px` : "360px"} alt="" draggable={false} />
            </button>
          )}
          {/* 😊 (la maquette) en visite, la porte ouverte : sa figurine dit bonjour */}
          {accueil && (
            <span className="mmc-accueil" role="status" data-accueil style={{ left: `${c.x * 100}%`, bottom: `${(1 - c.y + c.hauteur) * 100}%` }}>
              {PHRASES_BAS.entre}
            </span>
          )}
        </div>
      </div>
      {/* 🏠 (lot D5 de Découvrir) « Mes salons » : les salons ouverts où je vais, en fanions — chez moi seulement */}
      {!visite && maison.salons?.length ? (
        <nav className="mmc-fanions" aria-label="Mes salons" data-fanions={maison.salons.length}>
          {maison.salons.map((x) => (
            <a key={x.theme} href={`/univers/salons?theme=${x.theme}`} data-fanion={x.theme} title={x.nom}>
              <span aria-hidden="true">{x.e}</span>
              <small>{x.nom}</small>
            </a>
          ))}
        </nav>
      ) : null}
      {arrivee && (
        <p className="mmc-arrivee" role="status" data-arrivee>
          {arrivee}
        </p>
      )}
      {indice && !arrivee && !objet && !(visite && !frappe) && (
        <div className="mmc-indice">
          {phrase && <span>{phrase}</span>}
          <b aria-hidden="true">{visite ? PHRASES_BAS.indiceVisite : PHRASES_BAS.indiceMoi}</b>
        </div>
      )}
      {dit && bulle && (
        <div className="mmc-bulle" role="status" data-bulle={bulle.cle}>
          <b>
            {dit.emoji} {bulle.cle === "lampes" ? (allumees.includes(bulle.k) ? "Lampe allumée" : "Lampe éteinte") : dit.nom}
          </b>
          <span>{bulle.cle === "fenetre" && moment ? `${dit.dit} Là, c’est ${moment.nom.toLowerCase()}.` : dit.dit}</span>
          <button type="button" onClick={() => setBulle(null)} aria-label="Fermer">
            ✕
          </button>
        </div>
      )}
      {objet && (
        <div className="mmc-bulle" role="status" data-bulle="objet" data-objet-bulle={objet.id}>
          <b>
            {objet.emoji} {objet.titre}
          </b>
          <span>{ditDeLObjet(objet, visite?.prenom)}</span>
          {(lienSur(objet.lien) || (objet.sorte === "photo" && objet.image)) && (
            <span className="mmc-actions">
              {videoDe(objet) && scene.emplacements?.tele ? (
                // (📺 une vidéo YouTube : elle passe sur la télé de la pièce — jamais un départ vers YouTube)
                <button type="button" className="mmc-action" data-tele={enTele?.objet === objet.id ? "joue" : "eteinte"} onClick={() => (enTele?.objet === objet.id ? setEnTele(null) : jouerALaTele(objet))}>
                  {enTele?.objet === objet.id ? PHRASES_MAISON.eteindre : PHRASES_MAISON.regarder}
                </button>
              ) : (
                lienSur(objet.lien) && (
                  <a className="mmc-action" href={lienSur(objet.lien)} target="_blank" rel="noopener noreferrer" data-ouvrir>
                    {objet.sorte === "musique" ? PHRASES_MAISON.ecouter : PHRASES_MAISON.regarder}
                  </a>
                )
              )}
              {objet.sorte === "photo" && objet.image && (
                <a
                  className="mmc-action"
                  href="#"
                  role="button"
                  data-grand
                  onClick={(ev) => {
                    ev.preventDefault();
                    setGrand(objet);
                  }}
                >
                  {PHRASES_MAISON.voir}
                </a>
              )}
            </span>
          )}
          <button type="button" onClick={() => setObjet(null)} aria-label="Fermer">
            ✕
          </button>
        </div>
      )}
      {questionOuverte && (visite ? question : maison.question) && (
        <div className="mmc-bulle" role="status" data-bulle="question">
          <b>{(visite ? question : maison.question)!.q}</b>
          {!visite ? (
            <span className="mmc-reponses">
              {maison.question!.reponses.map((r, i) => (
                <span key={i} data-reponse>
                  <strong>{r.de}</strong> : {r.texte}
                </span>
              ))}
            </span>
          ) : question?.maReponse ? (
            <span className="mmc-reponses">
              <span data-ma-reponse>
                <strong>{PHRASES_QUESTION.toi}</strong> : {question.maReponse}
              </span>
              <span data-sa-reponse>
                <strong>{visite.prenom}</strong> : {question.saReponse}
              </span>
            </span>
          ) : (
            <span className="mmc-repondre">
              <small>{PHRASES_QUESTION.avant(visite.prenom)}</small>
              {question?.choix ? (
                <span className="mmc-actions">
                  {question.choix.map((c) => (
                    <a
                      key={c}
                      className="mmc-action"
                      href="#"
                      role="button"
                      data-choix={c}
                      onClick={(ev) => {
                        ev.preventDefault();
                        setReponse(c);
                      }}
                      aria-pressed={reponse === c}
                    >
                      {c}
                    </a>
                  ))}
                </span>
              ) : (
                <input className="mmc-champ-reponse" data-champ="reponse" maxLength={120} placeholder={PHRASES_QUESTION.indice} value={reponse} onChange={(e) => setReponse(e.target.value)} />
              )}
              {erreurQ && <small className="mmc-erreur-q">{erreurQ}</small>}
              <a
                className="mmc-action"
                href="#"
                role="button"
                data-repondre
                onClick={async (ev) => {
                  ev.preventDefault();
                  if (!reponse.trim()) return;
                  setErreurQ("");
                  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "repondre", chez: visite.cle, texte: reponse }) })
                    .then(async (x) => ({ ok: x.ok, j: (await x.json().catch(() => ({}))) as { visite?: MaisonVisitee; error?: string } }))
                    .catch(() => ({ ok: false, j: { error: "Pas de réseau : réessaie dans un instant." } as { visite?: MaisonVisitee; error?: string } }));
                  if (!r.ok) return setErreurQ(r.j.error || "Ça n’a pas marché : réessaie.");
                  if (r.j.visite?.etat === "ouvert" && r.j.visite.question) setQuestion(r.j.visite.question);
                }}
              >
                {PHRASES_QUESTION.repondre}
              </a>
            </span>
          )}
          <button type="button" onClick={() => setQuestionOuverte(false)} aria-label="Fermer">
            ✕
          </button>
        </div>
      )}
      {cadeau && (
        <div className="mmc-bulle" role="status" data-bulle="cadeau" data-cadeau-bulle={cadeau.id}>
          {cadeau.attente && !visite && !ouvert ? (
            <>
              <b>{PHRASES_CADEAU.attente(cadeau.de)}</b>
              <span className="mmc-actions">
                <a
                  className="mmc-action"
                  href="#"
                  role="button"
                  data-ouvrir-cadeau
                  onClick={(ev) => {
                    ev.preventDefault();
                    setOuvert(true);
                  }}
                >
                  {PHRASES_CADEAU.ouvrir}
                </a>
              </span>
            </>
          ) : (
            <>
              <b>
                {cadeau.emoji} {cadeau.nom}
              </b>
              <span>
                {PHRASES_CADEAU.de(cadeau.de)}
                {cadeau.mot ? ` · « ${cadeau.mot} »` : ""}
              </span>
              {cadeau.attente && !visite && (
                <span className="mmc-actions">
                  {[true, false].map((oui) => (
                    <a
                      key={String(oui)}
                      className="mmc-action"
                      href="#"
                      role="button"
                      data-decider={oui ? "oui" : "non"}
                      onClick={async (ev) => {
                        ev.preventDefault();
                        const g = cadeau;
                        setCadeau(null);
                        await fetch("/api/direct/visites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "decider", id: g.id, oui }) })
                          .then((r) => r.text())
                          .catch(() => undefined);
                        const r = await fetch(ROUTE, { cache: "no-store" })
                          .then((x) => x.json())
                          .catch(() => null);
                        if (r?.maison) onMaison(r.maison as MaMaisonVue);
                      }}
                    >
                      {oui ? PHRASES_CADEAU.garder : PHRASES_CADEAU.nonMerci}
                    </a>
                  ))}
                </span>
              )}
            </>
          )}
          <button type="button" onClick={() => setCadeau(null)} aria-label="Fermer">
            ✕
          </button>
        </div>
      )}
      {fait && (
        <p className="mmc-fait" role="status" data-fait>
          {fait}
        </p>
      )}
      {/* 🚪 (la maquette) en visite : sa porte, d'abord — on frappe, sa figurine ouvre */}
      {visite && !frappe && (
        <div className="mmc-porte" data-porte>
          <span className="mmc-battant" aria-hidden="true">
            {figurine && (
              <span className="mmc-medaillon">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={figurine.src} alt="" />
              </span>
            )}
          </span>
          <p>{PHRASES_BAS.porte(visite.prenom)}</p>
          <button type="button" className="mmc-toc" data-geste="frapper" onClick={() => void frapper()}>
            {PHRASES_BAS.toctoc}
          </button>
        </div>
      )}
      </div>
      {/* 🎨 (la maquette) le bas : ce qu'on peut faire aujourd'hui, puis les trois grands boutons */}
      <div className="mmc-bas" style={visite && !frappe ? { visibility: "hidden" } : undefined}>
        {(visite ? neufsVisite.length > 0 || questionIci : true) && (
          <div className="mmc-puces">
            <span className="mmc-surtitre">{visite ? PHRASES_BAS.nouveau : PHRASES_BAS.aujourdhui}</span>
            {neufsVisite.map((o) => (
              <button
                key={o.id}
                type="button"
                className="mmc-puce"
                data-puce={o.id}
                onClick={() => {
                  fermerTout();
                  setQuestionOuverte(false);
                  setObjet(o);
                  montrer(o.id);
                }}
              >
                {puceDeLObjet(o)}
              </button>
            ))}
            {questionIci && (
              <button
                type="button"
                className="mmc-puce"
                data-geste="question"
                title={visite ? PHRASES_QUESTION.chezLui(visite.prenom) : PHRASES_QUESTION.chezMoi}
                onClick={() => {
                  fermerTout();
                  setQuestionOuverte(true);
                }}
              >
                {PHRASES_BAS.question}
              </button>
            )}
            {!visite && (
              <a className="mmc-puce" href="/collection#decouvrir" data-puce="tele">
                {PHRASES_BAS.maTele}
              </a>
            )}
            {!visite && (
              <button
                type="button"
                className="mmc-puce"
                data-puce="revoir"
                onClick={() => {
                  fermerTout();
                  setRevoir(true);
                }}
              >
                {PHRASES_REVOIR.puce}
                {(maison.aRevoir?.length ?? 0) > 0 && <i className="mmc-puce-n">{maison.aRevoir!.length}</i>}
              </button>
            )}
          </div>
        )}
        {!visite ? (
          <div className="mmc-gros">
            <button
              type="button"
              className="mmc-gros-bouton fort"
              data-geste="absence"
              onClick={() => {
                fermerTout();
                setAbsenceOuverte(true);
              }}
            >
              <span aria-hidden="true">🛎️</span>
              {PHRASES_BAS.absence}
              {pastille > 0 && (
                <i className="mmc-pastille" data-pastille={pastille}>
                  {pastille}
                </i>
              )}
            </button>
            <button
              type="button"
              className="mmc-gros-bouton"
              data-geste="ajouter"
              onClick={() => {
                fermerTout();
                setAjout(true);
              }}
            >
              <span aria-hidden="true">＋</span>
              {PHRASES_BAS.ajouter}
            </button>
            {/* (👯 21 novembre 2026 : le carnet de mes proches — « Comme la voient tes proches » est dedans) */}
            <button
              type="button"
              className="mmc-gros-bouton"
              data-geste="proches"
              data-visibilite={maison.visibilite ?? "proches"}
              onClick={() => {
                fermerTout();
                setCarnet(true);
              }}
            >
              <span aria-hidden="true">👯</span>
              {PHRASES_CARNET.bouton}
            </button>
          </div>
        ) : (
          visite.peutLaisser && (
            <div className="mmc-gros mmc-actions-visite">
              <button type="button" className="mmc-gros-bouton" data-geste="surprise" onClick={() => setSurprise(true)}>
                <span aria-hidden="true">🎁</span>
                {PHRASES_BAS.surprise}
              </button>
              <button type="button" className="mmc-gros-bouton" data-geste="regarder" onClick={() => setRegarder(true)}>
                <span aria-hidden="true">🎬</span>
                {PHRASES_REGARDER.bouton}
              </button>
              <a className="mmc-gros-bouton fort" href="/collection#proches" data-geste="salon">
                <span aria-hidden="true">💬</span>
                {PHRASES_BAS.salon}
              </a>
            </div>
          )
        )}
        {visite && mesCadeaux > 0 && (
          <small className="mmc-mes-cadeaux" data-mes-cadeaux>
            {PHRASES_CADEAU.dejaLa(mesCadeaux)}
          </small>
        )}
      </div>
      {absenceOuverte &&
        createPortal(<PendantTonAbsence lignes={lignesAbsence} onFermer={() => setAbsenceOuverte(false)} />, document.body)}
      {surprise &&
        visite?.cle &&
        createPortal(
          <LaisserUneSurprise
            cle={visite.cle}
            prenom={visite.prenom}
            onFermer={() => setSurprise(false)}
            onPosee={() => {
              setSurprise(false);
              setFrappe(true);
              setMesCadeaux((n) => n + 1);
              setFait(PHRASES_CADEAU.posee(visite.prenom));
              window.setTimeout(() => setFait(""), 2600);
            }}
          />,
          document.body,
        )}
      {regarder &&
        visite?.cle &&
        createPortal(<RegarderADeux cle={visite.cle} prenom={visite.prenom} onFermer={() => setRegarder(false)} onPropose={() => setFrappe(true)} />, document.body)}
      {revoir && createPortal(<FeuilleRevoir onFermer={() => setRevoir(false)} />, document.body)}
      {carnet &&
        createPortal(
          <CarnetDesProches
            onFermer={() => setCarnet(false)}
            onQui={() => {
              setCarnet(false);
              setQui(true);
            }}
          />,
          document.body,
        )}
      {qui &&
        createPortal(
          <QuiPeutEntrer
            maison={maison}
            onFermer={() => setQui(false)}
            onChoisi={(m) => {
              setQui(false);
              onMaison(m);
            }}
          />,
          document.body,
        )}
      {/* (posées sur la page entière : par-dessus la pièce et le menu, quoi qu'il arrive) */}
      {ajout &&
        createPortal(
          <AjouterChezMoi
            onFermer={() => setAjout(false)}
            onAjoute={(r) => {
              setAjout(false);
              setIndice(false);
              onMaison(r.maison);
              setFait(PHRASES_AJOUT.fait(r.ou));
              window.setTimeout(() => setFait(""), 2600);
              montrer(r.id);
            }}
          />,
          document.body,
        )}
      {aEnlever &&
        createPortal(
          <EnleverDeChezMoi
            objet={aEnlever}
            onFermer={() => setAEnlever(null)}
            onEnleve={(m) => {
              setAEnlever(null);
              onMaison(m);
              setFait(PHRASES_AJOUT.enleve);
              window.setTimeout(() => setFait(""), 2200);
            }}
          />,
          document.body,
        )}
      {grand?.image && (
        <div className="mmc-grand" role="dialog" aria-modal="true" aria-label={grand.titre} data-photo-grand onClick={() => setGrand(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={grand.image.src} alt={grand.titre} />
          <p>{ditDeLObjet(grand, visite?.prenom)}</p>
          <button type="button" aria-label="Fermer">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/** 📋 « Choisis ta pièce » : les pièces prêtes, dans l'ordre de son âge ; un toucher la montre en grand. */
function Choix({ catalogue, actuelle, onChoisir, onFermer }: { catalogue: CatalogueMaison | null; actuelle: string | null; onChoisir: (p: PieceAuCatalogue) => Promise<string | null>; onFermer?: () => void }) {
  const [apercu, setApercu] = useState<PieceAuCatalogue | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [dit, setDit] = useState("");
  const pretes = catalogue?.pieces.filter((p) => p.vignette) ?? [];
  return (
    <div className="mmc-choix" role="dialog" aria-label={actuelle ? "Changer de pièce" : "Choisis ta pièce"}>
      <header>
        <h2>{actuelle ? "Changer de pièce" : "Choisis ta pièce"}</h2>
        {onFermer && (
          <button type="button" className="mmc-fermer" onClick={onFermer} aria-label="Fermer">
            ✕
          </button>
        )}
      </header>
      <p className="mmc-sous">{actuelle ? "Tout ce qui est chez toi te suit, à sa place." : "Là où ta figurine s’installe. Tu pourras en changer quand tu veux."}</p>
      {catalogue === null ? (
        <div className="mmc-grille">{[0, 1, 2, 3].map((k) => <span key={k} className="mmc-carte attente" aria-hidden="true" />)}</div>
      ) : pretes.length ? (
        <div className="mmc-grille">
          {pretes.map((p) => (
            <button key={p.cle} type="button" className={`mmc-carte${p.cle === actuelle ? " sienne" : ""}`} data-piece={p.cle} onClick={() => setApercu(p)}>
              <span className="mmc-vignette" style={{ backgroundImage: `url(${p.vignette!.flou})` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.vignette!.src} srcSet={p.vignette!.srcset} sizes="(max-width: 600px) 90vw, 420px" alt="" loading="lazy" draggable={false} />
              </span>
              <b>
                {p.emoji} {p.nom}
              </b>
              <small>{p.cle === actuelle ? "✓ Ta pièce" : p.pour}</small>
            </button>
          ))}
        </div>
      ) : (
        <p className="mmc-sous">Les pièces se préparent : reviens dans un moment.</p>
      )}
      {apercu && (
        <div className="mmc-apercu" role="dialog" aria-label={apercu.nom}>
          <div className="mmc-apercu-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={apercu.vignette!.src} srcSet={apercu.vignette!.srcset} sizes="2000px" width={apercu.vignette!.largeur} height={apercu.vignette!.hauteur} alt={apercu.nom} draggable={false} />
          </div>
          <div className="mmc-apercu-bas">
            <b>
              {apercu.emoji} {apercu.nom}
            </b>
            {dit && <small className="mmc-erreur">{dit}</small>}
            <span className="mmc-gestes">
              <button
                type="button"
                className="mmc-oui"
                data-geste="installer"
                disabled={envoi || apercu.cle === actuelle}
                onClick={async () => {
                  setEnvoi(true);
                  setDit("");
                  const erreur = await onChoisir(apercu);
                  setEnvoi(false);
                  if (erreur) setDit(erreur);
                }}
              >
                {apercu.cle === actuelle ? "✓ C’est ta pièce" : envoi ? "…" : "Je m’installe ici"}
              </button>
              <button type="button" className="mmc-non" onClick={() => setApercu(null)}>
                Voir les autres
              </button>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 🏠 « Ma maison » : sa pièce (ou le choix de sa pièce). `plein` : toute la hauteur de l'écran (l'adresse d'essai).
 * `onRenoncer` : sans pièce, le choix se ferme (qui garde son univers d'avant, le lot M3) ; sinon il reste ouvert.
 */
export function MaisonDuCatalogue({ actif, plein = false, onRenoncer }: { actif: boolean; plein?: boolean; onRenoncer?: () => void }) {
  const [maison, setMaison] = useState<MaMaisonVue | null>(null);
  const [erreur, setErreur] = useState("");
  const [catalogue, setCatalogue] = useState<CatalogueMaison | null>(null);
  const [choix, setChoix] = useState(false);
  useEffect(() => {
    if (!actif) return;
    let fini = false;
    // (⚡ 21 novembre 2026 : sa maison de la dernière fois, tout de suite ; le serveur la remplace dès qu'il répond)
    const deja = lireMemoire<MaMaisonVue>(MEMOIRE_MAISON);
    if (deja) void Promise.resolve().then(() => !fini && setMaison((x) => x ?? deja));
    void lire(ROUTE).then((r) => {
      if (fini) return;
      if (r.maison) {
        setMaison(r.maison);
        ecrireMemoire(MEMOIRE_MAISON, r.maison);
      } else setErreur(r.error || "Ta maison ne s’est pas ouverte.");
    });
    return () => {
      fini = true;
    };
  }, [actif]);
  const sansPiece = Boolean(maison && !maison.scene);
  const ouvert = choix || sansPiece;
  useEffect(() => {
    if (!ouvert || catalogue) return;
    let fini = false;
    void lire(`${ROUTE}?catalogue=1`).then((r) => !fini && setCatalogue(r.catalogue ?? { pieces: [], piece: null }));
    return () => {
      fini = true;
    };
  }, [ouvert, catalogue]);
  async function choisir(p: PieceAuCatalogue): Promise<string | null> {
    const r = await lire(ROUTE, { action: "choisir", piece: p.cle });
    if (!r.maison) return r.error || "Ça n’a pas marché : réessaie.";
    setMaison(r.maison);
    setCatalogue(null);
    setChoix(false);
    return null;
  }
  return (
    <div className={`mmc${plein ? " plein" : ""}`}>
      {erreur ? (
        <p className="mmc-erreur-grande">{erreur}</p>
      ) : !maison ? (
        <div className="mmc-scene attente" aria-hidden="true" />
      ) : maison.scene ? (
        <>
          {/* (la phrase de l'arrivée, une maison encore vide : dans la pièce, avec « Touche les objets ») */}
          <Piece maison={{ ...maison, scene: maison.scene }} phrase={!maison.contenu?.total ? MAISON_VIDE : undefined} onReglages={() => setChoix(true)} onMaison={setMaison} />
        </>
      ) : null}
      {ouvert && maison && <Choix catalogue={catalogue} actuelle={maison.scene ? maison.piece : null} onChoisir={choisir} onFermer={maison.scene ? () => setChoix(false) : onRenoncer} />}
      <style>{STYLES_MAISON_CATALOGUE}</style>
    </div>
  );
}

/**
 * 🚪 (lot M4) LA MAISON DE QUELQU'UN, EN VISITE (`/univers/chez/<clé>`) : sa pièce en plein écran, sa figurine au centre,
 * ce qu'il montre (tout pour ses proches ; pour les autres, ce qu'il a ajouté lui-même) ; « 🚪 Frapper à la porte ».
 */
export function VisiteDeLaMaison({ cle }: { cle: string }) {
  const [v, setV] = useState<MaisonVisitee | null>(null);
  useEffect(() => {
    let fini = false;
    void fetch(`${ROUTE}?chez=${encodeURIComponent(cle)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { visite?: MaisonVisitee }) => !fini && setV(j.visite ?? { etat: "absent" }))
      .catch(() => !fini && setV({ etat: "absent" }));
    return () => {
      fini = true;
    };
  }, [cle]);
  const frapper = async (): Promise<string | null> => {
    try {
      const r = await fetch("/api/direct/visites", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "frapper", cle }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      return r.ok ? null : j.error || "Ça n’a pas marché : réessaie.";
    } catch {
      return "Pas de réseau : réessaie dans un instant.";
    }
  };
  return (
    <main className="mmc plein mmc-visite" data-visite={v?.etat ?? "charge"}>
      {!v ? (
        <div className="mmc-scene attente" aria-hidden="true" />
      ) : v.etat === "ouvert" && v.maison.scene ? (
        <Piece
          maison={{ ...v.maison, scene: v.maison.scene }}
          onReglages={() => undefined}
          onMaison={() => undefined}
          visite={
            v.chezSoi
              ? { prenom: v.prenom, frappe: true, onFrapper: frapper, cle }
              : { prenom: v.prenom, frappe: v.frappe, onFrapper: frapper, cle, peutLaisser: v.peutLaisser, mesCadeaux: v.mesCadeaux, nouveaux: v.nouveaux, question: v.question }
          }
        />
      ) : (
        <div className="mmc-ferme">
          <p>{v.etat === "reserve" ? PHRASES_VISITE.reserve(v.prenom ?? "Cette personne") : v.etat === "ferme" ? PHRASES_VISITE.ferme(v.prenom ?? "Cette personne") : PHRASES_VISITE.absent}</p>
          <a href="/collection#proches">{PHRASES_VISITE.retour}</a>
        </div>
      )}
      {v?.etat === "ouvert" && v.chezSoi && <p className="mmc-chez-soi">{PHRASES_VISITE.chezToi}</p>}
      <style>{STYLES_MAISON_CATALOGUE}</style>
    </main>
  );
}

const STYLES_MAISON_CATALOGUE = `
.mmc{position:relative;display:flex;flex-direction:column;gap:10px;color:#FFF4E6}
.mmc-scene{position:relative;display:flex;flex-direction:column;border-radius:26px;overflow:hidden;background:#17100c;color:#fbf3ea;box-shadow:0 18px 40px -20px rgba(0,0,0,.8)}
.mmc-scene.attente{height:min(68svh,620px)}
.mmc.plein .mmc-scene{height:100svh;border-radius:0;box-shadow:none}
.mmc-entete{flex:none;display:flex;align-items:center;gap:9px;padding:12px 12px 8px}
.mmc.plein .mmc-entete{padding-top:calc(12px + env(safe-area-inset-top))}
.mmc-rond{flex:none;width:36px;height:36px;display:grid;place-items:center;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.09);color:#fbf3ea;font:inherit;font-size:17px;line-height:1;text-decoration:none;cursor:pointer}
.mmc-retour{font-size:24px}
.mmc-medaillon{position:relative;flex:none;width:42px;height:42px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#e0a26a,#a8683a);box-shadow:0 0 0 2px #ffb347}
.mmc-medaillon img{position:absolute;left:50%;top:1%;width:210%;height:auto;max-width:none;transform:translateX(-50%);user-select:none;-webkit-user-drag:none}
.mmc-titre{flex:1;min-width:0;display:flex;flex-direction:column}
.mmc-nom{font-weight:900;font-size:18px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mmc-ou{font-weight:600;font-size:12px;line-height:1.3;color:#c9b29c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mmc-humeur{flex:none;max-width:38%;padding:6px 10px;border-radius:14px;background:rgba(255,255,255,.09);font-weight:700;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mmc-cadre{position:relative;flex:1;min-height:0;margin:0 10px;border-radius:24px;overflow:hidden;background:#3a2414;box-shadow:inset 0 0 0 1px rgba(255,255,255,.04)}
.mmc:not(.plein) .mmc-cadre{flex:none;height:clamp(280px,calc(100svh - 390px),560px)}
.mmc-bas{flex:none;display:flex;flex-direction:column;gap:9px;padding:10px 12px 14px}
.mmc.plein .mmc-bas{padding-bottom:calc(14px + env(safe-area-inset-bottom))}
.mmc-puces{display:flex;align-items:center;gap:6px;overflow-x:auto;scrollbar-width:none}
.mmc-puces::-webkit-scrollbar{display:none}
.mmc-surtitre{flex:none;width:76px;font-weight:800;font-size:10px;line-height:1.15;letter-spacing:.02em;text-transform:uppercase;color:#ffd98a}
.mmc-puce{flex:none;display:flex;align-items:center;gap:5px;padding:8px 11px;border:0;border-radius:14px;background:#33241a;box-shadow:inset 0 0 0 1px rgba(255,211,110,.35);color:#fbf3ea;font:inherit;font-weight:700;font-size:12.5px;white-space:nowrap;text-decoration:none;cursor:pointer}
.mmc-puce-n{min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#ffd27a;color:#2b1b12;font-style:normal;font-weight:900;font-size:11px;line-height:18px;text-align:center}
.mmc-gros{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.mmc-gros-bouton{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:64px;padding:6px 4px;border:0;border-radius:18px;background:#33241a;box-shadow:inset 0 0 0 1px #5a4232;color:#fbf3ea;font:inherit;font-weight:800;font-size:12px;line-height:1.15;text-align:center;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mmc-gros-bouton span{font-size:22px;line-height:1}
.mmc-gros-bouton.fort{background:linear-gradient(135deg,#ff9a3c,#ff5e62);box-shadow:0 8px 20px rgba(255,94,98,.3)}
.mmc-gros-bouton:active,.mmc-puce:active,.mmc-toc:active{transform:scale(.97)}
.mmc-pastille{position:absolute;top:6px;right:7px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:#fff8ee;color:#2b1b12;font-style:normal;font-weight:900;font-size:11.5px;line-height:20px}
.mmc-porte{position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;background:radial-gradient(circle at 50% 40%,#4a2f1c,#17100c 72%)}
.mmc-battant{position:relative;height:min(290px,48%);aspect-ratio:18/29;border-radius:10px;background:linear-gradient(180deg,#9a6a45,#6a4428);box-shadow:inset 0 0 0 8px #553520,0 20px 50px rgba(0,0,0,.6)}
.mmc-battant::after{content:"";position:absolute;right:11%;top:52%;width:14px;height:14px;border-radius:50%;background:#ffcf6b;box-shadow:0 0 10px #ffcf6b}
.mmc-battant .mmc-medaillon{position:absolute;left:50%;top:20%;transform:translateX(-50%);width:64px;height:64px;box-shadow:0 0 0 3px #f6e3c4}
.mmc-porte p{margin:0;max-width:270px;color:#c9b29c;font-weight:700;font-size:14px;line-height:1.4;text-align:center}
.mmc-toc{padding:12px 22px;border:0;border-radius:16px;background:#ff6b6b;color:#fff;font:inherit;font-weight:800;font-size:15.5px;white-space:nowrap;cursor:pointer;box-shadow:0 6px 16px rgba(255,107,107,.3)}
.mmc-accueil{position:absolute;z-index:4;transform:translate(-50%,-10px);width:max-content;max-width:230px;padding:8px 12px;border-radius:16px;background:#fff8ee;color:#2b1b12;font-weight:800;font-size:13px;line-height:1.3;box-shadow:0 6px 18px rgba(30,10,0,.4);pointer-events:none;animation:mmc-apparait .3s ease-out}
.mmc-accueil::after{content:"";position:absolute;left:50%;bottom:-6px;width:12px;height:12px;background:#fff8ee;transform:translateX(-50%) rotate(45deg)}
@keyframes mmc-apparait{from{opacity:0}to{opacity:1}}
.mmc-scene.attente{background:linear-gradient(110deg,#1a0f14 30%,#2a1820 50%,#1a0f14 70%);background-size:200% 100%;animation:mmc-attente 1.4s linear infinite}
@keyframes mmc-attente{to{background-position:-200% 0}}
.mmc-defile{position:absolute;inset:0;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch;text-align:center}
.mmc-defile::-webkit-scrollbar{display:none}
.mmc-pano{position:relative;display:inline-block;vertical-align:top;height:100%;background-size:cover;background-position:center;text-align:left}
.mmc-fond{display:block;height:100%;width:auto;max-width:none;user-select:none;-webkit-user-drag:none}
.mmc-zone{position:absolute;padding:0;border:0;border-radius:10px;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mmc-zone::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 2px rgba(255,244,230,.0);transition:box-shadow .25s ease}
.mmc-zone.touchee::after{box-shadow:0 0 0 2px rgba(255,244,230,.85),0 0 22px rgba(255,214,150,.55)}
.mmc-lueur{position:absolute;left:50%;top:40%;width:420%;aspect-ratio:1;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,214,150,.55),rgba(255,180,90,.18) 45%,rgba(255,160,80,0) 70%);opacity:0;transition:opacity .5s ease;pointer-events:none;mix-blend-mode:screen}
.mmc-lueur.allumee{opacity:1}
.mmc-ombre{position:absolute;aspect-ratio:4/1;transform:translate(-50%,-55%);border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.5),rgba(0,0,0,0));pointer-events:none}
.mmc-fig{position:absolute;transform:translateX(-50%);padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mmc-fig img{display:block;height:100%;width:auto;max-width:none;transform-origin:50% 100%;animation:mmc-souffle 4.5s ease-in-out infinite;user-select:none;-webkit-user-drag:none}
.mmc-fig[data-saute="1"] img{animation:mmc-saut .5s ease-out,mmc-souffle 4.5s ease-in-out .5s infinite}
.mmc-fig[data-saute="0"] img{animation:mmc-saut2 .5s ease-out,mmc-souffle 4.5s ease-in-out .5s infinite}
@keyframes mmc-souffle{0%,100%{transform:scale(1,1)}50%{transform:scale(1.006,1.012)}}
@keyframes mmc-saut{0%,100%{transform:translateY(0)}35%{transform:translateY(-7%) rotate(-2deg)}70%{transform:translateY(0) scale(1.02,.97)}}
@keyframes mmc-saut2{0%,100%{transform:translateY(0)}35%{transform:translateY(-7%) rotate(2deg)}70%{transform:translateY(0) scale(1.02,.97)}}
.moment-soir .mmc-fig img{filter:sepia(.12) saturate(1.06) brightness(.97)}
.moment-nuit .mmc-fig img{filter:brightness(.8) saturate(.85) sepia(.1)}
.mmc-fanions{position:absolute;left:10px;top:10px;display:flex;gap:6px;max-width:calc(100% - 20px);overflow-x:auto;scrollbar-width:none;z-index:5}
.mmc-fanions a{flex:none;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 7px 11px;min-width:42px;color:#2a1424;text-decoration:none;background:linear-gradient(180deg,#ffe3a8,#f2c46b);clip-path:polygon(0 0,100% 0,100% 78%,50% 100%,0 78%);box-shadow:0 4px 10px rgba(0,0,0,.3);transform-origin:top center;animation:mmc-fanion 4s ease-in-out infinite}
.mmc-fanions a:nth-child(2n){animation-delay:-1.3s;background:linear-gradient(180deg,#ffc2df,#ff8fc8)}
.mmc-fanions a:nth-child(3n){animation-delay:-2.6s;background:linear-gradient(180deg,#c9e6ff,#8cc4f2)}
.mmc-fanions span{font-size:17px;line-height:1}
.mmc-fanions small{font-size:9.5px;font-weight:900;max-width:64px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@keyframes mmc-fanion{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@media (prefers-reduced-motion: reduce){.mmc-fanions a{animation:none}}
.mmc-reponses,.mmc-repondre{grid-column:1;display:flex;flex-direction:column;gap:6px;margin-top:4px}
.mmc-reponses span{font-size:14px;color:#F3DCE6}
.mmc-reponses strong{color:#FFF4E6}
.mmc-repondre small{font-size:13px;color:#c6a6bd}
.mmc-champ-reponse{padding:10px 12px;border:1px solid #5a3352;border-radius:12px;background:#1d0a1b;color:#FFF4E6;font:inherit;font-size:16px}
.mmc-erreur-q{color:#ffb4a8!important}
.mmc-bulle .mmc-action[aria-pressed="true"]{background:#f2be6a}
.mmc-visite{min-height:100svh;background:#17100c}
.mmc-ferme{min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;font-size:16px;line-height:1.5}
.mmc-ferme a{color:#f2be6a;font-weight:800;text-decoration:none}
.mmc-chez-soi{position:fixed;left:50%;top:calc(76px + env(safe-area-inset-top));transform:translateX(-50%);margin:0;padding:8px 14px;border-radius:999px;background:rgba(20,10,14,.72);font-size:13.5px;white-space:nowrap}
.mmc-mes-cadeaux{align-self:center;padding:2px 10px;color:#c9b29c;font-size:12.5px}
.mmc-table{position:absolute;display:flex;align-items:flex-end;justify-content:center;gap:6%;pointer-events:none}
.mmc-cadeau{pointer-events:auto;padding:0;border:0;background:none;cursor:pointer;font-size:clamp(14px,5vh,40px);line-height:1;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45));-webkit-tap-highlight-color:transparent}
.mmc-cadeau.emballe{animation:mmc-paquet 2.6s ease-in-out infinite}
@keyframes mmc-paquet{0%,80%,100%{transform:none}86%{transform:rotate(-8deg)}92%{transform:rotate(7deg)}}
.mmc-fait{position:absolute;z-index:9;left:50%;top:12px;transform:translateX(-50%);margin:0;width:max-content;max-width:calc(100% - 32px);padding:9px 16px;border-radius:999px;background:rgba(69,212,131,.92);color:#10261a;font-weight:900;font-size:15px;text-align:center;pointer-events:none;animation:mmc-arrivee .3s ease-out}
.mmc-objet{-webkit-touch-callout:none;user-select:none}
.mmc-indice{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;width:max-content;max-width:calc(100% - 32px);padding:8px 14px;border-radius:18px;background:rgba(30,16,8,.75);text-align:center;pointer-events:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.mmc-indice span{font-size:14px;line-height:1.4;color:#F3DCE6}
.mmc-indice b{font-size:12.5px;font-weight:800;white-space:nowrap;animation:mmc-indice 2.4s ease-in-out infinite}
@keyframes mmc-indice{0%,100%{opacity:.75}50%{opacity:1}}
.mmc-bulle{position:absolute;z-index:9;left:10px;right:10px;bottom:10px;display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:12px 14px;border-radius:18px;background:rgba(28,16,9,.93);box-shadow:0 10px 30px rgba(0,0,0,.45);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);line-height:1.4;animation:mmc-bulle .25s ease-out}
.mmc-bulle b{font-size:15px}
.mmc-bulle span{grid-column:1;font-size:14px;color:#F3DCE6}
.mmc-bulle button{grid-row:1/3;grid-column:2;align-self:start;width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer}
@keyframes mmc-bulle{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.mmc-bulle .mmc-actions{grid-column:1;display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.mmc-bulle .mmc-action{display:inline-flex;align-items:center;padding:8px 13px;border-radius:14px;background:#fff8ee;color:#2b1b12;font-weight:900;font-size:14px;text-decoration:none}
.mmc-objet{position:absolute;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .35s ease,filter .35s ease}
.mmc-objet img{user-select:none;-webkit-user-drag:none}
.mmc-objet.vise{transform:scale(1.1);filter:drop-shadow(0 0 12px rgba(255,214,150,.95));z-index:2}
.mmc-photo img{position:absolute;left:9%;top:9%;width:82%;height:82%;object-fit:cover;border-radius:2px;box-shadow:0 1px 4px rgba(0,0,0,.5)}
.mmc-tele img{position:absolute;left:6%;top:7%;width:88%;height:86%;object-fit:cover;border-radius:3px;opacity:.93}
.mmc-ecran{position:absolute;z-index:3;background:#000;border-radius:3px;overflow:hidden;box-shadow:0 0 18px rgba(140,190,255,.35)}
.mmc-ecran iframe{width:100%;height:100%;border:0;display:block}
.mmc-tele .mmc-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:30%;aspect-ratio:1;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;display:grid;place-items:center;font-style:normal;font-size:clamp(9px,2.4vh,18px)}
.mmc-platine .mmc-disque{position:absolute;left:8%;top:6%;width:62%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#e8a33c 0 11%,#151012 12% 30%,#231a1d 31% 33%,#151012 34% 100%);box-shadow:0 2px 6px rgba(0,0,0,.5);animation:mmc-tourne 3.2s linear infinite}
.mmc-platine img,.mmc-platine .mmc-emoji{position:absolute;right:2%;bottom:4%;width:44%;aspect-ratio:1;object-fit:cover;border-radius:2px;box-shadow:0 2px 6px rgba(0,0,0,.55)}
@keyframes mmc-tourne{to{transform:rotate(360deg)}}
.mmc-rayon{position:absolute;display:flex;flex-wrap:wrap-reverse;align-content:flex-start;justify-content:center;gap:4% 3%;padding:2%;box-sizing:border-box;pointer-events:none}
.mmc-rayon .mmc-objet{position:relative;pointer-events:auto;height:42%;aspect-ratio:3/4}
.mmc-carte-objet{display:grid;place-items:center;border-radius:4px;background:rgba(255,246,234,.94);box-shadow:0 2px 5px rgba(0,0,0,.45)}
.mmc-carte-objet.imagee{background:#1a0f14}
.mmc-carte-objet img{width:100%;height:100%;object-fit:cover;border-radius:4px}
.mmc-emoji{display:grid;place-items:center;font-size:clamp(10px,3.2vh,24px);line-height:1}
.mmc-platine .mmc-emoji{background:rgba(255,246,234,.94)}
.moment-soir .mmc-objet img{filter:sepia(.14) saturate(1.04) brightness(.97)}
.moment-nuit .mmc-objet img{filter:brightness(.72) saturate(.85)}
.mmc-arrivee{position:absolute;z-index:6;left:50%;top:12px;transform:translateX(-50%);margin:0;width:max-content;max-width:calc(100% - 32px);padding:9px 16px;border-radius:999px;background:rgba(20,10,14,.78);font-weight:900;font-size:15px;text-align:center;pointer-events:none;animation:mmc-arrivee .35s ease-out;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
@keyframes mmc-arrivee{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
.mmc-grand{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;background:rgba(10,5,8,.92);cursor:zoom-out}
.mmc-grand img{max-width:100%;max-height:78svh;border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.6)}
.mmc-grand p{margin:0;font-size:14px;color:#F3DCE6}
.mmc-grand button{position:absolute;top:calc(14px + env(safe-area-inset-top));right:14px;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#FFF4E6;font-size:16px;cursor:pointer}
.mmc-erreur-grande{margin:24px 16px;font-size:16px;line-height:1.45}
.mmc-choix{position:fixed;inset:0;z-index:60;overflow-y:auto;padding:calc(16px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));background:#140b10;color:#FFF4E6}
.mmc-choix header{display:flex;justify-content:space-between;align-items:center;gap:10px}
.mmc-choix h2{margin:0;font-size:24px}
.mmc-fermer{width:38px;height:38px;border:0;border-radius:50%;background:rgba(255,255,255,.1);color:#FFF4E6;font-size:16px;cursor:pointer}
.mmc-sous{margin:6px 0 14px;color:#CDB4C0;font-size:14.5px;line-height:1.45}
.mmc-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr));gap:12px}
.mmc-carte{display:flex;flex-direction:column;gap:3px;padding:0 0 10px;border:0;border-radius:18px;overflow:hidden;background:#22141b;color:#FFF4E6;text-align:left;cursor:pointer}
.mmc-carte.attente{height:200px;background:linear-gradient(110deg,#22141b 30%,#2d1a23 50%,#22141b 70%);background-size:200% 100%;animation:mmc-attente 1.4s linear infinite}
.mmc-carte.sienne{box-shadow:0 0 0 2px #FF2E9A}
.mmc-carte b{padding:0 12px;font-size:16px}
.mmc-carte small{padding:0 12px;color:#CDB4C0;font-size:13px}
.mmc-vignette{position:relative;display:block;aspect-ratio:3/4;margin-bottom:6px;background-size:cover;background-position:center}
.mmc-vignette img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mmc-apercu{position:fixed;inset:0;z-index:61;display:flex;flex-direction:column;background:#0d070a}
.mmc-apercu-image{position:relative;flex:1;min-height:0;overflow:hidden}
.mmc-apercu-image img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%;user-select:none;-webkit-user-drag:none}
.mmc-apercu-bas{display:flex;flex-direction:column;gap:6px;padding:14px 16px calc(16px + env(safe-area-inset-bottom));background:#140b10}
.mmc-apercu-bas b{font-size:18px}
.mmc-apercu-bas small{color:#CDB4C0;font-size:13.5px}
.mmc-gestes{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.mmc-oui,.mmc-non{padding:12px 18px;border-radius:999px;border:0;font-weight:900;font-size:15px;cursor:pointer}
.mmc-oui{background:#FF2E9A;color:#fff;box-shadow:0 8px 20px -8px rgba(255,46,154,.9)}
.mmc-oui:disabled{opacity:.7;cursor:default}
.mmc-non{background:rgba(255,255,255,.1);color:#FFF4E6}
.mmc-erreur{color:#FFB4A9 !important}
@media (prefers-reduced-motion: reduce){.mmc-fig img,.mmc-indice,.mmc-scene.attente,.mmc-accueil,.mmc-carte.attente,.mmc-platine .mmc-disque,.mmc-arrivee,.mmc-cadeau.emballe{animation:none!important}.mmc-objet{transition:none}}
`;
