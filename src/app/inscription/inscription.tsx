"use client";

// 📝 L'INSCRIPTION POUR TOUT LE MONDE (`/inscription`).
//
// « Plusieurs cas quand une personne veut s'inscrire » : le commerçant d'une ville ouverte a tout (sa page, l'admin
// complet, le Direct de sa ville, « dépenser moins ») ; celui d'une ville pas encore ouverte a sa page, la vidéo, ses
// fantômes et Mike, et voit le reste verrouillé, « il s'ouvrira avec votre ville » ; celui dont les clients sont
// partout en France (il envoie, ou travaille à distance) aura en plus le Direct France de sa catégorie — bientôt.
//
// Trois temps : où sont ses clients (plusieurs réponses), sa ville (la page dit tout de suite ce qu'il aura, avec
// `/api/inscription/ville`), puis le formulaire — le même générateur que l'accueil (`public-generate`), la case
// « Je n'ai pas de fiche Google » comprise.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { reduirePhoto } from "@/lib/site-internet/reduire-photo";

const NB = " ";
const WA = "https://wa.me/33768233347?text=" + encodeURIComponent("Bonjour Marius, je voudrais créer ma page ClikMe.");

type Client = "chez-moi" | "chez-eux" | "distance";
const CLIENTS: { cle: Client; icone: string; titre: string; sous: string }[] = [
  { cle: "chez-moi", icone: "🏠", titre: "viennent chez vous", sous: "boutique, atelier, cabinet" },
  { cle: "chez-eux", icone: "🚗", titre: "vous allez chez eux", sous: "à domicile" },
  { cle: "distance", icone: "📦", titre: "vous leur envoyez, ou travaillez à distance", sous: "colis, en ligne, en visio" },
];
type Ville = { nom: string; ouverte: boolean; inscrits: number; echange: boolean };
/** « de Dax », « d’Annecy », « du Havre », « des Sables-d’Olonne ». */
function deVille(nom: string): string {
  if (/^le /i.test(nom)) return "du " + nom.slice(3);
  if (/^les /i.test(nom)) return "des " + nom.slice(4);
  return /^[aeiouyàâäéèêëîïôöùûüh]/i.test(nom) ? "d’" + nom : "de " + nom;
}

const ETAPES_GOOGLE = ["Je cherche votre fiche Google…", "Je récupère vos photos et vos avis…", "Je choisis vos couleurs…", "Je prépare votre fantôme…", "Je construis votre page…", "Presque prêt…"];
const ETAPES_SANS = ["Je prépare votre page…", "J'installe vos photos…", "Je choisis vos couleurs…", "Je prépare votre fantôme…", "Je construis votre page…", "Presque prêt…"];

export function Inscription() {
  const [clients, setClients] = useState<Client[]>([]);
  const [ville, setVille] = useState("");
  const [infoVille, setInfoVille] = useState<Ville | null>(null);
  const [nom, setNom] = useState("");
  const [activite, setActivite] = useState("");
  const [photo, setPhoto] = useState("");
  const [photoDit, setPhotoDit] = useState("");
  const [sansFiche, setSansFiche] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [etape, setEtape] = useState(0);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const [limite, setLimite] = useState(false);
  const minuteries = useRef<number[]>([]);

  // SA VILLE : ce qu'il aura, dès qu'il l'a tapée (une demande par pause de frappe ; la dernière seule compte)
  useEffect(() => {
    const v = ville.trim();
    if (v.length < 2) return;
    let vivant = true;
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/inscription/ville?nom=${encodeURIComponent(v)}`);
        const j = await r.json();
        if (vivant && r.ok) setInfoVille({ nom: String(j.nom || v), ouverte: Boolean(j.ouverte), inscrits: Number(j.inscrits) || 0, echange: Boolean(j.echange) });
      } catch {
        if (vivant) setInfoVille({ nom: v, ouverte: false, inscrits: 0, echange: false });
      }
    }, 450);
    return () => { vivant = false; window.clearTimeout(t); };
  }, [ville]);
  useEffect(() => () => minuteries.current.forEach((t) => window.clearInterval(t)), []);

  const basculer = (c: Client) => setClients((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]));
  const local = clients.length === 0 || clients.includes("chez-moi") || clients.includes("chez-eux");
  const distance = clients.includes("distance");
  const pret = nom.trim().length >= 2 && ville.trim().length >= 2 && activite.trim().length >= 2;
  const etapes = sansFiche ? ETAPES_SANS : ETAPES_GOOGLE;

  async function creer() {
    if (!pret || envoi) return;
    setErr(""); setLimite(false); setEnvoi(true); setEtape(0); setPct(0);
    minuteries.current.push(
      window.setInterval(() => setPct((v) => (v < 94 ? v + Math.max(0.4, (94 - v) / 28) : v)), 650),
      window.setInterval(() => setEtape((s) => (s < etapes.length - 1 ? s + 1 : s)), sansFiche ? 2500 : 6000),
    );
    const arreter = () => { minuteries.current.forEach((t) => window.clearInterval(t)); minuteries.current = []; };
    try {
      const r = await fetch("/api/site-internet/public-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: nom.trim(), city: ville.trim(), activite: activite.trim(), clients,
          ...(photo ? { photo } : {}), ...(sansFiche ? { sansFiche: true } : {}),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.slug) {
        arreter(); setPct(100); setEtape(etapes.length - 1);
        window.setTimeout(() => { window.location.href = `/site-internet/apercu/${j.slug}`; }, 900);
        return;
      }
      arreter(); setEnvoi(false); setLimite(Boolean(j.limited));
      setErr(typeof j.error === "string" ? j.error : "La création a échoué. Réessayez dans un instant.");
    } catch {
      arreter(); setEnvoi(false);
      setErr("Connexion interrompue. Réessayez dans un instant.");
    }
  }

  // (la dernière réponse reste affichée pendant qu'il tape ; plus rien sous deux lettres)
  const v = ville.trim().length >= 2 ? infoVille : null;
  return (
    <main className="ins">
      <style>{STYLE}</style>
      <header className="ins-haut">
        <Link className="ins-marque" href="/">Clik<b>Me</b></Link>
      </header>

      <section className="ins-tete">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ins-fant" src="/commercants/g-vol.webp" alt="" />
        <h1>Créez votre page ClikMe</h1>
        <p>Commerçants, artisans, entrepreneurs : partout en France. Gratuit, en une minute.</p>
      </section>

      {/* ① OÙ SONT SES CLIENTS */}
      <section className="ins-bloc">
        <h2><span>1</span> Vos clients…</h2>
        <div className="ins-choix" role="group" aria-label="Où sont vos clients">
          {CLIENTS.map((c) => (
            <button key={c.cle} type="button" aria-pressed={clients.includes(c.cle)} className={clients.includes(c.cle) ? "on" : ""} onClick={() => basculer(c.cle)}>
              <i aria-hidden="true">{c.icone}</i>
              <b>{c.titre}</b>
              <small>{c.sous}</small>
            </button>
          ))}
        </div>
        <p className="ins-note">Plusieurs réponses possibles.</p>
      </section>

      {/* ② SA VILLE, ET CE QU'IL AURA */}
      <section className="ins-bloc">
        <h2><span>2</span> Votre ville</h2>
        <input className="ins-champ" value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Votre ville" aria-label="Votre ville" autoComplete="address-level2" />
        {v && (
          <div className="ins-aurez" aria-live="polite">
            <p className="ins-aurez-t">
              {v.ouverte ? <>✨ {v.nom} est ouverte : vous aurez tout.</> : <>À {v.nom}, vous aurez :</>}
            </p>
            <ul>
              <li className="oui"><i>✓</i><span><b>Votre page</b>, et une belle vidéo faite avec vos photos, publiée partout</span></li>
              <li className="oui"><i>✓</i><span><b>Vos fantômes</b> : chacun dit ce qu&apos;il pense de votre vidéo</span></li>
              <li className="oui"><i>✓</i><span><b>Mike</b>, qui écrit à chacun, un peu mieux à chaque réponse</span></li>
              {local && (v.ouverte ? (
                <>
                  <li className="oui"><i>✓</i><span><b>Le Direct {deVille(v.nom)}</b> : les habitants vous voient chaque jour</span></li>
                  <li className="oui"><i>✓</i><span><b>Dépenser moins</b> : l&apos;échange entre commerçants {deVille(v.nom)}</span></li>
                </>
              ) : (
                <>
                  <li className="verrou"><i>🔒</i><span><b>Le Direct {deVille(v.nom)}</b><em>s&apos;ouvrira avec votre ville</em></span></li>
                  {/* l'échange s'ouvre tout seul dès 12 commerçants d'une même ville, même hors de la liste */}
                  {v.echange ? (
                    <li className="oui"><i>✓</i><span><b>Dépenser moins</b> : l&apos;échange entre commerçants {deVille(v.nom)}, déjà ouvert</span></li>
                  ) : (
                    <li className="verrou"><i>🔒</i><span><b>Dépenser moins</b>, l&apos;échange entre commerçants<em>s&apos;ouvrira avec votre ville, ou dès 12 commerçants inscrits</em></span></li>
                  )}
                </>
              ))}
              {distance && <li className="bientot"><i>⏳</i><span><b>Le Direct France de votre catégorie</b><em>bientôt</em></span></li>}
            </ul>
            {local && !v.ouverte && (
              <p className="ins-voisins">
                {v.inscrits > 0
                  ? `${v.inscrits} ${v.inscrits > 1 ? "commerçants" : "commerçant"} ${deVille(v.nom)} ${v.inscrits > 1 ? "ont" : "a"} déjà leur page. `
                  : `Vous ouvrez la marche à ${v.nom}. `}
                Parlez-en aux commerçants voisins : plus vous êtes nombreux, plus vite votre ville s&apos;ouvre.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ③ LE FORMULAIRE */}
      <section className="ins-bloc">
        <h2><span>3</span> Votre activité</h2>
        <input className="ins-champ" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Le nom de votre activité" aria-label="Le nom de votre activité" autoComplete="organization" />
        <input className="ins-champ" value={activite} onChange={(e) => setActivite(e.target.value)} placeholder="Votre métier : céramiste, coiffeur…" aria-label="Votre métier" />
        <label className={`ins-photo${photo ? " on" : ""}`}>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhotoDit("");
              try { setPhoto(await reduirePhoto(f)); } catch { setPhoto(""); setPhotoDit("Cette photo n'a pas pu être lue. Essayez-en une autre, ou continuez sans."); }
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {photo ? <img src={photo} alt="" /> : <span aria-hidden="true">📷</span>}
          <b>{photo ? "Photo ajoutée" : "Une photo de votre lieu ou de votre travail"}</b>
          <em>{photo ? "Touchez pour en choisir une autre" : "Facultatif — elle ouvrira votre page"}</em>
        </label>
        {photoDit && <p className="ins-err">{photoDit}</p>}
        <label className="ins-sans">
          <input type="checkbox" checked={sansFiche} onChange={(e) => setSansFiche(e.target.checked)} /> Je n&apos;ai pas de fiche Google
        </label>
        <p className="ins-note">
          {sansFiche
            ? "Inscrivez-vous quand même. Votre page se crée sans présentation : vous y mettrez vous-même vos informations (présentation, horaires, photos) depuis votre Espace Pro."
            : "Avec votre fiche Google, je reprends vos photos, vos avis et vos horaires."}
        </p>
        <button type="button" className="ins-go" disabled={!pret || envoi} onClick={creer}>✨ Créer ma page · gratuit</button>
        {err && (
          <div className="ins-err">
            {err}
            {limite && <a href={WA} target="_blank" rel="noreferrer">💬 Continuer sur WhatsApp</a>}
          </div>
        )}
        <p className="ins-contact">
          {`Une question${NB}? Marius vous répond sur WhatsApp${NB}: `}
          <a href={WA} target="_blank" rel="noreferrer">07 68 23 33 47</a>
        </p>
      </section>

      {envoi && (
        <div className="ins-construit" role="dialog" aria-label="Création de votre page">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/commercants/g-vol.webp" alt="" />
          <b>{nom.trim() || "Votre page"}</b>
          <p>{etapes[etape]}</p>
          <div className="ins-jauge"><i style={{ width: `${Math.round(pct)}%` }} /></div>
        </div>
      )}
    </main>
  );
}

const STYLE = `
.ins{--creme:#FFF4E6;--rose:#FF2E9A;--rose2:#FF5DB8;--menthe:#3DE2A6;--or:#F6B54B;--gris:rgba(255,244,230,.72);--gris2:rgba(255,244,230,.5);
  min-height:100vh;padding:0 16px 60px;color:var(--creme);font-family:var(--font-clikme-leger),var(--font-clikme),system-ui,sans-serif;
  background:radial-gradient(ellipse 120% 60% at 50% 0,#3D1433 0%,#1D0819 55%,#0C040A 100%)}
.ins *{box-sizing:border-box}
.ins h1,.ins h2,.ins b,.ins button,.ins-marque{font-family:var(--font-clikme),system-ui,sans-serif}
.ins-haut{max-width:560px;margin:0 auto;padding:18px 0}
.ins-marque{font-size:26px;font-weight:900;letter-spacing:-.03em;color:var(--creme);text-decoration:none}
.ins-marque b{color:var(--rose)}
.ins-tete{max-width:560px;margin:0 auto;text-align:center;padding:6px 0 8px}
.ins-fant{width:130px;height:auto;margin:0 auto 6px;display:block;animation:ins-flotte 3.2s ease-in-out infinite}
@keyframes ins-flotte{50%{transform:translateY(-10px)}}
.ins-tete h1{margin:0;font-size:clamp(30px,8vw,40px);font-weight:900;line-height:1.05;letter-spacing:-.02em}
.ins-tete p{margin:10px 0 0;font-size:16px;line-height:1.45;color:var(--gris)}
.ins-bloc{max-width:560px;margin:22px auto 0;padding:20px;border-radius:26px;background:rgba(255,244,230,.05);border:1px solid rgba(255,244,230,.12);display:grid;gap:12px}
.ins-bloc h2{margin:0;display:flex;align-items:center;gap:10px;font-size:20px;font-weight:800}
.ins-bloc h2 span{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;font-size:15px;font-weight:900;color:#fff;background:var(--rose)}
.ins-choix{display:grid;gap:10px}
.ins-choix button{display:grid;grid-template-columns:44px 1fr;grid-template-rows:auto auto;column-gap:12px;align-items:center;text-align:left;padding:12px 14px;border-radius:18px;
  border:1.5px solid rgba(255,244,230,.16);background:rgba(0,0,0,.25);color:var(--creme);cursor:pointer;transition:border-color .2s,background .2s}
.ins-choix button i{grid-row:span 2;font-style:normal;font-size:28px;text-align:center}
.ins-choix button b{font-size:16px;font-weight:800}
.ins-choix button small{font-size:13px;color:var(--gris2)}
.ins-choix button.on{border-color:var(--rose);background:rgba(255,46,154,.14)}
.ins-note{margin:0;font-size:13.5px;line-height:1.45;color:var(--gris2)}
.ins-champ{width:100%;min-height:54px;padding:0 16px;border-radius:16px;border:1.5px solid rgba(255,244,230,.16);background:rgba(0,0,0,.3);color:var(--creme);font-size:16px;outline:none}
.ins-champ::placeholder{color:var(--gris2)}
.ins-champ:focus{border-color:var(--rose)}
.ins-aurez{padding:14px 16px;border-radius:18px;background:rgba(0,0,0,.25)}
.ins-aurez-t{margin:0 0 8px;font-size:15px;font-weight:600;color:var(--creme)}
.ins-aurez ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.ins-aurez li{display:grid;grid-template-columns:26px 1fr;gap:8px;align-items:start;font-size:14.5px;line-height:1.4;color:var(--gris)}
.ins-aurez li i{font-style:normal;text-align:center;font-weight:900}
.ins-aurez li.oui i{color:var(--menthe)}
.ins-aurez li b{color:var(--creme);font-weight:800}
.ins-aurez li em{display:block;font-style:normal;font-size:12.5px;color:var(--or)}
.ins-aurez li.verrou,.ins-aurez li.bientot{opacity:.85}
.ins-voisins{margin:12px 0 0;padding-top:10px;border-top:1px solid rgba(255,244,230,.1);font-size:13.5px;line-height:1.45;color:var(--gris)}
.ins-photo{position:relative;display:grid;grid-template-columns:52px 1fr;grid-template-rows:auto auto;column-gap:12px;align-items:center;padding:10px 12px;border-radius:18px;border:1.5px dashed rgba(255,244,230,.22);cursor:pointer}
.ins-photo input{position:absolute;inset:0;opacity:0;cursor:pointer}
.ins-photo>span,.ins-photo>img{grid-row:span 2;width:52px;height:52px;border-radius:12px;display:grid;place-items:center;font-size:24px;background:rgba(255,255,255,.06);object-fit:cover}
.ins-photo b{font-size:14.5px;font-weight:800}
.ins-photo em{font-style:normal;font-size:12.5px;color:var(--gris2)}
.ins-photo.on{border-style:solid;border-color:var(--menthe)}
.ins-sans{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;color:var(--creme);cursor:pointer}
.ins-sans input{width:20px;height:20px;flex:none;accent-color:var(--rose)}
.ins-go{min-height:60px;border:0;border-radius:60px;font-size:18px;font-weight:900;color:#fff;cursor:pointer;background:linear-gradient(135deg,var(--rose2),#E0167A);box-shadow:0 22px 50px -18px rgba(255,46,154,.9)}
.ins-go:disabled{opacity:.45;cursor:default;box-shadow:none}
.ins-err{display:grid;gap:8px;margin:0;padding:12px 14px;border-radius:14px;background:rgba(255,90,90,.12);color:#ffc2c2;font-size:14.5px}
.ins-err a{justify-self:start;color:#25D366;font-weight:800}
.ins-contact{margin:4px 0 0;text-align:center;font-size:14px;color:var(--gris)}
.ins-contact a{color:#25D366;font-weight:800}
.ins-construit{position:fixed;inset:0;z-index:50;display:grid;place-content:center;justify-items:center;gap:10px;padding:24px;text-align:center;background:rgba(12,4,10,.96)}
.ins-construit img{width:150px;height:auto;animation:ins-flotte 2.4s ease-in-out infinite}
.ins-construit b{font-size:24px;font-weight:900}
.ins-construit p{margin:0;font-size:15px;color:var(--gris)}
.ins-jauge{width:min(280px,70vw);height:8px;border-radius:8px;background:rgba(255,255,255,.12);overflow:hidden}
.ins-jauge i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,var(--rose2),var(--or));transition:width .6s}
@media (prefers-reduced-motion:reduce){.ins-fant,.ins-construit img{animation:none}}
`;
