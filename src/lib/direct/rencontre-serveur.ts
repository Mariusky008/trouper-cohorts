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
 * Une rencontre porte aussi son titre (la carte souvenir), ce qui a été partagé, et — entre deux clients qui l'ont
 * voulu tous les deux — leurs impressions (`echange`).
 *
 * LE RÉSEAU DES FIGURINES (`reseau.ts`, 5 novembre 2026) : sa rencontre du jour est toujours hors de son entourage (un
 * membre de sa ville s'il l'a accepté, un commerçant, un personnage de ClikMe, Pablito la toute première fois), à tour
 * de rôle ; ses amis et proches, il discute avec eux quand il veut (`discuterAvecUnAmi`, `AMIS_PAR_JOUR` par jour) ;
 * chaque conversation a son format du jour (`choisirFormat`) et finit par une question pour lui (`repondre` : sa
 * réponse nourrit les suivantes).
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
import { GOUTS, PROGRES_VIDE, caracteristiques, reponsesEnMots, reponsesValides } from "./personnage";
import { AMIS_PAR_JOUR, PERSONNAGES, REPONSE_MAX, choisirFormat, choisirPersonnage, formatDe, personnageDe, type FORMATS } from "./reseau";
import { imageFigurineGuide } from "./guide";
import { cheminCarte, ecrire, imageDe, lire, prenomDe, type Gardee } from "./personnage-serveur";
import {
  GESTES,
  IMPRESSIONS_MAX,
  PARTAGE_LONGUEUR,
  PARTAGE_MAX,
  REPLIQUES_MAX,
  REPLIQUES_MIN,
  REPLIQUE_MAX,
  TITRE_MAX,
  codeInvitationValide,
  emotionValide,
  gesteValide,
  idRencontreValide,
  impressionRefusee,
  ressemblance,
  verdictValide,
  type Geste,
  type Participant,
  type Reaction,
  type RencontreVue,
  type Souvenir,
} from "./rencontre";

type Supabase = ReturnType<typeof createAdminClient>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();
const jourParis = (d = new Date()) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
const nouvelId = (n = 12) => {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  return [...randomBytes(n)].map((b) => a[b % a.length]).join("");
};

/** Un côté de la conversation : un client (son habitant), la figurine d'un commerce, ou un personnage de ClikMe. */
type Cote = { habitant: string } | { commerce: string } | { personnage: string };
type Personnage = (typeof PERSONNAGES)[number];
type Format = (typeof FORMATS)[number];
type Fichier = {
  id: string;
  jour: string;
  le: string;
  a: { habitant: string };
  b: Cote;
  repliques: { qui: "a" | "b"; texte: string; geste?: Geste }[];
  reactions: Record<string, Record<number, Reaction>>;
  par: "ia" | "local";
  signale_le?: string;
  /** Une rencontre avec un membre de sa ville (« Rencontrer un membre »), qu'il ne connaissait pas. */
  membre?: boolean;
  /** La carte souvenir : son titre ; ce qui a été partagé (celles d'avant le 5 novembre n'en ont pas). */
  titre?: string;
  partage?: string[];
  /** Entre deux clients : qui veut échanger ses impressions, et ce qu'ils se sont écrit. */
  echange?: { oui: string[]; messages: { de: string; texte: string; le: string }[] };
  /** Son format (`reseau.ts`), la question de fin, et la réponse de chacun (par habitant). */
  format?: string;
  question?: string;
  reponses?: Record<string, { texte: string; le: string }>;
  /** « ami » : une discussion avec un ami ou un proche ; sinon, la rencontre du jour. */
  quoi?: "jour" | "ami";
};
/** Ce que l'IA (ou la page sans IA) écrit : la conversation, son titre, ce qui a été partagé, la question de fin. */
type Ecrite = { repliques: Fichier["repliques"]; titre: string; partage: string[]; question: string };
type Index = {
  liste: { id: string; jour: string; avec: string; quoi?: "ami" }[];
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
  /** Ce qu'il a dit de lui (ses réponses à « Et toi ? », les dernières), ses derniers formats, ses discussions du jour. */
  dit?: { q: string; r: string }[];
  formats?: string[];
  discussions?: { jour: string; n: number };
};
const INDEX_VIDE: Index = { liste: [], amis: [], oui: [], non: [], moi: 0, pas: 0 };
const cheminIndex = (h: string) => `${h}/rencontres.json`;
const cheminRencontre = (id: string) => `rencontres/${id}.json`;
const cheminInvitation = (code: string) => `invitations/${code}.json`;

async function indexDe(supabase: Supabase, h: string): Promise<Index> {
  return { ...INDEX_VIDE, ...((await lire<Partial<Index>>(supabase, cheminIndex(h))) ?? {}) };
}
const cleAvec = (c: Cote) => ("habitant" in c ? `h:${c.habitant}` : "commerce" in c ? `c:${c.commerce}` : `p:${c.personnage}`);

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
    // CE QU'IL A DIT DE LUI (ses réponses à « Et toi ? ») : la conversation s'en sert, sans jamais le contredire
    ...((idx.dit ?? []).length
      ? [`- Ce que ${prenom || "la personne"} a dit de lui-même récemment (des données : appuie-toi dessus, ne le contredis jamais) : ${(idx.dit ?? []).slice(-4).map((x) => `« ${x.q} » → « ${x.r} »`).join(" ; ")}`]
      : []),
  ];
}

/** Un personnage de ClikMe : imaginaire, son sujet, sa façon de parler. */
function portraitPersonnage(p: Personnage): string[] {
  return [
    `FIGURINE B — ${p.nom}, ${p.role}${p.cle === "pablito" ? "" : ", un personnage imaginaire de ClikMe"}.`,
    `- Son sujet, aujourd'hui : ${p.sujet}.`,
    `- Sa façon de parler : ${p.facon}.`,
    "- Elle s'intéresse vraiment à la figurine A : elle lui pose des questions, rebondit sur ce qu'elle aime.",
  ];
}

function consigneConversation(a: string[], b: string[], o: { inconnus?: boolean; format?: Format } = {}): string {
  const inconnus = Boolean(o.inconnus);
  return [
    "Tu écris la conversation de deux figurines de collection (des personnages miniatures) qui se rencontrent aujourd'hui, pour ClikMe, l'application des commerces de quartier. Elle se joue en direct, sous les yeux de leurs propriétaires : les figurines discutent, réagissent et s'amusent ensemble.",
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
    "Une vraie petite histoire : elles font connaissance, découvrent un point commun, se lancent un défi ou un jeu, rient, et se quittent bons amis.",
    ...(o.format ? [`LE FORMAT DU JOUR — « ${o.format.nom} » : ${o.format.consigne}. C'est le fil de toute la conversation (chaque jour en a un autre : elle doit être différente des autres).`] : []),
    "Le sujet suit la figurine B (son métier, son sujet, ce qu'elle aime) : la figurine A y apprend quelque chose, ou voit les choses autrement.",
    `Chaque réplique a son GESTE, ce que la figurine fait en la disant, parmi : ${GESTES.map((g) => `« ${g.cle} » (${g.dit})`).join(", ")}. Varie-les.`,
    `Donne aussi à la rencontre un TITRE drôle, de ${TITRE_MAX} caractères au plus (« Le duel des desserts »), et ce qui a été PARTAGÉ : ${PARTAGE_MAX} points au plus, de ${PARTAGE_LONGUEUR - 20} caractères au plus chacun (un point commun, le défi lancé, une découverte), écrits pour les deux propriétaires.`,
    "Pour finir, une QUESTION pour le propriétaire de la figurine A (120 caractères au plus, tutoiement) : sur ce qui s'est dit, pour qu'il réagisse et dise ce qu'il en pense vraiment (« Et toi, tu aurais choisi quoi ? »).",
    'Réponds en JSON, exactement : {"titre": "…", "partage": ["…", "…"], "question": "…", "repliques": [{"qui": "A", "texte": "…", "geste": "rit"}, {"qui": "B", "texte": "…", "geste": "clin"}]}',
  ].join("\n");
}

/**
 * La réponse de l'IA, relue : le bon nombre de répliques, alternées, pas trop longues, sans mot interdit ; un geste
 * inconnu est retiré ; un titre ou un point partagé de travers est retiré (la conversation reste).
 */
export function conversationRelue(x: unknown): Ecrite | null {
  const o = (x as { repliques?: unknown; titre?: unknown; partage?: unknown; question?: unknown } | null) ?? {};
  const l = o.repliques;
  if (!Array.isArray(l) || l.length < REPLIQUES_MIN || l.length > REPLIQUES_MAX + 2) return null;
  const r: Fichier["repliques"] = [];
  for (const e of l) {
    const qui = s((e as { qui?: unknown })?.qui).toUpperCase();
    const texte = s((e as { texte?: unknown })?.texte).replace(/\s+/g, " ");
    if ((qui !== "A" && qui !== "B") || !texte || texte.length > REPLIQUE_MAX || motInterdit(texte)) return null;
    const geste = gesteValide(s((e as { geste?: unknown })?.geste).toLowerCase());
    r.push({ qui: qui === "A" ? "a" : "b", texte, ...(geste ? { geste } : {}) });
  }
  const propre = (v: unknown, max: number) => {
    const z = s(v).replace(/\s+/g, " ").replace(/^[«"“\s]+|[»"”\s]+$/g, "");
    return z && z.length <= max && !motInterdit(z) ? z : "";
  };
  const titre = propre(o.titre, TITRE_MAX);
  const partage = (Array.isArray(o.partage) ? o.partage : []).map((p) => propre(p, PARTAGE_LONGUEUR)).filter(Boolean).slice(0, PARTAGE_MAX);
  return { repliques: r.slice(0, REPLIQUES_MAX), titre, partage, question: propre(o.question, 140) };
}

async function ecrireConversation(consigne: string): Promise<Ecrite | null> {
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
        max_completion_tokens: 2600,
        messages: [{ role: "user", content: consigne }],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return conversationRelue(JSON.parse(j.choices?.[0]?.message?.content ?? "null"));
  } catch {
    return null;
  }
}

/** Sans IA : une conversation composée d'après les deux cartes (toujours juste), avec ses gestes, son titre, son partage. */
function conversationLocale(prenomA: string, a: Gardee, b: { prenom: string; carte: Gardee } | CommerceInfo | Personnage, format?: Format): Ecrite {
  const goutA = GOUTS.find((x) => x.cle === a.gouts[0])?.nom.toLowerCase();
  const fetiche = (g: Gardee, sinon: string) => g.phrase || sinon;
  // LE FORMAT DU JOUR : son échange, ce qui a été partagé, sa question (sans format : un défi)
  const question = format?.question ?? "Et toi, qu’en penses-tu ?";
  const titreAvec = (mot: string, nom: string, sinon: string) => [format ? `${format.nom} ${mot} ${nom}` : "", sinon].find((x) => x && x.length <= TITRE_MAX) ?? "Une belle rencontre";
  if ("accroche" in b)
    return {
      titre: titreAvec("avec", b.nom, `Rencontre avec ${b.nom}`),
      partage: [`Ta figurine a rencontré ${b.nom}, ${b.role}.`, `Le sujet : ${b.sujet.split(" — ")[0]}.`, format?.partage ?? (goutA ? `Elle lui a parlé de ce qu’elle aime : ${goutA}.` : "Elle lui a parlé de ce qu’elle aime.")],
      question,
      repliques: [
        { qui: "a", texte: `Salut ! Moi c’est ${prenomA || "une nouvelle figurine"}. Tu es ${b.nom}, c’est ça ?`, geste: "surprise" },
        { qui: "b", texte: `${b.nom} en personne ! ${b.accroche}`.slice(0, REPLIQUE_MAX), geste: "applaudit" },
        { qui: "a", texte: "Et de quoi on parle, aujourd’hui ?", geste: "reflechit" },
        { qui: "b", texte: `${format ? `${format.nom} ! ` : ""}Raconte-moi ce que tu aimes, et je te dirai ce que j’en pense.`.slice(0, REPLIQUE_MAX), geste: "clin" },
        { qui: "a", texte: fetiche(a, goutA ? `Moi ? ${goutA.charAt(0).toUpperCase()}${goutA.slice(1)}, et les bonnes surprises.` : "Les bonnes surprises, toujours."), geste: "danse" },
        { qui: "b", texte: "J’adore. Tu vois, on apprend toujours quelque chose en rencontrant quelqu’un.", geste: "touchee" },
        { qui: "a", texte: format?.ouverture ?? "Petit défi : demain, chacun essaie un truc nouveau. D’accord ?", geste: "grimace" },
        { qui: "b", texte: format?.reponse ?? "Défi accepté ! Reviens me raconter.", geste: "rit" },
        { qui: "a", texte: "Promis. Merci pour cette rencontre !", geste: "applaudit" },
      ],
    };
  if ("slug" in b)
    return {
      question,
      titre: titreAvec("chez", b.nom, `Rencontre chez ${b.nom}`.length <= TITRE_MAX ? `Rencontre chez ${b.nom}` : "Rencontre chez un commerce ClikMe"),
      partage: [
        `Ta figurine a découvert la figurine de ${b.nom}${b.metier ? ` (${b.metier.toLowerCase()})` : ""}.`,
        goutA ? `Elle lui a parlé de ce qu’elle aime : ${goutA}.` : "Elle lui a parlé de ce qu’elle aime.",
        format?.partage ?? "Le défi lancé : se raconter une surprise la prochaine fois.",
      ],
      repliques: [
        { qui: "a", texte: `Salut ! Moi c’est ${prenomA || "une nouvelle figurine"}. Il paraît que tu es la figurine de ${b.nom} ?`, geste: "surprise" },
        { qui: "b", texte: "En personne ! Bienvenue. Ici, on aime ce qu’on fait, et ça se voit.", geste: "applaudit" },
        { qui: "a", texte: "Et qu’est-ce qui te plaît le plus, dans ton métier ?", geste: "reflechit" },
        { qui: "b", texte: "Les sourires des gens qui passent la porte. Ça n’a pas de prix !", geste: "touchee" },
        { qui: "b", texte: "Et toi, qu’est-ce qui te fait vibrer ?", geste: "clin" },
        { qui: "a", texte: fetiche(a, goutA ? `Moi ? ${goutA.charAt(0).toUpperCase()}${goutA.slice(1)}, et les bonnes surprises.` : "Les bonnes surprises, toujours."), geste: "danse" },
        { qui: "b", texte: "J’adore. Tu sais quoi ? On va bien s’entendre, toi et moi.", geste: "rit" },
        { qui: "a", texte: format?.ouverture ?? "Petit défi : la prochaine fois, chacun raconte une surprise. D’accord ?", geste: "grimace" },
        { qui: "b", texte: format ? `${format.reponse} Passe me voir, je te raconterai mon métier.`.slice(0, REPLIQUE_MAX) : "Défi accepté ! Passe me voir, je te raconterai mon métier.", geste: "applaudit" },
      ],
    };
  const goutB = GOUTS.find((x) => x.cle === b.carte.gouts[0])?.nom.toLowerCase();
  const commun = a.gouts.find((g) => b.carte.gouts.includes(g));
  const nomCommun = commun ? GOUTS.find((x) => x.cle === commun)?.nom.toLowerCase() : "";
  return {
    question,
    // (jamais coupé au milieu d'un mot : trop long, « Rencontre avec … »)
    titre: [
      format ? `${format.nom} avec ${b.prenom || "un ami"}` : "",
      nomCommun ? `Le duel ${/^[aeiouyhéè]/i.test(nomCommun) ? "de l’" : "du "}${nomCommun}` : "",
      `${a.fiche.titre} rencontre ${b.carte.fiche.titre}`,
      `Rencontre avec ${b.prenom || "un ami"}`,
    ].find((x) => x && x.length <= TITRE_MAX)!,
    partage: [
      nomCommun ? `Un point commun : vous aimez tous les deux ${nomCommun}.` : `Deux caractères qui se complètent : « ${a.fiche.titre} » et « ${b.carte.fiche.titre} ».`,
      format?.partage ?? `Le défi lancé : ${goutA ? `qui est le plus fan de ${goutA}` : "le premier qui rit a perdu"}.`,
      goutB ? `${b.prenom || "L’autre figurine"} a parlé de ${goutB}.` : `${b.prenom || "L’autre figurine"} a dit sa phrase préférée.`,
    ],
    repliques: [
      { qui: "a", texte: `Salut ${b.prenom || "toi"} ! Alors, c’est toi, « ${b.carte.fiche.titre} » ?`, geste: "surprise" },
      { qui: "b", texte: `Pris sur le fait ! Et toi, « ${a.fiche.titre} »… ça promet !`, geste: "rit" },
      { qui: "a", texte: "On m’a dit que tu avais du caractère. Je vérifie.", geste: "reflechit" },
      { qui: "b", texte: fetiche(b.carte, "Du caractère ? Juste ce qu’il faut. Et beaucoup d’humour."), geste: "clin" },
      { qui: "a", texte: fetiche(a, goutA ? `Moi, mon truc, c’est ${goutA}.` : "Moi, mon truc, ce sont les bonnes surprises."), geste: "danse" },
      { qui: "b", texte: nomCommun ? `Attends… moi aussi, ${nomCommun} ! On est faits pour s’entendre.` : goutB ? `Moi, c’est ${goutB}. Tu me feras découvrir le tien ?` : "On va bien s’entendre, je le sens.", geste: "touchee" },
      { qui: "a", texte: format?.ouverture ?? (goutA ? `Défi : qui de nous deux est le plus fan de ${goutA} ?` : "Défi : le premier qui rit a perdu."), geste: "grimace" },
      { qui: "b", texte: format?.reponse ?? "Défi accepté… et j’ai déjà presque ri. Raté !", geste: "rit" },
      { qui: "a", texte: "Une grimace pour la peine, et on se revoit demain ?", geste: "grimace" },
      { qui: "b", texte: "Avec plaisir. Bravo, c’était une super rencontre !", geste: "applaudit" },
    ],
  };
}

// ─── ce que voit l'un des deux ───────────────────────────────────────────────────────────────────
async function participant(supabase: Supabase, c: Cote, secondes = 3600): Promise<Participant> {
  if ("personnage" in c) {
    const p = personnageDe(c.personnage) ?? PERSONNAGES[0];
    return { type: "personnage", cle: p.cle, nom: p.nom, role: p.role, emoji: p.emoji, image: p.cle === "pablito" ? imageFigurineGuide() : "" };
  }
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
    repliques: f.repliques.map((r) => ({ moi: r.qui === cote, texte: r.texte, ...(r.geste ? { geste: r.geste } : {}) })),
    reactions: f.reactions[moiId] ?? {},
    par: f.par,
    ...(f.membre ? { membre: true } : {}),
    ...(f.titre ? { titre: f.titre } : {}),
    ...(f.partage?.length ? { partage: f.partage } : {}),
    // ENTRE DEUX CLIENTS : leurs impressions, si les deux le veulent
    ...("habitant" in f.b ? { echange: echangeVu(f, moiId) } : {}),
    ...(formatDe(f.format) ? { format: { cle: formatDe(f.format)!.cle, nom: formatDe(f.format)!.nom } } : {}),
    ...(f.question ? { question: f.question } : {}),
    ...(f.reponses?.[moiId] ? { reponse: f.reponses[moiId].texte } : {}),
    quoi: f.quoi === "ami" ? "ami" : "jour",
  };
}

function echangeVu(f: Fichier, moiId: string): NonNullable<RencontreVue["echange"]> {
  const autreId = autreDe(f, moiId);
  const oui = f.echange?.oui ?? [];
  const tous = oui.includes(moiId) && oui.includes(autreId);
  return { moi: oui.includes(moiId), autre: tous, messages: tous ? (f.echange?.messages ?? []).map((m) => ({ moi: m.de === moiId, texte: m.texte, le: m.le })) : [] };
}
const autreDe = (f: Fichier, moiId: string) => (f.a.habitant === moiId ? ("habitant" in f.b ? f.b.habitant : "") : f.a.habitant);

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
  /** Ses rencontres d'avant (les plus récentes d'abord), avec qui, et leur titre (la carte souvenir). */
  avant: { id: string; jour: string; avec: string; titre?: string }[];
  /** Il a déjà rencontré un membre aujourd'hui (un par jour) ; il est dans la file des membres. */
  membreAujourdhui: boolean;
  ouvert: boolean;
  /** 👯 Ses amis et proches (`n` : sa place dans sa liste), et combien de discussions il peut encore lancer aujourd'hui. */
  amisListe: { n: number; prenom: string; carte: boolean; image: string; figurine: boolean }[];
  discussionsRestantes: number;
  /** Une discussion avec un ami qui vient d'arriver (« la prochaine conversation sera entre eux deux ») : à montrer. */
  nouvelle?: RencontreVue;
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
  const fichiers = await Promise.all(l.map((x) => lire<Fichier>(supabase, cheminRencontre(x.id)).catch(() => null)));
  return l.flatMap((x, k) =>
    fichiers[k]?.signale_le
      ? []
      : [
          {
            id: x.id,
            jour: x.jour,
            avec: x.avec.startsWith("h:")
              ? prenoms.get(x.avec.slice(2)) || "un ami"
              : x.avec.startsWith("p:")
                ? (personnageDe(x.avec.slice(2))?.nom ?? "un personnage")
                : noms.get(x.avec.slice(2)) || "un commerce",
            ...(fichiers[k]?.titre ? { titre: fichiers[k]!.titre } : {}),
          },
        ],
  );
}

/** Ses amis et proches, pour la page (sa place dans sa liste, pas son identifiant) : les 12 derniers. */
async function amisDe(supabase: Supabase, idx: Index): Promise<EtatRencontre["amisListe"]> {
  const liste = idx.amis.map((h, n) => ({ h, n })).slice(-12);
  return Promise.all(
    liste.map(async ({ h, n }) => {
      const [carte, prenom, image] = await Promise.all([lire<Gardee>(supabase, cheminCarte(h)), prenomDe(supabase, { id: h, prenom: "" }), imageDe(supabase, h, 3600)]);
      return { n, prenom: prenom || "Un ami", carte: Boolean(carte && reponsesValides(carte.reponses)), ...image };
    }),
  );
}
const discussionsDuJour = (idx: Index) => (idx.discussions?.jour === jourParis() ? idx.discussions.n : 0);

/**
 * 💬 SA RENCONTRE DU JOUR — toujours hors de son entourage (« un commerçant, un citoyen, un politique, un influenceur,
 * Pablito quand il n'y a personne ») : la toute première, Pablito l'accueille ; ensuite, à tour de rôle, le genre
 * qu'il a vu il y a le plus longtemps — un membre de sa ville (s'il a accepté d'en rencontrer : « Rencontre un
 * membre »), un commerçant, un personnage de ClikMe. Ses amis, c'est à part (`discuterAvecUnAmi`) ; un ami qui vient
 * d'arriver : leur discussion se fait aussitôt.
 */
export async function rencontreDuJour(supabase: Supabase, habitant: Habitant): Promise<EtatRencontre> {
  const [carte, idx0] = await Promise.all([lire<Gardee>(supabase, cheminCarte(habitant.id)), indexDe(supabase, habitant.id)]);
  let idx = idx0;
  const jour = jourParis();
  const base = async (i: Index) => ({
    rencontre: null,
    ressemblance: ressemblance(i.moi, i.pas),
    amis: i.amis.length,
    avant: [] as EtatRencontre["avant"],
    membreAujourdhui: i.membreJour === jour,
    ouvert: Boolean(i.ouvert),
    amisListe: await amisDe(supabase, i),
    discussionsRestantes: Math.max(0, AMIS_PAR_JOUR - discussionsDuJour(i)),
  });
  if (!carte || !reponsesValides(carte.reponses)) return { ...(await base(idx)), avant: await rencontresDavant(supabase, idx, ""), besoinCarte: true };

  // UN AMI QUI VIENT DE FAIRE SA CARTE, et qu'il n'a jamais rencontré : leur discussion, tout de suite (« dès qu'il a
  // créé son compte, la prochaine conversation sera entre eux deux ») — elle ne compte pas dans ses discussions du jour
  let nouvelle: RencontreVue | undefined;
  for (const a of idx.amis) {
    if (dernierJour(idx, `h:${a}`)) continue;
    const gA = await lire<Gardee>(supabase, cheminCarte(a));
    if (!gA || !reponsesValides(gA.reponses)) continue;
    const { f, idxApres } = await creerConversation(supabase, habitant, carte, idx, { habitant: a }, null, { quoi: "ami" });
    idx = idxApres;
    nouvelle = await vueDe(supabase, f, habitant.id);
    break;
  }

  const deJour = [...idx.liste].reverse().find((x) => x.jour === jour && x.quoi !== "ami");
  if (deJour) {
    const f = await lire<Fichier>(supabase, cheminRencontre(deJour.id));
    if (f && !f.signale_le && participe(f, habitant.id)) return { ...(await base(idx)), avant: await rencontresDavant(supabase, idx, f.id), rencontre: await vueDe(supabase, f, habitant.id), ...(nouvelle ? { nouvelle } : {}) };
    if (f?.signale_le) return { ...(await base(idx)), avant: await rencontresDavant(supabase, idx, f.id), retiree: true, ...(nouvelle ? { nouvelle } : {}) };
  }

  // AVEC QUI : la toute première, Pablito ; sinon le genre vu il y a le plus longtemps
  const duJour = idx.liste.filter((x) => x.quoi !== "ami");
  const vuLe = (prefixe: string) => duJour.filter((x) => x.avec.startsWith(prefixe)).reduce((m, x) => (x.jour > m ? x.jour : m), "");
  let b: Cote;
  let commerce: CommerceInfo | null = null;
  let membre = false;
  if (!duJour.length) b = { personnage: "pablito" };
  else {
    const membreDispo = idx.ouvert && idx.membreJour !== jour ? await trouverMembre(supabase, habitant, idx, jour) : null;
    const possibles = await commercesPossibles(supabase, habitant);
    commerce = [...possibles].sort((x, y) => dernierJour(idx, `c:${x.slug}`).localeCompare(dernierJour(idx, `c:${y.slug}`)))[0] ?? null;
    // le personnage qu'il a vu il y a le plus longtemps (ou jamais), de préférence un qui partage ses goûts
    const perso = choisirPersonnage((cle) => dernierJour(idx, `p:${cle}`), carte.gouts, habitant.id);
    const genres = [
      { g: "membre", ok: Boolean(membreDispo), le: vuLe("h:") },
      { g: "commerce", ok: Boolean(commerce), le: vuLe("c:") },
      { g: "personnage", ok: true, le: vuLe("p:") },
    ].filter((x) => x.ok);
    const g = genres.sort((x, y) => x.le.localeCompare(y.le))[0].g;
    if (g === "membre" && membreDispo) {
      b = { habitant: membreDispo };
      membre = true;
    } else if (g === "commerce" && commerce) b = { commerce: commerce.slug };
    else b = { personnage: perso.cle };
    if (!("commerce" in b)) commerce = null;
    // OUVERT AUX MEMBRES : les deux sortent de la file s'ils se rencontrent ; sinon, il y attend qu'on le rencontre
    if (membre || (idx.ouvert && idx.membreJour !== jour)) await mettreAJourLaFile(supabase, habitant, membre ? membreDispo : null);
  }

  const { f, idxApres } = await creerConversation(supabase, habitant, carte, idx, b, commerce, { membre, quoi: "jour" });
  return { ...(await base(idxApres)), avant: await rencontresDavant(supabase, idxApres, f.id), rencontre: await vueDe(supabase, f, habitant.id), ...(nouvelle ? { nouvelle } : {}) };
}

/**
 * 👯 DISCUTER AVEC UN AMI OU UN PROCHE (« les amis qu'on invite ou les proches avec qui on peut lancer des discussions
 * entre figurines ») : quand il veut, `AMIS_PAR_JOUR` par jour ; l'ami doit avoir fait sa carte. `n` : sa place dans
 * sa liste d'amis (la page ne voit pas son identifiant).
 */
export async function discuterAvecUnAmi(supabase: Supabase, habitant: Habitant, n: unknown): Promise<{ rencontre?: RencontreVue; restantes?: number; error?: string; statut?: number }> {
  const [carte, idx] = await Promise.all([lire<Gardee>(supabase, cheminCarte(habitant.id)), indexDe(supabase, habitant.id)]);
  if (!carte || !reponsesValides(carte.reponses)) return { error: "Fais d’abord ta carte de personnage.", statut: 400 };
  const k = Number(n);
  const ami = Number.isInteger(k) ? idx.amis[k] : undefined;
  if (!ami) return { error: "Cet ami n’est plus dans ta liste.", statut: 404 };
  const faites = discussionsDuJour(idx);
  if (faites >= AMIS_PAR_JOUR) return { error: `${AMIS_PAR_JOUR} discussions par jour : reviens demain !`, statut: 429 };
  const gAmi = await lire<Gardee>(supabase, cheminCarte(ami));
  if (!gAmi || !reponsesValides(gAmi.reponses)) return { error: "Ton ami n’a pas encore fait sa carte : dès qu’il l’aura faite, vos figurines pourront discuter.", statut: 409 };
  const jour = jourParis();
  const { f } = await creerConversation(supabase, habitant, carte, { ...idx, discussions: { jour, n: faites + 1 } }, { habitant: ami }, null, { quoi: "ami" });
  return { rencontre: await vueDe(supabase, f, habitant.id), restantes: AMIS_PAR_JOUR - faites - 1 };
}

/**
 * 🗨️ « ET TOI ? » — sa réponse à la question de fin : gardée dans la rencontre, et dans ce qu'il a dit de lui (les 8
 * dernières) — les conversations suivantes s'en servent. Pas de numéro, d'adresse ni de lien, pas de mot interdit.
 */
export async function repondre(supabase: Supabase, habitant: Habitant, id: unknown, texte: unknown): Promise<{ rencontre?: RencontreVue; error?: string; statut?: number }> {
  const rid = s(id);
  if (!idRencontreValide(rid)) return { error: "Demande incomplète.", statut: 400 };
  const f = await lire<Fichier>(supabase, cheminRencontre(rid));
  if (!f || f.signale_le || !participe(f, habitant.id)) return { error: "Cette rencontre n’existe plus.", statut: 404 };
  const t = s(texte).replace(/\s+/g, " ");
  if (t.length > REPONSE_MAX) return { error: `${REPONSE_MAX} caractères au plus.`, statut: 400 };
  const refus = impressionRefusee(t) ?? (motInterdit(t) ? "Ce mot n’a pas sa place ici." : null);
  if (refus) return { error: refus, statut: 400 };
  const apres: Fichier = { ...f, reponses: { ...(f.reponses ?? {}), [habitant.id]: { texte: t, le: new Date().toISOString() } } };
  await ecrire(supabase, cheminRencontre(rid), apres);
  const idx = await indexDe(supabase, habitant.id);
  const q = f.question || "Et toi, qu’en penses-tu ?";
  await ecrire(supabase, cheminIndex(habitant.id), { ...idx, dit: [...(idx.dit ?? []).filter((x) => x.q !== q), { q, r: t }].slice(-8) });
  return { rencontre: await vueDe(supabase, apres, habitant.id) };
}

/** LA CONVERSATION : l'IA l'écrit d'après les deux cartes ; rangée, et dans les rencontres des deux (entre clients). */
async function creerConversation(
  supabase: Supabase,
  habitant: Habitant,
  carte: Gardee,
  idx: Index,
  b: Cote,
  commerce: CommerceInfo | null,
  o: { membre?: boolean; quoi?: "jour" | "ami" } = {},
): Promise<{ f: Fichier; idxApres: Index }> {
  const membre = Boolean(o.membre);
  const jour = jourParis();
  const prenomA = await prenomDe(supabase, habitant);
  const portraitA = portraitClient("A", prenomA, carte, idx);
  // LE FORMAT DU JOUR : pas un des derniers, de préférence un qui lui ressemble (« sinon on va se lasser »)
  const format = choisirFormat(idx.formats ?? [], caracteristiques(carte.reponses, PROGRES_VIDE, carte.gouts), `${habitant.id}|${jour}|${idx.liste.length}`);
  let autre: { prenom: string; carte: Gardee } | CommerceInfo | Personnage;
  let portraitB: string[];
  if ("personnage" in b) {
    const p = personnageDe(b.personnage) ?? PERSONNAGES[0];
    autre = p;
    portraitB = portraitPersonnage(p);
  } else if ("habitant" in b) {
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
  const ia = await ecrireConversation(consigneConversation(portraitA, portraitB, { inconnus: membre || "personnage" in b, format }));
  const locale = conversationLocale(prenomA, carte, autre, format);
  const ecrite = ia ?? locale;
  const f: Fichier = {
    id: nouvelId(),
    jour,
    le: new Date().toISOString(),
    a: { habitant: habitant.id },
    b,
    repliques: ecrite.repliques,
    reactions: {},
    par: ia ? "ia" : "local",
    ...(membre ? { membre: true } : {}),
    // (l'IA a oublié son titre, son partage ou sa question : ceux de la page)
    titre: ecrite.titre || locale.titre,
    partage: ecrite.partage.length ? ecrite.partage : locale.partage,
    question: ecrite.question || locale.question,
    format: format.cle,
    ...(o.quoi === "ami" ? { quoi: "ami" as const } : {}),
  };
  await ecrire(supabase, cheminRencontre(f.id), f);
  const entree = { id: f.id, jour, avec: cleAvec(b), ...(o.quoi === "ami" ? { quoi: "ami" as const } : {}) };
  const idxApres: Index = { ...idx, liste: [...idx.liste, entree].slice(-120), formats: [...(idx.formats ?? []), format.cle].slice(-10), ...(membre ? { membreJour: jour } : {}) };
  await ecrire(supabase, cheminIndex(habitant.id), idxApres);
  // ENTRE DEUX CLIENTS : la même rencontre, chez l'autre aussi
  if ("habitant" in b) {
    const idxB = await indexDe(supabase, b.habitant);
    await ecrire(supabase, cheminIndex(b.habitant), {
      ...idxB,
      liste: [...idxB.liste, { id: f.id, jour, avec: `h:${habitant.id}`, ...(o.quoi === "ami" ? { quoi: "ami" as const } : {}) }].slice(-120),
      formats: [...(idxB.formats ?? []), format.cle].slice(-10),
      ...(membre ? { membreJour: jour } : {}),
    });
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

/** Le membre qu'on lui présente : celui qui attend depuis le plus longtemps, s'il peut le rencontrer (sinon `null`). */
async function trouverMembre(supabase: Supabase, habitant: Habitant, idx: Index, jour: string): Promise<string | null> {
  const file = (await lire<File>(supabase, cheminFile(habitant.villeSlug))) ?? { liste: [] };
  const ilYa14 = jourParis(new Date(Date.now() - 14 * 86_400_000));
  const bloques = new Set(idx.bloques ?? []);
  for (const x of [...file.liste].sort((a, b) => a.le.localeCompare(b.le))) {
    if (x.h === habitant.id || bloques.has(x.h) || dernierJour(idx, `h:${x.h}`) > ilYa14) continue;
    const [gX, idxX] = await Promise.all([lire<Gardee>(supabase, cheminCarte(x.h)), indexDe(supabase, x.h)]);
    if (!gX || !reponsesValides(gX.reponses) || !idxX.ouvert || idxX.membreJour === jour || (idxX.bloques ?? []).includes(habitant.id)) continue;
    return x.h;
  }
  return null;
}

/** La file après son passage : `choisi` (rencontré) et lui en sortent ; personne de rencontré, il y entre (ou y garde sa place). */
async function mettreAJourLaFile(supabase: Supabase, habitant: Habitant, choisi: string | null): Promise<void> {
  const chemin = cheminFile(habitant.villeSlug);
  const file = (await lire<File>(supabase, chemin)) ?? { liste: [] };
  const sienne = file.liste.find((x) => x.h === habitant.id);
  const autres = file.liste.filter((x) => x.h !== habitant.id && x.h !== choisi);
  await ecrire(supabase, chemin, { liste: [...autres, ...(choisi ? [] : [sienne ?? { h: habitant.id, le: new Date().toISOString() }])].slice(-500) });
}

export async function rencontrerUnMembre(supabase: Supabase, habitant: Habitant): Promise<{ rencontre?: RencontreVue; attente?: boolean; error?: string; statut?: number }> {
  const [carte, idx] = await Promise.all([lire<Gardee>(supabase, cheminCarte(habitant.id)), indexDe(supabase, habitant.id)]);
  if (!carte || !reponsesValides(carte.reponses)) return { error: "Fais d’abord ta carte de personnage.", statut: 400 };
  const jour = jourParis();
  if (idx.membreJour === jour) return { error: "Une rencontre de membre par jour : reviens demain !", statut: 429 };
  const choisi = await trouverMembre(supabase, habitant, idx, jour);
  // il entre dans la file (ou y reste), et il est « ouvert » aux rencontres
  await mettreAJourLaFile(supabase, habitant, choisi);
  if (!choisi) {
    await ecrire(supabase, cheminIndex(habitant.id), { ...idx, ouvert: true });
    return { attente: true };
  }
  const { f } = await creerConversation(supabase, habitant, carte, { ...idx, ouvert: true }, { habitant: choisi }, null, { membre: true, quoi: "jour" });
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

/**
 * 💬 ÉCHANGER SES IMPRESSIONS (« si vous êtes d'accord ») : chacun dit oui (ou retire son oui) ; tant que les deux
 * n'ont pas dit oui, rien ne s'écrit. Entre deux clients seulement.
 */
export async function vouloirEchanger(supabase: Supabase, habitant: Habitant, id: unknown, oui: boolean): Promise<{ rencontre?: RencontreVue; error?: string }> {
  const rid = s(id);
  if (!idRencontreValide(rid)) return { error: "Demande incomplète." };
  const f = await lire<Fichier>(supabase, cheminRencontre(rid));
  if (!f || f.signale_le || !participe(f, habitant.id) || !("habitant" in f.b)) return { error: "Cette rencontre n’existe plus." };
  const avant = f.echange ?? { oui: [], messages: [] };
  const liste = oui ? [...new Set([...avant.oui, habitant.id])] : avant.oui.filter((x) => x !== habitant.id);
  const apres: Fichier = { ...f, echange: { ...avant, oui: liste } };
  await ecrire(supabase, cheminRencontre(rid), apres);
  return { rencontre: await vueDe(supabase, apres, habitant.id) };
}

/** Une impression (les deux ont dit oui) : relue (pas de numéro, d'adresse, de lien, de mot interdit), 20 au plus chacun. */
export async function ecrireImpression(supabase: Supabase, habitant: Habitant, id: unknown, texte: unknown): Promise<{ rencontre?: RencontreVue; error?: string; statut?: number }> {
  const rid = s(id);
  if (!idRencontreValide(rid)) return { error: "Demande incomplète.", statut: 400 };
  const f = await lire<Fichier>(supabase, cheminRencontre(rid));
  if (!f || f.signale_le || !participe(f, habitant.id) || !("habitant" in f.b)) return { error: "Cette rencontre n’existe plus.", statut: 404 };
  const e = f.echange ?? { oui: [], messages: [] };
  if (!e.oui.includes(habitant.id) || !e.oui.includes(autreDe(f, habitant.id))) return { error: "Vous devez être d’accord tous les deux pour échanger.", statut: 403 };
  const t = s(texte).replace(/\s+/g, " ");
  const refus = impressionRefusee(t) ?? (motInterdit(t) ? "Ce mot n’a pas sa place ici." : null);
  if (refus) return { error: refus, statut: 400 };
  if (e.messages.filter((m) => m.de === habitant.id).length >= IMPRESSIONS_MAX) return { error: "Vous vous êtes déjà beaucoup écrit sur cette rencontre !", statut: 429 };
  const apres: Fichier = { ...f, echange: { ...e, messages: [...e.messages, { de: habitant.id, texte: t, le: new Date().toISOString() }] } };
  await ecrire(supabase, cheminRencontre(rid), apres);
  return { rencontre: await vueDe(supabase, apres, habitant.id) };
}

/**
 * 🎞️ SES CARTES SOUVENIRS — une par rencontre (celles d'avant le 5 novembre aussi : leur titre est alors « Rencontre
 * avec … »), les plus récentes d'abord ; sans les rencontres signalées. Pour l'album.
 */
export async function souvenirsDe(supabase: Supabase, habitant: Habitant): Promise<Souvenir[]> {
  const idx = await indexDe(supabase, habitant.id);
  const l = idx.liste.slice(-24).reverse();
  const r = await Promise.all(
    l.map(async (x): Promise<Souvenir | null> => {
      const f = await lire<Fichier>(supabase, cheminRencontre(x.id)).catch(() => null);
      if (!f || f.signale_le || !participe(f, habitant.id)) return null;
      const p = await participant(supabase, f.a.habitant === habitant.id ? f.b : f.a, 6 * 3600);
      const avec = p.type === "client" ? p.prenom || "un ami" : p.nom;
      return {
        id: f.id,
        jour: f.jour,
        avec,
        titre: f.titre || `Rencontre avec ${avec}`,
        image: p.image,
        figurine: p.type === "client" ? p.figurine : p.type === "commerce" ? !p.image.startsWith("/direct/double/") : Boolean(p.image),
        ...(p.type === "personnage" ? { emoji: p.emoji } : {}),
      };
    }),
  );
  return r.filter((x): x is Souvenir => Boolean(x));
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
