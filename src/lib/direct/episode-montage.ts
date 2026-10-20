/**
 * 🎬 LE FILM DE L'ÉPISODE — « une vidéo de 2, 3 ou 4 minutes selon les meilleurs
 * moments d'un produit qu'il a fait ».
 *
 * La même signature que l'interview et le film du spécialiste, pour qu'on
 * reconnaisse ClikMe d'un film à l'autre : le titre au clic, la musique de
 * l'émission, le cadre aux coins roses, la carte postale de la fin. Au milieu,
 * l'histoire de la fabrication, dans l'ordre (voir `planDuMontage`) :
 *
 *   · L'ACCÉLÉRÉ : les images prises pendant la session défilent, « ⏩ ×20 »,
 *     et l'heure de la session tourne dans le coin — on voit le temps passer ;
 *   · LES MOMENTS : ses gestes en vrai, quelques secondes chacun, avec le son de
 *     l'atelier sous la musique (s'il le garde) ;
 *   · LA RÉVÉLATION : la fin de la session, le produit fini, tenue un instant —
 *     « LE VOILÀ », et son prix qui frappe.
 *
 * L'horloge du son mène, l'image suit (comme `tournerFilm`). Les moments sont
 * lus par des lecteurs muets préparés un bloc à l'avance ; leur son, décodé
 * avant, part à l'instant exact de son bloc.
 *
 * FICHIER NAVIGATEUR : il dessine sur une toile et l'enregistre en direct.
 */
import { DEBIT_SON, debitDuMontage, enDeuxLignes } from "@/lib/direct/interview-fantome";
import { chargerElements, formatVideo, lecteurMuet } from "@/lib/direct/interview-montage";
import {
  CREME,
  HAUTEUR as H,
  LARGEUR as W,
  ROSE,
  borne,
  bruitBlanc,
  couvrirImage,
  dessinerCadre,
  dessinerFin,
  dessinerFrappe,
  dessinerGrain,
  dessinerTitre,
  eclairDuClic,
  fabriquerGrain,
  fabriquerVignette,
  flouter,
  rectArrondi,
  reverbe,
  sonClic,
  sonFrappe,
  sonSignature,
  sonTampon,
  sonTic,
  sonZoom,
  sortie,
  texte,
  toile as nouvelleToile,
  type Fin,
  type Polices,
  type SortieSon,
  type Titre,
} from "@/lib/direct/interview-signature";
import { enDuree, planDuMontage, type Bloc, type GenreMontage } from "@/lib/direct/episode";
import type { Tournage } from "@/lib/direct/episode-session";
import type { Film } from "@/lib/direct/reporter-film";

const IPS = 30;
const CLIC = 0.25;
const SIGNATURE = 2.6;
/** La musique : pleine sur le titre, l'accéléré et la fin ; sous ses gestes, elle laisse entendre l'atelier. */
const MUSIQUE = { pleine: 0.3, accelere: 0.3, sousAtelier: 0.1, moment: 0.22, revelation: 0.2 } as const;

type Lecteur = { v: HTMLVideoElement; url: string };

/** Le fond flou d'un plan large : l'image, toute petite, puis agrandie — presque rien à chaque image. */
let fondFlou: HTMLCanvasElement | null = null;

/**
 * LE PLAN LARGE, EN ENTIER. « C'est un plan large qu'il faut pour avoir toute
 * la scène, parce que la personne bouge dans la pièce. » Couper une image plus
 * large que le film (le 4:3 de la caméra, ou le téléphone posé en paysage) pour
 * remplir le 9:16, c'était perdre les côtés de la pièce — et lui, quand il y
 * passe. L'image entière tient donc dans la largeur du film ; au-dessus et en
 * dessous, la même image, floue et assombrie. Une image déjà aussi haute que le
 * film le remplit, comme avant. `z` : le lent zoom avant des moments — pour
 * celle-là seulement : sur un plan large, il rognait de nouveau les bords.
 */
function dessinerLarge(g: CanvasRenderingContext2D, img: CanvasImageSource, iw: number, ih: number, z = 1) {
  if (!iw || !ih || iw / ih <= (W / H) * 1.12) {
    couvrirImage(g, img, iw, ih, { z, fy: 0.5 });
    return;
  }
  fondFlou ??= nouvelleToile(36, 64);
  const fg = fondFlou.getContext("2d")!;
  couvrirImage(fg, img, iw, ih, { w: 36, h: 64, fy: 0.5 });
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(fondFlou, 0, 0, W, H);
  g.fillStyle = "rgba(14,9,7,.5)";
  g.fillRect(0, 0, W, H);
  const s = W / iw;
  const dw = iw * s;
  const dh = ih * s;
  // UN PEU AU-DESSUS DU MILIEU : les pastilles du bas (l'heure, la vitesse) restent sur le flou
  g.drawImage(img, (W - dw) / 2, (H - dh) / 2 - H * 0.03, dw, dh);
  g.restore();
}

/** Un lecteur prêt à l'endroit voulu : chargé, et calé sur `depuis` (une seconde et demie au plus pour chercher). */
async function preparerLecteur(blob: Blob, depuis: number): Promise<Lecteur> {
  const url = URL.createObjectURL(blob);
  const v = await lecteurMuet(url);
  if (depuis > 0.05) {
    await new Promise<void>((ok) => {
      const t = setTimeout(ok, 1500);
      v.addEventListener(
        "seeked",
        () => {
          clearTimeout(t);
          ok();
        },
        { once: true },
      );
      try {
        v.currentTime = depuis;
      } catch {
        clearTimeout(t);
        ok();
      }
    });
  }
  return { v, url };
}

function rendre(l: Lecteur | undefined) {
  if (!l) return;
  try {
    l.v.pause();
    l.v.removeAttribute("src");
    l.v.load();
    l.v.remove();
  } catch {
    /* déjà parti */
  }
  URL.revokeObjectURL(l.url);
}

/** Une pastille sombre aux bords ronds : l'heure de la session, la vitesse de l'accéléré. */
function pastille(g: CanvasRenderingContext2D, p: Polices, mot: string, x: number, y: number, a: number, droite = false) {
  if (a <= 0) return;
  g.save();
  g.globalAlpha = borne(a);
  g.font = `800 26px ${p.texte}`;
  const w = g.measureText(mot).width + 34;
  const gx = droite ? x - w : x;
  rectArrondi(g, gx, y - 34, w, 48, 24);
  g.fillStyle = "rgba(20,12,9,.72)";
  g.fill();
  texte(g, mot, gx + 17, y - 1, `800 26px ${p.texte}`, CREME, {});
  g.restore();
}

/** Sa légende : un mot qui arrive en sautant au milieu de l'image (« C'est parti ! »). */
function legende(g: CanvasRenderingContext2D, p: Polices, mot: string, u: number, duree: number) {
  if (u < 0 || u > duree) return;
  const a = Math.min(1, u / 0.18, (duree - u) / 0.25);
  const s = 0.86 + 0.14 * sortie(u / 0.3);
  g.save();
  g.globalAlpha = borne(a);
  g.translate(W / 2, 980);
  g.scale(s, s);
  g.font = `900 50px ${p.texte}`;
  const w = g.measureText(mot).width + 56;
  rectArrondi(g, -w / 2, -52, w, 76, 38);
  g.fillStyle = ROSE;
  g.fill();
  texte(g, mot, 0, 4, `900 50px ${p.texte}`, "#fff", { align: "center" });
  g.restore();
}

export async function monterEpisode(o: {
  ctx: AudioContext;
  toile: HTMLCanvasElement;
  tournage: Tournage;
  genre: GenreMontage;
  commerce: string;
  ville: string;
  produit: string;
  prix: string;
  saison: number;
  numero: number;
  /** Son fantôme (repos, puis bouche ouverte) : il prend place dans le tampon de la fin. */
  fantome: string[];
  /** Le son de l'atelier sous la musique — sinon, la musique seule (une radio dans l'atelier, et le film serait bloqué sur les réseaux). */
  sonAtelier: boolean;
  surProgres?: (p: number) => void;
  surEtape?: (mot: string) => void;
  signal?: AbortSignal;
}): Promise<Film> {
  const { ctx, tournage } = o;
  const c2d = o.toile.getContext("2d");
  if (!c2d) throw new Error("Ce téléphone ne sait pas dessiner la vidéo.");
  if (typeof o.toile.captureStream !== "function") throw new Error("Ce téléphone ne sait pas enregistrer un dessin animé (captureStream).");
  o.toile.width = W;
  o.toile.height = H;
  if (ctx.state !== "running") await ctx.resume().catch(() => {});

  /* ─── le plan, et ce qu'il faut préparer ─── */
  const plan = planDuMontage({ morceaux: tournage.morceaux, images: tournage.images.map((i) => i.t), session: tournage.duree, genre: o.genre });
  if (plan.length < 3) throw new Error("La session est trop courte pour un épisode.");
  const longueur = (b: Bloc) => b.duree + (b.genre === "revelation" ? b.tenue : 0);
  const debuts: number[] = [];
  let cumul = 0;
  for (const b of plan) {
    debuts.push(cumul);
    cumul += longueur(b);
  }
  const TOTAL = cumul;
  o.surEtape?.("Je prépare la musique et ton fantôme…");
  const el = await chargerElements(ctx, o.fantome, [], "table");
  const P: Polices = { affiche: el.police.affiche, texte: el.police.bulle, serif: el.police.enseigne };

  // LE SON DE SES GESTES : décodé avant, pour partir à l'instant exact de son moment
  const sons = new Map<number, AudioBuffer>();
  if (o.sonAtelier) {
    const ks = [...new Set(plan.flatMap((b) => (b.genre === "moment" || b.genre === "revelation" ? [b.k] : [])))];
    for (let i = 0; i < ks.length; i++) {
      if (o.signal?.aborted) throw new Error("Montage interrompu.");
      o.surEtape?.(`J’écoute tes gestes… ${i + 1}/${ks.length}`);
      try {
        sons.set(ks[i], await ctx.decodeAudioData(await tournage.morceaux[ks[i]].blob.arrayBuffer()));
      } catch {
        /* ce morceau passera sur la musique seule */
      }
    }
  }

  // LES IMAGES DE L'ACCÉLÉRÉ : décodées juste avant leur bloc, rendues juste après
  const imgs = tournage.images;
  const bitmaps = new Map<number, ImageBitmap | null>();
  const demander = (i: number) => {
    if (i < 0 || i >= imgs.length || bitmaps.has(i)) return Promise.resolve();
    bitmaps.set(i, null);
    return createImageBitmap(imgs[i].blob)
      .then((b) => void bitmaps.set(i, b))
      .catch(() => void bitmaps.delete(i));
  };
  const indicesDe = (b: Bloc) => (b.genre === "accelere" ? imgs.map((im, i) => (im.t > b.de && im.t < b.a ? i : -1)).filter((i) => i >= 0) : []);
  const indices = plan.map(indicesDe);

  // LA DERNIÈRE IMAGE : le fond du titre, et la carte de fin si la révélation n'a pas pu se lire
  const photoFin = nouvelleToile(W, H);
  const pf = photoFin.getContext("2d")!;
  pf.fillStyle = "#140C09";
  pf.fillRect(0, 0, W, H);
  if (imgs.length) {
    await demander(imgs.length - 1);
    const b = bitmaps.get(imgs.length - 1);
    if (b) dessinerLarge(pf, b, b.width, b.height);
  }
  const fondTitre = flouter(photoFin, W, H);
  const vignette = fabriquerVignette();
  const grain = fabriquerGrain();

  // LES LECTEURS : un bloc à l'avance
  const lecteurs = new Map<number, Promise<Lecteur | null>>();
  const prets = new Map<number, Lecteur>();
  const preparer = (i: number) => {
    const b = plan[i];
    if (!b || lecteurs.has(i)) return;
    if (b.genre === "accelere") {
      void Promise.all(indices[i].map(demander));
      lecteurs.set(i, Promise.resolve(null));
      return;
    }
    if (b.genre !== "moment" && b.genre !== "revelation") return;
    const m = tournage.morceaux[b.k];
    const p = preparerLecteur(m.blob, b.depuis)
      .then((l) => {
        prets.set(i, l);
        return l;
      })
      .catch(() => null);
    lecteurs.set(i, p);
  };
  o.surEtape?.("J’installe les premiers moments…");
  preparer(1);
  preparer(2);
  await Promise.race([Promise.all([lecteurs.get(1), lecteurs.get(2)]), new Promise((ok) => setTimeout(ok, 4000))]);

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
  const rec = new MediaRecorder(flux, { ...(format ? { mimeType: format } : {}), videoBitsPerSecond: debitDuMontage(TOTAL), audioBitsPerSecond: DEBIT_SON });
  const morceauxVideo: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size) morceauxVideo.push(e.data);
  };
  const arrete = new Promise<void>((ok) => (rec.onstop = () => ok()));

  /* ─── ce qu'on voit ─── */
  const NOM = o.commerce.trim();
  const EMISSION = `SAISON ${o.saison} · ÉPISODE ${o.numero}`;
  const nomCadre = o.ville.trim() ? `${NOM} · ${o.ville.trim()}` : NOM;
  const bande = o.genre === "bande";
  const titre: Titre = {
    fond: fondTitre,
    nom: NOM,
    haut: [o.ville.trim(), "AUJOURD’HUI"].filter(Boolean).join(" · ").toLocaleUpperCase("fr-FR"),
    bas: [bande ? `épisode ${o.numero} · la bande-annonce` : `épisode ${o.numero}`, o.produit.trim()],
    emission: EMISSION,
  };
  const tampon = `${NOM.toLocaleUpperCase("fr-FR")} · ÉPISODE ${o.numero} · `;
  let fin: Fin | null = null;
  const finDe = (): Fin => ({
    fond: flouter(photoFin, W, H),
    photo: { src: photoFin, w: W, h: H },
    legende: o.produit.trim(),
    entete: EMISSION,
    plat: enDeuxLignes(o.produit.trim(), 16),
    prix: o.prix.trim(),
    infos: o.ville.trim(),
    bouton: bande ? "L’épisode entier sur" : "À découvrir sur",
    logo: el.logo,
    tampon: tampon.length <= 40 ? tampon : `ÉPISODE ${o.numero} · CLIKME · `,
    mention: "",
  });
  const ghost = el.chef[0] ?? el.reporter[0];

  /* ─── les sons, posés une fois ─── */
  c2d.fillStyle = "#000";
  c2d.fillRect(0, 0, W, H);
  rec.start(1000);
  const T0 = ctx.currentTime + 0.15;
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
  plan.forEach((b, i) => {
    const t0 = T0 + debuts[i];
    if (b.genre === "accelere") niveau(t0, MUSIQUE.accelere, 0.3);
    if (b.genre === "moment" || b.genre === "revelation") {
      const son = sons.get(b.k);
      niveau(t0, son ? MUSIQUE.sousAtelier : b.genre === "revelation" ? MUSIQUE.revelation : MUSIQUE.moment, 0.3);
      if (son) {
        const s = ctx.createBufferSource();
        s.buffer = son;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(0.9, t0 + 0.12);
        g.gain.setValueAtTime(0.9, t0 + b.duree - 0.15);
        g.gain.linearRampToValueAtTime(0, t0 + b.duree);
        s.connect(g);
        g.connect(bus);
        s.start(t0, Math.min(b.depuis, Math.max(0, son.duration - 0.1)), b.duree + 0.05);
        sources.push(s);
      }
    }
    if (b.genre === "revelation") {
      sonZoom(S, t0);
      niveau(t0 + b.duree, MUSIQUE.pleine, 0.2);
      sonFrappe(S, t0 + b.duree);
      if (o.prix.trim()) sonFrappe(S, t0 + b.duree + 1.1);
    }
    if (b.genre === "fin") {
      niveau(t0, MUSIQUE.pleine, 0.2);
      sonClic(S, t0);
      for (const d of [0.55, 0.68, 0.82, 0.95, 1.25]) sonTic(S, t0 + d);
      sonTampon(S, t0 + 1.0);
      sonSignature(S, t0 + SIGNATURE);
      niveau(t0 + SIGNATURE + 0.2, 0.0001, 2.4);
    }
  });

  /* ─── la boucle : l'horloge du son mène, l'image suit ─── */
  let affiche = "";
  let erreur: Error | null = null;
  let courant = -1;
  let derniereImage: ImageBitmap | null = null;
  /** Les moments dont la lecture est lancée : un lecteur prêt en retard part dès qu'il arrive. */
  const lances = new Set<number>();
  const lancer = (i: number, l: Lecteur | undefined) => {
    if (!l || lances.has(i)) return;
    lances.add(i);
    l.v.play().catch(() => {});
  };
  const entrer = (i: number) => {
    courant = i;
    // CE QUI EST PASSÉ S'EN VA : ses lecteurs, ses images
    for (const [k, l] of prets) {
      if (k < i) {
        rendre(l);
        prets.delete(k);
      }
    }
    const garder = new Set([...(indices[i] ?? []), ...(indices[i + 1] ?? []), imgs.length - 1]);
    for (const [k, b] of bitmaps) {
      if (b && !garder.has(k) && b !== derniereImage) {
        b.close();
        bitmaps.delete(k);
      }
    }
    preparer(i);
    preparer(i + 1);
    preparer(i + 2);
    lancer(i, prets.get(i));
    if (plan[i].genre === "fin") fin = finDe();
  };
  await new Promise<void>((fini) => {
    const tic = () => {
      if (o.signal?.aborted) {
        erreur = new Error("Montage interrompu.");
        return fini();
      }
      const t = ctx.currentTime - T0;
      if (t >= TOTAL) return fini();
      let i = Math.max(0, courant);
      while (i + 1 < plan.length && t >= debuts[i + 1]) i++;
      if (i !== courant) entrer(i);
      const b = plan[i];
      const u = t - debuts[i];
      const corps = t - debuts[1];
      if (b.genre === "titre") {
        const v = u - CLIC;
        if (v < 0) {
          c2d.fillStyle = "#000";
          c2d.fillRect(0, 0, W, H);
        } else dessinerTitre(c2d, P, titre, v);
        eclairDuClic(c2d, v);
        if (!affiche && t >= 2.4) {
          try {
            affiche = o.toile.toDataURL("image/jpeg", 0.82);
          } catch {
            affiche = "";
          }
        }
      } else if (b.genre === "accelere") {
        const l = indices[i];
        const prog = borne(u / b.duree);
        const k = l[Math.min(l.length - 1, Math.floor(prog * l.length))];
        const img = bitmaps.get(k) ?? derniereImage;
        if (img) {
          derniereImage = img;
          dessinerLarge(c2d, img, img.width, img.height, 1.02);
        } else c2d.drawImage(fondTitre, 0, 0);
        c2d.drawImage(vignette, 0, 0);
        dessinerCadre(c2d, P, corps, nomCadre, EMISSION);
        pastille(c2d, P, `⏩ ×${b.vitesse}`, W - 56, 1158, Math.min(1, u / 0.15), true);
        pastille(c2d, P, `⏱ ${enDuree(b.de + (b.a - b.de) * prog)}`, 56, 1158, 1);
      } else if (b.genre === "moment" || b.genre === "revelation") {
        const l = prets.get(i);
        const enVideo = b.genre === "moment" || u < b.duree;
        const prog = borne(u / b.duree);
        if (enVideo) lancer(i, l);
        if (enVideo && l && l.v.readyState >= 2 && l.v.videoWidth) {
          dessinerLarge(c2d, l.v, l.v.videoWidth, l.v.videoHeight, 1.02 + 0.05 * prog);
          // LA RÉVÉLATION : sa dernière image devient la photo de la carte de fin
          if (b.genre === "revelation") dessinerLarge(pf, l.v, l.v.videoWidth, l.v.videoHeight);
        } else if (!enVideo) {
          // TENUE : le produit fini, qui avance doucement vers nous
          const v = u - b.duree;
          c2d.save();
          c2d.translate(W / 2, H / 2);
          const z = 1.04 + 0.05 * (v / b.tenue);
          c2d.scale(z, z);
          c2d.drawImage(photoFin, -W / 2, -H / 2);
          c2d.restore();
        } else if (derniereImage) dessinerLarge(c2d, derniereImage, derniereImage.width, derniereImage.height);
        else c2d.drawImage(fondTitre, 0, 0);
        c2d.drawImage(vignette, 0, 0);
        dessinerCadre(c2d, P, corps, nomCadre, EMISSION);
        if (b.genre === "moment") {
          pastille(c2d, P, `⏱ ${enDuree(b.heure)}`, 56, 1158, Math.min(1, u / 0.2));
          if (b.legende) legende(c2d, P, b.legende, u - 0.2, Math.min(2.4, b.duree - 0.3));
        } else if (!enVideo) {
          const v = u - b.duree;
          dessinerFrappe(c2d, P, "Le voilà", v, 1.1, H * 0.36);
          if (o.prix.trim()) dessinerFrappe(c2d, P, o.prix.trim(), v - 1.1, b.tenue - 1.1, H * 0.52);
          const a = sortie((v - 0.5) / 0.4);
          if (a > 0) {
            c2d.save();
            c2d.globalAlpha = a;
            // UN NOM LONG (« Magret grillé, pommes sarladaises ») RAPETISSE pour tenir entre les bords
            c2d.font = `italic 600 52px ${P.serif}`;
            const corpsNom = Math.max(30, Math.min(52, Math.floor((52 * (W - 120)) / Math.max(1, c2d.measureText(o.produit.trim()).width))));
            texte(c2d, o.produit.trim(), W / 2, 1070, `italic 600 ${corpsNom}px ${P.serif}`, CREME, { align: "center", ombre: 3 });
            c2d.restore();
          }
        }
      } else if (b.genre === "fin") {
        const f = fin ?? (fin = finDe());
        dessinerFin(
          c2d,
          P,
          f,
          u,
          u,
          SIGNATURE,
          (cx, cy, r) => {
            const w = 2.5 * r;
            const h = (ghost.height * w) / Math.max(1, ghost.width);
            c2d.drawImage(ghost, cx - w / 2, cy - r * 0.78, w, h);
          },
          null,
        );
        eclairDuClic(c2d, u);
        const a = borne((u - (b.duree - 0.45)) / 0.45);
        if (a > 0) {
          c2d.fillStyle = `rgba(0,0,0,${a})`;
          c2d.fillRect(0, 0, W, H);
        }
      }
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
  for (const l of prets.values()) rendre(l);
  for (const p of lecteurs.values()) void p.then((l) => l && rendre(l));
  for (const b of bitmaps.values()) b?.close();
  bus.disconnect();
  limite.disconnect();
  musique.disconnect();
  salle.disconnect();
  flux.getTracks().forEach((t) => t.stop());
  if (erreur) throw erreur;
  const type = rec.mimeType || format || "video/webm";
  return { blob: new Blob(morceauxVideo, { type }), type, duree: ctx.currentTime - T0, affiche };
}
