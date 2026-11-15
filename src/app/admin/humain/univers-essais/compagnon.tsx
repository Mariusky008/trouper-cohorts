"use client";

/**
 * 🐾 LE COMPAGNON — L'ESSAI DU CHAT, LOT C0 (`docs/univers/compagnon.md` ; `lib/direct/compagnon-essai-serveur.ts`). Le
 * propriétaire, le 15 novembre 2026 : « commence directement par lancer C0 le chat ». Son image de référence (dans le
 * style de ta figurine), puis ses huit boucles (une pose, puis quelques secondes de vidéo sur un fond vert), et l'aperçu
 * « chez toi » : ton décor, ta figurine assise, et le chat à côté d'elle ou sur ses genoux, le vert retiré dans le
 * téléphone. Le verdict (le style, la constance, le poids) décide de la suite ; rien d'autre ne commence avant.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { BOUCLES, COUT, type Boucle, type EtatCompagnonEssai } from "@/lib/direct/compagnons";
import { CompagnonVivant } from "@/app/univers/compagnon-vivant";

const ROUTE = "/api/admin/direct/compagnon";
const pause = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
type Reponse = { etat?: EtatCompagnonEssai; error?: string; fait?: string; progres?: number };
const total = COUT.reference + BOUCLES.length * (COUT.pose + COUT.boucle);
const euros = (x: number) => x.toFixed(2).replace(".", ",");
/** (la vidéo : l'animal en occupe le bas, au-dessus d'une marge de 17 % — ses pieds doivent toucher le sol du décor) */
const PIED = 0.17;
const bouton: CSSProperties = { padding: "8px 14px", borderRadius: 999, border: "1px solid #c9b8a4", background: "#fff", fontWeight: 700 };
const damier: CSSProperties = { background: "repeating-conic-gradient(#efe6da 0% 25%, #fbf6ef 0% 50%) 50% / 16px 16px" };

export function CompagnonEssai() {
  const [etat, setEtat] = useState<EtatCompagnonEssai | null>(null);
  const [occupe, setOccupe] = useState<{ cible: string; progres?: number } | null>(null);
  const [dit, setDit] = useState("");
  const [vue, setVue] = useState<Boucle>("assis");
  const [brut, setBrut] = useState(false);
  // 🔊 (15 novembre 2026, « il faudrait qu'on l'entende ronronner ») son vrai son, dans l'aperçu — coupé au départ
  const [avecSon, setAvecSon] = useState(false);
  const son = useRef<HTMLAudioElement>(null);

  const charger = useCallback(async () => {
    const j = (await (await fetch(`${ROUTE}?espece=chat`, { cache: "no-store" })).json().catch(() => ({}))) as Reponse;
    if (j.etat) setEtat(j.etat);
    else setDit(j.error || "La page ne s’est pas chargée.");
  }, []);
  useEffect(() => {
    void charger();
  }, [charger]);

  async function envoyer(corps: Record<string, unknown>): Promise<Reponse> {
    const r = await fetch(ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ espece: "chat", ...corps }) });
    return (await r.json().catch(() => ({}))) as Reponse;
  }
  /** Une cible jusqu'au bout : la référence ; ou une boucle — sa pose, puis sa vidéo (suivie toutes les huit secondes). */
  async function mener(cible: string): Promise<boolean> {
    setOccupe({ cible });
    for (let k = 0; k < 120; k++) {
      const j = await envoyer({ action: "fabriquer", cible });
      if (j.etat) setEtat(j.etat);
      if (j.error) {
        setDit(j.error);
        return false;
      }
      if (j.fait === "pose") continue;
      if (typeof j.progres !== "number") return true;
      setOccupe({ cible, progres: j.progres });
      await pause(8000);
    }
    return false;
  }
  async function faire(cible: string) {
    setDit("");
    try {
      if (await mener(cible)) setDit(cible === "reference" ? "Son image de référence est faite : regarde-la, puis fais ses boucles." : "La boucle est faite : regarde-la chez toi, plus bas.");
    } finally {
      setOccupe(null);
    }
  }
  async function toutFaire() {
    setDit("");
    try {
      if (!etat?.reference && !(await mener("reference"))) return;
      for (const b of BOUCLES) {
        const ici = etat?.boucles.find((x) => x.cle === b.cle);
        if (ici?.video) continue;
        if (!(await mener(b.cle))) return;
      }
      setDit("Le chat est fait : ses huit boucles. Regarde-le chez toi, plus bas, sur ton téléphone.");
    } finally {
      setOccupe(null);
    }
  }
  /** 🔊 Il dépose le vrai son d'une boucle (un enregistrement : mp3, m4a, wav), ou l'enlève. */
  async function deposerSon(cible: Boucle, f: File | null) {
    setDit("");
    const donnees = f
      ? await new Promise<string>((ok) => {
          const lecteur = new FileReader();
          lecteur.onload = () => ok(String(lecteur.result ?? "").replace(/^data:[^,]*,/, ""));
          lecteur.onerror = () => ok("");
          lecteur.readAsDataURL(f);
        })
      : "";
    if (f && !donnees) return setDit("Ce fichier ne se lit pas.");
    const j = await envoyer({ action: "son", cible, type: f?.type || "audio/mpeg", donnees });
    if (j.etat) setEtat(j.etat);
    setDit(j.error || (f ? "Son son est déposé : écoute-le chez toi, plus bas (« 🔈 Avec son son »)." : "Son son est enlevé."));
  }
  async function refaire(cible: string, etape?: "pose" | "video") {
    setDit("");
    const j = await envoyer({ action: "refaire", cible, ...(etape ? { etape } : {}) });
    if (j.etat) setEtat(j.etat);
  }

  const ici = etat?.boucles.find((b) => b.cle === vue);
  const plan = BOUCLES.find((b) => b.cle === vue)!;
  const place = etat?.place ?? { x: 0.32, y: 0.84, echelle: 1 };
  const hauteurFigurine = 0.36 * Math.min(1.15, Math.max(0.9, place.echelle));
  // (sur ses genoux, ou à côté d'elle, devant)
  const H = plan.ou === "genoux" ? 0.2 : 0.26;
  const bas = plan.ou === "genoux" ? 1 - place.y + hauteurFigurine * 0.3 : 1 - place.y - 0.03;
  const gauche = plan.ou === "genoux" ? place.x : Math.min(0.85, place.x + 0.22);
  const faites = etat?.boucles.filter((b) => b.video).length ?? 0;
  // (le son joue doucement, en boucle, avec la boucle vue)
  useEffect(() => {
    if (son.current) son.current.volume = 0.45;
  }, [avecSon, ici?.son]);

  return (
    <section aria-label="Le compagnon, l'essai du chat" style={{ margin: "18px 0", padding: 16, border: "1px solid #e3d7c8", borderRadius: 16, background: "#fffaf3" }}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>🐾 Le compagnon : l’essai du chat (C0)</h2>
      <p style={{ margin: "0 0 12px", color: "#555", lineHeight: 1.45 }}>
        Un chat en petit jouet de vinyle, dans le style de ta figurine : son image de référence, puis huit boucles (une pose, puis quatre secondes de vidéo sur un fond vert, que ton
        téléphone retire au moment de jouer). Le même pour tous : fait une fois, rien à payer par personne. Environ {euros(total)} $ pour le chat entier ({euros(COUT.reference)} $ la
        référence, {euros(COUT.pose)} $ chaque pose, {euros(COUT.boucle)} $ chaque boucle). Juge-le sur ton téléphone : le style, la constance, s’il vit bien à côté de ta figurine.
      </p>
      {etat && !etat.moteurs.image && <p style={{ color: "#b3261e" }}>Le moteur d’image n’est pas branché ici.</p>}
      {etat && !etat.moteurs.video && <p style={{ color: "#b3261e" }}>Le moteur vidéo de Google n’est pas branché : ajoute GEMINI_VIDEO_API_KEY dans Vercel.</p>}

      <h3 style={{ margin: "12px 0 6px", fontSize: 16 }}>1. Son image de référence</h3>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 120, height: 180, borderRadius: 14, overflow: "hidden", display: "grid", placeItems: "center", ...damier }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {etat?.reference ? <img className="ce-reference" src={etat.reference} alt="Le chat, son image de référence" style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <span style={{ fontSize: 40 }}>🐱</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {!etat?.reference ? (
            <button type="button" className="ce-faire-reference" disabled={Boolean(occupe)} onClick={() => void faire("reference")} style={{ ...bouton, background: "#ff2e9a", color: "#fff", border: 0 }}>
              {occupe?.cible === "reference" ? "… il se dessine (une minute)" : "🐱 Faire le chat"}
            </button>
          ) : (
            <button type="button" disabled={Boolean(occupe)} onClick={() => void refaire("reference")} style={bouton}>
              Refaire (tout s’efface : ses poses en viennent)
            </button>
          )}
          {etat?.reference && faites < BOUCLES.length && (
            <button type="button" className="ce-tout" disabled={Boolean(occupe)} onClick={() => void toutFaire()} style={{ ...bouton, background: "#ff2e9a", color: "#fff", border: 0 }}>
              {occupe ? `… ${BOUCLES.find((b) => b.cle === occupe.cible)?.nom ?? "en train"}${typeof occupe.progres === "number" ? ` (${occupe.progres} %)` : ""} : garde la page ouverte` : `Faire ses ${BOUCLES.length - faites} boucles`}
            </button>
          )}
        </div>
      </div>

      <h3 style={{ margin: "16px 0 6px", fontSize: 16 }}>2. Ses boucles ({faites}/{BOUCLES.length})</h3>
      <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 14, marginBottom: 8 }}>
        <input type="checkbox" checked={brut} onChange={(e) => setBrut(e.target.checked)} /> Voir avec le fond vert (la vidéo telle qu’elle est faite)
      </label>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {(etat?.boucles ?? []).map((b) => (
          <li key={b.cle} className="ce-boucle" data-boucle={b.cle} style={{ padding: 8, borderRadius: 14, background: b.video ? "#eef7ea" : "#f6efe6", display: "flex", flexDirection: "column", gap: 6 }}>
            <button type="button" aria-label={`Voir « ${b.nom} » chez toi`} onClick={() => setVue(b.cle)} style={{ border: 0, padding: 0, borderRadius: 10, overflow: "hidden", aspectRatio: "9 / 16", ...damier, outline: vue === b.cle ? "3px solid #ff2e9a" : "none" }}>
              {b.video ? (
                <CompagnonVivant src={b.video} titre={b.nom} brut={brut} style={{ width: "100%", height: "100%" }} />
              ) : b.pose ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.pose} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: 28 }}>…</span>
              )}
            </button>
            <b style={{ fontSize: 13, lineHeight: 1.25 }}>{b.nom}</b>
            <small style={{ color: "#555" }}>
              {b.video ? "✓ faite" : b.enCours ? `vidéo commandée, ${b.enCours.progres ?? 0} %` : b.pose ? "la pose est faite" : "à faire"}
            </small>
            {/* 🔊 son vrai son : un enregistrement (le ronronnement, sur les genoux) — jamais fabriqué */}
            <label className="ce-son" style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#555" }}>
              {b.son ? "🔊 Son son (enregistré)" : "🔊 Un son ? (un vrai enregistrement)"}
              {b.son && <audio src={b.son} controls preload="none" style={{ width: "100%", height: 30 }} />}
              <input type="file" accept="audio/*" style={{ fontSize: 11, maxWidth: "100%" }} onChange={(e) => void deposerSon(b.cle, e.target.files?.[0] ?? null)} />
            </label>
            {b.son && (
              <button type="button" onClick={() => void deposerSon(b.cle, null)} style={{ ...bouton, padding: "2px 8px", fontSize: 12, alignSelf: "flex-start" }}>
                Enlever le son
              </button>
            )}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {!b.video && (
                <button type="button" disabled={Boolean(occupe) || !etat?.reference} onClick={() => void faire(b.cle)} style={{ ...bouton, padding: "4px 10px" }}>
                  {occupe?.cible === b.cle ? `… ${typeof occupe.progres === "number" ? `${occupe.progres} %` : "en train"}` : b.enCours ? "Continuer" : "Faire"}
                </button>
              )}
              {b.video && (
                <a href={b.video} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                  La vidéo seule
                </a>
              )}
              {(b.video || b.pose) && (
                <button type="button" disabled={Boolean(occupe)} onClick={() => void refaire(b.cle, b.video ? "video" : "pose")} style={{ ...bouton, padding: "4px 10px" }}>
                  {b.video ? "Refaire la vidéo" : "Refaire la pose"}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h3 style={{ margin: "16px 0 6px", fontSize: 16 }}>3. Chez toi : « {plan.nom} »</h3>
      <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 14, marginBottom: 8 }}>
        <input type="checkbox" className="ce-avec-son" checked={avecSon} onChange={(e) => setAvecSon(e.target.checked)} /> 🔈 Avec son son {ici?.son ? "" : "(cette boucle n’en a pas encore)"}
      </label>
      {avecSon && ici?.son && <audio key={ici.son} ref={son} src={ici.son} autoPlay loop aria-hidden="true" />}
      {/* 🚶 (« quand le chat marche, il marche sur place ») il traverse la pièce : vers la gauche (il regarde à gauche), puis il se retourne */}
      <style>{`@keyframes ce-promene{0%{left:80%}48%,50%{left:22%}98%,100%{left:80%}}@keyframes ce-sens{0%,49.9%{transform:scaleX(1)}50%,99.9%{transform:scaleX(-1)}100%{transform:scaleX(1)}}`}</style>
      {etat?.decor ? (
        <div className="ce-chez-toi" style={{ position: "relative", width: "min(100%, 340px)", aspectRatio: "2 / 3", borderRadius: 22, overflow: "hidden", background: "#140a08" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={etat.decor} alt="Ton univers" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          {etat.figurine && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={etat.figurine} alt="Ta figurine assise" style={{ position: "absolute", left: `${place.x * 100}%`, bottom: `${(1 - place.y) * 100}%`, height: `${hauteurFigurine * 100}%`, transform: "translateX(-50%)", filter: "drop-shadow(0 10px 10px rgba(0,0,0,.4))" }} />
          )}
          {ici?.video && plan.cle === "marche" ? (
            <span className="ce-promene" style={{ position: "absolute", left: "80%", bottom: `${(bas - PIED * H) * 100}%`, height: `${H * 100}%`, aspectRatio: "9 / 16", transform: "translateX(-50%)", zIndex: 2, animation: "ce-promene 12s linear infinite" }}>
              <CompagnonVivant src={ici.video} titre={`Le chat : ${plan.nom}`} brut={brut} style={{ width: "100%", height: "100%", animation: "ce-sens 12s linear infinite" }} />
            </span>
          ) : ici?.video ? (
            <CompagnonVivant src={ici.video} titre={`Le chat : ${plan.nom}`} brut={brut} style={{ position: "absolute", left: `${gauche * 100}%`, bottom: `${(bas - PIED * H) * 100}%`, height: `${H * 100}%`, aspectRatio: "9 / 16", transform: "translateX(-50%)", zIndex: 2 }} />
          ) : (
            <p style={{ position: "absolute", left: 10, right: 10, bottom: 10, margin: 0, padding: "6px 10px", borderRadius: 10, background: "rgba(255,250,243,.9)", fontSize: 13 }}>Cette boucle n’est pas encore faite.</p>
          )}
        </div>
      ) : (
        <p style={{ color: "#555" }}>Ton univers n’a pas encore son décor : l’aperçu se fera dedans, une fois créé.</p>
      )}
      {dit && (
        <p role="status" style={{ margin: "10px 0 0" }}>
          {dit}
        </p>
      )}
    </section>
  );
}
