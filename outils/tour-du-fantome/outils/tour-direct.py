# POURQUOI AUTANT DE MONDE VERRA VOTRE ANNONCE ? À l'étape 1, le fantôme promet « …devant plus de 1 000
# personnes » ; « il faudrait justifier ce nombre ». L'explication (la voix enregistrée, 19,8 s) n'allonge
# pas l'étape 1 : elle arrive à l'étape du Direct, là où on le voit pour la première fois. Le fil du
# Direct défile derrière, assombri (les offres des autres commerces passent d'un geste du pouce) ; le
# fantôme tombe dans sa lumière, comme à l'étape 1, et dit ses cinq phrases, chacune avec son icône.
# Puis le voile s'en va, la dernière offre passe, et son annonce arrive avec ses vues. Un appui sur le
# voile passe l'explication.
# À lancer après tour-promesses.py (même index.html, déjà réécrit) :  python3 -I tour-direct.py <dossier>
import json, os, re, shutil, subprocess, sys

S = sys.argv[1]
sys.path.insert(0, f"{S}/outils")
from alignement import aligner  # noqa: E402

FF = f"{S}/ffmpeg"
R = f"{S}/recu/direct"
NB = " "
TOURS = ["tour", "tour-vetements", "tour-coiffure", "tour-librairie", "tour-bijouterie"]

# Les cinq phrases, telles qu'il les dit. « 30 » s'écrit en chiffres mais se mesure « trente » (le même
# nombre de mots : chaque mot garde son instant).
PHRASES = [
    ("Pourquoi *autant de monde verra votre annonce" + NB + "?", None),
    ("Parce que le Direct réunit chaque matin les offres du jour d’une *centaine de commerçants de la ville, au même endroit.", "boutiques"),
    ("Personne n’a le temps de fouiller quinze pages Facebook et dix comptes Instagram pour savoir ce qui se passe en ville.", "loupe"),
    ("Sur le Direct, en *30 secondes, on voit tout ce qui s’anime aujourd’hui autour de chez soi.", "eclair"),
    ("C’est pour ça qu’on y revient *chaque matin.", "soleil"),
]
# où couper l'enregistrement : au milieu des pauses de fin de phrase (≈ 0,4 s ; celles des virgules
# font ≈ 0,2 s et restent dans leur phrase)
COUPES = [0, 2.25, 8.09, 13.115, 17.875, None]


def ff(*args):
    subprocess.run([FF, "-y", "-loglevel", "error", *args], check=True)


os.makedirs(f"{R}/coupe", exist_ok=True)
temps = {}
for k, (texte, _) in enumerate(PHRASES):
    nom = f"direct-{k + 1}"
    a, z = COUPES[k], COUPES[k + 1]
    ff("-ss", str(a), *(["-to", str(z)] if z else []), "-i", f"{R}/brut/direct.mp3",
       "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,afade=t=in:d=0.02",
       "-c:a", "libmp3lame", "-q:a", "3", f"{R}/coupe/{nom}.mp3")
    mesure = texte.replace("*", "").replace("30 secondes", "trente secondes")
    temps[nom] = aligner(FF, f"{R}/coupe/{nom}.mp3", mesure)
    if len(temps[nom]["m"]) != len(texte.split(" ")):
        raise SystemExit(f"{nom} : {len(temps[nom]['m'])} instants pour {len(texte.split(' '))} mots")
print("direct", {k: v["d"] for k, v in temps.items()})

ICONES = {
    "boutiques": '<svg viewBox="0 0 24 24"><path d="M4 9.5 5.6 4h12.8L20 9.5M4 9.5h16M5 9.5v10h14v-10M10 19.5v-5h4v5"/></svg>',
    "loupe": '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>',
    "eclair": '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    "soleil": '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
}
TEINTES = {"boutiques": "rose", "loupe": "ambre", "eclair": "rose", "soleil": "ambre"}

CSS = """
/* POURQUOI AUTANT DE MONDE (étape du Direct) : le fantôme dans sa lumière, devant le fil assombri ; plus
   bas qu'à l'étape 1, pour laisser à sa bulle la place de ses cinq phrases */
.di-fx{z-index:30;opacity:0;visibility:hidden;transition:opacity .45s,visibility 0s .45s}
.di-fx.on{opacity:1;visibility:visible;transition:opacity .45s}
.di-fx-voile{position:absolute;inset:0;background:rgba(14,9,7,.76);-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.di-fx .fx-spot{top:14.4em}
.di-fx .fx-sol{top:36.3em}
.di-fx .fx-fant{top:28.2em}
.di-fx .fx-bulle{bottom:calc(100% - 27.7em)}
.di-fx-passer{position:absolute;left:0;right:0;bottom:2.2em;text-align:center;font-size:.7em;font-weight:700;color:rgba(255,255,255,.45)}
/* le chiffre qu'on annonce partout (1 400 vues sur ClikMe), en tête de la bulle : l'explication en est la raison */
.di-fx-vues{display:inline-flex;align-items:center;gap:.35em;margin:0 0 .5em;padding:.25em .7em .25em .5em;border-radius:2em;background:linear-gradient(90deg,#FF4FA8,#E0167A);color:#fff;
  font-size:.9em;font-weight:800;box-shadow:0 .4em 1em -.5em rgba(255,46,154,.8)}
.di-fx-vues svg{width:1.15em;height:1.15em;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.di-fx-vues b{font-variant-numeric:tabular-nums;font-weight:900}
"""

JS = """
  /* POURQUOI AUTANT DE MONDE VERRA VOTRE ANNONCE ? (voir tour-direct.py) */
  const DIRECT_POURQUOI = __POURQUOI__;
  Object.assign(TEMPS, __TEMPS_DIRECT__);
  __ENR_DIRECT__.forEach((n) => { if (!ENREGISTREES.includes(n)) ENREGISTREES.push(n); });
  // une offre passe, d'un geste du pouce (sans son pendant qu'il parle)
  function defilerDirect(k, sansSon) {
    const m = $("#di-main"); m.classList.remove("on"); void m.offsetWidth; m.classList.add("on");
    const c = $('#di-autres .di-c[data-k="' + k + '"]');
    if (c) c.classList.add("part");
    if (!sansSon) son("glissement", k);
  }
  async function pourquoiDirect() {
    const fx = $("#di-fx"), j = jetonVoix;
    remettreScene(fx); fx.classList.add("on");
    // 1 400 vues sur ClikMe : le compteur monte quand la bulle s'ouvre
    const vues = $(".di-fx-vues b", fx); vues.textContent = "0";
    plus(() => nombre(vues, 1400, 1300), 1150);
    // derrière lui, le fil défile : deux offres passent pendant qu'il parle
    plus(() => defilerDirect(0, true), 7000); plus(() => defilerDirect(1, true), 13000);
    if (!(await jouerScene(fx, DIRECT_POURQUOI, j)) || !(await pause(1500, j))) return;
    finPourquoi();
  }
  // le voile s'en va ; les offres qui restent passent ; son annonce arrive
  function finPourquoi() {
    const fx = $("#di-fx");
    if (!fx.classList.contains("on")) return;
    fx.classList.remove("on");
    const reste = $$("#di-autres .di-c:not(.part)").map((c) => +c.dataset.k);
    reste.forEach((k, n) => plus(() => defilerDirect(k), 450 + n * 1000));
    plus(revelerDirect, 450 + reste.length * 1000 + 150);
  }
  $("#di-fx").addEventListener("click", (e) => { e.stopPropagation(); taireVoix(); finPourquoi(); });
"""


def une_fois(t, avant, apres, quoi):
    if t.count(avant) != 1:
        raise SystemExit(f"{quoi} : {t.count(avant)} fois")
    return t.replace(avant, apres)


pourquoi = {"titre": PHRASES[0][0], "voix": "direct-1",
            "plan": [{"ico": f'<span class="fx-ico {TEINTES[i]}">{ICONES[i]}</span>', "txt": t, "voix": f"direct-{k + 2}"} for k, (t, i) in enumerate(PHRASES[1:])]}
for d in TOURS:
    page = f"{S}/{d}/index.html"
    t = open(page, encoding="utf-8").read()
    for k in range(len(PHRASES)):
        shutil.copy2(f"{R}/coupe/direct-{k + 1}.mp3", f"{S}/{d}/direct-{k + 1}.mp3")
    # son fantôme, le même que sous le projecteur de l'étape 1
    fant = re.search(r'<div class="fx cz-fx" id="cz-fx">.*?(<div class="fx-fant".*?</div></div></div>)', t, re.S).group(1)
    t = une_fois(t, "</style>\n", CSS.lstrip("\n") + "</style>\n", f"{d} style")
    t = une_fois(t, '<div id="di-autres"></div>\n',
                 '<div id="di-autres"></div>\n'
                 '            <div class="fx di-fx" id="di-fx"><span class="di-fx-voile" aria-hidden="true"></span>'
                 '<span class="fx-spot" aria-hidden="true"></span><span class="fx-sol" aria-hidden="true"></span>'
                 '<div class="fx-bulle"><span class="di-fx-vues"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/>'
                 '<circle cx="12" cy="12" r="2.8"/></svg><b>1 400</b> vues sur ClikMe</span><p class="fx-dit"></p><ul class="fx-plan"></ul></div>' + fant +
                 '<small class="di-fx-passer">Touchez pour passer</small></div>\n', f"{d} décor")
    js = (JS.replace("__POURQUOI__", json.dumps(pourquoi, ensure_ascii=False)).replace("__TEMPS_DIRECT__", json.dumps(temps))
          .replace("__ENR_DIRECT__", json.dumps(sorted(temps))))
    t = une_fois(t, "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", js.lstrip("\n") + "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", f"{d} js")
    # l'étape du Direct : l'explication d'abord, à la place des trois offres qui défilaient seules
    t = une_fois(t, """          AUTRES.forEach((r, k) => plus(() => {
            const m = $("#di-main"); m.classList.remove("on"); void m.offsetWidth; m.classList.add("on");
            const c = $('#di-autres .di-c[data-k="' + k + '"]');
            if (c) c.classList.add("part");
            son("glissement", k);
          }, 1300 + k * 1000));
          plus(revelerDirect, 1300 + AUTRES.length * 1000 + 150);
""", "          pourquoiDirect();\n", f"{d} entrer")
    t = une_fois(t, """          if (!$("#v-di").classList.contains("arrive")) { effacer(); revelerDirect(); return; }""",
                 """          if (!$("#v-di").classList.contains("arrive")) { effacer(); taireVoix(); $("#di-fx").classList.remove("on"); revelerDirect(); return; }""", f"{d} agir")
    open(page, "w", encoding="utf-8").write(t)
    print(d, "· pourquoi autant de monde : posé")
