// 💬 LA CONVERSATION AVEC PABLITO (« Univers », lot 3), PAR LES ROUTES — contre le faux Supabase et son faux modèle,
// jamais la vraie base, jamais OpenAI (`lib/direct/conversation-univers-serveur.ts`, `app/api/direct/conversation-univers`).
//
// Réservée au propriétaire. Léa commence : Pablito pose sa première question. Elle répond : Pablito rebondit (après la
// réponse), l'esquisse prend ses couleurs et ses vignettes ; ce qu'elle a « dit » porte SA phrase, retrouvée mot pour
// mot — une phrase qu'elle n'a jamais écrite redevient une interprétation. « Je préfère ne pas en parler » ; un sujet
// sensible n'est pas gardé. Elle a dit assez de choses : « Voir ce que j'imagine » — la proposition, vérifiée de même ;
// elle retire un élément, corrige avec ses mots, puis « C'est mon univers ! » : la fiche de son univers (version 1,
// « mes proches » par défaut). Sam dit qu'il va mal (ses mots, ou le modèle) : la conversation s'arrête de jouer, le
// message d'aide et les numéros ; il reprend quand il veut. La dictée ; effacer ; les adresses tapées sous /admin.
//
//   node scripts/faux-supabase.mjs
//   (l'app sur :3821, avec les variables de la CI)
//   node scripts/essai-conversation-univers-route.mjs          (sur un faux Supabase tout neuf)
const F = "http://127.0.0.1:54321/rest/v1";
const FAUX = F.replace("/rest/v1", "");
const BASE = process.env.ESSAI_BASE || "http://localhost:3821";
const STOCK = F.replace("/rest/v1", "/storage/v1/object");
const semer = (t, l) => fetch(`${F}/${t}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(l) });
const lire = async (chemin) => {
  const r = await fetch(`${STOCK}/figurines-clients/${chemin}`);
  return r.status === 200 ? r.json() : null;
};

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
const LEA = { id: "abababab-0000-4000-8000-000000000601", jeton: "jeton-lea-conversation-000001" };
const SAM = { id: "abababab-0000-4000-8000-000000000602", jeton: "jeton-sam-conversation-000001" };
await semer("human_habitants", [LEA, SAM].map((x) => ({ id: x.id, device_token: x.jeton, prenom: "Essai", ville_slug: "dax" })));

const ROUTE = `${BASE}/api/direct/conversation-univers`;
const cookieDe = (qui) => `${COOKIE_ADMIN}${qui ? `; clikme_habitant=${qui.jeton}` : ""}`;
const appeler = async (qui, corps, cookie = cookieDe(qui)) => {
  const r = await fetch(ROUTE, corps ? { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(corps) } : { headers: { cookie } });
  return { statut: r.status, ...(await r.json().catch(() => ({}))) };
};
const attendre = async (qui, condition, ms = 30000) => {
  const fin = Date.now() + ms;
  let e = await appeler(qui);
  while (!condition(e) && Date.now() < fin) {
    await new Promise((ok) => setTimeout(ok, 400));
    e = await appeler(qui);
  }
  return e;
};
const parler = async (qui, texte) => {
  const r = await appeler(qui, { action: "message", texte });
  const e = await attendre(qui, (x) => !x.attend);
  return { r, e };
};
const conversation = (qui) => lire(`${qui.id}/monde/conversation.json`);

// ═══ RÉSERVÉE AU PROPRIÉTAIRE ═══
ok((await appeler(LEA, null, `clikme_habitant=${LEA.jeton}`)).statut === 403 && (await appeler(LEA, { action: "commencer" }, `clikme_habitant=${LEA.jeton}`)).statut === 403, "réservée au propriétaire");
ok((await appeler(null)).etape === "transition" && (await appeler(null, { action: "commencer" })).statut === 400, "sans figurine sur ce téléphone : la transition, et rien ne commence");

// ═══ LA CONVERSATION ═══
ok((await appeler(LEA)).etape === "transition", "Léa : la transition d'abord");
await appeler(LEA, { action: "commencer" });
const e0 = await appeler(LEA);
ok(e0.etape === "conversation" && e0.messages.length === 1 && e0.messages[0].de === "pablito" && e0.messages[0].texte.startsWith("Pour commencer"), "« C'est parti » : la première question de Pablito");
ok((await appeler(LEA, { action: "message", texte: "   " })).statut === 400 && (await appeler(LEA, { action: "message", texte: "x".repeat(501) })).statut === 400, "un message vide, ou trop long : refusé");
const { e: e1 } = await parler(LEA, "J'adore bricoler dans mon atelier au bord de la mer");
ok(e1.messages.length === 3 && e1.messages[2].de === "pablito" && e1.messages[2].texte.includes("(1)"), "elle répond : Pablito rebondit (après la réponse)");
ok(e1.esquisse.couleurs.join() === "#2f5d73,#e8b06a,#f3ead9" && e1.esquisse.vignettes.includes("la mer"), "l'esquisse : ses couleurs, ses vignettes");
const c1 = await conversation(LEA);
ok(c1?.comprehension?.dits?.some((d) => d.phrase === "J'adore bricoler dans mon") && !c1.comprehension.dits.some((d) => d.phrase.includes("volcans")), "ce qu'elle a « dit » porte SA phrase, retrouvée mot pour mot");
ok(c1?.comprehension?.interpretations?.some((i) => i.quoi === "un volcan"), "une phrase qu'elle n'a jamais écrite redevient une interprétation");
ok((await consignes()).at(-1).startsWith("PABLITO, LA CONVERSATION") && (await consignes()).at(-1).includes("Jamais deux fois la même question"), "la consigne de Pablito : une question à la fois, jamais deux fois la même");
await parler(LEA, "Je préfère ne pas en parler");
const { e: e3 } = await parler(LEA, "Ma religion compte beaucoup pour moi");
const c3 = await conversation(LEA);
ok(!JSON.stringify(c3).toLowerCase().includes("religion") && c3.messages.some((m) => m.texte === "(gardé pour toi)") && e3.messages.at(-1).de === "pablito", "un sujet sensible : son message n'est pas gardé (« gardé pour toi »)");
const { e: e4 } = await parler(LEA, "Le dimanche je cuisine pour mes amis");
ok(e4.assez === true, "elle a dit assez de choses : « Voir ce que j'imagine »");

// ═══ LA PROPOSITION ═══
ok((await appeler(LEA, { action: "valider" })).statut === 409, "rien à valider avant la proposition");
await appeler(LEA, { action: "proposer" });
const p1 = await attendre(LEA, (x) => x.etape === "proposition" && !x.attend);
const els = p1.proposition?.elements ?? [];
ok(p1.etape === "proposition" && p1.proposition.texte.startsWith("Je t'imagine"), "la proposition : « Je t'imagine dans… »");
ok(els.find((e) => e.quoi.includes("établi"))?.source === "dit" && els.find((e) => e.quoi.includes("volcan"))?.source === "interpretation", "ses mots, retrouvés : « dit » ; une phrase inventée : une interprétation");
const volcan = els.find((e) => e.quoi.includes("volcan"));
await appeler(LEA, { action: "retirer", id: volcan.id });
ok(!(await appeler(LEA)).proposition.elements.some((e) => e.id === volcan.id) && (await appeler(LEA, { action: "retirer", id: "e99" })).statut === 404, "elle retire un élément");
ok((await appeler(LEA, { action: "corriger", texte: "un verre de vin" })).statut === 400, "une correction d'alcool : refusée");
await appeler(LEA, { action: "corriger", texte: "plutôt la montagne que la mer" });
const p2 = await attendre(LEA, (x) => x.etape === "proposition" && !x.attend && x.proposition.texte.includes("corrigé"));
ok(p2.proposition.texte.includes("corrigé") && p2.proposition.elements.some((e) => e.quoi === "plutôt la montagne que la mer") && (await consignes()).at(-1).startsWith("PABLITO, LA CORRECTION"), "elle corrige avec ses mots : la proposition est refaite");
const v = await appeler(LEA, { action: "valider" });
ok(v.statut === 200 && v.version === 1 && (await appeler(LEA)).etape === "validee", "« C'est mon univers ! » : sa fiche, version 1");
const monde = await lire(`${LEA.id}/monde/fiche.json`);
ok(monde?.style === "film-chaleureux-1" && Boolean(monde.validee_le) && monde.visibilite === "proches" && monde.scene.places.length === 2 && monde.proposition.includes("corrigé"), "la fiche de son univers : le style, « mes proches », ses places");
ok(monde?.elements?.find((e) => e.quoi.includes("établi"))?.source === "dit" && !monde.elements.some((e) => e.source === "dit" && !e.pourquoi), "les éléments « dits » portent sa phrase");

// ═══ QUELQU'UN QUI VA MAL ═══
await appeler(SAM, { action: "commencer" });
await appeler(SAM, { action: "message", texte: "Franchement j'ai envie de mourir en ce moment" });
const a1 = await appeler(SAM);
ok(a1.etape === "aide" && a1.messages.at(-1).aide === true && a1.messages.at(-1).texte.startsWith("Merci de me l’avoir dit"), "ses mots disent qu'il va mal : la conversation s'arrête de jouer, le message d'aide");
ok((await appeler(SAM, { action: "message", texte: "et maintenant ?" })).statut === 409 && (await appeler(SAM, { action: "proposer" })).statut === 409, "pendant l'aide : ni message, ni proposition");
await appeler(SAM, { action: "reprendre" });
ok((await appeler(SAM)).etape === "conversation", "il reprend quand il veut");
await parler(SAM, "Je vais très mal ces jours-ci");
ok((await appeler(SAM)).etape === "aide", "le modèle aussi le voit : le message d'aide");

// ═══ LA DICTÉE, EFFACER, LES ADRESSES SOUS /admin ═══
const d = await appeler(SAM, { action: "dicter", audio: `data:audio/webm;base64,${Buffer.alloc(2048, 3).toString("base64")}`, type: "audio/webm" });
ok(d.statut === 200 && d.texte?.startsWith("J'avais dit"), `la dictée : sa voix devient du texte (${d.statut})`);
ok((await appeler(SAM, { action: "dicter", audio: "pas du son" })).statut === 400, "sans son : rien");
await appeler(SAM, { action: "effacer" });
ok((await appeler(SAM)).etape === "transition" && (await conversation(SAM)) === null, "effacer : rien ne reste de sa conversation");
const r1 = await fetch(`${BASE}/admin/univers/figurine`, { redirect: "manual", headers: { cookie: COOKIE_ADMIN } });
ok([307, 308].includes(r1.status) && (r1.headers.get("location") ?? "").endsWith("/univers/figurine"), `/admin/univers/figurine mène à la nouvelle figurine (${r1.status})`);

console.log(echecs ? `\n${echecs} échec(s)` : "\nla conversation tient ✓");
process.exit(echecs ? 1 : 0);

async function consignes() {
  return (await (await fetch(`${FAUX}/__ia`)).json()).filter((c) => typeof c === "string" && c.startsWith("PABLITO"));
}
