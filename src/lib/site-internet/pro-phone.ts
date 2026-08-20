// QUEL NUMÉRO, POUR QUI — la seule vérité sur le sujet.
//
// Il y a DEUX questions différentes, et les confondre a déjà coûté des
// notifications parties dans le vide :
//
//   1. « Comment joint-on LE COMMERÇANT ? » — pour nos propres messages : son
//      site est en ligne, il a reçu une demande. C'est `proPhoneFrom`.
//   2. « À quel WhatsApp les HABITANTS envoient-ils leurs réservations ? » —
//      c'est `numeroReservations`, et ce n'est pas forcément le même : pendant
//      ses congés, le commerçant y met le WhatsApp d'un employé.
//
// Le remplacement ne déplace QUE le point 2. Pendant deux semaines de vacances,
// les réservations doivent arriver à qui tient la boutique ; nos messages à
// propos de son site, eux, restent pour lui — il les lira au retour.
//
// Piège découvert à l'audit : `whatsapp_phone_e164` n'est renseigné que par le
// canal « vitrines ». Pour un site issu d'une lettre, le numéro arrive par le
// formulaire « Garder ce site gratuitement » et atterrit dans `metadata.leads[]`.
// Sans ce repli, toutes les notifications au commerçant partaient dans le vide.
import { toE164 } from "./phone";
import { jourParis } from "@/lib/jour-paris";

type MaybeRow = { whatsapp_phone_e164?: unknown; metadata?: unknown; diagnostic?: unknown } | null | undefined;

/** Tout numéro français plausible — fixe compris. */
const FIXE_OU_MOBILE_FR = /^\+33[1-9]\d{8}$/;

/** Mobile français, seul format joignable par SMS (et seul accepté par la colonne). */
export const MOBILE_FR = /^\+33[67]\d{8}$/;

/** Un remplaçant pendant les congés : son numéro, son prénom, et jusqu'à quand. */
export type Relais = {
  /** E.164, mobile français. */
  numero: string;
  /** Le prénom de l'employé — affiché au commerçant, jamais à l'habitant. */
  qui: string;
  /** Dernier jour INCLUS, « AAAA-MM-JJ », à l'heure de Paris. */
  jusquau: string;
};

const meta = (row: MaybeRow): Record<string, unknown> =>
  (row?.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;

/** Le remplacement tel qu'il est enregistré — actif ou non, sans jugement. */
export function relaisEnregistre(row: MaybeRow): Relais | null {
  const r = meta(row).whatsapp_relais;
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  const numero = toE164(String(o.numero ?? "").trim());
  const jusquau = String(o.jusquau ?? "").trim();
  if (!MOBILE_FR.test(numero) || !/^\d{4}-\d{2}-\d{2}$/.test(jusquau)) return null;
  return { numero, qui: String(o.qui ?? "").trim().slice(0, 40), jusquau };
}

/**
 * Le remplacement s'il est ACTIF aujourd'hui.
 *
 * POURQUOI IL S'ÉTEINT TOUT SEUL. Un commerçant qui rentre de congés a mille
 * choses à faire avant de penser à un réglage : si le remplacement devait être
 * retiré à la main, il resterait en place des semaines, et les réservations
 * continueraient d'arriver chez quelqu'un qui n'est plus concerné. La date de
 * fin est donc obligatoire, et c'est elle qui décide — pas un bouton.
 *
 * Le jour de fin est INCLUS : « jusqu'au 30 » veut dire qu'on travaille encore
 * le 30. L'exclure ferait rater les réservations de son dernier jour.
 */
export function relaisActif(row: MaybeRow, jour = jourParis()): Relais | null {
  const r = relaisEnregistre(row);
  if (!r) return null;
  return jour <= r.jusquau ? r : null;
}

/** Le numéro que le commerce PUBLIE sur Google, normalisé. C'est celui qu'il a
 *  mis lui-même à disposition de ses clients — sa destination naturelle. */
function numeroGoogle(row: MaybeRow): string {
  const d = (row?.diagnostic && typeof row.diagnostic === "object" ? row.diagnostic : {}) as Record<string, unknown>;
  return toE164(String(d.phone ?? "").trim());
}

/** Numéro E.164 du COMMERÇANT lui-même, ou "" si on n'en a aucun. */
export function proPhoneFrom(row: MaybeRow): string {
  const direct = toE164(String(row?.whatsapp_phone_e164 ?? "").trim());
  if (MOBILE_FR.test(direct)) return direct;

  // Repli : le dernier numéro laissé dans le formulaire de rappel (c'est LUI qui
  // nous l'a donné, précisément pour qu'on le recontacte à propos de son site).
  const leads = Array.isArray(meta(row).leads) ? (meta(row).leads as unknown[]) : [];
  for (let i = leads.length - 1; i >= 0; i--) {
    const l = (leads[i] && typeof leads[i] === "object" ? leads[i] : {}) as Record<string, unknown>;
    const p = toE164(String(l.phone ?? "").trim());
    if (MOBILE_FR.test(p)) return p;
  }
  return "";
}

/**
 * Le numéro auquel les HABITANTS envoient leurs réservations.
 *
 * Tout ce qui est tourné vers l'habitant passe par ici : le bouton « Prévenir
 * le commerçant » de la confirmation, le rappel dans « Mes Clics », le QR de
 * l'affiche posée sur le comptoir. Sinon un employé de remplacement recevrait
 * les réservations de l'application mais pas celles du QR de la caisse, et
 * personne ne comprendrait pourquoi.
 */
export function numeroReservations(row: MaybeRow, jour = jourParis()): string {
  // LE NUMÉRO GOOGLE COMPTE AUSSI, quand c'est un mobile.
  //
  // LE DÉFAUT QUE ÇA CORRIGE : `whatsapp_phone_e164` n'est renseigné que si le
  // commerçant a ouvert son espace et l'a saisi. Tant qu'il ne l'a pas fait,
  // cette fonction rendait "" — et tout le parcours WhatsApp disparaissait de
  // l'écran de l'habitant, en silence. Il lisait « C'est confirmé » alors que
  // personne, nulle part, n'avait été prévenu.
  //
  // Beaucoup de petits commerces publient un mobile sur Google, précisément
  // pour qu'on les joigne. S'en servir n'est pas une intrusion : c'est
  // l'usage pour lequel ils l'ont mis là.
  const google = numeroGoogle(row);
  return relaisActif(row, jour)?.numero || proPhoneFrom(row) || (MOBILE_FR.test(google) ? google : "");
}

/**
 * LE NUMÉRO À APPELER, quand WhatsApp n'est pas possible.
 *
 * Un restaurant publie presque toujours un FIXE — et un fixe ne fait pas de
 * WhatsApp. Le jeter entièrement, comme on le faisait, revenait à dire à
 * l'habitant « c'est confirmé » sans lui donner le moindre moyen de prévenir
 * qui que ce soit. Un appel n'a pas de message pré-écrit, mais il arrive.
 */
export function numeroAppel(row: MaybeRow, jour = jourParis()): string {
  const wa = numeroReservations(row, jour);
  if (wa) return wa;
  const google = numeroGoogle(row);
  if (FIXE_OU_MOBILE_FR.test(google)) return google;
  const direct = toE164(String(row?.whatsapp_phone_e164 ?? "").trim());
  return FIXE_OU_MOBILE_FR.test(direct) ? direct : "";
}
