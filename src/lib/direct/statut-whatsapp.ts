"use client";

// 📲 SON ANNONCE DANS SON STATUT WHATSAPP — en un geste, après chaque publication.
//
// « Tout par le WhatsApp du commerçant, jamais par ClikMe » : un statut WhatsApp est vu par tous
// ceux qui ont enregistré son numéro, pendant 24 heures, gratuitement, et sans l'effet « pub » d'un
// message. ClikMe ne poste rien à sa place : il prépare l'image, et la feuille de partage du
// téléphone l'emmène dans WhatsApp, où il choisit « Mon statut » (en haut de la liste).
//
// L'IMAGE EST COMPOSÉE DANS LE TÉLÉPHONE, au format d'un statut (1080 × 1920) : sa photo plein
// cadre, son titre, son prix, le nom de son commerce et l'adresse de sa page. Rien ne part sur un
// serveur : ses photos sont déjà là (data-URL réduites, voir `Publication.photos`).
//
// COMME POUR `partager-essai.ts`, ON NE DIT JAMAIS « C'EST PUBLIÉ » : le partage OUVRE WhatsApp,
// c'est lui qui appuie sur « Envoyer ». La fonction rend ce qui s'est réellement passé.

/** Ce que le statut montre. */
export type Statut = { photo: string; titre: string; prix?: string; commerce: string; lien: string };

/** Ce qui s'est réellement passé. */
export type SortieStatut = { par: "partage" } | { par: "abandon" } | { par: "telechargement" } | { par: "impossible"; pourquoi: string };

const L = 1080;
const H = 1920;

function charger(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ok(img);
    img.onerror = () => ko(new Error("photo illisible"));
    img.src = src;
  });
}

/** Coupe un titre en lignes qui tiennent dans la largeur (trois au plus, la dernière abrégée). */
function lignes(ctx: CanvasRenderingContext2D, texte: string, largeur: number, max = 3): string[] {
  const mots = texte.split(/\s+/).filter(Boolean);
  const sortie: string[] = [];
  let ligne = "";
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ctx.measureText(essai).width <= largeur || !ligne) ligne = essai;
    else {
      sortie.push(ligne);
      ligne = mot;
    }
  }
  if (ligne) sortie.push(ligne);
  if (sortie.length > max) {
    const gardees = sortie.slice(0, max);
    gardees[max - 1] = `${gardees[max - 1].replace(/\s+\S*$/, "")}…`;
    return gardees;
  }
  return sortie;
}

/** La police de l'application (chargée par Next sous un nom à elle), avec un repli. */
function police(): string {
  try {
    const f = getComputedStyle(document.body).getPropertyValue("--font-clikme").trim();
    return f ? `${f}, system-ui, sans-serif` : "system-ui, sans-serif";
  } catch {
    return "system-ui, sans-serif";
  }
}

/** L'IMAGE DU STATUT : sa photo plein cadre, un dégradé, et ce qu'il faut lire d'un coup d'œil. */
export async function composerStatut(s: Statut): Promise<File> {
  const toile = document.createElement("canvas");
  toile.width = L;
  toile.height = H;
  const ctx = toile.getContext("2d");
  if (!ctx) throw new Error("pas de dessin possible sur ce téléphone");
  const fonte = police();

  // Le fond, puis la photo en plein cadre (recadrée au centre).
  ctx.fillStyle = "#16100D";
  ctx.fillRect(0, 0, L, H);
  const img = await charger(s.photo);
  const echelle = Math.max(L / img.width, H / img.height);
  const lw = img.width * echelle;
  const lh = img.height * echelle;
  ctx.drawImage(img, (L - lw) / 2, (H - lh) / 2, lw, lh);

  // Le dégradé : le texte se lit sur n'importe quelle photo.
  const haut = ctx.createLinearGradient(0, 0, 0, 360);
  haut.addColorStop(0, "rgba(12,8,6,.65)");
  haut.addColorStop(1, "rgba(12,8,6,0)");
  ctx.fillStyle = haut;
  ctx.fillRect(0, 0, L, 360);
  const bas = ctx.createLinearGradient(0, H * 0.48, 0, H);
  bas.addColorStop(0, "rgba(12,8,6,0)");
  bas.addColorStop(0.45, "rgba(12,8,6,.78)");
  bas.addColorStop(1, "rgba(12,8,6,.96)");
  ctx.fillStyle = bas;
  ctx.fillRect(0, H * 0.48, L, H * 0.52);

  // En haut : le nom du commerce.
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FFF4E6";
  ctx.font = `800 50px ${fonte}`;
  ctx.fillText(lignes(ctx, s.commerce, L - 160, 1)[0] ?? "", 80, 150);

  // En bas : le titre, le prix, l'adresse de sa page.
  ctx.font = `900 96px ${fonte}`;
  const titre = lignes(ctx, s.titre, L - 160);
  const interligne = 104;
  let y = H - 330 - (titre.length - 1) * interligne - (s.prix ? 120 : 0);
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = "rgba(0,0,0,.45)";
  ctx.shadowBlur = 24;
  for (const l of titre) {
    ctx.fillText(l, 80, y);
    y += interligne;
  }
  ctx.shadowBlur = 0;
  if (s.prix) {
    ctx.font = `900 64px ${fonte}`;
    const w = ctx.measureText(s.prix).width + 64;
    ctx.fillStyle = "#F5A23A";
    // Les coins arrondis manquent aux vieux téléphones : un rectangle fait l'affaire.
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(80, y - 20, w, 96, 48);
      ctx.fill();
    } else ctx.fillRect(80, y - 20, w, 96);
    ctx.fillStyle = "#2A1608";
    ctx.fillText(s.prix, 112, y + 52);
    y += 140;
  }
  // L'adresse se lit en entier : elle rapetisse plutôt que de disparaître derrière « … ».
  const adresse = `👉 ${s.lien.replace(/^https?:\/\/(www\.)?/, "")}`;
  let taille = 44;
  do ctx.font = `700 ${taille}px ${fonte}`;
  while (ctx.measureText(adresse).width > L - 160 && (taille -= 2) >= 26);
  ctx.fillStyle = "rgba(255,244,230,.88)";
  ctx.fillText(adresse, 80, H - 150, L - 160);

  const blob = await new Promise<Blob | null>((ok) => toile.toBlob(ok, "image/jpeg", 0.9));
  if (!blob) throw new Error("image impossible à fabriquer");
  return new File([blob], "mon-annonce-clikme.jpg", { type: "image/jpeg" });
}

/** Le texte qui accompagne l'image (WhatsApp le garde en légende quand il le peut). */
export function texteDuStatut(s: Statut): string {
  return `${s.titre}${s.prix ? ` · ${s.prix}` : ""} — ${s.commerce}\n👉 ${s.lien}`;
}

/**
 * OUVRIR LA FEUILLE DE PARTAGE AVEC L'IMAGE ; SINON, LA TÉLÉCHARGER.
 *
 * Un ordinateur, ou un navigateur sans partage de fichiers : l'image est enregistrée, et l'écran
 * dit comment la mettre en statut à la main (WhatsApp › Actus › Mon statut).
 */
export async function partagerEnStatut(s: Statut): Promise<SortieStatut> {
  let fichier: File;
  try {
    fichier = await composerStatut(s);
  } catch (e) {
    return { par: "impossible", pourquoi: e instanceof Error ? e.message : String(e) };
  }
  const n = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  const donnees: ShareData = { files: [fichier], text: texteDuStatut(s) };
  if (typeof n.share === "function" && n.canShare?.(donnees)) {
    try {
      await n.share(donnees);
      return { par: "partage" };
    } catch (e) {
      // Refermé sans rien choisir : ce n'est pas une erreur.
      if (e instanceof DOMException && e.name === "AbortError") return { par: "abandon" };
    }
  }
  const url = URL.createObjectURL(fichier);
  const a = document.createElement("a");
  a.href = url;
  a.download = fichier.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return { par: "telechargement" };
}
