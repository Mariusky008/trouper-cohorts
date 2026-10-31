"use client";

// 👥 SON ÉQUIPE — un compte par personne, plus de « on est 5 » déclaré.
//
// « Il faudrait que chacun ait son compte […] le commerçant de départ aura dit
// 5 comptes qui donnent 5 codes à envoyer par WhatsApp aux employés ou
// associés […] lui recevra toutes les transactions et ce qu'il doit. »
//
// Le responsable invite une personne par son prénom : elle reçoit un lien
// personnel, envoyé par SON WhatsApp (jamais par ClikMe). Ouvert une fois, elle
// compte dans l'équipe : 50 € par mois rien qu'à elle, et 50 € de plus
// d'avance pour le commerce. Il voit ce que chacun a pris ce mois-ci, et peut
// retirer quelqu'un : son lien ne marche plus, ce qu'il a pris reste dû par le
// commerce.
//
// Utilisé tel quel par le vrai comptoir (`echanges-reels.tsx`) et par la
// démonstration (`echanges-comptoir.tsx`, avec des personnes d'exemple).
//
// « J'ai pu mettre un employé, mais comment se connecte-t-il ? » — EN
// DÉMONSTRATION AUSSI, on le voit : le message WhatsApp qu'il recevrait, avec
// un lien d'exemple (marqué comme tel), et les trois gestes qui le font entrer.
// « Son accès » le remontre pour une personne déjà invitée.
import { useState } from "react";
import { MAX_MEMBRES, PAR_PERSONNE, deNom, type MembreEquipe } from "@/lib/echanges/echanges";
import { Feuille } from "./echanges-communs";

/** Le message qu'il envoie, par son WhatsApp, à la personne qu'il invite. */
export function messageMembre(prenom: string, commerce: string, lien: string): string {
  return `${prenom}, tu fais partie de l’équipe ${deNom(commerce)} sur ClikMe 🎁 Tu as ${PAR_PERSONNE} € par mois à dépenser chez les commerçants du réseau. Ton accès personnel (ne le partage pas) : ${lien}`;
}

const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);
/** En démonstration : un lien qui se voit comme un exemple, jamais un vrai jeton. */
const lienExemple = (prenom: string) =>
  `https://clikme.fr/e/demo-${prenom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "equipe"}`;

export function PanneauEquipe({
  membres,
  commerce,
  envoi = false,
  exemple = false,
  origine,
  onInviter,
  onRetirer,
  onFermer,
}: {
  membres: MembreEquipe[];
  commerce: string;
  envoi?: boolean;
  /** Démonstration : la personne invitée rejoint tout de suite, et rien ne part. */
  exemple?: boolean;
  /** L'adresse du site, pour faire un lien entier (`https://…/e/<jeton>`). */
  origine: string;
  onInviter: (prenom: string) => Promise<{ prenom: string; lien: string } | string>;
  onRetirer: (m: MembreEquipe) => void;
  onFermer: () => void;
}) {
  const [prenom, setPrenom] = useState("");
  const [erreur, setErreur] = useState("");
  const [nouveau, setNouveau] = useState<{ prenom: string; lien: string } | null>(null);
  const [aRetirer, setARetirer] = useState<MembreEquipe | null>(null);
  const actifs = membres.filter((m) => m.actif).length;
  const total = 1 + actifs;
  const complet = membres.length >= MAX_MEMBRES;
  const lienEntier = (lien: string) => (lien.startsWith("/") ? `${origine}${lien}` : lien);

  if (nouveau) {
    const lien = lienEntier(nouveau.lien);
    return (
      <Feuille titre={`Envoie son accès à ${nouveau.prenom}`} onFermer={onFermer}>
        {exemple ? (
          <>
            <p className="ec-gris">
              <b>{nouveau.prenom}</b> rejoint ton équipe : {PAR_PERSONNE} € par mois rien qu’à elle ou lui, et {PAR_PERSONNE} € de plus d’avance pour ta boutique. Voici comment elle ou il se connecte.
            </p>
            <div className="ec-wa-apercu" aria-label="Le message WhatsApp qu’elle ou il reçoit">
              <span className="ec-wa-apercu-t">
                WhatsApp · de toi à {nouveau.prenom}
              </span>
              <p>{messageMembre(nouveau.prenom, commerce, lienExemple(nouveau.prenom))}</p>
            </div>
            <ol className="ec-regles">
              <li>
                <b>Tu lui envoies son lien</b> par ton WhatsApp : en vrai, le bouton « Envoyer par WhatsApp » écrit ce message pour toi.
              </li>
              <li>
                <b>Elle ou il touche le lien.</b> Pas de mot de passe, pas de compte à créer : le lien est sa clé. Dès qu’il est ouvert, elle ou il compte dans ton équipe.
              </li>
              <li>
                <b>Sa page « Mon accès »</b> : ses {PAR_PERSONNE} € du mois, les offres à glisser, ses bons, et « Valider un bon » au comptoir. Elle lui propose de la poser sur son écran d’accueil.
              </li>
            </ol>
            <p className="ec-petit">Lien perdu ? « Renvoyer », à côté de son prénom. Elle ou il part ? « Retirer » : le lien ne marche plus.</p>
          </>
        ) : (
          <>
            <p className="ec-gris">
              Envoie-lui ce lien par ton WhatsApp. Dès que <b>{nouveau.prenom}</b> l’ouvre, elle ou il fait partie de ton équipe : {PAR_PERSONNE} € par mois rien qu’à elle ou lui.
            </p>
            <p className="ec-lien-membre">{lien}</p>
            <a className="cz-go grand ec-wa" href={`https://wa.me/?text=${encodeURIComponent(messageMembre(nouveau.prenom, commerce, lien))}`} target="_blank" rel="noopener noreferrer">
              Envoyer par WhatsApp
            </a>
            <button
              type="button"
              className="cz-lien"
              onClick={() => {
                void navigator.clipboard?.writeText(lien).catch(() => undefined);
              }}
            >
              Copier le lien
            </button>
          </>
        )}
        <button type="button" className="cz-lien" onClick={() => setNouveau(null)}>
          ‹ Retour à mon équipe
        </button>
      </Feuille>
    );
  }

  if (aRetirer) {
    return (
      <Feuille titre={`Retirer ${aRetirer.prenom} ?`} onFermer={() => setARetirer(null)}>
        <p className="ec-gris">
          Son lien ne marchera plus. Ce qu’elle ou il a déjà pris reste dû par ta boutique, et ses bons en cours restent valables.
        </p>
        <button
          type="button"
          className="cz-go"
          disabled={envoi}
          onClick={() => {
            onRetirer(aRetirer);
            setARetirer(null);
          }}
        >
          Retirer {aRetirer.prenom}
        </button>
        <button type="button" className="cz-lien" onClick={() => setARetirer(null)}>
          Annuler
        </button>
      </Feuille>
    );
  }

  return (
    <Feuille titre="Mon équipe" onFermer={onFermer}>
      <p className="ec-gris">
        Chaque personne de ton équipe a <b>son propre accès</b> et ses {PAR_PERSONNE} € par mois chez les commerçants. Ce qu’elle prend, ta boutique le rend en produits : tu vois tout ici.
      </p>
      <div className="ec-equipe">
        <div className="ec-membre">
          <span>
            <b>Toi</b>
            <em>Responsable · tu vois tout et tu gères l’offre</em>
          </span>
        </div>
        {membres.map((m) => (
          <div key={m.id} className={`ec-membre${m.actif ? "" : " attente"}`}>
            <span>
              <b>{m.prenom}</b>
              <em>
                {m.actif ? `Ce mois-ci : ${m.prisCeMois}\u00a0€ sur ${PAR_PERSONNE}\u00a0€` : "Invité·e : n’a pas encore ouvert son lien"}
              </em>
            </span>
            <span className="ec-membre-b">
              {exemple && (
                <button type="button" onClick={() => setNouveau({ prenom: m.prenom, lien: "" })}>
                  Son accès
                </button>
              )}
              {!exemple && m.lien && (
                <a href={`https://wa.me/?text=${encodeURIComponent(messageMembre(m.prenom, commerce, lienEntier(m.lien)))}`} target="_blank" rel="noopener noreferrer">
                  Renvoyer
                </a>
              )}
              <button type="button" disabled={envoi} onClick={() => setARetirer(m)}>
                Retirer
              </button>
            </span>
          </div>
        ))}
      </div>
      {!complet ? (
        <form
          className="ec-inviter"
          onSubmit={async (e) => {
            e.preventDefault();
            const p = prenom.trim();
            if (!p) return;
            setErreur("");
            const r = await onInviter(p);
            if (typeof r === "string") setErreur(r);
            else {
              setPrenom("");
              setNouveau(r);
            }
          }}
        >
          <input value={prenom} maxLength={40} onChange={(e) => setPrenom(e.target.value)} placeholder="Son prénom" aria-label="Son prénom" autoComplete="off" />
          <button type="submit" className="cz-go" disabled={envoi || !prenom.trim()}>
            Inviter
          </button>
        </form>
      ) : (
        <p className="ec-gris">Ton équipe est complète : {MAX_MEMBRES} personnes, et toi.</p>
      )}
      {erreur && <p className="ec-erreur">{erreur}</p>}
      <p className="ec-regle">
        Ton équipe : <b>{total} {pluriel(total, "personne", "personnes")}</b>, soit {total * PAR_PERSONNE} € par mois.
        {membres.length > actifs ? ` ${membres.length - actifs} ${pluriel(membres.length - actifs, "invitation attend", "invitations attendent")} encore d’être ouverte${membres.length - actifs > 1 ? "s" : ""}.` : ""}
      </p>
      <p className="ec-petit">Tes associés : tout de suite. Tes salariés : demande d’abord l’avis de ton comptable (avantage en nature).</p>
    </Feuille>
  );
}

export function StylesEquipe() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ec-equipe{display:flex;flex-direction:column;gap:8px;}
.ec-membre{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:14px;background:var(--nappe);border:1px solid var(--trait);}
.ec-membre > span:first-child{display:flex;flex-direction:column;gap:2px;min-width:0;}
.ec-membre b{font-size:15px;}
.ec-membre em{font-style:normal;font-size:12.5px;color:var(--gris);line-height:1.3;}
.ec-membre.attente{border-style:dashed;}
.ec-membre-b{display:flex;gap:6px;flex-shrink:0;}
.ec-membre-b a,.ec-membre-b button{height:34px;display:inline-grid;place-items:center;padding:0 12px;border-radius:999px;border:1px solid var(--trait);
  background:none;color:var(--creme);font-weight:800;font-size:13px;text-decoration:none;}
.ec-membre-b a{color:#7CF0A2;border-color:rgba(124,240,162,.4);}
.ec-inviter{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;}
.ec-inviter input{min-width:0;width:100%;height:52px;padding:0 14px;border-radius:14px;border:1.5px solid var(--ambre);background:var(--fond);
  color:var(--creme);font-size:16px;font-weight:700;}
.ec-inviter .cz-go{height:52px;min-height:52px;padding:0 20px;width:auto;}
.ec-wa-apercu{display:flex;flex-direction:column;gap:6px;padding:10px 12px 12px;border-radius:16px 16px 16px 4px;background:#103A2C;
  border:1px solid rgba(124,240,162,.35);}
.ec-wa-apercu-t{display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:800;letter-spacing:.04em;color:#7CF0A2;}
.ec-wa-apercu-t i{font-style:normal;padding:1px 7px;border-radius:999px;background:rgba(245,162,58,.18);color:var(--ambre);font-size:10.5px;}
.ec-wa-apercu p{margin:0;font-size:14px;line-height:1.45;color:#E8FFF1;overflow-wrap:anywhere;}
.ec-lien-membre{margin:0;padding:10px 12px;border-radius:14px;background:var(--fond);border:1px dashed var(--trait);font-size:13px;
  color:var(--creme);overflow-wrap:anywhere;}
`,
      }}
    />
  );
}
