"use client";

/**
 * 🎬 L'ÉPISODE, AU COMPTOIR — « placer son téléphone là où il fabrique son
 * produit, cliquer sur “Démarrer la session”, arrêter quand il a terminé, et que
 * ça crée une super vidéo : Épisode 1 de sa série 2026. »
 *
 * Six temps : ce qu'il fabrique ; le cadre (le téléphone posé, la caméra
 * arrière) ; la session (il travaille, le téléphone garde les meilleurs moments —
 * `episode-session.ts`) ; le montage, sous ses yeux (`episode-montage.ts`) ; son
 * épisode, à revoir, garder ou publier ; c'est en ligne.
 *
 * LE MOMENT DE LE LANCER N'EST PAS CELUI DE LA PHOTO : la photo et l'interview se
 * font quand le produit existe ; l'épisode, AVANT de commencer à le fabriquer.
 * C'est donc un bouton à part au comptoir, pas un troisième choix au moment de
 * publier.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { FamilleDouble } from "@/lib/direct/double-metiers";
import { SESSION_MAX_S, SESSION_MIN_S, enDuree, prochainEpisode, retenirEpisode, texteDeLEpisode } from "@/lib/direct/episode";
import { SessionEpisode, type EtatSession, type Tournage } from "@/lib/direct/episode-session";
import { monterEpisode } from "@/lib/direct/episode-montage";
import { chefEnPied } from "@/lib/direct/interview-montage";
import type { Film } from "@/lib/direct/reporter-film";

/** Un Reel Instagram ou Facebook : 90 secondes au plus (`REEL_MAX_S` dans `lib/reseaux/intermediaire.ts`, côté serveur). */
const REEL_MAX_S = 90;

type Etape = "intro" | "cadre" | "session" | "montage" | "pret" | "publie";
type Veille = { release: () => Promise<void> };
type FilmPret = Film & { url: string };

const EXEMPLES: Partial<Record<FamilleDouble, string>> = {
  table: "Ex. : la tarte aux pommes",
  fleurs: "Ex. : le bouquet de mariée",
  createur: "Ex. : la bague « Lune »",
  coiffure: "Ex. : le balayage miel",
  ongles: "Ex. : la pose « French »",
  mode: "Ex. : la robe retouchée",
};

/* ═══ LA CAMÉRA : LE PLAN LE PLUS LARGE ════════════════════════════════════
   « Quand je clique sur Démarrer la session, j'ai un écran assez étroit où on ne
   voit pas en plan large ; or c'est un plan large qu'il faut pour avoir toute la
   scène, parce que la personne bouge dans la pièce. »

   TROIS CHOSES RÉTRÉCISSAIENT L'IMAGE, l'une après l'autre :
     · on demandait une image 9:16 (720 × 1280) : le capteur est en 4:3, le
       téléphone en coupait un quart ;
     · on prenait l'objectif ordinaire (1×) : l'ultra grand-angle (0,5×) des
       téléphones qui en ont un voit deux fois plus large ;
     · l'aperçu, puis le film, remplissaient l'écran en coupant les côtés.
   Maintenant : le capteur entier (4:3), l'ultra grand-angle d'office quand il
   existe (sinon le zoom au plus bas, là où le navigateur le permet), l'aperçu
   montre toute l'image, et le film aussi (`dessinerLarge`). ↺ passe d'une
   caméra à l'autre, son nom écrit à l'écran. */
type Camera = { id: string; nom: string; large: boolean; avant: boolean };

const ULTRA = /ultra/i;
const AVANT = /front|avant|facing front|user|selfie/i;
/** « Caméra arrière double / triple », téléobjectif : la même vue que la 1×, ou plus serrée. */
const VIRTUELLE = /dual|double|triple|tele|télé/i;
/** Le capteur entier : 4:3, aussi grand qu'il le donne (le navigateur prend le plus proche). */
const CAPTEUR = { width: { ideal: 1920 }, height: { ideal: 1440 } };
/** Le micro sans filtre : l'atelier tel qu'il sonne. */
const MICRO = { echoCancellation: false, noiseSuppression: false };

async function ouvrir(video: MediaTrackConstraints): Promise<MediaStream> {
  const demandes: MediaStreamConstraints[] = [
    { video: { ...video, ...CAPTEUR }, audio: MICRO },
    { video, audio: true },
    { video: true, audio: true },
    { video: true, audio: false },
  ];
  let derniere: unknown = null;
  for (const d of demandes) {
    try {
      return await navigator.mediaDevices.getUserMedia(d);
    } catch (e) {
      derniere = e;
      if ((e as Error)?.name === "NotAllowedError") break;
    }
  }
  throw derniere ?? new Error("Caméra indisponible");
}

/** Les caméras du téléphone, la plus large d'abord, celle de devant en dernier. Leurs noms ne se lisent qu'une fois la caméra permise. */
async function camerasDuTelephone(): Promise<Camera[]> {
  try {
    const toutes = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput" && d.deviceId);
    const rang = (l: string) => (ULTRA.test(l) ? 0 : AVANT.test(l) ? 3 : VIRTUELLE.test(l) ? 2 : 1);
    let liste = toutes.map((d, k) => ({ d, k, r: rang(d.label) })).sort((a, b) => a.r - b.r || a.k - b.k);
    if (liste.some((x) => x.r <= 1)) liste = liste.filter((x) => x.r !== 2);
    const arriere = liste.filter((x) => x.r < 3).length;
    let n = 0;
    return liste.map(({ d, r }) => ({
      id: d.deviceId,
      large: r === 0,
      avant: r === 3,
      nom: r === 0 ? "Plan large · 0,5×" : r === 3 ? "Caméra avant" : arriere > 1 && !liste.some((x) => x.r === 0) ? `Caméra arrière ${++n}` : "Caméra arrière · 1×",
    }));
  } catch {
    return [];
  }
}

/** Là où le navigateur le permet (zoom sous 1×), le plus large possible. */
async function dezoomer(flux: MediaStream) {
  const piste = flux.getVideoTracks()[0];
  try {
    const c = piste?.getCapabilities?.() as (MediaTrackCapabilities & { zoom?: { min: number } }) | undefined;
    if (piste && c?.zoom && c.zoom.min < 1) await piste.applyConstraints({ advanced: [{ zoom: c.zoom.min } as MediaTrackConstraintSet] });
  } catch {
    /* pas de zoom ici */
  }
}

/** La caméra voulue — sinon, la première fois, la plus large de l'arrière. */
async function ouvrirCamera(voulue: string | null): Promise<{ flux: MediaStream; cameras: Camera[]; id: string }> {
  let flux = await ouvrir(voulue ? { deviceId: { exact: voulue } } : { facingMode: { ideal: "environment" } });
  const cameras = await camerasDuTelephone();
  const idDe = (f: MediaStream) => f.getVideoTracks()[0]?.getSettings().deviceId ?? "";
  const large = cameras.find((c) => c.large);
  if (!voulue && large && large.id !== idDe(flux)) {
    // UN SEUL FLUX DE CAMÉRA À LA FOIS sur un iPhone : on lâche le premier avant d'ouvrir l'ultra grand-angle
    flux.getTracks().forEach((p) => p.stop());
    try {
      flux = await ouvrir({ deviceId: { exact: large.id } });
    } catch {
      flux = await ouvrir({ facingMode: { ideal: "environment" } });
    }
  }
  await dezoomer(flux);
  return { flux, cameras, id: idDe(flux) || voulue || "" };
}

const enHorloge = (s: number) => {
  const m = Math.floor(s / 60);
  return `${m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}` : m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};
const enMo = (o: number) => `${(o / 1e6).toFixed(o < 1e7 ? 1 : 0).replace(".", ",")} Mo`;

export function EpisodeComptoir({
  commerce,
  dossier,
  ville,
  onRetour,
  publier,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  ville: string;
  onRetour: () => void;
  /** Le film part en ligne (ou, en démonstration, fait comme si) : le message à lui dire. */
  publier: (e: { texte: string; affiche: string; episode: Film; bande: Film | null }) => Promise<{ ok: boolean; message: string }>;
}) {
  const [etape, setEtape] = useState<Etape>("intro");
  const [serie, setSerie] = useState({ saison: new Date().getFullYear(), numero: 1 });
  const [produit, setProduit] = useState("");
  const [prix, setPrix] = useState("");
  const [sonAtelier, setSonAtelier] = useState(true);
  /** La caméra en cours (son identifiant), et toutes celles du téléphone, la plus large d'abord. */
  const [camera, setCamera] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  /** La forme de l'image (largeur ÷ hauteur) : la grille de l'aperçu se pose dessus. */
  const [forme, setForme] = useState(3 / 4);
  const [erreur, setErreur] = useState("");
  const [etat, setEtat] = useState<EtatSession | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const [montage, setMontage] = useState<{ quoi: string; p: number; mot: string } | null>(null);
  const [episode, setEpisode] = useState<FilmPret | null>(null);
  const [bande, setBande] = useState<FilmPret | null>(null);
  const [envoi, setEnvoi] = useState<{ etat: "en-cours" } | { etat: "fini"; ok: boolean; message: string } | null>(null);

  const video = useRef<HTMLVideoElement>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  const flux = useRef<MediaStream | null>(null);
  const session = useRef<SessionEpisode | null>(null);
  const tournage = useRef<Tournage | null>(null);
  const son = useRef<AudioContext | null>(null);
  const veille = useRef<Veille | null>(null);
  const arret = useRef<AbortController | null>(null);
  const films = useRef<FilmPret[]>([]);

  /* SON NUMÉRO : un de plus que le dernier publié cette saison (lu sur ce téléphone) */
  useEffect(() => setSerie(prochainEpisode(commerce.id)), [commerce.id]);

  /* ─── l'écran reste allumé : la session, puis le montage ─── */
  const garderAllume = useCallback(async () => {
    try {
      const n = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Veille> } };
      veille.current = (await n.wakeLock?.request("screen")) ?? null;
    } catch {
      veille.current = null;
    }
  }, []);
  const eteindre = useCallback(() => {
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);

  /* EN PARTANT : la caméra, l'écran, le montage, les films */
  useEffect(
    () => () => {
      arret.current?.abort();
      void session.current?.terminer();
      flux.current?.getTracks().forEach((t) => t.stop());
      veille.current?.release().catch(() => {});
      son.current?.close().catch(() => {});
      films.current.forEach((f) => URL.revokeObjectURL(f.url));
    },
    [],
  );
  /* REVENU DANS L'APPLICATION : l'écran se rallume (le téléphone a lâché la veille) */
  useEffect(() => {
    const revenir = () => {
      if (document.visibilityState === "visible" && (etape === "cadre" || etape === "session" || etape === "montage")) void garderAllume();
    };
    document.addEventListener("visibilitychange", revenir);
    return () => document.removeEventListener("visibilitychange", revenir);
  }, [etape, garderAllume]);

  const brancher = useCallback(async (voulue: string | null) => {
    flux.current?.getTracks().forEach((t) => t.stop());
    flux.current = null;
    const r = await ouvrirCamera(voulue);
    flux.current = r.flux;
    setCamera(r.id || null);
    if (r.cameras.length) setCameras(r.cameras);
    if (video.current) {
      video.current.srcObject = r.flux;
      await video.current.play().catch(() => {});
    }
    return r.flux;
  }, []);

  /* LA FORME DE L'IMAGE, lue sur la vidéo (elle change avec la caméra, ou si on couche le téléphone) */
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const lire = () => v.videoWidth && v.videoHeight && setForme(v.videoWidth / v.videoHeight);
    v.addEventListener("loadedmetadata", lire);
    v.addEventListener("resize", lire);
    return () => {
      v.removeEventListener("loadedmetadata", lire);
      v.removeEventListener("resize", lire);
    };
  }, []);

  const placer = async () => {
    setErreur("");
    setEtape("cadre");
    try {
      await brancher(camera);
      void garderAllume();
    } catch (e) {
      setErreur(
        (e as Error)?.name === "NotAllowedError"
          ? "La caméra est refusée : autorise-la dans les réglages de ton navigateur, puis réessaie."
          : "La caméra ne s’ouvre pas sur ce téléphone.",
      );
    }
  };

  /** ↺ : la caméra suivante du téléphone (la plus large d'abord, celle de devant en dernier). */
  const changerDeCamera = async () => {
    setErreur("");
    const i = cameras.findIndex((c) => c.id === camera);
    const suivante = cameras[(i + 1) % Math.max(1, cameras.length)];
    if (!suivante || cameras.length < 2) return setErreur("Ce téléphone n’a qu’une caméra ici.");
    try {
      await brancher(suivante.id);
    } catch {
      setErreur("Cette caméra ne s’ouvre pas.");
      await brancher(camera).catch(() => {});
    }
  };
  const nomCamera = cameras.find((c) => c.id === camera)?.nom ?? "";

  const demarrer = () => {
    if (!flux.current || !video.current) return;
    setErreur("");
    const s = new SessionEpisode({ video: video.current, flux: flux.current, surEtat: setEtat });
    session.current = s;
    s.demarrer();
    setEtape("session");
  };

  /* LA CAMÉRA S'EST COUPÉE (un appel, une autre application) : on la redonne à la session */
  const reprendre = async () => {
    try {
      const s = await brancher(camera);
      session.current?.changerFlux(s);
      void garderAllume();
    } catch {
      setErreur("La caméra ne revient pas. Ferme les autres applications, puis touche « Reprendre ».");
    }
  };

  const monter = useCallback(
    async (t: Tournage, avecSon: boolean) => {
      setEtape("montage");
      setErreur("");
      films.current.forEach((f) => URL.revokeObjectURL(f.url));
      films.current = [];
      setEpisode(null);
      setBande(null);
      const ctl = new AbortController();
      arret.current = ctl;
      const ctx = son.current ?? new AudioContext();
      son.current = ctx;
      const commun = {
        ctx,
        tournage: t,
        commerce: commerce.nom,
        ville,
        produit: produit.trim(),
        prix: prix.trim(),
        saison: serie.saison,
        numero: serie.numero,
        fantome: chefEnPied(dossier),
        sonAtelier: avecSon,
        signal: ctl.signal,
      };
      try {
        const toileFilm = toile.current;
        if (!toileFilm) throw new Error("L’écran du montage n’est pas prêt.");
        setMontage({ quoi: "Ton épisode", p: 0, mot: "Je prépare tes moments…" });
        const e = await monterEpisode({
          ...commun,
          toile: toileFilm,
          genre: "episode",
          surEtape: (mot) => setMontage((m) => (m ? { ...m, mot } : m)),
          surProgres: (p) => setMontage({ quoi: "Ton épisode", p, mot: "Je monte ton épisode, sous tes yeux." }),
        });
        const ep = { ...e, url: URL.createObjectURL(e.blob) };
        films.current.push(ep);
        setEpisode(ep);
        // LA BANDE-ANNONCE, POUR SES RÉSEAUX : un Reel ne dépasse pas 90 secondes
        if (e.duree > REEL_MAX_S - 5) {
          setMontage({ quoi: "La bande-annonce", p: 0, mot: "Et sa bande-annonce, pour tes réseaux…" });
          const b = await monterEpisode({
            ...commun,
            toile: toileFilm,
            genre: "bande",
            surProgres: (p) => setMontage({ quoi: "La bande-annonce", p, mot: "Sa bande-annonce, pour tes réseaux : une trentaine de secondes." }),
          });
          const bp = { ...b, url: URL.createObjectURL(b.blob) };
          films.current.push(bp);
          setBande(bp);
        }
        setMontage(null);
        setEtape("pret");
      } catch (err) {
        setMontage(null);
        if (ctl.signal.aborted) return;
        setErreur(`Le montage s’est arrêté : ${(err as Error)?.message ?? "erreur inconnue"}.`);
        setEtape("pret");
      } finally {
        veille.current?.release().catch(() => {});
        veille.current = null;
      }
    },
    [commerce.nom, dossier, prix, produit, serie, ville],
  );

  const terminer = async () => {
    if (!confirmer) {
      setConfirmer(true);
      setTimeout(() => setConfirmer(false), 4000);
      return;
    }
    setConfirmer(false);
    // LE SON DU MONTAGE NAÎT ICI, AU TOUCHER : un téléphone refuse de jouer un son qui ne vient pas d'un geste
    try {
      son.current?.close().catch(() => {});
      son.current = new AudioContext();
      void son.current.resume().catch(() => {});
    } catch {
      son.current = null;
    }
    const s = session.current;
    session.current = null;
    if (!s) return;
    const t = await s.terminer();
    eteindre();
    if (t.duree < SESSION_MIN_S || t.morceaux.length < 2) {
      await placer();
      setErreur(`Trop court pour un épisode : filme au moins ${SESSION_MIN_S} secondes de fabrication.`);
      return;
    }
    tournage.current = t;
    await monter(t, sonAtelier);
  };

  /* LA SESSION S'ARRÊTE TOUTE SEULE AU BOUT D'UNE HEURE ET DEMIE */
  const auto = useRef(false);
  useEffect(() => {
    if (etape !== "session" || !etat || etat.ecoule < SESSION_MAX_S || auto.current) return;
    auto.current = true;
    void (async () => {
      const s = session.current;
      session.current = null;
      if (!s) return;
      const t = await s.terminer();
      eteindre();
      tournage.current = t;
      await monter(t, sonAtelier);
    })();
  }, [etape, etat, eteindre, monter, sonAtelier]);

  const remonter = (avecSon: boolean) => {
    if (!tournage.current) return;
    setSonAtelier(avecSon);
    // un nouveau montage a besoin d'un nouveau geste pour son son : celui-ci
    void son.current?.resume().catch(() => {});
    void garderAllume();
    void monter(tournage.current, avecSon);
  };

  const envoyer = async () => {
    if (!episode || envoi?.etat === "en-cours") return;
    setEnvoi({ etat: "en-cours" });
    const r = await publier({
      texte: texteDeLEpisode(serie.saison, serie.numero, produit, prix),
      affiche: episode.affiche,
      episode,
      bande,
    });
    setEnvoi({ etat: "fini", ...r });
    if (r.ok) {
      retenirEpisode(commerce.id, serie.saison, serie.numero);
      setEtape("publie");
    }
  };

  const recommencer = () => {
    films.current.forEach((f) => URL.revokeObjectURL(f.url));
    films.current = [];
    tournage.current = null;
    setEpisode(null);
    setBande(null);
    setEnvoi(null);
    setEtat(null);
    auto.current = false;
    setSerie(prochainEpisode(commerce.id));
    setEtape("intro");
  };

  const titre = `Saison ${serie.saison} · Épisode ${serie.numero}`;
  const filme = etape === "cadre" || etape === "session";

  return (
    <div className={`ep${filme ? " ep-filme" : ""}`}>
      <style>{STYLES}</style>
      {/* LA CAMÉRA : toujours dans la page (la session lit ses images), visible au cadre et pendant la session */}
      <video ref={video} className="ep-camera" muted playsInline autoPlay aria-hidden={!filme} />

      {!filme && etape !== "montage" && (
        <div className="ep-haut">
          <button type="button" className="ep-retour" onClick={onRetour}>
            ‹ Mon comptoir
          </button>
          <span className="ep-serie">{titre}</span>
        </div>
      )}

      {etape === "intro" && (
        <div className="ep-corps">
          <section className="ep-intro">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${dossier}repos.webp`} alt="" />
            <p>
              Pose ton téléphone là où tu fabriques, et travaille comme d’habitude. Je filme, je garde les meilleurs moments, et j’en fais{" "}
              <b>
                l’épisode {serie.numero} de ta série {serie.saison}
              </b>
              .
            </p>
          </section>
          <label className="ep-champ">
            <span>Qu’est-ce que tu fabriques ?</span>
            <input value={produit} onChange={(e) => setProduit(e.target.value.slice(0, 60))} placeholder={EXEMPLES[commerce.famille] ?? "Ex. : le fraisier"} />
          </label>
          <label className="ep-champ">
            <span>Son prix (facultatif)</span>
            <input value={prix} onChange={(e) => setPrix(e.target.value.slice(0, 16))} placeholder="Ex. : 32 €" inputMode="text" />
          </label>
          <label className="ep-case">
            <input type="checkbox" checked={sonAtelier} onChange={(e) => setSonAtelier(e.target.checked)} />
            <span>
              <b>Garder le son de l’atelier</b> sous la musique
            </span>
          </label>
          <ul className="ep-conseils">
            <li>📱 Sur un support, en hauteur et un peu en retrait : je prends l’objectif le plus large, pour que toute la pièce tienne dans le cadre.</li>
            <li>🔌 Branché : une session filmée vide la batterie.</li>
            <li>📵 Ne t’en sers pas pendant la session : un appel ou une autre appli coupe la caméra.</li>
            <li>🙋 Les personnes filmées doivent être d’accord : cadre plutôt tes mains et ton plan de travail.</li>
            <li>🎵 Pas de radio si tu gardes le son : une musique protégée fait bloquer la vidéo sur les réseaux.</li>
          </ul>
          <button type="button" className="cz-go grand" disabled={!produit.trim()} onClick={() => void placer()}>
            📷 Placer mon téléphone <s aria-hidden="true">→</s>
          </button>
        </div>
      )}

      {etape === "cadre" && (
        <div className="ep-calque">
          {/* LA GRILLE SUR L'IMAGE, pas sur l'écran : l'aperçu montre l'image entière, bandes noires comprises */}
          <div className="ep-grille" aria-hidden="true" style={{ aspectRatio: String(forme), width: `min(100%, calc(100dvh * ${forme.toFixed(4)}))` }} />
          <div className="ep-calque-haut">
            <button type="button" className="ep-rond" onClick={() => (eteindre(), setEtape("intro"))} aria-label="Revenir">
              ‹
            </button>
            <p>
              Toute la scène est dans le cadre ?
              {nomCamera && <span className="ep-objectif">{nomCamera}</span>}
            </p>
            <button type="button" className="ep-rond" onClick={() => void changerDeCamera()} aria-label="Changer de caméra">
              ↺
            </button>
          </div>
          <div className="ep-calque-bas">
            {erreur && <p className="ep-erreur">{erreur}</p>}
            <button type="button" className="cz-go grand" onClick={demarrer} disabled={Boolean(erreur) && !flux.current}>
              ▶ Démarrer la session
            </button>
            <small>Ensuite, travaille. Touche « J’ai terminé » quand c’est fini.</small>
          </div>
        </div>
      )}

      {etape === "session" && (
        <div className="ep-calque">
          <div className="ep-calque-haut">
            <span className="ep-rec">
              <i aria-hidden="true" /> {enHorloge(etat?.ecoule ?? 0)}
            </span>
            <span className="ep-gardes">{etat?.gardes ?? 0} moments gardés</span>
          </div>
          <div className="ep-activite" aria-hidden="true">
            <i style={{ width: `${Math.round((etat?.activite ?? 0) * 100)}%` }} />
          </div>
          {etat?.coupee && (
            <div className="ep-coupee" role="alert">
              <p>La caméra s’est arrêtée (un appel, une autre application…). Ce qui a été filmé est gardé.</p>
              <button type="button" className="cz-go" onClick={() => void reprendre()}>
                ▶ Reprendre la session
              </button>
            </div>
          )}
          <div className="ep-calque-bas">
            {erreur && <p className="ep-erreur">{erreur}</p>}
            <button type="button" className={`ep-fini${confirmer ? " sur" : ""}`} onClick={() => void terminer()}>
              {confirmer ? "Touche encore pour terminer" : "⏹ J’ai terminé"}
            </button>
            <small>Je garde les meilleurs moments. Travaille comme d’habitude.</small>
          </div>
        </div>
      )}

      {/* LE MONTAGE, SOUS SES YEUX : la toile est celle qu'on enregistre */}
      <div className={`ep-montage${etape === "montage" ? " on" : ""}`} aria-hidden={etape !== "montage"}>
        <h2>{montage?.quoi ?? "Le montage"}</h2>
        <p>{montage?.mot ?? ""}</p>
        <canvas ref={toile} className="ep-toile" />
        <span className="ep-barre" aria-hidden="true">
          <i style={{ width: `${Math.round((montage?.p ?? 0) * 100)}%` }} />
        </span>
        <small>Garde l’écran allumé jusqu’au bout.</small>
        {etape === "montage" && (
          <button type="button" className="cz-second" onClick={() => (arret.current?.abort(), setEtape("pret"))}>
            Arrêter le montage
          </button>
        )}
      </div>

      {etape === "pret" && (
        <div className="ep-corps">
          {erreur && <p className="ep-erreur">{erreur}</p>}
          {episode ? (
            <>
              <figure className="ep-film">
                <video src={episode.url} poster={episode.affiche || undefined} controls playsInline />
                <figcaption>
                  {titre} · {produit.trim()} · {enDuree(episode.duree)} · {enMo(episode.blob.size)}
                </figcaption>
              </figure>
              {bande && (
                <figure className="ep-film petit">
                  <video src={bande.url} poster={bande.affiche || undefined} controls playsInline />
                  <figcaption>La bande-annonce, pour tes réseaux · {Math.round(bande.duree)} s</figcaption>
                </figure>
              )}
              <button type="button" className="cz-go grand" onClick={() => void envoyer()} disabled={envoi?.etat === "en-cours"}>
                {envoi?.etat === "en-cours" ? "J’envoie ton épisode…" : "📣 Publier l’épisode"}
              </button>
              <p className="ep-ou">
                {bande ? "L’épisode entier dans Le Direct et sur ta page ; sa bande-annonce sur tes réseaux." : "Dans Le Direct, sur ta page et sur tes réseaux."}
              </p>
              {envoi?.etat === "fini" && !envoi.ok && <p className="ep-erreur">{envoi.message}</p>}
              <div className="ep-actions">
                <a className="cz-second" href={episode.url} download={`episode-${serie.numero}.${/mp4/.test(episode.type) ? "mp4" : "webm"}`}>
                  ⬇️ Garder sur mon téléphone
                </a>
                {tournage.current && (
                  <button type="button" className="cz-second" onClick={() => remonter(!sonAtelier)}>
                    {sonAtelier ? "🔇 Refaire sans le son de l’atelier" : "🔊 Refaire avec le son de l’atelier"}
                  </button>
                )}
              </div>
            </>
          ) : (
            tournage.current && (
              <button type="button" className="cz-go grand" onClick={() => remonter(sonAtelier)}>
                🎬 Relancer le montage
              </button>
            )
          )}
          <button type="button" className="cz-second" onClick={recommencer}>
            Recommencer une session
          </button>
        </div>
      )}

      {etape === "publie" && (
        <div className="ep-corps ep-bravo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${dossier}salut-1.webp`} alt="" />
          <h2>🎉 {titre} est en ligne !</h2>
          <p>{envoi?.etat === "fini" ? envoi.message : ""}</p>
          <button type="button" className="cz-go grand" onClick={onRetour}>
            Retour au comptoir
          </button>
          <button type="button" className="cz-second" onClick={recommencer}>
            Préparer l’épisode {serie.numero + 1}
          </button>
        </div>
      )}
    </div>
  );
}

const STYLES = `
.ep{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;background:var(--fond);overflow:hidden;}
.ep-camera{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;opacity:0;pointer-events:none;}
.ep-filme .ep-camera{opacity:1;}
.ep-haut{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 0;}
.ep-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.ep-serie{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--rose);}
.ep-corps{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:14px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;}
.ep-corps::-webkit-scrollbar{display:none;}
.ep-intro{display:grid;grid-template-columns:76px 1fr;gap:12px;align-items:center;padding:14px;border-radius:22px;background:var(--nappe);border:1px solid var(--trait);}
.ep-intro img{width:76px;height:76px;object-fit:contain;}
.ep-intro p{margin:0;font-size:15px;line-height:1.42;}
.ep-intro b{color:var(--ambre);}
.ep-champ{display:flex;flex-direction:column;gap:6px;}
.ep-champ span{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.ep-champ input{height:50px;padding:0 14px;border-radius:14px;border:1px solid var(--trait);background:var(--nappe2);color:var(--creme);font-size:17px;}
.ep-case{display:flex;align-items:center;gap:10px;font-size:14.5px;}
.ep-case input{width:22px;height:22px;accent-color:var(--rose);}
.ep-conseils{margin:0;padding:12px 14px;border-radius:18px;background:rgba(255,244,230,.04);border:1px dashed var(--trait);list-style:none;display:grid;gap:7px;font-size:13.5px;line-height:1.4;color:var(--gris);}
.ep-calque{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:max(14px,env(safe-area-inset-top,0px)) 14px calc(18px + env(safe-area-inset-bottom,0px));
  background:linear-gradient(rgba(0,0,0,.45),transparent 22%,transparent 62%,rgba(0,0,0,.7));}
.ep-grille{position:absolute;left:50%;top:50%;max-height:100%;transform:translate(-50%,-50%);pointer-events:none;
  background:linear-gradient(90deg,transparent calc(33.3% - 1px),rgba(255,255,255,.35) 33.3%,transparent calc(33.3% + 1px),transparent calc(66.6% - 1px),rgba(255,255,255,.35) 66.6%,transparent calc(66.6% + 1px)),
    linear-gradient(transparent calc(33.3% - 1px),rgba(255,255,255,.35) 33.3%,transparent calc(33.3% + 1px),transparent calc(66.6% - 1px),rgba(255,255,255,.35) 66.6%,transparent calc(66.6% + 1px));}
.ep-calque-haut{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;}
.ep-calque-haut p{margin:0;flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;font-weight:800;font-size:15px;text-shadow:0 1px 6px rgba(0,0,0,.7);}
.ep-objectif{padding:4px 11px;border-radius:999px;background:rgba(20,12,9,.62);border:1px solid rgba(255,255,255,.28);font-size:12.5px;font-weight:700;text-shadow:none;}
.ep-rond{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(20,12,9,.55);color:#fff;font-size:20px;}
.ep-calque-bas{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;}
.ep-calque-bas small{font-size:13px;color:#fff;opacity:.85;text-shadow:0 1px 6px rgba(0,0,0,.8);}
.ep-rec{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(20,12,9,.6);font-weight:800;font-variant-numeric:tabular-nums;}
.ep-rec i{width:11px;height:11px;border-radius:50%;background:#FF3B3B;animation:ep-clignote 1.2s steps(2) infinite;}
@keyframes ep-clignote{50%{opacity:.25}}
.ep-gardes{padding:8px 14px;border-radius:999px;background:rgba(20,12,9,.6);font-size:13.5px;font-weight:700;}
.ep-activite{position:absolute;left:14px;right:14px;top:calc(max(14px,env(safe-area-inset-top,0px)) + 54px);height:4px;border-radius:9px;background:rgba(255,255,255,.18);overflow:hidden;}
.ep-activite i{display:block;height:100%;background:#3DE2A6;transition:width .25s;}
.ep-coupee{position:relative;margin:auto 0;padding:16px;border-radius:20px;background:rgba(20,12,9,.88);border:1px solid rgba(245,162,58,.6);display:flex;flex-direction:column;gap:12px;text-align:center;}
.ep-coupee p{margin:0;font-size:15px;line-height:1.4;}
.ep-fini{width:100%;min-height:62px;border-radius:999px;border:2px solid #fff;background:rgba(255,59,59,.88);color:#fff;font-size:19px;font-weight:900;}
.ep-fini.sur{background:#fff;color:#C4141E;}
.ep-erreur{margin:0;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.4;background:rgba(245,162,58,.16);border:1px solid rgba(245,162,58,.5);color:var(--creme);}
.ep-montage{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;gap:10px;padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));text-align:center;background:var(--fond);}
.ep-montage.on{display:flex;}
.ep-montage h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:22px;}
.ep-montage p{margin:0;font-size:14px;color:var(--gris);max-width:34ch;min-height:2.6em;}
.ep-montage small{font-size:12.5px;color:var(--gris);}
.ep-toile{flex:1;min-height:0;max-height:62vh;aspect-ratio:9/16;max-width:100%;border-radius:18px;background:#000;box-shadow:0 18px 40px rgba(0,0,0,.5);}
.ep-barre{display:block;width:min(100%,320px);height:6px;border-radius:9px;background:var(--nappe2);overflow:hidden;}
.ep-barre i{display:block;height:100%;background:var(--rose);transition:width .3s;}
.ep-film{margin:0 auto;width:min(82%,300px);}
.ep-film.petit{width:min(52%,180px);}
.ep-film video{display:block;width:100%;aspect-ratio:9/16;border-radius:16px;background:#000;}
.ep-film figcaption{margin-top:6px;font-size:13px;font-weight:700;color:var(--ambre);text-align:center;}
.ep-ou{margin:-4px 0 0;text-align:center;font-size:13px;color:var(--gris);}
.ep-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;}
.ep-actions .cz-second{text-decoration:none;color:var(--creme);}
.ep-bravo{align-items:center;text-align:center;justify-content:center;}
.ep-bravo img{width:150px;height:150px;object-fit:contain;}
.ep-bravo h2{margin:0;font-family:var(--font-clikme),sans-serif;font-weight:800;font-size:23px;}
.ep-bravo p{margin:0;color:var(--gris);font-size:15px;}
`;
