# LES GESTES DU COMMERÇANT, PLUS COURTS. « Moins de travail avant le premier wow » : au chapitre 1, il fait
# environ deux minutes de gestes avant la moindre récompense. Les 4 photos du plat (de la pièce, de la coupe…)
# ne demandent plus quatre appuis : un appui sur le bouton blanc, et elles s'enchaînent (déclic, flash, la
# photo part dans sa vignette, la suivante prend sa place). Il garde la sensation de l'avoir fait lui-même.
# À lancer après tour-direct.py (même index.html) :  python3 -I tour-gestes.py <dossier>
import sys

S = sys.argv[1]
TOURS = ["tour", "tour-vetements", "tour-coiffure", "tour-librairie", "tour-bijouterie", "tour-lunettes"]

AVANT = """        agir() {
          if (prises >= PRISES.length) return;
          const k = prises++;
          const fl = $("#flash"); fl.classList.remove("eclair"); void fl.offsetWidth; fl.classList.add("eclair");
          son("declic");
          const s = $$("#vignettes span")[k]; s.style.backgroundImage = "url(" + PRISES[k][0] + ")"; s.classList.add("pleine");
          if (prises < PRISES.length) {
            viseurSur(prises);
            $("#cz-c").textContent = "Photo " + (prises + 1) + " sur 4 : " + PRISES[prises][1] + ".";
            dire("Et une ! Photo " + (prises + 1) + " : " + PRISES[prises][1] + ".");
          } else {
            occupe = true; viser(null);
            $("#cz-c").textContent = "Les 4 photos sont prises.";
            plus(() => { occupe = false; aller(idx + 1); }, 750);
          }
        },"""
APRES = """        agir() {
          if (prises >= PRISES.length) return;
          // un appui : les 4 photos s'enchaînent
          occupe = true; viser(null);
          const declic = () => {
            const k = prises++;
            const fl = $("#flash"); fl.classList.remove("eclair"); void fl.offsetWidth; fl.classList.add("eclair");
            son("declic");
            const s = $$("#vignettes span")[k]; s.style.backgroundImage = "url(" + PRISES[k][0] + ")"; s.classList.add("pleine");
            if (prises < PRISES.length) {
              viseurSur(prises);
              $("#cz-c").textContent = "Photo " + (prises + 1) + " sur 4 : " + PRISES[prises][1] + ".";
              plus(declic, 560);
            } else {
              $("#cz-c").textContent = "Les 4 photos sont prises.";
              plus(() => { occupe = false; aller(idx + 1); }, 750);
            }
          };
          declic();
        },"""


def une_fois(t, avant, apres, quoi):
    if t.count(avant) != 1:
        raise SystemExit(f"{quoi} : {t.count(avant)} fois")
    return t.replace(avant, apres)


for d in TOURS:
    page = f"{S}/{d}/index.html"
    t = open(page, encoding="utf-8").read()
    t = une_fois(t, AVANT, APRES, f"{d} photos")
    t = une_fois(t, "Touchez le bouton blanc à chaque photo.", "Un appui sur le bouton blanc : elles s’enchaînent.", f"{d} consigne")
    open(page, "w", encoding="utf-8").write(t)
    print(d, "· 4 photos en un appui")
