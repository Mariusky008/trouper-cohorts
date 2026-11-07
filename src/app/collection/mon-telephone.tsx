"use client";

/**
 * 📲 CLIKME SUR SON TÉLÉPHONE, ET 🔔 LE MÈME DU JOUR À 11 H 30 (le lot 3, 7 novembre 2026) — l'écran. La logique :
 * `lib/direct/appli-collection.ts` (le téléphone) et `appli-collection-serveur.ts` (le serveur).
 *
 *   · `FeuilleInstaller` — « Comment la mettre sur ton écran d'accueil », selon son téléphone (iPhone : Partager, puis
 *     « Sur l'écran d'accueil » ; Android : ⋮, « Installer l'appli » ; Instagram & co : ouvrir dans le vrai navigateur).
 *   · `InviterAppli` — demandée AU BON MOMENT, une fois : juste après sa réponse au mème du jour, ou à la première
 *     ouverture de l'appli posée sur l'iPhone. « Plus tard » est retenu une semaine.
 *   · `MonTelephone` — dans « Moi », pour toujours : installée ou pas, et le mème du jour à 11 h 30, qu'il coupe ou
 *     rallume d'un toucher.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  abonnerAppli,
  allumerNotif,
  couperNotif,
  direPlusTard,
  instantane,
  lireInstantane,
  ouvrirInstallation,
  preparerInstallation,
  verifierNotif,
  type EtatNotif,
} from "@/lib/direct/appli-collection";

const useAppli = () => lireInstantane(useSyncExternalStore(abonnerAppli, instantane, () => "serveur"));

/** L'icône « Partager » de Safari (un carré, une flèche vers le haut) : on la reconnaît d'un coup d'œil. */
function IconePartager() {
  return (
    <svg className="ct-ico" viewBox="0 0 24 24" width="18" height="18" aria-label="Partager" role="img">
      <path d="M12 3.5v11M8 7.5l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 10.5H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 📲 LA FEUILLE « COMMENT L'INSTALLER » — ouverte par « Installer » (et, sur iPhone, après le rechargement `#installer`). */
export function FeuilleInstaller() {
  const i = useAppli();
  const [copie, setCopie] = useState(false);
  if (!i.feuille) return null;
  const fermer = () => {
    ouvrirInstallation(false);
    if (window.location.hash === "#installer") window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#figurine`);
  };
  const copier = () => {
    void navigator.clipboard
      ?.writeText(`${window.location.origin}/collection`)
      .then(() => setCopie(true))
      .catch(() => undefined);
  };
  return (
    <div className="ct-fond" role="presentation" onClick={fermer}>
      <section className="ct-feuille" role="dialog" aria-modal="true" aria-label="Installer ClikMe" onClick={(e) => e.stopPropagation()}>
        <i className="ct-poignee" aria-hidden="true" />
        {i.installee ? (
          <>
            <h2>✓ ClikMe est sur ton écran d’accueil</h2>
            <p>Tu l’as ouverte depuis son icône : c’est bon, il n’y a plus rien à faire.</p>
          </>
        ) : i.plateforme === "iphone" ? (
          <>
            <h2>📲 ClikMe sur ton écran d’accueil</h2>
            <p>Trois gestes, et ta figurine est à un toucher.</p>
            <ol className="ct-gestes">
              <li>
                Touche <b>Partager</b> <IconePartager /> dans la barre de Safari (si tu ne le vois pas, touche d’abord <b>···</b>).
              </li>
              <li>
                Choisis <b>« Sur l’écran d’accueil »</b> : fais défiler la liste si tu ne le vois pas.
              </li>
              <li>
                Touche <b>Ajouter</b>, puis ouvre <b>ClikMe</b> depuis ton écran d’accueil : ta figurine t’y attend.
              </li>
            </ol>
            <small className="ct-note">Si ton iPhone propose de l’ouvrir comme une app web, laisse l’option activée.</small>
          </>
        ) : i.plateforme === "dans-une-appli" ? (
          <>
            <h2>Ouvre ClikMe dans ton navigateur</h2>
            <p>Ici, dans l’appli où tu as touché le lien, rien ne s’installe.</p>
            <ol className="ct-gestes">
              <li>
                Touche <b>···</b>, en haut ou en bas de l’écran.
              </li>
              <li>
                Choisis <b>« Ouvrir dans le navigateur »</b> (Safari ou Chrome).
              </li>
              <li>
                Là, touche <b>📲 Installer</b>, dans « Moi ».
              </li>
            </ol>
            <button type="button" className="ct-secondaire" onClick={copier}>
              {copie ? "✓ Lien copié" : "Copier le lien de ClikMe"}
            </button>
          </>
        ) : i.plateforme === "android" ? (
          <>
            <h2>📲 ClikMe sur ton écran d’accueil</h2>
            <ol className="ct-gestes">
              <li>
                Touche <b>⋮</b>, en haut à droite de Chrome.
              </li>
              <li>
                Choisis <b>« Installer l’appli »</b> (ou « Ajouter à l’écran d’accueil »).
              </li>
              <li>
                Ouvre <b>ClikMe</b> depuis ton écran d’accueil.
              </li>
            </ol>
          </>
        ) : (
          <>
            <h2>📲 ClikMe dans ta poche</h2>
            <p>Sur ordinateur, ClikMe s’ouvre dans ton navigateur : rien à installer. Pour l’avoir sur ton téléphone, ouvre clikme.fr/collection dessus, puis « Moi », « Installer ».</p>
          </>
        )}
        <button type="button" className="ct-principal" onClick={fermer}>
          J’ai compris
        </button>
      </section>
    </div>
  );
}

/** Ce qu'un refus ou une erreur laisse à l'écran. */
function texteRefus(e: EtatNotif) {
  return e === "refusee" ? "Ton téléphone refuse les notifications de ClikMe : tu peux les réactiver dans ses réglages." : "";
}

/**
 * 🔔📲 L'INVITATION, AU BON MOMENT. `apres` : « jour » (en haut de « Créer », une fois sa réponse du jour postée, ou à la
 * première ouverture de l'appli posée), « postee » (juste après avoir posté sa réponse). Une seule chose à la fois :
 * l'appli sur iPhone d'abord (sans elle, pas de notification), sinon la notification.
 */
export function InviterAppli({ apres, repondu = true }: { apres: "jour" | "postee"; repondu?: boolean }) {
  const i = useAppli();
  const [fait, setFait] = useState("");
  const [occupe, setOccupe] = useState(false);
  if (i.serveur) return null;
  if (fait)
    return (
      <p className="ct-fait" role="status">
        {fait}
      </p>
    );
  if (i.plusTard || !(repondu || i.installee)) return null;
  const demander = i.notif === "a-demander";
  const installer = !i.installee && (i.notif === "a-installer" || (i.plateforme === "android" && i.proposable && !demander));
  if (!installer && !demander) return null;
  const allumer = async () => {
    setOccupe(true);
    const r = await allumerNotif();
    setOccupe(false);
    setFait(r.etat === "allumee" ? "✓ C’est réglé : le mème du jour arrivera vers 11 h 30." : r.erreur || texteRefus(r.etat) || "");
  };
  return (
    <aside className="ct-invite" aria-label={installer ? "Installer ClikMe" : "Le mème du jour à 11 h 30"}>
      {installer ? (
        <>
          <b>📲 Mets ClikMe sur ton écran d’accueil</b>
          <span>Ta figurine à un toucher, et le mème du jour qui t’attend chaque jour vers 11 h 30.</span>
          <span className="ct-boutons">
            <button type="button" className="ct-principal" onClick={() => void preparerInstallation()}>
              📲 Installer ClikMe
            </button>
            <button type="button" className="ct-plus-tard" onClick={direPlusTard}>
              Plus tard
            </button>
          </span>
        </>
      ) : (
        <>
          <b>{i.installee && apres === "jour" && !repondu ? "🔔 Dernière étape : le mème du jour" : "🔔 Demain, un nouveau thème"}</b>
          <span>Je te préviens chaque jour vers 11 h 30 ? (Jamais si tu as déjà répondu.)</span>
          <span className="ct-boutons">
            <button type="button" className="ct-principal" disabled={occupe} onClick={() => void allumer()}>
              🔔 Oui, préviens-moi
            </button>
            <button type="button" className="ct-plus-tard" onClick={direPlusTard}>
              Plus tard
            </button>
          </span>
        </>
      )}
    </aside>
  );
}

/** 📱 DANS « MOI », POUR TOUJOURS : l'appli sur son écran d'accueil, et le mème du jour à 11 h 30 (il le coupe ici). */
export function MonTelephone() {
  const i = useAppli();
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  useEffect(() => {
    void verifierNotif();
  }, []);
  if (i.serveur) return null;
  const allumee = i.notif === "allumee";
  const basculer = async () => {
    setOccupe(true);
    setErreur("");
    if (allumee) await couperNotif();
    else {
      const r = await allumerNotif();
      setErreur(r.erreur || "");
    }
    setOccupe(false);
  };
  const etatTexte: Record<EtatNotif, string> = {
    allumee: "Activé sur ce téléphone. Jamais si tu as déjà répondu.",
    coupee: "Coupé. Tu peux le rallumer quand tu veux.",
    "a-demander": "Un nouveau thème chaque jour : je te préviens ?",
    "a-installer": i.plateforme === "dans-une-appli" ? "Ouvre d’abord ClikMe dans ton navigateur." : "Sur iPhone, il faut d’abord ClikMe sur ton écran d’accueil.",
    refusee: texteRefus("refusee"),
    indisponible: "Ce navigateur ne reçoit pas de notifications.",
  };
  const interrupteur = allumee || i.notif === "a-demander" || i.notif === "coupee";
  return (
    <section className="ct-moi" aria-label="ClikMe sur ton téléphone">
      <h3>📱 ClikMe sur ton téléphone</h3>
      <div className="ct-ligne ct-installee">
        <span className="ct-emoji" aria-hidden="true">
          📲
        </span>
        <span className="ct-quoi">
          <b>Sur ton écran d’accueil</b>
          <small>
            {i.installee ? "C’est fait : ClikMe s’ouvre comme une appli." : i.plateforme === "ordinateur" ? "Sur ordinateur, rien à installer : ouvre clikme.fr/collection sur ton téléphone." : "Ta figurine à un toucher."}
          </small>
        </span>
        {i.installee ? (
          <i className="ct-ok">✓</i>
        ) : i.plateforme !== "ordinateur" ? (
          <button type="button" className="ct-installer" onClick={() => void preparerInstallation()}>
            Installer
          </button>
        ) : null}
      </div>
      <div className="ct-ligne ct-notif">
        <span className="ct-emoji" aria-hidden="true">
          🔔
        </span>
        <span className="ct-quoi">
          <b>Le mème du jour, vers 11 h 30</b>
          <small>{erreur || etatTexte[i.notif]}</small>
        </span>
        {interrupteur ? (
          <button type="button" role="switch" aria-checked={allumee} aria-label="Le mème du jour à 11 h 30" className={`ct-interrupteur${allumee ? " pris" : ""}`} disabled={occupe} onClick={() => void basculer()}>
            <i />
          </button>
        ) : i.notif === "a-installer" ? (
          <button type="button" className="ct-installer" onClick={() => void preparerInstallation()}>
            Installer
          </button>
        ) : null}
      </div>
    </section>
  );
}

export const STYLES_MON_TELEPHONE = `
.ct-invite{display:flex;flex-direction:column;gap:6px;margin-top:4px;padding:14px;border-radius:20px;background:rgba(127,240,196,.08);border:1.5px solid rgba(127,240,196,.45)}
.ct-invite b{font-size:15.5px;font-weight:900;line-height:1.25}
.ct-invite>span{font-size:13.5px;color:#E8D3DC}
.ct-boutons{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:4px}
.ct-principal{padding:12px 18px;border:0;border-radius:999px;background:linear-gradient(135deg,#FF7A59,#FF2E9A);color:#fff;font:inherit;font-size:15px;font-weight:900;cursor:pointer;box-shadow:0 12px 26px -12px rgba(255,46,154,.95)}
.ct-principal:disabled{opacity:.6;cursor:wait}
.ct-plus-tard{padding:10px 6px;border:0;background:none;color:#C9AFBA;font:inherit;font-size:14px;font-weight:800;cursor:pointer}
.ct-fait{margin:4px 0 0;padding:12px 14px;border-radius:16px;background:rgba(127,240,196,.12);color:#7FF0C4;font-size:14px;font-weight:900}
.ct-fond{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;background:rgba(8,2,6,.66);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);animation:ct-fondu .2s ease-out}
.ct-feuille{position:relative;box-sizing:border-box;width:100%;max-width:520px;max-height:88dvh;overflow:auto;display:flex;flex-direction:column;gap:12px;padding:22px 18px calc(18px + env(safe-area-inset-bottom));border-radius:28px 28px 0 0;
  background:linear-gradient(180deg,#2A0F21,#16070F);color:#FFF4E6;box-shadow:0 -18px 40px -12px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,200,230,.16);animation:ct-monte .3s cubic-bezier(.2,.9,.3,1)}
.ct-poignee{align-self:center;width:42px;height:5px;margin:-8px 0 2px;border-radius:999px;background:rgba(255,255,255,.22)}
.ct-feuille h2{margin:0;font-size:22px;line-height:1.2;font-weight:900}
.ct-feuille p{margin:0;font-size:14.5px;color:#E8D3DC}
.ct-gestes{display:flex;flex-direction:column;gap:10px;margin:2px 0 0;padding:0;list-style:none;counter-reset:geste}
.ct-gestes li{position:relative;padding:12px 12px 12px 48px;border-radius:16px;background:rgba(255,255,255,.06);font-size:14.5px;line-height:1.4;counter-increment:geste}
.ct-gestes li::before{content:counter(geste);position:absolute;left:12px;top:11px;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#FF2E9A;color:#fff;font-size:14px;font-weight:900}
.ct-ico{display:inline-block;vertical-align:-3px;color:#7FB8FF}
.ct-note{font-size:12.5px;color:#C9AFBA}
.ct-secondaire{padding:12px 16px;border-radius:999px;border:1.5px solid rgba(255,255,255,.2);background:none;color:#FFF4E6;font:inherit;font-size:14.5px;font-weight:800;cursor:pointer}
.ct-moi{display:flex;flex-direction:column;gap:10px;margin:22px 0 0;padding:16px;border-radius:24px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)}
.ct-moi h3{margin:0;font-size:16px;font-weight:900}
.ct-ligne{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid rgba(255,255,255,.07)}
.ct-emoji{flex:none;width:36px;height:36px;display:grid;place-items:center;border-radius:12px;background:rgba(255,255,255,.07);font-size:18px}
.ct-quoi{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.ct-quoi b{font-size:14.5px;font-weight:900}
.ct-quoi small{font-size:12.5px;line-height:1.35;color:#C9AFBA}
.ct-ok{flex:none;font-style:normal;font-size:18px;font-weight:900;color:#7FF0C4}
.ct-installer{flex:none;padding:9px 14px;border:0;border-radius:999px;background:#FF2E9A;color:#fff;font:inherit;font-size:13.5px;font-weight:900;cursor:pointer}
.ct-interrupteur{flex:none;position:relative;width:52px;height:30px;padding:0;border:0;border-radius:999px;background:rgba(255,255,255,.18);cursor:pointer;transition:background .2s}
.ct-interrupteur i{position:absolute;left:3px;top:3px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.35);transition:transform .2s cubic-bezier(.2,1.4,.4,1)}
.ct-interrupteur.pris{background:linear-gradient(135deg,#FF7A59,#FF2E9A)}
.ct-interrupteur.pris i{transform:translateX(22px)}
.ct-interrupteur:disabled{opacity:.6;cursor:wait}
@keyframes ct-fondu{from{opacity:0}}
@keyframes ct-monte{from{transform:translateY(40px);opacity:.4}}
`;
