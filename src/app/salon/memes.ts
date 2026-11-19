/**
 * 🎭 LE MÈME JOUÉ DANS LE SALON (`docs/univers/salon-du-duo.md`, section 4.7 ; le lot S5) — la maquette v6, sur le moteur :
 * la caméra s'approche de la figurine, un **projecteur** s'allume (le reste de la pièce s'assombrit, un faisceau tombe
 * d'en haut), un clap 🎬 « Action ! », le texte arrive **mot à mot dans une bulle de BD** au-dessus d'elle, avec la tête
 * qui va avec (fou rire : elle rit, des 😂 ; amour : des cœurs, elle rougit ; euphorie : des étincelles, elle bondit ;
 * grimace : 😜 ; tristesse : 💧 ; colère : 💢 💨) et une petite musique ; « Coupez ! », la pièce revient. L'autre figurine
 * réagit à la fin (elle rit, des cœurs…).
 *
 * Un mème est une donnée (texte, tête, danse) : rien ne se télécharge pendant qu'il se joue.
 *
 * MODULE DU NAVIGATEUR (il touche au DOM) : à n'importer que dans un composant client.
 */
import { autreQue, type Qui, type Scene } from "@/lib/direct/salon";
import { MOT_MS, PHRASES_MEME, type MemeSalon, type TeteMeme } from "@/lib/direct/meme-salon";

/** Le style du projecteur et de la bulle de BD (posé une fois dans la page du salon). */
export const STYLES_MEME = `
.sc-projecteur{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .3s ease;z-index:6;background:radial-gradient(circle at var(--px,30%) var(--py,55%),rgba(255,236,190,.10) 0,rgba(255,236,190,.04) 13%,rgba(8,4,10,.72) 27%,rgba(8,4,10,.82) 60%)}
.sc-projecteur::before{content:"";position:absolute;left:calc(var(--px,30%) - 9%);top:0;width:18%;height:var(--py,55%);background:linear-gradient(180deg,rgba(255,240,200,.32),rgba(255,240,200,.08));clip-path:polygon(35% 0,65% 0,100% 100%,0 100%);filter:blur(2px)}
.sc-projecteur.vu{opacity:1}
.sc-bd{position:absolute;z-index:7;transform:translate(-50%,-100%);max-width:calc(var(--sw)*.42);min-width:calc(var(--sw)*.14);box-sizing:border-box;padding:calc(var(--sw)*.018) calc(var(--sw)*.024);border-radius:calc(var(--sw)*.03);background:#fff;color:#1d0a1b;border:calc(var(--sw)*.004) solid #1d0a1b;box-shadow:0 calc(var(--sw)*.008) 0 #1d0a1b;font:800 calc(var(--sw)*.027)/1.25 -apple-system,"SF Pro Rounded",system-ui,sans-serif;text-align:center;pointer-events:none;animation:sc-bd-pop .25s cubic-bezier(.2,1.6,.4,1) both}
.sc-bd::after{content:"";position:absolute;left:50%;bottom:calc(var(--sw)*-.022);width:calc(var(--sw)*.03);height:calc(var(--sw)*.03);background:#fff;border-right:calc(var(--sw)*.004) solid #1d0a1b;border-bottom:calc(var(--sw)*.004) solid #1d0a1b;transform:translateX(-50%) rotate(45deg)}
.sc-bd span{display:inline-block;animation:sc-bd-mot .22s cubic-bezier(.2,1.6,.4,1) both}
.sc-bd.part{animation:sc-bd-part .3s ease forwards}
@keyframes sc-bd-pop{0%{opacity:0;transform:translate(-50%,-100%) scale(.5)}100%{opacity:1;transform:translate(-50%,-100%) scale(1)}}
@keyframes sc-bd-mot{0%{opacity:0;transform:translateY(40%) scale(.6)}100%{opacity:1;transform:none}}
@keyframes sc-bd-part{to{opacity:0;transform:translate(-50%,-110%) scale(.9)}}
@media (prefers-reduced-motion:reduce){.sc-bd,.sc-bd span,.sc-bd.part{animation:none}.sc-projecteur{transition:none}}
`;

/** La tête qui va avec, pendant qu'elle le dit. */
function jouerLaTete(s: Scene, de: Qui, tete: TeteMeme, sec: number) {
  const f = s.figurine(de);
  const h = s.repere(de, "haut");
  const t = s.repere(de, "tete");
  const au = (dx: number) => ({ x: h.x + dx, y: h.y + 0.02 });
  switch (tete) {
    case "rire":
      f.rire(Math.min(4, sec));
      s.fx.traitsDeRire(de);
      s.fx.jaillir("😂", au(0), 3, { taille: 4 });
      break;
    case "amour":
      f.pencher(9, sec * 1000);
      s.fx.rougir(de, sec * 1000);
      s.fx.eclatCoeurs(t, 10);
      break;
    case "euphorie":
      f.bondir(0.9);
      f.gonfler(1.05, 900);
      s.fx.etincelles(t, 12, { t: 1 });
      break;
    case "grimace":
      f.secouer(0.7);
      s.fx.jaillir("😜", au(0.03), 2, { taille: 4 });
      break;
    case "tristesse":
      f.pencher(-8, sec * 1000);
      s.fx.jaillir("💧", au(0.02), 2, { taille: 3.4 });
      break;
    case "colere":
      f.secouer(1);
      s.fx.secousse(0.6);
      s.fx.jaillir("💢", au(0.03), 1, { taille: 4.2 });
      void s.attendre(400).then(() => s.fx.jaillir("💨", au(-0.03), 2, { taille: 3.6 }));
      break;
    default:
      f.pencher(7, 1400);
      s.fx.jaillir("😄", au(0), 1, { taille: 4 });
  }
}

/** L'autre figurine réagit à la fin (elle rit, des cœurs, elle penche la tête). */
function reagirAuMeme(s: Scene, de: Qui, tete: TeteMeme) {
  const q = autreQue(de);
  const f = s.figurine(q);
  if (f.dort) return f.secouer(0.3);
  const h = s.repere(q, "haut");
  if (tete === "amour") {
    s.fx.rougir(q, 1600);
    s.fx.eclatCoeurs(s.repere(q, "tete"), 6);
  } else if (tete === "tristesse") f.pencher(8, 1400);
  else {
    f.rire(1.2);
    s.fx.jaillir("😂", { x: h.x, y: h.y + 0.02 }, 2, { taille: 3.6 });
  }
}

/** Un mème en cours (un seul à la fois) : de quoi l'arrêter. */
let enCours: (() => void) | null = null;
/** Arrêter le mème en cours (la scène s'en va, un autre commence). */
export const arreterMeme = () => enCours?.();

/**
 * 🎬 JOUER UN MÈME : la figurine de `de` le joue ; résolue à la fin (« Coupez ! », la pièce revenue). `surAction` : au
 * moment de « Action ! » (moins de 700 ms après le toucher).
 */
export async function jouerMeme(s: Scene, de: Qui, m: Pick<MemeSalon, "texte" | "tete" | "danse">, surAction?: () => void): Promise<void> {
  enCours?.();
  let fini = false;
  const couche = s.couche("devant");
  const t = s.repere(de, "tete");
  const h = s.repere(de, "haut");
  // (la caméra s'approche ; le projecteur s'allume sur elle)
  s.viser({ x: t.x, y: t.y + 0.04, echelle: 1.55 });
  const proj = document.createElement("div");
  proj.className = "sc-projecteur";
  proj.dataset.projecteur = de;
  proj.style.setProperty("--px", `${t.x * 100}%`);
  proj.style.setProperty("--py", `${(t.y + 0.08) * 100}%`);
  couche.append(proj);
  const bulle = document.createElement("div");
  bulle.className = "sc-bd";
  bulle.dataset.meme = de;
  bulle.style.left = `${Math.min(0.75, Math.max(0.25, t.x)) * 100}%`;
  bulle.style.top = `${(h.y - 0.02) * 100}%`;
  const ranger = () => {
    if (fini) return;
    fini = true;
    if (enCours === ranger) enCours = null;
    proj.classList.remove("vu");
    bulle.classList.add("part");
    setTimeout(() => {
      proj.remove();
      bulle.remove();
    }, 320);
    s.viser("piece");
  };
  enCours = ranger;
  requestAnimationFrame(() => proj.classList.add("vu"));
  await s.attendre(450);
  if (fini) return;
  // 🎬 « Action ! »
  s.sons.clac();
  s.fx.lettrage("Action !", { x: t.x + (de === "moi" ? 0.12 : -0.12), y: h.y - 0.06 }, { couleur: "jaune", rot: de === "moi" ? -8 : 8, taille: 0.06, duree: 900 });
  surAction?.();
  await s.attendre(450);
  if (fini) return;
  // (les mots, un à un, dans la bulle de BD ; la tête qui va avec ; la musique)
  couche.append(bulle);
  const mots = m.texte.split(" ");
  const sec = (mots.length * MOT_MS) / 1000 + 1;
  s.sons.jingle(m.tete);
  jouerLaTete(s, de, m.tete, sec);
  s.figurine(de).parler(sec);
  for (const mot of mots) {
    if (fini) return;
    const span = document.createElement("span");
    span.textContent = mot;
    bulle.append(span, document.createTextNode(" "));
    await s.attendre(MOT_MS);
  }
  if (m.danse && !fini) {
    s.figurine(de).danser(1.6);
    await s.attendre(900);
  }
  await s.attendre(1300);
  if (fini) return;
  // 🎬 « Coupez ! »
  s.sons.clac();
  s.fx.lettrage(PHRASES_MEME.coupez, { x: t.x, y: h.y - 0.1 }, { couleur: "rose", rot: -4, taille: 0.05, duree: 800 });
  reagirAuMeme(s, de, m.tete);
  ranger();
  await s.attendre(500);
}
