"use client";

/**
 * 🏠 « MA MAISON » — LA PIÈCE DE CHACUN (`lib/direct/ma-maison.ts`, `docs/univers/ma-maison.md` ; le lot M1).
 *
 * Sa pièce du catalogue, « tout autour » : le panorama (le lot M0) qu'on fait glisser au doigt, dans la lumière de
 * l'heure ; sa figurine posée au centre, dans son fauteuil (une ombre au sol, la teinte du moment) ; ses emplacements,
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
import {
  EMPLACEMENTS_MAISON,
  MAISON_VIDE,
  PHRASES_AJOUT,
  PHRASES_MAISON,
  PHRASES_VISITE,
  VISIBILITES_MAISON,
  arriveeChezMoi,
  ditDeLObjet,
  type CatalogueMaison,
  type ContenuMaison,
  type EmplacementMaison,
  type MaMaisonVue,
  type MaisonVisitee,
  type ObjetMaison,
  type PieceAuCatalogue,
} from "@/lib/direct/ma-maison";
import { createPortal } from "react-dom";
import { AjouterChezMoi, EnleverDeChezMoi, QuiPeutEntrer } from "./ajouter-chez-moi";
import { MOMENTS_DUO, type EmplacementsDuo, type Zone } from "@/lib/direct/pieces-duo";

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
const place = (z: Zone) => ({ left: `${z[0] * 100}%`, top: `${z[1] * 100}%`, width: `${z[2] * 100}%`, height: `${z[3] * 100}%` });

/** 🏠 (lot M2) Ce qu'il a gardé, posé à ses emplacements : un bouton chacun (`data-objet`). */
function ObjetsDeLaMaison({
  contenu,
  e,
  vise,
  onToucher,
  onAppuiLong,
}: {
  contenu: ContenuMaison;
  e: EmplacementsDuo | null;
  vise: string | null;
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
            <i className="mmc-play" aria-hidden="true">
              ▶
            </i>
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

/** 🛋️ La pièce, au doigt : le panorama, la figurine au centre, les emplacements. */
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
  visite?: { prenom: string; frappe: boolean; onFrapper: () => Promise<string | null> };
}) {
  const { scene, figurine } = maison;
  const pano = scene.panorama;
  const ratio = pano.largeur / Math.max(1, pano.hauteur);
  const cadre = useRef<HTMLDivElement>(null);
  const defile = useRef<HTMLDivElement>(null);
  const [hauteur, setHauteur] = useState(0);
  const [indice, setIndice] = useState(true);
  const [bulle, setBulle] = useState<{ cle: EmplacementMaison; k: number } | null>(null);
  const [allumees, setAllumees] = useState<number[]>([]);
  const [saute, setSaute] = useState(0);
  const auto = useRef(true);
  // 🏠 (lot M2) l'objet touché, la photo en grand ; ✨ l'arrivée (sa phrase, l'objet que la caméra regarde)
  const [objet, setObjet] = useState<ObjetMaison | null>(null);
  const [grand, setGrand] = useState<ObjetMaison | null>(null);
  const [arrivee, setArrivee] = useState("");
  const [vise, setVise] = useState<string | null>(null);
  const enVisite = useRef(false);
  const interrompre = useRef<() => void>(() => undefined);
  // ＋🗑️ (lot M2, deuxième partie) ajouter chez moi ; l'objet à enlever (un appui long) ; ce qui vient d'être fait
  const [ajout, setAjout] = useState(false);
  const [qui, setQui] = useState(false);
  const [frappe, setFrappe] = useState(Boolean(visite?.frappe));
  const [aEnlever, setAEnlever] = useState<ObjetMaison | null>(null);
  const [fait, setFait] = useState("");
  /** (le nouvel objet : la caméra va le voir, il s'éclaire un instant) */
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
  useLayoutEffect(() => {
    const d = defile.current;
    if (!d || !hauteur) return;
    auto.current = true;
    d.scrollLeft = Math.max(0, scene.centre.x * hauteur * ratio - d.clientWidth / 2);
  }, [hauteur, ratio, scene.piece, scene.centre.x]);
  // ✨ L'ARRIVÉE (lot M2) : ce qu'il a gardé depuis sa dernière visite — la phrase, puis la caméra passe sur chacun (un
  // toucher l'arrête) ; ensuite le serveur retient la visite (`vu`). Rien de nouveau : la visite est retenue tout de suite.
  const pret = hauteur > 0;
  const enVisiteChez = Boolean(visite);
  useEffect(() => {
    // (en visite : ni l'arrivée, ni la visite retenue — c'est sa maison à lui)
    if (!pret || enVisiteChez) return;
    // (la réponse est lue : sans quoi la requête resterait ouverte)
    const dire = () =>
      void fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "vu" }) })
        .then((r) => r.text())
        .catch(() => undefined);
    const a = maison.contenu ? arriveeChezMoi(maison.contenu, maison.vuLe ?? 0) : null;
    if (!a) {
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
    void Promise.resolve().then(() => !fini && setArrivee(a.phrase));
    let t = 900;
    for (const id of a.ids) {
      minuteries.push(window.setTimeout(() => viser(id), t));
      t += 1900;
    }
    minuteries.push(
      window.setTimeout(() => {
        setVise(null);
        if (d) aller(Math.max(0, scene.centre.x * d.clientHeight * ratio - d.clientWidth / 2));
      }, t),
    );
    minuteries.push(window.setTimeout(finir, t + 1100));
    return () => {
      // (sans retenir la visite : l'arrivée reprendra — un nouveau rendu, le mode strict)
      fini = true;
      minuteries.forEach((x) => window.clearTimeout(x));
      enVisite.current = false;
      interrompre.current = () => undefined;
    };
    // (une fois la scène mesurée)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pret, enVisiteChez]);
  const zones = zonesDe(scene.emplacements);
  const dit = bulle ? EMPLACEMENTS_MAISON[bulle.cle] : null;
  const moment = MOMENTS_DUO.find((m) => m.cle === scene.moment);
  const c = scene.centre;
  return (
    <div className={`mmc-scene moment-${scene.moment}`} ref={cadre} data-piece={scene.piece} data-moment={scene.moment}>
      <div
        className="mmc-defile"
        ref={defile}
        onScroll={() => {
          if (auto.current) {
            auto.current = false;
            return;
          }
          if (enVisite.current) return;
          setIndice(false);
          setBulle(null);
          setObjet(null);
        }}
        onPointerDown={() => interrompre.current()}
      >
        <div className="mmc-pano" style={{ backgroundImage: `url(${pano.flou})` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mmc-fond"
            src={pano.src}
            srcSet={pano.srcset}
            sizes={hauteur ? `${Math.round(hauteur * ratio)}px` : "2400px"}
            width={pano.largeur}
            height={pano.hauteur}
            alt={`${scene.nom}, tout autour`}
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
              onToucher={(o) => {
                setIndice(false);
                setBulle(null);
                setObjet(o);
              }}
              onAppuiLong={(o) => {
                if (visite) return;
                setObjet(null);
                setAEnlever(o);
              }}
            />
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
        </div>
      </div>
      <div className="mmc-haut">
        {visite && (
          <a className="mmc-reglages mmc-retour" href="/collection#proches" aria-label={PHRASES_VISITE.retour}>
            ‹
          </a>
        )}
        <span className="mmc-nom">
          {visite ? `🏠 ${PHRASES_VISITE.chez(visite.prenom)}` : `${scene.emoji} ${scene.nom}`}
          {moment && <small> · {moment.emoji}</small>}
        </span>
        {!visite && (
        <span className="mmc-boutons">
          <button
            type="button"
            className="mmc-reglages"
            onClick={() => {
              setIndice(false);
              setObjet(null);
              setBulle(null);
              setQui(true);
            }}
            aria-label={PHRASES_VISITE.quiTitre}
            data-geste="qui"
          >
            {VISIBILITES_MAISON.find((x) => x.v === (maison.visibilite ?? "proches"))?.titre.split(" ")[0] ?? "🚪"}
          </button>
          <button
            type="button"
            className="mmc-reglages mmc-ajouter"
            onClick={() => {
              setIndice(false);
              setObjet(null);
              setBulle(null);
              setAjout(true);
            }}
            aria-label="Ajouter chez moi"
            data-geste="ajouter"
          >
            ＋
          </button>
          <button type="button" className="mmc-reglages" onClick={onReglages} aria-label="Changer de pièce" data-geste="reglages">
            ⚙️
          </button>
        </span>
        )}
      </div>
      {arrivee && (
        <p className="mmc-arrivee" role="status" data-arrivee>
          {arrivee}
        </p>
      )}
      {indice && !arrivee && !objet && (
        <div className="mmc-indice">
          {phrase && <span>{phrase}</span>}
          <b aria-hidden="true">← Glisse pour faire le tour →</b>
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
              {lienSur(objet.lien) && (
                <a className="mmc-action" href={lienSur(objet.lien)} target="_blank" rel="noopener noreferrer" data-ouvrir>
                  {objet.sorte === "musique" ? PHRASES_MAISON.ecouter : PHRASES_MAISON.regarder}
                </a>
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
      {visite && !frappe && !objet && !bulle && (
        <button
          type="button"
          className="mmc-frapper"
          data-geste="frapper"
          onClick={async () => {
            const e = await visite.onFrapper();
            if (e) {
              setFait(e);
              return;
            }
            setFrappe(true);
            setFait(PHRASES_VISITE.frappe(visite.prenom));
            window.setTimeout(() => setFait(""), 2600);
          }}
        >
          {PHRASES_VISITE.frapper}
        </button>
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
      {fait && (
        <p className="mmc-fait" role="status" data-fait>
          {fait}
        </p>
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
  const defile = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const d = defile.current;
    if (d) d.scrollLeft = (d.scrollWidth - d.clientWidth) / 2;
  }, [apercu]);
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
      <p className="mmc-sous">{actuelle ? "Tout ce qui est chez toi te suit, à sa place." : "Ta pièce, tout autour de toi. Tu pourras en changer quand tu veux."}</p>
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
          <div className="mmc-apercu-defile" ref={defile}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={apercu.vignette!.src} srcSet={apercu.vignette!.srcset} sizes="2000px" width={apercu.vignette!.largeur} height={apercu.vignette!.hauteur} alt={`${apercu.nom}, tout autour`} draggable={false} />
          </div>
          <div className="mmc-apercu-bas">
            <b>
              {apercu.emoji} {apercu.nom}
            </b>
            <small>← Glisse pour faire le tour →</small>
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
    void lire(ROUTE).then((r) => {
      if (fini) return;
      if (r.maison) setMaison(r.maison);
      else setErreur(r.error || "Ta maison ne s’est pas ouverte.");
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
          {/* (la phrase de l'arrivée : dans la pièce en plein écran, sous elle dans l'onglet) */}
          <Piece maison={{ ...maison, scene: maison.scene }} phrase={plein && !maison.contenu?.total ? MAISON_VIDE : undefined} onReglages={() => setChoix(true)} onMaison={setMaison} />
          {!plein && !maison.contenu?.total && <p className="mmc-vide">{MAISON_VIDE}</p>}
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
          visite={v.chezSoi ? { prenom: v.prenom, frappe: true, onFrapper: frapper } : { prenom: v.prenom, frappe: v.frappe, onFrapper: frapper }}
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
.mmc-scene{position:relative;height:min(68svh,620px);border-radius:22px;overflow:hidden;background:#1a0f14;box-shadow:0 18px 40px -20px rgba(0,0,0,.8)}
.mmc.plein .mmc-scene{height:100svh;border-radius:0;box-shadow:none}
.mmc-scene.attente{background:linear-gradient(110deg,#1a0f14 30%,#2a1820 50%,#1a0f14 70%);background-size:200% 100%;animation:mmc-attente 1.4s linear infinite}
@keyframes mmc-attente{to{background-position:-200% 0}}
.mmc-defile{position:absolute;inset:0;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.mmc-defile::-webkit-scrollbar{display:none}
.mmc-pano{position:relative;display:inline-block;vertical-align:top;height:100%;background-size:cover;background-position:center}
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
.mmc-haut{position:absolute;left:10px;right:10px;top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;pointer-events:none}
.mmc.plein .mmc-haut{top:calc(10px + env(safe-area-inset-top))}
.mmc-nom{padding:7px 13px;border-radius:999px;background:rgba(20,10,14,.62);font-weight:900;font-size:14.5px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.mmc-nom small{font-weight:700;opacity:.85}
.mmc-boutons{display:flex;gap:8px}
.mmc-retour{display:grid;place-items:center;text-decoration:none;color:#FFF4E6;font-size:24px;line-height:1;margin-right:auto}
.mmc-haut .mmc-retour + .mmc-nom{margin-right:auto;margin-left:8px}
.mmc-visite{min-height:100svh;background:#1a0f14}
.mmc-ferme{min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;font-size:16px;line-height:1.5}
.mmc-ferme a{color:#f2be6a;font-weight:800;text-decoration:none}
.mmc-chez-soi{position:fixed;left:50%;top:calc(62px + env(safe-area-inset-top));transform:translateX(-50%);margin:0;padding:8px 14px;border-radius:999px;background:rgba(20,10,14,.72);font-size:13.5px;white-space:nowrap}
.mmc-frapper{position:absolute;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);white-space:nowrap;padding:13px 22px;border:0;border-radius:999px;background:#ff2f8f;color:#fff;font-weight:900;font-size:16px;cursor:pointer;box-shadow:0 10px 26px -10px rgba(255,47,143,.8)}
.mmc-ajouter{font-weight:900;color:#FFF4E6}
.mmc-fait{position:absolute;left:50%;top:62px;transform:translateX(-50%);margin:0;width:max-content;max-width:calc(100% - 32px);padding:9px 16px;border-radius:999px;background:rgba(69,212,131,.92);color:#10261a;font-weight:900;font-size:15px;text-align:center;pointer-events:none;animation:mmc-arrivee .3s ease-out}
.mmc.plein .mmc-fait{top:calc(62px + env(safe-area-inset-top))}
.mmc-objet{-webkit-touch-callout:none;user-select:none}
.mmc-reglages{pointer-events:auto;width:40px;height:40px;border:0;border-radius:50%;background:rgba(20,10,14,.62);font-size:19px;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.mmc-indice{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:4px;width:max-content;max-width:calc(100% - 32px);padding:9px 15px;border-radius:18px;background:rgba(20,10,14,.66);text-align:center;pointer-events:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.mmc.plein .mmc-indice{bottom:calc(16px + env(safe-area-inset-bottom))}
.mmc-indice span{font-size:14px;line-height:1.4;color:#F3DCE6}
.mmc-indice b{font-size:13.5px;white-space:nowrap;animation:mmc-indice 2.4s ease-in-out infinite}
@keyframes mmc-indice{0%,100%{opacity:.75}50%{opacity:1}}
.mmc-bulle{position:absolute;left:10px;right:10px;bottom:12px;display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:12px 14px;border-radius:16px;background:rgba(20,10,14,.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);line-height:1.4;animation:mmc-bulle .25s ease-out}
.mmc.plein .mmc-bulle{bottom:calc(12px + env(safe-area-inset-bottom))}
.mmc-bulle b{font-size:15px}
.mmc-bulle span{grid-column:1;font-size:14px;color:#F3DCE6}
.mmc-bulle button{grid-row:1/3;grid-column:2;align-self:start;width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer}
@keyframes mmc-bulle{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.mmc-bulle .mmc-actions{grid-column:1;display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.mmc-bulle .mmc-action{display:inline-flex;align-items:center;padding:7px 13px;border-radius:999px;background:#FFF4E6;color:#2a1424;font-weight:900;font-size:14px;text-decoration:none}
.mmc-objet{position:absolute;padding:0;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .35s ease,filter .35s ease}
.mmc-objet img{user-select:none;-webkit-user-drag:none}
.mmc-objet.vise{transform:scale(1.1);filter:drop-shadow(0 0 12px rgba(255,214,150,.95));z-index:2}
.mmc-photo img{position:absolute;left:9%;top:9%;width:82%;height:82%;object-fit:cover;border-radius:2px;box-shadow:0 1px 4px rgba(0,0,0,.5)}
.mmc-tele img{position:absolute;left:6%;top:7%;width:88%;height:86%;object-fit:cover;border-radius:3px;opacity:.93}
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
.mmc-arrivee{position:absolute;left:50%;top:62px;transform:translateX(-50%);margin:0;width:max-content;max-width:calc(100% - 32px);padding:9px 16px;border-radius:999px;background:rgba(20,10,14,.78);font-weight:900;font-size:15px;text-align:center;pointer-events:none;animation:mmc-arrivee .35s ease-out;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
@keyframes mmc-arrivee{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}
.mmc.plein .mmc-arrivee{top:calc(62px + env(safe-area-inset-top))}
.mmc-grand{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;background:rgba(10,5,8,.92);cursor:zoom-out}
.mmc-grand img{max-width:100%;max-height:78svh;border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.6)}
.mmc-grand p{margin:0;font-size:14px;color:#F3DCE6}
.mmc-grand button{position:absolute;top:calc(14px + env(safe-area-inset-top));right:14px;width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#FFF4E6;font-size:16px;cursor:pointer}
.mmc-vide{margin:0 2px;color:#CDB4C0;font-size:14px;line-height:1.45}
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
.mmc-vignette{position:relative;display:block;aspect-ratio:16/9;margin-bottom:6px;background-size:cover;background-position:center}
.mmc-vignette img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mmc-apercu{position:fixed;inset:0;z-index:61;display:flex;flex-direction:column;background:#0d070a}
.mmc-apercu-defile{flex:1;min-height:0;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:none}
.mmc-apercu-defile::-webkit-scrollbar{display:none}
.mmc-apercu-defile img{display:block;height:100%;width:auto;max-width:none;user-select:none;-webkit-user-drag:none}
.mmc-apercu-bas{display:flex;flex-direction:column;gap:6px;padding:14px 16px calc(16px + env(safe-area-inset-bottom));background:#140b10}
.mmc-apercu-bas b{font-size:18px}
.mmc-apercu-bas small{color:#CDB4C0;font-size:13.5px}
.mmc-gestes{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.mmc-oui,.mmc-non{padding:12px 18px;border-radius:999px;border:0;font-weight:900;font-size:15px;cursor:pointer}
.mmc-oui{background:#FF2E9A;color:#fff;box-shadow:0 8px 20px -8px rgba(255,46,154,.9)}
.mmc-oui:disabled{opacity:.7;cursor:default}
.mmc-non{background:rgba(255,255,255,.1);color:#FFF4E6}
.mmc-erreur{color:#FFB4A9 !important}
@media (prefers-reduced-motion: reduce){.mmc-fig img,.mmc-indice,.mmc-scene.attente,.mmc-carte.attente,.mmc-platine .mmc-disque,.mmc-arrivee{animation:none!important}.mmc-objet{transition:none}}
`;
