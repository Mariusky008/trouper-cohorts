"use client";

/**
 * 📬 « TON MESSAGE DU MOIS » — au comptoir, pour sa liste de diffusion WhatsApp.
 *
 * Une carte sur l'accueil tant que le message du mois n'est pas parti ; une fois
 * parti, une ligne fine qui dit combien de ses amis sont venus par son lien. Un
 * appui ouvre la feuille : le message prêt (il le change s'il veut), « L'envoyer
 * avec WhatsApp », « Copier », et le petit guide pour créer sa liste. Rien ne
 * part par ClikMe. Voir `lib/direct/message-du-mois.ts`.
 *
 * « DÉJÀ ENVOYÉ CE MOIS-CI » est gardé dans CE téléphone (le mois, rien d'autre) :
 * au pire, la carte revient sur un autre téléphone.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { CommerceComptoir } from "@/lib/direct/comptoir-ville";
import { duMois, lienDuMessage, messageDuMois, moisDe, type Nouveaute } from "@/lib/direct/message-du-mois";

type Lu = { nouveautes: Nouveaute[]; clics: number; mesure: boolean };
type Etat = "a-faire" | "envoye" | "passe";

const cle = (c: CommerceComptoir) => `clikme:message-du-mois:${c.id}`;

/* « DÉJÀ ENVOYÉ CE MOIS-CI », lu comme un fait d'environnement (`useSyncExternalStore`) :
   le premier rendu du navigateur est celui du serveur (rien), puis la carte paraît. */
const auditeurs = new Set<() => void>();
const abonner = (f: () => void) => {
  auditeurs.add(f);
  return () => {
    auditeurs.delete(f);
  };
};
/** « 2026-10|2026-10:envoye » : le mois de Paris, et ce que ce téléphone en a retenu. */
function instantane(c: CommerceComptoir): string {
  let v = "";
  try {
    v = window.localStorage.getItem(cle(c)) ?? "";
  } catch {
    /* stockage indisponible : la carte reste */
  }
  return `${moisDe(Date.now())}|${v}`;
}
function ecrireEtat(c: CommerceComptoir, mois: string, e: Etat) {
  try {
    if (e === "a-faire") window.localStorage.removeItem(cle(c));
    else window.localStorage.setItem(cle(c), `${mois}:${e}`);
  } catch {
    /* stockage indisponible */
  }
  for (const f of auditeurs) f();
}

export function CarteMessageDuMois({ commerce, nouveautesIci }: { commerce: CommerceComptoir; nouveautesIci: Nouveaute[] }) {
  const brut = useSyncExternalStore(abonner, () => instantane(commerce), () => "");
  const [lu, setLu] = useState<Lu | null>(null);
  const [ouverte, setOuverte] = useState(false);

  useEffect(() => {
    const reel = commerce.reel;
    if (!reel) return;
    let fini = false;
    void fetch("/api/site-internet/pro/diffusion", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: reel.slug, token: reel.token }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: (Lu & { ok?: boolean }) | null) => {
        if (!fini && j?.ok) setLu({ nouveautes: j.nouveautes ?? [], clics: Number(j.clics) || 0, mesure: Boolean(j.mesure) });
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [commerce.reel]);

  if (!brut) return null;
  const [mois, retenu] = brut.split("|");
  const etat: Etat = retenu === `${mois}:envoye` ? "envoye" : retenu === `${mois}:passe` ? "passe" : "a-faire";
  if (etat === "passe") return null;
  // LE MILIEU DU MOIS : de quoi le nommer, sans relire l'horloge.
  const maintenant = Date.parse(`${mois}-15T12:00:00Z`);
  const changer = (e: Etat) => ecrireEtat(commerce, mois, e);
  const nouveautes = lu?.nouveautes.length ? lu.nouveautes : nouveautesIci;
  const clics = commerce.reel && lu?.mesure ? lu.clics : null;

  return (
    <>
      {etat === "a-faire" ? (
        <div className="md-carte">
          <button type="button" className="md-ouvrir" onClick={() => setOuverte(true)}>
            <span className="md-icone" aria-hidden="true">
              📬
            </span>
            <span>
              <b>Ton message {duMois(maintenant)} est prêt</b>
              <em>Pour tes amis d’ici, sur ta liste de diffusion WhatsApp.</em>
            </span>
            <s aria-hidden="true">→</s>
          </button>
          <button type="button" className="md-passer" aria-label="Pas ce mois-ci" onClick={() => changer("passe")}>
            ✕
          </button>
        </div>
      ) : (
        <button type="button" className="md-ligne" onClick={() => setOuverte(true)}>
          📬 Message {duMois(maintenant)} envoyé
          {clics !== null ? ` · ${clics} ${clics > 1 ? "visites" : "visite"} par ton lien` : ""}
        </button>
      )}
      {ouverte && (
        <FeuilleMessage
          commerce={commerce}
          maintenant={maintenant}
          nouveautes={nouveautes}
          clics={clics}
          envoye={etat === "envoye"}
          onEnvoye={() => changer("envoye")}
          onFermer={() => setOuverte(false)}
        />
      )}
      <style>{STYLES}</style>
    </>
  );
}

function FeuilleMessage({
  commerce,
  maintenant,
  nouveautes,
  clics,
  envoye,
  onEnvoye,
  onFermer,
}: {
  commerce: CommerceComptoir;
  maintenant: number;
  nouveautes: Nouveaute[];
  clics: number | null;
  envoye: boolean;
  onEnvoye: () => void;
  onFermer: () => void;
}) {
  const origine = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const lien = commerce.reel ? lienDuMessage(origine, commerce.reel.slug) : `${origine}${commerce.ville ?? "/autour-de-moi"}`;
  const propose = useMemo(
    () => messageDuMois({ commerce: commerce.nom, famille: commerce.famille, prenom: commerce.prenom, maintenant, nouveautes, lien }),
    [commerce, maintenant, nouveautes, lien],
  );
  const [texte, setTexte] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [guide, setGuide] = useState(false);
  const message = texte ?? propose;

  const envoyer = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    onEnvoye();
  };
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2200);
    } catch {
      /* presse-papiers refusé : le texte reste sélectionnable */
    }
  };

  return (
    <div className="md-voile" role="dialog" aria-modal="true" aria-label="Ton message du mois" onClick={onFermer}>
      <div className="md-feuille" onClick={(e) => e.stopPropagation()}>
        <div className="md-tete">
          <b>📬 Ton message du mois</b>
          <button type="button" aria-label="Fermer" onClick={onFermer}>
            ✕
          </button>
        </div>
        <p className="md-note">
          Pour tes amis d’ici, une fois par mois. Relis-le, change ce que tu veux, et envoie-le à ta liste de diffusion.
        </p>
        <textarea className="md-texte" value={message} rows={11} onChange={(e) => setTexte(e.target.value)} aria-label="Le message" />
        <button type="button" className="cz-go md-envoyer" onClick={envoyer}>
          📲 L’envoyer avec WhatsApp
        </button>
        <div className="md-actions">
          <button type="button" className="cz-lien" onClick={() => void copier()}>
            {copie ? "Copié ✓" : "Copier le message"}
          </button>
          {texte !== null && (
            <button type="button" className="cz-lien" onClick={() => setTexte(null)}>
              Revenir au message proposé
            </button>
          )}
        </div>
        <p className="md-petit">Dans WhatsApp, choisis ta liste de diffusion. Si elle n’apparaît pas, copie le message et colle-le dans ta liste.</p>
        {envoye && (
          <p className="md-envoye" role="status">
            Envoyé ce mois-ci ✓{clics !== null ? ` · ${clics} ${clics > 1 ? "visites" : "visite"} de ta page par ce lien` : ""}
          </p>
        )}

        <button type="button" className="md-guide-titre" aria-expanded={guide} onClick={() => setGuide((g) => !g)}>
          {guide ? "▾" : "▸"} Pas encore de liste de diffusion ? En une minute
        </button>
        {guide && (
          <ol className="md-guide">
            <li>
              Dans WhatsApp : <b>⋮ › Nouvelle diffusion</b> sur Android, ou <b>Discussions › Listes › Nouvelle liste</b> sur iPhone.
            </li>
            <li>Ajoute tes amis d’ici, ceux qui aiment ce que tu fais (256 au plus).</li>
            <li>
              <b>Important :</b> ils ne reçoivent ton message que s’ils ont <b>ton numéro dans leurs contacts</b>. Écris d’abord à ceux qui ne
              l’ont pas : « Enregistre mon numéro, je t’envoie mes nouveautés une fois par mois. »
            </li>
            <li>Une fois par mois, pas plus : c’est ce qui garde ta liste vivante.</li>
          </ol>
        )}
      </div>
    </div>
  );
}

const STYLES = `
.md-carte{position:relative;display:flex;align-items:stretch;border-radius:20px;background:linear-gradient(135deg,rgba(37,211,102,.16),rgba(37,211,102,.05));
  border:1px solid rgba(37,211,102,.38);}
.md-ouvrir{flex:1;min-width:0;display:flex;align-items:center;gap:12px;padding:13px 4px 13px 14px;border:0;background:none;color:var(--creme,#FFF4E6);text-align:left;}
.md-icone{flex:none;display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:rgba(37,211,102,.18);font-size:22px;}
.md-ouvrir span:not(.md-icone){display:flex;flex-direction:column;gap:2px;min-width:0;}
.md-ouvrir b{font-family:var(--font-clikme),sans-serif;font-size:15.5px;font-weight:800;line-height:1.2;}
.md-ouvrir em{font-style:normal;font-size:12.5px;line-height:1.35;color:#BFE8CD;}
.md-ouvrir s{flex:none;text-decoration:none;font-size:20px;color:#7CF0A2;}
.md-passer{flex:none;width:40px;border:0;background:none;color:var(--gris,#CDB8A4);font-size:14px;}
.md-ligne{align-self:center;border:1px solid rgba(37,211,102,.32);border-radius:999px;padding:8px 14px;background:rgba(37,211,102,.07);color:#BFE8CD;font-size:13px;font-weight:700;}
.md-voile{position:fixed;inset:0;z-index:80;background:rgba(8,5,4,.72);display:flex;align-items:flex-end;justify-content:center;}
.md-feuille{width:100%;max-width:460px;max-height:90vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:16px 16px calc(18px + env(safe-area-inset-bottom));
  border-radius:22px 22px 0 0;background:var(--nappe,#1C1411);color:var(--creme,#FFF4E6);box-shadow:0 -20px 50px rgba(0,0,0,.45);}
.md-tete{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.md-tete b{font-family:var(--font-clikme),sans-serif;font-size:17px;font-weight:800;}
.md-tete button{width:34px;height:34px;border-radius:50%;border:1px solid var(--trait,rgba(255,196,140,.14));background:none;color:var(--gris,#CDB8A4);}
.md-note,.md-petit{margin:0;font-size:13px;line-height:1.45;color:var(--gris,#CDB8A4);}
.md-petit{font-size:12.5px;}
.md-texte{width:100%;padding:12px 14px;border-radius:14px;border:1px solid var(--trait,rgba(255,196,140,.14));background:var(--fond,#120C09);color:var(--creme,#FFF4E6);
  font:inherit;font-size:14.5px;line-height:1.45;resize:vertical;}
.md-envoyer{width:100%;background:#25D366 !important;color:#06260F !important;}
.md-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:2px 12px;}
.md-envoye{margin:0;padding:9px 12px;border-radius:12px;background:rgba(37,211,102,.1);color:#BFE8CD;font-size:13px;font-weight:700;text-align:center;}
.md-guide-titre{align-self:flex-start;border:0;background:none;padding:6px 0;color:#FFD9A8;font-weight:800;font-size:14px;text-align:left;}
.md-guide{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:7px;font-size:13.5px;line-height:1.45;color:var(--creme,#FFF4E6);}
.md-guide b{color:#FFD9A8;}
`;
