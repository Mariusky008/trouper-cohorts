"use client";

/**
 * 👯 LE CARNET DE MES PROCHES (Ma maison) ET 👥 INVITER SUR CETTE VIDÉO (ma télé du jour), sans quitter la page
 * (`docs/univers/ma-maison.md`, section 25 ; les textes : `lib/direct/carnet-proches.ts`).
 *
 *   · `CarnetDesProches` : mes proches (leur maison, notre conversation), ceux qui m'ont ajouté (« L'ajouter aussi »),
 *     ceux qui doivent encore m'ajouter ; « ＋ Ajouter un proche » — mon lien, par WhatsApp ou copié ; « 👀 Comme la
 *     voient tes proches » (qui peut entrer chez moi).
 *   · `InviterSurLaVideo` : mes proches à cocher (trois au plus), « 🎬 Inviter » — ma séance se cale sur la vidéo, ils
 *     sont invités avec elle ; puis « 📺 Les attendre devant ma télé », « 📲 Leur dire par WhatsApp », ou « Continuer
 *     ici ». Et pour quelqu'un qui n'est pas encore mes proches : mon lien par WhatsApp.
 */
import { useEffect, useState } from "react";
import { PHRASES_CARNET as P, lienDeProche, lienDeSeance, lienWhatsApp } from "@/lib/direct/carnet-proches";
import { INVITES_MAX } from "@/lib/direct/salons-ouverts";
import type { ProcheVivant } from "@/lib/direct/talkie";

type Carnet = { cle: string; proches: ProcheVivant[] };

/** Mes proches et ma clé (`/api/direct/proches`) ; `recharger` après « L'ajouter aussi ». */
function useCarnet() {
  const [carnet, setCarnet] = useState<Carnet | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    let fini = false;
    void fetch("/api/direct/proches", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { proches?: ProcheVivant[]; cle?: string }) => !fini && setCarnet({ cle: j.cle ?? "", proches: j.proches ?? [] }))
      .catch(() => !fini && setCarnet({ cle: "", proches: [] }));
    return () => {
      fini = true;
    };
  }, [n]);
  return { carnet, recharger: () => setN((x) => x + 1) };
}

function Visage({ p }: { p: ProcheVivant }) {
  return (
    <span className="cp-visage" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.image ? <img src={p.image} alt="" /> : <i>{p.prenom.slice(0, 1)}</i>}
    </span>
  );
}

/** (mon lien, à envoyer : WhatsApp, ou copié) */
function MonLien({ cle }: { cle: string }) {
  const [copie, setCopie] = useState(false);
  if (!cle) return null;
  const url = lienDeProche(typeof window === "undefined" ? "" : window.location.origin, cle);
  return (
    <span className="cp-boutons">
      <a className="cp-bouton fort" href={lienWhatsApp(P.texteLien, url)} target="_blank" rel="noopener noreferrer" data-lien-whatsapp>
        {P.whatsapp}
      </a>
      <button
        type="button"
        className="cp-bouton"
        data-copier-lien
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${P.texteLien} ${url}`);
            setCopie(true);
            window.setTimeout(() => setCopie(false), 2500);
          } catch {
            window.prompt("Ton lien :", url);
          }
        }}
      >
        {copie ? P.copie : P.copier}
      </button>
    </span>
  );
}

function Feuille({ titre, data, onFermer, children }: { titre: string; data: string; onFermer: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [onFermer]);
  return (
    <div className="cp" role="dialog" aria-modal="true" aria-label={titre} {...{ [`data-${data}`]: "" }} onClick={onFermer}>
      <div className="cp-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="cp-tete">
          <b>{titre}</b>
          <button type="button" className="cp-fermer" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>
        {children}
      </div>
      <style>{STYLES_CARNET}</style>
    </div>
  );
}

/** 👯 Le carnet de mes proches (Ma maison). `onQui` : « 👀 Comme la voient tes proches ». */
export function CarnetDesProches({ onFermer, onQui }: { onFermer: () => void; onQui?: () => void }) {
  const { carnet, recharger } = useCarnet();
  const [geste, setGeste] = useState("");
  const [erreur, setErreur] = useState("");
  const l = carnet?.proches ?? [];
  const proches = l.filter((p) => p.lien === "proches");
  const ajoute = l.filter((p) => p.lien === "ajoute");
  const attend = l.filter((p) => p.lien === "attend");
  async function ajouterAussi(cle: string) {
    setGeste(cle);
    setErreur("");
    try {
      const r = await fetch("/api/direct/proches", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "proche", cle, oui: true }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "Ça n’a pas marché : réessaie.");
      recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Ça n’a pas marché : réessaie.");
    } finally {
      setGeste("");
    }
  }
  return (
    <Feuille titre={P.titre} data="carnet" onFermer={onFermer}>
      <p className="cp-chapo">{P.chapo}</p>
      {!carnet ? (
        <p className="cp-chapo" aria-busy="true">
          …
        </p>
      ) : (
        <>
          {proches.length > 0 && (
            <ul className="cp-liste" data-mes-proches>
              {proches.map((p) => (
                <li key={p.cle} data-proche={p.cle}>
                  <Visage p={p} />
                  <span className="cp-nom">
                    <b>{p.prenom}</b>
                    {p.la && <small className="cp-la">🟢 {P.la}</small>}
                  </span>
                  <a className="cp-rond" href={`/univers/chez/${encodeURIComponent(p.cle)}`} aria-label={P.maison(p.prenom)} title={P.maison(p.prenom)} data-sa-maison>
                    🏠
                  </a>
                  <a className="cp-rond" href={`/collection?parler=${encodeURIComponent(p.cle)}#proches`} aria-label={P.parler(p.prenom)} title={P.parler(p.prenom)} data-parler>
                    💬
                  </a>
                </li>
              ))}
            </ul>
          )}
          {ajoute.length > 0 && (
            <>
              <b className="cp-section">{P.ontAjoute}</b>
              <ul className="cp-liste" data-ont-ajoute>
                {ajoute.map((p) => (
                  <li key={p.cle} data-proche={p.cle}>
                    <Visage p={p} />
                    <span className="cp-nom">
                      <b>{p.prenom}</b>
                    </span>
                    <button type="button" className="cp-bouton fort petit" disabled={geste === p.cle} data-ajouter-aussi={p.cle} onClick={() => void ajouterAussi(p.cle)}>
                      {geste === p.cle ? "…" : P.ajouterAussi}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {attend.length > 0 && (
            <>
              <b className="cp-section">{P.enAttente}</b>
              <ul className="cp-liste" data-en-attente>
                {attend.map((p) => (
                  <li key={p.cle} data-proche={p.cle}>
                    <Visage p={p} />
                    <span className="cp-nom">
                      <b>{p.prenom}</b>
                      <small>{P.doitAjouter(p.prenom)}</small>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!l.length && (
            <p className="cp-chapo" data-sans-proches>
              {P.aucun}
            </p>
          )}
          {erreur && (
            <p className="cp-erreur" role="alert">
              {erreur}
            </p>
          )}
          <div className="cp-ajouter" data-ajouter-proche>
            <b>{P.ajouter}</b>
            <small>{P.ajouterDit}</small>
            <MonLien cle={carnet.cle} />
          </div>
        </>
      )}
      {onQui && (
        <button type="button" className="cp-qui" data-geste="qui" onClick={onQui}>
          <b>{P.qui}</b>
          <small>{P.quiDit}</small>
        </button>
      )}
    </Feuille>
  );
}

/** 👥 Inviter sur cette vidéo (ma télé du jour) : sans quitter la page. `position` : la seconde où j'en suis. */
export function InviterSurLaVideo({ video, position, onFermer }: { video: { id: string; titre: string }; position: () => number; onFermer: () => void }) {
  const { carnet } = useCarnet();
  const [choisis, setChoisis] = useState<string[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [fait, setFait] = useState<{ prenoms: string[]; cle: string } | null>(null);
  const proches = (carnet?.proches ?? []).filter((p) => p.lien === "proches");
  const origine = typeof window === "undefined" ? "" : window.location.origin;
  async function inviter() {
    if (!choisis.length || enCours) return;
    setEnCours(true);
    setErreur("");
    try {
      const r = await fetch("/api/direct/salons-ouverts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "inviter-video", id: video.id, t: Math.floor(position()), cles: choisis }) });
      const j = (await r.json().catch(() => ({}))) as { error?: string; invites?: string[]; cle?: string };
      if (!r.ok) throw new Error(j.error || "Ça n’a pas marché : réessaie.");
      setFait({ prenoms: proches.filter((p) => (j.invites ?? choisis).includes(p.cle)).map((p) => p.prenom), cle: j.cle || carnet?.cle || "" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Ça n’a pas marché : réessaie.");
    } finally {
      setEnCours(false);
    }
  }
  return (
    <Feuille titre={P.inviterTitre} data="inviter-video" onFermer={onFermer}>
      {fait ? (
        <>
          <p className="cp-fait" role="status" data-invites>
            {P.invites(fait.prenoms.length ? fait.prenoms : ["tes proches"])}
          </p>
          <a className="cp-bouton fort large" href="/univers/salons?chez=moi" data-aller-tele>
            {P.attendre}
          </a>
          {fait.cle && (
            <a className="cp-bouton large" href={lienWhatsApp(P.texteSeance(video.titre), lienDeSeance(origine, fait.cle))} target="_blank" rel="noopener noreferrer" data-dire-whatsapp>
              {P.direWhatsapp}
            </a>
          )}
          <button type="button" className="cp-bouton large discret" data-continuer onClick={onFermer}>
            {P.continuer}
          </button>
        </>
      ) : (
        <>
          <p className="cp-chapo">{P.inviterChapo(video.titre)}</p>
          {!carnet ? (
            <p className="cp-chapo" aria-busy="true">
              …
            </p>
          ) : proches.length ? (
            <ul className="cp-liste" data-proches-a-inviter>
              {proches.map((p) => {
                const pris = choisis.includes(p.cle);
                return (
                  <li key={p.cle}>
                    <button
                      type="button"
                      className={`cp-choix${pris ? " pris" : ""}`}
                      aria-pressed={pris}
                      data-inviter-proche={p.cle}
                      disabled={!pris && choisis.length >= INVITES_MAX}
                      onClick={() => setChoisis((l) => (pris ? l.filter((x) => x !== p.cle) : [...l, p.cle].slice(0, INVITES_MAX)))}
                    >
                      <Visage p={p} />
                      <span className="cp-nom">
                        <b>{p.prenom}</b>
                        {p.la && <small className="cp-la">🟢 {P.la}</small>}
                      </span>
                      <span className="cp-coche" aria-hidden="true">
                        {pris ? "✓" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="cp-chapo" data-sans-proches>
              {P.sansProches}
            </p>
          )}
          {choisis.length >= INVITES_MAX && <small className="cp-note">{P.auPlus(INVITES_MAX)}</small>}
          {erreur && (
            <p className="cp-erreur" role="alert">
              {erreur}
            </p>
          )}
          {proches.length > 0 && (
            <button type="button" className="cp-bouton fort large" data-inviter disabled={!choisis.length || enCours} onClick={() => void inviter()}>
              {enCours ? "…" : P.inviter(choisis.length)}
            </button>
          )}
          <a className="cp-bouton large discret" href="/univers/salons?chez=moi" data-aller-tele>
            {P.allerDevant}
          </a>
          {carnet?.cle && (
            <div className="cp-ajouter">
              <small>{P.pasEncore}</small>
              <a className="cp-bouton" href={lienWhatsApp(P.texteLien, lienDeProche(origine, carnet.cle))} target="_blank" rel="noopener noreferrer" data-lien-whatsapp>
                {P.pasEncoreLien}
              </a>
            </div>
          )}
        </>
      )}
    </Feuille>
  );
}

const STYLES_CARNET = `
.cp{position:fixed;inset:0;z-index:70;display:flex;align-items:flex-end;justify-content:center;background:rgba(10,5,4,.55);animation:cp-voile .2s ease-out}
@keyframes cp-voile{from{opacity:0}to{opacity:1}}
.cp-feuille{width:100%;max-width:520px;max-height:88svh;overflow-y:auto;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:16px 16px calc(18px + env(safe-area-inset-bottom));border-radius:22px 22px 0 0;background:#24180f;color:#fbf3ea;box-shadow:0 -10px 40px rgba(0,0,0,.5);animation:cp-monte .28s cubic-bezier(.2,.9,.25,1)}
@keyframes cp-monte{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.cp-tete{display:flex;align-items:center;justify-content:space-between;gap:10px}
.cp-tete b{font-size:17px}
.cp-fermer{width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fbf3ea;cursor:pointer}
.cp-chapo{margin:0;color:#c9b29c;font-size:14px;line-height:1.45}
.cp-section{margin-top:4px;font-size:12px;letter-spacing:.03em;text-transform:uppercase;color:#ffd98a}
.cp-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.cp-liste>li{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:16px;background:rgba(255,255,255,.06)}
.cp-liste>li:has(.cp-choix){padding:0;background:none}
.cp-visage{position:relative;flex:none;width:44px;height:44px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#e0a26a,#a8683a);box-shadow:0 0 0 2px rgba(255,179,71,.6)}
.cp-visage img{position:absolute;left:50%;top:2%;width:190%;height:auto;max-width:none;transform:translateX(-50%)}
.cp-visage i{display:grid;place-items:center;height:100%;font-style:normal;font-weight:900;color:#2b1b12}
.cp-nom{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.cp-nom b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cp-nom small{font-size:12px;color:#c9b29c}
.cp-la{color:#9be3b5!important}
.cp-rond{flex:none;width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.1);font-size:17px;text-decoration:none}
.cp-boutons{display:flex;flex-wrap:wrap;gap:8px}
.cp-bouton{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 14px;border:0;border-radius:14px;background:#33241a;box-shadow:inset 0 0 0 1px #5a4232;color:#fbf3ea;font:inherit;font-weight:800;font-size:14px;text-decoration:none;cursor:pointer}
.cp-bouton.fort{background:linear-gradient(135deg,#ff9a3c,#ff5e62);box-shadow:0 8px 20px rgba(255,94,98,.3);color:#fff}
.cp-bouton.petit{padding:8px 11px;font-size:13px;flex:none}
.cp-bouton.large{width:100%;box-sizing:border-box;padding:13px 14px;font-size:15px}
.cp-bouton.discret{background:none;box-shadow:inset 0 0 0 1px #5a4232}
.cp-bouton:disabled{opacity:.5;cursor:default}
.cp-ajouter{display:flex;flex-direction:column;gap:6px;margin-top:4px;padding:12px;border-radius:16px;background:rgba(255,211,110,.08);box-shadow:inset 0 0 0 1px rgba(255,211,110,.3)}
.cp-ajouter b{font-size:15px}
.cp-ajouter small{font-size:13px;color:#c9b29c;line-height:1.4}
.cp-qui{display:flex;flex-direction:column;gap:2px;margin-top:2px;padding:12px 14px;border:0;border-radius:16px;background:#33241a;box-shadow:inset 0 0 0 1px #5a4232;color:#fbf3ea;font:inherit;text-align:left;cursor:pointer}
.cp-qui b{font-size:15px}
.cp-qui small{font-size:13px;color:#c9b29c}
.cp-choix{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border:0;border-radius:16px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px transparent;color:#fbf3ea;font:inherit;text-align:left;cursor:pointer}
.cp-choix.pris{background:rgba(255,210,122,.14);box-shadow:inset 0 0 0 1.5px #ffd27a}
.cp-choix:disabled{opacity:.45;cursor:default}
.cp-coche{flex:none;width:26px;height:26px;display:grid;place-items:center;border-radius:50%;box-shadow:inset 0 0 0 1.5px #5a4232;font-weight:900;color:#2b1b12}
.cp-choix.pris .cp-coche{background:#ffd27a;box-shadow:none}
.cp-note{font-size:12.5px;color:#c9b29c}
.cp-fait{margin:0;padding:12px 14px;border-radius:14px;background:rgba(69,212,131,.14);color:#c9f5dc;font-weight:800;font-size:15px;line-height:1.4}
.cp-erreur{margin:0;color:#ffb4a8;font-size:14px}
@media (prefers-reduced-motion: reduce){.cp,.cp-feuille{animation:none}}
`;
