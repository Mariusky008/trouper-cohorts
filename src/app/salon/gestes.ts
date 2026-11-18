/**
 * 🛋️ LES GESTES DU SALON, MIS EN SCÈNE (`docs/univers/salon-du-duo.md`, section 4.4 ; le lot S3) : la maquette, telle
 * quelle, portée sur le moteur (`moteur.ts`, le contrat `src/lib/direct/salon.ts`).
 *
 * - 💌 Petites attentions : 👋 Coucou, 😘 Bisou, 🤜 Check, 🪶 Chatouilles, 🌷 Une fleur (posée sur la table) ;
 * - les huit panneaux (« J'arrive ! », « Je pense à toi »…) : la figurine les brandit, l'autre réagit ;
 * - 🛋️ Ensemble : 🤗 Câlin, ☕ Un café (posé sur la table), 🎶 Danser, 🎁 Surprise (elle tombe sur la table, s'ouvre,
 *   et laisse ce qu'elle cachait). 📺 Un clip, 📸 Photo à deux et 🖼️ Accrocher viennent avec la télé et les cadres
 *   (lot S6).
 *
 * Ce qu'un geste pose sur la table (la tulipe, le café, la surprise) vient du serveur, avec son identifiant : l'écran le
 * confie AVANT de jouer le geste (`confierObjet`) ; sans lui (une adresse d'essai), le geste en pose un tout neuf.
 *
 * Jamais une voix : des bruits et de courtes musiques (`CLAUDE.md`).
 */
import { enregistrerMiseEnScene, type ObjetTable, type Point, type Qui, type Scene } from "@/lib/direct/salon";
import { OBJETS_DES_GESTES, PANNEAUX, SURPRISES } from "@/lib/direct/vivant";
import { bez, ease } from "./moteur";

const hasard = (a: number, b: number) => a + Math.random() * (b - a);
const ROSES: [string, string] = ["#ff9cc8", "#ff2f6f"];
const ROUGES: [string, string] = ["#ff6b8a", "#e0103a"];
const autreQue = (q: Qui): Qui => (q === "moi" ? "autre" : "moi");
/** Le côté où est l'autre : 1 s'il est à droite. */
function versLAutre(s: Scene, de: Qui): 1 | -1 {
  const d = s.repere(autreQue(de), "tete").x - s.repere(de, "tete").x;
  return d === 0 ? (de === "moi" ? 1 : -1) : d > 0 ? 1 : -1;
}
const decale = (p: Point, dx: number, dy: number): Point => ({ x: p.x + dx, y: p.y + dy });

// ─── 🌷 les objets confiés par l'écran (le serveur les a rangés : leur identifiant est celui du geste) ───
const confies: ObjetTable[] = [];
const annules = new Set<string>();
/** Confier l'objet qu'un geste va poser (avant `scene.geste`) : le geste le prendra, dans l'ordre. */
export function confierObjet(o: ObjetTable): void {
  confies.push(o);
  if (confies.length > 12) confies.shift();
}
/** Le geste n'est pas parti : son objet ne sera pas posé (s'il ne l'est pas déjà ; sinon, `scene.retirer`). */
export function annulerObjet(id: string): void {
  annules.add(id);
  if (annules.size > 50) annules.delete(annules.values().next().value!);
}
/** Poser l'objet sur la table, sauf si son geste a été défait entre-temps. */
function poserSiVoulu(s: Scene, o: ObjetTable, entree: "pousse" | "glisse" | "tombe"): Point {
  if (annules.delete(o.id)) return s.placeLibre(o.moi ? "moi" : "autre");
  return s.poser(o, entree);
}
function objetPour(de: Qui, cle: "fleur" | "cafe" | "surprise"): ObjetTable {
  const moi = de === "moi";
  const i = confies.findIndex((o) => o.moi === moi && (cle === "surprise" ? SURPRISES.some((x) => x.e === o.e) : o.e === OBJETS_DES_GESTES[cle]?.e));
  if (i >= 0) return confies.splice(i, 1)[0];
  const x = cle === "surprise" ? SURPRISES[Math.floor(Math.random() * SURPRISES.length)] : OBJETS_DES_GESTES[cle]!;
  return { id: `local-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6)}`, e: x.e, nom: x.nom, moi, le: new Date().toISOString() };
}

// ─── 💌 LES PETITES ATTENTIONS ───────────────────────────────────────────────────────────────────────────────────────
enregistrerMiseEnScene("coucou", async (s, de) => {
  const a = autreQue(de);
  const dir = versLAutre(s, de);
  const f = s.figurine(de);
  const { fx } = s;
  const U = fx.u;
  const cote = s.repere(de, "cote");
  const c = fx.px(cote);
  f.pencher(10, 1600);
  f.sursaut(0.7);
  f.gonfler(1.03, 1400);
  fx.lettrage("Coucou !", { x: cote.x + dir * 0.07, y: s.repere(de, "tete").y - 0.05 }, { couleur: "rose", rot: -6 * dir, taille: 0.065 });
  s.sons.note(880, 0, 0.12, 0.03);
  s.sons.note(1175, 0.14, 0.16, 0.03);
  let derniere = 0;
  void s.attendre(550).then(() => {
    const g = s.figurine(a);
    if (g.dort) g.reveiller();
    g.sursaut(0.9);
    g.pencher(7, 1500);
    const h = s.repere(a, "haut");
    fx.etincelles({ x: h.x, y: h.y + 0.02 }, 5, { t: 0.7 });
  });
  await fx.acteur({
    e: "👋",
    duree: 1.8,
    pivotBas: true,
    pos: () => c,
    taille: (u) => U() * 10.5 * (u < 0.12 ? ease.back(u / 0.12) : u > 0.88 ? 1 - ease.in((u - 0.88) / 0.12) : 1),
    rot: (u) => (u < 0.12 ? -0.2 : Math.sin((u - 0.12) * Math.PI * 2 * 3.3) * 0.55),
    trainee: (q, dt, u) => {
      derniere += dt;
      if (u > 0.12 && u < 0.88 && derniere > 0.15) {
        derniere = 0;
        const base = -Math.PI / 2 + Math.sin((u - 0.12) * Math.PI * 2 * 3.3) * 0.55;
        fx.part({ k: "arc", x: q.x, y: q.y, s: U() * 9.5, a0: base - 0.5, a1: base + 0.5, l: U() * 0.7, c: "rgba(255,255,255,.85)", vie: 0.3, fondu: (k) => 1 - k });
      }
    },
  });
});

enregistrerMiseEnScene("bisou", async (s, de) => {
  const a = autreQue(de);
  const dir = versLAutre(s, de);
  const { fx } = s;
  const U = fx.u;
  const f = s.figurine(de);
  const g = s.figurine(a);
  if (g.dort) g.reveiller();
  f.pencher(12, 1700);
  f.gonfler(1.04, 900);
  const bouche = s.repere(de, "bouche");
  fx.lettrage("Mwah !", { x: bouche.x + dir * 0.06, y: bouche.y - 0.09 }, { couleur: "rose", rot: -8 * dir, taille: 0.05, duree: 1100 });
  s.sons.bruit(90, 0.12, 1800, 2);
  await s.attendre(250);
  const p0 = fx.px(bouche);
  const p2 = fx.px(s.repere(a, "joue"));
  const p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - fx.px({ x: 0, y: 0.14 }).y };
  let emis = 0;
  await fx.acteur({
    e: "💋",
    duree: 1.2,
    pos: (u) => bez(p0, p1, p2, ease.io(u)),
    taille: (u) => U() * (u < 0.15 ? 2 + 5.5 * (u / 0.15) : 7.5 - 1.5 * u),
    rot: (_u, t) => Math.sin(t * 9) * 0.25,
    trainee: (q, dt) => {
      emis += dt;
      while (emis > 0.035) {
        emis -= 0.035;
        fx.part({ k: "coeur", x: q.x + hasard(-5, 5), y: q.y + hasard(-5, 5), vx: hasard(-25, 25), vy: hasard(-55, -15), s: U() * hasard(1.5, 2.8), c: Math.random() < 0.5 ? ROSES : ROUGES, vie: hasard(0.6, 1), vr: hasard(-2, 2) });
      }
    },
  });
  fx.marqueBisou(a);
  fx.eclatCoeurs(s.repere(a, "joue"), 16);
  fx.anneau(s.repere(a, "joue"));
  s.sons.jingle("amour");
  g.secouer(1);
  g.sursaut(0.6);
  await s.attendre(350);
  g.pencher(8, 1800);
  g.gonfler(1.03, 1500);
});

enregistrerMiseEnScene("check", async (s) => {
  const { fx } = s;
  const U = fx.u;
  // (le poing de gauche 🤜, celui de droite 🤛, chacun part de sa figurine)
  const gauche: Qui = s.repere("moi", "tete").x <= s.repere("autre", "tete").x ? "moi" : "autre";
  const droite = autreQue(gauche);
  for (const q of [gauche, droite]) {
    const g = s.figurine(q);
    if (g.dort) g.reveiller();
    g.pencher(7, 1300);
  }
  const milieu = s.milieu();
  const m = fx.px(milieu);
  const recul = U() * 4.5;
  const course = (e: string, depart: Point, dir: 1 | -1) => {
    const p0 = fx.px(depart);
    const s0 = { x: p0.x - dir * recul, y: p0.y - U() * 1.2 };
    const fin = { x: m.x - dir * U() * 3.3, y: m.y };
    return fx.acteur({
      e,
      duree: 0.66,
      pos: (u) => {
        if (u < 0.38) {
          const k = ease.out(u / 0.38);
          return { x: p0.x + (s0.x - p0.x) * k, y: p0.y + (s0.y - p0.y) * k };
        }
        const k = ease.in((u - 0.38) / 0.62);
        return { x: s0.x + (fin.x - s0.x) * k, y: s0.y + (fin.y - s0.y) * k };
      },
      taille: (u) => U() * (5 + 4 * Math.min(1, u * 2.5)),
      rot: (u) => dir * (u < 0.38 ? -0.3 * (u / 0.38) : -0.3 + 0.3 * ((u - 0.38) / 0.62)),
      trainee: (q, _dt, u) => {
        if (u > 0.45) for (let i = 0; i < 2; i++) fx.part({ k: "trait", x: q.x - dir * U() * 3, y: q.y + hasard(-U() * 2, U() * 2), vx: dir * 300, vy: 0, s: U() * hasard(4, 9), l: U() * 0.35, c: "rgba(255,255,255,.85)", vie: 0.2 });
      },
    });
  };
  const depart = (q: Qui) => {
    const main = s.repere(q, "main");
    return { x: main.x, y: Math.min(main.y, milieu.y + 0.04) };
  };
  await Promise.all([course("🤜", depart(gauche), 1), course("🤛", depart(droite), -1)]);
  fx.part({ k: "flash", x: m.x, y: m.y, s: U() * 18, vie: 0.32, fondu: (k) => 1 - k });
  fx.anneau(milieu, "rgba(255,240,200,.95)", 12);
  void s.attendre(80).then(() => fx.anneau(milieu, "rgba(255,210,90,.9)", 18));
  for (let i = 0; i < 14; i++) {
    const ang = (Math.PI * 2 * i) / 14 + hasard(-0.3, 0.3);
    fx.part(
      i % 2
        ? { k: "trait", x: m.x + Math.cos(ang) * U() * 3, y: m.y + Math.sin(ang) * U() * 3, vx: Math.cos(ang) * 340, vy: Math.sin(ang) * 340, fr: 0.9, s: U() * 4, l: U() * 0.5, c: "#ffe27a", vie: 0.35 }
        : { k: "etoile", x: m.x, y: m.y, vx: Math.cos(ang) * hasard(120, 220), vy: Math.sin(ang) * hasard(120, 220), ay: 200, fr: 0.94, s: U() * hasard(2, 3.4), c: i % 4 ? "#fff6c8" : "#ffd76a", vie: 0.8 },
    );
  }
  fx.lettrage("BAM !", { x: milieu.x, y: milieu.y - 0.09 }, { couleur: "jaune", rot: -8, taille: 0.09 });
  fx.secousse(1.2);
  s.sons.clac();
  s.sons.bruit(120, 0.1, 900);
  for (const q of [gauche, droite]) {
    s.figurine(q).sursaut(1.1);
    s.figurine(q).secouer(-0.6);
  }
  await Promise.all(
    (["🤜", "🤛"] as const).map((e, i) => {
      const dir = i ? -1 : 1;
      const x0 = m.x - dir * U() * 3.3;
      return fx.acteur({ e, duree: 0.5, pos: (u) => ({ x: x0 - dir * U() * 3 * ease.out(u), y: m.y }), taille: () => U() * 9, rot: () => 0, alpha: (u) => 1 - u });
    }),
  );
});

enregistrerMiseEnScene("chatouilles", async (s, de) => {
  const a = autreQue(de);
  const dir = versLAutre(s, de);
  const { fx } = s;
  const U = fx.u;
  const f = s.figurine(de);
  const g = s.figurine(a);
  if (g.dort) g.reveiller();
  const joue = s.repere(a, "joue");
  const p0 = fx.px(s.repere(de, "cote"));
  const cible = fx.px({ x: joue.x - dir * 0.015, y: joue.y + 0.05 });
  const haut = fx.px({ x: 0, y: 0.08 }).y;
  f.pencher(7, 3200);
  f.gonfler(1.02, 3000);
  await fx.acteur({
    e: "🪶",
    duree: 1.0,
    pos: (u) => {
      const b = bez(p0, { x: (p0.x + cible.x) / 2, y: Math.min(p0.y, cible.y) - haut }, cible, ease.io(u));
      return { x: b.x, y: b.y + Math.sin(u * Math.PI * 3) * U() * 1.6 };
    },
    taille: () => U() * 10,
    rot: (_u, t) => dir * 0.6 + Math.sin(t * 6) * 0.35,
  });
  g.rire(1.7);
  s.sons.jingle("rire");
  const tete = s.repere(a, "tete");
  fx.lettrage("Hihi !", { x: tete.x - dir * 0.12, y: tete.y - 0.03 }, { couleur: "bleu", rot: -10 * dir, taille: 0.055, duree: 1100 });
  void s.attendre(650).then(() => fx.lettrage("Haha !", { x: tete.x - dir * 0.04, y: tete.y - 0.11 }, { couleur: "jaune", rot: 8 * dir, taille: 0.06, duree: 1200 }));
  let emis = 0;
  const hautA = s.repere(a, "haut");
  await fx.acteur({
    e: "🪶",
    duree: 1.7,
    pos: (_u, t) => ({ x: cible.x + Math.sin(t * 26) * U() * 1.7, y: cible.y + Math.cos(t * 17) * U() * 1.1 }),
    taille: () => U() * 10,
    rot: (_u, t) => dir * 0.6 + Math.sin(t * 26) * 0.5,
    trainee: (_q, dt) => {
      emis += dt;
      if (emis > 0.32) {
        emis = 0;
        fx.jaillir("😂", { x: tete.x + hasard(-0.06, 0.06), y: hautA.y + 0.02 }, 1, { taille: 4 });
      }
    },
  });
  await fx.acteur({ e: "🪶", duree: 0.6, pos: (u) => ({ x: cible.x - dir * U() * 10 * u, y: cible.y - fx.px({ x: 0, y: 0.1 }).y * ease.out(u) }), taille: () => U() * 10, rot: (u) => dir * (0.6 + u * 2), alpha: (u) => 1 - u });
});

enregistrerMiseEnScene("fleur", async (s, de) => {
  const a = autreQue(de);
  const { fx } = s;
  const U = fx.u;
  const o = objetPour(de, "fleur");
  const place = s.placeLibre(de);
  const fin = fx.px(decale(place, 0, -0.02));
  const p0 = fx.px(s.repere(de, "main"));
  const haut = fx.px({ x: 0, y: 0.1 }).y;
  s.figurine(de).pencher(6, 1500);
  s.sons.note(1568, 0, 0.18, 0.025, "sine");
  s.sons.note(2093, 0.12, 0.22, 0.02, "sine");
  await fx.acteur({
    duree: 0.85,
    pos: (u) => {
      const b = bez(p0, { x: (p0.x + fin.x) / 2, y: Math.min(p0.y, fin.y) - haut }, fin, ease.io(u));
      const R = U() * 2.6 * (1 - u);
      return { x: b.x + Math.cos(u * 20) * R, y: b.y + Math.sin(u * 20) * R };
    },
    trainee: (q) => {
      for (let k = 0; k < 2; k++) fx.part({ k: "etoile", x: q.x, y: q.y, vx: hasard(-30, 30), vy: hasard(-35, 10), fr: 0.95, s: U() * hasard(1.2, 2.4), c: Math.random() < 0.5 ? "#fff6c8" : "#ffb3d6", vie: hasard(0.5, 0.9) });
    },
  });
  const ici = poserSiVoulu(s, o, "pousse");
  fx.anneau(decale(ici, 0, -0.02), "rgba(255,190,220,.9)", 6);
  void s.attendre(450).then(() => {
    const c = fx.px(decale(ici, 0, -0.05));
    for (let k = 0; k < 6; k++) {
      const ang = (Math.PI * 2 * k) / 6;
      fx.part({ k: "coeur", x: c.x, y: c.y, vx: Math.cos(ang) * 60, vy: Math.sin(ang) * 40 - 50, ay: -20, fr: 0.95, s: U() * 1.8, c: ROSES, vie: 1 });
    }
  });
  void s.attendre(500).then(() => {
    const g = s.figurine(a);
    if (g.dort) g.reveiller();
    g.pencher(8, 1700);
    g.gonfler(1.03, 1300);
    fx.rougir(a, 2400);
  });
  await s.attendre(900);
});

// ─── 🪧 LES PANNEAUX : la figurine les brandit, l'autre réagit ───────────────────────────────────────────────────────
for (const p of PANNEAUX) {
  enregistrerMiseEnScene(`panneau-${p.cle}`, async (s, de) => {
    const a = autreQue(de);
    const { fx } = s;
    const f = s.figurine(de);
    const g = s.figurine(a);
    f.sursaut(0.6);
    f.gonfler(1.03, 1600);
    s.sons.clac();
    const brandi = fx.pancarte(de, p.texte, 2600);
    await s.attendre(700);
    const hautA = s.repere(a, "haut");
    const teteA = s.repere(a, "tete");
    // (l'autre réagit — même endormie, elle bouge un peu)
    if (g.dort && p.cle !== "pasdispo") g.reveiller();
    switch (p.cle) {
      case "mdr":
        g.rire(1.4);
        f.rire(1.2);
        fx.jaillir("😂", { x: hautA.x, y: hautA.y + 0.02 }, 2, { taille: 4 });
        break;
      case "jarrive":
        f.bondir(0.8);
        g.pencher(8, 1400);
        fx.texteQuiMonte("!", { x: hautA.x, y: hautA.y }, { taille: 4.4, c: "#ffe27a" });
        break;
      case "rappelle":
        g.pencher(9, 1500);
        fx.jaillir("📞", { x: hautA.x, y: hautA.y + 0.02 }, 1, { taille: 4 });
        break;
      case "bravo":
        g.bondir(0.6);
        g.gonfler(1.05, 1400);
        fx.jaillir("👏", { x: hautA.x, y: hautA.y + 0.02 }, 2, { taille: 4 });
        fx.etincelles(teteA, 8, { t: 0.8 });
        break;
      case "pasdispo":
        g.secouer(0.4);
        fx.zZz(de);
        break;
      case "pense":
        fx.eclatCoeurs(teteA, 8);
        fx.rougir(a, 2200);
        g.pencher(8, 1700);
        break;
      case "merci":
        g.pencher(10, 1500);
        fx.rougir(a, 2000);
        fx.jaillir("🥰", { x: hautA.x, y: hautA.y + 0.02 }, 1, { taille: 3.8 });
        break;
      case "cesoir":
        g.pencher(11, 1500);
        fx.texteQuiMonte("?", { x: hautA.x - versLAutre(s, de) * 0.07, y: hautA.y + 0.03 }, { taille: 4.2, c: "#ffe27a" });
        break;
    }
    await brandi;
  });
}

// ─── 👏 LES RÉACTIONS AVEC LE CORPS (un appui long sur sa bulle) : `reaction-<clé>` ────────────────────────────────────
enregistrerMiseEnScene("reaction-applaudir", async (s, de) => {
  const f = s.figurine(de);
  const h = s.repere(de, "haut");
  f.bondir(0.6);
  f.gonfler(1.04, 1200);
  s.fx.jaillir("👏", { x: h.x, y: h.y + 0.02 }, 3, { taille: 4 });
  for (let i = 0; i < 6; i++) void s.attendre(i * 150).then(() => s.sons.bruit(45, 0.12, 2400, 1.2));
  await s.attendre(1300);
});
enregistrerMiseEnScene("reaction-mdr", async (s, de) => {
  const h = s.repere(de, "haut");
  s.figurine(de).rire(1.6);
  s.fx.jaillir("😂", { x: h.x, y: h.y + 0.02 }, 2, { taille: 4 });
  s.sons.jingle("rire");
  await s.attendre(1600);
});
enregistrerMiseEnScene("reaction-coeur", async (s, de) => {
  const f = s.figurine(de);
  f.pencher(9, 1500);
  f.gonfler(1.04, 1200);
  s.fx.eclatCoeurs(s.repere(de, "tete"), 10);
  s.fx.rougir(de, 1800);
  s.sons.jingle("amour");
  await s.attendre(1400);
});
enregistrerMiseEnScene("reaction-check", async (s, de) => {
  const { fx } = s;
  const U = fx.u;
  const dir = versLAutre(s, de);
  const p0 = fx.px(s.repere(de, "main"));
  const m = fx.px(s.milieu());
  await fx.acteur({ e: "✋", duree: 0.5, pos: (u) => ({ x: p0.x + (m.x - p0.x) * ease.out(u), y: p0.y + (m.y - p0.y) * ease.out(u) }), taille: (u) => U() * (5 + 3 * u), rot: () => dir * 0.2 });
  fx.anneau(s.milieu(), "rgba(255,240,200,.95)", 10);
  fx.etincelles(s.milieu(), 8);
  s.sons.clac();
  s.figurine(autreQue(de)).sursaut(0.6);
  await fx.acteur({ e: "✋", duree: 0.35, pos: () => m, taille: () => U() * 8, rot: () => dir * 0.2, alpha: (u) => 1 - u });
});
enregistrerMiseEnScene("reaction-front", async (s, de) => {
  const h = s.repere(de, "haut");
  const f = s.figurine(de);
  f.secouer(0.8);
  f.pencher(-6, 1200);
  s.fx.jaillir("🤦", { x: h.x, y: h.y + 0.02 }, 1, { taille: 4.4 });
  s.sons.bruit(70, 0.1, 600);
  await s.attendre(1300);
});
enregistrerMiseEnScene("reaction-waouh", async (s, de) => {
  const h = s.repere(de, "haut");
  const f = s.figurine(de);
  f.sursaut(1.2);
  f.gonfler(1.08, 900);
  s.fx.jaillir("😮", { x: h.x, y: h.y + 0.02 }, 1, { taille: 4.4 });
  s.fx.etincelles(s.repere(de, "tete"), 8, { t: 0.8 });
  s.sons.note(660, 0, 0.12, 0.03);
  s.sons.note(990, 0.1, 0.2, 0.03);
  await s.attendre(1200);
});

// ─── 🛋️ ENSEMBLE ─────────────────────────────────────────────────────────────────────────────────────────────────────
enregistrerMiseEnScene("calin", async (s) => {
  const { fx } = s;
  const U = fx.u;
  const milieu = s.milieu();
  for (const q of ["moi", "autre"] as const) {
    const g = s.figurine(q);
    if (g.dort) g.reveiller();
  }
  fx.lettrage("Câlin !", { x: milieu.x, y: milieu.y - 0.11 }, { couleur: "rose", rot: -4, taille: 0.07, duree: 2000 });
  s.sons.jingle("amour");
  for (const q of ["moi", "autre"] as const) {
    const g = s.figurine(q);
    g.pencherCorps(7, 2600);
    g.rapprocher(0.032, 2600);
    g.pencher(13, 2600);
    g.gonfler(1.03, 2400);
  }
  fx.anneau(decale(milieu, 0, 0.03), "rgba(255,170,210,.75)", 16);
  for (let n = 0; n < 10; n++)
    void s.attendre(n * 220).then(() => {
      const c = fx.px({ x: milieu.x + hasard(-0.09, 0.09), y: milieu.y + hasard(-0.02, 0.06) });
      fx.part({ k: "coeur", x: c.x, y: c.y, vx: hasard(-20, 20), vy: -hasard(40, 80), s: U() * hasard(2.2, 3.6), c: n % 2 ? ROSES : ROUGES, vie: 1.4, vr: hasard(-1, 1) });
    });
  void s.attendre(500).then(() => {
    fx.rougir("moi", 2400);
    fx.rougir("autre", 2400);
  });
  await s.attendre(2700);
  s.figurine("moi").bondir(0.5);
  s.figurine("autre").bondir(0.5);
  await s.attendre(300);
});

// 📸 PHOTO À DEUX (lot S6) : elles se rapprochent, « Cheese ! », le flash et le déclic. La photo, elle, se fait dans le
// téléphone de celui qui l'a demandée (`photo-a-deux.ts`), au moment du flash, et s'accroche au mur.
/** Quand le flash part, après le début de la mise en scène (la photo se prend à cet instant). */
export const FLASH_PHOTO_MS = 950;
enregistrerMiseEnScene("selfie", async (s) => {
  const { fx } = s;
  const m = s.milieu();
  for (const q of ["moi", "autre"] as const) {
    const g = s.figurine(q);
    if (g.dort) g.reveiller();
    g.rapprocher(0.03, 2100);
    g.pencher(11, 2100);
    g.gonfler(1.03, 1900);
  }
  fx.lettrage("Cheese !", { x: m.x, y: m.y - 0.13 }, { couleur: "jaune", rot: 4, taille: 0.065, duree: 900 });
  await s.attendre(FLASH_PHOTO_MS);
  fx.flash(m, 170);
  s.sons.bruit(60, 0.22, 3400);
  await s.attendre(1150);
  s.figurine("moi").bondir(0.4);
  s.figurine("autre").bondir(0.4);
  await s.attendre(250);
});

enregistrerMiseEnScene("cafe", async (s, de) => {
  const { fx } = s;
  const U = fx.u;
  const o = objetPour(de, "cafe");
  s.figurine(de).pencher(5, 1000);
  const ici = poserSiVoulu(s, o, "glisse");
  const dir = s.repere(de, "tete").x < ici.x ? 1 : -1;
  const fin = fx.px(decale(ici, 0, -0.02));
  s.sons.bruit(260, 0.05, 700, 0.7);
  let emis = 0;
  await fx.acteur({
    duree: 0.5,
    pos: (u) => ({ x: fin.x - dir * U() * 13 * (1 - ease.out(u)), y: fin.y }),
    trainee: (q, dt, u) => {
      emis += dt;
      if (u < 0.8 && emis > 0.02) {
        emis = 0;
        fx.part({ k: "trait", x: q.x - dir * U() * 2.5, y: q.y + hasard(-U(), U()), vx: dir * 200, vy: 0, s: U() * hasard(3, 5), l: U() * 0.3, c: "rgba(255,240,220,.8)", vie: 0.2 });
      }
    },
  });
  s.sons.clac();
  const c = fx.px(decale(ici, 0, -0.005));
  for (let k = 0; k < 6; k++) {
    const ang = (Math.PI * 2 * k) / 6;
    fx.part({ k: "rond", x: c.x, y: c.y, vx: Math.cos(ang) * 50, vy: -Math.abs(Math.sin(ang)) * 25, fr: 0.9, s: U() * 0.8, c: "rgba(255,245,230,.8)", vie: 0.5 });
  }
  // (deux tasses sur la table : la pause café)
  if (s.surTable.filter((x) => x.e === "☕").length >= 2) {
    await s.attendre(350);
    const m = s.milieu();
    fx.lettrage("Pause café !", { x: m.x, y: m.y }, { couleur: "jaune", rot: -5, taille: 0.05, duree: 1300 });
    s.sons.jingle("joie");
  }
  await s.attendre(500);
});

/** 🎶 Une petite ritournelle (pas de voix) le temps de la danse. */
function ritournelle(s: Scene, sec: number) {
  const motif = [523, 659, 784, 659, 587, 698, 880, 698];
  const pas = 0.19;
  for (let i = 0; i * pas < sec; i++) {
    s.sons.note(motif[i % motif.length], i * pas, 0.16, 0.03, "square");
    if (i % 2 === 0) s.sons.note(131 * (i % 8 < 4 ? 1 : 1.5), i * pas, 0.12, 0.035, "triangle");
  }
}
enregistrerMiseEnScene("danser", async (s) => {
  const { fx } = s;
  const milieu = s.milieu();
  for (const q of ["moi", "autre"] as const) {
    const g = s.figurine(q);
    if (g.dort) g.reveiller();
    g.danser(5.2);
  }
  fx.lettrage("On danse !", { x: milieu.x, y: milieu.y - 0.11 }, { couleur: "jaune", rot: -6, taille: 0.075, duree: 1800 });
  ritournelle(s, 5);
  for (let n = 0; n < 14; n++)
    void s.attendre(n * 380).then(() => {
      fx.texteQuiMonte(n % 2 ? "♪" : "♫", { x: milieu.x + hasard(-0.14, 0.14), y: milieu.y + hasard(-0.02, 0.06) }, { taille: 4, c: n % 3 ? "#ffe27a" : "#ff9cc8", v: 30 });
      if (n % 3 === 0) fx.etincelles({ x: milieu.x + hasard(-0.2, 0.2), y: milieu.y - hasard(0.05, 0.15) }, 5, { t: 0.7 });
    });
  await s.attendre(5300);
});

enregistrerMiseEnScene("surprise", async (s, de) => {
  const { fx } = s;
  const U = fx.u;
  const o = objetPour(de, "surprise");
  const ici = s.placeLibre(de);
  const c = fx.px(decale(ici, 0, -0.03));
  const chute = fx.px({ x: 0, y: 0.2 }).y;
  // (le paquet tombe sur la table, se trémousse trois fois…)
  s.sons.bruit(160, 0.06, 500);
  await fx.acteur({ e: "🎁", duree: 0.55, pos: (u) => ({ x: c.x, y: c.y - chute * (1 - ease.in(u)) }), taille: () => U() * 6, rot: () => 0, alpha: (u) => Math.min(1, u * 3) });
  s.sons.clac();
  await fx.acteur({
    e: "🎁",
    duree: 1.4,
    pos: (u) => ({ x: c.x, y: c.y - Math.abs(Math.sin(u * Math.PI * 3)) * U() * 1.2 }),
    taille: (u) => U() * (6 + 0.5 * Math.abs(Math.sin(u * Math.PI * 3))),
    rot: (u) => Math.sin(u * Math.PI * 6) * 0.22,
  });
  // (… et s'ouvre : des confettis, « Surprise ! », ce qu'elle cachait monte, puis se pose)
  fx.part({ k: "flash", x: c.x, y: c.y, s: U() * 12, vie: 0.3, fondu: (k) => 1 - k });
  const couleurs = ["#ff5fa8", "#ffd23f", "#5ee0c9", "#7b6cff", "#fff"];
  for (let n = 0; n < 24; n++) {
    const ang = (Math.PI * 2 * n) / 24 + hasard(-0.3, 0.3);
    fx.part({ k: "rond", x: c.x, y: c.y, vx: Math.cos(ang) * hasard(80, 200), vy: Math.sin(ang) * hasard(80, 200) - 120, ay: 380, fr: 0.97, s: U() * hasard(0.5, 0.9), c: couleurs[n % 5], vie: 1.3 });
  }
  fx.lettrage("Surprise !", { x: ici.x, y: ici.y - 0.15 }, { couleur: "jaune", rot: -6, taille: 0.07, duree: 1800 });
  s.sons.jingle("euphorie");
  const g = s.figurine(autreQue(de));
  if (g.dort) g.reveiller();
  g.sursaut(1);
  g.gonfler(1.05, 1400);
  const monte = fx.px({ x: 0, y: 0.08 }).y;
  await fx.acteur({
    e: o.e,
    duree: 1.1,
    pos: (u) => ({ x: c.x, y: c.y - monte * ease.out(u) }),
    taille: (u) => U() * (3 + 6 * ease.back(Math.min(1, u * 1.4))),
    rot: (_u, t) => Math.sin(t * 5) * 0.15,
    trainee: (q) => {
      if (Math.random() < 0.5) fx.part({ k: "etoile", x: q.x + hasard(-10, 10), y: q.y + hasard(-10, 10), s: U() * 2, c: "#fff3b0", vie: 0.6 });
    },
  });
  poserSiVoulu(s, o, "tombe");
  await s.attendre(500);
});
