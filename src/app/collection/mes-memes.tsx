"use client";

/**
 * 📥 « MES MÈMES » — 7 novembre 2026, à la place de l'album (le patron : « la page album, on a du mal à voir à quoi elle
 * sert » ; on resserre sur le mème) :
 *   · ↩️ ON T'A RÉPONDU : les réponses en duo qu'on a faites à ses mèmes — les regarder, et répondre à son tour ;
 *   · 🎭 SES MÈMES : vus combien de fois, combien de réponses ;
 *   · 📥 REÇUS : ceux qu'il a ouverts sur ce téléphone (`CLE_MEMES_RECUS`, noté par la page du mème) — y répondre quand
 *     il veut.
 * Une raison de revenir : voir ce que ses mèmes sont devenus. La liste se recharge à chaque fois qu'il ouvre l'onglet.
 * 🗑️ Il efface un des siens (8 novembre 2026) : une fenêtre de ClikMe le lui redemande (`fenetre.tsx`), puis il quitte tout.
 */
import { useContext, useEffect, useState, type ReactNode } from "react";
import { CLE_MEMES_RECUS, MEMES_VUS, REFUS_AGE, type ApercuMeme, type MesMemes, type MonMeme } from "@/lib/direct/ma-figurine";
import { demanderSonAge } from "./age";
import { accordPublic, demanderOui } from "./fenetre";
import { OngletVisible } from "./guide";

function idsRecus(): string[] {
  try {
    const l = JSON.parse(window.localStorage.getItem(CLE_MEMES_RECUS) || "[]") as unknown;
    return Array.isArray(l) ? l.filter((x): x is string => typeof x === "string" && /^[a-z0-9]{12}$/.test(x)).slice(0, MEMES_VUS) : [];
  } catch {
    return [];
  }
}

/** « aujourd'hui », « hier », « 6 nov. » (heure de Paris). */
function quand(le: string): string {
  const jour = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const d = new Date(le);
  if (Number.isNaN(d.getTime())) return "";
  const auj = jour(new Date());
  if (jour(d) === auj) return "aujourd’hui";
  if (jour(new Date(Date.now() - 86_400_000)) === jour(d)) return "hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/** Une vignette : son image, ▶ s'il a sa vidéo ; la toucher ouvre le mème. */
function Vignette({ m, children, classe = "" }: { m: ApercuMeme; children?: ReactNode; classe?: string }) {
  return (
    <li className={`mm-carte ${classe}`}>
      <a className="mm-image" href={`/figurine/${m.id}`} aria-label={`Voir le mème${m.prenom ? ` de ${m.prenom}` : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.image} alt="" loading="lazy" />
        {m.video && (
          <i className="mm-play" aria-hidden="true">
            ▶
          </i>
        )}
        {m.texte && (
          <span className="mm-texte">
            <span>{m.texte}</span>
          </span>
        )}
      </a>
      {children}
    </li>
  );
}

export function MesMemes({ compte, allerA }: { compte: boolean | null; allerA: (o: string) => void }) {
  const visible = useContext(OngletVisible);
  const [memes, setMemes] = useState<MesMemes | null>(null);
  const [panne, setPanne] = useState(false);
  // (à chaque fois qu'il ouvre l'onglet : ses mèmes ont peut-être été vus, ou on lui a répondu)
  useEffect(() => {
    if (!visible || compte == null) return;
    let fini = false;
    const recus = idsRecus();
    fetch(`/api/direct/ma-figurine?memes=1${recus.length ? `&recus=${recus.join(",")}` : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { memes?: MesMemes }) => {
        if (fini) return;
        setMemes(j.memes ?? { envoyes: [], reponses: [], recus: [] });
        setPanne(false);
      })
      .catch(() => !fini && setPanne(true));
    return () => {
      fini = true;
    };
  }, [visible, compte]);

  const [erreur, setErreur] = useState("");
  /** 🌍 Le montrer dans « Découvrir » (son accord, demandé à chaque fois) — ou le retirer. */
  async function basculerPublic(m: MonMeme) {
    setErreur("");
    if (!m.public && !(await accordPublic())) return;
    const basculer = async () => {
      const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "public", id: m.id, public: !m.public }) }).catch(() => null);
      return { ok: Boolean(r?.ok), ...((await r?.json().catch(() => ({}))) as { public?: boolean; error?: string; age?: boolean } | undefined) };
    };
    let j = await basculer();
    // 🔞 il n'a pas encore déclaré son âge : une fois, puis le geste repart
    if (!j.ok && j.age) {
      if (!(await demanderSonAge())) return setErreur(REFUS_AGE);
      j = await basculer();
    }
    if (!j.ok) return setErreur(j.error || "Ça n’a pas marché. Réessaie.");
    setMemes((x) => (x ? { ...x, envoyes: x.envoyes.map((e) => (e.id === m.id ? { ...e, public: Boolean(j.public) } : e)) } : x));
  }

  /** 🗑️ Il efface un de ses mèmes (8 novembre 2026) : partout, et pour de bon — on le lui dit avant. */
  async function effacer(m: MonMeme) {
    setErreur("");
    const oui = await demanderOui({
      emoji: "🗑️",
      titre: "Effacer ce mème ?",
      texte: "Il disparaît partout — « Découvrir », « Autour » — et son lien ne mènera plus à rien. C’est pour de bon.",
      oui: "Effacer",
      danger: true,
    });
    if (!oui) return;
    const r = await fetch("/api/direct/ma-figurine", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "effacer", id: m.id }) }).catch(() => null);
    if (!r?.ok) return setErreur(((await r?.json().catch(() => ({}))) as { error?: string } | undefined)?.error || "Pas effacé. Réessaie dans un instant.");
    setMemes((x) => (x ? { ...x, envoyes: x.envoyes.filter((e) => e.id !== m.id) } : x));
  }

  const vide = memes && !memes.envoyes.length && !memes.reponses.length && !memes.recus.length;
  return (
    <div className="mm">
      <header className="og-tete">
        <small>MES MÈMES</small>
        <h2>Ce que tes mèmes deviennent</h2>
      </header>
      {/* (9 novembre 2026 : Pablito explique « Mes mèmes » dans la visite, sous le logo — plus de fenêtre ici) */}
      {panne && <p className="mc-vide">Tes mèmes n’ont pas pu s’afficher. Réessaie dans un instant.</p>}
      {!memes && !panne && (
        <div className="mc-attente" aria-label="Chargement">
          <i />
        </div>
      )}

      {vide && (
        <section className="mm-vide">
          <span aria-hidden="true">🎭</span>
          <b>{compte ? "Pas encore de mème" : "Ton premier mème t’attend"}</b>
          <p>{compte ? "Fais parler ta figurine, partage-la : tu verras ici qui l’a vue, et qui t’a répondu." : "Crée ta figurine (une minute, gratuit), fais-la parler, partage-la."}</p>
          <button type="button" className="og-go" onClick={() => allerA("figurine")}>
            {compte ? "🎭 Créer mon premier mème" : "📸 Créer ma figurine"}
          </button>
        </section>
      )}

      {/* ↩️ ON T'A RÉPONDU */}
      {memes && memes.reponses.length > 0 && (
        <section className="mm-bloc mm-reponses" aria-label="On t’a répondu">
          <h3>
            ↩️ On t’a répondu <span className="mc-total">{memes.reponses.length}</span>
          </h3>
          <ul className="mm-grille">
            {memes.reponses.map((m) => (
              <Vignette key={m.id} m={m} classe="reponse">
                <span className="mm-qui">
                  <span>
                    <b>{m.prenom || "Quelqu’un"}</b> t’a répondu · {quand(m.le)}
                  </span>
                  {m.aTexte && <small>à « {m.aTexte.length > 50 ? `${m.aTexte.slice(0, 50)}…` : m.aTexte} »</small>}
                </span>
                <a className="mm-repondre" href={`/figurine/${m.id}/repondre`}>
                  ↩️ Lui répondre
                </a>
              </Vignette>
            ))}
          </ul>
        </section>
      )}

      {/* 🎭 SES MÈMES */}
      {memes && memes.envoyes.length > 0 && (
        <section className="mm-bloc" aria-label="Mes mèmes">
          <h3>
            🎭 Mes mèmes <span className="mc-total">{memes.envoyes.length}</span>
          </h3>
          <ul className="mm-grille">
            {memes.envoyes.map((m) => (
              <Vignette key={m.id} m={m}>
                <button type="button" className="mm-effacer" aria-label="Effacer ce mème" onClick={() => void effacer(m)}>
                  🗑️
                </button>
                <span className="mm-chiffres">
                  <span>👀 {pluriel(m.vues, "vue")}</span>
                  {m.reponses > 0 && <span className="fort">↩️ {pluriel(m.reponses, "réponse")}</span>}
                  {/* 😂 ❤️ 🔥 ce que les gens en ont pensé, dans « Découvrir » (de vrais chiffres) */}
                  {m.reac && (
                    <span className="mm-reac">
                      {m.reac.rire > 0 && <>😂 {m.reac.rire} </>}
                      {m.reac.coeur > 0 && <>❤️ {m.reac.coeur} </>}
                      {m.reac.feu > 0 && <>🔥 {m.reac.feu}</>}
                    </span>
                  )}
                </span>
                <small className="mm-quand">{quand(m.le)}</small>
                {/* 🌍 DANS « DÉCOUVRIR », S'IL LE VEUT (jamais un duo : il montre aussi la figurine de quelqu'un d'autre) */}
                {m.video && !m.duo && (
                  <button type="button" className={`mm-public${m.public ? " pris" : ""}`} aria-pressed={Boolean(m.public)} onClick={() => basculerPublic(m)}>
                    {m.public ? "🌍 Dans Découvrir · retirer" : "🌍 Montrer dans Découvrir"}
                  </button>
                )}
              </Vignette>
            ))}
          </ul>
          {erreur && (
            <p className="tf-erreur" role="alert">
              {erreur}
            </p>
          )}
          <button type="button" className="mp-bouton mm-encore" onClick={() => allerA("figurine")}>
            🎭 Créer un autre mème
          </button>
        </section>
      )}

      {/* 📥 REÇUS (sur ce téléphone) */}
      {memes && memes.recus.length > 0 && (
        <section className="mm-bloc" aria-label="Reçus">
          <h3>📥 Reçus</h3>
          <ul className="mm-grille">
            {memes.recus.map((m) => (
              <Vignette key={m.id} m={m}>
                <span className="mm-qui">
                  <span>
                    <b>{m.prenom || "Quelqu’un"}</b> · {quand(m.le)}
                  </span>
                </span>
                <a className="mm-repondre" href={`/figurine/${m.id}/repondre`}>
                  ↩️ Répondre
                </a>
              </Vignette>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export const STYLES_MES_MEMES = `
.mm{display:flex;flex-direction:column;gap:6px}
.mm-bloc{margin-top:22px}
.mm-bloc h3{margin:0 0 12px;font-size:19px;font-weight:900}
.mm-grille{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0;padding:0;list-style:none}
.mm-carte{position:relative;display:flex;flex-direction:column;gap:6px;min-width:0}
.mm-effacer{position:absolute;top:8px;left:8px;z-index:2;display:grid;place-items:center;width:34px;height:34px;padding:0;border-radius:50%;border:0;background:rgba(18,6,15,.72);color:#fff;font-size:15px;line-height:1;cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 6px 14px -6px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.14)}
.mm-image{position:relative;display:block;aspect-ratio:9/13;border-radius:20px;overflow:hidden;background:#2a0f1f;box-shadow:0 18px 30px -18px rgba(0,0,0,.95);border:1.5px solid rgba(255,255,255,.1)}
.mm-image img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 25%}
.mm-play{position:absolute;right:8px;top:8px;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-style:normal;font-size:12px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.mm-texte{position:absolute;left:0;right:0;bottom:0;padding:22px 9px 9px;background:linear-gradient(180deg,transparent,rgba(0,0,0,.8));color:#fff;font-size:12.5px;font-weight:900;line-height:1.2;text-transform:uppercase}
.mm-texte > span{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.mm-chiffres{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12.5px;font-weight:800;color:#E8D3DC}
.mm-chiffres .fort{color:#F2C46B}
.mm-quand{font-size:11.5px;color:#A88E99}
.mm-qui{display:flex;flex-direction:column;gap:1px;font-size:12.5px;color:#D9C3CB}
.mm-qui b{color:#FFF4E6}
.mm-qui small{font-size:11.5px;color:#A88E99;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mm-repondre{align-self:flex-start;padding:7px 12px;border-radius:999px;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font-size:12.5px;font-weight:900;text-decoration:none}
.mm-reponses .mm-image{border-color:rgba(242,196,107,.75);box-shadow:0 0 0 3px rgba(242,196,107,.18),0 18px 30px -18px rgba(0,0,0,.95)}
.mm-encore{margin-top:14px}
.mm-public{align-self:flex-start;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#E8D3DC;font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.mm-public.pris{border-color:rgba(61,226,166,.6);background:rgba(61,226,166,.12);color:#9BF2CF}
.mm-vide{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:22px;padding:26px 18px;border-radius:26px;background:radial-gradient(80% 60% at 50% 0%,rgba(255,46,154,.2),transparent 70%),rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);text-align:center}
.mm-vide > span{font-size:46px}
.mm-vide b{font-size:19px}
.mm-vide p{margin:0;max-width:340px;color:#D9C3CB}
@media (min-width:860px){.mm-grille{grid-template-columns:repeat(4,minmax(0,1fr))}}
`;
