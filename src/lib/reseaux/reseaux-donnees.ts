/**
 * 📣 SES RÉSEAUX SOCIAUX — « une photo, et vous êtes partout ».
 *
 * « Ils n'ont qu'une seule manipulation à faire et tout est fait
 * automatiquement. » Ce qu'il publie au comptoir part dans Le Direct, sur sa
 * page… et maintenant sur SON Instagram et SA page Facebook, sans qu'il
 * ouvre une seule de ces applications.
 *
 * PAR UN INTERMÉDIAIRE, PAS EN DIRECT. Instagram, Facebook et TikTok ne
 * laissent publier à la place de quelqu'un qu'une application qu'ils ont
 * auditée — des semaines d'instruction, à refaire pour chaque réseau. Un
 * intermédiaire (PostPeer, voir `intermediaire.ts`) a déjà ces autorisations :
 * le commerçant connecte ses comptes une fois chez lui, en quelques touches,
 * et nous n'avons plus qu'à lui dire « publie ça ».
 *
 * PAS DE RÉPONSES AUTOMATIQUES. « N'ajoute pas l'intermédiaire réponse
 * automatique pour le moment, déjà les publications sur tous les réseaux
 * sociaux c'est déjà pas mal. »
 *
 * RANGÉ DANS SON DIAGNOSTIC (`diagnostic.reseaux`), comme ses pièces et son
 * Expérience : une colonne qui existe déjà, aucune migration.
 *
 * FICHIER PARTAGÉ : aucune dépendance au serveur.
 */

/** Un compte qu'il a connecté chez l'intermédiaire. `id` est celui que l'intermédiaire attend pour publier. */
export type CompteReseau = { id: string; plateforme: string; nom?: string };

/** Ce qui est arrivé à sa dernière publication sur ses réseaux — il le voit au comptoir. */
export type DernierePublication = {
  at: string;
  texte: string;
  ok: string[];
  erreurs: { plateforme: string; message: string }[];
};

export type Reseaux = {
  /** Son profil chez l'intermédiaire : un par commerçant, ses comptes y sont rangés. */
  profil?: string;
  comptes: CompteReseau[];
  /** « Chaque publication part aussi sur mes réseaux. » Allumé dès qu'il connecte un compte. */
  auto: boolean;
  derniere?: DernierePublication;
};

/**
 * Les réseaux proposés au comptoir, dans l'ordre où on les montre. Voir `plateformesProposees`.
 *
 * INSTAGRAM ET FACEBOOK SEULEMENT. Chez PostPeer, on trouve Facebook,
 * Instagram, LinkedIn et YouTube — ni TikTok, ni Google Business. YouTube
 * n'accepte que des vidéos, nos annonces sont des photos ; LinkedIn n'est pas
 * là où sont les clients d'un commerce de quartier. Un bouton « Connecter »
 * qui mène à un refus serait pire que pas de bouton. LinkedIn s'ajoute par
 * `RESEAUX_PLATEFORMES` si un commerçant le demande.
 */
export const PLATEFORMES_PAR_DEFAUT = ["instagram", "facebook"];

const NOMS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  googlebusiness: "Google",
  google: "Google",
  linkedin: "LinkedIn",
  threads: "Threads",
  pinterest: "Pinterest",
  twitter: "X",
  x: "X",
  youtube: "YouTube",
  bluesky: "Bluesky",
};

const ICONES: Record<string, string> = {
  instagram: "📸",
  facebook: "👍",
  tiktok: "🎵",
  googlebusiness: "📍",
  google: "📍",
  threads: "🧵",
  pinterest: "📌",
  linkedin: "💼",
};

export const nomDuReseau = (p: string) => NOMS[p] ?? p.charAt(0).toUpperCase() + p.slice(1);
export const iconeDuReseau = (p: string) => ICONES[p] ?? "🌐";

/** « Instagram, Facebook et LinkedIn ». */
export function reseauxEnMots(plateformes: string[]): string {
  const noms = [...new Set(plateformes.map(nomDuReseau))];
  if (noms.length <= 1) return noms.join("");
  return `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
}

const s = (v: unknown) => String(v ?? "").trim();

/** Ses réseaux tels que le diagnostic les garde — rien de mal formé. */
export function reseauxDuDiagnostic(diag: unknown): Reseaux {
  const d = (diag && typeof diag === "object" ? diag : {}) as Record<string, unknown>;
  const r = (d.reseaux && typeof d.reseaux === "object" ? d.reseaux : {}) as Record<string, unknown>;
  const comptes: CompteReseau[] = [];
  for (const x of Array.isArray(r.comptes) ? r.comptes : []) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const id = s(o.id).slice(0, 120);
    const plateforme = s(o.plateforme).toLowerCase().slice(0, 40);
    if (id && plateforme) comptes.push({ id, plateforme, ...(s(o.nom) ? { nom: s(o.nom).slice(0, 80) } : {}) });
  }
  const dr = (r.derniere && typeof r.derniere === "object" ? r.derniere : null) as Record<string, unknown> | null;
  const derniere: DernierePublication | undefined =
    dr && s(dr.at)
      ? {
          at: s(dr.at),
          texte: s(dr.texte).slice(0, 300),
          ok: (Array.isArray(dr.ok) ? dr.ok : []).map(s).filter(Boolean),
          erreurs: (Array.isArray(dr.erreurs) ? dr.erreurs : [])
            .map((e) => (e && typeof e === "object" ? (e as Record<string, unknown>) : {}))
            .map((e) => ({ plateforme: s(e.plateforme), message: s(e.message).slice(0, 200) }))
            .filter((e) => e.plateforme),
        }
      : undefined;
  return {
    ...(s(r.profil) ? { profil: s(r.profil).slice(0, 120) } : {}),
    comptes,
    auto: r.auto === true,
    ...(derniere ? { derniere } : {}),
  };
}

/** Sans accents, sans espaces : « Saint-Paul-lès-Dax » → « SaintPaulLesDax ». */
function enHashtag(mot: string): string {
  return mot
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase())
    .join("");
}

/**
 * LA LÉGENDE DE SA PUBLICATION. Ses mots d'abord — ceux qu'il a écrits au
 * comptoir, sans rien y ajouter qu'il n'ait dit —, puis où le trouver : son
 * nom, sa ville, sa page. Les mots-dièse ne nomment que des faits (sa ville,
 * son métier) : on n'invente pas « #promo » à sa place.
 */
export function legendeReseaux(p: { texte: string; nom: string; ville?: string; metier?: string; lien?: string }): string {
  const lignes = [p.texte.trim()];
  const ou = [p.nom.trim(), s(p.ville)].filter(Boolean).join(" · ");
  if (ou) lignes.push("", `📍 ${ou}`);
  if (p.lien) lignes.push(`👉 ${p.lien}`);
  const tags = [s(p.ville), s(p.metier)]
    .map(enHashtag)
    .filter((t) => t.length >= 2 && t.length <= 40)
    .map((t) => `#${t}`);
  if (tags.length) lignes.push("", [...new Set(tags)].join(" "));
  return lignes.join("\n").slice(0, 2000);
}
