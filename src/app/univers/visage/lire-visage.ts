/**
 * 📷 LA LECTURE DU VISAGE, SUR LE TÉLÉPHONE (`docs/univers/decouvrir.md`, section 28.3) : la caméra de devant, et la
 * lecture du visage de Google (MediaPipe, « Face Landmarker »), chargée une fois depuis son dépôt public au premier
 * allumage — rien n'est envoyé : on n'en garde que l'expression du moment (`expressionDuVisage`) et l'inclinaison de la
 * tête.
 *
 * Les essais remplacent le module chargé (la même adresse) par un faux, qui rend ce que l'essai lui dit.
 */
import { expressionDuVisage, type ExpressionVisage } from "@/lib/direct/visage-essai";

export const VERSION_LECTURE = "0.10.14";
export const MODULE_LECTURE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION_LECTURE}/vision_bundle.mjs`;
const FICHIERS = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION_LECTURE}/wasm`;
const MODELE = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/** Ce qu'on garde d'une image de la caméra : l'expression, la tête penchée (le roulis, en radians), tournée (le lacet). */
export type LectureVisage = { expression: ExpressionVisage | null; roulis: number; lacet: number };
type Point = { x: number; y: number };
type Resultat = { faceBlendshapes?: { categories?: { categoryName: string; score: number }[] }[]; faceLandmarks?: Point[][] };
type Lecteur = { detectForVideo: (v: HTMLVideoElement, t: number) => Resultat; close?: () => void };
type ModuleLecture = {
  FilesetResolver: { forVisionTasks: (chemin: string) => Promise<unknown> };
  FaceLandmarker: { createFromOptions: (f: unknown, o: Record<string, unknown>) => Promise<Lecteur> };
};

// (un import au moment voulu, que l'outil de construction ne touche pas : l'adresse est publique, hors de l'appli)
const importer = new Function("u", "return import(u)") as (u: string) => Promise<ModuleLecture>;

/** Ouvre la lecture du visage (la carte graphique si elle veut bien, sinon le processeur). */
export async function ouvrirLecture(): Promise<{ lire: (v: HTMLVideoElement) => LectureVisage | null; fermer: () => void }> {
  const m = await importer(MODULE_LECTURE);
  const fichiers = await m.FilesetResolver.forVisionTasks(FICHIERS);
  const options = (delegate: "GPU" | "CPU") => ({ baseOptions: { modelAssetPath: MODELE, delegate }, outputFaceBlendshapes: true, runningMode: "VIDEO", numFaces: 1 });
  const lecteur = await m.FaceLandmarker.createFromOptions(fichiers, options("GPU")).catch(() => m.FaceLandmarker.createFromOptions(fichiers, options("CPU")));
  let dernier = -1;
  return {
    lire: (v) => {
      if (v.readyState < 2) return null;
      const t = Math.max(dernier + 1, performance.now());
      dernier = t;
      const r = lecteur.detectForVideo(v, t);
      const formes = r.faceBlendshapes?.[0]?.categories;
      const points = r.faceLandmarks?.[0];
      if (!formes?.length) return null;
      const b: Record<string, number> = {};
      for (const c of formes) b[c.categoryName] = c.score;
      // (la tête : la ligne des yeux pour le roulis, le nez entre les yeux pour le lacet — l'image de la caméra n'est
      // pas en miroir : l'écran inverse, pour que la figurine fasse comme un miroir)
      let roulis = 0;
      let lacet = 0;
      if (points && points.length > 263) {
        const [g, d, nez] = [points[33], points[263], points[1]];
        roulis = Math.atan2(d.y - g.y, d.x - g.x);
        const ecart = Math.hypot(d.x - g.x, d.y - g.y) || 1;
        lacet = (nez.x - (g.x + d.x) / 2) / ecart;
      }
      return { expression: expressionDuVisage(b), roulis, lacet };
    },
    fermer: () => lecteur.close?.(),
  };
}
