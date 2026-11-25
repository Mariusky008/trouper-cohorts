"use client";

/**
 * 📍 « AUTOUR DE MOI » — l'onglet « Autour » : JE POSE MA FIGURINE DANS LA VILLE (22 novembre 2026 ; `docs/univers/autour.md` ;
 * la maquette validée : « Autour — la maquette » ; le serveur : `lib/direct/autour-serveur.ts`, section « la figurine
 * posée »).
 *
 * Le propriétaire : « Autour doit changer : ce n'est plus un mème, mais ma figurine que je dépose ». Validé, avec : 24 h
 * et « Retirer » à tout moment ; le mot du jour mis en avant (« Qui vient prendre un café ? ») ; des lieux choisis ou des
 * zones larges, jamais un point précis ; « Répondre avec ma figurine », la signature de ClikMe.
 *
 *   · LA CARTE (`autour-carte.tsx`) : les lieux (les têtes des figurines posées aujourd'hui, leur nombre), les zones
 *     « Ailleurs » (floues), « Ma position », « ＋ Poser ma figurine », et « Posées autour de toi aujourd'hui ». Sans
 *     carte (pas de réseau, pas de WebGL) : la liste des lieux.
 *   · UN LIEU : les figurines posées là aujourd'hui, assises, chacune avec sa bulle (son mot du jour) ; une réponse
 *     s'assoit à côté de la sienne ; « Poser la mienne ici ».
 *   · POSER MA FIGURINE (un seul écran) : où (un lieu de la liste, ou « Ailleurs » : une zone large, jamais ma position
 *     exacte), quelle tête (mon humeur du jour, ou une de mes expressions), mon mot du jour (des idées proposées), qui la
 *     voit. Elle reste 24 heures.
 *   · SA FICHE : son mot, « Répondre avec ma figurine », « 🏠 Voir sa maison », « 👯 L'ajouter en proche », signaler ; la
 *     mienne : « Retirer ma figurine ».
 */
import { jouerBonjour, useBoucheDuBonjour } from "./bonjour";
import { PHRASES_BONJOUR } from "@/lib/direct/bonjour";
import { Pancarte } from "./pancarte";
import { Ornements } from "./ornements";
import type { Ornements as OrnementsVus } from "@/lib/direct/ornements";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { OngletVisible } from "./guide";
import { ApercuOu, CarteAutour, STYLES_CARTE_AUTOUR } from "./autour-carte";
import { IDEES_MOT_DU_JOUR, MOT_DU_JOUR_MAX, NOM_LIEU_MAX, QUIS, distance, enMetres, estZone, lieuIdValide, nomLieuPropre, zoneDe, type Endroit, type FigurinePosee, type Lieu, type MesTetes, type Qui, type TeteChoisie } from "@/lib/direct/autour";
import { REFUS_AGE } from "@/lib/direct/ma-figurine";
import { demanderSonAge } from "./age";
import { demanderOui } from "./fenetre";

type Vue = { t: "carte" } | { t: "lieu"; id: string } | { t: "poser"; lieu?: string; reponseA?: FigurinePosee; endroit?: Endroit } | { t: "fiche"; f: FigurinePosee; lieuNom: string };
type Carte = { ville: string; lieux: Lieu[]; derniers: FigurinePosee[]; compte: boolean };
type Pos = { lat: number; lng: number };

const ROUTE = "/api/direct/autour";
const poster = async (corps: unknown) => {
  const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  return { ok: r.ok, ...((await r.json().catch(() => ({}))) as { error?: string; lieu?: string; id?: string; age?: boolean; proche?: boolean }) };
};
/** « il y a 2 h », « à l'instant ». */
function quand(le: string): string {
  const s = (Date.now() - Date.parse(le)) / 1000;
  if (!Number.isFinite(s) || s < 90) return "à l’instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  return `il y a ${Math.round(s / 3600)} h`;
}
/** « encore 22 h », « encore 40 min ». */
function reste(fin: string): string {
  const s = (Date.parse(fin) - Date.now()) / 1000;
  if (!Number.isFinite(s) || s <= 0) return "elle s’en va";
  return s < 3600 ? `encore ${Math.max(1, Math.round(s / 60))} min` : `encore ${Math.round(s / 3600)} h`;
}
/** « demain, 14 h 05 ». */
const jusqua = (fin: string) => `demain, ${new Date(fin).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ")}`;
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

/** 🔎 Les endroits de la ville qui répondent à `texte` (la gare, une rue…), près de `pres` — après une courte pause. */
function useEndroits(texte: string, pres: Pos | null): Endroit[] {
  const [r, setR] = useState<{ q: string; endroits: Endroit[] }>({ q: "", endroits: [] });
  const t = texte.trim();
  useEffect(() => {
    if (t.length < 3) return;
    let fini = false;
    const attente = window.setTimeout(() => {
      void fetch(`${ROUTE}?chercher=${encodeURIComponent(t)}${pres ? `&lat=${pres.lat}&lng=${pres.lng}` : ""}`, { cache: "no-store" })
        .then((x) => (x.ok ? x.json() : null))
        .then((j: { endroits?: Endroit[] } | null) => !fini && setR({ q: t, endroits: j?.endroits ?? [] }))
        .catch(() => undefined);
    }, 350);
    return () => {
      fini = true;
      window.clearTimeout(attente);
    };
  }, [t, pres]);
  return t.length >= 3 && r.q === t ? r.endroits : [];
}
/** Le centre de ses lieux (sinon Dax) : là où la recherche se penche. */
const centreDe = (lieux: Lieu[]): Pos => (lieux.length ? { lat: lieux.reduce((a, l) => a + l.lat, 0) / lieux.length, lng: lieux.reduce((a, l) => a + l.lng, 0) / lieux.length } : { lat: 43.7102, lng: -1.0538 });
/** Le petit nom d'une zone, d'après un endroit cherché (« Gare de Dax » → « Gare de Dax », sans numéro). */
const nomDeZone = (nom: string) => nomLieuPropre(nom).nom ?? "";

/** 🧍 Une figurine assise : son corps sans sa tête, puis la tête qu'elle fait — ou sa figurine d'une seule image. */
/** (🪧 « Ma figurine », 25 novembre 2026 : `f.pancarte`, la phrase qu'elle porte partout, au-dessus de sa tête) */
export function FigurineAssise({ f, hauteur, bonjour }: { f: Pick<FigurinePosee, "tete" | "corps" | "image" | "parle"> & { pancarte?: string; ornements?: OrnementsVus }; hauteur: number; /** 🗣️ son bonjour : sa bouche le suit */ bonjour?: string }) {
  const bouche = useBoucheDuBonjour(f.corps && f.parle ? bonjour : null);
  // (🔥🎧❤️ « Elle change toute seule » : ce qu'elle porte, par-dessus ; les étiquettes quand elle est assez grande)
  const orn = f.ornements ? <Ornements o={f.corps ? { ...f.ornements, boite: f.corps.boite } : { ...f.ornements, boite: undefined }} taille={Math.max(9, Math.min(12, hauteur / 16))} etiquettes={hauteur >= 120} /> : null;
  const pancarte = f.pancarte ? <Pancarte texte={f.pancarte} taille={Math.max(9, Math.min(15, hauteur / 11))} bas={f.corps ? `${(1 - f.corps.boite[1]) * 100 + 2}%` : "92%"} /> : null;
  if (f.corps)
    return (
      <span className="afg-assise" style={{ height: hauteur, width: Math.round(hauteur * f.corps.ratio) }} data-assise="calques">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={f.corps.src} alt="" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="afg-tete" src={f.tete} alt="" draggable={false} style={{ left: `${f.corps.boite[0] * 100}%`, top: `${f.corps.boite[1] * 100}%`, width: `${f.corps.boite[2] * 100}%`, height: `${f.corps.boite[3] * 100}%`, ...(bouche ? { visibility: "hidden" } : {}) }} />
        {/* (🗣️ sa tête « bouche ouverte », chargée d'avance : elle passe devant quand sa voix est forte) */}
        {f.parle && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="afg-tete" src={f.parle} alt="" draggable={false} data-tete-parle={bouche ? "1" : undefined} style={{ left: `${f.corps.boite[0] * 100}%`, top: `${f.corps.boite[1] * 100}%`, width: `${f.corps.boite[2] * 100}%`, height: `${f.corps.boite[3] * 100}%`, ...(bouche ? {} : { visibility: "hidden" }) }} />
        )}
        {orn}
        {pancarte}
      </span>
    );
  if (f.image)
    return (
      <span className="afg-assise" style={{ height: hauteur }} data-assise="image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={f.image} alt="" draggable={false} style={{ height: "100%", width: "auto", position: "static" }} />
        {orn}
        {pancarte}
      </span>
    );
  return <span className="afg-assise vide" style={{ height: hauteur, width: Math.round(hauteur * 0.6) }} aria-hidden="true" />;
}
/** Sa tête dans un rond (la feuille du bas, ses têtes à choisir). */
function TeteRonde({ src, taille = 44 }: { src: string; taille?: number }) {
  return (
    <span className="afg-rond" style={{ width: taille, height: taille }} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" draggable={false} /> : null}
    </span>
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
  const [toast, setToast] = useState("");
  // 🔎 un endroit cherché (la gare…) : la carte y vole ; « ＋ Poser ma figurine ici »
  const [cible, setCible] = useState<(Endroit & { n: number }) | null>(null);

  useEffect(() => {
    if (!visible) return;
    let fini = false;
    void fetch(`${ROUTE}?figurines=1`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Carte | null) => !fini && j && setCarte(j))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [visible, version]);
  // ↩️ LA NOTIFICATION « LÉA S'EST ASSISE À CÔTÉ DE TOI » : `?autour=<lieu>` ouvre le lieu
  useEffect(() => {
    if (!visible) return;
    void Promise.resolve().then(() => {
      const u = new URL(window.location.href);
      const lieu = u.searchParams.get("autour") ?? "";
      if (!lieu) return;
      for (const k of ["autour", "pose", "meme"]) u.searchParams.delete(k);
      window.history.replaceState(window.history.state, "", u.toString());
      if (lieuIdValide(lieu)) setVue({ t: "lieu", id: lieu });
    });
  }, [visible]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const ouvrirLieu = useCallback((id: string) => setVue({ t: "lieu", id }), []);
  const tomber = useCallback(() => setPanne(true), []);
  const lieux = useMemo(() => carte?.lieux ?? [], [carte]);
  const avecFigurines = lieux.filter((l) => l.n > 0);
  const trouves = cherche.trim() ? lieux.filter((l) => l.nom.toLowerCase().includes(cherche.trim().toLowerCase())).slice(0, 5) : [];
  const centre = useMemo(() => centreDe(lieux), [lieux]);
  const endroits = useEndroits(cherche, moi ?? centre);
  const allerA_endroit = (e: Endroit) => {
    setCible({ ...e, n: Date.now() });
    setCherche("");
    (document.activeElement as HTMLElement | null)?.blur?.();
  };
  const ou = carte?.ville ? `à ${carte.ville.charAt(0).toUpperCase()}${carte.ville.slice(1)}` : "dans ta ville";
  const sansVille = Boolean(carte && !carte.ville);
  const retour = () => {
    setVue({ t: "carte" });
    setVersion((v) => v + 1);
  };
  const nomDuLieu = (id: string, f?: FigurinePosee) => lieux.find((l) => l.id === id)?.nom ?? f?.nomLieu ?? "Quelque part par ici";

  return (
    <div className="atr">
      {/* 🗺️ LA CARTE (toujours là, sous les autres vues) */}
      <div className="atr-carte-fond">
        {!panne && <CarteAutour lieux={lieux} moi={moi} recentrer={recentrer} cible={cible} onLieu={ouvrirLieu} onPanne={tomber} />}
      </div>
      <div className="atr-haut">
        <h1>Autour de moi</h1>
        <p>Les figurines posées aujourd’hui, {ou}</p>
        <label className="atr-recherche">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            enterKeyHint="search"
            value={cherche}
            onChange={(e) => setCherche(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (trouves[0]) ouvrirLieu(trouves[0].id);
              else if (endroits[0]) allerA_endroit(endroits[0]);
            }}
            placeholder="Un lieu, une rue, la gare…"
            aria-label="Chercher un lieu"
          />
        </label>
        {(trouves.length > 0 || endroits.length > 0) && (
          <div className="atr-trouves">
            {trouves.length > 0 && (
              <>
                <small className="atr-trouves-titre">Sur ClikMe</small>
                <ul>
                  {trouves.map((l) => (
                    <li key={l.id}>
                      <button type="button" onClick={() => ouvrirLieu(l.id)}>
                        {l.emoji} {l.nom} <small>{l.n ? `${l.n} figurine${l.n > 1 ? "s" : ""}` : "personne aujourd’hui"}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {endroits.length > 0 && (
              <>
                <small className="atr-trouves-titre">Sur la carte</small>
                <ul>
                  {endroits.map((e) => (
                    <li key={`${e.lat},${e.lng}`}>
                      <button type="button" className="atr-endroit" onClick={() => allerA_endroit(e)}>
                        📍 {e.nom} {e.detail && <small>{e.detail}</small>}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {panne && (
        <section className="atr-liste" aria-label="Les lieux">
          <p className="atr-panne">La carte ne s’est pas chargée : voici les lieux.</p>
          {(avecFigurines.length ? avecFigurines : lieux).map((l) => (
            <button key={l.id} type="button" className="atr-ligne" onClick={() => ouvrirLieu(l.id)}>
              <span className="atr-ligne-ico">{l.emoji}</span>
              <span>
                <b>{l.nom}</b>
                <small>
                  {l.n ? `${l.n} figurine${l.n > 1 ? "s" : ""}` : "personne aujourd’hui"}
                  {moi && !estZone(l.id) ? ` · ${enMetres(distance(moi, l))}` : ""}
                </small>
              </span>
            </button>
          ))}
        </section>
      )}

      {/* 🔎 L'ENDROIT CHERCHÉ : la carte y est ; on peut y poser sa figurine (une zone large, jamais l'endroit exact) */}
      {cible ? (
        <div className="atr-cible" role="status">
          <span>
            <b>📍 {cible.nom}</b>
            {cible.detail && <small>{cible.detail}</small>}
          </span>
          <button type="button" className="atr-cible-deposer" onClick={() => setVue({ t: "poser", endroit: cible })}>
            ＋ Poser ici
          </button>
          <button type="button" className="atr-cible-fermer" aria-label="Fermer" onClick={() => setCible(null)}>
            ✕
          </button>
        </div>
      ) : (
        <div className="atr-actions">
          <button type="button" className="atr-poser" data-poser onClick={() => setVue({ t: "poser" })}>
            ＋ Poser ma figurine
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
      )}

      <section className="atr-feuille" aria-label="Posées autour de toi aujourd’hui">
        <i aria-hidden="true" />
        <h2>Posées autour de toi aujourd’hui</h2>
        {sansVille ? (
          <div className="atr-invite">
            <p className="atr-vide">Crée ta figurine : tu verras celles posées dans ta ville, et tu pourras poser la tienne.</p>
            <button type="button" className="atr-poser" onClick={() => allerA("figurine")}>
              🎭 Créer ma figurine
            </button>
          </div>
        ) : carte && carte.derniers.length === 0 ? (
          <p className="atr-vide">Personne n’a encore posé sa figurine par ici aujourd’hui. Sois la première !</p>
        ) : (
          <div className="afg-derniers">
            {(carte?.derniers ?? []).map((f) => (
              <button key={f.id} type="button" className="afg-carte" data-derniere={f.id} onClick={() => ouvrirLieu(f.lieu)}>
                <span className="afg-carte-haut">
                  <TeteRonde src={f.tete} />
                  <span>
                    <b>{f.moi ? "Toi" : f.prenom}</b>
                    <small>
                      {nomDuLieu(f.lieu, f)} · {quand(f.le)}
                    </small>
                  </span>
                </span>
                <span className="afg-carte-mot">« {f.mot} »</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {toast && (
        <p className="afg-toast" role="status" data-toast>
          {toast}
        </p>
      )}

      {/* LES VUES EN PLEIN ÉCRAN (le menu du bas disparaît dessous) */}
      {vue.t === "lieu" && (
        <VueLieu
          key={`${vue.id}-${version}`}
          id={vue.id}
          ville={carte?.ville ?? ""}
          onFermer={retour}
          onPoser={() => setVue({ t: "poser", lieu: vue.id })}
          onFiche={(f, lieuNom) => setVue({ t: "fiche", f, lieuNom })}
        />
      )}
      {vue.t === "poser" && (
        <Poser
          lieuDonne={vue.lieu}
          reponseA={vue.reponseA}
          endroitDonne={vue.endroit}
          lieux={lieux}
          compte={Boolean(carte?.compte)}
          allerA={allerA}
          onFermer={() => (vue.lieu ? setVue({ t: "lieu", id: vue.lieu }) : retour())}
          onPose={(lieu, fin) => {
            setCible(null);
            setVersion((v) => v + 1);
            setVue({ t: "lieu", id: lieu });
            setToast(`C’est posé : elle reste jusqu’à ${jusqua(fin)}.`);
          }}
        />
      )}
      {vue.t === "fiche" && (
        <Fiche
          f={vue.f}
          lieuNom={vue.lieuNom}
          compte={Boolean(carte?.compte)}
          onFermer={() => setVue({ t: "lieu", id: vue.f.lieu })}
          onRepondre={() => setVue({ t: "poser", lieu: vue.f.lieu, reponseA: vue.f })}
          onRetiree={() => {
            setVersion((v) => v + 1);
            setVue({ t: "lieu", id: vue.f.lieu });
            setToast("Ta figurine est retirée.");
          }}
          onSignalee={() => {
            setVersion((v) => v + 1);
            setVue({ t: "lieu", id: vue.f.lieu });
            setToast("Merci : tu ne la verras plus.");
          }}
        />
      )}
    </div>
  );
}

// ─── 📍 UN LIEU : les figurines posées là aujourd'hui, assises, chacune avec son mot ─────────────────────────────────
function VueLieu({ id, ville, onFermer, onPoser, onFiche }: { id: string; ville: string; onFermer: () => void; onPoser: () => void; onFiche: (f: FigurinePosee, lieuNom: string) => void }) {
  const [r, setR] = useState<{ lieu: Lieu | null; figurines: FigurinePosee[] } | null>(null);
  useEffect(() => {
    let fini = false;
    void fetch(`${ROUTE}?figurines=1&lieu=${encodeURIComponent(id)}${ville ? `&ville=${encodeURIComponent(ville)}` : ""}`, { cache: "no-store" })
      .then((x) => (x.ok ? x.json() : { lieu: null, figurines: [] }))
      .then((j: { lieu: Lieu | null; figurines: FigurinePosee[] }) => !fini && setR({ lieu: j.lieu ?? null, figurines: j.figurines ?? [] }))
      .catch(() => !fini && setR({ lieu: null, figurines: [] }));
    return () => {
      fini = true;
    };
  }, [id, ville]);
  const lieu = r?.lieu;
  const figs = r?.figurines ?? [];
  const mienne = figs.find((f) => f.moi);
  const nom = lieu?.nom ?? "Ce lieu";
  return (
    <div className="atr-plein afg-lieu" data-lieu-ouvert={id}>
      <button type="button" className="atr-fermer" aria-label="Retour à la carte" onClick={onFermer}>
        ‹
      </button>
      <header className="afg-lieu-haut" style={lieu?.photo ? { backgroundImage: `linear-gradient(rgba(14,10,16,.25),#0E0A10), url(${JSON.stringify(lieu.photo)})` } : undefined}>
        <h2>
          <span aria-hidden="true">{lieu?.emoji ?? "📍"}</span> {nom}
        </h2>
        <p>{r === null ? "…" : figs.length ? `${figs.length} figurine${figs.length > 1 ? "s" : ""} posée${figs.length > 1 ? "s" : ""} aujourd’hui` : "Personne n’est posé ici aujourd’hui"}</p>
      </header>
      {r !== null && figs.length === 0 && <p className="atr-vide afg-vide">Sois la première figurine : pose la tienne, avec ton mot du jour.</p>}
      <div className="afg-scene" data-figurines={figs.length}>
        {figs.map((f) => {
          const aCote = f.reponseA ? figs.find((o) => o.id === f.reponseA) : undefined;
          return (
            <button key={f.id} type="button" className={`afg-fig${f.moi ? " moi" : ""}${aCote ? " a-cote" : ""}`} data-fig={f.id} data-moi={f.moi ? "1" : undefined} aria-label={`${f.moi ? "Ta figurine" : f.prenom} : ${f.mot}`} onClick={() => {
                // (🎙️ « Ma figurine », lot 4 : on touche sa figurine, on entend son bonjour)
                if (!f.moi) jouerBonjour(f.bonjour);
                onFiche(f, nom);
              }}>
              <span className="afg-bulle">{f.mot}</span>
              <FigurineAssise f={f} hauteur={120} bonjour={f.moi ? undefined : f.bonjour} />
              <small className="afg-prenom">{f.moi ? "Toi" : f.prenom}</small>
              {aCote && <small className="afg-a-cote">↳ à côté de {aCote.moi ? "toi" : aCote.prenom}</small>}
            </button>
          );
        })}
      </div>
      <div className="afg-bas">
        {mienne && (
          <p className="afg-mienne" data-mienne>
            Ta figurine est ici · {reste(mienne.fin)}
          </p>
        )}
        <button type="button" className="atr-poser afg-poser-ici" data-poser-ici onClick={onPoser}>
          {mienne ? "Changer mon mot du jour" : "Poser la mienne ici"}
        </button>
      </div>
    </div>
  );
}

// ─── 🧍 POSER MA FIGURINE : où, quelle tête, mon mot du jour, qui la voit ────────────────────────────────────────────
function Poser({
  lieuDonne,
  reponseA,
  endroitDonne,
  lieux,
  compte,
  allerA,
  onFermer,
  onPose,
}: {
  lieuDonne?: string;
  reponseA?: FigurinePosee;
  endroitDonne?: Endroit;
  lieux: Lieu[];
  compte: boolean;
  allerA: (o: string) => void;
  onFermer: () => void;
  onPose: (lieu: string, fin: string) => void;
}) {
  const [tetes, setTetes] = useState<MesTetes | null>(null);
  const [lieu, setLieu] = useState(lieuDonne ?? "");
  const [ailleurs, setAilleurs] = useState(Boolean(endroitDonne));
  const [ici, setIci] = useState<Pos | null>(endroitDonne ? { lat: endroitDonne.lat, lng: endroitDonne.lng } : null);
  const [nomLieu, setNomLieu] = useState(endroitDonne ? nomDeZone(endroitDonne.nom) : "");
  const [tete, setTete] = useState<TeteChoisie>("humeur");
  const [mot, setMot] = useState("");
  const [qui, setQui] = useState<Qui>("tous");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);
  useEffect(() => {
    if (!compte) return;
    let fini = false;
    void fetch(`${ROUTE}?mesTetes=1`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { tetes?: MesTetes } | null) => {
        if (fini || !j?.tetes) return;
        setTetes(j.tetes);
        if (!j.tetes.humeur && j.tetes.tetes[0]) setTete(j.tetes.tetes[0].cle);
        // (🪧 « Ma figurine » : sa pancarte est son mot du jour — déjà écrit, s'il n'a encore rien tapé)
        const p = j.tetes.pancarte;
        if (p) setMot((m) => m || p);
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [compte]);
  const fixes = useMemo(() => {
    const l = lieux.filter((x) => !estZone(x.id));
    return ici ? [...l].sort((a, b) => distance(ici, a) - distance(ici, b)) : l;
  }, [lieux, ici]);
  const choisi = lieux.find((l) => l.id === lieu);
  const point = ailleurs && ici ? zoneDe(ici.lat, ici.lng) : choisi ? { lat: choisi.lat, lng: choisi.lng } : null;
  const srcTete = tete === "humeur" ? (tetes?.humeur?.src ?? tetes?.habituelle ?? "") : (tetes?.tetes.find((x) => x.cle === tete)?.src ?? tetes?.habituelle ?? "");
  const pret = Boolean(mot.trim() && (lieuDonne || lieu || (ailleurs && ici)));

  const choisirAilleurs = () => {
    setAilleurs(true);
    setLieu("");
    if (!ici)
      void position().then((p) => {
        if (p) setIci(p);
        else setErreur("Ton téléphone ne dit pas où tu es : choisis plutôt un lieu de la liste.");
      });
  };
  const poser = async () => {
    if (!pret || occupe) return;
    setOccupe(true);
    setErreur("");
    const envoyer = () =>
      poster({
        action: "poser",
        mot: mot.trim(),
        tete,
        qui,
        ...(reponseA ? { reponseA: reponseA.id } : {}),
        ...(lieuDonne ? { lieu: lieuDonne } : ailleurs && ici ? { ici, nomLieu } : { lieu }),
      });
    let r = await envoyer();
    // 🔞 il n'a pas encore déclaré son âge : une fois, puis la pose repart
    if (!r.ok && r.age) {
      if (!(await demanderSonAge())) {
        setOccupe(false);
        return setErreur(REFUS_AGE);
      }
      r = await envoyer();
    }
    setOccupe(false);
    if (!r.ok || !r.lieu) return setErreur(r.error || "Ça n’a pas marché. Réessaie.");
    onPose(r.lieu, new Date(Date.now() + 24 * 3600_000).toISOString());
  };

  if (!compte)
    return (
      <div className="atr-plein afg-poser" data-poser-ecran>
        <button type="button" className="atr-fermer" aria-label="Fermer" onClick={onFermer}>
          ✕
        </button>
        <h2 className="afg-titre">Poser ma figurine</h2>
        <p className="atr-vide">Il te faut d’abord ta figurine : c’est elle qu’on pose, avec ta vraie tête.</p>
        <button type="button" className="atr-poser" onClick={() => allerA("figurine")}>
          🎭 Créer ma figurine
        </button>
      </div>
    );
  return (
    <div className="atr-plein afg-poser" data-poser-ecran>
      <button type="button" className="atr-fermer" aria-label="Fermer" onClick={onFermer}>
        ✕
      </button>
      <h2 className="afg-titre">{reponseA ? "Répondre avec ma figurine" : "Poser ma figurine"}</h2>
      <p className="afg-sous">{reponseA ? `La tienne s’assoit à côté de celle de ${reponseA.prenom}, avec ton mot.` : "Elle reste 24 heures. Tu la retires quand tu veux."}</p>

      {/* l'aperçu : elle, sa tête, son mot */}
      <div className="afg-apercu" data-apercu>
        <span className="afg-bulle grande">{mot.trim() || "Ton mot du jour"}</span>
        {tetes && srcTete ? <TeteRonde src={srcTete} taille={96} /> : <span className="afg-rond" style={{ width: 96, height: 96 }} aria-hidden="true" />}
      </div>

      {/* 1. où */}
      <section className="afg-section">
        <h3>Où</h3>
        {lieuDonne ? (
          <p className="afg-lieu-donne" data-lieu-donne>
            {choisi?.emoji ?? "📍"} {choisi?.nom ?? reponseA?.nomLieu ?? "Ce lieu"}
            {reponseA ? ` · à côté de ${reponseA.prenom}` : ""}
          </p>
        ) : (
          <>
            <div className="afg-puces">
              {fixes.slice(0, 8).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={lieu === l.id && !ailleurs ? "pris" : ""}
                  aria-pressed={lieu === l.id && !ailleurs}
                  data-lieu-choix={l.id}
                  onClick={() => {
                    setLieu(l.id);
                    setAilleurs(false);
                  }}
                >
                  {l.emoji} {l.nom}
                  {ici ? <small> · {enMetres(distance(ici, l))}</small> : null}
                </button>
              ))}
              <button type="button" className={`zone${ailleurs ? " pris" : ""}`} aria-pressed={ailleurs} data-ailleurs onClick={choisirAilleurs}>
                ✨ Ailleurs, par ici
              </button>
            </div>
            {ailleurs && (
              <label className="afg-champ">
                <span>Un petit nom, si tu veux</span>
                <input value={nomLieu} maxLength={NOM_LIEU_MAX} onChange={(e) => setNomLieu(e.target.value)} placeholder="« Au bord de l’Adour », « Soirée chez Max »" data-champ="nom-lieu" />
              </label>
            )}
            <p className="afg-note">Jamais ta position exacte : un lieu de la liste, ou une zone large du quartier.</p>
            {point && <ApercuOu point={point} zone={ailleurs} />}
          </>
        )}
      </section>

      {/* 2. quelle tête */}
      <section className="afg-section">
        <h3>Quelle tête</h3>
        <div className="afg-tetes">
          {tetes?.humeur && (
            <button type="button" className={tete === "humeur" ? "pris" : ""} aria-pressed={tete === "humeur"} data-tete-choix="humeur" onClick={() => setTete("humeur")}>
              <TeteRonde src={tetes.humeur.src} taille={52} />
              <small>Mon humeur du jour</small>
            </button>
          )}
          {(tetes?.tetes ?? []).map((x) => (
            <button key={x.cle} type="button" className={tete === x.cle ? "pris" : ""} aria-pressed={tete === x.cle} data-tete-choix={x.cle} onClick={() => setTete(x.cle)}>
              <TeteRonde src={x.src} taille={52} />
              <small>{x.nom}</small>
            </button>
          ))}
          {tetes && !tetes.humeur && !tetes.tetes.length && (
            <div className="afg-tete-seule">
              {tetes.habituelle && <TeteRonde src={tetes.habituelle} taille={52} />}
              <p className="afg-note">Ta tête habituelle, pour l’instant : tes expressions arrivent bientôt.</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. le mot du jour : le cœur de la carte */}
      <section className="afg-section afg-mot">
        <h3>Ton mot du jour</h3>
        <p className="afg-note">Une humeur, une envie, une invitation : c’est lui qu’on lit en premier sur la carte.</p>
        <textarea value={mot} maxLength={MOT_DU_JOUR_MAX} rows={2} onChange={(e) => setMot(e.target.value)} placeholder="Qui vient prendre un café ?" aria-label="Ton mot du jour" data-champ="mot-du-jour" />
        <div className="afg-puces petites">
          {IDEES_MOT_DU_JOUR.map((t) => (
            <button key={t} type="button" data-idee onClick={() => setMot(t)}>
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* 4. qui la voit */}
      <section className="afg-section">
        <h3>Qui la voit</h3>
        <div className="afg-qui" role="group" aria-label="Qui la voit">
          {QUIS.map((q) => (
            <button key={q.cle} type="button" className={qui === q.cle ? "pris" : ""} aria-pressed={qui === q.cle} data-qui={q.cle} onClick={() => setQui(q.cle)}>
              {q.nom}
            </button>
          ))}
        </div>
      </section>

      {erreur && (
        <p className="afg-erreur" role="alert" data-erreur>
          {erreur}
        </p>
      )}
      <div className="afg-bas">
        <button type="button" className="atr-poser" data-envoyer-pose disabled={!pret || occupe} onClick={() => void poser()}>
          {reponseA ? "M’asseoir à côté" : "Poser ma figurine"}
        </button>
        <small className="afg-note">Trois figurines posées par jour au plus.</small>
      </div>
    </div>
  );
}

// ─── 👤 SA FICHE : son mot ; répondre avec ma figurine, voir sa maison, l'ajouter en proche ─────────────────────────
function Fiche({ f, lieuNom, compte, onFermer, onRepondre, onRetiree, onSignalee }: { f: FigurinePosee; lieuNom: string; compte: boolean; onFermer: () => void; onRepondre: () => void; onRetiree: () => void; onSignalee: () => void }) {
  const [proche, setProche] = useState<boolean | null>(null);
  const [occupe, setOccupe] = useState(false);
  useEffect(() => {
    if (f.moi) return;
    let fini = false;
    void fetch(`${ROUTE}?profil=${f.profil}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { profil?: { proche?: boolean } } | null) => !fini && setProche(Boolean(j?.profil?.proche)))
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [f.moi, f.profil]);
  const ajouter = async () => {
    setOccupe(true);
    const r = await poster({ action: "proche", profil: f.profil, oui: true });
    setOccupe(false);
    if (r.ok) setProche(true);
  };
  const retirer = async () => {
    if (!(await demanderOui({ emoji: "↩️", titre: "Retirer ta figurine ?", texte: "Elle quitte ce lieu tout de suite.", oui: "Retirer" }))) return;
    setOccupe(true);
    await poster({ action: "retirer-pose", id: f.id });
    setOccupe(false);
    onRetiree();
  };
  const signaler = async () => {
    if (!(await demanderOui({ emoji: "🚩", titre: "Signaler cette figurine ?", texte: "Tu ne la verras plus, le temps qu’on la regarde.", oui: "Signaler", danger: true }))) return;
    setOccupe(true);
    await poster({ action: "signaler-pose", lieu: f.lieu, id: f.id });
    setOccupe(false);
    onSignalee();
  };
  return (
    <div className="atr-plein afg-fiche" data-fiche={f.id}>
      <button type="button" className="atr-fermer" aria-label="Fermer" onClick={onFermer}>
        ‹
      </button>
      <div className="afg-fiche-haut">
        <span className="afg-bulle grande">{f.mot}</span>
        <FigurineAssise f={f} hauteur={170} bonjour={f.moi ? undefined : f.bonjour} />
        <h2>{f.moi ? "Ta figurine" : f.prenom}</h2>
        <p>
          Posée à {lieuNom} · {quand(f.le)} · {reste(f.fin)}
        </p>
        {!f.moi && f.bonjour && (
          <button type="button" className="afg-bonjour" onClick={() => jouerBonjour(f.bonjour)} data-bonjour-de={f.id}>
            {PHRASES_BONJOUR.entendre(f.prenom)}
          </button>
        )}
      </div>
      {f.moi ? (
        <div className="afg-actions">
          <button type="button" className="afg-secondaire" data-retirer disabled={occupe} onClick={() => void retirer()}>
            Retirer ma figurine
          </button>
        </div>
      ) : (
        <div className="afg-actions">
          {compte && (
            <button type="button" className="atr-poser" data-repondre onClick={onRepondre}>
              Répondre avec ma figurine
            </button>
          )}
          <p className="afg-note">La tienne s’assoit à côté de la sienne, avec ton mot.</p>
          <div className="afg-deux">
            <a className="afg-secondaire" href={`/univers/chez/${f.profil}`} data-voir-maison>
              🏠 Voir sa maison
            </a>
            {compte && (
              <button type="button" className="afg-secondaire" data-proche disabled={occupe || proche === true} onClick={() => void ajouter()}>
                {proche ? "👯 Déjà en proche" : "👯 L’ajouter en proche"}
              </button>
            )}
          </div>
          {compte && (
            <button type="button" className="afg-signaler" data-signaler disabled={occupe} onClick={() => void signaler()}>
              Signaler
            </button>
          )}
        </div>
      )}
    </div>
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
.atr-trouves{margin:6px 0 0;padding:4px 6px 6px;border-radius:14px;background:#1A121C;box-shadow:0 14px 30px -10px rgba(0,0,0,.9);max-height:min(50dvh,380px);overflow-y:auto}
.atr-trouves ul{margin:0;padding:0;list-style:none}
.atr-trouves-titre{display:block;padding:8px 10px 2px;font:800 11px Poppins,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#FF7AC0}
.atr-trouves button{width:100%;padding:10px;border:0;border-radius:10px;background:none;color:#fff;font:inherit;text-align:left;cursor:pointer}
.atr-trouves button:hover{background:rgba(255,255,255,.06)}
.atr-trouves small{color:#9C8795}
.atr-trouves .atr-endroit small{display:block;margin:1px 0 0 22px;font-size:12px}
.atr-cible{position:fixed;left:16px;right:16px;bottom:calc(334px + env(safe-area-inset-bottom));z-index:2;display:flex;align-items:center;gap:8px;padding:7px 7px 7px 14px;border-radius:20px;background:#fff;color:#16101A;box-shadow:0 16px 34px -10px rgba(0,0,0,.95);animation:atr-entre .25s cubic-bezier(.2,.9,.3,1)}
.atr-cible>span{display:flex;flex-direction:column;flex:1;min-width:0}
.atr-cible b{font:800 14.5px Poppins,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.atr-cible small{font-size:12px;color:#6B5A64;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.atr-cible-deposer{flex:none;height:44px;padding:0 16px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:800 14.5px Poppins,system-ui,sans-serif;box-shadow:0 10px 22px -8px rgba(255,46,154,.9);cursor:pointer}
.atr-cible-fermer{flex:none;width:32px;height:32px;padding:0;border:0;border-radius:50%;background:#F1E8ED;color:#16101A;font-size:14px;cursor:pointer}
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
.atr-lieu-tete{position:relative;display:flex;flex-direction:column;justify-content:flex-end;min-height:236px;box-sizing:border-box;margin:calc(-56px - env(safe-area-inset-top)) -16px 0;padding:calc(64px + env(safe-area-inset-top)) 16px 12px;overflow:hidden;background:radial-gradient(90% 80% at 80% 15%,rgba(255,46,154,.5),transparent 65%),#1A121C}
.atr-lieu-tete>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.atr-lieu-tete::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,10,16,.35),rgba(14,10,16,0) 30%,rgba(14,10,16,.7) 72%,#0E0A10)}
.atr-lieu-tete.photo{min-height:300px}
.atr-lieu-emoji{position:absolute;right:14px;top:calc(34px + env(safe-area-inset-top));font-size:104px;line-height:1;opacity:.85;transform:rotate(-8deg)}
.atr-lieu-tete header{position:relative;z-index:1}
.atr-lieu>.atr-fermer{background:rgba(14,10,16,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.atr-lieu header{display:flex;flex-direction:column;gap:4px}
.atr-type{align-self:flex-start;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-size:12px;font-weight:600}
.atr-lieu h2{margin:0;font:800 30px/1.05 Poppins,system-ui,sans-serif;letter-spacing:-.03em}
.atr-stats{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin-top:2px;font:700 14px Poppins,system-ui,sans-serif}
.atr-dist{font-size:14px;color:#CBB9C3}
.atr-compte{font:700 14px Poppins,system-ui,sans-serif}
.atr-compte em{font-style:normal;color:#FF2E9A}
.atr-auteurs{display:flex;align-items:center;gap:8px;margin-top:6px}
.atr-visages{display:flex;flex:none;padding-left:8px}
.atr-visages img{width:30px;height:30px;margin-left:-8px;border-radius:50%;object-fit:cover;object-position:50% 15%;background:#FF2E9A;box-shadow:0 0 0 2px #0E0A10}
.atr-auteurs small{font-size:12.5px;line-height:1.3;color:#E6D8E0}
.atr-une{display:block;width:100%;margin-top:16px;padding:0;border:0;background:none;color:#fff;text-align:left;cursor:pointer}
.atr-une-titre{display:block;margin:0 0 8px;font:800 12.5px Poppins,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:#FF7AC0}
.atr-une-carte{position:relative;display:block;width:100%;max-width:380px;height:min(56dvh,480px);margin:0 auto;border-radius:26px;overflow:hidden;background:radial-gradient(120% 90% at 30% 15%,#FF64B9,#FF2E9A 50%,#C9177A);box-shadow:0 26px 50px -16px rgba(0,0,0,.95),0 0 0 1px rgba(255,255,255,.14)}
.atr-une-carte video{width:100%;height:100%;object-fit:cover}
.atr-une-carte>img{width:100%;height:100%;object-fit:contain;object-position:50% 100%}
.atr-une-carte::after{content:"▶ Voir";position:absolute;right:12px;top:12px;padding:5px 12px;border-radius:999px;background:rgba(18,6,15,.78);font:800 12.5px Poppins,system-ui,sans-serif;color:#fff}
.atr-une-bas{position:absolute;left:10px;right:10px;bottom:10px;display:flex;flex-direction:column;gap:1px;padding:9px 13px;border-radius:18px;background:rgba(255,255,255,.96);color:#16101A}
.atr-une-bas b{font:800 15px Poppins,system-ui,sans-serif}
.atr-une-bas small{font-size:12.5px;color:#6B5A64}
.atr-une-bas em{font-style:normal;font-size:13px;color:#3D2F37;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.atr-decouvrir{display:block;width:100%;max-width:380px;margin:14px auto 0;height:52px;padding:0 22px;border:0;border-radius:999px;background:#fff;color:#16101A;font:800 16px Poppins,system-ui,sans-serif;box-shadow:0 12px 26px -12px rgba(255,255,255,.35);cursor:pointer}
.atr-sous{margin:24px 0 10px;font:800 17px Poppins,system-ui,sans-serif;letter-spacing:-.01em}
.atr-mur{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.atr-mur-carte{position:relative;display:block;aspect-ratio:3/4;padding:0;border:0;border-radius:14px;overflow:hidden;background:radial-gradient(120% 90% at 30% 15%,#FF64B9,#FF2E9A 50%,#C9177A);cursor:pointer}
.atr-mur-carte img{position:absolute;left:50%;bottom:-6px;height:84%;transform:translateX(-50%)}
.atr-mur-carte span{position:absolute;left:6px;right:6px;top:7px;font:900 11px/1 Poppins,system-ui,sans-serif;text-transform:uppercase;color:#fff;text-align:left;text-shadow:0 1.5px 0 #12060F,1.5px 0 0 #12060F,-1.5px 0 0 #12060F,0 -1.5px 0 #12060F,0 3px 0 #12060F;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.atr-mur-carte small{position:absolute;left:0;right:0;bottom:0;padding:16px 7px 5px;background:linear-gradient(180deg,rgba(18,6,15,0),rgba(18,6,15,.85));font:700 11px Poppins,system-ui,sans-serif;color:#fff;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.atr-neuf{position:absolute;left:6px;bottom:24px;z-index:1;padding:2px 6px;border-radius:6px;background:#FFE14D;color:#16101A;font:900 9.5px Poppins,system-ui,sans-serif;font-style:normal;letter-spacing:.04em}
.atr-premier{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:22px;padding:24px 18px;border-radius:22px;background:rgba(255,46,154,.08);box-shadow:inset 0 0 0 1.5px rgba(255,46,154,.35);text-align:center}
.atr-premier>span{font-size:40px;line-height:1}
.atr-premier b{font:800 18px Poppins,system-ui,sans-serif}
.atr-premier p{margin:0;max-width:300px;font-size:14px;line-height:1.4;color:#CBB9C3}
.atr-voisins{display:flex;gap:12px;overflow-x:auto;margin:0 -16px;padding:4px 16px 6px;scrollbar-width:none}
.atr-voisin{flex:none;display:flex;flex-direction:column;align-items:center;gap:5px;width:86px;padding:0;border:0;background:none;color:#fff;text-align:center;cursor:pointer}
.atr-voisin-ico{position:relative;display:grid;place-items:center;width:66px;height:66px;border-radius:50%;background:#FF2E9A;font-size:28px;box-shadow:0 0 0 3px #0E0A10,0 0 0 5px rgba(255,46,154,.65)}
.atr-voisin-ico img{width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 15%}
.atr-voisin-ico i{position:absolute;right:-6px;top:-4px;min-width:22px;height:22px;padding:0 6px;box-sizing:border-box;border-radius:999px;background:#fff;color:#FF2E9A;font:900 12px/22px Poppins,system-ui,sans-serif;font-style:normal}
.atr-voisin b{max-width:86px;font:700 12.5px/1.15 Poppins,system-ui,sans-serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.atr-voisin small{font-size:11.5px;color:#9C8795}
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
.atr-fin .atr-rose,.atr-fin .atr-blanc{max-width:100%;padding:0 22px}
.atr-continuer{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:auto;min-height:62px;padding:8px 22px!important;line-height:1.15;font-size:16px}
.atr-continuer span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.atr-continuer small{font:600 12.5px Geist,system-ui,sans-serif;opacity:.9}
.atr-titre{display:flex;align-items:center;gap:10px;margin:-44px 0 6px}
.atr-titre h2{margin:0;font:800 20px Poppins,system-ui,sans-serif}
.atr-deposer h3{margin:18px 0 8px;font:800 13px Poppins,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#FF7AC0}
.atr-deposer h3 small{font:500 12px Geist,system-ui,sans-serif;text-transform:none;letter-spacing:0;color:#9C8795}
.atr-lieux{display:flex;flex-direction:column;gap:8px}
.atr-choix{display:block;width:100%;margin:0;padding:12px 14px;border:0;border-radius:14px;background:#1D1520;color:#fff;font:700 15px Poppins,system-ui,sans-serif;text-align:left;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);cursor:pointer}
.atr-choix small{font:500 12.5px Geist,system-ui,sans-serif;color:#9C8795}
.atr-choix.pris{background:rgba(255,46,154,.14);box-shadow:inset 0 0 0 2px #FF2E9A}
.atr-chercher{display:flex;align-items:center;gap:8px;height:48px;margin-bottom:8px;padding:0 14px;border-radius:14px;background:#1D1520;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.atr-chercher input{flex:1;min-width:0;border:0;background:none;color:#fff;font:inherit;font-size:15px;outline:none}
.atr-lieux+.atr-lieux,.atr-lieux+.atr-choix,.atr-choix+.atr-lieux{margin-top:8px}
.atr-ou{margin-top:12px;padding:8px;border-radius:20px;background:#1D1520;box-shadow:inset 0 0 0 1.5px rgba(255,46,154,.55);animation:atr-entre .25s cubic-bezier(.2,.9,.3,1)}
.atr-ou p{display:flex;flex-direction:column;gap:2px;margin:0;padding:8px 6px 2px}
.atr-ou small{font:800 12px Poppins,system-ui,sans-serif;color:#FF7AC0}
.atr-ou b{font:800 17px Poppins,system-ui,sans-serif}
.atr-ou em{font-style:normal;font-size:12.5px;line-height:1.35;color:#9C8795}
.atr-choisi{display:flex;flex-direction:column;align-items:center;gap:3px;margin:4px 0 14px;text-align:center}
.atr-choisi-video{position:relative;display:block;width:176px;aspect-ratio:3/4;margin-bottom:8px;border-radius:20px;overflow:hidden;background:radial-gradient(120% 90% at 30% 15%,#FF64B9,#FF2E9A 50%,#C9177A);box-shadow:0 0 0 3px #0E0A10,0 0 0 6px #FF2E9A,0 22px 40px -12px rgba(255,46,154,.7)}
.atr-choisi-video video{width:100%;height:100%;object-fit:cover}
.atr-choisi-video>img{width:100%;height:100%;object-fit:contain;object-position:50% 100%}
.atr-choisi-video span{position:absolute;left:10px;right:10px;top:10px;font:900 15px/.98 Poppins,system-ui,sans-serif;text-transform:uppercase;color:#fff;text-align:left;text-shadow:0 2px 0 #12060F,2px 0 0 #12060F,-2px 0 0 #12060F,0 -2px 0 #12060F,0 3px 0 #12060F}
.atr-choisi b{font:800 16px Poppins,system-ui,sans-serif;color:#FF2E9A}
.atr-choisi small{font-size:12.5px;color:#9C8795}
.atr-miens .atr-vignette{transition:opacity .2s,filter .2s}
.atr-miens.un-choisi .atr-vignette:not(.pris){opacity:.42;filter:saturate(.5)}
.atr-coche{position:absolute;right:6px;bottom:6px;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#fff;color:#FF2E9A;font:900 15px/1 Poppins,system-ui,sans-serif;font-style:normal;box-shadow:0 4px 10px rgba(0,0,0,.5)}
.atr-bas .atr-rose{max-width:100%;padding:0 18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.atr-ailleurs{margin-top:8px;min-height:40px;padding:8px 14px;line-height:1.25;border:0;border-radius:999px;background:none;color:#FFE14D;font:700 13.5px Poppins,system-ui,sans-serif;box-shadow:inset 0 0 0 1px rgba(255,225,77,.55);cursor:pointer}
.atr-ailleurs.pris{background:rgba(255,225,77,.16)}
.atr-champ{width:100%;box-sizing:border-box;height:48px;margin-top:8px;padding:0 14px;border:0;border-radius:14px;background:#1D1520;color:#fff;font:inherit;font-size:15px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);outline:none}
.atr-note{margin:8px 0 0;font-size:12.5px;line-height:1.4;color:#9C8795}
.atr-miens{display:flex;gap:10px;overflow-x:auto;margin:0 -6px;padding:6px 6px 8px;scrollbar-width:none}
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
.atr-profil-gestes{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.atr-proche,.atr-lui-repondre{flex:1 1 150px;height:46px;padding:0 14px;border:0;border-radius:999px;font:800 14.5px Poppins,system-ui,sans-serif;cursor:pointer}
.atr-proche{background:#FF2E9A;color:#fff;box-shadow:0 10px 24px -10px rgba(255,46,154,.9)}
.atr-proche.pris{background:rgba(255,46,154,.14);color:#FF9ACF;box-shadow:inset 0 0 0 1.5px rgba(255,46,154,.6)}
.atr-proche:disabled{opacity:.6}
.atr-lui-repondre{background:#fff;color:#16101A}
.atr-puces{display:flex;flex-wrap:wrap;gap:8px}
.atr-puces button{height:36px;padding:0 12px;border:0;border-radius:999px;background:#1D1520;color:#fff;font:600 13px inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);cursor:pointer}
.atr-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.atr-grille .atr-vignette{width:100%}
@keyframes atr-entre{from{opacity:0;transform:translateY(14px)}}
/* ═══ 🧍 la figurine posée (22 novembre 2026) ═══ */
.afg-derniers{display:flex;gap:10px;padding:0 18px;overflow-x:auto;scrollbar-width:none}
.afg-carte{flex:none;width:220px;display:flex;flex-direction:column;gap:8px;padding:12px;border:0;border-radius:18px;background:#1D1520;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);color:#fff;font:inherit;text-align:left;cursor:pointer}
.afg-carte-haut{display:flex;align-items:center;gap:10px;min-width:0}
.afg-carte-haut b{display:block;font:700 14px Poppins,system-ui,sans-serif}
.afg-carte-haut small{display:block;font-size:12px;color:#CBB9C3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.afg-carte-mot{font-weight:700;font-size:14px;line-height:1.35}
.afg-rond{flex:none;display:grid;place-items:center;border-radius:50%;background:#fff;overflow:hidden}
.afg-rond img{width:100%;height:100%;object-fit:contain}
.afg-toast{position:fixed;left:50%;top:calc(76px + env(safe-area-inset-top));transform:translateX(-50%);z-index:60;max-width:min(92vw,420px);margin:0;padding:10px 14px;border-radius:14px;background:rgba(20,6,14,.95);color:#fff;font-size:14px;text-align:center;box-shadow:0 10px 30px -10px #000}
.afg-lieu-haut{margin:0 0 10px;padding:8px 0 10px 52px;background-size:cover;background-position:center;border-radius:16px}
.afg-lieu-haut h2{margin:0;font:800 22px Poppins,system-ui,sans-serif}
.afg-lieu-haut p{margin:2px 0 0;font-size:13.5px;color:#CBB9C3}
.afg-vide{padding:0 0 10px!important}
.afg-scene{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 10px;padding:16px 8px 20px;border-radius:22px;background:radial-gradient(80% 60% at 50% 30%,rgba(255,46,154,.12),transparent 70%),linear-gradient(#2A1520,#1A0E16)}
.afg-scene[data-figurines="0"]{display:none}
@media (min-width:520px){.afg-scene{grid-template-columns:repeat(3,minmax(0,1fr))}}
.afg-fig{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;padding:0;border:0;background:none;color:#fff;font:inherit;cursor:pointer}
.afg-bulle{position:relative;max-width:100%;box-sizing:border-box;padding:7px 10px;border-radius:14px;background:#fff;color:#16101A;font-size:12.5px;font-weight:700;line-height:1.3;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.35);overflow-wrap:anywhere}
.afg-bulle::after{content:"";position:absolute;left:50%;bottom:-5px;width:10px;height:10px;background:#fff;transform:translateX(-50%) rotate(45deg)}
.afg-bulle.grande{font-size:16px;padding:10px 16px;max-width:300px}
.afg-assise{position:relative;display:block;flex:none}
.afg-assise img{position:absolute;inset:0;width:100%;height:100%;user-select:none;-webkit-user-drag:none}
.afg-assise img.afg-tete{right:auto;bottom:auto}
.afg-assise.vide{border-radius:40% 40% 16px 16px;background:rgba(255,255,255,.08)}
.afg-prenom{margin-top:-4px;padding:1px 8px;border-radius:8px;background:rgba(0,0,0,.6);font-size:11.5px;font-weight:800}
.afg-fig.moi .afg-prenom{background:#FF2E9A}
.afg-a-cote{font-size:11px;color:#F2C46B;font-weight:700}
.afg-bas{position:sticky;bottom:calc(16px + env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:18px}
.afg-bas .atr-poser{width:100%}
.afg-bas .atr-poser:disabled{opacity:.5;cursor:default}
.afg-mienne{margin:0;padding:4px 12px;border-radius:999px;background:rgba(14,10,16,.85);font-size:13px;color:#F2C46B;font-weight:700}
.afg-titre{margin:4px 0 2px 52px;font:800 22px Poppins,system-ui,sans-serif}
.afg-sous{margin:0 0 14px 52px;font-size:13.5px;color:#CBB9C3}
.afg-apercu{display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px;border-radius:22px;background:linear-gradient(#4A2433,#2A1520);margin-bottom:16px}
.afg-section{display:flex;flex-direction:column;gap:10px;margin:0 0 18px}
.afg-section h3{margin:0;font:800 15px Poppins,system-ui,sans-serif}
.afg-puces{display:flex;flex-wrap:wrap;gap:8px}
.afg-puces button{min-height:40px;padding:6px 14px;border:0;border-radius:999px;background:#1D1520;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.16);color:#fff;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
.afg-puces button small{color:#9C8795}
.afg-puces button.pris{background:rgba(255,46,154,.18);box-shadow:inset 0 0 0 1.5px #FF2E9A}
.afg-puces button.zone{color:#F2C46B;box-shadow:inset 0 0 0 1.5px rgba(242,196,107,.45)}
.afg-puces button.zone.pris{background:rgba(242,196,107,.16);box-shadow:inset 0 0 0 1.5px #F2C46B}
.afg-puces.petites button{min-height:36px;font-size:12.5px}
.afg-champ{display:flex;flex-direction:column;gap:6px;font-size:12.5px;color:#CBB9C3}
.afg-champ input,.afg-mot textarea{box-sizing:border-box;width:100%;padding:10px 12px;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:#1D1520;color:#fff;font:inherit;font-size:15px}
.afg-mot{padding:14px;border-radius:20px;background:rgba(255,46,154,.08);box-shadow:inset 0 0 0 1.5px rgba(255,46,154,.55)}
.afg-mot textarea{font-weight:600;resize:none}
.afg-note{margin:0;font-size:12px;color:#9C8795}
.afg-tete-seule{grid-column:1/-1;display:flex;align-items:center;gap:12px}
.afg-lieu-donne{margin:0;padding:10px 14px;border-radius:14px;background:#1D1520;font-weight:700}
.afg-tetes{display:grid;grid-template-columns:repeat(auto-fill,minmax(68px,1fr));gap:8px}
.afg-tetes button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 2px;border:0;border-radius:14px;background:none;color:#CBB9C3;font:inherit;cursor:pointer}
.afg-tetes button .afg-rond{box-shadow:0 0 0 3px transparent}
.afg-tetes button.pris .afg-rond{box-shadow:0 0 0 3px #FF2E9A}
.afg-tetes button.pris{color:#FF7AC0}
.afg-tetes small{font-size:10.5px;font-weight:600;text-align:center;line-height:1.2}
.afg-qui{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:4px;border-radius:16px;background:#1D1520}
.afg-qui button{min-height:40px;border:0;border-radius:12px;background:none;color:#CBB9C3;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.afg-qui button.pris{background:#FF2E9A;color:#fff}
.afg-erreur{margin:0 0 8px;padding:10px 12px;border-radius:12px;background:rgba(255,80,80,.14);color:#FFB4A9;font-size:13.5px}
.afg-fiche-haut{display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 0 18px;text-align:center}
.afg-bonjour{min-height:40px;margin-top:6px;padding:0 14px;border:0;border-radius:999px;background:rgba(245,162,58,.16);box-shadow:inset 0 0 0 1px rgba(245,162,58,.5);color:inherit;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}
.afg-fiche-haut h2{margin:0;font:800 22px Poppins,system-ui,sans-serif}
.afg-fiche-haut p{margin:0;font-size:13px;color:#CBB9C3}
.afg-actions{display:flex;flex-direction:column;gap:10px}
.afg-actions .atr-poser{width:100%}
.afg-deux{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.afg-secondaire{display:flex;align-items:center;justify-content:center;min-height:46px;padding:0 10px;border:0;border-radius:999px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);background:none;color:#fff;font:700 13.5px Poppins,system-ui,sans-serif;text-decoration:none;cursor:pointer;text-align:center}
.afg-secondaire:disabled{opacity:.6;cursor:default}
.afg-signaler{align-self:center;min-height:44px;border:0;background:none;color:#9C8795;font:inherit;font-size:12.5px;font-weight:600;text-decoration:underline;cursor:pointer}
`;
