/**
 * 🐾 LE CHAT DU SALON (`docs/univers/salon-du-duo.md`, section 4.5 ; le lot S3, deuxième partie) — celui de l'essai C0
 * (ses boucles vidéo sur fond vert, `ChatSalon`), dans la pièce du duo : il vit dans son coin (`emplacements.chat`), vient
 * parfois ronronner sur mes genoux (au-dessus de ma place) et y repart ; il dort, s'assoit, joue, renifle ; il dresse
 * les oreilles à chaque message, saute de joie à un fou rire ou à un check, renifle ce qu'on pose sur la table. On le
 * touche : quelques cœurs, il ronronne (son vrai son enregistré, s'il est déposé) — touché dans son coin, il vient sur mes
 * genoux, et repart une demi-minute plus tard.
 *
 * LE VERT RETIRÉ PAR LA CARTE GRAPHIQUE (section 7.3) : chaque image de la vidéo devient une texture, un petit programme
 * de la carte graphique (WebGL) rend le fond transparent — la même règle que l'essai C0 (`univers/compagnon-vivant.tsx` :
 * la couleur du fond mesurée sur le bord, les points à demi « démêlés », l'ombre gardée grise, le reflet vert éteint, le
 * bord resserré d'un point), sans rien demander au processeur. (Retours du 20 novembre 2026, le chat « pas totalement
 * détouré » en grand sur un ordinateur : la toile suit la taille où on la voit ; le vert du fond retiré aussi dans
 * l'ombre ; l'ombre grise gardée seulement sous ses pattes ; le bord de l'image effacé.) Sans WebGL (ou une vidéo qu'on ne peut pas lire) : pas de
 * chat — il n'est qu'un plus.
 *
 * Une vidéo par boucle, créée à la première fois qu'elle sert, gardée dans la page (un iPhone ne décode pas une vidéo
 * cachée) ; seule celle qu'on montre joue. La page cachée : elle s'arrête. En mouvement réduit : il reste immobile.
 *
 * MODULE DU NAVIGATEUR (il touche au DOM) : à n'importer que dans un composant client.
 */
import { BOUCLES, type Boucle } from "@/lib/direct/compagnons";
import type { PlaceDuo } from "@/lib/direct/pieces-duo";
import type { ChatSalon, Scene } from "@/lib/direct/salon";

/** Dans sa vidéo (9:16), ses pattes sont à 17 % du bas (comme à la page d'essais). */
const PIED = 0.17;
/** Le temps qu'il marche d'une place à l'autre. */
const MARCHE_MS = 1700;
/** La toile : assez fine pour un animal de la taille d'une figurine, assez légère pour un téléphone. */
const TOILE = { l: 270, h: 480, max: 960 } as const;
const FOND_PAR_DEFAUT = [20 / 255, 180 / 255, 60 / 255] as const;
const hasard = (a: number, b: number) => a + Math.random() * (b - a);

export type LieuChat = "coin" | "genoux";
/** Ce qui le fait réagir : un message (les oreilles), de la joie (un saut), un objet posé (il renifle). */
export type EvenementChat = "message" | "joie" | "objet";
export type ChatDuSalon = {
  reagir(e: EvenementChat): void;
  readonly lieu: LieuChat;
  readonly boucle: Boucle | null;
  detruire(): void;
};

// ─── le vert retiré par la carte graphique ───
const SOMMETS = `attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}`;
const PIXELS = `precision mediump float;
uniform sampler2D t;uniform vec3 fond;uniform float vf;uniform float vt;uniform vec2 px;varying vec2 uv;
float partDe(vec3 c){return (c.g-(c.r+c.b)*.5)/vf;}
float teinteDe(vec3 c){return smoothstep(.12,.28,c.g)*(c.g-max(c.r,c.b))/max(c.g,.001)/vt;}
float alphaDe(vec3 c){return 1.-clamp((max(partDe(c),teinteDe(c))-.16)/.34,0.,1.);}
void main(){
  vec4 c=texture2D(t,uv);
  float part=partDe(c.rgb);
  float a=alphaDe(c.rgb);
  a=min(a,alphaDe(texture2D(t,uv+vec2(px.x,0.)).rgb));
  a=min(a,alphaDe(texture2D(t,uv-vec2(px.x,0.)).rgb));
  a=min(a,alphaDe(texture2D(t,uv+vec2(0.,px.y)).rgb));
  a=min(a,alphaDe(texture2D(t,uv-vec2(0.,px.y)).rgb));
  vec3 col=c.rgb;
  if(part<=.16){col.g=min(col.g,max(col.r,col.b));}
  else{
    float f=max(1.-clamp((part-.16)/.34,0.,1.),.001);
    vec3 d=(c.rgb-(1.-f)*fond)/f;
    if(d.g<0.){float n=min(c.r,c.b)*.5;col=vec3(n,n*.95,n*.9);a*=mix(.2,1.,smoothstep(.6,.8,uv.y));}
    else{col=vec3(d.r,min(d.g,max(d.r,d.b)),d.b);}
  }
  a*=smoothstep(0.,.035,uv.x)*smoothstep(0.,.035,1.-uv.x)*smoothstep(0.,.02,uv.y)*smoothstep(0.,.02,1.-uv.y);
  col=clamp(col,0.,1.);
  gl_FragColor=vec4(col*a,a);
}`;
type Rendu = { dessiner(v: HTMLVideoElement, fond: readonly number[]): boolean; detruire(): void };
function rendu(toile: HTMLCanvasElement): Rendu | null {
  const gl = toile.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: false });
  if (!gl) return null;
  const shader = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  };
  const vs = shader(gl.VERTEX_SHADER, SOMMETS);
  const fs = shader(gl.FRAGMENT_SHADER, PIXELS);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const tampon = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const p = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(p);
  gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const uFond = gl.getUniformLocation(prog, "fond");
  const uVf = gl.getUniformLocation(prog, "vf");
  const uVt = gl.getUniformLocation(prog, "vt");
  const uPx = gl.getUniformLocation(prog, "px");
  gl.viewport(0, 0, toile.width, toile.height);
  gl.clearColor(0, 0, 0, 0);
  return {
    dessiner(v, fond) {
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
      } catch {
        // (une vidéo d'un autre site sans permission : on ne peut pas la lire)
        return false;
      }
      gl.uniform3f(uFond, fond[0], fond[1], fond[2]);
      // (la toile à la taille où on la voit — jusqu'à celle de la vidéo : agrandie, le bord du chat devenait flou et vert)
      const voulue = Math.round(Math.min(v.videoHeight || TOILE.h, TOILE.max, Math.max(TOILE.h, (toile.clientHeight || 0) * (window.devicePixelRatio || 1))));
      if (Math.abs(voulue - toile.height) > 24) {
        toile.height = voulue;
        toile.width = Math.round((voulue * TOILE.l) / TOILE.h);
        gl.viewport(0, 0, toile.width, toile.height);
      }
      gl.uniform1f(uVf, Math.max(0.05, fond[1] - (fond[0] + fond[2]) / 2));
      gl.uniform1f(uVt, Math.max(0.2, (fond[1] - Math.max(fond[0], fond[2])) / Math.max(0.05, fond[1])));
      gl.uniform2f(uPx, 1 / (v.videoWidth || TOILE.l), 1 / (v.videoHeight || TOILE.h));
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return true;
    },
    detruire() {
      gl.deleteTexture(tex);
      gl.deleteBuffer(tampon);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
/** La couleur du fond d'une vidéo : la médiane de son bord (une petite toile, une fois par boucle). */
function fondDe(v: HTMLVideoElement): readonly number[] {
  try {
    const c = document.createElement("canvas");
    c.width = 18;
    c.height = 32;
    const x = c.getContext("2d", { willReadFrequently: true });
    if (!x) return FOND_PAR_DEFAUT;
    x.drawImage(v, 0, 0, 18, 32);
    const d = x.getImageData(0, 0, 18, 32).data;
    const rs: number[] = [];
    const gs: number[] = [];
    const bs: number[] = [];
    for (let i = 0; i < 18 * 32; i++) {
      const xx = i % 18;
      const yy = Math.floor(i / 18);
      if (xx > 0 && xx < 17 && yy > 0) continue;
      rs.push(d[i * 4]);
      gs.push(d[i * 4 + 1]);
      bs.push(d[i * 4 + 2]);
    }
    const med = (l: number[]) => l.sort((a, b) => a - b)[l.length >> 1] / 255;
    const f = [med(rs), med(gs), med(bs)];
    return f[1] - (f[0] + f[2]) / 2 < 60 / 255 ? FOND_PAR_DEFAUT : f;
  } catch {
    return FOND_PAR_DEFAUT;
  }
}

const STYLE = `
.sc-chat{position:absolute;margin:0;padding:0;border:0;background:none;aspect-ratio:9/16;transform:translate(-50%,-100%);cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent}
.sc-chat canvas{display:block;width:100%;height:100%;pointer-events:none}
.sc-chat.retourne canvas{transform:scaleX(-1)}
.sc-chat.marche{transition:left ${MARCHE_MS}ms linear,top ${MARCHE_MS}ms linear,height ${MARCHE_MS}ms linear}
.sc-chat-videos{position:absolute;left:0;top:0;width:2px;height:2px;overflow:hidden;opacity:0;pointer-events:none}
.sc-chat-videos video{width:2px;height:2px}
`;
function installerStyle() {
  if (document.getElementById("sc-chat-style")) return;
  const s = document.createElement("style");
  s.id = "sc-chat-style";
  s.textContent = STYLE;
  document.head.append(s);
}

/**
 * 🐾 Installer le chat dans la scène. `place` : la mienne (ses genoux) ; `coin` : son coin (sinon, au sol à côté de moi).
 * `null` : pas de chat (aucune boucle, ou pas de WebGL).
 */
export function installerChat(
  scene: Scene,
  c: ChatSalon,
  o: { place: PlaceDuo; coin?: { x: number; y: number }; surToucher?: () => void },
): ChatDuSalon | null {
  if (typeof document === "undefined" || !Object.keys(c.boucles).length) return null;
  installerStyle();
  const toile = document.createElement("canvas");
  toile.width = TOILE.l;
  toile.height = TOILE.h;
  const r = rendu(toile);
  if (!r) return null;
  const el = document.createElement("button");
  el.type = "button";
  el.className = "sc-chat sc-teinte";
  el.setAttribute("aria-label", `${c.nom}, le chat`);
  el.append(toile);
  const videos = document.createElement("div");
  videos.className = "sc-chat-videos";
  scene.couche("derriere").append(videos);
  const reduit = scene.reduit;

  // ─── où il se tient ───
  const P = o.place;
  const auSol = { x: Math.min(0.92, Math.max(0.08, P.x + (P.x > 0.5 ? 0.17 : -0.17))), y: Math.min(0.97, P.y + 0.07) };
  const coin = o.coin ?? auSol;
  const lieux: Record<LieuChat, { x: number; y: number; h: number }> = {
    coin: { x: coin.x, y: coin.y, h: P.hauteur * 0.62 },
    // (ses genoux : juste au-dessus du point où elle touche son siège)
    genoux: { x: P.x, y: P.y - P.hauteur * 0.12, h: P.hauteur * 0.46 },
  };
  function placer(l: LieuChat) {
    const z = lieux[l];
    el.style.left = `${z.x * 100}%`;
    el.style.top = `${(z.y + PIED * z.h) * 100}%`;
    el.style.height = `${z.h * 100}%`;
    el.dataset.lieu = l;
  }

  // ─── ses boucles ───
  const dispo = (b: Boucle) => Boolean(c.boucles[b]);
  const repli = (b: Boucle): Boucle | null => (dispo(b) ? b : dispo("assis") ? "assis" : ((BOUCLES.find((x) => dispo(x.cle))?.cle as Boucle | undefined) ?? null));
  const VIDEOS = new Map<Boucle, { v: HTMLVideoElement; fond?: readonly number[] }>();
  function video(b: Boucle) {
    let x = VIDEOS.get(b);
    if (x) return x;
    const v = document.createElement("video");
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    v.setAttribute("aria-hidden", "true");
    v.src = c.boucles[b]!;
    videos.append(v);
    x = { v };
    VIDEOS.set(b, x);
    return x;
  }
  let vivant = true;
  let lieu: LieuChat = "coin";
  let base: Boucle | null = repli(Math.random() < 0.6 ? "dort" : "assis");
  let montree: Boucle | null = null;
  let derniere = -1;
  let casse = false;
  function montrer(b: Boucle | null) {
    const x = b ? repli(b) : null;
    if (!x || x === montree) return;
    const avant = montree ? VIDEOS.get(montree) : null;
    montree = x;
    el.dataset.boucle = x;
    const n = video(x);
    derniere = -1;
    if (!reduit && !document.hidden) void n.v.play().catch(() => undefined);
    // (l'ancienne s'arrête quand la nouvelle a une image : rien ne clignote)
    const arreter = () => avant && avant.v !== n.v && avant.v.pause();
    if (n.v.readyState >= 2) arreter();
    else n.v.addEventListener("loadeddata", arreter, { once: true });
  }
  const desabonner = scene.surImage(() => {
    if (!montree || casse) return;
    const n = VIDEOS.get(montree);
    if (!n || n.v.readyState < 2 || n.v.currentTime === derniere) return;
    derniere = n.v.currentTime;
    n.fond ??= fondDe(n.v);
    if (!r.dessiner(n.v, n.fond)) {
      casse = true;
      el.hidden = true;
    } else el.dataset.vu = "1";
  });

  // ─── ce qu'il fait ───
  let minute: ReturnType<typeof setTimeout> | null = null;
  let retour: ReturnType<typeof setTimeout> | null = null;
  let enMarche = false;
  const plusTard = (ms: number, f: () => void) => {
    if (minute) clearTimeout(minute);
    minute = setTimeout(() => vivant && f(), ms);
  };
  /** Une boucle le temps de `ms`, puis il revient à ce qu'il faisait. */
  function unMoment(b: Boucle, ms: number) {
    if (enMarche || !dispo(b)) return;
    if (base === "dort") base = repli(lieu === "genoux" ? "genoux" : "assis");
    montrer(b);
    if (retour) clearTimeout(retour);
    retour = setTimeout(() => vivant && !enMarche && montrer(base), ms);
  }
  function aller(l: LieuChat) {
    if (l === lieu || enMarche) return;
    const de = lieux[lieu];
    const vers = lieux[l];
    lieu = l;
    if (!dispo("marche") || reduit) {
      (l === "genoux" ? scene.couche("devant") : scene.couche("derriere")).append(el);
      placer(l);
      base = repli(l === "genoux" ? "genoux" : "assis");
      montrer(base);
      return;
    }
    enMarche = true;
    // (sa boucle de marche regarde à gauche : vers la droite, on la retourne)
    el.classList.toggle("retourne", vers.x > de.x);
    montrer("marche");
    requestAnimationFrame(() => {
      el.classList.add("marche");
      placer(l);
    });
    setTimeout(() => {
      if (!vivant) return;
      el.classList.remove("marche", "retourne");
      (l === "genoux" ? scene.couche("devant") : scene.couche("derriere")).append(el);
      enMarche = false;
      base = repli(l === "genoux" ? "genoux" : Math.random() < 0.5 ? "dort" : "assis");
      montrer(base);
    }, MARCHE_MS + 40);
  }
  /** Sa vie, quand rien ne se passe : toutes les 18 à 40 s, autre chose (sur les genoux, il finit par repartir). */
  function vivre() {
    if (document.hidden || scene.occupee || enMarche) return plusTard(8000, vivre);
    if (lieu === "genoux") {
      aller("coin");
    } else {
      const t = Math.random();
      if (t < 0.22 && dispo("genoux")) aller("genoux");
      else if (t < 0.5) {
        base = repli("dort");
        montrer(base);
      } else if (t < 0.72) {
        base = repli("assis");
        montrer(base);
      } else if (t < 0.86) unMoment("joue", 5200);
      else unMoment("renifle", 3600);
    }
    plusTard(hasard(18_000, 40_000), vivre);
  }

  // ─── on le touche : des cœurs, il ronronne ; dans son coin, il vient sur mes genoux ───
  let son: HTMLAudioElement | null = null;
  const ronronner = () => {
    if (!c.son || !vivant) return;
    son ??= new Audio(c.son);
    son.currentTime = 0;
    void son.play().catch(() => undefined);
  };
  el.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (enMarche) return;
    o.surToucher?.();
    const z = lieux[lieu];
    scene.fx.eclatCoeurs({ x: z.x, y: z.y - z.h * 0.45 }, 5);
    if (lieu === "coin" && dispo("genoux")) {
      aller("genoux");
      setTimeout(ronronner, reduit || !dispo("marche") ? 0 : MARCHE_MS);
      plusTard(30_000, vivre);
      return;
    }
    ronronner();
    if (montree === "dort") {
      base = repli(lieu === "genoux" ? "genoux" : "assis");
      montrer(base);
    }
  });
  const surVisibilite = () => {
    const n = montree ? VIDEOS.get(montree) : null;
    if (!n) return;
    if (document.hidden) n.v.pause();
    else if (!reduit) void n.v.play().catch(() => undefined);
  };
  document.addEventListener("visibilitychange", surVisibilite);

  scene.couche("derriere").append(el);
  placer("coin");
  montrer(base);
  if (!reduit) plusTard(hasard(14_000, 26_000), vivre);
  // (les boucles les plus demandées se préparent, l'une après l'autre, une fois la pièce posée)
  setTimeout(() => vivant && (["alerte", "assis", "marche", "genoux", "saut"] as Boucle[]).filter(dispo).forEach((b, i) => setTimeout(() => vivant && video(b), i * 1500)), 4000);

  return {
    reagir(e) {
      if (!vivant || reduit) return;
      if (e === "message") unMoment("alerte", 2600);
      else if (e === "joie") unMoment("saut", 1900);
      else if (lieu === "coin") unMoment("renifle", 2600);
    },
    get lieu() {
      return lieu;
    },
    get boucle() {
      return montree;
    },
    detruire() {
      vivant = false;
      if (minute) clearTimeout(minute);
      if (retour) clearTimeout(retour);
      desabonner();
      document.removeEventListener("visibilitychange", surVisibilite);
      for (const { v } of VIDEOS.values()) {
        v.pause();
        v.removeAttribute("src");
        v.load();
      }
      son?.pause();
      r.detruire();
      el.remove();
      videos.remove();
    },
  };
}
