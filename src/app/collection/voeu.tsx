"use client";

/**
 * ✨ « MON VŒU » DANS « DÉCOUVRIR » (11 novembre 2026 — `lib/direct/voeu.ts` pour la règle ; le propriétaire : « je
 * pensais que c'était plutôt dans l'onglet Découvrir que Mon vœu se passait »). Les premières pages de Découvrir :
 *   · LA PREMIÈRE : son vœu en grand (sa figurine le dit, « 6 jours en route », les vues ; sans vœu : « ✨ Fais un
 *     vœu »), la rangée des réponses à son vœu (un anneau rose tant qu'il ne les a pas vues, « AIDE » pour une aide) — et
 *     « Ta mission du jour 0/3 » : les trois vœux à encourager, en petit, et « Encourager · 1 minute » (personne d'autre
 *     dans sa ville : « 📲 Inviter mes amis ») ;
 *   · LES TROIS VŒUX DE SA MISSION, en plein écran : la figurine de l'autre dit son vœu ; il l'encourage avec SES têtes
 *     déjà faites (un mot en sticker), propose son aide (une phrase écrite, ou SA voix), passe (l'autre ne le saura
 *     jamais), ou signale ;
 *   · « MISSION ACCOMPLIE » : la série (la flamme), « demain, ton vœu passe en premier » ;
 * puis le mème du jour et les mèmes, comme avant. Toucher son vœu : sa page (le compteur,
 * les têtes qui y croient, les réponses, « Faire évoluer »). Toucher une réponse : elle s'ouvre en grand.
 * Jamais de voix de synthèse : une aide est écrite (dans la bulle de sa figurine), ou dite avec SA voix.
 */
import { useContext, useEffect, useRef, useState } from "react";
import {
  MOT_AIDE_MAX,
  PHRASES_AIDE,
  TETES_ENCOURAGER,
  TETES_REPONDRE,
  TEXTE_VOEU_MAX,
  VOCAL_AIDE_MAX,
  VOEUX_PRETS,
  categorieDe,
  categoriesPour,
  type CarteVoeu,
  type CleCategorie,
  type EtatVoeu,
  type Mission,
  type ReponseVoeu,
  type RetourVoeu,
} from "@/lib/direct/voeu";
import { OngletVisible } from "./guide";
import { Feuille } from "./ma-figurine";
import { demanderOui } from "./fenetre";
import { ouvrirConversation } from "./rituel";

type Reponse = { ok?: boolean; error?: string; etat?: EtatVoeu; mission?: Mission; phrases?: string[]; texte?: string; categorie?: CleCategorie; dixHuit?: boolean; cle?: string; prenom?: string };
async function demander(corps: Record<string, unknown>): Promise<Reponse> {
  const r = await fetch("/api/direct/voeu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  const j = (await r.json().catch(() => ({}))) as Reponse;
  if (!r.ok) throw Object.assign(new Error(j.error || "Ça n’est pas passé. Réessaie."), { reponse: j });
  return j;
}

/** Une image (les figurines). */
function Im({ src, className, alt = "" }: { src: string; className?: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} className={className} alt={alt} draggable={false} />;
}

/** « il y a 3 h », « il y a 20 min », « hier ». */
function ilYA(le: string): string {
  const t = Date.parse(le);
  if (!t) return "";
  const m = Math.max(1, Math.round((Date.now() - t) / 60_000));
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return h < 48 ? "hier" : `il y a ${Math.round(h / 24)} jours`;
}
const pluriel = (n: number, un: string, des: string) => `${n} ${n > 1 ? des : un}`;
const defiler = (id: string) => window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);

/** Les couleurs du fond de chaque catégorie (la scène où la figurine de l'autre dit son vœu). */
const FONDS: Record<CleCategorie, string> = {
  bouger: "linear-gradient(160deg,#2EC4B6,#13867D)",
  apprendre: "linear-gradient(160deg,#8C7CF7,#5A47D6)",
  monde: "linear-gradient(160deg,#FFB547,#F07B2D)",
  coup: "linear-gradient(160deg,#FF7AA8,#E0457E)",
  conseil: "linear-gradient(160deg,#F7D154,#E0A21F)",
  projet: "linear-gradient(160deg,#5EA8FF,#2F6FE0)",
  sortir: "linear-gradient(160deg,#FF6F91,#C53A8C)",
};

// ─── 🔞 « As-tu 18 ans ou plus ? » (une fois) ─────────────────────────────────────────────────────────────────────────
function QuestionAge({ onEtat }: { onEtat: (e: EtatVoeu) => void }) {
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const dire = async (oui: boolean) => {
    if (charge) return;
    if (!oui && !(await demanderOui({ emoji: "🎒", titre: "Tu as entre 15 et 17 ans ?", texte: "Tu croiseras les vœux des 15-17 ans, et eux les tiens. Tu ne pourras pas changer ta réponse.", oui: "Oui, 15-17 ans", non: "Je me suis trompé" }))) return;
    setCharge(true);
    setErreur("");
    try {
      const j = await demander({ action: "dix-huit", oui });
      if (j.etat) onEtat(j.etat);
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setCharge(false);
    }
  };
  return (
    <div className="vx-age">
      <b>Avant ta première mission</b>
      <p>As-tu 18 ans ou plus ?</p>
      <small>Les 15-17 ans ne croisent que les vœux des 15-17 ans.</small>
      <div className="vx-age-boutons">
        <button type="button" className="tj-go" disabled={charge} onClick={() => void dire(true)}>
          Oui, 18 ans ou plus
        </button>
        <button type="button" className="vx-second" disabled={charge} onClick={() => void dire(false)}>
          Non, entre 15 et 17 ans
        </button>
      </div>
      {erreur && <p className="tf-erreur">{erreur}</p>}
    </div>
  );
}

// ─── 🎙️ sa voix (20 s au plus) ───────────────────────────────────────────────────────────────────────────────────────
const TYPES_SON = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
type Son = { url: string; data: string; duree: number };
function useMicro(max: number) {
  const micro = useRef<{ rec: MediaRecorder; flux: MediaStream; t0: number; minuteur: number } | null>(null);
  const [enreg, setEnreg] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [son, setSon] = useState<Son | null>(null);
  const [erreur, setErreur] = useState("");
  function arreter() {
    const m = micro.current;
    if (m && m.rec.state !== "inactive") m.rec.stop();
  }
  async function commencer() {
    setErreur("");
    let flux: MediaStream;
    try {
      flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return setErreur("Autorise le micro pour enregistrer ta voix.");
    }
    const type = typeof MediaRecorder !== "undefined" ? TYPES_SON.find((t) => MediaRecorder.isTypeSupported?.(t)) : undefined;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(flux, type ? { mimeType: type } : undefined);
    } catch {
      flux.getTracks().forEach((t) => t.stop());
      return setErreur("Ce téléphone ne sait pas enregistrer ici. Essaie avec un autre navigateur.");
    }
    const morceaux: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && morceaux.push(e.data);
    rec.onstop = () => {
      const m = micro.current;
      micro.current = null;
      if (m) window.clearInterval(m.minuteur);
      flux.getTracks().forEach((t) => t.stop());
      setEnreg(false);
      const duree = Math.min(max, (performance.now() - (m?.t0 ?? performance.now())) / 1000);
      if (duree < 0.8) return setErreur("Trop court : garde le doigt, et parle.");
      const blob = new Blob(morceaux, { type: rec.mimeType || type || "audio/webm" });
      const lecteur = new FileReader();
      lecteur.onload = () => setSon({ url: URL.createObjectURL(blob), data: String(lecteur.result), duree });
      lecteur.readAsDataURL(blob);
    };
    const t0 = performance.now();
    const minuteur = window.setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      setSecondes(t);
      if (t >= max) arreter();
    }, 100);
    micro.current = { rec, flux, t0, minuteur };
    setSecondes(0);
    setSon(null);
    rec.start(250);
    setEnreg(true);
  }
  useEffect(
    () => () => {
      const m = micro.current;
      if (m) {
        window.clearInterval(m.minuteur);
        m.flux.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );
  return { enreg, secondes, son, erreur, commencer, arreter, oublier: () => setSon(null) };
}

// ─── ✋ « Je peux aider » ─────────────────────────────────────────────────────────────────────────────────────────────
function JePeuxAider({ carte, moi, onFermer, onMission }: { carte: CarteVoeu | null; moi: EtatVoeu["moi"]; onFermer: () => void; onMission: (m: Mission) => void }) {
  const [choisie, setChoisie] = useState("");
  const [libre, setLibre] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const micro = useMicro(VOCAL_AIDE_MAX);
  const phrases = carte ? PHRASES_AIDE[carte.categorie] : [];
  const texte = libre !== null ? libre.trim() : choisie;
  const pret = Boolean(micro.son || texte);
  async function envoyer() {
    if (!carte || !pret || envoi) return;
    setEnvoi(true);
    setErreur("");
    try {
      const j = await demander(micro.son ? { action: "geste", vue: carte.vue, geste: "aide", son: micro.son.data, duree: micro.son.duree } : { action: "geste", vue: carte.vue, geste: "aide", texte });
      if (j.mission) onMission(j.mission);
      onFermer();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <Feuille ouverte={Boolean(carte)} onFermer={onFermer} titre="Je peux aider" className="vx-feuille vx-aider">
      {carte && (
        <>
          <b className="tf-feuille-titre">Ta figurine dit à {carte.prenom} :</b>
          <div className="vx-apercu">
            {moi && <Im src={moi.tetes.tropbien || moi.neutre} className="vx-apercu-tete" />}
            <p className={`vx-apercu-bulle${micro.son ? " voix" : ""}`}>{micro.son ? `🎙️ Ta voix · ${Math.round(micro.son.duree)} s` : texte || "…"}</p>
          </div>
          <div className="vx-phrases" role="radiogroup" aria-label="Une phrase toute prête">
            {phrases.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={libre === null && !micro.son && choisie === p}
                className={libre === null && !micro.son && choisie === p ? "pris" : ""}
                onClick={() => {
                  micro.oublier();
                  setLibre(null);
                  setChoisie(p);
                }}
              >
                {p}
              </button>
            ))}
            {libre === null ? (
              <button
                type="button"
                className="vx-libre"
                onClick={() => {
                  micro.oublier();
                  setLibre(choisie);
                }}
              >
                ✏️ Écrire la mienne
              </button>
            ) : (
              <label className="vx-libre-champ">
                <span className="vx-cache">Ta phrase</span>
                <textarea value={libre} maxLength={MOT_AIDE_MAX} rows={2} placeholder={`Ce que ta figurine dit à ${carte.prenom}…`} onChange={(e) => setLibre(e.target.value)} />
                <small>
                  {libre.length}/{MOT_AIDE_MAX}
                </small>
              </label>
            )}
          </div>
          {/* 🎙️ SA voix (jamais une voix de synthèse) */}
          {micro.enreg ? (
            <button type="button" className="vx-voix enreg" onClick={micro.arreter}>
              ⏹ C’est dit · {Math.floor(micro.secondes)} s / {VOCAL_AIDE_MAX}
            </button>
          ) : micro.son ? (
            <div className="vx-voix-faite">
              <audio src={micro.son.url} controls preload="auto" />
              <button type="button" className="vx-second" onClick={() => void micro.commencer()}>
                🔁 Refaire
              </button>
            </div>
          ) : (
            <button type="button" className="vx-voix" onClick={() => void micro.commencer()}>
              🎙️ Ou dis-le avec ta voix
            </button>
          )}
          {(erreur || micro.erreur) && <p className="tf-erreur">{erreur || micro.erreur}</p>}
          <button type="button" className="tj-go vx-envoyer" disabled={!pret || envoi || micro.enreg} onClick={() => void envoyer()}>
            {envoi ? "Ta figurine part…" : "Envoyer ma figurine"}
          </button>
          <p className="vx-note">{carte.prenom} la verra dans les réponses à son vœu ; si {carte.prenom} te répond, vous devenez proches et continuez avec vos figurines. Jamais de numéro.</p>
        </>
      )}
    </Feuille>
  );
}

// ─── 🎯 une carte de la mission (plein écran) ────────────────────────────────────────────────────────────────────────
function CarteMission({ c, k, mission, moi, onGeste, onAider }: { c: CarteVoeu; k: number; mission: Mission; moi: EtatVoeu["moi"]; onGeste: (c: CarteVoeu, geste: "encourage" | "passe" | "signale", tete?: string) => Promise<boolean>; onAider: (c: CarteVoeu) => void }) {
  const [envoi, setEnvoi] = useState(false);
  const [tete, setTete] = useState("");
  const cat = categorieDe(c.categorie);
  const t = TETES_ENCOURAGER.find((x) => x.cle === tete);
  const geste = async (g: "encourage" | "passe" | "signale", cle?: string) => {
    if (envoi || c.geste) return;
    if (g === "signale" && !(await demanderOui({ emoji: "🚩", titre: "Signaler ce vœu ?", texte: "Il ne s’affichera plus chez personne, le temps qu’on le regarde. Tu ne le reverras pas.", oui: "Signaler", danger: true }))) return;
    setEnvoi(true);
    if (cle) setTete(cle);
    const ok = await onGeste(c, g, cle);
    if (!ok) setTete("");
    setEnvoi(false);
  };
  return (
    <section className={`dv-diapo vx-carte${c.geste ? " faite" : ""}`} id={`mission-${k}`} aria-label={`Le vœu de ${c.prenom}`}>
      <div className="vx-barre">
        <span className="vx-traits" aria-hidden="true">
          {mission.cartes.map((x, i) => (
            <i key={x.vue} className={x.geste ? "plein" : i === k ? "ici" : ""} />
          ))}
        </span>
        <b>Ta mission du jour</b>
        {mission.serie > 0 && <span className="vx-flamme">🔥 {mission.serie}</span>}
      </div>
      <div className="vx-scene" style={{ background: FONDS[c.categorie] }}>
        <p className="vx-dit">{c.texte}</p>
        <Im src={c.figurine} className="vx-fig" alt={`La figurine de ${c.prenom}`} />
        <div className="vx-qui">
          <span>
            <b>{c.prenom}</b>
            <small>
              Son vœu, jour {c.jours}
              {c.ville ? ` · ${c.ville}` : ""}
            </small>
          </span>
          {cat && (
            <em>
              {cat.emoji} {cat.nom}
            </em>
          )}
        </div>
        {/* ✓ son geste : sa tête et son mot, posés sur la scène */}
        {(c.geste || t) && (
          <div className={`vx-pose ${c.geste || "encourage"}`} aria-live="polite">
            {c.geste === "passe" ? (
              <span className="vx-pose-passe">Vœu passé</span>
            ) : c.geste === "aide" ? (
              <>
                {moi && <Im src={moi.tetes.tropbien || moi.neutre} className="vx-pose-tete" />}
                <span className="vx-sticker aide">✋ TU PEUX AIDER</span>
              </>
            ) : (
              <>
                {moi && <Im src={(t && moi.tetes[t.cle]) || moi.neutre} className="vx-pose-tete" />}
                <span className="vx-sticker">{t?.mot ?? "ENVOYÉ !"}</span>
              </>
            )}
          </div>
        )}
      </div>
      <p className="vx-lab">Encourage {c.prenom} avec ta tête</p>
      <div className="vx-tetes">
        {TETES_ENCOURAGER.map((x) => (
          <button key={x.cle} type="button" className={tete === x.cle ? "pris" : ""} disabled={envoi || Boolean(c.geste)} aria-label={`${x.nom} : envoyer ma tête`} onClick={() => void geste("encourage", x.cle)}>
            <span className="vx-tete-im">
              {moi && <Im src={moi.tetes[x.cle] || moi.neutre} />}
              {!moi?.tetes[x.cle] && <i aria-hidden="true">{x.emoji}</i>}
            </span>
            <small>{x.nom}</small>
          </button>
        ))}
      </div>
      <div className="vx-boutons">
        <button type="button" className="vx-second" disabled={envoi || Boolean(c.geste)} onClick={() => void geste("passe")}>
          Passer
        </button>
        {c.loin ? (
          // (un vœu « sur place » d'une autre ville : on l'encourage d'ici, on ne peut pas y aider)
          <span className="vx-loin">📍 Ce vœu se réalise à {c.ville || "une autre ville"} : encourage-le avec ta tête</span>
        ) : (
          <button type="button" className="tj-go vx-aide" disabled={envoi || (Boolean(c.geste) && c.geste !== "encourage")} onClick={() => onAider(c)}>
            ✋ Je peux aider
          </button>
        )}
      </div>
      <p className="vx-note">
        {c.prenom} ne saura jamais que tu as passé ·{" "}
        <button type="button" className="vx-lien" disabled={envoi || Boolean(c.geste)} onClick={() => void geste("signale")}>
          Signaler
        </button>
      </p>
    </section>
  );
}

// ─── ✨ « Fais un vœu » ───────────────────────────────────────────────────────────────────────────────────────────────
function FaisUnVoeu({ ouverte, remplacer, etat, onFermer, onEtat }: { ouverte: boolean; remplacer: boolean; etat: EtatVoeu; onFermer: () => void; onEtat: (e: EtatVoeu) => void }) {
  const [texte, setTexte] = useState("");
  const [cat, setCat] = useState<CleCategorie | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [surprise, setSurprise] = useState(false);
  const [erreur, setErreur] = useState("");
  const proposes = useRef<string[]>([]);
  const ville = etat.ville || "ta ville";
  const tuiles = categoriesPour(etat.adulte !== false);
  const pret = (t: string) => Object.values(VOEUX_PRETS).some((l) => l.includes(t));
  function tuile(c: CleCategorie) {
    setErreur("");
    // (son texte à lui, déjà écrit : la tuile dit seulement de quoi il s'agit)
    if (texte.trim() && !pret(texte)) return setCat(c);
    const l = VOEUX_PRETS[c];
    const suivant = cat === c ? l[(l.indexOf(texte) + 1) % l.length] : (l.find((x) => !proposes.current.includes(x)) ?? l[0]);
    proposes.current = [...proposes.current, suivant].slice(-30);
    setCat(c);
    setTexte(suivant);
  }
  async function surprends() {
    if (surprise) return;
    setSurprise(true);
    setErreur("");
    try {
      const j = await demander({ action: "surprise", sauf: proposes.current });
      if (j.texte && j.categorie) {
        proposes.current = [...proposes.current, j.texte].slice(-30);
        setTexte(j.texte);
        setCat(j.categorie);
      }
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setSurprise(false);
    }
  }
  async function publier() {
    if (envoi) return;
    if (!texte.trim()) return setErreur("Écris d’abord ton vœu, ou touche une idée.");
    if (!cat) return setErreur("Touche la tuile qui va avec ton vœu (Bouger, Apprendre…).");
    setEnvoi(true);
    setErreur("");
    try {
      const j = await demander({ action: remplacer ? "remplacer" : "publier", texte, categorie: cat });
      if (j.etat) onEtat(j.etat);
      setTexte("");
      setCat(null);
      onFermer();
    } catch (e) {
      setErreur((e as Error).message);
    } finally {
      setEnvoi(false);
    }
  }
  return (
    <Feuille ouverte={ouverte} onFermer={onFermer} titre="Fais un vœu" className="vx-feuille vx-faire">
      <b className="tf-feuille-titre">{remplacer ? "Un autre vœu" : "Fais un vœu"}</b>
      <p className="tf-feuille-dit">Une envie qu’une personne de {ville} pourrait t’aider à réaliser.</p>
      {etat.adulte === null ? (
        <QuestionAge onEtat={onEtat} />
      ) : (
        <>
          <div className="vx-scene-moi">
            {etat.moi && <Im src={etat.moi.neutre} className="vx-moi-fig" />}
            <p className={`vx-dit${texte.trim() ? "" : " vide"}`}>{texte.trim() || "Ton vœu s’écrit ici…"}</p>
            <span className="vx-un-seul">★ Un seul vœu à la fois</span>
          </div>
          <div className="vx-idees-tete">
            <b>Choisis une idée</b>
            <small>Retouche pour une autre</small>
          </div>
          <div className="vx-tuiles">
            {tuiles.map((c) => (
              <button key={c.cle} type="button" className={cat === c.cle ? "pris" : ""} aria-pressed={cat === c.cle} onClick={() => tuile(c.cle)}>
                <span aria-hidden="true">{c.emoji}</span>
                {c.nom}
              </button>
            ))}
            <button type="button" className="vx-surprise" disabled={surprise} onClick={() => void surprends()}>
              <span aria-hidden="true">{surprise ? "⏳" : "🎲"}</span>
              Surprise
            </button>
          </div>
          <label className="vx-champ">
            <span className="vx-cache">Ou écris le tien</span>
            <textarea
              value={texte}
              maxLength={TEXTE_VOEU_MAX}
              rows={2}
              placeholder="Ou écris le tien…"
              onChange={(e) => {
                setTexte(e.target.value.replace(/\n/g, " "));
                setErreur("");
              }}
            />
            <small>
              {texte.length}/{TEXTE_VOEU_MAX}
            </small>
          </label>
          <ul className="vx-promesses">
            <li>
              <span aria-hidden="true">👀</span>Des gens de {ville} le découvrent chaque jour
            </li>
            <li>
              <span aria-hidden="true">🙂</span>Ils te répondent avec leur figurine
            </li>
            <li>
              <span aria-hidden="true">✋</span>Quelqu’un peut t’aider
            </li>
          </ul>
          {erreur && <p className="tf-erreur">{erreur}</p>}
          <button type="button" className="tj-go vx-publier" disabled={envoi} onClick={() => void publier()}>
            {envoi ? "Ton vœu part…" : remplacer ? "🔄 Le remplacer" : "✨ Publier mon vœu"}
            <small>{remplacer ? "L’ancien s’arrête ; le nouveau part aujourd’hui" : "Les premiers le découvrent dès aujourd’hui"}</small>
          </button>
          <p className="vx-note">Jamais de numéro ni d’adresse : vous vous parlerez par vos figurines.</p>
        </>
      )}
    </Feuille>
  );
}

// ─── 🙂 une réponse, en grand (les réponses défilent) ────────────────────────────────────────────────────────────────
function Reponses({
  liste,
  depart,
  moi,
  onFermer,
  onSignaler,
  onRepondre,
  onParler,
  onTete,
}: {
  liste: ReponseVoeu[];
  depart: number | null;
  moi: EtatVoeu["moi"];
  onFermer: () => void;
  onSignaler: (r: ReponseVoeu) => void;
  onRepondre: (r: ReponseVoeu, oui: boolean) => void;
  onParler: (r: ReponseVoeu) => void;
  onTete: (r: ReponseVoeu, tete: string) => Promise<boolean>;
}) {
  const [i, setI] = useState(depart ?? 0);
  const [envoi, setEnvoi] = useState("");
  const r = depart === null ? null : liste[i];
  useEffect(() => {
    if (depart === null) return;
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [depart, onFermer]);
  if (!r) return null;
  const suivant = () => (i + 1 < liste.length ? setI(i + 1) : onFermer());
  return (
    <div className="vx-story" role="dialog" aria-modal="true" aria-label={`La réponse de ${r.prenom}`}>
      <div className="vx-story-traits" aria-hidden="true">
        {liste.map((x, k) => (
          <i key={x.id} className={k <= i ? "plein" : ""} />
        ))}
      </div>
      <header className="vx-story-tete">
        <Im src={r.images?.n || r.tete} />
        <span>
          <b>{r.prenom}</b>
          <small>{ilYA(r.le)}</small>
        </span>
        <button type="button" className="vx-story-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
      </header>
      <button type="button" className="vx-story-gauche" aria-label="La réponse d’avant" onClick={() => setI(Math.max(0, i - 1))} />
      <button type="button" className="vx-story-droite" aria-label="La réponse suivante" onClick={suivant} />
      {r.texte && <p className="vx-dit vx-story-dit">{r.texte}</p>}
      <div className="vx-story-scene">
        <span className="vx-story-cadre">
          <Im src={r.tete} className="vx-story-fig" alt={`La figurine de ${r.prenom}`} />
          <span className={`vx-sticker${r.genre === "aide" ? " aide" : ""}`}>{r.genre === "aide" ? "✋ PEUT T’AIDER" : (r.mot ?? "J’Y CROIS !")}</span>
        </span>
      </div>
      {r.son && <audio key={r.id} className="vx-story-son" src={r.son} autoPlay controls />}
      {/* ✋ UNE AIDE : lui répondre avec sa figurine (ils deviennent proches), ou « Pas pour moi » (la maquette 4b) */}
      {r.genre === "aide" && !r.decision && (
        <div className="vx-story-gestes">
          <button type="button" className="tj-go" onClick={() => onRepondre(r, true)}>
            Lui répondre avec ma figurine
          </button>
          <button type="button" className="vx-second" onClick={() => onRepondre(r, false)}>
            Pas pour moi
          </button>
          <small>Si tu lui réponds, vous devenez proches. Jamais de numéro.</small>
        </div>
      )}
      {r.decision === "accepte" && (
        <div className="vx-story-gestes">
          <button type="button" className="tj-go" onClick={() => onParler(r)}>
            🎙️ Parler à {r.prenom}
          </button>
          <small>✓ Vous êtes proches.</small>
        </div>
      )}
      {r.decision === "refuse" && <small className="vx-story-pas">Pas pour toi : {r.prenom} ne le saura pas.</small>}
      {/* 🙂 RÉPONDS AVEC TA TÊTE (la maquette 4a) : à une tête qui t'encourage, tes visages déjà faits et un mot */}
      {r.genre === "encourage" && (
        <div className="vx-story-repondre">
          <small>{r.merci ? `✓ Tu lui as répondu : ${TETES_REPONDRE.find((x) => x.cle === r.merci)?.mot ?? ""}` : "Réponds avec ta tête"}</small>
          <div className="vx-story-tetes">
            {TETES_REPONDRE.map((x) => (
              <button
                key={x.cle}
                type="button"
                className={r.merci === x.cle ? "pris" : ""}
                disabled={Boolean(envoi)}
                aria-label={`${x.nom} : lui répondre avec ma tête`}
                onClick={async () => {
                  setEnvoi(x.cle);
                  await onTete(r, x.cle);
                  setEnvoi("");
                }}
              >
                <span className="vx-tete-im">
                  {moi && <Im src={moi.tetes[x.cle] || moi.neutre} />}
                  {!moi?.tetes[x.cle] && <i aria-hidden="true">{x.emoji}</i>}
                </span>
                <small>{x.nom}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      {r.genre === "aide" && (
        <button type="button" className="vx-lien vx-story-signaler" onClick={() => onSignaler(r)}>
          Signaler
        </button>
      )}
    </div>
  );
}

// ─── ↩️ les têtes qu'on lui a répondues, en grand ─────────────────────────────────────────────────────────────────────
function Retours({ liste, depart, onFermer }: { liste: RetourVoeu[]; depart: number; onFermer: () => void }) {
  const [i, setI] = useState(depart);
  const r = liste[i];
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);
  if (!r) return null;
  const suivant = () => (i + 1 < liste.length ? setI(i + 1) : onFermer());
  return (
    <div className="vx-story vx-story-retour" role="dialog" aria-modal="true" aria-label={`${r.prenom} t’a répondu`}>
      <div className="vx-story-traits" aria-hidden="true">
        {liste.map((x, k) => (
          <i key={x.id} className={k <= i ? "plein" : ""} />
        ))}
      </div>
      <header className="vx-story-tete">
        <Im src={r.tete} />
        <span>
          <b>{r.prenom} t’a répondu</b>
          <small>{ilYA(r.le)}</small>
        </span>
        <button type="button" className="vx-story-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
      </header>
      <button type="button" className="vx-story-gauche" aria-label="Le retour d’avant" onClick={() => setI(Math.max(0, i - 1))} />
      <button type="button" className="vx-story-droite" aria-label="Le retour suivant" onClick={suivant} />
      {r.voeu && (
        <p className="vx-dit vx-story-dit">
          <small>Son vœu</small>
          {r.voeu}
        </p>
      )}
      <div className="vx-story-scene">
        <span className="vx-story-cadre">
          <Im src={r.tete} className="vx-story-fig" alt={`La figurine de ${r.prenom}`} />
          <span className="vx-sticker">{r.mot}</span>
        </span>
      </div>
      <small className="vx-story-pas">Sa figurine te répond, pour ta tête sur son vœu.</small>
    </div>
  );
}

// ─── 🙂 la page de son vœu ───────────────────────────────────────────────────────────────────────────────────────────
function PageMonVoeu({ ouverte, etat, onFermer, onEtat, onRemplacer, onOuvrir }: { ouverte: boolean; etat: EtatVoeu; onFermer: () => void; onEtat: (e: EtatVoeu) => void; onRemplacer: () => void; onOuvrir: (k: number) => void }) {
  const v = etat.voeu;
  const [evoluer, setEvoluer] = useState(false);
  const [edition, setEdition] = useState<string | null>(null);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  async function faire(corps: Record<string, unknown>) {
    if (charge) return false;
    setCharge(true);
    setErreur("");
    try {
      const j = await demander(corps);
      if (j.etat) onEtat(j.etat);
      return true;
    } catch (e) {
      setErreur((e as Error).message);
      return false;
    } finally {
      setCharge(false);
    }
  }
  const fermer = () => {
    setEvoluer(false);
    setEdition(null);
    setErreur("");
    onFermer();
  };
  return (
    <Feuille ouverte={ouverte} onFermer={fermer} titre="Mon vœu" className="vx-feuille vx-page">
      {v && (
        <>
          <b className="tf-feuille-titre">Mon vœu</b>
          <div className="vx-scene-moi">
            {etat.moi && <Im src={etat.moi.neutre} className="vx-moi-fig" />}
            {edition === null ? (
              <p className="vx-dit">
                {v.texte}
                <button type="button" className="vx-crayon" aria-label="Le reformuler" onClick={() => setEdition(v.texte)}>
                  ✏️
                </button>
              </p>
            ) : (
              <label className="vx-champ vx-dit-champ">
                <span className="vx-cache">Ton vœu</span>
                <textarea value={edition} maxLength={TEXTE_VOEU_MAX} rows={3} onChange={(e) => setEdition(e.target.value.replace(/\n/g, " "))} />
                <small>
                  {edition.length}/{TEXTE_VOEU_MAX}
                </small>
              </label>
            )}
            <span className="vx-compteur">
              <b>{v.jours}</b> {v.jours > 1 ? "jours en route" : "jour en route"}
            </span>
            <span className="vx-vues">👁 {pluriel(v.vues, "vue", "vues")}</span>
          </div>
          {edition !== null && (
            <div className="vx-boutons">
              <button type="button" className="vx-second" onClick={() => setEdition(null)}>
                Annuler
              </button>
              <button type="button" className="tj-go" disabled={charge} onClick={async () => (await faire({ action: "modifier", texte: edition })) && setEdition(null)}>
                Enregistrer
              </button>
            </div>
          )}
          {v.statut === "pause" && <p className="vx-pause">⏸️ En pause : personne ne le reçoit, le compteur s’est arrêté.</p>}
          <div className="vx-croient">
            {v.tetes.length > 0 && (
              <span className="vx-visages" aria-hidden="true">
                {v.tetes.slice(0, 8).map((u, k) => (
                  <Im key={k} src={u} />
                ))}
              </span>
            )}
            <span>{v.croient ? `${pluriel(v.croient, "figurine croit", "figurines croient")} en ton vœu` : "Les premières têtes arrivent bientôt."}</span>
          </div>
          <b className="vx-lab">Les réponses</b>
          {etat.reponses.length ? (
            <ul className="vx-reponses">
              {etat.reponses.map((r, k) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onOuvrir(k)}>
                    <Im src={r.tete} className={`vx-rond-im${r.genre === "aide" ? " aide" : ""}`} />
                    <span>
                      <b>
                        {r.prenom}
                        {r.genre === "aide" && <em>{r.decision === "accepte" ? "PROCHE" : "AIDE"}</em>}
                      </b>
                      <small>{r.texte ? r.texte : r.son ? "🎙️ Un message avec sa voix" : `${r.emoji ?? ""} ${r.mot ?? ""}`.trim()}</small>
                    </span>
                    <i>{ilYA(r.le)}</i>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vx-vide">Les réponses arrivent au fil de la journée ; je te préviens le soir.</p>
          )}
          {erreur && <p className="tf-erreur">{erreur}</p>}
          {!evoluer ? (
            <button type="button" className="vx-second vx-evoluer" onClick={() => setEvoluer(true)}>
              Faire évoluer mon vœu
            </button>
          ) : (
            <div className="vx-options">
              <button type="button" onClick={() => setEdition(v.texte)}>
                ✏️ Le reformuler <small>le compteur continue</small>
              </button>
              <button type="button" disabled={charge} onClick={() => void faire({ action: "pause", oui: v.statut !== "pause" })}>
                {v.statut === "pause" ? "▶️ Le reprendre" : "⏸️ Le mettre en pause"} <small>{v.statut === "pause" ? "il repart chez les gens" : "plus personne ne le reçoit"}</small>
              </button>
              <button type="button" onClick={onRemplacer}>
                🔄 En faire un autre <small>celui-ci s’arrête</small>
              </button>
              <button
                type="button"
                className="danger"
                disabled={charge}
                onClick={async () => {
                  if (!(await demanderOui({ emoji: "🗑️", titre: "Annuler ton vœu ?", texte: "Il s’arrête : plus personne ne le recevra.", oui: "L’annuler", danger: true }))) return;
                  if (await faire({ action: "annuler" })) fermer();
                }}
              >
                🗑️ L’annuler
              </button>
            </div>
          )}
        </>
      )}
    </Feuille>
  );
}

// ─── ✨ les premières pages de « Découvrir » ──────────────────────────────────────────────────────────────────────────
export function MonVoeuDansDecouvrir({ allerA }: { allerA: (o: string) => void }) {
  const visible = useContext(OngletVisible);
  const [etat, setEtat] = useState<EtatVoeu | null>(null);
  const [faire, setFaire] = useState<null | "nouveau" | "remplacer">(null);
  const [page, setPage] = useState(false);
  const [aider, setAider] = useState<CarteVoeu | null>(null);
  const [story, setStory] = useState<number | null>(null);
  const [retour, setRetour] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  // 👯 il vient de répondre à une aide : « Marius et toi, proches ! » (la maquette 4d)
  const [proche, setProche] = useState<{ cle: string; prenom: string; tete: string } | null>(null);
  useEffect(() => {
    if (!visible) return;
    let fini = false;
    fetch("/api/direct/voeu", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { etat?: EtatVoeu }) => {
        if (fini || !j.etat) return;
        const e = j.etat;
        // 🔔 la notification de 19 h (`#reponses`) : ses réponses en grand, la première pas encore vue ; sinon, ses retours
        // (ouvertes ainsi, elles sont vues : le badge s'éteint)
        const k = window.location.hash === "#reponses" ? e.reponses.findIndex((r) => !r.vue) : -1;
        const kr = window.location.hash === "#reponses" && k < 0 ? e.retours.findIndex((r) => !r.vu) : -1;
        if (k >= 0) {
          setEtat({ ...e, nonVues: 0, reponses: e.reponses.map((x) => ({ ...x, vue: true })) });
          setStory(k);
          void demander({ action: "vues" }).catch(() => undefined);
        } else if (kr >= 0) {
          setEtat({ ...e, retours: e.retours.map((x) => ({ ...x, vu: true })) });
          setRetour(kr);
          void demander({ action: "retours-vus" }).catch(() => undefined);
        } else setEtat(e);
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [visible]);
  if (!etat || etat.indisponible) return null;

  const mission = etat.mission;
  const cartes = mission?.cartes ?? [];
  const faits = cartes.filter((c) => c.geste).length;
  const v = etat.voeu;
  const nouvelles = etat.reponses.filter((r) => !r.vue);
  const bulles = [...nouvelles, ...etat.reponses.filter((r) => r.vue)].slice(0, 12);
  const aidesEnAttente = etat.reponses.filter((r) => r.genre === "aide" && !r.decision);
  const aideEnAttente = aidesEnAttente[0] ?? null;
  const poserMission = (m: Mission) => setEtat((e) => (e ? { ...e, mission: m } : e));
  /** Son geste est parti : sa tête se voit un instant sur la scène, puis le vœu suivant (ou « Mission accomplie »). */
  const suivant = (m: Mission, attente: number) =>
    window.setTimeout(() => {
      poserMission(m);
      const k = m.cartes.findIndex((x) => !x.geste);
      defiler(k >= 0 ? `mission-${k}` : "mission-fin");
    }, attente);

  async function geste(c: CarteVoeu, g: "encourage" | "passe" | "signale", tete?: string): Promise<boolean> {
    setMessage("");
    try {
      const j = await demander({ action: "geste", vue: c.vue, geste: g, ...(tete ? { tete } : {}) });
      if (!j.mission) return false;
      suivant(j.mission, g === "encourage" ? 900 : 250);
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    }
  }
  const ouvrirMoi = () => {
    if (!v) return setFaire("nouveau");
    setPage(true);
    if (nouvelles.length) void voirLesReponses();
  };
  const ouvrirReponse = (r: ReponseVoeu) => {
    setStory(Math.max(0, etat.reponses.findIndex((x) => x.id === r.id)));
    if (nouvelles.length) void voirLesReponses();
  };
  /** 🙂 Il répond avec sa tête à une réponse (« Merci ! »…). */
  async function repondreAvecSaTete(r: ReponseVoeu, tete: string): Promise<boolean> {
    setMessage("");
    try {
      const j = await demander({ action: "repondre-tete", vue: r.id, tete });
      if (j.etat) setEtat(j.etat);
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    }
  }
  /** ↩️ Ses retours, en grand (le badge s'éteint). */
  function ouvrirRetour(k: number) {
    setRetour(k);
    if (etat?.retours.some((x) => !x.vu)) {
      setEtat((e) => (e ? { ...e, retours: e.retours.map((x) => ({ ...x, vu: true })) } : e));
      void demander({ action: "retours-vus" }).catch(() => undefined);
    }
  }
  /** ✋ Il répond à une aide : « Lui répondre avec ma figurine » (ils deviennent proches), ou « Pas pour moi ». */
  async function repondreAide(r: ReponseVoeu, oui: boolean) {
    setMessage("");
    try {
      const j = await demander({ action: "aide-reponse", vue: r.id, oui });
      if (j.etat) setEtat(j.etat);
      setStory(null);
      setPage(false);
      if (oui && j.cle) setProche({ cle: j.cle, prenom: j.prenom || r.prenom, tete: r.tete });
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  /** 🎙️ Leur conversation, dans « Proches » (le talkie-walkie des figurines). */
  function parlerA(cle: string) {
    setProche(null);
    setStory(null);
    setPage(false);
    allerA("proches");
    // (le micro prêt : la maquette 4c, « Ta figurine répond à Marius »)
    ouvrirConversation(cle, true);
  }
  /** 📲 « Inviter mes amis » (sa mission est vide : personne d'autre n'a de vœu dans sa ville) — le partage du téléphone,
   *  sinon le lien copié. */
  async function inviter() {
    const url = `${window.location.origin}/collection`;
    const texte = "Sur ClikMe, on fait un vœu avec sa figurine, et on s’encourage. Fais le tien !";
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "ClikMe", text: texte, url });
      } catch {
        /* (il a refermé le partage) */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${texte} ${url}`);
      setMessage("Lien copié : colle-le à tes amis.");
    } catch {
      setMessage(url);
    }
  }
    /** Il a vu ses réponses : le badge s'éteint (ici tout de suite, et sur le serveur). */
  async function voirLesReponses() {
    setEtat((e) => (e ? { ...e, nonVues: 0, reponses: e.reponses.map((x) => ({ ...x, vue: true })) } : e));
    await demander({ action: "vues" }).catch(() => undefined);
  }
  async function signalerReponse(r: ReponseVoeu) {
    if (!(await demanderOui({ emoji: "🚩", titre: "Signaler cette réponse ?", texte: "Elle ne s’affichera plus, et vous ne vous croiserez plus.", oui: "Signaler", danger: true }))) return;
    setStory(null);
    const j = await demander({ action: "signaler-reponse", vue: r.id }).catch(() => null);
    if (j?.etat) setEtat(j.etat);
  }

  return (
    <>
      {/* ✨ LA PREMIÈRE PAGE : son vœu (en grand), les réponses, la mission du jour */}
      <section className="dv-diapo vx-accueil" id="voeu" aria-label="Mon vœu et ma mission du jour">
        <header className="vx-entete">
          <span className="og-tete">
            <small>DÉCOUVRIR</small>
            <h2>{v ? "Ton vœu fait son chemin" : "Fais un vœu, encourage ceux des autres"}</h2>
          </span>
          {mission && mission.serie > 0 && (
            <span className="vx-flamme" aria-label={`Ta série : ${pluriel(mission.serie, "jour", "jours")}`}>
              🔥 {mission.serie}
            </span>
          )}
        </header>
        {etat.figurine ? (
          <>
            {nouvelles.length > 0 && (
              <p className="vx-ce-soir">
                <span>
                  {pluriel(nouvelles.length, "nouvelle réponse", "nouvelles réponses")}
                  {nouvelles.some((r) => r.genre === "aide") ? `, dont ${pluriel(nouvelles.filter((r) => r.genre === "aide").length, "aide", "aides")}` : ""}
                </span>
                <button type="button" className="vx-lien" onClick={() => ouvrirReponse(nouvelles[0])}>
                  Tout regarder
                </button>
              </p>
            )}
            {/* ✨ SON VŒU, EN GRAND (la maquette 2 de l'ingénieur ; le 12 novembre 2026, le propriétaire : sa petite bulle
                « 1 j » ne montrait pas son vœu) : sa figurine le dit ; un toucher, sa page */}
            {v && (
              <button type="button" className="vx-scene-moi vx-mon-voeu" onClick={ouvrirMoi} aria-label={`Mon vœu : ${v.texte}`}>
                {etat.moi && <Im src={etat.moi.neutre} className="vx-moi-fig" />}
                <span className="vx-dit">{v.texte}</span>
                <span className="vx-compteur">
                  <b>{v.jours}</b> {v.jours > 1 ? "jours en route" : "jour en route"}
                </span>
                <span className="vx-vues">{v.statut === "pause" ? "⏸️ En pause" : `👁 ${pluriel(v.vues, "vue", "vues")}`}</span>
              </button>
            )}
            {!v && etat.adulte !== null && (
              <button type="button" className="vx-faire-un" onClick={() => setFaire("nouveau")}>
                <span aria-hidden="true">✨</span>
                <span>
                  <b>Fais un vœu</b>
                  <small>Une envie ? Quelqu’un de {etat.ville || "ta ville"} peut t’aider à la réaliser.</small>
                </span>
              </button>
            )}
            {(bulles.length > 0 || etat.retours.length > 0) && (
              <ul className="vx-bulles" aria-label="Les réponses à ton vœu, et ce qu'on t'a répondu">
                {bulles.map((r) => (
                  <li key={r.id}>
                    <button type="button" className={`vx-bulle${r.vue ? "" : " neuve"}${r.genre === "aide" ? " aide" : ""}`} onClick={() => ouvrirReponse(r)} aria-label={`La réponse de ${r.prenom}`}>
                      <span className="vx-rond">
                        <Im src={r.tete} />
                        {(r.genre === "aide" || !r.vue) && <em>{r.genre === "aide" ? "AIDE" : "NEW"}</em>}
                      </span>
                      <small>{r.prenom}</small>
                    </button>
                  </li>
                ))}
                {/* ↩️ ce qu'on lui a répondu, à lui (ses encouragements, ses aides) */}
                {etat.retours.slice(0, 8).map((r, k) => (
                  <li key={`retour-${r.id}`}>
                    <button type="button" className={`vx-bulle retour${r.vu ? "" : " neuve"}`} onClick={() => ouvrirRetour(k)} aria-label={`${r.prenom} t’a répondu : ${r.mot}`}>
                      <span className="vx-rond">
                        <Im src={r.tete} />
                        <em>↩️ {r.mot}</em>
                      </span>
                      <small>{r.prenom}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* ✋ QUELQU'UN PEUT L'AIDER (12 novembre 2026, le propriétaire : « il n'y a rien qui spécifie que quelqu'un
                peut l'aider ») : la plus récente des aides auxquelles il n'a pas encore répondu, en grand */}
            {aideEnAttente && (
              <div className="vx-aide-carte">
                <button type="button" className="vx-aide-haut" onClick={() => ouvrirReponse(aideEnAttente)}>
                  <Im src={aideEnAttente.tete} className="vx-aide-tete" />
                  <span>
                    <b>✋ {aideEnAttente.prenom} peut t’aider</b>
                    <small>{ilYA(aideEnAttente.le)}</small>
                  </span>
                </button>
                {aideEnAttente.texte && <p className="vx-dit">{aideEnAttente.texte}</p>}
                {aideEnAttente.son && <audio src={aideEnAttente.son} controls preload="none" />}
                <div className="vx-boutons">
                  <button type="button" className="vx-second" onClick={() => void repondreAide(aideEnAttente, false)}>
                    Pas pour moi
                  </button>
                  <button type="button" className="tj-go" onClick={() => void repondreAide(aideEnAttente, true)}>
                    Lui répondre avec ma figurine
                  </button>
                </div>
                <p className="vx-note">
                  Si tu lui réponds, vous devenez proches : vous continuez avec vos figurines. Jamais de numéro.
                  {aidesEnAttente.length > 1 ? ` (${aidesEnAttente.length - 1} autre${aidesEnAttente.length > 2 ? "s" : ""} : touche leurs bulles.)` : ""}
                </p>
              </div>
            )}
            {etat.adulte === null ? (
              <QuestionAge onEtat={setEtat} />
            ) : (
              mission && (
                <div className="vx-mission">
                  <div className="vx-mission-tete">
                    <b>Ta mission du jour</b>
                    {cartes.length > 0 && (
                      <span className={faits === cartes.length ? "faite" : ""}>
                        {faits}/{cartes.length}
                      </span>
                    )}
                  </div>
                  {cartes.length ? (
                    <>
                      <p>{mission.faite ? "Mission accomplie ! Reviens demain : trois nouveaux vœux t’attendent." : v ? "Encourage 3 vœux : demain, ton vœu passe en premier." : "Encourage 3 vœux, en une minute."}</p>
                      <div className="vx-minis">
                        {cartes.map((c, k) => (
                          <button key={c.vue} type="button" className={c.geste ? "faite" : ""} onClick={() => defiler(`mission-${k}`)}>
                            <span className="vx-mini-im" style={{ background: FONDS[c.categorie] }}>
                              <Im src={c.figurine} />
                              {c.geste && <i aria-hidden="true">✓</i>}
                            </span>
                            <small>{c.texte}</small>
                          </button>
                        ))}
                      </div>
                      {!mission.faite && (
                        <button type="button" className="tj-go vx-encourager" onClick={() => defiler(`mission-${Math.max(0, cartes.findIndex((c) => !c.geste))}`)}>
                          Encourager · 1 minute
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="vx-vide-mission">
                        Pas encore d’autre vœu à {etat.ville || "ta ville"} aujourd’hui. Invite tes amis : leurs vœux arriveront ici
                        {v ? ", et ils encourageront le tien." : "."}
                      </p>
                      <button type="button" className="tj-go vx-inviter" onClick={() => void inviter()}>
                        📲 Inviter mes amis
                      </button>
                    </>
                  )}
                </div>
              )
            )}
            {v && v.croient > 0 && (
              <button type="button" className="vx-croient" onClick={() => setPage(true)}>
                <span className="vx-visages" aria-hidden="true">
                  {v.tetes.slice(0, 7).map((u, k) => (
                    <Im key={k} src={u} />
                  ))}
                </span>
                <span>
                  <b>{pluriel(v.croient, "figurine croit", "figurines croient")}</b> en ton vœu
                </span>
              </button>
            )}
          </>
        ) : (
          <div className="vx-sans">
            <span aria-hidden="true">✨</span>
            <b>Fais un vœu, avec ta figurine</b>
            <p>Elle le dit aux gens de ta ville ; ils t’encouragent avec leur figurine, et quelqu’un peut t’aider à le réaliser.</p>
            <button type="button" className="tj-go" onClick={() => allerA("figurine")}>
              📸 Créer ma figurine
            </button>
          </div>
        )}
        <span className="dv-glisse" aria-hidden="true">
          <i>⌃</i> {cartes.length && !mission?.faite ? "Glisse : ta mission" : "Glisse : le mème du jour"}
        </span>
      </section>

      {/* 🎯 LES TROIS VŒUX DE SA MISSION */}
      {etat.figurine &&
        mission &&
        cartes.map((c, k) => <CarteMission key={c.vue} c={c} k={k} mission={mission} moi={etat.moi} onGeste={geste} onAider={setAider} />)}

      {/* 🔥 MISSION ACCOMPLIE */}
      {mission?.faite && (
        <section className="dv-diapo vx-fini" id="mission-fin" aria-label="Mission accomplie">
          <span className="vx-fini-flamme" aria-hidden="true">
            🔥
          </span>
          <b className="vx-fini-jours">{pluriel(Math.max(1, mission.serie), "jour", "jours")}</b>
          <p className="vx-fini-dit">{mission.serie > 1 ? "d’affilée. Mission accomplie !" : "Mission accomplie !"}</p>
          <ul className="vx-promesses">
            <li>
              <span aria-hidden="true">⭐</span>
              {v ? "Demain, ton vœu passe en premier." : "Fais un vœu : demain, il passera en premier."}
            </li>
            <li>
              <span aria-hidden="true">🕖</span>
              {v ? "Les réponses à ton vœu arrivent au fil de la journée." : "Demain, trois nouveaux vœux à encourager."}
            </li>
          </ul>
          <button type="button" className="tj-go" onClick={ouvrirMoi}>
            {v ? "Voir mon vœu" : "✨ Faire un vœu"}
          </button>
          <span className="dv-glisse" aria-hidden="true">
            <i>⌃</i> Glisse : le mème du jour
          </span>
        </section>
      )}

      {message && (
        <p className="tf-erreur dv-message" role="alert">
          {message}
        </p>
      )}
      <JePeuxAider
        carte={aider}
        moi={etat.moi}
        onFermer={() => setAider(null)}
        onMission={(m) => {
          poserMission(m);
          suivant(m, 900);
        }}
      />
      <FaisUnVoeu ouverte={faire !== null} remplacer={faire === "remplacer"} etat={etat} onFermer={() => setFaire(null)} onEtat={setEtat} />
      <PageMonVoeu
        ouverte={page}
        etat={etat}
        onFermer={() => setPage(false)}
        onEtat={setEtat}
        onRemplacer={() => {
          setPage(false);
          setFaire("remplacer");
        }}
        onOuvrir={(k) => {
          setPage(false);
          setStory(k);
        }}
      />
      {story !== null && (
        <Reponses
          key={story}
          liste={etat.reponses}
          depart={story}
          moi={etat.moi}
          onTete={repondreAvecSaTete}
          onFermer={() => setStory(null)}
          onSignaler={(r) => void signalerReponse(r)}
          onRepondre={(r, oui) => void repondreAide(r, oui)}
          onParler={(r) => r.cle && parlerA(r.cle)}
        />
      )}
      {retour !== null && <Retours key={retour} liste={etat.retours} depart={retour} onFermer={() => setRetour(null)} />}
      {/* 👯 « Marius et toi, proches ! » (la maquette 4d) */}
      <Feuille ouverte={proche !== null} onFermer={() => setProche(null)} titre="Vous êtes proches" className="vx-feuille vx-proches">
        {proche && (
          <>
            <span className="vx-proches-tetes" aria-hidden="true">
              {etat.moi && <Im src={etat.moi.neutre} />}
              <i>★</i>
              <Im src={proche.tete} />
            </span>
            <b className="vx-proches-titre">{proche.prenom} et toi, proches !</b>
            <p className="tf-feuille-dit">Ta figurine peut lui parler dans « Proches », avec vos figurines. Jamais de numéro.</p>
            <button type="button" className="tj-go" onClick={() => parlerA(proche.cle)}>
              🎙️ Parler à {proche.prenom}
            </button>
            <button type="button" className="vx-second" onClick={() => setProche(null)}>
              Plus tard
            </button>
          </>
        )}
      </Feuille>
    </>
  );
}

export const STYLES_VOEU = `
/* ✨ la première page */
.vx-accueil{display:flex;flex-direction:column;gap:14px;height:auto;min-height:100dvh;padding:calc(70px + env(safe-area-inset-top)) 16px calc(130px + env(safe-area-inset-bottom));overflow:visible;
  background:radial-gradient(100% 38% at 50% 0%,rgba(255,46,154,.22),transparent 72%),linear-gradient(180deg,#1E0C18,#12060F 50%)}
.vx-entete{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.vx-entete .og-tete{margin:0}
.vx-entete .og-tete h2{font-size:26px}
.vx-flamme{flex:none;display:inline-flex;align-items:center;gap:4px;padding:5px 11px;border-radius:999px;background:rgba(255,122,89,.18);box-shadow:inset 0 0 0 1px rgba(255,160,90,.45);color:#FFD2A8;font-size:14px;font-weight:900}
.vx-ce-soir{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0;font-size:14px;font-weight:800}
.vx-lien{padding:0;border:0;background:none;color:#F2C46B;font:inherit;font-weight:800;text-decoration:underline;cursor:pointer}
.vx-lien:disabled{opacity:.5;cursor:default}
.vx-bulles{display:flex;gap:12px;margin:0 -16px;padding:2px 16px 4px;list-style:none;overflow-x:auto;scrollbar-width:none}
.vx-bulles::-webkit-scrollbar{display:none}
.vx-bulle{display:flex;flex-direction:column;align-items:center;gap:6px;width:72px;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;cursor:pointer}
.vx-rond{position:relative;display:block;width:68px;height:68px;padding:3px;box-sizing:border-box;border-radius:50%;background:rgba(255,255,255,.14)}
.vx-rond img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 14%;background:#3A1530;box-shadow:0 0 0 2px #1A0914}
.vx-bulle.neuve .vx-rond{background:linear-gradient(135deg,#FF2E9A,#FF7A59)}
.vx-bulle.aide .vx-rond{background:linear-gradient(135deg,#FF2E9A,#F2C46B)}
.vx-rond em{position:absolute;left:50%;bottom:-5px;transform:translateX(-50%);padding:1px 7px;border-radius:999px;background:#FF2E9A;color:#fff;font-style:normal;font-size:10px;font-weight:900;letter-spacing:.04em;white-space:nowrap;box-shadow:0 0 0 2px #1A0914}
.vx-bulle small{max-width:72px;font-size:12px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vx-mission{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:22px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.vx-mission-tete{display:flex;align-items:center;justify-content:space-between;gap:10px}
.vx-mission-tete b{font-size:17px;font-weight:900}
.vx-mission-tete span{font-size:15px;font-weight:900;color:#F2C46B}
.vx-mission-tete span.faite{color:#7FF0C4}
.vx-mission p{margin:0;font-size:13.5px;color:#E8D3DC}
.vx-minis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.vx-minis button{display:flex;flex-direction:column;gap:6px;padding:8px;border:0;border-radius:16px;background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.vx-mini-im{position:relative;display:block;height:64px;border-radius:12px;overflow:hidden}
.vx-mini-im img{position:absolute;left:50%;bottom:-6px;height:118%;transform:translateX(-50%);object-fit:contain}
.vx-mini-im i{position:absolute;inset:0;display:grid;place-items:center;background:rgba(8,40,30,.55);color:#7FF0C4;font-style:normal;font-size:26px;font-weight:900}
.vx-minis small{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:11.5px;font-weight:800;line-height:1.25}
.vx-encourager{margin-top:2px}
.vx-croient{display:flex;align-items:center;gap:10px;padding:0;border:0;background:none;color:#E8D3DC;font:inherit;font-size:13px;text-align:left;cursor:pointer}
.vx-mon-voeu{width:100%;border:0;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.vx-mon-voeu .vx-dit{display:block}
.vx-mon-voeu .vx-compteur,.vx-mon-voeu .vx-vues{display:flex}
.vx-vide-mission{line-height:1.45}
.vx-aide-carte{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:22px;background:linear-gradient(135deg,rgba(255,46,154,.2),rgba(242,196,107,.12));box-shadow:inset 0 0 0 1.5px rgba(255,46,154,.6)}
.vx-aide-haut{display:flex;align-items:center;gap:12px;padding:0;border:0;background:none;color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.vx-aide-haut span{display:flex;flex-direction:column}
.vx-aide-haut b{font-size:17px;font-weight:900}
.vx-aide-haut small{font-size:12px;color:#E8D3DC}
.vx-aide-tete{flex:none;width:56px;height:56px;border-radius:16px;object-fit:cover;object-position:50% 14%;background:#FF2E9A}
.vx-aide-carte .vx-dit{font-size:16px}
.vx-aide-carte audio{width:100%;height:40px}
.vx-story-repondre{position:relative;z-index:2;display:flex;flex-direction:column;gap:6px}
.vx-story-repondre>small{font-size:13px;font-weight:800;text-align:center}
.vx-story-tetes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.vx-story-tetes button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px 7px;border:0;border-radius:16px;background:rgba(0,0,0,.18);color:#fff;font:inherit;cursor:pointer}
.vx-story-tetes button.pris{background:rgba(255,46,154,.55);box-shadow:inset 0 0 0 2px #fff}
.vx-story-tetes small{font-size:11.5px;font-weight:800;white-space:nowrap}
.vx-story.vx-story-retour{background:linear-gradient(180deg,#F2A65A,#D9653B)}
.vx-story-dit small{display:block;font-size:11px;font-weight:900;letter-spacing:.06em;color:#A0607A;text-transform:uppercase}
.vx-bulle.retour .vx-rond{background:linear-gradient(135deg,#F2C46B,#FF7A59)}
.vx-bulle.retour .vx-rond em{background:#F2C46B;color:#2A1220}
.vx-story-gestes{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:8px}
.vx-story-gestes .tj-go{margin:0}
.vx-story-gestes .vx-second{width:100%;background:rgba(0,0,0,.18)}
.vx-story-gestes small,.vx-story-pas{position:relative;z-index:2;font-size:12px;text-align:center;opacity:.9}
.vx-proches .tf-feuille-corps{align-items:center;text-align:center}
.vx-proches-tetes{display:flex;align-items:center;gap:0;margin:6px 0 4px}
.vx-proches-tetes img{width:96px;height:96px;border-radius:26px;object-fit:cover;object-position:50% 14%;background:#FF2E9A;box-shadow:0 0 0 3px #1A0914}
.vx-proches-tetes img:last-child{transform:rotate(6deg);margin-left:-14px}
.vx-proches-tetes img:first-child{transform:rotate(-6deg)}
.vx-proches-tetes i{position:relative;z-index:2;display:grid;place-items:center;width:40px;height:40px;margin:0 -20px;border-radius:50%;background:#F2C46B;color:#2A1220;font-style:normal;font-size:20px}
.vx-proches-titre{font-size:24px;font-weight:900}
.vx-proches .tj-go,.vx-proches .vx-second{width:100%}
.vx-inviter{margin-top:2px}
.vx-croient b{color:#FFF4E6}
.vx-visages{display:flex;flex:none}
.vx-visages img{width:30px;height:30px;margin-right:-8px;border-radius:50%;object-fit:cover;object-position:50% 16%;background:#3A1530;box-shadow:0 0 0 2px #1A0914}
.vx-faire-un{display:flex;align-items:center;gap:12px;padding:14px;border:0;border-radius:20px;background:linear-gradient(135deg,rgba(242,196,107,.18),rgba(255,46,154,.14));box-shadow:inset 0 0 0 1.5px rgba(242,196,107,.5);color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.vx-faire-un>span:first-child{font-size:30px}
.vx-faire-un b{display:block;font-size:17px;font-weight:900}
.vx-faire-un small{font-size:12.5px;color:#FFE7B8}
.vx-sans{display:flex;flex-direction:column;align-items:center;gap:8px;margin:auto 0;text-align:center}
.vx-sans>span{font-size:56px}
.vx-sans b{font-size:22px;font-weight:900}
.vx-sans p{margin:0 0 6px;max-width:330px;color:#E8D3DC}
.vx-age{display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:22px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(242,196,107,.35);text-align:center}
.vx-age b{font-size:13px;font-weight:900;letter-spacing:.06em;color:#F2C46B;text-transform:uppercase}
.vx-age p{margin:0;font-size:20px;font-weight:900}
.vx-age small{font-size:12.5px;color:#CDB4C0}
.vx-age-boutons{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.vx-age-boutons .tj-go{margin:0}
.vx-second{min-height:48px;padding:12px 18px;border:0;border-radius:999px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);color:#FFF4E6;font:inherit;font-size:15px;font-weight:800;cursor:pointer}
.vx-second:disabled,.vx-tetes button:disabled{cursor:default}
.vx-note{margin:0;font-size:11.5px;line-height:1.35;color:#A88E99;text-align:center}
/* 🎯 une carte de la mission */
.vx-carte{display:flex;flex-direction:column;gap:9px;padding:calc(62px + env(safe-area-inset-top)) 16px calc(104px + env(safe-area-inset-bottom));background:#12060F}
.vx-barre{display:grid;grid-template-columns:1fr auto;align-items:center;gap:6px 10px}
.vx-traits{grid-column:1/-1;display:flex;gap:5px}
.vx-traits i,.vx-story-traits i{flex:1;height:4px;border-radius:999px;background:rgba(255,255,255,.16)}
.vx-traits i.ici{background:rgba(255,46,154,.55)}
.vx-traits i.plein,.vx-story-traits i.plein{background:#FF2E9A}
.vx-barre b{font-size:15px;font-weight:900}
.vx-scene{position:relative;flex:1;min-height:0;border-radius:26px;overflow:hidden;box-shadow:0 18px 40px -18px rgba(0,0,0,.9)}
.vx-dit{position:relative;z-index:2;margin:0;padding:12px 14px;border-radius:18px 18px 18px 6px;background:#FFF8F0;color:#22121B;font-size:18px;font-weight:800;line-height:1.25;box-shadow:0 10px 24px -12px rgba(0,0,0,.6)}
.vx-scene .vx-dit{position:absolute;left:12px;right:12px;top:12px}
.vx-fig{position:absolute;left:50%;bottom:44px;height:72%;max-width:92%;transform:translateX(-50%);object-fit:contain;filter:drop-shadow(0 14px 18px rgba(0,0,0,.35))}
.vx-qui{position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;background:linear-gradient(180deg,rgba(20,8,16,.55),rgba(20,8,16,.86))}
.vx-qui span{display:flex;flex-direction:column;min-width:0}
.vx-qui b{font-size:16px;font-weight:900}
.vx-qui small{font-size:12px;color:#E8D3DC}
.vx-qui em{flex:none;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.14);font-style:normal;font-size:12px;font-weight:800}
.vx-pose{position:absolute;right:12px;bottom:58px;z-index:3;display:flex;flex-direction:column;align-items:center;gap:4px;animation:vx-pop .45s cubic-bezier(.2,1.6,.4,1) both}
.vx-pose-tete{width:92px;height:92px;border-radius:24px;object-fit:cover;object-position:50% 14%;background:#FF2E9A;box-shadow:0 0 0 3px #FFF8F0,0 14px 28px -10px rgba(0,0,0,.7)}
.vx-sticker{display:inline-block;padding:6px 12px;border-radius:10px;background:#F2C46B;color:#2A1220;font-size:15px;font-weight:900;letter-spacing:.02em;transform:rotate(-6deg);box-shadow:0 8px 18px -8px rgba(0,0,0,.7)}
.vx-sticker.aide{background:#FF2E9A;color:#fff}
.vx-pose-passe{padding:8px 14px;border-radius:999px;background:rgba(20,8,16,.75);color:#E8D3DC;font-size:13px;font-weight:800}
.vx-lab{margin:2px 0 0;font-size:14px;font-weight:800;color:#F2C46B}
.vx-tetes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.vx-tetes button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 4px 7px;border:0;border-radius:16px;background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;cursor:pointer;transition:transform .15s}
.vx-tetes button:active{transform:scale(.94)}
.vx-tetes button.pris{background:rgba(255,46,154,.3);box-shadow:inset 0 0 0 2px #FF2E9A}
.vx-tete-im{position:relative;display:block;width:54px;height:54px}
.vx-tete-im img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 14%;background:#FF2E9A}
.vx-tete-im i{position:absolute;right:-4px;bottom:-2px;font-style:normal;font-size:20px;line-height:1}
.vx-tetes small{font-size:11.5px;font-weight:800;white-space:nowrap}
.vx-boutons{display:grid;grid-template-columns:auto 1fr;gap:10px}
.vx-boutons .tj-go{margin:0}
.vx-loin{display:flex;align-items:center;padding:8px 14px;border-radius:18px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);font-size:12.5px;font-weight:700;line-height:1.3;color:#E8D3DC}
.vx-carte.faite .vx-tetes,.vx-carte.faite .vx-boutons .vx-second,.vx-carte.faite .vx-loin,.vx-aide:disabled{opacity:.45}
/* 🔥 mission accomplie */
.vx-fini{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:calc(70px + env(safe-area-inset-top)) 22px calc(130px + env(safe-area-inset-bottom));text-align:center;background:radial-gradient(70% 40% at 50% 34%,rgba(255,122,89,.35),transparent 70%),#12060F}
.vx-fini-flamme{font-size:84px;line-height:1;filter:drop-shadow(0 14px 28px rgba(255,122,89,.8));animation:dv-flotte 3s ease-in-out infinite}
.vx-fini-jours{font-size:44px;font-weight:900;line-height:1;color:#FFB36B}
.vx-fini-dit{margin:0 0 6px;font-size:16px;font-weight:800}
.vx-fini .tj-go{max-width:330px}
.vx-promesses{display:flex;flex-direction:column;gap:8px;width:100%;max-width:360px;margin:0;padding:12px 14px;box-sizing:border-box;border-radius:18px;background:rgba(255,255,255,.06);list-style:none;text-align:left}
.vx-promesses li{display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:700}
.vx-promesses span{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.08)}
/* les feuilles */
.vx-feuille .tf-feuille-corps{display:flex;flex-direction:column;gap:10px}
.vx-apercu{display:flex;align-items:flex-end;gap:10px}
.vx-apercu-tete{flex:none;width:64px;height:64px;border-radius:18px;object-fit:cover;object-position:50% 14%;background:#FF2E9A}
.vx-apercu-bulle{flex:1;margin:0;padding:10px 12px;border-radius:16px 16px 16px 4px;background:#FFF8F0;color:#22121B;font-size:15px;font-weight:800;line-height:1.3}
.vx-apercu-bulle.voix{background:#FFE3F1}
.vx-phrases{display:flex;flex-direction:column;gap:8px}
.vx-phrases button{padding:12px 14px;border:0;border-radius:14px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);color:#FFF4E6;font:inherit;font-size:14.5px;font-weight:800;text-align:left;cursor:pointer}
.vx-phrases button.pris{background:rgba(255,46,154,.2);box-shadow:inset 0 0 0 1.5px #FF2E9A}
.vx-phrases .vx-libre{color:#F2C46B;box-shadow:inset 0 0 0 1px rgba(242,196,107,.35)}
.vx-libre-champ,.vx-champ{position:relative;display:block}
.vx-libre-champ textarea,.vx-champ textarea{display:block;width:100%;box-sizing:border-box;padding:12px 14px 22px;border:0;border-radius:14px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);color:#FFF4E6;font:inherit;font-size:15px;resize:none}
.vx-libre-champ small,.vx-champ small{position:absolute;right:12px;bottom:6px;font-size:11px;color:#A88E99}
.vx-voix{min-height:46px;padding:10px 14px;border:1.5px dashed rgba(255,255,255,.25);border-radius:14px;background:none;color:#FFF4E6;font:inherit;font-size:14.5px;font-weight:800;cursor:pointer}
.vx-voix.enreg{border-style:solid;border-color:#FF2E9A;background:rgba(255,46,154,.2);animation:vx-battre 1s ease-in-out infinite}
.vx-voix-faite{display:flex;align-items:center;gap:8px}
.vx-voix-faite audio{flex:1;min-width:0;height:40px}
.vx-envoyer,.vx-publier{margin:2px 0 0}
.vx-publier{display:flex;flex-direction:column;align-items:center;gap:1px}
.vx-publier small{font-size:12px;font-weight:700;opacity:.9}
.vx-scene-moi{position:relative;display:flex;flex-direction:column;gap:8px;min-height:150px;padding:12px 12px 12px 128px;border-radius:24px;background:linear-gradient(135deg,#3A1230,#24091C);box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);overflow:hidden}
.vx-moi-fig{position:absolute;left:6px;bottom:-8px;width:120px;height:160px;object-fit:contain;object-position:50% 100%}
.vx-scene-moi .vx-dit{font-size:16px}
.vx-scene-moi .vx-dit.vide{color:#9C8A93;font-weight:700}
.vx-crayon{margin-left:6px;padding:0;border:0;background:none;font-size:14px;cursor:pointer}
.vx-dit-champ textarea{background:#FFF8F0;color:#22121B;font-weight:800}
.vx-un-seul{align-self:flex-start;margin-top:auto;padding:4px 10px;border-radius:999px;background:rgba(242,196,107,.16);color:#FFE7B8;font-size:11.5px;font-weight:800}
.vx-compteur{display:flex;align-items:baseline;gap:6px;margin-top:auto;font-size:13px;font-weight:800}
.vx-compteur b{font-size:34px;line-height:1;color:#F2C46B}
.vx-vues{position:absolute;right:12px;bottom:12px;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.1);font-size:12px;font-weight:800}
.vx-idees-tete{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.vx-idees-tete b{font-size:15px;font-weight:900}
.vx-idees-tete small{font-size:12px;color:#A88E99}
.vx-tuiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.vx-tuiles button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:66px;padding:8px 4px;border:0;border-radius:16px;background:rgba(255,255,255,.07);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-size:12px;font-weight:800;line-height:1.15;text-align:center;cursor:pointer}
.vx-tuiles button span{font-size:22px;line-height:1}
.vx-tuiles button.pris{background:#F2C46B;color:#2A1220;box-shadow:none}
.vx-pause{margin:0;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.07);font-size:13px;font-weight:700}
.vx-reponses{display:flex;flex-direction:column;gap:6px;margin:0;padding:0;list-style:none}
.vx-reponses button{display:flex;align-items:center;gap:10px;width:100%;padding:8px;border:0;border-radius:16px;background:rgba(255,255,255,.06);color:#FFF4E6;font:inherit;text-align:left;cursor:pointer}
.vx-rond-im{flex:none;width:46px;height:46px;border-radius:50%;object-fit:cover;object-position:50% 14%;background:#3A1530;box-shadow:0 0 0 2px #F2C46B}
.vx-rond-im.aide{box-shadow:0 0 0 2px #FF2E9A}
.vx-reponses span{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}
.vx-reponses b{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:900}
.vx-reponses b em{padding:1px 6px;border-radius:999px;background:#FF2E9A;font-style:normal;font-size:9.5px;letter-spacing:.04em}
.vx-reponses small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;color:#E8D3DC}
.vx-reponses i{flex:none;font-style:normal;font-size:11px;color:#A88E99}
.vx-vide{margin:0;font-size:13px;color:#CDB4C0}
.vx-evoluer{margin-top:4px}
.vx-options{display:flex;flex-direction:column;gap:6px}
.vx-options button{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:11px 14px;border:0;border-radius:14px;background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:14.5px;font-weight:800;text-align:left;cursor:pointer}
.vx-options small{font-size:12px;font-weight:600;color:#CDB4C0}
.vx-options .danger{color:#FF9DB8}
/* 🙂 une réponse, en grand */
.vx-story{position:fixed;inset:0;z-index:45;display:flex;flex-direction:column;gap:14px;padding:calc(12px + env(safe-area-inset-top)) 16px calc(22px + env(safe-area-inset-bottom));box-sizing:border-box;background:linear-gradient(180deg,#8E86F5,#5F55D8);color:#fff;overflow:hidden}
.vx-story-traits{display:flex;gap:5px}
.vx-story-traits i{background:rgba(255,255,255,.35)}
.vx-story-traits i.plein{background:#fff}
.vx-story-tete{position:relative;z-index:3;display:flex;align-items:center;gap:10px}
.vx-story-tete img{width:38px;height:38px;border-radius:50%;object-fit:cover;object-position:50% 14%;background:#3A1530}
.vx-story-tete span{display:flex;flex-direction:column;flex:1}
.vx-story-tete b{font-size:15px;font-weight:900}
.vx-story-tete small{font-size:12px;opacity:.85}
.vx-story-fermer{width:40px;height:40px;border:0;border-radius:50%;background:rgba(0,0,0,.2);color:#fff;font-size:18px;cursor:pointer}
.vx-story-gauche,.vx-story-droite{position:absolute;top:80px;bottom:120px;z-index:1;width:40%;padding:0;border:0;background:none;cursor:pointer}
.vx-story-gauche{left:0}
.vx-story-droite{right:0;width:60%}
.vx-story-dit{position:relative;z-index:2;align-self:stretch;font-size:19px}
.vx-story-scene{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center}
.vx-story-fig{display:block;width:min(78vw,340px);height:min(78vw,340px);border-radius:40px;object-fit:cover;object-position:50% 14%;background:#FF2E9A;box-shadow:0 24px 50px -20px rgba(0,0,0,.6)}
.vx-story-cadre{position:relative;display:block}
.vx-story-cadre .vx-sticker{position:absolute;right:-12px;bottom:-14px;font-size:20px;animation:vx-pop .45s .15s cubic-bezier(.2,1.6,.4,1) both}
.vx-story-son{position:relative;z-index:2;width:100%}
.vx-story-signaler{position:relative;z-index:2;align-self:center;color:#fff}
.vx-cache{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@keyframes vx-pop{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes vx-battre{0%,100%{box-shadow:0 0 0 0 rgba(255,46,154,.5)}50%{box-shadow:0 0 0 8px rgba(255,46,154,0)}}
@media (min-width:860px){
  .vx-story{left:50%;right:auto;width:480px;transform:translateX(-50%)}
}
`;
