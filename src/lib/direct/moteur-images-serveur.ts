/**
 * 🎨 UNE IMAGE DEMANDÉE AU MOTEUR — partagé par la page d'essais du lot 0 (`univers-essais-serveur.ts`) et la nouvelle
 * figurine (`nouvelle-figurine-serveur.ts`) du chantier « Univers ».
 *
 * Plusieurs images en entrée (`/v1/images/edits`, la première est la toile), ou aucune (`/v1/images/generations`, un
 * décor) ; le fond transparent (détouré s'il ne l'est pas), la fidélité à l'image d'entrée, la qualité ; les replis de
 * moteur (un modèle refusé : le suivant) et de réglages (un réglage inconnu : on le retire et on rejoue). La clé et
 * l'adresse du moteur sont données par l'appelant (les essais automatiques ont leur faux moteur).
 *
 * FICHIER SERVEUR.
 */
import sharp from "sharp";
import { dejaTransparente, detourerSurFondUni, rogner } from "./figurine-pro-serveur";
import { moteurRefuse, moteursDImage, noterRefus } from "./moteur-image";

/**
 * (`taille` : en hauteur par défaut, `1024x1536` ; en largeur, `1536x1024` — les pièces en panorama, `pieces-serveur.ts`.
 * `masque` : une image où ce qui est transparent est à peindre, le reste gardé — la première image prolongée.)
 */
export type DemandeImage = { images: Buffer[]; consigne: string; transparent: boolean; fidelite: "high" | "low"; avant: number; cle: string; base: string; qualite: string; taille?: "1024x1536" | "1536x1024"; masque?: Buffer };
/** L'image rendue (PNG), le modèle qui l'a faite, ses réglages (pour sa signature), ses jetons. */
export type ImageRendue = { png: Buffer; modele: string; reglages: Record<string, string>; jetons?: number };

export async function demanderUneImage(o: DemandeImage): Promise<ImageRendue | { erreur: string }> {
  const k = o.cle;
  if (!k) return { erreur: "Le moteur d’image n’est pas branché ici." };
  const b = o.base || "https://api.openai.com";
  const { liste } = await moteursDImage(k, b);
  const images = await Promise.all(o.images.map((x) => sharp(x).png().toBuffer()));
  const masque = o.masque ? await sharp(o.masque).ensureAlpha().png().toBuffer() : null;
  const dessin = images.length === 0;
  let derniere = "Le moteur d’image n’a pas répondu.";
  for (let m = 0; m < liste.length; m++) {
    const modele = liste[m];
    const reglages: Record<string, string> = {
      size: o.taille ?? "1024x1536",
      quality: o.qualite,
      ...(dessin ? {} : { input_fidelity: o.fidelite }),
      ...(o.transparent ? { background: "transparent" } : {}),
      output_format: "png",
    };
    for (let essai = 0; essai < 4; essai++) {
      const reste = o.avant - Date.now();
      if (reste < 15_000) return { erreur: "Trop long : la fonction allait s’arrêter. Relancez." };
      let r: Response;
      try {
        if (dessin) {
          r = await fetch(`${b}/v1/images/generations`, {
            method: "POST",
            headers: { authorization: `Bearer ${k}`, "content-type": "application/json" },
            body: JSON.stringify({ model: modele, prompt: o.consigne, n: 1, ...reglages }),
            signal: AbortSignal.timeout(reste - 5_000),
          });
        } else {
          const forme = new FormData();
          forme.append("model", modele);
          forme.append("prompt", o.consigne);
          forme.append("n", "1");
          for (const [c, v] of Object.entries(reglages)) forme.append(c, v);
          images.forEach((x, i) => forme.append("image[]", new File([new Uint8Array(x)], `image-${i + 1}.png`, { type: "image/png" })));
          if (masque) forme.append("mask", new File([new Uint8Array(masque)], "masque.png", { type: "image/png" }));
          r = await fetch(`${b}/v1/images/edits`, { method: "POST", headers: { authorization: `Bearer ${k}` }, body: forme, signal: AbortSignal.timeout(reste - 5_000) });
        }
      } catch {
        return { erreur: "Le moteur n’a pas répondu à temps. Relancez." };
      }
      if (r.ok) {
        const j = (await r.json().catch(() => null)) as { data?: { b64_json?: string }[]; usage?: { total_tokens?: number } } | null;
        const b64 = j?.data?.[0]?.b64_json;
        if (!b64) return { erreur: "Le moteur n’a pas rendu d’image." };
        try {
          let png: Buffer = Buffer.from(b64, "base64");
          if (o.transparent) {
            if (!(await dejaTransparente(png))) png = await detourerSurFondUni(png);
            png = await rogner(png);
          }
          return { png, modele, reglages: { ...reglages }, ...(j?.usage?.total_tokens ? { jetons: j.usage.total_tokens } : {}) };
        } catch {
          return { erreur: "L’image rendue n’a pas pu être préparée." };
        }
      }
      const txt = await r.text().catch(() => "");
      derniere = `Le moteur a répondu ${r.status} : ${txt.slice(0, 160)}`;
      if (r.status === 400) {
        const inconnus = Object.keys(reglages).filter((c) => new RegExp(`(unknown|unsupported|unrecognized|not supported|invalid)[^.]{0,60}${c}|${c}[^.]{0,60}(unknown|unsupported|not supported|invalid)`, "i").test(txt));
        if (inconnus.length) {
          for (const c of inconnus) delete reglages[c];
          continue;
        }
        if (/safety|rejected|moderation/i.test(txt)) return { erreur: `Refusé par le moteur (sécurité) : ${txt.slice(0, 160)}` };
      }
      if (m < liste.length - 1 && moteurRefuse(r.status, txt)) {
        noterRefus(modele);
        break;
      }
      return { erreur: derniere };
    }
  }
  return { erreur: derniere };
}
