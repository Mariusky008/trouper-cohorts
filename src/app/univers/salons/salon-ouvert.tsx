"use client";

/**
 * 🛋️ UN SALON OUVERT, À L'ÉCRAN — les lots D3 et D4 de Découvrir (`docs/univers/decouvrir.md`, sections 5, 6, 13 et
 * 18 ; les règles : `lib/direct/salons-ouverts.ts`).
 *
 * On entre (le plus rempli qui a une place) : sa figurine s'assoit sur une place libre. En haut, **la télé du salon** en
 * grand écran : la sélection du jour du thème, à la même seconde pour tous (`positionTele`) — « ▶ Allumer » donne le son.
 * Dessous, **la pièce** (le décor du thème) et ses huit places : chacun dans son fauteuil, son prénom dessous ; les
 * bulles au-dessus des têtes, les réactions qui sautent, les gestes qui volent d'une figurine à l'autre.
 *
 * Toucher une figurine : son prénom, 👋 👏 😂, « 🙈 Ne plus voir », « 🚩 Signaler ». Écrire : relu avant de partir (ni
 * lien, ni numéro, ni réseau, ni question personnelle — le refus dit pourquoi). « 💬 » : la conversation des 48 heures.
 * Un pouls toutes les 4 secondes (qui est là, ce qui s'est dit) ; partir libère sa place.
 *
 * 🗄️ (lot D5, section 20) Toucher la bulle de quelqu'un : ❤️ ; aimée par trois personnes, elle monte sur **l'étagère du
 * salon** (🗄️ en haut) — « 📌 Garder » la met dans ma maison. Sa fiche montre ses passions, « 👯 Ajouter en proche » et,
 * si sa maison est ouverte à tous, « 🏠 Voir sa maison ».
 *
 * 🎬 (lot D2, section 19) **La séance chez moi** (`chez`) : le même écran, dans ma pièce, quatre places. L'hôte mène la
 * télé (sa télé du jour : ❚❚, ⏭, 📺 Choisir) ; chez ses proches, le lecteur suit la même seconde (recalé au-delà de
 * deux secondes d'écart). « 👥 Inviter » : jusqu'à trois proches. Entre proches : ni relecture, ni signalement.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { chargerYouTube } from "@/app/univers/tele-duo";
import { lecteurYouTube, vignetteYouTube } from "@/lib/direct/tele";
import { themeDe } from "@/lib/direct/decouvrir";
import {
  GESTES_SALON,
  INVITES_MAX,
  MOTIFS_SIGNALEMENT,
  PHRASES_SALONS as P,
  PLACES_DU_SALON,
  PLACES_SEANCE,
  REACTIONS_SALON,
  TEXTE_SALON_MAX,
  positionSeance,
  positionTele,
  refusDuMessage,
  type MessageSalon,
  type MomentSalon,
  type PresentSalon,
  type TeleSeance,
  type VideoSalon,
} from "@/lib/direct/salons-ouverts";
import type { OuvertureSalonOuvert, PoulsSalonOuvert } from "@/lib/direct/salons-ouverts-serveur";

const ROUTE = "/api/direct/salons-ouverts";
const POULS_MS = 4000;
const BULLE_MS = 6500;
type Lecteur = {
  destroy?: () => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
  seekTo?: (t: number, loin: boolean) => void;
  getCurrentTime?: () => number;
  getPlayerState?: () => number;
  loadVideoById?: (o: { videoId: string; startSeconds?: number }) => void;
};
type Etat =
  | { etat: "chargement" }
  | { etat: "age" }
  | { etat: "sans-figurine" }
  | { etat: "exclu" }
  | { etat: "erreur"; message: string }
  | { etat: "pret"; o: OuvertureSalonOuvert };

const poster = (corps: Record<string, unknown>) =>
  fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
    .then(async (r) => ({ ok: r.ok, statut: r.status, j: (await r.json().catch(() => ({}))) as Record<string, unknown> }))
    .catch(() => ({ ok: false, statut: 0, j: { error: "Pas de réseau : réessaie dans un instant." } as Record<string, unknown> }));

/** Sortir : sa place se libère tout de suite (sinon, d'elle-même en 2 min 30). */
function sortir(salon: string) {
  try {
    navigator.sendBeacon?.(ROUTE, new Blob([JSON.stringify({ action: "sortir", salon })], { type: "application/json" }));
  } catch {
    /* (elle se libérera d'elle-même) */
  }
}

export function SalonOuvert({ theme, chez }: { theme?: string; chez?: string }) {
  const [etat, setEtat] = useState<Etat>({ etat: "chargement" });
  const entrer = useCallback(async () => {
    // (🎬 lot D2 : chez moi, ou chez un proche qui m'a invité)
    const r = await poster(chez ? { action: "entrer-chez", chez } : { action: "entrer", theme });
    if (r.ok && r.j.ouverture) return setEtat({ etat: "pret", o: r.j.ouverture as OuvertureSalonOuvert });
    if (r.j.age) return setEtat({ etat: "age" });
    if (r.j.figurine) return setEtat({ etat: "sans-figurine" });
    if (r.j.exclu) return setEtat({ etat: "exclu" });
    setEtat({ etat: "erreur", message: String(r.j.error || "Ça n’a pas marché. Réessaie.") });
  }, [theme, chez]);
  useEffect(() => {
    void Promise.resolve().then(entrer);
  }, [entrer]);

  const t = themeDe(theme);
  if (etat.etat === "pret") return <Salon key={etat.o.salon.id} o={etat.o} onDehors={() => void entrer()} onExclu={() => setEtat({ etat: "exclu" })} />;
  return (
    <main className="so so-centre" data-etat={etat.etat}>
      <a className="so-retour" href="/collection#decouvrir" aria-label="Revenir à Découvrir">
        ‹
      </a>
      <p className="so-grand">{chez ? "🎬" : t ? `${t.e} ${t.nom}` : "🛋️"}</p>
      {etat.etat === "chargement" && <p>…</p>}
      {etat.etat === "age" && (
        <div className="so-age" data-age>
          <p>{P.age}</p>
          <button type="button" className="so-bouton" data-adulte onClick={() => void poster({ action: "age", adulte: true }).then(entrer)}>
            {P.adulte}
          </button>
          <button type="button" className="so-bouton clair" data-jeune onClick={() => void poster({ action: "age", adulte: false }).then(entrer)}>
            {P.jeune}
          </button>
        </div>
      )}
      {etat.etat === "sans-figurine" && (
        <p>
          {P.sansFigurine}{" "}
          <a className="so-lien" href="/univers/figurine">
            Créer ma figurine
          </a>
        </p>
      )}
      {etat.etat === "exclu" && <p data-exclu>{P.exclu}</p>}
      {etat.etat === "erreur" && <p className="so-erreur">{etat.message}</p>}
      <style>{STYLES}</style>
    </main>
  );
}

// ─── le salon ─────────────────────────────────────────────────────────────────────────────────────
type Anime = { id: string; q: string; sorte: "bulle" | "pop" | "vol"; texte: string; a?: string; fin: number };

function Salon({ o, onDehors, onExclu }: { o: OuvertureSalonOuvert; onDehors: () => void; onExclu: () => void }) {
  const salon = o.salon;
  // (🎬 lot D2 : une séance chez quelqu'un — entre proches)
  const seance = salon.seance;
  const prive = Boolean(seance);
  const nPlaces = prive ? PLACES_SEANCE : PLACES_DU_SALON.length;
  const [tele, setTele] = useState<TeleSeance | null>(o.tele.seance ?? null);
  const [inviter, setInviter] = useState(false);
  // (🗄️ lot D5 : l'étagère ouverte ; les messages que j'ai aimés)
  const [etagere, setEtagere] = useState<MomentSalon[] | null>(null);
  const [aimes, setAimes] = useState<string[]>([]);
  const [presents, setPresents] = useState<PresentSalon[]>(o.presents);
  const [messages, setMessages] = useState<MessageSalon[]>(o.messages);
  const [caches, setCaches] = useState<string[]>(o.caches);
  const [anims, setAnims] = useState<Anime[]>([]);
  const [texte, setTexte] = useState("");
  const [refus, setRefus] = useState("");
  const [note, setNote] = useState(
    seance ? (seance.hote && o.presents.length < 2 ? P.seuls : P.bienvenue) : salon.plein ? P.plein(salon.nom.replace(/^\S+\s/, "").replace(/ · \d+$/, "").replace(/^Le /, "").toLowerCase()) : P.bienvenue,
  );
  const [fiche, setFiche] = useState<PresentSalon | null>(null);
  const [signaler, setSignaler] = useState<PresentSalon | null>(null);
  const [conversation, setConversation] = useState<MessageSalon[] | null>(null);
  const [indice, setIndice] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const [L, setL] = useState(0);
  const dernier = useRef(Math.max(0, ...o.messages.map((m) => m.le)));
  const vus = useRef(new Set(o.messages.map((m) => m.id)));
  // (l'heure du serveur : la télé est à la même seconde pour tous, même si l'horloge du téléphone avance)
  const decalage = useRef(0);
  useEffect(() => {
    decalage.current = o.tele.maintenant - Date.now();
  }, [o.tele.maintenant]);
  const moiArrive = o.presents.find((p) => p.q === o.moi)?.arrive ?? 0;
  const etatRef = useRef({ presents, caches, onDehors, onExclu });
  useEffect(() => {
    etatRef.current = { presents, caches, onDehors, onExclu };
  });

  useLayoutEffect(() => {
    const el = boite.current;
    if (!el) return;
    const mesurer = () => setL(el.clientWidth);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dire = useCallback((t: string, ms = 3600) => {
    setNote(t);
    window.setTimeout(() => setNote((x) => (x === t ? "" : x)), ms);
  }, []);
  useEffect(() => {
    const id = window.setTimeout(() => setNote((x) => (x === P.bienvenue || x === P.seuls || x.startsWith("Le premier") ? "" : x)), 4200);
    const id2 = window.setTimeout(() => setIndice(false), 9000);
    return () => {
      window.clearTimeout(id);
      window.clearTimeout(id2);
    };
  }, []);

  // ─── ce qui se passe dans la pièce : une bulle, une réaction qui saute, un geste qui vole ───
  const jouer = useCallback((m: MessageSalon) => {
    if (etatRef.current.caches.includes(m.de)) return;
    const fin = Date.now() + (m.sorte === "texte" ? BULLE_MS : 2200);
    const e = m.sorte === "reaction" ? REACTIONS_SALON.find((r) => r.cle === m.cle)?.e : m.sorte === "geste" ? GESTES_SALON.find((g) => g.cle === m.cle)?.e : "";
    const a: Anime =
      m.sorte === "texte"
        ? { id: m.id, q: m.de, sorte: "bulle", texte: m.texte ?? "", fin }
        : m.sorte === "geste" && m.a
          ? { id: m.id, q: m.de, sorte: "vol", texte: e ?? "👋", a: m.a, fin }
          : { id: m.id, q: m.de, sorte: "pop", texte: e ?? "😂", fin };
    setAnims((l) => [...l.filter((x) => !(x.sorte === "bulle" && a.sorte === "bulle" && x.q === a.q)), a].slice(-24));
    window.setTimeout(() => setAnims((l) => l.filter((x) => x.id !== a.id)), fin - Date.now() + 50);
  }, []);
  const recevoir = useCallback(
    (l: MessageSalon[], animer: boolean) => {
      const neufs = l.filter((m) => !vus.current.has(m.id));
      if (!neufs.length) return;
      for (const m of neufs) {
        vus.current.add(m.id);
        dernier.current = Math.max(dernier.current, m.le);
        if (animer) jouer(m);
      }
      setMessages((x) => [...x, ...neufs].slice(-120));
    },
    [jouer],
  );

  // ─── 💓 le pouls ───
  useEffect(() => {
    let fini = false;
    let attente = false;
    const battre = async () => {
      if (fini || attente || document.visibilityState === "hidden") return;
      attente = true;
      const connus = etatRef.current.presents.map((p) => p.q).join(",");
      const r = await fetch(`${ROUTE}?salon=${encodeURIComponent(salon.id)}&depuis=${dernier.current}&connus=${encodeURIComponent(connus)}`, { cache: "no-store" }).catch(() => null);
      attente = false;
      const j = (await r?.json().catch(() => null)) as { pouls?: PoulsSalonOuvert } | null;
      const p = j?.pouls;
      if (fini || !p) return;
      decalage.current = p.maintenant - Date.now();
      if (p.exclu) return etatRef.current.onExclu();
      if (p.dehors) return etatRef.current.onDehors();
      setPresents((l) => {
        const ici = new Set(p.ici);
        const garde = l.filter((x) => ici.has(x.q));
        const neufs = p.nouveaux.filter((x) => !garde.some((y) => y.q === x.q));
        return [...garde, ...neufs];
      });
      recevoir(p.messages, true);
      // (🎬 la télé de la séance : ce que l'hôte vient de faire)
      if (p.seance !== undefined) setTele((x) => (p.seance && (p.seance.n !== x?.n || p.seance.video.id !== x?.video.id) ? p.seance : (x ?? p.seance ?? null)));
    };
    const id = window.setInterval(() => void battre(), POULS_MS);
    // (quitter la page : sa place se libère tout de suite — pas au simple remontage de l'écran)
    const partir = () => sortir(salon.id);
    window.addEventListener("pagehide", partir);
    return () => {
      fini = true;
      window.clearInterval(id);
      window.removeEventListener("pagehide", partir);
    };
  }, [salon.id, recevoir]);

  // ─── ✍️ écrire, réagir, un geste ───
  async function envoyer(corps: Record<string, unknown>) {
    setOccupe(true);
    const r = await poster({ action: "ecrire", salon: salon.id, ...corps });
    setOccupe(false);
    if (!r.ok) {
      if (r.j.refus) setRefus(String(r.j.error));
      else dire(String(r.j.error || "Ça n’a pas marché. Réessaie."));
      return false;
    }
    const m = r.j.message as MessageSalon | undefined;
    if (m) recevoir([m], true);
    return true;
  }
  async function ecrire(ev: React.FormEvent) {
    ev.preventDefault();
    const t = texte.trim();
    if (!t) return;
    // (le téléphone prévient avant d'envoyer ; le serveur refuse quoi qu'il arrive — entre proches, rien n'est relu)
    const r = prive ? null : refusDuMessage(t);
    if (r) {
      setRefus(P.refus(r));
      window.setTimeout(() => setRefus(""), 4500);
      return;
    }
    setRefus("");
    if (await envoyer({ sorte: "texte", texte: t })) setTexte("");
  }

  async function ouvrirConversation() {
    setConversation([]);
    const r = await fetch(`${ROUTE}?conversation=${encodeURIComponent(salon.id)}`, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => null)) as { messages?: MessageSalon[] } | null;
    setConversation(j?.messages ?? messages);
  }
  async function cacher(p: PresentSalon) {
    const r = await poster({ action: "ne-plus-voir", q: p.q });
    setFiche(null);
    if (r.ok) {
      setCaches((r.j.caches as string[]) ?? [...caches, p.q]);
      dire(P.nePlusVu(p.prenom));
    }
  }
  // ─── 🗄️ ❤️ l'étagère du salon ; 👯 ajouter en proche (lot D5) ───
  async function aimer(id: string) {
    if (prive || aimes.includes(id)) return;
    setAimes((l) => [...l, id]);
    const r = await poster({ action: "aimer", salon: salon.id, message: id });
    if (!r.ok) {
      setAimes((l) => l.filter((x) => x !== id));
      return dire(String(r.j.error || "Ça n’a pas marché. Réessaie."));
    }
    dire(r.j.etagere ? P.surEtagere : P.aime, r.j.etagere ? 4200 : 2000);
  }
  async function ouvrirEtagere() {
    setEtagere([]);
    const r = await fetch(`${ROUTE}?etagere=${encodeURIComponent(salon.id)}`, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => null)) as { moments?: MomentSalon[] } | null;
    setEtagere(j?.moments ?? []);
  }
  async function garder(m: MomentSalon) {
    const r = await poster({ action: "garder", salon: salon.id, moment: m.id });
    dire(r.ok ? P.garde : String(r.j.error || "Ça n’a pas marché. Réessaie."));
  }
  async function demanderProche(p: PresentSalon) {
    setFiche(null);
    const r = await poster({ action: "proche", salon: salon.id, q: p.q });
    dire(!r.ok ? String(r.j.error || "Ça n’a pas marché. Réessaie.") : r.j.proches ? P.procheFait(p.prenom) : P.procheEnvoye(p.prenom), 5200);
  }
  async function signalerPour(p: PresentSalon, motif: string) {
    const dernierMot = [...messages].reverse().find((m) => m.de === p.q && m.sorte === "texte");
    const r = await poster({ action: "signaler", salon: salon.id, q: p.q, motif, ...(dernierMot ? { message: dernierMot.id } : {}) });
    setSignaler(null);
    dire(r.ok ? P.signale : String(r.j.error || "Ça n’a pas marché. Réessaie."), 4200);
  }

  // ─── la mise en page : la télé en 16/9, la pièce dessous ───
  // (sur un ordinateur, la télé ne dépasse pas 680 points : la pièce et ses figurines tiennent dans l'écran)
  const lTele = Math.min(L, 680);
  const H = Math.round(Math.min(Math.max(L * 0.82, 260), 400));
  const decor = o.decor;
  const ratio = decor ? decor.panorama.largeur / Math.max(1, decor.panorama.hauteur) : 1;
  const lPano = H * ratio;
  const tx = decor ? Math.min(0, Math.max(L - lPano, L / 2 - decor.centre.x * lPano)) : 0;
  const ici = [...presents].sort((a, b) => a.arrive - b.arrive);
  // (deux arrivés en même temps sur la même place : le second prend la suivante libre)
  const places = new Map<string, number>();
  const prises = new Set<number>();
  for (const p of ici) {
    let k = p.place;
    if (prises.has(k) || k >= nPlaces) k = [...Array(nPlaces).keys()].find((x) => !prises.has(x)) ?? k;
    prises.add(k);
    places.set(p.q, k);
  }
  const ou = (q: string) => {
    const k = places.get(q);
    const pl = k === undefined ? null : PLACES_DU_SALON[k];
    return pl ? { x: pl.x * L, y: pl.y * H, h: pl.h * H } : null;
  };

  return (
    <main className={`so${prive ? " so-seance" : ""}`} data-salon={salon.id} data-maison={salon.maison} data-presents={ici.length} data-hote={seance?.hote ? "1" : undefined}>
      <header className="so-haut">
        <a className="so-rond" href="/collection#decouvrir" aria-label="Revenir à Découvrir" data-sortir onClick={() => sortir(salon.id)}>
          ‹
        </a>
        <div className="so-titre">
          <b data-nom>{salon.nom}</b>
          <small data-places>{P.places(ici.length)}</small>
        </div>
        {seance?.hote && (
          <button type="button" className="so-rond so-inviter" aria-label={P.inviterTitre} data-inviter onClick={() => setInviter(true)}>
            👥
          </button>
        )}
        {!prive && (
          <button type="button" className="so-rond" aria-label={P.etagere} data-etagere onClick={() => void ouvrirEtagere()}>
            🗄️
          </button>
        )}
        <button type="button" className="so-rond" aria-label="La conversation du salon" data-conversation onClick={() => void ouvrirConversation()}>
          💬
        </button>
      </header>

      <div className="so-scene" ref={boite}>
        {seance ? (
          <TeleDeLaSeance salon={salon.id} seance={tele} hote={seance.hote} videos={o.tele.videos} decalage={decalage} largeur={lTele} onSeance={setTele} dire={dire} />
        ) : (
          <TeleDuSalon videos={o.tele.videos} decalage={decalage} largeur={lTele} />
        )}
        <div className="so-piece" style={{ height: H }} data-decor={decor?.piece ?? ""}>
          {decor && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="so-pano" src={decor.panorama.src} srcSet={decor.panorama.srcset} sizes={`${Math.round(lPano)}px`} alt="" style={{ width: lPano, height: H, transform: `translateX(${tx}px)`, backgroundImage: `url(${decor.panorama.flou})` }} />
          )}
          {L > 0 &&
            ici.map((p) => {
              const x = ou(p.q);
              if (!x) return null;
              const cache = caches.includes(p.q);
              const moi = p.q === o.moi;
              return (
                <button
                  key={p.q}
                  type="button"
                  className={`so-fig${moi ? " moi" : ""}${cache ? " cache" : ""}`}
                  data-q={p.q}
                  data-moi={moi ? "1" : undefined}
                  style={{ left: x.x, bottom: H - x.y, height: x.h, zIndex: Math.round(x.y) }}
                  aria-label={moi ? "Ta figurine" : p.prenom}
                  onClick={() => {
                    setIndice(false);
                    if (!moi) setFiche(p);
                  }}
                >
                  {p.figurine ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.figurine.src} srcSet={p.figurine.srcset} sizes={`${Math.round(x.h)}px`} alt="" draggable={false} />
                  ) : (
                    <span className="so-sans">🪑</span>
                  )}
                  <small>{moi ? "Toi" : p.prenom}</small>
                </button>
              );
            })}
          {L > 0 &&
            anims.map((a) => {
              const de = ou(a.q);
              if (!de) return null;
              if (a.sorte === "bulle") {
                const style = { left: Math.min(L - 70, Math.max(70, de.x)), bottom: H - de.y + de.h + 6 };
                // (❤️ lot D5 : la bulle de quelqu'un d'autre, dans un salon ouvert, s'aime d'un toucher)
                return prive || a.q === o.moi ? (
                  <p key={a.id} className="so-bulle" data-bulle={a.q} style={style}>
                    {a.texte}
                  </p>
                ) : (
                  <button key={a.id} type="button" className={`so-bulle${aimes.includes(a.id) ? " aimee" : ""}`} data-bulle={a.q} data-aimer={a.id} style={style} onClick={() => void aimer(a.id)}>
                    {a.texte}
                    <i aria-hidden="true">{aimes.includes(a.id) ? "❤️" : "🤍"}</i>
                  </button>
                );
              }
              if (a.sorte === "pop")
                return (
                  <span key={a.id} className="so-pop" data-pop={a.q} style={{ left: de.x, bottom: H - de.y + de.h }}>
                    {a.texte}
                  </span>
                );
              const vers = a.a ? ou(a.a) : null;
              return (
                <span
                  key={a.id}
                  className="so-vol"
                  data-vol={`${a.q}>${a.a}`}
                  style={{ left: de.x, bottom: H - de.y + de.h * 0.7, ["--dx" as string]: `${(vers?.x ?? de.x) - de.x}px`, ["--dy" as string]: `${(de.y - de.h * 0.7) - ((vers?.y ?? de.y) - (vers?.h ?? de.h) * 0.7)}px` } as React.CSSProperties}
                >
                  {a.texte}
                </span>
              );
            })}
          {indice && ici.length > 1 && <p className="so-indice">{P.indice}</p>}
        </div>
      </div>

      <section className="so-bas">
        <p className="so-info">{seance ? (seance.hote ? P.hote : P.invite(seance.prenom)) : P.tele}</p>
        <div className="so-reagir" data-reagir>
          <span>{P.reagis}</span>
          {REACTIONS_SALON.map((r) => (
            <button key={r.cle} type="button" data-r={r.cle} aria-label={r.nom} disabled={occupe} onClick={() => void envoyer({ sorte: "reaction", cle: r.cle })}>
              {r.e}
            </button>
          ))}
          <small>{P.ouTouche}</small>
        </div>
        {refus && (
          <p className="so-refus" data-refus role="alert">
            {refus}
          </p>
        )}
        <form className="so-ecrire" onSubmit={(e) => void ecrire(e)}>
          <input value={texte} maxLength={TEXTE_SALON_MAX} autoComplete="off" placeholder={P.ecrire} aria-label={P.ecrire} name="texte" onChange={(e) => setTexte(e.target.value)} />
          <button type="submit" className="so-bouton petit" disabled={occupe || !texte.trim()}>
            Envoyer
          </button>
        </form>
        {!prive && <p className="so-regles">{P.regles}</p>}
      </section>

      {note && (
        <p className="so-note" data-note role="status">
          {note}
        </p>
      )}

      {fiche && (
        <Feuille onFermer={() => setFiche(null)}>
          <div className="so-fiche" data-fiche={fiche.q}>
            {fiche.figurine && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fiche.figurine.src} alt="" />
            )}
            <div>
              <h2>{fiche.prenom}</h2>
              <small>{P.fiche}</small>
            </div>
          </div>
          {!prive && fiche.passions?.length ? (
            <p className="so-passions" data-passions>
              <b>{P.sesPassions}</b>
              {fiche.passions.map((x) => {
                const t = themeDe(x);
                return t ? <span key={x}>{`${t.e} ${t.court}`}</span> : null;
              })}
            </p>
          ) : null}
          <div className="so-gestes">
            {GESTES_SALON.map((g) => (
              <button
                key={g.cle}
                type="button"
                data-geste={g.cle}
                onClick={() => {
                  const a = fiche.q;
                  setFiche(null);
                  void envoyer({ sorte: "geste", cle: g.cle, a });
                }}
              >
                {g.e} {g.nom}
              </button>
            ))}
          </div>
          {!prive && (
            <div className="so-liens">
              <button type="button" className="so-bouton petit" data-ajouter-proche onClick={() => void demanderProche(fiche)}>
                {P.proche}
              </button>
              {fiche.maison ? (
                <a className="so-bouton petit clair" data-voir-maison href={`/univers/chez/${encodeURIComponent(fiche.maison)}`} onClick={() => sortir(salon.id)}>
                  {P.voirMaison}
                </a>
              ) : (
                <span className="so-ferme" data-maison-fermee>
                  {P.maisonFermee}
                </span>
              )}
            </div>
          )}
          {!prive && (
          <div className="so-discret">
            <button type="button" data-ne-plus-voir onClick={() => void cacher(fiche)}>
              {P.nePlusVoir}
            </button>
            <button
              type="button"
              data-signaler
              onClick={() => {
                setSignaler(fiche);
                setFiche(null);
              }}
            >
              {P.signaler}
            </button>
          </div>
          )}
        </Feuille>
      )}

      {signaler && (
        <Feuille onFermer={() => setSignaler(null)}>
          <h2>{P.signalerTitre(signaler.prenom)}</h2>
          <p className="so-chapo">{P.signalerChapo}</p>
          <div className="so-motifs">
            {MOTIFS_SIGNALEMENT.map((m) => (
              <button key={m} type="button" data-motif={m} onClick={() => void signalerPour(signaler, m)}>
                {m}
              </button>
            ))}
          </div>
        </Feuille>
      )}

      {conversation && (
        <Feuille onFermer={() => setConversation(null)}>
          <h2>{P.conversation}</h2>
          <p className="so-chapo">{P.conversationChapo}</p>
          <Conversation messages={conversation} depuis={moiArrive} moi={o.moi} caches={caches} aimes={aimes} onAimer={prive ? undefined : (id) => void aimer(id)} />
        </Feuille>
      )}

      {etagere && (
        <Feuille onFermer={() => setEtagere(null)}>
          <h2>{P.etagere}</h2>
          <p className="so-chapo">{P.etagereChapo}</p>
          <div className="so-moments" data-moments={etagere.length}>
            {etagere.length === 0 ? (
              <p className="vide">{P.etagereVide}</p>
            ) : (
              etagere.map((m) => (
                <div key={m.id} className="so-moment" data-moment={m.id}>
                  <p>« {m.texte} »</p>
                  <small>
                    {m.prenom} · ❤️ {m.n}
                  </small>
                  <button type="button" className="so-bouton petit clair" data-garder={m.id} onClick={() => void garder(m)}>
                    {P.garder}
                  </button>
                </div>
              ))
            )}
          </div>
        </Feuille>
      )}

      {inviter && <Inviter onFermer={() => setInviter(false)} dire={dire} />}
      <style>{STYLES}</style>
    </main>
  );
}

function Conversation({ messages, depuis, moi, caches, aimes = [], onAimer }: { messages: MessageSalon[]; depuis: number; moi: string; caches: string[]; aimes?: string[]; onAimer?: (id: string) => void }) {
  const l = messages.filter((m) => !caches.includes(m.de));
  const ligne = (m: MessageSalon) => {
    const e = m.sorte === "reaction" ? REACTIONS_SALON.find((r) => r.cle === m.cle)?.e : m.sorte === "geste" ? GESTES_SALON.find((g) => g.cle === m.cle)?.e : "";
    return (
      <p key={m.id} className={m.de === moi ? "moi" : ""} data-ligne={m.id}>
        <b>{m.de === moi ? "Toi" : m.prenom}</b> : {m.sorte === "texte" ? m.texte : e}
        <span>{new Date(m.le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
        {onAimer && m.sorte === "texte" && m.de !== moi && (
          <button type="button" className="so-coeur" data-aimer={m.id} aria-label="Aimer" disabled={aimes.includes(m.id)} onClick={() => onAimer(m.id)}>
            {aimes.includes(m.id) ? "❤️" : "🤍"}
          </button>
        )}
      </p>
    );
  };
  const avant = l.filter((m) => m.le < depuis);
  const apres = l.filter((m) => m.le >= depuis);
  return (
    <div className="so-conv" data-conv>
      <p className="so-groupe">{P.avant}</p>
      {avant.length ? avant.map(ligne) : <p className="vide">{P.rien}</p>}
      <p className="so-groupe">{P.depuis}</p>
      {apres.length ? apres.map(ligne) : <p className="vide">{P.rien}</p>}
    </div>
  );
}

function Feuille({ children, onFermer }: { children: React.ReactNode; onFermer: () => void }) {
  return (
    <div className="so-voile" role="dialog" aria-modal="true" onClick={onFermer}>
      <div className="so-feuille" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="so-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── 👥 inviter mes proches (lot D2) ───
type Proche = { cle: string; prenom: string; image?: string; lien?: string };
function Inviter({ onFermer, dire }: { onFermer: () => void; dire: (t: string, ms?: number) => void }) {
  const [proches, setProches] = useState<Proche[] | null>(null);
  const [choisis, setChoisis] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);
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
  async function envoyer() {
    setOccupe(true);
    const r = await poster({ action: "inviter", cles: choisis });
    setOccupe(false);
    if (!r.ok) return dire(String(r.j.error || "Ça n’a pas marché. Réessaie."));
    onFermer();
    dire(P.invites(((r.j.invites as string[]) ?? choisis).length), 5200);
  }
  return (
    <Feuille onFermer={onFermer}>
      <h2>{P.inviterTitre}</h2>
      <p className="so-chapo">{P.inviterChapo}</p>
      {proches === null ? (
        <p>…</p>
      ) : proches.length === 0 ? (
        <p className="vide">{P.sansProches}</p>
      ) : (
        <ul className="so-proches" data-proches>
          {proches.map((p) => {
            const pris = choisis.includes(p.cle);
            return (
              <li key={p.cle}>
                <button
                  type="button"
                  className={pris ? "pris" : ""}
                  data-invite={p.cle}
                  aria-pressed={pris}
                  disabled={!pris && choisis.length >= INVITES_MAX}
                  onClick={() => setChoisis((l) => (pris ? l.filter((x) => x !== p.cle) : [...l, p.cle]))}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image ? <img src={p.image} alt="" /> : <span className="so-rond-vide" aria-hidden="true" />}
                  <span>{p.prenom}</span>
                  <i aria-hidden="true">{pris ? "✓" : ""}</i>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" className="so-bouton" data-envoyer-invitations disabled={occupe || !choisis.length} onClick={() => void envoyer()}>
        {P.inviterEnvoyer}
        {choisis.length ? ` (${choisis.length})` : ""}
      </button>
    </Feuille>
  );
}

// ─── 🎬 la télé de la séance : l'hôte la mène, ses proches suivent la même seconde (lot D2) ───
function TeleDeLaSeance({
  salon,
  seance,
  hote,
  videos,
  decalage,
  largeur,
  onSeance,
  dire,
}: {
  salon: string;
  seance: TeleSeance | null;
  hote: boolean;
  videos: VideoSalon[];
  decalage: React.RefObject<number>;
  largeur: number;
  onSeance: (s: TeleSeance) => void;
  dire: (t: string, ms?: number) => void;
}) {
  const [allumee, setAllumee] = useState(false);
  const [simple, setSimple] = useState(false);
  const [choix, setChoix] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const pret = useRef(false);
  const joue = useRef<{ id: string; n: number } | null>(null);
  const ref = useRef(seance);
  const ici = useCallback(() => (ref.current ? positionSeance(ref.current, Date.now() + (decalage.current ?? 0)) : 0), [decalage]);

  const commander = useCallback(
    async (quoi: "video" | "suivante" | "pause" | "jouer", id?: string) => {
      setOccupe(true);
      const r = await poster({ action: "tele", salon, quoi, ...(id ? { id } : {}) });
      setOccupe(false);
      if (!r.ok) return dire(String(r.j.error || "Ça n’a pas marché. Réessaie."));
      if (r.j.seance) onSeance(r.j.seance as TeleSeance);
    },
    [salon, onSeance, dire],
  );
  const commanderRef = useRef(commander);

  // (le lecteur suit ce que l'hôte a fait : une autre vidéo, la pause, la reprise)
  const suivre = useCallback(() => {
    const l = lecteur.current;
    const s = ref.current;
    if (!l || !pret.current || !s) return;
    const avant = joue.current;
    if (avant && avant.n === s.n && avant.id === s.video.id) return;
    joue.current = { id: s.video.id, n: s.n };
    const t = positionSeance(s, Date.now() + (decalage.current ?? 0));
    if (avant?.id !== s.video.id) {
      l.loadVideoById?.({ videoId: s.video.id, startSeconds: t });
      if (s.pause !== undefined) window.setTimeout(() => lecteur.current?.pauseVideo?.(), 700);
      return;
    }
    l.seekTo?.(t, true);
    if (s.pause !== undefined) l.pauseVideo?.();
    else l.playVideo?.();
  }, [decalage]);
  useEffect(() => {
    ref.current = seance;
    commanderRef.current = commander;
    suivre();
  });

  // (le lecteur de YouTube : créé à l'allumage ; sans commandes chez les invités — c'est l'hôte qui mène)
  useEffect(() => {
    const s0 = ref.current;
    if (!allumee || simple || !s0) return;
    let fini = false;
    chargerYouTube()
      .then((YT) => {
        if (fini || !boite.current) return;
        const cible = document.createElement("div");
        boite.current.replaceChildren(cible);
        lecteur.current = new YT.Player(cible, {
          videoId: s0.video.id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, start: Math.floor(ici()), playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, iv_load_policy: 3, origin: window.location.origin },
          events: {
            onReady: (e: { target?: Lecteur }) => {
              pret.current = true;
              joue.current = { id: s0.video.id, n: s0.n };
              if (s0.pause !== undefined) e.target?.pauseVideo?.();
              else e.target?.playVideo?.();
              suivre();
            },
            // (finie : chez l'hôte, la suivante de sa télé du jour)
            onStateChange: (e: { data?: number }) => {
              if (!fini && e.data === 0 && hote) void commanderRef.current("suivante");
            },
          },
        }) as Lecteur;
      })
      .catch(() => {
        if (!fini) setSimple(true);
      });
    return () => {
      fini = true;
      pret.current = false;
      try {
        lecteur.current?.destroy?.();
      } catch {
        /* (déjà parti) */
      }
      lecteur.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allumee, simple]);

  // (toutes les 5 secondes : plus de deux secondes d'écart, on se recale ; arrêté sans que l'hôte l'ait voulu, on repart)
  useEffect(() => {
    if (!allumee || simple) return;
    const id = window.setInterval(() => {
      const l = lecteur.current;
      const s = ref.current;
      if (!l || !pret.current || !s || s.pause !== undefined) return;
      const attendu = ici();
      const t = l.getCurrentTime?.();
      if (typeof t === "number" && Math.abs(t - attendu) > 2 && attendu < (s.video.duree || 1e6) - 2) l.seekTo?.(attendu, true);
      if (l.getPlayerState?.() === 2) l.playVideo?.();
    }, 5000);
    return () => window.clearInterval(id);
  }, [allumee, simple, ici]);

  // (le lecteur tout simple : chez l'hôte, la suivante à la fin de celle-ci)
  useEffect(() => {
    if (!allumee || !simple || !hote || !seance || seance.pause !== undefined) return;
    const reste = Math.max(2, (seance.video.duree || 600) - positionSeance(seance, Date.now() + (decalage.current ?? 0)));
    const id = window.setTimeout(() => void commanderRef.current("suivante"), reste * 1000 + 800);
    return () => window.clearTimeout(id);
  }, [allumee, simple, hote, seance, decalage]);

  const v = seance?.video;
  const enPause = seance?.pause !== undefined;
  return (
    <>
      <div className="so-tele" style={{ width: largeur || "100%", height: Math.round(((largeur || 0) * 9) / 16) }} data-tele={v?.id ?? ""} data-n={seance?.n ?? 0} data-pause={enPause ? "1" : undefined}>
        {!v ? (
          <p className="so-tele-vide">{hote ? P.sansVideos : P.pasDeTele}</p>
        ) : allumee && simple ? (
          enPause ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="so-vignette" src={vignetteYouTube(v.id)} alt="" referrerPolicy="no-referrer" />
              <span className="so-en-pause">❚❚</span>
            </>
          ) : (
            <iframe key={`${v.id}-${seance.n}`} className="so-lecteur" data-simple title={v.titre} src={lecteurYouTube(v.id, { debut: Math.floor(ici()) })} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          )
        ) : allumee ? (
          <div ref={boite} className="so-lecteur" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="so-vignette" src={vignetteYouTube(v.id)} alt="" referrerPolicy="no-referrer" />
            <button type="button" className="so-allumer" data-allumer onClick={() => setAllumee(true)}>
              {P.allumer}
            </button>
            <span className="so-titre-video">{v.titre}</span>
          </>
        )}
      </div>
      {hote && (
        <div className="so-commandes" data-commandes style={{ width: largeur || "100%" }}>
          {v && (
            <button type="button" data-pause={enPause ? "reprendre" : "pause"} disabled={occupe} onClick={() => void commander(enPause ? "jouer" : "pause")}>
              {enPause ? P.reprendre : P.pause}
            </button>
          )}
          {videos.length > 1 && (
            <button type="button" data-suivante disabled={occupe} onClick={() => void commander("suivante")}>
              {P.suivante}
            </button>
          )}
          {videos.length > 0 && (
            <button type="button" data-choisir disabled={occupe} onClick={() => setChoix(true)}>
              {P.choisir}
            </button>
          )}
        </div>
      )}
      {choix && (
        <Feuille onFermer={() => setChoix(false)}>
          <h2>{P.choisirTitre}</h2>
          <ul className="so-videos" data-videos>
            {videos.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  data-video={x.id}
                  className={x.id === v?.id ? "en-cours" : ""}
                  onClick={() => {
                    setChoix(false);
                    void commander("video", x.id);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={vignetteYouTube(x.id)} alt="" referrerPolicy="no-referrer" />
                  <span>{x.titre}</span>
                </button>
              </li>
            ))}
          </ul>
        </Feuille>
      )}
    </>
  );
}

// ─── 📺 la télé du salon : la sélection du jour, à la même seconde pour tous ───
function TeleDuSalon({ videos, decalage, largeur }: { videos: VideoSalon[]; decalage: React.RefObject<number>; largeur: number }) {
  const [allumee, setAllumee] = useState(false);
  const [simple, setSimple] = useState(false);
  const [pos, setPos] = useState(() => positionTele(videos, Date.now() + (decalage.current ?? 0)));
  const hote = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const maintenant = useCallback(() => positionTele(videos, Date.now() + (decalage.current ?? 0)), [videos, decalage]);
  // (éteinte : la vignette suit la vidéo du moment)
  useEffect(() => {
    if (allumee) return;
    const id = window.setInterval(() => setPos(maintenant()), 5000);
    return () => window.clearInterval(id);
  }, [allumee, maintenant]);
  // (le lecteur tout simple : la suivante à la fin de celle-ci)
  useEffect(() => {
    if (!allumee || !simple || !pos) return;
    const reste = Math.max(2, (videos[pos.i]?.duree ?? 30) - pos.t);
    const id = window.setTimeout(() => setPos(maintenant()), reste * 1000 + 800);
    return () => window.clearTimeout(id);
  }, [allumee, simple, pos, videos, maintenant]);
  // (le lecteur de YouTube : créé à l'allumage, il change de vidéo sans se refaire)
  useEffect(() => {
    if (!allumee || simple) return;
    let fini = false;
    const p0 = maintenant();
    if (!p0) return;
    chargerYouTube()
      .then((YT) => {
        if (fini || !hote.current) return;
        const cible = document.createElement("div");
        hote.current.replaceChildren(cible);
        lecteur.current = new YT.Player(cible, {
          videoId: videos[p0.i].id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, start: p0.t, playsinline: 1, rel: 0, modestbranding: 1, controls: 1, iv_load_policy: 3, origin: window.location.origin },
          events: {
            onReady: (e: { target?: Lecteur }) => e.target?.playVideo?.(),
            // (finie : la suivante, à sa seconde du moment)
            onStateChange: (e: { data?: number }) => {
              if (fini || e.data !== 0) return;
              const p = maintenant();
              if (p) {
                setPos(p);
                lecteur.current?.loadVideoById?.({ videoId: videos[p.i].id, startSeconds: p.t });
              }
            },
          },
        }) as Lecteur;
      })
      .catch(() => {
        if (!fini) {
          setPos(maintenant());
          setSimple(true);
        }
      });
    return () => {
      fini = true;
      try {
        lecteur.current?.destroy?.();
      } catch {
        /* (déjà parti) */
      }
      lecteur.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allumee, simple]);

  const v = pos ? videos[pos.i] : undefined;
  return (
    <div className="so-tele" style={{ width: largeur || "100%", height: Math.round(((largeur || 0) * 9) / 16) }} data-tele={v?.id ?? ""}>
      {!v ? (
        <p className="so-tele-vide">{P.pasDeTele}</p>
      ) : allumee && simple && pos ? (
        <iframe key={`${pos.i}-${v.id}`} className="so-lecteur" data-simple title={v.titre} src={lecteurYouTube(v.id, { debut: pos.t })} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : allumee ? (
        <div ref={hote} className="so-lecteur" />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="so-vignette" src={vignetteYouTube(v.id)} alt="" referrerPolicy="no-referrer" />
          <button
            type="button"
            className="so-allumer"
            data-allumer
            onClick={() => {
              setPos(maintenant());
              setAllumee(true);
            }}
          >
            {P.allumer}
          </button>
          <span className="so-titre-video">{v.titre}</span>
        </>
      )}
    </div>
  );
}

const STYLES = `
.so{min-height:100dvh;max-width:820px;margin:0 auto;padding:calc(10px + env(safe-area-inset-top)) 0 calc(16px + env(safe-area-inset-bottom));background:radial-gradient(130% 55% at 50% 0%,#3a1430 0%,#160711 62%);color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,sans-serif;overflow-x:hidden;position:relative}
.so-centre{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px 20px;text-align:center}
.so-grand{font-size:22px;font-weight:900;margin:0}
.so-retour{position:absolute;left:14px;top:calc(12px + env(safe-area-inset-top));color:#FFF4E6;text-decoration:none;font-size:28px;font-weight:900}
.so-age{display:flex;flex-direction:column;gap:10px;max-width:340px}
.so-age p{margin:0 0 4px;line-height:1.4}
.so-bouton{border:0;border-radius:999px;padding:12px 18px;font:inherit;font-weight:900;font-size:15px;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a);cursor:pointer}
.so-bouton.clair{background:rgba(255,255,255,.12);color:#FFF4E6}
.so-bouton.petit{padding:9px 14px;font-size:14px}
.so-bouton:disabled{opacity:.5}
.so-lien{color:#ff8fc8;font-weight:800}
.so-erreur{color:#ffb4c8}
.so-haut{display:flex;align-items:center;gap:10px;padding:0 12px 10px}
.so-rond{flex:none;width:40px;height:40px;border-radius:50%;border:0;display:grid;place-items:center;background:rgba(255,255,255,.1);color:#FFF4E6;font-size:20px;font-weight:900;text-decoration:none;cursor:pointer}
.so-titre{flex:1;min-width:0;display:flex;flex-direction:column}
.so-titre b{font-size:17px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.so-titre small{font-size:12.5px;opacity:.75}
.so-scene{position:relative;width:100%}
.so-tele{position:relative;margin:0 auto;background:#000;overflow:hidden}
.so-vignette{width:100%;height:100%;object-fit:cover;opacity:.75;display:block}
.so-lecteur,.so-lecteur iframe{width:100%;height:100%;border:0;display:block}
.so-allumer{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:0;border-radius:999px;padding:12px 18px;font:inherit;font-weight:900;font-size:15px;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a);box-shadow:0 10px 24px -10px rgba(255,46,154,.9);white-space:nowrap;cursor:pointer}
.so-titre-video{position:absolute;left:10px;right:10px;bottom:8px;font-size:12.5px;font-weight:700;text-shadow:0 1px 4px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.so-tele-vide{margin:0;height:100%;display:grid;place-items:center;padding:0 20px;text-align:center;font-size:14px;opacity:.75}
.so-piece{position:relative;width:100%;overflow:hidden;background:linear-gradient(180deg,#4a2335,#24101b)}
.so-pano{position:absolute;left:0;top:0;max-width:none;background-size:cover;object-fit:cover;pointer-events:none}
.so-fig{position:absolute;transform:translateX(-50%);padding:0;border:0;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;-webkit-tap-highlight-color:transparent;transition:opacity .4s}
.so-fig img{height:100%;width:auto;max-width:none;filter:drop-shadow(0 6px 8px rgba(0,0,0,.5));user-select:none}
.so-fig small{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;padding:1px 7px;border-radius:999px;background:rgba(0,0,0,.6);white-space:nowrap;max-width:110%;overflow:hidden;text-overflow:ellipsis}
.so-fig.moi small{background:#FF2E9A;color:#2a0f1f}
.so-fig.cache{opacity:.3}
.so-sans{font-size:34px}
.so-bulle{position:absolute;transform:translateX(-50%);margin:0;max-width:136px;padding:6px 10px;border-radius:14px;background:#fff;color:#2a0f1f;font-size:12.5px;font-weight:700;line-height:1.25;box-shadow:0 6px 16px -6px rgba(0,0,0,.6);z-index:900;animation:so-entre .25s ease-out}
button.so-bulle{border:0;font-family:inherit;text-align:left;cursor:pointer;display:flex;align-items:flex-end;gap:5px}
button.so-bulle i{font-style:normal;font-size:11px;opacity:.8}
button.so-bulle.aimee{box-shadow:0 0 0 2px #FF2E9A,0 6px 16px -6px rgba(0,0,0,.6)}
.so-bulle::after{content:"";position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border:6px solid transparent;border-top-color:#fff;border-bottom:0}
.so-pop{position:absolute;transform:translateX(-50%);font-size:30px;z-index:901;animation:so-pop 2.1s ease-out forwards;pointer-events:none}
.so-vol{position:absolute;transform:translateX(-50%);font-size:28px;z-index:902;animation:so-vol 1.4s ease-in-out forwards;pointer-events:none}
.so-indice{position:absolute;left:50%;top:10px;transform:translateX(-50%);margin:0;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.55);font-size:12.5px;white-space:nowrap;z-index:950}
@keyframes so-entre{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes so-pop{0%{opacity:0;transform:translate(-50%,8px) scale(.5)}20%{opacity:1;transform:translate(-50%,-6px) scale(1.15)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-34px) scale(1)}}
@keyframes so-vol{0%{opacity:0;transform:translate(-50%,0) scale(.6)}15%{opacity:1}100%{opacity:1;transform:translate(calc(-50% + var(--dx)),var(--dy)) scale(1.1)}}
.so-bas{padding:12px 14px 0;display:flex;flex-direction:column;gap:10px;max-width:560px;margin:0 auto}
.so-info{margin:0;font-size:12.5px;opacity:.75;text-align:center}
.so-reagir{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center}
.so-reagir span{font-size:13px;font-weight:800}
.so-reagir button{width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.1);font-size:21px;cursor:pointer}
.so-reagir small{font-size:12px;opacity:.65;width:100%;text-align:center}
.so-refus{margin:0;padding:8px 12px;border-radius:12px;background:rgba(255,80,110,.18);color:#ffc4d2;font-size:13.5px}
.so-ecrire{display:flex;gap:8px}
.so-ecrire input{flex:1;min-width:0;border:0;border-radius:999px;padding:11px 14px;font:inherit;font-size:15px;background:rgba(255,255,255,.1);color:#FFF4E6}
.so-ecrire input::placeholder{color:rgba(255,244,230,.55)}
.so-regles{margin:0;font-size:11.5px;opacity:.6;text-align:center}
.so-note{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:min(92vw,420px);margin:0;padding:10px 14px;border-radius:14px;background:rgba(20,6,14,.94);box-shadow:0 10px 30px -10px #000;font-size:14px;text-align:center;z-index:30}
.so-voile{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;z-index:40}
.so-feuille{position:relative;width:100%;max-width:520px;max-height:82dvh;overflow:auto;padding:22px 18px calc(22px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:#21101a;color:#FFF4E6}
.so-feuille h2{margin:0 0 6px;font-size:19px;font-weight:900}
.so-fermer{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#FFF4E6;font-size:16px;cursor:pointer}
.so-chapo{margin:0 0 12px;opacity:.75;font-size:14px}
.so-fiche{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.so-fiche img{width:64px;height:64px;object-fit:contain}
.so-fiche small{opacity:.7;font-size:12.5px}
.so-gestes,.so-motifs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.so-gestes button,.so-motifs button{border:0;border-radius:999px;padding:10px 14px;font:inherit;font-weight:800;font-size:14px;background:rgba(255,255,255,.1);color:#FFF4E6;cursor:pointer}
.so-motifs{flex-direction:column}
.so-motifs button{border-radius:14px;text-align:left}
.so-discret{display:flex;gap:14px;justify-content:center}
.so-discret button{border:0;background:none;color:#FFF4E6;opacity:.75;font:inherit;font-size:13.5px;text-decoration:underline;cursor:pointer}
.so-conv p{margin:0 0 6px;font-size:14px;line-height:1.35}
.so-conv p span{margin-left:6px;font-size:11px;opacity:.55}
.so-coeur{margin-left:6px;border:0;background:none;font-size:14px;cursor:pointer;padding:0 2px}
.so-coeur:disabled{cursor:default}
.so-passions{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:0 0 12px;font-size:13px}
.so-passions b{font-size:12px;opacity:.7;margin-right:2px}
.so-passions span{border-radius:999px;padding:4px 10px;background:rgba(255,255,255,.1);font-weight:700}
.so-liens{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}
.so-liens a{text-decoration:none}
.so-ferme{font-size:12.5px;opacity:.6}
.so-moments{display:flex;flex-direction:column;gap:10px}
.so-moments .vide,.so-feuille .vide{opacity:.6;font-size:14px}
.so-moment{border-radius:14px;padding:12px;background:rgba(255,255,255,.07);display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center}
.so-moment p{margin:0;font-weight:800;line-height:1.3;grid-column:1}
.so-moment small{opacity:.65;font-size:12px;grid-column:1}
.so-moment button{grid-column:2;grid-row:1 / span 2}
.so-proches,.so-videos{list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:8px}
.so-proches button,.so-videos button{width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:14px;padding:8px 12px;background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-weight:800;font-size:15px;text-align:left;cursor:pointer}
.so-proches button.pris{background:rgba(255,46,154,.25);box-shadow:inset 0 0 0 2px #FF2E9A}
.so-proches button:disabled{opacity:.45}
.so-proches img,.so-rond-vide{width:42px;height:42px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.12);flex:none}
.so-proches span{flex:1}
.so-proches i{font-style:normal;color:#FF2E9A;font-size:18px}
.so-videos img{width:96px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;flex:none}
.so-videos span{font-size:13.5px;line-height:1.25}
.so-videos button.en-cours{box-shadow:inset 0 0 0 2px #FF2E9A}
.so-commandes{display:flex;gap:8px;justify-content:center;margin:8px auto 0;flex-wrap:wrap}
.so-commandes button{border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:800;font-size:13.5px;background:rgba(255,255,255,.12);color:#FFF4E6;cursor:pointer}
.so-commandes button:disabled{opacity:.5}
.so-en-pause{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:34px;font-weight:900;text-shadow:0 2px 10px #000}
.so-seance .so-scene{padding-bottom:4px}
.so-conv p.moi b{color:#ff8fc8}
.so-conv .vide{opacity:.55}
.so-groupe{margin:12px 0 6px!important;font-size:12px!important;font-weight:900;text-transform:uppercase;letter-spacing:.04em;opacity:.6}
@media (min-width:1000px){
.so:not(.so-centre){max-width:1140px;display:grid;grid-template-columns:minmax(0,1fr) 340px;grid-template-areas:"haut haut" "scene bas";column-gap:22px;padding-left:16px;padding-right:16px}
.so-haut{grid-area:haut}
.so-scene{grid-area:scene;border-radius:18px;overflow:hidden}
.so-bas{grid-area:bas;align-self:start;position:sticky;top:16px;padding:6px 0 0;margin:0;max-width:none;min-width:0}
}
@media (prefers-reduced-motion: reduce){.so-pop,.so-vol,.so-bulle{animation:none!important}}
`;
