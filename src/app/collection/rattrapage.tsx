"use client";

/**
 * ⏪ LE SALON EN RATTRAPAGE (`docs/univers/rattrapage.md`, lot T2 ; les règles : `lib/direct/rattrapage.ts`).
 *
 * La séance d'hier, rejouée : la vidéo en haut (le lecteur de YouTube), sous elle la barre avec les marques des moments
 * où le groupe a réagi (on touche une marque : la vidéo y va) ; puis les fauteuils — ceux qui étaient là en « souvenir »,
 * ma figurine allumée (« Toi · en rattrapage »), les absents grisés —, et ce qui s'est dit, qui arrive à SA seconde
 * (« 🔒 La suite arrive à sa seconde, pas avant »). Quand la vidéo passe la seconde d'une réaction, la figurine de celui
 * qui l'a faite prend la scène : le grand moment (`GrandMoment`, comme au salon).
 *
 * `/univers/rattrapage?seance=<clé>`. Pensé pour le téléphone.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { aLaSeconde, PHRASES_RATTRAPAGE as PR, type SeanceARattraper, type TraceSeance } from "@/lib/direct/rattrapage";
import { GRAND_MOMENT, momentDeReaction, motDuMoment, type Moment } from "@/lib/direct/grands-moments";
import { REACTIONS_SALON, TEXTE_SALON_MAX } from "@/lib/direct/salons-ouverts";
import { vignetteYouTube } from "@/lib/direct/tele";
import { chargerYouTube } from "@/app/univers/tele-duo";
import { GrandMoment } from "@/app/univers/salons/grand-moment";

export const PHRASES_RATTRAPAGE_ECRAN = {
  etiquette: "⏪ Rattrapage",
  retour: "Retour",
  souvenir: "souvenir",
  absent: "absent",
  enRattrapage: "en rattrapage",
  toi: "Toi",
  dit: "💬 Ce qui s’est dit, à sa seconde",
  suite: "🔒 La suite arrive à sa seconde, pas avant.",
  rienEncore: "Rien n’a encore été dit à ce moment de la vidéo.",
  marques: "Les marques : là où le groupe a réagi",
  vuEnRattrapage: "⏪ vu en rattrapage",
  chargement: "La séance arrive…",
  ensemble: "🫶 Au même moment",
  aller: (t: string) => `Aller à ${t}`,
  reagir: "Réagir à ce moment",
  tonMot: "Ton mot",
  ecrire: "Écris au groupe…",
  ajouter: "Ajouter à la séance",
} as const;
const P = PHRASES_RATTRAPAGE_ECRAN;

type Lecteur = { destroy?: () => void; getCurrentTime?: () => number; getDuration?: () => number; seekTo?: (t: number, b: boolean) => void; playVideo?: () => void };

/** « Hier · 21 h », « Aujourd'hui · 21 h 30 », « Mardi · 21 h », « Le 12 novembre · 21 h ». */
export function quandDeLaSeance(ms: number, maintenant = Date.now()): string {
  const jour = (x: number) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(x));
  const h = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "numeric", minute: "2-digit" }).format(new Date(ms)).replace(":", " h ").replace(/ h 00$/, " h");
  const ecart = Math.round((Date.parse(jour(maintenant).split("/").reverse().join("-")) - Date.parse(jour(ms).split("/").reverse().join("-"))) / 86_400_000);
  const quel =
    ecart <= 0
      ? "Aujourd’hui"
      : ecart === 1
        ? "Hier"
        : ecart < 7
          ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long" }).format(new Date(ms)).replace(/^./, (c) => c.toUpperCase())
          : `Le ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" }).format(new Date(ms))}`;
  return `${quel} · ${h}`;
}

const emojiDe = (cle?: string) => REACTIONS_SALON.find((r) => r.cle === cle)?.e ?? momentDeReaction(cle)?.e ?? "✨";

/** Un moment qui joue : une ou deux vedettes (🫶). */
type MomentJoue = { id: string; m: Moment; qui: { q: string; mot: string }[]; niveau: number };

export function RattrapageEcran() {
  const [seance, setSeance] = useState<SeanceARattraper | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [iv, setIv] = useState(0);
  const [t, setT] = useState(0);
  const [duree, setDuree] = useState(0);
  const [moment, setMoment] = useState<MomentJoue | null>(null);
  const file = useRef<MomentJoue[]>([]);
  const enScene = useRef(false);
  /** (ce que fait le tic du lecteur quand la vidéo avance : posé plus bas) */
  const avance = useRef<(t: number) => void>(() => undefined);
  const lecteur = useRef<Lecteur | null>(null);
  const cadre = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const avant = useRef(0);
  const [L, setL] = useState(358);
  // (lot T3 : réagir en décalé)
  const [texte, setTexte] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [dit, setDit] = useState<{ texte: string; ok: boolean } | null>(null);

  // ─── la séance ───
  useEffect(() => {
    const cle = new URLSearchParams(window.location.search).get("seance") ?? "";
    let fini = false;
    fetch(`/api/direct/rattrapage?seance=${encodeURIComponent(cle)}`, { cache: "no-store" })
      .then(async (r) => ({ r, j: (await r.json().catch(() => ({}))) as { seance?: SeanceARattraper; error?: string } }))
      .then(({ r, j }) => {
        if (fini) return;
        if (!r.ok || !j.seance) setErreur(j.error || "Cette séance n’existe plus.");
        else setSeance(j.seance);
      })
      .catch(() => !fini && setErreur("Ça n’a pas marché. Réessaie."));
    return () => {
      fini = true;
    };
  }, []);

  const video = seance?.videos[iv] ?? null;
  const traces = useMemo(() => (seance && video ? seance.traces.filter((x) => x.video === video.id).sort((a, b) => a.t - b.t) : []), [seance, video]);

  // ─── le lecteur de YouTube, et où il en est (quatre fois par seconde) ───
  useEffect(() => {
    if (!video || !cadre.current) return;
    let fini = false;
    const cible = document.createElement("div");
    cadre.current.replaceChildren(cible);
    avant.current = 0;
    chargerYouTube()
      .then((YT) => {
        if (fini) return;
        lecteur.current = new YT.Player(cible, {
          videoId: video.id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, origin: window.location.origin },
        }) as Lecteur;
      })
      .catch(() => {
        if (!fini && cadre.current) cadre.current.innerHTML = `<iframe title="${video.titre.replace(/"/g, "")}" src="https://www.youtube-nocookie.com/embed/${video.id}?playsinline=1" style="width:100%;height:100%;border:0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      });
    const tic = window.setInterval(() => {
      const l = lecteur.current;
      const x = Number(l?.getCurrentTime?.());
      if (Number.isFinite(x)) {
        setT(x);
        avance.current(x);
      }
      const d = Number(l?.getDuration?.());
      if (Number.isFinite(d) && d > 0) setDuree(d);
    }, 250);
    return () => {
      fini = true;
      window.clearInterval(tic);
      try {
        lecteur.current?.destroy?.();
      } catch {
        /* (le lecteur est déjà parti) */
      }
      lecteur.current = null;
    };
  }, [video]);

  // ─── la largeur de la pièce (pour le grand moment) ───
  useEffect(() => {
    const el = scene.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const o = new ResizeObserver(() => setL(el.clientWidth || 358));
    o.observe(el);
    return () => o.disconnect();
  }, [seance]);

  // ─── le moment suivant de la file ───
  const jouerSuivant = useCallback(() => {
    const x = file.current.shift() ?? null;
    setMoment(x);
  }, []);
  useEffect(() => {
    enScene.current = Boolean(moment);
  }, [moment]);
  useEffect(() => {
    if (!moment) return;
    const k = window.setTimeout(jouerSuivant, GRAND_MOMENT.ms + 1600 * (moment.niveau - 1));
    return () => window.clearTimeout(k);
  }, [moment, jouerSuivant]);

  // ─── la vidéo passe la seconde d'une réaction : la figurine prend la scène (appelé par le tic du lecteur) ───
  const tracesRef = useRef<TraceSeance[]>([]);
  useEffect(() => {
    tracesRef.current = traces;
  }, [traces]);
  const quandLaVideoAvance = useCallback((t: number) => {
    const a = avant.current;
    avant.current = t;
    // (un saut — on a touché une marque, on a reculé : on ne rejoue pas tout ce qu'on a sauté)
    if (t < a || t - a > 2) return;
    const tr = tracesRef.current;
    const passees = tr.filter((x) => x.sorte === "reaction" && x.t > a && x.t <= t);
    for (const x of passees) {
      const m = momentDeReaction(x.cle);
      if (!m) continue;
      const mot = motDuMoment(m, x.id, tr.find((y) => y.q === x.q && y.sorte === "texte" && y.t <= x.t && x.t - y.t <= GRAND_MOMENT.texteAvant / 1000)?.texte);
      const dernier = file.current.at(-1);
      // (🫶 la même émotion, à la même seconde ou presque, par un autre : côte à côte)
      if (dernier && dernier.m.cle === m.cle && dernier.qui.length === 1 && dernier.qui[0].q !== x.q) dernier.qui.push({ q: x.q, mot });
      else if (file.current.length < GRAND_MOMENT.file) file.current.push({ id: x.id, m, qui: [{ q: x.q, mot }], niveau: Math.min(GRAND_MOMENT.niveauMax, Math.max(1, x.n ?? 1)) });
    }
    if (passees.length && !enScene.current) {
      enScene.current = true;
      setMoment(file.current.shift() ?? null);
    }
  }, []);
  useEffect(() => {
    avance.current = quandLaVideoAvance;
  }, [quandLaVideoAvance]);

  // ─── ⏪ (lot T3) réagir en décalé : à la seconde où j'en suis ───
  async function ajouter(corps: { sorte: "reaction"; cle: string } | { sorte: "texte"; texte: string }): Promise<boolean> {
    if (!seance || !video || occupe) return false;
    const ou = { video: video.id, t: Math.round(t * 10) / 10 };
    setOccupe(true);
    const r = await fetch("/api/direct/rattrapage", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reagir", seance: seance.cle, ...corps, ou }) }).catch(() => null);
    const j = ((await r?.json().catch(() => null)) ?? {}) as { trace?: TraceSeance; error?: string };
    setOccupe(false);
    if (!r?.ok || !j.trace) {
      setDit({ texte: j.error || "Ça n’a pas marché. Réessaie.", ok: false });
      return false;
    }
    const x = j.trace;
    setSeance((s) => (s ? { ...s, traces: [...s.traces, x], figurines: s.figurines[x.q] || !s.moi.src ? s.figurines : { ...s.figurines, [x.q]: s.moi.src } } : s));
    setDit({ texte: x.sorte === "reaction" ? PR.ajoute(emojiDe(x.cle), aLaSeconde(x.t)) : PR.ajouteMot(aLaSeconde(x.t)), ok: true });
    // (ma figurine prend la scène ; la même émotion qu'un souvenir qui joue encore : côte à côte, 🫶)
    const m = x.sorte === "reaction" ? momentDeReaction(x.cle) : null;
    if (m) {
      const mot = motDuMoment(m, x.id);
      if (moment && moment.m.cle === m.cle && moment.qui.length === 1 && moment.qui[0].q !== x.q) setMoment({ ...moment, qui: [...moment.qui, { q: x.q, mot }] });
      else if (!enScene.current) {
        enScene.current = true;
        setMoment({ id: x.id, m, qui: [{ q: x.q, mot }], niveau: 1 });
      } else if (file.current.length < GRAND_MOMENT.file) file.current.push({ id: x.id, m, qui: [{ q: x.q, mot }], niveau: 1 });
    }
    return true;
  }
  async function envoyerTexte(ev: React.FormEvent) {
    ev.preventDefault();
    const x = texte.trim();
    if (!x) return;
    if (await ajouter({ sorte: "texte", texte: x })) setTexte("");
  }

  const aller = (x: number) => {
    avant.current = Math.max(0, x - 3);
    try {
      lecteur.current?.seekTo?.(Math.max(0, x - 3), true);
      lecteur.current?.playVideo?.();
    } catch {
      /* (le lecteur n'est pas prêt) */
    }
  };

  if (erreur)
    return (
      <div className="rt" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <p data-rattrapage-erreur>{erreur}</p>
        <a href="/collection#groupes" className="rt-lien">
          Mes groupes
        </a>
        <style>{STYLES}</style>
      </div>
    );
  if (!seance)
    return (
      <div className="rt" style={{ justifyContent: "center", alignItems: "center" }}>
        <p>{P.chargement}</p>
        <style>{STYLES}</style>
      </div>
    );

  const total = duree || video?.duree || Math.max(60, ...traces.map((x) => x.t + 10));
  // (deux réactions trop proches sur la barre : une seule marque — la première ; on ne pourrait pas les toucher)
  const marques = traces
    .filter((x) => x.sorte === "reaction")
    .reduce<TraceSeance[]>((l, x) => (l.length && (x.t - l[l.length - 1].t) / total < 0.04 ? l : [...l, x]), []);
  const dits = traces.filter((x) => x.t <= t);
  const reste = traces.length - dits.length;
  const fig = (q: string) => seance.figurines[q] || [...seance.la, ...seance.absents, seance.moi].find((p) => p.q === q)?.src || "";
  const places = [
    ...seance.la.map((p) => ({ ...p, etat: "souvenir" as const })),
    ...(seance.jY ? [] : [{ ...seance.moi, etat: "moi" as const }]),
    ...seance.absents.map((p) => ({ ...p, etat: "absent" as const })),
  ].slice(0, 8);
  const H = 260;
  const pas = L / Math.max(1, places.length);
  const ouEst = (q: string) => {
    const k = places.findIndex((p) => p.q === q);
    return { x: pas * (k < 0 ? places.length / 2 : k + 0.5), y: H - 40, h: 56 };
  };

  return (
    <div className="rt" data-rattrapage={seance.cle}>
      <header className="rt-haut">
        <a
          href="/collection#groupes"
          className="rt-retour"
          aria-label={P.retour}
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault();
              window.history.back();
            }
          }}
        >
          ‹
        </a>
        <span className="rt-pastille">{P.etiquette}</span>
        <span className="rt-quand">
          {seance.e} {seance.nom} · {quandDeLaSeance(seance.quand)}
        </span>
      </header>

      <div className="rt-tele" style={{ backgroundImage: video ? `url(${vignetteYouTube(video.id)})` : undefined }}>
        <div ref={cadre} className="rt-lecteur" />
      </div>
      {seance.videos.length > 1 && (
        <div className="rt-videos" role="tablist">
          {seance.videos.map((v, k) => (
            <button key={v.id} type="button" role="tab" aria-selected={k === iv} className={k === iv ? "on" : ""} onClick={() => setIv(k)}>
              {v.titre || `Vidéo ${k + 1}`}
            </button>
          ))}
        </div>
      )}

      <div className="rt-barre" data-marques={marques.length}>
        <span className="rt-fond" />
        <span className="rt-plein" style={{ width: `${Math.min(100, (t / total) * 100)}%` }} />
        {marques.map((x) => (
          <button key={x.id} type="button" className="rt-marque" style={{ left: `${Math.min(98, Math.max(2, (x.t / total) * 100))}%` }} aria-label={P.aller(aLaSeconde(x.t))} data-marque={x.t} onClick={() => aller(x.t)}>
            {emojiDe(x.cle)}
          </button>
        ))}
      </div>
      <div className="rt-temps">
        <span>{aLaSeconde(t)}</span>
        {marques.length > 0 && <span>{P.marques}</span>}
        <span>{aLaSeconde(total)}</span>
      </div>

      <div ref={scene} className="rt-scene" style={{ height: H }}>
        {places.map((p) => (
          <div key={p.q} className={`rt-place ${p.etat}`} data-place={p.etat}>
            {fig(p.q) ? <img src={fig(p.q)} alt="" /> : <span className="rt-rond">{p.prenom.slice(0, 1)}</span>}
            <span className="rt-nom">
              {p.etat === "moi" ? P.toi : p.prenom}
              <br />
              <em>{p.etat === "souvenir" ? P.souvenir : p.etat === "moi" ? P.enRattrapage : P.absent}</em>
            </span>
          </div>
        ))}
        {moment && (
          <GrandMoment
            key={moment.id}
            id={moment.id}
            m={moment.m}
            niveau={moment.niveau}
            ensemble={moment.qui.length > 1 ? P.ensemble : undefined}
            vedettes={moment.qui.map((v) => ({ cle: v.q, mot: v.mot, de: ouEst(v.q), figure: (h: number) => (fig(v.q) ? <img src={fig(v.q)} alt="" style={{ height: h }} /> : <span style={{ fontSize: h * 0.6 }}>{moment.m.e}</span>) }))}
            L={L}
            H={H}
          />
        )}
      </div>

      <section className="rt-dit" aria-live="polite">
        <h2>{P.dit}</h2>
        {dits.length === 0 && <p className="rt-gris">{P.rienEncore}</p>}
        {dits.map((x) => (
          <Trace key={x.id} x={x} moi={seance.moi.q} />
        ))}
        {reste > 0 && <p className="rt-gris">{P.suite}</p>}
      </section>
      <div className="rt-reagir" role="group" aria-label={P.reagir}>
        {REACTIONS_SALON.map((r) => (
          <button key={r.cle} type="button" className="rt-emo" aria-label={r.nom} data-reagir={r.cle} disabled={occupe || !video} onClick={() => void ajouter({ sorte: "reaction", cle: r.cle })}>
            {r.e}
          </button>
        ))}
      </div>
      <form className="rt-ecrire" onSubmit={envoyerTexte}>
        <label className="rt-cache" htmlFor="rt-mot">
          {P.tonMot}
        </label>
        <input id="rt-mot" value={texte} maxLength={TEXTE_SALON_MAX} placeholder={P.ecrire} onChange={(e) => setTexte(e.target.value)} autoComplete="off" />
        <button type="submit" disabled={occupe || !texte.trim() || !video}>
          {P.ajouter}
        </button>
      </form>
      {dit && (
        <p className={`rt-dit-ok${dit.ok ? "" : " non"}`} role="status" data-ajoute={dit.ok ? "1" : "0"}>
          {dit.ok ? "✓ " : ""}
          {dit.texte}
        </p>
      )}
      <style>{STYLES}</style>
    </div>
  );
}

function Trace({ x, moi }: { x: TraceSeance; moi: string }) {
  const mien = x.q === moi;
  return (
    <div className={`rt-trace${mien ? " mien" : ""}`} data-trace={x.id}>
      <div className="rt-qui">
        {mien ? P.toi : x.prenom} · à {aLaSeconde(x.t)}
        {x.rattrapage && <b> · {P.vuEnRattrapage}</b>}
      </div>
      <div className="rt-bulle">{x.sorte === "texte" ? x.texte : `${emojiDe(x.cle)}${x.n && x.n > 1 ? ` ×${x.n}` : ""}`}</div>
    </div>
  );
}

const STYLES = `
.rt{min-height:100dvh;box-sizing:border-box;max-width:560px;margin:0 auto;padding:14px 16px 32px;display:flex;flex-direction:column;gap:11px;background:#120c09;color:#fff4e6;font-family:var(--font-geist-sans,system-ui),sans-serif}
.rt-haut{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.rt-retour{width:44px;height:44px;border-radius:999px;background:#1c1411;display:flex;align-items:center;justify-content:center;color:#fff4e6;text-decoration:none;font-size:22px}
.rt-pastille{padding:6px 12px;border-radius:999px;background:#f5a23a;color:#2a1500;font-weight:800;font-size:13.5px}
.rt-quand{font-size:12.5px;color:#cdb8a4}
.rt-tele{position:relative;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#1a120e center/cover no-repeat}
.rt-lecteur,.rt-lecteur>div,.rt-lecteur iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.rt-videos{display:flex;gap:6px;overflow-x:auto}
.rt-videos button{flex:none;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-height:36px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,196,140,.14);background:#1c1411;color:#cdb8a4;font-size:12.5px}
.rt-videos button.on{background:#261b16;color:#fff4e6;border-color:#f5a23a}
.rt-barre{position:relative;height:40px}
.rt-fond,.rt-plein{position:absolute;left:0;bottom:8px;height:5px;border-radius:999px}
.rt-fond{right:0;background:#261b16}
.rt-plein{background:#fff4e6;transition:width .25s linear}
.rt-marque{position:absolute;top:0;transform:translateX(-50%);width:30px;height:30px;padding:0;border:0;background:none;font-size:16px;line-height:30px;cursor:pointer}
.rt-temps{display:flex;justify-content:space-between;gap:8px;font-size:11.5px;color:#cdb8a4;margin-top:-6px}
.rt-scene{position:relative;display:flex;justify-content:space-around;align-items:flex-end;border-radius:18px;background:#1c1411;padding:0 4px 8px;overflow:hidden}
.rt-place{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;flex:1}
.rt-place img{height:84px;width:auto;max-width:100%;object-fit:contain}
.rt-rond{width:50px;height:50px;border-radius:999px;background:#261b16;display:flex;align-items:center;justify-content:center;font-weight:800}
.rt-place.souvenir img,.rt-place.souvenir .rt-rond{opacity:.62;filter:saturate(.75)}
.rt-place.absent img,.rt-place.absent .rt-rond{opacity:.35;filter:grayscale(1)}
.rt-place.moi img,.rt-place.moi .rt-rond{filter:drop-shadow(0 0 12px rgba(255,46,154,.75))}
.rt-nom{font-size:11px;color:#cdb8a4;text-align:center;line-height:1.2;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.rt-nom em{font-style:normal}
.rt-place.moi .rt-nom{color:#fff4e6;font-weight:600}
.rt-dit{display:flex;flex-direction:column;gap:8px}
.rt-dit h2{margin:0;font-size:12px;font-weight:600;color:#cdb8a4}
.rt-gris{margin:0;font-size:12.5px;color:#cdb8a4}
.rt-trace{display:flex;flex-direction:column;align-items:flex-start}
.rt-trace.mien{align-items:flex-end}
.rt-qui{font-size:11.5px;color:#cdb8a4;margin-bottom:2px}
.rt-qui b{color:#f5a23a;font-weight:600}
.rt-bulle{background:#261b16;border-radius:16px;padding:7px 11px;font-size:14px;line-height:1.35;max-width:85%;overflow-wrap:anywhere}
.rt-trace.mien .rt-bulle{background:#3a1a2c}
.rt-lien{color:#cdb8a4}
.rt-reagir{display:flex;justify-content:space-between;gap:6px}
.rt-emo{width:48px;height:48px;border-radius:999px;background:#261b16;border:1px solid rgba(255,196,140,.14);font-size:22px;padding:0;cursor:pointer;transition:transform .12s}
.rt-emo:active{transform:scale(.92)}
.rt-emo:disabled{opacity:.5}
.rt-ecrire{display:flex;gap:8px;align-items:center}
.rt-ecrire input{flex:1;min-width:0;height:48px;box-sizing:border-box;border-radius:999px;border:1px solid rgba(255,196,140,.14);background:#1c1411;color:#fff4e6;padding:0 16px;font-size:16px}
.rt-ecrire button{flex:none;height:48px;padding:0 16px;border:0;border-radius:999px;background:#ff2e9a;color:#fff;font-weight:800;font-size:14px;box-shadow:0 10px 28px rgba(255,46,154,.38)}
.rt-ecrire button:disabled{opacity:.55;box-shadow:none}
.rt-cache{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.rt-dit-ok{margin:0;padding:10px 14px;border-radius:18px;background:#1c1411;border:1px solid rgba(255,196,140,.14);font-size:13.5px;line-height:1.35}
.rt-dit-ok.non{color:#f6b54b}
`;
