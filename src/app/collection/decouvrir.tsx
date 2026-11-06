"use client";

/**
 * 🔥 « DÉCOUVRIR » — 7 novembre 2026 (le patron : « pour les commerçants, ça devrait être plutôt découvrir les figurines
 * et les mèmes des autres »). Le fil des mèmes du jour des commerçants ClikMe de sa ville (puis d'ailleurs, s'il y en a
 * peu) : leur menu, leur nouveauté, leur bon plan, annoncés par leur figurine (`lib/direct/memes-commerces.ts`).
 *   · chaque vidéo joue toute seule, en silence, quand on la voit (un toucher : le son) ;
 *   · « 📍 Voir sa page » (compté : c'est ce que son mème rapporte au commerçant), « 📲 Partager » ;
 *   · seulement les mèmes des commerçants — ceux des clients ne sont jamais publics sans leur accord.
 * La liste se recharge à chaque fois qu'il ouvre l'onglet.
 */
import { useContext, useEffect, useRef, useState } from "react";
import type { MemeCommerce } from "@/lib/direct/memes-commerces";
import { GuideDit, OngletVisible } from "./guide";

/** « aujourd'hui », « hier », « 6 nov. » (heure de Paris). */
function quand(le: string): string {
  const jour = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const d = new Date(le);
  if (Number.isNaN(d.getTime())) return "";
  if (jour(d) === jour(new Date())) return "aujourd’hui";
  if (jour(d) === jour(new Date(Date.now() - 86_400_000))) return "hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
}

/** Un mème du fil : il joue quand on le voit (en silence), s'arrête quand on passe ; un toucher : le son. */
function MemeDuFil({ m, actif }: { m: MemeCommerce; actif: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [muet, setMuet] = useState(true);
  const [partage, setPartage] = useState("");
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (!actif) {
      v.pause();
      return;
    }
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) void v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    o.observe(v);
    return () => o.disconnect();
  }, [actif]);
  async function partager() {
    const lien = `${window.location.origin}/meme/${m.id}`;
    void fetch("/api/direct/memes-commerces", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "geste", type: "partage", id: m.id }) }).catch(() => undefined);
    try {
      if (typeof navigator.share === "function") return await navigator.share({ url: lien, title: `${m.emoji} ${m.titre} · ${m.nom}` });
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
  return (
    <li className="dv-carte">
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
        <span className="dv-qui">
          <b>{m.nom}</b>
          <small>
            {m.emoji} {m.titre}
            {m.ville ? ` · ${m.ville}` : ""} · {quand(m.le)}
          </small>
        </span>
        <span className="dv-actions">
          <a className="dv-voir" href={`/meme/${m.id}/voir`}>
            📍 Voir sa page
          </a>
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
  const [fil, setFil] = useState<{ memes: MemeCommerce[]; ville: string } | null>(null);
  const [panne, setPanne] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let fini = false;
    fetch("/api/direct/memes-commerces", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { memes?: MemeCommerce[]; ville?: string }) => {
        if (fini) return;
        setFil({ memes: Array.isArray(j.memes) ? j.memes : [], ville: j.ville ?? "" });
        setPanne(false);
      })
      .catch(() => !fini && setPanne(true));
    return () => {
      fini = true;
    };
  }, [visible]);
  const ailleurs = fil ? fil.memes.filter((m) => fil.ville && m.villeSlug !== fil.ville).length : 0;
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
          { t: "Ici, les mèmes du jour des commerçants ClikMe 🔥", v: "euphorie" },
          { t: "Leur menu, leurs nouveautés, leurs bons plans… c’est leur figurine qui te l’annonce.", v: "joie" },
          { t: "Un mème te plaît ? Va voir leur page, ou envoie-le à un ami 📲", v: "joie", apres: "louche" },
        ]}
      />
      {panne && <p className="mc-vide">Le fil n’a pas pu s’afficher. Réessaie dans un instant.</p>}
      {!fil && !panne && (
        <div className="mc-attente" aria-label="Chargement">
          <i />
        </div>
      )}
      {fil && !fil.memes.length && (
        <section className="mm-vide">
          <span aria-hidden="true">🔥</span>
          <b>Pas encore de mème du jour par ici</b>
          <p>Les commerçants ClikMe annoncent ici leur menu, leurs nouveautés, leurs bons plans. En attendant, fais le tien !</p>
          <button type="button" className="og-go" onClick={() => allerA("figurine")}>
            🎭 Créer mon mème
          </button>
        </section>
      )}
      {fil && fil.memes.length > 0 && (
        <>
          {fil.ville && ailleurs > 0 && ailleurs === fil.memes.length && <p className="dv-note">Rien encore dans ta ville aujourd’hui : voici ceux d’ailleurs.</p>}
          <ul className="dv-fil">
            {fil.memes.map((m) => (
              <MemeDuFil key={m.id} m={m} actif={visible} />
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
.dv-video video{display:block;width:100%;height:100%;object-fit:cover;cursor:pointer}
.dv-son{position:absolute;right:12px;bottom:12px;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.55);font-size:17px;pointer-events:none;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.dv-bas{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;max-width:440px;margin:0 auto}
.dv-qui{display:flex;flex-direction:column;gap:1px;min-width:0}
.dv-qui b{font-size:16.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv-qui small{font-size:12.5px;color:#D9C3CB}
.dv-actions{display:flex;align-items:center;gap:8px;flex:none}
.dv-voir{padding:10px 14px;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font-size:13.5px;font-weight:900;text-decoration:none;white-space:nowrap}
.dv-partager{min-width:42px;height:42px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.07);color:#FFF4E6;font:inherit;font-size:16px;font-weight:800;cursor:pointer}
`;
