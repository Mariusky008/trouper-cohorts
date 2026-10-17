/**
 * 🧪 UN FAUX SUPABASE, EN MÉMOIRE — pour essayer les salons sans base réelle.
 *
 * Il répond comme PostgREST (`/rest/v1/<table>`) et comme le stockage
 * (`/storage/v1/object/…`) à ce dont l'application se sert : filtres eq, neq,
 * in, is, gte, lt, lte, gt ; order ; limit ; offset (pagination) ; select de colonnes ; count ;
 * insert / update / delete ; envoi d'un fichier ; adresse signée (lecture et
 * envoi) ; seaux (lire, créer) ; adresse publique — REFUSÉE pour un seau
 * privé, comme le vrai.
 *
 * CE N'EST PAS UNE BASE : pas de transactions, pas de jointures, des clés
 * primaires seulement là où les salons en ont besoin. Les essais faits avec
 * lui disent que les règles sont bien appliquées par la route ; ils ne
 * remplacent pas un essai sur la vraie base.
 *
 *   node scripts/faux-supabase.mjs [port]          (54321 par défaut)
 *
 * puis lancer l'application avec
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=faux NEXT_PUBLIC_SUPABASE_ANON_KEY=faux
 */
import http from "node:http";
import { randomBytes, randomUUID } from "node:crypto";

const PORT = Number(process.argv[2] || 54321);
const SEAUX_PRIVES = new Set(["salons-prives", "maison-privee"]);

const tables = new Map();
const fichiers = new Map(); // `${seau}/${chemin}` → { type, octets }
const signes = new Map(); // jeton → { cle, expire }
let suite = 1;
const maintenant = () => new Date().toISOString();
const hex = (n) => randomBytes(n).toString("hex");

const DEFAUTS = {
  human_habitants: () => ({
    id: randomUUID(),
    device_token: hex(16),
    email: null,
    prenom: "",
    ville_slug: "",
    quartier: "",
    rayon_m: 2000,
    categories: [],
    recoit_resume: true,
    recoit_alertes: true,
    recoit_suivis: true,
    recoit_ville_infos: false,
    silence_avant: 9,
    silence_apres: 20,
    confirmed_at: null,
    unsub_token: hex(8),
    telephone: null,
    look: null,
  }),
  human_conversations: () => ({ cree_le: maintenant(), activite: maintenant(), prive: true, supprime_le: null, createur: null }),
  human_conversation_gestes: () => ({ id: suite++, cree_le: maintenant(), masque_le: null }),
  human_conversation_membres: () => ({ role: "membre", qui: "", sourdine: false, entre_le: maintenant(), quitte_le: null, exclu_le: null }),
  human_conversation_invitations: () => ({ statut: "attente", cree_le: maintenant(), expire_le: null, pour: null, par_qui: "" }),
  human_conversation_demandes: () => ({ statut: "attente", cree_le: maintenant(), decide_le: null, invitation: null, qui: "" }),
  human_conversation_signalements: () => ({ id: suite++, cree_le: maintenant(), traite_le: null, geste: null }),
  human_habitant_blocages: () => ({ cree_le: maintenant() }),
  human_maisons_privees: () => ({ memoire: {}, maj_le: maintenant() }),
  human_maison_elements: () => ({ id: randomUUID(), sorte: "", donnees: {}, photo: null, cree_le: maintenant(), maj_le: maintenant() }),
  human_habitant_codes: () => ({ id: suite++, ville_slug: "", essais: 0, utilise_le: null, cree_le: maintenant() }),
  // LA VILLE PARTAGÉE — voir `20261006120000_ville_partagee.sql`.
  human_ville_publications: () => ({ cree_le: maintenant(), retire_le: null, masque: false, verdict: null, persistant: false }),
  human_ville_gestes: () => ({ id: suite++, cree_le: maintenant() }),
  human_ville_signalements: () => ({ cree_le: maintenant(), motif: null }),
  // LE FIL DES COMMERÇANTS : la vraie table donne son `id` (uuid) et sa date.
  human_publications: () => ({ id: randomUUID(), publie_le: maintenant(), retire_le: null }),
  // L'ÉCHANGE ENTRE COMMERÇANTS — `…_echanges_commercants.sql` et `…_echanges_reseau.sql`.
  human_echanges_offres: () => ({ du_jour: false, photo: null, metier: "", branche: "", ville: "", ville_slug: "", actif: true, equipe: 1, cadeau_titre: null, cadeau_prix: null, cadeau_par_mois: null, regles_acceptees_le: maintenant(), cree_le: maintenant(), maj_le: maintenant() }),
  human_echanges_cadeaux: () => ({ id: randomUUID(), photo: null, occasion: "", cree_le: maintenant() }),
  human_echanges_bons: () => nouveauBon({}),
  human_echanges_membres: () => ({ id: randomUUID(), cree_le: maintenant(), active_le: null, retire_le: null }),
};
const CLES = {
  human_conversations: ["id"],
  human_conversation_invitations: ["id"],
  human_conversation_membres: ["conversation", "habitant"],
  human_conversation_demandes: ["conversation", "habitant"],
  human_habitant_blocages: ["habitant", "bloque"],
  human_habitants: ["id"],
  human_maisons_privees: ["habitant"],
  human_ville_publications: ["id"],
  human_echanges_offres: ["site_id"],
  human_echanges_bons: ["id"],
  human_echanges_cadeaux: ["id"],
  human_echanges_membres: ["id"],
};

/** Un bon d'échange neuf, comme la table le remplit (30 jours de validité). */
function nouveauBon(champs) {
  return {
    id: randomUUID(),
    statut: "reserve",
    annule_par: null,
    cree_le: maintenant(),
    utilise_le: null,
    annule_le: null,
    pour: "moi",
    cadeau_id: null,
    donne_le: null,
    venus: null,
    du_jour: false,
    photo: null,
    expire_le: new Date(Date.now() + 30 * 86400000).toISOString(),
    membre_id: null,
    valide_par: null,
    ...champs,
  };
}

const lignes = (t) => {
  if (!tables.has(t)) tables.set(t, []);
  return tables.get(t);
};

function valeur(brut) {
  const v = decodeURIComponent(brut);
  return v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v;
}
function filtre(param, brut) {
  const i = brut.indexOf(".");
  const op = brut.slice(0, i);
  const reste = brut.slice(i + 1);
  return (r) => {
    const x = r[param];
    switch (op) {
      case "eq":
        return x !== null && x !== undefined && String(x) === valeur(reste);
      case "neq":
        return String(x) !== valeur(reste);
      case "is":
        return reste === "null" ? x === null || x === undefined : reste === "true" ? x === true : x === false;
      case "in": {
        const liste = reste.replace(/^\(|\)$/g, "").split(",").map(valeur);
        return x !== null && x !== undefined && liste.includes(String(x));
      }
      case "gte":
        return x !== null && x !== undefined && String(x) >= valeur(reste);
      case "gt":
        return x !== null && x !== undefined && String(x) > valeur(reste);
      case "lte":
        return x !== null && x !== undefined && String(x) <= valeur(reste);
      case "lt":
        return x !== null && x !== undefined && String(x) < valeur(reste);
      default:
        return true;
    }
  };
}
function filtres(url) {
  const f = [];
  for (const [k, v] of url.searchParams) if (!["select", "order", "limit", "offset", "on_conflict", "columns"].includes(k)) f.push(filtre(k, v));
  return (r) => f.every((g) => g(r));
}
function projeter(r, select) {
  if (!select || select.trim() === "*") return { ...r };
  const out = {};
  for (const c of select.split(",").map((x) => x.trim()).filter(Boolean)) out[c] = r[c] ?? null;
  return out;
}
function trier(rs, order) {
  if (!order) return rs;
  const [col, sens] = order.split(".");
  return [...rs].sort((a, b) => {
    const x = a[col];
    const y = b[col];
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""));
    return sens === "desc" ? -c : c;
  });
}
const corps = (req) =>
  new Promise((ok) => {
    const morceaux = [];
    req.on("data", (m) => morceaux.push(m));
    req.on("end", () => ok(Buffer.concat(morceaux)));
  });
/** L'administrateur des tests : voir la session « faux-admin » plus bas. */
const ADMIN_TEST = "00000000-0000-4000-8000-0000000ad001";

function repondre(res, statut, donnees, entetes = {}) {
  res.writeHead(statut, { "content-type": "application/json", ...entetes });
  res.end(donnees === undefined ? "" : JSON.stringify(donnees));
}

async function rest(req, res, url, table) {
  const objet = (req.headers.accept || "").includes("vnd.pgrst.object");
  const prefer = req.headers.prefer || "";
  const select = url.searchParams.get("select");
  const garder = filtres(url);
  if (req.method === "GET" || req.method === "HEAD") {
    let rs = trier(lignes(table).filter(garder), url.searchParams.get("order"));
    const total = rs.length;
    const lim = Number(url.searchParams.get("limit"));
    const off = Number(url.searchParams.get("offset")) || 0;
    if (lim || off) rs = rs.slice(off, lim ? off + lim : undefined);
    const entetes = /count=/.test(prefer) ? { "content-range": `0-${Math.max(0, rs.length - 1)}/${total}` } : {};
    if (req.method === "HEAD") return repondre(res, 200, undefined, entetes);
    const sortie = rs.map((r) => projeter(r, select));
    if (objet) return sortie.length === 1 ? repondre(res, 200, sortie[0], entetes) : repondre(res, 406, { message: "JSON object requested, multiple (or no) rows returned" });
    return repondre(res, 200, sortie, entetes);
  }
  const brut = (await corps(req)).toString();
  const donnees = brut ? JSON.parse(brut) : null;
  const representation = /return=representation/.test(prefer);
  if (req.method === "POST") {
    const recues = Array.isArray(donnees) ? donnees : [donnees];
    const cles = url.searchParams.get("on_conflict")?.split(",") ?? CLES[table];
    // UPSERT (`resolution=merge-duplicates`) : la ligne qui existe déjà prend les champs envoyés.
    if (/resolution=merge-duplicates/.test(prefer) && cles) {
      const sortie = [];
      for (const d of recues) {
        const deja = lignes(table).find((r) => cles.every((k) => String(r[k]) === String(d[k])));
        if (deja) Object.assign(deja, d);
        else lignes(table).push({ ...(DEFAUTS[table]?.() ?? {}), ...d });
        sortie.push(deja ?? lignes(table)[lignes(table).length - 1]);
      }
      if (!representation) return repondre(res, 201, undefined);
      return repondre(res, 201, sortie.map((r) => projeter(r, select)));
    }
    const neuves = recues.map((d) => ({ ...(DEFAUTS[table]?.() ?? {}), ...d }));
    for (const n of neuves)
      if (cles && lignes(table).some((r) => cles.every((k) => String(r[k]) === String(n[k]))))
        return repondre(res, 409, { code: "23505", message: "duplicate key value violates unique constraint" });
    lignes(table).push(...neuves);
    if (!representation) return repondre(res, 201, undefined);
    const sortie = neuves.map((r) => projeter(r, select));
    return repondre(res, 201, objet ? sortie[0] : sortie);
  }
  if (req.method === "PATCH") {
    const touchees = lignes(table).filter(garder);
    for (const r of touchees) Object.assign(r, donnees);
    if (!representation) return repondre(res, 204, undefined);
    return repondre(res, 200, touchees.map((r) => projeter(r, select)));
  }
  if (req.method === "DELETE") {
    tables.set(
      table,
      lignes(table).filter((r) => !garder(r)),
    );
    return repondre(res, 204, undefined);
  }
  return repondre(res, 405, { message: "méthode" });
}

/* ═══ L'ÉCHANGE ENTRE COMMERÇANTS — la copie des fonctions SQL ══════════════
   `ECHANGES_ABSENT=1` : comme une base où la seconde migration n'est pas appliquée. */
function echanges(nom, a) {
  if (process.env.ECHANGES_ABSENT === "1") return undefined;
  const bons = lignes("human_echanges_bons");
  const offre = (id) => lignes("human_echanges_offres").find((o) => o.site_id === id);
  const expirer = () => {
    let n = 0;
    for (const b of bons) if (b.statut === "reserve" && b.expire_le < maintenant()) (b.statut = "expire"), n++;
    return n;
  };
  const debut = (() => {
    const j = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(new Date());
    return new Date(`${j}-01T00:00:00+01:00`).toISOString();
  })();
  // L'ÉQUIPE QUI COMPTE (`echanges_equipe`) : le responsable, et ceux qui ont ouvert leur lien sans être retirés.
  const equipe = (site) => Math.min(5, 1 + lignes("human_echanges_membres").filter((m) => m.site_id === site && m.active_le && !m.retire_le).length);
  const peut = (site, parPersonne) => {
    const gagne = bons.filter((b) => b.fournisseur_id === site && b.statut === "utilise").reduce((s, b) => s + b.prix, 0);
    const pris = bons.filter((b) => b.preneur_id === site && ["reserve", "utilise"].includes(b.statut)).reduce((s, b) => s + b.prix, 0);
    return equipe(site) * Math.max(0, parPersonne) + gagne - pris;
  };
  const ceMois = (site, pour) => bons.filter((b) => b.fournisseur_id === site && b.pour === pour && ["reserve", "utilise"].includes(b.statut) && b.cree_le >= debut).length;
  if (nom === "echanges_expirer") return expirer();
  if (nom === "echanges_prendre") {
    if (a.p_preneur === a.p_fournisseur) return { ok: false, raison: "soi" };
    expirer();
    const m = a.p_membre ? lignes("human_echanges_membres").find((x) => x.id === a.p_membre) : null;
    if (a.p_membre && (!m || m.site_id !== a.p_preneur || m.retire_le)) return { ok: false, raison: "membre" };
    const op = offre(a.p_preneur);
    if (!op || !op.actif) return { ok: false, raison: "sans_offre" };
    const of = offre(a.p_fournisseur);
    if (!of || !of.actif) return { ok: false, raison: "offre_retiree" };
    if (m) {
      const lui = bons.filter((b) => b.membre_id === m.id && ["reserve", "utilise"].includes(b.statut) && b.cree_le >= debut).reduce((t, b) => t + b.prix, 0);
      if (lui + of.prix > a.p_par_personne) return { ok: false, raison: "plafond_perso", reste: Math.max(a.p_par_personne - lui, 0) };
    }
    const v = peut(a.p_preneur, a.p_par_personne);
    if (v < of.prix) return { ok: false, raison: "solde", manque: of.prix - Math.max(v, 0) };
    if (ceMois(a.p_fournisseur, "moi") >= of.par_mois) return { ok: false, raison: "complet" };
    if (bons.some((b) => b.code === a.p_code)) return { doublon: true };
    const bon = nouveauBon({ code: a.p_code, preneur_id: a.p_preneur, fournisseur_id: a.p_fournisseur, titre: of.titre, prix: of.prix, photo: of.photo, du_jour: of.du_jour, membre_id: m?.id ?? null });
    bons.push(bon);
    return { ok: true, bon };
  }
  if (nom === "echanges_offrir") {
    if (a.p_donneur === a.p_fournisseur) return { ok: false, raison: "soi" };
    const q = Number(a.p_quantite);
    if (!(q >= 1 && q <= 60) || (a.p_codes ?? []).length < q) return { ok: false, raison: "quantite" };
    expirer();
    const od = offre(a.p_donneur);
    if (!od || !od.actif) return { ok: false, raison: "sans_offre" };
    const of = offre(a.p_fournisseur);
    if (!of || !of.actif || !of.cadeau_titre) return { ok: false, raison: "offre_retiree" };
    const total = q * of.cadeau_prix;
    const v = peut(a.p_donneur, a.p_par_personne);
    if (v < total) return { ok: false, raison: "solde", manque: total - Math.max(v, 0) };
    const deja = ceMois(a.p_fournisseur, "client");
    if (deja + q > of.cadeau_par_mois) return { ok: false, raison: "complet", restant: Math.max(of.cadeau_par_mois - deja, 0) };
    if (a.p_codes.slice(0, q).some((c) => bons.some((b) => b.code === c))) return { doublon: true };
    const c = { id: randomUUID(), donneur_id: a.p_donneur, fournisseur_id: a.p_fournisseur, titre: of.cadeau_titre, prix: of.cadeau_prix, photo: of.photo, occasion: String(a.p_occasion ?? "").slice(0, 80), quantite: q, cree_le: maintenant() };
    lignes("human_echanges_cadeaux").push(c);
    for (const code of a.p_codes.slice(0, q))
      bons.push(nouveauBon({ code, preneur_id: a.p_donneur, fournisseur_id: a.p_fournisseur, titre: c.titre, prix: c.prix, photo: c.photo, pour: "client", cadeau_id: c.id }));
    return { ok: true, cadeau: c };
  }
  return undefined;
}

/** Le fichier d'un envoi `multipart/form-data` (celui de `uploadToSignedUrl` avec un Blob). */
function partieFichier(octets, type) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(type || "");
  if (!m) return null;
  const borne = Buffer.from(`--${m[1] || m[2]}`);
  let i = octets.indexOf(borne);
  while (i >= 0) {
    const debut = i + borne.length + 2;
    const suivante = octets.indexOf(borne, debut);
    if (suivante < 0) break;
    const tete = octets.indexOf(Buffer.from("\r\n\r\n"), debut);
    const entetes = octets.subarray(debut, tete).toString();
    if (/filename=/i.test(entetes)) {
      const t = /content-type:\s*([^\r\n]+)/i.exec(entetes);
      return { type: t ? t[1].trim() : "application/octet-stream", octets: octets.subarray(tete + 4, suivante - 2) };
    }
    i = suivante;
  }
  return null;
}

/** Les seaux, comme `/storage/v1/bucket` : ceux qu'on crée, et les privés connus. */
const seaux = new Map([...SEAUX_PRIVES].map((id) => [id, { id, name: id, public: false }]));

async function seau(req, res, url) {
  const id = decodeURIComponent(url.pathname.replace(/^\/storage\/v1\/bucket\/?/, ""));
  if (req.method === "GET" && id) {
    return seaux.has(id) ? repondre(res, 200, seaux.get(id)) : repondre(res, 400, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
  }
  if (req.method === "POST" && !id) {
    const b = JSON.parse((await corps(req)).toString() || "{}");
    if (seaux.has(b.id)) return repondre(res, 400, { statusCode: "409", error: "Duplicate", message: "The resource already exists" });
    seaux.set(b.id, { id: b.id, name: b.name || b.id, public: Boolean(b.public), file_size_limit: b.file_size_limit ?? null, allowed_mime_types: b.allowed_mime_types ?? null });
    return repondre(res, 200, { name: b.id });
  }
  return repondre(res, 405, { message: "méthode" });
}

async function stockage(req, res, url) {
  const p = decodeURIComponent(url.pathname.replace(/^\/storage\/v1\/object\//, ""));
  // L'ADRESSE SIGNÉE D'ENVOI (`createSignedUploadUrl`), puis l'envoi lui-même (`uploadToSignedUrl`).
  if (p.startsWith("upload/sign/")) {
    const cle = p.slice(12);
    if (req.method === "POST") {
      const jeton = hex(12);
      signes.set(jeton, { cle, expire: Date.now() + 7200 * 1000, envoi: true });
      return repondre(res, 200, { url: `/object/upload/sign/${cle}?token=${jeton}` });
    }
    if (req.method === "PUT") {
      const s = signes.get(url.searchParams.get("token") || "");
      if (!s || !s.envoi || s.cle !== cle || s.expire < Date.now()) return repondre(res, 400, { error: "InvalidJWT", message: "Signature invalide ou expirée" });
      const brut = await corps(req);
      const f = partieFichier(brut, req.headers["content-type"]) ?? { type: req.headers["content-type"] || "application/octet-stream", octets: brut };
      const regle = seaux.get(cle.split("/")[0]);
      if (regle?.allowed_mime_types?.length && !regle.allowed_mime_types.includes(f.type)) {
        return repondre(res, 400, { statusCode: "415", error: "invalid_mime_type", message: `mime type ${f.type} is not supported` });
      }
      fichiers.set(cle, f);
      signes.delete(url.searchParams.get("token") || "");
      return repondre(res, 200, { Key: cle });
    }
  }
  if (p.startsWith("sign/")) {
    const cle = p.slice(5);
    if (req.method === "POST") {
      if (!fichiers.has(cle)) return repondre(res, 400, { statusCode: "404", error: "not_found", message: "Object not found" });
      const { expiresIn = 60 } = JSON.parse((await corps(req)).toString() || "{}");
      const jeton = hex(12);
      signes.set(jeton, { cle, expire: Date.now() + expiresIn * 1000 });
      return repondre(res, 200, { signedURL: `/object/sign/${cle}?token=${jeton}` });
    }
    const s = signes.get(url.searchParams.get("token") || "");
    if (!s || s.cle !== cle || s.expire < Date.now()) return repondre(res, 400, { error: "InvalidJWT", message: "Signature invalide ou expirée" });
    const f = fichiers.get(cle);
    res.writeHead(200, { "content-type": f.type });
    return res.end(f.octets);
  }
  if (p.startsWith("public/")) {
    const cle = p.slice(7);
    const seau = cle.split("/")[0];
    // UN SEAU PRIVÉ N'A PAS D'ADRESSE PUBLIQUE.
    if (SEAUX_PRIVES.has(seau) || !fichiers.has(cle)) return repondre(res, 400, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
    const f = fichiers.get(cle);
    res.writeHead(200, { "content-type": f.type });
    return res.end(f.octets);
  }
  // LE SERVEUR LIT UN FICHIER PRIVÉ (`download`, clé de service) : jamais le navigateur.
  if (req.method === "GET" && fichiers.has(p)) {
    const f = fichiers.get(p);
    res.writeHead(200, { "content-type": f.type });
    return res.end(f.octets);
  }
  if (req.method === "DELETE") {
    const { prefixes = [] } = JSON.parse((await corps(req)).toString() || "{}");
    for (const c of prefixes) fichiers.delete(`${p}/${c}`);
    return repondre(res, 200, prefixes.map((name) => ({ name })));
  }
  if (req.method === "POST" || req.method === "PUT") {
    fichiers.set(p, { type: req.headers["content-type"] || "application/octet-stream", octets: await corps(req) });
    return repondre(res, 200, { Key: p, Id: randomUUID() });
  }
  return repondre(res, 404, { message: "inconnu" });
}

http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
      // LE NAVIGATEUR Y ÉCRIT DIRECTEMENT (adresse signée d'envoi) : le vrai répond au CORS, lui aussi.
      res.setHeader("access-control-allow-origin", "*");
      res.setHeader("access-control-allow-headers", "*");
      res.setHeader("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }
      if (url.pathname === "/__etat") return repondre(res, 200, Object.fromEntries([...tables].map(([t, r]) => [t, r.length])));
      if (url.pathname === "/__tables") return repondre(res, 200, Object.fromEntries(tables));
      const m = /^\/rest\/v1\/([a-z_]+)$/.exec(url.pathname);
      if (m) return await rest(req, res, url, m[1]);
      // LE COMPTEUR DU JOUR, comme la fonction SQL `compter_jour` (migrations
      // `…_compteurs_du_comptoir.sql` et `…_compteurs_en_clients.sql`).
      if (url.pathname === "/rest/v1/rpc/compter_jour" && req.method === "POST") {
        const { sid, quoi } = JSON.parse((await corps(req)).toString() || "{}");
        const COLS = ["vues", "ecoutes", "demandes", "partages", "essais", "cotes", "confirmees", "avis", "amis", "voisins"];
        if (!COLS.includes(quoi)) return repondre(res, 204, undefined);
        const jour = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
        const t = lignes("human_compteurs_jour");
        let l = t.find((r) => r.site_id === sid && r.jour === jour);
        if (!l) {
          l = { site_id: sid, jour, ...Object.fromEntries(COLS.map((c) => [c, 0])) };
          t.push(l);
        }
        l[quoi] = (l[quoi] || 0) + 1;
        return repondre(res, 204, undefined);
      }
      // L'ÉCHANGE ENTRE COMMERÇANTS : les mêmes règles que les fonctions SQL
      // (`echanges_expirer`, `echanges_prendre`, `echanges_offrir`), sans les verrous.
      const rpc = /^\/rest\/v1\/rpc\/(echanges_[a-z]+)$/.exec(url.pathname);
      if (rpc && req.method === "POST") {
        const a = JSON.parse((await corps(req)).toString() || "{}");
        const r = echanges(rpc[1], a);
        if (r && r.doublon) return repondre(res, 409, { code: "23505", message: "duplicate key value violates unique constraint" });
        if (r === undefined) return repondre(res, 404, { code: "42883", message: `function ${rpc[1]} does not exist` });
        return repondre(res, 200, r);
      }
      if (url.pathname.startsWith("/rest/v1/rpc/")) return repondre(res, 404, []);
      if (url.pathname.startsWith("/storage/v1/object/")) return await stockage(req, res, url);
      if (url.pathname.startsWith("/storage/v1/bucket")) return await seau(req, res, url);
      // UNE SESSION D'ADMINISTRATION, POUR LES TESTS SEULEMENT : le jeton
      // « faux-admin » ouvre l'utilisateur ADMIN_TEST (à mettre dans `admins`).
      if (url.pathname === "/auth/v1/user" && (req.headers.authorization || "") === "Bearer faux-admin") {
        return repondre(res, 200, { id: ADMIN_TEST, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" });
      }
      if (url.pathname.startsWith("/auth/v1/")) return repondre(res, 401, { message: "pas de session" });
      return repondre(res, 404, { message: "inconnu" });
    } catch (e) {
      repondre(res, 500, { message: String(e) });
    }
  })
  .listen(PORT, "127.0.0.1", () => console.log(`faux Supabase sur http://127.0.0.1:${PORT}`));
