"use client";

/**
 * 📅💬 LA VIE D'UN GROUPE (Mes groupes, le lot G5, 26 novembre 2026 ; `lib/direct/groupes-vie-serveur.ts`).
 *
 * 📅 Rendez-vous : les habitudes du groupe (chaque soir, chaque mercredi) et ses séances exceptionnelles. Pour la
 * prochaine fois, chacun répond ✓ Je viens, Absent ou Plus tard ; on voit les figurines de ceux qui viennent, jamais un
 * nombre.
 * 💬 Discussion : quelques mots entre deux rencontres (90 signes, la modération des salons), et 💡 les idées de séance :
 * dès que deux sont « Partant ! », l'idée entre dans les rendez-vous.
 */
import { useEffect, useState } from "react";
import {
  JOURS_SEMAINE,
  MESSAGE_GROUPE_MAX,
  NOM_GROUPE_MAX,
  OUVERT_APRES_MS,
  OUVERT_AVANT_MS,
  PARTANTS_MIN,
  PHRASES_GROUPES_GARDES as PG,
  PHRASES_VIE_DU_GROUPE as PV,
  aParis,
  heureLisible,
  quandDuRdv,
  quandLisible,
  type AujourdhuiDuGroupe,
  type MessageGroupe,
  type PlaceGroupe,
  type Recurrence,
  type RdvGroupe,
  type ReponseRdv,
  type VieDuGroupe,
} from "@/lib/direct/groupes";

const ROUTE = "/api/direct/mes-groupes";

export async function poster(corps: Record<string, unknown>): Promise<{ ok: boolean; j: Record<string, unknown> }> {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) }).catch(() => null);
  const j = ((await r?.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  return { ok: Boolean(r?.ok && !j.error), j: r ? j : { error: "Pas de réseau : réessaie dans un instant." } };
}

/** La vie du groupe, relue toutes les vingt secondes tant que son espace est ouvert. */
export function useVieDuGroupe(gid: string) {
  const [vie, setVie] = useState<VieDuGroupe | null>(null);
  // (🎬 lot G6 : l'onglet Aujourd'hui vient avec)
  const [aujourdhui, setAujourdhui] = useState<AujourdhuiDuGroupe | null>(null);
  useEffect(() => {
    let fini = false;
    const lire = () =>
      fetch(`${ROUTE}?groupe=${encodeURIComponent(gid)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j: { vie?: VieDuGroupe; aujourdhui?: AujourdhuiDuGroupe }) => {
          if (fini) return;
          if (j.vie) setVie(j.vie);
          if (j.aujourdhui) setAujourdhui(j.aujourdhui);
        })
        .catch(() => undefined);
    void lire();
    const t = window.setInterval(() => document.visibilityState === "visible" && void lire(), 20_000);
    return () => {
      fini = true;
      window.clearInterval(t);
    };
  }, [gid]);
  return { vie, setVie, aujourdhui, setAujourdhui };
}

function Tete({ p }: { p: { prenom: string; src: string } }) {
  return (
    <span className="gv-tete" title={p.prenom}>
      {p.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.src} alt={p.prenom} draggable={false} />
      ) : (
        <span aria-hidden="true">🙂</span>
      )}
    </span>
  );
}

/** Une idée de séance attend encore ses partants (elle vit dans la discussion). */
const enAttente = (r: RdvGroupe) => Boolean(r.idee && r.viennent.length < PARTANTS_MIN);

/** 📅 Les rendez-vous du groupe. */
export function OngletRendezVous({ gid, vie, setVie, salon, onNouveau, onDit }: { gid: string; vie: VieDuGroupe; setVie: (f: (v: VieDuGroupe | null) => VieDuGroupe | null) => void; salon: string; onNouveau: () => void; onDit: (t: string) => void }) {
  const l = vie.rdv.filter((r) => !enAttente(r));
  return (
    <div className="gv-liste" data-onglet-rdv>
      {l.map((r) => (
        <CarteRdv key={r.id} gid={gid} r={r} salon={salon} setVie={setVie} onDit={onDit} />
      ))}
      {!l.length && <p className="gv-aucun">{PV.rdvAucun}</p>}
      <button type="button" className="gv-nouveau" onClick={onNouveau} data-rdv-nouveau>
        {PV.nouveau}
      </button>
    </div>
  );
}

function CarteRdv({ gid, r, salon, setVie, onDit }: { gid: string; r: RdvGroupe; salon: string; setVie: (f: (v: VieDuGroupe | null) => VieDuGroupe | null) => void; onDit: (t: string) => void }) {
  const [envoi, setEnvoi] = useState(false);
  const [maintenant] = useState(() => Date.now());
  const ouvert = r.quand - OUVERT_AVANT_MS <= maintenant && maintenant < r.quand + OUVERT_APRES_MS;
  async function repondre(reponse: ReponseRdv) {
    if (envoi) return;
    setEnvoi(true);
    const { ok, j } = await poster({ action: "rdv-repondre", groupe: gid, rdv: r.id, reponse });
    setEnvoi(false);
    if (!ok) return onDit(String(j.error || "Ça n’a pas marché. Réessaie."));
    const nouveau = j.rdv as RdvGroupe | undefined;
    if (nouveau) setVie((v) => (v ? { ...v, rdv: v.rdv.map((x) => (x.id === r.id ? nouveau : x)) } : v));
    if (reponse === "tard") onDit(PV.tardDit);
  }
  async function retirer() {
    if (envoi) return;
    setEnvoi(true);
    const { ok, j } = await poster({ action: "rdv-retirer", groupe: gid, rdv: r.id });
    setEnvoi(false);
    if (!ok) return onDit(String(j.error || "Ça n’a pas marché. Réessaie."));
    setVie((v) => (v ? { ...v, rdv: v.rdv.filter((x) => x.id !== r.id) } : v));
  }
  return (
    <div className="gv-rdv" data-rdv={r.id}>
      <div className="gv-rdv-haut">
        <span className="gv-rdv-e" aria-hidden="true">
          {r.e}
        </span>
        <div className="gv-rdv-nom">
          <strong>{r.nom}</strong>
          <span>{quandDuRdv(r)}</span>
        </div>
        {ouvert && (
          <a className="gv-entrer" href={salon} data-rdv-entrer>
            {PG.entrer}
          </a>
        )}
      </div>
      {r.viennent.length > 0 && (
        <div className="gv-viennent" data-viennent>
          {r.viennent.map((p) => (
            <Tete key={p.q} p={p} />
          ))}
        </div>
      )}
      <div className="gv-reponses">
        {(["viens", "absent", "tard"] as const).map((x) => (
          <button key={x} type="button" className={`gv-rep${r.moi === x ? " pris" : ""}${x === "viens" ? " viens" : ""}`} aria-pressed={r.moi === x} disabled={envoi} onClick={() => void repondre(x)} data-reponse={x}>
            {PV[x]}
          </button>
        ))}
      </div>
      {r.mien && (
        <button type="button" className="gv-retirer" onClick={() => void retirer()} disabled={envoi} data-rdv-retirer>
          {PV.retirer}
        </button>
      )}
    </div>
  );
}

/** 💬 La discussion du groupe, et les idées de séance. */
export function OngletDiscussion({ gid, vie, setVie, onIdee, onDit }: { gid: string; vie: VieDuGroupe; setVie: (f: (v: VieDuGroupe | null) => VieDuGroupe | null) => void; onIdee: () => void; onDit: (t: string) => void }) {
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  async function envoyer() {
    const t = texte.trim();
    if (!t || envoi) return;
    setEnvoi(true);
    const { ok, j } = await poster({ action: "ecrire-groupe", groupe: gid, texte: t });
    setEnvoi(false);
    if (!ok) return onDit(String(j.error || "Ça n’a pas marché. Réessaie."));
    const m = j.message as MessageGroupe | undefined;
    if (m) setVie((v) => (v ? { ...v, messages: [...v.messages.filter((x) => x.id !== m.id), m] } : v));
    setTexte("");
  }
  return (
    <div className="gv-discussion" data-onglet-discussion>
      <div className="gv-fil">
        {!vie.messages.length && <p className="gv-aucun">{PV.rienEncore}</p>}
        {vie.messages.map((m) => {
          const idee = m.idee ? vie.rdv.find((r) => r.id === m.idee) : undefined;
          return idee ? <CarteIdee key={m.id} gid={gid} m={m} r={idee} setVie={setVie} onDit={onDit} /> : <Bulle key={m.id} m={m} />;
        })}
      </div>
      <button type="button" className="gv-idee-bouton" onClick={onIdee} data-idee-nouvelle>
        {PV.idee}
      </button>
      <form
        className="gv-ecrire"
        onSubmit={(e) => {
          e.preventDefault();
          void envoyer();
        }}
      >
        <input type="text" maxLength={MESSAGE_GROUPE_MAX} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={PV.ecrire} aria-label={PV.ecrire} data-ecrire-groupe />
        <button type="submit" disabled={envoi || !texte.trim()} data-envoyer-groupe>
          {PV.envoyer}
        </button>
      </form>
    </div>
  );
}

function Bulle({ m }: { m: MessageGroupe }) {
  return (
    <div className={`gv-msg${m.mien ? " mien" : ""}`} data-message={m.id}>
      {!m.mien && <Tete p={m} />}
      <div className="gv-bulle">
        {!m.mien && <b>{m.prenom}</b>}
        <span>{m.texte}</span>
        <i>{heureLisible(m.le)}</i>
      </div>
    </div>
  );
}

function CarteIdee({ gid, m, r, setVie, onDit }: { gid: string; m: MessageGroupe; r: RdvGroupe; setVie: (f: (v: VieDuGroupe | null) => VieDuGroupe | null) => void; onDit: (t: string) => void }) {
  const [envoi, setEnvoi] = useState(false);
  const partant = r.moi === "viens";
  async function partir() {
    if (envoi || partant) return;
    setEnvoi(true);
    const { ok, j } = await poster({ action: "rdv-repondre", groupe: gid, rdv: r.id, reponse: "viens" });
    setEnvoi(false);
    if (!ok) return onDit(String(j.error || "Ça n’a pas marché. Réessaie."));
    const nouveau = j.rdv as RdvGroupe | undefined;
    if (nouveau) setVie((v) => (v ? { ...v, rdv: v.rdv.map((x) => (x.id === r.id ? nouveau : x)) } : v));
    if (j.entre) onDit(PV.ideeEntre(r.nom));
  }
  return (
    <div className={`gv-idee${m.mien ? " mien" : ""}`} data-idee={r.id}>
      <p className="gv-idee-de">
        <Tete p={m} /> <b>{m.prenom}</b>
      </p>
      <strong>💡 {PV.ideeQuestion(r.nom)}</strong>
      <span className="gv-idee-quand">⭐ {quandLisible(r.quand)}</span>
      {r.viennent.length > 0 && (
        <div className="gv-viennent">
          {r.viennent.map((p) => (
            <Tete key={p.q} p={p} />
          ))}
        </div>
      )}
      <button type="button" className={`gv-rep viens${partant ? " pris" : ""}`} aria-pressed={partant} disabled={envoi || partant} onClick={() => void partir()} data-partant>
        {partant ? PV.partantFait : PV.partant}
      </button>
    </div>
  );
}

/** 📅 Un rendez-vous (ou 💡 une idée de séance, `idee`) : son nom, quand. */
export function NouveauRdv({ gid, idee, onFermer, onAjoute }: { gid: string; idee: boolean; onFermer: () => void; onAjoute: (r: RdvGroupe | undefined, m: MessageGroupe | undefined) => void }) {
  const [maintenant] = useState(() => Date.now());
  const [nom, setNom] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>(idee ? "une" : "jour");
  const [jour, setJour] = useState(2);
  const [jours, setJours] = useState(1);
  const [h, setH] = useState(21);
  const [minute, setMinute] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const quand = aParis(jours, h, minute, maintenant);
  const nomJour = (j: number) => (j === 0 ? "Aujourd’hui" : j === 1 ? "Demain" : quandLisible(aParis(j, 12, 0, maintenant), maintenant).replace(/ \d.*$/, ""));
  const nomVu = nom.trim() || (idee ? "" : recurrence === "jour" ? PV.nomIndice : recurrence === "semaine" ? `La découverte du ${JOURS_SEMAINE[jour]}` : "Une séance spéciale");
  const passe = recurrence === "une" && quand < maintenant;

  async function ajouter() {
    if (envoi || passe || (idee && !nom.trim())) return;
    setEnvoi(true);
    setErreur("");
    const { ok, j } = await poster({ action: "rdv-ajouter", groupe: gid, nom: nomVu, recurrence, jour, heure: h, minute, quand, ...(idee ? { idee: true } : {}) });
    setEnvoi(false);
    if (!ok) return setErreur(String(j.error || "Ça n’a pas marché. Réessaie."));
    onAjoute(j.rdv as RdvGroupe | undefined, j.message as MessageGroupe | undefined);
  }

  return (
    <>
      <button type="button" className="gv-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="gv-feuille" role="dialog" aria-label={idee ? PV.ideeTitre : PV.nouveauTitre} data-feuille-rdv>
        <p className="gv-feuille-titre">{idee ? PV.ideeTitre : PV.nouveauTitre}</p>
        <label className="gv-champ">
          <span>{PV.sonNom}</span>
          <input type="text" maxLength={NOM_GROUPE_MAX} value={nom} onChange={(e) => setNom(e.target.value)} placeholder={idee ? "Le marathon du dimanche" : nomVu} data-rdv-nom />
        </label>
        {!idee && (
          <div className="gv-puces">
            {(["jour", "semaine", "une"] as const).map((x) => (
              <button key={x} type="button" className={`gv-puce${recurrence === x ? " pris" : ""}`} aria-pressed={recurrence === x} onClick={() => setRecurrence(x)} data-recurrence={x}>
                {x === "jour" ? PV.chaqueJour : x === "semaine" ? PV.chaqueSemaine : PV.uneFois}
              </button>
            ))}
          </div>
        )}
        {recurrence !== "jour" && (
          <>
            <p className="gv-etiquette">{PV.quelJour}</p>
            <div className="gv-puces">
              {recurrence === "semaine"
                ? JOURS_SEMAINE.map((n, k) => (
                    <button key={n} type="button" className={`gv-puce${jour === k ? " pris" : ""}`} aria-pressed={jour === k} onClick={() => setJour(k)} data-jour={k}>
                      {n}
                    </button>
                  ))
                : [0, 1, 2, 3, 4, 5, 6].map((j) => (
                    <button key={j} type="button" className={`gv-puce${jours === j ? " pris" : ""}`} aria-pressed={jours === j} onClick={() => setJours(j)} data-jours={j}>
                      {nomJour(j)}
                    </button>
                  ))}
            </div>
          </>
        )}
        <p className="gv-etiquette">{PV.heure}</p>
        <div className="gv-puces">
          {[9, 12, 14, 17, 18, 19, 20, 21, 22, 23].map((x) => (
            <button key={x} type="button" className={`gv-puce${h === x ? " pris" : ""}`} aria-pressed={h === x} onClick={() => setH(x)} data-heure={x}>
              {x} h
            </button>
          ))}
        </div>
        <div className="gv-puces">
          {[0, 15, 30, 45].map((x) => (
            <button key={x} type="button" className={`gv-puce${minute === x ? " pris" : ""}`} aria-pressed={minute === x} onClick={() => setMinute(x)} data-minute={x}>
              {String(h).padStart(2, "0")}:{String(x).padStart(2, "0")}
            </button>
          ))}
        </div>
        {erreur && (
          <p className="gv-erreur" role="alert">
            {erreur}
          </p>
        )}
        <button type="button" className="gv-ajouter" disabled={envoi || passe || (idee && !nom.trim())} onClick={() => void ajouter()} data-rdv-ajouter>
          {idee ? PV.ideeTitre : PV.creer}
          {recurrence === "une" && !passe ? ` · ${quandLisible(quand, maintenant)}` : ""}
        </button>
      </div>
    </>
  );
}

/** 👥 Les membres (l'onglet). */
export function OngletMembres({ membres }: { membres: PlaceGroupe[] }) {
  return (
    <div className="gv-membres" data-membres>
      {membres.map((p) => (
        <span key={p.q} className="gv-membre">
          <Tete p={p} />
          <b>{p.prenom}</b>
        </span>
      ))}
      <p className="gv-seuls">{PG.seulsMembres}</p>
    </div>
  );
}

export const STYLES_VIE_DU_GROUPE = `
.gv-onglets{display:flex;gap:6px;padding:0 16px;overflow-x:auto;scrollbar-width:none}
.gv-onglets::-webkit-scrollbar{display:none}
.gv-onglet{flex:none;min-height:42px;padding:0 15px;border:0;border-radius:999px;background:#1c1411;color:#cdb8a4;font:inherit;font-weight:800;font-size:14.5px;cursor:pointer}
.gv-onglet.pris{background:#FFF4E6;color:#120c09}
.gv-liste{display:flex;flex-direction:column;gap:10px;padding:0 16px}
.gv-aucun{margin:4px 16px;color:#cdb8a4;font-size:14px;text-align:center}
.gv-liste .gv-aucun{margin:4px 0}
.gv-rdv{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:20px;background:#1f1612;box-shadow:0 0 0 1px rgba(255,196,140,.12)}
.gv-rdv-haut{display:flex;align-items:center;gap:10px}
.gv-rdv-e{font-size:30px;line-height:1}
.gv-rdv-nom{flex:1;min-width:0;display:flex;flex-direction:column}
.gv-rdv-nom strong{font-size:16.5px;font-weight:800;overflow-wrap:anywhere}
.gv-rdv-nom span{color:#F2C46B;font-size:13.5px;font-weight:700}
.gv-entrer{display:inline-flex;align-items:center;min-height:40px;padding:0 15px;border-radius:999px;background:#f5a23a;color:#2a1500;font-weight:800;font-size:14px;text-decoration:none}
.gv-viennent{display:flex;flex-wrap:wrap;gap:4px}
.gv-tete{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;overflow:hidden;background:#3a2430;flex:none;vertical-align:middle}
.gv-tete img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.gv-reponses{display:flex;gap:6px;flex-wrap:wrap}
.gv-rep{min-height:42px;padding:0 15px;border:1px solid rgba(255,196,140,.28);border-radius:999px;background:#1c1411;color:#FFF4E6;font:inherit;font-weight:800;font-size:14px;cursor:pointer}
.gv-rep.pris{border-color:#FFF4E6;background:#FFF4E6;color:#120c09}
.gv-rep.viens.pris{border-color:#3ddc97;background:#3ddc97;color:#06301a}
.gv-rep:disabled{cursor:default}
.gv-retirer{align-self:flex-start;min-height:36px;padding:0;border:0;background:none;color:#a8927e;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}
.gv-nouveau{min-height:48px;border:1px dashed rgba(255,196,140,.45);border-radius:18px;background:none;color:#F2C46B;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.gv-discussion{display:flex;flex-direction:column;gap:10px;padding:0 16px}
.gv-fil{display:flex;flex-direction:column;gap:8px}
.gv-fil .gv-aucun{margin:4px 0}
.gv-msg{display:flex;align-items:flex-end;gap:6px;max-width:86%}
.gv-msg.mien{align-self:flex-end}
.gv-bulle{display:flex;flex-direction:column;padding:8px 12px;border-radius:18px 18px 18px 6px;background:#2a1d18;font-size:15px;line-height:1.3}
.gv-msg.mien .gv-bulle{border-radius:18px 18px 6px 18px;background:#ff2e9a;color:#fff}
.gv-bulle b{color:#F2C46B;font-size:12.5px}
.gv-bulle span{overflow-wrap:anywhere}
.gv-bulle i{align-self:flex-end;font-style:normal;font-size:11px;opacity:.7}
.gv-idee{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:12px 14px;border-radius:20px;background:linear-gradient(150deg,#3a2a10,#1f1612);box-shadow:0 0 0 1px rgba(242,196,107,.35)}
.gv-idee-de{display:flex;align-items:center;gap:6px;margin:0;font-size:13px}
.gv-idee strong{font-size:16px;font-weight:800;overflow-wrap:anywhere}
.gv-idee-quand{color:#F2C46B;font-size:13.5px;font-weight:700}
.gv-idee-bouton{align-self:flex-start;min-height:42px;padding:0 15px;border:1px solid rgba(242,196,107,.45);border-radius:999px;background:none;color:#F2C46B;font:inherit;font-weight:800;font-size:14px;cursor:pointer}
.gv-ecrire{display:flex;gap:8px;position:sticky;bottom:0;padding:8px 0 calc(8px + env(safe-area-inset-bottom));background:#120c09}
.gv-ecrire input{flex:1;min-width:0;min-height:46px;padding:0 14px;border:1px solid rgba(255,196,140,.3);border-radius:999px;background:#1c1411;color:#FFF4E6;font:inherit;font-size:16px}
.gv-ecrire button{min-height:46px;padding:0 16px;border:0;border-radius:999px;background:#ff2e9a;color:#fff;font:inherit;font-weight:800;font-size:14.5px;cursor:pointer}
.gv-ecrire button:disabled{opacity:.5;cursor:default}
.gv-membres{display:flex;flex-wrap:wrap;gap:12px;padding:0 16px}
.gv-membre{display:flex;flex-direction:column;align-items:center;gap:4px;width:64px;text-align:center}
.gv-membre .gv-tete{width:56px;height:56px}
.gv-membre b{font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.gv-seuls{width:100%;margin:4px 0 0;text-align:center;color:#a8927e;font-size:12px}
.gv-voile{position:fixed;inset:0;z-index:70;border:0;background:rgba(0,0,0,.55);cursor:pointer}
.gv-feuille{position:fixed;left:0;right:0;bottom:0;z-index:71;display:flex;flex-direction:column;gap:10px;max-height:88vh;overflow-y:auto;max-width:560px;margin:0 auto;padding:18px 16px calc(18px + env(safe-area-inset-bottom));border-radius:24px 24px 0 0;background:#1c1411;box-sizing:border-box}
.gv-feuille-titre{margin:0;font-size:19px;font-weight:800}
.gv-champ{display:flex;flex-direction:column;gap:6px}
.gv-champ span,.gv-etiquette{color:#F2C46B;font-weight:800;font-size:14.5px}
.gv-etiquette{margin:4px 0 0}
.gv-champ input{min-height:48px;padding:0 14px;border:1px solid rgba(255,196,140,.3);border-radius:14px;background:#120c09;color:#FFF4E6;font:inherit;font-size:16px}
.gv-puces{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.gv-puces::-webkit-scrollbar{display:none}
.gv-puce{flex:none;min-height:40px;padding:0 13px;border:1px solid rgba(255,196,140,.28);border-radius:999px;background:#120c09;color:#FFF4E6;font:inherit;font-size:14px;font-weight:700;white-space:nowrap;cursor:pointer}
.gv-puce.pris{border-color:#ff2e9a;background:rgba(255,46,154,.2);color:#fff}
.gv-erreur{margin:0;padding:10px 14px;border-radius:14px;background:rgba(255,80,80,.14);color:#ffd0d0;font-size:14px}
.gv-ajouter{min-height:52px;margin-top:6px;border:0;border-radius:999px;background:linear-gradient(135deg,#ff4fb0,#ff2e9a);color:#fff;font:inherit;font-weight:800;font-size:16px;cursor:pointer}
.gv-ajouter:disabled{opacity:.5;cursor:default}
.gv-dit{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));z-index:80;transform:translateX(-50%);max-width:88vw;padding:12px 16px;border-radius:16px;background:#FFF4E6;color:#120c09;font-weight:700;font-size:14.5px;box-shadow:0 10px 30px rgba(0,0,0,.4)}
`;
