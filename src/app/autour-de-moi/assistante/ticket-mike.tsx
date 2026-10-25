"use client";

// 🧾 LE TICKET DE MIKE — « Ce que Mike a fait pour toi », chaque semaine.
//
// Le ticket de « Plus de clients » des tours du fantôme (« Grâce à vos
// promesses : +4 tables un midi calme »), au comptoir, avec ce que ClikMe sait
// vraiment de ses sept derniers jours : les fantômes libérés, les personnes
// venues, celles venues après son signal, les messages de Mike et leurs
// réponses, les vues de sa page, et la commission ClikMe — 0 €, toujours.
// Voir `lib/direct/ticket-mike.ts`.
//
// SUR L'ACCUEIL, une carte sous « Mon carnet », avec un point rose tant qu'il ne
// l'a pas ouvert cette semaine. Rien quand la semaine est vide.
import { useCallback, useEffect, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import type { JourStats } from "@/lib/direct/stats-comptoir";
import {
  apresSignalEnMots,
  calculerTicket,
  gestesDuCarnet,
  periodeEnMots,
  ticketVide,
  totalFantomes,
  type Ticket,
} from "@/lib/direct/ticket-mike";
import type { CarnetDuComptoir } from "./carnet-comptoir";

const JOUR = 86_400_000;
type Tickets = { semaine: Ticket; avant: Ticket; fin: number };

/** Ses deux semaines, lues en base (vrai commerçant). `null` : pas de ticket (hors ligne, ou carnet pas encore activé). */
async function lireTicket(reel: { slug: string; token: string }): Promise<Tickets | null> {
  try {
    const r = await fetch("/api/site-internet/pro/carnet", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: reel.slug, token: reel.token, action: "ticket" }),
    });
    const j = (await r.json().catch(() => null)) as { ok?: boolean; actif?: boolean; semaine?: Ticket; avant?: Ticket } | null;
    return j?.ok && j.actif && j.semaine && j.avant ? { semaine: j.semaine, avant: j.avant, fin: Date.now() } : null;
  } catch {
    return null;
  }
}

/** Ses deux semaines : calculées du carnet inventé dans la démonstration, lues en base sinon. */
export function useTicket(commerce: CommerceComptoir, carnet: CarnetDuComptoir) {
  const [vrais, setVrais] = useState<Tickets | null>(null);
  /* Le ticket de la démonstration finit à l'ouverture du comptoir : il ne bouge pas d'un rendu à l'autre. */
  const [maintenant] = useState(() => Date.now());
  const reel = commerce.reel;
  useEffect(() => {
    if (!reel) return;
    let fini = false;
    void lireTicket(reel).then((t) => {
      if (!fini && t) setVrais(t);
    });
    return () => {
      fini = true;
    };
  }, [reel]);
  const relire = useCallback(() => {
    if (reel) void lireTicket(reel).then((t) => t && setVrais(t));
  }, [reel]);
  if (reel) return { tickets: vrais, relire };
  if (!carnet.pret) return { tickets: null, relire };
  const g = gestesDuCarnet(carnet.lignes);
  return { tickets: { semaine: calculerTicket(g, maintenant), avant: calculerTicket(g, maintenant - 7 * JOUR), fin: maintenant }, relire };
}

/* LE POINT ROSE : tant qu'il n'a pas ouvert son ticket depuis sept jours. Gardé dans ce téléphone. */
const cleVu = (c: CommerceComptoir) => `clikme:ticket-vu:${c.id}`;
function dejaVu(c: CommerceComptoir): boolean {
  try {
    return Date.now() - Number(window.localStorage.getItem(cleVu(c)) || 0) < 7 * JOUR;
  } catch {
    return true;
  }
}
function noterVu(c: CommerceComptoir) {
  try {
    window.localStorage.setItem(cleVu(c), String(Date.now()));
  } catch {
    /* stockage indisponible */
  }
}

/** « 3 venus · 12 fantômes » : ce que dit la carte de l'accueil. */
function resume(t: Ticket): string {
  const f = totalFantomes(t);
  const morceaux = [
    t.venus ? `${t.venus} ${t.venus > 1 ? "venus" : "venu"}` : "",
    f ? `${f} ${f > 1 ? "fantômes libérés" : "fantôme libéré"}` : "",
    !t.venus && t.messages ? `${t.messages} ${t.messages > 1 ? "messages" : "message"}` : "",
  ].filter(Boolean);
  return `${morceaux.join(" · ")} · cette semaine`;
}

/** La carte de l'accueil, et la feuille du ticket. */
export function CarteTicket({
  commerce,
  dossier,
  carnet,
  semaine,
  onCarnet,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  carnet: CarnetDuComptoir;
  /** Ses vues de la semaine (les chiffres du comptoir), s'il y en a. */
  semaine: JourStats[] | null;
  onCarnet: () => void;
}) {
  const { tickets, relire } = useTicket(commerce, carnet);
  const [ouvert, setOuvert] = useState(false);
  const [vu, setVu] = useState(() => dejaVu(commerce));
  if (!tickets || (ticketVide(tickets.semaine) && ticketVide(tickets.avant))) return null;
  const ouvrir = () => {
    noterVu(commerce);
    setVu(true);
    setOuvert(true);
    relire();
  };
  return (
    <>
      <button type="button" className="ak-second tk-carte" onClick={ouvrir}>
        <span className="ak-second-i" aria-hidden="true">
          🧾
        </span>
        <span className="ak-cta-t">
          <b>Ce que Mike a fait pour toi</b>
          <em>{ticketVide(tickets.semaine) ? "Ta semaine d’avant, en un ticket" : resume(tickets.semaine)}</em>
        </span>
        {!vu && <i className="tk-point" aria-label="Nouveau" />}
        <s aria-hidden="true">›</s>
      </button>
      {ouvert && (
        <FeuilleTicket
          commerce={commerce}
          dossier={dossier}
          tickets={tickets}
          vues={semaine ? semaine.reduce((n, j) => n + j.vues, 0) : null}
          demo={carnet.demo}
          onCarnet={() => {
            setOuvert(false);
            onCarnet();
          }}
          onFermer={() => setOuvert(false)}
        />
      )}
      <style>{STYLES}</style>
    </>
  );
}

function FeuilleTicket({
  commerce,
  dossier,
  tickets,
  vues,
  demo,
  onCarnet,
  onFermer,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  tickets: Tickets;
  vues: number | null;
  demo: boolean;
  onCarnet: () => void;
  onFermer: () => void;
}) {
  const [avant, setAvant] = useState(false);
  const t = avant ? tickets.avant : tickets.semaine;
  const fin = avant ? tickets.fin - 7 * JOUR : tickets.fin;
  const f = totalFantomes(t);
  const detail = [
    t.fantomes.adore && `${t.fantomes.adore} j’adore`,
    t.fantomes["un-jour"] && `${t.fantomes["un-jour"]} un jour`,
    t.fantomes.aujourdhui && `${t.fantomes.aujourdhui} aujourd’hui`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="tk-voile" role="dialog" aria-modal="true" aria-label="Ce que Mike a fait pour toi" onClick={onFermer}>
      <div className="tk-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="tk-haut">
          <div className="tk-onglets" role="tablist">
            <button type="button" role="tab" aria-selected={!avant} className={!avant ? "on" : ""} onClick={() => setAvant(false)}>
              Cette semaine
            </button>
            <button type="button" role="tab" aria-selected={avant} className={avant ? "on" : ""} onClick={() => setAvant(true)}>
              La semaine d’avant
            </button>
          </div>
          <button type="button" className="tk-fermer" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>

        <div className="tk-ticket">
          <div className="tk-titre">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${dossier}visage.webp`} alt="" />
            <p>
              <b>Plus de clients.</b>
              <small>Ce que Mike a fait pour toi</small>
              <em>{periodeEnMots(fin)}</em>
            </p>
          </div>
          <Ligne i="👻" quoi="Fantômes libérés à la fin de tes vidéos" combien={String(f)} sous={detail} />
          <Ligne
            i="🚶"
            quoi="Venus chez toi"
            combien={t.venus ? `${t.venus} ${t.venus > 1 ? "personnes" : "personne"}` : "0"}
            sous={t.venus ? `${t.passages} ${t.passages > 1 ? "passages notés" : "passage noté"} dans ton carnet` : "Note leurs passages dans ton carnet : ils compteront ici."}
          />
          {t.apresSignal > 0 && <Ligne i="📲" quoi="Grâce à tes promesses" combien={apresSignalEnMots(t.apresSignal, commerce.famille)} sous="Venus le jour même ou le lendemain de ton signal" fort />}
          <Ligne
            i="💬"
            quoi="Messages de Mike"
            combien={`${t.messages} ${t.messages > 1 ? "envoyés" : "envoyé"}`}
            sous={t.reponses ? `${t.reponses} ${t.reponses > 1 ? "réponses" : "réponse"}` : t.messages ? "Pas encore de réponse" : "Tu les valides d’un « oui »"}
          />
          {!avant && vues !== null && <Ligne i="👁" quoi="Ta page sur ClikMe" combien={`${vues.toLocaleString("fr-FR")} ${vues > 1 ? "vues" : "vue"}`} />}
          <Ligne i="🤝" quoi="Commission ClikMe" combien="0 €" sous="toujours" zero />
          {demo && <p className="tk-note">Démonstration : les chiffres du carnet inventé.</p>}
        </div>

        <button type="button" className="tk-carnet" onClick={onCarnet}>
          📒 Voir mon carnet
        </button>
      </div>
    </div>
  );
}

function Ligne({ i, quoi, combien, sous, fort, zero }: { i: string; quoi: string; combien: string; sous?: string; fort?: boolean; zero?: boolean }) {
  return (
    <div className={`tk-l${fort ? " fort" : ""}${zero ? " zero" : ""}`}>
      <i aria-hidden="true">{i}</i>
      <span>
        <small>{quoi}</small>
        <b>{combien}</b>
        {sous && <em>{sous}</em>}
      </span>
    </div>
  );
}

const STYLES = `
.tk-carte{position:relative;}
.tk-point{position:absolute;top:14px;right:14px;width:10px;height:10px;border-radius:50%;background:var(--rose,#FF2E9A);box-shadow:0 0 0 3px rgba(255,46,154,.25);}
.tk-voile{position:fixed;inset:0;z-index:80;background:rgba(8,5,4,.72);display:flex;align-items:flex-end;justify-content:center;}
.tk-feuille{width:100%;max-width:460px;max-height:92vh;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:14px 16px calc(18px + env(safe-area-inset-bottom));
  border-radius:22px 22px 0 0;background:var(--nappe,#1C1411);color:var(--creme,#FFF4E6);box-shadow:0 -20px 50px rgba(0,0,0,.45);}
.tk-haut{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.tk-onglets{display:flex;gap:6px;}
.tk-onglets button{min-height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--trait,rgba(255,196,140,.14));background:none;color:var(--gris,#CDB8A4);font-weight:700;font-size:13px;}
.tk-onglets button.on{border-color:var(--creme,#FFF4E6);background:var(--creme,#FFF4E6);color:#1C1411;}
.tk-fermer{width:34px;height:34px;border-radius:50%;border:1px solid var(--trait,rgba(255,196,140,.14));background:none;color:var(--gris,#CDB8A4);}
.tk-ticket{display:flex;flex-direction:column;padding:16px 16px 12px;border-radius:18px;background:#FFF8EF;color:#2B1D16;
  box-shadow:0 14px 30px -18px rgba(0,0,0,.6);
  -webkit-mask:radial-gradient(circle 7px at 50% 100%,transparent 98%,#000) 0 0/16px 100% repeat-x;mask:radial-gradient(circle 7px at 50% 100%,transparent 98%,#000) 0 0/16px 100% repeat-x;
  padding-bottom:20px;}
.tk-titre{display:flex;align-items:center;gap:12px;padding-bottom:12px;margin-bottom:4px;border-bottom:1.5px dashed rgba(43,29,22,.25);}
.tk-titre img{width:52px;height:52px;border-radius:50%;object-fit:cover;background:#F1E3D3;flex:none;}
.tk-titre p{margin:0;display:flex;flex-direction:column;}
.tk-titre b{font-family:var(--font-clikme),sans-serif;font-size:22px;font-weight:900;letter-spacing:-.02em;}
.tk-titre small{font-size:13.5px;font-weight:700;color:#6E5647;}
.tk-titre em{font-style:normal;font-size:12px;color:#8A6F5E;}
.tk-l{display:grid;grid-template-columns:30px 1fr;gap:10px;align-items:start;padding:10px 0;border-bottom:1px dashed rgba(43,29,22,.16);}
.tk-l:last-of-type{border-bottom:0;}
.tk-l i{font-style:normal;font-size:20px;line-height:1.3;text-align:center;}
.tk-l span{display:flex;flex-direction:column;min-width:0;}
.tk-l small{font-size:12.5px;color:#6E5647;}
.tk-l b{font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:850;letter-spacing:-.01em;}
.tk-l em{font-style:normal;font-size:12.5px;color:#8A6F5E;}
.tk-l.fort b{color:#C4146E;}
.tk-l.zero b{color:#1B8A4B;}
.tk-note{margin:8px 0 0;font-size:12px;color:#8A6F5E;}
.tk-carnet{min-height:46px;border-radius:999px;border:1px solid var(--trait,rgba(255,196,140,.14));background:none;color:var(--creme,#FFF4E6);font-weight:800;font-size:14.5px;}
`;
