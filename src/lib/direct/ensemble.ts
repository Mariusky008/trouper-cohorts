// 🤝 ENSEMBLE — ce qu'on attend de moi, et les conversations où je suis.
//
// « Cette page remplace "Mes propositions". […] "À toi de jouer" : afficher
// uniquement des actions réelles en attente. […] Ces cartes renvoient aux
// conversations ou contenus existants ; elles ne constituent pas une seconde
// messagerie. Leur état doit être synchronisé avec l'échange concerné. »
//
// TOUT SE LIT DANS LES SALONS, RIEN N'EST STOCKÉ ICI. Une carte « Donner mon
// avis » existe parce que le vote du salon attend ma voix ; dès que j'ai voté,
// elle n'existe plus — il n'y a pas d'état à tenir à jour, donc pas d'état qui
// puisse mentir.
//
// FICHIER PARTAGÉ : aucune dépendance au navigateur. Il se vérifie seul.
import { demandeDuFil, enTete, etatDuSalon, type Salon } from "@/lib/direct/salons";

export type Attente = {
  /** Le salon à ouvrir. */
  cle: string;
  genre: "avis" | "proposition" | "reponse" | "presse";
  /** Qui attend (son prénom), pour l'avatar. */
  qui: string;
  titre: string;
  contexte: string;
  /** Le geste, en mots précis : « Donner mon avis », « Voir sa proposition ». */
  libelle: string;
  /** Les images de ce qu'on départage, quand il y en a. */
  photos?: string[];
};

export type Discussion = {
  cle: string;
  titre: string;
  /** Les autres, dans l'ordre où ils sont entrés — moi exclu. */
  avec: string[];
  /** « Léa, Karim et toi ». */
  qui: string;
  dernier?: { qui: string; texte: string; moi: boolean };
  /** Millisecondes de la dernière activité, si on la connaît. */
  activite?: number;
  /** « Samedi dernier », pour une conversation terminée qui n'a pas d'heure. */
  jour?: string;
  nonLus: number;
  ouvert: boolean;
  archive: boolean;
  photo?: string;
  /** Une demande de table envoyée — jamais une confirmation : voir `etatDeLaTable`. */
  table?: string;
};

type CestMoi = (qui: string) => boolean;

const dans = (s: Salon, cestMoi: CestMoi) => s.presents.some(cestMoi) || cestMoi(s.parQui);

/**
 * CE QU'ON ATTEND DE MOI, salon par salon — une carte au plus par salon, la
 * plus précise. L'ordre des tests est celui de ce qui presse.
 */
export function aToiDeJouer(
  salons: Record<string, Salon>,
  cestMoi: CestMoi,
  lus: Record<string, number>,
  /** Mon prénom, tel que les salons l'écrivent (« Vous » sans prénom). */
  moi = "Vous",
): Attente[] {
  const out: Attente[] = [];
  for (const s of Object.values(salons)) {
    if (!s.ouvert || !dans(s, cestMoi)) continue;
    const vu = lus[s.cle] ?? 0;

    // ① LE COMMERÇANT A RÉPONDU — une vraie réponse, jamais la carte de ce
    //    qu'il reçoit (`pro`), qui n'est pas une réponse. Non lue seulement.
    const ir = s.messages.findIndex((m, i) => i >= vu && m.carte?.reponse);
    if (ir >= 0) {
      const m = s.messages[ir];
      out.push({
        cle: s.cle,
        genre: "reponse",
        qui: m.qui,
        titre: `${m.qui} a répondu`,
        contexte: "À votre demande",
        libelle: "Lire la réponse",
      });
      continue;
    }

    // ② LA TABLE VA MANQUER — l'arbitre du salon le dit déjà ; on le répète ici.
    const etat = etatDuSalon(s, moi, lus);
    if (etat.ton === "presse") {
      out.push({
        cle: s.cle,
        genre: "presse",
        qui: s.parQui,
        titre: etat.phrase,
        contexte: s.sujet,
        libelle: etat.action?.libelle ?? "Voir la discussion",
      });
      continue;
    }

    // ③ UN AMI DEMANDE UN AVIS : un vote ouvert par un autre, où je n'ai pas voté.
    if (s.vote && !s.vote.monVote && !s.vote.choisi && !cestMoi(s.parQui)) {
      out.push({
        cle: s.cle,
        genre: "avis",
        qui: s.parQui,
        titre: `${s.parQui} hésite`,
        contexte: s.vote.question,
        libelle: "Donner mon avis",
        photos: s.vote.options.map((o) => o.photo).filter((p): p is string => Boolean(p)).slice(0, 2),
      });
      continue;
    }

    // ④ UNE IDÉE ATTEND MA RÉPONSE : quelqu'un d'autre a proposé, et je ne
    //    soutiens encore aucune proposition — sans demande partie.
    const propos = s.propositions ?? [];
    const jeSoutiens = propos.some((p) => p.voix.some(cestMoi));
    const autre = [...propos].reverse().find((p) => !cestMoi(p.par));
    if (autre && !jeSoutiens && !demandeDuFil(s) && propos.length >= (cestMoi(s.parQui) ? 2 : 1)) {
      out.push({
        cle: s.cle,
        genre: "proposition",
        qui: autre.par,
        titre: `${autre.par} propose une ${propos.length > 1 ? "autre " : ""}idée`,
        contexte: `${s.sujet} · ${autre.quoi}`,
        libelle: "Voir sa proposition",
        photos: autre.photo ? [autre.photo] : undefined,
      });
    }
  }
  const rang: Record<Attente["genre"], number> = { reponse: 4, presse: 3, avis: 2, proposition: 1 };
  return out.sort((a, b) => rang[b.genre] - rang[a.genre]);
}

/**
 * LA DEMANDE DE TABLE, DITE POUR CE QU'ELLE EST. « Personne intéressée »,
 * « demande envoyée » et « réservation confirmée » ne se confondent pas : sans
 * réponse du commerçant, ce n'est JAMAIS confirmé.
 */
export function etatDeLaTable(s: Salon): string | undefined {
  const d = demandeDuFil(s);
  if (!d) return undefined;
  const confirme = s.messages.some((m) => m.carte?.reponse && /confirm|réserv/i.test(`${m.carte.titre} ${m.carte.detail}`));
  return confirme ? `Table confirmée pour ${d.combien}` : `Demande envoyée pour ${d.combien}`;
}

/** « Léa, Karim et toi ». */
function quiEnMots(avec: string[]): string {
  if (!avec.length) return "Toi seul pour l'instant";
  const tete = avec.slice(0, 3);
  const reste = avec.length - tete.length;
  return `${tete.join(", ")}${reste > 0 ? ` +${reste}` : ""} et toi`;
}

/**
 * MES CONVERSATIONS — celles où je suis, les plus récentes d'abord. Les
 * conversations terminées et celles que j'ai rangées vont dans les archives :
 * rien n'est effacé.
 */
export function nosDiscussions(
  salons: Record<string, Salon>,
  cestMoi: CestMoi,
  lus: Record<string, number>,
): { actives: Discussion[]; archives: Discussion[] } {
  const toutes: Discussion[] = Object.values(salons)
    .filter((s) => dans(s, cestMoi))
    .map((s) => {
      const avec = [...new Set([s.parQui, ...s.presents])].filter((q) => !cestMoi(q));
      const m = [...s.messages].reverse().find((x) => x.voix !== "systeme" || x.carte);
      const vu = lus[s.cle] ?? 0;
      // LES MIENS NE SONT PAS « NON LUS » : je les ai écrits.
      const nonLus = s.ouvert ? s.messages.slice(vu).filter((x) => x.voix !== "moi").length : 0;
      return {
        cle: s.cle,
        titre: s.sujet,
        avec,
        qui: quiEnMots(avec),
        dernier: m
          ? {
              qui: cestMoi(m.qui) ? "Toi" : m.qui,
              texte: m.texte || m.carte?.titre || "",
              moi: m.voix === "moi",
            }
          : undefined,
        activite: s.activite,
        jour: s.jour,
        nonLus,
        ouvert: s.ouvert,
        archive: Boolean(s.archive) || !s.ouvert,
        photo: s.photo ?? enTete(s)?.photo,
        table: etatDeLaTable(s),
      };
    });
  const recent = (a: Discussion, b: Discussion) => (b.activite ?? 0) - (a.activite ?? 0);
  return {
    actives: toutes.filter((d) => !d.archive).sort(recent),
    archives: toutes.filter((d) => d.archive).sort(recent),
  };
}

/** « À l'instant », « Il y a 20 min », « Il y a 3 h », « Hier », « Lundi ». */
export function ilYa(t: number | undefined, maintenant = Date.now()): string {
  if (!t) return "";
  const min = Math.round((maintenant - t) / 60_000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  if (h < 48) return "Hier";
  return new Date(t).toLocaleDateString("fr-FR", { weekday: "long" }).replace(/^./, (c) => c.toUpperCase());
}
