"use client";

// 📣 MES RÉSEAUX — connecter Instagram, Facebook, TikTok une fois, et chaque
// annonce du comptoir y part toute seule.
//
// « Ils n'ont qu'une seule manipulation à faire et tout est fait
// automatiquement. » Il touche « Connecter », se connecte à SON compte chez le
// réseau (nous ne voyons jamais son mot de passe), revient : c'est fini. Ce
// qu'il publie ensuite ici part dans Le Direct, sur sa page, ET sur ses réseaux.
//
// PAS DE RÉPONSES AUTOMATIQUES — « déjà les publications sur tous les réseaux
// sociaux c'est déjà pas mal ».
//
// UN VRAI COMMERÇANT ne voit cet écran que lorsque l'intermédiaire est branché
// (sa clé posée sur Vercel). LA DÉMONSTRATION le montre toujours, en exemple :
// c'est elle qu'on présente aux commerçants.
//
// Voir `lib/reseaux/reseaux-donnees.ts` et la route `/api/site-internet/pro/reseaux`.
import { useCallback, useEffect, useState } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { iconeDuReseau, nomDuReseau, PLATEFORMES_PAR_DEFAUT, reseauxEnMots, type DernierePublication } from "@/lib/reseaux/reseaux-donnees";

type Plateforme = { id: string; nom: string; compte?: string };
type Etat = { configure: boolean; plateformes: Plateforme[]; auto: boolean; derniere?: DernierePublication };

/** La démonstration : les réseaux proposés, aucun connecté. */
const DEMO: Etat = { configure: true, plateformes: PLATEFORMES_PAR_DEFAUT.map((id) => ({ id, nom: nomDuReseau(id) })), auto: false };

async function appeler(reel: CommerceComptoir["reel"], corps: Record<string, unknown>): Promise<Etat & { url?: string; error?: string }> {
  if (!reel) throw new Error("démonstration");
  const r = await fetch("/api/site-internet/pro/reseaux", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: reel.slug, token: reel.token, ...corps }),
  });
  const j = (await r.json().catch(() => ({}))) as Etat & { url?: string; error?: string };
  if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
  return j;
}

/**
 * Ses réseaux, lus une fois par le comptoir — la carte de l'accueil et l'écran
 * partagent le même état. `null` tant qu'on ne sait pas.
 */
export function useReseaux(commerce: CommerceComptoir) {
  const slug = commerce.reel?.slug;
  const token = commerce.reel?.token;
  const [etat, setEtat] = useState<Etat | null>(slug ? null : DEMO);
  useEffect(() => {
    if (!slug || !token) return;
    let fini = false;
    appeler({ slug, token }, { action: "etat" })
      .then((e) => {
        if (!fini) setEtat(e);
      })
      .catch(() => {
        /* hors ligne : la carte reste cachée */
      });
    return () => {
      fini = true;
    };
  }, [slug, token]);
  return { etat, setEtat };
}
export type ReseauxDuComptoir = ReturnType<typeof useReseaux>;

/* ═══ LA CARTE DE L'ACCUEIL ═══════════════════════════════════════════════ */
export function CarteReseaux({ commerce, reseaux, onOuvrir }: { commerce: CommerceComptoir; reseaux: ReseauxDuComptoir; onOuvrir: () => void }) {
  const { etat } = reseaux;
  if (!etat || !etat.configure) return null;
  const connectes = etat.plateformes.filter((p) => p.compte).map((p) => p.id);
  const tous = etat.plateformes.map((p) => p.id);
  return (
    <button type="button" className={`cz-relance cz-reseaux${connectes.length ? "" : " chaud"}`} onClick={onOuvrir}>
      <span className="cz-relance-i">📣</span>
      <span>
        <b>
          Mes réseaux
          {!commerce.reel && <i className="cz-pastille calme">Exemple</i>}
        </b>
        <em>
          {connectes.length
            ? etat.auto
              ? `Tes annonces partent aussi sur ${reseauxEnMots(connectes)}.`
              : `${reseauxEnMots(connectes)} connecté${connectes.length > 1 ? "s" : ""} — l’envoi est en pause.`
            : `Connecte ${reseauxEnMots(tous)} une fois : chaque annonce y partira toute seule.`}
        </em>
      </span>
      <s aria-hidden="true">→</s>
    </button>
  );
}

/* ═══ L'ÉCRAN ═════════════════════════════════════════════════════════════ */
export function ReseauxComptoir({
  commerce,
  dossier,
  reseaux,
  onRetour,
}: {
  commerce: CommerceComptoir;
  dossier: string;
  reseaux: ReseauxDuComptoir;
  onRetour: () => void;
}) {
  const { etat, setEtat } = reseaux;
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  /** Le réseau qu'il est parti connecter : on relit ses comptes à son retour. */
  const [enAttente, setEnAttente] = useState("");
  const demo = !commerce.reel;

  const rafraichir = useCallback(async () => {
    if (demo) return;
    setOccupe("rafraichir");
    try {
      const e = await appeler(commerce.reel, { action: "rafraichir" });
      setEtat(e);
      setMessage("");
      if (enAttente && e.plateformes.some((p) => p.id === enAttente && p.compte)) setEnAttente("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setOccupe("");
    }
  }, [demo, commerce, setEtat, enAttente]);

  /* IL REVIENT DE CHEZ INSTAGRAM : on relit sans qu'il ait à toucher quoi que ce soit. */
  useEffect(() => {
    if (!enAttente) return;
    const auRetour = () => {
      if (document.visibilityState === "visible") void rafraichir();
    };
    document.addEventListener("visibilitychange", auRetour);
    window.addEventListener("focus", auRetour);
    return () => {
      document.removeEventListener("visibilitychange", auRetour);
      window.removeEventListener("focus", auRetour);
    };
  }, [enAttente, rafraichir]);

  const connecter = async (p: Plateforme) => {
    setMessage("");
    if (demo) {
      // LA DÉMONSTRATION NE CONNECTE RIEN : elle montre ce qui se passerait.
      setEtat((e) => (e ? { ...e, auto: true, plateformes: e.plateformes.map((x) => (x.id === p.id ? { ...x, compte: `${x.nom} (exemple)` } : x)) } : e));
      return;
    }
    // L'ONGLET S'OUVRE TOUT DE SUITE, pendant le geste : sur iPhone, un onglet
    // ouvert après une attente réseau est bloqué. On y charge le lien ensuite.
    const onglet = window.open("", "_blank");
    setOccupe(p.id);
    try {
      const r = await appeler(commerce.reel, { action: "connecter", plateforme: p.id });
      if (!r.url) throw new Error("Lien de connexion introuvable.");
      setEnAttente(p.id);
      if (onglet) onglet.location.href = r.url;
      else window.location.href = r.url;
    } catch (e) {
      onglet?.close();
      setMessage((e as Error).message);
    } finally {
      setOccupe("");
    }
  };

  const basculer = async (on: boolean) => {
    if (demo) return setEtat((e) => (e ? { ...e, auto: on } : e));
    setOccupe("auto");
    try {
      setEtat(await appeler(commerce.reel, { action: "auto", on }));
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setOccupe("");
    }
  };

  const connectes = etat?.plateformes.filter((p) => p.compte) ?? [];
  const d = etat?.derniere;

  return (
    <div className="rs">
      <StylesReseaux />
      <div className="rs-haut">
        <button type="button" className="rs-retour" onClick={onRetour}>
          ‹ Mon comptoir
        </button>
        {demo && <span className="rs-exemple">Exemple</span>}
      </div>

      <section className="rs-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${dossier}visage.webp`} alt="" />
        <div>
          <h2>Mes réseaux</h2>
          <p>Connecte-les une fois. Ensuite, chaque annonce que tu publies ici part aussi sur tes réseaux : tu n’as plus à les ouvrir.</p>
        </div>
      </section>

      {!etat ? (
        <p className="rs-vide">Je regarde tes réseaux…</p>
      ) : (
        <ul className="rs-liste">
          {etat.plateformes.map((p) => (
            <li key={p.id} className={p.compte ? "ok" : ""}>
              <span className="rs-i" aria-hidden="true">
                {iconeDuReseau(p.id)}
              </span>
              <span className="rs-t">
                <b>{p.nom}</b>
                <em>{p.compte ? `Connecté · ${p.compte}` : enAttente === p.id ? "En attente de ta connexion…" : "Pas encore connecté"}</em>
              </span>
              {p.compte ? (
                <span className="rs-coche" aria-label="Connecté">
                  ✓
                </span>
              ) : (
                <button type="button" className="rs-connecter" disabled={Boolean(occupe)} onClick={() => void connecter(p)}>
                  {occupe === p.id ? "…" : "Connecter"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {enAttente && (
        <div className="rs-retour-info" role="status">
          <p>Connecte-toi dans l’onglet qui vient de s’ouvrir, accepte, puis reviens ici.</p>
          <button type="button" className="cz-go" disabled={occupe === "rafraichir"} onClick={() => void rafraichir()}>
            {occupe === "rafraichir" ? "Je vérifie…" : "C’est fait ✓"}
          </button>
        </div>
      )}

      {message && (
        <p className="rs-message" role="alert">
          {message}
        </p>
      )}

      {connectes.length > 0 && (
        <label className="rs-auto">
          <input type="checkbox" checked={etat?.auto ?? false} disabled={occupe === "auto"} onChange={(e) => void basculer(e.target.checked)} />
          <span className="rs-interrupteur" aria-hidden="true" />
          <span>
            <b>Chaque publication part aussi sur mes réseaux</b>
            <em>{etat?.auto ? `Sur ${reseauxEnMots(connectes.map((p) => p.id))}, avec ta photo et tes mots.` : "En pause : rien ne part sur tes réseaux."}</em>
          </span>
        </label>
      )}

      {d && (
        <section className="rs-derniere">
          <h3>Ta dernière publication sur tes réseaux</h3>
          <p className="rs-texte">« {d.texte} »</p>
          {d.ok.length > 0 && <p className="rs-ok">✓ Partie sur {reseauxEnMots(d.ok)}</p>}
          {d.erreurs.map((e) => (
            <p key={e.plateforme} className="rs-ko">
              ✗ {nomDuReseau(e.plateforme)} : {e.message}
            </p>
          ))}
        </section>
      )}

      <section className="rs-aide">
        <h3>Bon à savoir</h3>
        <p>
          <b>Instagram</b> : il faut un compte professionnel (gratuit — Réglages › Type de compte). Ta photo est recadrée au format qu’Instagram accepte.
        </p>
        <p>
          <b>Facebook</b> : c’est ta page de commerce qui publie, pas ton profil perso.
        </p>
        <p>
          <b>« Il en reste ! »</b> ne part pas sur tes réseaux : elle ne dure que deux heures, elle resterait des mois en haut de ton fil.
        </p>
      </section>
    </div>
  );
}

function StylesReseaux() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.rs{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:12px 16px calc(28px + env(safe-area-inset-bottom,0px));
  scrollbar-width:none;display:flex;flex-direction:column;gap:14px;}
.rs::-webkit-scrollbar{display:none;}
.rs-haut{display:flex;align-items:center;justify-content:space-between;}
.rs-retour{border:1px solid var(--trait);border-radius:999px;padding:9px 16px;background:var(--nappe);font-weight:700;}
.rs-exemple{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;
  background:rgba(245,162,58,.18);color:var(--ambre);}
.rs-intro{display:grid;grid-template-columns:64px 1fr;gap:14px;align-items:center;padding:14px;border-radius:22px;
  background:var(--nappe);border:1px solid var(--trait);}
.rs-intro img{width:64px;height:64px;border-radius:50%;object-fit:cover;background:var(--nappe2);}
.rs-intro h2{margin:0;font-family:var(--font-clikme),sans-serif;font-size:19px;font-weight:800;letter-spacing:-.01em;}
.rs-intro p{margin:4px 0 0;font-size:14px;line-height:1.4;color:var(--gris);}
.rs-vide{margin:0;padding:18px;border-radius:18px;border:1px dashed var(--trait);text-align:center;font-size:14px;color:var(--gris);}
.rs-liste{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
.rs-liste li{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;padding:12px;border-radius:18px;
  background:var(--nappe);border:1px solid var(--trait);}
.rs-liste li.ok{border-color:rgba(245,162,58,.45);}
.rs-i{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-size:20px;background:var(--nappe2);}
.rs-t{min-width:0;}
.rs-t b{display:block;font-size:16px;}
.rs-t em{display:block;margin-top:2px;font-style:normal;font-size:13px;color:var(--gris);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.rs-liste li.ok .rs-t em{color:var(--ambre);font-weight:700;}
.rs-connecter{height:40px;padding:0 16px;border:0;border-radius:999px;background:var(--rose);color:#fff;font-weight:800;font-size:14px;}
.rs-connecter:disabled{opacity:.5;}
.rs-coche{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:var(--ambre);color:#2A1608;font-weight:900;}
.rs-retour-info{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:18px;background:rgba(245,162,58,.1);
  border:1px solid rgba(245,162,58,.4);}
.rs-retour-info p{margin:0;font-size:14px;line-height:1.4;}
.rs-message{margin:0;padding:10px 14px;border-radius:14px;background:rgba(255,46,154,.1);color:#FFC2E0;font-size:14px;}
.rs-auto{position:relative;display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;padding:14px;border-radius:18px;
  background:var(--nappe);border:1px solid var(--trait);cursor:pointer;}
.rs-auto input{position:absolute;opacity:0;pointer-events:none;}
.rs-interrupteur{position:relative;width:50px;height:30px;border-radius:999px;background:var(--nappe2);border:1px solid var(--trait);
  transition:background .2s;}
.rs-interrupteur::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:var(--gris);
  transition:transform .2s,background .2s;}
.rs-auto input:checked + .rs-interrupteur{background:var(--rose);border-color:var(--rose);}
.rs-auto input:checked + .rs-interrupteur::after{transform:translateX(20px);background:#fff;}
.rs-auto input:focus-visible + .rs-interrupteur{outline:2px solid var(--ambre);outline-offset:2px;}
.rs-auto b{display:block;font-size:15px;}
.rs-auto em{display:block;margin-top:2px;font-style:normal;font-size:13px;color:var(--gris);}
.rs-derniere,.rs-aide{padding:14px;border-radius:18px;background:var(--nappe);border:1px solid var(--trait);}
.rs-derniere h3,.rs-aide h3{margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ambre);}
.rs-derniere p,.rs-aide p{margin:4px 0 0;font-size:14px;line-height:1.4;}
.rs-texte{color:var(--gris);}
.rs-ok{color:#B9F3C6;font-weight:700;}
.rs-ko{color:#FFB3A8;}
.rs-aide p{color:var(--gris);}
.rs-aide b{color:var(--creme);}
`,
      }}
    />
  );
}
