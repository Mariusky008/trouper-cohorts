// 🎨 LES AMBIANCES DANS LA CRÉATION DE L'UNIVERS, PAR LES ROUTES — contre le faux Supabase et ses faux modèles, jamais
// la vraie base, jamais OpenAI (`lib/direct/ambiances.ts`, `conversation-univers-serveur.ts`, `univers-creation-serveur.ts`).
//
// Tom parle à Pablito de ses soirées Minecraft : avec la proposition, Pablito propose 🎮 néon et gaming, et dit pourquoi.
// Tom en choisit une autre (🌸 pastel) ; une ambiance inconnue est refusée ; une correction garde SON choix. « C'est mon
// univers ! » : sa fiche garde l'ambiance (plus de choix ensuite). Créer : son décor est peint dans son ambiance (le
// monde réinterprété), l'écran la connaît. Changer d'ambiance (🗽 New York) : une nouvelle version, le décor refait
// d'après sa fiche, une retouche de moins ; la même ambiance : refusée. Zoé ne dit rien de tel et a l'air d'une
// adulte : cosy — son décor, celui d'aujourd'hui, sans réinterprétation.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-ambiances-univers-route.mjs
const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const deposer = (chemin, corps, type) => fetch(`${STOCK}/figurines-clients/${chemin}`, { method: "POST", headers: { "content-type": type }, body: corps });
const json = (chemin, x) => deposer(chemin, JSON.stringify(x), "application/json");
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json() : null;
};
const toutIA = async () => (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string");

let echecs = 0;
const ok = (c, m) => {
  if (!c) echecs++;
  console.log(c ? "  ok  " : "ÉCHEC ", m);
};

const ADMIN = "00000000-0000-4000-8000-0000000ad001";
const b64 = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
const session = {
  access_token: "faux-admin",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "faux",
  user: { id: ADMIN, aud: "authenticated", role: "authenticated", email: "admin@example.invalid", app_metadata: {}, user_metadata: {} },
};
const COOKIE_ADMIN = `sb-127-auth-token=base64-${b64(session)}`;
await semer("admins", [{ user_id: ADMIN }]);
const TOM = { id: "a5a5a5a5-0000-4000-8000-000000000a01", jeton: "jeton-tom-ambiances-00000001" };
const ZOE = { id: "a5a5a5a5-0000-4000-8000-000000000a02", jeton: "jeton-zoe-ambiances-00000001" };
await semer("human_habitants", [TOM, ZOE].map((x) => ({ id: x.id, device_token: x.jeton, prenom: "Essai", ville_slug: "dax" })));

// ─── leurs figurines du nouveau style (l'âge que montrent leurs traits) ───
const maintenant = new Date().toISOString();
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
for (const [x, age] of [
  [TOM, "a teenager, about 16"],
  [ZOE, "in her fifties"],
]) {
  const P1 = `${x.id}/perso/v1`;
  for (const n of ["assise", "assise_parle", "debout"]) await deposer(`${P1}/${n}.png`, PNG, "image/png");
  const perso = {
    version: 1,
    style: "collection-1",
    creee_le: maintenant,
    validee_le: maintenant,
    traits: { age },
    references: { assise: { chemin: `${P1}/assise.png` }, assise_parle: { chemin: `${P1}/assise_parle.png` }, debout: { chemin: `${P1}/debout.png` } },
    historique: [{ version: 1, le: maintenant, raison: "« C’est moi ! »", style: "collection-1" }],
  };
  await json(`${P1}/fiche.json`, perso);
  await json(`${x.id}/perso/fiche.json`, perso);
}

const cookieDe = (qui) => `${COOKIE_ADMIN}; clikme_habitant=${qui.jeton}`;
const route = (r) => async (qui, corps) => {
  const res = await fetch(`${BASE}${r}`, corps ? { method: "POST", headers: { "content-type": "application/json", cookie: cookieDe(qui) }, body: JSON.stringify(corps) } : { headers: { cookie: cookieDe(qui) } });
  return { statut: res.status, ...(await res.json().catch(() => ({}))) };
};
const conv = route("/api/direct/conversation-univers");
const univers = route("/api/direct/univers");
const attendre = async (appel, qui, condition, ms = 40000) => {
  const fin = Date.now() + ms;
  let e = await appel(qui);
  while (!condition(e) && Date.now() < fin) {
    await new Promise((ok) => setTimeout(ok, 400));
    e = await appel(qui);
  }
  return e;
};
/** Jusqu'à la proposition : quatre réponses, puis « Voir ce que j'imagine ». */
async function jusquALaProposition(qui, premier) {
  await conv(qui, { action: "commencer" });
  for (const t of [premier, "Le week-end je vois mes potes", "J'aime bien les couleurs vives", "Je dors tard le dimanche"]) {
    await conv(qui, { action: "message", texte: t });
    await attendre(conv, qui, (x) => !x.attend);
  }
  await conv(qui, { action: "proposer" });
  return attendre(conv, qui, (x) => x.etape === "proposition" && !x.attend);
}

// ═══ 🎮 TOM : PABLITO PROPOSE ═══
const p1 = await jusquALaProposition(TOM, "Je joue à Minecraft tous les soirs avec mes potes");
const prop = p1.proposition ?? {};
ok(prop.ambiance === "neon" && prop.ambiance_proposee === "neon" && !prop.ambiance_choisie && /pièce pleine de néons 🎮$/.test(prop.ambiance_pourquoi ?? "") && (prop.ambiance_pourquoi ?? "").startsWith("Tu m’as parlé"), `avec la proposition, Pablito propose néon et gaming (ses soirées Minecraft) : « ${prop.ambiance_pourquoi} »`);
ok((await conv(TOM, { action: "ambiance", ambiance: "disco" })).statut === 400, "une ambiance inconnue : refusée");
ok((await conv(TOM, { action: "ambiance", ambiance: "pastel" })).statut === 200, "il en choisit une autre : pastel");
const p2 = await conv(TOM);
ok(p2.proposition?.ambiance === "pastel" && p2.proposition.ambiance_proposee === "neon" && p2.proposition.ambiance_choisie === true, "son choix est gardé ; celle de Pablito reste dite");
await conv(TOM, { action: "corriger", texte: "un grand canapé" });
const p3 = await attendre(conv, TOM, (x) => x.etape === "proposition" && !x.attend && x.proposition?.texte?.includes("corrigé"));
ok(p3.proposition?.ambiance === "pastel" && p3.proposition.ambiance_proposee === "neon", "une correction garde SON choix");
const v = await conv(TOM, { action: "valider" });
const fiche = await lire(`${TOM.id}/monde/fiche.json`);
ok(v.statut === 200 && v.version === 1 && fiche?.decor_ambiance === "pastel", `« C'est mon univers ! » : sa fiche garde l'ambiance (${fiche?.decor_ambiance})`);
ok((await conv(TOM, { action: "ambiance", ambiance: "neon" })).statut === 409, "après : plus de choix dans la conversation");

// ═══ 🌸 TOM : SON DÉCOR, DANS SON AMBIANCE ═══
const avant = (await toutIA()).length;
const c1 = await univers(TOM, { action: "creer" });
const e1 = await attendre(univers, TOM, (e) => e.etape === "decouverte" && e.vedette);
let ia = (await toutIA()).slice(avant);
const decor = ia.find((c) => c.startsWith("DESSIN ") && c.includes("Create the DECOR")) ?? "";
ok(c1.statut === 200 && e1.etape === "decouverte" && decor.includes("PASTEL ROOM") && decor.includes("Reinterpret THE WORLD in this ambiance") && decor.includes("pastel colours") && decor.includes("un établi couvert d'outils"), "créé : son décor peint en pastel, son monde réinterprété (ses éléments gardés)");
ok(e1.ambiance === "pastel" && e1.retouches?.restantes === 3, "l'écran connaît son ambiance");

// ═══ 🗽 CHANGER D'AMBIANCE ═══
ok((await univers(TOM, { action: "ambiance", ambiance: "pastel" })).statut === 409, "la même ambiance : refusée");
ok((await univers(TOM, { action: "ambiance", ambiance: "disco" })).statut === 400, "une ambiance inconnue : refusée");
const n2 = (await toutIA()).length;
const c2 = await univers(TOM, { action: "ambiance", ambiance: "new-york" });
const e2 = await attendre(univers, TOM, (e) => e.etape === "decouverte" && e.version === 2 && e.vedette);
ia = (await toutIA()).slice(n2);
const f2 = await lire(`${TOM.id}/monde/fiche.json`);
ok(c2.statut === 200 && c2.version === 2 && ia.some((c) => c.startsWith("DESSIN ") && c.includes("LOFT IN NEW YORK") && c.includes("street style")), "🗽 New York : une nouvelle version, le décor refait d'après sa fiche, dans le loft");
ok(e2.ambiance === "new-york" && f2?.decor_ambiance === "new-york" && f2.historique?.at(-1)?.raison === "ambiance : Urbaine, New York" && e2.retouches?.restantes === 2, "sa fiche et l'écran suivent ; une retouche de moins");

// ═══ 🛋️ ZOÉ : COSY ═══
const z1 = await jusquALaProposition(ZOE, "Je lis beaucoup au calme le soir");
ok(z1.proposition?.ambiance === "cosy" && (z1.proposition.ambiance_pourquoi ?? "").startsWith("J’ai imaginé pour toi un coin cosy"), `Zoé, rien de tel, l'air d'une adulte : cosy — « ${z1.proposition?.ambiance_pourquoi} »`);
await conv(ZOE, { action: "valider" });
const n3 = (await toutIA()).length;
await univers(ZOE, { action: "creer" });
const ez = await attendre(univers, ZOE, (e) => e.etape === "decouverte" && e.vedette);
const decorZ = (await toutIA()).slice(n3).find((c) => c.startsWith("DESSIN ") && c.includes("Create the DECOR")) ?? "";
ok(ez.ambiance === "cosy" && (await lire(`${ZOE.id}/monde/fiche.json`))?.decor_ambiance === "cosy" && decorZ.includes("a warm, lived-in, cosy place") && !decorZ.includes("THE AMBIANCE"), "son décor : celui d'aujourd'hui, sans réinterprétation");

console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est bon.");
process.exit(echecs ? 1 : 0);
