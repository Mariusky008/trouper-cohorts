"use client";

// Espace Pro — « 🎁 Mon cadeau offert ». Ce que le commerçant offre d'habitude,
// dit avec les mots de son métier : combien, quoi, combien de temps le code
// vaut, et — pour la mode et la déco — à qui. Voir `lib/site-internet/cadeau-offert.ts`.
import { useEffect, useState } from "react";
import { combienDe, dureeLisible, reglagesParDefaut, type ProfilCadeau, type ReglagesCadeau } from "@/lib/site-internet/cadeau-offert";

export function ProCadeau({ slug, token, branche, profil }: { slug: string; token: string; branche: string; profil: ProfilCadeau }) {
  const [r, setR] = useState<ReglagesCadeau>(() => reglagesParDefaut(branche));
  const [occupe, setOccupe] = useState(false);
  const [mot, setMot] = useState("");

  useEffect(() => {
    let fini = false;
    void fetch("/api/site-internet/cadeau-offert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, token, action: "lire" }),
    })
      .then((x) => (x.ok ? x.json() : null))
      .then((j) => {
        if (!fini && j?.reglages) setR(j.reglages as ReglagesCadeau);
      })
      .catch(() => undefined);
    return () => {
      fini = true;
    };
  }, [slug, token]);

  const changer = (p: Partial<ReglagesCadeau>) => {
    setR((v) => ({ ...v, ...p }));
    setMot("");
  };
  const enregistrer = async () => {
    setOccupe(true);
    try {
      const x = await fetch("/api/site-internet/cadeau-offert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, token, action: "poser", ...r }),
      });
      const j = (await x.json().catch(() => ({}))) as { reglages?: ReglagesCadeau; error?: string };
      if (x.ok && j.reglages) setR(j.reglages);
      setMot(x.ok ? "✓ Enregistré" : j.error || "Enregistrement impossible.");
    } catch {
      setMot("Enregistrement impossible.");
    } finally {
      setOccupe(false);
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .pro .cadeau .a-title{font-family:var(--fd),Georgia,serif;font-weight:700;font-size:19px;}
          .pro .cadeau .a-sub{font-size:13px;color:var(--soft);margin-top:4px;line-height:1.45;}
          .pro .cadeau .interrupteur{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;margin-top:14px;padding:12px 14px;
            border-radius:12px;border:1px solid var(--hair);background:#F6F5F0;font:inherit;font-size:14px;font-weight:700;text-align:left;cursor:pointer;color:inherit;}
          .pro .cadeau .interrupteur i{flex:none;position:relative;width:44px;height:26px;border-radius:999px;background:#CFCAC0;transition:background .2s;}
          .pro .cadeau .interrupteur i::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s;}
          .pro .cadeau .interrupteur i.on{background:#2F8F5B;}
          .pro .cadeau .interrupteur i.on::after{transform:translateX(18px);}
          .pro .cadeau .ligne{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;font-size:13px;font-weight:600;}
          .pro .cadeau .pas{display:flex;align-items:center;gap:12px;}
          .pro .cadeau .pas button,.pro .cadeau .choix button{min-width:40px;height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--hair);background:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer;}
          .pro .cadeau .pas button:disabled{opacity:.4;cursor:default;}
          .pro .cadeau .pas b{min-width:18px;text-align:center;font-size:18px;}
          .pro .cadeau .choix{display:flex;gap:6px;}
          .pro .cadeau .choix button.on{background:#1F1B16;color:#fff;border-color:#1F1B16;}
          .pro .cadeau label.champ{display:flex;flex-direction:column;gap:4px;margin-top:14px;font-size:13px;font-weight:600;}
          .pro .cadeau label.champ input{height:40px;padding:0 12px;border-radius:10px;border:1px solid var(--hair);font:inherit;font-size:14px;font-weight:400;}
          .pro .cadeau ul{margin:14px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.4;}
          .pro .cadeau .loi{margin-top:12px;padding:10px 12px;border-radius:10px;border:1px dashed #C9A45C;background:#FBF6EA;font-size:12px;line-height:1.45;color:#5E4B2B;}
          .pro .cadeau .bas{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;}
          .pro .cadeau .bas button{height:42px;padding:0 18px;border-radius:999px;border:0;background:#1F1B16;color:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer;}
          .pro .cadeau .bas button:disabled{opacity:.5;}
          .pro .cadeau .bas span{font-size:12.5px;color:var(--soft);}
          .pro .cadeau .demo{display:inline-block;margin-top:12px;font-size:13px;font-weight:700;color:#B5541B;}
          .pro .cadeau .canaux{display:flex;flex-direction:column;gap:8px;margin-top:14px;font-size:13px;}
          .pro .cadeau .canaux>span{font-weight:600;}
          .pro .cadeau .canaux label{display:flex;align-items:flex-start;gap:8px;line-height:1.35;cursor:pointer;}
          .pro .cadeau .canaux input{margin-top:2px;width:16px;height:16px;accent-color:#1F1B16;}
          .pro .cadeau .note{margin-top:8px;font-size:12px;color:var(--faint);line-height:1.45;}
          `,
        }}
      />
      <div className="cadeau">
        <div className="a-title">🎁 Mon cadeau offert</div>
        <div className="a-sub">
          {profil.alcool
            ? "Ce soir c’est calme ? Depuis le salon de votre soirée — ou un salon ouvert sur votre lieu — offrez quelques consos, tirées au sort parmi ceux qui comptent venir."
            : `Quand on parle de vous dans un salon d’Ensemble, public ou privé, offrez-y quelques ${profil.plusieurs}, tirés au sort parmi ses membres.`}{" "}
          Les gagnants reçoivent un code ; vous le validez d’un appui {profil.sur}, et vous voyez combien sont vraiment venus grâce à ça.
        </div>
        <button type="button" className="interrupteur" role="switch" aria-checked={r.actif} onClick={() => changer({ actif: !r.actif })}>
          <span>Je veux pouvoir offrir des {profil.plusieurs.replace(/ offert(e)?s$/, "")}</span>
          <i className={r.actif ? "on" : ""} aria-hidden="true" />
        </button>
        {r.actif && (
          <>
            <div className="ligne">
              <span>Combien, d’habitude</span>
              <span className="pas">
                <button type="button" aria-label="Une de moins" disabled={r.nombre <= 1} onClick={() => changer({ nombre: r.nombre - 1 })}>
                  −
                </button>
                <b>{r.nombre}</b>
                <button type="button" aria-label="Une de plus" disabled={r.nombre >= 5} onClick={() => changer({ nombre: r.nombre + 1 })}>
                  +
                </button>
              </span>
            </div>
            <label className="champ">
              Ce qui est offert
              <input value={r.quoi} onChange={(e) => changer({ quoi: e.target.value })} maxLength={80} />
            </label>
            <div className="ligne">
              <span>Code valable</span>
              <span className="choix">
                {profil.durees.map((d) => (
                  <button key={d} type="button" className={r.duree === d ? "on" : ""} aria-pressed={r.duree === d} onClick={() => changer({ duree: d })}>
                    {dureeLisible(d)}
                  </button>
                ))}
              </span>
            </div>
            {/* LA MODE ET LA DÉCO ONT DEUX PORTES, AU CHOIX DU COMMERÇANT : les
                salons où l'on parle de lui, et ceux qui ont gardé une pièce. */}
            {profil.favoris && (
              <div className="canaux">
                <span>À qui l’envoyer</span>
                {(
                  [
                    ["salons", "Dans les salons où l’on parle de ma boutique"],
                    ["favoris", "À ceux qui ont gardé une de mes pièces en favori"],
                  ] as const
                ).map(([k, mot]) => (
                  <label key={k}>
                    <input
                      type="checkbox"
                      checked={r.canaux[k]}
                      onChange={(e) => {
                        const canaux = { ...r.canaux, [k]: e.target.checked };
                        if (canaux.salons || canaux.favoris) changer({ canaux });
                      }}
                    />
                    {mot}
                  </label>
                ))}
              </div>
            )}
            <ul>
              <li>🎟️ Tirage au sort {profil.alcool ? "parmi ceux qui comptent venir" : "parmi les membres du salon"} — pas au plus rapide.</li>
              <li>☝️ Une chance par personne.</li>
              <li>✅ Le gagnant montre son code ; vous le validez d’un appui.</li>
              <li>
                Par exemple : « {combienDe(profil, r.nombre)} — {r.quoi} ».
              </li>
            </ul>
            {profil.alcool && (
              <div className="loi">
                L’alcool offert est encadré : pas d’« à volonté » ni d’« open bar », et la publicité pour l’alcool est limitée par la loi Évin.
                Proposez « une boisson au choix, avec ou sans alcool », et faites vérifier votre offre avant de la lancer.
              </div>
            )}
          </>
        )}
        <div className="bas">
          <button type="button" disabled={occupe} onClick={() => void enregistrer()}>
            {occupe ? "Enregistrement…" : "Enregistrer"}
          </button>
          {mot && <span>{mot}</span>}
        </div>
        <a className="demo" href={profil.alcool ? "/autour-de-moi?carte=bar-terrasse" : "/autour-de-moi"} target="_blank" rel="noreferrer">
          Voir comment ça marche, dans la démonstration →
        </a>
        <div className="note">
          {profil.alcool
            ? "Dans la démonstration : ouvrez « Découvrir cette soirée », puis « Démo · côté bar »."
            : "Dans la démonstration : ouvrez un salon d’Ensemble où l’on parle d’un commerce, puis « Démo · côté commerçant »."}{" "}
          Le lancement en direct depuis vos salons arrive avec les salons partagés des vrais commerces ; vos réglages sont gardés d’ici là.
        </div>
      </div>
    </>
  );
}
