# L'ÉPISODE DU TOUR, REFAIT : « le mode "épisode" n'est pas à la hauteur des autres modes ».
# Trois temps qu'on voit, comme l'interview (le vocal qui s'écrit) et le spécialiste (les cases, son
# récit) : le téléphone posé qui passe en plan large ; la séance en accéléré, où chaque moment gardé
# est repéré puis part dans la pellicule ; le montage sous ses yeux, jusqu'à l'affiche de son épisode.
#   python3 -I tour-episode2.py <dossier>
# Repart toujours de index.avant-episode2.html (copie faite au premier passage) : on peut le relancer.
import os, re, shutil, sys

S = sys.argv[1]
TOURS = ["tour", "tour-vetements", "tour-coiffure", "tour-librairie", "tour-bijouterie", "tour-lunettes"]

CSS_ANCIEN_DEBUT = "/* L'ÉPISODE : le téléphone posé, la session, le montage */"
CSS_ANCIEN_FIN = '.cz[data-sous="ep-fini"] .cz-cam{height:11.5em}\n'
CSS = r"""/* L'ÉPISODE, EN TROIS TEMPS QU'ON VOIT : le téléphone posé qui passe en plan large (0,5×, le niveau,
   le cadre) ; la séance en accéléré, où chaque moment gardé est repéré puis part dans la pellicule ;
   le montage sous ses yeux (la pellicule devient le banc de montage, la liste se coche, l'affiche). */
.cz[data-sous^="ep-"] .cz-p-episode{display:flex}
.cz-p-episode{top:16.1em;flex-direction:column;gap:.6em;padding:0 1.1em 1.3em}
.cz-p-episode .go{flex:none}
.go.rouge{background:#E5303B;box-shadow:0 .6em 1.4em -.6em rgba(229,48,59,.8)}
.cz:not([data-sous="ep-cadre"]) #cz-ep-go,.cz:not([data-sous="ep-session"]) #cz-ep-fin,.cz:not([data-sous="ep-fini"]) #cz-ep-pub{display:none}
@keyframes clignote{50%{opacity:.25}}
@keyframes ep-pop{from{opacity:0;transform:translateX(-50%) scale(.6)}}
/* la caméra */
.ep-cam{position:relative;flex:1;min-height:10em;border-radius:1.3em;overflow:hidden;background:#000;box-shadow:0 .8em 1.6em -.8em rgba(0,0,0,.8),inset 0 0 0 1px rgba(255,255,255,.1)}
.cz[data-sous="ep-fini"] .ep-cam{display:none}
.ep-vue{position:absolute;inset:0;transition:transform 1.3s cubic-bezier(.65,0,.25,1)}
.ep-cam.serre .ep-vue{transform:scale(1.8)}
.ep-vue img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .45s}
.ep-vue img.on{opacity:1}
.ep-cam.tourne .ep-vue img.file{animation:ep-file 2.6s linear both}
@keyframes ep-file{from{transform:scale(1)}to{transform:scale(1.08)}}
.ep-grille{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .6s;
  background:linear-gradient(90deg,transparent calc(33.3% - 1px),rgba(255,255,255,.45) 33.3%,transparent calc(33.3% + 1px),transparent calc(66.6% - 1px),rgba(255,255,255,.45) 66.6%,transparent calc(66.6% + 1px)),
    linear-gradient(transparent calc(33.3% - 1px),rgba(255,255,255,.45) 33.3%,transparent calc(33.3% + 1px),transparent calc(66.6% - 1px),rgba(255,255,255,.45) 66.6%,transparent calc(66.6% + 1px))}
.ep-cam.large .ep-grille{opacity:1}
.ep-coins{position:absolute;inset:30%;opacity:0;pointer-events:none;transition:inset .9s var(--ease),opacity .3s}
.ep-cam.cadre .ep-coins{inset:13% 7% 23%;opacity:1}
.ep-coins i{position:absolute;width:1.8em;height:1.8em;border:.22em solid #FFD60A;filter:drop-shadow(0 0 .3em rgba(255,214,10,.6))}
.ep-coins i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0;border-radius:.6em 0 0 0}
.ep-coins i:nth-child(2){right:0;top:0;border-left:0;border-bottom:0;border-radius:0 .6em 0 0}
.ep-coins i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0;border-radius:0 0 0 .6em}
.ep-coins i:nth-child(4){right:0;bottom:0;border-left:0;border-top:0;border-radius:0 0 .6em 0}
/* le niveau : penché, puis droit (jaune), comme l'appareil photo du téléphone */
.ep-niveau{position:absolute;left:50%;top:50%;width:9em;height:0;margin-left:-4.5em;opacity:0;pointer-events:none;transition:opacity .3s}
.ep-niveau::before,.ep-niveau::after{content:"";position:absolute;top:-1px;width:1.8em;border-top:2px solid rgba(255,255,255,.9);transition:border-color .3s}
.ep-niveau::before{left:0}
.ep-niveau::after{right:0}
.ep-niveau i{position:absolute;left:2.4em;right:2.4em;top:-1px;border-top:2px solid rgba(255,255,255,.9);transform:rotate(-10deg);transition:transform 1s var(--ease),border-color .3s}
.ep-cam.pose .ep-niveau{opacity:1}
.ep-cam.droit .ep-niveau i{transform:none}
.ep-cam.droit .ep-niveau::before,.ep-cam.droit .ep-niveau::after,.ep-cam.droit .ep-niveau i{border-color:#FFD60A}
.ep-cam.cadre .ep-niveau{opacity:0;transition-delay:.8s}
/* les objectifs : 1×, puis 0,5× (le plan large) */
.ep-objectifs{position:absolute;left:50%;bottom:.9em;display:flex;align-items:center;gap:.35em;padding:.3em;border-radius:2em;transform:translateX(-50%);background:rgba(0,0,0,.5);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.ep-objectifs b{display:grid;place-items:center;width:2.4em;height:2.4em;border-radius:50%;font-size:.72em;font-weight:800;color:#fff;background:rgba(255,255,255,.14);transition:transform .35s var(--ease),color .2s,background .2s}
.ep-objectifs b.on{color:#FFD60A;background:rgba(20,14,10,.92);transform:scale(1.22)}
.ep-objectifs b.touche{animation:ep-touche .55s ease-out}
@keyframes ep-touche{0%{box-shadow:0 0 0 0 rgba(255,214,10,.85)}100%{box-shadow:0 0 0 1.1em rgba(255,214,10,0)}}
.ep-etat{position:absolute;left:50%;top:.8em;transform:translateX(-50%);white-space:nowrap;padding:.4em .85em;border-radius:2em;font-size:.72em;font-weight:800;color:#fff;background:rgba(14,9,7,.72);border:1px solid rgba(255,255,255,.25)}
.ep-etat.ok{background:rgba(13,60,44,.94);border-color:var(--menthe);color:#BFFFE6;animation:ep-pop .45s var(--ease)}
.cz:not([data-sous="ep-cadre"]) .ep-objectifs,.cz:not([data-sous="ep-cadre"]) .ep-etat,.cz:not([data-sous="ep-cadre"]) .ep-coins,.cz:not([data-sous="ep-cadre"]) .ep-niveau{display:none}
/* la séance : l'enregistrement, l'accéléré, le moment repéré (le reste s'assombrit), le flash */
.ep-rec,.ep-vite{position:absolute;top:.75em;display:none;align-items:center;gap:.45em;padding:.34em .75em;border-radius:2em;background:rgba(14,9,7,.72);font-size:.72em;font-weight:800;color:#fff;font-variant-numeric:tabular-nums}
.ep-rec{left:.75em}
.ep-rec i{width:.65em;height:.65em;border-radius:50%;background:#FF3B3B;animation:clignote 1.1s steps(2) infinite}
.ep-vite{right:.75em;color:#FFD60A}
.cz[data-sous="ep-session"] .ep-rec,.cz[data-sous="ep-session"] .ep-vite{display:flex}
.ep-vise{position:absolute;border:2px solid #FFD60A;border-radius:.6em;opacity:0;pointer-events:none}
.ep-vise.on{animation:ep-vise 1.5s ease-out both}
@keyframes ep-vise{0%{opacity:0;transform:scale(1.5);box-shadow:0 0 0 999em rgba(0,0,0,0)}
  22%{opacity:1;transform:scale(1);box-shadow:0 0 0 999em rgba(0,0,0,.5)}30%{transform:scale(1.06)}38%{transform:scale(1)}
  78%{opacity:1;box-shadow:0 0 0 999em rgba(0,0,0,.5)}100%{opacity:0;transform:scale(1);box-shadow:0 0 0 999em rgba(0,0,0,0)}}
.ep-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
.ep-flash.on{animation:flash .35s ease-out}
.ep-garde{position:absolute;left:50%;bottom:.85em;width:max-content;max-width:calc(100% - 1.6em);padding:.45em .85em;border-radius:1.2em;transform:translateX(-50%);
  font-size:.74em;font-weight:800;line-height:1.25;text-align:center;color:#fff;background:linear-gradient(90deg,#FF4FA8,#E0167A);box-shadow:0 .5em 1.2em -.4em rgba(255,46,154,.8);opacity:0;pointer-events:none}
.ep-garde.on{animation:ep-garde 1.9s var(--ease) both}
@keyframes ep-garde{0%{opacity:0;transform:translateX(-50%) translateY(.8em) scale(.9)}15%{opacity:1;transform:translateX(-50%)}82%{opacity:1;transform:translateX(-50%)}100%{opacity:0;transform:translateX(-50%) translateY(-.3em)}}
.ep-garde.reste{opacity:1;background:rgba(13,60,44,.94);box-shadow:none;border:1px solid var(--menthe);color:#BFFFE6;animation:ep-pop .45s var(--ease) both}
.ep-vol{position:absolute;z-index:6;object-fit:cover;border-radius:.9em;border:2px solid #FFD60A;box-shadow:0 1em 2em -.6em rgba(0,0,0,.85);pointer-events:none}
/* ce qui est réglé, au cadre */
.ep-reglages{display:none;flex:none;flex-wrap:wrap;justify-content:center;gap:.4em}
.cz[data-sous="ep-cadre"] .ep-reglages{display:flex}
.ep-reglages span{padding:.45em .8em;border-radius:2em;border:1px solid var(--trait);background:rgba(255,244,230,.05);font-size:.74em;font-weight:700;color:var(--gris);transition:all .3s}
.ep-reglages span.on{border-color:var(--menthe);background:rgba(61,226,166,.14);color:var(--menthe);animation:monte .35s var(--ease)}
.ep-reglages span.on::before{content:"✓ "}
/* la séance qui se remplit, et ses moments gardés */
.ep-seance{display:none;flex:none;padding:.6em .8em .7em;border-radius:1.1em;background:rgba(255,244,230,.05);border:1px solid var(--trait)}
.cz[data-sous="ep-session"] .ep-seance{display:block}
.ep-seance p{display:flex;align-items:baseline;gap:.4em;margin:0 0 .55em;font-size:.72em;font-weight:700;color:var(--gris)}
.ep-seance p span{flex:1;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.ep-seance p b{font-size:1.75em;font-weight:900;line-height:1;color:var(--menthe);font-variant-numeric:tabular-nums}
.ep-piste{position:relative;display:flex;align-items:flex-end;gap:2px;height:2.1em}
.ep-piste i{flex:1;height:var(--h);border-radius:1em;background:rgba(255,255,255,.13);transition:background .25s}
.ep-piste i.vu{background:linear-gradient(0deg,var(--rose),var(--ambre))}
.ep-piste em{position:absolute;top:-.7em;width:1.1em;height:1.1em;margin-left:-.55em;background:#FFD60A;clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);animation:ep-etoile .6s var(--ease) both}
@keyframes ep-etoile{from{opacity:0;transform:translateY(-1.4em) scale(.3) rotate(-90deg)}}
/* la pellicule : quatre cases, puis le banc de montage */
.ep-pellicule{position:relative;display:none;flex:none;justify-content:center;gap:.5em}
.cz[data-sous="ep-session"] .ep-pellicule,.cz[data-sous="ep-fini"] .ep-pellicule{display:flex}
.ep-pellicule span{position:relative;flex:1;max-width:4.8em;aspect-ratio:1;border-radius:.8em;border:1.5px dashed rgba(255,255,255,.25);background:center/cover no-repeat}
.ep-pellicule span.plein{border:2px solid #FFD60A;animation:ep-plein .45s var(--ease)}
@keyframes ep-plein{from{transform:scale(1.25)}}
.ep-pellicule span.plein::after{content:"";position:absolute;right:-.4em;top:-.4em;width:1em;height:1em;background:#FFD60A;clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)}
.ep-tete{display:none}
.cz[data-sous="ep-fini"] .ep-pellicule{gap:3px;padding:.75em .55em;border-radius:.8em;background:#0B0705;border:1px solid var(--trait)}
.cz[data-sous="ep-fini"] .ep-pellicule::before,.cz[data-sous="ep-fini"] .ep-pellicule::after{content:"";position:absolute;left:.55em;right:.55em;height:.32em;border-radius:.1em;background:repeating-linear-gradient(90deg,rgba(255,244,230,.3) 0 .45em,transparent .45em .9em)}
.cz[data-sous="ep-fini"] .ep-pellicule::before{top:.2em}
.cz[data-sous="ep-fini"] .ep-pellicule::after{bottom:.2em}
.cz[data-sous="ep-fini"] .ep-pellicule span{max-width:none;aspect-ratio:auto;height:3em;border:0;border-radius:.25em;animation:none}
.cz[data-sous="ep-fini"] .ep-pellicule span::after{content:none}
.cz[data-sous="ep-fini"] .ep-tete{display:block;position:absolute;top:.15em;bottom:.15em;left:.55em;width:2px;margin-left:-1px;border-radius:2px;background:#fff;box-shadow:0 0 .6em #fff,0 0 1.2em var(--rose)}
.ep-pellicule.monte .ep-tete{animation:ep-tete 3s linear forwards}
@keyframes ep-tete{to{left:calc(100% - .55em)}}
/* le montage : l'affiche (les moments qui défilent, puis la sienne) et la liste qui se coche */
.ep-montage{display:none;flex:1;min-height:0;align-items:center;gap:.9em}
.cz[data-sous="ep-fini"] .ep-montage{display:flex}
.ep-affiche{position:relative;flex:none;height:19em;aspect-ratio:9/16;border-radius:1em;overflow:hidden;background:#000;box-shadow:0 1em 2em -.8em rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.12)}
.ep-affiche img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0}
.ep-affiche .ep-coupe.on{opacity:1;animation:ep-coupe .75s ease-out both}
@keyframes ep-coupe{from{transform:scale(1.18)}to{transform:scale(1.03)}}
.ep-affiche .ep-poster{transform:scale(1.12);transition:opacity .5s,transform .9s var(--ease)}
.ep-montage.pret .ep-poster{opacity:1;transform:none}
.ep-reflet{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);transform:translateX(-120%);pointer-events:none}
.ep-montage.pret .ep-reflet{animation:ep-reflet 1.1s .25s ease-in-out both}
@keyframes ep-reflet{to{transform:translateX(120%)}}
.ep-lecture{position:absolute;left:50%;top:70%;width:3.2em;height:3.2em;margin:-1.6em 0 0 -1.6em;border-radius:50%;background:rgba(255,255,255,.22);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1.5px solid rgba(255,255,255,.75);opacity:0;transform:scale(.4);transition:opacity .3s .5s,transform .5s .5s var(--ease)}
.ep-lecture::after{content:"";position:absolute;left:1.15em;top:.92em;border-left:1.1em solid #fff;border-top:.65em solid transparent;border-bottom:.65em solid transparent}
.ep-montage.pret .ep-lecture{opacity:1;transform:none}
.ep-duree{position:absolute;right:.5em;top:.5em;padding:.2em .5em;border-radius:.5em;background:rgba(0,0,0,.7);font-size:.72em;font-weight:800;color:#fff;opacity:0;transition:opacity .3s .7s}
.ep-montage.pret .ep-duree{opacity:1}
.ep-table{flex:1;min-width:0;display:flex;flex-direction:column;gap:.5em}
.ep-table-t{margin:0;font-size:.66em;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--gris)}
.ep-pct{display:block;margin:-.15em 0 .1em;font-size:2.5em;font-weight:900;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums;background:linear-gradient(90deg,var(--ambre),var(--rose));-webkit-background-clip:text;background-clip:text;color:transparent}
.ep-etapes{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.55em}
.ep-etapes li{display:flex;align-items:center;gap:.55em;font-size:.78em;font-weight:700;line-height:1.25;color:var(--gris);opacity:.5;transition:opacity .3s,color .3s}
.ep-etapes li i{flex:none;display:grid;place-items:center;width:1.6em;height:1.6em;border-radius:50%;border:2px solid rgba(255,255,255,.2);font-style:normal;font-size:.85em}
.ep-etapes li.encours,.ep-etapes li.fait{opacity:1;color:var(--creme)}
.ep-etapes li.encours i{border-color:var(--rose);border-top-color:transparent;animation:ep-tourne .7s linear infinite}
@keyframes ep-tourne{to{transform:rotate(360deg)}}
.ep-etapes li.fait i{border-color:var(--menthe);background:var(--menthe);animation:ep-coche .35s var(--ease)}
.ep-etapes li.fait i::after{content:"✓";color:#0B2A1F;font-weight:900}
@keyframes ep-coche{from{transform:scale(.4)}}
.ep-pret{margin:.2em 0 0;padding:.55em .7em;border-radius:.9em;background:rgba(61,226,166,.12);border:1px solid rgba(61,226,166,.5);font-size:.78em;font-weight:800;line-height:1.3;color:#BFFFE6;opacity:0;transform:translateY(.5em);transition:opacity .35s,transform .45s var(--ease)}
.ep-montage.pret .ep-pret{opacity:1;transform:none}
"""

HTML_ANCIEN = re.compile(r'            <div class="cz-p cz-p-episode" id="cz-episode">.*?\n(?=            <div class="cz-p cz-p-spe">)', re.S)
HTML = """            <div class="cz-p cz-p-episode" id="cz-episode">
              <div class="ep-cam" id="ep-cam">
                <div class="ep-vue" id="ep-vue"><img class="on" alt=""><img alt=""></div>
                <span class="ep-grille" aria-hidden="true"></span>
                <span class="ep-coins" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
                <span class="ep-niveau" aria-hidden="true"><i></i></span>
                <span class="ep-vise" id="ep-vise" aria-hidden="true"></span>
                <span class="ep-flash" id="ep-flash" aria-hidden="true"></span>
                <span class="ep-etat" id="ep-etat"></span>
                <span class="ep-objectifs" aria-hidden="true"><b data-o="0,5">0,5</b><b data-o="1">1×</b><b data-o="2">2</b></span>
                <span class="ep-rec" aria-hidden="true"><i></i><b id="ep-t">0:00</b></span>
                <span class="ep-vite" aria-hidden="true">⏩ Accéléré</span>
                <span class="ep-garde" id="ep-garde"></span>
              </div>
              <div class="ep-reglages" id="ep-reglages"><span>Posé, bien droit</span><span>Plan large · 0,5×</span><span>1 h au plus</span></div>
              <div class="ep-seance"><p><span>La séance</span><b id="ep-gardes">0</b>moments gardés</p><div class="ep-piste" id="ep-piste" aria-hidden="true"></div></div>
              <div class="ep-montage" id="ep-montage">
                <div class="ep-affiche" id="ep-affiche"><img class="ep-coupe" alt=""><img class="ep-coupe" alt=""><img class="ep-coupe" alt=""><img class="ep-coupe" alt=""><img class="ep-poster" src="AFFICHE" alt="L’affiche de son épisode"><span class="ep-reflet" aria-hidden="true"></span><span class="ep-lecture" aria-hidden="true"></span><b class="ep-duree" id="ep-duree"></b></div>
                <div class="ep-table"><p class="ep-table-t">Montage</p><b class="ep-pct" id="ep-pct">0 %</b><ol class="ep-etapes" id="ep-etapes"></ol><p class="ep-pret" id="ep-pret"></p></div>
              </div>
              <div class="ep-pellicule" id="ep-pellicule" aria-hidden="true"><span></span><span></span><span></span><span></span><i class="ep-tete"></i></div>
              <button type="button" class="go" id="cz-ep-go">▶ Démarrer la session</button>
              <button type="button" class="go rouge" id="cz-ep-fin">⏹ J’ai terminé</button>
              <button type="button" class="go" id="cz-ep-pub">Publier ✓</button>
            </div>
"""

JS_CAMERA_ANCIEN = re.compile(r"  /\* LA CAMÉRA DE L'ÉPISODE : l'image k de la session, en fondu sur la précédente\. \*/\n.*?\n  }\n", re.S)
JS_CAMERA = r"""  /* L'ÉPISODE, EN TROIS TEMPS QU'ON VOIT. La caméra : la photo k de la séance (celles du plat), en
     fondu sur la précédente, qui avance doucement pendant qu'elle est à l'écran. */
  let imageCam = -1;
  function camera(k) {
    if (k === imageCam) return;
    imageCam = k;
    const [a, b] = $$("#ep-vue img"), dessus = a.classList.contains("on") ? b : a, dessous = dessus === a ? b : a;
    dessus.src = PRISES[k][0];
    dessus.classList.remove("file"); void dessus.offsetWidth;
    dessus.classList.add("on", "file"); dessous.classList.remove("on");
  }
  const epMaj = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  /* Les étapes du montage : celles que le fantôme annonce (« les meilleurs moments, l'accéléré, … »). */
  const ETAPES_MONTAGE = ((m) => (m ? m[1].split(/,\s*/) : ["les meilleurs moments", "l’accéléré"]).map(epMaj))(/:\s*([^.]+)\./.exec(EPISODE.montageDit));
  $("#ep-etapes").innerHTML = ETAPES_MONTAGE.map((t) => "<li><i></i><span>" + t + "</span></li>").join("");
  $("#ep-duree").textContent = EPISODE.duree;
  $("#ep-pret").textContent = "✓ Ton épisode est prêt";
  for (let i = 0; i < 44; i++) {
    const b = document.createElement("i");
    b.style.setProperty("--h", 20 + Math.round(Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37)) * 80) + "%");
    $("#ep-piste").appendChild(b);
  }
  /* Les quatre moments forts de la séance : où le fantôme regarde (en % de l'image), et quand. */
  const EP_VISES = [[26, 26, 48, 44], [20, 22, 58, 50], [24, 28, 52, 46], [28, 20, 46, 52]], EP_QUAND = [0.12, 0.34, 0.56, 0.8];
  function epSansVol() { $$(".ep-vol").forEach((v) => { if (v.getAnimations) v.getAnimations().forEach((a) => a.cancel()); v.remove(); }); }
  /* Tout comme au début (on peut revenir en arrière avec ‹). */
  function epRemettre() {
    $("#ep-cam").className = "ep-cam";
    imageCam = -1; camera(0);
    $$(".ep-objectifs b").forEach((b) => b.classList.toggle("on", b.dataset.o === "1"));
    const e = $("#ep-etat"); e.className = "ep-etat"; e.textContent = "1× · trop serré";
    $$("#ep-reglages span").forEach((s) => s.classList.remove("on"));
    $("#ep-t").textContent = "0:00"; $("#ep-gardes").textContent = "0";
    $$("#ep-piste i").forEach((b) => b.classList.remove("vu"));
    $$("#ep-piste em").forEach((m) => m.remove());
    $$("#ep-pellicule span").forEach((s) => { s.classList.remove("plein"); s.style.backgroundImage = ""; });
    $("#ep-garde").className = "ep-garde"; $("#ep-vise").className = "ep-vise";
    epSansVol();
  }
  /* UN MOMENT GARDÉ : le fantôme le repère (le cadre jaune, le reste s'assombrit), le garde (le flash,
     son nom), et la photo part dans la pellicule ; une étoile se pose sur la séance. */
  function epGarder(k) {
    const v = $("#ep-vise"), [x, y, w, h] = EP_VISES[k % EP_VISES.length];
    v.style.left = x + "%"; v.style.top = y + "%"; v.style.width = w + "%"; v.style.height = h + "%";
    rejouer(v, "on");
    plus(() => {
      rejouer($("#ep-flash"), "on"); son("declic");
      const g = $("#ep-garde"); g.className = "ep-garde"; g.textContent = "✨ Moment gardé · " + epMaj(PRISES[k][1]); rejouer(g, "on");
      const m = document.createElement("em"); m.style.left = EP_QUAND[k] * 100 + "%"; $("#ep-piste").appendChild(m);
      epVoler(k);
    }, 480);
  }
  function epVoler(k) {
    const slot = $$("#ep-pellicule span")[k], cam = $("#ep-cam"), panneau = $("#cz-episode");
    const remplir = () => { slot.style.backgroundImage = "url(" + PRISES[k][0] + ")"; slot.classList.add("plein"); son("note", k + 3); };
    if (reduit || !cam.animate) { remplir(); return; }
    const P = panneau.getBoundingClientRect(), a = cam.getBoundingClientRect(), b = slot.getBoundingClientRect();
    const s = Math.min(a.width, a.height) * 0.55;
    const im = document.createElement("img");
    im.className = "ep-vol"; im.src = PRISES[k][0]; im.alt = "";
    im.style.left = a.left - P.left + (a.width - s) / 2 + "px"; im.style.top = a.top - P.top + (a.height - s) / 2 + "px";
    im.style.width = im.style.height = s + "px";
    panneau.appendChild(im);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    im.animate([{ transform: "scale(.7)", opacity: 0 }, { transform: "scale(1)", opacity: 1, offset: 0.25 },
      { transform: "translate(" + dx + "px," + dy + "px) scale(" + b.width / s + ") rotate(-6deg)", opacity: 1 }],
      { duration: 900, easing: "cubic-bezier(.55,0,.3,1)" }).onfinish = () => { im.remove(); remplir(); };
  }
  /* LE MONTAGE, SOUS SES YEUX : la pellicule devient le banc de montage ; la tête de lecture passe sur
     chaque moment (il s'affiche dans l'affiche), la liste se coche, puis l'affiche de son épisode. */
  function epMonter() {
    $("#ep-cam").className = "ep-cam"; epSansVol();
    const pel = $("#ep-pellicule"), mo = $("#ep-montage"), coupes = $$("#ep-affiche .ep-coupe"), etapes = $$("#ep-etapes li");
    $$("span", pel).forEach((s, k) => { s.style.backgroundImage = "url(" + PRISES[k][0] + ")"; s.classList.add("plein"); });
    coupes.forEach((c, k) => { c.src = PRISES[k][0]; c.classList.remove("on"); });
    mo.classList.remove("pret"); etapes.forEach((l) => l.classList.remove("fait", "encours"));
    $("#ep-pct").textContent = "0 %";
    rejouer(pel, "monte");
    const MS = 3000, t0 = performance.now();
    let coupe = -1;
    const tic = chaque(() => {
      const p = Math.min(1, (performance.now() - t0) / MS);
      $("#ep-pct").textContent = Math.round(p * 100) + " %";
      const k = Math.min(coupes.length - 1, Math.floor(p * coupes.length));
      if (k !== coupe) { coupe = k; coupes.forEach((c, j) => c.classList.toggle("on", j === k)); son("carte", k); }
      etapes.forEach((l, j) => {
        if (p >= (j + 1) / etapes.length) { l.classList.remove("encours"); l.classList.add("fait"); }
        else l.classList.toggle("encours", p >= j / etapes.length);
      });
      if (p >= 1) { clearInterval(tic); mo.classList.add("pret"); son("pret"); geste("hop", 520); }
    }, 80);
  }
"""

CADRE_ANCIEN = """        /* LE CADRE, COMME DANS L'APPLICATION : la caméra arrière, l'objectif le plus large, la grille. */
        entrer() {
          cz.dataset.sous = "ep-cadre";
          guide(EPISODE.cadreQ, EPISODE.cadreS, 3, "", EPISODE.cadreVoix);
          camera(0);
        },
"""
CADRE = """        /* LE CADRE, COMME DANS L'APPLICATION : à 1×, c'est trop serré ; il touche 0,5× et la cuisine
           entière entre dans l'image ; le niveau se redresse, la grille et le cadre se posent. */
        entrer() {
          cz.dataset.sous = "ep-cadre";
          guide(EPISODE.cadreQ, EPISODE.cadreS, 3, "", EPISODE.cadreVoix);
          epRemettre();
          const cam = $("#ep-cam"), e = $("#ep-etat");
          cam.classList.add("serre");
          plus(() => cam.classList.add("pose"), 450);
          plus(() => {
            const o = $(".ep-objectifs b[data-o='0,5']");
            $$(".ep-objectifs b").forEach((b) => b.classList.toggle("on", b === o)); rejouer(o, "touche");
            son("declic"); cam.classList.remove("serre"); cam.classList.add("large");
            e.textContent = "0,5× · plan large";
          }, 1500);
          plus(() => cam.classList.add("droit"), 2400);
          plus(() => { cam.classList.add("cadre"); e.textContent = "✓ Tout tient dans le cadre"; e.classList.add("ok"); son("pop"); }, 3000);
          $$("#ep-reglages span").forEach((s, n) => plus(() => { s.classList.add("on"); son("note", n); }, 3500 + n * 450));
        },
"""

SESSION_ANCIEN = re.compile(r"        /\* LA SESSION, EN ACCÉLÉRÉ : l'heure qui file, les moments gardés, l'activité, ses images\. \*/\n        entrer\(\) \{\n.*?\n          \}, 120\);\n        \},\n", re.S)
SESSION = """        /* LA SÉANCE, EN ACCÉLÉRÉ : l'heure qui file, la séance qui se remplit, et quatre moments forts
           qu'on voit repérer, garder, et partir dans la pellicule. */
        entrer() {
          cz.dataset.sous = "ep-session";
          guide(EPISODE.sessionQ, EPISODE.sessionS, 4, "", EPISODE.sessionVoix);
          epRemettre();
          $("#ep-cam").classList.add("tourne");
          occupe = true; viser(null); son("eveil");
          const t0 = performance.now(), MS = 8800, barres = $$("#ep-piste i");
          let vus = 0;
          const tic = chaque(() => {
            const p = Math.min(1, (performance.now() - t0) / MS);
            $("#ep-t").textContent = fmt(Math.round(EPISODE.secondes * p));
            $("#ep-gardes").textContent = Math.round(EPISODE.moments * p);
            const n = Math.round(barres.length * p);
            barres.forEach((b, k) => b.classList.toggle("vu", k < n));
            camera(Math.min(PRISES.length - 1, Math.floor(p * PRISES.length)));
            while (vus < EP_QUAND.length && p >= EP_QUAND[vus]) epGarder(vus++);
            if (p >= 1) {
              clearInterval(tic);
              plus(() => {
                const g = $("#ep-garde"); g.className = "ep-garde reste";
                g.textContent = "✓ " + EPISODE.moments + " moments gardés · " + Math.round(EPISODE.secondes / 60) + " min";
                occupe = false; son("pret"); dire(EPISODE.sessionFin); viser("#cz-ep-fin");
              }, 700);
            }
          }, 100);
        },
"""

PUBLIER_ANCIEN = re.compile(r"            /\* LE MONTAGE, SOUS SES YEUX : la barre, puis son épisode prêt \*/\n.*?            return;\n", re.S)
PUBLIER = """            /* LE MONTAGE, SOUS SES YEUX : le banc de montage, la liste qui se coche, son affiche */
            cz.dataset.sous = "ep-fini";
            guide(EPISODE.pretQ, EPISODE.pretS, 4, "", EPISODE.pretVoix);
            epMonter();
            return;
"""


def une_fois(texte, ancien, nouveau, quoi):
    if isinstance(ancien, str):
        assert texte.count(ancien) == 1, (quoi, texte.count(ancien))
        return texte.replace(ancien, nouveau)
    trouves = ancien.findall(texte)
    assert len(trouves) == 1, (quoi, len(trouves))
    return ancien.sub(lambda m: nouveau, texte)


# « METTRE ÉPISODE EN 3E POSITION PLUTÔT QU'EN PREMIÈRE » : interview, spécialiste, puis épisode —
# les boutons du choix, et les phrases qui les énumèrent (le narrateur, « En bref »).
CHOIX_EPISODE = re.compile(r'              <button type="button" class="cz-mode episode" id="cz-choix-episode">\n.*?              </button>\n', re.S)
CHOIX_SPE_FIN = re.compile(r'(              <button type="button" class="cz-mode spe" id="cz-choix-spe">\n.*?              </button>\n)', re.S)
DIT_CHOIX = re.compile(r"\? ([^?]+?), (il|elle) répond à une interview, ou notre spécialiste s’occupe de tout\.")
PART_FACON = re.compile(r"(Une façon de l[ea] raconter : )([^\"]+?), en interview, ou par notre spécialiste\"")
PART_SELON = "Selon la façon : rien de plus, 4 photos et vos réponses, ou 4 photos"


def episode_en_dernier(h):
    bloc = CHOIX_EPISODE.findall(h)
    assert len(bloc) == 1
    h = h.replace(bloc[0], "", 1)
    assert len(CHOIX_SPE_FIN.findall(h)) == 1, "spe"
    h = CHOIX_SPE_FIN.sub(lambda m: m.group(1) + bloc[0], h)
    assert len(DIT_CHOIX.findall(h)) == 1, "dit"
    h = DIT_CHOIX.sub(lambda m: "? " + m.group(2).capitalize() + " répond à une interview, notre spécialiste s’occupe de tout, ou " + m.group(1)[0].lower() + m.group(1)[1:] + ".", h)
    assert len(PART_FACON.findall(h)) == 1, "part"
    h = PART_FACON.sub(lambda m: m.group(1) + "en interview, par notre spécialiste, ou " + m.group(2) + '"', h)
    h = une_fois(h, PART_SELON, "Selon la façon : 4 photos et vos réponses, 4 photos, ou rien de plus", "selon")
    return h


# « METTRE ÉPISODE EN ATTENTE, "À VENIR", PARCE QU'ON N'A AUCUN ÉPISODE À PROPOSER » (tous les tours
# sauf le restaurant, qui a le vrai épisode de la boulangerie) : la carte reste, en pointillés, avec
# « À venir » ; touchée, elle le dit et ne s'ouvre pas. On ne parle plus que de deux façons, et
# « Et une autre façon ? » passe de l'interview au spécialiste, sans l'épisode.
CSS_A_VENIR = """/* L'ÉPISODE, « À VENIR » : pas encore d'épisode à montrer dans ce métier */
.cz-mode.bientot{border-style:dashed;border-color:rgba(255,244,230,.25);background:rgba(255,244,230,.03);cursor:default}
.cz-mode.bientot>span,.cz-mode.bientot .cz-mode-ic{opacity:.5;filter:grayscale(.75)}
.cz-mode.bientot .cz-mode-nouveau{background:#4A3B33;color:var(--creme);border:1px solid rgba(255,244,230,.3)}
.cz-mode.bientot:active{transform:none}
.cz-mode.bientot.non{animation:bientot-non .4s ease-in-out}
@keyframes bientot-non{20%,60%{transform:translateX(-.35em)}40%,80%{transform:translateX(.35em)}}
.cz-bientot{position:absolute;inset:.45em;display:grid;place-items:center;padding:0 1em;border-radius:1.1em;background:#1A100C;border:1px solid rgba(255,46,154,.55);
  font-size:.82em;font-weight:800;line-height:1.35;text-align:center;color:var(--creme);opacity:0;pointer-events:none}
.cz-bientot.on{animation:cz-bientot 3.2s ease both}
@keyframes cz-bientot{0%{opacity:0;transform:scale(.94)}10%,82%{opacity:1;transform:none}100%{opacity:0}}
"""
CLIC_CHOIX = """    if (fini || DEMOS[vue].moments[idx].id !== "choix") return;
    e.stopPropagation(); contexte(); choisirParcours(p);
"""
CLIC_CHOIX_A_VENIR = """    if (fini || DEMOS[vue].moments[idx].id !== "choix") return;
    e.stopPropagation(); contexte();
    /* L'ÉPISODE « À VENIR » : il ne s'ouvre pas encore ; il le dit, et renvoie vers les deux autres */
    if (e.currentTarget.classList.contains("bientot")) { rejouer(e.currentTarget, "non"); son("pop"); dire(EPISODE_A_VENIR);
      const c = e.currentTarget; let m = $(".cz-bientot", c);
      if (!m) { m = document.createElement("span"); m.className = "cz-bientot"; m.textContent = "🎬 Bientôt disponible. En attendant : l’interview ou notre spécialiste ↑"; c.appendChild(m); }
      rejouer(m, "on"); return; }
    choisirParcours(p);
"""
DIT_DEUX = re.compile(r"répond à une interview, notre spécialiste s’occupe de tout, ou ([^.]+)\. Touchez l’une des trois\.")
PART_DEUX = re.compile(r"(Une façon de l[ea] raconter : )en interview, par notre spécialiste, ou ([^\"]+)\"")


def episode_a_venir(h):
    h = une_fois(h, '<button type="button" class="cz-mode episode" id="cz-choix-episode">',
                 '<button type="button" class="cz-mode episode bientot" id="cz-choix-episode" aria-disabled="true">', "carte")
    h = une_fois(h, '<em class="cz-mode-nouveau">Nouveau</em>', '<em class="cz-mode-nouveau">À venir</em>', "badge")
    h = re.sub(r'(      episode: \{ titre: "[^"]+", sous: "[^"]+", temps: )"⏱ Rien à faire de plus"', r'\1"Bientôt"', h, count=1)
    assert 'temps: "Bientôt"' in h, "temps"
    h = une_fois(h, CSS, CSS + CSS_A_VENIR, "css")
    h = une_fois(h, CLIC_CHOIX, CLIC_CHOIX_A_VENIR, "clic")
    # le narrateur : deux façons, l'épisode bientôt
    m = DIT_DEUX.search(h)
    assert m and len(DIT_DEUX.findall(h)) == 1, "dit deux"
    bientot = m.group(1).replace(" se filme ", " pourra aussi se filmer ")
    assert bientot != m.group(1), "se filme"
    h = h[:m.start()] + "répond à une interview, ou notre spécialiste s’occupe de tout. Bientôt, " + bientot + ". Touchez l’une des deux." + h[m.end():]
    # ce qu'il dira quand on touche la carte : la même phrase, pour ce métier
    a_venir = "L’épisode arrive bientôt : " + bientot + ". Pour l’instant, touchez l’interview ou notre spécialiste."
    h = une_fois(h, "  const SUIVANTE = { voix: \"spe\", spe: \"episode\", episode: \"voix\" };\n",
                 "  const SUIVANTE = { voix: \"spe\", spe: \"voix\", episode: \"voix\" };\n  const EPISODE_A_VENIR = \"" + a_venir + "\";\n", "suivante")
    h = une_fois(h, 'spe: "🎬 Et en le filmant ? Son épisode →"', 'spe: "🎙️ Et en interview ? →"', "autre")
    # « En bref »
    assert len(PART_DEUX.findall(h)) == 1, "part deux"
    h = PART_DEUX.sub(lambda m: m.group(1) + "en interview, ou par notre spécialiste (bientôt aussi : " + m.group(2) + ')"', h)
    h = une_fois(h, "Selon la façon : 4 photos et vos réponses, 4 photos, ou rien de plus", "Selon la façon : 4 photos et vos réponses, ou 4 photos", "selon deux")
    return h


# LE RESTAURANT : SON ÉPISODE REMONTÉ (« on s'ennuie… ») — raconté par le fantôme, 0:50.
def episode_raconte(h):
    h = une_fois(h, 'data-episode="SON ÉPISODE · 0:59"', 'data-episode="SON ÉPISODE · 0:50"', "di")
    h = une_fois(h, '    duree: "0:59",\n', '    duree: "0:50",\n', "duree")
    h = une_fois(h, "Sous la cloche, un vrai épisode : monté par ClikMe sur une vraie séance de 26 minutes, dans une boulangerie. Le vôtre montrera votre cuisine.",
                 "Sous la cloche, un vrai épisode : monté et raconté par le fantôme de ClikMe, dans une boulangerie. Le vôtre montrera votre cuisine.", "film")
    return h


for t in TOURS:
    dossier = os.path.join(S, t)
    page, copie = os.path.join(dossier, "index.avant-intro.html"), os.path.join(dossier, "index.avant-episode2.html")
    if not os.path.exists(copie):
        shutil.copyfile(page, copie)
    h = open(copie, encoding="utf-8").read()
    # l'affiche de son épisode : celle de la carte d'avant
    affiche = re.search(r'id="cz-ep-film"><img src="([^"]+)"', h).group(1)
    a = h.index(CSS_ANCIEN_DEBUT); z = h.index(CSS_ANCIEN_FIN, a) + len(CSS_ANCIEN_FIN)
    h = h[:a] + CSS + h[z:]
    h = une_fois(h, HTML_ANCIEN, HTML.replace("AFFICHE", affiche), "html")
    h = une_fois(h, JS_CAMERA_ANCIEN, JS_CAMERA, "camera")
    h = une_fois(h, CADRE_ANCIEN, CADRE, "cadre")
    h = une_fois(h, SESSION_ANCIEN, SESSION, "session")
    h = une_fois(h, PUBLIER_ANCIEN, PUBLIER, "publier")
    h = episode_en_dernier(h)
    if t != "tour":
        h = episode_a_venir(h)
    else:
        h = episode_raconte(h)
    for reste in ["cz-cam", "cz-ep-film", "cz-ep-etat"]:
        assert reste not in h, (t, reste)
    assert os.path.exists(os.path.join(dossier, affiche)), (t, affiche)
    open(page, "w", encoding="utf-8").write(h)
    print(t, "· affiche", affiche, "· ok")
