"use client";

/**
 * 🛋️ LA PIÈCE DU DUO — LA MAQUETTE (`docs/univers/piece-du-duo.md`, section 12). Ce que vivra celui qui ouvre une
 * conversation avec un proche :
 *
 * 1. L'ARRIVÉE : la pièce entière, dans la lumière de l'heure (le matin, le soir, la nuit) ; ce qui a changé depuis sa
 *    dernière visite se signale (un anneau sur l'objet, un mot), sinon rien — la surprise seulement quand il y a du neuf.
 * 2. LA CONVERSATION : la caméra glisse vers les deux places ; les bulles par-dessus.
 * 3. LE ZOOM : on touche un objet, la caméra s'en approche — la télé (celle de la session de l'univers, `TeleDuo` : le
 *    dernier lien, sinon le clip de secours du jour ; « ▶ Allumer la télé » donne le son sur iPhone), un cadre (la photo),
 *    l'étagère (les souvenirs), la platine, la fenêtre (la lumière), le coin du chat.
 * 4. CHANGER DE PIÈCE : une invitation (« Léa t'invite sur la terrasse »), acceptée d'un geste ; ou on invite l'autre.
 *
 * Les pièces, leurs lumières et l'image du duo sont les vraies (faite à la première visite d'une pièce dans une lumière) ;
 * les bulles, le lien, la photo et les souvenirs sont ceux de l'essai (« ⚙️ Pour l'essai »).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { TeleDuo } from "@/app/univers/tele-duo";
import { MOMENTS_DUO, zoneDesPlaces, type EtatPieceVivante, type MomentDuo, type PieceDuo, type PieceDuoVue, type Zone } from "@/lib/direct/pieces-duo";
import { CLIPS_DU_PROPRIETAIRE, programmeDuLien, secoursDuJour, type ClipSecours, type ProgrammeTele } from "@/lib/direct/tele";

const ROUTE = "/api/admin/direct/piece-vivante";
const TELE = "/api/admin/direct/tele";
type Objet = "tele" | "platine" | "cadre" | "etagere" | "fenetre" | "chat";
type Plan = { type: "piece" } | { type: "places" } | { type: "objet"; objet: Objet };

const DANS: Record<PieceDuo, string> = { salon: "dans le salon", cuisine: "dans la cuisine", terrasse: "sur la terrasse", chambre: "dans la chambre vue mer", cafe: "au café" };
const OBJETS: Record<Objet, { emoji: string; nom: string }> = {
  tele: { emoji: "📺", nom: "La télé" },
  platine: { emoji: "🎵", nom: "La platine" },
  cadre: { emoji: "🖼️", nom: "Le cadre" },
  etagere: { emoji: "📚", nom: "L’étagère" },
  fenetre: { emoji: "🪟", nom: "La fenêtre" },
  chat: { emoji: "🐾", nom: "Le coin du chat" },
};
const SOUVENIRS = [
  { emoji: "🎟️", dit: "Le concert de juin" },
  { emoji: "🧁", dit: "Ton anniversaire" },
  { emoji: "📅", dit: "Samedi : le marché" },
];
const PAROLES = [
  { qui: "autre", texte: "Je t’ai mis un clip sur la télé 📺" },
  { qui: "moi", texte: "Je l’allume ! Et notre photo est dans le cadre." },
  { qui: "autre", texte: `Trop bien. Samedi, on se retrouve ${DANS.terrasse} ?` },
  { qui: "moi", texte: "Invite-moi, j’arrive 😄" },
];
const pc = (x: number) => `${(x * 100).toFixed(3)}%`;

/** La caméra pour une zone (agrandie de `marge`) : son échelle et son décalage, en fractions de la scène. */
function camera(z: Zone | null, marge = 1): { s: number; tx: number; ty: number } {
  if (!z) return { s: 1, tx: 0, ty: 0 };
  const [x, y, w, h] = z;
  const s = Math.min(3, Math.max(1, Math.min(1 / (w * marge), 1 / (h * marge))));
  return { s, tx: Math.min(0, Math.max(1 - s, 0.5 - (x + w / 2) * s)), ty: Math.min(0, Math.max(1 - s, 0.5 - (y + h / 2) * s)) };
}

/** La zone d'un objet sur la pièce (le coin du chat : un point, entouré). */
function zoneDe(p: PieceDuoVue | undefined, o: Objet): Zone | null {
  const e = p?.emplacements;
  if (!e) return null;
  if (o === "chat") return e.chat ? [Math.max(0, e.chat.x - 0.17), Math.max(0, e.chat.y - 0.12), 0.34, 0.24] : null;
  if (o === "cadre") return e.cadres[0] ?? null;
  return e[o] ?? null;
}

/** La pièce dans une lumière : son image première dans son moment à elle, une retouche pour les deux autres. */
const lumiereDe = (p: PieceDuoVue | undefined, m: MomentDuo) => (p ? (m === p.moment ? p.decor : p.lumieres?.[m]) : undefined) || "";

export function MaquetteDuo() {
  const [etat, setEtat] = useState<EtatPieceVivante | null>(null);
  const [erreur, setErreur] = useState("");
  const [piece, setPiece] = useState<PieceDuo | "">("");
  const [moment, setMoment] = useState<MomentDuo | "">("");
  const [plan, setPlan] = useState<Plan>({ type: "piece" });
  const [arrivee, setArrivee] = useState(0);
  const [nouveaute, setNouveaute] = useState<{ objet: Objet; dit: string } | null>(null);
  const [bulles, setBulles] = useState(0);
  const [lien, setLien] = useState("");
  const [photo, setPhoto] = useState("");
  const [secours, setSecours] = useState<ClipSecours[]>(CLIPS_DU_PROPRIETAIRE);
  const [reglages, setReglages] = useState(false);
  const [choixPiece, setChoixPiece] = useState(false);
  const [invitation, setInvitation] = useState<PieceDuo | null>(null);
  const [envoi, setEnvoi] = useState<{ piece: PieceDuo; accepte: boolean } | null>(null);
  const [aide, setAide] = useState(false);
  const [installe, setInstalle] = useState("");
  const vus = useRef<Partial<Record<PieceDuo, { lien: string; photo: string }>>>({});
  const touche = useRef(false);
  const enCours = useRef<string>("");

  const recevoir = useCallback((e: EtatPieceVivante) => {
    setEtat(e);
    setPiece((p) => p || e.pieces.find((x) => x.decor)?.cle || "");
    setMoment((m) => m || e.maintenant);
  }, []);
  const charger = useCallback(async () => {
    const j = (await (await fetch(ROUTE, { cache: "no-store" })).json().catch(() => ({}))) as { etat?: EtatPieceVivante; error?: string };
    if (j.etat) recevoir(j.etat);
    else setErreur(j.error || "La maquette ne s’est pas chargée.");
    // (les clips de secours rangés par le propriétaire, sinon ses cinq premiers)
    const t = (await (await fetch(TELE, { cache: "no-store" })).json().catch(() => ({}))) as { secours?: ClipSecours[] };
    if (t.secours?.length) setSecours(t.secours);
  }, [recevoir]);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);

  const p = etat?.pieces.find((x) => x.cle === piece);
  // (la lumière de l'heure ; celle de la pièce si celle-ci n'est pas faite)
  const m: MomentDuo = moment && lumiereDe(p, moment) ? moment : (p?.moment ?? "matin");
  const fond = lumiereDe(p, m);
  const duo = etat?.duo?.duos[`${piece}-${m}`] ?? "";
  const autre = etat?.duo?.b.nom ?? "ton proche";
  const faites = etat?.pieces.filter((x) => x.decor) ?? [];
  // 📺 ce que passe la télé : le lien collé, sinon le clip de secours du jour (le même pour les deux ce jour-là)
  const programme: ProgrammeTele = useMemo(() => {
    const l = lien ? programmeDuLien(lien) : null;
    if (l) return l;
    const c = secoursDuJour(secours, `${etat?.duo?.a.id ?? ""}-${etat?.duo?.b.id ?? ""}-${new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" })}`);
    return c ? { sorte: "secours", id: c.id, ...(c.debut ? { debut: c.debut } : {}), ...(c.titre ? { titre: c.titre } : {}) } : { sorte: "eteinte" };
  }, [lien, secours, etat?.duo?.a.id, etat?.duo?.b.id]);

  // ─── l'image du duo, à la première visite de la pièce dans cette lumière ───
  useEffect(() => {
    const cle = `${piece}-${m}`;
    if (!etat?.duo || !piece || !fond || duo || enCours.current === cle) return;
    enCours.current = cle;
    void Promise.resolve().then(async () => {
      setInstalle("Vos figurines s’installent… (une minute)");
      for (let k = 0; k < 3; k++) {
        const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "duo", piece, moment: m }) });
        const j = (await r.json().catch(() => ({}))) as { etat?: EtatPieceVivante; fait?: string; error?: string };
        if (j.etat) setEtat(j.etat);
        if (j.error) {
          setInstalle(j.error);
          return;
        }
        if (!j.fait || j.fait === "duo") break;
      }
      setInstalle("");
    });
  }, [etat?.duo, piece, m, fond, duo]);

  // ─── l'arrivée : la pièce entière, ce qui a changé, puis la caméra glisse vers les deux places ───
  useEffect(() => {
    if (!piece) return;
    touche.current = false;
    const avant = vus.current[piece];
    const neuf: { objet: Objet; dit: string } | null =
      avant && lien && avant.lien !== lien
        ? { objet: "tele", dit: `${autre} a mis un lien sur la télé` }
        : avant && photo && avant.photo !== photo
          ? { objet: "cadre", dit: `${autre} a posé une photo dans le cadre` }
          : null;
    vus.current[piece] = { lien, photo };
    const t0 = setTimeout(() => {
      setPlan({ type: "piece" });
      setBulles(0);
      setNouveaute(neuf);
    }, 0);
    const t1 = setTimeout(() => setNouveaute(null), neuf ? 3000 : 0);
    const t2 = setTimeout(() => !touche.current && setPlan({ type: "places" }), neuf ? 3600 : 2200);
    return () => [t0, t1, t2].forEach(clearTimeout);
    // (l'arrivée se rejoue à chaque entrée dans une pièce ; le lien et la photo du moment comptent, pas leurs changements)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piece, arrivee]);

  // ─── les bulles, une à une, quand on est aux places ───
  useEffect(() => {
    if (plan.type !== "places") return;
    const ts = [0, 1, 2, 3].map((k) => setTimeout(() => setBulles(k + 1), 500 + k * 1300));
    return () => ts.forEach(clearTimeout);
  }, [plan.type, arrivee]);

  // ─── l'invitation envoyée : acceptée au bout d'un moment (simulé) ───
  // (en deux temps : l'acceptation change `envoi`, ce qui annulerait un second minuteur posé en même temps)
  useEffect(() => {
    if (!envoi) return;
    if (!envoi.accepte) {
      const t = setTimeout(() => setEnvoi({ ...envoi, accepte: true }), 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setEnvoi(null);
      entrer(envoi.piece);
    }, 1300);
    return () => clearTimeout(t);
  }, [envoi]);

  function entrer(q: PieceDuo) {
    setPiece(q);
    setArrivee((n) => n + 1);
  }
  function viser(o: Objet) {
    touche.current = true;
    setNouveaute(null);
    setPlan({ type: "objet", objet: o });
  }
  function choisirPhoto(ev: ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (f) setPhoto(URL.createObjectURL(f));
  }

  if (erreur) return <p style={{ maxWidth: 440, margin: "0 auto" }}>{erreur}</p>;
  if (!etat) return <p style={{ maxWidth: 440, margin: "0 auto" }}>…</p>;
  if (!faites.length || !p)
    return (
      <p style={{ maxWidth: 440, margin: "0 auto", lineHeight: 1.5 }}>
        Fais d’abord les pièces dans « 🛋️ La pièce du duo » (la page des essais).
      </p>
    );

  const places = p.emplacements?.places ?? [];
  const cam =
    plan.type === "places" ? camera(zoneDesPlaces(places), 1.04) : plan.type === "objet" ? camera(zoneDe(p, plan.objet), plan.objet === "chat" ? 1 : 1.9) : camera(null);
  const vise = plan.type === "objet" ? plan.objet : null;
  const zTele = zoneDe(p, "tele");
  const zCadre = zoneDe(p, "cadre");
  const zEtagere = zoneDe(p, "etagere");
  const zPlatine = zoneDe(p, "platine");
  // (la télé se touche elle-même : `TeleDuo`, de loin, appelle `viser`)
  const touchables = (["platine", "cadre", "etagere", "fenetre", "chat"] as Objet[]).filter((o) => zoneDe(p, o));

  return (
    <div className="md">
      <div className="md-titre">
        <b>
          {p.emoji} {p.nom}
        </b>
        <span>
          {MOMENTS_DUO.find((x) => x.cle === m)?.emoji} {etat.duo ? `avec ${autre}` : ""}
        </span>
      </div>

      <div className="md-scene" data-plan={plan.type} data-piece={piece} data-moment={m}>
        <div className="md-camera" style={{ transform: `translate(${pc(cam.tx)}, ${pc(cam.ty)}) scale(${cam.s})` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={duo || fond} className="md-fond" src={duo || fond} alt={duo ? `${etat.duo?.a.nom} et ${autre}, ${DANS[p.cle]}` : p.nom} data-duo={duo ? "1" : undefined} />

          {/* le cadre : la photo de l'essai, dans le passe-partout */}
          {zCadre && photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="md-photo" src={photo} alt="" style={{ left: pc(zCadre[0] + zCadre[2] * 0.12), top: pc(zCadre[1] + zCadre[3] * 0.12), width: pc(zCadre[2] * 0.76), height: pc(zCadre[3] * 0.76) }} />
          )}

          {/* l'étagère : les souvenirs de l'essai, posés sur la planche */}
          {zEtagere &&
            SOUVENIRS.map((x, k) => (
              <span key={k} className="md-souvenir" style={{ left: pc(zEtagere[0] + zEtagere[2] * (0.22 + k * 0.28)), top: pc(zEtagere[1] + zEtagere[3] * 0.5) }}>
                <i>{x.emoji}</i>
                {vise === "etagere" && <small>{x.dit}</small>}
              </span>
            ))}

          {/* la platine : des notes qui montent quand on la regarde */}
          {zPlatine && vise === "platine" && (
            <span className="md-notes" style={{ left: pc(zPlatine[0] + zPlatine[2] / 2), top: pc(zPlatine[1]) }} aria-hidden="true">
              <i>♪</i>
              <i>♫</i>
              <i>♪</i>
            </span>
          )}

          {/* la télé : celle de la session de l'univers, posée sur l'écran relevé */}
          {zTele && (
            <span className="md-tele" data-objet="tele">
              <TeleDuo programme={programme} secours={secours} zone={zTele} proche={vise === "tele"} onToucher={() => viser("tele")} />
            </span>
          )}
          {zTele && (aide || nouveaute?.objet === "tele") && (
            <span className={`md-anneau${nouveaute?.objet === "tele" ? " neuf" : ""}`} style={{ left: pc(zTele[0]), top: pc(zTele[1]), width: pc(zTele[2]), height: pc(zTele[3]) }} aria-hidden="true" />
          )}

          {/* les objets qu'on peut toucher */}
          {touchables.map((o) => {
            const z = zoneDe(p, o)!;
            return (
              <button
                key={o}
                type="button"
                className={`md-objet${aide ? " aide" : ""}${nouveaute?.objet === o ? " neuf" : ""}`}
                style={{ left: pc(z[0]), top: pc(z[1]), width: pc(z[2]), height: pc(z[3]) }}
                onClick={() => viser(o)}
                aria-label={OBJETS[o].nom}
                data-objet={o}
              />
            );
          })}
        </div>

        {nouveaute && (
          <p className="md-neuf" role="status">
            ✨ Depuis ta dernière visite : {nouveaute.dit}
          </p>
        )}
        {installe && <p className="md-installe">{installe}</p>}

        {plan.type === "places" && (
          <div className="md-bulles" aria-live="polite">
            {PAROLES
              // (les trois dernières : la pile ne descend pas sur les visages)
              .slice(Math.max(0, bulles - 3), bulles)
              .map((b, k) => (
                <p key={k} className={`md-bulle ${b.qui}`}>
                  {b.qui === "autre" && <b>{autre}</b>}
                  {b.texte}
                </p>
              ))}
          </div>
        )}

        {invitation && (
          <div className="md-carte" role="dialog" aria-label="Une invitation">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lumiereDe(etat.pieces.find((x) => x.cle === invitation), m) || etat.pieces.find((x) => x.cle === invitation)?.decor} alt="" />
            <p>
              <b>{autre}</b> t’invite {DANS[invitation]}
            </p>
            <span>
              <button
                type="button"
                onClick={() => {
                  const q = invitation;
                  setInvitation(null);
                  entrer(q);
                }}
              >
                Venir
              </button>
              <button type="button" className="clair" onClick={() => setInvitation(null)}>
                Pas maintenant
              </button>
            </span>
          </div>
        )}
        {envoi && (
          <p className="md-neuf" role="status">
            {envoi.accepte ? `✅ ${autre} arrive ${DANS[envoi.piece]}` : `✉️ Invitation envoyée à ${autre}…`}
          </p>
        )}
      </div>

      {/* sous la scène : ce que fait l'objet regardé, ou les gestes */}
      {vise ? (
        <div className="md-objet-dit">
          <b>
            {OBJETS[vise].emoji} {OBJETS[vise].nom}
          </b>
          {vise === "tele" && (
            <small>{lien ? "Le dernier lien partagé." : "Pas encore de lien : le clip du jour. Colle un lien YouTube dans « ⚙️ Pour l’essai » : il passera à la place."}</small>
          )}
          {vise === "cadre" && !photo && <small>Choisis une photo dans « ⚙️ Pour l’essai » : elle se pose dans le cadre.</small>}
          {vise === "etagere" && <small>Vos souvenirs et vos rendez-vous, posés sur la planche.</small>}
          {vise === "platine" && <small>Ici jouera votre chanson.</small>}
          {vise === "chat" && <small>Votre compagnon viendra s’y installer.</small>}
          {vise === "fenetre" && (
            <span className="md-moments">
              {MOMENTS_DUO.filter((x) => lumiereDe(p, x.cle)).map((x) => (
                <button key={x.cle} type="button" className={m === x.cle ? "elu" : "clair"} onClick={() => setMoment(x.cle)}>
                  {x.emoji} {x.nom}
                </button>
              ))}
            </span>
          )}
          <button type="button" className="clair" onClick={() => setPlan({ type: "places" })}>
            ← Revenir
          </button>
        </div>
      ) : (
        <div className="md-gestes">
          {plan.type === "places" ? (
            <button type="button" className="clair" onClick={() => ((touche.current = true), setPlan({ type: "piece" }))}>
              🏠 La pièce
            </button>
          ) : (
            <button type="button" onClick={() => ((touche.current = true), setPlan({ type: "places" }))}>
              💬 Parler
            </button>
          )}
          <button type="button" className="clair" onClick={() => setChoixPiece((x) => !x)}>
            🚪 Changer de pièce
          </button>
          <button
            type="button"
            className="clair"
            onClick={() => {
              setAide(true);
              setTimeout(() => setAide(false), 2500);
            }}
          >
            👆 Les objets
          </button>
          <button type="button" className="clair" onClick={() => setReglages((x) => !x)}>
            ⚙️ Pour l’essai
          </button>
        </div>
      )}

      {choixPiece && (
        <div className="md-panneau" aria-label="Changer de pièce">
          <b>Inviter {autre} dans une autre pièce</b>
          <div className="md-pieces">
            {faites.map((x) => (
              <button
                key={x.cle}
                type="button"
                disabled={x.cle === piece}
                onClick={() => {
                  setChoixPiece(false);
                  setEnvoi({ piece: x.cle, accepte: false });
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lumiereDe(x, m) || x.decor} alt="" />
                <small>
                  {x.emoji} {x.nom}
                  {x.cle === piece ? " (ici)" : ""}
                </small>
              </button>
            ))}
          </div>
        </div>
      )}

      {reglages && (
        <div className="md-panneau" aria-label="Pour l’essai">
          <label>
            Le dernier lien partagé (YouTube)
            <input type="url" inputMode="url" value={lien} onChange={(ev) => setLien(ev.target.value)} placeholder="https://youtu.be/…" />
          </label>
          <label>
            La photo du cadre
            <input type="file" accept="image/*" onChange={choisirPhoto} />
          </label>
          <span>
            Recevoir une invitation :{" "}
            {faites
              .filter((x) => x.cle !== piece)
              .map((x) => (
                <button
                  key={x.cle}
                  type="button"
                  className="clair"
                  onClick={() => {
                    setReglages(false);
                    setInvitation(x.cle);
                  }}
                >
                  {x.emoji}
                </button>
              ))}
          </span>
          <span>
            L’heure :{" "}
            {MOMENTS_DUO.map((x) => (
              <button key={x.cle} type="button" className={m === x.cle ? "elu" : "clair"} disabled={!lumiereDe(p, x.cle)} onClick={() => setMoment(x.cle)}>
                {x.emoji}
              </button>
            ))}
          </span>
          <button type="button" className="clair" onClick={() => setArrivee((n) => n + 1)}>
            ↻ Rejouer l’arrivée
          </button>
          {!etat.duo && <small>Choisis d’abord vos deux figurines dans « 🧩 L’effet collage » (la page des essais).</small>}
        </div>
      )}

      <style>{`
.md{max-width:440px;margin:0 auto;display:flex;flex-direction:column;gap:10px}
.md-titre{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:15px}
.md-titre span{color:#d9c3a8;font-size:13px}
.md-scene{position:relative;width:100%;aspect-ratio:2/3;border-radius:18px;overflow:hidden;background:#2b1a0c;box-shadow:0 12px 40px rgba(0,0,0,.45)}
.md-camera{position:absolute;inset:0;transform-origin:0 0;transition:transform 1.25s cubic-bezier(.45,0,.2,1);will-change:transform}
.md-fond{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:md-fondu .7s ease}
@keyframes md-fondu{from{opacity:0}to{opacity:1}}
.md-photo{position:absolute;object-fit:cover;box-shadow:inset 0 0 6px rgba(0,0,0,.4);border-radius:1px}
.md-souvenir{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;gap:1px;pointer-events:none}
.md-souvenir i{font-style:normal;font-size:12px;line-height:1;filter:drop-shadow(1px 1px 1px rgba(0,0,0,.4))}
.md-souvenir small{font-size:4px;background:rgba(255,250,240,.92);color:#3a2a1a;padding:1px 2px;border-radius:2px;white-space:nowrap}
.md-notes{position:absolute;pointer-events:none}
.md-notes i{position:absolute;font-style:normal;font-size:8px;color:#fff6d8;text-shadow:0 0 3px rgba(0,0,0,.6);animation:md-note 2.4s ease-in infinite;opacity:0}
.md-notes i:nth-child(2){animation-delay:.8s;left:5px}
.md-notes i:nth-child(3){animation-delay:1.6s;left:-5px}
@keyframes md-note{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(-26px)}}
.md-anneau{position:absolute;border-radius:4px;pointer-events:none;box-shadow:0 0 0 1.5px rgba(255,255,255,.9),0 0 10px rgba(255,255,255,.6);animation:md-pulse 1.2s ease-in-out infinite}
.md-anneau.neuf{box-shadow:0 0 0 2px #ffd36b,0 0 14px #ffd36b;animation-duration:1s}
.md-objet{position:absolute;padding:0;border:0;background:transparent;cursor:pointer;border-radius:4px}
.md-objet.aide{box-shadow:0 0 0 1.5px rgba(255,255,255,.9),0 0 10px rgba(255,255,255,.6);animation:md-pulse 1.2s ease-in-out infinite}
.md-objet.neuf{box-shadow:0 0 0 2px #ffd36b,0 0 14px #ffd36b;animation:md-pulse 1s ease-in-out infinite}
@keyframes md-pulse{50%{opacity:.35}}
.md-neuf,.md-installe{position:absolute;left:12px;right:12px;top:12px;margin:0;pointer-events:none;padding:9px 12px;border-radius:14px;background:rgba(20,14,8,.78);color:#fff;font-size:14px;line-height:1.35;backdrop-filter:blur(6px)}
.md-installe{top:auto;bottom:12px;font-size:13px}
.md-bulles{position:absolute;left:10px;right:10px;top:10px;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.md-bulle{margin:0;max-width:78%;padding:8px 11px;border-radius:16px;font-size:14px;line-height:1.35;animation:md-bulle .35s ease}
.md-bulle b{display:block;font-size:11px;opacity:.75}
.md-bulle.autre{align-self:flex-start;background:rgba(255,255,255,.92);color:#2a1d12;border-bottom-left-radius:4px}
.md-bulle.moi{align-self:flex-end;background:#ff2e9a;color:#fff;border-bottom-right-radius:4px}
@keyframes md-bulle{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.md-carte{position:absolute;left:18px;right:18px;bottom:18px;padding:10px;border-radius:18px;background:rgba(255,250,243,.97);color:#2a1d12;box-shadow:0 10px 30px rgba(0,0,0,.4);display:flex;flex-direction:column;gap:8px;animation:md-bulle .35s ease}
.md-carte img{width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:12px}
.md-carte p{margin:0;font-size:16px}
.md-carte span,.md-gestes,.md-objet-dit,.md-moments,.md-panneau span{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.md :where(.md-gestes,.md-objet-dit,.md-panneau,.md-carte,.md-pieces) button{padding:9px 14px;border-radius:999px;border:0;background:#ff2e9a;color:#fff;font-weight:800;font-size:14px;cursor:pointer}
.md :where(.md-gestes,.md-objet-dit,.md-panneau,.md-carte,.md-pieces) button.clair{background:rgba(255,255,255,.1);color:#f6efe6;border:1px solid rgba(255,255,255,.25)}
.md-carte button.clair{background:#fff;color:#c2186f;border:1px solid #ff2e9a}
.md :where(.md-gestes,.md-objet-dit,.md-panneau,.md-carte,.md-pieces) button.elu{background:#f6efe6;color:#2a1d12}
.md :where(.md-gestes,.md-objet-dit,.md-panneau,.md-carte,.md-pieces) button:disabled{opacity:.4;cursor:default}
.md-objet-dit{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.06)}
.md-objet-dit small,.md-panneau small{color:#d9c3a8;font-size:13px;line-height:1.35}
.md-panneau{display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:14px;background:rgba(255,255,255,.06);font-size:14px}
.md-panneau label{display:flex;flex-direction:column;gap:5px}
.md-panneau input[type=url]{padding:9px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(0,0,0,.25);color:#fff;font-size:15px}
.md-pieces{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.md-pieces button{display:flex;flex-direction:column;gap:4px;padding:5px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);font-weight:600}
.md-pieces img{width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:8px}
.md-pieces small{font-size:12px;color:#f6efe6}
/* (les objets qu'on touche : invisibles ; « 👆 Les objets » les montre) */
.md .md-objet{font-size:0}
.md .md-objet.aide{background:rgba(255,255,255,.08)}
`}</style>
    </div>
  );
}
