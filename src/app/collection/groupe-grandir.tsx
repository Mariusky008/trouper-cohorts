"use client";

/**
 * 🌱 LE GROUPE QUI GRANDIT (Mes groupes, le lot G8, 26 novembre 2026 ; `lib/direct/groupes-grandir-serveur.ts`, la
 * maquette G0 validée, planche « Groupe ») : l'onglet Membres (leurs têtes, le rôle du jour de chacun, « ＋ Accueillir
 * quelqu'un », « Quitter le groupe », « 🚩 Signaler ») et « ＋ thème » dans son identité.
 */
import { useEffect, useMemo, useState } from "react";
import { THEMES_DECOUVRIR, type IdTheme } from "@/lib/direct/decouvrir";
import { MOTIFS_SIGNALEMENT } from "@/lib/direct/salons-ouverts";
import { PHRASES_GRANDIR as PGR, PHRASES_GROUPES_GARDES as PG, type AccueilGroupe, type GroupeVue, type MessageGroupe, type PlaceGroupe, type RoleDuJour } from "@/lib/direct/groupes";
import { poster } from "./groupe-vie";

function Tete({ p, taille }: { p: { prenom: string; src: string }; taille?: number }) {
  return (
    <span className="gg-tete" title={p.prenom} style={taille ? { width: taille, height: taille } : undefined}>
      {p.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.src} alt={p.prenom} draggable={false} />
      ) : (
        <span aria-hidden="true">🙂</span>
      )}
    </span>
  );
}

/** 👥 L'onglet Membres. */
export function OngletMembresDuGroupe({
  g,
  roles,
  accueils,
  setAccueils,
  messages,
  onDit,
  onQuitte,
}: {
  g: GroupeVue;
  roles: RoleDuJour[];
  accueils: AccueilGroupe[];
  setAccueils: (a: AccueilGroupe[]) => void;
  messages: MessageGroupe[];
  onDit: (t: string) => void;
  onQuitte: () => void;
}) {
  const [feuille, setFeuille] = useState<"accueillir" | "signaler" | null>(null);
  const [quitter, setQuitter] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function partant(a: AccueilGroupe) {
    if (envoi || a.moi) return;
    setEnvoi(true);
    const { ok, j } = await poster({ action: "accueil-partant", groupe: g.id, q: a.q });
    setEnvoi(false);
    if (!ok) return onDit(String(j.error || "Ça n’a pas marché. Réessaie."));
    if (Array.isArray(j.accueils)) setAccueils(j.accueils as AccueilGroupe[]);
    if (j.invite) onDit(PGR.accueillirInvite(a.prenom));
  }
  async function partir() {
    if (envoi) return;
    setEnvoi(true);
    const { ok, j } = await poster({ action: "quitter-groupe", groupe: g.id });
    setEnvoi(false);
    if (!ok) return onDit(String(j.error || "Ça n’a pas marché. Réessaie."));
    onQuitte();
  }

  return (
    <div className="gg" data-membres>
      {g.membres.map((p) => {
        const r = roles.find((x) => x.qui.q === p.q);
        return (
          <div key={p.q} className="gg-ligne" data-membre={p.q}>
            <Tete p={p} taille={44} />
            <b>{p.prenom}</b>
            {r && (
              <span className="gg-badge" title={r.nom} aria-label={r.nom}>
                {r.e}
              </span>
            )}
          </div>
        );
      })}
      {accueils.map((a) => (
        <div key={a.q} className="gg-accueil" data-accueil={a.q}>
          <Tete p={a} taille={44} />
          <div className="gg-accueil-t">
            <b>{a.invite ? PGR.accueillirInvite(a.prenom) : PGR.accueillirQuestion(a.prenom)}</b>
            <span>{PGR.proposePar(a.de)}</span>
            <span className="gg-pile">
              {a.partants.map((p) => (
                <Tete key={p.q} p={p} taille={26} />
              ))}
            </span>
          </div>
          {!a.invite && (
            <button type="button" className={`gg-partant${a.moi ? " pris" : ""}`} aria-pressed={Boolean(a.moi)} disabled={envoi || a.moi} onClick={() => void partant(a)} data-accueil-partant>
              {a.moi ? "✓ Partant" : "Partant !"}
            </button>
          )}
        </div>
      ))}
      <button type="button" className="gg-accueillir" onClick={() => setFeuille("accueillir")} data-accueillir>
        {PGR.accueillir}
      </button>
      {quitter ? (
        <div className="gg-quitter-oui" data-quitter-confirmer>
          <p>{PGR.quitterDit}</p>
          <div>
            <button type="button" className="gg-lien" onClick={() => setQuitter(false)}>
              {PGR.quitterNon}
            </button>
            <button type="button" className="gg-quitter-bouton" disabled={envoi} onClick={() => void partir()} data-quitter-oui>
              {PGR.quitterOui}
            </button>
          </div>
        </div>
      ) : (
        <div className="gg-bas">
          <button type="button" className="gg-lien souligne" onClick={() => setQuitter(true)} data-quitter>
            {PGR.quitter}
          </button>
          {g.membres.some((p) => p.q !== g.moi) && (
            <button type="button" className="gg-lien" onClick={() => setFeuille("signaler")} data-signaler>
              {PGR.signaler}
            </button>
          )}
        </div>
      )}
      <p className="gg-seuls">{PG.seulsMembres}</p>

      {feuille === "accueillir" && (
        <Accueillir
          gid={g.id}
          onFermer={() => setFeuille(null)}
          onPropose={(l, prenom) => {
            setFeuille(null);
            setAccueils(l);
            onDit(PGR.accueillirPropose(prenom));
          }}
        />
      )}
      {feuille === "signaler" && (
        <Signaler
          g={g}
          messages={messages}
          onFermer={() => setFeuille(null)}
          onFait={(prenom) => {
            setFeuille(null);
            onDit(PGR.signale(prenom));
          }}
        />
      )}
    </div>
  );
}

type Proche = { cle: string; prenom: string; image?: string; lien?: string };

function Accueillir({ gid, onFermer, onPropose }: { gid: string; onFermer: () => void; onPropose: (l: AccueilGroupe[], prenom: string) => void }) {
  const [proches, setProches] = useState<Proche[] | null>(null);
  const [envoi, setEnvoi] = useState("");
  const [erreur, setErreur] = useState("");
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/proches", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { proches?: Proche[] }) => !fini && setProches((j.proches ?? []).filter((p) => p.lien === "proches")))
      .catch(() => !fini && setProches([]));
    return () => {
      fini = true;
    };
  }, []);
  async function proposer(p: Proche) {
    if (envoi) return;
    setEnvoi(p.cle);
    setErreur("");
    const { ok, j } = await poster({ action: "accueil-proposer", groupe: gid, cle: p.cle });
    setEnvoi("");
    if (!ok) return setErreur(String(j.error || "Ça n’a pas marché. Réessaie."));
    onPropose((j.accueils as AccueilGroupe[]) ?? [], p.prenom);
  }
  return (
    <>
      <button type="button" className="gv-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="gv-feuille" role="dialog" aria-label={PGR.accueillirTitre} data-feuille-accueillir>
        <p className="gv-feuille-titre">{PGR.accueillirTitre}</p>
        <p className="gg-dit">{PGR.accueillirDit}</p>
        {proches && !proches.length ? (
          <p className="gg-dit">{PGR.accueillirAucun}</p>
        ) : (
          <div className="gv-puces">
            {(proches ?? []).map((p) => (
              <button key={p.cle} type="button" className="gg-proche" disabled={Boolean(envoi)} onClick={() => void proposer(p)} data-accueillir-proche={p.cle}>
                <Tete p={{ prenom: p.prenom, src: p.image ?? "" }} taille={56} />
                <b>{p.prenom}</b>
              </button>
            ))}
          </div>
        )}
        {erreur && (
          <p className="gv-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
    </>
  );
}

function Signaler({ g, messages, onFermer, onFait }: { g: GroupeVue; messages: MessageGroupe[]; onFermer: () => void; onFait: (prenom: string) => void }) {
  const autres = g.membres.filter((p) => p.q !== g.moi);
  const [qui, setQui] = useState<PlaceGroupe | null>(null);
  const [motif, setMotif] = useState<string>(MOTIFS_SIGNALEMENT[0]);
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const siens = useMemo(() => (qui ? messages.filter((m) => m.q === qui.q).slice(-4) : []), [messages, qui]);
  async function envoyer() {
    if (!qui || envoi) return;
    setEnvoi(true);
    setErreur("");
    const { ok, j } = await poster({ action: "signaler-groupe", groupe: g.id, q: qui.q, motif, ...(message ? { message } : {}) });
    setEnvoi(false);
    if (!ok) return setErreur(String(j.error || "Ça n’a pas marché. Réessaie."));
    onFait(qui.prenom);
  }
  return (
    <>
      <button type="button" className="gv-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="gv-feuille" role="dialog" aria-label={PGR.signalerTitre} data-feuille-signaler>
        <p className="gv-feuille-titre">{PGR.signalerTitre}</p>
        <p className="gv-etiquette">{PGR.signalerQui}</p>
        <div className="gv-puces">
          {autres.map((p) => (
            <button key={p.q} type="button" className={`gg-proche${qui?.q === p.q ? " pris" : ""}`} aria-pressed={qui?.q === p.q} onClick={() => (setQui(p), setMessage(""))} data-signaler-qui={p.q}>
              <Tete p={p} taille={52} />
              <b>{p.prenom}</b>
            </button>
          ))}
        </div>
        {qui && (
          <>
            <p className="gv-etiquette">{PGR.signalerQuoi}</p>
            <div className="gg-motifs">
              {MOTIFS_SIGNALEMENT.map((m) => (
                <button key={m} type="button" className={`gv-puce${motif === m ? " pris" : ""}`} aria-pressed={motif === m} onClick={() => setMotif(m)}>
                  {m}
                </button>
              ))}
            </div>
            {siens.length > 0 && (
              <>
                <p className="gv-etiquette">{PGR.signalerMessage}</p>
                <div className="gg-motifs">
                  {siens.map((m) => (
                    <button key={m.id} type="button" className={`gv-puce gg-message${message === m.id ? " pris" : ""}`} aria-pressed={message === m.id} onClick={() => setMessage(message === m.id ? "" : m.id)} data-signaler-message={m.id}>
                      « {m.texte} »
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {erreur && (
          <p className="gv-erreur" role="alert">
            {erreur}
          </p>
        )}
        <button type="button" className="gv-ajouter" disabled={!qui || envoi} onClick={() => void envoyer()} data-signaler-envoyer>
          {PGR.signalerEnvoyer}
        </button>
      </div>
    </>
  );
}

/** 🌱 ＋ thème (dans son identité). */
export function PlusTheme({ g, adulte, onFermer, onAjoute }: { g: GroupeVue; adulte: boolean; onFermer: () => void; onAjoute: (themes: IdTheme[], e: string) => void }) {
  const deja = new Set<string>([g.theme, ...(g.themes ?? [])]);
  const themes = THEMES_DECOUVRIR.filter((t) => (adulte || !t.adultes) && !deja.has(t.id));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  async function ajouter(t: IdTheme, e: string) {
    if (envoi) return;
    setEnvoi(true);
    setErreur("");
    const { ok, j } = await poster({ action: "theme-ajouter", groupe: g.id, theme: t });
    setEnvoi(false);
    if (!ok) return setErreur(String(j.error || "Ça n’a pas marché. Réessaie."));
    onAjoute((j.themes as IdTheme[]) ?? [], e);
  }
  return (
    <>
      <button type="button" className="gv-voile" aria-label="Fermer" onClick={onFermer} />
      <div className="gv-feuille" role="dialog" aria-label={PGR.themeTitre} data-feuille-theme>
        <p className="gv-feuille-titre">{PGR.themeTitre}</p>
        <p className="gg-dit">{PGR.themeDit}</p>
        <div className="gg-motifs">
          {themes.map((t) => (
            <button key={t.id} type="button" className="gv-puce" disabled={envoi} onClick={() => void ajouter(t.id, t.e)} data-theme-plus={t.id}>
              {t.e} {t.court}
            </button>
          ))}
        </div>
        {erreur && (
          <p className="gv-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
    </>
  );
}

export const STYLES_GRANDIR = `
.gg{display:flex;flex-direction:column;gap:8px;padding:0 16px}
.gg-tete{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;overflow:hidden;background:#3a2430;flex:none}
.gg-tete img{width:100%;height:100%;object-fit:cover;object-position:50% 14%}
.gg-ligne{display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:16px;background:#1f1612;box-shadow:0 0 0 1px rgba(255,196,140,.12)}
.gg-ligne b{flex:1;font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gg-badge{font-size:18px}
.gg-accueil{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:#1f1612;box-shadow:0 0 0 1px rgba(245,162,58,.45)}
.gg-accueil-t{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.gg-accueil-t b{font-size:15px}
.gg-accueil-t span{color:#cdb8a4;font-size:12.5px}
.gg-pile{display:flex;margin-top:2px}
.gg-pile .gg-tete{margin-left:-6px;box-shadow:0 0 0 2px #1f1612}
.gg-pile .gg-tete:first-child{margin-left:0}
.gg-partant{flex:none;min-height:40px;padding:0 14px;border:0;border-radius:999px;background:#f5a23a;color:#2a1500;font:inherit;font-weight:800;font-size:14px;cursor:pointer}
.gg-partant.pris{background:#3ddc97;color:#06301a;cursor:default}
.gg-accueillir{min-height:50px;border:1px dashed rgba(255,196,140,.45);border-radius:999px;background:none;color:#FFF4E6;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.gg-bas{display:flex;justify-content:space-between;margin-top:4px}
.gg-lien{min-height:40px;padding:0 6px;border:0;background:none;color:#cdb8a4;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
.gg-lien.souligne{text-decoration:underline}
.gg-quitter-oui{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:16px;background:#1f1612}
.gg-quitter-oui p{margin:0;font-size:14px}
.gg-quitter-oui div{display:flex;justify-content:flex-end;gap:8px}
.gg-quitter-bouton{min-height:40px;padding:0 16px;border:0;border-radius:999px;background:#FFF4E6;color:#120c09;font:inherit;font-weight:800;cursor:pointer}
.gg-seuls{margin:4px 0 0;text-align:center;color:#a8927e;font-size:12px}
.gg-dit{margin:0;color:#cdb8a4;font-size:14px}
.gg-proche{flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;width:76px;padding:6px 0;border:0;border-radius:16px;background:none;color:#FFF4E6;font:inherit;cursor:pointer}
.gg-proche b{font-size:12.5px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gg-proche.pris .gg-tete{box-shadow:0 0 0 3px #ff2e9a}
.gg-motifs{display:flex;flex-wrap:wrap;gap:6px}
.gg-message{white-space:normal;text-align:left;height:auto;padding:8px 12px}
.ge-plus-theme{display:inline-flex;align-items:center;min-height:32px;padding:0 13px;border:1px dashed rgba(255,244,230,.4);border-radius:999px;background:rgba(18,12,9,.25);color:#FFF4E6;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}
`;
