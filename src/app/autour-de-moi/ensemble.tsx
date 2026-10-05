"use client";

// 🤝 ENSEMBLE — l'onglet qui remplace « Propositions ».
//
// « "Ensemble" permet de poursuivre les échanges. » Deux blocs, dans l'ordre
// de ce qui compte : ce qu'on attend de moi (« À toi de jouer »), puis les
// conversations où je suis (« Nos discussions »).
//
// RIEN N'EST UNE SECONDE MESSAGERIE. Chaque carte et chaque ligne ouvrent le
// salon qui existe déjà — on y vote, on y propose une alternative, on y
// invite, on y demande une table. Les données viennent des salons, calculées
// dans `lib/direct/ensemble.ts` : voter fait disparaître la carte, écrire fait
// remonter la conversation.
//
// LES AVATARS SONT DES INITIALES. Les maquettes montrent des visages ; nous
// n'avons pas celui de vos amis, et un visage pris ailleurs mentirait sur qui
// parle.
import { useState, type ReactNode } from "react";
import { aToiDeJouer, ilYa, nosDiscussions, type Discussion } from "@/lib/direct/ensemble";
import { archiverSalon, type Salon } from "@/lib/direct/salons";
import { repondreInvitation, type SalonADecouvrir } from "@/lib/direct/conversations-sync";

/**
 * MES SALONS : ceux dont je suis membre. Dans la vraie ville, un salon public
 * que je lis sans l'avoir rejoint, une invitation pas encore acceptée ou une
 * demande d'entrée en attente n'en font pas partie (`salon.acces`).
 */
export function salonsDontJeSuisMembre(salons: Record<string, Salon>): Record<string, Salon> {
  return Object.fromEntries(Object.entries(salons).filter(([, x]) => !x.acces || x.acces.statut === "membre"));
}

const TEINTES = ["#FF5FA8", "#F5A23A", "#7FB7FF", "#7BD3A8", "#C99BFF", "#FF8A65"];
function teinte(nom: string): string {
  let h = 0;
  for (const c of nom) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TEINTES[h % TEINTES.length];
}

function Avatar({ nom, petit }: { nom: string; petit?: boolean }) {
  return (
    <span className={`en-av${petit ? " petit" : ""}`} style={{ background: teinte(nom) }} aria-hidden="true">
      {(nom.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

export function Ensemble({
  salons,
  lus,
  cestMoi,
  moi,
  onOuvrir,
  onLancer,
  enPlus,
  demandeLancer = 0,
  aDecouvrir = [],
  onVoirPublic,
}: {
  salons: Record<string, Salon>;
  /** Vraie ville : les salons publics de la ville que je n'ai pas rejoints. */
  aDecouvrir?: SalonADecouvrir[];
  /** Ouvre un salon public en lecture, sans le rejoindre. */
  onVoirPublic?: (id: string) => void;
  lus: Record<string, number>;
  cestMoi: (qui: string) => boolean;
  /** Mon prénom tel que les salons l'écrivent. */
  moi: string;
  /** Ouvre le salon — la vraie conversation. */
  onOuvrir: (cle: string) => void;
  /** Crée un salon privé sur ce sujet, et l'ouvre. */
  onLancer: (sujet: string) => void;
  /** Les feuilles qu'un essai gardé peut ouvrir. */
  enPlus?: ReactNode;
  /** Change à chaque appui sur le fantôme de la barre : il lance une discussion. */
  demandeLancer?: number;
}) {
  const miens = salonsDontJeSuisMembre(salons);
  const attentes = aToiDeJouer(miens, cestMoi, lus, moi);
  const { actives, archives } = nosDiscussions(miens, cestMoi, lus);
  // LES INVITATIONS À MON NOM, ET MES DEMANDES D'ENTRÉE EN ATTENTE.
  const invitations = Object.values(salons).filter((x) => x.acces?.statut === "invite");
  const enAttente = Object.values(salons).filter((x) => x.acces?.statut === "demande");
  const [reponse, setReponse] = useState("");
  const [voirArchives, setVoirArchives] = useState(false);
  const [lancer, setLancer] = useState(false);
  // LE FANTÔME DE LA BARRE DEMANDE, LA PAGE OUVRE. Une demande nouvelle se
  // voit pendant le rendu : pas d'effet, pas de rendu de trop.
  const [demandeVue, setDemandeVue] = useState(demandeLancer);
  if (demandeLancer !== demandeVue) {
    setDemandeVue(demandeLancer);
    setLancer(true);
  }
  const [sujet, setSujet] = useState("");
  const liste = voirArchives ? archives : actives;

  const lancerMaintenant = () => {
    const t = sujet.trim();
    if (!t) return;
    onLancer(t);
    setSujet("");
    setLancer(false);
  };

  return (
    <div className="en">
      <StylesEnsemble />
      <header className="en-tete">
        <div>
          <h1>Ensemble</h1>
          <p>Nos échanges, nos envies, la suite à décider.</p>
        </div>
        <button type="button" className="en-crayon" onClick={() => setLancer((v) => !v)} aria-label="Lancer une discussion">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
            <path d="m13.5 6.5 4 4" />
          </svg>
        </button>
      </header>

      {lancer && (
        <form
          className="en-lancer"
          onSubmit={(e) => {
            e.preventDefault();
            lancerMaintenant();
          }}
        >
          <label htmlFor="en-sujet">De quoi voulez-vous parler ?</label>
          <div>
            <input
              id="en-sujet"
              autoFocus
              value={sujet}
              maxLength={80}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Un resto vendredi, une sortie samedi…"
            />
            <button type="submit" disabled={!sujet.trim()}>
              Lancer
            </button>
          </div>
          <small>Tu inviteras tes amis dans la discussion, par un lien.</small>
        </form>
      )}

      {/* ═══ LES INVITATIONS ═══ — à accepter ou refuser, ici. Une invitation
          en attente n'est pas une participation : le salon n'apparaît dans
          mes discussions qu'une fois accepté. */}
      {(invitations.length > 0 || enAttente.length > 0) && (
        <section className="en-bloc">
          <h2>
            <i aria-hidden="true" />
            Invitations
          </h2>
          {invitations.map((x) => (
            <div key={x.cle} className="en-invit">
              <button type="button" className="en-invit-t" onClick={() => onOuvrir(x.cle)}>
                <b>{x.sujet}</b>
                <em>
                  {x.acces?.prive ? "🔒 Privé" : "🌍 Public"} · invitation de {x.acces?.invitePar || x.parQui}
                </em>
              </button>
              <button type="button" className="en-invit-oui" onClick={async () => setReponse((await repondreInvitation(x, true)) ?? "")}>
                Accepter
              </button>
              <button type="button" className="en-invit-non" onClick={async () => setReponse((await repondreInvitation(x, false)) ?? "")}>
                Refuser
              </button>
            </div>
          ))}
          {enAttente.map((x) => (
            <div key={x.cle} className="en-invit">
              <span className="en-invit-t">
                <b>{x.sujet}</b>
                <em>🔒 Ta demande d’entrée attend la réponse du créateur.</em>
              </span>
            </div>
          ))}
          {reponse && <p className="en-vide">{reponse}</p>}
        </section>
      )}

      {/* ═══ À TOI DE JOUER ═══ — seulement ce qui attend vraiment. */}
      <section className="en-bloc">
        <h2>
          <i aria-hidden="true" />À toi de jouer
        </h2>
        {attentes.length === 0 ? (
          <p className="en-vide">Rien ne t’attend pour l’instant. Les avis demandés et les idées à départager arrivent ici.</p>
        ) : (
          attentes.map((a) => (
            <button key={a.cle} type="button" className="en-attente" onClick={() => onOuvrir(a.cle)}>
              <Avatar nom={a.qui} />
              <span className="en-attente-t">
                <b>{a.titre}</b>
                <em>{a.contexte}</em>
              </span>
              {a.photos && a.photos.length > 0 && (
                <span className="en-vignettes" aria-hidden="true">
                  {a.photos.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p} src={p} alt="" loading="lazy" />
                  ))}
                </span>
              )}
              <span className="en-geste">
                {a.libelle} <s aria-hidden="true">→</s>
              </span>
            </button>
          ))
        )}
      </section>

      {/* ═══ NOS DISCUSSIONS ═══ — les salons où je suis, les plus récents d'abord. */}
      <section className="en-bloc">
        <h2>
          <i aria-hidden="true" />
          {voirArchives ? "Archives" : "Nos discussions"}
          {(archives.length > 0 || voirArchives) && (
            <button type="button" className="en-archives" onClick={() => setVoirArchives((v) => !v)}>
              {voirArchives ? "Retour" : `Archives (${archives.length})`} <s aria-hidden="true">›</s>
            </button>
          )}
        </h2>
        {liste.length === 0 && (
          <p className="en-vide">
            {voirArchives
              ? "Aucune discussion archivée."
              : "Aucune discussion en cours. Lance-en une, ou propose une annonce à tes amis depuis Le Direct."}
          </p>
        )}
        {liste.map((d) => (
          <LigneDiscussion key={d.cle} d={d} onOuvrir={() => onOuvrir(d.cle)} />
        ))}
        {!voirArchives && (
          <button type="button" className="en-nouvelle" onClick={() => setLancer(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16v11H9l-5 4V5Z" />
            </svg>
            Lancer une discussion
          </button>
        )}
      </section>

      {/* ═══ SALONS PUBLICS À DÉCOUVRIR ═══ — vraie ville : ceux de la ville que
          je n'ai pas rejoints. Les ouvrir ne me fait pas entrer. */}
      {aDecouvrir.length > 0 && onVoirPublic && (
        <section className="en-bloc">
          <h2>
            <i aria-hidden="true" />
            Salons publics à découvrir
          </h2>
          {aDecouvrir.map((x) => (
            <button key={x.id} type="button" className="en-invit en-pub" onClick={() => onVoirPublic(x.id)}>
              <span className="en-invit-t">
                <b>{x.sujet}</b>
                <em>
                  🌍 Salon public · ouvert par {x.parQui || "un habitant"} · {x.nb} participant{x.nb > 1 ? "s" : ""}
                </em>
                {x.dernier && (
                  <em>
                    {x.dernier.qui} : {x.dernier.texte}
                  </em>
                )}
              </span>
              <s aria-hidden="true">Voir la discussion ›</s>
            </button>
          ))}
        </section>
      )}

      {enPlus}
    </div>
  );
}

function LigneDiscussion({ d, onOuvrir }: { d: Discussion; onOuvrir: () => void }) {
  const quand = ilYa(d.activite) || d.jour || "";
  return (
    <div className={`en-disc${d.nonLus ? " neuf" : ""}`}>
      <button type="button" className="en-disc-b" onClick={onOuvrir}>
        <span className="en-pile" aria-hidden="true">
          {d.avec.slice(0, 3).map((q) => (
            <Avatar key={q} nom={q} petit />
          ))}
          {d.avec.length === 0 && <Avatar nom="?" petit />}
        </span>
        <span className="en-disc-t">
          <span className="en-disc-l">
            <b>{d.titre}</b>
            {d.nonLus > 0 ? (
              <span className="en-neufs">
                ✦ {d.nonLus} nouveau{d.nonLus > 1 ? "x" : ""}
              </span>
            ) : (
              quand && <span className="en-date">{quand}</span>
            )}
          </span>
          <em>{d.qui}</em>
        </span>
        {d.dernier && (
          <span className="en-dernier">
            <b>{d.dernier.qui} :</b> {d.dernier.texte}
          </span>
        )}
        {d.table && <span className="en-table">📅 {d.table}</span>}
        <s className="en-chev" aria-hidden="true">
          ›
        </s>
      </button>
      {d.ouvert && (
        <button type="button" className="en-ranger" onClick={() => archiverSalon(d.cle, !d.archive)}>
          {d.archive ? "Ressortir" : "Archiver"}
        </button>
      )}
    </div>
  );
}

/* LA CHARTE DES MAQUETTES : brun chaud, or, rose, textes clairs. */
function StylesEnsemble() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.en::-webkit-scrollbar{display:none;}
.en{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain;padding:4px 2px calc(28px + env(safe-area-inset-bottom,0px));
  color:#FFF4E6;font-family:var(--font-clikme),system-ui,sans-serif;}
.en-tete{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin:2px 4px 18px;}
.en-tete h1{margin:0;font-size:34px;font-weight:800;letter-spacing:-.02em;line-height:1.05;}
.en-tete p{margin:6px 0 0;font-size:15px;color:#D9C6B2;}
.en-crayon{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:16px;cursor:pointer;
  background:#2A1E18;border:1px solid rgba(255,214,170,.18);color:#FFF4E6;}
.en-crayon svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round;}
.en-lancer{margin:0 2px 18px;padding:14px;border-radius:18px;background:#241A15;border:1px solid rgba(245,162,58,.35);}
.en-lancer label{display:block;font-weight:700;font-size:15px;margin-bottom:10px;}
.en-lancer div{display:flex;gap:8px;}
.en-lancer input{flex:1;min-width:0;height:46px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,214,170,.22);
  background:#17100D;color:#FFF4E6;font:inherit;font-size:15px;}
.en-lancer button{height:46px;padding:0 18px;border-radius:999px;border:0;cursor:pointer;font:inherit;font-weight:800;
  background:#F5A23A;color:#2A1608;}
.en-lancer button:disabled{opacity:.45;}
.en-lancer small{display:block;margin-top:8px;font-size:12px;color:#BFA894;}
.en-bloc{margin-bottom:24px;}
.en-invit{display:flex;align-items:center;gap:8px;width:100%;margin-bottom:8px;padding:12px;border-radius:16px;border:1px solid rgba(255,214,170,.2);
  background:rgba(255,244,230,.05);color:#FFF4E6;font:inherit;text-align:left;}
.en-invit-t{flex:1;min-width:0;display:grid;gap:2px;padding:0;border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;}
.en-invit-t b{font-size:15.5px;overflow-wrap:anywhere;}
.en-invit-t em{font-style:normal;font-size:12.5px;color:#CDB9A5;overflow-wrap:anywhere;}
.en-invit button.en-invit-oui,.en-invit button.en-invit-non{flex:none;height:34px;padding:0 12px;border-radius:999px;border:0;font:inherit;font-size:13px;font-weight:800;cursor:pointer;}
.en-invit-oui{background:#F5A23A;color:#2A1608;}
.en-invit-non{background:rgba(255,244,230,.12);color:#FFF4E6;}
.en-pub{cursor:pointer;flex-wrap:wrap;}
.en-pub s{text-decoration:none;font-size:13px;font-weight:800;color:#F5A23A;}
.en-bloc h2{display:flex;align-items:center;gap:10px;margin:0 4px 12px;font-size:23px;font-weight:800;letter-spacing:-.01em;}
.en-bloc h2 i{width:12px;height:12px;border-radius:50%;background:#F5A23A;box-shadow:0 0 10px rgba(245,162,58,.6);}
.en-archives{margin-left:auto;border:0;background:none;color:#CDB9A5;font:inherit;font-size:14px;font-weight:600;cursor:pointer;}
.en-archives s{text-decoration:none;}
.en-vide{margin:0 4px;padding:16px;border-radius:16px;border:1px dashed rgba(255,214,170,.2);font-size:14px;color:#CDB9A5;line-height:1.4;}
.en-attente{display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"av t v" "av g g";align-items:center;column-gap:12px;row-gap:6px;
  width:100%;margin-bottom:10px;padding:12px 14px;border-radius:18px;cursor:pointer;text-align:left;color:inherit;font:inherit;
  background:linear-gradient(180deg,#2A1E18,#211813);border:1px solid rgba(255,214,170,.14);}
.en-attente .en-av{grid-area:av;}
.en-attente-t{grid-area:t;min-width:0;}
.en-attente-t b{display:block;font-size:16px;font-weight:700;line-height:1.25;}
.en-attente-t em{display:block;font-style:normal;font-size:14px;color:#CDB9A5;margin-top:2px;}
.en-vignettes{grid-area:v;display:flex;gap:6px;}
.en-vignettes img{width:44px;height:58px;object-fit:cover;border-radius:10px;border:1px solid rgba(255,214,170,.25);}
.en-geste{grid-area:g;justify-self:end;font-size:14px;font-weight:700;color:#F5A23A;}
.en-geste s{text-decoration:none;}
.en-av{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:50%;font-weight:800;font-size:21px;
  color:#1C1009;border:2px solid #1C1411;}
.en-av.petit{width:38px;height:38px;font-size:16px;}
.en-disc{position:relative;margin-bottom:10px;}
.en-disc-b{display:grid;grid-template-columns:auto 1fr;grid-template-areas:"p t" "d d" "x x";align-items:center;column-gap:12px;row-gap:8px;
  width:100%;padding:14px 34px 30px 14px;border-radius:18px;cursor:pointer;text-align:left;color:inherit;font:inherit;
  background:#211813;border:1px solid rgba(255,214,170,.14);}
.en-disc.neuf .en-disc-b{border-color:rgba(255,46,154,.35);}
.en-pile{grid-area:p;display:flex;}
.en-pile .en-av + .en-av{margin-left:-12px;}
.en-disc-t{grid-area:t;min-width:0;}
.en-disc-l{display:flex;align-items:center;gap:8px;}
.en-disc-l{align-items:flex-start;}
.en-disc-l b{flex:1;min-width:0;font-size:16px;font-weight:700;line-height:1.25;overflow:hidden;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.en-disc-t em{display:block;font-style:normal;font-size:13px;color:#CDB9A5;margin-top:2px;}
.en-neufs{flex:none;display:inline-block;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap;
  color:#FF7DBE;background:rgba(255,46,154,.14);border:1px solid rgba(255,46,154,.35);}
.en-date{flex:none;font-size:12px;color:#BFA894;white-space:nowrap;}
.en-dernier{grid-area:d;font-size:14px;color:#EADBC8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.en-dernier b{color:#F5A23A;font-weight:700;}
.en-table{grid-area:x;font-size:13px;color:#F5C27A;}
.en-chev{position:absolute;right:14px;top:50%;transform:translateY(-50%);text-decoration:none;font-size:24px;color:#CDB9A5;}
.en-ranger{position:absolute;right:14px;bottom:6px;border:0;background:none;color:#9C8775;font:inherit;font-size:12px;cursor:pointer;padding:4px;}
.en-nouvelle{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:56px;margin-top:6px;border-radius:999px;cursor:pointer;
  background:none;border:1.5px solid rgba(255,244,230,.65);color:#FFF4E6;font:inherit;font-size:16px;font-weight:700;}
.en-nouvelle svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linejoin:round;}
`,
      }}
    />
  );
}
