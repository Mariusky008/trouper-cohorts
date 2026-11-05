"use client";

/**
 * 🃏 MON PERSONNAGE — sa carte de personnage (`lib/direct/personnage.ts`), refaite le 5 novembre 2026 (« c'est pas mal,
 * mais tu peux vraiment mieux faire, plus interactif et plus gamifié, pour rendre cette section wow ») :
 *   · LE GUIDE LANCE LE TEST (« Quel personnage es-tu ? ») — la carte mystère attend, en silhouette ;
 *   · LE QUESTIONNAIRE EST UN JEU : le guide pose chaque question, deux grosses cartes à toucher, une jauge d'XP ; SA CARTE
 *     SE CONSTRUIT EN DIRECT à côté — chaque réponse fait monter ses caractéristiques, et le gain s'envole (« +25 🚀 ») ;
 *   · LA RÉVÉLATION : la carte tourne, les confettis tombent, « Nouvelle carte ! » ;
 *   · SA CARTE se retourne d'un toucher (sa fiche au dos) et s'incline sous le doigt (un reflet la suit) ; dessous, ce
 *     qui la fait monter : le prochain niveau, le prochain cadre, ce que rapporte le prochain achat.
 * La carte elle-même (`CartePerso`) sert aussi à la page d'une carte partagée (`/carte/<id>`).
 */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  CARACTERISTIQUES,
  GOUTS,
  GOUTS_MAX,
  PHRASE_MAX,
  PROGRES_VIDE,
  QUESTIONS,
  caracteristiques,
  prochainAchat,
  texteDeLaCarte,
  type CartePersonnage,
  type CleCaracteristique,
  type CleGout,
  type CleQuestion,
  type Progres,
  type Reponses,
} from "@/lib/direct/personnage";
import { PanneauEnvoi } from "./ma-figurine";
import { FigurineGuide, Guide, GuideDit, type Visage } from "./guide";

/** Le guide pose les questions : un visage différent à chaque fois (ses vraies expressions). */
const VISAGES_QUIZ: Visage[] = ["joie", "neutre", "euphorie"];

const CADRES = { bronze: { a: "#F2B27A", b: "#7A3E16", nom: "Bronze" }, argent: { a: "#EEF3F8", b: "#7F8EA3", nom: "Argent" }, or: { a: "#FFE7A0", b: "#B8801E", nom: "Or" } };
const RANGS = [
  { rang: "argent", achats: 3, nom: "Argent" },
  { rang: "or", achats: 6, nom: "Or" },
] as const;

async function demander(corps: Record<string, unknown>): Promise<{ carte?: CartePersonnage; lien?: string; error?: string }> {
  const r = await fetch("/api/direct/personnage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as { carte?: CartePersonnage; lien?: string; error?: string };
  if (!r.ok) throw new Error(j.error || "Ça n’est pas parti. Réessaie dans un instant.");
  return j;
}

/** Ses caractéristiques avec les réponses données jusqu'ici (les autres, neutres). */
const valeursPartielles = (r: Partial<Reponses>, p: Progres, gouts: readonly string[]) => caracteristiques(r as Reponses, p, gouts);

// ─── la carte ────────────────────────────────────────────────────────────────────────────────────
/**
 * LA CARTE : son cadre (bronze, argent, or : ses achats), son image, son titre, ses six caractéristiques ; au dos, sa
 * fiche. Un toucher la retourne (`retournable`) ; le doigt (ou la souris) l'incline, un reflet le suit.
 */
export function CartePerso({ carte, silhouette = false, retournable = true }: { carte?: CartePersonnage | null; silhouette?: boolean; retournable?: boolean }) {
  const c = carte ?? null;
  const cadre = CADRES[c?.rang ?? "bronze"];
  const [dos, setDos] = useState(false);
  const [incl, setIncl] = useState({ x: 0, y: 0, mx: 50, my: 50 });
  const bouge = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setIncl({ x: (0.5 - py) * 14, y: (px - 0.5) * 16, mx: px * 100, my: py * 100 });
  };
  return (
    <div
      className={`pc-scene${dos ? " dos" : ""}`}
      onPointerMove={bouge}
      onPointerLeave={() => setIncl({ x: 0, y: 0, mx: 50, my: 50 })}
      style={{ "--rx": `${incl.x}deg`, "--ry": `${incl.y}deg`, "--mx": `${incl.mx}%`, "--my": `${incl.my}%` } as CSSProperties}
    >
      <article
        className={`pc${silhouette ? " silhouette" : ""}${c?.rang === "or" ? " or" : ""}`}
        style={{ "--a": cadre.a, "--b": cadre.b } as CSSProperties}
        aria-label={c ? `La carte de ${c.prenom || "ce personnage"}` : "Ta carte de personnage"}
        onClick={() => retournable && c && setDos((d) => !d)}
      >
        {/* L'ENDROIT */}
        <div className="pc-face pc-endroit">
          <div className="pc-dedans">
            <header className="pc-tete">
              <b>{c?.prenom || (silhouette ? "???" : "")}</b>
              <span className="pc-niv">Niv. {c?.niveau ?? "?"}</span>
            </header>
            <div className={`pc-image${c?.figurine ? " figurine" : ""}`}>
              {c?.figurine ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" draggable={false} />
              ) : (
                <>
                  <FigurineGuide className="pc-clik" ombre fixe />
                  {!silhouette && <span className="pc-ici">Ta figurine ici</span>}
                </>
              )}
              <span className="pc-titre">{c?.fiche.titre ?? "Personnage mystère"}</span>
            </div>
            <ul className="pc-carac">
              {CARACTERISTIQUES.map((x, i) => (
                <li key={x.cle} style={{ "--v": `${c ? c.valeurs[x.cle] : 0}%`, "--d": `${0.5 + i * 0.12}s` } as CSSProperties}>
                  <span aria-hidden="true">{x.emoji}</span>
                  <small>{x.nom}</small>
                  <i className="pc-barre" aria-hidden="true">
                    <i />
                  </i>
                  <b>{c ? c.valeurs[x.cle] : "?"}</b>
                </li>
              ))}
            </ul>
            <footer className="pc-pied">
              <span>{cadre.nom}</span>
              <span>{c && retournable ? "Touche-la ↻" : "ClikMe"}</span>
            </footer>
          </div>
        </div>
        {/* L'ENVERS : sa fiche */}
        {c && (
          <div className="pc-face pc-envers">
            <div className="pc-dedans">
              <b className="pc-envers-titre">{c.fiche.titre}</b>
              <p>
                <b>⚡ Super-pouvoir</b>
                {c.fiche.pouvoir}
              </p>
              <p>
                <b>💥 Point faible</b>
                {c.fiche.faiblesse}
              </p>
              <p>
                <b>🗣️ Sa façon de parler</b>
                {c.fiche.facon}
              </p>
              <p className="pc-portrait">{c.fiche.portrait}</p>
              {c.phrase && <p className="pc-phrase">« {c.phrase} »</p>}
              {c.gouts.length > 0 && (
                <span className="pc-gouts">
                  {c.gouts.map((g) => {
                    const x = GOUTS.find((y) => y.cle === g);
                    return x ? <i key={g}>{`${x.emoji} ${x.nom}`}</i> : null;
                  })}
                </span>
              )}
              <footer className="pc-pied">
                <span>{cadre.nom}</span>
                <span>Touche-la ↻</span>
              </footer>
            </div>
          </div>
        )}
        <i className="pc-reflet" aria-hidden="true" />
        {c?.rang === "or" && <i className="pc-holo" aria-hidden="true" />}
      </article>
    </div>
  );
}

/** Les confettis de la révélation. */
function Confettis() {
  return (
    <span className="pc-confettis" aria-hidden="true">
      {Array.from({ length: 34 }, (_, k) => (
        <i
          key={k}
          style={
            {
              left: `${(k * 29 + (k % 3) * 7) % 100}%`,
              "--d": `${((k * 7) % 11) * 0.07}s`,
              animationDuration: `${1.8 + ((k * 3) % 7) * 0.2}s`,
              background: ["#FF2E9A", "#F2C46B", "#3DE2A6", "#8EC5FF", "#fff", "#B98CFF"][k % 6],
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

/** Ses caractéristiques qui se remplissent pendant le questionnaire, et le gain qui s'envole. */
function CarteEnDirect({ valeurs, gains }: { valeurs: Record<CleCaracteristique, number>; gains: { cle: CleCaracteristique; plus: number; n: number }[] }) {
  return (
    <div className="mp-direct" aria-label="Ta carte se construit">
      <small>TA CARTE SE CONSTRUIT…</small>
      <ul>
        {CARACTERISTIQUES.map((x) => {
          const g = gains.find((y) => y.cle === x.cle);
          return (
            <li key={x.cle}>
              <span aria-hidden="true">{x.emoji}</span>
              <small>{x.nom}</small>
              <i className="pc-barre" aria-hidden="true">
                <i style={{ width: `${valeurs[x.cle]}%` }} />
              </i>
              <b>{valeurs[x.cle]}</b>
              {g && (
                <em key={g.n} className="mp-gain">
                  +{g.plus}
                </em>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Ce qui fait monter sa carte : le prochain niveau, le prochain cadre, le prochain achat. */
function CeQuiMonte({ carte, progres, allerA }: { carte: CartePersonnage; progres: Progres; allerA?: (o: string) => void }) {
  const prochain = RANGS.find((r) => progres.figurines < r.achats);
  return (
    <div className="mp-monte">
      <div className="mp-niveau">
        <span className="mp-badge">Niv. {carte.niveau}</span>
        <span className="mp-xp" role="progressbar" aria-valuemin={0} aria-valuemax={1} aria-valuenow={0}>
          <i />
        </span>
        <span className="mp-badge suivant">Niv. {carte.niveau + 1}</span>
      </div>
      <p>
        <b>Encore 1 achat</b> chez un commerce ClikMe pour passer niveau {carte.niveau + 1} :{" "}
        {prochainAchat()
          .map((g) => `${g.emoji} ${g.nom} +${g.plus}${g.si ? ` (${g.si})` : ""}`)
          .join(", ")}
        .
      </p>
      {prochain && (
        <p className="mp-cadre">
          🖼️ Le cadre <b>{prochain.nom}</b> à {prochain.achats} achats : encore {prochain.achats - progres.figurines}.
        </p>
      )}
      {allerA && (
        <button type="button" className="mp-ou" onClick={() => allerA("mois")}>
          📍 Où acheter ce mois-ci ?
        </button>
      )}
    </div>
  );
}

type Etape = { q: number } | { gouts: true } | { attente: true } | null;

export function MonPersonnage({
  compte,
  onCarte,
  onSait,
  allerA,
}: {
  compte: boolean | null;
  onCarte?: () => void;
  /** Il a une carte, ou pas (le menu le dit). */
  onSait?: (aCarte: boolean) => void;
  /** Mener à un autre onglet (« mois », « figurine »). */
  allerA?: (o: string) => void;
}) {
  const [carte, setCarte] = useState<CartePersonnage | null | undefined>(undefined);
  const [progres, setProgres] = useState<Progres>(PROGRES_VIDE);
  const [etape, setEtape] = useState<Etape>(null);
  const [reponses, setReponses] = useState<Partial<Record<CleQuestion, "a" | "b">>>({});
  const [gouts, setGouts] = useState<CleGout[]>([]);
  const [phrase, setPhrase] = useState("");
  const [erreur, setErreur] = useState("");
  const [lien, setLien] = useState("");
  const [revelee, setRevelee] = useState(false);
  const [gains, setGains] = useState<{ cle: CleCaracteristique; plus: number; n: number }[]>([]);
  const nGain = useRef(0);
  const surSait = useRef(onSait);
  useEffect(() => {
    surSait.current = onSait;
  }, [onSait]);

  useEffect(() => {
    if (!compte) return;
    let fini = false;
    fetch("/api/direct/personnage", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { carte?: CartePersonnage | null; progres?: Progres }) => {
        if (fini) return;
        setCarte(j.carte ?? null);
        if (j.progres) setProgres(j.progres);
        surSait.current?.(Boolean(j.carte));
        if (j.carte?.lien) setLien(`${window.location.origin}${j.carte.lien}`);
      })
      .catch(() => !fini && setCarte(null));
    return () => {
      fini = true;
    };
  }, [compte]);

  /** Ce que la réponse a rapporté : les gains s'envolent au-dessus des barres. */
  function montrerGains(avant: Record<CleCaracteristique, number>, apres: Record<CleCaracteristique, number>) {
    const g = CARACTERISTIQUES.flatMap((x) => (apres[x.cle] > avant[x.cle] ? [{ cle: x.cle, plus: apres[x.cle] - avant[x.cle], n: ++nGain.current }] : []));
    setGains(g);
  }
  function repondre(cle: CleQuestion, v: "a" | "b", k: number) {
    const avant = valeursPartielles(reponses, progres, gouts);
    const r = { ...reponses, [cle]: v };
    setReponses(r);
    montrerGains(avant, valeursPartielles(r, progres, gouts));
    setEtape(k + 1 < QUESTIONS.length ? { q: k + 1 } : { gouts: true });
  }
  function basculerGout(g: CleGout) {
    const avant = valeursPartielles(reponses, progres, gouts);
    const l = gouts.includes(g) ? gouts.filter((y) => y !== g) : [...gouts, g];
    setGouts(l);
    montrerGains(avant, valeursPartielles(reponses, progres, l));
  }

  async function reveler() {
    setErreur("");
    setEtape({ attente: true });
    try {
      const j = await demander({ action: "creer", reponses, gouts, phrase: phrase.trim() });
      if (j.carte) {
        setCarte(j.carte);
        setRevelee(true);
        onCarte?.();
      }
      setEtape(null);
    } catch (e) {
      setErreur((e as Error).message);
      setEtape({ gouts: true });
    }
  }

  async function partager() {
    setErreur("");
    try {
      const j = await demander({ action: "partager" });
      if (j.lien) setLien(`${window.location.origin}${j.lien}`);
    } catch (e) {
      setErreur((e as Error).message);
    }
  }

  const tete = (
    <header className="og-tete">
      <small>MON PERSONNAGE</small>
      <h2>{carte ? carte.fiche.titre : "Quel personnage es-tu ?"}</h2>
    </header>
  );

  // SANS COMPTE : la carte vient avec sa figurine
  if (compte === false)
    return (
      <div className="mp">
        {tete}
        <GuideDit
          cle="perso-sans-compte"
          repliques={[
            { t: "Ta carte de personnage t’attend 🃏", v: "joie" },
            { t: "Sept questions, et je devine qui tu es. Mais d’abord : crée ta figurine, c’est elle qui sera sur ta carte !", v: "neutre" },
          ]}
        >
          <button type="button" className="og-go" onClick={() => allerA?.("figurine")}>
            📸 Créer ma figurine
          </button>
        </GuideDit>
        <CartePerso silhouette retournable={false} />
      </div>
    );
  if (compte == null || carte === undefined)
    return (
      <div className="mp">
        {tete}
        <div className="mp-attente" aria-label="Chargement" />
      </div>
    );

  // LE QUESTIONNAIRE : un jeu
  if (etape && "q" in etape) {
    const q = QUESTIONS[etape.q];
    return (
      <div className="mp mp-quiz" aria-live="polite">
        <div className="mp-xp-tete">
          <span className="mp-progres" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length + 1} aria-valuenow={etape.q + 1}>
            <i style={{ width: `${((etape.q + 1) / (QUESTIONS.length + 1)) * 100}%` }} />
          </span>
          <small className="mp-compte">
            {etape.q + 1} / {QUESTIONS.length + 1}
          </small>
        </div>
        <div className="mp-pose">
          <span className="mp-clik" aria-hidden="true">
            <Guide key={q.cle} parle bref visage={VISAGES_QUIZ[etape.q % VISAGES_QUIZ.length]} />
          </span>
          <b className="mp-question" key={q.cle}>
            {q.q}
          </b>
        </div>
        <div className="mp-choix" key={`${q.cle}-c`}>
          {(["a", "b"] as const).map((v) => (
            <button key={v} type="button" className={reponses[q.cle] === v ? "pris" : ""} onClick={() => repondre(q.cle, v, etape.q)}>
              <span aria-hidden="true">{q[v].emoji}</span>
              {q[v].dit}
            </button>
          ))}
        </div>
        <CarteEnDirect valeurs={valeursPartielles(reponses, progres, gouts)} gains={gains} />
        <button type="button" className="mp-retour" onClick={() => setEtape(etape.q ? { q: etape.q - 1 } : null)}>
          ← Retour
        </button>
      </div>
    );
  }
  if (etape && ("gouts" in etape || "attente" in etape)) {
    const attente = "attente" in etape;
    return (
      <div className="mp mp-quiz" aria-live="polite">
        <div className="mp-xp-tete">
          <span className="mp-progres" aria-hidden="true">
            <i style={{ width: "100%" }} />
          </span>
          <small className="mp-compte">
            {QUESTIONS.length + 1} / {QUESTIONS.length + 1}
          </small>
        </div>
        {attente ? (
          <div className="mp-ecrit">
            <span className="mp-dos" aria-hidden="true">
              🃏
            </span>
            <div className="mp-pose">
              <span className="mp-clik" aria-hidden="true">
                <Guide parle visage="euphorie" />
              </span>
              <b className="mp-question">Je consulte les étoiles… ✨ et j’écris ta fiche.</b>
            </div>
          </div>
        ) : (
          <>
            <div className="mp-pose">
              <span className="mp-clik" aria-hidden="true">
                <Guide parle bref visage="joie" />
              </span>
              <b className="mp-question">Dernière étape : ce que tu aimes ({GOUTS_MAX} au plus)</b>
            </div>
            <div className="mp-gouts">
              {GOUTS.map((g) => {
                const pris = gouts.includes(g.cle);
                return (
                  <button key={g.cle} type="button" className={pris ? "pris" : ""} aria-pressed={pris} disabled={!pris && gouts.length >= GOUTS_MAX} onClick={() => basculerGout(g.cle)}>
                    <span aria-hidden="true">{g.emoji}</span>
                    {g.nom}
                  </button>
                );
              })}
            </div>
            <input
              className="mp-phrase"
              value={phrase}
              maxLength={PHRASE_MAX}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder="Ta phrase fétiche (facultatif)"
              aria-label="Ta phrase fétiche"
            />
            <CarteEnDirect valeurs={valeursPartielles(reponses, progres, gouts)} gains={gains} />
            <button type="button" className="mp-bouton mp-reveler" onClick={reveler}>
              ✨ Révéler ma carte
            </button>
            <button type="button" className="mp-retour" onClick={() => setEtape({ q: QUESTIONS.length - 1 })}>
              ← Retour
            </button>
          </>
        )}
        {erreur && (
          <p className="tf-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
    );
  }

  // PAS ENCORE DE CARTE : le guide lance le test, la carte mystère attend
  if (!carte)
    return (
      <div className="mp">
        {tete}
        <GuideDit
          cle="perso-intro"
          repliques={[
            { t: "Et toi, quel personnage es-tu ? 🔮", v: "euphorie" },
            { t: "Réponds vite, sans réfléchir : sept questions, et je devine. Ta carte se construit sous tes yeux.", v: "neutre" },
            { t: "Ensuite, chaque achat chez un commerce ClikMe fait monter tes caractéristiques et ton niveau 📈", v: "joie" },
          ]}
        >
          <button type="button" className="og-go mp-lancer" onClick={() => setEtape({ q: 0 })}>
            🎲 Lancer le test · 30 secondes
          </button>
        </GuideDit>
        <CartePerso silhouette retournable={false} />
      </div>
    );

  // SA CARTE
  return (
    <div className={`mp mp-sienne${revelee ? " revelee" : ""}`}>
      {tete}
      {revelee && (
        <>
          <Confettis />
          <p className="mp-nouvelle" role="status">
            🎉 Nouvelle carte !
          </p>
        </>
      )}
      <div className="mp-grille">
        <CartePerso carte={carte} />
        <div className="mp-texte">
          <CeQuiMonte carte={carte} progres={progres} allerA={allerA} />
          {lien ? (
            <PanneauEnvoi lien={lien} texte={texteDeLaCarte(carte.prenom, carte.fiche.titre)} titre="Ta carte est prête à partir ✓" />
          ) : (
            <button type="button" className="mp-bouton" onClick={partager}>
              📲 Partager ma carte
            </button>
          )}
          <button
            type="button"
            className="mp-retour"
            onClick={() => {
              setReponses(carte.reponses);
              setGouts(carte.gouts);
              setPhrase(carte.phrase);
              setRevelee(false);
              setEtape({ q: 0 });
            }}
          >
            Refaire le test
          </button>
          {erreur && (
            <p className="tf-erreur" role="alert">
              {erreur}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const STYLES_PERSONNAGE = `
.pc-scene{position:relative;width:min(320px,100%);margin:0 auto;perspective:900px}
.pc{position:relative;display:block;width:100%;aspect-ratio:5/7.4;transform-style:preserve-3d;transform:rotateX(var(--rx,0deg)) rotateY(calc(var(--ry,0deg) + 0deg));transition:transform .5s cubic-bezier(.2,.9,.3,1);cursor:pointer}
.pc-scene.dos .pc{transform:rotateX(var(--rx,0deg)) rotateY(calc(var(--ry,0deg) + 180deg))}
.pc-face{position:absolute;inset:0;padding:9px;box-sizing:border-box;border-radius:24px;background:linear-gradient(145deg,var(--a),var(--b));box-shadow:0 26px 50px -24px rgba(0,0,0,.95),0 0 30px -10px var(--a);backface-visibility:hidden;-webkit-backface-visibility:hidden}
.pc-envers{transform:rotateY(180deg)}
.pc-dedans{position:relative;display:flex;flex-direction:column;gap:9px;height:100%;box-sizing:border-box;padding:12px;border-radius:17px;background:linear-gradient(180deg,#2A1220,#170812);color:#FFF4E6;overflow:hidden}
.pc-tete{display:flex;align-items:center;justify-content:space-between;gap:8px}
.pc-tete b{font-size:20px;font-weight:900;letter-spacing:-.02em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pc-niv{flex:none;padding:3px 10px;border-radius:999px;background:linear-gradient(135deg,var(--a),var(--b));color:#1A0913;font-size:12.5px;font-weight:900}
.pc-image{position:relative;flex:1;min-height:150px;border-radius:14px;overflow:hidden;background:radial-gradient(70% 60% at 50% 40%,#FF9AD0,#C2367F 62%,#5E1240)}
.pc-image .pc-clik{position:absolute;left:50%;bottom:4px;height:92%;width:auto;max-width:96%;transform:translateX(-50%);opacity:.42}
.pc-ici{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);padding:6px 12px;border-radius:999px;background:rgba(255,244,230,.92);color:#2A0F1F;font-size:12.5px;font-weight:900;white-space:nowrap}
.pc-image.figurine img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:50% 20%}
.pc-titre{position:absolute;left:8px;right:8px;bottom:8px;padding:6px 10px;border-radius:12px;background:rgba(18,6,15,.82);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-size:14px;font-weight:900;text-align:center;line-height:1.2}
.pc-carac{display:grid;gap:5px;margin:0;padding:0;list-style:none}
.pc-carac li{display:grid;grid-template-columns:20px 84px 1fr 26px;align-items:center;gap:6px;font-size:12.5px}
.pc-carac small,.mp-direct li small{font-size:12px;font-weight:800;color:#D9C3CB;white-space:nowrap}
.pc-barre{position:relative;display:block;height:8px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.pc-barre i{position:absolute;left:0;top:0;bottom:0;width:var(--v);border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transform-origin:left;animation:pc-remplit 1s cubic-bezier(.2,.9,.3,1) var(--d) both;transition:width .5s cubic-bezier(.2,1.2,.4,1)}
.pc-carac b{text-align:right;font-variant-numeric:tabular-nums;font-weight:900}
.pc-pied{display:flex;justify-content:space-between;gap:8px;margin-top:auto;padding-top:6px;border-top:1px solid rgba(255,255,255,.1);font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:#A88E99}
.pc-envers .pc-dedans{gap:8px;font-size:12.5px;line-height:1.35;color:#E8D3DC;overflow:auto}
.pc-envers-titre{font-size:18px;line-height:1.15;font-weight:900;color:#FFF4E6}
.pc-envers p{margin:0;display:flex;flex-direction:column;gap:1px}
.pc-envers p b{font-size:11.5px;letter-spacing:.04em;color:#F2C46B}
.pc-portrait{font-style:italic;color:#D9C3CB}
.pc-phrase{font-weight:800;color:#FFF4E6}
.pc-gouts{display:flex;flex-wrap:wrap;gap:4px}
.pc-gouts i{padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.08);font-style:normal;font-size:11.5px;font-weight:800}
.pc-reflet{position:absolute;inset:0;border-radius:24px;pointer-events:none;background:radial-gradient(60% 45% at var(--mx,50%) var(--my,50%),rgba(255,255,255,.28),transparent 70%);mix-blend-mode:overlay;transform:translateZ(1px)}
.pc.silhouette .pc-titre{color:#A88E99;letter-spacing:.06em}
.pc.silhouette .pc-face{animation:pc-mystere 2.6s ease-in-out infinite}
.pc-holo{position:absolute;inset:0;border-radius:24px;pointer-events:none;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.35) 45%,rgba(160,220,255,.25) 52%,transparent 66%);background-size:250% 100%;mix-blend-mode:screen;animation:pc-holo 4.5s ease-in-out infinite}
.pc-confettis{position:fixed;inset:0;z-index:30;pointer-events:none;overflow:hidden}
.pc-confettis i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation:pc-tombe linear var(--d) forwards}
.mp{display:flex;flex-direction:column;gap:16px}
.mp > *{min-width:0}
.mp-grille{display:grid;gap:18px;align-items:start}
.mp-texte{display:flex;flex-direction:column;gap:12px}
.mp-bouton{display:block;padding:15px 20px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:16px;font-weight:900;text-align:center;text-decoration:none;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
a.mp-bouton{color:#fff}
.mp-retour{align-self:center;border:0;background:none;color:#A88E99;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}
.mp-attente{height:300px;border-radius:24px;background:linear-gradient(100deg,rgba(255,255,255,.04) 30%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.04) 70%);background-size:200% 100%;animation:mc-reflet 1.4s linear infinite}
.mp-lancer{font-size:17px;animation:tf-brille 1.8s ease-in-out infinite}
.mp-quiz{padding:16px;border-radius:26px;background:linear-gradient(180deg,rgba(255,46,154,.14),rgba(255,255,255,.04));border:1.5px solid rgba(255,46,154,.4)}
.mp-xp-tete{display:flex;align-items:center;gap:10px}
.mp-progres{position:relative;flex:1;display:block;height:12px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.mp-progres i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);box-shadow:0 0 12px rgba(255,46,154,.7);transition:width .45s cubic-bezier(.2,1.3,.4,1)}
.mp-compte{flex:none;font-size:13px;font-weight:900;color:#F2C46B}
.mp-pose{display:grid;grid-template-columns:78px minmax(0,1fr);align-items:center;gap:8px}
.mp-clik{display:block;filter:drop-shadow(0 10px 12px rgba(0,0,0,.45))}
.mp-question{position:relative;padding:12px 14px;border-radius:18px 18px 18px 6px;background:#FFF4E6;color:#2A0F1F;font-size:19px;line-height:1.2;font-weight:900;letter-spacing:-.01em;animation:mp-entre .35s cubic-bezier(.2,1.2,.4,1)}
.mp-choix{display:grid;grid-template-columns:1fr 1fr;gap:10px;animation:mp-entre .4s cubic-bezier(.2,1.2,.4,1) .05s both}
.mp-choix button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:20px 8px;border-radius:22px;border:1.5px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(0,0,0,.18));color:#FFF4E6;font:inherit;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 10px 20px -12px rgba(0,0,0,.8);transition:transform .12s}
.mp-choix button span{font-size:44px;line-height:1;animation:mp-saute 2.2s ease-in-out infinite}
.mp-choix button:nth-child(2) span{animation-delay:.4s}
.mp-choix button:active{transform:scale(.94)}
.mp-choix button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.2)}
.mp-direct{padding:12px;border-radius:18px;background:rgba(0,0,0,.22);border:1px dashed rgba(242,196,107,.45)}
.mp-direct > small{display:block;margin-bottom:6px;font-size:10.5px;font-weight:900;letter-spacing:.12em;color:#F2C46B}
.mp-direct ul{display:grid;gap:4px;margin:0;padding:0;list-style:none}
.mp-direct li{position:relative;display:grid;grid-template-columns:20px 84px 1fr 26px;align-items:center;gap:6px;font-size:12.5px}
.mp-direct li .pc-barre i{animation:none;width:auto}
.mp-direct li b{text-align:right;font-variant-numeric:tabular-nums;font-weight:900}
.mp-gain{position:absolute;right:-2px;top:-8px;padding:1px 7px;border-radius:999px;background:#3DE2A6;color:#08301F;font-style:normal;font-size:11.5px;font-weight:900;animation:mp-gain 1.3s ease-out forwards;pointer-events:none}
.mp-gouts{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.mp-gouts button{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px;border-radius:16px;border:1.5px solid rgba(255,255,255,.12);background:rgba(0,0,0,.2);color:#FFF4E6;font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.mp-gouts button span{font-size:22px}
.mp-gouts button.pris{border-color:#FF2E9A;background:rgba(255,46,154,.16)}
.mp-gouts button:disabled{opacity:.4}
.mp-phrase{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.25);color:#FFF4E6;font:inherit;font-size:16px}
.mp-reveler{font-size:18px;animation:tf-brille 1.8s ease-in-out infinite}
.mp-ecrit{display:flex;flex-direction:column;align-items:center;gap:16px;padding:18px 0}
.mp-dos{display:grid;place-items:center;width:130px;height:186px;border-radius:18px;background:linear-gradient(145deg,#FF2E9A,#7B1B5E);font-size:54px;box-shadow:0 0 40px rgba(255,46,154,.5);animation:mp-tourne 1.2s ease-in-out infinite}
.mp-nouvelle{align-self:center;margin:0;padding:8px 18px;border-radius:999px;background:linear-gradient(135deg,#F2C46B,#FF8FCB);color:#2A0F1F;font-size:16px;font-weight:900;animation:mp-tampon .6s cubic-bezier(.2,1.6,.4,1) .7s both}
.mp-sienne.revelee .pc-scene{animation:mp-revele 1s cubic-bezier(.2,1.2,.4,1) both}
.mp-monte{display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.mp-niveau{display:flex;align-items:center;gap:8px}
.mp-badge{flex:none;padding:4px 10px;border-radius:999px;background:linear-gradient(135deg,#F2C46B,#B8801E);color:#2A1408;font-size:12.5px;font-weight:900}
.mp-badge.suivant{background:rgba(255,255,255,.1);color:#D9C3CB}
.mp-xp{position:relative;flex:1;display:block;height:10px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
.mp-xp i{position:absolute;left:0;top:0;bottom:0;width:6%;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);animation:mp-attend 2s ease-in-out infinite}
.mp-monte p{margin:0;font-size:13.5px;line-height:1.45;color:#D9C3CB}
.mp-monte p b{color:#FFF4E6}
.mp-ou{align-self:flex-start;padding:9px 14px;border-radius:999px;border:1px solid rgba(242,196,107,.5);background:rgba(242,196,107,.1);color:#FFE7B8;font:inherit;font-size:13.5px;font-weight:900;cursor:pointer}
@keyframes pc-remplit{from{transform:scaleX(0)}}
@keyframes pc-holo{0%,100%{background-position:100% 0}50%{background-position:0 0}}
@keyframes pc-mystere{0%,100%{box-shadow:0 26px 50px -24px rgba(0,0,0,.95),0 0 20px -10px var(--a)}50%{box-shadow:0 26px 50px -24px rgba(0,0,0,.95),0 0 40px 0 rgba(255,46,154,.55)}}
@keyframes pc-tombe{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(105vh) rotate(720deg)}}
@keyframes mp-entre{from{opacity:0;transform:translateX(24px)}}
@keyframes mp-saute{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes mp-gain{0%{opacity:0;transform:translateY(6px) scale(.6)}20%{opacity:1;transform:translateY(-4px) scale(1.1)}100%{opacity:0;transform:translateY(-22px) scale(1)}}
@keyframes mp-tourne{0%,100%{transform:perspective(500px) rotateY(0)}50%{transform:perspective(500px) rotateY(180deg)}}
@keyframes mp-revele{from{transform:perspective(700px) rotateY(-180deg) scale(.85);opacity:.4}}
@keyframes mp-tampon{from{opacity:0;transform:scale(2.2) rotate(-12deg)}}
@keyframes mp-attend{0%,100%{width:6%}50%{width:14%}}
@keyframes tf-brille{0%,100%{box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}50%{box-shadow:0 0 0 6px rgba(255,46,154,.25),0 16px 34px -10px rgba(255,46,154,1)}}
@keyframes mc-reflet{to{background-position:-200% 0}}
@media (min-width:860px){
  .mp-grille{grid-template-columns:340px minmax(0,1fr);gap:36px}
  .mp-quiz{max-width:620px;margin:0 auto;width:100%;box-sizing:border-box}
}
@media (prefers-reduced-motion:reduce){.pc *,.mp *,.pc-holo,.pc{animation:none!important;transition:none!important}}
`;
