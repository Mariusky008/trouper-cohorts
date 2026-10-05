/**
 * 🤝 UNE CONVERSATION PARTAGÉE, REJOUÉE GESTE APRÈS GESTE.
 *
 * « Une conversation ne réunit que les gens qui ont reçu le lien » — et même
 * eux ne voyaient rien : chaque téléphone gardait sa copie. Dans la vraie ville
 * (`/ville/<ville>`), une conversation vit sur le serveur sous la forme d'un
 * POINT DE DÉPART (`BaseConversation`) et d'une SUITE DE GESTES (`Geste`) ;
 * chaque téléphone la rejoue ici pour retrouver exactement le même salon que
 * les autres. Voir la migration `20261005120000_conversations_partagees.sql`.
 *
 * POURQUOI DES GESTES ET PAS L'ÉTAT. Deux amis qui votent dans la même
 * seconde, avec l'état entier, l'un efface l'autre. Avec des gestes, les deux
 * voix sont là, l'une après l'autre. Et ce que la conversation dit de MOI —
 * « ma » réaction, « mon » vote — se déduit de mes gestes, sans rien stocker.
 *
 * LES RÈGLES SONT CELLES DE `salons.ts`, recopiées geste par geste :
 * `proposer` retire ma voix des autres idées, `voix` la déplace, une réaction
 * se bascule, un seul vote par personne. Le téléphone applique d'abord le
 * geste chez lui (l'écran répond tout de suite), puis le serveur le confirme
 * au prochain rejeu.
 *
 * FICHIER PARTAGÉ : aucune dépendance au navigateur.
 */
import { heureCourte, type MessageSalon, type Proposition, type Salon } from "@/lib/direct/salons";

/** Le point de départ : tout le salon sauf ce que les gestes construisent. */
export type BaseConversation = Omit<Salon, "messages" | "viennent" | "presents" | "ouvert" | "archive" | "activite" | "ilYa">;

/** Ce qu'une personne fait dans une conversation. */
export type Geste =
  | { type: "ecrire"; texte: string; photo?: string; carte?: MessageSalon["carte"]; systeme?: boolean }
  | { type: "tete"; texte: string }
  | { type: "proposer"; p: Omit<Proposition, "voix"> }
  | { type: "voix"; propo: string }
  | { type: "venue" }
  | { type: "entrer"; vient: boolean }
  | { type: "reagir"; message: string; emoji: string }
  | { type: "voter"; option: string }
  | { type: "visibilite"; prive: boolean };

/** Un geste tel que le serveur le rend : qui, quand, et si c'est moi. */
export type GesteLu = {
  id: number;
  qui: string;
  /**
   * QUI, SANS LE NOMMER : une empreinte de l'habitant, la même pour tous ses
   * gestes. Deux Marie dans la même conversation ne partagent pas leur vote.
   */
  auteur: string;
  moi: boolean;
  quand: string;
  geste: Geste;
};

const TETE = "🏆 ";
const MOI = "\u0000moi";

/**
 * REJOUER UNE CONVERSATION. `moiNom` remplace mon prénom tel que je l'avais
 * donné par celui que l'écran reconnaît (`cestMoi`) — « Vous » si je n'en ai
 * pas : mes messages restent les miens même si j'ai changé de prénom.
 */
export function rejouer(
  cle: string,
  base: BaseConversation,
  gestes: GesteLu[],
  o: { createurMoi: boolean; moiNom: string },
): Salon {
  const nom = (g: GesteLu) => (g.moi ? o.moiNom : g.qui || "Un ami");
  const createur = o.createurMoi ? o.moiNom : base.parQui && base.parQui !== "Vous" ? base.parQui : "Un ami";
  const avecCreateur = (liste: string[]) => liste.map((q) => (q === base.parQui ? createur : q));

  let s: Salon = {
    ...base,
    cle,
    parQui: createur,
    viennent: [createur],
    presents: [createur],
    messages: [],
    ouvert: true,
    propositions: (base.propositions ?? []).map((p) => ({ ...p, par: p.par === base.parQui ? createur : p.par, voix: avecCreateur(p.voix) })),
  };
  // QUI A MIS QUELLE RÉACTION, QUI A VOTÉ QUOI — une seule par personne,
  // reconnue à son empreinte (et « moi » pour les miennes).
  const cleDe = (g: GesteLu) => (g.moi ? MOI : g.auteur || g.qui);
  const reactions = new Map<string, Map<string, string>>();
  const votes = new Map<string, string>();
  let activite = 0;

  for (const g of gestes) {
    const qui = nom(g);
    const t = Date.parse(g.quand);
    if (Number.isFinite(t)) activite = Math.max(activite, t);
    // QUICONQUE FAIT UN GESTE EST LÀ.
    if (!s.presents.includes(qui)) s = { ...s, presents: [...s.presents, qui] };
    const x = g.geste;
    switch (x.type) {
      case "ecrire": {
        const m: MessageSalon = {
          id: `g${g.id}`,
          qui: x.systeme ? "Clikme" : qui,
          ...(g.auteur && !g.moi && !x.systeme ? { auteur: g.auteur } : {}),
          voix: x.systeme ? "systeme" : g.moi ? "moi" : "ami",
          texte: x.texte,
          quand: Number.isFinite(t) ? heureCourte(new Date(t)) : "",
          ...(x.photo ? { photo: x.photo } : {}),
          ...(x.carte ? { carte: x.carte } : {}),
        };
        s = { ...s, messages: [...s.messages, m] };
        break;
      }
      case "tete": {
        const dernier = s.messages[s.messages.length - 1];
        const remplace = dernier && dernier.voix === "systeme" && dernier.texte.startsWith(TETE);
        const ligne: MessageSalon = { id: remplace ? dernier.id : `g${g.id}`, qui: "Clikme", voix: "systeme", texte: x.texte, quand: Number.isFinite(t) ? heureCourte(new Date(t)) : "" };
        s = { ...s, messages: remplace ? [...s.messages.slice(0, -1), ligne] : [...s.messages, ligne] };
        break;
      }
      case "proposer": {
        const liste = s.propositions ?? [];
        if (liste.some((p) => p.cle === x.p.cle)) {
          s = { ...s, propositions: liste.map((p) => ({ ...p, voix: p.cle === x.p.cle ? [...p.voix.filter((v) => v !== qui), qui] : p.voix.filter((v) => v !== qui) })) };
        } else {
          s = { ...s, propositions: [...liste.map((p) => ({ ...p, voix: p.voix.filter((v) => v !== qui) })), { ...x.p, par: qui, voix: [qui] }] };
        }
        break;
      }
      case "voix":
        s = {
          ...s,
          propositions: (s.propositions ?? []).map((p) => ({ ...p, voix: p.cle === x.propo ? [...p.voix.filter((v) => v !== qui), qui] : p.voix.filter((v) => v !== qui) })),
        };
        break;
      case "venue":
        s = { ...s, viennent: s.viennent.includes(qui) ? s.viennent.filter((v) => v !== qui) : [...s.viennent, qui] };
        break;
      case "entrer":
        if (x.vient && !s.viennent.includes(qui)) s = { ...s, viennent: [...s.viennent, qui] };
        break;
      case "reagir": {
        const parMessage = reactions.get(x.message) ?? new Map<string, string>();
        if (parMessage.get(cleDe(g)) === x.emoji) parMessage.delete(cleDe(g));
        else parMessage.set(cleDe(g), x.emoji);
        reactions.set(x.message, parMessage);
        break;
      }
      case "voter":
        votes.set(cleDe(g), x.option);
        break;
      case "visibilite":
        // SEUL CELUI QUI L'A OUVERTE LA REND PUBLIQUE OU PRIVÉE.
        if (qui === createur) s = { ...s, prive: x.prive };
        break;
    }
  }

  // LES RÉACTIONS : un compte par emoji, et la mienne pour pouvoir la retirer.
  s = {
    ...s,
    messages: s.messages.map((m) => {
      const parMessage = reactions.get(m.id);
      if (!parMessage?.size) return m;
      const compte: Record<string, number> = {};
      for (const e of parMessage.values()) compte[e] = (compte[e] ?? 0) + 1;
      const mienne = parMessage.get(MOI);
      return { ...m, reactions: compte, ...(mienne ? { maReaction: mienne } : {}) };
    }),
  };
  // LE VOTE : les voix comptées, et la mienne.
  if (s.vote) {
    const compte = new Map<string, number>();
    for (const v of votes.values()) compte.set(v, (compte.get(v) ?? 0) + 1);
    const mien = votes.get(MOI);
    s = { ...s, vote: { ...s.vote, options: s.vote.options.map((op) => ({ ...op, voix: compte.get(op.cle) ?? 0 })), ...(mien ? { monVote: mien } : { monVote: undefined }) } };
  }
  return { ...s, ...(activite ? { activite } : {}) };
}

/** Le point de départ d'un salon qu'on vient d'ouvrir : ce que les gestes ne refont pas. */
export function baseDuSalon(s: Salon): BaseConversation {
  const {
    messages: _m,
    viennent: _v,
    presents: _p,
    ouvert: _o,
    archive: _a,
    activite: _act,
    ilYa: _i,
    ...base
  } = s;
  void _m; void _v; void _p; void _o; void _a; void _act; void _i;
  return base;
}
