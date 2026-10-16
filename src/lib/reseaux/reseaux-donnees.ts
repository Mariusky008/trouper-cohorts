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
 * INSTAGRAM, FACEBOOK ET SA FICHE GOOGLE. Chez PostPeer, on trouve aussi
 * LinkedIn et YouTube, mais pas TikTok. YouTube n'accepte que des vidéos, nos
 * annonces sont des photos. LinkedIn n'est pas là où sont les clients d'un
 * commerce de quartier : il s'ajoute par `RESEAUX_PLATEFORMES` si un
 * commerçant le demande.
 *
 * GOOGLE, C'EST LÀ OÙ ON LE CHERCHE. « J'ai réussi à mettre Google Business
 * sur PostPeer. » Son annonce apparaît sur sa fiche Google, dans la recherche
 * et sur Maps, au moment où quelqu'un tape son nom ou « boutique Vevey ».
 */
export const PLATEFORMES_PAR_DEFAUT = ["instagram", "facebook", "googlebusiness"];

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

/* ═══ CHAQUE POST DEVIENT UNE PORTE ═══════════════════════════════════════
 *
 * « Chaque post, sur tous les réseaux, devient une porte. Il finit par
 * “✨ Essaie-la sur toi” ou “Découvre…” selon la catégorie du commerçant, qui
 * ouvre l'essai de cette pièce précise — vêtement, ongles, tatouage… — avec
 * sa photo à elle et même son propre jean. »
 *
 * LA PORTE OUVRE L'ESSAI DE CETTE PIÈCE-LÀ (`?p=` → `?essayer=` sur sa page,
 * voir `app/b/[slug]`), pas sa page en général : on a vu une veste, on
 * l'essaie. Chez une boutique de vêtements, l'atelier propose aussi « Avec
 * mes vêtements » — son jean à elle, rangé dans son dressing.
 *
 * TROIS RÉSEAUX, TROIS FAÇONS DE TENIR LA PORTE :
 *   · Instagram ne rend pas un lien cliquable dans un texte : la porte dit
 *     « lien en bio », et sa bio porte UN lien fixe (`lienDeBio`) qui ouvre
 *     toujours ses pièces du jour ;
 *   · Facebook rend le lien cliquable : il est au bout de la phrase ;
 *   · Google le met dans le bouton du post (`bouton`), et rien dans le texte.
 *
 * FICHIER PARTAGÉ, SANS DÉPENDANCE : l'adresse du site se passe en argument.
 */

/** Ce qu'on fait en passant la porte, et le bouton de son post Google qui y mène. */
export type Porte = {
  /** « ✨ Essaie-la sur toi » — la fin de son post. */
  mot: string;
  /** Le bouton du post Google (les seuls que Google connaît) : « Réserver », « En savoir plus ». */
  bouton: "BOOK" | "LEARN_MORE";
  /** La porte ouvre l'essai de LA pièce du post, pas seulement son expérience. */
  essai: boolean;
};

/** Les métiers où une pièce précise s'essaie sur soi (ou chez soi) depuis sa page. */
const ESSAI_DE_LA_PIECE = ["mode", "coiffeur", "ongles", "lunetier", "artisan"];

/**
 * LA PORTE DE SON MÉTIER. `branche` : celle de sa page (`brancheDuMetier`) ;
 * `metier` : son activité en clair — le tatoueur est un « artisan » dont la
 * pièce s'essaie sur la peau. `piece` : le post porte une pièce de son
 * catalogue, que la porte ouvre directement.
 */
export function porteDuPost(p: { branche: string; metier?: string; piece?: boolean }): Porte {
  const piece = Boolean(p.piece) && ESSAI_DE_LA_PIECE.includes(p.branche);
  const essai = (mot: string): Porte => ({ mot, bouton: "LEARN_MORE", essai: piece });
  switch (p.branche) {
    case "mode":
      return essai(piece ? "✨ Essaie-la sur toi" : "✨ Essaie la collection sur toi");
    case "coiffeur":
      return essai(piece ? "✨ Essaie-la sur toi" : "✨ Essaie nos coupes sur toi");
    case "ongles":
      return essai(piece ? "💅 Essaie-la sur tes ongles" : "💅 Essaie nos poses sur tes ongles");
    case "lunetier":
      return essai(piece ? "👓 Essaie-la sur ton visage" : "👓 Essaie nos montures sur ton visage");
    case "artisan":
      if (/tatou/i.test(s(p.metier))) return essai(piece ? "✨ Essaie-le sur ta peau" : "✨ Essaie nos motifs sur ta peau");
      return essai(piece ? "✨ Vois-la chez toi" : "✨ Découvre nos créations");
    case "fleuriste":
      return essai("💐 Vois nos bouquets chez toi");
    case "restaurant":
      return { mot: "🍽️ Découvre le plat", bouton: "BOOK", essai: false };
    case "bar":
      return { mot: "🥂 Découvre la soirée", bouton: "BOOK", essai: false };
    case "librairie":
      return { mot: "📚 Trouve ton prochain livre", bouton: "LEARN_MORE", essai: false };
    default:
      return { mot: "✨ Découvre la suite", bouton: "LEARN_MORE", essai: false };
  }
}

/** Une pièce de son catalogue, telle qu'elle peut voyager dans une adresse. */
export const idDePiece = (v: unknown): string | undefined => {
  const id = s(v);
  return /^[\w.-]{1,60}$/.test(id) ? id : undefined;
};

/**
 * LE LIEN FIXE DE SA BIO INSTAGRAM — « il ouvre toujours les pièces du jour ».
 * Le même toute l'année : sa page s'ouvre sur son expérience, où sa pièce du
 * jour est en vedette. `site` : l'adresse du site (`SITE_URL`).
 */
export const lienDeBio = (site: string, slug: string) => `${site.replace(/\/+$/, "")}/b/${encodeURIComponent(slug)}`;

/** La porte d'UN post : l'essai de sa pièce quand il y en a une, son expérience sinon. */
export const lienDeLaPorte = (site: string, slug: string, piece?: string) =>
  `${lienDeBio(site, slug)}${piece ? `?p=${encodeURIComponent(piece)}` : ""}`;

/** « clikme.fr/b/chez-bergine » — l'adresse telle qu'on la lit, sans « https://www. ». */
export const adresseLisible = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, "");

/**
 * SES MOTS, ÉCRITS — ce qu'il a dit à son micro au comptoir, transcrit, et
 * qu'il a gardé (« On garde ! »). Ce sont les siens : ils partent entre
 * guillemets, sans un mot de plus. Coupés à la fin d'une phrase quand ils
 * sont longs, jamais au milieu d'un mot.
 */
export function motsPourLesReseaux(texte: unknown, max = 600): string {
  const t = s(texte)
    .replace(/\s+/g, " ")
    .replace(/^[«"“\s]+|[»"”\s]+$/g, "")
    .trim();
  if (t.length <= max) return t;
  const coupe = t.slice(0, max);
  const finDePhrase = Math.max(coupe.lastIndexOf(". "), coupe.lastIndexOf("! "), coupe.lastIndexOf("? "));
  if (finDePhrase > max * 0.5) return coupe.slice(0, finDePhrase + 1);
  return `${coupe.slice(0, coupe.lastIndexOf(" ") > 0 ? coupe.lastIndexOf(" ") : max).replace(/[,;:\s]+$/, "")}…`;
}

/**
 * LA LÉGENDE DE SA PUBLICATION. Ses mots d'abord — ceux qu'il a écrits au
 * comptoir, puis ceux qu'il a dits à son micro, sans rien y ajouter qu'il
 * n'ait dit —, puis la porte, puis où le trouver : son nom, sa ville. Les
 * mots-dièse ne nomment que des faits (sa ville, son métier) : on n'invente
 * pas « #promo » à sa place.
 *
 * UNE LÉGENDE PAR RÉSEAU (`reseau`) : « lien en bio » sur Instagram, le lien
 * cliquable sur Facebook, et sur Google ses mots seuls — le post y est déjà
 * sous son nom et son adresse, et la porte est dans le bouton.
 */
export function legendeReseaux(p: {
  texte: string;
  /** Ce qu'il a dit à son micro, transcrit (voir `motsPourLesReseaux`). */
  mots?: string;
  nom: string;
  ville?: string;
  metier?: string;
  /** La fin du post : « ✨ Essaie-la sur toi » (voir `porteDuPost`). */
  porte?: string;
  lien?: string;
  reseau?: string;
}): string {
  const mots = p.mots ? motsPourLesReseaux(p.mots) : "";
  if (p.reseau === "googlebusiness") return [p.texte.trim(), mots ? `« ${mots} »` : ""].filter(Boolean).join("\n\n").slice(0, 1500);
  const lignes = [p.texte.trim()];
  if (mots) lignes.push("", `« ${mots} »`);
  // INSTAGRAM NE CLIQUE PAS UN LIEN ÉCRIT : la porte renvoie à sa bio.
  const lien = p.reseau === "instagram" ? (p.porte ? "lien en bio" : "") : p.lien ?? "";
  if (p.porte) lignes.push("", lien ? `${p.porte} 👉 ${lien}` : p.porte);
  // « vevey » TEL QU'IL EST EN BASE devient « Vevey » : c'est un nom de ville.
  // « saint-paul-lès-dax » → « Saint-Paul-lès-Dax » : les petits mots restent petits.
  const ville =
    s(p.ville) === s(p.ville).toLowerCase()
      ? s(p.ville).replace(/(^|[\s-])(\p{L}+)/gu, (_, sep: string, mot: string) =>
          sep && /^(lès|les|lez|de|du|des|sur|sous|en|aux|la|le)$/.test(mot) ? sep + mot : sep + mot.charAt(0).toUpperCase() + mot.slice(1),
        )
      : s(p.ville);
  const ou = [p.nom.trim(), ville].filter(Boolean).join(" · ");
  if (ou) lignes.push("", `📍 ${ou}`);
  if (!p.porte && lien) lignes.push(`👉 ${lien}`);
  const tags = [s(p.ville), s(p.metier)]
    .map(enHashtag)
    .filter((t) => t.length >= 2 && t.length <= 40)
    .map((t) => `#${t}`);
  if (tags.length) lignes.push("", [...new Set(tags)].join(" "));
  return lignes.join("\n").slice(0, 2000);
}
