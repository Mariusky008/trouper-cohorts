# LA PAUSE. Pendant la démo, le commerçant pose une question : un appui sur ⏸ fige toute la page là où elle
# est (sa voix, ses mots, ses animations, les films, les minuteries), et « Reprendre » la relance au même
# instant. Le bouton est dans la barre du bas de la démo (à côté de « i ») et en haut de l'intro (à côté de
# « Passer ») ; au clavier, Espace ou P. Pendant la pause, un voile retient les appuis : rien ne démarre.
#
# On n'arrête pas les scènes une à une : on arrête le temps de la page. Avant tout le reste du script,
# setTimeout / setInterval sont remplacés par des minuteries qui savent s'arrêter et repartir avec le temps
# qui leur restait ; performance.now et requestAnimationFrame ignorent le temps passé en pause ; le contexte
# audio (sa voix, dont les mots suivent l'horloge, et les petits sons) est suspendu ; les animations CSS et
# les films en cours sont mis en pause, puis relancés, eux seuls.
# À lancer en dernier, après tour-trois.py (même index.html), sur les six tours :
#   python3 -I tour-pause.py <dossier>
import sys

S = sys.argv[1]
TOURS = ["tour", "tour-vetements", "tour-coiffure", "tour-librairie", "tour-bijouterie", "tour-lunettes"]

ICONE_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4.5" width="4.2" height="15" rx="1.2"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2"/></svg>'
ICONE_LIRE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.8v14.4c0 .8.9 1.3 1.6.9l11.3-7.2c.6-.4.6-1.4 0-1.8L8.6 3.9C7.9 3.5 7 4 7 4.8Z"/></svg>'

CSS = """
/* ═══ LA PAUSE (tour-pause.py) ═══ */
.pause-b{width:40px;flex:none;display:grid;place-items:center}
.pause-b svg,.intro .intro-pause svg{width:15px;height:15px;fill:currentColor}
.intro .intro-pause{flex:none;width:36px;height:36px;display:grid;place-items:center;border-radius:999px;color:#fff;background:rgba(255,255,255,.1);
  border:1px solid rgba(255,255,255,.18);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.gel{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:10px;
  padding:0 16px calc(env(safe-area-inset-bottom,0px) + 34px);background:rgba(12,6,10,.34);-webkit-backdrop-filter:saturate(.7);backdrop-filter:saturate(.7);
  animation:gel-entre .25s ease-out}
.gel[hidden]{display:none}
@keyframes gel-entre{from{opacity:0}}
.gel-reprendre{display:inline-flex;align-items:center;gap:10px;padding:15px 28px;border:0;border-radius:999px;font-family:inherit;font-weight:800;font-size:17px;
  color:#fff;background:linear-gradient(135deg,#FF4FAE,#E0167A);box-shadow:0 12px 30px rgba(255,46,154,.4);cursor:pointer}
.gel-reprendre svg{width:16px;height:16px;fill:#fff}
.gel small{font-size:13px;font-weight:700;color:rgba(255,255,255,.88);text-shadow:0 1px 4px rgba(0,0,0,.6)}
"""

VOILE = (f'<div class="gel" id="gel" role="dialog" aria-label="Démo en pause" hidden><button type="button" class="gel-reprendre" id="gel-reprendre">'
         f'{ICONE_LIRE}Reprendre</button><small>Démo en pause</small></div>\n')

JS = """
  /* ═══ LA PAUSE (tour-pause.py) ═══
     Un appui sur ⏸ fige la page entière, « Reprendre » la relance au même instant. Ce bloc passe AVANT tout
     le reste : les minuteries posées ensuite sont déjà les siennes. Le temps passé en pause n'existe pas
     (performance.now, requestAnimationFrame) ; le contexte audio est suspendu (sa voix et ses mots, qui
     suivent son horloge) ; les animations CSS et les films en cours s'arrêtent, puis repartent, eux seuls. */
  const GEL = (() => {
    const vrai = { st: setTimeout.bind(window), ct: clearTimeout.bind(window), raf: requestAnimationFrame.bind(window),
      caf: cancelAnimationFrame.bind(window), now: performance.now.bind(performance) };
    const minut = new Map(), images = new Map(), enAttente = new Set();
    let fige = false, debut = 0, decal = 0, n = 1e6, animations = [], films = [], sonGele = false;
    // une minuterie : son échéance, et ce qui lui reste quand on fige
    const armer = (id, t) => {
      t.reel = vrai.st(() => {
        if (!minut.has(id)) return;
        if (t.p) { t.fin = vrai.now() + t.p; armer(id, t); } else minut.delete(id);
        t.fn(...t.a);
      }, Math.max(0, t.fin - vrai.now()));
    };
    const poser = (repete) => (fn, ms, ...a) => {
      if (typeof fn !== "function") return vrai.st(fn, ms);
      const d = Math.max(0, +ms || 0), id = ++n, t = { fn, a, p: repete ? Math.max(d, 4) : 0, fin: vrai.now() + d, reste: d };
      minut.set(id, t);
      if (!fige) armer(id, t);
      return id;
    };
    const oter = (id) => { const t = minut.get(id); if (t) { vrai.ct(t.reel); minut.delete(id); } else vrai.ct(id); };
    window.setTimeout = poser(false); window.setInterval = poser(true);
    window.clearTimeout = oter; window.clearInterval = oter;
    performance.now = () => (fige ? debut : vrai.now()) - decal;
    window.requestAnimationFrame = (cb) => {
      const id = ++n, r = { reel: 0 };
      r.go = (ts) => { if (!images.has(id)) return; if (fige) { r.reel = 0; enAttente.add(id); return; } images.delete(id); cb(ts - decal); };
      images.set(id, r);
      if (fige) enAttente.add(id); else r.reel = vrai.raf(r.go);
      return id;
    };
    window.cancelAnimationFrame = (id) => { const r = images.get(id); if (r) { if (r.reel) vrai.caf(r.reel); images.delete(id); enAttente.delete(id); } else vrai.caf(id); };

    function figer() {
      if (fige) return;
      fige = true; debut = vrai.now();
      minut.forEach((t) => { vrai.ct(t.reel); t.reste = Math.max(0, t.fin - debut); });
      images.forEach((r, id) => { if (r.reel) { vrai.caf(r.reel); r.reel = 0; enAttente.add(id); } });
      animations = document.getAnimations ? document.getAnimations().filter((x) => x.playState === "running") : [];
      animations.forEach((x) => x.pause());
      films = [...document.querySelectorAll("video, audio")].filter((m) => !m.paused && !m.ended);
      films.forEach((m) => m.pause());
      sonGele = !!(ac && ac.state === "running");
      if (sonGele) Promise.resolve(ac.suspend()).catch(() => {});
    }
    function relancer() {
      if (!fige) return;
      const t0 = vrai.now();
      decal += t0 - debut; fige = false;
      if (sonGele) Promise.resolve(ac.resume()).catch(() => {});
      films.forEach((m) => { const p = m.play(); if (p) p.catch(() => {}); });
      animations.forEach((x) => { if (x.playState === "paused") x.play(); });
      minut.forEach((t, id) => { t.fin = t0 + t.reste; armer(id, t); });
      enAttente.forEach((id) => { const r = images.get(id); if (r) r.reel = vrai.raf(r.go); });
      enAttente.clear(); animations = []; films = []; sonGele = false;
    }

    const voile = document.getElementById("gel"), reprendre = document.getElementById("gel-reprendre");
    function entrer() { figer(); voile.hidden = false; reprendre.focus({ preventScroll: true }); }
    function sortir() { voile.hidden = true; relancer(); }
    ["pause", "intro-pause"].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.addEventListener("click", (e) => { e.stopPropagation(); entrer(); });
    });
    reprendre.addEventListener("click", (e) => { e.stopPropagation(); sortir(); });
    // le voile retient tout appui : rien ne démarre pendant la pause
    ["click", "pointerdown", "touchstart"].forEach((ev) => voile.addEventListener(ev, (e) => { if (e.target !== reprendre && !reprendre.contains(e.target)) e.stopPropagation(); }));
    // au clavier (Mac, iPad avec clavier) : Espace ou P, sauf en écrivant
    document.addEventListener("keydown", (e) => {
      if (e.key !== " " && e.key !== "p" && e.key !== "P") return;
      const c = e.target;
      if (c && (/^(INPUT|TEXTAREA|SELECT)$/.test(c.tagName) || c.isContentEditable)) return;
      e.preventDefault(); e.stopPropagation();
      fige ? sortir() : entrer();
    }, true);
    return { fige: () => fige };
  })();
"""


def une_fois(t, avant, apres, quoi):
    if t.count(avant) != 1:
        raise SystemExit(f"{quoi} : {t.count(avant)} fois")
    return t.replace(avant, apres)


for d in TOURS:
    page = f"{S}/{d}/index.html"
    t = open(page, encoding="utf-8").read()
    if "/* ═══ LA PAUSE (tour-pause.py) ═══ */" in t:
        print(d, "· la pause : déjà posée (relancer la chaîne depuis tour-episode2.py pour la refaire)")
        continue
    t = une_fois(t, "</style>\n", CSS.lstrip("\n") + "</style>\n", f"{d} style")
    # dans la barre du bas de la démo, à côté de « i »
    t = une_fois(t, '<span class="vide" aria-hidden="true"></span>\n',
                 '<span class="vide" aria-hidden="true"></span>\n'
                 f'      <button type="button" class="pause-b" id="pause" aria-label="Mettre la démo en pause">{ICONE_PAUSE}</button>\n', f"{d} barre")
    # en haut de l'intro, à côté de « Passer »
    t = une_fois(t, '<button type="button" class="intro-passer" id="intro-passer">Passer ›</button>',
                 f'<button type="button" class="intro-pause" id="intro-pause" aria-label="Mettre la démo en pause">{ICONE_PAUSE}</button>'
                 '<button type="button" class="intro-passer" id="intro-passer">Passer ›</button>', f"{d} intro")
    t = une_fois(t, "<script>\n", VOILE + "<script>\n", f"{d} voile")
    t = une_fois(t, '  "use strict";\n', '  "use strict";\n' + JS.lstrip("\n"), f"{d} js")
    # pendant la pause, un petit son ne doit pas réveiller le contexte audio
    t = une_fois(t, 'if (ac && ac.state === "suspended") ac.resume();', 'if (ac && ac.state === "suspended" && !GEL.fige()) ac.resume();', f"{d} contexte")
    open(page, "w", encoding="utf-8").write(t)
    print(d, "· la pause : posée")
