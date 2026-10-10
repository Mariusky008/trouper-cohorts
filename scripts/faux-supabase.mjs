/**
 * 🧪 UN FAUX SUPABASE, EN MÉMOIRE — pour essayer les salons sans base réelle.
 *
 * Il répond comme PostgREST (`/rest/v1/<table>`) et comme le stockage
 * (`/storage/v1/object/…`) à ce dont l'application se sert : filtres eq, neq,
 * in, is, gte, lt, lte, gt ; order ; limit ; select de colonnes ; count ;
 * insert / update / delete ; envoi d'un fichier ; adresse signée ; adresse
 * publique — REFUSÉE pour un seau privé, comme le vrai.
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
};
const CLES = {
  human_conversations: ["id"],
  human_conversation_invitations: ["id"],
  human_conversation_membres: ["conversation", "habitant"],
  human_conversation_demandes: ["conversation", "habitant"],
  human_habitant_blocages: ["habitant", "bloque"],
  human_habitants: ["id"],
  human_maisons_privees: ["habitant"],
};

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
    if (lim) rs = rs.slice(0, lim);
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
    const neuves = (Array.isArray(donnees) ? donnees : [donnees]).map((d) => ({ ...(DEFAUTS[table]?.() ?? {}), ...d }));
    const cles = CLES[table];
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

async function stockage(req, res, url) {
  const p = decodeURIComponent(url.pathname.replace(/^\/storage\/v1\/object\//, ""));
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
      if (url.pathname === "/__etat") return repondre(res, 200, Object.fromEntries([...tables].map(([t, r]) => [t, r.length])));
      if (url.pathname === "/__tables") return repondre(res, 200, Object.fromEntries(tables));
      const m = /^\/rest\/v1\/([a-z_]+)$/.exec(url.pathname);
      if (m) return await rest(req, res, url, m[1]);
      if (url.pathname.startsWith("/rest/v1/rpc/")) return repondre(res, 404, []);
      if (url.pathname.startsWith("/storage/v1/object/")) return await stockage(req, res, url);
      if (url.pathname.startsWith("/auth/v1/")) return repondre(res, 401, { message: "pas de session" });
      return repondre(res, 404, { message: "inconnu" });
    } catch (e) {
      repondre(res, 500, { message: String(e) });
    }
  })
  .listen(PORT, "127.0.0.1", () => console.log(`faux Supabase sur http://127.0.0.1:${PORT}`));
