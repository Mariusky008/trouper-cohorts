/**
 * 🌐 LE COMPTOIR D'UN VRAI COMMERÇANT — ce qu'il publie part en base.
 *
 * « Une fois que le commerçant aura créé son annonce, ça partira sur sa page
 * commerçant et sur le catalogue de la ville. »
 *
 * DEUX ROUTES DE L'ESPACE PRO, LE MÊME JETON (celui de son lien pro) :
 *
 *   · `/api/site-internet/pro/experience` — LE PLAT DU RESTAURANT, l'étape 2
 *     de son Expérience : son nom, son prix, ses photos (la scène est faite
 *     d'après la première), SA VOIX telle que le micro l'enregistre, et sa fin.
 *     Le mode d'emploi est dans `docs/experience-restaurant-espace-pro.md`.
 *   · `/api/site-internet/pro/pieces` — LA PIÈCE À ESSAYER (coupe, pose,
 *     monture, pièce, création) ou LE LIVRE CONSEILLÉ, avec sa photo : elle
 *     entre en tête de son catalogue, donc dans l'essayage de sa page et dans
 *     « Ton prochain livre ». Voir `pieces-comptoir.ts`.
 *   · `/api/site-internet/pro/offer` (`set`) — L'ANNONCE, pour tous les
 *     métiers : elle entre dans Le Direct de sa ville et s'affiche en bandeau
 *     sur sa page. « Il en reste ! » passe par là, avec son échéance de deux
 *     heures.
 *
 * UNE REQUÊTE TIENT EN 4,5 MO (limite de Vercel). Les photos du comptoir sont
 * réduites à mille points et un mot de dix secondes pèse une centaine de
 * kilo-octets : un plat entier y tient largement. La voix part avec le plat
 * et avec la pièce (le livre conseillé, la coupe), jamais avec l'annonce.
 *
 * FICHIER NAVIGATEUR.
 */
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { Publication } from "@/lib/direct/comptoir";
import type { Mission } from "@/lib/direct/missions-commercant";

export type ResultatEnvoi = { ok: boolean; ou: string[]; erreur?: string };

/** Les métiers dont la pièce entre au catalogue avec sa photo. */
const AVEC_PIECE = ["coiffure", "ongles", "lunettes", "mode", "createur", "librairie"];

async function poster(url: string, corps: unknown): Promise<{ ok: boolean; erreur?: string; json?: Record<string, unknown> }> {
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
    const json = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok) return { ok: false, erreur: String(json.error ?? json.erreur ?? `Erreur ${r.status}`), json };
    return { ok: true, json };
  } catch {
    return { ok: false, erreur: "Pas de connexion. Réessaie dans un instant." };
  }
}

/** Le texte de l'annonce dans Le Direct : 140 signes au plus, dans les mots du métier. */
export function texteDeLAnnonce(c: CommerceComptoir, mission: Mission, p: Publication): string {
  const prix = p.prix ? ` · ${p.prix}` : "";
  let t: string;
  if (p.genre === "relance") t = `Il en reste ! ${p.detail ?? ""} · ${p.nom}${prix}`;
  else if (c.famille === "table") t = `${p.nom}${prix}`;
  else if (c.famille === "librairie") t = `Le conseil du libraire : ${p.nom}${prix}`;
  else if (["coiffure", "ongles", "lunettes", "mode"].includes(c.famille)) t = `${mission.quoi} : ${p.nom}${prix}`;
  else t = `${p.nom}${prix}`;
  return t.replace(/\s+/g, " ").replace(/ · ·/g, " ·").trim().slice(0, 140);
}

/**
 * PUBLIER EN LIGNE. Rend où c'est arrivé (« ta page », « Le Direct ») ou la
 * raison de l'échec — le comptoir l'affiche, avec « Réessayer ».
 */
export async function envoyerEnLigne(
  c: CommerceComptoir,
  mission: Mission,
  p: Publication,
  principal?: Publication,
): Promise<ResultatEnvoi> {
  if (!c.reel) return { ok: false, ou: [], erreur: "Ce commerce n'a pas de lien pro." };
  const { slug, token } = c.reel;
  const ou: string[] = [];
  const erreurs: string[] = [];

  // ── LE PLAT DU RESTAURANT : SA PAGE, ÉTAPE 2 ──
  if (c.famille === "table" && p.genre === "principal") {
    const r = await poster("/api/site-internet/pro/experience", {
      slug,
      token,
      action: "poser",
      plat: {
        nom: p.nom,
        prix: p.prix,
        photos: p.photos.slice(0, 4),
        ...(p.voix ? { voix: p.voix, voixSecondes: p.voixSecondes } : {}),
        ...(p.voixTexte ? { voixTexte: p.voixTexte } : {}),
        fin: p.finLe,
      },
    });
    if (r.ok) ou.push("ta page");
    else erreurs.push(r.erreur ?? "Le plat n'a pas pu partir.");
  }

  // ── LA PIÈCE À ESSAYER, LE LIVRE CONSEILLÉ : SON CATALOGUE ──
  if (AVEC_PIECE.includes(c.famille) && p.genre === "principal" && p.photos[0]) {
    const r = await poster("/api/site-internet/pro/pieces", {
      slug,
      token,
      action: "poser",
      piece: {
        id: p.id,
        nom: p.nom,
        prix: p.prix,
        photo: p.photos[0],
        rayon: c.famille === "librairie" ? "Ses coups de cœur" : mission.quoi,
        ...(c.famille !== "librairie" ? { decrire: p.nom } : {}),
        ...(p.voixTexte ? { detail: p.voixTexte } : {}),
        // SA VOIX PART AVEC LE LIVRE : « la libraire peut mettre un petit
        // message vocal […] mais je ne la vois pas apparaître ». Elle restait
        // dans le comptoir ; elle suit maintenant la pièce.
        ...(p.voix ? { voix: p.voix, voixSecondes: p.voixSecondes, voixTexte: p.voixTexte } : {}),
        fin: p.finLe,
      },
    });
    if (r.ok) ou.push(c.famille === "librairie" ? "« Ton prochain livre »" : "ton essayage");
    else erreurs.push(r.erreur ?? "La pièce n'a pas pu partir.");
  }

  // ── L'ANNONCE : LE DIRECT, ET LE BANDEAU DE SA PAGE ──
  const photo = p.photos[0] ?? (p.genre === "relance" ? principal?.photos[0] : undefined);
  if (photo) {
    const r = await poster("/api/site-internet/pro/offer", {
      slug,
      token,
      action: "set",
      text: texteDeLAnnonce(c, mission, p),
      photo,
      until: new Date(p.genre === "relance" ? Math.min(p.finLe, Date.now() + 2 * 3600_000) : p.finLe).toISOString(),
      famille: c.famille === "table" && p.genre === "principal" ? "menu" : "offre",
    });
    if (r.ok) ou.push("Le Direct");
    else erreurs.push(r.erreur ?? "L'annonce n'a pas pu partir.");
  }

  return erreurs.length ? { ok: ou.length > 0, ou, erreur: erreurs.join(" ") } : { ok: true, ou };
}

/** Retirer en ligne : le plat de sa page, et l'annonce du Direct qui porte ce texte. */
export async function retirerEnLigne(c: CommerceComptoir, mission: Mission, p: Publication): Promise<void> {
  if (!c.reel) return;
  const { slug, token } = c.reel;
  if (c.famille === "table" && p.genre === "principal") {
    await poster("/api/site-internet/pro/experience", { slug, token, action: "poser", plat: null });
  }
  if (AVEC_PIECE.includes(c.famille) && p.genre === "principal") {
    await poster("/api/site-internet/pro/pieces", { slug, token, action: "retirer", id: p.id });
  }
  const liste = await poster("/api/site-internet/pro/offer", { slug, token, action: "annonces" });
  const texte = texteDeLAnnonce(c, mission, p);
  const annonces = (liste.json?.annonces ?? []) as { id: string; texte: string }[];
  const cible = annonces.find((a) => a.texte.trim() === texte);
  if (cible) await poster("/api/site-internet/pro/offer", { slug, token, action: "retirer_annonce", id: cible.id });
}
