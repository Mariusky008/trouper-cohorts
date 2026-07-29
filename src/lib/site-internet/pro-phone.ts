// Le numéro du COMMERÇANT — celui qu'on utilise pour le prévenir (demande reçue,
// mise en ligne de son site).
//
// Piège découvert à l'audit : `whatsapp_phone_e164` n'est renseigné que par le
// canal « vitrines ». Pour un site issu d'une lettre, le numéro arrive par le
// formulaire « Garder ce site gratuitement » et atterrit dans `metadata.leads[]`.
// Sans ce repli, toutes les notifications au commerçant partaient dans le vide.
import { toE164 } from "./phone";

type MaybeRow = { whatsapp_phone_e164?: unknown; metadata?: unknown } | null | undefined;

/** Mobile français, seul format joignable par SMS (et seul accepté par la colonne). */
const MOBILE_FR = /^\+33[67]\d{8}$/;

/** Numéro E.164 du commerçant joignable par SMS, ou "" si on n'en a aucun. */
export function proPhoneFrom(row: MaybeRow): string {
  const direct = toE164(String(row?.whatsapp_phone_e164 ?? "").trim());
  if (MOBILE_FR.test(direct)) return direct;

  // Repli : le dernier numéro laissé dans le formulaire de rappel (c'est LUI qui
  // nous l'a donné, précisément pour qu'on le recontacte à propos de son site).
  const meta = (row?.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  const leads = Array.isArray(meta.leads) ? meta.leads : [];
  for (let i = leads.length - 1; i >= 0; i--) {
    const l = (leads[i] && typeof leads[i] === "object" ? leads[i] : {}) as Record<string, unknown>;
    const p = toE164(String(l.phone ?? "").trim());
    if (MOBILE_FR.test(p)) return p;
  }
  return "";
}
