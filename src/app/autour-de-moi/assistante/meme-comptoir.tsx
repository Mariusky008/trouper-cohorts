"use client";

/**
 * 🎭 MON MÈME DU JOUR — au comptoir (`lib/direct/memes-commerces.ts`, 7 novembre 2026). Chaque jour, sa figurine annonce
 * UNE chose précise à ses clients : le menu du jour, une nouveauté, la coupe du jour, une promo, un bon plan, une place
 * libre… Quatre gestes :
 *   1. CE QU'ELLE ANNONCE (dans l'ordre de son métier) ;
 *   2. CE QU'ELLE DIT : ses mots, ses prix — ClikMe n'invente rien ;
 *   3. SA VOIX, s'il veut (son enregistrement à lui) ; sinon elle danse sur la musique, ses mots défilent ;
 *   4. « Créer mon mème » : la vidéo se fabrique sous ses yeux (`meme.ts`), part sur sa page publique (`/meme/<id>`) et
 *      dans « Découvrir » pour les gens de sa ville ; il la partage telle quelle (statut WhatsApp, story).
 * Sa figurine : celle du mois s'il l'a habillée, sinon sa figurine, sinon son fantôme (qui parle aussi). Ce que son
 * mème lui rapporte (vu, « Voir sa page », partagé) s'affiche ici. Dans la démonstration (sans lien pro), le mème se
 * fabrique, mais ne part nulle part.
 */
import { useEffect, useRef, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { figurineDuMoment } from "@/lib/direct/figurine-pro";
import { fabriquerMeme, memePossible } from "@/lib/direct/meme";
import { TEXTE_MEME_COMMERCE_MAX, typesPour, type MemeCommerceVu } from "@/lib/direct/memes-commerces";
import { createClient } from "@/lib/supabase/client";
import { lireMaFigurine } from "./figurine-comptoir";
import { useMicro } from "./use-micro";

type Reponse = { ok?: boolean; error?: string; memes?: MemeCommerceVu[]; id?: string; seau?: string; chemin?: string; jeton?: string; meme?: MemeCommerceVu; lien?: string };

async function demander(c: CommerceComptoir, corps: Record<string, unknown>): Promise<Reponse> {
  if (!c.reel) return { error: "Ton mème se publie avec ton lien pro." };
  try {
    const r = await fetch("/api/site-internet/pro/meme", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: c.reel.slug, token: c.reel.token, ...corps }) });
    const j = (await r.json().catch(() => ({}))) as Reponse;
    return r.ok ? j : { ...j, error: j.error ?? "Ça n’est pas parti. Réessaie." };
  } catch {
    return { error: "Pas de réseau : réessaie dans un instant." };
  }
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? "s" : ""}`;
const jourParis = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });

export function MemeDuJour({ commerce, dossier, onRetour, onFigurine }: { commerce: CommerceComptoir; dossier: string; onRetour: () => void; onFigurine: () => void }) {
  const types = typesPour(commerce.famille);
  const [annonce, setAnnonce] = useState(types[0].cle);
  const [texte, setTexte] = useState("");
  const [avecVoix, setAvecVoix] = useState(false);
  const [voix, setVoix] = useState<{ url: string; secondes: number } | null>(null);
  const micro = useMicro();
  // sa figurine : celle du mois, sinon la sienne, sinon son fantôme (bouche fermée / ouverte)
  const [figurine, setFigurine] = useState<string | null | undefined>(commerce.reel ? undefined : null);
  const [siens, setSiens] = useState<MemeCommerceVu[]>([]);
  const [etat, setEtat] = useState<"" | "fabrication" | "envoi" | "pret">("");
  const [progres, setProgres] = useState(0);
  const [resultat, setResultat] = useState<{ url: string; fichier: File; lien?: string } | null>(null);
  const [erreur, setErreur] = useState("");
  const toile = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!commerce.reel) return;
    let vivant = true;
    void lireMaFigurine(commerce).then((e) => vivant && setFigurine(figurineDuMoment(e)));
    void demander(commerce, { action: "etat" }).then((r) => vivant && setSiens(r.memes ?? []));
    return () => {
      vivant = false;
    };
  }, [commerce]);

  const images = figurine ? { n: figurine, p: figurine } : { n: `${dossier}salut-1.webp`, p: `${dossier}parle-1.webp` };
  const quoi = types.find((t) => t.cle === annonce) ?? types[0];
  const aujourdhui = siens.find((m) => m.jour === jourParis()) ?? null;

  function enregistrer() {
    setErreur("");
    micro.ecouter((r) => {
      if (r.audio && (r.secondes ?? 0) >= 0.8) setVoix({ url: r.audio, secondes: r.secondes ?? 0 });
      else setErreur(r.erreur || "Ta voix n’a pas été entendue. Réessaie, un peu plus près du micro.");
    }, true);
  }

  async function creer() {
    const t = texte.trim();
    if (!t) return setErreur("Écris d’abord ce que ta figurine annonce.");
    if (avecVoix && !voix) return setErreur("Enregistre ta voix, ou choisis la musique.");
    if (!memePossible() || !toile.current) return setErreur("Ce téléphone ne sait pas fabriquer de vidéo. Essaie avec un autre navigateur.");
    // (le son s'ouvre DANS le toucher : sur iPhone, c'est maintenant ou jamais)
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    void ctx.resume().catch(() => undefined);
    setErreur("");
    setResultat(null);
    setProgres(0);
    setEtat("fabrication");
    try {
      const m = await fabriquerMeme({
        ctx,
        toile: toile.current,
        images,
        ...(avecVoix && voix ? { son: voix.url } : {}),
        texte: t,
        ecouter: true,
        annonce: { emoji: quoi.emoji, titre: quoi.titre, nom: commerce.nom },
        fin: { emoji: "📍", titre: commerce.nom, sous: "clikme.fr" },
        surProgres: setProgres,
      });
      const ext = m.type.includes("mp4") ? "mp4" : "webm";
      const fichier = new File([m.blob], `meme-${commerce.nom.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) || "clikme"}.${ext}`, { type: m.type });
      const url = URL.createObjectURL(m.blob);
      if (!commerce.reel) {
        setResultat({ url, fichier });
        setEtat("pret");
        return;
      }
      // il part : la vidéo au seau public, puis sa fiche (sa page, « Découvrir »)
      setEtat("envoi");
      const a = await demander(commerce, { action: "envoi", type: m.type });
      if (a.error || !a.id || !a.seau || !a.chemin || !a.jeton) throw new Error(a.error || "Ton mème n’a pas pu partir. Réessaie.");
      const { error } = await createClient().storage.from(a.seau).uploadToSignedUrl(a.chemin, a.jeton, m.blob, { contentType: m.type });
      if (error) throw new Error("Ton mème n’a pas pu partir. Réessaie.");
      const p = await demander(commerce, { action: "publier", id: a.id, annonce: quoi.cle, texte: t, videoType: m.type, image: images.n, voix: Boolean(avecVoix && voix) });
      if (p.error || !p.meme) throw new Error(p.error || "Ton mème n’a pas pu être rangé.");
      setResultat({ url, fichier, lien: `${window.location.origin}${p.lien}` });
      setSiens((l) => [{ ...p.meme!, vues: 0, visites: 0, partages: 0 }, ...l]);
      setEtat("pret");
    } catch (e) {
      setErreur((e as Error).message);
      setEtat("");
    } finally {
      void ctx.close().catch(() => undefined);
    }
  }

  async function partager() {
    if (!resultat) return;
    try {
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [resultat.fichier] })) await navigator.share({ files: [resultat.fichier] });
      else if (resultat.lien && typeof navigator.share === "function") await navigator.share({ url: resultat.lien });
    } catch {
      /* il a fermé la feuille de partage */
    }
  }

  const enCours = etat === "fabrication" || etat === "envoi";
  return (
    <div className="mf mj">
      <style>{STYLES_MJ}</style>
      <div className="mf-haut">
        <button type="button" className="mf-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        <span className="mf-titre">🎭 Mon mème du jour</span>
      </div>
      <div className="mf-corps">
        <p className="mf-intro">
          Chaque jour, <b>ta figurine annonce une chose</b> à tes clients. Ils la voient sur tes réseaux, et dans « Découvrir » de ClikMe, pour les gens de ta ville.
        </p>

        {/* CE QUE SON MÈME DU JOUR LUI RAPPORTE */}
        {aujourdhui && etat !== "pret" && (
          <section className="mj-aujourdhui" aria-label="Ton mème d’aujourd’hui">
            <b>
              ✓ Ton mème d’aujourd’hui : {aujourdhui.emoji} {aujourdhui.titre}
            </b>
            <span className="mj-chiffres">
              <span>👀 {pluriel(aujourdhui.vues, "vue")}</span>
              <span>📍 {pluriel(aujourdhui.visites, "visite")} de ta page</span>
              <span>📲 {pluriel(aujourdhui.partages, "partage")}</span>
            </span>
            <a href={`/meme/${aujourdhui.id}`} target="_blank" rel="noopener noreferrer">
              Le revoir ›
            </a>
          </section>
        )}

        {/* 1. CE QU'ELLE ANNONCE */}
        <section className="mj-bloc">
          <h3>1. Aujourd’hui, ta figurine annonce…</h3>
          <div className="mj-types" role="radiogroup" aria-label="Ce qu’elle annonce">
            {types.map((t) => (
              <button key={t.cle} type="button" role="radio" aria-checked={annonce === t.cle} className={annonce === t.cle ? "pris" : ""} onClick={() => setAnnonce(t.cle)} disabled={enCours}>
                <span aria-hidden="true">{t.emoji}</span> {t.titre}
              </button>
            ))}
          </div>
        </section>

        {/* 2. CE QU'ELLE DIT */}
        <section className="mj-bloc">
          <h3>2. Ce qu’elle dit</h3>
          <label className="mj-texte">
            <textarea value={texte} maxLength={TEXTE_MEME_COMMERCE_MAX} rows={3} placeholder={quoi.aide} onChange={(e) => setTexte(e.target.value)} aria-label="Ce qu’elle dit" disabled={enCours} />
            <small>
              {texte.length} / {TEXTE_MEME_COMMERCE_MAX}
            </small>
          </label>
          <small className="mj-note">Tes mots, tes prix : ClikMe n’invente jamais rien à ta place.</small>
        </section>

        {/* 3. SA VOIX */}
        <section className="mj-bloc">
          <h3>3. Sa voix</h3>
          <div className="mj-voix" role="radiogroup" aria-label="Sa voix">
            <button type="button" role="radio" aria-checked={!avecVoix} className={!avecVoix ? "pris" : ""} onClick={() => setAvecVoix(false)} disabled={enCours}>
              🎵 La musique
              <small>elle danse, tes mots défilent</small>
            </button>
            <button type="button" role="radio" aria-checked={avecVoix} className={avecVoix ? "pris" : ""} onClick={() => setAvecVoix(true)} disabled={enCours}>
              🎙️ Ma voix
              <small>tu le dis, elle parle</small>
            </button>
          </div>
          {avecVoix && (
            <div className="mj-micro">
              <button type="button" className={`mj-enreg${micro.ecoute ? " ecoute" : ""}`} onClick={enregistrer} disabled={enCours}>
                {micro.ecoute ? "■ J’ai fini" : voix ? "🎙️ Refaire" : "🎙️ Enregistrer ma voix"}
              </button>
              {voix && !micro.ecoute && (
                <>
                  <span className="mj-ok">✓ Ta voix ({Math.round(voix.secondes)} s)</span>
                  <audio src={voix.url} controls preload="metadata" />
                </>
              )}
              {micro.ecoute && <small className="mj-note">Je t’écoute… dis ton annonce, puis touche « J’ai fini ».</small>}
            </div>
          )}
        </section>

        {/* SA FIGURINE */}
        <section className="mj-fig">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images.n} alt="" />
          <span>
            <b>{figurine ? "Ta figurine l’annonce" : "Ton fantôme l’annonce"}</b>
            {!figurine && (
              <button type="button" className="mj-lien" onClick={onFigurine}>
                Avec ta figurine (un selfie, une minute) ›
              </button>
            )}
          </span>
        </section>

        {/* 4. LE CRÉER */}
        <canvas ref={toile} className={`mj-toile${etat === "fabrication" ? " visible" : ""}`} aria-hidden="true" />
        {enCours ? (
          <div className="mj-cours" role="status">
            <b>{etat === "fabrication" ? "🎬 Ton mème se fabrique…" : "📣 Il part…"}</b>
            <span className="mj-jauge">
              <i style={{ width: `${Math.round((etat === "envoi" ? 1 : progres) * 100)}%` }} />
            </span>
          </div>
        ) : resultat ? (
          <section className="mj-pret">
            <b>Ton mème du jour est prêt ✓</b>
            <video src={resultat.url} autoPlay loop muted playsInline onClick={(e) => (e.currentTarget.muted = !e.currentTarget.muted)} />
            <button type="button" className="mj-go" onClick={partager}>
              📲 Le partager (statut, story)
            </button>
            {resultat.lien ? (
              <>
                <span className="mj-ok">✓ Dans « Découvrir », pour les gens de ta ville</span>
                <input className="mj-adresse" readOnly value={resultat.lien} aria-label="Son lien" onFocus={(e) => e.target.select()} />
              </>
            ) : (
              <small className="mj-note">Dans la démonstration, ton mème reste sur ce téléphone.</small>
            )}
            <a className="mj-lien" href={resultat.url} download={resultat.fichier.name}>
              ⬇️ La vidéo
            </a>
            <button type="button" className="mj-lien" onClick={() => setResultat(null)}>
              En faire un autre
            </button>
          </section>
        ) : (
          <button type="button" className="mj-go" onClick={creer} disabled={!texte.trim() || (avecVoix && !voix) || micro.ecoute}>
            🎬 Créer mon mème
          </button>
        )}
        {erreur && (
          <p className="mj-erreur" role="alert">
            {erreur}
          </p>
        )}
      </div>
    </div>
  );
}

const STYLES_MJ = `
.mf{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;background:var(--fond);overflow:hidden;}
.mf-haut{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px 0;}
.mf-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;color:var(--creme);}
.mf-titre{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--rose);}
.mf-corps{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:14px;padding:14px 16px calc(28px + env(safe-area-inset-bottom,0px));scrollbar-width:none;}
.mf-corps::-webkit-scrollbar{display:none;}
.mf-intro{margin:0;padding:14px;border-radius:20px;background:var(--nappe);border:1px solid var(--trait);font-size:15px;line-height:1.42;}
.mf-intro b{color:var(--ambre);}
.mj-bloc{display:flex;flex-direction:column;gap:8px}
.mj-bloc h3{margin:0;font-size:16px;font-weight:800;color:var(--creme)}
.mj-types{display:flex;flex-wrap:wrap;gap:8px}
.mj-types button{padding:9px 13px;border-radius:999px;border:1.5px solid var(--trait);background:var(--nappe);color:var(--creme);font:inherit;font-size:14px;font-weight:700;cursor:pointer}
.mj-types button.pris{border-color:var(--rose);background:rgba(255,46,154,.16)}
.mj-texte{position:relative;display:block}
.mj-texte textarea{width:100%;box-sizing:border-box;padding:12px 14px 24px;border-radius:18px;border:1.5px solid var(--trait);background:var(--nappe);color:var(--creme);font:inherit;font-size:16px;line-height:1.4;resize:none}
.mj-texte small{position:absolute;right:12px;bottom:8px;font-size:11.5px;color:var(--gris)}
.mj-note{font-size:12.5px;color:var(--gris)}
.mj-voix{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mj-voix button{display:flex;flex-direction:column;gap:2px;padding:11px 12px;border-radius:18px;border:1.5px solid var(--trait);background:var(--nappe);color:var(--creme);font:inherit;font-size:15px;font-weight:800;text-align:left;cursor:pointer}
.mj-voix button small{font-size:12px;font-weight:600;color:var(--gris)}
.mj-voix button.pris{border-color:var(--rose);background:rgba(255,46,154,.16)}
.mj-micro{display:flex;flex-direction:column;gap:8px}
.mj-micro audio{width:100%;height:36px}
.mj-enreg{align-self:flex-start;padding:11px 18px;border-radius:999px;border:0;background:var(--rose);color:#fff;font:inherit;font-weight:800;cursor:pointer}
.mj-enreg.ecoute{background:#E0344A;animation:mj-pouls 1.2s ease-in-out infinite}
.mj-ok{font-size:13.5px;font-weight:800;color:#3DE2A6}
.mj-fig{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:20px;background:var(--nappe);border:1px solid var(--trait)}
.mj-fig img{width:64px;height:80px;object-fit:contain;border-radius:14px;background:linear-gradient(160deg,#E0218A,#7A1150)}
.mj-fig span{display:flex;flex-direction:column;gap:4px;align-items:flex-start}
.mj-lien{padding:0;border:0;background:none;color:var(--rose);font:inherit;font-size:14px;font-weight:800;text-decoration:none;cursor:pointer;align-self:center}
.mj-fig .mj-lien{align-self:flex-start}
.mj-toile{display:none;width:min(260px,70vw);aspect-ratio:9/16;height:auto;align-self:center;border-radius:22px;box-shadow:0 20px 40px -18px rgba(0,0,0,.9)}
.mj-toile.visible{display:block}
.mj-cours{display:flex;flex-direction:column;gap:8px;text-align:center}
.mj-jauge{display:block;height:8px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}
.mj-jauge i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#FF2E9A,#F2C46B);transition:width .2s}
.mj-go{width:100%;padding:16px 20px;border-radius:999px;border:0;background:linear-gradient(135deg,#FF2E9A,#FF7A59);color:#fff;font:inherit;font-size:17px;font-weight:900;cursor:pointer;box-shadow:0 14px 30px -12px rgba(255,46,154,1)}
.mj-go:disabled{opacity:.45;cursor:default}
.mj-pret{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.mj-pret video{width:min(260px,70vw);aspect-ratio:9/16;border-radius:22px;background:#000;object-fit:cover}
.mj-adresse{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:14px;border:1px solid var(--trait);background:var(--nappe);color:var(--gris);font:inherit;font-size:13px}
.mj-aujourdhui{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border-radius:20px;background:rgba(61,226,166,.08);border:1.5px solid rgba(61,226,166,.45)}
.mj-aujourdhui a{align-self:flex-start;color:var(--rose);font-weight:800;text-decoration:none}
.mj-chiffres{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:13.5px;color:var(--creme)}
.mj-erreur{margin:0;padding:10px 12px;border-radius:14px;background:rgba(224,52,74,.14);color:#FFB3BE;font-size:14px}
@keyframes mj-pouls{50%{transform:scale(1.05)}}
`;
