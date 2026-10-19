/**
 * 🎬 LA SESSION D'UN ÉPISODE — le téléphone posé, la caméra qui tourne.
 *
 * Un enregistreur par MORCEAU (`MORCEAU_S` secondes) : chaque morceau est un
 * fichier entier, que le montage lit sans jamais chercher dedans — c'est ce que
 * les téléphones font le moins bien (l'interview fait de même, une prise par
 * question). Pendant qu'il tourne, quatre fois par seconde, une image minuscule
 * dit ce qui bouge et la lumière, le micro dit ce qui s'entend : la note du
 * morceau (`noter`). La réserve (`Reserve`) garde les meilleurs, répartis sur
 * toute la session, et lâche les autres. À côté, une image de temps en temps
 * pour les accélérés (`Accelere`).
 *
 * SI LA CAMÉRA S'ARRÊTE (un appel, une autre application : l'iPhone la coupe),
 * la session le dit (`coupee`) et repart avec la caméra qu'on lui redonne
 * (`changerFlux`) — ce qui a été gardé reste.
 *
 * FICHIER NAVIGATEUR.
 */
import { formatVideo } from "@/lib/direct/interview-montage";
import { Accelere, MORCEAU_S, Reserve, mesurer, mesuresVides, noter, type Mesures, type MorceauNote } from "@/lib/direct/episode";

export type MorceauFilme = MorceauNote & { blob: Blob; type: string };
export type ImageFilmee = { t: number; blob: Blob };
export type Tournage = { morceaux: MorceauFilme[]; images: ImageFilmee[]; duree: number; type: string };

export type EtatSession = {
  /** Les secondes de session. */
  ecoule: number;
  gardes: number;
  images: number;
  /** Ce qui bouge en ce moment, de 0 à 1 — pour la petite jauge. */
  activite: number;
  /** La caméra s'est arrêtée : il faut la redonner. */
  coupee: boolean;
  /** Ce que la session garde en mémoire, en mégaoctets. */
  poids: number;
};

/** L'image des accélérés : 9:16, assez grande pour un écran de téléphone, légère. */
const IMAGE = { w: 450, h: 800, qualite: 0.72 };
/** L'image minuscule qui mesure le mouvement. */
const SONDE = { w: 32, h: 56 };
const DEBIT_MORCEAU = 2_000_000;

const attendre = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));

/** Une image de la vidéo, recadrée en 9:16 comme le film. */
function cadrer(g: CanvasRenderingContext2D, v: HTMLVideoElement, w: number, h: number) {
  const vw = v.videoWidth;
  const vh = v.videoHeight;
  if (!vw || !vh) return false;
  const s = Math.max(w / vw, h / vh);
  g.drawImage(v, (w - vw * s) / 2, (h - vh * s) / 2, vw * s, vh * s);
  return true;
}

export class SessionEpisode {
  private flux: MediaStream;
  private readonly video: HTMLVideoElement;
  private readonly surEtat: (e: EtatSession) => void;
  private readonly reserve: Reserve<MorceauFilme>;
  private readonly accelere = new Accelere<ImageFilmee>();
  private readonly type = formatVideo();
  private t0 = 0;
  private enCours = false;
  private reveil: (() => void) | null = null;
  private boucle: Promise<void> | null = null;
  private mesures: Mesures = mesuresVides();
  private minuterie: ReturnType<typeof setInterval> | null = null;
  private precedente: Uint8ClampedArray | null = null;
  private activite = 0;
  private coupee = false;
  private n = 0;
  private poids = 0;
  private son: { ctx: AudioContext; analyseur: AnalyserNode; source: MediaStreamAudioSourceNode; tampon: Float32Array<ArrayBuffer> } | null = null;
  private readonly sonde: CanvasRenderingContext2D | null;
  private readonly image: HTMLCanvasElement;

  constructor(o: { video: HTMLVideoElement; flux: MediaStream; surEtat: (e: EtatSession) => void }) {
    this.video = o.video;
    this.flux = o.flux;
    this.surEtat = o.surEtat;
    this.reserve = new Reserve<MorceauFilme>(undefined, (m) => {
      this.poids -= m.blob.size;
    });
    const s = document.createElement("canvas");
    s.width = SONDE.w;
    s.height = SONDE.h;
    this.sonde = s.getContext("2d", { willReadFrequently: true });
    this.image = document.createElement("canvas");
    this.image.width = IMAGE.w;
    this.image.height = IMAGE.h;
  }

  /** À appeler dans le geste du doigt (« Démarrer la session ») : le micro s'écoute à partir de là. */
  demarrer() {
    if (this.enCours) return;
    this.enCours = true;
    this.t0 = performance.now();
    this.ecouter();
    this.minuterie = setInterval(() => this.mesurer(), 250);
    this.boucle = this.tourner();
  }

  /** La caméra qu'on lui redonne après une coupure. */
  changerFlux(flux: MediaStream) {
    this.flux = flux;
    this.coupee = false;
    this.ecouter();
    this.reveil?.();
  }

  get ecoule() {
    return this.enCours ? (performance.now() - this.t0) / 1000 : 0;
  }

  /** « J'ai terminé » : le morceau en cours se ferme, et on rend ce qui a été gardé. */
  async terminer(): Promise<Tournage> {
    const duree = this.ecoule;
    this.enCours = false;
    this.reveil?.();
    if (this.minuterie) clearInterval(this.minuterie);
    await this.boucle;
    try {
      this.son?.source.disconnect();
      await this.son?.ctx.close();
    } catch {
      /* déjà fermé */
    }
    this.son = null;
    return { morceaux: this.reserve.liste(), images: this.accelere.images, duree, type: this.type || "video/webm" };
  }

  private ecouter() {
    try {
      this.son?.source.disconnect();
      if (!this.flux.getAudioTracks().length) return;
      const ctx = this.son?.ctx ?? new AudioContext();
      void ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(this.flux);
      const analyseur = ctx.createAnalyser();
      analyseur.fftSize = 1024;
      source.connect(analyseur);
      this.son = { ctx, analyseur, source, tampon: new Float32Array(analyseur.fftSize) };
    } catch {
      this.son = null;
    }
  }

  /** Un morceau après l'autre, tant que la session tourne. */
  private async tourner() {
    while (this.enCours) {
      const flux = this.flux;
      if (this.coupee || !flux.getVideoTracks().some((t) => t.readyState === "live")) {
        this.coupee = true;
        this.signaler();
        await this.dormir(1000);
        continue;
      }
      let rec: MediaRecorder;
      try {
        rec = new MediaRecorder(flux, { ...(this.type ? { mimeType: this.type } : {}), videoBitsPerSecond: DEBIT_MORCEAU, audioBitsPerSecond: 96_000 });
      } catch {
        rec = new MediaRecorder(flux);
      }
      const bouts: Blob[] = [];
      const type = rec.mimeType || this.type || "video/webm";
      const ferme = new Promise<Blob>((ok) => {
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size) bouts.push(e.data);
        };
        rec.onstop = () => ok(new Blob(bouts, { type }));
      });
      const debut = this.ecoule;
      this.mesures = mesuresVides();
      try {
        rec.start();
      } catch {
        await this.dormir(500);
        continue;
      }
      await this.dormir(MORCEAU_S * 1000);
      const mesures = this.mesures;
      try {
        if (rec.state !== "inactive") rec.stop();
      } catch {
        /* déjà arrêté */
      }
      // L'IPHONE PEUT TARDER À RENDRE LE FICHIER : trois secondes au plus, puis ce qu'on a.
      const blob = await Promise.race([ferme, attendre(3000).then(() => new Blob(bouts, { type }))]);
      const fin = this.enCours ? this.ecoule : debut + Math.max(0, (performance.now() - this.t0) / 1000 - debut);
      const duree = Math.max(0, fin - debut);
      if (blob.size > 2000 && duree >= 1.5) {
        this.poids += blob.size;
        this.reserve.ajouter({ n: this.n++, debut, duree, score: noter(mesures), blob, type });
      }
      this.signaler();
    }
  }

  /** Attendre, ou se réveiller tout de suite si la session s'arrête ou que la caméra revient. */
  private dormir(ms: number) {
    return new Promise<void>((ok) => {
      const t = setTimeout(() => {
        this.reveil = null;
        ok();
      }, ms);
      this.reveil = () => {
        clearTimeout(t);
        this.reveil = null;
        ok();
      };
    });
  }

  /** Quatre fois par seconde : ce qui bouge, la lumière, le son ; et l'image de l'accéléré quand c'est l'heure. */
  private mesurer() {
    const v = this.video;
    const g = this.sonde;
    if (!this.flux.getVideoTracks().some((t) => t.readyState === "live")) {
      if (!this.coupee) {
        this.coupee = true;
        this.signaler();
      }
      return;
    }
    if (!g || v.readyState < 2) return;
    try {
      if (!cadrer(g, v, SONDE.w, SONDE.h)) return;
      const d = g.getImageData(0, 0, SONDE.w, SONDE.h).data;
      let lum = 0;
      let diff = 0;
      const p = this.precedente;
      const l = new Uint8ClampedArray(SONDE.w * SONDE.h);
      for (let i = 0, j = 0; i < d.length; i += 4, j++) {
        l[j] = (d[i] * 3 + d[i + 1] * 6 + d[i + 2]) / 10;
        lum += l[j];
        if (p) diff += Math.abs(l[j] - p[j]);
      }
      this.precedente = l;
      const mouvement = p ? diff / l.length : 0;
      let db = -90;
      if (this.son) {
        this.son.analyseur.getFloatTimeDomainData(this.son.tampon);
        let e = 0;
        for (const x of this.son.tampon) e += x * x;
        db = 10 * Math.log10(e / this.son.tampon.length + 1e-12);
      }
      this.mesures = mesurer(this.mesures, mouvement, lum / l.length, db);
      this.activite = this.activite * 0.7 + Math.min(1, mouvement / 10) * 0.3;
    } catch {
      return;
    }
    const t = this.ecoule;
    if (this.accelere.aPrendre(t)) {
      const ig = this.image.getContext("2d");
      if (ig && cadrer(ig, v, IMAGE.w, IMAGE.h)) {
        this.image.toBlob((b) => b && this.accelere.ajouter({ t, blob: b }), "image/jpeg", IMAGE.qualite);
      }
    }
    this.signaler();
  }

  private signaler() {
    this.surEtat({
      ecoule: this.ecoule,
      gardes: this.reserve.nombre,
      images: this.accelere.images.length,
      activite: this.activite,
      coupee: this.coupee,
      poids: Math.round((this.poids + this.accelere.images.reduce((s, i) => s + i.blob.size, 0)) / 1e5) / 10,
    });
  }
}
