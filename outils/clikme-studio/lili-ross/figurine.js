// figurine.js — la figurine d'Halloween de Lili Ross, présentatrice du film.
// Elle n'a pas de voix (jamais de voix fabriquée) : elle parle par bulles. Son ressort est dessiné ici pour rebondir.
// Le film d'origine (scene.html, 21 s) commence après son intro : T_film = T − D.
(() => {
  const D = 3.5;
  const $ = (s) => document.querySelector(s);
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, a, b) => cl((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const oCub = (k) => 1 - Math.pow(1 - k, 3);
  const ioCub = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const oBack = (k, s = 1.7) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
  const ressortAmorti = (t, ampl, tau, f) => (t < 0 ? 0 : ampl * Math.exp(-t / tau) * Math.cos(2 * Math.PI * f * t));
  const tangage = (t, ampl, tau, f) => (t < 0 ? 0 : ampl * Math.exp(-t / tau) * Math.sin(2 * Math.PI * f * t));

  // la boîte de la figurine (px de l'image détourée)
  const FW = 380, FH = 1019, BAS = { x: 187, y: 942 }, ATT = { x: 187, y: 786 }, LONG = BAS.y - ATT.y;

  // ───── styles + éléments ─────
  const st = document.createElement("style");
  st.textContent = `
#cadre.avec-figurine #fin{justify-content:flex-start;padding-top:290px} /* la carte de fin laisse sa place à la figurine */
#intro{z-index:55;opacity:0;background:radial-gradient(70% 45% at 50% 62%,#FFF3F5 0%,#F8DCE2 45%,#EEC2CC 100%)}
#intro::before{content:"";position:absolute;left:0;right:0;top:1600px;bottom:0;background:linear-gradient(180deg,rgba(214,150,168,0),rgba(214,150,168,.35))}
#intro .lumiere{position:absolute;left:140px;top:420px;width:800px;height:1300px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.75),rgba(255,255,255,0));filter:blur(10px)}
#intro .et{position:absolute;font:400 46px/1 "PF";color:#fff;text-shadow:0 0 16px rgba(255,255,255,.9);opacity:0}
#intro .marque-intro{position:absolute;left:0;right:0;top:190px;text-align:center;font:600 26px/1 "PO";letter-spacing:.46em;padding-left:.46em;text-transform:uppercase;color:#B4657E;opacity:0}
#ombreFig{position:absolute;z-index:56;border-radius:50%;background:radial-gradient(closest-side,rgba(70,20,40,.42),rgba(70,20,40,0));opacity:0}
#fig{position:absolute;left:0;top:0;width:${FW}px;height:${FH}px;z-index:57;transform-origin:0 0;opacity:0}
#fig img,#fig svg{position:absolute;left:0;top:0;width:${FW}px;height:${FH}px}
#fig .corps{transform-origin:${ATT.x}px ${ATT.y}px}
.bulle{position:absolute;z-index:58;padding:26px 40px 28px;border-radius:46px;background:#fff;color:#3A1F2E;font:600 58px/1.15 "PO";white-space:nowrap;
  box-shadow:0 22px 44px rgba(90,30,50,.22),0 3px 8px rgba(90,30,50,.12);opacity:0;transform-origin:var(--ox,30%) 120%}
.bulle::after{content:"";position:absolute;width:34px;height:34px;background:#fff;border-radius:6px;transform:rotate(45deg);left:var(--qx,30%);bottom:-13px;margin-left:-17px}
.bulle.gauche::after{left:-12px;bottom:auto;top:50%;margin:-17px 0 0}
`;
  document.head.appendChild(st);
  const cadre = $("#cadre");
  cadre.classList.add("avec-figurine");
  const ajoute = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); const e = t.content.firstChild; cadre.insertBefore(e, $("#flash")); return e; };
  const intro = ajoute(`<div id="intro" class="couche"><div class="lumiere"></div><div class="marque-intro">Lili Ross</div></div>`);
  const ETS = [[150, 520, 0.7], [880, 600, 1.0], [110, 1180, 1.3], [930, 1300, 0.85], [820, 380, 1.6], [240, 330, 1.9]];
  const etsIntro = ETS.map(([x, y]) => { const e = document.createElement("div"); e.className = "et"; e.textContent = "✦"; e.style.left = x + "px"; e.style.top = y + "px"; intro.appendChild(e); return e; });
  const ombre = ajoute(`<div id="ombreFig"></div>`);
  const fig = ajoute(`<div id="fig">
    <img class="socle" src="fig/lili-socle.png" alt="">
    <svg class="ressort" viewBox="0 0 ${FW} ${FH}">
      <defs><linearGradient id="acier" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#2d2930"/><stop offset=".28" stop-color="#99939f"/><stop offset=".46" stop-color="#f4f0f6"/>
        <stop offset=".62" stop-color="#aaa4b0"/><stop offset="1" stop-color="#36313b"/></linearGradient></defs>
      <path class="dos" fill="none" stroke="#3b3540" stroke-width="4.5" stroke-linecap="round"/>
      <path class="face" fill="none" stroke="url(#acier)" stroke-width="6.5" stroke-linecap="round"/>
    </svg>
    <img class="corps" src="fig/lili-corps.png" alt="">
  </div>`);
  const corps = fig.querySelector(".corps"), dos = fig.querySelector(".dos"), face = fig.querySelector(".face");

  const BULLES = [ // texte, apparition, disparition, position (gauche, bas de la bulle), pointe (x en %), montée éventuelle
    { t: "Coucou ! 👋", a: 0.55, b: 2.82, x: 590, y: 560, q: 22, monte: [1.5, -160] },
    { t: "Bienvenue chez Lili Ross !", a: 1.5, b: 2.82, x: 150, y: 560, q: 50 },
    { t: "Ce foulard ! 😍", a: 9.28, b: 9.82, x: 620, y: 1165, q: 76, cible: 925 },
    { t: "Et ce bonnet ! 💗", a: 12.78, b: 13.74, x: 600, y: 1165, q: 78, cible: 925 },
    { t: "À très vite ! 👋", a: 22.85, b: 99, x: 570, y: 1150, q: 0, gauche: true },
  ];
  const bulleEls = BULLES.map((b) => {
    const e = document.createElement("div"); e.className = "bulle" + (b.gauche ? " gauche" : ""); e.textContent = b.t;
    e.style.left = b.x + "px"; e.style.setProperty("--qx", b.q + "%"); e.style.setProperty("--ox", b.gauche ? "0%" : b.q + "%");
    if (b.gauche) e.style.transformOrigin = "0% 50%";
    cadre.insertBefore(e, $("#flash")); return e;
  });

  // ───── le ressort : 11 spires le long d'une courbe du socle jusqu'au corps ─────
  function ressort(tx, ty) {
    const L = Math.hypot(tx - BAS.x, ty - BAS.y), cx = BAS.x, cy = BAS.y - L * 0.5;
    let d1 = "", d2 = "";
    for (let k = 0; k < 11; k++) {
      const u = (k + 0.5) / 11;
      const px = (1 - u) ** 2 * BAS.x + 2 * (1 - u) * u * cx + u * u * tx, py = (1 - u) ** 2 * BAS.y + 2 * (1 - u) * u * cy + u * u * ty;
      const dx = 2 * (1 - u) * (cx - BAS.x) + 2 * u * (tx - cx), dy = 2 * (1 - u) * (cy - BAS.y) + 2 * u * (ty - cy);
      const ang = Math.atan2(dy, dx) + Math.PI / 2, rx = 23, ry = 5.5, ax = Math.cos(ang) * rx, ay = Math.sin(ang) * rx, rot = (ang * 180) / Math.PI;
      const a = `M ${(px - ax).toFixed(2)} ${(py - ay).toFixed(2)} A ${rx} ${ry} ${rot.toFixed(2)} 0 `, f = ` ${(px + ax).toFixed(2)} ${(py + ay).toFixed(2)} `;
      d1 += a + "1" + f; d2 += a + "0" + f;
    }
    dos.setAttribute("d", d1); face.setAttribute("d", d2);
  }

  // ───── où est-elle, à l'instant T ? ─────
  // X, Y : le bas du socle à l'écran ; s : échelle ; L : longueur du ressort (1 = au repos) ; phi : son penché (degrés) ; sol : y du sol
  function etat(T) {
    const flottement = 1.4 * Math.sin(2 * Math.PI * 0.7 * T);
    const sursaut = (tb) => -0.08 * Math.sin(Math.PI * seg(T, tb, tb + 0.2));
    if (T < D) { // l'intro : elle tombe, rebondit, parle, puis saute hors champ
      const e = { X: 540, Y: 1700, s: 1.1, L: 1, phi: 0, sol: 1700, op: 1 };
      if (T < 0.3) { const k = seg(T, 0, 0.3); e.Y = lerp(-120, 1700, k * k); e.L = 1.12; }
      else {
        const u = T - 0.3;
        e.L = 1 - ressortAmorti(u, 0.36, 0.3, 2.6) + sursaut(0.55) + sursaut(1.5);
        e.phi = tangage(u, 7, 0.65, 1.3) + flottement * seg(T, 0.6, 1.2);
      }
      if (T >= 2.82) { const k = ioCub(seg(T, 2.82, 3.0)); e.L = lerp(e.L, 0.58, k); e.phi = lerp(e.phi, 0, k); }
      if (T >= 3.0) { const u = T - 3.0; e.Y = 1700 - 2600 * u - 6500 * u * u; e.L = lerp(0.58, 1.22, oCub(seg(T, 3.0, 3.1))); }
      return e;
    }
    const passages = [[9.05, 9.95], [12.55, 13.9]]; // pendant le foulard et le bonnet : elle passe la tête par la droite
    for (const [a, b] of passages) if (T >= a - 0.01 && T < b) {
      const k = oCub(seg(T, a, a + 0.26)), ks = seg(T, b - 0.17, b);
      const e = { X: lerp(1260, 932, k) + 360 * ks * ks, Y: 1720 - Math.sin(Math.PI * seg(T, a, a + 0.26)) * 110, s: 0.5, sol: 1720, op: 1 };
      const u = T - (a + 0.26);
      e.L = 1 - ressortAmorti(u, 0.25, 0.2, 3) + sursaut(a + 0.23 + 0.0);
      e.phi = -7 * k + tangage(u, -9, 0.35, 1.7) + 0.6 * flottement;
      return e;
    }
    if (T >= 18.72) { // le polaroïd, puis la carte de fin
      const e = { X: 905, Y: 1880, s: 0.4, L: 1, phi: -3, sol: 1880, op: 1 };
      if (T < 19.0) { const k = seg(T, 18.72, 19.0); e.Y = lerp(1000, 1880, k * k); e.L = 1.1; e.phi = 0; return e; }
      if (T < 21.82) {
        let L = 1 - ressortAmorti(T - 19.0, 0.3, 0.22, 2.8);
        for (const tb of [19.0, 19.5, 20.0, 20.5, 21.0]) L -= Math.max(0, tangage(T - tb, 0.2, 0.12, 2.6));
        e.L = L; e.phi = -3 + tangage(T - 19.0, -6, 0.5, 1.4) + 0.8 * flottement; return e;
      }
      // le saut jusqu'à la carte de fin
      const k = seg(T, 21.95, 22.42);
      if (T < 21.95) { e.L = lerp(1, 0.62, ioCub(seg(T, 21.82, 21.95))); e.phi = lerp(-3, 0, seg(T, 21.82, 21.95)); return e; }
      if (T < 22.42) {
        e.X = lerp(905, 400, k); e.s = lerp(0.4, 0.63, k); e.Y = lerp(1880, 1600, k) - Math.sin(Math.PI * k) * 520; e.sol = lerp(1880, 1600, k);
        e.L = lerp(1.18, 1.0, k); e.phi = -10 * Math.sin(Math.PI * k); return e;
      }
      const u = T - 22.42;
      return { X: 400, Y: 1600, s: 0.63, sol: 1600, op: 1, L: 1 - ressortAmorti(u, 0.34, 0.3, 2.6) + sursaut(22.85), phi: tangage(u, 6, 0.7, 1.3) + flottement * seg(T, 22.6, 23.2) };
    }
    return null;
  }

  function poserFigurine(T) {
    // le fond de l'intro
    intro.style.opacity = String(T < D ? 1 - seg(T, 3.36, 3.5) : 0);
    intro.querySelector(".marque-intro").style.opacity = String(oCub(seg(T, 0.35, 0.8)) * (1 - seg(T, 2.8, 3.0)));
    etsIntro.forEach((el, i) => {
      const u = T - ETS[i][2] + 0.4, a = u < 0 ? 0 : Math.max(0, Math.sin(Math.min(1, u / 0.8) * Math.PI));
      el.style.opacity = String(a); el.style.transform = `scale(${0.4 + a}) rotate(${u * 80}deg)`;
    });
    const e = etat(T);
    if (!e) { fig.style.opacity = "0"; ombre.style.opacity = "0"; }
    else {
      fig.style.opacity = String(e.op);
      fig.style.transform = `translate(${(e.X - (FW / 2) * e.s).toFixed(2)}px,${(e.Y - FH * e.s).toFixed(2)}px) scale(${e.s.toFixed(4)})`;
      const phi = (e.phi * Math.PI) / 180, l = LONG * e.L;
      const tx = BAS.x + l * Math.sin(phi), ty = BAS.y - l * Math.cos(phi);
      corps.style.transform = `translate(${(tx - ATT.x).toFixed(2)}px,${(ty - ATT.y).toFixed(2)}px) rotate(${(e.phi * 1.25).toFixed(2)}deg)`;
      ressort(tx, ty);
      const haut = cl((e.sol - e.Y) / 700), rx = 210 * e.s * (1 - 0.5 * haut), ry = 34 * e.s * (1 - 0.5 * haut);
      Object.assign(ombre.style, { left: e.X - rx + "px", top: e.sol - ry * 0.9 + "px", width: 2 * rx + "px", height: 2 * ry + "px", opacity: String((1 - haut) * (T > D && T < 18.5 ? 0.55 : 1)) });
    }
    // les bulles
    BULLES.forEach((b, i) => {
      const el = bulleEls[i];
      if (T < b.a || T >= b.b) { el.style.opacity = "0"; return; }
      const k = seg(T, b.a, b.a + 0.28), ks = seg(T, b.b - 0.14, b.b);
      const sc = (k <= 0 ? 0 : oBack(k, 2.2)) * (1 - 0.6 * ks);
      let y = b.y;
      if (b.monte && T >= b.monte[0]) y += b.monte[1] * oCub(seg(T, b.monte[0], b.monte[0] + 0.28));
      el.style.top = (b.gauche ? y - 64 : y - 128) + "px";
      const larg = el.offsetWidth, gauche = Math.min(b.x, 1044 - larg);
      el.style.left = gauche + "px";
      if (b.cible) { const q = cl(b.cible - gauche, 44, larg - 44); el.style.setProperty("--qx", q + "px"); el.style.setProperty("--ox", q + "px"); }
      el.style.opacity = String(cl(k * 3) * (1 - ks));
      el.style.transform = `scale(${sc.toFixed(4)})`;
    });
  }

  const poserFilm = window.poser;
  window.poser = async function (T, n) {
    poserFigurine(T);
    await poserFilm(Math.max(0, T - D), n);
    if (T < D) $("#flash").style.opacity = "0"; // le flash du film n'arrive qu'à sa première image
  };
  const avant = window.pret;
  window.pret = (async () => {
    await avant;
    await Promise.all([...fig.querySelectorAll("img")].map((i) => i.decode().catch(() => {})));
    return true;
  })();
  window.DUREE_TOTALE = 21 + D;
})();
