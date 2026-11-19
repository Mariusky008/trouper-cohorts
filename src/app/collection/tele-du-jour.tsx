"use client";

/**
 * 📺 MA TÉLÉ DU JOUR, À L'ÉCRAN (`lib/direct/tele-du-jour.ts` ; `docs/univers/decouvrir.md`, sections 4.2 et 13 ; le lot
 * D1). Pensée pour le téléphone.
 *
 *   · LA TÉLÉ EN GRAND ÉCRAN (le propriétaire, 19 novembre 2026 : « l'écran de la télé ne va-t-il pas être trop petit ? ») :
 *     toute la largeur, en 16/9, avec le lecteur officiel de YouTube ; « ▶ Allumer la télé » est le geste qui donne le son
 *     sur iPhone. Dessous, ma pièce (celle de Ma maison) et ma figurine assise. « 🛋️ Voir la pièce » remet la vidéo dans
 *     la télé de ma pièce ; « ⛶ Grand écran » la ressort (on revient toujours en grand écran).
 *   · « ⏭ Suivante » (passée avant 15 s : son thème descend), « 📌 Garder » (elle va à la télé de ma maison), « 📤 Envoyer
 *     à… » (un proche : un message dans notre conversation, et elle passe sur la télé de notre duo). Vue jusqu'au bout :
 *     son thème monte, la suivante arrive.
 *   · Une vidéo qui refuse d'être lue hors de YouTube : la suivante arrive, sans rien compter.
 *   · Pas encore de passions : « Tes passions » d'abord (`tes-passions.tsx`).
 *
 * Le lecteur de YouTube est chargé une fois (`chargerYouTube`, `tele-duo.tsx`) ; s'il ne répond pas, la vignette et
 * « ▶ La regarder sur YouTube ».
 *
 * 🔥 L'ONGLET « DÉCOUVRIR » (le lot D1b, 19 novembre 2026) : c'est elle, à la place des mèmes en plein écran et des vœux
 * (`onglet` : sous la barre du haut, au-dessus du menu ; la note et la feuille « Envoyer à… » passent devant le menu).
 * Seule, à l'adresse d'essai `/univers/tele`, elle prend tout l'écran.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PHRASES_TELE_DU_JOUR as P, duree, type TeleDuJour, type VideoTele } from "@/lib/direct/tele-du-jour";
import { themeDe } from "@/lib/direct/decouvrir";
import { surYouTube, vignetteYouTube } from "@/lib/direct/tele";
import { chargerYouTube } from "@/app/univers/tele-duo";
import { TesPassions } from "./tes-passions";

const ROUTE = "/api/direct/tele-du-jour";
type Lecteur = {
  destroy?: () => void;
  playVideo?: () => void;
  loadVideoById?: (id: string) => void;
  getCurrentTime?: () => number;
  unloadModule?: (m: string) => void;
};
type Proche = { cle: string; prenom: string; image?: string; lien?: string };

const poster = (corps: Record<string, unknown>) =>
  fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
    .then(async (r) => ({ ok: r.ok, j: (await r.json().catch(() => ({}))) as { error?: string; deja?: boolean } }))
    .catch(() => ({ ok: false, j: { error: "Pas de réseau : réessaie dans un instant." } as { error?: string; deja?: boolean } }));

export function TeleDuJourEcran({ onglet = false }: { onglet?: boolean }) {
  const [tele, setTele] = useState<TeleDuJour | null>(null);
  const [erreur, setErreur] = useState("");
  const charger = useCallback(async () => {
    const r = await fetch(ROUTE, { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { tele?: TeleDuJour; error?: string } | undefined;
    if (!r?.ok || !j?.tele) return setErreur(j?.error || "Pas de réseau : réessaie dans un instant.");
    setErreur("");
    setTele(j.tele);
  }, []);
  useEffect(() => {
    void Promise.resolve().then(charger);
  }, [charger]);
  const cls = `td${onglet ? " onglet" : ""}`;
  if (!tele)
    return (
      <div className={`${cls} td-centre`}>
        {erreur || "…"}
        <style>{STYLES}</style>
      </div>
    );
  // (pas encore de passions : « Tes passions » d'abord, puis la télé)
  if (!tele.passions.length) return <TesPassions onglet={onglet} onFini={() => void charger()} />;
  return <Television tele={tele} cls={cls} />;
}

function Television({ tele, cls }: { tele: TeleDuJour; cls: string }) {
  const videos = tele.videos;
  const [i, setI] = useState(0);
  const [allumee, setAllumee] = useState(false);
  const [simple, setSimple] = useState(false);
  const [grand, setGrand] = useState(true);
  // (le passage entre la pièce et le grand écran glisse ; pas le premier affichage)
  const [glisse, setGlisse] = useState(false);
  const [note, setNote] = useState("");
  const [feuille, setFeuille] = useState(false);
  const [proches, setProches] = useState<Proche[] | null>(null);
  const [gardees, setGardees] = useState<string[]>([]);
  const [occupe, setOccupe] = useState(false);
  const hote = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const boite = useRef<HTMLDivElement>(null);
  const [L, setL] = useState(0);
  const v: VideoTele | undefined = videos[i];
  const ref = useRef({ v, i });
  useEffect(() => {
    ref.current = { v, i };
  });

  // (la largeur de l'écran : la télé en 16/9, la pièce dessous)
  useLayoutEffect(() => {
    const el = boite.current;
    if (!el) return;
    const mesurer = () => setL(el.clientWidth);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dire = (t: string) => {
    setNote(t);
    window.setTimeout(() => setNote((x) => (x === t ? "" : x)), 3500);
  };

  // ⏭ la suivante (après une vue jusqu'au bout, un « Suivante », ou une vidéo illisible)
  const suivante = useCallback((o: { fin?: boolean; illisible?: boolean } = {}) => {
    const { v: actuelle, i: k } = ref.current;
    if (!actuelle) return;
    let secondes = -1;
    try {
      secondes = Math.round(lecteur.current?.getCurrentTime?.() ?? -1);
    } catch {
      /* (pas de lecteur) */
    }
    void poster({ action: "vue", id: actuelle.id, ...(o.fin ? { fin: true } : {}), ...(o.illisible ? { illisible: true } : {}), ...(secondes >= 0 ? { secondes } : {}) });
    const prochaine = videos[k + 1];
    setI(k + 1);
    if (prochaine && lecteur.current?.loadVideoById) {
      try {
        lecteur.current.loadVideoById(prochaine.id);
      } catch {
        /* (le lecteur se refera) */
      }
    }
  }, [videos]);

  // ▶ LE LECTEUR DE YOUTUBE : créé à l'allumage (le geste qui donne le son), puis il change de vidéo sans se refaire
  const allumer = allumee && Boolean(v);
  useEffect(() => {
    if (!allumer || simple) return;
    let fini = false;
    chargerYouTube()
      .then((YT) => {
        if (fini || !hote.current || !ref.current.v) return;
        const cible = document.createElement("div");
        hote.current.replaceChildren(cible);
        lecteur.current = new YT.Player(cible, {
          videoId: ref.current.v.id,
          host: "https://www.youtube-nocookie.com",
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, controls: 1, iv_load_policy: 3, cc_load_policy: 0, origin: window.location.origin },
          events: {
            onReady: (e: { target?: Lecteur }) => {
              try {
                e.target?.unloadModule?.("captions");
                e.target?.playVideo?.();
              } catch {
                /* (le bouton de YouTube reste là) */
              }
            },
            // (0 : finie — la suivante arrive)
            onStateChange: (e: { data?: number }) => {
              if (!fini && e.data === 0) suivante({ fin: true });
            },
            // (101, 150 : elle refuse d'être lue hors de YouTube ; 100 : partie ; 2, 5 : illisible ici)
            onError: () => {
              if (fini) return;
              dire(P.illisible);
              suivante({ illisible: true });
            },
          },
        }) as Lecteur;
      })
      .catch(() => {
        if (!fini) setSimple(true);
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
    // (une seule fois par allumage : les vidéos suivantes passent par `loadVideoById`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allumer, simple]);

  async function garder() {
    if (!v) return;
    setOccupe(true);
    const r = await poster({ action: "garder", id: v.id });
    setOccupe(false);
    if (!r.ok) return dire(r.j.error || "Ça n’a pas marché. Réessaie.");
    setGardees((g) => [...g, v.id]);
    dire(r.j.deja ? P.dejaGardee : P.gardee);
  }
  async function ouvrirFeuille() {
    setFeuille(true);
    if (proches) return;
    const r = await fetch("/api/direct/proches", { cache: "no-store" }).catch(() => null);
    const j = (await r?.json().catch(() => ({}))) as { proches?: Proche[] } | undefined;
    setProches((j?.proches ?? []).filter((p) => p.lien === "proches"));
  }
  async function envoyer(p: Proche) {
    if (!v) return;
    setOccupe(true);
    const r = await poster({ action: "envoyer", id: v.id, a: p.cle });
    setOccupe(false);
    setFeuille(false);
    dire(r.ok ? P.envoyee(p.prenom) : r.j.error || "Ça n’a pas marché. Réessaie.");
  }

  // 🛋️ LA PIÈCE : le panorama de ma pièce (centré sur ma figurine, ou sur la télé quand la vidéo y est), ma figurine
  const scene = tele.scene;
  const zone = scene?.emplacements?.tele;
  const enPiece = !grand && Boolean(zone) && Boolean(scene);
  const hEcran = Math.round((L * 9) / 16);
  const hPiece = Math.round(L * (enPiece ? 1.1 : 0.62));
  const ratio = scene ? scene.panorama.largeur / Math.max(1, scene.panorama.hauteur) : 1;
  const lPano = hPiece * ratio;
  const borne = (x: number) => Math.min(0, Math.max(L - lPano, x));
  const tx = scene ? borne(L / 2 - (enPiece && zone ? zone[0] + zone[2] / 2 : scene.centre.x) * lPano) : 0;
  const ecran =
    enPiece && zone
      ? { left: tx + zone[0] * lPano, top: zone[1] * hPiece, width: zone[2] * lPano, height: zone[3] * hPiece }
      : { left: 0, top: 0, width: L, height: hEcran };
  const theme = v ? themeDe(v.theme) : undefined;
  const fini = !v;

  return (
    <div className={cls} data-video={v?.id ?? ""} data-mode={enPiece ? "piece" : "grand"}>
      <header className="td-haut">
        <div>
          <p className="td-sur">📺 {P.titre}</p>
          <p className="td-compte" data-compte>
            {tele.vide ? P.bientot : P.attendent(Math.max(0, videos.length - i))}
          </p>
        </div>
        {theme && (
          <span className="td-theme" data-theme={theme.id}>
            {theme.e} {theme.nom}
          </span>
        )}
      </header>

      <div className="td-scene" ref={boite} style={{ height: (enPiece ? 0 : hEcran) + hPiece }}>
        <div className="td-piece" style={{ top: enPiece ? 0 : hEcran, height: hPiece }} data-piece={scene?.piece ?? ""}>
          {scene ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="td-pano" src={scene.panorama.src} srcSet={scene.panorama.srcset} sizes={`${Math.round(lPano)}px`} alt="" style={{ width: lPano, height: hPiece, transform: `translateX(${tx}px)`, backgroundImage: `url(${scene.panorama.flou})` }} />
              {tele.figurine && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="td-figurine"
                  src={tele.figurine.src}
                  srcSet={tele.figurine.srcset}
                  sizes="240px"
                  alt="Ta figurine"
                  style={{ height: scene.centre.hauteur * hPiece, left: tx + scene.centre.x * lPano, top: scene.centre.y * hPiece }}
                />
              )}
            </>
          ) : (
            tele.figurine && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="td-figurine seule" src={tele.figurine.src} srcSet={tele.figurine.srcset} sizes="240px" alt="Ta figurine" style={{ height: hPiece * 0.82, left: L / 2, top: hPiece * 0.96 }} />
            )
          )}
        </div>

        <div className={`td-ecran${glisse ? " glisse" : ""}`} style={ecran}>
          {fini ? (
            <div className="td-fini" data-fini>
              <b>{tele.vide ? P.bientot : P.fini}</b>
              {!tele.vide && <span>{P.demain}</span>}
            </div>
          ) : allumee && !simple ? (
            <div ref={hote} className="td-lecteur" />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="td-vignette" src={vignetteYouTube(v.id)} alt="" referrerPolicy="no-referrer" />
              {simple ? (
                <a className="td-allumer" href={surYouTube(v.id)} target="_blank" rel="noreferrer">
                  {P.surYouTube}
                </a>
              ) : (
                <button type="button" className="td-allumer" data-allumer onClick={() => setAllumee(true)}>
                  {P.allumer}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {v && (
        <section className="td-bas">
          <p className="td-titre" data-titre>
            {v.titre}
          </p>
          <p className="td-chaine">
            {v.chaine} · {duree(v.duree)}
          </p>
          <div className="td-gestes">
            <button type="button" data-suivante disabled={occupe} onClick={() => suivante()}>
              {P.suivante}
            </button>
            <button type="button" data-garder disabled={occupe || gardees.includes(v.id)} onClick={() => void garder()}>
              {gardees.includes(v.id) ? P.dejaGardee : P.garder}
            </button>
            <button type="button" data-envoyer disabled={occupe} onClick={() => void ouvrirFeuille()}>
              {P.envoyer}
            </button>
          </div>
          {scene && zone && (
            <button
              type="button"
              className="td-lien"
              data-bascule
              onClick={() => {
                setGlisse(true);
                setGrand((g) => !g);
              }}
            >
              {enPiece ? P.grandEcran : P.voirPiece}
            </button>
          )}
        </section>
      )}

      {note && (
        <p className="td-note" role="status" data-note>
          {note}
        </p>
      )}

      {feuille && (
        <div className="td-voile" onClick={() => setFeuille(false)}>
          <div className="td-feuille" role="dialog" aria-label={P.envoyerA} onClick={(e) => e.stopPropagation()}>
            <p className="td-feuille-titre">{P.envoyerA}</p>
            {proches === null ? (
              <p className="td-doux">…</p>
            ) : proches.length === 0 ? (
              <p className="td-doux">{P.pasDeProche}</p>
            ) : (
              <ul>
                {proches.map((p) => (
                  <li key={p.cle}>
                    <button type="button" data-proche={p.cle} disabled={occupe} onClick={() => void envoyer(p)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image ? <img src={p.image} alt="" /> : <span className="td-rond" aria-hidden="true" />}
                      <span>{p.prenom}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="td-lien" onClick={() => setFeuille(false)}>
              {P.annuler}
            </button>
          </div>
        </div>
      )}
      <style>{STYLES}</style>
    </div>
  );
}

const STYLES = `
.td{min-height:100dvh;max-width:520px;margin:0 auto;padding:calc(14px + env(safe-area-inset-top)) 0 calc(24px + env(safe-area-inset-bottom));background:radial-gradient(130% 55% at 50% 0%,#3a1430 0%,#160711 62%);color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;gap:12px;overflow-x:hidden}
.td-centre{align-items:center;justify-content:center;color:#ead3df}
.td.onglet{min-height:0;padding:4px 0 0;background:none}
.td.onglet.td-centre{min-height:50dvh}
.td-haut{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;padding:0 16px}
.td-sur{margin:0;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#F2C46B}
.td-compte{margin:4px 0 0;font-size:19px;font-weight:900}
.td-theme{flex:none;border-radius:999px;padding:6px 11px;background:rgba(255,255,255,.1);font-size:13px;font-weight:800}
.td-scene{position:relative;width:100%;overflow:hidden;background:#0d0409}
.td-piece{position:absolute;left:0;right:0;overflow:hidden;background:linear-gradient(180deg,#4a2335,#24101b)}
.td-pano{position:absolute;left:0;top:0;max-width:none;background-size:cover;object-fit:cover}
.td-figurine{position:absolute;transform:translate(-50%,-100%);max-width:none;filter:drop-shadow(0 8px 10px rgba(0,0,0,.45))}
.td-ecran{position:absolute;overflow:hidden;background:#000;box-shadow:0 6px 18px rgba(0,0,0,.45)}
.td-ecran.glisse{transition:left .35s ease,top .35s ease,width .35s ease,height .35s ease}
.td-lecteur,.td-lecteur iframe{width:100%;height:100%;border:0;display:block}
.td-vignette{width:100%;height:100%;object-fit:cover;opacity:.85}
.td-allumer{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:0;border-radius:999px;padding:12px 20px;font:inherit;font-weight:900;font-size:16px;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a);box-shadow:0 10px 24px -10px rgba(255,46,154,.9);text-decoration:none;white-space:nowrap}
.td-fini{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px;text-align:center;background:linear-gradient(160deg,#2a1020,#0d0409)}
.td-fini span{color:#ead3df;font-size:14px}
.td-bas{display:flex;flex-direction:column;gap:8px;padding:0 16px}
.td-titre{margin:0;font-size:17px;font-weight:800;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.td-chaine{margin:0;color:#a88a9b;font-size:13.5px}
.td-gestes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:4px}
.td-gestes button{min-height:46px;border:0;border-radius:14px;padding:8px 6px;font:inherit;font-weight:800;font-size:14px;color:#FFF4E6;background:rgba(255,255,255,.1)}
.td-gestes button[data-garder]{background:rgba(242,196,107,.18)}
.td-gestes button[data-envoyer]{color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a)}
.td-gestes button:disabled{opacity:.55}
.td-lien{align-self:center;border:0;background:none;color:#ead3df;font:inherit;font-size:14.5px;font-weight:700;text-decoration:underline;padding:6px}
.td-note{position:fixed;left:16px;right:16px;bottom:calc(18px + env(safe-area-inset-bottom));margin:0 auto;max-width:488px;padding:11px 14px;border-radius:14px;background:#2b1424;box-shadow:0 10px 30px rgba(0,0,0,.45);font-size:14.5px;font-weight:700;text-align:center;z-index:5}
.td-voile{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;z-index:6}
.td.onglet .td-note{bottom:calc(96px + env(safe-area-inset-bottom));z-index:25}
.td.onglet .td-voile{z-index:40}
.td-feuille{width:100%;max-width:520px;max-height:70dvh;overflow:auto;border-radius:22px 22px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom));background:#21101a;display:flex;flex-direction:column;gap:10px}
.td-feuille-titre{margin:0;font-weight:900;font-size:17px}
.td-feuille ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.td-feuille li button{width:100%;display:flex;align-items:center;gap:12px;border:0;border-radius:14px;padding:8px 12px;background:rgba(255,255,255,.08);color:#FFF4E6;font:inherit;font-weight:800;font-size:16px;text-align:left}
.td-feuille img,.td-rond{width:44px;height:44px;border-radius:50%;object-fit:cover;object-position:top;background:rgba(255,255,255,.12)}
.td-doux{margin:0;color:#ead3df}
`;
