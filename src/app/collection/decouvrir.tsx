"use client";

/**
 * 🔥 « DÉCOUVRIR » — le fil des mèmes de sa ville (7 novembre 2026 ; le lot 2 le même jour) :
 *   · EN HAUT, LE MÈME DU JOUR (`lib/direct/theme-du-jour.ts`) : le thème d'aujourd'hui, le même pour tout le monde ;
 *     combien de réponses dans sa ville (de vrais chiffres ; peu : « Sois parmi les premiers ») ; il répond (« 🔥 Je
 *     réponds »), PUIS il voit les réponses des autres — ses proches d'abord ;
 *   · LE FIL : les mèmes que les gens de sa ville ont choisi d'y montrer (leur accord), ses proches d'abord (ceux de ses
 *     duos, ses amis des Rencontres) ; et ceux des commerçants ClikMe — LA MÊME CARTE que les gens, leur nom (un toucher :
 *     leur page, compté), sans bandeau ni gros bouton : « ça ne doit pas faire pub ». Au plus un mème de commerçant
 *     toutes les cinq cartes, jamais deux à la suite ;
 *   · 😂 ❤️ 🔥 sous chaque mème : une réaction par personne (il la change, ou la retire), un compte seulement ;
 *   · chaque vidéo joue toute seule, en silence, quand on la voit (un toucher : le son) ; « 📲 Partager ».
 * La liste se recharge à chaque fois qu'il ouvre l'onglet.
 */
import { useContext, useEffect, useRef, useState } from "react";
import type { MemeCommerce } from "@/lib/direct/memes-commerces";
import type { MemePublic } from "@/lib/direct/ma-figurine";
import { REACS, type CleReac, type ReacMeme } from "@/lib/direct/reactions-memes";
import { nomVille, type EtatDuJour } from "@/lib/direct/theme-du-jour";
import { GuideDit, OngletVisible } from "./guide";
import { chiffresDuJour, repondreAuJour } from "./theme-du-jour";

type Commerce = MemeCommerce & { reac?: ReacMeme };
/** Un élément du fil : le mème d'un commerçant, ou celui d'un habitant de sa ville (qui l'a choisi). */
type Element = { genre: "commerce"; m: Commerce } | { genre: "client"; m: MemePublic };
type Fil = { memes: Commerce[]; publics: MemePublic[]; ville: string; jour: (EtatDuJour & { reponses: MemePublic[] }) | null; compte: boolean };

/** « aujourd'hui », « hier », « 6 nov. » (heure de Paris). */
function quand(le: string): string {
  const jour = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const d = new Date(le);
  if (Number.isNaN(d.getTime())) return "";
  if (jour(d) === jour(new Date())) return "aujourd’hui";
  if (jour(d) === jour(new Date(Date.now() - 86_400_000))) return "hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
}

const poster = (url: string, corps: Record<string, unknown>) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });

/**
 * LE DOSAGE (« au plus un mème de commerçant sur cinq ou six, jamais deux à la suite ») : un commerçant après chaque
 * groupe de cinq mèmes des gens ; et un seul en tout tant que les gens sont moins de cinq.
 */
export function entrelacer<A, B>(gens: A[], commerces: B[]): (A | B)[] {
  const l: (A | B)[] = [];
  let c = 0;
  gens.forEach((g, k) => {
    l.push(g);
    if ((k + 1) % 5 === 0 && c < commerces.length) l.push(commerces[c++]);
  });
  if (c === 0 && commerces.length) l.push(commerces[c++]);
  return l;
}

/** 😂 ❤️ 🔥 : une réaction par personne ; un compte seulement (rien quand il n'y en a pas). */
function Reactions({ reac, onReagir, actif }: { reac?: ReacMeme; onReagir: (r: CleReac | null) => void; actif: boolean }) {
  return (
    <span className="dv-reacs" role="group" aria-label="Réagir">
      {REACS.map((r) => {
        const n = reac?.n[r.cle] ?? 0;
        const pris = reac?.moi === r.cle;
        return (
          <button key={r.cle} type="button" className={`dv-reac${pris ? " pris" : ""}`} aria-pressed={pris} aria-label={r.nom} disabled={!actif} onClick={() => onReagir(pris ? null : r.cle)}>
            <span aria-hidden="true">{r.emoji}</span>
            {n > 0 && <b>{n}</b>}
          </button>
        );
      })}
    </span>
  );
}

/** Un mème du fil : il joue quand on le voit (en silence), s'arrête quand on passe ; un toucher : le son. */
function MemeDuFil({ e, actif, compte, onRetire, onReagir }: { e: Element; actif: boolean; compte: boolean; onRetire: (id: string) => void; onReagir: (e: Element, r: CleReac | null) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [muet, setMuet] = useState(true);
  const [partage, setPartage] = useState("");
  const m = e.m;
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (!actif) {
      v.pause();
      return;
    }
    const o = new IntersectionObserver(
      ([x]) => {
        if (x.isIntersecting && x.intersectionRatio >= 0.6) void v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    o.observe(v);
    return () => o.disconnect();
  }, [actif]);
  async function partager() {
    const lien = `${window.location.origin}${e.genre === "commerce" ? `/meme/${m.id}` : `/figurine/${m.id}`}`;
    // (la mesure : ce que son mème rapporte)
    if (e.genre === "commerce") void poster("/api/direct/memes-commerces", { action: "geste", type: "partage", id: m.id }).catch(() => undefined);
    else void poster("/api/direct/ma-figurine", { action: "meme-evenement", type: "partage", id: m.id }).catch(() => undefined);
    try {
      if (typeof navigator.share === "function") return await navigator.share({ url: lien, title: e.genre === "commerce" ? `${e.m.emoji} ${e.m.nom}` : `🎭 Le mème de ${e.m.prenom || "quelqu’un"}` });
    } catch {
      return; /* il a fermé la feuille de partage */
    }
    try {
      await navigator.clipboard.writeText(lien);
      setPartage("Lien copié ✓");
    } catch {
      setPartage("");
    }
  }
  async function signaler() {
    if (!window.confirm("Signaler ce mème ? Il ne s’affichera plus.")) return;
    const r = await poster("/api/direct/ma-figurine", { action: "signaler", id: m.id }).catch(() => null);
    if (r?.ok) onRetire(m.id);
  }
  const reac = e.m.reac;
  return (
    <li className={`dv-carte${e.genre === "client" ? " client" : " commerce"}${e.genre === "client" && e.m.ami ? " ami" : ""}`}>
      <div className="dv-video">
        <video
          ref={video}
          src={m.video}
          {...(m.image ? { poster: m.image } : {})}
          muted={muet}
          loop
          playsInline
          preload="metadata"
          onClick={() => {
            const v = video.current;
            if (!v) return;
            v.muted = !muet;
            setMuet(!muet);
            void v.play().catch(() => undefined);
          }}
        />
        <span className="dv-son" aria-hidden="true">
          {muet ? "🔇" : "🔊"}
        </span>
      </div>
      <div className="dv-bas">
        {e.genre === "commerce" ? (
          // LA MÊME CARTE QUE LES GENS : son nom (un toucher : sa page, compté), rien qui fasse pub
          <a className="dv-qui dv-nom" href={`/meme/${m.id}/voir`}>
            <b>
              {e.m.emoji} {e.m.nom}
            </b>
            <small>
              {e.m.ville ? `${e.m.ville} · ` : ""}
              {quand(e.m.le)}
            </small>
          </a>
        ) : (
          <span className="dv-qui">
            <b>
              🎭 {e.m.prenom || "Quelqu’un"}
              {e.m.moi ? " · toi" : ""}
            </b>
            <small>
              {e.m.ami ? "👯 Proche" : "De ta ville"} · {quand(e.m.le)}
              {!e.m.moi && (
                <>
                  {" "}
                  ·{" "}
                  <button type="button" className="dv-signaler" onClick={signaler}>
                    Signaler
                  </button>
                </>
              )}
            </small>
          </span>
        )}
        <span className="dv-actions">
          {e.genre === "client" && !e.m.moi && (
            <a className="dv-repondre" href={`/figurine/${m.id}/repondre`}>
              ↩️ Répondre
            </a>
          )}
          <button type="button" className="dv-partager" onClick={partager} aria-label="Partager ce mème">
            {partage || "📲"}
          </button>
        </span>
      </div>
      <Reactions reac={reac} actif={compte} onReagir={(r) => onReagir(e, r)} />
    </li>
  );
}

export function Decouvrir({ allerA }: { allerA: (o: string) => void }) {
  const visible = useContext(OngletVisible);
  const [fil, setFil] = useState<Fil | null>(null);
  const [panne, setPanne] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!visible) return;
    let fini = false;
    fetch("/api/direct/memes-commerces", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: Partial<Fil> & { jour?: EtatDuJour & { reponses?: MemePublic[] } }) => {
        if (fini) return;
        setFil({
          memes: Array.isArray(j.memes) ? j.memes : [],
          publics: Array.isArray(j.publics) ? j.publics : [],
          ville: j.ville ?? "",
          jour: j.jour?.theme ? { ...j.jour, reponses: Array.isArray(j.jour.reponses) ? j.jour.reponses : [] } : null,
          compte: Boolean(j.compte),
        });
        setPanne(false);
      })
      .catch(() => !fini && setPanne(true));
    return () => {
      fini = true;
    };
  }, [visible]);

  /** 😂 ❤️ 🔥 : il réagit (tout de suite à l'écran ; le serveur rend les vrais comptes). */
  async function reagir(e: Element, r: CleReac | null) {
    setMessage("");
    const cle = e.genre === "commerce" ? `c-${e.m.id}` : e.m.id;
    const maj = (reac: ReacMeme) =>
      setFil((f) =>
        f
          ? {
              ...f,
              memes: f.memes.map((x) => (e.genre === "commerce" && x.id === e.m.id ? { ...x, reac } : x)),
              publics: f.publics.map((x) => (e.genre === "client" && x.id === e.m.id ? { ...x, reac } : x)),
              jour: f.jour ? { ...f.jour, reponses: f.jour.reponses.map((x) => (e.genre === "client" && x.id === e.m.id ? { ...x, reac } : x)) } : f.jour,
            }
          : f,
      );
    const avant: ReacMeme = e.m.reac ?? { n: { rire: 0, coeur: 0, feu: 0 } };
    const n = { ...avant.n };
    if (avant.moi) n[avant.moi] = Math.max(0, n[avant.moi] - 1);
    if (r) n[r] += 1;
    maj({ n, ...(r ? { moi: r } : {}) });
    const rep = await poster("/api/direct/ma-figurine", { action: "reagir", id: cle, reac: r }).catch(() => null);
    const j = (await rep?.json().catch(() => null)) as { reac?: ReacMeme; error?: string } | null;
    if (rep?.ok && j?.reac) maj(j.reac);
    else {
      maj(avant);
      setMessage(j?.error || "Ta réaction n’est pas partie. Réessaie.");
    }
  }

  // LE FIL : les gens de sa ville (ses proches d'abord), et les commerçants dosés ; ceux d'ailleurs s'il n'y a rien ici
  const gens: Element[] = fil ? fil.publics.map((m) => ({ genre: "client" as const, m })) : [];
  const commerces: Element[] = fil
    ? [...fil.memes.filter((m) => !fil.ville || m.villeSlug === fil.ville), ...fil.memes.filter((m) => fil.ville && m.villeSlug !== fil.ville)].map((m) => ({ genre: "commerce" as const, m }))
    : [];
  const elements = entrelacer(gens, commerces);
  const dAilleurs = elements.length > 0 && elements.every((e) => e.genre === "commerce" && fil?.ville && e.m.villeSlug !== fil.ville);
  const retirer = (id: string) =>
    setFil((f) => (f ? { ...f, publics: f.publics.filter((m) => m.id !== id), jour: f.jour ? { ...f.jour, reponses: f.jour.reponses.filter((m) => m.id !== id) } : f.jour } : f));
  const jour = fil?.jour ?? null;
  return (
    <div className="dv">
      <header className="og-tete">
        <small>DÉCOUVRIR</small>
        <h2>Les mèmes du jour près de chez toi</h2>
      </header>
      <GuideDit
        cle="pablito-decouvrir-2"
        popup
        repliques={[
          { t: "Chaque jour, un mème du jour : le même thème pour tout le monde 🔥", v: "euphorie" },
          { t: "Réponds avec ta figurine… et tu verras les réponses des gens de ta ville !", v: "joie" },
          { t: "Un mème te plaît ? 😂 ❤️ 🔥, ou réponds-lui en duo 📲", v: "joie", apres: "louche" },
        ]}
      />
      {panne && <p className="mc-vide">Le fil n’a pas pu s’afficher. Réessaie dans un instant.</p>}
      {!fil && !panne && (
        <div className="mc-attente" aria-label="Chargement">
          <i />
        </div>
      )}

      {/* 🔥 LE MÈME DU JOUR : tu postes ta réponse, puis tu vois celles des autres */}
      {jour && (
        <section className="dv-jour" aria-label="Le mème du jour">
          <small className="tj-label">🔥 LE MÈME DU JOUR</small>
          <b className="tj-titre">
            <span aria-hidden="true">{jour.theme.emoji}</span> {jour.theme.titre}
          </b>
          <span className="tj-chiffres">{chiffresDuJour(jour)}</span>
          {!fil?.compte ? (
            <button type="button" className="tj-go" onClick={() => allerA("figurine")}>
              📸 Crée ta figurine pour répondre
            </button>
          ) : !jour.repondu ? (
            <>
              <button
                type="button"
                className="tj-go"
                onClick={() => {
                  allerA("figurine");
                  window.setTimeout(() => repondreAuJour(jour), 200);
                }}
              >
                🔥 Je réponds avec ma figurine
              </button>
              {jour.n > 0 && <p className="dv-flou">👀 Réponds, et tu verras les réponses de {nomVille(jour.ville) || "ta ville"}.</p>}
            </>
          ) : jour.reponses.length ? (
            <ul className="dv-fil dv-fil-jour">
              {jour.reponses.map((m) => (
                <MemeDuFil key={`jour-${m.id}`} e={{ genre: "client", m }} actif={visible} compte={Boolean(fil?.compte)} onRetire={retirer} onReagir={reagir} />
              ))}
            </ul>
          ) : null}
        </section>
      )}

      {fil && !elements.length && !jour && (
        <section className="mm-vide">
          <span aria-hidden="true">🔥</span>
          <b>Pas encore de mème du jour par ici</b>
          <p>Les gens de ta ville et les commerçants ClikMe montrent ici leurs mèmes. En attendant, fais le tien !</p>
          <button type="button" className="og-go" onClick={() => allerA("figurine")}>
            🎭 Créer mon mème
          </button>
        </section>
      )}
      {elements.length > 0 && (
        <>
          <b className="dv-sous">Le fil</b>
          {dAilleurs && <p className="dv-note">Rien encore dans ta ville aujourd’hui : voici ceux d’ailleurs.</p>}
          <ul className="dv-fil">
            {elements.map((e) => (
              <MemeDuFil key={`${e.genre}-${e.m.id}`} e={e} actif={visible} compte={Boolean(fil?.compte)} onRetire={retirer} onReagir={reagir} />
            ))}
          </ul>
        </>
      )}
      {message && (
        <p className="tf-erreur" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

export const STYLES_DECOUVRIR = `
.dv{display:flex;flex-direction:column;gap:6px}
.dv-note{margin:6px 0 0;font-size:13px;color:#D9C3CB}
.dv-sous{margin-top:14px;font-size:15px;font-weight:900}
.dv-jour{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin-top:10px;padding:16px;border-radius:24px;background:radial-gradient(100% 90% at 0% 0%,rgba(255,122,89,.32),transparent 60%),radial-gradient(90% 80% at 100% 100%,rgba(255,46,154,.28),transparent 60%),rgba(255,255,255,.05);border:1.5px solid rgba(255,122,89,.55)}
.dv-jour .dv-fil{width:100%}
.dv-flou{margin:4px 0 0;font-size:13px;color:#E8D3DC}
.dv-fil{display:flex;flex-direction:column;gap:22px;margin:14px 0 0;padding:0;list-style:none}
.dv-carte{display:flex;flex-direction:column;gap:8px}
.dv-video{position:relative;width:100%;max-width:440px;margin:0 auto;aspect-ratio:9/16;max-height:72dvh;border-radius:26px;overflow:hidden;background:#1E0918;box-shadow:0 26px 50px -24px rgba(0,0,0,.95)}
.dv-carte.ami .dv-video{box-shadow:0 0 0 2px rgba(127,240,196,.6),0 26px 50px -24px rgba(0,0,0,.95)}
.dv-video video{display:block;width:100%;height:100%;object-fit:cover;cursor:pointer}
.dv-son{position:absolute;right:12px;bottom:12px;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.55);font-size:17px;pointer-events:none;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.dv-bas{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;max-width:440px;margin:0 auto}
.dv-qui{display:flex;flex-direction:column;gap:1px;min-width:0}
.dv-nom{color:inherit;text-decoration:none}
.dv-qui b{font-size:16.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv-qui small{font-size:12.5px;color:#D9C3CB}
.dv-signaler{padding:0;border:0;background:none;color:#8D7580;font:inherit;font-size:12px;text-decoration:underline;cursor:pointer}
.dv-actions{display:flex;align-items:center;gap:8px;flex:none}
.dv-repondre{padding:9px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font-size:13px;font-weight:800;text-decoration:none;white-space:nowrap}
.dv-partager{min-width:42px;height:42px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:16px;font-weight:800;cursor:pointer}
.dv-reacs{display:flex;gap:8px;width:100%;max-width:440px;margin:0 auto}
.dv-reac{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#FFF4E6;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
.dv-reac span{font-size:17px;line-height:1}
.dv-reac.pris{border-color:#FF2E9A;background:rgba(255,46,154,.2)}
.dv-reac:disabled{opacity:.55;cursor:default}
`;
