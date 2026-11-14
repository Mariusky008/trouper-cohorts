/**
 * 🎨 LES AMBIANCES DE SON UNIVERS — l'essai (14 novembre 2026). Le propriétaire : « il faut des univers beaucoup plus
 * funky et jeunes pour les ados, parce qu'ils ne vont pas vouloir d'un décor à la mer ou à la montagne, mais peut-être à
 * New York, et l'intérieur doit être super cool et trendy pour eux : totalement différent de ce qu'on a fait, qui est
 * davantage pour les plus de 30 ans. » Son choix, parmi trois : « Pablito propose » — une ambiance d'après ce qu'on lui a
 * raconté (et l'âge que montre sa figurine), puis trois vignettes pour changer. D'abord dans la page d'essais.
 *
 * QUATRE AMBIANCES : 🛋️ cosy (le style d'aujourd'hui, « Film, chaleureux »), 🗽 urbaine (un loft à New York), 🎮 néon et
 * gaming, 🌸 pastel. Le même monde (ce que Pablito a imaginé, ses éléments et leur raison) est réinterprété dans chacune.
 *
 * CE QUE PABLITO PROPOSE (`proposerAmbiance`) : les mots de sa conversation (le lieu imaginé, ses éléments, leurs
 * raisons) cherchés dans un lexique par ambiance ; la plus citée l'emporte, et il dit pourquoi en reprenant SON élément
 * (jamais un mot qu'il n'a pas dit). Rien trouvé : l'âge que montre sa figurine (ses traits, décrits sur son selfie) —
 * jeune, la ville ; sinon, cosy. FICHIER PUR.
 */
import { STYLE_FILM_CHALEUREUX } from "./monde-consignes";

export const AMBIANCES = [
  {
    cle: "cosy",
    /** ses couleurs, pour sa carte à l'écran */
    couleurs: ["#f2b765", "#7a4b2a"],
    /** Pablito : « je te vois bien … » */
    chez: "dans un coin cosy",
    nom: "Cosy",
    emoji: "🛋️",
    dit: "chaleureux, du bois, des lumières dorées",
    lieu: "a warm, cosy home.",
    style: STYLE_FILM_CHALEUREUX,
  },
  {
    cle: "new-york",
    /** ses couleurs, pour sa carte à l'écran */
    couleurs: ["#c0573f", "#253552"],
    /** Pablito : « je te vois bien … » */
    chez: "dans un loft à New York",
    nom: "Urbaine, New York",
    emoji: "🗽",
    dit: "un loft à New York, la brique, la ville derrière la vitre",
    lieu: "a trendy LOFT IN NEW YORK: exposed red brick walls, huge black steel industrial windows on the Manhattan skyline and its rooftop water towers, a fire escape outside, a street-art mural, a wall of sneakers, a vinyl and turntable corner, a skateboard, Edison bulbs.",
    style:
      "a set from a high-end 3D animated feature film: a cool, trendy, young urban place, full of personal props, a cinematic composition with depth and layers, the warm glow of Edison bulbs mixed with the blue hour of the city, detailed materials and textures — street style, no magic.",
  },
  {
    cle: "neon",
    /** ses couleurs, pour sa carte à l'écran */
    couleurs: ["#8a2be2", "#00d9ff"],
    /** Pablito : « je te vois bien … » */
    chez: "dans une pièce pleine de néons",
    nom: "Néon et gaming",
    emoji: "🎮",
    dit: "des néons, des LED, un vrai coin gaming",
    lieu: "a GAMER'S ROOM at night: glowing neon signs (shapes and symbols, no words) and RGB LED strips in purple, pink and cyan, a big gaming setup with screens and a glowing keyboard, a gaming chair, an arcade cabinet, collectible figures on lit shelves, posters, a beanbag, a night city through the window.",
    style:
      "a set from a high-end 3D animated feature film: a vibrant, playful, young place glowing with neon and LED light, full of personal props, a cinematic composition with depth and layers, rich purple, pink and cyan light with deep shadows, detailed materials — fun and electric, no magic.",
  },
  {
    cle: "pastel",
    /** ses couleurs, pour sa carte à l'écran */
    couleurs: ["#ffc6de", "#c7b6ff"],
    /** Pablito : « je te vois bien … » */
    chez: "dans un cocon tout pastel",
    nom: "Pastel, tout doux",
    emoji: "🌸",
    dit: "du rose, du lilas, des nuages, tout en douceur",
    lieu: "a dreamy PASTEL ROOM: soft pink, lilac, mint and butter-yellow, rounded furniture, cloud-shaped lamps and fairy lights, big plush toys, trailing plants, a round window on a candy-coloured sky.",
    style:
      "a set from a high-end 3D animated feature film: a soft, airy, sweet and playful place in pastel colours, full of personal props, a cinematic composition with depth and layers, soft diffused light, velvety materials and textures — tender and trendy, no magic.",
  },
] as const;
export type Ambiance = (typeof AMBIANCES)[number]["cle"];
/** 🚦 Le frein : `CLIKME_AMBIANCES=0` (Pablito ne propose plus d'ambiance, chaque décor reste cosy). */
export const ambiancesActives = () => String(process.env.CLIKME_AMBIANCES ?? "").trim() !== "0";
/** Ce que le décor reçoit d'une ambiance (`consigneDecorDuMonde`) ; cosy : rien, le style d'aujourd'hui. */
export const pourLeDecor = (a?: string | null) => {
  const amb = AMBIANCES.find((x) => x.cle === a && x.cle !== "cosy");
  return amb ? { style: amb.style, lieu: amb.lieu } : undefined;
};
export const ambianceValide = (x: unknown): Ambiance | null => AMBIANCES.find((a) => a.cle === x)?.cle ?? null;
export const ambianceDe = (c: Ambiance) => AMBIANCES.find((a) => a.cle === c)!;

/** Les mots de sa conversation qui appellent chaque ambiance (sans accents, en minuscules). */
const LEXIQUE: Record<Exclude<Ambiance, "cosy">, string[]> = {
  "new-york": ["new york", "new-york", "manhattan", "brooklyn", "ville", "urbain", "street", "skate", "sneakers", "basket", "rap", "hip-hop", "hip hop", "graff", "tag", "loft", "metro", "rooftop", "gratte-ciel", "dj", "beatbox", "breakdance"],
  neon: ["jeu video", "jeux video", "gaming", "gamer", "console", "playstation", "ps5", "xbox", "nintendo", "switch", "fortnite", "minecraft", "roblox", "twitch", "stream", "manette", "neon", "led", "rgb", "manga", "anime", "esport", "arcade", "pc gamer", "cosplay"],
  pastel: ["pastel", "kawaii", "licorne", "nuage", "douceur", "peluche", "cupcake", "k-pop", "kpop", "paillette", "bonbon", "mignon", "lilas", "rose pale", "barbe a papa", "arc-en-ciel", "arc en ciel"],
};
const sansAccents = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Un mot du lexique, entier (« tag » ne se trouve pas dans « étagère »). */
const contient = (texte: string, mot: string) => new RegExp(`(^|[^a-z0-9])${mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`).test(texte);

/** L'âge que montre sa figurine (ses traits) : jeune ? (« teenage », « 17 », « early twenties »…) */
export const airJeune = (age: string) => /\b(teen|teenage|teenager|adolescent|youth|1[5-9]|early twenties|early 20s|young adult)\b/i.test(age);

export type ProposeeAmbiance = { ambiance: Ambiance; pourquoi: string; mot?: string };
type Monde = { proposition?: string; elements?: { quoi: string; pourquoi?: string }[] };

/** « de » devant un mot : « d’un établi », « de skate ». */
const de = (t: string) => (/^[aeiouyhéèêàâîôû]/i.test(t) ? `d’${t}` : `de ${t}`);

/** 🎨 Ce que Pablito propose, et pourquoi (en reprenant ce qu'il lui a dit). */
export function proposerAmbiance(monde: Monde | null, age = ""): ProposeeAmbiance {
  const sources = [...(monde?.elements ?? []).map((e) => ({ quoi: e.quoi, texte: `${e.quoi} ${e.pourquoi ?? ""}` })), ...(monde?.proposition ? [{ quoi: "", texte: monde.proposition }] : [])];
  let meilleure: { ambiance: Exclude<Ambiance, "cosy">; n: number; quoi: string } | null = null;
  for (const a of Object.keys(LEXIQUE) as Exclude<Ambiance, "cosy">[]) {
    let n = 0;
    let quoi = "";
    for (const src of sources) {
      const t = sansAccents(src.texte);
      const trouves = LEXIQUE[a].filter((m) => contient(t, m)).length;
      if (trouves && !quoi && src.quoi) quoi = src.quoi;
      n += trouves;
    }
    if (n > (meilleure?.n ?? 0)) meilleure = { ambiance: a, n, quoi };
  }
  if (meilleure) {
    const amb = ambianceDe(meilleure.ambiance);
    const debut = meilleure.quoi ? `Tu m’as parlé ${de(meilleure.quoi.trim().replace(/[.!]+$/, ""))} : ` : "D’après ce que tu m’as raconté, ";
    return { ambiance: amb.cle, pourquoi: `${debut}je te vois bien ${amb.chez} ${amb.emoji}`, ...(meilleure.quoi ? { mot: meilleure.quoi } : {}) };
  }
  // (rien dans sa conversation : l'âge que montre sa figurine — et jamais d'accord au masculin ou au féminin)
  if (airJeune(age)) return { ambiance: "new-york", pourquoi: "J’ai imaginé pour toi un loft à New York, la ville derrière la vitre 🗽 Tu peux en essayer d’autres !" };
  return { ambiance: "cosy", pourquoi: "J’ai imaginé pour toi un coin cosy, à ton image 🛋️ Tu peux en essayer d’autres !" };
}
