/**
 * 🛋️ LA GARDE DU GRAND SALON D'ENSEMBLE — le défilement en profondeur.
 *
 * Sur /autour-de-moi, avec cinq salons d'essai en plus de ceux de la démo :
 *   · même position → même scène, quel que soit le chemin (réversible) ;
 *   · pas de saut entre deux petits pas de défilement ;
 *   · le groupe sorti passe DERRIÈRE la bibliothèque, sans étiquette ni zone
 *     touchable ; le suivant entre par le bas ; le défilement est borné ;
 *   · molette lente, rapide, inversion à mi-geste ;
 *   · un glisser du doigt n'ouvre rien, un appui ouvre ;
 *   · au retour de la conversation, la position exacte, même entre deux états.
 *
 * Usage (l'app tourne déjà) :
 *   node scripts/verifier-grand-salon.mjs [largeur] [hauteur] [port]
 * CAPTURES=<dossier> pour garder les images.
 */
import pw from "/opt/node22/lib/node_modules/playwright/index.js";
const { chromium } = pw;
let echecs = 0;
(async () => {
  const D = process.env.CAPTURES || "";
  const W = Number(process.argv[2] || 390), Hh = Number(process.argv[3] || 844);
  const APP = `http://localhost:${process.argv[4] || "3821"}`;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: W, height: Hh }, deviceScaleFactor: 2, hasTouch: true });
  await ctx.addInitScript(() => { try {
    localStorage.setItem('clikme-prenom', 'Marie'); localStorage.setItem('clikme-demo-v1','0'); localStorage.setItem('clikme-vu-v1', JSON.stringify(['accueil']));
    if (!localStorage.getItem('test-pose')) {
      localStorage.setItem('test-pose', '1');
      const sujets = [['Déjeuner de vendredi', ['Karim','Thomas'], '/direct/marche-producteurs.jpg'], ['Une nouvelle coupe ?', ['Nadia','Hugo'], '/direct/accueil/coiffure-apres.jpg'], ['Un verre après le travail ?', ['Sarah','Max','Lina','Paul','Inès'], ''], ['Nos dernières lectures', ['Emma','Louis'], ''], ['Quel bouquet choisir ?', ['Alice','Nadia'], '/direct/bouquet-du-jour.jpg']];
      const s = JSON.parse(localStorage.getItem('clikme-salons-v1') || '{}');
      sujets.forEach(([sujet, avec, photo], i) => {
        const cle = 'test|' + i;
        s[cle] = { cle, sujet, ou: 'Dax', parQui: avec[0], quand: 'Samedi', prive: true, viennent: [], presents: [...avec, 'Marie'], ouvert: true, activite: Date.now() - (i + 5) * 3600_000,
          messages: [{ id: 'm' + i, qui: avec[0], voix: 'ami', texte: 'On y va ensemble ?', quand: '18:00' }], ...(photo ? { photo } : {}) };
      });
      localStorage.setItem('clikme-salons-v1', JSON.stringify(s));
    }
  } catch {}
    document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = 'nextjs-portal{display:none!important}'; document.head.appendChild(st); }); });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('ERREUR', String(e).slice(0, 300)));
  await p.goto(APP + '/autour-de-moi', { waitUntil: 'networkidle', timeout: 300000 });
  await p.waitForTimeout(1500);
  await p.locator('.ap-onglets button', { hasText: /Ensemble/i }).first().click({ force: true }); await p.waitForTimeout(2500);
  const ok = (c, m) => { if (!c) echecs++; console.log((c ? 'OK   ' : 'ÉCHEC') + ' ' + m); };
  const info = await p.evaluate(() => { const g = document.querySelector('.gs'); return { sh: g.scrollHeight, ch: g.clientHeight, n: document.querySelectorAll('.gs-groupe').length }; });
  const pas = Math.round(info.ch * 0.42);
  const max = info.sh - info.ch;
  console.log(W + 'x' + Hh, JSON.stringify(info), 'pas', pas, 'max', max, 'discussions ≈', Math.round(max / pas) + 3);
  const etat = () => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.gs-groupe')].map((g) => [g.dataset.cle, g.style.transform])));
  const aller = async (y) => { await p.evaluate((y) => { document.querySelector('.gs').scrollTop = y; }, y); await p.waitForTimeout(120); };
  await p.evaluate(() => { document.querySelector('.gs').style.scrollSnapType = 'none'; });

  // 1. RÉVERSIBLE : même position → même image, quel que soit le chemin.
  await aller(Math.round(0.37 * pas)); const a = await etat();
  await aller(Math.round(1.8 * pas)); await aller(Math.round(0.9 * pas)); await aller(Math.round(0.37 * pas)); const a2 = await etat();
  ok(JSON.stringify(a) === JSON.stringify(a2), 'réversible : 0.37 → 1.8 → 0.9 → 0.37 redonne exactement la même scène');

  // 2. CONTINU : de petits pas, pas de saut (le centre d'aucun groupe ne bouge de plus de 6 % de l'écran par pas de 8 px).
  let saut = 0; let prec = null;
  for (let y = 0; y <= Math.min(max, 2 * pas); y += 8) {
    await p.evaluate((y) => { document.querySelector('.gs').scrollTop = y; }, y); await p.waitForTimeout(16);
    // (Le groupe qui arrive de derrière le spectateur, encore presque hors champ, va vite par nature : on suit les autres.)
    const e = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.gs-groupe')].filter((g) => Number(g.dataset.place) <= 2.5).map((g) => { const r = g.getBoundingClientRect(); return [g.dataset.cle, [r.x + r.width / 2, r.bottom]]; })));
    if (prec) for (const k in e) if (prec[k]) { const d = Math.hypot(e[k][0] - prec[k][0], e[k][1] - prec[k][1]); if (d > saut) { saut = d; if (process.env.DETAIL) console.log('     saut', y, k, prec[k], e[k]); } }
    prec = e;
  }
  ok(saut < 0.06 * Hh, `continu : plus grand déplacement par pas de 8 px = ${saut.toFixed(1)} px`);

  // 3. DERRIÈRE LA BIBLIOTHÈQUE : à mi-sortie, le groupe est sous la bibliothèque, sans étiquette visible ni zone touchable.
  await aller(Math.round(1.0 * pas));
  const cache = await p.evaluate(() => {
    const bib = document.querySelector('.gs-biblio').getBoundingClientRect();
    const zbib = getComputedStyle(document.querySelector('.gs-biblio')).zIndex;
    return [...document.querySelectorAll('.gs-groupe')].map((g) => {
      const z = Number(g.style.zIndex || g.parentElement.style.zIndex);
      if (Number(g.dataset.place) > -0.9) return null;
      const rs = [...g.querySelectorAll('img')].map((x) => x.getBoundingClientRect());
      const r = { x: Math.min(...rs.map((q) => q.left)), y: Math.min(...rs.map((q) => q.top)), right: Math.max(...rs.map((q) => q.right)), bottom: Math.max(...rs.map((q) => q.bottom)), top: Math.min(...rs.map((q) => q.top)) };
      const pl = document.querySelector(`.gs-plaque[data-cle="${g.dataset.cle}"]`);
      const zo = document.querySelector(`.gs-zone[data-cle="${g.dataset.cle}"]`);
      return { cle: g.dataset.cle, z, zbib: Number(zbib), dedans: r.right <= bib.right + 2 && r.top >= bib.top - 2 && r.bottom <= bib.bottom + 2,
        plaque: pl ? getComputedStyle(pl).visibility + '/' + pl.style.opacity : 'aucune', zone: zo ? zo.style.pointerEvents : 'aucune', r: [r.x, r.y, r.right, r.bottom].map(Math.round), bib: [bib.right, bib.bottom].map(Math.round) };
    });
  });
  const partis = cache.filter(Boolean);
  console.log('     groupes partis :', JSON.stringify(partis));
  ok(partis.length > 0 && partis.every((c) => c.z < c.zbib && c.dedans && c.plaque !== 'visible/1' && c.zone !== 'auto'), 'le groupe sorti est derrière la bibliothèque, sans étiquette ni zone touchable');
  console.log('     (tous les groupes :', cache.length, ')');
  const visibles = await p.evaluate(() => [...document.querySelectorAll('.gs-plaque')].filter((x) => getComputedStyle(x).visibility === 'visible' && Number(x.style.opacity) > 0.01).length);
  console.log('     étiquettes visibles :', visibles, ' groupes dessinés :', cache.length);
  if (D) await p.screenshot({ path: `${D}/v-${W}-1.0.png` });

  // 4. ENTRÉE PAR LE BAS : le prochain groupe arrive de sous l'écran.
  await aller(Math.round(1.5 * pas));
  const bas = await p.evaluate(() => [...document.querySelectorAll('.gs-groupe')].map((g) => [g.dataset.cle, Number(g.dataset.place), Math.round(Math.min(...[...g.querySelectorAll('img')].map((x) => x.getBoundingClientRect().top)))]).sort((a, b) => b[1] - a[1])[0]);
  ok(bas[1] > 2 && bas[2] > Hh * 0.45, `à mi-pas, le groupe qui entre monte par le bas de l'écran (haut à ${bas[2]} px)`);
  if (D) await p.screenshot({ path: `${D}/v-${W}-1.5.png` });

  // 4 bis. AUCUNE ÉTIQUETTE SUR UN VISAGE, à chaque pas du mouvement (le visage : le haut
  // du fantôme, sur 55 % de sa hauteur), et les étiquettes visibles restent dans l'écran.
  let visages = 0; let dehors = 0;
  for (let f = 0; f <= 2; f += 0.1) {
    await p.evaluate((y) => { document.querySelector('.gs').scrollTop = y; }, Math.round(f * pas)); await p.waitForTimeout(40);
    const r = await p.evaluate(() => {
      const pl = [...document.querySelectorAll('.gs-plaque')].filter((x) => getComputedStyle(x).visibility === 'visible' && Number(x.style.opacity) > 0.5).map((x) => x.getBoundingClientRect());
      const bib = document.querySelector('.gs-biblio').getBoundingClientRect();
      const cache = (x) => { const g = x.closest('.gs-groupe'); const r = x.getBoundingClientRect(); return Number(g.dataset.place) < -0.5 && r.left >= bib.left - 2 && r.right <= bib.right + 2; };
      const vis = [...document.querySelectorAll('.gs-fantome')].filter((x) => !cache(x)).map((x) => x.getBoundingClientRect()).filter((v) => v.bottom > 0 && v.top < innerHeight && v.height > 14).map((v) => ({ l: v.left + v.width * 0.15, r: v.right - v.width * 0.15, t: v.top + v.height * 0.05, b: v.top + v.height * 0.55 }));
      const sur = pl.filter((a) => vis.some((v) => a.left < v.r - 2 && a.right > v.l + 2 && a.top < v.b - 2 && a.bottom > v.t + 2));
      return { sur: sur.length, detail: sur.map((a) => [Math.round(a.left), Math.round(a.top), Math.round(a.right), Math.round(a.bottom)] + ' sur ' + vis.filter((v) => a.left < v.r - 2 && a.right > v.l + 2 && a.top < v.b - 2 && a.bottom > v.t + 2).map((v) => [v.l, v.t, v.r, v.b].map(Math.round))).join(' '), dehors: pl.filter((a) => a.left < -1 || a.right > innerWidth + 1).length };
    });
    visages += r.sur; dehors += r.dehors;
    if (r.sur && process.env.DETAIL) console.log('     visage couvert à', f.toFixed(1), r.detail);
  }
  ok(visages === 0, `aucune étiquette sur un visage pendant le mouvement (${visages} cas sur 21 pas)`);
  ok(dehors === 0, `les étiquettes restent dans l'écran (${dehors} cas)`);

  // 5. BORNÉ : pas au-delà de la dernière discussion.
  await aller(max + 2000);
  const fin = await p.evaluate(() => document.querySelector('.gs').scrollTop);
  ok(Math.abs(fin - max) < 2, `borné : défilement arrêté à ${fin} (max ${max})`);
  if (D) await p.screenshot({ path: `${D}/v-${W}-fin.png` });

  // 6. VRAI DÉFILEMENT À LA MOLETTE avec accrochage : lent puis rapide, puis inversion à mi-geste.
  await p.evaluate(() => { document.querySelector('.gs').style.scrollSnapType = ''; });
  await aller(0); await p.mouse.move(W / 2, Hh / 2);
  for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 12); await p.waitForTimeout(40); }
  await p.waitForTimeout(900);
  const lent = await p.evaluate(() => document.querySelector('.gs').scrollTop);
  await p.mouse.wheel(0, 700); await p.waitForTimeout(1200);
  const rapide = await p.evaluate(() => document.querySelector('.gs').scrollTop);
  console.log(`     molette lente (144 px) → ${lent} ; rapide (+700) → ${rapide} ; pas ${pas}`);
  for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, 30); await p.waitForTimeout(30); }
  for (let i = 0; i < 5; i++) { await p.mouse.wheel(0, -30); await p.waitForTimeout(30); }
  await p.waitForTimeout(1200);
  const inv = await p.evaluate(() => document.querySelector('.gs').scrollTop);
  ok(Math.abs(inv - rapide) < pas * 0.5, `inversion à mi-geste : revient à ${inv} (départ ${rapide})`);

  // 7. UN GLISSER DU DOIGT N'OUVRE PAS ; un appui ouvre.
  await aller(Math.round(1 * pas)); await p.waitForTimeout(600);
  const avant = await p.evaluate(() => document.querySelector('.gs').scrollTop);
  const cdp = await ctx.newCDPSession(p);
  const tp = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: W / 2, y }] });
  await tp('touchStart', Hh * 0.7);
  for (let k = 1; k <= 10; k++) { await tp('touchMove', Hh * 0.7 - k * pas * 0.08); await p.waitForTimeout(16); }
  await tp('touchEnd'); await p.waitForTimeout(1200);
  const apres = await p.evaluate(() => ({ y: document.querySelector('.gs').scrollTop, ouvert: !!document.querySelector('.ap-page.feuille') }));
  ok(!apres.ouvert && apres.y !== avant, `glisser : défile (${avant} → ${apres.y}) et n'ouvre rien`);

  // 7 bis. LE BOUTON NE COUVRE PAS LA TABLE : au repos, le groupe du premier plan s'arrête au-dessus de lui.
  await p.evaluate(() => { document.querySelector('.gs').style.scrollSnapType = 'none'; });
  await aller(Math.round(2 * pas)); await p.waitForTimeout(400);
  const table = await p.evaluate(() => {
    const cta = [...document.querySelectorAll('.gs-cta')].find((x) => Number(x.style.opacity) > 0.5);
    const g = [...document.querySelectorAll('.gs-groupe')].find((x) => Math.abs(Number(x.dataset.place) - 2) < 0.01);
    const t = g && [...g.querySelectorAll('img')].find((x) => /table/.test(x.src));
    return cta && t ? { cta: Math.round(cta.getBoundingClientRect().top), pied: Math.round(t.getBoundingClientRect().bottom) } : null;
  });
  ok(table && table.pied <= table.cta + 2, `le bouton ne couvre pas la table (pied de la table ${table?.pied}, bouton à ${table?.cta})`);

  // 8. RETOUR D'UNE CONVERSATION : la position exacte, même entre deux états.
  await p.evaluate(() => { document.querySelector('.gs').style.scrollSnapType = 'none'; });
  await aller(Math.round(1.37 * pas)); await p.waitForTimeout(300);
  const garde = await p.evaluate(() => document.querySelector('.gs').scrollTop);
  const scene1 = await etat();
  const bas1 = await p.evaluate(() => [document.querySelector('.gs').dataset.bas, !!document.querySelector('.ap-mf-dit'), document.querySelector('.gs').clientHeight]);
  const cta = p.locator('.gs-cta');
  // On touche le groupe le plus visible, au milieu de sa partie visible (au-dessus du bouton).
  const z = await p.evaluate(() => {
    const bas = document.querySelector('.gs-cta')?.getBoundingClientRect().top ?? innerHeight - 160;
    const vus = [...document.querySelectorAll('.gs-zone')].filter((x) => x.style.pointerEvents === 'auto').map((e) => {
      const r = e.getBoundingClientRect(); const h = Math.max(0, Math.min(r.bottom, bas) - Math.max(r.top, 130));
      return { e, r, h, aire: h * r.width };
    }).sort((a, b) => b.aire - a.aire);
    const { e, r } = vus[0];
    return { x: r.x + r.width / 2, y: (Math.max(r.top, 130) + Math.min(r.bottom, bas)) / 2, cle: e.dataset.cle };
  });
  if (process.env.DETAIL) console.log('     appui', JSON.stringify(z), await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.className + ' ' + (e.dataset?.cle || '') : 'rien'; }, [z.x, z.y]));
  await p.touchscreen.tap(z.x, z.y); await p.waitForTimeout(1200);
  const ouvert = await p.evaluate(() => ({ el: (() => { const e = document.elementFromPoint(0, 0); return e; })() && '', ouvert: !!document.querySelector('.ap-page.feuille'), titre: document.querySelector('.ap-page.feuille h2, .ap-page.feuille .ap-page-h')?.textContent?.slice(0, 60) }));
  ok(ouvert.ouvert, `un appui sur le groupe ouvre la discussion (${z.cle} → ${ouvert.titre})`);
  if (D) await p.screenshot({ path: `${D}/v-${W}-ouvert.png` });
  await p.locator('.ap-page-r').first().click(); await p.waitForTimeout(1200);
  const retour = await p.evaluate(() => document.querySelector('.gs')?.scrollTop);
  const scene2 = await etat();
  console.log('     bas', JSON.stringify(bas1), '→', JSON.stringify(await p.evaluate(() => [document.querySelector('.gs').dataset.bas, !!document.querySelector('.ap-mf-dit'), document.querySelector('.gs').clientHeight])));
  if (JSON.stringify(scene1) !== JSON.stringify(scene2)) for (const k in scene1) if (scene1[k] !== scene2[k]) console.log('     diff', k, scene1[k], '→', scene2[k]);
  ok(retour === garde && JSON.stringify(scene1) === JSON.stringify(scene2), `retour : position ${retour} (gardée ${garde}), même scène`);
  void cta;
  await b.close();
  console.log(echecs ? `\n${echecs} ÉCHEC(S)` : '\nTOUT PASSE');
  process.exit(echecs ? 1 : 0);
})();
