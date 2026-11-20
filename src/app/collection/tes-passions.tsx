"use client";

/**
 * 🧭 « TES PASSIONS » (`lib/direct/decouvrir.ts` ; `docs/univers/decouvrir.md`, section 3 ; le lot D0) : la première
 * fois qu'il ouvre Découvrir (et plus tard depuis Moi). Douze vignettes (onze avant ses 18 ans : le salon des jeunes
 * parents est réservé aux adultes), un toucher par passion, de 3 à 5 ; « C'est parti » les range.
 *
 * 📺 Dessous, « Tes chaînes » (le lot D8, `decouvrir.md` section 23.1) : les chaînes YouTube que je suis (10 au plus) —
 * coller un lien ou un @nom les ajoute tout de suite, ✕ les enlève ; leurs nouvelles vidéos arrivent en premier.
 */
import { useEffect, useState } from "react";
import { PASSIONS_MAX, PASSIONS_MIN, PHRASES_PASSIONS, type ThemeDecouvrir } from "@/lib/direct/decouvrir";
import { CHAINES, PHRASES_CHAINES as PC, type ChaineSuivie } from "@/lib/direct/chaines";

const ROUTE = "/api/direct/passions";
/** (la couleur de chaque vignette : celle de son salon) */
const FONDS: Record<string, [string, string]> = {
  foot: ["#2a6a50", "#123024"],
  series: ["#4f3a7a", "#20163a"],
  musique: ["#6a3366", "#29112f"],
  jeux: ["#2c2f72", "#0f1030"],
  tele: ["#7a3158", "#351427"],
  humour: ["#7a652a", "#382d11"],
  cuisine: ["#8a6240", "#45301c"],
  mode: ["#7d4f70", "#382134"],
  manga: ["#552d5c", "#22112a"],
  animaux: ["#56653a", "#27301a"],
  revisions: ["#3a5074", "#192437"],
  parents: ["#6a5078", "#32233c"],
};

export function TesPassions({ onFini, onglet = false }: { onFini?: (passions: string[]) => void; onglet?: boolean }) {
  const [themes, setThemes] = useState<ThemeDecouvrir[] | null>(null);
  const [choix, setChoix] = useState<string[]>([]);
  const [erreur, setErreur] = useState("");
  const [note, setNote] = useState("");
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    let fini = false;
    fetch(ROUTE, { cache: "no-store" })
      .then(async (r) => ({ ok: r.ok, j: (await r.json().catch(() => ({}))) as { themes?: ThemeDecouvrir[]; passions?: string[]; error?: string } }))
      .then(({ ok, j }) => {
        if (fini) return;
        if (!ok) return setErreur(j.error || "Ça n’a pas marché. Réessaie.");
        setThemes(j.themes ?? []);
        setChoix(j.passions ?? []);
      })
      .catch(() => !fini && setErreur("Pas de réseau : réessaie dans un instant."));
    return () => {
      fini = true;
    };
  }, []);

  const basculer = (id: string) => {
    setErreur("");
    setNote("");
    setChoix((l) => {
      if (l.includes(id)) return l.filter((x) => x !== id);
      if (l.length >= PASSIONS_MAX) {
        setNote(PHRASES_PASSIONS.trop);
        return l;
      }
      return [...l, id];
    });
  };

  const valider = async () => {
    setOccupe(true);
    setErreur("");
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ passions: choix }) })
      .then(async (x) => ({ ok: x.ok, j: (await x.json().catch(() => ({}))) as { passions?: string[]; error?: string } }))
      .catch(() => ({ ok: false, j: { error: "Pas de réseau : réessaie dans un instant." } as { passions?: string[]; error?: string } }));
    setOccupe(false);
    if (!r.ok) return setErreur(r.j.error || "Ça n’a pas marché. Réessaie.");
    setNote(PHRASES_PASSIONS.gardees);
    onFini?.(r.j.passions ?? choix);
  };

  return (
    <section className={`tp${onglet ? " onglet" : ""}`} aria-label={PHRASES_PASSIONS.titre}>
      <div className="tp-haut">
        <p className="tp-sur">{PHRASES_PASSIONS.sur}</p>
        <h1>{PHRASES_PASSIONS.titre}</h1>
        <p className="tp-intro">{PHRASES_PASSIONS.intro}</p>
      </div>
      {themes ? (
        <div className="tp-tuiles">
          {themes.map((t) => {
            const pris = choix.includes(t.id);
            const [a, b] = FONDS[t.id] ?? ["#4a2440", "#22101e"];
            return (
              <button key={t.id} type="button" className={`tp-tuile${pris ? " prise" : ""}`} data-passion={t.id} aria-pressed={pris} onClick={() => basculer(t.id)} style={{ background: `linear-gradient(160deg,${a},${b})` }}>
                <span className="tp-e" aria-hidden="true">
                  {t.e}
                </span>
                <span>{t.nom}</span>
                {pris && (
                  <i className="tp-coche" aria-hidden="true">
                    ✓
                  </i>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        !erreur && <p className="tp-intro">…</p>
      )}
      <p className="tp-potins">{PHRASES_PASSIONS.potins}</p>
      {themes && <MesChaines />}
      {(erreur || note) && (
        <p className={`tp-note${erreur ? " tp-erreur" : ""}`} role="status" data-note>
          {erreur || note}
        </p>
      )}
      {themes && (
        <div className="tp-bas">
          <span data-compte>{PHRASES_PASSIONS.compte(choix.length)}</span>
          <button type="button" className="tp-go" data-go disabled={occupe || choix.length < PASSIONS_MIN || choix.length > PASSIONS_MAX} onClick={valider}>
            {PHRASES_PASSIONS.go}
          </button>
        </div>
      )}
      <style>{`
.tp{min-height:100dvh;display:flex;flex-direction:column;gap:10px;max-width:480px;margin:0 auto;padding:calc(22px + env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 0 max(16px,env(safe-area-inset-left));background:radial-gradient(130% 55% at 50% 0%,#3a1430 0%,#160711 62%);color:#FFF4E6;font-family:var(--font-clikme),Poppins,system-ui,-apple-system,sans-serif}
.tp.onglet{min-height:0;padding-top:8px;background:none}
.tp.onglet .tp-bas{bottom:calc(84px + env(safe-area-inset-bottom))}
.tp-haut{display:flex;flex-direction:column;gap:8px}
.tp-sur{margin:0;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#F2C46B}
.tp h1{margin:0;font-size:30px;font-weight:900;letter-spacing:-.02em;line-height:1.1}
.tp-intro{margin:0;color:#ead3df;font-size:15px;line-height:1.45}
.tp-tuiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:6px}
.tp-tuile{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:0;aspect-ratio:1/1;border:2px solid transparent;border-radius:20px;padding:8px 4px;color:#FFF4E6;font:inherit;font-weight:800;font-size:12.5px;line-height:1.15;text-align:center;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.12);transition:transform .2s cubic-bezier(.2,1.6,.4,1);-webkit-tap-highlight-color:transparent}
.tp-tuile.prise{border-color:#FF2E9A;transform:scale(.96)}
.tp-e{font-family:var(--emoji),"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif;font-size:32px;line-height:1}
.tp-coche{position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;background:#FF2E9A;color:#fff;font-style:normal;font-size:12px;line-height:20px}
.tp-potins{margin:4px 0 0;font-size:13.5px;color:#a88a9b}
.tp-note{margin:0;padding:8px 12px;border-radius:12px;background:rgba(255,255,255,.08);font-size:13.5px;font-weight:700}
.tp-erreur{background:rgba(255,91,110,.16);color:#ff9aa6}
.tp-bas{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:auto;padding:12px 0 calc(12px + env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(22,7,17,0),#160711 30%)}
.tp-bas span{font-weight:800;color:#ead3df}
.tp-go{border:0;border-radius:999px;padding:12px 22px;font:inherit;font-weight:800;font-size:15px;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a);box-shadow:0 10px 24px -10px rgba(255,46,154,.9);cursor:pointer}
.tp-go:disabled{opacity:.4;box-shadow:none;cursor:default}
`}</style>
    </section>
  );
}

/** 📺 Tes chaînes (le lot D8) : celles que je suis ; un lien ou un @nom, « Suivre » ; ✕ pour ne plus suivre. */
function MesChaines() {
  const [chaines, setChaines] = useState<ChaineSuivie[] | null>(null);
  const [lien, setLien] = useState("");
  const [note, setNote] = useState<{ t: string; erreur?: boolean } | null>(null);
  const [occupe, setOccupe] = useState(false);
  useEffect(() => {
    let fini = false;
    fetch("/api/direct/chaines", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { chaines?: ChaineSuivie[] } | null) => !fini && setChaines(j?.chaines ?? []))
      .catch(() => !fini && setChaines([]));
    return () => {
      fini = true;
    };
  }, []);
  const poster = async (corps: Record<string, unknown>) => {
    setOccupe(true);
    setNote(null);
    const r = await fetch("/api/direct/chaines", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) })
      .then(async (x) => ({ ok: x.ok, j: (await x.json().catch(() => ({}))) as { chaines?: ChaineSuivie[]; chaine?: ChaineSuivie; deja?: boolean; error?: string } }))
      .catch(() => ({ ok: false, j: { error: "Pas de réseau : réessaie dans un instant." } as { chaines?: ChaineSuivie[]; chaine?: ChaineSuivie; deja?: boolean; error?: string } }));
    setOccupe(false);
    if (r.j.chaines) setChaines(r.j.chaines);
    return r;
  };
  const suivre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lien.trim()) return;
    const r = await poster({ action: "suivre", lien: lien.trim() });
    if (!r.ok) return setNote({ t: r.j.error || "Ça n’a pas marché. Réessaie.", erreur: true });
    setLien("");
    if (r.j.chaine) setNote({ t: r.j.deja ? PC.dejaSuivie(r.j.chaine.nom) : PC.suivie(r.j.chaine.nom) });
  };
  if (!chaines) return null;
  const plein = chaines.length >= CHAINES.max;
  return (
    <section className="tp-chaines" data-mes-chaines aria-label={PC.titre}>
      <h2>
        {PC.titre} <small>{`${chaines.length} sur ${CHAINES.max}`}</small>
      </h2>
      <p className="tp-intro">{PC.intro}</p>
      {chaines.length ? (
        <ul>
          {chaines.map((c) => (
            <li key={c.id} data-chaine={c.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.image ? <img src={c.image} alt="" referrerPolicy="no-referrer" /> : <span className="tp-rond" aria-hidden="true" />}
              <b>{c.nom}</b>
              <button
                type="button"
                aria-label={PC.enlever(c.nom)}
                data-enlever
                disabled={occupe}
                onClick={() => void poster({ action: "ne-plus-suivre", id: c.id }).then((r) => r.ok && setNote({ t: PC.plusSuivie(c.nom) }))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tp-doux">{PC.aucune}</p>
      )}
      <form onSubmit={(e) => void suivre(e)}>
        <input value={lien} onChange={(e) => setLien(e.target.value)} placeholder={PC.champ} aria-label={PC.champ} inputMode="url" autoCapitalize="none" autoCorrect="off" disabled={plein} data-lien-chaine />
        <button type="submit" disabled={occupe || plein || !lien.trim()} data-suivre>
          {PC.ajouter}
        </button>
      </form>
      {plein && <p className="tp-doux">{PC.max}</p>}
      {note && (
        <p className={`tp-note${note.erreur ? " tp-erreur" : ""}`} role="status" data-note-chaines>
          {note.t}
        </p>
      )}
      <style>{`
.tp-chaines{display:flex;flex-direction:column;gap:8px;margin-top:10px;padding:14px;border-radius:20px;background:rgba(255,255,255,.06)}
.tp-chaines h2{margin:0;font-size:18px;font-weight:900}
.tp-chaines h2 small{font-size:13px;font-weight:700;opacity:.6}
.tp-chaines ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.tp-chaines li{display:flex;align-items:center;gap:10px;min-width:0}
.tp-chaines li img,.tp-rond{width:36px;height:36px;flex:none;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.12)}
.tp-chaines li b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:15px}
.tp-chaines li button{flex:none;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-weight:900;cursor:pointer}
.tp-chaines form{display:flex;gap:8px}
.tp-chaines input{flex:1;min-width:0;border:0;border-radius:999px;padding:10px 14px;background:rgba(255,255,255,.1);color:#FFF4E6;font:inherit;font-size:16px}
.tp-chaines input::placeholder{color:#b99aab}
.tp-chaines form button{flex:none;border:0;border-radius:999px;padding:0 16px;font:inherit;font-weight:900;font-size:14px;color:#2a0f1f;background:linear-gradient(135deg,#ff6fbd,#FF2E9A 55%,#ff5a7a);cursor:pointer}
.tp-chaines form button:disabled,.tp-chaines input:disabled{opacity:.4}
.tp-doux{margin:0;font-size:13.5px;color:#a88a9b}
`}</style>
    </section>
  );
}
