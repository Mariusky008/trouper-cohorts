/**
 * 🎬 LES MISES EN SCÈNE DU SALON, TOUTES (`docs/univers/salon-du-duo.md`, section 9). Chaque lot qui en écrit (les gestes
 * et les panneaux du lot S3, les mèmes du lot S5…) les enregistre dans SON fichier (`enregistrerMiseEnScene`, le contrat
 * `src/lib/direct/salon.ts`) et ajoute ici UNE ligne qui l'importe : le salon et son adresse d'essai importent ce
 * fichier-ci, et ont ainsi toutes les mises en scène.
 *
 * (Un geste sans mise en scène ne fait rien : `scene.geste` rend tout de suite.)
 */
// 🛋️ lot S3 : les gestes (👋 😘 🤜 🪶 🌷 🤗 ☕ 🎶 🎁) et les huit panneaux
import "./gestes";
