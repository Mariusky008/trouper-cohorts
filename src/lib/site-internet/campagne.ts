// Une phrase du commerçant → trois publications, une par canal.
//
// C'est le cœur de la démonstration « Options Pro » : il n'écrit qu'une ligne et
// voit trois objets différents, habillés pour WhatsApp, Instagram et Facebook.
// La transformation doit être VISIBLE — sinon rien ne justifie l'option.
//
// Ce fichier contient le repli déterministe, utilisable côté serveur ET client :
// l'animation ne doit jamais attendre le réseau. Si l'IA répond, ses textes
// remplacent ceux-ci ; sinon on affiche quand même quelque chose de correct.
//
// RÈGLE : on ne fabrique rien qui ne soit pas dans la phrase du pro. Pas de prix,
// pas de date, pas de pourcentage inventé — on reformate, on n'invente pas.

export type Campagne = { wa: string; insta: string; fb: string };

const clean = (s: string) => String(s || "").replace(/\s+/g, " ").trim();

/** Retire le « — chez X » ajouté à l'annonce : sur Instagram, le nom est déjà là. */
function sansSignature(texte: string, nom: string): string {
  const t = clean(texte);
  if (!nom) return t;
  const i = t.toLowerCase().indexOf(`chez ${nom.toLowerCase()}`);
  if (i < 0) return t;
  return clean(t.slice(0, i).replace(/[—–\-·,;:]\s*$/, ""));
}

/** Première phrase utile — pour les canaux où la longueur compte. */
function noyau(texte: string): string {
  const t = clean(texte);
  const m = t.match(/^(.{10,140}?[.!?])(\s|$)/);
  return clean(m ? m[1] : t.slice(0, 140));
}

/** Hashtags à partir du métier et de la ville — jamais de mots-clés inventés. */
export function hashtags(metier: string, ville: string): string {
  const tag = (s: string) =>
    "#" +
    clean(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  return [metier && tag(metier), ville && tag(ville), "#commercelocal"].filter(Boolean).join(" ");
}

/**
 * Repli déterministe : trois mises en forme du MÊME message.
 * Utilisé tel quel si l'IA n'est pas joignable, et comme filet pendant l'animation.
 */
export function campagneFallback(annonce: string, nom: string, metier: string, ville: string): Campagne {
  const brut = clean(annonce);
  const sansNom = sansSignature(brut, nom);
  const court = noyau(sansNom) || sansNom;
  return {
    // WhatsApp : on parle à quelqu'un qu'on connaît, court, une seule question.
    wa: `Bonjour ! ${court} Répondez-moi et je vous réserve ça 🙂`,
    // Instagram : la photo porte le message, la légende respire.
    insta: `${court}\n\n📍 ${nom}${ville ? ` · ${ville}` : ""}\n${hashtags(metier, ville)}`,
    // Facebook : plus explicite, et on donne le chemin pour réserver.
    fb: `${court}\n\nRéservez directement depuis notre site — c'est plus simple que le téléphone 🙂`,
  };
}

/** Valide/normalise ce que renvoie le modèle, avec repli champ par champ. */
export function campagneFromModel(raw: unknown, secours: Campagne): Campagne {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = (k: keyof Campagne, max: number) => {
    const v = clean(String(o[k] ?? "")).slice(0, max);
    return v.length > 15 ? v : secours[k];
  };
  return { wa: pick("wa", 400), insta: pick("insta", 500), fb: pick("fb", 500) };
}
