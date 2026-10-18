"use client";

// 📍 LA VILLE PAS ENCORE OUVERTE — l'échange ne s'ouvre qu'à partir de
// 12 commerçants : avant, on voit combien ils sont, leurs visages, et on
// invite un voisin par son WhatsApp.
//
// Ce fichier tenait aussi « le cadeau du voisin » (« 🎁 Pour mes clients »),
// retiré : « trop compliqué à expliquer et à faire faire ». Restent ici la
// ville fermée, le message d'invitation, et quelques styles que d'autres
// panneaux réutilisent (les onglets des factures, le bouton WhatsApp de
// l'équipe, les puces désactivées).

/* ═══ LA VILLE PAS ENCORE OUVERTE ═════════════════════════════════════════ */
export function VilleFermee({
  nom,
  offres,
  seuil,
  visages,
  onInviter,
  demo,
}: {
  nom: string;
  offres: number;
  seuil: number;
  visages: string[];
  onInviter: () => void;
  /** La démonstration de son métier, ouverte sur l'échange : de quoi l'essayer en attendant. */
  demo?: string;
}) {
  const manque = Math.max(0, seuil - offres);
  return (
    <div className="ec-ville-fermee">
      <span className="ec-champ-t">📍 {nom || "Ta ville"}</span>
      <b>
        {offres} commerçant{offres > 1 ? "s" : ""} sur {seuil}
      </b>
      <div className="ec-jauge" aria-hidden="true">
        <i style={{ width: `${Math.min(100, (offres / Math.max(1, seuil)) * 100)}%` }} />
      </div>
      {visages.length > 0 && (
        <div className="ec-visages" aria-hidden="true">
          {visages.slice(0, seuil).map((v, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={k} src={v} alt="" />
          ))}
        </div>
      )}
      <p>
        L’échange s’ouvre dès <b>{seuil} commerçants</b> : il en manque {manque}. Ton offre est prête, elle sera dans la pile des autres dès l’ouverture.
      </p>
      <button type="button" className="cz-go" onClick={onInviter}>
        Inviter un commerçant voisin
      </button>
      {demo && (
        <a className="ec-essayer" href={demo}>
          En attendant, essaie avec les commerçants de la démo →
        </a>
      )}
    </div>
  );
}

/** Le message pour inviter un commerçant voisin, par son WhatsApp. */
export function messageInvitation(ville: string, manque: number, adresse: string): string {
  return `Je suis sur ClikMe : entre commerçants${ville ? ` de ${ville}` : ""}, on s’échange nos produits sans sortir d’argent. Il manque ${manque} commerçant${manque > 1 ? "s" : ""} pour ouvrir. Tu en es ? ${adresse}`;
}

export function StylesVille() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
.ec-onglets{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:4px;border-radius:999px;background:var(--nappe);border:1px solid var(--trait);}
.ec-onglets button{position:relative;height:40px;border:0;border-radius:999px;background:none;color:var(--gris);font-weight:800;font-size:14px;
  transition:background .25s,color .25s;white-space:nowrap;}
.ec-onglets button.on{background:var(--rose);color:#fff;}
.ec-onglets button i{display:inline-grid;place-items:center;min-width:20px;height:20px;margin-left:6px;padding:0 5px;border-radius:999px;
  background:var(--ambre);color:#2A1608;font-style:normal;font-size:11.5px;font-weight:900;vertical-align:1px;}
.ec-champ-t{display:block;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:var(--ambre);}
.ec-puces button:disabled{opacity:.4;}
.ec-wa{display:grid;place-items:center;text-decoration:none;}
.ec-ville-fermee{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 14px;border-radius:22px;text-align:center;
  background:linear-gradient(160deg,rgba(245,162,58,.16),rgba(255,46,154,.06));border:1px solid rgba(245,162,58,.45);}
.ec-ville-fermee > b{font-family:var(--font-clikme),sans-serif;font-size:28px;font-weight:900;color:var(--ambre);}
.ec-ville-fermee p{margin:0;font-size:14.5px;line-height:1.45;color:var(--gris);}
.ec-ville-fermee p b{color:var(--creme);}
.ec-essayer{font-weight:800;font-size:14px;color:var(--ambre);text-decoration:underline;text-underline-offset:3px;}
.ec-jauge{width:100%;height:10px;border-radius:99px;background:var(--nappe2);overflow:hidden;}
.ec-jauge i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--ambre),var(--rose));transition:width .6s;}
.ec-visages{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;}
.ec-visages img{width:40px;height:40px;border-radius:50%;object-fit:cover;background:var(--nappe2);border:2px solid var(--creme);}
`,
      }}
    />
  );
}
