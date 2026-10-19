/**
 * 🎬 LE FILM DU REPORTER — la vidéo du commerçant qui n'a ni parlé ni posé devant la caméra.
 *
 * Le même métier que l'interview (`interview-montage.ts`), et la même signature
 * pour qu'on reconnaisse ClikMe d'un film à l'autre : le titre au clic, la
 * musique de l'émission, les mots qui s'allument un à un, la carte postale de
 * la fin. Mais un seul temps au milieu : LE RÉCIT (`reporter-recit.ts`), dit
 * par le reporter.
 *
 *   · L'ARRIVÉE et L'APPEL : le reporter en grand, micro en main, devant sa
 *     photo floutée — il arrive en glissant, et repart sur l'appel.
 *   · LA DÉCOUVERTE, SES FAITS, LE REGARD : ses photos en plein écran, une par
 *     phrase, qui avancent doucement ; un coup de zoom quand il nomme le plat ;
 *     le reporter dans le coin, qui continue de parler.
 *   · LE PRIX : il frappe au milieu de l'écran.
 *
 * SA VOIX, QUAND ELLE EST LÀ (`/api/direct/reporter/voix`) : la bouche du
 * reporter la suit, et chaque mot s'allume à son instant (ou au prorata, si le
 * service ne l'a pas donné). SANS ELLE (`INTERVIEW_VOIX_ID` pas encore réglé),
 * le film se tourne quand même : chaque phrase reste à l'écran le temps de la
 * lire, en grand, sur la musique.
 *
 * FICHIER NAVIGATEUR : il dessine sur une toile et l'enregistre en direct.
 */
import {
  DEBIT_SON,
  debitDuMontage,
  dureeDeLecture,
  enDeuxLignes,
  morceauxDeMots,
  motsDesSousTitres,
  motsForts,
  type SousTitre,
} from "@/lib/direct/interview-fantome";
import { dessinerFantome, formatVideo, ouvertures, type Elements, type Place } from "@/lib/direct/interview-montage";
import {
  HAUTEUR as H,
  LARGEUR as W,
  borne,
  bruitBlanc,
  couvrirImage,
  dessinerCadre,
  dessinerFin,
  dessinerFrappe,
  dessinerGrain,
  dessinerSousTitres,
  dessinerTitre,
  eclairDuClic,
  fabriquerGrain,
  fabriquerVignette,
  flouter,
  fuite,
  reverbe,
  secousse,
  sonClic,
  sonFrappe,
  sonSignature,
  sonTampon,
  sonTic,
  sonZoom,
  sortie,
  type Fin,
  type Polices,
  type SortieSon,
  type Titre,
} from "@/lib/direct/interview-signature";
import { sousTitresDesMots, type MotHorodate } from "@/lib/direct/interview-resserrer";
import type { Role } from "@/lib/direct/reporter-recit";

const IPS = 30;
const TITRE = 2.9;
const CLIC = 0.25;
/** Un souffle avant que le reporter parle, et après sa dernière phrase. */
const AVANT = 0.25;
const APRES = 0.6;
const MUSIQUE = { pleine: 0.3, recit: 0.07, fin: 0.3 } as const;
const REPORTER_GRAND: Place = { cx: 360, bas: 1190, h: 640 };
const REPORTER_COIN: Place = { cx: 585, bas: 1262, h: 300 };

export type Film = { blob: Blob; type: string; duree: number; affiche: string };

/** Une phrase du récit, et quand elle se dit (en secondes depuis le début du récit). */
type Temps = { role: Role; texte: string; de: number; a: number };

/**
 * LES TEMPS DES PHRASES. Avec l'instant de chaque mot : la phrase commence à son premier mot. Avec la
 * voix seule : au prorata de leur longueur. Sans voix : le temps de les lire.
 */
function tempsDesPhrases(morceaux: { role: Role; texte: string }[], duree: number | null, mots: MotHorodate[] | null): Temps[] {
  if (mots?.length) {
    const out: Temps[] = [];
    let k = 0;
    for (const m of morceaux) {
      const n = m.texte.split(/\s+/).filter(Boolean).length;
      const l = mots.slice(k, k + n);
      k += n;
      if (!l.length) return tempsDesPhrases(morceaux, duree, null);
      out.push({ ...m, de: l[0].a, a: l[l.length - 1].b });
    }
    // une phrase dure jusqu'au début de la suivante
    return out.map((t, i) => ({ ...t, a: i + 1 < out.length ? out[i + 1].de : Math.max(t.a, duree ?? t.a) }));
  }
  if (duree != null) {
    const total = morceaux.reduce((s, m) => s + m.texte.length + 4, 0);
    let t = 0;
    return morceaux.map((m) => {
      const d = ((m.texte.length + 4) / total) * duree;
      const x = { ...m, de: t, a: t + d };
      t += d;
      return x;
    });
  }
  let t = 0;
  return morceaux.map((m) => {
    const d = dureeDeLecture(m.texte) * 0.95;
    const x = { ...m, de: t, a: t + d };
    t += d;
    return x;
  });
}

function image(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = ko;
    i.src = src;
  });
}

export async function tournerFilm(o: {
  ctx: AudioContext;
  el: Elements;
  toile: HTMLCanvasElement;
  morceaux: { role: Role; texte: string }[];
  /** Sa voix, décodée — `null` : le film se tourne sans elle. */
  voix: AudioBuffer | null;
  /** L'instant de chaque mot dans sa voix, s'il a été donné. */
  mots: MotHorodate[] | null;
  photos: string[];
  commerce: string;
  ville: string;
  /** « Le plat du jour », « La pièce du moment ». */
  quoi: string;
  plat: string;
  prix: string;
  /** « Ce midi », « Aujourd'hui ». */
  quand: string;
  ecouter: boolean;
  /** Le nom de l'émission, sur le titre, le cadre et le tampon — « Le spécialiste culinaire » dans les
   *  démonstrations. Sans lui : « Le reporter ClikMe ». */
  signature?: string;
  surProgres?: (p: number) => void;
  surAffiche?: (image: string) => void;
  signal?: AbortSignal;
}): Promise<Film> {
  const { ctx, el } = o;
  const c2d = o.toile.getContext("2d");
  if (!c2d) throw new Error("Ce téléphone ne sait pas dessiner la vidéo.");
  if (typeof o.toile.captureStream !== "function") throw new Error("Ce téléphone ne sait pas enregistrer un dessin animé (captureStream).");
  o.toile.width = W;
  o.toile.height = H;
  const P: Polices = { affiche: el.police.affiche, texte: el.police.bulle, serif: el.police.enseigne };

  /* ─── ses photos, et ce qui ne bouge pas ─── */
  const photos = (await Promise.all(o.photos.slice(0, 4).map((p) => image(p).catch(() => null)))).filter((x): x is HTMLImageElement => x != null);
  const premiere = photos[0] ?? null;
  let fond: HTMLCanvasElement | null = null;
  try {
    if (premiere) fond = flouter(premiere, premiere.naturalWidth, premiere.naturalHeight);
  } catch {
    fond = null;
  }
  const vignette = fabriquerVignette();
  const grain = fabriquerGrain();

  /* ─── le récit et ses temps ─── */
  const dureeVoix = o.voix?.duration ?? null;
  const temps = tempsDesPhrases(o.morceaux, dureeVoix, o.voix ? o.mots : null);
  const finRecit = Math.max(temps[temps.length - 1]?.a ?? 0, dureeVoix ?? 0);
  const RECIT = AVANT + finRecit + APRES;
  const SIGNATURE = 2.6;
  const FIN = SIGNATURE + 1.7;
  const DEBUT_FIN = TITRE + RECIT;
  const TOTAL = DEBUT_FIN + FIN;
  // SES MOTS À L'ÉCRAN : à leur instant, ou au prorata de chaque phrase
  const sousTitres: SousTitre[] = o.voix && o.mots?.length ? sousTitresDesMots(o.mots) : temps.map((t) => ({ texte: t.texte, debut: t.de, fin: t.a - 0.08 }));
  const forts = motsForts(o.plat, o.prix);
  const morceauxEcran = morceauxDeMots(motsDesSousTitres(sousTitres, forts));
  const bouche = o.voix ? ouvertures(o.voix) : null;
  // LES PHOTOS DÉFILENT : une par phrase hors arrivée et appel
  const photoDe = new Map<number, number>();
  let n = 0;
  temps.forEach((t, i) => {
    if (t.role !== "arrivee" && t.role !== "appel") photoDe.set(i, photos.length ? n++ % photos.length : -1);
  });

  /* ─── le son ─── */
  const enregistree = ctx.createMediaStreamDestination();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  const limite = ctx.createDynamicsCompressor();
  limite.threshold.value = -2;
  limite.knee.value = 0;
  limite.ratio.value = 20;
  const bus = ctx.createGain();
  bus.connect(comp);
  comp.connect(limite);
  limite.connect(enregistree);
  const ecoute = ctx.createGain();
  ecoute.gain.value = o.ecouter ? 1 : 0;
  limite.connect(ecoute);
  ecoute.connect(ctx.destination);
  const salle = reverbe(ctx);
  const retour = ctx.createGain();
  retour.gain.value = 0.3;
  salle.connect(retour);
  retour.connect(bus);
  const effets = ctx.createGain();
  effets.gain.value = 0.9;
  effets.connect(bus);
  const S: SortieSon = { ctx, bruit: bruitBlanc(ctx), dest: effets, salle };
  const sources: AudioScheduledSourceNode[] = [];
  const musique = ctx.createGain();
  musique.gain.value = 0;
  musique.connect(bus);
  const niveau = (quand: number, v: number, en = 0.25) => {
    musique.gain.cancelScheduledValues(quand);
    musique.gain.setTargetAtTime(Math.max(0.0001, v), quand, en / 3);
  };

  /* ─── l'enregistreur ─── */
  const format = formatVideo();
  const flux = new MediaStream([...o.toile.captureStream(IPS).getVideoTracks(), ...enregistree.stream.getAudioTracks()]);
  const rec = new MediaRecorder(flux, {
    ...(format ? { mimeType: format } : {}),
    videoBitsPerSecond: debitDuMontage(TOTAL),
    audioBitsPerSecond: DEBIT_SON,
  });
  const morceauxVideo: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) morceauxVideo.push(e.data);
  };
  const arrete = new Promise<void>((ok) => (rec.onstop = () => ok()));

  /* ─── ce qu'on voit ─── */
  const NOM = o.commerce.trim();
  const SIGNE = o.signature?.trim().toLocaleUpperCase("fr-FR") || "LE REPORTER CLIKME";
  // le tampon tourne autour d'un rond : 40 signes au plus
  const tampon = `${SIGNE} · ${NOM.toLocaleUpperCase("fr-FR")} · `;
  const titre: Titre = {
    fond,
    nom: NOM,
    haut: [o.ville.trim(), o.quand].filter(Boolean).join(" · ").toLocaleUpperCase("fr-FR"),
    bas: [o.quoi.toLocaleLowerCase("fr-FR"), o.plat.trim() || o.quoi],
    emission: SIGNE,
  };
  const fin: Fin = {
    fond,
    photo: premiere ? { src: premiere, w: premiere.naturalWidth, h: premiere.naturalHeight } : null,
    legende: o.plat,
    entete: `${o.quand} · ${NOM}`.toLocaleUpperCase("fr-FR"),
    plat: enDeuxLignes(o.plat.trim() || o.quoi, 16),
    prix: o.prix.trim(),
    infos: o.ville.trim(),
    bouton: "À découvrir sur",
    logo: el.logo,
    tampon: tampon.length <= 40 ? tampon : o.signature ? `${SIGNE} · CLIKME · ` : `${SIGNE} · ${SIGNE} · `,
    mention: o.voix ? (o.signature ? "Sa voix est une voix de synthèse" : "La voix du reporter est une voix de synthèse") : "",
  };
  const nomCadre = o.ville.trim() ? `${NOM} · ${o.ville.trim()}` : NOM;
  const ouverture = (t: number) => {
    if (!bouche) return 0;
    const i = Math.floor(t * IPS);
    return i >= 0 && i < bouche.length ? bouche[i] : 0;
  };
  const phraseA = (tr: number) => temps.findIndex((t, i) => tr < t.a || i === temps.length - 1);
  const prixA = temps.find((t) => t.role === "prix")?.de ?? null;
  const decouverteA = temps.find((t) => t.role === "decouverte")?.de ?? null;

  const dessinerRecit = (u: number) => {
    const tr = u - AVANT;
    const i = Math.max(0, phraseA(tr));
    const t = temps[i];
    const grand = t.role === "arrivee" || t.role === "appel";
    // LE COUP DE ZOOM quand il nomme le plat
    const uz = decouverteA != null ? tr - decouverteA : -1;
    const z = uz >= 0 && uz < 1.8 ? 1 + 0.12 * (1 - sortie(uz / 0.3)) : 1;
    let [dx, dy] = [0, 0];
    if (prixA != null) [dx, dy] = secousse(tr - prixA);
    c2d.save();
    c2d.translate(dx, dy);
    const k = photoDe.get(i);
    if (!grand && k != null && k >= 0) {
      const img = photos[k];
      const v = borne((tr - t.de) / Math.max(0.6, t.a - t.de));
      const sens = i % 2 ? 1 : -1;
      couvrirImage(c2d, img, img.naturalWidth, img.naturalHeight, { z: z * (1.05 + 0.08 * v), fx: 0.5 + sens * 0.05 * (v - 0.5) });
    } else if (fond) c2d.drawImage(fond, 0, 0);
    else {
      c2d.fillStyle = "#140C09";
      c2d.fillRect(0, 0, W, H);
    }
    c2d.restore();
    c2d.drawImage(vignette, 0, 0);
    if (uz >= 0 && uz < 0.7) fuite(c2d, uz / 0.7, 0.9);
    // LE REPORTER : il arrive en glissant, parle en grand sur l'arrivée et l'appel, dans le coin sinon
    const arrive = sortie((u - 0.05) / 0.45);
    const place = grand ? { ...REPORTER_GRAND, cx: REPORTER_GRAND.cx + (1 - arrive) * 420 } : REPORTER_COIN;
    dessinerFantome(c2d, el.reporter, place, u, ouverture(tr), 2 * Math.sin(u * 1.3));
    dessinerCadre(c2d, P, u, nomCadre, SIGNE);
    // LE PRIX FRAPPE
    if (prixA != null && tr >= prixA && tr < prixA + 1.3) dessinerFrappe(c2d, P, o.prix.trim(), tr - prixA, 1.3, H * 0.42);
    // SES MOTS : en haut quand le reporter est en grand, en bas sur les photos
    const m = morceauxEcran.find((x) => tr >= x.de && tr < x.fin);
    dessinerSousTitres(c2d, P, m, tr, grand ? 470 : 923);
  };
  const dessinerFinA = (u: number) => {
    dessinerFin(
      c2d,
      P,
      fin,
      u,
      u,
      SIGNATURE,
      (cx, cy, r) => {
        const img = el.reporter[0];
        const w = 2.5 * r;
        const h = (img.height * w) / Math.max(1, img.width);
        c2d.drawImage(img, cx - w / 2, cy - r * 0.78, w, h);
      },
      null,
    );
    eclairDuClic(c2d, u);
    // LE NOIR DE LA FIN
    const a = borne((u - (FIN - 0.45)) / 0.45);
    if (a > 0) {
      c2d.fillStyle = `rgba(0,0,0,${a})`;
      c2d.fillRect(0, 0, W, H);
    }
  };

  /* ─── les sons, posés une fois ─── */
  if (ctx.state !== "running") await ctx.resume().catch(() => {});
  c2d.fillStyle = "#000";
  c2d.fillRect(0, 0, W, H);
  rec.start(1000);
  const T0 = ctx.currentTime + 0.12;
  if (el.musique) {
    const boucle = ctx.createBufferSource();
    boucle.buffer = el.musique;
    boucle.loop = true;
    boucle.connect(musique);
    boucle.start(T0 + CLIC);
    sources.push(boucle);
  }
  niveau(T0, MUSIQUE.pleine, 0.15);
  sonClic(S, T0 + CLIC);
  const R0 = T0 + TITRE + AVANT;
  niveau(R0 - 0.3, MUSIQUE.recit, 0.4);
  if (o.voix) {
    const s = ctx.createBufferSource();
    s.buffer = o.voix;
    const g = ctx.createGain();
    g.gain.value = 1;
    s.connect(g);
    g.connect(bus);
    s.start(R0);
    sources.push(s);
  }
  if (decouverteA != null) sonZoom(S, R0 + decouverteA);
  if (prixA != null) sonFrappe(S, R0 + prixA);
  const F0 = T0 + DEBUT_FIN;
  niveau(F0, MUSIQUE.fin, 0.2);
  sonClic(S, F0);
  for (const d of [0.55, 0.68, 0.82, 0.95, 1.25]) sonTic(S, F0 + d);
  sonTampon(S, F0 + 1.0);
  sonSignature(S, F0 + SIGNATURE);
  niveau(F0 + SIGNATURE + 0.2, 0.0001, 2.4);

  /* ─── la boucle : l'horloge du son mène, l'image suit ─── */
  let affiche = "";
  let erreur: Error | null = null;
  await new Promise<void>((fini) => {
    const tic = () => {
      if (o.signal?.aborted) {
        erreur = new Error("Tournage interrompu.");
        return fini();
      }
      const t = ctx.currentTime - T0;
      if (t >= TOTAL) return fini();
      if (t < TITRE) {
        const u = t - CLIC;
        if (u < 0) {
          c2d.fillStyle = "#000";
          c2d.fillRect(0, 0, W, H);
        } else dessinerTitre(c2d, P, titre, u);
        eclairDuClic(c2d, u);
        if (!affiche && t >= 2.5) {
          try {
            affiche = o.toile.toDataURL("image/jpeg", 0.82);
            o.surAffiche?.(affiche);
          } catch {
            affiche = "";
          }
        }
      } else if (t < DEBUT_FIN) dessinerRecit(t - TITRE);
      else dessinerFinA(t - DEBUT_FIN);
      dessinerGrain(c2d, grain, t);
      o.surProgres?.(borne(t / TOTAL));
      requestAnimationFrame(tic);
    };
    requestAnimationFrame(tic);
  });

  c2d.fillStyle = "#000";
  c2d.fillRect(0, 0, W, H);
  await new Promise((r) => setTimeout(r, 150));
  if (rec.state !== "inactive") rec.stop();
  await arrete;
  for (const s of sources) {
    try {
      s.stop();
    } catch {
      /* déjà arrêtée */
    }
  }
  bus.disconnect();
  limite.disconnect();
  ecoute.disconnect();
  musique.disconnect();
  salle.disconnect();
  flux.getTracks().forEach((t) => t.stop());
  if (erreur) throw erreur;
  const type = rec.mimeType || format || "video/webm";
  return { blob: new Blob(morceauxVideo, { type }), type, duree: ctx.currentTime - T0, affiche };
}
