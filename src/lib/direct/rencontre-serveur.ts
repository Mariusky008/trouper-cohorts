/**
 * 💬 LA RENCONTRE DU JOUR, CÔTÉ SERVEUR — voir `rencontre.ts` pour la règle.
 *
 * FAITE À LA PREMIÈRE VISITE DU JOUR (pas de tâche planifiée) : s'il n'a pas encore de rencontre aujourd'hui, on
 * choisit avec qui — un ami invité qui n'a encore jamais discuté avec lui, puis ses amis et les commerces en
 * alternance — et l'IA écrit la conversation. Une rencontre entre deux amis compte pour les deux ce jour-là.
 *
 * TOUT EST DANS LE SEAU PRIVÉ des figurines, sans table :
 *   · `rencontres/<id>.json` : la conversation, ses deux côtés, les réactions de chacun ;
 *   · `<habitant>/rencontres.json` : ses rencontres (id, jour, avec qui), ses amis, ce qu'il a appris de lui
 *     (« c'est tout moi » / « jamais de la vie ») et ses compteurs (sa ressemblance) ;
 *   · `invitations/<code>.json` : qui a invité (le lien `/collection?ami=<code>`).
 *
 * FICHIER SERVEUR.
 */
import { randomBytes } from "crypto";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Habitant } from "./habitant";
import { famillesDe } from "./famille-serveur";
import { figurineDu } from "./figurines-commerces";
import { brancheDuMetier } from "@/lib/site-internet/carte-depuis-fiche";
import { villeSlug } from "./ville";
import { motInterdit } from "./mots-interdits";
import { GOUTS, reponsesEnMots, reponsesValides } from "./personnage";
import { cheminCarte, ecrire, imageDe, lire, prenomDe, type Gardee } from "./personnage-serveur";
import {
  REPLIQUES_MAX,
  REPLIQUES_MIN,
  REPLIQUE_MAX,
  codeInvitationValide,
  emotionValide,
  idRencontreValide,
  ressemblance,
  verdictValide,
  type Participant,
  type Reaction,
  type RencontreVue,
} from "./rencontre";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const jourParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const hier = () => jourParis(new Date(Date.now() - 86_400_000));
const nouvelId = (n = 12) => {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  return [...randomBytes(n)].map((b) => a[b % a.length]).join("");
};

/** Un côté de la conversation : un client (son habitant), ou la figurine d'un commerce. */
type Cote = { habitant: string } | { commerce: string };
type Fichier = {
  id: string;
  jour: string;
  le: string;
  a: { habitant: string };
  b: Cote;
  repliques: { qui: "a" | "b"; texte: string }[];
  reactions: Record<string, Record<number, Reaction>>;
  par: "ia" | "local";
  signale_le?: string;
  /** Une rencontre avec un membre de sa ville (« Rencontrer un membre »), qu'il ne connaissait pas. */
  membre?: boolean;
};
type Index = {
  liste: { id: string; jour: string; avec: string }[];
  amis: string[];
  /** Ce qu'il a appris de lui : les phrases où il s'est reconnu, et celles qu'il ne dirait jamais (les dernières). */
  oui: string[];
  non: string[];
  moi: number;
  pas: number;
  invitation?: string;
  /** Le jour de sa dernière rencontre avec un membre (une par jour), s'il est dans la file, et qui il ne veut plus voir. */
  membreJour?: string;
  ouvert?: boolean;
  bloques?: string[];
};
const INDEX_VIDE: Index = { liste: [], amis: [], oui: [], non: [], moi: 0, pas: 0 };
const cheminIndex = (h: string) => `${h}/rencontres.json`;
const cheminRencontre = (id: string) => `rencontres/${id}.json`;
const cheminInvitation = (code: string) => `invitations/${code}.json`;

async function indexDe(supabase: Supabase, h: string): Promise<Index> {
  return { ...INDEX_VIDE, ...((await lire<Partial<Index>>(supabase, cheminIndex(h))) ?? {}) };
}
const cleAvec = (c: Cote) => ("habitant" in c ? `h:${c.habitant}` : `c:${c.commerce}`);

// ─── les amis ────────────────────────────────────────────────────────────────────────────────────
/** Son code d'invitation (toujours le même). */
export async function inviter(supabase: Supabase, habitant: Habitant): Promise<string> {
  const idx = await indexDe(supabase, habitant.id);
  if (idx.invitation && codeInvitationValide(idx.invitation)) return idx.invitation;
  const code = nouvelId(10);
  await ecrire(supabase, cheminInvitation(code), { de: habitant.id, le: new Date().toISOString() });
  await ecrire(supabase, cheminIndex(habitant.id), { ...idx, invitation: code });
  return code;
}

/** Il a ouvert le lien d'un ami (et il a un compte) : ils deviennent amis — leur prochaine rencontre sera ensemble. */
export async function accepter(supabase: Supabase, habitant: Habitant, code: unknown): Promise<{ ami?: string; error?: string }> {
  const c = s(code);
  if (!codeInvitationValide(c)) return { error: "Ce lien d’invitation n’est pas valable." };
  const inv = await lire<{ de?: string }>(supabase, cheminInvitation(c));
  const de = s(inv?.de);
  if (!de) return { error: "Ce lien d’invitation n’est plus valable." };
  if (de === habitant.id) return {};
  const [a, b] = await Promise.all([indexDe(supabase, habitant.id), indexDe(supabase, de)]);
  if (!a.amis.includes(de)) await ecrire(supabase, cheminIndex(habitant.id), { ...a, amis: [...a.amis, de].slice(-50) });
  if (!b.amis.includes(habitant.id)) await ecrire(supabase, cheminIndex(de), { ...b, amis: [...b.amis, habitant.id].slice(-50) });
  return { ami: await prenomDe(supabase, { id: de, prenom: "" }) };
}

// ─── avec qui, aujourd'hui ───────────────────────────────────────────────────────────────────────
type CommerceInfo = { slug: string; nom: string; ville: string; metier: string };
const nettoyerVille = (c: unknown) => s(c).replace(/\b\d{5}\b/g, " ").replace(/\s+/g, " ").trim();

/** Les commerces avec qui sa figurine peut discuter : ceux où il a des figurines, puis ceux de sa ville. */
async function commercesPossibles(supabase: Supabase, habitant: Habitant): Promise<CommerceInfo[]> {
  const [familles, { data }] = await Promise.all([
    famillesDe(supabase, habitant.id).catch(() => []),
    supabase.from("human_vitrine_sites").select("slug, business_name, city, activite").eq("est_client", true).limit(300),
  ]);
  const sites = ((Array.isArray(data) ? data : []) as Record<string, unknown>[]).filter((x) => s(x.slug) && s(x.business_name));
  const info = (x: Record<string, unknown>): CommerceInfo => ({ slug: s(x.slug), nom: s(x.business_name), ville: nettoyerVille(x.city), metier: s(x.activite) });
  const siens = new Set(familles.filter((f) => f.collection && (f.collection.gagnees > 0 || f.collection.trophees.length > 0)).map((f) => f.slug));
  const deSaVille = sites.filter((x) => habitant.villeSlug && villeSlug(nettoyerVille(x.city)) === habitant.villeSlug);
  const vus = new Set<string>();
  return [...sites.filter((x) => siens.has(s(x.slug))), ...deSaVille].map(info).filter((c) => !vus.has(c.slug) && vus.add(c.slug));
}

function dernierJour(idx: Index, avec: string): string {
  return idx.liste.filter((x) => x.avec === avec).reduce((m, x) => (x.jour > m ? x.jour : m), "");
}

// ─── la conversation, par l'IA ───────────────────────────────────────────────────────────────────
const nomsDeGouts = (g: Gardee) => g.gouts.map((k) => GOUTS.find((x) => x.cle === k)?.nom.toLowerCase()).filter(Boolean).join(", ") || "(rien de précisé)";

function portraitClient(lettre: string, prenom: string, g: Gardee, idx: Index): string[] {
  return [
    `FIGURINE ${lettre} — celle de ${prenom || "quelqu'un"} : « ${g.fiche.titre} ».`,
    `- Sa façon de parler : ${g.fiche.facon}`,
    `- Ce qu'elle aime : ${nomsDeGouts(g)}.`,
    ...(g.phrase ? [`- Sa phrase fétiche (une donnée, à reprendre telle quelle si elle la dit) : « ${g.phrase} »`] : []),
    `- Son caractère : ${reponsesEnMots(g.reponses).join(" ; ")}.`,
    ...(idx.oui.length ? [`- ${prenom || "La personne"} s'est reconnu(e) dans ces phrases (garde ce ton) : ${idx.oui.slice(-4).map((x) => `« ${x} »`).join(" ")}`] : []),
    ...(idx.non.length ? [`- ${prenom || "La personne"} ne dirait JAMAIS ces phrases (évite ce ton) : ${idx.non.slice(-4).map((x) => `« ${x} »`).join(" ")}`] : []),
  ];
}

function consigneConversation(a: string[], b: string[], inconnus = false): string {
  return [
    "Tu écris une petite conversation entre deux figurines de collection (des personnages miniatures) qui se rencontrent aujourd'hui, pour ClikMe, l'application des commerces de quartier.",
    ...(inconnus ? ["Elles ne se connaissent pas encore : elles font connaissance, avec curiosité et bonne humeur (sans jamais proposer de se voir en vrai)."] : []),
    "Le ton : drôle, chaleureux, bienveillant — jamais méchant, jamais gênant. Elles se tutoient, parlent de ce qu'elles aiment, se taquinent gentiment, se lancent un petit défi.",
    "Chacune parle EXACTEMENT comme décrit (sa façon de parler) : c'est le jeu, que chacun puisse dire « c'est tout moi ».",
    "Ne devine jamais le genre d'une personne d'après son prénom (des tournures qui vont à tout le monde).",
    "INTERDIT : la santé, le corps et le physique, l'âge, la religion, la politique, la sexualité, l'argent, l'alcool, les marques ; tout lieu ou moment où une personne serait allée ; tout vrai rendez-vous ; toute donnée personnelle.",
    "",
    ...a,
    "",
    ...b,
    "",
    `Écris entre ${REPLIQUES_MIN} et ${REPLIQUES_MAX} répliques, en alternance, A commence. Chaque réplique fait au plus ${REPLIQUE_MAX - 20} caractères.`,
    'Réponds en JSON, exactement : {"repliques": [{"qui": "A", "texte": "…"}, {"qui": "B", "texte": "…"}]}',
  ].join("\n");
}

/** La réponse de l'IA, relue : le bon nombre de répliques, alternées, pas trop longues, sans mot interdit. */
export function repliquesRelues(x: unknown): Fichier["repliques"] | null {
  const l = (x as { repliques?: unknown } | null)?.repliques;
  if (!Array.isArray(l) || l.length < REPLIQUES_MIN || l.length > REPLIQUES_MAX + 2) return null;
  const r: Fichier["repliques"] = [];
  for (const e of l) {
    const qui = s((e as { qui?: unknown })?.qui).toUpperCase();
    const texte = s((e as { texte?: unknown })?.texte).replace(/\s+/g, " ");
    if ((qui !== "A" && qui !== "B") || !texte || texte.length > REPLIQUE_MAX || motInterdit(texte)) return null;
    r.push({ qui: qui === "A" ? "a" : "b", texte });
  }
  return r.slice(0, REPLIQUES_MAX);
}

async function ecrireConversation(consigne: string): Promise<Fichier["repliques"] | null> {
  const cle = s(process.env.OPENAI_API_KEY);
  if (!cle) return null;
  const base = s(process.env.OPENAI_BASE_URL) || "https://api.openai.com";
  try {
    const r = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cle}` },
      body: JSON.stringify({
        model: s(process.env.OPENAI_PERSONNAGE_MODEL) || s(process.env.OPENAI_DOUBLE_MODEL) || "gpt-5.4-mini",
        response_format: { type: "json_object" },
        max_completion_tokens: 1400,
        messages: [{ role: "user", content: consigne }],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return repliquesRelues(JSON.parse(j.choices?.[0]?.message?.content ?? "null"));
  } catch {
    return null;
  }
}

/** Sans IA : une conversation composée d'après les deux cartes (courte, toujours juste). */
function conversationLocale(prenomA: string, a: Gardee, b: { prenom: string; carte: Gardee } | CommerceInfo): Fichier["repliques"] {
  const goutA = GOUTS.find((x) => x.cle === a.gouts[0])?.nom.toLowerCase();
  if ("slug" in b)
    return [
      { qui: "a", texte: `Salut ! Moi c’est ${prenomA || "une nouvelle figurine"}. Il paraît que tu es la figurine de ${b.nom} ?` },
      { qui: "b", texte: `En personne ! Ici, on aime ce qu’on fait. Et toi, qu’est-ce qui te fait vibrer ?` },
      { qui: "a", texte: a.phrase || (goutA ? `Moi ? ${goutA.charAt(0).toUpperCase()}${goutA.slice(1)}, et les bonnes surprises.` : "Les bonnes surprises, toujours.") },
      { qui: "b", texte: "Alors on va bien s’entendre. Passe me voir, je te raconterai mon métier !" },
    ];
  const goutB = GOUTS.find((x) => x.cle === b.carte.gouts[0])?.nom.toLowerCase();
  return [
    { qui: "a", texte: `Salut ${b.prenom || "toi"} ! Alors, c’est toi, « ${b.carte.fiche.titre} » ?` },
    { qui: "b", texte: `Pris sur le fait ! Et toi, « ${a.fiche.titre} »… ça promet !` },
    { qui: "a", texte: a.phrase || (goutA ? `Défi : qui de nous deux est le plus fan de ${goutA} ?` : "Défi : le premier qui rit a perdu.") },
    { qui: "b", texte: b.carte.phrase || (goutB ? `Défi accepté. Mais d’abord, on parle de ${goutB}.` : "Défi accepté !") },
  ];
}

// ─── ce que voit l'un des deux ───────────────────────────────────────────────────────────────────
async function participant(supabase: Supabase, c: Cote, secondes = 3600): Promise<Participant> {
  if ("habitant" in c) {
    const [g, prenom, image] = await Promise.all([lire<Gardee>(supabase, cheminCarte(c.habitant)), prenomDe(supabase, { id: c.habitant, prenom: "" }), imageDe(supabase, c.habitant, secondes)]);
    return { type: "client", prenom, titre: s(g?.fiche?.titre), ...image };
  }
  const { data } = await supabase.from("human_vitrine_sites").select("slug, business_name, city, activite").eq("slug", c.commerce).maybeSingle();
  const x = (data as Record<string, unknown> | null) ?? {};
  const metier = s(x.activite);
  return { type: "commerce", slug: c.commerce, nom: s(x.business_name) || c.commerce, ville: nettoyerVille(x.city), image: figurineDu(c.commerce, { branche: brancheDuMetier(metier), metier }) };
}

async function vueDe(supabase: Supabase, f: Fichier, moiId: string): Promise<RencontreVue> {
  const cote = f.a.habitant === moiId ? "a" : "b";
  const [pa, pb] = await Promise.all([participant(supabase, f.a), participant(supabase, f.b)]);
  return {
    id: f.id,
    jour: f.jour,
    moi: cote === "a" ? pa : pb,
    autre: cote === "a" ? pb : pa,
    repliques: f.repliques.map((r) => ({ moi: r.qui === cote, texte: r.texte })),
    reactions: f.reactions[moiId] ?? {},
    par: f.par,
    ...(f.membre ? { membre: true } : {}),
  };
}

const participe = (f: Fichier, h: string) => f.a.habitant === h || ("habitant" in f.b && f.b.habitant === h);

export type EtatRencontre = {
  rencontre: RencontreVue | null;
  /** Pas encore de carte : la rencontre en a besoin. */
  besoinCarte?: boolean;
  /** Personne avec qui discuter aujourd'hui (aucun commerce, aucun ami). */
  personne?: boolean;
  /** Celle d'aujourd'hui a été signalée. */
  retiree?: boolean;
  ressemblance: number | null;
  amis: number;
  /** Ses rencontres d'avant (les plus récentes d'abord), et avec qui. */
  avant: { id: string; jour: string; avec: string }[];
  /** Il a déjà rencontré un membre aujourd'hui (un par jour) ; il est dans la file des membres. */
  membreAujourdhui: boolean;
  ouvert: boolean;
};

/** Ses rencontres d'avant, avec le nom de l'autre (un prénom, ou le commerce). */
async function rencontresDavant(supabase: Supabase, idx: Index, sauf: string): Promise<EtatRencontre["avant"]> {
  const l = idx.liste.filter((x) => x.id !== sauf).slice(-10).reverse();
  const slugs = [...new Set(l.filter((x) => x.avec.startsWith("c:")).map((x) => x.avec.slice(2)))];
  const { data } = slugs.length ? await supabase.from("human_vitrine_sites").select("slug, business_name").in("slug", slugs) : { data: [] };
  const noms = new Map(((Array.isArray(data) ? data : []) as Record<string, unknown>[]).map((x) => [s(x.slug), s(x.business_name)]));
  const prenoms = new Map(
    await Promise.all([...new Set(l.filter((x) => x.avec.startsWith("h:")).map((x) => x.avec.slice(2)))].map(async (h) => [h, await prenomDe(supabase, { id: h, prenom: "" })] as const)),
  );
  return l.map((x) => ({ id: x.id, jour: x.jour, avec: x.avec.startsWith("h:") ? prenoms.get(x.avec.slice(2)) || "un ami" : noms.get(x.avec.slice(2)) || "un commerce" }));
}

/** 💬 SA RENCONTRE DU JOUR : celle d'aujourd'hui, ou une nouvelle (l'IA l'écrit maintenant). */
export async function rencontreDuJour(supabase: Supabase, habitant: Habitant): Promise<EtatRencontre> {
  const [carte, idx] = await Promise.all([lire<Gardee>(supabase, cheminCarte(habitant.id)), indexDe(supabase, habitant.id)]);
  const base = {
    rencontre: null,
    ressemblance: ressemblance(idx.moi, idx.pas),
    amis: idx.amis.length,
    avant: [] as EtatRencontre["avant"],
    membreAujourdhui: idx.membreJour === jourParis(),
    ouvert: Boolean(idx.ouvert),
  };
  if (!carte || !reponsesValides(carte.reponses)) return { ...base, avant: await rencontresDavant(supabase, idx, ""), besoinCarte: true };
  const jour = jourParis();
  // UN AMI QUI VIENT DE FAIRE SA CARTE, et qu'il n'a jamais rencontré : leur rencontre, tout de suite (même s'il en a
  // déjà eu une aujourd'hui) — « dès qu'il a créé son compte, la prochaine conversation sera entre eux deux »
  const amisAvecCarte = (await Promise.all(idx.amis.map(async (a) => ((await lire<Gardee>(supabase, cheminCarte(a))) ? a : null)))).filter((a): a is string => Boolean(a));
  const amiNeuf = amisAvecCarte.find((a) => !dernierJour(idx, `h:${a}`));
  const deJour = [...idx.liste].reverse().find((x) => x.jour === jour);
  if (deJour && !amiNeuf) {
    const f = await lire<Fichier>(supabase, cheminRencontre(deJour.id));
    if (f && !f.signale_le && participe(f, habitant.id)) return { ...base, avant: await rencontresDavant(supabase, idx, f.id), rencontre: await vueDe(supabase, f, habitant.id) };
    if (f?.signale_le) return { ...base, avant: await rencontresDavant(supabase, idx, f.id), retiree: true };
  }

  // AVEC QUI : un ami jamais rencontré ; sinon un ami et un commerce, chacun son tour
  const hierAvecUnAmi = idx.liste.some((x) => x.jour === hier() && x.avec.startsWith("h:"));
  const amiAncien = [...amisAvecCarte].sort((a, b) => dernierJour(idx, `h:${a}`).localeCompare(dernierJour(idx, `h:${b}`)))[0];
  let b: Cote | null = amiNeuf ? { habitant: amiNeuf } : amiAncien && !hierAvecUnAmi ? { habitant: amiAncien } : null;
  let commerce: CommerceInfo | null = null;
  if (!b) {
    const possibles = await commercesPossibles(supabase, habitant);
    // celui qu'il a vu il y a le plus longtemps (ou jamais)
    commerce = [...possibles].sort((x, y) => dernierJour(idx, `c:${x.slug}`).localeCompare(dernierJour(idx, `c:${y.slug}`)))[0] ?? null;
    if (commerce) b = { commerce: commerce.slug };
    else if (amiAncien) b = { habitant: amiAncien };
  }
  if (!b) return { ...base, avant: await rencontresDavant(supabase, idx, ""), personne: true };

  const { f, idxApres } = await creerConversation(supabase, habitant, carte, idx, b, commerce);
  return { ...base, avant: await rencontresDavant(supabase, idxApres, f.id), rencontre: await vueDe(supabase, f, habitant.id) };
}

/** LA CONVERSATION : l'IA l'écrit d'après les deux cartes ; rangée, et dans les rencontres des deux (entre clients). */
async function creerConversation(
  supabase: Supabase,
  habitant: Habitant,
  carte: Gardee,
  idx: Index,
  b: Cote,
  commerce: CommerceInfo | null,
  membre = false,
): Promise<{ f: Fichier; idxApres: Index }> {
  const jour = jourParis();
  const prenomA = await prenomDe(supabase, habitant);
  const portraitA = portraitClient("A", prenomA, carte, idx);
  let autre: { prenom: string; carte: Gardee } | CommerceInfo;
  let portraitB: string[];
  if ("habitant" in b) {
    const [gB, prenomB, idxB] = await Promise.all([lire<Gardee>(supabase, cheminCarte(b.habitant)), prenomDe(supabase, { id: b.habitant, prenom: "" }), indexDe(supabase, b.habitant)]);
    autre = { prenom: prenomB, carte: gB! };
    portraitB = portraitClient("B", prenomB, gB!, idxB);
  } else {
    autre = commerce!;
    portraitB = [
      `FIGURINE B — la figurine de « ${commerce!.nom} », un commerce${commerce!.metier ? ` (${commerce!.metier})` : ""}${commerce!.ville ? ` de ${commerce!.ville}` : ""}.`,
      "- Elle parle de son métier avec passion et humour, en termes généraux.",
      "- Elle ne promet RIEN et n'invente RIEN sur le commerce : aucun prix, aucune offre, aucune réduction, aucun horaire, aucun produit précis. Ce n'est pas le commerçant qui parle.",
    ];
  }
  const ia = await ecrireConversation(consigneConversation(portraitA, portraitB, membre));
  const f: Fichier = {
    id: nouvelId(),
    jour,
    le: new Date().toISOString(),
    a: { habitant: habitant.id },
    b,
    repliques: ia ?? conversationLocale(prenomA, carte, autre),
    reactions: {},
    par: ia ? "ia" : "local",
    ...(membre ? { membre: true } : {}),
  };
  await ecrire(supabase, cheminRencontre(f.id), f);
  const idxApres: Index = { ...idx, liste: [...idx.liste, { id: f.id, jour, avec: cleAvec(b) }].slice(-120), ...(membre ? { membreJour: jour } : {}) };
  await ecrire(supabase, cheminIndex(habitant.id), idxApres);
  // ENTRE DEUX CLIENTS : la même rencontre, chez l'autre aussi
  if ("habitant" in b) {
    const idxB = await indexDe(supabase, b.habitant);
    await ecrire(supabase, cheminIndex(b.habitant), { ...idxB, liste: [...idxB.liste, { id: f.id, jour, avec: `h:${habitant.id}` }].slice(-120), ...(membre ? { membreJour: jour } : {}) });
  }
  return { f, idxApres };
}

// ─── 🎲 rencontrer un membre ─────────────────────────────────────────────────────────────────────
/**
 * « RENCONTRER UN MEMBRE » (5 novembre 2026 : « si on n'invite personne, on peut appuyer sur un compte à rebours pour
 * être mis en contact avec un membre ») : son geste l'inscrit dans la file des membres de sa ville (il accepte que sa
 * figurine, son prénom et sa carte soient présentés) ; on lui présente celui qui attend depuis le plus longtemps — pas
 * quelqu'un qu'il a bloqué ou qui l'a bloqué, pas quelqu'un vu ces quatorze derniers jours, chacun une fois par jour.
 * Personne ? Il attend dans la file : le prochain qui appuie le rencontrera.
 */
const cheminFile = (ville: string) => `membres/${ville || "toutes"}.json`;
type File = { liste: { h: string; le: string }[] };

export async function rencontrerUnMembre(supabase: Supabase, habitant: Habitant): Promise<{ rencontre?: RencontreVue; attente?: boolean; error?: string; statut?: number }> {
  const [carte, idx] = await Promise.all([lire<Gardee>(supabase, cheminCarte(habitant.id)), indexDe(supabase, habitant.id)]);
  if (!carte || !reponsesValides(carte.reponses)) return { error: "Fais d’abord ta carte de personnage.", statut: 400 };
  const jour = jourParis();
  if (idx.membreJour === jour) return { error: "Une rencontre de membre par jour : reviens demain !", statut: 429 };
  const chemin = cheminFile(habitant.villeSlug);
  const file = (await lire<File>(supabase, chemin)) ?? { liste: [] };
  const ilYa14 = jourParis(new Date(Date.now() - 14 * 86_400_000));
  const bloques = new Set(idx.bloques ?? []);
  let choisi: string | null = null;
  for (const x of [...file.liste].sort((a, b) => a.le.localeCompare(b.le))) {
    if (x.h === habitant.id || bloques.has(x.h) || dernierJour(idx, `h:${x.h}`) > ilYa14) continue;
    const [gX, idxX] = await Promise.all([lire<Gardee>(supabase, cheminCarte(x.h)), indexDe(supabase, x.h)]);
    if (!gX || !idxX.ouvert || idxX.membreJour === jour || (idxX.bloques ?? []).includes(habitant.id)) continue;
    choisi = x.h;
    break;
  }
  // il entre dans la file (ou y reste), et il est « ouvert » aux rencontres
  const autres = file.liste.filter((x) => x.h !== habitant.id && x.h !== choisi);
  await ecrire(supabase, chemin, { liste: [...autres, ...(choisi ? [] : [{ h: habitant.id, le: new Date().toISOString() }])].slice(-500) });
  if (!choisi) {
    await ecrire(supabase, cheminIndex(habitant.id), { ...idx, ouvert: true });
    return { attente: true };
  }
  const { f } = await creerConversation(supabase, habitant, carte, { ...idx, ouvert: true }, { habitant: choisi }, null, true);
  return { rencontre: await vueDe(supabase, f, habitant.id) };
}

/** Il ne veut plus rencontrer de membres : il sort de la file. */
export async function arreterMembres(supabase: Supabase, habitant: Habitant): Promise<void> {
  const idx = await indexDe(supabase, habitant.id);
  const chemin = cheminFile(habitant.villeSlug);
  const file = (await lire<File>(supabase, chemin)) ?? { liste: [] };
  await ecrire(supabase, chemin, { liste: file.liste.filter((x) => x.h !== habitant.id) });
  await ecrire(supabase, cheminIndex(habitant.id), { ...idx, ouvert: false });
}

/** Il ne veut plus rencontrer CE membre (une rencontre de membre) : on ne les présentera plus. */
export async function bloquerMembre(supabase: Supabase, habitant: Habitant, id: unknown): Promise<boolean> {
  const rid = s(id);
  if (!idRencontreValide(rid)) return false;
  const f = await lire<Fichier>(supabase, cheminRencontre(rid));
  if (!f || !f.membre || !participe(f, habitant.id)) return false;
  const autre = f.a.habitant === habitant.id ? ("habitant" in f.b ? f.b.habitant : "") : f.a.habitant;
  if (!autre) return false;
  const idx = await indexDe(supabase, habitant.id);
  await ecrire(supabase, cheminIndex(habitant.id), { ...idx, bloques: [...new Set([...(idx.bloques ?? []), autre])].slice(-200) });
  return true;
}

/** Une rencontre d'avant (il y participait). */
export async function rencontreParId(supabase: Supabase, habitant: Habitant, id: string): Promise<RencontreVue | null> {
  if (!idRencontreValide(id)) return null;
  const f = await lire<Fichier>(supabase, cheminRencontre(id));
  return f && !f.signale_le && participe(f, habitant.id) ? vueDe(supabase, f, habitant.id) : null;
}

/**
 * ✅ IL RÉAGIT À UNE PHRASE : « c'est tout moi » / « jamais de la vie » (sur une phrase de SA figurine : c'est ce qui
 * affine les prochaines), et une émotion (sur n'importe laquelle).
 */
export async function reagir(supabase: Supabase, habitant: Habitant, id: unknown, n: unknown, p: { v?: unknown; e?: unknown }): Promise<{ ressemblance?: number | null; error?: string }> {
  const rid = s(id);
  const k = Number(n);
  if (!idRencontreValide(rid) || !Number.isInteger(k)) return { error: "Demande incomplète." };
  const f = await lire<Fichier>(supabase, cheminRencontre(rid));
  if (!f || f.signale_le || !participe(f, habitant.id) || !f.repliques[k]) return { error: "Cette rencontre n’existe plus." };
  const cote = f.a.habitant === habitant.id ? "a" : "b";
  const sienne = f.repliques[k].qui === cote;
  const avant = f.reactions[habitant.id]?.[k] ?? {};
  const v = p.v === null ? undefined : (verdictValide(p.v) ?? avant.v);
  const e = p.e === null ? undefined : (emotionValide(p.e) ?? avant.e);
  if (v && !sienne) return { error: "On ne juge que les phrases de sa figurine." };
  const apres: Reaction = { ...(v ? { v } : {}), ...(e ? { e } : {}) };
  await ecrire(supabase, cheminRencontre(rid), { ...f, reactions: { ...f.reactions, [habitant.id]: { ...(f.reactions[habitant.id] ?? {}), [k]: apres } } });
  // ce qu'il a appris de lui, et sa ressemblance
  const idx = await indexDe(supabase, habitant.id);
  if (avant.v !== apres.v) {
    const texte = f.repliques[k].texte;
    const moins = (l: string[]) => l.filter((x) => x !== texte);
    const n2 = { ...idx, oui: moins(idx.oui), non: moins(idx.non), moi: idx.moi - (avant.v === "moi" ? 1 : 0), pas: idx.pas - (avant.v === "pas" ? 1 : 0) };
    if (apres.v === "moi") Object.assign(n2, { oui: [...n2.oui, texte].slice(-12), moi: n2.moi + 1 });
    if (apres.v === "pas") Object.assign(n2, { non: [...n2.non, texte].slice(-12), pas: n2.pas + 1 });
    await ecrire(supabase, cheminIndex(habitant.id), n2);
    return { ressemblance: ressemblance(n2.moi, n2.pas) };
  }
  return { ressemblance: ressemblance(idx.moi, idx.pas) };
}

/** « Signaler » : la rencontre ne s'affiche plus, pour les deux. */
export async function signalerRencontre(supabase: Supabase, habitant: Habitant, id: unknown): Promise<boolean> {
  const rid = s(id);
  if (!idRencontreValide(rid)) return false;
  const f = await lire<Fichier>(supabase, cheminRencontre(rid));
  if (!f || !participe(f, habitant.id)) return false;
  if (!f.signale_le) await ecrire(supabase, cheminRencontre(rid), { ...f, signale_le: new Date().toISOString() });
  return true;
}
