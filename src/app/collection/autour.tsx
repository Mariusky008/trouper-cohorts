"use client";

/**
 * 📍 « AUTOUR DE MOI » — l'onglet « Autour » (le lot B ; validé par le propriétaire le 7 novembre 2026 ; la maquette, les
 * règles et le plan : `docs/reprise.md`, section 4 ; le serveur : `lib/direct/autour-serveur.ts`).
 *
 * LE PARCOURS : la carte → un lieu → ses mèmes, un par un (glisser à droite : J'aime ; à gauche : passer) → répondre
 * avec sa figurine → déposer le sien. Le mème est le héros : la vidéo de la figurine, en grand.
 *
 *   · LA CARTE (`autour-carte.tsx`) : les commerces (le visage d'une figurine, le nombre de mèmes), les zones
 *     « Ailleurs » (floues), « Ma position », « ＋ Déposer mon mème », et les derniers mèmes autour de lui. Sans carte
 *     (pas de réseau, pas de WebGL) : la liste des lieux.
 *   · LE LIEU : son nom, combien de mèmes, un éventail, « ▶ Découvrir », la conversation du moment, « Déposer ici ».
 *   · LE SWIPE : une grande carte (la vidéo), la suivante dessous ; ✕ Passer, ❤ J'aime (la réaction `coeur`),
 *     « Répondre avec ma figurine », Partager ; le prénom mène au profil ; ⋯ pour signaler.
 *   · DÉPOSER : où (ce lieu, un commerce, « Ailleurs » + un petit nom), quel mème (un des siens, ou « ＋ Nouveau »),
 *     un petit mot, qui le voit — puis « C'est publié ! ».
 *   · LE PROFIL : sa figurine, ses mèmes « tout le monde » et leurs lieux ; jamais sa position.
 */
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { OngletVisible } from "./guide";
import { CarteAutour, STYLES_CARTE_AUTOUR } from "./autour-carte";
import { QUIS, distance, enMetres, estZone, type Lieu, type MemeAutour, type ProfilAutour, type Qui } from "@/lib/direct/autour";
import { REFUS_AGE, type MonMeme } from "@/lib/direct/ma-figurine";
import { demanderSonAge } from "./age";
import { EVT_VERS_AUTOUR, garderLeDepot, oublierLeDepot, reprendreLeDepot, type DepotEnCours } from "./depot-autour";
import { versLeStudio } from "./vers-le-studio";

type Vue =
  | { t: "carte" }
  | { t: "lieu"; id: string }
  | { t: "swipe"; id: string; depart?: string }
  | { t: "deposer"; lieu?: string; reponseA?: string; reprise?: DepotEnCours }
  | { t: "publie"; lieu: string; meme: string }
  | { t: "profil"; cle: string };
type Carte = { ville: string; lieux: Lieu[]; derniers: MemeAutour[]; compte: boolean };
type Pos = { lat: number; lng: number };

const ROUTE = "/api/direct/autour";
const poster = async (url: string, corps: unknown) => {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  return { ok: r.ok, ...((await r.json().catch(() => ({}))) as { error?: string; lieu?: string; age?: boolean }) };
};
/** « il y a 2 h », « hier », « il y a 4 j ». */
function quand(le: string): string {
  const s = (Date.now() - Date.parse(le)) / 1000;
  if (!Number.isFinite(s) || s < 90) return "à l’instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86_400) return `il y a ${Math.round(s / 3600)} h`;
  if (s < 2 * 86_400) return "hier";
  return `il y a ${Math.round(s / 86_400)} j`;
}
/** Sa position, une fois (pour trier et pour « Ailleurs ») : rien n'est envoyé tel quel. */
const position = () =>
  new Promise<Pos | null>((ok) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return ok(null);
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => ok(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 },
    );
  });

/** Un mème en vignette, au style des vrais mèmes ClikMe : le fuchsia, la figurine en grand, ses mots en capitales. */
function Vignette({ m, onClick, petit = false }: { m: MemeAutour; onClick?: () => void; petit?: boolean }) {
  return (
    <button type="button" className={`atr-vignette${petit ? " petit" : ""}`} onClick={onClick} aria-label={`Le mème de ${m.prenom}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.image} alt="" />
      {m.texte && <span>{m.texte}</span>}
    </button>
  );
}

export function Autour({ allerA }: { allerA: (o: string) => void }) {
  const visible = useContext(OngletVisible);
  const [carte, setCarte] = useState<Carte | null>(null);
  const [vue, setVue] = useState<Vue>({ t: "carte" });
  const [panne, setPanne] = useState(false);
  const [moi, setMoi] = useState<Pos | null>(null);
  const [recentrer, setRecentrer] = useState(0);
  const [cherche, setCherche] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let fini = false;
    void fetch(ROUTE, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Carte | null) => !fini && j && setCarte(j))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [visible, version]);

  // 🎭 SON MÈME EST PRÊT, fait au studio pour ce dépôt (« ＋ Nouveau mème ») : le dépôt se rouvre, le mème déjà choisi
  useEffect(() => {
    const rouvrir = (d: DepotEnCours | null) => {
      if (d?.meme) setVue({ t: "deposer", lieu: d.lieuDonne, reponseA: d.reponseA, reprise: d });
    };
    const ecoute = (e: Event) => {
      oublierLeDepot();
      rouvrir((e as CustomEvent<DepotEnCours>).detail);
    };
    window.addEventListener(EVT_VERS_AUTOUR, ecoute);
    return () => window.removeEventListener(EVT_VERS_AUTOUR, ecoute);
  }, []);
  useEffect(() => {
    // (« Autour » n'était pas encore ouvert : le dépôt l'attendait le temps de la visite)
    if (visible) void Promise.resolve().then(() => {
      const d = reprendreLeDepot();
      if (d) setVue({ t: "deposer", lieu: d.lieuDonne, reponseA: d.reponseA, reprise: d });
    });
  }, [visible]);

  const ouvrirLieu = useCallback((id: string) => setVue({ t: "lieu", id }), []);
  const tomber = useCallback(() => setPanne(true), []);
  const lieux = useMemo(() => carte?.lieux ?? [], [carte]);
  const avecMemes = lieux.filter((l) => l.n > 0);
  const trouves = cherche.trim() ? lieux.filter((l) => l.nom.toLowerCase().includes(cherche.trim().toLowerCase())).slice(0, 5) : [];
  const ou = carte?.ville ? `à ${carte.ville.charAt(0).toUpperCase()}${carte.ville.slice(1)}` : "dans ta ville";
  // (sans figurine, on ne sait pas sa ville : la carte l'attend)
  const sansVille = Boolean(carte && !carte.ville);
  const retour = () => {
    setVue({ t: "carte" });
    setVersion((v) => v + 1);
  };

  return (
    <div className="atr">
      {/* 🗺️ LA CARTE (toujours là, sous les autres vues) */}
      <div className="atr-carte-fond">
        {!panne && <CarteAutour lieux={lieux} moi={moi} recentrer={recentrer} onLieu={ouvrirLieu} onPanne={tomber} />}
      </div>
      <div className="atr-haut">
        <h1>Autour de moi</h1>
        <p>Les mèmes déposés près de toi, {ou}</p>
        <label className="atr-recherche">
          <span aria-hidden="true">🔍</span>
          <input type="search" value={cherche} onChange={(e) => setCherche(e.target.value)} placeholder="Un lieu près de toi…" aria-label="Chercher un lieu" />
        </label>
        {trouves.length > 0 && (
          <ul className="atr-trouves">
            {trouves.map((l) => (
              <li key={l.id}>
                <button type="button" onClick={() => ouvrirLieu(l.id)}>
                  {l.emoji} {l.nom} <small>{l.n} mème{l.n > 1 ? "s" : ""}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {panne && (
        <section className="atr-liste" aria-label="Les lieux qui ont des mèmes">
          <p className="atr-panne">La carte ne s’est pas chargée : voici les lieux.</p>
          {(avecMemes.length ? avecMemes : lieux).map((l) => (
            <button key={l.id} type="button" className="atr-ligne" onClick={() => ouvrirLieu(l.id)}>
              <span className="atr-ligne-ico">{l.emoji}</span>
              <span>
                <b>{l.nom}</b>
                <small>
                  {l.n} mème{l.n > 1 ? "s" : ""}
                  {moi && !estZone(l.id) ? ` · ${enMetres(distance(moi, l))}` : ""}
                </small>
              </span>
            </button>
          ))}
        </section>
      )}

      <div className="atr-actions">
        <button type="button" className="atr-poser" onClick={() => setVue({ t: "deposer" })}>
          ＋ Déposer mon mème
        </button>
        <button
          type="button"
          className="atr-ma-position"
          aria-label="Ma position"
          onClick={() =>
            void position().then((p) => {
              if (p) {
                setMoi(p);
                setRecentrer((n) => n + 1);
              }
            })
          }
        >
          ◎
        </button>
      </div>

      <section className="atr-feuille" aria-label="Les derniers mèmes autour de toi">
        <i aria-hidden="true" />
        <h2>Les derniers mèmes autour de toi</h2>
        {sansVille ? (
          <div className="atr-invite">
            <p className="atr-vide">Crée ta figurine : tu verras les mèmes déposés dans ta ville, et tu pourras laisser les tiens.</p>
            <button type="button" className="atr-poser" onClick={() => allerA("figurine")}>
              🎭 Créer ma figurine
            </button>
          </div>
        ) : carte && carte.derniers.length === 0 ? (
          <p className="atr-vide">Personne n’a encore déposé de mème par ici. Sois la première figurine !</p>
        ) : (
          <div className="atr-derniers">
            {(carte?.derniers ?? []).map((m) => (
              <div key={m.id} className="atr-dernier">
                <Vignette m={m} onClick={() => setVue({ t: "swipe", id: m.lieu, depart: m.id })} />
                <small>
                  {m.prenom} · {lieux.find((l) => l.id === m.lieu)?.nom ?? m.nomLieu ?? "par ici"}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LES VUES EN PLEIN ÉCRAN (le menu du bas disparaît dessous) */}
      {vue.t === "lieu" && <VueLieu id={vue.id} ville={carte?.ville ?? ""} moi={moi} onFermer={retour} onSwipe={(depart) => setVue({ t: "swipe", id: vue.id, depart })} onDeposer={() => setVue({ t: "deposer", lieu: vue.id })} />}
      {vue.t === "swipe" && (
        <Swipe
          id={vue.id}
          depart={vue.depart}
          ville={carte?.ville ?? ""}
          compte={Boolean(carte?.compte)}
          onFermer={() => setVue({ t: "lieu", id: vue.id })}
          onRepondre={(meme) => setVue({ t: "deposer", lieu: vue.id, reponseA: meme })}
          onProfil={(cle) => setVue({ t: "profil", cle })}
        />
      )}
      {vue.t === "deposer" && (
        <Deposer
          key={vue.reprise?.meme ?? "depot"}
          lieuDonne={vue.lieu}
          reponseA={vue.reponseA}
          reprise={vue.reprise}
          lieux={lieux}
          compte={Boolean(carte?.compte)}
          onFermer={() => (vue.lieu ? setVue({ t: "lieu", id: vue.lieu }) : retour())}
          onPublie={(lieu, meme) => {
            setVue({ t: "publie", lieu, meme });
            setVersion((v) => v + 1);
          }}
          allerA={allerA}
        />
      )}
      {vue.t === "publie" && <Publie lieu={vue.lieu} meme={vue.meme} onVoir={() => setVue({ t: "swipe", id: vue.lieu, depart: vue.meme })} onCarte={retour} />}
      {vue.t === "profil" && <Profil cle={vue.cle} onFermer={retour} onLieu={(id) => setVue({ t: "lieu", id })} />}
    </div>
  );
}

// ─── 📍 LE LIEU ────────────────────────────────────────────────────────────────────────────────────────────────────
function useLieu(id: string, ville: string) {
  const [r, setR] = useState<{ lieu: Lieu | null; memes: MemeAutour[] } | null>(null);
  useEffect(() => {
    let fini = false;
    void fetch(`${ROUTE}?lieu=${encodeURIComponent(id)}&ville=${encodeURIComponent(ville)}`, { cache: "no-store" })
      .then((x) => x.json())
      .then((j: { lieu?: Lieu; memes?: MemeAutour[] }) => !fini && setR({ lieu: j.lieu ?? null, memes: j.memes ?? [] }))
      .catch(() => !fini && setR({ lieu: null, memes: [] }));
    return () => {
      fini = true;
    };
  }, [id, ville]);
  return r;
}

function VueLieu({ id, ville, moi, onFermer, onSwipe, onDeposer }: { id: string; ville: string; moi: Pos | null; onFermer: () => void; onSwipe: (depart?: string) => void; onDeposer: () => void }) {
  const r = useLieu(id, ville);
  const l = r?.lieu;
  const memes = r?.memes ?? [];
  const conv = memes.find((m) => m.reponses > 0);
  const coeurs = memes.reduce((a, m) => a + (m.reac?.n.coeur ?? 0), 0);
  return (
    <section className="atr-plein atr-lieu" aria-label={l?.nom ?? "Un lieu"}>
      <button type="button" className="atr-fermer" aria-label="Retour à la carte" onClick={onFermer}>
        ‹
      </button>
      <header>
        <span className="atr-type">{l ? `${l.emoji} ${l.type === "zone" ? "Ailleurs, quelque part par ici" : l.activite || "Commerce"}` : "…"}</span>
        <h2>{l?.nom ?? "…"}</h2>
        {l && moi && l.type === "commerce" && <span className="atr-dist">📍 {enMetres(distance(moi, l))}</span>}
        <b className="atr-compte">
          <em>
            {memes.length} mème{memes.length > 1 ? "s" : ""}
          </em>{" "}
          déposé{memes.length > 1 ? "s" : ""} ici{coeurs ? ` · ${coeurs} ❤️` : ""}
        </b>
      </header>
      {memes.length > 0 ? (
        <>
          <button type="button" className="atr-eventail" onClick={() => onSwipe()} aria-label="Découvrir les mèmes de ce lieu">
            {memes.slice(0, 3).map((m, k) => (
              <span key={m.id} className={`atr-carte-${k}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.image} alt="" />
                {m.texte && <em>{m.texte}</em>}
              </span>
            ))}
          </button>
          <button type="button" className="atr-decouvrir" onClick={() => onSwipe()}>
            ▶ Découvrir {memes.length > 1 ? `les ${memes.length} mèmes` : "le mème"}
          </button>
          {conv && (
            <button type="button" className="atr-conv" onClick={() => onSwipe(conv.id)}>
              <b>La conversation du moment</b>
              <small>
                {conv.texte ? `« ${conv.texte} » · ` : ""}
                {conv.reponses} réponse{conv.reponses > 1 ? "s" : ""}
              </small>
            </button>
          )}
        </>
      ) : (
        r && <p className="atr-vide">Pas encore de mème ici. Le premier, ce sera le tien ?</p>
      )}
      <div className="atr-bas">
        <button type="button" className="atr-rose" onClick={onDeposer}>
          ＋ Déposer mon mème ici
        </button>
      </div>
    </section>
  );
}

// ─── 👆 LE SWIPE ───────────────────────────────────────────────────────────────────────────────────────────────────
function Swipe({ id, depart, ville, compte, onFermer, onRepondre, onProfil }: { id: string; depart?: string; ville: string; compte: boolean; onFermer: () => void; onRepondre: (meme: string) => void; onProfil: (cle: string) => void }) {
  const r = useLieu(id, ville);
  const memes = useMemo(() => {
    const l = r?.memes ?? [];
    const k = depart ? l.findIndex((m) => m.id === depart) : -1;
    return k > 0 ? [...l.slice(k), ...l.slice(0, k)] : l;
  }, [r, depart]);
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [glisse, setGlisse] = useState(false);
  const [aimes, setAimes] = useState<Record<string, boolean>>({});
  const [mot, setMot] = useState("");
  const depuis = useRef<{ x: number; id: number; el: HTMLElement } | null>(null);
  const minuteur = useRef<number | null>(null);
  useEffect(() => () => void (minuteur.current && window.clearTimeout(minuteur.current)), []);
  const n = memes.length;
  const c = n ? memes[i % n] : null;
  const s = n > 1 ? memes[(i + 1) % n] : null;
  const fin = n > 0 && i >= n;

  const partir = (sens: 1 | -1) => {
    if (!c || minuteur.current) return;
    if (sens > 0 && compte && !aimes[c.id]) {
      setAimes((a) => ({ ...a, [c.id]: true }));
      void poster("/api/direct/ma-figurine", { action: "reagir", id: c.id, reac: "coeur" });
    }
    setGlisse(false);
    setDx(sens * 560);
    minuteur.current = window.setTimeout(() => {
      minuteur.current = null;
      setDx(0);
      setI((x) => x + 1);
    }, 280);
  };
  const partager = async () => {
    if (!c) return;
    const url = `${window.location.origin}/figurine/${c.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `Le mème de ${c.prenom}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setMot("✓ Lien copié : envoie-le où tu veux");
      }
    } catch {
      /* il a refermé le partage */
    }
  };
  const signaler = async () => {
    if (!c || !window.confirm("Signaler ce mème ? Il disparaît le temps qu’on le regarde.")) return;
    await poster("/api/direct/ma-figurine", { action: "signaler", id: c.id });
    setMot("Merci : ce mème est signalé.");
    partir(-1);
  };
  const auteurDe = (meme: string) => memes.find((m) => m.id === meme)?.prenom;

  return (
    <section className="atr-plein atr-swipe" aria-label="Les mèmes du lieu">
      <div className="atr-swipe-haut">
        <button type="button" className="atr-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
        <span className="atr-progres">
          <i style={{ width: `${n ? Math.min(100, ((Math.min(i, n - 1) + 1) / n) * 100) : 0}%` }} />
        </span>
        <span className="atr-num">{n ? `${Math.min(i + 1, n)} / ${n}` : ""}</span>
        <button type="button" className="atr-fermer" aria-label="Signaler ce mème" onClick={() => void signaler()} disabled={!c || fin}>
          ⋯
        </button>
      </div>
      {r && !n && <p className="atr-vide">Pas encore de mème ici.</p>}
      {fin ? (
        <div className="atr-fin">
          <b>Tu as tout vu ici 🎉</b>
          <button type="button" className="atr-rose" onClick={() => setI(0)}>
            Revoir depuis le début
          </button>
        </div>
      ) : (
        c && (
          <div className="atr-pile">
            {s && (
              <div className="atr-mcarte dessous" aria-hidden="true" style={{ transform: `translateY(${16 - Math.min(16, Math.abs(dx) / 8)}px) scale(${0.94 + Math.min(0.06, Math.abs(dx) / 2400)})` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt="" />
              </div>
            )}
            <div
              key={c.id}
              className="atr-mcarte"
              style={{ transform: `translateX(${dx}px) rotate(${dx / 22}deg)`, transition: glisse ? "none" : "transform .28s cubic-bezier(.2,.8,.3,1)" }}
              onPointerDown={(e) => {
                depuis.current = { x: e.clientX, id: e.pointerId, el: e.currentTarget };
              }}
              onPointerMove={(e) => {
                const d = depuis.current;
                if (!d || minuteur.current) return;
                const v = e.clientX - d.x;
                if (!glisse && Math.abs(v) < 6) return;
                if (!glisse) {
                  try {
                    d.el.setPointerCapture(d.id);
                  } catch {
                    /* rien */
                  }
                  setGlisse(true);
                }
                setDx(v);
              }}
              onPointerUp={() => {
                depuis.current = null;
                if (!glisse) return;
                if (dx > 100) partir(1);
                else if (dx < -100) partir(-1);
                else {
                  setGlisse(false);
                  setDx(0);
                }
              }}
              onPointerCancel={() => {
                depuis.current = null;
                setGlisse(false);
                setDx(0);
              }}
            >
              {c.video ? (
                <video src={c.video} poster={c.image} autoPlay muted loop playsInline draggable={false} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.image} alt="" draggable={false} />
              )}
              <span className="atr-tampon aime" style={{ opacity: Math.max(0, Math.min(1, dx / 110)) }}>
                J’AIME
              </span>
              <span className="atr-tampon passe" style={{ opacity: Math.max(0, Math.min(1, -dx / 110)) }}>
                SUIVANT
              </span>
              {c.reponseA && auteurDe(c.reponseA) && <span className="atr-reponse-a">↳ Réponse à {auteurDe(c.reponseA)}</span>}
              <div className="atr-bande">
                <button type="button" className="atr-avatar" aria-label={`Le profil de ${c.prenom}`} onClick={() => onProfil(c.profil)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" />
                </button>
                <span className="atr-qui">
                  <b>
                    {c.prenom} <small>· {quand(c.le)}</small>
                  </b>
                  <span>{c.mot ?? c.nomLieu ?? ""}</span>
                </span>
                <span className="atr-chiffres">
                  <span>❤️ {(c.reac?.n.coeur ?? 0) + (aimes[c.id] && c.reac?.moi !== "coeur" ? 1 : 0)}</span>
                  <span>💬 {c.reponses}</span>
                </span>
              </div>
            </div>
          </div>
        )
      )}
      {mot && (
        <p className="atr-toast" role="status">
          {mot}
        </p>
      )}
      {c && !fin && (
        <div className="atr-boutons">
          <span>
            <button type="button" className="atr-rond" aria-label="Passer" onClick={() => partir(-1)}>
              ✕
            </button>
            <small>Passer</small>
          </span>
          <span>
            <button type="button" className="atr-rond aime" aria-label="J’aime" onClick={() => partir(1)}>
              ♥
            </button>
            <small>J’aime</small>
          </span>
          <span>
            <button type="button" className="atr-rond repondre" aria-label="Répondre avec ma figurine" onClick={() => onRepondre(c.id)}>
              ↩
            </button>
            <small>Répondre avec ma figurine</small>
          </span>
          <span>
            <button type="button" className="atr-rond petit" aria-label="Partager hors de ClikMe" onClick={() => void partager()}>
              ⤴
            </button>
            <small>Partager</small>
          </span>
        </div>
      )}
      <p className="atr-aide">Glisse à droite pour aimer · à gauche pour passer</p>
    </section>
  );
}

// ─── ＋ DÉPOSER ────────────────────────────────────────────────────────────────────────────────────────────────────
// (`reprise` : son dépôt d'avant le studio, avec le mème qu'il vient d'y faire — `depot-autour.ts`)
function Deposer({ lieuDonne, reponseA, reprise, lieux, compte, onFermer, onPublie, allerA }: { lieuDonne?: string; reponseA?: string; reprise?: DepotEnCours; lieux: Lieu[]; compte: boolean; onFermer: () => void; onPublie: (lieu: string, meme: string) => void; allerA: (o: string) => void }) {
  const [miens, setMiens] = useState<MonMeme[] | null>(null);
  const [lieu, setLieu] = useState<string>(lieuDonne ?? reprise?.lieu ?? "");
  const [ailleurs, setAilleurs] = useState(Boolean(reprise?.ailleurs) && !reponseA);
  const [nomLieu, setNomLieu] = useState(reprise?.nomLieu ?? "");
  const [meme, setMeme] = useState(reprise?.meme ?? "");
  const [mot, setMot] = useState(reprise?.mot ?? "");
  const [qui, setQui] = useState<Qui>(reprise?.qui ?? "tous");
  const [ici, setIci] = useState<Pos | null>(null);
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/ma-figurine?memes=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { memes?: { envoyes?: MonMeme[] } } | null) => {
        if (fini) return;
        const l = (j?.memes?.envoyes ?? []).filter((m) => m.video && !m.duo);
        setMiens(l);
        if (l[0]) setMeme((x) => x || l[0].id);
      })
      .catch(() => !fini && setMiens([]));
    void position().then((p) => !fini && setIci(p));
    return () => {
      fini = true;
    };
  }, []);
  const commerces = useMemo(
    () =>
      lieux
        .filter((l) => l.type === "commerce")
        .map((l) => ({ ...l, d: ici ? distance(ici, l) : null }))
        .sort((a, b) => (a.d ?? 1e9) - (b.d ?? 1e9) || b.n - a.n)
        .slice(0, 4),
    [lieux, ici],
  );
  const donne = lieuDonne ? lieux.find((l) => l.id === lieuDonne) : null;
  /** ＋ NOUVEAU MÈME, « avec sa tête » : le studio s'ouvre pour ce lieu ; son dépôt l'attend, et il y revient son mème prêt. */
  const nouveauMeme = () => {
    const choisi = ailleurs ? null : lieux.find((l) => l.id === lieu);
    const ou = ailleurs ? { nom: nomLieu.trim() || "Ailleurs", emoji: "✨" } : choisi ? { nom: choisi.nom, emoji: choisi.emoji } : {};
    garderLeDepot({ lieuDonne, lieu: lieu || undefined, reponseA, ailleurs, nomLieu, mot, qui });
    versLeStudio({ autour: { ...ou, reponse: Boolean(reponseA) } });
  };
  const publier = async () => {
    setErreur("");
    if (!meme) return setErreur("Choisis un de tes mèmes (ou fais-en un nouveau).");
    if (!ailleurs && !lieu) return setErreur("Où le déposer ?");
    if (ailleurs && !ici) return setErreur("Pour « Ailleurs », ton téléphone doit dire où tu es (ta position n’est jamais montrée).");
    setOccupe(true);
    const deposer = () => poster(ROUTE, {
      action: "deposer",
      meme,
      qui,
      mot,
      ...(reponseA ? { reponseA } : {}),
      // « Ailleurs » : sa position (arrondie au serveur en une zone) ; sinon le lieu choisi, commerce ou zone qui a déjà des mèmes
      ...(ailleurs ? { ici, nomLieu } : { lieu }),
    });
    let r = await deposer();
    // 🔞 il n'a pas encore déclaré son âge : une fois, puis le dépôt repart
    if (!r.ok && r.age) {
      if (!(await demanderSonAge())) {
        setOccupe(false);
        return setErreur(REFUS_AGE);
      }
      r = await deposer();
    }
    setOccupe(false);
    if (!r.ok || !r.lieu) return setErreur(r.error || "Ça n’a pas marché. Réessaie.");
    onPublie(r.lieu, meme);
  };
  if (!compte)
    return (
      <section className="atr-plein atr-deposer" aria-label="Déposer mon mème">
        <button type="button" className="atr-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
        <p className="atr-vide">Pour déposer un mème, il te faut ta figurine.</p>
        <button type="button" className="atr-rose" onClick={() => allerA("figurine")}>
          🎭 Créer ma figurine
        </button>
      </section>
    );
  return (
    <section className="atr-plein atr-deposer" aria-label={reponseA ? "Répondre avec ma figurine" : "Déposer mon mème"}>
      <div className="atr-titre">
        <button type="button" className="atr-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
        <h2>{reponseA ? "Répondre avec ma figurine" : "Déposer mon mème"}</h2>
      </div>

      <h3>1 · Où ?</h3>
      {donne && !ailleurs ? (
        <p className="atr-choix pris">
          {donne.emoji} {donne.nom}
        </p>
      ) : (
        !ailleurs && (
          <div className="atr-lieux">
            {commerces.map((l) => (
              <button key={l.id} type="button" className={`atr-choix${lieu === l.id ? " pris" : ""}`} aria-pressed={lieu === l.id} onClick={() => setLieu(l.id)}>
                {l.emoji} {l.nom} {l.d != null && <small>· {enMetres(l.d)}</small>}
              </button>
            ))}
          </div>
        )
      )}
      {!reponseA && (
        <button type="button" className={`atr-ailleurs${ailleurs ? " pris" : ""}`} aria-pressed={ailleurs} onClick={() => setAilleurs((a) => !a)}>
          ✨ Ailleurs : la rue, une soirée, chez un ami…
        </button>
      )}
      {ailleurs && (
        <>
          <input className="atr-champ" value={nomLieu} onChange={(e) => setNomLieu(e.target.value)} maxLength={40} placeholder="Un petit nom : « Soirée chez Max »" aria-label="Le petit nom de l’endroit" />
          <p className="atr-note">On montrera « quelque part par ici » : jamais une adresse, jamais l’endroit exact.</p>
        </>
      )}

      <h3>2 · Quel mème ?</h3>
      <div className="atr-miens">
        <button type="button" className="atr-nouveau" onClick={nouveauMeme}>
          ＋ Nouveau mème
          <small>avec ma tête</small>
        </button>
        {(miens ?? []).map((m) => (
          <button key={m.id} type="button" className={`atr-vignette petit${meme === m.id ? " pris" : ""}`} aria-pressed={meme === m.id} aria-label={m.texte ?? "Mon mème"} onClick={() => setMeme(m.id)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.image} alt="" />
            {m.texte && <span>{m.texte}</span>}
          </button>
        ))}
      </div>
      {miens && miens.length === 0 && <p className="atr-note">Tu n’as pas encore de mème en vidéo : fais-en un dans « Créer », il t’attendra ici.</p>}

      <h3>
        3 · Un petit mot ? <small>(si tu veux)</small>
      </h3>
      <input className="atr-champ" value={mot} onChange={(e) => setMot(e.target.value)} maxLength={80} placeholder="Le chef m’a reconnu." aria-label="Un petit mot" />

      <h3>4 · Qui le voit ?</h3>
      <div className="atr-qui-voit" role="radiogroup" aria-label="Qui le voit">
        {QUIS.map((q) => (
          <button key={q.cle} type="button" role="radio" aria-checked={qui === q.cle} className={qui === q.cle ? "pris" : ""} onClick={() => setQui(q.cle)}>
            {q.nom}
          </button>
        ))}
      </div>
      <p className="atr-note">🔒 Ta position n’est jamais montrée en direct. Le lieu dit où ton mème est déposé, pas que tu y étais.</p>
      {erreur && (
        <p className="atr-erreur" role="alert">
          {erreur}
        </p>
      )}
      <div className="atr-bas">
        <button type="button" className="atr-rose" disabled={occupe} onClick={() => void publier()}>
          📍 {reponseA ? "Publier ma réponse" : "Publier"}
        </button>
      </div>
    </section>
  );
}

// ─── ✓ C'EST PUBLIÉ ────────────────────────────────────────────────────────────────────────────────────────────────
function Publie({ meme, onVoir, onCarte }: { lieu: string; meme: string; onVoir: () => void; onCarte: () => void }) {
  const partager = async () => {
    const url = `${window.location.origin}/figurine/${meme}`;
    try {
      if (navigator.share) await navigator.share({ title: "Mon mème ClikMe", url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* refermé */
    }
  };
  return (
    <section className="atr-plein atr-publie" aria-label="C’est publié">
      <span className="atr-pin" aria-hidden="true">
        📍
      </span>
      <h2>C’est publié !</h2>
      <p>Ton mème est sur la carte. Ceux qui passent par là pourront y répondre avec leur figurine.</p>
      <div className="atr-bas">
        <button type="button" className="atr-rose" onClick={onVoir}>
          Voir mon mème
        </button>
        <button type="button" className="atr-blanc" onClick={() => void partager()}>
          Partager hors de ClikMe
        </button>
        <button type="button" className="atr-lien" onClick={onCarte}>
          Retour à la carte
        </button>
      </div>
    </section>
  );
}

// ─── 👤 LE PROFIL ──────────────────────────────────────────────────────────────────────────────────────────────────
function Profil({ cle, onFermer, onLieu }: { cle: string; onFermer: () => void; onLieu: (id: string) => void }) {
  const [p, setP] = useState<ProfilAutour | null | false>(null);
  useEffect(() => {
    let fini = false;
    void fetch(`${ROUTE}?profil=${encodeURIComponent(cle)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { profil?: ProfilAutour } | null) => !fini && setP(j?.profil ?? false))
      .catch(() => !fini && setP(false));
    return () => {
      fini = true;
    };
  }, [cle]);
  return (
    <section className="atr-plein atr-profil" aria-label={p ? `Le profil de ${p.prenom}` : "Un profil"}>
      <button type="button" className="atr-fermer" aria-label="Retour" onClick={onFermer}>
        ‹
      </button>
      {p === false && <p className="atr-vide">Ce profil n’existe plus.</p>}
      {p && (
        <>
          <div className="atr-heros">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.image && <img src={p.image} alt={`La figurine de ${p.prenom}`} />}
            <h2>{p.prenom || "Quelqu’un"}</h2>
            <span>
              {p.memes.length} mème{p.memes.length > 1 ? "s" : ""} · {p.lieux.length} lieu{p.lieux.length > 1 ? "x" : ""}
            </span>
          </div>
          {p.lieux.length > 0 && (
            <>
              <h3>Ses lieux</h3>
              <div className="atr-puces">
                {p.lieux.map((l) => (
                  <button key={l.id} type="button" onClick={() => onLieu(l.id)}>
                    📍 {l.nom} · {l.n}
                  </button>
                ))}
              </div>
            </>
          )}
          <h3>Ses mèmes</h3>
          <div className="atr-grille">
            {p.memes.map((m) => (
              <Vignette key={m.id} m={m} petit onClick={() => onLieu(m.lieu)} />
            ))}
          </div>
          <p className="atr-note">🔒 Jamais sa position : seulement les lieux où ses mèmes sont déposés pour tout le monde.</p>
        </>
      )}
    </section>
  );
}

export const STYLES_AUTOUR =
  STYLES_CARTE_AUTOUR +
  `
.atr{position:relative}
.atr-carte-fond{position:fixed;inset:0;z-index:0}
.atr-haut{position:fixed;left:0;right:0;top:calc(52px + env(safe-area-inset-top));z-index:2;display:flex;flex-direction:column;gap:2px;padding:10px 16px 14px;background:linear-gradient(180deg,rgba(14,10,16,.96) 60%,rgba(14,10,16,0));pointer-events:none}
.atr-haut>*{pointer-events:auto}
.atr-haut h1{margin:0;font-family:Poppins,system-ui,sans-serif;font-size:30px;line-height:1.05;font-weight:800;letter-spacing:-.035em}
.atr-haut p{margin:0 0 8px;font-size:14.5px;color:#CBB9C3}
.atr-recherche{display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border-radius:14px;background:rgba(24,17,27,.95);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1)}
.atr-recherche input{flex:1;min-width:0;border:0;background:none;color:#fff;font:inherit;font-size:15px;outline:none}
.atr-trouves{margin:6px 0 0;padding:6px;list-style:none;border-radius:14px;background:#1A121C;box-shadow:0 14px 30px -10px rgba(0,0,0,.9)}
.atr-trouves button{width:100%;padding:10px;border:0;border-radius:10px;background:none;color:#fff;font:inherit;text-align:left;cursor:pointer}
.atr-trouves small{color:#9C8795}
.atr-liste{position:fixed;left:0;right:0;top:calc(200px + env(safe-area-inset-top));bottom:calc(394px + env(safe-area-inset-bottom));z-index:1;overflow:auto;padding:0 16px;display:flex;flex-direction:column;gap:8px}
.atr-panne{margin:0;font-size:13px;color:#9C8795}
.atr-ligne{display:flex;align-items:center;gap:12px;padding:10px 12px;border:0;border-radius:16px;background:#1A121C;color:#fff;font:inherit;text-align:left;cursor:pointer}
.atr-ligne-ico{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#FF2E9A;font-size:20px}
.atr-ligne b{display:block;font-family:Poppins,system-ui,sans-serif;font-size:15px}
.atr-ligne small{color:#9C8795}
.atr-actions{position:fixed;left:16px;right:16px;bottom:calc(334px + env(safe-area-inset-bottom));z-index:2;display:flex;justify-content:space-between;align-items:center;pointer-events:none}
.atr-actions>*{pointer-events:auto}
.atr-poser{height:50px;padding:0 20px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:800 16px Poppins,system-ui,sans-serif;box-shadow:0 12px 28px -8px rgba(255,46,154,.85);cursor:pointer}
.atr-ma-position{width:50px;height:50px;border:0;border-radius:50%;background:rgba(24,17,27,.95);color:#fff;font-size:22px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);cursor:pointer}
.atr-feuille{position:fixed;left:0;right:0;bottom:0;z-index:2;display:flex;flex-direction:column;gap:8px;height:calc(320px + env(safe-area-inset-bottom));box-sizing:border-box;padding:10px 0 0;border-radius:26px 26px 0 0;background:#151017;box-shadow:0 -1px 0 rgba(255,255,255,.08),0 -20px 40px -10px rgba(0,0,0,.8)}
.atr-feuille>i{align-self:center;width:38px;height:5px;border-radius:999px;background:rgba(255,255,255,.18)}
.atr-feuille h2{margin:0;padding:0 18px;font-family:Poppins,system-ui,sans-serif;font-size:16px;font-weight:800}
.atr-derniers{display:flex;gap:10px;padding:0 18px;overflow-x:auto;scrollbar-width:none}
.atr-dernier{flex:none;display:flex;flex-direction:column;gap:4px;width:96px}
.atr-dernier .atr-vignette{width:96px;height:124px}
.atr-dernier .atr-vignette img{height:100px}
.atr-dernier small{font-size:11.5px;color:#CBB9C3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.atr-vide{margin:0;padding:0 18px;font-size:14px;color:#CBB9C3}
.atr-invite{display:flex;flex-direction:column;align-items:flex-start;gap:12px}
.atr-invite .atr-poser{margin-left:18px}
.atr-vignette{position:relative;display:block;width:112px;height:148px;padding:0;border:0;border-radius:14px;overflow:hidden;background:radial-gradient(120% 90% at 30% 15%,#FF64B9,#FF2E9A 50%,#C9177A);cursor:pointer}
.atr-vignette img{position:absolute;left:50%;bottom:-6px;height:118px;transform:translateX(-50%)}
.atr-vignette span{position:absolute;left:6px;right:6px;top:7px;font:900 11px/1 Poppins,system-ui,sans-serif;text-transform:uppercase;color:#fff;text-align:left;text-shadow:0 1.5px 0 #12060F,1.5px 0 0 #12060F,-1.5px 0 0 #12060F,0 -1.5px 0 #12060F,0 3px 0 #12060F;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.atr-vignette.petit{width:98px;height:132px}
.atr-vignette.petit img{height:104px}
.atr-vignette.pris{box-shadow:0 0 0 3px #0E0A10,0 0 0 5px #FF2E9A}
.atr-plein{position:fixed;inset:0;z-index:40;overflow-y:auto;box-sizing:border-box;padding:calc(56px + env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom));background:radial-gradient(90% 40% at 50% 45%,rgba(255,46,154,.18),transparent 70%),#0E0A10;color:#fff;animation:atr-entre .25s cubic-bezier(.2,.9,.3,1)}
.atr-fermer{display:grid;place-items:center;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.1);color:#fff;font-size:22px;line-height:1;cursor:pointer}
.atr-plein>.atr-fermer{position:absolute;z-index:3;left:16px;top:calc(12px + env(safe-area-inset-top))}
.atr-lieu header{display:flex;flex-direction:column;gap:4px}
.atr-type{align-self:flex-start;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-size:12px;font-weight:600}
.atr-lieu h2{margin:0;font:800 30px/1.05 Poppins,system-ui,sans-serif;letter-spacing:-.03em}
.atr-dist{font-size:14px;color:#CBB9C3}
.atr-compte{font:700 14px Poppins,system-ui,sans-serif}
.atr-compte em{font-style:normal;color:#FF2E9A}
.atr-eventail{position:relative;display:block;width:100%;height:300px;margin-top:14px;padding:0;border:0;background:none;cursor:pointer}
.atr-eventail>span{position:absolute;left:50%;top:0;width:200px;height:266px;margin-left:-100px;border-radius:20px;overflow:hidden;background:radial-gradient(120% 90% at 30% 15%,#FF64B9,#FF2E9A 50%,#C9177A);box-shadow:0 20px 36px -14px rgba(0,0,0,.95)}
.atr-eventail>span img{position:absolute;left:50%;bottom:-8px;height:205px;transform:translateX(-50%)}
.atr-eventail>span em{position:absolute;left:12px;right:12px;top:12px;font:900 19px/.96 Poppins,system-ui,sans-serif;font-style:normal;text-transform:uppercase;color:#fff;text-align:left;text-shadow:0 2px 0 #12060F,2px 0 0 #12060F,-2px 0 0 #12060F,0 -2px 0 #12060F,0 4px 0 #12060F}
.atr-carte-0{z-index:3}
.atr-carte-1{z-index:2;transform:translateX(-70px) rotate(-9deg) scale(.9)}
.atr-carte-2{z-index:1;transform:translateX(70px) rotate(9deg) scale(.9)}
.atr-decouvrir{display:block;margin:6px auto 0;height:48px;padding:0 22px;border:0;border-radius:999px;background:#fff;color:#16101A;font:800 15.5px Poppins,system-ui,sans-serif;cursor:pointer}
.atr-conv{display:flex;flex-direction:column;gap:2px;width:100%;margin-top:14px;padding:10px 14px;border:0;border-radius:16px;background:rgba(255,255,255,.06);color:#fff;font:inherit;text-align:left;cursor:pointer}
.atr-conv small{color:#CBB9C3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.atr-bas{position:fixed;left:0;right:0;bottom:0;z-index:41;display:flex;flex-direction:column;gap:10px;padding:14px 16px calc(24px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(14,10,16,0),#0E0A10 30%)}
.atr-rose{height:56px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:800 18px Poppins,system-ui,sans-serif;box-shadow:0 12px 28px -8px rgba(255,46,154,.85);cursor:pointer}
.atr-rose:disabled{opacity:.6}
.atr-blanc{height:50px;border:0;border-radius:999px;background:#fff;color:#16101A;font:800 16px Poppins,system-ui,sans-serif;cursor:pointer}
.atr-lien{padding:8px;border:0;background:none;color:#CBB9C3;font:600 14.5px inherit;text-decoration:underline;cursor:pointer}
.atr-swipe{padding:calc(12px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));overflow:hidden}
.atr-swipe-haut{display:flex;align-items:center;gap:10px}
.atr-progres{position:relative;flex:1;height:4px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden}
.atr-progres i{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:#FF2E9A;transition:width .3s}
.atr-num{font:700 12.5px Poppins,system-ui,sans-serif;color:#CBB9C3}
.atr-pile{position:relative;width:100%;max-width:360px;height:min(64dvh,520px);margin:14px auto 0}
.atr-mcarte{position:absolute;inset:0;border-radius:26px;overflow:hidden;background:radial-gradient(120% 90% at 30% 15%,#FF64B9,#FF2E9A 50%,#C9177A);box-shadow:0 26px 50px -16px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.14);touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab}
.atr-mcarte.dessous{box-shadow:0 20px 40px -16px rgba(0,0,0,.9)}
.atr-mcarte video,.atr-mcarte>img{width:100%;height:100%;object-fit:cover;pointer-events:none}
.atr-tampon{position:absolute;top:120px;padding:4px 14px;border-radius:12px;background:rgba(255,255,255,.92);font:900 30px Poppins,system-ui,sans-serif;pointer-events:none}
.atr-tampon.aime{left:20px;border:4px solid #FF2E9A;color:#FF2E9A;transform:rotate(-14deg)}
.atr-tampon.passe{right:20px;border:4px solid #16101A;color:#16101A;transform:rotate(14deg)}
.atr-reponse-a{position:absolute;left:12px;top:12px;padding:5px 11px;border-radius:999px;background:rgba(18,6,15,.78);font-size:12.5px;font-weight:600}
.atr-bande{position:absolute;left:10px;right:10px;bottom:10px;display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;border-radius:18px;background:rgba(255,255,255,.96);color:#16101A}
.atr-avatar{flex:none;width:40px;height:40px;padding:0;border:0;border-radius:50%;overflow:hidden;background:#FF2E9A;cursor:pointer}
.atr-avatar img{width:100%;height:100%;object-fit:cover;object-position:50% 15%}
.atr-qui{display:flex;flex-direction:column;flex:1;min-width:0}
.atr-qui b{font:800 14px Poppins,system-ui,sans-serif}
.atr-qui small{font:500 12px Geist,system-ui,sans-serif;color:#6B5A64}
.atr-qui span{font-size:13px;color:#3D2F37;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.atr-chiffres{display:flex;flex-direction:column;align-items:flex-end;font-size:12.5px;font-weight:700}
.atr-boutons{display:flex;justify-content:center;align-items:flex-start;gap:14px;margin-top:18px}
.atr-boutons>span{display:flex;flex-direction:column;align-items:center;gap:6px;width:76px;text-align:center}
.atr-boutons small{font-size:12px;line-height:1.2;font-weight:700;color:#CBB9C3}
.atr-rond{display:grid;place-items:center;width:60px;height:60px;border:0;border-radius:50%;background:#241A27;color:#fff;font-size:24px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);cursor:pointer}
.atr-rond.aime{width:74px;height:74px;margin-top:-7px;background:#FF2E9A;font-size:32px;box-shadow:0 14px 30px -8px rgba(255,46,154,.95)}
.atr-rond.repondre{background:#fff;color:#16101A;box-shadow:0 0 0 3px #FFE14D}
.atr-rond.petit{width:48px;height:48px;margin-top:6px;font-size:20px}
.atr-aide{margin:12px 0 0;text-align:center;font-size:12.5px;color:#9C8795}
.atr-toast{position:fixed;left:50%;bottom:150px;z-index:45;margin:0;padding:10px 16px;border-radius:999px;background:#fff;color:#16101A;font-size:13.5px;font-weight:700;transform:translateX(-50%);white-space:nowrap}
.atr-fin{display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:120px;text-align:center}
.atr-fin b{font:800 22px Poppins,system-ui,sans-serif}
.atr-titre{display:flex;align-items:center;gap:10px;margin:-44px 0 6px}
.atr-titre h2{margin:0;font:800 20px Poppins,system-ui,sans-serif}
.atr-deposer h3{margin:18px 0 8px;font:800 13px Poppins,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#FF7AC0}
.atr-deposer h3 small{font:500 12px Geist,system-ui,sans-serif;text-transform:none;letter-spacing:0;color:#9C8795}
.atr-lieux{display:flex;flex-direction:column;gap:8px}
.atr-choix{display:block;width:100%;margin:0;padding:12px 14px;border:0;border-radius:14px;background:#1D1520;color:#fff;font:700 15px Poppins,system-ui,sans-serif;text-align:left;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);cursor:pointer}
.atr-choix small{font:500 12.5px Geist,system-ui,sans-serif;color:#9C8795}
.atr-choix.pris{background:rgba(255,46,154,.14);box-shadow:inset 0 0 0 2px #FF2E9A}
.atr-ailleurs{margin-top:8px;height:40px;padding:0 14px;border:0;border-radius:999px;background:none;color:#FFE14D;font:700 13.5px Poppins,system-ui,sans-serif;box-shadow:inset 0 0 0 1px rgba(255,225,77,.55);cursor:pointer}
.atr-ailleurs.pris{background:rgba(255,225,77,.16)}
.atr-champ{width:100%;box-sizing:border-box;height:48px;margin-top:8px;padding:0 14px;border:0;border-radius:14px;background:#1D1520;color:#fff;font:inherit;font-size:15px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);outline:none}
.atr-note{margin:8px 0 0;font-size:12.5px;line-height:1.4;color:#9C8795}
.atr-miens{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.atr-nouveau{flex:none;width:98px;height:132px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:2px dashed rgba(255,46,154,.7);border-radius:14px;background:rgba(255,46,154,.08);color:#FF7AC0;font:800 12.5px Poppins,system-ui,sans-serif;cursor:pointer}
.atr-nouveau small{font-size:11px;font-weight:600;opacity:.85}
.atr-qui-voit{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:4px;border-radius:14px;background:#1D1520}
.atr-qui-voit button{height:40px;border:0;border-radius:11px;background:none;color:#CBB9C3;font:800 13px Poppins,system-ui,sans-serif;cursor:pointer}
.atr-qui-voit button.pris{background:#fff;color:#16101A}
.atr-erreur{margin:10px 0 0;padding:10px 12px;border-radius:12px;background:rgba(255,46,154,.14);color:#FFC8E6;font-size:13.5px}
.atr-publie{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding-top:calc(120px + env(safe-area-inset-top))}
.atr-pin{display:grid;place-items:center;width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#FF64B9,#FF2E9A);font-size:44px;box-shadow:0 18px 36px -10px rgba(255,46,154,.95)}
.atr-publie h2{margin:10px 0 0;font:800 32px Poppins,system-ui,sans-serif}
.atr-publie p{margin:0;max-width:320px;color:#CBB9C3}
.atr-heros{position:relative;display:flex;flex-direction:column;justify-content:flex-end;height:300px;margin:-56px -16px 0;padding:0 20px 18px;overflow:hidden;background:radial-gradient(110% 80% at 70% 30%,#FF64B9,#FF2E9A 45%,#B3126C)}
.atr-heros img{position:absolute;right:0;bottom:-10px;height:270px}
.atr-heros h2{position:relative;margin:0;font:800 34px Poppins,system-ui,sans-serif;text-shadow:0 2px 12px rgba(0,0,0,.4)}
.atr-heros span{position:relative;font-size:14px;font-weight:600}
.atr-profil h3{margin:18px 0 8px;font:800 15px Poppins,system-ui,sans-serif}
.atr-puces{display:flex;flex-wrap:wrap;gap:8px}
.atr-puces button{height:36px;padding:0 12px;border:0;border-radius:999px;background:#1D1520;color:#fff;font:600 13px inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);cursor:pointer}
.atr-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.atr-grille .atr-vignette{width:100%}
@keyframes atr-entre{from{opacity:0;transform:translateY(14px)}}
`;
