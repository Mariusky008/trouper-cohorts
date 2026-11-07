"use client";

/**
 * 😐 LE CONCOURS DE REGARD (le prototype du duel du jour, 7 novembre 2026) — voir `lib/direct/duel-regard.ts` pour la règle.
 *
 * Sa figurine (son compte) contre Pablito. Il pose le doigt : 3, 2, 1… puis il tient. Une mouche : il glisse son doigt
 * pour la chasser ; Pablito louche : il ne bouge pas. La jauge de fou rire monte ; à 100, sa figurine éclate de rire.
 * Il tient plus longtemps que Pablito : c'est Pablito qui craque. À la fin, le polaroïd : les deux figurines au moment
 * de la chute, une phrase (il peut la changer), le score entre eux ; « 📲 Envoyer », « 🔁 Revanche ».
 *
 * Les sons sont fabriqués ici (un bourdon, un « boing », un « pfff ») : des bruits, jamais une voix.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { BOUGE_MAX, GLISSE_MIN, JAUGE, LEGENDE_MAX, legende, programme, resistance, secondes, tempsDuJour, type Distraction } from "@/lib/direct/duel-regard";
import { IMAGES_DEMO } from "@/lib/direct/ma-figurine";
import { NOM_GUIDE, imageVisage } from "@/lib/direct/guide";

type Fig = { nom: string; neutre: string; joie: string; rire: string; grimace: string };
type Phase = "charge" | "accueil" | "compte" | "jeu" | "fin";
type Fin = { gagne: boolean; tMoi: number; lache: boolean };
type Retour = { texte: string; bon: boolean; le: number };

const CLE_SCORE = "clikme-duel-regard-v1";
const ATTENTE = 3;
const jourParis = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const jourCourt = () => new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

/** Une image (même d'un autre site : ses adresses signées), rapatriée en `blob:` — le polaroïd reste dessinable. */
async function charger(url: string): Promise<string> {
  const r = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!r.ok) throw new Error(String(r.status));
  const u = URL.createObjectURL(await r.blob());
  const i = new Image();
  i.src = u;
  await i.decode();
  return u;
}

function lireScore(): { moi: number; autre: number; dernier?: "moi" | "autre" } {
  try {
    const x = JSON.parse(window.localStorage.getItem(CLE_SCORE) ?? "null") as { moi?: number; autre?: number; dernier?: "moi" | "autre" } | null;
    return { moi: Number(x?.moi) || 0, autre: Number(x?.autre) || 0, ...(x?.dernier ? { dernier: x.dernier } : {}) };
  } catch {
    return { moi: 0, autre: 0 };
  }
}

// ─── les sons : des bruits fabriqués ici, jamais une voix ─────────────────────────────────────────
class Sons {
  ctx: AudioContext | null = null;
  private sortie: GainNode | null = null;
  private bourdon: { o: OscillatorNode[]; g: GainNode } | null = null;
  private mouche: { o: OscillatorNode; g: GainNode } | null = null;
  private coeur = 0;
  ouvrir() {
    if (this.ctx) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    void this.ctx.resume().catch(() => undefined);
    this.sortie = this.ctx.createGain();
    this.sortie.gain.value = 0.7;
    this.sortie.connect(this.ctx.destination);
  }
  private bip(f: number, f2: number, duree: number, type: OscillatorType = "sine", volume = 0.3) {
    const c = this.ctx;
    if (!c || !this.sortie) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), c.currentTime + duree);
    g.gain.setValueAtTime(volume, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duree);
    o.connect(g).connect(this.sortie);
    o.start();
    o.stop(c.currentTime + duree + 0.02);
  }
  decompte(dernier: boolean) {
    this.bip(dernier ? 880 : 520, dernier ? 880 : 520, dernier ? 0.35 : 0.15, "square", 0.12);
  }
  /** La tension : un bourdon grave qui monte, et un cœur qui bat de plus en plus vite. */
  tension(t: number) {
    const c = this.ctx;
    if (!c || !this.sortie) return;
    if (!this.bourdon) {
      const g = c.createGain();
      g.gain.value = 0.0001;
      g.connect(this.sortie);
      const o = [55, 82.4].map((f) => {
        const x = c.createOscillator();
        x.type = "triangle";
        x.frequency.value = f;
        x.connect(g);
        x.start();
        return x;
      });
      this.bourdon = { o, g };
    }
    const k = Math.min(1, t / 20);
    this.bourdon.g.gain.setTargetAtTime(0.06 + 0.1 * k, c.currentTime, 0.3);
    this.bourdon.o.forEach((x, i) => x.frequency.setTargetAtTime((i ? 82.4 : 55) * (1 + 0.5 * k), c.currentTime, 0.5));
    const periode = 0.85 - 0.4 * k;
    if (c.currentTime - this.coeur > periode) {
      this.coeur = c.currentTime;
      this.bip(70, 40, 0.16, "sine", 0.5);
    }
  }
  bzz(on: boolean) {
    const c = this.ctx;
    if (!c || !this.sortie) return;
    if (on && !this.mouche) {
      const o = c.createOscillator();
      const lfo = c.createOscillator();
      const lg = c.createGain();
      const g = c.createGain();
      o.type = "sawtooth";
      o.frequency.value = 210;
      lfo.frequency.value = 23;
      lg.gain.value = 40;
      lfo.connect(lg).connect(o.frequency);
      g.gain.value = 0.035;
      o.connect(g).connect(this.sortie);
      o.start();
      lfo.start();
      o.onended = () => lfo.stop();
      this.mouche = { o, g };
    } else if (!on && this.mouche) {
      this.mouche.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.05);
      this.mouche.o.stop(c.currentTime + 0.2);
      this.mouche = null;
    }
  }
  boing() {
    this.bip(320, 110, 0.45, "sine", 0.35);
  }
  bien() {
    this.bip(660, 990, 0.14, "triangle", 0.18);
  }
  /** Le fou rire : un « pfff » (un souffle), puis trois notes qui dégringolent. */
  pfff() {
    const c = this.ctx;
    if (!c || !this.sortie) return;
    const n = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    s.buffer = n;
    f.type = "bandpass";
    f.frequency.value = 1200;
    g.gain.value = 0.5;
    s.connect(f).connect(g).connect(this.sortie);
    s.start();
    [523, 392, 262].forEach((x, k) => window.setTimeout(() => this.bip(x, x * 0.97, 0.22, "square", 0.1), 380 + k * 170));
  }
  victoire() {
    [523, 659, 784, 1047].forEach((x, k) => window.setTimeout(() => this.bip(x, x, 0.2, "triangle", 0.2), k * 130));
  }
  taire() {
    this.bzz(false);
    if (this.bourdon && this.ctx) {
      const c = this.ctx;
      this.bourdon.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.08);
      const o = this.bourdon.o;
      window.setTimeout(() => o.forEach((x) => x.stop()), 400);
      this.bourdon = null;
    }
  }
}

// ─── le polaroïd ───────────────────────────────────────────────────────────────────────────────
const W = 1080;
const H = 1350;
function couvrir(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const r = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / r;
  const sh = h / r;
  // (le haut de l'image d'abord : c'est là qu'est le visage)
  g.drawImage(img, (img.naturalWidth - sw) / 2, Math.max(0, (img.naturalHeight - sh) * 0.25), sw, sh, x, y, w, h);
}
function lignes(g: CanvasRenderingContext2D, texte: string, largeur: number): string[] {
  const mots = texte.split(/\s+/).filter(Boolean);
  const l: string[] = [];
  let cur = "";
  for (const m of mots) {
    const essai = cur ? `${cur} ${m}` : m;
    if (g.measureText(essai).width > largeur && cur) {
      l.push(cur);
      cur = m;
    } else cur = essai;
  }
  if (cur) l.push(cur);
  return l;
}
async function image(u: string): Promise<HTMLImageElement> {
  const i = new Image();
  i.src = u;
  await i.decode();
  return i;
}
async function dessinerPolaroid(o: { gauche: string; droite: string; nomG: string; nomD: string; gagneG: boolean; phrase: string; score: string }): Promise<Blob | null> {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;
  const css = getComputedStyle(document.body);
  const main = css.getPropertyValue("--font-main-levee").trim() || "cursive";
  const texte = css.getPropertyValue("--font-clikme").trim() || "system-ui, sans-serif";
  await Promise.all([document.fonts.load(`700 64px ${main}`), document.fonts.load(`800 30px ${texte}`)]).catch(() => undefined);
  const [ig, id] = await Promise.all([image(o.gauche), image(o.droite)]);
  // le papier
  g.fillStyle = "#FBF8F1";
  g.fillRect(0, 0, W, H);
  // la photo : les deux figurines, côte à côte, au moment de la chute
  const P = 60;
  const T = 960;
  g.save();
  g.beginPath();
  g.rect(P, P, T, T);
  g.clip();
  const fond = g.createLinearGradient(0, P, 0, P + T);
  fond.addColorStop(0, "#FF2E9A");
  fond.addColorStop(1, "#5B1648");
  g.fillStyle = fond;
  g.fillRect(P, P, T, T);
  const demi = (T - 12) / 2;
  couvrir(g, ig, P, P, demi, T);
  couvrir(g, id, P + demi + 12, P, demi, T);
  g.fillStyle = "#FBF8F1";
  g.fillRect(P + demi, P, 12, T);
  // les noms, et qui a gagné
  g.font = `800 34px ${texte}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const [x, nom, gagne] of [
    [P + demi / 2, o.nomG, o.gagneG],
    [P + demi + 12 + demi / 2, o.nomD, !o.gagneG],
  ] as const) {
    const w = g.measureText(nom).width + 44;
    g.fillStyle = "rgba(18,6,15,.72)";
    g.beginPath();
    g.roundRect(x - w / 2, P + T - 84, w, 56, 28);
    g.fill();
    g.fillStyle = "#FFF4E6";
    g.fillText(nom, x, P + T - 55);
    g.font = "92px serif";
    g.fillText(gagne ? "👑" : "😂", x, P + 74);
    g.font = `800 34px ${texte}`;
  }
  // le score, au milieu
  g.fillStyle = "#F2C46B";
  g.beginPath();
  g.arc(P + T / 2, P + T - 150, 62, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#2A0F1F";
  g.font = `900 40px ${texte}`;
  g.fillText(o.score, P + T / 2, P + T - 148);
  g.restore();
  // la phrase, à la main
  g.fillStyle = "#23202A";
  g.font = `700 64px ${main}`;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  const l = lignes(g, `« ${o.phrase} »`, W - 140).slice(0, 2);
  l.forEach((x, k) => g.fillText(x, W / 2, P + T + 108 + k * 70 - (l.length - 1) * 22));
  // en bas : le duel, le jour
  g.fillStyle = "#7A7280";
  g.font = `700 28px ${texte}`;
  g.fillText(`😐 Concours de regard · ${jourCourt()} · ClikMe`, W / 2, H - 46);
  // (en JPEG : léger à envoyer — WhatsApp le recompresse de toute façon)
  return new Promise((ok) => c.toBlob((b) => ok(b), "image/jpeg", 0.9));
}

// ─── le duel ───────────────────────────────────────────────────────────────────────────────────
export function Duel() {
  const [phase, setPhase] = useState<Phase>("charge");
  const [moi, setMoi] = useState<Fig | null>(null);
  const [autre, setAutre] = useState<Fig | null>(null);
  const [aSaFigurine, setASaFigurine] = useState(true);
  const [humour, setHumour] = useState<number | null>(null);
  // (ce que l'écran montre : le temps, la jauge, le décompte, la distraction en cours et si elle est réglée)
  const [vue, setVue] = useState<{ t: number; jauge: number; compte: number; evt: Distraction["type"] | null; reglee: boolean }>({ t: 0, jauge: 0, compte: ATTENTE, evt: null, reglee: false });
  const [retour, setRetour] = useState<Retour | null>(null);
  const [fin, setFin] = useState<Fin | null>(null);
  const [score, setScore] = useState({ moi: 0, autre: 0 });
  const [phrase, setPhrase] = useState("");
  const [polaroid, setPolaroid] = useState<{ url: string; fichier: File } | null>(null);
  const [envoye, setEnvoye] = useState("");
  const [doigt, setDoigt] = useState<{ x: number; y: number } | null>(null);
  const [erreur, setErreur] = useState("");
  // (le temps de Pablito aujourd'hui : le même pour tout le monde)
  const [tAutre] = useState(() => tempsDuJour(jourParis()));
  const sons = useRef(new Sons());
  const scene = useRef<HTMLDivElement>(null);
  const partie = useRef({
    t0: 0,
    dernier: 0,
    prog: [] as Distraction[],
    jauge: 0,
    pos: { x: 0, y: 0 },
    // par distraction : le doigt au début, ce qu'il a fait (chassée, bougé), et si elle est réglée
    depart: new Map<number, { x: number; y: number }>(),
    reglee: new Set<number>(),
    max: new Map<number, number>(),
    id: -1,
    revanche: false,
  });

  // SES FIGURINES : la sienne (son compte), Pablito en face
  useEffect(() => {
    let fini = false;
    void (async () => {
      const [etat, carte] = await Promise.all([
        fetch("/api/direct/ma-figurine", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null) as Promise<{ etat?: { prenom?: string; neutre?: string; etape?: string; expressions?: Record<string, { n?: string }> } } | null>,
        fetch("/api/direct/personnage", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null) as Promise<{ carte?: { valeurs?: { humour?: number } } | null } | null>,
      ]);
      const e = etat?.etat;
      const sienne = e?.etape === "prete" && e.neutre ? e : null;
      const base = sienne?.neutre ?? "/direct/double/pied/salut-1.webp";
      const ex = (k: string) => sienne?.expressions?.[k]?.n || base;
      const essai = async (u: string, repli: string) => charger(u).catch(() => charger(repli));
      try {
        const [n, j, r, g] = await Promise.all([essai(base, base), essai(ex("joie"), base), essai(ex("rire"), base), essai(ex("grimace"), base)]);
        const [pn, pj, pr, pg] = await Promise.all([
          charger(IMAGES_DEMO.neutre),
          essai(imageVisage("joie", "n"), IMAGES_DEMO.neutre),
          essai(imageVisage("rire", "n"), IMAGES_DEMO.neutre),
          essai(imageVisage("louche", "n"), IMAGES_DEMO.neutre),
        ]);
        if (fini) return;
        setMoi({ nom: sienne?.prenom || "Toi", neutre: n, joie: j, rire: r, grimace: g });
        setAutre({ nom: NOM_GUIDE, neutre: pn, joie: pj, rire: pr, grimace: pg });
        setASaFigurine(Boolean(sienne));
        setHumour(typeof carte?.carte?.valeurs?.humour === "number" ? carte.carte.valeurs.humour : null);
        setScore(lireScore());
        setPhase("accueil");
      } catch {
        if (!fini) setErreur("Les figurines n’ont pas pu se charger. Réessaie dans un instant.");
      }
    })();
    return () => {
      fini = true;
    };
  }, []);

  const dire = useCallback((texte: string, bon: boolean) => setRetour({ texte, bon, le: performance.now() }), []);

  const terminer = useCallback(
    (f: Fin) => {
      const s = sons.current;
      s.taire();
      if (f.gagne) s.victoire();
      else s.pfff();
      if (navigator.vibrate) navigator.vibrate(f.gagne ? [40, 60, 40] : 220);
      const avant = lireScore();
      const p = partie.current;
      p.revanche = avant.dernier === "autre" && f.gagne;
      const apres = { moi: avant.moi + (f.gagne ? 1 : 0), autre: avant.autre + (f.gagne ? 0 : 1), dernier: f.gagne ? ("moi" as const) : ("autre" as const) };
      try {
        window.localStorage.setItem(CLE_SCORE, JSON.stringify(apres));
      } catch {
        /* rien */
      }
      setScore(apres);
      setFin(f);
      setPhrase(legende({ gagne: f.gagne, moi: moi?.nom ?? "Toi", autre: autre?.nom ?? NOM_GUIDE, tMoi: f.tMoi, tAutre: tAutre, revanche: p.revanche }));
      setPolaroid(null);
      setEnvoye("");
      setDoigt(null);
      setPhase("fin");
    },
    [moi, autre, tAutre],
  );

  // LA BOUCLE : le décompte, puis le duel (image par image)
  useEffect(() => {
    if (phase !== "compte" && phase !== "jeu") return;
    let raf = 0;
    const p = partie.current;
    const s = sons.current;
    let dernierChiffre = -1;
    const pas = () => {
      const maintenant = performance.now();
      if (phase === "compte") {
        const reste = ATTENTE - (maintenant - p.t0) / 1000;
        const chiffre = Math.ceil(reste);
        if (chiffre !== dernierChiffre && chiffre > 0) {
          dernierChiffre = chiffre;
          s.decompte(false);
        }
        if (reste <= 0) {
          s.decompte(true);
          p.t0 = maintenant;
          p.dernier = maintenant;
          setPhase("jeu");
          return;
        }
        setVue((v) => ({ ...v, compte: Math.max(1, chiffre) }));
        raf = requestAnimationFrame(pas);
        return;
      }
      const t = (maintenant - p.t0) / 1000;
      const dt = Math.min(0.1, (maintenant - p.dernier) / 1000);
      p.dernier = maintenant;
      const r = resistance(humour);
      p.jauge += JAUGE.tension(t) * dt * r;
      s.tension(t);
      // la distraction en cours, et celles qui viennent de finir
      const i = p.prog.findIndex((d) => t >= d.de && t < d.a);
      if (i !== p.id) {
        if (p.id >= 0 && p.prog[p.id]?.type === "mouche") s.bzz(false);
        if (i >= 0) {
          p.depart.set(i, { ...p.pos });
          p.max.set(i, 0);
          if (p.prog[i].type === "mouche") s.bzz(true);
          else s.boing();
        }
        p.id = i;
      }
      p.prog.forEach((d, k) => {
        if (t >= d.a && !p.reglee.has(k) && p.depart.has(k)) {
          p.reglee.add(k);
          if (d.type === "mouche") {
            p.jauge += JAUGE.mouche * r;
            dire("🪰 Ça chatouille !", false);
          } else {
            p.jauge += JAUGE.grimace * r;
            dire("✓ Impassible !", true);
          }
        }
      });
      if (p.jauge >= 100) return terminer({ gagne: false, tMoi: t, lache: false });
      if (t >= tAutre) return terminer({ gagne: true, tMoi: t, lache: false });
      setVue({ t, jauge: p.jauge, compte: 0, evt: i >= 0 ? p.prog[i].type : null, reglee: i >= 0 && p.reglee.has(i) });
      raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [phase, humour, terminer, dire, tAutre]);

  // LE DOIGT
  function poser(e: React.PointerEvent<HTMLDivElement>) {
    if (phase !== "accueil" && phase !== "fin") return;
    if (phase === "fin") return;
    e.preventDefault();
    scene.current?.setPointerCapture?.(e.pointerId);
    sons.current.ouvrir();
    const p = partie.current;
    const graine = new URLSearchParams(window.location.search).get("graine") || `${Date.now()}-${Math.random()}`;
    Object.assign(p, { t0: performance.now(), prog: programme(graine), jauge: 0, pos: { x: e.clientX, y: e.clientY }, depart: new Map(), reglee: new Set(), max: new Map(), id: -1 });
    setDoigt({ x: e.clientX, y: e.clientY });
    setRetour(null);
    setVue({ t: 0, jauge: 0, compte: ATTENTE, evt: null, reglee: false });
    setPhase("compte");
  }
  function bouger(e: React.PointerEvent<HTMLDivElement>) {
    if (phase !== "jeu" && phase !== "compte") return;
    const p = partie.current;
    p.pos = { x: e.clientX, y: e.clientY };
    setDoigt({ x: e.clientX, y: e.clientY });
    if (phase !== "jeu" || p.id < 0 || p.reglee.has(p.id)) return;
    const d = p.depart.get(p.id);
    if (!d) return;
    const ecart = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    p.max.set(p.id, Math.max(p.max.get(p.id) ?? 0, ecart));
    const evt = p.prog[p.id];
    const r = resistance(humour);
    if (evt.type === "mouche" && ecart >= GLISSE_MIN) {
      p.reglee.add(p.id);
      sons.current.bzz(false);
      sons.current.bien();
      dire("✓ Chassée !", true);
    } else if (evt.type === "grimace" && ecart > BOUGE_MAX) {
      p.reglee.add(p.id);
      p.jauge += JAUGE.bouge * r;
      if (navigator.vibrate) navigator.vibrate(80);
      dire("😬 Tu as bougé !", false);
    }
  }
  function lever() {
    if (phase === "compte") {
      sons.current.taire();
      setDoigt(null);
      setPhase("accueil");
      dire("Garde ton doigt posé jusqu’au bout 👆", false);
      return;
    }
    if (phase === "jeu") terminer({ gagne: false, tMoi: (performance.now() - partie.current.t0) / 1000, lache: true });
  }

  // LE POLAROÏD : dessiné à la fin, et redessiné quand il change la phrase
  useEffect(() => {
    if (phase !== "fin" || !fin || !moi || !autre) return;
    let fini = false;
    const minuteur = window.setTimeout(async () => {
      const b = await dessinerPolaroid({
        gauche: fin.gagne ? moi.neutre : moi.rire,
        droite: fin.gagne ? autre.rire : autre.neutre,
        nomG: moi.nom,
        nomD: autre.nom,
        gagneG: fin.gagne,
        phrase: phrase.trim() || "…",
        score: `${score.moi} – ${score.autre}`,
      }).catch(() => null);
      if (fini || !b) return;
      setPolaroid((avant) => {
        if (avant) URL.revokeObjectURL(avant.url);
        return { url: URL.createObjectURL(b), fichier: new File([b], "polaroid-clikme.jpg", { type: "image/jpeg" }) };
      });
    }, 250);
    return () => {
      fini = true;
      window.clearTimeout(minuteur);
    };
  }, [phase, fin, moi, autre, phrase, score]);

  async function envoyer() {
    if (!polaroid) return;
    try {
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [polaroid.fichier] })) {
        await navigator.share({ files: [polaroid.fichier] });
        return;
      }
    } catch {
      return; /* il a fermé la feuille de partage */
    }
    const a = document.createElement("a");
    a.href = polaroid.url;
    a.download = "polaroid-clikme.jpg";
    a.click();
    setEnvoye("Polaroïd enregistré ✓");
  }
  function revanche() {
    setFin(null);
    setPolaroid(null);
    setRetour(null);
    setVue({ t: 0, jauge: 0, compte: ATTENTE, evt: null, reglee: false });
    setPhase("accueil");
  }

  // ─── l'écran ───
  const evt = vue.evt;
  const reglee = vue.reglee;
  const mouche = phase === "jeu" && evt === "mouche" && !reglee;
  const louche = phase === "jeu" && evt === "grimace";
  const imgMoi = !moi ? "" : phase === "fin" && fin && !fin.gagne ? moi.rire : vue.jauge >= 60 && phase === "jeu" ? moi.joie : moi.neutre;
  const imgAutre = !autre ? "" : phase === "fin" && fin?.gagne ? autre.rire : louche ? autre.grimace : autre.neutre;
  const zoom = phase === "jeu" ? 1 + Math.min(0.28, vue.t * 0.016) : 1;
  const tremble = phase === "jeu" && vue.jauge >= 70;
  const retourVisible = retour && phase === "jeu";
  return (
    <main className="dl">
      <header className="dl-tete">
        <a href="/collection#rencontre" className="dl-retour" aria-label="Retour">
          ←
        </a>
        <span>
          <small>LE DUEL DU JOUR · ESSAI</small>
          <h1>😐 Concours de regard</h1>
        </span>
      </header>

      {phase === "charge" && (erreur ? <p className="dl-erreur">{erreur}</p> : <p className="dl-attente">Les figurines s’installent…</p>)}

      {moi && autre && phase !== "charge" && (
        <>
          {(phase === "accueil" || phase === "compte") && (
            <p className="dl-regle">
              Garde ton doigt posé : ta figurine garde son sérieux. <b>🪰 Une mouche ?</b> Glisse ton doigt pour la chasser. <b>😜 {autre.nom} louche ?</b> Ne bouge pas.
              Le premier qui rit a perdu.
            </p>
          )}
          <div
            ref={scene}
            className={`dl-scene${phase === "jeu" ? " joue" : ""}`}
            onPointerDown={poser}
            onPointerMove={bouger}
            onPointerUp={lever}
            onPointerCancel={lever}
            onContextMenu={(e) => e.preventDefault()}
          >
            <div className="dl-face">
              <figure className={`dl-fig moi${tremble ? " tremble" : ""}${phase === "fin" && fin && !fin.gagne ? " craque" : ""}`}>
                <span className="dl-cadre">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgMoi} alt="" style={{ transform: `scale(${zoom})` }} draggable={false} />
                  {mouche && <span className="dl-mouche" aria-hidden="true">🪰</span>}
                  {phase === "fin" && fin && !fin.gagne && <b className="dl-pfff">PFFF 😂</b>}
                </span>
                <figcaption>{moi.nom}</figcaption>
              </figure>
              <b className="dl-vs" aria-hidden="true">
                {phase === "jeu" ? secondes(vue.t) : "VS"}
              </b>
              <figure className={`dl-fig autre${louche ? " louche" : ""}${phase === "fin" && fin?.gagne ? " craque" : ""}`}>
                <span className="dl-cadre">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgAutre} alt="" style={{ transform: `scale(${zoom})` }} draggable={false} />
                  {phase === "fin" && fin?.gagne && <b className="dl-pfff">PFFF 😂</b>}
                </span>
                <figcaption>{autre.nom}</figcaption>
              </figure>
            </div>

            {phase === "jeu" && (
              <>
                <div className="dl-jauge" aria-label="Ta jauge de fou rire">
                  <span aria-hidden="true">😐</span>
                  <i>
                    <em style={{ width: `${Math.min(100, vue.jauge)}%` }} />
                  </i>
                  <span aria-hidden="true">😂</span>
                </div>
                <p className={`dl-consigne${evt && !reglee ? " vive" : ""}`} role="status">
                  {mouche ? "🪰 Une mouche ! Glisse ton doigt" : louche ? `😜 ${autre.nom} louche… ne bouge pas !` : `Tiens bon… ${autre.nom} a tenu ${secondes(tAutre)} s`}
                </p>
                {retourVisible && (
                  <span key={retour.le} className={`dl-retour-vif${retour.bon ? " bon" : ""}`}>
                    {retour.texte}
                  </span>
                )}
              </>
            )}

            {(phase === "accueil" || phase === "compte") && (
              <div className="dl-poser">
                {phase === "compte" ? (
                  <b className="dl-compte">{vue.compte}</b>
                ) : (
                  <>
                    <span className="dl-cible" aria-hidden="true">
                      👆
                    </span>
                    <b>Pose ton doigt ici, et ne le lève plus</b>
                    <small>
                      {autre.nom} a tenu <b>{secondes(tAutre)} s</b> aujourd’hui. Fais mieux !
                    </small>
                  </>
                )}
                {retour && phase === "accueil" && <small className="dl-oups">{retour.texte}</small>}
              </div>
            )}
            {doigt && (phase === "jeu" || phase === "compte") && <span className="dl-doigt" style={{ left: doigt.x, top: doigt.y }} aria-hidden="true" />}
          </div>

          {phase === "accueil" && (
            <p className="dl-bas">
              {!aSaFigurine ? (
                <a href="/collection#figurine">🎭 Crée ta figurine pour jouer avec la tienne</a>
              ) : humour != null && humour > 50 ? (
                <>😂 Ton humour ({humour}) t’aide à résister : −{Math.round((1 - resistance(humour)) * 100)} % de fou rire.</>
              ) : (
                <a href="/collection#personnage">🃏 Ta carte de personnage peut t’aider (ton humour)</a>
              )}
              {score.moi + score.autre > 0 && (
                <span>
                  {" "}
                  · Toi {score.moi} – {score.autre} {autre.nom}
                </span>
              )}
            </p>
          )}

          {phase === "fin" && fin && (
            <section className="dl-fin" aria-live="polite">
              <b className={`dl-resultat${fin.gagne ? " gagne" : ""}`}>
                {fin.gagne ? `🏆 ${autre.nom} a craqué ! Tu as gagné.` : fin.lache ? `😂 Tu as levé le doigt à ${secondes(fin.tMoi)} s.` : `😂 Tu as craqué à ${secondes(fin.tMoi)} s.`}
              </b>
              <small className="dl-chiffres">
                Toi : {secondes(fin.tMoi)} s · {autre.nom} : {secondes(tAutre)} s · Toi {score.moi} – {score.autre} {autre.nom}
              </small>
              <div className="dl-polaroid">
                {polaroid ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={polaroid.url} alt="Le polaroïd du duel" className="dl-polaroid-img" />
                ) : (
                  <span className="dl-polaroid-attente">📸 Le polaroïd se développe…</span>
                )}
              </div>
              <label className="dl-phrase">
                <span>✍️ Sa phrase (tu peux la changer)</span>
                <input value={phrase} maxLength={LEGENDE_MAX} onChange={(e) => setPhrase(e.target.value)} />
              </label>
              <button type="button" className="dl-envoyer" onClick={envoyer} disabled={!polaroid}>
                📲 Envoyer le polaroïd
              </button>
              {envoye && <small className="dl-envoye">{envoye}</small>}
              <button type="button" className="dl-revanche" onClick={revanche}>
                🔁 {fin.gagne ? "Rejouer" : "Revanche !"}
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export const STYLES_DUEL = `
.dl{min-height:100dvh;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;max-width:520px;margin:0 auto;padding:max(14px,env(safe-area-inset-top)) 16px calc(28px + env(safe-area-inset-bottom));background:radial-gradient(120% 60% at 50% 0%,#4A1238 0%,#12060F 62%);color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
html,body{background:#12060F}
.dl-tete{display:flex;align-items:center;gap:12px}
.dl-tete small{font-size:11px;font-weight:900;letter-spacing:.14em;color:#F2C46B}
.dl-tete h1{margin:0;font-size:24px;line-height:1.1;font-weight:900}
.dl-retour{display:grid;place-items:center;flex:none;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.08);color:#FFF4E6;font-size:20px;text-decoration:none}
.dl-attente,.dl-erreur{margin:40px 0;text-align:center;color:#D9C3CB}
.dl-erreur{color:#FFB3C7}
.dl-regle{margin:0;font-size:13.5px;line-height:1.45;color:#E8D3DC}
.dl-regle b{color:#FFF4E6}
.dl-scene{position:relative;display:flex;flex-direction:column;gap:12px;padding:14px 12px 16px;border-radius:26px;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,46,154,.35);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;overflow:hidden}
.dl-scene.joue{border-color:rgba(242,196,107,.6)}
.dl-face{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}
.dl-fig{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.dl-cadre{position:relative;display:block;width:100%;aspect-ratio:3/4;border-radius:20px;overflow:hidden;background:#2A0F1F;box-shadow:0 18px 30px -18px rgba(0,0,0,.9)}
.dl-cadre img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 22%;transform-origin:50% 28%;transition:transform .2s linear;pointer-events:none}
.dl-fig figcaption{font-size:14px;font-weight:900;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dl-fig.tremble .dl-cadre{animation:dl-tremble .12s linear infinite}
.dl-fig.louche .dl-cadre{animation:dl-boing .5s ease-out}
.dl-fig.craque .dl-cadre{animation:dl-fourire .18s linear 8}
.dl-vs{font-size:20px;font-weight:900;color:#F2C46B;min-width:44px;text-align:center;font-variant-numeric:tabular-nums}
.dl-mouche{position:absolute;left:50%;top:30%;font-size:30px;animation:dl-vole 1.1s ease-in-out infinite;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}
.dl-pfff{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) rotate(-8deg);padding:6px 10px;border-radius:12px;background:#FFF4E6;color:#2A0F1F;font-size:17px;font-weight:900;white-space:nowrap;box-shadow:0 8px 16px -8px rgba(0,0,0,.8)}
.dl-jauge{display:flex;align-items:center;gap:8px;font-size:18px}
.dl-jauge i{flex:1;height:12px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.dl-jauge em{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#7FF0C4,#F2C46B 55%,#FF2E9A)}
.dl-consigne{margin:0;min-height:22px;text-align:center;font-size:15px;font-weight:900;color:#E8D3DC}
.dl-consigne.vive{color:#FFF4E6;animation:dl-pulse .5s ease-in-out infinite alternate}
.dl-retour-vif{position:absolute;left:50%;top:44%;transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:#FF2E9A;color:#fff;font-size:14px;font-weight:900;white-space:nowrap;pointer-events:none;animation:dl-monte .9s ease-out forwards}
.dl-retour-vif.bon{background:#21B98A}
.dl-poser{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 10px 8px;text-align:center}
.dl-poser > b{font-size:16px;font-weight:900}
.dl-poser small{font-size:13px;color:#D9C3CB}
.dl-cible{display:grid;place-items:center;width:84px;height:84px;border-radius:50%;background:rgba(255,46,154,.18);border:2px dashed rgba(255,46,154,.8);font-size:36px;animation:dl-pulse .9s ease-in-out infinite alternate}
.dl-compte{font-size:64px;line-height:1;font-weight:900;color:#F2C46B}
.dl-oups{color:#FFB3C7!important;font-weight:800}
.dl-doigt{position:fixed;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;border:3px solid rgba(255,244,230,.8);background:rgba(255,46,154,.25);pointer-events:none}
.dl-bas{margin:0;text-align:center;font-size:13px;color:#D9C3CB}
.dl-bas a{color:#F2C46B;font-weight:800;text-decoration:none}
.dl-fin{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.dl-resultat{font-size:21px;font-weight:900}
.dl-resultat.gagne{color:#7FF0C4}
.dl-chiffres{font-size:13px;color:#D9C3CB}
.dl-polaroid{width:min(100%,360px);margin:6px 0;transform:rotate(-2.5deg)}
.dl-polaroid-img{display:block;width:100%;border-radius:6px;box-shadow:0 24px 40px -18px rgba(0,0,0,.95)}
.dl-polaroid-attente{display:grid;place-items:center;aspect-ratio:1080/1350;border-radius:6px;background:#FBF8F1;color:#7A7280;font-weight:800}
.dl-phrase{display:flex;flex-direction:column;gap:6px;width:100%;text-align:left;font-size:13px;font-weight:800;color:#E8D3DC}
.dl-phrase input{box-sizing:border-box;width:100%;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px;font-weight:600}
.dl-envoyer,.dl-revanche{width:100%;padding:15px 18px;border-radius:999px;font:inherit;font-size:16px;font-weight:900;cursor:pointer}
.dl-envoyer{border:0;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.dl-envoyer:disabled{opacity:.55}
.dl-revanche{border:1.5px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#FFF4E6}
.dl-envoye{color:#7FF0C4;font-weight:800}
@keyframes dl-tremble{0%{transform:translate(0,0) rotate(0)}25%{transform:translate(-2px,1px) rotate(-1deg)}50%{transform:translate(2px,-1px) rotate(1deg)}75%{transform:translate(-1px,-2px) rotate(0)}100%{transform:translate(0,0)}}
@keyframes dl-boing{0%{transform:scale(1)}30%{transform:scale(1.08,.92)}60%{transform:scale(.96,1.05)}100%{transform:scale(1)}}
@keyframes dl-fourire{0%{transform:translate(0,0) rotate(0)}50%{transform:translate(0,-4px) rotate(2deg)}100%{transform:translate(0,0) rotate(-2deg)}}
@keyframes dl-vole{0%{transform:translate(-30px,-10px) rotate(-10deg)}25%{transform:translate(18px,-26px) rotate(15deg)}50%{transform:translate(26px,10px) rotate(-5deg)}75%{transform:translate(-20px,18px) rotate(10deg)}100%{transform:translate(-30px,-10px) rotate(-10deg)}}
@keyframes dl-pulse{from{transform:scale(1)}to{transform:scale(1.06)}}
@keyframes dl-monte{from{opacity:1;transform:translate(-50%,0)}to{opacity:0;transform:translate(-50%,-40px)}}
@media (prefers-reduced-motion:reduce){.dl *{animation:none!important;transition:none!important}}
`;
