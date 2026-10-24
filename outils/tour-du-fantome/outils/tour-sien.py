# SON NOM, SON TEMPS. « Que ce soit SON commerce » et « sans y passer de temps », prouvés :
#  · son nom aux moments d'émotion. Avant de lui tendre le téléphone, le présentateur touche « Pour qui est
#    cette démo ? » en haut de la page 1 et tape le nom de son commerce. Il s'affiche sur la page 1 (« Préparé
#    pour… »), sur sa boutique et dans sa notification au chapitre 03, sur le livre de son commerce au
#    chapitre 04, et dans le titre de la conclusion. Rien d'inventé : seulement le nom qu'on tape ; les photos,
#    les voix et les mots de l'exemple restent ceux de l'exemple (la voix du livre garde son auteur). Jamais le
#    mot « exemple » à l'écran.
#    Le nom reste sur ce téléphone le temps de la visite (sessionStorage), jamais envoyé.
#  · son temps. À la fin de « Plus de clients », après WhatsApp, un ticket : le temps pour créer et publier
#    une annonce, toujours le même, 1 min 30 en moyenne (pas le chrono de la démo : on s'y arrête pour
#    expliquer, il ne veut rien dire), les vues et la demande. La conclusion le reprend :
#    « Plus de clients · votre annonce en 1 min 30, en moyenne ».
#    Et « Commission : 0 € » : ClikMe ne prend aucune commission sur ce que ses clients lui demandent (confirmé).
# À lancer après tour-depenses.py (même index.html) :  python3 -I tour-sien.py <dossier>
import json, sys

S = sys.argv[1]
TEMPS_MOYEN = "1\u00a0min\u00a030"      # le temps moyen pour créer et publier une annonce
# la demande qu'il a reçue, en une ligne, dans les mots du métier (pourCombien, PLAT : ceux de la page)
DEMANDES = {
    "tour": '"Une table pour " + pourCombien()',
    "tour-coiffure": '"Un rendez-vous : « " + PLAT + " »"',
    "tour-vetements": '"« " + PLAT + " », mis de côté"',
    "tour-librairie": '"« " + PLAT + " », mis de côté"',
    "tour-bijouterie": '"« " + PLAT + " », mis de côté"',
    "tour-lunettes": '"« " + PLAT + " », mise de côté"',
}

CSS = """
/* SON NOM : le présentateur le tape avant de tendre le téléphone (page 1) */
.pour{position:relative;z-index:6;display:inline-flex;align-items:center;gap:6px;max-width:100%;margin-top:10px;padding:6px 13px;border-radius:999px;border:1px dashed rgba(255,244,230,.3);
  background:rgba(14,9,7,.55);color:rgba(255,244,230,.62);font-weight:700;font-size:12.5px;line-height:1.2}
/* à son nom : sous le logo s'il ne tient pas à côté, sur deux lignes s'il le faut */
.pour.a-nom{display:inline-block;order:2;margin:10px auto 0;border-radius:16px;border:1px solid rgba(255,93,184,.65);background:rgba(255,46,154,.16);color:#fff;font-size:14px;text-align:center}
.accueil .tete:has(.pour.a-nom){flex-wrap:wrap}
.pour b{font-weight:900}
/* son enseigne, la nuit : un nom long passe sur deux lignes au lieu de sortir du décor */
.pr-enseigne{width:max-content;max-width:118%;white-space:normal;text-align:center;line-height:1.15}
.accueil.en-intro .pour{opacity:0;visibility:hidden}
.pour-feuille{position:fixed;inset:0;z-index:7;display:grid;place-items:center;padding:20px;background:rgba(11,2,2,.74);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.pour-feuille[hidden]{display:none}
.pour-carte{width:100%;max-width:340px;margin:0;padding:18px;border-radius:20px;background:#1A0F14;border:1px solid rgba(255,255,255,.12);text-align:left;display:flex;flex-direction:column;gap:10px}
.pour-carte label{font-weight:900;font-size:18px;letter-spacing:-.01em}
.pour-carte input{height:48px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:#0E0709;color:#fff;padding:0 14px;font:inherit;font-size:16px;font-weight:700}
.pour-carte small{color:rgba(255,244,230,.66);font-size:12.5px;line-height:1.4}
.pour-actions{display:flex;gap:8px;margin-top:2px}
.pour-actions button{flex:1;height:46px;border-radius:999px;font-weight:800;font-size:15px}
.pour-ok{background:linear-gradient(90deg,#FF4FA8,#E0167A);color:#fff}
.pour-effacer{border:1px solid rgba(255,255,255,.25);color:rgba(255,244,230,.85)}
/* la conclusion à son nom : un titre plus long, un peu plus petit */
.oy-titre.nomme{font-size:clamp(21px,6.6cqmin,40px)}
/* SON TEMPS : le ticket de « Plus de clients », sur le WhatsApp, après la demande */
.wa-bilan{position:absolute;left:.9em;right:.9em;top:8.6em;z-index:12;padding:.85em .95em .55em;border-radius:1.1em;background:#FFF6EA;color:#2A1A10;box-shadow:0 1.2em 2.4em -1em rgba(0,0,0,.85);
  opacity:0;transform:translateY(1.2em) scale(.96);transition:opacity .4s,transform .55s var(--ease);pointer-events:none}
.wa-bilan.on{opacity:1;transform:none}
.wb-t{margin:0 0 .45em;display:flex;align-items:center;justify-content:space-between;gap:.5em}
.wb-t b{padding:.2em .55em;border-radius:.45em;background:var(--rose);color:#fff;font-size:1.2em;font-weight:900;letter-spacing:-.02em;transform:rotate(-3deg);white-space:nowrap}
.wb-t small{font-size:.66em;font-weight:800;color:#8A6A55;text-transform:uppercase;letter-spacing:.05em;text-align:right;line-height:1.25}
.wb-l{display:flex;align-items:center;gap:.6em;padding:.5em 0;border-top:1px dashed rgba(42,26,16,.24)}
.wb-l[hidden]{display:none}
.wb-l>i{flex:none;display:grid;place-items:center;width:2.1em;height:2.1em;border-radius:.6em;background:rgba(255,46,154,.1);font-style:normal}
.wb-l span{flex:1;min-width:0}
.wb-l small{display:block;font-size:.68em;font-weight:700;color:#8A6A55}
.wb-l b{display:block;font-size:.95em;font-weight:900;line-height:1.2}
.wb-l em{flex:none;padding:.15em .5em;border-radius:1em;font-style:normal;font-size:.6em;font-weight:800;background:rgba(42,26,16,.08);color:#8A6A55}
.wb-l em.vrai{background:rgba(61,226,166,.22);color:#0F7A54}
.wb-temps b{font-size:1.35em;color:#E0167A;letter-spacing:-.02em}
.wb-zero b{font-size:1.2em;color:#0F7A54}
"""

POUR_HTML = ('\n    <button type="button" class="pour" id="pour">✎ Pour qui est cette démo ?</button>\n'
             '  </header>\n'
             '  <div class="pour-feuille" id="pour-feuille" hidden><form class="pour-carte" id="pour-form">'
             '<label for="pour-nom">Pour qui est cette démo ?</label>'
             '<input id="pour-nom" type="text" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="done" placeholder="Le nom de son commerce">'
             '<small>Son nom s’affiche aux moments forts : sa boutique la nuit, le livre de son commerce, la conclusion. '
             'Il reste sur ce téléphone le temps de la visite, et n’est envoyé nulle part.</small>'
             '<div class="pour-actions"><button type="button" class="pour-effacer" id="pour-effacer">Effacer</button>'
             '<button type="submit" class="pour-ok">C’est noté</button></div></form></div>')

BILAN_HTML = ('<div class="wa-bilan" id="wa-bilan" aria-live="polite">'
              '<p class="wb-t"><b>Plus de clients.</b><small>Ce que votre fantôme<br>a fait pour vous</small></p>'
              '<div class="wb-l wb-temps"><i>⏱</i><span><small>Votre temps pour créer et publier</small><b>' + TEMPS_MOYEN + '</b></span><em class="vrai">en moyenne</em></div>'
              '<div class="wb-l"><i>👁</i><span><small>Votre annonce sur ClikMe</small><b>1 400 vues</b></span></div>'
              '<div class="wb-l"><i>💬</i><span><small id="wb-quand"></small><b id="wb-demande"></b></span></div>'
              '<div class="wb-l wb-zero"><i>🤝</i><span><small>Commission ClikMe sur cette demande</small><b>0 €</b></span><em class="vrai">toujours</em></div>'
              '</div>')

JS = """
  /* ═══ SON NOM, SON TEMPS (voir tour-sien.py) ═══ */
  const SIEN = { nom: "" };
  const sienEchapper = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  // son commerce s'il a été tapé, sinon celui de l'exemple
  const lieuVous = () => SIEN.nom ? sienEchapper(SIEN.nom) : PR.lieu;
  // « de » devant son nom, comme on le dit : « des Lunettes de Margaux », « du Fournil », « de la Page d’Alice »,
  // « de l’Atelier », « d’Acuitis », « de Chez Bergine »
  const deLieu = () => {
    const n = lieuVous(), m = n.match(/^(?:(Les|Le|La) |(L[’']))(.+)$/);
    if (m) return m[1] === "Les" ? ["des ", m[3]] : m[1] === "Le" ? ["du ", m[3]] : m[1] === "La" ? ["de la ", m[3]] : ["de l’", m[3]];
    return /^[aeiouyàâäéèêëîïôöùûüœæh]/i.test(n) ? ["d’", n] : ["de ", n];
  };
  const deLieuTexte = () => deLieu().join("");
  // le titre de la conclusion, à son nom
  const ouiTitre = () => SIEN.nom
    ? '<h2 class="oy-titre nomme">On crée la page ' + deLieu()[0] + "<em>" + deLieu()[1] + "</em>" + NB + "?</h2>"
    : '<h2 class="oy-titre">Alors, on y <em>va</em>' + NB + "?</h2>";
  // le nom reste sur ce téléphone le temps de la visite (jamais envoyé)
  try { SIEN.nom = sessionStorage.getItem("tour-pour") || ""; } catch (e) { /* stockage fermé : on le retape */ }
  function montrerPour() {
    const b = $("#pour");
    b.classList.toggle("a-nom", !!SIEN.nom);
    b.innerHTML = SIEN.nom ? "✨ Préparé pour <b>" + sienEchapper(SIEN.nom) + "</b>" : "✎ Pour qui est cette démo ?";
  }
  function poserPour(nom) {
    SIEN.nom = nom.trim().replace(/\\s+/g, " ").slice(0, 40);
    try { if (SIEN.nom) sessionStorage.setItem("tour-pour", SIEN.nom); else sessionStorage.removeItem("tour-pour"); } catch (e) { /* stockage fermé */ }
    $("#pour-feuille").hidden = true;
    montrerPour();
  }
  montrerPour();
  $("#pour").addEventListener("click", (e) => {
    e.stopPropagation();
    $("#pour-nom").value = SIEN.nom; $("#pour-feuille").hidden = false;
    setTimeout(() => $("#pour-nom").focus(), 60);
  });
  $("#pour-form").addEventListener("submit", (e) => { e.preventDefault(); poserPour($("#pour-nom").value); });
  $("#pour-effacer").addEventListener("click", () => poserPour(""));
  $("#pour-feuille").addEventListener("click", (e) => { if (e.target.id === "pour-feuille") $("#pour-feuille").hidden = true; });

  // le ticket, après la demande WhatsApp : le tampon « Plus de clients. » se pose dessus
  const DEMANDE_BILAN = () => __DEMANDE__;
  function montrerBilanClients() {
    const q = QUAND[choix.quand];
    $("#wb-demande").textContent = DEMANDE_BILAN();
    $("#wb-quand").textContent = "Sur votre WhatsApp · " + q.mot.toLowerCase() + " vers " + q.heures[choix.heure];
    $("#tampon-c").classList.remove("on");
    $("#wa-bilan").classList.add("on"); son("pop");
  }
"""


def une_fois(t, avant, apres, quoi):
    if t.count(avant) != 1:
        raise SystemExit(f"{quoi} : {t.count(avant)} fois")
    return t.replace(avant, apres)


for d, demande in DEMANDES.items():
    page = f"{S}/{d}/index.html"
    t = open(page, encoding="utf-8").read()
    t = une_fois(t, "</style>\n", CSS.lstrip("\n") + "</style>\n", f"{d} style")
    t = une_fois(t, '    <img src="logo.png" alt="ClikMe">\n  </header>', '    <img src="logo.png" alt="ClikMe">' + POUR_HTML, f"{d} page 1")
    t = une_fois(t, '<div class="wa-notif" id="wa-notif">', BILAN_HTML + '<div class="wa-notif" id="wa-notif">', f"{d} ticket")
    t = une_fois(t, "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", JS.replace("__DEMANDE__", demande).lstrip("\n") + "  /* ═══ PAGE 1 → PAGE 2 ═══ */\n", f"{d} js")
    # le ticket : rangé quand on revient à la demande, posé après elle
    t = une_fois(t, '"#wa-notif", "#tampon-c"].forEach((s) => $(s).classList.remove("on"));',
                 '"#wa-notif", "#tampon-c", "#wa-bilan"].forEach((s) => $(s).classList.remove("on"));', f"{d} ticket remis")
    t = une_fois(t, '["#wa-recu", "#wa-moi", "#tampon-c"].forEach((s) => $(s).classList.add("on"));',
                 '["#wa-recu", "#wa-moi", "#tampon-c"].forEach((s) => $(s).classList.add("on"));\n    plus(montrerBilanClients, 1500);', f"{d} ticket posé")
    # son nom : sa boutique et sa notification la nuit, le livre de son commerce, la conclusion
    t = une_fois(t, '<span class="pr-enseigne">\' + PR.lieu + \'</span>', '<span class="pr-enseigne">\' + lieuVous() + \'</span>', f"{d} enseigne")
    t = une_fois(t, '" alt="">Chez vous · \' + PR.lieu + "</header>', '" alt="">Chez vous · \' + lieuVous() + "</header>', f"{d} notification")
    t = une_fois(t, '<small>Le livre de \' + PR.lieu + "</small>Ce qui marche', '<small>Le livre \' + deLieuTexte() + "</small>Ce qui marche', f"{d} livre p2")
    t = une_fois(t, '<small>Le livre de \' + PR.lieu + "</small>Tout ce qui fait', '<small>Le livre \' + deLieuTexte() + "</small>Tout ce qui fait', f"{d} livre p1")
    t = une_fois(t, "<small>Le livre de</small><b>' + PR.lieu + \"</b>", "<small>Le livre ' + deLieu()[0].trim() + \"</small><b>\" + deLieu()[1] + \"</b>", f"{d} couverture")
    t = une_fois(t, '(PR.voix ? "🎙️ Le secret " : "✒️ Le secret ") + prDe(PR.qui)',
                 '(SIEN.nom ? (PR.voix ? "🎙️ " : "✒️ ") + "Votre secret" : (PR.voix ? "🎙️ Le secret " : "✒️ Le secret ") + prDe(PR.qui))', f"{d} secret")
    t = une_fois(t, '\'<div class="oy"><h2 class="oy-titre">Alors, on y <em>va</em>\' + NB + "?</h2>',
                 '\'<div class="oy">\' + ouiTitre() + "', f"{d} titre du oui")
    t = une_fois(t, '"</b><small>" + p.sous + "</small>',
                 '"</b><small>" + (k === 0 ? "votre annonce en ' + TEMPS_MOYEN + ', en moyenne" : p.sous) + "</small>', f"{d} oui temps")
    open(page, "w", encoding="utf-8").write(t)
    print(d, "· son nom, son temps")
