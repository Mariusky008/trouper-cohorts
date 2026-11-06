"use client";

/**
 * 🔥 « DÉCOUVRIR » — 7 novembre 2026 (le patron : « pour les commerçants, ça devrait être plutôt découvrir les figurines
 * et les mèmes des autres »). Le fil des mèmes du jour :
 *   · ceux des commerçants ClikMe de sa ville (puis d'ailleurs, s'il y en a peu) : leur menu, leur nouveauté, leur bon
 *     plan, annoncés par leur figurine (`lib/direct/memes-commerces.ts`) — « 📍 Voir sa page » (compté : c'est ce que
 *     son mème rapporte au commerçant) ;
 *   · 🌍 ceux que les gens de SA ville ont choisi d'y montrer (l'étape 3 : leur accord, un geste à eux ; jamais un duo ;
 *     ils les retirent quand ils veulent) — « ↩️ Lui répondre » (en duo), et « Signaler » ;
 *   · chaque vidéo joue toute seule, en silence, quand on la voit (un toucher : le son) ; « 📲 Partager ».
 * La liste se recharge à chaque fois qu'il ouvre l'onglet.
 */
import { useContext, useEffect, useRef, useState } from "react";
import type { MemeCommerce } from "@/lib/direct/memes-commerces";
import type { MemePublic } from "@/lib/direct/ma-figurine";
import { GuideDit, OngletVisible } from "./guide";

/** Un élément du fil : le mème d'un commerçant, ou celui d'un habitant de sa ville (qui l'a choisi). */
type Element = { genre: "commerce"; m: MemeCommerce } | { genre: "client"; m: MemePublic };

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

/** Un mème du fil : il joue quand on le voit (en silence), s'arrête quand on passe ; un toucher : le son. */
function MemeDuFil({ e, actif, onRetire }: { e: Element; actif: boolean; onRetire: (id: string) => void }) {
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
      if (typeof navigator.share === "function") return await navigator.share({ url: lien, title: e.genre === "commerce" ? `${e.m.emoji} ${e.m.titre} · ${e.m.nom}` : `🎭 Le mème de ${e.m.prenom || "quelqu’un"}` });
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
  return (
    <li className={`dv-carte${e.genre === "client" ? " client" : ""}`}>
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
          <span className="dv-qui">
            <b>{e.m.nom}</b>
            <small>
              {e.m.emoji} {e.m.titre}
              {e.m.ville ? ` · ${e.m.ville}` : ""} · {quand(e.m.le)}
            </small>
          </span>
        ) : (
          <span className="dv-qui">
            <b>🎭 {e.m.prenom || "Quelqu’un"}</b>
            <small>
              De ta ville · {quand(e.m.le)} ·{" "}
              <button type="button" className="dv-signaler" onClick={signaler}>
                Signaler
              </button>
            </small>
          </span>
        )}
        <span className="dv-actions">
          {e.genre === "commerce" ? (
            <a className="dv-voir" href={`/meme/${m.id}/voir`}>
              📍 Voir sa page
            </a>
          ) : (
            <a className="dv-voir" href={`/figurine/${m.id}/repondre`}>
              ↩️ Lui répondre
            </a>
          )}
          <button type="button" className="dv-partager" onClick={partager} aria-label="Partager ce mème">
            {partage || "📲"}
          </button>
        </span>
      </div>
    </li>
  );
}

export function Decouvrir({ allerA }: { allerA: (o: string) => void }) {
  const visible = useContext(OngletVisible);
  const [fil, setFil] = useState<{ memes: MemeCommerce[]; publics: MemePublic[]; ville: string } | null>(null);
  const [panne, setPanne] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let fini = false;
    fetch("/api/direct/memes-commerces", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { memes?: MemeCommerce[]; publics?: MemePublic[]; ville?: string }) => {
        if (fini) return;
        setFil({ memes: Array.isArray(j.memes) ? j.memes : [], publics: Array.isArray(j.publics) ? j.publics : [], ville: j.ville ?? "" });
        setPanne(false);
      })
      .catch(() => !fini && setPanne(true));
    return () => {
      fini = true;
    };
  }, [visible]);
  // LE FIL : ceux de sa ville d'abord (commerçants et habitants mêlés, les plus récents d'abord), puis ceux d'ailleurs
  const elements: Element[] = fil
    ? [
        ...[...fil.memes.filter((m) => !fil.ville || m.villeSlug === fil.ville).map((m) => ({ genre: "commerce" as const, m })), ...fil.publics.map((m) => ({ genre: "client" as const, m }))].sort((a, b) =>
          b.m.le.localeCompare(a.m.le),
        ),
        ...fil.memes.filter((m) => fil.ville && m.villeSlug !== fil.ville).map((m) => ({ genre: "commerce" as const, m })),
      ]
    : [];
  const ailleurs = fil ? fil.memes.filter((m) => fil.ville && m.villeSlug !== fil.ville).length : 0;
  const retirer = (id: string) => setFil((f) => (f ? { ...f, publics: f.publics.filter((m) => m.id !== id) } : f));
  return (
    <div className="dv">
      <header className="og-tete">
        <small>DÉCOUVRIR</small>
        <h2>Les mèmes du jour près de chez toi</h2>
      </header>
      <GuideDit
        cle="pablito-decouvrir"
        popup
        repliques={[
          { t: "Ici, les mèmes du jour de ta ville 🔥", v: "euphorie" },
          { t: "Les commerçants ClikMe t’annoncent leur menu, leurs nouveautés, leurs bons plans. Et les gens d’ici montrent leurs mèmes, s’ils le veulent.", v: "joie" },
          { t: "Un mème te plaît ? Réponds-lui en duo, ou envoie-le à un ami 📲", v: "joie", apres: "louche" },
        ]}
      />
      {panne && <p className="mc-vide">Le fil n’a pas pu s’afficher. Réessaie dans un instant.</p>}
      {!fil && !panne && (
        <div className="mc-attente" aria-label="Chargement">
          <i />
        </div>
      )}
      {fil && !elements.length && (
        <section className="mm-vide">
          <span aria-hidden="true">🔥</span>
          <b>Pas encore de mème du jour par ici</b>
          <p>Les commerçants ClikMe annoncent ici leur menu, leurs nouveautés, leurs bons plans. En attendant, fais le tien !</p>
          <button type="button" className="og-go" onClick={() => allerA("figurine")}>
            🎭 Créer mon mème
          </button>
        </section>
      )}
      {elements.length > 0 && (
        <>
          {fil?.ville && ailleurs > 0 && ailleurs === elements.length && <p className="dv-note">Rien encore dans ta ville aujourd’hui : voici ceux d’ailleurs.</p>}
          <ul className="dv-fil">
            {elements.map((e) => (
              <MemeDuFil key={`${e.genre}-${e.m.id}`} e={e} actif={visible} onRetire={retirer} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export const STYLES_DECOUVRIR = `
.dv{display:flex;flex-direction:column;gap:6px}
.dv-note{margin:6px 0 0;font-size:13px;color:#D9C3CB}
.dv-fil{display:flex;flex-direction:column;gap:22px;margin:14px 0 0;padding:0;list-style:none}
.dv-carte{display:flex;flex-direction:column;gap:10px}
.dv-video{position:relative;width:100%;max-width:440px;margin:0 auto;aspect-ratio:9/16;max-height:72dvh;border-radius:26px;overflow:hidden;background:#1E0918;box-shadow:0 26px 50px -24px rgba(0,0,0,.95)}
.dv-carte.client .dv-video{box-shadow:0 0 0 2px rgba(242,196,107,.55),0 26px 50px -24px rgba(0,0,0,.95)}
.dv-video video{display:block;width:100%;height:100%;object-fit:cover;cursor:pointer}
.dv-son{position:absolute;right:12px;bottom:12px;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.55);font-size:17px;pointer-events:none;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.dv-bas{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;max-width:440px;margin:0 auto}
.dv-qui{display:flex;flex-direction:column;gap:1px;min-width:0}
.dv-qui b{font-size:16.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv-qui small{font-size:12.5px;color:#D9C3CB}
.dv-signaler{padding:0;border:0;background:none;color:#8D7580;font:inherit;font-size:12px;text-decoration:underline;cursor:pointer}
.dv-actions{display:flex;align-items:center;gap:8px;flex:none}
.dv-voir{padding:10px 14px;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font-size:13.5px;font-weight:900;text-decoration:none;white-space:nowrap}
.dv-partager{min-width:42px;height:42px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:16px;font-weight:800;cursor:pointer}
`;
