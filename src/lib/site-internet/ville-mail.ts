// L'e-mail de l'abonnement ville : confirmation, puis digest.
//
// Isolé du reste pour une raison simple : c'est le seul endroit du produit qui
// écrit à des gens qui ne sont pas clients d'un commerce précis. Les règles y
// sont donc plus strictes qu'ailleurs — un lien de retrait dans CHAQUE envoi,
// aucune annonce reformulée, aucun chiffre ajouté.
//
// Rendu en HTML inliné : les clients mail ne chargent ni feuille de style ni
// police externe.
import { Resend } from "resend";
import { MARQUE } from "@/lib/marque";
import { SITE_URL } from "@/lib/site-url";
import { echeanceCourte } from "./echeance";
import type { PartnerOffer } from "./collectif";

// Instanciation paresseuse : `new Resend` lève si la clé manque, et ce module est
// importé par des routes qui doivent répondre même sans e-mail configuré.
let _resend: Resend | null = null;
const getResend = () => (_resend ??= new Resend(process.env.RESEND_API_KEY || ""));

// Le NOM affiché suit la marque ; l'ADRESSE reste sur popey.academy tant que
// clikme.fr n'est pas vérifié chez Resend (DKIM + SPF). Envoyer depuis un
// domaine non vérifié, c'est la boîte à spam assurée — et un e-mail de ville
// qui n'arrive pas ne se rattrape pas.
export const MAIL_FROM = `${MARQUE} <contact@popey.academy>`;

// La règle « quoi envoyer, et quand » vit désormais dans
// `src/lib/direct/resume.ts` (`composerResume`) : elle doit décider en même
// temps du rythme, du contenu ET de la place des commerces suivis, ce qu'une
// fonction ne connaissant que des offres ne pouvait pas faire. Garder ici une
// seconde version de la même règle reviendrait à laisser deux vérités sur le
// sujet le plus sensible du produit — celui qui écrit aux gens.


/** La phrase EXACTE que l'abonné accepte. Stockée telle quelle comme preuve. */
export const consentPhrase = (ville: string) =>
  `J'accepte de recevoir par e-mail les annonces des commerçants de ${ville}. ` +
  `Un e-mail par jour au maximum, uniquement s'il y a du nouveau. Je peux me désinscrire à tout moment.`;

export function siteBase(): string {
  return SITE_URL;
}

/** Échappement HTML : ces textes viennent des commerçants, ils ne sont pas de confiance. */
const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const SHELL = (corps: string, pied: string) => `
<div style="background:#0E1014;padding:28px 16px;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#15181F;border-radius:20px;padding:26px 22px;color:#EAEEF5">
    ${corps}
  </div>
  <div style="max-width:520px;margin:14px auto 0;font-size:11px;line-height:1.6;color:#6F7684;text-align:center">
    ${pied}
  </div>
</div>`;

/** Envoi de confirmation (double opt-in). Rien ne part avant ce clic. */
export async function sendConfirmation(email: string, ville: string, token: string): Promise<boolean> {
  const url = `${siteBase()}/ville/confirmer/${encodeURIComponent(token)}`;
  const html = SHELL(
    `<div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#7FE6C0;font-weight:700">Le collectif</div>
     <div style="font-family:Georgia,serif;font-size:25px;line-height:1.15;margin-top:10px;color:#fff">
       Encore un clic, et c'est bon.
     </div>
     <p style="font-size:14px;line-height:1.6;color:#A8AEBC;margin:14px 0 0">
       Vous avez demandé à recevoir ce qui se passe chez les commerçants de <b style="color:#fff">${esc(ville)}</b>.
       Confirmez, et vous recevrez les annonces du jour — <b style="color:#fff">un e-mail par jour au maximum</b>,
       et seulement s'il y a du nouveau.
     </p>
     <a href="${url}" style="display:block;margin-top:20px;text-align:center;text-decoration:none;background:#7FE6C0;
        color:#0B2A20;border-radius:13px;padding:14px;font-size:15px;font-weight:700">
       Confirmer mon inscription
     </a>
     <p style="font-size:12px;line-height:1.55;color:#6F7684;margin:16px 0 0">
       Ce n'était pas vous&nbsp;? Ignorez cet e-mail, rien ne sera envoyé.
     </p>`,
    `Vous recevez ce message parce qu'une inscription a été demandée avec cette adresse.`
  );
  try {
    await getResend().emails.send({
      from: MAIL_FROM,
      to: email,
      subject: `Confirmez votre inscription — ${ville}`,
      html,
    });
    return true;
  } catch {
    return false;
  }
}

/** Le digest du jour. `offers` est déjà filtré : rien de vide n'arrive ici. */
export async function sendDigest(
  email: string,
  ville: string,
  offers: PartnerOffer[],
  unsubToken: string,
  /**
   * Les annonces de SES commerces, affichées en tête sous leur propre titre.
   *
   * C'est ici que vit le canal « les commerces que je suis » : il ne déclenche
   * pas un envoi de plus, il change la composition de celui-ci. Un troisième
   * e-mail quotidien n'ajouterait aucune information — les mêmes annonces sont
   * déjà dans le fil — il ne ferait que dépenser une attention qui est un budget
   * fixe.
   */
  suivies: PartnerOffer[] = []
): Promise<boolean> {
  if (!offers.length && !suivies.length) return false;
  const base = siteBase();
  const stop = `${base}/ville/stop/${encodeURIComponent(unsubToken)}`;
  const villeUrl = `${base}/ville/${encodeURIComponent(villeSlug(ville))}`;

  const carte = (o: PartnerOffer, vedette: boolean) => `
      <a href="${base}/site-internet/apercu/${encodeURIComponent(o.slug)}?via=digest&pub=${encodeURIComponent(o.id)}"
         style="display:block;text-decoration:none;color:inherit;
                background:rgba(255,255,255,${vedette ? ".085" : ".055"});
                border:1px solid rgba(${vedette ? "127,230,192,.35" : "255,255,255,.12"});
                border-radius:15px;padding:14px;margin-top:10px">
        <div style="font-size:15px;font-weight:700;color:#fff">${esc(o.nom)}</div>
        <div style="font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:#7FE6C0;font-weight:700;margin-top:3px">
          ${esc(o.metier)}
        </div>
        <div style="font-size:14px;line-height:1.5;color:#D6DAE2;margin-top:8px">${esc(o.texte)}</div>
        ${o.jusqua ? `<div style="font-size:11px;font-weight:700;color:#FF9E86;margin-top:7px">${esc(echeanceCourte(o.jusqua))}</div>` : ""}
      </a>`;

  const titreSection = (t: string) => `
      <div style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7FE6C0;
                  font-weight:700;margin-top:22px">${esc(t)}</div>`;

  const n = offers.length + suivies.length;
  // Le titre parle de CE QUI SE PASSE, pas du produit. Quelqu'un qui lit
  // « 5 nouvelles à Dax » sait s'il ouvre ; « Votre digest » ne dit rien.
  const titre = suivies.length
    ? suivies.length === 1
      ? "Un de vos commerces a publié"
      : `${suivies.length} de vos commerces ont publié`
    : n > 1
      ? `${n} nouvelles à ${ville}`
      : `Du nouveau à ${ville}`;

  const html = SHELL(
    `<div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#7FE6C0;font-weight:700">Le Direct</div>
     <div style="font-family:Georgia,serif;font-size:25px;line-height:1.15;margin-top:10px;color:#fff">
       ${esc(titre)}.
     </div>
     ${suivies.length ? titreSection("Vos commerces") + suivies.map((o) => carte(o, true)).join("") : ""}
     ${offers.length ? (suivies.length ? titreSection(`Ailleurs à ${ville}`) : "") + offers.map((o) => carte(o, false)).join("") : ""}
     <a href="${villeUrl}"
        style="display:block;margin-top:18px;background:#3FD79A;color:#08140E;border-radius:22px;
               padding:13px;text-align:center;font-size:14px;font-weight:700;text-decoration:none">
       Ouvrir Le Direct de ${esc(ville)}
     </a>`,
    `Un message par jour au maximum, et seulement s'il y a du nouveau.
     <a href="${villeUrl}/moi" style="color:#8FA79A">Régler ce que je reçois</a> ·
     <a href="${stop}" style="color:#8FA79A">Ne plus rien recevoir</a>`
  );

  try {
    const { error } = await getResend().emails.send({
      from: MAIL_FROM,
      to: email,
      subject: `${titre}${suivies.length ? ` — ${ville}` : ""}`,
      html,
    });
    return !error;
  } catch {
    return false;
  }
}


/** Slug de ville — même règle que partout ailleurs. */
export function villeSlug(v: string): string {
  return String(v || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * L'alerte de dernière minute.
 *
 * Volontairement PLUS COURTE que le résumé : elle interrompt, donc elle doit se
 * lire en une seconde. Pas de photo, pas de mise en scène — l'urgence, le
 * commerce, et un lien.
 *
 * L'objet dit CE QUI SE PASSE, pas « vous avez une alerte ». Quelqu'un qui voit
 * « 2 places viennent de se libérer à Dax » sait déjà s'il ouvre ; « Alerte
 * Clikme » ne dit rien et se fait couper à la deuxième occurrence.
 */
export async function sendAlerte(
  email: string,
  ville: string,
  offers: PartnerOffer[],
  unsubToken: string
): Promise<boolean> {
  if (!offers.length) return false;
  const base = siteBase();
  const stop = `${base}/ville/stop/${encodeURIComponent(unsubToken)}`;
  const reglages = `${base}/ville/${encodeURIComponent(villeSlug(ville))}/moi`;

  const lignes = offers
    .map(
      (o) => `
      <a href="${base}/site-internet/apercu/${encodeURIComponent(o.slug)}?via=alerte"
         style="display:block;text-decoration:none;color:inherit;background:rgba(255,255,255,.055);
                border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:13px;margin-top:9px">
        <div style="font-size:15px;font-weight:700;color:#fff">${esc(o.nom)}</div>
        <div style="font-size:14px;line-height:1.5;color:#D6DAE2;margin-top:6px">${esc(o.texte)}</div>
        ${
          o.jusqua
            ? `<div style="font-size:11px;font-weight:700;color:#FF9E86;margin-top:7px">${esc(echeanceCourte(o.jusqua))}</div>`
            : ""
        }
      </a>`
    )
    .join("");

  const n = offers.length;
  const titre = n > 1 ? `${n} choses à saisir maintenant` : "À saisir maintenant";
  const html = SHELL(
    `<div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#FF9E86;font-weight:700">Dernière minute</div>
     <div style="font-family:Georgia,serif;font-size:24px;line-height:1.15;margin-top:10px;color:#fff">
       ${esc(titre)} à ${esc(ville)}.
     </div>
     ${lignes}
     <a href="${base}/ville/${encodeURIComponent(villeSlug(ville))}/a-saisir"
        style="display:block;margin-top:16px;background:#3FD79A;color:#08140E;border-radius:22px;
               padding:13px;text-align:center;font-size:14px;font-weight:700;text-decoration:none">
       Tout voir dans Le Direct
     </a>`,
    `Vous recevez ces alertes parce que vous les avez activées.
     <a href="${reglages}" style="color:#8FA79A">Régler la fréquence</a> ·
     <a href="${stop}" style="color:#8FA79A">Ne plus rien recevoir</a>`
  );

  try {
    const { error } = await getResend().emails.send({
      from: MAIL_FROM,
      to: email,
      subject: `${titre} à ${ville}`,
      html,
    });
    return !error;
  } catch {
    return false;
  }
}
