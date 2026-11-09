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
 *
 * 8 NOVEMBRE 2026, LE SWIPE (le propriétaire : « ça serait mieux un système de swipe plutôt que scroller vers le bas,
 * non ? » — oui) : une page par mème, en plein écran, et on glisse vers le haut pour le suivant, comme dans les
 * applis de vidéos. La première page : le mème du jour ; puis ses réponses (une fois la sienne postée) ; puis le fil ;
 * à la fin, « Tu as tout vu ». Le document « s'aimante » à chaque page (`scroll-snap`, seulement quand « Découvrir »
 * est ouvert) ; 😂 ❤️ 🔥, « Répondre » et « Partager » sont dans la colonne de droite, le nom en bas à gauche.
 */
import { useContext, useEffect, useRef, useState } from "react";
import type { MemeCommerce } from "@/lib/direct/memes-commerces";
import type { MemePublic } from "@/lib/direct/ma-figurine";
import { REACS, type CleReac, type ReacMeme } from "@/lib/direct/reactions-memes";
import { nomVille, type EtatDuJour } from "@/lib/direct/theme-du-jour";
import { OngletVisible } from "./guide";
import { chiffresDuJour, repondreAuJour } from "./theme-du-jour";
import { signalerOui } from "./fenetre";
import { InviterAppli } from "./mon-telephone";

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
// (`badge` : en haut de la page — « 🔥 le thème du jour » sur ses réponses, « voici ceux d'ailleurs »)
function MemeDuFil({ e, actif, compte, badge, onRetire, onReagir }: { e: Element; actif: boolean; compte: boolean; badge?: string; onRetire: (id: string) => void; onReagir: (e: Element, r: CleReac | null) => void }) {
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
    if (!(await signalerOui())) return;
    const r = await poster("/api/direct/ma-figurine", { action: "signaler", id: m.id }).catch(() => null);
    if (r?.ok) onRetire(m.id);
  }
  const reac = e.m.reac;
  return (
    <li className={`dv-carte${e.genre === "client" ? " client" : " commerce"}${e.genre === "client" && e.m.ami ? " ami" : ""}`}>
      <div className="dv-video">
        {/* (le mème en entier — ses mots vont jusqu'aux bords — ; autour, sa propre image, floutée) */}
        {m.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="dv-fond" src={m.image} alt="" aria-hidden="true" loading="lazy" />
        )}
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
      </div>
      <span className="dv-son" aria-hidden="true">
        {muet ? "🔇" : "🔊"}
      </span>
      {badge && <span className="dv-badge">{badge}</span>}
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
      </div>
      {/* LA COLONNE DE DROITE : 😂 ❤️ 🔥, répondre, partager */}
      <div className="dv-rail">
        <Reactions reac={reac} actif={compte} onReagir={(r) => onReagir(e, r)} />
        <span className="dv-actions">
          {e.genre === "client" && !e.m.moi && (
            <a className="dv-repondre" href={`/figurine/${m.id}/repondre`}>
              <span aria-hidden="true">↩️</span>
              <small>Répondre</small>
            </a>
          )}
          <button type="button" className="dv-partager" onClick={partager} aria-label="Partager ce mème">
            <span aria-hidden="true">📲</span>
            <small>{partage || "Partager"}</small>
          </button>
        </span>
      </div>
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
  // (ses réponses, une fois la sienne postée : les pages juste après le mème du jour)
  const reponsesJour = jour?.repondu ? jour.reponses : [];
  const nPages = reponsesJour.length + elements.length;
  return (
    <div className="dv">
      {/* (9 novembre 2026 : Pablito explique « Découvrir » dans la visite, sous le logo — plus de fenêtre ici) */}
      {panne && <p className="mc-vide">Le fil n’a pas pu s’afficher. Réessaie dans un instant.</p>}
      {!fil && !panne && (
        <div className="mc-attente" aria-label="Chargement">
          <i />
        </div>
      )}

      {/* 🔥 LA PREMIÈRE PAGE : LE MÈME DU JOUR — tu postes ta réponse, puis tu vois celles des autres */}
      {jour && (
        <section className="dv-diapo dv-jour" id="jour" aria-label="Le mème du jour">
          <header className="og-tete">
            <small>DÉCOUVRIR</small>
            <h2>Les mèmes du jour près de chez toi</h2>
          </header>
          <div className="dv-jour-carte">
            <small className="tj-label">🔥 LE MÈME DU JOUR</small>
            <span className="dv-jour-emoji" aria-hidden="true">
              {jour.theme.emoji}
            </span>
            <b className="tj-titre">{jour.theme.titre}</b>
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
            ) : (
              <p className="dv-repondu">✓ Tu as répondu{reponsesJour.length ? ` : glisse pour voir ${reponsesJour.length > 1 ? `les ${reponsesJour.length} réponses` : "la réponse"}` : "."}</p>
            )}
            {/* 🔔 le lot 3 : sa réponse postée (ou l'appli tout juste posée sur son iPhone), « je te préviens demain ? » */}
            {fil?.compte && <InviterAppli apres="jour" repondu={jour.repondu} />}
          </div>
          {nPages > 0 && (
            <span className="dv-glisse" aria-hidden="true">
              <i>⌃</i> Glisse vers le haut
            </span>
          )}
        </section>
      )}
      {reponsesJour.length > 0 && jour && (
        <ul className="dv-fil dv-fil-jour" aria-label="Les réponses au mème du jour">
          {reponsesJour.map((m) => (
            <MemeDuFil key={`jour-${m.id}`} e={{ genre: "client", m }} badge={`🔥 ${jour.theme.titre}`} actif={visible} compte={Boolean(fil?.compte)} onRetire={retirer} onReagir={reagir} />
          ))}
        </ul>
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
      {/* LE FIL : une page par mème */}
      {elements.length > 0 && (
        <ul className="dv-fil" aria-label="Le fil">
          {elements.map((e, k) => (
            <MemeDuFil
              key={`${e.genre}-${e.m.id}`}
              e={e}
              badge={k === 0 && dAilleurs ? "Rien encore dans ta ville aujourd’hui : voici ceux d’ailleurs" : undefined}
              actif={visible}
              compte={Boolean(fil?.compte)}
              onRetire={retirer}
              onReagir={reagir}
            />
          ))}
        </ul>
      )}
      {/* 🎉 LA DERNIÈRE PAGE */}
      {nPages > 0 && (
        <section className="dv-diapo dv-fin" aria-label="Tu as tout vu">
          <span aria-hidden="true">🎉</span>
          <b>Tu as tout vu pour aujourd’hui</b>
          <p>Demain, un nouveau mème du jour 🔥 En attendant, fais rire ta ville avec le tien.</p>
          <button type="button" className="tj-go" onClick={() => allerA("figurine")}>
            🎭 Faire mon mème
          </button>
          <button type="button" className="dv-revoir" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            ⌃ Revoir depuis le début
          </button>
        </section>
      )}
      {message && (
        <p className="tf-erreur dv-message" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

export const STYLES_DECOUVRIR = `
.dv{display:flex;flex-direction:column}
/* LE SWIPE : une page par mème, de la hauteur de l'écran ; le document s'aimante à chacune (quand « Découvrir » est ouvert) */
html:has(#o-decouvrir:not([hidden]) .dv-diapo){scroll-snap-type:y mandatory}
.dv-diapo,.dv-fil>.dv-carte{position:relative;box-sizing:border-box;height:100dvh;margin:0 -16px;scroll-snap-align:start;scroll-snap-stop:always;overflow:hidden}
.dv-fil{margin:0;padding:0;list-style:none}
/* 🔥 la première page : le mème du jour */
.dv-jour{display:flex;flex-direction:column;height:auto;min-height:100dvh;padding:calc(70px + env(safe-area-inset-top)) 20px calc(130px + env(safe-area-inset-bottom));overflow:visible;
  background:radial-gradient(90% 50% at 10% 25%,rgba(255,122,89,.42),transparent 65%),radial-gradient(90% 50% at 90% 80%,rgba(255,46,154,.4),transparent 65%),#16070F}
.dv-jour-carte{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:420px;margin:auto;text-align:center}
.dv-jour-emoji{font-size:88px;line-height:1;filter:drop-shadow(0 16px 26px rgba(255,46,154,.6));animation:dv-flotte 3.2s ease-in-out infinite}
.dv-jour .tj-titre{font-size:30px;line-height:1.08;letter-spacing:-.02em}
.dv-jour .tj-chiffres{font-size:14px}
.dv-jour .tj-go{max-width:360px}
.dv-flou,.dv-repondu{margin:4px 0 0;font-size:13.5px;color:#E8D3DC}
.dv-repondu{font-weight:800;color:#7FF0C4}
.dv-jour .ct-invite{width:100%;box-sizing:border-box;text-align:left}
.dv-glisse{position:absolute;left:0;right:0;bottom:calc(104px + env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:0;font-size:13px;font-weight:800;color:#FFD9EB;animation:dv-glisse 1.8s ease-in-out infinite;pointer-events:none}
.dv-glisse i{font-style:normal;font-size:22px;line-height:.8}
/* un mème : la vidéo sur toute la page ; le nom en bas à gauche ; la colonne de droite */
.dv-carte{background:#0B0409}
.dv-video{position:absolute;inset:0}
.dv-video{overflow:hidden}
.dv-fond{position:absolute;inset:-40px;width:calc(100% + 80px);height:calc(100% + 80px);object-fit:cover;filter:blur(28px) brightness(.5) saturate(1.2);transform:translateZ(0)}
.dv-video video{position:relative;display:block;width:100%;height:100%;object-fit:contain;cursor:pointer}
.dv-carte::before{content:"";position:absolute;left:0;right:0;top:0;z-index:1;height:150px;background:linear-gradient(180deg,rgba(11,4,9,.65),rgba(11,4,9,0));pointer-events:none}
.dv-carte::after{content:"";position:absolute;left:0;right:0;bottom:0;z-index:1;height:50%;background:linear-gradient(180deg,rgba(11,4,9,0),rgba(11,4,9,.5) 45%,rgba(11,4,9,.92));pointer-events:none}
.dv-carte.ami .dv-video{box-shadow:inset 0 0 0 3px rgba(127,240,196,.55)}
.dv-son{position:absolute;right:14px;top:calc(70px + env(safe-area-inset-top));z-index:2;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.5);font-size:17px;pointer-events:none;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.dv-badge{position:absolute;left:14px;top:calc(72px + env(safe-area-inset-top));z-index:2;max-width:calc(100% - 84px);box-sizing:border-box;padding:6px 12px;border-radius:999px;background:rgba(18,6,15,.72);font-size:12.5px;font-weight:800;line-height:1.3;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.dv-bas{position:absolute;left:16px;right:84px;bottom:calc(112px + env(safe-area-inset-bottom));z-index:2;display:flex;flex-direction:column;gap:2px;text-shadow:0 1px 8px rgba(0,0,0,.7)}
.dv-qui{display:flex;flex-direction:column;gap:2px;min-width:0}
.dv-nom{color:inherit;text-decoration:none}
.dv-qui b{font-size:18px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv-qui small{font-size:13px;color:#F1DDE6}
.dv-signaler{padding:0;border:0;background:none;color:#CDB6C1;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer}
.dv-rail{position:absolute;right:10px;bottom:calc(108px + env(safe-area-inset-bottom));z-index:2;display:flex;flex-direction:column;align-items:center;gap:12px}
.dv-reacs,.dv-actions{display:flex;flex-direction:column;align-items:center;gap:10px}
.dv-reac,.dv-repondre,.dv-partager{display:flex;flex-direction:column;align-items:center;gap:3px;width:58px;padding:0;border:0;background:none;color:#fff;font:inherit;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}
.dv-reac span,.dv-repondre span,.dv-partager span{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:rgba(18,6,15,.55);font-size:23px;line-height:1;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:transform .2s cubic-bezier(.2,1.6,.4,1),background .2s}
.dv-reac b,.dv-repondre small,.dv-partager small{max-width:64px;font-size:11.5px;font-weight:900;line-height:1.1;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.8)}
.dv-reac.pris span{background:rgba(255,46,154,.85);box-shadow:0 0 0 2px #FF2E9A,0 8px 22px -6px rgba(255,46,154,.95);transform:scale(1.1)}
.dv-reac:active span,.dv-repondre:active span,.dv-partager:active span{transform:scale(.9)}
.dv-reac:disabled{opacity:.6;cursor:default}
/* 🎉 la dernière page */
.dv-fin{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:calc(70px + env(safe-area-inset-top)) 24px calc(130px + env(safe-area-inset-bottom));text-align:center;background:radial-gradient(80% 45% at 50% 42%,rgba(255,46,154,.32),transparent 70%),#12060F}
.dv-fin>span{font-size:64px;line-height:1}
.dv-fin b{font-size:24px;font-weight:900}
.dv-fin p{margin:0 0 6px;max-width:320px;color:#E8D3DC}
.dv-fin .tj-go{max-width:320px}
.dv-revoir{padding:10px;border:0;background:none;color:#FFD9EB;font:inherit;font-weight:800;cursor:pointer}
.dv-message{position:fixed;left:16px;right:16px;top:calc(70px + env(safe-area-inset-top));z-index:30;margin:0}
@media (min-width:860px){
  .dv-diapo,.dv-fil>.dv-carte{max-width:480px;margin:0 auto}
}
@keyframes dv-glisse{0%,100%{transform:translateY(0);opacity:.75}50%{transform:translateY(-8px);opacity:1}}
@keyframes dv-flotte{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}
`;
