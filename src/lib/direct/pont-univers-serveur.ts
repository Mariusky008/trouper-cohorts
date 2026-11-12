/**
 * 🌉 LE PONT — sa figurine du nouveau style devient celle de l'appli d'aujourd'hui (la bascule « Univers pour tous »,
 * `univers-pour-tous.ts` ; le propriétaire, le 12 novembre 2026 : « figurines actuelles refaites »).
 *
 * L'appli d'aujourd'hui (ses mèmes, ses réactions, ses vidéos, le talkie, la figurine du mois) lit sa figurine dans
 * `clik_ma_figurine` : `neutre` (bouche fermée) et `parle` (bouche ouverte). Quand il a validé sa figurine du nouveau
 * style (« C'est moi ! ») et que sa bouche ouverte est faite, sa ligne reçoit ses deux images assises : `neutre` = son
 * image « assise », `parle` = « assise_parle ». Son ancienne figurine n'est pas effacée (son dossier reste rangé).
 *
 * SES VISAGES suivent sans rien copier : ceux de l'appli sont rangés dans `dossierExpressions(h, <neutre>)`, ceux du
 * nouveau style dans `dossierExpressions(h, <son image assise>)` — le même dossier. Pour qu'aucun visage de l'ancien style
 * ne s'y fabrique, la route des visages passe la main au nouveau style (`visagesDuNouveauStyle`).
 *
 * Fait quand l'interrupteur est allumé : en ouvrant l'appli (le `GET` de `/api/direct/ma-figurine`), et dès que ses
 * images du nouveau style sont faites. Une nouvelle image (son fauteuil aux couleurs de son monde) : le pont suit.
 *
 * FICHIER SERVEUR.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { lireFichePerso } from "./fiches-serveur";
import { sentimentValide } from "./ma-figurine";
import { cheminVisages, ecrireJson, lireLigne, prenomDe, visagesVoulus } from "./ma-figurine-serveur";
import { universPourTous } from "./univers-pour-tous";
import { fabriquerVisagesPerso, visagesPersoVoulus } from "./visages-perso-serveur";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

/** Ses deux images assises du nouveau style (validées, bouche ouverte faite) ; `null` sinon. */
async function sesImagesAssises(supabase: Supabase, h: string): Promise<{ neutre: string; parle: string; photo?: string; accord_le?: string } | null> {
  const { fiche } = await lireFichePerso(supabase, h);
  if (fiche?.style !== "collection-1") return null;
  const neutre = s(fiche.references.assise?.chemin);
  const parle = s(fiche.references.assise_parle?.chemin);
  if (!neutre || !parle) return null;
  return { neutre, parle, ...(fiche.photo?.chemin ? { photo: fiche.photo.chemin } : {}), ...(fiche.photo?.accord_le ? { accord_le: fiche.photo.accord_le } : {}) };
}

/**
 * 🌉 Le pont, s'il y a lieu (l'interrupteur allumé, sa figurine du nouveau style prête, sa ligne pas encore à jour).
 * Rend `true` quand sa ligne a changé.
 */
export async function poserLePont(supabase: Supabase, habitant: Habitant): Promise<boolean> {
  if (!universPourTous()) return false;
  const imgs = await sesImagesAssises(supabase, habitant.id).catch(() => null);
  if (!imgs) return false;
  const { ok, ligne } = await lireLigne(supabase, habitant.id);
  if (!ok) return false;
  if (s(ligne?.neutre) === imgs.neutre && s(ligne?.parle) === imgs.parle && ligne?.prete_le) return false;
  const maintenant = new Date().toISOString();
  const maj = { neutre: imgs.neutre, parle: imgs.parle, prete_le: s(ligne?.prete_le) || maintenant, refus: null, updated_at: maintenant };
  const { error } = ligne
    ? await supabase.from("clik_ma_figurine").update(maj).eq("habitant_id", habitant.id)
    : await supabase.from("clik_ma_figurine").insert({
        habitant_id: habitant.id,
        prenom: await prenomDe(supabase, habitant),
        photo: imgs.photo ?? null,
        accord_le: imgs.accord_le ?? maintenant,
        demande_le: maintenant,
        ...maj,
      });
  return !error;
}

/** Sa figurine de l'appli est-elle celle du nouveau style (le pont posé) ? */
export async function figurineDuNouveauStyle(supabase: Supabase, h: string): Promise<boolean> {
  const [imgs, { ligne }] = await Promise.all([sesImagesAssises(supabase, h).catch(() => null), lireLigne(supabase, h)]);
  return Boolean(imgs && s(ligne?.neutre) === imgs.neutre);
}

/**
 * 🎭 Ses visages, quand sa figurine est du nouveau style : `veut` (celui qu'il vient de choisir) est retenu comme
 * aujourd'hui, puis un tour de fabrication du nouveau style (`fabriquerVisagesPerso`).
 */
export async function visagesDuNouveauStyle(supabase: Supabase, h: string, avant: number, veut?: unknown): Promise<{ error?: string; enCours?: boolean }> {
  const nouveau = sentimentValide(veut);
  const voulus = await visagesVoulus(supabase, h);
  if (nouveau && !voulus.includes(nouveau)) await ecrireJson(supabase, cheminVisages(h), { voulus: [...voulus, nouveau] });
  const r = await fabriquerVisagesPerso(supabase, h, avant, await visagesPersoVoulus(supabase, h));
  return r.erreur ? { error: r.erreur } : r.enCours ? { enCours: true } : {};
}
