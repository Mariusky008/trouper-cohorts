// 🎙️ LA VOIX DU DOUBLE — la même que celle de son récit, en conversation.
//
// « La voix est très métallique et robotique, peux-tu mettre une voix
// naturelle et spontanée ? »
//
// ═══ CE QU'ELLE ACCEPTE DE DIRE ════════════════════════════════════════════
//
// TROIS SORTES DE PHRASES, ET AUCUNE N'EST LIBRE :
//
//   · « accueil » — le bonjour ; le serveur l'écrit lui-même à partir du
//     prénom, borné à quarante signes ;
//   · « confirmation » — la table demandée ; écrite ici aussi ;
//   · « reponse » — ce que le double vient de répondre, SEULEMENT avec le
//     sceau que la route du double y a posé. Voir `sceau-voix.ts`.
//
// Sans ça, n'importe qui pourrait faire lire son courrier à nos frais.
//
// ═══ SANS VOIX CLOUD ═══════════════════════════════════════════════════════
//
// 503, et l'écran retombe sur la voix du téléphone. La conversation marche
// partout ; elle est seulement plus vivante là où la clé existe.
import { NextResponse } from "next/server";
import { accueilDuDouble, confirmationDuDouble, phrasesADire, seuilDuDouble } from "@/lib/direct/double-chef";
import { trouverLeCommerce } from "@/lib/direct/double-commerce";
import { compterSignes, voixAutorisee } from "@/lib/direct/voix-clonee";
import { faireParler, JEU_CONVERSATION, voixCloudConfiguree } from "@/lib/direct/timbres";
import { sceauValide } from "@/lib/direct/sceau-voix";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Les pictogrammes ne se prononcent pas : une voix qui dit « visage souriant » casse tout. */
const propre = (t: string) =>
  t
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2022}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * LES PHRASES QUI REVIENNENT, GARDÉES EN MÉMOIRE.
 *
 * Le bonjour et la confirmation sont les mêmes pour tout le monde — ou presque,
 * au prénom près. Les refaire synthétiser à chaque ouverture, c'est payer cent
 * fois la même seconde de voix. Soixante phrases au plus : au-delà, on oublie
 * les plus anciennes.
 */
const memoire = new Map<string, ArrayBuffer>();
const garder = (cle: string, son: ArrayBuffer) => {
  memoire.set(cle, son);
  if (memoire.size > 60) memoire.delete(memoire.keys().next().value as string);
};

type Demande = { id?: unknown; quoi?: unknown; prenom?: unknown; texte?: unknown; sig?: unknown; partie?: unknown };

/**
 * LA PHRASE À DIRE, OU LA RAISON DE REFUSER — et AVEC QUELLE VOIX.
 *
 * Les deux portes — POST d'un bloc, GET au fil de l'eau — passent par ici :
 * une garde écrite deux fois finit toujours par n'être tenue qu'une fois.
 *
 * LA VOIX DU COMMERÇANT, S'IL L'A DONNÉE, ET TANT QUE LE MOIS LE PERMET. Au-delà
 * du plafond, son double reprend la voix standard : il change de timbre, il ne
 * se tait pas. Voir `voix-clonee.ts`.
 */
type Phrase = { id: string; texte: string; fixe: boolean; voixClonee?: string; siteId?: string; voixParDefaut?: string };

async function phraseDe(corps: Demande): Promise<Phrase | NextResponse> {
  if (!voixCloudConfiguree()) return NextResponse.json({ erreur: "Voix cloud non configurée." }, { status: 503 });
  const commerce = await trouverLeCommerce(s(corps.id));
  if (!commerce) return NextResponse.json({ erreur: "Commerce inconnu." }, { status: 404 });
  const fiche = commerce.fiche;
  const quoi = s(corps.quoi);
  let texte = "";
  if (quoi === "accueil") texte = accueilDuDouble(fiche, s(corps.prenom).slice(0, 40));
  else if (quoi === "confirmation") texte = confirmationDuDouble(fiche);
  // LE SEUIL : la phrase qu'il dit quand on franchit sa porte, écrite ICI à
  // partir de ses vraies données — voir `seuilDuDouble`.
  else if (quoi === "seuil") texte = seuilDuDouble(commerce.carte);
  else if (quoi === "reponse") {
    const t = s(corps.texte);
    if (t.length > 700 || !sceauValide(fiche.id, t, s(corps.sig))) {
      return NextResponse.json({ erreur: "Phrase non reconnue." }, { status: 403 });
    }
    texte = t;
  }
  /* UNE PHRASE DE LA RÉPONSE, si on en demande une — découpée ICI, sur le
     texte scellé : voir `phrasesADire`. */
  const n = Number(corps.partie);
  if (corps.partie != null && corps.partie !== "") {
    const parties = phrasesADire(texte);
    if (!Number.isInteger(n) || n < 0 || n >= parties.length) {
      return NextResponse.json({ erreur: "Phrase inconnue." }, { status: 400 });
    }
    texte = parties[n];
  }
  texte = propre(texte);
  if (!texte) return NextResponse.json({ erreur: "Rien à dire." }, { status: 400 });
  let voixClonee = commerce.voixClonee;
  if (voixClonee && commerce.siteId && !(await voixAutorisee(commerce.siteId, texte.length))) voixClonee = undefined;
  /* UNE VOIX DE FEMME QUAND LE COMMERCE SE PRÉSENTE AU FÉMININ — « Une
     fleuriste du marché », « Une prothésiste ongulaire » : la démonstration
     l'écrit, le double ne doit pas lui répondre avec une voix d'homme. Les
     autres gardent le timbre standard, jusqu'à ce qu'ils donnent le leur. */
  const voixParDefaut = /^une\s/i.test(commerce.carte.nom) ? "coral" : undefined;
  return { id: fiche.id, texte, fixe: quoi !== "reponse", voixClonee, siteId: commerce.siteId, voixParDefaut };
}

/* « LES VOIX SONT LENTES. » UN COMPTOIR NE PARLE PAS AU RYTHME D'UN RÉCIT :
   la conversation passe de 1,04 à 1,12, la vitesse d'une réponse du tac au
   tac. Le récit du parcours garde son pas posé — voir `api/direct/voix`. */
const JEU = { jeu: JEU_CONVERSATION, vitesse: 1.12, spontane: true };
const cleMemoire = (p: Phrase) => `${p.id}\n${p.voixClonee ?? ""}\n${p.texte}`;
/** Seule SA voix se compte : c'est elle qui se paie au signe. */
const compter = (p: Phrase) => {
  if (p.voixClonee && p.siteId) void compterSignes(p.siteId, p.texte.length);
};

/**
 * PAR ADRESSE — pour un simple lecteur audio (« Écouter mon double » dans
 * l'Espace Pro). Le son part ENTIER, avec sa longueur : Safari refuse de
 * lire un son dont il ne connaît pas la taille, et c'est ce qui rendait la
 * voix robotique sur iPhone et sur Mac.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  return repondre({ id: q.get("id"), quoi: q.get("quoi"), prenom: q.get("prenom"), texte: q.get("texte"), sig: q.get("sig"), partie: q.get("partie") });
}

/** La porte de l'écran du double : une phrase à la fois, chacune un fichier entier. */
export async function POST(req: Request) {
  let corps: Demande;
  try {
    corps = (await req.json()) as Demande;
  } catch {
    return NextResponse.json({ erreur: "Requête illisible." }, { status: 400 });
  }
  return repondre(corps);
}

async function repondre(corps: Demande) {
  const p = await phraseDe(corps);
  if (p instanceof NextResponse) return p;

  const son = (buf: ArrayBuffer) =>
    new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Content-Length": String(buf.byteLength), "Cache-Control": "private, max-age=86400" },
    });

  const cle = cleMemoire(p);
  const deja = memoire.get(cle);
  if (deja) return son(deja);

  /* UN PEU PLUS VIF QUE LE RÉCIT : il répond, il ne raconte pas. */
  const r = await faireParler(p.id, p.texte, { ...JEU, voixClonee: p.voixClonee, voixParDefaut: p.voixParDefaut });
  if (!r.ok) {
    console.info("[double/voix] synthèse impossible", r.statut, r.erreur);
    return NextResponse.json({ erreur: r.erreur }, { status: r.statut });
  }
  compter(p);
  if (p.fixe) garder(cle, r.son);
  /* LA LONGUEUR EST DITE : c'est ce que Safari attend pour lire un son. */
  return son(r.son);
}
